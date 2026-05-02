import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, User, GraduationCap, Building, Upload, ArrowRight } from 'lucide-react';

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const nextStep = () => setStep(step + 1);

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('token', 'mock-token');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-['Poppins']">
      <div className="max-w-4xl w-full bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row">
        
        <div className="md:w-[40%] bg-indigo-600 p-12 text-white flex flex-col justify-between relative overflow-hidden">
           <div className="absolute top-0 right-0 p-10 opacity-10">
            <Zap className="w-64 h-64" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-8">
              <Zap className="w-6 h-6" />
              <span className="text-xl font-bold">RAVi</span>
            </div>
            <h2 className="text-4xl font-black mb-4">Start your journey.</h2>
            <p className="text-indigo-100 text-sm">Create your profile to unlock AI-driven career optimization and loan interest rewards.</p>
          </div>
          
          <div className="relative z-10 space-y-4">
            <div className={`h-1.5 rounded-full bg-indigo-400 overflow-hidden`}>
              <div className="h-full bg-white transition-all duration-500" style={{ width: `${(step/3)*100}%` }}></div>
            </div>
            <p className="text-xs font-black uppercase tracking-widest text-indigo-300">Step {step} of 3</p>
          </div>
        </div>

        <div className="flex-1 p-12">
          <form onSubmit={handleSignup}>
            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <h3 className="text-2xl font-black text-slate-900 mb-6">Basic Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                      <input type="text" className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium" placeholder="Alex Rivers" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">College/University</label>
                    <div className="relative">
                      <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                      <input type="text" className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium" placeholder="IIT Delhi" />
                    </div>
                  </div>
                  <button type="button" onClick={nextStep} className="w-full mt-6 bg-indigo-600 text-white font-bold py-5 rounded-[2rem] flex items-center justify-center gap-2 group">
                    Continue <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <h3 className="text-2xl font-black text-slate-900 mb-6">Academic Details</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Current CGPA</label>
                    <input type="number" step="0.1" className="w-full px-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium" placeholder="9.2" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Course of Study</label>
                    <div className="relative">
                      <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                      <input type="text" className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium" placeholder="Computer Science" />
                    </div>
                  </div>
                  <button type="button" onClick={nextStep} className="w-full mt-6 bg-indigo-600 text-white font-bold py-5 rounded-[2rem] flex items-center justify-center gap-2 group">
                    Next <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <h3 className="text-2xl font-black text-slate-900 mb-6">Verify & Upload</h3>
                <p className="text-slate-500 text-sm mb-8">Please upload your latest resume and ID proof to unlock your RAVi score.</p>
                
                <div className="space-y-6">
                  <div className="border-2 border-dashed border-slate-200 rounded-3xl p-8 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer group">
                    <div className="bg-white p-4 rounded-2xl shadow-sm mb-4 group-hover:scale-110 transition-transform">
                      <Upload className="text-indigo-600 w-6 h-6" />
                    </div>
                    <span className="font-bold text-slate-800">Upload Resume</span>
                    <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">PDF, DOCX up to 5MB</span>
                  </div>
                  
                  <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-5 rounded-[2rem] shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all">
                    Complete Registration
                  </button>
                </div>
              </div>
            )}
          </form>
          
          <p className="mt-10 text-center text-slate-400 text-sm font-medium">
            Already have an account? <Link to="/login" className="text-indigo-600 font-bold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
