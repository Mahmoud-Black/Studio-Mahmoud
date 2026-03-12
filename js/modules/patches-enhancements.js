// ═══════════════════════════════════════════════════
// 1. INVOICE TAB SWITCHER
// ═══════════════════════════════════════════════════
function switchInvTab(tab){
  const panels = {invoices:'inv-panel-invoices', contracts:'inv-panel-contracts', statements:'inv-panel-statements'};
  const btns   = {invoices:'inv-tab-inv', contracts:'inv-tab-ct', statements:'inv-tab-stmt'};
  Object.keys(panels).forEach(k=>{
    const p = document.getElementById(panels[k]);
    const b = document.getElementById(btns[k]);
    if(p) p.style.display = k===tab ? '' : 'none';
    if(b){ b.classList.toggle('active', k===tab); }
  });
  const addBtn = document.getElementById('inv-add-btn');
  if(addBtn){
    if(tab==='contracts'){ addBtn.textContent='+ عقد جديد'; addBtn.onclick=()=>openContractModal(); }
    else if(tab==='statements'){ addBtn.textContent='+ كشف حساب'; addBtn.onclick=()=>_stmtNewDialog(); }
    else { addBtn.textContent='+ فاتورة جديدة'; addBtn.onclick=()=>openInvoiceModal(); }
  }
  if(tab==='contracts') renderContractsList();
  if(tab==='statements') _initStatementsPanel();
}

// ═══════════════════════════════════════════════════
// 2. PATCH showPage — contracts -> invoices tab
//    (safe: no recursive override)
// ═══════════════════════════════════════════════════
document.addEventListener('click', function(e){
  // intercept any nav click to 'contracts' before showPage fires
}, true);

// Wrap showPage once, safely, using a flag
if(!window._showPagePatched){
  window._showPagePatched = true;
  const _spOrig = window.showPage;
  window.showPage = function(id, el){
    if(id === 'contracts'){
      _spOrig('invoices', el);
      setTimeout(()=>switchInvTab('contracts'), 40);
      return;
    }
    _spOrig(id, el);
    if(id === 'invoices')  setTimeout(()=>switchInvTab('invoices'), 20);
    if(id === 'learning'){ showPage('freelancer-goals'); switchFgTab('courses'); return; }
  if(id === 'freelancer-goals') setTimeout(renderFreelancerGoalsPage, 40);
  };
}

// ═══════════════════════════════════════════════════
// 3. TIME TRACKER — task dropdown
// ═══════════════════════════════════════════════════
function ttBuildActiveTasks(){
  return (S.tasks||[]).filter(t=>!t.done && t.status!=='done');
}

function ttShowDropdown(inputId, dropdownId){
  const inp = document.getElementById(inputId);
  const dd  = document.getElementById(dropdownId);
  if(!inp || !dd) return;
  const q = (inp.value||'').toLowerCase();
  const tasks = ttBuildActiveTasks().filter(t=> !q || (t.title||'').toLowerCase().includes(q));
  if(!tasks.length){ dd.style.display='none'; return; }
  dd.innerHTML = tasks.slice(0,10).map(t=>`
    <div class="_tt-opt" data-title="${(t.title||'').replace(/"/g,'&quot;')}" data-client="${(t.client||'').replace(/"/g,'&quot;')}" data-id="${t.id}"
      style="padding:9px 12px;cursor:pointer;border-bottom:1px solid var(--border);font-size:13px"
      onmousedown="ttSelectOpt(event,'${inputId}')">
      <div style="font-weight:700">${t.title||''}</div>
      ${t.client?`<div style="font-size:11px;color:var(--text3)">${t.client}</div>`:''}
    </div>`).join('');
  dd.style.display='block';
}

function ttSelectOpt(e, inputId){
  e.preventDefault();
  const el = e.currentTarget;
  const title  = el.dataset.title;
  const client = el.dataset.client;
  const id     = +el.dataset.id;
  // Fill main timer inputs
  const ti = document.getElementById('tt-task-input');
  const ci = document.getElementById('tt-client-input');
  if(ti) ti.value = title;
  if(ci && client) ci.value = client;
  window._ttLinkedTaskId = id;
  // Also fill dashboard input if that's where we are
  const di = document.getElementById(inputId);
  if(di) di.value = title;
  // Hide dropdown
  const dd = document.getElementById(el.closest('[id$="-dropdown"]')?.id || '_none');
  if(dd) dd.style.display='none';
}

// Inject dropdown elements next to tt-task-input after page loads
window.addEventListener('load', function(){
  setTimeout(function(){
    const inp = document.getElementById('tt-task-input');
    if(inp && !document.getElementById('tt-task-dd')){
      const dd = document.createElement('div');
      dd.id = 'tt-task-dd';
      dd.style.cssText = 'display:none;position:absolute;top:100%;right:0;left:0;background:var(--surface2);border:1px solid var(--border);border-radius:10px;z-index:9000;max-height:220px;overflow-y:auto;box-shadow:0 8px 24px rgba(0,0,0,.3)';
      inp.parentNode.style.position='relative';
      inp.parentNode.appendChild(dd);
      inp.addEventListener('focus', ()=>ttShowDropdown('tt-task-input','tt-task-dd'));
      inp.addEventListener('input', ()=>ttShowDropdown('tt-task-input','tt-task-dd'));
      inp.addEventListener('blur',  ()=>setTimeout(()=>{dd.style.display='none';},200));
    }
  }, 1200);
});

// ═══════════════════════════════════════════════════
// 4. DASHBOARD WIDGETS
// ═══════════════════════════════════════════════════
function renderDashWidgets(){
  _renderDashGoals();
  _renderDashTimer();
}

function _renderDashGoals(){
  // In the new dashboard system, goals widget is rendered inside _dash-grid
  // Just update the goals list if it exists
  const dgl = document.getElementById('dash-goals-list');
  if(!dgl) return;
  const fg = S.freelancerGoals||{};
  let rows = '';
  if(fg.financial){
    const {target,month,year}=fg.financial;
    const ms=year+'-'+(month<10?'0':'')+month;
    const actual=(S.transactions||[]).filter(t=>t.type==='income'&&(t.isoDate||'').startsWith(ms)).reduce((s,t)=>s+(+t.amount||0),0);
    const pct=Math.min(100,Math.round(actual/(target||1)*100));
    const col=pct>=100?'var(--accent3)':pct>=75?'var(--accent2)':'var(--accent)';
    rows+=`<div style="margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px"><span><i class="fa-solid fa-coins"></i> هدف الدخل</span><span style="font-weight:700;color:${col}">${pct}%</span></div>
      <div style="background:var(--surface3);border-radius:20px;height:7px;overflow:hidden"><div style="height:100%;width:${pct}%;background:${col};border-radius:20px;transition:.5s"></div></div>
      <div style="font-size:11px;color:var(--text3);margin-top:2px">${actual.toLocaleString()} / ${target.toLocaleString()} ج</div>
    </div>`;
  }
  const lt=(S.goals||[]).length, ld=(S.goals||[]).filter(g=>g.done||(g.progress||0)===100).length;
  if(lt>0){
    rows+=`<div style="font-size:12px;color:var(--text2)"><i class="fa-solid fa-diamond"></i> التعليمية: <span style="font-weight:700;color:var(--accent2)">${ld}/${lt}</span> مكتمل</div>`;
  }
  if(!rows) rows = `<div style="font-size:12px;color:var(--text3)"><span style="color:var(--accent);cursor:pointer" onclick="showPage('freelancer-goals')">← حدد أهدافك</span></div>`;
  dgl.innerHTML = rows;
}

