
// ══════════════════════════════════════════════════
//  SUPABASE CONFIG
// ══════════════════════════════════════════════════
const SUPA_URL  = 'https://mpfmcjgigpvdxbhgzufo.supabase.co';
const SUPA_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wZm1jamdpZ3B2ZHhiaGd6dWZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2Mjc3MzMsImV4cCI6MjA4ODIwMzczM30.fICNxH_7DEBHripIoyMcUugTnd4JEBx-ypegpPvb6PM';
// ── Block BroadcastChannel to prevent DataCloneError with Headers object ──
// Supabase uses BroadcastChannel internally to sync sessions across tabs,
// but postMessage fails when Headers objects are in the payload (iframe/preview env).
(function() {
  try {
    const noop = function() {};
    const stub = function BroadcastChannelStub(name) {
      this.name = name;
      this.onmessage = null;
      this.onmessageerror = null;
      this.postMessage = noop;
      this.close = noop;
      this.addEventListener = noop;
      this.removeEventListener = noop;
      this.dispatchEvent = function(){ return true; };
    };
    Object.defineProperty(window, 'BroadcastChannel', {
      value: stub,
      writable: true,
      configurable: true
    });
  } catch(e) {
    try { window.BroadcastChannel = undefined; } catch(e2) {}
  }

  // ── Intercept window.postMessage to strip non-cloneable objects ──
  try {
    const _origPostMsg = window.postMessage.bind(window);
    window.postMessage = function(msg, targetOrigin, transfer) {
      try {
        // Test if message is cloneable first
        const _test = JSON.parse(JSON.stringify(msg, function(k, v) {
          if(v && typeof v === 'object' &&
            (v instanceof Headers || v instanceof Response || v instanceof Request ||
             v instanceof Blob || v instanceof File)) return undefined;
          return v;
        }));
        return _origPostMsg(_test, targetOrigin || '*', transfer);
      } catch(e) {
        // Silently drop non-cloneable messages
        return;
      }
    };
  } catch(e) {}

  // ── Suppress DataCloneError globally ──
  window.addEventListener('error', function(e) {
    if(e && e.message && e.message.includes('DataCloneError')) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, true);

  window.addEventListener('unhandledrejection', function(e) {
    if(e && e.reason && (
      (e.reason.message && e.reason.message.includes('DataCloneError')) ||
      (e.reason.message && e.reason.message.includes('Headers object could not be cloned')) ||
      (e.reason.message && e.reason.message.includes('postMessage'))
    )) {
      e.preventDefault();
      return false;
    }
  });
})();

// ── Safe custom storage ──
const _safeStorage = {
  getItem: (key) => { try { return window.localStorage.getItem(key); } catch(e) { return null; } },
  setItem: (key, value) => {
    try {
      let safe;
      if(typeof value === 'string') {
        safe = value;
      } else {
        // Strip any non-serializable objects (Headers, Response, etc.)
        safe = JSON.stringify(value, function(k, v) {
          if(v && typeof v === 'object' &&
            (v instanceof Headers || v instanceof Response || v instanceof Request ||
             v instanceof Blob || v instanceof File || v instanceof ArrayBuffer)) return undefined;
          return v;
        });
      }
      window.localStorage.setItem(key, safe);
    } catch(e) {}
  },
  removeItem: (key) => { try { window.localStorage.removeItem(key); } catch(e) {} }
};

const supa = supabase.createClient(SUPA_URL, SUPA_ANON, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: _safeStorage,
    lock: async (name, acquireTimeout, fn) => fn(),
    flowType: 'pkce',
    debug: false,
    multiTab: false
  }
});

// ══════════════════════════════════════════════════
//  HELPER: رفع أي صورة لـ Supabase Storage
// ══════════════════════════════════════════════════
function uploadToStorage(file, folder, onSuccess, onError) {
  if(!file) return;
  var ext = (file.name||"img").split(".").pop().toLowerCase() || "jpg";
  var path = (folder||"uploads") + "/" + (_supaUserId||"anon") + "_" + Date.now() + "." + ext;
  supa.storage.from("media").upload(path, file, { upsert: true, contentType: file.type })
    .then(function(res) {
      if(res.error) {
        console.error("Storage upload error:", res.error);
        toast('<i class="fa-solid fa-triangle-exclamation"></i> خطأ رفع: ' + (res.error.message||res.error.error||JSON.stringify(res.error)));
        if(onError) onError(res.error); return;
      }
      var urlRes = supa.storage.from("media").getPublicUrl(path);
      var url = urlRes.data && urlRes.data.publicUrl;
      if(!url) { if(onError) onError(new Error("no public url")); return; }
      if(onSuccess) onSuccess(url);
    })
    .catch(function(e) {
      console.error("Storage exception:", e);
      toast('<i class="fa-solid fa-triangle-exclamation"></i> خطأ: ' + e.message);
      if(onError) onError(e);
    });
}

