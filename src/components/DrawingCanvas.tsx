import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react'

export interface StrokeConfig {
  color: string
  lineWidth: number
  fill: boolean
  tool: 'pen' | 'eraser'
}

interface Props {
  indexTip: { x: number; y: number } | null
  isDrawing: boolean
  config: StrokeConfig
  onUndo?: () => void
}

export interface DrawingCanvasHandle {
  clear: () => void
  undo: () => void
}

interface Point { x: number; y: number }
interface Stroke { points: Point[]; config: StrokeConfig }

const SMOOTH_WINDOW = 3

function avg(pts: Point[]): Point {
  const x = pts.reduce((s, p) => s + p.x, 0) / pts.length
  const y = pts.reduce((s, p) => s + p.y, 0) / pts.length
  return { x, y }
}

export const DrawingCanvas = forwardRef<DrawingCanvasHandle, Props>(function DrawingCanvas(
  { indexTip, isDrawing, config },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const strokesRef = useRef<Stroke[]>([])
  const currentStrokeRef = useRef<Point[]>([])
  const smoothBufferRef = useRef<Point[]>([])
  const wasDrawingRef = useRef(false)

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    for (const stroke of strokesRef.current) {
      drawStroke(ctx, stroke, canvas.width, canvas.height)
    }
  }, [])

  const clear = useCallback(() => {
    strokesRef.current = []
    currentStrokeRef.current = []
    redraw()
  }, [redraw])

  const undo = useCallback(() => {
    strokesRef.current.pop()
    currentStrokeRef.current = []
    redraw()
  }, [redraw])

  useImperativeHandle(ref, () => ({ clear, undo }), [clear, undo])

  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const observer = new ResizeObserver(() => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * devicePixelRatio
      canvas.height = rect.height * devicePixelRatio
      const ctx = canvas.getContext('2d')!
      ctx.scale(devicePixelRatio, devicePixelRatio)
      redraw()
    })
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [redraw])

  // Drawing loop driven by indexTip + isDrawing
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const W = canvas.width / devicePixelRatio
    const H = canvas.height / devicePixelRatio

    if (!isDrawing) {
      // Pen lifted — save stroke
      if (wasDrawingRef.current && currentStrokeRef.current.length > 1) {
        strokesRef.current.push({
          points: [...currentStrokeRef.current],
          config: { ...config },
        })
        redraw()
      }
      currentStrokeRef.current = []
      smoothBufferRef.current = []
      wasDrawingRef.current = false
      return
    }

    if (!indexTip) return

    const rawPt: Point = { x: (1 - indexTip.x) * W, y: indexTip.y * H }
    smoothBufferRef.current.push(rawPt)
    if (smoothBufferRef.current.length > SMOOTH_WINDOW) {
      smoothBufferRef.current.shift()
    }
    const pt = avg(smoothBufferRef.current)
    currentStrokeRef.current.push(pt)

    const pts = currentStrokeRef.current
    if (pts.length < 2) {
      wasDrawingRef.current = true
      return
    }

    // Draw incremental segment
    const prev = pts[pts.length - 2]
    const curr = pts[pts.length - 1]

    ctx.save()
    applyConfig(ctx, config)
    ctx.beginPath()
    ctx.moveTo(prev.x, prev.y)
    ctx.lineTo(curr.x, curr.y)
    ctx.stroke()
    ctx.restore()

    wasDrawingRef.current = true
  }, [indexTip, isDrawing, config])

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100%', display: 'block', background: 'var(--color-canvas)' }}
    />
  )
})

function applyConfig(ctx: CanvasRenderingContext2D, config: StrokeConfig) {
  if (config.tool === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out'
    ctx.strokeStyle = 'rgba(0,0,0,1)'
    ctx.lineWidth = config.lineWidth * 3
  } else {
    ctx.globalCompositeOperation = 'source-over'
    ctx.strokeStyle = config.color
    ctx.fillStyle = config.color
    ctx.lineWidth = config.lineWidth
  }
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
}

function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke, _w: number, _h: number) {
  const { points, config } = stroke
  if (points.length < 2) return

  ctx.save()
  applyConfig(ctx, config)
  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y)
  }
  if (config.fill) {
    ctx.closePath()
    ctx.fill()
  }
  ctx.stroke()
  ctx.restore()
}
