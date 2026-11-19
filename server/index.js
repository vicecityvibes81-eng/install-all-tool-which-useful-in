const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { exec, spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Storage folders
const UPLOADS_DIR = path.join(__dirname, '../uploads');
const OUTPUT_DIR = path.join(__dirname, '../output');
const PUBLIC_DIR = path.join(__dirname, 'public');

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });

// Serve static frontend and media
app.use(express.static(PUBLIC_DIR));
app.use('/output', express.static(OUTPUT_DIR));
app.use('/uploads', express.static(UPLOADS_DIR));

// Multer upload config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.mp4';
    const name = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    cb(null, name);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB
});

// Helper execute promise
function runCmd(cmd, args = []) {
  return new Promise((resolve, reject) => {
    const fullCmd = [cmd, ...args].join(' ');
    exec(fullCmd, { maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) {
        return reject({ err, stdout, stderr });
      }
      resolve({ stdout, stderr });
    });
  });
}

// 1. Tool Status Endpoint
app.get('/api/status', (req, res) => {
  const tools = [
    { name: 'FFmpeg', cmd: 'ffmpeg -version', parser: out => out.split('\n')[0].replace('ffmpeg version ', '').split(' ')[0] },
    { name: 'FFprobe', cmd: 'ffprobe -version', parser: out => out.split('\n')[0].replace('ffprobe version ', '').split(' ')[0] },
    { name: 'yt-dlp', cmd: 'yt-dlp --version', parser: out => out.trim() },
    { name: 'PySceneDetect', cmd: 'scenedetect about', parser: out => (out.match(/PySceneDetect [0-9.]*/) || ['PySceneDetect 0.7.3'])[0] },
    { name: 'Auto-Editor', cmd: 'auto-editor --version', parser: out => out.trim() },
    { name: 'Faster-Whisper', cmd: 'python3 -c "import faster_whisper; print(faster_whisper.__version__)"', parser: out => out.trim() },
    { name: 'MoviePy', cmd: 'python3 -c "import moviepy; print(moviepy.__version__)"', parser: out => out.trim() },
    { name: 'MediaInfo', cmd: 'python3 -c "import pymediainfo; print(pymediainfo.__version__)"', parser: out => out.trim() },
    { name: 'OpenCV Headless', cmd: 'python3 -c "import cv2; print(cv2.__version__)"', parser: out => out.trim() }
  ];

  const results = [];
  let pending = tools.length;

  tools.forEach(tool => {
    exec(tool.cmd, (err, stdout) => {
      if (err) {
        results.push({ name: tool.name, installed: false, version: 'Not found' });
      } else {
        results.push({ name: tool.name, installed: true, version: tool.parser(stdout) });
      }
      pending--;
      if (pending === 0) {
        res.json({
          status: 'ok',
          system: 'Debian Linux (Antigravity Environment)',
          node: process.version,
          tools: results
        });
      }
    });
  });
});

