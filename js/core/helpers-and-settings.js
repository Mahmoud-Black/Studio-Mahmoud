// ============================================================
// HELPERS
// ============================================================
const today=()=>new Date().toISOString().split('T')[0];
const payBadge={none:'<span class="pay-badge pay-none"><i class="fa-solid fa-circle-xmark"></i> لم يُدفع</span>',deposit:'<span class="pay-badge pay-deposit"><i class="fa-solid fa-heart"></i> عربون</span>',full:'<span class="pay-badge pay-full"><i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> مدفوع</span>'};
const statusBadge={new:'<span class="badge badge-gray">جديد</span>',progress:'<span class="badge badge-yellow">جاري</span>',review:'<span class="badge badge-purple">مراجعة</span>',paused:'<span class="badge" style="background:rgba(100,181,246,.15);color:#64b5f6">⏸ موقوف</span>',done:'<span class="badge badge-green">مكتمل</span>'};
const prioBadge={high:'<span class="badge badge-red">عالية</span>',med:'<span class="badge badge-yellow">متوسطة</span>',low:'<span class="badge badge-green">منخفضة</span>'};
const tcol={work:'var(--accent)',meeting:'var(--accent4)',learning:'var(--accent3)',break:'var(--accent2)',admin:'var(--text2)'};
const tname={work:'شغل تصميم',meeting:'اجتماع',learning:'تعلم',break:'استراحة',admin:'إدارة'};

function fillDD(selId){
  const sel=document.getElementById(selId);if(!sel)return;
  const cur=sel.value;
  sel.innerHTML='<option value="">— اختر عميل —</option>';
  S.clients.forEach(c=>{const o=document.createElement('option');o.value=c.name;o.textContent=c.name+' ('+c.type+')';sel.appendChild(o);});
  sel.value=cur;
}

// ============================================================
// SETTINGS TABS
// ============================================================
function switchSettingsTab(tab) {
  const settingsPage = document.getElementById('page-settings');
  if(!settingsPage) return;
  // Reset all panels
  settingsPage.querySelectorAll('.stab').forEach(b => b.classList.remove('active'));
  settingsPage.querySelectorAll('.stab-panel').forEach(p => {
    p.classList.remove('active');
    p.style.display = 'none';
    p.removeAttribute('style'); // then re-apply via CSS
  });
  // Activate selected tab
  const btn = document.getElementById('stab-' + tab);
  const panel = document.getElementById('stabp-' + tab);
  if(btn) btn.classList.add('active');
  if(panel){
    panel.classList.add('active');
    panel.style.display = 'block'; // force display in case CSS specificity issue
  }
  if(tab==='features') _renderFeaturesPanel();
  if(tab==='team-specs'){
    renderSpecializations();
    initCorpSettings();
  }
}

// ── Expense Categories ──
function renderExpenseCats() {
  const el = document.getElementById('expense-cats-list');
  if(!el) return;
  const cats = S.settings?.expenseCats || getDefaultExpenseCats();
  el.innerHTML = cats.map((c,i) => `
    <div style="display:flex;align-items:center;gap:6px;background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:5px 10px;font-size:12px">
      <span>${c.icon||'<i class="fa-solid fa-thumbtack"></i>'}</span><span style="font-weight:600">${c.name}</span>
      <button onclick="removeExpenseCat(${i})" style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:14px;padding:0 2px;line-height:1">×</button>
    </div>`).join('');
  // Update the expense dropdown
  const sel = document.getElementById('ex-cat');
  if(sel) {
    const cur = sel.value;
    sel.innerHTML = cats.map(c => `<option value="${c.name}">${c.icon} ${c.name}</option>`).join('');
    sel.value = cur;
  }
}

