import { useEffect, useRef, useState, useCallback } from 'react'

export interface NormalizedLandmark {
  x: number
  y: number
  z: number
  visibility?: number
}

export interface HandTrackingResult {
  landmarks: NormalizedLandmark[] | null
  indexTip: { x: number; y: number } | null
  isDrawing: boolean
  isReady: boolean
  error: string | null
}

const HAND_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
]

export { HAND_CONNECTIONS }

function isFingerExtended(landmarks: NormalizedLandmark[], tipIdx: number, dipIdx: number, mcpIdx: number): boolean {
  return landmarks[tipIdx].y < landmarks[dipIdx].y && landmarks[dipIdx].y < landmarks[mcpIdx].y
}

export function useHandTracking(videoRef: React.RefObject<HTMLVideoElement | null>) {
  const [result, setResult] = useState<HandTrackingResult>({
    landmarks: null,
    indexTip: null,
    isDrawing: false,
    isReady: false,
    error: null,
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const landmarkerRef = useRef<any>(null)
  const rafRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(-1)

  const detect = useCallback(() => {
    const video = videoRef.current
    const landmarker = landmarkerRef.current
    if (!video || !landmarker || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(detect)
      return
    }

    const now = performance.now()
    if (now === lastTimeRef.current) {
      rafRef.current = requestAnimationFrame(detect)
      return
    }
    lastTimeRef.current = now

    try {
      const detectionResult = landmarker.detectForVideo(video, now)
      const hand = detectionResult.landmarks?.[0] ?? null

      if (hand) {
        const indexExtended = isFingerExtended(hand, 8, 7, 5)
        const middleExtended = isFingerExtended(hand, 12, 11, 9)
        const drawing = indexExtended && !middleExtended

        setResult({
          landmarks: hand,
          indexTip: { x: hand[8].x, y: hand[8].y },
          isDrawing: drawing,
          isReady: true,
          error: null,
        })
      } else {
        setResult(prev => ({
          ...prev,
          landmarks: null,
          indexTip: null,
          isDrawing: false,
          isReady: true,
        }))
      }
    } catch {
      // skip frame on error
    }

    rafRef.current = requestAnimationFrame(detect)
  }, [videoRef])

  useEffect(() => {
    let cancelled = false

    async function init() {
      try {
        const { HandLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision')

        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm'
        )

        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'CPU',
          },
          numHands: 1,
          runningMode: 'VIDEO',
        })

        if (cancelled) {
          landmarker.close()
          return
        }

        landmarkerRef.current = landmarker
        setResult(prev => ({ ...prev, isReady: true }))
        rafRef.current = requestAnimationFrame(detect)
      } catch (err) {
        if (!cancelled) {
          setResult(prev => ({
            ...prev,
            error: err instanceof Error ? err.message : 'Failed to load hand tracker',
          }))
        }
      }
    }

    init()

    return () => {
      cancelled = true
      cancelAnimationFrame(rafRef.current)
      landmarkerRef.current?.close()
      landmarkerRef.current = null
    }
  }, [detect])

  return result
}
