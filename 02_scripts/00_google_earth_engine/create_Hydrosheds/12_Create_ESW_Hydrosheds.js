// THIS FILE CONTAINS CODE USED TO CREATE HYDROSHED EPHEMERAL SURFACE WATER MAPS FOR 
//    SWIFT ET AL 2026. CODE WAS WRITTEN IN GOOGLE EARTH ENGINE.
// SEE FUNCTIONS.JS FILE FOR A LIST OF ALL COMMON FUNCTIONS USED IN THIS CODE


// +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
//                                      USER INPUT
// +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
// Choose index of hydrosheds to export (0 to 53)
var HINX = 0
var HYBAS_ID = 1051478700
var YEAR = 2019

var doByInx = false;
var doByYear = true;

// Flags for plotting and exporting
var doExportRasters = true;
var doExportOT = false;
var doplot = false;

// HYBAS ID to export
if (doByInx) {
  var HYBAS_ID = hydro
    .filter(ee.Filter.notNull(ee.List(['HYBAS_ID'])))
    .aggregate_array("HYBAS_ID").sort()
    .get(HINX).getInfo()
}

// Params for export
var px_size_rast = 10;
var px_size_ot = 10;
var px_max = 10000000000000;

var bname = "kaza_esw_2026"; // GCS bucket
var base_mwf = "gs://kaza_mwf_rasters/";
var xname_slug = "ESW_" + HYBAS_ID + "_";
var xname_ot = "ESW_OT_LOG_" + HYBAS_ID + "_" + px_size_ot + "m";

// Params for mapping
var aoi = hydro.filter(ee.Filter.eq("HYBAS_ID", HYBAS_ID))
var s2_med_vis = { bands: ["B8_median","B4_median","B3_median"], max: 4200, min: 1340 };
Map.setOptions('SATELLITE');
Map.centerObject(aoi, 16)

// Params for cloud filtering and masking
var CLOUD_FILTER = 30; // filters out cloudy images
var CLOUD_PROB = 20; // masking out individual clouds

// Logging
print("hydroshed export log")
print("ID: " + HYBAS_ID)
print("INDEX: " + HINX)


// +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
// GET MWF BY HYBAS_ID FROM GCS
// +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+

var HYBAS_STR = ee.Number(HYBAS_ID).format();
var hy_uri = ee.String(base_mwf).cat("MWF_").cat(HYBAS_STR).cat(".tif");
var mwf_esw = ee.Image.loadGeoTIFF(hy_uri).regexpRename('isWater', 'recurrence')
var gsw_rec = gsw.select('recurrence').clip(aoi)
var mwf_sum = ee.ImageCollection([mwf_esw, gsw_rec]).sum()
var mwf = mwf_sum.where(mwf_sum.gt(0), 1).selfMask()

// Calculate how many pixels a masked image takes up
function calcPixelCoverage (img, bandName) {
  var npix = img.reduceRegion({
      reducer:ee.Reducer.count(), geometry:aoi, scale:px_size_ot
    }).get(bandName)
  return(npix)
}
var mwfSize = calcPixelCoverage(mwf, 'recurrence')

// logging and mapping
if (doplot) {
  Map.centerObject(aoi, 12)
  Map.addLayer(mwf, {'palette':'black'}, "MWF all")
  Map.addLayer(aoi.style({'color':'red', 'fillColor':'00000000'}))
}
// connected components
var cc = mwf.gt(0).connectedComponents({
  connectedness: ee.Kernel.plus(1),
  maxSize: 1024
});
function getCount(cc) {
  var count = cc.select('labels').reduceRegion({
    reducer: ee.Reducer.countDistinct(),
    geometry: aoi, // Define a region of interest
    scale: 10, // Your desired scale/resolution
    maxPixels: 1e16
  });
  return(count.get('labels'))
}
// print(getCount(cc))

// +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
// GET DATES FOR ID EXPORT
// +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+