function getDefaultExpenseCats() {
  return [
    {icon:'<i class="fa-solid fa-laptop"></i>',name:'برامج واشتراكات'},{icon:'<i class="fa-solid fa-desktop"></i>',name:'معدات وأجهزة'},
    {icon:'<i class="fa-solid fa-bullhorn"></i>',name:'تسويق'},{icon:'<i class="fa-solid fa-books"></i>',name:'تعليم وكورسات'},
    {icon:'<i class="fa-solid fa-wrench"></i>',name:'صيانة أجهزة'},{icon:'<i class="fa-solid fa-globe"></i>',name:'إنترنت'},
    {icon:'<i class="fa-solid fa-dollar-sign"></i>',name:'سحب شخصي'},{icon:'☕',name:'كافيه'},
    {icon:'🍽',name:'مطاعم'},{icon:'⛽',name:'بنزين'},{icon:'<i class="fa-solid fa-thumbtack"></i>',name:'أخرى'}
  ];
}

function addExpenseCat() {
  const icon = document.getElementById('new-exp-cat-icon')?.value.trim() || '<i class="fa-solid fa-thumbtack"></i>';
  const name = document.getElementById('new-exp-cat-name')?.value.trim();
  if(!name) return;
  if(!S.settings) S.settings = {};
  if(!S.settings.expenseCats) S.settings.expenseCats = getDefaultExpenseCats();
  if(S.settings.expenseCats.find(c=>c.name===name)) return;
  S.settings.expenseCats.push({icon,name});
  document.getElementById('new-exp-cat-name').value = '';
  document.getElementById('new-exp-cat-icon').value = '';
  lsSave();
  renderExpenseCats();
}

function removeExpenseCat(i) {
  if(!S.settings?.expenseCats) return;
  S.settings.expenseCats.splice(i,1);
  lsSave();
  renderExpenseCats();
}

