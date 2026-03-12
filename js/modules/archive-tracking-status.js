// ═══════════════════════════════════════════════════
// AUTO-ARCHIVE: completed tasks hide next day
// ═══════════════════════════════════════════════════
function runDailyArchive(){
  const today = new Date().toISOString().split('T')[0];
  const lastRun = localStorage.getItem('_studioArchiveDate');
  if(lastRun === today) return; // already ran today
  localStorage.setItem('_studioArchiveDate', today);

  if(!S.archivedTasks) S.archivedTasks = [];
  const toArchive = (S.tasks||[]).filter(t => {
    if(!t.done) return false;
    const doneDate = t.doneAt || t.completedAt || '';
    // Archive if completed before today
    return doneDate && doneDate < today;
  });
  if(!toArchive.length) return;

  toArchive.forEach(t => {
    S.archivedTasks.push({...t, archivedAt: today});
  });
  S.tasks = S.tasks.filter(t => !toArchive.find(a=>a.id===t.id));
  lsSave();
  showMotivationalNotif(`<i class="fa-solid fa-box"></i> تم أرشفة ${toArchive.length} مهمة مكتملة من أمس`, 'var(--accent3)');
}

function restoreArchivedTask(taskId){
  if(!S.archivedTasks) return;
  const t = S.archivedTasks.find(x=>x.id===taskId);
  if(!t) return;
  S.archivedTasks = S.archivedTasks.filter(x=>x.id!==taskId);
  const {archivedAt, ...task} = t;
  S.tasks.push(task);
  lsSave(); renderAll();
  toast('↩ تم استعادة: '+t.title);
}

function renderArchivedTasksLog(){
  const el = document.getElementById('tasks-archive-log'); if(!el) return;
  const arch = (S.archivedTasks||[]).slice().sort((a,b)=>b.archivedAt?.localeCompare(a.archivedAt||'')||0);
  if(!arch.length){
    el.innerHTML='<div class="empty" style="padding:32px"><div class="empty-icon"><i class="fa-solid fa-box"></i></div>لا مهام مؤرشفة</div>';
    return;
  }
  // Group by archivedAt date
  const byDate={};
  arch.forEach(t=>{const d=t.archivedAt||'غير محدد';if(!byDate[d])byDate[d]=[];byDate[d].push(t);});
  el.innerHTML = Object.entries(byDate).map(([date,tasks])=>`
    <div style="margin-bottom:16px">
      <div style="font-size:11px;color:var(--text3);font-weight:700;padding:6px 0;border-bottom:1px solid var(--border);margin-bottom:8px"><i class="fa-solid fa-calendar-days"></i> أُرشف بتاريخ: ${date}</div>
      ${tasks.map(t=>`
        <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--surface2);border-radius:10px;margin-bottom:6px;border:1px solid var(--border)">
          <span style="font-size:18px"><i class="fa-solid fa-square-check" style="color:var(--accent3)"></i></span>
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t.title||''}</div>
            <div style="font-size:11px;color:var(--text3)">${t.client||''} ${t.value?'· '+t.value.toLocaleString()+' ج':''} ${t.doneAt?'· اكتمل '+t.doneAt:''}</div>
          </div>
          <button onclick="restoreArchivedTask(${t.id})" class="btn btn-ghost btn-sm" style="flex-shrink:0;color:var(--accent)">↩ استعادة</button>
        </div>`).join('')}
    </div>`).join('');
}

