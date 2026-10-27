import React, { useState, useEffect } from 'react';
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
  Monitor,
  KeyRound,
  ShieldAlert,
  Loader2,
  Trash2,
  Check,
} from 'lucide-react';
import { dbStore } from '../../services/store';
import { User, DeviceEnrollment, DeviceRecoveryRequest } from '../../types';

export const StudentManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'roster' | 'devices' | 'recovery'>('roster');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [users, setUsers] = useState<User[]>(() => dbStore.getUsers().filter(u => u.role === 'student'));
  const [selectedStudentHistory, setSelectedStudentHistory] = useState<User | null>(null);

  // Device & Recovery State
  const [devices, setDevices] = useState<any[]>([]);
  const [recoveryRequests, setRecoveryRequests] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);
  const [actionMessage, setActionMessage] = useState<string>('');

  const fetchDeviceData = async () => {
    setIsLoadingDevices(true);
    try {
      const res = await fetch('/api/auth/admin/device-management');
      const data = await res.json();
      if (res.ok) {
        setDevices(data.devices || []);
        setRecoveryRequests(data.recoveryRequests || []);
        setAuditLogs(data.auditLogs || []);
      }
    } catch (e) {
      console.warn('Could not load device management data:', e);
    } finally {
      setIsLoadingDevices(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'devices' || activeTab === 'recovery') {
      fetchDeviceData();
    }
  }, [activeTab]);

  const departments = ['All', ...new Set(users.map(u => u.department))];

  const handleToggleStatus = (user: User) => {
    const nextStatus = user.accountStatus === 'active' ? 'suspended' : 'active';
    dbStore.updateUser(user.userId, { accountStatus: nextStatus });
    setUsers(dbStore.getUsers().filter(u => u.role === 'student'));
  };

  const handleApproveRecovery = async (requestId: string) => {
    try {
      const res = await fetch('/api/auth/admin/approve-recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage('Device recovery request approved. Previous device enrollment revoked.');
        setTimeout(() => setActionMessage(''), 4000);
        fetchDeviceData();
      } else {
        alert(data.error || 'Failed to approve request');
      }
    } catch {
      alert('Network error communicating with server');
    }
  };

  const handleRevokeDevice = async (deviceId: string) => {
    if (!confirm('Are you sure you want to revoke this device enrollment? The student will need to re-verify or request a new binding.')) return;
    try {
      const res = await fetch('/api/auth/admin/revoke-device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, reason: 'Revoked by administrator' }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage('Device enrollment revoked.');
        setTimeout(() => setActionMessage(''), 4000);
        fetchDeviceData();
      }
    } catch {
      alert('Network error revoking device');
    }
  };

  const filtered = users.filter(u => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.studentId && u.studentId.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesDept = selectedDept === 'All' || u.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Institutional Student & Identity Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Candidate verification roster, single-device binding directory, and hardware recovery requests.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('roster')}
            className={`px-3 py-1.5 rounded-xl transition ${
              activeTab === 'roster'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Candidate Roster
          </button>
          <button
            onClick={() => setActiveTab('devices')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'devices'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Device Bindings</span>
          </button>
          <button
            onClick={() => setActiveTab('recovery')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'recovery'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Recovery Requests</span>
            {recoveryRequests.filter(r => r.status === 'pending').length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500" />
            )}
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* TAB 1: Candidate Roster */}
      {activeTab === 'roster' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search by name, ID, or email..."
                className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-600 shadow-xs"
              />
            </div>
            <select
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-600 shadow-xs"
            >
              {departments.map(d => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Candidate</th>
                    <th className="py-3.5 px-4">Student ID</th>
                    <th className="py-3.5 px-4">Department</th>
                    <th className="py-3.5 px-4">Biometrics</th>
                    <th className="py-3.5 px-4">Verifications</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-600 dark:text-slate-300">
                  {filtered.map(student => (
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
                      <td className="py-3.5 px-4 font-mono text-blue-600 dark:text-blue-400 font-bold">
                        {student.studentId}
                      </td>
                      <td className="py-3.5 px-4">{student.department}</td>
                      <td className="py-3.5 px-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          Enrolled
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[11px] space-y-0.5">
                        <div className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Email OTP
                        </div>
                        <div className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> SMS Verified
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                            student.accountStatus === 'active'
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          }`}
                        >
                          {student.accountStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedStudentHistory(student)}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 transition"
                          >
                            Exams
                          </button>
                          <button
                            onClick={() => handleToggleStatus(student)}
                            className={`p-1 rounded-lg border transition ${
                              student.accountStatus === 'active'
                                ? 'border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-600'
                                : 'border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-950 text-emerald-600'
                            }`}
                            title={student.accountStatus === 'active' ? 'Suspend Student Account' : 'Activate Student Account'}
                          >
                            {student.accountStatus === 'active' ? <Ban className="w-3.5 h-3.5" /> : <RotateCcw className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Device Bindings (One-Device-Per-Account) */}
      {activeTab === 'devices' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Monitor className="w-4 h-4 text-blue-600" />
                Active Device Enrollments
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Cryptographic hardware and browser credentials enrolled under the single-account policy.
              </p>
            </div>
            <button
              onClick={fetchDeviceData}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          {isLoadingDevices ? (
            <div className="py-12 text-center text-slate-400 flex items-center justify-center gap-2 text-xs">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span>Loading enrolled hardware records...</span>
            </div>
          ) : devices.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No registered devices recorded yet. New registrations will automatically bind devices here.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Candidate / Email</th>
                    <th className="py-3 px-4">Enrolled Hardware</th>
                    <th className="py-3 px-4">Credential Hash</th>
                    <th className="py-3 px-4">Enrolled At</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-300">
                  {devices.map((d: any) => (
                    <tr key={d.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{d.userName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{d.userEmail}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{d.deviceLabel}</span>
                        <div className="text-[10px] text-slate-400 truncate max-w-xs">{d.userAgent}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-[10px] text-slate-400">
                        {d.deviceCredentialHash.slice(0, 14)}...
                      </td>
                      <td className="py-3 px-4 text-[11px]">
                        {new Date(d.enrolledAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            d.enrollmentStatus === 'active'
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {d.enrollmentStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {d.enrollmentStatus === 'active' && (
                          <button
                            onClick={() => handleRevokeDevice(d.id)}
                            className="px-2.5 py-1 rounded-lg border border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-rose-600 text-[11px] font-semibold transition"
                          >
                            Revoke Binding
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Recovery Requests */}
      {activeTab === 'recovery' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-blue-600" />
                Hardware Replacement & Recovery Requests
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Administrator verification for candidates requiring device reset or replacement authorization.
              </p>
            </div>
            <button
              onClick={fetchDeviceData}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          {recoveryRequests.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No pending recovery requests at this time.
            </div>
          ) : (
            <div className="space-y-3">
              {recoveryRequests.map((req: any) => (
                <div
                  key={req.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white text-xs">{req.fullName}</span>
                      <span className="font-mono text-blue-600 text-[10px] font-bold">({req.studentId})</span>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          req.status === 'pending'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Email: <strong className="text-slate-700 dark:text-slate-300">{req.email}</strong> • Phone:{' '}
                      <strong className="text-slate-700 dark:text-slate-300">{req.phone || 'N/A'}</strong>
                    </div>
                    <div className="text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-750 max-w-xl">
                      <strong>Reason:</strong> {req.reason}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Submitted: {new Date(req.submittedAt).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {req.status === 'pending' ? (
                      <button
                        onClick={() => handleApproveRecovery(req.id)}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Authorize Device Reset</span>
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Approved
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Student History Modal */}
      {selectedStudentHistory && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {selectedStudentHistory.fullName}
                </h3>
                <p className="text-[11px] text-slate-500 font-mono">{selectedStudentHistory.studentId}</p>
              </div>
              <button onClick={() => setSelectedStudentHistory(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {dbStore.getAttempts(selectedStudentHistory.userId).length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No examination attempts found.</p>
              ) : (
                dbStore.getAttempts(selectedStudentHistory.userId).map(att => (
                  <div
                    key={att.attemptId}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{att.examTitle}</p>
                      <p className="text-[10px] text-slate-500">
                        Date: {new Date(att.submissionTime || att.startTime).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-600 dark:text-blue-400">
                        {att.obtainedMarks}/{att.totalMarks} ({att.percentage}%)
                      </p>
                      <span className="text-[9px] font-bold text-emerald-600 uppercase">{att.passStatus}</span>
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
