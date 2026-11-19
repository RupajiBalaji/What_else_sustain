/**
 * Scenario Director API Client with in-memory caching, rate limiting, and regional offline fallback.
 * Section 7.2 of docs/MVP_MASTER_PLAN.md
 */

export const HINT_TEXTS = {
  hint_soil_moisture: {
    en: 'Leaving mulch on the topsoil cuts moisture evaporation by 15-25%.',
    te: 'నేలపై గడ్డి కప్పడం వల్ల తేమ ఆవిరి కావడం 15-25% తగ్గుతుంది.',
    hi: 'मिट्टी पर पुआल की मल्चिंग से 15-25% नमी का वाष्पीकरण रुकता है।'
  },
  hint_baling_income: {
    en: 'Biomass aggregation centers pay per bale, converting straw to revenue.',
    te: 'బయోమాస్ కేంద్రాలు ప్రతి బేల్‌కు చెల్లిస్తాయి, గడ్డిని ఆదాయంగా మారుస్తాయి.',
    hi: 'बायोमास केंद्र प्रति गांठ भुगतान करते हैं, जिससे पराली आय में बदलती है।'
  },
  hint_decomposer_spray: {
    en: 'Microbial bio-decomposer spray digests residue into compost within ~20 days.',
    te: 'సూక్ష్మజీవుల బయో-డీకంపోజర్ స్ప్రే గడ్డిని ~20 రోజుల్లో ఎరువుగా మారుస్తుంది.',
    hi: 'बायो-डिकंपोज़र स्प्रे अवशेषों को ~20 दिनों में खाद में बदल देता है।'
  },
  hint_happy_seeder: {
    en: 'Happy Seeder sows directly through standing stubble without waiting for field burning.',
    te: 'హ్యాపీ సీడర్ గడ్డి కాల్చే అవసరం లేకుండా నేరుగా విత్తనాలు నాటుతుంది.',
    hi: 'हैप्पी सीडर पराली जलाए बिना सीधे गेहूं की बुवाई करता है।'
  }
}

export const REGIONAL_DEFAULTS = {
  Punjab: {
    villageName: 'Rupnagar',
    introStory: {
      en: 'Harvest across Punjab is complete. Heavy combine harvesters have left tall standing stubble across your field.',
      te: 'పంజాబ్ అంతటా పంట కోత పూర్తయింది. భారీ కంబైన్ హార్వెస్టర్ల వలన పొలంలో ఎత్తైన గడ్డి మొద్దులు మిగిలాయి.',
      hi: 'पंजाब भर में धान की कटाई पूरी हो चुकी है। कंबाइन हार्वेस्टर से खेत में खड़ी पराली बची है।'
    },
    whyPeopleBurnHere: 'short_window',
    featuredAlternatives: ['happy_seeder', 'bale_sell', 'mulch', 'compost'],
    localHint: 'hint_happy_seeder',
    eventSuggestion: 'early_frost'
  },
  Haryana: {
    villageName: 'Karnal',
    introStory: {
      en: 'Winter sowing looms across Haryana. Custom hiring centres for seeders have waiting queues.',
      te: 'హర్యానాలో శీతాకాల పంటల విత్తే సమయం దగ్గరపడింది. సీడర్ యంత్రాల కేంద్రాల్లో రైతుల రద్దీ ఉంది.',
      hi: 'हरियाणा में रबी बुवाई का समय आ गया है। हैप्पी सीडर केंद्रों पर कतारें लगी हैं।'
    },
    whyPeopleBurnHere: 'no_machinery',
    featuredAlternatives: ['happy_seeder', 'bale_sell', 'mulch', 'compost'],
    localHint: 'hint_baling_income',
    eventSuggestion: 'diesel_hike'
  },
  'Uttar Pradesh': {
    villageName: 'Meerut',
    introStory: {
      en: 'Western Uttar Pradesh fields are dense with residue. The local biomass plant is actively contracting bales.',
      te: 'పశ్చిమ ఉత్తరప్రదేశ్‌లో గడ్డి వ్యర్థాలు పేరుకుపోయాయి. స్థానిక బయోమాస్ ప్లాంట్ గడ్డి కట్టలను కొనుగోలు చేస్తోంది.',
      hi: 'पश्चिमी उत्तर प्रदेश के खेतों में भारी अवशेष हैं। स्थानीय बायोमास प्लांट पराली खरीद रहा है।'
    },
    whyPeopleBurnHere: 'high_labor_cost',
    featuredAlternatives: ['bale_sell', 'compost', 'happy_seeder', 'mulch'],
    localHint: 'hint_decomposer_spray',
    eventSuggestion: 'subsidy_active'
  },
  UP: {
    villageName: 'Meerut',
    introStory: {
      en: 'Western Uttar Pradesh fields are dense with residue. The local biomass plant is actively contracting bales.',
      te: 'పశ్చిమ ఉత్తరప్రదేశ్‌లో గడ్డి వ్యర్థాలు పేరుకుపోయాయి. స్థానిక బయోమాస్ ప్లాంట్ గడ్డి కట్టలను కొనుగోలు చేస్తోంది.',
      hi: 'पश्चिमी उत्तर प्रदेश के खेतों में भारी अवशेष हैं। स्थानीय बायोमास प्लांट पराली खरीद रहा है।'
    },
    whyPeopleBurnHere: 'high_labor_cost',
    featuredAlternatives: ['bale_sell', 'compost', 'happy_seeder', 'mulch'],
    localHint: 'hint_decomposer_spray',
    eventSuggestion: 'subsidy_active'
  },
  Telangana: {
    villageName: 'Warangal',
    introStory: {
      en: 'Paddy harvest across Telangana has left extensive straw rows. Soil moisture retention is vital before the summer heat.',
      te: 'తెలంగాణలో వరి కోతల తర్వాత గడ్డి వరుసలు మిగిలాయి. వేసవి ఎండలకు ముందు నేలలో తేమను నిలపడం ఎంతో ముఖ్యం.',
      hi: 'तेलंगाना में धान की कटाई के बाद खेतों में पुआल फैला है। गर्मियों से पहले मिट्टी की नमी बचाना जरूरी है।'
    },
    whyPeopleBurnHere: 'traditional_habit',
    featuredAlternatives: ['mulch', 'compost', 'bale_sell', 'happy_seeder'],
    localHint: 'hint_soil_moisture',
    eventSuggestion: 'air_quality_alert'
  },
  'Andhra Pradesh': {
    villageName: 'Tenali',
    introStory: {
      en: 'Coastal Andhra delta fields have concluded harvest. Managing straw without smoke protects nearby aquaculture ponds.',
      te: 'కోస్తా ఆంధ్ర డెల్టా పొలాల్లో కోతలు పూర్తయ్యాయి. పొగ రాకుండా గడ్డిని నిర్వహించడం సమీపంలోని రొయ్యల చెరువులకు రక్షణ.',
      hi: 'तटीय आंध्र के डेल्टा खेतों में फसल कट चुकी है। बिना धुएं के पुआल प्रबंधन जलीय तालाबों की सुरक्षा करता है।'
    },
    whyPeopleBurnHere: 'short_window',
    featuredAlternatives: ['mulch', 'bale_sell', 'compost', 'happy_seeder'],
    localHint: 'hint_soil_moisture',
    eventSuggestion: 'subsidy_active'
  }
}

