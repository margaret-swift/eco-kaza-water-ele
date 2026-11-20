// THIS FILE CONTAINS CODE USED TO CREATE HYDROSHED EPHEMERAL SURFACE WATER RECURRENCE MAPS FOR 
//    SWIFT ET AL 2026. CODE WAS WRITTEN IN GOOGLE EARTH ENGINE.
// SEE FUNCTIONS.JS FILE FOR A LIST OF ALL COMMON FUNCTIONS USED IN THIS CODE


// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// STARTING PARAMETERS

var dolog = false;

// URL bases
var base_esw = "gs://kaza_esw_2026/";
var base_mwf = "gs://kaza_mwf_rasters/";

// all region IDs
var h_ids = hydro_kaza
  .filter(ee.Filter.notNull(ee.List(['HYBAS_ID'])))
  .aggregate_array("HYBAS_ID").sort()

// adding background imagery
var s2sub = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
  .filterBounds(hydro_kaza)
  .filterDate('2020-07-01', '2021-07-31')
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 10))
  .median();
Map.setOptions('SATELLITE');


// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// DEALING WITH SPLITS

// some images were split -- be careful with these
var splits = split_regions.aggregate_array("ID").sort().distinct()
var suffix_1 = "0000000000-0000000000.tif";
var suffix_2 = "0000000000-0000023296.tif";
var suffix_3 = "0000023296-0000000000.tif";
var suffix_4 = "0000023296-0000023296.tif";
var suffix_5 = "0000023296-0000046592.tif";
var suffix_6 = "0000000000-0000046592.tif";

// some split files are actually not splits ... ugh
var unsplitList = ee.List([
  'ESW_1051515680_2024_FEB_MAY',
  'ESW_1051533130_2024_FEB_MAY',
])
var foursplitList = ee.List([  
  'ESW_1051515680_2025_SEP_NOV',
  'ESW_1051515680_2025_MAY_JUL',
  'ESW_1051515680_2025_JUL_SEP',
  'ESW_1051466490_2025_JUL_SEP',
  'ESW_1051466490_2025_MAY_JUL'])
  
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// LOAD RASTERS FUNCTION

