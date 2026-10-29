# validation.R
# Margaret Swift <margaret.swift@cornell.edu>
# 
# Reads in validation data from GEE outputs, converts into nice tables for paper.
# 
# ******************************************************************************
#   DATA & LIBRARY LOADING
# ******************************************************************************
source(here::here('02_scripts/utilities.R'))
i_am('02_scripts/01_water_analysis/00_validation.R')
regions = c('A_Kalala', 'B_Kwando', 'C_Okavango', 'D_Chobe', 
            'E_Zambezi', 'F_Ngamiland', 'G_Makgadikgadi')
datadir <- here('01_data', 'surfacewater', 'raw', 'Validation_Data')

# ******************************************************************************
#   FUNCTIONS
# ******************************************************************************

# takes in validation data raw output from GEE and cleans it up for paper 
#   presentation.
massageData = function(name) {
  fname = paste0("Validation_Data_", name, ".csv")
  message('massaging data from ', fname, '...')
  data = read.csv(here(datadir, fname))
  data_m = data %>% rename_all(toupper) %>% 
    mutate(SEASON = factor(SEASON, levels=c('DRY', 'WET')),
           TYPE = factor(TYPE, levels=c('WATER', 'NOTWATER')), 
           P_TRUE = round(P_TRUE*100, 0)) %>% 
    filter(!grepl('mountains', REGION)) %>% 
    dcast(REGION ~ SEASON + TYPE, 
          value.var = "P_TRUE")
  data_m$REGION = regions
  message('DONE!')
  return(data_m)
}

# ******************************************************************************
#   ANALYSIS
# ******************************************************************************

## TABLE 1 -- VALIDATION ##
## Accuracy assessment for the 10m ESW product presented in this paper, compared
##  to four other surface water products, for seven validation regions in KAZA.
massageData('ESW_DRY')
massageData('ESW_WET')
massageData('GSW')
massageData('MNDWI')
massageData('NDWI2')
massageData('WI2015')
massageData('ESWNoMWF')

# ******************************************************************************
# ******************************************************************************
# ******************************************************************************