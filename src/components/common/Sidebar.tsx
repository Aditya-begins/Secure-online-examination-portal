import React from 'react';
import {
  LayoutDashboard,
  FileText,
  Clock,
  Award,
  BarChart3,
  UserCheck,
  ShieldAlert,
  Users,
  PlusCircle,
  FileCheck,
  Activity,
  LogOut,
  FolderLock,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../services/auth';

interface SidebarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentRoute, onNavigate }) => {
  const { role, logout } = useAuth();

  const studentLinks = [
    { label: 'Dashboard', icon: LayoutDashboard, route: '/student/dashboard' },
    { label: 'Available Exams', icon: FileText, route: '/student/exams' },
    { label: 'Mock Test Practice', icon: Clock, route: '/student/mock-tests' },
    { label: 'My Results', icon: Award, route: '/student/results' },
    { label: 'Performance Analytics', icon: BarChart3, route: '/student/analytics' },
    { label: 'Profile & Biometrics', icon: UserCheck, route: '/student/profile' },
  ];

  const adminLinks = [
    { label: 'Admin Overview', icon: LayoutDashboard, route: '/admin/dashboard' },
    { label: 'Create Examination', icon: PlusCircle, route: '/admin/exams/create' },
    { label: 'Manage Exams', icon: FileCheck, route: '/admin/exams' },
    { label: 'Live Monitoring', icon: Activity, route: '/admin/live-monitoring' },
    { label: 'Proctoring Alerts', icon: ShieldAlert, route: '/admin/proctoring-alerts' },
    { label: 'Student Directory', icon: Users, route: '/admin/students' },
    { label: 'Results & Analytics', icon: BarChart3, route: '/admin/results' },
    { label: 'Security & Audit Logs', icon: FolderLock, route: '/admin/audit-logs' },
  ];

  const links = role === 'admin' ? adminLinks : studentLinks;

  return (
    <aside className="w-64 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between p-4 min-h-[calc(100vh-4rem)] transition-colors duration-200">
      <div>
        {/* Workspace Badge */}
        <div className="mb-4 px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Workspace</p>
            <p className="text-xs font-bold text-slate-900 dark:text-white capitalize flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              {role === 'admin' ? 'Administrator' : 'Student Portal'}
            </p>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded font-mono font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
            PRO
          </span>
        </div>

        {/* Navigation list */}
        <nav className="space-y-1">
          {links.map(link => {
            const Icon = link.icon;
            const isActive = currentRoute === link.route || currentRoute.startsWith(`${link.route}/`);
            return (
              <button
                key={link.route}
                onClick={() => onNavigate(link.route)}
                className={`relative w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition group ${
                  isActive
                    ? 'text-blue-700 dark:text-blue-300'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/50'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeSidebarIndicator"
                    className="absolute inset-0 bg-blue-50 dark:bg-blue-950/60 rounded-xl border border-blue-200/80 dark:border-blue-800/60 shadow-xs"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <div className="relative z-10 flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                    }`}
                  />
                  <span>{link.label}</span>
                </div>
                {isActive && <ChevronRight className="relative z-10 w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info & Logout */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
        <div className="px-3 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/50 text-[11px]">
          <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold mb-0.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            AI Integrity Engine
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-[10px] leading-tight">
            Consent-based face verification & live activity telemetry active.
          </p>
        </div>

        <button
          onClick={() => {
            logout();
            onNavigate('/login');
          }}
          className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
