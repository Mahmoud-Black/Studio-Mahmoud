// ============================================================
// FINANCE
// ============================================================
function onIncomeTaskLink(){
  const taskSel = document.getElementById('in-linked-task');
  const srcEl   = document.getElementById('in-source');
  if(!taskSel||!srcEl) return;
  const taskId = +taskSel.value;
  if(taskId){
    const t = S.tasks.find(x=>x.id===taskId);
    if(t && !srcEl.value) srcEl.value = t.client||'';
    const amtEl = document.getElementById('in-amount');
    if(t && amtEl && !amtEl.value) amtEl.value = t.value||'';
  }
}

function onIncomeProjectLink(){
  const projSel = document.getElementById('in-linked-project');
  if(!projSel || !projSel.value) return;
  const proj = (S.projects||[]).find(p => String(p.id) === String(projSel.value));
  if(!proj) return;
  // Auto-fill desc if empty
  const descEl = document.getElementById('in-desc');
  if(descEl && !descEl.value) descEl.value = 'دفعة مشروع: ' + proj.name;
}

function _fillOpenIncomeProject(projId) {
  // Call this when opening income modal from project page
  const projSel = document.getElementById('in-linked-project');
  if(!projSel) return;
  // Make sure all projects are loaded
  projSel.innerHTML = '<option value="">— لا يوجد مشروع —</option>';
  (S.projects||[]).forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.name;
    projSel.appendChild(opt);
  });
  if(projId) projSel.value = String(projId);
}
function openIncomeModal(id, prefillTaskId){
  document.getElementById('income-ttl').innerHTML=id?'<i class="fa-solid fa-coins"></i> تعديل دخل':'<i class="fa-solid fa-coins"></i> تسجيل دخل';
  document.getElementById('income-eid').value=id||'';
  // Populate clients dropdown (replaces datalist)
  fillIncomeClientDropdown();
  // Populate payment methods from custom accounts
  fillPayMethodDropdowns();
  if(id){const t=S.transactions.find(t=>t.id===id);if(t){
    document.getElementById('in-amount').value=t.amount;
    // Set client in dropdown
    const srcSel = document.getElementById('in-source');
    if(srcSel) {
      if([...srcSel.options].some(o=>o.value===t.source)) srcSel.value=t.source||'';
      else srcSel.value='';
    }
    document.getElementById('in-desc').value=t.desc||'';
    document.getElementById('in-date').value=t.isoDate||'';
    // After setting client, filter projects
    if(t.source) onIncomeClientChange(t.source);
    const taskSel = document.getElementById('in-linked-task');
    if(taskSel) setTimeout(()=>{ taskSel.value=t.linkedTaskId||''; }, 50);
    setTimeout(()=>{ _fillOpenIncomeProject(t.project_id||''); }, 60);
    const ptEl=document.getElementById('in-payment-type'); if(ptEl) ptEl.value=t.paymentType||'full';
    const pmEl=document.getElementById('in-pay-method');  if(pmEl) pmEl.value=t.payMethod||'cash';
  }}
  else{
    ['in-amount','in-desc'].forEach(f=>{const e=document.getElementById(f);if(e)e.value='';});
    const srcSel=document.getElementById('in-source'); if(srcSel) srcSel.value='';
    document.getElementById('in-date').value=new Date().toISOString().split('T')[0];
    // If prefillTaskId, find client and preselect
    if(prefillTaskId){
      const task=S.tasks.find(t=>t.id==prefillTaskId);
      if(task&&task.client){
        setTimeout(()=>{
          const srcSel=document.getElementById('in-source');
          if(srcSel) srcSel.value=task.client;
          onIncomeClientChange(task.client);
          setTimeout(()=>{
            const taskSel=document.getElementById('in-linked-task');
            if(taskSel) taskSel.value=prefillTaskId;
          },60);
        },30);
      }
    }
    const ptEl=document.getElementById('in-payment-type'); if(ptEl) ptEl.value='full';
    const pmEl=document.getElementById('in-pay-method');  if(pmEl) pmEl.value='cash';
    // Fill projects dropdown for new transaction
    setTimeout(()=>{ _fillOpenIncomeProject(''); }, 20);
  }
  openM('modal-income');
}
function openExpenseModal(id){
  document.getElementById('expense-ttl').innerHTML=id?'<i class="fa-solid fa-money-bill-wave"></i> تعديل مصروف':'<i class="fa-solid fa-money-bill-wave"></i> تسجيل مصروف';
  document.getElementById('expense-eid').value=id||'';
  fillPayMethodDropdowns();
  if(id){const t=S.transactions.find(t=>t.id===id);if(t){
    document.getElementById('ex-amount').value=t.amount;
    document.getElementById('ex-desc').value=t.desc||'';
    document.getElementById('ex-date').value=t.isoDate||'';
    const catEl=document.getElementById('ex-cat'); if(catEl) catEl.value=t.expCat||t.source||'أخرى';
    const pmEl=document.getElementById('ex-pay-method'); if(pmEl) pmEl.value=t.payMethod||'cash';
  }}
  else{
    ['ex-amount','ex-desc'].forEach(f=>{const e=document.getElementById(f);if(e)e.value='';});
    document.getElementById('ex-date').value=new Date().toISOString().split('T')[0];
    const pmEl=document.getElementById('ex-pay-method'); if(pmEl) pmEl.value='cash';
  }
  openM('modal-expense');
}
function saveTrans(type){
  const isInc=type==='income';
  const amount=+(isInc?v('in-amount'):v('ex-amount'));
  if(!amount)return alert('أدخل المبلغ');
  const eid=v(isInc?'income-eid':'expense-eid');
  const rawDate = isInc ? v('in-date') : v('ex-date');
  const isoDate = rawDate || new Date().toISOString().split('T')[0];
  const source = isInc ? v('in-source') : (v('ex-cat')||'أخرى');
  const linkedTaskId  = isInc ? (+(document.getElementById('in-linked-task')?.value)||null) : null;
  const linkedProjId  = isInc ? (document.getElementById('in-linked-project')?.value||null) : null;
  const linkedProjObj = linkedProjId ? (S.projects||[]).find(p=>String(p.id)===String(linkedProjId)) : null;
  const paymentType  = isInc ? (document.getElementById('in-payment-type')?.value||'full') : null;
  const payMethod    = isInc ? (document.getElementById('in-pay-method')?.value||'cash') : (document.getElementById('ex-pay-method')?.value||'cash');
  const expCat       = !isInc ? (v('ex-cat')||'أخرى') : null;
  const expImpact    = !isInc ? (document.querySelector('input[name="ex-profit-impact"]:checked')?.value||'work') : null;
  // Auto-fill source from linked task
  let finalSource = source;
  if(isInc && linkedTaskId && !source){
    const lt = S.tasks.find(t=>t.id===linkedTaskId);
    if(lt) finalSource = lt.client||lt.title;
  }
  const incRcpt = isInc ? (window._incReceiptData||null) : null;
  const isLoanTrans = isInc && paymentType==='loan_received';
  const d={type,amount,source:finalSource,desc:v(isInc?'in-desc':'ex-desc'),
    date:new Date(isoDate+'T00:00:00').toLocaleDateString('ar-EG'), isoDate,
    payMethod,
    ...(linkedTaskId  ? {linkedTaskId}  : {}),
    ...(linkedProjId  ? {project_id: String(linkedProjId), project_name: linkedProjObj?.name||''} : {}),
    ...(paymentType   ? {paymentType}   : {}),
    ...(expCat       ? {expCat}       : {}),
    ...(expImpact    ? {expImpact}    : {}),
    ...(incRcpt      ? {receiptImage:incRcpt} : {}),
    ...(isLoanTrans  ? {isLoan:true}  : {})};
  if(eid){const i=S.transactions.findIndex(t=>t.id==eid);if(i>-1){d.id=+eid;if(!incRcpt&&S.transactions[i].receiptImage)d.receiptImage=S.transactions[i].receiptImage;S.transactions[i]=d;}}
  else{d.id=Date.now();S.transactions.push(d);}
  if(isInc) window._incReceiptData=null;
  // تسجيل تلقائي في القروض
  if(isInc && paymentType==='loan_received'){
    const lPerson=(document.getElementById('in-loan-person')?.value||'').trim();
    if(lPerson){
      if(!S.loans) S.loans=[];
      S.loans.push({id:'ln_'+Date.now(),direction:'borrowed',amount,
        person:lPerson,phone:document.getElementById('in-loan-phone')?.value||'',
        date:isoDate,due:document.getElementById('in-loan-due')?.value||'',
        notes:'',status:'pending',settledAmount:0,
        createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});
      toast('🤝 تم تسجيل القرض في صفحة القروض');
    }
  }
  if(!isInc && expCat==='سلفة للغير'){
    const lPerson=(document.getElementById('ex-loan-person')?.value||'').trim();
    if(lPerson){
      if(!S.loans) S.loans=[];
      S.loans.push({id:'ln_'+Date.now(),direction:'lent',amount,
        person:lPerson,phone:document.getElementById('ex-loan-phone')?.value||'',
        date:isoDate,due:document.getElementById('ex-loan-due')?.value||'',
        notes:'',status:'pending',settledAmount:0,
        createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});
      toast('🤝 تم تسجيل السلفة في صفحة القروض');
    }
  }
  lsSave();closeM(isInc?'modal-income':'modal-expense');renderAll();
  // Auto-print receipt for income transactions
  if(isInc){
    const savedId = eid ? +eid : S.transactions[S.transactions.length-1]?.id;
    if(savedId) setTimeout(()=>exportReceipt(savedId), 400);
  }
}
function delTrans(id){
  confirmDel('هل تريد حذف هذه المعاملة؟',()=>{
    // لو المعاملة مرتبطة بـ project_task، ضع flag عشان الـ sync مش يرجعها
    var tx=S.transactions.find(t=>String(t.id)===String(id));
    if(tx && tx.linkedProjTaskId){
      var pt=(S.project_tasks||[]).find(t=>String(t.id)===String(tx.linkedProjTaskId));
      if(pt) pt._txDeleted=true;
    }
    S.transactions=S.transactions.filter(t=>String(t.id)!==String(id));
    lsSave();cloudSave(S);renderAll();
  });
}
// Finance filter state
let finFilterState = {month:'', year:'', type:'', method:'', cat:'', project:''};

