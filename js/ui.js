/* ============================================================
   灵感音域 — UI 渲染层
   ============================================================ */

// ---- Homepage ----
async function renderHome() {
  const sysScenes = await SceneRepo.getAll('system');
  const grouped = {};
  sysScenes.forEach(s => {
    if (!grouped[s.category]) grouped[s.category] = [];
    grouped[s.category].push(s);
  });

  const grid = document.getElementById('feature-grid');
  grid.innerHTML = Object.entries(grouped).map(([ck, scenes]) => {
    const cat = WORLD_TREE[ck]; if (!cat) return '';
    return `<div class="glass-card" data-nav="category" data-cat="${ck}">
      <div class="card-label">${cat.name}</div>
      <div class="card-desc">${scenes.length}个场景</div>
    </div>`;
  }).join('') + `
    <div class="glass-card create-new" data-nav="create-scene">
      <div class="card-label">+ 创建场景</div>
      <div class="card-desc">从你的图库导入</div>
    </div>
  `;

  // User scenes
  const us = (await SceneRepo.getAll('user')).filter(s => !WORLD_TREE[s.category]);
  const ug = document.getElementById('user-scenes-grid');
  const ul = document.getElementById('user-scenes-label');
  if (us.length > 0) {
    ul.style.display = '';
    ug.innerHTML = us.map(s => `
      <div class="glass-card user-scene" data-nav="scene" data-scene="${s.id}">
        <span class="card-delete" data-delete="${s.id}">x</span>
        <div class="card-label">${s.name}</div>
        <div class="card-desc">${s.desc || ''}</div>
      </div>
    `).join('') + `
      <div class="glass-card create-new" data-nav="create-scene">
        <div class="card-label">+ 创建场景</div>
        <div class="card-desc">从你的图库导入</div>
      </div>
    `;
  } else {
    ul.style.display = 'none';
    ug.innerHTML = '';
  }

  grid.addEventListener('click', async e => {
    if (e.target.closest('.card-delete')) return;
    const card = e.target.closest('.glass-card'); if (!card) return;
    const nav = card.dataset.nav;
    if (nav === 'category') await App.navigateToCategory(card.dataset.cat);
    else if (nav === 'scene') await App.navigateToScene(card.dataset.scene);
    else if (nav === 'create-scene') App.showCreateDialog();
  });
  ug.addEventListener('click', async e => {
    if (e.target.closest('.card-delete')) return;
    const card = e.target.closest('.glass-card'); if (!card) return;
    const nav = card.dataset.nav;
    if (nav === 'scene') await App.navigateToScene(card.dataset.scene);
    else if (nav === 'create-scene') App.showCreateDialog();
  });

  document.querySelectorAll('.card-delete').forEach(b => {
    b.addEventListener('click', async e => {
      e.stopPropagation();
      if (confirm('确定删除此场景？')) {
        await SceneRepo.remove(b.dataset.delete);
        App.clearSceneCache();
        await renderHome();
        App.toast('已删除');
      }
    });
  });
}

// ---- Scene Tabs ----
async function renderSceneTabs(catKey, activeSceneId) {
  const container = document.getElementById('subworld-tabs');
  if (!container) return;
  const scenes = await SceneRepo.getByCategory(catKey);
  container.innerHTML = scenes.map(s =>
    `<div class="subworld-tab${s.id === activeSceneId ? ' active' : ''}" data-scene="${s.id}">
      ${s.name}<span class="tab-menu" data-scene="${s.id}">...</span>
    </div>`
  ).join('') + '<div class="subworld-tab add-tab" title="添加场景">+</div>';
}

// ---- Player UI ----
function renderPlayer() {
  const btn = document.getElementById('btn-play');
  if (btn) {
    const playIcon = btn.querySelector('.icon-play');
    const pauseIcon = btn.querySelector('.icon-pause');
    if (playIcon) playIcon.style.display = Player.isPlaying ? 'none' : '';
    if (pauseIcon) pauseIcon.style.display = Player.isPlaying ? '' : 'none';
  }
  const title = document.getElementById('np-title');
  const artist = document.getElementById('np-artist');
  if (Player.currentIdx >= 0 && Player.playlist[Player.currentIdx]) {
    const t = Player.playlist[Player.currentIdx];
    if (title) title.textContent = t.name;
    if (artist) artist.textContent = t.genre || '';
  } else {
    if (title) title.textContent = '选择一首曲目';
    if (artist) artist.textContent = '--';
  }
  const loopBtn = document.getElementById('btn-loop');
  if (loopBtn) {
    const off = loopBtn.querySelector('.icon-loop-off');
    const list = loopBtn.querySelector('.icon-loop-list');
    const single = loopBtn.querySelector('.icon-loop-single');
    if (off) off.style.display = Player.loopMode === 0 ? '' : 'none';
    if (list) list.style.display = Player.loopMode === 1 ? '' : 'none';
    if (single) single.style.display = Player.loopMode === 2 ? '' : 'none';
    loopBtn.style.opacity = Player.loopMode === 0 ? '0.5' : '1';
    loopBtn.style.color = Player.loopMode === 0 ? '' : 'var(--accent)';
  }
  const shuffleBtn = document.getElementById('btn-shuffle');
  if (shuffleBtn) {
    shuffleBtn.style.opacity = Player.shuffle ? '1' : '0.5';
    shuffleBtn.style.color = Player.shuffle ? 'var(--accent)' : '';
  }
}

