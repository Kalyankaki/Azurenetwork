// Vercel serverless function to send signup notification email
// Uses Resend (https://resend.com) or falls back to storing in Firestore
// Set RESEND_API_KEY in Vercel env vars to enable email sending
// If no email service configured, notifications are stored in Firestore 'notifications' collection

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { userName, userEmail, requestedRole, nrivaMembership } = req.body || {}
  const adminEmail = 'kalyank.123@gmail.com'

  // Try Resend if configured
  const resendKey = process.env.RESEND_API_KEY
  if (resendKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from: 'NRIVA Internship Portal <noreply@nriva.org>',
          to: adminEmail,
          subject: `New Signup: ${userName} (${requestedRole})`,
          html: `
            <h2>New User Signup - NRIVA Internship Portal</h2>
            <table style="border-collapse:collapse;width:100%;max-width:500px">
              <tr><td style="padding:8px;border:1px solid #e2e8f0;font-weight:bold">Name</td><td style="padding:8px;border:1px solid #e2e8f0">${userName || 'Not provided'}</td></tr>
              <tr><td style="padding:8px;border:1px solid #e2e8f0;font-weight:bold">Email</td><td style="padding:8px;border:1px solid #e2e8f0">${userEmail || 'Not provided'}</td></tr>
              <tr><td style="padding:8px;border:1px solid #e2e8f0;font-weight:bold">Requested Role</td><td style="padding:8px;border:1px solid #e2e8f0">${requestedRole || 'Not specified'}</td></tr>
              <tr><td style="padding:8px;border:1px solid #e2e8f0;font-weight:bold">NRIVA Membership</td><td style="padding:8px;border:1px solid #e2e8f0">${nrivaMembership || 'None'}</td></tr>
            </table>
            ${requestedRole !== 'intern' ? '<p style="margin-top:16px;color:#b45309"><strong>Action Required:</strong> This user requested the ' + requestedRole + ' role which requires your approval. Log in to the admin portal to review.</p>' : '<p style="margin-top:16px;color:#15803d">This user was auto-approved as an intern.</p>'}
            <p style="margin-top:16px"><a href="https://azurenetwork.vercel.app">Open Admin Portal</a></p>
          `,
        }),
      })
      if (response.ok) {
        return res.status(200).json({ sent: true, method: 'resend' })
      }
    } catch (err) {
      console.error('Resend email failed:', err)
    }
  }

  // Fallback: use EmailJS if configured
  const emailjsKey = process.env.EMAILJS_PUBLIC_KEY
  const emailjsService = process.env.EMAILJS_SERVICE_ID
  const emailjsTemplate = process.env.EMAILJS_TEMPLATE_ID
  if (emailjsKey && emailjsService && emailjsTemplate) {
    try {
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: emailjsService,
          template_id: emailjsTemplate,
          user_id: emailjsKey,
          template_params: {
            to_email: adminEmail,
            from_name: 'NRIVA Internship Portal',
            subject: `New Signup: ${userName} (${requestedRole})`,
            user_name: userName,
            user_email: userEmail,
            requested_role: requestedRole,
            membership: nrivaMembership || 'None',
          },
        }),
      })
      if (response.ok) {
        return res.status(200).json({ sent: true, method: 'emailjs' })
      }
    } catch (err) {
      console.error('EmailJS failed:', err)
    }
  }

  // No email service configured - notification stored in Firestore by client
  return res.status(200).json({
    sent: false,
    method: 'firestore_only',
    message: 'No email service configured. Notification stored in Firestore. Set RESEND_API_KEY or EMAILJS_* env vars to enable email.',
  })
}
