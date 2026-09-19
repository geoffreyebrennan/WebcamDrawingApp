# Handraw

A browser-based drawing app controlled by hand gestures and optional voice commands. Point with your index finger to draw on the canvas, then use the toolbar or voice commands to customize the result.

## Features

- Real-time index-finger hand tracking with MediaPipe
- Mirrored webcam preview aligned with the drawing canvas
- Pen and eraser tools
- Preset and custom colors
- Adjustable line thickness
- Optional fill mode
- Undo and clear actions
- Voice commands for common drawing controls
- Dark and light themes

## Requirements

- Node.js with `pnpm` or `npm`
- A modern browser with webcam access
- Microphone access for voice commands
- HTTPS or `localhost` for camera and microphone permissions

Voice recognition support depends on the browser. Chromium-based browsers generally provide the best support.

## Getting Started

Install dependencies:

```bash
pnpm install
```

Start the development server:

```bash
pnpm dev
```

Open the local URL shown by Vite, allow camera access, and allow microphone access if you want to use voice commands.

## Controls

Use the toolbar to choose:

- `pen` or `erase`
- A preset or custom color
- Line thickness
- Fill mode
- `undo` and `clear`

To draw with your hand, extend your index finger while keeping your middle finger folded. Move your index finger across the canvas. The canvas follows the mirrored position shown in the webcam preview.

### Voice commands

Enable voice controls from the voice control in the header, then say commands such as:

- `color red`
- `thickness thin`
- `thickness medium`
- `thickness thick`
- `thickness 12`
- `fill on` or `fill off`
- `pen` or `eraser`
- `undo`
- `clear canvas`

## Production Build

Create a production build:

```bash
pnpm build
```

Preview the production build locally:

```bash
pnpm preview
```

## GitHub Pages Deployment

The project is configured for the repository site:

<https://geoffreyebrennan.github.io/WebcamDrawingApp/>

Deploy the `dist` directory to the `gh-pages` branch:

```bash
npm run deploy
```

The repository's GitHub Pages settings must use:

- Branch: `gh-pages`
- Folder: `/(root)`

After deployment, allow a short time for GitHub Pages to publish the updated branch. A hard refresh may be needed to bypass an old browser cache.

## Formatting

Format the project with:

```bash
pnpm format
```

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS 4
- MediaPipe Tasks Vision
- Web Speech API
