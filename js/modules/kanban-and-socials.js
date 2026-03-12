      <style>@keyframes _chPop{from{transform:scale(.6);opacity:0}to{transform:scale(1);opacity:1}}</style>
      <div style="font-size:64px;margin-bottom:8px">${ch.emoji||'🏆'}</div>
      <div style="font-size:22px;font-weight:900;margin-bottom:8px;color:var(--accent2)">تحدي مكتمل!</div>
      <div style="font-size:15px;font-weight:700;margin-bottom:6px">${ch.title}</div>
      <div style="font-size:13px;color:var(--text3);margin-bottom:20px;line-height:1.6">${reward}</div>
      <div style="display:flex;align-items:center;justify-content:center;gap:8px;font-size:13px;color:var(--accent3);font-weight:700;margin-bottom:20px">
        <i class="fa-solid fa-circle-check"></i> ${ch.progress} / ${ch.target} ${ch.unit||''}
      </div>
      <button onclick="document.getElementById('_ch-done-modal').remove()" style="background:var(--accent);color:#fff;border:none;border-radius:14px;padding:13px 32px;font-family:Cairo,Tajawal,sans-serif;font-size:15px;font-weight:800;cursor:pointer;width:100%">
        رائع! متابعة 🎯
      </button>
    </div>`;
  document.body.appendChild(m);
  m.onclick = e => { if(e.target===m) m.remove(); };
  // confetti
  setTimeout(_fireChallengeConfetti, 150);
}

function _updateWeeklyChallengeProgress(){
  const ch=_getWeeklyChallenge(); if(ch.done) return;
  const weekKey=_getWeekKey();
  const weekStart=new Date(weekKey);
  let progress=0;
  if(ch.type==='complete'){
    progress=S.tasks.filter(t=>t.done&&t.doneAt&&new Date(t.doneAt)>=weekStart).length;
  } else if(ch.type==='income'){
    progress=S.transactions.filter(t=>t.type==='income'&&new Date(t.isoDate||t.date||0)>=weekStart).reduce((s,t)=>s+t.amount,0);
  } else if(ch.type==='on_time'){
    progress=S.tasks.filter(t=>t.done&&t.doneAt&&t.deadline&&t.doneAt.slice(0,10)<=t.deadline&&new Date(t.doneAt)>=weekStart).length;
  } else if(ch.type==='invoice'){
    progress=(S.invoices||[]).filter(inv=>new Date(inv.isoDate||inv.date||0)>=weekStart).length;
  } else if(ch.type==='client'){
    progress=(S.clients||[]).filter(cl=>new Date(cl.createdAt||0)>=weekStart).length;
  }
  const done=progress>=ch.target;
  const wasDone = ch.done;

  if(ch.isAdmin){
    // حفظ التقدم محلياً لتحدي الأدمن
    const saved = { done, progress };
    localStorage.setItem(ch._localKey, JSON.stringify(saved));
  } else {
    ch.progress=progress; ch.done=done;
    localStorage.setItem('_weekChallenge',JSON.stringify(ch));
  }

  if(done && !wasDone){
    // احتفال + modal
    setTimeout(()=>{ _showChallengeDoneModal(ch); },400);
  }
}

function renderWeeklyChallengeWidget(){
  const el=document.getElementById('dash-challenge-inner');if(!el)return;
  _updateWeeklyChallengeProgress();
  const ch=_getWeeklyChallenge();
  const pct=Math.min(100,Math.round((ch.progress/ch.target)*100));
  const isAdmin = ch.isAdmin ? `<span style="font-size:9px;padding:1px 6px;border-radius:8px;background:rgba(247,201,72,.15);color:var(--accent2);font-weight:700;margin-right:4px"><i class="fa-solid fa-star"></i> من الأدمن</span>` : '';
  el.innerHTML=`
    <div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:8px">
      <div style="font-size:22px">${ch.done?'<i class="fa-solid fa-trophy" style="color:var(--accent2)"></i>':'<i class="fa-solid fa-bullseye"></i>'}</div>
      <div style="flex:1">
        <div style="font-size:12px;font-weight:700;line-height:1.5">${ch.title}</div>
        <div style="font-size:10px;color:var(--text3);margin-top:2px">${isAdmin}تحدي هذا الأسبوع · ${ch.done?'<span style="color:var(--accent3)"><i class="fa-solid fa-square-check"></i> مكتمل! 🎉</span>':'جارٍ'}</div>
      </div>
    </div>
    <div style="height:7px;background:var(--surface2);border-radius:8px;overflow:hidden;margin-bottom:5px">
      <div style="height:100%;width:${pct}%;background:${ch.done?'linear-gradient(90deg,var(--accent3),#38b99a)':'linear-gradient(90deg,var(--accent),#a89cff)'};border-radius:8px;transition:width .6s cubic-bezier(.34,1.56,.64,1)"></div>
    </div>
    <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text3)">
      <span>${ch.progress} / ${ch.target} ${ch.unit||''}</span>
      <span>${pct}%</span>
    </div>`;
}

// ────────────────────────────────
// RENDER ALL NEW WIDGETS
// ────────────────────────────────
function renderNewWidgets(){
  renderCommitmentWidget();
  renderMomentumWidget();
  renderExpectedWidget();
  renderUpcomingWidget();
  renderWeeklyChallengeWidget();
  _renderSilentClientsWidget();
}

function _renderSilentClientsWidget(){
  const el=document.getElementById('dash-silent-clients');if(!el)return;
  const alerts=_checkSilentClients().slice(0,4);
  if(!alerts.length){el.innerHTML='<div style="font-size:11px;color:var(--text3)"><i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> كل عملائك في تواصل منتظم</div>';return;}
  el.innerHTML=alerts.map(({client:c,days})=>`
    <div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid rgba(42,42,58,.2)">
      <div style="font-size:12px;font-weight:600;cursor:pointer;color:var(--text)" onclick="openClientProfile(${c.id})">${c.name}</div>
      <div style="display:flex;align-items:center;gap:6px">
        <span style="font-size:10px;color:var(--accent4)">منذ ${days} يوم</span>
        ${c.phone?`<a href="https://wa.me/${(c.phone||'').replace(/\D/g,'')}" target="_blank" style="font-size:10px;color:var(--accent3);text-decoration:none"><i class="fa-solid fa-comments"></i></a>`:''}
      </div>
    </div>`).join('');
}

// Patch renderDashAlerts to include new widgets
(function(){
  const _orig=window.renderDashAlerts;
  window.renderDashAlerts=function(){
    _orig();
    renderNewWidgets();
  };
})();

// ────────────────────────────────
// <i class="fa-solid fa-dna"></i> DNA DISPLAY IN CLIENT PROFILE OVERVIEW
// ────────────────────────────────
const _dnaStyleMap={easy:'😊 سهل ومريح',detail:'<i class="fa-solid fa-magnifying-glass"></i> يهتم بالتفاصيل',reviews:'<i class="fa-solid fa-rotate"></i> يطلب ريفيوز كتير',quick:'<i class="fa-solid fa-bolt"></i> يريد تسليم سريع',vague:'🌫 تعليماته مش واضحة',demanding:'😤 مطالب'};
const _dnaPayMap={instant:'<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> يدفع فوري',normal:'<i class="fa-solid fa-clock"></i> يدفع في وقته',late:'<i class="fa-solid fa-triangle-exclamation"></i> بيتأخر أحياناً',very_late:'<i class="fa-solid fa-siren-on"></i> بيتأخر كتير'};

// Patch _renderProfileTab overview to show DNA + score
(function(){
  const _orig=window._renderProfileTab;
  window._renderProfileTab=function(tab,id){
    _orig(tab,id);
    if(tab==='overview'){
      const c=S.clients.find(x=>x.id===id);if(!c)return;
      const body=document.getElementById('profile-body');if(!body)return;
      const score=_calcClientScore(c);
      const scoreBadge=_clientScoreBadge(score);
      const dnaHtml=`
        <div style="background:rgba(247,201,72,.05);border:1px solid rgba(247,201,72,.18);border-radius:10px;padding:12px 14px;margin-top:12px">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
            <div style="font-size:12px;font-weight:800;color:var(--accent2)"><i class="fa-solid fa-dna"></i> DNA العميل</div>
            <div style="display:flex;align-items:center;gap:6px">
              ${scoreBadge}
              <span style="font-size:11px;font-weight:700;color:var(--text3)">نقاط: ${score}</span>
            </div>
          </div>
          <div style="display:flex;gap:10px;flex-wrap:wrap;font-size:11px;margin-bottom:${c.dnaNotes?'8px':'0'}">
            ${c.dnaStyle?`<span style="background:var(--surface2);padding:3px 10px;border-radius:20px">${_dnaStyleMap[c.dnaStyle]||c.dnaStyle}</span>`:''}
            ${c.dnaPayment?`<span style="background:var(--surface2);padding:3px 10px;border-radius:20px">${_dnaPayMap[c.dnaPayment]||c.dnaPayment}</span>`:''}
          </div>
          ${c.dnaNotes?`<div style="font-size:12px;color:var(--text2);font-style:italic;border-top:1px solid var(--border);padding-top:7px;margin-top:4px">${c.dnaNotes}</div>`:''}
          ${(!c.dnaStyle&&!c.dnaPayment&&!c.dnaNotes)?`<div style="font-size:11px;color:var(--text3)">لم تضف بيانات DNA بعد — <span style="color:var(--accent);cursor:pointer" onclick="closeM('modal-client-profile');openClientModal(${id})">أضفها الآن</span></div>`:''}
        </div>`;
      body.insertAdjacentHTML('beforeend', dnaHtml);

      // Payment warning if bad payer
      if(c.dnaPayment==='very_late'){
        body.insertAdjacentHTML('beforeend',`<div style="background:rgba(247,111,124,.1);border:1px solid rgba(247,111,124,.3);border-radius:8px;padding:9px 12px;margin-top:8px;font-size:12px;color:var(--accent4)"><i class="fa-solid fa-siren-on"></i> تحذير: هذا العميل لديه سجل دفع سيء — ضع في حسبانك طلب عربون مقدماً</div>`);
      }

      // Silent client warning
      const silent=_checkSilentClients().find(x=>x.client.id===id);
      if(silent){
        body.insertAdjacentHTML('beforeend',`<div style="background:rgba(247,201,72,.08);border:1px solid rgba(247,201,72,.2);border-radius:8px;padding:9px 12px;margin-top:8px;font-size:12px;color:var(--accent2)"><i class="fa-solid fa-bell-slash"></i> عميل هادي — آخر تواصل منذ ${silent.days} يوم · <a href="https://wa.me/${(c.phone||'').replace(/\D/g,'')}" target="_blank" style="color:var(--accent3)">تواصل الآن <i class="fa-solid fa-comments"></i></a></div>`);
      }

      // Monthly orders + capacity recommendation
      const {monthOrders,recommendation}=_calcExpectedIncome();
      const cMonthOrders=S.tasks.filter(t=>t.client===c.name&&(t.orderDate||t.isoDate||'').startsWith(new Date().toISOString().slice(0,7))).length;
      const allMonths=[...new Set(S.tasks.filter(t=>t.client===c.name).map(t=>(t.orderDate||t.isoDate||'').slice(0,7)).filter(Boolean))];
      const avgMonthOrders=allMonths.length?Math.round(S.tasks.filter(t=>t.client===c.name).length/allMonths.length*10)/10:0;
      body.insertAdjacentHTML('beforeend',`
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px">
          <div style="background:var(--surface2);border-radius:8px;padding:9px;text-align:center">
            <div style="font-size:18px;font-weight:900;color:var(--accent)">${cMonthOrders}</div>
            <div style="font-size:9px;color:var(--text3)">أوردرات هذا الشهر</div>
          </div>
          <div style="background:var(--surface2);border-radius:8px;padding:9px;text-align:center">
            <div style="font-size:18px;font-weight:900;color:var(--accent2)">${avgMonthOrders}</div>
            <div style="font-size:9px;color:var(--text3)">متوسط الأوردرات/شهر</div>
          </div>
        </div>`);
    }
  };
})();

// ────────────────────────────────
// <i class="fa-solid fa-chart-bar"></i> CLIENT REPORT (تقرير العميل)
// ────────────────────────────────
function openClientReport(id){
  const c=S.clients.find(x=>x.id===id);if(!c)return;
  const overlay=document.createElement('div');
  overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:5100;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(3px)';
  overlay.id='_client-report-overlay';
  const now=new Date();
  const defFrom=`${now.getFullYear()-1}-01-01`;
  const defTo=now.toISOString().split('T')[0];
  overlay.innerHTML=`<div style="background:var(--surface);border-radius:16px;padding:24px;width:480px;max-width:96vw;box-shadow:0 24px 60px rgba(0,0,0,.5)">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <div style="font-size:16px;font-weight:800"><i class="fa-solid fa-chart-bar"></i> تقرير العميل — ${c.name}</div>
      <button onclick="document.getElementById('_client-report-overlay').remove()" style="background:none;border:none;font-size:18px;cursor:pointer;color:var(--text2)"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
      <div><label style="font-size:11px;color:var(--text3);display:block;margin-bottom:4px">من تاريخ</label>
        <input type="date" id="_report-from" value="${defFrom}" style="width:100%;background:var(--surface2);border:1.5px solid var(--border);border-radius:8px;padding:8px;color:var(--text);font-family:var(--font);font-size:13px"></div>
      <div><label style="font-size:11px;color:var(--text3);display:block;margin-bottom:4px">إلى تاريخ</label>
        <input type="date" id="_report-to" value="${defTo}" style="width:100%;background:var(--surface2);border:1.5px solid var(--border);border-radius:8px;padding:8px;color:var(--text);font-family:var(--font);font-size:13px"></div>
    </div>
    <div style="display:flex;gap:8px">
      <button style="flex:1;background:var(--accent);color:#fff;border:none;border-radius:10px;padding:11px;font-family:var(--font);font-size:13px;font-weight:700;cursor:pointer" onclick="_printClientReport(${id})"><i class="fa-solid fa-print"></i> طباعة التقرير</button>
      <button style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:11px 14px;font-family:var(--font);font-size:13px;cursor:pointer;color:var(--text2)" onclick="document.getElementById('_client-report-overlay').remove()">إلغاء</button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
}

