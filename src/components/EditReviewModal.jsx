import React, { useEffect, useRef, useState } from 'react';
import { Pencil, X, Loader2, Star, Info } from 'lucide-react';
import { updateReview } from '../services/reviewService';
import { motion, AnimatePresence } from '../animations';



const MAX_TITLE = 120;
const MAX_BODY = 5000;

// Arrays on the wire, one-per-line in the textarea. The backend's toLines()
// splits on newlines and drops blanks, so this round-trips cleanly.
const linesToText = (val) => (Array.isArray(val) ? val.join('\n') : (val || ''));

const EditReviewModal = ({ review, onClose, onSaved }) => {
    const [form, setForm] = useState({
        rating: Number(review.rating) || 0,
        reviewTitle: review.title || '',
        review: review.body || '',
        pros: linesToText(review.pros),
        cons: linesToText(review.cons),
    });
    const [errors, setErrors] = useState({});
    const [topError, setTopError] = useState('');
    const [saving, setSaving] = useState(false);

    const firstFieldRef = useRef(null);

    // Focus the first control, close on Escape, restore focus on the way out.
    // Escape is ignored mid-save so a slow request can't be abandoned halfway
    // and leave the list showing stale text.
    useEffect(() => {
        const previouslyFocused = document.activeElement;
        firstFieldRef.current?.focus();

        const onKeyDown = (e) => {
            if (e.key === 'Escape' && !saving) onClose();
        };
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('keydown', onKeyDown);
            if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
        };
    }, [onClose, saving]);

    const set = (key) => (e) => {
        setForm((prev) => ({ ...prev, [key]: e.target.value }));
        setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
    };

    const setRating = (value) => {
        setForm((prev) => ({ ...prev, rating: value }));
        setErrors((prev) => (prev.rating ? { ...prev, rating: undefined } : prev));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setTopError('');

        const next = {};
        if (!Number.isInteger(form.rating) || form.rating < 1 || form.rating > 5) {
            next.rating = 'Choose a rating from 1 to 5 stars.';
        }
        if (!form.reviewTitle.trim()) next.reviewTitle = 'Give your review a title.';
        else if (form.reviewTitle.trim().length > MAX_TITLE) {
            next.reviewTitle = `Keep the title to ${MAX_TITLE} characters or fewer.`;
        }
        if (!form.review.trim()) next.review = 'Your review can’t be empty.';
        else if (form.review.trim().length > MAX_BODY) {
            next.review = `Keep your review to ${MAX_BODY} characters or fewer.`;
        }
        if (Object.keys(next).length) {
            setErrors(next);
            return;
        }

        setSaving(true);
        try {
            // Every field is sent every time. A partial body would be valid to
            // the endpoint (it treats `undefined` as "leave alone"), but then
            // clearing pros or cons would be impossible an empty textarea
            // would look identical to an untouched one.
            const data = await updateReview(review._id, {
                rating: form.rating,
                reviewTitle: form.reviewTitle.trim(),
                review: form.review.trim(),
                pros: form.pros,
                cons: form.cons,
            });
            onSaved(data.review);
        } catch (err) {
            setTopError(err.message || 'We could not save your changes. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const titleLeft = MAX_TITLE - form.reviewTitle.length;
    const bodyLeft = MAX_BODY - form.review.length;

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => !saving && onClose()}
            >
                <motion.div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="edit-review-title"
                    onClick={(e) => e.stopPropagation()}
                    initial={{ opacity: 0, y: 24, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 12, scale: 0.98 }}
                    transition={{ duration: 0.22 }}
                    className="w-full max-w-xl my-8 bg-white rounded-3xl shadow-2xl"
                >
                    <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3">
                                <div
                                    aria-hidden="true"
                                    className="w-11 h-11 rounded-2xl bg-emerald-50 text-[#41B985] flex items-center justify-center shrink-0"
                                >
                                    <Pencil size={20} />
                                </div>
                                <div className="min-w-0">
                                    <h2 id="edit-review-title" className="text-xl font-bold text-[#0A0A0A]">
                                        Edit your review
                                    </h2>
                                    <p className="text-sm text-[#6A7282] mt-0.5 truncate">
                                        {review.property?.title || 'Your review'}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={saving}
                                aria-label="Close"
                                className="text-slate-400 hover:text-slate-700 transition-colors shrink-0 cursor-pointer disabled:opacity-50"
                            >
                                <X size={22} />
                            </button>
                        </div>

                        {/* What this form cannot change, said up front rather than
                            discovered by a user hunting for a control that isn't
                            there. Changing the address would turn a verified review
                            of one property into an unverified one of another. */}
                        <p className="flex items-start gap-2.5 rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3 text-xs text-[#4A5565] leading-relaxed">
                            <Info size={15} className="mt-0.5 shrink-0 text-[#6A7282]" aria-hidden="true" />
                            <span>
                                You can change your rating and what you wrote. The property, address and
                                photos stay as submitted &mdash; to change those, delete this review and
                                write a new one.
                            </span>
                        </p>

                        {topError && (
                            <p role="alert" className="text-sm font-semibold text-rose-600">
                                {topError}
                            </p>
                        )}

                        {/* Rating */}
                        <fieldset className="space-y-2">
                            <legend className="text-sm font-bold text-[#0A0A0A] mb-2">Your rating</legend>
                            <div className="flex items-center gap-1.5">
                                {[1, 2, 3, 4, 5].map((value) => (
                                    <button
                                        key={value}
                                        ref={value === 1 ? firstFieldRef : undefined}
                                        type="button"
                                        onClick={() => setRating(value)}
                                        aria-pressed={form.rating === value}
                                        aria-label={`${value} star${value === 1 ? '' : 's'}`}
                                        className="p-1 rounded-lg text-yellow-400 hover:scale-110 active:scale-95 transition-transform cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#41B985] focus-visible:ring-offset-2"
                                    >
                                        <Star
                                            size={28}
                                            aria-hidden="true"
                                            fill={value <= form.rating ? 'currentColor' : 'none'}
                                        />
                                    </button>
                                ))}
                                <span className="ml-2 text-sm font-bold text-[#4A5565]">
                                    {form.rating ? `${form.rating} / 5` : 'Not rated'}
                                </span>
                            </div>
                            {errors.rating && (
                                <p className="text-xs font-semibold text-rose-600">{errors.rating}</p>
                            )}
                        </fieldset>

                        {/* Title */}
                        <div className="space-y-1.5">
                            <label htmlFor="edit-title" className="block text-sm font-bold text-[#0A0A0A]">
                                Title
                            </label>
                            <input
                                id="edit-title"
                                type="text"
                                maxLength={MAX_TITLE}
                                value={form.reviewTitle}
                                onChange={set('reviewTitle')}
                                className="w-full p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-[#41B985] focus:ring-2 focus:ring-[#41B985]/20"
                            />
                            <div className="flex justify-between gap-3">
                                {errors.reviewTitle ? (
                                    <p className="text-xs font-semibold text-rose-600">{errors.reviewTitle}</p>
                                ) : (
                                    <span />
                                )}
                                <span className="text-xs text-[#94A3B8] tabular-nums shrink-0">
                                    {titleLeft} left
                                </span>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="space-y-1.5">
                            <label htmlFor="edit-body" className="block text-sm font-bold text-[#0A0A0A]">
                                Your review
                            </label>
                            <textarea
                                id="edit-body"
                                rows={7}
                                maxLength={MAX_BODY}
                                value={form.review}
                                onChange={set('review')}
                                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 text-sm leading-relaxed focus:outline-none focus:border-[#41B985] focus:ring-2 focus:ring-[#41B985]/20"
                            />
                            <div className="flex justify-between gap-3">
                                {errors.review ? (
                                    <p className="text-xs font-semibold text-rose-600">{errors.review}</p>
                                ) : (
                                    <span />
                                )}
                                <span className="text-xs text-[#94A3B8] tabular-nums shrink-0">
                                    {bodyLeft} left
                                </span>
                            </div>
                        </div>

                        {/* Pros / cons */}
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label htmlFor="edit-pros" className="block text-sm font-bold text-[#0A0A0A]">
                                    Pros <span className="font-normal text-[#6A7282]">(one per line)</span>
                                </label>
                                <textarea
                                    id="edit-pros"
                                    rows={4}
                                    value={form.pros}
                                    onChange={set('pros')}
                                    placeholder={'Quiet street\nLandlord fixed things fast'}
                                    className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-[#41B985] focus:ring-2 focus:ring-[#41B985]/20"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label htmlFor="edit-cons" className="block text-sm font-bold text-[#0A0A0A]">
                                    Cons <span className="font-normal text-[#6A7282]">(one per line)</span>
                                </label>
                                <textarea
                                    id="edit-cons"
                                    rows={4}
                                    value={form.cons}
                                    onChange={set('cons')}
                                    placeholder={'Damp in the back bedroom\nNoisy boiler'}
                                    className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-[#41B985] focus:ring-2 focus:ring-[#41B985]/20"
                                />
                            </div>
                        </div>

                        <p className="text-xs text-[#6A7282] leading-relaxed">
                            Keep names, phone numbers and other personal details out of your review &mdash;
                            edits are screened for them the same way new reviews are.
                        </p>

                        <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end pt-1">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={saving}
                                className="px-6 py-3 rounded-2xl font-bold text-[#4A5565] hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-60"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-6 py-3 rounded-2xl font-bold bg-[#41B985] text-white hover:bg-[#35a37b] transition-colors disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
                            >
                                {saving && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
                                {saving ? 'Saving…' : 'Save changes'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default EditReviewModal;
