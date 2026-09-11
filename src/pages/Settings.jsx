import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import Footer from '../components/Footer';
import { getCurrentUser, getMe, updateUserProfile, changePassword, exportMyData, deleteMyAccount } from '../services/authService';
import { setCsrfToken } from '../config/api';
import { updateUser, logoutSuccess } from '../store/authSlice';
import {
  User,
  Settings as SettingsIcon,
  Lock,
  Bell,
  Shield,
  Trash2,
  ChevronRight,
  Check,
  X,
  ArrowLeft,
  Mail,
  Smartphone,
  Eye,
  EyeOff,
  CloudLightning,
  MessageSquare,
  Download,
  AlertTriangle
} from 'lucide-react';
import ReviewNavbar from '../components/ReviewNavbar';
import useSeo from '../hooks/useSeo';
import { AnimatePresence, motion, EASE } from '../animations';

const Settings = () => {
  // Private account settings -noindex.
  useSeo({ title: 'Account Settings | RentReview', noindex: true });

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [user, setUser] = useState(getCurrentUser());
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('account');
  const [isUpdating, setIsUpdating] = useState(false);

  // Account Form -seeded from the cached user so a failed /auth/me can never
  // leave this blank and let Save overwrite the real name with ''.
  const [accountForm, setAccountForm] = useState(() => {
    const cached = getCurrentUser();
    return { name: cached?.name || '', email: cached?.email || '' };
  });
  const [accountError, setAccountError] = useState('');

  // Password Form
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Notification Toggles
  // ── Your data: export + delete ─────────────────────────────────────────
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const [notifications, setNotifications] = useState({
    reviewAlerts: true,
    marketing: false,
    security: true
  });

  useEffect(() => {
    let ignore = false;

    const fetchUser = async () => {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        navigate('/signin');
        return;
      }

      // Seed from the cache FIRST. getMe() resolves to null (rather than
      // throwing) on failure, so the catch below can't be relied on.
      setUser(currentUser);
      setAccountForm({ name: currentUser.name || '', email: currentUser.email || '' });

      try {
        const freshUser = await getMe();
        if (ignore) return;
        if (freshUser) {
          setUser(freshUser);
          setAccountForm({ name: freshUser.name || '', email: freshUser.email || '' });
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    fetchUser();

    return () => {
      ignore = true;
    };
  }, [navigate]);

  const handleUpdateAccount = async (e) => {
    e.preventDefault();

    // Never submit a blank name -that would wipe the user's real name.
    const name = (accountForm.name || '').trim();
    if (!name) {
      setAccountError('Please enter your name -it cannot be empty.');
      return;
    }
    setAccountError('');

    setIsUpdating(true);
    try {
      const result = await updateUserProfile({ name });
      if (result.success) {
        setUser(result.user);
        setAccountForm((prev) => ({ ...prev, name: result.user?.name ?? name }));
        // Keep Redux (and the navbar) in sync with the saved name.
        dispatch(updateUser(result.user));
        alert("Account updated successfully!");
      } else {
        setAccountError(result.message || "Failed to update account");
        alert(result.message || "Failed to update account");
      }
    } catch (error) {
      setAccountError(error.message || 'Something went wrong.');
      alert("Error: " + error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("New passwords do not match!");
      return;
    }

    setIsUpdating(true);
    try {
      const result = await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      if (result.success) {
        // Changing the password rotates the session, and the rotation issues a
        // new CSRF token without adopting it, the next write 403s.
        setCsrfToken(result.csrfToken);
        if (result.user) {
          setUser(result.user);
          dispatch(updateUser(result.user));
        }
        alert("Password changed successfully!");
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        alert(result.message || "Failed to change password");
      }
    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  // Social-only accounts have no password to confirm with; they only type
  // DELETE. `hasPassword` comes from GET /auth/me; when unknown, show the field
  // (the server ignores it for social accounts).
  const hasPassword = user?.hasPassword !== false;

  const handleExportData = async () => {
    setExporting(true);
    setExportError('');
    try {
      const data = await exportMyData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rentreview-data-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      // Give the download a tick to start before the URL is revoked.
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      setExportError(error.message || "We couldn't prepare your export. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const openDeleteDialog = () => {
    setDeletePassword('');
    setDeleteConfirmation('');
    setDeleteError('');
    setDeleteOpen(true);
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    setDeleteError('');

    if (deleteConfirmation !== 'DELETE') {
      setDeleteError('Type DELETE (in capitals) to confirm.');
      return;
    }

    setDeleting(true);
    try {
      const result = await deleteMyAccount({
        password: deletePassword || undefined,
        confirmation: deleteConfirmation,
      });
      if (result.success) {
        dispatch(logoutSuccess());
        navigate('/', { replace: true });
      } else {
        setDeleteError(result.message || "We couldn't delete your account. Please try again.");
      }
    } catch (error) {
      setDeleteError(error.message || "We couldn't delete your account. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const toggleNotification = (key) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3EB489]"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'account', label: 'Account', icon: <User size={20} /> },
    { id: 'security', label: 'Security', icon: <Lock size={20} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={20} /> },
    { id: 'privacy', label: 'Privacy', icon: <Shield size={20} /> }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-[#3EB489]/20 selection:text-[#3EB489]">
      <ReviewNavbar />

      <main className="pt-32 pb-24 px-4">
        <div className="max-w-6xl mx-auto">
      
          <h1 className="sr-only">Account Settings</h1>

          <div className="flex flex-col md:flex-row gap-8 items-start">

            {/* Sidebar Navigation */}
            <div className="w-full md:w-80 shrink-0 space-y-6">
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center gap-2 text-[#64748B] font-black uppercase tracking-widest text-[11px] hover:text-[#3EB489] mb-4 transition-all"
              >
                <ArrowLeft size={16} /> Back to Profile
              </button>

              <div className="bg-white p-4 rounded-[40px] border border-white shadow-xl shadow-slate-200/40">
                <div className="space-y-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative w-full flex items-center gap-4 px-6 py-4 rounded-3xl font-black transition-colors ${activeTab === tab.id
                          ? 'text-white'
                          : 'text-[#64748B] hover:bg-slate-50'
                        }`}
                    >
                      {/* One highlight, shared across the tabs via layoutId, so
                          it slides between them instead of blinking. */}
                      {activeTab === tab.id && (
                        <motion.span
                          layoutId="settings-tab-pill"
                          aria-hidden="true"
                          className="absolute inset-0 rounded-3xl bg-[#3EB489] shadow-lg shadow-emerald-100"
                          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                        />
                      )}
                      <span className="relative z-10 flex w-full items-center gap-4">
                        {tab.icon}
                        <span>{tab.label}</span>
                        {activeTab === tab.id && <ChevronRight size={18} className="ml-auto" />}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-rose-50 p-8 rounded-[40px] border border-rose-100">
                <h4 className="font-black text-rose-600 mb-2">Danger Zone</h4>
                <p className="text-xs font-bold text-rose-400 mb-6 leading-relaxed">Deleting your account is permanent. All your reviews and data will be removed.</p>
                <button
                  type="button"
                  onClick={openDeleteDialog}
                  className="w-full py-4 bg-white text-rose-600 font-black rounded-2xl border border-rose-200 hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                >
                  Delete Account
                </button>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 w-full bg-white rounded-[48px] border border-white shadow-2xl shadow-slate-200/40 p-8 md:p-12 min-h-[600px]">

              {/* Tab panels cross-fade. mode="wait" lets the outgoing panel
                  clear before the next one arrives, so two differently-sized
                  forms never overlap mid-switch. The panels used Tailwind
                  `animate-in` classes from a plugin this project doesn't
                  install, so nothing was actually animating before. */}
              <AnimatePresence mode="wait" initial={false}>
              {activeTab === 'account' && (
                <motion.div
                  key="account"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.24, ease: EASE }}
                  className="space-y-12"
                >
                  <div className="space-y-2">
                    <h2 className="text-4xl font-black text-[#0F172A] tracking-tight">Account Settings</h2>
                    <p className="text-[#64748B] font-bold">Manage your profile information and how others see you.</p>
                  </div>

                  <form onSubmit={handleUpdateAccount} className="space-y-8">
                    <div className="flex flex-col md:flex-row gap-8 items-center pb-8 border-b border-slate-50">
                      <div className="relative group">
                        <div className="w-32 h-32 rounded-[40px] bg-slate-100 p-1 border-2 border-white shadow-xl overflow-hidden ring-4 ring-[#3EB489]/10">
                          <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=3EB489&color=fff&size=200`}
                            alt={user?.name || 'Your avatar'}
                            className="w-full h-full object-cover rounded-[36px]"
                          />
                        </div>
                        <button className="absolute -bottom-2 -right-2 p-3 bg-white rounded-2xl shadow-lg border border-slate-100 text-[#3EB489] hover:scale-110 transition-transform">
                          <CloudLightning size={20} />
                        </button>
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-black text-[#0F172A]">Public Avatar</h4>
                        <p className="text-xs font-bold text-[#94A3B8]">Your profile picture is visible to everyone who views your reviews.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                        <div className="relative">
                          <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                          <input
                            type="text"
                            value={accountForm.name}
                            onChange={(e) => {
                              setAccountForm({ ...accountForm, name: e.target.value });
                              if (accountError) setAccountError('');
                            }}
                            placeholder="Your Name"
                            aria-invalid={accountError ? 'true' : undefined}
                            className={`w-full pl-14 pr-6 py-4 rounded-3xl bg-slate-50 border font-bold focus:outline-none focus:bg-white transition-all ${accountError ? 'border-rose-300 focus:border-rose-400' : 'border-slate-100 focus:border-[#3EB489]'}`}
                          />
                        </div>
                        {accountError && (
                          <p role="alert" className="text-[11px] font-black text-rose-500 ml-1">
                            {accountError}
                          </p>
                        )}
                      </div>
                      <div className="space-y-3">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                        <div className="relative opacity-60">
                          <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                          <input
                            type="email"
                            disabled
                            value={accountForm.email}
                            className="w-full pl-14 pr-6 py-4 rounded-3xl bg-slate-100 border border-slate-200 font-bold cursor-not-allowed"
                          />
                        </div>
                        <p className="text-[10px] font-black text-slate-400 mt-1 ml-1 flex items-center gap-1">
                          <Shield size={10} /> Email is verified and secure
                        </p>
                      </div>
                    </div>

                    <div className="pt-6">
                      <button
                        type="submit"
                        disabled={isUpdating}
                        className="px-10 py-5 bg-[#3EB489] text-white font-black rounded-3xl shadow-xl shadow-emerald-200/50 hover:bg-[#35a37b] transition-all disabled:opacity-50 active:scale-95"
                      >
                        {isUpdating ? 'Saving Changes...' : 'Save Profile Changes'}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {activeTab === 'security' && (
                <motion.div
                  key="security"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.24, ease: EASE }}
                  className="space-y-12"
                >
                  <div className="space-y-2">
                    <h2 className="text-4xl font-black text-[#0F172A] tracking-tight">Security</h2>
                    <p className="text-[#64748B] font-bold">Update your password and manage account security settings.</p>
                  </div>

                  <form onSubmit={handleChangePassword} className="max-w-xl space-y-8">
                    <div className="space-y-3">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Current Password</label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-[#3EB489]"
                        >
                          {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                          placeholder="••••••••"
                          className="w-full px-6 py-4 rounded-3xl bg-slate-50 border border-slate-100 font-bold focus:outline-none focus:border-[#3EB489] focus:bg-white transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-[#3EB489]"
                          >
                            {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                          <input
                            type={showNewPassword ? "text" : "password"}
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                            placeholder="••••••••"
                            className="w-full px-6 py-4 rounded-3xl bg-slate-50 border border-slate-100 font-bold focus:outline-none focus:border-[#3EB489] focus:bg-white transition-all"
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Confirm Password</label>
                        <input
                          type="password"
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                          placeholder="••••••••"
                          className="w-full px-6 py-4 rounded-3xl bg-slate-50 border border-slate-100 font-bold focus:outline-none focus:border-[#3EB489] focus:bg-white transition-all"
                        />
                      </div>
                    </div>

                    <div className="pt-6">
                      <button
                        type="submit"
                        disabled={isUpdating}
                        className="w-full md:w-auto px-10 py-5 bg-[#3EB489] text-white font-black rounded-3xl shadow-xl shadow-emerald-200/50 hover:bg-[#35a37b] transition-all disabled:opacity-50 active:scale-95"
                      >
                        {isUpdating ? 'Updating Password...' : 'Update Password'}
                      </button>
                    </div>
                  </form>

                  <div className="p-8 bg-slate-50 rounded-[40px] border border-slate-100 flex items-center gap-6">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-[#3EB489] shadow-sm">
                      <Smartphone size={28} />
                    </div>
                    <div>
                      <h4 className="font-black text-[#0F172A]">Two-Factor Authentication</h4>
                      <p className="text-sm font-bold text-[#64748B]">Secure your account with an extra layer of protection.</p>
                    </div>
                    <button className="ml-auto px-6 py-3 bg-white border border-slate-200 text-[#0F172A] font-black rounded-2xl hover:bg-slate-50 transition-all text-sm">
                      Enable
                    </button>
                  </div>
                </motion.div>
              )}

              {activeTab === 'notifications' && (
                <motion.div
                  key="notifications"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.24, ease: EASE }}
                  className="space-y-12"
                >
                  <div className="space-y-2">
                    <h2 className="text-4xl font-black text-[#0F172A] tracking-tight">Notifications</h2>
                    <p className="text-[#64748B] font-bold">Control how and when you want to be notified by RentReview.</p>
                  </div>

                  <div className="space-y-4">
                    {[
                      { id: 'reviewAlerts', title: 'Review Alerts', desc: 'Get notified when someone upvotes or comments on your review.', icon: <MessageSquare size={20} /> },
                      { id: 'marketing', title: 'Marketing Emails', desc: 'Receive newsletters, tips, and promotional offers.', icon: <Sparkles size={20} className="text-[#3EB489]" /> },
                      { id: 'security', title: 'Security Notifications', desc: 'Important alerts about account logins and security changes.', icon: <Shield size={20} className="text-emerald-600" /> }
                    ].map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-8 bg-[#F8FAFC] rounded-[36px] border border-slate-100 group hover:border-[#3EB489]/20 transition-all">
                        <div className="flex gap-6 items-center text-left">
                          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-[#3EB489] transition-colors shadow-sm">
                            {item.icon}
                          </div>
                          <div className="text-left">
                            <h4 className="font-black text-[#0F172A] text-left">{item.title}</h4>
                            <p className="text-xs font-bold text-[#64748B] text-left">{item.desc}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleNotification(item.id)}
                          className={`w-14 h-8 rounded-full relative transition-all duration-300 ${notifications[item.id] ? 'bg-[#3EB489]' : 'bg-slate-200'}`}
                        >
                          <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all duration-300 shadow-md ${notifications[item.id] ? 'left-7' : 'left-1'}`}></div>
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'privacy' && (
                <motion.div
                  key="privacy"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.24, ease: EASE }}
                  className="space-y-12"
                >
                  <div className="space-y-2">
                    <h2 className="text-4xl font-black text-[#0F172A] tracking-tight">Privacy & Your Data</h2>
                    <p className="text-[#64748B] font-bold">See what we hold about you, take a copy, or erase it.</p>
                  </div>

                  <div className="space-y-8">
                    <div className="p-10 bg-slate-50 rounded-[48px] border border-slate-100 flex flex-col md:flex-row items-start gap-8">
                      <div className="w-16 h-16 bg-white rounded-[24px] flex items-center justify-center text-[#3EB489] shadow-inner shrink-0">
                        <Download size={32} />
                      </div>
                      <div className="space-y-4 flex-1">
                        <h4 className="text-xl font-black text-[#0F172A]">Download your data</h4>
                        <p className="text-[#64748B] font-medium leading-relaxed">
                          A JSON file with your account details and every review you have written.
                          Government ID details are never included they are encrypted while a
                          verification is pending and destroyed once it is decided.
                        </p>
                        {exportError && (
                          <p className="text-sm font-bold text-rose-600" role="alert">{exportError}</p>
                        )}
                        <button
                          type="button"
                          onClick={handleExportData}
                          disabled={exporting}
                          className="px-8 py-3 bg-[#3EB489] text-white font-black rounded-2xl shadow-lg shadow-emerald-100 hover:bg-[#35a37b] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {exporting ? 'Preparing…' : 'Download my data'}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="p-8 bg-white rounded-[40px] border border-slate-100 space-y-4">
                        <h4 className="font-black text-[#0F172A]">What is public</h4>
                        <p className="text-xs font-bold text-[#64748B] leading-relaxed">
                          The name you enter on a review, its rating, text and photos are visible to
                          everyone. Your email address and sign-in details are never shown.
                        </p>
                      </div>
                      <div className="p-8 bg-white rounded-[40px] border border-slate-100 space-y-4">
                        <h4 className="font-black text-[#0F172A]">Identity verification</h4>
                        <p className="text-xs font-bold text-[#64748B] leading-relaxed">
                          ID documents are stored privately, seen only by our verification team, and
                          deleted as soon as a decision is made or automatically after 30 days.
                          Only the last four characters of the ID number are kept.
                        </p>
                      </div>
                    </div>

                    <div className="p-8 bg-rose-50 rounded-[40px] border border-rose-100 flex flex-col md:flex-row md:items-center gap-6">
                      <div className="flex-1 space-y-2">
                        <h4 className="font-black text-rose-600">Delete your account</h4>
                        <p className="text-xs font-bold text-rose-400 leading-relaxed">
                          Removes your account, every review you wrote, their photos and any pending ID
                          verification. This cannot be undone.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={openDeleteDialog}
                        className="px-8 py-3 bg-white text-rose-600 font-black rounded-2xl border border-rose-200 hover:bg-rose-600 hover:text-white transition-all shadow-sm shrink-0"
                      >
                        Delete Account
                      </button>
                    </div>

                    <p className="text-xs font-bold text-[#94A3B8]">
                      Full details in our <a href="/privacy" className="text-[#3EB489] underline">Privacy Policy</a>.
                    </p>
                  </div>
                </motion.div>
              )}
              </AnimatePresence>

            </div>
          </div>
        </div>
      </main>

      {/* ── Delete-account confirmation ─────────────────────────────────── */}
      <AnimatePresence>
        {deleteOpen && (
          <motion.div
            key="delete-dialog"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
            onClick={() => !deleting && setDeleteOpen(false)}
          >
            <motion.form
              onSubmit={handleDeleteAccount}
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.22, ease: EASE }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-account-title"
              className="w-full max-w-lg bg-white rounded-[40px] p-10 shadow-2xl space-y-6"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertTriangle size={24} />
                </div>
                <div className="space-y-1">
                  <h3 id="delete-account-title" className="text-2xl font-black text-[#0F172A]">Delete your account?</h3>
                  <p className="text-sm font-bold text-[#64748B] leading-relaxed">
                    This permanently removes your account and every review you have written. There is no undo.
                  </p>
                </div>
              </div>

              {hasPassword && (
                <div className="space-y-2">
                  <label className="text-xs font-black text-[#64748B] uppercase tracking-wider" htmlFor="delete-password">
                    Your password
                  </label>
                  <input
                    id="delete-password"
                    type="password"
                    autoComplete="current-password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-rose-200"
                    placeholder="Leave blank if you sign in with Google or Facebook"
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-black text-[#64748B] uppercase tracking-wider" htmlFor="delete-confirm">
                  Type <span className="text-rose-600">DELETE</span> to confirm
                </label>
                <input
                  id="delete-confirm"
                  type="text"
                  autoComplete="off"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-rose-200"
                />
              </div>

              {deleteError && (
                <p className="text-sm font-bold text-rose-600" role="alert">{deleteError}</p>
              )}

              <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end pt-2">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => setDeleteOpen(false)}
                  className="px-6 py-3 rounded-2xl font-black text-[#64748B] hover:bg-slate-50 transition-colors"
                >
                  Keep my account
                </button>
                <button
                  type="submit"
                  disabled={deleting || deleteConfirmation !== 'DELETE'}
                  className="px-6 py-3 rounded-2xl font-black bg-rose-600 text-white hover:bg-rose-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? 'Deleting…' : 'Delete permanently'}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
};

// Placeholder icon for Sparkles since it wasn't imported initially in the simplified version
const Sparkles = ({ size, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <path d="M5 3v4" />
    <path d="M19 17v4" />
    <path d="M3 5h4" />
    <path d="M17 19h4" />
  </svg>
);

export default Settings;
