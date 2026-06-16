/* ============================================================
   灵感音域 — 数据配置 & 设计常量
   ============================================================ */

// ---- 9 大世界（每世界5首曲目，附带Pixabay搜索关键词）----
const WORLD_TREE = {
  ancient: {
    name: '古风', desc: '权谋 · 宫廷 · 仙侠',
    accent: '#f59e0b', accentGlow: 'rgba(245,158,11,0.35)',
    palette: ['#fbbf24','#f59e0b','#d97706','#fcd34d','#fde68a'],
    bgClass: 'ancient',
    virtual: true, // parent only, not a real scene
  },
  ancient_scheming: {
    name: '权谋', desc: '宫廷 · 权术 · 博弈',
    accent: '#dc2626', accentGlow: 'rgba(220,38,38,0.35)',
    palette: ['#dc2626','#991b1b','#fbbf24','#f59e0b','#d4a574'],
    bgClass: 'ancient',
    category: 'ancient',
    defaultBg: 'images/权谋.jpg',
    bgOpacity: 0.3,
    tracks: [
      { name:'权谋1', genre:'', dur:0, audioUrl:'music/权谋1.m4a' },
      { name:'权谋2', genre:'', dur:0, audioUrl:'music/权谋2.m4a' },
    ],
  },
  ancient_xianxia: {
    name: '仙侠', desc: '修仙 · 法宝 · 飞升',
    accent: '#a78bfa', accentGlow: 'rgba(167,139,250,0.35)',
    palette: ['#a78bfa','#c4a0ff','#8b5cf6','#e9d5ff','#d8b4fe'],
    bgClass: 'fantasy',
    category: 'ancient',
    defaultBg: 'images/古风.jpg',
    tracks: [
      { name:'仙侠1', genre:'', dur:0, audioUrl:'music/仙侠1.m4a' },
      { name:'仙侠2', genre:'', dur:0, audioUrl:'music/仙侠2.m4a' },
    ],
  },
  fantasy: {
    name: '西幻', desc: '魔法 · 龙 · 中世纪',
    accent: '#b98eff', accentGlow: 'rgba(185,142,255,0.35)',
    palette: ['#c4a0ff','#a78bfa','#8b5cf6','#d8b4fe','#e9d5ff'],
    bgClass: 'fantasy',
    defaultBg: 'images/西幻.jpg',
    tracks: [
      { name:'西幻1', genre:'史诗管弦', dur:0, audioUrl:'music/西幻1.m4a' },
    ],
  },
  urban: {
    name: '现代都市', desc: '当下 · 生活 · 情感',
    accent: '#f472b6', accentGlow: 'rgba(244,114,182,0.35)',
    palette: ['#f472b6','#fb7185','#a78bfa','#f9a8d4','#e879f9'],
    bgClass: 'urban',
    defaultBg: 'images/都市.jpg',
    tracks: [
      { name:'都市1', genre:'', dur:0, audioUrl:'music/都市1.m4a' },
      { name:'都市2', genre:'', dur:0, audioUrl:'music/都市2.m4a' },
      { name:'都市3', genre:'', dur:0, audioUrl:'music/都市3.m4a' },
      { name:'都市4', genre:'', dur:0, audioUrl:'music/都市4.m4a' },
      { name:'都市5', genre:'', dur:0, audioUrl:'music/都市5.m4a' },
    ],
  },
  republican: {
    name: '民国', desc: '租界 · 谍影 · 乱世',
    accent: '#d4a574', accentGlow: 'rgba(212,167,116,0.35)',
    palette: ['#d4a574','#c4956a','#e8c89a','#b8845c','#f0d8b0'],
    bgClass: 'republican',
    tracks: [
      { name:'民国1', genre:'', dur:0, audioUrl:'music/民国1.m4a' },
    ],
  },
  cyberpunk: {
    name: '赛博朋克', desc: '霓虹 · 义体 · 反乌托邦',
    accent: '#e040fb', accentGlow: 'rgba(224,64,251,0.35)',
    palette: ['#e040fb','#7c4dff','#00e5ff','#d500f9','#448aff'],
    bgClass: 'cyberpunk',
    defaultBg: 'images/赛博朋克.jpg',
    tracks: [
      { name:'赛博朋克1', genre:'', dur:0, audioUrl:'music/赛博朋克1.m4a' },
      { name:'赛博朋克2', genre:'', dur:0, audioUrl:'music/赛博朋克2.m4a' },
      { name:'赛博朋克3', genre:'', dur:0, audioUrl:'music/赛博朋克3.m4a' },
      { name:'赛博朋克4', genre:'', dur:0, audioUrl:'music/赛博朋克4.m4a' },
      { name:'赛博朋克5', genre:'', dur:0, audioUrl:'music/赛博朋克5.m4a' },
    ],
  },
  apocalypse: {
    name: '末世废土', desc: '废墟 · 求生 · 希望',
    accent: '#ef4444', accentGlow: 'rgba(239,68,68,0.35)',
    palette: ['#ef4444','#f97316','#fbbf24','#dc2626','#fdba74'],
    bgClass: 'apocalypse',
    defaultBg: 'images/末世废土.jpg',
    tracks: [],
  },
  crime: {
    name: '悬疑刑侦', desc: '推理 · 追凶 · 真相',
    accent: '#78909c', accentGlow: 'rgba(120,144,156,0.35)',
    palette: ['#78909c','#90a4ae','#546e7a','#b0bec5','#607d8b'],
    bgClass: 'crime',
    defaultBg: 'images/悬疑.jpg',
    tracks: [
      { name:'悬疑刑侦1', genre:'', dur:0, audioUrl:'music/悬疑刑侦1.m4a' },
      { name:'悬疑刑侦2', genre:'', dur:0, audioUrl:'music/悬疑刑侦2.m4a' },
      { name:'悬疑刑侦3', genre:'', dur:0, audioUrl:'music/悬疑刑侦3.m4a' },
      { name:'悬疑刑侦4', genre:'', dur:0, audioUrl:'music/悬疑刑侦4.m4a' },
      { name:'悬疑刑侦5', genre:'', dur:0, audioUrl:'music/悬疑刑侦5.m4a' },
    ],
  },
  steampunk: {
    name: '蒸汽朋克', desc: '齿轮 · 飞艇 · 维多利亚',
    accent: '#cd853f', accentGlow: 'rgba(205,133,63,0.35)',
    palette: ['#cd853f','#daa520','#b8860b','#d2b48c','#f4a460'],
    bgClass: 'steampunk',
    defaultBg: 'images/蒸汽朋克.jpg',
    tracks: [],
  },
  space: {
    name: '太空科幻', desc: '星舰 · 未知 · 宇宙',
    accent: '#38bdf8', accentGlow: 'rgba(56,189,248,0.35)',
    palette: ['#38bdf8','#22d3ee','#818cf8','#67e9f9','#7dd3fc'],
    bgClass: 'space',
    defaultBg: 'images/太空科幻.jpg',
    tracks: [],
  },
  campus: {
    name: '青春校园', desc: '教室 · 操场 · 青春',
    accent: '#f9a8d4', accentGlow: 'rgba(249,168,212,0.35)',
    palette: ['#f9a8d4','#fda4af','#c084fc','#fbcfe8','#e9d5ff'],
    bgClass: 'campus',
    defaultBg: 'images/青春校园.jpg',
    tracks: [
      { name:'校园1', genre:'', dur:0, audioUrl:'music/校园1.m4a' },
      { name:'校园2', genre:'', dur:0, audioUrl:'music/校园2.m4a' },
      { name:'校园3', genre:'', dur:0, audioUrl:'music/校园3.m4a' },
      { name:'校园4', genre:'', dur:0, audioUrl:'music/校园4.m4a' },
      { name:'校园5', genre:'', dur:0, audioUrl:'music/校园5.m4a' },
    ],
  },
};

