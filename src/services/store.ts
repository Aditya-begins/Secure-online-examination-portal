import { User, Exam, Question, ExamAttempt, ProctoringEvent, MockTest, AuditLog, NotificationItem } from '../types';
import { calculateExamScore } from '../lib/exam-rules';

const STORAGE_KEYS = {
  USERS: 'secure_exam_users',
  EXAMS: 'secure_exam_exams',
  QUESTIONS: 'secure_exam_questions',
  ATTEMPTS: 'secure_exam_attempts',
  EVENTS: 'secure_exam_events',
  MOCK_TESTS: 'secure_exam_mock_tests',
  NOTIFICATIONS: 'secure_exam_notifications',
  AUDIT_LOGS: 'secure_exam_audit_logs',
  CURRENT_USER: 'secure_exam_current_user',
};

// Seed initial users
const SEED_USERS: User[] = [
  {
    userId: 'usr_student_1',
    fullName: 'Alex Mercer',
    email: 'alex.mercer@university.edu',
    phone: '+1 (555) 234-5678',
    role: 'student',
    institutionId: 'inst_apex',
    department: 'Computer Science & Engineering',
    studentId: 'STU-2026-9041',
    emailVerified: true,
    phoneVerified: true,
    faceEnrollmentStatus: 'enrolled',
    faceTemplateReference: 'tmpl_alex_mercer_9041_sec_v2',
    accountStatus: 'active',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-09-01T08:00:00Z',
    updatedAt: '2026-10-20T10:00:00Z',
  },
  {
    userId: 'usr_admin_1',
    fullName: 'Prof. Aditya Prakash',
    email: 'adityaprakash281204@gmail.com',
    phone: '+1 (555) 987-6543',
    role: 'admin',
    institutionId: 'inst_apex',
    department: 'Information Assurance & Examination Board',
    adminId: 'ADM-SEC-01',
    emailVerified: true,
    phoneVerified: true,
    faceEnrollmentStatus: 'enrolled',
    faceTemplateReference: 'tmpl_aditya_admin_01_v2',
    accountStatus: 'active',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-08-15T08:00:00Z',
    updatedAt: '2026-10-20T10:00:00Z',
  },
  {
    userId: 'usr_student_2',
    fullName: 'Elena Rostova',
    email: 'elena.rostova@university.edu',
    phone: '+1 (555) 876-1234',
    role: 'student',
    institutionId: 'inst_apex',
    department: 'Cybersecurity & Defense',
    studentId: 'STU-2026-8812',
    emailVerified: true,
    phoneVerified: true,
    faceEnrollmentStatus: 'enrolled',
    faceTemplateReference: 'tmpl_elena_8812_v2',
    accountStatus: 'active',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-09-05T09:30:00Z',
    updatedAt: '2026-10-18T14:20:00Z',
  }
];

