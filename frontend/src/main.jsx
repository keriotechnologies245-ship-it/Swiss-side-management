import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ConvexProvider, ConvexReactClient } from "convex/react"
import './index.css'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Withdraw from './pages/Withdraw'
import Restock from './pages/Restock'
import History from './pages/History'
import Reports from './pages/Reports'
import Inventory from './pages/Inventory'
import Settings from './pages/Settings'
import ErrorBoundary from './components/ErrorBoundary'

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL || "http://localhost:3210");

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <ConvexProvider client={convex}>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="inventory" element={<Inventory />} />
              <Route path="withdraw" element={<Withdraw />} />
              <Route path="restock" element={<Restock />} />
              <Route path="history" element={<History />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ConvexProvider>
    </ErrorBoundary>
  </StrictMode>,
)
