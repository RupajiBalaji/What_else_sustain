import React from 'react'
import { useGame3D } from '../context/Game3DContext'
import { ManagedOverlay } from '../ui/OverlayManager'
import { computeChoiceFinancials } from '../config/economy'

/**
 * Floating financial outcome badge displayed directly above the farmer.
 * Reads real impact values from scenarios.json via economy.js and agrees
 * to the rupee with the HUD balance and Season Report.
 */
export default function MoneyFloatingTag({ position = [0, 2.35, 0] }) {
  // Merged into the single ConsequenceCallouts card so burn/alternatives never show duplicate money cards
  // or collide with SmokeMeterHUD on 360x640 / 390x844 phones.
  return <group />
}
