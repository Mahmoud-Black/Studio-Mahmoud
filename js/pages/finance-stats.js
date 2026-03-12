
// ══════════════════════════════════════════════════════
// FINANCE STATS — إحصائيات المالية
// ══════════════════════════════════════════════════════
function _getStatsFilteredTx() {
  var period = (document.getElementById('stats-filter-period')||{}).value || 'this_year';
  var year = (document.getElementById('stats-filter-year')||{}).value || '';
  var month = (document.getElementById('stats-filter-month')||{}).value || '';
  var from = (document.getElementById('stats-from')||{}).value || '';
  var to = (document.getElementById('stats-to')||{}).value || '';
  var now = new Date();
  var txs = S.transactions || [];

  // Show/hide custom range
  var customWrap = document.getElementById('stats-custom-range');
  var yearSel = document.getElementById('stats-filter-year');
  var monthSel = document.getElementById('stats-filter-month');
  if(customWrap) customWrap.style.display = period === 'custom' ? 'flex' : 'none';
  if(yearSel) yearSel.style.display = ['all','custom','this_month','last_month'].includes(period) ? 'none' : '';
  if(monthSel) monthSel.style.display = ['this_month','last_month','custom'].includes(period) ? 'none' : '';

  return txs.filter(function(t) {
    var d = new Date(t.isoDate || t.date || '');
    if(isNaN(d)) return false;
    if(period === 'this_month') return d.getFullYear()===now.getFullYear()&&d.getMonth()===now.getMonth();
    if(period === 'last_month') {
      var lm = new Date(now.getFullYear(), now.getMonth()-1, 1);
      return d.getFullYear()===lm.getFullYear()&&d.getMonth()===lm.getMonth();
    }
    if(period === 'this_year') return d.getFullYear()===now.getFullYear();
    if(period === 'last_year') return d.getFullYear()===(now.getFullYear()-1);
    if(period === 'custom') {
      if(from && d < new Date(from)) return false;
      if(to && d > new Date(to+'T23:59:59')) return false;
      return true;
    }
    // period = 'all' → apply manual year/month filters
    if(year && d.getFullYear() !== parseInt(year)) return false;
    if(month && (d.getMonth()+1) !== parseInt(month)) return false;
    return true;
  });
}

function _populateStatsYears() {
  var sel = document.getElementById('stats-filter-year');
  if(!sel) return;
  var years = new Set();
  (S.transactions||[]).forEach(function(t){
    var d = new Date(t.isoDate||t.date||'');
    if(!isNaN(d)) years.add(d.getFullYear());
  });
  var cur = sel.value;
  sel.innerHTML = '<option value="">كل السنوات</option>' +
    Array.from(years).sort(function(a,b){return b-a;}).map(function(y){
      return '<option value="'+y+'"'+(String(y)===cur?' selected':'')+'>'+ y+'</option>';
    }).join('');
}

