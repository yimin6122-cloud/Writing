/* ============================================================
   灵感音域 — IndexedDB 数据层
   依赖: Dexie.js (CDN)
   ============================================================ */
const DB = new Dexie('InspMusic');
DB.version(4).stores({
  scenes:          'id,type,category,name,createdAt',
  playlistEntries: '[sceneId+order],sceneId,trackId',
  tracks:          'id,type',
  settings:        'key',
  docs:            'id,sceneId,updatedAt',
  chars:           'id,sceneId,order',
});

// v5-v7: safety cleanup for stale upgrades
const _storesV7 = {
  scenes:          'id,type,category,name,createdAt',
  playlistEntries: '[sceneId+order],sceneId,trackId',
  tracks:          'id,type',
  settings:        'key',
  docs:            'id,sceneId,updatedAt',
  chars:           'id,sceneId,order',
  playlists:       '',  // leftover from failed v5/v6 upgrade
};
DB.version(5).stores(_storesV7);
DB.version(6).stores(_storesV7);
DB.version(7).stores(_storesV7).upgrade(async tx => {
  await tx.table('scenes').clear();
  await tx.table('playlistEntries').clear();
  await tx.table('tracks').clear();
  await tx.table('settings').clear();
  await tx.table('docs').clear();
  await tx.table('chars').clear();
});

// v9: 清理可能因 v8 升级失败导致的脏数据，重新初始化
DB.version(9).stores({
  scenes:          'id,type,category,name,createdAt',
  playlistEntries: '[sceneId+order],sceneId,trackId,playlistId',
  tracks:          'id,type',
  settings:        'key',
  docs:            'id,sceneId,updatedAt',
  chars:           'id,sceneId,order',
  playlists:       'id,sceneId,order',
}).upgrade(async tx => {
  console.log('DB v9: cleaning up for fresh start...');
  await tx.table('scenes').clear();
  await tx.table('playlistEntries').clear();
  await tx.table('tracks').clear();
  await tx.table('settings').clear();
  await tx.table('docs').clear();
  await tx.table('chars').clear();
  await tx.table('playlists').clear();
  console.log('DB v9: done');
});

