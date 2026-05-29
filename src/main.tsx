import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { applyTheme } from './lib/theme'
import { useStore } from './lib/store'

// Apply the saved theme before first paint to avoid a flash.
applyTheme(useStore.getState().settings.theme, useStore.getState().settings.accent, useStore.getState().settings.customBg)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