function populateFinYears(){
  const sel = document.getElementById('fin-filter-year'); if(!sel) return;
  const cur = sel.value;
  sel.innerHTML = '<option value="">كل السنوات</option>';
  const years = [...new Set(S.transactions.map(t=>t.isoDate?t.isoDate.slice(0,4):null).filter(Boolean))].sort();
  const thisYear = new Date().getFullYear().toString();
  if(!years.includes(thisYear)) years.push(thisYear);
  years.sort().forEach(y=>{const o=document.createElement('option');o.value=y;o.textContent=y;sel.appendChild(o);});
  sel.value = cur;
}

function applyFinanceFilter(){
  finFilterState.month   = document.getElementById('fin-filter-month')?.value||'';
  finFilterState.year    = document.getElementById('fin-filter-year')?.value||'';
  finFilterState.type    = document.getElementById('fin-filter-type')?.value||'';
  finFilterState.method  = document.getElementById('fin-filter-method')?.value||'';
  finFilterState.cat     = document.getElementById('fin-filter-cat')?.value||'';
  finFilterState.project = document.getElementById('fin-filter-project')?.value||'';
  renderFinance();
}

function resetFinanceFilter(){
  finFilterState = {month:'',year:'',type:'',method:'',cat:'',project:''};
  ['fin-filter-month','fin-filter-year','fin-filter-type','fin-filter-method','fin-filter-cat','fin-filter-project'].forEach(id=>{
    const el=document.getElementById(id);if(el)el.value='';
  });
  renderFinance();
}

