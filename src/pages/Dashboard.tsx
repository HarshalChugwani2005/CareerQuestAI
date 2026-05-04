import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  Award, 
  Target, 
  ShieldCheck, 
  Zap,
  FileText,
  Briefcase,
  Check,
  Loader2
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getStudentScores, getCurrentUser, getStudentMe, getIrrSavings, getStudentActivity } from '../services/api';
import SurvivalChart from '../components/SurvivalChart';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';

const Dashboard: React.FC = () => {
  const [showModal, setShowModal] = useState<string | null>(null);
  const [isLaunching, setIsLaunching] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // Scores state - null means not yet loaded (shows skeleton/empty state)
  const [score, setScore] = useState<number | null>(null);
  const [bps, setBps] = useState<number | null>(null);
  const [reasons, setReasons] = useState<string[]>([]);

  const [resumeTasks, setResumeTasks] = useState([
    { id: 1, text: 'Add quantified metrics (e.g. "Increased efficiency by 20%")', completed: false },
    { id: 2, text: 'Use active verbs at the start of bullets', completed: false },
    { id: 3, text: 'Include relevant keywords for ATS optimization', completed: false },
    { id: 4, text: 'Ensure layout is single-column and readable', completed: false },
  ]);

  const [points, setPoints] = useState({ earned: 1250, lost: 40 });

  const toggleResumeTask = (id: number) => {
    setResumeTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const handleLaunch = () => {
    setIsLaunching(true);
    setTimeout(() => {
      setIsLaunching(false);
      setIsComplete(true);
      if (score !== null) setScore(prev => Math.min((prev ?? 0) + 2, 100));
    }, 2000);
  };

  const closeModal = () => {
    setShowModal(null);
    setIsComplete(false);
  };

  const heatmapLegendClasses = [
    'bg-emerald-50', 'bg-emerald-200', 'bg-emerald-300', 'bg-emerald-400', 'bg-emerald-500',
  ];
  const heatmapFillClasses = [
    'fill-slate-100', 'fill-emerald-200', 'fill-emerald-300', 'fill-emerald-400', 'fill-emerald-500',
  ];

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['me'],
    queryFn: getCurrentUser,
    retry: false,
  });

  const { data: student, isLoading: studentLoading } = useQuery({
    queryKey: ['student-me'],
    queryFn: getStudentMe,
    retry: false,
  });

  const studentId = student?.id;

  const { data: scores, isLoading: scoresLoading } = useQuery({
    queryKey: ['scores', studentId],
    queryFn: () => getStudentScores(studentId as number),
    enabled: !!studentId,
    retry: 1,
  });

  const { data: irr, isLoading: irrLoading } = useQuery({
    queryKey: ['irr-savings', studentId],
    queryFn: () => getIrrSavings(studentId as number),
    enabled: !!studentId,
    retry: 1,
  });

  const { data: activityData } = useQuery({
    queryKey: ['activity', studentId],
    queryFn: () => getStudentActivity(studentId as number),
    enabled: !!studentId,
    retry: false,
  });

  useEffect(() => {
    if (scores?.xgboost?.placement_probability !== undefined) {
      setScore(Math.round(scores.xgboost.placement_probability * 100));
    }
    if (scores?.xgboost?.shap_reason_codes?.length) {
      setReasons(scores.xgboost.shap_reason_codes);
    }
  }, [scores]);

  useEffect(() => {
    if (irr?.effective_rate !== undefined) {
      setBps(irr.effective_rate);
    }
  }, [irr]);

  const survivalData = scores?.deepsurv?.survival_curve ?? [];
  const medianWeek = scores?.deepsurv?.median_placement_week ?? null;
  const heatmapValues: { date: string; count: number }[] = activityData ?? [];
  const noStudentProfile = !studentLoading && !student;
  const isDataLoading = userLoading || studentLoading;

  // Full-page spinner while auth loads
  if (isDataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  const scoreLabel = score === null ? '—' : String(score);
  const scoreTier = score === null ? '' : score >= 85 ? 'Platinum' : score >= 70 ? 'Gold' : score >= 50 ? 'Silver' : 'Bronze';
  const scoreDashOffset = score === null ? 552.92 : 552.92 - (552.92 * score) / 100;

  return (
    <div className="bg-slate-50 font-['Poppins']">
      {/* RAVi Module Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-0 max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
            <div className="bg-indigo-600 p-10 text-white relative">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Zap className={`w-32 h-32 ${isLaunching ? 'animate-pulse' : ''}`} />
              </div>
              <p className="text-indigo-100 text-xs font-black uppercase tracking-[0.2em] mb-3">AI Powered Optimization</p>
              <h2 className="text-4xl font-black mb-2">RAVi {showModal}</h2>
              <p className="text-indigo-100 text-sm font-medium">
                {isLaunching
                  ? 'Initializing neural engine & fetching market signals...'
                  : 'Analyzing real-time market data & student behavioral telemetry...'}
              </p>
            </div>

            <div className="p-10">
              {isLaunching ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-6" />
                  <p className="font-bold text-slate-800 text-lg">Running AI Analysis...</p>
                  <p className="text-slate-500 text-sm">Please wait while RAVi optimizes your profile.</p>
                </div>
              ) : isComplete ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 mb-8 flex items-center gap-4">
                    <div className="bg-emerald-500 p-3 rounded-2xl text-white">
                      <Check className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-emerald-900 font-bold">Optimization Success!</p>
                      <p className="text-emerald-700 text-xs">
                        Your employability score has been boosted to <strong>{score ?? '—'}</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {showModal === 'Mock Interview' && (
                      <div className="space-y-4">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Recommended Interview Questions</p>
                        {[
                          'How do you handle vanishing gradients in deep LSTMs?',
                          'Explain the bias-variance tradeoff in XGBoost models.',
                          'How would you deploy a Kafka-based real-time pipeline at scale?',
                        ].map((q, i) => (
                          <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm font-bold text-slate-700">
                            {q}
                          </div>
                        ))}
                      </div>
                    )}
                    {showModal === 'Resume Optimizer' && (
                      <div className="space-y-4">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Optimization Checklist</p>
                        <div className="space-y-2">
                          {resumeTasks.map(task => (
                            <div 
                              key={task.id} 
                              onClick={() => toggleResumeTask(task.id)}
                              className={`p-4 rounded-2xl border flex items-center gap-4 cursor-pointer transition-all ${
                                task.completed ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-indigo-200'
                              }`}
                            >
                              <div className={`w-5 h-5 rounded-md flex items-center justify-center border-2 transition-colors ${
                                task.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300'
                              }`}>
                                {task.completed && <Check className="w-3 h-3" />}
                              </div>
                              <span className={`text-sm font-bold ${task.completed ? 'line-through opacity-70' : ''}`}>
                                {task.text}
                              </span>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-slate-500 italic mt-4">Check off items as you update your resume to track progress.</p>
                      </div>
                    )}
                    {showModal === 'Skill Assessments' && (
                      <div className="space-y-6">
                        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                          <div className="flex justify-between items-center mb-4">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Aptitude Test</p>
                            <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">New</span>
                          </div>
                          <p className="text-sm font-bold text-slate-800 mb-4">Quantitative & Logical Reasoning Assessment</p>
                          <button className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl text-xs hover:bg-indigo-700 transition-all">Start Test</button>
                        </div>
                        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                          <div className="flex justify-between items-center mb-4">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Technical Test</p>
                            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Advanced</span>
                          </div>
                          <p className="text-sm font-bold text-slate-800 mb-4">Full-Stack Development & Data Structures</p>
                          <button className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl text-xs hover:bg-black transition-all">Start Test</button>
                        </div>
                      </div>
                    )}
                    {showModal === 'Score Optimizer' && (
                      <div className="space-y-4">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Priority Actions</p>
                        <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                          <p className="font-bold text-indigo-900 text-sm">Update GitHub Activity</p>
                          <p className="text-indigo-700 text-xs mt-1">
                            Our engine detected a drop in commit frequency. Increasing this will boost your Learning Velocity score.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <button onClick={closeModal} className="w-full mt-10 bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-black transition-all">
                    Back to Dashboard
                  </button>
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
                        <p className="font-bold text-slate-800 text-sm">RAVi AI Insights</p>
                        <p className="text-slate-600 text-xs leading-relaxed mt-1">
                          Our AI identifies that improving your {showModal.toLowerCase()} metrics will significantly
                          de-risk your profile for top-tier lenders. Complete the next 3 modules to unlock a permanent
                          interest rate drop.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={closeModal} className="flex-1 bg-slate-100 text-slate-700 font-bold py-4 rounded-2xl hover:bg-slate-200 transition-all">
                      Later
                    </button>
                    <button onClick={handleLaunch} className="flex-1 bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all">
                      Launch Module
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto p-6 lg:p-8">
        {/* Header */}
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-slate-900">
              {user?.name ? `Welcome back, ${user.name}! 👋` : 'Welcome to CareerQuest RAVi! 👋'}
            </h1>
            <p className="text-slate-500 mt-1">
              {noStudentProfile ? (
                <span className="text-amber-600 font-bold">
                  ⚠ Complete your student profile to unlock your RAVi score.
                </span>
              ) : (
                <>Your employability profile is <span className="text-indigo-600 font-bold">live</span>.</>
              )}
            </p>
          </div>
          <div className="hidden lg:block bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Interest Rate</p>
            {irrLoading ? (
              <div className="h-8 w-20 bg-slate-200 rounded-lg animate-pulse mt-1" />
            ) : bps !== null ? (
              <p className="text-2xl font-black text-indigo-600">{bps.toFixed(2)}%</p>
            ) : (
              <p className="text-2xl font-black text-slate-300">—</p>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Employability Score Bento */}
          <div className="md:col-span-4 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col items-center justify-between min-h-[500px]">
            <div className="text-center w-full">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 justify-center">
                <TrendingUp className="text-indigo-600 w-5 h-5" /> Employability Score
              </h3>

              <div className="relative w-48 h-48 mx-auto">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
                  {score !== null && (
                    <circle
                      cx="96" cy="96" r="88"
                      stroke="currentColor" strokeWidth="12" fill="transparent"
                      strokeDasharray={552.92}
                      strokeDashoffset={scoreDashOffset}
                      className="text-indigo-600 transition-all duration-1000 ease-out"
                      strokeLinecap="round"
                    />
                  )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  {scoresLoading ? (
                    <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                  ) : score !== null ? (
                    <>
                      <span className="text-5xl font-black text-slate-900">{scoreLabel}</span>
                      <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{scoreTier}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-4xl font-black text-slate-300">—</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center px-4 mt-1">No Score Yet</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 w-full">
              {score !== null && (
                <p className="text-xs text-slate-600 text-center mb-4 font-medium">
                  {score >= 85 ? 'Top 5% of graduates for current cycle.' : score >= 70 ? 'Above average for your cohort.' : 'Complete more modules to improve your score.'}
                </p>
              )}
              {noStudentProfile ? (
                <a
                  href="/signup"
                  className="block w-full text-center bg-amber-500 text-white font-bold py-4 rounded-2xl hover:bg-amber-600 shadow-lg shadow-amber-100 transition-all active:scale-95"
                >
                  Complete Your Profile
                </a>
              ) : (
                <button
                  onClick={() => setShowModal('Score Optimizer')}
                  className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95"
                >
                  Improve Score
                </button>
              )}
            </div>
          </div>

          {/* Activity Heatmap & Survival */}
          <div className="md:col-span-8 space-y-6">
            {/* Heatmap */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Target className="text-emerald-500 w-5 h-5" /> Learning Velocity (Last 30 Weeks)
                </h3>
                <div className="flex gap-1">
                  {heatmapLegendClasses.map((cls, i) => (
                    <div key={i} className={`w-3 h-3 rounded-sm ${cls}`} />
                  ))}
                </div>
              </div>
              {noStudentProfile ? (
                <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                  <Target className="w-12 h-12 mb-3 opacity-30" />
                  <p className="font-bold text-sm">Complete your profile to track activity</p>
                </div>
              ) : (
                <div className="activity-heatmap max-w-[600px] mx-auto overflow-hidden">
                  <CalendarHeatmap
                    startDate={new Date(Date.now() - 209 * 24 * 60 * 60 * 1000)}
                    endDate={new Date()}
                    values={heatmapValues}
                    classForValue={(value: any) => {
                      if (!value || value.count === 0) return heatmapFillClasses[0];
                      return heatmapFillClasses[Math.min(value.count, heatmapFillClasses.length - 1)];
                    }}
                  />
                  {heatmapValues.length === 0 && (
                    <p className="text-center text-xs text-slate-400 mt-3 font-medium">
                      No activity recorded yet. Start applying to see your velocity!
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Survival Chart */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Time-to-Employment Curve</h3>
                  <p className="text-sm text-slate-500">Multimodal survival analysis prediction</p>
                </div>
                <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> AI Verified
                </span>
              </div>
              {scoresLoading ? (
                <div className="h-40 bg-slate-100 rounded-2xl animate-pulse" />
              ) : survivalData.length > 0 ? (
                <>
                  <SurvivalChart data={survivalData} medianWeek={medianWeek ?? 14} />
                  {medianWeek && (
                    <p className="text-[10px] text-slate-400 font-bold mt-4 text-center uppercase tracking-widest">
                      Median expected employment at week <span className="text-indigo-600">{medianWeek}</span>
                    </p>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                  <TrendingUp className="w-12 h-12 mb-3 opacity-30" />
                  <p className="font-bold text-sm">Run your AI analysis to see this curve</p>
                  <p className="text-xs mt-1">Your survival curve will populate once your profile has been scored.</p>
                </div>
              )}
            </div>
          </div>

          {/* Score Reason Codes (XAI) */}
          <div className="md:col-span-12 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <FileText className="text-indigo-600 w-5 h-5" /> Score Reason Codes (XAI)
            </h3>
            {scoresLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => <div key={i} className="h-14 bg-slate-100 rounded-2xl animate-pulse" />)}
              </div>
            ) : reasons.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {reasons.map((code, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl flex items-center justify-between border ${
                      code.startsWith('+')
                        ? 'bg-emerald-50/50 border-emerald-100 text-emerald-700'
                        : 'bg-rose-50/50 border-rose-100 text-rose-700'
                    }`}
                  >
                    <span className="text-sm font-bold">{code}</span>
                    <div className={`w-2 h-2 rounded-full ${code.startsWith('+') ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <FileText className="w-10 h-10 mb-3 opacity-30" />
                <p className="font-bold text-sm text-center">No reason codes yet</p>
                <p className="text-xs text-center mt-1">Your XAI breakdown will appear here after your profile has been analyzed.</p>
              </div>
            )}
          </div>

          {/* RAVi Points Bento */}
          <div className="md:col-span-5 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Award className="text-amber-500 w-5 h-5" /> RAVi Points
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Earned</p>
                  <p className="text-3xl font-black text-emerald-700">+{points.earned}</p>
                </div>
                <div className="bg-rose-50 p-6 rounded-3xl border border-rose-100">
                  <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Penalty</p>
                  <p className="text-3xl font-black text-rose-700">-{points.lost}</p>
                </div>
              </div>
            </div>
            <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-xs text-slate-600 font-medium">
                You earned <span className="text-emerald-600 font-bold">150 pts</span> this week for "Consistent GitHub Activity".
              </p>
            </div>
          </div>

          {/* Interest Rate Milestones */}
          <div className="md:col-span-7 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-bold text-slate-800">Interest Rate Milestones</h3>
              <div className="text-right">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Current Rate</p>
                {irrLoading ? (
                  <div className="h-8 w-20 bg-slate-200 rounded-lg animate-pulse mt-1" />
                ) : bps !== null ? (
                  <p className="text-2xl font-black text-indigo-600">{bps.toFixed(2)}%</p>
                ) : (
                  <p className="text-2xl font-black text-slate-300">—</p>
                )}
              </div>
            </div>

            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600"><ShieldCheck className="w-5 h-5" /></div>
                  <div>
                    <span className="font-bold text-slate-800 block">Profile Verified</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Collateral: Fixed Deposit (₹10,00,000)</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-600">-10 bps applied</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600"><Award className="w-5 h-5" /></div>
                  <div>
                    <span className="font-bold text-slate-800 block">50 Applications</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Collateral: Residential Property (₹45,00,000)</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-indigo-600">-25 bps pending</span>
              </div>
            </div>
          </div>

          {/* Quick Action Modules */}
          <div className="md:col-span-12 grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            {[
              { label: 'Resume Optimizer', modal: 'Resume Optimizer', icon: <Briefcase className="w-6 h-6" />, color: 'bg-orange-50 text-orange-600' },
              { label: 'Mock Interview', modal: 'Mock Interview', icon: <Zap className="w-6 h-6" />, color: 'bg-blue-50 text-blue-600' },
              { label: 'Skill Assessments', modal: 'Skill Assessments', icon: <FileText className="w-6 h-6" />, color: 'bg-purple-50 text-purple-600' },
              { label: 'Referral Network', modal: 'Referral Network', icon: <Target className="w-6 h-6" />, color: 'bg-emerald-50 text-emerald-600' },
            ].map(({ label, modal, icon, color }) => (
              <button
                key={label}
                onClick={() => setShowModal(modal)}
                className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-3 group"
              >
                <div className={`p-3 rounded-2xl ${color} group-hover:scale-110 transition-transform`}>{icon}</div>
                <span className="font-bold text-sm text-slate-800 text-center">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