function renderProgress() {
  const dur = Player.duration || (Player.playlist[Player.currentIdx]?.dur || 0);
  const pct = dur > 0 ? (Player.currentTime / dur) * 100 : 0;
  const fill = document.getElementById('progress-fill');
  const cur = document.getElementById('time-current');
  const tot = document.getElementById('time-total');
  if (fill) fill.style.width = Math.min(pct, 100) + '%';
  if (cur) cur.textContent = fmtTime(Player.currentTime);
  if (tot) tot.textContent = fmtTime(dur);
}

async function renderPlaylist() {
  const container = document.getElementById('playlist-items');
  if (!container) return;
  if (Player.playlist.length === 0) {
    container.innerHTML = '<div style="text-align:center;color:var(--text-muted);padding:30px;font-size:var(--text-body-sm)">歌单为空<br><span style="font-size:var(--text-caption)">导入或上传音乐</span></div>';
    return;
  }
  container.innerHTML = Player.playlist.map((t, i) => `
    <div class="pl-item${i === Player.currentIdx ? ' playing' : ''}" data-idx="${i}">
      <div class="pl-reorder"><span data-action="up" data-track="${t.id}">^</span><span data-action="down" data-track="${t.id}">v</span></div>
      <span class="pl-num">${String(i + 1).padStart(2, '0')}</span>
      <div class="pl-info">
        <div class="pl-name">${t.name}</div>
      </div>
      <div class="pl-actions"><span class="pl-act danger" data-action="remove" data-track="${t.id}">x</span></div>
      <span style="font-size:var(--text-caption);color:var(--text-muted);min-width:32px;text-align:right">${fmtTime(t.dur)}</span>
    </div>
  `).join('');
}

// ---- Noise UI ----
function renderNoise() {
  const grid = document.getElementById('noise-grid');
  if (!grid) return;
  grid.innerHTML = NOISE_TYPES.map(n => {
    const isOn = NoiseEngine.noises[n.id]?.playing;
    const vol = NoiseEngine.noises[n.id]?.volume ?? 0.4;
    return `<div class="noise-item${isOn ? ' on' : ''}" data-noise="${n.id}">
      <button class="ni-toggle" data-noise="${n.id}"><span class="ni-dot"></span></button>
      <div class="ni-info"><div class="ni-name">${n.name}</div><div class="ni-tag">${n.tag}</div></div>
      <input type="range" class="ni-vol" value="${Math.round(vol * 100)}" min="5" max="100" data-noise="${n.id}">
    </div>`;
  }).join('');

  const presets = document.getElementById('noise-presets');
  if (presets) {
    presets.innerHTML = Object.entries(NOISE_PRESETS).map(([k, p]) =>
      `<span class="noise-preset" data-preset="${k}">${p.name}</span>`
    ).join('');
  }
}

// ---- Writing Status ----
function showWritingEditor() {
  const wp = document.getElementById('writing-panel');
  const dl = document.getElementById('docs-list-panel');
  if (wp) wp.style.display = '';
  if (dl) dl.style.display = 'none';
}
function showDocList() {
  const wp = document.getElementById('writing-panel');
  const dl = document.getElementById('docs-list-panel');
  if (wp) wp.style.display = 'none';
  if (dl) dl.style.display = '';
}

// ---- Character Cards ----
async function renderCharCards() {
  const container = document.getElementById('oc-cards');
  if (!container) return;
  const sceneId = App.state.currentSceneId;
  if (!sceneId) return;
  const chars = await CharRepo.getAll(sceneId);
  if (chars.length === 0) {
    container.innerHTML = '<div style="text-align:center;color:var(--text-muted);padding:30px;font-size:var(--text-body-sm)">还没有角色卡</div>';
    return;
  }
  container.innerHTML = chars.map(ch => `
    <div class="char-card" data-char-id="${ch.id}">
      <div class="char-card-header">
        <span class="char-card-name">${ch.name || '未命名'}</span>
        <span class="char-card-delete" style="font-size:12px;color:var(--text-muted);cursor:pointer" data-char-id="${ch.id}">×</span>
      </div>
      ${ch.age ? '<div class="char-card-meta">年龄: ' + ch.age + '</div>' : ''}
      ${ch.identity ? '<div class="char-card-meta">身份: ' + ch.identity + '</div>' : ''}
      ${ch.personality ? '<div class="char-card-meta">性格: ' + ch.personality + '</div>' : ''}
      ${ch.background ? '<div class="char-card-meta">背景: ' + ch.background.slice(0, 60) + (ch.background.length > 60 ? '...' : '') + '</div>' : ''}
    </div>
  `).join('');

  container.querySelectorAll('.char-card-delete').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      if (confirm('删除此角色卡？')) {
        await CharRepo.remove(btn.dataset.charId);
        await renderCharCards();
        App.toast('已删除');
      }
    });
  });
}

// ---- Cover Visual ----
function startCoverVisual() {
  // Static vinyl record — no animation
}