import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Home, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { verifyEmail as apiVerifyEmail } from '../services/authService';
import { updateUser, selectUser } from '../store/authSlice';
import useSeo from '../hooks/useSeo';
import { motion } from '../animations';



const VerifyEmail = () => {
    // Carries a single-use token in the URL -never indexable.
    useSeo({ title: 'Confirm Your Email | RentReview', noindex: true });

    const { token } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const user = useSelector(selectUser);

    // Derived from the token rather than set inside the effect: a synchronous
    // setState in an effect body triggers a second render pass for a value that
    // was already knowable at first render.
    const [status, setStatus] = useState(() => (token ? 'working' : 'failed'));
    const [message, setMessage] = useState(() =>
        token ? '' : 'That confirmation link is incomplete. Please open the link from your email again.'
    );

    // The token is single-use, so StrictMode's double mount would consume it on
    // the first run and report failure on the second.
    const startedRef = useRef(false);

    useEffect(() => {
        if (startedRef.current) return;
        startedRef.current = true;

        // A missing token is already reflected in the initial state above.
        if (!token) return;

        apiVerifyEmail(token)
            .then((data) => {
                setStatus('done');
                setMessage(data.message || 'Your email is confirmed.');
                // Only meaningful if this tab is signed in as that same user.
                if (user) dispatch(updateUser({ isVerified: true }));
            })
            .catch((err) => {
                setStatus('failed');
                setMessage(err.message || 'That confirmation link is invalid or has expired.');
            });
        // `user` is deliberately not a dependency -the ref already makes this
        // run exactly once, and including it would re-trigger on sign-in.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, dispatch]);

    return (
        <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4">
            {/* The card lands with a small spring so the page has a focal
                point the moment it opens. */}
            <motion.div
                className="w-full max-w-[440px] bg-white rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.2)] p-8 flex flex-col items-center gap-6"
                initial={{ opacity: 0, y: 18, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 240, damping: 22 }}
            >
                <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
                    <div className="w-9 h-9 bg-[#41B985] rounded-xl flex items-center justify-center shadow">
                        <Home className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-lg font-bold text-[#0A0A0A]">RentReview</span>
                </Link>

                {status === 'working' && (
                    <div className="flex flex-col items-center gap-3 text-center py-4">
                        <Loader2 className="w-10 h-10 text-[#41B985] animate-spin" />
                        <h1 className="text-xl font-bold text-[#0A0A0A]">Confirming your email…</h1>
                        <p className="text-sm text-[#717182]">This only takes a moment.</p>
                    </div>
                )}

                {status === 'done' && (
                    <div className="flex flex-col items-center gap-4 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 border-2 border-[#41B985]">
                            <CheckCircle2 className="w-8 h-8 text-[#41B985]" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-[#0A0A0A]">Email Confirmed</h1>
                            <p className="mt-1.5 text-sm text-[#717182]">{message}</p>
                        </div>
                        <button
                            onClick={() => navigate(user ? '/profile' : '/signin')}
                            className="w-full bg-[#41B985] hover:bg-[#36a374] text-white font-semibold py-2.5 rounded-lg transition-all shadow-[0_4px_14px_0_rgba(65,185,133,0.35)]"
                        >
                            {user ? 'Back to Profile' : 'Go to Sign In'}
                        </button>
                    </div>
                )}

                {status === 'failed' && (
                    <div className="flex flex-col items-center gap-4 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 border-2 border-red-300">
                            <AlertCircle className="w-8 h-8 text-red-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-[#0A0A0A]">Link Didn't Work</h1>
                            <p className="mt-1.5 text-sm text-[#717182]">{message}</p>
                            <p className="mt-2 text-sm text-[#717182]">
                                Confirmation links expire after 24 hours and can only be used once. You can send
                                yourself a new one from your profile.
                            </p>
                        </div>
                        <button
                            onClick={() => navigate(user ? '/profile' : '/signin')}
                            className="w-full bg-[#41B985] hover:bg-[#36a374] text-white font-semibold py-2.5 rounded-lg transition-all shadow-[0_4px_14px_0_rgba(65,185,133,0.35)]"
                        >
                            {user ? 'Go to Profile' : 'Sign In'}
                        </button>
                        <Link to="/" className="text-sm text-[#717182] hover:text-[#0A0A0A] transition-colors">
                            Back to home
                        </Link>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default VerifyEmail;