function loadAllRasters(id, type) {
      
  // get AOI and MWF
  var aoi = hydro_kaza.filter(ee.Filter.eq("HYBAS_ID", ee.Number.parse(id)))
  var uri = base_mwf + "MWF_" + id + ".tif"
  var maxwet = ee.Image.loadGeoTIFF(uri).rename("isWater");
  
  // get URL name stubs by year
  function getNames(y) {
    var b = 'ESW_' + id + "_" 
    var f = ee.Feature(null)
    
    var fc = ee.FeatureCollection([
      f.set('NAME', b + y + "_" +'NOV_FEB').set('SEASON', 'wet').set("YEAR", y),
      f.set('NAME', b + y + "_" +'FEB_MAY').set('SEASON', 'wet').set("YEAR", y),
      f.set('NAME', b + y + "_" +'MAY_JUL').set('SEASON', 'dry').set("YEAR", y),
      f.set('NAME', b + y + "_" +'JUL_SEP').set('SEASON', 'dry').set("YEAR", y),
      f.set('NAME', b + y + "_" +'SEP_NOV').set('SEASON', 'dry').set("YEAR", y)
    ])
    return(fc)
  }
  var params = getNames('2019')
    .merge(getNames('2020'))
    .merge(getNames('2021'))
    .merge(getNames('2022'))
    .merge(getNames('2023'))
    .merge(getNames('2024'))
    .merge(getNames('2025'))
    
  print(params)
  // FUNCTIONS FOR HANDLING SPLIT IMAGES //
  function noSplit(params) {
    print('noSplit()')
    var rasters = ee.ImageCollection(params.map(function(p) {
      var nm = p.get('NAME');
      var uri = ee.String(base_esw).cat(nm).cat('.tif');
      var img = ee.Image.loadGeoTIFF(uri).rename("isWater")
        .set('ID', id)
        .set('SEASON', p.get('SEASON'))
        .set('YEAR', p.get('YEAR'));
      return(img.updateMask(maxwet))
    }));
    return(rasters)
  }
  function twoSplit(params, sx1, sx2) {
    print('twoSplit()')
    var split_rasters = ee.ImageCollection(params.map(function(p) {
      var nm = p.get('NAME');
      var uri_1 = ee.String(base_esw).cat(nm).cat(sx1);
      var uri_2 = ee.String(base_esw).cat(nm).cat(sx2);
      var img_1 = ee.Image.loadGeoTIFF(uri_1).rename("isWater");
      var img_2 = ee.Image.loadGeoTIFF(uri_2).rename("isWater");
      var img = ee.Image(ee.ImageCollection([img_1, img_2]).mosaic())
        .set('ID', id)
        .set('SEASON', p.get('SEASON'))
        .set('YEAR', p.get('YEAR'));
      return(img.updateMask(maxwet))
    }));
    return(split_rasters)
  }
  function fourSplit(params) {
    print('fourSplit()')
    var split_rasters = ee.ImageCollection(params.map(function(p) {
      var nm = p.get('NAME');
      var uri_1 = ee.String(base_esw).cat(nm).cat(suffix_1);
      var uri_2 = ee.String(base_esw).cat(nm).cat(suffix_2);
      var uri_3 = ee.String(base_esw).cat(nm).cat(suffix_3);
      var uri_4 = ee.String(base_esw).cat(nm).cat(suffix_4);
      var img_1 = ee.Image.loadGeoTIFF(uri_1).rename("isWater");
      var img_2 = ee.Image.loadGeoTIFF(uri_2).rename("isWater");
      var img_3 = ee.Image.loadGeoTIFF(uri_3).rename("isWater");
      var img_4 = ee.Image.loadGeoTIFF(uri_4).rename("isWater");
      var img = ee.Image(ee.ImageCollection([img_1, img_2, img_3, img_4]).mosaic())
        .set('ID', id)
        .set('SEASON', p.get('SEASON'))
        .set('YEAR', p.get('YEAR'));
      return(img.updateMask(maxwet))
    }));
    return(split_rasters)
  }
  function sixSplit(params) {
    print('sixSplit()')
    var split_rasters = ee.ImageCollection(params.map(function(p) {
      var nm = p.get('NAME');
      var uri_1 = ee.String(base_esw).cat(nm).cat(suffix_1);
      var uri_2 = ee.String(base_esw).cat(nm).cat(suffix_2);
      var uri_3 = ee.String(base_esw).cat(nm).cat(suffix_3);
      var uri_4 = ee.String(base_esw).cat(nm).cat(suffix_4);
      var uri_5 = ee.String(base_esw).cat(nm).cat(suffix_5);
      var uri_6 = ee.String(base_esw).cat(nm).cat(suffix_6);
  
      var img_1 = ee.Image.loadGeoTIFF(uri_1).rename("isWater");
      var img_2 = ee.Image.loadGeoTIFF(uri_2).rename("isWater");
      var img_3 = ee.Image.loadGeoTIFF(uri_3).rename("isWater");
      var img_4 = ee.Image.loadGeoTIFF(uri_4).rename("isWater");
      var img_5 = ee.Image.loadGeoTIFF(uri_5).rename("isWater");
      var img_6 = ee.Image.loadGeoTIFF(uri_6).rename("isWater");
  
      var img = ee.Image(ee.ImageCollection([img_1, img_2, img_3, img_4, img_5, img_6]).mosaic())
        .set('ID', id)
        .set('SEASON', p.get('SEASON'))
        .set('YEAR', p.get('YEAR'));
      return(img.updateMask(maxwet))
    }));
    return(split_rasters)
  }

  // ===================================================
  /// 2 SPLITS
  // ===================================================
  if (type == "split" || type == "splitswap") {
    print('running split option')
    // choose split suffixes and run split image gathering
    if (type == "split") { var sx2 = suffix_2
    } else { sx2 = suffix_3 }
    var params_split2 = params
      .filter(ee.Filter.inList('NAME', unsplitList).not())
      .filter(ee.Filter.inList('NAME', foursplitList).not())
    var split_rasters2 = twoSplit(params_split2, suffix_1, sx2)
    // some have four splits, check for those
    var params_split4 = params.filter(ee.Filter.inList('NAME', foursplitList))
    var split_rasters4 = fourSplit(params_split4)
    var params_nosplit = params.filter(ee.Filter.inList('NAME', unsplitList))
    var nosplit_rasters = noSplit(params_nosplit)
    var all_rasters = split_rasters2.merge(split_rasters4).merge(nosplit_rasters)

  // ===================================================
  /// FOUR SPLITS /// 
  // ===================================================
  } else if (type == "4split") {
    print('running 4 split option')
    params_split4 = params.filter(ee.Filter.inList('NAME', unsplitList).not())
    split_rasters4 = fourSplit(params_split4)
    params_nosplit = params.filter(ee.Filter.inList('NAME', unsplitList))
    nosplit_rasters = noSplit(params_nosplit)
    all_rasters = split_rasters4.merge(nosplit_rasters)
    
  // ===================================================
  /// SIX SPLITS ///
  // ===================================================
  } else if (type == "6split") {
    print('running 6 split option')
    var params_split6 = params
      .filter(ee.Filter.inList('NAME', unsplitList).not())
      .filter(ee.Filter.inList('NAME', foursplitList).not())
    var split_rasters6 = sixSplit(params_split6)
    // some have four splits, check for those
    params_split4 = params.filter(ee.Filter.inList('NAME', foursplitList))
    split_rasters4 = fourSplit(params_split4)
    // some have no splits
    params_nosplit = params.filter(ee.Filter.inList('NAME', unsplitList))
    nosplit_rasters = noSplit(params_nosplit)
    all_rasters = split_rasters6.merge(split_rasters4).merge(nosplit_rasters)

  // ===================================================
  /// NO SPLITS ///
  // ===================================================
  } else {
    print('not split option')
    all_rasters = noSplit(params);
  }

  // ESWR TOTAL =====================================
  print(all_rasters.first())

  var ESWr_total = all_rasters
    .sum()
    .select('isWater')
    .rename('recurrence')
    .divide(all_rasters.size());

  Export.image.toCloudStorage({
    region: aoi,
    image: ESWr_total.clip(aoi),
    description: id + "_ESWr_total",
    bucket: "kaza_eswr_total",
    scale: 10,
    maxPixels: 1e10
  }); 
  
  // ESWR WET =====================================
  var wet_rasters = all_rasters.filter(ee.Filter.eq('SEASON', 'wet'))
  var ESWr_wet = wet_rasters
    .sum()
    .select('isWater')
    .rename('recurrence')
    .divide(wet_rasters.size())
    .updateMask(maxwet);
  Export.image.toCloudStorage({
    region: aoi,
    image: ESWr_wet.clip(aoi),
    description: id + "_ESWr_wet",
    bucket: "kaza_eswr_wet",
    scale: 10,
    maxPixels: 1e10
  }); 

  // ESWR DRY =====================================
  var dry_rasters = all_rasters.filter(ee.Filter.eq('SEASON', 'dry'))
  var ESWr_dry = dry_rasters
    .sum()
    .select('isWater')
    .rename('recurrence')
    .divide(dry_rasters.size())
    .updateMask(maxwet);
  Export.image.toCloudStorage({
    region: aoi,
    image: ESWr_dry.clip(aoi),
    description: id + "_ESWr_dry",
    bucket: "kaza_eswr_dry",
    scale: 10,
    maxPixels: 1e10
  }); 

  // MAPPING =====================================
  if (dolog) {
    var recur_vis = {palette: ["8fffeb","2f6eff","c718ff","f210ff"], min:0.05, max:1};
    Map.centerObject(aoi, 10)
    Map.addLayer(s2sub.clip(aoi), s2vis, 'Sentinel-2');
    Map.addLayer(maxwet, {'palette':'black'}, 'Maximum Water Fill');
    Map.addLayer(ESWr_total, recur_vis, "ESW recurrence");
    Map.addLayer(aoi.style({fillColor:'00000000', color:'black'}), {}, id);
  }
}

