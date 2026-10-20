import React, { useState } from 'react';
import {
  Activity,
  Camera,
  Mic,
  Monitor,
  ShieldAlert,
  Clock,
  Eye,
  AlertTriangle,
  Send,
  CheckCircle2,
  Lock,
  UserCheck,
  RefreshCw,
} from 'lucide-react';
import { dbStore } from '../../services/store';

export const LiveMonitoring: React.FC = () => {
  const attempts = dbStore.getAttempts();
  const [activeFilter, setActiveFilter] = useState<'all' | 'flagged'>('all');
  const [selectedStudentForNotice, setSelectedStudentForNotice] = useState<string | null>(null);
  const [proctorMessage, setProctorMessage] = useState('');
  const [sentNotice, setSentNotice] = useState('');

  // Sample ongoing active candidate sessions
  const liveSessions = [
    {
      attemptId: 'live_1',
      studentName: 'Elena Rostova',
      studentId: 'STU-2026-8812',
      examTitle: 'CS-401: Advanced Cloud Architecture',
      startTime: '10:15 AM',
      timeRemaining: '24:12',
      cameraStatus: 'Active (30 FPS)',
      micStatus: 'Normal (32dB)',
      screenShareStatus: 'Primary Active',
      warningCount: 1,
      latestIncident: 'Tab switch detected (Confidence 95%)',
      status: 'in_progress',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    },
    {
      attemptId: 'live_2',
      studentName: 'Alex Mercer',
      studentId: 'STU-2026-9041',
      examTitle: 'CS-401: Advanced Cloud Architecture',
      startTime: '10:20 AM',
      timeRemaining: '29:45',
      cameraStatus: 'Active (30 FPS)',
      micStatus: 'Normal (22dB)',
      screenShareStatus: 'Primary Active',
      warningCount: 0,
      latestIncident: 'Clean telemetry',
      status: 'in_progress',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
    },
    {
      attemptId: 'live_3',
      studentName: 'Marcus Vance',
      studentId: 'STU-2026-7731',
      examTitle: 'CYBER-502: Offensive Security',
      startTime: '10:30 AM',
      timeRemaining: '38:10',
      cameraStatus: 'Active (30 FPS)',
      micStatus: 'Elevated (55dB)',
      screenShareStatus: 'Primary Active',
      warningCount: 0,
      latestIncident: 'Minor ambient background noise',
      status: 'in_progress',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    },
  ];

  const handleSendProctorNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proctorMessage.trim()) return;

    setSentNotice(`Notice transmitted to candidate ${selectedStudentForNotice}: "${proctorMessage}"`);
    setProctorMessage('');
    setSelectedStudentForNotice(null);
    setTimeout(() => setSentNotice(''), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Activity className="w-4 h-4 animate-pulse text-blue-600 dark:text-blue-400" />
            Live Surveillance Matrix
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Active Examination Sessions</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time candidate telemetry, biometric verification checks, and instant proctor intervention.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            3 Active Candidates Monitored
          </span>
        </div>
      </div>

      {sentNotice && (
        <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400" />
          <span>{sentNotice}</span>
        </div>
      )}

      {/* Live Sessions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {liveSessions.map(session => (
          <div
            key={session.attemptId}
            className={`bg-white dark:bg-slate-900 p-6 rounded-3xl border shadow-sm transition flex flex-col justify-between ${
              session.warningCount > 0 ? 'border-amber-300 dark:border-amber-700/80 bg-amber-50/20' : 'border-slate-200 dark:border-slate-800'
            }`}
          >
            <div>
              {/* Candidate Info Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
                <div className="flex items-center gap-3">
                  <img
                    src={session.avatar}
                    alt={session.studentName}
                    className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-xs"
                  />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{session.studentName}</h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{session.studentId}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      session.warningCount > 0
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                        : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    }`}
                  >
                    Warnings: {session.warningCount}/2
                  </span>
                </div>
              </div>

              {/* Exam Info */}
              <p className="text-xs font-bold text-slate-900 dark:text-white mb-3 truncate">{session.examTitle}</p>

              {/* Hardware Status Telemetry */}
              <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center text-[10px] mb-3">
                <div className="flex flex-col items-center gap-1">
                  <Camera className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-slate-600 dark:text-slate-300">Camera</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">30 FPS</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Mic className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-slate-600 dark:text-slate-300">Microphone</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">Clean</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Monitor className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-slate-600 dark:text-slate-300">Screen</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">Primary</span>
                </div>
              </div>

              {/* Latest Telemetry Incident */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[11px] mb-4">
                <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold">Telemetry Log:</p>
                <p className={`mt-0.5 font-semibold ${session.warningCount > 0 ? 'text-amber-700 dark:text-amber-300' : 'text-slate-700 dark:text-slate-200'}`}>
                  {session.latestIncident}
                </p>
                <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mt-2 font-mono">
                  <span>Started: {session.startTime}</span>
                  <span className="text-blue-600 dark:text-blue-400 font-bold">Rem: {session.timeRemaining}</span>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
              <button
                onClick={() => setSelectedStudentForNotice(session.studentName)}
                className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold text-xs border border-slate-200 dark:border-slate-700 transition flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Proctor Note</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Proctor Warning Modal */}
      {selectedStudentForNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 max-w-md w-full p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Transmit Proctor Notice to {selectedStudentForNotice}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              The message will immediately flash on the candidate's active examination viewport.
            </p>

            <form onSubmit={handleSendProctorNotice} className="space-y-4">
              <textarea
                rows={3}
                required
                value={proctorMessage}
                onChange={e => setProctorMessage(e.target.value)}
                placeholder="e.g. Please face directly forward into the camera frame and close auxiliary tabs."
                className="w-full p-3.5 rounded-2xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
              />

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedStudentForNotice(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20"
                >
                  Send Urgent Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
