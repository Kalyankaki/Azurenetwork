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