function _renderDashTimer(){
  // Timer widget - only update if the element already exists in the dash grid
  let el = document.getElementById('_dash-timer-wgt');
  if(!el) return; // timer widget not in current layout
  const running = _tt&&_tt.running;
  const elaps   = _tt ? _tt.elapsed+(_tt.startedAt?Date.now()-_tt.startedAt:0) : 0;
  const curTask = document.getElementById('tt-task-input')?.value||'';
  el.innerHTML=`
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
      <div class="section-title" style="margin:0;color:var(--accent3)"><i class="fa-solid fa-stopwatch"></i> تتبع الوقت السريع</div>
      <button onclick="showPage('timetracker')" class="btn btn-ghost btn-sm" style="font-size:11px">فتح كامل ←</button>
    </div>
    <div style="display:flex;gap:8px;align-items:center">
      <div style="position:relative;flex:1">
        <input class="form-input" id="_dtt-inp" value="${curTask.replace(/"/g,'&quot;')}" placeholder="اسم المهمة..."
          oninput="ttShowDropdown('_dtt-inp','_dtt-dd')" onfocus="ttShowDropdown('_dtt-inp','_dtt-dd')" onblur="setTimeout(()=>{const d=document.getElementById('_dtt-dd');if(d)d.style.display='none'},200)">
        <div id="_dtt-dd" style="display:none;position:absolute;top:100%;right:0;left:0;background:var(--surface2);border:1px solid var(--border);border-radius:8px;z-index:9001;max-height:160px;overflow-y:auto;box-shadow:0 6px 20px rgba(0,0,0,.3)"></div>
      </div>
      <div style="font-family:var(--mono);font-size:18px;font-weight:700;color:var(--accent3);min-width:68px;text-align:center">${ttFmt(elaps,1)||'00:00'}</div>
      <button onclick="_dttToggle()" style="width:40px;height:40px;border-radius:50%;background:${running?'var(--accent2)':'var(--accent)'};border:none;color:#fff;font-size:16px;cursor:pointer">${running?'⏸':'<i class="fa-solid fa-play"></i>'}</button>
      <button onclick="_dttStop()" style="width:36px;height:36px;border-radius:50%;background:rgba(247,111,124,.15);border:1.5px solid rgba(247,111,124,.3);color:var(--accent4);font-size:14px;cursor:pointer">■</button>
    </div>`;
}

function _dttToggle(){
  const inp = document.getElementById('_dtt-inp');
  const ti  = document.getElementById('tt-task-input');
  if(inp && inp.value && ti) ti.value = inp.value;
  ttToggle();
  setTimeout(()=>_renderDashTimer(), 120);
}
function _dttStop(){
  const inp = document.getElementById('_dtt-inp');
  const ti  = document.getElementById('tt-task-input');
  if(inp && inp.value && ti) ti.value = inp.value;
  ttStop();
  setTimeout(()=>_renderDashTimer(), 120);
}

// Hook into renderAll by replacing it once after load
window.addEventListener('load', function(){
  const _ra = renderAll;
  renderAll = function(){
    _ra();
    renderDashWidgets();
    var fgPage = document.getElementById('page-freelancer-goals');
    if(fgPage && fgPage.classList.contains('active')){
      renderFgBanner();
      // refresh active fg tab
      var activeChip = fgPage.querySelector('.filter-chip.active');
      var activeTab = activeChip ? activeChip.id.replace('fg-tab-','').replace('fin','financial').replace('tasks','tasks').replace('learn','learning') : 'financial';
      if(activeTab==='fin') activeTab='financial';
      if(activeTab==='learn') activeTab='learning';
      setTimeout(function(){ switchFgTab(activeTab); }, 30);
    }
  };
});

// ═══════════════════════════════════════════════════
// 5. FREELANCER GOALS PAGE
// ═══════════════════════════════════════════════════
function switchFgTab(tab){
  const tabMap = {financial:'fin', tasks:'tasks', learning:'learn', custom:'custom', courses:'courses'};
  Object.keys(tabMap).forEach(k => {
    const p = document.getElementById('fg-panel-'+k);
    const b = document.getElementById('fg-tab-'+tabMap[k]);
    if(p) p.style.display = k===tab ? '' : 'none';
    if(b) b.classList.toggle('active', k===tab);
  });
  // Update CTA button
  const cta = document.getElementById('fg-cta-btn');
  if(cta){
    if(tab==='financial'){ cta.innerHTML='<i class="fa-solid fa-pen"></i> تعديل الهدف المالي'; cta.onclick=()=>openFreelancerGoalModal('financial'); }
    else if(tab==='tasks'){ cta.innerHTML='<i class="fa-solid fa-pen"></i> تعديل هدف الأوردرات'; cta.onclick=()=>openFreelancerGoalModal('tasks'); }
    else if(tab==='learning'){ cta.textContent='+ هدف تعليمي'; cta.onclick=()=>openGoalModal(); }
    else if(tab==='custom'){ cta.textContent='+ هدف جديد'; cta.onclick=()=>openCustomGoalModal(); }
    else if(tab==='courses'){ cta.textContent='+ كورس جديد'; cta.onclick=()=>openCourseModal(); }
  }
  if(tab==='financial') renderFgFinancial();
  else if(tab==='tasks') renderFgTasks();
  else if(tab==='learning') renderFgLearning();
  else if(tab==='custom') renderFgCustomGoals();
  else if(tab==='courses') renderFgCourses();
}

function renderFreelancerGoalsPage(){
  renderFgBanner();
  // Keep current tab or default to financial
  const activeChip = document.querySelector('#page-freelancer-goals .filter-chip.active');
  const tabId = activeChip ? activeChip.id.replace('fg-tab-','') : 'fin';
  const tabMap = {fin:'financial', tasks:'tasks', learn:'learning', custom:'custom', courses:'courses'};
  switchFgTab(tabMap[tabId] || 'financial');
}