// Seed exams
const SEED_EXAMS: Exam[] = [
  {
    examId: 'exam_cs401',
    title: 'CS-401: Advanced Cloud Architecture & Distributed Systems',
    subject: 'Cloud Computing & Distributed Systems',
    description: 'Comprehensive mid-term evaluation covering consensus algorithms, fault-tolerant microservices, Raft/Paxos protocol, distributed caching, and zero-trust perimeter defense.',
    instructions: [
      'This examination is fully proctored with real-time face, eye gaze, audio, and screen monitoring.',
      'A two-warning policy is enforced: on the 3rd confirmed violation, your exam will be automatically locked and submitted.',
      'Maintain full visibility within the webcam frame at all times. Do not switch browser tabs or exit fullscreen.',
      'All responses are automatically saved every 15 seconds and on each answer change.',
      'Scientific calculators are not required. Ensure your room is well lit and noise-free.'
    ],
    durationMinutes: 45,
    totalMarks: 35,
    passingMarks: 18,
    startTime: '2026-10-15T00:00:00Z',
    endTime: '2026-10-30T23:59:59Z',
    allowedAttempts: 1,
    proctoringPolicy: {
      enableCamera: true,
      enableMicrophone: true,
      enableScreenShare: true,
      maxWarnings: 2,
      noiseSensitivity: 'medium',
      headPoseSensitivity: 'medium',
      enforceFullscreen: true,
      trackTabSwitch: true,
    },
    resultPublicationPolicy: 'immediate',
    answerDisclosurePolicy: 'immediate',
    createdBy: 'usr_admin_1',
    status: 'published',
    questionCount: 6,
  },
  {
    examId: 'exam_sec502',
    title: 'CYBER-502: Offensive Security & Network Penetration Testing',
    subject: 'Cybersecurity',
    description: 'Final theoretical assessment on TLS handshakes, symmetric vs asymmetric cryptography, Buffer Overflow mitigation, OAuth2 PKCE flows, and threat vectors.',
    instructions: [
      'Proctoring active: Webcam and screen sharing must remain enabled.',
      'Do not minimize browser window or allow secondary displays.',
      'Two warnings allowed before involuntary submission.'
    ],
    durationMinutes: 30,
    totalMarks: 25,
    passingMarks: 13,
    startTime: '2026-10-18T00:00:00Z',
    endTime: '2026-11-05T23:59:59Z',
    allowedAttempts: 1,
    proctoringPolicy: {
      enableCamera: true,
      enableMicrophone: true,
      enableScreenShare: true,
      maxWarnings: 2,
      noiseSensitivity: 'high',
      headPoseSensitivity: 'medium',
      enforceFullscreen: true,
      trackTabSwitch: true,
    },
    resultPublicationPolicy: 'immediate',
    answerDisclosurePolicy: 'immediate',
    createdBy: 'usr_admin_1',
    status: 'published',
    questionCount: 5,
  },
  {
    examId: 'exam_ai301',
    title: 'AI-301: Deep Learning & Neural Network Optimization',
    subject: 'Artificial Intelligence',
    description: 'Assessment on backpropagation mathematics, Transformer attention mechanisms, regularization techniques, and gradient descent variants.',
    instructions: [
      'Timed assessment of 60 minutes.',
      'Camera, mic, and screen share required.',
      'Ensure uninterrupted power and internet connectivity.'
    ],
    durationMinutes: 60,
    totalMarks: 50,
    passingMarks: 25,
    startTime: '2026-10-25T09:00:00Z',
    endTime: '2026-11-10T18:00:00Z',
    allowedAttempts: 1,
    proctoringPolicy: {
      enableCamera: true,
      enableMicrophone: true,
      enableScreenShare: true,
      maxWarnings: 2,
      noiseSensitivity: 'medium',
      headPoseSensitivity: 'medium',
      enforceFullscreen: true,
      trackTabSwitch: true,
    },
    resultPublicationPolicy: 'scheduled',
    answerDisclosurePolicy: 'after_deadline',
    createdBy: 'usr_admin_1',
    status: 'published',
    questionCount: 5,
  }
];

