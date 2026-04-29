import { Link } from 'react-router-dom'

export default function Terms() {
  return (
    <div style={pageStyle}>
      <article style={articleStyle}>
        <Link to="/" style={backStyle}>← Home</Link>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1a237e', marginBottom: 4 }}>Terms of Use</h1>
        <p style={{ color: '#64748b', fontSize: 13, marginBottom: 24 }}>Last updated: April 2026</p>

        <p style={p}>
          By using the NRIVA Internship Portal you agree to these terms. If you don&apos;t agree, please
          don&apos;t use the site.
        </p>

        <h2 style={h2}>1. Who can use the portal</h2>
        <ul style={ul}>
          <li>Students 13 or older. Sign-ups by anyone under 13 are not permitted.</li>
          <li>Users 13–17 must have a parent or guardian aware of their participation; we collect a guardian email at sign-up.</li>
          <li>Employers must be authorized to represent the company they list and must offer legitimate, age-appropriate internships.</li>
        </ul>

        <h2 style={h2}>2. Acceptable use</h2>
        <ul style={ul}>
          <li>Don&apos;t impersonate other people or organizations.</li>
          <li>Don&apos;t post discriminatory, harassing, illegal, or sexual content.</li>
          <li>Don&apos;t attempt to circumvent security controls, scrape data, or access another user&apos;s data without permission.</li>
          <li>Don&apos;t upload malicious files. Resumes are virus-scanned; infected files are deleted automatically.</li>
        </ul>

        <h2 style={h2}>3. Your content</h2>
        <p style={p}>
          You retain ownership of profile information, resumes, and any text you submit. You grant
          NRIVA a limited license to display this content within the portal to admins and to the
          specific employers you apply to.
        </p>

        <h2 style={h2}>4. Internships and offers</h2>
        <p style={p}>
          NRIVA does not employ you and is not party to any internship contract. Offers, schedules,
          stipends, and any payment are between you and the employer. NRIVA is not responsible for
          the conduct of employers or interns; report concerns to{' '}
          <a href="mailto:kalyank.123@gmail.com">kalyank.123@gmail.com</a>.
        </p>

        <h2 style={h2}>5. AI features</h2>
        <p style={p}>
          AI features are optional and powered by Anthropic. AI output may be inaccurate; treat it
          as a draft, not advice. You are responsible for what you do with AI-generated content.
        </p>

        <h2 style={h2}>6. Account suspension &amp; deletion</h2>
        <p style={p}>
          We may suspend or remove accounts that violate these terms. You can delete your account
          yourself from <Link to="/intern/profile">your profile</Link>.
        </p>

        <h2 style={h2}>7. Disclaimers</h2>
        <p style={p}>
          The portal is provided &quot;as is&quot;. NRIVA makes no warranties about uptime, the accuracy of
          internship listings, or AI output. To the fullest extent permitted by law, NRIVA is not
          liable for indirect, incidental, or consequential damages.
        </p>

        <h2 style={h2}>8. Changes</h2>
        <p style={p}>
          We may update these terms; material changes will be reflected on this page. Continued use
          after a change means you accept the updated terms.
        </p>

        <h2 style={h2}>9. Contact</h2>
        <p style={p}>
          <a href="mailto:kalyank.123@gmail.com">kalyank.123@gmail.com</a>
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
