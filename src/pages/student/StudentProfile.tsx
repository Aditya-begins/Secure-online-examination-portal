import React, { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  Building,
  GraduationCap,
  ShieldCheck,
  Fingerprint,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../services/auth';
import { dbStore } from '../../services/store';

export const StudentProfile: React.FC = () => {
  const { currentUser } = useAuth();
  const [successNotice, setSuccessNotice] = useState('');
  const [faceEnrolled, setFaceEnrolled] = useState(currentUser?.faceEnrollmentStatus === 'enrolled');

  const auditLogs = dbStore.getAuditLogs().filter(l => l.actorId === currentUser?.userId);

  const handleDeleteBiometricData = () => {
    if (!currentUser) return;
    if (confirm('Are you sure you want to purge your enrolled facial reference template? You will need to re-enroll before taking proctored exams.')) {
      dbStore.updateUser(currentUser.userId, {
        faceEnrollmentStatus: 'pending',
        faceTemplateReference: undefined,
      });
      setFaceEnrolled(false);
      setSuccessNotice('Biometric reference template securely deleted from application storage.');
      setTimeout(() => setSuccessNotice(''), 4000);
    }
  };

  const handleReEnroll = () => {
    if (!currentUser) return;
    dbStore.updateUser(currentUser.userId, {
      faceEnrollmentStatus: 'enrolled',
      faceTemplateReference: `tmpl_enc_${Date.now()}_sha256`,
    });
    setFaceEnrolled(true);
    setSuccessNotice('Biometric facial landmark reference successfully enrolled.');
    setTimeout(() => setSuccessNotice(''), 4000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Candidate Profile & Security</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Review institutional identity details, manage biometric references, and view audit history.
        </p>
      </div>

      {successNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        <div className="md:col-span-4 flex flex-col items-center text-center pb-4 md:pb-0 md:border-r border-slate-200 dark:border-slate-800">
          <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-blue-500/80 mb-3 shadow-md shadow-blue-500/20">
            <img
              src={currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
              alt="Candidate"
              className="w-full h-full object-cover"
            />
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">{currentUser?.fullName}</h2>
          <p className="text-xs font-mono text-blue-600 dark:text-blue-400 font-bold mt-0.5">{currentUser?.studentId}</p>
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 mt-2">
            Active Candidate
          </span>
        </div>

        <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
            <p className="text-slate-500 dark:text-slate-400 text-[10px]">Email Address</p>
            <p className="font-semibold text-slate-900 dark:text-white mt-0.5">{currentUser?.email}</p>
            <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">✓ Verified</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
            <p className="text-slate-500 dark:text-slate-400 text-[10px]">Mobile Phone</p>
            <p className="font-semibold text-slate-900 dark:text-white mt-0.5">{currentUser?.phone}</p>
            <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">✓ OTP Verified</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
            <p className="text-slate-500 dark:text-slate-400 text-[10px]">Institution</p>
            <p className="font-semibold text-slate-900 dark:text-white mt-0.5">Apex Institute of Technology</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
            <p className="text-slate-500 dark:text-slate-400 text-[10px]">Department</p>
            <p className="font-semibold text-slate-900 dark:text-white mt-0.5">{currentUser?.department}</p>
          </div>
        </div>
      </div>

      {/* Biometric & Privacy Consent Management */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/60 flex items-center justify-center">
              <Fingerprint className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Biometric Facial Identity Reference</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Encrypted feature landmarks used for examination identity gates</p>
            </div>
          </div>

          {faceEnrolled ? (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Enrolled & Protected
            </span>
          ) : (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              Enrollment Pending
            </span>
          )}
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          <p className="font-mono text-[11px] text-blue-600 dark:text-blue-400 font-bold">
            Active Token: {currentUser?.faceTemplateReference || 'SHA256:7f90c3...b8e2'}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Raw camera frames are discarded immediately after landmark extraction. Only non-reversible encrypted mathematical vectors are retained for examination admission.
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          {faceEnrolled ? (
            <button
              onClick={handleDeleteBiometricData}
              className="px-4 py-2 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center gap-2 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Purge Biometric Data (Right to Erasure)</span>
            </button>
          ) : (
            <button
              onClick={handleReEnroll}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-xs"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Enroll Facial Template</span>
            </button>
          )}
        </div>
      </div>

      {/* Security Audit Activity */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>Security Audit Trail</span>
        </h3>
        <div className="space-y-2">
          {auditLogs.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No recent security events.</p>
          ) : (
            auditLogs.map(log => (
              <div
                key={log.logId}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-xs flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{log.action}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{log.details}</p>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
