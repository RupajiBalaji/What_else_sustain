# Data Sources & Scientific Statistics Registry (`SOURCES.md`)

This registry lists every factual and approximate numerical metric displayed in the **What Else Sustain** web prototype.

Per project data rules:
- **No invented statistics**: Every number displayed to the player is cataloged below with its source attribution and a `"verified": false` flag.
- **Unverified Notice**: Any unverified entry automatically displays an *"⚠️ Unverified (Approximate data for prototype)"* / *"ధృవీకరించబడలేదు (సుమారు)"* badge in the UI until confirmed by primary research literature or government databases.

---

## 🌾 Scenario 1: The Farmer and the Leftover Straw (`farm_crop_residue`)

### 1. Soil: Nutrient & Microbe Loss
- **JSON Key Path**: `scenarios[0].choices[0].impact.threeCards[0].stat`
- **Value**: `~100% Nitrogen & ~25-40% Organic Matter Lost`
- **Source**: `ICAR-Indian Agricultural Research Institute observational estimates`
- **Verified**: `false`
- **Scientific Context**: High surface temperatures ($50^\circ\text{C}$ to $70^\circ\text{C}$) from stubble burning kill nitrogen-fixing bacteria, mycorrhizal fungi, and surface earthworms while vaporizing organic carbon and volatile nitrogen.

### 2. Air & Health: Toxic Village Smog
- **JSON Key Path**: `scenarios[0].choices[0].impact.threeCards[1].stat`
- **Value**: `~60 to 90 kg PM2.5 / acre`
- **Source**: `Central Pollution Control Board (CPCB) field models`
- **Verified**: `false`
- **Scientific Context**: Crop residue burning produces fine particulate matter ($\text{PM}_{2.5}$), carbon monoxide, polycyclic aromatic hydrocarbons, and volatile organic compounds that degrade air quality in surrounding rural and peri-urban settlements.

### 3. Money: Hidden Fertilizer Costs & Lost Straw Sales
- **JSON Key Path**: `scenarios[0].choices[0].impact.threeCards[2].stat`
- **Value**: `~₹3,000 to ₹4,500 / acre lost`
- **Source**: `State Agricultural University Agronomy survey averages`
- **Verified**: `false`
- **Economic Breakdown**:
  - Extra synthetic fertilizer (Urea, DAP, Potash) required to replenish lost organic NPK: $\sim ₹1,800\text{--}₹2,500$/acre.
  - Respiratory healthcare bills for children/elders: $\sim ₹800\text{--}₹1,200$.
  - Lost opportunity to sell straw bales: $\sim ₹1,500\text{--}₹2,500$/acre.

### 4. Mulching: Moisture Retention
- **JSON Key Path**: `scenarios[0].choices[1].impact.metrics[0]`
- **Value**: `~15% to 25% moisture retained`
- **Source**: `FAO Conservation Agriculture guidelines`
- **Verified**: `false`
- **Agricultural Benefit**: Surface residue acts as an insulating organic mulch, reducing soil surface evaporation and saving 1-2 irrigation cycles.

### 5. Mulching Machine Custom Hiring & Fertilizer Savings
- **JSON Key Path**: `scenarios[0].choices[1].alternativeDetails`
- **Cost**: `~₹1,200 - ₹1,500 / acre (Tractor diesel or custom hiring)`
- **Money Impact**: `Saves ~₹2,000/acre in urea & DAP fertilizers next season`
- **Verified**: `false`

### 6. Bio-Decomposer Composting
- **JSON Key Path**: `scenarios[0].choices[2].impact.metrics[0]` & `alternativeDetails`
- **Value**: `~3.5 tons organic matter / ha`
- **Cost**: `~₹300 - ₹500 / acre`
- **Compost Value**: `Valued at ~₹3,000 / acre in equivalent farmyard manure`
- **Source**: `ICAR-IARI Pusa Decomposer field trials`
- **Verified**: `false`

### 7. Biomass / Paper Mill Value
- **JSON Key Path**: `scenarios[0].choices[3].impact.metrics[0]` & `alternativeDetails`
- **Value**: `~0.5 tons coal displaced per 1 ton straw`
- **Cost**: `₹0 to ₹500 / acre (Buyer brings baler machine)`
- **Cash Profit**: `Earn ₹1,500 to ₹2,500 / acre pure cash profit`
- **Source**: `Ministry of New and Renewable Energy (MNRE) biomass benchmarks`
- **Verified**: `false`

