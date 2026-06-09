/* ============================================================
   灵感音域 — 主入口 & 状态管理
   ============================================================ */
const App = {
  state: {
    view: 'home',
    mainWorld: 'ancient',
    subWorld: null,
    currentSceneId: null,
    currentCategory: null,
    sidebarMode: 'player',
    sidebarCollapsed: false,
    volume: 0.7,
    loopMode: 0,
    shuffle: false,
  },

  _currentScene: null,

  getCurrentSceneCached() {
    return this._currentScene;
  },

  clearSceneCache() {
    this._currentScene = null;
  },

  // ---- Navigation ----
  navigateTo(view) {
    this.state.view = view;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    if (view === 'home') {
      Player.stop();
      document.getElementById('home-view').classList.add('active');
      renderHome();
    } else if (view === 'forum') {
      Player.stop();
      document.getElementById('forum-view').classList.add('active');
    }
  },

  async navigateToCategory(catKey) {
    const cat = WORLD_TREE[catKey];
    if (!cat) return;
    await this.navigateToScene(catKey);
  },

  async navigateToScene(sceneId) {
    Player.stop();
    this.clearSceneCache();

    const scene = await SceneRepo.getById(sceneId);
    if (!scene) { this.toast('场景不存在'); return; }

    this.state.currentSceneId = sceneId;
    this.state.mainWorld = scene.category;
    this.state.currentCategory = scene.category;
    this._currentScene = scene;

    // Apply theme
    document.documentElement.style.setProperty('--accent', scene.accent || '#b98eff');
    document.documentElement.style.setProperty('--accent-glow', scene.accentGlow || 'rgba(185,142,255,0.35)');

    this.state.view = 'world';
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('world-view').classList.add('active');

    // Background
    document.getElementById('world-bg').className = 'world-bg ' + (scene.bgClass || 'fantasy');
    const ib = document.getElementById('scene-image-bg');
    if (scene.bgImage) {
      ib.style.backgroundImage = `url(${scene.bgImage})`;
      ib.style.opacity = scene.bgOpacity != null ? scene.bgOpacity : 0.4;
    } else {
      ib.style.backgroundImage = '';
      ib.style.opacity = '0';
    }

    // Labels
    document.getElementById('world-name').textContent = scene.name;
    document.getElementById('world-desc').textContent = scene.desc || '';

    // Tabs
    await renderSceneTabs(scene.category, sceneId);

    // Playlist
    await this.loadPlaylist();
    renderPlayer();
    renderProgress();

    // Reset writing
    Writer.reset();

    this.clearSceneCache();
  },

  async loadPlaylist() {
    const tracks = await PlaylistRepo.getTracksWithMeta(this.state.currentSceneId);
    Player.playlist = tracks.map(t => ({
      id: t.id, name: t.name, genre: t.genre, dur: t.duration || 0,
      type: t.type, worldKey: t.worldKey, subKey: t.subKey, trackIdx: t.trackIdx,
      audioBlob: t.audioBlob, audioUrl: t.audioUrl, entryOrder: t.entryOrder,
      _cacheUrl: null,
    }));
    renderPlaylist();
  },

  // ---- Panel ----
  panelMode: 'playlist',
  panelOpen: false,

  openPanel() {
    this.panelOpen = true;
    document.getElementById('panel-overlay').classList.add('show');
    this.setPanelMode(this.panelMode);
  },

  closePanel() {
    this.panelOpen = false;
    document.getElementById('panel-overlay').classList.remove('show');
  },

  togglePanel() {
    if (this.panelOpen) this.closePanel();
    else this.openPanel();
  },

  setPanelMode(mode) {
    this.panelMode = mode;
    document.querySelectorAll('.panel-mode').forEach(m => {
      m.classList.toggle('active', m.dataset.mode === mode);
    });
    const panes = { playlist: 'pane-playlist', noise: 'pane-noise', inspire: 'pane-inspire', oc: 'pane-oc', writing: 'pane-writing' };
    Object.entries(panes).forEach(([k, id]) => {
      const el = document.getElementById(id);
      if (el) el.style.display = k === mode ? 'flex' : 'none';
    });
    if (mode === 'playlist') renderPlaylist();
    else if (mode === 'noise') renderNoise();
    else if (mode === 'oc') renderOC();
    else if (mode === 'writing') { if (!Writer.currentDocId) Writer.loadList(); }
  },

  // ---- Dialogs ----
  showCreateDialog(presetCat) {
    if (presetCat) document.getElementById('new-scene-cat').value = presetCat;
    this.showDialog('dlg-create', true);
  },

  showDialog(id, show) {
    const el = document.getElementById(id);
    if (el) {
      if (show) el.classList.add('show');
      else el.classList.remove('show');
    }
  },

  // ---- Utils ----
  toast(msg) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2600);
  },

  updateSaveStatus(text) { /* delegated to ui.js */ },
  showWritingEditor() { /* delegated to ui.js */ },
  showDocList() { /* delegated to ui.js */ },
  renderPlayer() { /* delegated to ui.js */ },
  renderPlaylist() { /* delegated to ui.js */ },
  renderProgress() { /* delegated to ui.js */ },
  renderNoise() { /* delegated to ui.js */ },
};

