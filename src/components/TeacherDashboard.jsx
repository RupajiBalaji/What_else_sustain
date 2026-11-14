import React, { useState, useEffect, useCallback } from 'react'
import { safeStorage } from '../utils/safeStorage'

const TEACHER_CLASSES_KEY = 'wes_teacher_classes_v1'

export default function TeacherDashboard({ onExitToGame }) {
  // Saved classes in teacher's browser: [{ code, token, name }]
  const [classes, setClasses] = useState(() => {
    try {
      const raw = safeStorage.getItem(TEACHER_CLASSES_KEY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })

  // Check URL params for ?code=...&token=...
  const [activeCode, setActiveCode] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')
      if (code) return code.toUpperCase()
    }
    const raw = safeStorage.getItem(TEACHER_CLASSES_KEY)
    if (raw) {
      try {
        const list = JSON.parse(raw)
        if (list.length > 0) return list[0].code
      } catch {}
    }
    return ''
  })

  const [activeToken, setActiveToken] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const token = params.get('token')
      if (token) return token
    }
    const raw = safeStorage.getItem(TEACHER_CLASSES_KEY)
    if (raw) {
      try {
        const list = JSON.parse(raw)
        if (list.length > 0) return list[0].token
      } catch {}
    }
    return ''
  })

  const [dashboardData, setDashboardData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [newClassName, setNewClassName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [copied, setCopied] = useState(false)

  // Fetch Dashboard Metrics
  const fetchDashboard = useCallback(async (code, token) => {
    if (!code || !token) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/classes/${code}/dashboard?token=${encodeURIComponent(token)}`)
      if (!res.ok) {
        throw new Error(`Failed to load dashboard (HTTP ${res.status})`)
      }
      const data = await res.json()
      setDashboardData(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeCode && activeToken) {
      fetchDashboard(activeCode, activeToken)
      const interval = setInterval(() => {
        fetchDashboard(activeCode, activeToken)
      }, 10000)
      return () => clearInterval(interval)
    }
  }, [activeCode, activeToken, fetchDashboard])

  // Create New Class
  const handleCreateClass = async (e) => {
    e.preventDefault()
    if (!newClassName.trim()) return

    setIsCreating(true)
    setError(null)
    try {
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newClassName.trim() })
      })
      if (!res.ok) {
        throw new Error('Failed to create class')
      }
      const created = await res.json()
      const newEntry = {
        code: created.class_code,
        token: created.teacher_token,
        name: created.name
      }
      const updatedList = [newEntry, ...classes.filter((c) => c.code !== created.class_code)]
      setClasses(updatedList)
      safeStorage.setItem(TEACHER_CLASSES_KEY, JSON.stringify(updatedList))
      setActiveCode(created.class_code)
      setActiveToken(created.teacher_token)
      setNewClassName('')
    } catch (err) {
      setError(err.message)
    } finally {
      setIsCreating(false)
    }
  }

  const handleSelectClass = (cls) => {
    setActiveCode(cls.code)
    setActiveToken(cls.token)
  }

  const handleCopyCode = () => {
    if (!activeCode) return
    navigator.clipboard?.writeText(activeCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handleDownloadCsv = () => {
    if (!activeCode || !activeToken) return
    window.location.href = `/api/classes/${activeCode}/export.csv?token=${encodeURIComponent(activeToken)}`
  }

  return (
    <div
      data-testid="teacher-dashboard-page"
      style={{
        minHeight: '100vh',
        backgroundColor: '#0F151B',
        color: '#FFFFFF',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}
    >
      <div style={{ width: '100%', maxWidth: '860px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.12)', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '2rem' }}>🎓</span>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#A5D6A7' }}>
                Teacher Class Dashboard
              </h1>
              <div style={{ fontSize: '0.78rem', color: '#90A4AE', marginTop: '2px' }}>
                Track student choices, air quality impacts, and quiz learning gains
              </div>
            </div>
          </div>

          <button
            onClick={onExitToGame}
            style={{
              padding: '8px 16px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '10px',
              color: '#CFD8DC',
              fontWeight: 700,
              fontSize: '0.84rem',
              cursor: 'pointer'
            }}
          >
            ➔ Return to Game
          </button>
        </div>

        {/* Privacy Note Banner (Mandatory per S12) */}
        <div
          style={{
            backgroundColor: 'rgba(46, 125, 50, 0.12)',
            border: '1px solid rgba(129, 199, 132, 0.3)',
            borderRadius: '12px',
            padding: '12px 16px',
            fontSize: '0.78rem',
            color: '#C8E6C9',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>🛡️</span>
          <span>
            <strong>Student Privacy Guaranteed:</strong> No student names, emails, or personal tracking are collected. All telemetry is fully anonymized.
          </span>
        </div>

        {/* Create Class Section */}
        <div
          style={{
            backgroundColor: 'rgba(20, 26, 32, 0.96)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            padding: '18px 20px'
          }}
        >
          <h3 style={{ margin: '0 0 12px 0', fontSize: '0.98rem', fontWeight: 800, color: '#FFFFFF' }}>
            Create a New Class
          </h3>
          <form onSubmit={handleCreateClass} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input
              type="text"
              data-testid="create-class-name-input"
              placeholder="Class Name (e.g. Grade 9 Science - Period 3)"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              style={{
                flex: 1,
                minWidth: '240px',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                color: '#FFFFFF',
                fontSize: '0.88rem'
              }}
            />
            <button
              type="submit"
              data-testid="create-class-submit-btn"
              disabled={isCreating || !newClassName.trim()}
              style={{
                padding: '10px 22px',
                borderRadius: '10px',
                backgroundColor: '#2E7D32',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '0.88rem',
                border: 'none',
                cursor: isCreating || !newClassName.trim() ? 'not-allowed' : 'pointer'
              }}
            >
              {isCreating ? 'Creating...' : '+ Create Class'}
            </button>
          </form>
        </div>

        {/* Saved Classes Tabs */}
        {classes.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            {classes.map((cls) => {
              const isActive = cls.code === activeCode
              return (
                <button
                  key={cls.code}
                  type="button"
                  onClick={() => handleSelectClass(cls)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '10px',
                    backgroundColor: isActive ? '#2E7D32' : 'rgba(255, 255, 255, 0.06)',
                    border: `1.5px solid ${isActive ? '#81C784' : 'rgba(255, 255, 255, 0.12)'}`,
                    color: isActive ? '#FFFFFF' : '#B0BEC5',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <span>{cls.name}</span>
                  <span style={{ fontSize: '0.72rem', backgroundColor: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px' }}>
                    {cls.code}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {/* Active Class Hero Banner */}
        {activeCode && (
          <div
            style={{
              backgroundColor: 'rgba(20, 26, 32, 0.96)',
              borderRadius: '16px',
              border: '1.5px solid rgba(129, 199, 132, 0.3)',
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px'
            }}
          >
            <div>
              <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: '#81C784', fontWeight: 800 }}>
                Active Student Invite Code
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                <span data-testid="active-class-code" style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '0.08em', color: '#FFD700' }}>
                  {activeCode}
                </span>
                <button
                  type="button"
                  data-testid="copy-class-code-btn"
                  onClick={handleCopyCode}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    color: '#FFFFFF',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {copied ? '✓ Copied!' : 'Copy Code'}
                </button>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#90A4AE', marginTop: '4px' }}>
                Students enter this code on the 3D start screen to link their anonymous progress.
              </div>
            </div>

            <button
              type="button"
              data-testid="export-csv-btn"
              onClick={handleDownloadCsv}
              disabled={!dashboardData || dashboardData.total_players === 0}
              style={{
                padding: '10px 18px',
                backgroundColor: 'rgba(255, 241, 118, 0.12)',
                border: '1.5px solid #FFF176',
                color: '#FFF176',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '0.86rem',
                cursor: dashboardData?.total_players ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>📥</span>
              <span>Export Class CSV</span>
            </button>
          </div>
        )}

        {/* Dashboard Content */}
        {dashboardData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Empty State */}
            {dashboardData.total_players === 0 ? (
              <div
                data-testid="empty-class-state"
                style={{
                  backgroundColor: 'rgba(20, 26, 32, 0.96)',
                  borderRadius: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  padding: '36px 20px',
                  textAlign: 'center',
                  color: '#90A4AE'
                }}
              >
                <div style={{ fontSize: '2.4rem', marginBottom: '8px' }}>🌾</div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', color: '#FFFFFF', fontWeight: 800 }}>
                  No students have joined this class yet
                </h4>
                <p style={{ margin: 0, fontSize: '0.82rem', maxWidth: '420px', marginInline: 'auto', lineHeight: 1.4 }}>
                  Give code <strong style={{ color: '#FFD700' }}>{activeCode}</strong> to your students to enter on the loading screen. Real-time metrics will update automatically.
                </p>
              </div>
            ) : (
              <>
                {/* 4 Metric Cards Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '12px' }}>
                  {/* Total Players */}
                  <div style={{ backgroundColor: 'rgba(20, 26, 32, 0.96)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.12)', padding: '16px' }}>
                    <div style={{ fontSize: '0.72rem', color: '#90A4AE', textTransform: 'uppercase', fontWeight: 800 }}>Total Students</div>
                    <div data-testid="metric-total-players" style={{ fontSize: '1.8rem', fontWeight: 900, color: '#FFFFFF', marginTop: '4px' }}>
                      {dashboardData.total_players}
                    </div>
                  </div>

                  {/* Burn First Choice % */}
                  <div style={{ backgroundColor: 'rgba(20, 26, 32, 0.96)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.12)', padding: '16px' }}>
                    <div style={{ fontSize: '0.72rem', color: '#90A4AE', textTransform: 'uppercase', fontWeight: 800 }}>First Chose Burn</div>
                    <div data-testid="metric-burn-pct" style={{ fontSize: '1.8rem', fontWeight: 900, color: '#FF8A65', marginTop: '4px' }}>
                      {dashboardData.first_choice_burn_percentage}%
                    </div>
                    <div style={{ fontSize: '0.70rem', color: '#78909C' }}>
                      {dashboardData.first_choice_burn_count} of {dashboardData.total_players} students
                    </div>
                  </div>

                  {/* Quiz Delta */}
                  <div style={{ backgroundColor: 'rgba(20, 26, 32, 0.96)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.12)', padding: '16px' }}>
                    <div style={{ fontSize: '0.72rem', color: '#90A4AE', textTransform: 'uppercase', fontWeight: 800 }}>Avg Quiz Score Delta</div>
                    <div data-testid="metric-quiz-delta" style={{ fontSize: '1.8rem', fontWeight: 900, color: '#81C784', marginTop: '4px' }}>
                      +{dashboardData.avg_quiz_delta}
                    </div>
                    <div style={{ fontSize: '0.70rem', color: '#78909C' }}>
                      Pre: {dashboardData.avg_quiz_pre}/5 ➔ Post: {dashboardData.avg_quiz_post}/5
                    </div>
                  </div>

                  {/* Avg Session Duration */}
                  <div style={{ backgroundColor: 'rgba(20, 26, 32, 0.96)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.12)', padding: '16px' }}>
                    <div style={{ fontSize: '0.72rem', color: '#90A4AE', textTransform: 'uppercase', fontWeight: 800 }}>Avg Session Time</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#64B5F6', marginTop: '4px' }}>
                      {Math.round(dashboardData.avg_session_time_sec)}s
                    </div>
                  </div>
                </div>

                {/* Alternatives Tried Breakdown */}
                <div style={{ backgroundColor: 'rgba(20, 26, 32, 0.96)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.12)', padding: '18px' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '0.94rem', fontWeight: 800, color: '#A5D6A7' }}>
                    Sustainable Alternatives Tried After Rewind
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                    {[
                      { key: 'happy_seeder', label: 'Happy Seeder', icon: '🚜' },
                      { key: 'bale_sell', label: 'Bale & Sell', icon: '💰' },
                      { key: 'mulch', label: 'Mulch into Soil', icon: '🌾' },
                      { key: 'compost', label: 'Bio-Decomposer', icon: '🧪' }
                    ].map((alt) => {
                      const count = dashboardData.alternatives_tried_counts[alt.key] || 0
                      return (
                        <div
                          key={alt.key}
                          style={{
                            padding: '10px 12px',
                            backgroundColor: 'rgba(255, 255, 255, 0.04)',
                            borderRadius: '10px',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>{alt.icon}</span>
                            <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{alt.label}</span>
                          </div>
                          <span style={{ fontWeight: 800, color: '#81C784' }}>{count}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Ranks Distribution */}
                <div style={{ backgroundColor: 'rgba(20, 26, 32, 0.96)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.12)', padding: '18px' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '0.94rem', fontWeight: 800, color: '#A5D6A7' }}>
                    Class Season Ranks Distribution
                  </h4>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {['S', 'A', 'B', 'C'].map((r) => {
                      const count = dashboardData.rank_distribution[r] || 0
                      return (
                        <div
                          key={r}
                          style={{
                            flex: 1,
                            padding: '12px 8px',
                            textAlign: 'center',
                            backgroundColor: 'rgba(255, 255, 255, 0.04)',
                            borderRadius: '10px',
                            border: '1px solid rgba(255, 255, 255, 0.08)'
                          }}
                        >
                          <div style={{ fontSize: '1.2rem', fontWeight: 900, color: r === 'S' ? '#FFD700' : r === 'A' ? '#81C784' : r === 'B' ? '#64B5F6' : '#FF8A65' }}>
                            {r}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: '#90A4AE', marginTop: '2px' }}>
                            {count} students
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