// ===================================================
//              RUNNING ALL ESWr EXPORTS
// ===================================================

// ===================================================
// 6splits - some were split into SIX images
// loadAllRasters('1051515680', '6split')

// ===================================================
// 4splits - some were split into 4 images
// loadAllRasters('1051479540', '4split')
// loadAllRasters('1051533130', '4split')
loadAllRasters('1050040200', '4split')

// ===================================================
// splits - some were split into 2 images
// loadAllRasters('1051466350', 'split')
// loadAllRasters('1051522260', 'split')
// loadAllRasters('1051487890', 'split')
// loadAllRasters('1051513460', 'split')
// loadAllRasters('1051478770', 'split')
// loadAllRasters('1051487960', 'split')
// loadAllRasters('1051466490', 'split')
// loadAllRasters('1061454200', 'split')

// ===================================================
// split swaps (use suffix 3 instead of suffix 2)
// loadAllRasters('1051438780', 'splitswap')
// loadAllRasters('1051478700', 'splitswap')
// loadAllRasters('1051478080', 'splitswap')

// ===================================================
// THE REST ARE NOT SPLIT

// BATCH 1
// loadAllRasters('1051518250', 'NOsplit')
// loadAllRasters('1051513450', 'NOsplit')
// loadAllRasters('1051479650', 'NOsplit')
// loadAllRasters('1051473950', 'NOsplit')
// loadAllRasters('1051453390', 'NOsplit')
// loadAllRasters('1051457550', 'NOsplit')
// loadAllRasters('1051457490', 'NOsplit')
// loadAllRasters('1051453310', 'NOsplit')
// loadAllRasters('1051477980', 'NOsplit')

