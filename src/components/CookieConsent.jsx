import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Cookie } from 'lucide-react';
import { motion, AnimatePresence } from '../animations';



const STORAGE_KEY = 'rr_cookie_consent';
const CONSENT_EVENT = 'rr:cookie-consent';

/** @returns {'granted'|'denied'|null} null = not yet asked */
export const getConsent = () => {
    try {
        const v = localStorage.getItem(STORAGE_KEY);
        return v === 'granted' || v === 'denied' ? v : null;
    } catch {
        // Storage blocked (private mode, strict settings). Treat as undecided,
        // which means nothing non-essential loads the safe direction.
        return null;
    }
};

export const setConsent = (value) => {
    try {
        localStorage.setItem(STORAGE_KEY, value);
    } catch {
        /* preference simply won't persist; the default stays "no" */
    }
    // Same-tab listeners (the ad component) don't get a `storage` event, so
    // announce it directly.
    window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: value }));
};

/** Subscribe to changes. Returns an unsubscribe function. */
export const onConsentChange = (handler) => {
    const local = (e) => handler(e.detail);
    const crossTab = (e) => {
        if (e.key === STORAGE_KEY) handler(getConsent());
    };
    window.addEventListener(CONSENT_EVENT, local);
    window.addEventListener('storage', crossTab);
    return () => {
        window.removeEventListener(CONSENT_EVENT, local);
        window.removeEventListener('storage', crossTab);
    };
};

const CookieConsent = () => {
    // Starts hidden and is shown from an effect, so the banner never flashes
    // for someone who already decided.
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (getConsent() === null) setVisible(true);
        return onConsentChange(() => setVisible(false));
    }, []);

    const decide = (value) => {
        setConsent(value);
        setVisible(false);
    };

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    role="region"
                    aria-label="Cookie choices"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.25 }}
                    className="fixed bottom-0 inset-x-0 z-[70] p-3 sm:p-4"
                >
                    <div className="mx-auto max-w-3xl rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl">
                        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                            <div className="hidden sm:flex w-11 h-11 rounded-2xl bg-[#41B985]/10 text-[#41B985] items-center justify-center shrink-0">
                                <Cookie size={20} aria-hidden="true" />
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-[#0F172A] mb-1">
                                    Cookies for advertising
                                </p>
                                <p className="text-xs sm:text-sm text-[#4A5565] leading-relaxed">
                                    RentReview works without them. If you say yes, we&apos;ll show ads from
                                    Google, which sets its own cookies to do that. Saying no changes nothing
                                    about the site you can change your mind any time on our{' '}
                                    <Link to="/privacy" className="text-[#41B985] font-semibold underline">
                                        Privacy page
                                    </Link>
                                    .
                                </p>
                            </div>

                            {/* Both buttons carry equal weight on purpose: a
                                refusal that is harder than acceptance is not a
                                free choice, and regulators read it that way. */}
                            <div className="flex gap-2 shrink-0 sm:pt-1">
                                <button
                                    type="button"
                                    onClick={() => decide('denied')}
                                    className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-[#4A5565] hover:bg-slate-50 transition-colors"
                                >
                                    No thanks
                                </button>
                                <button
                                    type="button"
                                    onClick={() => decide('granted')}
                                    className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-[#41B985] text-sm font-bold text-white hover:bg-[#35a37b] transition-colors"
                                >
                                    Allow
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CookieConsent;
