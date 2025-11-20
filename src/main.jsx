import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './HouseholdBillApp.jsx'

// This is the bridge between React and the Browser
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
