// ═══════════════════════════════════════════════════
// <i class="fa-solid fa-rocket"></i> FEATURES & UPDATES SYSTEM
// ═══════════════════════════════════════════════════

// Static updates log shown in Settings > التحديثات
const _ALL_UPDATES = [
  { id:'upd-011', emoji:'<i class="fa-solid fa-bag-shopping"></i>', title:'نظام الخدمات والمتجر', date:'مارس 2026',
    desc:'أضف خدماتك وباقاتك، شارك رابطك العام، استقبل طلبات العملاء مباشرة، وحوّلها لمهام تلقائياً.',
    nav:"showPage('services')", navLabel:'الخدمات' },
  { id:'upd-010', emoji:'<i class="fa-solid fa-tag"></i>', title:'نظام التخصصات وإدارة الفريق', date:'مارس 2026',
    desc:'أضف تخصصات مخصصة لفريقك، أرسل دعوات للأعضاء، وتابع صندوق الدعوات.',
    nav:"showPage('team')", navLabel:'الفريق' },
  { id:'upd-009', emoji:'<i class="fa-solid fa-comments"></i>', title:'قوالب رسائل واتساب', date:'فبراير 2026',
    desc:'احفظ قوالب جاهزة للفواتير والتسليم والتذكير بالدفع وأرسلها بضغطة واحدة.',
    nav:"showPage('settings')", navLabel:'الإعدادات' },
  { id:'upd-008', emoji:'<i class="fa-solid fa-stopwatch"></i>', title:'تتبع الوقت', date:'فبراير 2026',
    desc:'سجّل الساعات على كل مهمة واحسب التكلفة الفعلية للمشاريع.',
    nav:"showPage('timetracker')", navLabel:'تتبع الوقت' },
  { id:'upd-007', emoji:'<i class="fa-solid fa-file-lines"></i>', title:'العقود الرقمية', date:'يناير 2026',
    desc:'أنشئ عقوداً احترافية وشاركها مع عملائك برابط.',
    nav:"showPage('contracts')", navLabel:'العقود' },
  { id:'upd-006', emoji:'<i class="fa-solid fa-bullseye"></i>', title:'الأهداف والإنجازات', date:'يناير 2026',
    desc:'ضع أهدافاً شهرية وسنوية وتابع تقدمك.',
    nav:"showPage('learning')", navLabel:'الأهداف' },
  { id:'upd-005', emoji:'<i class="fa-solid fa-calendar-days"></i>', title:'تنظيم اليوم والجدول', date:'ديسمبر 2025',
    desc:'نظّم يومك بجدول زمني واحتفظ بمواعيد مهامك ومشاريعك.',
    nav:"showPage('schedule')", navLabel:'تنظيم اليوم' },
  { id:'upd-004', emoji:'<i class="fa-solid fa-coins"></i>', title:'الفواتير والعقود', date:'ديسمبر 2025',
    desc:'أنشئ فواتير احترافية وتابع حالة التحصيل.',
    nav:"showPage('invoices')", navLabel:'الفواتير' },
  { id:'upd-003', emoji:'<i class="fa-solid fa-chart-bar"></i>', title:'المالية والتقارير', date:'نوفمبر 2025',
    desc:'سجّل دخلك ومصاريفك وشاهد تقارير مالية شاملة.',
    nav:"showPage('finance')", navLabel:'المالية' },
  { id:'upd-002', emoji:'<i class="fa-solid fa-users"></i>', title:'قاعدة العملاء', date:'نوفمبر 2025',
    desc:'احتفظ ببيانات عملائك وتواصل معهم بسهولة.',
    nav:"showPage('clients')", navLabel:'العملاء' },
  { id:'upd-001', emoji:'<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i>', title:'إدارة المهام والمشاريع', date:'أكتوبر 2025',
    desc:'نظّم مهامك في لوحة كانبان أو قائمة، وتابع كل مشروع من البداية للتسليم.',
    nav:"showPage('tasks')", navLabel:'المهام' },
];



