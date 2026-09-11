import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

// Uploaded files are served from the server root (/uploads/...), not /api.
// Cloudinary URLs are absolute and pass straight through.
const SERVER_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');
export const resolveUpload = (p) => (!p ? '' : p.startsWith('http') ? p : `${SERVER_ORIGIN}${p}`);

const wrap = (i, count) => ((i % count) + count) % count;

// Photos a review was submitted with.
//
//   1–2 photos → small square thumbnails
//   3+ photos  → carousel with previous/next arrows. Dots for up to five
//                slides; past that dots get too crowded to hit on a phone, so
//                a "3 / 8" counter takes over.
//
// Clicking any photo opens the full-screen viewer (Lightbox) at that photo.
//
// Hooks rules: `useState`/`useEffect` etc. cannot sit behind an early return,
// so the small layouts are split out and the carousel owns its own state.
const ReviewPhotos = ({ photos, title, className = '' }) => {
    const urls = (Array.isArray(photos) ? photos : []).map(resolveUpload).filter(Boolean);
    if (urls.length === 0) return null;

    const label = title ? `${title} photo` : 'Review photo';

    if (urls.length < 3) {
        return <PhotoThumbnails urls={urls} label={label} className={className} />;
    }

    return <PhotoCarousel urls={urls} label={label} className={className} />;
};

// 1–2 photos: small thumbnails; each one opens the viewer.
const PhotoThumbnails = ({ urls, label, className }) => {
    const [open, setOpen] = useState(null); // index or null

    return (
        <>
            <ul className={`flex flex-wrap gap-2 list-none ${className}`} aria-label="Review photos">
                {urls.map((src, i) => (
                    <li key={src + i}>
                        <button
                            type="button"
                            onClick={() => setOpen(i)}
                            aria-label={`View ${label} ${i + 1} of ${urls.length} full size`}
                            className="block rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#41B985] focus-visible:ring-offset-2"
                        >
                            <img
                                src={src}
                                alt={`${label} ${i + 1} of ${urls.length}`}
                                width="80"
                                height="80"
                                loading="lazy"
                                className="h-16 w-16 sm:h-20 sm:w-20 rounded-lg border border-black/10 object-cover hover:scale-105 transition-transform cursor-zoom-in"
                            />
                        </button>
                    </li>
                ))}
            </ul>
            {open !== null && (
                <Lightbox urls={urls} label={label} startIndex={open} onClose={() => setOpen(null)} />
            )}
        </>
    );
};

const SWIPE_THRESHOLD_PX = 40;

