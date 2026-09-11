import { apiFetch, apiJson } from '../config/api';


export const submitReport = async (payload) => {
    let res;
    try {
        res = await apiFetch('/reports', { method: 'POST', body: payload });
    } catch {
        throw new Error('Unable to connect to the server. Please try again.');
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        return {
            success: false,
            message: data.message || 'We could not send your report. Please try again.',
            errors: data.errors || {},
        };
    }
    return { success: true, reference: data.reference, message: data.message || '' };
};

// ─── Admin ───────────────────────────────────────────────────────────────────

/** The moderation queue. `status` is 'pending' (default) or 'resolved'. */
export const getReports = (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiJson(`/reports/admin${qs ? `?${qs}` : ''}`);
};

/**
 * Close a report.
 * @param {string} id
 * @param {{outcome:'dismissed'|'review-hidden'|'reply-published'|'both', note?:string, replyText?:string}} decision
 */
export const decideReport = (id, decision) =>
    apiJson(`/reports/admin/${id}`, { method: 'PUT', body: decision });

/** Put a hidden review back into public view. */
export const restoreReview = (reviewId) =>
    apiJson(`/reports/admin/reviews/${reviewId}/restore`, { method: 'PUT' });
