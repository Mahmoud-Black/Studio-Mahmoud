// ============================================================
// BACKUP SYSTEM
// ============================================================
const BACKUP_SETTINGS_KEY = 'studioOS_backup_settings';
const BACKUP_LAST_KEY     = 'studioOS_backup_last';
let backupReminderTimer   = null;

function getBackupSettings(){
  try{ return JSON.parse(localStorage.getItem(BACKUP_SETTINGS_KEY)||'{}'); }catch(e){ return {}; }
}
function saveBackupSettingsData(obj){
  localStorage.setItem(BACKUP_SETTINGS_KEY, JSON.stringify(obj));
}

/* ── Open Modal ── */
function openBackupModal(){
  const bs = getBackupSettings();
  // Populate path
  const pathInput = document.getElementById('backup-path-input');
  const pathDisp  = document.getElementById('backup-path-display');
  if(pathInput){ pathInput.value = bs.path || ''; }
  if(pathDisp){
    if(bs.path){ pathDisp.innerHTML='<i class="fa-solid fa-folder"></i> ' + bs.path; pathDisp.style.display='block'; }
    else { pathDisp.style.display='none'; }
  }
  // Populate checkboxes
  const cb3h    = document.getElementById('remind-3h');
  const cbClose = document.getElementById('remind-close');
  if(cb3h)    cb3h.checked    = !!bs.remind3h;
  if(cbClose) cbClose.checked = !!bs.remindClose;
  // Show last backup time
  updateBackupLastDisplay();
  // Next reminder
  updateNextReminderDisplay();
  openM('modal-backup');
}

/* ── Save path ── */
function saveBackupPath(){
  const val = (document.getElementById('backup-path-input')?.value||'').trim();
  const bs  = getBackupSettings();
  bs.path   = val;
  saveBackupSettingsData(bs);
  const pathDisp = document.getElementById('backup-path-display');
  if(pathDisp){
    if(val){ pathDisp.innerHTML='<i class="fa-solid fa-folder"></i> ' + val; pathDisp.style.display='block'; }
    else   { pathDisp.style.display='none'; }
  }
  showMiniNotif('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم حفظ مسار النسخ الاحتياطي');
}

/* ── Save reminder checkboxes ── */
function saveBackupSettings(){
  const bs  = getBackupSettings();
  const cb3h    = document.getElementById('remind-3h');
  const cbClose = document.getElementById('remind-close');
  bs.remind3h    = cb3h    ? cb3h.checked    : bs.remind3h;
  bs.remindClose = cbClose ? cbClose.checked : bs.remindClose;
  saveBackupSettingsData(bs);
  initBackupTimers();
  updateNextReminderDisplay();
}