function _getFeatSettings(){try{return JSON.parse(localStorage.getItem('_featSettings')||'{}');}catch(e){return {};}}
function _saveFeatSettings(){
  var settings={
    alert24:document.getElementById('feat-alert-24')?.checked,
    alert48:document.getElementById('feat-alert-48')?.checked,
    challengeEnabled:document.getElementById('feat-challenge-enabled')?.checked,
    silentDays:+(document.getElementById('feat-silent-days')?.value)||30,
    commitmentThreshold:+(document.getElementById('feat-commitment-threshold')?.value)||70,
  };
  localStorage.setItem('_featSettings',JSON.stringify(settings));
  if(typeof showMiniNotif==='function') showMiniNotif('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم حفظ إعدادات الميزات');
  renderNewWidgets&&renderNewWidgets();
}
function _saveFeatCapacity(){
  var val=+(document.getElementById('feat-capacity')?.value)||10;
  if(!S.settings)S.settings={};
  S.settings.monthlyCapacity=val;
  lsSave();cloudSave(S);
  if(typeof showMiniNotif==='function') showMiniNotif('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> طاقة العمل: '+val+' مهمة');
}
function _getLastSeenUpdate(){return localStorage.getItem('_lastSeenUpdate')||'';}
function _markUpdatesSeen(){
  localStorage.setItem('_lastSeenUpdate',_ALL_UPDATES[0]?.id||'');
  var badge=document.getElementById('stab-features-badge');
  if(badge)badge.style.display='none';
  var lbl=document.getElementById('feat-last-seen-label');
  if(lbl)lbl.innerHTML='<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> كل التحديثات مقروءة';
  _renderFeaturesPanel();
}

