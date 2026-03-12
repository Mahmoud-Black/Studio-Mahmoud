// ============================================================
// DASHBOARD
// ============================================================
var _WIDGET_DEFS = [
  {id:'stats',       label:'<i class="fa-solid fa-chart-bar"></i> الإحصائيات',          full:true,  visible:true,  row:0},
  {id:'commitment',  label:'<i class="fa-solid fa-bullseye"></i> مؤشر الالتزام',        full:false, visible:true,  row:0},
  {id:'momentum',    label:'<i class="fa-solid fa-bolt"></i> مقياس الزخم',           full:false, visible:true,  row:0},
  {id:'challenge',   label:'<i class="fa-solid fa-trophy"></i> تحدي الأسبوع',          full:false, visible:true,  row:0},
  {id:'upcoming',    label:'<i class="fa-solid fa-alarm-clock"></i> مواعيد قريبة',           full:false, visible:true,  row:1},
  {id:'overdue',     label:'<i class="fa-solid fa-triangle-exclamation"></i> مهام متأخرة',            full:false, visible:true,  row:1},
  {id:'subs',        label:'<i class="fa-solid fa-bell"></i> اشتراكات قريبة',        full:false, visible:true,  row:1},
  {id:'silent',      label:'<i class="fa-solid fa-bell-slash"></i> العملاء الهادئون',       full:false, visible:true,  row:1},
  {id:'expected',    label:'<i class="fa-solid fa-coins"></i> الدخل المتوقع وسعة العمل', full:true, visible:true, row:2},
  {id:'kanban',      label:'<i class="fa-solid fa-bolt"></i> المهام النشطة',          full:false, visible:true,  row:3},
  {id:'uncollected', label:'<i class="fa-solid fa-money-bill-wave"></i> مبالغ لم تُحصَّل',      full:false, visible:true,  row:3},
  {id:'team',        label:'<i class="fa-solid fa-users"></i> مهام الفريق',            full:false, visible:true,  row:4},
  {id:'teampay',     label:'<i class="fa-solid fa-coins"></i> مستحقات الفريق',        full:false, visible:true,  row:4},
  {id:'tasks',       label:'<i class="fa-solid fa-clipboard-list"></i> آخر المهام',             full:false, visible:true,  row:5},
  {id:'schedule',    label:'<i class="fa-solid fa-calendar"></i> جدول اليوم',             full:false, visible:true,  row:5},
  {id:'invoices',    label:'<i class="fa-solid fa-receipt"></i> فواتير معلقة',           full:false, visible:true,  row:6},
  {id:'goals',       label:'<i class="fa-solid fa-bullseye"></i> أهداف التطوير',         full:false, visible:true,  row:6},
  {id:'meetings',    label:'<i class="fa-solid fa-calendar-days"></i> الميتنجات',              full:true,  visible:true,  row:7},
  {id:'active_projects', label:'<i class="fa-solid fa-diagram-project"></i> المشاريع النشطة',  full:false, visible:true,  row:3},
];

function _getDashLayout(){
  try{
    var s = localStorage.getItem('_dLayout_v4');
    if(s){ var p=JSON.parse(s); if(p&&p.length) return p; }
  }catch(e){}
  return _WIDGET_DEFS.map(function(w){ return {id:w.id,visible:w.visible,row:w.row,full:w.full}; });
}

function _saveDashLayout(layout){ localStorage.setItem('_dLayout_v4',JSON.stringify(layout)); }

function _getDef(id){ return _WIDGET_DEFS.find(function(w){ return w.id===id; })||{id:id,label:id,full:false}; }

function updateDash(){
  // Ensure dashboard grid is initialized
  const grid = document.getElementById('_dash-grid');
  if(grid && !grid.querySelector('[data-widget-card]')) _renderDashGrid();

  const inc=S.transactions.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
  const done=S.tasks.filter(t=>t.done).length,pending=S.tasks.filter(t=>!t.done).length;
  const set=(id,val)=>{const e=document.getElementById(id);if(e)e.textContent=val;};
  set('dash-income',inc.toLocaleString()+' '+_getCurrency());set('dash-projects',pending);
  set('dash-done',done);set('dash-pending-txt',pending+' معلقة');set('dash-clients',S.clients.length);
  const dtl=document.getElementById('dash-tasks-list');
  if(dtl)dtl.innerHTML=S.tasks.slice(0,5).map(t=>`
    <div class="task-clickable" onclick="openTaskDetail(${t.id})" style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid rgba(42,42,58,.3)">
      <div class="task-priority priority-${t.priority}"></div>
      <div style="flex:1;font-size:13px;${t.done?'text-decoration:line-through;color:var(--text3)':''}">
        ${t.title}
        ${t.brief?'<span style="font-size:10px;color:var(--accent);margin-right:4px"><i class="fa-solid fa-file-lines"></i></span>':''}
      </div>
      ${payBadge[t.pay||'none']}
    </div>`).join('')||'<div class="empty"><div class="empty-icon"><i class="fa-solid fa-star-of-life"></i></div>لا مهام</div>';
  const dsl=document.getElementById('dash-sched-list');
  if(dsl)dsl.innerHTML=S.schedule.slice(0,5).map(s=>`
    <div style="display:flex;gap:10px;padding:8px 0;border-bottom:1px solid rgba(42,42,58,.3)">
      <div style="font-family:var(--mono);font-size:11px;color:${tcol[s.type]};width:44px">${s.time}</div>
      <div style="font-size:13px">${s.title}</div>
    </div>`).join('')||'<div class="empty"><div class="empty-icon"><i class="fa-solid fa-clock"></i></div>لا جدول اليوم</div>';
  const dil=document.getElementById('dash-inv-list');
  if(dil)dil.innerHTML=S.invoices.filter(i=>i.status==='pending').slice(0,4).map(inv=>`
    <div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid rgba(42,42,58,.3)">
      <div><div style="font-size:13px;font-weight:600">${inv.client}</div><div style="font-size:11px;color:var(--text3)">${inv.num}</div></div>
      <div style="font-weight:700;color:var(--accent2)">${inv.total.toLocaleString()} ج</div>
    </div>`).join('')||'<div class="empty"><div class="empty-icon"><i class="fa-solid fa-square"></i></div>لا فواتير معلقة</div>';
  const dgl=document.getElementById('dash-goals-list');
  if(dgl)dgl.innerHTML=S.goals.slice(0,3).map(g=>`
    <div style="padding:9px 0;border-bottom:1px solid rgba(42,42,58,.3)">
      <div style="display:flex;justify-content:space-between;margin-bottom:5px"><div style="font-size:13px">${g.title}</div><div style="font-size:12px;color:var(--accent);font-weight:700">${g.progress||0}%</div></div>
      <div class="progress-bar"><div class="progress-fill fill-purple" style="width:${g.progress||0}%"></div></div>
    </div>`).join('')||'<div class="empty"><div class="empty-icon"><i class="fa-solid fa-diamond"></i></div>أضف أهدافك</div>';
  renderSalaryReminders();
  renderFollowupReminders();
  renderDashTeamTasks();
  renderDashAlerts();
  renderDashTeamPay();
  renderDashKanbanMini();
  renderDashMeetings();
}

// ============================================================
// RENDER ALL
// ============================================================
function renderAll(){
  renderTasks();renderClients();renderFinance();renderInvoices();
  renderGoals();renderSchedule();updateDash();loadSettings();renderTeams();
  renderMeetings();
  // renderCourses only if the grid exists in DOM (inside fg-panel-courses when active)
  if(document.getElementById('courses-grid')) renderCourses();
  renderDashTeamPay();renderDashKanbanMini();renderDashMeetings();
  renderSalaryReminders();renderFollowupReminders();
  renderTimeTracker();renderContractsList();
  if(typeof renderServices==='function') renderServices();
  if(typeof renderStoresHomeList==='function') renderStoresHomeList();
  try{ _updateNavBtns(); }catch(e){}
  if(typeof renderSupport==='function') renderSupport();
  if(typeof _updateInboxBadge==='function') _updateInboxBadge();
  // Refresh freelancer goals page if active
  if(document.getElementById('page-freelancer-goals')?.classList.contains('active')){
    renderFreelancerGoalsPage();
  }
  if(document.getElementById('page-reviews')?.classList.contains('active')){
    renderReviewsPage();
  }
  if(document.getElementById('page-proposals')?.classList.contains('active')){
    renderProposals();
  }
  // تحديث badge العروض
  const _pb = document.getElementById('proposals-nav-badge');
  if(_pb){ const _pc=(S.proposals||[]).filter(p=>p.status==='pending').length; _pb.textContent=_pc; _pb.style.display=_pc?'inline-flex':'none'; }
  // تحديث badge التقييمات — يظهر فقط للجديدة غير المقروءة
  const _rb = document.getElementById('reviews-badge');
  if(_rb){ const _rc=(S.reviews||[]).length; const _rread=+(localStorage.getItem('_reviewsReadCount')||0); const _runread=Math.max(0,_rc-_rread); _rb.textContent=_runread; _rb.style.display=_runread?'inline-flex':'none'; }
}

// ============================================================
// SIDEBAR TOGGLE
// ============================================================
const PAGE_TITLES = {
  services    : '<i class="fa-solid fa-bag-shopping"></i> خدماتي',
  support     : '<i class="fa-solid fa-comments"></i> الدعم والرسائل',
  dashboard   : 'لوحة التحكم',
  tasks       : '<i class="fa-solid fa-list-check"></i> المهام والمشاريع',
  schedule    : '<i class="fa-solid fa-calendar-days"></i> تنظيم اليوم',
  clients     : '<i class="fa-solid fa-users"></i> قاعدة العملاء',
  finance     : '<i class="fa-solid fa-coins"></i> المالية والحسابات',
  invoices    : '<i class="fa-solid fa-file-invoice"></i> الفواتير والعقود',
  learning    : '<i class="fa-solid fa-bullseye"></i> الأهداف والإنجازات',
  'freelancer-goals': '<i class="fa-solid fa-bullseye"></i> الأهداف والإنجازات',
  meetings    : '<i class="fa-solid fa-handshake"></i> الميتنج والاجتماعات',
  settings    : '<i class="fa-solid fa-gear"></i> إعدادات النظام',
  timetracker : '<i class="fa-solid fa-stopwatch"></i> تتبع الوقت',
  contracts   : '<i class="fa-solid fa-file-contract"></i> العقود الرقمية',
  team        : '<i class="fa-solid fa-users-gear"></i> فريق العمل',
  goals       : '<i class="fa-solid fa-bullseye"></i> الأهداف',
  backup      : '<i class="fa-solid fa-floppy-disk"></i> النسخ الاحتياطي',
};
const PAGE_CTA = {
  dashboard: {label:'+ مهمة جديدة', fn:'openTaskModal()'},
  tasks:     {label:'+ مهمة جديدة', fn:'openTaskModal()'},
  clients:   {label:'+ عميل جديد',  fn:'openClientModal()'},
  finance:   {label:'+ دخل',        fn:'openIncomeModal()'},
  invoices:  {label:'+ فاتورة',     fn:'openInvoiceModal()'},
  learning:  {label:'+ هدف جديد',   fn:'openGoalModal()'},
  'freelancer-goals': {label:'+ هدف جديد', fn:'openFreelancerGoalModal()'},
  meetings:  {label:'+ ميتنج جديد',  fn:'openMeetingModal()'},
  schedule:  {label:'+ وقت جديد',   fn:'openSchedModal()'},
  timetracker:{label:'+ تسجيل وقت', fn:'openManualTimeEntry()'},
  contracts: {label:'+ عقد جديد',   fn:'openContractModal()'},
  settings:  {label:'',             fn:''},
  services:  {label:'+ خدمة جديدة', fn:'openSvcModal()'},
  support:   {label:'',              fn:''}
};
function openSidebar(){
  const isDesktop = window.innerWidth > 1024;
  if(isDesktop){
    document.body.classList.remove('sidebar-collapsed');
    document.getElementById('sidebar').classList.remove('open'); // not needed on desktop
  } else {
    document.getElementById('sidebar').classList.add('open');
    const ov=document.getElementById('sidebar-overlay');
    ov.style.display='block';
    requestAnimationFrame(()=>ov.classList.add('visible'));
  }
  const ti=document.getElementById('toggle-icon');
  if(ti) ti.innerHTML='<i class="fa-solid fa-xmark"></i>';
  localStorage.setItem('_sidebarOpen','1');
}
function closeSidebar(){
  const isDesktop = window.innerWidth > 1024;
  if(isDesktop){
    document.body.classList.add('sidebar-collapsed');
  }
  document.getElementById('sidebar').classList.remove('open');
  const ov=document.getElementById('sidebar-overlay');
  ov.classList.remove('visible');
  setTimeout(()=>{ if(!ov.classList.contains('visible')) ov.style.display='none'; },280);
  const ti=document.getElementById('toggle-icon');
  if(ti) ti.textContent='☰';
  localStorage.setItem('_sidebarOpen','0');
}
function toggleSidebar(){
  const isDesktop = window.innerWidth > 1024;
  if(isDesktop){
    document.body.classList.contains('sidebar-collapsed') ? openSidebar() : closeSidebar();
  } else {
    const s=document.getElementById('sidebar');
    s.classList.contains('open')?closeSidebar():openSidebar();
  }
}
// Restore sidebar state on load
(function(){
  var saved = localStorage.getItem('_sidebarOpen');
  if(window.innerWidth > 1024){
    if(saved === '0'){
      document.body.classList.add('sidebar-collapsed');
      var ti=document.getElementById('toggle-icon');
      if(ti) ti.textContent='☰';
    }
  }
})();
// Update header title + CTA on page change
function updateHeader(pageId){
  const el=document.getElementById('header-page-title');
  if(el) el.innerHTML=PAGE_TITLES[pageId]||'';
  const cta=PAGE_CTA[pageId];
  const btn=document.getElementById('header-cta');
  if(btn){
    btn.innerHTML=cta?.label||'';
    btn.style.display=cta?.label?'inline-flex':'none';
    btn.setAttribute('onclick',cta?.fn||'');
  }
}


