// THIS FILE CONTAINS CODE USED TO CREATE MAXIMUM WATER FILL (MWF) MAPS FOR 
//    SWIFT ET AL 2026. CODE WAS WRITTEN IN GOOGLE EARTH ENGINE.
// SEE FUNCTIONS.JS FILE FOR A LIST OF ALL COMMON FUNCTIONS USED IN THIS CODE

// +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
//                                        USER INPUT
// +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+

Map.setOptions('SATELLITE');
Map.centerObject(kaza, 16); // important for pixel-painted vectors (buildings and roads) 

// EXPORT PARAMS
var bname = "kaza_mwf_rasters";
var xname_slug = "MWF_";
var pixelSize = 30;
var maxPixels = 1e10;
var hydro_kaza = hydro.filter(ee.Filter.notNull(ee.List(['HYBAS_ID'])))
var dolog = false;
var doexportotsu = false;
var otsu_inx = "_5"

// Cloud params
var CLOUD_FILTER = 0;
var CLOUD_PROB = 10;

var h_ids = hydro_kaza.aggregate_array("HYBAS_ID").distinct().sort()

// +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
//                                        MAIN
// +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+

h_ids.evaluate(function (ids) {
  var fc_all = ids.map(function(id) { 
    var xname = xname_slug + id
    if (dolog) print(xname)
    
    var feat = hydro_kaza.filter(ee.Filter.eq('HYBAS_ID', id)).first();
    var aoi = feat.geometry();

    // Sort years by most rainfall -> least rainfall for the region
    var years_lst = sortYearsByRainfall(aoi);
    if (dolog) print(years_lst)
    
    // For three wettest years, create water map and save to collection
    var y1 = ee.Number.parse(years_lst.get(0));
    var y2 = ee.Number.parse(years_lst.get(1));
    var y3 = ee.Number.parse(years_lst.get(2));
    
    // otsu thresholds save
    if (doexportotsu) {
      var mm_list = sortYearsByRainfall(aoi, false);
      var ot1 = getOT(y1, aoi).set('MMRAIN', mm_list.get(y1)).set('ID', id);
      var ot2 = getOT(y2, aoi).set('MMRAIN', mm_list.get(y2)).set('ID', id);
      var ot3 = getOT(y3, aoi).set('MMRAIN', mm_list.get(y3)).set('ID', id);
      var fc = ee.FeatureCollection([ot1, ot2, ot3]);
      if (dolog) print(fc)   
      return(fc)
    }
    
    // water maps
    var map1 = makeMaps(y1, aoi);
    var map2 = makeMaps(y2, aoi);
    var map3 = makeMaps(y3, aoi);
    // var mwf = ee.ImageCollection([map1, map2, map3]).sum().selfMask()
    
    // Option A: Rasterize using paint()
    // Create a blank image with the same projection/scale as the raster
    var emptyMask = ee.Image(0).toByte().clip(aoi);
    // Paint the features (e.g., set pixels within 'countries' to 1)
    var vectorMask = emptyMask.paint(BURNS, 1).clip(aoi);
    var mwf = ee.ImageCollection([map1, map3]).sum().selfMask().updateMask(vectorMask)

    if (dolog) {
      Map.addLayer(mwf, {'palette':'magenta'}, "maximum water fill")
      Map.addLayer(map1, {palette:'yellow'}, 'map 1', 0)
      Map.addLayer(map2, {palette:'yellow'}, 'map 2', 0)
      Map.addLayer(map3, {palette:'yellow'}, 'map 3', 0)
    }
    Export.image.toCloudStorage({
      region: aoi,
      image: mwf,
      description: xname,
      bucket: bname,
      scale: pixelSize,
      maxPixels: maxPixels
    }); 
  })
  
  if (doexportotsu) {
    Export.table.toCloudStorage({
      collection: ee.FeatureCollection(fc_all).flatten(),
      description: "MWF_ALL_OT" + otsu_inx,
      bucket: bname,
    }); 
  }
});

function makeMaps(y, aoi) {
  
  var d2 = ee.Date(ee.String(ee.Number(y)).cat('-06-01'));
  var d1 = d2.advance(-6, 'month'); // avoids needing to hardcode year change

  // get median image
  var s2_median = s2Prep(d1, d2, aoi, CLOUD_FILTER, CLOUD_PROB).clip(aoi)
  if (dolog) {
    Map.addLayer(s2_median, vis, "Sentinel-2")
    Map.addLayer(s2_median.select('AWEInsh_median'), 
      {'min':-1.7, 'max':-0.7}, "AWEI", 0)
  }

  // get otsu threshold
  var ot = getOtsuThreshold (s2_median, "AWEInsh_median", aoi);
  if (dolog) print('threshold: ', ot)
  
  // get water map
  var watermap = thresholdWaterholes(s2_median.select('AWEInsh_median'), ot).set('OT', ot);
  return(watermap);
}
function getOT(y, aoi) {
  
  var d2 = ee.Date(ee.String(ee.Number(y)).cat('-06-01'));
  var d1 = d2.advance(-6, 'month');
  
  // sizes
  var s2_sr_cld_col = get_s2_sr_cld_col(aoi, d1, d2, CLOUD_FILTER);
  var size = s2_sr_cld_col.size()

  // get median images
  var s2_median = s2Prep(d1, d2, aoi, CLOUD_FILTER, CLOUD_PROB).clip(aoi)
  // if (dolog) Map.addLayer(s2_median, awei)

  // get otsu threshold
  var ot = getOtsuThreshold (s2_median, "AWEInsh_median", aoi);
  var feat = ee.Feature(aoi).set('OT', ot).set('YEAR', y).set("NIMG", size)
  return(feat);
}