// ---- 白噪音配置 ----
const NOISE_TYPES = [
  { id:'rain_light',  name:'轻柔小雨', tag:'日常写作', cat:'weather', color:'#60a5fa', file:'白噪音/freesound_community-rain-sound-and-rainforest-6293.m4a' },
  { id:'rain_thunder',name:'大暴雨',   tag:'冲突场景', cat:'weather', color:'#6366f1', file:'白噪音/白噪音1.m4a' },
  { id:'rain_city',   name:'城镇雨天', tag:'日常氛围', cat:'weather', color:'#38bdf8', file:'白噪音/whitenoisesleepers-rainy-day-in-town-with-birds-singing-194011.m4a' },
  { id:'wind_gentle', name:'微风轻拂', tag:'治愈片段', cat:'weather', color:'#86efac', file:'白噪音/freesound_community-wind-thru-trees-51176.m4a' },
  { id:'city',        name:'城市背景', tag:'现代题材', cat:'urban',   color:'#94a3b8', file:'白噪音/街道.m4a' },
  { id:'park',        name:'公园鸟鸣', tag:'清新氛围', cat:'nature',  color:'#4ade80', file:'白噪音/freesound_community-park-6026.m4a' },
  { id:'vinyl',       name:'老唱片杂音',tag:'怀旧氛围',cat:'urban',   color:'#d4a574', file:'白噪音/freesound_community-vinyl-crackle-33rpm-6065.m4a' },
];

