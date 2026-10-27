import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import nodemailer, { type Transporter } from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface PendingRegistration {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  passwordHash: string;
  studentId?: string;
  institutionId?: string;
  department?: string;
  role: 'student' | 'admin';
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: number;
  lastEmailOtpSentAt: number;
  lastPhoneOtpSentAt: number;
}

export interface OTPRecord {
  id: string;
  pendingRegistrationId: string;
  target: string; // email or phone
  verificationType: 'email' | 'phone';
  hashedOtp: string;
  expiresAt: number;
  attempts: number;
  maxAttempts: number;
  status: 'pending' | 'verified' | 'expired' | 'max_attempts_exceeded';
  createdAt: number;
}

export interface DeviceRecord {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  deviceCredentialHash: string;
  deviceLabel: string;
  userAgent: string;
  ipAddress: string;
  enrolledAt: string;
  lastVerifiedAt: string;
  enrollmentStatus: 'active' | 'revoked' | 'recovery_pending';
  revokedAt?: string;
  recoveryReason?: string;
}

export interface RecoveryRequestRecord {
  id: string;
  userId?: string;
  email: string;
  studentId: string;
  fullName: string;
  phone: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  adminNotes?: string;
}

export interface AuditLogRecord {
  id: string;
  userId?: string;
  actorEmail?: string;
  eventType: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  metadata: Record<string, any>;
}

export interface WebAuthnCredentialRecord {
  id: string; // base64url credential ID
  userId: string;
  userEmail: string;
  publicKey: string; // base64 public key
  counter: number;
  deviceType?: string;
  backedUp?: boolean;
  createdAt: string;
}

interface SecurityDbSchema {
  securitySalt?: string;
  pendingRegistrations: Record<string, PendingRegistration>;
  otps: Record<string, OTPRecord>;
  devices: Record<string, DeviceRecord>;
  recoveryRequests: Record<string, RecoveryRequestRecord>;
  auditLogs: AuditLogRecord[];
  webauthnCredentials: Record<string, WebAuthnCredentialRecord>;
  webauthnChallenges: Record<string, { challenge: string; expiresAt: number; userEmail?: string }>;
  deliverySandbox: {
    lastEmail?: { to: string; subject: string; otp: string; sentAt: string; provider: string; error?: string };
  };
}

class SecurityService {
  private dbPath: string;
  private db: SecurityDbSchema;
  private mailTransporter: Transporter | null = null;

  constructor() {
    const dataDir = path.resolve(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch {
        // ignore if already exists
      }
    }
    this.dbPath = path.resolve(dataDir, 'security-db.json');
    this.db = this.loadDb();
    this.initMailTransporter();
  }

  private loadDb(): SecurityDbSchema {
    const defaultData: SecurityDbSchema = {
      securitySalt: process.env.SECURITY_SALT || crypto.randomBytes(32).toString('hex'),
      pendingRegistrations: {},
      otps: {},
      devices: {},
      recoveryRequests: {},
      auditLogs: [],
      webauthnCredentials: {},
      webauthnChallenges: {},
      deliverySandbox: {},
    };

    try {
      if (fs.existsSync(this.dbPath)) {
        const raw = fs.readFileSync(this.dbPath, 'utf-8');
        const parsed = JSON.parse(raw) as SecurityDbSchema;
        // Ensure security salt exists securely
        if (!parsed.securitySalt) {
          parsed.securitySalt = process.env.SECURITY_SALT || crypto.randomBytes(32).toString('hex');
        }
        if (!parsed.webauthnCredentials) parsed.webauthnCredentials = {};
        if (!parsed.webauthnChallenges) parsed.webauthnChallenges = {};
        return parsed;
      }
    } catch (e) {
      console.warn('Could not read security db, initializing default:', e);
    }

    this.saveDb(defaultData);
    return defaultData;
  }

