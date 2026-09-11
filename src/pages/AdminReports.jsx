import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    Flag, ArrowLeft, Loader2, AlertCircle, EyeOff, Eye,
    MessageSquareQuote, ShieldCheck, Clock,
} from 'lucide-react';
import ReviewNavbar from '../components/ReviewNavbar';
import Footer from '../components/Footer';
import { getReports, decideReport, restoreReview } from '../services/reportService';
import { selectUser } from '../store/authSlice';
import useSeo from '../hooks/useSeo';
import { motion } from '../animations';

const REASON_LABEL = {
    'defamatory': 'Untrue or defamatory',
    'personal-info': 'Contains personal information',
    'not-a-tenant': 'Reviewer was never a tenant',
    'harassment': 'Abusive or harassing',
    'spam': 'Spam',
    'other': 'Other',
};

const RELATIONSHIP_LABEL = {
    owner: 'Owns the property',
    agent: 'Manages the property',
    resident: 'Lives / lived here',
    other: 'Other',
};

const OUTCOME_LABEL = {
    'dismissed': 'Dismissed review stands',
    'review-hidden': 'Review hidden',
    'reply-published': 'Response published',
    'both': 'Response published, review hidden',
};

const fmtDate = (value) => {
    try {
        return new Date(value).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric',
        });
    } catch {
        return '';
    }
};

/** Days since a report arrived the 15-day clock made visible. */
const ageInDays = (value) => {
    try {
        return Math.floor((Date.now() - new Date(value).getTime()) / 86400000);
    } catch {
        return 0;
    }
};

