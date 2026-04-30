# Admin Experience Roadmap (v1)

This is the persistent companion to the Admin experience audit. Each item below maps to a GitHub issue; tick boxes get checked as PRs land.

**Milestone in GitHub:** `Admin experience v1` (create once in repo Issues → Milestones, then bulk-assign issues #32–#41 via the milestone filter)
**Filter:** [open admin issues](https://github.com/Kalyankaki/Azurenetwork/issues?q=is%3Aopen+%5Badmin%5D+in%3Atitle)
**Seed range:** issues [#32 – #41](https://github.com/Kalyankaki/Azurenetwork/issues?q=is%3Aopen+%5Badmin%5D+in%3Atitle+sort%3Acreated-desc).

## Per-page gaps

### `/admin` — Dashboard
Read-only KPI page; no drill-through, no date range, hardcoded staleness threshold.

| Status | Item |
|---|---|
| ⬜ | Drill-through from each KPI card to the matching filtered list page |
| ⬜ | Date-range filter (semester / cohort) |
| ⬜ | Configurable stale threshold (currently hardcoded 7 days) |

### `/admin/internships`
- [ ] [**#32**](https://github.com/Kalyankaki/Azurenetwork/issues/32) — Email employer on internship approval/rejection *(P1, M)*
  Send a Resend email when the admin flips status. Include rejection reason if any. Closes the feedback loop without manual outreach.
- [ ] [**#33**](https://github.com/Kalyankaki/Azurenetwork/issues/33) — Bulk-approve pending internships *(P1, S)*
  Multi-select + "Approve selected"; reuses `approveInternship` per row. Cuts 30 individual clicks to 1.
- [ ] [**#34**](https://github.com/Kalyankaki/Azurenetwork/issues/34) — Drill-through: show all applications inside the internship detail modal *(P1, M)*
  When the admin opens a posting, show its applicant table inline. Reuses `useApplications({internshipId})`.
- [ ] [**#41**](https://github.com/Kalyankaki/Azurenetwork/issues/41) — Show rejection reason on rejected internships *(P3, S)*
  Surface the already-stored `rejectionReason` as a badge / tooltip in the listing.

### `/admin/applications`
- [ ] Individual applicant detail modal (resume, notes, offer letter scaffolding)
- [ ] Bulk send-offer-letter
- [ ] Filter by grade / school / cohort
- [ ] Stale-applications export

### `/admin/messages`
- [ ] [**#39**](https://github.com/Kalyankaki/Azurenetwork/issues/39) — Reply to inbound messages from /admin/messages *(P2, M)*
  Add a reply textarea + send via a new `/api/admin-reply.js`; persist as a thread on the message doc.
- [ ] Reply templates (offer accepted, declined, escalation)
- [ ] Reassign or forward to coordinator

### `/admin/users`
- [ ] [**#35**](https://github.com/Kalyankaki/Azurenetwork/issues/35) — Coordinator workload view *(P1, M)*
  New `/admin/coordinators` page (or tab in AdminUsers). Group users by `coordinator.uid`; show counts; flag overloaded.
- [ ] [**#36**](https://github.com/Kalyankaki/Azurenetwork/issues/36) — Bulk-assign coordinator to pending-role users *(P2, S)*
  Multi-select pending users + pick coordinator; calls `updateUserCoordinator` per uid.
- [ ] Self-service admin role management (replace hardcoded `bootstrapAdminEmails()` array in `firestore.rules`)

### `/admin/reports`
- [ ] [**#40**](https://github.com/Kalyankaki/Azurenetwork/issues/40) — "Mark Onboarded" toggle in interns tab *(P2, S)*
  Bulk + per-row checkbox sets `users.onboardedAt`.
- [ ] Date-range filter
- [ ] Cohort segmentation (semester)
- [ ] Scheduled email export
- [ ] SLA metrics (response time, time-to-decision)

### `/admin/activity`
- [ ] [**#37**](https://github.com/Kalyankaki/Azurenetwork/issues/37) — Search & filter activity log *(P2, S)*
  Filters above the table: action, actor email, date range. Server-side: extend `subscribeActivity`.
- [ ] [**#38**](https://github.com/Kalyankaki/Azurenetwork/issues/38) — Export activity log as CSV *(P2, S)*
  "Download CSV" button using filtered set; reuse the helpers in `AdminReports`.
- [ ] Pagination beyond the first 100 entries

## Cross-cutting gaps

| Status | Theme | Notes |
|---|---|---|
| ⬜ | **Communication** | No reply-from-portal capability for any inbound channel. Issues #32, #39 start the unwind. |
| ⬜ | **Bulk operations** | Apps page has the only bulk action today. Issues #33, #36, #40 add three more. |
| ⬜ | **Reporting / exports** | CSV exists in Reports; activity is read-only. Issues #38, #40 fill. |
| ⬜ | **Coordinator workflow** | Assignment exists; visibility into load and rebalance does not. Issue #35. |
| ⬜ | **Admin onboarding** | Hardcoded super-admin email; needs a UI flow gated by an existing admin. Tracked separately. |
| ⬜ | **Audit trail visibility** | Activity table is unfiltered + capped. Issues #37, #38. |
| ⬜ | **Global search** | Per-page substring search only; no cross-collection search. |
| ⬜ | **Lifecycle drill-through** | Internship → applications drill-through is the biggest paper cut. Issue #34. |
| ⬜ | **Mobile** | Admin tables overflow; no top priority since admin work is mostly desktop. |

## How to use this file

- When a new admin gap is identified, append it under the right section and (if it's a build) open a GitHub issue using `docs/contributing.md` conventions.
- When a PR closes an issue, replace `⬜` / `[ ]` with `✅` / `[x]` and link the PR.
- If a section in here gets crowded with `✅` rows, rotate them out into the **Closed** archive at the bottom of `docs/changelog.md`.
