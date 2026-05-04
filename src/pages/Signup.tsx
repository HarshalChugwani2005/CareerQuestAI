import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Zap, User, GraduationCap, Building, Upload, ArrowRight,
  ShieldCheck, Check, Loader2, MapPin, Lock
} from 'lucide-react';
import { registerUser, login, createStudentProfile } from '../services/api';

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    college: '',
    cgpa: '',
    course: '',
    city: '',
    graduation_year: new Date().getFullYear() + 1,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setResumeFile(file);
  };

  const nextStep = () => {
    setError(null);
    setStep(s => s + 1);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // 1. Register the user account
      await registerUser(formData.name, formData.email, formData.password, 'student');

      // 2. Auto-login to get a JWT token
      const loginResponse = await login(formData.email, formData.password);
      localStorage.setItem('token', loginResponse.access_token);

      // 3. Create student profile (best-effort — skip if data missing)
      if (formData.college && formData.cgpa && formData.course) {
        try {
          await createStudentProfile({
            college_name: formData.college,
            cgpa: parseFloat(formData.cgpa),
            course: formData.course,
            graduation_year: formData.graduation_year,
            city: formData.city || 'Not specified',
          });
        } catch (profileErr: any) {
          // Profile may already exist — not fatal
          console.warn('Student profile creation skipped:', profileErr?.response?.data?.detail);
        }
      }

      // 4. Navigate straight to dashboard — no more redirect to login
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
      setStep(1);
    } finally {
      setIsLoading(false);
    }
  };

  const validate = (): boolean => {
    if (step === 1) {
      if (!formData.name.trim()) { setError('Full name is required.'); return false; }
      if (!formData.email.trim()) { setError('Email is required.'); return false; }
      if (formData.password.length < 8) { setError('Password must be at least 8 characters.'); return false; }
    }
    setError(null);
    return true;
  };

  const handleNext = () => {
    if (validate()) nextStep();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-['Poppins']">
      <div className="max-w-4xl w-full bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row">

        {/* Left Panel */}
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
            <p className="text-indigo-100 text-sm">
              Create your profile to unlock AI-driven career optimization and loan interest rewards.
            </p>

            {/* Step checkmarks */}
            <div className="mt-8 space-y-3">
              {['Basic Information', 'Academic Details', 'Verify & Upload'].map((label, i) => (
                <div key={i} className={`flex items-center gap-3 text-sm font-bold ${step > i + 1 ? 'text-white' : step === i + 1 ? 'text-white' : 'text-indigo-300'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${step > i + 1 ? 'bg-white border-white' : step === i + 1 ? 'border-white' : 'border-indigo-400'}`}>
                    {step > i + 1 ? (
                      <Check className="w-3 h-3 text-indigo-600" />
                    ) : (
                      <span className="text-[10px]">{i + 1}</span>
                    )}
                  </div>
                  {label}
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 space-y-4">
            <div className="h-1.5 rounded-full bg-indigo-400 overflow-hidden">
              <div className="h-full bg-white transition-all duration-500" style={{ width: `${(step / 3) * 100}%` }} />
            </div>
            <p className="text-xs font-black uppercase tracking-widest text-indigo-300">Step {step} of 3</p>
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex-1 p-12">
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-sm font-bold animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}

          <form onSubmit={handleSignup}>
            {/* Step 1 — Basic Info */}
            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <h3 className="text-2xl font-black text-slate-900 mb-6">Basic Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                      <input
                        type="text"
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium outline-none"
                        placeholder="Your Full Name"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Email Address</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                      <input
                        type="email"
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium outline-none"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                      <input
                        type="password"
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium outline-none"
                        placeholder="Min. 8 characters"
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                        required
                        minLength={8}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">College / University</label>
                    <div className="relative">
                      <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                      <input
                        type="text"
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium outline-none"
                        placeholder="IIT Delhi"
                        value={formData.college}
                        onChange={e => setFormData({ ...formData, college: e.target.value })}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleNext}
                    className="w-full mt-6 bg-indigo-600 text-white font-bold py-5 rounded-[2rem] flex items-center justify-center gap-2 group hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                  >
                    Continue <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2 — Academic Details */}
            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <h3 className="text-2xl font-black text-slate-900 mb-6">Academic Details</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Current CGPA</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium outline-none"
                      placeholder="e.g. 8.5"
                      value={formData.cgpa}
                      onChange={e => setFormData({ ...formData, cgpa: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Course of Study</label>
                    <div className="relative">
                      <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                      <input
                        type="text"
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium outline-none"
                        placeholder="B.Tech Computer Science"
                        value={formData.course}
                        onChange={e => setFormData({ ...formData, course: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Graduation Year</label>
                    <input
                      type="number"
                      min={new Date().getFullYear()}
                      max={new Date().getFullYear() + 6}
                      className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium outline-none"
                      value={formData.graduation_year}
                      onChange={e => setFormData({ ...formData, graduation_year: parseInt(e.target.value) })}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">City</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                      <input
                        type="text"
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium outline-none"
                        placeholder="Mumbai"
                        value={formData.city}
                        onChange={e => setFormData({ ...formData, city: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 bg-slate-100 text-slate-700 font-bold py-5 rounded-[2rem] hover:bg-slate-200 transition-all"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={nextStep}
                      className="flex-1 bg-indigo-600 text-white font-bold py-5 rounded-[2rem] flex items-center justify-center gap-2 group hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                    >
                      Next <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3 — Resume Upload & Submit */}
            {step === 3 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <h3 className="text-2xl font-black text-slate-900 mb-2">Verify & Upload</h3>
                <p className="text-slate-500 text-sm mb-8">
                  Upload your resume to unlock your RAVi score. You can skip this and upload later from the dashboard.
                </p>

                <div className="space-y-6">
                  {/* Real file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer group ${
                      resumeFile
                        ? 'border-emerald-200 bg-emerald-50'
                        : 'border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200'
                    }`}
                  >
                    <div className={`${resumeFile ? 'bg-emerald-500 text-white' : 'bg-white text-indigo-600'} p-4 rounded-2xl shadow-sm mb-4 group-hover:scale-110 transition-transform`}>
                      {resumeFile ? <Check className="w-6 h-6" /> : <Upload className="w-6 h-6" />}
                    </div>
                    <span className={`font-bold ${resumeFile ? 'text-emerald-800' : 'text-slate-800'}`}>
                      {resumeFile ? resumeFile.name : 'Upload Resume (Optional)'}
                    </span>
                    <span className={`text-[10px] font-bold mt-1 uppercase tracking-widest ${resumeFile ? 'text-emerald-500' : 'text-slate-400'}`}>
                      {resumeFile
                        ? `${(resumeFile.size / 1024).toFixed(0)} KB — Click to change`
                        : 'PDF, DOC, DOCX up to 5MB'}
                    </span>
                  </div>

                  {/* Summary card */}
                  <div className="bg-indigo-50 rounded-2xl border border-indigo-100 p-5 space-y-3">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Registration Summary</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-slate-500">Name:</span> <span className="font-bold text-slate-800">{formData.name || '—'}</span></div>
                      <div><span className="text-slate-500">Email:</span> <span className="font-bold text-slate-800 truncate">{formData.email || '—'}</span></div>
                      <div><span className="text-slate-500">College:</span> <span className="font-bold text-slate-800">{formData.college || '—'}</span></div>
                      <div><span className="text-slate-500">CGPA:</span> <span className="font-bold text-slate-800">{formData.cgpa || '—'}</span></div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="flex-1 bg-slate-100 text-slate-700 font-bold py-5 rounded-[2rem] hover:bg-slate-200 transition-all"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 bg-emerald-600 text-white font-bold py-5 rounded-[2rem] shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /> Creating Account...</>
                      ) : (
                        <><ShieldCheck className="w-5 h-5" /> Complete Registration</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </form>

          <p className="mt-8 text-center text-slate-400 text-sm font-medium">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 font-bold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
