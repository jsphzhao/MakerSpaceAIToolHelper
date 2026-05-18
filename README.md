# Makerspace Tool Explainer

Accessible AI image-based tool explainer for makerspaces (CS311 project). Upload or capture a photo of a makerspace tool and receive plain-language identification, safety warnings, usage steps, and optional text-to-speech.

## Features

- Image upload (drag & drop, file picker) and camera capture
- Gemini vision API for tool identification and explanations
- Text-to-speech with pause, resume, and speed control
- High-contrast mode and keyboard-accessible UI

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env` and add your Gemini API key:

```
VITE_GEMINI_API_KEY=your_key_here
```

3. Start the dev server:

```bash
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

## Testing on your phone

To use the app on a phone while developing, expose the dev server on your local network:

1. Start the dev server with network access:

```bash
npm run dev -- --host
```

2. Connect your phone and computer to the **same Wi‑Fi network**.

3. Open the **Network** URL from the terminal on your phone (for example, `http://10.105.149.238:5173`). Your IP may differ—use the address Vite prints after `--host`.

If the page does not load, allow incoming connections for Node or your terminal app in **System Settings → Network → Firewall** (macOS).

**Camera on your phone:** Browsers block live camera preview over plain HTTP (except on `localhost`). When you open the app via your network IP, use the **Take photo** button—it opens your phone’s built-in camera and works without HTTPS. On desktop or over HTTPS, **Use camera** provides a live preview instead.

## Build

```bash
npm run build
npm run preview
```

## Security note

The API key is loaded via Vite environment variables and will be bundled in the client for this prototype. For production, use a backend proxy to keep keys secret. Do not commit `.env` to version control.

## Team

Saeed AlKaabi, Azan Malik, Matus Menczer, Joseph Zhao