function _printClientReport(id){
  const c=S.clients.find(x=>x.id===id);if(!c)return;
  const from=document.getElementById('_report-from')?.value||'';
  const to=document.getElementById('_report-to')?.value||'';
  document.getElementById('_client-report-overlay')?.remove();

  const inRange=d=>(!from||d>=from)&&(!to||d<=to);
  const subClients=S.clients.filter(sc=>String(sc.parentClientId)===String(c.id));
  const allNames=[c.name,...subClients.map(sc=>sc.name)];
  const tasks=S.tasks.filter(t=>allNames.includes(t.client)&&inRange((t.orderDate||t.isoDate||'').slice(0,10)));
  const invs=S.invoices.filter(i=>allNames.includes(i.client)&&inRange((i.isoDate||i.date||'').slice(0,10)));
  const stmts=(_stmtsData?_stmtsData():[]).filter(s=>s.client===c.name&&inRange(s.from||''));
  const totalVal=tasks.reduce((s,t)=>s+(t.value||0),0);
  const totalPaid=invs.filter(i=>i.status==='paid').reduce((s,i)=>s+i.total,0);
  const totalPend=invs.filter(i=>i.status==='pending').reduce((s,i)=>s+i.total,0);
  const score=_calcClientScore(c);
  const studio=S.settings?.name||'Ordo';

  // Group by month
  const byMonth={};
  tasks.forEach(t=>{const mk=(t.orderDate||t.isoDate||'').slice(0,7);if(mk){if(!byMonth[mk])byMonth[mk]=[];byMonth[mk].push(t);}});

  const html=`<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>تقرير ${c.name}</title>
  <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Cairo',Arial,sans-serif;background:#f5f6fa;color:#1a1a2e;padding:30px}
  .page{background:#fff;max-width:860px;margin:0 auto;border-radius:16px;padding:40px;box-shadow:0 4px 24px rgba(0,0,0,.08)}
  h1{font-size:22px;font-weight:900;color:#7c6ff7}h2{font-size:12px;color:#888;margin-bottom:20px}
  .cards{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:22px}
  .card{background:#f0f2f8;border-radius:10px;padding:12px;text-align:center}.card .v{font-size:18px;font-weight:900;color:#7c6ff7}.card .l{font-size:10px;color:#888;margin-top:2px}
  .sec{font-size:13px;font-weight:800;color:#7c6ff7;border-bottom:2px solid #e8eaf0;padding-bottom:5px;margin:18px 0 10px}
  .dna{background:#fffbe6;border:1px solid #ffe082;border-radius:10px;padding:12px;margin-bottom:16px;font-size:12px}
  table{width:100%;border-collapse:collapse;font-size:11px}th{background:#f0f2f8;padding:6px 8px;text-align:right;font-weight:700}
  td{padding:6px 8px;border-bottom:1px solid #eee}.badge{display:inline-block;padding:1px 7px;border-radius:7px;font-size:10px;font-weight:700}
  .paid{background:rgba(79,209,165,.15);color:#2db87c}.pend{background:rgba(247,201,72,.15);color:#d49e00}.done{background:rgba(79,209,165,.15);color:#2db87c}
  .month-header{background:#f0f2f8;font-weight:800;padding:6px 8px;font-size:12px}
  footer{margin-top:28px;padding-top:14px;border-top:2px solid #e8eaf0;display:flex;justify-content:space-between;font-size:10px;color:#aaa}
  @media print{body{padding:0;background:#fff}.page{box-shadow:none;border-radius:0}}</style></head>
  <body><div class="page">
  <h1><i class="fa-solid fa-chart-bar"></i> تقرير العميل — ${c.name}</h1>
  <h2>${studio} · ${from||'—'} → ${to||'—'} · صادر ${new Date().toLocaleDateString('ar-EG')}</h2>
  <div class="dna">
    <b style="color:#b8860b"><i class="fa-solid fa-dna"></i> DNA العميل</b> &nbsp;
    ${c.dnaStyle?`أسلوبه: ${_dnaStyleMap[c.dnaStyle]||c.dnaStyle}`:''} 
    ${c.dnaPayment?`· الدفع: ${_dnaPayMap[c.dnaPayment]||c.dnaPayment}`:''}
    · <b>Value Score: ${score}/100</b> ${score>=80?'<i class="fa-solid fa-star"></i> ذهبي':score>=60?'<i class="fa-solid fa-gem"></i> ممتاز':score>=40?'<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> جيد':'<i class="fa-solid fa-triangle-exclamation"></i> منخفض'}
    ${c.dnaNotes?`<br><i style="color:#888">${c.dnaNotes}</i>`:''}
  </div>
  <div class="cards">
    <div class="card"><div class="v">${tasks.length}</div><div class="l">مشاريع</div></div>
    <div class="card"><div class="v" style="color:#2db87c">${totalVal.toLocaleString()} ج</div><div class="l">إجمالي قيمة</div></div>
    <div class="card"><div class="v" style="color:#2db87c">${totalPaid.toLocaleString()} ج</div><div class="l"><i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> محصّل</div></div>
    <div class="card"><div class="v" style="color:#d49e00">${totalPend.toLocaleString()} ج</div><div class="l">⏳ معلق</div></div>
  </div>
  <div class="sec"><i class="fa-solid fa-clipboard-list"></i> تفاصيل المشاريع حسب الشهر</div>
  <table><thead><tr><th>المشروع</th><th>التاريخ</th><th>التسليم</th><th>القيمة</th><th>الحالة</th></tr></thead><tbody>
  ${Object.keys(byMonth).sort().reverse().map(mk=>`
    <tr><td class="month-header" colspan="5"><i class="fa-solid fa-calendar-days"></i> ${mk}</td></tr>
    ${byMonth[mk].map(t=>`<tr><td>${t.title}</td><td>${t.orderDate||'—'}</td><td>${t.deadline||'—'}</td><td>${t.value?(t.value.toLocaleString()+' ج'):'—'}</td><td><span class="badge ${t.done?'done':''}">${t.done?'<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> مكتمل':t.status||'—'}</span></td></tr>`).join('')}
  `).join('')}
  </tbody></table>
  ${invs.length?`<div class="sec"><i class="fa-solid fa-receipt"></i> الفواتير</div>
  <table><thead><tr><th>رقم</th><th>التاريخ</th><th>الإجمالي</th><th>الحالة</th></tr></thead><tbody>
  ${invs.map(i=>`<tr><td>#${i.num||'—'}</td><td>${i.date||'—'}</td><td>${i.total.toLocaleString()} ج</td><td><span class="badge ${i.status==='paid'?'paid':'pend'}">${i.status==='paid'?'مدفوع':'معلق'}</span></td></tr>`).join('')}
  </tbody></table>`:''}
  <footer><span>${studio}</span><span>تقرير العميل: ${c.name}</span></footer>
  </div><${'script'}>window.onload=()=>setTimeout(()=>window.print(),400)</${'script'}></body></html>`;
  const w=window.open('','_blank');w.document.write(html);w.document.close();
}

