// ─── API Configuration ────────────────────────────────────────────────────────
// Single source of truth for the backend URL and for how requests are made.
//
// The session no longer lives in localStorage. It is an HttpOnly cookie the
// browser holds and this code cannot read which is the point: an injected
// script can no longer walk off with a seven-day token. Two consequences shape
// everything below:
//
//   1. Every request must send `credentials: 'include'`, or the cookie is not
//      attached and the call is anonymous.
//   2. Because the browser attaches that cookie to cross-site requests too,
//      state-changing calls must prove they came from our own page. The server
//      sets a readable `rr_csrf` cookie; we echo it in the X-CSRF-Token header.
//      An attacking origin can trigger the cookie but cannot read it, so it
//      cannot produce the header.
//
// Only the user object is still persisted locally, purely so the UI can render
// something before /auth/me answers. It is not a credential deleting or
// forging it grants nothing, because the server never looks at it.

// Trailing slashes are stripped so `${API_BASE_URL}/auth/me` never doubles up.
export const API_BASE_URL = (
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
).replace(/\/+$/, '');

export const STORAGE_KEYS = {
    USER: 'rr_user',
};

const CSRF_COOKIE = 'rr_csrf';
const CSRF_CACHE_KEY = 'rr_csrf_token';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

// ─── The CSRF token ──────────────────────────────────────────────────────────
// The server sets rr_csrf as a readable cookie, but reading it here only works
// when the site and the API share a registrable domain. In production they do
// not (rentreview.in ↔ api.rentreview.in is fine; a netlify.app front end
// against an onrender.com API is not), and `document.cookie` simply will not
// contain a cookie belonging to another host which would mean a missing
// header and a 403 on every authenticated write, in production only.
//
// So the token is held here instead, learned from whichever source answers
// first: the readable cookie, the body of the response that started the
// session, or GET /auth/csrf. It is mirrored into sessionStorage so a page
// reload does not need a round trip. That is safe it is not a credential,
// and only an allow-listed origin can obtain it in the first place.
let csrfToken = null;

const readCsrfCookie = () => {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(?:^|;\\s*)' + CSRF_COOKIE + '=([^;]*)'));
    if (!match) return null;
    try {
        return decodeURIComponent(match[1]);
    } catch {
        return null;
    }
};

/** Remember a token handed to us by the server. */
export const setCsrfToken = (value) => {
    if (typeof value !== 'string' || !value) return;
    csrfToken = value;
    try {
        sessionStorage.setItem(CSRF_CACHE_KEY, value);
    } catch {
        // sessionStorage unavailable the in-memory copy still works for this page.
    }
};

export const getCsrfToken = () => {
    if (csrfToken) return csrfToken;
    // sessionStorage first: it holds what the server actually told us in a
    // response body, which is authoritative. The cookie is only readable at all
    // when the site and API share a host (development), and a stale one left on
    // the site's own domain would otherwise be preferred over the real value.
    try {
        csrfToken = sessionStorage.getItem(CSRF_CACHE_KEY) || null;
    } catch {
        csrfToken = null;
    }
    if (!csrfToken) csrfToken = readCsrfCookie();
    return csrfToken;
};

export const clearCsrfToken = () => {
    csrfToken = null;
    try {
        sessionStorage.removeItem(CSRF_CACHE_KEY);
    } catch {
        /* nothing to clear */
    }
};

// A single shared in-flight request. Without this, two concurrent first writes
// each ask for a token before either answer lands; the server mints two, the
// browser keeps the second, and the other request 403s and pays a full retry —
// which for a review submission means uploading every photo twice.
let csrfInFlight = null;