const AdminReports = () => {
    useSeo({ title: 'Reported reviews | RentReview', noindex: true });

    const user = useSelector(selectUser);
    const isAdmin = user?.role === 'admin';

    const [tab, setTab] = useState('pending');
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(isAdmin);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [busyId, setBusyId] = useState(null);

    // Per-report editor state: the outcome chosen, the note, and the reply text
    // (pre-filled with whatever was submitted, so trimming it is the easy path).
    const [drafts, setDrafts] = useState({});

    // Bumped to force a refetch after an action that changes the list.
    const [reloadKey, setReloadKey] = useState(0);

    // Matches the pattern in AdminVerifications: the promise chain sits
    // directly in the effect so nothing touches state synchronously when it
    // fires only the async continuations do. `loading` starts true for an
    // admin (see its initial value) and is turned back on by the gestures that
    // trigger a refetch, which is where that belongs.
    useEffect(() => {
        if (!isAdmin) return;
        getReports({ status: tab })
            .then((data) => {
                const list = Array.isArray(data.reports) ? data.reports : [];
                setRows(list);
                setDrafts(
                    Object.fromEntries(
                        list.map((r) => [
                            r._id,
                            { outcome: '', note: '', replyText: r.requestedReply || '' },
                        ])
                    )
                );
                setError('');
            })
            .catch((err) => setError(err.message || 'Could not load reports.'))
            .finally(() => setLoading(false));
    }, [isAdmin, tab, reloadKey]);

    const setDraft = (id, key, value) =>
        setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], [key]: value } }));

    const handleDecide = async (report) => {
        const draft = drafts[report._id] || {};
        if (!draft.outcome) {
            setNotice('Choose what to do before resolving.');
            return;
        }
        setBusyId(report._id);
        setNotice('');
        try {
            await decideReport(report._id, {
                outcome: draft.outcome,
                note: draft.note,
                replyText: draft.replyText,
            });
            setNotice(`Resolved ${OUTCOME_LABEL[draft.outcome]}. The reporter has been emailed.`);
            setRows((prev) => prev.filter((r) => r._id !== report._id));
        } catch (err) {
            setNotice(err.message || 'Could not resolve that report.');
        } finally {
            setBusyId(null);
        }
    };

    const handleRestore = async (reviewId) => {
        setBusyId(reviewId);
        setNotice('');
        try {
            await restoreReview(reviewId);
            setNotice('Review is publicly visible again.');
            setLoading(true);
            setReloadKey((k) => k + 1);
        } catch (err) {
            setNotice(err.message || 'Could not restore that review.');
        } finally {
            setBusyId(null);
        }
    };

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-white flex flex-col">
                <ReviewNavbar />
                <main className="flex-1 flex flex-col items-center justify-center px-4 text-center">
                    <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
                    <h1 className="text-2xl font-bold text-[#0A0A0A]">Admins only</h1>
                    <p className="text-[#6A7282] mt-1">You don&apos;t have access to this page.</p>
                    <Link to="/" className="mt-3 text-sm font-semibold text-[#41B985] hover:underline">
                        Back to RentReview
                    </Link>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F9FAFB] flex flex-col">
            <ReviewNavbar />

            <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                <div className="max-w-4xl mx-auto">
                    <Link to="/admin" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#6A7282] hover:text-[#0A0A0A] mb-6">
                        <ArrowLeft size={16} /> Admin
                    </Link>

                    <header className="mb-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                                <Flag size={20} />
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-[#0A0A0A]">Reported reviews</h1>
                        </div>
                        <p className="text-sm text-[#4A5565] max-w-2xl leading-relaxed">
                            Complaints about published reviews. Every one was acknowledged by email when it
                            arrived and needs an outcome within <strong>15 days</strong>. Hiding a review takes
                            it out of public view and out of the property&apos;s rating, but keeps the record —
                            it can be restored.
                        </p>
                    </header>

                    {/* Tabs */}
                    <div className="flex gap-2 mb-6">
                        {['pending', 'resolved'].map((t) => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => { if (t !== tab) { setLoading(true); setTab(t); } }}
                                className={`px-4 py-2 rounded-xl text-sm font-bold capitalize transition-colors ${
                                    tab === t
                                        ? 'bg-[#41B985] text-white'
                                        : 'bg-white text-[#4A5565] border border-slate-200 hover:bg-slate-50'
                                }`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>

                    {notice && (
                        <p role="status" className="mb-4 rounded-xl bg-[#41B985]/10 border border-[#41B985]/30 px-4 py-3 text-sm font-semibold text-[#008236]">
                            {notice}
                        </p>
                    )}
                    {error && (
                        <p role="alert" className="mb-4 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-700">
                            {error}
                        </p>
                    )}

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="w-8 h-8 text-[#41B985] animate-spin" />
                        </div>
                    ) : rows.length === 0 ? (
                        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center">
                            <ShieldCheck className="w-12 h-12 text-[#41B985] mx-auto mb-3" />
                            <p className="font-bold text-[#0A0A0A]">
                                {tab === 'pending' ? 'Nothing waiting' : 'Nothing resolved yet'}
                            </p>
                            <p className="text-sm text-[#6A7282] mt-1">
                                {tab === 'pending'
                                    ? 'No open complaints about any review.'
                                    : 'Resolved complaints will be listed here.'}
                            </p>
                        </div>
                    ) : (
                        <ul className="space-y-5 list-none p-0">
                            {rows.map((report) => {
                                const draft = drafts[report._id] || {};
                                const age = ageInDays(report.createdAt);
                                const overdue = tab === 'pending' && age > 15;
                                const busy = busyId === report._id;
                                const reviewGone = !report.review;
                                const hidden = report.review?.moderation?.status === 'hidden';

                                return (
                                    <motion.li
                                        key={report._id}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm"
                                    >
                                        {/* Header */}
                                        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                                            <div className="min-w-0">
                                                <p className="font-bold text-[#0A0A0A]">
                                                    {REASON_LABEL[report.reason] || report.reason}
                                                </p>
                                                <p className="text-xs text-[#6A7282] mt-0.5 truncate">
                                                    {report.propertyLabel || 'Property unknown'}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className="font-mono text-[11px] text-[#6A7282] bg-slate-100 px-2 py-1 rounded">
                                                    {String(report._id).slice(-8)}
                                                </span>
                                                <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded ${
                                                    overdue ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-[#4A5565]'
                                                }`}>
                                                    <Clock size={12} />
                                                    {tab === 'pending' ? `${age}d open` : fmtDate(report.reviewedAt)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Complaint */}
                                        <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 mb-4">
                                            <p className="text-sm text-[#364153] whitespace-pre-wrap leading-relaxed">
                                                {report.details}
                                            </p>
                                            <p className="text-xs text-[#6A7282] mt-3">
                                                From <strong className="text-[#0A0A0A]">{report.reporterName}</strong>
                                                {' · '}{RELATIONSHIP_LABEL[report.relationship] || report.relationship}
                                                {' · '}
                                                <a href={`mailto:${report.reporterEmail}`} className="text-[#41B985] hover:underline">
                                                    {report.reporterEmail}
                                                </a>
                                                {report.acknowledgedAt
                                                    ? ' · acknowledged'
                                                    : ' · acknowledgement email FAILED'}
                                            </p>
                                        </div>

                                        {/* The review itself */}
                                        {reviewGone ? (
                                            <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 mb-4">
                                                This review has since been deleted. Only &ldquo;dismiss&rdquo; is available.
                                            </p>
                                        ) : (
                                            <div className="rounded-2xl border border-slate-200 p-4 mb-4">
                                                <div className="flex items-center justify-between gap-2 mb-1.5">
                                                    <p className="text-xs font-semibold uppercase tracking-wider text-[#6A7282]">
                                                        The review
                                                    </p>
                                                    {hidden && (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                                                            <EyeOff size={12} /> Hidden
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm font-bold text-[#0A0A0A]">{report.review.title}</p>
                                                <p className="text-xs text-[#6A7282] mb-2">
                                                    {report.review.rating}★ by {report.review.reviewerName} · {fmtDate(report.review.createdAt)}
                                                </p>
                                                <p className="text-sm text-[#364153] whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">
                                                    {report.review.body}
                                                </p>
                                            </div>
                                        )}

                                        {tab === 'resolved' ? (
                                            <div className="rounded-2xl bg-[#41B985]/5 border border-[#41B985]/20 p-4">
                                                <p className="text-sm font-bold text-[#008236]">
                                                    {OUTCOME_LABEL[report.outcome] || report.outcome}
                                                </p>
                                                {report.resolutionNote && (
                                                    <p className="text-sm text-[#364153] mt-1.5 whitespace-pre-wrap">
                                                        {report.resolutionNote}
                                                    </p>
                                                )}
                                                <p className="text-xs text-[#6A7282] mt-2">
                                                    by {report.reviewedBy?.name || 'an admin'} on {fmtDate(report.reviewedAt)}
                                                </p>
                                                {hidden && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRestore(report.review._id)}
                                                        disabled={busyId === report.review._id}
                                                        className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-[#4A5565] hover:bg-white transition-colors disabled:opacity-50"
                                                    >
                                                        <Eye size={14} /> Restore this review
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {/* Response to publish */}
                                                {(report.requestedReply || draft.replyText) && (
                                                    <div className="space-y-1.5">
                                                        <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#6A7282]">
                                                            <MessageSquareQuote size={14} /> Response they asked us to publish
                                                        </label>
                                                        <textarea
                                                            rows={3}
                                                            maxLength={2000}
                                                            value={draft.replyText || ''}
                                                            onChange={(e) => setDraft(report._id, 'replyText', e.target.value)}
                                                            className="w-full p-3 rounded-xl bg-white border border-slate-200 text-sm focus:outline-none focus:border-[#41B985]"
                                                        />
                                                        <p className="text-[11px] text-[#6A7282]">
                                                            Edit before publishing if needed this exact text appears under the review.
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Outcome */}
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-bold uppercase tracking-wider text-[#6A7282]">
                                                        What are you doing?
                                                    </label>
                                                    <select
                                                        value={draft.outcome || ''}
                                                        onChange={(e) => setDraft(report._id, 'outcome', e.target.value)}
                                                        className="w-full p-3 rounded-xl bg-white border border-slate-200 text-sm font-semibold focus:outline-none focus:border-[#41B985]"
                                                    >
                                                        <option value="">Choose an outcome…</option>
                                                        <option value="dismissed">Dismiss the review stands</option>
                                                        {!reviewGone && <option value="review-hidden">Hide the review</option>}
                                                        {!reviewGone && (report.requestedReply || draft.replyText) && (
                                                            <option value="reply-published">Publish their response</option>
                                                        )}
                                                        {!reviewGone && (report.requestedReply || draft.replyText) && (
                                                            <option value="both">Publish response AND hide the review</option>
                                                        )}
                                                    </select>
                                                </div>

                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-bold uppercase tracking-wider text-[#6A7282]">
                                                        Note to the reporter <span className="font-normal normal-case">(optional, included in the email)</span>
                                                    </label>
                                                    <textarea
                                                        rows={2}
                                                        maxLength={2000}
                                                        value={draft.note || ''}
                                                        onChange={(e) => setDraft(report._id, 'note', e.target.value)}
                                                        placeholder="Briefly, what you found and why."
                                                        className="w-full p-3 rounded-xl bg-white border border-slate-200 text-sm focus:outline-none focus:border-[#41B985]"
                                                    />
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => handleDecide(report)}
                                                    disabled={busy || !draft.outcome}
                                                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#41B985] text-white text-sm font-bold hover:bg-[#35a37b] transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
                                                >
                                                    {busy && <Loader2 size={16} className="animate-spin" />}
                                                    {busy ? 'Resolving…' : 'Resolve and email the reporter'}
                                                </button>
                                            </div>
                                        )}
                                    </motion.li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default AdminReports;