function _renderFeaturesPanel(){
  // Load saved settings
  var fs=_getFeatSettings();
  var a24=document.getElementById('feat-alert-24');if(a24)a24.checked=fs.alert24!==false;
  var a48=document.getElementById('feat-alert-48');if(a48)a48.checked=fs.alert48!==false;
  var chk=document.getElementById('feat-challenge-enabled');if(chk)chk.checked=fs.challengeEnabled!==false;
  var sd=document.getElementById('feat-silent-days');if(sd)sd.value=fs.silentDays||30;
  var ct=document.getElementById('feat-commitment-threshold');if(ct)ct.value=fs.commitmentThreshold||70;
  var cap=document.getElementById('feat-capacity');if(cap)cap.value=S.settings?.monthlyCapacity||10;

  // Render settings grid
  var grid=document.getElementById('feat-settings-grid');
  if(grid){
    var settingCards=[
      {emoji:'<i class="fa-solid fa-coins"></i>',color:'var(--accent2)',title:'طاقة العمل',desc:'كم مهمة نشطة تستطيع إدارتها؟',inputId:'feat-capacity',inputType:'number',inputExtra:'min="1" max="50"',save:'_saveFeatCapacity()',go:"showPage('dashboard');switchSettingsTab('general')",goLabel:'الداشبورد'},
      {emoji:'<i class="fa-solid fa-alarm-clock"></i>',color:'var(--accent4)',title:'تنبيه مواعيد التسليم',desc:'تنبيه مسبق 24/48 ساعة قبل الموعد',checkId:'feat-alert-24',checkLabel:'24 ساعة',checkId2:'feat-alert-48',checkLabel2:'48 ساعة',save:'_saveFeatSettings()',go:"showPage('tasks');switchSettingsTab('general')",goLabel:'المهام'},
      {emoji:'<i class="fa-solid fa-trophy"></i>',color:'var(--accent2)',title:'تحدي الأسبوع',desc:'تحديات أسبوعية تلقائية في الداشبورد',checkId:'feat-challenge-enabled',checkLabel:'تفعيل التحدي',save:'_saveFeatSettings()',go:"showPage('dashboard');switchSettingsTab('general')",goLabel:'الداشبورد'},
      {emoji:'<i class="fa-solid fa-bell-slash"></i>',color:'var(--accent)',title:'تنبيه العميل الهادي',desc:'تنبيه لو عميل لم يتواصل منذ X يوم',inputId:'feat-silent-days',inputType:'number',inputExtra:'min="7" max="180"',save:'_saveFeatSettings()',go:"showPage('clients');switchSettingsTab('general')",goLabel:'العملاء'},
      {emoji:'<i class="fa-solid fa-bullseye"></i>',color:'var(--accent3)',title:'عتبة مؤشر الالتزام',desc:'تحذير لو الالتزام أقل من X%',inputId:'feat-commitment-threshold',inputType:'number',inputExtra:'min="50" max="100"',save:'_saveFeatSettings()',go:"showPage('dashboard');switchSettingsTab('general')",goLabel:'الداشبورد'},
      {emoji:'<i class="fa-solid fa-dna"></i>',color:'var(--accent2)',title:'DNA العميل + تقارير',desc:'شخصية وسجل دفع وتقارير لكل عميل',save:null,go:"showPage('clients');switchSettingsTab('general')",goLabel:'قاعدة العملاء'},
    ];
    grid.innerHTML=settingCards.map(c=>`
      <div style="background:var(--surface2);border-radius:10px;padding:14px">
        <div style="font-size:12px;font-weight:800;color:${c.color};margin-bottom:5px">${c.emoji} ${c.title}</div>
        <div style="font-size:11px;color:var(--text3);margin-bottom:8px">${c.desc}</div>
        ${c.inputId?`<div style="display:flex;gap:5px;align-items:center;margin-bottom:8px">
          <input id="${c.inputId}" type="${c.inputType}" ${c.inputExtra||''} class="form-input" style="width:70px" placeholder="">
          <span style="font-size:11px;color:var(--text3)">${c.inputType==='number'&&(c.inputId==='feat-commitment-threshold')?'%':c.inputId==='feat-silent-days'?'يوم':''}</span>
        </div>`:''}
        ${c.checkId?`<div style="margin-bottom:8px"><label style="display:flex;align-items:center;gap:5px;font-size:12px;cursor:pointer"><input type="checkbox" id="${c.checkId}" style="accent-color:var(--accent)" onchange="${c.save}"> ${c.checkLabel}</label>${c.checkId2?`<label style="display:flex;align-items:center;gap:5px;font-size:12px;cursor:pointer;margin-top:4px"><input type="checkbox" id="${c.checkId2}" style="accent-color:var(--accent2)" onchange="${c.save}"> ${c.checkLabel2}</label>`:''}</div>`:''}
        <div style="display:flex;gap:5px;flex-wrap:wrap">
          ${c.save?`<button class="btn btn-primary btn-sm" onclick="${c.save}" data-i18n="btn_save"><i class="fa-solid fa-floppy-disk" style="margin-left:4px"></i> حفظ</button>`:''}
          <button class="btn btn-ghost btn-sm" onclick="${c.go}">${c.goLabel} →</button>
        </div>
      </div>`).join('');
    // Re-apply saved values after rendering
    var fs2=_getFeatSettings();
    var el;
    el=document.getElementById('feat-alert-24');if(el)el.checked=fs2.alert24!==false;
    el=document.getElementById('feat-alert-48');if(el)el.checked=fs2.alert48!==false;
    el=document.getElementById('feat-challenge-enabled');if(el)el.checked=fs2.challengeEnabled!==false;
    el=document.getElementById('feat-silent-days');if(el)el.value=fs2.silentDays||30;
    el=document.getElementById('feat-commitment-threshold');if(el)el.value=fs2.commitmentThreshold||70;
    el=document.getElementById('feat-capacity');if(el)el.value=S.settings?.monthlyCapacity||10;
  }

  // ── Admin Updates (dynamic from Supabase/studio_data platform) ──
  var adminUpdatesEl = document.getElementById('admin-updates-list');
  if(adminUpdatesEl) _renderAdminUpdates(adminUpdatesEl);

  // Last seen label & badge
  var lastSeen=_getLastSeenUpdate();
  var lbl=document.getElementById('feat-last-seen-label');
  var hasNew=lastSeen!==(_ALL_UPDATES[0]?.id||'');
  if(lbl)lbl.innerHTML=hasNew?
    '<button class="btn btn-primary btn-sm" onclick="_markUpdatesSeen()"><i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تحديد الكل كمقروء</button>':
    '<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> كل التحديثات مقروءة';

  // Render updates list
  var el=document.getElementById('feat-updates-list');if(!el)return;
  var lastIdx=lastSeen?_ALL_UPDATES.findIndex(u=>u.id===lastSeen):-1;
  el.innerHTML=_ALL_UPDATES.map((u,i)=>{
    var isNew=i<lastIdx||lastSeen==='';
    return '<div style="display:flex;gap:14px;align-items:flex-start;padding:14px 0;border-bottom:1px solid var(--border)">'+
      '<div style="font-size:26px;flex-shrink:0;margin-top:2px">'+u.emoji+'</div>'+
      '<div style="flex:1;min-width:0">'+
        '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px">'+
          '<div style="font-size:13px;font-weight:800">'+u.title+'</div>'+
          '<span style="font-size:9px;background:var(--surface2);padding:2px 7px;border-radius:8px;color:var(--text3)">'+u.version+'</span>'+
          (isNew?'<span style="font-size:9px;background:var(--accent4);color:#fff;padding:2px 7px;border-radius:8px;font-weight:700">🆕 جديد</span>':'')+
        '</div>'+
        '<div style="font-size:12px;color:var(--text2);margin-bottom:8px;line-height:1.6">'+u.desc+'</div>'+
        '<div style="display:flex;gap:6px;flex-wrap:wrap">'+
          '<button class="btn btn-primary btn-sm" onclick="'+u.nav+';switchSettingsTab(\'general\')">'+u.navLabel+'</button>'+
          (u.settingsId?'<span style="font-size:11px;color:var(--accent);cursor:pointer;display:flex;align-items:center;gap:3px" onclick="document.getElementById(\''+u.settingsId+'\')?.scrollIntoView({behavior:\'smooth\'})"><i class="fa-solid fa-gear"></i> إعداد</span>':'')+
        '</div>'+
      '</div>'+
    '</div>';
  }).join('');
}

