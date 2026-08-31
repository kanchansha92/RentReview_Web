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
      <nav className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-3 sm:gap-4 sm:px-6 sm:py-4 lg:px-8">
          {/* ── Logo ───────────────────────────────────────────────────── */}
          <Link to="/" className="flex shrink-0 items-center gap-2 transition-opacity hover:opacity-90">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#3EB489] text-white shadow-lg shadow-emerald-100 sm:h-10 sm:w-10">
              <Home className="h-5 w-5 sm:h-[22px] sm:w-[22px]" fill="currentColor" fillOpacity={0.2} />
            </div>
            <span className="text-base font-bold tracking-tight text-slate-800 sm:text-xl">
              Rent<span className="text-[#3EB489]">Review</span>
            </span>
          </Link>

          {/* ── Desktop nav links (md+) ─────────────────────────────────── */}
          <div className="hidden items-center gap-6 md:flex lg:gap-10">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-semibold text-slate-500 transition-colors hover:text-[#3EB489]"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* ── Right actions ───────────────────────────────────────────── */}
          <div className="flex items-center gap-1.5 sm:gap-3 lg:gap-4">
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
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  className="flex items-center gap-1 rounded-full p-1 transition-colors hover:bg-slate-100 sm:gap-2 sm:pr-2"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3EB489] text-sm font-bold text-white shadow-md shadow-emerald-100 sm:h-9 sm:w-9">
                    {initial}
                  </div>
                  <ChevronDown
                    size={16}
                    className={`hidden text-slate-500 transition-transform duration-200 sm:block ${menuOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {menuOpen && (
                  <div
                    role="menu"
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
                  </div>
                )}
              </div>
            )}

            {/* Write a Review button (all sizes; tighter on mobile) */}
            <button
              onClick={handleWriteReview}
              className="flex items-center gap-1 rounded-lg bg-[#3EB489] px-2.5 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-100 transition-all hover:bg-[#35a37b] hover:shadow-emerald-200 active:scale-95 sm:gap-2 sm:rounded-xl sm:px-5 sm:py-2.5 sm:text-sm"
            >
              <span className="hidden sm:inline">Write a Review</span>
              <span className="sm:hidden">Review</span>
              <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>

            {/* Mobile menu toggle (mobile only) */}
            <button
              onClick={() => setMobileMenuOpen((o) => !o)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-700 transition-colors hover:bg-slate-100 md:hidden"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* ── Mobile menu panel ─────────────────────────────────────────── */}
        {mobileMenuOpen && (
          <div className="border-t border-slate-100 bg-white animate-[navSlide_0.18s_ease-out] md:hidden">
            <div className="mx-auto flex max-w-7xl flex-col gap-1 px-3 py-2 sm:px-6">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg px-3 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-[#3EB489]"
                >
                  {link.label}
                </a>
              ))}

              {!user && (
                <>
                  <div className="my-1 border-t border-slate-100" />
                  <Link
                    to="/signin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-lg px-3 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-[#3EB489]"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        )}

        <style>{`
          @keyframes navSlide {
            from { opacity: 0; transform: translateY(-6px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </nav>

      {/* Modals -unchanged */}
      {authOpen && (
        <LoginModal
          onClose={closeAllAuth}
          onSwitchToSignup={openSignup}
          onSuccess={handleLoginSuccess}
        />
      )}
      {signupOpen && (
        <SignupModal
          onClose={closeAllAuth}
          onSwitchToLogin={openLogin}
          onSuccess={handleSignupSuccess}
        />
      )}
    </>
  )
}

export default Navbar