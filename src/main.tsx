import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx' // Importerar din budget-app
import './style.css'       // Importerar Tailwind CSS-stilarna

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App /> {/* Renderar din budget-app */}
  </React.StrictMode>,
)
