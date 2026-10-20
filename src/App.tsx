import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './services/auth';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { AIChatbot } from './components/common/AIChatbot';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { StudentRegister } from './pages/auth/StudentRegister';
import { AdminRegister } from './pages/auth/AdminRegister';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { AvailableExams } from './pages/student/AvailableExams';
import { PreExamCheck } from './pages/student/PreExamCheck';
import { ExamSession } from './pages/student/ExamSession';
import { MockTests } from './pages/student/MockTests';
import { StudentResults } from './pages/student/StudentResults';
import { StudentProfile } from './pages/student/StudentProfile';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { ExamBuilder } from './pages/admin/ExamBuilder';
import { LiveMonitoring } from './pages/admin/LiveMonitoring';
import { ProctoringAlerts } from './pages/admin/ProctoringAlerts';
import { StudentManagement } from './pages/admin/StudentManagement';
import { AdminResults } from './pages/admin/AdminResults';

import { ThemeProvider } from './services/theme';
import { AnimatePresence, motion } from 'framer-motion';
import { PageTransition } from './components/common/PageTransition';

function AppContent() {
  const { currentUser, role } = useAuth();
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    return window.location.pathname === '/' ? '/' : window.location.pathname;
  });

  // Keep route synced with browser history
  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (route: string) => {
    window.history.pushState({}, '', route);
    setCurrentRoute(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Determine current view component
  const renderView = () => {
    // 1. Public & Auth Routes
    if (currentRoute === '/') {
      return <LandingPage onNavigate={navigate} />;
    }

    if (currentRoute === '/login' || currentRoute === '/login/student') {
      return <LoginPage onNavigate={navigate} initialRole="student" />;
    }

    if (currentRoute === '/login/admin') {
      return <LoginPage onNavigate={navigate} initialRole="admin" />;
    }

    if (currentRoute === '/register' || currentRoute === '/register/student') {
      return <StudentRegister onNavigate={navigate} />;
    }

    if (currentRoute === '/register/admin') {
      return <AdminRegister onNavigate={navigate} />;
    }

    // 2. Exam Readiness & Active Session (Distraction-Free)
    if (currentRoute.startsWith('/student/system-check')) {
      const parts = currentRoute.split('/');
      const examId = parts[parts.length - 1] || 'exam_cs401';
      return <PreExamCheck examId={examId} onNavigate={navigate} />;
    }

    if (currentRoute.startsWith('/student/exam-session')) {
      const parts = currentRoute.split('/');
      const attemptId = parts[parts.length - 1];
      return <ExamSession attemptId={attemptId} onNavigate={navigate} />;
    }

    // 3. Student Portal Routes
    if (currentRoute === '/student/dashboard') {
      return <StudentDashboard onNavigate={navigate} />;
    }

    if (currentRoute === '/student/exams') {
      return <AvailableExams onNavigate={navigate} />;
    }

    if (currentRoute === '/student/mock-tests') {
      return <MockTests />;
    }

    if (currentRoute === '/student/results') {
      return <StudentResults />;
    }

    if (currentRoute === '/student/analytics') {
      return <StudentResults />;
    }

    if (currentRoute === '/student/profile') {
      return <StudentProfile />;
    }

    // 4. Admin Portal Routes
    if (currentRoute === '/admin/dashboard') {
      return <AdminDashboard onNavigate={navigate} />;
    }

    if (currentRoute === '/admin/exams/create') {
      return <ExamBuilder onNavigate={navigate} />;
    }

    if (currentRoute === '/admin/exams') {
      return <AdminDashboard onNavigate={navigate} />;
    }

    if (currentRoute === '/admin/live-monitoring') {
      return <LiveMonitoring />;
    }

    if (currentRoute === '/admin/proctoring-alerts') {
      return <ProctoringAlerts />;
    }

    if (currentRoute === '/admin/students') {
      return <StudentManagement />;
    }

    if (currentRoute === '/admin/results' || currentRoute === '/admin/reports' || currentRoute === '/admin/audit-logs') {
      return <AdminResults />;
    }

    if (currentRoute === '/admin/profile') {
      return <StudentProfile />;
    }

    // Fallback default
    return <LandingPage onNavigate={navigate} />;
  };

  const isDistractionFreeExam = currentRoute.startsWith('/student/exam-session');
  const isAuthOrLanding =
    currentRoute === '/' ||
    currentRoute.startsWith('/login') ||
    currentRoute.startsWith('/register');

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] text-slate-800 dark:text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white transition-colors duration-200">
      {/* Top Navbar (except distraction-free exam session) */}
      {!isDistractionFreeExam && (
        <Navbar onNavigate={navigate} currentRoute={currentRoute} />
      )}

      {/* Main Layout Area with Smooth Route Transitions */}
      <AnimatePresence mode="wait">
        {isDistractionFreeExam ? (
          <motion.main
            key="exam-layout"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1 p-4 sm:p-6 lg:p-8"
          >
            <AnimatePresence mode="wait">
              <PageTransition key={currentRoute}>
                {renderView()}
              </PageTransition>
            </AnimatePresence>
          </motion.main>
        ) : isAuthOrLanding ? (
          <motion.main
            key="public-layout"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col"
          >
            <AnimatePresence mode="wait">
              <PageTransition key={currentRoute} className="flex-1 flex flex-col">
                {renderView()}
              </PageTransition>
            </AnimatePresence>
          </motion.main>
        ) : (
          <motion.div
            key="portal-layout"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex max-w-7xl w-full mx-auto"
          >
            {/* Collapsible Sidebar */}
            <Sidebar currentRoute={currentRoute} onNavigate={navigate} />
            {/* Main workspace content */}
            <main className="flex-1 p-6 lg:p-8 overflow-x-hidden min-h-[calc(100vh-4rem)]">
              <AnimatePresence mode="wait">
                <PageTransition key={currentRoute}>
                  {renderView()}
                </PageTransition>
              </AnimatePresence>
            </main>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating AI Chatbot Assistant (Active across all views except active proctored exam) */}
      {!isDistractionFreeExam && <AIChatbot />}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