// ────────────────────────────────
// PATCH openClientProfile: add Report button
// ────────────────────────────────
(function(){
  const _orig=window.openClientProfile;
  window.openClientProfile=function(id){
    _orig(id);
    // inject report button into header actions
    setTimeout(()=>{
      const actDiv=document.querySelector('#modal-client-profile .profile-header-actions');
      if(actDiv&&!actDiv.querySelector('[data-report-btn]')){
        const btn=document.createElement('button');
        btn.className='btn btn-ghost btn-sm';
        btn.setAttribute('data-report-btn','1');
        btn.title='تقرير طباعي للعميل';
        btn.innerHTML='<i class="fa-solid fa-chart-bar"></i> تقرير';
        btn.onclick=()=>openClientReport(id);
        actDiv.insertBefore(btn, actDiv.firstChild);
      }
    },100);
  };
})();

// ────────────────────────────────
// WIDGET HTML for new widgets
// ────────────────────────────────
(function(){
  const _orig=window._widgetInnerHTML;
  window._widgetInnerHTML=function(id){
    if(id==='commitment'){
      return '<div class="card" style="height:100%;border-color:rgba(79,209,165,.3)"><div class="section-title" style="color:var(--accent3)"><i class="fa-solid fa-bullseye"></i> مؤشر الالتزام بالمواعيد</div><div id="dash-commitment-inner"><div class="empty" style="padding:8px 0"><div style="font-size:12px">لا بيانات كافية</div></div></div></div>';
    }
    if(id==='momentum'){
      return '<div class="card" style="height:100%;border-color:rgba(124,111,247,.3)"><div class="section-title" style="color:var(--accent)"><i class="fa-solid fa-bolt"></i> مقياس الزخم (آخر 7 أيام)</div><div id="dash-momentum-inner"><div class="empty" style="padding:8px 0"><div style="font-size:12px">جارٍ الحساب...</div></div></div></div>';
    }
    if(id==='expected'){
      return '<div class="card" style="height:100%;border-color:rgba(247,201,72,.3)"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><div class="section-title" style="margin:0;color:var(--accent2)"><i class="fa-solid fa-coins"></i> الدخل المتوقع وسعة العمل</div><button onclick="document.getElementById(\'_capacity-modal\')&&(document.getElementById(\'_capacity-modal\').style.display=\'flex\')" class="btn btn-ghost btn-sm" style="font-size:10px"><i class="fa-solid fa-gear"></i></button></div><div id="dash-expected-inner"><div class="empty" style="padding:8px 0"><div style="font-size:12px">جارٍ الحساب...</div></div></div></div>';
    }
    if(id==='upcoming'){
      return '<div class="card" style="height:100%;border-color:rgba(247,111,124,.3)"><div class="section-title" style="color:var(--accent4)"><i class="fa-solid fa-alarm-clock"></i> مواعيد خلال 48 ساعة</div><div id="dash-upcoming-inner"><div class="empty" style="padding:8px 0"><div class="empty-icon" style="font-size:18px"><i class="fa-solid fa-square-check" style="color:var(--accent3)"></i></div><div style="font-size:12px">لا مواعيد قريبة</div></div></div></div>';
    }
    if(id==='challenge'){
      return '<div class="card" style="height:100%;border-color:rgba(247,201,72,.3)"><div class="section-title" style="color:var(--accent2)"><i class="fa-solid fa-trophy"></i> تحدي الأسبوع</div><div id="dash-challenge-inner"><div class="empty" style="padding:8px 0"><div style="font-size:12px">جارٍ تحضير التحدي...</div></div></div></div>';
    }
    if(id==='silent'){
      return '<div class="card" style="height:100%;border-color:rgba(124,111,247,.25)"><div class="section-title" style="color:var(--accent)"><i class="fa-solid fa-bell-slash"></i> العملاء الهادئون (30+ يوم)</div><div id="dash-silent-clients"><div class="empty" style="padding:8px 0"><div style="font-size:12px"><i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> كل العملاء في تواصل</div></div></div></div>';
    }
    return _orig(id);
  };
})();