// Seed questions
const SEED_QUESTIONS: Question[] = [
  // CS-401 Questions
  {
    questionId: 'q_cs401_1',
    examId: 'exam_cs401',
    questionText: 'In the Raft consensus algorithm, which of the following triggers a Follower node to initiate a new Leader Election?',
    questionType: 'single_mcq',
    options: [
      'The Leader sends a specialized ElectionRequest RPC',
      'The election timeout elapses without receiving an AppendEntries heartbeat from the leader',
      'A Client sends a direct read request to the Follower',
      'The current term exceeds the majority index of log entries'
    ],
    correctAnswer: 'The election timeout elapses without receiving an AppendEntries heartbeat from the leader',
    explanation: 'Followers wait for heartbeats (empty AppendEntries RPCs). If a follower receives no communication over its randomized election timeout, it assumes the leader has crashed and transitions to candidate state.',
    marks: 5,
    negativeMarks: 1,
    difficulty: 'medium',
    subject: 'Cloud Computing & Distributed Systems',
    topic: 'Consensus Protocols',
  },
  {
    questionId: 'q_cs401_2',
    examId: 'exam_cs401',
    questionText: 'Which theorem states that a distributed data store can simultaneously provide at most two out of Consistency, Availability, and Partition Tolerance?',
    questionType: 'single_mcq',
    options: [
      'Ambdahl\'s Law',
      'Brewer\'s CAP Theorem',
      'Little\'s Law',
      'Metcalfe\'s Principle'
    ],
    correctAnswer: 'Brewer\'s CAP Theorem',
    explanation: 'Eric Brewer formalized the CAP Theorem, showing distributed systems must trade off strong consistency versus high availability in the presence of network partitions.',
    marks: 5,
    negativeMarks: 1,
    difficulty: 'easy',
    subject: 'Cloud Computing & Distributed Systems',
    topic: 'CAP Theorem',
  },
  {
    questionId: 'q_cs401_3',
    examId: 'exam_cs401',
    questionText: 'Which of the following techniques help mitigate the "Thundering Herd" problem on distributed cache invalidation? (Select all that apply)',
    questionType: 'multiple_mcq',
    options: [
      'Mutex locking / singleflight requests to origin database',
      'Probabilistic early cache expiration (XFetch / jitter)',
      'Setting cache TTL to exactly 0 seconds globally',
      'Serving stale data while an asynchronous background refresh runs'
    ],
    correctAnswer: [
      'Mutex locking / singleflight requests to origin database',
      'Probabilistic early cache expiration (XFetch / jitter)',
      'Serving stale data while an asynchronous background refresh runs'
    ],
    explanation: 'Mutex locks, cache warming/jittering, and stale-while-revalidate allow only one origin fetch, protecting the backend database from catastrophic simultaneous misses.',
    marks: 6,
    negativeMarks: 2,
    difficulty: 'hard',
    subject: 'Cloud Computing & Distributed Systems',
    topic: 'Caching',
  },
  {
    questionId: 'q_cs401_4',
    examId: 'exam_cs401',
    questionText: 'In gRPC / Protocol Buffers, HTTP/2 multiplexing allows multiple concurrent requests over a single TCP connection.',
    questionType: 'true_false',
    options: ['True', 'False'],
    correctAnswer: 'True',
    explanation: 'HTTP/2 introduces binary framing and stream multiplexing, avoiding head-of-line blocking at the application level over one TCP connection.',
    marks: 4,
    negativeMarks: 1,
    difficulty: 'easy',
    subject: 'Cloud Computing & Distributed Systems',
    topic: 'Networking',
  },
  {
    questionId: 'q_cs401_5',
    examId: 'exam_cs401',
    questionText: 'What is the acronym for the Kubernetes controller pattern component that ensures current pod state matches the desired specification?',
    questionType: 'short_answer',
    correctAnswer: 'Reconciliation loop',
    explanation: 'The Kubernetes Reconciliation Loop (or reconcile loop) continually compares the desired state recorded in etcd with the cluster\'s actual runtime state.',
    marks: 5,
    negativeMarks: 0,
    difficulty: 'medium',
    subject: 'Cloud Computing & Distributed Systems',
    topic: 'Kubernetes',
  },
  {
    questionId: 'q_cs401_6',
    examId: 'exam_cs401',
    questionText: 'Explain the difference between Optimistic Concurrency Control (OCC) and Pessimistic Concurrency Control in high-throughput distributed databases.',
    questionType: 'descriptive',
    correctAnswer: 'OCC allows transactions to execute without locking, checking for conflicts at commit time. Pessimistic locking locks records on read/write.',
    explanation: 'Descriptive question evaluated for understanding of lock contention, commit aborts, and scaling characteristics under read-heavy vs write-heavy workloads.',
    marks: 10,
    negativeMarks: 0,
    difficulty: 'hard',
    subject: 'Cloud Computing & Distributed Systems',
    topic: 'Transactions',
  },

  // CYBER-502 Questions
  {
    questionId: 'q_sec502_1',
    examId: 'exam_sec502',
    questionText: 'What does PKCE stand for in the context of modern OAuth 2.0 authorization code flows for public and single-page apps?',
    questionType: 'single_mcq',
    options: [
      'Public Key Certificate Exchange',
      'Proof Key for Code Exchange',
      'Private Key Cryptographic Engine',
      'Protected Kerberos Client Encryption'
    ],
    correctAnswer: 'Proof Key for Code Exchange',
    explanation: 'PKCE (RFC 7636) prevents authorization code interception attacks by generating a cryptographically random code_verifier and code_challenge.',
    marks: 5,
    negativeMarks: 1,
    difficulty: 'easy',
    subject: 'Cybersecurity',
  },
  {
    questionId: 'q_sec502_2',
    examId: 'exam_sec502',
    questionText: 'Which cryptographic algorithm is based on the discrete logarithm problem over elliptic curves?',
    questionType: 'single_mcq',
    options: ['RSA', 'AES-GCM', 'ECDSA', 'MD5'],
    correctAnswer: 'ECDSA',
    explanation: 'Elliptic Curve Digital Signature Algorithm (ECDSA) derives its security from the hardness of the Elliptic Curve Discrete Logarithm Problem.',
    marks: 5,
    negativeMarks: 1,
    difficulty: 'medium',
    subject: 'Cybersecurity',
  },
  {
    questionId: 'q_sec502_3',
    examId: 'exam_sec502',
    questionText: 'Which defensive mechanisms mitigate Buffer Overflow attacks on compiled x86_64 binaries? (Select all that apply)',
    questionType: 'multiple_mcq',
    options: [
      'Address Space Layout Randomization (ASLR)',
      'Stack Canaries (Cookie checks)',
      'Data Execution Prevention / NX bit (DEP)',
      'Base64 encoding all heap memory'
    ],
    correctAnswer: [
      'Address Space Layout Randomization (ASLR)',
      'Stack Canaries (Cookie checks)',
      'Data Execution Prevention / NX bit (DEP)'
    ],
    explanation: 'ASLR randomizes memory offsets; stack canaries detect overwritten return addresses; DEP/NX flags writable pages as non-executable.',
    marks: 5,
    negativeMarks: 1,
    difficulty: 'medium',
    subject: 'Cybersecurity',
  },
  {
    questionId: 'q_sec502_4',
    examId: 'exam_sec502',
    questionText: 'Cross-Site Scripting (XSS) occurs when malicious JavaScript is executed within the browser context of a trusted web origin.',
    questionType: 'true_false',
    options: ['True', 'False'],
    correctAnswer: 'True',
    explanation: 'XSS enables attackers to execute scripts in the victim\'s browser, stealing session cookies, DOM state, and issuing unauthorized requests.',
    marks: 5,
    negativeMarks: 1,
    difficulty: 'easy',
    subject: 'Cybersecurity',
  },
  {
    questionId: 'q_sec502_5',
    examId: 'exam_sec502',
    questionText: 'What HTTP header instructs modern browsers to only load resources over HTTPS and retain that policy for future requests?',
    questionType: 'short_answer',
    correctAnswer: 'Strict-Transport-Security',
    explanation: 'HSTS (Strict-Transport-Security: max-age=31536000; includeSubDomains; preload) prevents SSL stripping downgrade attacks.',
    marks: 5,
    negativeMarks: 0,
    difficulty: 'easy',
    subject: 'Cybersecurity',
  }
];

