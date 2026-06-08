/* ============================================================
   灵感音域 — 数据配置 & 设计常量
   ============================================================ */

// ---- 世界背景渐变 ----
const WORLD_GRADIENTS = {
  ancient:    'radial-gradient(ellipse at 30% 60%,#3d1e0a,transparent 55%),radial-gradient(ellipse at 70% 30%,#2d1508,transparent 50%),linear-gradient(180deg,#100a05,#1a0f08 50%,#100a05)',
  fantasy:    'radial-gradient(ellipse at 30% 50%,#2d1b4e,transparent 60%),radial-gradient(ellipse at 70% 20%,#1a1050,transparent 50%),linear-gradient(180deg,#0a0818,#100d28 50%,#0a0818)',
  urban:      'radial-gradient(ellipse at 35% 55%,#3d1040,transparent 55%),radial-gradient(ellipse at 65% 45%,#0d2840,transparent 50%),linear-gradient(180deg,#0a0a14,#101018 50%,#0a0a14)',
  republican: 'radial-gradient(ellipse at 30% 50%,#4d2e0a,transparent 55%),radial-gradient(ellipse at 70% 40%,#3d2006,transparent 50%),linear-gradient(180deg,#120c06,#1a120a 50%,#120c06)',
  cyberpunk:  'radial-gradient(ellipse at 30% 50%,#2d0050,transparent 55%),radial-gradient(ellipse at 70% 30%,#0a3050,transparent 50%),linear-gradient(180deg,#050210,#0a0518 50%,#050210)',
  apocalypse: 'radial-gradient(ellipse at 30% 70%,#5d1808,transparent 55%),radial-gradient(ellipse at 70% 50%,#4d1005,transparent 50%),linear-gradient(180deg,#0f0804,#1a0c06 50%,#0f0804)',
  crime:      'radial-gradient(ellipse at 25% 55%,#0a1a2d,transparent 55%),radial-gradient(ellipse at 75% 45%,#0d1525,transparent 50%),linear-gradient(180deg,#050810,#080d18 50%,#050810)',
  steampunk:  'radial-gradient(ellipse at 35% 50%,#3d2a10,transparent 55%),radial-gradient(ellipse at 65% 40%,#2d1d08,transparent 50%),linear-gradient(180deg,#0f0a04,#1a1208 50%,#0f0a04)',
  space:      'radial-gradient(ellipse at 25% 40%,#000a30,transparent 55%),radial-gradient(ellipse at 75% 60%,#001040,transparent 50%),linear-gradient(180deg,#000208,#020810 50%,#000208)',
};

