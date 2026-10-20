import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  ScanFace,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../services/auth';
import { UserRole } from '../../types';

interface LoginPageProps {
  onNavigate: (route: string) => void;
  initialRole?: UserRole;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate, initialRole = 'student' }) => {
  const { login, loginWithBiometrics } = useAuth();
  const [activeTab, setActiveTab] = useState<UserRole>(initialRole);
  const [email, setEmail] = useState(
    initialRole === 'student' ? 'alex.mercer@university.edu' : 'adityaprakash281204@gmail.com'
  );
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [biometricScanActive, setBiometricScanActive] = useState(false);
  const [biometricSuccess, setBiometricSuccess] = useState(false);

  const handleTabChange = (role: UserRole) => {
    setActiveTab(role);
    setErrorMessage('');
    if (role === 'student') {
      setEmail('alex.mercer@university.edu');
      setPassword('password123');
    } else {
      setEmail('adityaprakash281204@gmail.com');
      setPassword('password123');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const res = await login(email, password, activeTab);
      if (res.success) {
        onNavigate(activeTab === 'admin' ? '/admin/dashboard' : '/student/dashboard');
      } else {
        setErrorMessage(res.error || 'Authentication failed. Please verify credentials.');
      }
    } catch {
      setErrorMessage('Unexpected server connection issue. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBiometricLogin = async () => {
    setBiometricScanActive(true);
    setErrorMessage('');

    // Simulate camera biometric capture & feature matching
    setTimeout(async () => {
      const res = await loginWithBiometrics(activeTab);
      if (res.success) {
        setBiometricSuccess(true);
        setTimeout(() => {
          setBiometricScanActive(false);
          onNavigate(activeTab === 'admin' ? '/admin/dashboard' : '/student/dashboard');
        }, 1000);
      } else {
        setBiometricScanActive(false);
        setErrorMessage(res.error || 'Biometric recognition failed. Please use your master password.');
      }
    }, 1800);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-200">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-blue-500/5 dark:bg-blue-500/10 rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full filter blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Card Header */}
        <div className="text-center mb-6">
          <div
            onClick={() => onNavigate('/')}
            className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600 text-white mb-3 shadow-md shadow-blue-500/20 cursor-pointer hover:scale-105 transition-transform"
          >
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">SECURE ONLINE EXAM PORTAL</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Smart Exams • Secure Environment • Intelligent Evaluation</p>
        </div>

        {/* Tab switch */}
        <div className="p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl mb-6 flex border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => handleTabChange('student')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'student'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>Student Login</span>
          </button>
          <button
            onClick={() => handleTabChange('admin')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'admin'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Admin Login</span>
          </button>
        </div>

        {/* Login Form Box */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl">
          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 flex items-center gap-2.5 text-xs text-red-700 dark:text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {biometricScanActive ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-24 h-24 mx-auto rounded-3xl border-2 border-blue-500 bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center relative overflow-hidden">
                <ScanFace className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-pulse" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/20 to-transparent animate-bounce" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {biometricSuccess ? 'Identity Verified Successfully' : 'Scanning Facial Biometric Reference...'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {biometricSuccess
                    ? 'Session authorized. Redirecting to workspace...'
                    : 'Matching enrolled facial landmark biometric template'}
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {activeTab === 'student' ? 'Student Institutional Email' : 'Official Administrator Email'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder={activeTab === 'student' ? 'alex.mercer@university.edu' : 'admin@university.edu'}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Remember device</span>
                </label>
                <button
                  type="button"
                  onClick={() => alert('Password reset verification instructions dispatched to registered email.')}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 font-semibold"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                <span>{isSubmitting ? 'Verifying Credentials...' : `Sign In as ${activeTab === 'student' ? 'Student' : 'Administrator'}`}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase">
                  <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 dark:text-slate-500 font-bold">Or authenticate with</span>
                </div>
              </div>

              {/* Biometric Face ID Login Button */}
              <button
                type="button"
                onClick={handleBiometricLogin}
                className="w-full py-2.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center gap-2 transition"
              >
                <ScanFace className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Webcam Face ID / Biometric Passkey</span>
              </button>
            </form>
          )}

          {/* Demo fast-fill shortcuts for reviewer convenience */}
          <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 text-center">
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2 font-medium">Quick Demo Credentials for Evaluation:</p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => {
                  handleTabChange('student');
                  setEmail('alex.mercer@university.edu');
                  setPassword('password123');
                }}
                className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-950/50 text-[11px] font-semibold text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700 transition"
              >
                Fill Student Demo
              </button>
              <button
                onClick={() => {
                  handleTabChange('admin');
                  setEmail('adityaprakash281204@gmail.com');
                  setPassword('password123');
                }}
                className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/50 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700 transition"
              >
                Fill Admin Demo
              </button>
            </div>
          </div>
        </div>

        {/* Register Footer Link */}
        <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-6">
          Don't have an enrolled account?{' '}
          <button
            onClick={() => onNavigate(activeTab === 'student' ? '/register/student' : '/register/admin')}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 font-bold ml-1"
          >
            Register as {activeTab === 'student' ? 'Student' : 'Authorized Admin'}
          </button>
        </p>
      </div>
    </div>
  );
};
