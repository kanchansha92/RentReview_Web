import React, { useState, useEffect, useRef } from 'react';
import { Mail, X, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';
import { apiFetch } from '../config/api';
import { useDialogA11y } from './LoginModal';
import {
    motion,
    AnimatePresence,
    backdropVariants,
    modalVariants,
    errorVariants,
    EASE,
} from '../animations';

const ForgotPasswordModal = ({ onClose, onBackToLogin }) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [sent, setSent] = useState(false);
    const dialogRef = useRef(null);

    useDialogA11y(dialogRef);

    // Close on Escape key
    useEffect(() => {
        const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!email.trim()) { setError('Please enter your email address.'); return; }
        // The backend deliberately 200s on unknown addresses, so a typo would
        // otherwise render "we've sent a link to bob" and the user would wait
        // forever for mail that was never sent. Same check every other form uses.
        if (!/\S+@\S+\.\S+/.test(email.trim())) {
            setError('Enter a valid email address.');
            return;
        }

        setLoading(true);
        try {
            const res = await apiFetch('/auth/forgot-password', {
                method: 'POST',
                body: { email: email.trim() },
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
            setSent(true);
        } catch {
            setError('Unable to connect to the server. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        if (onBackToLogin) onBackToLogin();
        else onClose();
    };

    return (
        // Rendered inside LoginModal's <AnimatePresence>, so the exit variants
        // below run when the dialog is dismissed.
        <motion.div
            className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            variants={backdropVariants}
            initial="hidden"
            animate="show"
            exit="exit"
        >
            <motion.div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="fp-modal-title"
                aria-describedby="fp-modal-desc"
                variants={modalVariants}
                // The panel's height changes when the form is replaced by the
                // success message; layout animation makes that a smooth resize.
                layout
                className="relative w-full max-w-[420px] max-h-[calc(100vh-1.5rem)] overflow-y-auto rounded-2xl bg-white shadow-[0_32px_64px_-12px_rgba(0,0,0,0.35)]"
            >
                <motion.button
                    type="button"
                    onClick={onClose}
                    aria-label="Close password reset dialog"
                    whileHover={{ rotate: 90 }}
                    whileTap={{ scale: 0.85 }}
                    transition={{ duration: 0.2, ease: EASE }}
                    className="absolute right-3 top-3 z-10 text-slate-400 hover:text-slate-600 transition-colors rounded-lg p-1 hover:bg-slate-100"
                >
                    <X className="w-5 h-5" aria-hidden="true" />
                </motion.button>

                <div className="flex flex-col items-center gap-4 sm:gap-5 px-5 pt-6 pb-5 sm:px-7 sm:pt-8 sm:pb-7">
                    {/* Decorative status icon -swaps with a spring when the mail
                        goes out, which is the confirmation people actually look at. */}
                    <div
                        aria-hidden="true"
                        className="flex h-12 w-12 items-center justify-center rounded-full bg-[#41B985] shadow-lg shadow-emerald-100"
                    >
                        <AnimatePresence mode="wait" initial={false}>
                            <motion.span
                                key={sent ? 'sent' : 'idle'}
                                className="inline-flex"
                                initial={{ opacity: 0, scale: 0.4, rotate: -30 }}
                                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                exit={{ opacity: 0, scale: 0.4, rotate: 30 }}
                                transition={{ type: 'spring', stiffness: 380, damping: 20 }}
                            >
                                {sent ? <CheckCircle2 className="w-6 h-6 text-white" /> : <Mail className="w-6 h-6 text-white" />}
                            </motion.span>
                        </AnimatePresence>
                    </div>

                    {/* mode="wait" so the outgoing state clears before the next
                        one arrives -the two panels are different heights. */}
                    <AnimatePresence mode="wait" initial={false}>
                    {sent ? (
                        /* ── Success State ── */
                        <motion.div
                            key="fp-sent"
                            role="status"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.22, ease: EASE }}
                            className="flex flex-col items-center gap-4 text-center w-full"
                        >
                            <div>
                                <h2 id="fp-modal-title" className="text-xl font-bold text-[#0A0A0A] tracking-tight">
                                    Check your inbox
                                </h2>
                                <p id="fp-modal-desc" className="mt-1.5 text-sm text-[#717182] leading-relaxed">
                                    We've sent a password reset link to{' '}
                                    <span className="font-semibold text-[#0A0A0A]">{email}</span>.
                                    The link expires in <strong>15 minutes</strong>.
                                </p>
                            </div>
                            <p className="text-xs text-[#717182]">
                                Didn't get it? Check your spam folder or try again.
                            </p>
                            <button
                                type="button"
                                onClick={() => setSent(false)}
                                className="text-sm text-[#41B985] font-semibold hover:underline cursor-pointer"
                            >
                                Try a different email
                            </button>
                            <button
                                type="button"
                                onClick={handleBack}
                                className="w-full bg-[#41B985] cursor-pointer hover:bg-[#36a374] active:bg-[#2d9062] text-white font-semibold py-2.5 rounded-lg transition-all shadow-[0_4px_14px_0_rgba(65,185,133,0.35)]"
                            >
                                Back to Login
                            </button>
                        </motion.div>
                    ) : (
                        /* ── Form State ── */
                        <motion.div
                            key="fp-form"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.22, ease: EASE }}
                            className="flex w-full flex-col items-center gap-4 sm:gap-5"
                        >
                            <div className="text-center">
                                <h2 id="fp-modal-title" className="text-xl font-bold text-[#0A0A0A] tracking-tight">
                                    Forgot Password?
                                </h2>
                                <p id="fp-modal-desc" className="mt-1 text-xs sm:text-sm text-[#717182]">
                                    Enter your email and we'll send you a reset link
                                </p>
                            </div>

                            <AnimatePresence initial={false}>
                                {error && (
                                    <motion.div
                                        key="fp-error"
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

                            <form onSubmit={handleSubmit} noValidate className="w-full flex flex-col gap-3 sm:gap-4">
                                <div className="flex flex-col gap-1">
                                    <label htmlFor="fp-email" className="text-sm font-medium text-[#0A0A0A]">
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <Mail
                                            aria-hidden="true"
                                            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#99A1AF] pointer-events-none"
                                        />
                                        <input
                                            id="fp-email"
                                            type="email"
                                            autoComplete="email"
                                            autoFocus
                                            placeholder="you@example.com"
                                            value={email}
                                            onChange={(e) => { setEmail(e.target.value); setError(''); }}
                                            aria-invalid={!!error && !email.trim()}
                                            className="w-full bg-[#F3F3F5] rounded-lg py-2 sm:py-2.5 pl-10 pr-4 text-sm text-[#0A0A0A] placeholder-[#717182] focus:ring-2 outline-none transition-all border border-transparent focus:ring-[#41B985]"
                                        />
                                    </div>
                                </div>

                                <motion.button
                                    type="submit"
                                    disabled={loading}
                                    whileHover={loading ? undefined : { scale: 1.015 }}
                                    whileTap={loading ? undefined : { scale: 0.98 }}
                                    transition={{ duration: 0.15, ease: EASE }}
                                    className="w-full bg-[#41B985] cursor-pointer hover:bg-[#36a374] active:bg-[#2d9062] disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-[0_4px_14px_0_rgba(65,185,133,0.35)]"
                                >
                                    {loading ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />Sending…</>
                                    ) : (
                                        'Send Reset Link'
                                    )}
                                </motion.button>
                            </form>

                            <button
                                type="button"
                                onClick={handleBack}
                                className="flex items-center gap-1.5 text-xs sm:text-sm text-[#717182] hover:text-[#0A0A0A] transition-colors cursor-pointer"
                            >
                                <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                                Back to Login
                            </button>
                        </motion.div>
                    )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default ForgotPasswordModal;
