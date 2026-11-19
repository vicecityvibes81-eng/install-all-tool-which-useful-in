# 🎬 Universal Video Clipping Tools Suite & Web Studio

> **The ultimate all-in-one toolkit for video trimming, social clipping, YouTube/Twitch downloads, 9:16 viral shorts, auto-silence removal, scene detection, and AI subtitle generation.**

[![Live Web Studio](https://img.shields.io/badge/Live%20Web%20Studio-Preview%20Online-blue?style=for-the-badge&logo=googlechrome)](https://antigravity.luch.dev/site/f286dfcb-87c3-4fff-ba59-33916aa536c3/b1ea12186e8052c20316c7a3/)
[![FFmpeg](https://img.shields.io/badge/FFmpeg-7.0.2-green?style=for-the-badge&logo=ffmpeg)](https://ffmpeg.org)
[![yt-dlp](https://img.shields.io/badge/yt--dlp-2026.10-red?style=for-the-badge&logo=youtube)](https://github.com/yt-dlp/yt-dlp)
[![PySceneDetect](https://img.shields.io/badge/PySceneDetect-0.7.3-orange?style=for-the-badge)](https://scenedetect.com)
[![Whisper](https://img.shields.io/badge/Faster--Whisper-1.2.1-purple?style=for-the-badge&logo=openai)](https://github.com/SYSTRAN/faster-whisper)

---

## ⚡ Live Web Studio Interface

Open the interactive Web Studio in your browser on mobile or desktop:
👉 **[Launch Video Clipping Studio](https://antigravity.luch.dev/site/f286dfcb-87c3-4fff-ba59-33916aa536c3/b1ea12186e8052c20316c7a3/)**

- **Interactive Precision Trimmer**: Mark In `[` and Mark Out `]` on the seekable video timeline for instant 0-second lossless cuts.
- **URL Clip Downloader**: Download only the exact timestamp clip directly from YouTube, Twitch, TikTok, or Twitter.
- **9:16 Shorts/Reels Generator**: Turn landscape 16:9 videos into 9:16 vertical format with blurred background stack or smart crop.
- **Auto Silence Remover**: Automatically eliminate pauses and dead air with Auto-Editor.
- **Visual Scene Splitter**: Detect shot changes and export segmented clips.
- **Speech-to-Text Transcriber**: Generate word-accurate SRT subtitles or burn captions onto video.

---

## 🧰 Installed Tools & Architecture

| Tool | Category | Installed Version | Primary Role in Video Clipping |
|---|---|---|---|
| **FFmpeg** | Core Video Engine | `v7.0.2 Static` | Lossless cutting (`-c copy`), transcoding, filtering, audio sync |
| **FFprobe** | Inspector | `v7.0.2 Static` | Extracting exact duration, bitrates, keyframe timecodes, audio channels |
| **yt-dlp** | Stream Downloader | `v2026.10.26` | Downloading specific timestamp clips directly with `--download-sections` |
| **PySceneDetect** | Scene Segmentation | `v0.7.3` | Automatic visual scene cut detection and batch clip chopping |
| **Auto-Editor** | Pacing & Audio Cut | `v23.32.1` | Acoustic voice activity detection; cuts dead space and silences |
| **Faster-Whisper** | AI Subtitles | `v1.2.1` | High-speed CTranslate2 speech-to-text; produces SRT/VTT subtitles |
| **MoviePy** | Python Editing | `v2.1.2` | Programmatic clip compositing, effects, audio mixing |
| **MediaInfo** | Technical Metadata | `v7.0.1` | Deep inspection of audio/video container streams |
| **OpenCV Headless** | Computer Vision | `v5.1.0` | Frame extraction, visual analysis, image transformations |

---

## 🚀 1-Step Installation Guide

### Linux (Debian, Ubuntu, Arch, Fedora)
```bash
git clone https://github.com/vicecityvibes81-eng/install-all-tool-which-useful-in.git
cd install-all-tool-which-useful-in
bash scripts/install.sh
```

### macOS (Homebrew)
```bash
git clone https://github.com/vicecityvibes81-eng/install-all-tool-which-useful-in.git
cd install-all-tool-which-useful-in
bash scripts/install-mac.sh
```

### Windows (PowerShell / Command Prompt)
```cmd
git clone https://github.com/vicecityvibes81-eng/install-all-tool-which-useful-in.git
cd install-all-tool-which-useful-in
scripts\install-windows.bat
```

### Docker
```bash
docker compose up -d
# Studio is live at http://localhost:3000
```

---

## 🛠️ Antigravity CLI Helper Tools

Custom shortcuts installed directly into your shell `$PATH`:

### 1. `vclip` (or `clip`) — Instant Video Trimmer
Trim videos instantly using stream copy (lossless, 0-second render) or re-encode:
```bash
# Lossless cut (default, takes ~0.1 seconds)
vclip input.mp4 00:01:20 00:01:50 highlight.mp4

# Precise seconds syntax
vclip input.mp4 15 45 clip.mp4

# Re-encode for frame-accurate cuts at exact I/P/B frames
vclip input.mp4 00:02:00 00:03:00 clip.mp4 --reencode --crf 18
```

### 2. `vdl` (or `download-clip`) — Direct URL Timestamp Clipper
Download only the desired clip from YouTube, Twitch, TikTok, etc.:
```bash
# Download 30-second clip directly from YouTube
vdl "https://www.youtube.com/watch?v=dQw4w9WgXcQ" 00:00:15 00:00:45 rick_clip.mp4

# Twitch stream clip
vdl "https://www.twitch.tv/videos/123456789" 01:10:00 01:12:00 twitch_clip.mp4
```

### 3. `vshort` (or `make-short`) — 9:16 Vertical Short Generator
Converts horizontal 16:9 clips into vertical 9:16 (1080x1920) for YouTube Shorts, Reels, and TikTok:
```bash
# Blurred background stack (standard social media look)
vshort clip.mp4 viral_short.mp4 --style blur

# Center crop
vshort clip.mp4 viral_short.mp4 --style crop

# Letterbox fit
vshort clip.mp4 viral_short.mp4 --style fit
```

### 4. `vsilence` (or `cut-silence`) — Auto Silence Remover
Automatically cuts out silent pauses and dead air:
```bash
# Standard 4% threshold
vsilence interview.mp4 tight_interview.mp4

# Aggressive 8% threshold for fast pacing
vsilence podcast.mp4 tight_podcast.mp4 --threshold 8%
```

### 5. `vscenes` (or `split-scenes`) — Scene Cut Detector
Detect visual transitions and split into separate scene clips:
```bash
vscenes gameplay.mp4 ./output_scenes/ --threshold 27
```

### 6. `vsub` (or `sub-clip`) — AI Subtitle Generator (Whisper)
Generate word-level `.srt` subtitles or burn captions directly into the video:
```bash
# Output .srt subtitle file
vsub clip.mp4

# Burn subtitles directly into video
vsub clip.mp4 --burn
```

### 7. `vinfo` (or `video-info`) — Clean Media Inspector
```bash
vinfo input.mp4
```

---

## 🔍 Self-Diagnostic Verification

Run the built-in diagnostic test anytime to check tool status:
```bash
bash scripts/verify-tools.sh
```

---

## 🌐 Running the Web Studio Locally

```bash
npm start
# Visit http://localhost:3000
```
