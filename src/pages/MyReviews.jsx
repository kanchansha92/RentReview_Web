import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Footer from '../components/Footer';
import { getCurrentUser } from '../services/authService';
import { deleteReview } from '../services/reviewService';
import {
  fetchMyReviews,
  removeMyReview,
  selectMyReviews,
  selectMyReviewsStatus,
  selectMyReviewsError,
} from '../store/reviewSlice';
import {
  Star,
  MapPin,
  MessageSquare,
  Trash2,
  ChevronRight,
  Home,
  ArrowLeft,
  Layers,
  Sparkles,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import ReviewNavbar from '../components/ReviewNavbar';
import useSeo from '../hooks/useSeo';

const MyReviews = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const myReviews = useSelector(selectMyReviews);
  const loadingStatus = useSelector(selectMyReviewsStatus);
  const loadError = useSelector(selectMyReviewsError);

  // The slice can hold a non-array while a fetch is in flight or after a
  // malformed response -never call .map()/.reduce() on it unguarded.
  const reviews = Array.isArray(myReviews) ? myReviews : [];

  // Private dashboard page -noindex.
  useSeo({
    title: 'My Reviews | RentReview',
    description: 'Manage and review all your rental property reviews on RentReview.',
    noindex: true,
  });

  // Auth gate -depends only on `navigate` so it runs once per mount and is
  // not re-run every time the fetch status transitions idle → loading → done.
  useEffect(() => {
    if (!getCurrentUser()) {
      navigate('/signin');
    }
  }, [navigate]);

  // Kick off the initial fetch. Gated on 'idle' so it fires exactly once;
  // the Retry button below dispatches the thunk directly instead.
  useEffect(() => {
    if (!getCurrentUser()) return;
    if (loadingStatus === 'idle') {
      dispatch(fetchMyReviews());
    }
  }, [dispatch, loadingStatus]);

  const handleRetry = () => {
    dispatch(fetchMyReviews());
  };

  const handleDeleteReview = async (id) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      try {
        await deleteReview(id);
        dispatch(removeMyReview(id));
      } catch (error) {
        alert('Failed to delete review: ' + error.message);
      }
    }
  };

  if (loadingStatus === 'loading' || loadingStatus === 'idle') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center" role="status" aria-live="polite">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-t-4 border-b-4 border-[#3EB489]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="text-[#3EB489] w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
          </div>
        </div>
        <span className="sr-only">Loading your reviews…</span>
      </div>
    );
  }

  // A failed fetch must NOT fall through to the "Clean Slate" empty state —
  // that tells the user their reviews are gone. Show the error + a retry.
  if (loadingStatus === 'failed') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] font-sans flex flex-col">
        <ReviewNavbar />
        <main className="flex-1 flex items-center justify-center px-4 py-16 sm:py-24">
          <div
            role="alert"
            className="max-w-md w-full bg-white p-8 sm:p-10 rounded-3xl sm:rounded-[40px] border border-white shadow-xl shadow-slate-200/40 flex flex-col items-center text-center"
          >
            <div
              aria-hidden="true"
              className="w-16 h-16 sm:w-20 sm:h-20 bg-rose-50 rounded-2xl sm:rounded-3xl flex items-center justify-center mb-6"
            >
              <AlertTriangle className="text-rose-400 w-8 h-8 sm:w-10 sm:h-10" />
            </div>
            {/* This branch renders instead of the normal page body (never
                alongside it), so it's the only heading on screen -h1, not h2. */}
            <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A] mb-2 sm:mb-3 tracking-tight">
              Couldn't load your reviews.
            </h1>
            <p className="text-sm sm:text-base text-[#64748B] font-bold mb-8 leading-relaxed">
              {loadError || 'Something went wrong while fetching your reviews. Your reviews are safe -this is just a loading problem.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleRetry}
                className="inline-flex items-center justify-center gap-2 px-8 sm:px-10 py-3.5 sm:py-4 bg-[#3EB489] text-white font-black rounded-2xl shadow-xl shadow-emerald-200/50 hover:scale-105 active:scale-95 transition-all text-base cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3EB489] focus-visible:ring-offset-2"
              >
                <RefreshCw size={18} aria-hidden="true" />
                Retry
              </button>
              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="inline-flex items-center justify-center gap-2 px-8 sm:px-10 py-3.5 sm:py-4 bg-white border border-slate-200 text-[#64748B] font-black rounded-2xl hover:text-[#3EB489] hover:border-[#3EB489]/30 transition-all text-base cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3EB489] focus-visible:ring-offset-2"
              >
                <ArrowLeft size={18} aria-hidden="true" />
                Back to Dashboard
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const totalReviews = reviews.length;
  const ratedReviews = reviews.filter((r) => Number.isFinite(Number(r?.rating)));
  const avgRating =
    ratedReviews.length > 0
      ? (ratedReviews.reduce((acc, curr) => acc + Number(curr.rating), 0) / ratedReviews.length).toFixed(1)
      : '0.0';

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-[#3EB489]/20 selection:text-[#3EB489]">
      <ReviewNavbar />

      {/* Hero Background Decor */}
      <div
        aria-hidden="true"
        className="fixed top-0 left-0 w-full h-[300px] sm:h-[400px] lg:h-[500px] bg-gradient-to-b from-[#F0FDF4] to-transparent -z-10 opacity-60 pointer-events-none"
      />

      <main className="pt-8 pb-16 px-4 sm:pt-12 sm:pb-24 sm:px-6 lg:pt-16 lg:pb-32 lg:px-8">
        <div className="max-w-5xl mx-auto">

          {/* Back to Dashboard */}
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="group flex items-center gap-2 mb-6 sm:mb-8 lg:mb-12 px-4 sm:px-5 py-2 sm:py-2.5 bg-white border border-slate-100 rounded-xl sm:rounded-2xl text-[#64748B] font-black uppercase tracking-widest text-[10px] hover:text-[#3EB489] hover:border-[#3EB489]/30 transition-all shadow-sm shadow-slate-200/50 cursor-pointer"
          >
            <ArrowLeft size={14} aria-hidden="true" className="group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </button>

          {/* Page Header & Stats Summary */}
          <header className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16 lg:mb-20 items-end">
            <div className="md:col-span-2 space-y-3 sm:space-y-4">
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-1.5 bg-emerald-50 text-[#3EB489] rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest border border-emerald-100/50">
                <Layers size={12} aria-hidden="true" className="sm:hidden" />
                <Layers size={14} aria-hidden="true" className="hidden sm:block" />
                My History
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-[#0F172A] tracking-tighter leading-tight md:leading-none">
                All Your <span className="text-[#3EB489]">Reviews.</span>
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-[#64748B] font-bold max-w-xl leading-relaxed">
                A complete record of your rental experiences. Your insights help thousands find better homes.
              </p>
            </div>

            <dl className="flex gap-3 sm:gap-4">
              <div className="flex-1 bg-white p-4 sm:p-5 lg:p-6 rounded-2xl sm:rounded-3xl lg:rounded-[32px] border border-white shadow-lg sm:shadow-xl shadow-slate-200/40">
                <dd className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">{totalReviews}</dd>
                <dt className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest mt-0.5 sm:mt-1">Total Posts</dt>
              </div>
              <div className="flex-1 bg-[#3EB489] p-4 sm:p-5 lg:p-6 rounded-2xl sm:rounded-3xl lg:rounded-[32px] border border-[#3EB489] shadow-lg sm:shadow-xl shadow-emerald-200/40">
                <dd className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-1">
                  {avgRating}
                  <Star size={16} fill="white" aria-hidden="true" className="text-white sm:hidden" />
                  <Star size={20} fill="white" aria-hidden="true" className="text-white hidden sm:block" />
                </dd>
                <dt className="text-[10px] font-black text-emerald-100 uppercase tracking-widest mt-0.5 sm:mt-1">Avg Score</dt>
              </div>
            </dl>
          </header>

          {/* Timeline of Reviews */}
          <section aria-label="Your reviews" className="relative space-y-6 sm:space-y-8 lg:space-y-12">
            {/* Timeline Line (desktop only) */}
            {reviews.length > 0 && (
              <div
                aria-hidden="true"
                className="absolute left-0 md:left-1/2 top-0 bottom-0 w-[1px] bg-slate-200 -translate-x-[0.5px] hidden md:block"
              />
            )}

            {reviews.length > 0 ? (
              <ul className="list-none space-y-6 sm:space-y-8 lg:space-y-12">
                {reviews.map((rev, index) => (
                  <li key={rev._id} className="relative group">
                    {/* Timeline Dot (desktop only) */}
                    <div
                      aria-hidden="true"
                      className="absolute left-0 md:left-1/2 top-8 sm:top-10 lg:top-12 w-3 h-3 sm:w-4 sm:h-4 bg-white border-2 border-[#3EB489] rounded-full -translate-x-[6px] sm:-translate-x-[8px] z-10 hidden md:block shadow-sm"
                    />

                    <article
                      className={`flex flex-col md:flex-row items-center gap-6 sm:gap-8 lg:gap-12 ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}
                    >
                      {/* Content Section */}
                      <div className="w-full md:w-1/2">
                        <div className="bg-white p-5 sm:p-6 md:p-8 lg:p-10 rounded-2xl sm:rounded-3xl lg:rounded-[48px] border border-white shadow-lg sm:shadow-2xl shadow-slate-200/40 hover:shadow-[#3EB489]/10 transition-all duration-500 relative overflow-hidden group-hover:-translate-y-1 lg:group-hover:-translate-y-2">
                          {/* Decorative Background Icon */}
                          <MessageSquare
                            aria-hidden="true"
                            className="absolute -right-4 -bottom-4 sm:-right-6 sm:-bottom-6 text-slate-50 opacity-10 group-hover:opacity-20 transition-opacity w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 pointer-events-none"
                          />

                          <div className="relative">
                            <div className="flex justify-between items-start gap-3 mb-4 sm:mb-6 lg:mb-8">
                              <div className="space-y-1 min-w-0 flex-1">
                                <h2 className="text-lg sm:text-xl lg:text-2xl font-black text-[#0F172A] tracking-tight group-hover:text-[#3EB489] transition-colors leading-tight">
                                  {rev.property?.title || 'Property Review'}
                                </h2>
                                <address className="not-italic text-xs sm:text-sm font-bold text-[#64748B] flex items-start gap-1.5 sm:gap-2">
                                  <MapPin size={12} aria-hidden="true" className="text-[#3EB489] mt-0.5 shrink-0 sm:hidden" />
                                  <MapPin size={14} aria-hidden="true" className="text-[#3EB489] mt-0.5 shrink-0 hidden sm:block" />
                                  <span className="truncate">
                                    {[rev.property?.streetAddress, rev.property?.city]
                                      .filter(Boolean)
                                      .join(', ') || 'Unknown Location'}
                                  </span>
                                </address>
                              </div>
                              <div className="flex flex-col items-end shrink-0">
                                <div
                                  role="img"
                                  aria-label={`Rated ${rev.rating} out of 5 stars`}
                                  className="flex gap-0.5 text-yellow-400 mb-1 sm:mb-2"
                                >
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      size={14}
                                      fill={i < rev.rating ? 'currentColor' : 'none'}
                                      aria-hidden="true"
                                      className="sm:hidden"
                                    />
                                  ))}
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={`d-${i}`}
                                      size={16}
                                      fill={i < rev.rating ? 'currentColor' : 'none'}
                                      aria-hidden="true"
                                      className="hidden sm:block"
                                    />
                                  ))}
                                </div>
                                {rev.createdAt && (
                                  <time
                                    dateTime={new Date(rev.createdAt).toISOString()}
                                    className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest whitespace-nowrap"
                                  >
                                    {new Date(rev.createdAt).toLocaleDateString(undefined, {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric',
                                    })}
                                  </time>
                                )}
                              </div>
                            </div>

                            <h3 className="text-base sm:text-lg lg:text-xl font-black text-[#0F172A] mb-2 sm:mb-3 lg:mb-4 leading-tight">
                              {rev.title}
                            </h3>
                            <p className="text-[#475569] font-medium leading-relaxed mb-6 sm:mb-8 lg:mb-10 text-sm sm:text-[15px] whitespace-pre-line">
                              {rev.body}
                            </p>

                            <div className="flex items-center justify-between gap-3 pt-4 sm:pt-6 lg:pt-8 border-t border-slate-50">
                              {rev.property?._id ? (
                                <Link
                                  to={`/property/${rev.property._id}`}
                                  className="flex items-center gap-1.5 sm:gap-2 text-[#0F172A] font-black text-[10px] sm:text-xs uppercase tracking-widest hover:text-[#3EB489] transition-all group/btn min-w-0"
                                >
                                  <span className="truncate">Explore Property</span>
                                  <ChevronRight
                                    size={12}
                                    aria-hidden="true"
                                    className="group-hover/btn:translate-x-1 transition-transform shrink-0 sm:hidden"
                                  />
                                  <ChevronRight
                                    size={14}
                                    aria-hidden="true"
                                    className="group-hover/btn:translate-x-1 transition-transform shrink-0 hidden sm:block"
                                  />
                                </Link>
                              ) : (
                                <span />
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteReview(rev._id)}
                                aria-label={`Delete review of ${rev.property?.title || 'this property'}`}
                                className="p-2.5 sm:p-3 bg-rose-50 text-rose-400 hover:text-rose-600 hover:bg-rose-100 rounded-xl sm:rounded-2xl transition-all shadow-sm shrink-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
                              >
                                <Trash2 size={16} aria-hidden="true" className="sm:hidden" />
                                <Trash2 size={18} aria-hidden="true" className="hidden sm:block" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Visual Section (Image) */}
                      <div className="w-full md:w-1/2">
                        <div className="aspect-[4/3] rounded-2xl sm:rounded-3xl lg:rounded-[48px] overflow-hidden border-4 sm:border-6 lg:border-8 border-white shadow-lg sm:shadow-2xl relative group/img">
                          {rev.property?.image ? (
                            <img
                              src={rev.property.image}
                              alt={`${rev.property.title} in ${rev.property.city || 'unknown city'}`}
                              loading="lazy"
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                          ) : (
                            <div
                              aria-hidden="true"
                              className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-200"
                            >
                              <Home className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20" />
                            </div>
                          )}
                          <div
                            aria-hidden="true"
                            className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity flex flex-col justify-end p-4 sm:p-6 lg:p-8"
                          >
                            <p className="text-white font-black text-sm sm:text-base lg:text-lg tracking-tight">
                              {rev.property?.title}
                            </p>
                            <p className="text-white/80 font-bold text-xs sm:text-sm tracking-wide">
                              {rev.property?.location}
                            </p>
                          </div>
                        </div>
                      </div>
                    </article>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-16 sm:py-24 lg:py-32 flex flex-col items-center text-center px-4 sm:px-6">
                <div
                  aria-hidden="true"
                  className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-white rounded-2xl sm:rounded-3xl lg:rounded-[32px] border border-slate-100 shadow-lg sm:shadow-xl flex items-center justify-center mb-6 sm:mb-8 lg:mb-10"
                >
                  <MessageSquare className="text-slate-200 w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12" />
                </div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#0F172A] mb-2 sm:mb-3 lg:mb-4 tracking-tight">
                  Clean Slate.
                </h2>
                <p className="text-sm sm:text-base lg:text-lg text-[#64748B] font-bold max-w-sm mb-8 sm:mb-10 lg:mb-12 leading-relaxed">
                  You haven't written any reviews yet. Why not share your first rental experience?
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/add-review')}
                  className="px-8 sm:px-10 lg:px-12 py-3.5 sm:py-4 lg:py-5 bg-[#3EB489] text-white font-black rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl shadow-emerald-200/50 hover:scale-105 active:scale-95 transition-all text-base sm:text-lg cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3EB489] focus-visible:ring-offset-2"
                >
                  Write a Review
                </button>
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MyReviews;
