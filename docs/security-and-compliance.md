# NRIVA Internship Portal — Security, Privacy & Compliance Summary

**Audience:** Non-profit board / program stakeholders
**Scope:** The web application currently deployed at `nrivainternships.org` and embedded as an iframe at `https://nriva.org/summer-internships`.
**User population:** Students from 10th grade (typically 15+) through college, plus adult employers and program admins. **The majority of intern users are minors under 18.**

This document is a snapshot of the application as of this commit. It is grounded in a code audit (frontend, backend serverless functions, Firestore rules, build/deploy config). Items that depend on Firebase/Vercel console settings I cannot inspect are explicitly flagged as **"Verify in console"**.

---

## 1. Architecture at a glance

| Layer | Technology | Notes |
|---|---|---|
| Frontend (SPA) | React 18 + Vite | Static bundle; no SSR |
| Hosting | Vercel (`vercel.json`) and/or Azure Static Web Apps (`staticwebapp.config.json`) | Both configs are checked in; only one is wired to the prod domain. **Verify in console.** |
| Identity | Firebase Authentication | Google OAuth + email/password |
| Database | Cloud Firestore | Document-level access enforced by `firestore.rules` |
| File storage | Firebase Storage | Resume uploads (PDF/DOC/DOCX, 5 MB cap) |
| Server APIs | Vercel serverless functions in `/api` | `ai-assistant`, `ai-generate`, `notify-signup`, `public-stats` |
| AI | Anthropic Claude API | Server-side proxy; key is **not** exposed to the browser |
| Email | Resend (with Firestore-doc fallback) | Admin signup notifications only |

---

## 2. Data inventory — what we collect

### From every authenticated user
- Firebase UID (random, opaque)
- Display name
- Email address
- Profile photo URL (Google sign-in only)
- Account timestamps (`createdAt`, `updatedAt`)

### From interns (mostly minors)
- Grade level (10th – College Senior)
- School / university name (free text)
- City (free text, e.g., "Austin, TX")
- Skills (selected from preset list)
- Interest categories (selected from preset list)
- Availability (term)
- LinkedIn URL (optional)
- Portfolio / GitHub URL (optional)
- Resume / CV file (optional, ≤ 5 MB)
- Free-text "experience summary" and "about me"
- NRIVA membership ID (optional)

### From employers
- Company name, size, industry
- Employer's job title
- Company website

### Per application
- Internship reference, applicant UID, status timestamps
- Grade level, hours/day, available date range
- Free-text "relevant skills", "prior experience", cover letter, school affiliation

### Activity log (`activity` collection)
- Action name, target IDs, actor email (for admin actions), timestamps
- The `user_signup` action records the user's email and display name in plaintext as part of the audit trail.

### What we explicitly **do not** collect
- Date of birth / exact age
- Parent/guardian name, email, phone, signature
- Home street address
- Phone number
- Government IDs, social security numbers
- Demographic data (race, gender, religion)
- Health or biometric data
- Payment information

---

## 3. Data handling

**At rest.** Firestore and Firebase Storage are encrypted at rest by Google (AES-256 server-side). Resume files live in `resumes/{uid}/{timestamp}_{name}`; the download link returned to the browser is a tokenised Firebase Storage URL.

**In transit.** All traffic is HTTPS (Firebase, Vercel, Anthropic, Resend all enforce TLS 1.2+).

**Where data leaves Firebase**
- **Anthropic Claude API** — the AI assistant and "Write with AI" features send portions of the user's question + a context payload (e.g., a list of internships, the intern's profile skills/interests). This may include first name, school, skills, grade level, and free-text the user typed. Anthropic processes prompts per its data-handling terms.
- **Resend** — the admin signup notification email contains the new user's name, email, requested role, and NRIVA membership ID. Sent only to one address: the super-admin Gmail.
- **Vercel logs** — request paths, timestamps, and any data the serverless function logs to stderr (errors include partial payloads).

**Retention.** There is **no automated retention or deletion policy.** User docs, applications, activity entries, resumes, and notifications persist indefinitely unless an admin manually deletes them.

**Backups.** None configured at the application level. Firebase performs internal redundancy but point-in-time-recovery (PITR) for Firestore and bucket-level versioning for Storage are **not** enabled in this codebase.

---

## 4. Access control & authorization

