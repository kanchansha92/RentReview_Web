import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Mail, Lock, Eye, EyeOff, X, Home, User, Check, Loader2 } from 'lucide-react';
import { API_BASE_URL, apiFetch, setCsrfToken } from '../config/api';
import { loginSuccess } from '../store/authSlice';
import useSeo from '../hooks/useSeo';
import {
    motion,
    AnimatePresence,
    errorVariants,
    staggerContainer,
    fadeUp,
    EASE,
} from '../animations';

const BENEFITS = [
    'Free to use, forever',
    'Verified reviews from real renters',
    'Share your own experiences',
];

const SignUp = () => {
    useSeo({
        title: 'Create Account | RentReview',
        description: 'Create a free RentReview account to write and read verified rental property reviews.',
        noindex: true,
    });

    const navigate = useNavigate();
    const dispatch = useDispatch();

    // ── Form state ───────────────────────────────────────────────────────────
    const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});

    // ── Handlers ─────────────────────────────────────────────────────────────
    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((p) => ({ ...p, [name]: value }));
        if (fieldErrors[name]) setFieldErrors((p) => ({ ...p, [name]: '' }));
        setError('');
    };

    const validate = () => {
        const errs = {};
        if (!form.name.trim()) errs.name = 'Full name is required.';
        if (!form.email.trim()) errs.email = 'Email is required.';
        else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email address.';
        if (!form.password) errs.password = 'Password is required.';
        else if (form.password.length < 6) errs.password = 'Password must be at least 6 characters.';
        if (!form.confirmPassword) errs.confirmPassword = 'Please confirm your password.';
        else if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match.';
        if (!agreeTerms) errs.agreeTerms = 'You must agree to the Terms of Service.';
        return errs;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const errs = validate();
        if (Object.keys(errs).length) { setFieldErrors(errs); return; }

        setLoading(true);
        try {
            const res = await apiFetch('/auth/register', {
                method: 'POST',
                body: ({
                    name: form.name.trim(),
                    email: form.email.trim(),
                    password: form.password,
                }),
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

          
            setCsrfToken(data.csrfToken);
            if (data.user) {
                dispatch(loginSuccess({ user: data.user }));
                navigate('/');
            } else {
                navigate('/signin');
            }
        } catch {
            setError('Unable to connect to the server. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        window.location.href = `${API_BASE_URL}/auth/google`;
    };

    const handleFacebookLogin = () => {
        window.location.href = `${API_BASE_URL}/auth/facebook`;
    };

    return (
        <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-2 sm:p-4 lg:p-6">
            {/* Main Container -lands as one card, then its two columns fill in */}
            <motion.div
                className="relative w-full max-w-[1100px] bg-white rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] flex flex-col md:flex-row overflow-hidden"
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 220, damping: 24 }}
            >

                {/* Left Column -marketing, md+ only */}
                <motion.aside
                    aria-label="About RentReview"
                    initial={{ opacity: 0, x: -24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.45, ease: EASE, delay: 0.12 }}
                    className="relative hidden md:flex md:w-[400px] md:min-h-full bg-gradient-to-br from-[#41B985] to-[#2d9e6e] p-6 lg:p-8 flex-col justify-center text-white overflow-hidden shrink-0"
                >
                    {/* Decorative discs, drifting on a very long loop. */}
                    <motion.div
                        aria-hidden="true"
                        className="absolute top-[-100px] right-[-100px] w-[200px] h-[200px] bg-white/10 rounded-full pointer-events-none"
                        animate={{ x: [0, 18, 0], y: [0, 14, 0], scale: [1, 1.06, 1] }}
                        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <motion.div
                        aria-hidden="true"
                        className="absolute bottom-[-80px] left-[-80px] w-[160px] h-[160px] bg-white/10 rounded-full pointer-events-none"
                        animate={{ x: [0, -16, 0], y: [0, -12, 0], scale: [1, 1.08, 1] }}
                        transition={{ duration: 19, repeat: Infinity, ease: 'easeInOut' }}
                    />

                    <div className="relative z-10 flex flex-col gap-4">
                        <Link
                            to="/"
                            aria-label="RentReview -go to home"
                            className="flex items-center gap-2.5 hover:opacity-90 transition-opacity w-fit"
                        >
                            <div className="w-10 h-10 bg-white rounded-xl shadow-[0_8px_12px_-2px_rgba(0,0,0,0.1)] flex items-center justify-center shrink-0">
                                <Home className="w-5 h-5 text-[#41B985]" aria-hidden="true" />
                            </div>
                            <span className="text-xl font-bold tracking-tight">RentReview</span>
                        </Link>

                        {/* Marketing copy, not a heading -see Signin.jsx for why. */}
                        <div className="flex flex-col gap-2">
                            <p className="text-2xl font-bold leading-tight tracking-tight">
                                Join Thousands of Smart Renters
                            </p>
                            <p className="text-sm text-white/85 leading-relaxed">
                                Make confident rental decisions with insights from our community of verified renters.
                            </p>
                        </div>

                        {/* Testimonial card */}
                        <figure className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 flex flex-col gap-3">
                            <div className="w-full h-36 lg:h-44 rounded-lg overflow-hidden shrink-0">
                                <img
                                    src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=800&auto=format&fit=crop"
                                    alt="A bright, welcoming rental apartment"
                                    width="800"
                                    height="500"
                                    loading="lazy"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <figcaption>
                                <blockquote>
                                    <p className="text-xs italic text-white/80 leading-relaxed">
                                        "RentReview helped me avoid a nightmare rental. The honest reviews made all the difference!"
                                    </p>
                                </blockquote>
                                <p className="text-xs font-semibold mt-1">
                                    -<cite className="not-italic">Sarah K., Bangalore</cite>
                                </p>
                            </figcaption>
                        </figure>

                        {/* Benefits list */}
                        <ul className="flex flex-col gap-3">
                            {BENEFITS.map((item, i) => (
                                <li key={i} className="flex items-start gap-2.5">
                                    <div aria-hidden="true" className="mt-0.5 w-4 h-4 rounded-full bg-white/25 flex items-center justify-center shrink-0">
                                        <Check className="w-2.5 h-2.5 text-white" />
                                    </div>
                                    <span className="text-sm font-medium text-white">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </motion.aside>

                {/* Right Column -sign-up form */}
                <main className="flex-1 flex flex-col justify-center p-4 sm:p-6 md:p-8 lg:p-10 relative">
                    <motion.button
                        type="button"
                        onClick={() => navigate('/')}
                        aria-label="Close and return to home"
                        whileHover={{ rotate: 90 }}
                        whileTap={{ scale: 0.85 }}
                        transition={{ duration: 0.2, ease: EASE }}
                        className="absolute top-3 right-3 sm:top-5 sm:right-5 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X className="w-5 h-5" aria-hidden="true" />
                    </motion.button>

                    <motion.div
                        className="w-full max-w-[390px] mx-auto flex flex-col gap-3 sm:gap-4"
                        initial="hidden"
                        animate="show"
                        variants={staggerContainer(0.06, 0.2)}
                    >
                        {/* Mobile-only compact logo */}
                        <Link
                            to="/"
                            aria-label="RentReview -go to home"
                            className="md:hidden flex items-center gap-2 self-center hover:opacity-90 transition-opacity"
                        >
                            <div className="w-8 h-8 bg-[#41B985] rounded-lg flex items-center justify-center shrink-0">
                                <Home className="w-4 h-4 text-white" fill="currentColor" fillOpacity={0.2} aria-hidden="true" />
                            </div>
                            <span className="text-base font-bold tracking-tight text-slate-800">
                                Rent<span className="text-[#41B985]">Review</span>
                            </span>
                        </Link>

                        {/* Page heading */}
                        <div className="flex flex-col gap-0.5 sm:gap-1">
                            <h1 className="text-xl sm:text-2xl font-semibold text-[#0A0A0A]">Create Account</h1>
                            <p className="text-xs sm:text-sm text-[#717182]">Start exploring reviews in just a few steps</p>
                        </div>

                        {/* OAuth buttons -side-by-side at all sizes */}
                        <div className="flex flex-row gap-2 sm:gap-3">
                            <button
                                type="button"
                                onClick={handleGoogleLogin}
                                aria-label="Continue with Google"
                                className="flex-1 flex items-center justify-center gap-2 py-2 sm:py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium text-[#0A0A0A] cursor-pointer"
                            >
                                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                Google
                            </button>
                            <button
                                type="button"
                                onClick={handleFacebookLogin}
                                aria-label="Continue with Facebook"
                                className="flex-1 flex items-center justify-center gap-2 py-2 sm:py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium text-[#0A0A0A] cursor-pointer"
                            >
                                <svg className="w-4 h-4 shrink-0 fill-[#1877F2]" viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                </svg>
                                Facebook
                            </button>
                        </div>

                        {/* Divider */}
                        <div className="flex items-center gap-3" role="separator" aria-label="Or sign up with email">
                            <div aria-hidden="true" className="flex-1 border-t border-slate-200" />
                            <span aria-hidden="true" className="text-xs text-[#6A7282] whitespace-nowrap">Or sign up with email</span>
                            <div aria-hidden="true" className="flex-1 border-t border-slate-200" />
                        </div>

                        {/* Error banner -height animates so the form slides down
                            to make room instead of jumping. */}
                        <AnimatePresence initial={false}>
                            {error && (
                                <motion.div
                                    key="signup-page-error"
                                    role="alert"
                                    variants={errorVariants}
                                    initial="hidden"
                                    animate="show"
                                    exit="exit"
                                    className="overflow-hidden"
                                >
                                    <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2.5">
                                        <span aria-hidden="true" className="mt-0.5 shrink-0">⚠</span>
                                        <span>{error}</span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Form */}
                        <motion.form variants={fadeUp} onSubmit={handleSubmit} noValidate className="flex flex-col gap-2.5 sm:gap-3">
                            {/* Name */}
                            <div className="flex flex-col gap-1">
                                <label htmlFor="name" className="text-sm font-medium text-[#0A0A0A]">Full Name</label>
                                <div className="relative">
                                    <User aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#99A1AF] pointer-events-none" />
                                    <input
                                        id="name"
                                        name="name"
                                        type="text"
                                        autoComplete="name"
                                        placeholder="John Doe"
                                        value={form.name}
                                        onChange={handleChange}
                                        aria-invalid={!!fieldErrors.name}
                                        aria-describedby={fieldErrors.name ? 'name-error' : undefined}
                                        className={`w-full bg-[#F3F3F5] rounded-lg py-2 sm:py-2.5 pl-10 pr-4 text-sm text-[#0A0A0A] placeholder-[#717182] focus:ring-2 outline-none transition-all border ${fieldErrors.name ? 'border-red-400 focus:ring-red-300' : 'border-transparent focus:ring-[#41B985]'}`}
                                    />
                                </div>
                                {fieldErrors.name && (
                                    <p id="name-error" className="text-xs text-red-500">{fieldErrors.name}</p>
                                )}
                            </div>

                            {/* Email */}
                            <div className="flex flex-col gap-1">
                                <label htmlFor="email" className="text-sm font-medium text-[#0A0A0A]">Email Address</label>
                                <div className="relative">
                                    <Mail aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#99A1AF] pointer-events-none" />
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        placeholder="you@example.com"
                                        value={form.email}
                                        onChange={handleChange}
                                        aria-invalid={!!fieldErrors.email}
                                        aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                                        className={`w-full bg-[#F3F3F5] rounded-lg py-2 sm:py-2.5 pl-10 pr-4 text-sm text-[#0A0A0A] placeholder-[#717182] focus:ring-2 outline-none transition-all border ${fieldErrors.email ? 'border-red-400 focus:ring-red-300' : 'border-transparent focus:ring-[#41B985]'}`}
                                    />
                                </div>
                                {fieldErrors.email && (
                                    <p id="email-error" className="text-xs text-red-500">{fieldErrors.email}</p>
                                )}
                            </div>

                            {/* Password */}
                            <div className="flex flex-col gap-1">
                                <label htmlFor="password" className="text-sm font-medium text-[#0A0A0A]">Password</label>
                                <div className="relative">
                                    <Lock aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#99A1AF] pointer-events-none" />
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="new-password"
                                        placeholder="Create a strong password"
                                        value={form.password}
                                        onChange={handleChange}
                                        aria-invalid={!!fieldErrors.password}
                                        aria-describedby={fieldErrors.password ? 'password-error' : undefined}
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
                                    <p id="password-error" className="text-xs text-red-500">{fieldErrors.password}</p>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div className="flex flex-col gap-1">
                                <label htmlFor="confirmPassword" className="text-sm font-medium text-[#0A0A0A]">Confirm Password</label>
                                <div className="relative">
                                    <Lock aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#99A1AF] pointer-events-none" />
                                    <input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        autoComplete="new-password"
                                        placeholder="Re-enter your password"
                                        value={form.confirmPassword}
                                        onChange={handleChange}
                                        aria-invalid={!!fieldErrors.confirmPassword}
                                        aria-describedby={fieldErrors.confirmPassword ? 'confirm-error' : undefined}
                                        className={`w-full bg-[#F3F3F5] rounded-lg py-2 sm:py-2.5 pl-10 pr-10 text-sm text-[#0A0A0A] placeholder-[#717182] focus:ring-2 outline-none transition-all border ${fieldErrors.confirmPassword ? 'border-red-400 focus:ring-red-300' : 'border-transparent focus:ring-[#41B985]'}`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                                        aria-pressed={showConfirmPassword}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#99A1AF] hover:text-[#717182] transition-colors"
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                                    </button>
                                </div>
                                {fieldErrors.confirmPassword && (
                                    <p id="confirm-error" className="text-xs text-red-500">{fieldErrors.confirmPassword}</p>
                                )}
                            </div>

                            {/* Terms agreement */}
                            <div className="flex flex-col gap-1">
                                <div className="flex items-start gap-2.5">
                                    <input
                                        type="checkbox"
                                        id="agreeTerms"
                                        checked={agreeTerms}
                                        onChange={(e) => { setAgreeTerms(e.target.checked); setFieldErrors((p) => ({ ...p, agreeTerms: '' })); }}
                                        aria-invalid={!!fieldErrors.agreeTerms}
                                        aria-describedby={fieldErrors.agreeTerms ? 'terms-error' : undefined}
                                        className="mt-0.5 w-4 h-4 shrink-0 rounded border-slate-300 accent-[#41B985] cursor-pointer"
                                    />
                                    <label htmlFor="agreeTerms" className="text-xs sm:text-sm text-[#4A5565] leading-snug cursor-pointer">
                                        I agree to the{' '}
                                        <Link
                                            to="/terms"
                                            target="_blank"
                            rel="noopener noreferrer"
                                           
                                            className="text-[#41B985] hover:underline font-medium"
                                        >
                                            Terms of Service
                                        </Link>
                                        {' '}and{' '}
                                        <Link
                                            to="/privacy"
                                            target="_blank"
                            rel="noopener noreferrer"
                                          
                                            className="text-[#41B985] hover:underline font-medium"
                                        >
                                            Privacy Policy
                                        </Link>
                                    </label>
                                </div>
                                {fieldErrors.agreeTerms && (
                                    <p id="terms-error" className="text-xs text-red-500 pl-6">{fieldErrors.agreeTerms}</p>
                                )}
                            </div>

                            {/* Submit */}
                            <motion.button
                                type="submit"
                                disabled={loading}
                                whileHover={loading ? undefined : { scale: 1.015 }}
                                whileTap={loading ? undefined : { scale: 0.98 }}
                                transition={{ duration: 0.15, ease: EASE }}
                                className="w-full bg-[#41B985] hover:bg-[#36a374] active:bg-[#2d9062] disabled:opacity-70 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-[0_4px_14px_0_rgba(65,185,133,0.35)] cursor-pointer"
                            >
                                {loading ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />Creating Account…</>
                                ) : (
                                    <>Create Account</>
                                )}
                            </motion.button>
                        </motion.form>

                        <motion.p variants={fadeUp} className="text-center text-xs sm:text-sm text-[#4A5565]">
                            Already have an account?{' '}
                            <Link to="/signin" className="text-[#41B985] font-semibold hover:underline">
                                Sign in
                            </Link>
                        </motion.p>
                    </motion.div>
                </main>
            </motion.div>
        </div>
    );
};

export default SignUp;