// ============================================================
// AUTH SYSTEM — Supabase Cloud
// ============================================================
const AUTH_KEY  = 'studioOS_auth_v1';
const USERS_KEY = 'studioOS_users_v1';

// ── local compat shims (kept for backup/restore) ──
function getUsers(){ try{ return JSON.parse(localStorage.getItem(USERS_KEY)||'[]'); }catch(e){return [];} }
function saveUsers(u){ localStorage.setItem(USERS_KEY, JSON.stringify(u)); }
async function _trackLoginEvent(uid) {
  // نسجل حدث الدخول بأمان بدون أي خطر على البيانات
  setTimeout(async () => {
    try {
      // تأكد إن البيانات محملة كاملة قبل أي حفظ
      const _score = (S?.tasks?.length||0)+(S?.clients?.length||0)+(S?.invoices?.length||0);
      // لو S فارغة - ممكن لسه بيتحمل - انتظر أكثر
      if(_score === 0) {
        setTimeout(async () => {
          if(!S || !_supaUserId) return;
          const device = navigator.userAgent.includes('Mobile') ? 'موبايل' : 'كمبيوتر';
          S._login_log = S._login_log || [];
          S._login_log.unshift({ time: new Date().toISOString(), device });
          if(S._login_log.length > 50) S._login_log.splice(50);
          _queueCloudSave();
        }, 8000);
        return;
      }
      const device = navigator.userAgent.includes('Mobile') ? 'موبايل' : 'كمبيوتر';
      S._login_log = S._login_log || [];
      S._login_log.unshift({ time: new Date().toISOString(), device });
      if(S._login_log.length > 50) S._login_log.splice(50);
      // cloudSave آمنة لأن S فيها بيانات
      if(typeof cloudSave === 'function') cloudSave(S);
    } catch(e) { console.warn('Login tracking failed:', e.message); }
  }, 6000); // 6 ثواني - كافية لـ cloudLoad يكمل
}

// ─── Check if account is banned ───
async function _checkAccountBanned(uid) {
  try {
    const { data: sd } = await supa.from('studio_data').select('data').eq('user_id', uid).maybeSingle();
    if(!sd?.data) return false;
    const parsed = typeof sd.data === 'string' ? JSON.parse(sd.data) : sd.data;
    return parsed._account_banned === true;
  } catch(e) { return false; }
}

function getSession(){ try{ return JSON.parse(localStorage.getItem(AUTH_KEY)||'null'); }catch(e){return null;} }
function saveSession(u){ localStorage.setItem(AUTH_KEY, JSON.stringify(u)); }
function clearSession(){ localStorage.removeItem(AUTH_KEY); }

function switchAuthTab(tab){
  document.querySelectorAll('.auth-tab').forEach((t,i)=>t.classList.toggle('active', (tab==='login'&&i===0)||(tab==='register'&&i===1)));
  document.querySelectorAll('.auth-panel').forEach(p=>p.classList.remove('active'));
  const el = document.getElementById('panel-'+tab);
  if(el) el.classList.add('active');
  clearAuthMessages();
}

function clearAuthMessages(){
  ['login-error','register-error','register-success'].forEach(id=>{
    const el=document.getElementById(id);
    if(el){el.classList.remove('show');el.textContent='';}
  });
}

function showAuthMsg(id, msg){
  const el=document.getElementById(id);
  if(el){el.innerHTML=msg; el.classList.add('show');}
}

function checkPwStrength(pw){
  const bar=document.getElementById('pw-bar');
  const hint=document.getElementById('pw-hint');
  if(!bar||!hint)return;
  let score=0;
  const checks=[pw.length>=8, /[A-Z]/.test(pw)||/[a-z]/.test(pw), /[0-9]/.test(pw), pw.length>=12];
  checks.forEach(c=>{ if(c)score++; });
  const colors=['#f76f7c','#f7c948','#4fd1a5','#7c6ff7'];
  const labels=['ضعيفة','متوسطة','جيدة','قوية جداً'];
  bar.style.width=(score*25)+'%';
  bar.style.background=colors[score-1]||'var(--border)';
  hint.textContent=pw.length?'قوة كلمة المرور: '+(labels[score-1]||''):'';
}

async function doRegister(){
  const name   = (document.getElementById('reg-name')?.value||'').trim();
  const email  = (document.getElementById('reg-email')?.value||'').trim().toLowerCase();
  const phone  = (document.getElementById('reg-phone')?.value||'').trim();
  const studio = (document.getElementById('reg-studio')?.value||'').trim();
  const pw1    = document.getElementById('reg-password')?.value||'';
  const pw2    = document.getElementById('reg-password2')?.value||'';
  clearAuthMessages();

  if(!name)                     return showAuthMsg('register-error','<i class="fa-solid fa-triangle-exclamation"></i> يرجى إدخال الاسم الكامل');
  if(!email || !email.includes('@')) return showAuthMsg('register-error','<i class="fa-solid fa-triangle-exclamation"></i> يرجى إدخال بريد إلكتروني صحيح');
  if(pw1.length < 6)            return showAuthMsg('register-error','<i class="fa-solid fa-triangle-exclamation"></i> كلمة المرور يجب أن تكون 6 أحرف على الأقل');
  if(pw1 !== pw2)               return showAuthMsg('register-error','<i class="fa-solid fa-triangle-exclamation"></i> كلمتا المرور غير متطابقتين');

  const btns = document.querySelectorAll('#panel-register .auth-btn');
  btns.forEach(b=>{ b.disabled=true; });
  showAuthMsg('register-success','⏳ جاري إنشاء الحساب...');

  const { data, error } = await supa.auth.signUp({
    email,
    password: pw1,
    options: { data: { name, phone, studio: studio||name+' Ordo' } }
  });

  btns.forEach(b=>{ b.disabled=false; });

  if(error){
    let msg = error.message;
    if(msg.includes('already')) msg = 'البريد الإلكتروني مسجل مسبقاً — جرب تسجيل الدخول';
    if(msg.includes('invalid')) msg = 'البريد الإلكتروني غير صحيح';
    if(msg.includes('weak'))    msg = 'كلمة المرور ضعيفة جداً';
    showAuthMsg('register-error','<i class="fa-solid fa-triangle-exclamation"></i> ' + msg);
    return;
  }

  // Supabase بيبعت confirmation email — لو email confirmation مفعّل
  if(data.user && !data.session){
    showAuthMsg('register-success','<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم إنشاء الحساب! تحقق من بريدك الإلكتروني لتأكيد الحساب، ثم سجّل الدخول.');
    setTimeout(()=>{ switchAuthTab('login'); document.getElementById('login-email').value=email; }, 3000);
    return;
  }

  showAuthMsg('register-success','<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم إنشاء الحساب بنجاح!');
  // تفعيل التجربة المجانية 7 أيام للمستخدم الجديد
  if(data.user) await _activateTrial(data.user.id);
  setTimeout(()=>{ loginWithSupaSession(data.user, data.session, {name, phone, studio: studio||name+' Ordo'}); }, 800);
}

async function doLogin(){
  const email = (document.getElementById('login-email')?.value||'').trim().toLowerCase();
  const pw    = document.getElementById('login-password')?.value||'';
  clearAuthMessages();

  if(!email || !pw) return showAuthMsg('login-error','<i class="fa-solid fa-triangle-exclamation"></i> يرجى إدخال البريد الإلكتروني وكلمة المرور');

  const btns = document.querySelectorAll('#panel-login .auth-btn');
  btns.forEach(b=>{ b.disabled=true; });

  const { data, error } = await supa.auth.signInWithPassword({ email, password: pw });

  btns.forEach(b=>{ b.disabled=false; });

  if(error){
    if(error.message.includes('confirm') || error.message.includes('verified'))
      showAuthMsg('login-error','<i class="fa-solid fa-triangle-exclamation"></i> تحقق من بريدك الإلكتروني وأكّد حسابك أولاً');
    else
      showAuthMsg('login-error','<i class="fa-solid fa-triangle-exclamation"></i> البريد الإلكتروني أو كلمة المرور غير صحيحة');
    return;
  }

  const meta = data.user?.user_metadata || {};
  const userObj = {
    id    : data.user.id,
    supaId: data.user.id,
    name  : meta.name   || data.user.email,
    phone : meta.phone  || '',
    studio: meta.studio || (meta.name ? meta.name+' Ordo' : '')
  };
  loginWithSupaSession(data.user, data.session, userObj);
}

// loginUser – local compat (used by backup restore)
function loginUser(user){
  _supaUserId = user.supaId || user.id;
  saveSession(user);
  S={tasks:[],clients:[],transactions:[],invoices:[],goals:[],schedule:[],settings:{name:'',phone:'',email:'',address:'',terms:'',logo:''}};
  lsLoad();
  if(!S.settings.name && user.name){
    S.settings.name  = user.name;
    S.settings.phone = user.phone;
    if(user.studio) S.settings.name = user.studio;
  }
  updateUserBadge(user);
  const screen = document.getElementById('auth-screen');
  screen.style.transition='opacity .4s ease';
  screen.style.opacity='0';
  setTimeout(()=>{ screen.classList.add('hidden'); screen.style.opacity=''; }, 400);
}

