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

// ---- 9 大世界（每世界5首曲目，附带Pixabay搜索关键词）----
const WORLD_TREE = {
  ancient: {
    name: '古风', desc: '宫廷 · 江湖 · 仙侠',
    accent: '#f59e0b', accentGlow: 'rgba(245,158,11,0.35)',
    palette: ['#fbbf24','#f59e0b','#d97706','#fcd34d','#fde68a'],
    bgClass: 'ancient',
    tracks: [
      { name:'宫墙之影', genre:'编钟与古琴', dur:235, search:'chinese traditional guzheng palace' },
      { name:'江湖夜雨', genre:'笛子协奏', dur:200, search:'chinese flute xiao wandering' },
      { name:'云海仙踪', genre:'空灵箫声', dur:240, search:'chinese ethereal xianxia ambient' },
      { name:'水墨江南', genre:'古筝与笛', dur:195, search:'chinese guzheng peaceful garden' },
      { name:'征战行', genre:'战鼓号角', dur:220, search:'epic chinese war drums battle' },
    ],
  },
  fantasy: {
    name: '西幻', desc: '魔法 · 龙 · 中世纪',
    accent: '#b98eff', accentGlow: 'rgba(185,142,255,0.35)',
    palette: ['#c4a0ff','#a78bfa','#8b5cf6','#d8b4fe','#e9d5ff'],
    bgClass: 'fantasy',
    tracks: [
      { name:'咒文与星图', genre:'神秘管弦', dur:215, search:'fantasy magical orchestral mysterious' },
      { name:'王座之间', genre:'大提琴独奏', dur:240, search:'medieval cello throne royal' },
      { name:'林间晨光', genre:'凯尔特竖琴', dur:198, search:'celtic harp forest elven' },
      { name:'深渊回响', genre:'低音弦乐', dur:225, search:'dark dungeon deep strings' },
      { name:'圣光颂歌', genre:'合唱与管风琴', dur:250, search:'epic choir organ cathedral sacred' },
    ],
  },
  urban: {
    name: '现代都市', desc: '当下 · 生活 · 情感',
    accent: '#f472b6', accentGlow: 'rgba(244,114,182,0.35)',
    palette: ['#f472b6','#fb7185','#a78bfa','#f9a8d4','#e879f9'],
    bgClass: 'urban',
    tracks: [
      { name:'晨间通勤', genre:'轻电子', dur:185, search:'lofi morning commute chill' },
      { name:'放学铃响', genre:'尤克里里', dur:175, search:'ukulele cheerful school youth' },
      { name:'午后的猫', genre:'温暖吉他', dur:200, search:'acoustic guitar warm cozy afternoon' },
      { name:'霓虹暗涌', genre:'合成器流行', dur:195, search:'synthwave neon night city pop' },
      { name:'白色走廊', genre:'安静钢琴', dur:210, search:'sad piano hospital quiet melancholy' },
    ],
  },
  republican: {
    name: '民国', desc: '租界 · 谍影 · 乱世',
    accent: '#d4a574', accentGlow: 'rgba(212,167,116,0.35)',
    palette: ['#d4a574','#c4956a','#e8c89a','#b8845c','#f0d8b0'],
    bgClass: 'republican',
    tracks: [
      { name:'暗号', genre:'爵士钢琴', dur:205, search:'jazz piano spy noir suspense' },
      { name:'夜上海', genre:'爵士大乐队', dur:220, search:'vintage jazz big band shanghai' },
      { name:'公馆深处', genre:'钢琴与弦乐', dur:230, search:'classical piano strings mansion nostalgic' },
      { name:'战地晨曦', genre:'悲悯弦乐', dur:215, search:'sad strings war field hospital' },
      { name:'乱世浮萍', genre:'二胡与提琴', dur:225, search:'erhu violin sorrowful wartime' },
    ],
  },
  cyberpunk: {
    name: '赛博朋克', desc: '霓虹 · 义体 · 反乌托邦',
    accent: '#e040fb', accentGlow: 'rgba(224,64,251,0.35)',
    palette: ['#e040fb','#7c4dff','#00e5ff','#d500f9','#448aff'],
    bgClass: 'cyberpunk',
    tracks: [
      { name:'霓虹雨', genre:'合成波', dur:210, search:'synthwave neon rain dark' },
      { name:'金属与神经', genre:'工业氛围', dur:205, search:'industrial cyberpunk mechanical ambient' },
      { name:'总部大厦', genre:'极简电子', dur:220, search:'minimal electronic corporate dystopian' },
      { name:'地下交易', genre:'黑暗电子', dur:200, search:'dark electronic underground black market' },
      { name:'入侵', genre:'脉冲合成器', dur:195, search:'glitch electronic hacker cyber attack' },
    ],
  },
  apocalypse: {
    name: '末世废土', desc: '废墟 · 求生 · 希望',
    accent: '#ef4444', accentGlow: 'rgba(239,68,68,0.35)',
    palette: ['#ef4444','#f97316','#fbbf24','#dc2626','#fdba74'],
    bgClass: 'apocalypse',
    tracks: [
      { name:'寂静之城', genre:'环境嗡鸣', dur:230, search:'ambient drone desolate ruined city' },
      { name:'避难所', genre:'温暖吉他', dur:195, search:'acoustic hopeful shelter survival' },
      { name:'无尽公路', genre:'工业摇滚', dur:210, search:'industrial rock road chase wasteland' },
      { name:'拾荒者', genre:'民谣吉他', dur:200, search:'folk guitar scavenger desolate' },
      { name:'尸潮', genre:'恐怖管弦', dur:195, search:'horror orchestral zombie horde intense' },
    ],
  },
  crime: {
    name: '悬疑刑侦', desc: '推理 · 追凶 · 真相',
    accent: '#78909c', accentGlow: 'rgba(120,144,156,0.35)',
    palette: ['#78909c','#90a4ae','#546e7a','#b0bec5','#607d8b'],
    bgClass: 'crime',
    tracks: [
      { name:'封锁线', genre:'悬疑合成器', dur:205, search:'suspense synth crime scene investigation' },
      { name:'解剖台', genre:'环境嗡鸣', dur:215, search:'dark ambient autopsy morgue cold' },
      { name:'审讯', genre:'紧张打击乐', dur:195, search:'tense percussion interrogation thriller' },
      { name:'尘封卷宗', genre:'安静氛围', dur:220, search:'ambient archive old files quiet' },
      { name:'老宅', genre:'恐怖管弦', dur:210, search:'horror strings haunted mansion creepy' },
    ],
  },
  steampunk: {
    name: '蒸汽朋克', desc: '齿轮 · 飞艇 · 维多利亚',
    accent: '#cd853f', accentGlow: 'rgba(205,133,63,0.35)',
    palette: ['#cd853f','#daa520','#b8860b','#d2b48c','#f4a460'],
    bgClass: 'steampunk',
    tracks: [
      { name:'云端之上', genre:'管弦与齿轮', dur:225, search:'orchestral steampunk airship adventure' },
      { name:'齿轮交响曲', genre:'打击乐与铜管', dur:210, search:'percussion brass mechanical workshop' },
      { name:'钟楼之巅', genre:'管风琴与钟声', dur:230, search:'organ bells clock tower victorian' },
      { name:'齿轮之舞', genre:'工业打击乐', dur:205, search:'industrial percussion gears factory' },
      { name:'启航', genre:'管弦史诗', dur:215, search:'epic orchestral departure sky port' },
    ],
  },
  space: {
    name: '太空科幻', desc: '星舰 · 未知 · 宇宙',
    accent: '#38bdf8', accentGlow: 'rgba(56,189,248,0.35)',
    palette: ['#38bdf8','#22d3ee','#818cf8','#67e9f9','#7dd3fc'],
    bgClass: 'space',
    tracks: [
      { name:'星舰日常', genre:'太空合成器', dur:230, search:'space ambient starship sci-fi calm' },
      { name:'轨道站', genre:'氛围合成器', dur:240, search:'ambient space station orbital lonely' },
      { name:'异星黎明', genre:'世界音乐融合', dur:220, search:'ethnic fusion alien colony dawn' },
      { name:'星港蓝调', genre:'爵士电子', dur:195, search:'jazz electronic space bar lounge' },
      { name:'跃迁', genre:'前卫电子', dur:210, search:'experimental electronic wormhole warp' },
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

// ---- OC设定卡数据 ----
const OC_DATA = {
  names: ['林夜','苏念安','顾北辰','沈清欢','陆离','白染','萧然','江月','慕星辰','叶知秋','云无月','墨言','裴霜','柳轻尘'],
  ages: ['16岁','17岁','18岁','19岁','22岁','24岁','27岁','31岁','外表少年实则百年','未知'],
  identities: [
    '暗杀家族最后的传人，梦想成为花店老板',
    '能看见他人命运线的异能者，但看不到自己的',
    '被退婚的天才剑修，走一条从未有人走过的道',
    'AI仿生人，拥有完整人类情感，出厂设置是"武器"',
    '表面大学生，实际是异世界守护者',
    '图书馆管理员，守护会吞噬记忆的禁书区',
    '星际快递员，每次送货卷入不同文明冲突',
    '流浪乐师，琴声能打开通往不同时空的门',
  ],
  personalities: [
    '外表高冷内心柔软，笑容只留给特定的人',
    '嘴硬心软，嘴上说麻烦手上帮所有人',
    '天然呆，偶尔说出让人细思极恐的话',
    '温柔到近乎懦弱，重要时刻爆发出惊人勇气',
    '理性至上，唯一算不准的是自己的感情',
    '表面阳光开朗，深夜独自一人露出疲惫神情',
  ],
  backgrounds: [
    '出身被诅咒的家族，每代长子成年那天失去最重要的人。为打破诅咒踏上旅途。',
    '在孤儿院长大，唯一线索是襁褓中的泛黄照片——照片上是未见的城市。',
    '曾经最强的存在，一场战争后失去所有能力和记忆，现在只是普通人。',
    '从小能听到别人听不到的声音——世界本身在说话。所有人都说ta疯了，直到灾难降临。',
  ],
};

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function generateOC() {
  return {
    name: pick(OC_DATA.names),
    age: pick(OC_DATA.ages),
    identity: pick(OC_DATA.identities),
    personality: pick(OC_DATA.personalities),
    background: pick(OC_DATA.backgrounds),
  };
}

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
