import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Search, MapPin, Star, Plus, ExternalLink, ChevronDown, Check, Loader2, Home, SearchX,
} from 'lucide-react';
import ReviewNavbar from '../components/ReviewNavbar';
import { fetchProperties, selectProperties, selectPropertiesStatus, selectPropertiesError, selectPropertiesTotal } from '../store/reviewSlice';
import { API_BASE_URL } from '../config/api';
import { serializeJsonLd } from '../utils/jsonLd';
import useSeo from '../hooks/useSeo';
import { SITE_URL } from '../config/site';
import { motion, staggerContainer, fadeUp } from '../animations';

const MotionLink = motion.create(Link);

// Uploaded images are served from the backend root (/uploads/...), not the
// frontend dev server -so prefix relative paths with the backend origin.
const SERVER_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');
const resolveUpload = (p) => (!p ? '' : p.startsWith('http') ? p : `${SERVER_ORIGIN}${p}`);

// Sponsored ads are NOT properties -they stay local (they don't come from the reviews API)
const sponsoredAds = [
  {
    id: 'ad-realtypro',
    isSponsored: true,
    title: 'Find Your Perfect Agent',
    description: 'Connect with top-rated real estate agents in your area. Get expert guidance for your rental',
    sponsor: 'RealtyPro',
    linkText: 'Learn More',
    image: 'https://images.unsplash.com/photo-1560520653-9e0e4c89fd11?q=80&w=600&auto=format&fit=crop',
  },
  {
    id: 'ad-moveeasy',
    isSponsored: true,
    title: 'Stress-Free Moving Services',
    description: 'Professional movers ready to help. Book now and get 20% off your first move!',
    sponsor: 'MoveEasy',
    linkText: 'Get Quote',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=600&auto=format&fit=crop',
  },
];

const TYPES = ['All Types', 'House', 'Apartment', 'Condo'];