function renderFgBanner(){
  const el = document.getElementById('fg-banner'); if(!el) return;
  const fg = S.freelancerGoals||{};
  const parts = [];
  if(fg.financial){
    const {target,month,year}=fg.financial;
    const ms=year+'-'+(month<10?'0':'')+month;
    const actual=(S.transactions||[]).filter(t=>t.type==='income'&&(t.isoDate||'').startsWith(ms)).reduce((s,t)=>s+(+t.amount||0),0);
    const pct=Math.min(100,Math.round(actual/(target||1)*100));
    parts.push(`<div style="flex:1;text-align:center"><div style="font-size:11px;color:var(--text3)"><i class="fa-solid fa-coins"></i> المالي</div><div style="font-size:22px;font-weight:900;color:${pct>=100?'var(--accent3)':'var(--accent)'}">${pct}%</div><div style="font-size:11px;color:var(--text2)">${actual.toLocaleString()} / ${target.toLocaleString()} ج</div></div>`);
  }
  if(fg.tasks){
    const {target,startDate,endDate}=fg.tasks;
    const done=(S.tasks||[]).filter(t=>t.done&&t.doneAt&&t.doneAt>=startDate&&t.doneAt<=endDate).length;
    const pct=Math.min(100,Math.round(done/(target||1)*100));
    parts.push(`<div style="flex:1;text-align:center"><div style="font-size:11px;color:var(--text3)"><i class="fa-solid fa-clipboard-list"></i> الأوردرات</div><div style="font-size:22px;font-weight:900;color:${pct>=100?'var(--accent3)':'var(--accent2)'}">${done}/${target}</div><div style="font-size:11px;color:var(--text2)">${pct}%</div></div>`);
  }
  const lt=(S.goals||[]).length, ld=(S.goals||[]).filter(g=>g.done||(g.progress||0)===100).length;
  parts.push(`<div style="flex:1;text-align:center"><div style="font-size:11px;color:var(--text3)"><i class="fa-solid fa-diamond"></i> تعليمية</div><div style="font-size:22px;font-weight:900;color:var(--accent2)">${ld}/${lt}</div><div style="font-size:11px;color:var(--text2)">مكتمل</div></div>`);
  el.innerHTML = parts.length
    ? `<div class="card" style="display:flex;gap:16px;padding:16px;border-color:rgba(124,111,247,.3)">${parts.join('<div style="width:1px;background:var(--border)"></div>')}</div>`
    : '';
}

function renderFgFinancial(){
  const el = document.getElementById('fg-panel-financial'); if(!el) return;
  const fg = S.freelancerGoals||{};
  if(!fg.financial){
    el.innerHTML=`<div class="card" style="text-align:center;padding:40px"><div class="empty-icon"><i class="fa-solid fa-coins"></i></div><div style="margin-bottom:16px">لم تحدد هدفاً مالياً بعد</div><button class="btn btn-primary" onclick="openFreelancerGoalModal('financial')">+ تحديد الهدف</button></div>`;
    return;
  }
  const {target,month,year}=fg.financial;
  const ms=year+'-'+(month<10?'0':'')+month;
  const incomes=(S.transactions||[]).filter(t=>t.type==='income'&&(t.isoDate||'').startsWith(ms));
  const actual=incomes.reduce((s,t)=>s+(+t.amount||0),0);
  const pct=Math.min(100,Math.round(actual/(target||1)*100));
  const remaining=Math.max(0,target-actual);
  const col=pct>=100?'var(--accent3)':pct>=75?'var(--accent2)':'var(--accent)';
  const msg=pct>=100?'<i class="fa-solid fa-champagne-glasses"></i> مبروك! حققت هدفك المالي هذا الشهر!':pct>=75?`<i class="fa-solid fa-dumbbell"></i> أنت قريب! باقي ${remaining.toLocaleString()} ج فقط`:pct>=50?`<i class="fa-solid fa-chart-line"></i> نصف الطريق! باقي ${remaining.toLocaleString()} ج`:`<i class="fa-solid fa-rocket"></i> استمر! باقي ${remaining.toLocaleString()} ج للهدف`;
  const days=new Date(year,month,0).getDate();
  const byDay={};
  incomes.forEach(t=>{const d=+(t.isoDate||'').split('-')[2];byDay[d]=(byDay[d]||0)+(+t.amount||0);});
  let cum=0;const bars=[];const today=new Date().getDate();
  for(let d=1;d<=days;d++){cum+=(byDay[d]||0);bars.push({d,cum,has:!!byDay[d]});}
  const maxV=Math.max(target,cum,1);
  el.innerHTML=`
    <div class="card" style="margin-bottom:16px;padding:24px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px">
        <div>
          <div style="font-size:12px;color:var(--text3)">الهدف المالي — ${new Date(year,month-1).toLocaleString('ar-EG',{month:'long',year:'numeric'})}</div>
          <div style="font-size:34px;font-weight:900;color:${col}">${pct}%</div>
          <div style="font-size:13px;color:var(--text2)">${actual.toLocaleString()} من ${target.toLocaleString()} ج</div>
        </div>
        <button onclick="openFreelancerGoalModal('financial')" class="btn btn-ghost btn-sm"><i class="fa-solid fa-pen"></i> تعديل</button>
      </div>
      <div style="background:var(--surface3);border-radius:20px;height:12px;overflow:hidden;margin-bottom:12px">
        <div style="height:100%;width:${pct}%;background:${col};border-radius:20px;transition:.6s"></div>
      </div>
      <div style="padding:12px 16px;background:rgba(124,111,247,.08);border-radius:10px;font-size:13px">${msg}</div>
    </div>
    <div class="card" style="padding:20px">
      <div class="section-title" style="margin-bottom:14px"><i class="fa-solid fa-chart-line"></i> مسار الدخل اليومي</div>
      <div style="display:flex;align-items:flex-end;gap:2px;height:90px">
        ${bars.map(b=>`<div style="flex:1;display:flex;flex-direction:column;align-items:center" title="${b.d}: ${b.cum.toLocaleString()} ج">
          <div style="width:100%;background:${b.d<=today?(b.has?col:'var(--surface3)'):'var(--border)'};border-radius:2px 2px 0 0;height:${Math.round(b.cum/maxV*80)}px;min-height:2px"></div>
          ${b.d%7===0||b.d===1?`<div style="font-size:7px;color:var(--text3);margin-top:2px">${b.d}</div>`:''}
        </div>`).join('')}
      </div>
    </div>`;
}

