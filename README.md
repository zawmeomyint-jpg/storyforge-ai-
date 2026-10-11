# StoryForge AI — Online deployment starter

This package contains:
- `client/`: React/Vite frontend
- `server/`: Express API for uploaded-video frame sampling and first-pass script generation
- `render.yaml`: starter configuration for deploying the API to Render

## Important capability limits

This is a deployment starter, not a finished production video-understanding service. The initial backend samples up to 24 frames with FFmpeg and creates a first-pass narration draft from those frames. It does **not** yet transcribe the complete audio track or inspect every frame. Do not present its output as a faithful full-length reconstruction. For production-quality long-form narration, add chunked audio transcription, denser scene sampling, timestamps, a persistent job queue, progress updates, storage, and human review.

Video URL import is intentionally disabled. Do not fetch arbitrary URLs directly from the server: doing so can create SSRF/security risks. Add a trusted ingestion provider with domain allowlists, DNS/IP checks, redirect controls, and size/time limits before enabling URL ingestion.

## Local development

Requirements:
- Node.js 20+
- FFmpeg and ffprobe installed and available on PATH
- An OpenAI API key

1. API:
   ```bash
   cd server
   cp .env.example .env
   # Set OPENAI_API_KEY in server/.env
   npm install
   npm run dev
   ```
2. Frontend in a second terminal:
   ```bash
   cd client
   cp .env.example .env
   npm install
   npm run dev
   ```
3. Open the Vite local URL shown in the terminal.

Never place the OpenAI API key in the client or any `VITE_` environment variable.

## Deploy online

### 1. Deploy API on Render
1. Push this folder to a private GitHub repository.
2. Create a new Render Web Service from that repository.
3. Set Root Directory to `server`, Build Command to `npm install`, Start Command to `npm start`.
4. Add environment variables:
   - `OPENAI_API_KEY`: your secret key
   - `OPENAI_MODEL`: a vision-capable model available to your account (default `gpt-4.1-mini`)
   - `CLIENT_ORIGIN`: the exact deployed frontend origin, e.g. `https://your-app.vercel.app`
   - `MAX_UPLOAD_MB`: choose a limit supported by your hosting plan
5. Confirm `https://YOUR-API.onrender.com/api/health` returns `{ "ok": true, ... }`.
6. Ensure FFmpeg and ffprobe are installed in the API runtime. If the chosen host doesn't include them, use a Docker deployment and install `ffmpeg` in the image.

### 2. Deploy frontend on Vercel
1. Import the same GitHub repository into Vercel.
2. Set Root Directory to `client`.
3. Add environment variable `VITE_API_BASE_URL=https://YOUR-API.onrender.com`.
4. Deploy.
5. Go back to Render and set `CLIENT_ORIGIN` to the exact Vercel URL, then redeploy the API.

## Production checklist before public launch
- Add authentication and per-user quotas.
- Use object storage and background jobs for long videos; do not rely on one long HTTP request.
- Add chunked audio transcription and speaker/timestamp alignment.
- Scan uploads, limit duration/size, clean up temporary files, and define retention/deletion policies.
- Add billing/abuse protection and monitoring.
- Verify copyright permission for each video. Generate original summaries/narration; do not recreate copyrighted dialogue verbatim.
- Test model availability and token/vision limits for your account.