// ============================================================
// SETTINGS
// ============================================================
function loadSettings(){
  applyPlatformConfig(); // re-apply on each settings load
  const s=S.settings||{};
  // تحديث معاينة لوجو الفاتورة في الإعدادات
  const lp=document.getElementById('logo-preview');
  if(lp) lp.innerHTML=s.logo?`<img src="${s.logo}" style="max-height:80px;max-width:200px;object-fit:contain;border-radius:6px" onerror="this.style.display=\'none\'">`:'<span style="color:var(--text3);font-size:13px">لا يوجد لوجو</span>';
  renderExpenseCats();
  ['name','phone','email','address','terms'].forEach(k=>{const e=document.getElementById('set-'+k);if(e)e.value=s[k]||'';});
  const curSel=document.getElementById('set-currency'); if(curSel) curSel.value=s.currency||'ج.م';
  const unEl=document.getElementById('set-username'); if(unEl) unEl.value=s.username||'';
  _updateUsernamePreview(s.username||'');
  // Reflect current theme state in buttons
  const mode = localStorage.getItem('studioDisplayMode') || 'light';
  const color = localStorage.getItem('studioAccentColor') || '#7c6ff7';
  const lang  = localStorage.getItem('studioLang') || 'ar';
  const btnDark  = document.getElementById('btn-dark-mode');
  const btnLight = document.getElementById('btn-light-mode');
  if(btnDark)  btnDark.className  = mode === 'dark'  ? 'btn btn-primary' : 'btn btn-ghost';
  if(btnLight) btnLight.className = mode === 'light' ? 'btn btn-primary' : 'btn btn-ghost';
  const btnAr = document.getElementById('btn-lang-ar');
  const btnEn = document.getElementById('btn-lang-en');
  if(btnAr) btnAr.className = lang === 'ar' ? 'btn btn-primary' : 'btn btn-ghost';
  if(btnEn) btnEn.className = lang === 'en' ? 'btn btn-primary' : 'btn btn-ghost';
  document.querySelectorAll('.theme-swatch').forEach(s => s.classList.toggle('active', s.dataset.color === color));
  const picker = document.getElementById('custom-accent-picker');
  if(picker) picker.value = color;
  const nd=document.getElementById('studio-name-disp');if(nd)nd.textContent=s.name||'صاحب العمل';
  renderPoliciesList('policies-list', s.policies||[], 'removePolicy');
  renderSocialsList();
  // إعادة تهيئة الـ social dropdown
  setTimeout(() => {
    selectSocialOpt('instagram');
  }, 50);
  // قوالب واتساب
  const wt = s.waTemplates||{};
  const defaults = {
    invoice: `مرحباً {{اسم_العميل}} <i class="fa-solid fa-hand-wave"></i>\nتم إصدار فاتورة رقم {{رقم_الفاتورة}} بقيمة {{قيمة_الفاتورة}}\nموعد السداد: {{تاريخ_الاستحقاق}}\n\nشكراً لتعاملك مع {{اسم_العمل}} <i class="fa-solid fa-hands"></i>`,
    task:    `مرحباً {{اسم_العميل}} <i class="fa-solid fa-hand-wave"></i>\nتم استلام طلب «{{اسم_المشروع}}» بنجاح <i class="fa-solid fa-square-check" style="color:var(--accent3)"></i>\nسنبدأ العمل فوراً وسنتواصل معك قريباً.\n\n{{اسم_العمل}}`,
    done:    `مرحباً {{اسم_العميل}} <i class="fa-solid fa-champagne-glasses"></i>\nتم الانتهاء من «{{اسم_المشروع}}»!\nرابط الاستلام: {{رابط_المشروع}}\n\nفي انتظار ملاحظاتك <i class="fa-solid fa-hands"></i>\n{{اسم_العمل}}`,
    remind:  `مرحباً {{اسم_العميل}}\nتذكير بفاتورة رقم {{رقم_الفاتورة}} بقيمة {{قيمة_الفاتورة}}\nموعد السداد كان {{تاريخ_الاستحقاق}}\n\nنرجو السداد في أقرب وقت <i class="fa-solid fa-hands"></i>`,
  };
  ['invoice','task','done','remind'].forEach(k=>{
    const el=document.getElementById('wa-tpl-'+k);
    if(el) el.value = wt[k]||defaults[k];
  });
  // أنواع المهام في الإعدادات
  renderSettingsTaskTypes();
  _initStatusSettings();
}function renderSettingsTaskTypes(){
  const el=document.getElementById('settings-task-types');if(!el)return;
  const types=S.settings?.taskTypes||[];
  el.innerHTML=types.map((t,i)=>`
    <div style="display:inline-flex;align-items:center;gap:6px;background:rgba(100,181,246,.12);border:1px solid rgba(100,181,246,.25);color:#64b5f6;border-radius:20px;padding:5px 10px 5px 12px;font-size:12px;font-weight:600">
      ${t}
      <button onclick="removeTaskTypeFromSettings(${i})" style="background:none;border:none;color:rgba(100,181,246,.6);cursor:pointer;font-size:12px;padding:0;line-height:1"><i class="fa-solid fa-xmark"></i></button>
    </div>`).join('')||'<div style="font-size:12px;color:var(--text3)">لا أنواع محددة — أضف أنواع المهام اللي بتشتغل بيها</div>';
}
function addTaskTypeFromSettings(){
  const inp=document.getElementById('settings-new-task-type');
  const val=inp?.value.trim();if(!val)return;
  if(!S.settings.taskTypes) S.settings.taskTypes=[];
  if(!S.settings.taskTypes.includes(val)) S.settings.taskTypes.push(val);
  inp.value='';
  lsSave(); cloudSaveNow(S); renderSettingsTaskTypes(); fillTaskTypesDD();
  showToast('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم إضافة نوع المهمة: '+val);
}
function removeTaskTypeFromSettings(i){
  if(!S.settings.taskTypes)return;
  const name=S.settings.taskTypes[i];
  S.settings.taskTypes.splice(i,1);
  lsSave(); cloudSaveNow(S); renderSettingsTaskTypes(); fillTaskTypesDD();
  showToast('<i class="fa-solid fa-trash"></i> تم حذف: '+name);
}
function saveSettings(){
  _mergeUiSettingsIntoS();
  S.settings = Object.assign({}, S.settings, {
    name:v('set-name'), phone:v('set-phone'), email:v('set-email'),
    address:v('set-address'), terms:v('set-terms'),
    currency:(document.getElementById('set-currency')||{}).value||'ج.م',
    username:(document.getElementById('set-username')||{}).value.trim().toLowerCase().replace(/[^a-z0-9_-]/g,'')||'',
    logo:S.settings?.logo||'', policies:S.settings?.policies||[],
    socials:S.settings?.socials||[], waTemplates:S.settings?.waTemplates||{},
    taskTypes:S.settings?.taskTypes||[], taskStatuses:S.settings?.taskStatuses||[],
    paymentAccounts:S.settings?.paymentAccounts||[],
  });
  _syncStudioLogoToConfig();
  lsSave(); cloudSaveNow(S); toast('✅ تم حفظ الإعدادات');
}

