import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './styles/tokens.css'
import './styles/base.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { UserProvider } from './context/UserContext'
import { ToastProvider } from './components/common/Toast'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <UserProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </UserProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
