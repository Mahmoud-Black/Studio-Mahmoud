// ═══════════════════════════════════════════════════
// TASK TIME SUMMARY IN DETAIL MODAL
// ═══════════════════════════════════════════════════
window.addEventListener('load', function(){
  const _origOpenTaskDetail = openTaskDetail;
  openTaskDetail = function(id){
    _origOpenTaskDetail(id);
    // After modal is built, inject time summary
    setTimeout(()=>{
      const t = S.tasks.find(x=>x.id===id);
      if(!t) return;
      const body = document.getElementById('td-body');
      if(!body) return;
      // Calculate time from timeLogs
      const logs = t.timeLogs||[];
      const ttEntrs = (S.timeEntries||[]).filter(e=>(e.task_title||'').toLowerCase()===(t.title||'').toLowerCase());
      const totalSecs = logs.reduce((s,l)=>s+(+l.seconds||0),0) +
                        ttEntrs.reduce((s,e)=>s+(+e.duration_seconds||0),0);
      if(!totalSecs && !t.orderDate && !t.deadline) return;
      // Build time block
      let timeHtml = '';
      if(totalSecs){
        const h=Math.floor(totalSecs/3600);
        const m=Math.floor((totalSecs%3600)/60);
        const earn = ((totalSecs/3600)*(_ttRate||150)).toFixed(0);
        const logsByDate={};
        logs.forEach(l=>{logsByDate[l.date]=(logsByDate[l.date]||0)+(+l.seconds||0);});
        ttEntrs.forEach(e=>{
          const d=(e.started_at||'').split('T')[0];
          if(d) logsByDate[d]=(logsByDate[d]||0)+(+e.duration_seconds||0);
        });
        const logRows = Object.entries(logsByDate).sort((a,b)=>b[0].localeCompare(a[0])).slice(0,5).map(([date,secs])=>{
          const hh=Math.floor(secs/3600), mm=Math.floor((secs%3600)/60);
          return `<div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;padding:5px 0;border-bottom:1px solid var(--border)">
            <span style="color:var(--text3)">${date}</span>
            <div style="display:flex;align-items:center;gap:8px">
              <span style="font-family:var(--mono);font-weight:700;color:var(--accent3)">${hh}h ${mm}m</span>
              <button onclick="event.stopPropagation();editTimeLog(${t.id},'${date}')" style="background:rgba(124,111,247,.12);border:none;border-radius:6px;color:var(--accent);font-size:10px;padding:2px 7px;cursor:pointer;font-weight:700"><i class="fa-solid fa-pen"></i></button>
              <button onclick="event.stopPropagation();deleteTimeLog(${t.id},'${date}')" style="background:rgba(247,111,124,.1);border:none;border-radius:6px;color:var(--accent4);font-size:10px;padding:2px 7px;cursor:pointer;font-weight:700"><i class="fa-solid fa-trash"></i></button>
            </div>
          </div>`;
        }).join('');
        timeHtml = `<div style="margin:14px 0;padding:14px;background:var(--surface2);border-radius:var(--r2);border:1px solid var(--border)">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
            <div style="font-size:13px;font-weight:700"><i class="fa-solid fa-stopwatch"></i> وقت التنفيذ</div>
            <div style="display:flex;align-items:center;gap:6px">
              <div style="font-size:11px;padding:3px 10px;background:rgba(79,209,165,.12);color:var(--accent3);border-radius:20px;font-weight:700">${h}h ${m}m</div>
              <button onclick="addManualTimeLog(${t.id})" style="background:rgba(124,111,247,.12);border:none;border-radius:8px;color:var(--accent);font-size:10px;padding:3px 8px;cursor:pointer;font-weight:700" title="إضافة وقت يدوي">+ وقت</button>
              <button onclick="clearAllTimeLogs(${t.id})" style="background:rgba(247,111,124,.08);border:none;border-radius:8px;color:var(--accent4);font-size:10px;padding:3px 8px;cursor:pointer;font-weight:700" title="مسح كل السجلات">مسح الكل</button>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">
            <div style="text-align:center;background:var(--surface3);border-radius:10px;padding:10px">
              <div style="font-size:22px;font-weight:900;color:var(--accent3);font-family:var(--mono)">${h}h ${m}m</div>
              <div style="font-size:10px;color:var(--text3)">إجمالي الوقت</div>
            </div>
            <div style="text-align:center;background:var(--surface3);border-radius:10px;padding:10px">
              <div style="font-size:22px;font-weight:900;color:var(--accent2);font-family:var(--mono)">${Number(earn).toLocaleString()} ج</div>
              <div style="font-size:10px;color:var(--text3)">القيمة بالمعدل</div>
            </div>
          </div>
          ${logRows?`<div style="font-size:11px;color:var(--text3);font-weight:700;margin-bottom:6px">آخر الجلسات</div>${logRows}`:''}
          <button onclick="showPage('timetracker')" class="btn btn-ghost btn-sm" style="margin-top:8px;width:100%"><i class="fa-solid fa-stopwatch"></i> تتبع وقت إضافي</button>
        </div>`;
      }
      // Project duration block
      let durationHtml = '';
      if(t.orderDate||t.deadline){
        const start = t.orderDate ? new Date(t.orderDate) : null;
        const end   = t.deadline  ? new Date(t.deadline)  : null;
        const now2  = new Date();
        let daysTotal='', daysPassed='', daysLeft='';
        if(start&&end){
          daysTotal = Math.ceil((end-start)/(1000*60*60*24));
          daysPassed = Math.ceil((Math.min(now2,end)-start)/(1000*60*60*24));
          daysLeft  = Math.max(0,Math.ceil((end-now2)/(1000*60*60*24)));
        }
        durationHtml = `<div style="margin:14px 0;padding:14px;background:var(--surface2);border-radius:var(--r2);border:1px solid var(--border)">
          <div style="font-size:13px;font-weight:700;margin-bottom:10px"><i class="fa-solid fa-calendar-days"></i> مدة تنفيذ المشروع</div>
          <div style="display:grid;grid-template-columns:${start&&end?'1fr 1fr 1fr':'1fr 1fr'};gap:8px;margin-bottom:10px">
            ${start?`<div style="text-align:center;background:var(--surface3);border-radius:8px;padding:8px">
              <div style="font-size:11px;color:var(--text3)">تاريخ البدء</div>
              <div style="font-size:12px;font-weight:700;font-family:var(--mono);margin-top:2px">${t.orderDate}</div>
            </div>`:''}
            ${end?`<div style="text-align:center;background:var(--surface3);border-radius:8px;padding:8px">
              <div style="font-size:11px;color:var(--text3)">تاريخ التسليم</div>
              <div style="font-size:12px;font-weight:700;font-family:var(--mono);color:var(--accent4);margin-top:2px">${t.deadline}</div>
            </div>`:''}
            ${daysLeft!==''?`<div style="text-align:center;background:${daysLeft<=3?'rgba(247,111,124,.1)':daysLeft<=7?'rgba(247,201,72,.1)':'var(--surface3)'};border-radius:8px;padding:8px">
              <div style="font-size:11px;color:var(--text3)">الأيام المتبقية</div>
              <div style="font-size:18px;font-weight:900;color:${daysLeft<=3?'var(--accent4)':daysLeft<=7?'var(--accent2)':'var(--accent3)'};margin-top:2px">${daysLeft}d</div>
            </div>`:''}
          </div>
          ${daysTotal?`<div style="background:var(--surface3);border-radius:20px;height:8px;overflow:hidden;margin-bottom:4px">
            <div style="height:100%;width:${Math.min(100,Math.round(daysPassed/daysTotal*100))}%;background:var(--accent);border-radius:20px;transition:.5s"></div>
          </div>
          <div style="font-size:11px;color:var(--text3);text-align:center">${Math.round(daysPassed/daysTotal*100)}% من المدة مضت</div>`:''}
        </div>`;
      }
      // Inject before the buttons row
      if(timeHtml||durationHtml){
        const btnRow = body.querySelector('[style*="border-top"]');
        if(btnRow){
          btnRow.insertAdjacentHTML('beforebegin', durationHtml+timeHtml);
        }
      }
    }, 100);
  };
});