// Startup: check for new updates
(function(){
  setTimeout(function(){
    var lastSeen=_getLastSeenUpdate();
    var hasNew=lastSeen!==(_ALL_UPDATES[0]?.id||'');
    if(hasNew){
      var badge=document.getElementById('stab-features-badge');
      if(badge)badge.style.display='inline-block';
      var newCount=lastSeen===''?_ALL_UPDATES.length:Math.max(0,_ALL_UPDATES.findIndex(u=>u.id===lastSeen));
      if(newCount>0&&typeof addNotification==='function'){
        addNotification('<i class="fa-solid fa-rocket"></i> '+newCount+' ميزة جديدة في السيستم — اضغط على الإعدادات > التحديثات','info');
      }
    }
  },2000);
})();

// ─── Admin-sent Updates Renderer ───
function _renderAdminUpdates(container){
  // Admin updates stored in S._platform_updates (array injected by admin into studio_data)
  var updates = (typeof S !== 'undefined' && S._platform_updates) ? S._platform_updates : [];
  // Also check localStorage for cached platform updates
  try {
    var cached = JSON.parse(localStorage.getItem('_platform_updates_cache')||'[]');
    // Merge, deduplicate by id
    cached.forEach(function(u){ if(!updates.find(function(x){ return x.id===u.id; })) updates.push(u); });
  } catch(e){}
  if(!updates.length){ container.innerHTML = ''; return; }
  // Sort by date desc
  updates = updates.slice().sort(function(a,b){ return new Date(b.date||0) - new Date(a.date||0); });
  var lastReadAdminUpdate = localStorage.getItem('_last_read_admin_update')||'';
  var newOnes = [];
  updates.forEach(function(u,i){ if(u.id !== lastReadAdminUpdate && !newOnes.includes(u.id)) newOnes.push(u.id); if(i===0) {} });
  container.innerHTML =
    '<div style="background:linear-gradient(135deg,rgba(124,111,247,.1),rgba(79,209,165,.05));border:1.5px solid var(--accent);border-radius:12px;padding:14px 16px;margin-bottom:16px">'+
    '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">'+
      '<div style="font-size:14px;font-weight:800;color:var(--accent)"><i class="fa-solid fa-bullhorn"></i> تحديثات الإدارة</div>'+
      (newOnes.length?'<span style="background:var(--accent4);color:#fff;font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px">'+newOnes.length+' جديد</span>':'')+
    '</div>'+
    updates.map(function(u){
      var isNew = newOnes.includes(u.id);
      return '<div style="padding:12px;background:var(--surface2);border-radius:10px;margin-bottom:8px;border-right:3px solid '+(isNew?'var(--accent4)':'var(--border)')+'">'+
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:5px">'+
          '<span style="font-size:18px">'+(u.emoji||'<i class="fa-solid fa-thumbtack"></i>')+'</span>'+
          '<div style="font-size:13px;font-weight:700;flex:1">'+u.title+'</div>'+
          (isNew?'<span style="background:var(--accent4);color:#fff;font-size:9px;font-weight:700;padding:2px 7px;border-radius:8px">جديد</span>':'')+
          '<span style="font-size:10px;color:var(--text3)">'+(u.date?new Date(u.date).toLocaleDateString('ar-EG'):'')+'</span>'+
        '</div>'+
        '<div style="font-size:12px;color:var(--text2);line-height:1.7">'+u.body+'</div>'+
      '</div>';
    }).join('')+
    '<button class="btn btn-ghost btn-sm" style="margin-top:4px" onclick="_markAdminUpdatesSeen()"><i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تحديد كمقروء</button>'+
    '</div>';
}
function _markAdminUpdatesSeen(){
  var updates = (typeof S !== 'undefined' && S._platform_updates) ? S._platform_updates : [];
  if(updates.length) localStorage.setItem('_last_read_admin_update', updates[0].id);
  var adminUpdatesEl = document.getElementById('admin-updates-list');
  if(adminUpdatesEl) _renderAdminUpdates(adminUpdatesEl);
}

