import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './game/cinematicGame.css'

// Silence @react-three/fiber internal THREE.Clock deprecation warning in three@0.186+
if (typeof console !== 'undefined' && typeof console.warn === 'function') {
  const origWarn = console.warn.bind(console)
  console.warn = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('THREE.Clock: This module has been deprecated')) {
      return
    }
    origWarn(...args)
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
