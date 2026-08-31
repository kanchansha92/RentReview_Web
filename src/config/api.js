// ─── API Configuration ────────────────────────────────────────────────────────
// Single source of truth for the backend URL and localStorage keys.

// Trailing slashes are stripped so `${API_BASE_URL}/auth/me` never doubles up.
export const API_BASE_URL = (
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
).replace(/\/+$/, '');

export const STORAGE_KEYS = {
    TOKEN: 'rr_token',
    USER: 'rr_user',
};

/**
 * Shared 401 handler for the service layer.
 * Services live outside the router, so we hard-navigate rather than using
 * react-router's navigate(). Clears both persisted auth keys first so the
 * store rehydrates as logged-out.
 * Returns true if a redirect was issued (caller may bail out early).
 */
export const handleUnauthorized = () => {
    try {
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
    } catch {
        // storage unavailable (private mode / SSR) — nothing to clear
    }

    if (typeof window === 'undefined') return false;

    // Don't bounce a user who is already on an auth page — that loops forever.
    const path = window.location.pathname;
    if (path === '/signin' || path === '/signup') return false;

    window.location.assign('/signin');
    return true;
};
