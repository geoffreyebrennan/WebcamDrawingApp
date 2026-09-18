import type { VoiceState } from '../hooks/useVoiceCommands'

interface Props {
  voiceState: VoiceState
  onToggle: () => void
}

export function VoiceStatus({ voiceState, onToggle }: Props) {
  const { listening, lastTranscript, lastCommand, supported, error } = voiceState

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {lastCommand && (
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--color-muted)',
            maxWidth: 200,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={lastTranscript}
        >
          <span style={{ color: 'var(--color-accent)' }}>{lastCommand.type}</span>
          {' '}
          <span style={{ color: 'var(--color-text)' }}>
            {String(lastCommand.value)}
          </span>
        </div>
      )}

      {error && (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-danger)' }}>
          {error}
        </div>
      )}

      <button
        onClick={onToggle}
        disabled={!supported}
        title={supported ? (listening ? 'Stop listening' : 'Start voice commands') : 'Speech recognition not supported'}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '5px 12px',
          borderRadius: 6,
          border: '1px solid',
          borderColor: listening ? 'var(--color-accent)' : 'var(--color-border)',
          background: listening ? 'rgba(108,99,255,0.15)' : 'transparent',
          color: listening ? 'var(--color-accent)' : 'var(--color-muted)',
          cursor: supported ? 'pointer' : 'not-allowed',
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '0.05em',
          transition: 'all 0.15s',
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: listening ? 'var(--color-accent)' : 'var(--color-muted)',
            animation: listening ? 'pulse 1.2s ease-in-out infinite' : 'none',
            flexShrink: 0,
          }}
        />
        {listening ? 'listening' : 'mic off'}
      </button>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  )
}
