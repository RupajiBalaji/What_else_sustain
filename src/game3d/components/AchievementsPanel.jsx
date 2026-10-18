import React from 'react'
import { motion } from 'framer-motion'
import { useGame3D } from '../context/Game3DContext'
import { GAME_BALANCE } from '../config/gameBalance'

export default function AchievementsPanel({ isOpen, onClose }) {
  const { persistentState } = useGame3D()

  if (!isOpen) return null

  const unlockedIds = persistentState?.unlockedAchievements || []
  const allAchievements = GAME_BALANCE.ACHIEVEMENTS

  const unlockedCount = allAchievements.filter((a) => unlockedIds.includes(a.id)).length

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        zIndex: 150,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backdropFilter: 'blur(5px)',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          border: '3px solid #2E7D32',
          boxShadow: '0 16px 48px rgba(0,0,0,0.35)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            backgroundColor: '#1B5E20',
            color: '#FFFFFF',
            padding: '16px 22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.6rem' }}>🏆</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900 }}>
                Achievements & Honors
              </h3>
              <div style={{ fontSize: '0.75rem', color: '#A5D6A7', fontWeight: 700 }}>
                Unlocked {unlockedCount} of {allAchievements.length} Badges
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '1rem',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        {/* Badges Grid */}
        <div
          style={{
            padding: '18px 22px',
            overflowY: 'auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
            gap: '12px'
          }}
        >
          {allAchievements.map((ach) => {
            const isUnlocked = unlockedIds.includes(ach.id)
            return (
              <div
                key={ach.id}
                style={{
                  border: isUnlocked ? '2px solid #81C784' : '1.5px dashed #BDBDBD',
                  backgroundColor: isUnlocked ? '#F1F8E9' : '#FAFAFA',
                  borderRadius: '16px',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  opacity: isUnlocked ? 1 : 0.65
                }}
              >
                <div
                  style={{
                    fontSize: '1.8rem',
                    lineHeight: 1,
                    filter: isUnlocked ? 'none' : 'grayscale(100%)'
                  }}
                >
                  {isUnlocked ? ach.icon : '🔒'}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 900,
                      color: isUnlocked ? '#1B5E20' : '#424242',
                      marginBottom: '2px'
                    }}
                  >
                    {ach.title}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#616161', lineHeight: 1.35, fontWeight: 600 }}>
                    {ach.desc}
                  </div>
                  {isUnlocked && (
                    <div
                      style={{
                        marginTop: '4px',
                        display: 'inline-block',
                        fontSize: '0.65rem',
                        fontWeight: 900,
                        color: '#2E7D32',
                        textTransform: 'uppercase'
                      }}
                    >
                      ✓ Unlocked
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 22px', borderTop: '1px solid #EEEEEE', textAlign: 'right' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 20px',
              backgroundColor: '#2E7D32',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 800,
              fontSize: '0.88rem',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  )
}
