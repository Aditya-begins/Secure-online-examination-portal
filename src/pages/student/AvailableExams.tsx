import React, { useState } from 'react';
import {
  FileText,
  Clock,
  Award,
  Calendar,
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Info,
  X,
} from 'lucide-react';
import { dbStore } from '../../services/store';
import { Exam } from '../../types';
import { useAuth } from '../../services/auth';

interface AvailableExamsProps {
  onNavigate: (route: string) => void;
}

export const AvailableExams: React.FC<AvailableExamsProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const exams = dbStore.getExams();
  const studentAttempts = dbStore.getAttempts(currentUser?.userId);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [activeModalExam, setActiveModalExam] = useState<Exam | null>(null);

  const subjects = ['All', ...new Set(exams.map(e => e.subject))];

  const filteredExams = exams.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = selectedSubject === 'All' || e.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Available Examinations</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Browse accredited syllabus examinations, review instructions, and initiate proctored attempts.
          </p>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by exam title..."
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 pl-9 pr-4 py-2 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-600 w-56 shadow-xs"
            />
          </div>

          <select
            value={selectedSubject}
            onChange={e => setSelectedSubject(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 shadow-xs"
          >
            {subjects.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Exam Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredExams.map(exam => {
          const attempt = studentAttempts.find(a => a.examId === exam.examId);
          const isCompleted = attempt && (attempt.status === 'submitted' || attempt.status.startsWith('auto_submitted'));
          const isOngoing = attempt && attempt.status === 'in_progress';

          return (
            <div
              key={exam.examId}
              className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:border-blue-300 dark:hover:border-blue-700 shadow-sm transition-all duration-200"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 uppercase tracking-wider shrink-0 max-w-[70%] truncate">
                    {exam.subject}
                  </span>
                  {isCompleted ? (
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      Completed ({attempt?.percentage}%)
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {exam.durationMinutes} Mins
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">{exam.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                  {exam.description}
                </p>

                <div className="grid grid-cols-3 gap-2 my-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-center">
                  <div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Total Marks</p>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{exam.totalMarks}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Questions</p>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{exam.questionCount || 5}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Passing</p>
                    <p className="text-xs font-bold text-blue-600 dark:text-blue-400">{exam.passingMarks}</p>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1 mb-4">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Active until: {new Date(exam.endTime).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Proctoring: Face, Gaze, Audio, Screen (2 Warnings)</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                <button
                  onClick={() => setActiveModalExam(exam)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition"
                >
                  View Details
                </button>

                {isCompleted ? (
                  <button
                    onClick={() => onNavigate('/student/results')}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-blue-600 dark:text-blue-400 text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <span>View Scorecard</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : isOngoing ? (
                  <button
                    onClick={() => onNavigate(`/student/exam-session/${attempt.attemptId}`)}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 animate-pulse"
                  >
                    <span>Resume Attempt</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => onNavigate(`/student/system-check/${exam.examId}`)}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition flex items-center gap-1.5"
                  >
                    <span>Start Exam</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Exam Details Modal */}
      {activeModalExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 max-w-xl w-full p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl relative">
            <button
              onClick={() => setActiveModalExam(null)}
              className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 uppercase tracking-wider">
              {activeModalExam.subject}
            </span>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-2">{activeModalExam.title}</h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">{activeModalExam.description}</p>

            <div className="my-5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 grid grid-cols-4 gap-2 text-center text-xs">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-[10px]">Duration</p>
                <p className="font-bold text-slate-900 dark:text-white">{activeModalExam.durationMinutes}m</p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-[10px]">Total Marks</p>
                <p className="font-bold text-slate-900 dark:text-white">{activeModalExam.totalMarks}</p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-[10px]">Passing</p>
                <p className="font-bold text-blue-600 dark:text-blue-400">{activeModalExam.passingMarks}</p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-[10px]">Attempts</p>
                <p className="font-bold text-slate-900 dark:text-white">{activeModalExam.allowedAttempts}</p>
              </div>
            </div>

            <div className="space-y-2 mb-6">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Examination Rules</h4>
              <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                {activeModalExam.instructions.map((ins, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 mt-1.5 shrink-0" />
                    <span>{ins}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setActiveModalExam(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const examId = activeModalExam.examId;
                  setActiveModalExam(null);
                  onNavigate(`/student/system-check/${examId}`);
                }}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition"
              >
                Proceed to System Check
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
