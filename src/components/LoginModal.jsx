import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Mail, Lock, Eye, EyeOff, X, Loader2, Home } from 'lucide-react';
import {
    motion,
    AnimatePresence,
    backdropVariants,
    modalVariants,
    errorVariants,
    staggerContainer,
    fadeUp,
    EASE,
} from '../animations';
import { API_BASE_URL, apiFetch, setCsrfToken } from '../config/api';
import { loginSuccess } from '../store/authSlice';
import ForgotPasswordModal from './ForgotPasswordModal';

const FOCUSABLE_SELECTOR =
    'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function useDialogA11y(dialogRef, active = true) {
    // Body scroll lock -save/restore the previous value, never hardcode ''.
    useEffect(() => {
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = previousOverflow; };
    }, []);

    // Focus restore.
    useEffect(() => {
        const previouslyFocused = document.activeElement;
        return () => {
            // If something else already claimed focus (e.g. the dialog we just
            // switched to), leave it alone.
            const current = document.activeElement;
            if (current && current !== document.body) return;
            if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
                previouslyFocused.focus();
            }
        };
    }, []);

    // Focus trap.
    useEffect(() => {
        if (!active) return undefined;
        const handleKeyDown = (e) => {
            if (e.key !== 'Tab') return;
            const root = dialogRef.current;
            if (!root) return;
            const focusable = Array.from(root.querySelectorAll(FOCUSABLE_SELECTOR))
                .filter((el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true');
            if (!focusable.length) return;

            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            const current = document.activeElement;
            const inside = root.contains(current);

            if (e.shiftKey) {
                if (!inside || current === first) { e.preventDefault(); last.focus(); }
            } else if (!inside || current === last) {
                e.preventDefault();
                first.focus();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [dialogRef, active]);
}

const LoginModal = ({ onClose, onSuccess, onSwitchToSignup }) => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [form, setForm] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const dialogRef = useRef(null);

    useDialogA11y(dialogRef, !showForgotPassword);

 
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape' && !showForgotPassword) onClose();
        };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [onClose, showForgotPassword]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((p) => ({ ...p, [name]: value }));
        if (fieldErrors[name]) setFieldErrors((p) => ({ ...p, [name]: '' }));
        setError('');
    };

    const validate = () => {
        const errs = {};
        if (!form.email.trim()) errs.email = 'Email is required.';
        else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email.';
        if (!form.password) errs.password = 'Password is required.';
        return errs;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const errs = validate();
        if (Object.keys(errs).length) { setFieldErrors(errs); return; }

        setLoading(true);
        try {
            const res = await apiFetch('/auth/login', {
                method: 'POST',
                body: { email: form.email.trim(), password: form.password },
            });
          
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                // A 5xx with no JSON body is almost always a cold start, not a
                // fault the user can do anything about except wait a moment.
                setError(
                    data.message ||
                    (res.status >= 500
                        ? 'The server is waking up. Please try again in a moment.'
                        : 'Something went wrong.')
                );
                return;
            }

            // The session arrived as an HttpOnly cookie; only the user object
            // is ours to hold.
            setCsrfToken(data.csrfToken);
            dispatch(loginSuccess({ user: data.user }));
            onSuccess?.(data.user);
            onClose();
        } catch {
            setError('Unable to connect to the server. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        // ── Backdrop ──────────────────────────────────────────────────────────
        // The host renders this inside <AnimatePresence>, so the exit variants
        // below actually run: the card scales back down as the scrim clears,
        // instead of the whole dialog being cut on the closing frame.
        <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            variants={backdropVariants}
            initial="hidden"
            animate="show"
            exit="exit"
        >
            {/* ── Modal card ─────────────────────────────────────────────────── */}
            <motion.div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="login-modal-title"
                aria-describedby="login-modal-desc"
                variants={modalVariants}
                className="relative w-full max-w-[440px] max-h-[calc(100vh-1.5rem)] overflow-y-auto rounded-2xl bg-white shadow-[0_32px_64px_-12px_rgba(0,0,0,0.35)]"
            >
                {/* Close button */}
                <motion.button
                    type="button"
                    onClick={onClose}
                    aria-label="Close login dialog"
                    whileHover={{ rotate: 90 }}
                    whileTap={{ scale: 0.85 }}
                    transition={{ duration: 0.2, ease: EASE }}
                    className="absolute right-3 top-3 sm:right-4 sm:top-4 z-10 text-slate-400 hover:text-slate-600 transition-colors rounded-lg p-1 hover:bg-slate-100"
                >
                    <X className="w-5 h-5" aria-hidden="true" />
                </motion.button>

                {/* Contents arrive just behind the card so the dialog reads as
                    one object settling, not a stack of parts flying in. */}
                <motion.div
                    className="flex flex-col items-center gap-4 sm:gap-5 px-5 pt-8 pb-6 sm:px-8 sm:pt-10 sm:pb-8"
                    variants={staggerContainer(0.05, 0.1)}
                    initial="hidden"
                    animate="show"
                >
                    {/* Decorative icon */}
                    <motion.div
                        aria-hidden="true"
                        variants={{
                            hidden: { opacity: 0, scale: 0.5 },
                            show: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 16 } },
                        }}
                        className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-[#41B985] shadow-lg shadow-emerald-100"
                    >
                        <Home className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                    </motion.div>

                    {/* Heading */}
                    <motion.div variants={fadeUp} className="text-center">
                        <h2 id="login-modal-title" className="text-xl sm:text-2xl font-bold text-[#0A0A0A] tracking-tight">
                            Welcome back
                        </h2>
                        <p id="login-modal-desc" className="mt-1 text-xs sm:text-sm text-[#717182]">
                            Sign in to your RentReview account
                        </p>
                    </motion.div>

                    {/* Error banner. Height + opacity so the form below slides
                        down to make room rather than jumping. */}
                    <AnimatePresence initial={false}>
                        {error && (
                            <motion.div
                                key="login-error"
                                role="alert"
                                variants={errorVariants}
                                initial="hidden"
                                animate="show"
                                exit="exit"
                                className="w-full overflow-hidden"
                            >
                                <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2.5">
                                    <span aria-hidden="true" className="mt-0.5 shrink-0">⚠</span>
                                    <span>{error}</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Form */}
                    <motion.form variants={fadeUp} onSubmit={handleSubmit} noValidate className="w-full flex flex-col gap-3 sm:gap-4">
                        {/* Email */}
                        <div className="flex flex-col gap-1">
                            <label htmlFor="modal-email" className="text-sm font-medium text-[#0A0A0A]">Email</label>
                            <div className="relative">
                                <Mail aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#99A1AF] pointer-events-none" />
                                <input
                                    id="modal-email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    autoFocus
                                    placeholder="you@example.com"
                                    value={form.email}
                                    onChange={handleChange}
                                    aria-invalid={!!fieldErrors.email}
                                    aria-describedby={fieldErrors.email ? 'modal-email-error' : undefined}
                                    className={`w-full bg-[#F3F3F5] rounded-lg py-2 sm:py-2.5 pl-10 pr-4 text-sm text-[#0A0A0A] placeholder-[#717182] focus:ring-2 outline-none transition-all border ${fieldErrors.email ? 'border-red-400 focus:ring-red-300' : 'border-transparent focus:ring-[#41B985]'}`}
                                />
                            </div>
                            {fieldErrors.email && (
                                <p id="modal-email-error" className="text-xs text-red-500">{fieldErrors.email}</p>
                            )}
                        </div>

                        {/* Password */}
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                                <label htmlFor="modal-password" className="text-sm font-medium text-[#0A0A0A]">Password</label>
                                <button
                                    type="button"
                                    onClick={() => setShowForgotPassword(true)}
                                    className="text-xs sm:text-sm font-medium text-[#41B985] hover:underline cursor-pointer"
                                >
                                    Forgot password?
                                </button>
                            </div>
                            <div className="relative">
                                <Lock aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#99A1AF] pointer-events-none" />
                                <input
                                    id="modal-password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    placeholder="••••••••"
                                    value={form.password}
                                    onChange={handleChange}
                                    aria-invalid={!!fieldErrors.password}
                                    aria-describedby={fieldErrors.password ? 'modal-password-error' : undefined}
                                    className={`w-full bg-[#F3F3F5] rounded-lg py-2 sm:py-2.5 pl-10 pr-10 text-sm text-[#0A0A0A] placeholder-[#717182] focus:ring-2 outline-none transition-all border ${fieldErrors.password ? 'border-red-400 focus:ring-red-300' : 'border-transparent focus:ring-[#41B985]'}`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    aria-pressed={showPassword}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#99A1AF] hover:text-[#717182] transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                                </button>
                            </div>
                            {fieldErrors.password && (
                                <p id="modal-password-error" className="text-xs text-red-500">{fieldErrors.password}</p>
                            )}
                        </div>

                        {/* Submit */}
                        <motion.button
                            type="submit"
                            disabled={loading}
                            whileHover={loading ? undefined : { scale: 1.015 }}
                            whileTap={loading ? undefined : { scale: 0.98 }}
                            transition={{ duration: 0.15, ease: EASE }}
                            className="w-full bg-[#41B985] cursor-pointer hover:bg-[#36a374] active:bg-[#2d9062] disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-[0_4px_14px_0_rgba(65,185,133,0.35)] mt-0.5"
                        >
                            {loading ? (
                                <><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />Signing In…</>
                            ) : 'Sign In'}
                        </motion.button>
                    </motion.form>

                    {/* OR divider */}
                    <motion.div variants={fadeUp} className="w-full flex items-center gap-3" role="separator" aria-label="Or continue with Google">
                        <div aria-hidden="true" className="flex-1 border-t border-slate-200" />
                        <span aria-hidden="true" className="text-xs text-[#6A7282]">OR</span>
                        <div aria-hidden="true" className="flex-1 border-t border-slate-200" />
                    </motion.div>

                    {/* Google */}
                    <motion.button
                        type="button"
                        variants={fadeUp}
                        onClick={() => window.location.href = `${API_BASE_URL}/auth/google`}
                        aria-label="Continue with Google"
                        whileHover={{ scale: 1.015 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ duration: 0.15, ease: EASE }}
                        className="w-full flex items-center cursor-pointer justify-center gap-2.5 border border-slate-200 rounded-lg py-2 sm:py-2.5 text-sm font-medium text-[#0A0A0A] hover:bg-slate-50 transition-colors"
                    >
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Continue with Google
                    </motion.button>

                    {/* Sign up link */}
                    <motion.p variants={fadeUp} className="text-xs sm:text-sm text-[#4A5565]">
                        Don't have an account?{' '}
                        <button
                            type="button"
                            onClick={() => {
                                // Switching dialogs is NOT a dismissal -don't call
                                // onClose(), the host clears its auth intent there
                                // (e.g. ReviewNavbar's pending "Write a Review").
                                if (onSwitchToSignup) onSwitchToSignup();
                                else { onClose(); navigate('/signup'); }
                            }}
                            className="text-[#41B985] font-semibold hover:underline cursor-pointer"
                        >
                            Sign Up
                        </button>
                    </motion.p>
                </motion.div>
            </motion.div>

            <AnimatePresence>
                {showForgotPassword && (
                    <ForgotPasswordModal
                        key="forgot-password-modal"
                        onClose={() => setShowForgotPassword(false)}
                        onBackToLogin={() => setShowForgotPassword(false)}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default LoginModal;
