import React from 'react';
import { ShieldAlert, LogIn, KeyRound, Headphones, Monitor, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface DeviceAlreadyRegisteredModalProps {
  deviceLabel?: string;
  existingUserEmailMasked?: string;
  enrolledAt?: string;
  onSignIn: () => void;
  onRecoverAccount: () => void;
  onContactSupport: () => void;
}

export const DeviceAlreadyRegisteredModal: React.FC<DeviceAlreadyRegisteredModalProps> = ({
  deviceLabel = 'Recognized Hardware / Browser',
  existingUserEmailMasked,
  enrolledAt,
  onSignIn,
  onRecoverAccount,
  onContactSupport,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl text-center space-y-6"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="device-registered-title"
        aria-describedby="device-registered-desc"
      >
        {/* Warning Security Shield Badge */}
        <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700/60 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center shadow-lg">
          <ShieldAlert className="w-8 h-8" />
        </div>

        {/* Header & Explicit Requirement Text */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            One-Account-Per-Device Policy
          </span>
          <h2
            id="device-registered-title"
            className="text-2xl font-black text-slate-900 dark:text-white tracking-tight"
          >
            Account Already Registered
          </h2>
          <p
            id="device-registered-desc"
            className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium"
          >
            This device already has a registered account. Only one account can be created per enrolled device. Please sign in to your existing account or contact support if you believe this is an error.
          </p>
        </div>

        {/* Enrolled Device Security Badge */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-left text-xs space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
            <span className="text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1.5">
              <Monitor className="w-3.5 h-3.5 text-blue-600" />
              Enrolled Hardware
            </span>
            <span className="font-bold text-slate-800 dark:text-slate-200 font-mono text-[11px]">
              {deviceLabel}
            </span>
          </div>
          {existingUserEmailMasked && (
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500 dark:text-slate-400">Associated Candidate:</span>
              <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">
                {existingUserEmailMasked}
              </span>
            </div>
          )}
          {enrolledAt && (
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>Binding Timestamp:</span>
              <span>{new Date(enrolledAt).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {/* Action Buttons: Sign In | Recover Account | Contact Support */}
        <div className="space-y-2.5 pt-2">
          <button
            onClick={onSignIn}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In to Existing Account</span>
          </button>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={onRecoverAccount}
              className="py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs transition flex items-center justify-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Recover Account</span>
            </button>

            <button
              onClick={onContactSupport}
              className="py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs transition flex items-center justify-center gap-1.5"
            >
              <Headphones className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Contact Support</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
