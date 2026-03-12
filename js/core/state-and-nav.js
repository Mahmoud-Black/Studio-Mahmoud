// ============================================================
// CORE STATE
// ============================================================
const COLORS=['#7c6ff7','#f7c948','#4fd1a5','#f76f7c','#64b5f6','#ff8a65','#ce93d8','#80cbc4'];
let S={tasks:[],clients:[],transactions:[],invoices:[],goals:[],schedule:[],teams:[],subscriptions:[],projects:[],project_tasks:[],settings:{name:'',phone:'',email:'',address:'',terms:'',logo:'',taskTypes:['مهمة عامة','مشروع','استشارة','تقرير','متابعة','أخرى'],svc_site_desc:'',svc_orders_open:true,svc_banner_size:'md'},services:[],standalone_packages:[],portfolio_projects:[],svc_orders:[],specializations:[],client_portals:[],loans:[],budgets:[]};

// ══════════════════════════════════════════════════
//  SECURITY — XSS Prevention utility
// ══════════════════════════════════════════════════
function escapeHtml(str){
  if(str===null||str===undefined) return '';
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#039;');
}

// ── Time Tracker global state (declared early to avoid TDZ errors) ──
let _tt={running:false,elapsed:0,startedAt:null,interval:null};
let _ttFilter='all';
let _ttRate=+localStorage.getItem('tt_rate')||150;
let _ttCur=localStorage.getItem('tt_currency')||'EGP';
// ── Contracts global state ──
let _activeContractId=null;
let _sigCanvas=null,_sigCtx=null,_sigDrawing=false;
let invItems=[];

