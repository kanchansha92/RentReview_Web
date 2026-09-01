import React, { useState, useEffect, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, MapPin, Home, DollarSign, Star, ThumbsUp,
    Loader2, AlertCircle,
} from 'lucide-react';
import ReviewNavbar from '../components/ReviewNavbar';
import { getProperty } from '../services/reviewService';
import { API_BASE_URL } from '../config/api';
import { serializeJsonLd } from '../utils/jsonLd';
import useSeo from '../hooks/useSeo';
import { SITE_URL } from '../config/site';
import { Stagger, StaggerItem, motion, fadeUp, EASE } from '../animations';

// Uploaded files are served from the server root (/uploads/...), not /api
const SERVER_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');
const resolveUpload = (p) => (!p ? '' : p.startsWith('http') ? p : `${SERVER_ORIGIN}${p}`);

const formatMonthYear = (d) => {
    try {
        return new Date(d).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } catch { return ''; }
};

// Inline star row (filled up to `value`) -decorative; accessible label provided by parent
const StarRow = ({ value, size = 12 }) => (
    <div className="flex items-center gap-0.5" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((s) => (
            <Star
                key={s}
                size={size}
                className={s <= Math.round(value) ? 'fill-[#FDC700] text-[#FDC700]' : 'fill-transparent text-[#D1D5DC]'}
            />
        ))}
    </div>
);

const PropertyDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [property, setProperty] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError('');
        getProperty(id)
            .then((data) => {
                if (!active) return;
                // A malformed/partial payload must not reach the render -every
                // branch below does reviews.filter/.map and property.title.
                setProperty(data?.property || null);
                setReviews(Array.isArray(data?.reviews) ? data.reviews : []);
            })
            .catch((err) => { if (active) setError(err.message); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [id]);

    // ── Dynamic page title + meta description + canonical + OG image ────────
    const cityState = property ? [property.city, property.state].filter(Boolean).join(', ') : '';
    useSeo({
        title: property
            ? `${property.title} Reviews${cityState ? ` -${cityState}` : ''} | RentReview`
            : undefined,
        description: property
            ? (reviews.length > 0
                ? `Read ${reviews.length} honest review${reviews.length === 1 ? '' : 's'} of ${property.title}${cityState ? ` in ${cityState}` : ''}. Average ${Number(property.rating || 0).toFixed(1)}/5 stars from verified tenants.`
                : `Be the first to review ${property.title}${cityState ? ` in ${cityState}` : ''} on RentReview. Help fellow renters make informed decisions.`)
            : undefined,
        path: property ? `/property/${property._id}` : undefined,
        image: property?.image ? resolveUpload(property.image) : undefined,
        type: 'product',
    });

  
    const storedCount = Number(property?.reviewsCount ?? 0);
    const truncated = storedCount > reviews.length;

    // Build the 5→1 star distribution from the reviews actually loaded.
    const total = reviews.length;
    const distribution = [5, 4, 3, 2, 1].map((star) => ({
        star,
        count: reviews.filter((r) => Math.round(r.rating) === star).length,
    }));

    // ── JSON-LD: Apartment + AggregateRating + Review schemas ────────────────
    // This is what triggers gold-star ratings in Google search results.
    const propertySchema = useMemo(() => {
        if (!property) return null;
        const itemUrl = `${SITE_URL}/property/${property._id}`;
        const schema = {
            '@context': 'https://schema.org',
            '@type': 'Apartment',
            '@id': itemUrl,
            name: property.title,
            url: itemUrl,
        };
        if (property.image) schema.image = resolveUpload(property.image);

        const address = { '@type': 'PostalAddress', addressCountry: 'IN' };
        if (property.streetAddress) address.streetAddress = property.streetAddress;
        if (property.city) address.addressLocality = property.city;
        if (property.state) address.addressRegion = property.state;
        if (property.zipCode) address.postalCode = property.zipCode;
        schema.address = address;

        if (property.coords?.lat != null && property.coords?.lng != null) {
            schema.geo = {
                '@type': 'GeoCoordinates',
                latitude: property.coords.lat,
                longitude: property.coords.lng,
            };
        }

        if (reviews.length > 0) {
            // Prefer the STORED aggregates. Computing these from the loaded page
            // meant that past one page the structured data disagreed with the
            // rating shown directly above it -and told Google the wrong number.
            const storedRating = Number(property.reviewsCount) > 0 ? Number(property.rating) : null;
            const pageAvg = reviews.reduce((s, r) => s + Number(r.rating || 0), 0) / reviews.length;
            schema.aggregateRating = {
                '@type': 'AggregateRating',
                ratingValue: (storedRating != null && Number.isFinite(storedRating)
                    ? storedRating
                    : pageAvg
                ).toFixed(1),
                reviewCount: Number(property.reviewsCount) || reviews.length,
                bestRating: 5,
                worstRating: 1,
            };

            schema.review = reviews.map((r) => {
                const review = {
                    '@type': 'Review',
                    author: {
                        '@type': 'Person',
                        name: r.reviewerName || 'Anonymous',
                    },
                    reviewRating: {
                        '@type': 'Rating',
                        ratingValue: Number(r.rating),
                        bestRating: 5,
                        worstRating: 1,
                    },
                };
                if (r.body) review.reviewBody = r.body;
                if (r.title) review.name = r.title;
                if (r.createdAt) {
                    try { review.datePublished = new Date(r.createdAt).toISOString(); } catch { }
                }
                return review;
            });
        }

        return schema;
    }, [property, reviews]);

    const breadcrumbSchema = useMemo(() => {
        if (!property) return null;
        return {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
                { '@type': 'ListItem', position: 2, name: 'Properties', item: `${SITE_URL}/write-review` },
                { '@type': 'ListItem', position: 3, name: property.title, item: `${SITE_URL}/property/${property._id}` },
            ],
        };
    }, [property]);

    return (
        <div className="flex min-h-screen flex-col bg-[#F9FAFB] font-sans">
            <ReviewNavbar />

            <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">

                {/* Breadcrumb navigation */}
                {property && (
                    <nav aria-label="Breadcrumb" className="mb-3 sm:mb-4">
                        <ol className="flex flex-wrap items-center gap-1.5 text-xs sm:text-sm text-slate-500 list-none">
                            <li>
                                <Link to="/" className="hover:text-[#41B985] transition-colors">Home</Link>
                            </li>
                            <li aria-hidden="true" className="text-slate-300">/</li>
                            <li>
                                <Link to="/write-review" className="hover:text-[#41B985] transition-colors">Properties</Link>
                            </li>
                            <li aria-hidden="true" className="text-slate-300">/</li>
                            <li>
                                <span className="text-slate-700 font-medium truncate max-w-[180px] sm:max-w-none inline-block align-bottom">
                                    {property.title}
                                </span>
                            </li>
                        </ol>
                    </nav>
                )}

                {/* Back to listings */}
                <button
                    type="button"
                    onClick={() => navigate('/write-review')}
                    className="mb-4 sm:mb-6 flex items-center gap-2 text-sm font-medium text-[#0A0A0A] transition-colors hover:text-[#41B985] cursor-pointer"
                >
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to listings
                </button>

                {/* Loading */}
                {loading && (
                    <div
                        role="status"
                        aria-live="polite"
                        className="flex items-center justify-center gap-2 py-24 text-sm text-slate-500"
                    >
                        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> Loading property…
                    </div>
                )}

                {/* Error / not found */}
                {!loading && (error || !property) && (
                    <div
                        role="alert"
                        className="flex flex-col items-center justify-center gap-3 py-16 sm:py-24 text-center"
                    >
                        <AlertCircle className="h-10 w-10 text-red-500" aria-hidden="true" />
                        <p className="text-base font-semibold text-slate-800">{error || 'Property not found'}</p>
                        <button
                            type="button"
                            onClick={() => navigate('/write-review')}
                            className="mt-2 rounded-lg bg-[#41B985] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#36a374] cursor-pointer"
                        >
                            Back to listings
                        </button>
                    </div>
                )}

                {!loading && property && (
                    <article>
                        {/* Accent bar */}
                        <div className="mb-3 flex items-center gap-2">
                            <div aria-hidden="true" className="h-1 w-8 rounded-full bg-[#41B985]" />
                            <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.15em] text-[#41B985] uppercase">
                                Property Details
                            </span>
                        </div>

                        {/* ── Hero: image (left) + info (right) on lg+ ─────────────── */}
                        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
                            {/* Image -slides in from the left, info from the right,
                                so the two halves visibly belong to one card. */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.45, ease: EASE }}
                                className="relative h-56 sm:h-64 lg:h-auto lg:min-h-[400px] w-full overflow-hidden rounded-2xl bg-slate-100 shadow-sm"
                            >
                                {property.image ? (
                                    <img
                                        src={resolveUpload(property.image)}
                                        alt={`${property.title} -${property.type || 'property'} in ${property.city || 'India'}`}
                                        width="800"
                                        height="600"
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div
                                        aria-hidden="true"
                                        className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400"
                                    >
                                        <Home className="h-14 w-14" />
                                    </div>
                                )}
                            </motion.div>

                            {/* Info column */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.45, ease: EASE, delay: 0.08 }}
                                className="flex flex-col gap-4"
                            >
                                {/* Title + location */}
                                <header>
                                    <h1 className="text-2xl sm:text-3xl font-bold leading-tight tracking-tight text-[#0A0A0A]">
                                        {property.title}
                                    </h1>
                                    <address className="not-italic mt-2 flex items-start gap-2 text-sm sm:text-base text-[#4A5565]">
                                        <MapPin className="h-4 w-4 sm:h-5 sm:w-5 mt-0.5 shrink-0 text-[#41B985]" aria-hidden="true" />
                                        <span>
                                            {[property.streetAddress, property.city, property.state, property.zipCode]
                                                .filter(Boolean)
                                                .join(', ') || property.location}
                                        </span>
                                    </address>
                                </header>

                                {/* Type | Monthly Rent card */}
                                <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
                                    <dl className="grid grid-cols-2 gap-4">
                                        <div className="flex items-center gap-3">
                                            <div aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#41B985]/10">
                                                <Home className="h-4 w-4 text-[#41B985]" />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <dt className="text-xs text-[#6A7282]">Type</dt>
                                                <dd className="text-sm sm:text-base font-semibold text-[#0A0A0A] truncate">
                                                    {property.type}
                                                </dd>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#41B985]/10">
                                                <DollarSign className="h-4 w-4 text-[#41B985]" />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <dt className="text-xs text-[#6A7282]">Monthly Rent</dt>
                                                <dd className="text-sm sm:text-base font-semibold text-[#0A0A0A] truncate">
                                                    {property.price != null ? `$${Number(property.price).toLocaleString()}` : '—'}
                                                </dd>
                                            </div>
                                        </div>
                                    </dl>
                                </div>

                                {/* Rating breakdown card */}
                                <div className="flex flex-col gap-3 rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
                                    {/* Average */}
                                    <div
                                        className="flex items-baseline gap-2"
                                        role="img"
                                        aria-label={`Average rating: ${Number(property.rating || 0).toFixed(1)} out of 5 stars from ${property.reviewsCount} ${property.reviewsCount === 1 ? 'review' : 'reviews'}`}
                                    >
                                        <Star className="h-5 w-5 sm:h-6 sm:w-6 fill-[#FDC700] text-[#FDC700] self-center" aria-hidden="true" />
                                        <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0A0A0A]">
                                            {Number(property.rating || 0).toFixed(1)}
                                        </span>
                                        <span className="text-sm text-[#4A5565]">
                                            ({property.reviewsCount} {property.reviewsCount === 1 ? 'review' : 'reviews'})
                                        </span>
                                    </div>

                                    {/* Bars */}
                                    <ul className="flex flex-col gap-1 list-none">
                                        {distribution.map(({ star, count }) => {
                                            const pct = total ? (count / total) * 100 : 0;
                                            return (
                                                <li key={star} className="flex items-center gap-2">
                                                    <span className="w-[44px] sm:w-[48px] shrink-0 text-xs text-[#0A0A0A]">
                                                        {star} star
                                                    </span>
                                                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#E5E7EB]" aria-hidden="true">
                                                        <div
                                                            className="h-full rounded-full bg-[#FDC700] transition-all duration-500"
                                                            style={{ width: `${pct}%` }}
                                                        />
                                                    </div>
                                                    <span
                                                        className="w-6 shrink-0 text-right text-xs text-[#4A5565]"
                                                        aria-label={`${count} ${count === 1 ? 'review' : 'reviews'}`}
                                                    >
                                                        {count}
                                                    </span>
                                                </li>
                                            );
                                        })}
                                    </ul>

                                    {/* CTA */}
                                    <button
                                        type="button"
                                        onClick={() => navigate('/add-review', { state: { property } })}
                                        className="mt-1 flex h-10 w-full items-center justify-center rounded-lg bg-[#41B985] text-sm font-semibold text-white shadow-md shadow-emerald-100 transition-all hover:bg-[#36a374] hover:shadow-lg cursor-pointer"
                                    >
                                        Review This Property
                                    </button>
                                </div>
                            </motion.div>
                        </div>

                        {/* ── Reviews ───────────────────────────────────────────── */}
                        <section
                            aria-labelledby="reviews-heading"
                            className="mt-6 sm:mt-8 flex flex-col gap-3 sm:gap-4"
                        >
                            <h2 id="reviews-heading" className="text-xl sm:text-2xl font-bold tracking-tight text-[#0A0A0A]">
                                Reviews
                                {reviews.length > 0 && (
                                    <span className="ml-2 text-sm sm:text-base font-medium text-slate-500">
                                        ({storedCount || reviews.length})
                                    </span>
                                )}
                            </h2>

                            {reviews.length === 0 ? (
                                <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-black/10 bg-white p-8 sm:p-10 text-center">
                                    <p className="text-base font-bold text-slate-700">No reviews yet</p>
                                    <p className="text-sm text-slate-500">
                                        Be the first to share your experience with this property.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => navigate('/add-review', { state: { property } })}
                                        className="mt-2 rounded-lg bg-[#41B985] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#36a374] transition-colors cursor-pointer"
                                    >
                                        Write the First Review
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {/* Reviews arrive in sequence as they scroll
                                        into view -one shared timeline, so a long
                                        list reads as a feed rather than a dump. */}
                                    <Stagger as="ul" stagger={0.07} amount={0.05} className="flex flex-col gap-3 sm:gap-4 list-none">
                                        {reviews.map((r) => (
                                            <StaggerItem as="li" variants={fadeUp} key={r._id}>
                                                <ReviewCard review={r} />
                                            </StaggerItem>
                                        ))}
                                    </Stagger>
                                    {/* One page of reviews is all this endpoint returns.
                                        Say so, rather than letting the list look complete. */}
                                    {truncated && (
                                        <p className="pt-1 text-center text-xs text-slate-400">
                                            Showing the {reviews.length} most recent of {storedCount} reviews.
                                        </p>
                                    )}
                                </>
                            )}
                        </section>

                        {/* ── JSON-LD structured data ───────────────────────────── */}
                        {propertySchema && (
                            <script
                                type="application/ld+json"
                                dangerouslySetInnerHTML={{ __html: serializeJsonLd(propertySchema) }}
                            />
                        )}
                        {breadcrumbSchema && (
                            <script
                                type="application/ld+json"
                                dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbSchema) }}
                            />
                        )}
                    </article>
                )}
            </main>

            {/* Footer */}
            <footer className="shrink-0 border-t border-black/10 bg-white py-4 sm:py-5 text-center">
                <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
                    <p className="text-xs sm:text-sm text-[#4A5565]">
                        © {new Date().getFullYear()} RentReview. Helping renters make informed decisions.
                    </p>
                    <p className="mt-1 text-[10px] sm:text-xs text-[#4A5565]">
                        All reviews are from community members. Always verify property details before signing a lease.
                    </p>
                </div>
            </footer>
        </div>
    );
};

