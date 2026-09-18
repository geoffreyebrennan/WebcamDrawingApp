# Hand-Tracking Drawing App — Implementation Plan

## Context

Build a creative drawing application where the user draws by moving their hand in front of a webcam. Voice commands configure drawing properties (color, line thickness, fill). The UI treats the drawing canvas as the primary surface, with a compact webcam+hand-tracking overlay as a secondary panel.

## Aesthetic

**Stance:** Dark studio / creative tool. Deep near-black background (`#0d0d0f`), off-white canvas, accent in electric indigo or vivid cyan. Typography: DM Mono for labels/status, DM Sans for UI copy. Feels like a high-end creative instrument, not a productivity app.

## Architecture

### Libraries to install
- `@mediapipe/tasks-vision` — hand landmark detection (works in-browser via WASM)
- No voice library needed — use the native `SpeechRecognition` Web API

### Files to create/modify
- `src/App.tsx` — full app shell with layout
- `src/index.css` — Google Font imports + Tailwind + theme tokens
- `src/components/DrawingCanvas.tsx` — main canvas, receives stroke config + hand position
- `src/components/WebcamPanel.tsx` — webcam feed + hand landmark overlay (canvas on top of video)
- `src/components/VoiceStatus.tsx` — mic status indicator + last-heard command
- `src/components/Toolbar.tsx` — visual display of current config (color, thickness, fill mode)
- `src/hooks/useHandTracking.ts` — MediaPipe setup, returns dominant hand's index finger tip position + landmarks
- `src/hooks/useVoiceCommands.ts` — SpeechRecognition setup, returns parsed command events

## Layout

```
┌──────────────────────────────────────────────────┐
│  [logo/title]                     [voice status] │  ← header bar ~48px
├────────────────────────────┬─────────────────────┤
│                            │  webcam + skeleton  │
│   DRAWING CANVAS (main)    │  hand overlay panel │  ← body
│                            │  ─────────────────  │
│                            │  toolbar / config   │
└────────────────────────────┴─────────────────────┘
```

- Drawing canvas: fills available width minus sidebar (~300px)
- Sidebar (right): webcam panel (~280×210px) + config toolbar below

## Hand Tracking (`useHandTracking.ts`)

1. Load `HandLandmarker` from `@mediapipe/tasks-vision` with the hand landmark model via CDN task file URL.
2. Run detection on each animation frame from the video element.
3. Return: `landmarks` array (21 points per hand), `indexTip` (landmark 8 in normalized coords), `isDrawing` flag derived from index finger extended + middle finger curled (pinch-like gesture for lift).
4. Drawing gesture: index finger extended. Pause/lift gesture: index + middle both extended (peace sign = pen up).

## Voice Commands (`useVoiceCommands.ts`)

Use `window.SpeechRecognition` (or `webkitSpeechRecognition`). Continuous listening mode. Parse recognized text for:

| Phrase pattern | Action |
|---|---|
| "color [name/hex]" | Set stroke color |
| "thickness [thin/medium/thick/N]" | Set line width (2/5/12/custom) |
| "fill on / fill off" | Toggle shape fill |
| "clear" / "clear canvas" | Wipe canvas |
| "undo" | Remove last stroke |
| "eraser" / "pen" | Switch tool mode |

Return a stream of `{ type, value }` command events via callback.

## DrawingCanvas (`DrawingCanvas.tsx`)

- `<canvas>` element, full panel size, white or off-white fill
- Receives `indexTip` (normalized 0–1 coords), `isDrawing`, and stroke config
- On each frame: if `isDrawing`, draw line from previous tip position to current
- Store strokes as path arrays for undo support
- Smooth input with a small rolling average (last 3 positions)

## WebcamPanel (`WebcamPanel.tsx`)

- `<video>` element (mirrored) + `<canvas>` overlay (absolute positioned, same size)
- Draw skeleton: connect landmarks per MediaPipe hand topology (21 points, standard finger connections)
- Draw a colored dot at index finger tip
- Show "tracking" / "no hand" status badge

## Toolbar (`Toolbar.tsx`)

- Swatch showing current color
- Thickness preview (a line segment)
- Fill toggle badge
- Tool indicator (pen vs eraser)
- Clear and Undo buttons

## Light / Dark Mode

- A toggle button in the header switches between light and dark mode.
- Persisted in `localStorage` and applied via a `data-theme="dark"` attribute on `<html>`.
- All color tokens are defined in two blocks so the entire UI responds automatically.

## Theme tokens (in `src/index.css`)

```css
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');
@import 'tailwindcss';

@theme {
  --font-sans: 'DM Sans', sans-serif;
  --font-mono: 'DM Mono', monospace;
}

/* Dark mode (default) */
:root, [data-theme="dark"] {
  --color-bg: #0d0d0f;
  --color-surface: #18181c;
  --color-border: #2a2a32;
  --color-accent: #6c63ff;
  --color-text: #e8e8ef;
  --color-muted: #6b6b78;
  --color-canvas: #1a1a20;
}

/* Light mode */
[data-theme="light"] {
  --color-bg: #f4f4f6;
  --color-surface: #ffffff;
  --color-border: #dddde5;
  --color-accent: #5b52e8;
  --color-text: #111118;
  --color-muted: #888896;
  --color-canvas: #ffffff;
}
```

Theme toggle: a sun/moon icon button in the header calls `document.documentElement.setAttribute('data-theme', ...)` and saves to `localStorage`. Initial value read on mount.

## MediaPipe Loading Strategy

Use the CDN-hosted WASM + model approach to avoid bundling large binary files:
```ts
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

const vision = await FilesetResolver.forVisionTasks(
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm'
);
const handLandmarker = await HandLandmarker.createFromOptions(vision, {
  baseOptions: { modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task' },
  numHands: 1,
  runningMode: 'VIDEO',
});
```

## Verification

1. `pnpm install` after adding `@mediapipe/tasks-vision`
2. Open app preview, grant camera + mic permissions
3. Extend index finger → drawing should begin on canvas
4. Extend both index + middle → pen lifts (stroke ends)
5. Say "color red" → stroke color changes to red
6. Say "thickness thick" → line becomes thick
7. Say "clear" → canvas clears
8. Webcam panel shows skeleton overlay on hand
