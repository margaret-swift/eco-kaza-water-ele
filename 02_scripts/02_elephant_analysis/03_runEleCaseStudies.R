# runEleCaseStudies.R
# Created 24 Aug 2025
# Margaret Swift <margaret.swift@cornell.edu>
# 
# This script runs all the analyses given in the Savanna elephant water use analysis
#   (Sec. 2.8, Sec. 3.4)

# ******************************************************************************
#                             DATA & LIBRARY LOADING
# ******************************************************************************

source(here::here('02_scripts/utilities.R'))
i_am('02_scripts/02_elephant_analysis/03_runEleCaseStudies.R')
pacman::p_load(lme4)
load(here('01_data', 'elephant', 'processed', 'elephant_with_dists.rdata'))

# ******************************************************************************
# my thresholds
time_T = 48 #(hours)
dist_T = 50 #(meters)
dist_steps = c(50, 100, 200, 322, 644) # testing different distance-from-water thresholds
vars.ls = c('GSW', 'ESW', 'ESWP15',
            'NDWI2', 'MNDWI', 'WI2015', 
            'LC05', 'LC21',
            'RSW_1800_1', 'RSW_1800_2', 'RSW_1800_3', 
            'RSW_2500_1', 'RSW_2500_2', 'RSW_2500_3', 
            'RSW_5000_1', 'RSW_5000_2', 'RSW_5000_3'
)

# ******************************************************************************
#                                     T TESTS
# ******************************************************************************

# ******************************************************************************
#                                   ANALYSES!
# ******************************************************************************
# create ele stats data for T = dist_T
createEleStatistics <- function(dist_T) {
  createGroupingVariables <- function(slug) {
    print(slug)
    col = paste0(slug, "_NN_DIST")
    cols <- c('START.COUNT', col)
    df = ele.dat[,cols] |> st_drop_geometry()
    names(df) = c('START.COUNT', 'NN_DIST')
    df=df |> 
      mutate(NEAR = NN_DIST < dist_T, 
             GP = cumsum(START.COUNT | NEAR)) |> 
      # now for each thirst counter grouping, find out the max # hours of thirst
      # the elephant reaches.
      ungroup() %>% group_by(GP) %>% 
      mutate(THIRST = cumsum(!NEAR)) %>% 
      ungroup()
    return(df$THIRST)
  }
  
  # Creates elephant data summaries - how many points are near water,
  # adds thirst counter, etc. 
  df = sapply(vars.ls, createGroupingVariables)
  colnames(df) <- paste0('THIRST_', colnames(df))
  ele.stats = cbind(ele.dat, df) |> ungroup()|> st_drop_geometry()
  return(ele.stats)
}

# create stats data for T = 322m
ele.stats.322 = createEleStatistics(322) |> 
  mutate(is_close_GSW = THIRST_GSW < time_T, 
         is_close_ESW = THIRST_ESW < time_T)

# ******************************************************************************
# TABLE 4
#   Run Tukey HSD and AOV on water visitation data
makeAOVDat <- function(df) {
  # Makes AOV data for Tukey HSD analyses
  inx = which(grepl("THIRST|^ID$|DATE.TIME", names(df)))
  thirst.df = df[,inx] %>% st_drop_geometry() %>% 
    mutate(DATE.TIME = as.POSIXct(DATE.TIME)) %>% 
    reshape2::melt(id.vars=c('ID', 'DATE.TIME'), 
                   variable.name="watertype", value.name="thirst") %>% 
    arrange(ID, DATE.TIME) %>% 
    mutate(watertype = gsub("THIRST_", "", watertype)) %>% 
    filter(watertype %in% vars.ls) %>% 
    mutate(watertype = gsub("_1", "", watertype))
  return(thirst.df)
}
runAllAnalyses <- function(dist_T, doplot=FALSE) {
  # Create data, get stats, and run Tukey HSD analysis for threshold
  message("running analyses for dist_T = ", dist_T)
  ele.stats.nt = createEleStatistics(dist_T)
  thirst.nt = makeAOVDat(ele.stats.nt)
  lm.nt =  lm(thirst ~ watertype, data=thirst.nt)
  avg.thirst = thirst.nt %>% group_by(watertype) %>% 
    summarize(mu=mean(thirst, na.rm=TRUE) %>% round(2), 
              sd=sd(thirst, na.rm=TRUE)%>% round(2)) %>% 
    mutate(val = paste0(mu, " + ", sd)) %>% 
    dplyr::select(watertype, val)
  print(avg.thirst)
  if (doplot) {
    aov.nt =  aov(lm.nt)
    tuk.nt  = TukeyHSD(aov.nt)
    print(GGTukey(tuk.nt))
  }
}
for (t in dist_steps) runAllAnalyses(t)

# ******************************************************************************
#  FIGURE 6 b,d - Histograms of 'hours since last water visit' for both 
#    ESW and GSW, with T = 322 meters as a distance threshold
p.6b = ggplot(ele.stats.322) + 
  geom_histogram(aes(x=THIRST_GSW, fill=is_close_GSW), binwidth=19, color='white')  +
  scale_fill_manual(values=c('black', 'blue')) +
  scale_x_continuous(n.breaks=15, limits=c(0, 1200)) +
  theme_minimal() +
  guides(fill="none") + xlab('') + ylab('') + 
  theme(text=element_text(size=16))

