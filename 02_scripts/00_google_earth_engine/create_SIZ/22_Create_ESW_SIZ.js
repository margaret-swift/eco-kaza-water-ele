// THIS FILE CONTAINS CODE USED TO CREATE SEASONAL INUNDATION ZONE MAPS FOR 
//    SWIFT ET AL 2026. CODE WAS WRITTEN IN GOOGLE EARTH ENGINE.
// SEE FUNCTIONS.JS FILE FOR A LIST OF ALL COMMON FUNCTIONS USED IN THIS CODE

// +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
//                                      USER INPUT
// +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+

// AOI - Seasonal Inundation Zones
var id = "Zambezi";
// var id = "Okavango";
// var id = "Makgadikgadi";
// var id = "Chobe";
// var id = "Linyanti";

var doplot = false;
var doExportOT = true;
var doExportESW = true;

// EXPORT PARAMS
var bname = "kaza_siz_strict"; 
var pixelSize = 10;
var maxPixels = 10000000000000;
var min_val = -0.7;
var px_size_ot = 10;

// +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
//                                        SETUP
// +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+

// set map location and appearance
Map.setOptions('SATELLITE');

// choose AOI and watermap creation params
var params = siz_par.filter(ee.Filter.eq("SIZ_ID", id))
var aoi = siz.filter(ee.Filter.eq('ID', id)).geometry();
Map.centerObject(aoi, 14); // important for pixel-painted vectors (buildings and roads) 

// +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
//                                     BATCH LOOPING
// +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+

// Select all dates for the given AOI, sort, and loop over each one to export SIZ ESW files
var all_dates = params.aggregate_array("NAME").sort();
all_dates.evaluate(function (name_i) {
  // create reasters and pull OT and other info
  var fc = ee.FeatureCollection(
    name_i.map(function(i) { 
      return(ee.Feature(createAndExport(i))) 
    }
  ))
  if (doExportOT) {
    var xname = id + "_strict_thresholds";
    Export.table.toDrive({
      collection: fc, 
      folder: "GEEData", 
      fileFormat: 'csv',
      description: xname
    })
  }
});


// +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
//                                     FUNCTIONS
// +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
function calcPixelCoverage (img, bandName) {
  var npix = img.reduceRegion({
      reducer:ee.Reducer.count(), geometry:aoi, scale:px_size_ot
    }).get(bandName)
  return(npix)
}
function createAndExport (name_i) {
  var feat = params.filter(ee.Filter.eq('NAME', name_i)).first();
  var d1 = ee.Date.parse("MM/dd/yy", feat.get('START'));
  var d2 = ee.Date.parse("MM/dd/yy", feat.get('END'));
  var CLOUD_FILTER = ee.Number(feat.get('CLOUD_FILTER'));
  var CLOUD_PROB = ee.Number(feat.get('CLOUD_PROB'));
  
  // Create Sentinel-2 collection, median, mask to MWF, clip to AOI
  var s2_coll = s2Prep(d1, d2, aoi, CLOUD_FILTER, CLOUD_PROB);
  var s2_median = s2_coll.select('B.*', 'AWEI.*').reduce('median', 8);
  var s2_clipped = s2_median.clip(aoi);
  var s2Size = s2_coll.size();

  // calculate threshold, apply, and map
  var ot = getOtsuThreshold (s2_clipped, "AWEInsh_median", aoi, doplot);
  var watermap = thresholdWaterholes(s2_clipped.select('AWEInsh_median'), ot);
  watermap = watermap.set("ot_thresh", ot) 
  var eswSize = calcPixelCoverage(watermap, 'isWater');

  // Mapping
  if (doplot) {
    var s2vis_nir = nir_vis_2//{"bands":["B8_median","B3_median","B2_median"],"min":330,"max":3500};
    var s2vis_AWEI = {"bands":["AWEInsh_median"],"min":-2.3,"max":-0.07};
    Map.addLayer(s2_median, s2vis_nir, 's2 median image ' + name_i);
    Map.addLayer(s2_median, s2vis_AWEI, 'median AWEI ' + name_i);
    Map.addLayer(watermap, {palette: '35ffbf'}, 'surface water ' + name_i);
  }

  // export
  if (doExportESW) {
    var export_name = ee.String(ee.String(id).cat("_").cat(name_i)).getInfo();
    Export.image.toCloudStorage({
      region: aoi,
      image: watermap,
      description: export_name,
      bucket: bname,
      scale: pixelSize,
      maxPixels: maxPixels
    }); 
  }
 
  // Export raster processing info for export table
  var ot_feat = ee.Feature(null)
    .set({ 
      'START' : d1,'END' : d2,'OT' : ot,
      'HYBAS_ID' : 'NA','NAME' : name_i, 
      'CLOUD_FILTER' : CLOUD_FILTER,'CLOUD_PROB' : CLOUD_PROB,
      'COVER_NIMAGES' : s2Size, "MWF_SIZE" : 'NA', "ESW_SIZE" : eswSize
    })
  return(ot_feat)
}