import React, { useState, useEffect } from 'react';
import { User, Shield, Bell, CreditCard, ChevronRight, X, Check, Loader2, LogOut } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCurrentUser, updateCurrentUser } from '../services/api';
import { useNavigate } from 'react-router-dom';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeSetting, setActiveSetting] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Profile form state – populated from API
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');

  // Notification toggles
  const [notifications, setNotifications] = useState<Record<string, boolean>>({
    'Email Alerts': true,
    'Push Notifications': true,
    'Weekly Report': true,
    'New Job Alerts': false,
  });

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['me'],
    queryFn: getCurrentUser,
    retry: false,
  });

  // Populate form once user data arrives
  useEffect(() => {
    if (user) {
      setProfileName(user.name ?? '');
      setProfileEmail(user.email ?? '');
    }
  }, [user]);

  const updateMutation = useMutation({
    mutationFn: (payload: { name?: string; email?: string }) => updateCurrentUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      setSaveSuccess(true);
      setIsSaving(false);
      setTimeout(() => {
        setSaveSuccess(false);
        setActiveSetting(null);
      }, 1500);
    },
    onError: () => {
      setIsSaving(false);
    },
  });

  const handleSave = () => {
    if (activeSetting === 'profile') {
      setIsSaving(true);
      updateMutation.mutate({ name: profileName, email: profileEmail });
    } else {
      // For other settings without a real API, simulate save
      setIsSaving(true);
      setTimeout(() => {
        setIsSaving(false);
        setSaveSuccess(true);
        setTimeout(() => {
          setSaveSuccess(false);
          setActiveSetting(null);
        }, 1200);
      }, 1000);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_email');
    navigate('/login');
  };

  const settingsOptions = [
    {
      id: 'profile',
      icon: <User className="w-5 h-5 text-indigo-600" />,
      title: 'Profile Information',
      description: 'Update your personal details and college info',
    },
    {
      id: 'security',
      icon: <Shield className="w-5 h-5 text-indigo-600" />,
      title: 'Security & Privacy',
      description: 'Manage your password and 2FA settings',
    },
    {
      id: 'notifications',
      icon: <Bell className="w-5 h-5 text-indigo-600" />,
      title: 'Notifications',
      description: 'Choose what alerts you want to receive',
    },
    {
      id: 'loan',
      icon: <CreditCard className="w-5 h-5 text-indigo-600" />,
      title: 'Loan Details',
      description: 'View your active loan and interest rate history',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-['Poppins']">
      <div className="max-w-4xl mx-auto">

        {/* Page Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black text-slate-900">Settings</h1>
            {userLoading ? (
              <div className="h-4 w-40 bg-slate-200 rounded animate-pulse mt-2" />
            ) : (
              <p className="text-slate-500 mt-1 font-medium">
                Signed in as <span className="text-indigo-600 font-bold">{user?.email ?? '—'}</span>
              </p>
            )}
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-sm font-bold text-rose-600 hover:bg-rose-50 px-4 py-2 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>

        {/* Detail Modal */}
        {activeSetting && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] p-0 max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
              <div className="bg-indigo-600 p-8 text-white flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-black">
                    {settingsOptions.find(s => s.id === activeSetting)?.title}
                  </h3>
                  <p className="text-indigo-100 text-xs mt-1">Manage your {activeSetting} preferences</p>
                </div>
                <button
                  onClick={() => { setActiveSetting(null); setSaveSuccess(false); }}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8 space-y-6">
                {/* Profile Section */}
                {activeSetting === 'profile' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                        Full Name
                      </label>
                      {userLoading ? (
                        <div className="h-12 bg-slate-100 rounded-xl animate-pulse" />
                      ) : (
                        <input
                          type="text"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium transition-all outline-none"
                          value={profileName}
                          onChange={e => setProfileName(e.target.value)}
                          placeholder="Your full name"
                        />
                      )}
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                        Email Address
                      </label>
                      {userLoading ? (
                        <div className="h-12 bg-slate-100 rounded-xl animate-pulse" />
                      ) : (
                        <input
                          type="email"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium transition-all outline-none"
                          value={profileEmail}
                          onChange={e => setProfileEmail(e.target.value)}
                          placeholder="your@email.com"
                        />
                      )}
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                        Account Role
                      </label>
                      <div className="px-4 py-3 bg-indigo-50 rounded-xl border border-indigo-100">
                        <span className="font-bold text-indigo-800 capitalize">{user?.role ?? '—'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Security Section */}
                {activeSetting === 'security' && (
                  <div className="space-y-4 text-center py-4">
                    <Shield className="w-16 h-16 text-indigo-600 mx-auto mb-2" />
                    <p className="font-bold text-slate-800">Two-Factor Authentication</p>
                    <p className="text-sm text-slate-500 px-8">
                      Enable 2FA to add an extra layer of security to your RAVi account.
                    </p>
                    <button className="text-indigo-600 font-bold hover:underline">Setup 2FA Now</button>
                  </div>
                )}

                {/* Notifications Section */}
                {activeSetting === 'notifications' && (
                  <div className="space-y-3">
                    {Object.entries(notifications).map(([label, enabled]) => (
                      <div key={label} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="font-bold text-slate-700 text-sm">{label}</span>
                        <button
                          onClick={() => setNotifications(prev => ({ ...prev, [label]: !prev[label] }))}
                          className={`w-11 h-6 rounded-full relative transition-colors duration-300 ${enabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
                        >
                          <div
                            className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${enabled ? 'right-1' : 'left-1'}`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Loan Section */}
                {activeSetting === 'loan' && (
                  <div className="space-y-6">
                    <div className="p-6 bg-indigo-50 rounded-[2rem] border border-indigo-100 flex justify-between items-center">
                      <div>
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Active Loan Amount</p>
                        <p className="text-2xl font-black text-indigo-900">₹10,00,000</p>
                      </div>
                      <span className="bg-white px-4 py-2 rounded-full text-[10px] font-black text-emerald-600 border border-emerald-100 uppercase tracking-widest shadow-sm">
                        Status: Active
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Collateral Kept</p>
                        <p className="font-bold text-slate-800">Fixed Deposit</p>
                        <p className="text-xs text-slate-500 mt-1">HDFC Bank — FD #8821</p>
                      </div>
                      <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Collateral Value</p>
                        <p className="font-bold text-slate-800">₹10,00,000</p>
                        <p className="text-xs text-emerald-600 mt-1 font-bold">1:1 Coverage</p>
                      </div>
                    </div>

                    <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-4">
                      <Shield className="w-6 h-6 text-amber-600 mt-1" />
                      <div>
                        <p className="font-bold text-amber-900 text-sm">Secondary Asset Pledged</p>
                        <p className="text-amber-700 text-xs mt-1">
                          Residential Property (Partial) — Estimated Value: ₹45,00,000.
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 italic text-center">
                      Interest rate updates daily based on your Learning Velocity and Profile Score.
                    </p>
                  </div>
                )}

                {/* Save Button */}
                {saveSuccess ? (
                  <div className="w-full bg-emerald-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 animate-in fade-in duration-300">
                    <Check className="w-5 h-5" /> Saved Successfully!
                  </div>
                ) : (
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all disabled:opacity-50"
                  >
                    {isSaving ? <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</> : <><Check className="w-5 h-5" /> Save Changes</>}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Settings List */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
          {settingsOptions.map(option => (
            <button
              key={option.id}
              onClick={() => setActiveSetting(option.id)}
              className="w-full flex items-center justify-between p-8 hover:bg-slate-50 transition-colors text-left group"
            >
              <div className="flex items-center gap-6">
                <div className="p-4 bg-indigo-50 rounded-2xl group-hover:scale-110 transition-transform">
                  {option.icon}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{option.title}</h3>
                  <p className="text-sm text-slate-500">{option.description}</p>
                </div>
              </div>
              <ChevronRight className="text-slate-300 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          ))}
        </div>

        {/* Account Info Card */}
        <div className="mt-6 p-6 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Account Summary</p>
          {userLoading ? (
            <div className="space-y-2">
              <div className="h-4 w-48 bg-slate-100 rounded animate-pulse" />
              <div className="h-4 w-32 bg-slate-100 rounded animate-pulse" />
            </div>
          ) : (
            <div className="flex flex-wrap gap-6">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Name</p>
                <p className="font-bold text-slate-800 capitalize">{user?.name ?? '—'}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</p>
                <p className="font-bold text-slate-800">{user?.email ?? '—'}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Role</p>
                <p className="font-bold text-slate-800 capitalize">{user?.role ?? '—'}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Member Since</p>
                <p className="font-bold text-slate-800">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '—'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Danger Zone */}
        <div className="mt-6 p-6 bg-rose-50 rounded-3xl border border-rose-100 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-rose-800">Danger Zone</h3>
            <p className="text-sm text-rose-600">Permanently delete your account and all data</p>
          </div>
          <button className="bg-rose-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-rose-700 transition-all">
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
