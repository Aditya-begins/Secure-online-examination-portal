# Secure Online Examination Portal - Setup & Integration Guide

This guide details the configuration and architecture for **Gmail SMTP Email Verification**, **Firebase Phone Authentication**, **Firebase Cloud Firestore**, and **WebAuthn Biometric Passkeys**.

---

## 1. Gmail SMTP Email OTP Verification (Nodemailer)

The portal uses Nodemailer to send real 6-digit One-Time Passwords directly to candidates' emails via Gmail SMTP.

### Configuration

Add the following variables to your environment or `.env`:

```env
GMAIL_USER="your-email@gmail.com"
GMAIL_APP_PASSWORD="xxxx xxxx xxxx xxxx"
```

### How to Generate a Gmail App Password

1. Go to your **Google Account**: [https://myaccount.google.com/](https://myaccount.google.com/)
2. Open **Security** and confirm that **2-Step Verification** is turned on.
3. In the search bar at the top, type `App passwords` or navigate to [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).
4. Enter an application name (e.g. `SecureExam Online Portal`) and click **Create**.
5. Copy the generated 16-character passcode and paste it into `GMAIL_APP_PASSWORD`.
6. Restart the server: `npm run dev`.

*Note:* When `GMAIL_USER` and `GMAIL_APP_PASSWORD` are not configured in local development, the server logs the generated verification code in the server terminal and displays a setup guidance card so developers can test without interruption.

---

## 2. Firebase Phone Authentication & Cloud Firestore

### Provisioned Firebase Project Details

- **Project ID:** `earnest-order-98p5g`
- **Auth Domain:** `earnest-order-98p5g.firebaseapp.com`
- **Firestore Database ID:** `ai-studio-secureonlineexam-4877a177-f8a1-493f-ab29-b19a1b1b84c4`
- **Rules File:** `firestore.rules` (enforces role-based permissions, student-owner protection, and admin isolation)

### Real Phone SMS OTP & Test Phone Numbers

Firebase Phone Authentication delivers real SMS messages worldwide and validates incoming codes through Firebase Auth servers.

For testing during development without consuming SMS quotas:
1. In the **Firebase Console** -> **Authentication** -> **Sign-in method** -> **Phone**.
2. Under **Phone numbers for testing (optional)**, add:
   - Phone Number: `+1 650-555-1234`
   - Verification Code: `6-digit test code` (e.g. `123456`)
3. When registering with `+1 650-555-1234`, enter `123456` to instantly verify.

---

## 3. WebAuthn / Passkeys vs. Camera Face Verification

The portal clearly distinguishes between:

1. **Hardware Passkeys / Platform Biometrics (WebAuthn / FIDO2)**
   - Utilizes physical platform authenticators (Apple Touch ID, Face ID, Windows Hello, Android Biometrics, or USB Security Keys like YubiKey).
   - High-grade cryptographic challenge-response signature that prevents phishing and session hijacking.
   - Accessible on both Login and Student Registration pages.

2. **Webcam Facial Integrity Proctoring**
   - Live browser camera video feed analyzed during the examination session.
   - Monitors student eye gaze, head pose, multiple persons in frame, and absence from the camera.
   - Enforces a 2-warning policy with automated submission upon a 3rd confirmed violation.

---

## 4. One Device = One Registered Account Policy

- Upon successful completion of email and phone verification, the server generates a cryptographically random device credential token.
- A secure, persistent cookie (`secure_device_enrollment`) is set with `HttpOnly`, `SameSite=Lax`, and `Secure` attributes.
- The server stores only the cryptographic SHA-256 hash of the device credential in the database.
- Any attempt to register another account from the same browser/device installation is rejected with an **"Account Already Registered"** modal.
- Users who need to legitimately switch accounts or whose devices were reset can submit a formal **Device Recovery Application** reviewed by administrators.

---

## 5. Security Salt Configuration

```env
SECURITY_SALT="your_custom_secure_256bit_salt"
```

If not provided, the server securely generates a random 32-byte salt at first boot and persists it in `data/security-db.json`. No secrets or hardcoded credentials exist in source code.
