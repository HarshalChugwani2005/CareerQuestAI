import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Award, 
  Target, 
  ShieldCheck, 
  BarChart3, 
  Zap,
  Briefcase,
  FileText,
  UserCircle,
  Bell,
  Search
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getStudentScores, getMilestones } from '../services/api';
import SurvivalChart from '../components/SurvivalChart';

const Dashboard: React.FC = () => {
  const [studentId] = useState(1); 
  const [showModal, setShowModal] = useState<string | null>(null);
  const [isLaunching, setIsLaunching] = useState(false);
  
  const handleLaunch = () => {
    setIsLaunching(true);
    setTimeout(() => {
      setIsLaunching(false);
      setShowModal(null);
      // Simulate interest drop or score increase
      alert(`${showModal} complete! Your profile metrics have been updated.`);
    }, 2000);
  };

  const { data: scores, isLoading: scoresLoading } = useQuery({
    queryKey: ['scores', studentId],
    queryFn: () => getStudentScores(studentId),
    retry: 1
  });

  const { data: milestones } = useQuery({
    queryKey: ['milestones', studentId],
    queryFn: () => getMilestones(studentId),
  });

  // Mock Fallback for Demo if API fails or is empty
  const employabilityScore = scores?.xgboost?.placement_probability * 100 || 88;
  const reasonCodes = scores?.xgboost?.shap_reason_codes || ["+15: Strong LinkedIn Activity", "-05: Lower CGPA", "+10: Cloud Certifications"];
  const survivalData = scores?.deepsurv?.survival_curve || Array.from({length: 52}, (_, i) => ({ week: i+1, probability: Math.exp(-0.03 * (i+1)) }));
  const medianWeek = scores?.deepsurv?.median_placement_week || 14;

  return (
    <div className="bg-slate-50 font-['Poppins']">
      {/* Tool Modal Placeholder */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-0 max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="bg-indigo-600 p-10 text-white relative">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Zap className={`w-32 h-32 ${isLaunching ? 'animate-pulse' : ''}`} />
              </div>
              <p className="text-indigo-100 text-xs font-black uppercase tracking-[0.2em] mb-3">AI Powered Optimization</p>
              <h2 className="text-4xl font-black mb-2">RAVi {showModal}</h2>
              <p className="text-indigo-100 text-sm font-medium">
                {isLaunching ? 'Initializing neural engine & fetching market signals...' : 'Analyzing real-time market data & student behavioral telemetry...'}
              </p>
            </div>
            
            <div className="p-10">
              {isLaunching ? (
                <div className="flex flex-col items-center justify-center py-12">
                   <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-6"></div>
                   <p className="font-bold text-slate-800 text-lg">Running AI Analysis...</p>
                   <p className="text-slate-500 text-sm">Please wait while RAVi optimizes your profile.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-6 mb-8">
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Potential Score Boost</p>
                      <p className="text-3xl font-black text-indigo-600">+{Math.floor(Math.random() * 10) + 5} pts</p>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Interest Reduction</p>
                      <p className="text-3xl font-black text-emerald-600">-15 bps</p>
                    </div>
                  </div>

                  <div className="space-y-4 mb-10">
                    <div className="flex items-start gap-4 p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                      <ShieldCheck className="text-indigo-600 w-6 h-6 mt-1 shrink-0" />
                      <div>
                        <p className="font-bold text-slate-800 text-sm">Claude 3.5 Sonnet Insights</p>
                        <p className="text-slate-600 text-xs leading-relaxed mt-1">
                          Our AI identifies that improving your {showModal.toLowerCase()} metrics will significantly de-risk your profile for top-tier lenders. 
                          Complete the next 3 modules to unlock a permanent interest rate drop.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button onClick={() => setShowModal(null)} className="flex-1 bg-slate-100 text-slate-700 font-bold py-4 rounded-2xl hover:bg-slate-200 transition-all">Later</button>
                    <button onClick={handleLaunch} className="flex-1 bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all">Launch Module</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto p-6 lg:p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Welcome back, Alex! 👋</h1>
          <p className="text-slate-500 mt-1">Your employability profile was updated <span className="text-indigo-600 font-medium">2 hours ago</span>.</p>
        </header>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Employability Score Gauge (Bento Card) */}
          <div className="md:col-span-4 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <TrendingUp className="w-24 h-24 text-indigo-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-8 self-start">Employability Score</h3>
            
            <div className="relative w-48 h-48 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
                <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" 
                        strokeDasharray={552.9} strokeDashoffset={552.9 - (552.9 * employabilityScore) / 100}
                        strokeLinecap="round" className="text-indigo-600 transition-all duration-1000 ease-out" />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-5xl font-black text-slate-900">{Math.round(employabilityScore)}</span>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Platinum</span>
              </div>
            </div>
            
            <div className="mt-8 w-full">
              <p className="text-sm text-slate-600 text-center mb-4">You are in the <span className="text-indigo-600 font-bold">top 5%</span> of computer science graduates this month.</p>
              <button 
                onClick={() => setShowModal('Score Optimizer')}
                className="w-full bg-indigo-600 text-white font-bold py-3 rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95"
              >
                Improve Score
              </button>
            </div>
          </div>

          {/* Time to Employment Curve (Bento Card) */}
          <div className="md:col-span-8 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Time-to-Employment Curve</h3>
                <p className="text-sm text-slate-500">Multimodal survival analysis prediction</p>
              </div>
              <div className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-indigo-100">
                <ShieldCheck className="w-3 h-3" /> AI Verified
              </div>
            </div>
            <SurvivalChart data={survivalData} medianWeek={medianWeek} />
          </div>

          {/* XAI Reason Codes (Bento Card) */}
          <div className="md:col-span-5 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <BarChart3 className="text-indigo-600 w-5 h-5" /> 
              Score Reason Codes (XAI)
            </h3>
            <div className="space-y-4">
              {reasonCodes.map((code, index) => (
                <div key={index} className={`flex items-center justify-between p-4 rounded-2xl border ${code.startsWith('+') ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                  <span className={`text-sm font-semibold ${code.startsWith('+') ? 'text-emerald-700' : 'text-rose-700'}`}>{code}</span>
                  <div className={`w-2 h-2 rounded-full ${code.startsWith('+') ? 'bg-emerald-400' : 'bg-rose-400'}`}></div>
                </div>
              ))}
            </div>
          </div>

          {/* IRR Reward Tracker (Bento Card) */}
          <div className="md:col-span-7 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800">Interest Rate Milestones</h3>
              <div className="text-right">
                <p className="text-xs text-slate-500 font-medium">CURRENT RATE</p>
                <p className="text-2xl font-black text-indigo-600">12.25%</p>
              </div>
            </div>
            
            <div className="relative pl-10 space-y-12 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
              {/* Milestone 1 */}
              <div className="relative">
                <div className="absolute -left-[35px] top-1 w-6 h-6 rounded-full bg-emerald-500 border-4 border-white shadow-sm flex items-center justify-center">
                  <ShieldCheck className="text-white w-3 h-3" />
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-800">Profile Verification</h4>
                    <p className="text-sm text-slate-500">Identity and College verified</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-600">-10 bps applied</span>
                </div>
              </div>

              {/* Milestone 2 */}
              <div className="relative">
                <div className="absolute -left-[35px] top-1 w-6 h-6 rounded-full bg-indigo-600 border-4 border-white shadow-sm flex items-center justify-center">
                  <Award className="text-white w-3 h-3" />
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-800 text-indigo-600">50 Applications Milestone</h4>
                    <p className="text-sm text-slate-500">Active market participation tracked</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-bold text-indigo-600">-25 bps pending</span>
                    <div className="w-32 h-1.5 bg-slate-100 rounded-full mt-2">
                      <div className="h-full bg-indigo-600 rounded-full w-4/5"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Milestone 3 */}
              <div className="relative opacity-40">
                <div className="absolute -left-[35px] top-1 w-6 h-6 rounded-full bg-slate-300 border-4 border-white shadow-sm flex items-center justify-center">
                  <Target className="text-white w-3 h-3" />
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-800">Certification Achievement</h4>
                    <p className="text-sm text-slate-500">Industry recognized certificate</p>
                  </div>
                  <span className="text-xs font-bold text-slate-400">-20 bps locked</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions (Floating Bento Section) */}
          <div className="md:col-span-12 grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <button 
              onClick={() => setShowModal('Resume Optimizer')}
              className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-3 group"
            >
              <div className="p-3 rounded-2xl bg-orange-50 text-orange-600 group-hover:scale-110 transition-transform">
                <Briefcase className="w-6 h-6" />
              </div>
              <span className="font-bold text-sm text-slate-800 text-center">Resume Optimizer</span>
            </button>
            <button 
              onClick={() => setShowModal('Mock Interview')}
              className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-3 group"
            >
              <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6" />
              </div>
              <span className="font-bold text-sm text-slate-800 text-center">Mock Interview</span>
            </button>
            <button 
              onClick={() => setShowModal('Skill Assessments')}
              className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-3 group"
            >
              <div className="p-3 rounded-2xl bg-purple-50 text-purple-600 group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <span className="font-bold text-sm text-slate-800 text-center">Skill Assessments</span>
            </button>
            <button 
              onClick={() => setShowModal('Referral Network')}
              className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-3 group"
            >
              <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform">
                <Target className="w-6 h-6" />
              </div>
              <span className="font-bold text-sm text-slate-800 text-center">Referral Network</span>
            </button>
          </div>

        </div>
      </main>
    </div>
  );
};

export default Dashboard;
