// ============================================================
// APP ROOT — React Router setup + auth-protected routes
// ============================================================
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'

// Layout
import AppLayout from './components/layout/AppLayout'

// Pages
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import POSPage from './pages/POSPage'
import SalesHistoryPage from './pages/SalesHistoryPage'
import InventoryPage from './pages/InventoryPage'
import ProductDetailPage from './pages/ProductDetailPage'
import ReplenishPage from './pages/ReplenishPage'
import ExpensesPage from './pages/ExpensesPage'
import ReconciliationPage from './pages/ReconciliationPage'
import ReportsPage from './pages/ReportsPage'
import ProfitLossPage from './pages/ProfitLossPage'
import BalanceSheetPage from './pages/BalanceSheetPage'
import UsersPage from './pages/UsersPage'
import LowStockPage from './pages/LowStockPage'

// Route guard — redirect to login if not authenticated
function PrivateRoute({ children }) {
  const { token } = useAuthStore()
  return token ? children : <Navigate to="/login" replace />
}

// Route guard — admin-only pages
function AdminRoute({ children }) {
  const { token, user } = useAuthStore()
  if (!token) return <Navigate to="/login" replace />
  if (user?.role !== 'admin') return <Navigate to="/pos" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected — all authenticated users */}
        <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />

          {/* Admin only */}
          <Route path="dashboard" element={<AdminRoute><DashboardPage /></AdminRoute>} />
          <Route path="reports" element={<AdminRoute><ReportsPage /></AdminRoute>} />
          <Route path="reports/pnl" element={<AdminRoute><ProfitLossPage /></AdminRoute>} />
          <Route path="reports/balance-sheet" element={<AdminRoute><BalanceSheetPage /></AdminRoute>} />
          <Route path="reconciliation" element={<AdminRoute><ReconciliationPage /></AdminRoute>} />
          <Route path="expenses" element={<AdminRoute><ExpensesPage /></AdminRoute>} />
          <Route path="products/:id/replenish" element={<AdminRoute><ReplenishPage /></AdminRoute>} />
          <Route path="users" element={<AdminRoute><UsersPage /></AdminRoute>} />

          {/* All authenticated users */}
          <Route path="pos" element={<POSPage />} />
          <Route path="sales" element={<SalesHistoryPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="inventory/low-stock" element={<LowStockPage />} />
          <Route path="products/:id" element={<ProductDetailPage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
