import React from 'react';
import { User, Shield, Bell, CreditCard, ChevronRight } from 'lucide-react';

const Settings: React.FC = () => {
  const sections = [
    { icon: <User className="w-5 h-5" />, title: 'Profile Information', desc: 'Update your personal details and college info' },
    { icon: <Shield className="w-5 h-5" />, title: 'Security & Privacy', desc: 'Manage your password and 2FA settings' },
    { icon: <Bell className="w-5 h-5" />, title: 'Notifications', desc: 'Choose what alerts you want to receive' },
    { icon: <CreditCard className="w-5 h-5" />, title: 'Loan Details', desc: 'View your active loan and interest rate history' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-['Poppins']">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Settings</h1>
        
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {sections.map((section, idx) => (
            <button key={idx} className="w-full flex items-center justify-between p-6 hover:bg-slate-50 transition-all border-b border-slate-100 last:border-0">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                  {section.icon}
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-slate-800">{section.title}</h3>
                  <p className="text-sm text-slate-500">{section.desc}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300" />
            </button>
          ))}
        </div>

        <div className="mt-10 p-6 bg-rose-50 rounded-3xl border border-rose-100 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-rose-800">Danger Zone</h3>
            <p className="text-sm text-rose-600">Permanently delete your account and all data</p>
          </div>
          <button className="bg-rose-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-rose-700 transition-all">Delete Account</button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
