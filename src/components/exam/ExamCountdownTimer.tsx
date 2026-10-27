import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Clock,
  AlertTriangle,
  BellRing,
  Volume2,
  VolumeX,
  ShieldAlert,
  Loader2,
  X,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateTimeRemaining, TimeRemainingInfo, TimerUrgency } from '../../lib/exam-rules';

export interface ExamCountdownTimerProps {
  /** Target deadline timestamp in ISO format or timestamp ms */
  deadline: string | number;
  /** Total exam duration in minutes (e.g. 45, 60) */
  totalDurationMinutes?: number;
  /** Callback triggered when countdown hits zero */
  onTimeExpired: (reason: 'auto_submitted_timeout', message: string) => void;
  /** Optional callback on urgency change */
  onUrgencyChange?: (urgency: TimerUrgency) => void;
  /** Optional custom class name */
  className?: string;
  /** Compact mode for narrow bars */
  compact?: boolean;
}

// Shared singleton AudioContext to prevent repeatedly instantiating audio drivers
let sharedAudioCtx: AudioContext | null = null;
let audioInitFailed = false;

function getSafeAudioContext(): AudioContext | null {
  if (audioInitFailed) return null;
  if (typeof window === 'undefined') return null;

  try {
    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) {
        audioInitFailed = true;
        return null;
      }
      sharedAudioCtx = new AudioContextClass();
      // Handle potential browser audio device error events in headless/container environments
      sharedAudioCtx.addEventListener('error', () => {
        audioInitFailed = true;
      });
    }

    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }

    return sharedAudioCtx;
  } catch {
    audioInitFailed = true;
    return null;
  }
}

// Synthesize pleasant, non-jarring audio chimes via standard Web Audio API
function playChime(type: 'warning' | 'critical' | 'tick') {
  try {
    const ctx = getSafeAudioContext();
    if (!ctx) return;

    if (type === 'tick') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
      return;
    }

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';

    if (type === 'critical') {
      // Urgent double-ping
      osc1.frequency.setValueAtTime(880, now); // A5
      osc1.frequency.exponentialRampToValueAtTime(1046.5, now + 0.15); // C6
      osc2.frequency.setValueAtTime(587.33, now); // D5
      osc2.frequency.exponentialRampToValueAtTime(698.46, now + 0.15); // F5
      gainNode.gain.setValueAtTime(0.12, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    } else {
      // Gentle warning chime
      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.2); // E5
      gainNode.gain.setValueAtTime(0.08, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    }

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.5);
    osc2.stop(now + 0.5);
  } catch {
    audioInitFailed = true;
  }
}

