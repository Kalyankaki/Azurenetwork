# NRIVA Internship Portal — Architecture

This document is a snapshot of the system as built. Diagrams are in Mermaid so they render on GitHub.

## 1. System context — who talks to what

```mermaid
flowchart LR
  subgraph Users
    U1["Intern (mostly minors 13–17)"]
    U2["Employer"]
    U3["Admin"]
  end

  Browser["Browser
  (direct or iframe via nriva.org)"]

  U1 --> Browser
  U2 --> Browser
  U3 --> Browser

  subgraph Hosting["Vercel / Azure Static Web Apps"]
    SPA["React SPA
    (Vite build, lazy routes)"]
    API["/api/* serverless
    functions"]
  end

  Browser -->|"HTTPS, CSP frame-ancestors limited
  to nriva.org + subdomains"| SPA
  SPA <-->|"fetch /api/*"| API

  subgraph Firebase
    Auth["Firebase Auth
    (Google + email/password)"]
    FS["Cloud Firestore
    (users, internships, applications,
    messages, activity, notifications,
    public_stats)"]
    Storage["Cloud Storage
    (resumes/{uid}/…)"]
    Fn["Cloud Functions
    scanResume(storage trigger)"]
  end

  SPA -->|"Firebase JS SDK
  rules-enforced reads/writes"| Auth
  SPA --> FS
  SPA --> Storage
  Storage -->|"on finalize"| Fn

  subgraph ThirdParties["Third-party processors"]
    Anthropic["Anthropic Claude API"]
    Resend["Resend (email)"]
    VT["VirusTotal v3"]
  end

  API -->|"server-side, key not in browser"| Anthropic
  API --> Resend
  Fn --> VT
  Fn --> FS
  Fn --> Storage
```

## 2. Frontend — routes & shared building blocks

```mermaid
flowchart TB
  subgraph Public["Public routes"]
    Home["/"]
    Login["/login"]
    RoleSel["/select-role
    (onboarding: age gate,
    parental notice, AI/role)"]
    Priv["/privacy"]
    Terms["/terms"]
  end

  subgraph Intern["/intern (ProtectedRoute role=intern)"]
    IDash["/intern  Dashboard
    (Matched-for-You + reasons)"]
    IBrowse["/intern/browse
    (Recommended + All, AI search)"]
    IApply["/intern/apply/:id"]
    IApps["/intern/applications"]
    IProfile["/intern/profile
    (edit + skill-match +
    Privacy: export, delete)"]
  end

  subgraph Employer["/employer (ProtectedRoute role=employer)"]
    EDash["/employer  Dashboard
    (Top candidates, AI search)"]
    EPostings["/employer/postings"]
    ENew["/employer/new-posting
    (Write-with-AI)"]
    EApp["/employer/applicants"]
  end

  subgraph Admin["/admin (ProtectedRoute role=admin)"]
    ADash["/admin"]
    AI["/admin/internships"]
    AA["/admin/applications"]
    AM["/admin/messages"]
    AR["/admin/reports"]
    AU["/admin/users"]
    AAct["/admin/activity"]
  end

  subgraph Shared["Cross-cutting components"]
    Layout["Layout
    sidebar + header"]
    AIAssist["AIAssistant
    (chat widget)"]
    AIConsent["AIConsentModal +
    useAIConsent hook"]
    Cookie["CookieNotice"]
    Contact["ContactAdmin"]
  end

  Layout --- Intern
  Layout --- Employer
  Layout --- Admin
  AIAssist -.gates via.- AIConsent
  IBrowse -.gates AI search via.- AIConsent
  EDash -.gates AI search via.- AIConsent
  ENew -.gates Write-with-AI via.- AIConsent
  Cookie -.- Public
  Cookie -.- Intern
  Cookie -.- Employer
  Cookie -.- Admin
```

## 3. Authentication & onboarding flow

