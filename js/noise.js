/* ============================================================
   灵感音域 — 白噪音引擎
   修复：AudioContext 在用户点击时同步创建/恢复
   ============================================================ */
const NoiseEngine = {
  masterGain: null,
  masterVol: 0.6,
  noises: {},

  /** 确保 AudioContext 已激活 — 必须在用户手势中调用 */
  ensureReady() {
    if (!Player.audioCtx) {
      Player.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      Player.analyser = Player.audioCtx.createAnalyser();
      Player.analyser.fftSize = 256;
      Player.analyser.connect(Player.audioCtx.destination);
    }
    if (Player.audioCtx.state === 'suspended') {
      Player.audioCtx.resume(); // 不 await，同步触发即可
    }
    if (!this.masterGain) {
      this.masterGain = Player.audioCtx.createGain();
      this.masterGain.gain.value = this.masterVol;
      this.masterGain.connect(Player.audioCtx.destination);
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
    const ctx = Player.audioCtx;
    const buf = createNoiseBuffer(id, ctx);
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    const gain = ctx.createGain(); gain.gain.value = this.noises[id]?.volume || 0.4;
    src.connect(gain); gain.connect(this.masterGain);
    src.start(0);
    this.noises[id] = { source: src, gain, playing: true, volume: gain.gain.value };
  },

  stop(id) {
    const n = this.noises[id]; if (!n) return;
    try { n.source.stop(); n.gain.disconnect(); } catch (e) { /* ok */ }
    this.noises[id] = { playing: false, volume: n.volume };
  },

  setVol(id, vol) {
    if (!this.noises[id]) this.noises[id] = {};
    this.noises[id].volume = vol;
    if (this.noises[id].gain) this.noises[id].gain.gain.value = vol;
  },

  setMasterVol(v) {
    this.masterVol = v / 100;
    if (this.masterGain) this.masterGain.gain.value = this.masterVol;
  },

  applyPreset(key) {
    const preset = NOISE_PRESETS[key]; if (!preset) return;
    this.ensureReady();
    Object.keys(this.noises).forEach(id => this.stop(id));
    for (const [id, vol] of Object.entries(preset.noises)) {
      const ctx = Player.audioCtx;
      const buf = createNoiseBuffer(id, ctx);
      const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
      const gain = ctx.createGain(); gain.gain.value = vol;
      src.connect(gain); gain.connect(this.masterGain);
      src.start(0);
      this.noises[id] = { source: src, gain, playing: true, volume: vol };
    }
    App.renderNoise();
  },
};

function createNoiseBuffer(type, ctx) {
  const len = ctx.sampleRate * 4;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);

  switch (type) {
    case 'rain_light':   for (let i = 0; i < len; i++) { let s = Math.random() * 2 - 1; s = (s + (i > 0 ? d[i - 1] : 0) * 0.4) / 1.4; d[i] = Math.max(-1, Math.min(1, s * 0.7)); } break;
    case 'rain_thunder': for (let i = 0; i < len; i++) { let s = Math.random() * 2 - 1; s = (s + (i > 0 ? d[i - 1] : 0) * 0.3) / 1.3; if (Math.random() < 0.0002) s += Math.random() * 3 * (Math.random() > 0.5 ? 1 : -1); d[i] = Math.max(-1, Math.min(1, s * 0.8)); } break;
    case 'wind_gentle':  for (let i = 0; i < len; i++) { let s = Math.random() * 2 - 1; s = (s + (i > 0 ? d[i - 1] : 0) * 0.75) / 1.75; s *= 0.5 + 0.5 * Math.sin(i * 0.0003); d[i] = Math.max(-1, Math.min(1, s * 0.5)); } break;
    case 'wind_storm':   for (let i = 0; i < len; i++) { let s = Math.random() * 2 - 1; s = (s + (i > 0 ? d[i - 1] : 0) * 0.85) / 1.85; s *= 0.5 + 0.5 * Math.sin(i * 0.0005); d[i] = Math.max(-1, Math.min(1, s)); } break;
    case 'snow':         for (let i = 0; i < len; i++) { let s = Math.random() * 2 - 1; s = (s + (i > 0 ? d[i - 1] : 0) * 0.8) / 1.8; s *= 0.4 + 0.6 * Math.sin(i * 0.0002); d[i] = Math.max(-1, Math.min(1, s * 0.4)); } break;
    case 'fire':         for (let i = 0; i < len; i++) { let s = Math.random() * 2 - 1; if (Math.random() < 0.08) s += (Math.random() * 2 - 1) * 1.5; s = (s + (i > 0 ? d[i - 1] : 0) * 0.2) / 1.2; d[i] = Math.max(-1, Math.min(1, s * 0.6)); } break;
    case 'stream':       for (let i = 0; i < len; i++) { let s = Math.random() * 2 - 1; s = (s + (i > 0 ? d[i - 1] : 0) * 0.5) / 1.5; s *= 0.6 + 0.4 * Math.sin(i * 0.001); d[i] = Math.max(-1, Math.min(1, s * 0.5)); } break;
    case 'ocean':        for (let i = 0; i < len; i++) { let s = Math.random() * 2 - 1; s = (s + (i > 0 ? d[i - 1] : 0) * 0.7) / 1.7; s *= 0.3 + 0.7 * Math.abs(Math.sin(i * 0.0001)); d[i] = Math.max(-1, Math.min(1, s * 0.6)); } break;
    case 'forest':       for (let i = 0; i < len; i++) { let s = Math.random() * 2 - 1; if (Math.random() < 0.015) s += Math.sin(i * 0.05 + Math.random()) * 0.8; s = (s + (i > 0 ? d[i - 1] : 0) * 0.5) / 1.5; d[i] = Math.max(-1, Math.min(1, s * 0.5)); } break;
    case 'magic':        for (let i = 0; i < len; i++) { let s = Math.random() * 2 - 1; s = (s + (i > 0 ? d[i - 1] : 0) * 0.15) / 1.15; s *= 0.4 + 0.6 * Math.sin(i * 0.008); d[i] = Math.max(-1, Math.min(1, s * 0.4)); } break;
    case 'city':         for (let i = 0; i < len; i++) { let s = Math.random() * 2 - 1; s = (s + (i > 0 ? d[i - 1] : 0) * 0.55) / 1.55; if (Math.random() < 0.002) s += (Math.random() * 2 - 1) * 0.7; d[i] = Math.max(-1, Math.min(1, s * 0.4)); } break;
    case 'cafe':         for (let i = 0; i < len; i++) { let s = Math.random() * 2 - 1; s = (s + (i > 0 ? d[i - 1] : 0) * 0.45) / 1.45; if (Math.random() < 0.003) s += (Math.random() * 2 - 1) * 0.6; d[i] = Math.max(-1, Math.min(1, s * 0.35)); } break;
    case 'keyboard':     for (let i = 0; i < len; i++) { let s = 0; if (Math.random() < 0.025) s = (Math.random() * 2 - 1) * 0.6; d[i] = Math.max(-1, Math.min(1, s)); } break;
    case 'clock':        for (let i = 0; i < len; i++) { let s = 0; const beat = ctx.sampleRate; const pos = i % beat; if (pos < 15) s = 0.8 * (1 - pos / 15); else if (Math.abs(pos - beat / 2) < 10) s = 0.3 * (1 - Math.abs(pos - beat / 2) / 10); d[i] = Math.max(-1, Math.min(1, s)); } break;
    case 'vinyl':        for (let i = 0; i < len; i++) { let s = Math.random() * 2 - 1; if (Math.random() < 0.02) s += (Math.random() * 2 - 1) * 0.5; s = (s + (i > 0 ? d[i - 1] : 0) * 0.1) / 1.1; d[i] = Math.max(-1, Math.min(1, s * 0.3)); } break;
    default: for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * 0.3;
  }
  return buf;
}