/** Fetch a token from the server when we do not have one. */
const fetchCsrfToken = () => {
    if (csrfInFlight) return csrfInFlight;

    csrfInFlight = (async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/auth/csrf`, { credentials: 'include' });
            if (!res.ok) return null;
            const data = await res.json().catch(() => ({}));
            if (data && data.csrfToken) {
                setCsrfToken(data.csrfToken);
                return data.csrfToken;
            }
        } catch {
            // Offline or the API is down the caller's own request will fail
            // too and report it properly.
        } finally {
            csrfInFlight = null;
        }
        return null;
    })();

    return csrfInFlight;
};

/**
 * Warm the CSRF token so the first write does not pay a round-trip which
 * matters most for review submission, where a 403 mid-upload can surface as a
 * dropped connection rather than a retryable response. Called once on boot when
 * a session looks likely.
 */
export const primeCsrfToken = () => {
    if (getCsrfToken()) return Promise.resolve(getCsrfToken());
    return fetchCsrfToken();
};

/**
 * Is there a cached user? Read directly rather than importing authService,
 * which would be a cycle. Used only to decide whether a CSRF round-trip is
 * worth making public forms (sign-in, contact) need no token.
 */
const hasCachedSession = () => {
    try {
        return Boolean(localStorage.getItem(STORAGE_KEYS.USER));
    } catch {
        return false;
    }
};

/**
 * Shared 401 handler for the service layer.
 * Services live outside the router, so we hard-navigate rather than using
 * react-router's navigate(). Clears the cached user so the store rehydrates as
 * logged-out; the session cookie itself is the server's to expire.
 * Returns true if a redirect was issued (caller may bail out early).
 */
export const handleUnauthorized = () => {
    try {
        localStorage.removeItem(STORAGE_KEYS.USER);
    } catch {
        // storage unavailable (private mode / SSR) nothing to clear
    }
    clearCsrfToken();

    if (typeof window === 'undefined') return false;

    // Don't bounce a user who is already on an auth page that loops forever.
    const path = window.location.pathname;
    if (path === '/signin' || path === '/signup') return false;

    window.location.assign('/signin');
    return true;
};

/**
 * The one way this app talks to the API. Every call goes through here so that
 * credentials and the CSRF header are never a per-call decision someone can
 * forget.
 *
 * @param {string} path      e.g. '/auth/me' (API_BASE_URL is prefixed)
 * @param {object} [options]
 * @param {string} [options.method='GET']
 * @param {any}    [options.body]  a plain object is JSON-encoded; a FormData is
 *                                 passed through untouched so the browser sets
 *                                 the multipart boundary itself.
 * @returns {Promise<Response>} the raw Response callers vary in how they read
 *          status codes, so parsing stays with them (or use `apiJson`).
 */
export const apiFetch = async (path, { method = 'GET', body, headers = {} } = {}) => {
    const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
    const unsafe = !SAFE_METHODS.has(method.toUpperCase());

    const send = async (token) => {
        const finalHeaders = { ...headers };
        if (body !== undefined && !isForm && !finalHeaders['Content-Type']) {
            finalHeaders['Content-Type'] = 'application/json';
        }
        if (unsafe && token) finalHeaders['X-CSRF-Token'] = token;

        return fetch(`${API_BASE_URL}${path}`, {
            method,
            headers: finalHeaders,
            // Without this the session cookie is not sent and every call is anonymous.
            credentials: 'include',
            body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
        });
    };

    let token = unsafe ? getCsrfToken() : null;
    // First write of a session that began before this tab loaded: ask for one.
    // Skipped when nothing suggests a session sign-in, sign-up, the contact
    // form and forgot-password are public, and making each of them wait on an
    // extra round-trip would roughly double perceived sign-in latency on a
    // cold-starting instance.
    if (unsafe && !token && hasCachedSession()) token = await fetchCsrfToken();

    const res = await send(token);

    // A 403 on a write usually means the token rotated (a sign-in elsewhere) or
    // was never right. Refresh once and retry silently, because the user did
    // nothing wrong. Retried at most once, so a genuinely rejected request
    // still surfaces as 403 rather than looping.
    if (res.status === 403 && unsafe) {
        const fresh = await fetchCsrfToken();
        // `fresh !== token` matters: a 403 from an authorisation check (not a
        // CSRF one) returns the same token, so it is not retried and the real
        // error surfaces.
        if (fresh && fresh !== token) return send(fresh);
    }

    return res;
};

/**
 * apiFetch plus the response handling every caller was repeating: a connection
 * failure becomes a readable message, a 401 clears the session, and a non-2xx
 * throws with the server's own message.
 */
export const apiJson = async (path, options = {}) => {
    let res;
    try {
        res = await apiFetch(path, options);
    } catch {
        throw new Error('Unable to connect to the server. Please try again.');
    }

    if (res.status === 401) {
        handleUnauthorized();
        throw new Error('Your session has expired. Please sign in again.');
    }

    // A cold start can answer with an HTML 502 res.json() would throw and
    // surface as "couldn't connect" instead of the real outcome.
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Something went wrong.');
    return data;
};
