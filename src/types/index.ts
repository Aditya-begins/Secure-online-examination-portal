export type UserRole = 'student' | 'admin';

export interface User {
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  institutionId: string;
  department: string;
  studentId?: string;
  adminId?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  faceEnrollmentStatus: 'enrolled' | 'pending' | 'failed';
  faceTemplateReference?: string;
  accountStatus: 'active' | 'suspended' | 'pending_verification';
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type QuestionType = 'single_mcq' | 'multiple_mcq' | 'true_false' | 'short_answer' | 'descriptive';

export interface Question {
  questionId: string;
  examId: string;
  questionText: string;
  questionType: QuestionType;
  options?: string[];
  // Kept hidden on client during proctored exams; available for mock tests or after results published
  correctAnswer?: string | string[];
  explanation?: string;
  marks: number;
  negativeMarks?: number;
  difficulty: 'easy' | 'medium' | 'hard';
  subject: string;
  topic?: string;
}

export interface ProctoringPolicy {
  enableCamera: boolean;
  enableMicrophone: boolean;
  enableScreenShare: boolean;
  maxWarnings: number; // default 2 warnings, 3rd is auto-submit
  noiseSensitivity: 'low' | 'medium' | 'high';
  headPoseSensitivity: 'low' | 'medium' | 'high';
  enforceFullscreen: boolean;
  trackTabSwitch: boolean;
}

export interface Exam {
  examId: string;
  title: string;
  subject: string;
  description: string;
  instructions: string[];
  durationMinutes: number;
  totalMarks: number;
  passingMarks: number;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  allowedAttempts: number;
  proctoringPolicy: ProctoringPolicy;
  resultPublicationPolicy: 'immediate' | 'manual' | 'scheduled';
  answerDisclosurePolicy: 'immediate' | 'after_deadline' | 'never';
  createdBy: string;
  status: 'draft' | 'published' | 'ongoing' | 'completed' | 'archived';
  questionCount: number;
  questions?: Question[];
}

export interface StudentAnswer {
  questionId: string;
  answer: string | string[];
  savedAt: string;
  isMarkedForReview?: boolean;
}

export type ViolationType = 
  | 'face_absent' 
  | 'multiple_faces' 
  | 'looking_away' 
  | 'abnormal_noise' 
  | 'tab_switched' 
  | 'window_blurred' 
  | 'fullscreen_exited' 
  | 'screen_share_stopped' 
  | 'unauthorized_device';

export interface ProctoringEvent {
  eventId: string;
  attemptId: string;
  studentId: string;
  studentName: string;
  examId: string;
  examTitle: string;
  eventType: ViolationType;
  timestamp: string;
  confidence: number;
  warningNumber: number;
  actionTaken: 'logged' | 'warning_1' | 'warning_2' | 'auto_submitted';
  reviewStatus: 'pending' | 'confirmed' | 'dismissed_false_positive';
  adminNotes?: string;
  snapshotUrl?: string;
}

export interface ExamAttempt {
  attemptId: string;
  examId: string;
  examTitle: string;
  subject: string;
  studentId: string;
  studentName: string;
  startTime: string;
  deadline: string;
  submissionTime?: string;
  status: 'in_progress' | 'submitted' | 'auto_submitted_violation' | 'auto_submitted_timeout';
  warningCount: number;
  answers: Record<string, StudentAnswer>;
  proctoringEvents: ProctoringEvent[];
  obtainedMarks?: number;
  totalMarks: number;
  percentage?: number;
  passStatus?: 'pass' | 'fail' | 'pending_evaluation';
}

export interface MockTest {
  mockTestId: string;
  studentId: string;
  subject: string;
  topic?: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  durationMinutes: number;
  score: number;
  totalMarks: number;
  accuracy: number;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unansweredQuestions: number;
  completedAt: string;
}

export interface AuditLog {
  logId: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  targetId?: string;
  targetType?: string;
  timestamp: string;
  ipAddress?: string;
  details: string;
}

export interface NotificationItem {
  notificationId: string;
  recipientId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'alert' | 'success';
  isRead: boolean;
  createdAt: string;
  link?: string;
}
