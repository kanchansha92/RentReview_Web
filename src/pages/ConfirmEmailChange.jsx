import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Loader2, Home } from 'lucide-react';
import { confirmEmailChange } from '../services/authService';
import { logoutSuccess } from '../store/authSlice';
import { clearReviewData } from '../store/reviewSlice';
import { useDispatch } from 'react-redux';
import useSeo from '../hooks/useSeo';
import { motion } from '../animations';

/**
 * Lands from the link sent to a NEW email address. Opening it is what proves
 * the address is reachable the change is not applied until then, which is
 * what stops a stolen session from quietly moving an account to an attacker's
 * inbox.
 *
 * The address you sign in with has changed, so the old session is dropped and
 * the user is sent back to sign in.
 */
const ConfirmEmailChange = () => {
    useSeo({ title: 'Confirming your new email | RentReview', noindex: true });

    const { token } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // A missing token is knowable at first render, so it is initial state
    // rather than something an effect has to set.
    const [status, setStatus] = useState(token ? 'working' : 'failed'); // working | done | failed
    const [message, setMessage] = useState(token ? '' : 'That link is invalid or has expired.');
    const startedRef = useRef(false);

    useEffect(() => {
        // StrictMode mounts effects twice; the token is single-use, so the
        // second run would always report failure.
        if (!token || startedRef.current) return;
        startedRef.current = true;

        confirmEmailChange(token)
            .then((data) => {
                setStatus('done');
                setMessage(data.message || 'Email address updated. Please sign in again.');
                // The sign-in identity changed underneath this session.
                dispatch(logoutSuccess());
                dispatch(clearReviewData());
            })
            .catch((err) => {
                setStatus('failed');
                setMessage(err.message || 'That link is invalid or has expired.');
            });
    }, [token, dispatch]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#F9FAFB] px-4">
            <motion.div
                className="w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-xl p-10 text-center"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                {status === 'working' && (
                    <>
                        <Loader2 className="w-12 h-12 text-[#41B985] animate-spin mx-auto mb-5" />
                        <h1 className="text-xl font-bold text-[#0A0A0A]">Confirming your new address…</h1>
                    </>
                )}

                {status === 'done' && (
                    <>
                        <CheckCircle2 className="w-14 h-14 text-[#41B985] mx-auto mb-5" />
                        <h1 className="text-2xl font-bold text-[#0A0A0A] mb-2">Email updated</h1>
                        <p className="text-[#717182] mb-8">{message}</p>
                        <button
                            type="button"
                            onClick={() => navigate('/signin', { replace: true })}
                            className="w-full py-3.5 bg-[#41B985] text-white font-bold rounded-2xl hover:bg-[#35a37b] transition-colors"
                        >
                            Sign in
                        </button>
                    </>
                )}

                {status === 'failed' && (
                    <>
                        <AlertCircle className="w-14 h-14 text-rose-500 mx-auto mb-5" />
                        <h1 className="text-2xl font-bold text-[#0A0A0A] mb-2">That link didn't work</h1>
                        <p className="text-[#717182] mb-8">{message}</p>
                        <Link
                            to="/"
                            className="inline-flex items-center justify-center gap-2 w-full py-3.5 bg-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-200 transition-colors"
                        >
                            <Home size={18} /> Back to RentReview
                        </Link>
                    </>
                )}
            </motion.div>
        </div>
    );
};

export default ConfirmEmailChange;
