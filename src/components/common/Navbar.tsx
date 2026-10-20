import React, { useState } from 'react';
import {
  ShieldCheck,
  Bell,
  User,
  LogOut,
  ArrowLeftRight,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '../../services/auth';
import { dbStore } from '../../services/store';
import { useTheme } from '../../services/theme';
import { motion, AnimatePresence } from 'framer-motion';

interface NavbarProps {
  onNavigate: (route: string) => void;
  currentRoute: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentRoute }) => {
  const { currentUser, role, logout, switchUserRole } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const notifications = currentUser ? dbStore.getNotifications(currentUser.userId) : [];
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <header className="sticky top-0 z-30 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div
          onClick={() => onNavigate(role === 'admin' ? '/admin/dashboard' : currentUser ? '/student/dashboard' : '/')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-600 dark:bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                Secure<span className="text-blue-600 dark:text-blue-400">Exam</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                PROCTOR AI
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
              Smart Exams • Secure Environment
            </p>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle (Light / Dark Mode) */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition"
            title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {currentUser ? (
            <>
              {/* Quick Role Switcher for Test Reviewers */}
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Workspace:</span>
                <button
                  onClick={() => {
                    const newRole = role === 'student' ? 'admin' : 'student';
                    switchUserRole(newRole);
                    onNavigate(newRole === 'admin' ? '/admin/dashboard' : '/student/dashboard');
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 hover:text-blue-700 shadow-xs border border-slate-200 dark:border-slate-700 transition"
                  title="Switch between Student and Admin perspective"
                >
                  <ArrowLeftRight className="w-3 h-3" />
                  <span className="capitalize">{role}</span>
                  <span className="text-[10px] text-slate-400 font-normal">(switch)</span>
                </button>
              </div>

              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition relative border border-slate-200 dark:border-slate-800"
                  aria-label="View notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full" />
                  )}
                </button>

                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.97 }}
                      transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-xl border border-slate-200 dark:border-slate-800 z-50 origin-top-right"
                    >
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                          Notifications
                        </h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {unreadCount} unread
                        </span>
                      </div>
                      <div className="mt-2 max-h-64 overflow-y-auto space-y-2">
                        {notifications.length === 0 ? (
                          <p className="text-xs text-slate-400 text-center py-4">No notifications</p>
                        ) : (
                          notifications.map(n => (
                            <div
                              key={n.notificationId}
                              onClick={() => {
                                dbStore.markNotificationAsRead(n.notificationId);
                                if (n.link) onNavigate(n.link);
                                setShowNotifications(false);
                              }}
                              className={`p-2.5 rounded-xl text-xs transition cursor-pointer flex gap-2.5 ${
                                n.isRead
                                  ? 'bg-slate-50 dark:bg-slate-800/40 text-slate-500'
                                  : 'bg-blue-50/70 dark:bg-blue-950/30 text-slate-800 dark:text-slate-200 border border-blue-200 dark:border-blue-800/50'
                              }`}
                            >
                              <div className="mt-0.5 shrink-0">
                                {n.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                                {n.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                                {n.type === 'info' && <Info className="w-4 h-4 text-blue-600" />}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900 dark:text-white text-xs leading-snug">{n.title}</p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* User Avatar & Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                >
                  <img
                    src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                    alt={currentUser.fullName}
                    className="w-8 h-8 rounded-lg object-cover border border-slate-300 dark:border-slate-700"
                  />
                  <div className="text-left hidden md:block pr-1">
                    <p className="text-xs font-bold text-slate-800 dark:text-white leading-tight">{currentUser.fullName}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">{role}</p>
                  </div>
                </button>

                <AnimatePresence>
                  {showProfileMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.97 }}
                      transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 rounded-2xl p-2 shadow-xl border border-slate-200 dark:border-slate-800 z-50 origin-top-right"
                    >
                      <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{currentUser.fullName}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{currentUser.email}</p>
                      </div>
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          onNavigate(role === 'admin' ? '/admin/profile' : '/student/profile');
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-2"
                      >
                        <User className="w-3.5 h-3.5 text-blue-600" />
                        My Profile & Biometrics
                      </button>
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          logout();
                          onNavigate('/login');
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition flex items-center gap-2"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('/login')}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition"
              >
                Sign In
              </button>
              <button
                onClick={() => onNavigate('/register')}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition"
              >
                Register
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
