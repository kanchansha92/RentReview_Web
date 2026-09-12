import React, { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { MotionConfig, motion, AnimatePresence } from 'motion/react'
import { Loader2 } from 'lucide-react'
import { pageVariants } from './animations'
import Home from './pages/Home'
import ProtectedRoute from './components/Protectedroute'
import { logoutSuccess, loginSuccess } from './store/authSlice'
import { getCurrentUser, verifySession } from './services/authService'
import CookieConsent from './components/CookieConsent'
import { primeCsrfToken } from './config/api'
import { clearReviewData } from './store/reviewSlice'

const SignIn = lazy(() => import('./pages/Signin'))
const SignUp = lazy(() => import('./pages/SignUp'))
const WriteReview = lazy(() => import('./pages/WriteReview'))
const AddReview = lazy(() => import('./pages/Addreview'))
const MapView = lazy(() => import('./pages/Mapview'))
const PropertyDetail = lazy(() => import('./pages/Propertydetail'))
const About = lazy(() => import('./pages/About'))
const Privacy = lazy(() => import('./pages/Privacy'))
const Cookies = lazy(() => import('./pages/Cookies'))
const Security = lazy(() => import('./pages/Security'))
const Grievance = lazy(() => import('./pages/Grievance'))
const Terms = lazy(() => import('./pages/Terms'))
const Help = lazy(() => import('./pages/Help'))
const Contact = lazy(() => import('./pages/Contact'))
const Guidelines = lazy(() => import('./pages/Guidelines'))
const Profile = lazy(() => import('./pages/Profile'))
const Settings = lazy(() => import('./pages/Settings'))
const MyReviews = lazy(() => import('./pages/MyReviews'))
const AuthSuccess = lazy(() => import('./pages/AuthSuccess'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'))
const ConfirmEmailChange = lazy(() => import('./pages/ConfirmEmailChange'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const AdminVerifications = lazy(() => import('./pages/AdminVerifications'))
const AdminReports = lazy(() => import('./pages/AdminReports'))
const AdminReviews = lazy(() => import('./pages/AdminReviews'))
const NotFound = lazy(() => import('./pages/NotFound'))


const RouteFallback = () => (
  <motion.div
    className="flex min-h-screen items-center justify-center bg-[#F9FAFB]"
    role="status"
    aria-live="polite"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.2, delay: 0.25 }}
  >
    <Loader2 className="h-8 w-8 animate-spin text-[#41B985]" aria-hidden="true" />
    <span className="sr-only">Loading…</span>
  </motion.div>
)


const Page = ({ children }) => (
  <motion.div variants={pageVariants} initial="hidden" animate="show" exit="exit">
    {children}
  </motion.div>
)

const AnimatedRoutes = () => {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Page><Home /></Page>} />
        <Route path="/signin" element={<Page><SignIn /></Page>} />
        <Route path="/signup" element={<Page><SignUp /></Page>} />
      
        <Route path="/write-review" element={<Page><WriteReview /></Page>} />
        <Route path="/add-review" element={<Page><ProtectedRoute><AddReview /></ProtectedRoute></Page>} />
        <Route path="/map" element={<Page><MapView /></Page>} />
        <Route path="/property/:id" element={<Page><PropertyDetail /></Page>} />
        <Route path="/about" element={<Page><About /></Page>} />
        <Route path="/privacy" element={<Page><Privacy /></Page>} />
        <Route path="/cookies" element={<Page><Cookies /></Page>} />
        <Route path="/security" element={<Page><Security /></Page>} />
        <Route path="/grievance" element={<Page><Grievance /></Page>} />
        <Route path="/terms" element={<Page><Terms /></Page>} />
        <Route path="/help" element={<Page><Help /></Page>} />
        <Route path="/contact" element={<Page><Contact /></Page>} />
        <Route path="/guidelines" element={<Page><Guidelines /></Page>} />
        <Route path="/profile" element={<Page><ProtectedRoute><Profile /></ProtectedRoute></Page>} />

        <Route path="/settings" element={<Page><ProtectedRoute><Settings /></ProtectedRoute></Page>} />
        <Route path="/my-reviews" element={<Page><ProtectedRoute><MyReviews /></ProtectedRoute></Page>} />
        <Route path="/auth-success" element={<Page><AuthSuccess /></Page>} />
        <Route path="/reset-password/:token" element={<Page><ResetPassword /></Page>} />
        <Route path="/verify-email/:token" element={<Page><VerifyEmail /></Page>} />
        <Route path="/confirm-email-change/:token" element={<Page><ConfirmEmailChange /></Page>} />

        <Route path="/admin" element={<Page><ProtectedRoute><AdminDashboard /></ProtectedRoute></Page>} />
        <Route path="/admin/verifications" element={<Page><ProtectedRoute><AdminVerifications /></ProtectedRoute></Page>} />
        <Route path="/admin/reports" element={<Page><ProtectedRoute><AdminReports /></ProtectedRoute></Page>} />
        <Route path="/admin/reviews" element={<Page><ProtectedRoute><AdminReviews /></ProtectedRoute></Page>} />

        <Route path="*" element={<Page><NotFound /></Page>} />
      </Routes>
    </AnimatePresence>
  )
}


const SessionCheck = () => {
  const dispatch = useDispatch()

  useEffect(() => {
    let ignore = false
    if (!getCurrentUser()) return undefined

    // Warm the CSRF token alongside the check, so the first write a review
    // submission with up to eleven files does not stall on a round-trip.
    primeCsrfToken()

    verifySession().then(({ status, user }) => {
      if (ignore) return
      if (status === 'valid') dispatch(loginSuccess({ user }))
      else if (status === 'invalid') {
        dispatch(logoutSuccess())
        dispatch(clearReviewData())
      }
      // 'unknown' → keep the optimistic session; the next real request decides.
    })

    return () => { ignore = true }
  }, [dispatch])

  return null
}

// App itself is rendered inside <Provider> (see main.jsx), so useDispatch is
// available; this stays a separate component only to keep App presentational.
const CrossTabAuthSync = () => {
  const dispatch = useDispatch()

  useEffect(() => {
    const handleStorage = (e) => {
      // e.key === null means storage.clear() treat it as "something we care
      // about may have gone", and let the localStorage read below decide.
      if (e.key !== null && e.key !== 'rr_user') return

      // The session cookie is shared across tabs by the browser; what this
      // syncs is the cached user object the UI renders from.
      const raw = localStorage.getItem('rr_user')
      if (!raw) {
        // Signed out in another tab → drop this tab's session and any review
        // data cached for the user who just left.
        dispatch(logoutSuccess())
        dispatch(clearReviewData())
        return
      }

      try {
        dispatch(loginSuccess({ user: JSON.parse(raw) }))
      } catch {
        // Malformed rr_user ignore rather than wedging the session.
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [dispatch])

  return null
}


const ScrollToTop = () => {
  const { pathname, hash } = useLocation()

  // Browsers also try to restore the old scroll position themselves on
  // back/forward (popstate). Switch that off so history navigations open from
  // the top too, instead of racing our reset below.
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
  }, [])

  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1))
      if (el) {
        el.scrollIntoView()
        return
      }
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname, hash])

  return null
}

const App = () => {
  return (
    
    <MotionConfig reducedMotion="user" transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}>
    <Router>
      <SessionCheck />
      <CookieConsent />
      <CrossTabAuthSync />
      <ScrollToTop />
      <Suspense fallback={<RouteFallback />}>
        <AnimatedRoutes />
      </Suspense>
    </Router>
    </MotionConfig>
  )
}

export default App