```mermaid
sequenceDiagram
  autonumber
  participant U as Browser
  participant SPA as React SPA
  participant Auth as Firebase Auth
  participant FS as Firestore /users/{uid}

  U->>SPA: visit /
  U->>SPA: click "Get Started" → /login
  alt Sign in with Google
    SPA->>Auth: signInWithPopup
  else Email/password
    SPA->>Auth: signInWithEmailAndPassword
  end
  Auth-->>SPA: firebaseUser

  SPA->>FS: getUser(uid)
  alt First-time user (no doc)
    SPA->>FS: createUser({roles:[], onboarded:false})
    Note right of FS: rule: allow create if<br/>request.auth.uid == userId
    SPA-->>U: redirect /select-role onboarding
    U->>SPA: enter DOB
    alt age < 13
      SPA-->>U: hard-block ("ask a guardian")
    else 13–17
      SPA-->>U: parental notice<br/>(guardian name + email + ack)
    else 18+
      SPA-->>U: continue
    end
    U->>SPA: complete steps 2 + 3
    SPA->>FS: updateDoc({onboarded:true,<br/>roles:[role], requestedRole, …})
    Note right of FS: rule: selfUpdateAllowed()<br/>permits onboarding transition<br/>(false→true) with safe roles
  else Existing user
    Note over SPA: AuthContext loads roles + activeRole
  end

  SPA-->>U: routes to /intern, /employer, or /admin
```

## 4. AI feature consent & call path

```mermaid
sequenceDiagram
  autonumber
  participant U as Browser
  participant SPA as React SPA
  participant FS as Firestore /users/{uid}
  participant API as /api/ai-assistant or /api/ai-generate
  participant CL as Anthropic Claude

  U->>SPA: invoke AI feature (chat / search / write-with-AI)
  SPA->>SPA: useAIConsent.ensureConsent()
  alt First time
    SPA-->>U: AIConsentModal disclosure
    U->>SPA: "I understand"
    SPA->>FS: updateUserProfile({aiConsent:{granted:true,…}})
  end
  SPA->>API: POST { message, role, context }
  Note over API: rate-limited;<br/>key only on server
  API->>CL: messages.create
  CL-->>API: response
  API-->>SPA: { reply }
  SPA-->>U: render
```

## 5. Application + offer state machine

```mermaid
stateDiagram-v2
  [*] --> pending: Intern submits application
  pending --> under_review: Employer opens it
  under_review --> shortlisted: Employer shortlists
  under_review --> rejected
  shortlisted --> offered: Employer sends offer
  offered --> offer_accepted: Intern accepts
  offered --> offer_declined: Intern declines
  offer_accepted --> [*]
  offer_declined --> [*]
  rejected --> [*]
```

## 6. Resume upload + virus scan

```mermaid
sequenceDiagram
  autonumber
  participant U as Browser
  participant ST as Firebase Storage
  participant Fn as Cloud Function scanResume
  participant VT as VirusTotal v3
  participant FS as Firestore /users/{uid}

  U->>ST: PUT resumes/{uid}/file (≤5 MB, type-checked)
  Note right of ST: storage.rules:<br/>only owner can write,<br/>only owner+admin can read
  ST-->>Fn: onObjectFinalized event
  Fn->>VT: POST /files (bytes)
  VT-->>Fn: analysis id
  loop poll
    Fn->>VT: GET /analyses/{id}
  end
  alt malicious or suspicious > 0
    Fn->>ST: deleteObject
    Fn->>FS: set resumeQuarantined=true,<br/>clear resumeUrl
    Fn->>FS: notifications.add(quarantine event)
  else clean
    Fn->>ST: setMetadata virusScanStatus=clean
  end
```

## 7. Audit log + admin alerting

```mermaid
sequenceDiagram
  autonumber
  participant Actor as Admin / user action
  participant SPA as React SPA
  participant FS as Firestore /activity
  participant API as /api/admin-alert
  participant Resend
  participant Email as Admin allowlist inbox

  Actor->>SPA: e.g. promote user to admin role
  SPA->>FS: updateUserRoles → addDoc(activity, {<br/>action:"roles_changed",<br/>expiresAt: now + 12 mo})
  Note right of FS: TTL policy on activity.expiresAt<br/>auto-deletes after 12 mo
  alt action ∈ ALERTABLE_ACTIONS
    SPA->>API: POST /admin-alert
    API->>Resend: send email
    Resend-->>Email: "[Alert] User roles changed"
    alt Resend not configured
      SPA->>FS: addDoc(notifications, {type:"admin_alert", expiresAt: now + 6 mo})
    end
  end
```

