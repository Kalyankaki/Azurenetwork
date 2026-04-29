# Operations Runbook

Practical, low-churn ops setup. All of these are one-time console actions; the code in this repo expects them to be done.

## 1. Firebase: Firestore TTL policies (R9, R16)

The application stamps `expiresAt` on `activity` (12 mo) and `notifications` (6 mo) documents. Firebase will only delete them if a TTL policy is enabled.

1. Open the [Firebase Console](https://console.firebase.google.com/) → your project → **Firestore Database** → **TTL** tab.
2. Add policy: collection group `activity`, field path `expiresAt`. Save.
3. Add policy: collection group `notifications`, field path `expiresAt`. Save.

Firebase deletes documents within ~24 hours of the timestamp, at no read cost.

## 2. Firebase: Point-in-Time Recovery (R12)

PITR lets you restore Firestore to any minute within the last 7 days.

1. Firebase Console → **Firestore Database** → **Backups** tab.
2. Toggle **Point-in-Time Recovery** on.
3. (Recommended) Set up a daily scheduled backup with 30-day retention.

PITR doubles storage cost; for the size of this dataset that is negligible.

## 3. Firebase: Storage rules deploy (R5)

After every change to `storage.rules`:

```bash
firebase deploy --only storage
```

## 4. Firebase: Firestore rules deploy

After every change to `firestore.rules`:

```bash
firebase deploy --only firestore:rules
```

## 5. Firebase: Auth — enforce email verification & enable MFA (R2)

1. Console → **Authentication** → **Settings** → enable "Require email verification" if you want to gate the app on a verified address.
2. For the super-admin Google account: enable 2-Step Verification on the underlying Google account (in [myaccount.google.com](https://myaccount.google.com/security)).
3. (Optional) Enable Firebase Auth multi-factor for non-admin accounts via the Authentication → Sign-in method tab.

## 6. Vercel: environment variables

Set in Vercel → project → Settings → Environment Variables. After saving, redeploy.

| Variable | Purpose | Required |
|---|---|---|
| `ANTHROPIC_API_KEY` | AI features | yes for AI |
| `RESEND_API_KEY` | Email notifications + admin alerts | recommended |
| `ADMIN_ALERT_EMAILS` | Comma-separated recipients for admin alerts | optional, defaults to super-admin |
| `VITE_SUPER_ADMIN_EMAILS` | Comma-separated super-admin allowlist (client) | optional |
| `FIREBASE_PROJECT_ID` | Public-stats endpoint | yes for stats |
| `FIREBASE_API_KEY` | Public-stats endpoint | yes for stats |
| `VITE_FIREBASE_*` | Client Firebase config | yes |
| `VITE_WHATSAPP_GROUP_URL` | Intern WhatsApp group link | optional |
| `VIRUSTOTAL_API_KEY` | Resume virus scanning (R6) | optional |

After updating `VITE_SUPER_ADMIN_EMAILS`, you also need to edit the `bootstrapAdminEmails()` array in `firestore.rules` — Firestore rules cannot read environment variables.

## 7. GitHub: Dependabot (R14)

`.github/dependabot.yml` is checked in. After merging, go to GitHub → repo → **Settings** → **Code security and analysis** and enable:

- Dependency graph (on by default for public repos)
- Dependabot alerts
- Dependabot security updates

## 8. Resume virus scanning (R6)

The Cloud Function in `functions/scanResume.js` triggers on uploads to `resumes/{uid}/...`. It calls the VirusTotal v3 API; if the file is flagged malicious, it deletes the file and sets `users/{uid}.resumeQuarantined = true`. Deploy:

```bash
cd functions
npm install
cd ..
firebase deploy --only functions:scanResume
```

Set `VIRUSTOTAL_API_KEY` in Firebase Functions config:

```bash
firebase functions:config:set virustotal.key="YOUR_KEY"
```

Or use any other scanner — the function is small and easy to swap.

## 9. Smoke test after every deploy

See `docs/e2e-test-plan.md`, section 8 ("Smoke test").
