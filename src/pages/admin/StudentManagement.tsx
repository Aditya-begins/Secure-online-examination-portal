import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Ban,
  RotateCcw,
  ShieldCheck,
  Mail,
  Phone,
  GraduationCap,
  X,
} from 'lucide-react';
import { dbStore } from '../../services/store';
import { User } from '../../types';

export const StudentManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [users, setUsers] = useState<User[]>(() => dbStore.getUsers().filter(u => u.role === 'student'));
  const [selectedStudentHistory, setSelectedStudentHistory] = useState<User | null>(null);

  const departments = ['All', ...new Set(users.map(u => u.department))];

  const handleToggleStatus = (user: User) => {
    const nextStatus = user.accountStatus === 'active' ? 'suspended' : 'active';
    dbStore.updateUser(user.userId, { accountStatus: nextStatus });
    setUsers(dbStore.getUsers().filter(u => u.role === 'student'));
  };

  const filtered = users.filter(u => {
    const matchesSearch = u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.studentId && u.studentId.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesDept = selectedDept === 'All' || u.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Institutional Student Directory</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Student roster, verified biometric enrollment statuses, and account access management.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by name, ID, or email..."
              className="pl-9 pr-3.5 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-600 shadow-xs w-64"
            />
          </div>
          <select
            value={selectedDept}
            onChange={e => setSelectedDept(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-600 shadow-xs"
          >
            {departments.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Candidate</th>
                <th className="py-3.5 px-4">Student ID</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Biometric Enrollment</th>
                <th className="py-3.5 px-4">Email / Phone</th>
                <th className="py-3.5 px-4">Account Status</th>
                <th className="py-3.5 px-4 text-right">Access Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-600 dark:text-slate-300">
              {filtered.map(student => {
                const attempts = dbStore.getAttempts(student.userId);
                return (
                  <tr key={student.userId} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                      <img
                        src={student.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'}
                        alt={student.fullName}
                        className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
                      />
                      <div>
                        <div>{student.fullName}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">{student.email}</div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-blue-600 dark:text-blue-400 font-bold">{student.studentId}</td>
                    <td className="py-3.5 px-4">{student.department}</td>
                    <td className="py-3.5 px-4">
                      {student.faceEnrollmentStatus === 'enrolled' ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          Enrolled (Protected)
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          Pending Setup
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-[11px]">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓ Verified</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        student.accountStatus === 'active'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                      }`}>
                        {student.accountStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedStudentHistory(student)}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-slate-700 text-blue-700 dark:text-blue-300 font-semibold text-xs border border-blue-200 dark:border-slate-700 transition"
                      >
                        History ({attempts.length})
                      </button>
                      <button
                        onClick={() => handleToggleStatus(student)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                          student.accountStatus === 'active'
                            ? 'border-red-200 dark:border-red-800/80 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50'
                            : 'border-emerald-200 dark:border-emerald-800/80 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50'
                        }`}
                      >
                        {student.accountStatus === 'active' ? 'Suspend' : 'Reactivate'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student History Modal */}
      {selectedStudentHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 max-w-xl w-full p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl relative">
            <button
              onClick={() => setSelectedStudentHistory(null)}
              className="absolute top-5 right-5 p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Examination History: {selectedStudentHistory.fullName}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Student ID: {selectedStudentHistory.studentId} • Department: {selectedStudentHistory.department}
            </p>

            <div className="space-y-2.5 max-h-72 overflow-y-auto mb-5 pr-1">
              {dbStore.getAttempts(selectedStudentHistory.userId).length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No examination attempts on record.</p>
              ) : (
                dbStore.getAttempts(selectedStudentHistory.userId).map(att => (
                  <div key={att.attemptId} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{att.examTitle}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">Date: {new Date(att.submissionTime || att.startTime).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-600 dark:text-blue-400">{att.obtainedMarks}/{att.totalMarks} ({att.percentage}%)</p>
                      <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">{att.passStatus}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedStudentHistory(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