// ---- 9 大世界（扁平结构，每个世界 = 一个场景）----
const WORLD_TREE = {
  ancient: {
    name: '古风', desc: '宫廷 · 江湖 · 仙侠',
    accent: '#f59e0b', accentGlow: 'rgba(245,158,11,0.35)',
    palette: ['#fbbf24','#f59e0b','#d97706','#fcd34d','#fde68a'],
    bgClass: 'ancient',
    tracks: [
      { name:'宫墙之影', genre:'编钟与古琴', dur:235 },
      { name:'江湖夜雨', genre:'笛子协奏', dur:200 },
      { name:'云海仙踪', genre:'空灵箫声', dur:240 },
      { name:'水墨江南', genre:'古筝与笛', dur:195 },
      { name:'征战行', genre:'战鼓号角', dur:220 },
    ],
  },
  fantasy: {
    name: '西幻', desc: '魔法 · 龙 · 中世纪',
    accent: '#b98eff', accentGlow: 'rgba(185,142,255,0.35)',
    palette: ['#c4a0ff','#a78bfa','#8b5cf6','#d8b4fe','#e9d5ff'],
    bgClass: 'fantasy',
    tracks: [
      { name:'咒文与星图', genre:'神秘管弦', dur:215 },
      { name:'王座之间', genre:'大提琴独奏', dur:240 },
      { name:'林间晨光', genre:'凯尔特竖琴', dur:198 },
      { name:'深渊回响', genre:'低音弦乐', dur:225 },
      { name:'圣光颂歌', genre:'合唱与管风琴', dur:250 },
    ],
  },
  urban: {
    name: '现代都市', desc: '当下 · 生活 · 情感',
    accent: '#f472b6', accentGlow: 'rgba(244,114,182,0.35)',
    palette: ['#f472b6','#fb7185','#a78bfa','#f9a8d4','#e879f9'],
    bgClass: 'urban',
    tracks: [
      { name:'晨间通勤', genre:'轻电子', dur:185 },
      { name:'放学铃响', genre:'尤克里里', dur:175 },
      { name:'午后的猫', genre:'温暖吉他', dur:200 },
      { name:'霓虹暗涌', genre:'合成器流行', dur:195 },
      { name:'白色走廊', genre:'安静钢琴', dur:210 },
    ],
  },
  republican: {
    name: '民国', desc: '租界 · 谍影 · 乱世',
    accent: '#d4a574', accentGlow: 'rgba(212,167,116,0.35)',
    palette: ['#d4a574','#c4956a','#e8c89a','#b8845c','#f0d8b0'],
    bgClass: 'republican',
    tracks: [
      { name:'暗号', genre:'爵士钢琴', dur:205 },
      { name:'夜上海', genre:'爵士大乐队', dur:220 },
      { name:'公馆深处', genre:'钢琴与弦乐', dur:230 },
      { name:'战地晨曦', genre:'悲悯弦乐', dur:215 },
      { name:'乱世浮萍', genre:'二胡与提琴', dur:225 },
    ],
  },
  cyberpunk: {
    name: '赛博朋克', desc: '霓虹 · 义体 · 反乌托邦',
    accent: '#e040fb', accentGlow: 'rgba(224,64,251,0.35)',
    palette: ['#e040fb','#7c4dff','#00e5ff','#d500f9','#448aff'],
    bgClass: 'cyberpunk',
    tracks: [
      { name:'霓虹雨', genre:'合成波', dur:210 },
      { name:'金属与神经', genre:'工业氛围', dur:205 },
      { name:'总部大厦', genre:'极简电子', dur:220 },
      { name:'地下交易', genre:'黑暗电子', dur:200 },
      { name:'入侵', genre:'脉冲合成器', dur:195 },
    ],
  },
  apocalypse: {
    name: '末世废土', desc: '废墟 · 求生 · 希望',
    accent: '#ef4444', accentGlow: 'rgba(239,68,68,0.35)',
    palette: ['#ef4444','#f97316','#fbbf24','#dc2626','#fdba74'],
    bgClass: 'apocalypse',
    tracks: [
      { name:'寂静之城', genre:'环境嗡鸣', dur:230 },
      { name:'避难所', genre:'温暖吉他', dur:195 },
      { name:'无尽公路', genre:'工业摇滚', dur:210 },
      { name:'拾荒者', genre:'民谣吉他', dur:200 },
      { name:'尸潮', genre:'恐怖管弦', dur:195 },
    ],
  },
  crime: {
    name: '悬疑刑侦', desc: '推理 · 追凶 · 真相',
    accent: '#78909c', accentGlow: 'rgba(120,144,156,0.35)',
    palette: ['#78909c','#90a4ae','#546e7a','#b0bec5','#607d8b'],
    bgClass: 'crime',
    tracks: [
      { name:'封锁线', genre:'悬疑合成器', dur:205 },
      { name:'解剖台', genre:'环境嗡鸣', dur:215 },
      { name:'审讯', genre:'紧张打击乐', dur:195 },
      { name:'尘封卷宗', genre:'安静氛围', dur:220 },
      { name:'老宅', genre:'恐怖管弦', dur:210 },
    ],
  },
  steampunk: {
    name: '蒸汽朋克', desc: '齿轮 · 飞艇 · 维多利亚',
    accent: '#cd853f', accentGlow: 'rgba(205,133,63,0.35)',
    palette: ['#cd853f','#daa520','#b8860b','#d2b48c','#f4a460'],
    bgClass: 'steampunk',
    tracks: [
      { name:'云端之上', genre:'管弦与齿轮', dur:225 },
      { name:'齿轮交响曲', genre:'打击乐与铜管', dur:210 },
      { name:'钟楼之巅', genre:'管风琴与钟声', dur:230 },
      { name:'齿轮之舞', genre:'工业打击乐', dur:205 },
      { name:'启航', genre:'管弦史诗', dur:215 },
    ],
  },
  space: {
    name: '太空科幻', desc: '星舰 · 未知 · 宇宙',
    accent: '#38bdf8', accentGlow: 'rgba(56,189,248,0.35)',
    palette: ['#38bdf8','#22d3ee','#818cf8','#67e9f9','#7dd3fc'],
    bgClass: 'space',
    tracks: [
      { name:'星舰日常', genre:'太空合成器', dur:230 },
      { name:'轨道站', genre:'氛围合成器', dur:240 },
      { name:'异星黎明', genre:'世界音乐融合', dur:220 },
      { name:'星港蓝调', genre:'爵士电子', dur:195 },
      { name:'跃迁', genre:'前卫电子', dur:210 },
    ],
  },
};

