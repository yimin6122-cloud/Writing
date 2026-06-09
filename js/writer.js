/* ============================================================
   灵感音域 — 写作功能
   ============================================================ */
const Writer = {
  currentDocId: null,
  currentTitle: '',
  dirty: false,
  autoSaveTimer: null,

  init() {
    this.startAutoSave();
  },

  markDirty() {
    if (!this.dirty) {
      this.dirty = true;
      App.updateSaveStatus('未保存');
    }
  },

  startAutoSave() {
    if (this.autoSaveTimer) clearInterval(this.autoSaveTimer);
    this.autoSaveTimer = setInterval(() => {
      if (this.dirty) this.save(true);
    }, 10000);
  },

  async save(silent) {
    const sceneId = App.state.currentSceneId;
    if (!sceneId) return;
    const title = document.getElementById('doc-title')?.value?.trim() || '未命名文档';
    const content = document.getElementById('writing-editor')?.innerHTML || '';
    this.currentDocId = await DocsRepo.save(sceneId, this.currentDocId, title, content);
    this.currentTitle = title;
    this.dirty = false;
    App.updateSaveStatus('已保存');
    if (!silent) App.toast('已保存');
  },

  async load(id) {
    const doc = await DocsRepo.get(id);
    if (!doc) return;
    this.currentDocId = doc.id;
    this.currentTitle = doc.title;
    this.dirty = false;
    App.updateSaveStatus('已保存');
    // Update DOM
    const titleEl = document.getElementById('doc-title');
    const editorEl = document.getElementById('writing-editor');
    if (titleEl) titleEl.value = doc.title;
    if (editorEl) editorEl.innerHTML = doc.content || '';
    App.showWritingEditor();
  },

  async loadList() {
    const sceneId = App.state.currentSceneId;
    if (!sceneId) return;
    const docs = await DocsRepo.getAll(sceneId);
    const list = document.getElementById('docs-list');
    if (!list) return;
    if (docs.length === 0) {
      list.innerHTML = '<div style="text-align:center;color:var(--text-muted);padding:40px;font-size:var(--text-body-sm)">还没有文档<br><span style="font-size:var(--text-caption)">点击"+ 新建"开始写作</span></div>';
    } else {
      list.innerHTML = docs.map(d => `
        <div class="doc-item${d.id === this.currentDocId ? ' active' : ''}" data-id="${d.id}">
          <span style="font-size:16px;width:28px;text-align:center">-</span>
          <div class="doc-info">
            <div class="doc-name">${d.title || '未命名'}</div>
            <div class="doc-meta">${new Date(d.updatedAt).toLocaleDateString('zh-CN')} · ${(d.content || '').replace(/<[^>]*>/g, '').slice(0, 50)}</div>
          </div>
          <div class="doc-actions">
            <span class="doc-act danger" data-action="delete" data-id="${d.id}">x</span>
          </div>
        </div>
      `).join('');

      list.querySelectorAll('.doc-item').forEach(item => {
        item.addEventListener('click', async e => {
          if (e.target.closest('.doc-act')) return;
          await this.load(item.dataset.id);
        });
      });
      list.querySelectorAll('.doc-act[data-action="delete"]').forEach(btn => {
        btn.addEventListener('click', async e => {
          e.stopPropagation();
          if (confirm('删除此文档？')) {
            await DocsRepo.remove(btn.dataset.id);
            if (this.currentDocId === btn.dataset.id) this.reset();
            await this.loadList();
            App.toast('已删除');
          }
        });
      });
    }
    App.showDocList();
  },

  reset() {
    this.currentDocId = null;
    this.currentTitle = '';
    this.dirty = false;
    const titleEl = document.getElementById('doc-title');
    const editorEl = document.getElementById('writing-editor');
    if (titleEl) titleEl.value = '';
    if (editorEl) editorEl.innerHTML = '';
    App.updateSaveStatus('已保存');
    App.showWritingEditor();
  },

  openFloat() {
    const sceneId = App.state.currentSceneId;
    if (!sceneId) return;
    const fw = document.getElementById('float-writer');
    const fwTitle = document.getElementById('fw-title-input');
    const fwEditor = document.getElementById('fw-editor');
    if (!fw || !fwEditor) return;
    if (fwTitle) fwTitle.value = this.currentTitle || document.getElementById('doc-title')?.value || '';
    fwEditor.innerHTML = document.getElementById('writing-editor')?.innerHTML || '';
    fw.classList.add('show');
    if (fw.offsetLeft < 0) fw.style.left = '60px';
    if (fw.offsetTop < 0) fw.style.top = '100px';
    fwEditor.focus();
  },
};

// ---- Float Writer Drag ----
(function setupFloatDrag() {
  let dragging = false, offX = 0, offY = 0;
  const fw = document.getElementById('float-writer');
  const titlebar = document.getElementById('fw-titlebar');
  if (!fw || !titlebar) return;

  titlebar.addEventListener('mousedown', e => {
    dragging = true;
    offX = e.clientX - fw.offsetLeft;
    offY = e.clientY - fw.offsetTop;
  });
  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    fw.style.left = (e.clientX - offX) + 'px';
    fw.style.top = (e.clientY - offY) + 'px';
  });
  document.addEventListener('mouseup', () => { dragging = false; });
})();
