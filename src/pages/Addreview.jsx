import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
    MapPin, X, Star, ShieldCheck, AlertTriangle, Upload, ChevronDown, Image as ImageIcon, Check,
} from 'lucide-react';
import ReviewNavbar from '../components/ReviewNavbar';
import AddressAutocomplete from '../components/AddressAutocomplete';
import { createReview } from '../services/reviewService';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser } from '../store/authSlice';
import { invalidateProperties } from '../store/reviewSlice';
import LoginModal from '../components/LoginModal';
import useSeo from '../hooks/useSeo';
import { AnimatePresence, motion, errorVariants, staggerContainer, fadeUp, EASE } from '../animations';


const LIMITS = { name: 120, reviewTitle: 120, review: 5000, address: 300 };

const ID_TYPES = ['Aadhaar Card', 'PAN Card', 'Driving License', 'Passport', 'Voter ID'];
const PROPERTY_TYPES = ['House', 'Apartment', 'Condo', 'Other'];

// Currency symbol shown on the Monthly Rent field. Change to '₹' for rupees.
const CURRENCY = '$';

// ── Per-ID-type format rules ───────────────────────────────────────────────
const ID_RULES = {
    'Aadhaar Card': {
        placeholder: '1234 5678 9012',
        error: 'Aadhaar number must be exactly 12 digits.',
        test: (v) => /^\d{12}$/.test(v.replace(/[\s-]/g, '')),
    },
    'PAN Card': {
        placeholder: 'ABCDE1234F',
        error: 'PAN must be 10 characters -5 letters, 4 digits, 1 letter (e.g. ABCDE1234F).',
        test: (v) => /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(v.trim().toUpperCase()),
    },
    'Driving License': {
        placeholder: 'KA0120201234567',
        error: 'Driving License looks invalid (e.g. KA0120201234567).',
        test: (v) => /^[A-Z]{2}\d{8,15}$/.test(v.replace(/[\s-]/g, '').toUpperCase()),
    },
    'Passport': {
        placeholder: 'A1234567',
        error: 'Passport must be 1 letter followed by 7 digits (e.g. A1234567).',
        test: (v) => /^[A-Z][0-9]{7}$/.test(v.trim().toUpperCase()),
    },
    'Voter ID': {
        placeholder: 'ABC1234567',
        error: 'Voter ID must be 3 letters followed by 7 digits (e.g. ABC1234567).',
        test: (v) => /^[A-Z]{3}[0-9]{7}$/.test(v.trim().toUpperCase()),
    },
};

const initialForm = {
    streetAddress: '', city: '', state: '', zipCode: '',
    lat: '', lng: '',
    type: 'Other', price: '',
    rating: 0, name: '', reviewTitle: '', review: '',
    pros: '', cons: '', idType: '', idNumber: '',
    idFile: null, photos: [],
};

// Photo picker limits -must stay in step with the backend (multer maxCount 10,
// 10MB per file). Enforcing them here avoids a wasted upload + generic 500.
// The per-file byte ceiling is multer's `limits.fileSize`, so it governs the ID
// proof as well -the same constant is reused for idFile below.
const MAX_PHOTOS = 10;
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
// Mirrors the backend's multer fileFilter allow-list (see middleware/Upload.js)
// intersected with what the ID input's `accept` attribute offers.
const ID_FILE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];

