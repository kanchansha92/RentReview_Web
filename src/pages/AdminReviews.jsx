import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    FileText, ArrowLeft, Loader2, AlertCircle, EyeOff, Search, X,
    Trash2, Image as ImageIcon, MessageSquareQuote, ChevronLeft, ChevronRight, ShieldCheck,
} from 'lucide-react';
import ReviewNavbar from '../components/ReviewNavbar';
import Footer from '../components/Footer';
import ConfirmDialog from '../components/ConfirmDialog';
import { getAllReviewsAdmin, deleteReview } from '../services/reviewService';
import { selectUser } from '../store/authSlice';
import useSeo from '../hooks/useSeo';
import { motion } from '../animations';

const STATUS_TABS = [
    { key: 'all', label: 'All' },
    { key: 'visible', label: 'Published' },
    { key: 'hidden', label: 'Hidden' },
];

const PER_PAGE = 20;

const fmtDate = (value) => {
    try {
        return new Date(value).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric',
        });
    } catch {
        return '';
    }
};

const propertyLabel = (property) => {
    if (!property) return 'Property unknown';
    return [property.title || property.streetAddress, property.city, property.state]
        .filter(Boolean)
        .join(', ');
};

/**
 * Every review in one list, with a delete on each row.
 *
 * Deliberately read-and-delete only. An admin cannot edit someone else's review
 * here, for the same reason the API refuses it (see updateReview): altering a
 * review that still carries its author's name misrepresents them. Hiding stays
 * with the complaint that prompted it, on /admin/reports, so a takedown always
 * has a reason attached to it.
 */