function renderFinStats() {
  _populateStatsYears();
  var txs = _getStatsFilteredTx();
  var cur = _getCurrency();
  var inc = txs.filter(function(t){return t.type==='income';}).reduce(function(s,t){return s+t.amount;},0);
  var exp = txs.filter(function(t){return t.type==='expense';}).reduce(function(s,t){return s+t.amount;},0);
  var net = inc - exp;

  // ── Summary cards ──
  var sc = document.getElementById('stats-summary-cards');
  if(sc) sc.innerHTML = [
    {icon:'fa-coins',label:'إجمالي الدخل',val:inc.toLocaleString()+' '+cur,color:'var(--accent3)'},
    {icon:'fa-money-bill-wave',label:'إجمالي المصروفات',val:exp.toLocaleString()+' '+cur,color:'var(--accent4)'},
    {icon:'fa-chart-line',label:'صافي الربح',val:net.toLocaleString()+' '+cur,color:net>=0?'var(--accent3)':'var(--accent4)'},
    {icon:'fa-percent',label:'هامش الربح',val:inc?Math.round(net/inc*100)+'%':'—',color:'var(--accent)'}
  ].map(function(c){
    return '<div class="card"><div class="stat-label"><i class="fa-solid '+c.icon+'"></i> '+c.label+'</div><div class="stat-value" style="color:'+c.color+'">'+c.val+'</div></div>';
  }).join('');

  // ── Expense categories breakdown ──
  var catMap = {};
  txs.filter(function(t){return t.type==='expense';}).forEach(function(t){
    var cat = t.source || 'غير محدد';
    catMap[cat] = (catMap[cat]||0) + t.amount;
  });
  var cats = Object.entries(catMap).sort(function(a,b){return b[1]-a[1];});
  var maxCat = cats.length ? cats[0][1] : 1;
  var ecEl = document.getElementById('stats-expense-cats');
  if(ecEl) {
    if(!cats.length) { ecEl.innerHTML = '<div style="text-align:center;padding:24px;color:var(--text3)">لا مصروفات في هذه الفترة</div>'; }
    else ecEl.innerHTML = cats.map(function(c,i){
      var pct = Math.round(c[1]/exp*100)||0;
      var barPct = Math.round(c[1]/maxCat*100);
      var colors = ['var(--accent4)','var(--accent2)','var(--accent)','var(--accent3)','#a78bfa','#fb923c'];
      var col = colors[i%colors.length];
      return '<div style="margin-bottom:14px">'+
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:5px">'+
          '<div style="font-size:13px;font-weight:700">'+c[0]+'</div>'+
          '<div style="display:flex;gap:12px;font-size:12px;color:var(--text2)">'+
            '<span style="font-weight:700;color:'+col+'">'+c[1].toLocaleString()+' '+cur+'</span>'+
            '<span style="color:var(--text3)">'+pct+'%</span>'+
          '</div>'+
        '</div>'+
        '<div style="height:10px;background:var(--surface3);border-radius:8px;overflow:hidden">'+
          '<div style="height:100%;width:'+barPct+'%;background:'+col+';border-radius:8px;transition:width .5s"></div>'+
        '</div>'+
      '</div>';
    }).join('');
  }

  // ── Monthly comparison bars ──
  var monthlyMap = {};
  txs.forEach(function(t){
    var d = new Date(t.isoDate||t.date||'');
    if(isNaN(d)) return;
    var key = d.getFullYear()+'-'+(d.getMonth()+1).toString().padStart(2,'0');
    if(!monthlyMap[key]) monthlyMap[key]={income:0,expense:0};
    monthlyMap[key][t.type==='income'?'income':'expense'] += t.amount;
  });
  var months = Object.keys(monthlyMap).sort();
  var maxVal = months.reduce(function(m,k){return Math.max(m,monthlyMap[k].income,monthlyMap[k].expense);},1);
  var monthNames = ['','يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
  var mbEl = document.getElementById('stats-monthly-bars');
  if(mbEl) {
    if(!months.length) { mbEl.innerHTML = '<div style="text-align:center;padding:24px;color:var(--text3)">لا بيانات</div>'; }
    else mbEl.innerHTML = '<div style="overflow-x:auto"><div style="display:flex;gap:12px;align-items:flex-end;min-width:'+Math.max(months.length*80,300)+'px;height:180px;padding-bottom:28px;position:relative">'+
      months.map(function(k){
        var d = monthlyMap[k];
        var incH = Math.round(d.income/maxVal*140);
        var expH = Math.round(d.expense/maxVal*140);
        var parts = k.split('-');
        var lbl = monthNames[parseInt(parts[1])]||k;
        return '<div style="flex:1;min-width:60px;display:flex;flex-direction:column;align-items:center;gap:2px">'+
          '<div style="display:flex;gap:3px;align-items:flex-end;height:140px">'+
            '<div style="width:20px;background:var(--accent3);border-radius:4px 4px 0 0;height:'+incH+'px;min-height:2px;transition:height .4s" title="دخل: '+d.income.toLocaleString()+'"></div>'+
            '<div style="width:20px;background:var(--accent4);border-radius:4px 4px 0 0;height:'+expH+'px;min-height:2px;transition:height .4s" title="مصروف: '+d.expense.toLocaleString()+'"></div>'+
          '</div>'+
          '<div style="font-size:10px;color:var(--text3);margin-top:4px;white-space:nowrap">'+lbl+'</div>'+
        '</div>';
      }).join('')+
      '</div>'+
      '<div style="display:flex;gap:16px;margin-top:4px;font-size:11px;color:var(--text3)">'+
        '<span><span style="display:inline-block;width:10px;height:10px;background:var(--accent3);border-radius:2px;margin-left:4px"></span>دخل</span>'+
        '<span><span style="display:inline-block;width:10px;height:10px;background:var(--accent4);border-radius:2px;margin-left:4px"></span>مصروف</span>'+
      '</div></div>';
  }

  // ── Top 5 expenses ──
  var top5exp = txs.filter(function(t){return t.type==='expense';}).sort(function(a,b){return b.amount-a.amount;}).slice(0,5);
  var teEl = document.getElementById('stats-top-expenses');
  if(teEl) {
    if(!top5exp.length) teEl.innerHTML = '<div style="text-align:center;padding:24px;color:var(--text3)">لا مصروفات</div>';
    else teEl.innerHTML = top5exp.map(function(t,i){
      return '<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)">'+
        '<div style="width:28px;height:28px;background:rgba(255,107,107,.15);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:900;color:var(--accent4)">'+(i+1)+'</div>'+
        '<div style="flex:1"><div style="font-size:13px;font-weight:700">'+(t.desc||'—')+'</div><div style="font-size:11px;color:var(--text3)">'+(t.source||'')+(t.isoDate?' · '+t.isoDate:'')+'</div></div>'+
        '<div style="font-weight:900;color:var(--accent4)">'+t.amount.toLocaleString()+' '+cur+'</div>'+
      '</div>';
    }).join('');
  }

  // ── Top 5 income ──
  var top5inc = txs.filter(function(t){return t.type==='income';}).sort(function(a,b){return b.amount-a.amount;}).slice(0,5);
  var tiEl = document.getElementById('stats-top-income');
  if(tiEl) {
    if(!top5inc.length) tiEl.innerHTML = '<div style="text-align:center;padding:24px;color:var(--text3)">لا إيرادات</div>';
    else tiEl.innerHTML = top5inc.map(function(t,i){
      return '<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)">'+
        '<div style="width:28px;height:28px;background:rgba(79,209,165,.15);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:900;color:var(--accent3)">'+(i+1)+'</div>'+
        '<div style="flex:1"><div style="font-size:13px;font-weight:700">'+(t.desc||'—')+'</div><div style="font-size:11px;color:var(--text3)">'+(t.source||'')+(t.isoDate?' · '+t.isoDate:'')+'</div></div>'+
        '<div style="font-weight:900;color:var(--accent3)">'+t.amount.toLocaleString()+' '+cur+'</div>'+
      '</div>';
    }).join('');
  }
}


// ══════════════════════════════════════════════════════
// VAULT — خزنة الحسابات (AES-256-GCM)
// ══════════════════════════════════════════════════════
var _vaultUnlocked = false;
var _vaultKey = null;
var _vaultSalt = null;
var VAULT_STORAGE_KEY = '_vault_v1';
var VAULT_SALT_KEY = '_vault_salt_v1';

// ── Crypto helpers ──
async function _vaultDeriveKey(password, salt) {
  var enc = new TextEncoder();
  var keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name:'PBKDF2', salt:salt, iterations:250000, hash:'SHA-256' },
    keyMaterial,
    { name:'AES-GCM', length:256 },
    false, ['encrypt','decrypt']
  );
}

