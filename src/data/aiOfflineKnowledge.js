/**
 * Offline Knowledge Base for "Ask What Else" AI Advisor
 * Used when the network is unavailable or the Gemini API endpoint fails.
 */

export const OFFLINE_KNOWLEDGE = [
  {
    keywords: ['straw', 'paddy', 'stubble', 'harvest', 'residue', 'burn', 'వరి', 'గడ్డి', 'మొద్దులు', 'పొలం'],
    answer: {
      en: `Here are 3 practical, low-cost options for managing paddy straw without burning:

1. 🚜 In-Situ Mulching (Happy Seeder)
• Approx Cost: ~₹1,200 - ₹1,500 / acre (machine rental/diesel).
• Effort: Medium.
• Direct-sow the next crop directly through the stubble. Retains 20% soil moisture and saves fertilizer.

2. 🪱 Bio-Decomposer Spray (Pusa Decomposer)
• Approx Cost: ~₹300 - ₹500 / acre.
• Effort: Low to Medium.
• Dissolve capsules/liquid with jaggery and water. Spray over chopped straw to rot it into organic compost in 20-25 days.

3. 💰 Sell to Biomass / Paper Mill Aggregator
• Approx Cost: ₹0 (Buyer brings baler machine).
• Effort: Low.
• Earn ~₹1,500 - ₹2,500 / acre cash profit by supplying fuel pellets or eco-paper mills.

*(Note: Exact costs and custom hiring rental rates vary by district).*`,
      te: `వరి గడ్డిని కాల్చకుండా నిర్వహించడానికి 3 ఆచరణాత్మక, తక్కువ ఖర్చు మార్గాలు:

1. 🚜 మల్చింగ్ & హ్యాపీ సీడర్ (నేరుగా విత్తడం)
• సుమారు ఖర్చు: ~₹1,200 - ₹1,500 / ఎకరానికి (యంత్ర అద్దె).
• శ్రమ: మధ్యస్థం.
• గడ్డిని నరికి మట్టిలోనే కలపడం ద్వారా 20% సాగునీరు ఆదా అవుతుంది, తర్వాతి పంటకు ఎరువు ఖర్చు తగ్గుతుంది.

2. 🪱 బయో-డీకంపోజర్ పిచికారీ (కంపోస్ట్ తయారీ)
• సుమారు ఖర్చు: ~₹300 - ₹500 / ఎకరానికి.
• శ్రమ: తక్కువ నుండి మధ్యస్థం.
• బెల్లం, నీటితో ద్రావణాన్ని కలిపి గడ్డిపై పిచికారీ చేస్తే 20-25 రోజుల్లో నల్లటి సేంద్రీయ ఎరువుగా మారుతుంది.

3. 💰 బయోమాస్ లేదా పేపర్ మిల్లులకు విక్రయం
• సుమారు ఖర్చు: ₹0 (కొనుగోలుదారులే యంత్రం తెస్తారు).
• శ్రమ: తక్కువ.
• ఎకరానికి ~₹1,500 నుండి ₹2,500 వరకు నికర నగదు లాభం పొందవచ్చు.

*(గమనిక: యంత్రాల అద్దెలు మరియు ధరలు ప్రాంతాన్ని బట్టి మారవచ్చు).*`
    }
  },
  {
    keywords: ['bottle', 'plastic', 'reuse', 'pet', 'waste', 'బాటిల్', 'ప్లాస్టిక్', 'పునర్వినియోగం', 'వ్యర్థాలు'],
    answer: {
      en: `Here are 3 low-cost ways to handle plastic bottles at home:

1. 🌱 Self-Watering Balcony Planters
• Approx Cost: ₹0 (Use home scissors & soil).
• Effort: Low (5 minutes).
• Cut bottle in half, invert top with a cotton wick cord. Grow fresh mint, coriander, or chili plants without daily watering.

2. ♻️ Flatten & Sell to Scrap Dealer (Kabadiwala)
• Approx Cost: ₹0.
• Effort: Low.
• Rinse, step on bottles to crush them flat, collect 1-2 kg in a sack. Earn ₹15 - ₹25 / kg from local recyclers.

3. 🌾 Drip Irrigation Spikes for Garden / Trees
• Approx Cost: ₹0.
• Effort: Low.
• Poke 2 tiny pinholes near the cap, fill with water, and bury upside down near tree roots for slow root-zone drip.

*(Note: Scrap market prices depend on local recycling collection centers).*`,
      te: `ఇంట్లో ప్లాస్టిక్ బాటిళ్లను ఉపయోగకరంగా మార్చడానికి 3 సులభమైన పద్ధతులు:

1. 🌱 సెల్ఫ్-వాటరింగ్ మొక్కల కుండీలు
• సుమారు ఖర్చు: ₹0 (ఇంట్లోని కత్తెర, మట్టి వాడండి).
• శ్రమ: తక్కువ (5 నిమిషాలు).
• బాటిల్‌ను సగానికి కట్ చేసి, కాటన్ దారంతో అమర్చండి. పుదీనా, కొత్తిమీర, మిర్చి మొక్కలను తక్కువ నీటితో సులభంగా పెంచవచ్చు.

2. ♻️ నలిపి స్క్రాప్ డీలర్‌కు అమ్మడం (కబాడీవాలా)
• సుమారు ఖర్చు: ₹0.
• శ్రమ: తక్కువ.
• బాటిళ్లను కడిగి, తొక్కి చదును చేసి సంచిలో సేకరించండి. కిలోకు ₹15 - ₹25 వరకు నగదు లభిస్తుంది.

3. 🌾 చెట్లకు బిందు సేద్యం (డ్రిప్ ఇరిగేషన్)
• సుమారు ఖర్చు: ₹0.
• శ్రమ: తక్కువ.
• మూతకు చిన్న రంధ్రం చేసి, నీటితో నింపి చెట్ల వేర్ల వద్ద బోర్లించండి. కొద్దికొద్దిగా నీరు అందుతూ మొక్కలు ఎండకు ఎండిపోవు.

*(గమనిక: స్క్రాప్ ధరలు స్థానిక మార్కెట్‌ను బట్టి మారవచ్చు).*`
    }
  },
  {
    keywords: ['compost', 'kitchen', 'wet waste', 'కంపోస్ట్', 'తడి చెత్త', 'కూరగాయల వ్యర్థాలు'],
    answer: {
      en: `Here are 2 simple home composting methods:

1. 🏺 Earthen Pot / Bucket Compost
• Approx Cost: ₹0 - ₹150 (Old bucket or clay pot).
• Effort: Low (5 mins daily).
• Layer kitchen vegetable peels with dry brown leaves or cardboard scraps. Sprinkle a handful of garden soil or buttermilk. In 30 days, yields rich black organic plant food.

2. 🪱 Trench Composting in Garden Bed
• Approx Cost: ₹0.
• Effort: Low.
• Dig a 1-foot trench between plants, dump chopped raw kitchen scraps, and cover with soil. Earthworms decompose it silently underground.

*(Note: Avoid cooked oily food and meat to prevent odors).*`,
      te: `ఇంటి వ్యర్థాలతో సులభంగా కంపోస్ట్ చేసే 2 మార్గాలు:

1. 🏺 పాత బకెట్ లేదా కుండలో కంపోస్ట్
• సుమారు ఖర్చు: ₹0 - ₹150.
• శ్రమ: తక్కువ (రోజూ 5 నిమిషాలు).
• కూరగాయల తొక్కలను, ఎండుటాకులతో పొరలుగా వేసి కొద్దిగా మజ్జిగ లేదా మట్టి చల్లండి. 30 రోజుల్లో నాణ్యమైన నల్లటి సేంద్రీయ ఎరువు తయారవుతుంది.

2. 🪱 పెరట్లో గుంత కంపోస్టింగ్
• సుమారు ఖర్చు: ₹0.
• శ్రమ: తక్కువ.
• మొక్కల మధ్య 1 అడుగు గుంత తవ్వి తడి చెత్తను వేసి మట్టి కప్పండి. వానపాములు భూమిలోనే సహజ ఎరువుగా మారుస్తాయి.

*(గమనిక: వాసన రాకుండా ఉండటానికి నూనె పదార్థాలు వేయకండి).*`
    }
  }
]