// ─── Single review card ───────────────────────────────────────────────────
const ReviewCard = ({ review }) => {
    const [helpful, setHelpful] = useState(review.helpful || 0);
    const [voted, setVoted] = useState(false);

    const vote = () => {
        if (voted) return;
        setHelpful((n) => n + 1);
        setVoted(true);
    };

    const isoDate = (() => {
        try { return new Date(review.createdAt).toISOString(); } catch { return ''; }
    })();

    return (
        <article className="rounded-2xl border border-black/10 bg-white p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
            {/* Top row: identity + stars */}
            <div className="flex items-start justify-between gap-3 sm:gap-4">
                <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <cite className="text-sm font-semibold text-[#0A0A0A] not-italic truncate">
                            {review.reviewerName}
                        </cite>
                        <span className="rounded-md bg-[#41B985]/10 px-2 py-0.5 text-[10px] sm:text-xs font-semibold text-[#008236] whitespace-nowrap">
                            ✓ Verified Tenant
                        </span>
                    </div>
                    {review.createdAt && (
                        <time dateTime={isoDate} className="text-xs text-[#6A7282]">
                            {formatMonthYear(review.createdAt)}
                        </time>
                    )}
                </div>
                <div
                    role="img"
                    aria-label={`Rated ${review.rating} out of 5 stars`}
                    className="shrink-0"
                >
                    <StarRow value={review.rating} size={14} />
                </div>
            </div>

            {/* Title + body */}
            {review.title && (
                <h3 className="mt-3 sm:mt-4 text-sm sm:text-base font-semibold text-[#0A0A0A]">
                    {review.title}
                </h3>
            )}
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[#364153]">
                {review.body}
            </p>

            {/* Pros */}
            {review.pros?.length > 0 && (
                <div className="mt-4">
                    <p className="text-xs font-semibold text-[#008236]">Pros:</p>
                    <ul className="mt-1 flex flex-col gap-0.5 list-none">
                        {review.pros.map((p, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-xs sm:text-sm text-[#4A5565]">
                                <span aria-hidden="true" className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#008236]" />
                                {p}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Cons */}
            {review.cons?.length > 0 && (
                <div className="mt-3">
                    <p className="text-xs font-semibold text-[#C10007]">Cons:</p>
                    <ul className="mt-1 flex flex-col gap-0.5 list-none">
                        {review.cons.map((c, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-xs sm:text-sm text-[#4A5565]">
                                <span aria-hidden="true" className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#C10007]" />
                                {c}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Photos */}
            {review.photos?.length > 0 && (
                <ul className="mt-4 flex flex-wrap gap-2 list-none" aria-label="Review photos">
                    {review.photos.map((src, i) => (
                        <li key={i}>
                            <img
                                src={resolveUpload(src)}
                                alt={`${review.title || 'Review'} photo ${i + 1}`}
                                width="80"
                                height="80"
                                loading="lazy"
                                className="h-16 w-16 sm:h-20 sm:w-20 rounded-lg border border-black/10 object-cover hover:scale-105 transition-transform cursor-pointer"
                            />
                        </li>
                    ))}
                </ul>
            )}

            {/* Helpful */}
            <div className="mt-4 border-t border-black/10 pt-3">
                <button
                    type="button"
                    onClick={vote}
                    disabled={voted}
                    aria-label={`Mark this review as helpful. Currently ${helpful} ${helpful === 1 ? 'person finds' : 'people find'} it helpful.`}
                    aria-pressed={voted}
                    className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${voted
                        ? 'text-[#41B985] bg-[#41B985]/5 cursor-default'
                        : 'text-[#4A5565] hover:bg-slate-50'
                        }`}
                >
                    <ThumbsUp className="h-4 w-4" aria-hidden="true" /> Helpful ({helpful})
                </button>
            </div>
        </article>
    );
};

export default PropertyDetail;