// BATCH 2
// loadAllRasters('1051451560', 'NOsplit')
// loadAllRasters('1061469870', 'NOsplit')
// loadAllRasters('1050052130', 'NOsplit')
// loadAllRasters('1051400740', 'NOsplit')
// loadAllRasters('1051405300', 'NOsplit')
// loadAllRasters('1051409000', 'NOsplit')
// loadAllRasters('1051412560', 'NOsplit')
// loadAllRasters('1051412570', 'NOsplit')
// loadAllRasters('1051413460', 'NOsplit')
// loadAllRasters('1051413580', 'NOsplit')

// BATCH 3
// loadAllRasters('1051423970', 'NOsplit')
// loadAllRasters('1051428790', 'NOsplit')
// loadAllRasters('1051428730', 'NOsplit')
// loadAllRasters('1051431680', 'NOsplit')
// loadAllRasters('1051438860', 'NOsplit')
// loadAllRasters('1051451550', 'NOsplit')
// loadAllRasters('1051494900', 'NOsplit')
// loadAllRasters('1061469810', 'NOsplit')
// loadAllRasters('1061454120', 'NOsplit')
// loadAllRasters('1061473880', 'NOsplit')

// BATCH 4
// loadAllRasters('1061443520', 'NOsplit')
// loadAllRasters('1061444070', 'NOsplit')
// loadAllRasters('1061444220', 'NOsplit')
// loadAllRasters('1051520660', 'NOsplit')
// loadAllRasters('1051520550', 'NOsplit')
// loadAllRasters('1051515780', 'NOsplit')
// loadAllRasters('1051518160', 'NOsplit')
// loadAllRasters('1051522340', 'NOsplit')
// loadAllRasters('1061443730', 'NOsplit')
// loadAllRasters('1051533240', 'NOsplit')


// EOF */