export function getOfflineAnswer(query, lang = 'en') {
  const lower = query.toLowerCase()

  for (const item of OFFLINE_KNOWLEDGE) {
    if (item.keywords.some((kw) => lower.includes(kw.toLowerCase()))) {
      return item.answer[lang] || item.answer.en
    }
  }

  // Generic fallback if no specific keyword matched
  if (lang === 'te') {
    return `ఈ ప్రశ్నకు సంబంధించి 2 ముఖ్యమైన సుస్థిర సూచనలు:

1. 🌱 వ్యర్థాలను వర్గీకరించండి (తడి & పొడి చెత్త)
• సుమారు ఖర్చు: ₹0.
• శ్రమ: తక్కువ.
• సేంద్రీయ వ్యర్థాలను కంపోస్ట్ చేయండి, ప్లాస్టిక్ & లోహాలను స్థానిక స్క్రాప్ డీలర్లకు విక్రయించండి.

2. 💧 సహజ వనరుల పొదుపు
• సుమారు ఖర్చు: ₹0.
• శ్రమ: తక్కువ.
• నీటి పునర్వినియోగం మరియు విద్యుత్ ఆదా ద్వారా ఖర్చులను తగ్గించుకోవచ్చు.

*(నిర్దిష్ట వివరాల కోసం మరిన్ని వివరాలతో మీ ప్రశ్నను అడగండి).*`
  }

  return `Here are 2 general low-cost sustainable recommendations:

1. 🌱 Source Segregation (Wet & Dry Waste)
• Approx Cost: ₹0.
• Effort: Low.
• Turn organic scraps into compost, and separate clean recyclables (PET, paper, glass) for local scrap centers.

2. 💧 Resource Conservation
• Approx Cost: ₹0.
• Effort: Low.
• Mulch garden soil to save irrigation water and switch to refillable products to avoid single-use packaging.

*(For detailed guidance, try asking specifically about crop straw, plastic bottles, or composting).*`
}