### Authentication (`src/firebase.js`)
- Google OAuth and email/password.
- Email/password uses Firebase's default policy (minimum 6 characters; no enforced complexity).
- No multi-factor authentication for any role, including super admin.
- No email verification gate — accounts can be created and used before the address is verified. **Verify in Firebase console** whether "email verified" is enforced; the code does not require it.

### Authorization (`firestore.rules`)
- Super admin email `kalyank.123@gmail.com` is hardcoded into the rules and grants full bypass.
- Users can read and update **their own** user doc only (admins can read/update any).
- Internship listings are **publicly readable** (so the marketing iframe can show counts to anonymous visitors).
- Applications are readable by the applicant, the employer that posted the role, and admins.
- Messages, activity, and notifications are admin-only read.
- Deletion is admin-only across the board.
- The user-update rule does **not** restrict which fields a user can change. The `updateUserProfile` helper in code strips privileged fields (`roles`, `coordinator`, `employerApproved`, etc.) before writing, but a determined user could still write those fields directly via the Firestore SDK because the rule allows any update on the doc owned by the user. This is a **defense-in-depth gap** — see Risks §8.
- There is **no Firebase Storage rules file** in the repo. Bucket access is therefore governed by whatever rules exist in the Firebase console (default Firebase scaffolds are deny-all, but custom rules may be more permissive). **Verify in console.**

### Roles
- `intern` and `employer` are auto-approved on signup.
- `admin` requires manual super-admin approval.
- Employers have an additional `employerApproved` flag that gates candidate visibility until an admin approves them.

---

## 5. Privacy controls (today)

- Server-side proxy keeps the Anthropic API key out of the browser.
- The activity log is admin-only readable.
- Per-applicant resume URLs are tokenised (not enumerable by guessing a path).
- IndexedDB Firestore cache is cleared on logout (`clearIndexedDbPersistence` in `firebase.js`) — reduces residual data on shared devices.
- Profile editing exists; users can change/correct their data via `/intern/profile`.

### What's missing
- **No published Privacy Policy or Terms of Service** in the application.
- **No cookie / consent banner** — Firebase Auth uses cookies (and `localStorage`) for session persistence.
- **No "download my data" or "delete my account" self-service flow.**
- **No age gate** at signup — the platform advertises 10th-grade-and-up but does nothing to verify age. There is no parental notice or parental-consent capture.
- **No granular consent** for AI features. When an intern types into the AI assistant, the prompt and context (which can include school, grade, skills) are sent to a third party (Anthropic) without an explicit opt-in.
- **No public list of sub-processors** (Google/Firebase, Vercel, Anthropic, Resend).

---

## 6. Security controls (today)

- HTTPS everywhere (TLS 1.2+ enforced by hosting providers).
- Firebase Auth handles password hashing and credential storage.
- Firestore rules enforce least-privilege on every read/write at the document level.
- Server-side rate limit on serverless APIs (5–15 requests/minute per IP via `api/_rateLimit.js`). Note: this is in-memory per-instance, so cold starts and parallel instances reset the counter.
- Resume uploads are validated client-side for type (PDF/DOC/DOCX) and size (5 MB).
- React renders all user content as text (auto-escaped), so stored XSS via free-text fields is low-risk on the consumer side.
- Anthropic API key is server-side only.
- The iframe embed is intentional (used at nriva.org/summer-internships).

### What's missing
- **No Content Security Policy** is set in `staticwebapp.config.json` or `vercel.json`.
- **No `Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy`, or `Permissions-Policy` headers.**
- **No `frame-ancestors` restriction** — any site, not just `nriva.org`, can embed the portal in an iframe today (clickjacking surface).
- **No virus / malware scan on uploaded resumes** — the file goes straight to Storage.
- **No 2FA** for any role, including the super admin who can read/write all user data.
- **No protected-branch rules visible** in this repo (cannot see GitHub settings from the code, but the merge workflow we use is squash-merge to `master` with no required reviews — **Verify in GitHub**).
- **No CAPTCHA** on signup; combined with default 6-char passwords, this is a brute-force / mass-signup surface.
- **No alerting** on suspicious admin actions (role changes, mass deletions) beyond the activity log itself.
- **No automated dependency scanning / Dependabot** wired into CI.
- **No secret-scanning hook** on commits.
- The super-admin email is a personal Gmail address committed in source code. Compromise of that single Gmail account = full data access.

