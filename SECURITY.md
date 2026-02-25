# 🔐 SplitRx Security Architecture

**A Complete Guide to How SplitRx Protects Medical Data**

This document explains all the security features in SplitRx in a way that anyone can understand, with technical details for developers.

---

## Table of Contents

1. [Security Overview](#security-overview)
2. [Layer 1: Security Headers (Helmet)](#layer-1-security-headers-helmet)
3. [Layer 2: Rate Limiting](#layer-2-rate-limiting)
4. [Layer 3: Input Validation](#layer-3-input-validation)
5. [Layer 4: Password Security](#layer-4-password-security)
6. [Layer 5: Data Encryption](#layer-5-data-encryption)
7. [Layer 6: Digital Signatures](#layer-6-digital-signatures)
8. [Layer 7: Audit Logging](#layer-7-audit-logging)
9. [Layer 8: Adaptive Authentication](#layer-8-adaptive-authentication)
10. [Security Summary](#security-summary)

---

## Security Overview

SplitRx uses **8 layers of security** to protect sensitive medical data:

```
┌─────────────────────────────────────────────────────────────┐
│                    🌐 INTERNET                               │
│                         │                                    │
│                         ▼                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🔒 Layer 1: Security Headers (Helmet)               │   │
│  │    └── XSS, Clickjacking, MIME protection           │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ 🚦 Layer 2: Rate Limiting                           │   │
│  │    └── Prevents brute force & DoS attacks           │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ ✅ Layer 3: Input Validation                        │   │
│  │    └── Prevents SQL injection & bad data            │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ 🔑 Layer 4: Password Security                       │   │
│  │    └── bcrypt hashing with account lockout          │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ 🔐 Layer 5: Data Encryption (AES-256-GCM)          │   │
│  │    └── All medical data encrypted at rest           │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ ✍️ Layer 6: Digital Signatures (RSA-SHA256)         │   │
│  │    └── Proves prescription authenticity             │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ 📝 Layer 7: Audit Logging                           │   │
│  │    └── Tamper-proof blockchain-style logs           │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ 🧠 Layer 8: Adaptive Authentication                 │   │
│  │    └── Real-time risk scoring                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                         │                                    │
│                         ▼                                    │
│                 💾 ENCRYPTED DATABASE                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Layer 1: Security Headers (Helmet)

### 🎯 Simple Explanation

Imagine your browser is a house. Security headers are like installing:

- **Locks on all doors** (prevents unauthorized access)
- **Security cameras** (monitors suspicious activity)
- **Window bars** (blocks break-in attempts)

### 🛡️ What It Protects Against

| Attack                         | Without Protection                     | With Helmet |
| ------------------------------ | -------------------------------------- | ----------- |
| **XSS (Cross-Site Scripting)** | Hackers inject malicious scripts       | ❌ Blocked  |
| **Clickjacking**               | Hidden buttons trick you into clicking | ❌ Blocked  |
| **MIME Sniffing**              | Browser misinterprets dangerous files  | ❌ Blocked  |
| **Protocol Downgrade**         | Forces insecure HTTP connection        | ❌ Blocked  |

### 💻 Technical Implementation

**File:** `backend/src/app.ts`

```typescript
app.use(
  helmet({
    // Content Security Policy - controls what can run on the page
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"], // Only load from our domain
        scriptSrc: ["'self'"], // Only run our scripts
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
        frameSrc: ["'none'"], // No iframes (prevents clickjacking)
        objectSrc: ["'none'"], // No plugins (Flash, Java)
      },
    },
    // HTTP Strict Transport Security
    hsts: {
      maxAge: 31536000, // Force HTTPS for 1 year
      includeSubDomains: true,
      preload: true,
    },
  }),
);
```

### 📊 Headers Set by Helmet

| Header                      | Value                   | Purpose                   |
| --------------------------- | ----------------------- | ------------------------- |
| `Content-Security-Policy`   | `default-src 'self'...` | Controls resource loading |
| `Strict-Transport-Security` | `max-age=31536000`      | Forces HTTPS              |
| `X-Frame-Options`           | `DENY`                  | Prevents clickjacking     |
| `X-Content-Type-Options`    | `nosniff`               | Prevents MIME confusion   |
| `X-XSS-Protection`          | `1; mode=block`         | Extra XSS protection      |

---

## Layer 2: Rate Limiting

### 🎯 Simple Explanation

Imagine a bouncer at a club who counts how many times you try to enter. If you try too many times in 15 minutes, you're temporarily banned. This stops:

- **Hackers trying millions of passwords**
- **Bots overwhelming the server**
- **Automated attacks**

### 🚦 Rate Limits in SplitRx

| Endpoint                | Max Requests | Time Window | Purpose                    |
| ----------------------- | ------------ | ----------- | -------------------------- |
| **All API**             | 100          | 15 minutes  | General protection         |
| **Login/Register**      | 5            | 15 minutes  | Prevents password guessing |
| **Create Prescription** | 50           | 1 hour      | Prevents abuse             |

### 💻 Technical Implementation

**File:** `backend/src/middleware/rateLimiter.ts`

```typescript
// Login protection - only 5 attempts allowed
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests max
  skipSuccessfulRequests: true, // ✨ Only counts FAILED attempts!
  message: {
    error: "Too many login attempts. Account temporarily locked.",
    code: "AUTH_RATE_LIMITED",
  },
});
```

### 📈 How It Works

```
User tries to login:

Attempt 1 ❌ Wrong password  → Counter: 1/5 ✅ Allowed
Attempt 2 ❌ Wrong password  → Counter: 2/5 ✅ Allowed
Attempt 3 ❌ Wrong password  → Counter: 3/5 ✅ Allowed
Attempt 4 ❌ Wrong password  → Counter: 4/5 ✅ Allowed
Attempt 5 ❌ Wrong password  → Counter: 5/5 ✅ Allowed
Attempt 6 ❌ Wrong password  → 🚫 BLOCKED! Try again in 15 min

Attempt 7 ✅ Correct password → Counter: 0 (successful login resets)
```

---

## Layer 3: Input Validation

### 🎯 Simple Explanation

Never trust user input! Imagine you ask someone their name and they say:

```
Robert'); DROP TABLE users;--
```

This is an SQL injection attack. Input validation checks **everything** before using it.

### ✅ What Gets Validated

**File:** `backend/src/middleware/inputValidator.ts`

| Field        | Rules                                           | Example                  |
| ------------ | ----------------------------------------------- | ------------------------ |
| **Email**    | Valid format, max 255 chars                     | `doctor@hospital.com` ✅ |
| **Password** | 8+ chars, uppercase, lowercase, number, special | `Pass@123` ✅            |
| **Name**     | Letters, spaces, hyphens only                   | `Dr. O'Brien` ✅         |
| **UUID**     | Valid UUID format                               | `123e4567-e89b-...` ✅   |

### 💻 Technical Implementation

```typescript
// Password must be VERY strong
export const registerSchema = z.object({
  email: z.string().email().max(255),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128)
    .regex(/[A-Z]/, "Must contain uppercase letter")
    .regex(/[a-z]/, "Must contain lowercase letter")
    .regex(/[0-9]/, "Must contain number")
    .regex(/[^A-Za-z0-9]/, "Must contain special character"),
  full_name: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-zA-Z\s'-]+$/, "Invalid characters in name"),
  role: z.enum(["doctor", "patient", "pharmacist"]),
});
```

### 🛡️ SQL Injection Prevention

SplitRx uses **parameterized queries** - your input can NEVER become SQL code:

```typescript
// ❌ DANGEROUS (never do this)
const query = `SELECT * FROM users WHERE email = '${userInput}'`;

// ✅ SAFE (what SplitRx does)
const query = "SELECT * FROM users WHERE email = $1";
pool.query(query, [userInput]); // Input is just data, never code
```

---

## Layer 4: Password Security

### 🎯 Simple Explanation

Your password is **never stored**. Instead, we store a "fingerprint" of it using bcrypt:

```
Original:    MyP@ssw0rd
Stored:      $2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4AwOl7MZQP7Mq...
```

Even if hackers steal the database, they can't reverse the fingerprint!

### 🔑 How bcrypt Works

**File:** `backend/src/crypto/hashing.ts`

```typescript
// Hash password (one-way - cannot be reversed)
static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);  // 12 rounds = ~300ms to compute
}

// Verify password
static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}
```

### ⏱️ Why 12 Rounds?

| Rounds | Time to Hash | Guesses/Second (Attacker) |
| ------ | ------------ | ------------------------- |
| 10     | ~100ms       | 10                        |
| **12** | **~300ms**   | **3**                     |
| 14     | ~1 second    | 1                         |

More rounds = slower for attackers to guess passwords!

### 🔒 Account Lockout

After 5 failed attempts, the account is locked for 30 minutes:

```typescript
if (newAttempts >= 5) {
  lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
}
```

---

## Layer 5: Data Encryption

### 🎯 Simple Explanation

All prescription data is **encrypted** before storage. It's like putting your medical records in a safe that only YOU have the combination to.

```
What Doctor Types:          What's Stored in Database:
┌────────────────────┐      ┌─────────────────────────────────────┐
│ Medication: Aspirin│  →   │ a7f3c9d2e8b4a1f...encrypted...x8k4 │
│ Dosage: 500mg      │      │ 9c2d8f3a1e7b4c...gibberish...m2n5  │
│ Take twice daily   │      │ f4a8e2c6d9b3a7...unreadable...p1q9 │
└────────────────────┘      └─────────────────────────────────────┘
```

### 🔐 AES-256-GCM Explained

**File:** `backend/src/crypto/encryption.ts`

| Component | What It Means                                         |
| --------- | ----------------------------------------------------- |
| **AES**   | Advanced Encryption Standard (US government approved) |
| **256**   | 256-bit key (2^256 possible combinations)             |
| **GCM**   | Galois/Counter Mode (detects tampering!)              |

### 💻 Technical Implementation

```typescript
encrypt(plaintext: string): { ciphertext: string; iv: string; tag: string } {
    // 1. Generate random IV (Initialization Vector) for each encryption
    const iv = crypto.randomBytes(16);  // 16 bytes = 128 bits

    // 2. Create cipher with our secret key
    const cipher = crypto.createCipheriv('aes-256-gcm', this.masterKey, iv);

    // 3. Encrypt the data
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // 4. Get authentication tag (proves data wasn't tampered)
    const tag = cipher.getAuthTag();

    return {
        ciphertext: encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
    };
}
```

### 🛡️ Why Is This Secure?

| Feature                      | Protection                                        |
| ---------------------------- | ------------------------------------------------- |
| **256-bit key**              | Would take billions of years to crack             |
| **Random IV per encryption** | Same text produces different ciphertext each time |
| **GCM authentication tag**   | If anyone modifies the data, decryption fails     |

---

## Layer 6: Digital Signatures

### 🎯 Simple Explanation

When a doctor writes a prescription, they **sign** it with their private key. It's like signing a check - it proves YOU wrote it and nobody changed it.

```
Doctor's Process:                    Pharmacist's Verification:
┌──────────────────┐                 ┌──────────────────┐
│ 1. Write Rx      │                 │ 1. Receive Rx    │
│ 2. Sign with     │ ───────────────▶│ 2. Check with    │
│    Private Key   │                 │    Public Key    │
│                  │                 │ 3. Valid? ✅     │
└──────────────────┘                 └──────────────────┘
```

### 🔑 How Signing Works

**File:** `backend/src/crypto/signing.ts`

```typescript
// When a doctor registers, they get a key pair
static generateKeyPair(): { publicKey: string; privateKey: string } {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,  // 2048-bit RSA key
    });
    return { publicKey, privateKey };
}

// Doctor signs the prescription
static sign(data: string, privateKey: string): string {
    const sign = crypto.createSign('SHA256');
    sign.update(data);
    return sign.sign(privateKey, 'hex');
}

// Pharmacist verifies the signature
static verify(data: string, signature: string, publicKey: string): boolean {
    const verify = crypto.createVerify('SHA256');
    verify.update(data);
    return verify.verify(publicKey, signature, 'hex');
}
```

### 📜 What Gets Signed?

| Data         | Signed? | Why                        |
| ------------ | ------- | -------------------------- |
| Patient name | ✅      | Ensures correct patient    |
| Medication   | ✅      | Prevents drug substitution |
| Dosage       | ✅      | Prevents dose tampering    |
| Expiry date  | ✅      | Prevents extension fraud   |
| Doctor ID    | ✅      | Proves doctor wrote it     |

---

## Layer 7: Audit Logging

### 🎯 Simple Explanation

Every action in the system is recorded in an **unchangeable logbook**. It's like a flight recorder (black box) for your application - if something goes wrong, we can see exactly what happened.

### 📝 What Gets Logged

| Event               | Details Recorded                                 |
| ------------------- | ------------------------------------------------ |
| Login success       | User ID, IP address, browser, time               |
| Login failure       | Attempted email, IP, attempts count              |
| View prescription   | Who viewed, whose data, when                     |
| Create prescription | Doctor, patient, medication details              |
| Dispense medicine   | Pharmacist, prescription ID, verification status |

### 🔗 Blockchain-Style Integrity

Each log entry contains a **hash of the previous entry**, creating a chain:

```
Entry 1              Entry 2                  Entry 3
┌──────────────┐     ┌───────────────────┐    ┌───────────────────┐
│ Action: Login│     │ Action: View Rx   │    │ Action: Dispense  │
│ Time: 10:00  │     │ Time: 10:05       │    │ Time: 10:10       │
│ Hash: ABC123 │────▶│ Prev Hash: ABC123 │───▶│ Prev Hash: DEF456 │
│              │     │ Hash: DEF456      │    │ Hash: GHI789      │
└──────────────┘     └───────────────────┘    └───────────────────┘

If someone modifies Entry 2:
- Its hash changes from DEF456 to XXX
- Entry 3's "Prev Hash" (DEF456) no longer matches
- TAMPERING DETECTED! 🚨
```

### 💻 Technical Implementation

```sql
-- Database schema
CREATE TABLE audit_log (
    id UUID PRIMARY KEY,
    actor_id UUID,              -- Who did it
    action VARCHAR(255),        -- What they did
    resource_type VARCHAR(255), -- What resource
    resource_id UUID,           -- Which specific resource
    ip_address VARCHAR(45),     -- From where
    user_agent TEXT,            -- What browser
    previous_hash VARCHAR(64),  -- Link to previous entry
    entry_hash VARCHAR(64),     -- This entry's fingerprint
    timestamp TIMESTAMP         -- When
);
```

---

## Layer 8: Adaptive Authentication

### 🎯 Simple Explanation

The system continuously monitors your behavior and calculates a **risk score**. If something seems suspicious (like logging in from a new country at 3 AM), it takes action.

### 📊 Risk Factors

**File:** `backend/src/middleware/adaptiveAuth.ts`

| Factor             | Points | Example                   |
| ------------------ | ------ | ------------------------- |
| IP address changed | +30    | You're suddenly in Russia |
| Browser changed    | +25    | Chrome → Safari           |
| Unusual hour       | +10    | 3 AM login                |
| High activity      | +20    | 50+ actions in 5 minutes  |
| Sensitive resource | +15    | Accessing patient records |

### 🚨 Risk Thresholds

| Score  | Action                            |
| ------ | --------------------------------- |
| 0-49   | ✅ Normal - proceed               |
| 50-79  | ⚠️ Warning - log and monitor      |
| 80-100 | 🚫 Block session - force re-login |

### 💻 Technical Implementation

```typescript
// Calculate risk score
let riskScore = 0;
if (riskFactors.ipChanged) riskScore += 30;
if (riskFactors.userAgentChanged) riskScore += 25;
if (riskFactors.unusualHour) riskScore += 10;
if (riskFactors.highActionFrequency) riskScore += 20;
if (riskFactors.sensitiveResource) riskScore += 15;

// Take action based on score
if (riskScore >= 80) {
  // BLOCK - Too risky!
  await pool.query("UPDATE sessions SET is_active = false WHERE id = $1", [
    session.id,
  ]);
  return res.status(403).json({
    error: "Session blocked due to suspicious activity",
    action: "RE_AUTHENTICATE",
  });
}
```

---

## Security Summary

### 🏆 Complete Protection Stack

| Layer            | Technology         | Protects Against                |
| ---------------- | ------------------ | ------------------------------- |
| 1. Headers       | Helmet.js          | XSS, clickjacking, MIME attacks |
| 2. Rate Limiting | express-rate-limit | Brute force, DoS                |
| 3. Validation    | Zod schemas        | SQL injection, bad data         |
| 4. Passwords     | bcrypt (12 rounds) | Password cracking               |
| 5. Encryption    | AES-256-GCM        | Data theft                      |
| 6. Signatures    | RSA-SHA256         | Prescription forgery            |
| 7. Audit Logs    | Hash chain         | Log tampering                   |
| 8. Adaptive Auth | Risk scoring       | Account takeover                |

### 🔐 Data Protection Flow

```
User Input
    │
    ▼
┌───────────────────┐
│ ✅ Validate Input │  ← Reject bad data
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ 🔑 Hash Password  │  ← One-way transformation
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ 🔐 Encrypt Data   │  ← AES-256-GCM
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ ✍️ Sign Prescription│ ← RSA digital signature
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ 📝 Log Action     │  ← Tamper-proof audit
└─────────┬─────────┘
          │
          ▼
    💾 Database
```

---

## Quick Reference

### Security Configuration

**File:** `backend/src/config/security.ts`

```typescript
export const SECURITY_CONFIG = {
  jwt: {
    accessTokenExpiry: "15m", // Short-lived tokens
    refreshTokenExpiry: "7d",
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minute windows
    maxRequests: 100,
    authMaxRequests: 5,
  },
  password: {
    saltRounds: 12, // bcrypt cost factor
    minLength: 8,
  },
  encryption: {
    algorithm: "aes-256-gcm",
  },
  session: {
    maxFailedAttempts: 5,
    lockoutDuration: 30 * 60 * 1000, // 30 minutes
  },
  riskThresholds: {
    warning: 50,
    critical: 80,
  },
};
```

---

_This document was generated as part of the SplitRx security audit. Last updated: February 26, 2026_
