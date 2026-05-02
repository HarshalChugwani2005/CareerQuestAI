import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Search, Bell, UserCircle } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 font-['Poppins']">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 px-6 py-3 flex justify-between items-center shadow-sm">
        <Link to="/dashboard" className="flex items-center gap-2 group">
          <div className="bg-indigo-600 p-2 rounded-xl group-hover:scale-110 transition-transform">
            <Zap className="text-white w-6 h-6" />
          </div>
          <span className="text-xl font-bold text-slate-800 tracking-tight">CareerQuest <span className="text-indigo-600">RAVi</span></span>
        </Link>
        
        <div className="hidden md:flex bg-slate-50 rounded-full px-5 py-2.5 w-96 items-center gap-3 border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
          <Search className="text-slate-400 w-4 h-4" />
          <input type="text" placeholder="Search internships, modules..." className="bg-transparent border-none focus:outline-none w-full text-sm font-medium" />
        </div>

        <div className="flex items-center gap-4">
          <Link to="/admin" className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:bg-indigo-50 px-4 py-2 rounded-xl transition-colors">Admin Portal</Link>
          <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
          </button>
          <div className="flex items-center gap-2 pl-4 border-l border-slate-200 group cursor-pointer" onClick={() => navigate('/settings')}>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">Active Alex</p>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Level 4 Student</p>
            </div>
            <UserCircle className="w-10 h-10 text-indigo-600 group-hover:scale-110 transition-transform" />
          </div>
        </div>
      </nav>
      <main>
        {children}
      </main>
    </div>
  );
};

export default Layout;
