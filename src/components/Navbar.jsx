import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  Home, ArrowRight, ChevronDown, LogOut, FileText,
  User as UserIcon, Menu, X,
} from 'lucide-react'
import { logoutSuccess, loginSuccess, selectUser } from '../store/authSlice'
import { clearReviewData } from '../store/reviewSlice'
import LoginModal from './LoginModal'
import SignupModal from './SignupModal'
import {
  motion,
  AnimatePresence,
  dropdownVariants,
  sheetVariants,
  staggerContainer,
  fadeDown,
  EASE,
} from '../animations'

const NAV_LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#testimonials', label: 'Testimonials' },
]

const Navbar = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const user = useSelector(selectUser)

  const [menuOpen, setMenuOpen] = useState(false)            // profile dropdown
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false) // hamburger menu
  const [authOpen, setAuthOpen] = useState(false)
  const [signupOpen, setSignupOpen] = useState(false)
  const menuRef = useRef(null)

  // ── Close profile dropdown on outside click / Escape ───────────────────
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

  // ── Auto-close mobile menu when growing to desktop / pressing Escape ───
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setMobileMenuOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (!mobileMenuOpen) return
    const handleEsc = (e) => { if (e.key === 'Escape') setMobileMenuOpen(false) }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [mobileMenuOpen])

  // ── Modal helpers ──────────────────────────────────────────────────────
  const openLogin = () => {
    setSignupOpen(false)
    setMobileMenuOpen(false)
    setAuthOpen(true)
  }
  const openSignup = () => {
    setAuthOpen(false)
    setMobileMenuOpen(false)
    setSignupOpen(true)
  }
  const closeAllAuth = () => {
    setAuthOpen(false)
    setSignupOpen(false)
  }


  const handleLogout = () => {
    dispatch(logoutSuccess())
    // The review slice also resets on logoutSuccess, but dispatch this
    // explicitly so the intent is obvious: User A's reviews must never
    // survive into User B's session in the same tab.
    dispatch(clearReviewData())
    setMenuOpen(false)
    setMobileMenuOpen(false)
    navigate('/')
  }

  const handleWriteReview = () => {
    setMobileMenuOpen(false)
    if (user) navigate('/write-review')
    else openLogin()
  }

  const handleLoginSuccess = (loggedInUser, token) => {
    dispatch(loginSuccess({ user: loggedInUser, token }))
    closeAllAuth()
    navigate('/write-review')
  }

  const handleSignupSuccess = (registeredUser, token) => {
    dispatch(loginSuccess({ user: registeredUser, token }))
    closeAllAuth()
    navigate('/write-review')
  }

  const initial = user?.name?.trim().charAt(0).toUpperCase() || 'U'

  return (
    <>
      {/* The bar itself drops in once on first paint. It is sticky, so it only
          ever plays on the homepage's initial mount -not on every scroll. */}
      <motion.nav
        className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-md"
        initial={{ y: -64, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: EASE }}
      >
        <motion.div
          className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-3 sm:gap-4 sm:px-6 sm:py-4 lg:px-8"
          initial="hidden"
          animate="show"
          variants={staggerContainer(0.07, 0.2)}
        >
          {/* ── Logo ───────────────────────────────────────────────────── */}
          <motion.div variants={fadeDown} className="shrink-0">
            <Link to="/" className="flex shrink-0 items-center gap-2 transition-opacity hover:opacity-90">
              <motion.div
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#3EB489] text-white shadow-lg shadow-emerald-100 sm:h-10 sm:w-10"
                whileHover={{ rotate: -8, scale: 1.06 }}
                transition={{ type: 'spring', stiffness: 340, damping: 16 }}
              >
                <Home className="h-5 w-5 sm:h-[22px] sm:w-[22px]" fill="currentColor" fillOpacity={0.2} />
              </motion.div>
              <span className="text-base font-bold tracking-tight text-slate-800 sm:text-xl">
                Rent<span className="text-[#3EB489]">Review</span>
              </span>
            </Link>
          </motion.div>

          {/* ── Desktop nav links (md+) ─────────────────────────────────── */}
          <div className="hidden items-center gap-6 md:flex lg:gap-10">
            {NAV_LINKS.map((link) => (
              /* `group` + a scaleX rule gives each link an underline that wipes
                 in from the left -cheaper and smoother than animating width. */
              <motion.a
                key={link.href}
                href={link.href}
                variants={fadeDown}
                className="group relative text-sm font-semibold text-slate-500 transition-colors hover:text-[#3EB489]"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 h-0.5 w-full origin-left scale-x-0 rounded-full bg-[#3EB489] transition-transform duration-200 ease-out group-hover:scale-x-100" />
              </motion.a>
            ))}
          </div>

          {/* ── Right actions ───────────────────────────────────────────── */}
          <motion.div variants={fadeDown} className="flex items-center gap-1.5 sm:gap-3 lg:gap-4">
            {/* Sign In link (sm+ when logged out) */}
            {!user && (
              <Link
                to="/signin"
                className="hidden text-sm font-bold text-slate-700 transition-colors hover:text-[#3EB489] sm:block"
              >
                Sign In
              </Link>
            )}

            {/* Profile dropdown (all sizes when logged in) */}
            {user && (
              <div className="relative" ref={menuRef}>
                <motion.button
                  onClick={() => setMenuOpen((o) => !o)}
                  whileTap={{ scale: 0.94 }}
                  className="flex items-center gap-1 rounded-full p-1 transition-colors hover:bg-slate-100 sm:gap-2 sm:pr-2"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3EB489] text-sm font-bold text-white shadow-md shadow-emerald-100 sm:h-9 sm:w-9">
                    {initial}
                  </div>
                  {/* Chevron rotation moved to Motion so it eases on the same
                      curve as the menu it belongs to. */}
                  <motion.span
                    className="hidden sm:block"
                    animate={{ rotate: menuOpen ? 180 : 0 }}
                    transition={{ duration: 0.2, ease: EASE }}
                  >
                    <ChevronDown size={16} className="text-slate-500" />
                  </motion.span>
                </motion.button>

                <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    key="profile-menu"
                    role="menu"
                    variants={dropdownVariants}
                    initial="hidden"
                    animate="show"
                    exit="exit"
                    className="absolute right-0 top-full mt-2 w-56 origin-top-right overflow-hidden rounded-xl border border-slate-100 bg-white py-1.5 shadow-xl shadow-slate-200/60 sm:w-60"
                  >
                    <div className="border-b border-slate-100 px-4 py-3">
                      <p className="truncate text-sm font-semibold text-slate-800">{user.name}</p>
                      <p className="truncate text-xs text-slate-500">{user.email}</p>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-[#3EB489]"
                    >
                      <UserIcon size={16} className="text-slate-400" />
                      Profile
                    </Link>
                    <Link
                      to="/my-reviews"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-[#3EB489]"
                    >
                      <FileText size={16} className="text-slate-400" />
                      My Reviews
                    </Link>

                    <div className="my-1 border-t border-slate-100" />

                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                    >
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </motion.div>
                )}
                </AnimatePresence>
              </div>
            )}

            {/* Write a Review button (all sizes; tighter on mobile).
                The arrow slides right on hover -a one-property hint that this
                button takes you somewhere. */}
            <motion.button
              onClick={handleWriteReview}
              whileHover="hovered"
              whileTap={{ scale: 0.95 }}
              initial="rest"
              animate="rest"
              className="flex items-center gap-1 rounded-lg bg-[#3EB489] px-2.5 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-100 transition-colors hover:bg-[#35a37b] sm:gap-2 sm:rounded-xl sm:px-5 sm:py-2.5 sm:text-sm"
            >
              <span className="hidden sm:inline">Write a Review</span>
              <span className="sm:hidden">Review</span>
              <motion.span
                className="inline-flex"
                variants={{ rest: { x: 0 }, hovered: { x: 3 } }}
                transition={{ duration: 0.18, ease: EASE }}
              >
                <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </motion.span>
            </motion.button>

            {/* Mobile menu toggle (mobile only). The icon cross-fades and spins
                between states instead of swapping instantly. */}
            <motion.button
              onClick={() => setMobileMenuOpen((o) => !o)}
              whileTap={{ scale: 0.9 }}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-700 transition-colors hover:bg-slate-100 md:hidden"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={mobileMenuOpen ? 'close' : 'open'}
                  className="inline-flex"
                  initial={{ opacity: 0, rotate: -90, scale: 0.7 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: 90, scale: 0.7 }}
                  transition={{ duration: 0.15, ease: EASE }}
                >
                  {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </motion.span>
              </AnimatePresence>
            </motion.button>
          </motion.div>
        </motion.div>

        {/* ── Mobile menu panel ─────────────────────────────────────────── */}
        {/* Animating height (rather than a fixed-height CSS keyframe) means the
            panel opens to whatever its contents actually need, and closes back
            down smoothly instead of vanishing. */}
        <AnimatePresence initial={false}>
        {mobileMenuOpen && (
          <motion.div
            key="mobile-menu"
            variants={sheetVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            className="overflow-hidden border-t border-slate-100 bg-white md:hidden"
          >
            <motion.div
              className="mx-auto flex max-w-7xl flex-col gap-1 px-3 py-2 sm:px-6"
              variants={staggerContainer(0.05, 0.08)}
              initial="hidden"
              animate="show"
            >
              {NAV_LINKS.map((link) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  variants={fadeDown}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg px-3 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-[#3EB489]"
                >
                  {link.label}
                </motion.a>
              ))}

              {!user && (
                <>
                  <div className="my-1 border-t border-slate-100" />
                  <motion.div variants={fadeDown}>
                    <Link
                      to="/signin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block rounded-lg px-3 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-[#3EB489]"
                    >
                      Sign In
                    </Link>
                  </motion.div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
        </AnimatePresence>
      </motion.nav>

      {/* Modals -AnimatePresence keeps them mounted long enough to animate out */}
      <AnimatePresence>
        {authOpen && (
          <LoginModal
            key="login-modal"
            onClose={closeAllAuth}
            onSwitchToSignup={openSignup}
            onSuccess={handleLoginSuccess}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {signupOpen && (
          <SignupModal
            key="signup-modal"
            onClose={closeAllAuth}
            onSwitchToLogin={openLogin}
            onSuccess={handleSignupSuccess}
          />
        )}
      </AnimatePresence>
    </>
  )
}

export default Navbar