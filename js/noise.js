/* ============================================================
   灵感音域 — 白噪音引擎（HTML Audio 播放）
   ============================================================ */
const NoiseEngine = {
  masterGain: null,
  masterVol: 0.6,
  noises: {},

  ensureReady() {
    if (!Player.audioCtx) {
      Player.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      Player.analyser = Player.audioCtx.createAnalyser();
      Player.analyser.fftSize = 256;
      Player.analyser.connect(Player.audioCtx.destination);
    }
    if (Player.audioCtx.state === 'suspended') {
      Player.audioCtx.resume();
    }
  },

  toggle(id) {
    this.ensureReady();
    if (this.noises[id]?.playing) {
      this.stop(id);
    } else {
      this.start(id);
    }
    App.renderNoise();
  },

  start(id) {
    const cfg = NOISE_TYPES.find(n => n.id === id);
    if (!cfg || !cfg.file) return;
    this.ensureReady();
    this.stop(id);
    const a = new Audio();
    a.loop = true;
    a.volume = (this.noises[id]?.volume || 0.4) * this.masterVol;
    a.src = encodeURI(cfg.file);
    a.play().catch(err => {
      console.error('Noise play failed:', id, err);
      App.toast('加载失败: ' + cfg.name);
    });
    this.noises[id] = { audio: a, playing: true, volume: a.volume / (this.masterVol || 0.6) };
    App.renderNoise();
  },

  stop(id) {
    const n = this.noises[id]; if (!n) return;
    try { n.audio.pause(); n.audio.src = ''; } catch (e) {}
    this.noises[id] = { playing: false, volume: n.volume };
  },

  setVol(id, vol) {
    if (!this.noises[id]) this.noises[id] = {};
    this.noises[id].volume = vol;
    if (this.noises[id].audio) this.noises[id].audio.volume = vol * this.masterVol;
  },

  setMasterVol(v) {
    this.masterVol = v / 100;
    for (const [id, n] of Object.entries(this.noises)) {
      if (n.audio) n.audio.volume = (n.volume || 0.4) * this.masterVol;
    }
  },

  async applyPreset(key) {
    const preset = NOISE_PRESETS[key]; if (!preset) return;
    this.ensureReady();
    Object.keys(this.noises).forEach(id => this.stop(id));
    for (const [id, vol] of Object.entries(preset.noises)) {
      this.noises[id] = { playing: false, volume: vol };
      this.start(id);
    }
    App.renderNoise();
  },
};