  private saveDb(data: SecurityDbSchema = this.db): void {
    try {
      fs.writeFileSync(this.dbPath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to write security-db.json:', e);
    }
  }

  // Gmail SMTP Transporter Initialization
  private initMailTransporter(): void {
    const gmailUser = process.env.GMAIL_USER?.trim();
    const gmailPass = process.env.GMAIL_APP_PASSWORD?.trim();

    if (gmailUser && gmailPass) {
      try {
        this.mailTransporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: gmailUser,
            pass: gmailPass,
          },
        });
        console.log(`[GMAIL_SMTP] Configured active Gmail transport for ${gmailUser}`);
      } catch (err) {
        console.error('[GMAIL_SMTP] Failed to initialize Nodemailer Gmail transporter:', err);
        this.mailTransporter = null;
      }
    } else {
      console.log('[GMAIL_SMTP] No GMAIL_USER or GMAIL_APP_PASSWORD set. Local verification delivery active.');
      this.mailTransporter = null;
    }
  }

  // Secure dynamic Salt retrieval
  public getSalt(): string {
    return process.env.SECURITY_SALT || this.db.securitySalt || 'sec_salt_default';
  }

  // Cryptographic utilities
  public hash(val: string): string {
    const salt = this.getSalt();
    return crypto.createHash('sha256').update(`${val}:${salt}`).digest('hex');
  }

  public hashPassword(plain: string): string {
    return this.hash(`pw_${plain}`);
  }

  public generate6DigitOtp(): string {
    // Generate secure random 6-digit number between 100000 and 999999
    return crypto.randomInt(100000, 1000000).toString();
  }

  public generateDeviceToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Device Enrollment Methods (One Device = One Account Policy)
  public getDeviceByToken(token: string): DeviceRecord | undefined {
    if (!token) return undefined;
    const hashed = this.hash(token);
    return Object.values(this.db.devices).find(
      d => d.deviceCredentialHash === hashed && d.enrollmentStatus === 'active'
    );
  }

  public getDeviceByHash(hash: string): DeviceRecord | undefined {
    return Object.values(this.db.devices).find(
      d => d.deviceCredentialHash === hash && d.enrollmentStatus === 'active'
    );
  }

  public getAllDevices(): DeviceRecord[] {
    return Object.values(this.db.devices);
  }

  public enrollDevice(params: {
    userId: string;
    userEmail: string;
    userName: string;
    deviceToken: string;
    userAgent: string;
    ipAddress: string;
  }): DeviceRecord {
    const hashed = this.hash(params.deviceToken);

    // Derive a clean human-readable device label from User-Agent
    let label = 'Desktop Web Browser';
    const ua = params.userAgent || '';
    if (/Macintosh|Mac OS/i.test(ua)) label = 'Apple macOS Safari / Chrome';
    else if (/Windows/i.test(ua)) label = 'Microsoft Windows PC';
    else if (/iPhone|iPad/i.test(ua)) label = 'Apple iOS Mobile';
    else if (/Android/i.test(ua)) label = 'Android Mobile Device';
    else if (/Linux/i.test(ua)) label = 'Linux Workstation';

    const deviceRecord: DeviceRecord = {
      id: `dev_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      userId: params.userId,
      userEmail: params.userEmail,
      userName: params.userName,
      deviceCredentialHash: hashed,
      deviceLabel: label,
      userAgent: ua.substring(0, 200),
      ipAddress: params.ipAddress || '127.0.0.1',
      enrolledAt: new Date().toISOString(),
      lastVerifiedAt: new Date().toISOString(),
      enrollmentStatus: 'active',
    };

    this.db.devices[deviceRecord.id] = deviceRecord;
    this.saveDb();

    this.logAudit({
      userId: params.userId,
      actorEmail: params.userEmail,
      eventType: 'DEVICE_ENROLLED',
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      metadata: {
        deviceId: deviceRecord.id,
        deviceLabel: label,
      },
    });

    return deviceRecord;
  }

  public revokeDevice(deviceId: string, reason: string = 'User requested recovery or administrator revoke'): boolean {
    const dev = this.db.devices[deviceId];
    if (!dev) return false;

    dev.enrollmentStatus = 'revoked';
    dev.revokedAt = new Date().toISOString();
    dev.recoveryReason = reason;
    this.saveDb();

    this.logAudit({
      userId: dev.userId,
      actorEmail: dev.userEmail,
      eventType: 'DEVICE_ENROLLMENT_REVOKED',
      metadata: { deviceId, reason },
    });

    return true;
  }

  // Pending Registration Management
  public createPendingRegistration(params: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    studentId?: string;
    institutionId?: string;
    department?: string;
    role?: 'student' | 'admin';
  }): PendingRegistration {
    // Invalidate any old pending registration for same email
    for (const [id, reg] of Object.entries(this.db.pendingRegistrations)) {
      if (reg.email.toLowerCase() === params.email.toLowerCase()) {
        delete this.db.pendingRegistrations[id];
      }
    }

    const id = `preg_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
    const pending: PendingRegistration = {
      id,
      fullName: params.fullName.trim(),
      email: params.email.trim().toLowerCase(),
      phone: params.phone.trim(),
      passwordHash: this.hashPassword(params.password),
      studentId: params.studentId,
      institutionId: params.institutionId,
      department: params.department,
      role: params.role || 'student',
      emailVerified: false,
      phoneVerified: false,
      createdAt: Date.now(),
      lastEmailOtpSentAt: 0,
      lastPhoneOtpSentAt: 0,
    };

    this.db.pendingRegistrations[id] = pending;
    this.saveDb();
    return pending;
  }

  public getPendingRegistration(id: string): PendingRegistration | undefined {
    const reg = this.db.pendingRegistrations[id];
    if (!reg) return undefined;
    // Expire pending registrations after 30 minutes
    if (Date.now() - reg.createdAt > 30 * 60 * 1000) {
      delete this.db.pendingRegistrations[id];
      this.saveDb();
      return undefined;
    }
    return reg;
  }

  public updatePendingRegistration(id: string, updates: Partial<PendingRegistration>): void {
    if (this.db.pendingRegistrations[id]) {
      this.db.pendingRegistrations[id] = {
        ...this.db.pendingRegistrations[id],
        ...updates,
      };
      this.saveDb();
    }
  }

  public removePendingRegistration(id: string): void {
    delete this.db.pendingRegistrations[id];
    this.saveDb();
  }

  // Email OTP Management with Gmail SMTP
  public createAndSendEmailOtp(pendingReg: PendingRegistration): {
    success: boolean;
    error?: string;
    cooldownRemainingSeconds?: number;
    deliveryInfo: { provider: string; sent: boolean; sandboxOtp?: string; setupNotice?: string };
  } {
    const now = Date.now();
    const cooldownMs = 60 * 1000; // 60s cooldown

    if (pendingReg.lastEmailOtpSentAt && (now - pendingReg.lastEmailOtpSentAt < cooldownMs)) {
      const waitSec = Math.ceil((cooldownMs - (now - pendingReg.lastEmailOtpSentAt)) / 1000);
      return {
        success: false,
        error: `Please wait ${waitSec}s before requesting a new email verification code.`,
        cooldownRemainingSeconds: waitSec,
        deliveryInfo: { provider: 'none', sent: false },
      };
    }

    // Invalidate existing pending OTPs for this registration & email
    for (const [_, record] of Object.entries(this.db.otps)) {
      if (record.pendingRegistrationId === pendingReg.id && record.verificationType === 'email') {
        record.status = 'expired';
      }
    }

    const rawOtp = this.generate6DigitOtp();
    const hashedOtp = this.hash(rawOtp);
    const expiresAt = now + 5 * 60 * 1000; // 5 minutes

    const otpId = `otp_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    this.db.otps[otpId] = {
      id: otpId,
      pendingRegistrationId: pendingReg.id,
      target: pendingReg.email,
      verificationType: 'email',
      hashedOtp,
      expiresAt,
      attempts: 0,
      maxAttempts: 5,
      status: 'pending',
      createdAt: now,
    };

    pendingReg.lastEmailOtpSentAt = now;
    this.saveDb();

    // Deliver via Gmail SMTP or Development Sandbox
    const delivery = this.deliverEmailWithGmailSmtp(pendingReg.email, rawOtp, pendingReg.fullName);

    return {
      success: true,
      deliveryInfo: delivery,
    };
  }

  public verifyEmailOtp(pendingRegId: string, inputOtp: string): {
    success: boolean;
    error?: string;
    attemptsLeft?: number;
  } {
    const now = Date.now();
    const cleanOtp = inputOtp.trim();

    // Find active pending OTP
    const activeOtp = Object.values(this.db.otps).find(
      o => o.pendingRegistrationId === pendingRegId && o.verificationType === 'email' && o.status === 'pending'
    );

    if (!activeOtp) {
      return { success: false, error: 'No active email verification code found. Please request a new code.' };
    }

    if (now > activeOtp.expiresAt) {
      activeOtp.status = 'expired';
      this.saveDb();
      return { success: false, error: 'This verification code has expired (valid for 5 minutes). Please click Resend Code.' };
    }

    if (activeOtp.attempts >= activeOtp.maxAttempts) {
      activeOtp.status = 'max_attempts_exceeded';
      this.saveDb();
      return { success: false, error: 'Maximum incorrect verification attempts (5) exceeded. Please request a new code.' };
    }

    const inputHashed = this.hash(cleanOtp);
    if (inputHashed !== activeOtp.hashedOtp) {
      activeOtp.attempts += 1;
      const attemptsLeft = activeOtp.maxAttempts - activeOtp.attempts;
      if (attemptsLeft <= 0) {
        activeOtp.status = 'max_attempts_exceeded';
      }
      this.saveDb();
      return {
        success: false,
        error: `Incorrect verification code. ${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} remaining.`,
        attemptsLeft,
      };
    }

    // Success! Mark verified
    activeOtp.status = 'verified';
    this.updatePendingRegistration(pendingRegId, { emailVerified: true });
    this.saveDb();

    this.logAudit({
      actorEmail: activeOtp.target,
      eventType: 'EMAIL_VERIFIED_OTP',
      metadata: { pendingRegistrationId: pendingRegId },
    });

    return { success: true };
  }

  // Gmail SMTP Delivery Implementation
  private deliverEmailWithGmailSmtp(
    to: string,
    otp: string,
    recipientName: string
  ): { provider: string; sent: boolean; sandboxOtp?: string; setupNotice?: string } {
    console.log(`\n======================================================`);
    console.log(`[SECURE_EMAIL_OTP] To: ${to} | Recipient: ${recipientName}`);
    console.log(`[SECURE_EMAIL_OTP] One-Time Verification Code: ${otp}`);
    console.log(`[SECURE_EMAIL_OTP] Valid for 5 Minutes. Single-use only.`);
    console.log(`======================================================\n`);

    const gmailUser = process.env.GMAIL_USER?.trim();
    const gmailPass = process.env.GMAIL_APP_PASSWORD?.trim();

    if (gmailUser && gmailPass) {
      // Re-initialize transporter if not present
      if (!this.mailTransporter) {
        this.initMailTransporter();
      }

      if (this.mailTransporter) {
        this.mailTransporter.sendMail({
          from: `"Secure Online Exam Portal" <${gmailUser}>`,
          to,
          subject: `${otp} is your SecureExam verification code`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
              <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #0f172a; font-size: 22px; font-weight: 800; margin: 0;">Secure Online Examination Portal</h1>
                <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Smart Exams • Secure Environment • Intelligent Evaluation</p>
              </div>
              <p style="color: #334155; font-size: 15px;">Hello <strong>${recipientName}</strong>,</p>
              <p style="color: #475569; font-size: 14px; line-height: 1.6;">
                Use the following 6-digit One-Time Password (OTP) to verify your institutional email address and proceed with secure enrollment:
              </p>
              <div style="background-color: #f0fdf4; border: 2px dashed #22c55e; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
                <span style="font-family: monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #15803d;">${otp}</span>
                <p style="color: #166534; font-size: 12px; margin-top: 8px; font-weight: 600;">Valid for 5 minutes • Single use only</p>
              </div>
              <p style="color: #64748b; font-size: 12px; line-height: 1.5;">
                If you did not request this verification code, please ignore this email. Never disclose this code to anyone. Our security team will never ask for your OTP.
              </p>
            </div>
          `,
        }).then((info: any) => {
          console.log(`[GMAIL_SMTP] Successfully sent email to ${to}: messageId ${info.messageId}`);
        }).catch((err: any) => {
          console.error('[GMAIL_SMTP] Error sending email via Gmail SMTP:', err);
        });

        this.db.deliverySandbox.lastEmail = {
          to,
          subject: 'Email Verification OTP',
          otp,
          sentAt: new Date().toISOString(),
          provider: 'gmail_smtp',
        };
        this.saveDb();

        return {
          provider: 'gmail_smtp',
          sent: true,
          sandboxOtp: process.env.NODE_ENV !== 'production' ? otp : undefined,
        };
      }
    }

    // Informative setup guidance when GMAIL_USER / GMAIL_APP_PASSWORD are not set
    const setupNotice = 'To send real emails to live mailboxes: Set GMAIL_USER and GMAIL_APP_PASSWORD (generate an App Password under Google Account -> Security -> 2-Step Verification -> App passwords).';

    this.db.deliverySandbox.lastEmail = {
      to,
      subject: 'Email Verification OTP',
      otp,
      sentAt: new Date().toISOString(),
      provider: 'development_sandbox',
      error: 'Gmail SMTP not configured',
    };
    this.saveDb();

    return {
      provider: 'development_sandbox',
      sent: true,
      sandboxOtp: otp,
      setupNotice,
    };
  }

  // Device Recovery Management
  public createRecoveryRequest(params: {
    email: string;
    studentId: string;
    fullName: string;
    phone: string;
    reason: string;
  }): RecoveryRequestRecord {
    const id = `rec_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const reqRecord: RecoveryRequestRecord = {
      id,
      email: params.email.trim().toLowerCase(),
      studentId: params.studentId.trim(),
      fullName: params.fullName.trim(),
      phone: params.phone.trim(),
      reason: params.reason.trim(),
      status: 'pending',
      submittedAt: new Date().toISOString(),
    };

    this.db.recoveryRequests[id] = reqRecord;
    this.saveDb();

    this.logAudit({
      actorEmail: params.email,
      eventType: 'DEVICE_RECOVERY_REQUESTED',
      metadata: { requestId: id, reason: params.reason },
    });

    return reqRecord;
  }

  public getAllRecoveryRequests(): RecoveryRequestRecord[] {
    return Object.values(this.db.recoveryRequests);
  }

  public approveRecoveryRequest(requestId: string, adminEmail: string = 'admin'): boolean {
    const reqRecord = this.db.recoveryRequests[requestId];
    if (!reqRecord) return false;

    reqRecord.status = 'approved';
    reqRecord.reviewedAt = new Date().toISOString();
    reqRecord.reviewedBy = adminEmail;

    // Revoke any existing active device enrollment for that email or studentId
    for (const dev of Object.values(this.db.devices)) {
      if (dev.userEmail.toLowerCase() === reqRecord.email.toLowerCase() && dev.enrollmentStatus === 'active') {
        dev.enrollmentStatus = 'revoked';
        dev.revokedAt = new Date().toISOString();
        dev.recoveryReason = `Approved Device Recovery (${reqRecord.reason})`;
      }
    }

    this.saveDb();

    this.logAudit({
      actorEmail: adminEmail,
      eventType: 'DEVICE_RECOVERY_APPROVED',
      metadata: { requestId, userEmail: reqRecord.email },
    });

    return true;
  }

  // WebAuthn Passkeys Management
  public generateWebAuthnChallenge(userEmail: string): string {
    const challenge = crypto.randomBytes(32).toString('base64url');
    this.db.webauthnChallenges[challenge] = {
      challenge,
      expiresAt: Date.now() + 5 * 60 * 1000,
      userEmail: userEmail.toLowerCase(),
    };
    this.saveDb();
    return challenge;
  }

  public verifyWebAuthnChallenge(challenge: string): boolean {
    const item = this.db.webauthnChallenges[challenge];
    if (!item) return false;
    delete this.db.webauthnChallenges[challenge];
    this.saveDb();
    return Date.now() < item.expiresAt;
  }

  public registerWebAuthnCredential(params: {
    credentialId: string;
    userId: string;
    userEmail: string;
    publicKey: string;
    deviceType?: string;
  }): WebAuthnCredentialRecord {
    const cred: WebAuthnCredentialRecord = {
      id: params.credentialId,
      userId: params.userId,
      userEmail: params.userEmail.toLowerCase(),
      publicKey: params.publicKey,
      counter: 0,
      deviceType: params.deviceType || 'platform',
      backedUp: true,
      createdAt: new Date().toISOString(),
    };

    this.db.webauthnCredentials[params.credentialId] = cred;
    this.saveDb();

    this.logAudit({
      userId: params.userId,
      actorEmail: params.userEmail,
      eventType: 'WEBAUTHN_PASSKEY_REGISTERED',
      metadata: { credentialId: params.credentialId },
    });

    return cred;
  }

  public getWebAuthnCredentialsForUser(userEmail: string): WebAuthnCredentialRecord[] {
    const clean = userEmail.toLowerCase();
    return Object.values(this.db.webauthnCredentials).filter(c => c.userEmail === clean);
  }

  // Security Audit Logging
  public logAudit(entry: {
    userId?: string;
    actorEmail?: string;
    eventType: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
  }): void {
    const log: AuditLogRecord = {
      id: `audit_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      userId: entry.userId,
      actorEmail: entry.actorEmail,
      eventType: entry.eventType,
      timestamp: new Date().toISOString(),
      ipAddress: entry.ipAddress || '127.0.0.1',
      userAgent: (entry.userAgent || '').substring(0, 200),
      metadata: entry.metadata || {},
    };

    this.db.auditLogs.unshift(log);
    // Keep max 500 audit logs
    if (this.db.auditLogs.length > 500) {
      this.db.auditLogs = this.db.auditLogs.slice(0, 500);
    }
    this.saveDb();
  }

  public getAuditLogs(): AuditLogRecord[] {
    return this.db.auditLogs;
  }

  public getLastSentOtpForTesting(): string | undefined {
    return this.db.deliverySandbox.lastEmail?.otp;
  }
}

export const securityService = new SecurityService();