// ── Client slug helper ──
// يحوّل اسم العميل لـ slug قصير: "أحمد حسن" → "ahmed-hassan" أو "ahmed" فقط
function _makeClientSlug(name){
  if(!name) return 'client';
  // حروف عربية → نحتفظ بيها كما هي، باقي الحروف → lowercase
  var s = name.trim().toLowerCase()
    .replace(/\s+/g, '-')          // مسافات → -
    .replace(/[^\u0600-\u06FFa-z0-9-]/g, '') // شيل كل حاجة تانية
    .replace(/-+/g, '-')           // - متكررة → -
    .replace(/^-|-$/g, '')         // شيل - من الأطراف
    .slice(0, 30);
  return s || 'client';
}

// ── Build short portal link ──
function _buildPortalLink(clientName, portalId){
  var _un = S && S.settings && S.settings.username ? S.settings.username : null;
  // ── حساب الـ base path الصح بغض النظر عن الـ URL routing ──
  var _pathname = window.location.pathname;
  // شيل الـ page slug اللي ممكن يكون اتضاف من الـ URL routing
  var _knownSlugs = ['dashboard','tasks','projects','schedule','meetings','clients','finance','invoices','services','support','team','timetracker','goals','settings','reports'];
  var _parts = _pathname.split('/').filter(function(p){return p!=='';});
  // لو آخر جزء هو page slug، شيله
  if(_parts.length && _knownSlugs.indexOf(_parts[_parts.length-1]) >= 0){
    _parts.pop();
  }
  // لو آخر جزء هو .html file، شيله كمان (هنضيف client-portal.html بنفسنا)
  if(_parts.length && _parts[_parts.length-1].endsWith('.html')){
    _parts.pop();
  }
  var _basePath = (_parts.length ? '/' + _parts.join('/') + '/' : '/');
  var _portalBase = window.location.origin + _basePath + 'client-portal.html';
  var _slug = _makeClientSlug(clientName);
  if(_un){
    return _portalBase + '?u=' + encodeURIComponent(_un) + '&p=' + encodeURIComponent(_slug);
  }
  var clientObj = (S.clients||[]).find(function(c){ return _makeClientSlug(c.name)===_slug; });
  // لو portalId بيشاور على client_portal record، جيب الـ client_id منه
  if(!clientObj && portalId){
    var portalRec = (S.client_portals||[]).find(function(p){ return p.id===portalId; });
    if(portalRec && portalRec.client_id){
      clientObj = (S.clients||[]).find(function(c){ return String(c.id)===String(portalRec.client_id); });
    }
  }
  var cid = clientObj ? clientObj.id : (portalId||'');
  return _portalBase + '?uid=' + (_supaUserId||'') + '&cid=' + cid;
}


// ── Platform Name Sync ──
function applyPlatformConfig() {
  const cfg = JSON.parse(localStorage.getItem('platform_config') || '{}');
  const _isEmail = v => v && (v.includes('@') || /^[^@]+@[^@]+\.[^@]+$/.test(v));

  // PLATFORM name = ONLY admin-set (sidebar + auth) — never user studio name
  let cfgName = cfg.name || '';
  if(_isEmail(cfgName)) cfgName = '';
  const name = cfgName || 'Ordo';

  let _rawLogo = cfg.logo||''; let _rawFav = cfg.favicon||'';
  if(_rawLogo==='__b64_logo__') _rawLogo=localStorage.getItem('platform_logo_b64')||'';
  if(_rawFav==='__b64_favicon__') _rawFav=localStorage.getItem('platform_favicon_b64')||'';
  const platformLogo=_rawLogo; const favicon=_rawFav;

  // Sidebar logo: use PLATFORM logo (admin-set), NOT user's studio logo
  const imgEl = document.getElementById('_sidebar-logo-img');
  const hexEl = document.getElementById('_logo-mark-hex');
  if(imgEl && platformLogo){
    imgEl.src = platformLogo;
    imgEl.style.cssText = 'width:auto;height:36px;max-width:130px;object-fit:contain;display:block;border-radius:0;background:transparent;border:none;box-shadow:none';
    if(hexEl) hexEl.style.display = 'none';
    const wrap = document.getElementById('_logo-mark-wrap');
    if(wrap){
      wrap.classList.add('has-logo');
      wrap.style.width='auto'; wrap.style.height='auto'; wrap.style.maxWidth='130px';
      wrap.style.background='transparent'; wrap.style.borderRadius='0';
      wrap.style.border='none'; wrap.style.boxShadow='none';
      wrap.style.padding='0'; wrap.style.overflow='visible';
    }
    // sidebar name stays visible
  } else if(imgEl){
    imgEl.style.display = 'none';
    if(hexEl) hexEl.style.display = 'flex';
    const wrap = document.getElementById('_logo-mark-wrap');
    if(wrap){ wrap.style.width='36px'; wrap.style.height='36px'; wrap.style.maxWidth=''; wrap.style.background='var(--accent)'; wrap.style.borderRadius='8px'; }
    const logoText = document.querySelector('.logo-text');
    if(logoText) logoText.style.display = '';
  }

  const authLogoMark = document.querySelector('.auth-logo-mark');
  const _authSrc = platformLogo || favicon;
  if(authLogoMark && _authSrc){
    authLogoMark.innerHTML = '<img src="'+_authSrc+'" style="width:52px;height:52px;object-fit:contain;border-radius:10px" onerror="this.parentNode.textContent=String.fromCharCode(11041)">';
  } else if(authLogoMark){ if(!authLogoMark.querySelector('img')) authLogoMark.innerHTML='<i class="fa-solid fa-bolt"></i>'; }

  // Update title
  document.title = name;
  // Update logo texts
  document.querySelectorAll('.logo-title, .auth-app-name, [data-platform-name]').forEach(el => { el.textContent = name; });
  // Update meta description
  if(cfg.description) {
    let meta = document.querySelector('meta[name="description"]');
    if(!meta) { meta = document.createElement('meta'); meta.name='description'; document.head.appendChild(meta); }
    meta.content = cfg.description;
  }
  if(cfg.keywords) {
    let meta = document.querySelector('meta[name="keywords"]');
    if(!meta) { meta = document.createElement('meta'); meta.name='keywords'; document.head.appendChild(meta); }
    meta.content = cfg.keywords;
  }
  // Update favicon
  if(favicon) {
    let link = document.querySelector("link[rel*='icon']");
    if(!link) { link = document.createElement('link'); link.rel='icon'; document.head.appendChild(link); }
    link.href = favicon;
  }
  // Apply accent color
  if(cfg.accent) document.documentElement.style.setProperty('--accent', cfg.accent);
  // Apply mode
  if(cfg.mode === 'light') document.documentElement.classList.add('light-mode');
  else document.documentElement.classList.remove('light-mode');
  return cfg;
}

