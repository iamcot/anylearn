import { ConfigProvider, App as AntApp, theme } from 'antd'
import viVN from 'antd/locale/vi_VN'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import AppShell from './components/AppShell'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Articles from './pages/Articles'
import Activities from './pages/Activities'
import Audit from './pages/Audit'
import CourseRequests from './pages/CourseRequests'
import PriceReports from './pages/PriceReports'
import FunEvents from './pages/FunEvents'
import FunCheckin from './pages/FunCheckin'
import QuizBank from './pages/QuizBank'
import Stickers from './pages/Stickers'
import FunCoins from './pages/FunCoins'
import FunShop from './pages/FunShop'
import ArenaAdmin from './pages/ArenaAdmin'
import QuizGame from './pages/QuizGame'
import Achievements from './pages/Achievements'
import Explore from './pages/Explore'
import ChatModeration from './pages/ChatModeration'
import Membership from './pages/Membership'
import Tags from './pages/Tags'
import Collections from './pages/Collections'
import Pathways from './pages/Pathways'
import AiSuggestions from './pages/AiSuggestions'
import AiUsage from './pages/AiUsage'
import Acquisition from './pages/Acquisition'
import LandingPages from './pages/LandingPages'
import ContentReviewers from './pages/ContentReviewers'
import OperationSettings from './pages/OperationSettings'
import ItemGaps from './pages/ItemGaps'
import AllReviews from './pages/AllReviews'
import SearchInsights from './pages/SearchInsights'
import NotificationRecipients from './pages/NotificationRecipients'
import BankAccount from './pages/BankAccount'
import PaymentMethods from './pages/PaymentMethods'
import Dashboard from './pages/Dashboard'
import Finance from './pages/Finance'
import Items from './pages/Items'
import ScheduleMonitor from './pages/ScheduleMonitor'
import ScheduleRequests from './pages/ScheduleRequests'
import Settings from './pages/EmailSettings'
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
                  <Route path="activities" element={<Activities />} />
                  <Route path="schedule-monitor" element={<ScheduleMonitor />} />
                  <Route path="schedule-requests" element={<ScheduleRequests />} />
                  <Route path="course-requests" element={<CourseRequests />} />
                  <Route path="price-reports" element={<PriceReports />} />
                  <Route path="fun-events" element={<FunEvents />} />
                  <Route path="fun-checkin" element={<FunCheckin />} />
                  <Route path="quiz-bank" element={<QuizBank />} />
                  <Route path="stickers" element={<Stickers />} />
                  <Route path="fun-coins" element={<FunCoins />} />
                  <Route path="fun-shop" element={<FunShop />} />
                  <Route path="fun-arena" element={<ArenaAdmin />} />
                  <Route path="quiz-game" element={<QuizGame />} />
                  <Route path="achievements" element={<Achievements />} />
                  <Route path="explore" element={<Explore />} />
                  <Route path="chat" element={<ChatModeration />} />
                  <Route path="membership" element={<Membership />} />
                  <Route path="tags" element={<Tags />} />
                  <Route path="collections" element={<Collections />} />
                  <Route path="pathways" element={<Pathways />} />
                  <Route path="ai-suggestions" element={<AiSuggestions />} />
                  <Route path="ai-usage" element={<AiUsage />} />
                  <Route path="acquisition" element={<Acquisition />} />
                  <Route path="landing-pages" element={<LandingPages />} />
                  <Route path="content-reviewers" element={<ContentReviewers />} />
                  <Route path="operations" element={<OperationSettings />} />
                  <Route path="item-gaps" element={<ItemGaps />} />
                  <Route path="reviews" element={<AllReviews />} />
                  <Route path="search-insights" element={<SearchInsights />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="transactions" element={<Transactions />} />
                  <Route path="articles" element={<Articles />} />
                  <Route path="audit" element={<Audit />} />
                  <Route path="bank-account" element={<BankAccount />} />
                  <Route path="payment-methods" element={<PaymentMethods />} />
                  <Route path="notification-recipients" element={<NotificationRecipients />} />
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
