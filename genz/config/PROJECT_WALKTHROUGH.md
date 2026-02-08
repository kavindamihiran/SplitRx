# 🦸 Zero to Hero: Mastering SplitRx

Welcome to the ultimate guide to **SplitRx**. This document is designed to take you from "I know what it does" to "I can explain every line of code to a judge."

---

## 🚀 1. The Elevator Pitch (What & Why)

**What is it?**
SplitRx is a **tamper-proof prescription management system**. It uses military-grade encryption and a blockchain-inspired audit trail to ensure that medical data is never stolen, forged, or altered.

**Why did we build it?**
Traditional e-prescription systems are vulnerable to:
1.  **Data Breaches:** Hackers stealing patient data.
2.  **Insider Threats:** Admins changing logs to cover up mistakes.
3.  **Prescription Fraud:** Fake prescriptions being created or reused.

**SplitRx Solution:**
-   **Encryption:** Even if hackers get the database, they only see gibberish.
-   **Digital Signatures:** Doctors "sign" every Rx; if a single pixel changes, the signature breaks.
-   **Immutable Audit:** Every action is linked to the previous one (like Bitcoin). You can't delete a log without breaking the whole chain.

---

## 🏗️ 2. The Architecture (High Level)

### The Stack
-   **Frontend:** Next.js 16 (React) + Tailwind CSS + Lucide Icons.
-   **Backend:** Node.js + Express + TypeScript.
-   **Database:** PostgreSQL (Relation data + JSONB for logs).
-   **Security:** Native Node.js `crypto` module (No 3rd party black boxes).

### The Flow
1.  **Client (Frontend)** sends data to **API**.
2.  **API** validates data (Zod schemas).
3.  **Processing:**
    -   **Sign:** Doctor's private key signs the data.
    -   **Encrypt:** System encrypts the payload.
    -   **Hash:** System calculates unique fingerprint.
4.  **Storage:** Encrypted data goes to SQL DB.
5.  **Audit:** Action is logged with a hash linking to the *previous* log entry.

---

## 🔐 3. Security Deep Dive (The "Judge Killers")

Judges love technical depth. Memorize these 3 pillars.

### Pillar 1: Encryption (Confidentiality)
*File:* `backend/src/crypto/encryption.ts`

-   **Algorithm:** **AES-256-GCM**.
    -   **AES-256:** The industry standard. Unbreakable by brute force.
    -   **GCM (Galois/Counter Mode):** Provides both *encryption* AND *integrity*. If someone messes with the ciphertext, decryption fails instantly.
-   **Key Management:** We use a **Master Key** + **Salt** to derive session keys. We never store the master key plainly in the code.

### Pillar 2: Digital Signatures (Authenticity)
*File:* `backend/src/crypto/signing.ts`

-   **Algorithm:** **RSA-SHA256**.
-   **How it works:**
    1.  Doctor has a **Private Key** (kept in secure vault, decrypted only for signing).
    2.  Doctor "Signs" the prescription hash.
    3.  Pharmacist has the **Public Key**. They can verify the signature but cannot forge it.
-   **Why?** Non-repudiation. A doctor cannot claim "I didn't write that" because only their key could have signed it.

### Pillar 3: Immutable Audit Log (Integrity)
*File:* `backend/src/modules/audit/audit.service.ts`

-   **The "Blockchain" Concept:**
    -   Every log entry contains a `previous_hash` pointing to the entry before it.
    -   `EntryHash = SHA256(Timestamp + Actor + Action + PreviousHash)`
-   **Why is it tamper-proof?**
    -   If an attacker deletes Row #50, Row #51's `previous_hash` won't match anymore. The chain is broken.
    -   The `verifyChainIntegrity()` function runs this check over the whole table.

---

## 🩺 4. Core Workflows (Step-by-Step)

### A. Doctor Writes Prescription
1.  **Input:** Doctor enters "Amoxicillin, 500mg".
2.  **Hashing:** Backend creates a SHA-256 hash of this data.
3.  **Signing:** Backend decrypts Doctor's Private Key -> Signs the Hash.
4.  **Encryption:** Backend encrypts the *actual text* (diagnosis/meds).
5.  **Storage:** DB stores: `EncryptedPayload`, `DoctorSignature`, `PayloadHash`.
    *   *Note: The DB admin acts like they are blind. They see the record but valid data is invisible.*

### B. Patient Views Prescription
1.  **Auth:** Patient logs in (JWT Token).
2.  **Request:** "Get my prescriptions."
3.  **Decryption:** Server sees user is authorized -> Decrypts payload -> Sends JSON to frontend.
4.  **Verification (Frontend):** Patient sees "Active" status and the integrity hash.

### C. Pharmacist Dispenses
1.  **Scan:** Pharmacist scans patient's QR code.
2.  **QR Data:** Contains `PrescriptionID` + `PayloadHash`.
3.  **Verification:** Backend fetches the record.
    -   Checks: Does `StoredHash` == `QRHash`? (Prevents QR tampering)
    -   Checks: Does `Signature` match `DoctorPublicKey`? (Prevents DB tampering)
4.  **Action:** If valid, marks as "Dispensed". Logs to audit trail.

---

## ⚡ 5. Common Judge Questions (Q&A)

**Q: What if the database is hacked?**
**A:** The attacker gets nothing but encrypted gibberish (`a8f9e...`). They cannot read diagnoses or medication details.

**Q: Can a rogue admin delete a log entry to hide their tracks?**
**A:** No. The audit log is hash-chained. Deleting or modifying one row breaks the cryptographic chain of all subsequent rows, triggering an integrity alert.

**Q: Why standard SQL and not a real Blockchain?**
**A:** Performance and Cost. Real blockchains (Ethereum / Hyperledger) are slow and expensive. Our "Hash Chain" approach gives 99% of the integrity benefits with the speed of PostgreSQL.

**Q: How do you handle GDPR "Right to Erasure"?**
**A:** We support **Crypto-Shredding**. Instead of wiping all backups (impossible), we delete the User's Private/Decryption Keys. Without keys, the data is mathematically irretrievable—effectively erased.

**Q: Is it scalable?**
**A:** Yes. We use **Docker** for containerization. The backend is stateless (REST API), so we can spin up 10 instances behind a load balancer (Nginx) easily.

---

## 🛠️ 6. Key Files to Show
If asked to "Show me the code," navigate here:

1.  **"Show me the Security":** `backend/src/crypto/encryption.ts`
2.  **"Show me the Log Chain":** `backend/src/modules/audit/audit.service.ts` (specifically `log` and `verifyChainIntegrity` methods).
3.  **"Show me the Data Model":** `database/init.sql` (Point out `encrypted_payload` and `previous_hash` columns).

---

*Good luck! You have built a system that is more secure than most real-world hospital apps.*