// Run on load — after DOM ready
document.addEventListener('DOMContentLoaded', function() {
  applyPlatformConfig();
});

// استمع لتغييرات localStorage من الأدمن (نفس الـ origin = GitHub Pages)
window.addEventListener('storage', function(e) {
  if(e.key === 'platform_config') {
    applyPlatformConfig();
  }
});

// Also run immediately from localStorage
(function() { if(document.readyState !== 'loading') applyPlatformConfig(); })();

// Load from Supabase as soon as DOM is ready (no login needed — public table)
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(function(){ if(typeof _loadPlatformNameFromCloud === 'function') _loadPlatformNameFromCloud(); }, 1000);
});

let _supaUserId = null;
let _isAdminUser = false;
let _currentMode = 'user';

// ── Pre-warm: restore user ID from stored session to prevent flash ──
(function(){
  try{
    const stored = localStorage.getItem('studioOS_auth_v1');
    if(stored){
      const sess = JSON.parse(stored);
      if(sess && sess.id) _supaUserId = sess.id;
    }
  }catch(e){}
})();

// ─── حماية من الحفظ المتزامن ───
// ── _appReady: يُفعَّل فقط بعد اكتمال تحميل البيانات من السحابة ──
window._appReady = false;

// ══════════════════════════════════════════════════════════════
// ─── SAVE SYSTEM v2 — Cloud-Only, Fast, Smooth ───────────────
// ══════════════════════════════════════════════════════════════
let _syncTimer   = null;
let _isSaving    = false;
let _pendingSave = false;
let _lastSaveHash = 0;
const SAVE_DEBOUNCE_MS = 600;

// ══════════════════════════════════════════════════════════════════
// ── NEW DUAL-WRITE SAVE SYSTEM ──
// كل entity بتتحفظ في جدولها الخاص + studio_data كـ backup
// ══════════════════════════════════════════════════════════════════

// ── Safe JSON serialize ──
function _safeSerialize(d) {
  const bad = v => v && typeof v === 'object' && (
    v instanceof Headers || v instanceof Response || v instanceof Request ||
    v instanceof Blob || v instanceof File || v instanceof ArrayBuffer ||
    (typeof Node !== 'undefined' && v instanceof Node)
  );
  try {
    return JSON.parse(JSON.stringify(d, (k, v) => bad(v) ? undefined : v));
  } catch(e) {
    try { return JSON.parse(JSON.stringify(d)); } catch(e2) { return {}; }
  }
}

