import { ConfigProvider, App as AntApp, theme } from 'antd'
import viVN from 'antd/locale/vi_VN'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import AppShell from './components/AppShell'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Articles from './pages/Articles'
import Audit from './pages/Audit'
import Dashboard from './pages/Dashboard'
import Finance from './pages/Finance'
import Items from './pages/Items'
import ItemDetail from './pages/ItemDetail'
import Login from './pages/Login'
import Orders from './pages/Orders'
import Transactions from './pages/Transactions'
import Users from './pages/Users'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
})

function ProtectedRoute({ children }) {
  const { user } = useAuth()
  if (!user || !localStorage.getItem('admin_token')) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  // ── Chọn theme ──────────────────────────────────────────────────────────
  // Uncomment 1 trong các options dưới đây để đổi theme:

  const selectedTheme = {
    // ① Light mặc định
    // algorithm: theme.defaultAlgorithm,
    // token: { colorPrimary: '#1677ff', borderRadius: 6 },

    // ② Giống ant.design docs — border radius cao hơn (đang dùng)
    algorithm: theme.defaultAlgorithm,
    token: { colorPrimary: '#1677ff', borderRadius: 10 },

    // ③ Dark mode
    // algorithm: theme.darkAlgorithm,
    // token: { colorPrimary: '#1677ff', borderRadius: 6 },

    // ④ Compact (dense — tốt cho data-heavy admin)
    // algorithm: theme.compactAlgorithm,
    // token: { colorPrimary: '#1677ff', borderRadius: 4 },

    // ⑤ Dark + Compact
    // algorithm: [theme.darkAlgorithm, theme.compactAlgorithm],
    // token: { colorPrimary: '#1677ff' },

    // ⑥ Màu chủ đạo khác
    // token: { colorPrimary: '#722ed1', borderRadius: 10 }, // tím
    // token: { colorPrimary: '#52c41a', borderRadius: 10 }, // xanh lá
    // token: { colorPrimary: '#fa8c16', borderRadius: 10 }, // cam
  }
  // ────────────────────────────────────────────────────────────────────────

  return (
    <ConfigProvider locale={viVN} theme={selectedTheme}>
      <AntApp>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <Router basename="/admin">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                  path="/"
                  element={<ProtectedRoute><AppShell /></ProtectedRoute>}
                >
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="users" element={<Users />} />
                  <Route path="items" element={<Items />} />
                  <Route path="items/:id" element={<ItemDetail />} />
                  <Route path="orders" element={<Orders />} />
                  <Route path="transactions" element={<Transactions />} />
                  <Route path="articles" element={<Articles />} />
                  <Route path="audit" element={<Audit />} />
                  <Route path="finance" element={<Finance />} />
                </Route>
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Router>
          </AuthProvider>
        </QueryClientProvider>
      </AntApp>
    </ConfigProvider>
  )
}
