import React from 'react';
import {
  ShieldCheck,
  Eye,
  Camera,
  Bot,
  BarChart4,
  FileSpreadsheet,
  CheckCircle,
  Lock,
  ArrowRight,
  Sparkles,
  Cpu,
  Fingerprint,
  Mic,
  Monitor,
  CheckCircle2,
  Users,
  Award,
} from 'lucide-react';
import { CyberGlobe3D } from '../components/common/CyberGlobe3D';
import { useAuth } from '../services/auth';

interface LandingPageProps {
  onNavigate: (route: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const { switchUserRole } = useAuth();

  const features = [
    {
      icon: Eye,
      title: 'AI-Powered Proctoring',
      description: 'Autonomous head posture and eye-gaze monitoring with privacy-preserving local landmark processing and two-warning policy.',
      badge: 'Real-time AI',
    },
    {
      icon: Fingerprint,
      title: 'Secure Face Verification',
      description: 'Webcam-guided enrollment with liveness challenge and encrypted biometric reference template matching before exam admission.',
      badge: 'Biometric Auth',
    },
    {
      icon: FileSpreadsheet,
      title: 'Smart Examination Engine',
      description: 'Configurable assessments supporting Single MCQ, Multi-Select, True/False, Short Answer, and Descriptive evaluation.',
      badge: 'Multi-Format',
    },
    {
      icon: Monitor,
      title: 'Live Activity Surveillance',
      description: 'Seamless tracking of screen-sharing streams, fullscreen adherence, audio decibels, and browser tab/window focus changes.',
      badge: 'Zero-Cheating',
    },
    {
      icon: Bot,
      title: 'AI Examination Assistant',
      description: 'Context-aware Gemini-powered assistant guiding candidates through technical readiness and helping admins analyze scores.',
      badge: 'Gemini 3.8',
    },
    {
      icon: BarChart4,
      title: 'Detailed Performance Analytics',
      description: 'Interactive scorecards, accuracy trends, topic-wise breakdown, and tamper-resistant downloadable examination receipts.',
      badge: 'Enterprise Insights',
    },
  ];

  const securityPillars = [
    { title: 'Server-Authoritative Timing', desc: 'Deadlines enforced strictly on the backend with automated answer autosaving and submission.' },
    { title: 'Two-Warning Violation Policy', desc: 'Debounced multi-factor policy issuing Warning 1, Final Warning 2, and auto-submit on 3rd infraction.' },
    { title: '5-Minute Inactivity Protection', desc: 'Automated session invalidation with 60-second warning countdown to protect unattended devices.' },
    { title: 'Isolated Biometric References', desc: 'Zero raw facial images stored; only encrypted biometric landmark templates with consent controls.' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] text-slate-800 dark:text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white transition-colors duration-200">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-16 lg:pb-28 border-b border-slate-200 dark:border-slate-800/80">
        {/* Subtle, elegant ambient lighting */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[450px] bg-blue-500/5 dark:bg-blue-500/10 rounded-full filter blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[350px] h-[350px] bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full filter blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                SMART EXAMS • SECURE ENVIRONMENT • INTELLIGENT EVALUATION
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
                SECURE ONLINE <br />
                <span className="text-blue-600 dark:text-blue-400">
                  EXAMINATION PORTAL
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                Experience the next generation of academic assessments. Featuring autonomous AI proctoring, consented facial verification, audio decibel analysis, tab-switch interception, and intelligent Gemini evaluation.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <button
                  onClick={() => {
                    switchUserRole('student');
                    onNavigate('/student/dashboard');
                  }}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2.5 transition-all transform hover:-translate-y-0.5"
                >
                  <span>Get Started as Student</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    switchUserRole('admin');
                    onNavigate('/admin/dashboard');
                  }}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-100 font-bold text-sm border border-slate-300 dark:border-slate-700 shadow-xs flex items-center justify-center gap-2.5 transition"
                >
                  <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Access Admin Portal</span>
                </button>
              </div>

              {/* Verified Trust Stats */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-slate-200 dark:border-slate-800 max-w-lg mx-auto lg:mx-0">
                <div>
                  <p className="text-2xl font-black text-blue-600 dark:text-blue-400">99.8%</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Integrity Accuracy</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">2-Warning</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Automated Submission</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">5-Min</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Inactivity Logout</p>
                </div>
              </div>
            </div>

            {/* Right: 3D Animated CyberGlobe */}
            <div className="lg:col-span-5 flex justify-center relative">
              <div className="w-full max-w-[500px] h-[440px] relative rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 flex items-center justify-center shadow-lg dark:shadow-2xl overflow-hidden">
                <CyberGlobe3D className="w-full h-full" />
                {/* Floating overlay badge */}
                <div className="absolute bottom-4 left-4 right-4 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">Live Proctoring Node Active</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">Face • Gaze • Audio • Screen Monitoring</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800">
                    256-BIT ENC
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Six Feature Cards Section */}
      <section className="py-20 relative bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800">
              Complete Feature Suite
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
              Engineered for Uncompromising Assessment Integrity
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base">
              A comprehensive examination ecosystem marrying intuitive usability with enterprise-grade cybersecurity controls.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300 group hover:-translate-y-1"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/60 flex items-center justify-center group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                      {item.badge}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Security Architecture & Invariants */}
      <section className="py-20 bg-white dark:bg-[#0B0F19] relative border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 space-y-6">
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800">
                Security Architecture
              </span>
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
                Zero-Trust Examination Security Protocol
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Every candidate session operates inside an isolated sandbox. Responses autosave continuously, answer keys remain strictly concealed on the server, and violations are logged with timestamped confidence scores.
              </p>

              <div className="space-y-3 pt-2">
                {securityPillars.map((pillar, i) => (
                  <div key={i} className="flex gap-3 items-start p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">{pillar.title}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{pillar.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="bg-slate-50 dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-5 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Exam Readiness Protocol</span>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    ALL 7 CHECKS PASSED
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
                    <Camera className="w-5 h-5 text-blue-600 dark:text-blue-400 mx-auto mb-1.5" />
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Camera</p>
                    <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">Visible & Centered</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
                    <Mic className="w-5 h-5 text-blue-600 dark:text-blue-400 mx-auto mb-1.5" />
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Microphone</p>
                    <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">Calibrated</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
                    <Monitor className="w-5 h-5 text-blue-600 dark:text-blue-400 mx-auto mb-1.5" />
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Screen Share</p>
                    <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">Primary Display</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
                    <Fingerprint className="w-5 h-5 text-blue-600 dark:text-blue-400 mx-auto mb-1.5" />
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Identity</p>
                    <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">Match 99.4%</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  <p className="font-bold text-blue-700 dark:text-blue-300 mb-1">Informed Candidate Consent Notice</p>
                  All examination monitoring occurs with candidate awareness and consent. Biometric reference templates are strictly encrypted and candidates can request template deletion under profile settings.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-12 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="font-bold text-slate-900 dark:text-white tracking-tight">SECURE ONLINE EXAMINATION PORTAL</span>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={() => onNavigate('/student/exams')} className="hover:text-blue-600 dark:hover:text-white transition">Available Exams</button>
            <button onClick={() => onNavigate('/student/mock-tests')} className="hover:text-blue-600 dark:hover:text-white transition">Mock Practice</button>
            <button onClick={() => onNavigate('/login')} className="hover:text-blue-600 dark:hover:text-white transition">Student Portal</button>
            <button onClick={() => onNavigate('/login/admin')} className="hover:text-blue-600 dark:hover:text-white transition">Admin Portal</button>
          </div>

          <p className="text-slate-500 dark:text-slate-400">
            © 2026 Secure Online Examination Portal. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};