async function forceCloudReload(){
  if(!_supaUserId){ toast('<i class="fa-solid fa-triangle-exclamation"></i> غير مسجل دخول'); return; }
  showSyncIndicator('<i class="fa-solid fa-cloud"></i>️ جاري التحميل...', 'var(--accent)');
  try {
    const cloudData = await cloudLoad();
    if(cloudData){
      S = cloudData;
      migrateSFields();
      renderAll();
      applyPlatformConfig();
      showSyncIndicator('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم التحديث من السحابة', '#4fd1a5');
      toast('✅ تم تحميل البيانات من السحابة');
      _updateCloudDiag();
    } else {
      showSyncIndicator('<i class="fa-solid fa-triangle-exclamation"></i> لا بيانات في السحابة', '#f7c948');
      const { data, error } = await supa.from('studio_data').select('user_id, updated_at').eq('user_id', _supaUserId).maybeSingle();
      if(error) toast('<i class="fa-solid fa-circle-xmark"></i> خطأ RLS: ' + error.message);
      else if(!data) toast('<i class="fa-solid fa-triangle-exclamation"></i> لا يوجد سجل لهذا المستخدم في studio_data');
      else toast('<i class="fa-solid fa-triangle-exclamation"></i> السجل موجود بس البيانات فارغة');
      _updateCloudDiag();
    }
  } catch(e) {
    showSyncIndicator('<i class="fa-solid fa-circle-xmark"></i> فشل', '#f76f7c');
    toast('<i class="fa-solid fa-circle-xmark"></i> ' + e.message);
  }
}

async function forcePushToCloud(){
  if(!_supaUserId){ toast('<i class="fa-solid fa-triangle-exclamation"></i> غير مسجل دخول'); return; }
  // Count local data
  const tasks = S.tasks?.length||0, clients = S.clients?.length||0;
  const invoices = S.invoices?.length||0;
  if(!tasks && !clients && !invoices){
    if(!confirm('البيانات المحلية تبدو فارغة. هل تريد الرفع على أي حال؟')) return;
  } else {
    if(!confirm(`رفع البيانات المحلية للسحابة؟\n(${tasks} مهمة، ${clients} عميل، ${invoices} فاتورة)`)) return;
  }
  showSyncIndicator('⬆ جاري الرفع...', 'var(--accent)');
  try {
    const payload = { user_id: _supaUserId, data: JSON.stringify(S), updated_at: new Date().toISOString() };
    const { error } = await supa.from('studio_data').upsert(payload, { onConflict: 'user_id' });
    if(error) throw error;
    showSyncIndicator('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم الرفع', '#4fd1a5');
    toast('✅ تم رفع البيانات للسحابة بنجاح');
    _updateCloudDiag();
  } catch(e) {
    showSyncIndicator('<i class="fa-solid fa-circle-xmark"></i> فشل الرفع', '#f76f7c');
    toast('<i class="fa-solid fa-circle-xmark"></i> ' + e.message);
  }
}

