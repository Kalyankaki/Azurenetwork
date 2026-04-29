# NRIVA Internship Portal — End-to-End Functionality Test Plan

**Purpose.** A repeatable, manual end-to-end test plan covering the four primary user journeys (anonymous visitor, intern, employer, admin) plus cross-cutting concerns (auth, AI, embedding, mobile). Run before every release that touches auth, the data model, or any of the role dashboards.

**How to use this plan.**
- Test in a fresh browser profile (or incognito) so prior sessions don't pollute the run.
- Have **three test accounts** ready: one intern, one employer, one admin.
- Test once on **desktop Chrome**, once on **mobile Safari** (the iframe at nriva.org is the primary entry for many users).
- Record results in the table at the end of the doc — pass / fail / blocked / not applicable.

**Legend.** [P] = Priority pass-blocker. [S] = Smoke. [R] = Regression. [E] = Edge case.

---

## 0. Pre-flight

| # | Check |
|---|---|
| 0.1 [S] | App loads at the production URL with no console errors. |
| 0.2 [S] | Iframe embed at `https://nriva.org/summer-internships` loads without scroll-jump or layout shift. |
| 0.3 [S] | All four primary routes return a valid page: `/`, `/login`, `/select-role`, `/intern` (when signed in). |
| 0.4 [S] | An unknown route (e.g., `/garbage`) renders the 404 page with a "Return Home" link. |
| 0.5 [R] | Network panel shows TLS/HTTPS for every request (no mixed content). |

---

## 1. Anonymous visitor (Home page)

| # | Step | Expected |
|---|---|---|
| 1.1 [S] | Open `/`. | Hero, stats counters (students/internships/companies), and "Get Started" CTAs render. |
| 1.2 [P] | Click "Get Started". | Routed to `/login`. |
| 1.3 [R] | Stat counts are non-negative integers. | No NaN/undefined; pulled via `/api/public-stats`. |
| 1.4 [E] | Disable JavaScript and reload. | Some marketing copy still visible (this is an SPA, so functionality is gated — acceptable). |
| 1.5 [R] | Footer links and any external links open in new tabs with `noopener`. | No reverse-tabnabbing risk. |

---

## 2. Authentication

### 2A. Sign up (new user)

| # | Step | Expected |
|---|---|---|
| 2A.1 [P] | Sign up via email/password with a never-used email. | Account created; redirected to `/select-role` onboarding flow. |
| 2A.2 [P] | Sign up via Google (popup). | Profile photo and display name pre-fill. |
| 2A.3 [E] | Email already in use. | Friendly error: "An account with that email already exists. Try signing in." |
| 2A.4 [E] | Password under 6 characters. | Friendly error: "Password must be at least 6 characters." |
| 2A.5 [E] | Cancel the Google popup midway. | App returns to login screen with no broken state. |

### 2B. Sign in (existing user)

| # | Step | Expected |
|---|---|---|
| 2B.1 [P] | Sign in with correct email/password. | Redirected to the role they last used (or `/select-role` if multiple). |
| 2B.2 [P] | Wrong password. | Inline error; does not lock the account on the first try. |
| 2B.3 [P] | Forgot Password → enter email → check inbox. | Reset email arrives; reset link works; new password lets you sign in. |
| 2B.4 [R] | Sign in with Google for an account previously created via email. | Account is linked or a clear "use email to sign in" message — verify the flow does not silently fork into two accounts. |
| 2B.5 [E] | Repeated wrong-password attempts (>5). | Firebase eventually returns "too many attempts" — verify graceful UI, not a crash. |

### 2C. Sign out

| # | Step | Expected |
|---|---|---|
| 2C.1 [P] | Click the avatar → Sign Out. | Returned to home. Cached Firestore data is cleared (open DevTools → Application → IndexedDB; the Firestore DBs should be empty). |
| 2C.2 [R] | After sign-out, hitting `/intern` directly. | Redirected to `/login`, not a flash of the protected page. |

---

## 3. Onboarding (new user flow)

Cover all three branches.

### 3A. Intern onboarding

| # | Step | Expected |
|---|---|---|
| 3A.1 [P] | Step 1: name + role = Intern + (optional) NRIVA membership ID. | Continue button enables. |
| 3A.2 [P] | Step 2: grade level, school, city, skills, availability, LinkedIn, portfolio. | Required fields enforced (grade level, school, city). |
| 3A.3 [P] | Step 3: interests, experience summary, optional resume upload, "about me", submit. | Success screen says "Welcome aboard!" with WhatsApp join link. Clicking "Go to Dashboard" lands on `/intern`. |
| 3A.4 [E] | Upload a resume larger than 5 MB. | Blocked client-side with the size-limit error. |
| 3A.5 [E] | Upload a `.txt` file. | Blocked client-side with the file-type error. |
| 3A.6 [R] | Profile data persisted to Firestore matches what was entered (verify in Admin → Users). |