function userKey(){const sess=getSession();return 'studioOS_v3_'+(sess?sess.id:'guest');}
function lsLoad(){
  // بيانات المستخدم تُحمَّل من السحابة فقط — لا قراءة من localStorage
  migrateSFields();
}
function tryParseDate(dateStr){
  if(!dateStr) return '';
  // Try ISO format first
  if(/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  // Try to extract from Arabic locale date (e.g. "١/١/٢٠٢٤")
  try {
    const d = new Date(dateStr);
    if(!isNaN(d)) return d.toISOString().split('T')[0];
  } catch(e){}
  return '';
}
// ── Currency Helper ──
function _getCurrency(){ return (S&&S.settings&&S.settings.currency)||'ج.م'; }
function _fmtPrice(val, svcCurrency){ return Number(val||0).toLocaleString() + ' ' + (svcCurrency||_getCurrency()); }

// lsLoad يتنادى من loginWithSupaSession فقط - مش هنا
// (علشان userKey() ما ترجعش 'guest' قبل الـ session)
try { migrateSFields(); } catch(e) {}

// ============================================================
// NAVIGATION
// ============================================================
const BN_MAIN=['dashboard','tasks','invoices','clients'];
// ── الصفحات المجانية بدون اشتراك ──
const FREE_PAGES = ['dashboard', 'settings'];

// ══ TRIAL SYSTEM ══
function _getTrialInfo() {
  if(!_supaUserId) return null;
  const key = '_trial_start_' + _supaUserId;
  const ts = (S && S._trial_start) || localStorage.getItem(key);
  if(!ts) return null;
  const start = new Date(ts);
  const end   = new Date(start.getTime() + 7 * 86400000);
  const now   = new Date();
  const daysLeft = Math.max(0, Math.ceil((end - now) / 86400000));
  return { start, end, daysLeft, active: now < end };
}

function _isTrialActive() {
  if(!_supaUserId) return false;
  if(_isAdminUser) return true;
  const info = _getTrialInfo();
  return info ? info.active : false;
}

async function _activateTrial(uid) {
  if(!uid) return;
  const key  = '_trial_start_' + uid;
  const existing = localStorage.getItem(key);
  if(existing) return; // already activated
  const now = new Date().toISOString();
  localStorage.setItem(key, now);
  if(S) S._trial_start = now;
  try { await cloudSave(S); } catch(e) {}
}


function hasActiveSub(){
  if(!_supaUserId) return true;
  if(_isAdminUser) return true;  // المشرف له اشتراك مدى الحياة تلقائياً
  if(_isTrialActive()) return true;  // التجربة المجانية تعادل اشتراكاً نشطاً
  // لو الاشتراك لسه بيتحمل أو مفيش نظام serial keys — افتح كل الصفحات
  if(!window._subLoadDone) return true;
  if(!_userSubscription) return false;
  if(_userSubscription.billing==='lifetime') return true;
  if(!_userSubscription.expiresAt) return true;
  return new Date(_userSubscription.expiresAt) > new Date();
}

// ── feature helpers ──
function _getPlanFeatures(){
  return _userSubscription?.plan?.features || {};
}

// هل الصفحة دي مسموحة في الباقة؟
function hasPageFeature(pageId){
  if(!_supaUserId || !hasActiveSub()) return false;
  if(_isAdminUser) return true;  // المشرف يوصل لكل الأقسام
  // لو الباقة مش محملة — افتح كل الصفحات (الاشتراك شغال لكن الباقة مش اتجابت)
  if(!_userSubscription?.plan) return true;
  const f = _getPlanFeatures();
  // لو features فاضية — افتح كل الصفحات
  if(!f || Object.keys(f).length === 0) return true;
  const map = { tasks:'tasks', projects:'tasks', clients:'clients', finance:'finance',
    invoices:'invoices', schedule:'schedule', team:'team',
    reports:'reports', meetings:'meetings', learning:'learning',
    timetracker:'timetracker', contracts:'contracts' };
  const key = map[pageId];
  if(!key) return true;
  if(!(key in f)) return true;
  return !!f[key];
}

// الحد الأقصى للـ feature (0 = غير محدود)
function getFeatureLimit(limitKey){
  const f = _getPlanFeatures();
  if(!(limitKey in f)) return 0; // مش محدود
  return +f[limitKey] || 0;
}

// تحقق من الحد قبل إضافة عنصر جديد
function checkLimit(limitKey, currentCount){
  if(!_supaUserId || !hasActiveSub()) return true;
  const limit = getFeatureLimit(limitKey);
  if(limit === 0) return true; // غير محدود
  if(currentCount >= limit){
    showMiniNotif('<i class="fa-solid fa-ban"></i> وصلت للحد الأقصى في باقتك (' + limit + ') — قم بالترقية');
    return false;
  }
  return true;
}

// ── Page Navigation History ──
var _pageHistory = [];
function _goBackPage(){
  if(_pageHistory.length===0){ showPage("dashboard"); return; }
  var prev=_pageHistory.pop();
  _hideLock();
  document.querySelectorAll(".page").forEach(function(p){p.classList.remove("active");});
  document.querySelectorAll(".nav-item").forEach(function(n){n.classList.remove("active");});
  var tgt=document.getElementById("page-"+prev);
  if(tgt) tgt.classList.add("active");
  document.querySelectorAll(".nav-item").forEach(function(n){
    if(n.getAttribute("onclick")&&n.getAttribute("onclick").includes("'"+prev+"'")) n.classList.add("active");
  });
  document.querySelectorAll(".bn-item").forEach(function(b){b.classList.remove("active");});
  var bnEl=document.getElementById("bn-"+prev); if(bnEl) bnEl.classList.add("active");
  document.querySelectorAll(".bn-more-item").forEach(function(b){b.classList.remove("active");});
  var bnmEl=document.getElementById("bnm-"+prev); if(bnmEl) bnmEl.classList.add("active");
  updateHeader(prev);
  if(window.innerWidth<=1024) closeSidebar();
  renderAll();
  window.scrollTo(0,0);
  _updateNavBtns();
}
function _updateNavBtns(){
  var navBar=document.getElementById('_page-nav-bar');
  var backBtn=document.querySelector('.nav-back-btn');
  var show=_pageHistory.length>0;
  if(navBar) navBar.style.display=show?'flex':'none';
  if(backBtn) backBtn.style.display=show?'flex':'none';
}


// ══════════════════════════════════════════════════════
// URL ROUTING — Hash-based (#dashboard, #tasks, ...)
// أفضل لـ static HTML files - مش محتاج server config
// ══════════════════════════════════════════════════════
var _PAGE_SLUGS = {
  'dashboard':'dashboard','tasks':'tasks','projects':'projects',
  'schedule':'schedule','meetings':'meetings','clients':'clients',
  'finance':'finance','invoices':'invoices','services':'services',
  'support':'support','team':'team','timetracker':'timetracker',
  'freelancer-goals':'goals','settings':'settings','reports':'reports',
  'vault':'vault'
};
var _SLUG_TO_PAGE = {};
Object.keys(_PAGE_SLUGS).forEach(function(k){ _SLUG_TO_PAGE[_PAGE_SLUGS[k]] = k; });

function _getPageSlug(pageId){ return _PAGE_SLUGS[pageId] || pageId; }
function _getPageFromSlug(slug){ return _SLUG_TO_PAGE[slug] || slug; }

function _pushPageUrl(pageId){
  var slug = _getPageSlug(pageId);
  var curHash = window.location.hash.replace('#','');
  if(curHash === slug) {
    // نفس الصفحة — replace بس
    window.history.replaceState({page: pageId}, '', '#' + slug);
  } else {
    window.history.pushState({page: pageId}, '', '#' + slug);
  }
}

function _getPageFromUrl(){
  var hash = window.location.hash.replace('#','').trim();
  if(!hash) return null;
  return _getPageFromSlug(hash);
}

// Handle browser back/forward buttons
window.addEventListener('popstate', function(e){
  var pageId = (e.state && e.state.page) ? e.state.page : _getPageFromUrl();
  if(pageId && document.getElementById('page-' + pageId)){
    _showPageNoHistory(pageId);
  } else {
    _showPageNoHistory('dashboard');
  }
});

// showPage without pushing to history (for popstate)
function _showPageNoHistory(id){
  if(!document.getElementById('page-' + id)) return;
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  var pg = document.getElementById('page-' + id);
  if(pg) pg.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(function(n){
    if(n.getAttribute('onclick') && n.getAttribute('onclick').includes("'"+id+"'")) n.classList.add('active');
  });
  document.querySelectorAll('.bn-item').forEach(b=>b.classList.remove('active'));
  var bnEl = document.getElementById('bn-' + id);
  if(bnEl) bnEl.classList.add('active');
  else { var bm = document.getElementById('bn-more'); if(bm) bm.classList.add('active'); }
  updateHeader && updateHeader(id);
  renderAll && renderAll();
  window.scrollTo(0,0);
  applyPlatformConfig && applyPlatformConfig();
}

// Restore page from URL hash on startup (called after login)
function _restorePageFromUrl(){
  var pageId = _getPageFromUrl();
  if(pageId && document.getElementById('page-' + pageId)){
    return pageId;
  }
  return null;
}


// ── Modal Full-Screen Toggle ──
function toggleModalExpand(overlayId) {
  var overlay = document.getElementById(overlayId);
  if(!overlay) return;
  var isExpanded = overlay.classList.contains('expanded');
  overlay.classList.toggle('expanded');
  // Update icon
  var btn = overlay.querySelector('.expand-btn');
  if(btn){
    btn.innerHTML = isExpanded
      ? '<i class="fa-solid fa-expand"></i>'
      : '<i class="fa-solid fa-compress"></i>';
    btn.title = isExpanded ? 'توسيع' : 'تصغير';
  }
  // Scroll fix
  var body = overlay.querySelector('#profile-body, #td-body');
  if(body) body.scrollTop = 0;
}

function _makeExpandBtn(overlayId){
  return '<button class="expand-btn" title="توسيع" onclick="toggleModalExpand(\''+overlayId+'\')"><i class="fa-solid fa-expand"></i></button>';
}


// ── تحصيل / تسوية رصيد عميل ──
function _collectFromClient(clientId, amount){
  var c = (S.clients||[]).find(function(x){ return String(x.id)===String(clientId); });
  if(!c) return;
  var cur = _getCurrency();
  var over = document.createElement('div');
  over.className = 'modal-overlay';
  over.style.display = 'flex';
  over.innerHTML = `<div class="modal" style="max-width:420px">
    <div class="modal-header">
      <div class="modal-title"><i class="fa-solid fa-hand-holding-dollar" style="color:var(--accent3)"></i> تحصيل من ${escapeHtml(c.name)}</div>
      <button class="close-btn" onclick="this.closest('.modal-overlay').remove()"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div style="margin-bottom:14px">
      <div style="background:rgba(255,107,107,.1);border-radius:10px;padding:10px 14px;font-size:13px;margin-bottom:14px">
        المبلغ المستحق الكلي: <strong style="color:var(--accent4)">${amount.toLocaleString()} ${cur}</strong>
      </div>
      <div class="form-group">
        <label class="form-label">المبلغ المحصّل <span style="color:var(--accent4)">*</span></label>
        <input class="form-input" type="number" id="_collect_amount" value="${amount}" min="1" placeholder="أدخل المبلغ">
      </div>
      <div class="form-group">
        <label class="form-label">طريقة الدفع</label>
        <select class="form-select" id="_collect_method">
          <option value="كاش">كاش</option>
          <option value="تحويل بنكي">تحويل بنكي</option>
          <option value="فودافون كاش">فودافون كاش</option>
          <option value="انستا باي">انستا باي</option>
          <option value="أخرى">أخرى</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">ملاحظة</label>
        <input class="form-input" id="_collect_note" placeholder="مثال: تسوية رصيد مشروع قديم">
      </div>
    </div>
    <div style="display:flex;gap:8px">
      <button class="btn btn-primary" style="flex:1;justify-content:center" onclick="_confirmCollect(${clientId},${amount})">
        <i class="fa-solid fa-check"></i> تسجيل التحصيل
      </button>
      <button class="btn btn-ghost" onclick="this.closest('.modal-overlay').remove()">إلغاء</button>
    </div>
  </div>`;
  document.body.appendChild(over);
  over.onclick = e => { if(e.target===over) over.remove(); };
  setTimeout(function(){ var el=document.getElementById('_collect_amount'); if(el){el.select();} }, 100);
}

function _confirmCollect(clientId, totalOwed){
  var c = (S.clients||[]).find(function(x){ return String(x.id)===String(clientId); });
  if(!c) return;
  var amountEl = document.getElementById('_collect_amount');
  var methodEl = document.getElementById('_collect_method');
  var noteEl   = document.getElementById('_collect_note');
  var amount = +(amountEl?.value||0);
  if(!amount || amount <= 0){ toast('<i class="fa-solid fa-triangle-exclamation"></i> أدخل مبلغاً صحيحاً'); return; }
  var method = methodEl?.value || 'كاش';
  var note   = noteEl?.value || ('تحصيل من ' + c.name);
  var cur    = _getCurrency();

  // سجّل المعاملة في transactions
  if(!S.transactions) S.transactions = [];
  var tx = {
    id: 'tx_' + Date.now(),
    type: 'income',
    amount: amount,
    source: c.name,
    client: c.name,
    desc: note || ('تحصيل من ' + c.name),
    payMethod: method,
    isoDate: new Date().toISOString().slice(0,10),
    date: new Date().toISOString().slice(0,10),
    createdAt: new Date().toISOString()
  };
  S.transactions.push(tx);

  // لو المبلغ المحصّل = الرصيد الكلي → صفّي الرصيد الافتتاحي
  var openBal = c.openingBalance || 0;
  var openType = c.openingBalanceType || 'receivable';
  var invUnpaid = (S.invoices||[]).filter(function(i){ return (i.client===c.name||String(i.clientId)===String(c.id)) && !(i.paid||i.status==='مدفوعة'||i.status==='paid'); }).reduce(function(s,i){ return s+(+i.total||0); }, 0);

  if(amount >= totalOwed){
    // تصفية كاملة: امسح الرصيد الافتتاحي وعلّم الفواتير كمدفوعة
    c.openingBalance = 0;
    c.openingBalanceType = 'receivable';
    // علّم الفواتير الغير مدفوعة كمدفوعة
    (S.invoices||[]).forEach(function(i){
      if((i.client===c.name||String(i.clientId)===String(c.id)) && !(i.paid||i.status==='مدفوعة'||i.status==='paid')){
        i.paid = true; i.status = 'مدفوعة';
      }
    });
    toast('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم التحصيل وتصفية الرصيد بالكامل ✅');
  } else if(amount >= openBal && openType==='receivable'){
    // تغطية الرصيد الافتتاحي بس
    c.openingBalance = 0;
    toast('<i class="fa-solid fa-coins" style="color:var(--accent3)"></i> تم تسجيل التحصيل — لا يزال هناك فواتير معلقة');
  } else {
    // تخفيض جزئي من الرصيد الافتتاحي
    if(openType==='receivable' && openBal > 0){
      c.openingBalance = Math.max(0, openBal - amount);
    }
    toast('<i class="fa-solid fa-coins" style="color:var(--accent2)"></i> تم تسجيل ' + amount.toLocaleString() + ' ' + cur);
  }

  lsSave(); cloudSave(S);
  // إغلاق الـ modal وتحديث البروفايل
  document.querySelectorAll('.modal-overlay').forEach(function(o){
    if(o.querySelector('#_collect_amount')) o.remove();
  });
  // إعادة رسم البروفايل
  if(typeof openClientProfile === 'function') openClientProfile(clientId);
  renderAll();
}

