export default function ErrorRetry({ error, onRetry }) {
  if (!error) return null
  return (
    <div style={{
      textAlign: 'center', padding: '40px 20px',
      background: '#fef2f2', borderRadius: 12, margin: '20px 0',
    }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
      <p style={{ color: '#dc2626', fontSize: 14, marginBottom: 16 }}>{error}</p>
      {onRetry && (
        <button className="btn btn-primary" onClick={onRetry}>
          Try Again
        </button>
      )}
    </div>
  )
}