// In-memory cache keyed by `${state}-${crop}-${language}`
const clientCache = new Map()

export async function fetchScenarioDirector({ state = 'Punjab', crop = 'Paddy', acres = 5, language = 'en' }) {
  const cacheKey = `${state}-${crop}-${language}`
  if (clientCache.has(cacheKey)) {
    return clientCache.get(cacheKey)
  }

  // Get regional fallback
  const regional = REGIONAL_DEFAULTS[state] || REGIONAL_DEFAULTS.Punjab
  const fallback = {
    villageName: regional.villageName,
    introStory: regional.introStory[language] || regional.introStory.en,
    whyPeopleBurnHere: regional.whyPeopleBurnHere,
    featuredAlternatives: regional.featuredAlternatives,
    localHint: regional.localHint,
    eventSuggestion: regional.eventSuggestion
  }

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 6000)

    const res = await fetch('/api/director/scenario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state, crop, acres: Number(acres), language }),
      signal: controller.signal
    })
    clearTimeout(timer)

    if (res.ok) {
      const data = await res.json()
      // Map 'bio_decomposer' to 'compost' for frontend consistency
      const mappedAlternatives = (data.featuredAlternatives || fallback.featuredAlternatives).map((alt) =>
        alt === 'bio_decomposer' ? 'compost' : alt
      )

      const result = {
        data: {
          villageName: data.villageName || fallback.villageName,
          introStory: typeof data.introStory === 'object' ? data.introStory[language] || data.introStory.en : data.introStory || fallback.introStory,
          whyPeopleBurnHere: data.whyPeopleBurnHere || fallback.whyPeopleBurnHere,
          featuredAlternatives: mappedAlternatives,
          localHint: data.localHint || fallback.localHint,
          eventSuggestion: data.eventSuggestion || fallback.eventSuggestion
        },
        isOffline: false
      }

      clientCache.set(cacheKey, result)
      return result
    }
  } catch (err) {
    // Network failure or abort -> fall back silently
  }

  const result = {
    data: fallback,
    isOffline: true
  }
  clientCache.set(cacheKey, result)
  return result
}
