
// THIS FILE CONTAINS ALL FUNCTIONS USED TO CREATE HYDROSHED AND SEASONAL 
//    INUNDATION ZONE MAPS FOR SWIFT ET AL 2026. CODE WAS WRITTEN IN GOOGLE
//    EARTH ENGINE.

var burns = ee.ImageCollection("MODIS/061/MCD64A1");
var wsf = ee.Image("DLR/WSF/WSF2015/v1");
var roads = ee.FeatureCollection("projects/kaza-waterhole-mapping/assets/linear-features/kaza_roads");
var buildings = ee.ImageCollection("GOOGLE/Research/open-buildings-temporal/v1");

// +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
//  ESW CREATION FUNCTIONS
// +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+


// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//  SENTINEL-2 PREPARATION MAIN FUNCTION
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

function s2Prep(d1, d2, aoi, CLOUD_FILTER, CLD_PRB_THRESH) {
  // Massages Sentinel-2 data to remove clouds, shadows, buildings, roads, and burn scars
  var CLD_BUFFER = 50

  // Pull Sentinel-2 data for time period and AOI bounds
  var s2_sr_cld_col = get_s2_sr_cld_col(aoi, d1, d2, CLOUD_FILTER);
  function add_cld_shdw_mask(img) {
    var img_cloud = add_cloud_bands(img, CLD_PRB_THRESH)
    var img_cloud_shadow = add_shadow_bands(img_cloud)
    var is_cld_shdw = img_cloud_shadow.select('clouds').add(img_cloud_shadow.select('shadows')).gt(0)
    is_cld_shdw = (erode(dilate(is_cld_shdw, CLD_BUFFER*2/20), 1).rename('cloudmask'));
    return img_cloud_shadow.addBands(is_cld_shdw);
  }
  // Add AWEI and mask burns, settlements, buildings, roads, clouds, shadows
  var s2_masked = s2_sr_cld_col
    .map(addAWEInsh)
    .map(maskBurns) 
    .map(maskSettlements)
    .map(maskRoads)
    .map(maskBuildings)
    .map(add_cld_shdw_mask)
    .map(function(img) {return img.updateMask(img.select('cloudmask').not())})
  return(s2_masked);
}

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//  MASKING AND ADDING AWEI
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

