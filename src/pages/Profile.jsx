import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Footer from '../components/Footer';
import { getCurrentUser, logout, getMe, updateUserProfile, resendVerification } from '../services/authService';
import { deleteReview } from '../services/reviewService';
import {
  fetchMyReviews,
  removeMyReview,
  selectMyReviews,
  selectMyReviewsStatus,
  selectMyReviewsError,
} from '../store/reviewSlice';
import { updateUser, logoutSuccess } from '../store/authSlice';
import { clearReviewData } from '../store/reviewSlice';
import {
  User,
  LogOut,
  Star,
  MapPin,
  MessageSquare,
  Heart,
  ShieldCheck,
  Clock,
  Edit3,
  ChevronRight,
  Award,
  Trash2,
  X,
  Home,
  AlertTriangle,
  RefreshCw,
  Settings as SettingsIcon,
} from 'lucide-react';
import ReviewNavbar from '../components/ReviewNavbar';
import { useDialogA11y } from '../components/LoginModal';
import useSeo from '../hooks/useSeo';
import { Stagger, StaggerItem, motion, fadeUp } from '../animations';


const EditProfileDialogA11y = ({ dialogRef }) => {
  useDialogA11y(dialogRef);
  return null;
};

const Profile = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [user, setUser] = useState(getCurrentUser());
  // Email-confirmation prompt state (see the Confirm Your Email card below).
  const [verifySending, setVerifySending] = useState(false);
  const [verifyNotice, setVerifyNotice] = useState('');
  const myReviews = useSelector(selectMyReviews);
  const loadingStatus = useSelector(selectMyReviewsStatus);
  const reviewsError = useSelector(selectMyReviewsError);
  const [loadingUser, setLoadingUser] = useState(true);
  const [activeTab, setActiveTab] = useState('reviews');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  // `currentPassword` is only sent when the address actually changes the
  // server requires it then, and asking for it on a name-only edit would be
  // friction for nothing.
  const [editForm, setEditForm] = useState({ name: '', email: '', currentPassword: '' });
  const [editError, setEditError] = useState('');
  // Set when the server parks an email change pending confirmation, so the
  // modal can say what actually happened rather than "profile updated".
  const [emailPending, setEmailPending] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const nameInputRef = useRef(null);
  const editDialogRef = useRef(null);
  // Bumped on every successful profile save so an in-flight getMe() response
  // that resolves afterwards can't clobber the freshly-saved values.
  const saveVersionRef = useRef(0);

  // The slice may briefly hold a non-array; never .map()/.slice() unguarded.
  const reviews = Array.isArray(myReviews) ? myReviews : [];

  // Private dashboard -noindex.
  useSeo({
    title: user?.name ? `${user.name} | RentReview` : 'My Profile | RentReview',
    description: 'Manage your RentReview profile, view your reviews, and track your activity.',
    noindex: true,
  });


  useEffect(() => {
    let ignore = false;
    const versionAtStart = saveVersionRef.current;

    const initProfile = async () => {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        navigate('/signin');
        return;
      }
      // Render immediately from the cached user, then refresh from the server.
      setUser(currentUser);
      setEditForm({ name: currentUser.name || '', email: currentUser.email || '', currentPassword: '' });

      try {
        const freshUser = await getMe();
        // Bail if we unmounted, or if a profile save landed while we waited.
        if (ignore || saveVersionRef.current !== versionAtStart) return;
        if (freshUser) {
          setUser(freshUser);
          setEditForm({ name: freshUser.name || '', email: freshUser.email || '', currentPassword: '' });
        }
      } catch (error) {
        console.error('Error loading profile data:', error);
      } finally {
        if (!ignore) setLoadingUser(false);
      }
    };

    initProfile();

    return () => {
      ignore = true;
    };
  }, [navigate]);

  // ── Fetch the review list separately, gated on the slice status ─────────
  useEffect(() => {
    if (!getCurrentUser()) return;
    if (loadingStatus === 'idle') {
      dispatch(fetchMyReviews());
    }
  }, [dispatch, loadingStatus]);

  const handleRetryReviews = () => {
    dispatch(fetchMyReviews());
  };


  useEffect(() => {
    if (!isEditModalOpen) return;

    const handleEsc = (e) => {
      if (e.key === 'Escape') setIsEditModalOpen(false);
    };
    document.addEventListener('keydown', handleEsc);

    // Focus the name input when modal opens
    setTimeout(() => nameInputRef.current?.focus(), 50);

    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isEditModalOpen]);

  const handleLogout = async () => {
    // Await it: the cookie is the session, and only the server can clear it.
    await logout();
    dispatch(logoutSuccess());
    dispatch(clearReviewData());
    navigate('/');
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

  const handleResendVerification = async () => {
    setVerifySending(true);
    setVerifyNotice('');
    try {
      const result = await resendVerification();
      setVerifyNotice(result.message || 'Confirmation link sent. Check your inbox.');
      if (result.alreadyVerified) {
        setUser((u) => (u ? { ...u, isVerified: true } : u));
        dispatch(updateUser({ isVerified: true }));
      }
    } catch (error) {
      setVerifyNotice(error.message || "We couldn't send that email. Please try again.");
    } finally {
      setVerifySending(false);
    }
  };

  // Drives both the password prompt in the modal and the payload shape.
  const emailChanging =
    (editForm.email || '').trim().toLowerCase() !== (user?.email || '').toLowerCase();

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setEditError('');

    // Mirror the server's rule so the user finds out before a round trip.
    if (emailChanging && !editForm.currentPassword) {
      setEditError('Enter your current password to change your email address.');
      return;
    }

    setIsUpdating(true);
    try {
      // Only send the password when it is actually needed.
      const payload = emailChanging
        ? { name: editForm.name, email: editForm.email, currentPassword: editForm.currentPassword }
        : { name: editForm.name };

      const result = await updateUserProfile(payload);

      if (result.success) {
        // Invalidate any in-flight getMe() so it can't restore the old values.
        saveVersionRef.current += 1;
        setUser(result.user);
        // Keep Redux (and therefore the navbar) in sync -otherwise the old
        // name stays visible until a hard refresh.
        dispatch(updateUser(result.user));
        setEditForm((prev) => ({ ...prev, currentPassword: '' }));

        if (result.emailChangePending) {
          // The address has NOT changed yet, so keep the modal open and say so.
          // Closing it with "updated!" would be a lie nothing moves until the
          // new inbox confirms it.
          setEmailPending(editForm.email.trim());
          // Put the field back to the address that is still in force. Leaving
          // the typed one there would show a password prompt beside "we've sent
          // you a link", as if the change still needed doing.
          setEditForm((prev) => ({
            ...prev,
            email: result.user?.email || user?.email || '',
            currentPassword: '',
          }));
        } else {
          setIsEditModalOpen(false);
          alert('Profile updated successfully!');
        }
      } else {
        setEditError(result.message || 'Failed to update profile');
      }
    } catch (error) {
      setEditError(error.message || 'Something went wrong. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (loadingUser || loadingStatus === 'loading' || loadingStatus === 'idle' || !user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center" role="status" aria-live="polite">
        <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-t-2 border-b-2 border-[#3EB489]" />
        <span className="sr-only">Loading your profile…</span>
      </div>
    );
  }

  const stats = [
    {
      label: 'Reviews Posted',
      value: loadingStatus === 'failed' ? '—' : reviews.length,
      icon: MessageSquare,
      color: 'bg-emerald-50 text-[#3EB489]',
    },
    {
      label: 'Helpful Votes',
      value: '0',
      icon: Star,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Saved Homes',
      value: '0',
      icon: Heart,
      color: 'bg-rose-50 text-rose-600',
    },
    {
      label: 'Profile Status',
      value: user.isVerified ? 'Verified' : 'Normal',
      icon: ShieldCheck,
      color: 'bg-purple-50 text-purple-600',
    },
  ];

  const tabs = [
    { id: 'reviews', label: 'My Reviews', icon: MessageSquare },
    { id: 'saved', label: 'Saved Places', icon: Heart },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-[#3EB489]/20 selection:text-[#3EB489]">
      <ReviewNavbar />

      <main className="pt-8 pb-12 px-4 sm:pt-16 sm:pb-16 sm:px-6 lg:pt-24 lg:pb-20 lg:px-8">
        <div className="max-w-7xl mx-auto">

          {/* ── Profile Header Card ───────────────────────────────────────── */}
          <header className="relative mb-8 sm:mb-10 lg:mb-12">
            <div
              aria-hidden="true"
              className="absolute top-0 left-0 w-full h-32 sm:h-40 lg:h-48 bg-gradient-to-r from-[#3EB489] to-[#34D399] rounded-3xl sm:rounded-[32px] lg:rounded-[40px] opacity-10"
            />

            <div className="relative pt-6 px-4 sm:pt-10 sm:px-6 lg:pt-12 lg:px-8 flex flex-col md:flex-row items-center md:items-end gap-4 sm:gap-6 lg:gap-8">
              {/* Avatar */}
              <div className="relative group shrink-0">
                <div className="w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 rounded-3xl sm:rounded-[36px] lg:rounded-[48px] bg-white p-1.5 sm:p-2 shadow-xl sm:shadow-2xl overflow-hidden border-2 sm:border-4 border-white">
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=3EB489&color=fff&size=200`}
                    alt={`${user.name}'s avatar`}
                    width="200"
                    height="200"
                    className="w-full h-full object-cover rounded-2xl sm:rounded-3xl lg:rounded-[40px]"
                  />
                </div>
                <div
                  aria-hidden="true"
                  className="absolute -bottom-1.5 -right-1.5 sm:-bottom-2 sm:-right-2 p-2 sm:p-2.5 lg:p-3 bg-white rounded-xl sm:rounded-2xl shadow-lg border border-slate-50 text-[#3EB489]"
                >
                  <Award className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                </div>
              </div>

              {/* Name + meta */}
              <div className="flex-1 text-center md:text-left pb-2 sm:pb-3 lg:pb-4 space-y-1.5 sm:space-y-2 min-w-0">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#0F172A] tracking-tight truncate">
                  {user.name}
                </h1>
                <div className="flex flex-wrap justify-center md:justify-start items-center gap-2 sm:gap-3 lg:gap-4 text-xs sm:text-sm text-[#64748B] font-bold">
                  <span className="flex items-center gap-1.5">
                    <User size={14} aria-hidden="true" />
                    @{user.email.split('@')[0]}
                  </span>
                  {user.createdAt && (
                    <span className="flex items-center gap-1.5">
                      <Clock size={14} aria-hidden="true" />
                      Joined{' '}
                      <time dateTime={new Date(user.createdAt).toISOString()}>
                        {new Date(user.createdAt).toLocaleDateString(undefined, {
                          month: 'long',
                          year: 'numeric',
                        })}
                      </time>
                    </span>
                  )}
                  {user.isVerified && (
                    <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 bg-[#DCFCE7] text-[#166534] text-[10px] sm:text-xs uppercase tracking-widest rounded-full">
                      Verified Renter
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="pb-2 sm:pb-3 lg:pb-4 flex gap-2 sm:gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setEditForm({
                      name: user?.name || '',
                      email: user?.email || '',
                      currentPassword: '',
                    });
                    setEditError('');
                    setEmailPending('');
                    setIsEditModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 lg:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-white border border-[#E2E8F0] font-black text-sm sm:text-base text-[#0F172A] hover:bg-slate-50 transition-all shadow-sm active:scale-95 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3EB489] focus-visible:ring-offset-2"
                >
                  <Edit3 size={16} aria-hidden="true" className="sm:hidden" />
                  <Edit3 size={18} aria-hidden="true" className="hidden sm:block" />
                  Edit Profile
                </button>
                {/* Account settings live on their own page; the dropdown entry
                    is easy to miss from here, so mirror it next to Edit. */}
                <Link
                  to="/settings"
                  className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 lg:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-white border border-[#E2E8F0] font-black text-sm sm:text-base text-[#0F172A] hover:bg-slate-50 transition-all shadow-sm active:scale-95 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3EB489] focus-visible:ring-offset-2"
                >
                  <SettingsIcon size={16} aria-hidden="true" className="sm:hidden" />
                  <SettingsIcon size={18} aria-hidden="true" className="hidden sm:block" />
                  Settings
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  aria-label="Log out"
                  className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 transition-all shadow-sm active:scale-95 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
                >
                  <LogOut size={18} aria-hidden="true" className="sm:hidden" />
                  <LogOut size={22} aria-hidden="true" className="hidden sm:block" />
                </button>
              </div>
            </div>
          </header>

          {/* ── Two-column layout ─────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-10">

            {/* Left column: stats + trust score */}
            <aside aria-label="Profile statistics" className="lg:col-span-4 space-y-6 sm:space-y-7 lg:space-y-8">

              {/* Stats grid */}
              <Stagger as="dl" stagger={0.07} className="grid grid-cols-2 gap-3 sm:gap-4">
                {stats.map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <StaggerItem
                      key={i}
                      variants={fadeUp}
                      whileHover={{ y: -4 }}
                      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                      className="bg-white p-4 sm:p-5 lg:p-6 rounded-2xl sm:rounded-3xl lg:rounded-[32px] border border-white shadow-lg sm:shadow-xl shadow-slate-200/40"
                    >
                      <div
                        aria-hidden="true"
                        className={`w-10 h-10 sm:w-11 sm:h-11 lg:w-12 lg:h-12 ${stat.color} rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4`}
                      >
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <dd className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">{stat.value}</dd>
                      <dt className="text-[10px] sm:text-xs font-black text-[#64748B] uppercase tracking-widest mt-0.5">
                        {stat.label}
                      </dt>
                    </StaggerItem>
                  );
                })}
              </Stagger>

              {/* Email confirmation prompt (only while unconfirmed) */}
              {!user.isVerified && (
                <section
                  aria-labelledby="verify-heading"
                  className="bg-white p-6 sm:p-7 lg:p-8 rounded-3xl sm:rounded-[36px] lg:rounded-[40px] border border-white shadow-lg sm:shadow-xl shadow-slate-200/40"
                >
                  <div className="flex justify-between items-center mb-4 sm:mb-5 lg:mb-6">
                    <h2 id="verify-heading" className="text-sm sm:text-base font-black text-[#0F172A] tracking-tight">
                      Confirm Your Email
                    </h2>
                    <span className="text-xs sm:text-sm text-orange-500 font-black italic">Unconfirmed</span>
                  </div>

                  <p className="text-xs sm:text-sm text-[#64748B] font-bold leading-relaxed mb-4 sm:mb-5 lg:mb-6">
                    Your account works either way -confirming{' '}
                    <span className="text-[#0F172A]">{user.email}</span> is what lets you sign in with Google or
                    Facebook as well as your password.
                  </p>

                  {verifyNotice && (
                    <p
                      role="status"
                      className="mb-4 text-xs sm:text-sm font-bold text-[#3EB489] bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2.5 leading-relaxed"
                    >
                      {verifyNotice}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={verifySending}
                    className="w-full py-3 sm:py-3.5 lg:py-4 bg-white border-2 border-[#3EB489] text-[#3EB489] font-black text-sm sm:text-base rounded-xl sm:rounded-2xl hover:bg-[#3EB489] hover:text-white transition-all shadow-lg sm:shadow-xl shadow-emerald-50 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3EB489] focus-visible:ring-offset-2"
                  >
                    {verifySending ? 'Sending…' : 'Send Confirmation Link'}
                  </button>
                </section>
              )}
            </aside>

            {/* Right column: tabs + content */}
            <div className="lg:col-span-8 flex flex-col">
              {/* Tabs */}
              <div
                role="tablist"
                aria-label="Profile sections"
                className="flex gap-1.5 sm:gap-2 p-1.5 sm:p-2 bg-white rounded-2xl sm:rounded-[28px] border border-white shadow-lg shadow-slate-200/30 mb-6 sm:mb-7 lg:mb-8 w-fit self-center md:self-start"
              >
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      role="tab"
                      type="button"
                      id={`${tab.id}-tab`}
                      aria-selected={isActive}
                      aria-controls={`${tab.id}-panel`}
                      tabIndex={isActive ? 0 : -1}
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-black text-sm sm:text-base transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3EB489] focus-visible:ring-offset-2 ${isActive
                        ? 'text-white'
                        : 'text-[#64748B] hover:bg-slate-50'
                        }`}
                    >
                      {/* One pill, shared between tabs via layoutId: Motion
                          measures both positions and slides the same element
                          across, instead of one background fading out while
                          another fades in. */}
                      {isActive && (
                        <motion.span
                          layoutId="profile-tab-pill"
                          aria-hidden="true"
                          className="absolute inset-0 rounded-xl sm:rounded-2xl bg-[#3EB489] shadow-lg shadow-emerald-100"
                          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                        />
                      )}
                      <span className="relative z-10 flex items-center gap-1.5 sm:gap-2">
                        <Icon size={14} aria-hidden="true" className="sm:hidden" />
                        <Icon size={18} aria-hidden="true" className="hidden sm:block" />
                        {tab.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex-1">
                {/* Reviews tab panel */}
                <section
                  role="tabpanel"
                  id="reviews-panel"
                  aria-labelledby="reviews-tab"
                  hidden={activeTab !== 'reviews'}
                  className="space-y-4 sm:space-y-5 lg:space-y-6"
                >
                  {loadingStatus === 'failed' ? (
                    /* Never fall through to "no reviews yet" on a failed
                       fetch -that reads as "your reviews are gone". */
                    <div
                      role="alert"
                      className="bg-white p-8 sm:p-12 lg:p-16 rounded-2xl sm:rounded-3xl lg:rounded-[48px] border-2 border-dashed border-rose-100 text-center"
                    >
                      <AlertTriangle aria-hidden="true" className="mx-auto text-rose-300 mb-4 sm:mb-5 lg:mb-6 w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16" />
                      <h2 className="text-lg sm:text-xl font-black text-slate-900 mb-2">Couldn't load your reviews</h2>
                      <p className="text-sm sm:text-base text-slate-500 font-medium mb-6 sm:mb-7 lg:mb-8">
                        {reviewsError || 'Something went wrong while fetching your reviews. They are still there -this is just a loading problem.'}
                      </p>
                      <button
                        type="button"
                        onClick={handleRetryReviews}
                        className="inline-flex items-center gap-2 bg-[#3EB489] text-white px-8 sm:px-9 lg:px-10 py-3 sm:py-3.5 lg:py-4 rounded-xl sm:rounded-2xl font-black text-sm sm:text-base shadow-lg sm:shadow-xl shadow-emerald-50 cursor-pointer hover:bg-[#35a37b] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3EB489] focus-visible:ring-offset-2"
                      >
                        <RefreshCw size={16} aria-hidden="true" />
                        Retry
                      </button>
                    </div>
                  ) : reviews.length > 0 ? (
                    <>
                      <ul className="list-none space-y-4 sm:space-y-5 lg:space-y-6">
                        {reviews.slice(0, 3).map((rev) => (
                          <li key={rev._id}>
                            <article className="group bg-white p-5 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl lg:rounded-[48px] border border-white shadow-lg sm:shadow-xl shadow-slate-200/30 overflow-hidden">
                              <div className="flex flex-col md:flex-row gap-5 sm:gap-6 lg:gap-8">
                                {/* Property image */}
                                <div className="w-full h-40 sm:h-44 md:w-40 md:h-40 lg:w-48 lg:h-48 shrink-0 rounded-xl sm:rounded-2xl lg:rounded-[32px] overflow-hidden bg-slate-50 border border-slate-100">
                                  {rev.property?.image ? (
                                    <img
                                      src={rev.property.image}
                                      alt={`${rev.property.title} in ${rev.property.city || 'unknown city'}`}
                                      loading="lazy"
                                      className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500"
                                    />
                                  ) : (
                                    <div aria-hidden="true" className="w-full h-full flex items-center justify-center text-slate-200">
                                      <Home className="w-10 h-10 sm:w-12 sm:h-12" />
                                    </div>
                                  )}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-start gap-3 mb-4 sm:mb-5 lg:mb-6">
                                    <div className="min-w-0 flex-1">
                                      <h2 className="text-base sm:text-lg lg:text-xl font-black text-[#0F172A] tracking-tight leading-tight">
                                        {rev.property?.title || 'Property Review'}
                                      </h2>
                                      <address className="not-italic text-xs sm:text-sm font-bold text-[#94A3B8] flex items-start gap-1.5 mt-1">
                                        <MapPin size={12} aria-hidden="true" className="text-[#3EB489] mt-0.5 shrink-0" />
                                        <span className="truncate">
                                          {[rev.property?.streetAddress, rev.property?.city]
                                            .filter(Boolean)
                                            .join(', ') || 'No address provided'}
                                        </span>
                                      </address>
                                    </div>
                                    <div className="flex gap-1.5 sm:gap-2 shrink-0">
                                      {rev.property?._id && (
                                        <Link
                                          to={`/property/${rev.property._id}`}
                                          aria-label={`View ${rev.property.title}`}
                                          className="p-2 sm:p-2.5 lg:p-3 bg-slate-50 text-slate-400 hover:text-[#3EB489] rounded-xl sm:rounded-2xl transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3EB489] focus-visible:ring-offset-2"
                                        >
                                          <ChevronRight size={16} aria-hidden="true" className="sm:hidden" />
                                          <ChevronRight size={20} aria-hidden="true" className="hidden sm:block" />
                                        </Link>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteReview(rev._id)}
                                        aria-label={`Delete review of ${rev.property?.title || 'this property'}`}
                                        className="p-2 sm:p-2.5 lg:p-3 bg-rose-50 text-rose-400 hover:text-rose-600 rounded-xl sm:rounded-2xl transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
                                      >
                                        <Trash2 size={16} aria-hidden="true" className="sm:hidden" />
                                        <Trash2 size={20} aria-hidden="true" className="hidden sm:block" />
                                      </button>
                                    </div>
                                  </div>

                                  <div className="mb-3 sm:mb-4 flex items-center gap-3 sm:gap-4">
                                    <div
                                      role="img"
                                      aria-label={`Rated ${rev.rating} out of 5 stars`}
                                      className="flex gap-1 text-yellow-400"
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
                                          size={18}
                                          fill={i < rev.rating ? 'currentColor' : 'none'}
                                          aria-hidden="true"
                                          className="hidden sm:block"
                                        />
                                      ))}
                                    </div>
                                    {rev.createdAt && (
                                      <time
                                        dateTime={new Date(rev.createdAt).toISOString()}
                                        className="text-[10px] sm:text-xs font-black text-[#94A3B8] uppercase tracking-widest"
                                      >
                                        {new Date(rev.createdAt).toLocaleDateString()}
                                      </time>
                                    )}
                                  </div>

                                  <h3 className="text-base sm:text-lg font-black text-[#0F172A] mb-1.5 sm:mb-2">
                                    {rev.title}
                                  </h3>
                                  <p className="text-sm sm:text-base text-[#475569] font-medium leading-relaxed line-clamp-3">
                                    {rev.body}
                                  </p>
                                </div>
                              </div>
                            </article>
                          </li>
                        ))}
                      </ul>

                      {reviews.length > 3 && (
                        <button
                          type="button"
                          onClick={() => navigate('/my-reviews')}
                          className="w-full py-4 sm:py-5 lg:py-6 rounded-2xl sm:rounded-3xl lg:rounded-[32px] border-2 border-slate-100 text-[#64748B] font-black uppercase tracking-widest text-xs sm:text-sm hover:border-[#3EB489] hover:text-[#3EB489] hover:bg-emerald-50/30 transition-all flex items-center justify-center gap-2 group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3EB489] focus-visible:ring-offset-2"
                        >
                          View All My Reviews
                          <ChevronRight size={16} aria-hidden="true" className="group-hover:translate-x-1 transition-transform" />
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="bg-white p-8 sm:p-12 lg:p-16 rounded-2xl sm:rounded-3xl lg:rounded-[48px] border-2 border-dashed border-slate-100 text-center">
                      <MessageSquare aria-hidden="true" className="mx-auto text-slate-200 mb-4 sm:mb-5 lg:mb-6 w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16" />
                      <h2 className="text-lg sm:text-xl font-black text-slate-900 mb-2">No reviews yet</h2>
                      <p className="text-sm sm:text-base text-slate-500 font-medium mb-6 sm:mb-7 lg:mb-8">
                        You haven't shared any rental experiences yet.
                      </p>
                      <button
                        type="button"
                        onClick={() => navigate('/add-review')}
                        className="bg-[#3EB489] text-white px-8 sm:px-9 lg:px-10 py-3 sm:py-3.5 lg:py-4 rounded-xl sm:rounded-2xl font-black text-sm sm:text-base shadow-lg sm:shadow-xl shadow-emerald-50 cursor-pointer hover:bg-[#35a37b] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3EB489] focus-visible:ring-offset-2"
                      >
                        Write Your First Review
                      </button>
                    </div>
                  )}
                </section>

                {/* Saved tab panel */}
                <section
                  role="tabpanel"
                  id="saved-panel"
                  aria-labelledby="saved-tab"
                  hidden={activeTab !== 'saved'}
                  className="flex flex-col items-center justify-center py-16 sm:py-24 lg:py-32 bg-white rounded-2xl sm:rounded-3xl lg:rounded-[48px] border border-white shadow-lg sm:shadow-xl shadow-slate-200/30 text-center px-6 sm:px-8 lg:px-10"
                >
                  <Heart aria-hidden="true" className="text-slate-100 mb-6 sm:mb-7 lg:mb-8 w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20" />
                  <h2 className="text-xl sm:text-2xl font-black text-[#0F172A] mb-3 sm:mb-4 tracking-tight">
                    Saved Homes
                  </h2>
                  <p className="text-sm sm:text-base text-[#64748B] font-bold max-w-sm">
                    Feature coming soon! You'll be able to save properties and compare reviews.
                  </p>
                </section>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Edit Profile Modal ──────────────────────────────────────────── */}
      {isEditModalOpen && (
        <div
          ref={editDialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-profile-heading"
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
        >
          <EditProfileDialogA11y dialogRef={editDialogRef} />
          <div
            aria-hidden="true"
            onClick={() => setIsEditModalOpen(false)}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <div className="relative bg-white w-full max-w-md sm:max-w-lg rounded-3xl sm:rounded-[36px] lg:rounded-[48px] p-6 sm:p-8 lg:p-10 shadow-2xl max-h-[calc(100vh-2rem)] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              aria-label="Close edit profile dialog"
              className="absolute top-4 right-4 sm:top-6 sm:right-6 lg:top-8 lg:right-8 p-1.5 sm:p-2 text-slate-400 hover:text-slate-900 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3EB489] focus-visible:ring-offset-2 rounded-lg"
            >
              <X size={20} aria-hidden="true" className="sm:hidden" />
              <X size={24} aria-hidden="true" className="hidden sm:block" />
            </button>
            <h2
              id="edit-profile-heading"
              className="text-xl sm:text-2xl lg:text-3xl font-black text-[#0F172A] mb-6 sm:mb-7 lg:mb-8 tracking-tight pr-8"
            >
              Edit Profile
            </h2>

            <form onSubmit={handleUpdateProfile} className="space-y-4 sm:space-y-5 lg:space-y-6">
              <div className="space-y-1.5 sm:space-y-2">
                <label
                  htmlFor="edit-name"
                  className="text-xs sm:text-sm font-black text-slate-500 uppercase tracking-widest ml-1 block"
                >
                  Full Name
                </label>
                <input
                  id="edit-name"
                  ref={nameInputRef}
                  type="text"
                  required
                  autoComplete="name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 sm:px-5 lg:px-6 py-3 sm:py-3.5 lg:py-4 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-100 text-sm sm:text-base font-bold text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#3EB489] focus:ring-4 focus:ring-[#3EB489]/10 transition-all"
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <label
                  htmlFor="edit-email"
                  className="text-xs sm:text-sm font-black text-slate-500 uppercase tracking-widest ml-1 block"
                >
                  Email Address
                </label>
                <input
                  id="edit-email"
                  type="email"
                  autoComplete="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-4 sm:px-5 lg:px-6 py-3 sm:py-3.5 lg:py-4 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-100 text-sm sm:text-base font-bold text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#3EB489] focus:ring-4 focus:ring-[#3EB489]/10 transition-all"
                />
                <p className="text-[10px] sm:text-[11px] font-black text-slate-400 ml-1">
                  Changing this sends a confirmation link to the new address. Your current
                  address keeps working until you open it.
                </p>
              </div>

              {/* Asked for only when the address is actually changing. The server
                  requires it then - without it, a stolen session could repoint the
                  account and take it over through password reset. */}
              {emailChanging && (
                <div className="space-y-1.5 sm:space-y-2">
                  <label
                    htmlFor="edit-current-password"
                    className="text-xs sm:text-sm font-black text-slate-500 uppercase tracking-widest ml-1 block"
                  >
                    Current Password
                  </label>
                  <input
                    id="edit-current-password"
                    type="password"
                    autoComplete="current-password"
                    value={editForm.currentPassword}
                    onChange={(e) => setEditForm({ ...editForm, currentPassword: e.target.value })}
                    placeholder="Confirm it's you"
                    className="w-full px-4 sm:px-5 lg:px-6 py-3 sm:py-3.5 lg:py-4 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-100 text-sm sm:text-base font-bold text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#3EB489] focus:ring-4 focus:ring-[#3EB489]/10 transition-all"
                  />
                  <p className="text-[10px] sm:text-[11px] font-black text-slate-400 ml-1">
                    We&apos;ll also let your current address know this was requested.
                  </p>
                </div>
              )}

              {/* The change is parked, not applied - say exactly that. */}
              {emailPending && (
                <div className="rounded-xl sm:rounded-2xl border border-[#3EB489]/30 bg-[#3EB489]/5 p-4">
                  <p className="text-sm font-black text-[#2d9062]">Almost done</p>
                  <p className="text-xs sm:text-sm font-bold text-slate-600 mt-1 leading-relaxed">
                    We&apos;ve sent a confirmation link to{' '}
                    <span className="text-slate-900">{emailPending}</span>. Your email address
                    changes once you open it - until then you keep signing in with your current
                    address.
                  </p>
                </div>
              )}

              {editError && (
                <p role="alert" className="text-xs sm:text-sm font-black text-rose-600 ml-1">
                  {editError}
                </p>
              )}

              <div className="pt-2 sm:pt-3 lg:pt-4 flex gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setEditForm((prev) => ({ ...prev, currentPassword: '' }));
                    setEditError('');
                    setEmailPending('');
                    setIsEditModalOpen(false);
                  }}
                  className="flex-1 py-3 sm:py-3.5 lg:py-4 bg-slate-50 text-slate-600 font-black text-sm sm:text-base rounded-xl sm:rounded-2xl hover:bg-slate-100 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 py-3 sm:py-3.5 lg:py-4 bg-[#3EB489] text-white font-black text-sm sm:text-base rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl shadow-emerald-100 hover:bg-[#35a37b] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3EB489] focus-visible:ring-offset-2"
                >
                  {isUpdating ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Profile;