// Startup: check for new admin updates
(function(){
  setTimeout(function(){
    var updates = (typeof S !== 'undefined' && S._platform_updates) ? S._platform_updates : [];
    if(!updates.length) return;
    var lastRead = localStorage.getItem('_last_read_admin_update')||'';
    var latest = updates[0];
    if(latest && latest.id !== lastRead){
      // Cache them
      try{ localStorage.setItem('_platform_updates_cache', JSON.stringify(updates.slice(0,20))); }catch(e){}
      if(typeof addNotification === 'function'){
        addNotification('<i class="fa-solid fa-bullhorn"></i> '+(latest.emoji||'')+(latest.title||'تحديث جديد من الإدارة'),'info');
      }
      var badge=document.getElementById('stab-features-badge');
      if(badge)badge.style.display='inline-block';
    }
  }, 3000);
})();


function renderClients(){
  const grid=document.getElementById('clients-grid');if(!grid)return;

  // apply filters
  const typeF   = document.getElementById('cf-type')?.value||'';
  const chanF   = document.getElementById('cf-channel')?.value||'';
  const searchF = (document.getElementById('cf-search')?.value||'').trim().toLowerCase();

  let clients = S.clients;
  if(typeF)   clients = clients.filter(c=>c.type===typeF);
  if(chanF)   clients = clients.filter(c=>c.channel===chanF);
  if(searchF) clients = clients.filter(c=>(c.name+' '+(c.notes||'')).toLowerCase().includes(searchF));

  const cnt = document.getElementById('cf-count');
  if(cnt) cnt.textContent = clients.length < S.clients.length ? `${clients.length} من ${S.clients.length}` : '';

  if(!clients.length){
    grid.innerHTML=S.clients.length
      ? '<div class="empty" style="grid-column:span 3"><div class="empty-icon"><i class="fa-solid fa-magnifying-glass"></i></div>لا نتائج تطابق الفلتر</div>'
      : '<div class="empty" style="grid-column:span 3"><div class="empty-icon"><i class="fa-solid fa-circle-dot"></i></div>لم تضف عملاء بعد</div>';
    return;
  }
  const cTasks=n=>S.tasks.filter(t=>t.client===n).length;
  const cInc=n=>S.transactions.filter(t=>t.type==='income'&&t.source===n).reduce((s,t)=>s+t.amount,0);
  grid.innerHTML=clients.map(c=>`
    <div class="client-card" onclick="openClientProfile(${c.id})" style="cursor:pointer">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div class="client-avatar" style="background:${c.color}22;color:${c.color}">${c.name[0]}</div>
        <div style="display:flex;gap:4px" onclick="event.stopPropagation()">
          <button class="btn btn-ghost btn-sm" title="إعدادات / تعديل" onclick="openClientModal(${c.id})"><i class="fa-solid fa-gear"></i>️</button>
          <button class="btn btn-ghost btn-sm" title="بوابة العميل" onclick="openClientPortal(${c.id})"><i class="fa-solid fa-link"></i></button>
          <button class="btn btn-danger btn-sm" onclick="delClient(${c.id})"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
      <div style="font-size:15px;font-weight:700">${c.name}${(()=>{const subs=S.clients.filter(sc=>String(sc.parentClientId)===String(c.id));return subs.length?` <span style="font-size:10px;background:rgba(124,111,247,.15);color:var(--accent);padding:1px 7px;border-radius:8px;font-weight:600"><i class="fa-solid fa-building"></i> ${subs.length} فرع</span>`:'';})()}</div>
      <div style="font-size:12px;color:var(--text2);margin-top:2px;display:flex;gap:6px;flex-wrap:wrap;align-items:center">
        <span>${c.type} · ${c.channel}${c.field?' · '+c.field:''}</span>
        ${c.workType==='fulltime'?'<span class="jtype-badge jtype-fulltime"><i class="fa-solid fa-building"></i> دوام</span>':c.workType==='parttime'?'<span class="jtype-badge jtype-parttime"><i class="fa-solid fa-alarm-clock"></i> بارت تايم</span>':c.workType==='sub'?(()=>{const par=S.clients.find(p=>String(p.id)===String(c.parentClientId));return `<span class="jtype-badge" style="background:rgba(79,209,165,.12);color:var(--accent3)"><i class="fa-solid fa-link"></i> تابع${par?' لـ '+par.name:''}</span>`;})():'<span class="jtype-badge jtype-freelance"><i class="fa-solid fa-bullseye"></i> فري لانس</span>'}
      </div>
      ${c.salary?`<div style="font-size:12px;color:var(--accent3);margin-top:4px;font-weight:700"><i class="fa-solid fa-coins"></i> ${c.salary.toLocaleString()} ج/شهر · يوم ${c.salaryDay}</div>`:''}
      ${c.phone?`<div style="font-size:12px;color:var(--text3);margin-top:6px;display:flex;align-items:center;gap:8px"><i class="fa-solid fa-phone"></i> ${c.phone}<a href="https://wa.me/${c.phone.replace(/[^\d]/g,'')}" target="_blank" onclick="event.stopPropagation()" style="display:inline-flex;align-items:center;gap:4px;background:#25D366;color:#fff;font-size:11px;font-weight:700;padding:2px 8px;border-radius:12px;text-decoration:none"><i class="fa-solid fa-comments"></i> واتساب</a></div>`:''}
      ${c.email?`<div style="font-size:12px;color:var(--text3)"><i class="fa-solid fa-envelope"></i> ${c.email}</div>`:''}
      ${c.notes?`<div style="font-size:12px;color:var(--text3);margin-top:6px;font-style:italic">${c.notes.slice(0,60)}${c.notes.length>60?'...':''}</div>`:''}
      <div style="display:flex;gap:16px;margin-top:12px">
        <div><div style="font-size:16px;font-weight:700;color:${c.color}">${cTasks(c.name)}</div><div style="font-size:11px;color:var(--text3)">مشاريع</div></div>
        <div><div style="font-size:16px;font-weight:700;color:var(--accent2)">${(()=>{const now=new Date();const ms=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0');return S.tasks.filter(t=>t.client===c.name&&((t.isoDate||'').startsWith(ms)||(t.doneAt||'').startsWith(ms))).length;})()}</div><div style="font-size:11px;color:var(--text3)">هذا الشهر</div></div>
        ${(()=>{const revs=(S.reviews||[]).filter(r=>String(r.client_id)===String(c.id)||r.client_name===c.name);if(!revs.length)return'';const avg=(revs.reduce((s,r)=>s+(+r.stars||0),0)/revs.length).toFixed(1);return`<div><div style="font-size:16px;font-weight:700;color:#f7c948">⭐ ${avg}</div><div style="font-size:11px;color:var(--text3)">${revs.length} تقييم</div></div>`;})()}
      </div>
    </div>`).join('');
}