// ---- 白噪音配置 ----
const NOISE_TYPES = [
  { id:'rain_light',  name:'轻柔小雨', tag:'日常写作', cat:'weather', color:'#60a5fa' },
  { id:'rain_thunder',name:'雷雨交加', tag:'冲突场景', cat:'weather', color:'#6366f1' },
  { id:'wind_gentle', name:'微风轻拂', tag:'治愈片段', cat:'weather', color:'#86efac' },
  { id:'wind_storm',  name:'狂风呼啸', tag:'紧张场景', cat:'weather', color:'#94a3b8' },
  { id:'snow',        name:'风雪交加', tag:'寒冷氛围', cat:'weather', color:'#e2e8f0' },
  { id:'fire',        name:'篝火噼啪', tag:'围炉夜话', cat:'nature',  color:'#fb923c' },
  { id:'stream',      name:'溪水潺潺', tag:'清冷氛围', cat:'nature',  color:'#38bdf8' },
  { id:'ocean',       name:'海浪拍岸', tag:'开阔场景', cat:'nature',  color:'#0ea5e9' },
  { id:'forest',      name:'林间鸟鸣', tag:'森林冒险', cat:'nature',  color:'#4ade80' },
  { id:'magic',       name:'魔法嗡鸣', tag:'施法场景', cat:'fantasy', color:'#c084fc' },
  { id:'city',        name:'城市背景', tag:'现代题材', cat:'urban',   color:'#94a3b8' },
  { id:'cafe',        name:'咖啡馆',   tag:'轻松对话', cat:'urban',   color:'#d4a574' },
  { id:'keyboard',    name:'键盘敲击', tag:'写作激励', cat:'urban',   color:'#a78bfa' },
  { id:'clock',       name:'钟表滴答', tag:'悬疑氛围', cat:'urban',   color:'#fbbf24' },
  { id:'vinyl',       name:'老唱片杂音',tag:'怀旧氛围',cat:'urban',   color:'#d4a574' },
];

const NOISE_PRESETS = {
  none:  { name:'全部关闭', noises:{} },
  calm:  { name:'安静写作', noises:{rain_light:0.3,keyboard:0.4,clock:0.2} },
  storm: { name:'冲突场景', noises:{rain_thunder:0.6,wind_storm:0.5} },
  forest:{ name:'森林探索', noises:{forest:0.5,stream:0.4,wind_gentle:0.3} },
  magic: { name:'魔法氛围', noises:{magic:0.5,wind_gentle:0.2,fire:0.3} },
  cafe:  { name:'咖啡馆',   noises:{cafe:0.5,city:0.2,keyboard:0.3} },
  night: { name:'深夜独处', noises:{city:0.2,clock:0.3,vinyl:0.3} },
  epic:  { name:'史诗战争', noises:{wind_storm:0.6,fire:0.5,rain_thunder:0.4} },
};

// ---- 音乐生成配置 ----
const MUSIC_PROFILES = {
  ancient:    { scale:[293.66,330.00,349.23,392.00,440.00,523.25,587.33,659.25], chords:[[293.66,349.23,440.00],[330.00,392.00,523.25],[349.23,440.00,587.33],[261.63,330.00,392.00]], wave:'sine',    bpm:60 },
  fantasy:    { scale:[130.81,164.81,196.00,220.00,261.63,329.63,392.00,440.00], chords:[[130.81,164.81,196.00],[164.81,196.00,220.00],[196.00,220.00,261.63],[146.83,196.00,220.00]], wave:'triangle',bpm:72 },
  urban:      { scale:[98.00,123.47,146.83,196.00,220.00,261.63,293.66,329.63],  chords:[[98.00,123.47,146.83],[123.47,146.83,196.00],[146.83,196.00,220.00],[110.00,146.83,196.00]], wave:'triangle',bpm:80 },
  republican: { scale:[246.94,277.18,311.13,369.99,415.30,466.16,554.37,622.25],  chords:[[246.94,311.13,369.99],[277.18,369.99,415.30],[311.13,369.99,466.16],[220.00,277.18,369.99]], wave:'sine',    bpm:66 },
  cyberpunk:  { scale:[110.00,138.59,164.81,207.65,277.18,329.63,415.30,554.37],  chords:[[110.00,138.59,164.81],[138.59,164.81,207.65],[164.81,207.65,277.18],[130.81,164.81,207.65]], wave:'sawtooth',bpm:90 },
  apocalypse: { scale:[82.41,110.00,130.81,164.81,196.00,246.94,329.63,392.00],   chords:[[82.41,110.00,130.81],[110.00,130.81,164.81],[130.81,164.81,196.00],[98.00,130.81,164.81]], wave:'sawtooth',bpm:55 },
  crime:      { scale:[174.61,196.00,220.00,261.63,293.66,349.23,392.00,440.00],   chords:[[174.61,220.00,261.63],[196.00,261.63,293.66],[220.00,261.63,349.23],[164.81,220.00,261.63]], wave:'sine',    bpm:65 },
  steampunk:  { scale:[146.83,174.61,220.00,261.63,293.66,349.23,440.00,523.25],   chords:[[146.83,174.61,220.00],[174.61,220.00,261.63],[220.00,261.63,293.66],[164.81,220.00,261.63]], wave:'triangle',bpm:78 },
  space:      { scale:[110.00,138.59,164.81,207.65,277.18,329.63,415.30,554.37],   chords:[[110.00,164.81,207.65],[138.59,207.65,277.18],[164.81,207.65,329.63],[130.81,164.81,277.18]], wave:'sawtooth',bpm:50 },
};

// ---- 辅助函数 ----
function getMainWorld() { return WORLD_TREE[App.state.mainWorld]; }
