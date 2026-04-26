import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n/config'
import App from './App.tsx'
import { registerPushServiceWorker } from './modules/push/pwaPush'

if ('serviceWorker' in navigator) {
  const register = () => {
    registerPushServiceWorker().catch((error) => {
      console.error('Service worker registration failed:', error)
    })
  }

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(register)
  } else {
    globalThis.setTimeout(register, 1500)
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
