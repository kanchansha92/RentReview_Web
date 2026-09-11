// ─── Auth Service ─────────────────────────────────────────────────────────────
// Centralised helpers so every component reads/writes auth state the same way.
//
// There is no token here any more. The session is an HttpOnly cookie set by the
// server, which this code cannot read and an injected script cannot steal. What
// stays in localStorage is the user OBJECT, and only so the UI has something to
// render before /auth/me answers it authorises nothing.

import { apiFetch, apiJson, handleUnauthorized, clearCsrfToken, STORAGE_KEYS } from '../config/api';

const USER_KEY = STORAGE_KEYS.USER;

/**
 * Returns the cached user object, or null. Optimistic only: the server decides
 * whether the session is real, and getMe() below is what confirms it.
 */
export const getCurrentUser = () => {
    try {
        const raw = localStorage.getItem(USER_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

/** Cache the user after a successful login/register/OAuth. */
export const saveAuth = (user) => {
    try {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch {
        // storage unavailable the session cookie still works, the UI just
        // has nothing to show until /auth/me answers.
    }
};

/**
 * Sign out. The cookie is HttpOnly, so only the server can clear it the
 * local cache is dropped either way, so a failed request still signs you out
 * of this tab rather than leaving it in a half state.
 */
export const logout = async () => {
    let serverCleared = false;
    try {
        const res = await apiFetch('/auth/logout', { method: 'POST' });
        serverCleared = res.ok;
        if (!res.ok) {
            // Worth knowing about: the local state says signed out while the
            // cookie may still be live. /auth/logout is not CSRF-gated, so this
            // should only ever be a network or server fault.
            console.error('Sign-out request failed:', res.status);
        }
    } catch (err) {
        console.error('Sign-out request failed:', err && err.message);
    }
    try {
        localStorage.removeItem(USER_KEY);
    } catch {
        /* nothing to clear */
    }
    clearCsrfToken();
    return serverCleared;
};

/**
 * True if we have a cached user. Optimistic: it says "render as signed in",
 * not "this session is valid" only the server can answer that.
 */
export const isAuthenticated = () => Boolean(getCurrentUser());

/**
 * Checks the session WITHOUT redirecting, and tells the three cases apart:
 *
 *   'valid'   the server confirmed the session, `user` is fresh
 *   'invalid' the server said 401; the session is genuinely gone
 *   'unknown' we could not reach the server (offline, or a cold-start 502)
 *
 * The distinction matters: treating 'unknown' as signed-out would drop a
 * perfectly good session every time the API is slow to wake, and a background
 * check must never bounce someone off the public page they are reading.
 */
export const verifySession = async () => {
    let res;
    try {
        res = await apiFetch('/auth/me');
    } catch {
        return { status: 'unknown', user: null };
    }

    if (res.status === 401) return { status: 'invalid', user: null };
    if (!res.ok) return { status: 'unknown', user: null };

    const data = await res.json().catch(() => ({}));
    if (!data.user) return { status: 'unknown', user: null };

    saveAuth(data.user);
    return { status: 'valid', user: data.user };
};

/**
 * Fetches the latest user from the server. This is also the session check:
 * it answers 401 when the cookie is missing or expired.
 */
export const getMe = async () => {
    let res;
    try {
        res = await apiFetch('/auth/me');
    } catch {
        return null;
    }

    if (res.status === 401) {
        handleUnauthorized();
        return null;
    }

    const data = await res.json().catch(() => ({}));
    if (res.ok && data.user) {
        saveAuth(data.user);
        return data.user;
    }
    return null;
};

/**
 * Updates the profile. Changing the email address additionally requires
 * `currentPassword`, and does not take effect until the NEW address confirms
 * it the response says so via `emailChangePending`.
 */
export const updateUserProfile = async (userData) => {
    const res = await apiFetch('/auth/me', { method: 'PUT', body: userData });

    if (res.status === 401) {
        // A wrong current password also answers 401 here; only a genuinely
        // expired session should bounce to sign-in.
        const data = await res.json().catch(() => ({}));
        if (!/password/i.test(data.message || '')) {
            handleUnauthorized();
            return { success: false, message: 'Your session has expired. Please sign in again.' };
        }
        return { success: false, message: data.message };
    }

    const data = await res.json().catch(() => ({}));
    if (res.ok && data.user) saveAuth(data.user);
    return data;
};

export const changePassword = async (passwords) => {
    const res = await apiFetch('/auth/change-password', { method: 'PUT', body: passwords });
    const data = await res.json().catch(() => ({}));

    if (res.status === 401 && !/current password/i.test(data.message || '')) {
        handleUnauthorized();
        return { success: false, message: 'Your session has expired. Please sign in again.' };
    }

    return data;
};

export const verifyEmail = async (token) => {
    const res = await apiFetch(`/auth/verify-email/${encodeURIComponent(token)}`, { method: 'PUT' });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(data.message || 'That confirmation link is invalid or has expired.');
    }
    return data;
};

/**
 * Applies a pending email change. The token comes from the link sent to the
 * NEW address; opening it is what proves that address is reachable.
 */
export const confirmEmailChange = async (token) => {
    const res = await apiFetch(`/auth/confirm-email-change/${encodeURIComponent(token)}`, {
        method: 'PUT',
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(data.message || 'That link is invalid or has expired.');
    }
    return data;
};

/**
 * Asks the server to send a fresh confirmation link to the signed-in user's
 * own address. Resolves with { success, message, alreadyVerified? }.
 */
export const resendVerification = async () => {
    const res = await apiFetch('/auth/resend-verification', { method: 'POST' });

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

/**
 * Downloads everything the server holds about the signed-in user as JSON.
 */
export const exportMyData = async () => {
    return apiJson('/auth/me/export');
};

/**
 * Permanently deletes the account and every review. Password accounts confirm
 * with { password }; social-only accounts with { confirmation: 'DELETE' }.
 */
export const deleteMyAccount = async (payload) => {
    const res = await apiFetch('/auth/me', { method: 'DELETE', body: payload || {} });
    const data = await res.json().catch(() => ({}));

    if (res.status === 401 && !/password/i.test(data.message || '')) {
        handleUnauthorized();
        return { success: false, message: 'Your session has expired. Please sign in again.' };
    }

    if (res.ok && data.success) {
        try {
            localStorage.removeItem(USER_KEY);
        } catch {
            /* nothing to clear */
        }
    }
    return { success: Boolean(res.ok && data.success), message: data.message || '' };
};