async function _vaultEncrypt(data, key) {
  var iv = crypto.getRandomValues(new Uint8Array(12));
  var enc = new TextEncoder();
  var cipher = await crypto.subtle.encrypt({ name:'AES-GCM', iv:iv }, key, enc.encode(JSON.stringify(data)));
  var buf = new Uint8Array(iv.byteLength + cipher.byteLength);
  buf.set(iv, 0);
  buf.set(new Uint8Array(cipher), iv.byteLength);
  return btoa(String.fromCharCode.apply(null, buf));
}

async function _vaultDecrypt(b64, key) {
  var buf = Uint8Array.from(atob(b64), function(c){return c.charCodeAt(0);});
  var iv = buf.slice(0,12);
  var cipher = buf.slice(12);
  var plain = await crypto.subtle.decrypt({ name:'AES-GCM', iv:iv }, key, cipher);
  return JSON.parse(new TextDecoder().decode(plain));
}

function _vaultGetSalt() {
  var stored = null;
  try { stored = localStorage.getItem(VAULT_SALT_KEY); } catch(e){}
  if(stored) return Uint8Array.from(atob(stored), function(c){return c.charCodeAt(0);});
  var salt = crypto.getRandomValues(new Uint8Array(16));
  try { localStorage.setItem(VAULT_SALT_KEY, btoa(String.fromCharCode.apply(null, salt))); } catch(e){}
  return salt;
}

