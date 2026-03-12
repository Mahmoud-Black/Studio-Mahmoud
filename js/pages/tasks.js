// ============================================================
// TASKS
// ============================================================
function toggleDeposit(){document.getElementById('deposit-row').style.display=document.getElementById('t-pay').value==='deposit'?'block':'none';}

/* ── نوع العمل في المهمة (فقط يخفي/يظهر قيمة المشروع) ── */
// ============================================================
// THEME / LANGUAGE / DARK MODE
// ============================================================
function toggleDarkLight() {
  const current = localStorage.getItem('studioDisplayMode') || 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  setDisplayMode(next);
  const btn = document.getElementById('dark-toggle-btn');
  if(btn) { var ic=btn.querySelector('i'); if(ic) ic.className=next==='dark'?'fa-solid fa-moon':'fa-solid fa-sun'; }
}

function setDisplayMode(mode) {
  document.body.classList.toggle('light-mode', mode === 'light');
  localStorage.setItem('studioDisplayMode', mode);
  const btnDark  = document.getElementById('btn-dark-mode');
  const btnLight = document.getElementById('btn-light-mode');
  if(btnDark && btnLight) {
    btnDark.className  = mode === 'dark'  ? 'btn btn-primary' : 'btn btn-ghost';
    btnLight.className = mode === 'light' ? 'btn btn-primary' : 'btn btn-ghost';
  }
  const toggleBtn = document.getElementById('dark-toggle-btn');
  if(toggleBtn){ var tic=toggleBtn.querySelector('i'); if(tic) tic.className=mode==='dark'?'fa-solid fa-moon':'fa-solid fa-sun'; var bi=document.querySelector('#bnm-dark-icon i'); if(bi) bi.className=mode==='dark'?'fa-solid fa-moon':'fa-solid fa-sun'; }
  // Sync to cloud
  if(typeof S !== 'undefined' && S){
    if(!S.settings) S.settings={};
    S.settings.displayMode = mode;
    if(typeof lsSave==='function') lsSave();
    clearTimeout(window._modeCloudTimer);
    if(typeof cloudSaveNow==='function') cloudSaveNow(S);
  }
}

function setThemeColor(color) {
  document.documentElement.style.setProperty('--accent', color);
  localStorage.setItem('studioAccentColor', color);
  // update swatches
  document.querySelectorAll('.theme-swatch').forEach(s => {
    s.classList.toggle('active', s.dataset.color === color);
  });
  const picker = document.getElementById('custom-accent-picker');
  if(picker) picker.value = color;
  // Sync to cloud via S.settings
  if(typeof S !== 'undefined' && S){
    if(!S.settings) S.settings={};
    S.settings.accentColor = color;
    if(typeof lsSave === 'function') lsSave();
    if(typeof cloudSave === 'function') clearTimeout(window._themeCloudTimer);
    if(typeof cloudSaveNow==='function') cloudSaveNow(S);
  }
}

// ═══ TRANSLATION SYSTEM ═══
const TRANSLATIONS = {
  en: {
    // Nav
    'الرئيسية':'Dashboard','المهام':'Tasks','المهام والمشاريع':'Tasks & Projects',
    'العملاء':'Clients','إدارة العملاء':'Clients','المالية':'Finance',
    'الفواتير':'Invoices','الفواتير والعقود':'Invoices & Contracts',
    'جدولة اليوم':'Schedule','التقارير':'Reports','الإعدادات':'Settings',
    'فريق العمل':'Team','الميتنج':'Meetings','التعلم والأهداف':'Learning',
    // Auth
    'تسجيل الدخول':'Sign In','إنشاء حساب':'Register',
    'أهلاً بعودتك':'Welcome back','سجّل دخولك لمتابعة العمل':'Sign in to continue',
    'البريد الإلكتروني':'Email','كلمة المرور':'Password',
    'نسيت كلمة المرور؟':'Forgot password?','أو':'or',
    'متابعة بـ Google':'Continue with Google',
    'اسم العمل / المشروع':'Ordo name','رقم الهاتف':'Phone',
    // Dashboard
    'نظرة عامة على استوديوك':'Overview of your studio',
    'مهمة نشطة':'Active task','مهمة منتهية':'Done',
    'إجمالي الدخل':'Total income','اشتراكات منتهية':'Expired subscriptions',
    'مشاريع هذا الشهر':'This month projects',
    // Actions
    'إضافة':'Add','حفظ':'Save','إلغاء':'Cancel','حذف':'Delete','تعديل':'Edit',
    'إغلاق':'Close','بحث':'Search','تصفية':'Filter','تصدير':'Export',
    'حفظ الإعدادات':'Save Settings','<i class="fa-solid fa-floppy-disk"></i> حفظ الإعدادات':'<i class="fa-solid fa-floppy-disk"></i> Save Settings',
    // Tasks
    'إضافة مهمة':'New Task','مهمة جديدة':'New Task','اسم المشروع':'Project Name',
    'العميل':'Client','القيمة':'Value','الموعد النهائي':'Deadline',
    'الحالة':'Status','النوع':'Type','الأولوية':'Priority',
    'جديد':'New','جاري':'In Progress','مراجعة':'Review',
    'قيد التنفيذ':'In Progress','موقوف':'On Hold','منتهي':'Done',
    'ملاحظات':'Notes','إضافة خطوة':'Add Step',
    // Finance
    'تسجيل دخل':'Add Income','تسجيل مصروف':'Add Expense',
    'المبلغ':'Amount','التاريخ':'Date','وصف':'Description',
    'الفئة':'Category','طريقة الدفع':'Payment Method',
    'دخل':'Income','صرف':'Expense','الربح الصافي':'Net Profit',
    'إجمالي الصرف':'Total Expense',
    // Clients
    'عميل جديد':'New Client','اسم العميل':'Client Name',
    'نوع العمل':'Work Type','فري لانس':'Freelance','دوام':'Full-time',
    // Settings
    'إعدادات النظام':'Ordo Settings','خصّص النظام كما تريد':'Customize your system',
    'بيانات العمل':'Ordo Info','شعار العمل':'Ordo Logo',
    'منصات التواصل':'Social Media','مظهر النظام':'Appearance',
    'وضع العرض':'Display Mode','<i class="fa-solid fa-moon"></i> ليلي':'<i class="fa-solid fa-moon"></i> Dark','<i class="fa-solid fa-sun"></i>️ نهاري':'<i class="fa-solid fa-sun"></i>️ Light',
    'لون هوية النظام':'Accent Color','لون مخصص':'Custom color',
    'وسائل الدفع والحسابات':'Payment Methods','بنود الصرف':'Expense Categories',
    'أنواع المهام':'Task Types','حالات المهام':'Task Statuses',
    'قوالب رسائل واتساب':'WhatsApp Templates',
    // Subscription
    'لا يوجد اشتراك نشط':'No active subscription',
    'اشترِ باقة وفعّل كودك هنا':'Purchase a plan and activate your code',
    'تفعيل كود الاشتراك':'Activate Code','أدخل الكود هنا...':'Enter code here...',
    'تفعيل':'Activate','شراء باقة عبر واتساب':'Buy via WhatsApp',
    'اشتراكي الحالي':'My Subscription','الباقات المتاحة':'Available Plans',
    'باقتك الحالية':'Current Plan','عندي كود':'I have a code','اطلب كود':'Request Code',
    // Common
    'جاري التحميل...':'Loading...','لا توجد بيانات':'No data',
    'تأكيد':'Confirm','خطأ':'Error','نجح':'Success',
    'عام':'General','المظهر':'Appearance','خطر':'Danger',
    'منطقة الخطر':'Danger Zone','واتساب':'WhatsApp',
  }
};