const AddReview = () => {
    // Behind ProtectedRoute and requires a signed-in session either way -no
    // public content here for a crawler to index.
    useSeo({ title: 'Write a Review | RentReview', noindex: true });

    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const dispatch = useDispatch();
    const user = useSelector(selectUser);
    const [form, setForm] = useState(initialForm);
    const [hoverRating, setHoverRating] = useState(0);
    const [idDropdownOpen, setIdDropdownOpen] = useState(false);
    const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [idTouched, setIdTouched] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [photoError, setPhotoError] = useState('');
    const [signedInNotice, setSignedInNotice] = useState('');
    const idDropdownRef = useRef(null);
    const typeDropdownRef = useRef(null);

    const idRule = ID_RULES[form.idType];
    const idNumberValid = idRule ? idRule.test(form.idNumber) : false;

    // Pre-fill from router state.
    // Sources of state.property:
    //   • Hero search → click an Ola Maps address suggestion
    //   • PropertyDetail → "Write a Review" button (for existing property)
    // Includes lat/lng so the map can pin the exact spot from Ola Maps.
    useEffect(() => {
        if (location.state?.property) {
            const p = location.state.property;
            setForm((f) => ({
                ...f,
                streetAddress: p.streetAddress || p.title || '',
                city: p.city || '',
                state: p.state || '',
                zipCode: p.zipCode || '',
                lat: p.lat || '',
                lng: p.lng || '',
                type: p.type || 'Other',
                price: p.price || '',
            }));
        }
    }, [location.state]);

    // Seed the address from `?search=` -WriteReview's "Add Review for X" CTA
    // links here with the property title in the query string. Router state
    // wins when both are present.
    useEffect(() => {
        if (location.state?.property) return;
        const search = (searchParams.get('search') || '').trim();
        if (!search) return;
        setForm((f) => (f.streetAddress ? f : { ...f, streetAddress: search }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams, location.state]);

    useEffect(() => {
        const handleClick = (e) => {
            if (idDropdownRef.current && !idDropdownRef.current.contains(e.target)) setIdDropdownOpen(false);
            if (typeDropdownRef.current && !typeDropdownRef.current.contains(e.target)) setTypeDropdownOpen(false);
        };
        const handleEsc = (e) => { if (e.key === 'Escape') { setIdDropdownOpen(false); setTypeDropdownOpen(false); } };
        document.addEventListener('mousedown', handleClick);
        document.addEventListener('keydown', handleEsc);
        return () => {
            document.removeEventListener('mousedown', handleClick);
            document.removeEventListener('keydown', handleEsc);
        };
    }, []);

    const update = (field, value) => {
        setForm((f) => ({ ...f, [field]: value }));
        if (error) setError('');
        setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: '' } : prev));
    };

    // Bring the offending control into view and focus it. Falls back to the
    // error banner at the top of the card when the control has no id.
    const focusField = (id) => {
        const el = id ? document.getElementById(id) : null;
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            try { el.focus({ preventScroll: true }); } catch { /* not focusable */ }
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const fail = (message, fieldId) => {
        setError(message);
        if (fieldId) setFieldErrors((prev) => ({ ...prev, [fieldId]: message }));
        focusField(fieldId);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setFieldErrors({});
        setIdTouched(true);

        if (!user) {
            setError('You are not logged in user');
            setShowLoginModal(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

       
        if (!form.streetAddress.trim()) { fail('Please enter the street address.', 'streetAddress'); return; }
        if (!form.city.trim()) { fail('Please enter the city.', 'city'); return; }
        if (!form.state.trim()) { fail('Please enter the state.', 'state'); return; }
        if (!form.rating) { fail('Please select an overall rating.'); return; }
        if (!form.name.trim()) { fail('Please enter your name.', 'name'); return; }
        if (!form.reviewTitle.trim()) { fail('Please enter a review title.', 'reviewTitle'); return; }
        if (!form.review.trim()) { fail('Please write your review.', 'review'); return; }
        // maxLength stops typing past the cap, but not a paste through devtools or
        // an autofill. Re-check here so an over-long field is caught before any
        // file is handed to Cloudinary.
        if (form.streetAddress.trim().length > LIMITS.address) { fail('Street address is too long.', 'streetAddress'); return; }
        if (form.name.trim().length > LIMITS.name) { fail('Your name is too long.', 'name'); return; }
        if (form.reviewTitle.trim().length > LIMITS.reviewTitle) { fail(`Review title must be ${LIMITS.reviewTitle} characters or fewer.`, 'reviewTitle'); return; }
        if (form.review.trim().length > LIMITS.review) { fail(`Review text must be ${LIMITS.review} characters or fewer.`, 'review'); return; }
        if (!form.idType) { fail('Please select an ID type.'); return; }
        if (!form.idNumber.trim()) { fail('Please enter your ID number.', 'idNumber'); return; }
        if (!idNumberValid) { fail(idRule.error, 'idNumber'); return; }
        if (!form.idFile) { fail('Please upload your ID proof.', 'idFile'); return; }
        // Re-check the ID proof here as well as at selection time: the file can
        // arrive via a route that bypasses the picker (drag-drop, autofill) and
        // an oversized one otherwise uploads in full before the server 413s.
        if (!ID_FILE_TYPES.includes(form.idFile.type)) { fail('Your ID proof must be a PNG, JPG, or PDF file.', 'idFile'); return; }
        if (form.idFile.size > MAX_PHOTO_BYTES) { fail(`"${form.idFile.name}" is larger than 10MB. Please choose a smaller file.`, 'idFile'); return; }
        if (form.photos.length > MAX_PHOTOS) { fail(`Please select at most ${MAX_PHOTOS} photos.`, 'photos'); return; }
        const oversized = form.photos.find((p) => p.size > MAX_PHOTO_BYTES);
        if (oversized) { fail(`"${oversized.name}" is larger than 10MB. Please remove it.`, 'photos'); return; }

        setSignedInNotice('');
        setSubmitting(true);
        try {
            await createReview(form);
            dispatch(invalidateProperties());
            navigate('/write-review');
        } catch (err) {
            setError(err.message);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setSubmitting(false);
        }
    };

    // Gate the ID proof at selection time with the same size/type rules the
    // photos get. Without this an 11MB ID scan uploaded in full and came back
    // as a generic "Something went wrong."
    const handleIdFilePicked = (e) => {
        const file = e.target.files?.[0] || null;
        // Allow re-picking the same file after it was rejected.
        e.target.value = '';
        if (!file) { update('idFile', null); return; }

        const reject = (message) => {
            setForm((f) => ({ ...f, idFile: null }));
            setFieldErrors((prev) => ({ ...prev, idFile: message }));
        };

        if (!ID_FILE_TYPES.includes(file.type)) {
            reject('Please upload a PNG, JPG, or PDF file.');
            return;
        }
        if (file.size > MAX_PHOTO_BYTES) {
            reject(`"${file.name}" is larger than 10MB. Please choose a smaller file.`);
            return;
        }

        update('idFile', file);
    };

    // Append to the existing selection instead of replacing it -picking again
    // used to silently drop everything chosen before. De-duplicates on
    // name+size, rejects >10MB files and caps the list at the backend's max.
    const handlePhotosPicked = (e) => {
        const picked = Array.from(e.target.files || []);
        // Allow re-picking the same file after it was removed/rejected.
        e.target.value = '';
        if (!picked.length) return;

        const messages = [];
        const tooBig = picked.filter((f) => f.size > MAX_PHOTO_BYTES);
        if (tooBig.length) {
            messages.push(
                `${tooBig.map((f) => `"${f.name}"`).join(', ')} ${tooBig.length > 1 ? 'are' : 'is'} larger than 10MB and ${tooBig.length > 1 ? 'were' : 'was'} not added.`
            );
        }

        const existing = form.photos || [];
        const seen = new Set(existing.map((p) => `${p.name}:${p.size}`));
        const next = [...existing];
        let duplicates = 0;
        let dropped = 0;

        for (const file of picked) {
            if (file.size > MAX_PHOTO_BYTES) continue;
            const key = `${file.name}:${file.size}`;
            if (seen.has(key)) { duplicates += 1; continue; }
            if (next.length >= MAX_PHOTOS) { dropped += 1; continue; }
            seen.add(key);
            next.push(file);
        }

        if (duplicates) messages.push(`${duplicates} duplicate file${duplicates > 1 ? 's were' : ' was'} skipped.`);
        if (dropped) messages.push(`You can attach at most ${MAX_PHOTOS} photos -${dropped} file${dropped > 1 ? 's were' : ' was'} not added.`);

        setForm((f) => ({ ...f, photos: next }));
        setPhotoError(messages.join(' '));
        setFieldErrors((prev) => (prev.photos ? { ...prev, photos: '' } : prev));
        if (error) setError('');
    };

    const removePhoto = (index) => {
        setForm((f) => ({ ...f, photos: f.photos.filter((_, i) => i !== index) }));
        setPhotoError('');
    };

    const handleCancel = () => navigate('/write-review');

    return (
        <div className="flex min-h-screen flex-col bg-[#F9FAFB] font-sans">
            <ReviewNavbar />

            <main className="flex-1 px-3 py-5 sm:px-6 sm:py-8 lg:px-8">
                {/* The card lands as one object; its sections then fill in.
                    layout lets it resize smoothly as photos are added and
                    validation messages appear and clear. */}
                <motion.form
                    onSubmit={handleSubmit}
                    noValidate
                    layout
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: EASE }}
                    className="mx-auto w-full max-w-[864px] overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm"
                >
                    {/* Card Header with accent bar */}
                    <header className="flex items-start justify-between gap-4 border-b border-black/10 px-4 py-5 sm:px-6 sm:py-6">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                                <motion.div
                                    aria-hidden="true"
                                    className="h-1 w-8 origin-left rounded-full bg-[#41B985]"
                                    initial={{ scaleX: 0 }}
                                    animate={{ scaleX: 1 }}
                                    transition={{ duration: 0.45, ease: EASE, delay: 0.2 }}
                                />
                                <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.15em] text-[#41B985] uppercase">
                                    New Review
                                </span>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0A0A0A]">
                                Add Your Review
                            </h1>
                            <p className="mt-1 text-xs sm:text-sm text-[#4A5565]">
                                Share your rental experience to help others make informed decisions
                            </p>
                        </div>
                        <motion.button
                            type="button"
                            onClick={handleCancel}
                            aria-label="Close and return to property listings"
                            whileHover={{ rotate: 90 }}
                            whileTap={{ scale: 0.85 }}
                            transition={{ duration: 0.2, ease: EASE }}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#0A0A0A] transition-colors hover:bg-slate-100"
                        >
                            <X className="h-4 w-4" aria-hidden="true" />
                        </motion.button>
                    </header>

                    <motion.div
                        className="flex flex-col gap-5 sm:gap-6 px-4 py-5 sm:px-6 sm:py-6"
                        initial="hidden"
                        animate="show"
                        variants={staggerContainer(0.07, 0.15)}
                    >

                        {/* Error banner. Height animates so the form below slides
                            down to make room rather than jumping under the cursor. */}
                        <AnimatePresence initial={false}>
                            {error && (
                                <motion.div
                                    key="addreview-error"
                                    role="alert"
                                    variants={errorVariants}
                                    initial="hidden"
                                    animate="show"
                                    exit="exit"
                                    className="overflow-hidden"
                                >
                                    <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">
                                        <span aria-hidden="true" className="mt-0.5 shrink-0">⚠</span>
                                        <span>{error}</span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <AnimatePresence initial={false}>
                            {signedInNotice && !error && (
                                <motion.div
                                    key="addreview-signedin"
                                    role="status"
                                    variants={errorVariants}
                                    initial="hidden"
                                    animate="show"
                                    exit="exit"
                                    className="overflow-hidden"
                                >
                                    <div className="flex items-start gap-2.5 rounded-lg border border-[#41B985]/30 bg-[#41B985]/10 px-3.5 py-3 text-sm text-[#0A0A0A]">
                                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#41B985]" aria-hidden="true" />
                                        <span>{signedInNotice}</span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Property Location */}
                        <motion.section variants={fadeUp} aria-labelledby="loc-heading" className="flex flex-col gap-4">
                            <SectionTitle id="loc-heading" icon={<MapPin className="h-4 w-4 text-[#41B985]" aria-hidden="true" />}>
                                Property Location
                            </SectionTitle>

                            <AddressAutocomplete
                                value={form.streetAddress}
                                onChange={(v) => update('streetAddress', v)}
                                onSelect={(addr) => setForm((f) => ({ ...f, ...addr }))}
                                cityHint={form.city}
                                stateHint={form.state}
                            />
                            {fieldErrors.streetAddress && (
                                <span className="-mt-2 text-xs text-red-600">{fieldErrors.streetAddress}</span>
                            )}

                            {/* City | State | ZIP -1 col mobile, 2 col sm, 3 col lg */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                <Field id="city" label="City" required value={form.city} onChange={(v) => update('city', v)} placeholder="e.g., Bangalore" autoComplete="address-level2" error={fieldErrors.city} />
                                <Field id="state" label="State" required value={form.state} onChange={(v) => update('state', v)} placeholder="e.g., Karnataka" autoComplete="address-level1" error={fieldErrors.state} />
                                <Field id="zipCode" label="ZIP/Postal Code" value={form.zipCode} onChange={(v) => update('zipCode', v)} placeholder="e.g., 560001" autoComplete="postal-code" />
                            </div>

                            {/* Property Type & Price */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-medium text-[#0A0A0A]">
                                        Property Type <span className="text-[#41B985]">*</span>
                                    </label>
                                    <div className="relative" ref={typeDropdownRef}>
                                        <button
                                            type="button"
                                            onClick={() => setTypeDropdownOpen((o) => !o)}
                                            aria-haspopup="listbox"
                                            aria-expanded={typeDropdownOpen}
                                            className="flex h-10 w-full items-center justify-between gap-3 rounded-lg bg-[#F3F3F5] px-3 text-sm transition-colors hover:bg-slate-50 cursor-pointer"
                                        >
                                            <span className="font-medium text-[#0A0A0A]">{form.type || 'Select type'}</span>
                                            <ChevronDown
                                                aria-hidden="true"
                                                className={`h-4 w-4 text-[#717182] opacity-50 transition-transform ${typeDropdownOpen ? 'rotate-180' : ''}`}
                                            />
                                        </button>
                                        {typeDropdownOpen && (
                                            <ul
                                                role="listbox"
                                                aria-label="Property type options"
                                                className="absolute left-0 right-0 z-20 mt-1 overflow-hidden rounded-xl border border-slate-100 bg-white py-1.5 shadow-lg list-none"
                                            >
                                                {PROPERTY_TYPES.map((t) => (
                                                    <li key={t}>
                                                        <button
                                                            type="button"
                                                            role="option"
                                                            aria-selected={form.type === t}
                                                            onClick={() => { update('type', t); setTypeDropdownOpen(false); }}
                                                            className="block w-full px-4 py-2.5 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50 hover:text-[#41B985] cursor-pointer"
                                                        >
                                                            {t}
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </div>

                                {/* Monthly Rent */}
                                <div className="flex flex-col gap-1.5">
                                    <label htmlFor="price" className="text-sm font-medium text-[#0A0A0A]">
                                        Monthly Rent (optional)
                                    </label>
                                    <div className="relative">
                                        <span aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-[#717182]">
                                            {CURRENCY}
                                        </span>
                                        <input
                                            id="price"
                                            type="number"
                                            min="0"
                                            value={form.price}
                                            onChange={(e) => update('price', e.target.value)}
                                            placeholder="25"
                                            className="h-10 w-full rounded-lg bg-[#F3F3F5] pl-7 pr-3 text-sm text-[#0A0A0A] placeholder-[#717182] outline-none transition-all focus:ring-2 focus:ring-[#41B985]"
                                        />
                                    </div>
                                </div>
                            </div>
                        </motion.section>

                        <hr className="border-black/10" />

                        {/* Overall Rating -proper radio group semantics */}
                        <div className="flex flex-col gap-2.5">
                            <span id="rating-label" className="text-base font-medium tracking-tight text-[#0A0A0A]">
                                Overall Rating <span className="text-[#41B985]">*</span>
                            </span>
                            <div
                                role="group"
                                aria-labelledby="rating-label"
                                className="flex items-center gap-1.5 sm:gap-2"
                            >
                                {[1, 2, 3, 4, 5].map((star) => {
                                    const filled = (hoverRating || form.rating) >= star;
                                    return (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => update('rating', star)}
                                            onMouseEnter={() => setHoverRating(star)}
                                            onMouseLeave={() => setHoverRating(0)}
                                            aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                                            aria-pressed={form.rating >= star}
                                            className="rounded transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#41B985] focus:ring-offset-2 cursor-pointer"
                                        >
                                            <Star
                                                strokeWidth={2.5}
                                                aria-hidden="true"
                                                className={`h-8 w-8 sm:h-10 sm:w-10 ${filled ? 'fill-[#FDC700] text-[#FDC700]' : 'fill-transparent text-[#D1D5DC]'}`}
                                            />
                                        </button>
                                    );
                                })}
                                {form.rating > 0 && (
                                    <span className="ml-1 sm:ml-2 text-sm font-medium text-[#4A5565]">
                                        {form.rating}/5
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Your Name */}
                        <Field id="name" label="Your Name" required value={form.name} onChange={(v) => update('name', v)} placeholder="Enter your name" autoComplete="name" error={fieldErrors.name} maxLength={LIMITS.name} />

                        {/* Review Title */}
                        <Field id="reviewTitle" label="Review Title" required value={form.reviewTitle} onChange={(v) => update('reviewTitle', v)} placeholder="Sum up your experience in one line" error={fieldErrors.reviewTitle} maxLength={LIMITS.reviewTitle} />

                        {/* Your Review */}
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="review" className="text-sm font-medium text-[#0A0A0A]">
                                Your Review <span className="text-[#41B985]">*</span>
                            </label>
                            <textarea
                                id="review"
                                rows={4}
                                required
                                value={form.review}
                                onChange={(e) => update('review', e.target.value)}
                                maxLength={LIMITS.review}
                                placeholder="Share your detailed experience living here. What was it like? How was the landlord, neighborhood, maintenance, etc.?"
                                aria-invalid={fieldErrors.review ? 'true' : undefined}
                                aria-describedby={fieldErrors.review ? 'review-error' : undefined}
                                className={`w-full resize-none rounded-lg bg-[#F3F3F5] px-3 py-2.5 text-sm text-[#0A0A0A] placeholder-[#717182] outline-none transition-all focus:ring-2 ${fieldErrors.review ? 'ring-2 ring-red-400 focus:ring-red-400' : 'focus:ring-[#41B985]'}`}
                            />
                            <div className="flex items-start justify-between gap-3">
                                {fieldErrors.review ? (
                                    <span id="review-error" className="text-xs text-red-600">{fieldErrors.review}</span>
                                ) : <span />}
                                {/* Only worth showing as the cap gets close. */}
                                {form.review.length > LIMITS.review * 0.8 && (
                                    <span className="shrink-0 text-xs text-[#717182]">
                                        {form.review.length} / {LIMITS.review}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Pros / Cons */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="pros" className="text-sm font-medium text-[#0A0A0A]">Pros (one per line)</label>
                                <textarea
                                    id="pros"
                                    rows={3}
                                    value={form.pros}
                                    onChange={(e) => update('pros', e.target.value)}
                                    placeholder={'Great location\nResponsive maintenance\nQuiet neighborhood'}
                                    className="w-full resize-none rounded-lg bg-[#F3F3F5] px-3 py-2.5 text-sm text-[#0A0A0A] placeholder-[#717182] outline-none transition-all focus:ring-2 focus:ring-[#41B985]"
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="cons" className="text-sm font-medium text-[#0A0A0A]">Cons (one per line)</label>
                                <textarea
                                    id="cons"
                                    rows={3}
                                    value={form.cons}
                                    onChange={(e) => update('cons', e.target.value)}
                                    placeholder={'Limited parking\nThin walls\nExpensive utilities'}
                                    className="w-full resize-none rounded-lg bg-[#F3F3F5] px-3 py-2.5 text-sm text-[#0A0A0A] placeholder-[#717182] outline-none transition-all focus:ring-2 focus:ring-[#41B985]"
                                />
                            </div>
                        </div>

                        <hr className="border-black/10" />

                        {/* Identity Verification */}
                        <motion.section variants={fadeUp}
                            aria-labelledby="id-heading"
                            className="flex flex-col gap-4 rounded-2xl border border-[#41B985]/20 bg-[#41B985]/5 p-4 sm:p-6"
                        >
                            <div className="flex items-start gap-3">
                                <div aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#41B985]/15">
                                    <ShieldCheck className="h-5 w-5 text-[#41B985]" />
                                </div>
                                <div className="flex flex-col gap-1 min-w-0">
                                    <h2 id="id-heading" className="text-base sm:text-lg font-semibold tracking-tight text-[#0A0A0A]">
                                        Identity Verification
                                    </h2>
                                    <p className="text-xs sm:text-sm leading-snug text-[#4A5565]">
                                        To maintain the authenticity and trustworthiness of our reviews, we require verification of your identity. This helps prevent fake reviews and ensures genuine experiences are shared.
                                    </p>
                                </div>
                            </div>

                            {/*
                              Consent notice, DPDP Act s.5 shown where the data is actually
                              asked for, not only on the policy page.

                              Four short lines, because this sits above a form someone is trying
                              to finish. The old text ("we comply with all data protection
                              regulations") said nothing and claimed everything; the long version
                              that replaced it was five bullets nobody would read here. The detail
                              lives on the Privacy page, one tap away.
                            */}
                            <div className="flex items-start gap-2 rounded-lg border border-[#FEE685] bg-[#FFFBEB] p-3">
                                <AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[#E17100]" />
                                <div className="min-w-0 text-[11px] sm:text-xs leading-relaxed text-[#973C00]">
                                    <p className="font-bold mb-1">What happens to your ID</p>
                                    <p>
                                        It is used only to check a real person wrote this review. It is
                                        encrypted, only our verification staff can open it, and it is
                                        deleted once checked or automatically after 30 days. It is
                                        never shown on your review or to a landlord.
                                    </p>
                                    <p className="mt-1.5">
                                        Don’t want to use Aadhaar? Any other document works the same.{' '}
                                        <Link
                                            to="/privacy#your-id"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-semibold underline underline-offset-2 hover:text-[#E17100]"
                                        >
                                            More detail
                                        </Link>
                                    </p>
                                </div>
                            </div>

                            {/* ID Type */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#0A0A0A]">
                                    ID Type <span className="text-[#41B985]">*</span>
                                </label>
                                <div className="relative" ref={idDropdownRef}>
                                    <button
                                        type="button"
                                        onClick={() => setIdDropdownOpen((o) => !o)}
                                        aria-haspopup="listbox"
                                        aria-expanded={idDropdownOpen}
                                        aria-label={form.idType ? `ID type, currently ${form.idType}` : 'Select an ID type'}
                                        className="flex h-10 w-full items-center justify-between gap-3 rounded-lg bg-white px-3 text-sm transition-colors hover:bg-slate-50 cursor-pointer"
                                    >
                                        <span className={form.idType ? 'font-medium text-[#0A0A0A]' : 'font-medium text-[#717182]'}>
                                            {form.idType || 'Select ID type'}
                                        </span>
                                        <ChevronDown
                                            aria-hidden="true"
                                            className={`h-4 w-4 text-[#717182] opacity-50 transition-transform ${idDropdownOpen ? 'rotate-180' : ''}`}
                                        />
                                    </button>
                                    {idDropdownOpen && (
                                        <ul
                                            role="listbox"
                                            aria-label="ID type options"
                                            className="absolute left-0 right-0 z-20 mt-1 overflow-hidden rounded-xl border border-slate-100 bg-white py-1.5 shadow-lg list-none"
                                        >
                                            {ID_TYPES.map((type) => (
                                                <li key={type}>
                                                    <button
                                                        type="button"
                                                        role="option"
                                                        aria-selected={form.idType === type}
                                                        onClick={() => {
                                                            setForm((f) => ({ ...f, idType: type, idNumber: '' }));
                                                            setIdTouched(false);
                                                            setIdDropdownOpen(false);
                                                            if (error) setError('');
                                                        }}
                                                        className="block w-full px-4 py-2.5 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50 hover:text-[#41B985] cursor-pointer"
                                                    >
                                                        {type}
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>

                            {/* ID Number */}
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="idNumber" className="text-sm font-medium text-[#0A0A0A]">
                                    ID Number <span className="text-[#41B985]">*</span>
                                </label>
                                <input
                                    id="idNumber"
                                    type="text"
                                    value={form.idNumber}
                                    disabled={!form.idType}
                                    onChange={(e) => update('idNumber', e.target.value.toUpperCase())}
                                    onBlur={() => setIdTouched(true)}
                                    aria-invalid={idTouched && form.idType && form.idNumber && !idNumberValid}
                                    aria-describedby="id-number-hint"
                                    placeholder={form.idType ? (idRule?.placeholder || 'Enter your ID number') : 'Select an ID type first'}
                                    className={`h-10 w-full rounded-lg bg-white px-3 text-sm text-[#0A0A0A] placeholder-[#717182] outline-none transition-all focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${idTouched && form.idType && form.idNumber && !idNumberValid
                                        ? 'ring-2 ring-red-400 focus:ring-red-400'
                                        : 'focus:ring-[#41B985]'
                                        }`}
                                />
                                {form.idType && (
                                    <span id="id-number-hint">
                                        {idTouched && form.idNumber && !idNumberValid ? (
                                            <span className="text-xs text-red-600">{idRule.error}</span>
                                        ) : form.idNumber && idNumberValid ? (
                                            <span className="flex items-center gap-1 text-xs text-[#008236]">
                                                <Check className="h-3 w-3" aria-hidden="true" /> Format looks valid
                                            </span>
                                        ) : (
                                            <span className="text-xs text-[#6A7282]">Format: {idRule?.placeholder}</span>
                                        )}
                                    </span>
                                )}
                            </div>

                            {/* Upload ID Proof */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-[#0A0A0A]">
                                    Upload ID Proof <span className="text-[#41B985]">*</span>
                                </label>
                                <label
                                    htmlFor="idFile"
                                    className="flex h-28 sm:h-32 cursor-pointer flex-col items-center justify-center gap-1.5 sm:gap-2 rounded-2xl border-2 border-dashed border-[#41B985]/40 bg-white transition-colors hover:border-[#41B985] hover:bg-[#41B985]/5"
                                >
                                    <input
                                        id="idFile"
                                        type="file"
                                        accept="image/png,image/jpeg,application/pdf"
                                        onChange={handleIdFilePicked}
                                        className="sr-only"
                                    />
                                    <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-[#41B985]" aria-hidden="true" />
                                    <span className="text-xs sm:text-sm font-semibold text-[#41B985] px-3 text-center break-all">
                                        {form.idFile ? form.idFile.name : 'Click to upload ID'}
                                    </span>
                                    <span className="text-[10px] sm:text-xs font-medium text-[#6A7282]">PNG, JPG, or PDF up to 10MB</span>
                                </label>
                                {fieldErrors.idFile && (
                                    <span className="text-xs text-red-600">{fieldErrors.idFile}</span>
                                )}
                            </div>
                        </motion.section>

                        {/* Add Photos */}
                        <motion.section variants={fadeUp} aria-labelledby="photos-heading" className="flex flex-col gap-3">
                            <SectionTitle id="photos-heading" icon={<ImageIcon className="h-4 w-4 text-[#41B985]" aria-hidden="true" />} size="md">
                                Add Photos (Optional)
                            </SectionTitle>
                            <p className="text-xs sm:text-sm text-[#4A5565]">
                                Upload photos of the property to help others visualize your experience
                            </p>
                            <label
                                htmlFor="photos"
                                className="flex h-28 sm:h-32 cursor-pointer flex-col items-center justify-center gap-1.5 sm:gap-2 rounded-2xl border-2 border-dashed border-[#D1D5DC] bg-white transition-colors hover:border-[#41B985]/60 hover:bg-slate-50"
                            >
                                <input
                                    id="photos"
                                    type="file"
                                    accept="image/png,image/jpeg,image/gif"
                                    multiple
                                    onChange={handlePhotosPicked}
                                    className="sr-only"
                                />
                                <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-[#99A1AF]" aria-hidden="true" />
                                <p className="text-xs sm:text-sm text-[#4A5565] text-center px-3">
                                    <span className="font-semibold">
                                        {form.photos.length > 0 ? 'Click to add more' : 'Click to upload'}
                                    </span>{' '}
                                    <span className="hidden sm:inline font-medium">or drag and drop</span>
                                </p>
                                <span className="text-[10px] sm:text-xs font-medium text-[#6A7282]">
                                    {form.photos.length > 0
                                        ? `${form.photos.length} of ${MAX_PHOTOS} file${form.photos.length > 1 ? 's' : ''} selected`
                                        : `PNG, JPG, GIF up to 10MB -max ${MAX_PHOTOS} photos`}
                                </span>
                            </label>

                            {(photoError || fieldErrors.photos) && (
                                <p role="alert" className="text-xs text-red-600">
                                    {photoError || fieldErrors.photos}
                                </p>
                            )}

                            {form.photos.length > 0 && (
                                <ul className="flex flex-wrap gap-2 list-none">
                                    {form.photos.map((photo, i) => (
                                        <li
                                            key={`${photo.name}-${photo.size}-${i}`}
                                            className="flex max-w-full items-center gap-1.5 rounded-lg bg-[#F3F3F5] px-2.5 py-1.5 text-xs text-[#4A5565]"
                                        >
                                            <span className="truncate max-w-[180px]">{photo.name}</span>
                                            <button
                                                type="button"
                                                onClick={() => removePhoto(i)}
                                                aria-label={`Remove ${photo.name}`}
                                                className="shrink-0 rounded p-0.5 text-[#717182] transition-colors hover:bg-white hover:text-red-600 cursor-pointer"
                                            >
                                                <X className="h-3 w-3" aria-hidden="true" />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </motion.section>

                        {/* Action buttons */}
                        <div className="flex flex-col-reverse gap-3 border-t border-black/10 pt-4 sm:flex-row">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="flex h-11 items-center justify-center rounded-lg border border-black/10 bg-white px-6 text-sm font-medium text-[#0A0A0A] transition-colors hover:bg-slate-50 cursor-pointer sm:flex-1"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex h-11 sm:flex-1 items-center justify-center gap-2 rounded-lg bg-[#41B985] px-6 text-sm font-semibold text-white shadow-md shadow-emerald-100 transition-all hover:bg-[#36a374] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer"
                            >
                                {submitting ? 'Submitting…' : 'Submit Review'}
                            </button>
                        </div>
                    </motion.div>
                </motion.form>
            </main>

            <footer className="mt-8 border-t border-black/10 bg-white py-4 text-center">
                <div className="mx-auto w-full max-w-[864px] px-4 sm:px-6">
                    <p className="text-xs sm:text-sm text-[#4A5565]">
                        © {new Date().getFullYear()} RentReview. Helping renters make informed decisions.
                    </p>
                    <p className="mt-1 text-[10px] sm:text-xs text-[#4A5565]">
                        All reviews are from community members. Always verify property details before signing a lease.
                    </p>
                </div>
            </footer>

            {showLoginModal && (
                <LoginModal
                    onClose={() => setShowLoginModal(false)}
                    onSuccess={() => {
                        // Clear the stale "You are not logged in user" banner and
                        // tell them their work is still here.
                        setError('');
                        setShowLoginModal(false);
                        setSignedInNotice("You're signed in -press Submit to post your review. Nothing you typed was lost.");
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                />
            )}
        </div>
    );
};

const SectionTitle = ({ id, icon, children, size = 'lg' }) => (
    <div className="flex items-center gap-2.5">
        <div aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#41B985]/10">
            {icon}
        </div>
        <h2 id={id} className={`font-semibold tracking-tight text-[#0A0A0A] ${size === 'lg' ? 'text-base sm:text-lg' : 'text-base'}`}>
            {children}
        </h2>
    </div>
);

const Field = ({ id, label, required, value, onChange, placeholder, type = 'text', autoComplete, error, maxLength }) => (
    <div className="flex flex-col gap-1.5">
        <label htmlFor={id} className="text-sm font-medium text-[#0A0A0A]">
            {label}{required && <span className="text-[#41B985]"> *</span>}
        </label>
        <input
            id={id}
            type={type}
            required={required}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            autoComplete={autoComplete}
            maxLength={maxLength}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error ? `${id}-error` : undefined}
            className={`h-10 w-full rounded-lg bg-[#F3F3F5] px-3 text-sm text-[#0A0A0A] placeholder-[#717182] outline-none transition-all focus:ring-2 ${error ? 'ring-2 ring-red-400 focus:ring-red-400' : 'focus:ring-[#41B985]'}`}
        />
        {error && (
            <span id={`${id}-error`} className="text-xs text-red-600">{error}</span>
        )}
    </div>
);

export default AddReview;