function renderFgTasks(){
  const el=document.getElementById('fg-panel-tasks'); if(!el) return;
  const fg=S.freelancerGoals||{};
  if(!fg.tasks){
    el.innerHTML=`<div class="card" style="text-align:center;padding:40px"><div class="empty-icon"><i class="fa-solid fa-clipboard-list"></i></div><div style="margin-bottom:16px">لم تحدد هدف أوردرات بعد</div><button class="btn btn-primary" onclick="openFreelancerGoalModal('tasks')">+ تحديد الهدف</button></div>`;
    return;
  }
  const {target,startDate,endDate}=fg.tasks;
  const done=(S.tasks||[]).filter(t=>t.done&&t.doneAt&&t.doneAt>=startDate&&t.doneAt<=endDate);
  const pct=Math.min(100,Math.round(done.length/(target||1)*100));
  const col=pct>=100?'var(--accent3)':pct>=75?'var(--accent2)':'var(--accent)';
  el.innerHTML=`
    <div class="card" style="margin-bottom:16px;padding:24px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px">
        <div>
          <div style="font-size:12px;color:var(--text3)">هدف الأوردرات (${startDate} ← ${endDate})</div>
          <div style="font-size:34px;font-weight:900;color:${col}">${done.length} / ${target}</div>
          <div style="font-size:13px;color:var(--text2)">${pct}% من الهدف</div>
        </div>
        <button onclick="openFreelancerGoalModal('tasks')" class="btn btn-ghost btn-sm"><i class="fa-solid fa-pen"></i> تعديل</button>
      </div>
      <div style="background:var(--surface3);border-radius:20px;height:12px;overflow:hidden;margin-bottom:12px">
        <div style="height:100%;width:${pct}%;background:${col};border-radius:20px;transition:.6s"></div>
      </div>
    </div>
    ${done.length?`<div class="card" style="padding:18px">
      <div class="section-title" style="margin-bottom:10px"><i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> الأوردرات المكتملة في الفترة</div>
      ${done.map(t=>`<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);font-size:13px"><span>${t.title||''}</span><span style="color:var(--text3);font-size:11px">${t.doneAt||''}</span></div>`).join('')}
    </div>`:''}`;
}

function renderFgLearning(){
  const el=document.getElementById('fg-panel-learning'); if(!el) return;
  const goals=S.goals||[];
  const active=goals.filter(g=>!g.done&&(g.progress||0)<100);
  const done=goals.filter(g=>g.done||(g.progress||0)===100);
  el.innerHTML=`
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
      <div class="section-title" style="margin:0"><i class="fa-solid fa-bullseye"></i> الأهداف التعليمية (${goals.length})</div>
      <button onclick="openGoalModal()" class="btn btn-primary btn-sm"><i class="fa-solid fa-bullseye" style="margin-left:5px"></i> هدف جديد</button>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px">
      ${active.map(g=>`<div class="card" style="padding:16px">
        <div style="display:flex;justify-content:space-between;margin-bottom:10px">
          <div style="font-size:13px;font-weight:700">${g.title||''}</div>
          <span style="font-size:10px;padding:2px 8px;border-radius:20px;background:rgba(124,111,247,.15);color:var(--accent)">${g.cat||''}</span>
        </div>
        <div style="background:var(--surface3);border-radius:20px;height:6px;overflow:hidden;margin-bottom:6px">
          <div style="height:100%;width:${g.progress||0}%;background:var(--accent);border-radius:20px"></div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text3)">
          <span>${g.progress||0}%</span>${g.deadline?`<span><i class="fa-solid fa-alarm-clock"></i> ${g.deadline}</span>`:''}
        </div>
        <div style="display:flex;gap:6px;margin-top:10px">
          <button onclick="openGoalModal(${g.id})" class="btn btn-ghost btn-sm" style="flex:1"><i class="fa-solid fa-pen"></i> تعديل</button>
          <button onclick="markGoalDoneNow(${g.id})" class="btn btn-ghost btn-sm" style="flex:1;color:var(--accent3)"><i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> أكمل</button>
        </div>
      </div>`).join('')}
    </div>
    ${done.length?`<div style="margin-top:20px"><div class="section-title" style="color:var(--accent3)"><i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> مكتملة (${done.length})</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:10px;margin-top:10px">
      ${done.map(g=>`<div class="card" style="padding:12px;opacity:.7"><div style="font-size:13px;font-weight:700;text-decoration:line-through">${g.title||''}</div></div>`).join('')}
    </div>`:''}
    ${!goals.length?`<div class="empty card"><div class="empty-icon"><i class="fa-solid fa-diamond"></i></div><div>أضف أهدافك التعليمية</div><div style="margin-top:12px"><button class="btn btn-primary" onclick="openGoalModal()"><i class="fa-solid fa-bullseye" style="margin-left:5px"></i> هدف جديد</button></div></div>`:''}`;
}

function markGoalDoneNow(id){
  const g=(S.goals||[]).find(g=>g.id===id);
  if(!g) return;
  g.done=true; g.progress=100;
  lsSave(); renderAll();
  celebrateCompletion('<i class="fa-solid fa-graduation-cap"></i> أكملت الهدف: '+(g.title||''));
}

// ═══ Courses Tab ═══
function renderFgCourses(){
  const el = document.getElementById('fg-panel-courses'); if(!el) return;
  if(!S.courses || !S.courses.length){
    el.innerHTML = `<div class="empty card" style="padding:40px;text-align:center"><div class="empty-icon"><i class="fa-solid fa-graduation-cap"></i></div><div style="margin-bottom:16px">لم تضف كورسات بعد</div><button class="btn btn-primary" onclick="openCourseModal()">+ إضافة كورس</button></div>`;
    return;
  }
  // Render full courses grid here
  el.innerHTML = `<div id="courses-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px"></div>`;
  renderCourses();
}

