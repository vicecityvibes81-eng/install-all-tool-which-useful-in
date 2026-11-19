document.addEventListener('DOMContentLoaded', () => {
  // Tab switching
  const tabs = document.querySelectorAll('.nav-tab');
  const panes = document.querySelectorAll('.tab-pane');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-tab');
      tabs.forEach(t => t.classList.remove('active'));
      panes.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      const pane = document.getElementById(`tab-${target}`);
      if (pane) pane.classList.add('active');
    });
  });

  // Fetch Tool Status
  async function loadStatus() {
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      const container = document.getElementById('tools-container');
      if (!container) return;

      container.innerHTML = '';
      data.tools.forEach(tool => {
        const card = document.createElement('div');
        card.className = 'tool-card';
        card.innerHTML = `
          <div class="tool-header">
            <span class="tool-name">${tool.name}</span>
            <span class="tool-badge" style="${tool.installed ? '' : 'background: rgba(239, 68, 68, 0.15); color: #ef4444; border-color: rgba(239, 68, 68, 0.3);'}">
              ${tool.installed ? 'Installed' : 'Missing'}
            </span>
          </div>
          <div class="tool-desc">${getToolDescription(tool.name)}</div>
          <div class="tool-meta">Version: ${tool.version}</div>
        `;
        container.appendChild(card);
      });
    } catch (e) {
      console.error('Failed to load status', e);
    }
  }

  function getToolDescription(name) {
    const map = {
      'FFmpeg': 'Industry standard video/audio processing, cutting, and filter pipeline.',
      'FFprobe': 'Media stream metadata inspector and analyzer.',
      'yt-dlp': 'Extract and download video streams and specific time slices directly from URLs.',
      'PySceneDetect': 'Visual change and cut detection to autonomously chop videos into scenes.',
      'Auto-Editor': 'Acoustic voice activity detector that trims dead space and silence.',
      'Faster-Whisper': 'Ultra-fast speech recognition for auto-captions and subtitle generation.',
      'MoviePy': 'Python video editing library for programmatic timeline manipulation.',
      'MediaInfo': 'Technical container and codec analysis engine.',
      'OpenCV Headless': 'Computer vision framework for frame extraction and video transforms.'
    };
    return map[name] || 'Video processing tool.';
  }

  const refreshBtn = document.getElementById('btn-refresh-status');
  if (refreshBtn) refreshBtn.addEventListener('click', loadStatus);
  loadStatus();

  // Helper: Format seconds to HH:MM:SS
  function formatSeconds(sec) {
    const s = Math.floor(sec % 60);
    const m = Math.floor((sec / 60) % 60);
    const h = Math.floor(sec / 3600);
    const ms = Math.floor((sec - Math.floor(sec)) * 1000);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
  }

  // Video Trimmer Preview & Mark In/Out
  const trimmerVideo = document.getElementById('trimmer-video');
  const trimmerFile = document.getElementById('trimmer-file');
  const startInput = document.getElementById('trimmer-start');
  const endInput = document.getElementById('trimmer-end');

  if (trimmerFile) {
    trimmerFile.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const url = URL.createObjectURL(file);
        trimmerVideo.src = url;
        trimmerVideo.load();
      }
    });
  }

  // Load demo sample video into trimmer
  const loadDemoBtn = document.getElementById('btn-load-demo');
  const useSampleTrim = document.getElementById('btn-use-sample-trim');
  async function loadSampleVideo() {
    try {
      const res = await fetch('/api/create-sample');
      const data = await res.json();
      if (data.url) {
        trimmerVideo.src = data.url;
        trimmerVideo.load();
        trimmerFile.value = '';
        alert('🎬 Demo sample video loaded into player!');
      }
    } catch (e) {
      alert('Could not load sample video.');
    }
  }
  if (loadDemoBtn) loadDemoBtn.addEventListener('click', loadSampleVideo);
  if (useSampleTrim) useSampleTrim.addEventListener('click', loadSampleVideo);

  document.getElementById('btn-set-in')?.addEventListener('click', () => {
    if (trimmerVideo) {
      startInput.value = formatSeconds(trimmerVideo.currentTime);
    }
  });

  document.getElementById('btn-set-out')?.addEventListener('click', () => {
    if (trimmerVideo) {
      endInput.value = formatSeconds(trimmerVideo.currentTime);
    }
  });

  // Helper form handler
  function setupForm(formId, submitBtnId, resultBoxId, endpoint, buildFormData, handleSuccess) {
    const form = document.getElementById(formId);
    const submitBtn = document.getElementById(submitBtnId);
    const resultBox = document.getElementById(resultBoxId);

    if (!form || !submitBtn) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const originalHtml = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner"></span> <span>Processing...</span>';
      if (resultBox) resultBox.classList.remove('active');

      try {
        const formData = buildFormData();
        const res = await fetch(endpoint, {
          method: 'POST',
          body: formData instanceof FormData ? formData : JSON.stringify(formData),
          headers: formData instanceof FormData ? {} : { 'Content-Type': 'application/json' }
        });

        const data = await res.json();
        if (!res.ok || data.error) {
          throw new Error(data.error || data.details || 'Operation failed');
        }

        if (resultBox) resultBox.classList.add('active');
        handleSuccess(data);
      } catch (err) {
        alert('Error: ' + err.message);
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalHtml;
      }
    });
  }

  // 1. Trimmer form
  setupForm(
    'form-trimmer',
    'btn-submit-trim',
    'trimmer-result',
    '/api/clip',
    () => {
      const fd = new FormData();
      const file = trimmerFile.files[0];
      if (file) {
        fd.append('video', file);
      } else {
        fd.append('sample', 'true');
      }
      fd.append('start', startInput.value);
      fd.append('end', endInput.value);
      fd.append('reencode', document.getElementById('trimmer-mode').value === 'reencode');
      return fd;
    },
    (data) => {
      const vid = document.getElementById('trimmer-result-video');
      const info = document.getElementById('trimmer-result-info');
      const dl = document.getElementById('trimmer-download');
      vid.src = data.url;
      vid.load();
      info.textContent = `Clip: ${data.filename} (${data.size})`;
      dl.href = data.url;
    }
  );

  // 2. URL Clipper
  setupForm(
    'form-ytdl',
    'btn-submit-ytdl',
    'ytdl-result',
    '/api/download-url',
    () => ({
      url: document.getElementById('ytdl-url').value,
      start: document.getElementById('ytdl-start').value,
      end: document.getElementById('ytdl-end').value,
      format: document.getElementById('ytdl-format').value
    }),
    (data) => {
      const vid = document.getElementById('ytdl-result-video');
      const info = document.getElementById('ytdl-result-info');
      const dl = document.getElementById('ytdl-download');
      vid.src = data.url;
      vid.load();
      info.textContent = `Downloaded: ${data.filename} (${data.size})`;
      dl.href = data.url;
    }
  );

  // 3. 9:16 Shorts
  document.getElementById('btn-use-sample-short')?.addEventListener('click', () => {
    alert('Will use demo sample video for 9:16 short creation.');
  });
  setupForm(
    'form-shorts',
    'btn-submit-shorts',
    'shorts-result',
    '/api/to-short',
    () => {
      const fd = new FormData();
      const file = document.getElementById('shorts-file').files[0];
      if (file) fd.append('video', file);
      else fd.append('sample', 'true');
      fd.append('style', document.getElementById('shorts-style').value);
      return fd;
    },
    (data) => {
      const vid = document.getElementById('shorts-result-video');
      const info = document.getElementById('shorts-result-info');
      const dl = document.getElementById('shorts-download');
      vid.src = data.url;
      vid.load();
      info.textContent = `Vertical 9:16 Short: ${data.filename} (${data.size})`;
      dl.href = data.url;
    }
  );

  // 4. Silence Cutter
  document.getElementById('btn-use-sample-silence')?.addEventListener('click', () => {
    alert('Will use demo sample video.');
  });
  setupForm(
    'form-silence',
    'btn-submit-silence',
    'silence-result',
    '/api/cut-silence',
    () => {
      const fd = new FormData();
      const file = document.getElementById('silence-file').files[0];
      if (file) fd.append('video', file);
      else fd.append('sample', 'true');
      fd.append('threshold', document.getElementById('silence-threshold').value);
      fd.append('margin', document.getElementById('silence-margin').value);
      return fd;
    },
    (data) => {
      const vid = document.getElementById('silence-result-video');
      const info = document.getElementById('silence-result-info');
      const dl = document.getElementById('silence-download');
      vid.src = data.url;
      vid.load();
      info.textContent = `Tight Cut: ${data.filename} (${data.size})`;
      dl.href = data.url;
    }
  );

  // 5. Scene Detector
  document.getElementById('btn-use-sample-scenes')?.addEventListener('click', () => {
    alert('Will use demo sample video.');
  });
  setupForm(
    'form-scenes',
    'btn-submit-scenes',
    'scenes-result',
    '/api/detect-scenes',
    () => {
      const fd = new FormData();
      const file = document.getElementById('scenes-file').files[0];
      if (file) fd.append('video', file);
      else fd.append('sample', 'true');
      fd.append('threshold', document.getElementById('scenes-threshold').value);
      return fd;
    },
    (data) => {
      const list = document.getElementById('scenes-list');
      list.innerHTML = '';
      if (!data.files || data.files.length === 0) {
        list.innerHTML = '<p>No scene splits detected with current threshold.</p>';
        return;
      }
      data.files.forEach(f => {
        const item = document.createElement('div');
        item.style.padding = '0.5rem 0';
        item.innerHTML = `<a href="${f.url}" download class="btn btn-secondary btn-sm">⬇️ Download ${f.name}</a>`;
        list.appendChild(item);
      });
    }
  );

  // 6. Subtitles & Whisper
  document.getElementById('btn-use-sample-whisper')?.addEventListener('click', () => {
    alert('Will use demo sample video.');
  });
  setupForm(
    'form-whisper',
    'btn-submit-whisper',
    'whisper-result',
    '/api/transcribe',
    () => {
      const fd = new FormData();
      const file = document.getElementById('whisper-file').files[0];
      if (file) fd.append('video', file);
      else fd.append('sample', 'true');
      fd.append('model', document.getElementById('whisper-model').value);
      fd.append('burn', document.getElementById('whisper-burn').value);
      return fd;
    },
    (data) => {
      const preview = document.getElementById('whisper-srt-preview');
      const dl = document.getElementById('whisper-download');
      preview.textContent = data.srtPreview || 'Transcription produced.';
      dl.href = data.subUrl;
    }
  );

});