let _currentLang = localStorage.getItem('studioLang') || 'ar';

function t(arabicText) {
  if(_currentLang === 'ar') return arabicText;
  return TRANSLATIONS.en[arabicText] || arabicText;
}

function setLanguage(lang) {
  _currentLang = lang;
  localStorage.setItem('studioLang', lang);
  localStorage.setItem('_lang', lang);
  // Update language button indicator
  var li = document.querySelector('._lang-indicator');
  if(li) li.textContent = lang==='ar'?'EN':'AR';
  // Sync document direction
  document.documentElement.lang = lang;
  document.documentElement.dir  = lang==='ar'?'rtl':'ltr';
  document.body.classList.toggle('lang-en', lang==='en');

  // HTML dir/lang
  document.documentElement.lang = lang === 'en' ? 'en' : 'ar';
  document.documentElement.dir  = lang === 'en' ? 'ltr' : 'rtl';

  // Buttons
  const btnAr = document.getElementById('btn-lang-ar');
  const btnEn = document.getElementById('btn-lang-en');
  if(btnAr) btnAr.className = lang === 'ar' ? 'btn btn-primary' : 'btn btn-ghost';
  if(btnEn) btnEn.className = lang === 'en' ? 'btn btn-primary' : 'btn btn-ghost';

  // Apply to all [data-i18n] elements
  applyTranslations(lang);

  // Re-render app
  if(typeof renderAll === 'function') renderAll();
  if(typeof renderNav === 'function') renderNav();
}

function applyTranslations(lang) {
  const dict = lang === 'en' ? TRANSLATIONS.en : null;
  if(!dict) {
    // Restore Arabic
    document.querySelectorAll('[data-i18n-ar]').forEach(el => {
      el.innerHTML = el.getAttribute('data-i18n-ar');
    });
    document.querySelectorAll('.nav-label[data-ar]').forEach(el => {
      const icon = el.querySelector('i,svg');
      const ar = el.getAttribute('data-ar');
      if(ar){ el.textContent = ar; if(icon) el.prepend(icon); }
    });
    return;
  }
  // Translate [data-i18n] elements — preserve FA icons inside
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if(!dict[key]) return;
    const icon = el.querySelector('i.fa-solid, i.fa-regular, svg');
    if(icon){
      // Save original AR for restoration
      if(!el.getAttribute('data-i18n-ar')) el.setAttribute('data-i18n-ar', el.innerHTML);
      el.innerHTML = '';
      el.appendChild(icon.cloneNode(true));
      el.appendChild(document.createTextNode(' ' + dict[key]));
    } else {
      if(!el.getAttribute('data-i18n-ar')) el.setAttribute('data-i18n-ar', el.innerHTML);
      el.textContent = dict[key];
    }
  });
  // Translate nav labels — preserve icons
  document.querySelectorAll('.nav-label').forEach(el => {
    const ar = el.getAttribute('data-ar') || el.textContent.trim();
    el.setAttribute('data-ar', ar);
    const icon = el.querySelector('i,svg');
    if(icon){
      el.innerHTML = '';
      el.appendChild(icon.cloneNode(true));
      el.appendChild(document.createTextNode(' ' + (dict[ar] || ar)));
    } else {
      el.textContent = dict[ar] || ar;
    }
  });
  // Translate buttons with data-ar — preserve icons
  document.querySelectorAll('button[data-ar], .btn[data-ar]').forEach(el => {
    const ar = el.getAttribute('data-ar');
    if(!ar || !dict[ar]) return;
    const icon = el.querySelector('i.fa-solid, i.fa-regular, svg');
    if(icon){
      el.innerHTML = '';
      el.appendChild(icon.cloneNode(true));
      el.appendChild(document.createTextNode(' ' + dict[ar]));
    } else {
      el.textContent = dict[ar];
    }
  });
}

function loadThemePreferences() {
  const mode  = localStorage.getItem('studioDisplayMode') || 'light';
  const color = localStorage.getItem('studioAccentColor') || '#7c6ff7';
  const lang  = localStorage.getItem('studioLang') || 'ar';
  setDisplayMode(mode);
  setThemeColor(color);
  setLanguage(lang);
  // Update sidebar toggle icon
  const btn = document.getElementById('dark-toggle-btn');
  if(btn){ var _ic=btn.querySelector('i'); if(_ic) _ic.className=mode==='dark'?'fa-solid fa-moon':'fa-solid fa-sun'; }
}

// ============================================================
// TASK AUTO-FILL FROM CLIENT TYPE
// ============================================================
function onTaskClientChange(clientName) {
  if(!clientName) return;
  const client = S.clients.find(c => c.name === clientName);
  if(!client) return;
  const jobtypeEl = document.getElementById('t-jobtype');
  if(!jobtypeEl) return;
  // Auto-set job type from client work type
  if(client.workType === 'fulltime') {
    jobtypeEl.value = 'fulltime';
  } else if(client.workType === 'parttime') {
    jobtypeEl.value = 'fulltime'; // part-time maps to fulltime
  } else {
    jobtypeEl.value = 'freelance';
  }
  toggleJobType();
}

// ============================================================
// INCOME MODAL - CLIENT → PROJECT FILTER
// ============================================================
function onIncomeClientChange(clientName) {
  // Fill tasks dropdown
  const taskSel = document.getElementById('in-linked-task');
  if(taskSel) {
    taskSel.innerHTML = '<option value="">— لا ربط —</option>';
    if(clientName) {
      const clientTasks = S.tasks.filter(t => t.client === clientName);
      const statusLabel = {new:'جديد', progress:'جاري', review:'مراجعة', done:'مكتمل'};
      clientTasks.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t.id;
        opt.textContent = t.title + (t.status ? ' (' + (statusLabel[t.status]||t.status) + ')' : '');
        taskSel.appendChild(opt);
      });
    }
  }
  // Fill projects dropdown
  const projSel = document.getElementById('in-linked-project');
  if(projSel) {
    projSel.innerHTML = '<option value="">— لا يوجد مشروع —</option>';
    if(clientName) {
      const client = (S.clients||[]).find(c => c.name === clientName);
      const clientProjects = (S.projects||[]).filter(p =>
        (client && String(p.client_id) === String(client.id)) ||
        p.client === clientName
      );
      clientProjects.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.name + (p.status ? ' · ' + ({active:'نشط',hold:'معلق',review:'مراجعة',done:'مكتمل'}[p.status]||p.status) : '');
        projSel.appendChild(opt);
      });
      // Also add all projects as fallback
      if(!clientProjects.length) {
        (S.projects||[]).forEach(p => {
          const opt = document.createElement('option');
          opt.value = p.id;
          opt.textContent = p.name;
          projSel.appendChild(opt);
        });
      }
    } else {
      // No client selected - show all projects
      (S.projects||[]).forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.name;
        projSel.appendChild(opt);
      });
    }
  }
}