// ────────────────────────────────
// UPCOMING DEADLINE BANNER on Tasks page
// ────────────────────────────────
function _renderTasksUpcomingBanner(){
  let banner=document.getElementById('_tasks-deadline-banner');
  const now=new Date();
  const in48=new Date(now.getTime()+48*60*60*1000);
  const urgent=S.tasks.filter(t=>{
    if(t.done||!t.deadline)return false;
    const d=new Date(t.deadline+'T23:59:59');
    return d>=now&&d<=in48;
  });
  if(!urgent.length){if(banner)banner.remove();return;}
  if(!banner){
    banner=document.createElement('div');
    banner.id='_tasks-deadline-banner';
    const tasksPage=document.getElementById('page-tasks');
    if(!tasksPage)return;
    const firstChild=tasksPage.querySelector('.page-header');
    if(firstChild)firstChild.insertAdjacentElement('afterend',banner);
    else tasksPage.prepend(banner);
  }
  banner.innerHTML=`<div style="background:rgba(247,111,124,.1);border:1.5px solid rgba(247,111,124,.3);border-radius:12px;padding:10px 14px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap">
    <span style="font-size:15px"><i class="fa-solid fa-alarm-clock"></i></span>
    <span style="font-size:12px;font-weight:700;color:var(--accent4)">تحذير مواعيد: ${urgent.length} مهمة موعدها خلال 48 ساعة —</span>
    ${urgent.slice(0,3).map(t=>`<span onclick="openTaskDetail(${t.id})" style="font-size:11px;background:rgba(247,111,124,.15);padding:2px 10px;border-radius:20px;cursor:pointer;color:var(--accent4)">${t.title.slice(0,25)}</span>`).join('')}
  </div>`;
}

