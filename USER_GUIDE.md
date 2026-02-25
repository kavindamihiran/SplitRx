# 📖 SplitRx User Manual

Welcome to **SplitRx**, the secure way to manage medical prescriptions.
This guide is designed for everyone—Doctors, Patients, Pharmacists, and Administrators—to help you use the system easily and securely.

---

## 👨‍⚕️ For Doctors

**Goal**: Create secure, digital prescriptions for your patients.

### How to Issue a Prescription

1.  **Log In**: Enter your email and password to access the Doctor Dashboard.
2.  **Start a Prescription**: Click the **"✍️ Write Prescription"** button.
3.  **Identify the Patient**:
    - Ask the patient for their **Patient ID** (a long code found on their dashboard).
    - Enter this ID into the "Patient UUID" field.
4.  **Enter Details**:
    - Type the **Diagnosis** (e.g., "Seasonal Allergies").
    - Add **Medications** by entering the Name, Dosage, and Frequency.
5.  **Sign & Send**:
    - Click **"Sign & Create Prescription"**.
    - **Security Note**: The system automatically locks this prescription with your unique digital signature. It cannot be changed afterwards.

---

## 🙋‍♀️ For Patients

**Goal**: Receive prescriptions, manage your data, and pick up medicine.

### 1. Your Patient ID

- At the top of your dashboard, you will see a code labeled **"Your Patient ID"**.
- **Action**: Share this code _only_ with your doctor so they can send prescriptions to you.

### 2. Viewing Your Prescriptions

- Click on the **"💊 Prescriptions"** tab.
- Here you will see a list of all medications prescribed to you.

### 3. Picking Up Medication

- When you are at the pharmacy, click **"📱 Generate QR"** next to the prescription you need.
- Show the QR code to the pharmacist.
- **Note**: This code proves the prescription is yours and valid.

### 4. Tracking Your Data (Audit Trail)

- Click the **"📋 Audit"** tab.
- This shows a permanent history of exactly who accessed your medical records and when.

### 5. Privacy Controls

- Click the **"🔒 Privacy"** tab.
- **Right to Erasure**: You can click **"Erase All My Data"** to permanently delete your records from the system. This is irreversible.

---

## 💊 For Pharmacists

**Goal**: Verify if a prescription is real and dispense medication.

### How to Verify & Dispense

1.  **Log In**: Access the Pharmacist Dashboard.
2.  **Scan the Code**:
    - Ask the patient to show their QR code.
    - Use your scanner (or manually paste the code) into the verification box.
3.  **Automatic check**:
    - The system will instantly check if the prescription is authentic.
4.  **Result**:
    - 🟢 **VERIFIED**: The prescription is real and safe to fill.
    - 🔴 **WARNING**: The prescription is invalid or fake. **Do not dispense.**

---

## 🛡️ For Administrators

**Goal**: Monitor system health and data integrity.

### 1. Audit Log Integrity

- Go to the **"Audit Log Integrity"** tab.
- Click **"Verify Audit Chain Integrity"**.
- **What this does**: It checks millions of records to ensure no one (not even hackers) has tampered with or deleted past logs.
- You should see a green **"✅ Integrity Verified"** message.

### 2. Database Viewer

- Go to the **"Database Viewer"** tab.
- This allows you to inspect the raw data stored in the system.
- Select a table from the list (e.g., `users`, `prescriptions`) to view the current records.

---

## ❓ Frequently Asked Questions

**Q: I forgot my password, what do I do?**
A: Currently, please contact the system administrator to reset your account.

**Q: Why do I see a "Connection Refused" error?**
A: This usually means the server is down or you are having internet issues. Please check your connection and try again.

**Q: Can I delete a prescription?**
A: No. Once a prescription is written, it is part of the permanent medical record. However, patients can choose to delete _all_ their data via the Privacy tab.

---

## 📚 Related Documentation

| Document                       | Description                            |
| ------------------------------ | -------------------------------------- |
| [README.md](README.md)         | Project overview and quick start       |
| [SECURITY.md](SECURITY.md)     | Complete 8-layer security architecture |
| [TECH_STACK.md](TECH_STACK.md) | Technical stack and project structure  |

---

_Last updated: February 26, 2026_
