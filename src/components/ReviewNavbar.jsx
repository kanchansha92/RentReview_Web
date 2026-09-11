import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Home, Map, PlusCircle, User, ChevronDown, LogOut, FileText, ShieldCheck, Settings as SettingsIcon } from 'lucide-react'
import { logoutSuccess, loginSuccess, selectUser } from '../store/authSlice'
import { logout } from '../services/authService'
import { clearReviewData } from '../store/reviewSlice'
import LoginModal from './LoginModal'
import SignupModal from './SignupModal'
import { motion, AnimatePresence, dropdownVariants, EASE } from '../animations'

const ReviewNavbar = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const user = useSelector(selectUser)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showSignupModal, setShowSignupModal] = useState(false)
  // After login/signup from the "Write a Review" gate, route the user to
  // /write-review. Kept in a ref, not state: the modal's onSuccess runs in the
  // same React batch that closes the dialog, so a state read there is stale.
  const pendingWriteReviewRef = useRef(false)
  const menuRef = useRef(null)

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    if (!menuOpen) return
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    const handleEsc = (e) => { if (e.key === 'Escape') setMenuOpen(false) }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [menuOpen])

  const handleLogout = async () => {
    // The session cookie is HttpOnly, so only the server can clear it. Do that
    // FIRST: without it the UI says "signed out" while the session stays live.
    await logout()
    dispatch(logoutSuccess())
    // The review slice also resets on logoutSuccess, but dispatch this
    // explicitly so the intent is obvious: User A's reviews must never
    // survive into User B's session in the same tab.
    dispatch(clearReviewData())
    setMenuOpen(false)
    navigate('/')
  }

  // Auth-gated: guests get the login modal; members go straight to the listing
  const handleWriteReview = () => {
    if (!user) {
      pendingWriteReviewRef.current = true
      setShowLoginModal(true)
      return
    }
    navigate('/write-review')
  }

  // Explicit dismiss path (X / backdrop / Escape). Only here do we drop the
  // pending "Write a Review" intent -switching between the login and signup
  // dialogs must preserve it, otherwise a guest who signs up from the login
  // modal lands back on this page with nothing happening.
  const dismissAuth = () => {
    setShowLoginModal(false)
    setShowSignupModal(false)
    pendingWriteReviewRef.current = false
  }

  // Login and signup both land here, mirroring Navbar.jsx's success handlers.
  const handleAuthSuccess = (authedUser) => {
    dispatch(loginSuccess({ user: authedUser }))
    setShowLoginModal(false)
    setShowSignupModal(false)
    if (pendingWriteReviewRef.current) {
      pendingWriteReviewRef.current = false
      navigate('/write-review')
    }
  }

  return (
    <>
      {/* z-[1100] lifts the navbar (and its profile dropdown) above the
          Leaflet map on /map -Leaflet's panes sit at z-index 400 and its
          controls at 1000, so anything with a lower z-index gets painted
          over by the map. */}
      <motion.nav
        aria-label="Site navigation"
        className="relative z-[1100] border-b border-slate-200 bg-white"
        initial={{ y: -56, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: EASE }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-3 sm:gap-4 sm:px-6 sm:py-4 lg:px-8">
          {/* Logo */}
          <Link
            to="/"
            aria-label="RentReview -go to home"
            className="flex shrink-0 items-center gap-2 transition-opacity hover:opacity-90"
          >
            <motion.div
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#3EB489] text-white shadow-lg shadow-emerald-100 sm:h-10 sm:w-10"
              whileHover={{ rotate: -8, scale: 1.06 }}
              transition={{ type: 'spring', stiffness: 340, damping: 16 }}
            >
              <Home
                className="h-5 w-5 sm:h-[22px] sm:w-[22px]"
                fill="currentColor"
                fillOpacity={0.2}
                aria-hidden="true"
              />
            </motion.div>
            <span className="text-base font-bold tracking-tight text-slate-800 sm:text-xl">
              Rent<span className="text-[#3EB489]">Review</span>
            </span>
          </Link>

          {/* Nav items */}
          <div className="flex items-center gap-3 sm:gap-6 lg:gap-8">
            {/* Home (= property listing) */}
            <Link
              to="/write-review"
              aria-label="Home"
              className="flex items-center gap-2 text-[15px] font-semibold text-slate-600 transition-colors hover:text-[#3EB489]"
            >
              <Home size={18} className="text-slate-500" aria-hidden="true" />
              <span className="hidden sm:inline">Home</span>
            </Link>

            {/* Map */}
            <Link
              to="/map"
              aria-label="Map view"
              className="flex items-center gap-2 text-[15px] font-semibold text-slate-600 transition-colors hover:text-[#3EB489]"
            >
              <Map size={18} className="text-slate-500" aria-hidden="true" />
              <span className="hidden sm:inline">Map</span>
            </Link>

            {/* Write a Review CTA -auth-gated */}
            <motion.button
              type="button"
              onClick={handleWriteReview}
              aria-label="Write a review"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.18, ease: EASE }}
              className="flex items-center gap-2 rounded-xl bg-[#3EB489] px-3 py-2 text-sm font-bold text-white shadow-lg shadow-emerald-100 transition-colors hover:bg-[#35a37b] sm:px-5 sm:py-2.5"
            >
              <PlusCircle size={16} aria-hidden="true" />
              <span className="hidden sm:inline">Write a Review</span>
            </motion.button>

            {/* Profile / Sign in */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={user ? () => setMenuOpen((o) => !o) : () => setShowLoginModal(true)}
                aria-label={user ? 'Open profile menu' : 'Sign in'}
                aria-haspopup={user ? 'menu' : undefined}
                aria-expanded={user ? menuOpen : undefined}
                className="flex items-center gap-2 text-[15px] font-semibold text-slate-600 transition-colors hover:text-[#3EB489]"
              >
                <User size={18} className="text-slate-500" aria-hidden="true" />
                <span className="hidden sm:inline">Profile</span>
                {user && (
                  <motion.span
                    className="hidden sm:block"
                    animate={{ rotate: menuOpen ? 180 : 0 }}
                    transition={{ duration: 0.2, ease: EASE }}
                    aria-hidden="true"
                  >
                    <ChevronDown size={14} className="text-slate-400" />
                  </motion.span>
                )}
              </button>

              <AnimatePresence>
              {user && menuOpen && (
                <motion.div
                  key="review-profile-menu"
                  role="menu"
                  variants={dropdownVariants}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  className="absolute right-0 top-full z-100 mt-5.5 w-56 origin-top-right overflow-hidden rounded-xl border border-slate-100 bg-white py-1.5 shadow-xl shadow-slate-200/60 sm:w-60"
                >
                  {/* User info header */}
                  <div className="border-b border-slate-100 px-4 py-3">
                    <p className="truncate text-sm font-semibold text-slate-800">{user.name}</p>
                    <p className="truncate text-xs text-slate-500">{user.email}</p>
                  </div>

                  {/* Menu items */}
                  <Link
                    to="/profile"
                    onClick={() => setMenuOpen(false)}
                    role="menuitem"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-[#3EB489]"
                  >
                    <User size={16} className="text-slate-400" aria-hidden="true" />
                    Profile
                  </Link>
                  <Link
                    to="/settings"
                    onClick={() => setMenuOpen(false)}
                    role="menuitem"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-[#3EB489]"
                  >
                    <SettingsIcon size={16} className="text-slate-400" aria-hidden="true" />
                    Settings
                  </Link>
                  <Link
                    to="/my-reviews"
                    onClick={() => setMenuOpen(false)}
                    role="menuitem"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-[#3EB489]"
                  >
                    <FileText size={16} className="text-slate-400" aria-hidden="true" />
                    My Reviews
                  </Link>

                  {/* Admins only. The queue was reachable by typed URL alone, so
                      whoever moderates had to remember the path; the API and both
                      admin pages still enforce the role, this just stops hiding
                      the door from the people who hold the key. */}
                  {user.role === 'admin' && (
                    <Link
                      to="/admin"
                      onClick={() => setMenuOpen(false)}
                      role="menuitem"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-[#3EB489]"
                    >
                      <ShieldCheck size={16} className="text-slate-400" aria-hidden="true" />
                      Admin
                    </Link>
                  )}

                  <div className="my-1 border-t border-slate-100" />

                  <button
                    type="button"
                    onClick={handleLogout}
                    role="menuitem"
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                  >
                    <LogOut size={16} aria-hidden="true" />
                    Sign Out
                  </button>
                </motion.div>
              )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Auth modals -AnimatePresence lets them animate out on close */}
      <AnimatePresence>
      {showLoginModal && (
        <LoginModal
          key="review-login-modal"
          onClose={dismissAuth}
          onSwitchToSignup={() => {
            setShowLoginModal(false)
            setShowSignupModal(true)
          }}
          onSuccess={handleAuthSuccess}
        />
      )}
      </AnimatePresence>
      <AnimatePresence>
      {showSignupModal && (
        <SignupModal
          key="review-signup-modal"
          onClose={dismissAuth}
          onSwitchToLogin={() => {
            setShowSignupModal(false)
            setShowLoginModal(true)
          }}
          onSuccess={handleAuthSuccess}
        />
      )}
      </AnimatePresence>
    </>
  )
}

export default ReviewNavbar