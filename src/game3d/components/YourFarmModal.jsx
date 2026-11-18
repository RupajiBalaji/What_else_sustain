import React, { useState } from 'react'
import { safeStorage } from '../../utils/safeStorage'

const STATES = [
  { id: 'Punjab', label: 'Punjab' },
  { id: 'Haryana', label: 'Haryana' },
  { id: 'Uttar Pradesh', label: 'Uttar Pradesh (UP)' },
  { id: 'Telangana', label: 'Telangana' },
  { id: 'Andhra Pradesh', label: 'Andhra Pradesh' },
]

const CROPS = [
  { id: 'paddy', label: 'Paddy (Rice)' },
  { id: 'wheat', label: 'Wheat' },
]

export default function YourFarmModal({ initialProfile, onSave, onClose, isSettings = false }) {
  const [state, setState] = useState(initialProfile?.state || 'Punjab')
  const [crop, setCrop] = useState(initialProfile?.crop || 'paddy')
  const [acres, setAcres] = useState(initialProfile?.acres || 5)

  const strawTons = (acres * 2.5).toFixed(1)

  const handleUseDefaults = () => {
    setState('Punjab')
    setCrop('paddy')
    setAcres(5)
  }

  const handleConfirm = () => {
    const profile = {
      state,
      crop,
      acres: Number(acres),
      strawTons: Number(strawTons)
    }
    try {
      safeStorage.setItem('wes_farm_profile', JSON.stringify(profile))
    } catch {
      // Safe fallback
    }
    onSave(profile)
  }

  return (
    <div
      data-testid="your-farm-modal"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 110,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: 'rgba(20, 26, 32, 0.96)',
          color: '#E0E0E0',
          borderRadius: '16px',
          border: '1.5px solid rgba(255, 255, 255, 0.14)',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6)',
          padding: '24px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#81C784', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🚜</span>
            <span>Your Farm Profile</span>
          </h2>
          {isSettings && onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#B0BEC5',
                fontSize: '1.2rem',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              ✕
            </button>
          )}
        </div>

        <p style={{ margin: 0, fontSize: '0.84rem', color: '#90A4AE', lineHeight: 1.4 }}>
          Personalise your farm region, crop type, and field scale. The simulation and AI director adapt local economics to your field.
        </p>

        {/* State Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#CFD8DC' }}>State / Region</label>
          <select
            data-testid="your-farm-state-select"
            value={state}
            onChange={(e) => setState(e.target.value)}
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              backgroundColor: '#1C2630',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#FFFFFF',
              fontSize: '0.9rem',
              fontWeight: 600,
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {STATES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Crop Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#CFD8DC' }}>Harvested Crop</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            {CROPS.map((c) => (
              <button
                key={c.id}
                type="button"
                data-testid={`crop-select-${c.id}`}
                onClick={() => setCrop(c.id)}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: '8px',
                  backgroundColor: crop === c.id ? '#2E7D32' : '#1C2630',
                  color: '#FFFFFF',
                  border: crop === c.id ? '1.5px solid #81C784' : '1px solid rgba(255, 255, 255, 0.15)',
                  fontSize: '0.86rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Acres Stepper / Slider */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#CFD8DC' }}>Cultivated Area</label>
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#FFB74D' }}>
              {acres} Acres <span style={{ fontSize: '0.76rem', color: '#B0BEC5' }}>(~{strawTons} t straw)</span>
            </span>
          </div>
          <input
            type="range"
            data-testid="your-farm-acres-slider"
            min="1"
            max="20"
            step="1"
            value={acres}
            onChange={(e) => setAcres(Number(e.target.value))}
            style={{
              width: '100%',
              accentColor: '#4CAF50',
              cursor: 'pointer'
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#78909C' }}>
            <span>1 Acre</span>
            <span>10 Acres</span>
            <span>20 Acres</span>
          </div>
        </div>

        {/* Sourced Data Honesty Note */}
        <div
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            borderLeft: '3px solid #FFB74D',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '0.74rem',
            color: '#B0BEC5',
            lineHeight: 1.35
          }}
        >
          <span>🌱 Figures use the nearest sourced region and are labelled (Source: NPMCR / ICAR).</span>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
          <button
            type="button"
            data-testid="your-farm-defaults-btn"
            onClick={handleUseDefaults}
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              backgroundColor: 'transparent',
              color: '#B0BEC5',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Use defaults
          </button>
          <button
            type="button"
            data-testid="your-farm-confirm-btn"
            onClick={handleConfirm}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: '8px',
              backgroundColor: '#2E7D32',
              color: '#FFFFFF',
              border: '1.5px solid #4CAF50',
              fontSize: '0.92rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(46, 125, 50, 0.4)'
            }}
          >
            {isSettings ? 'Save Profile' : 'Confirm Farm & Play'}
          </button>
        </div>
      </div>
    </div>
  )
}
