/**
 * gameBalance.js
 * Central Game Design Balance Configurations for What Else Sustain.
 * 
 * DISCLAIMER & DESIGN NOTE:
 * These values are game-design balancing parameters calibrated to provide
 * meaningful progression, clear feedback, and an engaging educational loop.
 * They are designed for educational pair gameplay, not scientific claims
 * or calibrated laboratory measurements.
 */

export const GAME_BALANCE = {
  // --- Initial Farm & Village State ---
  INITIAL_STATE: {
    soilHealth: 70,       // 0-100: Soil organic matter & microbial vitality
    villageHealth: 75,    // 0-100: Community respiratory health & clean air
    money: 12000,         // In Rupees (₹): Capital available for seeds & machinery
    reputation: 50,       // 0-100: Trust and goodwill with village elders and peers
    streak: 0,            // Consecutive sustainable seasons with zero burning
    seasonIndex: 1,       // 1, 2, 3...
    yearIndex: 1,         // 1, 2, 3...
    farmerLevel: 1,       // 1 to 5
    farmerXP: 0           // Current experience points
  },

  // --- Sowing Skill Mini-Game ---
  SOWING: {
    ROW_COUNT: 4,                  // Player completes 4 seed passes
    HOLD_DURATION_SEC: 1.8,        // Target hold duration per row
    SWEET_SPOT_MIN: 0.65,          // Normalized progress window for "Perfect"
    SWEET_SPOT_MAX: 0.85,          // Normalized progress window for "Perfect"
    PERFECT_XP_BONUS: 25,          // Bonus XP for hitting the sweet spot
    PERFECT_YIELD_BONUS: 0.10,     // +10% crop density next season
    GOOD_XP_BONUS: 10              // Bonus XP for near-target release
  },

  // --- Baseline Season Harvest Revenue ---
  HARVEST: {
    BASE_CROP_REVENUE: 24000,      // Baseline gross crop sale (scaled by soilHealth)
    MIN_CROP_REVENUE: 11000        // Floor revenue even if soil is severely depleted
  },

  // --- Decision Impacts (Carried over to future seasons) ---
  DECISIONS: {
    // 1. Stubble Burning (The Mistake)
    burn: {
      id: 'burn',
      name: 'Open Field Burning',
      soilHealthDelta: -25,        // Destroys topsoil biology, nitrogen & worms
      villageHealthDelta: -30,     // Thick smoke blankets village
      reputationDelta: -20,        // Disapproval from neighbors & environmental elders
      moneyCost: 0,                // Seems free up-front (the short-term illusion!)
      revenueYieldPenalty: 0.30,   // Next crop produces 30% less grain
      densityFactor: 0.70,         // Visibly sparser crop next season (70% density)
      colorYellowingFactor: 0.28,  // Noticeably pale/yellowing crop foliage
      streakReset: true,
      xpAward: 15
    },

    // 2. Happy Seeder (Direct Zero-Till Sowing)
    happy_seeder: {
      id: 'happy_seeder',
      name: 'Happy Seeder Direct Drilling',
      soilHealthDelta: +14,        // Stubble retains moisture and enriches soil
      villageHealthDelta: +18,     // Zero smoke, clean village air
      reputationDelta: +16,        // Respected for modern conservation farming
      moneyCost: -2500,            // Machine rental & fuel
      revenueYieldBonus: 0.12,     // Next crop yield +12% from improved moisture retention
      densityFactor: 1.05,         // Healthier, denser crop
      colorYellowingFactor: 0.0,
      streakIncrement: true,
      xpAward: 65
    },

    // 3. Straw Baler & Industrial Sale
    bale_sell: {
      id: 'bale_sell',
      name: 'Bale & Sell to Bio-Energy Plant',
      soilHealthDelta: +6,         // Soil preserved; roots left intact
      villageHealthDelta: +20,     // Zero open burning in the district
      reputationDelta: +18,        // Praised for enterprise and clean logistics
      moneyCost: 0,
      revenueYieldBonus: 0.05,
      baleSaleGrossIncome: 15000,  // Direct income from bio-energy aggregator
      densityFactor: 1.02,
      colorYellowingFactor: 0.0,
      streakIncrement: true,
      xpAward: 75
    },

    // 4. In-Situ Mulching
    mulch: {
      id: 'mulch',
      name: 'Surface Mulch Layer',
      soilHealthDelta: +20,        // Moisture retention +40%, suppresses weeds
      villageHealthDelta: +16,     // Clean atmosphere
      reputationDelta: +12,        // Admired for soil-first conservation mindset
      moneyCost: -1200,            // Mulcher tractor pass fuel
      revenueYieldBonus: 0.15,     // Moisture buffer yields great returns
      densityFactor: 1.10,         // Lush, vibrant crop density
      colorYellowingFactor: -0.1,  // Deep lush green foliage
      streakIncrement: true,
      xpAward: 60
    },

    // 5. Bio-Decomposer Spray (Compost)
    compost: {
      id: 'compost',
      name: 'Bio-Decomposer Compost Spray',
      soilHealthDelta: +24,        // Rapid fungal conversion to rich organic compost
      villageHealthDelta: +18,     // Pure air and restored soil biome
      reputationDelta: +14,        // Progressive eco-friendly farmer
      moneyCost: -800,             // Enzyme spray microbial culture kit
      revenueYieldBonus: 0.16,     // High organic carbon boost
      densityFactor: 1.12,         // Highest microbial & worm count
      colorYellowingFactor: -0.15, // Deepest vibrant emerald green
      streakIncrement: true,
      xpAward: 70
    }
  },

  // --- XP Level Thresholds ---
  LEVELS: [
    { level: 1, title: 'Novice Cultivator', xpNeeded: 0 },
    { level: 2, title: 'Soil Apprentice', xpNeeded: 120 },
    { level: 3, title: 'Conservation Farmer', xpNeeded: 300 },
    { level: 4, title: 'Regenerative Pioneer', xpNeeded: 550 },
    { level: 5, title: 'Master of Sustainable Fields', xpNeeded: 900 }
  ],

  // --- Season Ranks ---
  RANKS: {
    S: { rank: 'S', minScore: 90, title: 'Steward of the Earth', badgeColor: '#FFD700', bg: 'linear-gradient(135deg, #FFF8E1, #FFECB3)' },
    A: { rank: 'A', minScore: 75, title: 'Sustainable Vanguard', badgeColor: '#4CAF50', bg: 'linear-gradient(135deg, #E8F5E9, #C8E6C9)' },
    B: { rank: 'B', minScore: 55, title: 'Developing Practice', badgeColor: '#0288D1', bg: 'linear-gradient(135deg, #E1F5FE, #B3E5FC)' },
    C: { rank: 'C', minScore: 0,  title: 'Severe Ecosystem Strain', badgeColor: '#E65100', bg: 'linear-gradient(135deg, #FBE9E7, #FFCCBC)' }
  },

  // --- 12 Structured Achievements ---
  ACHIEVEMENTS: [
    {
      id: 'first_season',
      title: 'First Harvest',
      desc: 'Complete your first farming season.',
      icon: '🌱',
      condition: (state) => state.seasonIndex > 1 || state.history?.length >= 1
    },
    {
      id: 'first_clear_sky',
      title: 'Clear Sky Pioneer',
      desc: 'Finish a season without burning any straw piles.',
      icon: '🌤️',
      condition: (state) => state.streak >= 1
    },
    {
      id: 'three_seasons_clean',
      title: 'Breath of Fresh Air',
      desc: 'Achieve 3 consecutive sustainable seasons without fire.',
      icon: '🌬️',
      condition: (state) => state.streak >= 3
    },
    {
      id: 'soil_savior',
      title: 'Soil Savior',
      desc: 'Nurture soil health above 88 points.',
      icon: '🪱',
      condition: (state) => state.soilHealth >= 88
    },
    {
      id: 'village_guardian',
      title: 'Village Guardian',
      desc: 'Elevate village health above 88 points.',
      icon: '🏡',
      condition: (state) => state.villageHealth >= 88
    },
    {
      id: 'fast_hands',
      title: 'Green Thumb Rhythm',
      desc: 'Execute a perfect timing release during seed sowing.',
      icon: '🎯',
      condition: (state) => state.perfectSowingCount >= 1
    },
    {
      id: 'biomass_tycoon',
      title: 'Biomass Merchant',
      desc: 'Earn ₹30,000 or more in cumulative straw baling sales.',
      icon: '💰',
      condition: (state) => state.totalBaleIncome >= 30000
    },
    {
      id: 'happy_seeder_hero',
      title: 'Happy Seeder Hero',
      desc: 'Adopt direct Happy Seeder drilling twice.',
      icon: '🚜',
      condition: (state) => state.happySeederUses >= 2
    },
    {
      id: 'compost_master',
      title: 'Microbial Alchemist',
      desc: 'Transform crop residue into living bio-compost twice.',
      icon: '🧪',
      condition: (state) => state.compostUses >= 2
    },
    {
      id: 'mulch_pioneer',
      title: 'Moisture Master',
      desc: 'Apply mulch across the field to protect the topsoil.',
      icon: '🌾',
      condition: (state) => state.mulchUses >= 1
    },
    {
      id: 'pillar_of_community',
      title: 'Pillar of the Village',
      desc: 'Attain a farmer reputation score of 85 or higher.',
      icon: '👑',
      condition: (state) => state.reputation >= 85
    },
    {
      id: 'five_season_legend',
      title: 'Regenerative Master',
      desc: 'Complete 5 seasons of stewardship.',
      icon: '🏆',
      condition: (state) => state.seasonIndex >= 5 || state.history?.length >= 5
    }
  ],

  // --- Seasonal Deterministic Events (1 per season) ---
  EVENTS: [
    {
      id: 'event_wind_shift',
      title: 'Sudden Autumn Gale',
      desc: 'Winds have shifted briskly towards the village school and health clinic.',
      icon: '🌬️',
      visualCue: 'wind_high',
      optionA: {
        label: 'Delay action & monitor breeze',
        effectText: 'Air exposure risk minimized.',
        apply: (state) => ({ ...state, reputation: Math.min(100, state.reputation + 4) })
      },
      optionB: {
        label: 'Distribute cloth face covers to school',
        effectText: 'Cost ₹500, Village health +6, Reputation +8',
        apply: (state) => ({
          ...state,
          money: Math.max(0, state.money - 500),
          villageHealth: Math.min(100, state.villageHealth + 6),
          reputation: Math.min(100, state.reputation + 8)
        })
      }
    },
    {
      id: 'event_neighbour_drift',
      title: "Neighbour's Stubble Fire",
      desc: 'Thick smoke drifts from a distant field where a neighbor ignited their paddy straw.',
      icon: '🔥',
      visualCue: 'distant_smoke',
      optionA: {
        label: 'Demonstrate the Baler machine to neighbor',
        effectText: 'Cost ₹800 fuel, Village health +8, Reputation +12',
        apply: (state) => ({
          ...state,
          money: Math.max(0, state.money - 800),
          villageHealth: Math.min(100, state.villageHealth + 8),
          reputation: Math.min(100, state.reputation + 12)
        })
      },
      optionB: {
        label: 'Focus on own farm boundaries',
        effectText: 'No cost, but air haze lingers.',
        apply: (state) => ({
          ...state,
          villageHealth: Math.max(0, state.villageHealth - 6)
        })
      }
    },
    {
      id: 'event_unseasonal_rain',
      title: 'Unseasonal Monsoon Shower',
      desc: 'A gentle 2-hour rain shower dampens the fields and raises soil moisture.',
      icon: '🌧️',
      visualCue: 'rain',
      optionA: {
        label: 'Incorporate moisture into soil with mulch',
        effectText: 'Soil Health +8, next crop density boosted!',
        apply: (state) => ({
          ...state,
          soilHealth: Math.min(100, state.soilHealth + 8)
        })
      },
      optionB: {
        label: 'Store rainwater in canal trench',
        effectText: 'Water clarity improved, Reputation +5',
        apply: (state) => ({
          ...state,
          reputation: Math.min(100, state.reputation + 5)
        })
      }
    },
    {
      id: 'event_inspector_visit',
      title: 'Agricultural Officer Inspection',
      desc: 'The district agricultural officer visits to review residue management.',
      icon: '📋',
      visualCue: 'inspector',
      optionA: {
        label: 'Present clean residue logs & soil cutaway',
        effectText: state => state.streak > 0 ? 'Awarded ₹3,500 Sustainable Farmer Grant!' : 'Encouraged to adopt alternatives.',
        apply: (state) => ({
          ...state,
          money: state.streak > 0 ? state.money + 3500 : state.money,
          reputation: Math.min(100, state.reputation + 10)
        })
      },
      optionB: {
        label: 'Request bio-decomposer demonstration',
        effectText: 'Cost ₹400, Soil awareness +6, XP +35',
        apply: (state) => ({
          ...state,
          money: Math.max(0, state.money - 400),
          farmerXP: state.farmerXP + 35,
          soilHealth: Math.min(100, state.soilHealth + 6)
        })
      }
    },
    {
      id: 'event_baler_subsidy',
      title: 'Clean Energy Biomass Scheme',
      desc: 'A nearby compressed biogas plant offers a direct incentive for paddy straw bales.',
      icon: '⚡',
      visualCue: 'subsidy',
      optionA: {
        label: 'Sign up for bulk baling reservation',
        effectText: 'Next baling sale earns +₹4,000 bonus!',
        apply: (state) => ({
          ...state,
          money: state.money + 4000,
          reputation: Math.min(100, state.reputation + 6)
        })
      },
      optionB: {
        label: 'Co-op share with neighboring farmers',
        effectText: 'Reputation +14, Village Health +5',
        apply: (state) => ({
          ...state,
          villageHealth: Math.min(100, state.villageHealth + 5),
          reputation: Math.min(100, state.reputation + 14)
        })
      }
    }
  ]
}

/**
 * Deterministically pick an event for a given season index
 */
export function getSeasonEvent(seasonIndex) {
  const events = GAME_BALANCE.EVENTS
  const idx = Math.abs(Math.floor((seasonIndex - 1) * 9301 + 49297)) % events.length
  return events[idx]
}
