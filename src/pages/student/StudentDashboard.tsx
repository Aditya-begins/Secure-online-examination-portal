import React from 'react';
import {
  FileText,
  Clock,
  Award,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Play,
  Flame,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useAuth } from '../../services/auth';
import { dbStore } from '../../services/store';

interface StudentDashboardProps {
  onNavigate: (route: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const studentId = currentUser?.userId;

  const exams = dbStore.getExams();
  const attempts = dbStore.getAttempts(studentId);
  const mockTests = dbStore.getMockTests(studentId);

  const completedAttempts = attempts.filter(a => a.status === 'submitted' || a.status.startsWith('auto_submitted'));
  const totalExamsAttempted = attempts.length;
  const upcomingExams = exams.filter(e => e.status === 'published');

  // Compute average score & highest score
  let totalScorePercentage = 0;
  let highestScore = 0;

  completedAttempts.forEach(att => {
    const pct = att.percentage ?? 0;
    totalScorePercentage += pct;
    if (pct > highestScore) highestScore = pct;
  });

  const averageScore = completedAttempts.length > 0
    ? Math.round(totalScorePercentage / completedAttempts.length)
    : 0;

  const performanceLevel = averageScore >= 90 ? 'Mastery (Grade A+)' : averageScore >= 75 ? 'Advanced (Grade A)' : averageScore >= 60 ? 'Competent (Grade B)' : 'Developing';

  // Chart data: Performance over time
  const lineData = completedAttempts.map((att, i) => ({
    name: `Exam ${i + 1}`,
    score: att.percentage ?? 0,
    examTitle: att.examTitle.split(':')[0],
  }));

  if (lineData.length === 0) {
    lineData.push({ name: 'Baseline', score: 85, examTitle: 'Diagnostic' });
  }

  // Chart data: Subject performance
  const barData = [
    { subject: 'Cloud Sys', score: 94 },
    { subject: 'Cybersecurity', score: 100 },
    { subject: 'Algorithms', score: 88 },
    { subject: 'AI / ML', score: 82 },
  ];

  return (
    <div className="space-y-8">
      {/* Personalized Greeting Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            Candidate Academic Workspace
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Welcome Back, {currentUser?.fullName || 'Alex Mercer'}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Student ID: <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">{currentUser?.studentId || 'STU-2026-9041'}</span> • {currentUser?.department || 'Computer Science'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('/student/mock-tests')}
            className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-2 transition shadow-xs"
          >
            <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Practice Mock Test</span>
          </button>
          <button
            onClick={() => onNavigate('/student/exams')}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-2 transition"
          >
            <FileText className="w-4 h-4" />
            <span>View Available Exams</span>
          </button>
        </div>
      </div>

      {/* 7 Stat Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-7 gap-3">
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold leading-tight min-h-[1.25rem]">Exams Attempted</p>
          <div className="mt-1">
            <p className="text-2xl font-black text-slate-900 dark:text-white">{totalExamsAttempted}</p>
            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">Verified attempts</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold leading-tight min-h-[1.25rem]">Upcoming Exams</p>
          <div className="mt-1">
            <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{upcomingExams.length}</p>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">Scheduled on portal</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold leading-tight min-h-[1.25rem]">Completed Exams</p>
          <div className="mt-1">
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{completedAttempts.length}</p>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Evaluated</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold leading-tight min-h-[1.25rem]">Average Score</p>
          <div className="mt-1">
            <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{averageScore}%</p>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">Overall accuracy</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold leading-tight min-h-[1.25rem]">Highest Score</p>
          <div className="mt-1">
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{highestScore}%</p>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Top performance</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold leading-tight min-h-[1.25rem]">Mock Tests</p>
          <div className="mt-1">
            <p className="text-2xl font-black text-purple-600 dark:text-purple-400">{mockTests.length}</p>
            <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">Completed</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs col-span-2 sm:col-span-1 flex flex-col justify-between">
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold leading-tight min-h-[1.25rem]">Academic Standing</p>
          <div className="mt-1">
            <p className="text-sm font-black text-blue-600 dark:text-blue-400">{performanceLevel}</p>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium mt-0.5">
              <Flame className="w-3 h-3 text-amber-500" /> Standing Status
            </span>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Performance Line Chart */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Examination Score Progression</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Score percentage achieved across formal proctored attempts</p>
            </div>
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800">
              Verified Grades
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:opacity-20" />
                <XAxis dataKey="examTitle" stroke="#64748b" fontSize={11} />
                <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  itemStyle={{ color: '#2563eb' }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ fill: '#2563eb', r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subject-wise Bar Chart */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Subject Mastery</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Proficiency percentage by domain</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:opacity-20" />
                <XAxis dataKey="subject" stroke="#64748b" fontSize={11} />
                <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  itemStyle={{ color: '#4f46e5' }}
                />
                <Bar dataKey="score" fill="#4f46e5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Available Exams & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Next Exam Card */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              Ready for Attempt
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono">
              <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Oct 15 - Oct 30, 2026
            </span>
          </div>

          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            CS-401: Advanced Cloud Architecture & Distributed Systems
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
            Raft/Paxos consensus algorithms, fault-tolerant microservices, distributed cache synchronization, and zero-trust perimeter defense.
          </p>

          <div className="grid grid-cols-3 gap-3 my-4 py-3 border-y border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-[10px]">Duration</p>
              <p className="font-bold text-slate-900 dark:text-white">45 Minutes</p>
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-[10px]">Total Marks</p>
              <p className="font-bold text-slate-900 dark:text-white">35 Marks (Pass: 18)</p>
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-[10px]">Proctoring</p>
              <p className="font-bold text-blue-600 dark:text-blue-400">Strict AI (2-Warn)</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              onClick={() => onNavigate('/student/exams')}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
            >
              View Instructions
            </button>
            <button
              onClick={() => onNavigate('/student/system-check/exam_cs401')}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-2 transition"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Start 7-Point Pre-Check</span>
            </button>
          </div>
        </div>

        {/* Recent Results Widget */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Latest Examination Results</h3>
              <button
                onClick={() => onNavigate('/student/results')}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 font-semibold"
              >
                View All
              </button>
            </div>

            <div className="space-y-3">
              {completedAttempts.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No completed examinations yet.</p>
              ) : (
                completedAttempts.slice(0, 3).map(att => (
                  <div
                    key={att.attemptId}
                    onClick={() => onNavigate(`/student/results`)}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 hover:border-blue-400 transition cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">{att.examTitle.split(':')[0]}</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {new Date(att.submissionTime || att.startTime).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-slate-900 dark:text-white">
                        {att.obtainedMarks}/{att.totalMarks} <span className="text-blue-600 dark:text-blue-400">({att.percentage}%)</span>
                      </p>
                      <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        {att.passStatus}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 mt-4 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Need exam assistance?</span>
            <span className="text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1 cursor-pointer hover:underline">
              Ask AI Assistant <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
