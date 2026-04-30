# Contributing

How we propose, track, and ship changes to the NRIVA Internship Portal.

## TL;DR

```
idea → GitHub issue → branch → PR (Closes #N) → merge → docs/changelog.md entry
```

That's it. Each step below explains the small bit of glue.

---

## 1. New idea or bug report → open a GitHub issue

Open an issue at <https://github.com/Kalyankaki/Azurenetwork/issues/new>.

**Title format**

Prefix the title with the area, priority, and effort so it's filterable even before any labels are applied:

```
[<area>][P<priority>][<effort>] Short imperative title
```

Where:

| Field | Values |
|---|---|
| `area` | `admin`, `intern`, `employer`, `platform`, `security` |
| `priority` | `P0` (blocker), `P1` (high), `P2` (medium), `P3` (low) |
| `effort` | `S` (< ½ day), `M` (½–2 days), `L` (2+ days) |

Examples:

- `[admin][P1][S] Bulk-approve pending internships from /admin/internships`
- `[security][P2][M] Add CAPTCHA to email/password signup`
- `[platform][P3][S] Replace the in-memory rate limiter with Upstash`

**Body template**

```
## Problem
2–4 sentences. What's broken or missing? Who feels it?

## Proposed change
- bullet
- bullet

## Files likely affected
- src/...
- functions/...

## Acceptance
- [ ] User-visible behavior
- [ ] Test step from docs/e2e-test-plan.md passes
- [ ] Activity-log entry created (if relevant)
```

## 2. Labels and milestones (one-time GitHub setup)

Once, in repo **Settings → Labels**, create these so we can filter and burndown:

| Label | Color |
|---|---|
| `area:admin` | `#b71c1c` |
| `area:intern` | `#1a237e` |
| `area:employer` | `#1b5e20` |
| `area:platform` | `#475569` |
| `area:security` | `#7c3aed` |
| `priority:high` | `#dc2626` |
| `priority:medium` | `#d97706` |
| `priority:low` | `#65a30d` |
| `type:feature` | `#3949ab` |
| `type:bug` | `#c62828` |
| `type:chore` | `#94a3b8` |
| `effort:s` | `#a7f3d0` |
| `effort:m` | `#fde68a` |
| `effort:l` | `#fca5a5` |

Then in **Issues → Milestones**, create:

- `Admin experience v1` — bucket for the seed admin issues

Optional: under **Projects (beta)**, create a `NRIVA Internship Portal` board with columns `Backlog → Todo → In progress → In review → Done`.

The titling convention from §1 means we can work productively even before labels are applied. Bulk-apply labels to existing issues via GitHub's "Filter by label" view (select all → apply label).

## 3. Pick an issue → create a branch

```
git checkout master && git pull
git checkout -b <slug>-<issue-number>
# e.g. bulk-approve-internships-12
```

Branch names that begin with `claude/` are reserved for AI-driven work; everything else is fine for humans.

## 4. Open a PR that closes the issue

In the PR body, include `Closes #<issue-number>`. GitHub auto-closes the issue when the PR merges. Squash-merge by default — keeps `master` history clean.

Test plan in the PR body should reference (or copy) the relevant section of `docs/e2e-test-plan.md`.

## 5. After merge → add a changelog line

Open `docs/changelog.md`. Under the **Unreleased** section at the top, add a one-line bullet:

```
- <area>: <plain-English summary> (#<PR>)
```

That's the human-readable history stakeholders read. The closed-issues view + merged-PR list is the auditable history engineers read.

## Conventions cheat sheet

- Default to **squash merges** so each PR is one commit on `master`.
- Don't push directly to `master`. Always go through a PR.
- Don't create empty commits, don't amend already-pushed commits.
- Don't bypass hooks (`--no-verify`) unless explicitly asked.
- Run `npm run build` locally before pushing — Vercel/Azure SWA build will surface the same failure 5 minutes later.
- For UI changes, attach a screenshot or short clip to the PR.
