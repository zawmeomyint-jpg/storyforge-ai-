import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import OpenAI from 'openai';
import { spawn } from 'node:child_process';
import { mkdtemp, readdir, readFile, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';

const app = express();
const port = Number(process.env.PORT || 8787);
const maxUploadMb = Number(process.env.MAX_UPLOAD_MB || 500);
const upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: maxUploadMb * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype?.startsWith('video/')) return cb(new Error('Please upload a video file.'));
    cb(null, true);
  }
});

app.use(helmet());
app.use(cors({
  origin: (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map(s => s.trim()),
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json({ limit: '2mb' }));
app.use(rateLimit({ windowMs: 60_000, limit: 15, standardHeaders: true, legacyHeaders: false }));

const openai = () => {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'replace_me') {
    const err = new Error('Server admin has not configured OPENAI_API_KEY yet.');
    err.status = 503;
    throw err;
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
};

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'], ...options });
    let stdout = '', stderr = '';
    child.stdout.on('data', d => stdout += d.toString());
    child.stderr.on('data', d => stderr += d.toString());
    child.on('error', reject);
    child.on('close', code => code === 0 ? resolve({ stdout, stderr }) : reject(new Error(`${command} failed: ${stderr.slice(-1200)}`)));
  });
}

const safeUnlink = async p => { if (p) await rm(p, { force: true }).catch(() => {}); };

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'storyforge-ai-api' }));

app.post('/api/analyze', upload.single('video'), async (req, res, next) => {
  const uploaded = req.file;
  let workDir;
  try {
    if (req.body.videoUrl) {
      if (process.env.ENABLE_VIDEO_URLS !== 'true') {
        return res.status(400).json({ error: 'Video URL import is disabled. Upload a video file, or configure a trusted URL-ingestion provider on the server.' });
      }
      // Deliberately do not fetch arbitrary URLs here. Add a provider that validates domains,
      // blocks private IP ranges, restricts redirects, and enforces download limits.
      return res.status(501).json({ error: 'URL ingestion provider is not configured. Upload a video file for now.' });
    }
    if (!uploaded) return res.status(400).json({ error: 'Upload a video file first.' });

    const client = openai();
    workDir = await mkdtemp(path.join(os.tmpdir(), 'storyforge-'));
    const videoPath = path.resolve(uploaded.path);
    const probe = await run('ffprobe', ['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',videoPath]);
    const durationSec = Math.max(0, Number(probe.stdout.trim()) || 0);
    if (!durationSec) return res.status(400).json({ error: 'Could not read video duration. Check that FFmpeg/ffprobe is installed and the file is valid.' });

    // Extract one representative frame every ~45 seconds, capped to control API cost.
    const interval = Math.max(15, Math.ceil(durationSec / 24));
    const framePattern = path.join(workDir, 'frame-%03d.jpg');
    await run('ffmpeg', ['-hide_banner','-loglevel','error','-i',videoPath,'-vf',`fps=1/${interval},scale=768:-1:force_original_aspect_ratio=decrease`,'-frames:v','24','-q:v','5',framePattern]);
    const frameNames = (await readdir(workDir)).filter(n => /^frame-\d+\.jpg$/.test(n)).sort();
    const frames = [];
    for (const name of frameNames) {
      const bytes = await readFile(path.join(workDir, name));
      const minute = Math.round((frames.length * interval) / 60);
      frames.push({
        type: 'image_url',
        image_url: { url: `data:image/jpeg;base64,${bytes.toString('base64')}`, detail: 'low' }
      });
      frames.push({ type: 'text', text: `Representative frame around minute ${minute}.` });
    }
    if (!frames.length) return res.status(422).json({ error: 'No frames could be extracted from this video.' });

    const styleNames = { hybrid: 'Hybrid: detailed causal narration plus cinematic suspense and emotion', detailed: 'Detailed chronological narration with clear explanations', cinematic: 'Cinematic narration emphasizing suspense and emotion' };
    const langNames = { my: 'Burmese (Myanmar language)', en: 'English', both: 'Burmese and English' };
    const targetMinutes = Math.min(240, Math.max(5, Number(req.body.targetMinutes) || 90));
    const playbackSpeed = Math.min(2, Math.max(0.8, Number(req.body.playbackSpeed) || 1.2));
    const style = styleNames[req.body.style] || styleNames.hybrid;
    const language = langNames[req.body.language] || langNames.my;

    const sceneResponse = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
      temperature: 0.35,
      max_tokens: 5000,
      messages: [
        { role: 'system', content: 'You are a careful film scene analyst. Analyze only evidence visible in supplied sampled frames. Do not invent plot details, dialogue, character names, or motivations not supported by evidence. If uncertain, label uncertainty. Return a structured chronological scene map with timestamps, visible characters, actions, setting, transitions, and unresolved questions. This is a scene-sampling aid, not proof that every moment was observed.' },
        { role: 'user', content: [
          { type: 'text', text: `Analyze this uploaded movie using the following sampled frames. Video duration: ${Math.round(durationSec/60)} minutes. Frame sampling interval: about ${interval} seconds. Return a chronological scene map in ${language}. Be explicit about gaps caused by sampling.` },
          ...frames
        ]}
      ]
    });
    const sceneMap = sceneResponse.choices?.[0]?.message?.content || '';

    const scriptResponse = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
      temperature: 0.65,
      max_tokens: 7000,
      messages: [
        { role: 'system', content: `You write original, clear narration scripts. Language: ${language}. Style: ${style}. Explain the plot causally so a listener can follow it without watching. Never claim you watched unsampled scenes; flag missing details and avoid inventing dialogue. Do not reproduce long stretches of copyrighted dialogue or imitate a specific living creator. Produce an original narration, not a transcript. Add sparse voice cues such as [ခေတ္တရပ် — ၁ စက္ကန့်] only when useful. Be transparent if evidence is insufficient for a full-length retelling.` },
        { role: 'user', content: `Based on this sampled scene map, draft a useful first-pass storytelling script targeting approximately ${targetMinutes} minutes at ${playbackSpeed}x playback. Do not pad with repetition to hit a duration. If the scene map is too sparse for that length, say so and create a shorter faithful draft rather than hallucinating.\n\nSCENE MAP:\n${sceneMap}\n\nReturn the script only, with a short title.` }
      ]
    });
    const script = scriptResponse.choices?.[0]?.message?.content || '';
    return res.json({
      projectName: path.basename(uploaded.originalname, path.extname(uploaded.originalname)).slice(0, 100),
      durationSeconds: Math.round(durationSec),
      sceneCount: frameNames.length,
      transcriptAvailable: false,
      samplingIntervalSeconds: interval,
      sceneMap,
      script,
      note: 'First-pass analysis from sampled frames only; not a full audio transcript or guaranteed full-length scene-by-scene reconstruction.'
    });
  } catch (err) {
    next(err);
  } finally {
    await safeUnlink(uploaded?.path);
    if (workDir) await rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
});