// Expose on App for cross-module access
App.updateSaveStatus = () => {}; // silent auto-save
App.showWritingEditor = () => { const wp = document.getElementById('writing-panel'); const dl = document.getElementById('docs-list-panel'); if (wp) wp.style.display = ''; if (dl) dl.style.display = 'none'; };
App.showDocList = () => { const wp = document.getElementById('writing-panel'); const dl = document.getElementById('docs-list-panel'); if (wp) wp.style.display = 'none'; if (dl) dl.style.display = ''; };
App.renderPlayer = renderPlayer;
App.renderPlaylist = renderPlaylist;
App.renderProgress = renderProgress;
App.renderNoise = renderNoise;

// ---- Init ----
async function initApp() {
  // Load preferences
  App.state.volume = await SettingsRepo.get('volume', 0.7);
  App.state.loopMode = await SettingsRepo.get('loopMode', 0);
  App.state.shuffle = await SettingsRepo.get('shuffle', false);

  Player.init();
  Writer.init();

  await SceneRepo.initSystemScenes();
  await renderHome();
  setupDialogs();
  setupUploadDialog();
  setupEventDelegation();
  startCoverVisual();
  startParticles();

  // Player UI
  document.getElementById('vol-slider').value = Math.round(App.state.volume * 100);
  document.getElementById('vol-pct').textContent = Math.round(App.state.volume * 100) + '%';
  renderPlayer();
  renderProgress();

  console.log('InspMusic v2.0 ready');
}

// Tab dropdown — must be defined before setupEventDelegation
function showTabDropdown(anchor, sceneId) {
  document.querySelectorAll('.tab-dropdown').forEach(d => d.remove());
  const rect = anchor.getBoundingClientRect();
  const dd = document.createElement('div'); dd.className = 'tab-dropdown';
  dd.innerHTML = `<div class="td-item" data-action="edit" data-scene="${sceneId}">编辑场景</div><div class="td-item danger" data-action="delete" data-scene="${sceneId}">删除场景</div>`;
  dd.style.left = Math.min(rect.left, window.innerWidth - 150) + 'px';
  dd.style.top = (rect.bottom + 6) + 'px';
  document.body.appendChild(dd);
  dd.querySelectorAll('.td-item').forEach(item => {
    item.addEventListener('click', async e => {
      e.stopPropagation();
      const action = item.dataset.action;
      const sid = item.dataset.scene;
      dd.remove();
      if (action === 'edit') openEditDialog(sid);
      else if (action === 'delete') {
        if (confirm('确定删除此场景？歌单也会被清空。')) {
          const delScene = await SceneRepo.getById(sid);
          await SceneRepo.remove(sid);
          App.clearSceneCache();
          const remaining = await SceneRepo.getByCategory(delScene.category);
          if (remaining.length > 0) await App.navigateToScene(remaining[0].id);
          else App.navigateTo('home');
          App.toast('已删除');
        }
      }
    });
  });
  setTimeout(() => {
    const h = e => { if (!dd.contains(e.target) && e.target !== anchor) { dd.remove(); document.removeEventListener('click', h); } };
    document.addEventListener('click', h);
  }, 10);
}

