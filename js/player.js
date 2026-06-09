/* ============================================================
   灵感音域 — 音频播放引擎
   ============================================================ */
const Player = {
  audioCtx: null,
  analyser: null,
  audioEl: null,
  isPlaying: false,
  currentIdx: -1,
  currentTime: 0,
  duration: 0,
  volume: 0.7,
  loopMode: 0,
  shuffle: false,
  playlist: [],

  init() {
    this.volume = App.state.volume;
    this.loopMode = App.state.loopMode;
    this.shuffle = App.state.shuffle;
  },

  async ensureCtx() {
    if (this.audioCtx) {
      if (this.audioCtx.state === 'suspended') await this.audioCtx.resume();
      return;
    }
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.connect(this.audioCtx.destination);
    if (this.audioCtx.state === 'suspended') await this.audioCtx.resume();
  },

  getAudioEl() {
    if (!this.audioEl) {
      this.audioEl = new Audio();
      this.audioEl.addEventListener('timeupdate', () => this.onTimeUpdate());
      this.audioEl.addEventListener('ended', () => this.onEnd());
      this.audioEl.addEventListener('loadedmetadata', () => this.onMeta());
      this.audioEl.addEventListener('error', () => this.onError());
      try {
        this.audioCtx.createMediaElementSource(this.audioEl).connect(this.analyser);
      } catch (e) { /* already connected */ }
    }
    return this.audioEl;
  },

  async play(index) {
    if (index < 0 || index >= this.playlist.length) return;
    this.currentIdx = index;
    const track = this.playlist[index];
    const audio = this.getAudioEl();

    if (!track._cacheUrl) {
      App.toast('准备音频...');
      const url = await this.resolveUrl(track);
      if (!url) { App.toast('无法播放'); return; }
    }

    audio.src = track._cacheUrl;
    audio.volume = this.volume;
    this.isPlaying = true;
    this.currentTime = 0;
    try {
      await audio.play();
      App.renderPlayer();
      App.renderPlaylist();
    } catch (e) {
      this.isPlaying = false;
      App.renderPlayer();
      App.toast('播放失败');
    }
  },

  async resolveUrl(track) {
    if (track.audioBlob) {
      if (!track._cacheUrl) track._cacheUrl = URL.createObjectURL(track.audioBlob);
      return track._cacheUrl;
    }
    if (track.audioUrl) return track.audioUrl;
    if (track.type === 'system_generated' || (!track.audioBlob && !track.audioUrl)) {
      // Check cache
      const cacheKey = `gen_${track.worldKey}_${track.trackIdx}`;
      try {
        const cached = await DB.tracks.get(cacheKey);
        if (cached && cached.audioBlob) {
          track._cacheUrl = URL.createObjectURL(cached.audioBlob);
          return track._cacheUrl;
        }
      } catch (e) { /* not cached */ }
      // Generate
      const blob = await generateMusic(track.worldKey, track.trackIdx);
      track._cacheUrl = URL.createObjectURL(blob);
      try { await DB.tracks.put({ id: cacheKey, type: 'generated_cache', audioBlob: blob, name: track.name, duration: track.dur }); } catch (e) { /* ok */ }
      return track._cacheUrl;
    }
    return null;
  },

  toggle() {
    if (this.playlist.length === 0) { App.toast('歌单为空'); return; }
    if (this.currentIdx < 0) { this.play(0); return; }
    const a = this.audioEl;
    if (!a || !a.src) { this.play(this.currentIdx); return; }
    if (this.isPlaying) { a.pause(); this.isPlaying = false; }
    else { this.ensureCtx(); a.play().then(() => this.isPlaying = true).catch(() => App.toast('播放失败')); }
    App.renderPlayer();
  },

  next() {
    if (this.playlist.length === 0) return;
    const n = this.shuffle ? Math.floor(Math.random() * this.playlist.length) : (this.currentIdx + 1) % this.playlist.length;
    this.play(n);
  },

  prev() {
    if (this.playlist.length === 0) return;
    const p = this.shuffle ? Math.floor(Math.random() * this.playlist.length) : (this.currentIdx - 1 + this.playlist.length) % this.playlist.length;
    this.play(p);
  },

  onTimeUpdate() {
    if (!this.audioEl) return;
    this.currentTime = this.audioEl.currentTime;
    this.duration = this.audioEl.duration || this.playlist[this.currentIdx]?.dur || 0;
    App.renderProgress();
  },

  onEnd() {
    if (this.loopMode === 2) { this.audioEl.currentTime = 0; this.audioEl.play(); }
    else if (this.loopMode === 1 || this.currentIdx < this.playlist.length - 1) this.next();
    else { this.isPlaying = false; App.renderPlayer(); }
  },

  onMeta() {
    if (this.audioEl && this.audioEl.duration && isFinite(this.audioEl.duration)) {
      const t = this.playlist[this.currentIdx];
      if (t) { t.dur = this.audioEl.duration; }
      this.duration = this.audioEl.duration;
      App.renderProgress();
    }
  },

  onError() {
    App.toast('音频加载失败');
    this.isPlaying = false;
    App.renderPlayer();
  },

  stop() {
    if (this.audioEl) { this.audioEl.pause(); this.audioEl.src = ''; }
    this.isPlaying = false;
    this.currentIdx = -1;
    this.currentTime = 0;
  },

  setVolume(v) {
    this.volume = v / 100;
    if (this.audioEl) this.audioEl.volume = this.volume;
  },

  toggleLoop() {
    this.loopMode = (this.loopMode + 1) % 3;
    const labels = ['关闭循环', '列表循环', '单曲循环'];
    App.toast(labels[this.loopMode]);
    App.renderPlayer();
  },

  toggleShuffle() {
    this.shuffle = !this.shuffle;
    App.toast(this.shuffle ? '随机播放已开启' : '顺序播放');
    App.renderPlayer();
  },

  seek(e) {
    if (!this.audioEl || !this.audioEl.src) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    if (this.audioEl.duration && isFinite(this.audioEl.duration)) {
      this.audioEl.currentTime = pct * this.audioEl.duration;
    }
  },
};

