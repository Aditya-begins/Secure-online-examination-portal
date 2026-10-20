import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  Search,
  Filter,
  ArrowUpDown,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { dbStore } from '../../services/store';

export const AdminResults: React.FC = () => {
  const attempts = dbStore.getAttempts().filter(a => a.status === 'submitted' || a.status.startsWith('auto_submitted'));
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExamId, setSelectedExamId] = useState('All');
  const [sortBy, setSortBy] = useState<'score' | 'date'>('score');

  const exams = dbStore.getExams();

  const filtered = attempts.filter(att => {
    const matchesSearch = att.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      att.examTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesExam = selectedExamId === 'All' || att.examId === selectedExamId;
    return matchesSearch && matchesExam;
  }).sort((a, b) => {
    if (sortBy === 'score') return (b.percentage || 0) - (a.percentage || 0);
    return new Date(b.submissionTime || 0).getTime() - new Date(a.submissionTime || 0).getTime();
  });

  const exportCSV = () => {
    const headers = ['Attempt ID', 'Student Name', 'Student ID', 'Exam Title', 'Marks Obtained', 'Total Marks', 'Percentage', 'Status', 'Warnings', 'Date'];
    const rows = filtered.map(a => [
      a.attemptId,
      `"${a.studentName}"`,
      a.studentId,
      `"${a.examTitle}"`,
      a.obtainedMarks,
      a.totalMarks,
      `${a.percentage}%`,
      a.passStatus,
      a.warningCount,
      new Date(a.submissionTime || a.startTime).toISOString(),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Examination_Master_Results_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Institutional Examination Results & Analytics</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Official candidate grades, pass/fail compliance metrics, and automated score exports.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-2 shadow-xs transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
          <button
            onClick={exportCSV}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-2 transition"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV Sheet</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-xs">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search candidate name or exam..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-600"
          />
        </div>

        <select
          value={selectedExamId}
          onChange={e => setSelectedExamId(e.target.value)}
          className="px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-600"
        >
          <option value="All">All Examinations</option>
          {exams.map(e => (
            <option key={e.examId} value={e.examId}>{e.title}</option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as any)}
          className="px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-600"
        >
          <option value="score">Sort by Highest Score</option>
          <option value="date">Sort by Recent Submission</option>
        </select>
      </div>

      {/* Results Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Candidate</th>
                <th className="py-3.5 px-4">Examination Title</th>
                <th className="py-3.5 px-4">Marks Obtained</th>
                <th className="py-3.5 px-4">Accuracy</th>
                <th className="py-3.5 px-4">Proctoring Warnings</th>
                <th className="py-3.5 px-4">Pass / Fail</th>
                <th className="py-3.5 px-4 text-right">Submission Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-600 dark:text-slate-300">
              {filtered.map(att => (
                <tr key={att.attemptId} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                    <div>{att.studentName}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono font-normal">{att.studentId}</div>
                  </td>
                  <td className="py-3.5 px-4 max-w-xs truncate">{att.examTitle}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                    {att.obtainedMarks} / {att.totalMarks}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-semibold">{att.percentage}%</td>
                  <td className="py-3.5 px-4 font-mono">
                    <span className={att.warningCount > 0 ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-emerald-600 dark:text-emerald-400'}>
                      {att.warningCount}/2 Warnings
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        att.passStatus === 'pass'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                      }`}
                    >
                      {att.passStatus?.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right text-slate-500 dark:text-slate-400 font-mono">
                    {new Date(att.submissionTime || att.startTime).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