// ═══════════════════════════════════════════════════
// TASK TRACKING LINK (per-task client portal)
// ═══════════════════════════════════════════════════
window.addEventListener('load', function(){
  // Add "رابط المتابعة" button to task detail modal
  const _origOTD = openTaskDetail;
  // Already patched above, so we inject button via the existing patch
});

function openTaskTrackingLink(taskId){
  const t = S.tasks.find(x=>x.id===taskId);
  if(!t) return;
  _showTrackingShareModal(t);
}

function _buildTrackingPageHTML(t){
  const steps=t.steps||[];
  const stepsTotal=steps.length, stepsDone=steps.filter(s=>s.done).length;
  const pct=stepsTotal?Math.round(stepsDone/stepsTotal*100):(t.done?100:0);
  const studio=S.settings?.name||'Ordo';
  const studioPhone=S.settings?.phone||'';
  const status={new:'جديد',progress:'قيد التنفيذ',review:'مراجعة',done:'مكتمل <i class="fa-solid fa-square-check" style="color:var(--accent3)"></i>'}[t.status]||t.status;
  const statusColor={new:'#5a5a80',progress:'#f7c948',review:'#7c6ff7',done:'#4fd1a5'}[t.status]||'#888';
  const daysLeft=t.deadline?Math.max(0,Math.ceil((new Date(t.deadline)-new Date())/(1000*60*60*24))):null;
  return `<!DOCTYPE html><html dir="rtl" lang="ar"><head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>متابعة: ${t.title} — ${studio}</title>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap" rel="stylesheet">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:Cairo,sans-serif;background:#0f0f1a;color:#e8e8f0;direction:rtl;min-height:100vh}
    .hdr{background:linear-gradient(135deg,#1a1a2e,#2a1a3e);padding:32px 24px;text-align:center;border-bottom:1px solid rgba(124,111,247,.2)}
    .badge{display:inline-block;background:rgba(124,111,247,.15);border:1px solid rgba(124,111,247,.3);padding:4px 14px;border-radius:20px;font-size:11px;color:#7c6ff7;font-weight:700;margin-bottom:12px}
    .hdr h1{font-size:24px;font-weight:900;margin-bottom:6px}
    .hdr .sub{font-size:12px;color:#888}
    .con{max-width:700px;margin:0 auto;padding:20px 16px}
    .card{background:#1a1a2e;border-radius:16px;padding:20px;margin-bottom:16px;border:1px solid rgba(255,255,255,.07)}
    .ct{font-size:14px;font-weight:800;margin-bottom:14px}
    .pct-big{font-size:52px;font-weight:900;color:#7c6ff7;line-height:1;margin-bottom:4px}
    .pw{height:14px;background:#2a2a3e;border-radius:7px;overflow:hidden;margin:12px 0}
    .pf{height:100%;background:linear-gradient(90deg,#7c6ff7,#4fd1a5);border-radius:7px;transition:width .8s}
    .step-row{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.05)}
    .step-row:last-child{border:none}
    .sn{width:24px;height:24px;border-radius:50%;border:2px solid #444;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:10px;font-weight:700;color:#888}
    .sn.done{background:#4fd1a5;border-color:#4fd1a5;color:#fff}
    .sn.cur{background:#7c6ff7;border-color:#7c6ff7;color:#fff;animation:pulse 1.5s infinite}
    @keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(124,111,247,.5)}50%{box-shadow:0 0 0 8px rgba(124,111,247,0)}}
    .sl{font-size:13px;flex:1}
    .sl.done{text-decoration:line-through;color:#555}
    .sl.cur{color:#e8e8f0;font-weight:700}
    .ig{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    .ic{background:#12122a;border-radius:10px;padding:12px 14px;border:1px solid rgba(255,255,255,.05)}
    .il{font-size:10px;color:#666;font-weight:600;margin-bottom:4px}
    .iv{font-size:13px;font-weight:700}
    .ftr{text-align:center;padding:24px;font-size:11px;color:#555;border-top:1px solid rgba(255,255,255,.05);margin-top:8px}
    @media(max-width:480px){.ig{grid-template-columns:1fr}.hdr{padding:24px 16px}.pct-big{font-size:40px}}
  </style></head><body>
  <div class="hdr">
    <div class="badge">${studio}</div>
    <h1>${t.title}</h1>
    <div class="sub">${t.client?'<i class="fa-solid fa-user"></i> '+t.client+'  ·  ':''}<span style="color:${statusColor}">${status}</span></div>
  </div>
  <div class="con">
    <div class="card" style="text-align:center">
      <div class="pct-big">${pct}%</div>
      <div style="font-size:13px;color:#888;margin-bottom:4px">نسبة الإنجاز</div>
      <div class="pw"><div class="pf" style="width:${pct}%"></div></div>
      <div class="ig" style="margin-top:12px">
        ${t.orderDate?`<div class="ic"><div class="il"><i class="fa-solid fa-calendar-days"></i> تاريخ البدء</div><div class="iv">${t.orderDate}</div></div>`:''}
        ${t.deadline?`<div class="ic"><div class="il"><i class="fa-solid fa-alarm-clock"></i> موعد التسليم</div><div class="iv" style="color:${daysLeft!==null&&daysLeft<=3?'#f76f7c':daysLeft!==null&&daysLeft<=7?'#f7c948':'#4fd1a5'}">${t.deadline}${daysLeft!==null?' ('+daysLeft+'د)':''}</div></div>`:''}
      </div>
    </div>
    ${steps.length?`<div class="card"><div class="ct"><i class="fa-solid fa-folder-open"></i> مراحل التنفيذ — ${stepsDone}/${stepsTotal}</div>
      ${steps.map((s,i)=>{const dn=s.done,cr=!dn&&steps.slice(0,i).every(x=>x.done);return `<div class="step-row"><div class="sn ${dn?'done':cr?'cur':''}">${dn?'<i class="fa-solid fa-check"></i>':cr?'<i class="fa-solid fa-play"></i>':i+1}</div><span class="sl ${dn?'done':cr?'cur':''}">${s.text}</span><span style="font-size:10px;color:${dn?'#4fd1a5':cr?'#7c6ff7':'#555'};font-weight:700">${dn?'مكتمل':cr?'جاري <i class="fa-solid fa-play"></i>':''}</span></div>`;}).join('')}
    </div>`:''}
    ${t.brief?`<div class="card"><div class="ct"><i class="fa-solid fa-file-lines"></i> وصف المشروع</div><p style="font-size:13px;color:#aaa;line-height:1.9">${t.brief}</p></div>`:''}
    <div class="ftr">
      <div style="margin-bottom:8px">${studio} · آخر تحديث: ${new Date().toLocaleDateString('ar-EG',{year:'numeric',month:'long',day:'numeric'})}</div>
      ${studioPhone?`<a href="https://wa.me/${studioPhone.replace(/\D/g,'')}" style="color:#25D366;text-decoration:none;font-size:12px"><i class="fa-solid fa-phone"></i> تواصل مع ${studio}</a>`:''}
    </div>
  </div></body></html>`;
}

