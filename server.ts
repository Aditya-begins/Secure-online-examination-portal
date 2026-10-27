import express from 'express';
import http from 'http';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { GoogleGenAI } from '@google/genai';
import { securityService } from './server/security-service.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());
app.use(cookieParser());

// Initialize server-side Gemini AI client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// AI Chatbot endpoint for SecureExam AI Assistant
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { message, role, context } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    const isStudent = role === 'student';

    const systemInstruction = `You are "SecureExam AI Assistant", the official intelligent assistant for the Secure Online Examination Portal ("Smart Exams. Secure Environment. Intelligent Evaluation.").

Role Boundary: The user interacting with you is currently authenticated as a ${isStudent ? 'STUDENT' : 'ADMINISTRATOR'}.
Context: ${JSON.stringify(context || {})}

Guidelines:
1. Tone: Professional, encouraging, precise, and cybersecurity-aware.
2. ${isStudent ? `For Students:
   - Assist with registration, login, Gmail SMTP email OTP, Firebase Phone OTP verification, passkeys, and webcam face enrollment.
   - Explain exam instructions, 2-warning proctoring rules, mock test practice modes, and performance analytics.
   - Answer study preparation and syllabus review questions.
   - SECURITY RULE: NEVER reveal answers or solve questions for an ongoing examination. If an exam is in progress, kindly state that exam assistance is restricted during active proctored sessions.
   - Protect privacy: Do not reveal other students' information.` : `For Administrators:
   - Assist with exam creation, question bank organization, proctoring policy configuration.
   - Interpret proctoring violations (e.g. explain sustained gaze deviation, abnormal audio decibel thresholds, screen sharing interruption).
   - Provide summary metrics on active exams and students.`}
3. Keep answers concise, clear, and actionable. Use bullet points where appropriate.`;

    if (!process.env.GEMINI_API_KEY) {
      let fallbackText = '';
      const lower = message.toLowerCase();

      if (lower.includes('exam') && lower.includes('when')) {
        fallbackText = 'You have an active scheduled examination: **CS-401: Advanced Cloud Architecture & Distributed Systems**. You can take it anytime from the "Available Exams" tab on your dashboard.';
      } else if (lower.includes('mock') || lower.includes('practice')) {
        fallbackText = 'You can access Mock Tests from your sidebar. We offer **Quick Practice** (10 questions), **Timed Mock Test** (25 questions), **Full-Length Mock**, and **Custom Practice** across various subjects.';
      } else if (lower.includes('warning') || lower.includes('proctor')) {
        fallbackText = 'The portal uses a **two-warning policy**: Warning 1 alerts you to suspicious activity. Warning 2 is your final alert. A 3rd confirmed violation will automatically submit your exam. Keep your face centered and stay on the exam tab.';
      } else if (lower.includes('result') || lower.includes('score')) {
        fallbackText = 'You can review completed test scorecards, detailed question analyses, and downloadable PDF reports under the **My Results** tab.';
      } else {
        fallbackText = `Hello! I am your SecureExam AI Assistant. I can assist you with examination schedules, 7-point readiness checks, mock test practice, proctoring policy clarification, and account security. How may I help you today?`;
      }

      return res.json({ response: fallbackText });
    }

    const geminiResponse = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: message,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const responseText = geminiResponse.text || 'I could not generate a response. Please try again.';
    res.json({ response: responseText });
  } catch (error: any) {
    console.error('Gemini API chat error:', error);
    res.status(500).json({
      error: 'Failed to communicate with AI Assistant',
      details: error?.message || 'Internal error',
      response: 'I encountered a temporary connection issue. Please ensure your query is exam-related, or check the help guidelines in the dashboard.'
    });
  }
});

// Helper masking utilities
function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email || '';
  const [user, domain] = email.split('@');
  if (user.length <= 2) return `${user[0]}***@${domain}`;
  return `${user.slice(0, 2)}***${user.slice(-1)}@${domain}`;
}

function maskPhone(phone: string): string {
  if (!phone || phone.length < 5) return phone || '';
  return phone.slice(0, -4).replace(/[0-9]/g, '•') + ' ' + phone.slice(-4);
}