// Patch renderAll / showPage to call banner
(function(){
  const _origRA=window.renderAll;
  window.renderAll=function(){
    _origRA();
    _renderTasksUpcomingBanner();
    renderNewWidgets();
  };
})();

// ────────────────────────────────
// CAPACITY SETTINGS MODAL (mini)
// ────────────────────────────────
(function(){
  const modal=document.createElement('div');
  modal.id='_capacity-modal';
  modal.style.cssText='display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:5050;align-items:center;justify-content:center';
  modal.innerHTML=`<div style="background:var(--surface);border-radius:14px;padding:20px;width:340px;max-width:95vw">
    <div style="font-size:14px;font-weight:800;margin-bottom:12px"><i class="fa-solid fa-gear"></i> إعداد طاقة العمل الشهرية</div>
    <div style="font-size:12px;color:var(--text2);margin-bottom:8px">كم مهمة نشطة تستطيع إدارتها في نفس الوقت؟</div>
    <input id="_cap-input" type="number" min="1" max="50" class="form-input" style="margin-bottom:12px" placeholder="مثال: 10">
    <div style="display:flex;gap:8px">
      <button class="btn btn-primary" style="flex:1" onclick="_saveCapacity()" data-i18n="btn_save"><i class="fa-solid fa-floppy-disk" style="margin-left:4px"></i> حفظ</button>
      <button class="btn btn-ghost" onclick="document.getElementById('_capacity-modal').style.display='none'">إلغاء</button>
    </div>
  </div>`;
  document.body.appendChild(modal);
  // init value
  setTimeout(()=>{const inp=document.getElementById('_cap-input');if(inp)inp.value=S.settings?.monthlyCapacity||10;},500);
})();