function filterTransactions(transactions){
  const f = finFilterState;
  return transactions.filter(t=>{
    const d = t.isoDate || '';
    if(f.month   && d.slice(5,7) !== f.month.padStart(2,'0')) return false;
    if(f.year    && d.slice(0,4) !== f.year) return false;
    if(f.type    && t.type !== f.type) return false;
    if(f.method  && (t.payMethod||'cash') !== f.method) return false;
    if(f.cat     && (t.expCat||t.source||'') !== f.cat) return false;
    if(f.project && String(t.project_id||'') !== String(f.project)) return false;
    return true;
  });
}


// ── Sync project task income to S.transactions (auto-record) ──
// ملحوظة: لو المستخدم حذف المعاملة يدوياً، مش بنرجعها تاني
function _syncProjTaskTransactions(){
  if(!S.project_tasks) return;
  if(!S.transactions) S.transactions=[];
  S.project_tasks.forEach(function(t){
    if(!t.paymentCollected || !t.value || t.value<=0) return;
    // لو المستخدم حذف المعاملة يدوياً (manuallyDeleted flag) متتسجلش تاني
    if(t._txDeleted) return;
    // Check if already recorded
    var exists=S.transactions.some(function(tx){return String(tx.linkedProjTaskId)===String(t.id);});
    if(!exists){
      var proj=_getProjById?_getProjById(t.project_id):null;
      S.transactions.push({
        id:Date.now()+Math.random(),
        type:'income',
        amount:t.value,
        currency:t.currency||'ج.م',
        desc:'مهمة مشروع: '+(t.title||'')+(proj?' — '+proj.name:''),
        date:t.createdAt?t.createdAt.slice(0,10):new Date().toISOString().slice(0,10),
        isoDate:t.createdAt?t.createdAt.slice(0,10):new Date().toISOString().slice(0,10),
        linkedProjTaskId:t.id,
        source:'project_task',
        createdAt:new Date().toISOString()
      });
    }
  });
}
function renderFinance(){
  // Sync project task completions into transactions (avoid duplicates)
  _syncProjTaskTransactions();
  populateFinYears();
  // Populate project filter
  (function(){
    var sel = document.getElementById('fin-filter-project');
    if(!sel) return;
    var cur = sel.value;
    sel.innerHTML = '<option value="">كل المشاريع</option>';
    (S.projects||[]).forEach(function(p){
      var opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.name;
      sel.appendChild(opt);
    });
    if(cur) sel.value = cur;
  })();
  renderMonthlyTimeline();
  renderFinLoansSummary();
  const filtered = filterTransactions(S.transactions);
  const f = finFilterState;
  
  // Label for current filter
  const lbl = document.getElementById('fin-filter-label');
  if(lbl){
    const months = ['','يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
    let parts = [];
    if(f.month) parts.push(months[+f.month]||'');
    if(f.year)  parts.push(f.year);
    lbl.innerHTML = parts.length ? '<i class="fa-solid fa-calendar-days"></i> '+parts.join(' ') : '';
  }

  const inc = filtered.filter(t=>t.type==='income'&&!t.isLoan).reduce((s,t)=>s+t.amount,0);
  const exp = filtered.filter(t=>t.type==='expense'&&t.expCat!=='سلفة للغير').reduce((s,t)=>s+t.amount,0);
  const net = inc-exp, margin = inc?Math.round(net/inc*100):0;
  
  // Category breakdown
  const catSum = cat => filtered.filter(t=>t.type==='expense'&&t.source===cat).reduce((s,t)=>s+t.amount,0);
  const personalSum = filtered.filter(t=>t.type==='expense'&&(t.source==='سحب شخصي'||t.source==='مصاريف تعليمية شخصية')).reduce((s,t)=>s+t.amount,0);
  
  // Pending tasks (global, not filtered)
  const pendingTasks=S.tasks.filter(t=>!t.done&&t.status!=='done'&&t.pay!=='full');
  const pendingRev=pendingTasks.reduce((s,t)=>s+(t.value||0),0);
  const depositsPending=pendingTasks.filter(t=>t.pay==='deposit').reduce((s,t)=>s+(t.deposit||0),0);
  
  const set=(id,val)=>{const e=document.getElementById(id);if(e)e.textContent=val;};
  set('fin-in',inc.toLocaleString()+' '+_getCurrency());
  set('fin-in-sub', f.month||f.year ? `(${(f.month?'الشهر':'')+(f.year?' '+f.year:'')})` : '');
  set('fin-out',exp.toLocaleString()+' '+_getCurrency());
  set('fin-net',net.toLocaleString()+' '+_getCurrency());
  set('fin-margin',inc?margin+'%':'—');
  set('fin-pending',pendingRev.toLocaleString()+' '+_getCurrency());
  set('fin-deposits',depositsPending.toLocaleString()+' '+_getCurrency());
  
  // Category cards
  
  // Unpaid task reminders
  renderUnpaidReminders();
  
  const tbody=document.getElementById('fin-tbody');if(!tbody)return;
  const rows = [...filtered].sort((a,b)=>(b.isoDate||'').localeCompare(a.isoDate||'')).map(t=>{
    const projBadge = t.project_id ? (()=>{const pj=(S.projects||[]).find(p=>String(p.id)===String(t.project_id));return pj?` <span style="font-size:10px;background:rgba(79,209,165,.12);color:#4fd1a5;padding:1px 7px;border-radius:8px;cursor:pointer" onclick="showPage('projects');setTimeout(()=>openProjectDetail('${pj.id}'),200)"><i class="fa-solid fa-diagram-project"></i> ${pj.name.slice(0,18)}</span>`:''})() : '';
    return `<tr>
    <td>${t.desc||'—'}${projBadge}${t.linkedTaskId?(()=>{const lt=S.tasks.find(x=>x.id===t.linkedTaskId);return lt?` <span style="font-size:10px;background:rgba(124,111,247,.15);color:var(--accent);padding:1px 6px;border-radius:8px;cursor:pointer" onclick="openTaskDetail(${t.linkedTaskId})"><i class="fa-solid fa-link"></i> ${lt.title.slice(0,20)}</span>`:''})():''}</td><td class="hide-mobile">${t.source||'—'}${t.paymentType&&t.paymentType!=='full'?` <span style="font-size:10px;color:var(--accent2)">(${t.paymentType==='deposit'?'عربون':'جزئي'})</span>`:''}</td>
    <td><span class="badge ${t.type==='income'?'badge-green':'badge-red'}">${t.type==='income'?'<i class="fa-solid fa-coins"></i> دخل':'<i class="fa-solid fa-money-bill-wave"></i> مصروف'}</span></td>
    <td style="font-weight:700;color:${t.type==='income'?'var(--accent3)':'var(--accent4)'}">${t.amount.toLocaleString()} ج</td>
    <td class="hide-mobile" style="font-family:var(--mono);font-size:11px">${t.isoDate||t.date||'—'}</td>
    <td><div style="display:flex;gap:4px">
      <button class="btn btn-ghost btn-sm" onclick="${t.type==='income'?'openIncomeModal':'openExpenseModal'}(${t.id})"><i class="fa-solid fa-pen"></i></button>
      ${t.type==='income'?`<button class="btn btn-ghost btn-sm" onclick="exportReceipt(${t.id})" title="إيصال PDF" style="color:var(--accent3)"><i class="fa-solid fa-receipt"></i></button>`:''}
      <button class="btn btn-danger btn-sm" onclick="delTrans(${t.id})"><i class="fa-solid fa-trash"></i></button>
    </div></td>
  </tr>`;}).join('');
  tbody.innerHTML = rows || '<tr><td colspan="6" style="text-align:center;color:var(--text3);padding:24px">لا معاملات تطابق الفلتر</td></tr>';
}

function renderUnpaidReminders(){
  const wrap = document.getElementById('fin-unpaid-reminders'); if(!wrap) return;
  // Find completed tasks whose payment was not collected
  const _projUncollected=(S.project_tasks||[]).filter(t=>t.status==='done'&&!t.paymentCollected&&t.value>0).map(t=>{
    var proj=_getProjById&&_getProjById(t.project_id);
    return Object.assign({},t,{title:(proj?proj.name+' — ':'')+t.title,_isProjTask:true});
  });
  const uncollected = [...S.tasks.filter(t=>t.done && !t.paymentCollected && t.value>0), ..._projUncollected];

  // تذكيرات القروض المتأخرة
  const today = new Date(); today.setHours(0,0,0,0);
  const loans = S.loans || [];
  const overdueLoans = loans.filter(function(l){ return l.due && l.status!=='settled' && new Date(l.due)<today; });
  const dueSoonLoans = loans.filter(function(l){
    if(!l.due || l.status==='settled') return false;
    const d = new Date(l.due); d.setHours(0,0,0,0);
    const diff = Math.round((d-today)/(1000*60*60*24));
    return diff>=0 && diff<=7;
  });

  // مستحقات العملاء (رصيد افتتاحي)
  const clientsOwing = (S.clients||[]).filter(function(c){ return c.openingBalance>0 && c.openingBalanceType==='receivable'; });

  const hasItems = uncollected.length || overdueLoans.length || dueSoonLoans.length || clientsOwing.length;
  if(!hasItems){ wrap.style.display='none'; return; }
  wrap.style.display='block';
  const cur = _getCurrency();

  let html = '';

  if(uncollected.length){
    html += `<div class="card" style="border-color:rgba(247,201,72,.4);margin-bottom:10px">
      <div style="font-size:13px;font-weight:700;color:var(--accent2);margin-bottom:10px"><i class="fa-solid fa-triangle-exclamation"></i> مبالغ لم يتم تحصيلها</div>
      ${uncollected.map(t=>`
        <div style="display:flex;align-items:center;gap:12px;padding:9px 0;border-bottom:1px solid rgba(42,42,58,.4)">
          <div style="flex:1">
            <div style="font-size:13px;font-weight:600">${t.title}</div>
            <div style="font-size:11px;color:var(--text3)">${t.client||'—'}</div>
          </div>
          <div style="font-weight:700;color:var(--accent2)">${t.value.toLocaleString()} ${cur}</div>
          <button class="btn btn-success btn-sm" onclick="markTaskPaymentCollected(${t.id})"><i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم التحصيل</button>
        </div>`).join('')}
    </div>`;
  }

  if(overdueLoans.length){
    html += `<div class="card" style="border-color:rgba(255,107,107,.5);margin-bottom:10px">
      <div style="font-size:13px;font-weight:700;color:var(--accent4);margin-bottom:10px"><i class="fa-solid fa-bell"></i> قروض متأخرة السداد (${overdueLoans.length})</div>
      ${overdueLoans.map(l=>`
        <div style="display:flex;align-items:center;gap:12px;padding:9px 0;border-bottom:1px solid rgba(42,42,58,.4)">
          <div style="flex:1">
            <div style="font-size:13px;font-weight:600">${l.direction==='lent'?'💰 سلّفت لـ ':'↩ استلفت من '}${escapeHtml(l.person)}</div>
            <div style="font-size:11px;color:var(--accent4)">⚠️ استحق: ${l.due}</div>
          </div>
          <div style="font-weight:700;color:var(--accent4)">${(l.amount-(l.settledAmount||0)).toLocaleString()} ${cur}</div>
          <button class="btn btn-ghost btn-sm" onclick="switchFinTab('loans');showPage('finance')"><i class="fa-solid fa-handshake"></i> عرض</button>
        </div>`).join('')}
    </div>`;
  }

  if(dueSoonLoans.length){
    html += `<div class="card" style="border-color:rgba(247,201,72,.4);margin-bottom:10px">
      <div style="font-size:13px;font-weight:700;color:var(--accent2);margin-bottom:10px"><i class="fa-solid fa-calendar-days"></i> قروض موعدها خلال 7 أيام</div>
      ${dueSoonLoans.map(l=>{
        const daysLeft = Math.round((new Date(l.due)-today)/(1000*60*60*24));
        return `<div style="display:flex;align-items:center;gap:12px;padding:9px 0;border-bottom:1px solid rgba(42,42,58,.4)">
          <div style="flex:1">
            <div style="font-size:13px;font-weight:600">${l.direction==='lent'?'💰 سلّفت لـ ':'↩ استلفت من '}${escapeHtml(l.person)}</div>
            <div style="font-size:11px;color:var(--accent2)">📅 الموعد: ${l.due} (${daysLeft===0?'اليوم!':daysLeft+' أيام'})</div>
          </div>
          <div style="font-weight:700;color:var(--accent2)">${(l.amount-(l.settledAmount||0)).toLocaleString()} ${cur}</div>
        </div>`;
      }).join('')}
    </div>`;
  }

  if(clientsOwing.length){
    const totalOwing = clientsOwing.reduce(function(s,c){ return s+(+c.openingBalance||0); },0);
    html += `<div class="card" style="border-color:rgba(168,156,255,.4);margin-bottom:10px">
      <div style="font-size:13px;font-weight:700;color:var(--accent2);margin-bottom:10px"><i class="fa-solid fa-users"></i> عملاء عندهم رصيد مستحق — إجمالي: ${totalOwing.toLocaleString()} ${cur}</div>
      ${clientsOwing.map(c=>`
        <div style="display:flex;align-items:center;gap:12px;padding:7px 0;border-bottom:1px solid rgba(42,42,58,.4)">
          <div style="flex:1;font-size:12px;font-weight:700">${escapeHtml(c.name)}</div>
          <div style="font-size:12px;font-weight:700;color:var(--accent2)">${(+c.openingBalance).toLocaleString()} ${cur}</div>
          <button class="btn btn-ghost btn-sm" onclick="openClientProfile(${c.id})"><i class="fa-solid fa-user"></i> عرض</button>
        </div>`).join('')}
    </div>`;
  }

  wrap.innerHTML = html;
}

function markTaskPaymentCollected(taskId){
  // Check project task first
  var ptask=(S.project_tasks||[]).find(function(t){return String(t.id)===String(taskId);});
  if(ptask){
    ptask.paymentCollected=true;
    if(ptask.value>0){
      if(!S.transactions) S.transactions=[];
      var proj=typeof _getProjById==='function'?_getProjById(ptask.project_id):null;
      S.transactions.push({id:Date.now()+Math.random(),type:'income',amount:ptask.value,
        currency:ptask.currency||'ج.م',
        desc:'تحصيل: '+(ptask.title||'')+(proj?' — '+proj.name:''),
        date:new Date().toISOString().slice(0,10),
        linkedProjTaskId:ptask.id,source:'project_task',createdAt:new Date().toISOString()});
    }
    lsSave(); cloudSave(S);
    if(typeof renderFinance==='function') renderFinance();
    if(typeof renderProjectDetail==='function') renderProjectDetail();
    toast('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم تسجيل التحصيل');
    return;
  }
  const task = S.tasks.find(x=>x.id===taskId); if(!task) return;
  task.paymentCollected = true;
  lsSave();
  // Open income modal pre-filled with task info so user can review before saving
  openIncomeModal(null, taskId);
  const amtEl=document.getElementById('in-amount');
  if(amtEl) amtEl.value = task.value||0;
  const srcEl=document.getElementById('in-source');
  if(srcEl) srcEl.value = task.client||'';
  const descEl=document.getElementById('in-desc');
  if(descEl) descEl.value = 'تحصيل مبلغ مشروع: '+task.title;
  const ptEl=document.getElementById('in-payment-type');
  if(ptEl) ptEl.value = 'full';
  renderAll();
}