p.6d = ggplot(ele.stats.322) + 
  geom_histogram(aes(x=THIRST_ESW, fill=is_close_ESW), bins=100, color='white')  +
  scale_fill_manual(values=c('black', 'red')) +
  scale_x_continuous(n.breaks=15, limits=c(0, 100)) +
  scale_y_continuous(limits=c(0, 17000)) +
  theme_minimal() +
  guides(fill="none") + xlab('') + ylab('') + 
  theme(text=element_text(size=16))

pout = here('03_output', '02_elephant_analysis', 'plots')
ggsave(p.6b, file=here(pout, 'Fig6b.png'), width=10, height=7)
ggsave(p.6d, file=here(pout, 'Fig6d.png'), width=10, height=7)

# ******************************************************************************
# FIGURE 7
#   plot of data under threshold T for each T and water index w
makeStats <- function(dist_T) {
  # A table of visitation rates within 48 hours
  mydf = createEleStatistics(dist_T)
  createTimingVariables <- function(slug) {
    col = paste0("THIRST_", slug)
    cols = c('INX', col)
    df = mydf[,cols]
    names(df) <- gsub('_.*', '', names(df))
    df = df |> 
      summarize(total = n(),
                n48 = sum(THIRST <= time_T)) |> 
      mutate(p48 = n48 / total)
    return(df$p48)
  }
  
  stats_all = sapply(vars.ls, createTimingVariables) |> as.data.frame() |> t() |> as.data.frame() 
  colnames(stats_all) <- paste0(colnames(stats_all), '_p48')
  rownames(stats_all) <- NULL
  stats_all = stats_all %>% 
    mutate(RSW_1800_p48 = mean(c(RSW_1800_1_p48, RSW_1800_2_p48, RSW_1800_3_p48)),
           RSW_2500_p48 = mean(c(RSW_2500_1_p48, RSW_2500_2_p48, RSW_2500_3_p48)),
           RSW_5000_p48 = mean(c(RSW_5000_1_p48, RSW_5000_2_p48, RSW_5000_3_p48)),
           THRESH=dist_T) %>% 
    dplyr::select(-RSW_1800_1_p48, -RSW_1800_2_p48, -RSW_1800_3_p48,
                  -RSW_2500_1_p48, -RSW_2500_2_p48, -RSW_2500_3_p48,
                  -RSW_5000_1_p48, -RSW_5000_2_p48, -RSW_5000_3_p48
    )
  return(stats_all)
}
mdat = do.call(rbind, lapply(dist_steps, makeStats)) %>% as.data.frame() %>% 
  rename_all(function(x) gsub('_p48','', x)) %>% 
  reshape2::melt(id.var="THRESH", variable.name="watertype")
p.7 = ggplot(mdat, aes(x=THRESH, y=value*100, 
                 color=watertype, linetype = grepl('RSW', watertype))) + 
  geom_line(linewidth=1, alpha=0.8) + 
  geom_line(data=mdat %>% filter(watertype=="ESW"), color='red', linewidth=2) +
  geom_line(data=mdat %>% filter(watertype=="GSW"), color='blue', linewidth=2) +
  geom_point(data=mdat |> filter(grepl('RSW|ESW$|GSW', watertype)),
               color='black', size=3) + 
  xlab('distance (m) from water classified as visitation') + 
  ylab('% points within 48hours of water') + 
  scale_color_manual(values=c( 'blue',
                               'red', 'brown', 
                               'green2', 'green3', 'green4',
                               'orange', 'orange4',
                               'black', 'gray50', 'gray70')) +
  theme_minimal() + 
  theme(text=element_text(size=20)) + 
  guides(linetype="none") +
  scale_x_continuous(breaks=dist_steps) + ylim(0, 100)
ggsave(p.7, file=here(pout, 'Fig7.png'), width=10, height=7)



# ******************************************************************************
# EXTRA STATISTICS

# visitation rates by sex - GSW and ESW
# Results did not significantly differ when disaggregated by sex
ele.stats.322 %>% st_drop_geometry() %>% 
  group_by(SEX) %>% 
  summarize(total = n(), 
            ESW_n48 = sum(THIRST_ESW <= time_T),
            GSW_n48 = sum(THIRST_GSW <= time_T),
  ) %>% 
  mutate(ESW_p48 = ESW_n48 / total,
         GSW_p48 = GSW_n48 / total)


# ******************************************************************************
# Sec. 2.8 (methods) and Sec. 3.4 (results)
# For each T, we considered ESW to outperform other water maps if 
# (3) dw,i was higher in the wet season than the dry season for ephemeral water 
#   (ESW), and higher in the dry season than the wet season for permanent water 
#   (ESW15) (significant difference between means was confirmed using a t-test). 
wet = ele.dat |> filter(SEASON == "WET") |> st_drop_geometry()
dry = ele.dat |> filter(SEASON == "DRY") |> st_drop_geometry()
t.test(wet$ESW_NN_DIST, dry$ESW_NN_DIST)
t.test(wet$ESWP15_NN_DIST, dry$ESWP15_NN_DIST)


# difference between distance from permanent and ephemeral water, by season
ez <- ele.stats.322 |> st_drop_geometry()
ez |> group_by(SEASON) |> 
  summarize(mean(ESWP15_NN_DIST), 
            mean(ESW_NN_DIST))

# permanent water
m1 = lm(ESWP15_NN_DIST ~ SEASON, data=ez)
summary(m1)

# ephemeral water
m2 = lm(ESW_NN_DIST ~ SEASON, data=ez)
summary(m2)

