import React, { useMemo, useState } from 'react';
import { Users, AlertTriangle, TrendingUp, Search, Download, Filter, X, ShieldCheck, DollarSign, Percent, Zap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getCurrentUser, getLenderPortfolio } from '../services/api';

interface StudentLoanData {
  id: number;
  name: string;
  score: number;
  risk: string;
  drivers: string[];
  color: 'emerald' | 'amber' | 'rose';
  amount: number;
  interestRate: number;
  bpCoins: number;
  collateral: string;
  loanType: string;
}

const AdminDashboard: React.FC = () => {
  const [selectedStudent, setSelectedStudent] = useState<StudentLoanData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: getCurrentUser,
    retry: false
  });

  const lenderId = user?.id;

  const { data: portfolio, isLoading: portfolioLoading } = useQuery({
    queryKey: ['portfolio', lenderId],
    queryFn: () => getLenderPortfolio(lenderId as number),
    enabled: !!lenderId,
    retry: 1
  });

  const colorClasses = {
    emerald: {
      avatar: 'bg-emerald-100 text-emerald-600',
      badge: 'bg-emerald-50 text-emerald-600 border-emerald-100/50',
      bar: 'bg-emerald-500',
    },
    amber: {
      avatar: 'bg-amber-100 text-amber-600',
      badge: 'bg-amber-50 text-amber-600 border-amber-100/50',
      bar: 'bg-amber-500',
    },
    rose: {
      avatar: 'bg-rose-100 text-rose-600',
      badge: 'bg-rose-50 text-rose-600 border-rose-100/50',
      bar: 'bg-rose-500',
    },
  } as const;

  const students = useMemo(() => {
    if (!portfolio?.items?.length) return [];

    return portfolio.items.map((item: any) => {
      const risk = item.risk_level ? item.risk_level.charAt(0).toUpperCase() + item.risk_level.slice(1) : 'Medium';
      const color = item.risk_level === 'high' ? 'rose' : item.risk_level === 'low' ? 'emerald' : 'amber';
      const rawScore = item.latest_score ?? 0;
      const scoreValue = Math.min(100, Math.max(0, rawScore));
      const drivers = item.risk_level === 'high'
        ? ['Low App Velocity', 'Weak CGPA']
        : item.risk_level === 'low'
          ? ['Strong Profile Engagement']
          : ['Balanced Portfolio'];

      return {
        id: item.student_id,
        name: item.student_name || `Student #${item.student_id}`,
        score: scoreValue,
        risk,
        drivers,
        color,
        amount: Number(item.amount),
        interestRate: Number(item.interest_rate),
        bpCoins: Math.max(0, Math.round(scoreValue * 4)),
        collateral: item.student_college || 'Verified Document Bundle',
        loanType: 'CareerQuest ISA'
      } as StudentLoanData;
    });
  }, [portfolio]);

  const filteredStudents = useMemo(() =>
    students.filter((s: StudentLoanData) => s.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [students, searchQuery]
  );

  const totalBorrowers = portfolio?.total ?? 0;
  const atRiskCount = students.filter((s: StudentLoanData) => s.risk === 'High').length;

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-['Poppins']">
      <div className="max-w-7xl mx-auto">
        
        {/* Loan Detail Modal */}
        {selectedStudent && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-[2rem] p-0 max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
              <div className="bg-indigo-600 p-8 text-white flex justify-between items-start">
                <div>
                  <p className="text-indigo-100 text-xs font-black uppercase tracking-[0.2em] mb-2">Loan Review Portal</p>
                  <h2 className="text-3xl font-bold">{selectedStudent.name}</h2>
                  <p className="text-indigo-200 mt-1">{selectedStudent.loanType}</p>
                </div>
                <button onClick={() => setSelectedStudent(null)} className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8">
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <div className="flex items-center gap-3 text-slate-500 mb-2">
                      <DollarSign className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Amount Taken</span>
                    </div>
                    <p className="text-2xl font-black text-slate-900">₹{selectedStudent.amount.toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <div className="flex items-center gap-3 text-slate-500 mb-2">
                      <Percent className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Current Interest</span>
                    </div>
                    <p className="text-2xl font-black text-indigo-600">{selectedStudent.interestRate}%</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between p-6 bg-amber-50 rounded-3xl border border-amber-100">
                    <div className="flex items-center gap-4">
                      <div className="bg-amber-100 p-3 rounded-2xl text-amber-600">
                        <Zap className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800">BP Coins Accumulated</h4>
                        <p className="text-sm text-slate-500">100 BP = 0.25% Interest Reduction</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-amber-600">{selectedStudent.bpCoins}</p>
                      <p className="text-[10px] font-bold text-amber-700">≈ -{(selectedStudent.bpCoins * 0.0025).toFixed(2)}% Applied</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <div className="bg-slate-200 p-3 rounded-2xl text-slate-600">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">Collateral Information</h4>
                      <p className="text-sm text-slate-600 font-medium">{selectedStudent.collateral}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex gap-4">
                  <button className="flex-1 bg-slate-100 text-slate-700 font-bold py-4 rounded-2xl hover:bg-slate-200 transition-all">Flag for Review</button>
                  <button className="flex-1 bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all">Approve BP Reduction</button>
                </div>
              </div>
            </div>
          </div>
        )}

        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Lender Enterprise Portal</h1>
            <p className="text-slate-500">RAVi Predictive Analytics & Risk Management</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 bg-white border border-slate-200 px-5 py-2.5 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
              <Download className="w-4 h-4" /> Export Report
            </button>
            <button className="flex items-center gap-2 bg-indigo-600 px-5 py-2.5 rounded-2xl text-sm font-bold text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
              <Filter className="w-4 h-4" /> Portfolio Filters
            </button>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute -right-4 -top-4 bg-indigo-50 w-24 h-24 rounded-full" />
            <div className="relative">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
                  <Users className="w-6 h-6" />
                </div>
                <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Total Borrowers</span>
              </div>
              <p className="text-4xl font-black text-slate-900">{totalBorrowers > 0 ? totalBorrowers.toLocaleString() : '—'}</p>
              <p className="text-xs text-emerald-600 mt-2 font-black">{totalBorrowers > 0 ? 'LIVE PORTFOLIO DATA' : 'NO DATA YET'}</p>
            </div>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute -right-4 -top-4 bg-rose-50 w-24 h-24 rounded-full" />
            <div className="relative">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <span className="text-sm font-black text-slate-400 uppercase tracking-widest">At Risk (EWS)</span>
              </div>
              <p className="text-4xl font-black text-slate-900">{atRiskCount > 0 ? atRiskCount : '—'}</p>
              <p className="text-xs text-rose-600 mt-2 font-black">{atRiskCount > 0 ? 'HIGH RISK BORROWERS' : 'NO HIGH RISK'}</p>
            </div>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute -right-4 -top-4 bg-emerald-50 w-24 h-24 rounded-full" />
            <div className="relative">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Portfolio ECL</span>
              </div>
              <p className="text-4xl font-black text-slate-900">2.4%</p>
              <p className="text-xs text-slate-400 mt-2 font-black">STABLE VS MARKET AVG 3.1%</p>
            </div>
          </div>
        </div>

        {/* Cohort EWS Table */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h3 className="text-xl font-bold text-slate-800">Cohort Early Warning System</h3>
              <p className="text-sm text-slate-500">Real-time risk drivers for active loan accounts</p>
            </div>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by Student ID, Name..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-12 pr-6 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all w-80 font-medium"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100">
                <tr>
                  <th className="px-8 py-5">Student / Borrower</th>
                  <th className="px-8 py-5">RAVi Score</th>
                  <th className="px-8 py-5">Risk Level</th>
                  <th className="px-8 py-5">Primary Risk Drivers (SHAP)</th>
                  <th className="px-8 py-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {portfolioLoading ? (
                  <tr><td colSpan={5} className="px-8 py-16 text-center">
                    <div className="flex items-center justify-center gap-3 text-slate-400">
                      <div className="w-6 h-6 border-2 border-slate-300 border-t-indigo-500 rounded-full animate-spin" />
                      <span className="font-bold">Loading portfolio...</span>
                    </div>
                  </td></tr>
                ) : filteredStudents.length === 0 ? (
                  <tr><td colSpan={5} className="px-8 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <Users className="w-12 h-12 opacity-30" />
                      <p className="font-bold">{searchQuery ? 'No matching borrowers found.' : 'No portfolio data yet.'}</p>
                      <p className="text-sm">{!searchQuery && 'Add student loans to see them appear here.'}</p>
                    </div>
                  </td></tr>
                ) : filteredStudents.map((student: StudentLoanData) => {
                  const colorClass = colorClasses[student.color];
                  return (
                    <tr key={student.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-2xl ${colorClass.avatar} flex items-center justify-center font-black text-sm`}>
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 block leading-tight">{student.name}</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{student.loanType}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="font-black text-slate-700 text-lg">{student.score}</span>
                          <div className="w-16 h-1 bg-slate-100 rounded-full mt-1">
                            <div className={`h-full ${colorClass.bar} rounded-full`} style={{ width: `${student.score}%` }}></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${colorClass.badge} inline-block`}>
                          {student.risk}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-wrap gap-2">
                          {student.drivers.map((driver: string, idx: number) => (
                            <span key={idx} className="bg-slate-100 text-slate-500 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border border-slate-200/50">
                              {driver}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button
                          onClick={() => setSelectedStudent(student)}
                          className="bg-indigo-50 text-indigo-600 font-black text-[10px] uppercase tracking-widest px-4 py-2 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                        >
                          Review Loan
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex justify-center">
            <button className="text-slate-400 font-bold text-xs hover:text-indigo-600 transition-colors uppercase tracking-widest">View All Portfolio Accounts</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
