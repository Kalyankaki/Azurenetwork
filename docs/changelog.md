# Changelog

Human-readable record of changes to the NRIVA Internship Portal. One section per release / dated batch. Each line links to the merging PR.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) loosely — `Added`, `Changed`, `Fixed`, `Security`, `Removed` groupings per release.

---

## Unreleased

<!--
Add new entries here as PRs merge. Format:
- area: short summary ([#123](https://github.com/Kalyankaki/Azurenetwork/pull/123))
-->

### Added
- platform: roadmap and contribution workflow — `docs/admin-roadmap.md`, `docs/contributing.md`, this changelog.
- platform: seeded the GitHub issue tracker with the admin-experience backlog ([#32](https://github.com/Kalyankaki/Azurenetwork/issues/32) – [#41](https://github.com/Kalyankaki/Azurenetwork/issues/41)).
- admin: Manage Users — user name is now a hyperlink, and the profile modal shows signup date, onboarding state, DOB/age/minor badge, guardian info, parental & AI consent status, application/posting counts, and an "Approval checklist" panel for pending users. Closes [#43](https://github.com/Kalyankaki/Azurenetwork/issues/43).
- admin: Manage Users table — each intern row now shows Grade · School · City · age inline under the email, so admins can scan without opening the profile modal. Closes [#45](https://github.com/Kalyankaki/Azurenetwork/issues/45).
- platform: every open internship now has a public, shareable URL at `/internships/:id`. Employers see a "Copy share link" button on each open posting in `/employer/postings`; admins see the same link in the manage modal. Closes [#47](https://github.com/Kalyankaki/Azurenetwork/issues/47).

### Security & Privacy
- platform: facilitator-only liability protection. Every page now carries a short disclaimer footer; the public internship page shows a prominent "NRIVA does not vet, endorse, or guarantee" block above Apply; onboarding, application submission, and posting submission each gate behind an explicit Terms acknowledgement that's stored on the user/application/internship doc with a versioned timestamp; Terms now lead with a plain-language facilitator-only section (subject to legal review); a "Report this posting" flow on the public page captures concerns into the admin messages queue. Closes [#49](https://github.com/Kalyankaki/Azurenetwork/issues/49).
- platform: user-facing contact on `/privacy` and `/terms` switched from a personal email to `youth@nriva.org`. Closes [#51](https://github.com/Kalyankaki/Azurenetwork/issues/51).
- security: Firestore super-admin allowlist now accepts both `kalyank.123@gmail.com` and `youth@nriva.org` so the foundation mailbox can be established before the personal email is dropped. **Requires `firebase deploy --only firestore:rules`** to take effect. Closes [#53](https://github.com/Kalyankaki/Azurenetwork/issues/53).
- admin: Manage Users — added a category-count chip dashboard at the top of the page (All / Pending / Interns / Employers / Admins, plus an `⚠ Awaiting employer approval` chip when relevant) for one-click filtering, and a yellow `Pending` badge on rows with no roles so admins don't miss them. Replaces the role dropdown. Closes [#55](https://github.com/Kalyankaki/Azurenetwork/issues/55).
- admin: Manage Users — added `Registered` and `Incomplete` chips next to `All` to separate users who finished onboarding from those who signed in but never completed `/select-role`. Closes [#57](https://github.com/Kalyankaki/Azurenetwork/issues/57).

### Fixed
- platform: dashboard math. Admin + intern dashboards now sum the `positions` field for "Open Positions" instead of counting postings; admin shows postings count as a subtitle. Employer dashboard's Total Applicants / Shortlisted / Offers Sent now scope to *that* employer's postings instead of leaking platform-wide totals. Admin Reports overview's "Avg Applicants/Position" divides by total positions, not posting count. Closes [#59](https://github.com/Kalyankaki/Azurenetwork/issues/59).

### Changed
- platform: an intern can only accept one offer. New `acceptOffer()` helper writes `users/{uid}.placedInternshipId` and the application's `offer_accepted` status atomically (writeBatch), then auto-declines any other applications still in `offered` state. Firestore rules enforce the single-acceptance rule server-side: placement fields are write-once for the user, and a second `offer_accepted` is rejected. The intern onboarding step 3 now carries a clear callout explaining the rule, and a green "You're placed at X" banner appears on the intern dashboard and applications page once accepted. **Requires `firebase deploy --only firestore:rules`** to take effect server-side. Closes [#61](https://github.com/Kalyankaki/Azurenetwork/issues/61).
- platform: when an intern accepts an offer, `acceptOffer()` now auto-declines **every** non-terminal application by that intern — pending, under_review, shortlisted, and offered — not just `offered` ones. Each auto-declined doc carries `autoDeclined: true`, `autoDeclinedReason: 'Accepted another offer'`, and `autoDeclinedFromStatus` for audit. Intern-facing copy across onboarding, the apply panel, and the placed banner reflects the broader scope. Closes [#102](https://github.com/Kalyankaki/Azurenetwork/issues/102).
- admin: cross-page drill-through. Employer Performance gains a Company column, and line items across the admin pages (employer / internship / intern) are now clickable links that open the existing detail modals via deep-link URL params (`/admin/users?uid=…`, `/admin/internships?id=…`). Closes [#63](https://github.com/Kalyankaki/Azurenetwork/issues/63).
- admin: Employer Performance + Reports → Employers tab pivoted to a per-company view (Company · Reps · Postings · Apps · Reviewed · Offers); rep names appear as a subtitle and the row links to a single rep when unambiguous. Admins can now delete applications from `/admin/applications` via a row-level Delete button + confirm modal; logs `application_deleted` to the activity log. Closes [#65](https://github.com/Kalyankaki/Azurenetwork/issues/65).
- admin: Employer Performance gains a `Total Positions` column (sum of `positions` across all postings, regardless of status). Reports → Employers tab also adds a per-row **Merge…** button: pick another existing company name and a new `mergeCompany()` helper rewrites every internship doc (and optionally every employer user's `companyName`) from the source spelling to the target. Logs `companies_merged` with affected counts. Closes [#67](https://github.com/Kalyankaki/Azurenetwork/issues/67).
- admin: AdminUsers profile modal — new "Applied for: \<role\>" capsule near the role badges (driven by `requestedRole`), plus Placed-at green pill, Terms-accepted version + date, Onboarded-at, and Last-updated fields surfaced from existing user-doc fields. Closes [#69](https://github.com/Kalyankaki/Azurenetwork/issues/69).
- platform: home page now carries a callout below the existing eligibility pill making clear that portal sign-in is separate from `nriva.org`'s own login (the portal is iframed there). Closes [#71](https://github.com/Kalyankaki/Azurenetwork/issues/71), [#73](https://github.com/Kalyankaki/Azurenetwork/issues/73).
- security: `firestore.rules` `isAdmin()` now compares super-admin emails case-insensitively. Previously a signed-in super admin whose stored email had any uppercase characters silently failed the bootstrap allowlist check, which blocked admin-only writes such as deleting an application. **Requires `firebase deploy --only firestore:rules`** to take effect. Closes [#75](https://github.com/Kalyankaki/Azurenetwork/issues/75).
- admin: the row-level "Pending" badge on Manage Users moved out of the Roles column and now renders as `Incomplete` next to the user's name. Trigger switched from "no roles" to "not onboarded", so it stays in lock-step with the existing Incomplete chip filter. Closes [#77](https://github.com/Kalyankaki/Azurenetwork/issues/77).
- admin: Manage Users now defaults to the `Registered` chip on load (was `All`). Closes [#79](https://github.com/Kalyankaki/Azurenetwork/issues/79).

### Fixed
- admin: dashboard "users awaiting role assignment" banner used to land on `/admin/users` with the new `Registered` default filter, hiding most pending users. The banner now deep-links to `/admin/users?category=pending`, and AdminUsers honours the `?category=` URL param across all chip values (`all / registered / incomplete / pending / intern / employer / admin / awaiting_approval`). Closes [#81](https://github.com/Kalyankaki/Azurenetwork/issues/81).

### Removed
- admin: the `Pending` user-status concept is gone. The Pending chip and its filter case are removed from `/admin/users`, the "Pending role" badge is removed from the profile-modal header, and the dashboard banner has been repointed at `/admin/users?category=incomplete` with new copy ("N incomplete signups"). Incomplete is now the single signal for "didn't finish signup". Closes [#83](https://github.com/Kalyankaki/Azurenetwork/issues/83).

### Added
- admin: an "Employers Awaiting Approval" card on `/admin` lists pending employers with per-row Approve buttons, so admins can clear the queue without leaving the dashboard. Click the name to open their profile, click Approve to flip `employerApproved`. Closes [#85](https://github.com/Kalyankaki/Azurenetwork/issues/85).
- admin: Manage Users — new multi-select **Filter by role** pill row (Intern / Employer / Admin) sits below the chip dashboard. Selecting one or more roles narrows the visible users to those whose `roles` array intersects the selection (logical OR within the set), composing with the existing category chip and search/location filters. A "Clear roles" link resets it. Closes [#87](https://github.com/Kalyankaki/Azurenetwork/issues/87).
- admin: an internship can now be reassigned to another registered employer from the AdminInternships manage modal — pick the new employer from a dropdown, confirm in a modal, and the doc's `employerUid / employerName / company / contactEmail` get updated. Logs `internship_employer_reassigned` with old + new ids. Useful when a rep leaves a company. Closes [#89](https://github.com/Kalyankaki/Azurenetwork/issues/89).
- admin: `/admin/applications` columns are now click-to-sort (Applicant, Position, School, Applied, Age, Status). Default order is Applied desc; an arrow indicator marks the active column. Closes [#92](https://github.com/Kalyankaki/Azurenetwork/issues/92).
- platform: outbound admin notification mailbox switched from `kalyank.123@gmail.com` to `abhikaki123@gmail.com` in `api/notify-signup.js` (hardcoded) and `api/admin-alert.js` (fallback when env vars aren't set). The Firestore super-admin allowlist is unchanged. Closes [#95](https://github.com/Kalyankaki/Azurenetwork/issues/95).

---

## 2026-04-30

### Added
- platform: end-to-end architecture diagram in `docs/architecture.md` (Mermaid). ([#31](https://github.com/Kalyankaki/Azurenetwork/pull/31))

### Security & Privacy
- platform: privacy hardening — Privacy Notice + Terms pages, cookie banner, virus-scanning Cloud Function, TTL on activity & notifications, data export + self-service deletion, Dependabot, real-time admin alerts. Closes risks R3 R6 R9 R11 R12 R14 R15 R16. ([#24](https://github.com/Kalyankaki/Azurenetwork/pull/24))
- platform: security hardening — age gate (R1), AI consent (R8), storage rules (R5), CSP `frame-ancestors` (R7), tighter user-doc rule (R4), multi super-admin allowlist (R2 partial). ([#22](https://github.com/Kalyankaki/Azurenetwork/pull/22))

### Fixed
- platform: legitimate onboarding and employer auto-migration writes were blocked by the tighter user-update rule; the rule now allows the `onboarded: false → true` transition with safe role values. ([#23](https://github.com/Kalyankaki/Azurenetwork/pull/23))
- platform: role-select / onboarding pages aligned to top so the iframe at nriva.org/summer-internships doesn't require a scroll. ([#21](https://github.com/Kalyankaki/Azurenetwork/pull/21))

## 2026-04-26

### Added
- intern: recommended internships now show a per-component score breakdown (Skills, Interest, Availability, Hours, Grade, Experience) plus plain-language reasons. Dashboard cards switched to the same algorithm. ([#20](https://github.com/Kalyankaki/Azurenetwork/pull/20))
- intern: Profile tab on the intern dashboard with editable profile, resume re-upload, and a one-click "match my skills to a chosen internship" action. ([#19](https://github.com/Kalyankaki/Azurenetwork/pull/19))

---

## How to add a line

After your PR merges, edit this file:

1. Move any items from "Unreleased" into a dated section if you're cutting a release. Otherwise leave them under "Unreleased".
2. Append a new bullet under the right section (`Added`, `Changed`, `Fixed`, `Security`, `Removed`).
3. Format: `- <area>: <plain-English summary> ([#<PR>](https://github.com/Kalyankaki/Azurenetwork/pull/<PR>))`
4. `area` is one of `intern`, `employer`, `admin`, `platform`, `security`.