// ---- Scene CRUD ----
const SceneRepo = {
  async initSystemScenes() {
    console.log('initSystemScenes: starting...');
    try {
    const existing = await DB.scenes.where({ type: 'system' }).toArray();
    const existingIds = new Set(existing.map(s => s.id));
    const scenes = [], entries = [], tracks = [];
    let newCount = 0;

    for (const [ck, cat] of Object.entries(WORLD_TREE)) {
      const sid = ck;
      const parentCategory = cat.category || ck;

      // Skip virtual parent entries — they group sub-scenes only
      const defaultPid = 'pl_default_' + ck;
      if (cat.virtual) {
        (cat.tracks || []).forEach((t, i) => {
          const tid = `sys_${ck}_${i}`;
          entries.push({ sceneId: sid, trackId: tid, order: i, playlistId: defaultPid });
          tracks.push({ id: tid, type: t.audioUrl ? 'external_url' : 'system_generated', name: t.name, genre: t.genre, duration: t.dur, worldKey: ck, subKey: null, trackIdx: i, audioUrl: t.audioUrl || null });
        });
        continue;
      }

      if (!existingIds.has(sid)) {
        newCount++;
        scenes.push({
          id: sid, type: 'system', category: parentCategory,
          name: cat.name, desc: cat.desc,
          bgImage: cat.defaultBg || null,
          bgOpacity: cat.defaultBg ? (cat.bgOpacity != null ? cat.bgOpacity : 0.4) : null,
          accent: cat.accent, accentGlow: cat.accentGlow,
          palette: cat.palette, bgClass: cat.bgClass,
          createdAt: new Date().toISOString(),
        });
      }
      // Always sync tracks — new config tracks should appear for existing scenes too
      (cat.tracks || []).forEach((t, i) => {
        const tid = `sys_${ck}_${i}`;
        entries.push({ sceneId: sid, trackId: tid, order: i, playlistId: defaultPid });
        tracks.push({ id: tid, type: t.audioUrl ? 'external_url' : 'system_generated', name: t.name, genre: t.genre, duration: t.dur, worldKey: ck, subKey: null, trackIdx: i, audioUrl: t.audioUrl || null });
      });
    }

    // Clean up stale scenes (ignore errors on fresh DB)
    try { await DB.scenes.where('id').startsWith('ancient/').delete(); } catch(e) {}
    try { await DB.scenes.delete('scheming'); } catch(e) {}
    try { await DB.scenes.delete('ancient'); } catch(e) {}

    if (scenes.length > 0) await DB.scenes.bulkPut(scenes);
    if (tracks.length > 0) await DB.tracks.bulkPut(tracks);
    // Ensure default playlists exist for all system scenes
    for (const sid of Object.keys(WORLD_TREE)) {
      const pid = 'pl_default_' + sid;
      if (!(await DB.playlists.get(pid))) {
        await DB.playlists.put({ id: pid, sceneId: sid, name: '默认歌单', order: 0, createdAt: new Date().toISOString() });
      }
    }
    // Rebuild system playlist entries (new tracks for all scenes)
    await DB.playlistEntries.where('trackId').startsWith('sys_').delete();
    for (const e of entries) {
      await DB.playlistEntries.put(e);
    }
    console.log('initSystemScenes: done, new=' + newCount + ', tracks=' + tracks.length + ', entries=' + entries.length);
    } catch(e) {
      console.error('initSystemScenes failed:', e);
    }
  },

  async getAll(type) {
    let q = DB.scenes.orderBy('createdAt');
    if (type) q = q.filter(s => s.type === type);
    return await q.reverse().toArray();
  },

  async getById(id) { return await DB.scenes.get(id); },

  async getByCategory(catKey) {
    return await DB.scenes.where({ category: catKey }).toArray();
  },

  async create(d) {
    const id = 'user_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    const s = {
      id, type: 'user', category: d.category,
      name: d.name, desc: d.desc || '',
      bgImage: d.bgImage || null,
      parentName: d.categoryName || '自定义',
      accent: d.accent || '#b98eff',
      accentGlow: d.accentGlow || 'rgba(185,142,255,0.35)',
      palette: d.palette || ['#c4a0ff'],
      bgClass: d.bgClass || 'fantasy',
      createdAt: new Date().toISOString(),
    };
    await DB.scenes.put(s);
    return s;
  },

  async update(id, u) { return await DB.scenes.update(id, u); },

  async remove(id) {
    const entries = await DB.playlistEntries.where({ sceneId: id }).toArray();
    for (const e of entries) {
      const t = await DB.tracks.get(e.trackId);
      if (t && t.type === 'user_upload') await DB.tracks.delete(e.trackId);
    }
    await DB.playlistEntries.where({ sceneId: id }).delete();
    await DB.docs.where({ sceneId: id }).delete();
    await DB.scenes.delete(id);
  },
};