## 8. Trust boundaries & defenses

```mermaid
flowchart LR
  subgraph Browser["Untrusted browser"]
    JS["React SPA"]
  end

  subgraph Edge["Edge / hosting"]
    HTTP["HTTPS + HSTS
    CSP: frame-ancestors
    'self' nriva.org *.nriva.org"]
    RL["IP rate limiter
    (in-memory per instance)"]
  end

  subgraph Server["Server-side"]
    APIs["/api/* functions
    Anthropic key
    Resend key"]
  end

  subgraph FB["Firebase (rules-enforced)"]
    FRules["firestore.rules
    selfUpdateAllowed:
    no admin self-grant
    onboarding-only fields gated"]
    SRules["storage.rules
    resumes only owner+admin"]
    DB[(Firestore)]
    OBJ[(Storage)]
  end

  JS --> HTTP --> APIs
  APIs --> RL
  JS -->|Firebase SDK| FRules --> DB
  JS -->|Firebase SDK| SRules --> OBJ

  classDef boundary fill:#fff,stroke:#1a237e,stroke-width:2px
  class Browser,Edge,Server,FB boundary
```

## 9. Data inventory at a glance

| Collection / store | Owner write | Reader scope | TTL |
|---|---|---|---|
| `users/{uid}` | self (limited fields) + admin | self + admin | none (manual delete via R11 flow) |
| `internships/{id}` | employer-of-record + admin | public read | none |
| `applications/{id}` | applicant + employer + admin | applicant + employer + admin | none |
| `messages/{id}` | sender + admin | sender + admin | none |
| `activity/{id}` | any auth user (append-only) | admin | 12 months (`expiresAt`) |
| `notifications/{id}` | any auth user (append-only) | admin | 6 months (`expiresAt`) |
| `public_stats/{id}` | any auth user | public read | none |
| `resumes/{uid}/…` (Storage) | self | self + admin | bound to user account |

## 10. External integrations summary

| Service | Direction | Data sent | Why |
|---|---|---|---|
| Anthropic Claude | server → Anthropic | user prompt + small profile slices (skills, grade, school, internship list) | AI assistant, AI search, Write-with-AI |
| Resend | server → Resend | admin email + alert/notification body | signup notifications, admin alerts |
| VirusTotal | Cloud Function → VT | resume bytes | malware scanning |
| Firebase Auth, Firestore, Storage, Functions | client/server → Firebase | account, profile, applications, files | core platform |
| Vercel / Azure SWA | hosting | static bundle, serverless logs | hosting |

## 11. Repo layout pointer

```
src/
  pages/{HomePage,LoginPage,RoleSelectPage,PrivacyPolicy,Terms}.jsx
  pages/intern/{Dashboard,Browse,Apply,Applications,Profile}.jsx
  pages/employer/{Dashboard,Postings,NewPosting,Applicants}.jsx
  pages/admin/{Dashboard,Internships,Applications,Users,Reports,Messages,Activity}.jsx
  components/{Layout,ProtectedRoute,AIAssistant,AIConsentModal,CookieNotice,ContactAdmin,Toast}.jsx
  hooks/{useAuth,useFirestore,useAIConsent}.js
  services/{firestore,ai}.js
  utils/{matching,date,status}.js
  contexts/AuthContext.jsx
  firebase.js  # SDK init + auth/storage helpers

api/
  ai-assistant.js, ai-generate.js, admin-alert.js
  notify-signup.js, public-stats.js, _rateLimit.js

functions/
  index.js, scanResume.js, package.json

firestore.rules     storage.rules     firebase.json
vercel.json         staticwebapp.config.json
.github/dependabot.yml
docs/{security-and-compliance,operations,e2e-test-plan,architecture,
     admin-roadmap,contributing,changelog}.md
```
