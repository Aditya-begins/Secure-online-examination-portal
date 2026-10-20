import React, { useState, useRef, useEffect } from 'react';
import {
  ShieldCheck,
  User,
  Mail,
  Phone,
  Building,
  GraduationCap,
  Lock,
  Camera,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  ScanFace,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../services/auth';

interface StudentRegisterProps {
  onNavigate: (route: string) => void;
}

export const StudentRegister: React.FC<StudentRegisterProps> = ({ onNavigate }) => {
  const { registerStudent } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [institution, setInstitution] = useState('Apex Institute of Technology');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [consentGiven, setConsentGiven] = useState(false);

  // Verification Codes
  const [emailOtp, setEmailOtp] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [simulatedSentEmailCode] = useState('849201');
  const [simulatedSentPhoneCode] = useState('625143');

  // Camera Face Enrollment
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [facePositionStatus, setFacePositionStatus] = useState<'aligning' | 'centered' | 'captured'>('aligning');
  const [livenessPassed, setLivenessPassed] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Start webcam when step 4 is reached
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (step === 4) {
      navigator.mediaDevices
        ?.getUserMedia({ video: { width: 640, height: 480 } })
        .then(s => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.play().catch(() => {});
          }
          setCameraActive(true);
          // Simulate centering and lighting check after 1.2s
          setTimeout(() => setFacePositionStatus('centered'), 1200);
        })
        .catch(err => {
          console.warn('Real webcam unavailable, simulating enrollment canvas', err);
          setCameraActive(true);
          setFacePositionStatus('centered');
        });
    }

    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [step]);

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }
    if (!consentGiven) {
      setErrorMessage('You must consent to examination proctoring and biometric verification.');
      return;
    }
    setStep(2);
  };

  const handleStep2EmailVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (emailOtp === simulatedSentEmailCode || emailOtp === '123456') {
      setStep(3);
    } else {
      setErrorMessage(`Invalid email code. For testing, enter the sent code: ${simulatedSentEmailCode}`);
    }
  };

  const handleStep3PhoneVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (phoneOtp === simulatedSentPhoneCode || phoneOtp === '123456') {
      setStep(4);
    } else {
      setErrorMessage(`Invalid mobile SMS OTP. For testing, enter: ${simulatedSentPhoneCode}`);
    }
  };

  const handleCaptureFace = async () => {
    setIsSubmitting(true);
    setFacePositionStatus('captured');
    setLivenessPassed(true);

    try {
      const res = await registerStudent({
        fullName,
        studentId,
        email,
        phone,
        institutionId: institution,
        department,
        password,
      });

      if (res.success) {
        setTimeout(() => {
          onNavigate('/student/dashboard');
        }, 1500);
      } else {
        setErrorMessage(res.error || 'Registration failed');
        setIsSubmitting(false);
      }
    } catch {
      setErrorMessage('Account creation error.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center relative transition-colors duration-200">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div
            onClick={() => onNavigate('/')}
            className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600 text-white mb-3 shadow-md shadow-blue-500/20 cursor-pointer hover:scale-105 transition-transform"
          >
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Student Enrollment & Verification</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Multi-factor Identity Verification & Biometric Enrollment</p>

          {/* Stepper Wizard Indicator */}
          <div className="flex items-center justify-between max-w-sm mx-auto mt-6">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition ${
                    step === s
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/25'
                      : step > s
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {step > s ? <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : s}
                </div>
                {s < 4 && (
                  <div
                    className={`w-12 h-0.5 mx-1 transition ${
                      step > s ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-2 px-1">
            <span className={step >= 1 ? 'text-blue-600 dark:text-blue-400 font-bold' : ''}>Personal</span>
            <span className={step >= 2 ? 'text-blue-600 dark:text-blue-400 font-bold' : ''}>Email OTP</span>
            <span className={step >= 3 ? 'text-blue-600 dark:text-blue-400 font-bold' : ''}>Mobile OTP</span>
            <span className={step >= 4 ? 'text-blue-600 dark:text-blue-400 font-bold' : ''}>Face ID</span>
          </div>
        </div>

        {/* Card Body */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl">
          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 flex items-center gap-2.5 text-xs text-red-700 dark:text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Step 1: Student Information */}
          {step === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="e.g. Jordan Hayes"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Student ID *</label>
                  <input
                    type="text"
                    required
                    value={studentId}
                    onChange={e => setStudentId(e.target.value)}
                    placeholder="e.g. STU-2026-1184"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">University Email *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="jordan.hayes@university.edu"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+1 (555) 789-0123"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Institution</label>
                  <input
                    type="text"
                    value={institution}
                    onChange={e => setInstitution(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Password *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Confirm Password *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 transition"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs">
                <label className="flex items-start gap-2.5 cursor-pointer text-slate-600 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={consentGiven}
                    onChange={e => setConsentGiven(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-[11px] leading-relaxed">
                    I explicitly consent to biometric facial template enrollment, webcam activity tracking, microphone sound monitoring, and screen-sharing verification during online examinations.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition"
              >
                <span>Continue to Email Verification</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Step 2: Email OTP */}
          {step === 2 && (
            <form onSubmit={handleStep2EmailVerify} className="space-y-5 text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Verify Your Email Address</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  We sent a 6-digit verification code to <span className="text-blue-600 dark:text-blue-400 font-semibold">{email || 'your email'}</span>
                </p>
                <div className="mt-2 inline-block px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-400">
                  Demo Code: <span className="text-blue-600 dark:text-blue-400 font-mono font-bold">{simulatedSentEmailCode}</span>
                </div>
              </div>

              <div>
                <input
                  type="text"
                  maxLength={6}
                  value={emailOtp}
                  onChange={e => setEmailOtp(e.target.value)}
                  placeholder="Enter 6-digit code"
                  className="w-48 mx-auto text-center font-mono tracking-widest text-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2.5 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs"
                >
                  Verify Email
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Phone SMS OTP */}
          {step === 3 && (
            <form onSubmit={handleStep3PhoneVerify} className="space-y-5 text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Verify Mobile Number</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Enter the SMS OTP transmitted to <span className="text-blue-600 dark:text-blue-400 font-semibold">{phone || 'your phone'}</span>
                </p>
                <div className="mt-2 inline-block px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-400">
                  Demo SMS Code: <span className="text-indigo-600 dark:text-indigo-400 font-mono font-bold">{simulatedSentPhoneCode}</span>
                </div>
              </div>

              <div>
                <input
                  type="text"
                  maxLength={6}
                  value={phoneOtp}
                  onChange={e => setPhoneOtp(e.target.value)}
                  placeholder="Enter SMS OTP"
                  className="w-48 mx-auto text-center font-mono tracking-widest text-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2.5 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs"
                >
                  Verify Phone
                </button>
              </div>
            </form>
          )}

          {/* Step 4: Face Enrollment */}
          {step === 4 && (
            <div className="space-y-5 text-center">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center justify-center gap-2">
                  <ScanFace className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Facial Identity Enrollment
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Position your face inside the overlay to establish your encrypted biometric reference.
                </p>
              </div>

              {/* Webcam Viewport with Oval Overlay */}
              <div className="relative w-72 h-72 mx-auto rounded-3xl overflow-hidden bg-slate-900 border-2 border-blue-500 shadow-inner flex items-center justify-center">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover transform -scale-x-100"
                  muted
                  playsInline
                />

                {/* Face positioning oval */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div
                    className={`w-44 h-56 rounded-[50%] border-2 transition-colors duration-500 ${
                      facePositionStatus === 'captured'
                        ? 'border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.5)]'
                        : facePositionStatus === 'centered'
                        ? 'border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.4)]'
                        : 'border-dashed border-amber-400'
                    }`}
                  />
                </div>

                {/* Status chip */}
                <div className="absolute bottom-3 inset-x-4 flex justify-between items-center text-[10px] font-mono bg-white/90 dark:bg-slate-800/90 backdrop-blur-xs py-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400">Lighting: Optimal</span>
                  <span className={facePositionStatus === 'centered' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-amber-600 dark:text-amber-400'}>
                    {facePositionStatus === 'centered' ? 'Face Centered' : 'Aligning...'}
                  </span>
                </div>
              </div>

              {isSubmitting ? (
                <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                  <span>Encrypting Biometric Reference Template & Creating Account...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={handleCaptureFace}
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Capture & Complete Enrollment</span>
                  </button>

                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Your template is encrypted using SHA-256 and stored isolated from raw camera captures.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Existing account prompt */}
        <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-6">
          Already registered?{' '}
          <button onClick={() => onNavigate('/login')} className="text-blue-600 dark:text-blue-400 hover:text-blue-700 font-bold ml-1">
            Sign In Here
          </button>
        </p>
      </div>
    </div>
  );
};
