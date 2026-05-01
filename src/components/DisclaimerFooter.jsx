import { Link } from 'react-router-dom'
import { FACILITATOR_DISCLAIMER_SHORT } from '../utils/legal'

// Small, persistent disclaimer rendered on every page. Use `variant="dark"`
// when the surrounding background is the dark NRIVA gradient (HomePage,
// LoginPage, RoleSelectPage, PublicInternship); default light variant works
// inside the logged-in Layout.
export default function DisclaimerFooter({ variant = 'light' }) {
  const dark = variant === 'dark'
  const styles = dark ? darkStyles : lightStyles
  return (
    <footer style={styles.wrapper} role="contentinfo">
      <p style={styles.text}>
        <span>{FACILITATOR_DISCLAIMER_SHORT}</span>{' '}
        <Link to="/terms" style={styles.link}>Read our Terms</Link>
        {' · '}
        <Link to="/privacy" style={styles.link}>Privacy</Link>
      </p>
    </footer>
  )
}

const lightStyles = {
  wrapper: {
    borderTop: '1px solid var(--nriva-border)',
    padding: '14px 16px',
    background: 'transparent',
  },
  text: {
    margin: 0,
    fontSize: 12,
    lineHeight: 1.5,
    color: 'var(--nriva-text-light)',
    textAlign: 'center',
  },
  link: { color: 'var(--nriva-primary)', fontWeight: 500 },
}

const darkStyles = {
  wrapper: { padding: '14px 16px' },
  text: {
    margin: 0,
    fontSize: 12,
    lineHeight: 1.5,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
  },
  link: { color: 'rgba(255,255,255,0.95)', fontWeight: 500 },
}