/* ── Do backup ── */
function doBackupNow(){
  // دمج إعدادات الثيم قبل الحفظ
  _mergeUiSettingsIntoS();
  // Ensure latest state is queued for cloud save
  _queueCloudSave();
  const user    = getSession();
  const bs      = getBackupSettings();

  // جمع كل إعدادات الواجهة من localStorage
  var uiConfig = {};
  try{
    uiConfig.displayMode    = localStorage.getItem('studioDisplayMode') || '';
    uiConfig.accentColor    = localStorage.getItem('studioAccentColor') || '';
    uiConfig.lang           = localStorage.getItem('studioLang')        || '';
    uiConfig.platformConfig = JSON.parse(localStorage.getItem('platform_config')||'{}');
    uiConfig.svcCats        = JSON.parse(localStorage.getItem('_svcCats')||'[]');
    uiConfig.pfCats         = JSON.parse(localStorage.getItem('_pfCats')||'[]');
    // حفظ كل مفاتيح localStorage المتعلقة بالتطبيق
    uiConfig.allKeys = {};
    for(var k in localStorage){
      if(k.startsWith('studio') || k.startsWith('_svc') || k.startsWith('_pf') || k === 'platform_config'){
        try{ uiConfig.allKeys[k] = localStorage.getItem(k); }catch(e){}
      }
    }
  }catch(e){}

  // ── نسخة شاملة من كل حاجة في S ──
  const fullData = Object.assign({}, S, {
    settings          : Object.assign({}, S.settings||{}),
    tasks             : S.tasks||[],
    clients           : S.clients||[],
    transactions      : S.transactions||[],
    invoices          : S.invoices||[],
    goals             : S.goals||[],
    schedule          : S.schedule||[],
    teams             : S.teams||[],
    subscriptions     : S.subscriptions||[],
    projects          : S.projects||[],
    project_tasks     : S.project_tasks||[],
    services          : S.services||[],
    standalone_packages: S.standalone_packages||[],
    portfolio_projects: S.portfolio_projects||[],
    svc_orders        : S.svc_orders||[],
    specializations   : S.specializations||[],
    client_portals    : S.client_portals||[],
    statements        : S.statements||[],
    timeEntries       : S.timeEntries||[],
    contracts         : S.contracts||[],
    stores            : S.stores||[],
    taskStatuses      : S.taskStatuses||S.settings?.taskStatuses||[],
    paymentAccounts   : S.paymentAccounts||S.settings?.paymentAccounts||[],
  });

  const allUsers = getUsers();
  const backup  = {
    exportedAt  : new Date().toISOString(),
    version     : 'studioOS_v4_full',
    userId      : user ? user.id : 'guest',
    userName    : user ? user.name : 'guest',
    // ── البيانات الكاملة ──
    data        : fullData,
    // ── إعدادات الواجهة والثيم والألوان واللوجو ──
    uiConfig    : uiConfig,
    backupPath  : bs.path || '',
    // Full auth backup
    authUsers   : allUsers,
    currentUser : user ? { id: user.id, name: user.name, phone: user.phone, studio: user.studio } : null
  };

  const blob     = new Blob([JSON.stringify(backup, null, 2)], {type:'application/json'});
  const url      = URL.createObjectURL(blob);
  const a        = document.createElement('a');
  const dateStr  = new Date().toISOString().replace(/[:.]/g,'-').slice(0,19);
  const name     = (user?.name||'studio').replace(/\s+/g,'_');
  a.href         = url;
  a.download     = `Ordo_Backup_Full_${name}_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  // Save last backup time
  const now = new Date().toISOString();
  localStorage.setItem(BACKUP_LAST_KEY, now);
  updateBackupLastDisplay();
  updateNextReminderDisplay();
  // Reset 3h timer
  if(getBackupSettings().remind3h) initBackupTimers();
  // ── رفع على السحابة فوراً مع الحفظ ──
  cloudSave(S);
  showMiniNotif('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم النسخ الاحتياطي الكامل (البيانات + الإعدادات + المتاجر + اللوجو) وحفظ على السحابة!');
}

/* ── Import backup ── */
function doImportBackup(){
  document.getElementById('backup-file-input')?.click();
}
function readBackupFile(input){
  const file = input.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = function(e){
    try{
      const obj = JSON.parse(e.target.result);
      if(!obj.data || !obj.version) { alert('الملف غير صالح أو تالف'); return; }
      const confirmed = confirm(`هل تريد استعادة البيانات من نسخة:\n${obj.exportedAt ? new Date(obj.exportedAt).toLocaleString('ar-EG') : 'غير معروف'}\n${obj.userName||'غير معروف'}\n\nسيتم استبدال بياناتك الحالية!\n${obj.authUsers?'تشمل النسخة بيانات الحسابات':''}` );
      if(!confirmed) return;

      // ── استعادة بيانات التطبيق الرئيسية ──
      const session = getSession();
      const key = session ? 'studioOS_v3_'+session.id : userKey();
      localStorage.setItem(key, JSON.stringify(obj.data));

      // ── استعادة إعدادات الواجهة والثيم والألوان ──
      if(obj.uiConfig){
        try{
          if(obj.uiConfig.displayMode) localStorage.setItem('studioDisplayMode', obj.uiConfig.displayMode);
          if(obj.uiConfig.accentColor) localStorage.setItem('studioAccentColor', obj.uiConfig.accentColor);
          if(obj.uiConfig.lang)        localStorage.setItem('studioLang', obj.uiConfig.lang);
          if(obj.uiConfig.svcCats)     localStorage.setItem('_svcCats', JSON.stringify(obj.uiConfig.svcCats));
          if(obj.uiConfig.pfCats)      localStorage.setItem('_pfCats', JSON.stringify(obj.uiConfig.pfCats));
          // استعادة كل مفاتيح localStorage
          if(obj.uiConfig.allKeys){
            for(var _k in obj.uiConfig.allKeys){
              try{ if(obj.uiConfig.allKeys[_k]) localStorage.setItem(_k, obj.uiConfig.allKeys[_k]); }catch(e){}
            }
          }
          if(obj.uiConfig.platformConfig){
            // دمج platform_config مع احتفاظ باللوجو
            var _existPc = JSON.parse(localStorage.getItem('platform_config')||'{}');
            var _merged = Object.assign({}, _existPc, obj.uiConfig.platformConfig);
            localStorage.setItem('platform_config', JSON.stringify(_merged));
          }
        }catch(e2){ console.warn('uiConfig restore error:', e2); }
      }

      // ── ملاحظة: لوجو المستخدم (logo/store_logo) للفاتورة والمتجر فقط، مش platform_config ──

      // ── استعادة الحسابات ──
      if(obj.authUsers && Array.isArray(obj.authUsers) && obj.authUsers.length>0){
        const existingUsers = getUsers();
        let merged = [...existingUsers];
        obj.authUsers.forEach(bu=>{
          if(!merged.find(u=>u.id===bu.id || u.phone===bu.phone)){
            merged.push(bu);
          }
        });
        saveUsers(merged);
      }

      lsLoad();
      S = obj.data; // تأكيد تحميل البيانات في S
      migrateSFields && migrateSFields();

      // ── رفع النسخة المستعادة على السحابة فوراً ──
      if(_supaUserId){
        cloudSave(S);
        showMiniNotif('<i class="fa-solid fa-cloud-arrow-up"></i> جاري رفع النسخة الاحتياطية على السحابة...');
      }

      renderAll();
      if(typeof applyPlatformConfig==='function') applyPlatformConfig();
      closeM('modal-backup');
      toast('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تمت استعادة البيانات بنجاح!' + (obj.uiConfig?' (تم استعادة الإعدادات والثيم أيضاً)':'') + (obj.authUsers?' (وتم استعادة الحسابات)':''));
    }catch(err){
      alert('حدث خطأ في قراءة الملف. تأكد أنه ملف نسخ احتياطي صحيح.');
    }
  };
  reader.readAsText(file);
  input.value='';
}

/* ── Update last backup display ── */
function updateBackupLastDisplay(){
  const last   = localStorage.getItem(BACKUP_LAST_KEY);
  const el     = document.getElementById('backup-last-time');
  if(!el) return;
  if(last){
    const d = new Date(last);
    el.textContent = 'آخر نسخة: ' + d.toLocaleString('ar-EG');
    el.style.color = 'var(--accent3)';
  } else {
    el.textContent = 'لم يتم إنشاء نسخة بعد';
    el.style.color = 'var(--accent4)';
  }
}

/* ── Next reminder display ── */
function updateNextReminderDisplay(){
  const el  = document.getElementById('backup-next-reminder');
  if(!el) return;
  const bs  = getBackupSettings();
  const last = localStorage.getItem(BACKUP_LAST_KEY);
  if(bs.remind3h && last){
    const nextTime = new Date(new Date(last).getTime() + 3*60*60*1000);
    el.innerHTML='<i class="fa-solid fa-alarm-clock"></i> التذكير القادم: ' + nextTime.toLocaleTimeString('ar-EG', {hour:'2-digit',minute:'2-digit'});
    el.style.display='block';
  } else if(bs.remind3h && !last){
    el.innerHTML='<i class="fa-solid fa-alarm-clock"></i> التذكير سيبدأ بعد أول نسخة احتياطية';
    el.style.display='block';
  } else {
    el.style.display='none';
  }
}

/* ── Toast notification ── */
function showBackupToast(msg){
  const toast = document.getElementById('backup-toast');
  const msgEl = document.getElementById('backup-toast-msg');
  if(!toast) return;
  if(msgEl) msgEl.textContent = msg || 'مرت 3 ساعات — لا تنسَ النسخ الاحتياطي!';
  toast.style.display='block';
  // pulse the backup dot
  const dot = document.getElementById('backup-reminder-dot');
  if(dot) dot.style.display='inline-block';
}
function dismissBackupToast(){
  const toast = document.getElementById('backup-toast');
  if(toast) toast.style.display='none';
}

/* ── Mini notification ── */
function showMiniNotif(msg){
  let n = document.getElementById('mini-notif');
  if(!n){
    n = document.createElement('div');
    n.id='mini-notif';
    n.style.cssText='position:fixed;top:70px;left:50%;transform:translateX(-50%);background:var(--surface);border:1px solid var(--accent3);border-radius:10px;padding:10px 20px;font-size:13px;color:var(--text);z-index:6000;box-shadow:0 4px 20px rgba(0,0,0,.4);transition:opacity .3s;pointer-events:none;white-space:nowrap;max-width:90vw;text-align:center';
    document.body.appendChild(n);
  }
  n.innerHTML=msg;
  n.style.opacity='1';
  clearTimeout(n._t);
  n._t=setTimeout(()=>{n.style.opacity='0';},3500);
}

/* ── Init timers ── */
function initBackupTimers(){
  // Clear existing
  if(backupReminderTimer){ clearInterval(backupReminderTimer); backupReminderTimer=null; }
  const bs = getBackupSettings();
  if(bs.remind3h){
    const INTERVAL_MS = 3 * 60 * 60 * 1000; // 3 hours
    // Check every minute if 3h has passed
    backupReminderTimer = setInterval(()=>{
      const last = localStorage.getItem(BACKUP_LAST_KEY);
      const now  = Date.now();
      if(!last || (now - new Date(last).getTime()) >= INTERVAL_MS){
        const alreadyShown = document.getElementById('backup-toast')?.style.display === 'block';
        if(!alreadyShown) showBackupToast('مرت 3 ساعات — لا تنسَ النسخ الاحتياطي!');
      }
    }, 60 * 1000); // check every minute
    // Also check immediately on load
    setTimeout(()=>{
      const last = localStorage.getItem(BACKUP_LAST_KEY);
      const now  = Date.now();
      if(!last || (now - new Date(last).getTime()) >= INTERVAL_MS){
        showBackupToast('لم تقم بنسخ احتياطي منذ فترة — احفظ بياناتك الآن!');
      }
    }, 5000);
  }
  // beforeunload reminder
  window.onbeforeunload = null;
  if(bs.remindClose){
    window.onbeforeunload = function(e){
      const last = localStorage.getItem(BACKUP_LAST_KEY);
      const now  = Date.now();
      const noBackupRecently = !last || (now - new Date(last).getTime()) > 30*60*1000; // 30min
      if(noBackupRecently){
        const msg = 'هل تريد عمل نسخة احتياطية قبل الخروج؟';
        e.returnValue = msg;
        return msg;
      }
    };
  }
}

// ============================================================
// INVOICE POLICIES
// ============================================================
// invPolicies = array of {icon, text} for current invoice modal
let invPolicies = [];

function renderPoliciesList(containerId, arr, removeFunc){
  const el = document.getElementById(containerId);
  if(!el) return;
  if(!arr.length){ el.innerHTML='<div style="font-size:12px;color:var(--text3);padding:4px 0">لا سياسات مضافة</div>'; return; }
  el.innerHTML = arr.map((p,i)=>`
    <div style="display:flex;align-items:center;gap:8px;padding:6px 10px;background:var(--surface2);border-radius:8px;margin-bottom:5px;font-size:13px">
      <span>${p.icon}</span>
      <span style="flex:1;color:var(--text2)">${p.text}</span>
      <button onclick="${removeFunc}(${i})" style="background:none;border:none;cursor:pointer;color:var(--text3);font-size:14px;padding:2px 4px;border-radius:4px" title="حذف"><i class="fa-solid fa-xmark"></i></button>
    </div>`).join('');
}

// ── Policy Icon Picker ──
function togglePolicyIconDD(ddId, inputId, btnId){
  const dd = document.getElementById(ddId);
  if(!dd) return;
  const isOpen = dd.style.display === 'flex';
  // close all open DDs first
  document.querySelectorAll('[id$="-icon-dd"]').forEach(el=>{ el.style.display='none'; });
  if(!isOpen){ dd.style.display='flex'; }
}
function pickPolicyIcon(inputId, btnId, ddId, val){
  const input = document.getElementById(inputId);
  const btn   = document.getElementById(btnId);
  const dd    = document.getElementById(ddId);
  if(input) input.value = val;
  if(btn)   btn.innerHTML = val;
  if(dd)    dd.style.display = 'none';
}
// close on outside click
document.addEventListener('click', function(e){
  if(!e.target.closest('[id$="-icon-dd"]') && !e.target.closest('[id$="-icon-btn"]')){
    document.querySelectorAll('[id$="-icon-dd"]').forEach(el=>{ el.style.display='none'; });
  }
});

function addPolicy(){
  const icon = document.getElementById('policy-icon-sel')?.value || '<i class="fa-solid fa-clipboard-list"></i>';
  const text = (document.getElementById('policy-text-input')?.value||'').trim();
  if(!text) return;
  if(!S.settings.policies) S.settings.policies = [];
  S.settings.policies.push({icon, text});
  document.getElementById('policy-text-input').value = '';
  renderPoliciesList('policies-list', S.settings.policies, 'removePolicy');
}
function removePolicy(i){
  if(!S.settings.policies) return;
  S.settings.policies.splice(i,1);
  renderPoliciesList('policies-list', S.settings.policies, 'removePolicy');
}

function addInvPolicy(){
  const icon = document.getElementById('inv-policy-icon')?.value || '<i class="fa-solid fa-clipboard-list"></i>';
  const text = (document.getElementById('inv-policy-text')?.value||'').trim();
  if(!text) return;
  invPolicies.push({icon, text});
  document.getElementById('inv-policy-text').value = '';
  renderPoliciesList('inv-policies-list', invPolicies, 'removeInvPolicy');
}
function removeInvPolicy(i){
  invPolicies.splice(i,1);
  renderPoliciesList('inv-policies-list', invPolicies, 'removeInvPolicy');
}

function loadInvPoliciesFromSettings(){
  invPolicies = (S.settings.policies || []).map(p=>({...p}));
  renderPoliciesList('inv-policies-list', invPolicies, 'removeInvPolicy');
}

function buildPoliciesHTML(policies){
  if(!policies || !policies.length) return '';
  return `<div class="inv-policies-section">
    <div style="font-size:11px;font-weight:700;color:#7c6ff7;margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px"><i class="fa-solid fa-clipboard-list"></i> السياسات والشروط</div>
    ${policies.map(p=>`<div class="inv-policy-item"><span class="inv-policy-icon">${p.icon}</span><span>${p.text}</span></div>`).join('')}
  </div>`;
}

// ============================================================
// QR CODE & SOCIAL LINKS
// ============================================================
const SOCIAL_META = {
  instagram: { label:'انستقرام', color:'#E1306C',
    svg:'<svg viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" fill="none" stroke="currentColor" stroke-width="2"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" stroke="currentColor" stroke-width="2"/></svg>' },
  facebook:  { label:'فيسبوك',   color:'#1877F2',
    svg:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' },
  behance:   { label:'بيهانس',   color:'#1769FF',
    svg:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 5h7a4 4 0 0 1 0 8H3V5z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 13h8a4 4 0 0 1 0 6H3v-6z" fill="none" stroke="currentColor" stroke-width="2"/><line x1="14" y1="7" x2="21" y2="7" stroke="currentColor" stroke-width="2"/><path d="M14 12h7a3.5 3.5 0 0 0-7 0z" fill="none" stroke="currentColor" stroke-width="2"/></svg>' },
  linkedin:  { label:'لينكدإن',   color:'#0077B5',
    svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>' },
  tiktok:    { label:'تيك توك',  color:'#000000',
    svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>' },
  youtube:   { label:'يوتيوب',   color:'#FF0000',
    svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="currentColor"/></svg>' },
  twitter:   { label:'تويتر/X',  color:'#000000',
    svg:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.259 5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>' },
  website:   { label:'موقع ويب', color:'#7c6ff7',
    svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>' },
  whatsapp:  { label:'واتساب',   color:'#25D366',
    svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>' },
  other:     { label:'رابط',      color:'#888888',
    svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>' }
};
// Helper to get icon HTML from SOCIAL_META
function getSocialIconHTML(platform, size=16) {
  const meta = SOCIAL_META[platform] || SOCIAL_META.other;
  return `<span style="display:inline-flex;width:${size}px;height:${size}px;color:${meta.color};flex-shrink:0">${meta.svg}</span>`;
}

/* Live QR preview while typing — delegated to the wrapper defined in <head> */
// liveQR() is already defined above in the QR wrapper script block

/* Social links in settings */

// ════ Custom Social Media Dropdown ════
const _SOCIAL_OPTS = [
  { value:'instagram', label:'انستقرام',  color:'#E1306C', svg:'instagram' },
  { value:'facebook',  label:'فيسبوك',    color:'#1877F2', svg:'facebook' },
  { value:'behance',   label:'بيهانس',    color:'#1769FF', svg:'behance' },
  { value:'linkedin',  label:'لينكدإن',   color:'#0077B5', svg:'linkedin' },
  { value:'tiktok',    label:'تيك توك',   color:'#111111', svg:'tiktok' },
  { value:'youtube',   label:'يوتيوب',    color:'#FF0000', svg:'youtube' },
  { value:'twitter',   label:'تويتر/X',   color:'#000000', svg:'twitter' },
  { value:'website',   label:'موقع ويب',  color:'#7c6ff7', svg:'website' },
  { value:'whatsapp',  label:'واتساب',    color:'#25D366', svg:'whatsapp' },
  { value:'other',     label:'أخرى',      color:'#888888', svg:'other' },
];

function _renderSocialDD() {
  const menu = document.getElementById('social-dd-menu');
  if(!menu) return;
  menu.innerHTML = _SOCIAL_OPTS.map(opt => {
    const meta = SOCIAL_META[opt.svg] || SOCIAL_META.other;
    return `<div onclick="selectSocialOpt('${opt.value}')" style="display:flex;align-items:center;gap:9px;padding:9px 12px;cursor:pointer;font-size:13px;font-weight:600;color:var(--text);border-bottom:1px solid var(--border)" onmouseover="this.style.background='var(--surface2)'" onmouseout="this.style.background=''">
      <span style="display:inline-flex;width:18px;height:18px;color:${meta.color};flex-shrink:0">${meta.svg}</span>
      <span style="color:${meta.color}">${opt.label}</span>
    </div>`;
  }).join('');
}

function toggleSocialDD() {
  const menu = document.getElementById('social-dd-menu');
  if(!menu) return;
  if(menu.style.display === 'none') {
    _renderSocialDD();
    menu.style.display = 'block';
    // إغلاق عند الضغط خارج
    setTimeout(() => {
      document.addEventListener('click', function _closeSocDD(e) {
        if(!document.getElementById('social-platform-dd')?.contains(e.target)) {
          menu.style.display = 'none';
          document.removeEventListener('click', _closeSocDD);
        }
      });
    }, 10);
  } else {
    menu.style.display = 'none';
  }
}

function selectSocialOpt(value) {
  const opt = _SOCIAL_OPTS.find(o => o.value === value);
  if(!opt) return;
  const meta = SOCIAL_META[opt.svg] || SOCIAL_META.other;
  // تحديث hidden input
  const inp = document.getElementById('social-platform-sel');
  if(inp) inp.value = value;
  // تحديث الـ button
  const icon = document.getElementById('social-dd-icon');
  const label = document.getElementById('social-dd-label');
  if(icon) { icon.innerHTML = meta.svg; icon.style.color = meta.color; }
  if(label) { label.textContent = opt.label; label.style.color = meta.color; }
  // إغلاق
  const menu = document.getElementById('social-dd-menu');
  if(menu) menu.style.display = 'none';
  // تحديث الـ placeholder
  updateSocialPlaceholder();
}

// إضافة السوشيال - تحديث لقراءة من hidden input
function updateSocialPlaceholder(){
  const sel = document.getElementById('social-platform-sel');
  const inp = document.getElementById('social-url-input');
  if(!inp||!sel) return;
  const val = sel.value || sel.getAttribute('value') || 'instagram';
  const placeholders = {
    instagram:'https://instagram.com/yourhandle',
    facebook:'https://facebook.com/yourpage',
    behance:'https://behance.net/yourname',
    linkedin:'https://linkedin.com/in/yourname',
    tiktok:'https://tiktok.com/@yourhandle',
    youtube:'https://youtube.com/@yourchannel',
    twitter:'https://twitter.com/yourhandle',
    website:'https://yourwebsite.com',
    whatsapp:'رقم الواتساب بالكود الدولي مثلاً 201001234567',
    other:'الرابط'
  };
  inp.placeholder = placeholders[val]||'الرابط';
}

function addSocial(){
  const sel = document.getElementById('social-platform-sel');
  const url = (document.getElementById('social-url-input')?.value||'').trim();
  if(!url) return alert('أدخل الرابط');
  if(!S.settings.socials) S.settings.socials = [];
  // قراءة الـ value (hidden input أو select)
  const platform = (sel?.value) || 'other';
  const existing = S.settings.socials.findIndex(s=>s.platform===platform);
  if(existing>-1) S.settings.socials[existing].url = url;
  else S.settings.socials.push({ platform, url });
  document.getElementById('social-url-input').value = '';
  lsSave(); cloudSave(S);
  renderSocialsList();
}

function removeSocial(i){
  if(!S.settings.socials) return;
  S.settings.socials.splice(i,1);
  lsSave(); cloudSave(S);
  renderSocialsList();
}

function openSocialIconEditor(idx){
  const s = (S.settings.socials||[])[idx];
  if(!s) return;
  const meta = SOCIAL_META[s.platform]||SOCIAL_META.other;
  let modal = document.getElementById('_modal-social-icon');
  if(!modal){
    modal = document.createElement('div');
    modal.id = '_modal-social-icon';
    modal.className = 'modal-overlay';
    modal.innerHTML = '<div class="modal" style="max-width:460px" id="_modal-social-icon-inner"></div>';
    document.body.appendChild(modal);
    modal.addEventListener('click',e=>{if(e.target===modal)closeM('_modal-social-icon');});
  }
  document.getElementById('_modal-social-icon-inner').innerHTML = `
    <div class="modal-header">
      <div class="modal-title"><i class="fa-solid fa-palette"></i> تخصيص أيقونة ${meta.label}</div>
      <button class="close-btn" onclick="closeM('_modal-social-icon')"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div style="padding:20px">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;padding:12px;background:var(--surface2);border-radius:10px">
        <span id="_sie-preview" style="display:inline-flex;width:32px;height:32px;color:${meta.color}">${s.customSvg||meta.svg||'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>'}</span>
        <div>
          <div style="font-size:12px;font-weight:700">${meta.label}</div>
          <div style="font-size:10px;color:var(--text3)">معاينة الأيقونة الحالية</div>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">SVG Code أو رابط صورة</label>
        <textarea id="_sie-input" class="form-input" rows="4" placeholder='<svg viewBox="0 0 24 24" ...>...</svg>&#10;أو&#10;https://example.com/icon.png' style="font-family:monospace;font-size:11px;resize:vertical" oninput="_updateSiePreview(this.value,'${meta.color}')">${s.customSvg||''}</textarea>
        <div style="font-size:10px;color:var(--text3);margin-top:4px">الصق كود SVG أو رابط صورة PNG/SVG من الإنترنت</div>
      </div>
      <div style="display:flex;gap:8px;margin-top:4px">
        <button onclick="_resetSocialIcon(${idx})" class="btn btn-ghost" style="flex:1">↺ إعادة الافتراضي</button>
        <button onclick="_saveSocialIcon(${idx})" class="btn btn-primary" style="flex:1" data-i18n="btn_save"><i class="fa-solid fa-floppy-disk" style="margin-left:4px"></i> حفظ</button>
      </div>
    </div>`;
  openM('_modal-social-icon');
}

function _updateSiePreview(val, color){
  const prev = document.getElementById('_sie-preview');
  if(!prev) return;
  val = val.trim();
  if(val.startsWith('<svg')){
    prev.innerHTML = val;
    prev.style.color = color;
  } else if(val.startsWith('http')){
    prev.innerHTML = `<img src="${val}" style="width:100%;height:100%;object-fit:contain">`;
  }
}

function _resetSocialIcon(idx){
  if(!S.settings.socials||!S.settings.socials[idx]) return;
  delete S.settings.socials[idx].customSvg;
  lsSave(); renderSocialsList();
  closeM('_modal-social-icon');
}

function _saveSocialIcon(idx){
  const val = document.getElementById('_sie-input')?.value.trim();
  if(!S.settings.socials||!S.settings.socials[idx]) return;
  if(val && (val.startsWith('<svg') || val.startsWith('http'))){
    if(val.startsWith('http')){
      S.settings.socials[idx].customSvg = `<img src="${val}" style="width:100%;height:100%;object-fit:contain">`;
    } else {
      S.settings.socials[idx].customSvg = val;
    }
  } else if(!val){
    delete S.settings.socials[idx].customSvg;
  }
  lsSave(); renderSocialsList();
  closeM('_modal-social-icon');
  if(typeof toast==='function') toast('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم تحديث الأيقونة');
}

function renderSocialsList(){
  const el = document.getElementById('socials-list');
  if(!el) return;
  const socials = S.settings.socials||[];
  if(!socials.length){ el.innerHTML='<div style="font-size:12px;color:var(--text3);padding:4px 0">لا منصات مضافة بعد</div>'; return; }
  el.innerHTML = socials.map((s,i)=>{
    const meta = SOCIAL_META[s.platform]||SOCIAL_META.other;
    const customIconHtml = s.customSvg
      ? `<span style="display:inline-flex;width:20px;height:20px;color:${meta.color}">${s.customSvg}</span>`
      : getSocialIconHTML(s.platform,20);
    return `<div class="social-item">
      <span class="social-icon">${customIconHtml}</span>
      <div style="flex:1;min-width:0">
        <div style="font-size:11px;font-weight:700;color:${meta.color}">${meta.label}</div>
        <div class="social-url">${s.url}</div>
      </div>
      <button onclick="openSocialIconEditor(${i})" title="تغيير الأيقونة" style="background:rgba(124,111,247,.1);border:none;border-radius:6px;color:var(--accent);font-size:10px;padding:2px 7px;cursor:pointer;font-weight:700;margin-left:4px">أيقونة</button>
      <button class="social-del" onclick="removeSocial(${i})" title="حذف"><i class="fa-solid fa-xmark"></i></button>
    </div>`;
  }).join('');
}

/* Build QR section HTML for invoice preview/PDF */
function buildQRSectionHTML(inv, forPDF){
  const projectUrl = inv.projectUrl||'';
  const socials = S.settings.socials||[];
  if(!projectUrl && !socials.length) return '';

  const sz = forPDF ? 90 : 72;
  const bgStyle = forPDF
    ? 'margin:0 28px 20px;padding:16px 18px;background:#f5f3ff;border-radius:8px;border:1px solid #e0dcff'
    : 'margin-top:16px;padding-top:14px;border-top:2px dashed #e0dcff';

  let blocks = '';

  if(projectUrl){
    const du = getQRDataURL(projectUrl, sz);
    if(du) blocks += `
      <div class="inv-qr-block" style="text-align:center">
        <img src="${du}" width="${sz}" height="${sz}" style="border-radius:6px;border:1px solid #e0e0f0;display:block">
        <div style="font-size:10px;font-weight:700;color:#7c6ff7;margin-top:5px;text-transform:uppercase;letter-spacing:.5px"><i class="fa-solid fa-link"></i> استلام المشروع</div>
        <div style="font-size:9px;color:#888;max-width:${sz+10}px;word-break:break-all;margin-top:2px">${projectUrl.length>38?projectUrl.slice(0,38)+'…':projectUrl}</div>
      </div>`;
  }

  if(socials.length){
    socials.forEach(s=>{
      const meta = SOCIAL_META[s.platform]||SOCIAL_META.other;
      const du = getQRDataURL(s.url, sz);
      if(du) blocks += `
        <div class="inv-qr-block" style="text-align:center">
          <img src="${du}" width="${sz}" height="${sz}" style="border-radius:6px;border:1px solid #e0e0f0;display:block">
          <div style="font-size:10px;font-weight:700;color:${meta.color};margin-top:5px">${meta.icon} ${meta.label}</div>
        </div>`;
    });
  }

  if(!blocks) return '';

  return `<div style="${bgStyle}">
    <div style="font-size:11px;font-weight:700;color:#7c6ff7;margin-bottom:12px;text-transform:uppercase;letter-spacing:.5px"><i class="fa-solid fa-mobile-screen"></i> QR كودات — امسحها بكاميرتك</div>
    <div style="display:flex;gap:18px;flex-wrap:wrap;align-items:flex-start">${blocks}</div>
  </div>`;
}

/* Auth SCREEN BACKUP IMPORT */

// ============================================================
// AUTH SCREEN BACKUP IMPORT
// ============================================================
function triggerAuthBackupImport(){
  document.getElementById('auth-backup-input')?.click();
}

function doAuthBackupImport(input){
  const file = input.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = function(e){
    try{
      const obj = JSON.parse(e.target.result);
      if(!obj.version){ alert('<i class="fa-solid fa-triangle-exclamation"></i> الملف غير صالح أو تالف'); return; }
      const confirmed = confirm(
        `<i class="fa-solid fa-folder-open"></i> استعادة نسخة احتياطية\n\n` +
        `<i class="fa-solid fa-calendar-days"></i> التاريخ: ${obj.exportedAt ? new Date(obj.exportedAt).toLocaleString('ar-EG') : 'غير معروف'}\n` +
        `<i class="fa-solid fa-user"></i> المستخدم: ${obj.userName||'غير معروف'}\n` +
        `${obj.authUsers?'<i class="fa-solid fa-users"></i> الحسابات: '+obj.authUsers.length+' حساب':''}\n\n` +
        `<i class="fa-solid fa-triangle-exclamation"></i> سيتم استيراد البيانات والحسابات — تأكيد؟`
      );
      if(!confirmed){ input.value=''; return; }

      // Restore users
      if(obj.authUsers && Array.isArray(obj.authUsers) && obj.authUsers.length>0){
        const existingUsers = getUsers();
        let merged = [...existingUsers];
        obj.authUsers.forEach(bu=>{
          if(!merged.find(u=>u.id===bu.id || u.phone===bu.phone)){
            merged.push(bu);
          }
        });
        saveUsers(merged);
      }

      // Restore app data - use correct key format studioOS_v3_
      if(obj.data && obj.userId){
        const dataKey = 'studioOS_v3_'+obj.userId;
        localStorage.setItem(dataKey, JSON.stringify(obj.data));
      }

      input.value='';
      alert('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تمت استعادة البيانات بنجاح!\n\nيمكنك الآن تسجيل الدخول بحسابك المعتاد.');
      // Auto-fill phone if available
      if(obj.currentUser?.phone){
        const phoneInput = document.getElementById('login-phone');
        if(phoneInput) phoneInput.value = obj.currentUser.phone;
        switchAuthTab('login');
      }
    }catch(err){
      console.error(err);
      alert('<i class="fa-solid fa-triangle-exclamation"></i> حدث خطأ في قراءة الملف. تأكد أنه ملف نسخ احتياطي صحيح.');
    }
  };
  reader.readAsText(file);
}

// ============================================================
// INIT
// ============================================================

// ============================================================
// TOGGLE COMPLETE PAY FIELDS
// ============================================================
function toggleCompletePayFields(){
  const yes = document.getElementById('complete-pay-collected')?.checked;
  // The radio with id complete-pay-collected is "yes" radio
  const fields = document.getElementById('complete-income-fields');
  const reminder = document.getElementById('complete-reminder-note');
  if(fields) fields.style.display = yes ? 'block' : 'none';
  if(reminder) reminder.style.display = yes ? 'none' : 'block';
}

// ============================================================
// WORKER FIELDS LOGIC
// ============================================================
function toggleWorkerFields(){
  const wt = document.getElementById('t-worker-type')?.value||'me';
  const memberWrap = document.getElementById('t-worker-member-wrap');
  const paySection = document.getElementById('t-worker-pay-section');
  if(memberWrap) memberWrap.style.display = wt==='team' ? 'block' : 'none';
  if(paySection) paySection.style.display = wt==='team' ? 'block' : 'none';
  calcTaskProfit();
}

function toggleWorkerDepositField(){
  const yes = document.getElementById('t-worker-deposit-status')?.value==='yes';
  const wrap = document.getElementById('t-worker-deposit-wrap');
  if(wrap) wrap.style.display = yes ? 'block' : 'none';
}

function calcTaskProfit(){
  const total = +(document.getElementById('t-value')?.value)||0;
  const wt = document.getElementById('t-worker-type')?.value||'me';
  const summary = document.getElementById('t-profit-summary');
  if(!summary) return;
  if(wt==='team'){
    let memberAmt = 0;
    if(workerPayMode==='pct'){
      const pct = +(document.getElementById('t-worker-pct')?.value)||0;
      memberAmt = total ? Math.round(total*pct/100) : 0;
    } else {
      memberAmt = +(document.getElementById('t-worker-amount')?.value)||0;
    }
    const mine = total - memberAmt;
    if(total>0){
      document.getElementById('ps-total').textContent = total.toLocaleString()+' '+_getCurrency();
      document.getElementById('ps-member').textContent = memberAmt.toLocaleString()+' '+_getCurrency();
      document.getElementById('ps-mine').textContent = mine.toLocaleString()+' '+_getCurrency();
      summary.style.display = 'block';
    }
  } else {
    summary.style.display = 'none';
  }
}

function onWorkerMemberChange(){
  // Auto-fill amount from member's default rate
  const memberName = document.getElementById('t-worker-member')?.value;
  const total = +(document.getElementById('t-value')?.value)||0;
  if(memberName && total>0){
    // Find member in teams
    let found = null;
    S.teams.forEach(team=>{
      const m = team.members.find(m=>m.name===memberName);
      if(m) found = m;
    });
    if(found && found.rate){
      if(workerPayMode==='pct'){
        const pctEl = document.getElementById('t-worker-pct');
        if(pctEl && !pctEl.value) pctEl.value = found.rate;
      } else {
        const autoAmt = Math.round(total * found.rate / 100);
        const amtEl = document.getElementById('t-worker-amount');
        if(amtEl && !amtEl.value) amtEl.value = autoAmt;
      }
    }
  }
  calcTaskProfit();
}

function fillWorkerMembersDD(){
  const sel = document.getElementById('t-worker-member'); if(!sel) return;
  const cur = sel.value;
  sel.innerHTML = '<option value="">— اختر عضو —</option>';
  let totalMembers = 0;
  S.teams.forEach(team=>{
    if(team.members.length){
      const grp = document.createElement('optgroup');
      grp.label = '<i class="fa-solid fa-users"></i> '+team.name;
      team.members.forEach(m=>{
        const o = document.createElement('option');
        o.value = m.name;
        o.textContent = m.name + ' ('+(m.role||'عضو')+')' + (m.rate?' — '+m.rate+'%':'');
        grp.appendChild(o);
        totalMembers++;
      });
      sel.appendChild(grp);
    }
  });
  sel.value = cur;
  // Show hint if no members
  const hint = document.getElementById('t-no-members-hint');
  if(hint) hint.style.display = totalMembers===0 ? 'block' : 'none';
}