// ---- Event Delegation ----
function setupEventDelegation() {
  // Panel mode tabs
  document.getElementById('panel-overlay').addEventListener('click', e => {
    const modeBtn = e.target.closest('.panel-mode');
    if (modeBtn) App.setPanelMode(modeBtn.dataset.mode);
  });

  // Scene tabs (navigation + menu)
  document.getElementById('subworld-tabs').addEventListener('click', async e => {
    // "+" add tab
    if (e.target.closest('.add-tab')) {
      App.showCreateDialog(App.state.currentCategory);
      return;
    }
    // "..." menu
    const menuBtn = e.target.closest('.tab-menu');
    if (menuBtn) {
      e.stopPropagation();
      showTabDropdown(menuBtn, menuBtn.dataset.scene);
      return;
    }
    // Navigate
    const tab = e.target.closest('.subworld-tab');
    if (tab && tab.dataset.scene && tab.dataset.scene !== App.state.currentSceneId) {
      await App.navigateToScene(tab.dataset.scene);
    }
  });

  // Tab dropdown — self-contained, handles its own clicks
function showTabDropdown(anchor, sceneId) {
  document.querySelectorAll('.tab-dropdown').forEach(d => d.remove());
  const rect = anchor.getBoundingClientRect();
  const dd = document.createElement('div'); dd.className = 'tab-dropdown';
  dd.innerHTML = `<div class="td-item" data-action="edit" data-scene="${sceneId}">编辑场景</div><div class="td-item danger" data-action="delete" data-scene="${sceneId}">删除场景</div>`;
  dd.style.left = Math.min(rect.left, window.innerWidth - 150) + 'px';
  dd.style.top = (rect.bottom + 6) + 'px';
  document.body.appendChild(dd);
  // Click handlers on items
  dd.querySelectorAll('.td-item').forEach(item => {
    item.addEventListener('click', async e => {
      e.stopPropagation();
      const action = item.dataset.action;
      const sid = item.dataset.scene;
      dd.remove();
      if (action === 'edit') openEditDialog(sid);
      else if (action === 'delete') {
        if (confirm('确定删除此场景？歌单也会被清空。')) {
          const delScene = await SceneRepo.getById(sid);
          await SceneRepo.remove(sid);
          App.clearSceneCache();
          const remaining = await SceneRepo.getByCategory(delScene.category);
          if (remaining.length > 0) await App.navigateToScene(remaining[0].id);
          else App.navigateTo('home');
          App.toast('已删除');
        }
      }
    });
  });
  // Close on outside click
  setTimeout(() => {
    const h = e => { if (!dd.contains(e.target) && e.target !== anchor) { dd.remove(); document.removeEventListener('click', h); } };
    document.addEventListener('click', h);
  }, 10);
}

  // Playlist clicks
  document.getElementById('playlist-items').addEventListener('click', async e => {
    const reorderBtn = e.target.closest('.pl-reorder span');
    if (reorderBtn) {
      e.stopPropagation();
      const action = reorderBtn.dataset.action;
      const trackId = reorderBtn.dataset.track;
      if (action === 'up') await PlaylistRepo.moveUp(App.state.currentSceneId, trackId);
      else await PlaylistRepo.moveDown(App.state.currentSceneId, trackId);
      await App.loadPlaylist();
      return;
    }
    const removeBtn = e.target.closest('.pl-act[data-action="remove"]');
    if (removeBtn) {
      e.stopPropagation();
      await PlaylistRepo.removeTrack(App.state.currentSceneId, removeBtn.dataset.track);
      if (Player.playlist[Player.currentIdx]?.id === removeBtn.dataset.track) Player.stop();
      await App.loadPlaylist();
      renderPlayer();
      App.toast('已移除');
      return;
    }
    const item = e.target.closest('.pl-item');
    if (item) {
      const idx = parseInt(item.dataset.idx);
      idx !== Player.currentIdx ? Player.play(idx) : Player.toggle();
    }
  });

  // Noise panel — delegate from pane-noise (parent not rewritten)
  document.getElementById('pane-noise').addEventListener('click', e => {
    const toggle = e.target.closest('.ni-toggle');
    if (toggle) { e.preventDefault(); e.stopPropagation(); NoiseEngine.toggle(toggle.dataset.noise); }
  });
  document.getElementById('pane-noise').addEventListener('input', e => {
    const slider = e.target.closest('.ni-vol');
    if (slider) NoiseEngine.setVol(slider.dataset.noise, slider.value / 100);
  });
  document.getElementById('pane-noise').addEventListener('click', e => {
    const btn = e.target.closest('.noise-preset');
    if (btn) NoiseEngine.applyPreset(btn.dataset.preset);
  });
  document.getElementById('noise-master-vol').addEventListener('input', e => {
    NoiseEngine.setMasterVol(e.target.value);
    document.getElementById('noise-master-pct').textContent = e.target.value + '%';
  });

  // Writing
  document.getElementById('writing-editor').addEventListener('input', () => Writer.markDirty());
  document.getElementById('doc-title').addEventListener('input', () => Writer.markDirty());
  document.getElementById('fw-editor').addEventListener('input', () => {
    document.getElementById('writing-editor').innerHTML = document.getElementById('fw-editor').innerHTML;
    Writer.markDirty();
  });

  // Player controls
  document.getElementById('btn-play').addEventListener('click', () => Player.toggle());
  document.getElementById('btn-next').addEventListener('click', () => Player.next());
  document.getElementById('btn-prev').addEventListener('click', () => Player.prev());
  document.getElementById('btn-loop').addEventListener('click', () => Player.toggleLoop());
  document.getElementById('btn-shuffle').addEventListener('click', () => Player.toggleShuffle());
  document.getElementById('progress-track').addEventListener('click', e => Player.seek(e));
  document.getElementById('vol-slider').addEventListener('input', e => {
    Player.setVolume(e.target.value);
    document.getElementById('vol-pct').textContent = e.target.value + '%';
  });

  // Panel trigger
  document.getElementById('panel-trigger').addEventListener('click', () => App.togglePanel());
  document.getElementById('panel-close').addEventListener('click', () => App.closePanel());
  document.getElementById('panel-backdrop').addEventListener('click', () => App.closePanel());

  // Back buttons
  document.getElementById('back-btn').addEventListener('click', () => App.navigateTo('home'));
  document.getElementById('forum-back-btn').addEventListener('click', () => App.navigateTo('home'));

  // Playlist buttons
  document.getElementById('btn-copy-to').addEventListener('click', async () => {
    const all = await SceneRepo.getAll();
    const others = all.filter(s => s.id !== App.state.currentSceneId);
    if (others.length === 0) { App.toast('没有其他场景'); return; }
    const list = document.getElementById('dlg-copy-list');
    document.getElementById('dlg-copy-title').textContent = '复制歌单到';
    list.innerHTML = others.map(s => `<div class="scene-select-item" data-scene="${s.id}"><div class="ss-info"><div class="ss-name">${s.name}</div><div class="ss-cat">${s.parentName || s.category}</div></div></div>`).join('');
    list.querySelectorAll('.scene-select-item').forEach(item => {
      item.addEventListener('click', async () => {
        await PlaylistRepo.copyToScene(App.state.currentSceneId, item.dataset.scene);
        App.showDialog('dlg-copy', false);
        App.toast('已复制');
      });
    });
    App.showDialog('dlg-copy', true);
  });

  document.getElementById('btn-copy-from').addEventListener('click', async () => {
    const all = await SceneRepo.getAll();
    const others = all.filter(s => s.id !== App.state.currentSceneId);
    if (others.length === 0) { App.toast('没有其他场景'); return; }
    const list = document.getElementById('dlg-import-list');
    list.innerHTML = others.map(s => `<div class="scene-select-item" data-scene="${s.id}"><div class="ss-info"><div class="ss-name">${s.name}</div><div class="ss-cat">${s.parentName || s.category}</div></div></div>`).join('');
    list.querySelectorAll('.scene-select-item').forEach(item => {
      item.addEventListener('click', async () => {
        await PlaylistRepo.importFromScene(App.state.currentSceneId, item.dataset.scene);
        App.showDialog('dlg-import', false);
        await App.loadPlaylist();
        App.toast('已导入');
      });
    });
    App.showDialog('dlg-import', true);
  });

  // Inspire buttons
  document.getElementById('btn-inspire-scene').addEventListener('click', () => {
    const p = getRandomPrompt('scene');
    const el = document.getElementById('inspire-display');
    el.textContent = p; el.classList.add('active');
  });
  document.getElementById('btn-inspire-dialogue').addEventListener('click', () => {
    const p = getRandomPrompt('dialogue');
    const el = document.getElementById('inspire-display');
    el.textContent = p; el.classList.add('active');
  });
  document.getElementById('btn-inspire-plot').addEventListener('click', () => {
    const p = getRandomPrompt('plot');
    const el = document.getElementById('inspire-display');
    el.textContent = p; el.classList.add('active');
  });

  // OC buttons
  document.getElementById('btn-oc-generate').addEventListener('click', () => renderOC());
  document.getElementById('btn-oc-copy').addEventListener('click', () => {
    const fields = ['oc-name','oc-age','oc-identity','oc-personality','oc-background'];
    const labels = ['姓名','年龄','身份','性格','背景'];
    let text = '【OC人物设定卡】\n';
    fields.forEach((id, i) => {
      text += labels[i] + '：' + document.getElementById(id).textContent + '\n';
    });
    navigator.clipboard?.writeText(text).then(() => App.toast('已复制到剪贴板'));
  });
  document.getElementById('btn-doc-list').addEventListener('click', () => Writer.loadList());
  document.getElementById('btn-doc-back').addEventListener('click', () => App.showWritingEditor());
  document.getElementById('btn-doc-float').addEventListener('click', () => Writer.openFloat());

  // Float writer
  document.getElementById('fw-save').addEventListener('click', async () => {
    document.getElementById('writing-editor').innerHTML = document.getElementById('fw-editor').innerHTML;
    document.getElementById('doc-title').value = document.getElementById('fw-title-input').value;
    await Writer.save();
  });
  document.getElementById('fw-close').addEventListener('click', () => {
    document.getElementById('float-writer').classList.remove('show');
  });
  document.getElementById('fw-dock').addEventListener('click', () => {
    document.getElementById('writing-editor').innerHTML = document.getElementById('fw-editor').innerHTML;
    document.getElementById('doc-title').value = document.getElementById('fw-title-input').value;
    document.getElementById('float-writer').classList.remove('show');
    App.setPanelMode('writing');
    App.openPanel();
  });

  // Ctrl+S
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.code === 'KeyS') {
      if (document.activeElement?.closest('#writing-editor') || document.activeElement?.closest('#fw-editor')) {
        e.preventDefault();
        if (document.activeElement?.closest('#fw-editor')) {
          document.getElementById('writing-editor').innerHTML = document.getElementById('fw-editor').innerHTML;
        }
        Writer.save();
        return;
      }
    }
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
    if (App.state.view !== 'world') return;
    switch (e.code) {
      case 'Space': e.preventDefault(); Player.toggle(); break;
      case 'ArrowRight': e.preventDefault(); Player.next(); break;
      case 'ArrowLeft': e.preventDefault(); Player.prev(); break;
      case 'KeyL': e.preventDefault(); Player.toggleLoop(); break;
      case 'KeyS': e.preventDefault(); Player.toggleShuffle(); break;
    }
  });

  // Save prefs on unload
  window.addEventListener('beforeunload', () => {
    SettingsRepo.set('volume', Player.volume);
    SettingsRepo.set('loopMode', Player.loopMode);
    SettingsRepo.set('shuffle', Player.shuffle);
  });
}