// ═══ Custom Goals Tab ═══
function renderFgCustomGoals(){
  const el = document.getElementById('fg-panel-custom'); if(!el) return;
  const customs = (S.freelancerGoals && S.freelancerGoals.custom) || [];

  const GOAL_CATS = [
    {id:'health',   icon:'<i class="fa-solid fa-dumbbell"></i>', label:'صحة ورياضة'},
    {id:'skill',    icon:'<i class="fa-solid fa-screwdriver-wrench"></i>', label:'مهارات مهنية'},
    {id:'personal', icon:'<i class="fa-solid fa-seedling"></i>', label:'تطوير شخصي'},
    {id:'finance',  icon:'<i class="fa-solid fa-gem"></i>', label:'ادخار ومال'},
    {id:'project',  icon:'<i class="fa-solid fa-rocket"></i>', label:'مشروع خاص'},
    {id:'other',    icon:'<i class="fa-solid fa-star"></i>', label:'أخرى'},
  ];

  const byCat = {};
  GOAL_CATS.forEach(c => { byCat[c.id] = customs.filter(g => g.cat === c.id); });
  const uncatted = customs.filter(g => !g.cat || !GOAL_CATS.find(c=>c.id===g.cat));
  if(uncatted.length) byCat['other'] = [...(byCat['other']||[]), ...uncatted];

  const goalCard = (g) => {
    const pct = g.progress || 0;
    const col = pct>=100?'var(--accent3)':pct>=50?'var(--accent2)':'var(--accent)';
    const steps = g.steps||[];
    const stepsHtml = steps.length ? `<div style="margin:8px 0;display:flex;flex-direction:column;gap:4px">
      ${steps.slice(0,3).map((s,i)=>`<div style="display:flex;align-items:center;gap:7px;font-size:11px;${s.done?'color:var(--text3)':'color:var(--text2)'}">
        <div style="width:14px;height:14px;border-radius:4px;${s.done?'background:var(--accent3);border:none':'border:1.5px solid var(--border)'};flex-shrink:0;display:flex;align-items:center;justify-content:center;cursor:pointer" onclick="toggleCustomGoalStep(${g.id},${i})">
          ${s.done?'<svg width="9" height="9" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round"/></svg>':''}
        </div>
        <span style="${s.done?'text-decoration:line-through':''}">${s.title||''}</span>
      </div>`).join('')}
      ${steps.length>3?`<div style="font-size:10px;color:var(--text3)">+ ${steps.length-3} خطوات أخرى</div>`:''}
    </div>` : '';
    return `<div class="card" style="padding:16px">
      <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px">
        <div style="font-size:14px;font-weight:800;flex:1">${g.title||''}</div>
        <div style="display:flex;gap:4px">
          <button onclick="openCustomGoalModal(${g.id})" class="btn btn-ghost btn-sm"><i class="fa-solid fa-pen"></i></button>
          <button onclick="delCustomGoal(${g.id})" class="btn btn-danger btn-sm"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
      ${g.desc?`<div style="font-size:12px;color:var(--text2);margin-bottom:10px;line-height:1.6">${g.desc}</div>`:''}
      ${stepsHtml}
      <div style="display:flex;align-items:center;gap:8px;margin-top:8px">
        <div style="flex:1;height:7px;background:var(--surface3);border-radius:4px;overflow:hidden">
          <div style="height:100%;width:${pct}%;background:${col};border-radius:4px;transition:.4s"></div>
        </div>
        <span style="font-size:12px;font-weight:800;color:${col};min-width:32px">${pct}%</span>
      </div>
      ${g.deadline?`<div style="font-size:11px;color:var(--text3);margin-top:6px"><i class="fa-solid fa-alarm-clock"></i> ${g.deadline}</div>`:''}
      <div style="display:flex;gap:6px;margin-top:10px">
        ${pct<100?`<button onclick="openCustomGoalModal(${g.id})" class="btn btn-ghost btn-sm" style="flex:1">تعديل التقدم</button>`:''}
        ${pct<100?`<button onclick="quickMarkCustomDone(${g.id})" class="btn btn-ghost btn-sm" style="color:var(--accent3)"><i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> أكمل</button>`:`<span style="font-size:11px;color:var(--accent3);font-weight:700;padding:4px 10px;background:rgba(79,209,165,.1);border-radius:8px"><i class="fa-solid fa-champagne-glasses"></i> مكتمل!</span>`}
      </div>
    </div>`;
  };

  if(!customs.length){
    el.innerHTML = `<div class="empty card" style="padding:40px;text-align:center"><div class="empty-icon"><i class="fa-solid fa-star"></i></div><div style="margin-bottom:16px">أضف أهدافك الخاصة — صحة، مهارات، مشاريع...</div><button class="btn btn-primary" onclick="openCustomGoalModal()"><i class="fa-solid fa-bullseye" style="margin-left:5px"></i> هدف جديد</button></div>`;
    return;
  }

  let html = '';
  GOAL_CATS.forEach(cat => {
    const goals = byCat[cat.id] || [];
    if(!goals.length) return;
    const done = goals.filter(g=>(g.progress||0)>=100).length;
    html += `<div style="margin-bottom:24px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div style="font-size:13px;font-weight:800;color:var(--text2)">${cat.icon} ${cat.label} <span style="color:var(--text3);font-weight:400">(${done}/${goals.length})</span></div>
        <button onclick="openCustomGoalModal(null,'${cat.id}')" style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:4px 10px;font-size:11px;color:var(--accent);cursor:pointer;font-family:var(--font)">+ إضافة</button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px">
        ${goals.map(g=>goalCard(g)).join('')}
      </div>
    </div>`;
  });

  el.innerHTML = html;
}

function toggleCustomGoalStep(goalId, stepIdx){
  if(!S.freelancerGoals) return;
  const g = (S.freelancerGoals.custom||[]).find(x=>x.id===goalId); if(!g||!g.steps) return;
  g.steps[stepIdx].done = !g.steps[stepIdx].done;
  const dc = g.steps.filter(s=>s.done).length;
  g.progress = Math.round((dc/g.steps.length)*100);
  lsSave(); renderFgCustomGoals();
}

function quickMarkCustomDone(id){
  if(!S.freelancerGoals) return;
  const g = (S.freelancerGoals.custom||[]).find(x=>x.id===id); if(!g) return;
  g.progress = 100;
  if(g.steps) g.steps.forEach(s=>s.done=true);
  lsSave(); renderFgCustomGoals();
  if(typeof celebrateCompletion==='function') celebrateCompletion('<i class="fa-solid fa-champagne-glasses"></i> أنجزت: '+(g.title||''));
}

function delCustomGoal(id){
  confirmDel('حذف هذا الهدف؟', ()=>{
    if(!S.freelancerGoals) return;
    S.freelancerGoals.custom = (S.freelancerGoals.custom||[]).filter(g=>g.id!==id);
    lsSave(); renderFgCustomGoals();
  });
}