// Seed past completed attempt for student Alex Mercer to populate results & analytics
const SEED_ATTEMPTS: ExamAttempt[] = [
  {
    attemptId: 'att_past_sec502',
    examId: 'exam_sec502',
    examTitle: 'CYBER-502: Offensive Security & Network Penetration Testing',
    subject: 'Cybersecurity',
    studentId: 'usr_student_1',
    studentName: 'Alex Mercer',
    startTime: '2026-10-18T10:00:00Z',
    deadline: '2026-10-18T10:30:00Z',
    submissionTime: '2026-10-18T10:24:15Z',
    status: 'submitted',
    warningCount: 0,
    answers: {
      q_sec502_1: { questionId: 'q_sec502_1', answer: 'Proof Key for Code Exchange', savedAt: '2026-10-18T10:05:00Z' },
      q_sec502_2: { questionId: 'q_sec502_2', answer: 'ECDSA', savedAt: '2026-10-18T10:10:00Z' },
      q_sec502_3: { questionId: 'q_sec502_3', answer: ['Address Space Layout Randomization (ASLR)', 'Stack Canaries (Cookie checks)', 'Data Execution Prevention / NX bit (DEP)'], savedAt: '2026-10-18T10:18:00Z' },
      q_sec502_4: { questionId: 'q_sec502_4', answer: 'True', savedAt: '2026-10-18T10:20:00Z' },
      q_sec502_5: { questionId: 'q_sec502_5', answer: 'Strict-Transport-Security', savedAt: '2026-10-18T10:23:00Z' },
    },
    proctoringEvents: [],
    obtainedMarks: 25,
    totalMarks: 25,
    percentage: 100,
    passStatus: 'pass',
  }
];