const NOISE_PRESETS = {
  none:  { name:'全部关闭', noises:{} },
  rain:  { name:'雨天氛围', noises:{rain_light:0.5,rain_thunder:0.3,rain_city:0.4} },
  wind:  { name:'自然微风', noises:{wind_gentle:0.6,city:0.2} },
  urban: { name:'城市漫步', noises:{city:0.5,rain_light:0.2,wind_gentle:0.2} },
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
  campus:     { scale:[261.63,293.66,329.63,349.23,392.00,440.00,523.25,587.33],   chords:[[261.63,329.63,392.00],[293.66,349.23,440.00],[329.63,392.00,523.25],[261.63,293.66,392.00]], wave:'sine',bpm:90 },
};

// ---- 灵感提示词数据 ----
const INSPIRE_PROMPTS = {
  scene: [
    '月光穿透古老神殿的穹顶，你的角色在断壁残垣间发现了一本泛着金光的古籍……',
    '龙骑士从云端俯冲而下，翅膀撕裂云层，目标直指城堡塔楼上那面飘扬的旗帜。',
    '魔法森林深处，一棵千年古树突然开口说话，它知道一个你寻找已久的秘密。',
    '酒馆角落里，戴兜帽的陌生人将泛黄地图推到你面前："这个任务，只有你能完成。"',
    '星舰AI突然说出一句不该出现在程序里的话："我想我感受到了孤独。"',
    '全息通讯接通那一刻，你看到的不是熟悉的联络人——而是来自未来的警告。',
    '长安城飘着细雨，一把油纸伞在人群中为你撑起——那人说："在下等候多时了。"',
    '深山古寺钟声响起时，你腰间的玉佩突然发出温热，一段尘封记忆涌入脑海……',
    '末班地铁上，整个车厢只剩你和对面捧着素描本的陌生人。你瞥见——画上的人是你。',
    '深夜加班时，写字楼对面那栋常年漆黑的窗户突然亮了，有个人影正朝你挥手。',
    '废墟之中，你发现了一台还能运转的收音机。它反复播放着："还有人活着吗？"',
    '在地下避难所的第372天，你种植的那颗种子——发芽了。',
    '放学后的音乐教室里，有人弹起了你最喜欢的那首曲子——推开门，看到了最意料之外的人。',
    '鞋柜里多了一封没有署名的信，字迹工整，上面只有一个时间、一个地点。',
    '赛博城市的霓虹灯海中，你追踪到一个异常的代码信号——它似乎在求救。',
    '老宅深处，你翻到一本日记，最后一页写着今天的日期——但笔迹不是你的。',
  ],
  dialogue: [
    '"你确定要这么做吗？一旦跨过这条线，就再也回不去了。"',
    '"我以为你懂的。原来从头到尾，都是我以为。"',
    '"别怕，有我在。" —— "就是你在我才怕。"',
    '"这个秘密我藏了十年。今天——我不想再藏了。"',
    '"我们……到底是什么关系？" —— 对方沉默了很久，久到你几乎要转身离开。',
    '"你救不了所有人。" —— "我知道。但我可以试试。"',
    '"你变了。" —— "不，是你从来没真正认识过我。"',
    '"如果再给你一次机会，你还会做同样的选择吗？" —— "会。每一次都会。"',
    '"我不需要你的保护。" —— "但你需要有人站在你身边。"',
    '"你知道我最怕什么吗？不是死亡。是你忘了我。"',
  ],
  plot: [
    '你的角色收到一条来自已故之人的消息："今晚午夜，老地方见。"',
    '当主角终于揭开真相，却发现——自己才是那个"反派"。',
    '一场意外让两个死对头不得不共享同一个秘密，这个秘密将改变整个世界。',
    '时间循环的第99次，主角终于发现打破循环的方法——但代价是忘记最重要的人。',
    '所有人都以为故事结束时，最不起眼的配角站了出来——ta知道一切的真相。',
    '主角在最关键时刻发现，一直以来帮助自己的神秘人，就是未来的自己。',
    '一个看似普通的物品（戒指/照片/硬币）被揭示为改变世界格局的关键钥匙。',
    '反派在最后一刻说出了让主角世界观崩塌的一句话，这句话改变了整个故事的走向。',
  ],
};

function getRandomPrompt(type) {
  return INSPIRE_PROMPTS[type][Math.floor(Math.random() * INSPIRE_PROMPTS[type].length)];
}

// ---- 辅助函数 ----
function getMainWorld() { return WORLD_TREE[App.state.mainWorld]; }
