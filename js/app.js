/* ============================================================
   灵感音域 — 主入口 & 状态管理
   ============================================================ */
const App = {
  state: {
    view: 'home',
    mainWorld: 'ancient',
    subWorld: null,
    currentSceneId: null,
    currentPlaylistId: null,
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
    // If virtual parent, navigate to first sub-scene
    if (cat.virtual) {
      const scenes = await SceneRepo.getByCategory(catKey);
      if (scenes.length > 0) await this.navigateToScene(scenes[0].id);
      return;
    }
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
    document.getElementById('world-bg').className = 'world-bg';
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
    this.state.currentPlaylistId = await PlaylistRepo._defaultPlaylistId(sceneId);
    await this.loadPlaylist();
    renderPlayer();
    renderProgress();
    renderPlaylistSelector();

    // Reset writing
    Writer.reset();

    this.clearSceneCache();
  },

  async loadPlaylist(playlistId) {
    const pid = playlistId || this.state.currentPlaylistId;
    const tracks = await PlaylistRepo.getTracksWithMeta(this.state.currentSceneId, pid);
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
    const panes = { playlist: 'pane-playlist', noise: 'pane-noise', oc: 'pane-oc', writing: 'pane-writing' };
    Object.entries(panes).forEach(([k, id]) => {
      const el = document.getElementById(id);
      if (el) el.style.display = k === mode ? 'flex' : 'none';
    });
    if (mode === 'playlist') { renderPlaylist(); renderPlaylistSelector(); }
    else if (mode === 'noise') renderNoise();
    else if (mode === 'oc') initOCPanel();
    else if (mode === 'writing') {
      if (Writer.currentDocId) App.showWritingEditor();
      else Writer.loadList();
    }
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

  updateSaveStatus(text) {},
  showWritingEditor() {
    const wp = document.getElementById('writing-panel');
    const dl = document.getElementById('docs-list-panel');
    const nav = document.getElementById('writing-nav');
    if (wp) wp.style.display = '';
    if (dl) dl.style.display = 'none';
    if (nav) nav.style.display = '';
    const btnNew = document.getElementById('btn-doc-new');
    const btnSave = document.getElementById('btn-doc-save');
    if (btnNew) btnNew.style.display = 'none';
    if (btnSave) btnSave.style.display = '';
    // Re-apply saved font
    const savedFont = localStorage.getItem('inspmusic_font') || 'default';
    const fontMap = { default: '', serif: '"Noto Serif SC","STSong","SimSun",serif', kai: '"STKaiti","KaiTi","楷体",serif', hei: '"Microsoft YaHei","PingFang SC","黑体",sans-serif', song: '"FangSong","仿宋",serif' };
    const family = fontMap[savedFont] || '';
    const we = document.getElementById('writing-editor');
    const dt = document.getElementById('doc-title');
    if (we) we.style.fontFamily = family;
    if (dt) dt.style.fontFamily = family;
  },
  showDocList() {
    const wp = document.getElementById('writing-panel');
    const dl = document.getElementById('docs-list-panel');
    const nav = document.getElementById('writing-nav');
    if (wp) wp.style.display = 'none';
    if (dl) dl.style.display = '';
    if (nav) nav.style.display = 'none';
    const btnNew = document.getElementById('btn-doc-new');
    const btnSave = document.getElementById('btn-doc-save');
    if (btnNew) btnNew.style.display = '';
    if (btnSave) btnSave.style.display = 'none';
  },
  renderPlayer() {},
  renderPlaylist() {},
  renderProgress() {},
  renderNoise() {},
};

App.renderPlayer = renderPlayer;
App.renderPlaylist = renderPlaylist;
App.renderProgress = renderProgress;
App.renderNoise = renderNoise;

// ---- Init ----
async function initApp() {
  try {
  App.state.volume = await SettingsRepo.get('volume', 0.7);
  App.state.loopMode = await SettingsRepo.get('loopMode', 0);
  App.state.shuffle = await SettingsRepo.get('shuffle', false);

  Player.init();
  Writer.init();

  await SceneRepo.initSystemScenes();

  // Try to restore previous session
  const restored = await restoreSession();
  if (!restored) {
    await renderHome();
  }

  setupDialogs();
  setupUploadDialog();
  setupEventDelegation();

  // Global drag-and-drop
  const dropOverlay = document.getElementById('world-drop-overlay');
  let dragCounter = 0;
  document.addEventListener('dragenter', e => {
    if (!e.dataTransfer.types.includes('Files')) return;
    if (App.state.view !== 'world') return;
    dragCounter++;
    if (dropOverlay) dropOverlay.classList.add('show');
  });
  document.addEventListener('dragleave', e => {
    if (!e.dataTransfer.types.includes('Files')) return;
    dragCounter--;
    if (dragCounter <= 0) { dragCounter = 0; if (dropOverlay) dropOverlay.classList.remove('show'); }
  });
  document.addEventListener('dragover', e => {
    if (!e.dataTransfer.types.includes('Files')) return;
    e.preventDefault();
  });
  document.addEventListener('drop', e => {
    dragCounter = 0;
    if (dropOverlay) dropOverlay.classList.remove('show');
    if (!e.dataTransfer.files.length) return;
    e.preventDefault();
    if (App.state.view !== 'world') return;
    if (e.target.closest('.dialog-overlay')) return;
    handleFiles(e.dataTransfer.files);
  });

  // Click on world-visual to open file picker
  const worldVisual = document.querySelector('.world-visual');
  if (worldVisual) {
    worldVisual.style.cursor = 'pointer';
    worldVisual.addEventListener('click', e => {
      if (e.target.closest('.panel-trigger') ||
          e.target.closest('.back-btn') || e.target.closest('.subworld-tab') ||
          e.target.closest('button') || e.target.closest('.panel-overlay')) return;
      document.getElementById('file-input').click();
    });
  }
  if (dropOverlay) {
    dropOverlay.addEventListener('click', () => document.getElementById('file-input').click());
  }

  // Forum card
  const forumCard = document.getElementById('forum-card-entry');
  if (forumCard) forumCard.addEventListener('click', () => App.navigateTo('forum'));

  startCoverVisual();
  startParticles();

  document.getElementById('vol-slider').value = Math.round(App.state.volume * 100);
  document.getElementById('vol-pct').textContent = Math.round(App.state.volume * 100) + '%';
  renderPlayer();
  renderProgress();

  console.log('InspMusic v2.0 ready');
  } catch(e) {
    console.error('initApp failed:', e);
    document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;color:rgba(255,255,255,0.7);font-family:sans-serif;text-align:center;padding:40px"><div><h2>加载失败</h2><p style="margin-top:12px;opacity:0.6">请尝试清除浏览器数据后刷新<br><span style="font-size:12px">' + (e.message || e) + '</span></p></div></div>';
  }
}

function showTabDropdown(anchor, sceneId) {
  document.querySelectorAll('.tab-dropdown').forEach(d => d.remove());
  const rect = anchor.getBoundingClientRect();
  const dd = document.createElement('div'); dd.className = 'tab-dropdown';
  dd.innerHTML = `<div class="td-item" data-action="edit" data-scene="${sceneId}">编辑场景</div><div class="td-item danger" data-action="delete" data-scene="${sceneId}">删除场景</div>`;
  dd.style.left = Math.min(rect.left, window.innerWidth - 150) + 'px';
  dd.style.bottom = (window.innerHeight - rect.top + 6) + 'px'; dd.style.top = 'auto';
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

// ---- OC Panel State (module-level, shared with setupEventDelegation) ----
let ocEditingId = null;
let ocEmpty, ocList, ocEditor;

function setupEventDelegation() {
  // Panel mode tabs
  document.getElementById('panel-overlay').addEventListener('click', e => {
    const modeBtn = e.target.closest('.panel-mode');
    if (modeBtn) App.setPanelMode(modeBtn.dataset.mode);
  });

  // Scene tabs
  document.getElementById('subworld-tabs').addEventListener('click', async e => {
    if (e.target.closest('.add-tab')) {
      App.showCreateDialog(App.state.currentCategory);
      return;
    }
    const menuBtn = e.target.closest('.tab-menu');
    if (menuBtn) {
      e.stopPropagation();
      showTabDropdown(menuBtn, menuBtn.dataset.scene);
      return;
    }
    const tab = e.target.closest('.subworld-tab');
    if (tab && tab.dataset.scene && tab.dataset.scene !== App.state.currentSceneId) {
      await App.navigateToScene(tab.dataset.scene);
    }
  });

  // Playlist selector
  document.getElementById('pl-selector').addEventListener('click', async e => {
    e.stopPropagation();
    document.querySelectorAll('.pl-dropdown').forEach(d => d.remove());
    const rect = document.getElementById('pl-selector').getBoundingClientRect();
    const playlists = await PlaylistRepo.getPlaylists(App.state.currentSceneId);
    const dd = document.createElement('div'); dd.className = 'pl-dropdown';
    dd.innerHTML = playlists.map(p => `
      <div class="pd-item${p.id === App.state.currentPlaylistId ? ' active' : ''}" data-pid="${p.id}">
        <span>${p.name}</span>
        <span class="pd-menu" data-action="delete" data-pid="${p.id}">×</span>
      </div>
    `).join('');
    dd.style.position = 'fixed';
    dd.style.left = Math.min(rect.left, window.innerWidth - 170) + 'px';
    dd.style.top = (rect.bottom + 4) + 'px';
    document.body.appendChild(dd);
    dd.querySelectorAll('.pd-item').forEach(item => {
      item.addEventListener('contextmenu', async e2 => {
        e2.preventDefault(); e2.stopPropagation();
        const pid = item.dataset.pid;
        const currentName = item.querySelector('span').textContent;
        const newName = prompt('重命名歌单：', currentName);
        if (newName && newName.trim() && newName.trim() !== currentName) {
          await PlaylistRepo.renamePlaylist(pid, newName.trim());
          await renderPlaylistSelector();
          dd.remove();
          App.toast('已改名');
        }
      });
      item.addEventListener('click', async e2 => {
        e2.stopPropagation();
        if (e2.target.closest('.pd-menu')) return;
        const pid = item.dataset.pid;
        if (pid !== App.state.currentPlaylistId) {
          App.state.currentPlaylistId = pid;
          Player.stop();
          await App.loadPlaylist(pid);
          renderPlayer();
          await renderPlaylistSelector();
        }
        dd.remove();
      });
    });
    dd.querySelectorAll('.pd-menu').forEach(btn => {
      btn.addEventListener('click', async e2 => {
        e2.stopPropagation();
        if (confirm('删除此歌单及其所有曲目？')) {
          await PlaylistRepo.deletePlaylist(btn.dataset.pid);
          if (App.state.currentPlaylistId === btn.dataset.pid) {
            App.state.currentPlaylistId = await PlaylistRepo._defaultPlaylistId(App.state.currentSceneId);
          }
          Player.stop();
          await App.loadPlaylist();
          renderPlayer();
          await renderPlaylistSelector();
          dd.remove();
        }
      });
    });
    setTimeout(() => {
      const h = e => { if (!dd.contains(e.target)) { dd.remove(); document.removeEventListener('click', h); } };
      document.addEventListener('click', h);
    }, 10);
  });

  // New playlist button
  document.getElementById('btn-playlist-new').addEventListener('click', async e => {
    e.stopPropagation();
    const name = prompt('新歌单名称：');
    if (!name || !name.trim()) return;
    const pid = await PlaylistRepo.createPlaylist(App.state.currentSceneId, name.trim());
    App.state.currentPlaylistId = pid;
    Player.stop();
    await App.loadPlaylist(pid);
    renderPlayer();
    await renderPlaylistSelector();
    App.toast('歌单已创建');
  });

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

  // Noise
  document.getElementById('pane-noise').addEventListener('click', async e => {
    const toggle = e.target.closest('.ni-toggle');
    if (toggle) { e.preventDefault(); e.stopPropagation(); await NoiseEngine.toggle(toggle.dataset.noise); }
  });
  document.getElementById('pane-noise').addEventListener('input', e => {
    const slider = e.target.closest('.ni-vol');
    if (slider) NoiseEngine.setVol(slider.dataset.noise, slider.value / 100);
  });
  document.getElementById('pane-noise').addEventListener('click', async e => {
    const btn = e.target.closest('.noise-preset');
    if (btn) await NoiseEngine.applyPreset(btn.dataset.preset);
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

  // Draggable progress bar
  let progressDragging = false;
  const progressTrack = document.getElementById('progress-track');
  progressTrack.addEventListener('click', e => Player.seek(e));
  progressTrack.addEventListener('mousedown', e => { progressDragging = true; Player.seek(e); });
  document.addEventListener('mousemove', e => { if (progressDragging) Player.seek(e); });
  document.addEventListener('mouseup', () => { progressDragging = false; });

  document.getElementById('vol-slider').addEventListener('input', e => {
    Player.setVolume(e.target.value);
    document.getElementById('vol-pct').textContent = e.target.value + '%';
  });

  // Panel
  document.getElementById('panel-trigger').addEventListener('click', () => App.togglePanel());
  document.getElementById('panel-close').addEventListener('click', () => App.closePanel());
  document.getElementById('panel-backdrop').addEventListener('click', () => App.closePanel());

  // Back buttons
  document.getElementById('back-btn').addEventListener('click', () => App.navigateTo('home'));
  document.getElementById('forum-back-btn').addEventListener('click', () => App.navigateTo('home'));

  // Copy/Import
  document.getElementById('btn-copy-to').addEventListener('click', async () => {
    const list = document.getElementById('dlg-copy-list');
    document.getElementById('dlg-copy-title').textContent = '复制当前歌单到';
    let html = '';
    const allScenes = await SceneRepo.getAll();
    for (const s of allScenes) {
      if (s.id === App.state.currentSceneId) continue;
      const pls = await PlaylistRepo.getPlaylists(s.id);
      if (pls.length === 0) continue;
      html += `<div style="font-size:var(--text-xs);color:var(--text-muted);padding:6px 8px 2px">${s.name}</div>`;
      for (const p of pls) {
        html += `<div class="scene-select-item" data-scene="${s.id}" data-pid="${p.id}"><div class="ss-info"><div class="ss-name">${p.name}</div><div class="ss-cat">${s.name}</div></div></div>`;
      }
    }
    if (!html) { App.toast('没有其他场景的歌单'); return; }
    list.innerHTML = html;
    list.querySelectorAll('.scene-select-item').forEach(item => {
      item.addEventListener('click', async () => {
        await PlaylistRepo.copyToPlaylist(App.state.currentSceneId, App.state.currentPlaylistId, item.dataset.pid, item.dataset.scene);
        App.showDialog('dlg-copy', false);
        App.toast('已复制');
      });
    });
    App.showDialog('dlg-copy', true);
  });

  document.getElementById('btn-copy-from').addEventListener('click', async () => {
    const list = document.getElementById('dlg-import-list');
    let html = '';
    const myPls = await PlaylistRepo.getPlaylists(App.state.currentSceneId);
    const otherMyPls = myPls.filter(p => p.id !== App.state.currentPlaylistId);
    if (otherMyPls.length > 0) {
      html += `<div style="font-size:var(--text-xs);color:var(--text-muted);padding:6px 8px 2px">当前场景</div>`;
      for (const p of otherMyPls) {
        html += `<div class="scene-select-item" data-scene="${App.state.currentSceneId}" data-pid="${p.id}"><div class="ss-info"><div class="ss-name">${p.name}</div><div class="ss-cat">同场景</div></div></div>`;
      }
    }
    const allScenes = await SceneRepo.getAll();
    for (const s of allScenes) {
      if (s.id === App.state.currentSceneId) continue;
      const pls = await PlaylistRepo.getPlaylists(s.id);
      if (pls.length === 0) continue;
      html += `<div style="font-size:var(--text-xs);color:var(--text-muted);padding:6px 8px 2px">${s.name}</div>`;
      for (const p of pls) {
        html += `<div class="scene-select-item" data-scene="${s.id}" data-pid="${p.id}"><div class="ss-info"><div class="ss-name">${p.name}</div><div class="ss-cat">${s.name}</div></div></div>`;
      }
    }
    if (!html) { App.toast('没有可导入的歌单'); return; }
    list.innerHTML = html;
    list.querySelectorAll('.scene-select-item').forEach(item => {
      item.addEventListener('click', async () => {
        await PlaylistRepo.copyToPlaylist(item.dataset.scene, item.dataset.pid, App.state.currentPlaylistId, App.state.currentSceneId);
        App.showDialog('dlg-import', false);
        await App.loadPlaylist();
        App.toast('已导入');
      });
    });
    App.showDialog('dlg-import', true);
  });

  // OC Panel
  ocEditingId = null;
  ocEmpty = document.getElementById('oc-empty');
  ocList = document.getElementById('oc-list');
  ocEditor = document.getElementById('oc-editor');

  document.getElementById('oc-btn-new').addEventListener('click', () => { clearOCForm(); setOCMode('editor'); });
  document.getElementById('oc-btn-save').addEventListener('click', saveOC);
  document.getElementById('oc-btn-listview').addEventListener('click', async () => { clearOCForm(); await showOCList(); });

  document.getElementById('oc-cards').addEventListener('click', async e => {
    const card = e.target.closest('[data-char-id]');
    if (!card || e.target.closest('.char-card-delete')) return;
    const id = card.dataset.charId;
    const chars = await CharRepo.getAll(App.state.currentSceneId);
    const ch = chars.find(c => c.id === id);
    if (!ch) return;
    ocEditingId = ch.id;
    document.getElementById('oc-edit-name').value = ch.name || '';
    document.getElementById('oc-edit-age').value = ch.age || '';
    document.getElementById('oc-edit-identity').value = ch.identity || '';
    document.getElementById('oc-edit-personality').value = ch.personality || '';
    document.getElementById('oc-edit-background').value = ch.background || '';
    setOCMode('editor');
  });

  // Writer buttons
  document.getElementById('btn-doc-save').addEventListener('click', () => Writer.save());
  document.getElementById('btn-doc-new').addEventListener('click', () => Writer.reset());
  document.getElementById('btn-doc-list').addEventListener('click', () => Writer.loadList());
  document.getElementById('btn-doc-float').addEventListener('click', () => Writer.openFloat());
  document.getElementById('btn-doc-prev').addEventListener('click', () => Writer.prevDoc());
  document.getElementById('btn-doc-next').addEventListener('click', () => Writer.nextDoc());

  // Font selector
  const fontEl = document.getElementById('font-selector');
  const fontMap = { default: '', serif: '"Noto Serif SC","STSong","SimSun",serif', kai: '"STKaiti","KaiTi","楷体",serif', hei: '"Microsoft YaHei","PingFang SC","黑体",sans-serif', song: '"FangSong","仿宋",serif' };
  const savedFont = localStorage.getItem('inspmusic_font') || 'default';
  const applyFont = (v) => {
    const family = fontMap[v || savedFont] || '';
    const we = document.getElementById('writing-editor');
    const fe = document.getElementById('fw-editor');
    const dt = document.getElementById('doc-title');
    const ft = document.getElementById('fw-title-input');
    if (we) we.style.fontFamily = family;
    if (fe) fe.style.fontFamily = family;
    if (dt) dt.style.fontFamily = family;
    if (ft) ft.style.fontFamily = family;
  };
  if (fontEl) {
    fontEl.value = savedFont;
    fontEl.addEventListener('change', () => { const v = fontEl.value; localStorage.setItem('inspmusic_font', v); applyFont(v); });
  }
  applyFont();

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
    Writer.markDirty();
    document.getElementById('float-writer').classList.remove('show');
    App.setPanelMode('writing');
    App.showWritingEditor();
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

  // Save session on unload
  window.addEventListener('beforeunload', () => {
    if (Writer.dirty && App.state.currentSceneId) {
      const title = document.getElementById('doc-title')?.value?.trim() || '未命名文档';
      const content = document.getElementById('writing-editor')?.innerHTML || '';
      DocsRepo.save(App.state.currentSceneId, Writer.currentDocId, title, content);
    }
    saveSession();
    SettingsRepo.set('volume', Player.volume);
    SettingsRepo.set('loopMode', Player.loopMode);
    SettingsRepo.set('shuffle', Player.shuffle);
  });
}

// ---- OC Panel Functions (module-level) ----
function clearOCForm() {
  ocEditingId = null;
  document.getElementById('oc-edit-name').value = '';
  document.getElementById('oc-edit-age').value = '';
  document.getElementById('oc-edit-identity').value = '';
  document.getElementById('oc-edit-personality').value = '';
  document.getElementById('oc-edit-background').value = '';
}

function setOCMode(mode) {
  if (ocEmpty) ocEmpty.style.display = mode === 'empty' ? '' : 'none';
  if (ocList) ocList.style.display = mode === 'list' ? '' : 'none';
  if (ocEditor) ocEditor.style.display = mode === 'editor' ? '' : 'none';
  const btnNew = document.getElementById('oc-btn-new');
  const btnSave = document.getElementById('oc-btn-save');
  if (btnNew) btnNew.style.display = mode === 'editor' ? 'none' : '';
  if (btnSave) btnSave.style.display = mode === 'editor' ? '' : 'none';
}

async function saveOC() {
  const data = {
    name: document.getElementById('oc-edit-name').value.trim(),
    age: document.getElementById('oc-edit-age').value.trim(),
    identity: document.getElementById('oc-edit-identity').value.trim(),
    personality: document.getElementById('oc-edit-personality').value.trim(),
    background: document.getElementById('oc-edit-background').value.trim(),
  };
  if (!data.name) { App.toast('请输入角色姓名'); return; }
  if (ocEditingId) await CharRepo.update(ocEditingId, data);
  else await CharRepo.add(App.state.currentSceneId, data);
  clearOCForm();
  App.toast('已保存');
  await showOCList();
}

async function showOCList() {
  await renderCharCards();
  const cards = await CharRepo.getAll(App.state.currentSceneId);
  setOCMode(cards.length === 0 ? 'empty' : 'list');
}

async function initOCPanel() {
  clearOCForm();
  await showOCList();
}

// ---- Dialogs ----
function setupDialogs() {
  const cs = document.getElementById('new-scene-cat');
  cs.innerHTML = Object.entries(WORLD_TREE).map(([k, w]) => `<option value="${k}">${w.name}</option>`).join('') + '<option value="custom">自定义分类</option>';

  let previewUrl = null;
  document.getElementById('new-scene-img').addEventListener('change', e => {
    const f = e.target.files[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      previewUrl = reader.result;
      document.getElementById('new-scene-preview').style.backgroundImage = `url(${previewUrl})`;
      document.getElementById('new-scene-preview').textContent = '';
    };
    reader.readAsDataURL(f);
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

  let editPreviewUrl = null, editingSceneId = null;
  document.getElementById('edit-scene-img').addEventListener('change', e => {
    const f = e.target.files[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (editPreviewUrl) URL.revokeObjectURL(editPreviewUrl);
      editPreviewUrl = reader.result;
      document.getElementById('edit-scene-preview').style.backgroundImage = `url(${editPreviewUrl})`;
      document.getElementById('edit-scene-preview').textContent = '';
    };
    reader.readAsDataURL(f);
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
      bgOpacity: parseInt(document.getElementById('edit-scene-opacity').value) / 100,
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
async function handleFiles(files) {
  const audioExts = ['.mp3','.wav','.ogg','.flac','.aac','.m4a','.wma','.opus','.weba','.m4b','.mp4','.aiff','.aif'];
  let a = 0;
  for (const f of files) {
    const isAudio = f.type.startsWith('audio/') || audioExts.some(ext => f.name.toLowerCase().endsWith(ext));
    if (!isAudio) continue;
    App.toast('正在导入: ' + f.name);
    await PlaylistRepo.addTrack(App.state.currentSceneId, { name: f.name.replace(/\.[^/.]+$/, ''), genre: '用户上传', duration: 0, type: 'user_upload', audioBlob: f });
    a++;
  }
  if (a > 0) {
    await App.loadPlaylist();
    App.toast('已添加 ' + a + ' 首');
    App.showDialog('dlg-upload', false);

    // Auto-detect duration
    for (const t of Player.playlist) {
      if (t.dur <= 0 && t.audioBlob) {
        try {
          await Player.ensureCtx();
          const buf = await t.audioBlob.arrayBuffer();
          const ab = await Player.audioCtx.decodeAudioData(buf);
          t.dur = Math.round(ab.duration);
          try { await DB.tracks.update(t.id, { duration: t.dur }); } catch(e) {}
        } catch(e) {}
      }
    }
    renderPlaylist();
    renderPlayer();
    renderProgress();
  } else {
    App.toast('未识别到音频文件（支持 mp3/wav/flac/aac/m4a）');
  }
}

function setupUploadDialog() {
  let uploadMode = 'file';
  function setMode(mode) {
    uploadMode = mode;
    document.querySelectorAll('[data-upload-mode]').forEach(m => m.classList.toggle('active', m.dataset.uploadMode === mode));
    document.getElementById('upload-pane-file').style.display = mode === 'file' ? '' : 'none';
    document.getElementById('upload-pane-url').style.display = mode === 'url' ? '' : 'none';
    document.getElementById('upload-pane-search').style.display = mode === 'search' ? '' : 'none';
  }
  document.querySelectorAll('[data-upload-mode]').forEach(m => m.addEventListener('click', () => setMode(m.dataset.uploadMode)));

  const ov = document.getElementById('dlg-upload');
  const show = () => { App.showDialog('dlg-upload', true); setMode('file'); };
  const hide = () => App.showDialog('dlg-upload', false);

  document.getElementById('pl-upload-btn').addEventListener('click', show);
  document.getElementById('btn-cancel-upload').addEventListener('click', hide);
  document.getElementById('btn-browse-file').addEventListener('click', () => document.getElementById('file-input').click());
  ov.addEventListener('click', e => { if (e.target === ov) hide(); });

  const dz = document.getElementById('upload-dropzone');
  dz.addEventListener('dragover', e => { e.preventDefault(); e.stopPropagation(); dz.style.borderColor = 'var(--accent)'; });
  dz.addEventListener('dragleave', () => dz.style.borderColor = '');
  dz.addEventListener('drop', e => { e.preventDefault(); e.stopPropagation(); dz.style.borderColor = ''; handleFiles(e.dataTransfer.files); });
  ov.addEventListener('dragover', e => { e.preventDefault(); });
  ov.addEventListener('drop', e => { e.preventDefault(); handleFiles(e.dataTransfer.files); });
  document.getElementById('file-input').addEventListener('change', () => {
    handleFiles(document.getElementById('file-input').files);
    document.getElementById('file-input').value = '';
  });

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

// ---- Particles ----
function startParticles() {
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

  let vParticles = [], vTime = 0;
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
        x: Math.random() * vc.width, y: Math.random() * vc.height,
        size: Math.random() * 3 + 1, speed: Math.random() * 0.8 + 0.3,
        opacity: Math.random() * 0.6 + 0.2,
        color: cfg.colors[Math.floor(Math.random() * cfg.colors.length)],
        angle: Math.random() * Math.PI * 2, wobble: Math.random() * 0.02, life: Math.random(),
      });
    }
  }

  function drawScene() {
    if (App.state.view !== 'world') { requestAnimationFrame(drawScene); return; }
    vResize(); vTime += 0.016;
    const scene = App.getCurrentSceneCached();
    const cfg = sceneConfigs[scene?.bgClass] || sceneConfigs.fantasy;
    vctx.clearRect(0, 0, vc.width, vc.height);
    const glowGrad = vctx.createRadialGradient(vc.width/2, vc.height/2, 0, vc.width/2, vc.height/2, Math.min(vc.width, vc.height) * 0.6);
    glowGrad.addColorStop(0, 'rgba(255,255,255,0.03)'); glowGrad.addColorStop(1, 'transparent');
    vctx.fillStyle = glowGrad; vctx.fillRect(0, 0, vc.width, vc.height);
    vParticles.forEach(p => {
      p.life += 0.003;
      if (p.life > 1) { p.life = 0; p.x = Math.random() * vc.width; p.y = vc.height + 10; }
      switch (cfg.type) {
        case 'petals':
          p.y += p.speed * 0.6; p.x += Math.sin(vTime * 2 + p.angle) * 0.4;
          if (p.y > vc.height + 20) { p.y = -20; p.x = Math.random() * vc.width; }
          vctx.save(); vctx.translate(p.x, p.y); vctx.rotate(Math.sin(vTime + p.angle) * 0.5);
          vctx.fillStyle = p.color; vctx.globalAlpha = p.opacity;
          vctx.fillRect(-p.size, -p.size * 0.5, p.size * 2, p.size);
          vctx.restore(); break;
        case 'magic':
          p.y -= p.speed * 0.5; p.x += Math.sin(vTime * 3 + p.angle) * 0.3;
          if (p.y < -20) { p.y = vc.height + 20; p.x = Math.random() * vc.width; }
          vctx.beginPath(); vctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          vctx.fillStyle = p.color; vctx.globalAlpha = p.opacity;
          vctx.shadowColor = p.color; vctx.shadowBlur = p.size * 3;
          vctx.fill(); vctx.shadowBlur = 0; break;
        case 'rain':
          p.y += p.speed * 2; p.x += Math.sin(vTime + p.angle) * 0.2;
          if (p.y > vc.height + 10) { p.y = -10; p.x = Math.random() * vc.width; }
          vctx.strokeStyle = p.color; vctx.globalAlpha = p.opacity * 0.7;
          vctx.lineWidth = 0.5; vctx.beginPath();
          vctx.moveTo(p.x, p.y); vctx.lineTo(p.x - 0.5, p.y + p.size * 3);
          vctx.stroke(); break;
        case 'dust':
          p.y -= p.speed * 0.2; p.x += (Math.random() - 0.5) * 0.3;
          if (p.y < -10) { p.y = vc.height + 10; p.x = Math.random() * vc.width; }
          vctx.beginPath(); vctx.arc(p.x, p.y, p.size * 0.8, 0, Math.PI * 2);
          vctx.fillStyle = p.color; vctx.globalAlpha = p.opacity * 0.5; vctx.fill(); break;
        case 'neonRain':
          p.y += p.speed * 2.5;
          if (p.y > vc.height + 10) { p.y = -10; p.x = Math.random() * vc.width; }
          vctx.strokeStyle = p.color; vctx.globalAlpha = p.opacity;
          vctx.lineWidth = 1; vctx.beginPath();
          vctx.moveTo(p.x, p.y); vctx.lineTo(p.x, p.y + p.size * 4);
          vctx.stroke(); vctx.shadowColor = p.color; vctx.shadowBlur = 4;
          vctx.stroke(); vctx.shadowBlur = 0; break;
        case 'embers':
          p.y -= p.speed * 0.7; p.x += (Math.random() - 0.5) * 0.6;
          if (p.y < -10) { p.y = vc.height + 10; p.x = Math.random() * vc.width; }
          vctx.beginPath(); vctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          vctx.fillStyle = p.color; vctx.globalAlpha = p.opacity;
          vctx.shadowColor = '#ff6600'; vctx.shadowBlur = p.size * 2;
          vctx.fill(); vctx.shadowBlur = 0; break;
        case 'fog':
          p.x += Math.sin(vTime * 0.5 + p.angle) * 0.5; p.y += p.speed * 0.15;
          if (p.x > vc.width + 50) p.x = -50; if (p.x < -50) p.x = vc.width + 50;
          vctx.beginPath(); vctx.arc(p.x, p.y, p.size * 6, 0, Math.PI * 2);
          vctx.fillStyle = p.color; vctx.globalAlpha = p.opacity * 0.3; vctx.fill(); break;
        case 'gears':
          p.y -= p.speed * 0.3; p.angle += 0.01;
          if (p.y < -20) { p.y = vc.height + 20; p.x = Math.random() * vc.width; }
          vctx.save(); vctx.translate(p.x, p.y); vctx.rotate(p.angle);
          vctx.fillStyle = p.color; vctx.globalAlpha = p.opacity;
          const s = p.size * 2;
          vctx.fillRect(-s/2, -s/6, s, s/3); vctx.fillRect(-s/6, -s/2, s/3, s);
          vctx.restore(); break;
        case 'stars':
          p.y += p.speed * 0.3; p.x += Math.sin(vTime * 0.3 + p.angle) * 0.2;
          if (p.y > vc.height + 10) { p.y = -10; p.x = Math.random() * vc.width; }
          p.opacity = 0.3 + Math.sin(vTime * 3 + p.angle) * 0.3;
          vctx.beginPath(); vctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          vctx.fillStyle = '#ffffff'; vctx.globalAlpha = Math.abs(p.opacity);
          vctx.shadowColor = '#ffffff'; vctx.shadowBlur = p.size * 2;
          vctx.fill(); vctx.shadowBlur = 0; break;
      }
      vctx.globalAlpha = 1;
    });
    requestAnimationFrame(drawScene);
  }
  initScene(); drawScene();

  const origNav = App.navigateToScene.bind(App);
  App.navigateToScene = async function(sceneId) {
    await origNav(sceneId);
    initScene();
  };
}

function debounce(fn, ms) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
}

// ---- Session Persistence ----
function saveSession() {
  const session = {
    view: App.state.view,
    sceneId: App.state.currentSceneId,
    playlistId: App.state.currentPlaylistId,
    category: App.state.currentCategory,
    panelOpen: App.panelOpen,
    panelMode: App.panelMode,
    currentTrackIdx: Player.currentIdx,
    noiseMasterVol: NoiseEngine.masterVol,
    activeNoises: {},
    currentDocId: Writer.currentDocId,
    fwLeft: document.getElementById('float-writer')?.style.left || '',
    fwTop: document.getElementById('float-writer')?.style.top || '',
  };
  for (const [id, n] of Object.entries(NoiseEngine.noises)) {
    if (n.playing) session.activeNoises[id] = { playing: true, volume: n.volume || 0.4 };
  }
  const titleEl = document.getElementById('doc-title');
  const editorEl = document.getElementById('writing-editor');
  if (titleEl && editorEl && Writer.dirty) {
    session._draftTitle = titleEl.value.trim();
    session._draftContent = editorEl.innerHTML;
    session._draftDocId = Writer.currentDocId;
  }
  localStorage.setItem('inspmusic_session', JSON.stringify(session));
}

async function restoreSession() {
  const raw = localStorage.getItem('inspmusic_session');
  if (!raw) return false;
  let session;
  try { session = JSON.parse(raw); } catch (e) { return false; }
  if (!session.view || !session.sceneId) return false;
  if (session.view !== 'world') { localStorage.removeItem('inspmusic_session'); return false; }
  const scene = await SceneRepo.getById(session.sceneId);
  if (!scene) { localStorage.removeItem('inspmusic_session'); return false; }

  await App.navigateToScene(session.sceneId);

  if (session.playlistId && session.playlistId !== App.state.currentPlaylistId) {
    App.state.currentPlaylistId = session.playlistId;
    await App.loadPlaylist(session.playlistId);
    renderPlayer();
    renderPlaylistSelector();
  }

  if (session.panelOpen) {
    App.panelMode = session.panelMode || 'playlist';
    App.openPanel();
  } else {
    App.panelMode = session.panelMode || 'playlist';
    App.closePanel();
  }

  if (session.currentTrackIdx >= 0 && session.currentTrackIdx < Player.playlist.length) {
    Player.currentIdx = session.currentTrackIdx;
    renderPlayer();
    renderPlaylist();
  }

  if (session.noiseMasterVol != null) {
    NoiseEngine.masterVol = session.noiseMasterVol;
    const nmSlider = document.getElementById('noise-master-vol');
    const nmPct = document.getElementById('noise-master-pct');
    if (nmSlider) nmSlider.value = Math.round(session.noiseMasterVol * 100);
    if (nmPct) nmPct.textContent = Math.round(session.noiseMasterVol * 100) + '%';
  }
  if (session.activeNoises) {
    for (const [id, state] of Object.entries(session.activeNoises)) {
      NoiseEngine.noises[id] = { playing: false, volume: state.volume || 0.4 };
    }
    renderNoise();
  }

  if (session.currentDocId) await Writer.load(session.currentDocId);

  if (session.fwLeft || session.fwTop) {
    const fw = document.getElementById('float-writer');
    if (fw) {
      if (session.fwLeft) fw.style.left = session.fwLeft;
      if (session.fwTop) fw.style.top = session.fwTop;
    }
  }

  if (session._draftDocId && session._draftContent) {
    Writer.currentDocId = session._draftDocId;
    const titleEl = document.getElementById('doc-title');
    const editorEl = document.getElementById('writing-editor');
    if (titleEl) titleEl.value = session._draftTitle || '';
    if (editorEl) editorEl.innerHTML = session._draftContent;
    Writer.markDirty();
  }

  return true;
}

document.addEventListener('DOMContentLoaded', initApp);