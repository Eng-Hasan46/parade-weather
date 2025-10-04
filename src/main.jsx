import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { WeatherDataProvider } from './context/dataContext.jsx'

createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <WeatherDataProvider>
            <App />
        </WeatherDataProvider>
    </React.StrictMode>
)