// 2. Create Sample Video Endpoint
app.get('/api/create-sample', async (req, res) => {
  const samplePath = path.join(OUTPUT_DIR, 'sample_demo.mp4');
  try {
    if (!fs.existsSync(samplePath)) {
      await runCmd('ffmpeg', [
        '-y',
        '-f', 'lavfi', '-i', 'testsrc=duration=15:size=1280x720:rate=30',
        '-f', 'lavfi', '-i', 'sine=frequency=440:duration=15',
        '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
        '-c:a', 'aac',
        samplePath
      ]);
    }
    res.json({ success: true, url: '/output/sample_demo.mp4', filename: 'sample_demo.mp4' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create sample video', details: err.stderr || err });
  }
});

// 3. Clip / Trim Endpoint
app.post('/api/clip', upload.single('video'), async (req, res) => {
  try {
    const { start, end, reencode, sample } = req.body;
    let inputPath = req.file ? req.file.path : null;

    if (!inputPath && sample) {
      inputPath = path.join(OUTPUT_DIR, 'sample_demo.mp4');
      if (!fs.existsSync(inputPath)) {
        await runCmd('ffmpeg', [
          '-y', '-f', 'lavfi', '-i', 'testsrc=duration=15:size=1280x720:rate=30',
          '-f', 'lavfi', '-i', 'sine=frequency=440:duration=15',
          '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', inputPath
        ]);
      }
    }

    if (!inputPath || !fs.existsSync(inputPath)) {
      return res.status(400).json({ error: 'No video provided.' });
    }

    const outName = `clip_${Date.now()}.mp4`;
    const outPath = path.join(OUTPUT_DIR, outName);

    const isReencode = reencode === 'true' || reencode === true;
    const vclipBin = path.join(__dirname, '../bin/vclip');

    const args = [inputPath, `"${start || '00:00:00'}"`, `"${end || '00:00:10'}"`, outPath];
    if (isReencode) args.push('--reencode');

    await runCmd(vclipBin, args);

    res.json({
      success: true,
      url: `/output/${outName}`,
      filename: outName,
      size: (fs.statSync(outPath).size / (1024 * 1024)).toFixed(2) + ' MB'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to trim video', details: err.stderr || err.message });
  }
});

// 4. Download Clip from URL (yt-dlp)
app.post('/api/download-url', async (req, res) => {
  try {
    const { url, start, end, format } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    const outName = `ytdl_${Date.now()}.mp4`;
    const outPath = path.join(OUTPUT_DIR, outName);
    const vdlBin = path.join(__dirname, '../bin/vdl');

    const s = start || '00:00:00';
    const e = end || '00:00:30';

    await runCmd(vdlBin, [`"${url}"`, `"${s}"`, `"${e}"`, `"${outPath}"`]);

    res.json({
      success: true,
      url: `/output/${outName}`,
      filename: outName,
      size: (fs.statSync(outPath).size / (1024 * 1024)).toFixed(2) + ' MB'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to download clip from URL', details: err.stderr || err.message });
  }
});

// 5. Convert to 9:16 Short / Reel
app.post('/api/to-short', upload.single('video'), async (req, res) => {
  try {
    const { style, sample } = req.body;
    let inputPath = req.file ? req.file.path : null;

    if (!inputPath && sample) {
      inputPath = path.join(OUTPUT_DIR, 'sample_demo.mp4');
    }

    if (!inputPath || !fs.existsSync(inputPath)) {
      return res.status(400).json({ error: 'No video provided.' });
    }

    const outName = `short_${Date.now()}.mp4`;
    const outPath = path.join(OUTPUT_DIR, outName);
    const vshortBin = path.join(__dirname, '../bin/vshort');

    await runCmd(vshortBin, [inputPath, outPath, '--style', style || 'blur']);

    res.json({
      success: true,
      url: `/output/${outName}`,
      filename: outName,
      size: (fs.statSync(outPath).size / (1024 * 1024)).toFixed(2) + ' MB'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create 9:16 short', details: err.stderr || err.message });
  }
});

// 6. Cut Silence Endpoint
app.post('/api/cut-silence', upload.single('video'), async (req, res) => {
  try {
    const { threshold, margin, sample } = req.body;
    let inputPath = req.file ? req.file.path : null;

    if (!inputPath && sample) {
      inputPath = path.join(OUTPUT_DIR, 'sample_demo.mp4');
    }

    if (!inputPath || !fs.existsSync(inputPath)) {
      return res.status(400).json({ error: 'No video provided.' });
    }

    const outName = `silence_cut_${Date.now()}.mp4`;
    const outPath = path.join(OUTPUT_DIR, outName);
    const vsilenceBin = path.join(__dirname, '../bin/vsilence');

    await runCmd(vsilenceBin, [
      inputPath,
      outPath,
      '--threshold', threshold || '4%',
      '--margin', margin || '0.1s'
    ]);

    res.json({
      success: true,
      url: `/output/${outName}`,
      filename: outName,
      size: (fs.statSync(outPath).size / (1024 * 1024)).toFixed(2) + ' MB'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to cut silence', details: err.stderr || err.message });
  }
});

// 7. Detect Scenes Endpoint
app.post('/api/detect-scenes', upload.single('video'), async (req, res) => {
  try {
    const { threshold, sample } = req.body;
    let inputPath = req.file ? req.file.path : null;

    if (!inputPath && sample) {
      inputPath = path.join(OUTPUT_DIR, 'sample_demo.mp4');
    }

    if (!inputPath || !fs.existsSync(inputPath)) {
      return res.status(400).json({ error: 'No video provided.' });
    }

    const sceneDirName = `scenes_${Date.now()}`;
    const sceneDirPath = path.join(OUTPUT_DIR, sceneDirName);
    const vscenesBin = path.join(__dirname, '../bin/vscenes');

    await runCmd(vscenesBin, [
      inputPath,
      sceneDirPath,
      '--threshold', threshold || '27.0'
    ]);

    const files = fs.readdirSync(sceneDirPath)
      .filter(f => f.endsWith('.mp4') || f.endsWith('.csv'))
      .map(f => ({ name: f, url: `/output/${sceneDirName}/${f}` }));

    res.json({
      success: true,
      directory: sceneDirName,
      files
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Scene detection failed', details: err.stderr || err.message });
  }
});

// 8. Transcribe / Subtitle Endpoint
app.post('/api/transcribe', upload.single('video'), async (req, res) => {
  try {
    const { model, burn, sample } = req.body;
    let inputPath = req.file ? req.file.path : null;

    if (!inputPath && sample) {
      inputPath = path.join(OUTPUT_DIR, 'sample_demo.mp4');
    }

    if (!inputPath || !fs.existsSync(inputPath)) {
      return res.status(400).json({ error: 'No video provided.' });
    }

    const outSubName = `sub_${Date.now()}.srt`;
    const outSubPath = path.join(OUTPUT_DIR, outSubName);
    const vsubBin = path.join(__dirname, '../bin/vsub');

    const args = [inputPath, '-o', outSubPath, '-m', model || 'tiny'];
    if (burn === 'true' || burn === true) args.push('--burn');

    await runCmd(vsubBin, args);

    let content = '';
    if (fs.existsSync(outSubPath)) {
      content = fs.readFileSync(outSubPath, 'utf8');
    }

    res.json({
      success: true,
      subUrl: `/output/${outSubName}`,
      filename: outSubName,
      srtPreview: content.slice(0, 500)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Transcription failed', details: err.stderr || err.message });
  }
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎬 Video Clipping Studio Web Server running at http://0.0.0.0:${PORT}`);
});
