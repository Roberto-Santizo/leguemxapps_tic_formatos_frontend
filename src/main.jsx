import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import App from './App.jsx'
import './index.css'
import { iniciarTecladoMovil } from './utils/tecladoMovil.js'
import { iniciarFaseCielo } from './config/cielo.js'

iniciarTecladoMovil()
iniciarFaseCielo()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>,
)
