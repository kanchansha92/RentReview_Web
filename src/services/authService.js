// ─── Auth Service ─────────────────────────────────────────────────────────────
// Centralised helpers so every component reads/writes auth state the same way.

import { API_BASE_URL, handleUnauthorized } from '../config/api';

const TOKEN_KEY = 'rr_token';
const USER_KEY = 'rr_user';

/**
 * Returns the parsed user object stored after login/register, or null.
 */
export const getCurrentUser = () => {
    try {
        const raw = localStorage.getItem(USER_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

/**
 * Returns the JWT token string, or null.
 */
export const getToken = () => localStorage.getItem(TOKEN_KEY) || null;

/**
 * Stores token + user after a successful login/register response.
 * @param {string} token
 * @param {object} user
 */
export const saveAuth = (token, user) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
};

/**
 * Clears all auth data from localStorage (sign-out).
 */
export const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
};

/**
 * Returns true if a token exists (user is considered logged in).
 */
export const isAuthenticated = () => Boolean(getToken());

/**
 * Fetches latest user data from server.
 */
export const getMe = async () => {
    const token = getToken();
    if (!token) return null;

    const res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
    });

    if (res.status === 401) {
        handleUnauthorized();
        return null;
    }

    // A Render cold start answers with an HTML 502 -res.json() would throw and
    // take the caller down with it. Degrade to an empty object instead.
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
        if (data.user) localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        return data.user || null;
    }
    return null;
};

/**
 * Updates user profile.
 */
export const updateUserProfile = async (userData) => {
    const token = getToken();
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(userData)
    });

    if (res.status === 401) {
        handleUnauthorized();
        return { success: false, message: 'Your session has expired. Please sign in again.' };
    }

    const data = await res.json().catch(() => ({}));
    if (res.ok && data.user) {
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    }
    return data;
};


export const changePassword = async (passwords) => {
    const token = getToken();
    const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(passwords)
    });

    const data = await res.json().catch(() => ({}));

 
    if (res.status === 401 && !/current password/i.test(data.message || '')) {
        handleUnauthorized();
        return { success: false, message: 'Your session has expired. Please sign in again.' };
    }


    return data;
};


export const verifyEmail = async (token) => {
    const res = await fetch(`${API_BASE_URL}/auth/verify-email/${encodeURIComponent(token)}`, {
        method: 'PUT',
    });

    // A Render cold start answers with an HTML 502 -res.json() would throw and
    // surface as "couldn't connect" instead of the real outcome.
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(data.message || 'That confirmation link is invalid or has expired.');
    }
    return data;
};

/**
 * Asks the server to send a fresh confirmation link to the signed-in user's
 * own address. Resolves with { success, message, alreadyVerified? }.
 */
export const resendVerification = async () => {
    const token = getToken();
    const res = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 401) {
        handleUnauthorized();
        return { success: false, message: 'Your session has expired. Please sign in again.' };
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        return { success: false, message: data.message || "We couldn't send that email. Please try again." };
    }
    return data;
};