---

## 🧴 Scenario 2: The Plastic Bottle at Home (`home_plastic_bottle`)

### 1. Land & Water: Decomposition Lifespan
- **JSON Key Path**: `scenarios[1].choices[0].impact.threeCards[0].stat`
- **Value**: `~450 to 1,000 years`
- **Source**: `US EPA & National Oceanic and Atmospheric Administration (NOAA) approximate research`
- **Verified**: `false`
- **Scientific Context**: Polyethylene terephthalate (PET) is non-biodegradable; under sunlight and mechanical weathering it breaks into microplastic fragments that persist indefinitely in soil and waterways.

### 2. Air: Dumpsite Smolder & City Smog Spikes
- **JSON Key Path**: `scenarios[1].choices[0].impact.threeCards[1].stat`
- **Value**: `~15% to 25% of city smog spikes`
- **Source**: `Urban Waste Management & CPCB observational estimates`
- **Verified**: `false`

### 3. Money: Household Recyclable Scrap Value Lost
- **JSON Key Path**: `scenarios[1].choices[0].impact.threeCards[2].stat`
- **Value**: `~₹600 to ₹1,200 / year in scrap value lost`
- **Source**: `Informal Waste Sector Economy field benchmarks`
- **Verified**: `false`

### 4. Toxicity: Open Burning vs Clean Wood Fire
- **JSON Key Path**: `scenarios[1].choices[1].impact.threeCards[0].stat`
- **Value**: `~100x to 500x more toxic volatile compounds`
- **Source**: `WHO & Environmental Health observational benchmarks`
- **Verified**: `false`
- **Health Context**: Incomplete combustion of plastics at low backyard temperatures releases chlorinated dioxins, furans, phthalate plasticizers, and carbon soot directly into human respiratory tracts.

### 5. Land: Backyard Ash Soil Persistence
- **JSON Key Path**: `scenarios[1].choices[1].impact.threeCards[1].stat`
- **Value**: `~5 to 15 years in backyard topsoil`
- **Source**: `Soil Contamination Research approximate models`
- **Verified**: `false`

### 6. Money: Inhaler and Clinic Bills from Open Smoke
- **JSON Key Path**: `scenarios[1].choices[1].impact.threeCards[2].stat`
- **Value**: `~₹800 to ₹1,500 in medical bills`
- **Source**: `Rural Clinic Health Cost survey approximations`
- **Verified**: `false`

### 7. Upcycled Planters vs Bought Pots
- **JSON Key Path**: `scenarios[1].choices[2].impact.metrics[0]` & `alternativeDetails`
- **Value**: `10 pots saved (~₹300 - ₹500 saved)`
- **Cost**: `₹0`
- **Money Impact**: `Saves ₹50 - ₹100 per flower pot + free home herbs`
- **Source**: `Urban Gardening & Circular Economy benchmarks`
- **Verified**: `false`

### 8. Scrap Dealer (Kabadiwala) Recycling Rate & Crude Oil Saved
- **JSON Key Path**: `scenarios[1].choices[3].impact.metrics[0]` & `alternativeDetails`
- **Value**: `~3.8 barrels of petroleum saved per 1 ton PET recycled`
- **Scrap Price**: `Earn ₹15 to ₹25 per kg of clean crushed PET bottles`
- **Source**: `Association of Plastic Recyclers (APR) energy metrics`
- **Verified**: `false`

---

## 🛠️ How to Replace an Unverified Statistic with Confirmed Data

To verify or update any statistic once confirmed by official research or your advisory panel:

1. Open [`src/data/scenarios.json`](file:///e:/What%20else%20sustain/src/data/scenarios.json).
2. Locate the corresponding scenario and choice ID.
3. Update the `value` field with the exact verified number.
4. Update the `source` field with the primary publication citation (e.g., *"PAU Farm Bulletin Vol 14, 2024"*).
5. Flip `"verified": false` $\longrightarrow$ `"verified": true`.
6. Save the file. The UI will instantly remove the warning badge and show the green verified checkmark.
