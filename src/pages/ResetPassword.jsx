import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, Home, Loader2, CheckCircle2 } from 'lucide-react';
import { BASE_URL } from '../constants';
import useSeo from '../hooks/useSeo';

const ResetPassword = () => {
    // Carries a single-use token in the URL -never indexable, and there's no
    // reason a search engine would ever need to crawl it.
    useSeo({ title: 'Reset Your Password | RentReview', noindex: true });

    const { token } = useParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!password || password.length < 6) { setError('Password must be at least 6 characters.'); return; }
        if (password !== confirm) { setError('Passwords do not match.'); return; }

        setLoading(true);
        try {
            const res = await fetch(`${BASE_URL}/auth/reset-password/${token}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
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
            setSuccess(true);
        } catch {
            setError('Unable to connect to the server. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4">
            <div className="w-full max-w-[440px] bg-white rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.2)] p-8 flex flex-col items-center gap-6">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
                    <div className="w-9 h-9 bg-[#41B985] rounded-xl flex items-center justify-center shadow">
                        <Home className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-lg font-bold text-[#0A0A0A]">RentReview</span>
                </Link>

                {success ? (
                    /* ── Success State ── */
                    <div className="flex flex-col items-center gap-4 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 border-2 border-[#41B985]">
                            <CheckCircle2 className="w-8 h-8 text-[#41B985]" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-[#0A0A0A]">Password Reset!</h1>
                            <p className="mt-1.5 text-sm text-[#717182]">
                                Your password has been updated successfully. You can now sign in with your new password.
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/signin')}
                            className="w-full bg-[#41B985] hover:bg-[#36a374] text-white font-semibold py-2.5 rounded-lg transition-all shadow-[0_4px_14px_0_rgba(65,185,133,0.35)]"
                        >
                            Go to Sign In
                        </button>
                    </div>
                ) : (
                    /* ── Form State ── */
                    <>
                        <div className="text-center">
                            <h1 className="text-2xl font-bold text-[#0A0A0A] tracking-tight">Set New Password</h1>
                            <p className="mt-1 text-sm text-[#717182]">Choose a strong password for your account</p>
                        </div>

                        {error && (
                            <div className="w-full flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3.5 py-3">
                                <span className="mt-0.5 shrink-0">⚠</span>
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} noValidate className="w-full flex flex-col gap-4">
                            {/* New Password */}
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="new-password" className="text-sm font-medium text-[#0A0A0A]">New Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#99A1AF] pointer-events-none" />
                                    <input
                                        id="new-password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Min. 6 characters"
                                        value={password}
                                        onChange={(e) => { setPassword(e.target.value); setError(''); }}
                                        className="w-full bg-[#F3F3F5] rounded-lg py-2.5 pl-10 pr-10 text-sm text-[#0A0A0A] placeholder-[#717182] focus:ring-2 outline-none transition-all border border-transparent focus:ring-[#41B985]"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#99A1AF] hover:text-[#717182] transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="confirm-password" className="text-sm font-medium text-[#0A0A0A]">Confirm Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#99A1AF] pointer-events-none" />
                                    <input
                                        id="confirm-password"
                                        type="password"
                                        placeholder="Re-enter your password"
                                        value={confirm}
                                        onChange={(e) => { setConfirm(e.target.value); setError(''); }}
                                        className="w-full bg-[#F3F3F5] rounded-lg py-2.5 pl-10 pr-4 text-sm text-[#0A0A0A] placeholder-[#717182] focus:ring-2 outline-none transition-all border border-transparent focus:ring-[#41B985]"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#41B985] hover:bg-[#36a374] active:bg-[#2d9062] disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all shadow-[0_4px_14px_0_rgba(65,185,133,0.35)]"
                            >
                                {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Resetting…</> : 'Reset Password'}
                            </button>
                        </form>

                        <Link to="/signin" className="text-sm text-[#717182] hover:text-[#0A0A0A] transition-colors">
                            Back to Sign In
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
};

export default ResetPassword;