function _vaultIsNew() {
  try { return !localStorage.getItem(VAULT_STORAGE_KEY); } catch(e){ return true; }
}

// ── Show vault page ──
window._onVaultPageShow = function() {
  if(_vaultUnlocked) { renderVault(); return; }
  var lockEl = document.getElementById('vault-lock-screen');
  var contentEl = document.getElementById('vault-content');
  if(lockEl) lockEl.style.display = 'block';
  if(contentEl) contentEl.style.display = 'none';
  var isNew = _vaultIsNew();
  var titleEl = document.getElementById('vault-lock-title');
  var subEl = document.getElementById('vault-lock-sub');
  var confirmWrap = document.getElementById('vault-confirm-wrap');
  var strengthBar = document.getElementById('vault-strength-bar');
  var btn = document.getElementById('vault-lock-btn');
  if(titleEl) titleEl.textContent = isNew ? 'إنشاء كلمة مرور الخزنة' : 'أدخل كلمة مرور الخزنة';
  if(subEl) subEl.textContent = isNew ? 'سيتم تشفير جميع بياناتك بـ AES-256 — لا يمكن استعادة البيانات بدون هذه الكلمة' : 'أدخل كلمة مرور الخزنة لعرض حساباتك';
  if(confirmWrap) confirmWrap.style.display = isNew ? 'block' : 'none';
  if(strengthBar) strengthBar.style.display = isNew ? 'block' : 'none';
  if(btn) btn.textContent = isNew ? '🔒 إنشاء الخزنة' : '🔓 فتح الخزنة';
  // password strength listener (for new vault setup)
  var masterInput = document.getElementById('vault-master-input');
  if(masterInput) {
    masterInput.oninput = isNew ? function(){ _updateVaultStrength(this.value, 'vault-strength-fill','vault-strength-label'); } : null;
    masterInput.onkeydown = function(e){ if(e.key==='Enter') submitVaultLock(); };
    masterInput.focus();
  }
  var confirmInput = document.getElementById('vault-master-confirm');
  if(confirmInput) confirmInput.onkeydown = function(e){ if(e.key==='Enter') submitVaultLock(); };
};

// hook into showPage
(function(){
  var _orig = window.showPage;
  window.showPage = function(id, el) {
    if(_orig) _orig.call(this, id, el);
    if(id === 'vault') setTimeout(window._onVaultPageShow, 100);
  };
})();

function _passwordStrength(pwd) {
  if(!pwd) return 0;
  var score = 0;
  if(pwd.length >= 8) score++;
  if(pwd.length >= 12) score++;
  if(/[A-Z]/.test(pwd)) score++;
  if(/[0-9]/.test(pwd)) score++;
  if(/[^A-Za-z0-9]/.test(pwd)) score++;
  return score;
}

function _updateVaultStrength(pwd, fillId, labelId) {
  var score = _passwordStrength(pwd);
  var fill = fillId ? document.getElementById(fillId) : null;
  var label = labelId ? document.getElementById(labelId) : null;
  var colors = ['','#ef4444','#f97316','#eab308','#22c55e','#16a34a'];
  var labels = ['','ضعيفة جداً','ضعيفة','متوسطة','قوية','قوية جداً ✓'];
  if(fill) { fill.style.width = (score*20)+'%'; fill.style.background = colors[score]||colors[1]; }
  if(label) { label.textContent = labels[score]||''; label.style.color = colors[score]||colors[1]; }
}

function toggleVaultPwdVisibility(inputId, iconId) {
  var inp = document.getElementById(inputId);
  var ico = document.getElementById(iconId);
  if(!inp) return;
  inp.type = inp.type === 'password' ? 'text' : 'password';
  if(ico) ico.className = inp.type === 'password' ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash';
}

