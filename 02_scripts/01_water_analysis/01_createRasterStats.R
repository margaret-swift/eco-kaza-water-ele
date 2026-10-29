# createRasterStats.R
# Margaret Swift <margaret.swift@cornell.edu>
# 
# ******************************************************************************
#   DATA & LIBRARY LOADING
# ******************************************************************************
source(here::here('02_scripts/utilities.R'))
i_am('02_scripts/01_water_analysis/01_createRasterStats.R')
datadir <- here('01_data', 'surfacewater', 'raw')
outdir <- here('03_output', '01_water_analysis')

# ******************************************************************************
#   RAINFALL DATA
# ******************************************************************************

# load Mean Annual Rainfall (MAR) data for hydrosheds
hydro_mar <- read.csv(here('01_data', 'rainfall', 'raw','Hydroshed_MAR.csv')) %>% 
  relocate('HYBAS_ID') %>% select(-system.index, -.geo)
hydro_mar_m = reshape2::melt(hydro_mar, id.var="HYBAS_ID", 
                             variable.name="YEAR", value.name="MAR") %>% 
  mutate(YEAR = as.numeric(gsub("X", "", YEAR))) %>% 
  rename(ID=HYBAS_ID)

# load Mean Annual Rainfall (MAR) data for SIZ Catchments
siz_catch_mar <- read.csv(here('01_data','rainfall','raw','SIZ_Catchments_MAR.csv')) %>% 
  relocate('name') %>% select(-system.index, -.geo)

# Chobe and Linyanti SIZ also use Zambezi catchment; 
#   Makgadikgadi gets water from both Nata and Okavango catchments
zambezi = siz_catch_mar %>% filter(name=="Zambezi")
okavango = siz_catch_mar %>% filter(name=="Okavango")
nata = siz_catch_mar %>% filter(name=="Nata")
makgadikgadi = siz_catch_mar %>% 
  filter(name != "Zambezi") %>% 
  select(-name) %>% 
  colMeans() %>% t() %>% 
  as.data.frame() %>% 
  mutate(name="Makgadikgadi") %>% 
  relocate(name)
siz_mar_m = rbind(
  okavango,
  zambezi, 
  zambezi %>% mutate(name="Chobe"),
  zambezi %>% mutate(name="Linyanti"),
  makgadikgadi 
) %>% 
  reshape2::melt(id.var="name", 
                 variable.name="YEAR", value.name="MAR") %>% 
  mutate(YEAR = as.numeric(gsub("mm", "", YEAR))) %>% 
  rename(ID=name)

#combine them all
mar_m = rbind(siz_mar_m, hydro_mar_m)

# add some stats and order by year
mardata = mar_m %>% group_by(YEAR) %>% 
  summarize(mMAR=mean(MAR), sdMAR=sd(MAR))%>% 
  arrange(mMAR, desc=TRUE)
mardata$YEAR = factor(mardata$YEAR, levels=mardata$YEAR)



# ******************************************************************************
#   ESW FILL DATA
# ******************************************************************************

# Load data for ESW fill - Hydrosheds
hdata = NULL
files <- list.files(here(datadir, 'ESW_sizes_HY'), full.names=TRUE)
for (f in files) {
  data <- read.csv(f) %>% 
    group_by(ID, START, END, YEAR, PX_AREA) %>% 
    summarize(MWF_NPIX = mean(MWF_NPIX),
              ESW_NPIX = sum(ESW_NPIX)) %>% 
    mutate(TYPE='HYDROSHED',
           PERIOD = paste(START, END, sep="_"),
           START = ymd(paste0(YEAR, '-', START, "-01")),
           END = ymd(paste0(YEAR, '-', END, "-01")), 
           ID = as.character(ID),) %>% 
    select(ID, TYPE, PERIOD, YEAR, START, END,
           ESW_NPIX, MWF_NPIX, PX_AREA) %>% 
    ungroup()
  if (is.null(hdata)) hdata <- data
  else hdata <- rbind(hdata, data)
}

# define periods
pds = c('NOV_FEB', 'FEB_MAY', 'MAY_JUL', 'JUL_SEP', 'SEP_NOV')
pds.df <- data.frame(MONTH=1:12, 
                     PERIOD=c('NOV_FEB', 'FEB_MAY', 'FEB_MAY', 'FEB_MAY', 'MAY_JUL', 'MAY_JUL',
                              'JUL_SEP', 'JUL_SEP', 'SEP_NOV', 'SEP_NOV', 'NOV_FEB', 'NOV_FEB'))

# Load data for ESW fill - SIZ
files <- list.files(here(datadir, 'ESW_sizes_SIZ'), full.names=TRUE)
sizdata = NULL
for (f in files) {
  name = gsub('.*\\/|_ESW_sizes.csv.*', '', f)
  print(name)
  data <- read.csv(f) %>%
    mutate(TYPE='SIZ', MWF_NPIX=NA,
           START=as.POSIXct(as.Date(START, "%m/%d/%y")),
           END=as.POSIXct(as.Date(END, "%m/%d/%y")),
    ) %>%
    left_join(pds.df, by="MONTH") %>%
    select_at(names(hdata))
  data$MWF_NPIX = max(data$ESW_NPIX)
  if (is.null(sizdata)) sizdata <- data
  else sizdata <- rbind(sizdata, data)
}


# ******************************************************************************
#   STATS FOR ALL DATA TOGETHER
# ******************************************************************************

# massage data
stats <- rbind(hdata, sizdata) %>% 
  group_by(ID) %>% 
  left_join(mar_m, by=c("ID", "YEAR")) %>% 
  mutate(
    # coverage
    ESW_SIZE_M2 = ESW_NPIX * PX_AREA,
    MWF_SIZE_M2 = MWF_NPIX * PX_AREA,
    COVER_P = ESW_NPIX / MWF_NPIX,
    COVER_D = myAnomaly(ESW_SIZE_M2),
    AVG_ESW_SIZE = mean(ESW_SIZE_M2), 
    ISFILL = COVER_P > 0,
    # rainfall
    MAR_D = myAnomaly(MAR),
    # misc
    YEAR = factor(YEAR, levels=2019:2025),
    PERIOD = factor(PERIOD, levels=pds),
    MONTH=month(START),
    ID = factor(ID)
  ) %>% 
  # remove hydrosheds with max fill less than 1000 pixels
  filter(MWF_SIZE_M2 > 1000)
  
# ******************************************************************************
#  SAVE ALL DATA
# ******************************************************************************
save(stats, mardata, file=here(outdir, "water_analysis.rdata"))