function _showTrackingShareModal(t){
  const studio=S.settings?.name||'Ordo';
  const clientName=t.client||'عزيزي العميل';
  const taskTitle=t.title||'المشروع';

  // ── رابط دائم حقيقي يفتح client-portal.html ──
  const cl=(S.clients||[]).find(c=>(c.name||'').toLowerCase()===(t.client||'').toLowerCase());
  const clientPhone=cl?.phone||'';
  const clientId=cl?.id||'';
  // بناء base path لـ client-portal.html في نفس المجلد
  var _bpArr=window.location.pathname.split('/').filter(function(x){return x!=='';});
  if(_bpArr.length&&['dashboard','tasks','projects','schedule','meetings','clients','finance','invoices','services','support','team','timetracker','goals','settings','reports'].indexOf(_bpArr[_bpArr.length-1])>=0)_bpArr.pop();
  if(_bpArr.length&&_bpArr[_bpArr.length-1].endsWith('.html'))_bpArr.pop();
  const _basePath=(_bpArr.length?'/'+_bpArr.join('/')+'/' :'/');
  const portalBase=window.location.origin+_basePath+'client-portal.html';
  const trackUrl=portalBase
    +'?uid='+encodeURIComponent(_supaUserId||'')
    +(clientId?'&cid='+encodeURIComponent(clientId):'')
    +(cl?.name?'&name='+encodeURIComponent(cl.name):'')
    +(clientPhone?'&phone='+encodeURIComponent(clientPhone):'')
    +'&taskid='+encodeURIComponent(t.id);

  const waText='مرحباً '+clientName+' 👋\n\nنفيدك بأن مشروعك "'+taskTitle+'" لدى '+studio+' قيد التنفيذ.\n\nيمكنك متابعة التقدم ومراحل التنفيذ في أي وقت من الرابط:\n\n'+trackUrl+'\n\nللاستفسار لا تتردد في التواصل معنا 🙏\n'+studio;
  const waUrl=clientPhone?'https://wa.me/'+clientPhone.replace(/\D/g,'')+'?text='+encodeURIComponent(waText):'https://wa.me/?text='+encodeURIComponent(waText);

  let modal=document.getElementById('_modal-tracking');
  if(!modal){
    modal=document.createElement('div');
    modal.id='_modal-tracking';
    modal.className='modal-overlay';
    modal.innerHTML='<div class="modal" style="max-width:500px" id="_modal-tracking-inner"></div>';
    document.body.appendChild(modal);
    modal.addEventListener('click',e=>{if(e.target===modal)closeM('_modal-tracking');});
  }
  const esc=s=>String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  document.getElementById('_modal-tracking-inner').innerHTML=`
    <div class="modal-header">
      <div class="modal-title"><i class="fa-solid fa-link"></i> مشاركة رابط المتابعة</div>
      <button class="close-btn" onclick="closeM('_modal-tracking')"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div style="padding:20px">
      <div style="background:var(--surface2);border-radius:12px;padding:14px;margin-bottom:16px;border:1px solid var(--border)">
        <div style="font-size:14px;font-weight:800">${esc(taskTitle)}</div>
        ${t.client?`<div style="font-size:12px;color:var(--accent);margin-top:4px"><i class="fa-solid fa-user"></i> ${esc(t.client)}</div>`:''}
      </div>
      <div class="form-group">
        <label class="form-label"><i class="fa-solid fa-link"></i> رابط صفحة المتابعة</label>
        <div style="display:flex;gap:8px">
          <input id="_trk-url" class="form-input" value="${esc(trackUrl)}" readonly style="flex:1;font-size:11px;direction:ltr">
          <button onclick="navigator.clipboard.writeText(document.getElementById('_trk-url').value);toast('<i class=\'fa-solid fa-square-check\' style=\'color:var(--accent3)\'></i> تم نسخ الرابط')" class="btn btn-ghost btn-sm"><i class="fa-solid fa-copy" style="margin-left:5px"></i> نسخ</button>
        </div>
        <div style="font-size:11px;color:var(--accent3);margin-top:5px;font-weight:700"><i class="fa-solid fa-square-check"></i> رابط دائم — يعمل على أي جهاز في أي وقت</div>
      </div>
      <div class="form-group">
        <label class="form-label"><i class="fa-solid fa-pen-to-square"></i> رسالة واتساب الجاهزة</label>
        <textarea class="form-input" id="_trk-wa" style="height:120px;font-size:12px;line-height:1.7;resize:none">${esc(waText)}</textarea>
      </div>
      <div style="display:flex;gap:10px">
        <button onclick="window.open('${esc(trackUrl)}','_blank')" class="btn btn-ghost" style="flex:1"><i class="fa-solid fa-eye"></i> معاينة</button>
        <a href="${esc(waUrl)}" target="_blank" style="flex:2;background:#25D366;color:#fff;border:none;border-radius:8px;padding:10px 16px;font-weight:700;text-decoration:none;text-align:center;display:flex;align-items:center;justify-content:center;gap:6px;font-family:var(--font);font-size:13px">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
          إرسال واتساب
        </a>
      </div>
    </div>`;
  openM('_modal-tracking');
}

// Add tracking button to task detail — runs once
(function(){
  const _hook=function(){
    const _orig=openTaskDetail;
    openTaskDetail=function(id){
      _orig(id);
      setTimeout(()=>{
        const body=document.getElementById('td-body');if(!body)return;
        const btnRow=body.querySelector('[style*="border-top"]');
        if(btnRow&&!btnRow.querySelector('[data-tracking-btn]')){
          const btn=document.createElement('button');
          btn.setAttribute('data-tracking-btn','1');
          btn.className='btn btn-ghost btn-sm';
          btn.style.cssText='color:var(--accent3)';
          btn.innerHTML='<i class="fa-solid fa-link"></i> رابط المتابعة';
          btn.onclick=()=>openTaskTrackingLink(id);
          btnRow.insertBefore(btn,btnRow.firstChild);
        }
      },180);
    };
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',_hook);
  else _hook();
})();

</script>