async function submitVaultLock() {
  var btn = document.getElementById('vault-lock-btn');
  var masterInput = document.getElementById('vault-master-input');
  var pwd = masterInput ? masterInput.value.trim() : '';
  if(!pwd) { toast('<i class="fa-solid fa-triangle-exclamation"></i> أدخل كلمة مرور الخزنة'); return; }
  var isNew = _vaultIsNew();
  if(isNew) {
    var confirm = document.getElementById('vault-master-confirm');
    if(!confirm || confirm.value !== pwd) { toast('<i class="fa-solid fa-triangle-exclamation"></i> كلمتا المرور غير متطابقتين'); return; }
    if(_passwordStrength(pwd) < 3) { toast('<i class="fa-solid fa-triangle-exclamation"></i> كلمة المرور ضعيفة — يجب أن تحتوي على أحرف وأرقام وتكون 8 أحرف على الأقل'); return; }
  }
  if(btn) { btn.disabled = true; btn.textContent = '⏳ جاري التحقق...'; }
  try {
    var salt = _vaultGetSalt();
    var key = await _vaultDeriveKey(pwd, salt);
    if(isNew) {
      // Create empty vault
      var encrypted = await _vaultEncrypt([], key);
      localStorage.setItem(VAULT_STORAGE_KEY, encrypted);
      _vaultKey = key;
      _vaultUnlocked = true;
    } else {
      var stored = localStorage.getItem(VAULT_STORAGE_KEY);
      try {
        await _vaultDecrypt(stored, key);
        _vaultKey = key;
        _vaultUnlocked = true;
      } catch(e) {
        toast('<i class="fa-solid fa-triangle-exclamation"></i> كلمة مرور خاطئة');
        if(btn) { btn.disabled = false; btn.textContent = '🔓 فتح الخزنة'; }
        return;
      }
    }
    document.getElementById('vault-lock-screen').style.display = 'none';
    document.getElementById('vault-content').style.display = 'block';
    masterInput.value = '';
    renderVault();
    toast('<i class="fa-solid fa-shield-check" style="color:var(--accent3)"></i> ' + (isNew ? 'تم إنشاء الخزنة بنجاح' : 'تم فتح الخزنة'));
  } catch(e) {
    toast('<i class="fa-solid fa-triangle-exclamation"></i> خطأ: ' + e.message);
    if(btn) { btn.disabled = false; btn.textContent = '🔓 فتح الخزنة'; }
  }
}

function lockVault() {
  _vaultUnlocked = false;
  _vaultKey = null;
  document.getElementById('vault-lock-screen').style.display = 'block';
  document.getElementById('vault-content').style.display = 'none';
  toast('<i class="fa-solid fa-lock"></i> تم قفل الخزنة');
}

async function _vaultLoad() {
  if(!_vaultKey) return [];
  try {
    var stored = localStorage.getItem(VAULT_STORAGE_KEY);
    if(!stored) return [];
    return await _vaultDecrypt(stored, _vaultKey);
  } catch(e) { return []; }
}

async function _vaultSave(entries) {
  if(!_vaultKey) return;
  var encrypted = await _vaultEncrypt(entries, _vaultKey);
  localStorage.setItem(VAULT_STORAGE_KEY, encrypted);
}

var _vaultCatIcons = { social:'📱', email:'📧', bank:'🏦', work:'💼', shopping:'🛍', other:'📁' };
var _vaultCatLabels = { social:'سوشيال ميديا', email:'بريد إلكتروني', bank:'بنوك ومدفوعات', work:'عمل ومنصات', shopping:'تسوق', other:'أخرى' };