// loginWithSupaSession – Supabase login (cloud sync)
async function loginWithSupaSession(supaUser, session, userMeta){
  _supaUserId = supaUser.id;
  // ── منع أي حفظ حتى يكتمل تحميل البيانات من السحابة ──
  window._appReady = false;
  window._cloudLoadDone = false;

  const meta = supaUser.user_metadata || {};
  const userObj = {
    id       : supaUser.id,
    supaId   : supaUser.id,
    email    : supaUser.email || '',
    name     : userMeta?.name  || meta.full_name || meta.name || (typeof S!=='undefined'&&S.settings?.name)||localStorage.getItem('studioName')||'Ordo',
    phone    : userMeta?.phone || meta.phone || '',
    studio   : userMeta?.studio || meta.studio || '',
    avatarUrl: meta.avatarUrl || meta.avatar_url || meta.picture || ''
  };
  saveSession(userObj);

  // ── تسجيل حدث الدخول في studio_data ──
  _trackLoginEvent(supaUser.id);

  // ── حمّل من السحابة مباشرة ──
  showSyncIndicator('<i class="fa-solid fa-cloud"></i>️ جاري تحميل بياناتك...', 'var(--accent)');

  // ── اقرأ الـ cache المحلي للمقارنة ──
  let _cachedData = null;
  try {
    const _cacheRaw = localStorage.getItem('_ordo_cache_' + supaUser.id);
    if(_cacheRaw) _cachedData = JSON.parse(_cacheRaw);
  } catch(e) {}

  let cloudData = await cloudLoad();

  // ── لو السحابة رجعت فاضية وعندنا cache — استخدم الـ cache فوراً ──
  const _cloudScore = (cloudData?.tasks?.length||0) + (cloudData?.clients?.length||0) + (cloudData?.invoices?.length||0);
  const _cacheScore = (_cachedData?.tasks?.length||0) + (_cachedData?.clients?.length||0) + (_cachedData?.invoices?.length||0);

  if(_cloudScore === 0 && _cacheScore > 0) {
    // السحابة فاضية والـ cache فيها بيانات — ممكن network delay، انتظر وحاول مرة تانية
    console.log('⚠️ Cloud empty but cache has data (' + _cacheScore + '), retrying cloud in 1.5s...');
    await new Promise(r => setTimeout(r, 1500));
    const _retryCloud = await cloudLoad();
    const _retryScore = (_retryCloud?.tasks?.length||0) + (_retryCloud?.clients?.length||0) + (_retryCloud?.invoices?.length||0);
    if(_retryScore > 0) {
      cloudData = _retryCloud;
      console.log('✅ Cloud retry succeeded, score:', _retryScore);
    } else {
      console.log('⚡ Cloud still empty after retry — using cache and re-syncing to cloud');
    }
  }

  // ── اختار أحدث بيانات بين السحابة والـ cache ──
  let _bestData = cloudData;
  if(_cachedData) {
    const cloudTime = cloudData?._savedAt ? new Date(cloudData._savedAt).getTime() : 0;
    const cacheTime = _cachedData._savedAt ? new Date(_cachedData._savedAt).getTime() : 0;
    const cloudScore = (cloudData?.tasks?.length||0) + (cloudData?.clients?.length||0) + (cloudData?.invoices?.length||0);
    const cacheScore = (_cachedData.tasks?.length||0) + (_cachedData.clients?.length||0) + (_cachedData.invoices?.length||0);

    if(cacheScore > cloudScore || (cacheScore === cloudScore && cacheTime > cloudTime)) {
      console.log('⚡ Cache is newer than cloud | cache:', cacheScore, 'cloud:', cloudScore, '— using cache and re-saving');
      _bestData = _cachedData;
      // أعد الحفظ للسحابة فوراً لمزامنتها — لكن فقط لو السحابة فعلاً فاضية (مش مجرد connection error)
      if (_cloudScore === 0) {
        setTimeout(async () => {
          // تحقق مجدداً إن السحابة فاضية فعلاً قبل الكتابة
          try {
            const _verify = await supa.from('studio_data').select('updated_at').eq('user_id', supaUser.id).maybeSingle();
            const _cloudUpdated = _verify?.data?.updated_at ? new Date(_verify.data.updated_at).getTime() : 0;
            const _cacheUpdated = _cachedData._savedAt ? new Date(_cachedData._savedAt).getTime() : 0;
            // لا تكتب فوق بيانات السحابة لو هي أحدث
            if (_cloudUpdated <= _cacheUpdated) {
              const _rp = { user_id: supaUser.id, data: JSON.stringify(_cachedData), updated_at: _cachedData._savedAt || new Date().toISOString() };
              await supa.from('studio_data').upsert(_rp, { onConflict: 'user_id' });
              console.log('✅ Re-synced cache to cloud');
            } else {
              console.log('⚠️ Cloud is newer — skipping re-sync to avoid overwrite');
            }
          } catch(e) { console.warn('Re-sync check failed:', e); }
        }, 500);
      }
    }
  }

  if(_bestData){
    S = _bestData;
    window._cloudLoadDone = true;
    window._appReady = true;
    migrateSFields();
    // ── Migration للجداول الجديدة (في الخلفية، مش بيعلق) ──
    setTimeout(() => _migrateToNewTables(_supaUserId, S), 2000);
    // ── أخفي مؤشر التحميل فوراً ──
    var _si = document.getElementById('sync-indicator');
    if(_si) { clearTimeout(_si._t); _si.style.opacity = '0'; }
    if(S._admin_updated && S._admin_name) {
      S.settings = S.settings || {};
      S.settings.name   = S._admin_name;
      S.settings.studio = S._admin_studio || S._admin_name;
      S.settings.phone  = S._admin_phone  || S.settings.phone || '';
      userObj.name   = S._admin_name;
      userObj.studio = S._admin_studio || S._admin_name;
      delete S._admin_updated; delete S._admin_name;
      delete S._admin_studio;  delete S._admin_phone;
      cloudSave(S);
    }
    applyPlatformConfig();
    applyPlatformConfig();
  } else {
    // Cloud returned null — retry once before falling back to localStorage
    let _retryData = null;
    try {
      await new Promise(r => setTimeout(r, 1500));
      const _retry = await supa.from('studio_data').select('data').eq('user_id', supaUser.id).maybeSingle();
      if(_retry.data?.data) {
        _retryData = typeof _retry.data.data === 'string' ? JSON.parse(_retry.data.data) : _retry.data.data;
      }
    } catch(e) {}

    if(_retryData && (typeof _retryData === 'object') && Object.keys(_retryData).length > 2) {
      // نجح الـ retry
      S = _retryData;
      window._appReady = true;
      window._cloudLoadDone = true;
      migrateSFields();
      _syncStudioLogoToConfig();
      showSyncIndicator('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم تحميل البيانات', '#4fd1a5');
    } else {
      // السحابة فارغة أو مش متاحة — مستخدم جديد أو مشكلة شبكة
      migrateSFields(); // تأكد إن S فيها المصفوفات الأساسية
      window._appReady = true; // ✅ آمن للحفظ (S موجودة وجاهزة)
      window._cloudLoadDone = true;
      console.log('Cloud load failed or empty — treating as new user');
    }
  }

  // ─── تحديث إعدادات المستخدم بحذر ───
  // نحدث الاسم فقط لو مش موجود، مع ضمان عدم الكتابة على بيانات موجودة
  let _needsSave = false;
  if(!S.settings.name && userObj.name){
    const googleName = meta?.full_name || meta?.name || '';
    S.settings.name  = userObj.studio || googleName || userObj.name;
    S.settings.phone = userObj.phone || S.settings.phone || '';
    _needsSave = true;
  }
  if(!S.settings.email && userObj.email) {
    S.settings.email = userObj.email;
    _needsSave = true;
  }
  // لا نضع صورة البروفايل تلقائياً كلوجو للستوديو
  // اللوجو يُرفع يدوياً من الإعدادات فقط
  if(userObj.avatarUrl) {
    S.settings._avatarUrl = userObj.avatarUrl; // نحتفظ بها للعرض الشخصي فقط
    _needsSave = true;
  }

  if(_needsSave) {
    // تحقق: هل المستخدم جديد فعلاً (مفيش row في studio_data)؟
    const _hasData = (S.tasks?.length||0) + (S.clients?.length||0) + (S.invoices?.length||0);
    try {
      if(_hasData === 0) {
        // مستخدم جديد تماماً - أنشئ row جديدة بأمان
        const { data: _exists } = await supa.from('studio_data')
          .select('user_id').eq('user_id', supaUser.id).maybeSingle();
        if(!_exists) {
          // فعلاً جديد - احفظ
          const _p = {user_id:supaUser.id, data:JSON.stringify(S), updated_at:new Date().toISOString()};
          await supa.from('studio_data').insert(_p);
        }
        // لو الـ row موجودة - ما نكتبش عليها (ممكن تحتوي بيانات)
      } else {
        // مستخدم قديم - استخدم cloudSave العادية — بس بعد تأكيد إن _cloudLoadDone شغّال
        cloudSave(S);
      }
    } catch(e) { console.warn('Initial save error:', e.message); }
  }

  updateUserBadge(userObj);

  // ── فحص صلاحية Admin (app_metadata أو user_metadata) ──
  const appMeta2 = supaUser.app_metadata || {};
  const isAdmin  = appMeta2.role === 'admin' || appMeta2.is_admin === true || appMeta2.is_admin === 'true' ||
                   meta.role === 'admin' || meta.is_admin === true;
  const isViewer = meta.role === 'viewer';
  _isAdminUser = isAdmin || isViewer;

  // ── تحقق من الحظر والاشتراك بشكل متوازي (أسرع) ──
  const [isBanned] = await Promise.all([
    _checkAccountBanned(supaUser.id),
    loadUserSubscription(supaUser.id)
  ]);
  if(isBanned) {
    await supa.auth.signOut();
    const screen = document.getElementById('auth-screen');
    if(screen) { screen.classList.remove('hidden'); screen.style.display=''; }
    setTimeout(() => {
      alert('هذا الحساب موقوف. تواصل مع الإدارة للمساعدة.');
    }, 300);
    return;
  }

  // ── استرجع أو فعّل التجربة المجانية ──
  const _trialKey = '_trial_start_' + supaUser.id;
  if(S && S._trial_start && !localStorage.getItem(_trialKey)){
    localStorage.setItem(_trialKey, S._trial_start);
  } else if(!localStorage.getItem(_trialKey) && !_userSubscription){
    // مستخدم جديد — فعّل التجربة وانتظر تنتهي قبل الـ welcome popup
    await _activateTrial(supaUser.id);
  }

  // ── حمّل الثيم من السحابة ──
  _loadThemeFromCloud();
  _updateHeaderAvatar();
  // ── حمّل اسم المنصة من قاعدة البيانات ──
  setTimeout(_loadPlatformNameFromCloud, 1000);

  // ── render بعد ما الاشتراك اتحمل ──
  renderAll();
  updateHeader('dashboard');
  // تحديث الـ subscription bar و nav locks بعد التحميل
  setTimeout(()=>{
    updateSubscriptionBar && updateSubscriptionBar();
    _updateNavLocks && _updateNavLocks();
    updateDash();
    _renderDashGrid && _renderDashGrid();
  }, 800);
  // شغّل مراقب حماية البيانات بعد تحميل كامل
  setTimeout(_startDataWatchdog, 5000);
  // ── شغّل الحفظ التلقائي كل 5 ثواني ──
  setTimeout(_startAutoSave, 3000);

  // ── فحص عضوية الفريق: هل هذا المستخدم مضاف كعضو في فريق شخص آخر؟ ──
  // Store email in S for team membership search by others
  if(supaUser.email && typeof S !== 'undefined'){
    S._user_email = supaUser.email.toLowerCase().trim();
    // تأكد إن S فيها بيانات حقيقية قبل الحفظ
    var _emailSaveScore = (S.tasks?.length||0) + (S.clients?.length||0) + (S.invoices?.length||0) + (S.settings?.name ? 1 : 0);
    // FIX: لا تحفظ S فاضية — اشترط وجود بيانات حقيقية (ليس مجرد email)
    if(_emailSaveScore > 0) cloudSave(S);
  }
  _checkTeamMembership(supaUser.email || userObj.email);

  // إخفاء اللوجين وإظهار التطبيق
  if(window._showApp) window._showApp();
  // تأكد إن body مش hidden
  document.body.style.visibility = 'visible';
  document.body.style.opacity = '1';
  // ── إظهار App Shell لو كان مخفياً (بعد logout) ──
  const shell = document.getElementById('app-body') || document.querySelector('.app-shell');
  if(shell && shell.style.display === 'none') shell.style.display = '';
  const screen = document.getElementById('auth-screen');
  screen.style.transition='opacity .4s ease';
  screen.style.opacity='0';
  setTimeout(()=>{ screen.classList.add('hidden'); screen.style.opacity=''; }, 400);

  if(isAdmin || isViewer) {
    showAdminChoiceOverlay(userObj, isAdmin);
    showSyncIndicator('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> أهلاً ' + (userObj.name||''), '#4fd1a5');
    return;
  }

  // ── استعادة الصفحة من الـ URL أو الداش بورد ──
  var _savedPage = (typeof _restorePageFromUrl === 'function') ? _restorePageFromUrl() : null;
  var _startPage = _savedPage || 'dashboard';
  showPage(_startPage);
  showSyncIndicator('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> أهلاً ' + (userObj.name||''), '#4fd1a5');

  // ── بوبأب ترحيب للمستخدم الجديد ──
  var _newUserKey = 'ordo_welcome_shown_' + supaUser.id;
  if(!localStorage.getItem(_newUserKey)){
    localStorage.setItem(_newUserKey, '1');
    // انتظر 1.5 ثانية بعد التأكد من تفعيل التجربة
    setTimeout(function(){ _showWelcomePopup(supaUser.id, userObj); }, 1500);
  }
}

// ══ SUBSCRIPTION SYSTEM ══
let _userSubscription = null;

// ══ WELCOME POPUP ══
function _showWelcomePopup(uid, userObj) {
  const cfg = JSON.parse(localStorage.getItem('platform_config') || '{}');
  const trial = _getTrialInfo();
  const name  = (userObj && userObj.name) ? userObj.name.split(' ')[0] : '';

  const title = cfg.welcome_title || ('أهلاً بك في ' + (cfg.name || 'Ordo') + '! 🎉');
  const body  = cfg.welcome_body  || 'نظام متكامل لإدارة أعمالك كفريلانسر — مهام، فواتير، عملاء، تتبع وقت، وأكثر.';
  const note  = cfg.welcome_note  || (trial && trial.active
    ? 'لديك <strong>' + trial.daysLeft + ' أيام تجريبية مجانية</strong> بكل المميزات — استمتع!'
    : '');

  // Remove any existing popup
  const old = document.getElementById('_welcome_popup_overlay');
  if(old) old.remove();

  const overlay = document.createElement('div');
  overlay.id = '_welcome_popup_overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(7,8,15,.85);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);display:flex;align-items:center;justify-content:center;padding:20px;animation:_fadeIn .35s ease';
  overlay.innerHTML = `
    <style>@keyframes _fadeIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}</style>
    <div style="max-width:420px;width:100%;background:var(--surface,#12131a);border:1px solid rgba(108,99,255,.25);border-radius:22px;padding:36px 28px;text-align:center;position:relative;box-shadow:0 24px 60px rgba(0,0,0,.6)">
      <div style="width:80px;height:80px;background:linear-gradient(135deg,rgba(108,99,255,.2),rgba(79,209,165,.15));border:1.5px solid rgba(108,99,255,.35);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:36px;margin:0 auto 18px">🎉</div>
      <div style="font-size:22px;font-weight:900;margin-bottom:10px;line-height:1.4">${name ? 'مرحباً ' + name + '،' : ''}<br>${title}</div>
      <div style="font-size:14px;color:var(--text2,#a0a6b8);line-height:1.8;margin-bottom:${note ? '14px' : '28px'}">${body}</div>
      ${note ? `<div style="background:rgba(108,99,255,.1);border:1px solid rgba(108,99,255,.2);border-radius:10px;padding:12px 16px;font-size:13px;color:var(--text,#e8eaf0);margin-bottom:28px;line-height:1.7">${note}</div>` : ''}
      <button onclick="document.getElementById('_welcome_popup_overlay').remove()"
        style="width:100%;background:var(--accent,#6c63ff);color:#fff;border:none;border-radius:12px;padding:14px;font-size:15px;font-weight:700;cursor:pointer;transition:opacity .2s"
        onmouseover="this.style.opacity='.88'" onmouseout="this.style.opacity='1'">
        🚀 ابدأ الآن
      </button>
    </div>`;
  document.body.appendChild(overlay);
}



