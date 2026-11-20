import React from 'react'

export function PrivacyModal({ onClose }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          maxWidth: '520px',
          width: '100%',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            backgroundColor: '#16382B',
            color: '#FFFFFF',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 900, fontSize: '1.05rem' }}>
            <span>🔒</span>
            <span>Privacy & Student Transparency</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'none',
              border: 'none',
              color: '#FFFFFF',
              fontSize: '1.2rem',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: '20px', overflowY: 'auto', fontSize: '0.85rem', color: '#3E2723', lineHeight: 1.5 }}>
          <h4 style={{ margin: '0 0 6px 0', color: '#2E7D32', fontSize: '0.95rem' }}>
            1. Zero Personal Data Collected
          </h4>
          <p style={{ margin: '0 0 14px 0' }}>
            <strong>What Else Sustain</strong> is an educational simulation. We do not collect names, email addresses, phone numbers, IP addresses, or permanent device identifiers.
          </p>

          <h4 style={{ margin: '0 0 6px 0', color: '#2E7D32', fontSize: '0.95rem' }}>
            2. Anonymous Telemetry
          </h4>
          <p style={{ margin: '0 0 14px 0' }}>
            Gameplay choices (e.g. Happy Seeder vs Burning) and quiz question score deltas are linked only to random, temporary session IDs (e.g. <code>wes_...</code>) or optional 6-character classroom codes.
          </p>

          <h4 style={{ margin: '0 0 6px 0', color: '#2E7D32', fontSize: '0.95rem' }}>
            3. Minors & Student Protection (COPPA & DPDP Act)
          </h4>
          <p style={{ margin: '0 0 14px 0' }}>
            Because students under 18 play this game, we adhere strictly to child data protection guidelines (COPPA and India’s DPDP Act). No advertising pixels, tracking cookies, or profiling tools are installed or loaded.
          </p>

          <h4 style={{ margin: '0 0 6px 0', color: '#2E7D32', fontSize: '0.95rem' }}>
            4. AI Model Usage
          </h4>
          <p style={{ margin: '0 0 14px 0' }}>
            When asking sustainability questions in the AI Advisor, prompts are processed anonymously through server-side APIs without user account attachment.
          </p>

          <h4 style={{ margin: '0 0 6px 0', color: '#2E7D32', fontSize: '0.95rem' }}>
            5. Contact & Questions
          </h4>
          <p style={{ margin: 0 }}>
            Questions regarding simulation data or classroom use can be directed to the repository administrator via GitHub.
          </p>
        </div>

        <div style={{ padding: '12px 20px', backgroundColor: '#F5F5F5', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 18px',
              backgroundColor: '#2E7D32',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  )
}
export default PrivacyModal
