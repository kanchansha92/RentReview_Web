import { API_BASE_URL, STORAGE_KEYS, handleUnauthorized } from '../config/api';

// Pull the JWT saved by authService
const getToken = () => localStorage.getItem(STORAGE_KEYS.TOKEN);

// JSON request helper (for reads + update/delete)
const jsonRequest = async (endpoint, { method = 'GET', body, auth = false } = {}) => {
    const headers = { 'Content-Type': 'application/json' };
    if (auth) {
        const token = getToken();
        if (token) headers.Authorization = `Bearer ${token}`;
    }

    let res;
    try {
        res = await fetch(`${API_BASE_URL}${endpoint}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });
    } catch {
        throw new Error('Unable to connect to the server. Please try again.');
    }

    // Expired / revoked token -drop the stale credentials and send them to sign-in
    // instead of letting every subsequent request fail silently forever.
    if (res.status === 401) {
        handleUnauthorized();
        throw new Error('Your session has expired. Please sign in again.');
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Something went wrong.');
    return data;
};

// ─── Create a review (multipart, because of the file uploads) ─────────────
// `form` is the state object from AddReview.jsx
export const createReview = async (form) => {
    const fd = new FormData();

    // Text fields (names match what the backend controller reads from req.body)
    fd.append('streetAddress', form.streetAddress);
    fd.append('city', form.city);
    fd.append('state', form.state);
    fd.append('zipCode', form.zipCode);
    fd.append('lat', form.lat || '');   // from the address picker → exact map coords
    fd.append('lng', form.lng || '');
    fd.append('rating', String(form.rating));
    fd.append('name', form.name);
    fd.append('reviewTitle', form.reviewTitle);
    fd.append('review', form.review);
    fd.append('pros', form.pros); // newline-separated; backend splits into array
    fd.append('cons', form.cons);
    fd.append('idType', form.idType);
    fd.append('idNumber', form.idNumber);
    fd.append('type', form.type || 'Other');
    fd.append('price', form.price || '');

    // Files
    if (form.idFile) fd.append('idProof', form.idFile);
    (form.photos || []).forEach((file) => fd.append('photos', file));

    const token = getToken();

    let res;
    try {
        res = await fetch(`${API_BASE_URL}/reviews`, {
            method: 'POST',
            // NOTE: do NOT set Content-Type -the browser sets the multipart boundary
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: fd,
        });
    } catch {
        throw new Error('Unable to connect to the server. Please try again.');
    }

    if (res.status === 401) {
        handleUnauthorized();
        throw new Error('Your session has expired. Please sign in again.');
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Something went wrong.');
    return data;
};

// ─── Reads ─────────────────────────────────────────────────────────────────
export const getReviews = (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return jsonRequest(`/reviews${qs ? `?${qs}` : ''}`);
};

export const getReview = (id) => jsonRequest(`/reviews/${id}`);

export const getPropertyReviews = (propertyId) =>
    jsonRequest(`/reviews/property/${propertyId}`);

export const getMyReviews = () => jsonRequest('/reviews/me', { auth: true });

// ─── Update / delete own review ─────────────────────────────────────────────
export const updateReview = (id, changes) =>
    jsonRequest(`/reviews/${id}`, { method: 'PUT', body: changes, auth: true });

export const deleteReview = (id) =>
    jsonRequest(`/reviews/${id}`, { method: 'DELETE', auth: true });

// ─── Properties (for WriteReview list + MapView) ────────────────────────────
export const getProperties = (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return jsonRequest(`/properties${qs ? `?${qs}` : ''}`);
};

export const getProperty = (id) => jsonRequest(`/properties/${id}`);


export const getPendingVerifications = (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return jsonRequest(`/reviews/admin/pending-verifications${qs ? `?${qs}` : ''}`, { auth: true });
};

/**
 * Approve or reject a pending ID proof.
 * Both decisions destroy the stored document server-side -it exists to answer
 * one question, and once answered there is no reason to keep holding it.
 * @param {string} id review id
 * @param {'approve'|'reject'} decision
 */
export const decideVerification = (id, decision) =>
    jsonRequest(`/reviews/admin/${id}/verification`, {
        method: 'PUT',
        body: { decision },
        auth: true,
    });