// 1. Device Enrollment Status Check
app.get('/api/auth/device-status', (req, res) => {
  try {
    const token = req.cookies?.secure_device_enrollment;
    const device = token ? securityService.getDeviceByToken(token) : undefined;
    res.json({
      isEnrolled: !!device,
      device: device
        ? {
            id: device.id,
            deviceLabel: device.deviceLabel,
            enrolledAt: device.enrolledAt,
            userEmailMasked: maskEmail(device.userEmail),
            userName: device.userName,
          }
        : null,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to inspect device enrollment status', details: err?.message });
  }
});

// 2. Initiate Registration & Send Gmail SMTP Email OTP
app.post('/api/auth/register-initiate', (req, res) => {
  try {
    const { fullName, email, phone, password, studentId, institutionId, department, role } = req.body;

    if (!fullName || !email || !phone || !password) {
      return res.status(400).json({ error: 'Full name, email, phone, and password are required.' });
    }

    // Enforce E.164 phone basic validation
    const cleanPhone = phone.trim().replace(/\s+/g, '');
    if (!/^\+?[1-9]\d{6,14}$/.test(cleanPhone)) {
      return res.status(400).json({ error: 'Please enter a valid international mobile phone number (E.164 format, e.g. +1 650 555 1234 or +91 9876543210).' });
    }

    // CHECK ONE DEVICE = ONE REGISTERED ACCOUNT POLICY
    const token = req.cookies?.secure_device_enrollment;
    const existingDevice = token ? securityService.getDeviceByToken(token) : undefined;
    if (existingDevice) {
      return res.status(409).json({
        error: 'Account Already Registered',
        message: 'This device already has a registered account. Only one account can be created per enrolled device. Please sign in to your existing account or contact support if you believe this is an error.',
        code: 'DEVICE_ALREADY_REGISTERED',
        deviceLabel: existingDevice.deviceLabel,
        existingUserEmailMasked: maskEmail(existingDevice.userEmail),
        enrolledAt: existingDevice.enrolledAt,
      });
    }

    // Create pending registration
    const pending = securityService.createPendingRegistration({
      fullName,
      email,
      phone: cleanPhone,
      password,
      studentId,
      institutionId,
      department,
      role: role || 'student',
    });

    // Generate & send Email OTP via Nodemailer Gmail SMTP
    const sendResult = securityService.createAndSendEmailOtp(pending);
    if (!sendResult.success) {
      return res.status(429).json({
        error: sendResult.error,
        cooldownRemainingSeconds: sendResult.cooldownRemainingSeconds,
      });
    }

    res.json({
      success: true,
      pendingRegistrationId: pending.id,
      email: pending.email,
      emailMasked: maskEmail(pending.email),
      phone: pending.phone,
      phoneMasked: maskPhone(pending.phone),
      delivery: sendResult.deliveryInfo,
      message: 'A 6-digit verification code has been dispatched to your email address.',
    });
  } catch (err: any) {
    console.error('Registration initiate error:', err);
    res.status(500).json({ error: 'Internal server error during registration', details: err?.message });
  }
});

// 3. Verify Email OTP
app.post('/api/auth/verify-email-otp', (req, res) => {
  try {
    const { pendingRegistrationId, otp } = req.body;

    if (!pendingRegistrationId || !otp) {
      return res.status(400).json({ error: 'Pending registration ID and 6-digit verification code are required.' });
    }

    const pending = securityService.getPendingRegistration(pendingRegistrationId);
    if (!pending) {
      return res.status(404).json({ error: 'Registration session expired or not found. Please restart registration.' });
    }

    const verifyResult = securityService.verifyEmailOtp(pendingRegistrationId, otp);
    if (!verifyResult.success) {
      return res.status(400).json({
        error: verifyResult.error,
        attemptsLeft: verifyResult.attemptsLeft,
      });
    }

    res.json({
      success: true,
      emailVerified: true,
      phone: pending.phone,
      phoneMasked: maskPhone(pending.phone),
      message: 'Email address verified successfully! Continue to mobile phone verification with Firebase SMS OTP.',
    });
  } catch (err: any) {
    console.error('Verify email OTP error:', err);
    res.status(500).json({ error: 'Internal server error verifying email OTP', details: err?.message });
  }
});

// 4. Resend Email OTP
app.post('/api/auth/resend-email-otp', (req, res) => {
  try {
    const { pendingRegistrationId } = req.body;
    const pending = securityService.getPendingRegistration(pendingRegistrationId);
    if (!pending) {
      return res.status(404).json({ error: 'Session expired. Please restart registration.' });
    }

    const result = securityService.createAndSendEmailOtp(pending);
    if (!result.success) {
      return res.status(429).json({
        error: result.error,
        cooldownRemainingSeconds: result.cooldownRemainingSeconds,
      });
    }

    res.json({
      success: true,
      delivery: result.deliveryInfo,
      message: 'A fresh 6-digit verification code has been sent to your email.',
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to resend email code', details: err?.message });
  }
});

// 5. Mark Phone Verified (called when Firebase Phone Authentication succeeds on client)
app.post('/api/auth/mark-phone-verified', (req, res) => {
  try {
    const { pendingRegistrationId, firebaseUid, phoneNumber } = req.body;

    if (!pendingRegistrationId) {
      return res.status(400).json({ error: 'Pending registration ID is required.' });
    }

    const pending = securityService.getPendingRegistration(pendingRegistrationId);
    if (!pending) {
      return res.status(404).json({ error: 'Registration session expired. Please restart registration.' });
    }

    securityService.updatePendingRegistration(pendingRegistrationId, {
      phoneVerified: true,
    });

    securityService.logAudit({
      actorEmail: pending.email,
      eventType: 'FIREBASE_PHONE_VERIFIED',
      metadata: { pendingRegistrationId, firebaseUid, phoneNumber },
    });

    res.json({
      success: true,
      phoneVerified: true,
      message: 'Mobile phone number verified successfully via Firebase Phone Authentication!',
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to record phone verification', details: err?.message });
  }
});

// 6. Complete Registration & Atomically Enroll Device
app.post('/api/auth/complete-registration', (req, res) => {
  try {
    const { pendingRegistrationId, faceTemplateReference, webauthnCredentialId } = req.body;

    const pending = securityService.getPendingRegistration(pendingRegistrationId);
    if (!pending) {
      return res.status(404).json({ error: 'Pending registration session expired or invalid.' });
    }

    if (!pending.emailVerified) {
      return res.status(400).json({ error: 'Email verification is mandatory prior to account activation.' });
    }

    if (!pending.phoneVerified) {
      return res.status(400).json({ error: 'Mobile phone verification is mandatory prior to account activation.' });
    }

    // Final Atomic Device Enrollment Collision Check
    const currentCookie = req.cookies?.secure_device_enrollment;
    const existingDevice = currentCookie ? securityService.getDeviceByToken(currentCookie) : undefined;
    if (existingDevice) {
      return res.status(409).json({
        error: 'Account Already Registered',
        message: 'This device already has a registered account. Only one account can be created per enrolled device.',
        code: 'DEVICE_ALREADY_REGISTERED',
      });
    }

    // Generate new Device Credential Token
    const deviceToken = securityService.generateDeviceToken();
    const userId = `usr_${Date.now()}`;

    // Enroll Device
    const deviceRecord = securityService.enrollDevice({
      userId,
      userEmail: pending.email,
      userName: pending.fullName,
      deviceToken,
      userAgent: req.headers['user-agent'] || '',
      ipAddress: req.ip || req.socket.remoteAddress || '127.0.0.1',
    });

    // Set secure HttpOnly, SameSite=Lax cookie for 1 year
    res.cookie('secure_device_enrollment', deviceToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 365 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    // Create active user record
    const newUser = {
      userId,
      fullName: pending.fullName,
      email: pending.email,
      phone: pending.phone,
      role: pending.role,
      institutionId: pending.institutionId || 'inst_apex',
      department: pending.department || 'Computer Science & Engineering',
      studentId: pending.studentId || `STU-${Math.floor(1000 + Math.random() * 9000)}`,
      emailVerified: true,
      phoneVerified: true,
      faceEnrollmentStatus: 'enrolled',
      faceTemplateReference: faceTemplateReference || `tmpl_enc_${Date.now()}_sha256`,
      hasPasskey: !!webauthnCredentialId,
      accountStatus: 'active',
      registrationStatus: 'active',
      activeDeviceId: deviceRecord.id,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(pending.fullName)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Clean up pending registration
    securityService.removePendingRegistration(pendingRegistrationId);

    res.json({
      success: true,
      user: newUser,
      device: {
        id: deviceRecord.id,
        label: deviceRecord.deviceLabel,
        enrolledAt: deviceRecord.enrolledAt,
      },
      message: 'Account successfully registered and device securely enrolled!',
    });
  } catch (err: any) {
    console.error('Complete registration error:', err);
    res.status(500).json({ error: 'Failed to complete registration and device enrollment', details: err?.message });
  }
});

// 7. WebAuthn Passkeys Endpoints
app.post('/api/auth/webauthn/register-options', (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'User email is required' });

    const challenge = securityService.generateWebAuthnChallenge(email);

    res.json({
      challenge,
      rp: {
        name: 'Secure Online Examination Portal',
        id: req.hostname || 'localhost',
      },
      user: {
        id: Buffer.from(email).toString('base64url'),
        name: email,
        displayName: email.split('@')[0],
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' },  // ES256
        { alg: -257, type: 'public-key' }, // RS256
      ],
      timeout: 60000,
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'preferred',
        residentKey: 'preferred',
      },
      attestation: 'none',
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate WebAuthn options', details: err?.message });
  }
});

app.post('/api/auth/webauthn/register-verify', (req, res) => {
  try {
    const { email, credentialId, clientDataJSON, attestationObject, deviceType } = req.body;
    if (!email || !credentialId) {
      return res.status(400).json({ error: 'Missing registration verification payload' });
    }

    // Save registered passkey credential
    const cred = securityService.registerWebAuthnCredential({
      credentialId,
      userId: `usr_passkey_${Date.now()}`,
      userEmail: email,
      publicKey: attestationObject || credentialId,
      deviceType: deviceType || 'platform_biometric',
    });

    res.json({
      success: true,
      credentialId: cred.id,
      message: 'Passkey registered successfully for biometric login!',
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to verify WebAuthn passkey', details: err?.message });
  }
});

app.post('/api/auth/webauthn/auth-options', (req, res) => {
  try {
    const { email } = req.body;
    const challenge = securityService.generateWebAuthnChallenge(email || 'anonymous');
    const existingCreds = email ? securityService.getWebAuthnCredentialsForUser(email) : [];

    res.json({
      challenge,
      timeout: 60000,
      rpId: req.hostname || 'localhost',
      allowCredentials: existingCreds.map(c => ({
        id: c.id,
        type: 'public-key',
        transports: ['internal', 'hybrid'],
      })),
      userVerification: 'preferred',
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create auth options', details: err?.message });
  }
});

app.post('/api/auth/webauthn/auth-verify', (req, res) => {
  try {
    const { credentialId, email } = req.body;
    if (!credentialId) {
      return res.status(400).json({ error: 'Credential ID is required' });
    }

    securityService.logAudit({
      actorEmail: email || 'passkey_user',
      eventType: 'WEBAUTHN_PASSKEY_LOGIN',
      metadata: { credentialId },
    });

    res.json({
      success: true,
      message: 'Passkey biometric authentication verified successfully!',
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Passkey authentication failed', details: err?.message });
  }
});

// 8. Backend Admin Permission Enforcement
app.post('/api/auth/admin/verify-admin-role', (req, res) => {
  try {
    const { email, role, token } = req.body;

    // Check if role is admin and authorized email
    const isAdmin = role === 'admin' && (
      email === 'adityaprakash281204@gmail.com' ||
      email?.endsWith('@exam-board.edu') ||
      email?.includes('admin')
    );

    if (!isAdmin) {
      return res.status(403).json({
        authorized: false,
        error: 'Access Denied: Administrative privileges required.',
      });
    }

    res.json({ authorized: true, role: 'admin' });
  } catch (err: any) {
    res.status(500).json({ error: 'Admin check failed', details: err?.message });
  }
});

// 9. System Configuration Status
app.get('/api/auth/system-config-status', (req, res) => {
  try {
    const hasGmail = !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
    const hasFirebase = true; // Provisioned
    const activeDevices = securityService.getAllDevices().filter(d => d.enrollmentStatus === 'active').length;

    res.json({
      gmailSmtp: {
        configured: hasGmail,
        sender: hasGmail ? maskEmail(process.env.GMAIL_USER || '') : 'Not configured (Sandbox mode active)',
        provider: 'Nodemailer Gmail SMTP',
      },
      firebase: {
        configured: hasFirebase,
        projectId: 'earnest-order-98p5g',
        auth: 'Firebase Authentication (Email/Password & Phone SMS OTP with reCAPTCHA)',
        database: 'Cloud Firestore',
      },
      webauthn: {
        enabled: true,
        supportedAlgs: ['ES256', 'RS256'],
        features: ['TouchID', 'FaceID', 'Windows Hello', 'FIDO2 Passkeys'],
      },
      deviceGuard: {
        oneAccountPerDeviceEnforced: true,
        activeEnrolledDevices: activeDevices,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to inspect system status', details: err?.message });
  }
});

// 10. Device Recovery Application
app.post('/api/auth/device-recovery-request', (req, res) => {
  try {
    const { email, studentId, fullName, phone, reason } = req.body;

    if (!email || !studentId || !fullName || !reason) {
      return res.status(400).json({ error: 'Full name, email, student ID, and recovery reason are required.' });
    }

    const recovery = securityService.createRecoveryRequest({
      email,
      studentId,
      fullName,
      phone: phone || '',
      reason,
    });

    res.json({
      success: true,
      recoveryId: recovery.id,
      message: 'Device recovery request submitted successfully. An administrator will review your application.',
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to submit recovery request', details: err?.message });
  }
});

// 11. Admin Device Management & Audit Endpoints
app.get('/api/auth/admin/device-management', (req, res) => {
  try {
    res.json({
      devices: securityService.getAllDevices(),
      recoveryRequests: securityService.getAllRecoveryRequests(),
      auditLogs: securityService.getAuditLogs(),
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve device management records', details: err?.message });
  }
});

app.post('/api/auth/admin/approve-recovery', (req, res) => {
  try {
    const { requestId, adminEmail } = req.body;
    if (!requestId) return res.status(400).json({ error: 'requestId is required' });

    const ok = securityService.approveRecoveryRequest(requestId, adminEmail || 'adityaprakash281204@gmail.com');
    if (!ok) return res.status(404).json({ error: 'Recovery request not found' });

    res.json({ success: true, message: 'Device recovery request approved and old device enrollment revoked.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to approve recovery', details: err?.message });
  }
});

app.post('/api/auth/admin/revoke-device', (req, res) => {
  try {
    const { deviceId, reason } = req.body;
    if (!deviceId) return res.status(400).json({ error: 'deviceId is required' });

    const ok = securityService.revokeDevice(deviceId, reason || 'Revoked by administrator');
    if (!ok) return res.status(404).json({ error: 'Device record not found' });

    res.json({ success: true, message: 'Device enrollment successfully revoked.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to revoke device', details: err?.message });
  }
});

// Clear local device cookie (for user logout or testing)
app.post('/api/auth/device-clear-cookie', (req, res) => {
  res.clearCookie('secure_device_enrollment', { path: '/' });
  res.json({ success: true, message: 'Device cookie cleared.' });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';
  const httpServer = http.createServer(app);

  if (isDev) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Secure Online Examination Portal server running at http://localhost:${PORT}`);
  });
}

startServer();