const WriteReview = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Initialize searchTerm from URL `?search=` so links from the Hero search
  // (e.g. /write-review?search=Eksha+Regency) pre-fill the input here.
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('search') || '');
  const [selectedType, setSelectedType] = useState('All Types');
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);

  const dispatch = useDispatch();
  const propertiesRaw = useSelector(selectProperties);
  const status = useSelector(selectPropertiesStatus);
  const error = useSelector(selectPropertiesError);
  const propertiesTotal = useSelector(selectPropertiesTotal);

  // A partial/failed response can leave a non-array here -.filter() on it
  // would white-screen the whole page.
  const properties = useMemo(
    () => (Array.isArray(propertiesRaw) ? propertiesRaw : []),
    [propertiesRaw]
  );

  const loading = status === 'loading' || status === 'idle';

  // The server reported more matches than it sent us (page limit). `null` on
  // backends that don't report a total, in which case we say nothing.
  const isTruncated =
    typeof propertiesTotal === 'number' && propertiesTotal > properties.length;

  // Fetch properties from the API on mount.
  // The search and type filters below are CLIENT-side, so we need the full set
  // up front -the backend's default page size would otherwise make anything
  // past the first page unfindable ("no results" for a property that exists).
  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchProperties({ limit: 200 }));
    }
  }, [dispatch, status]);

  // Keep state in sync if URL changes (back/forward navigation)
  useEffect(() => {
    const fromUrl = searchParams.get('search') || '';
    setSearchTerm((prev) => (prev !== fromUrl ? fromUrl : prev));
  }, [searchParams]);

  // Client-side search + type filter
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredProperties = properties.filter((prop) => {
    const matchesSearch =
      !normalizedSearch ||
      (prop.title || '').toLowerCase().includes(normalizedSearch) ||
      (prop.location || '').toLowerCase().includes(normalizedSearch);
    const matchesType = selectedType === 'All Types' || prop.type === selectedType;
    return matchesSearch && matchesType;
  });

  const count = filteredProperties.length;

  // ── Dynamic title/description + canonical ────────────────────────────────
  // Canonical always points at the bare /write-review URL, never at a
  // ?search=/&type= variant: search and type here are client-side filters
  // over the SAME underlying list, not distinct content, so every combination
  // should consolidate its ranking signal onto one URL instead of competing
  // with it as near-duplicate content.
  useSeo({
    title:
      normalizedSearch || selectedType !== 'All Types'
        ? `${[selectedType !== 'All Types' ? selectedType : null, normalizedSearch ? `"${searchTerm.trim()}"` : null].filter(Boolean).join(' matching ') || 'Properties'} | RentReview`
        : 'Browse Rental Property Reviews | RentReview',
    description:
      'Browse verified rental property reviews from real tenants across India. Search apartments, houses and condos by address or city before you sign a lease.',
    path: '/write-review',
  });

  // ── JSON-LD ItemList schema for SEO ─────────────────────────────────────
  const listSchema = useMemo(() => {
    if (loading || filteredProperties.length === 0) return null;
    return {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Rental Properties on RentReview',
      itemListElement: filteredProperties.map((item, index) => {
        const itemUrl = `${SITE_URL}/property/${item._id}`;
        const itemSchema = {
          '@type': 'Apartment',
          '@id': itemUrl,
          name: item.title,
          url: itemUrl,
        };
        if (item.image) itemSchema.image = resolveUpload(item.image);
        if (item.location) {
          itemSchema.address = {
            '@type': 'PostalAddress',
            addressLocality: item.location,
            addressCountry: 'IN',
          };
        }
        if (Number(item.reviewsCount) > 0 && Number(item.rating) > 0) {
          itemSchema.aggregateRating = {
            '@type': 'AggregateRating',
            ratingValue: Number(item.rating).toFixed(1),
            reviewCount: Number(item.reviewsCount),
            bestRating: 5,
            worstRating: 1,
          };
        }
        return {
          '@type': 'ListItem',
          position: index + 1,
          item: itemSchema,
        };
      }),
    };
  }, [loading, filteredProperties]);

  // ── Empty-state branch logic ────────────────────────────────────────────
  // Decides which "no results" message to show:
  //   - 'empty-db'       → no properties exist in the database at all
  //   - 'search-no-match'→ user typed a search term and nothing matched
  //   - 'filter-no-match'→ only the type filter is excluding everything
  //   - 'has-results'    → normal grid render (no empty state)
  const emptyState = (() => {
    if (loading || count > 0) return 'has-results';
    if (properties.length === 0) return 'empty-db';
    if (normalizedSearch) return 'search-no-match';
    return 'filter-no-match';
  })();

  // URL for "Add Review for X" -pre-fills search so AddReview can use it.
  const addReviewUrl = normalizedSearch
    ? `/add-review?search=${encodeURIComponent(searchTerm.trim())}`
    : '/add-review';

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col font-sans">
      <ReviewNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8">

        {/* Page heading */}
        <header className="mb-5 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-800">
            Browse Rental Properties
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Honest reviews from verified renters across India
          </p>
        </header>

        {/* Search & Filter -semantic search form */}
        <form
          role="search"
          aria-label="Search and filter properties"
          onSubmit={(e) => e.preventDefault()}
          className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-5 sm:mb-6"
        >
          <label htmlFor="property-search" className="sr-only">
            Search properties by address, city, or state
          </label>
          <div className="relative flex-1">
            <Search
              aria-hidden="true"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
            />
            <input
              id="property-search"
              type="search"
              placeholder="Search by address, city, or state..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoComplete="off"
              className="w-full bg-white border border-slate-200 rounded-xl py-2.5 sm:py-3 pl-11 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3EB489] focus:border-transparent transition-all shadow-sm"
            />
          </div>

          {/* Type filter -custom listbox */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setTypeDropdownOpen(!typeDropdownOpen)}
              aria-haspopup="listbox"
              aria-expanded={typeDropdownOpen}
              aria-label={`Filter by property type, currently ${selectedType}`}
              className="flex items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl px-4 py-2.5 sm:px-5 sm:py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#3EB489] transition-all shadow-sm w-full sm:w-auto sm:min-w-[150px] cursor-pointer"
            >
              <span>{selectedType}</span>
              <ChevronDown
                aria-hidden="true"
                className={`w-4 h-4 text-slate-400 transition-transform ${typeDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {typeDropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setTypeDropdownOpen(false)} />
                <ul
                  role="listbox"
                  aria-label="Property type options"
                  className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-xl shadow-lg py-1.5 z-20"
                >
                  {TYPES.map((type) => (
                    <li key={type}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={selectedType === type}
                        onClick={() => { setSelectedType(type); setTypeDropdownOpen(false); }}
                        className="flex items-center justify-between w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-[#3EB489] transition-colors cursor-pointer"
                      >
                        <span>{type}</span>
                        {selectedType === type && <Check className="w-4 h-4 text-[#3EB489]" aria-hidden="true" />}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </form>

        {/* Count + live region for screen readers */}
        <p
          className="text-sm font-semibold text-slate-500 mb-4 sm:mb-6"
          aria-live="polite"
        >
          {loading
            ? 'Loading properties…'
            : normalizedSearch
              ? `${count} ${count === 1 ? 'result' : 'results'} for "${searchTerm.trim()}"`
              : `${count} ${count === 1 ? 'property' : 'properties'} found in your area`}
        </p>

        {/* The search/type filters above are client-side, so they only ever see
            the page we fetched. If the server has more than we hold, say so —
            otherwise a property past the limit just looks like "no results". */}
        {!loading && isTruncated && (
          <p className="-mt-3 mb-4 sm:mb-6 text-xs text-slate-400">
            Showing {properties.length} of {propertiesTotal} properties.
          </p>
        )}

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="mb-5 sm:mb-6 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <span aria-hidden="true" className="mt-0.5 shrink-0">⚠</span>
            <span>{error}</span>
          </div>
        )}

        {/* Property grid -semantic list. The <motion.ul> renders the same <ul>;
            it only puts the tiles on one shared arrival timeline. `key` on the
            result count restarts that timeline when a search changes the set,
            so filtered results animate in rather than snapping. */}
        <motion.ul
          key={`grid-${normalizedSearch}-${filteredProperties.length}`}
          aria-label="Property listings"
          initial="hidden"
          animate="show"
          variants={staggerContainer(0.06)}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 list-none"
        >
          {/* Add Review card -CTA tile, always first */}
          <motion.li variants={fadeUp}>
            <MotionLink
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              to={addReviewUrl}
              aria-label={normalizedSearch
                ? `Add a review for ${searchTerm.trim()}`
                : 'Add a new property review'}
              className="relative group cursor-pointer aspect-[4/3] rounded-2xl border-2 border-dashed border-[#3EB489]/60 hover:border-[#3EB489] bg-[#E8F8F2]/30 hover:bg-[#E8F8F2]/60 transition-all flex flex-col items-center justify-center gap-3 sm:gap-4 p-5 sm:p-6"
            >
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 border-[#3EB489] flex items-center justify-center text-[#3EB489] group-hover:scale-105 transition-transform">
                <Plus className="w-6 h-6 sm:w-8 sm:h-8" aria-hidden="true" />
              </div>
              <span className="text-base sm:text-lg font-bold text-[#3EB489] tracking-tight">Add Review</span>
            </MotionLink>
          </motion.li>

          {/* Loading skeletons */}
          {loading && [1, 2].map((n) => (
            <motion.li variants={fadeUp} key={`skeleton-${n}`}>
              <div
                aria-hidden="true"
                className="aspect-[4/3] rounded-2xl border border-slate-100 bg-white shadow-sm flex items-center justify-center"
              >
                <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
              </div>
            </motion.li>
          ))}

          {/* Properties from the API */}
          {!loading && filteredProperties.map((item) => (
            <motion.li variants={fadeUp} key={item._id}>
              <MotionLink
                to={`/property/${item._id}`}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col h-full bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden group hover:shadow-md transition-shadow"
              >
                {/* Image with fallback */}
                <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-slate-100">
                  {item.image ? (
                    <img
                      src={resolveUpload(item.image)}
                      alt={`${item.title} -${item.type || 'property'} in ${item.location || 'India'}`}
                      width="600"
                      height="400"
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div
                      aria-hidden="true"
                      className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400"
                    >
                      <Home className="w-10 h-10" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm text-slate-800 text-xs font-bold px-2.5 py-1 sm:px-3 rounded-lg shadow-sm border border-slate-100">
                    {item.type}
                  </div>
                </div>

                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h2 className="font-bold text-slate-800 text-base sm:text-lg leading-tight group-hover:text-[#3EB489] transition-colors">
                        {item.title}
                      </h2>
                      <div
                        role="img"
                        aria-label={`Rated ${Number(item.rating || 0).toFixed(1)} out of 5 stars`}
                        className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg shrink-0"
                      >
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" aria-hidden="true" />
                        <span className="text-xs font-bold text-slate-700">{Number(item.rating || 0).toFixed(1)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-slate-400 mb-3 sm:mb-4">
                      <MapPin className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span className="text-xs font-medium truncate">{item.location}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <span className="text-xs font-semibold text-slate-400">{item.reviewsCount} reviews</span>
                    {item.price != null && (
                      <span className="text-sm font-bold text-slate-800">${item.price}/mo</span>
                    )}
                  </div>
                </div>
              </MotionLink>
            </motion.li>
          ))}

          {/* Empty states -three branches */}
          {emptyState === 'empty-db' && (
            <motion.li variants={fadeUp} className="col-span-1 sm:col-span-2 lg:col-span-3">
              <div className="flex flex-col items-center justify-center text-center bg-white border border-dashed border-slate-200 rounded-2xl p-8 sm:p-12 gap-3 sm:gap-4">
                <div aria-hidden="true" className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#3EB489]/10 flex items-center justify-center">
                  <Home className="w-7 h-7 sm:w-8 sm:h-8 text-[#3EB489]" />
                </div>
                <h2 className="text-base sm:text-lg font-bold text-slate-700">No properties yet</h2>
                <p className="text-sm text-slate-500 max-w-md">
                  Be the first to add a review and help fellow renters find honest information about rental properties.
                </p>
                <Link
                  to="/add-review"
                  className="mt-2 inline-flex items-center gap-2 bg-[#3EB489] hover:bg-[#35a37b] text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  Write the First Review
                </Link>
              </div>
            </motion.li>
          )}

          {emptyState === 'search-no-match' && (
            <motion.li variants={fadeUp} className="col-span-1 sm:col-span-2 lg:col-span-3">
              <div className="flex flex-col items-center justify-center text-center bg-white border border-dashed border-slate-200 rounded-2xl p-8 sm:p-12 gap-3 sm:gap-4">
                <div aria-hidden="true" className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-50 flex items-center justify-center">
                  <SearchX className="w-7 h-7 sm:w-8 sm:h-8 text-amber-500" />
                </div>
                <h2 className="text-base sm:text-lg font-bold text-slate-700">
                  Couldn't find "{searchTerm.trim()}"
                </h2>
                <p className="text-sm text-slate-500 max-w-md">
                  This property isn't in our directory yet. Want to be the first to review it and help future renters?
                </p>
                <div className="mt-2 flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                  <Link
                    to={addReviewUrl}
                    className="inline-flex items-center justify-center gap-2 bg-[#3EB489] hover:bg-[#35a37b] text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors shadow-sm"
                  >
                    <Plus className="w-4 h-4" aria-hidden="true" />
                    Add Review for "{searchTerm.trim()}"
                  </Link>
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="inline-flex items-center justify-center gap-2 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
                  >
                    Clear Search
                  </button>
                </div>
              </div>
            </motion.li>
          )}

          {emptyState === 'filter-no-match' && (
            <motion.li variants={fadeUp} className="col-span-1 sm:col-span-2 lg:col-span-3">
              <div className="flex flex-col items-center justify-center text-center bg-white border border-dashed border-slate-200 rounded-2xl p-8 sm:p-12 gap-3 sm:gap-4">
                <div aria-hidden="true" className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <SearchX className="w-7 h-7 sm:w-8 sm:h-8 text-slate-500" />
                </div>
                <h2 className="text-base sm:text-lg font-bold text-slate-700">
                  No {selectedType.toLowerCase()} properties found
                </h2>
                <p className="text-sm text-slate-500 max-w-md">
                  Try changing the filter or selecting "All Types".
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedType('All Types')}
                  className="mt-2 inline-flex items-center justify-center gap-2 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
                >
                  Show All Types
                </button>
              </div>
            </motion.li>
          )}

          {/* Sponsored ads (local, always visible -even on empty states) */}
          {!loading && sponsoredAds.map((item) => (
            <motion.li variants={fadeUp} key={item.id}>
              <motion.article
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col h-full bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden group hover:shadow-md transition-shadow"
              >
                <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-slate-100">
                  <img
                    src={item.image}
                    alt={item.title}
                    width="600"
                    height="400"
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 bg-[#3EB489] text-white text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-md shadow-sm">
                    Sponsored
                  </div>
                </div>
                <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between bg-[#E8F8F2]/25">
                  <div>
                    <h2 className="font-bold text-slate-800 text-base sm:text-lg leading-tight mb-2 group-hover:text-[#3EB489] transition-colors">
                      {item.title}
                    </h2>
                    <p className="text-xs text-slate-500 leading-relaxed mb-4">{item.description}</p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-emerald-500/10">
                    <span className="text-xs font-semibold text-slate-400">by {item.sponsor}</span>
                    <button
                      type="button"
                      aria-label={`${item.linkText} -sponsored by ${item.sponsor}`}
                      className="flex items-center gap-1.5 bg-[#3EB489] hover:bg-[#35a37b] text-white text-xs font-bold px-3.5 py-2 rounded-lg transition-colors shadow-sm cursor-pointer"
                    >
                      {item.linkText}
                      <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </motion.article>
            </motion.li>
          ))}
        </motion.ul>

        {/* JSON-LD structured data -helps Google understand this is a property directory */}
        {listSchema && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: serializeJsonLd(listSchema) }}
          />
        )}
      </main>

      <footer className="bg-white border-t border-slate-100 py-5 sm:py-6 text-center text-xs text-slate-500 mt-8 sm:mt-12 shrink-0 px-4">
        <p>© {new Date().getFullYear()} RentReview. Helping renters make informed decisions.</p>
        <p className="mt-1 text-slate-400">
          Always verify property details before signing a lease - important legal protection
        </p>
      </footer>
    </div>
  );
};

export default WriteReview;