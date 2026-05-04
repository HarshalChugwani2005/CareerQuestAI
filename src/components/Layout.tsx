import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Search, Bell, UserCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getCurrentUser } from '../services/api';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();

  const { data: user, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: getCurrentUser,
    retry: false,
  });

  // Only show name when we have data – never fall back to a demo name
  const userName = user?.name ?? '';
  const userInitial = userName ? userName.charAt(0).toUpperCase() : null;
  const isAdmin = user?.role === 'admin' || user?.role === 'lender';

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_email');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Poppins']">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 px-6 py-3 flex justify-between items-center shadow-sm">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <Zap className="text-white w-5 h-5" />
          </div>
          <span className="text-xl font-bold text-slate-800 tracking-tight">
            CareerQuest <span className="text-indigo-600">RAVi</span>
          </span>
        </Link>

        {/* Search */}
        <div className="hidden md:flex bg-slate-50 rounded-xl px-4 py-2 w-96 items-center gap-2 border border-slate-100 focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
          <Search className="text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search internships, modules..."
            className="bg-transparent border-none focus:outline-none w-full text-sm font-medium"
          />
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {isAdmin && (
            <Link
              to="/admin"
              className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:bg-indigo-50 px-4 py-2 rounded-xl transition-colors"
            >
              Admin Portal
            </Link>
          )}

          <button
            onClick={handleSignOut}
            className="text-[10px] font-black text-rose-600 uppercase tracking-widest hover:bg-rose-50 px-4 py-2 rounded-xl transition-colors"
          >
            Sign Out
          </button>

          <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
          </button>

          <Link to="/settings" className="flex items-center gap-3 pl-4 border-l border-slate-200 group">
            <div className="text-right hidden sm:block">
              <div className="flex items-center gap-2 justify-end">
                {isAdmin && (
                  <span className="bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter">
                    Admin
                  </span>
                )}
                {isLoading ? (
                  <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
                ) : userName ? (
                  <p className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors capitalize">
                    {userName}
                  </p>
                ) : null}
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {isAdmin ? 'System Auditor' : 'Student'}
              </p>
            </div>

            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-black text-sm group-hover:scale-110 transition-transform overflow-hidden">
              {isLoading ? (
                <UserCircle className="w-10 h-10 text-indigo-300" />
              ) : userInitial ? (
                <span>{userInitial}</span>
              ) : (
                <UserCircle className="w-10 h-10" />
              )}
            </div>
          </Link>
        </div>
      </nav>

      <main>
        {children}
      </main>
    </div>
  );
};

export default Layout;