// ══ Custom Goal Modal ══
function openCustomGoalModal(id, presetCat){
  if(!S.freelancerGoals) S.freelancerGoals = {};
  if(!S.freelancerGoals.custom) S.freelancerGoals.custom = [];
  window._editCustomGoalSteps = [];
  const g = id ? S.freelancerGoals.custom.find(x=>x.id===id) : null;
  if(g) window._editCustomGoalSteps = (g.steps||[]).map(s=>({...s}));

  const GOAL_CATS = [
    {id:'health',icon:'<i class="fa-solid fa-dumbbell"></i>',label:'صحة ورياضة'},{id:'skill',icon:'<i class="fa-solid fa-screwdriver-wrench"></i>',label:'مهارات مهنية'},
    {id:'personal',icon:'<i class="fa-solid fa-seedling"></i>',label:'تطوير شخصي'},{id:'finance',icon:'<i class="fa-solid fa-gem"></i>',label:'ادخار ومال'},
    {id:'project',icon:'<i class="fa-solid fa-rocket"></i>',label:'مشروع خاص'},{id:'other',icon:'<i class="fa-solid fa-star"></i>',label:'أخرى'},
  ];
  const catOpts = GOAL_CATS.map(c=>`<option value="${c.id}" ${(g?g.cat:presetCat)===c.id?'selected':''}>${c.icon} ${c.label}</option>`).join('');

  const existingModal = document.getElementById('_modal-custom-goal');
  if(existingModal) existingModal.remove();

  const wrap = document.createElement('div');
  wrap.id = '_modal-custom-goal';
  wrap.className = 'modal-overlay';
  wrap.style.display='flex';
  wrap.innerHTML = `<div class="modal" style="max-width:540px;max-height:85vh;display:flex;flex-direction:column">
    <div class="modal-header" style="flex-shrink:0">
      <div class="modal-title">${g?'<i class="fa-solid fa-pen"></i> تعديل الهدف':'<i class="fa-solid fa-star"></i> هدف جديد'}</div>
      <button class="close-btn" onclick="document.getElementById('_modal-custom-goal').remove()"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div style="overflow-y:auto;flex:1">
      <input type="hidden" id="_cg-eid" value="${id||''}">
      <div class="form-row">
        <div class="form-group" style="flex:2"><label class="form-label">عنوان الهدف *</label><input class="form-input" id="_cg-title" value="${g?g.title||'':''}" placeholder="مثال: أتعلم After Effects في 30 يوم"></div>
        <div class="form-group"><label class="form-label">التصنيف</label><select class="form-select" id="_cg-cat">${catOpts}</select></div>
      </div>
      <div class="form-group"><label class="form-label">وصف الهدف وتفاصيله</label><textarea class="form-textarea" id="_cg-desc" placeholder="اكتب تفاصيل الهدف، خطتك، سبب أهميته..." style="min-height:80px">${g?g.desc||'':''}</textarea></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">التقدم الحالي %</label>
          <div style="display:flex;gap:8px;align-items:center">
            <input type="range" class="form-input" id="_cg-pct" min="0" max="100" value="${g?g.progress||0:0}" oninput="document.getElementById('_cg-pct-disp').textContent=this.value+'%'" style="flex:1">
            <span id="_cg-pct-disp" style="font-size:12px;font-weight:800;color:var(--accent);width:35px">${g?g.progress||0:0}%</span>
          </div>
        </div>
        <div class="form-group"><label class="form-label">الموعد النهائي</label><input class="form-input" type="date" id="_cg-deadline" value="${g?g.deadline||'':''}"></div>
      </div>
      <!-- Steps -->
      <div style="margin-top:4px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <div style="font-size:12px;font-weight:800;color:var(--accent)"><i class="fa-solid fa-clipboard-list"></i> خطوات الهدف <span style="font-size:10px;color:var(--text3);font-weight:400">(اختياري)</span></div>
          <button onclick="_addCustomGoalStep()" style="padding:5px 12px;background:var(--accent);color:#fff;border:none;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer;font-family:var(--font)">+ خطوة</button>
        </div>
        <div id="_cg-steps-list" style="display:flex;flex-direction:column;gap:5px"></div>
      </div>
    </div>
    <div style="display:flex;gap:10px;justify-content:flex-end;padding-top:14px;border-top:1px solid var(--border);margin-top:10px;flex-shrink:0">
      <button class="btn btn-ghost" onclick="document.getElementById('_modal-custom-goal').remove()">إلغاء</button>
      <button class="btn btn-primary" onclick="saveCustomGoal()" data-i18n="btn_save"><i class="fa-solid fa-floppy-disk" style="margin-left:4px"></i> حفظ</button>
    </div>
  </div>`;
  document.body.appendChild(wrap);
  _renderCustomGoalSteps();
}

function _renderCustomGoalSteps(){
  const el = document.getElementById('_cg-steps-list'); if(!el) return;
  const steps = window._editCustomGoalSteps || [];
  if(!steps.length){
    el.innerHTML='<div style="text-align:center;padding:12px;color:var(--text3);font-size:12px;border:1.5px dashed var(--border);border-radius:8px">لا خطوات — اضغط + خطوة</div>';
    return;
  }
  el.innerHTML = steps.map((s,i)=>`
    <div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--surface2);border-radius:8px;border:1px solid ${s.done?'var(--accent3)':'var(--border)'}">
      <div class="_cs-item-check${s.done?' checked':''}" onclick="window._editCustomGoalSteps[${i}].done=!window._editCustomGoalSteps[${i}].done;_renderCustomGoalSteps()" style="cursor:pointer;flex-shrink:0">
        ${s.done?'<svg width="10" height="10" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round"/></svg>':''}
      </div>
      <input type="text" value="${(s.title||'').replace(/"/g,'&quot;')}" oninput="window._editCustomGoalSteps[${i}].title=this.value" placeholder="عنوان الخطوة" style="background:transparent;border:none;color:var(--text);font-size:13px;font-family:var(--font);flex:1;outline:none;${s.done?'text-decoration:line-through;color:var(--text3)':''}">
      <button onclick="window._editCustomGoalSteps.splice(${i},1);_renderCustomGoalSteps()" style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:13px"><i class="fa-solid fa-xmark"></i></button>
    </div>`).join('');
}

function _addCustomGoalStep(){
  if(!window._editCustomGoalSteps) window._editCustomGoalSteps=[];
  window._editCustomGoalSteps.push({id:Date.now(),title:'',done:false});
  _renderCustomGoalSteps();
}

function saveCustomGoal(){
  const title = document.getElementById('_cg-title')?.value.trim();
  if(!title) return alert('أدخل عنوان الهدف');
  if(!S.freelancerGoals) S.freelancerGoals={};
  if(!S.freelancerGoals.custom) S.freelancerGoals.custom=[];
  const eid = document.getElementById('_cg-eid')?.value;
  const steps = (window._editCustomGoalSteps||[]).map(s=>({...s}));
  const stepsDone = steps.filter(s=>s.done).length;
  const autoPct = steps.length ? Math.round((stepsDone/steps.length)*100) : +(document.getElementById('_cg-pct')?.value||0);
  const d = {
    id:       eid ? +eid : Date.now(),
    title,
    cat:      document.getElementById('_cg-cat')?.value || 'other',
    desc:     document.getElementById('_cg-desc')?.value || '',
    progress: autoPct,
    deadline: document.getElementById('_cg-deadline')?.value || '',
    steps
  };
  if(eid){ const idx=S.freelancerGoals.custom.findIndex(g=>g.id===+eid); if(idx>-1) S.freelancerGoals.custom[idx]=d; }
  else S.freelancerGoals.custom.push(d);
  document.getElementById('_modal-custom-goal')?.remove();
  lsSave(); renderFgCustomGoals();
  if(typeof showMiniNotif==='function') showMiniNotif('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم حفظ الهدف: '+title);
}

