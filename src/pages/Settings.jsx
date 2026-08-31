import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import Footer from '../components/Footer';
import { getCurrentUser, getMe, updateUserProfile, changePassword } from '../services/authService';
import { updateUser, loginSuccess } from '../store/authSlice';
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
  MessageSquare
} from 'lucide-react';
import ReviewNavbar from '../components/ReviewNavbar';
import useSeo from '../hooks/useSeo';

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
    
        const freshUser = result.user || user || getCurrentUser();
        if (result.token && freshUser) {
          dispatch(loginSuccess({ token: result.token, user: freshUser }));
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
                      className={`w-full flex items-center gap-4 px-6 py-4 rounded-3xl font-black transition-all ${activeTab === tab.id
                          ? 'bg-[#3EB489] text-white shadow-lg shadow-emerald-100'
                          : 'text-[#64748B] hover:bg-slate-50'
                        }`}
                    >
                      {tab.icon}
                      <span>{tab.label}</span>
                      {activeTab === tab.id && <ChevronRight size={18} className="ml-auto" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-rose-50 p-8 rounded-[40px] border border-rose-100">
                <h4 className="font-black text-rose-600 mb-2">Danger Zone</h4>
                <p className="text-xs font-bold text-rose-400 mb-6 leading-relaxed">Deleting your account is permanent. All your reviews and data will be removed.</p>
                <button className="w-full py-4 bg-white text-rose-600 font-black rounded-2xl border border-rose-200 hover:bg-rose-600 hover:text-white transition-all shadow-sm">
                  Delete Account
                </button>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 w-full bg-white rounded-[48px] border border-white shadow-2xl shadow-slate-200/40 p-8 md:p-12 min-h-[600px]">

              {activeTab === 'account' && (
                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                </div>
              )}

              {activeTab === 'privacy' && (
                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="space-y-2">
                    <h2 className="text-4xl font-black text-[#0F172A] tracking-tight">Privacy Settings</h2>
                    <p className="text-[#64748B] font-bold">Control your data and how your information is shared.</p>
                  </div>

                  <div className="space-y-8">
                    <div className="p-10 bg-slate-50 rounded-[48px] border border-slate-100 flex items-start gap-8">
                      <div className="w-16 h-16 bg-white rounded-[24px] flex items-center justify-center text-[#3EB489] shadow-inner shrink-0">
                        <EyeOff size={32} />
                      </div>
                      <div className="space-y-4">
                        <h4 className="text-xl font-black text-[#0F172A]">Anonymous Profile</h4>
                        <p className="text-[#64748B] font-medium leading-relaxed">When enabled, your real name and avatar will be hidden from other users. Your reviews will be displayed as "Anonymous Renter".</p>
                        <button className="px-8 py-3 bg-[#3EB489] text-white font-black rounded-2xl shadow-lg shadow-emerald-100 hover:bg-[#35a37b] transition-all">
                          Enable Anonymity
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="p-8 bg-white rounded-[40px] border border-slate-100 space-y-4">
                        <h4 className="font-black text-[#0F172A]">Account Visibility</h4>
                        <p className="text-xs font-bold text-[#64748B] leading-relaxed">Choose who can find your profile via search engines or internal directory.</p>
                        <select className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold focus:outline-none">
                          <option>Everyone</option>
                          <option>Registered Users Only</option>
                          <option>Only Me</option>
                        </select>
                      </div>
                      <div className="p-8 bg-white rounded-[40px] border border-slate-100 space-y-4">
                        <h4 className="font-black text-[#0F172A]">Data Usage</h4>
                        <p className="text-xs font-bold text-[#64748B] leading-relaxed">Allow RentReview to use your anonymized data for market research reports.</p>
                        <div className="flex items-center gap-4 pt-2">
                          <input type="checkbox" defaultChecked className="w-5 h-5 accent-[#3EB489]" />
                          <span className="text-sm font-black text-slate-700">Allow analytics usage</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </main>

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