### 3B. Employer onboarding

| # | Step | Expected |
|---|---|---|
| 3B.1 [P] | Submit company name, job title, industry, size, website, internship types. | Account auto-approved. Lands on `/employer`. |
| 3B.2 [R] | New employer is `employerApproved: false` until admin flips it. | Verify in Admin → Users. |
| 3B.3 [P] | Employer can post but **cannot view candidate names** until admin approval. | Confirm "Candidates" shows masked or locked state pre-approval. |

### 3C. Admin role request

| # | Step | Expected |
|---|---|---|
| 3C.1 [P] | Select "Administrator" at signup. | Submitted in pending state; success screen says "Request submitted; an admin will review." |
| 3C.2 [R] | The user has no roles in Firestore until an existing admin promotes them. |

---

## 4. Intern journey

Sign in as the intern test account.

### 4A. Dashboard (`/intern`)

| # | Step | Expected |
|---|---|---|
| 4A.1 [S] | "Welcome back, {name}!" header, four stat cards (Applications / Under Review / Shortlisted / Open Positions), recent applications table, "Matched for You" cards. |
| 4A.2 [P] | Each Matched card shows a % badge ("Great/Good/Possible match") and a "Why we picked this" block. |
| 4A.3 [R] | Reasons reference the intern's actual skills/interests/grade — not generic copy. |
| 4A.4 [R] | Click a Matched card → `/intern/apply/:id` opens for the right internship. |
| 4A.5 [E] | Intern with no skills/interests entered. | Section title falls back to "Recommended for You" and shows up to 3 generic open postings. |

### 4B. Profile (`/intern/profile`)

| # | Step | Expected |
|---|---|---|
| 4B.1 [P] | All onboarding fields are pre-populated from Firestore. |
| 4B.2 [P] | Edit name, school, city, skills, interests, availability, LinkedIn, portfolio, resume → Save. | Success banner; values persist on reload. |
| 4B.3 [P] | "Match my skills to an internship I like" → pick an internship → preview ✓/+ markers → click "Add skills". | Missing skills are added to the user's skill list and matching interest categories appear. Save persists them. |
| 4B.4 [E] | Try saving with an empty name. | Save still succeeds (name is not required to be non-empty in `updateUserProfile`); confirm UX accepts this gracefully. |
| 4B.5 [E] | Replace existing resume. | New file appears as "Current"; old URL is no longer linked from the profile (verify in Firestore that `resumeUrl` was overwritten). |
| 4B.6 [R] | Email field is read-only / disabled. |
| 4B.7 [R] | Editing skills changes the matching results on Dashboard and Browse — open both in a new tab and confirm. |

### 4C. Browse internships (`/intern/browse`)

| # | Step | Expected |
|---|---|---|
| 4C.1 [S] | Two tabs ("Recommended" / "All Internships") with counts. |
| 4C.2 [P] | Recommended tab shows top 3 by match % with full breakdown bars (Skills/Interest/Availability/Hours/Grade/Experience) and reasons. |
| 4C.3 [P] | All Internships tab: text search by title/company/skill works. |
| 4C.4 [P] | Filters: Type and Location populate from data. Selecting any filter narrows the list. |
| 4C.5 [P] | Sort columns by Match / Position / Company / Deadline (asc & desc). |
| 4C.6 [P] | AI search box: type "remote marketing internships for beginners" → AI Search. | Returns a non-empty natural-language reply within ~10s; rate limit (15/min) applies. |
| 4C.7 [P] | Click a row → modal opens with full details, percentage match badge, skills list, description, requirements. |
| 4C.8 [R] | Closed/filled internships render with disabled "Apply" button. |

### 4D. Apply (`/intern/apply/:id`)

| # | Step | Expected |
|---|---|---|
| 4D.1 [P] | Form pre-fills relevant skills, school, resume URL from profile. |
| 4D.2 [P] | Submit a complete application. | Toast/banner success; redirected to `/intern/applications`; new row at top of the table with status "Pending". |
| 4D.3 [E] | Try to apply when already at the 4-application cap (`MAX_INTERN_APPLICATIONS`). | Submit blocked with a clear message; no Firestore write occurs. |
| 4D.4 [E] | Apply to the same internship twice. | Second submit blocked with a duplicate-application message. |
| 4D.5 [R] | The internship's `applicants` counter increments by 1 (verify as admin). |
| 4D.6 [R] | Activity log gets an `application_submitted` entry (verify in Admin → Activity). |

### 4E. My Applications (`/intern/applications`)

