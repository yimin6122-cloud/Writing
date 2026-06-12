/* ============================================================
   灵感音域 — 音频播放引擎（Web Audio + HTML Audio 双通道）
   优先 decodeAudioData，失败时回退 HTML Audio 元素
   ============================================================ */
const Player = {
  audioCtx: null,
  analyser: null,
  gainNode: null,
  isPlaying: false,
  currentIdx: -1,
  currentTime: 0,
  duration: 0,
  volume: 0.7,
  loopMode: 0,
  shuffle: false,
  playlist: [],

  // Web Audio mode
  _source: null,
  _startTime: 0,
  _startOffset: 0,
  _animFrame: null,

  // HTML Audio fallback
  _audioEl: null,
  _audioMode: false,

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
    this.gainNode = this.audioCtx.createGain();
    this.gainNode.gain.value = this.volume;
    this.analyser.connect(this.gainNode);
    this.gainNode.connect(this.audioCtx.destination);
    if (this.audioCtx.state === 'suspended') await this.audioCtx.resume();
  },

  _stopSource() {
    if (this._source) {
      try { this._source.stop(); } catch (e) {}
      this._source.disconnect();
      this._source = null;
    }
    if (this._animFrame) {
      cancelAnimationFrame(this._animFrame);
      this._animFrame = null;
    }
  },

  _stopAudioEl() {
    if (this._audioEl) {
      this._audioEl.pause();
      this._audioEl.src = '';
      this._audioEl = null;
    }
    if (this._animFrame) {
      cancelAnimationFrame(this._animFrame);
      this._animFrame = null;
    }
  },

  _stopAll() {
    this._stopSource();
    this._stopAudioEl();
    this._audioMode = false;
  },

  _startTimeUpdateLoop() {
    if (this._animFrame) cancelAnimationFrame(this._animFrame);
    const tick = () => {
      if (!this.isPlaying) return;
      if (this._audioMode) {
        if (this._audioEl) {
          this.currentTime = this._audioEl.currentTime;
          this.duration = this._audioEl.duration || this.playlist[this.currentIdx]?.dur || 0;
          App.renderProgress();
        }
      } else {
        this.currentTime = this._startOffset + (this.audioCtx.currentTime - this._startTime);
        if (this.currentTime >= this.duration) this.currentTime = this.duration;
        App.renderProgress();
      }
      this._animFrame = requestAnimationFrame(tick);
    };
    this._animFrame = requestAnimationFrame(tick);
  },

  async play(index) {
    if (index < 0 || index >= this.playlist.length) return;
    this._stopAll();
    this.currentIdx = index;
    const track = this.playlist[index];

    if (!track._buffer && !track._cacheUrl) {
      App.toast('准备音频...');
      try {
        await this.resolveUrl(track);
      } catch (e) {
        console.error('resolveUrl failed:', e);
        App.toast('音频准备失败');
        return;
      }
    }

    if (track._buffer) {
      await this.ensureCtx();
      this._audioMode = false;
      this.duration = track._buffer.duration;
      this._startOffset = 0;
      this.currentTime = 0;
      this.isPlaying = true;
      this._playBuffer(track._buffer, 0);
    } else if (track._cacheUrl) {
      this._audioMode = true;
      this.isPlaying = true;
      this.currentTime = 0;
      this._playAudioEl(track._cacheUrl);
    } else {
      App.toast('无法播放：无可用的音频数据');
      return;
    }

    App.renderPlayer();
    App.renderPlaylist();
  },

  _playBuffer(buffer, offset) {
    const source = this.audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.analyser);

    this._source = source;
    this._startTime = this.audioCtx.currentTime;
    this._startOffset = offset;

    source.onended = () => {
      if (this._source === source) {
        this._source = null;
        this.onEnd();
      }
    };

    source.start(0, offset);
    this._startTimeUpdateLoop();
  },

  _playAudioEl(url) {
    const a = new Audio();
    a.preload = 'auto';
    a.volume = this.volume;
    a.src = url;

    a.addEventListener('loadedmetadata', () => {
      this.duration = a.duration || 0;
      App.renderProgress();
    });

    a.addEventListener('timeupdate', () => {
      if (!this._audioMode || this._audioEl !== a) return;
      App.renderProgress();
    });

    a.addEventListener('ended', () => {
      if (this._audioEl !== a) return;
      this._audioEl = null;
      this._audioMode = false;
      this.onEnd();
    });

    a.addEventListener('error', (e) => {
      console.error('Audio fallback error:', a.error?.code, a.error?.message);
      if (this._audioEl === a) {
        this._audioEl = null;
        this._audioMode = false;
        this.isPlaying = false;
        const codes = { 1:'加载中断', 2:'网络错误', 3:'解码失败', 4:'格式不支持' };
        App.toast('播放失败：' + (codes[a.error?.code] || '未知错误'));
        App.renderPlayer();
      }
    });

    this._audioEl = a;
    a.play().catch(err => {
      console.error('Audio play failed:', err);
      if (this._audioEl === a) {
        this._audioEl = null;
        this._audioMode = false;
        this.isPlaying = false;
        App.toast('播放失败');
        App.renderPlayer();
      }
    });
    this._startTimeUpdateLoop();
  },

  async resolveUrl(track) {
    if (track.audioBlob) {
      if (!track._buffer && !track._cacheUrl) {
        await this.ensureCtx();
        try {
          const buf = await track.audioBlob.arrayBuffer();
          track._buffer = await this.audioCtx.decodeAudioData(buf);
          return;
        } catch (e) {
          console.warn('decodeAudioData failed, using Audio element fallback:', e.message);
        }
        const ext = (track.name || '').split('.').pop()?.toLowerCase();
        const mimeMap = { mp3:'audio/mpeg', wav:'audio/wav', ogg:'audio/ogg', flac:'audio/flac', aac:'audio/aac', m4a:'audio/mp4', opus:'audio/opus', weba:'audio/webm' };
        const type = mimeMap[ext] || 'audio/mpeg';
        const blob = new Blob([track.audioBlob], { type });
        track._cacheUrl = URL.createObjectURL(blob);
      }
      return;
    }
    if (track.audioUrl) {
      if (!track._buffer && !track._cacheUrl) {
        await this.ensureCtx();
        try {
          const resp = await fetch(track.audioUrl);
          if (!resp.ok) throw new Error('HTTP ' + resp.status);
          const buf = await resp.arrayBuffer();
          track._buffer = await this.audioCtx.decodeAudioData(buf);
          return;
        } catch (e) {
          console.warn('URL decode failed, using Audio element fallback:', e.message);
        }
        track._cacheUrl = track.audioUrl;
      }
      return;
    }
    if (track.type === 'system_generated' || (!track.audioBlob && !track.audioUrl)) {
      if (!track._buffer && !track._cacheUrl) {
        const cacheKey = `gen_${track.worldKey}_${track.trackIdx}`;
        try {
          const cached = await DB.tracks.get(cacheKey);
          if (cached && cached.audioBlob) {
            const buf = await cached.audioBlob.arrayBuffer();
            await this.ensureCtx();
            track._buffer = await this.audioCtx.decodeAudioData(buf);
            return;
          }
        } catch (e) {}
        const blob = await generateMusic(track.worldKey, track.trackIdx);
        const buf = await blob.arrayBuffer();
        await this.ensureCtx();
        track._buffer = await this.audioCtx.decodeAudioData(buf);
        try { await DB.tracks.put({ id: cacheKey, type: 'generated_cache', audioBlob: blob, name: track.name, duration: track.dur }); } catch (e) {}
      }
      return;
    }
    throw new Error('No audio source for track');
  },

  toggle() {
    if (this.playlist.length === 0) { App.toast('歌单为空'); return; }
    if (this.currentIdx < 0) { this.play(0); return; }
    if (this.isPlaying) {
      if (this._audioMode) {
        this._audioEl?.pause();
      } else {
        this._stopSource();
      }
      this.isPlaying = false;
    } else {
      if (this._audioMode) {
        this._audioEl?.play().catch(() => App.toast('播放失败'));
        this.isPlaying = true;
      } else {
        const track = this.playlist[this.currentIdx];
        if (!track?._buffer) { this.play(this.currentIdx); return; }
        this.ensureCtx().then(() => {
          this.isPlaying = true;
          this._playBuffer(track._buffer, this.currentTime);
        }).catch(() => App.toast('播放失败'));
      }
    }
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

  onEnd() {
    if (this.loopMode === 2) {
      const track = this.playlist[this.currentIdx];
      if (this._audioMode) {
        if (this._audioEl) {
          this._audioEl.currentTime = 0;
          this._audioEl.play().catch(() => {});
          this.isPlaying = true;
          App.renderPlayer();
        }
      } else if (track?._buffer) {
        this.currentTime = 0;
        this._startOffset = 0;
        this.isPlaying = true;
        this._playBuffer(track._buffer, 0);
        App.renderPlayer();
      }
    } else if (this.loopMode === 1 || this.currentIdx < this.playlist.length - 1) {
      this.next();
    } else {
      this.isPlaying = false;
      App.renderPlayer();
    }
  },

  stop() {
    this._stopAll();
    this.isPlaying = false;
    this.currentIdx = -1;
    this.currentTime = 0;
  },

  setVolume(v) {
    this.volume = v / 100;
    if (this.gainNode) this.gainNode.gain.value = this.volume;
    if (this._audioEl) this._audioEl.volume = this.volume;
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
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    if (this._audioMode) {
      if (this._audioEl?.duration && isFinite(this._audioEl.duration)) {
        this._audioEl.currentTime = pct * this._audioEl.duration;
      }
    } else {
      const track = this.playlist[this.currentIdx];
      if (!track?._buffer) return;
      const newTime = pct * track._buffer.duration;
      this._stopSource();
      this.currentTime = newTime;
      this._startOffset = newTime;
      this.isPlaying = true;
      this._playBuffer(track._buffer, newTime);
    }
    App.renderProgress();
  },
};