// ---- Dialogs Setup ----
function setupDialogs() {
  const cs = document.getElementById('new-scene-cat');
  cs.innerHTML = Object.entries(WORLD_TREE).map(([k, w]) => `<option value="${k}">${w.name}</option>`).join('') + '<option value="custom">自定义分类</option>';

  let previewUrl = null;
  document.getElementById('new-scene-img').addEventListener('change', e => {
    const f = e.target.files[0]; if (!f) return;
    previewUrl = URL.createObjectURL(f);
    document.getElementById('new-scene-preview').style.backgroundImage = `url(${previewUrl})`;
    document.getElementById('new-scene-preview').textContent = '';
  });
  document.getElementById('btn-confirm-create').addEventListener('click', async () => {
    const name = document.getElementById('new-scene-name').value.trim();
    if (!name) { App.toast('请输入名称'); return; }
    const cat = document.getElementById('new-scene-cat').value;
    const ci = WORLD_TREE[cat] || { accent: '#b98eff', accentGlow: 'rgba(185,142,255,0.35)', palette: ['#c4a0ff'], bgClass: 'fantasy', name: '自定义' };
    const scene = await SceneRepo.create({
      name, category: cat === 'custom' ? 'custom' : cat,
      desc: document.getElementById('new-scene-desc').value.trim() || '',
      bgImage: previewUrl, categoryName: ci.name,
      accent: ci.accent, accentGlow: ci.accentGlow, palette: ci.palette, bgClass: ci.bgClass,
    });
    App.showDialog('dlg-create', false);
    clearCreateFields();
    await renderHome();
    await App.navigateToScene(scene.id);
    App.toast('场景创建成功');
  });
  document.getElementById('btn-cancel-create').addEventListener('click', () => { App.showDialog('dlg-create', false); clearCreateFields(); });
  function clearCreateFields() {
    document.getElementById('new-scene-name').value = '';
    document.getElementById('new-scene-desc').value = '';
    document.getElementById('new-scene-preview').style.backgroundImage = '';
    document.getElementById('new-scene-preview').textContent = '图片预览';
    document.getElementById('new-scene-img').value = '';
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = null;
  }

  // Edit dialog
  let editPreviewUrl = null, editingSceneId = null;
  document.getElementById('edit-scene-img').addEventListener('change', e => {
    const f = e.target.files[0]; if (!f) return;
    if (editPreviewUrl) URL.revokeObjectURL(editPreviewUrl);
    editPreviewUrl = URL.createObjectURL(f);
    document.getElementById('edit-scene-preview').style.backgroundImage = `url(${editPreviewUrl})`;
    document.getElementById('edit-scene-preview').textContent = '';
  });
  document.getElementById('edit-scene-opacity').addEventListener('input', e => {
    document.getElementById('edit-opacity-val').textContent = e.target.value + '%';
  });
  document.getElementById('btn-confirm-edit').addEventListener('click', async () => {
    if (!editingSceneId) return;
    const edScene = await SceneRepo.getById(editingSceneId);
    const u = {
      name: document.getElementById('edit-scene-name').value.trim(),
      desc: document.getElementById('edit-scene-desc').value.trim(),
    };
    const cat = WORLD_TREE[edScene.category];
    if (cat) { u.accent = cat.accent; u.accentGlow = cat.accentGlow; u.palette = cat.palette; u.bgClass = cat.bgClass; u.parentName = cat.name; }
    if (editPreviewUrl) u.bgImage = editPreviewUrl;
    await SceneRepo.update(editingSceneId, u);
    App.showDialog('dlg-edit', false);
    App.clearSceneCache();
    if (editingSceneId === App.state.currentSceneId) await App.navigateToScene(editingSceneId);
    await renderHome();
    App.toast('已更新');
  });
  document.getElementById('btn-cancel-edit').addEventListener('click', () => { App.showDialog('dlg-edit', false); editingSceneId = null; });
  document.getElementById('btn-delete-scene').addEventListener('click', async () => {
    if (!editingSceneId) return;
    if (confirm('确定删除此场景？')) {
      const delScene = await SceneRepo.getById(editingSceneId);
      const sid = editingSceneId;
      App.showDialog('dlg-edit', false);
      await SceneRepo.remove(sid);
      App.clearSceneCache();
      if (sid === App.state.currentSceneId) {
        const r = await SceneRepo.getByCategory(delScene.category);
        if (r.length > 0) await App.navigateToScene(r[0].id);
        else App.navigateTo('home');
      }
      await renderHome();
      App.toast('已删除');
      editingSceneId = null;
    }
  });
  document.getElementById('btn-cancel-copy').addEventListener('click', () => App.showDialog('dlg-copy', false));
  document.getElementById('btn-cancel-import').addEventListener('click', () => App.showDialog('dlg-import', false));

  // Expose for tab dropdown
  window._editSceneId = (v) => editingSceneId = v;
  window._editPreviewUrl = (v) => editPreviewUrl = v;
}

