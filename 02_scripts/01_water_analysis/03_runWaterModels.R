# runWaterModels.R
# Margaret Swift <margaret.swift@cornell.edu>
# 
# This script runs all the analyses given in the Seasonal surface water fill analysis
#   (Sec 2.7, Sec. 3.3)

# ******************************************************************************
#                             DATA & LIBRARY LOADING
# ******************************************************************************
source(here::here('02_scripts', 'utilities.R'))
i_am('02_scripts/01_water_analysis/03_runWaterModels.R')
outdir <- here('03_output', '01_water_analysis')
load(here(outdir, "water_analysis.rdata"))
pacman::p_load(LaplacesDemon,# logit and invlogit
               emmeans,brms, parameters, tidybayes, tinytable, betareg)
# ******************************************************************************

# ESW report
# Water fill by period and type (hydroshed vs SIZ)
esw_stats %>% 
  group_by(TYPE, PERIOD) %>% 
  summarize(m=mean(ESW_SIZE_M2/10000), 
            sd=sd(ESW_SIZE_M2/10000), 
  )

# hydroshed fill by year
esw_stats %>% 
  filter(TYPE == "HYDROSHED") %>% 
  group_by(PERIOD, YEAR) %>% 
  summarize(sum(ESW_SIZE_M2/10000))

## How does cover percentage change over period for SIZ?
aov.beta.siz <- aov(COVER_P ~ PERIOD, data = logidata.siz)

## How does cover percentage change over period for HYDROSHEDS?
aov.beta.hy <- aov(COVER_P ~ PERIOD, data = logidata.hy)


# ******************************************************************************
# make logistic and beta data for regressions
logidata = esw_stats %>% as.data.frame()
logidata.hy <- logidata %>% filter(TYPE=="HYDROSHED")
logidata.siz <- logidata %>% filter(TYPE=="SIZ")
betadata = logidata %>% filter(ISFILL)
betadata.hy <- betadata %>% 
  filter(TYPE=="HYDROSHED") %>% 
  filter(COVER_P<1)

# ******************************************************************************
# TABLE 3
# ******************************************************************************
## HOW DOES MAR INFLUENCE COVER PERCENTAGE?

# Table 3 (top row - Binomial GLM)
# data are zero-inflated, so let's first run a logistic model to see if there
## is a significant effect of MAR on whether there is any water at all.
m.logi <- glm(ISFILL ~ MAR_D * PERIOD, family=binomial(), 
              data=logidata.hy)
summary(m.logi)

# Table 3 (bottom row - Beta GLM)
m.beta <- betareg(COVER_P ~ MAR_D * PERIOD, 
                  data = betadata.hy)
summary(m.beta)

# ========================================
# marginal effect of MAR in general
expcoefs = exp(coef(m.beta))
cMAR = expcoefs[2]
cMAR

# marginal effect of MAR during FEB-MAY time period
cFM = expcoefs[3]
cMARFM = expcoefs[7]
change_in_OR_FEBMAY = cFM*cMARFM
change_in_OR_FEBMAY
change_in_OR_FEBMAY * cMAR

# marginal effect of MAR during MAY-JULY time period
cMJ = expcoefs[4]
cMARMJ = expcoefs[8]
change_in_OR_MAYJULY =cMJ*cMARMJ
change_in_OR_MAYJULY
change_in_OR_MAYJULY * cMAR


# ******************************************************************************
# TABLE S5
# ******************************************************************************

# need to run a Kruskal-Wallis test to see if any groups are different
kruskal.test(COVER_P ~ PERIOD, data = logidata.hy)
# ... and a pairwise Wilcox test to see which ones
pairwise.wilcox.test(logidata.hy$COVER_P, logidata.hy$PERIOD,
                     p.adjust.method = "bonf")

# ******************************************************************************