// ---- Music Generator ----
// Fallback: 60s silence WAV
function createSilenceWav(secs) {
  const sr = 44100, len = sr * secs;
  const buf = new ArrayBuffer(44 + len * 2);
  const v = new DataView(buf);
  const ws = (v, o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  ws(v, 0, 'RIFF'); v.setUint32(4, 36 + len * 2, true); ws(v, 8, 'WAVE'); ws(v, 12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true);
  v.setUint16(34, 16, true); ws(v, 36, 'data'); v.setUint32(40, len * 2, true);
  return new Blob([buf], { type: 'audio/wav' });
}

async function generateMusic(worldKey, trackIdx) {
  const cat = WORLD_TREE[worldKey];
  if (!cat || !cat.tracks) { console.error('No world:', worldKey); return createSilenceWav(60); }
  const track = cat.tracks[trackIdx];
  if (!track) { console.error('No track:', worldKey, trackIdx); return createSilenceWav(60); }
  const dur = track.dur, sr = 44100;
  const ctx = new OfflineAudioContext(2, sr * dur, sr);
  const p = MUSIC_PROFILES[worldKey] || MUSIC_PROFILES.fantasy;
  const beatLen = 60 / p.bpm;
  const chordLen = beatLen * 4;
  const chordCount = Math.floor(dur / chordLen);

  const master = ctx.createGain(); master.gain.value = 0.6; master.connect(ctx.destination);

  // Pad
  for (let i = 0; i < chordCount; i++) {
    const cr = p.chords[i % p.chords.length];
    const start = i * chordLen, end = Math.min((i + 1) * chordLen + 1, dur);
    cr.forEach((freq, j) => {
      const o = ctx.createOscillator(); o.type = p.wave; o.frequency.value = freq; o.detune.value = (j - 1) * 6;
      const g = ctx.createGain(); g.gain.setValueAtTime(0, start); g.gain.linearRampToValueAtTime(0.04 / cr.length, start + 0.8); g.gain.linearRampToValueAtTime(0, end);
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 400 + j * 200; f.Q.value = 0.3;
      o.connect(f); f.connect(g); g.connect(master); o.start(start); o.stop(end);
    });
  }

  // Bass
  for (let i = 0; i < chordCount; i++) {
    const rootFreq = p.chords[i % p.chords.length][0] / 2;
    const start = i * chordLen;
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = rootFreq;
    const g = ctx.createGain(); g.gain.setValueAtTime(0, start); g.gain.linearRampToValueAtTime(0.06, start + 0.1); g.gain.setValueAtTime(0.06, start + chordLen - 0.3); g.gain.linearRampToValueAtTime(0, start + chordLen);
    o.connect(g); g.connect(master); o.start(start); o.stop(start + chordLen);
  }

  // Melody
  const melodyNotes = 12, noteLen = dur / melodyNotes;
  for (let i = 0; i < melodyNotes; i++) {
    const si = ((i * 3) + trackIdx * 2) % p.scale.length;
    const freq = p.scale[si] * 2;
    const start = i * noteLen, end = start + noteLen * 0.85;
    const o = ctx.createOscillator(); o.type = p.wave === 'sawtooth' ? 'triangle' : p.wave; o.frequency.value = freq;
    const g = ctx.createGain(); g.gain.setValueAtTime(0, start); g.gain.linearRampToValueAtTime(0.025, start + 0.04); g.gain.linearRampToValueAtTime(0, end);
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1200; f.Q.value = 0.6;
    o.connect(f); f.connect(g); g.connect(master); o.start(start); o.stop(end);
  }

  // Percussion
  for (let beat = 0; beat < Math.floor(dur / beatLen); beat++) {
    if (beat % 2 !== 0) continue;
    const start = beat * beatLen;
    const bl = sr * 0.08; const buf = ctx.createBuffer(1, bl, sr); const d = buf.getChannelData(0);
    for (let i = 0; i < bl; i++) { const env = Math.exp(-i / (bl * 0.15)); d[i] = (Math.random() * 2 - 1) * env * 0.5 + Math.sin(i * 0.3) * env * 0.5; }
    const bs = ctx.createBufferSource(); bs.buffer = buf;
    const bg = ctx.createGain(); bg.gain.setValueAtTime(0.12, start); bg.gain.linearRampToValueAtTime(0, start + 0.08);
    bs.connect(bg); bg.connect(master); bs.start(start); bs.stop(start + 0.1);
  }

  // Hi-hat
  const noiseBuf = ctx.createBuffer(1, sr * 0.5, sr); const nd = noiseBuf.getChannelData(0);
  for (let i = 0; i < noiseBuf.length; i++) nd[i] = (Math.random() * 2 - 1) * 0.5;
  for (let beat = 0; beat < Math.floor(dur / beatLen); beat++) {
    const start = beat * beatLen;
    const ns = ctx.createBufferSource(); ns.buffer = noiseBuf;
    const ng = ctx.createGain(); ng.gain.setValueAtTime(0.012, start); ng.gain.linearRampToValueAtTime(0, start + 0.03);
    const fh = ctx.createBiquadFilter(); fh.type = 'highpass'; fh.frequency.value = 6000;
    ns.connect(fh); fh.connect(ng); ng.connect(master); ns.start(start); ns.stop(start + 0.04);
  }

  const rendered = await ctx.startRendering();
  return audioBufferToWav(rendered);
}

function audioBufferToWav(buf) {
  const nc = buf.numberOfChannels, sr = buf.sampleRate, len = buf.length;
  const bps = 2, ba = nc * bps, ds = len * ba, ts = 44 + ds;
  const ab = new ArrayBuffer(ts), v = new DataView(ab);
  const ws = (v, o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  ws(v, 0, 'RIFF'); v.setUint32(4, ts - 8, true); ws(v, 8, 'WAVE'); ws(v, 12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, nc, true);
  v.setUint32(24, sr, true); v.setUint32(28, sr * ba, true); v.setUint16(32, ba, true);
  v.setUint16(34, bps * 8, true); ws(v, 36, 'data'); v.setUint32(40, ds, true);
  let off = 44;
  for (let i = 0; i < len; i++) {
    for (let ch = 0; ch < nc; ch++) {
      const s = Math.max(-1, Math.min(1, buf.getChannelData(ch)[i]));
      v.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      off += 2;
    }
  }
  return new Blob([ab], { type: 'audio/wav' });
}

function fmtTime(s) {
  if (!isFinite(s) || s < 0) return '00:00';
  const m = Math.floor(s / 60);
  return String(m).padStart(2, '0') + ':' + String(Math.floor(s % 60)).padStart(2, '0');
}