async function openEditDialog(sceneId) {
  const scene = await SceneRepo.getById(sceneId);
  if (!scene) return;
  window._editSceneId(sceneId);
  document.getElementById('edit-scene-name').value = scene.name || '';
  document.getElementById('edit-scene-desc').value = scene.desc || '';
  const opacity = scene.bgOpacity != null ? Math.round(scene.bgOpacity * 100) : 40;
  document.getElementById('edit-scene-opacity').value = opacity;
  document.getElementById('edit-opacity-val').textContent = opacity + '%';
  if (scene.bgImage) {
    document.getElementById('edit-scene-preview').style.backgroundImage = `url(${scene.bgImage})`;
    document.getElementById('edit-scene-preview').textContent = '';
  } else {
    document.getElementById('edit-scene-preview').style.backgroundImage = '';
    document.getElementById('edit-scene-preview').textContent = '无背景图';
  }
  App.showDialog('dlg-edit', true);
}

// ---- Upload ----
function setupUploadDialog() {
  let uploadMode = 'file';
  function setMode(mode) {
    uploadMode = mode;
    document.querySelectorAll('[data-upload-mode]').forEach(m => m.classList.toggle('active', m.dataset.uploadMode === mode));
    document.getElementById('upload-pane-file').style.display = mode === 'file' ? '' : 'none';
    document.getElementById('upload-pane-url').style.display = mode === 'url' ? '' : 'none';
    document.getElementById('upload-pane-search').style.display = mode === 'search' ? '' : 'none';
  }
  document.querySelectorAll('[data-upload-mode]').forEach(m => {
    m.addEventListener('click', () => setMode(m.dataset.uploadMode));
  });

  const ov = document.getElementById('dlg-upload');
  const show = () => { App.showDialog('dlg-upload', true); setMode('file'); };
  const hide = () => App.showDialog('dlg-upload', false);

  document.getElementById('pl-upload-btn').addEventListener('click', show);
  document.getElementById('btn-cancel-upload').addEventListener('click', hide);
  document.getElementById('btn-browse-file').addEventListener('click', () => document.getElementById('file-input').click());
  ov.addEventListener('click', e => { if (e.target === ov) hide(); });

  const dz = document.getElementById('upload-dropzone');
  dz.addEventListener('dragover', e => { e.preventDefault(); dz.style.borderColor = 'var(--accent)'; });
  dz.addEventListener('dragleave', () => dz.style.borderColor = '');
  dz.addEventListener('drop', e => { e.preventDefault(); dz.style.borderColor = ''; handleFiles(e.dataTransfer.files); });
  document.getElementById('file-input').addEventListener('change', () => {
    handleFiles(document.getElementById('file-input').files);
    document.getElementById('file-input').value = '';
  });

  async function handleFiles(files) {
    let a = 0;
    for (const f of files) {
      if (!f.type.startsWith('audio/')) continue;
      await PlaylistRepo.addTrack(App.state.currentSceneId, { name: f.name.replace(/\.[^/.]+$/, ''), genre: '用户上传', duration: 0, type: 'user_upload', audioBlob: f });
      a++;
    }
    if (a > 0) { await App.loadPlaylist(); App.toast('已添加 ' + a + ' 首'); hide(); }
  }

  document.getElementById('btn-add-url').addEventListener('click', async () => {
    const url = document.getElementById('url-input').value.trim();
    const name = document.getElementById('url-name').value.trim() || '外部曲目';
    if (!url) { App.toast('请输入链接'); return; }
    await PlaylistRepo.addTrack(App.state.currentSceneId, { name, genre: '外部链接', duration: 180, type: 'external_url', audioUrl: url });
    document.getElementById('url-input').value = '';
    document.getElementById('url-name').value = '';
    await App.loadPlaylist();
    App.toast('已添加');
    hide();
  });

  document.getElementById('btn-open-pixabay').addEventListener('click', () => {
    const genre = document.getElementById('search-genre').value;
    const cat = getMainWorld();
    const query = encodeURIComponent(genre + ' ' + cat.name + ' music');
    window.open('https://pixabay.com/music/search/' + query, '_blank');
    setMode('url');
    App.toast('找到音乐后复制下载链接粘贴到"粘贴链接"');
  });
}

