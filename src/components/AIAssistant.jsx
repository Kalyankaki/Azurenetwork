import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

const SUGGESTIONS = {
  intern: [
    'How do I apply for an internship?',
    'What do the match scores mean?',
    'How many internships can I apply to?',
    'What happens after I submit an application?',
    'How do I accept an offer?',
  ],
  employer: [
    'How do I post a new internship?',
    'What do the candidate match scores mean?',
    'How do I send an offer to a candidate?',
    'How does the Top 5 ranking work?',
    'How do I send onboarding info?',
  ],
  admin: [
    'How do I approve pending internships?',
    'What are stale applications?',
    'How do I export data as CSV?',
    'How do I assign a coordinator?',
    'How do I check employer performance?',
  ],
}

export default function AIAssistant({ portalContext }) {
  const { activeRole } = useAuth()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async (text) => {
    const userMsg = text || input.trim()
    if (!userMsg) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: userMsg }])
    setLoading(true)

    try {
      const res = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          role: activeRole || 'intern',
          context: portalContext || '',
        }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', text: data.reply || data.error || 'Sorry, something went wrong.' }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Unable to reach the AI assistant. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  const suggestions = SUGGESTIONS[activeRole] || SUGGESTIONS.intern

  return (
    <>
      {/* Toggle button */}
      <button onClick={() => setOpen(!open)}
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 1000,
          width: 56, height: 56, borderRadius: '50%',
          background: open ? '#64748b' : 'linear-gradient(135deg, #7c3aed, #a855f7)',
          color: 'white', border: 'none', cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(124,58,237,0.4)',
          fontSize: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s',
        }}>
        {open ? '✕' : '✨'}
      </button>

      {/* Chat panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 88, right: 24, zIndex: 999,
          width: 380, maxWidth: 'calc(100vw - 48px)',
          height: 520, maxHeight: 'calc(100vh - 120px)',
          background: 'white', borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
            padding: '16px 20px', color: 'white',
          }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>NRIVA AI Assistant</div>
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>
              Ask me anything about the {activeRole || 'internship'} portal
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>👋</div>
                <p style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>
                  Hi! I&apos;m here to help you navigate the portal. Try asking:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {suggestions.map(s => (
                    <button key={s} onClick={() => send(s)}
                      style={{
                        padding: '10px 14px', borderRadius: 10,
                        border: '1px solid #e2e8f0', background: '#f8fafc',
                        fontSize: 13, color: '#4338ca', cursor: 'pointer',
                        textAlign: 'left', transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#eef2ff'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#f8fafc'}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: 12,
              }}>
                <div style={{
                  maxWidth: '85%', padding: '10px 14px', borderRadius: 12,
                  fontSize: 13, lineHeight: 1.5,
                  background: msg.role === 'user' ? '#7c3aed' : '#f1f5f9',
                  color: msg.role === 'user' ? 'white' : '#1a1a2e',
                  borderBottomRightRadius: msg.role === 'user' ? 4 : 12,
                  borderBottomLeftRadius: msg.role === 'assistant' ? 4 : 12,
                  whiteSpace: 'pre-wrap',
                }}>
                  {msg.text}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', gap: 4, padding: '8px 0' }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: 8, height: 8, borderRadius: '50%', background: '#a855f7',
                    animation: `bounce 1s ease-in-out ${i * 0.15}s infinite`,
                  }} />
                ))}
                <style>{`@keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }`}</style>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: '12px 16px', borderTop: '1px solid #e2e8f0',
            display: 'flex', gap: 8,
          }}>
            <input
              type="text" value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              placeholder="Ask me anything..."
              disabled={loading}
              style={{
                flex: 1, padding: '10px 14px', borderRadius: 10,
                border: '1px solid #e2e8f0', fontSize: 14,
                outline: 'none',
              }}
            />
            <button onClick={() => send()} disabled={loading || !input.trim()}
              style={{
                padding: '10px 16px', borderRadius: 10, border: 'none',
                background: '#7c3aed', color: 'white', fontSize: 14,
                cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.6 : 1,
                fontWeight: 600,
              }}>
              →
            </button>
          </div>
        </div>
      )}
    </>
  )
}
