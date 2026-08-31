import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link, useLocation } from 'react-router-dom'
import { Lock, ArrowRight, Home, ShieldCheck } from 'lucide-react'
import { selectUser, selectIsAuthenticated, loginSuccess } from '../store/authSlice'
import LoginModal from './LoginModal'
import SignupModal from './SignupModal'



const ProtectedRoute = ({ children }) => {
    const user = useSelector(selectUser)
    const isAuthenticated = useSelector(selectIsAuthenticated)
    const dispatch = useDispatch()
    const location = useLocation()

    const isSignedIn = Boolean(isAuthenticated && user)

    // Auto-open the LoginModal on first mount of the guard view
    const [showLogin, setShowLogin] = useState(true)
    const [showSignup, setShowSignup] = useState(false)


    useEffect(() => {
        if (isSignedIn) return // page itself manages its own meta
        let meta = document.querySelector('meta[name="robots"]')
        let created = false
        if (!meta) {
            meta = document.createElement('meta')
            meta.name = 'robots'
            document.head.appendChild(meta)
            created = true
        }
        const prev = meta.content
        meta.content = 'noindex, nofollow'
        return () => {
            if (created) meta.remove()
            else meta.content = prev
        }
    }, [isSignedIn])

    // Authenticated -render the actual protected page
    if (isSignedIn) return children

    // Not authenticated -render the guard
    return (
        <>
            <main
                role="main"
                aria-labelledby="auth-guard-heading"
                className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#F0FDF4]/40 to-[#F9FAFB] px-4 py-12 sm:px-6"
            >
                <div className="w-full max-w-md">
                    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
                        <div className="flex flex-col items-center text-center gap-5 sm:gap-6">
                            {/* Icon */}
                            <div
                                className="flex h-16 w-16 items-center justify-center rounded-full bg-[#F0FDF4] ring-4 ring-[#DCFCE7]"
                                aria-hidden="true"
                            >
                                <Lock className="h-7 w-7 text-[#3EB489]" strokeWidth={2.5} />
                            </div>

                            {/* Accent label */}
                            <div className="flex items-center gap-2">
                                <div aria-hidden="true" className="h-1 w-8 rounded-full bg-[#3EB489]" />
                                <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.15em] text-[#3EB489] uppercase">
                                    Members Only
                                </span>
                            </div>

                            {/* Copy */}
                            <div className="space-y-2">
                                <h1
                                    id="auth-guard-heading"
                                    className="text-xl sm:text-2xl font-bold tracking-tight text-[#0F172A]"
                                >
                                    Sign in to continue
                                </h1>
                                <p className="text-sm sm:text-base text-[#64748B] leading-relaxed">
                                    This page is for verified members. Sign in or create an account -it only takes a minute, and your reviews stay verified for everyone you help.
                                </p>
                            </div>

                            {/* CTAs */}
                            <div className="flex w-full flex-col gap-2 sm:flex-row sm:gap-3 pt-1">
                                <button
                                    type="button"
                                    onClick={() => setShowLogin(true)}
                                    className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-[#3EB489] px-4 text-sm font-bold text-white shadow-md shadow-emerald-100 transition-all hover:bg-[#35a37b] active:scale-95 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3EB489] focus-visible:ring-offset-2"
                                >
                                    Sign In
                                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowSignup(true)}
                                    className="flex h-11 flex-1 items-center justify-center rounded-lg border-2 border-[#3EB489] bg-white px-4 text-sm font-bold text-[#3EB489] transition-all hover:bg-[#F0FDF4] active:scale-95 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3EB489] focus-visible:ring-offset-2"
                                >
                                    Create Account
                                </button>
                            </div>

                            {/* Back link */}
                            <Link
                                to="/"
                                className="flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#0F172A] focus:outline-none focus-visible:underline mt-1"
                            >
                                <Home className="h-3.5 w-3.5" aria-hidden="true" />
                                Go to homepage
                            </Link>
                        </div>
                    </article>

                    {/* Trust footer */}
                    <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-[#64748B]">
                        <ShieldCheck className="h-3.5 w-3.5 text-[#3EB489]" aria-hidden="true" />
                        Free forever · No credit card · Privacy protected
                    </p>
                </div>
            </main>

            {/* Auth modals -reuse the existing components used by ReviewNavbar */}
            {showLogin && (
                <LoginModal
                    onClose={() => setShowLogin(false)}
                    onSwitchToSignup={() => {
                        setShowLogin(false)
                        setShowSignup(true)
                    }}
                    onSuccess={(loggedInUser, token) => {
                        dispatch(loginSuccess({ user: loggedInUser, token }))
                        setShowLogin(false)
                        // Component re-renders -protected page renders next tick
                    }}
                />
            )}
            {showSignup && (
                <SignupModal
                    onClose={() => setShowSignup(false)}
                    onSwitchToLogin={() => {
                        setShowSignup(false)
                        setShowLogin(true)
                    }}
                    onSuccess={(registeredUser, token) => {
                        dispatch(loginSuccess({ user: registeredUser, token }))
                        setShowSignup(false)
                    }}
                />
            )}
        </>
    )
}

export default ProtectedRoute