| # | Step | Expected |
|---|---|---|
| 4E.1 [S] | List shows all my apps with status badges and applied dates. |
| 4E.2 [P] | When the employer marks an application as `offered`, the intern sees Accept / Decline buttons. |
| 4E.3 [P] | Accept the offer → status flips to `offer_accepted`. The internship status flips to `filled` (verify in admin). |
| 4E.4 [P] | Decline the offer → status flips to `offer_declined`. Other shortlisted candidates remain. |
| 4E.5 [E] | Refresh after acting on an offer. | Status persists. |

---

## 5. Employer journey

Sign in as the employer test account (already approved).

### 5A. Dashboard (`/employer`)

| # | Step | Expected |
|---|---|---|
| 5A.1 [S] | Stat cards (Postings / Applicants / Shortlisted / Hired) all clickable, each routing to the relevant filtered view. |
| 5A.2 [R] | Top Candidates section ranks by match score across all your postings. |

### 5B. New posting (`/employer/new-posting`)

| # | Step | Expected |
|---|---|---|
| 5B.1 [P] | Required fields: title, company, location, type, duration, deadline, gradeLevelMin. |
| 5B.2 [P] | "Write with AI" → fills description, responsibilities, requirements, preferred quals, benefits. | Returns within ~15s. |
| 5B.3 [P] | Submit. | New posting appears in My Postings with status `pending_approval`. |
| 5B.4 [E] | Submit with deadline in the past. | Blocked with a friendly error (or accepted but admin-flagged — verify current behavior). |
| 5B.5 [R] | Activity log records `internship_created`. |

### 5C. My postings (`/employer/postings`)

| # | Step | Expected |
|---|---|---|
| 5C.1 [P] | Pending postings are visually distinct (badge "Pending Approval"). |
| 5C.2 [P] | Open postings show applicant counts. |
| 5C.3 [P] | Click a posting → drilldown shows description, edit button, and applicant list. |
| 5C.4 [R] | Editing a posting updates `updatedAt` (verify in admin). |

### 5D. Applicants (`/employer/applicants`)

| # | Step | Expected |
|---|---|---|
| 5D.1 [P] | Two tabs: Top Candidates (sorted by match) and All Candidates. |
| 5D.2 [P] | Match score breakdown visible per candidate (Skills/Interest/Availability/Hours/Grade/Experience). |
| 5D.3 [P] | Status transitions: Pending → Under Review → Shortlisted → Offered → Offer Accepted/Declined. Each click hits Firestore and the row re-renders. |
| 5D.4 [P] | "Send onboarding email" appears once an offer is accepted. |
| 5D.5 [E] | Try to mark a candidate "Offered" before "Shortlisted". | Either blocked or gracefully transitions through states — verify current behavior matches design. |
| 5D.6 [R] | Pre-approval employer sees applications but **not** candidate identifying details. |
| 5D.7 [R] | Resume download link works for the employer. |

---

## 6. Admin journey

Sign in as the super-admin (or an admin-promoted account).

### 6A. Dashboard (`/admin`)

| # | Step | Expected |
|---|---|---|
| 6A.1 [S] | High-level stats: users, employers pending approval, postings pending approval, applications by status. |
| 6A.2 [R] | Notification badges link to the relevant filtered admin pages. |

### 6B. Internships (`/admin/internships`)

| # | Step | Expected |
|---|---|---|
| 6B.1 [P] | Filters on title, employer, status, location work. |
| 6B.2 [P] | Approve a `pending_approval` posting. | Status flips to `open`; activity log records `internship_approved`. |
| 6B.3 [P] | Reject a posting with a reason. | Status flips to `rejected`. |
| 6B.4 [P] | Delete a posting (super admin). | Removed from the table; activity log records `internship_deleted`. |

### 6C. Applications (`/admin/applications`)

| # | Step | Expected |
|---|---|---|
| 6C.1 [P] | Full list across all employers/interns; status filters work. |
| 6C.2 [P] | Admin can override status. |

### 6D. Users (`/admin/users`)

| # | Step | Expected |
|---|---|---|
| 6D.1 [P] | Filter by role and location/chapter. |
| 6D.2 [P] | Click a user row → modal with full profile. |
| 6D.3 [P] | Approve a pending employer → `employerApproved` flips to true; the employer can now see candidate identities. |
| 6D.4 [P] | Promote a user to admin. They can now access `/admin`. |
| 6D.5 [E] | Try to demote yourself (the only admin). | Either blocked or warned. Verify that no path can leave the system without an admin. |
| 6D.6 [P] | Delete a user. | User doc removed; their applications either remain (orphaned) or are cascade-cleaned — verify current behavior matches design. |

### 6E. Messages (`/admin/messages`)

| # | Step | Expected |
|---|---|---|
| 6E.1 [P] | Inbox shows `Contact Admin` submissions from interns/employers. |
| 6E.2 [P] | Mark resolved → status updates with timestamp. |