async function _updateCloudDiag(){
  const el = document.getElementById('cloud-diag-info');
  if(!el) return;
  const uid = _supaUserId || '(غير مسجل)';
  const tasks = S.tasks?.length||0, clients = S.clients?.length||0;
  const invoices = S.invoices?.length||0, trans = S.transactions?.length||0;
  let cloudInfo = '⏳ جاري الفحص...';
  try {
    const { data, error } = await supa.from('studio_data')
      .select('updated_at, data')
      .eq('user_id', _supaUserId)
      .maybeSingle();
    if(error) cloudInfo = '<i class="fa-solid fa-circle-xmark"></i> خطأ: ' + error.message;
    else if(!data) cloudInfo = '<i class="fa-solid fa-triangle-exclamation"></i> لا يوجد سجل في السحابة لهذا المستخدم';
    else {
      const size = (JSON.stringify(data.data).length/1024).toFixed(1);
      const updated = new Date(data.updated_at).toLocaleString('ar-EG');
      cloudInfo = `<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> موجود في السحابة — ${size} KB — آخر تحديث: ${updated}`;
    }
  } catch(e) { cloudInfo = '<i class="fa-solid fa-circle-xmark"></i> ' + e.message; }

  el.innerHTML = `
    <div>🆔 <b>User ID:</b> <span style="font-family:monospace;font-size:11px;color:var(--accent)">${uid}</span></div>
    <div><i class="fa-solid fa-cloud"></i>️ <b>السحابة:</b> ${cloudInfo}</div>
    <div><i class="fa-solid fa-floppy-disk"></i> <b>محلياً:</b> ${tasks} مهمة · ${clients} عميل · ${invoices} فاتورة · ${trans} معاملة</div>
    <div style="margin-top:8px;font-size:11px;color:var(--text3)">
      إذا كانت البيانات موجودة محلياً وفارغة في السحابة → اضغط ⬆ رفع للسحابة
    </div>`;
}

// Run diag when settings page opens
// Show cloud diagnostic when settings page opens
const _origLoadSettings = loadSettings;
loadSettings = function(){
  _origLoadSettings();
  if(_supaUserId) setTimeout(_updateCloudDiag, 500);
};

/* ── WhatsApp Templates ── */
let waActiveTpl = 'wa-tpl-invoice';

function insertWaVar(txt){
  const el = document.getElementById(waActiveTpl);
  if(!el) return;
  const s=el.selectionStart, e=el.selectionEnd;
  el.value = el.value.slice(0,s)+txt+el.value.slice(e);
  el.selectionStart = el.selectionEnd = s+txt.length;
  el.focus();
}

function saveWaTemplates(){
  if(!S.settings) S.settings={};
  S.settings.waTemplates = {
    invoice: v('wa-tpl-invoice'),
    task:    v('wa-tpl-task'),
    done:    v('wa-tpl-done'),
    remind:  v('wa-tpl-remind'),
  };
  lsSave();
  showMiniNotif('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم حفظ قوالب واتساب');
}

/* ── WhatsApp Modal ── */
// waCtx: بيانات السياق الحالي (فاتورة أو مهمة)
let waCtx = {};

function openWaModal(tplType, invIdOrNull, taskIdOrNull){
  const s = S.settings||{};
  waCtx = { tplType, invId: invIdOrNull, taskId: taskIdOrNull };

  // جمع البيانات
  let clientName='', clientPhone='', invNum='', invTotal='', invDue='', projectUrl='', taskName='';

  if(invIdOrNull){
    const inv = S.invoices.find(x=>x.id===invIdOrNull);
    if(inv){
      clientName = inv.client;
      invNum     = inv.num||'';
      invTotal   = (inv.total||0).toLocaleString()+' '+_getCurrency();
      invDue     = inv.due||'';
      projectUrl = inv.projectUrl||'';
      taskName   = inv.items?.[0]?.desc||'';
      const cl   = S.clients.find(c=>c.name===inv.client);
      clientPhone = cl?.phone||'';
    }
  } else if(taskIdOrNull){
    const t = S.tasks.find(x=>x.id===taskIdOrNull);
    if(t){
      clientName  = t.client||'';
      taskName    = t.title||'';
      projectUrl  = t.brief?'':''
      const cl    = S.clients.find(c=>c.name===t.client);
      clientPhone = cl?.phone||'';
    }
  }

  waCtx.vars = {
    '{{اسم_العميل}}':           clientName,
    '{{اسم_المشروع}}':           taskName,
    '{{قيمة_الفاتورة}}':         invTotal,
    '{{رقم_الفاتورة}}':          invNum,
    '{{تاريخ_الاستحقاق}}':       invDue,
    '{{رابط_المشروع}}':          projectUrl,
    '{{اسم_العمل}}':         s.name||'العمل',
    '{{رقم_هاتف_العمل}}':    s.phone||'',
  };

  // عرض المستلم
  document.getElementById('wa-recip-name').textContent     = clientName||'—';
  document.getElementById('wa-recip-phone-disp').innerHTML = clientPhone ? '<i class="fa-solid fa-phone"></i> '+clientPhone : 'لا يوجد رقم — أدخله يدوياً';
  // تنظيف الرقم (أرقام فقط)
  document.getElementById('wa-phone-input').value = clientPhone.replace(/[^\d]/g,'');

  // تحديد القالب المناسب
  loadWaTpl(tplType);

  // تمييز الزر النشط
  ['invoice','task','done','remind'].forEach(k=>{
    const btn = document.getElementById('wa-tpl-btn-'+k);
    if(btn) btn.className = 'btn btn-sm btn-'+(k===tplType?'primary':'ghost');
  });

  openM('modal-whatsapp');
}