app.post('/api/generate-script', async (req, res, next) => {
  try {
    const client = openai();
    const { script = '', language = 'my', style = 'hybrid', targetMinutes = 90, playbackSpeed = 1.2 } = req.body || {};
    if (!script.trim()) return res.status(400).json({ error: 'Add a scene map or draft script first.' });
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
      temperature: 0.6,
      max_tokens: 7000,
      messages: [
        { role: 'system', content: `Improve this into an original, clear voice-over storytelling script. Language: ${language === 'my' ? 'Burmese' : language === 'en' ? 'English' : 'Burmese and English'}. Style: ${style}. Keep only details supported by the input, preserve causal clarity, add sparse helpful voice cues, avoid padding and long verbatim dialogue. Target ${targetMinutes} minutes at ${playbackSpeed}x only if the evidence supports it; otherwise explain limitations briefly.` },
        { role: 'user', content: script }
      ]
    });
    res.json({ script: completion.choices?.[0]?.message?.content || '' });
  } catch (err) { next(err); }
});

app.use((err, _req, res, _next) => {
  console.error(err?.message || err);
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: `File is too large. Server limit is ${maxUploadMb} MB.` });
  }
  const status = err.status || 500;
  res.status(status).json({ error: status === 500 ? 'Server processing failed. Check server logs and FFmpeg/API configuration.' : err.message });
});

app.listen(port, () => console.log(`StoryForge API listening on port ${port}`));