### 6F. Reports (`/admin/reports`)

| # | Step | Expected |
|---|---|---|
| 6F.1 [P] | Tabs for internships, applications, interns. Search and filter work. |
| 6F.2 [R] | Counts match the underlying tables (no double-counting from join logic). |

### 6G. Activity log (`/admin/activity`)

| # | Step | Expected |
|---|---|---|
| 6G.1 [P] | Recent 50 actions visible by default. |
| 6G.2 [R] | Each entry has action, target IDs, actor, and timestamp. |

---

## 7. Cross-cutting

### 7A. Authorization (must run as each role)

| # | Step | Expected |
|---|---|---|
| 7A.1 [P] | As intern, navigate directly to `/admin` or `/employer`. | Redirected (or blocked) — never a flash of the protected page. |
| 7A.2 [P] | As employer, try `/admin/users`. | Blocked. |
| 7A.3 [P] | As intern, modify a Firestore doc you don't own (use Firestore SDK in DevTools). | Permission denied. |
| 7A.4 [P] | As intern, try to set `roles: ['admin']` on your own user doc via SDK. | **Currently allowed by `firestore.rules` — see Risk R4 in the security doc. Document the result here.** |

### 7B. AI features

| # | Step | Expected |
|---|---|---|
| 7B.1 [P] | Spam the AI assistant >15 times in one minute. | Rate limit kicks in: 429 with "Try again in a minute." |
| 7B.2 [E] | Cold-start the function (first call after >5 min idle) → measure latency. | Within ~10s; user sees a spinner, not a freeze. |
| 7B.3 [R] | Verify the request body sent from the browser does **not** contain the Anthropic API key. |

### 7C. Iframe embed (nriva.org/summer-internships)

| # | Step | Expected |
|---|---|---|
| 7C.1 [P] | Open the parent page on desktop and mobile. The portal renders without a horizontal scrollbar. |
| 7C.2 [P] | Sign in flow inside the iframe completes (Google OAuth popup interacts with parent, not the iframe). |
| 7C.3 [P] | Switch Role lands at the top of the viewport, no need to scroll. |
| 7C.4 [E] | Embed the portal from a non-`nriva.org` site. | Currently allowed (no `frame-ancestors` set); document this behavior — see Risk R7. |

### 7D. Mobile responsiveness

| # | Step | Expected |
|---|---|---|
| 7D.1 [S] | Sidebar collapses to a hamburger at ≤ 768 px. |
| 7D.2 [R] | Modals (apply, profile, candidate detail) are scrollable on small screens. |
| 7D.3 [R] | Form inputs do not trigger iOS zoom (font-size ≥ 16px). |
| 7D.4 [R] | Bottom-of-screen action buttons are above the iOS safe-area inset. |

### 7E. Performance (light-touch)

| # | Step | Expected |
|---|---|---|
| 7E.1 [R] | Initial bundle <300 KB gzipped (verify in `dist/assets`). |
| 7E.2 [R] | Time-to-interactive on a throttled "Slow 4G" profile is under 5s on the homepage. |
| 7E.3 [R] | No console errors during a full intern → apply → application-list run. |

### 7F. Resilience

| # | Step | Expected |
|---|---|---|
| 7F.1 [R] | Disconnect the network mid-action (e.g., during apply submit). | App surfaces a friendly retry message; no half-written Firestore doc remains. |
| 7F.2 [R] | Refresh during onboarding step 3. | User stays in the onboarding flow on re-login (state persisted) or is asked to start over (acceptable, but not a crash). |

---

## 8. Smoke test (post-deploy, ~5 minutes)

The minimum check after every production deploy.

1. Anonymous: load `/` → counts render → click Get Started → `/login` opens.
2. Intern: sign in → Dashboard renders → Profile loads with my data → Browse Recommended shows match scores.
3. Employer: sign in → Dashboard counts non-zero → New Posting form opens → "Write with AI" returns content.
4. Admin: sign in → Users list loads → Activity log shows the most recent action from this session.
5. Iframe: open the nriva.org embed → Switch Role visible without scroll.

Sign each off in a Slack thread or a deploy-log row before marking the deploy as healthy.

---

## 9. Test results template

Copy this into the release ticket.

| # | Section | Result | Notes / link to bug |
|---|---|---|---|
| 0 | Pre-flight | | |
| 1 | Anonymous | | |
| 2A/2B/2C | Auth | | |
| 3A/3B/3C | Onboarding | | |
| 4A–4E | Intern | | |
| 5A–5D | Employer | | |
| 6A–6G | Admin | | |
| 7A–7F | Cross-cutting | | |
| 8 | Smoke (post-deploy) | | |

---

*Owner: program admin / engineering lead. Update whenever a new route, role, or external integration is added.*
