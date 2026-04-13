import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n/config'
import App from './App.tsx'
import { registerPushServiceWorker } from './modules/push/pwaPush'

if ('serviceWorker' in navigator) {
  registerPushServiceWorker().catch((error) => {
    console.error('Service worker registration failed:', error)
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