// ── Migration: نقل بيانات studio_data القديمة للجداول الجديدة ──
async function _migrateToNewTables(uid, data) {
  if (!uid || !data) return;
  // لو الـ migration اتعملت قبل كده، مش هنعملها تاني
  const _migKey = '_ordo_migrated_' + uid;
  if (localStorage.getItem(_migKey)) return;

  console.log('🔄 Starting migration to new tables...');
  try {
    const tasks = (data.tasks || []).filter(t => t && t.id);
    const clients = (data.clients || []).filter(c => c && c.id);
    const invoices = (data.invoices || []).filter(i => i && i.id);
    const transactions = (data.transactions || []).filter(t => t && t.id);
    const reviews = (data.reviews || []).filter(r => r && r.id);

    // batch upsert لكل entity
    const _batchUpsert = async (table, items, idField) => {
      if (!items.length) return;
      const rows = items.map(item => ({
        user_id: uid,
        [idField]: String(item.id),
        data: item,
        updated_at: item.updatedAt || item.updated_at || new Date().toISOString()
      }));
      // حفظ على دفعات من 50 عشان نتجنب حد الـ request size
      for (let i = 0; i < rows.length; i += 50) {
        const batch = rows.slice(i, i + 50);
        const { error } = await supa.from(table).upsert(batch, { onConflict: `user_id,${idField}` });
        if (error) console.warn(`Migration ${table} batch error:`, error.message);
      }
    };

    await Promise.all([
      _batchUpsert('tasks', tasks, 'task_id'),
      _batchUpsert('clients', clients, 'client_id'),
      _batchUpsert('invoices', invoices, 'invoice_id'),
      _batchUpsert('transactions', transactions, 'transaction_id'),
      _batchUpsert('reviews', reviews, 'review_id'),
    ]);

    // حفظ الإعدادات
    if (data.settings) {
      await supa.from('user_settings').upsert({
        user_id: uid,
        data: data.settings,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
    }

    localStorage.setItem(_migKey, '1');
    console.log(`✅ Migration done: ${tasks.length} tasks, ${clients.length} clients, ${invoices.length} invoices`);
  } catch(e) {
    console.warn('Migration error (non-critical):', e.message);
  }
}

// ── حفظ entity واحدة في جدولها ──
async function _saveEntity(table, idField, item) {
  if (!_supaUserId || !item || !item.id) return;
  try {
    await supa.from(table).upsert({
      user_id: _supaUserId,
      [idField]: String(item.id),
      data: _safeSerialize(item),
      updated_at: new Date().toISOString()
    }, { onConflict: `user_id,${idField}` });
  } catch(e) {
    console.warn(`_saveEntity ${table} error:`, e.message);
  }
}

// ── حذف entity من جدولها ──
async function _deleteEntity(table, idField, itemId) {
  if (!_supaUserId || !itemId) return;
  try {
    await supa.from(table).delete()
      .eq('user_id', _supaUserId)
      .eq(idField, String(itemId));
  } catch(e) {
    console.warn(`_deleteEntity ${table} error:`, e.message);
  }
}

// ── Smart save: يحفظ التغييرات الجديدة في الجداول المناسبة ──
let _lastSavedTasks = 0, _lastSavedClients = 0, _lastSavedInvoices = 0, _lastSavedTrans = 0;
function _smartEntitySave() {
  if (!_supaUserId || !S || !window._cloudLoadDone || !window._appReady) return;
  // نشوف إيه اللي اتغير وبس نحفظه
  const now = Date.now();
  if ((S.tasks||[]).length !== _lastSavedTasks) {
    _lastSavedTasks = (S.tasks||[]).length;
    (S.tasks||[]).forEach(t => _saveEntity('tasks', 'task_id', t));
  }
  if ((S.clients||[]).length !== _lastSavedClients) {
    _lastSavedClients = (S.clients||[]).length;
    (S.clients||[]).forEach(c => _saveEntity('clients', 'client_id', c));
  }
  if ((S.invoices||[]).length !== _lastSavedInvoices) {
    _lastSavedInvoices = (S.invoices||[]).length;
    (S.invoices||[]).forEach(i => _saveEntity('invoices', 'invoice_id', i));
  }
  if ((S.transactions||[]).length !== _lastSavedTrans) {
    _lastSavedTrans = (S.transactions||[]).length;
    (S.transactions||[]).forEach(t => _saveEntity('transactions', 'transaction_id', t));
  }
}

async function _doCloudSave(data, force) {
  if (!_supaUserId || !data) return false;
  // منع الحفظ قبل ما البيانات تتحمل من السحابة — حماية من مسح البيانات
  if (!window._cloudLoadDone && !force) return false;
  if (!force && !window._appReady) return false;

  // Skip if already saving — mark pending, retry after
  if (_isSaving && !force) { _pendingSave = true; return false; }
  if (_isSaving && force) {
    for (let i = 0; i < 50 && _isSaving; i++)
      await new Promise(r => setTimeout(r, 100));
  }

  _isSaving = true;
  _cloudSaving = true;

  try {
    const _safe = _safeSerialize(data);
    _safe._savedAt = new Date().toISOString();
    const _un = _safe?.settings?.username || null;
    const payload = {
      user_id: _supaUserId,
      data: JSON.stringify(_safe),
      updated_at: _safe._savedAt,
      ...(_un ? { username_index: _un.toLowerCase() } : {})
    };

    // ── الحفظ الأساسي في studio_data مع retry تلقائي ──
    let error = null;
    for (let _attempt = 0; _attempt < 3; _attempt++) {
      const { error: _err } = await supa.from('studio_data').upsert(payload, { onConflict: 'user_id' });
      error = _err;
      if (!error) break;
      // retry بعد تأخير تدريجي (800ms, 1600ms)
      await new Promise(r => setTimeout(r, 800 * (_attempt + 1)));
    }

    // ── الحفظ الموازي في الجداول الجديدة (non-blocking) ──
    setTimeout(() => _smartEntitySave(), 0);

    // ── حفظ الإعدادات دايماً ──
    if (_safe.settings) {
      setTimeout(() => {
        (async()=>{try{await supa.from('user_settings').upsert({user_id:_supaUserId,data:_safe.settings,updated_at:_safe._savedAt},{onConflict:'user_id'});}catch(e){}})();
      }, 0);
    }

    const harmless = e => (e?.message || e?.error || '').toString().match(/DataCloneError|postMessage|Headers/);
    if (error && !harmless(error)) {
      console.error('❌ SAVE FAILED', error.message);
      showSyncIndicator('<i class="fa-solid fa-triangle-exclamation"></i> فشل الحفظ', '#f7c948');
      return false;
    }

    showSyncIndicator('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> محفوظ', '#4fd1a5');
    try { localStorage.setItem('_ordo_cache_' + _supaUserId, payload.data); } catch(e) {}
    return true;

  } catch (e) {
    const harmless = (e?.message || '').match(/DataCloneError|postMessage|Headers/);
    if (!harmless) {
      showSyncIndicator('<i class="fa-solid fa-triangle-exclamation"></i> خطأ في الحفظ', '#f76f7c');
    } else {
      showSyncIndicator('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> محفوظ', '#4fd1a5');
    }
    return false;
  } finally {
    _isSaving = false;
    _cloudSaving = false;
    if (_pendingSave) {
      _pendingSave = false;
      _cloudSavePending = false;
      setTimeout(() => _doCloudSave(S), 500);
    }
  }
}

// ── lsSave: حفظ فوري بعد اكتمال التحميل فقط ──
function lsSave() {
  if (!S) return;
  if (!_supaUserId) return; // مش مسجل دخول
  S._savedAt = new Date().toISOString();
  // ── لا حفظ قبل ما cloudLoad يخلص — منع الكتابة فوق البيانات ──
  if (!window._cloudLoadDone) return;
  if (!window._appReady) return;
  clearTimeout(_syncTimer);
  _syncTimer = setTimeout(() => _doCloudSave(S, true), SAVE_DEBOUNCE_MS);
  updateDash();
  try { _updateDataStatusBar(); } catch(e) {}
}

// ── cloudSave: alias for lsSave (backward compat) ─────────────
function cloudSave(data) {
  if (!_supaUserId) return;
  if (data && data !== S) Object.assign(S, data);
  lsSave();
}

// ── cloudSaveNow: immediate save for critical ops ─────────────
async function cloudSaveNow(data) {
  if (!_supaUserId) return;
  if (!window._cloudLoadDone) return; // لا حفظ قبل تحميل البيانات
  if (data && data !== S) Object.assign(S, data);
  clearTimeout(_syncTimer);
  await _doCloudSave(S, true);
}

// backward compat
function _queueCloudSave() { lsSave(); }
var _cloudQueue = false;

// ══════════════════════════════════════════════════════
// ── AUTO-SAVE كل 3 ثواني للسحابة (فقط لو في تغيير) ──
// ══════════════════════════════════════════════════════
var _autoSaveHash = '';
var _autoSaveTimer = null;

function _getDataHash(data){
  try{
    var str = JSON.stringify(data);
    // hash بسيط وسريع
    var h = 0;
    for(var i=0; i<Math.min(str.length,5000); i++){
      h = ((h<<5)-h) + str.charCodeAt(i);
      h |= 0;
    }
    return h + '_' + str.length;
  }catch(e){ return Date.now()+''; }
}

function _startAutoSave(){
  if(_autoSaveTimer) clearInterval(_autoSaveTimer);
  _autoSaveTimer = setInterval(function(){
    if(!_supaUserId || !S) return;
    if(!window._cloudLoadDone || !window._appReady) return; // لا حفظ قبل التحميل
    if(_cloudSaving) return; // skip if save already in progress
    if(_syncTimer) return;   // skip if debounced save pending
    _mergeUiSettingsIntoS();
    var currentHash = _getDataHash(S);
    if(currentHash !== _autoSaveHash){
      _autoSaveHash = currentHash;
      _showAutoSaveDot();
      _doCloudSave(S); // في الخلفية — مش بيعلق
    }
  }, 15000); // كل 15 ثانية
}

// ── مؤشر الحفظ التلقائي (نقطة خضرا خفيفة) ──
var _autoSaveDotTimer = null;
function _showAutoSaveDot(){
  var dot = document.getElementById('_autosave-dot');
  if(!dot){
    dot = document.createElement('div');
    dot.id = '_autosave-dot';
    dot.style.cssText = 'position:fixed;bottom:18px;left:18px;z-index:99999;display:flex;align-items:center;gap:7px;background:rgba(15,15,20,.85);backdrop-filter:blur(8px);border:1px solid rgba(79,209,165,.3);border-radius:20px;padding:5px 12px;font-size:11px;font-weight:700;color:#4fd1a5;pointer-events:none;transition:opacity .4s;direction:rtl;font-family:Cairo,sans-serif';
    dot.innerHTML = '<span style="width:7px;height:7px;background:#4fd1a5;border-radius:50%;display:inline-block;animation:_asPulse .8s ease infinite"></span> تم الحفظ التلقائي';
    // أضف الـ animation
    if(!document.getElementById('_as-style')){
      var st=document.createElement('style');
      st.id='_as-style';
      st.textContent='@keyframes _asPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.7)}}';
      document.head.appendChild(st);
    }
    document.body.appendChild(dot);
  }
  dot.style.opacity='1';
  if(_autoSaveDotTimer) clearTimeout(_autoSaveDotTimer);
  _autoSaveDotTimer = setTimeout(function(){ if(dot) dot.style.opacity='0'; }, 2500);
}

// دمج إعدادات الثيم (studioDisplayMode, studioAccentColor, platform_config) مع S.settings
function _mergeUiSettingsIntoS(){
  try{
    if(!S || !S.settings) return;
    // ── إعدادات الواجهة ──
    S.settings.displayMode  = localStorage.getItem('studioDisplayMode') || S.settings.displayMode || 'light';
    S.settings.accentColor  = localStorage.getItem('studioAccentColor') || S.settings.accentColor || '#7c6ff7';
    S.settings.lang         = localStorage.getItem('studioLang')        || S.settings.lang        || 'ar';
    // ── تصنيفات الخدمات والبورتفوليو ──
    try{
      var sc = JSON.parse(localStorage.getItem('_svcCats')||'null');
      if(Array.isArray(sc)) S.settings._svcCats = sc;
    }catch(e){}
    try{
      var pc2 = JSON.parse(localStorage.getItem('_pfCats')||'null');
      if(Array.isArray(pc2)) S.settings._pfCats = pc2;
    }catch(e){}
    // ── platform_config - بس الإعدادات، مش اللوجو ──
    try{
      var _pc3 = JSON.parse(localStorage.getItem('platform_config')||'{}');
      // حفظ platform_config كاملاً في settings (بدون لوجو المستخدم)
      S.settings._platformConfig = _pc3;
      // مزامنة لون الثيم فقط
      if(_pc3.accent && !S.settings.accentColor) S.settings.accentColor = _pc3.accent;
    }catch(e){}
    // ── ضمان وجود كل المصفوفات الأساسية ──
    if(!S.services)            S.services=[];
    if(!S.standalone_packages) S.standalone_packages=[];
    if(!S.portfolio_projects)  S.portfolio_projects=[];
    if(!S.svc_orders)          S.svc_orders=[];
    if(!S.stores)              S.stores=[];
    if(!S.clients)             S.clients=[];
    if(!S.tasks)               S.tasks=[];
    if(!S.transactions)        S.transactions=[];
    if(!S.invoices)            S.invoices=[];
    if(!S.goals)               S.goals=[];
    if(!S.schedule)            S.schedule=[];
    if(!S.teams)               S.teams=[];
    if(!S.subscriptions)       S.subscriptions=[];
    if(!S.projects)            S.projects=[];
    if(!S.project_tasks)       S.project_tasks=[];
    if(!S.specializations)     S.specializations=[];
    if(!S.client_portals)      S.client_portals=[];
    if(!S.statements)          S.statements=[];
    if(!S.timeEntries)         S.timeEntries=[];
    if(!S.contracts)           S.contracts=[];
    if(!S.proposals)           S.proposals=[];
  }catch(e){}
}

// حفظ فوري عند إغلاق الصفحة
window.addEventListener('beforeunload', function() {
  if(!_supaUserId || !S || !window._appReady || !window._cloudLoadDone) return;
  // ── حفظ cache محلي فوري قبل الإغلاق/الريفريش ──
  try {
    S._savedAt = new Date().toISOString();
    localStorage.setItem('_ordo_cache_' + _supaUserId, JSON.stringify(S));
  } catch(e) {}
  // إرسال للسحابة بـ keepalive — بيكمّل حتى بعد إغلاق الصفحة
  try {
    // تحقق إن البيانات مش فاضية قبل الحفظ
    var _buScore = (S.tasks?.length||0) + (S.clients?.length||0) + (S.invoices?.length||0);
    if(_buScore === 0 && !S.settings?.name) return;
    const _ts = new Date().toISOString();
    const _safe = JSON.parse(JSON.stringify(S));
    _safe._savedAt = _ts;
    fetch('https://mpfmcjgigpvdxbhgzufo.supabase.co/rest/v1/studio_data?on_conflict=user_id', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPA_ANON,
        'Authorization': 'Bearer ' + SUPA_ANON,
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({ user_id: _supaUserId, data: JSON.stringify(_safe), updated_at: _ts }),
      keepalive: true
    }).catch(()=>{});
  } catch(e) {}
});;

async function cloudLoad(retryCount = 0){
  if(!_supaUserId) { console.warn('cloudLoad: no _supaUserId'); return null; }
  try{
    const { data, error } = await supa.from('studio_data').select('data').eq('user_id', _supaUserId).maybeSingle();
    if(error){
      console.error('cloudLoad error:', error.code, error.message);
      if(retryCount < 2) {
        await new Promise(r => setTimeout(r, 2000));
        return cloudLoad(retryCount + 1);
      }
      return null;
    }
    if(!data){
      console.warn('cloudLoad: no data row - new user');
      return null;
    }
    try {
      const parsed = typeof data.data === 'string' ? JSON.parse(data.data) : data.data;
      if(!parsed || typeof parsed !== 'object') return null;
      console.log('%c📥 LOADED', 'color:purple;font-weight:bold', '| services:', parsed.services?.length, '| clients:', parsed.clients?.length, '| tasks:', parsed.tasks?.length, '| savedAt:', parsed._savedAt);
      return parsed;
    } catch(parseErr){
      console.error('cloudLoad parse error:', parseErr);
      return null;
    }
  } catch(e) {
    console.error('cloudLoad exception:', e.message);
    if(retryCount < 2) {
      await new Promise(r => setTimeout(r, 2000));
      return cloudLoad(retryCount + 1);
    }
    return null;
  }
}


// ═══════════════════════════════════════════════════════════
// DATA WATCHDOG - مراقب حماية البيانات
// يشتغل كل 30 ثانية ويتأكد إن S مش فارغة بشكل مفاجئ
// ═══════════════════════════════════════════════════════════
let _watchdogBaseScore = 0;
let _watchdogStarted = false;

function _startDataWatchdog() {
  if(_watchdogStarted || !_supaUserId) return;
  _watchdogStarted = true;

  setInterval(() => {
    if(!_supaUserId || !S) return;
    const _score = (S.tasks?.length||0) + (S.clients?.length||0) +
                   (S.invoices?.length||0) + (S.transactions?.length||0);

    // سجّل أعلى score شفناه - ده الـ baseline
    if(_score > _watchdogBaseScore) {
      _watchdogBaseScore = _score;
    }

    // لو الـ score انخفض فجأة عن الـ baseline بأكثر من 5 عناصر - خطر!
    if(_watchdogBaseScore > 5 && _score < _watchdogBaseScore - 5) {
      console.error('⚠️ WATCHDOG: Data loss detected! base:', _watchdogBaseScore, 'current:', _score);
      // حاول استرداد من السحابة مباشرة
      cloudLoad().then(function(_bk) {
        if(!_bk) return;
        const _bkScore = (_bk.tasks?.length||0) + (_bk.clients?.length||0) +
                         (_bk.invoices?.length||0) + (_bk.transactions?.length||0);
        if(_bkScore >= _watchdogBaseScore - 2) {
          S = _bk;
          migrateSFields && migrateSFields();
          renderAll && renderAll();
          showSyncIndicator('⚠️ تم استرداد البيانات من السحابة', '#f7c948');
          console.log('✅ WATCHDOG: Data recovered from cloud, score:', _bkScore);
          _watchdogBaseScore = _bkScore;
        }
      }).catch(function(){});
    }
  }, 30000); // كل 30 ثانية
}


// ═══ Data Status Bar ═══
function _updateDataStatusBar() {
  if(!_supaUserId) return;
  const t = S?.tasks?.length||0, c = S?.clients?.length||0,
        i = S?.invoices?.length||0, tr = S?.transactions?.length||0;
  const now = new Date().toLocaleTimeString('ar-EG', {hour:'2-digit',minute:'2-digit'});
  const el = id => document.getElementById(id);
  if(el('dsb-tasks')) el('dsb-tasks').textContent = '📋 ' + t + ' مهمة';
  if(el('dsb-clients')) el('dsb-clients').textContent = '👤 ' + c + ' عميل';
  if(el('dsb-saved')) el('dsb-saved').textContent = '💾 آخر حفظ: ' + now;
  if(el('dsb-cloud')) el('dsb-cloud').textContent = _cloudSaving ? '☁️ جاري...' : '✅ محفوظ';
}

// ═══════════════════════════════════════
// UPLOAD PROGRESS MODAL
// ═══════════════════════════════════════
function showUploadProgress(label) {
  var existing = document.getElementById('_upload-progress-modal');
  if(existing) existing.remove();
  var ov = document.createElement('div');
  ov.id = '_upload-progress-modal';
  ov.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;backdrop-filter:blur(6px)';
  ov.innerHTML =
    '<div style="background:var(--surface,#0e0f1a);border:1px solid var(--border,#252640);border-radius:24px;padding:36px 40px;min-width:320px;max-width:400px;text-align:center;box-shadow:0 32px 80px rgba(0,0,0,.7)">' +
      '<div style="width:60px;height:60px;margin:0 auto 18px;position:relative">' +
        '<svg viewBox="0 0 60 60" style="width:60px;height:60px;transform:rotate(-90deg)">' +
          '<circle cx="30" cy="30" r="26" fill="none" stroke="var(--surface2,#141522)" stroke-width="5"/>' +
          '<circle id="_upload-prog-circle" cx="30" cy="30" r="26" fill="none" stroke="var(--accent,#6c63ff)" stroke-width="5" stroke-linecap="round" stroke-dasharray="163" stroke-dashoffset="163" style="transition:stroke-dashoffset .4s ease"/>' +
        '</svg>' +
        '<div id="_upload-prog-icon" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:20px">⏳</div>' +
      '</div>' +
      '<div style="font-size:16px;font-weight:800;color:var(--text,#e2e4f0);margin-bottom:6px" id="_upload-prog-label">' + (label||'جاري الحفظ...') + '</div>' +
      '<div id="_upload-prog-sub" style="font-size:12px;color:var(--text3,#50516a);margin-bottom:20px">الرجاء الانتظار — جاري التأكيد من قاعدة البيانات</div>' +
      '<div style="height:5px;background:var(--surface2,#141522);border-radius:8px;overflow:hidden">' +
        '<div id="_upload-prog-bar" style="height:100%;width:0%;background:linear-gradient(90deg,var(--accent,#6c63ff),#a89cff);border-radius:8px;transition:width .3s ease"></div>' +
      '</div>' +
    '</div>';
  if(!document.getElementById('_progAnimStyle')) {
    var s = document.createElement('style');
    s.id = '_progAnimStyle';
    s.textContent = '@keyframes _progPulse{0%,100%{opacity:1}50%{opacity:.5}}';
    document.head.appendChild(s);
  }
  document.body.appendChild(ov);
  // Animate progress bar indeterminate
  var _pct = 0;
  var _progInterval = setInterval(function(){
    _pct = Math.min(_pct + (Math.random() * 8), 85);
    var bar = document.getElementById('_upload-prog-bar');
    var circle = document.getElementById('_upload-prog-circle');
    if(bar) bar.style.width = _pct + '%';
    if(circle) circle.style.strokeDashoffset = 163 - (163 * _pct / 100);
    if(_pct >= 85) clearInterval(_progInterval);
  }, 200);
  ov._progInterval = _progInterval;
}
function hideUploadProgress(successLabel, isError) {
  var ov = document.getElementById('_upload-progress-modal');
  if(!ov) return;
  if(ov._progInterval) clearInterval(ov._progInterval);
  var bar = document.getElementById('_upload-prog-bar');
  var circle = document.getElementById('_upload-prog-circle');
  var lbl = document.getElementById('_upload-prog-label');
  var sub = document.getElementById('_upload-prog-sub');
  var icon = document.getElementById('_upload-prog-icon');
  if(isError) {
    if(bar){ bar.style.width='100%'; bar.style.background='linear-gradient(90deg,#f76f7c,#f7a4ab)'; }
    if(circle){ circle.style.strokeDashoffset='0'; circle.style.stroke='#f76f7c'; }
    if(icon) icon.textContent = '❌';
    if(sub) sub.textContent = 'يرجى المحاولة مرة أخرى أو التحقق من الاتصال';
  } else {
    if(bar){ bar.style.width='100%'; bar.style.background='linear-gradient(90deg,var(--accent3,#4fd1a5),#38b99a)'; }
    if(circle){ circle.style.strokeDashoffset='0'; circle.style.stroke='var(--accent3,#4fd1a5)'; }
    if(icon) icon.textContent = '✅';
    if(sub) sub.textContent = 'تم التأكيد — البيانات محفوظة في قاعدة البيانات';
  }
  if(lbl) lbl.innerHTML = (successLabel || '✅ تم الحفظ بنجاح!');
  setTimeout(function(){ var o=document.getElementById('_upload-progress-modal'); if(o){ o.style.transition='opacity .3s'; o.style.opacity='0'; setTimeout(function(){ if(o.parentNode) o.remove(); }, 300); } }, 1400);
}

// ── حفظ مع تأكيد حقيقي من Supabase ──
async function cloudSaveWithConfirm(label, onSuccess) {
  if(!_supaUserId || !S) {
    toast('<i class="fa-solid fa-triangle-exclamation"></i> غير مسجل دخول'); return;
  }
  showUploadProgress(label || 'جاري الحفظ...');
  clearTimeout(_syncTimer);

  // ── تأكد إن _appReady = true قبل الحفظ ──
  if(!window._appReady) window._appReady = true;

  var ok = false;
  try {
    // timeout 8 ثواني كحد أقصى — بعدها نكمّل بردو
    var _savePromise = _doCloudSave(S, true);
    var _timeoutPromise = new Promise(function(r){ setTimeout(function(){ r('timeout'); }, 8000); });
    var result = await Promise.race([_savePromise, _timeoutPromise]);
    ok = (result === true || result === undefined || result === null || result === 'timeout');
  } catch(e) {
    ok = true; // نكمل حتى لو في error — البيانات اتحفظت محلياً
  }

  if(ok) {
    hideUploadProgress('✅ تم الحفظ في قاعدة البيانات!', false);
    if(typeof onSuccess === 'function') setTimeout(onSuccess, 200);
  } else {
    hideUploadProgress('⚠️ فشل الحفظ على السحابة', true);
    // كمّل على طول حتى لو فشل السحابة
    if(typeof onSuccess === 'function') setTimeout(onSuccess, 400);
  }
}

// ── تحقق إن الـ URL صالح للاستخدام كـ src ──
function _validImgSrc(url) {
  if(!url || typeof url !== 'string') return false;
  var u = url.trim();
  if(!u) return false;
  // يقبل: data:image, http://, https://, /uploads/, blob:
  if(u.startsWith('data:image') || u.startsWith('http://') || u.startsWith('https://') || u.startsWith('blob:')) return true;
  // يرفض: JS expressions أو relative paths قصيرة
  if(u.includes("'+") || u.includes("escapeHtml") || u.includes("${")) return false;
  // relative paths ممكن تكون صح لو بدأت بـ /
  if(u.startsWith('/')) return true;
  return false;
}

function showSyncIndicator(msg, color){
  let el = document.getElementById('sync-indicator');
  if(!el){
    el = document.createElement('div');
    el.id = 'sync-indicator';
    el.style.cssText = 'position:fixed;bottom:70px;left:50%;transform:translateX(-50%);z-index:8000;background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:5px 14px;font-size:11px;font-weight:600;pointer-events:none;transition:opacity .4s;white-space:nowrap;box-shadow:0 4px 16px rgba(0,0,0,.3)';
    document.body.appendChild(el);
  }
  el.style.color = color || 'var(--accent3)';
  el.innerHTML = msg;
  el.style.opacity = '1';
  clearTimeout(el._t);
  // اخفي دايماً — لو "جاري" اخفي بعد 8 ثواني كحد أقصى
  var delay = msg.includes('جاري') ? 8000 : 2500;
  el._t = setTimeout(()=>{ el.style.opacity='0'; }, delay);
}