// ---- Playlist CRUD ----
const PlaylistRepo = {
  /** 获取或创建场景的默认歌单 */
  async _defaultPlaylistId(sceneId) {
    const pid = 'pl_default_' + sceneId;
    const exists = await DB.playlists.get(pid);
    if (!exists) {
      await DB.playlists.put({ id: pid, sceneId, name: '默认歌单', order: 0, createdAt: new Date().toISOString() });
    }
    return pid;
  },

  /** 获取场景下的所有歌单 */
  async getPlaylists(sceneId) {
    return await DB.playlists.where({ sceneId }).sortBy('order');
  },

  /** 创建新歌单 */
  async createPlaylist(sceneId, name) {
    const all = await this.getPlaylists(sceneId);
    const id = 'pl_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    await DB.playlists.put({ id, sceneId, name, order: all.length, createdAt: new Date().toISOString() });
    return id;
  },

  /** 重命名歌单 */
  async renamePlaylist(id, name) {
    await DB.playlists.update(id, { name });
  },

  /** 删除歌单及其所有曲目 */
  async deletePlaylist(id) {
    await DB.playlistEntries.where({ playlistId: id }).delete();
    await DB.playlists.delete(id);
  },

  async getEntries(sceneId, playlistId) {
    const pid = playlistId || await this._defaultPlaylistId(sceneId);
    return await DB.playlistEntries.where({ sceneId, playlistId: pid }).sortBy('order');
  },

  async getTracksWithMeta(sceneId, playlistId) {
    const entries = await this.getEntries(sceneId, playlistId);
    const tracks = [];
    for (const e of entries) {
      const t = await DB.tracks.get(e.trackId);
      if (t) tracks.push({ ...t, entryOrder: e.order, playlistId: e.playlistId });
    }
    return tracks;
  },

  async addTrack(sceneId, td, playlistId) {
    const pid = playlistId || await this._defaultPlaylistId(sceneId);
    const tid = td.id || ('trk_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6));
    await DB.tracks.put({
      id: tid, type: td.type || 'user_upload',
      name: td.name, genre: td.genre || '',
      duration: td.duration || 0,
      audioBlob: td.audioBlob || null,
      audioUrl: td.audioUrl || null,
      worldKey: td.worldKey || null,
      subKey: td.subKey || null,
      trackIdx: td.trackIdx || null,
    });
    const entries = await this.getEntries(sceneId, pid);
    const order = entries.length > 0 ? Math.max(...entries.map(e => e.order)) + 1 : 0;
    await DB.playlistEntries.put({ sceneId, trackId: tid, order, playlistId: pid });
    return tid;
  },

  async removeTrack(sceneId, trackId) {
    await DB.playlistEntries.where({ sceneId, trackId }).delete();
  },

  async moveUp(sceneId, trackId, playlistId) {
    const pid = playlistId || await this._defaultPlaylistId(sceneId);
    const entries = await this.getEntries(sceneId, pid);
    const idx = entries.findIndex(e => e.trackId === trackId);
    if (idx <= 0) return;
    const [m] = entries.splice(idx, 1);
    entries.splice(idx - 1, 0, m);
    await DB.playlistEntries.bulkPut(entries.map((e, i) => ({ sceneId, trackId: e.trackId, order: i, playlistId: pid })));
  },

  async moveDown(sceneId, trackId, playlistId) {
    const pid = playlistId || await this._defaultPlaylistId(sceneId);
    const entries = await this.getEntries(sceneId, pid);
    const idx = entries.findIndex(e => e.trackId === trackId);
    if (idx < 0 || idx >= entries.length - 1) return;
    const [m] = entries.splice(idx, 1);
    entries.splice(idx + 1, 0, m);
    await DB.playlistEntries.bulkPut(entries.map((e, i) => ({ sceneId, trackId: e.trackId, order: i, playlistId: pid })));
  },

  async copyToScene(fromId, toId) {
    const fromTracks = await this.getTracksWithMeta(fromId);
    const toEntries = await this.getEntries(toId);
    const pid = await this._defaultPlaylistId(toId);
    let order = toEntries.length > 0 ? Math.max(...toEntries.map(e => e.order)) + 1 : 0;
    for (const t of fromTracks) {
      if (toEntries.some(e => e.trackId === t.id)) continue;
      await DB.playlistEntries.put({ sceneId: toId, trackId: t.id, order: order++, playlistId: pid });
    }
  },

  async importFromScene(toId, fromId) { return await this.copyToScene(fromId, toId); },

  async clear(sceneId) { await DB.playlistEntries.where({ sceneId }).delete(); },
};

// ---- Docs CRUD ----
const DocsRepo = {
  async getAll(sceneId) { return await DB.docs.where({ sceneId }).reverse().sortBy('updatedAt'); },
  async get(id) { return await DB.docs.get(id); },
  async save(sceneId, id, title, content) {
    const now = new Date().toISOString();
    if (id) {
      await DB.docs.update(id, { title, content, updatedAt: now });
      return id;
    } else {
      const nid = 'doc_' + Date.now();
      await DB.docs.put({ id: nid, sceneId, title, content, createdAt: now, updatedAt: now });
      return nid;
    }
  },
  async remove(id) { await DB.docs.delete(id); },
};

// ---- Character Cards ----
const CharRepo = {
  async getAll(sceneId) {
    try { return await DB.chars.where({ sceneId }).sortBy('order'); }
    catch(e) { console.error('CharRepo.getAll:', e); return []; }
  },
  async add(sceneId, data) {
    try {
      const all = await this.getAll(sceneId);
      const order = all.length;
      const id = 'char_' + Date.now();
      await DB.chars.put({ id, sceneId, order, ...data, name: data?.name || '', age: data?.age || '', identity: data?.identity || '', personality: data?.personality || '', background: data?.background || '' });
      return id;
    } catch(e) { console.error('CharRepo.add:', e); return null; }
  },
  async update(id, data) {
    try { await DB.chars.update(id, data); } catch(e) { console.error('CharRepo.update:', e); }
  },
  async remove(id) {
    try { await DB.chars.delete(id); } catch(e) { console.error('CharRepo.remove:', e); }
  },
};

// ---- Settings ----
const SettingsRepo = {
  async get(key, fb) { const s = await DB.settings.get(key); return s ? s.value : fb; },
  async set(key, value) { await DB.settings.put({ key, value }); },
};