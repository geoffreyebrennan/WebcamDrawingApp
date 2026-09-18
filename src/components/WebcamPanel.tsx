import { useEffect, useRef } from 'react'
import type { NormalizedLandmark } from '../hooks/useHandTracking'
import { HAND_CONNECTIONS } from '../hooks/useHandTracking'

interface Props {
  videoRef: React.RefObject<HTMLVideoElement | null>
  landmarks: NormalizedLandmark[] | null
  isDrawing: boolean
  isReady: boolean
  error: string | null
}

export function WebcamPanel({ videoRef, landmarks, isDrawing, isReady, error }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = overlayRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const rect = container.getBoundingClientRect()
    const W = rect.width
    const H = rect.height

    canvas.width = W * devicePixelRatio
    canvas.height = H * devicePixelRatio
    canvas.style.width = W + 'px'
    canvas.style.height = H + 'px'

    const ctx = canvas.getContext('2d')!
    ctx.scale(devicePixelRatio, devicePixelRatio)
    ctx.clearRect(0, 0, W, H)

    if (!landmarks) return

    // MediaPipe returns normalized [0,1] coordinates with x=0 on the right
    // (as seen from the camera). The video is CSS-mirrored (scaleX(-1)), so
    // we also mirror x here so the skeleton overlaps the mirrored video.
    const toX = (nx: number) => (1 - nx) * W
    const toY = (ny: number) => ny * H

    // Skeleton connections
    ctx.strokeStyle = 'rgba(108, 99, 255, 0.75)'
    ctx.lineWidth = 1.5
    ctx.lineCap = 'round'
    for (const [a, b] of HAND_CONNECTIONS) {
      const la = landmarks[a]
      const lb = landmarks[b]
      ctx.beginPath()
      ctx.moveTo(toX(la.x), toY(la.y))
      ctx.lineTo(toX(lb.x), toY(lb.y))
      ctx.stroke()
    }

    // Landmark dots
    for (let i = 0; i < landmarks.length; i++) {
      const lm = landmarks[i]
      const isIndexTip = i === 8
      ctx.beginPath()
      ctx.arc(toX(lm.x), toY(lm.y), isIndexTip ? 5 : 2.5, 0, Math.PI * 2)
      ctx.fillStyle = isIndexTip
        ? (isDrawing ? '#34d399' : '#f59e0b')
        : 'rgba(255,255,255,0.55)'
      ctx.fill()
    }
  }, [landmarks, isDrawing])

  const statusText = !isReady
    ? 'loading model…'
    : error
      ? error
      : landmarks
        ? (isDrawing ? '● drawing' : '◎ tracking')
        : '○ no hand detected'

  const statusColor = error
    ? 'var(--color-danger)'
    : landmarks
      ? (isDrawing ? 'var(--color-success)' : '#f59e0b')
      : 'var(--color-muted)'

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '4/3',
        background: '#0a0a0e',
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid var(--color-border)',
        flexShrink: 0,
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: 'scaleX(-1)',
          display: 'block',
        }}
      />

      <canvas
        ref={overlayRef}
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
        }}
      />

      {/* Camera error overlay */}
      {error && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.82)',
            gap: 8,
            padding: 16,
            textAlign: 'center',
          }}
        >
          <span style={{ fontSize: 26 }}>📷</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-danger)', lineHeight: 1.5 }}>
            Camera blocked
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-muted)', lineHeight: 1.6 }}>
            Click the camera icon in your browser's address bar and allow access, then reload.
          </span>
        </div>
      )}

      {/* Status badge */}
      <div
        style={{
          position: 'absolute',
          bottom: 8,
          left: 8,
          padding: '2px 8px',
          borderRadius: '4px',
          fontSize: '10px',
          fontFamily: 'var(--font-mono)',
          letterSpacing: '0.05em',
          background: 'rgba(0,0,0,0.6)',
          color: statusColor,
          backdropFilter: 'blur(4px)',
          maxWidth: 'calc(100% - 16px)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {statusText}
      </div>
    </div>
  )
}