---

## 7. Compliance posture

The user base is largely 14–17-year-olds. Below is how the major regimes apply.

### COPPA (US, federal — applies to children **under 13**)
- The platform's stated minimum is 10th grade (~15). COPPA itself is **not** triggered as long as we do not knowingly collect data from anyone under 13.
- **Risk:** the platform has no age gate, so a 12-year-old can sign up unimpeded. If discovered, COPPA exposure is real. **Mitigation:** a soft age-attestation step + grade-level constraint at signup.

### FERPA (US, federal — student educational records held by schools/funded entities)
- NRIVA is a non-profit, not a school or federally-funded education provider, so FERPA almost certainly does **not** apply to the data this app holds.
- However, the app stores a student's school name + grade level. If the program ever partners with a school district to share this back, FERPA could apply to that data flow.

### California — CCPA/CPRA + Age-Appropriate Design Code Act (AADC)
- CCPA/CPRA likely applies if NRIVA passes the "doing business in CA + size" thresholds.
- AADC applies to online services "likely to be accessed by children" (under 18). This app is plainly in scope. AADC requires Data Protection Impact Assessments, default high-privacy settings, and clear notices to minors. **None of this is currently in place.**

### Other state minor-data laws
- Connecticut (CTDPA), Colorado (CPA), Texas (TDPSA), Virginia (VCDPA) — most include heightened protections for under-18s' data. Compliance posture today is best described as "policy-by-good-intentions"; there is no documented program.

### GDPR / GDPR-K (EU)
- Not actively targeted, but the site is publicly reachable from the EU. If an EU minor signs up, GDPR-K (parental consent for under 16) would technically apply.
- Mitigation today: none. A geographic gate or banner is not implemented.