// Add archive tab to tasks page
window.addEventListener('load', function(){
  setTimeout(function(){
    // Add "<i class="fa-solid fa-box"></i> الأرشيف" tab to task tabs
    const tabsWrap = document.querySelector('[id="ttab-active"]')?.parentElement;
    if(tabsWrap && !document.getElementById('ttab-archive')){
      const archBtn = document.createElement('button');
      archBtn.id = 'ttab-archive';
      archBtn.style.cssText = 'padding:7px 18px;font-size:12px;font-weight:700;border:none;background:transparent;color:var(--text3);border-radius:9px;cursor:pointer;transition:.18s';
      archBtn.innerHTML='<i class="fa-solid fa-box"></i> الأرشيف';
      archBtn.onclick = ()=>switchTasksTab('archive');
      tabsWrap.appendChild(archBtn);
    }
    // Add archive view container after tasks-log-view
    const logView = document.getElementById('tasks-log-view');
    if(logView && !document.getElementById('tasks-archive-view')){
      const div = document.createElement('div');
      div.id = 'tasks-archive-view';
      div.style.display = 'none';
      div.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div class="section-title" style="margin:0"><i class="fa-solid fa-box"></i> المهام المؤرشفة</div>
          <div style="font-size:11px;color:var(--text3)" id="arch-count"></div>
        </div>
        <div id="tasks-archive-log"></div>`;
      logView.parentNode.insertBefore(div, logView.nextSibling);
    }
    // Run archive check
    runDailyArchive();
  }, 800);
});

// Patch switchTasksTab to handle 'archive'
(function(){
  const _origSwitch = switchTasksTab;
  switchTasksTab = function(tab){
    if(tab==='archive'){
      // Hide all other views
      ['tasks-active-view','tasks-log-view'].forEach(id=>{
        const el=document.getElementById(id);if(el)el.style.display='none';
      });
      const archView = document.getElementById('tasks-archive-view');
      if(archView) archView.style.display='block';
      // Update tab styles
      ['active','log-day','log-month','log-year','archive'].forEach(t=>{
        const btn=document.getElementById('ttab-'+t);
        if(btn){
          btn.style.color=t==='archive'?'var(--accent)':'var(--text3)';
          btn.style.background=t==='archive'?'rgba(124,111,247,.18)':'transparent';
        }
      });
      const cnt=document.getElementById('arch-count');
      if(cnt)cnt.textContent=(S.archivedTasks||[]).length+' مهمة';
      renderArchivedTasksLog();
      return;
    }
    // Hide archive view when switching away
    const archView=document.getElementById('tasks-archive-view');
    if(archView)archView.style.display='none';
    _origSwitch(tab);
  };
})();

// ═══════════════════════════════════════════════════
// TRACKING PAGE — branded with system colors + logo
// ═══════════════════════════════════════════════════
// Override _buildTrackingPageHTML with branded version
_buildTrackingPageHTML = function(t){
  const steps=t.steps||[];
  const stepsTotal=steps.length, stepsDone=steps.filter(s=>s.done).length;
  const pct=stepsTotal?Math.round(stepsDone/stepsTotal*100):(t.done?100:0);

  // Pull live system settings
  const studio   = S.settings?.name||'Ordo';
  const phone    = S.settings?.phone||'';
  const email    = S.settings?.email||'';
  const logo     = S.settings?.logo||'';  // base64 or URL
  const socials  = S.settings?.socials||[];
  const accentColor = localStorage.getItem('studioAccentColor')||'#7c6ff7';
  const displayMode = localStorage.getItem('studioDisplayMode')||'dark';

  // Derive palette from accent
  const isDark = displayMode==='dark';
  const bg     = isDark?'#0f0f1a':'#f5f6fb';
  const bg2    = isDark?'#1a1a2e':'#ffffff';
  const bg3    = isDark?'#12122a':'#f0f0f8';
  const border = isDark?'rgba(255,255,255,.08)':'rgba(0,0,0,.08)';
  const text   = isDark?'#e8e8f0':'#1a1a2e';
  const text2  = isDark?'#aaa':'#555';
  const text3  = isDark?'#666':'#999';

  // Accent-derived gradient
  const accentHex = accentColor;
  function hexToRgb(hex){const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);return `${r},${g},${b}`;}
  const accentRgb = accentHex.startsWith('#') ? hexToRgb(accentHex) : '124,111,247';

  const status={new:'جديد',progress:'قيد التنفيذ',review:'مراجعة',done:'مكتمل <i class="fa-solid fa-square-check" style="color:var(--accent3)"></i>'}[t.status]||t.status;
  const statusColor={new:text3,progress:'#f7c948',review:accentHex,done:'#4fd1a5'}[t.status]||text3;
  const daysLeft=t.deadline?Math.max(0,Math.ceil((new Date(t.deadline)-new Date())/(1000*60*60*24))):null;

  const _svgIcons={
    instagram:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><circle cx="17.5" cy="6.5" r=".5" fill="currentColor"/></svg>',
    facebook:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>',
    behance:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M3 5h7a4 4 0 0 1 0 8H3V5z"/><path d="M3 13h8a4 4 0 0 1 0 6H3v-6z"/><line x1="14" y1="7" x2="21" y2="7"/><path d="M14 12h7a3.5 3.5 0 0 0-7 0z"/></svg>',
    linkedin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>',
    tiktok:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>',
    youtube:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="2" y="6" width="20" height="14" rx="3"/><polygon points="10 9 16 13 10 17" fill="currentColor" stroke="none"/></svg>',
    twitter:'<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.259 5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
    whatsapp:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>',
    website:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
    other:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>'
  };

  return `<!DOCTYPE html><html dir="rtl" lang="ar"><head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>متابعة: ${t.title} — ${studio}</title>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap" rel="stylesheet">
  <style>
    :root{--accent:${accentHex};--accent-rgb:${accentRgb};--bg:${bg};--bg2:${bg2};--bg3:${bg3};--border:${border};--text:${text};--text2:${text2};--text3:${text3}}
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:Cairo,sans-serif;background:var(--bg);color:var(--text);direction:rtl;min-height:100vh}
    .hdr{background:linear-gradient(135deg,rgba(var(--accent-rgb),.9),rgba(var(--accent-rgb),.5));padding:28px 24px;text-align:center;position:relative;overflow:hidden;border-bottom:1px solid rgba(var(--accent-rgb),.2)}
    .hdr::before{content:'';position:absolute;inset:0;background:${isDark?'rgba(0,0,0,.45)':'rgba(255,255,255,.15)'};}
    .hdr-inner{position:relative;z-index:1}
    .studio-logo{width:64px;height:64px;border-radius:16px;object-fit:cover;margin-bottom:10px;border:2px solid rgba(255,255,255,.3);box-shadow:0 4px 16px rgba(0,0,0,.3)}
    .studio-logo-fallback{width:64px;height:64px;border-radius:16px;background:rgba(255,255,255,.15);border:2px solid rgba(255,255,255,.3);display:flex;align-items:center;justify-content:center;font-size:26px;margin:0 auto 10px;box-shadow:0 4px 16px rgba(0,0,0,.2)}
    .studio-name{font-size:13px;font-weight:700;color:rgba(255,255,255,.9);letter-spacing:.5px;margin-bottom:10px}
    .proj-title{font-size:22px;font-weight:900;color:#fff;margin-bottom:5px;text-shadow:0 2px 8px rgba(0,0,0,.3)}
    .proj-meta{font-size:12px;color:rgba(255,255,255,.75)}
    .con{max-width:700px;margin:0 auto;padding:20px 16px}
    .card{background:var(--bg2);border-radius:16px;padding:20px;margin-bottom:16px;border:1px solid var(--border);box-shadow:0 2px 12px rgba(0,0,0,.06)}
    .ct{font-size:14px;font-weight:800;margin-bottom:14px;color:var(--text)}
    .pct-big{font-size:52px;font-weight:900;color:var(--accent);line-height:1;margin-bottom:4px}
    .pw{height:14px;background:var(--bg3);border-radius:7px;overflow:hidden;margin:12px 0}
    .pf{height:100%;background:linear-gradient(90deg,var(--accent),rgba(var(--accent-rgb),.6));border-radius:7px;transition:width .8s}
    .step-row{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)}
    .step-row:last-child{border:none}
    .sn{width:24px;height:24px;border-radius:50%;border:2px solid var(--border);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:10px;font-weight:700;color:var(--text3)}
    .sn.done{background:#4fd1a5;border-color:#4fd1a5;color:#fff}
    .sn.cur{background:var(--accent);border-color:var(--accent);color:#fff;animation:pulse 1.5s infinite}
    @keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(var(--accent-rgb),.5)}50%{box-shadow:0 0 0 8px rgba(var(--accent-rgb),0)}}
    .sl{font-size:13px;flex:1;color:var(--text)}
    .sl.done{text-decoration:line-through;color:var(--text3)}
    .sl.cur{color:var(--text);font-weight:700}
    .ig{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    .ic{background:var(--bg3);border-radius:10px;padding:12px 14px;border:1px solid var(--border)}
    .il{font-size:10px;color:var(--text3);font-weight:600;margin-bottom:4px}
    .iv{font-size:13px;font-weight:700;color:var(--text)}
    .social-link{display:inline-flex;align-items:center;gap:5px;padding:6px 12px;background:var(--bg3);border:1px solid var(--border);border-radius:20px;font-size:12px;font-weight:600;text-decoration:none;color:var(--accent);margin:3px}
    .social-link:hover{border-color:var(--accent)}
    .contact-row{display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--border);font-size:13px;color:var(--text2)}
    .contact-row:last-child{border:none}
    .ftr{text-align:center;padding:24px;font-size:11px;color:var(--text3);border-top:1px solid var(--border);margin-top:8px}
    @media(max-width:480px){.ig{grid-template-columns:1fr}.hdr{padding:24px 16px}.pct-big{font-size:38px}}
  </style></head><body>
  <div class="hdr">
    <div class="hdr-inner">
      ${logo
        ? `<img src="${logo}" class="studio-logo" alt="${studio}" onerror="this.style.display=\'none\'">`
        : `<div class="studio-logo-fallback"><i class="fa-solid fa-palette"></i></div>`}
      <div class="studio-name">${studio}</div>
      <div class="proj-title">${t.title}</div>
      <div class="proj-meta">${t.client?'<i class="fa-solid fa-user"></i> '+t.client+'  ·  ':''}<span style="color:${statusColor==='#f7c948'?'#ffe082':statusColor}">${status}</span></div>
    </div>
  </div>
  <div class="con">
    <div class="card" style="text-align:center">
      <div class="pct-big">${pct}%</div>
      <div style="font-size:13px;color:var(--text3);margin-bottom:4px">نسبة الإنجاز</div>
      <div class="pw"><div class="pf" style="width:${pct}%"></div></div>
      <div class="ig" style="margin-top:12px">
        ${t.orderDate?`<div class="ic"><div class="il"><i class="fa-solid fa-calendar-days"></i> تاريخ البدء</div><div class="iv">${t.orderDate}</div></div>`:''}
        ${t.deadline?`<div class="ic"><div class="il"><i class="fa-solid fa-alarm-clock"></i> موعد التسليم</div><div class="iv" style="color:${daysLeft!==null&&daysLeft<=3?'#f76f7c':daysLeft!==null&&daysLeft<=7?'#f7c948':'#4fd1a5'}">${t.deadline}${daysLeft!==null?' ('+daysLeft+' يوم)':''}</div></div>`:''}
      </div>
    </div>
    ${steps.length?`<div class="card"><div class="ct"><i class="fa-solid fa-folder-open"></i> مراحل التنفيذ — ${stepsDone}/${stepsTotal}</div>
      ${steps.map((s,i)=>{const dn=s.done,cr=!dn&&steps.slice(0,i).every(x=>x.done);return `<div class="step-row"><div class="sn ${dn?'done':cr?'cur':''}">${dn?'<i class="fa-solid fa-check"></i>':cr?'<i class="fa-solid fa-play"></i>':i+1}</div><span class="sl ${dn?'done':cr?'cur':''}">${s.text}</span><span style="font-size:10px;color:${dn?'#4fd1a5':cr?'var(--accent)':'var(--text3)'};font-weight:700">${dn?'مكتمل <i class="fa-solid fa-check"></i>':cr?'جاري الآن <i class="fa-solid fa-play"></i>':''}</span></div>`;}).join('')}
    </div>`:''}
    ${t.brief?`<div class="card"><div class="ct"><i class="fa-solid fa-file-lines"></i> وصف المشروع</div><p style="font-size:13px;color:var(--text2);line-height:1.9">${t.brief}</p></div>`:''}
    ${(phone||email||socials.length)?`<div class="card">
      <div class="ct"><i class="fa-solid fa-phone"></i> تواصل مع ${studio}</div>
      ${phone?`<div class="contact-row"><i class="fa-solid fa-mobile-screen"></i> <a href="https://wa.me/${phone.replace(/\D/g,'')}" style="color:var(--accent);text-decoration:none;font-weight:600">${phone}</a></div>`:''}
      ${email?`<div class="contact-row"><i class="fa-solid fa-envelope"></i>️ <a href="mailto:${email}" style="color:var(--accent);text-decoration:none;font-weight:600">${email}</a></div>`:''}
      ${socials.length?`<div style="margin-top:10px;display:flex;flex-wrap:wrap">
        ${socials.map(s=>`<a href="${s.url}" target="_blank" class="social-link">${_svgIcons[s.platform]||_svgIcons.other} ${({"instagram":"انستقرام","facebook":"فيسبوك","behance":"بيهانس","linkedin":"لينكدإن","tiktok":"تيك توك","youtube":"يوتيوب","twitter":"تويتر","whatsapp":"واتساب","website":"موقع"})[s.platform]||s.platform}</a>`).join('')}
      </div>`:''}
    </div>`:''}
    <div class="ftr">
      <div style="margin-bottom:4px;font-weight:600;color:var(--text2)">${studio}</div>
      <div>آخر تحديث: ${new Date().toLocaleDateString('ar-EG',{year:'numeric',month:'long',day:'numeric'})}</div>
    </div>
  </div>
  </body></html>`;
};

// ═══════════════════════════════════════════════════
// FIX: Use user avatar in tracking page logo
// ═══════════════════════════════════════════════════
(function(){
  const _origBuild = _buildTrackingPageHTML;
  _buildTrackingPageHTML = function(t){
    // Inject user avatar as logo if no studio logo
    const session = getSession();
    const userAvatar = session?.avatarUrl||'';
    if(!S.settings) S.settings={};
    // Temporarily set logo to user avatar if no studio logo
    const hadLogo = S.settings.logo;
    if(!hadLogo && userAvatar) S.settings._tempLogo = userAvatar;
    const html = _origBuild(t);
    // Replace _tempLogo references
    const finalHtml = hadLogo ? html : html.replace(
      /src="undefined"/g, `src="${userAvatar}"`
    );
    return finalHtml;
  };
  // Also patch the logo extraction inside _buildTrackingPageHTML directly
})();

// Override with avatar-aware version
const __buildHTML_orig = _buildTrackingPageHTML;
_buildTrackingPageHTML = function(t){
  const session = getSession();
  const userAvatar = session?.avatarUrl||'';
  const studioLogo = S.settings?.logo||userAvatar||'';

  const steps=t.steps||[];
  const stepsTotal=steps.length, stepsDone=steps.filter(s=>s.done).length;
  const pct=stepsTotal?Math.round(stepsDone/stepsTotal*100):(t.done?100:0);
  const studio   = S.settings?.name||session?.name||'Ordo';
  const phone    = S.settings?.phone||session?.phone||'';
  const email    = S.settings?.email||'';
  const socials  = S.settings?.socials||[];
  const accentColor = localStorage.getItem('studioAccentColor')||'#7c6ff7';
  const displayMode = localStorage.getItem('studioDisplayMode')||'dark';
  const isDark = displayMode==='dark';
  const bg=isDark?'#0f0f1a':'#f5f6fb', bg2=isDark?'#1a1a2e':'#ffffff', bg3=isDark?'#12122a':'#f0f0f8';
  const border=isDark?'rgba(255,255,255,.08)':'rgba(0,0,0,.08)';
  const text=isDark?'#e8e8f0':'#1a1a2e', text2=isDark?'#aaa':'#555', text3=isDark?'#666':'#999';
  const accentHex=accentColor;
  function hexToRgb(h){try{return `${parseInt(h.slice(1,3),16)},${parseInt(h.slice(3,5),16)},${parseInt(h.slice(5,7),16)}`;}catch(e){return '124,111,247';}}
  const accentRgb=accentHex.startsWith('#')?hexToRgb(accentHex):'124,111,247';
  const status={new:'جديد',progress:'قيد التنفيذ',review:'مراجعة',done:'مكتمل <i class="fa-solid fa-square-check" style="color:var(--accent3)"></i>'}[t.status]||t.status;
  const statusColor={new:text3,progress:'#f7c948',review:accentHex,done:'#4fd1a5'}[t.status]||text3;
  const daysLeft=t.deadline?Math.max(0,Math.ceil((new Date(t.deadline)-new Date())/(1000*60*60*24))):null;
  const _svgIcons={
    instagram:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><circle cx="17.5" cy="6.5" r=".5" fill="currentColor"/></svg>',
    facebook:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>',
    behance:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M3 5h7a4 4 0 0 1 0 8H3V5z"/><path d="M3 13h8a4 4 0 0 1 0 6H3v-6z"/><line x1="14" y1="7" x2="21" y2="7"/><path d="M14 12h7a3.5 3.5 0 0 0-7 0z"/></svg>',
    linkedin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>',
    tiktok:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>',
    youtube:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="2" y="6" width="20" height="14" rx="3"/><polygon points="10 9 16 13 10 17" fill="currentColor" stroke="none"/></svg>',
    twitter:'<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.259 5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
    whatsapp:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>',
    website:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
    other:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>'
  };

  return `<!DOCTYPE html><html dir="rtl" lang="ar"><head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>متابعة: ${t.title} — ${studio}</title>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap" rel="stylesheet">
  <style>
    :root{--accent:${accentHex};--accent-rgb:${accentRgb};--bg:${bg};--bg2:${bg2};--bg3:${bg3};--border:${border};--text:${text};--text2:${text2};--text3:${text3}}
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:Cairo,sans-serif;background:var(--bg);color:var(--text);direction:rtl;min-height:100vh}
    .hdr{background:linear-gradient(135deg,rgba(${accentRgb},.85),rgba(${accentRgb},.45));padding:28px 24px;text-align:center;position:relative;overflow:hidden;border-bottom:1px solid rgba(${accentRgb},.2)}
    .hdr::before{content:'';position:absolute;inset:0;background:${isDark?'rgba(0,0,0,.4)':'rgba(255,255,255,.1)'};}
    .hdr-inner{position:relative;z-index:1}
    .studio-logo{width:68px;height:68px;border-radius:50%;object-fit:cover;margin:0 auto 10px;display:block;border:3px solid rgba(255,255,255,.4);box-shadow:0 4px 20px rgba(0,0,0,.3)}
    .studio-logo-fallback{width:68px;height:68px;border-radius:50%;background:rgba(255,255,255,.2);border:3px solid rgba(255,255,255,.3);display:flex;align-items:center;justify-content:center;font-size:28px;margin:0 auto 10px;box-shadow:0 4px 20px rgba(0,0,0,.2)}
    .studio-name{font-size:12px;font-weight:700;color:rgba(255,255,255,.85);letter-spacing:.5px;margin-bottom:8px}
    .proj-title{font-size:22px;font-weight:900;color:#fff;margin-bottom:5px;text-shadow:0 2px 8px rgba(0,0,0,.3)}
    .proj-meta{font-size:12px;color:rgba(255,255,255,.7)}
    .con{max-width:680px;margin:0 auto;padding:20px 16px}
    .card{background:var(--bg2);border-radius:16px;padding:20px;margin-bottom:16px;border:1px solid var(--border)}
    .ct{font-size:14px;font-weight:800;margin-bottom:14px;color:var(--text)}
    .pct-big{font-size:52px;font-weight:900;color:var(--accent);line-height:1;margin-bottom:4px}
    .pw{height:14px;background:var(--bg3);border-radius:7px;overflow:hidden;margin:12px 0}
    .pf{height:100%;background:linear-gradient(90deg,rgba(${accentRgb},1),rgba(${accentRgb},.6));border-radius:7px;transition:width .8s}
    .step-row{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)}
    .step-row:last-child{border:none}
    .sn{width:24px;height:24px;border-radius:50%;border:2px solid var(--border);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:10px;font-weight:700;color:var(--text3)}
    .sn.done{background:#4fd1a5;border-color:#4fd1a5;color:#fff}
    .sn.cur{background:var(--accent);border-color:var(--accent);color:#fff;animation:pulse 1.5s infinite}
    @keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(${accentRgb},.5)}50%{box-shadow:0 0 0 8px rgba(${accentRgb},0)}}
    .sl{font-size:13px;flex:1;color:var(--text)}.sl.done{text-decoration:line-through;color:var(--text3)}.sl.cur{font-weight:700}
    .ig{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    .ic{background:var(--bg3);border-radius:10px;padding:12px 14px;border:1px solid var(--border)}
    .il{font-size:10px;color:var(--text3);font-weight:600;margin-bottom:4px}.iv{font-size:13px;font-weight:700;color:var(--text)}
    .social-link{display:inline-flex;align-items:center;gap:5px;padding:6px 12px;background:var(--bg3);border:1px solid var(--border);border-radius:20px;font-size:12px;font-weight:600;text-decoration:none;color:var(--accent);margin:3px}
    .ftr{text-align:center;padding:24px;font-size:11px;color:var(--text3);border-top:1px solid var(--border);margin-top:8px}
    @media(max-width:480px){.ig{grid-template-columns:1fr}.hdr{padding:24px 16px}.pct-big{font-size:38px}}
  </style></head><body>
  <div class="hdr">
    <div class="hdr-inner">
      ${studioLogo
        ? `<img src="${studioLogo}" class="studio-logo" alt="${studio}" onerror="this.style.display='none'">`
        : `<div class="studio-logo-fallback"><i class="fa-solid fa-palette"></i></div>`}
      <div class="studio-name">${studio}</div>
      <div class="proj-title">${t.title}</div>
      <div class="proj-meta">${t.client?'<i class="fa-solid fa-user"></i> '+t.client+'  ·  ':''}<span style="color:${statusColor==='#f7c948'?'#ffe082':statusColor}">${status}</span></div>
    </div>
  </div>
  <div class="con">
    <div class="card" style="text-align:center">
      <div class="pct-big">${pct}%</div>
      <div style="font-size:13px;color:var(--text3);margin-bottom:4px">نسبة الإنجاز</div>
      <div class="pw"><div class="pf" style="width:${pct}%"></div></div>
      <div class="ig" style="margin-top:12px">
        ${t.orderDate?`<div class="ic"><div class="il"><i class="fa-solid fa-calendar-days"></i> تاريخ البدء</div><div class="iv">${t.orderDate}</div></div>`:''}
        ${t.deadline?`<div class="ic"><div class="il"><i class="fa-solid fa-alarm-clock"></i> موعد التسليم</div><div class="iv" style="color:${daysLeft!==null&&daysLeft<=3?'#f76f7c':daysLeft!==null&&daysLeft<=7?'#f7c948':'#4fd1a5'}">${t.deadline}${daysLeft!==null?' ('+daysLeft+' يوم)':''}</div></div>`:''}
      </div>
    </div>
    ${steps.length?`<div class="card"><div class="ct"><i class="fa-solid fa-folder-open"></i> مراحل التنفيذ — ${stepsDone}/${stepsTotal}</div>
      ${steps.map((s,i)=>{const dn=s.done,cr=!dn&&steps.slice(0,i).every(x=>x.done);return `<div class="step-row"><div class="sn ${dn?'done':cr?'cur':''}">${dn?'<i class="fa-solid fa-check"></i>':cr?'<i class="fa-solid fa-play"></i>':i+1}</div><span class="sl ${dn?'done':cr?'cur':''}">${s.text}</span><span style="font-size:10px;color:${dn?'#4fd1a5':cr?'var(--accent)':'var(--text3)'};font-weight:700">${dn?'مكتمل <i class="fa-solid fa-check"></i>':cr?'جاري الآن <i class="fa-solid fa-play"></i>':''}</span></div>`;}).join('')}
    </div>`:''}
    ${t.brief?`<div class="card"><div class="ct"><i class="fa-solid fa-file-lines"></i> وصف المشروع</div><p style="font-size:13px;color:var(--text2);line-height:1.9">${t.brief}</p></div>`:''}
    ${(phone||email||socials.length)?`<div class="card">
      <div class="ct"><i class="fa-solid fa-phone"></i> تواصل مع ${studio}</div>
      ${phone?`<div style="padding:8px 0;border-bottom:1px solid var(--border);font-size:13px"><i class="fa-solid fa-mobile-screen"></i> <a href="https://wa.me/${phone.replace(/\D/g,'')}" style="color:var(--accent);text-decoration:none;font-weight:600">${phone}</a></div>`:''}
      ${email?`<div style="padding:8px 0;border-bottom:1px solid var(--border);font-size:13px"><i class="fa-solid fa-envelope"></i>️ <a href="mailto:${email}" style="color:var(--accent);text-decoration:none;font-weight:600">${email}</a></div>`:''}
      ${socials.length?`<div style="margin-top:10px;display:flex;flex-wrap:wrap">${socials.map(s=>`<a href="${s.url}" target="_blank" class="social-link">${_svgIcons[s.platform]||_svgIcons.other} ${({"instagram":"انستقرام","facebook":"فيسبوك","behance":"بيهانس","linkedin":"لينكدإن","tiktok":"تيك توك","youtube":"يوتيوب","twitter":"تويتر","whatsapp":"واتساب","website":"موقع"})[s.platform]||s.platform}</a>`).join('')}</div>`:''}
    </div>`:''}
    <div class="ftr">
      <div style="margin-bottom:4px;font-weight:600;color:var(--text2)">${studio}</div>
      <div>آخر تحديث: ${new Date().toLocaleDateString('ar-EG',{year:'numeric',month:'long',day:'numeric'})}</div>
    </div>
  </div></body></html>`;
};

// ═══════════════════════════════════════════════════
// CARD <i class="fa-solid fa-gear"></i> = RENAME CURRENT STATUS ONLY (mini inline)
// ═══════════════════════════════════════════════════
function openCardStatusRename(statusId, triggerEl){
  // Remove any existing
  document.querySelectorAll('._card-rename-pop').forEach(el=>el.remove());
  const defaultDefs={new:{label:'جديد'},progress:{label:'قيد التنفيذ'},review:{label:'مراجعة'},paused:{label:'موقوف'}};
  const def=defaultDefs[statusId];
  const custom=(S.customStatuses||[]).find(s=>s.id===statusId);
  const currentLabel=def?def.label:(custom?.label||statusId);
  const override=(S.statusOverrides||{})[statusId];
  const displayLabel=override?.label||currentLabel;

  const pop=document.createElement('div');
  pop.className='_card-rename-pop';
  pop.style.cssText='position:fixed;z-index:9998;background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:10px 12px;min-width:200px;box-shadow:0 8px 24px rgba(0,0,0,.4);animation:_spIn .15s ease';
  const rect=triggerEl.getBoundingClientRect();
  pop.style.top=(rect.bottom+4)+'px';
  pop.style.right=Math.max(8,window.innerWidth-rect.right)+'px';
  pop.innerHTML=`
    <div style="font-size:10px;color:var(--text3);margin-bottom:6px;font-weight:700">تعديل اسم هذه الحالة</div>
    <div style="display:flex;gap:6px">
      <input id="_crn-inp" class="form-input" value="${displayLabel}" style="flex:1;height:28px;font-size:12px;padding:0 8px">
      <button onclick="_cardRenameApply('${statusId}')" style="height:28px;padding:0 10px;background:var(--accent);color:#fff;border:none;border-radius:7px;font-size:11px;font-weight:700;cursor:pointer;font-family:var(--font)">حفظ</button>
    </div>`;
  document.body.appendChild(pop);
  document.getElementById('_crn-inp')?.focus();
  setTimeout(()=>{
    document.addEventListener('click',function _crOutside(e){
      if(!pop.contains(e.target)&&!triggerEl.contains(e.target)){pop.remove();document.removeEventListener('click',_crOutside);}
    });
  },100);
}

function _cardRenameApply(statusId){
  const label=document.getElementById('_crn-inp')?.value.trim();
  if(!label)return;
  if(!S.statusOverrides)S.statusOverrides={};
  const defaultIds=['new','progress','review','paused'];
  if(defaultIds.includes(statusId)){
    S.statusOverrides[statusId]={...(S.statusOverrides[statusId]||{}),label};
  } else {
    const idx=(S.customStatuses||[]).findIndex(s=>s.id===statusId);
    if(idx>-1)S.customStatuses[idx].label=label;
  }
  document.querySelectorAll('._card-rename-pop').forEach(el=>el.remove());
  lsSave();
  // Re-render without losing scroll position
  setTimeout(()=>{ renderAll(); buildDynamicStatusDropdowns(); renderTaskStatusesSettings(); },50);
  toast('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم تحديث اسم الحالة: '+label);
}

// ═══════════════════════════════════════════════════
// <i class="fa-solid fa-gear"></i> STATUS MANAGER MODAL (big button above kanban)
// ═══════════════════════════════════════════════════
function openStatusManagerModal(){
  let modal=document.getElementById('_modal-status-mgr');
  if(!modal){
    modal=document.createElement('div');
    modal.id='_modal-status-mgr';
    modal.className='modal-overlay';
    modal.innerHTML='<div class="modal" style="max-width:520px;max-height:85vh;overflow-y:auto" id="_modal-status-mgr-inner"></div>';
    document.body.appendChild(modal);
    modal.addEventListener('click',e=>{if(e.target===modal)closeM('_modal-status-mgr');});
  }
  _renderStatusMgrModal();
  openM('_modal-status-mgr');
}

function _renderStatusMgrModal(){
  const el=document.getElementById('_modal-status-mgr-inner');if(!el)return;
  const hidden=S.hiddenStatuses||[];
  const overrides=S.statusOverrides||{};
  const defaultStatuses=[
    {id:'new',    label:'جديد',       icon:'<i class="fa-solid fa-clipboard-list"></i>', color:'#5a5a80'},
    {id:'progress',label:'قيد التنفيذ',icon:'<i class="fa-solid fa-bolt"></i>', color:'#f7c948'},
    {id:'review', label:'مراجعة',     icon:'<i class="fa-solid fa-magnifying-glass"></i>', color:'#7c6ff7'},
    {id:'paused', label:'موقوف',      icon:'⏸', color:'#64b5f6'},
  ];
  const customStatuses=S.customStatuses||[];
  const allStatuses=[
    ...defaultStatuses.map(s=>({...s,isDefault:true,displayLabel:overrides[s.id]?.label||s.label})),
    ...customStatuses.map(s=>({...s,isDefault:false,displayLabel:s.label})),
  ];
  el.innerHTML=`
    <div class="modal-header">
      <div class="modal-title"><i class="fa-solid fa-gear"></i> إدارة حالات المهام</div>
      <button class="close-btn" onclick="closeM('_modal-status-mgr')"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div style="padding:20px">
      <div style="margin-bottom:16px">
        ${allStatuses.map((s,i)=>`
          <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--surface2);border-radius:10px;margin-bottom:8px;border:1px solid ${hidden.includes(s.id)?'rgba(247,111,124,.2)':'var(--border)'};opacity:${hidden.includes(s.id)?'.5':'1'}">
            <div style="width:10px;height:10px;border-radius:50%;background:${s.color||'#888'};flex-shrink:0"></div>
            <div style="flex:1;min-width:0">
              <input value="${s.displayLabel}" id="_smgr-lbl-${s.id}" class="form-input" style="height:28px;font-size:12px;padding:0 8px;width:100%" onchange="_smgrUpdateLabel('${s.id}',this.value)">
            </div>
            <input type="color" value="${s.color?.startsWith('var')?'#7c6ff7':s.color||'#888'}" id="_smgr-col-${s.id}" onchange="_smgrUpdateColor('${s.id}',this.value)" style="width:28px;height:28px;border:none;border-radius:6px;cursor:pointer;background:none;padding:0;flex-shrink:0" title="تغيير اللون">
            <button onclick="_smgrToggleHide('${s.id}')" style="background:none;border:1px solid var(--border);border-radius:7px;padding:4px 8px;cursor:pointer;font-size:11px;color:var(--text3)" title="${hidden.includes(s.id)?'إظهار':'إخفاء'}">${hidden.includes(s.id)?'<i class="fa-solid fa-eye"></i>':'<i class="fa-solid fa-eye-slash"></i>'}</button>
            ${!s.isDefault?`<button onclick="_smgrDelete('${s.id}')" style="background:rgba(247,111,124,.1);border:1px solid rgba(247,111,124,.3);border-radius:7px;padding:4px 8px;cursor:pointer;font-size:11px;color:var(--accent4)"><i class="fa-solid fa-trash"></i></button>`:'<div style="width:32px"></div>'}
          </div>`).join('')}
      </div>
      <div style="background:var(--surface2);border-radius:12px;padding:14px;border:1px solid var(--border)">
        <div style="font-size:11px;color:var(--text3);font-weight:700;margin-bottom:10px;text-transform:uppercase;letter-spacing:.4px">+ إضافة حالة جديدة</div>
        <div style="display:flex;gap:8px;align-items:center">
          <input id="_smgr-new-icon" class="form-input" placeholder="⭐" style="width:38px;text-align:center;font-size:22px;padding:0 4px;height:34px">
          <input id="_smgr-new-label" class="form-input" placeholder="اسم الحالة الجديدة" style="flex:1;height:34px">
          <input id="_smgr-new-color" type="color" value="#7c6ff7" style="width:34px;height:34px;border:none;border-radius:8px;cursor:pointer;padding:0;background:none;flex-shrink:0">
          <button onclick="_smgrAddNew()" class="btn btn-primary" style="height:34px;padding:0 14px;white-space:nowrap">+ إضافة</button>
        </div>
      </div>
      <div style="margin-top:14px;text-align:center">
        <button onclick="closeM('_modal-status-mgr');renderAll();" class="btn btn-primary"><i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> حفظ وتطبيق</button>
      </div>
    </div>`;
}

function _smgrUpdateLabel(id,val){
  const defaultIds=['new','progress','review','paused'];
  if(!S.statusOverrides)S.statusOverrides={};
  if(defaultIds.includes(id)){S.statusOverrides[id]={...(S.statusOverrides[id]||{}),label:val};}
  else{const idx=(S.customStatuses||[]).findIndex(s=>s.id===id);if(idx>-1)S.customStatuses[idx].label=val;}
  lsSave();
}
function _smgrUpdateColor(id,color){
  const defaultIds=['new','progress','review','paused'];
  if(!S.statusOverrides)S.statusOverrides={};
  if(defaultIds.includes(id)){S.statusOverrides[id]={...(S.statusOverrides[id]||{}),color};}
  else{const idx=(S.customStatuses||[]).findIndex(s=>s.id===id);if(idx>-1)S.customStatuses[idx].color=color;}
  lsSave();
}
function _smgrToggleHide(id){
  if(!S.hiddenStatuses)S.hiddenStatuses=[];
  if(S.hiddenStatuses.includes(id))S.hiddenStatuses=S.hiddenStatuses.filter(x=>x!==id);
  else S.hiddenStatuses.push(id);
  lsSave();_renderStatusMgrModal();
}
function _smgrDelete(id){
  const count=(S.tasks||[]).filter(t=>t.status===id).length;
  const msg=count>0?`هذه الحالة مستخدمة في ${count} مهمة. ستنتقل لحالة "جديد". هل تريد الحذف؟`:'هل تريد حذف هذه الحالة؟';
  // Use window.confirm as direct dialog to avoid modal blocking
  if(!window.confirm(msg)) return;
  if(count>0)(S.tasks||[]).forEach(t=>{if(t.status===id)t.status='new';});
  S.customStatuses=(S.customStatuses||[]).filter(s=>s.id!==id);
  lsSave(); cloudSave(S); _renderStatusMgrModal(); buildDynamicStatusDropdowns(); renderAll();
  if(typeof toast==='function') toast('<i class="fa-solid fa-trash"></i> تم حذف الحالة');
}
function _smgrAddNew(){
  const icon=document.getElementById('_smgr-new-icon')?.value.trim()||'';
  const label=document.getElementById('_smgr-new-label')?.value.trim();
  const color=document.getElementById('_smgr-new-color')?.value||'#7c6ff7';
  if(!label){toast('أدخل اسم الحالة');return;}
  if(!S.customStatuses)S.customStatuses=[];
  S.customStatuses.push({id:'custom_'+Date.now(),label,color,icon});
  lsSave(); cloudSave(S); _renderStatusMgrModal(); buildDynamicStatusDropdowns();
  toast('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تمت إضافة الحالة: '+(icon?icon+' ':'')+label);
  setTimeout(()=>{ renderTasks(); _renderCustomKanbanCols(); },80);
}

// Patch renderKanban/applyTaskFilters to also render custom status columns
window.addEventListener('load', function(){
  // Hook into renderAll to add custom kanban columns
  const _raOrig2 = renderAll;
  renderAll = function(){
    _raOrig2();
    _renderCustomKanbanCols();
  };
  setTimeout(_renderCustomKanbanCols, 600);
});

function _renderCustomKanbanCols(){
  const statusCols = document.getElementById('status-cols');
  if(!statusCols) return;
  const custom = S.customStatuses||[];
  const hidden = S.hiddenStatuses||[];
  const filtered = (S.tasks||[]).filter(t=>{
    const tf_status=document.getElementById('tf-status')?.value||'';
    const tf_priority=document.getElementById('tf-priority')?.value||'';
    const tf_client=document.getElementById('tf-client')?.value||'';
    if(tf_status && t.status!==tf_status) return false;
    if(tf_priority && t.priority!==tf_priority) return false;
    if(tf_client && t.client!==tf_client) return false;
    return !t.done;
  });

  custom.filter(cs=>!hidden.includes(cs.id)).forEach(cs=>{
    let col = document.getElementById('col-custom-'+cs.id);
    if(!col){
      // Create new column
      const wrapper = document.createElement('div');
      wrapper.className='kb-col';
      wrapper.id='kcol-'+cs.id;
      wrapper.style.cssText=`border:1px solid ${cs.color}44`;
      wrapper.innerHTML=`
        <div class="kb-col-header" style="background:${cs.color}18">
          <div style="font-size:12px;font-weight:700;color:${cs.color}">${cs.icon||''} ${cs.label}</div>
          <div style="display:flex;align-items:center;gap:4px">
            <span class="nav-badge" id="cnt-${cs.id}" style="display:none;background:${cs.color}">0</span>
            <button onclick="openStatusPopover('${cs.id}',this)" style="background:none;border:none;cursor:pointer;padding:2px 4px;color:${cs.color};opacity:.6;font-size:13px;border-radius:5px;line-height:1;transition:.15s" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='.6'"><i class="fa-solid fa-gear"></i></button>
          </div>
        </div>
        <div class="kb-col-body" id="col-custom-${cs.id}" data-status="${cs.id}"
          ondragover="kbDragOver(event)" ondragleave="kbDragLeave(event)" ondrop="kbDrop(event)"></div>`;
      statusCols.appendChild(wrapper);
      col = document.getElementById('col-custom-'+cs.id);
    }
    // Render tasks
    const tasks = filtered.filter(t=>t.status===cs.id);
    const cnt = document.getElementById('cnt-'+cs.id);
    if(cnt){cnt.textContent=tasks.length;cnt.style.display=tasks.length?'inline-block':'none';}
    const stMap={};stMap[cs.id]=cs.icon+' '+cs.label;
    const stColor={};stColor[cs.id]=cs.color;
    if(!tasks.length){col.innerHTML='<div style="font-size:11px;color:var(--text3);padding:8px;text-align:center">لا مهام</div>';return;}
    col.innerHTML=tasks.map(t=>{
      const sp=t.steps||[];const sd=sp.filter(s=>s.done).length;const pct=sp.length?Math.round(sd/sp.length*100):0;
      const prioColors={'high':'rgba(247,111,124,.2)','med':'rgba(247,201,72,.2)','low':'rgba(79,209,165,.2)'};
      const prioText={'high':'var(--accent4)','med':'var(--accent2)','low':'var(--accent3)'};
      const prioLabel={'high':'<i class="fa-solid fa-circle"></i> عاجل','med':'<i class="fa-solid fa-circle"></i> متوسط','low':'<i class="fa-solid fa-circle"></i> عادي'};
      return `<div class="kb-card" draggable="true" data-task-id="${t.id}" ondragstart="kbDragStart(event,${t.id})" onclick="openTaskDetail(${t.id})">
        <div style="font-size:12px;font-weight:700;margin-bottom:5px;line-height:1.4">${t.title}</div>
        <div style="display:flex;gap:5px;flex-wrap:wrap;align-items:center;margin-bottom:${sp.length?'6px':'0'}">
          ${t.client?`<span style="font-size:10px;color:var(--text3);background:rgba(255,255,255,.05);padding:1px 6px;border-radius:8px">${t.client}</span>`:''}
          ${t.priority?`<span style="font-size:10px;background:${prioColors[t.priority]||'rgba(0,0,0,.2)'};color:${prioText[t.priority]||'var(--text3)'};padding:1px 6px;border-radius:8px">${prioLabel[t.priority]||''}</span>`:''}
          ${t.value?`<span style="font-size:10px;color:var(--accent3);font-weight:700;margin-right:auto">${t.value.toLocaleString()} ج</span>`:''}
        </div>
        ${sp.length?`<div style="display:flex;align-items:center;gap:5px;margin-top:2px">
          <div style="flex:1;height:3px;background:var(--surface3);border-radius:2px;overflow:hidden">
            <div style="height:100%;width:${pct}%;background:${pct===100?'var(--accent3)':cs.color};border-radius:2px;transition:width .3s"></div>
          </div><span style="font-size:10px;color:var(--text3)">${sd}/${sp.length}</span></div>`:''}
        <div style="font-size:10px;margin-top:5px;display:flex;justify-content:space-between;align-items:center">
          <button onclick="event.stopPropagation();openCardStatusRename('${cs.id}',this)" style="background:rgba(255,255,255,.06);border:none;border-radius:6px;color:var(--text3);font-size:11px;padding:2px 7px;cursor:pointer" title="تعديل الحالة"><i class="fa-solid fa-gear"></i></button>
          <button onclick="event.stopPropagation();kbShowMoveMenu(event,${t.id})" style="background:${cs.color}22;border:none;border-radius:6px;color:${cs.color};font-size:10px;padding:2px 7px;cursor:pointer;font-weight:700">نقل ▾</button>
        </div>
      </div>`;
    }).join('');
  });
  // Remove cols for deleted custom statuses
  document.querySelectorAll('[id^="kcol-"]').forEach(el=>{
    const cid=el.id.replace('kcol-','');
    if(!custom.find(c=>c.id===cid)||hidden.includes(cid)) el.remove();
  });
  // Update grid
  const count=statusCols.children.length;
  statusCols.style.gridTemplateColumns=`repeat(${Math.min(count,4)},1fr)`;
}

// ═══════════════════════════════════════════════════
// TEAM ASSIGNMENTS — show tasks for linked user
// ═══════════════════════════════════════════════════
window.addEventListener('load', function(){
  setTimeout(function(){
    const session = getSession();
    if(!session) return;
    const myName = session.name||'';
    const myEmail = session.email||'';
    // Find tasks assigned to me as workerMember
    const myTasks = (S.tasks||[]).filter(t=>
      t.workerType==='team' &&
      t.workerMember &&
      (t.workerMember===myName || t.workerMember===myEmail) &&
      !t.done
    );
    if(!myTasks.length) return;
    // Show a banner on dashboard and tasks page
    _renderTeamTasksBanner(myTasks, myName);
  }, 1500);
});

function _renderTeamTasksBanner(myTasks, myName){
  // Update the dash-team-tasks widget inside _dash-grid (new system)
  const dashTeam = document.getElementById('dash-team-tasks');
  if(dashTeam){
    const header = dashTeam.closest('.card')?.querySelector('.section-title');
    if(header) header.innerHTML='<i class="fa-solid fa-users"></i> مهامك كعضو فريق (' + myTasks.length + ')';
    dashTeam.innerHTML = myTasks.slice(0,3).map(t=>
      `<div onclick="openTaskDetail(${t.id})" style="display:flex;align-items:center;gap:10px;padding:9px 10px;background:var(--surface2);border-radius:10px;margin-bottom:6px;cursor:pointer;border:1px solid rgba(100,181,246,.15)">
        <div style="width:8px;height:8px;border-radius:50%;background:#64b5f6;flex-shrink:0"></div>
        <div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:700">${t.title}</div>
        <div style="font-size:11px;color:var(--text3)">${t.client||''} ${t.deadline?'· '+t.deadline:''}</div></div>
        <span style="font-size:10px;padding:2px 8px;border-radius:10px;background:rgba(100,181,246,.15);color:#64b5f6;font-weight:700">${t.workerAmount?t.workerAmount.toLocaleString()+' '+_getCurrency():''}</span>
      </div>`).join('')+
      (myTasks.length>3?`<div style="font-size:11px;color:var(--text3);text-align:center;margin-top:4px">+ ${myTasks.length-3} مهام أخرى</div>`:'')
    ;
  }
  // Also add section in tasks page
  const tasksPage = document.getElementById('page-tasks');
  if(tasksPage && !document.getElementById('_my-team-tasks-section')){
    const el=document.createElement('div');
    el.id='_my-team-tasks-section';
    el.className='card';
    el.style.cssText='margin-bottom:16px;border-color:rgba(100,181,246,.3)';
    el.innerHTML=`
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div class="section-title" style="margin:0;color:#64b5f6"><i class="fa-solid fa-users"></i> مهامك كعضو فريق</div>
        <span style="font-size:11px;color:var(--text3)">${myName}</span>
      </div>
      ${myTasks.map(t=>`
        <div onclick="openTaskDetail(${t.id})" style="display:flex;align-items:center;gap:10px;padding:9px 12px;background:var(--surface2);border-radius:10px;margin-bottom:6px;cursor:pointer;border:1px solid rgba(100,181,246,.15);transition:.15s" onmouseover="this.style.borderColor='#64b5f6'" onmouseout="this.style.borderColor='rgba(100,181,246,.15)'">
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:700">${t.title}</div>
            <div style="font-size:11px;color:var(--text3);margin-top:2px">
              ${t.client?'<i class="fa-solid fa-user"></i> '+t.client:''}
              ${t.deadline?'  ·  <i class="fa-solid fa-alarm-clock"></i> '+t.deadline:''}
              ${t.workerAmount?'  ·  <i class="fa-solid fa-coins"></i> '+t.workerAmount.toLocaleString()+' ج':''}
            </div>
          </div>
          <span style="font-size:10px;padding:2px 8px;border-radius:20px;background:rgba(100,181,246,.12);color:#64b5f6;font-weight:700;white-space:nowrap">
            ${({new:'جديد',progress:'جاري',review:'مراجعة'}[t.status])||'جاري'}
          </span>
        </div>`).join('')}`;
    const activeView = document.getElementById('tasks-active-view');
    if(activeView) activeView.insertBefore(el, activeView.firstChild);
  }
}
// ═══════════════════════════════════════════════════

// Override openFreelancerGoalModal with full-featured version
openFreelancerGoalModal = function(type){
  type = type||'financial';
  const fg = S.freelancerGoals||{};
  const now = new Date();
  let inner = '';

  if(type==='financial'){
    const d = fg.financial||{};
    inner = `
      <div class="form-group"><label class="form-label"><i class="fa-solid fa-coins"></i> اسم الهدف</label><input class="form-input" id="fgf-name" value="${d.name||'هدف الدخل الشهري'}" placeholder="مثال: هدف مارس المالي"></div>
      <div class="form-group"><label class="form-label">المبلغ المستهدف (ج)</label><input class="form-input" id="fgf-target" type="number" value="${d.target||''}" placeholder="5000"></div>
      <div class="form-group"><label class="form-label"><i class="fa-solid fa-pen-to-square"></i> وصف الهدف</label><textarea class="form-input" id="fgf-desc" style="height:70px;resize:none" placeholder="لماذا تريد تحقيق هذا الهدف؟">${d.desc||''}</textarea></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div class="form-group"><label class="form-label">الشهر</label><select class="form-select" id="fgf-month">
          ${Array.from({length:12},(_,i)=>`<option value="${i+1}" ${(d.month||now.getMonth()+1)===i+1?'selected':''}>${new Date(2024,i).toLocaleString('ar-EG',{month:'long'})}</option>`).join('')}
        </select></div>
        <div class="form-group"><label class="form-label">السنة</label><input class="form-input" id="fgf-year" type="number" value="${d.year||now.getFullYear()}"></div>
      </div>
      <div class="form-group"><label class="form-label"><i class="fa-solid fa-bolt"></i> مستويات الوصول</label>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:4px">
          <div style="background:var(--surface3);border-radius:10px;padding:10px;text-align:center">
            <div style="font-size:10px;color:var(--text3)">مبتدئ</div>
            <input class="form-input" id="fgf-lvl1" type="number" value="${d.lvl1||Math.round((d.target||5000)*.25)}" style="text-align:center;padding:4px;margin-top:4px;font-size:12px">
            <div style="font-size:9px;color:var(--accent2);margin-top:2px">25%</div>
          </div>
          <div style="background:var(--surface3);border-radius:10px;padding:10px;text-align:center">
            <div style="font-size:10px;color:var(--text3)">متوسط</div>
            <input class="form-input" id="fgf-lvl2" type="number" value="${d.lvl2||Math.round((d.target||5000)*.5)}" style="text-align:center;padding:4px;margin-top:4px;font-size:12px">
            <div style="font-size:9px;color:var(--accent);margin-top:2px">50%</div>
          </div>
          <div style="background:var(--surface3);border-radius:10px;padding:10px;text-align:center">
            <div style="font-size:10px;color:var(--text3)">ممتاز</div>
            <input class="form-input" id="fgf-lvl3" type="number" value="${d.lvl3||Math.round((d.target||5000)*.75)}" style="text-align:center;padding:4px;margin-top:4px;font-size:12px">
            <div style="font-size:9px;color:var(--accent3);margin-top:2px">75%</div>
          </div>
        </div>
      </div>
      <button class="btn btn-primary" style="width:100%" onclick="saveFgGoal('financial')"><i class="fa-solid fa-floppy-disk"></i> حفظ الهدف المالي</button>`;

  } else if(type==='tasks'){
    const d = fg.tasks||{};
    const m=now.getMonth()+1; const ms=m<10?'0':'';
    const lastDay=new Date(now.getFullYear(),m,0).getDate();
    inner = `
      <div class="form-group"><label class="form-label"><i class="fa-solid fa-clipboard-list"></i> اسم الهدف</label><input class="form-input" id="fgt-name" value="${d.name||'هدف الأوردرات'}" placeholder="مثال: 10 أوردرات هذا الشهر"></div>
      <div class="form-group"><label class="form-label">عدد الأوردرات المستهدفة</label><input class="form-input" id="fgt-target" type="number" value="${d.target||''}" placeholder="10"></div>
      <div class="form-group"><label class="form-label"><i class="fa-solid fa-pen-to-square"></i> وصف الهدف</label><textarea class="form-input" id="fgt-desc" style="height:60px;resize:none" placeholder="تفاصيل الهدف...">${d.desc||''}</textarea></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div class="form-group"><label class="form-label">من</label><input class="form-input" id="fgt-start" type="date" value="${d.startDate||now.getFullYear()+'-'+ms+m+'-01'}"></div>
        <div class="form-group"><label class="form-label">إلى</label><input class="form-input" id="fgt-end" type="date" value="${d.endDate||now.getFullYear()+'-'+ms+m+'-'+lastDay}"></div>
      </div>
      <div class="form-group"><label class="form-label"><i class="fa-solid fa-bolt"></i> مستويات الوصول</label>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:4px">
          <div style="background:var(--surface3);border-radius:10px;padding:10px;text-align:center">
            <div style="font-size:10px;color:var(--text3)">حد أدنى</div>
            <input class="form-input" id="fgt-min" type="number" value="${d.min||Math.round((d.target||10)*.3)}" style="text-align:center;padding:4px;margin-top:4px;font-size:12px">
            <div style="font-size:9px;color:var(--accent4);margin-top:2px">30%</div>
          </div>
          <div style="background:var(--surface3);border-radius:10px;padding:10px;text-align:center">
            <div style="font-size:10px;color:var(--text3)">جيد</div>
            <input class="form-input" id="fgt-good" type="number" value="${d.good||Math.round((d.target||10)*.6)}" style="text-align:center;padding:4px;margin-top:4px;font-size:12px">
            <div style="font-size:9px;color:var(--accent2);margin-top:2px">60%</div>
          </div>
          <div style="background:var(--surface3);border-radius:10px;padding:10px;text-align:center">
            <div style="font-size:10px;color:var(--text3)">ممتاز</div>
            <input class="form-input" id="fgt-great" type="number" value="${d.great||d.target||10}" style="text-align:center;padding:4px;margin-top:4px;font-size:12px">
            <div style="font-size:9px;color:var(--accent3);margin-top:2px">100%</div>
          </div>
        </div>
      </div>
      <button class="btn btn-primary" style="width:100%" onclick="saveFgGoal('tasks')"><i class="fa-solid fa-floppy-disk"></i> حفظ هدف الأوردرات</button>`;

  } else if(type==='custom'){
    // Custom goal with steps
    const id = type._editId || null;
    const existing = id ? (S.freelancerGoals.custom||[]).find(g=>g.id===id) : null;
    inner = `
      <input type="hidden" id="fgc-id" value="${existing?.id||''}">
      <div class="form-group"><label class="form-label"><i class="fa-solid fa-bullseye"></i> اسم الهدف</label><input class="form-input" id="fgc-name" value="${existing?.name||''}" placeholder="مثال: تعلم Motion Design"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div class="form-group"><label class="form-label">نوع الهدف</label><select class="form-select" id="fgc-type">
          <option value="skill" ${existing?.gtype==='skill'?'selected':''}><i class="fa-solid fa-lightbulb"></i> مهارة</option>
          <option value="financial" ${existing?.gtype==='financial'?'selected':''}><i class="fa-solid fa-coins"></i> مالي</option>
          <option value="project" ${existing?.gtype==='project'?'selected':''}><i class="fa-solid fa-folder"></i> مشروع</option>
          <option value="personal" ${existing?.gtype==='personal'?'selected':''}><i class="fa-solid fa-star"></i> شخصي</option>
          <option value="health" ${existing?.gtype==='health'?'selected':''}><i class="fa-solid fa-dumbbell"></i> صحة</option>
        </select></div>
        <div class="form-group"><label class="form-label">مدة الهدف (أيام)</label><input class="form-input" id="fgc-days" type="number" value="${existing?.days||30}" placeholder="30"></div>
      </div>
      <div class="form-group"><label class="form-label"><i class="fa-solid fa-pen-to-square"></i> وصف الهدف</label><textarea class="form-input" id="fgc-desc" style="height:70px;resize:none" placeholder="اشرح الهدف بالتفصيل...">${existing?.desc||''}</textarea></div>
      <div class="form-group"><label class="form-label">📏 الحد الأدنى للنجاح</label><input class="form-input" id="fgc-min" value="${existing?.minReq||''}" placeholder="مثال: إنهاء 3 كورسات على الأقل"></div>
      <div class="form-group">
        <label class="form-label"><i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> خطوات الهدف</label>
        <div id="fgc-steps-list" style="margin-bottom:8px">
          ${(existing?.steps||[]).map((s,i)=>`<div style="display:flex;gap:6px;margin-bottom:6px">
            <input class="form-input" value="${s.text||''}" placeholder="خطوة ${i+1}" style="flex:1">
            <button onclick="this.parentNode.remove()" style="padding:6px 10px;background:rgba(247,111,124,.1);border:1px solid rgba(247,111,124,.3);color:var(--accent4);border-radius:8px;cursor:pointer"><i class="fa-solid fa-xmark"></i></button>
          </div>`).join('')}
        </div>
        <button onclick="fgcAddStep()" class="btn btn-ghost btn-sm">+ خطوة</button>
      </div>
      <button class="btn btn-primary" style="width:100%" onclick="saveFgGoal('custom')"><i class="fa-solid fa-floppy-disk"></i> حفظ الهدف</button>`;
  }

  const titles = {financial:'<i class="fa-solid fa-coins"></i> الهدف المالي', tasks:'<i class="fa-solid fa-clipboard-list"></i> هدف الأوردرات', custom:'<i class="fa-solid fa-bullseye"></i> هدف مخصص', learning:'<i class="fa-solid fa-diamond"></i> هدف تعليمي'};
  let modal = document.getElementById('_modal-fg');
  if(!modal){
    modal = document.createElement('div');
    modal.id = '_modal-fg';
    modal.className = 'modal-overlay';
    modal.innerHTML = '<div class="modal" style="max-width:480px;max-height:85vh;overflow-y:auto" id="_modal-fg-inner"></div>';
    document.body.appendChild(modal);
    modal.addEventListener('click',e=>{if(e.target===modal)closeM('_modal-fg');});
  }
  document.getElementById('_modal-fg-inner').innerHTML = `
    <div class="modal-header">
      <div class="modal-title">${titles[type]||'هدف جديد'}</div>
      <button class="close-btn" onclick="closeM('_modal-fg')"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div style="padding:20px">${inner}</div>`;
  openM('_modal-fg');
};

function fgcAddStep(){
  const list = document.getElementById('fgc-steps-list');
  if(!list) return;
  const div = document.createElement('div');
  div.style.cssText = 'display:flex;gap:6px;margin-bottom:6px';
  const n = list.children.length+1;
  div.innerHTML = `<input class="form-input" placeholder="خطوة ${n}" style="flex:1"><button onclick="this.parentNode.remove()" style="padding:6px 10px;background:rgba(247,111,124,.1);border:1px solid rgba(247,111,124,.3);color:var(--accent4);border-radius:8px;cursor:pointer"><i class="fa-solid fa-xmark"></i></button>`;
  list.appendChild(div);
}

// Override saveFgGoal with extended version
saveFgGoal = function(type){
  if(!S.freelancerGoals) S.freelancerGoals={};
  if(type==='financial'){
    const name   = document.getElementById('fgf-name')?.value||'هدف مالي';
    const target = +document.getElementById('fgf-target')?.value;
    const month  = +document.getElementById('fgf-month')?.value;
    const year   = +document.getElementById('fgf-year')?.value;
    const desc   = document.getElementById('fgf-desc')?.value||'';
    const lvl1   = +document.getElementById('fgf-lvl1')?.value||0;
    const lvl2   = +document.getElementById('fgf-lvl2')?.value||0;
    const lvl3   = +document.getElementById('fgf-lvl3')?.value||0;
    if(!target||!month||!year){toast('أدخل جميع البيانات');return;}
    S.freelancerGoals.financial = {name,target,month,year,desc,lvl1,lvl2,lvl3};
  } else if(type==='tasks'){
    const name      = document.getElementById('fgt-name')?.value||'هدف أوردرات';
    const target    = +document.getElementById('fgt-target')?.value;
    const startDate = document.getElementById('fgt-start')?.value;
    const endDate   = document.getElementById('fgt-end')?.value;
    const desc      = document.getElementById('fgt-desc')?.value||'';
    const min       = +document.getElementById('fgt-min')?.value||0;
    const good      = +document.getElementById('fgt-good')?.value||0;
    const great     = +document.getElementById('fgt-great')?.value||target||0;
    if(!target||!startDate||!endDate){toast('أدخل جميع البيانات');return;}
    S.freelancerGoals.tasks = {name,target,startDate,endDate,desc,min,good,great};
  } else if(type==='custom'){
    const name  = document.getElementById('fgc-name')?.value||'';
    const gtype = document.getElementById('fgc-type')?.value||'skill';
    const days  = +document.getElementById('fgc-days')?.value||30;
    const desc  = document.getElementById('fgc-desc')?.value||'';
    const minReq= document.getElementById('fgc-min')?.value||'';
    const stepsEls = document.querySelectorAll('#fgc-steps-list input');
    const steps = [...stepsEls].map(el=>({text:el.value.trim(),done:false})).filter(s=>s.text);
    if(!name){toast('أدخل اسم الهدف');return;}
    if(!S.freelancerGoals.custom) S.freelancerGoals.custom=[];
    const eid = document.getElementById('fgc-id')?.value;
    if(eid){
      const idx = S.freelancerGoals.custom.findIndex(g=>g.id==+eid);
      if(idx>-1) S.freelancerGoals.custom[idx] = {...S.freelancerGoals.custom[idx],name,gtype,days,desc,minReq,steps};
    } else {
      S.freelancerGoals.custom.push({id:Date.now(),name,gtype,days,desc,minReq,steps,startDate:new Date().toISOString().split('T')[0],progress:0,done:false});
    }
  }
  lsSave(); cloudSave(S); closeM('_modal-fg');
  renderDashWidgets(); renderFgBanner();
  const activePanel = document.querySelector('[id^="fg-panel-"]:not([style*="none"])');
  if(activePanel){
    if(activePanel.id==='fg-panel-financial') renderFgFinancial();
    else if(activePanel.id==='fg-panel-tasks') renderFgTasks();
    else renderFgLearning();
  }
  checkGoalMilestones();
  toast('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم حفظ الهدف');
};

// Override renderFgFinancial with milestone levels
renderFgFinancial = function(){
  const el = document.getElementById('fg-panel-financial'); if(!el) return;
  const fg = S.freelancerGoals||{};
  if(!fg.financial){
    el.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <div class="section-title" style="margin:0"><i class="fa-solid fa-coins"></i> الهدف المالي</div>
      <button onclick="openFreelancerGoalModal('financial')" class="btn btn-primary">+ تحديد الهدف</button>
    </div>
    <div class="card" style="text-align:center;padding:40px"><div class="empty-icon"><i class="fa-solid fa-coins"></i></div><div>حدد هدفك المالي الشهري وتابع تقدمك</div></div>`;
    return;
  }
  const {name,target,month,year,desc,lvl1,lvl2,lvl3}=fg.financial;
  const ms=year+'-'+(month<10?'0':'')+month;
  const incomes=(S.transactions||[]).filter(t=>t.type==='income'&&(t.isoDate||'').startsWith(ms));
  const actual=incomes.reduce((s,t)=>s+(+t.amount||0),0);
  const pct=Math.min(100,Math.round(actual/(target||1)*100));
  const remaining=Math.max(0,target-actual);
  // Determine level
  let levelLabel='', levelColor='var(--accent)';
  if(actual>=target){levelLabel='<i class="fa-solid fa-trophy"></i> الهدف الكامل';levelColor='var(--accent3)';}
  else if(lvl3&&actual>=lvl3){levelLabel='<i class="fa-solid fa-star"></i> مستوى ممتاز';levelColor='var(--accent3)';}
  else if(lvl2&&actual>=lvl2){levelLabel='<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> مستوى متوسط';levelColor='var(--accent2)';}
  else if(lvl1&&actual>=lvl1){levelLabel='<i class="fa-solid fa-chart-line"></i> مستوى مبتدئ';levelColor='var(--accent)';}
  else{levelLabel='<i class="fa-solid fa-rocket"></i> ابدأ الآن';levelColor='var(--text3)';}

  const days=new Date(year,month,0).getDate();
  const byDay={};
  incomes.forEach(t=>{const d=+(t.isoDate||'').split('-')[2];byDay[d]=(byDay[d]||0)+(+t.amount||0);});
  let cum=0;const bars=[];const today=new Date().getDate();
  for(let d=1;d<=days;d++){cum+=(byDay[d]||0);bars.push({d,cum,has:!!byDay[d]});}
  const maxV=Math.max(target,cum,1);

  el.innerHTML=`
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
      <div class="section-title" style="margin:0"><i class="fa-solid fa-coins"></i> ${name||'الهدف المالي'}</div>
      <button onclick="openFreelancerGoalModal('financial')" class="btn btn-ghost btn-sm"><i class="fa-solid fa-pen"></i> تعديل</button>
    </div>
    <div class="card" style="padding:22px;margin-bottom:14px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px">
        <div>
          <div style="font-size:12px;color:var(--text3);margin-bottom:2px">${new Date(year,month-1).toLocaleString('ar-EG',{month:'long',year:'numeric'})}</div>
          <div style="font-size:36px;font-weight:900;color:${levelColor}">${pct}%</div>
          <div style="font-size:13px;color:var(--text2)">${actual.toLocaleString()} من ${target.toLocaleString()} ج</div>
          ${desc?`<div style="font-size:12px;color:var(--text3);margin-top:4px;font-style:italic">${desc}</div>`:''}
        </div>
        <div style="text-align:center;background:rgba(124,111,247,.08);border-radius:12px;padding:12px 16px">
          <div style="font-size:11px;color:var(--text3)">المستوى الحالي</div>
          <div style="font-size:13px;font-weight:800;color:${levelColor};margin-top:4px">${levelLabel}</div>
          ${remaining>0?`<div style="font-size:11px;color:var(--text3);margin-top:4px">باقي ${remaining.toLocaleString()} ج</div>`:''}
        </div>
      </div>
      <div style="position:relative;background:var(--surface3);border-radius:20px;height:14px;overflow:visible;margin-bottom:14px">
        <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,${levelColor},${levelColor}99);border-radius:20px;transition:.7s;position:relative"></div>
        ${lvl1?`<div style="position:absolute;top:-4px;left:${Math.min(100,Math.round(lvl1/target*100))}%;width:2px;height:22px;background:var(--accent2);border-radius:1px" title="${lvl1.toLocaleString()} ج"></div>`:''}
        ${lvl2?`<div style="position:absolute;top:-4px;left:${Math.min(100,Math.round(lvl2/target*100))}%;width:2px;height:22px;background:var(--accent);border-radius:1px" title="${lvl2.toLocaleString()} ج"></div>`:''}
        ${lvl3?`<div style="position:absolute;top:-4px;left:${Math.min(100,Math.round(lvl3/target*100))}%;width:2px;height:22px;background:var(--accent3);border-radius:1px" title="${lvl3.toLocaleString()} ج"></div>`:''}
      </div>
      <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text3)">
        ${lvl1?`<span style="color:var(--accent2)"><i class="fa-solid fa-chart-line"></i> ${lvl1.toLocaleString()}</span>`:'<span></span>'}
        ${lvl2?`<span style="color:var(--accent)"><i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> ${lvl2.toLocaleString()}</span>`:'<span></span>'}
        ${lvl3?`<span style="color:var(--accent3)"><i class="fa-solid fa-star"></i> ${lvl3.toLocaleString()}</span>`:'<span></span>'}
        <span style="color:${levelColor}"><i class="fa-solid fa-trophy"></i> ${target.toLocaleString()} ج</span>
      </div>
    </div>
    <div class="card" style="padding:18px">
      <div class="section-title" style="margin-bottom:12px"><i class="fa-solid fa-chart-line"></i> مسار الدخل اليومي</div>
      <div style="display:flex;align-items:flex-end;gap:2px;height:80px">
        ${bars.map(b=>`<div style="flex:1;display:flex;flex-direction:column;align-items:center" title="${b.d}: ${b.cum.toLocaleString()} ج">
          <div style="width:100%;background:${b.d<=today?(b.has?levelColor:'var(--surface3)'):'var(--border)'};border-radius:2px 2px 0 0;height:${Math.round(b.cum/maxV*74)}px;min-height:2px"></div>
          ${b.d%7===0||b.d===1?`<div style="font-size:7px;color:var(--text3);margin-top:2px">${b.d}</div>`:''}
        </div>`).join('')}
      </div>
    </div>
    <div style="text-align:center;margin-top:14px">
      <button onclick="openFreelancerGoalModal('financial')" class="btn btn-ghost btn-sm"><i class="fa-solid fa-pen"></i> تعديل الهدف</button>
      <button onclick="delete S.freelancerGoals.financial;lsSave();renderFgFinancial();renderDashWidgets();" class="btn btn-ghost btn-sm" style="color:var(--accent4)"><i class="fa-solid fa-trash"></i> حذف</button>
    </div>`;
};

// Override renderFgLearning to include custom goals
renderFgLearning = function(){
  const el = document.getElementById('fg-panel-learning'); if(!el) return;
  const goals = S.goals||[];
  const custom = (S.freelancerGoals?.custom)||[];
  const active = goals.filter(g=>!g.done&&(g.progress||0)<100);
  const done = goals.filter(g=>g.done||(g.progress||0)===100);
  const gTypeIcon = {skill:'<i class="fa-solid fa-lightbulb"></i>',financial:'<i class="fa-solid fa-coins"></i>',project:'<i class="fa-solid fa-folder"></i>',personal:'<i class="fa-solid fa-star"></i>',health:'<i class="fa-solid fa-dumbbell"></i>'};

  el.innerHTML=`
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
      <div class="section-title" style="margin:0"><i class="fa-solid fa-bullseye"></i> الأهداف التعليمية والمخصصة</div>
      <div style="display:flex;gap:6px">
        <button onclick="openFreelancerGoalModal('custom')" class="btn btn-ghost btn-sm">+ هدف مخصص</button>
        <button onclick="openGoalModal()" class="btn btn-primary btn-sm">+ هدف تعليمي</button>
      </div>
    </div>
    ${custom.length?`<div style="margin-bottom:20px">
      <div style="font-size:12px;color:var(--text3);font-weight:700;margin-bottom:10px;text-transform:uppercase;letter-spacing:.5px">الأهداف المخصصة</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:12px">
        ${custom.map(g=>{
          const done2=g.steps?g.steps.filter(s=>s.done).length:0;
          const total2=g.steps?.length||0;
          const pct2=total2?Math.round(done2/total2*100):(g.done?100:g.progress||0);
          const daysPassed=g.startDate?Math.floor((Date.now()-new Date(g.startDate).getTime())/(1000*60*60*24)):0;
          const daysLeft=Math.max(0,(g.days||30)-daysPassed);
          return `<div class="card" style="padding:16px;border-color:rgba(124,111,247,.2)">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
              <div>
                <div style="font-size:13px;font-weight:700">${gTypeIcon[g.gtype]||'<i class="fa-solid fa-bullseye"></i>'} ${g.name||''}</div>
                ${g.desc?`<div style="font-size:11px;color:var(--text3);margin-top:2px">${g.desc}</div>`:''}
                ${g.minReq?`<div style="font-size:11px;color:var(--accent2);margin-top:2px">الحد الأدنى: ${g.minReq}</div>`:''}
              </div>
              <div style="text-align:center">
                <div style="font-size:18px;font-weight:900;color:${pct2>=100?'var(--accent3)':'var(--accent)'}">${pct2}%</div>
                <div style="font-size:9px;color:var(--text3)">${daysLeft}د متبقية</div>
              </div>
            </div>
            <div style="background:var(--surface3);border-radius:20px;height:6px;overflow:hidden;margin-bottom:10px">
              <div style="height:100%;width:${pct2}%;background:var(--accent);border-radius:20px;transition:.4s"></div>
            </div>
            ${total2?`<div style="margin-bottom:8px">
              ${g.steps.map((s,i)=>`<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--border);cursor:pointer" onclick="toggleFgCustomStep(${g.id},${i})">
                <div style="width:18px;height:18px;border-radius:50%;border:2px solid ${s.done?'var(--accent3)':'var(--border)'};background:${s.done?'var(--accent3)':'transparent'};display:flex;align-items:center;justify-content:center;flex-shrink:0">
                  ${s.done?'<span style=\"font-size:10px;color:#fff\"><i class="fa-solid fa-check"></i></span>':''}
                </div>
                <span style="font-size:12px;${s.done?'text-decoration:line-through;color:var(--text3)':''}">${s.text}</span>
              </div>`).join('')}
            </div>`:''}
            <div style="display:flex;gap:6px">
              <button onclick="editFgCustomGoal(${g.id})" class="btn btn-ghost btn-sm" style="flex:1"><i class="fa-solid fa-pen"></i> تعديل</button>
              <button onclick="deleteFgCustomGoal(${g.id})" class="btn btn-ghost btn-sm" style="color:var(--accent4)"><i class="fa-solid fa-trash"></i></button>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>`:''}
    <div style="font-size:12px;color:var(--text3);font-weight:700;margin-bottom:10px;text-transform:uppercase;letter-spacing:.5px">الأهداف التعليمية (${goals.length})</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px">
      ${active.map(g=>`<div class="card" style="padding:16px">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px">
          <div style="font-size:13px;font-weight:700">${g.title||''}</div>
          <span style="font-size:10px;padding:2px 8px;border-radius:20px;background:rgba(124,111,247,.15);color:var(--accent)">${g.cat||''}</span>
        </div>
        ${g.deadline?`<div style="font-size:11px;color:var(--accent4);margin-bottom:6px"><i class="fa-solid fa-alarm-clock"></i> ${g.deadline}</div>`:''}
        <div style="background:var(--surface3);border-radius:20px;height:6px;overflow:hidden;margin-bottom:6px">
          <div style="height:100%;width:${g.progress||0}%;background:var(--accent);border-radius:20px"></div>
        </div>
        <div style="font-size:11px;color:var(--text3);margin-bottom:10px">${g.progress||0}%</div>
        <div style="display:flex;gap:6px">
          <button onclick="openGoalModal(${g.id})" class="btn btn-ghost btn-sm" style="flex:1"><i class="fa-solid fa-pen"></i> تعديل</button>
          <button onclick="markGoalDoneNow(${g.id})" class="btn btn-ghost btn-sm" style="color:var(--accent3)"><i class="fa-solid fa-square-check" style="color:var(--accent3)"></i></button>
        </div>
      </div>`).join('')}
    </div>
    ${done.length?`<div style="margin-top:16px"><div class="section-title" style="color:var(--accent3)"><i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> مكتملة (${done.length})</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:10px;margin-top:10px">
      ${done.map(g=>`<div class="card" style="padding:12px;opacity:.65"><div style="font-size:13px;font-weight:700;text-decoration:line-through">${g.title||''}</div></div>`).join('')}
    </div>`:''}
    ${!goals.length&&!custom.length?`<div class="empty card"><div class="empty-icon"><i class="fa-solid fa-diamond"></i></div><div>أضف أهدافك التعليمية والمخصصة</div></div>`:''}`;
};

function toggleFgCustomStep(goalId, stepIdx){
  const cg = (S.freelancerGoals?.custom||[]).find(g=>g.id===goalId);
  if(!cg||!cg.steps) return;
  cg.steps[stepIdx].done = !cg.steps[stepIdx].done;
  const allDone = cg.steps.every(s=>s.done);
  if(allDone && !cg.done){
    cg.done = true;
    celebrateCompletion('<i class="fa-solid fa-bullseye"></i> أكملت هدف: '+cg.name);
  }
  lsSave(); cloudSave(S);
  renderFgLearning(); renderDashWidgets();
}

function editFgCustomGoal(id){
  const t = 'custom'; t._editId = id;
  openFreelancerGoalModal('custom');
  // Pre-fill id after modal opens
  setTimeout(()=>{ const el=document.getElementById('fgc-id'); if(el)el.value=id; }, 50);
}

function deleteFgCustomGoal(id){
  if(!confirm('حذف هذا الهدف؟')) return;
  S.freelancerGoals.custom = (S.freelancerGoals.custom||[]).filter(g=>g.id!==id);
  lsSave(); cloudSave(S); renderFgLearning(); renderDashWidgets();
  toast('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم الحذف');
}

