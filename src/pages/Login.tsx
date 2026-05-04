import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { login } from '../services/api';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await login(email, password);
      localStorage.setItem('token', response.access_token);
      localStorage.setItem('user_email', email); // For dynamic profile display
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      let errorMessage = 'Login failed. Please check your credentials.';
      if (err.response?.data?.detail) {
        if (typeof err.response.data.detail === 'string') {
          errorMessage = err.response.data.detail;
        } else if (Array.isArray(err.response.data.detail) && err.response.data.detail.length > 0) {
          errorMessage = err.response.data.detail[0].msg;
        }
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row font-['Poppins']">
      <div className="flex-1 bg-indigo-600 p-12 flex flex-col justify-between text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-20 opacity-10">
          <Zap className="w-96 h-96" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-12">
            <Zap className="w-8 h-8" />
            <span className="text-2xl font-bold tracking-tight">CareerQuest RAVi</span>
          </div>
          <h1 className="text-6xl font-black leading-tight mb-6">Master Your Career <br />Path with AI.</h1>
          <p className="text-indigo-100 text-lg max-w-md">Join 50,000+ students leveraging RAVi's predictive intelligence to secure top internships and loan rewards.</p>
        </div>
        <div className="relative z-10 text-sm font-bold text-indigo-200 uppercase tracking-widest">
          © 2026 RAVi Intelligence Systems
        </div>
      </div>
      
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="max-w-md w-full">
          <h2 className="text-4xl font-black text-slate-900 mb-2">Welcome Back</h2>
          <p className="text-slate-500 mb-10 font-medium">Please enter your credentials to access your dashboard.</p>
          
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-sm font-bold animate-in fade-in slide-in-from-top-2 duration-300">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium" 
                  placeholder="alex@careerquest.ai" 
                  required 
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium" 
                  placeholder="••••••••" 
                  required 
                />
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-bold text-slate-600">Remember me</span>
              </label>
              <Link to="#" className="text-sm font-bold text-indigo-600 hover:underline">Forgot Password?</Link>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-indigo-600 text-white font-bold py-5 rounded-[2rem] hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 group disabled:opacity-70"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>Sign In <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
              )}
            </button>
          </form>

          <p className="mt-10 text-center text-slate-500 font-medium">
            Don't have an account? <Link to="/signup" className="text-indigo-600 font-bold hover:underline">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
