import React, { useState } from 'react';
import {
  Award,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Download,
  Printer,
  ChevronRight,
  ShieldCheck,
  FileText,
  X,
  Sparkles,
} from 'lucide-react';
import { dbStore } from '../../services/store';
import { useAuth } from '../../services/auth';
import { ExamAttempt } from '../../types';

export const StudentResults: React.FC = () => {
  const { currentUser } = useAuth();
  const attempts = dbStore.getAttempts(currentUser?.userId).filter(
    a => a.status === 'submitted' || a.status.startsWith('auto_submitted')
  );

  const [selectedAttempt, setSelectedAttempt] = useState<ExamAttempt | null>(attempts[0] || null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const exam = selectedAttempt ? dbStore.getExam(selectedAttempt.examId) : null;
  const questions = selectedAttempt ? dbStore.getQuestions(selectedAttempt.examId) : [];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Examination Scorecards & Reports</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Verified academic evaluations, objective grading records, and authenticated examination certificates.
          </p>
        </div>

        {selectedAttempt && (
          <button
            onClick={() => setShowPrintModal(true)}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-2 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Generate Official Scorecard / PDF</span>
          </button>
        )}
      </div>

      {attempts.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-12 text-center rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <Award className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No Completed Examinations Found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Once you submit an examination, your official scorecard and question breakdown will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Attempts List */}
          <div className="lg:col-span-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">Completed Attempts</h3>
            {attempts.map(att => {
              const isSelected = selectedAttempt?.attemptId === att.attemptId;
              const isPass = att.passStatus === 'pass';
              return (
                <div
                  key={att.attemptId}
                  onClick={() => setSelectedAttempt(att)}
                  className={`p-4 rounded-3xl border transition cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/60 dark:bg-slate-800 shadow-sm'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">{att.examTitle}</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                      <span className="flex items-center gap-1 font-mono">
                        <Calendar className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                        {new Date(att.submissionTime || att.startTime).toLocaleDateString()}
                      </span>
                      <span>•</span>
                      <span>{att.status === 'submitted' ? 'Normal Submit' : 'Auto-Submitted'}</span>
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-black text-slate-900 dark:text-white">
                      {att.obtainedMarks} / {att.totalMarks}
                    </p>
                    <span
                      className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                        isPass
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                          : 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
                      }`}
                    >
                      {att.passStatus} ({att.percentage}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Selected Result View */}
          {selectedAttempt && (
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex items-start justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 uppercase tracking-wider">
                    {selectedAttempt.subject}
                  </span>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-1.5">{selectedAttempt.examTitle}</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Attempt ID: {selectedAttempt.attemptId}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-blue-600 dark:text-blue-400">{selectedAttempt.percentage}%</p>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                    Grade {selectedAttempt.percentage && selectedAttempt.percentage >= 90 ? 'A+' : selectedAttempt.percentage && selectedAttempt.percentage >= 75 ? 'A' : 'B'}
                  </span>
                </div>
              </div>

              {/* Metric stats */}
              <div className="grid grid-cols-4 gap-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center text-xs">
                <div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Total Marks</p>
                  <p className="font-bold text-slate-900 dark:text-white">{selectedAttempt.totalMarks}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Obtained</p>
                  <p className="font-bold text-blue-600 dark:text-blue-400">{selectedAttempt.obtainedMarks}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Warnings</p>
                  <p className="font-bold text-slate-900 dark:text-white">{selectedAttempt.warningCount}/2</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Status</p>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400 uppercase">{selectedAttempt.passStatus}</p>
                </div>
              </div>

              {/* Question Breakdown */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Evaluated Responses Breakdown
                </h4>
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {questions.map((q, idx) => {
                    const studentAns = selectedAttempt.answers[q.questionId]?.answer;
                    return (
                      <div
                        key={q.questionId}
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 dark:text-white">Q{idx + 1}: {q.questionText}</span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">[{q.marks} Marks]</span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300">
                          Your response:{' '}
                          <span className="text-blue-600 dark:text-blue-400 font-semibold font-mono">
                            {Array.isArray(studentAns) ? studentAns.join(', ') : studentAns || '(Unanswered)'}
                          </span>
                        </p>
                        {exam?.answerDisclosurePolicy === 'immediate' && q.explanation && (
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                            💡 <strong className="text-slate-800 dark:text-slate-200">Official Solution Note:</strong> {q.explanation}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Printable Scorecard Modal */}
      {showPrintModal && selectedAttempt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 max-w-2xl w-full p-8 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-2xl relative">
            <button
              onClick={() => setShowPrintModal(false)}
              className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Official Header */}
            <div className="text-center pb-6 border-b border-slate-200 dark:border-slate-800">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-2">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
                Apex Institute Examination Directorate
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Authenticated Online Examination Evaluation Certificate</p>
            </div>

            {/* Details Table */}
            <div className="grid grid-cols-2 gap-4 py-6 border-b border-slate-200 dark:border-slate-800 text-xs">
              <div>
                <p className="text-slate-500 dark:text-slate-400">Student Name:</p>
                <p className="font-bold text-slate-900 dark:text-white text-sm">{selectedAttempt.studentName}</p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">Student ID:</p>
                <p className="font-bold text-slate-900 dark:text-white font-mono text-sm">{selectedAttempt.studentId}</p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">Exam Title:</p>
                <p className="font-bold text-slate-900 dark:text-white">{selectedAttempt.examTitle}</p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">Subject / Code:</p>
                <p className="font-bold text-slate-900 dark:text-white">{selectedAttempt.subject}</p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">Examination Date:</p>
                <p className="font-bold text-slate-900 dark:text-white font-mono">
                  {new Date(selectedAttempt.submissionTime || selectedAttempt.startTime).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">Proctoring Warnings:</p>
                <p className="font-bold text-emerald-600 dark:text-emerald-400">{selectedAttempt.warningCount} Confirmed Infractions</p>
              </div>
            </div>

            {/* Final Grade Box */}
            <div className="my-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Final Evaluated Result</p>
                <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-0.5">
                  {selectedAttempt.obtainedMarks} / {selectedAttempt.totalMarks} Marks
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-black px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 uppercase">
                  {selectedAttempt.passStatus} ({selectedAttempt.percentage}%)
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Close
              </button>
              <button
                onClick={handlePrint}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Print Scorecard / Save PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
