import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Loader2 } from 'lucide-react';
import { motion } from '../animations';
import { apiFetch, setCsrfToken, STORAGE_KEYS } from '../config/api';
import { loginSuccess } from '../store/authSlice';
import useSeo from '../hooks/useSeo';



const clearStoredAuth = () => {
    try {
        localStorage.removeItem(STORAGE_KEYS.USER);
    } catch {
        // storage unavailable -nothing to clear
    }
};

const AuthSuccess = () => {
    // A transient redirect target, never a landing page -no reason for it to
    // ever show up in search results.
    useSeo({ title: 'Signing You In… | RentReview', noindex: true });

    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const code = searchParams.get('code');

    // The code is single-use: StrictMode's double mount would consume it on the
    // first run and fail the second. This ref makes the exchange fire once.
    const startedRef = useRef(false);

    useEffect(() => {
        if (startedRef.current) return;
        startedRef.current = true;

        const fail = (reason) => {
            if (reason) console.error('OAuth completion failed:', reason);
            clearStoredAuth();
            navigate('/signin?error=oauth', { replace: true });
        };

        const succeed = (user) => {
            // The exchange response set the session cookie; the store only
            // needs the user object for rendering.
            dispatch(loginSuccess({ user }));
            navigate('/', { replace: true });
        };

        // ── Preferred path: exchange the opaque one-time code for a session ──
        const exchangeCode = async () => {
            let res;
            try {
                res = await apiFetch('/auth/exchange', {
                    method: 'POST',
                    body: { code },
                });
            } catch (err) {
                return fail(err);
            }

            // An HTML 502 from a cold start must not throw here.
            const data = await res.json().catch(() => ({}));

            if (!res.ok || !data.success || !data.user) {
                return fail(data.message || `exchange returned ${res.status}`);
            }

            setCsrfToken(data.csrfToken);
            succeed(data.user);
        };

        // The legacy `?token=` path is gone: nothing produces it any more, and
        // a JWT in a URL is exactly what the cookie migration removes it
        // lands in browser history, Referer headers and server logs.
        if (code) exchangeCode();
        else fail('no code in the callback URL');
    }, [code, navigate, dispatch]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#F9FAFB]">
            {/* A brief hold before fading in: this screen usually lasts under a
                second, and a message that flashes reads worse than none. */}
            <motion.div
                className="flex flex-col items-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
            >
                <Loader2 className="w-12 h-12 text-[#41B985] animate-spin mb-4" />
                <h1 className="text-xl font-semibold text-[#0A0A0A]">Completing Authentication...</h1>
                <p className="text-[#717182]">Please wait while we set up your session.</p>
            </motion.div>
        </div>
    );
};

export default AuthSuccess;
