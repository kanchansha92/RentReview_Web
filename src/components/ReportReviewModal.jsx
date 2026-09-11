import React, { useEffect, useRef, useState } from 'react';
import { Flag, X, Loader2, CheckCircle2 } from 'lucide-react';
import { submitReport } from '../services/reportService';
import { motion, AnimatePresence } from '../animations';



const REASONS = [
    { value: 'defamatory', label: 'It is untrue or defamatory', hint: 'Claims that are false and damaging.' },
    { value: 'personal-info', label: 'It contains personal information', hint: 'Names, phone numbers, or anything identifying an individual.' },
    { value: 'not-a-tenant', label: 'The reviewer never lived here', hint: 'The review is not from a real tenant of this property.' },
    { value: 'harassment', label: 'It is abusive or harassing', hint: '' },
    { value: 'spam', label: 'It is spam or an advertisement', hint: '' },
    { value: 'other', label: 'Something else', hint: '' },
];

const RELATIONSHIPS = [
    { value: 'owner', label: 'I own this property' },
    { value: 'agent', label: 'I manage or let this property' },
    { value: 'resident', label: 'I live or lived here' },
    { value: 'other', label: 'Something else' },
];

const MAX_DETAILS = 3000;
const MAX_REPLY = 2000;

const ReportReviewModal = ({ review, onClose }) => {
    const [form, setForm] = useState({
        reason: '',
        details: '',
        reporterName: '',
        reporterEmail: '',
        relationship: 'owner',
        requestedReply: '',
        website: '', // honeypot must stay empty
    });
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(null); // { reference, message }
    const [topError, setTopError] = useState('');

    const dialogRef = useRef(null);
    const firstFieldRef = useRef(null);

    // Focus the first control, close on Escape, and restore focus on the way
    // out this opens over a page the reader was already using.
    useEffect(() => {
        const previouslyFocused = document.activeElement;
        firstFieldRef.current?.focus();

        // Lock the page behind the dialog. Without this the window keeps its own
        // scrollbar next to the dialog's two bars side by side, and a scroll
        // gesture over the backdrop moves the page instead of the form.
        //
        // The width is compensated because hiding a scrollbar reclaims its
        // gutter, and the whole layout jumps sideways the moment the dialog
        // opens. Restoring the exact previous value (rather than clearing to
        // '') keeps this safe if anything else was already setting it.
        const { overflow, paddingRight } = document.body.style;
        const barWidth = window.innerWidth - document.documentElement.clientWidth;
        document.body.style.overflow = 'hidden';
        if (barWidth > 0) {
            const current = parseFloat(getComputedStyle(document.body).paddingRight) || 0;
            document.body.style.paddingRight = `${current + barWidth}px`;
        }

        const onKeyDown = (e) => {
            if (e.key === 'Escape' && !submitting) onClose();
        };
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.body.style.overflow = overflow;
            document.body.style.paddingRight = paddingRight;
            if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
        };
    }, [onClose, submitting]);

    const set = (key) => (e) => {
        setForm((prev) => ({ ...prev, [key]: e.target.value }));
        setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setTopError('');

        const next = {};
        if (!form.reason) next.reason = 'Please choose a reason.';
        if (!form.details.trim()) next.details = 'Please tell us what the problem is.';
        if (!form.reporterName.trim()) next.reporterName = 'Please enter your name.';
        if (!form.reporterEmail.trim()) next.reporterEmail = 'Please enter your email address.';
        if (Object.keys(next).length) {
            setErrors(next);
            return;
        }

        setSubmitting(true);
        try {
            const result = await submitReport({ ...form, reviewId: review._id });
            if (result.success) {
                setDone({ reference: result.reference, message: result.message });
            } else {
                setErrors(result.errors || {});
                setTopError(result.message || 'Please check the form and try again.');
            }
        } catch (err) {
            setTopError(err.message || 'We could not send your report. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            <motion.div
             
                className="fixed inset-0 z-[1200] overflow-y-auto bg-slate-900/60 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => !submitting && onClose()}
            >
              <div className="flex min-h-full items-center justify-center p-4">
                <motion.div
                    ref={dialogRef}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="report-title"
                    onClick={(e) => e.stopPropagation()}
                    initial={{ opacity: 0, y: 24, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 12, scale: 0.98 }}
                    transition={{ duration: 0.22 }}
                  
                    className="flex w-full max-w-xl max-h-[calc(100dvh-2rem)] flex-col overflow-hidden bg-white rounded-3xl shadow-2xl"
                >
                    {done ? (
                        // ── Confirmation ─────────────────────────────────────
                        // Also scrollable: the confirmation is short, but a
                        // long error message or a small window should not push
                        // the Close button out of reach.
                        <div className="overflow-y-auto p-8 text-center sm:p-10">
                            <CheckCircle2 className="w-14 h-14 text-[#41B985] mx-auto mb-5" />
                            <h2 className="text-2xl font-bold text-[#0A0A0A] mb-2">Report received</h2>
                            <p className="text-[#4A5565] mb-6 leading-relaxed">{done.message}</p>
                            {done.reference && (
                                <p className="text-sm text-[#6A7282] mb-8">
                                    Your reference is{' '}
                                    <strong className="font-mono text-[#0A0A0A]">{done.reference}</strong>
                                </p>
                            )}
                            <button
                                type="button"
                                onClick={onClose}
                                className="w-full py-3.5 bg-[#41B985] text-white font-bold rounded-2xl hover:bg-[#35a37b] transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    ) : (
                        // Three bands: a heading that stays, a scrolling middle,
                        // and buttons that stay. Previously the whole form
                        // scrolled as one, so on a laptop you lost both the
                        // title and the Send button the moment you started
                        // filling it in.
                        <form onSubmit={handleSubmit} className="flex min-h-0 flex-col">
                          <div className="shrink-0 border-b border-slate-100 px-6 pt-6 pb-5 sm:px-8 sm:pt-8">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                                        <Flag size={20} />
                                    </div>
                                    <div>
                                        <h2 id="report-title" className="text-xl font-bold text-[#0A0A0A]">
                                            Report this review
                                        </h2>
                                        <p className="text-sm text-[#6A7282] mt-0.5">
                                            You don&apos;t need an account. We aim to respond within 15 days.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    aria-label="Close"
                                    className="text-slate-400 hover:text-slate-700 transition-colors shrink-0"
                                >
                                    <X size={22} />
                                </button>
                            </div>
                          </div>

                          {/* `min-h-0` is what makes this scroll: without it a
                              flex child refuses to shrink below its content and
                              the overflow escapes the dialog instead. */}
                          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 space-y-6 sm:px-8">
                            {/* What is being reported, so there is no doubt */}
                            <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                                <p className="text-xs font-semibold uppercase tracking-wider text-[#6A7282] mb-1">
                                    Reporting
                                </p>
                                <p className="text-sm font-semibold text-[#0A0A0A] truncate">
                                    {review.title || 'Untitled review'}
                                </p>
                                <p className="text-xs text-[#6A7282] mt-0.5">
                                    by {review.reviewerName || 'Anonymous'}
                                </p>
                            </div>

                            {topError && (
                                <p role="alert" className="text-sm font-semibold text-rose-600">{topError}</p>
                            )}

                            {/* Reason */}
                            <fieldset className="space-y-2">
                                <legend className="text-sm font-bold text-[#0A0A0A] mb-2">
                                    What&apos;s wrong with it?
                                </legend>
                                <div className="space-y-1.5">
                                    {REASONS.map((r, i) => (
                                        <label
                                            key={r.value}
                                            className={`flex gap-3 items-start p-3 rounded-xl border cursor-pointer transition-colors ${
                                                form.reason === r.value
                                                    ? 'border-[#41B985] bg-[#41B985]/5'
                                                    : 'border-slate-200 hover:bg-slate-50'
                                            }`}
                                        >
                                            <input
                                                ref={i === 0 ? firstFieldRef : undefined}
                                                type="radio"
                                                name="reason"
                                                value={r.value}
                                                checked={form.reason === r.value}
                                                onChange={set('reason')}
                                                className="mt-0.5 accent-[#41B985]"
                                            />
                                            <span className="min-w-0">
                                                <span className="block text-sm font-semibold text-[#0A0A0A]">{r.label}</span>
                                                {r.hint && <span className="block text-xs text-[#6A7282] mt-0.5">{r.hint}</span>}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                                {errors.reason && <p className="text-xs font-semibold text-rose-600">{errors.reason}</p>}
                            </fieldset>

                            {/* Details */}
                            <div className="space-y-1.5">
                                <label htmlFor="report-details" className="block text-sm font-bold text-[#0A0A0A]">
                                    Tell us more
                                </label>
                                <textarea
                                    id="report-details"
                                    rows={4}
                                    maxLength={MAX_DETAILS}
                                    value={form.details}
                                    onChange={set('details')}
                                    placeholder="What specifically is inaccurate, and how do you know?"
                                    className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-[#41B985] focus:ring-2 focus:ring-[#41B985]/20"
                                />
                                {errors.details && <p className="text-xs font-semibold text-rose-600">{errors.details}</p>}
                            </div>

                            {/* Right of reply */}
                            <div className="space-y-1.5">
                                <label htmlFor="report-reply" className="block text-sm font-bold text-[#0A0A0A]">
                                    Your response <span className="font-normal text-[#6A7282]">(optional)</span>
                                </label>
                                <p className="text-xs text-[#6A7282] leading-relaxed">
                                    If you&apos;d like your side published underneath the review, write it here.
                                    We read it before it goes up, and we&apos;ll tell you either way.
                                </p>
                                <textarea
                                    id="report-reply"
                                    rows={3}
                                    maxLength={MAX_REPLY}
                                    value={form.requestedReply}
                                    onChange={set('requestedReply')}
                                    placeholder="For example: what actually happened, or what has changed since."
                                    className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-[#41B985] focus:ring-2 focus:ring-[#41B985]/20"
                                />
                            </div>

                            {/* Who is reporting */}
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label htmlFor="report-name" className="block text-sm font-bold text-[#0A0A0A]">Your name</label>
                                    <input
                                        id="report-name"
                                        type="text"
                                        autoComplete="name"
                                        value={form.reporterName}
                                        onChange={set('reporterName')}
                                        className="w-full p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-[#41B985] focus:ring-2 focus:ring-[#41B985]/20"
                                    />
                                    {errors.reporterName && <p className="text-xs font-semibold text-rose-600">{errors.reporterName}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label htmlFor="report-email" className="block text-sm font-bold text-[#0A0A0A]">Your email</label>
                                    <input
                                        id="report-email"
                                        type="email"
                                        autoComplete="email"
                                        value={form.reporterEmail}
                                        onChange={set('reporterEmail')}
                                        className="w-full p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-[#41B985] focus:ring-2 focus:ring-[#41B985]/20"
                                    />
                                    {errors.reporterEmail && <p className="text-xs font-semibold text-rose-600">{errors.reporterEmail}</p>}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="report-relationship" className="block text-sm font-bold text-[#0A0A0A]">
                                    How do you relate to this property?
                                </label>
                                <select
                                    id="report-relationship"
                                    value={form.relationship}
                                    onChange={set('relationship')}
                                    className="w-full p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#41B985]"
                                >
                                    {RELATIONSHIPS.map((r) => (
                                        <option key={r.value} value={r.value}>{r.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Honeypot: hidden from people, irresistible to bots. */}
                            <input
                                type="text"
                                name="website"
                                value={form.website}
                                onChange={set('website')}
                                tabIndex={-1}
                                autoComplete="off"
                                aria-hidden="true"
                                className="hidden"
                            />

                            <p className="text-xs text-[#6A7282] leading-relaxed">
                                We use your email only to reply about this report. It is never shown publicly
                                and never passed to the reviewer.
                            </p>
                          </div>

                          <div className="shrink-0 border-t border-slate-100 bg-white px-6 py-5 sm:px-8">
                            <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={submitting}
                                    className="px-6 py-3 rounded-2xl font-bold text-[#4A5565] hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-6 py-3 rounded-2xl font-bold bg-[#41B985] text-white hover:bg-[#35a37b] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                                >
                                    {submitting && <Loader2 size={16} className="animate-spin" />}
                                    {submitting ? 'Sending…' : 'Send report'}
                                </button>
                            </div>
                          </div>
                        </form>
                    )}
                </motion.div>
              </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ReportReviewModal;