function openFreelancerGoalModal(type){
  type=type||'financial';
  const fg=S.freelancerGoals||{};
  const now=new Date();
  let inner='';
  if(type==='financial'){
    const d=fg.financial||{};
    inner=`
      <div class="form-group"><label class="form-label">الهدف الشهري (ج)</label><input class="form-input" id="fgf-target" type="number" value="${d.target||''}" placeholder="5000"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div class="form-group"><label class="form-label">الشهر</label><select class="form-select" id="fgf-month">
          ${Array.from({length:12},(_,i)=>`<option value="${i+1}" ${(d.month||now.getMonth()+1)===i+1?'selected':''}>${new Date(2024,i).toLocaleString('ar-EG',{month:'long'})}</option>`).join('')}
        </select></div>
        <div class="form-group"><label class="form-label">السنة</label><input class="form-input" id="fgf-year" type="number" value="${d.year||now.getFullYear()}"></div>
      </div>
      <button class="btn btn-primary" style="width:100%" onclick="saveFgGoal('financial')"><i class="fa-solid fa-floppy-disk"></i> حفظ الهدف</button>`;
  } else if(type==='tasks'){
    const d=fg.tasks||{};
    const m=now.getMonth()+1; const ms=m<10?'0':'';
    const lastDay=new Date(now.getFullYear(),m,0).getDate();
    inner=`
      <div class="form-group"><label class="form-label">عدد الأوردرات المستهدفة</label><input class="form-input" id="fgt-target" type="number" value="${d.target||''}" placeholder="10"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div class="form-group"><label class="form-label">من</label><input class="form-input" id="fgt-start" type="date" value="${d.startDate||now.getFullYear()+'-'+ms+m+'-01'}"></div>
        <div class="form-group"><label class="form-label">إلى</label><input class="form-input" id="fgt-end" type="date" value="${d.endDate||now.getFullYear()+'-'+ms+m+'-'+lastDay}"></div>
      </div>
      <button class="btn btn-primary" style="width:100%" onclick="saveFgGoal('tasks')"><i class="fa-solid fa-floppy-disk"></i> حفظ الهدف</button>`;
  } else {
    inner=`<div style="text-align:center;padding:20px"><button class="btn btn-primary" onclick="closeM('_modal-fg');openGoalModal()">+ إضافة هدف تعليمي</button></div>`;
  }
  const titles={financial:'<i class="fa-solid fa-coins"></i> الهدف المالي',tasks:'<i class="fa-solid fa-clipboard-list"></i> هدف الأوردرات',learning:'<i class="fa-solid fa-diamond"></i> هدف تعليمي'};
  let modal=document.getElementById('_modal-fg');
  if(!modal){
    modal=document.createElement('div');
    modal.id='_modal-fg';
    modal.className='modal-overlay';
    modal.innerHTML='<div class="modal" style="max-width:460px" id="_modal-fg-inner"></div>';
    document.body.appendChild(modal);
    modal.addEventListener('click',e=>{if(e.target===modal)closeM('_modal-fg');});
  }
  document.getElementById('_modal-fg-inner').innerHTML=`
    <div class="modal-header">
      <div class="modal-title">${titles[type]||'هدف جديد'}</div>
      <button class="close-btn" onclick="closeM('_modal-fg')"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div style="padding:20px">${inner}</div>`;
  openM('_modal-fg');
}

function saveFgGoal(type){
  if(!S.freelancerGoals) S.freelancerGoals={};
  if(type==='financial'){
    const target=+document.getElementById('fgf-target')?.value;
    const month=+document.getElementById('fgf-month')?.value;
    const year=+document.getElementById('fgf-year')?.value;
    if(!target||!month||!year){toast('أدخل جميع البيانات');return;}
    S.freelancerGoals.financial={target,month,year};
  } else if(type==='tasks'){
    const target=+document.getElementById('fgt-target')?.value;
    const startDate=document.getElementById('fgt-start')?.value;
    const endDate=document.getElementById('fgt-end')?.value;
    if(!target||!startDate||!endDate){toast('أدخل جميع البيانات');return;}
    S.freelancerGoals.tasks={target,startDate,endDate};
  }
  lsSave(); cloudSave(S); closeM('_modal-fg');
  renderDashWidgets(); renderFgBanner();
  const activeTab = document.querySelector('#page-freelancer-goals .filter-chip.active');
  if(activeTab) switchFgTab(type);
  checkGoalMilestones();
  toast('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم حفظ الهدف');
}

function checkGoalMilestones(){
  const fg=S.freelancerGoals||{};
  if(fg.financial){
    const {target,month,year}=fg.financial;
    const ms=year+'-'+(month<10?'0':'')+month;
    const actual=(S.transactions||[]).filter(t=>t.type==='income'&&(t.isoDate||'').startsWith(ms)).reduce((s,t)=>s+(+t.amount||0),0);
    const pct=Math.round(actual/(target||1)*100);
    const key='_fg_fin_'+ms+'_'+Math.floor(pct/25);
    if(pct>=100 && !sessionStorage.getItem(key)){
      sessionStorage.setItem(key,'1');
      showMotivationalNotif('<i class="fa-solid fa-champagne-glasses"></i> مبروك! حققت هدفك المالي! '+actual.toLocaleString()+' ج <i class="fa-solid fa-trophy"></i>','var(--accent3)');
    } else if(pct>=75 && !sessionStorage.getItem(key)){
      sessionStorage.setItem(key,'1');
      showMotivationalNotif('<i class="fa-solid fa-dumbbell"></i> رائع! وصلت لـ '+pct+'% من هدفك المالي!','var(--accent2)');
    }
  }
}

function showMotivationalNotif(msg, color){
  color=color||'var(--accent)';
  const el=document.createElement('div');
  el.style.cssText=`position:fixed;top:70px;left:50%;transform:translateX(-50%);z-index:99999;background:var(--surface2);border:2px solid ${color};border-radius:14px;padding:14px 22px;font-size:13px;font-weight:700;color:var(--text);box-shadow:0 8px 32px rgba(0,0,0,.35);cursor:pointer;max-width:380px;text-align:center;animation:_notifSlide .35s ease`;
  el.textContent=msg;
  el.onclick=()=>el.remove();
  document.body.appendChild(el);
  setTimeout(()=>{ try{el.remove();}catch(e){} },6000);
}

// ═══════════════════════════════════════════════════
// 6. CELEBRATION ON TASK COMPLETION
// ═══════════════════════════════════════════════════
function celebrateCompletion(msg){
  msg=msg||'<i class="fa-solid fa-champagne-glasses"></i> تم إنجاز المهمة!';
  const cols=['#7c6ff7','#f7c948','#4fd1a5','#f76f7c','#64b5f6','#fff','#ff9f43'];
  for(let i=0;i<55;i++){
    const c=document.createElement('div');
    const sz=Math.random()*9+5;
    c.style.cssText=`position:fixed;top:-20px;left:${Math.random()*100}vw;width:${sz}px;height:${sz}px;background:${cols[Math.floor(Math.random()*cols.length)]};border-radius:${Math.random()>.5?'50%':'3px'};pointer-events:none;z-index:99998;animation:_confettiFall ${1.5+Math.random()*2}s ease-in forwards`;
    c.style.setProperty('--tx',(Math.random()*120-60)+'px');
    document.body.appendChild(c);
    setTimeout(()=>{try{c.remove();}catch(e){}},4000);
  }
  const ov=document.createElement('div');
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:99997;display:flex;align-items:center;justify-content:center';
  ov.innerHTML=`<div style="background:var(--surface2);border-radius:20px;padding:40px 48px;text-align:center;animation:_celebIn .4s cubic-bezier(.34,1.56,.64,1);border:2px solid var(--accent3);box-shadow:0 20px 60px rgba(0,0,0,.4)">
    <div style="font-size:56px;margin-bottom:10px"><i class="fa-solid fa-champagne-glasses"></i></div>
    <div style="font-size:18px;font-weight:900;margin-bottom:8px">${msg}</div>
    <div style="font-size:12px;color:var(--text3);margin-bottom:18px">أحسنت! استمر في التميز <i class="fa-solid fa-dumbbell"></i></div>
    <button onclick="this.closest('[style*=fixed]').remove()" class="btn btn-primary" style="padding:10px 32px">رائع! <i class="fa-solid fa-rocket"></i></button>
  </div>`;
  ov.addEventListener('click',e=>{if(e.target===ov)ov.remove();});
  document.body.appendChild(ov);
  setTimeout(()=>{try{ov.remove();}catch(e){}},5000);
}