function maskBurns(img) {
  // Use MODIS burn scarring data to remove burn scars within the last two months.
  // I don't know why, but filterDate() doesn't quite work with this dataset so 
  // I had to create a bit of my own to help out.
  var endDate = img.date();
  var startDate = ee.Date(endDate).advance(-2, 'month');
  // get the year and start of earliest year
  var endY = endDate.get('year');
  var startY = startDate.get('year');
  var Jan01 = ee.Date(ee.String(startY).cat('-01-01'))
  // function to wrap day of year
  var wrapDOY = function(b_img) {
    var year = b_img.date().get('year')
    var bd = b_img.select('BurnDate')
    if (year.gt(Jan01.get('year')) == 1) { bd = bd.add(365) }
    return(bd)
  }
  var burns_filtered = burns
    .filterDate(startDate.advance(-1, 'month'), endDate)
    .filterBounds(img.geometry())
    .select('BurnDate')
    .map(wrapDOY)
    .mosaic()
    
  // Find the start and end DOY for which we should mask
  var startDOY = startDate.difference(Jan01, 'day')
  var endDOY = endDate.difference(Jan01, 'day')
  var burnMask = burns_filtered
    .where(burns_filtered.lte(endDOY).and(burns_filtered.gte(startDOY)), 1)
    .where(burns_filtered.gt(endDOY).or(burns_filtered.lt(startDOY)), 0)
    .unmask()
  var burnMaskFlip = burnMask.where(burnMask.eq(0), 1).where(burnMask.eq(1), 0)
  return(img.updateMask(burnMaskFlip));
}
function maskSettlements (image) {
  var wsf_unmasked = wsf.unmask();
  var wsfMask = wsf_unmasked.where(wsf_unmasked.eq(0), 1).where(wsf_unmasked.neq(0), 0);
  return(image.updateMask(wsfMask));
}
function maskRoads (image) { 
  var roadMask  = ee.Image(1).int().paint(roads,0,2);
  var masked = image.updateMask(roadMask)
  return(masked);
}
function maskBuildings (image) {
  var build_med = buildings.select('building_presence')
    .reduce(ee.Reducer.median())
    .rename('isBuilding');
  var bt = 0.5;
  var buildMask = build_med.where(build_med.lte(bt), 0).where(build_med.gt(bt), 1);
  var buildMaskBuffer = ee.Image(1)
    .cumulativeCost({
      source: buildMask, 
      maxDistance: 10,
    }).lt(10); // keep this for mapping if you want.
  var buildMaskReverseBuffer = ee.Image(1)
    .where(buildMaskBuffer.eq(1), 0).where(buildMaskBuffer.eq(0), 1)
  return(image.updateMask(buildMaskReverseBuffer));
}
function addAWEInsh(img){
  // AWEI_nsh sensu Feyisa et al 2014 https://doi.org/10.1016/j.rse.2013.08.029
  var sharp = img.divide(10000);
  var AWEInsh = sharp.expression(
    '4 * (B3 - B11) - (0.25 * B8 + 2.75 * B12)', {
      'B3': sharp.select('B3'),
      'B8': sharp.select('B8'),
      'B11': sharp.select('B11'),
      'B12': sharp.select('B12')
    }).rename('AWEInsh').select('AWEInsh');
  return img.addBands(AWEInsh);
}

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//  DEALING WITH CLOUDS
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
function get_s2_sr_cld_col (aoi, start_date, end_date, CLOUD_FILTER) {
  // FUNCTIONS FROM S2CLOUDLESS
  // # Import and filter S2 SR.
  var s2_sr_col = ee.ImageCollection('COPERNICUS/S2_SR')
    .filterBounds(aoi)
    .filterDate(start_date, end_date)
    .filter(ee.Filter.lte('CLOUDY_PIXEL_PERCENTAGE', CLOUD_FILTER))
  
  // # Import and filter s2cloudless.
  var s2_cloudless_col = (ee.ImageCollection('COPERNICUS/S2_CLOUD_PROBABILITY')
    .filterBounds(aoi)
    .filterDate(start_date, end_date))
  
  // # Join the filtered s2cloudless collection to the SR collection by the 'system:index' property.
  var joined = ee.ImageCollection(ee.Join.saveFirst('s2cloudless').apply({
    'primary': s2_sr_col,
    'secondary': s2_cloudless_col,
    'condition': ee.Filter.equals({
        'leftField': 'system:index',
        'rightField': 'system:index'
    })
  }))
  return (joined)
}
function add_cloud_bands (img, CLD_PRB_THRESH) {
  var cld_prb = ee.Image(img.get('s2cloudless')).select('probability')
  var is_cloud = cld_prb.gt(CLD_PRB_THRESH).rename('clouds')
  return img.addBands(ee.Image([cld_prb, is_cloud]))
}
function add_shadow_bands (img) {
  var NIR_DRK_THRESH = 0.15
  var CLD_PRJ_DIST = 2
  // # Identify water pixels from the SCL band.
  var not_water = img.select('SCL').neq(6)
  // # Identify dark NIR pixels that are not water (potential cloud shadow pixels).
  var SR_BAND_SCALE = 1e4
  var dark_pixels = img.select('B8').lt(NIR_DRK_THRESH*SR_BAND_SCALE).multiply(not_water).rename('dark_pixels')
  // # Determine the direction to project cloud shadow from clouds (assumes UTM projection).
  var shadow_azimuth = ee.Number(90).subtract(ee.Number(img.get('MEAN_SOLAR_AZIMUTH_ANGLE')));
  // # Project shadows from clouds for the distance specified by the CLD_PRJ_DIST input.
  var cld_proj = (img.select('clouds').directionalDistanceTransform(shadow_azimuth, CLD_PRJ_DIST*10)
      .select('distance')
      .mask()
      .rename('cloud_transform'))
  // # Identify the intersection of dark pixels with cloud shadow projection.
  var shadows = cld_proj.multiply(dark_pixels).rename('shadows')
  // # Add dark pixels, cloud projection, and identified shadows as image bands.
  return img.addBands(ee.Image([dark_pixels, cld_proj, shadows]))
}
function dilate(img, distance) {
  // Function for filling in small gaps in cloud mask
  var d = (img.fastDistanceTransform(30).sqrt()
       .multiply(ee.Image.pixelArea().sqrt()))
  return img.updateMask(d.lt(distance))
}
function erode(img, distance) {
  // Function for getting rid of small cloud patches
  var d = (img.not().unmask(1)
       .fastDistanceTransform(30).sqrt()
       .multiply(ee.Image.pixelArea().sqrt()))
  return d.gt(distance)
}

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//  DTHRESH FUNCTIONS
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Otsu thresholding from Donchyts et al 2016
// https://code.earthengine.google.com/e9c699d7b5ef811d0a67c02756473e9d
function otsu (histogram) {
    histogram = ee.Dictionary(histogram);
    var counts = ee.Array(histogram.get('histogram'));
    var means = ee.Array(histogram.get('bucketMeans'));
    var size = means.length().get([0]);
    var total = counts.reduce(ee.Reducer.sum(), [0]).get([0]);
    var sum = means.multiply(counts).reduce(ee.Reducer.sum(), [0]).get([0]);
    var mean = sum.divide(total);
    var indices = ee.List.sequence(1, size);
    // Compute between sum of squares, where each mean partitions the data.
    var bss = indices.map(function(i) {
        var aCounts = counts.slice(0, 0, i);
        var aCount = aCounts.reduce(ee.Reducer.sum(), [0]).get([0]);
        var aMeans = means.slice(0, 0, i);
        var aMean = aMeans.multiply(aCounts)
            .reduce(ee.Reducer.sum(), [0]).get([0])
            .divide(aCount);
        var bCount = total.subtract(aCount);
        var bMean = sum.subtract(aCount.multiply(aMean)).divide(bCount);
        return aCount.multiply(aMean.subtract(mean).pow(2)).add(
            bCount.multiply(bMean.subtract(mean).pow(2)));
    });
    // Return the mean value corresponding to the maximum BSS.
    return means.sort(bss).get([-1]);
};
function computeThresholdUsingOtsu(image, scale, bounds, debug,
                                    cannyThreshold, cannySigma, minValue, 
                                    minEdgeLength, minEdgeGradient, minEdgeValue) {
    // clip image edges
    var mask = image.mask().gt(0).clip(bounds).focal_min(ee.Number(scale).multiply(3), 'circle', 'meters');
    // detect sharp changes
    var edge = ee.Algorithms.CannyEdgeDetector(image, cannyThreshold, cannySigma);
    edge = edge.multiply(mask);
    // buffer around NDWI edges
    var edgeBuffer = edge.focal_max(ee.Number(scale), 'square', 'meters');
    edge = edge.updateMask(edgeBuffer)
    edgeBuffer = edge.focal_max(ee.Number(scale).multiply(1), 'square', 'meters');
    var imageEdge = image.mask(edgeBuffer);
    // compute threshold using Otsu thresholding
    var buckets = 100;
    // make my job easy -- remove hist values below min, since we know they aren't water
    var edgeMask = imageEdge.where(imageEdge.gt(minValue), 1).where(imageEdge.lte(minValue), 0)
    var imageEdgeSliced = imageEdge.updateMask(edgeMask)
    var hist_reg = imageEdgeSliced.reduceRegion(ee.Reducer.histogram(buckets), bounds, scale);
    var hist = ee.Dictionary(ee.Dictionary(hist_reg.values().get(0)));
    var threshold = ee.Algorithms.If(hist.contains('bucketMeans'), otsu(hist), minValue);
    threshold = ee.Number(threshold)
    if(debug) {
        print('Threshold: ', threshold);
        print('Image values (edge): ', ui.Chart.image.histogram(imageEdge, bounds, scale, buckets));
        print('Image values (above minimum): ', ui.Chart.image.histogram(imageEdgeSliced, bounds, scale, buckets));
    }
    return minValue !== 'undefined' ? threshold.max(minValue) : threshold;
}
function thresholdWaterholes (img, ot) {
  var thresholded = img.select("AWEInsh_median")
    .where(img.lte(ot), 0)
    .where(img.gt(ot), 1)
    .selfMask()
    .rename('isWater');
  return(thresholded)
}
function getOtsuThreshold (img, awei_name, bounds, debug) {
  var CANNY_THRESH = 0.7;
  var CANNY_SIGMA = 1;
  var SCALE = 200;
  var DEBUG = debug || false;
  var MIN_VALUE = min_val;
  var awei_median = img.select(awei_name).rename("AWEI")
  
  // get OT
  var ot = computeThresholdUsingOtsu(awei_median, SCALE, bounds, debug,
                                     CANNY_THRESH, CANNY_SIGMA, MIN_VALUE);
  return(ot);
}