const AdminReviews = () => {
    useSeo({ title: 'All reviews | RentReview', noindex: true });

    const user = useSelector(selectUser);
    const isAdmin = user?.role === 'admin';

    const [status, setStatus] = useState('all');
    const [search, setSearch] = useState('');   // what is in the box
    const [query, setQuery] = useState('');     // what was actually submitted
    const [page, setPage] = useState(1);

    const [rows, setRows] = useState([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const [loading, setLoading] = useState(isAdmin);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');

    // The review awaiting confirmation, the in-flight delete, and any error from
    // it shown inside the dialog so a failed delete can't be mistaken for a
    // silent one.
    const [confirming, setConfirming] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [confirmError, setConfirmError] = useState('');

    // Bumped to force a refetch: after a delete the page's contents shift up, so
    // the list is re-read rather than patched in place.
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        if (!isAdmin) return;
        let cancelled = false;

        getAllReviewsAdmin({ page, limit: PER_PAGE, status, ...(query ? { q: query } : {}) })
            .then((data) => {
                if (cancelled) return;
                setRows(Array.isArray(data.reviews) ? data.reviews : []);
                setTotal(data.total || 0);
                setTotalPages(data.totalPages || 0);
                setError('');
            })
            .catch((err) => {
                if (!cancelled) setError(err.message || 'Could not load reviews.');
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => { cancelled = true; };
    }, [isAdmin, status, query, page, reloadKey]);

    const runSearch = (e) => {
        e.preventDefault();
        setLoading(true);
        setPage(1);
        setQuery(search.trim());
    };

    // Empties the box and, if a search was actually running, drops back to the
    // unfiltered list rather than leaving stale results under an empty field.
    const clearSearch = () => {
        setSearch('');
        if (query) {
            setLoading(true);
            setPage(1);
            setQuery('');
        }
    };

    const changeStatus = (next) => {
        if (next === status) return;
        setLoading(true);
        setPage(1);
        setStatus(next);
    };

    const goToPage = (next) => {
        if (next < 1 || (totalPages && next > totalPages)) return;
        setLoading(true);
        setPage(next);
    };

    const handleDelete = async () => {
        if (!confirming) return;
        const review = confirming;
        setDeletingId(review._id);
        try {
            await deleteReview(review._id);
            setConfirming(null);
            setConfirmError('');
            setNotice(`Deleted “${review.title}”. Its photos and ID proof were destroyed with it.`);
            // The row is gone and everything after it moves up a place, so the
            // page is re-read instead of being edited locally.
            setLoading(true);
            setReloadKey((k) => k + 1);
        } catch (err) {
            setConfirmError(err.message || 'Could not delete that review.');
        } finally {
            setDeletingId(null);
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
                            <div className="w-11 h-11 rounded-2xl bg-[#41B985]/10 text-[#41B985] flex items-center justify-center">
                                <FileText size={20} />
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-[#0A0A0A]">All reviews</h1>
                        </div>
                        <p className="text-sm text-[#4A5565] max-w-2xl leading-relaxed">
                            Every review on the site, hidden ones included, newest first. Deleting one
                            here is <strong>permanent</strong>: the review, its photos and the writer&apos;s
                            ID proof are destroyed, and the property&apos;s rating is recalculated without
                            it. To take a review down reversibly, hide it from{' '}
                            <Link to="/admin/reports" className="font-semibold text-[#41B985] hover:underline">
                                Reported reviews
                            </Link>{' '}
                            instead that keeps the record and can be undone.
                        </p>
                    </header>

                    {/* Search + filter, in one bar: the field and the tabs act on the
                        same list, so they read as one control rather than three. */}
                    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm flex flex-col sm:flex-row sm:items-center gap-2">
                        <form onSubmit={runSearch} className="relative flex-1 min-w-0">
                            <Search
                                size={18}
                                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9AA3B2]"
                                aria-hidden="true"
                            />
                            {/* type=text, not search: the field carries its own clear
                                button, and Chrome's native one would sit beside it. */}
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search title, text, reviewer or address"
                                aria-label="Search reviews"
                                className="w-full rounded-xl border border-transparent bg-[#F3F5F7] py-3 pl-11 pr-[6.5rem] text-sm text-[#0A0A0A] placeholder:text-[#9AA3B2] transition-colors focus:outline-none focus:bg-white focus:border-[#41B985] focus:ring-4 focus:ring-[#41B985]/15"
                            />
                            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                {search && (
                                    <button
                                        type="button"
                                        onClick={clearSearch}
                                        aria-label="Clear search"
                                        title="Clear search"
                                        className="p-1.5 rounded-lg text-[#9AA3B2] hover:text-[#0A0A0A] hover:bg-slate-200/70 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#41B985]"
                                    >
                                        <X size={15} />
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    className="rounded-lg bg-[#41B985] px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#37A576] active:scale-[0.97] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#41B985] focus-visible:ring-offset-2"
                                >
                                    Search
                                </button>
                            </div>
                        </form>

                        {/* Segmented, so the three states read as one choice. */}
                        <div role="tablist" aria-label="Filter reviews by status" className="flex gap-1 rounded-xl bg-[#F3F5F7] p-1 shrink-0">
                            {STATUS_TABS.map((t) => (
                                <button
                                    key={t.key}
                                    type="button"
                                    role="tab"
                                    aria-selected={status === t.key}
                                    onClick={() => changeStatus(t.key)}
                                    className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#41B985] focus-visible:ring-offset-1 ${
                                        status === t.key
                                            ? 'bg-[#41B985] text-white shadow-sm'
                                            : 'text-[#6A7282] hover:text-[#0A0A0A] hover:bg-white/70'
                                    }`}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
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
                                {query ? 'Nothing matched that search' : 'No reviews here'}
                            </p>
                            <p className="text-sm text-[#6A7282] mt-1">
                                {query
                                    ? 'Try an address, a reviewer’s name, or a phrase from the review.'
                                    : status === 'hidden'
                                        ? 'No review has been hidden.'
                                        : 'Nothing has been published yet.'}
                            </p>
                        </div>
                    ) : (
                        <>
                            <p className="text-xs font-semibold uppercase tracking-wider text-[#6A7282] mb-3">
                                {total.toLocaleString()} {total === 1 ? 'review' : 'reviews'}
                                {query ? ' matching' : ''}
                                {totalPages > 1 ? ` · page ${page} of ${totalPages}` : ''}
                            </p>

                            <ul className="space-y-4 list-none p-0">
                                {rows.map((review) => {
                                    const hidden = review.moderation?.status === 'hidden';
                                    const photos = review.photos?.length || 0;
                                    const replied = Boolean(review.ownerResponse?.publishedAt);

                                    return (
                                        <motion.li
                                            key={review._id}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                                        <p className="font-bold text-[#0A0A0A] truncate">{review.title}</p>
                                                        {hidden && (
                                                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                                                                <EyeOff size={12} /> Hidden
                                                            </span>
                                                        )}
                                                        {replied && (
                                                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#4A5565] bg-slate-100 px-2 py-0.5 rounded">
                                                                <MessageSquareQuote size={12} /> Response published
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-[#6A7282]">
                                                        {review.rating}★ by {review.reviewerName} · {fmtDate(review.createdAt)}
                                                        {photos > 0 && (
                                                            <span className="inline-flex items-center gap-1 ml-2">
                                                                <ImageIcon size={12} /> {photos}
                                                            </span>
                                                        )}
                                                    </p>
                                                    <p className="text-xs text-[#6A7282] mt-0.5 truncate">
                                                        {review.property?._id ? (
                                                            <Link
                                                                to={`/property/${review.property._id}`}
                                                                className="hover:text-[#41B985] hover:underline"
                                                            >
                                                                {propertyLabel(review.property)}
                                                            </Link>
                                                        ) : (
                                                            propertyLabel(review.property)
                                                        )}
                                                    </p>
                                                </div>

                                                {/* Icon-only, so it needs a real label for anyone not
                                                    looking at it. */}
                                                <button
                                                    type="button"
                                                    onClick={() => { setConfirmError(''); setConfirming(review); }}
                                                    disabled={deletingId === review._id}
                                                    title="Delete permanently"
                                                    aria-label={`Delete the review “${review.title}” permanently`}
                                                    className="shrink-0 p-2.5 rounded-xl border border-slate-200 text-[#6A7282] hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
                                                >
                                                    {deletingId === review._id
                                                        ? <Loader2 size={16} className="animate-spin" />
                                                        : <Trash2 size={16} />}
                                                </button>
                                            </div>

                                            <p className="text-sm text-[#364153] whitespace-pre-wrap leading-relaxed mt-3 max-h-28 overflow-y-auto">
                                                {review.body}
                                            </p>
                                        </motion.li>
                                    );
                                })}
                            </ul>

                            {totalPages > 1 && (
                                <div className="flex items-center justify-between gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => goToPage(page - 1)}
                                        disabled={page <= 1}
                                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-bold text-[#4A5565] hover:bg-slate-50 transition-colors disabled:opacity-40"
                                    >
                                        <ChevronLeft size={16} /> Previous
                                    </button>
                                    <span className="text-sm text-[#6A7282]">
                                        Page {page} of {totalPages}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => goToPage(page + 1)}
                                        disabled={page >= totalPages}
                                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-bold text-[#4A5565] hover:bg-slate-50 transition-colors disabled:opacity-40"
                                    >
                                        Next <ChevronRight size={16} />
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>

            {/* Names the review being deleted: the list can show twenty, and one
                trash icon looks exactly like the next. */}
            {confirming && (
                <ConfirmDialog
                    title="Delete this review permanently?"
                    message={
                        `“${confirming.title}” by ${confirming.reviewerName} will be erased, along with `
                        + 'its photos and the ID proof behind it. It cannot be restored, and '
                        + 'the property’s rating will be recalculated without it.'
                    }
                    confirmLabel="Delete permanently"
                    busyLabel="Deleting…"
                    cancelLabel="Keep the review"
                    tone="danger"
                    busy={deletingId === confirming._id}
                    error={confirmError}
                    onConfirm={handleDelete}
                    onClose={() => { setConfirming(null); setConfirmError(''); }}
                />
            )}

            <Footer />
        </div>
    );
};

export default AdminReviews;
