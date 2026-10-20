import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Filter,
  Search,
  Check,
  RotateCcw,
} from 'lucide-react';
import { dbStore } from '../../services/store';
import { ProctoringEvent } from '../../types';

export const ProctoringAlerts: React.FC = () => {
  const events = dbStore.getProctoringEvents();
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeReviewEvent, setActiveReviewEvent] = useState<ProctoringEvent | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [notice, setNotice] = useState('');

  // Sample seed events if empty
  const displayEvents: ProctoringEvent[] = events.length > 0 ? events : [
    {
      eventId: 'evt_sample_1',
      attemptId: 'att_sample_1',
      studentId: 'STU-2026-8812',
      studentName: 'Elena Rostova',
      examId: 'exam_cs401',
      examTitle: 'CS-401: Advanced Cloud Architecture',
      eventType: 'tab_switched',
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      confidence: 0.96,
      warningNumber: 1,
      actionTaken: 'warning_1',
      reviewStatus: 'pending',
    },
    {
      eventId: 'evt_sample_2',
      attemptId: 'att_sample_2',
      studentId: 'STU-2026-7731',
      studentName: 'Marcus Vance',
      examId: 'exam_cs401',
      examTitle: 'CS-401: Advanced Cloud Architecture',
      eventType: 'looking_away',
      timestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
      confidence: 0.88,
      warningNumber: 1,
      actionTaken: 'warning_1',
      reviewStatus: 'pending',
    },
    {
      eventId: 'evt_sample_3',
      attemptId: 'att_sample_3',
      studentId: 'STU-2026-5520',
      studentName: 'Julian Croft',
      examId: 'exam_sec502',
      examTitle: 'CYBER-502: Offensive Security',
      eventType: 'abnormal_noise',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      confidence: 0.85,
      warningNumber: 2,
      actionTaken: 'warning_2',
      reviewStatus: 'confirmed',
      adminNotes: 'Confirmed persistent background human speech during examination session.',
    },
  ];

  const filtered = displayEvents.filter(e => {
    const matchesSearch = e.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.eventType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || e.reviewStatus === filterType;
    return matchesSearch && matchesFilter;
  });

  const handleResolve = (status: 'confirmed' | 'dismissed_false_positive') => {
    if (!activeReviewEvent) return;
    dbStore.updateProctoringEventStatus(activeReviewEvent.eventId, status, reviewNotes);

    setNotice(`Incident ${status === 'confirmed' ? 'CONFIRMED' : 'DISMISSED AS FALSE POSITIVE'} successfully.`);
    setActiveReviewEvent(null);
    setReviewNotes('');
    setTimeout(() => setNotice(''), 3500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Proctoring Alerts & Appeal Review</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Human-in-the-loop review of AI-flagged candidate infractions and false-positive rectifications.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search candidate name..."
            className="px-3.5 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-600 w-52 shadow-xs"
          />
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="px-3.5 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 shadow-xs"
          >
            <option value="all">All Incident Statuses</option>
            <option value="pending">Pending Review</option>
            <option value="confirmed">Confirmed Violations</option>
            <option value="dismissed_false_positive">Dismissed False Positives</option>
          </select>
        </div>
      </div>

      {notice && (
        <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400" />
          <span>{notice}</span>
        </div>
      )}

      {/* Incidents Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Candidate</th>
                <th className="py-3.5 px-4">Violation Signal</th>
                <th className="py-3.5 px-4">Exam Context</th>
                <th className="py-3.5 px-4">Confidence</th>
                <th className="py-3.5 px-4">Severity Action</th>
                <th className="py-3.5 px-4">Review Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filtered.map(evt => (
                <tr key={evt.eventId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                    <div>{evt.studentName}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono font-normal">{evt.studentId}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-mono text-blue-600 dark:text-blue-400 uppercase font-semibold">
                      {evt.eventType.replace('_', ' ')}
                    </span>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </p>
                  </td>
                  <td className="py-3.5 px-4 truncate max-w-xs">{evt.examTitle}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                    {Math.round(evt.confidence * 100)}%
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      evt.actionTaken === 'auto_submitted'
                        ? 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
                        : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                    }`}>
                      {evt.actionTaken}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      evt.reviewStatus === 'confirmed'
                        ? 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                        : evt.reviewStatus === 'dismissed_false_positive'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                    }`}>
                      {evt.reviewStatus}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => setActiveReviewEvent(evt)}
                      className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 font-semibold text-xs border border-slate-200 dark:border-slate-700 transition"
                    >
                      Audit & Resolve
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {activeReviewEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 max-w-lg w-full p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Audit Proctoring Incident: {activeReviewEvent.studentName}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Review flagged landmark telemetry and record official resolution.
            </p>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2 text-xs mb-4">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Violation Type:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400 font-mono uppercase">{activeReviewEvent.eventType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Detection Confidence:</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">{Math.round(activeReviewEvent.confidence * 100)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Warning Triggered:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">Warning #{activeReviewEvent.warningNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Recorded Timestamp:</span>
                <span className="text-slate-700 dark:text-slate-300 font-mono">{new Date(activeReviewEvent.timestamp).toLocaleString()}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Administrator Audit Notes / Justification
              </label>
              <textarea
                rows={3}
                value={reviewNotes}
                onChange={e => setReviewNotes(e.target.value)}
                placeholder="e.g. Candidate looked down briefly to adjust eyewear; dismissed as false positive."
                className="w-full p-3 rounded-2xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="flex gap-2 justify-end mt-5">
              <button
                onClick={() => setActiveReviewEvent(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Close
              </button>
              <button
                onClick={() => handleResolve('dismissed_false_positive')}
                className="px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold transition flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Dismiss as False Positive</span>
              </button>
              <button
                onClick={() => handleResolve('confirmed')}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Confirm Infraction</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