async function renderVault() {
  if(!_vaultUnlocked) return;
  var entries = await _vaultLoad();
  var search = (document.getElementById('vault-search')||{}).value || '';
  var catF = (document.getElementById('vault-cat-filter')||{}).value || '';
  var filtered = entries.filter(function(e){
    if(catF && e.cat !== catF) return false;
    if(search && !(e.name||'').toLowerCase().includes(search.toLowerCase()) && !(e.username||'').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Stats
  var statsEl = document.getElementById('vault-stats');
  if(statsEl) {
    var catCounts = {};
    entries.forEach(function(e){ catCounts[e.cat||'other'] = (catCounts[e.cat||'other']||0)+1; });
    statsEl.innerHTML = '<div class="card" style="padding:10px 16px;display:flex;align-items:center;gap:8px"><i class="fa-solid fa-key" style="color:var(--accent)"></i><span style="font-weight:700">'+entries.length+'</span><span style="color:var(--text3);font-size:12px">حساب محفوظ</span></div>'+
      Object.entries(catCounts).map(function(c){
        return '<div style="padding:8px 14px;background:var(--surface2);border-radius:10px;font-size:12px;display:flex;align-items:center;gap:6px">'+
          (_vaultCatIcons[c[0]]||'📁')+' <span>'+(_vaultCatLabels[c[0]]||c[0])+'</span>: <strong>'+c[1]+'</strong></div>';
      }).join('');
  }

  var listEl = document.getElementById('vault-list');
  if(!listEl) return;
  if(!filtered.length) {
    listEl.innerHTML = '<div class="card" style="text-align:center;padding:40px;color:var(--text3)"><div style="font-size:40px;margin-bottom:12px">🔐</div><div>لا حسابات محفوظة'+(search?' تطابق البحث':'')+'</div></div>';
    return;
  }
  listEl.innerHTML = filtered.map(function(e){
    var icon = _vaultCatIcons[e.cat||'other']||'📁';
    var favicon = e.url ? 'https://www.google.com/s2/favicons?domain='+encodeURIComponent(e.url)+'&sz=32' : '';
    return '<div class="card" style="margin-bottom:10px;display:flex;align-items:center;gap:14px;padding:14px 18px">'+
      '<div style="width:40px;height:40px;border-radius:10px;background:var(--surface3);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">'+
        (favicon ? '<img src="'+favicon+'" style="width:24px;height:24px;border-radius:4px" onerror="this.parentNode.textContent=\''+icon+'\'">' : icon)+
      '</div>'+
      '<div style="flex:1;min-width:0">'+
        '<div style="font-size:14px;font-weight:800;margin-bottom:2px">'+(e.name||'—')+'</div>'+
        '<div style="font-size:12px;color:var(--text3)">'+
          (e.username ? '<i class="fa-solid fa-user" style="width:14px"></i> '+escapeHtml(e.username) : '')+
          (e.url ? ' <a href="'+escapeHtml(e.url)+'" target="_blank" style="color:var(--accent);margin-right:8px"><i class="fa-solid fa-arrow-up-right-from-square"></i></a>' : '')+
        '</div>'+
        (e.notes ? '<div style="font-size:11px;color:var(--text3);margin-top:3px">'+escapeHtml(e.notes.slice(0,60))+'</div>' : '')+
      '</div>'+
      '<div style="display:flex;gap:6px;flex-shrink:0">'+
        '<button class="btn btn-ghost btn-sm" onclick="copyVaultPassword(\''+e.id+'\')" title="نسخ كلمة المرور"><i class="fa-solid fa-copy"></i></button>'+
        '<button class="btn btn-ghost btn-sm" onclick="openVaultEntryModal(\''+e.id+'\')" title="تعديل"><i class="fa-solid fa-pen"></i></button>'+
        '<button class="btn btn-danger btn-sm" onclick="deleteVaultEntry(\''+e.id+'\')" title="حذف"><i class="fa-solid fa-trash"></i></button>'+
      '</div>'+
    '</div>';
  }).join('');
}

async function copyVaultPassword(id) {
  var entries = await _vaultLoad();
  var e = entries.find(function(x){return x.id===id;});
  if(!e) return;
  try {
    await navigator.clipboard.writeText(e.password||'');
    toast('<i class="fa-solid fa-copy" style="color:var(--accent3)"></i> تم نسخ كلمة المرور — ستُمسح من الحافظة خلال 30 ثانية');
    setTimeout(function(){ navigator.clipboard.writeText('').catch(function(){}); }, 30000);
  } catch(err) {
    // fallback
    var ta = document.createElement('textarea');
    ta.value = e.password||'';
    ta.style.position='fixed';ta.style.opacity='0';
    document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);
    toast('<i class="fa-solid fa-copy" style="color:var(--accent3)"></i> تم نسخ كلمة المرور');
  }
}

async function openVaultEntryModal(id) {
  if(!_vaultUnlocked) { toast('<i class="fa-solid fa-lock"></i> افتح الخزنة أولاً'); return; }
  var entries = id ? await _vaultLoad() : [];
  var e = id ? entries.find(function(x){return x.id===id;}) : null;
  document.getElementById('vault-entry-id').value = id||'';
  document.getElementById('vault-entry-title').innerHTML = id ? '<i class="fa-solid fa-key"></i> تعديل الحساب' : '<i class="fa-solid fa-key"></i> حساب جديد';
  document.getElementById('ve-name').value = e ? e.name||'' : '';
  document.getElementById('ve-cat').value = e ? e.cat||'other' : 'other';
  document.getElementById('ve-username').value = e ? e.username||'' : '';
  document.getElementById('ve-password').value = e ? e.password||'' : '';
  document.getElementById('ve-url').value = e ? e.url||'' : '';
  document.getElementById('ve-notes').value = e ? e.notes||'' : '';
  var pwdInput = document.getElementById('ve-password');
  if(pwdInput) {
    pwdInput.oninput = function(){ _updateVaultStrength(this.value,'ve-strength-fill', null); };
    if(e && e.password) _updateVaultStrength(e.password,'ve-strength-fill', null);
    else { var sf=document.getElementById('ve-strength-fill'); if(sf) sf.style.width='0'; }
  }
  // focus first field
  setTimeout(function(){ var n=document.getElementById('ve-name'); if(n) n.focus(); }, 100);
  document.getElementById('modal-vault-entry').classList.add('open');
}

async function saveVaultEntry() {
  var id = document.getElementById('vault-entry-id').value;
  var name = document.getElementById('ve-name').value.trim();
  var pwd = document.getElementById('ve-password').value;
  if(!name) { toast('<i class="fa-solid fa-triangle-exclamation"></i> أدخل اسم الموقع'); return; }
  if(!pwd) { toast('<i class="fa-solid fa-triangle-exclamation"></i> أدخل كلمة المرور'); return; }
  var entries = await _vaultLoad();
  var now = new Date().toISOString();
  if(id) {
    var idx = entries.findIndex(function(x){return x.id===id;});
    if(idx>=0) entries[idx] = Object.assign(entries[idx], {
      name:name, cat:document.getElementById('ve-cat').value,
      username:document.getElementById('ve-username').value.trim(),
      password:pwd, url:document.getElementById('ve-url').value.trim(),
      notes:document.getElementById('ve-notes').value.trim(), updatedAt:now
    });
  } else {
    entries.push({
      id: 'v_'+Date.now(), name:name,
      cat:document.getElementById('ve-cat').value,
      username:document.getElementById('ve-username').value.trim(),
      password:pwd, url:document.getElementById('ve-url').value.trim(),
      notes:document.getElementById('ve-notes').value.trim(),
      createdAt:now, updatedAt:now
    });
  }
  await _vaultSave(entries);
  closeM('modal-vault-entry');
  renderVault();
  toast('<i class="fa-solid fa-shield-check" style="color:var(--accent3)"></i> تم الحفظ بأمان');
}

async function deleteVaultEntry(id) {
  if(!confirm('هل تريد حذف هذا الحساب نهائياً؟')) return;
  var entries = await _vaultLoad();
  entries = entries.filter(function(x){return x.id!==id;});
  await _vaultSave(entries);
  renderVault();
  toast('<i class="fa-solid fa-trash"></i> تم الحذف');
}

function generateVaultPassword() {
  var chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+[]{}';
  var pwd = '';
  var arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  arr.forEach(function(b){ pwd += chars[b % chars.length]; });
  var pwdInput = document.getElementById('ve-password');
  if(pwdInput) {
    pwdInput.value = pwd;
    pwdInput.type = 'text';
    var eye = document.getElementById('ve-eye');
    if(eye) eye.className = 'fa-solid fa-eye-slash';
    _updateVaultStrength(pwd,'ve-strength-fill',null);
  }
  toast('<i class="fa-solid fa-wand-magic-sparkles" style="color:var(--accent)"></i> تم توليد كلمة مرور قوية');
}

// Auto-lock vault after 5 minutes of inactivity
var _vaultLockTimer = null;
function _resetVaultLockTimer() {
  if(!_vaultUnlocked) return;
  clearTimeout(_vaultLockTimer);
  _vaultLockTimer = setTimeout(function(){
    if(_vaultUnlocked) {
      lockVault();
      toast('<i class="fa-solid fa-lock"></i> تم قفل الخزنة تلقائياً بسبب عدم النشاط');
    }
  }, 5 * 60 * 1000);
}
document.addEventListener('click', _resetVaultLockTimer);
document.addEventListener('keydown', _resetVaultLockTimer);