### Industry-standard expectations the app does **not** yet meet
- Published, dated Privacy Policy and Terms of Service linked from every page.
- A "data subject request" inbox or in-app flow (export, correct, delete).
- A clear "this site is for users 13+ / 15+" notice with an explicit click-through.
- Notice to parents/guardians at signup for users under 18, even where not legally required.
- DPIA on file for high-risk processing (AI on minor's data).
- A breach-response plan with an admin contact and a 72-hour notification SLA.

---

## 8. Residual risks (prioritized)

| # | Risk | Likelihood | Impact | Notes / where it lives |
|---|---|---|---|---|
| **R1** | **No age gate or parental notice for under-18 users.** Regulatory exposure under California AADC and similar state laws. | High | High | Frontend onboarding (`src/pages/RoleSelectPage.jsx`) |
| **R2** | **Single super-admin account with hardcoded personal Gmail and no MFA.** Full data exfiltration from one credential compromise. | Medium | Critical | `firestore.rules`, `src/services/firestore.js` |
| **R3** | **No published Privacy Policy / ToS / cookie notice.** Inability to demonstrate lawful basis under most state-privacy frameworks. | High | Medium | App-wide; no `/privacy` page exists |
| **R4** | **Firestore user-doc update rule is permissive — does not restrict mutable fields.** Client-side `updateUserProfile` strips privileged fields, but a hostile user with the SDK can write them directly. | Low | High | `firestore.rules` lines 22–26 |
| **R5** | **Firebase Storage rules not in repo.** If the bucket is in default-permissive state, resumes could be world-readable by anyone with a URL guess. | Unknown | High | **Verify in Firebase console** |
| **R6** | **Resume uploads have no virus / malware scanning.** Compromised file could be served via tokenised URL to admins or employers who download it. | Low | Medium | `src/firebase.js` `uploadResume` |
| **R7** | **No security headers** (`Content-Security-Policy`, `frame-ancestors`, `Strict-Transport-Security`, etc.). Any third-party site can iframe the portal — clickjacking surface, especially around role-switch and delete buttons. | Medium | Medium | `vercel.json`, `staticwebapp.config.json` |
| **R8** | **AI features send minor's data to Anthropic without explicit per-user consent.** Includes school, grade, free-text the user wrote. | High | Medium | `api/ai-assistant.js`, `api/ai-generate.js` |
| **R9** | **Activity log retains PII (email, displayName) indefinitely, admin-only readable.** No retention policy. | High | Low | `src/services/firestore.js` `logActivity` |
| **R10** | **Email/password signup uses default 6-char passwords with no CAPTCHA.** Brute-force and bulk-signup surface. | Medium | Medium | `src/firebase.js` |
| **R11** | **No data-export or self-service deletion flow.** Failing a "right to access / delete" request requires manual admin work and is not on a SLA. | High | Medium | None implemented |
| **R12** | **No backups / point-in-time recovery.** A bad bulk admin action or rules bug is unrecoverable. | Low | High | Firebase project config — **Verify in console** |
| **R13** | **In-memory rate limiter is per-instance and resets on cold starts.** Distributed abuse can exceed the documented limit. | Medium | Low | `api/_rateLimit.js` |
| **R14** | **No dependency-vulnerability scanning** (no Dependabot/Renovate config in repo). | Medium | Medium | `package.json` |
| **R15** | **No alerting on sensitive admin actions** (role grants, deletions). Activity log exists but is not monitored. | Medium | Medium | `activity` collection |
| **R16** | **Notifications collection holds user emails and is admin-readable.** No retention. | Medium | Low | Firestore `notifications` |
| **R17** | **Free-text "about me" / "experience summary" can contain sensitive info** that the student didn't realise would be visible to employers. No "what employers will see" preview. | Medium | Low | Profile + apply pages |

---

## 9. Recommended remediation roadmap

**Quick wins (≈ 1–2 days of work)**
1. Add a **Privacy Policy** + **Terms of Service** page; link from footer/header and the role-select page.
2. Add an **age-attestation checkbox** ("I am 13 or older — required") at signup. Hard-block under-13 self-attestations.
3. Add **security headers** to `vercel.json` / `staticwebapp.config.json`: `Content-Security-Policy` with `frame-ancestors 'self' https://nriva.org`, `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`.
4. Tighten the Firestore user-update rule to whitelist mutable fields (not `roles`, `coordinator`, `employerApproved`).
5. Author a `storage.rules` file restricting resume reads to `resumes/{uid}/...` for the owner, the assigned employer, and admins.
6. Enable Dependabot security alerts and Firestore point-in-time recovery in the Firebase console.

**Short term (≈ 1–2 weeks)**
7. Add **MFA** to the super-admin account; create a second admin so a single account isn't a bus factor.
8. Add a **parental notice + email-to-guardian** option for users who select grades 10–12 (does not have to be verifiable consent, but a paper trail is valuable).
9. Build a **data-subject-request flow**: in-app "Download my data" (JSON export of the user doc + applications + activity entries about them) and "Delete my account" (with admin review for tax/audit retention).
10. Add **per-user AI consent** — first time the AI assistant is invoked, show a one-click disclosure ("Your message and profile snippets will be sent to Anthropic"). Persist the consent on the user doc.
11. Implement **server-side virus scanning** (e.g., ClamAV via a Cloud Function trigger) on uploaded resumes; quarantine on detection.
12. Replace the in-memory rate limiter with a Redis/Upstash-backed limiter, or at minimum add Cloudflare in front of the static origin.

**Medium term (≈ 1 month)**
13. Run a **DPIA** specifically for the AI features and the activity log.
14. Document a **data-retention schedule** (e.g., applications 24 months, activity 12 months, resumes 12 months past last login) and implement scheduled deletes.
15. Move the super-admin allowlist out of `firestore.rules` and into a managed `admins` collection editable only by existing admins (eliminates the hardcoded-Gmail problem).
16. Add a **breach-response runbook** with the admin contact, sub-processor list, and 72-hour notification language pre-drafted.
17. Write a **child-safe communications policy** governing how employers can message interns (today, all messaging routes through admin via the contact form — keep it that way; do not add direct DM until policy is in place).
18. Engage an external pentester for a focused engagement before the program scales.

---

## 10. What this document does **not** cover

- **Operational security** of the Firebase project itself (IAM users, billing alerts, audit log retention) — those live in Google Cloud / Firebase consoles outside the repo. **Verify in console.**
- **Vercel / Azure SWA** account-level controls (who can deploy, environment-variable access, log retention).
- **The super-admin's personal device hygiene** (their Gmail is the de-facto root credential).
- **Insurance** — cyber-liability coverage for the non-profit is a board-level decision.

---

*Owner of this document: program admin. Review cadence: quarterly, or on any change to authentication, the data model, or third-party processors.*
