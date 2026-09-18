import { useRef, useState, useEffect, useCallback } from 'react'
import { DrawingCanvas } from './components/DrawingCanvas'
import type { DrawingCanvasHandle, StrokeConfig } from './components/DrawingCanvas'
import { WebcamPanel } from './components/WebcamPanel'
import { Toolbar } from './components/Toolbar'
import { VoiceStatus } from './components/VoiceStatus'
import { useHandTracking } from './hooks/useHandTracking'
import { useVoiceCommands } from './hooks/useVoiceCommands'
import type { VoiceCommand } from './hooks/useVoiceCommands'

const DEFAULT_CONFIG: StrokeConfig = {
  color: '#6c63ff',
  lineWidth: 5,
  fill: false,
  tool: 'pen',
}

function getInitialTheme(): 'dark' | 'light' {
  try {
    return (localStorage.getItem('theme') as 'dark' | 'light') ?? 'dark'
  } catch {
    return 'dark'
  }
}

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<DrawingCanvasHandle>(null)
  const [config, setConfig] = useState<StrokeConfig>(DEFAULT_CONFIG)
  const [theme, setTheme] = useState<'dark' | 'light'>(getInitialTheme)
  const [cameraError, setCameraError] = useState<string | null>(null)

  const { landmarks, indexTip, isDrawing, isReady, error } = useHandTracking(videoRef)

  const handleCommand = useCallback((cmd: VoiceCommand) => {
    switch (cmd.type) {
      case 'color':
        setConfig(prev => ({ ...prev, color: cmd.value as string }))
        break
      case 'thickness':
        setConfig(prev => ({ ...prev, lineWidth: cmd.value as number }))
        break
      case 'fill':
        setConfig(prev => ({ ...prev, fill: cmd.value as boolean }))
        break
      case 'clear':
        canvasRef.current?.clear()
        break
      case 'undo':
        canvasRef.current?.undo()
        break
      case 'tool':
        setConfig(prev => ({ ...prev, tool: cmd.value as 'pen' | 'eraser' }))
        break
    }
  }, [])

  const { state: voiceState, toggle: toggleVoice } = useVoiceCommands(handleCommand)

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try { localStorage.setItem('theme', theme) } catch { /* ignore */ }
  }, [theme])

  // Start webcam
  useEffect(() => {
    let stream: MediaStream | null = null
    let active = true

    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } })
      .then(s => {
        if (!active) { s.getTracks().forEach(t => t.stop()); return }
        stream = s
        const video = videoRef.current
        if (video) {
          video.srcObject = s
          video.play().catch(() => {/* autoplay blocked; video will play on user gesture */})
        }
        setCameraError(null)
      })
      .catch(err => {
        if (active) setCameraError(err?.message ?? 'Camera access denied')
      })

    return () => {
      active = false
      stream?.getTracks().forEach(t => t.stop())
    }
  }, [])

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'grid',
        gridTemplateRows: '48px 1fr',
        background: 'var(--color-bg)',
        color: 'var(--color-text)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-surface)',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              background: 'var(--color-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
            }}
          >
            ✋
          </div>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              fontWeight: 500,
              letterSpacing: '-0.02em',
              color: 'var(--color-text)',
            }}
          >
            handraw
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--color-muted)',
              marginTop: 1,
            }}
          >
            {!isReady ? 'loading model…' : error ? `error: ${error}` : ''}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <VoiceStatus voiceState={voiceState} onToggle={toggleVoice} />

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            style={{
              width: 30,
              height: 30,
              borderRadius: 6,
              border: '1px solid var(--color-border)',
              background: 'transparent',
              color: 'var(--color-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              transition: 'color 0.15s',
            }}
          >
            {theme === 'dark' ? '☀' : '◑'}
          </button>
        </div>
      </header>

      {/* Body */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 296px',
          overflow: 'hidden',
        }}
      >
        {/* Drawing canvas */}
        <div style={{ position: 'relative', overflow: 'hidden' }}>
          <DrawingCanvas
            ref={canvasRef}
            indexTip={indexTip}
            isDrawing={isDrawing}
            config={config}
          />

          {/* Cursor indicator */}
          {indexTip && (
            <div
              style={{
                position: 'absolute',
                left: `calc(${(1 - indexTip.x) * 100}% - 8px)`,
                top: `calc(${indexTip.y * 100}% - 8px)`,
                width: 16,
                height: 16,
                borderRadius: '50%',
                border: `2px solid ${isDrawing ? 'var(--color-success)' : '#f59e0b'}`,
                background: isDrawing ? 'rgba(52,211,153,0.25)' : 'rgba(245,158,11,0.25)',
                pointerEvents: 'none',
                transition: 'border-color 0.1s, background 0.1s',
              }}
            />
          )}

          {/* Hint overlay when no hand detected */}
          {isReady && !landmarks && !error && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
              }}
            >
              <div
                style={{
                  textAlign: 'center',
                  opacity: 0.35,
                  fontFamily: 'var(--font-mono)',
                }}
              >
                <div style={{ fontSize: 48, marginBottom: 12 }}>✋</div>
                <div style={{ fontSize: 13, color: 'var(--color-muted)' }}>
                  raise your index finger to draw
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 4 }}>
                  peace sign = pen up
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div
          style={{
            borderLeft: '1px solid var(--color-border)',
            background: 'var(--color-surface2)',
            padding: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            overflowY: 'auto',
          }}
        >
          <WebcamPanel
            videoRef={videoRef}
            landmarks={landmarks}
            isDrawing={isDrawing}
            isReady={isReady}
            error={cameraError ?? error}
          />

          {/* Gesture guide */}
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--color-muted)',
              lineHeight: 1.7,
              padding: '8px 10px',
              background: 'var(--color-surface)',
              borderRadius: 8,
              border: '1px solid var(--color-border)',
            }}
          >
            <div style={{ color: 'var(--color-text)', marginBottom: 4, fontSize: 11 }}>gestures</div>
            <div>☝ index up → draw</div>
            <div>✌ peace sign → lift pen</div>
            <div style={{ marginTop: 4, color: 'var(--color-text)', fontSize: 11 }}>voice</div>
            <div>"color red"</div>
            <div>"thickness thick"</div>
            <div>"fill on / fill off"</div>
            <div>"undo" / "clear"</div>
            <div>"eraser" / "pen"</div>
          </div>

          <Toolbar
            config={config}
            onConfigChange={patch => setConfig(prev => ({ ...prev, ...patch }))}
            onClear={() => canvasRef.current?.clear()}
            onUndo={() => canvasRef.current?.undo()}
          />
        </div>
      </div>
    </div>
  )
}