// Generate list of dates for a given year
function getDatesFromY (y) {
  var d0 = ee.Date.fromYMD(y-1,11,1);
  var d1 = ee.Date.fromYMD(y,2,1);
  var d2 = ee.Date.fromYMD(y,5,1);
  var d3 = ee.Date.fromYMD(y,7,1);
  var d4 = ee.Date.fromYMD(y,9,1);
  var d5 = ee.Date.fromYMD(y,11,1);
  var feat = ee.Feature(aoi.geometry())
    .set({'YEAR':y, 'HYBAS_ID':HYBAS_ID})
  var fc = ee.FeatureCollection([
    feat.set({'d1':d0,'d2':d1,'NAME':(y + '_NOV_FEB'),'START':'NOV', 'END':'FEB'}),
    feat.set({'d1':d1,'d2':d2,'NAME':(y + '_FEB_MAY'),'START':'FEB', 'END':'MAY'}),
    feat.set({'d1':d2,'d2':d3,'NAME':(y + '_MAY_JUL'),'START':'MAY', 'END':'JUL'}),
    feat.set({'d1':d3,'d2':d4,'NAME':(y + '_JUL_SEP'),'START':'JUL', 'END':'SEP'}),
    feat.set({'d1':d4,'d2':d5,'NAME':(y + '_SEP_NOV'),'START':'SEP', 'END':'NOV'})
  ])
  return(fc)
}

// Get a list of all dates
if (doByYear) {
  var all_dates = getDatesFromY(YEAR)
  print(all_dates)
} else {
  all_dates = getDatesFromY(2019)
    .merge(getDatesFromY(2020))
    .merge(getDatesFromY(2021))
    .merge(getDatesFromY(2022))
    .merge(getDatesFromY(2023))    
    .merge(getDatesFromY(2024))
    .merge(getDatesFromY(2025));
}
var names_list = all_dates.aggregate_array("NAME")


// +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
// EXPORT ALL MAPS FOR ID
// +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+

// Iterate over date list for export and plotting
names_list.evaluate(function (nms) {
  var fc = ee.FeatureCollection(nms.map(function(nm) { 
    return(ee.Feature(exportMaps(nm)))
  }))
  if (doExportOT) {
    Export.table.toDrive({
      collection: fc, 
      folder: "GEEData", 
      fileFormat: 'csv',
      description: xname_ot
    })
  }
});

function exportMaps(nm) {
  
  // Get feature and date elements
  var feat = all_dates.filter(ee.Filter.eq('NAME', nm)).first();
  var d1 = ee.Date(feat.get('d1'));
  var d2 = ee.Date(feat.get('d2'));

  // Create Sentinel-2 collection, median, mask to MWF, clip to AOI
  var s2_coll = s2Prep(d1, d2, aoi, CLOUD_FILTER, CLOUD_PROB);
  var s2_median = s2_coll.select('B.*', 'AWEI.*').reduce('median', 8);
  var s2_mwf_masked = s2_median.updateMask(mwf);
  var s2_clipped = s2_mwf_masked.clip(aoi);
  var s2Size = s2_coll.size();
  print(s2Size)
  // Get Otsu threshold for AWEInsh, create water map, measure coverage
  var ot = getOtsuThreshold (s2_clipped, "AWEInsh_median", aoi);
  var watermap = thresholdWaterholes(s2_clipped.select('AWEInsh_median'), ot);
  var eswSize = calcPixelCoverage(watermap, 'isWater');
  
  // Add ESW to map
  if (doplot) { Map.addLayer(s2_median, s2_med_vis) }

  // Export ESW raster
  if (doExportRasters) {
    var export_name = xname_slug + nm;
    Export.image.toCloudStorage({
      region: aoi,
      image: watermap,
      description: export_name,
      bucket: bname,
      scale: px_size_rast,
      maxPixels: px_max
    }); 
  }
  
  // Export raster processing info for export table
  var ot_feat = ee.Feature(null)
    .set({ 
      'START' : d1,'END' : d2,'OT' : ot,
      'HYBAS_ID' : HYBAS_ID,'NAME' : nm, 
      'CLOUD_FILTER' : CLOUD_FILTER,'CLOUD_PROB' : CLOUD_PROB,
      'COVER_NIMAGES' : s2Size,"MWF_SIZE" : mwfSize,"ESW_SIZE" : eswSize
    })
  return(ot_feat);
}