async function loadUserSubscription(uid) {
  try {
    // جيب السيريال — يعمل مع أي column name
    let serialData = null;
    const { data: sd1, error: se1 } = await supa
      .from('serial_keys').select('*').eq('user_id', uid).eq('status','active').maybeSingle();
    if(!se1 && sd1) { serialData = sd1; }

    if(!serialData) {
      _userSubscription = null;
    } else {
      // جيب الباقة بشكل منفصل
      let plan = null;
      try {
        const { data: planData, error: planErr } = await supa
          .from('subscription_plans')
          .select('*')
          .eq('id', serialData.plan_id)
          .maybeSingle();
        if(!planErr && planData) {
          plan = planData;
        } else {
          throw new Error(planErr?.message || 'no plan data');
        }
      } catch(pe) {
        // fallback: الباقات المحلية من localStorage (synced من الأدمن)
        const lsPlans = JSON.parse(
          localStorage.getItem('admin_plans') ||
          localStorage.getItem('plans') || '[]'
        );
        plan = lsPlans.find(p => p.id === serialData.plan_id) || null;
        console.log('Using local plan fallback:', plan?.name || 'not found');
      }
      _userSubscription = {
        ...serialData,
        planId:      serialData.plan_id,
        billing:     serialData.billing,
        expiresAt:   serialData.expires_at,
        activatedAt: serialData.activated_at,
        plan
      };
    }
  } catch(e) {
    console.warn('loadUserSubscription error:', e);
    _userSubscription = null;
  }

  // Fallback: check admin_subscription stored in studio_data
  if(!_userSubscription) {
    try {
      const { data: sd } = await supa.from('studio_data').select('data').eq('user_id', uid).maybeSingle();
      if(sd?.data) {
        const parsed = typeof sd.data === 'string' ? JSON.parse(sd.data) : sd.data;
        if(parsed?.admin_subscription) {
          const as = typeof parsed.admin_subscription === 'string'
            ? JSON.parse(parsed.admin_subscription) : parsed.admin_subscription;
          if(as?.status === 'active') {
            // حاول تجيب الباقة من Supabase أولاً، ثم localStorage
            let plan = null;
            try {
              const { data: planRow } = await supa.from('subscription_plans').select('*').eq('id', as.planId).maybeSingle();
              if(planRow) plan = planRow;
            } catch(pe) {}
            if(!plan) {
              const lsPlans = JSON.parse(localStorage.getItem('admin_plans') || localStorage.getItem('plans') || '[]');
              plan = lsPlans.find(p => p.id === as.planId) || null;
            }
            _userSubscription = { ...as, plan, _fromAdminOverride: true };
          }
        }
      }
    } catch(fe) { console.warn('fallback sub check:', fe); }
  }
  updateSubscriptionBar();
  _updateNavLocks();
  window._subLoadDone = true;
  return _userSubscription;
}

function updateSubscriptionBar() {
  const bar     = document.getElementById('sub-status-bar');
  const planEl  = document.getElementById('sub-bar-plan');
  const detailEl= document.getElementById('sub-bar-detail');
  const dotEl   = document.getElementById('sub-dot');
  if(!bar) return;

  if(!_userSubscription) {
    // فحص التجربة المجانية
    const trial = _getTrialInfo();
    if(trial && trial.active) {
      bar.className = 'sub-status-bar active';
      if(planEl)  planEl.innerHTML = '🚀 تجربة مجانية';
      if(detailEl) detailEl.innerHTML = '<i class="fa-solid fa-alarm-clock"></i> متبقي ' + trial.daysLeft + ' يوم';
      if(dotEl) dotEl.style.background = 'var(--accent3)';
    } else {
      bar.className = 'sub-status-bar none';
      if(planEl)  planEl.textContent = 'لا يوجد اشتراك';
      if(detailEl) detailEl.textContent = 'اضغط لطلب اشتراك';
      if(dotEl) dotEl.style.background = 'var(--accent2)';
    }
    return;
  }

  const sub  = _userSubscription;
  const plan = sub.plan;
  const isExpired = sub.expiresAt && sub.billing !== 'lifetime' && new Date(sub.expiresAt) < new Date();
  const daysLeft  = sub.expiresAt && sub.billing !== 'lifetime'
    ? Math.max(0, Math.ceil((new Date(sub.expiresAt) - Date.now()) / 86400000))
    : null;

  if(isExpired) {
    bar.className = 'sub-status-bar expired';
    if(planEl) planEl.textContent = (plan?.name||'الاشتراك') + ' — منتهي';
    if(detailEl) detailEl.textContent = 'الاشتراك انتهى — تواصل للتجديد';
    if(dotEl) dotEl.style.background = 'var(--accent4)';
  } else {
    bar.className = 'sub-status-bar active';
    if(planEl) planEl.innerHTML = (plan?.icon||'<i class="fa-solid fa-box"></i>') + ' ' + (plan?.name||sub.planId);
    if(detailEl) {
      if(sub.billing === 'lifetime'){
        detailEl.textContent = '♾️ مدى الحياة';
      } else if(daysLeft !== null) {
        detailEl.innerHTML = '<i class="fa-solid fa-alarm-clock"></i> متبقي ' + daysLeft + ' يوم';
      } else {
        detailEl.textContent = 'نشط';
      }
    }
    if(dotEl) dotEl.style.background = 'var(--accent3)';
  }
}

// ── Sub Modal Tabs ──
function switchSubTab(tab) {
  ['current','plans'].forEach(t => {
    document.getElementById('subtab-' + t)?.classList.toggle('active', t === tab);
    const p = document.getElementById('subtabp-' + t);
    if(p) p.style.display = t === tab ? 'block' : 'none';
  });
  if(tab === 'plans') renderPlansListing();
}