function _saveCapacity(){
  const v=+(document.getElementById('_cap-input')?.value)||10;
  if(!S.settings)S.settings={};
  S.settings.monthlyCapacity=v;
  lsSave();cloudSave(S);
  document.getElementById('_capacity-modal').style.display='none';
  renderExpectedWidget();
  if(typeof showMiniNotif==='function') showMiniNotif('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم حفظ طاقة العمل: '+v+' مهمة');
}

// ────────────────────────────────
// AUTO NOTIFICATIONS — patch existing checker
// ────────────────────────────────
(function(){
  const _origCheck=window._autoCheckNotifications||window.checkAutoNotifs;
  // Also add a new interval check for upcoming deadlines
  const _origSetup=window.setupAutoNotifications||function(){};
  setTimeout(function(){
    const now=new Date();
    const in24=new Date(now.getTime()+24*60*60*1000);
    const in48=new Date(now.getTime()+48*60*60*1000);
    const urgent24=S.tasks.filter(t=>{if(t.done||!t.deadline)return false;const d=new Date(t.deadline+'T23:59:59');return d>=now&&d<=in24;});
    const urgent48=S.tasks.filter(t=>{if(t.done||!t.deadline)return false;const d=new Date(t.deadline+'T23:59:59');return d>in24&&d<=in48;});
    if(urgent24.length&&typeof addNotification==='function'){
      addNotification('<i class="fa-solid fa-siren-on"></i> '+urgent24.length+' مهمة موعدها خلال 24 ساعة!','warning');
    }
    if(urgent48.length&&typeof addNotification==='function'){
      addNotification('<i class="fa-solid fa-alarm-clock"></i> '+urgent48.length+' مهمة موعدها خلال 48 ساعة','info');
    }
    // Silent clients
    const silent=_checkSilentClients();
    if(silent.length>0&&typeof addNotification==='function'){
      addNotification('<i class="fa-solid fa-bell-slash"></i> '+silent.length+' عميل لم يتواصل معك منذ أكثر من 30 يوم','info');
    }
    // Weekly challenge
    _updateWeeklyChallengeProgress();
  },2000);
})();

