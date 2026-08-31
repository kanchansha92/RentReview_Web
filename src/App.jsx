import React, { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { Loader2 } from 'lucide-react'
import Home from './pages/Home'
import ProtectedRoute from './components/Protectedroute'
import { logoutSuccess, loginSuccess } from './store/authSlice'
import { clearReviewData } from './store/reviewSlice'

// ── Route-level code splitting ────────────────────────────────────────────
// Every route used to be a static import, so opening the homepage downloaded the
// review submission form, the Leaflet map, the browse grid and all six static
// content pages before it painted — on the one page that decides whether a
// visitor stays.
//
// Home stays eagerly imported: it is the most common entry point and lazy-loading
// it would only add a round-trip. Everything else loads on navigation.
const SignIn = lazy(() => import('./pages/Signin'))
const SignUp = lazy(() => import('./pages/SignUp'))
const WriteReview = lazy(() => import('./pages/WriteReview'))
const AddReview = lazy(() => import('./pages/Addreview'))
const MapView = lazy(() => import('./pages/Mapview'))
const PropertyDetail = lazy(() => import('./pages/Propertydetail'))
const About = lazy(() => import('./pages/About'))
const Privacy = lazy(() => import('./pages/Privacy'))
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
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const AdminVerifications = lazy(() => import('./pages/AdminVerifications'))
const NotFound = lazy(() => import('./pages/NotFound'))

// Shown while a route chunk is in flight. Deliberately plain — a heavy skeleton
// here flashes on fast connections and reads as jank.
const RouteFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB]" role="status" aria-live="polite">
    <Loader2 className="h-8 w-8 animate-spin text-[#41B985]" aria-hidden="true" />
    <span className="sr-only">Loading…</span>
  </div>
)

// ── Cross-tab auth sync ───────────────────────────────────────────────────
// Sign out (or in) in another tab and every other tab follows. This lives at
// the app root rather than in a navbar: Navbar is only rendered by the
// homepage, while the other pages use ReviewNavbar, so a listener there
// left /profile, /my-reviews & co. showing a stale avatar and cached user.
// Mounted here it is registered exactly once, on every route.
// App itself is rendered inside <Provider> (see main.jsx), so useDispatch is
// available; this stays a separate component only to keep App presentational.
const CrossTabAuthSync = () => {
  const dispatch = useDispatch()

  useEffect(() => {
    const handleStorage = (e) => {
      // e.key === null means storage.clear() — treat it as "something we care
      // about may have gone", and let the localStorage read below decide.
      if (e.key !== null && e.key !== 'rr_token' && e.key !== 'rr_user') return

      const token = localStorage.getItem('rr_token')
      if (!token) {
        // Token removed in another tab → drop this tab's session and any
        // review data cached for the user who just left.
        dispatch(logoutSuccess())
        dispatch(clearReviewData())
        return
      }

      // Token appeared (or changed) in another tab → rehydrate from storage.
      try {
        const raw = localStorage.getItem('rr_user')
        dispatch(loginSuccess({ token, user: raw ? JSON.parse(raw) : null }))
      } catch {
        // Malformed rr_user — ignore rather than wedging the session.
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [dispatch])

  return null
}

// ── Scroll restoration ────────────────────────────────────────────────────
// SPAs keep the same document across navigations, so the browser never resets
// the scroll position on its own: navigate from the bottom of a long page and
// the next page opened mid-scroll. This resets to the top whenever the path
// changes. Uses the "instant" behavior so a route change never animates a
// scroll the user didn't perform. If a link carries a #hash, we honor it and
// scroll to that element instead of the top.
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
    <Router>
      <CrossTabAuthSync />
      <ScrollToTop />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          {/* PUBLIC: despite the name, /write-review is the property browse/search
              grid (the submission form is /add-review). It is linked from the hero
              search, the footer and the JSON-LD SearchAction, so it must stay
              crawlable and reachable by signed-out visitors. */}
          <Route path="/write-review" element={<WriteReview />} />
          <Route path="/add-review" element={<ProtectedRoute><AddReview /></ProtectedRoute>} />
          <Route path="/map" element={<MapView />} />
          <Route path="/property/:id" element={<PropertyDetail />} />
          <Route path="/about" element={<About />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/help" element={<Help />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/guidelines" element={<Guidelines />} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/my-reviews" element={<ProtectedRoute><MyReviews /></ProtectedRoute>} />
          <Route path="/auth-success" element={<AuthSuccess />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/verify-email/:token" element={<VerifyEmail />} />
       
          <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/verifications" element={<ProtectedRoute><AdminVerifications /></ProtectedRoute>} />
   
        
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Router>
  )
}

export default App
