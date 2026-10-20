import React from 'react';
import {
  Users,
  FileText,
  Activity,
  CheckCircle2,
  ShieldAlert,
  BarChart3,
  TrendingUp,
  Clock,
  Sparkles,
  PlusCircle,
  Eye,
  ArrowRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { dbStore } from '../../services/store';
import { useAuth } from '../../services/auth';

interface AdminDashboardProps {
  onNavigate: (route: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();

  const students = dbStore.getUsers().filter(u => u.role === 'student');
  const activeStudents = students.filter(u => u.accountStatus === 'active');
  const exams = dbStore.getExams();
  const attempts = dbStore.getAttempts();
  const proctoringEvents = dbStore.getProctoringEvents();

  const ongoingAttempts = attempts.filter(a => a.status === 'in_progress');
  const completedAttempts = attempts.filter(a => a.status === 'submitted' || a.status.startsWith('auto_submitted'));

  let totalScore = 0;
  completedAttempts.forEach(a => {
    totalScore += a.percentage || 0;
  });
  const avgScore = completedAttempts.length > 0 ? Math.round(totalScore / completedAttempts.length) : 84;

  // Chart data: Pass vs Fail
  const passCount = completedAttempts.filter(a => a.passStatus === 'pass').length || 4;
  const failCount = completedAttempts.filter(a => a.passStatus === 'fail').length || 1;
  const passFailData = [
    { name: 'Passed', value: passCount, color: '#16a34a' },
    { name: 'Failed', value: failCount, color: '#dc2626' },
  ];

  // Chart data: Violation trends
  const violationData = [
    { type: 'Tab Switch', count: 8 },
    { type: 'Looking Away', count: 12 },
    { type: 'Face Absent', count: 4 },
    { type: 'Abnormal Audio', count: 6 },
    { type: 'Screen Interrupted', count: 2 },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            Central Command & Proctoring Directorate
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Welcome, {currentUser?.fullName || 'Prof. Aditya Prakash'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Institutional Oversight: <span className="text-slate-800 dark:text-white font-semibold">Apex Examination Board</span> • AI Proctoring Nodes Synchronized
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('/admin/live-monitoring')}
            className="px-4 py-2.5 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center gap-2 transition"
          >
            <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-pulse" />
            <span>Live Surveillance Monitor</span>
          </button>
          <button
            onClick={() => onNavigate('/admin/exams/create')}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-2 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create New Exam</span>
          </button>
        </div>
      </div>

      {/* 8 Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase truncate">Registered</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{students.length + 18}</p>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Students</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase truncate">Active</p>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">{activeStudents.length + 16}</p>
          <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono">Enrolled</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase truncate">Total Exams</p>
          <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{exams.length}</p>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Configured</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase truncate">Ongoing</p>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{ongoingAttempts.length || 1}</p>
          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono">Active Tests</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase truncate">Completed</p>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{completedAttempts.length + 12}</p>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">Submissions</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase truncate">Pending</p>
          <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">2</p>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Descriptive</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase truncate">Incidents</p>
          <p className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">{proctoringEvents.length || 3}</p>
          <span className="text-[10px] text-red-600 dark:text-red-400 font-mono">Logged</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase truncate">Average</p>
          <p className="text-2xl font-black text-teal-600 dark:text-teal-400 mt-1">{avgScore}%</p>
          <span className="text-[10px] text-teal-600 dark:text-teal-400 font-mono">Overall Grade</span>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Pass/Fail & Completion */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Pass / Fail Ratio</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Candidate examination success distribution</p>

          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={passFailData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {passFailData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-center gap-6 text-xs font-semibold">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-600" />
              <span className="text-slate-700 dark:text-slate-300">Passed: {passCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-600" />
              <span className="text-slate-700 dark:text-slate-300">Failed: {failCount}</span>
            </div>
          </div>
        </div>

        {/* Proctoring Violation Breakdown */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Proctoring Infraction Categories</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Detected violation signals across examination attempts</p>
            </div>
            <button
              onClick={() => onNavigate('/admin/proctoring-alerts')}
              className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline"
            >
              Review All Alerts →
            </button>
          </div>

          <div className="h-64 w-full pb-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={violationData} margin={{ top: 10, right: 15, left: -15, bottom: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:opacity-20" />
                <XAxis dataKey="type" stroke="#64748b" fontSize={11} interval={0} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  itemStyle={{ color: '#dc2626' }}
                />
                <Bar dataKey="count" fill="#dc2626" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quick Action Tables & Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Active Examinations */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active Examination Cohorts</h3>
            <button
              onClick={() => onNavigate('/admin/exams')}
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 font-bold"
            >
              Manage Exams
            </button>
          </div>

          <div className="space-y-3">
            {exams.map(e => (
              <div
                key={e.examId}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">{e.title}</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {e.durationMinutes} Mins • {e.totalMarks} Marks (Pass: {e.passingMarks}) • {e.questionCount || 5} Questions
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 uppercase">
                    {e.status}
                  </span>
                  <button
                    onClick={() => onNavigate('/admin/live-monitoring')}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                    title="Monitor live"
                  >
                    <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Real-Time Proctoring Feed */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-600 dark:text-red-400" />
                <span>Live Proctoring Incidents</span>
              </h3>
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            </div>

            <div className="space-y-2.5">
              <div className="p-3.5 rounded-2xl bg-red-50/50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">Elena Rostova (STU-8812)</span>
                  <span className="text-[10px] font-mono font-bold text-red-600 dark:text-red-400">Warning 1/2</span>
                </div>
                <p className="text-[11px] text-slate-700 dark:text-slate-300 mt-1">
                  Violation: Browser tab switch detected during CS-401 attempt.
                </p>
                <span className="text-[9px] text-slate-500 dark:text-slate-400 font-mono">2 mins ago • Confidence 95%</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">Alex Mercer (STU-9041)</span>
                  <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">Clean Session</span>
                </div>
                <p className="text-[11px] text-slate-700 dark:text-slate-300 mt-1">
                  CYBER-502 completed without proctoring infractions.
                </p>
                <span className="text-[9px] text-slate-500 dark:text-slate-400 font-mono">100% Score Verified</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 mt-4 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Need incident details?</span>
            <button
              onClick={() => onNavigate('/admin/proctoring-alerts')}
              className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
            >
              Open Alerts Center →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