export const ExamCountdownTimer: React.FC<ExamCountdownTimerProps> = ({
  deadline,
  totalDurationMinutes = 45,
  onTimeExpired,
  onUrgencyChange,
  className = '',
  compact = false,
}) => {
  const deadlineMs = typeof deadline === 'string' ? new Date(deadline).getTime() : deadline;
  const totalDurationSeconds = totalDurationMinutes * 60;

  // Sound preference state stored in session
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    return localStorage.getItem('secureexam_timer_muted') === 'true';
  });

  const [timeInfo, setTimeInfo] = useState<TimeRemainingInfo>(() => {
    return calculateTimeRemaining(deadlineMs, Date.now(), totalDurationSeconds);
  });

  // Track low time alerts shown to avoid spamming
  const [activeAlert, setActiveAlert] = useState<{
    id: string;
    level: 'warning' | 'critical';
    title: string;
    message: string;
  } | null>(null);

  const alerted5MinRef = useRef(false);
  const alerted1MinRef = useRef(false);
  const hasAutoSubmittedRef = useRef(false);

  const toggleSound = () => {
    setIsMuted(prev => {
      const next = !prev;
      localStorage.setItem('secureexam_timer_muted', String(next));
      if (!next) {
        playChime('tick');
      }
      return next;
    });
  };

  const triggerAutoSubmit = useCallback(() => {
    if (hasAutoSubmittedRef.current) return;
    hasAutoSubmittedRef.current = true;
    onTimeExpired('auto_submitted_timeout', 'Examination time limit has reached zero. Your answers have been safely autosaved and submitted.');
  }, [onTimeExpired]);

  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now();
      const info = calculateTimeRemaining(deadlineMs, now, totalDurationSeconds);
      setTimeInfo(info);

      if (onUrgencyChange) {
        onUrgencyChange(info.urgency);
      }

      // Check timeout
      if (info.isExpired) {
        triggerAutoSubmit();
        return;
      }

      // 5-minute warning alert
      if (info.isFiveMinutesLeft && !alerted5MinRef.current) {
        alerted5MinRef.current = true;
        setActiveAlert({
          id: '5min',
          level: 'warning',
          title: '5 Minutes Remaining',
          message: 'Time is running low. Please review any unanswered questions or marked items.',
        });
        if (!isMuted) playChime('warning');
      }

      // 1-minute critical alert
      if (info.isOneMinuteLeft && !alerted1MinRef.current) {
        alerted1MinRef.current = true;
        setActiveAlert({
          id: '1min',
          level: 'critical',
          title: 'Final 60 Seconds!',
          message: 'The examination will automatically lock and submit all saved answers when the timer reaches 00:00.',
        });
        if (!isMuted) playChime('critical');
      }

      // Final 10 seconds tick
      if (info.totalSeconds <= 10 && info.totalSeconds > 0 && !isMuted) {
        playChime('tick');
      }
    };

    // Immediate first tick
    updateCountdown();

    const intervalId = setInterval(updateCountdown, 1000);
    return () => clearInterval(intervalId);
  }, [deadlineMs, totalDurationSeconds, isMuted, triggerAutoSubmit, onUrgencyChange]);

  // Color schemes based on urgency
  const urgency = timeInfo.urgency;
  const isExpired = timeInfo.isExpired;
  const isCritical = urgency === 'critical';
  const isLow = urgency === 'low';

  // SVG Circular progress calculation
  const circleRadius = 14;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const strokeOffset = circleCircumference - (circleCircumference * (timeInfo.percentageRemaining / 100));

  const strokeColor = isCritical
    ? '#EF4444' // red-500
    : isLow
    ? '#F59E0B' // amber-500
    : '#2563EB'; // blue-600

  const badgeBg = isCritical
    ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'
    : isLow
    ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
    : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';

  return (
    <div className={`relative flex items-center ${className}`}>
      {/* Visual Timer Container */}
      <div
        className={`px-3 py-1.5 rounded-xl border flex items-center gap-2.5 transition-all duration-300 ${badgeBg} ${
          isCritical ? 'animate-pulse shadow-md shadow-red-500/20 ring-2 ring-red-400/40' : ''
        }`}
        title={`Exam Time Remaining: ${timeInfo.formatted} (${Math.round(timeInfo.percentageRemaining)}% left)`}
        role="timer"
        aria-live="polite"
        aria-atomic="true"
      >
        {/* Circular Progress Ring */}
        <div className="relative w-8 h-8 shrink-0 flex items-center justify-center">
          <svg className="w-8 h-8 -rotate-90 transform" viewBox="0 0 36 36">
            {/* Background Track */}
            <circle
              cx="18"
              cy="18"
              r={circleRadius}
              stroke="currentColor"
              strokeWidth="2.5"
              fill="transparent"
              className="text-slate-200 dark:text-slate-700 opacity-60"
            />
            {/* Animated Remaining Progress */}
            <circle
              cx="18"
              cy="18"
              r={circleRadius}
              stroke={strokeColor}
              strokeWidth="2.5"
              strokeDasharray={circleCircumference}
              strokeDashoffset={strokeOffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-[stroke-dashoffset] duration-700 ease-out"
            />
          </svg>

          {/* Center Icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            {isCritical ? (
              <Flame className="w-3.5 h-3.5 text-red-600 dark:text-red-400 animate-bounce" />
            ) : isLow ? (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            ) : (
              <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            )}
          </div>
        </div>

        {/* Digital Time Text & Label */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 leading-none">
            <span
              className={`font-mono font-bold tracking-tight text-sm sm:text-base ${
                isCritical
                  ? 'text-red-700 dark:text-red-300'
                  : isLow
                  ? 'text-amber-700 dark:text-amber-300'
                  : 'text-slate-900 dark:text-white'
              }`}
            >
              {timeInfo.formatted}
            </span>

            {/* Micro Audio Mute Toggle */}
            <button
              onClick={toggleSound}
              type="button"
              className="p-0.5 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
              title={isMuted ? 'Unmute countdown alerts' : 'Mute countdown audio alerts'}
              aria-label={isMuted ? 'Unmute timer alerts' : 'Mute timer alerts'}
            >
              {isMuted ? <VolumeX className="w-3 h-3 text-slate-400" /> : <Volume2 className="w-3 h-3 text-blue-500" />}
            </button>
          </div>

          {!compact && (
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">
              {isCritical ? 'Critical Final Min' : isLow ? 'Time Running Low' : 'Time Remaining'}
            </span>
          )}
        </div>
      </div>

      {/* Floating Low-Time Notification Toast / Banner */}
      <AnimatePresence>
        {activeAlert && !isExpired && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.95 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className={`fixed top-16 right-4 sm:right-8 z-50 max-w-sm w-full p-4 rounded-2xl shadow-2xl border backdrop-blur-md ${
              activeAlert.level === 'critical'
                ? 'bg-rose-50/95 dark:bg-slate-900/95 border-rose-400 dark:border-rose-800 text-rose-950 dark:text-rose-100 shadow-rose-500/20'
                : 'bg-amber-50/95 dark:bg-slate-900/95 border-amber-400 dark:border-amber-800 text-amber-950 dark:text-amber-100 shadow-amber-500/20'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  activeAlert.level === 'critical'
                    ? 'bg-red-600 text-white animate-pulse'
                    : 'bg-amber-500 text-white'
                }`}
              >
                {activeAlert.level === 'critical' ? (
                  <BellRing className="w-5 h-5 text-white animate-wiggle" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-white" />
                )}
              </div>

              <div className="flex-1 min-w-0 pr-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wide">
                    {activeAlert.title}
                  </h4>
                  <button
                    onClick={() => setActiveAlert(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition"
                    aria-label="Dismiss alert"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-snug">
                  {activeAlert.message}
                </p>

                <div className="mt-3 flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white/70 dark:bg-slate-800/80 border border-current">
                    Remaining: {timeInfo.formatted}
                  </span>
                  <button
                    onClick={() => setActiveAlert(null)}
                    className="text-[11px] font-semibold underline underline-offset-2 ml-auto text-current hover:opacity-80"
                  >
                    Acknowledge
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auto-Submit In-Flight Overlay when Timer reaches Zero */}
      <AnimatePresence>
        {isExpired && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center space-y-5"
            >
              <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center shadow-lg">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                  Time Limit Elapsed (00:00)
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-2">
                  Auto-Submitting Examination
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  Your designated examination session time has reached zero. All questions, marked items, and autosaved responses are currently being locked and compiled for proctored evaluation.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-left text-xs space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Autosaved responses encrypted & preserved</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <ShieldAlert className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Proctoring activity logs synchronized</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 dark:text-slate-500 animate-pulse">
                Redirecting to candidate scorecards & performance breakdown...
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