// ============================================================
// KANBAN DRAG & DROP
// ============================================================
let _kbDragId = null;

function kbDragStart(ev, taskId){
  _kbDragId = taskId;
  ev.dataTransfer.effectAllowed = 'move';
  ev.dataTransfer.setData('text/plain', taskId);
  // add visual class after a tick
  setTimeout(()=>{
    const el = document.querySelector(`[data-task-id="${taskId}"]`);
    if(el) el.classList.add('dragging');
  }, 0);
}

function kbDragOver(ev){
  ev.preventDefault();
  ev.dataTransfer.dropEffect = 'move';
  ev.currentTarget.classList.add('drag-over');
}

function kbDragLeave(ev){
  ev.currentTarget.classList.remove('drag-over');
}

function kbDrop(ev){
  ev.preventDefault();
  ev.currentTarget.classList.remove('drag-over');
  const taskId = +(_kbDragId || ev.dataTransfer.getData('text/plain'));
  const newStatus = ev.currentTarget.dataset.status;
  if(!taskId || !newStatus) return;
  const task = S.tasks.find(t=>t.id===taskId);
  if(!task) return;
  if(task.status === newStatus){ _kbDragId=null; return; }
  // إذا نُقلت إلى مكتمل، استخدم completeTask لطلب رابط التسليم
  if(newStatus === 'done'){
    _kbDragId = null;
    document.querySelectorAll('.dragging').forEach(el=>el.classList.remove('dragging'));
    completeTask(taskId);
    return;
  }
  task.status = newStatus;
  task.done   = false;
  task.doneAt = null;
  lsSave();
  renderAll();
  const statusLabels = {'new':'<i class="fa-solid fa-clipboard-list"></i> جديد','progress':'<i class="fa-solid fa-bolt"></i> قيد التنفيذ','review':'<i class="fa-solid fa-magnifying-glass"></i> مراجعة','paused':'⏸ موقوف'};
  const customLabel = (S.customStatuses||[]).find(c=>c.id===newStatus)?.label||newStatus;
  showMiniNotif('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> '+(statusLabels[newStatus]||customLabel));
  _kbDragId = null;
  document.querySelectorAll('.dragging').forEach(el=>el.classList.remove('dragging'));
}

function kbDropDone(ev){
  ev.preventDefault();
  ev.currentTarget.classList.remove('drag-over');
  const taskId = +(_kbDragId || ev.dataTransfer.getData('text/plain'));
  if(!taskId) return;
  const task = S.tasks.find(t=>t.id===taskId);
  if(!task || task.done) return;
  completeTask(taskId);
  _kbDragId = null;
  document.querySelectorAll('.dragging').forEach(el=>el.classList.remove('dragging'));
}

function kbDropPrio(ev){
  ev.preventDefault();
  ev.currentTarget.classList.remove('drag-over');
  const taskId = +(_kbDragId || ev.dataTransfer.getData('text/plain'));
  const newPrio = ev.currentTarget.dataset.priority;
  if(!taskId || !newPrio) return;
  const task = S.tasks.find(t=>t.id===taskId);
  if(!task) return;
  task.priority = newPrio;
  task.done     = false;
  lsSave(); renderTasks();
  showMiniNotif('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> '+({'high':'<i class="fa-solid fa-circle"></i> عاجل','med':'<i class="fa-solid fa-circle"></i> متوسط','low':'<i class="fa-solid fa-circle"></i> عادي'}[newPrio]||newPrio));
  _kbDragId = null;
  document.querySelectorAll('.dragging').forEach(el=>el.classList.remove('dragging'));
}

// Touch support for mobile drag (swap via long-press menu)
function kbMobileMoveTask(taskId, newStatus){
  const task = S.tasks.find(t=>t.id===taskId); if(!task) return;
  const prevDone = task.done || task.status==='done';
  task.status = newStatus;
  task.done   = false;
  lsSave(); renderTasks();
  showMiniNotif('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> نُقلت المهمة إلى: '+({'new':'جديد','progress':'قيد التنفيذ','review':'مراجعة','paused':'موقوف'}[newStatus]||newStatus));
}