// ── Plans Listing ──
async function renderPlansListing() {
  const el = document.getElementById('plans-listing-body');
  if(!el) return;

  let plans = [];
  try {
    const { data, error: pe } = await supa.from('subscription_plans').select('*');
    if(!pe && data && data.length) {
      // فلتر active محلياً لو الـ column موجود
      plans = data.filter(p => p.active !== false && p.active !== 0);
      // Sort by price locally
      plans.sort((a,b) => (a.price_monthly||0) - (b.price_monthly||0));
    }
  } catch(e) {}
  if(!plans.length) {
    plans = JSON.parse(localStorage.getItem('admin_plans') || localStorage.getItem('plans') || '[]');
    plans = plans.filter(p => p.active !== false);
  }

  if(!plans.length) {
    el.innerHTML = '<div style="text-align:center;padding:30px;color:var(--text3)">'
      + '<div style="font-size:36px;margin-bottom:10px"><i class="fa-solid fa-envelope-open"></i></div>'
      + '<div>لا توجد باقات متاحة حالياً</div>'
      + '<div style="font-size:12px;margin-top:6px">تواصل معنا عبر واتساب</div>'
      + '</div>';
    return;
  }

  const cfg = JSON.parse(localStorage.getItem('platform_config') || '{}');
  const wa  = cfg.whatsapp || '201090412218';
  const appName = cfg.name || 'Ordo';
  const currentPlanId = _userSubscription?.planId || _userSubscription?.plan_id;

  let html = '<div style="font-size:12px;color:var(--text3);margin-bottom:14px;text-align:center">اختر الباقة المناسبة — تواصل معنا للحصول على كود التفعيل</div>'
           + '<div style="display:flex;flex-direction:column;gap:12px">';

  plans.forEach(function(plan) {
    const f = plan.features || {};
    const isCurrent = plan.id === currentPlanId;
    const price = plan.price_monthly;
    const priceAnnual = plan.price_annual;
    const borderColor = isCurrent ? 'var(--accent)' : 'var(--border)';
    const bgColor     = isCurrent ? 'rgba(108,99,255,.04)' : 'var(--surface2)';

    const featKeys = [
      f.tasks !== false     ? '<i class="fa-solid fa-clipboard-list"></i> المهام' : '',
      f.clients !== false   ? '<i class="fa-solid fa-users"></i> العملاء' : '',
      f.finance !== false   ? '<i class="fa-solid fa-coins"></i> المالية' : '',
      f.invoices !== false  ? '<i class="fa-solid fa-receipt"></i> الفواتير' : '',
      f.schedule            ? '<i class="fa-solid fa-calendar-days"></i> الجدولة' : '',
      f.reports             ? '<i class="fa-solid fa-chart-bar"></i> التقارير' : '',
      f.team                ? '👨‍<i class="fa-solid fa-briefcase"></i> الفريق' : '',
      f.cloud !== false     ? '<i class="fa-solid fa-cloud"></i>️ السحابة' : '',
    ].filter(Boolean);

    const limitsArr = [
      f.max_tasks        ? 'حد المهام: ' + f.max_tasks       : 'مهام ∞',
      f.max_clients_feat ? 'حد العملاء: ' + f.max_clients_feat : 'عملاء ∞',
      f.max_invoices     ? 'حد الفواتير: ' + f.max_invoices   : 'فواتير ∞',
    ];

    const waMsg = encodeURIComponent('مرحباً، أريد الاشتراك في ' + appName + ' — باقة ' + plan.name);

    let featHTML = '';
    featKeys.forEach(function(fk) {
      featHTML += '<span style="background:rgba(108,99,255,.1);color:var(--accent);padding:3px 9px;border-radius:20px;font-size:11px">' + fk + '</span>';
    });

    let limHTML = '';
    limitsArr.forEach(function(lk) {
      limHTML += '<span style="background:var(--surface3);color:var(--text2);padding:2px 8px;border-radius:10px;font-size:10px">' + lk + '</span>';
    });

    let priceHTML = price
      ? '<div style="font-size:20px;font-weight:900;color:var(--accent)">' + price.toLocaleString() + ' <span style="font-size:12px">ج/شهر</span></div>'
      : '<div style="font-size:15px;font-weight:900;color:var(--accent3)">مجاني</div>';
    if(priceAnnual) priceHTML += '<div style="font-size:11px;color:var(--text3)">' + priceAnnual.toLocaleString() + ' ج/سنة</div>';

    let actionHTML;
    if(isCurrent) {
      actionHTML = '<div style="flex:1;text-align:center;font-size:12px;color:var(--accent3);font-weight:700;padding:8px"><i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> باقتك الحالية</div>';
    } else {
      actionHTML = '<button onclick="openCodeActivation(\'' + plan.id + '\',\'' + plan.name.replace(/'/g,"\\'") + '\')"'
        + ' style="flex:1;background:var(--accent);color:#fff;border:none;border-radius:8px;padding:10px;font-family:var(--font);font-size:13px;font-weight:700;cursor:pointer">'
        + '<i class="fa-solid fa-key"></i> عندي كود</button>'
        + '<a href="https://wa.me/' + wa + '?text=' + waMsg + '" target="_blank"'
        + ' style="flex:1;background:#25D366;color:#fff;border:none;border-radius:8px;padding:10px;font-family:var(--font);font-size:13px;font-weight:700;text-decoration:none;display:flex;align-items:center;justify-content:center;gap:5px">'
        + '<i class="fa-solid fa-comments"></i> اطلب كود</a>';
    }

    let currentBadge = isCurrent
      ? '<div style="position:absolute;top:10px;left:10px;background:var(--accent);color:#fff;font-size:10px;font-weight:700;padding:2px 10px;border-radius:20px">باقتك الحالية</div>'
      : '';

    html += '<div style="border:1.5px solid ' + borderColor + ';border-radius:14px;overflow:hidden;position:relative;background:' + bgColor + '">'
      + currentBadge
      + '<div style="padding:16px 16px 12px;display:flex;align-items:flex-start;justify-content:space-between;gap:10px">'
        + '<div style="display:flex;align-items:center;gap:12px">'
          + '<div style="font-size:32px">' + (plan.icon || '<i class="fa-solid fa-box"></i>') + '</div>'
          + '<div>'
            + '<div style="font-size:16px;font-weight:900">' + plan.name + '</div>'
            + '<div style="font-size:11px;color:var(--text3);margin-top:2px">' + (plan.desc || '') + '</div>'
          + '</div>'
        + '</div>'
        + '<div style="text-align:left;flex-shrink:0">' + priceHTML + '</div>'
      + '</div>'
      + '<div style="padding:0 16px 12px;display:flex;flex-wrap:wrap;gap:6px">' + featHTML + '</div>'
      + '<div style="padding:0 16px 14px;display:flex;flex-wrap:wrap;gap:4px">' + limHTML + '</div>'
      + '<div style="padding:12px 16px;background:var(--surface);border-top:1px solid var(--border);display:flex;gap:8px">'
        + actionHTML
      + '</div>'
    + '</div>';
  });

  html += '</div>';
  el.innerHTML = html;
}

function openCodeActivation(planId, planName) {
  const si = document.getElementById('_si_serial');
  const msg = document.getElementById('_si_msg');
  // Switch to current tab and show code input highlighted
  switchSubTab('current');
  // Scroll to activation input
  if(si) {
    si.focus();
    si.style.borderColor = 'var(--accent)';
    si.placeholder = 'أدخل كود باقة ' + planName + '...';
    setTimeout(() => { si.style.borderColor = ''; }, 3000);
  }
}

function openSubscriptionInfo() {
  const body = document.getElementById('sub-info-body');
  if(!body) return;

  if(!_userSubscription) {
    body.innerHTML = `
      <div style="text-align:center;padding:16px 0 12px">
        <div style="font-size:44px;margin-bottom:10px"><i class="fa-solid fa-envelope-open"></i></div>
        <div style="font-size:15px;font-weight:700;margin-bottom:6px">لا يوجد اشتراك نشط</div>
        <div style="font-size:12px;color:var(--text2);margin-bottom:18px">اشترِ باقة وفعّل كودك هنا</div>
      </div>
      <div style="background:rgba(108,99,255,.06);border:1.5px dashed rgba(108,99,255,.3);border-radius:13px;padding:16px;margin-bottom:14px">
        <div style="font-size:12px;font-weight:700;color:var(--accent);margin-bottom:10px"><i class="fa-solid fa-key"></i> تفعيل كود الاشتراك</div>
        <div style="display:flex;gap:8px;margin-bottom:7px">
          <input id="_si_serial" type="text" placeholder="أدخل الكود هنا..." dir="ltr"
            style="flex:1;background:var(--surface2);border:1.5px solid var(--border);border-radius:8px;padding:10px 12px;color:var(--text);font-family:var(--font);font-size:13px;letter-spacing:1.5px;outline:none"
            oninput="this.value=this.value.toUpperCase()"
            onkeydown="if(event.key==='Enter')_activateCode('_si_serial','_si_msg',()=>{closeM('modal-subscription-info');openSubscriptionInfo();})">
          <button onclick="_activateCode('_si_serial','_si_msg',()=>{closeM('modal-subscription-info');openSubscriptionInfo();})"
            style="background:var(--accent);color:#fff;border:none;border-radius:8px;padding:10px 15px;font-family:var(--font);font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap">
            تفعيل
          </button>
        </div>
        <div id="_si_msg" style="font-size:11px;min-height:14px;text-align:center"></div>
      </div>
      <a href="https://wa.me/201090412218?text=${encodeURIComponent('مرحباً، أريد الاشتراك في Ordo')}"
        target="_blank"
        style="display:flex;align-items:center;justify-content:center;gap:8px;background:#25D366;color:#fff;padding:12px 24px;border-radius:10px;font-weight:700;text-decoration:none;font-size:13px">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
        شراء باقة عبر واتساب
      </a>`;
  } else {
    const sub  = _userSubscription;
    const plan = sub.plan;
    const isExpired = sub.expiresAt && sub.billing !== 'lifetime' && new Date(sub.expiresAt) < new Date();
    const daysLeft  = sub.expiresAt && sub.billing !== 'lifetime'
      ? Math.max(0, Math.ceil((new Date(sub.expiresAt)-Date.now())/86400000)) : null;
    const feats = Object.entries(plan?.features||{}).filter(([,v])=>v)
      .map(([k])=>({'tasks':'<i class="fa-solid fa-star-of-life"></i> المهام','clients':'<i class="fa-solid fa-users"></i> العملاء','finance':'<i class="fa-solid fa-coins"></i> المالية','invoices':'<i class="fa-solid fa-receipt"></i> الفواتير','schedule':'<i class="fa-solid fa-calendar-days"></i> الجدولة','reports':'<i class="fa-solid fa-chart-bar"></i> التقارير','cloud':'<i class="fa-solid fa-cloud"></i>️ السحابة'}[k]||k));

    body.innerHTML = `
      <div style="text-align:center;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid var(--border)">
        <div style="font-size:40px;margin-bottom:8px">${plan?.icon||'<i class="fa-solid fa-box"></i>'}</div>
        <div style="font-size:20px;font-weight:900">${plan?.name||sub.planId}</div>
        <div style="margin-top:6px">${isExpired
          ? '<span style="background:rgba(255,107,107,.15);color:var(--accent4);padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700"><i class="fa-solid fa-ban"></i> منتهي</span>'
          : '<span style="background:rgba(79,209,165,.15);color:var(--accent3);padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700"><i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> نشط</span>'
        }</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px">
        <div style="display:flex;justify-content:space-between;font-size:13px"><span style="color:var(--text2)">نوع الاشتراك</span><span style="font-weight:700">${{'monthly':'<i class="fa-solid fa-calendar-days"></i> شهري','annual':'<i class="fa-solid fa-calendar-days"></i> سنوي','lifetime':'♾️ مدى الحياة'}[sub.billing]||sub.billing}</span></div>
        <div style="display:flex;justify-content:space-between;font-size:13px"><span style="color:var(--text2)">الحد الأقصى للعملاء</span><span style="font-weight:700;color:var(--accent)">${plan?.max_clients||'∞'}</span></div>
        ${daysLeft !== null ? `<div style="display:flex;justify-content:space-between;font-size:13px"><span style="color:var(--text2)">المتبقي</span><span style="font-weight:700;color:${daysLeft<7?'var(--accent4)':'var(--text)'}">${daysLeft} يوم</span></div>` : ''}
        ${sub.expiresAt && sub.billing!=='lifetime' ? `<div style="display:flex;justify-content:space-between;font-size:13px"><span style="color:var(--text2)">ينتهي في</span><span>${new Date(sub.expiresAt).toLocaleDateString('ar-EG')}</span></div>` : ''}
      </div>
      ${feats.length ? `<div style="margin-bottom:16px"><div style="font-size:11px;color:var(--text3);font-weight:700;margin-bottom:8px">الصلاحيات المتاحة</div><div style="display:flex;flex-wrap:wrap;gap:6px">${feats.map(f=>`<span style="background:rgba(108,99,255,.12);color:var(--accent);padding:4px 10px;border-radius:20px;font-size:12px">${f}</span>`).join('')}</div></div>` : ''}
      ${isExpired || daysLeft !== null && daysLeft <= 7 ? `
        <div style="background:rgba(255,107,107,.08);border:1px solid rgba(255,107,107,.2);border-radius:10px;padding:14px;text-align:center">
          <div style="font-size:13px;font-weight:700;margin-bottom:8px">${isExpired?'<i class="fa-solid fa-ban"></i> اشتراكك انتهى':'<i class="fa-solid fa-triangle-exclamation"></i> اشتراكك ينتهي قريباً'}</div>
          <a href="https://wa.me/201090412218?text=${encodeURIComponent('مرحباً، أريد تجديد اشتراكي في Ordo — باقة '+(plan?.name||''))}"
            target="_blank"
            style="display:inline-flex;align-items:center;gap:6px;background:#25D366;color:#fff;padding:10px 20px;border-radius:8px;font-weight:700;text-decoration:none;font-size:13px">
            تجديد عبر واتساب
          </a>
        </div>` : `
        <div style="text-align:center;padding-top:12px;border-top:1px solid var(--border)">
          <div style="font-size:12px;color:var(--text3);margin-bottom:8px">ترغب في ترقية باقتك؟</div>
          <a href="https://wa.me/201090412218?text=${encodeURIComponent('مرحباً، أريد ترقية اشتراكي في Ordo')}"
            target="_blank"
            style="display:inline-flex;align-items:center;gap:6px;background:var(--accent);color:#fff;padding:10px 20px;border-radius:8px;font-weight:700;text-decoration:none;font-size:13px">
            <i class="fa-solid fa-rocket"></i> ترقية الباقة
          </a>
        </div>
        <div style="text-align:center;padding-top:10px">
          <button onclick="cancelMySubscription()" style="background:none;border:none;color:var(--text3);font-size:12px;cursor:pointer;font-family:var(--font);text-decoration:underline">
            <i class="fa-solid fa-ban"></i> إلغاء الاشتراك
          </button>
        </div>`}
    `;
  }
  openM('modal-subscription-info');
  switchSubTab('current');
}

// ══ إلغاء اشتراك المستخدم بنفسه ══
async function cancelMySubscription() {
  if(!_userSubscription) return;
  if(!confirm('هل أنت متأكد من إلغاء اشتراكك؟\nستفقد الوصول للميزات المدفوعة فوراً.')) return;
  const uid = _supaUserId;
  if(!uid) { showToast('⚠ خطأ: لم يتم التعرف على المستخدم'); return; }
  try {
    // مسح admin_subscription من studio_data
    const { data: sd } = await supa.from('studio_data').select('data').eq('user_id', uid).maybeSingle();
    if(sd?.data) {
      let parsed = typeof sd.data === 'string' ? JSON.parse(sd.data) : sd.data;
      if(parsed.admin_subscription) {
        delete parsed.admin_subscription;
        await supa.from('studio_data')
          .update({ data: JSON.stringify(parsed), updated_at: new Date().toISOString() })
          .eq('user_id', uid);
        // حدّث النسخة المحلية
        try { appData = parsed; saveLocal(); } catch(e) {}
      }
    }
    // مسح من serial_keys
    await supa.from('serial_keys')
      .update({ status: 'expired', user_id: null, activated_at: null, expires_at: null })
      .eq('user_id', uid);
    _userSubscription = null;
    updateSubscriptionBar();
    _updateNavLocks();
    closeM('modal-subscription-info');
    showToast('تم إلغاء الاشتراك');
  } catch(e) {
    console.error('cancelMySubscription:', e);
    showToast('⚠ حدث خطأ أثناء الإلغاء، حاول مجدداً');
  }
}

// ══ ADMIN CHOICE OVERLAY ══
function showAdminChoiceOverlay(user, isAdmin) {
  let overlay = document.getElementById('admin-choice-overlay');
  if(!overlay){
    overlay=document.createElement('div');
    overlay.id='admin-choice-overlay';
    document.body.appendChild(overlay);
  }
  overlay.style.cssText='position:fixed;inset:0;z-index:9998;background:rgba(7,8,15,.85);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);display:flex;align-items:center;justify-content:center;padding:20px';
  overlay.innerHTML=`
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:24px;padding:36px 28px;max-width:420px;width:100%;text-align:center;box-shadow:0 40px 80px rgba(0,0,0,.6)">
      <div style="width:60px;height:60px;background:rgba(108,99,255,.15);border:1.5px solid rgba(108,99,255,.3);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:26px;margin:0 auto 14px"><i class="fa-solid fa-bolt"></i></div>
      <div style="font-size:21px;font-weight:900;margin-bottom:6px">أهلاً ${user.name||''}!</div>
      <div style="font-size:13px;color:var(--text2);margin-bottom:26px;line-height:1.7">حسابك يملك صلاحيات ${isAdmin?'مشرف':'مشاهد'}<br>اختر الوضع الذي تريد الدخول إليه</div>
      <div style="display:flex;flex-direction:column;gap:12px">
        <button onclick="goToUserSite()" style="background:linear-gradient(135deg,#6c63ff,#9f7aea);color:#fff;border:none;border-radius:14px;padding:17px 20px;font-family:var(--font);font-size:14px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:12px;transition:.2s" onmouseover="this.style.opacity='.9'" onmouseout="this.style.opacity='1'">
          <div style="width:38px;height:38px;background:rgba(255,255,255,.15);border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0"><i class="fa-solid fa-palette"></i></div>
          <div style="text-align:right;flex:1"><div>موقع المستخدم</div><div style="font-size:11px;font-weight:400;opacity:.8;margin-top:2px">إدارة أعمالك ومشاريعك</div></div>
        </button>
        ${isAdmin?`
        <button onclick="goToAdminDash()" style="background:var(--surface2);color:var(--text);border:1.5px solid var(--border);border-radius:14px;padding:17px 20px;font-family:var(--font);font-size:14px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:12px;transition:.2s" onmouseover="this.style.background='var(--surface3)'" onmouseout="this.style.background='var(--surface2)'">
          <div style="width:38px;height:38px;background:rgba(108,99,255,.15);border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0"><i class="fa-solid fa-chart-bar"></i></div>
          <div style="text-align:right;flex:1"><div>لوحة الإدارة</div><div style="font-size:11px;font-weight:400;color:var(--text2);margin-top:2px">إدارة المستخدمين والاشتراكات</div></div>
        </button>`:''}
      </div>
    </div>`;
}

function goToUserSite(){
  _currentMode='user';
  const o=document.getElementById('admin-choice-overlay'); if(o) o.style.display='none';
  if(_supaUserId) loadUserSubscription(_supaUserId);
  // أضف زرار الأدمن في الـ sidebar
  setTimeout(()=>{ _addAdminSwitchBtn(); }, 500);
}

function goToAdminDash(){
  window.open('admin.html','_blank');
}

function _addAdminSwitchBtn(){
  if(!_isAdminUser) return;
  if(document.getElementById('_admin_sw_btn')) return;
  const su=document.getElementById('sidebar-user'); if(!su) return;
  const btn=document.createElement('button');
  btn.id='_admin_sw_btn';
  btn.title='التبديل للأدمن';
  btn.style.cssText='background:rgba(108,99,255,.15);border:1px solid rgba(108,99,255,.3);color:var(--accent);border-radius:8px;padding:4px 7px;font-size:10px;cursor:pointer;font-family:var(--font);font-weight:700;flex-shrink:0;transition:.2s;white-space:nowrap';
  btn.innerHTML='<i class="fa-solid fa-bolt"></i> أدمن';
  btn.onclick=(e)=>{e.stopPropagation();openProfileModal();setTimeout(()=>_switchSettingsTab('adminswitch'),100);};
  const logoutBtn=su.querySelector('.logout-btn');
  if(logoutBtn) su.insertBefore(btn,logoutBtn); else su.appendChild(btn);
}

// migration helper
function migrateSFields(){
  try{
    if(!S.settings) S.settings={};
    if(!S.settings.taskTypes) S.settings.taskTypes=['تصميم سوشيال ميديا','برانيدنج','لوجو','فيديو موشن','كونتنت','ويب ديزاين'];
    ['schedule','teams','subscriptions','customStatuses','paymentAccounts','hiddenPayMethods','hiddenStatuses','meetings','courses','timeEntries','contracts','statements','specializations','client_portals','loans','budgets'].forEach(k=>{ if(!S[k]) S[k]=[]; });
    if(!S.archivedTasks) S.archivedTasks=[];
    if(!S.tasks) S.tasks=[];
    if(!S.clients) S.clients=[];
    if(!S.transactions) S.transactions=[];
    if(!S.invoices) S.invoices=[];
    if(!S.goals) S.goals=[];
    if(!S.freelancerGoals) S.freelancerGoals={};
    if(!S.freelancerGoals.custom) S.freelancerGoals.custom=[];
    // Migrate old course steps (ensure steps array exists)
    (S.courses||[]).forEach(c=>{ if(!c.steps) c.steps=[]; });
    // Restore theme/display preferences from cloud
    if(S.settings.accentColor){
      localStorage.setItem('studioAccentColor', S.settings.accentColor);
      document.documentElement.style.setProperty('--accent', S.settings.accentColor);
    }
    if(S.settings.displayMode){
      localStorage.setItem('studioDisplayMode', S.settings.displayMode);
      document.body.classList.toggle('light-mode', S.settings.displayMode === 'light');
    }
    S.tasks.forEach(t=>{
      if(t.workerType===undefined) t.workerType='me';
      if(t.workerMember===undefined) t.workerMember=null;
      if(t.workerAmount===undefined) t.workerAmount=0;
      if(t.workerDepositPaid===undefined) t.workerDepositPaid=false;
      if(t.workerDepositAmount===undefined) t.workerDepositAmount=0;
      if(t.paymentCollected===undefined) t.paymentCollected=false;
      if(!t.steps) t.steps=[];
      if(!t.taskType) t.taskType='';
    });
    S.schedule.forEach(s=>{ if(s.done===undefined)s.done=false; if(s.linkedTaskId===undefined)s.linkedTaskId=null; });
    S.clients.forEach(c=>{ if(!c.followupEnabled)c.followupEnabled='off'; if(!c.followupMonths)c.followupMonths=3; });
    if(!S.services) S.services=[];
    if(!S.svc_orders) S.svc_orders=[];
    if(!S.support_msgs) S.support_msgs=[];
    if(!S.client_portals) S.client_portals=[];
  }catch(e){}
}

async function doLogout(){
  if(!confirm('هل تريد تسجيل الخروج؟')) return;
  try { await supa.auth.signOut(); } catch(e) {}
  _supaUserId = null;
  _userSubscription = null;
  clearSession();
  // Hide app, show auth
  const shell = document.getElementById('app-body') || document.querySelector('.app-shell');
  if(shell) shell.style.display = 'none';
  ['login-phone','login-password','reg-name','reg-phone','reg-studio','reg-password','reg-password2'].forEach(id=>{
    const el=document.getElementById(id); if(el)el.value='';
  });
  clearAuthMessages();
  checkPwStrength('');
  const screen=document.getElementById('auth-screen');
  if(screen){
    screen.classList.remove('hidden');
    screen.style.display='';
    screen.style.opacity='0';
    screen.style.transition='opacity .35s ease';
    requestAnimationFrame(()=>{ screen.style.opacity='1'; });
  }
  switchAuthTab('login');
  // Don't reload — session already cleared by Supabase
}

function updateUserBadge(user){
  const el=document.getElementById('user-display-name');
  const ph=document.getElementById('user-display-phone');
  const av=document.getElementById('user-avatar-icon');
  if(el) el.textContent = user.studio||user.name;
  if(ph) ph.textContent = user.email || user.phone || '';
  if(av){
    if(user.avatarUrl){
      av.innerHTML = `<img src="${user.avatarUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
    } else {
      av.textContent = (user.name||'م')[0];
    }
  }
  const nd=document.getElementById('studio-name-disp');
  if(nd) nd.textContent = user.name||'صاحب العمل';
}

// initAuth kept for backup restore compat only
function initAuth(){
  // No-op: handled by onAuthStateChange
}


// ============================================================
// GOOGLE LOGIN
// ============================================================
async function doGoogleLogin(){
  // Show loading state on both Google buttons
  document.querySelectorAll('.auth-btn-google').forEach(function(b){
    b.disabled = true;
    b._origHTML = b.innerHTML;
    b.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الاتصال...';
  });

  const redirectUrl = window.location.href.split('#')[0].split('?')[0];

  const { error } = await supa.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
      queryParams: { access_type: 'offline', prompt: 'select_account' }
    }
  });

  if(error){
    document.querySelectorAll('.auth-btn-google').forEach(function(b){
      b.disabled = false;
      if(b._origHTML) b.innerHTML = b._origHTML;
    });
    showAuthMsg('login-error','<i class="fa-solid fa-triangle-exclamation"></i> فشل تسجيل الدخول بـ Google: ' + error.message);
    showAuthMsg('register-error','<i class="fa-solid fa-triangle-exclamation"></i> فشل تسجيل الدخول بـ Google: ' + error.message);
  }
  // If no error, browser will redirect to Google — no need to re-enable buttons
}

// ============================================================
// FORGOT PASSWORD
// ============================================================
function showForgotPassword(){
  document.querySelectorAll('.auth-panel').forEach(p=>p.classList.remove('active'));
  document.getElementById('panel-forgot')?.classList.add('active');
  clearAuthMessages();
}

async function sendPasswordResetEmail(){
  const user = getSession();
  if(!user || !user.email) { alert('لم يتم العثور على بريدك الإلكتروني'); return; }
  const { error } = await supa.auth.resetPasswordForEmail(user.email, {
    redirectTo: window.location.origin + window.location.pathname
  });
  if(error) {
    showMiniNotif('<i class="fa-solid fa-triangle-exclamation"></i> فشل الإرسال: ' + error.message);
  } else {
    showMiniNotif('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم إرسال رابط إعادة الضبط لـ ' + user.email);
  }
}

async function doForgotPassword(){
  const email = (document.getElementById('forgot-email')?.value||'').trim().toLowerCase();
  if(!email || !email.includes('@')) return showAuthMsg('forgot-error','<i class="fa-solid fa-triangle-exclamation"></i> يرجى إدخال بريد إلكتروني صحيح');

  const btn = document.querySelector('#panel-forgot .auth-btn');
  if(btn){ btn.disabled=true; btn.textContent='⏳ جاري الإرسال...'; }

  const { error } = await supa.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + window.location.pathname
  });

  if(btn){ btn.disabled=false; btn.innerHTML='<i class="fa-solid fa-envelope"></i> إرسال رابط التغيير'; }

  if(error){
    showAuthMsg('forgot-error','<i class="fa-solid fa-triangle-exclamation"></i> ' + error.message);
  } else {
    showAuthMsg('forgot-success','<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم إرسال رابط تغيير كلمة المرور على بريدك الإلكتروني! تحقق من صندوق الوارد (وأحياناً Spam).');
    document.getElementById('forgot-email').value = '';
  }
}

// Handle password reset redirect (when user comes back from email link)
async function checkPasswordResetFlow(){
  const hash = window.location.hash;
  const params = new URLSearchParams(window.location.search);

  if(hash.includes('type=recovery') || params.get('reset')){
    showResetPasswordFromEmail();
    return;
  }

  // Handle OAuth redirect: clean URL hash after Supabase processes it
  if(hash && (hash.includes('access_token') || hash.includes('code=') || params.get('code'))){
    setTimeout(function(){
      try { window.history.replaceState({}, document.title, window.location.pathname); } catch(e){}
    }, 1500);
  }
}

function showResetPasswordFromEmail(){
  const old = document.getElementById('email-reset-overlay');
  if(old) old.remove();
  const div = document.createElement('div');
  div.id = 'email-reset-overlay';
  div.style.cssText = 'position:fixed;inset:0;background:var(--bg);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px';
  div.innerHTML = `
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:32px 28px;width:100%;max-width:400px;box-shadow:0 32px 80px rgba(0,0,0,.6)">
      <div style="text-align:center;margin-bottom:20px">
        <div style="font-size:36px;margin-bottom:8px"><i class="fa-solid fa-key"></i></div>
        <div style="font-size:18px;font-weight:800;color:var(--text)">تعيين كلمة مرور جديدة</div>
      </div>
      <div id="ereset-error" class="auth-error"></div>
      <div id="ereset-ok" class="auth-success"></div>
      <div class="auth-input-group" style="margin-top:12px">
        <label class="auth-label">كلمة المرور الجديدة</label>
        <input class="auth-input" id="ereset-pw1" type="password" placeholder="6 أحرف على الأقل" oninput="checkPwStrength(this.value)">
        <div class="pw-strength"><div class="pw-strength-bar" id="pw-bar"></div></div>
      </div>
      <div class="auth-input-group">
        <label class="auth-label">تأكيد كلمة المرور</label>
        <input class="auth-input" id="ereset-pw2" type="password" placeholder="أعد الكتابة" onkeydown="if(event.key==='Enter')doEmailReset()">
      </div>
      <button class="auth-btn" onclick="doEmailReset()" style="margin-top:8px"><i class="fa-solid fa-lock"></i> حفظ كلمة المرور الجديدة</button>
    </div>`;
  document.body.appendChild(div);
}

async function doEmailReset(){
  const pw1 = document.getElementById('ereset-pw1')?.value||'';
  const pw2 = document.getElementById('ereset-pw2')?.value||'';
  const errEl = document.getElementById('ereset-error');
  const okEl  = document.getElementById('ereset-ok');
  if(errEl) errEl.classList.remove('show');
  if(okEl)  okEl.classList.remove('show');

  if(pw1.length < 6){ if(errEl){errEl.innerHTML='<i class="fa-solid fa-triangle-exclamation"></i> كلمة المرور قصيرة جداً';errEl.classList.add('show');} return; }
  if(pw1 !== pw2){    if(errEl){errEl.innerHTML='<i class="fa-solid fa-triangle-exclamation"></i> كلمتا المرور غير متطابقتين';errEl.classList.add('show');} return; }

  const { error } = await supa.auth.updateUser({ password: pw1 });
  if(error){
    if(errEl){errEl.innerHTML='<i class="fa-solid fa-triangle-exclamation"></i> '+error.message;errEl.classList.add('show');}
  } else {
    if(okEl){okEl.innerHTML='<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم تغيير كلمة المرور بنجاح!';okEl.classList.add('show');}
    setTimeout(()=>{
      document.getElementById('email-reset-overlay')?.remove();
      window.history.replaceState({}, document.title, window.location.pathname);
    }, 2000);
  }
}

// ============================================================
// AVATAR UPLOAD
// ============================================================
async function uploadAvatarPhoto(input){
  const file = input.files[0];
  if(!file) return;
  if(file.size > 5 * 1024 * 1024){ toast('<i class="fa-solid fa-triangle-exclamation"></i> حجم الصورة كبير — الحد الأقصى 5MB'); return; }
  toast('<i class="fa-solid fa-spinner fa-spin"></i> جاري رفع صورة البروفايل...');
  uploadToStorage(file, 'avatars', async function(url){
    await supa.auth.updateUser({ data: { avatarUrl: url } });
    const user = getSession();
    if(user){ user.avatarUrl = url; saveSession(user); }
    const av = document.getElementById('pm-avatar');
    if(av) av.innerHTML = `<img src="${url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
    const headerAv = document.getElementById('user-avatar-icon');
    if(headerAv) headerAv.innerHTML = `<img src="${url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
    showMiniNotif('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم تحديث صورة البروفايل!');
    input.value = '';
  }, function(){ toast('<i class="fa-solid fa-triangle-exclamation"></i> فشل رفع صورة البروفايل'); });
}

// ============================================================
// PROFILE MODAL
// ============================================================
function openProfileModal(){
  const user = getSession();
  if(!user) return;
  const users = getUsers();
  renderProfileBody(user, users);
  openM('modal-profile');
}

function renderProfileBody(user, users, tab='profile'){
  const tabs = ['profile','subscription','accounts','reset',...(_isAdminUser?['adminswitch']:[])];
  const tabLabels = ['بياناتي','اشتراكي','الحسابات','كلمة المرور',...(_isAdminUser?['<i class="fa-solid fa-bolt"></i> أدمن']:[])];
  const tabIcons  = ['<i class="fa-solid fa-user"></i>','<i class="fa-solid fa-box"></i>','<i class="fa-solid fa-users"></i>','<i class="fa-solid fa-lock"></i>',...(_isAdminUser?['']:[])];


  let html = `
    <!-- Avatar + name -->
    <div style="display:flex;flex-direction:column;align-items:center;margin-bottom:8px">
      <div style="position:relative;display:inline-block">
        <div class="profile-avatar-lg" id="pm-avatar" style="cursor:pointer;overflow:hidden;position:relative;margin:0 auto" onclick="document.getElementById('avatar-upload-input').click()" title="اضغط لتغيير الصورة">
          ${user.avatarUrl ? `<img src="${user.avatarUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">` : `<span style="font-size:28px;font-weight:900;color:#fff">${(user.name||'م')[0].toUpperCase()}</span>`}
        </div>
        <div style="position:absolute;bottom:-4px;left:50%;transform:translateX(-50%);background:var(--accent);color:#fff;font-size:9px;font-weight:700;padding:2px 8px;border-radius:6px;white-space:nowrap;pointer-events:none;box-shadow:0 2px 6px rgba(0,0,0,.3)"><i class="fa-solid fa-camera"></i> تغيير</div>
      </div>
    </div>
    <input type="file" id="avatar-upload-input" accept="image/*" style="display:none" onchange="uploadAvatarPhoto(this)">
    <div class="profile-name">${user.name}</div>
    <div class="profile-phone">${user.email || user.phone || ''}</div>

    <!-- Stats -->
    <div class="profile-stats">
      <div class="profile-stat">
        <div class="profile-stat-val">${S.tasks.length}</div>
        <div class="profile-stat-lbl">مهمة</div>
      </div>
      <div class="profile-stat">
        <div class="profile-stat-val">${S.clients.length}</div>
        <div class="profile-stat-lbl">عميل</div>
      </div>
      <div class="profile-stat">
        <div class="profile-stat-val">${S.invoices.length}</div>
        <div class="profile-stat-lbl">فاتورة</div>
      </div>
    </div>

    <!-- Tab buttons -->
    <div style="display:flex;gap:6px;margin-bottom:16px">
      ${tabs.map((t,i)=>`
        <button onclick="_switchSettingsTab('${t}')"
          id="ptab-${t}"
          style="flex:1;padding:8px 4px;border:1.5px solid ${t===tab?'var(--accent)':'var(--border)'};
                 background:${t===tab?'rgba(124,111,247,.12)':'var(--surface2)'};
                 border-radius:8px;color:${t===tab?'var(--accent)':'var(--text2)'};
                 font-family:var(--font);font-size:12px;font-weight:600;cursor:pointer;transition:all .2s">
          ${tabIcons[i]} ${tabLabels[i]}
        </button>`).join('')}
    </div>

    <!-- Tab panels -->
    <div id="ptab-panel">`;

  if(tab==='profile'){
    html += `
      <div class="profile-section" style="border-top:none;padding-top:0">
        <div class="profile-section-title">تعديل البيانات</div>
        <div id="profile-edit-msg" class="auth-success" style="margin-bottom:10px"></div>
        <div class="profile-field">
          <label>الاسم الكامل</label>
          <input id="pe-name" value="${user.name||''}" placeholder="اسمك الكامل">
        </div>
        <div class="profile-field">
          <label>اسم العمل</label>
          <input id="pe-studio" value="${user.studio||''}" placeholder="اسم العمل">
        </div>
        <div class="profile-field">
          <label>رقم الهاتف</label>
          <input id="pe-phone" value="${user.phone||''}" placeholder="01xxxxxxxxx" type="tel">
        </div>
        <div class="profile-actions">
          <button class="btn btn-primary" onclick="saveProfileEdit()"><i class="fa-solid fa-floppy-disk"></i> حفظ التعديلات</button>
          <button class="btn btn-danger" onclick="confirmDeleteAccount()" style="flex:none;padding:9px 14px"><i class="fa-solid fa-trash"></i> حذف الحساب</button>
        </div>
      </div>`;
  } else if(tab==='subscription'){
    const sub  = _userSubscription;
    const plan = sub?.plan || sub?.subscription_plans;
    if(!sub){
      html += `
        <div class="profile-section" style="border-top:none;padding-top:0">
          <div style="text-align:center;padding:16px 0 12px">
            <div style="font-size:44px;margin-bottom:10px"><i class="fa-solid fa-envelope-open"></i></div>
            <div style="font-size:15px;font-weight:700;margin-bottom:6px">لا يوجد اشتراك نشط</div>
            <div style="font-size:12px;color:var(--text2);margin-bottom:18px">اشترِ باقة وأدخل الكود أدناه لتفعيل اشتراكك</div>
          </div>
          <!-- خانة تفعيل السيريال -->
          <div style="background:rgba(108,99,255,.06);border:1.5px dashed rgba(108,99,255,.3);border-radius:13px;padding:16px;margin-bottom:14px">
            <div style="font-size:12px;font-weight:700;color:var(--accent);margin-bottom:10px"><i class="fa-solid fa-key"></i> تفعيل كود الاشتراك</div>
            <div style="display:flex;gap:8px;margin-bottom:7px">
              <input id="_prof_serial" type="text" placeholder="أدخل الكود هنا..." dir="ltr"
                style="flex:1;background:var(--surface2);border:1.5px solid var(--border);border-radius:8px;padding:10px 12px;color:var(--text);font-family:var(--font);font-size:13px;letter-spacing:1.5px;outline:none"
                oninput="this.value=this.value.toUpperCase()"
                onkeydown="if(event.key==='Enter')_activateCode('_prof_serial','_prof_serial_msg',()=>_switchSettingsTab('subscription'))">
              <button onclick="_activateCode('_prof_serial','_prof_serial_msg',()=>_switchSettingsTab('subscription'))"
                style="background:var(--accent);color:#fff;border:none;border-radius:8px;padding:10px 15px;font-family:var(--font);font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap">
                تفعيل
              </button>
            </div>
            <div id="_prof_serial_msg" style="font-size:11px;min-height:14px;text-align:center"></div>
          </div>
          <a href="https://wa.me/201090412218?text=${encodeURIComponent('مرحباً، أريد الاشتراك في Ordo')}" target="_blank"
            style="display:flex;align-items:center;justify-content:center;gap:8px;background:#25D366;color:#fff;padding:12px;border-radius:10px;font-weight:700;text-decoration:none;font-size:13px">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
            شراء باقة عبر واتساب
          </a>
        </div>`;
    } else {
      const isExpired = sub.expiresAt && sub.billing !== 'lifetime' && new Date(sub.expiresAt) < new Date();
      const daysLeft  = (sub.expiresAt && sub.billing !== 'lifetime')
        ? Math.max(0, Math.ceil((new Date(sub.expiresAt) - Date.now()) / 86400000)) : null;
      const dur = sub.billing === 'annual' ? 365 : 30;
      const pct = daysLeft !== null ? Math.min(100, Math.max(0, (daysLeft/dur)*100)) : 100;
      const barColor = daysLeft === null ? 'var(--accent3)' : daysLeft<7 ? 'var(--accent4)' : daysLeft<14 ? 'var(--accent2)' : 'var(--accent3)';
      const feats = Object.entries(plan?.features||{}).filter(([,v])=>v)
        .map(([k])=>({'tasks':'<i class="fa-solid fa-star-of-life"></i> المهام','clients':'<i class="fa-solid fa-users"></i> العملاء','finance':'<i class="fa-solid fa-coins"></i> المالية','invoices':'<i class="fa-solid fa-receipt"></i> الفواتير','schedule':'<i class="fa-solid fa-calendar-days"></i> الجدولة','reports':'<i class="fa-solid fa-chart-bar"></i> التقارير','cloud':'<i class="fa-solid fa-cloud"></i>️ السحابة'}[k]||k));
      html += `
        <div class="profile-section" style="border-top:none;padding-top:0">
          <div style="text-align:center;padding-bottom:16px;border-bottom:1px solid var(--border);margin-bottom:16px">
            <div style="font-size:40px;margin-bottom:8px">${plan?.icon||'<i class="fa-solid fa-box"></i>'}</div>
            <div style="font-size:18px;font-weight:900">${plan?.name||sub.planId||'الباقة'}</div>
            <div style="margin-top:8px">${isExpired
              ? '<span style="background:rgba(255,107,107,.15);color:var(--accent4);padding:4px 14px;border-radius:20px;font-size:12px;font-weight:700"><i class="fa-solid fa-ban"></i> منتهي</span>'
              : '<span style="background:rgba(79,209,165,.15);color:var(--accent3);padding:4px 14px;border-radius:20px;font-size:12px;font-weight:700"><i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> نشط</span>'
            }</div>
          </div>
          <div style="display:flex;flex-direction:column;gap:9px;margin-bottom:14px">
            <div style="display:flex;justify-content:space-between;font-size:13px;align-items:center">
              <span style="color:var(--text2)">نوع الاشتراك</span>
              <span style="font-weight:700">${{'monthly':'<i class="fa-solid fa-calendar-days"></i> شهري','annual':'<i class="fa-solid fa-calendar-days"></i> سنوي','lifetime':'♾️ مدى الحياة'}[sub.billing]||sub.billing||'—'}</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:13px;align-items:center">
              <span style="color:var(--text2)">حد العملاء</span>
              <span style="font-weight:700;color:var(--accent)">${plan?.max_clients ? plan.max_clients+' عميل' : 'غير محدود'}</span>
            </div>
            ${daysLeft !== null ? `
            <div style="display:flex;justify-content:space-between;font-size:13px;align-items:center">
              <span style="color:var(--text2)">الأيام المتبقية</span>
              <span style="font-weight:700;color:${daysLeft<7?'var(--accent4)':'var(--text)'}">${daysLeft} يوم</span>
            </div>` : '<div style="font-size:13px;text-align:center;color:var(--accent3);padding:4px 0">♾️ مدى الحياة</div>'}
            ${sub.activatedAt ? `
            <div style="display:flex;justify-content:space-between;font-size:13px;align-items:center">
              <span style="color:var(--text2)">تاريخ التفعيل</span>
              <span>${new Date(sub.activatedAt).toLocaleDateString('ar-EG')}</span>
            </div>` : ''}
            ${sub.expiresAt && sub.billing!=='lifetime' ? `
            <div style="display:flex;justify-content:space-between;font-size:13px;align-items:center">
              <span style="color:var(--text2)">ينتهي في</span>
              <span style="font-weight:600">${new Date(sub.expiresAt).toLocaleDateString('ar-EG')}</span>
            </div>` : ''}
          </div>
          ${daysLeft !== null ? `
          <div style="margin-bottom:14px">
            <div style="height:6px;background:var(--surface3);border-radius:3px;overflow:hidden">
              <div style="height:100%;width:${pct}%;background:${barColor};border-radius:3px;transition:.4s"></div>
            </div>
            <div style="font-size:10px;color:var(--text3);text-align:center;margin-top:4px">${daysLeft} من ${dur} يوم متبقي</div>
          </div>` : ''}
          ${feats.length ? `
          <div style="margin-bottom:16px">
            <div style="font-size:11px;color:var(--text3);font-weight:700;margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px">الصلاحيات المتاحة</div>
            <div style="display:flex;flex-wrap:wrap;gap:5px">${feats.map(f=>`<span style="background:rgba(124,111,247,.12);color:var(--accent);padding:3px 10px;border-radius:20px;font-size:12px">${f}</span>`).join('')}</div>
          </div>` : ''}
          ${isExpired
            ? `<a href="https://wa.me/201090412218?text=${encodeURIComponent('مرحباً، أريد تجديد اشتراكي — باقة '+(plan?.name||''))}" target="_blank" style="display:flex;align-items:center;justify-content:center;gap:8px;background:#25D366;color:#fff;padding:12px;border-radius:10px;font-weight:700;text-decoration:none;font-size:13px"><i class="fa-solid fa-rotate"></i> تجديد عبر واتساب</a>`
            : `<a href="https://wa.me/201090412218?text=${encodeURIComponent('مرحباً، أريد ترقية اشتراكي — الباقة الحالية: '+(plan?.name||''))}" target="_blank" style="display:flex;align-items:center;justify-content:center;gap:8px;background:var(--accent);color:#fff;padding:12px;border-radius:10px;font-weight:700;text-decoration:none;font-size:13px"><i class="fa-solid fa-rocket"></i> ترقية الباقة</a>`}
        </div>`;
    }
  } else if(tab==='accounts'){
    const allUsers = getUsers();
    html += `
      <div class="profile-section" style="border-top:none;padding-top:0">
        <div class="profile-section-title">الحسابات المسجلة على هذا الجهاز</div>
        <div class="accounts-list">
          ${allUsers.map(u=>`
            <div class="account-item ${u.id===user.id?'current':''}" onclick="${u.id===user.id?'':'switchToAccount('+u.id+')'}">
              <div class="account-item-avatar">${(u.name||'م')[0]}</div>
              <div style="flex:1;min-width:0">
                <div class="account-item-name">${u.name}</div>
                <div class="account-item-phone">${u.phone}</div>
              </div>
              ${u.id===user.id?'<span class="account-item-badge">الحساب الحالي</span>':'<span style="font-size:18px;color:var(--text3)">←</span>'}
            </div>`).join('')}
        </div>
        <button class="btn btn-ghost" style="width:100%;justify-content:center;margin-top:12px" onclick="closeM('modal-profile');doLogout()">
          ➕ إضافة حساب جديد
        </button>
      </div>`;
  } else if(tab==='reset'){
    html += `
      <div class="profile-section" style="border-top:none;padding-top:0">
        <div class="profile-section-title">تغيير كلمة المرور</div>
        <div id="reset-msg" class="auth-error" style="margin-bottom:10px"></div>
        <div id="reset-ok"  class="auth-success" style="margin-bottom:10px"></div>
        <div class="profile-field">
          <label>الحالية</label>
          <input id="rp-old" type="password" placeholder="كلمة المرور الحالية">
        </div>
        <div class="pw-reset-row" style="margin-bottom:10px">
          <div>
            <label class="auth-label" style="margin-right:0">الجديدة</label>
            <input class="auth-input" id="rp-new1" type="password" placeholder="كلمة مرور جديدة" style="font-size:13px" oninput="checkPwStrength2(this.value)">
          </div>
          <div>
            <label class="auth-label" style="margin-right:0">تأكيد الجديدة</label>
            <input class="auth-input" id="rp-new2" type="password" placeholder="أعد الكتابة" style="font-size:13px" onkeydown="if(event.key==='Enter')doResetPassword()">
          </div>
        </div>
        <div class="pw-strength"><div class="pw-strength-bar" id="pw-bar2"></div></div>
        <div id="pw-hint2" style="font-size:11px;color:var(--text3);margin-top:4px;min-height:16px;margin-bottom:12px"></div>
        <button class="btn btn-primary" style="width:100%;justify-content:center" onclick="doResetPassword()"><i class="fa-solid fa-lock"></i> تحديث كلمة المرور</button>
        <div style="text-align:center;margin-top:14px;padding-top:12px;border-top:1px solid var(--border)">
          <span style="font-size:12px;color:var(--text3)">أو </span>
          <button class="btn btn-ghost btn-sm" onclick="sendPasswordResetEmail()" style="font-size:12px"><i class="fa-solid fa-envelope"></i> إرسال رابط إعادة ضبط لبريدي</button>
        </div>
      </div>`;
  } else if(tab==='adminswitch'){
    html += `
      <div class="profile-section" style="border-top:none;padding-top:0">
        <div style="text-align:center;margin-bottom:18px">
          <div style="font-size:38px;margin-bottom:8px"><i class="fa-solid fa-bolt"></i></div>
          <div style="font-size:15px;font-weight:800;margin-bottom:4px">صلاحيات المشرف</div>
          <div style="font-size:12px;color:var(--text2);line-height:1.7">حسابك يملك صلاحيات أدمن<br>يمكنك التبديل في أي وقت</div>
        </div>
        <div style="background:var(--surface2);border:1px solid var(--border);border-radius:12px;padding:14px;margin-bottom:12px;display:flex;align-items:center;gap:10px">
          <div style="width:38px;height:38px;background:rgba(79,209,165,.15);border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0"><i class="fa-solid fa-palette"></i></div>
          <div style="flex:1"><div style="font-size:11px;color:var(--text3);margin-bottom:2px">الوضع الحالي</div><div style="font-weight:800;font-size:13px">موقع المستخدم</div></div>
          <div style="background:rgba(79,209,165,.15);color:var(--accent3);font-size:10px;font-weight:700;padding:3px 9px;border-radius:20px">نشط <i class="fa-solid fa-check"></i></div>
        </div>
        <button onclick="closeM('modal-profile');goToAdminDash()"
          style="width:100%;background:var(--surface2);border:1.5px solid var(--border);border-radius:12px;padding:15px;font-family:var(--font);font-size:13px;font-weight:700;cursor:pointer;color:var(--text);display:flex;align-items:center;gap:10px;margin-bottom:10px;transition:.2s"
          onmouseover="this.style.background='var(--surface3)'" onmouseout="this.style.background='var(--surface2)'">
          <div style="width:36px;height:36px;background:rgba(108,99,255,.15);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0"><i class="fa-solid fa-chart-bar"></i></div>
          <div style="text-align:right;flex:1"><div>فتح لوحة الإدارة</div><div style="font-size:11px;font-weight:400;color:var(--text2);margin-top:2px">إدارة المستخدمين والاشتراكات</div></div>
          <span style="color:var(--text3);font-size:16px">↗</span>
        </button>
        <button onclick="closeM('modal-profile')" style="width:100%;background:rgba(108,99,255,.08);border:1.5px solid rgba(108,99,255,.25);border-radius:12px;padding:13px;font-family:var(--font);font-size:13px;font-weight:700;cursor:pointer;color:var(--accent);display:flex;align-items:center;justify-content:center;gap:8px">
          <span><i class="fa-solid fa-palette"></i></span> البقاء في موقع المستخدم
        </button>
      </div>`;
  }
  html += `</div>`;

  const body = document.getElementById('profile-modal-body');
  if(body) body.innerHTML = html;
}

function _switchSettingsTab(tab){
  const user = getSession();
  if(!user) return;
  renderProfileBody(user, getUsers(), tab);
}

function checkPwStrength2(pw){
  const bar=document.getElementById('pw-bar2');
  const hint=document.getElementById('pw-hint2');
  if(!bar||!hint)return;
  let score=0;
  [pw.length>=8, /[A-Za-z]/.test(pw), /[0-9]/.test(pw), pw.length>=12].forEach(c=>{if(c)score++;});
  const colors=['#f76f7c','#f7c948','#4fd1a5','#7c6ff7'];
  const labels=['ضعيفة','متوسطة','جيدة','قوية جداً'];
  bar.style.width=(score*25)+'%';
  bar.style.background=colors[score-1]||'var(--border)';
  hint.textContent=pw.length?'قوة كلمة المرور: '+(labels[score-1]||''):'';
}

async function saveProfileEdit(){
  const user = getSession();
  if(!user) return;
  const name   = (document.getElementById('pe-name')?.value||'').trim();
  const studio = (document.getElementById('pe-studio')?.value||'').trim();
  const phone  = (document.getElementById('pe-phone')?.value||'').trim();
  const msgEl  = document.getElementById('profile-edit-msg');

  if(!name){ if(msgEl){msgEl.innerHTML='<i class="fa-solid fa-triangle-exclamation"></i> الاسم مطلوب';msgEl.className='auth-error show';} return; }

  // Update Supabase metadata
  await supa.auth.updateUser({ data: { name, studio: studio||name+' Ordo', phone } });

  const updated = {...user, name, studio: studio||name+' Ordo', phone};
  saveSession(updated);
  updateUserBadge(updated);
  if(S.settings){ S.settings.name=studio||name; S.settings.phone=phone; lsSave(); }

  if(msgEl){ msgEl.innerHTML='<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم حفظ التعديلات بنجاح'; msgEl.className='auth-success show'; }
  const av=document.getElementById('pm-avatar'); if(av) av.textContent=(name||'م')[0];
}

async function doResetPassword(){
  const newPw1= document.getElementById('rp-new1')?.value||'';
  const newPw2= document.getElementById('rp-new2')?.value||'';
  const errEl = document.getElementById('reset-msg');
  const okEl  = document.getElementById('reset-ok');
  [errEl,okEl].forEach(el=>{if(el){el.textContent='';el.className=el.id==='reset-ok'?'auth-success':'auth-error';}});
  const show=(el,msg)=>{ if(el){el.innerHTML=msg; el.classList.add('show');} };

  if(newPw1.length<6) return show(errEl,'<i class="fa-solid fa-triangle-exclamation"></i> كلمة المرور الجديدة قصيرة جداً (6 أحرف على الأقل)');
  if(newPw1!==newPw2) return show(errEl,'<i class="fa-solid fa-triangle-exclamation"></i> كلمتا المرور الجديدتان غير متطابقتين');

  const { error } = await supa.auth.updateUser({ password: newPw1 });
  if(error){ show(errEl,'<i class="fa-solid fa-triangle-exclamation"></i> فشل التحديث: '+error.message); return; }

  ['rp-old','rp-new1','rp-new2'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  checkPwStrength2('');
  show(okEl,'<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم تغيير كلمة المرور بنجاح');
}

function switchToAccount(userId){
  const users = getUsers();
  const target = users.find(u=>u.id===userId);
  if(!target) return;
  closeM('modal-profile');
  // show password prompt overlay
  showSwitchPrompt(target);
}

function showSwitchPrompt(target){
  // reuse confirm modal with custom content
  document.getElementById('confirm-msg').innerHTML = `
    <div style="text-align:center;margin-bottom:16px">
      <div style="width:48px;height:48px;background:linear-gradient(135deg,var(--accent),#a89cff);border-radius:14px;display:inline-flex;align-items:center;justify-content:center;font-size:20px;font-weight:900;color:#fff;margin-bottom:8px">${(target.name||'م')[0]}</div>
      <div style="font-size:15px;font-weight:700">${target.name}</div>
      <div style="font-size:12px;color:var(--text3);margin-top:2px">${target.phone}</div>
    </div>
    <div style="margin-bottom:8px">
      <label style="font-size:12px;color:var(--text2);font-weight:600;display:block;margin-bottom:5px">كلمة المرور</label>
      <input id="switch-pw" type="password" class="form-input" placeholder="أدخل كلمة المرور" onkeydown="if(event.key==='Enter')confirmSwitchAccount(${target.id})">
    </div>
    <div id="switch-err" style="font-size:12px;color:var(--accent4);min-height:16px;margin-bottom:4px"></div>`;
  document.getElementById('confirm-btn').textContent = 'تسجيل الدخول';
  document.getElementById('confirm-btn').className   = 'btn btn-primary';
  document.getElementById('confirm-btn').onclick = () => confirmSwitchAccount(target.id);
  openM('modal-confirm');
}

function confirmSwitchAccount(userId){
  const pw  = document.getElementById('switch-pw')?.value||'';
  const users = getUsers();
  const target = users.find(u=>u.id===userId);
  if(!target) return;
  const hash = btoa(encodeURIComponent(pw + target.phone + 'studioOS'));
  if(hash!==target.hash){
    const errEl=document.getElementById('switch-err');
    if(errEl) errEl.innerHTML='<i class="fa-solid fa-triangle-exclamation"></i> كلمة المرور غير صحيحة';
    return;
  }
  closeM('modal-confirm');
  loginUser(target);
  renderAll();
  showPage('dashboard');
}

function confirmDeleteAccount(){
  confirmDel('<i class="fa-solid fa-triangle-exclamation"></i> هل تريد حذف هذا الحساب نهائياً؟ سيتم حذف جميع البيانات المرتبطة به.', async ()=>{
    const user = getSession();
    if(!user) return;
    // حذف من Supabase
    if(_supaUserId){
      await supa.from('studio_data').delete().eq('user_id', _supaUserId);
    }
    localStorage.removeItem(userKey());
    const users = getUsers().filter(u=>u.id!==user.id);
    saveUsers(users);
    clearSession();
    _supaUserId = null;
    await supa.auth.signOut();
    closeM('modal-profile');
    location.reload();
  });
}

