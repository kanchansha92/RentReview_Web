import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ShieldCheck, Loader2, AlertCircle, ExternalLink, Check, X, Inbox } from 'lucide-react';
import ReviewNavbar from '../components/ReviewNavbar';
import { getPendingVerifications, decideVerification } from '../services/reviewService';
import { selectUser } from '../store/authSlice';
import useSeo from '../hooks/useSeo';



const REASON_LABELS = {
    pending: 'Automated check still running (or the server restarted before it finished)',
    'no-match': "OCR read the image but found neither the number nor a document keyword",
    'pdf-skip': 'Uploaded as a PDF -OCR was skipped',
    'unsupported-format': "File format couldn't be read",
    'ocr-error': 'OCR failed to run',
    'fetch-error': "Server couldn't download the file to check it",
    match: 'Partial match -one of number/keyword found, not both',
};

const AdminVerifications = () => {
    // Admin-only queue holding government ID verification data -must never be
    // indexed, and robots.txt disallows /admin/ entirely as a second layer.
    useSeo({ title: 'ID Verification Queue | RentReview Admin', noindex: true });

    const user = useSelector(selectUser);
    const isAdmin = user?.role === 'admin';

    const [rows, setRows] = useState([]);
    // A non-admin never fetches, so it must not start in a loading state —
    // deriving it here keeps the effect below free of synchronous setState,
    // which would cost an extra render pass on every mount.
    const [loading, setLoading] = useState(isAdmin);
    const [error, setError] = useState('');
    const [busyId, setBusyId] = useState(null);
    const [notice, setNotice] = useState('');

    // Only the async continuations touch state, so the effect body itself sets
    // nothing synchronously.
    useEffect(() => {
        if (!isAdmin) return;
        getPendingVerifications({ limit: 50 })
            .then((data) => setRows(Array.isArray(data.reviews) ? data.reviews : []))
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, [isAdmin]);

    const decide = async (id, decision) => {
        const verb = decision === 'approve' ? 'Approve' : 'Reject';
        if (!window.confirm(`${verb} this submission?\n\nThe ID document will be permanently deleted and the stored number masked. This cannot be undone.`)) {
            return;
        }
        setBusyId(id);
        setNotice('');
        try {
            const result = await decideVerification(id, decision);
            setRows((current) => current.filter((r) => r._id !== id));
            setNotice(result.message || `${verb}d.`);
        } catch (err) {
            setError(err.message);
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="flex min-h-screen flex-col bg-[#F9FAFB] font-sans">
            <ReviewNavbar />

            <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
                <header className="mb-6 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-[#41B985]" aria-hidden="true" />
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0A0A0A]">
                            ID Verification Queue
                        </h1>
                    </div>
                    <p className="max-w-2xl text-sm text-[#4A5565]">
                        Submissions the automated check couldn't confirm. Approving or rejecting permanently
                        deletes the ID document and masks the stored number -there's no undo.
                    </p>
                </header>

                {!isAdmin && (
                    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-black/10 bg-white p-10 text-center">
                        <AlertCircle className="h-8 w-8 text-slate-400" aria-hidden="true" />
                        <p className="text-base font-bold text-slate-700">Admins only</p>
                        <p className="max-w-md text-sm text-slate-500">
                            This account doesn't have the admin role. Grant it from the server with{' '}
                            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">
                                node src/scripts/promoteAdmin.js {user?.email || 'you@example.com'}
                            </code>
                            .
                        </p>
                        <Link to="/" className="mt-1 text-sm font-semibold text-[#41B985] hover:underline">
                            Back to home
                        </Link>
                    </div>
                )}

                {isAdmin && (
                    <>
                        {notice && (
                            <p role="status" className="mb-4 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-[#2d9062]">
                                {notice}
                            </p>
                        )}
                        {error && (
                            <p role="alert" className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                                {error}
                            </p>
                        )}

                        {loading && (
                            <div className="flex items-center justify-center gap-2 py-20 text-sm text-slate-500">
                                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> Loading queue…
                            </div>
                        )}

                        {!loading && rows.length === 0 && !error && (
                            <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-black/10 bg-white p-10 text-center">
                                <Inbox className="h-8 w-8 text-slate-300" aria-hidden="true" />
                                <p className="text-base font-bold text-slate-700">Queue is empty</p>
                                <p className="text-sm text-slate-500">Every submission has been reviewed.</p>
                            </div>
                        )}

                        {!loading && rows.length > 0 && (
                            <ul className="flex flex-col gap-3 list-none">
                                {rows.map((r) => {
                                    const v = r.verification || {};
                                    const busy = busyId === r._id;
                                    return (
                                        <li
                                            key={r._id}
                                            className="rounded-2xl border border-black/10 bg-white p-4 sm:p-5 shadow-sm"
                                        >
                                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                                <div className="flex min-w-0 flex-col gap-1.5">
                                                    <p className="text-sm font-bold text-[#0A0A0A]">
                                                        {r.reviewerName}
                                                        {r.user?.email && (
                                                            <span className="ml-2 font-normal text-slate-500">{r.user.email}</span>
                                                        )}
                                                    </p>
                                                    <p className="text-sm text-[#4A5565]">
                                                        {[r.property?.streetAddress, r.property?.city, r.property?.state]
                                                            .filter(Boolean)
                                                            .join(', ') || r.property?.title || 'Unknown property'}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        <span className="font-semibold text-slate-700">{v.idType || 'No ID type'}</span>
                                                        {v.idNumber && <span className="ml-2 font-mono">{v.idNumber}</span>}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        {REASON_LABELS[v.verifiedReason] || v.verifiedReason || 'Not checked'}
                                                        {r.createdAt && (
                                                            <span className="ml-2">
                                                                · submitted {new Date(r.createdAt).toLocaleDateString()}
                                                            </span>
                                                        )}
                                                    </p>
                                                </div>

                                                <div className="flex shrink-0 flex-wrap items-center gap-2">
                                                    {v.idProof ? (
                                                        <a
                                                            href={v.idProof}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                                                        >
                                                            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                                                            View ID document
                                                        </a>
                                                    ) : (
                                                        <span className="text-xs text-slate-400">No document</span>
                                                    )}
                                                    <button
                                                        type="button"
                                                        disabled={busy}
                                                        onClick={() => decide(r._id, 'approve')}
                                                        className="flex h-9 items-center gap-1.5 rounded-lg bg-[#41B985] px-3 text-xs font-bold text-white transition-colors hover:bg-[#36a374] disabled:opacity-60 disabled:cursor-not-allowed"
                                                    >
                                                        <Check className="h-3.5 w-3.5" aria-hidden="true" /> Approve
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={busy}
                                                        onClick={() => decide(r._id, 'reject')}
                                                        className="flex h-9 items-center gap-1.5 rounded-lg border-2 border-red-200 px-3 text-xs font-bold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed"
                                                    >
                                                        <X className="h-3.5 w-3.5" aria-hidden="true" /> Reject
                                                    </button>
                                                </div>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};

export default AdminVerifications;