// Populate income client dropdown with all clients
function fillIncomeClientDropdown() {
  const sel = document.getElementById('in-source');
  if(!sel) return;
  sel.innerHTML = '<option value="">— اختر عميل أو اكتب المصدر —</option>';
  S.clients.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.name;
    opt.textContent = c.name;
    sel.appendChild(opt);
  });
  // add free-text option
  const other = document.createElement('option');
  other.value = '__other__';
  other.innerHTML='<i class="fa-solid fa-pen"></i> مصدر آخر...';
  sel.appendChild(other);
}

function toggleJobType(){
  const jt = document.getElementById('t-jobtype')?.value||'freelance';
  const isFulltime = jt==='fulltime';
  document.getElementById('t-value-row').style.display = isFulltime?'none':'grid';
  if(isFulltime){
    document.getElementById('deposit-row').style.display='none';
  }
}

/* ── Salary reminders on dashboard ── */
function renderSalaryReminders(){
  const wrap = document.getElementById('dash-salary-reminders');
  if(!wrap) return;
  const now = new Date();
  const curY = now.getFullYear(), curM = now.getMonth()+1, curD = now.getDate();

  // قراءة بيانات الراتب من العملاء (مش من المهام)
  const salariedClients = S.clients.filter(c=>
    (c.workType==='fulltime'||c.workType==='parttime') && c.salary>0 && c.salaryDay
  );
  if(!salariedClients.length){ wrap.style.display='none'; return; }

  const cards = salariedClients.map(c=>{
    const salDay = +c.salaryDay;
    const lastPaid = c.salaryLastPaid;
    const paidThisMonth = lastPaid && lastPaid === `${curY}-${String(curM).padStart(2,'0')}`;
    if(paidThisMonth) return '';

    const isOverdue = curD >= salDay;
    const daysLeft  = salDay - curD;
    const wtLabel   = c.workType==='fulltime'?'<i class="fa-solid fa-building"></i> دوام كامل':'<i class="fa-solid fa-alarm-clock"></i> بارت تايم';

    return `<div class="salary-card ${isOverdue?'overdue':'pending'}">
      <div style="font-size:22px">${isOverdue?'<i class="fa-solid fa-siren-on"></i>':'<i class="fa-solid fa-coins"></i>'}</div>
      <div style="flex:1">
        <div style="font-weight:700;font-size:14px">${c.name}</div>
        <div style="font-size:12px;color:var(--text2);margin-top:2px">
          ${wtLabel} · راتب <b style="color:var(--accent3)">${c.salary.toLocaleString()} ج</b>
          ${isOverdue
            ? `<span style="color:#ff6b6b;font-weight:700;margin-right:8px">● موعد الراتب يوم ${salDay}${curD>salDay?' — تجاوز الموعد!':' — اليوم!'}</span>`
            : `<span style="color:var(--accent2);margin-right:8px"><i class="fa-solid fa-alarm-clock"></i> ينزل بعد ${daysLeft} يوم (يوم ${salDay})</span>`
          }
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end">
        <button class="btn btn-success btn-sm" onclick="markClientSalaryPaid(${c.id})"><i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم القبض</button>
        <button class="btn btn-ghost btn-sm" style="font-size:10px" onclick="snoozeClientSalary(${c.id})">+يوم تأجيل</button>
      </div>
    </div>`;
  }).filter(Boolean).join('');

  if(!cards){ wrap.style.display='none'; return; }
  wrap.style.display='block';
  wrap.innerHTML=`<div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:8px"><i class="fa-solid fa-briefcase"></i> تذكيرات الرواتب</div>${cards}`;
}

function markClientSalaryPaid(clientId){
  const c = S.clients.find(x=>x.id===clientId);
  if(!c) return;
  const now = new Date();
  c.salaryLastPaid = now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0');
  const income = { id:Date.now(), type:'income', desc:`راتب — ${c.name}`, source:c.name, amount:c.salary||0, date:now.toISOString().split('T')[0] };
  S.transactions.push(income);
  lsSave(); renderAll();
  showMiniNotif(`<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم تسجيل راتب ${(c.salary||0).toLocaleString()} ج من ${c.name}`);
}

function snoozeClientSalary(clientId){
  const c = S.clients.find(x=>x.id===clientId);
  if(!c) return;
  c.salaryDay = Math.min(+c.salaryDay+1, 28);
  lsSave(); renderSalaryReminders();
  showMiniNotif(`<i class="fa-solid fa-alarm-clock"></i> تم تأجيل موعد الراتب ليوم ${c.salaryDay}`);
}

/* ── Task Filters ── */
let taskFilterState = {status:'',priority:'',jobtype:'',client:'',month:'',year:'',search:''};

function populateTaskFilterDropdowns(){
  // clients
  const cfsel = document.getElementById('tf-client');
  if(cfsel){
    const cur = cfsel.value;
    cfsel.innerHTML = '<option value="">كل العملاء</option>';
    [...new Set(S.tasks.map(t=>t.client).filter(Boolean))].forEach(c=>{
      const o=document.createElement('option');o.value=c;o.textContent=c;cfsel.appendChild(o);
    });
    cfsel.value = cur;
  }
  // years
  const yrsel = document.getElementById('tf-year');
  if(yrsel){
    const cur = yrsel.value;
    yrsel.innerHTML = '<option value="">كل السنوات</option>';
    const years = [...new Set(S.tasks.flatMap(t=>[t.orderDate,t.deadline]).filter(Boolean).map(d=>d.slice(0,4)))].sort();
    years.forEach(y=>{const o=document.createElement('option');o.value=y;o.textContent=y;yrsel.appendChild(o);});
    yrsel.value = cur;
  }
}

function applyTaskFilters(){
  taskFilterState.status   = document.getElementById('tf-status')?.value||'';
  taskFilterState.priority = document.getElementById('tf-priority')?.value||'';
  taskFilterState.jobtype  = document.getElementById('tf-jobtype')?.value||'';
  taskFilterState.client   = document.getElementById('tf-client')?.value||'';
  taskFilterState.month    = document.getElementById('tf-month')?.value||'';
  taskFilterState.year     = document.getElementById('tf-year')?.value||'';
  taskFilterState.search   = (document.getElementById('tf-search')?.value||'').trim().toLowerCase();
  renderTasks();
}

function resetTaskFilters(){
  ['tf-status','tf-priority','tf-jobtype','tf-client','tf-month','tf-year'].forEach(id=>{
    const el=document.getElementById(id);if(el)el.value='';
  });
  const s=document.getElementById('tf-search');if(s)s.value='';
  taskFilterState={status:'',priority:'',jobtype:'',client:'',month:'',year:'',search:''};
  renderTasks();
}

function filterTasks(tasks){
  const f=taskFilterState;
  return tasks.filter(t=>{
    if(f.status   && (f.status==='done'?!t.done:f.status==='paused'?(t.status!=='paused'):(t.status!==f.status||t.done||t.status==='paused'))) return false;
    if(f.priority && t.priority!==f.priority) return false;
    if(f.jobtype  && (t.jobType||'freelance')!==f.jobtype) return false;
    if(f.client   && t.client!==f.client) return false;
    if(f.month||f.year){
      const d = t.orderDate||t.deadline||'';
      if(!d) return false;
      const [yr,mo] = d.split('-');
      if(f.month && mo !== f.month.padStart(2,'0')) return false;
      if(f.year  && yr !== f.year) return false;
    }
    if(f.search){
      const hay = (t.title+' '+(t.client||'')+' '+(t.notes||'')).toLowerCase();
      if(!hay.includes(f.search)) return false;
    }
    return true;
  });
}