// Seed mock tests
const SEED_MOCK_TESTS: MockTest[] = [
  {
    mockTestId: 'mock_1',
    studentId: 'usr_student_1',
    subject: 'Computer Networks & Security',
    topic: 'TCP/IP, Subnetting & TLS',
    difficulty: 'medium',
    durationMinutes: 20,
    score: 18,
    totalMarks: 20,
    accuracy: 90,
    totalQuestions: 10,
    correctAnswers: 9,
    incorrectAnswers: 1,
    unansweredQuestions: 0,
    completedAt: '2026-10-19T14:30:00Z',
  },
  {
    mockTestId: 'mock_2',
    studentId: 'usr_student_1',
    subject: 'Data Structures & Algorithms',
    topic: 'Dynamic Programming & Graph Traversal',
    difficulty: 'hard',
    durationMinutes: 30,
    score: 22,
    totalMarks: 25,
    accuracy: 88,
    totalQuestions: 12,
    correctAnswers: 10,
    incorrectAnswers: 2,
    unansweredQuestions: 0,
    completedAt: '2026-10-17T16:15:00Z',
  },
  {
    mockTestId: 'mock_3',
    studentId: 'usr_student_1',
    subject: 'Cloud Computing',
    topic: 'Distributed Systems & Containers',
    difficulty: 'easy',
    durationMinutes: 15,
    score: 15,
    totalMarks: 15,
    accuracy: 100,
    totalQuestions: 8,
    correctAnswers: 8,
    incorrectAnswers: 0,
    unansweredQuestions: 0,
    completedAt: '2026-10-14T11:00:00Z',
  }
];

// Seed notifications
const SEED_NOTIFICATIONS: NotificationItem[] = [
  {
    notificationId: 'notif_1',
    recipientId: 'usr_student_1',
    title: 'CS-401 Examination Available',
    message: 'Your mid-term exam for Advanced Cloud Architecture is scheduled and ready to attempt.',
    type: 'info',
    isRead: false,
    createdAt: '2026-10-20T08:00:00Z',
    link: '/student/exams',
  },
  {
    notificationId: 'notif_2',
    recipientId: 'usr_student_1',
    title: 'CYBER-502 Scorecard Published',
    message: 'Your official scorecard for Offensive Security is published with 100% score (Grade A+).',
    type: 'success',
    isRead: true,
    createdAt: '2026-10-18T12:00:00Z',
    link: '/student/results',
  },
  {
    notificationId: 'notif_3',
    recipientId: 'usr_admin_1',
    title: 'Live Proctoring Alert',
    message: 'Ongoing examination session registered 0 severe violations across active students.',
    type: 'info',
    isRead: false,
    createdAt: '2026-10-20T11:30:00Z',
    link: '/admin/live-monitoring',
  }
];

// Seed audit logs
const SEED_AUDIT_LOGS: AuditLog[] = [
  {
    logId: 'audit_1',
    actorId: 'usr_admin_1',
    actorName: 'Prof. Aditya Prakash',
    actorRole: 'admin',
    action: 'EXAM_PUBLISHED',
    targetId: 'exam_cs401',
    targetType: 'Exam',
    timestamp: '2026-10-15T08:30:00Z',
    details: 'Published CS-401 with strict camera, audio, and screen sharing proctoring policy.',
  },
  {
    logId: 'audit_2',
    actorId: 'usr_student_1',
    actorName: 'Alex Mercer',
    actorRole: 'student',
    action: 'BIOMETRIC_ENROLLMENT_COMPLETED',
    targetId: 'usr_student_1',
    targetType: 'User',
    timestamp: '2026-09-01T08:15:00Z',
    details: 'Completed camera face capture and generated encrypted biometric feature template.',
  },
  {
    logId: 'audit_3',
    actorId: 'usr_student_1',
    actorName: 'Alex Mercer',
    actorRole: 'student',
    action: 'EXAM_SUBMISSION_EVALUATED',
    targetId: 'att_past_sec502',
    targetType: 'ExamAttempt',
    timestamp: '2026-10-18T10:24:15Z',
    details: 'Submitted CYBER-502. Automated evaluation scored 25/25 marks (Pass).',
  }
];

class StoreService {
  private get<T>(key: string, defaultVal: T): T {
    try {
      const val = localStorage.getItem(key);
      if (!val) {
        localStorage.setItem(key, JSON.stringify(defaultVal));
        return defaultVal;
      }
      return JSON.parse(val) as T;
    } catch {
      return defaultVal;
    }
  }