function loadWaTpl(key){
  const wt = S.settings?.waTemplates||{};
  const defaults = {
    invoice: `مرحباً {{اسم_العميل}} <i class="fa-solid fa-hand-wave"></i>\nتم إصدار فاتورة رقم {{رقم_الفاتورة}} بقيمة {{قيمة_الفاتورة}}\nموعد السداد: {{تاريخ_الاستحقاق}}\n\nشكراً لتعاملك مع {{اسم_العمل}} <i class="fa-solid fa-hands"></i>`,
    task:    `مرحباً {{اسم_العميل}} <i class="fa-solid fa-hand-wave"></i>\nتم استلام طلب «{{اسم_المشروع}}» بنجاح <i class="fa-solid fa-square-check" style="color:var(--accent3)"></i>\nسنبدأ العمل فوراً وسنتواصل معك قريباً.\n\n{{اسم_العمل}}`,
    done:    `مرحباً {{اسم_العميل}} <i class="fa-solid fa-champagne-glasses"></i>\nتم الانتهاء من «{{اسم_المشروع}}»!\nرابط الاستلام: {{رابط_المشروع}}\n\nفي انتظار ملاحظاتك <i class="fa-solid fa-hands"></i>\n{{اسم_العمل}}`,
    remind:  `مرحباً {{اسم_العميل}}\nتذكير بفاتورة رقم {{رقم_الفاتورة}} بقيمة {{قيمة_الفاتورة}}\nموعد السداد كان {{تاريخ_الاستحقاق}}\n\nنرجو السداد في أقرب وقت <i class="fa-solid fa-hands"></i>`,
  };
  const raw = wt[key] || defaults[key] || '';
  const filled = fillWaVars(raw, waCtx.vars||{});

  const ta = document.getElementById('wa-msg-text');
  if(ta){ ta.value = filled; }

  // تمييز الأزرار
  ['invoice','task','done','remind'].forEach(k=>{
    const btn = document.getElementById('wa-tpl-btn-'+k);
    if(btn) btn.className = 'btn btn-sm '+(k===key?'btn-primary':'btn-ghost');
  });

  updateWaPreview();
}

function fillWaVars(template, vars){
  let out = template;
  Object.entries(vars).forEach(([k,v])=>{ out = out.split(k).join(v||'—'); });
  return out;
}

function updateWaPreview(){
  const txt = document.getElementById('wa-msg-text')?.value||'';
  const prev = document.getElementById('wa-preview-text');
  if(prev) prev.textContent = txt || '...';
}

