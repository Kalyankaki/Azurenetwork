import { Link } from 'react-router-dom'

export default function PrivacyPolicy() {
  return (
    <div style={pageStyle}>
      <article style={articleStyle}>
        <Link to="/" style={backStyle}>← Home</Link>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1a237e', marginBottom: 4 }}>Privacy Notice</h1>
        <p style={{ color: '#64748b', fontSize: 13, marginBottom: 24 }}>
          Last updated: April 2026
        </p>

        <p style={p}>
          The NRIVA Internship Portal (&quot;the portal&quot;) is operated by NRI Vasavi Association
          (&quot;NRIVA&quot;), a non-profit. We collect only the data we need to match students with
          internships and to operate the program. This notice explains what we collect, why, and
          your rights — including special protections for users under 18.
        </p>

        <h2 style={h2}>1. Who this is for</h2>
        <p style={p}>
          The portal is open to students in 10th grade through college (typically ages 13 and up),
          plus adult employers and program administrators. We do not knowingly collect data from
          anyone under 13.
        </p>

        <h2 style={h2}>2. What we collect</h2>
        <ul style={ul}>
          <li><strong>Account info:</strong> name, email, profile photo (when you sign in with Google).</li>
          <li><strong>Intern profile:</strong> date of birth, grade level, school, city, skills, interests, availability, optional LinkedIn / portfolio URLs, optional resume file, free-text experience summary and &quot;about me&quot;.</li>
          <li><strong>For users under 18:</strong> a parent or guardian&apos;s name and email, plus your acknowledgement that they are aware of your sign-up.</li>
          <li><strong>Application data:</strong> the internships you apply to and any cover-letter text you write.</li>
          <li><strong>Operational logs:</strong> a record of admin and user actions (audit trail), retained for 12 months and then auto-deleted.</li>
        </ul>
        <p style={p}>We do not collect: home street address, phone number, payment information, government IDs, demographic data, health information, or biometric data.</p>

        <h2 style={h2}>3. Why we collect it</h2>
        <ul style={ul}>
          <li>To match students with relevant internships (skills, grade level, availability).</li>
          <li>To let employers review applications.</li>
          <li>To let admins approve listings and resolve issues.</li>
          <li>To keep parents informed for users under 18.</li>
          <li>To detect abuse and operate the service safely.</li>
        </ul>

        <h2 style={h2}>4. Who we share it with (sub-processors)</h2>
        <ul style={ul}>
          <li><strong>Google Firebase</strong> — hosts our database, authentication, and resume files.</li>
          <li><strong>Vercel</strong> (or Azure Static Web Apps) — hosts the website itself and serverless API endpoints.</li>
          <li><strong>Anthropic (Claude)</strong> — when you use any AI feature, your prompt and small parts of your profile (skills, grade, school, available internships) are sent to Anthropic to generate a response. The first time you use AI we ask for explicit consent. Your full name, email, date of birth, and resume are not sent.</li>
          <li><strong>Resend</strong> — sends operational emails (admin notifications, alerts).</li>
          <li><strong>VirusTotal</strong> — scans uploaded resumes for malware.</li>
        </ul>
        <p style={p}>
          We do not sell or rent your data, and we do not use it for advertising.
        </p>

        <h2 style={h2}>5. AI features are optional</h2>
        <p style={p}>
          You can use every part of the portal without ever invoking AI. The AI assistant, AI search,
          and &quot;Write with AI&quot; features all show a one-time consent prompt before sending data to
          Anthropic. You can decline; the rest of the portal will still work.
        </p>

        <h2 style={h2}>6. Notice for parents and guardians of users under 18</h2>
        <p style={p}>
          If your child signed up here, we asked them for your name and email. We use your email
          only to share program updates or raise concerns about your child&apos;s participation. We do
          not market to you and we do not share your email with employers.
        </p>
        <p style={p}>
          To request a copy of your child&apos;s data, ask us to correct it, or delete the account,
          email <a href="mailto:kalyank.123@gmail.com">kalyank.123@gmail.com</a>.
        </p>

        <h2 style={h2}>7. Your rights</h2>
        <ul style={ul}>
          <li><strong>Access &amp; export:</strong> sign in, go to <Link to="/intern/profile">your profile</Link>, and use &quot;Download my data&quot; to get a JSON copy.</li>
          <li><strong>Correction:</strong> edit your profile at any time.</li>
          <li><strong>Deletion:</strong> use &quot;Delete my account&quot; on your profile, or email us. Deletion removes your user record, applications, and resume file. Some operational logs may be retained for the audit window.</li>
          <li><strong>Withdraw AI consent:</strong> contact an admin to clear your AI consent flag.</li>
        </ul>

        <h2 style={h2}>8. Cookies and similar storage</h2>
        <p style={p}>
          We use cookies and browser storage solely to keep you signed in and to remember your role
          choice. We do not use advertising cookies or third-party analytics.
        </p>

        <h2 style={h2}>9. Data retention</h2>
        <ul style={ul}>
          <li>User profile: kept while your account exists; deleted on request.</li>
          <li>Applications: kept while the program runs; archived/deleted after the program year unless you ask sooner.</li>
          <li>Resumes: kept while your account exists.</li>
          <li>Activity audit log: 12 months.</li>
          <li>Notification records: 6 months.</li>
        </ul>

        <h2 style={h2}>10. Security</h2>
        <p style={p}>
          All traffic is encrypted in transit. Database and file access is gated by per-user
          permission rules. Resumes are scanned for malware. See{' '}
          <a href="https://github.com/Kalyankaki/Azurenetwork/blob/master/docs/security-and-compliance.md" target="_blank" rel="noopener noreferrer">
            our security &amp; compliance summary
          </a>{' '}
          for details, including known residual risks.
        </p>

        <h2 style={h2}>11. Changes to this notice</h2>
        <p style={p}>
          When we make material changes we will update the date at the top of this page and, where
          appropriate, notify users in the portal.
        </p>

        <h2 style={h2}>12. Contact</h2>
        <p style={p}>
          Questions, requests, or concerns:{' '}
          <a href="mailto:kalyank.123@gmail.com">kalyank.123@gmail.com</a>.
        </p>
      </article>
    </div>
  )
}

const pageStyle = { minHeight: '100vh', background: '#f8fafc', padding: '32px 16px' }
const articleStyle = { maxWidth: 760, margin: '0 auto', background: 'white', borderRadius: 12, padding: '32px 36px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }
const backStyle = { color: '#1a237e', fontSize: 13, fontWeight: 600, textDecoration: 'none', marginBottom: 12, display: 'inline-block' }
const h2 = { fontSize: 18, fontWeight: 700, color: '#1a237e', marginTop: 28, marginBottom: 10 }
const p = { color: '#334155', fontSize: 14, lineHeight: 1.65, marginBottom: 12 }
const ul = { color: '#334155', fontSize: 14, lineHeight: 1.65, paddingLeft: 22, marginBottom: 12 }
