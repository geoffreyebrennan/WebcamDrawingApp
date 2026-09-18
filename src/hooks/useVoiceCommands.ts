import { useEffect, useRef, useState, useCallback } from 'react'

export type VoiceCommandType = 'color' | 'thickness' | 'fill' | 'clear' | 'undo' | 'tool'

export interface VoiceCommand {
  type: VoiceCommandType
  value: string | number | boolean
}

export interface VoiceState {
  listening: boolean
  lastTranscript: string
  lastCommand: VoiceCommand | null
  supported: boolean
  error: string | null
}

const CSS_COLORS: Record<string, string> = {
  red: '#ef4444',
  orange: '#f97316',
  yellow: '#eab308',
  green: '#22c55e',
  blue: '#3b82f6',
  purple: '#a855f7',
  pink: '#ec4899',
  cyan: '#06b6d4',
  white: '#ffffff',
  black: '#000000',
  gray: '#6b7280',
  grey: '#6b7280',
  indigo: '#6366f1',
  teal: '#14b8a6',
  lime: '#84cc16',
  amber: '#f59e0b',
}

function parseCommand(text: string): VoiceCommand | null {
  const t = text.toLowerCase().trim()

  // color <name>
  const colorMatch = t.match(/colou?r\s+(.+)/)
  if (colorMatch) {
    const name = colorMatch[1].trim()
    const hex = CSS_COLORS[name] ?? (name.startsWith('#') ? name : null)
    if (hex) return { type: 'color', value: hex }
  }

  // thickness thin|medium|thick|<number>
  const thickMatch = t.match(/thickness\s+(.+)/)
  if (thickMatch) {
    const v = thickMatch[1].trim()
    const map: Record<string, number> = { thin: 2, medium: 5, thick: 12, 'extra thick': 20 }
    if (map[v]) return { type: 'thickness', value: map[v] }
    const n = parseInt(v)
    if (!isNaN(n)) return { type: 'thickness', value: Math.max(1, Math.min(50, n)) }
  }

  if (t.includes('fill on') || t === 'fill') return { type: 'fill', value: true }
  if (t.includes('fill off') || t === 'no fill') return { type: 'fill', value: false }
  if (t === 'clear' || t.includes('clear canvas') || t.includes('clear the canvas')) return { type: 'clear', value: '' }
  if (t === 'undo') return { type: 'undo', value: '' }
  if (t === 'eraser' || t.includes('erase mode')) return { type: 'tool', value: 'eraser' }
  if (t === 'pen' || t.includes('pen mode') || t.includes('draw mode')) return { type: 'tool', value: 'pen' }

  return null
}

export function useVoiceCommands(onCommand: (cmd: VoiceCommand) => void) {
  const [state, setState] = useState<VoiceState>({
    listening: false,
    lastTranscript: '',
    lastCommand: null,
    supported: typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window),
    error: null,
  })

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const onCommandRef = useRef(onCommand)
  onCommandRef.current = onCommand

  const start = useCallback(() => {
    if (recognitionRef.current) return

    const SR = (window as typeof window & { webkitSpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition ??
      (window as typeof window & { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition

    if (!SR) return

    const rec = new SR()
    rec.continuous = true
    rec.interimResults = false
    rec.lang = 'en-US'

    rec.onstart = () => setState(prev => ({ ...prev, listening: true, error: null }))
    rec.onend = () => {
      setState(prev => ({ ...prev, listening: false }))
      recognitionRef.current = null
    }
    rec.onerror = (e) => {
      setState(prev => ({ ...prev, error: e.error, listening: false }))
      recognitionRef.current = null
    }
    rec.onresult = (e) => {
      const transcript = e.results[e.results.length - 1][0].transcript
      const cmd = parseCommand(transcript)
      setState(prev => ({ ...prev, lastTranscript: transcript, lastCommand: cmd }))
      if (cmd) onCommandRef.current(cmd)
    }

    rec.start()
    recognitionRef.current = rec
  }, [])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
    recognitionRef.current = null
  }, [])

  const toggle = useCallback(() => {
    if (state.listening) stop()
    else start()
  }, [state.listening, start, stop])

  useEffect(() => () => { recognitionRef.current?.stop() }, [])

  return { state, start, stop, toggle }
}