// ---- Music Generator ----
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

  for (let i = 0; i < chordCount; i++) {
    const rootFreq = p.chords[i % p.chords.length][0] / 2;
    const start = i * chordLen;
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = rootFreq;
    const g = ctx.createGain(); g.gain.setValueAtTime(0, start); g.gain.linearRampToValueAtTime(0.06, start + 0.1); g.gain.setValueAtTime(0.06, start + chordLen - 0.3); g.gain.linearRampToValueAtTime(0, start + chordLen);
    o.connect(g); g.connect(master); o.start(start); o.stop(start + chordLen);
  }

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

  for (let beat = 0; beat < Math.floor(dur / beatLen); beat++) {
    if (beat % 2 !== 0) continue;
    const start = beat * beatLen;
    const bl = sr * 0.08; const buf = ctx.createBuffer(1, bl, sr); const d = buf.getChannelData(0);
    for (let i = 0; i < bl; i++) { const env = Math.exp(-i / (bl * 0.15)); d[i] = (Math.random() * 2 - 1) * env * 0.5 + Math.sin(i * 0.3) * env * 0.5; }
    const bs = ctx.createBufferSource(); bs.buffer = buf;
    const bg = ctx.createGain(); bg.gain.setValueAtTime(0.12, start); bg.gain.linearRampToValueAtTime(0, start + 0.08);
    bs.connect(bg); bg.connect(master); bs.start(start); bs.stop(start + 0.1);
  }

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
  if (!isFinite(s) || s <= 0) return '...';
  const m = Math.floor(s / 60);
  return String(m).padStart(2, '0') + ':' + String(Math.floor(s % 60)).padStart(2, '0');
}