/* ── Client Filters ── */
function setCFType(val, btn){
  document.querySelectorAll('.cf-type-btn').forEach(b=>b.classList.remove('active'));
  if(btn) btn.classList.add('active');
  const el=document.getElementById('cf-type'); if(el) el.value=val;
  renderClients();
}
function setCFChannel(val, btn){
  document.querySelectorAll('.cf-ch-btn').forEach(b=>b.classList.remove('active'));
  if(btn) btn.classList.add('active');
  const el=document.getElementById('cf-channel'); if(el) el.value=val;
  renderClients();
}
function applyClientFilters(){
  renderClients();
}
function resetClientFilters(){
  ['cf-type','cf-channel'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  document.querySelectorAll('.cf-type-btn').forEach((b,i)=>b.classList.toggle('active',i===0));
  document.querySelectorAll('.cf-ch-btn').forEach((b,i)=>b.classList.toggle('active',i===0));
  const s=document.getElementById('cf-search');if(s)s.value='';
  renderClients();
}

/* فلتر مهام داخل ملف العميل */
function filterClientProfileTasks(clientName){
  const statusF = document.getElementById('cp-tf-status')?.value||'';
  const monthF  = document.getElementById('cp-tf-month')?.value||'';
  const tbody = document.getElementById('cp-tasks-tbody');
  if(!tbody) return;
  tbody.querySelectorAll('tr').forEach(tr=>{
    const order  = tr.dataset.order||'';
    const status = tr.dataset.status||'';
    let show = true;
    if(statusF && status !== statusF) show = false;
    if(monthF  && !order.includes('-'+monthF+'-') && order.slice(5,7) !== monthF) show = false;
    tr.style.display = show ? '' : 'none';
  });
}

/* ── Quill editor instance ── */
let taskQuill = null;
function initTaskQuill(){
  if(taskQuill) return; // already initialized
  taskQuill = new Quill('#t-brief-editor', {
    theme: 'snow',
    placeholder: 'اكتب تفاصيل المهمة هنا — يمكنك إضافة روابط، قوائم، وتنسيق النص...',
    modules: {
      toolbar: [
        ['bold','italic','underline'],
        [{ list:'ordered' }, { list:'bullet' }],
        ['link','image'],
        [{ color:[] }],
        ['clean']
      ]
    }
  });
}

/* ── Task Detail Modal ── */
function openTaskDetail(id){
  const t = S.tasks.find(x => x.id === id);
  if(!t) return;

  // Set edit button
  const editBtn = document.getElementById('td-edit-btn');
  if(editBtn) editBtn.onclick = () => { closeM('modal-task-detail'); openTaskModal(id); };

  const statusLabel = {new:'جديد',progress:'قيد التنفيذ',review:'مراجعة',done:'مكتمل'};
  const statusColor = {new:'var(--text3)',progress:'var(--accent2)',review:'var(--accent)',done:'var(--accent3)'};
  const prioLabel   = {high:'<i class="fa-solid fa-circle"></i> عالية',med:'<i class="fa-solid fa-circle"></i> متوسطة',low:'<i class="fa-solid fa-circle"></i> منخفضة'};
  const payLabel    = {none:'<i class="fa-solid fa-circle-xmark"></i> غير مدفوع',deposit:'<i class="fa-solid fa-heart"></i> عربون',full:'<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> مدفوع كاملاً'};

  const body = document.getElementById('td-body');
  if(!body) return;

  // Brief section
  const briefHTML = t.brief
    ? `<div class="td-section-label"><i class="fa-solid fa-file-lines"></i> تفاصيل المشروع</div><div class="td-brief">${t.brief}</div>`
    : '';

  // Notes
  const notesHTML = t.notes
    ? `<div class="td-section-label"><i class="fa-solid fa-pen-to-square"></i> ملاحظات</div>
       <div style="background:var(--surface2);border-radius:var(--r2);padding:12px 14px;font-size:13px;color:var(--text2);line-height:1.7;border:1px solid var(--border)">${t.notes.replace(/\n/g,'<br>')}</div>`
    : '';

  // Related invoices
  const relInv = S.invoices.filter(inv => inv.items.some(it => it._taskId === id));
  const invHTML = relInv.length
    ? `<div class="td-section-label"><i class="fa-solid fa-square"></i> فواتير مرتبطة</div>
       <div style="display:flex;flex-direction:column;gap:6px">
         ${relInv.map(inv=>`
           <div style="display:flex;justify-content:space-between;align-items:center;background:var(--surface2);border-radius:var(--r2);padding:10px 14px;border:1px solid var(--border)">
             <div>
               <span style="font-weight:700;font-size:13px">${inv.num}</span>
               <span style="font-size:11px;color:var(--text3);margin-right:8px">${inv.date}</span>
             </div>
             <div style="display:flex;align-items:center;gap:10px">
               <span style="font-weight:700;color:var(--accent3)">${inv.total.toLocaleString()} ج</span>
               <span class="badge ${inv.status==='paid'?'badge-green':'badge-yellow'}">${inv.status==='paid'?'<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> مدفوع':'⏳ معلق'}</span>
             </div>
           </div>`).join('')}
       </div>`
    : '';

  body.innerHTML = `
    <div class="td-header">
      <div>
        <div class="td-title">${t.title}</div>
        <div class="td-meta">
          <span style="color:${statusColor[t.status]};font-weight:700;font-size:12px">● ${statusLabel[t.status]||t.status}</span>
          ${t.client?`<span style="background:rgba(124,111,247,.15);color:var(--accent);padding:2px 10px;border-radius:20px;font-size:11px;font-weight:700">${t.client}</span>`:''}
          <span style="background:var(--surface2);border:1px solid var(--border);padding:2px 10px;border-radius:20px;font-size:11px">${prioLabel[t.priority]||t.priority}</span>
          ${t.taskType?`<span class="task-type-pill">${t.taskType}</span>`:''}
          ${t.done?'<span style="background:rgba(79,209,165,.15);color:var(--accent3);padding:2px 10px;border-radius:20px;font-size:11px;font-weight:700"><i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> مكتمل</span>':''}
        </div>
      </div>
    </div>

    <div class="td-info-grid">
      ${t.value?`<div class="td-info-cell"><div class="lbl">قيمة المشروع</div><div class="val" style="color:var(--accent3)">${t.value.toLocaleString()} ج</div></div>`:''}
      ${t.deposit&&t.pay==='deposit'?`<div class="td-info-cell"><div class="lbl">العربون</div><div class="val" style="color:var(--accent2)">${t.deposit.toLocaleString()} ج</div></div>`:''}
      ${t.workerType==='team'&&t.workerMember?`<div class="td-info-cell"><div class="lbl"><i class="fa-solid fa-user"></i> المنفذ</div><div class="val" style="color:#64b5f6">${t.workerMember}</div></div>`:''}
      ${t.workerType==='team'&&t.workerAmount?`<div class="td-info-cell"><div class="lbl"><i class="fa-solid fa-coins"></i> مستحق المنفذ</div><div class="val" style="color:var(--accent2)">${t.workerAmount.toLocaleString()} ج</div></div>`:''}
      ${t.workerType==='team'&&t.value&&t.workerAmount?`<div class="td-info-cell"><div class="lbl"><i class="fa-solid fa-trophy"></i> ربحي الصافي</div><div class="val" style="color:var(--accent3)">${(t.value-t.workerAmount).toLocaleString()} ج</div></div>`:''}
      ${t.paymentCollected?`<div class="td-info-cell"><div class="lbl">تحصيل المبلغ</div><div class="val" style="color:var(--accent3)"><i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم التحصيل</div></div>`:(t.done&&t.value?`<div class="td-info-cell"><div class="lbl">تحصيل المبلغ</div><div class="val" style="color:var(--accent4)">⏳ لم يتم بعد</div></div>`:'')}
      <div class="td-info-cell"><div class="lbl">حالة الدفع</div><div class="val" style="font-size:12px">${payLabel[t.pay||'none']}</div></div>
      ${t.orderDate?`<div class="td-info-cell"><div class="lbl">تاريخ الطلب</div><div class="val" style="font-family:var(--mono)">${t.orderDate}</div></div>`:''}
      ${t.deadline?`<div class="td-info-cell"><div class="lbl">تاريخ التسليم</div><div class="val" style="font-family:var(--mono);color:var(--accent4)">${t.deadline}</div></div>`:''}
    </div>

    ${renderStepsInDetail(t)}
    ${briefHTML}
    ${notesHTML}
    ${invHTML}

    <!-- ✅ رابط تسليم المشروع — قابل للتعديل -->
    <div style="margin:0 0 16px;padding:14px 16px;background:var(--surface2);border-radius:var(--r2);border:1px solid var(--border)">
      <div style="font-size:12px;font-weight:700;color:var(--text3);margin-bottom:10px;display:flex;align-items:center;gap:6px">
        <i class="fa-solid fa-link" style="color:var(--accent3)"></i> رابط تسليم المشروع
        ${t.clientReceived?'<span style="font-size:10px;background:rgba(79,209,165,.15);color:var(--accent3);padding:2px 8px;border-radius:20px;font-weight:700"><i class="fa-solid fa-handshake"></i> استلم العميل</span>':''}
      </div>
      <div style="display:flex;gap:8px">
        <input id="td-proj-link-input" type="url" value="${escapeHtml(t.projectLink||t.driveLink||'')}" placeholder="https://drive.google.com/... أو أي رابط للتسليم" style="flex:1;padding:8px 12px;background:var(--surface);border:1px solid var(--border);border-radius:8px;font-size:12px;color:var(--text);font-family:var(--font)"/>
        <button onclick="_saveTaskDeliveryLink(${t.id})" class="btn btn-ghost btn-sm" style="flex-shrink:0;padding:8px 14px"><i class="fa-solid fa-floppy-disk"></i> حفظ</button>
        ${(t.projectLink||t.driveLink)?`<a href="${escapeHtml(t.projectLink||t.driveLink)}" target="_blank" class="btn btn-ghost btn-sm" style="flex-shrink:0;padding:8px 12px;color:var(--accent3)" title="فتح الرابط"><i class="fa-solid fa-external-link-alt"></i></a>`:''}
      </div>
    </div>
    <div style="margin:16px 0;padding:16px;background:var(--surface2);border-radius:var(--r2);border:1px solid var(--border)">
      <div style="font-size:13px;font-weight:700;margin-bottom:12px;display:flex;align-items:center;gap:8px">
        <i class="fa-solid fa-comments" style="color:var(--accent)"></i>
        ملاحظات وتعليقات
        <span style="font-size:10px;background:rgba(124,111,247,.15);color:var(--accent);padding:2px 8px;border-radius:8px">${(t.comments||[]).filter(c=>c.stepIdx===null||c.stepIdx===undefined).length}</span>
      </div>
      ${(() => {
        const taskComments = (t.comments||[]).filter(c=>c.stepIdx===null||c.stepIdx===undefined);
        const commentsHtml = taskComments.map(c => {
          const d = new Date(c.at);
          const timeStr = d.getDate()+'/'+(d.getMonth()+1)+'/'+d.getFullYear()+' '+d.getHours().toString().padStart(2,'0')+':'+d.getMinutes().toString().padStart(2,'0');
          return `<div style="background:var(--surface);border:1px solid rgba(124,111,247,.2);border-radius:10px;padding:10px 14px;margin-bottom:6px">
            <div style="display:flex;justify-content:space-between;margin-bottom:4px">
              <span style="font-size:11px;font-weight:700;color:var(--accent)">${escapeHtml(c.author||'')}</span>
              <span style="font-size:10px;color:var(--text3)">${timeStr}</span>
            </div>
            <div style="font-size:13px;color:var(--text2);line-height:1.6">${escapeHtml(c.text)}</div>
          </div>`;
        }).join('') || '<div style="font-size:12px;color:var(--text3);text-align:center;padding:8px">لا ملاحظات بعد</div>';
        return commentsHtml;
      })()}
      <div style="display:flex;gap:8px;margin-top:10px">
        <textarea id="td-comment-input" style="flex:1;padding:8px 12px;background:var(--surface);border:1px solid var(--border);border-radius:10px;font-size:13px;color:var(--text);resize:none;font-family:var(--font)" rows="2" placeholder="أضف ملاحظة على هذه المهمة..."></textarea>
        <button style="padding:10px 16px;background:var(--accent);color:#fff;border:none;border-radius:10px;cursor:pointer;font-size:13px;align-self:flex-end" onclick="window._submitLocalComment('${t.id}',document.getElementById('td-comment-input'),null)"><i class="fa-solid fa-paper-plane"></i></button>
      </div>
    </div>

    <div style="display:flex;gap:8px;margin-top:20px;padding-top:16px;border-top:1px solid var(--border);flex-wrap:wrap">
      ${!t.done
        ? `<button class="btn btn-success" onclick="closeM('modal-task-detail');completeTask(${t.id})"><i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> إكمال المشروع</button>`
        : `<button class="btn btn-ghost btn-sm" onclick="closeM('modal-task-detail');completeTask(${t.id})">↩ إلغاء الإكمال</button>`
      }
      ${!t.done ? `
      <select id="td-status-sel" onchange="if(this.value){changeTaskStatus(${t.id},this.value);closeM('modal-task-detail')}" style="height:36px;padding:0 10px;background:var(--surface2);border:1px solid var(--border);border-radius:8px;color:var(--text);font-family:var(--font);font-size:12px;cursor:pointer" title="تغيير الحالة">
        <option value=""><i class="fa-solid fa-bolt"></i> تغيير الحالة</option>
        ${(()=>{
          const hidden=S.hiddenStatuses||[];
          const custom=S.customStatuses||[];
          const defaults=[
            {id:'new',label:'<i class="fa-solid fa-clipboard-list"></i> جديد'},{id:'progress',label:'<i class="fa-solid fa-bolt"></i> قيد التنفيذ'},
            {id:'review',label:'<i class="fa-solid fa-magnifying-glass"></i> مراجعة'},{id:'paused',label:'⏸ موقوف مؤقتاً'}
          ];
          const defOpts=defaults.filter(x=>!hidden.includes(x.id)&&x.id!==t.status).map(x=>`<option value="${x.id}">${x.label}</option>`).join('');
          const cusOpts=custom.filter(x=>x.id!==t.status).map(x=>`<option value="${x.id}">${x.icon||''} ${x.label}</option>`).join('');
          return defOpts+cusOpts+'<option value="done"><i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تحديد كمكتملة</option>';
        })()}
      </select>` : `
      <button onclick="changeTaskStatus(${t.id},'progress');closeM('modal-task-detail')" class="btn btn-ghost btn-sm">↺ إعادة فتح المهمة</button>`}
      <button class="btn btn-ghost" onclick="closeM('modal-task-detail');openInvoiceFromTask(${JSON.stringify(t).replace(/"/g,'&quot;')})"><i class="fa-solid fa-square"></i> إصدار فاتورة</button>
      ${(()=>{
        // زرار لينك متابعة التاسك — بس لو في عميل مرتبط بيه
        var cl = (S.clients||[]).find(function(c){ return c.name===t.client; });
        if(!cl) return '';
        var _portal = (S.client_portals||[]).find(function(p){ return String(p.task_id)===String(t.id); });
        var taskLink = _buildPortalLink(cl.name, _portal?_portal.id:'');
        return '<button class="btn btn-ghost btn-sm" style="background:rgba(124,111,247,.12);color:var(--accent);border:1px solid var(--accent)44" onclick="navigator.clipboard.writeText(\''+taskLink+'\').then(function(){toast(\'<i class=\\\"fa-solid fa-square-check\\\" style=\\\"color:var(--accent3)\\\"></i> تم نسخ لينك متابعة التاسك\')})"><i class="fa-solid fa-link"></i> لينك للعميل</button>';
      })()}
      <button class="btn btn-sm" style="background:#25D366;color:#fff;border:none;border-radius:8px;padding:8px 14px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:6px;font-family:var(--font)" onclick="openWaModal('task',null,${t.id})">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
        واتساب
      </button>
      <div style="flex:1"></div>
      <button class="btn btn-danger btn-sm" onclick="closeM('modal-task-detail');delTask(${t.id})"><i class="fa-solid fa-trash"></i> حذف</button>
    </div>`;

  openM('modal-task-detail');
}

function openTaskModal(id){
  fillDD('t-client');
  fillTaskTypesDD();
  fillWorkerMembersDD();
  document.getElementById('task-modal-ttl').innerHTML=id?'<i class="fa-solid fa-star-of-life"></i> تعديل المهمة':'<i class="fa-solid fa-star-of-life"></i> مهمة / مشروع جديد';
  document.getElementById('task-eid').value=id||'';
  const invCb=document.getElementById('t-issue-inv');
  if(invCb)invCb.checked=false;
  const invHint=document.getElementById('t-inv-hint');
  if(invHint)invHint.style.display='none';
  if(id){
    const t=S.tasks.find(t=>t.id===id);if(!t)return;
    document.getElementById('t-title').value=t.title;
    document.getElementById('t-client').value=t.client||'';
    document.getElementById('t-priority').value=t.priority;
    document.getElementById('t-status').value=t.status;
    document.getElementById('t-value').value=t.value||'';
    document.getElementById('t-order').value=t.orderDate||'';
    document.getElementById('t-deadline').value=t.deadline||'';
    document.getElementById('t-pay').value=t.pay||'none';
    document.getElementById('t-deposit').value=t.deposit||'';
    document.getElementById('t-notes').value=t.notes||'';
    document.getElementById('t-jobtype').value=t.jobType||'freelance';
    const ttEl=document.getElementById('t-tasktype');if(ttEl)ttEl.value=t.taskType||'';
    toggleDeposit(); toggleJobType();
    // Load worker fields
    const workerType = document.getElementById('t-worker-type');
    if(workerType) workerType.value = t.workerType||'me';
    toggleWorkerFields();
    // Restore worker pay mode
    if(t.workerPayMode) { workerPayMode = t.workerPayMode; setWorkerPayMode(t.workerPayMode); }
    else { workerPayMode='fixed'; setWorkerPayMode('fixed'); }
    if(t.workerPct){ const pe=document.getElementById('t-worker-pct'); if(pe) pe.value=t.workerPct; }
    const workerMember = document.getElementById('t-worker-member');
    if(workerMember && t.workerMember) workerMember.value = t.workerMember;
    const workerAmt = document.getElementById('t-worker-amount');
    if(workerAmt) workerAmt.value = t.workerAmount||'';
    const workerDepStat = document.getElementById('t-worker-deposit-status');
    if(workerDepStat) workerDepStat.value = t.workerDepositPaid ? 'yes' : 'no';
    toggleWorkerDepositField();
    const workerDepAmt = document.getElementById('t-worker-deposit-amount');
    if(workerDepAmt) workerDepAmt.value = t.workerDepositAmount||'';
    calcTaskProfit();
    // Steps
    renderTaskStepsForm(t.steps||[]);
    setTimeout(()=>{
      initTaskQuill();
      if(t.brief) taskQuill.clipboard.dangerouslyPasteHTML(t.brief);
      else taskQuill.setText('');
    }, 80);
  } else {
    ['t-title','t-value','t-deposit','t-notes'].forEach(f=>{const e=document.getElementById(f);if(e)e.value='';}); 
    document.getElementById('t-client').value='';
    document.getElementById('t-priority').value='med';
    document.getElementById('t-status').value='new';
    document.getElementById('t-pay').value='none';
    document.getElementById('t-order').value=today();
    document.getElementById('t-deadline').value='';
    document.getElementById('t-jobtype').value='freelance';
    const ttEl=document.getElementById('t-tasktype');if(ttEl)ttEl.value='';
    document.getElementById('deposit-row').style.display='none';
    toggleJobType();
    // Reset worker fields
    const wtEl=document.getElementById('t-worker-type');if(wtEl)wtEl.value='me';
    toggleWorkerFields();
    fillWorkerMembersDD();
    renderTaskStepsForm([]);
    setTimeout(()=>{ initTaskQuill(); taskQuill.setText(''); }, 80);
  }
  openM('modal-task');
}
function toggleTaskInvHint(){
  const cb=document.getElementById('t-issue-inv');
  const hint=document.getElementById('t-inv-hint');
  if(hint)hint.style.display=cb&&cb.checked?'block':'none';
}
function saveTask(){
  const title=v('t-title').trim(),client=v('t-client');
  if(!title)return alert('أدخل اسم المهمة');
  if(!client)return alert('<i class="fa-solid fa-triangle-exclamation"></i> يجب اختيار عميل\n\nلو مش موجود، استخدم زر + بجانب القائمة لإضافة عميل جديد');
  const eid=v('task-eid');
  const issueInv=document.getElementById('t-issue-inv')?.checked;
  const briefHTML = taskQuill ? taskQuill.root.innerHTML.trim() : '';
  const briefContent = (briefHTML === '<p><br></p>' || briefHTML === '<p></p>') ? '' : briefHTML;
  const jobType = v('t-jobtype')||'freelance';
  const isFulltime = jobType==='fulltime';
  const taskType = document.getElementById('t-tasktype')?.value||'';
  // collect steps from DOM
  const steps = collectTaskSteps();
  const workerType = document.getElementById('t-worker-type')?.value||'me';
  const isTeam = workerType==='team';
  const d={
    title, client,
    priority:v('t-priority'), status:v('t-status'),
    value: isFulltime ? 0 : (+v('t-value')||0),
    orderDate:v('t-order'), deadline:v('t-deadline'),
    pay: isFulltime ? 'none' : v('t-pay'),
    deposit:+v('t-deposit')||0,
    notes:v('t-notes'), brief:briefContent, done:false,
    jobType, taskType, steps,
    workerType,
    workerMember: isTeam ? (document.getElementById('t-worker-member')?.value||null) : null,
    workerAmount: isTeam ? (workerPayMode==='pct' ? Math.round((+(document.getElementById('t-value')?.value)||0)*(+(document.getElementById('t-worker-pct')?.value)||0)/100) : (+(document.getElementById('t-worker-amount')?.value)||0)) : 0,
    workerPayMode: isTeam ? workerPayMode : 'fixed',
    workerPct: isTeam && workerPayMode==='pct' ? (+(document.getElementById('t-worker-pct')?.value)||0) : 0,
    workerDepositPaid: isTeam && document.getElementById('t-worker-deposit-status')?.value==='yes',
    workerDepositAmount: isTeam ? (+(document.getElementById('t-worker-deposit-amount')?.value)||0) : 0,
    paymentCollected: false,
  };
  if(eid){const i=S.tasks.findIndex(t=>t.id==eid);if(i>-1){d.id=+eid;d.done=S.tasks[i].done;d.paymentCollected=S.tasks[i].paymentCollected||false;d.steps=mergeSteps(S.tasks[i].steps||[],steps);S.tasks[i]=d;}}
  else{ if(!checkLimit('max_tasks', S.tasks.length)) return; d.id=Date.now();S.tasks.push(d);}
  lsSave(); cloudSave(S); closeM('modal-task');
  setTimeout(()=>{ renderAll(); buildDynamicStatusDropdowns(); }, 30);
  // Notify assigned team member when task is created/assigned
  if(!eid && d.workerMember && typeof supa !== 'undefined'){
    setTimeout(async function(){
      try {
        const workerName = d.workerMember;
        // Find member email from teams
        let memberEmail = '';
        (S.teams||[]).forEach(function(team){
          (team.members||[]).forEach(function(m){
            if(m.name===workerName && m.email) memberEmail=m.email.toLowerCase().trim();
          });
        });
        if(!memberEmail) return;
        // Find member's studio_data
        const {data:rows} = await supa.from('studio_data').select('user_id,data');
        if(!rows) return;
        let targetUserId = null;
        for(const row of rows){
          try {
            const ud = typeof row.data==='string' ? JSON.parse(row.data) : row.data;
            if(ud?.settings?.email && ud.settings.email.toLowerCase().trim()===memberEmail){ targetUserId=row.user_id; break; }
          } catch(e){}
        }
        if(!targetUserId) return;
        const targetRow = rows.find(r=>r.user_id===targetUserId);
        if(!targetRow) return;
        let ud = null;
        try{ ud = typeof targetRow.data==='string' ? JSON.parse(targetRow.data) : targetRow.data; }catch(e){ return; }
        if(!ud) return;
        ud._pending_notifications = ud._pending_notifications||[];
        const ownerName = (S.settings&&S.settings.name)||'مشرف';
        ud._pending_notifications.push({
          id: Date.now(), title: '<i class="fa-solid fa-clipboard-list"></i> تم تعيين مهمة لك!',
          body: '"'+d.title+'" — من '+ownerName+(d.deadline?' · الموعد: '+d.deadline:''),
          type: 'task', created_at: new Date().toISOString(), read: false
        });
        await supa.from('studio_data').update({data:JSON.stringify(ud),updated_at:new Date().toISOString()}).eq('user_id',targetUserId);
      } catch(e){ console.warn('Task assign notify error:',e); }
    }, 300);
  }
  // Prompt to register deposit/full payment as income
  const payVal = v('t-pay');
  const depositVal = +(v('t-deposit'))||0;
  if(!eid && payVal==='deposit' && depositVal>0){
    var _mt=document.getElementById('modal-task'); if(_mt) _mt.style.display='none';
    setTimeout(()=>_showPaymentIncomePrompt({
      amount: depositVal,
      label: 'عربون',
      desc: 'عربون: '+d.title,
      client: d.client||'',
      taskId: d.id,
      paymentType: 'deposit',
      onSkip: ()=>{ if(issueInv) setTimeout(()=>openInvoiceFromTask(d),150); }
    }), 450);
    return;
  }
  if(!eid && payVal==='full' && (d.value||0)>0){
    var _mt2=document.getElementById('modal-task'); if(_mt2) _mt2.style.display='none';
    setTimeout(()=>_showPaymentIncomePrompt({
      amount: d.value,
      label: 'دفعة كاملة',
      desc: 'دفع كامل: '+d.title,
      client: d.client||'',
      taskId: d.id,
      paymentType: 'full',
      onSkip: ()=>{ if(issueInv) setTimeout(()=>openInvoiceFromTask(d),150); }
    }), 450);
    return;
  }
  // إصدار فاتورة تلقائي
  if(issueInv && !eid){
    setTimeout(()=>openInvoiceFromTask(d), 150);
  }
}

// ── موديال تسجيل الدفعة كدخل ──
function _showPaymentIncomePrompt(opts){
  var ex=document.getElementById('_pay-income-modal'); if(ex) ex.remove();
  var ov=document.createElement('div');
  ov.id='_pay-income-modal';
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;z-index:99999;padding:16px';
  ov.innerHTML='<div style="background:var(--surface,#1e1e2e);color:var(--text1,#fff);width:min(400px,92vw);border-radius:20px;padding:28px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.5)">'
    +'<div style="font-size:40px;margin-bottom:12px">💰</div>'
    +'<div style="font-size:17px;font-weight:900;margin-bottom:6px">تسجيل '+escapeHtml(opts.label)+' كدخل؟</div>'
    +'<div style="font-size:13px;color:var(--text3,#888);margin-bottom:6px">'+escapeHtml(opts.desc)+'</div>'
    +'<div style="font-size:28px;font-weight:900;color:var(--accent3,#4fd1a5);margin:14px 0">'+Number(opts.amount).toLocaleString()+' ج</div>'
    +'<div style="font-size:12px;color:var(--text3,#888);margin-bottom:20px">هل تريد تسجيل هذا المبلغ الآن في سجل المعاملات المالية؟</div>'
    +'<div style="display:flex;gap:10px">'
      +'<button id="_pim-yes" class="btn btn-primary" style="flex:1"><i class="fa-solid fa-square-check"></i> نعم، سجّله</button>'
      +'<button id="_pim-no" class="btn btn-ghost" style="flex:1">تخطي</button>'
    +'</div>'
  +'</div>';
  document.body.appendChild(ov);
  document.getElementById('_pim-yes').onclick=function(){
    ov.remove();
    var now=new Date().toISOString().split('T')[0];
    var tx={
      id:Date.now(),type:'income',
      amount:opts.amount,
      source:opts.client||'',
      desc:opts.desc,
      date:now,
      isoDate:now,
      paymentType:opts.paymentType||'full',
      linkedTaskId:opts.taskId||null,
      currency:S.settings?.currency||'EGP'
    };
    if(!S.transactions) S.transactions=[];
    S.transactions.push(tx);
    lsSave(); cloudSave(S);
    toast('<i class="fa-solid fa-coins" style="color:var(--accent3)"></i> تم تسجيل '+opts.label+' كدخل — '+Number(opts.amount).toLocaleString()+' ج');
    if(typeof renderFinance==='function') renderFinance();
    if(opts.onSkip) opts.onSkip();
  };
  document.getElementById('_pim-no').onclick=function(){
    ov.remove();
    if(opts.onSkip) opts.onSkip();
  };
  ov.addEventListener('click',function(e){if(e.target===ov){ov.remove();if(opts.onSkip)opts.onSkip();}});
}
/* فتح فاتورة جديدة مبنية على مهمة */
function openInvoiceFromTask(task){
  fillDD('inv-client');
  document.getElementById('inv-modal-ttl').innerHTML='<i class="fa-solid fa-square"></i> فاتورة — '+task.title;
  document.getElementById('inv-eid').value='';
  document.getElementById('inv-client').value=task.client;
  document.getElementById('inv-num').value='INV-'+(S.invoices.length+1).toString().padStart(3,'0');
  document.getElementById('inv-date').value=today();
  const dd=new Date();dd.setDate(dd.getDate()+7);
  document.getElementById('inv-due').value=dd.toISOString().split('T')[0];
  document.getElementById('inv-notes').value=S.settings?.terms||'';
  document.getElementById('inv-deposit').value=task.deposit||0;
  // بيانات المهمة كبند وحيد
  invItems=[{desc:task.title+(task.notes?' — '+task.notes.slice(0,60):''),qty:1,price:task.value||0}];
  invPolicies=(S.settings?.policies||[]).map(p=>({...p}));
  const puEl=document.getElementById('inv-project-url');if(puEl)puEl.value='';
  setTimeout(()=>{
    renderInvForm();
    const dep=document.getElementById('inv-deposit');if(dep)dep.oninput=calcTotal;
    renderPoliciesList('inv-policies-list',invPolicies,'removeInvPolicy');
    liveQR('inv-project-url','inv-project-qr-prev',90);
    onInvClientChange(task.client); // عرض مهام العميل
  },100);
  openM('modal-invoice');
}
function delTask(id){confirmDel('هل تريد حذف هذه المهمة نهائياً؟',()=>{S.tasks=S.tasks.filter(t=>t.id!==id);lsSave();renderAll();});}

function completeTask(id){
  const t=S.tasks.find(t=>t.id===id);if(!t)return;
  if(t.done){
    // undo complete
    t.done=false; t.status='progress';
    lsSave(); renderAll(); return;
  }
  // Build a confirm dialog with income registration
  const remaining = t.value - (t.pay==='deposit'?t.deposit:0);
  const hasValue = t.value > 0;
  const depositAlready = t.pay==='deposit' && t.deposit>0;

  // use custom modal
  document.getElementById('complete-task-name').textContent = t.title;
  document.getElementById('complete-client-name').textContent = t.client||'—';
  document.getElementById('complete-value').textContent = t.value ? t.value.toLocaleString()+' '+_getCurrency() : 'غير محدد';

  const depositInfo = document.getElementById('complete-deposit-info');
  if(depositAlready){
    depositInfo.style.display='block';
    document.getElementById('complete-deposit-paid').textContent = t.deposit.toLocaleString()+' '+_getCurrency();
    document.getElementById('complete-remaining').textContent = remaining.toLocaleString()+' '+_getCurrency();
  } else {
    depositInfo.style.display='none';
  }

  const incomeSection = document.getElementById('complete-income-section');
  incomeSection.style.display = hasValue ? 'block' : 'none';
  document.getElementById('complete-income-amount').value = remaining > 0 ? remaining : (t.value||0);
  document.getElementById('complete-register-income').checked = hasValue;

  document.getElementById('complete-task-id').value = id;
  openM('modal-complete');
}

function confirmComplete(){
  const id = +document.getElementById('complete-task-id').value;
  const t = S.tasks.find(t=>t.id===id); if(!t) return;

  // Mark task done
  t.done = true;
  t.status = 'done';
  t.doneAt = new Date().toISOString().split('T')[0]; // record date for log

  // Check if payment was collected
  const payCollected = document.getElementById('complete-pay-collected')?.checked;
  t.paymentCollected = payCollected || false;

  // Register income if checked AND payment collected
  if(document.getElementById('complete-register-income').checked){
    const amount = +(document.getElementById('complete-income-amount').value)||0;
    if(amount > 0 && payCollected){
      S.transactions.push({
        id: Date.now(),
        type: 'income',
        amount,
        source: t.client||'',
        desc: 'إيراد مشروع: '+t.title,
        isoDate: new Date().toISOString().split('T')[0],
        date: new Date().toLocaleDateString('ar-EG'),
        linkedTaskId: id,
        paymentType: 'full'
      });
    }
  }

  // مزامنة مع الجدول اليومي — لو فيه وقت مربوط بالمهمة دي، اكمله
  S.schedule.forEach(s=>{
    if(s.linkedTaskId===id && !s.done){ s.done=true; }
  });

  lsSave(); closeM('modal-complete'); renderAll();
  // اطلب رابط التسليم بعد إغلاق المودال
  setTimeout(function(){ _askRegularTaskProjectLink(id); }, 300);
  if(!payCollected && t.value>0){
    showToast('<i class="fa-solid fa-champagne-glasses"></i> تم إنجاز المشروع: '+t.title+' — تذكير: المبلغ لم يتم تحصيله بعد!');
    // Schedule reminder notification
    setTimeout(()=>{
      showToast('<i class="fa-solid fa-coins"></i> تذكير: فيه مبلغ '+t.value.toLocaleString()+' ج لم يتم تحصيله من مشروع: '+t.title);
    }, 5000);
  } else {
    showToast('<i class="fa-solid fa-champagne-glasses"></i> تم إنجاز المشروع: '+t.title);
  }
}

function toggleDone(id){completeTask(id);}

function _saveTaskDeliveryLink(taskId){
  var t = S.tasks.find(function(x){ return x.id===taskId; });
  if(!t) return;
  var inp = document.getElementById('td-proj-link-input');
  if(!inp) return;
  var link = inp.value.trim();
  t.projectLink = link;
  t.driveLink = link;
  lsSave(); cloudSave(S);
  showMiniNotif('<i class="fa-solid fa-link" style="color:var(--accent3)"></i> تم حفظ رابط التسليم');
  // Refresh the open/external link button
  var existingA = inp.nextElementSibling?.nextElementSibling;
  if(link && existingA && existingA.tagName==='A'){ existingA.href=link; }
  else if(link && !existingA){
    var a = document.createElement('a');
    a.href = link; a.target = '_blank';
    a.className = 'btn btn-ghost btn-sm';
    a.style.cssText = 'flex-shrink:0;padding:8px 12px;color:var(--accent3)';
    a.title = 'فتح الرابط';
    a.innerHTML = '<i class="fa-solid fa-external-link-alt"></i>';
    inp.parentElement.appendChild(a);
  }
}


