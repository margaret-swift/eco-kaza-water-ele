// THIS FILE CONTAINS CODE USED TO VALIDATE EPHEMERAL SURFACE WATER (ESW) MAPS FOR 
//    SWIFT ET AL 2026. CODE WAS WRITTEN IN GOOGLE EARTH ENGINE.
// SEE FUNCTIONS.JS FILE FOR A LIST OF ALL COMMON FUNCTIONS USED IN THIS CODE

  Map.setOptions('SATELLITE');

// +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
  // -+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-
  //                               !!! USER-DEFINED PARAMETERS !!!
  // -+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-
  // +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
  
  var testName = "ESW"
  var test_season = "WET";
  
  var doplot = true;
  var doexport = false;
  var dolog = true;
  var plot_test_region = true; 
  var run_all_validation = false;
  var name_i = "VROI_A_ne_forest";
  // var name_i = "VROI_B_nw";
  // var name_i = "VROI_C_okavango";
  // var name_i = "VROI_D_potholes";
  // var name_i = "VROI_F_zambezi";
  // var name_i = "VROI_G_ngami";
  // var name_i = "VROI_H_pans"; 
  
  // +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
    // -+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-
    //                               !!! GETTING ESW FILES FROM GCP !!!
    // -+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-
    // +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
    
    var h_ids = [
      1051412570, 1051412560, // A
      1051466490, // B
      1051466350, // C
      1051451560, // D
      1051487960, // F
      1050040200, // G
    ]
  var hydros = hydro.filter(ee.Filter.inList('HYBAS_ID', h_ids))
  var siz = hydro.filter(ee.Filter.inList('ID', ['Zambezi', 'Okavango', 'Makgadikgadi']))
  var aois = hydros.merge(siz)
  // Map.addLayer(aois.style({fillColor:'00440003', color:'green'}), {}, "hydrosheds")
  // Map.addLayer(vroi.style({fillColor:'00000000', color:'blue'}), {}, "VROI")
  
  // pull dry season water maps
  var uri_esw = "gs://kaza_esw_rasters/"
  var uri_siz = "gs://kaza_siz_strict/"
  var uri_siz_dry = [
    uri_siz + 'Zambezi_2019_JUL_AUG.tif',
    uri_siz + 'Okavango_2019_JUN_JUL0000000000-0000000000.tif',
    uri_siz + 'Okavango_2019_JUN_JUL0000000000-0000023296.tif',
    'gs://kaza_siz_rasters/Makgadikgadi_2019_JUL.tif'
  ]
  var uri_dry = [
    uri_esw + 'ESW_1051412570_2019_JUL_SEP.tif',
    uri_esw + 'ESW_1051412560_2019_JUL_SEP.tif',
    uri_esw + 'ESW_1051466490_2019_JUL_SEP0000000000-0000000000.tif',
    uri_esw + 'ESW_1051466490_2019_JUL_SEP0000000000-0000023296.tif',
    uri_esw + 'ESW_1051466350_2019_JUL_SEP0000000000-0000000000.tif',
    uri_esw + 'ESW_1051466350_2019_JUL_SEP0000000000-0000023296.tif',
    uri_esw + 'ESW_1051451560_2019_JUL_SEP.tif',
    // uri_esw + 'ESW_1061473880_2019_JUL_SEP.tif',
    uri_esw + 'ESW_1051487960_2019_JUL_SEP0000000000-0000000000.tif',
    uri_esw + 'ESW_1051487960_2019_JUL_SEP0000000000-0000023296.tif',
    uri_esw + 'ESW_1050040200_2019_JUL_SEP0000000000-0000000000.tif',
    uri_esw + 'ESW_1050040200_2019_JUL_SEP0000000000-0000023296.tif',
    uri_esw + 'ESW_1050040200_2019_JUL_SEP0000023296-0000000000.tif',
    uri_esw + 'ESW_1050040200_2019_JUL_SEP0000023296-0000023296.tif'
  ]
  var uri_siz_wet = [
    uri_siz + 'Zambezi_2021_FEB_MAR.tif',
    uri_siz + 'Okavango_2021_MAR0000000000-0000000000.tif',
    uri_siz + 'Okavango_2021_MAR0000000000-0000023296.tif',
    'gs://kaza_siz_rasters/Makgadikgadi_2021_MAR.tif'
  ]
  var uri_wet = [
    uri_esw + 'ESW_1051412570_2019_FEB_MAY.tif',
    uri_esw + 'ESW_1051412560_2019_FEB_MAY.tif',
    uri_esw + 'ESW_1051466490_2019_FEB_MAY0000000000-0000000000.tif',
    uri_esw + 'ESW_1051466490_2019_FEB_MAY0000000000-0000023296.tif',
    uri_esw + 'ESW_1051466350_2019_FEB_MAY0000000000-0000000000.tif',
    uri_esw + 'ESW_1051466350_2019_FEB_MAY0000000000-0000023296.tif',
    uri_esw + 'ESW_1051451560_2019_FEB_MAY.tif',
    // uri_esw + 'ESW_1061473880_2019_FEB_MAY.tif',
    uri_esw + 'ESW_1051487960_2019_FEB_MAY0000000000-0000000000.tif',
    uri_esw + 'ESW_1051487960_2019_FEB_MAY0000000000-0000023296.tif',
    uri_esw + 'ESW_1050040200_2019_FEB_MAY0000000000-0000000000.tif',
    uri_esw + 'ESW_1050040200_2019_FEB_MAY0000000000-0000023296.tif',
    uri_esw + 'ESW_1050040200_2019_FEB_MAY0000023296-0000000000.tif',
    uri_esw + 'ESW_1050040200_2019_FEB_MAY0000023296-0000023296.tif'
  ]
  var uri_mwf = [
    'gs://kaza_mwf_rasters/MWF_1051412570.tif',
    'gs://kaza_mwf_rasters/MWF_1051412560.tif',
    'gs://kaza_mwf_rasters/MWF_1051466490.tif',
    'gs://kaza_mwf_rasters/MWF_1051466350.tif',
    'gs://kaza_mwf_rasters/MWF_1051451560.tif',
    'gs://kaza_mwf_rasters/MWF_1061473880.tif',
    'gs://kaza_mwf_rasters/MWF_1051487960.tif',
    'gs://kaza_mwf_rasters/MWF_1050040200.tif',
  ]
  
  var mwf = ee.ImageCollection(uri_mwf.map(function(uri) {
    return(ee.Image.loadGeoTIFF(uri))
  })).mosaic()
  
  // wet season
  var siz_wet = ee.ImageCollection(uri_siz_wet.map(function(uri) {
    return(ee.Image.loadGeoTIFF(uri))
  })).mosaic().clip(vroi)
  var hy_wet = ee.ImageCollection(uri_wet.map(function(uri) {
    return(ee.Image.loadGeoTIFF(uri))
  })).mosaic().clip(vroi).updateMask(mwf)
  var esw_wet = ee.ImageCollection([hy_wet,siz_wet]).mosaic()
  
  // dry season
  var siz_dry = ee.ImageCollection(uri_siz_dry.map(function(uri) {
    return(ee.Image.loadGeoTIFF(uri))
  })).mosaic().clip(vroi)
  var hy_dry = ee.ImageCollection(uri_dry.map(function(uri) {
    return(ee.Image.loadGeoTIFF(uri))
  })).mosaic().clip(vroi).updateMask(mwf)
  var esw_dry = ee.ImageCollection([hy_dry, siz_dry]).mosaic()
  
  
  // -+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-
    // massage extra Planet validation points
  function flattenPoints (pts) {
    var pts_flat = pts.map( function(vc) {
      var fc = ee.FeatureCollection(
        vc.geometry().coordinates().map(function(g) {
          var f = ee.Feature(ee.Geometry.Point(g), {}).copyProperties(vc)
          return(f.set('YEAR', ee.Number.parse(f.get('Year'))))
        }))
      return(fc)
    }).flatten()
    return(pts_flat)
  }
  var flat_pts_25 = flattenPoints(valid_planet_2025)
  var flat_pts_26 = flattenPoints(valid_planet_2026)
  var valid_pts_flat = flat_pts_26//.merge(flat_pts_25)
  
  var valid_flat_water = valid_pts_flat.filter(ee.Filter.eq('IsWater', 'T'))
  .map(function(f) {return(f.set('TYPE', 'WATER'))})
  var valid_flat_notwater = valid_pts_flat.filter(ee.Filter.eq('IsWater', 'F'))
  .map(function(f) {return(f.set('TYPE', 'NOTWATER'))})
  var valid_all = valid_all_2025//.merge(valid_flat_water).merge(valid_flat_notwater)
  
  // -+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-
    
    
    // +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
    // -+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-
    //                               !!! PLOTTING PARAMETERS !!!
    // -+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-
    // +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
    
    if (plot_test_region) {
      var aoi = selectProperty(vroi, 'name', name_i).first().geometry()
      // Map.centerObject(aoi, 16)
      
      // create median image
      var cloud_params = getCloudParams(test_season, name_i);
      var d1 = cloud_params.get('START_DATE')
      var d2 = cloud_params.get("END_DATE")
      print(d1)
      print(d2)
      var CLOUD_FILTER = cloud_params.get("CLOUD_FILTER")
      var CLOUD_PROB = cloud_params.get("CLD_PRB_THRESH")
      var s2_median = s2Prep(d1, d2, aoi, CLOUD_FILTER, CLOUD_PROB)
      Map.addLayer(s2_median.select('B8_median', 'B4_median', 'B3_median'), {min:230, max:3900}, "NIR " + test_season)
      Map.addLayer(s2_median.select('AWEInsh_median'), {min:-1, max:-0.05}, "AWEI " + test_season)
      outlineObject(aoi, name_i, 'yellow', 3)
      runValidationSets(name_i, doexport)
    }
  if (run_all_validation) {
    var fc_A = runValidationSets('VROI_A_ne_forest', doexport)
    var fc_B = runValidationSets('VROI_B_nw', doexport)
    var fc_C = runValidationSets('VROI_C_okavango', doexport)
    var fc_D = runValidationSets('VROI_D_potholes', doexport)
    // var fc_E = runValidationSets('VROI_E_mountains', doexport)
    var fc_F = runValidationSets('VROI_F_zambezi', doexport)
    var fc_G = runValidationSets('VROI_G_ngami', doexport)
    var fc_H = runValidationSets('VROI_H_pans', doexport)
    // var fc = fc_A.merge(fc_B.merge(fc_C.merge(fc_D.merge(fc_E.merge(fc_F.merge(fc_G.merge(fc_H)))))))
    // print(fc)
    // Export.table.toDrive({
      //   collection: fc,
      //   folder:'GEEData', 
      //   description: "Validation_Data"
      // })
  }
  
  
  // +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
    // -+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-
    //                             !!! VALIDATION BATCH FUNCTION !!!
    // -+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-
    // +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
    // .
  // .
  // .
  // =================================================
    // FUNCTION to batch run validation
  function runValidationSets (name, doexport) {
    doexport = doexport || false;
    
    var fc1 = mapAndValidate(name, 'WET', true, testName)
    var fc2 = mapAndValidate(name, 'DRY', true, testName)
    var fc = fc1.merge(fc2)
    
    if (doexport) {
      Export.table.toDrive({
        collection: fc,
        folder:'GEEData', 
        description: "Validation_Data_" + name + "_" + testName
      })
    }
    return(fc)
  }
  // =================================================
    // .
  // .
  // .
  // +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
    // -+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-
    //                                 !!! VALIDATION FUNCTIONS !!!
    // -+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-
    // +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
    // .
  // .
  // .
  // =================================================
    // FUNCTION to map water against MWF mask and assess water/notwater accuracy
  function mapAndValidate (name, season, doplot, testName) {
    
    // print validation logger
    if (dolog) { printValidationSchema(name, season) }
    
    // get area of interest
    var aoi = selectProperty(vroi, 'name', name)
    
    if (testName == "GSW") {
      if (dolog) print('GSW')
      var jrc = ee.Image("JRC/GSW1_4/GlobalSurfaceWater").select('recurrence').clip(aoi)
      var watermap = jrc.where(jrc.gt(0), 1)
    } else {
      if (season == "DRY") { watermap = esw_dry;
      } else { watermap = esw_wet }
    }
    
    // MAPPING
    if (doplot) { 
      Map.addLayer(mwf, {'palette':'#0243ff'}, "MWF ", 1) 
      Map.addLayer(watermap, {'palette':'yellow'}, "ESW " + season, 0) 
    }
    
    // VALIDATION
    if (season == "WET") { var year = 2021
    } else { year = 2019 }
    var vpoints = selectProperty(valid_all, "YEAR", year).filterBounds(aoi);
    var water_val = validateWaterMapAgainstPoints('WATER', name, watermap, vpoints, doplot)
    var notwater_val = validateWaterMapAgainstPoints('NOTWATER', name, watermap, vpoints, doplot)
    var fc = ee.FeatureCollection([water_val, notwater_val]).map( function(feat) {
      return(feat.set('SEASON', season))
    })
    if (dolog) {
      print(ee.String("Water accuracy: ").cat(water_val.get('p_true')))
      print(ee.String("NonWater accuracy: ").cat(notwater_val.get('p_true')))
    }
    return(fc)
  }
  // =================================================
    // .
  // .
  // .
  // =================================================
    // FUNCTION to validate given water map against 
  //     validation points from Assets
  function validateWaterMapAgainstPoints ( type, name, watermap, vpoints, doplot ) {
    
    // filter validation points
    var true_points = selectProperty(vpoints, 'TYPE', type)
    print("npoints: ", true_points.size())
    
    // Draw a small buffer around points to reduce regions
    var buffs = true_points.map(function(pt){ return pt.buffer({'distance':20}) })
    
    // choose the appropriate reducer: for water, we want to know if there is any water 
    //    within a 10m buffer. For nonwater, the mean pixel value in the area should be 0.
    var raster = watermap.unmask()
    if (type === "WATER") {
      var agg_buff = raster.reduceRegions({
        collection: buffs, 
        reducer: ee.Reducer.max(), 
        scale: 10
      }).map( function(feat) {
        var val = ee.Number(feat.get('max')).round();
        return(feat.set("val", val))
      })
    } else { 
      // create appropriate raster from water map; if not-water, flip the raster
      raster = raster.where(raster.eq(1), 0).where(raster.eq(0), 1)
      agg_buff = raster.reduceRegions({
        collection: buffs, 
        reducer: ee.Reducer.mean(), 
        scale: 10
      }).map( function(feat) {
        var val = ee.Number(feat.get('mean')).round();
        return(feat.set("val", val))
      })
    }
    
    // calculate validation statistics
    var size = true_points.size() 
    var n_true = ee.Number(agg_buff.aggregate_sum('val'))
    var n_false = size.subtract(ee.Number(n_true))
    var p_true = n_true.divide(size)
    var p_false = n_false.divide(size)
    var feat = ee.Feature(null)
    .set('region', name)
    .set('type', type)
    .set('n_total', size)
    .set('n_true', n_true)
    .set('p_true', p_true)
    .set('n_false', n_false)
    .set('p_false', p_false)
    
    // Mapping and logging
    if (doplot) {
      // printValidationResults(feat)
      var pts_correct = agg_buff.filter(ee.Filter.eq('val', 1)).map(function(pt){ return pt.buffer({'distance':20}) })
      var pts_incorrect = agg_buff.filter(ee.Filter.eq('val', 0)).map(function(pt){ return pt.buffer({'distance':20}) })
      Map.addLayer(pts_correct, {'color':'#3bffba'}, 'correct - ' + type, 0);
      Map.addLayer(pts_incorrect, {'color':'#ffae00'}, 'incorrect - ' + type, 0);
      if (type == "WATER") { Map.addLayer(true_points, {color:'black'}, 'water', 0);
      } else { Map.addLayer(true_points, {color:'white'}, 'not water',0) }
    }
    return(feat);
  }
  // =================================================
    // .
  // .
  // .
  // =================================================
    // FUNCTIONS to print statements to console
  function printValidationSchema(name, season) {
    print('')
    print('---')
    print('VALIDATION PARAMETERS' + 
            '\n  * Region?  ' + name + 
            '\n  * Season?  ' + season)
  }
  function printValidationResults(feat) {
    var nt = feat.get('n_true')//.format();
    var n = feat.get('n_total')//.format();
    var pt = feat.get('p_true')//.format();
    var msg = ee.String(feat.get('type')).cat(':  [')
    .cat(nt).cat(ee.String("/"))
    .cat(n).cat('] - ')
    .cat(pt)
    print(msg)
  }
  // =================================================
    // .
  // .
  // .
  // +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
    // -+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-
    //                                 !!! FUNCTIONS !!!
    // -+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-
    // +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
    // FUNCTIONS for mapping
  function outlineObject(obj, name, col, w) {
    w = w || 1
    var outline = ee.Image().byte().paint({
      featureCollection:obj,color:1,width:w
    });
    Map.addLayer(outline, {palette:col}, name);
  }
  function selectProperty (fc, prop, val) { return(fc.filter(ee.Filter.eq(prop, val))) }
  function getCloudParams(season, name) {
    if (name == "H_pans") {
      var CLD_PRB_THRESH = 90;
      var CLOUD_FILTER = 30;
    } else {
      CLD_PRB_THRESH = 50;
      CLOUD_FILTER = 80;
    }
    
    if (season == "WET") {
      var params = ee.Dictionary( 
        {
          START_DATE : '2021-01-01',
          END_DATE : '2021-04-30',
          CLOUD_FILTER : CLOUD_FILTER,
          CLD_PRB_THRESH : CLD_PRB_THRESH
        })
    } else {
      params = ee.Dictionary( 
        {
          START_DATE : '2019-07-01',
          END_DATE : '2019-09-30',
          CLOUD_FILTER : CLOUD_FILTER,
          CLD_PRB_THRESH : CLD_PRB_THRESH
        });
    }
    return(params)
  }
  // =================================================
    // .
  // .
  // .
  // =================================================
    
    
    function s2Prep(d1, d2, aoi, CLOUD_FILTER, CLD_PRB_THRESH) {
      CLOUD_FILTER = CLOUD_FILTER || 30;
      CLD_PRB_THRESH = CLD_PRB_THRESH || 30;
      CLD_PRB_THRESH = ee.Number(CLD_PRB_THRESH)
      // Pull Sentinel-2 data for time period and AOI bounds
      var s2_sr_cld_col = get_s2_sr_cld_col(aoi, d1, d2, CLOUD_FILTER);
      // create median image and return
      var s2_median = s2_sr_cld_col.map(addAWEInsh)
      .select('B8', 'B4', 'B3', "AWEInsh").reduce('median', 8);
      return(s2_median);
    }
  function addAWEInsh(img){
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
    //                            DEALING WITH CLOUDS
  // ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    function get_s2_sr_cld_col (aoi, start_date, end_date, CLOUD_FILTER) {
      // # Import and filter S2 SR.
        var s2_sr_col = (ee.ImageCollection('COPERNICUS/S2_SR')
                         .filterBounds(aoi)
                         .filterDate(start_date, end_date)
                         .filter(ee.Filter.lte('CLOUDY_PIXEL_PERCENTAGE', CLOUD_FILTER)))
        
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
  
  // EOF */
    
    
    
    
    
    
    
    
    