// `fill` pins the carousel to its parent's box (the property hero, which must
// be `relative` with its own height/rounding) instead of sizing itself from
// the image aspect ratio - so the hero keeps exactly the size it had with a
// single <img>.
export const PhotoCarousel = ({ urls, label, className = '', fill = false }) => {
    const [index, setIndex] = useState(0);
    const [viewerOpen, setViewerOpen] = useState(false);
    const count = urls.length;
    const headingId = useId();
    const touchStartX = useRef(null);

    // Clamp if the photo list ever shrinks underneath us.
    useEffect(() => {
        if (index > count - 1) setIndex(Math.max(0, count - 1));
    }, [count, index]);

    const goTo = useCallback((i) => setIndex(wrap(i, count)), [count]);
    const prev = useCallback(() => goTo(index - 1), [goTo, index]);
    const next = useCallback(() => goTo(index + 1), [goTo, index]);

    const onKeyDown = (e) => {
        if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
        else if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
        else if (e.key === 'Home') { e.preventDefault(); goTo(0); }
        else if (e.key === 'End') { e.preventDefault(); goTo(count - 1); }
        else if (e.key === 'Enter') { e.preventDefault(); setViewerOpen(true); }
    };

    const onTouchStart = (e) => { touchStartX.current = e.touches[0]?.clientX ?? null; };
    const onTouchEnd = (e) => {
        if (touchStartX.current == null) return;
        const dx = (e.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current;
        touchStartX.current = null;
        if (dx > SWIPE_THRESHOLD_PX) prev();
        else if (dx < -SWIPE_THRESHOLD_PX) next();
    };

    const showDots = count <= 5;

    return (
        <section
            role="region"
            aria-roledescription="carousel"
            aria-labelledby={headingId}
            className={`select-none ${fill ? 'absolute inset-0' : ''} ${className}`}
        >
            <p id={headingId} className="sr-only">Photos, {count} in total</p>

            <div
                className={`relative overflow-hidden bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#41B985] focus-visible:ring-offset-2 ${
                    fill ? 'absolute inset-0' : 'rounded-xl border border-black/10'
                }`}
                tabIndex={0}
                onKeyDown={onKeyDown}
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
            >
                {/* Track: every slide rendered, translated as a strip so the
                    browser animates the move and adjacent images are already
                    decoded when they come into view. */}
                <div
                    className={`flex transition-transform duration-300 ease-out motion-reduce:transition-none ${fill ? 'h-full' : ''}`}
                    style={{ transform: `translateX(-${index * 100}%)` }}
                    aria-live="polite"
                    aria-atomic="false"
                >
                    {urls.map((src, i) => (
                        <div
                            key={src + i}
                            role="group"
                            aria-roledescription="slide"
                            aria-label={`${i + 1} of ${count}`}
                            aria-hidden={i !== index}
                            className={`w-full shrink-0 ${fill ? 'h-full' : ''}`}
                        >
                            <button
                                type="button"
                                tabIndex={i === index ? 0 : -1}
                                onClick={() => setViewerOpen(true)}
                                aria-label={`View ${label} ${i + 1} of ${count} full size`}
                                className="block h-full w-full cursor-zoom-in focus:outline-none"
                            >
                                <img
                                    src={src}
                                    alt={`${label} ${i + 1} of ${count}`}
                                    loading={i === 0 ? 'eager' : 'lazy'}
                                    draggable={false}
                                    className={fill ? 'h-full w-full object-cover' : 'aspect-[4/3] sm:aspect-[16/10] w-full max-h-96 object-cover'}
                                />
                            </button>
                        </div>
                    ))}
                </div>

                {/* Arrows */}
                <button
                    type="button"
                    onClick={prev}
                    aria-label="Previous photo"
                    className="absolute left-2 top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-[#0A0A0A] shadow-md ring-1 ring-black/10 transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#41B985]"
                >
                    <ChevronLeft size={20} aria-hidden="true" />
                </button>
                <button
                    type="button"
                    onClick={next}
                    aria-label="Next photo"
                    className="absolute right-2 top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-[#0A0A0A] shadow-md ring-1 ring-black/10 transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#41B985]"
                >
                    <ChevronRight size={20} aria-hidden="true" />
                </button>

                {/* Counter -always present so the position is readable even
                    with dots, and the only indicator when there are many. */}
                <span
                    className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-white"
                    aria-hidden="true"
                >
                    {index + 1} / {count}
                </span>
            </div>

            {showDots && (
                <div
                    className={`flex items-center justify-center gap-1.5 ${
                        fill ? 'absolute bottom-2 left-0 right-0 z-10 pointer-events-none' : 'mt-2'
                    }`}
                    role="tablist"
                    aria-label="Choose photo"
                >
                    {urls.map((_, i) => {
                        const active = i === index;
                        return (
                            <button
                                key={i}
                                type="button"
                                role="tab"
                                aria-selected={active}
                                aria-label={`Photo ${i + 1} of ${count}`}
                                onClick={() => goTo(i)}
                                // 44px hit target around a small visual dot
                                className="pointer-events-auto grid h-6 w-6 place-items-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#41B985]"
                            >
                                <span
                                    aria-hidden="true"
                                    className={`block rounded-full transition-all duration-200 ${
                                        active
                                            ? 'h-2.5 w-2.5 bg-[#41B985]'
                                            : fill
                                                ? 'h-2 w-2 bg-white/80 hover:bg-white'
                                                : 'h-2 w-2 bg-[#D1D5DC] hover:bg-[#9CA3AF]'
                                    }`}
                                />
                            </button>
                        );
                    })}
                </div>
            )}

            {viewerOpen && (
                <Lightbox
                    urls={urls}
                    label={label}
                    startIndex={index}
                    onClose={(lastIndex) => {
                        setViewerOpen(false);
                        // Land the carousel on whatever the viewer ended on.
                        if (typeof lastIndex === 'number') goTo(lastIndex);
                    }}
                />
            )}
        </section>
    );
};

// ── Full-screen viewer ───────────────────────────────────────────────────────
// Opens on the photo that was clicked and shows it UNCROPPED: `object-contain`
// with the natural size as the ceiling, so a small photo is not blown up and a
// large one is scaled down only as far as the viewport requires. Left/right
// arrows, keyboard, swipe, Escape and backdrop-click to close. Rendered in a
// portal so it escapes any `overflow-hidden` / transformed ancestors.
export const Lightbox = ({ urls, label, startIndex = 0, onClose }) => {
    const count = urls.length;
    const [index, setIndex] = useState(wrap(startIndex, count));
    const touchStartX = useRef(null);
    const closeBtnRef = useRef(null);
    const indexRef = useRef(index);
    indexRef.current = index;

    const goTo = useCallback((i) => setIndex(wrap(i, count)), [count]);
    const prev = useCallback(() => setIndex((i) => wrap(i - 1, count)), [count]);
    const next = useCallback(() => setIndex((i) => wrap(i + 1, count)), [count]);
    const close = useCallback(() => onClose?.(indexRef.current), [onClose]);

    const handleKey = useCallback((e) => {
        if (e.key === 'Escape') { e.preventDefault(); close(); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
        else if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
    }, [close, prev, next]);

    // Focus and scroll lock while open. Keys are handled on the dialog while
    // focus is inside it; this document listener is the fallback for when
    // focus has wandered (it never fires twice: the dialog stops propagation).
    useEffect(() => {
        const onKey = (e) => handleKey(e);
        document.addEventListener('keydown', onKey);
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        closeBtnRef.current?.focus();
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = prevOverflow;
        };
    }, [handleKey]);

    const onTouchStart = (e) => { touchStartX.current = e.touches[0]?.clientX ?? null; };
    const onTouchEnd = (e) => {
        if (touchStartX.current == null) return;
        const dx = (e.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current;
        touchStartX.current = null;
        if (dx > SWIPE_THRESHOLD_PX) prev();
        else if (dx < -SWIPE_THRESHOLD_PX) next();
    };

    if (typeof document === 'undefined') return null;

    const arrowClass =
        'absolute top-1/2 -translate-y-1/2 grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white ring-1 ring-white/30 backdrop-blur transition hover:bg-white/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#41B985]';

    return createPortal(
        <div
            role="dialog"
            aria-modal="true"
            aria-label={`${label} viewer, ${index + 1} of ${count}`}
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/95"
            onClick={close}
            // React events bubble through portals to the carousel that opened
            // us; stop them so a swipe or arrow key here doesn't also move it.
            onKeyDown={(e) => { e.stopPropagation(); handleKey(e); }}
            onTouchStart={(e) => { e.stopPropagation(); onTouchStart(e); }}
            onTouchEnd={(e) => { e.stopPropagation(); onTouchEnd(e); }}
        >
            {/* Top bar */}
            <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3 sm:p-4 text-white">
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs sm:text-sm font-semibold tabular-nums">
                    {index + 1} / {count}
                </span>
                <button
                    ref={closeBtnRef}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); close(); }}
                    aria-label="Close photo viewer"
                    className="grid h-10 w-10 place-items-center rounded-full bg-white/10 ring-1 ring-white/30 transition hover:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#41B985]"
                >
                    <X size={22} aria-hidden="true" />
                </button>
            </div>

            {/* The photo, at natural size when it fits, otherwise scaled to fit. */}
            <img
                key={urls[index]}
                src={urls[index]}
                alt={`${label} ${index + 1} of ${count}`}
                draggable={false}
                onClick={(e) => e.stopPropagation()}
                className="max-h-[calc(100vh-7rem)] max-w-[calc(100vw-2rem)] sm:max-w-[calc(100vw-8rem)] object-contain select-none"
            />

            {count > 1 && (
                <>
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); prev(); }}
                        aria-label="Previous photo"
                        className={`${arrowClass} left-2 sm:left-5`}
                    >
                        <ChevronLeft size={26} aria-hidden="true" />
                    </button>
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); next(); }}
                        aria-label="Next photo"
                        className={`${arrowClass} right-2 sm:right-5`}
                    >
                        <ChevronRight size={26} aria-hidden="true" />
                    </button>

                    {/* Thumbnail strip -tap to jump; the active one is outlined. */}
                    <div
                        className="absolute inset-x-0 bottom-0 flex justify-center gap-2 overflow-x-auto p-3 sm:p-4"
                        onClick={(e) => e.stopPropagation()}
                        role="tablist"
                        aria-label="Choose photo"
                    >
                        {urls.map((src, i) => (
                            <button
                                key={src + i}
                                type="button"
                                role="tab"
                                aria-selected={i === index}
                                aria-label={`Photo ${i + 1} of ${count}`}
                                onClick={() => goTo(i)}
                                className={`h-12 w-12 sm:h-14 sm:w-14 shrink-0 overflow-hidden rounded-md ring-2 transition focus:outline-none focus-visible:ring-[#41B985] ${
                                    i === index ? 'ring-[#41B985] opacity-100' : 'ring-transparent opacity-60 hover:opacity-100'
                                }`}
                            >
                                <img src={src} alt="" draggable={false} className="h-full w-full object-cover" />
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>,
        document.body
    );
};

export default ReviewPhotos;
