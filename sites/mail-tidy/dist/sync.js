(function (root) {
  'use strict';
  const CACHE_VERSION = 1;
  const CACHE_PREFIX = 'mailroom-gmail-cache:';
  const CATEGORIES = new Set(['promo', 'sub', 'notice', 'bill', 'personal']);
  const normalize = email => String(email || '').trim().toLowerCase();

  class MailSync {
    constructor({ storage, api, classify, onProgress = () => {}, now = Date.now }) {
      Object.assign(this, { storage, api, classify, onProgress, now });
      this.selectAccount('');
    }
    selectAccount(email) {
      this.email = normalize(email);
      this.mails = [];
      this.historyId = '';
      this.lastSyncedAt = 0;
      this.limited = false;
      this.hasSnapshot = false;
      if (!this.email) return false;
      try {
        const saved = JSON.parse(this.storage.getItem(CACHE_PREFIX + this.email) || 'null');
        if (!saved || saved.version !== CACHE_VERSION || saved.email !== this.email ||
            !Array.isArray(saved.mails) || saved.mails.length > 2000 ||
            !Number.isFinite(saved.lastSyncedAt) || saved.lastSyncedAt <= 0 ||
            typeof saved.historyId !== 'string' || !/^\d+$/.test(saved.historyId) ||
            !saved.mails.every(m => m && typeof m.id === 'string' && typeof m.from === 'string' &&
              typeof m.subject === 'string' && typeof m.email === 'string' && Number.isFinite(m.date) &&
              Array.isArray(m.labels) && m.labels.every(l => typeof l === 'string') &&
              typeof m.trash === 'boolean' && CATEGORIES.has(m.cat) &&
              (!m.manualCat || CATEGORIES.has(m.manualCat))) ||
            new Set(saved.mails.map(m => m.id)).size !== saved.mails.length) return false;
        Object.assign(this, { mails: saved.mails, historyId: saved.historyId,
          lastSyncedAt: saved.lastSyncedAt, limited: !!saved.limited, hasSnapshot: true });
        return true;
      } catch { return false; }
    }
    commit(mails, historyId, lastSyncedAt, limited) {
      const saved = { version: CACHE_VERSION, email: this.email, mails, historyId, lastSyncedAt, limited };
      try { this.storage.setItem(CACHE_PREFIX + this.email, JSON.stringify(saved)); }
      catch { throw Error('浏览器无法保存整理进度，请检查可用存储空间或浏览器设置后重试。'); }
      // Publish the entire snapshot only after its durable write succeeds.
      Object.assign(this, { mails, historyId, lastSyncedAt, limited, hasSnapshot: true });
    }
    saveEdits(mails) {
      if (!this.hasSnapshot) throw Error('请先完成一次邮箱同步。');
      this.commit(mails, this.historyId, this.lastSyncedAt, this.limited);
    }
    forgetAccount() {
      if (this.email) this.storage.removeItem(CACHE_PREFIX + this.email);
      this.selectAccount('');
    }
    async details(ids, previous) {
      const loaded = [];
      for (let i = 0; i < ids.length; i += 5) {
        // Wait for every in-flight read before allowing a retry or account switch.
        const results = await Promise.allSettled(ids.slice(i, i + 5).map(async id => {
          try {
            const m = await this.api('messages/' + encodeURIComponent(id) +
              '?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=List-Unsubscribe');
            const labels = m.labelIds || [];
            const old = previous.get(id);
            const trash = labels.includes('TRASH');
            if (!labels.includes('INBOX') && !(old && trash)) return null;
            const hs = m.payload?.headers || [];
            const get = name => hs.find(h => h.name.toLowerCase() === name)?.value || '';
            const from = get('from'), subject = get('subject') || '（无主题）';
            const manualCat = CATEGORIES.has(old?.manualCat) ? old.manualCat : undefined;
            return { id: m.id, from: from.replace(/<.*>/, '').replaceAll('"', '').trim() || from,
              email: from.match(/<([^>]+)>/)?.[1] || from, subject, snippet: m.snippet || '',
              date: Number(m.internalDate), labels, unread: labels.includes('UNREAD'), trash,
              cat: manualCat || this.classify(subject, from, labels, hs), ...(manualCat ? { manualCat } : {}) };
          } catch (error) { if (error.status === 404) return null; throw error; }
        }));
        const failed = results.find(result => result.status === 'rejected');
        if (failed) throw failed.reason;
        loaded.push(...results.map(result => result.value).filter(Boolean));
        this.onProgress('正在读取与分类：' + Math.min(i + 5, ids.length) + ' / ' + ids.length + ' 封');
      }
      return loaded;
    }
    async full(profile) {
      const items = new Set();
      let nextPageToken = '';
      do {
        const params = new URLSearchParams({ maxResults: String(Math.min(500, 1000 - items.size)), labelIds: 'INBOX' });
        if (nextPageToken) params.set('pageToken', nextPageToken);
        const page = await this.api('messages?' + params);
        for (const item of page.messages || []) if (items.size < 1000) items.add(item.id);
        nextPageToken = page.nextPageToken || '';
        this.onProgress('正在核对收件箱：已找到 ' + items.size + ' 封（上限 1000 封）');
      } while (nextPageToken && items.size < 1000);
      const previous = new Map(this.mails.map(m => [m.id, m]));
      const loaded = await this.details([...items], previous);
      // Retain tracked trash after checking its current Gmail state as well.
      const trashIds = this.mails.filter(m => m.trash && !items.has(m.id)).map(m => m.id);
      const trash = await this.details(trashIds, previous);
      const combined = loaded.concat(trash);
      const inbox = combined.filter(m => !m.trash).sort((a, b) => b.date - a.date);
      const trackedTrash = combined.filter(m => m.trash).sort((a, b) => b.date - a.date);
      return { mails: inbox.slice(0, 1000).concat(trackedTrash.slice(0, 1000)), historyId: profile.historyId, limited: !!nextPageToken || inbox.length > 1000,
        changed: loaded.length, full: true };
    }
    async delta() {
      const changed = new Set();
      let nextPageToken = '', historyId = this.historyId;
      do {
        const params = new URLSearchParams({ startHistoryId: this.historyId, maxResults: '500' });
        if (nextPageToken) params.set('pageToken', nextPageToken);
        const page = await this.api('history?' + params);
        for (const record of page.history || []) {
          for (const field of ['messagesAdded', 'messagesDeleted', 'labelsAdded', 'labelsRemoved']) {
            for (const entry of record[field] || []) if (entry.message?.id) changed.add(entry.message.id);
          }
        }
        nextPageToken = page.nextPageToken || '';
        historyId = page.historyId || historyId;
      } while (nextPageToken);
      const previous = new Map(this.mails.map(m => [m.id, m]));
      const updated = await this.details([...changed], previous);
      const mails = this.mails.filter(m => !changed.has(m.id)).concat(updated);
      const inbox = mails.filter(m => !m.trash).sort((a, b) => b.date - a.date);
      const trash = mails.filter(m => m.trash).sort((a, b) => b.date - a.date);
      return { mails: inbox.slice(0, 1000).concat(trash.slice(0, 1000)), historyId,
        limited: this.limited || inbox.length > 1000, changed: changed.size, full: false };
    }
    async sync({ force = false, profile } = {}) {
      profile ||= await this.api('profile');
      const email = normalize(profile.emailAddress);
      if (!email || typeof profile.historyId !== 'string' || !/^\d+$/.test(profile.historyId)) throw Error('无法确认 Gmail 账号或同步进度。');
      if (this.email && email !== this.email) throw Error('Gmail 账号已改变，请重新连接后再同步。');
      if (!this.email) this.selectAccount(email);
      let result;
      if (force || !this.hasSnapshot) result = await this.full(profile);
      else {
        try { result = await this.delta(); }
        catch (error) {
          if (error.status !== 404) throw error;
          this.onProgress('Gmail 的变化记录已过期，正在重新核对收件箱…');
          const baseline = await this.api('profile');
          if (normalize(baseline.emailAddress) !== this.email) throw Error('Gmail 账号已改变，请重新连接。');
          if (typeof baseline.historyId !== 'string' || !/^\d+$/.test(baseline.historyId)) throw Error('无法确认 Gmail 同步进度。');
          result = await this.full(baseline);
        }
      }
      this.commit(result.mails, result.historyId, this.now(), result.limited);
      return result;
    }
  }
  const exported = { MailSync, CACHE_VERSION, CACHE_PREFIX };
  root.MailroomSync = exported;
  if (typeof module !== 'undefined' && module.exports) module.exports = exported;
})(globalThis);