// ---- World Scene Particles ----
function startParticles() {
  // Global background particles (subtle)
  const bgCanvas = document.getElementById('global-bg');
  const bgCtx = bgCanvas.getContext('2d');
  let w, h;
  const particles = Array.from({ length: 40 }, () => ({
    x: 0, y: Math.random() * window.innerHeight,
    size: Math.random() * 1.5 + 0.5,
    speed: Math.random() * 0.4 + 0.1,
    opacity: Math.random() * 0.4 + 0.1,
    reset() { this.x = Math.random() * w; this.y = -10; },
  }));
  function resize() { w = bgCanvas.width = window.innerWidth; h = bgCanvas.height = window.innerHeight; }
  window.addEventListener('resize', resize); resize();
  function bgFrame() {
    bgCtx.clearRect(0, 0, w, h);
    particles.forEach(p => {
      p.y += p.speed; if (p.y > h + 10) p.reset();
      bgCtx.beginPath(); bgCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      bgCtx.fillStyle = 'rgba(255,255,255,0.06)'; bgCtx.fill();
    });
    requestAnimationFrame(bgFrame);
  }
  bgFrame();

  // World visual canvas — theme-specific animations
  const vc = document.getElementById('visual-canvas');
  if (!vc) return;
  const vctx = vc.getContext('2d');

  function vResize() {
    const parent = vc.parentElement;
    if (!parent) return;
    vc.width = parent.offsetWidth;
    vc.height = parent.offsetHeight;
  }
  window.addEventListener('resize', vResize);

  // Scene state per theme
  let vParticles = [];
  let vTime = 0;
  const sceneConfigs = {
    ancient: { count: 50, type: 'petals', colors: ['#fbbf2488','#f59e0b66','#d9770644','#fde68a44'] },
    fantasy: { count: 40, type: 'magic', colors: ['#c4a0ff88','#a78bfa66','#d8b4fe44','#e9d5ff44'] },
    urban: { count: 60, type: 'rain', colors: ['#f472b666','#fb718544','#a78bfa44'] },
    republican: { count: 35, type: 'dust', colors: ['#d4a57466','#c4956a44','#f0d8b044'] },
    cyberpunk: { count: 55, type: 'neonRain', colors: ['#e040fb88','#00e5ff88','#7c4dff66'] },
    apocalypse: { count: 45, type: 'embers', colors: ['#ef444488','#f9731666','#fbbf2444'] },
    crime: { count: 30, type: 'fog', colors: ['#78909c44','#90a4ae33','#b0bec522'] },
    steampunk: { count: 40, type: 'gears', colors: ['#cd853f88','#daa52066','#d2b48c44'] },
    space: { count: 60, type: 'stars', colors: ['#38bdf888','#22d3ee66','#818cf844'] },
  };

  function initScene() {
    const scene = App.getCurrentSceneCached();
    const cfg = sceneConfigs[scene?.bgClass] || sceneConfigs.fantasy;
    vParticles = [];
    vResize();
    for (let i = 0; i < cfg.count; i++) {
      vParticles.push({
        x: Math.random() * vc.width,
        y: Math.random() * vc.height,
        size: Math.random() * 3 + 1,
        speed: Math.random() * 0.8 + 0.3,
        opacity: Math.random() * 0.6 + 0.2,
        color: cfg.colors[Math.floor(Math.random() * cfg.colors.length)],
        angle: Math.random() * Math.PI * 2,
        wobble: Math.random() * 0.02,
        life: Math.random(),
      });
    }
  }

  function drawScene() {
    if (App.state.view !== 'world') { requestAnimationFrame(drawScene); return; }
    vResize();
    vTime += 0.016;
    const scene = App.getCurrentSceneCached();
    const cfg = sceneConfigs[scene?.bgClass] || sceneConfigs.fantasy;

    vctx.clearRect(0, 0, vc.width, vc.height);

    // Draw center ambient glow
    const glowGrad = vctx.createRadialGradient(vc.width/2, vc.height/2, 0, vc.width/2, vc.height/2, Math.min(vc.width, vc.height) * 0.6);
    glowGrad.addColorStop(0, 'rgba(255,255,255,0.03)');
    glowGrad.addColorStop(1, 'transparent');
    vctx.fillStyle = glowGrad;
    vctx.fillRect(0, 0, vc.width, vc.height);

    vParticles.forEach(p => {
      p.life += 0.003;
      if (p.life > 1) { p.life = 0; p.x = Math.random() * vc.width; p.y = vc.height + 10; }

      switch (cfg.type) {
        case 'petals': // 古风：花瓣飘落
          p.y += p.speed * 0.6;
          p.x += Math.sin(vTime * 2 + p.angle) * 0.4;
          if (p.y > vc.height + 20) { p.y = -20; p.x = Math.random() * vc.width; }
          vctx.save(); vctx.translate(p.x, p.y); vctx.rotate(Math.sin(vTime + p.angle) * 0.5);
          vctx.fillStyle = p.color; vctx.globalAlpha = p.opacity;
          vctx.fillRect(-p.size, -p.size * 0.5, p.size * 2, p.size);
          vctx.restore();
          break;
        case 'magic': // 西幻：魔法光点上升
          p.y -= p.speed * 0.5;
          p.x += Math.sin(vTime * 3 + p.angle) * 0.3;
          if (p.y < -20) { p.y = vc.height + 20; p.x = Math.random() * vc.width; }
          vctx.beginPath(); vctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          vctx.fillStyle = p.color; vctx.globalAlpha = p.opacity;
          vctx.shadowColor = p.color; vctx.shadowBlur = p.size * 3;
          vctx.fill(); vctx.shadowBlur = 0;
          break;
        case 'rain': // 都市：细雨下落
          p.y += p.speed * 2;
          p.x += Math.sin(vTime + p.angle) * 0.2;
          if (p.y > vc.height + 10) { p.y = -10; p.x = Math.random() * vc.width; }
          vctx.strokeStyle = p.color; vctx.globalAlpha = p.opacity * 0.7;
          vctx.lineWidth = 0.5; vctx.beginPath();
          vctx.moveTo(p.x, p.y); vctx.lineTo(p.x - 0.5, p.y + p.size * 3);
          vctx.stroke();
          break;
        case 'dust': // 民国：尘埃漂浮
          p.y -= p.speed * 0.2;
          p.x += (Math.random() - 0.5) * 0.3;
          if (p.y < -10) { p.y = vc.height + 10; p.x = Math.random() * vc.width; }
          vctx.beginPath(); vctx.arc(p.x, p.y, p.size * 0.8, 0, Math.PI * 2);
          vctx.fillStyle = p.color; vctx.globalAlpha = p.opacity * 0.5;
          vctx.fill();
          break;
        case 'neonRain': // 赛博：霓虹雨滴
          p.y += p.speed * 2.5;
          if (p.y > vc.height + 10) { p.y = -10; p.x = Math.random() * vc.width; }
          vctx.strokeStyle = p.color; vctx.globalAlpha = p.opacity;
          vctx.lineWidth = 1; vctx.beginPath();
          vctx.moveTo(p.x, p.y); vctx.lineTo(p.x, p.y + p.size * 4);
          vctx.stroke();
          vctx.shadowColor = p.color; vctx.shadowBlur = 4;
          vctx.stroke(); vctx.shadowBlur = 0;
          break;
        case 'embers': // 废土：火星飘散
          p.y -= p.speed * 0.7;
          p.x += (Math.random() - 0.5) * 0.6;
          if (p.y < -10) { p.y = vc.height + 10; p.x = Math.random() * vc.width; }
          vctx.beginPath(); vctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          vctx.fillStyle = p.color; vctx.globalAlpha = p.opacity;
          vctx.shadowColor = '#ff6600'; vctx.shadowBlur = p.size * 2;
          vctx.fill(); vctx.shadowBlur = 0;
          break;
        case 'fog': // 悬疑：迷雾飘动
          p.x += Math.sin(vTime * 0.5 + p.angle) * 0.5;
          p.y += p.speed * 0.15;
          if (p.x > vc.width + 50) p.x = -50;
          if (p.x < -50) p.x = vc.width + 50;
          vctx.beginPath(); vctx.arc(p.x, p.y, p.size * 6, 0, Math.PI * 2);
          vctx.fillStyle = p.color; vctx.globalAlpha = p.opacity * 0.3;
          vctx.fill();
          break;
        case 'gears': // 蒸汽朋克：齿轮粒子
          p.y -= p.speed * 0.3;
          p.angle += 0.01;
          if (p.y < -20) { p.y = vc.height + 20; p.x = Math.random() * vc.width; }
          vctx.save(); vctx.translate(p.x, p.y); vctx.rotate(p.angle);
          vctx.fillStyle = p.color; vctx.globalAlpha = p.opacity;
          const s = p.size * 2;
          vctx.fillRect(-s/2, -s/6, s, s/3);
          vctx.fillRect(-s/6, -s/2, s/3, s);
          vctx.restore();
          break;
        case 'stars': // 太空：星空流转
          p.y += p.speed * 0.3;
          p.x += Math.sin(vTime * 0.3 + p.angle) * 0.2;
          if (p.y > vc.height + 10) { p.y = -10; p.x = Math.random() * vc.width; }
          p.opacity = 0.3 + Math.sin(vTime * 3 + p.angle) * 0.3;
          vctx.beginPath(); vctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          vctx.fillStyle = '#ffffff'; vctx.globalAlpha = Math.abs(p.opacity);
          vctx.shadowColor = '#ffffff'; vctx.shadowBlur = p.size * 2;
          vctx.fill(); vctx.shadowBlur = 0;
          break;
      }
      vctx.globalAlpha = 1;
    });
    requestAnimationFrame(drawScene);
  }

  initScene();
  drawScene();

  // Re-init when scene changes
  const origNav = App.navigateToScene.bind(App);
  App.navigateToScene = async function(sceneId) {
    await origNav(sceneId);
    initScene();
  };
}

// Start
document.addEventListener('DOMContentLoaded', initApp);