  private set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Store error writing key ${key}:`, e);
    }
  }

  constructor() {
    this.init();
  }

  public init() {
    if (typeof window === 'undefined') return;
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      this.set(STORAGE_KEYS.USERS, SEED_USERS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.EXAMS)) {
      this.set(STORAGE_KEYS.EXAMS, SEED_EXAMS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.QUESTIONS)) {
      this.set(STORAGE_KEYS.QUESTIONS, SEED_QUESTIONS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ATTEMPTS)) {
      this.set(STORAGE_KEYS.ATTEMPTS, SEED_ATTEMPTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.MOCK_TESTS)) {
      this.set(STORAGE_KEYS.MOCK_TESTS, SEED_MOCK_TESTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
      this.set(STORAGE_KEYS.NOTIFICATIONS, SEED_NOTIFICATIONS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
      this.set(STORAGE_KEYS.AUDIT_LOGS, SEED_AUDIT_LOGS);
    }
  }

  // Current session user
  public getCurrentUser(): User | null {
    return this.get<User | null>(STORAGE_KEYS.CURRENT_USER, null);
  }

  public setCurrentUser(user: User | null): void {
    this.set(STORAGE_KEYS.CURRENT_USER, user);
  }

  // Users
  public getUsers(): User[] {
    return this.get<User[]>(STORAGE_KEYS.USERS, SEED_USERS);
  }

  public getUser(userId: string): User | undefined {
    return this.getUsers().find(u => u.userId === userId);
  }

  public getUserByEmail(email: string): User | undefined {
    return this.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public saveUser(user: User): void {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.userId === user.userId);
    if (idx >= 0) {
      users[idx] = { ...user, updatedAt: new Date().toISOString() };
    } else {
      users.push(user);
    }
    this.set(STORAGE_KEYS.USERS, users);
  }

  public updateUser(userId: string, updates: Partial<User>): User | undefined {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.userId === userId);
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...updates, updatedAt: new Date().toISOString() };
      this.set(STORAGE_KEYS.USERS, users);
      // update current user if matching
      const current = this.getCurrentUser();
      if (current && current.userId === userId) {
        this.setCurrentUser(users[idx]);
      }
      return users[idx];
    }
    return undefined;
  }

  // Exams
  public getExams(): Exam[] {
    return this.get<Exam[]>(STORAGE_KEYS.EXAMS, SEED_EXAMS);
  }

  public getExam(examId: string): Exam | undefined {
    const exam = this.getExams().find(e => e.examId === examId);
    if (exam) {
      const questions = this.getQuestions(examId);
      return { ...exam, questions, questionCount: questions.length };
    }
    return undefined;
  }

  public saveExam(exam: Exam): void {
    const exams = this.getExams();
    const idx = exams.findIndex(e => e.examId === exam.examId);
    if (idx >= 0) {
      exams[idx] = exam;
    } else {
      exams.push(exam);
    }
    this.set(STORAGE_KEYS.EXAMS, exams);
  }

  public deleteExam(examId: string): void {
    const exams = this.getExams().filter(e => e.examId !== examId);
    this.set(STORAGE_KEYS.EXAMS, exams);
  }

  // Questions
  public getQuestions(examId?: string): Question[] {
    const all = this.get<Question[]>(STORAGE_KEYS.QUESTIONS, SEED_QUESTIONS);
    if (examId) {
      return all.filter(q => q.examId === examId);
    }
    return all;
  }

  public getQuestion(questionId: string): Question | undefined {
    return this.getQuestions().find(q => q.questionId === questionId);
  }

  public saveQuestion(question: Question): void {
    const questions = this.getQuestions();
    const idx = questions.findIndex(q => q.questionId === question.questionId);
    if (idx >= 0) {
      questions[idx] = question;
    } else {
      questions.push(question);
    }
    this.set(STORAGE_KEYS.QUESTIONS, questions);
    // update exam question count
    const exam = this.getExam(question.examId);
    if (exam) {
      this.saveExam({
        ...exam,
        questionCount: this.getQuestions(question.examId).length
      });
    }
  }

  public deleteQuestion(questionId: string): void {
    const q = this.getQuestion(questionId);
    const questions = this.getQuestions().filter(x => x.questionId !== questionId);
    this.set(STORAGE_KEYS.QUESTIONS, questions);
    if (q) {
      const exam = this.getExam(q.examId);
      if (exam) {
        this.saveExam({
          ...exam,
          questionCount: this.getQuestions(q.examId).length
        });
      }
    }
  }

  // Attempts
  public getAttempts(studentId?: string): ExamAttempt[] {
    const all = this.get<ExamAttempt[]>(STORAGE_KEYS.ATTEMPTS, SEED_ATTEMPTS);
    if (studentId) {
      return all.filter(a => a.studentId === studentId);
    }
    return all;
  }

  public getAttempt(attemptId: string): ExamAttempt | undefined {
    return this.getAttempts().find(a => a.attemptId === attemptId);
  }

  public createAttempt(exam: Exam, student: User): ExamAttempt {
    const startTime = new Date();
    const deadline = new Date(startTime.getTime() + exam.durationMinutes * 60 * 1000);

    const attempt: ExamAttempt = {
      attemptId: `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      examId: exam.examId,
      examTitle: exam.title,
      subject: exam.subject,
      studentId: student.userId,
      studentName: student.fullName,
      startTime: startTime.toISOString(),
      deadline: deadline.toISOString(),
      status: 'in_progress',
      warningCount: 0,
      answers: {},
      proctoringEvents: [],
      totalMarks: exam.totalMarks,
    };

    const attempts = this.getAttempts();
    attempts.push(attempt);
    this.set(STORAGE_KEYS.ATTEMPTS, attempts);

    this.logAuditEvent({
      actorId: student.userId,
      actorName: student.fullName,
      actorRole: 'student',
      action: 'EXAM_STARTED',
      targetId: attempt.attemptId,
      targetType: 'ExamAttempt',
      details: `Started examination: ${exam.title}`,
    });

    return attempt;
  }

  public saveStudentAnswer(attemptId: string, questionId: string, answer: string | string[], isMarkedForReview?: boolean): ExamAttempt | undefined {
    const attempts = this.getAttempts();
    const idx = attempts.findIndex(a => a.attemptId === attemptId);
    if (idx >= 0) {
      attempts[idx].answers[questionId] = {
        questionId,
        answer,
        savedAt: new Date().toISOString(),
        isMarkedForReview: isMarkedForReview ?? attempts[idx].answers[questionId]?.isMarkedForReview ?? false,
      };
      this.set(STORAGE_KEYS.ATTEMPTS, attempts);
      return attempts[idx];
    }
    return undefined;
  }

  public submitAttempt(
    attemptId: string,
    reason: 'submitted' | 'auto_submitted_violation' | 'auto_submitted_timeout'
  ): ExamAttempt | undefined {
    const attempts = this.getAttempts();
    const idx = attempts.findIndex(a => a.attemptId === attemptId);
    if (idx >= 0) {
      const att = attempts[idx];
      const exam = this.getExam(att.examId);
      const questions = this.getQuestions(att.examId);

      const scoreResult = calculateExamScore(
        questions,
        att.answers,
        exam ? exam.passingMarks : Math.round(att.totalMarks * 0.4)
      );

      att.status = reason;
      att.submissionTime = new Date().toISOString();
      att.obtainedMarks = scoreResult.obtainedMarks;
      att.percentage = scoreResult.percentage;
      att.passStatus = scoreResult.passStatus;

      attempts[idx] = att;
      this.set(STORAGE_KEYS.ATTEMPTS, attempts);

      this.logAuditEvent({
        actorId: att.studentId,
        actorName: att.studentName,
        actorRole: 'student',
        action: `EXAM_SUBMITTED_${reason.toUpperCase()}`,
        targetId: att.attemptId,
        targetType: 'ExamAttempt',
        details: `Exam submission with score ${scoreResult.obtainedMarks}/${att.totalMarks} (${scoreResult.percentage}%). Reason: ${reason}`,
      });

      // Send notification to student
      this.addNotification({
        recipientId: att.studentId,
        title: `Exam Submitted: ${att.examTitle}`,
        message: `Your exam has been submitted (${reason === 'submitted' ? 'Normal Submission' : 'System Auto-Submitted'}). Score: ${scoreResult.obtainedMarks}/${att.totalMarks}.`,
        type: scoreResult.passStatus === 'pass' ? 'success' : 'warning',
        link: `/student/results`,
      });

      return att;
    }
    return undefined;
  }

  // Proctoring Events
  public getProctoringEvents(attemptId?: string): ProctoringEvent[] {
    const all = this.get<ProctoringEvent[]>(STORAGE_KEYS.EVENTS, []);
    if (attemptId) {
      return all.filter(e => e.attemptId === attemptId);
    }
    return all;
  }

  public logProctoringEvent(event: Omit<ProctoringEvent, 'eventId'>): ProctoringEvent {
    const newEvent: ProctoringEvent = {
      ...event,
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };

    const events = this.getProctoringEvents();
    events.unshift(newEvent);
    this.set(STORAGE_KEYS.EVENTS, events);

    // Update attempt warning count and events list
    const attempts = this.getAttempts();
    const attIdx = attempts.findIndex(a => a.attemptId === event.attemptId);
    if (attIdx >= 0) {
      attempts[attIdx].warningCount = event.warningNumber;
      attempts[attIdx].proctoringEvents.push(newEvent);
      this.set(STORAGE_KEYS.ATTEMPTS, attempts);
    }

    return newEvent;
  }

  public updateProctoringEventStatus(
    eventId: string,
    status: 'confirmed' | 'dismissed_false_positive',
    adminNotes?: string
  ): void {
    const events = this.getProctoringEvents();
    const idx = events.findIndex(e => e.eventId === eventId);
    if (idx >= 0) {
      events[idx].reviewStatus = status;
      if (adminNotes) events[idx].adminNotes = adminNotes;
      this.set(STORAGE_KEYS.EVENTS, events);
    }
  }

  // Mock Tests
  public getMockTests(studentId?: string): MockTest[] {
    const all = this.get<MockTest[]>(STORAGE_KEYS.MOCK_TESTS, SEED_MOCK_TESTS);
    if (studentId) {
      return all.filter(m => m.studentId === studentId);
    }
    return all;
  }

  public saveMockTest(mock: MockTest): void {
    const mocks = this.getMockTests();
    mocks.unshift(mock);
    this.set(STORAGE_KEYS.MOCK_TESTS, mocks);
  }

  // Notifications
  public getNotifications(recipientId: string): NotificationItem[] {
    const all = this.get<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, SEED_NOTIFICATIONS);
    return all.filter(n => n.recipientId === recipientId);
  }

  public markNotificationAsRead(notificationId: string): void {
    const notifs = this.get<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, SEED_NOTIFICATIONS);
    const item = notifs.find(n => n.notificationId === notificationId);
    if (item) {
      item.isRead = true;
      this.set(STORAGE_KEYS.NOTIFICATIONS, notifs);
    }
  }

  public addNotification(item: Omit<NotificationItem, 'notificationId' | 'isRead' | 'createdAt'>): void {
    const notifs = this.get<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, SEED_NOTIFICATIONS);
    notifs.unshift({
      ...item,
      notificationId: `notif_${Date.now()}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    });
    this.set(STORAGE_KEYS.NOTIFICATIONS, notifs);
  }

  // Audit Logs
  public getAuditLogs(): AuditLog[] {
    return this.get<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, SEED_AUDIT_LOGS);
  }

  public logAuditEvent(log: Omit<AuditLog, 'logId' | 'timestamp'>): void {
    const logs = this.getAuditLogs();
    logs.unshift({
      ...log,
      logId: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
    });
    this.set(STORAGE_KEYS.AUDIT_LOGS, logs);
  }

  // Reset helper
  public resetToDefaultSeed(): void {
    this.set(STORAGE_KEYS.USERS, SEED_USERS);
    this.set(STORAGE_KEYS.EXAMS, SEED_EXAMS);
    this.set(STORAGE_KEYS.QUESTIONS, SEED_QUESTIONS);
    this.set(STORAGE_KEYS.ATTEMPTS, SEED_ATTEMPTS);
    this.set(STORAGE_KEYS.MOCK_TESTS, SEED_MOCK_TESTS);
    this.set(STORAGE_KEYS.NOTIFICATIONS, SEED_NOTIFICATIONS);
    this.set(STORAGE_KEYS.AUDIT_LOGS, SEED_AUDIT_LOGS);
    this.set(STORAGE_KEYS.EVENTS, []);
  }
}

export const dbStore = new StoreService();
