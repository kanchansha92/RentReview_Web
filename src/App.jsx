import React, { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { MotionConfig, motion, AnimatePresence } from 'motion/react'
import { Loader2 } from 'lucide-react'
import { pageVariants } from './animations'
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
//
// The fallback itself fades in after a beat rather than appearing instantly:
// on a warm cache the chunk resolves in well under 200ms, and a spinner that
// blinks in and straight back out is worse than no spinner at all.
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

// ── Page transitions ──────────────────────────────────────────────────────
// Wrapping the route *element* rather than editing each page's root keeps the
// transition in one place and leaves every page's own markup untouched.
//
// The wrapper is a plain block box, so it is invisible to layout: pages keep
// their own min-h-screen roots and their sticky navbars behave as before.
// Motion resets `transform` to `none` once the animation lands, so the brief
// translate never becomes a containing block for the `position: fixed` modals
// these pages render.
//
// Motion is short and small on purpose (8px + opacity, ~0.3s): a route change
// already costs the reader their place, and a big movement on top of that
// reads as lag rather than polish.
const Page = ({ children }) => (
  <motion.div variants={pageVariants} initial="hidden" animate="show" exit="exit">
    {children}
  </motion.div>
)

// AnimatePresence needs a key that changes per route to run enter/exit. It sits
// inside Suspense so a lazy chunk that is still loading shows the fallback
// rather than an empty animated box.
const AnimatedRoutes = () => {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Page><Home /></Page>} />
        <Route path="/signin" element={<Page><SignIn /></Page>} />
        <Route path="/signup" element={<Page><SignUp /></Page>} />
        {/* PUBLIC: despite the name, /write-review is the property browse/search
            grid (the submission form is /add-review). It is linked from the hero
            search, the footer and the JSON-LD SearchAction, so it must stay
            crawlable and reachable by signed-out visitors. */}
        <Route path="/write-review" element={<Page><WriteReview /></Page>} />
        <Route path="/add-review" element={<Page><ProtectedRoute><AddReview /></ProtectedRoute></Page>} />
        <Route path="/map" element={<Page><MapView /></Page>} />
        <Route path="/property/:id" element={<Page><PropertyDetail /></Page>} />
        <Route path="/about" element={<Page><About /></Page>} />
        <Route path="/privacy" element={<Page><Privacy /></Page>} />
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

        <Route path="/admin" element={<Page><ProtectedRoute><AdminDashboard /></ProtectedRoute></Page>} />
        <Route path="/admin/verifications" element={<Page><ProtectedRoute><AdminVerifications /></ProtectedRoute></Page>} />

        <Route path="*" element={<Page><NotFound /></Page>} />
      </Routes>
    </AnimatePresence>
  )
}

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
    // ── Motion, app-wide ──────────────────────────────────────────────────
    // reducedMotion="user" makes every Motion animation in the app respect the
    // OS-level "reduce motion" setting automatically: transforms and layout
    // animations are skipped, opacity still cross-fades. Set once here so no
    // individual component has to remember it.
    //
    // `transition` is the house default for anything that doesn't name its own
    // — see src/animations/variants.js for the shared vocabulary.
    <MotionConfig reducedMotion="user" transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}>
    <Router>
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
