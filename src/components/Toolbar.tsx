import type { StrokeConfig } from './DrawingCanvas'

interface Props {
  config: StrokeConfig
  onClear: () => void
  onUndo: () => void
  onConfigChange: (patch: Partial<StrokeConfig>) => void
}

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#3b82f6', '#6c63ff', '#ec4899', '#06b6d4',
  '#ffffff', '#000000',
]

const PRESET_WIDTHS = [
  { label: 'XS', value: 2 },
  { label: 'S', value: 5 },
  { label: 'M', value: 10 },
  { label: 'L', value: 20 },
]

export function Toolbar({ config, onClear, onUndo, onConfigChange }: Props) {
  return (
    <div
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '10px',
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
        color: 'var(--color-muted)',
      }}
    >
      {/* Tool */}
      <div>
        <div style={{ marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Tool</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['pen', 'eraser'] as const).map(tool => (
            <button
              key={tool}
              onClick={() => onConfigChange({ tool })}
              style={{
                flex: 1,
                padding: '5px 0',
                borderRadius: 6,
                border: '1px solid',
                borderColor: config.tool === tool ? 'var(--color-accent)' : 'var(--color-border)',
                background: config.tool === tool ? 'var(--color-accent)' : 'transparent',
                color: config.tool === tool ? '#fff' : 'var(--color-muted)',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                letterSpacing: '0.05em',
                textTransform: 'capitalize',
              }}
            >
              {tool === 'pen' ? '✏ pen' : '⬜ erase'}
            </button>
          ))}
        </div>
      </div>

      {/* Color */}
      <div>
        <div style={{ marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Color</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {PRESET_COLORS.map(c => (
            <button
              key={c}
              onClick={() => onConfigChange({ color: c })}
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: c,
                border: config.color === c ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
                cursor: 'pointer',
                outline: config.color === c ? '2px solid var(--color-accent)' : 'none',
                outlineOffset: 2,
                transition: 'transform 0.1s',
                transform: config.color === c ? 'scale(1.2)' : 'scale(1)',
              }}
              title={c}
            />
          ))}
        </div>
        {/* Custom color picker */}
        <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="color"
            value={config.color}
            onChange={e => onConfigChange({ color: e.target.value })}
            style={{
              width: 28,
              height: 22,
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              padding: 0,
              borderRadius: 4,
            }}
            title="Custom color"
          />
          <span style={{ color: 'var(--color-text)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
            {config.color}
          </span>
        </div>
      </div>

      {/* Thickness */}
      <div>
        <div style={{ marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Thickness</div>
        <div style={{ display: 'flex', gap: 5 }}>
          {PRESET_WIDTHS.map(w => (
            <button
              key={w.value}
              onClick={() => onConfigChange({ lineWidth: w.value })}
              style={{
                flex: 1,
                padding: '4px 0',
                borderRadius: 6,
                border: '1px solid',
                borderColor: config.lineWidth === w.value ? 'var(--color-accent)' : 'var(--color-border)',
                background: config.lineWidth === w.value ? 'var(--color-accent)' : 'transparent',
                color: config.lineWidth === w.value ? '#fff' : 'var(--color-muted)',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
              }}
            >
              {w.label}
            </button>
          ))}
        </div>
        <input
          type="range"
          min={1}
          max={40}
          value={config.lineWidth}
          onChange={e => onConfigChange({ lineWidth: Number(e.target.value) })}
          style={{ width: '100%', marginTop: 6, accentColor: 'var(--color-accent)' }}
        />
      </div>

      {/* Fill */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>Fill</span>
        <button
          onClick={() => onConfigChange({ fill: !config.fill })}
          style={{
            padding: '3px 10px',
            borderRadius: 5,
            border: '1px solid',
            borderColor: config.fill ? 'var(--color-accent)' : 'var(--color-border)',
            background: config.fill ? 'var(--color-accent)' : 'transparent',
            color: config.fill ? '#fff' : 'var(--color-muted)',
            cursor: 'pointer',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
          }}
        >
          {config.fill ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6, paddingTop: 4, borderTop: '1px solid var(--color-border)' }}>
        <button
          onClick={onUndo}
          style={{
            flex: 1,
            padding: '6px 0',
            borderRadius: 6,
            border: '1px solid var(--color-border)',
            background: 'transparent',
            color: 'var(--color-text)',
            cursor: 'pointer',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
          }}
        >
          ↩ undo
        </button>
        <button
          onClick={onClear}
          style={{
            flex: 1,
            padding: '6px 0',
            borderRadius: 6,
            border: '1px solid var(--color-danger)',
            background: 'transparent',
            color: 'var(--color-danger)',
            cursor: 'pointer',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
          }}
        >
          ✕ clear
        </button>
      </div>
    </div>
  )
}
