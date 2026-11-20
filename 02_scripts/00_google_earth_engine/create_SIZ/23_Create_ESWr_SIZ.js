// THIS FILE CONTAINS CODE USED TO CREATE SEASONAL INUNDATION ZONE RECURRENCE MAPS FOR 
//    SWIFT ET AL 2026. CODE WAS WRITTEN IN GOOGLE EARTH ENGINE.
// SEE FUNCTIONS.JS FILE FOR A LIST OF ALL COMMON FUNCTIONS USED IN THIS CODE

// +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
//                                        USER INPUT
// +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
var hydro = ee.FeatureCollection("projects/kaza-waterhole-mapping/assets/all_hydro_and_siz"),
var siz_params = ee.FeatureCollection("projects/kaza-waterhole-mapping/assets/SIZ_All_Combined");

// URL base
var base = "gs://kaza_siz_strict/";
var id = "Zambezi";
var dolog=true;
var type = "nosplit"
if (id === "Okavango") type = 'split';
var wet_list = ee.List([1,2,3,4,5,10,11,12])
var aoi = hydro.filter(ee.Filter.eq('ID', id)).first()
var siz_ids = hydro.filter(ee.Filter.notNull(ee.List(['ID'])))
  .aggregate_array("ID").sort()
var suffix_1 = "0000000000-0000000000.tif";
var suffix_2 = "0000000000-0000023296.tif";

// +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
//                                        MAIN
// +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+

// gather all rasters for this SIZ
var all_names = siz_params.filter(ee.Filter.eq("SIZ_ID", id))
  .aggregate_array("NAME").sort()
var date = siz_params
  .filter(ee.Filter.eq('SIZ_ID', id))
  .filter(ee.Filter.eq('NAME', "2018_DEC_FEB"))
  .first()
  .get("END")

var eswr_siz = all_names.evaluate(function (nms) {
  var coll = ee.ImageCollection(ee.List(nms.map(function(nm) {
    var uri = base + id + "_" + nm
    if (id === 'Okavango') {
      var uri_1 = uri + suffix_1;
      var img_1 = ee.Image.loadGeoTIFF(uri_1).rename("isWater");
      var uri_2 = uri + suffix_2;
      var img_2 = ee.Image.loadGeoTIFF(uri_2).rename("isWater");
      var img = ee.Image(ee.ImageCollection([img_1, img_2]).mosaic())
    } else {
      var uri3 = uri + '.tif';
      img = ee.Image.loadGeoTIFF(uri3).rename("isWater")
    } 
    var raw = siz_params
      .filter(ee.Filter.eq('SIZ_ID', id))
      .filter(ee.Filter.eq('NAME', nm))
      .first()
    var d1 = raw.get("START")
    var d2 = raw.get("END")
    var date = ee.Date.parse("MM/dd/yy", d2)
    img = img.set('month', date.get('month')).set('end', d2).set('start', d1)
    return(img)
  })))
  
  // ESWR TOTAL =====================================
  var ESWr_total = coll
    .sum()
    .select('isWater')
    .rename('recurrence')
    .divide(coll.size());
  Export.image.toCloudStorage({
    region: aoi,
    image: ESWr_total.clip(aoi),
    description: id + "_ESWr_total",
    bucket: "kaza_eswr_total",
    scale: 10,
    maxPixels: 1e10
  }); 
  
  // ESWR WET =====================================
  var wet_rasters = coll.filter(ee.Filter.inList('month', wet_list))
  var ESWr_wet = wet_rasters
    .sum()
    .select('isWater')
    .rename('recurrence')
    .divide(wet_rasters.size())
  Export.image.toCloudStorage({
    region: aoi,
    image: ESWr_wet.clip(aoi),
    description: id + "_ESWr_wet",
    bucket: "kaza_eswr_wet",
    scale: 10,
    maxPixels: 1e10
  }); 

  // ESWR DRY =====================================
  var dry_rasters = coll.filter(ee.Filter.inList('month', wet_list).not())
  var ESWr_dry = dry_rasters
    .sum()
    .select('isWater')
    .rename('recurrence')
    .divide(dry_rasters.size())
  Export.image.toCloudStorage({
    region: aoi,
    image: ESWr_dry.clip(aoi),
    description: id + "_ESWr_dry",
    bucket: "kaza_eswr_dry",
    scale: 10,
    maxPixels: 1e10
  }); 
  return(coll)
});