// Patch confirmComplete to add celebration (safe: called after load)
window.addEventListener('load', function(){
  const _cc = confirmComplete;
  confirmComplete = function(){
    const id=+document.getElementById('complete-task-id')?.value;
    const t=(S.tasks||[]).find(t=>t.id===id);
    const title=t?.title||'المهمة';
    if(t) t.doneAt = t.doneAt || new Date().toISOString().split('T')[0];
    _cc();
    setTimeout(()=>{ celebrateCompletion('تم إنجاز: '+title); checkGoalMilestones(); }, 300);
  };

  // Init freelancerGoals in S
  if(typeof S !== 'undefined'){
    if(!S.freelancerGoals) S.freelancerGoals={};
    if(typeof PAGE_TITLES !== 'undefined') PAGE_TITLES['freelancer-goals']='الأهداف والإنجازات';
    if(typeof PAGE_CTA !== 'undefined')    PAGE_CTA['freelancer-goals']={label:'+ هدف جديد',fn:'openFreelancerGoalModal()'};
  }
});

// ═══════════════════════════════════════════════════
// DASHBOARD PRESET LAYOUTS
// ═══════════════════════════════════════════════════
var _DASH_PRESETS_MAP = {
  default: [
    {id:'stats',       visible:true,  row:0, full:true},
    {id:'commitment',  visible:true,  row:0, full:false},
    {id:'momentum',    visible:true,  row:0, full:false},
    {id:'upcoming',    visible:true,  row:1, full:false},
    {id:'overdue',     visible:true,  row:1, full:false},
    {id:'subs',        visible:true,  row:1, full:false},
    {id:'expected',    visible:true,  row:2, full:true},
    {id:'kanban',      visible:true,  row:3, full:false},
    {id:'uncollected', visible:true,  row:3, full:false},
    {id:'team',        visible:true,  row:4, full:false},
    {id:'teampay',     visible:true,  row:4, full:false},
    {id:'tasks',       visible:true,  row:5, full:false},
    {id:'schedule',    visible:true,  row:5, full:false},
    {id:'invoices',    visible:true,  row:6, full:false},
    {id:'goals',       visible:true,  row:6, full:false},
    {id:'meetings',    visible:true,  row:7, full:true},
  ],
  compact: [
    {id:'stats',       visible:true,  row:0, full:true},
    {id:'kanban',      visible:true,  row:1, full:false},
    {id:'overdue',     visible:true,  row:1, full:false},
    {id:'tasks',       visible:true,  row:2, full:true},
    {id:'schedule',    visible:false, row:3, full:false},
    {id:'subs',        visible:false, row:3, full:false},
    {id:'uncollected', visible:false, row:4, full:false},
    {id:'team',        visible:false, row:4, full:false},
    {id:'teampay',     visible:false, row:5, full:false},
    {id:'invoices',    visible:false, row:5, full:false},
    {id:'goals',       visible:false, row:6, full:false},
    {id:'meetings',    visible:false, row:6, full:true},
  ],
  finance: [
    {id:'stats',       visible:true,  row:0, full:true},
    {id:'invoices',    visible:true,  row:1, full:false},
    {id:'uncollected', visible:true,  row:1, full:false},
    {id:'teampay',     visible:true,  row:2, full:false},
    {id:'subs',        visible:true,  row:2, full:false},
    {id:'kanban',      visible:false, row:3, full:false},
    {id:'overdue',     visible:false, row:3, full:false},
    {id:'tasks',       visible:false, row:4, full:false},
    {id:'schedule',    visible:false, row:4, full:false},
    {id:'team',        visible:false, row:5, full:false},
    {id:'goals',       visible:false, row:5, full:false},
    {id:'meetings',    visible:false, row:6, full:true},
  ],
  team: [
    {id:'stats',       visible:true,  row:0, full:true},
    {id:'team',        visible:true,  row:1, full:false},
    {id:'teampay',     visible:true,  row:1, full:false},
    {id:'kanban',      visible:true,  row:2, full:true},
    {id:'meetings',    visible:true,  row:3, full:true},
    {id:'overdue',     visible:false, row:4, full:false},
    {id:'subs',        visible:false, row:4, full:false},
    {id:'uncollected', visible:false, row:5, full:false},
    {id:'tasks',       visible:false, row:5, full:false},
    {id:'schedule',    visible:false, row:6, full:false},
    {id:'invoices',    visible:false, row:6, full:false},
    {id:'goals',       visible:false, row:7, full:false},
  ],
  // Mobile: all cards full-width stacked
  mobile: [
    {id:'stats',       visible:true,  row:0, full:true},
    {id:'overdue',     visible:true,  row:1, full:true},
    {id:'kanban',      visible:true,  row:2, full:true},
    {id:'tasks',       visible:true,  row:3, full:true},
    {id:'upcoming',    visible:true,  row:4, full:true},
    {id:'uncollected', visible:true,  row:5, full:true},
    {id:'invoices',    visible:true,  row:6, full:true},
    {id:'schedule',    visible:false, row:7, full:true},
    {id:'subs',        visible:false, row:8, full:true},
    {id:'team',        visible:false, row:9, full:true},
    {id:'teampay',     visible:false, row:10, full:true},
    {id:'goals',       visible:false, row:11, full:true},
    {id:'meetings',    visible:false, row:12, full:true},
    {id:'commitment',  visible:false, row:13, full:true},
    {id:'momentum',    visible:false, row:14, full:true},
    {id:'expected',    visible:false, row:15, full:true},
  ],
};

function _resetDashLayout(){
  if(!confirm('هل تريد إعادة الداشبورد للإعدادات الافتراضية؟')) return;
  localStorage.removeItem('_dash_layout_v3');
  _renderDashGrid();
  toast('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم إعادة الضبط للافتراضي');
}

function _applyDashPreset(name) {
  var preset = _DASH_PRESETS_MAP[name] || _DASH_PRESETS_MAP.default;
  _saveDashLayout(preset.map(function(w){ return {id:w.id,visible:w.visible,row:w.row,full:w.full}; }));
  _dashEditMode = false;
  var btn    = document.getElementById('_dash-edit-btn');
  var banner = document.getElementById('_dash-edit-banner');
  if(btn){ btn.style.borderColor='var(--border)'; btn.style.color='var(--text3)'; btn.style.background='var(--surface2)'; }
  if(banner) banner.style.display='none';
  _renderDashGrid();
  if(typeof toast === 'function') toast('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم تطبيق القالب');
}

