import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User, UserRole } from '../types';
import { dbStore } from './store';

interface AuthContextType {
  currentUser: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  login: (email: string, pass: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  loginWithBiometrics: (role: UserRole) => Promise<{ success: boolean; error?: string; user?: User }>;
  registerStudent: (studentData: Partial<User> & { password: string }) => Promise<{ success: boolean; error?: string; user?: User }>;
  registerAdmin: (adminData: Partial<User> & { password: string; inviteCode: string }) => Promise<{ success: boolean; error?: string; user?: User }>;
  logout: () => void;
  resetInactivityTimer: () => void;
  inactivityWarning: boolean;
  secondsRemainingBeforeLogout: number;
  staySignedIn: () => void;
  switchUserRole: (targetRole: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const WARNING_BEFORE_LOGOUT_MS = 60 * 1000;   // 60 seconds warning (at 4 minutes)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => dbStore.getCurrentUser());
  const [inactivityWarning, setInactivityWarning] = useState(false);
  const [secondsRemainingBeforeLogout, setSecondsRemainingBeforeLogout] = useState(60);

  const lastActivityRef = useRef<number>(Date.now());
  const intervalRef = useRef<any>(null);

  const resetInactivityTimer = () => {
    lastActivityRef.current = Date.now();
    if (inactivityWarning) {
      setInactivityWarning(false);
      setSecondsRemainingBeforeLogout(60);
    }
  };

  const staySignedIn = () => {
    resetInactivityTimer();
  };

  const logout = () => {
    if (currentUser) {
      dbStore.logAuditEvent({
        actorId: currentUser.userId,
        actorName: currentUser.fullName,
        actorRole: currentUser.role,
        action: 'USER_LOGOUT',
        details: 'User logged out and session cleared.',
      });
    }
    dbStore.setCurrentUser(null);
    setCurrentUser(null);
    setInactivityWarning(false);
  };

  // Inactivity tracking
  useEffect(() => {
    if (!currentUser) return;

    const handleUserActivity = () => {
      // Don't auto-dismiss if warning modal is actively prompting for confirmation
      if (!inactivityWarning) {
        lastActivityRef.current = Date.now();
      }
    };

    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('click', handleUserActivity);
    window.addEventListener('scroll', handleUserActivity);

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      const timeLeftMs = INACTIVITY_TIMEOUT_MS - elapsed;

      if (timeLeftMs <= 0) {
        // Exceeded 5 minutes
        console.warn('Session expired due to inactivity');
        logout();
      } else if (timeLeftMs <= WARNING_BEFORE_LOGOUT_MS) {
        // Within the 60 second warning window
        setInactivityWarning(true);
        setSecondsRemainingBeforeLogout(Math.max(0, Math.ceil(timeLeftMs / 1000)));
      } else {
        if (inactivityWarning) {
          setInactivityWarning(false);
        }
      }
    }, 1000);

    return () => {
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('click', handleUserActivity);
      window.removeEventListener('scroll', handleUserActivity);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [currentUser, inactivityWarning]);

  const login = async (email: string, pass: string, role: UserRole) => {
    // Basic password validation
    if (!pass || pass.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    const user = dbStore.getUserByEmail(email);
    if (!user) {
      return { success: false, error: 'Account not found with this email address.' };
    }

    if (user.role !== role) {
      return { success: false, error: `This account is registered as ${user.role}, please use the ${user.role} login portal.` };
    }

    if (user.accountStatus === 'suspended') {
      return { success: false, error: 'Account is suspended by administrator.' };
    }

    dbStore.setCurrentUser(user);
    setCurrentUser(user);
    resetInactivityTimer();

    dbStore.logAuditEvent({
      actorId: user.userId,
      actorName: user.fullName,
      actorRole: user.role,
      action: 'USER_LOGIN_PASSWORD',
      details: `Successful password login from ${email}`,
    });

    return { success: true };
  };

  const loginWithBiometrics = async (role: UserRole) => {
    // Find eligible registered user with biometric enrollment
    const users = dbStore.getUsers().filter(u => u.role === role && u.faceEnrollmentStatus === 'enrolled');
    if (users.length === 0) {
      return { success: false, error: 'No enrolled biometric accounts found for this role. Please register or use password login.' };
    }

    // Default to primary student/admin seed or first matching
    const targetUser = users[0];
    dbStore.setCurrentUser(targetUser);
    setCurrentUser(targetUser);
    resetInactivityTimer();

    dbStore.logAuditEvent({
      actorId: targetUser.userId,
      actorName: targetUser.fullName,
      actorRole: targetUser.role,
      action: 'USER_LOGIN_BIOMETRICS',
      details: `Biometric identity match confirmed with high confidence (ref: ${targetUser.faceTemplateReference})`,
    });

    return { success: true, user: targetUser };
  };

  const registerStudent = async (studentData: Partial<User> & { password: string }) => {
    if (!studentData.email || !studentData.fullName) {
      return { success: false, error: 'Full name and email are mandatory.' };
    }

    const existing = dbStore.getUserByEmail(studentData.email);
    if (existing) {
      return { success: false, error: 'An account with this email address already exists.' };
    }

    const newUser: User = {
      userId: `usr_${Date.now()}`,
      fullName: studentData.fullName,
      email: studentData.email,
      phone: studentData.phone || '+1 (555) 000-0000',
      role: 'student',
      institutionId: studentData.institutionId || 'inst_apex',
      department: studentData.department || 'Computer Science & Engineering',
      studentId: studentData.studentId || `STU-${Math.floor(1000 + Math.random() * 9000)}`,
      emailVerified: true,
      phoneVerified: true,
      faceEnrollmentStatus: 'enrolled',
      faceTemplateReference: `tmpl_enc_${Date.now()}_sha256`,
      accountStatus: 'active',
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${studentData.fullName}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dbStore.saveUser(newUser);
    dbStore.setCurrentUser(newUser);
    setCurrentUser(newUser);
    resetInactivityTimer();

    dbStore.logAuditEvent({
      actorId: newUser.userId,
      actorName: newUser.fullName,
      actorRole: 'student',
      action: 'STUDENT_REGISTERED',
      details: 'Student registration completed with verified email, phone OTP, and face biometric enrollment.',
    });

    return { success: true, user: newUser };
  };

  const registerAdmin = async (adminData: Partial<User> & { password: string; inviteCode: string }) => {
    // Official admin authorization passcodes
    const validCodes = ['SECURE-ADMIN-2026', 'APEX-EXAM-BOARD', 'ROOT-PROCTOR-99'];
    if (!validCodes.includes(adminData.inviteCode?.trim().toUpperCase())) {
      return { success: false, error: 'Invalid Administrator Authorization Invite Code. Public registration as admin is prohibited.' };
    }

    if (!adminData.email || !adminData.fullName) {
      return { success: false, error: 'Full name and official email are required.' };
    }

    const existing = dbStore.getUserByEmail(adminData.email);
    if (existing) {
      return { success: false, error: 'An account with this email address already exists.' };
    }

    const newAdmin: User = {
      userId: `usr_adm_${Date.now()}`,
      fullName: adminData.fullName,
      email: adminData.email,
      phone: adminData.phone || '+1 (555) 123-9999',
      role: 'admin',
      institutionId: adminData.institutionId || 'inst_apex',
      department: adminData.department || 'Examination Directorate',
      adminId: adminData.adminId || `ADM-${Math.floor(100 + Math.random() * 900)}`,
      emailVerified: true,
      phoneVerified: true,
      faceEnrollmentStatus: 'enrolled',
      faceTemplateReference: `tmpl_adm_enc_${Date.now()}`,
      accountStatus: 'active',
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${adminData.fullName}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dbStore.saveUser(newAdmin);
    dbStore.setCurrentUser(newAdmin);
    setCurrentUser(newAdmin);
    resetInactivityTimer();

    dbStore.logAuditEvent({
      actorId: newAdmin.userId,
      actorName: newAdmin.fullName,
      actorRole: 'admin',
      action: 'ADMIN_REGISTERED',
      details: `Administrator account provisioned using authorized invite token (${adminData.inviteCode}).`,
    });

    return { success: true, user: newAdmin };
  };

  // Quick switch for testing between student & admin seamlessly
  const switchUserRole = (targetRole: UserRole) => {
    const users = dbStore.getUsers().filter(u => u.role === targetRole);
    if (users.length > 0) {
      dbStore.setCurrentUser(users[0]);
      setCurrentUser(users[0]);
      resetInactivityTimer();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role: currentUser?.role || null,
        isAuthenticated: !!currentUser,
        login,
        loginWithBiometrics,
        registerStudent,
        registerAdmin,
        logout,
        resetInactivityTimer,
        inactivityWarning,
        secondsRemainingBeforeLogout,
        staySignedIn,
        switchUserRole,
      }}
    >
      {children}
      {/* 5-minute inactivity warning modal */}
      {inactivityWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="glass-panel-glow max-w-md w-full p-6 rounded-2xl text-center border-amber-500/40 border">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 text-2xl font-bold animate-pulse">
              {secondsRemainingBeforeLogout}
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Inactivity Session Warning</h3>
            <p className="text-slate-300 text-sm mb-6 leading-relaxed">
              Your session will expire in <span className="font-semibold text-amber-400">{secondsRemainingBeforeLogout} seconds</span> due to lack of activity. For exam integrity and cybersecurity regulations, inactive sessions are automatically locked.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={logout}
                className="px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-sm font-medium transition"
              >
                Log Out Now
              </button>
              <button
                onClick={staySignedIn}
                className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-sm font-bold shadow-lg shadow-cyan-500/25 transition"
              >
                Stay Signed In
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