function doSendWhatsApp(){
  const phone = document.getElementById('wa-phone-input')?.value.trim().replace(/[^\d]/g,'');
  if(!phone){ alert('<i class="fa-solid fa-triangle-exclamation"></i> أدخل رقم واتساب المستلم'); return; }
  const msg   = document.getElementById('wa-msg-text')?.value||'';
  const url   = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  window.open(url,'_blank');
  closeM('modal-whatsapp');
  showMiniNotif('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم فتح واتساب');
}
function v(id){const e=document.getElementById(id);return e?e.value:'';}
function uploadLogo(input){
  const f=input.files[0];if(!f)return;
  if(f.size>2*1024*1024){toast('<i class="fa-solid fa-triangle-exclamation"></i> الصورة أكبر من 2 ميجا');input.value='';return;}
  toast('<i class="fa-solid fa-spinner fa-spin"></i> جاري رفع اللوجو...');
  const reader = new FileReader();
  reader.onload = function(e) {
    const url = e.target.result;
    S.settings.logo = url;
    lsSave(); cloudSaveNow(S);
    const lp = document.getElementById('logo-preview');
    if(lp) lp.innerHTML = '<img src="'+url+'" style="max-height:80px;max-width:200px;object-fit:contain;border-radius:6px">';
    toast('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم رفع اللوجو');
  };
  reader.onerror = function(){ toast('<i class="fa-solid fa-triangle-exclamation"></i> فشل قراءة الصورة'); };
  reader.readAsDataURL(f);
}

// ── مزامنة لوجو الستوديو مع platform_config ── (معطّلة - اللوجو للمتجر والفاتورة فقط)
function _syncStudioLogoToConfig(){
  // لا نحدّث السايدبار ولا platform_config من لوجو المستخدم
  // اللوجو في S.settings.logo للفاتورة فقط
  // اللوجو في S.settings.store_logo للمتجر فقط
}
function removeLogo(){S.settings.logo='';lsSave();cloudSaveNow(S);const lp=document.getElementById('logo-preview');if(lp)lp.innerHTML='<span style="color:var(--text3);font-size:13px">لا يوجد لوجو</span>';}
function clearAll(){if(confirm('سيتم مسح جميع البيانات! هل أنت متأكد؟')){const s=S.settings;S={tasks:[],clients:[],transactions:[],invoices:[],goals:[],schedule:[],settings:s};lsSave();renderAll();}}

// ═══ استعادة البيانات من النسخة الاحتياطية ═══
async function recoverDataFromBackup() {
  const uid = _supaUserId;
  if(!uid) { showMiniNotif('<i class="fa-solid fa-triangle-exclamation"></i> يجب تسجيل الدخول أولاً'); return; }

  // جرب كل مصادر الاستعادة
  const sources = [
    { label: 'نسخة سحابية', fn: async () => {
        const { data } = await supa.from('studio_data').select('data').eq('user_id', uid).maybeSingle();
        if(data?.data) return typeof data.data === 'string' ? JSON.parse(data.data) : data.data;
        return null;
    }},
    { label: 'نسخة احتياطية محلية', fn: () => {
        const raw = null; // backup from localStorage disabled
        return raw ? JSON.parse(raw) : null;
    }},
    { label: 'نسخة localStorage الرئيسية', fn: () => {
        const raw2 = null; // v3 localStorage read disabled
        return raw ? JSON.parse(raw) : null;
    }},
  ];

  let bestData = null, bestScore = 0, bestLabel = '';
  for(const src of sources) {
    try {
      const d = await src.fn();
      if(!d) continue;
      const score = (d.tasks?.length||0)*3 + (d.clients?.length||0)*2 + (d.invoices?.length||0)*2 + (d.transactions?.length||0);
      if(score > bestScore) { bestScore = score; bestData = d; bestLabel = src.label; }
    } catch(e) {}
  }

  if(!bestData || bestScore === 0) {
    showMiniNotif('<i class="fa-solid fa-triangle-exclamation"></i> لا توجد نسخة احتياطية متاحة');
    return;
  }

  const confirm_msg = `تم إيجاد بيانات في "${bestLabel}":
` +
    `• ${bestData.tasks?.length||0} مهمة
` +
    `• ${bestData.clients?.length||0} عميل
` +
    `• ${bestData.invoices?.length||0} فاتورة
` +
    `• ${bestData.transactions?.length||0} معاملة مالية

` +
    `هل تريد استعادة هذه البيانات؟`;

  if(!confirm(confirm_msg)) return;
  S = bestData;
  migrateSFields();
  lsSave();
  await _doCloudSave(S);
  renderAll();
  showMiniNotif('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم استعادة البيانات من ' + bestLabel);
}

