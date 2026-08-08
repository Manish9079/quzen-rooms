import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Amplify } from 'aws-amplify'
import outputs from '../amplify_outputs.json'


import './styles/tokens.css'
import './styles/base.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { UserProvider } from './context/UserContext'
import { ToastProvider } from './components/common/Toast'


Amplify.configure(outputs)

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
