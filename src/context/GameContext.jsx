import React, { createContext, useContext, useState, useEffect } from 'react'
import { safeStorage } from '../utils/safeStorage'

const GameContext = createContext(null)
const STORAGE_KEY = 'wes_game_state_v2'

const INITIAL_STATE = {
  natureHealth: 60, // 0 - 100
  points: 0,
  completedScenarios: [],
  mistakesExplored: [],
  badges: [], // e.g. ['soil_saver', 'plastic_buster', 'curious_mind', 'green_guardian']
  recentBadge: null
}

export function GameProvider({ children }) {
  const [gameState, setGameState] = useState(() => {
    try {
      const saved = safeStorage.getItem(STORAGE_KEY)
      if (saved) {
        return { ...INITIAL_STATE, ...JSON.parse(saved) }
      }
    } catch (err) {
      console.warn('[GameContext] Parse error from saved state:', err)
    }
    return INITIAL_STATE
  })

  useEffect(() => {
    safeStorage.setItem(STORAGE_KEY, JSON.stringify(gameState))
  }, [gameState])

  const modifyNatureHealth = (delta) => {
    setGameState((prev) => {
      const nextHealth = Math.min(100, Math.max(0, prev.natureHealth + delta))
      let newBadges = [...prev.badges]
      if (nextHealth >= 80 && !newBadges.includes('green_guardian')) {
        newBadges.push('green_guardian')
      }
      return {
        ...prev,
        natureHealth: nextHealth,
        badges: newBadges
      }
    })
  }

  const addPoints = (amount) => {
    setGameState((prev) => {
      const newPoints = Math.max(0, prev.points + amount)
      return { ...prev, points: newPoints }
    })
  }

  const unlockBadge = (badgeKey) => {
    setGameState((prev) => {
      if (prev.badges.includes(badgeKey)) return prev
      return {
        ...prev,
        badges: [...prev.badges, badgeKey],
        recentBadge: badgeKey
      }
    })
  }

  const clearRecentBadge = () => {
    setGameState((prev) => ({ ...prev, recentBadge: null }))
  }

  const markScenarioCompleted = (scenarioId) => {
    setGameState((prev) => {
      if (prev.completedScenarios.includes(scenarioId)) return prev
      return {
        ...prev,
        completedScenarios: [...prev.completedScenarios, scenarioId]
      }
    })
  }

  const recordMistakeExplored = (choiceId) => {
    setGameState((prev) => {
      if (prev.mistakesExplored.includes(choiceId)) return prev
      return {
        ...prev,
        mistakesExplored: [...prev.mistakesExplored, choiceId]
      }
    })
  }

  const resetProgress = () => {
    setGameState(INITIAL_STATE)
    safeStorage.removeItem(STORAGE_KEY)
  }

  // Calculate Level and Progress (Seedling, Sapling, Tree, Forest)
  let currentLevelKey = 'seedling'
  let levelNumber = 1
  let nextLevelPoints = 50
  let currentLevelBase = 0

  if (gameState.points >= 200) {
    currentLevelKey = 'forest'
    levelNumber = 4
    currentLevelBase = 200
    nextLevelPoints = 300
  } else if (gameState.points >= 100) {
    currentLevelKey = 'tree'
    levelNumber = 3
    currentLevelBase = 100
    nextLevelPoints = 200
  } else if (gameState.points >= 50) {
    currentLevelKey = 'sapling'
    levelNumber = 2
    currentLevelBase = 50
    nextLevelPoints = 100
  } else {
    currentLevelKey = 'seedling'
    levelNumber = 1
    currentLevelBase = 0
    nextLevelPoints = 50
  }

  const levelProgressPercent = Math.min(
    100,
    Math.round(((gameState.points - currentLevelBase) / (nextLevelPoints - currentLevelBase)) * 100)
  )

  return (
    <GameContext.Provider
      value={{
        ...gameState,
        modifyNatureHealth,
        addPoints,
        unlockBadge,
        clearRecentBadge,
        markScenarioCompleted,
        recordMistakeExplored,
        resetProgress,
        levelNumber,
        currentLevelKey,
        levelProgressPercent,
        nextLevelPoints
      }}
    >
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error('useGame must be used within a GameProvider')
  }
  return context
}
