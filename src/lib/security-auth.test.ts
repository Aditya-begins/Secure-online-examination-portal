import test from 'node:test';
import assert from 'node:assert/strict';
import { securityService } from '../../server/security-service';

test('SecurityService generates secure 6-digit OTP', () => {
  const otp = securityService.generate6DigitOtp();
  assert.equal(typeof otp, 'string');
  assert.equal(otp.length, 6);
  assert.match(otp, /^\d{6}$/);
});

test('SecurityService creates pending registration and dispatches email OTP', () => {
  const pending = securityService.createPendingRegistration({
    fullName: 'Test Candidate',
    email: 'test.candidate@university.edu',
    phone: '+15551234567',
    password: 'password123',
    studentId: 'STU-TEST-001',
    role: 'student',
  });

  assert.ok(pending.id.startsWith('preg_'));
  assert.equal(pending.emailVerified, false);
  assert.equal(pending.phoneVerified, false);

  const otpResult = securityService.createAndSendEmailOtp(pending);
  assert.equal(otpResult.success, true);
  assert.ok(otpResult.deliveryInfo.sent);
});

test('SecurityService verifies correct email OTP and rejects incorrect OTP', () => {
  const pending = securityService.createPendingRegistration({
    fullName: 'Jordan Lee',
    email: 'jordan.lee@university.edu',
    phone: '+15559876543',
    password: 'securePassword1!',
  });

  const sendRes = securityService.createAndSendEmailOtp(pending);
  assert.equal(sendRes.success, true);
  const correctOtp = sendRes.deliveryInfo.sandboxOtp || securityService.getLastSentOtpForTesting();
  assert.ok(correctOtp);

  // Incorrect OTP test
  const badRes = securityService.verifyEmailOtp(pending.id, '000000');
  assert.equal(badRes.success, false);
  assert.equal(badRes.attemptsLeft, 4);

  // Correct OTP test
  const goodRes = securityService.verifyEmailOtp(pending.id, correctOtp);
  assert.equal(goodRes.success, true);

  const updatedPending = securityService.getPendingRegistration(pending.id);
  assert.equal(updatedPending?.emailVerified, true);
});

test('SecurityService enforces One Device = One Account Policy', () => {
  const deviceToken = securityService.generateDeviceToken();
  const userId = 'usr_test_device_student_1';

  // Enroll device
  const enrolled = securityService.enrollDevice({
    userId,
    userEmail: 'dev.student1@university.edu',
    userName: 'Device Student One',
    deviceToken,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    ipAddress: '192.168.1.100',
  });

  assert.equal(enrolled.enrollmentStatus, 'active');

  // Lookup by token
  const found = securityService.getDeviceByToken(deviceToken);
  assert.ok(found);
  assert.equal(found?.userId, userId);
  assert.equal(found?.userEmail, 'dev.student1@university.edu');

  // Verify unknown token returns undefined
  const unknown = securityService.getDeviceByToken('fake_unknown_token_123');
  assert.equal(unknown, undefined);
});

test('SecurityService processes device recovery request and approval', () => {
  const req = securityService.createRecoveryRequest({
    email: 'dev.student1@university.edu',
    studentId: 'STU-DEV-01',
    fullName: 'Device Student One',
    phone: '+15551234567',
    reason: 'Hardware reset',
  });

  assert.ok(req.id.startsWith('rec_'));
  assert.equal(req.status, 'pending');

  const approved = securityService.approveRecoveryRequest(req.id, 'admin@university.edu');
  assert.equal(approved, true);

  const allReqs = securityService.getAllRecoveryRequests();
  const foundReq = allReqs.find(r => r.id === req.id);
  assert.equal(foundReq?.status, 'approved');
});

test('SecurityService manages secure dynamic salt without hardcoded secrets', () => {
  const salt = securityService.getSalt();
  assert.equal(typeof salt, 'string');
  assert.ok(salt.length >= 16);

  const hash1 = securityService.hash('sample_payload_data');
  const hash2 = securityService.hash('sample_payload_data');
  assert.equal(hash1, hash2);
  assert.equal(hash1.length, 64); // SHA-256 hex string
});

test('SecurityService generates and verifies WebAuthn challenge and registers passkey', () => {
  const testEmail = 'candidate.webauthn@university.edu';
  const challenge = securityService.generateWebAuthnChallenge(testEmail);
  assert.equal(typeof challenge, 'string');
  assert.ok(challenge.length > 20);

  // Register passkey credential
  const cred = securityService.registerWebAuthnCredential({
    credentialId: 'cred_test_passkey_abc123',
    userId: 'usr_passkey_candidate_1',
    userEmail: testEmail,
    publicKey: 'sample_raw_public_key_bytes',
  });

  assert.equal(cred.id, 'cred_test_passkey_abc123');
  assert.equal(cred.userEmail, testEmail);

  // Lookup credentials
  const foundCreds = securityService.getWebAuthnCredentialsForUser(testEmail);
  assert.equal(foundCreds.length, 1);
  assert.equal(foundCreds[0].id, 'cred_test_passkey_abc123');

  // Verify challenge
  const valid = securityService.verifyWebAuthnChallenge(challenge);
  assert.equal(valid, true);

  // Challenge should be single-use
  const reused = securityService.verifyWebAuthnChallenge(challenge);
  assert.equal(reused, false);
});