// Show context menu for mobile task move (status + priority)
function kbShowMoveMenu(ev, taskId){
  ev.preventDefault(); ev.stopPropagation();
  const existing = document.getElementById('_kb_menu');
  if(existing) existing.remove();
  const task = S.tasks.find(t=>t.id===taskId);
  const statuses = [{id:'new',label:'<i class="fa-solid fa-clipboard-list"></i> جديد'},{id:'progress',label:'<i class="fa-solid fa-bolt"></i> قيد التنفيذ'},{id:'review',label:'<i class="fa-solid fa-magnifying-glass"></i> مراجعة'},{id:'paused',label:'⏸ موقوف'},{id:'done',label:'<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> مكتمل'}];
  const priorities = [{id:'high',label:'<i class="fa-solid fa-circle"></i> عاجل'},{id:'med',label:'<i class="fa-solid fa-circle"></i> متوسط'},{id:'low',label:'<i class="fa-solid fa-circle"></i> عادي'}];
  const menu = document.createElement('div');
  menu.id = '_kb_menu';
  menu.style.cssText = 'position:fixed;z-index:9999;background:var(--surface2);border:1px solid var(--border);border-radius:12px;padding:8px;min-width:190px;box-shadow:0 8px 32px rgba(0,0,0,.5)';
  const x = Math.min((ev.clientX||ev.touches?.[0]?.clientX||100), window.innerWidth-210);
  const y = Math.min((ev.clientY||ev.touches?.[0]?.clientY||100), window.innerHeight-300);
  menu.style.left = x+'px'; menu.style.top = y+'px';
  menu.innerHTML =
    `<div style="font-size:11px;color:var(--text3);padding:4px 8px 6px;border-bottom:1px solid var(--border);margin-bottom:6px">نقل: "${(task?.title||'').slice(0,22)}"</div>`+
    `<div style="font-size:10px;color:var(--accent);padding:2px 8px 4px;font-weight:700">الحالة</div>`+
    statuses.filter(s=>s.id!==(task?.status||'new')).map(s=>
      `<div onclick="${s.id==='done'?`completeTask(${taskId})`:`kbMobileMoveTask(${taskId},'${s.id}')`};document.getElementById('_kb_menu')?.remove()" style="padding:7px 12px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer" onmouseover="this.style.background='rgba(124,111,247,.12)'" onmouseout="this.style.background=''">${s.label}</div>`
    ).join('')+
    `<div style="font-size:10px;color:var(--accent2);padding:6px 8px 4px;font-weight:700;border-top:1px solid var(--border);margin-top:4px">الأولوية</div>`+
    priorities.filter(p=>p.id!==(task?.priority||'med')).map(p=>
      `<div onclick="kbMobilePrio(${taskId},'${p.id}');document.getElementById('_kb_menu').remove()" style="padding:7px 12px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer" onmouseover="this.style.background='rgba(247,201,72,.12)'" onmouseout="this.style.background=''">${p.label}</div>`
    ).join('');
  document.body.appendChild(menu);
  setTimeout(()=>document.addEventListener('click',()=>{const m=document.getElementById('_kb_menu');if(m)m.remove();},{once:true}),100);
}
function kbMobilePrio(taskId,newPrio){
  const t=S.tasks.find(x=>x.id===taskId);if(!t)return;
  t.priority=newPrio; lsSave(); renderTasks();
  showMiniNotif('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> '+({'high':'<i class="fa-solid fa-circle"></i> عاجل','med':'<i class="fa-solid fa-circle"></i> متوسط','low':'<i class="fa-solid fa-circle"></i> عادي'}[newPrio]||newPrio));
}


// ============================================================
// CLIENT SOCIALS MANAGEMENT
// ============================================================
function renderClientSocials(socials){
  const el=document.getElementById('c-socials-list'); if(!el) return;
  if(!socials||!socials.length){ el.innerHTML='<div style="font-size:11px;color:var(--text3)">لا حسابات مضافة</div>'; return; }
  el.innerHTML=socials.map((s,i)=>`
    <span class="social-tag" data-platform="${s.platform}" data-icon="${s.platform}" data-url="${s.url||''}"
      style="display:inline-flex;align-items:center;gap:5px;background:rgba(124,111,247,.15);border:1px solid rgba(124,111,247,.3);padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600;margin:2px">
      ${getSocialIconHTML(s.platform,14)} <span>${(SOCIAL_META[s.platform]||SOCIAL_META.other).label}</span>
      <a href="${s.url}" target="_blank" style="color:var(--accent3);font-size:10px" onclick="event.stopPropagation()">↗</a>
      <button onclick="removeClientSocial(${i})" style="background:none;border:none;cursor:pointer;color:var(--text3);font-size:11px;padding:0;line-height:1"><i class="fa-solid fa-xmark"></i></button>
    </span>`).join('');
}
function addClientSocial(){
  const sel=document.getElementById('c-social-platform');
  const url=document.getElementById('c-social-url')?.value.trim();
  if(!url) return alert('أدخل رابط الحساب');
  const opt=sel.options[sel.selectedIndex];
  const platform=sel.value;
  const icon=opt.dataset.icon||'<i class="fa-solid fa-link"></i>';
  const existing=[...document.querySelectorAll('#c-socials-list .social-tag')].map(el=>({platform:el.dataset.platform,icon:el.dataset.icon,url:el.dataset.url}));
  existing.push({platform,icon,url});
  renderClientSocials(existing);
  document.getElementById('c-social-url').value='';
}
function removeClientSocial(idx){
  const existing=[...document.querySelectorAll('#c-socials-list .social-tag')].map(el=>({platform:el.dataset.platform,icon:el.dataset.icon,url:el.dataset.url}));
  existing.splice(idx,1);
  renderClientSocials(existing);
}

// ============================================================
