// ============================================================
// CUSTOM TASK STATUSES
// ============================================================
const DEFAULT_STATUSES = ['new','progress','review','paused','done'];

function renderTaskStatusesSettings(){
  const el = document.getElementById('task-statuses-list'); if(!el) return;
  const hidden = S.hiddenStatuses||[];
  const custom = S.customStatuses||[];
  const defaultItems = [
    {id:'new',      label:'<i class="fa-solid fa-clipboard-list"></i> جديد',       color:'var(--text3)'},
    {id:'progress', label:'<i class="fa-solid fa-bolt"></i> قيد التنفيذ', color:'var(--accent2)'},
    {id:'review',   label:'<i class="fa-solid fa-magnifying-glass"></i> مراجعة',     color:'var(--accent)'},
    {id:'paused',   label:'⏸ موقوف',       color:'#64b5f6'},
  ];
  const defaultHTML = defaultItems.map(s=>{
    const isHidden = hidden.includes(s.id);
    if(isHidden) return `<span style="display:inline-flex;align-items:center;gap:6px;background:rgba(42,42,58,.5);color:var(--text3);border:1px dashed var(--border);padding:4px 12px;border-radius:20px;font-size:12px;opacity:.5">${s.label} <button onclick="restoreStatus('${s.id}')" style="background:none;border:none;cursor:pointer;color:var(--accent3);font-size:11px;padding:0" title="إعادة تفعيل">↩</button></span>`;
    return `<span style="display:inline-flex;align-items:center;gap:6px;background:${s.color}18;color:${s.color};border:1px solid ${s.color}44;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700">${s.label} <button onclick="hideStatus('${s.id}')" style="background:none;border:none;cursor:pointer;color:${s.color};font-size:12px;padding:0;line-height:1" title="إخفاء"><i class="fa-solid fa-xmark"></i></button></span>`;
  }).join('');
  const customHTML = custom.map((s,i)=>
    `<span style="display:inline-flex;align-items:center;gap:6px;background:${s.color}22;color:${s.color};border:1px solid ${s.color}55;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700">${s.icon||''} ${s.label} <button onclick="delCustomStatus(${i})" style="background:none;border:none;cursor:pointer;color:${s.color};font-size:12px;padding:0;line-height:1"><i class="fa-solid fa-xmark"></i></button></span>`
  ).join('');
  el.innerHTML = defaultHTML + customHTML;
}

function hideStatus(id){
  if(!S.hiddenStatuses) S.hiddenStatuses=[];
  if(!S.hiddenStatuses.includes(id)) S.hiddenStatuses.push(id);
  lsSave(); renderTaskStatusesSettings(); buildDynamicStatusDropdowns();
}
function restoreStatus(id){
  S.hiddenStatuses = (S.hiddenStatuses||[]).filter(x=>x!==id);
  lsSave(); renderTaskStatusesSettings(); buildDynamicStatusDropdowns();
}

function addCustomStatus(){
  const label = document.getElementById('new-status-label')?.value.trim();
  const color = document.getElementById('new-status-color')?.value||'#7c6ff7';
  const icon  = document.getElementById('new-status-icon')?.value.trim()||'';
  if(!label) return alert('أدخل اسم الحالة');
  const id = 'custom_'+Date.now();
  if(!S.customStatuses) S.customStatuses=[];
  S.customStatuses.push({id,label,color,icon});
  lsSave();
  cloudSave(S);
  renderTaskStatusesSettings();
  buildDynamicStatusDropdowns();
  renderAll();
  const lbl=document.getElementById('new-status-label'); if(lbl) lbl.value='';
  const ico=document.getElementById('new-status-icon');  if(ico) ico.value='';
  if(typeof showMiniNotif==='function') showMiniNotif('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تمت إضافة الحالة: '+label);
  else if(typeof toast==='function') toast('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تمت إضافة الحالة: '+label);
}

function delCustomStatus(i){
  confirmDel('هل تريد حذف هذه الحالة؟',()=>{
    if(!S.customStatuses||!S.customStatuses[i]) return;
    S.customStatuses.splice(i,1);
    lsSave(); cloudSave(S);
    renderTaskStatusesSettings();
    buildDynamicStatusDropdowns();
    renderAll();
  });
}

function buildDynamicStatusDropdowns(){
  const hidden = S.hiddenStatuses||[];
  const custom = S.customStatuses||[];
  const overrides = S.statusOverrides||{};
  // Use override labels if set
  const defaultMap = {
    new:      (overrides.new?.label      || '<i class="fa-solid fa-clipboard-list"></i> جديد'),
    progress: (overrides.progress?.label || '<i class="fa-solid fa-bolt"></i> قيد التنفيذ'),
    review:   (overrides.review?.label   || '<i class="fa-solid fa-magnifying-glass"></i> مراجعة'),
    paused:   (overrides.paused?.label   || '⏸ موقوف'),
  };
  // Build options strings
  const defaultOpts = Object.entries(defaultMap)
    .filter(([id])=>!hidden.includes(id))
    .map(([id,lbl])=>`<option value="${id}">${lbl}</option>`).join('');
  const customOpts = custom.map(s=>`<option value="${s.id}">${s.icon||''} ${s.label}</option>`).join('');
  const doneOpt = '<option value="done"><i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> مكتمل</option>';
  const allOpts = defaultOpts + customOpts + doneOpt;

  // Update task create/edit modal status (t-status)
  const tSel = document.getElementById('t-status');
  if(tSel){ const cur=tSel.value; tSel.innerHTML=allOpts; if(cur) tSel.value=cur; }

  // Update task filter status (tf-status)
  const tfSel = document.getElementById('tf-status');
  if(tfSel){ const cur=tfSel.value; tfSel.innerHTML='<option value="">كل الحالات</option>'+allOpts; if(cur)tfSel.value=cur; }

  // Update task detail status select if open
  const tdSel = document.getElementById('td-status-sel');
  if(tdSel){ const cur=tdSel.value; tdSel.innerHTML=allOpts; if(cur) tdSel.value=cur; }

  // Update any other status selects in modals
  document.querySelectorAll('select[data-status-sel]').forEach(sel=>{
    const cur=sel.value;
    sel.innerHTML=allOpts;
    if(cur) sel.value=cur;
  });

  // Rebuild kanban columns
  if(typeof renderTasks==='function') setTimeout(function(){ renderTasks(); }, 60);
  // Also rebuild custom kanban columns
  if(typeof _renderCustomKanbanCols==='function') setTimeout(_renderCustomKanbanCols, 80);
}

// ============================================================
// SAVE doneAt timestamp when task is completed
// ============================================================


// ============================================================
// WALLETS TAB SYSTEM
// ============================================================
function switchFinTab(tab) {
  var tabs = ['transactions','wallets','budgets','loans','stats'];
  tabs.forEach(function(t) {
    var btn = document.getElementById('fin-tab-'+t);
    var panel = document.getElementById('fin-panel-'+t);
    if(btn) btn.className = t===tab ? 'filter-chip active' : 'filter-chip';
    if(panel) panel.style.display = t===tab ? 'block' : 'none';
  });
  if(tab==='wallets') { if(typeof renderWalletsTab==='function') renderWalletsTab(); }
  if(tab==='budgets') { if(typeof renderBudgets==='function') renderBudgets(); }
  if(tab==='loans') { if(typeof renderLoans==='function') renderLoans(); }
  if(tab==='transactions') { if(typeof renderFinLoansSummary==='function') renderFinLoansSummary(); }
  if(tab==='stats') { if(typeof renderFinStats==='function') renderFinStats(); }
}

// ═══════════════════════════════════════════════════════════════
// ملخص القروض والمستحقات في أول صفحة المالية
// ═══════════════════════════════════════════════════════════════
function renderFinLoansSummary(){
  var el = document.getElementById('fin-loans-summary');
  if(!el) return;
  var loans = S.loans || [];
  var lentActive = loans.filter(function(l){ return l.direction==='lent' && l.status!=='settled'; });
  var borrowedActive = loans.filter(function(l){ return l.direction==='borrowed' && l.status!=='settled'; });
  var lentTotal = lentActive.reduce(function(s,l){ return s+(l.amount-(l.settledAmount||0)); }, 0);
  var borrowedTotal = borrowedActive.reduce(function(s,l){ return s+(l.amount-(l.settledAmount||0)); }, 0);

  // مستحقات العملاء (رصيد افتتاحي)
  var clientsReceivable = (S.clients||[]).filter(function(c){ return c.openingBalance>0 && c.openingBalanceType==='receivable'; })
    .reduce(function(s,c){ return s+(+c.openingBalance||0); }, 0);

  // تذكيرات القروض المتأخرة
  var today = new Date();
  var overdueLoans = loans.filter(function(l){ return l.due && l.status!=='settled' && new Date(l.due) < today; });

  var hasData = lentTotal>0 || borrowedTotal>0 || clientsReceivable>0;
  if(!hasData && !overdueLoans.length){ el.style.display='none'; return; }

  el.style.display = 'block';
  var cur = _getCurrency();
  var html = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;margin-bottom:0">';

  if(lentTotal>0){
    html += '<div class="card" style="border-right:3px solid var(--accent3);cursor:pointer" onclick="switchFinTab(&apos;loans&apos;)" title="انتقل لصفحة القروض">'
      +'<div style="font-size:11px;color:var(--text3);margin-bottom:5px"><i class="fa-solid fa-handshake"></i> فلوس سلّفتها (عليهم)</div>'
      +'<div style="font-size:18px;font-weight:900;color:var(--accent3)">'+lentTotal.toLocaleString()+' '+cur+'</div>'
      +'<div style="font-size:10px;color:var(--text3);margin-top:3px">'+lentActive.length+' قرض نشط</div>'
      +'</div>';
  }
  if(borrowedTotal>0){
    html += '<div class="card" style="border-right:3px solid var(--accent4);cursor:pointer" onclick="switchFinTab(&apos;loans&apos;)" title="انتقل لصفحة القروض">'
      +'<div style="font-size:11px;color:var(--text3);margin-bottom:5px"><i class="fa-solid fa-hand-holding-dollar"></i> فلوس عليّ (أديها)</div>'
      +'<div style="font-size:18px;font-weight:900;color:var(--accent4)">'+borrowedTotal.toLocaleString()+' '+cur+'</div>'
      +'<div style="font-size:10px;color:var(--text3);margin-top:3px">'+borrowedActive.length+' قرض نشط</div>'
      +'</div>';
  }
  if(clientsReceivable>0){
    html += '<div class="card" style="border-right:3px solid var(--accent2)">'
      +'<div style="font-size:11px;color:var(--text3);margin-bottom:5px"><i class="fa-solid fa-users"></i> مبالغ مستحقة من عملاء</div>'
      +'<div style="font-size:18px;font-weight:900;color:var(--accent2)">'+clientsReceivable.toLocaleString()+' '+cur+'</div>'
      +'</div>';
  }
  html += '</div>';

  if(overdueLoans.length){
    html += '<div style="margin-top:10px;padding:10px 14px;background:rgba(255,107,107,.1);border-radius:10px;border-right:3px solid var(--accent4)">'
      +'<div style="font-size:12px;font-weight:800;color:var(--accent4);margin-bottom:6px"><i class="fa-solid fa-bell"></i> تذكير: '+overdueLoans.length+' قرض متأخر السداد</div>'
      +overdueLoans.map(function(l){
        return '<div style="font-size:11px;color:var(--text2);margin-bottom:3px">• '+(l.direction==='lent'?'سلّفت لـ ':'استلفت من ')+escapeHtml(l.person)+': '+(l.amount-(l.settledAmount||0)).toLocaleString()+' '+cur+' · استحق: '+l.due+'</div>';
      }).join('')
      +'</div>';
  }

  el.innerHTML = html;
}

function renderWalletsTab() {
  var methods = getAllPayMethods();
  var transactions = S.transactions || [];
  var grid = document.getElementById('fin-wallets-grid');
  if(!grid) return;
  var manualSel = document.getElementById('fin-manual-wallet');
  if(manualSel) {
    manualSel.innerHTML = methods.map(function(m) {
      return '<option value="'+m.id+'">'+m.label+'</option>';
    }).join('');
  }
  var walletColors = {cash:'#4fd1a5',instapay:'#7c6ff7',vodafone:'#e53935',etisalat:'#1565c0'};
  var walletIcons  = {cash:'<i class="fa-solid fa-money-bill-wave"></i>',instapay:'<i class="fa-solid fa-mobile"></i>',vodafone:'<i class="fa-brands fa-vimeo" style="color:#e53935"></i>',etisalat:'<i class="fa-solid fa-phone"></i>'};
  grid.innerHTML = methods.map(function(m) {
    var mTrans = transactions.filter(function(t){ return t.payMethod===m.id || t.method===m.id; });
    var income  = mTrans.filter(function(t){ return t.type==='income'; }).reduce(function(s,t){ return s+(t.amount||0); }, 0);
    var expense = mTrans.filter(function(t){ return t.type==='expense'; }).reduce(function(s,t){ return s+(t.amount||0); }, 0);
    var balance = income - expense;
    var color   = m.color || walletColors[m.id] || '#7c6ff7';
    var icon    = m.icon  || walletIcons[m.id]  || '<i class="fa-solid fa-wallet"></i>';
    var pct     = (income+expense) > 0 ? Math.round(income/(income+expense)*100) : 0;
    return '<div class="card" style="cursor:pointer;border:1.5px solid '+color+'33;position:relative;overflow:hidden" data-wid="'+m.id+'" onclick="showWalletDetail(this.dataset.wid)">'+
      '<div style="position:absolute;top:0;right:0;width:100%;height:3px;background:'+color+'"></div>'+
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">'+
        '<div style="width:38px;height:38px;border-radius:10px;background:'+color+'22;display:flex;align-items:center;justify-content:center;color:'+color+';font-size:18px">'+icon+'</div>'+
        '<div><div style="font-weight:800;font-size:14px">'+m.label+'</div>'+
        '<div style="font-size:11px;color:var(--text3)">'+mTrans.length+' معاملة</div></div>'+
      '</div>'+
      '<div style="font-size:20px;font-weight:900;color:'+(balance>=0?'var(--accent3)':'var(--accent4)')+'">'+balance.toLocaleString('ar-EG')+' ج</div>'+
      '<div style="display:flex;justify-content:space-between;font-size:11px;margin-top:6px">'+
        '<span style="color:var(--accent3)">↑ '+income.toLocaleString('ar-EG')+'</span>'+
        '<span style="color:var(--accent4)">↓ '+expense.toLocaleString('ar-EG')+'</span>'+
      '</div>'+
      '<div style="margin-top:8px;height:4px;background:var(--surface2);border-radius:4px;overflow:hidden">'+
        '<div style="height:100%;width:'+pct+'%;background:'+color+';border-radius:4px;transition:width .5s"></div>'+
      '</div>'+
    '</div>';
  }).join('');
}

// ══════════════════════════════════════════════════
// BUDGETS
// ══════════════════════════════════════════════════
var _budgetCatLabel = {equipment:'💻 معدات وأجهزة',software:'🔧 برامج واشتراكات',setup:'🏠 تطوير السيت آب',marketing:'📢 تسويق',education:'📚 تعليم وكورسات',emergency:'🛡 طوارئ',other:'📦 أخرى'};
var _budgetPriLabel = {high:'🔴 عالية',medium:'🟡 متوسطة',low:'🟢 منخفضة'};

function openBudgetModal(id){
  document.getElementById('budget-modal-ttl').innerHTML = id ? '<i class="fa-solid fa-bullseye-arrow"></i> تعديل الميزانية' : '<i class="fa-solid fa-bullseye-arrow"></i> ميزانية جديدة';
  document.getElementById('budget-eid').value = id||'';
  if(id){
    var b=(S.budgets||[]).find(function(x){return String(x.id)===String(id);}); if(!b) return;
    document.getElementById('budget-name').value=b.name||'';
    document.getElementById('budget-target').value=b.target||'';
    document.getElementById('budget-saved').value=b.saved||'';
    document.getElementById('budget-cat').value=b.cat||'other';
    document.getElementById('budget-priority').value=b.priority||'medium';
    document.getElementById('budget-start').value=b.start||'';
    document.getElementById('budget-deadline').value=b.deadline||'';
    document.getElementById('budget-notes').value=b.notes||'';
  } else {
    ['budget-name','budget-target','budget-saved','budget-notes','budget-deadline'].forEach(function(f){var e=document.getElementById(f);if(e)e.value='';});
    document.getElementById('budget-start').value=new Date().toISOString().slice(0,10);
    document.getElementById('budget-cat').value='other';
    document.getElementById('budget-priority').value='medium';
  }
  openM('modal-budget');
}
function saveBudget(){
  var name=(document.getElementById('budget-name').value||'').trim();
  if(!name){toast('<i class="fa-solid fa-triangle-exclamation"></i> أدخل اسم الميزانية');return;}
  var target=+(document.getElementById('budget-target').value||0);
  if(!target){toast('<i class="fa-solid fa-triangle-exclamation"></i> أدخل المبلغ المستهدف');return;}
  var eid=document.getElementById('budget-eid').value;
  var d={
    name:name, target:target,
    saved:+(document.getElementById('budget-saved').value||0),
    cat:document.getElementById('budget-cat').value||'other',
    priority:document.getElementById('budget-priority').value||'medium',
    start:document.getElementById('budget-start').value||'',
    deadline:document.getElementById('budget-deadline').value||'',
    notes:document.getElementById('budget-notes').value||'',
    updatedAt:new Date().toISOString()
  };
  if(!S.budgets) S.budgets=[];
  if(eid){var i=S.budgets.findIndex(function(x){return String(x.id)===String(eid);});if(i>-1){d.id=S.budgets[i].id;d.createdAt=S.budgets[i].createdAt||d.updatedAt;S.budgets[i]=d;}}
  else{d.id='bgt_'+Date.now();d.createdAt=d.updatedAt;S.budgets.push(d);}
  lsSave();cloudSave(S);closeM('modal-budget');renderBudgets();
  toast('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم حفظ الميزانية');
}
function addToBudget(id){
  var b=(S.budgets||[]).find(function(x){return String(x.id)===String(id);}); if(!b) return;
  var amt=+prompt('أضف مبلغ للميزانية "'+b.name+'" (الحالي: '+b.saved.toLocaleString()+' ج.م):');
  if(!amt||isNaN(amt)) return;
  b.saved=Math.min(b.target, (b.saved||0)+amt);
  lsSave();cloudSave(S);renderBudgets();
  toast('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم إضافة '+amt.toLocaleString()+' ج.م للميزانية');
}
function delBudget(id){
  if(!confirm('حذف هذه الميزانية؟')) return;
  S.budgets=(S.budgets||[]).filter(function(x){return String(x.id)!==String(id);});
  lsSave();cloudSave(S);renderBudgets();toast('تم الحذف');
}
function renderBudgets(){
  var el=document.getElementById('budgets-grid'); if(!el) return;
  if(!S.budgets) S.budgets=[];
  if(!S.budgets.length){
    el.innerHTML='<div class="card" style="grid-column:span 3;text-align:center;padding:40px 20px"><div style="font-size:48px;margin-bottom:12px">🎯</div><div style="font-size:16px;font-weight:800;margin-bottom:8px">لا توجد ميزانيات بعد</div><div style="font-size:13px;color:var(--text3);margin-bottom:16px">ابدأ بتحديد ميزانية لأي هدف — جهاز، كورس، تسويق...</div><button class="btn btn-primary" onclick="openBudgetModal()"><i class="fa-solid fa-plus" style="margin-left:4px"></i> ميزانية جديدة</button></div>';
    return;
  }
  var priColor={high:'var(--accent4)',medium:'var(--accent2)',low:'var(--accent3)'};
  el.innerHTML=S.budgets.map(function(b){
    var pct=b.target>0?Math.min(100,Math.round((b.saved||0)/b.target*100)):0;
    var done=pct>=100;
    var rem=Math.max(0,b.target-(b.saved||0));
    var barColor=done?'var(--accent3)':pct>=75?'var(--accent2)':'var(--accent)';
    return '<div class="card" style="position:relative;'+(done?'border:1.5px solid var(--accent3)':'')+'">'
      +'<div style="position:absolute;top:12px;left:12px;font-size:10px;padding:2px 8px;border-radius:20px;font-weight:700;background:'+priColor[b.priority||'medium']+'22;color:'+priColor[b.priority||'medium']+'">'+(_budgetPriLabel[b.priority||'medium']||'')+'</div>'
      +'<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:10px;padding-left:60px">'
        +'<div><div style="font-size:14px;font-weight:800">'+escapeHtml(b.name)+'</div>'
        +'<div style="font-size:11px;color:var(--text3);margin-top:2px">'+(_budgetCatLabel[b.cat||'other']||'')+(b.deadline?' · ⏰ '+b.deadline:'')+'</div></div>'
        +'<div style="display:flex;gap:4px">'
          +'<button onclick="openBudgetModal(\''+b.id+'\')" class="btn btn-ghost btn-sm" style="padding:4px 8px"><i class="fa-solid fa-pen"></i></button>'
          +'<button onclick="delBudget(\''+b.id+'\')" class="btn btn-ghost btn-sm" style="padding:4px 8px;color:var(--accent4)"><i class="fa-solid fa-trash"></i></button>'
        +'</div>'
      +'</div>'
      +'<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:6px">'
        +'<span style="color:var(--text3)">المدّخر</span>'
        +'<span style="font-weight:800;color:'+barColor+'">'+(b.saved||0).toLocaleString()+' / '+b.target.toLocaleString()+' ج.م</span>'
      +'</div>'
      +'<div style="height:10px;background:var(--surface3);border-radius:5px;margin-bottom:10px;overflow:hidden">'
        +'<div style="height:100%;width:'+pct+'%;background:'+barColor+';border-radius:5px;transition:.4s"></div>'
      +'</div>'
      +'<div style="display:flex;justify-content:space-between;align-items:center">'
        +'<span style="font-size:12px;color:var(--text3)">'+(done?'<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> مكتملة!':'متبقي: <strong>'+rem.toLocaleString()+' ج.م</strong>')+'</span>'
        +(!done?'<button class="btn btn-ghost btn-sm" style="font-size:11px" onclick="addToBudget(\''+b.id+'\')"><i class="fa-solid fa-plus" style="margin-left:3px"></i> أضف مبلغ</button>':'')
      +'</div>'
      +(b.notes?'<div style="font-size:11px;color:var(--text3);margin-top:8px;padding-top:8px;border-top:1px solid var(--border)">'+escapeHtml(b.notes)+'</div>':'')
      +'</div>';
  }).join('');
}

// ══════════════════════════════════════════════════
// LOANS
// ══════════════════════════════════════════════════
function updateLoanDirection(){
  var dir=document.getElementById('loan-direction')?.value||'lent';
  var lbl=document.getElementById('loan-person-label');
  if(lbl) lbl.textContent = dir==='lent' ? 'اسم الشخص اللي سلّفته *' : 'اسم الشخص اللي استلفت منه *';
}
function openLoanModal(id){
  document.getElementById('loan-modal-ttl').innerHTML = id ? '<i class="fa-solid fa-handshake"></i> تعديل القرض' : '<i class="fa-solid fa-handshake"></i> قرض / دين جديد';
  document.getElementById('loan-eid').value=id||'';
  if(id){
    var l=(S.loans||[]).find(function(x){return String(x.id)===String(id);}); if(!l) return;
    document.getElementById('loan-direction').value=l.direction||'lent';
    document.getElementById('loan-amount').value=l.amount||'';
    document.getElementById('loan-person').value=l.person||'';
    document.getElementById('loan-date').value=l.date||'';
    document.getElementById('loan-due').value=l.due||'';
    document.getElementById('loan-notes').value=l.notes||'';
    document.getElementById('loan-status').value=l.status||'pending';
    document.getElementById('loan-settled-amount').value=l.settledAmount||'';
  } else {
    ['loan-amount','loan-person','loan-due','loan-notes','loan-settled-amount'].forEach(function(f){var e=document.getElementById(f);if(e)e.value='';});
    document.getElementById('loan-direction').value='lent';
    document.getElementById('loan-date').value=new Date().toISOString().slice(0,10);
    document.getElementById('loan-status').value='pending';
  }
  updateLoanDirection();
  _toggleLoanSettledWrap();
  openM('modal-loan');
}
function _toggleLoanSettledWrap(){
  var st=document.getElementById('loan-status')?.value;
  var w=document.getElementById('loan-settled-amount-wrap');
  if(w) w.style.display=st==='partial'?'block':'none';
}
document.addEventListener('change',function(e){if(e.target&&e.target.id==='loan-status') _toggleLoanSettledWrap();});
function saveLoan(){
  var person=(document.getElementById('loan-person').value||'').trim();
  if(!person){toast('<i class="fa-solid fa-triangle-exclamation"></i> أدخل اسم الشخص');return;}
  var amount=+(document.getElementById('loan-amount').value||0);
  if(!amount){toast('<i class="fa-solid fa-triangle-exclamation"></i> أدخل المبلغ');return;}
  var eid=document.getElementById('loan-eid').value;
  var status=document.getElementById('loan-status').value||'pending';
  var direction=document.getElementById('loan-direction').value||'lent';
  var d={
    direction:direction,
    amount:amount, person:person,
    date:document.getElementById('loan-date').value||'',
    due:document.getElementById('loan-due').value||'',
    notes:document.getElementById('loan-notes').value||'',
    status:status,
    settledAmount:status==='partial'?+(document.getElementById('loan-settled-amount').value||0):0,
    updatedAt:new Date().toISOString()
  };
  var isNew=!eid;
  if(!S.loans) S.loans=[];
  if(eid){var i=S.loans.findIndex(function(x){return String(x.id)===String(eid);});if(i>-1){d.id=S.loans[i].id;d.createdAt=S.loans[i].createdAt||d.updatedAt;S.loans[i]=d;}}
  else{d.id='ln_'+Date.now();d.createdAt=d.updatedAt;S.loans.push(d);}
  lsSave();cloudSave(S);closeM('modal-loan');renderLoans();
  toast('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم حفظ القرض');
  // ── سؤال تسجيل القرض كمعاملة مالية (للقروض الجديدة فقط) ──
  if(isNew){
    // ننتظر إن modal-loan يتغلق كامل قبل ما نظهر الـ prompt
    var _loanForPrompt=Object.assign({},d);
    setTimeout(function(){
      // تأكد إن modal-loan مش open
      var ml=document.getElementById('modal-loan');
      if(ml) ml.style.display='none';
      _showLoanTransactionPrompt(_loanForPrompt);
    }, 500);
  }
}

// ── موديال تسجيل القرض كمعاملة مالية ──
function _showLoanTransactionPrompt(loan){
  var ex=document.getElementById('_loan-tx-modal'); if(ex) ex.remove();
  var isLent=loan.direction==='lent';
  // لو سلّفت فلوس → خرج منك (مصروف)، لو استلفت → دخل عندك
  var txType=isLent?'expense':'income';
  var icon=isLent?'📤':'📥';
  var label=isLent?'مصروف (فلوس طلعت منك)':'دخل (فلوس دخلت عندك)';
  var desc=(isLent?'سلفة لـ ':'قرض من ')+loan.person;
  var ov=document.createElement('div');
  ov.id='_loan-tx-modal';
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;z-index:99999;padding:16px';
  ov.innerHTML='<div style="background:var(--surface,#1e1e2e);color:var(--text1,#fff);width:min(420px,92vw);border-radius:20px;padding:28px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.5)">'
    +'<div style="font-size:40px;margin-bottom:10px">'+icon+'</div>'
    +'<div style="font-size:17px;font-weight:900;margin-bottom:6px">تسجيل في المالية؟</div>'
    +'<div style="font-size:13px;color:var(--text3,#888);margin-bottom:4px">'+escapeHtml(desc)+'</div>'
    +'<div style="font-size:28px;font-weight:900;color:'+(isLent?'var(--accent4,#f97316)':'var(--accent3,#4fd1a5)')+';margin:12px 0">'+Number(loan.amount).toLocaleString()+' ج</div>'
    +'<div style="background:var(--surface2,#2a2a3e);border-radius:12px;padding:12px;margin-bottom:18px;font-size:12px;color:var(--text3,#888);line-height:1.7">'
      +(isLent
        ? '<i class="fa-solid fa-info-circle" style="color:var(--accent2,#a78bfa)"></i> لو سجّلته كمصروف، هيظهر إن عندك فلوس طلعت من حسابك (مش موجودة معاك دلوقتي)'
        : '<i class="fa-solid fa-info-circle" style="color:var(--accent3,#4fd1a5)"></i> لو سجّلته كدخل، هيظهر إن عندك فلوس دخلت على حسابك (معاك دلوقتي نقدي)')
    +'</div>'
    +'<div style="display:flex;gap:10px;flex-wrap:wrap">'
      +'<button id="_ltm-yes" class="btn btn-primary" style="flex:1"><i class="fa-solid fa-coins"></i> نعم سجّله '+label+'</button>'
      +'<button id="_ltm-no" class="btn btn-ghost">تخطي</button>'
    +'</div>'
  +'</div>';
  document.body.appendChild(ov);
  document.getElementById('_ltm-yes').onclick=function(){
    ov.remove();
    var now=new Date().toISOString().split('T')[0];
    var txDate=loan.date||now;
    var tx={
      id:Date.now(),
      type:txType,
      amount:loan.amount,
      source:txType==='income'?loan.person:'',
      desc:desc,
      date:txDate,
      isoDate:txDate,
      paymentType:'cash',
      loanId:loan.id,
      currency:S.settings?.currency||'EGP'
    };
    if(!S.transactions) S.transactions=[];
    S.transactions.push(tx);
    lsSave(); cloudSave(S);
    if(typeof renderFinance==='function') renderFinance();
    toast('<i class="fa-solid fa-coins" style="color:var(--accent3)"></i> تم تسجيل القرض في المالية');
  };
  document.getElementById('_ltm-no').onclick=function(){ ov.remove(); };
  ov.addEventListener('click',function(e){if(e.target===ov)ov.remove();});
}
function delLoan(id){
  if(!confirm('حذف هذا القرض؟')) return;
  S.loans=(S.loans||[]).filter(function(x){return String(x.id)!==String(id);});
  lsSave();cloudSave(S);renderLoans();toast('تم الحذف');
}
function markLoanSettled(id){
  var l=(S.loans||[]).find(function(x){return String(x.id)===String(id);}); if(!l) return;
  l.status='settled'; l.settledAmount=l.amount; l.settledAt=new Date().toISOString();
  lsSave();cloudSave(S);renderLoans();
  toast('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم تسجيل السداد الكامل');
}
function renderLoans(){
  var el=document.getElementById('loans-list'); if(!el) return;
  if(!S.loans) S.loans=[];
  var lentTotal=(S.loans).filter(function(l){return l.direction==='lent'&&l.status!=='settled';}).reduce(function(s,l){return s+(l.amount-(l.settledAmount||0));},0);
  var borrowedTotal=(S.loans).filter(function(l){return l.direction==='borrowed'&&l.status!=='settled';}).reduce(function(s,l){return s+(l.amount-(l.settledAmount||0));},0);
  var lentEl=document.getElementById('loans-lent-total');
  var borEl=document.getElementById('loans-borrowed-total');
  if(lentEl) lentEl.textContent=lentTotal.toLocaleString()+' ج.م';
  if(borEl) borEl.textContent=borrowedTotal.toLocaleString()+' ج.م';
  if(!S.loans.length){
    el.innerHTML='<div class="card" style="text-align:center;padding:40px 20px"><div style="font-size:48px;margin-bottom:12px">🤝</div><div style="font-size:16px;font-weight:800;margin-bottom:8px">لا توجد قروض مسجّلة</div><div style="font-size:13px;color:var(--text3);margin-bottom:16px">سجّل فلوسك المسلّفة أو اللي عليك تردها</div><button class="btn btn-primary" onclick="openLoanModal()"><i class="fa-solid fa-plus" style="margin-left:4px"></i> قرض / دين جديد</button></div>';
    return;
  }
  var stLabel={pending:'⏳ لسه',partial:'🟡 جزء',settled:'✅ اترد'};
  var stColor={pending:'var(--accent4)',partial:'var(--accent2)',settled:'var(--accent3)'};
  el.innerHTML='<div style="display:flex;flex-direction:column;gap:10px">'+S.loans.map(function(l){
    var isLent=l.direction==='lent';
    var rem=l.amount-(l.settledAmount||0);
    var isDone=l.status==='settled';
    var overdue=l.due&&!isDone&&new Date(l.due)<new Date();
    return '<div class="card" style="border-right:4px solid '+(isLent?'var(--accent3)':'var(--accent4)')+(isDone?';opacity:.7':'')+';">'
      +'<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">'
        +'<div>'
          +'<div style="font-size:13px;font-weight:800">'+(isLent?'💰 سلّفت لـ ':'↩ استلفت من ')+escapeHtml(l.person)+'</div>'
          +'<div style="font-size:12px;color:var(--text3);margin-top:3px">'
            +l.amount.toLocaleString()+' ج.م'
            +(l.date?' · '+l.date:'')
            +(l.due?'<span style="color:'+(overdue?'var(--accent4)':'var(--text3)')+'"> · سداد: '+l.due+(overdue?' ⚠️':'')+'</span>':'')
          +'</div>'
          +(l.notes?'<div style="font-size:11px;color:var(--text3);margin-top:3px">'+escapeHtml(l.notes)+'</div>':'')
        +'</div>'
        +'<div style="display:flex;align-items:center;gap:8px">'
          +'<span style="font-size:11px;padding:3px 10px;border-radius:20px;font-weight:700;background:'+stColor[l.status||'pending']+'22;color:'+stColor[l.status||'pending']+'">'+stLabel[l.status||'pending']+'</span>'
          +(!isDone?'<span style="font-size:13px;font-weight:800;color:'+(isLent?'var(--accent3)':'var(--accent4)')+'">متبقي: '+rem.toLocaleString()+' ج.م</span>':'')
          +'<button onclick="openLoanModal(\''+l.id+'\')" class="btn btn-ghost btn-sm" style="padding:4px 8px"><i class="fa-solid fa-pen"></i></button>'
          +(!isDone?'<button onclick="markLoanSettled(\''+l.id+'\')" class="btn btn-ghost btn-sm" style="padding:4px 8px;color:var(--accent3)" title="تسجيل سداد كامل"><i class="fa-solid fa-square-check"></i></button>':'')
          +'<button onclick="delLoan(\''+l.id+'\')" class="btn btn-ghost btn-sm" style="padding:4px 8px;color:var(--accent4)"><i class="fa-solid fa-trash"></i></button>'
        +'</div>'
      +'</div>'
      +'</div>';
  }).join('')+'</div>';
}

function showWalletDetail(methodId) {
  var card = document.getElementById('fin-wallet-detail-card');
  var methods = getAllPayMethods();
  var m = methods.find(function(x){ return x.id===methodId; });
  if(!m || !card) return;
  card.style.display = 'block';
  card.scrollIntoView({behavior:'smooth',block:'nearest'});
  var mTrans = (S.transactions||[]).filter(function(t){ return t.payMethod===methodId || t.method===methodId; });
  var income  = mTrans.filter(function(t){ return t.type==='income'; }).reduce(function(s,t){ return s+(t.amount||0); }, 0);
  var expense = mTrans.filter(function(t){ return t.type==='expense'; }).reduce(function(s,t){ return s+(t.amount||0); }, 0);
  var balance = income - expense;
  var iconEl = document.getElementById('fin-wd-icon');
  var nameEl = document.getElementById('fin-wd-name');
  var balEl  = document.getElementById('fin-wd-balance');
  if(iconEl) iconEl.innerHTML = m.icon || '<i class="fa-solid fa-wallet"></i>';
  if(nameEl) nameEl.textContent = m.label;
  if(balEl)  balEl.innerHTML = 'الرصيد: <strong style="color:'+(balance>=0?'var(--accent3)':'var(--accent4)')+'">'+balance.toLocaleString('ar-EG')+' ج</strong> &nbsp;|&nbsp; دخل: '+income.toLocaleString('ar-EG')+' ج &nbsp;|&nbsp; صرف: '+expense.toLocaleString('ar-EG')+' ج';
  var tbody = document.getElementById('fin-wd-tbody');
  if(!tbody) return;
  var rows = [...mTrans].sort(function(a,b){ return (b.isoDate||'').localeCompare(a.isoDate||''); });
  tbody.innerHTML = rows.map(function(t) {
    return '<tr>'+
      '<td>'+( t.desc||'—' )+'</td>'+
      '<td><span class="badge '+(t.type==='income'?'badge-green':'badge-red')+'">'+(t.type==='income'?'دخل':'مصروف')+'</span></td>'+
      '<td style="font-weight:700;color:'+(t.type==='income'?'var(--accent3)':'var(--accent4)')+'">'+t.amount.toLocaleString('ar-EG')+' ج</td>'+
      '<td class="hide-mobile" style="font-size:11px;color:var(--text3)">'+(t.isoDate||t.date||'—')+'</td>'+
    '</tr>';
  }).join('') || '<tr><td colspan="4" style="text-align:center;padding:20px;color:var(--text3)">لا معاملات لهذه المحفظة</td></tr>';
}

function addManualWalletEntry() {
  var method = document.getElementById('fin-manual-wallet')?.value;
  var type   = document.getElementById('fin-manual-type')?.value;
  var amount = parseFloat(document.getElementById('fin-manual-amount')?.value) || 0;
  var desc   = document.getElementById('fin-manual-desc')?.value.trim() || 'إدخال يدوي';
  if(!method || !amount) { showMiniNotif('<i class="fa-solid fa-triangle-exclamation"></i> اختر المحفظة وأدخل المبلغ'); return; }
  var today = new Date().toISOString().split('T')[0];
  var entry = { id: Date.now(), type, amount, desc, payMethod: method, method, source: 'محفظة', isoDate: today, date: today };
  if(!S.transactions) S.transactions = [];
  S.transactions.push(entry);
  lsSave(); cloudSave(S);
  document.getElementById('fin-manual-amount').value = '';
  document.getElementById('fin-manual-desc').value   = '';
  renderWalletsTab();
  showMiniNotif('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم تسجيل المعاملة في ' + (getAllPayMethods().find(m=>m.id===method)?.label||method));
}

// ============================================================
// PAYMENT ACCOUNTS (custom wallets/methods)
// ============================================================
const DEFAULT_PAY_METHODS = [
  {id:'cash',     label:'نقدي',          icon:'<i class="fa-solid fa-dollar-sign"></i>', color:'#4fd1a5'},
  {id:'instapay', label:'إنستاباي',      icon:'<i class="fa-solid fa-mobile"></i>', color:'#7c6ff7'},
  {id:'vodafone', label:'فودافون كاش',   icon:'<i class="fa-solid fa-mobile-screen"></i>', color:'#e53935'},
  {id:'etisalat', label:'اتصالات كاش',   icon:'<i class="fa-solid fa-phone"></i>', color:'#1565c0'},
];

function getAllPayMethods(){
  const hidden = S.hiddenPayMethods||[];
  const custom = S.paymentAccounts||[];
  return [...DEFAULT_PAY_METHODS.filter(m=>!hidden.includes(m.id)), ...custom];
}

function fillPayMethodDropdowns(){
  let methods = getAllPayMethods();
  // فلترة وسائل الدفع حسب صلاحيات الباقة
  const f = _getPlanFeatures();
  const payMap = {
    'cash':'pay_cash','instapay':'pay_instapay','vodafone':'pay_vodafone',
    'etisalat':'pay_etisalat','bank':'pay_bank','card':'pay_card'
  };
  if(_supaUserId && hasActiveSub() && Object.keys(f).length) {
    methods = methods.filter(m => {
      const fk = payMap[m.id];
      if(!fk) return true; // وسيلة مخصصة = مسموحة دائماً
      return f[fk] !== false; // لو مش موجودة = مسموحة، لو false = محظورة
    });
  }
  const opts = methods.map(m=>`<option value="${m.id}">${m.icon} ${m.label}</option>`).join('');
  ['in-pay-method','ex-pay-method','fin-filter-method'].forEach(id=>{
    const sel = document.getElementById(id); if(!sel) return;
    const cur = sel.value;
    sel.innerHTML = id==='fin-filter-method' ? '<option value="">كل وسائل الدفع</option>'+opts : opts;
    if(cur && [...sel.options].some(o=>o.value===cur)) sel.value = cur;
  });
}

function renderPaymentAccountsSettings(){
  const el = document.getElementById('payment-accounts-list'); if(!el) return;
  // الافتراضية المخفية (المحذوفة من قِبَل المستخدم)
  const hidden = S.hiddenPayMethods||[];
  const custom = S.paymentAccounts||[];
  // عرض الافتراضية مع زر حذف
  const defaultHTML = DEFAULT_PAY_METHODS.map(m=>{
    const isHidden = hidden.includes(m.id);
    if(isHidden) return `<span style="display:inline-flex;align-items:center;gap:5px;background:rgba(42,42,58,.5);color:var(--text3);border:1px dashed var(--border);padding:4px 12px;border-radius:20px;font-size:12px;opacity:.5">${m.icon} ${m.label} <button onclick="restorePayMethod('${m.id}')" style="background:none;border:none;cursor:pointer;color:var(--accent3);font-size:11px;padding:0" title="إعادة تفعيل">↩</button></span>`;
    return `<span style="display:inline-flex;align-items:center;gap:5px;background:${m.color}18;color:${m.color};border:1px solid ${m.color}44;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700">${m.icon} ${m.label} <button onclick="hidePayMethod('${m.id}')" style="background:none;border:none;cursor:pointer;color:${m.color};font-size:12px;padding:0;line-height:1" title="إخفاء"><i class="fa-solid fa-xmark"></i></button></span>`;
  }).join('');
  const customHTML = custom.map((a,i)=>
    `<span style="display:inline-flex;align-items:center;gap:5px;background:${a.color}22;color:${a.color};border:1px solid ${a.color}55;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700">${a.icon||'<i class="fa-solid fa-credit-card"></i>'} ${a.label} <button onclick="delPaymentAccount(${i})" style="background:none;border:none;cursor:pointer;color:${a.color};font-size:12px;padding:0;line-height:1"><i class="fa-solid fa-xmark"></i></button></span>`
  ).join('');
  el.innerHTML = defaultHTML + customHTML;
}

function hidePayMethod(id){
  if(!S.hiddenPayMethods) S.hiddenPayMethods=[];
  if(!S.hiddenPayMethods.includes(id)) S.hiddenPayMethods.push(id);
  lsSave(); renderPaymentAccountsSettings(); fillPayMethodDropdowns();
}
function restorePayMethod(id){
  S.hiddenPayMethods = (S.hiddenPayMethods||[]).filter(x=>x!==id);
  lsSave(); renderPaymentAccountsSettings(); fillPayMethodDropdowns();
}

function addPaymentAccount(){
  const name  = document.getElementById('new-account-name')?.value.trim();
  const _iconClass = document.getElementById('new-account-icon')?.value.trim()||'fa-credit-card';
  const icon  = '<i class="fa-solid '+_iconClass+'"></i>';
  const color = document.getElementById('new-account-color')?.value||'#7c6ff7';
  if(!name) return alert('أدخل اسم الحساب');
  const id = 'acc_'+Date.now();
  if(!S.paymentAccounts) S.paymentAccounts=[];
  S.paymentAccounts.push({id,label:name,icon,color});
  lsSave();
  renderPaymentAccountsSettings();
  fillPayMethodDropdowns();
  document.getElementById('new-account-name').value='';
  document.getElementById('new-account-icon').value='';
  showMiniNotif('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تمت إضافة حساب: '+name);
}

function delPaymentAccount(i){
  confirmDel('هل تريد حذف هذا الحساب؟',()=>{
    S.paymentAccounts.splice(i,1);
    lsSave(); renderPaymentAccountsSettings(); fillPayMethodDropdowns();
  });
}

// ============================================================
// DASHBOARD OVERDUE TASKS (> 24h old active)
// ============================================================
function renderDashOverdue(){
  const list = document.getElementById('dash-overdue-list'); if(!list) return;
  const now = Date.now();
  const overdue = S.tasks.filter(t=>{
    if(t.done) return false;
    const created = +t.id;
    return (now - created) > 24*60*60*1000;
  }).sort((a,b)=>a.id-b.id); // الأقدم أولاً
  if(!overdue.length){
    list.innerHTML='<div class="empty" style="padding:8px 0"><div class="empty-icon" style="font-size:18px"><i class="fa-solid fa-square-check" style="color:var(--accent3)"></i></div><div style="font-size:12px">لا مهام متأخرة</div></div>';
    return;
  }
  const stLabel={new:'<i class="fa-solid fa-clipboard-list"></i> جديد',progress:'<i class="fa-solid fa-bolt"></i> جاري',review:'<i class="fa-solid fa-magnifying-glass"></i> مراجعة',paused:'⏸ موقوف'};
  list.innerHTML = overdue.slice(0,5).map(t=>{
    const hrs  = Math.floor((now - +t.id)/(1000*60*60));
    const days = Math.floor(hrs/24);
    const timeStr = days>=1 ? days+' يوم' : hrs+' ساعة';
    return `<div onclick="openTaskDetail(${t.id})" class="task-clickable" style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(42,42,58,.25);cursor:pointer">
      <div style="flex:1;min-width:0">
        <div style="font-size:12px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t.title}</div>
        <div style="font-size:11px;color:var(--text3)">${t.client||'—'} · ${stLabel[t.status||'new']||t.status||''}</div>
      </div>
      <span style="font-size:11px;font-weight:700;color:var(--accent4);white-space:nowrap;background:rgba(247,111,124,.12);padding:2px 7px;border-radius:10px">منذ ${timeStr}</span>
    </div>`;
  }).join('');
  if(overdue.length>5) list.innerHTML += `<div style="font-size:11px;color:var(--text3);padding:5px 0;text-align:center">+ ${overdue.length-5} مهمة أخرى</div>`;
}

// ============================================================
// renderDashAlerts — يحدّث كل خانات التنبيه
// ============================================================
function renderDashAlerts(){
  renderDashOverdue();

  // ── اشتراكات قريبة التجديد ──
  const subsList = document.getElementById('dash-subs-list');
  if(subsList){
    const today = new Date();
    const urgentSubs = (S.subscriptions||[]).filter(s=>{
      let next = new Date(today.getFullYear(), today.getMonth(), s.day||1);
      if(next <= today) next = new Date(today.getFullYear(), today.getMonth()+1, s.day||1);
      return Math.ceil((next-today)/(1000*60*60*24)) <= 7;
    });
    if(urgentSubs.length){
      subsList.innerHTML = urgentSubs.map(s=>{
        let next = new Date(today.getFullYear(), today.getMonth(), s.day||1);
        if(next<=today) next = new Date(today.getFullYear(), today.getMonth()+1, s.day||1);
        const days = Math.ceil((next-today)/(1000*60*60*24));
        return `<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid rgba(42,42,58,.25)">
          <div><div style="font-size:12px;font-weight:700"><i class="fa-solid fa-laptop"></i> ${s.name}</div><div style="font-size:11px;color:var(--text3)">${s.amount.toLocaleString()} ج/شهر</div></div>
          <span style="font-size:11px;font-weight:700;color:${days<=3?'var(--accent4)':'var(--accent2)'}; background:${days<=3?'rgba(247,111,124,.12)':'rgba(247,201,72,.12)'};padding:2px 8px;border-radius:10px">${days===0?'اليوم!':days+' أيام'}</span>
        </div>`;
      }).join('');
    } else {
      subsList.innerHTML='<div class="empty" style="padding:8px 0"><div class="empty-icon" style="font-size:18px"><i class="fa-solid fa-square-check" style="color:var(--accent3)"></i></div><div style="font-size:12px">لا اشتراكات منتهية قريباً</div></div>';
    }
  }

  // ── مبالغ لم تُحصَّل ──
  const uncList = document.getElementById('dash-uncollected-list');
  if(uncList){
    const uncollected = S.tasks.filter(t=>t.done && !t.paymentCollected && t.value>0);
    if(uncollected.length){
      uncList.innerHTML = uncollected.slice(0,5).map(t=>`
        <div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid rgba(42,42,58,.25)">
          <div style="flex:1;min-width:0"><div style="font-size:12px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t.title}</div><div style="font-size:11px;color:var(--text3)">${t.client||'—'}</div></div>
          <div style="text-align:left;flex-shrink:0">
            <div style="font-size:13px;font-weight:800;color:var(--accent4)">${t.value.toLocaleString()} ج</div>
            <button class="btn btn-ghost btn-sm" style="font-size:10px;padding:2px 8px;margin-top:2px" onclick="markTaskPaymentCollected(${t.id})">تحصيل</button>
          </div>
        </div>`).join('');
      if(uncollected.length>5) uncList.innerHTML += `<div style="font-size:11px;color:var(--text3);padding:5px 0;text-align:center">+ ${uncollected.length-5} مبلغ آخر</div>`;
    } else {
      uncList.innerHTML='<div class="empty" style="padding:8px 0"><div class="empty-icon" style="font-size:18px"><i class="fa-solid fa-square-check" style="color:var(--accent3)"></i></div><div style="font-size:12px">كل المبالغ محصّلة</div></div>';
    }
  }
}

// ============================================================
// LSLOAD migration for paymentAccounts
// ============================================================


// ============================================================
// <i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> NEW FEATURES BLOCK — v3
// ============================================================

// ────────────────────────────────
// <i class="fa-solid fa-repeat"></i> RECURRING TASKS
// ────────────────────────────────
function toggleRecurring(){
  const cb=document.getElementById('t-recurring');
  const opts=document.getElementById('t-recurring-opts');
  if(!opts) return;
  opts.style.display=cb?.checked?'block':'none';
}

function _createRecurringInstances(baseTask, interval, count){
  const instances=[];
  const msMap={weekly:7,biweekly:14,monthly:30,quarterly:90};
  const days=msMap[interval]||30;
  for(let i=1;i<=count;i++){
    const base=baseTask.deadline?new Date(baseTask.deadline):new Date();
    base.setDate(base.getDate()+days*i);
    const dl=base.toISOString().split('T')[0];
    const inst={...baseTask,id:Date.now()+i,deadline:dl,
      title:baseTask.title+' ('+(i+1)+')',
      recurringParent:baseTask.id,done:false,paymentCollected:false};
    instances.push(inst);
  }
  return instances;
}

// ────────────────────────────────
// <i class="fa-solid fa-alarm-clock"></i> DEADLINE PROMISE LOG
// ────────────────────────────────
let _origDeadline='';

function _onDeadlineChanged(newVal){
  const reasonWrap=document.getElementById('t-deadline-reason-wrap');
  const logBtn=document.getElementById('t-deadline-log-btn');
  const eid=document.getElementById('task-eid')?.value;
  if(eid && _origDeadline && newVal && newVal!==_origDeadline){
    if(reasonWrap) reasonWrap.style.display='block';
  } else {
    if(reasonWrap) reasonWrap.style.display='none';
  }
  const t=eid?S.tasks.find(x=>x.id==eid):null;
  if(logBtn) logBtn.style.display=(t&&t.deadlineLog&&t.deadlineLog.length)?'inline-block':'none';
}

function _showDeadlineLog(){
  const eid=document.getElementById('task-eid')?.value;
  const t=eid?S.tasks.find(x=>x.id==eid):null;
  if(!t||!t.deadlineLog||!t.deadlineLog.length){alert('لا يوجد سجل تغييرات للموعد بعد');return;}
  let msg='<i class="fa-solid fa-clipboard-list"></i> سجل تغييرات موعد التسليم:\n\n';
  t.deadlineLog.forEach((l,i)=>{
    msg+=`${i+1}. ${l.changedAt?.slice(0,10)||'—'}\n   من: ${l.from||'غير محدد'} → إلى: ${l.to}\n   السبب: ${l.reason||'لم يذكر'}\n\n`;
  });
  alert(msg);
}

// ────────────────────────────────
// <i class="fa-solid fa-flag-checkered"></i> MILESTONES
// ────────────────────────────────
function addMilestone(){
  const list=document.getElementById('t-milestones-list');if(!list)return;
  const idx=list.children.length;
  const row=document.createElement('div');
  row.className='milestone-row';
  row.style.cssText='display:flex;gap:6px;align-items:center;margin-bottom:6px';
  row.innerHTML=`<input class="form-input" style="flex:2;font-size:12px" placeholder="اسم المرحلة" data-ml-title>
    <input class="form-input" type="date" style="flex:1;font-size:12px" data-ml-date>
    <select class="form-select" style="flex:0 0 80px;font-size:11px" data-ml-status>
      <option value="pending">⏳ معلقة</option><option value="done"><i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> منتهية</option>
    </select>
    <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.remove()"><i class="fa-solid fa-trash"></i></button>`;
  list.appendChild(row);
}

function collectMilestones(){
  return [...document.querySelectorAll('.milestone-row')].map(r=>({
    title:r.querySelector('[data-ml-title]')?.value||'',
    date:r.querySelector('[data-ml-date]')?.value||'',
    status:r.querySelector('[data-ml-status]')?.value||'pending'
  })).filter(m=>m.title);
}

function renderMilestonesForm(milestones=[]){
  const list=document.getElementById('t-milestones-list');if(!list)return;
  list.innerHTML='';
  milestones.forEach(m=>{
    const row=document.createElement('div');
    row.className='milestone-row';
    row.style.cssText='display:flex;gap:6px;align-items:center;margin-bottom:6px';
    row.innerHTML=`<input class="form-input" style="flex:2;font-size:12px" placeholder="اسم المرحلة" data-ml-title value="${m.title||''}">
      <input class="form-input" type="date" style="flex:1;font-size:12px" data-ml-date value="${m.date||''}">
      <select class="form-select" style="flex:0 0 80px;font-size:11px" data-ml-status>
        <option value="pending" ${m.status!=='done'?'selected':''}>⏳ معلقة</option>
        <option value="done" ${m.status==='done'?'selected':''}><i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> منتهية</option>
      </select>
      <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.remove()"><i class="fa-solid fa-trash"></i></button>`;
    list.appendChild(row);
  });
}

// Patch milestones into openTaskModal
(function(){
  const _orig=window.openTaskModal;
  window.openTaskModal=function(id){
    _orig(id);
    const cb=document.getElementById('t-recurring');
    if(cb) cb.checked=false;
    const opts=document.getElementById('t-recurring-opts');
    if(opts) opts.style.display='none';
    if(id){
      const t=S.tasks.find(x=>x.id===id);
      if(t){
        renderMilestonesForm(t.milestones||[]);
        _origDeadline=t.deadline||'';
        // show log btn if log exists
        const logBtn=document.getElementById('t-deadline-log-btn');
        if(logBtn) logBtn.style.display=(t.deadlineLog&&t.deadlineLog.length)?'inline-block':'none';
        if(t.recurringInterval){
          if(cb) cb.checked=true;
          if(opts) opts.style.display='block';
          const iv=document.getElementById('t-recurring-interval');if(iv)iv.value=t.recurringInterval;
          const ct=document.getElementById('t-recurring-count');if(ct)ct.value=t.recurringCount||6;
        }
      }
    } else {
      renderMilestonesForm([]);
      _origDeadline='';
      const reasonWrap=document.getElementById('t-deadline-reason-wrap');
      if(reasonWrap) reasonWrap.style.display='none';
      const logBtn=document.getElementById('t-deadline-log-btn');
      if(logBtn) logBtn.style.display='none';
    }
  };
})();

// Patch milestones + recurring + deadline log into saveTask
(function(){
  const _orig=window.saveTask;
  window.saveTask=function(){
    // Collect milestones before original runs
    const milestones=collectMilestones();
    const isRecurring=document.getElementById('t-recurring')?.checked;
    const interval=document.getElementById('t-recurring-interval')?.value||'monthly';
    const count=+(document.getElementById('t-recurring-count')?.value)||6;
    const newDeadline=document.getElementById('t-deadline')?.value||'';
    const reason=document.getElementById('t-deadline-reason')?.value||'';
    const eid=document.getElementById('task-eid')?.value;

    _orig();

    // After save, patch the last saved task
    setTimeout(()=>{
      const arr=S.tasks;
      const target=eid ? arr.find(t=>t.id==eid) : arr[arr.length-1];
      if(!target) return;
      target.milestones=milestones;
      if(isRecurring){target.recurringInterval=interval;target.recurringCount=count;}
      // Deadline log
      if(eid && _origDeadline && newDeadline && newDeadline!==_origDeadline){
        if(!target.deadlineLog) target.deadlineLog=[];
        target.deadlineLog.push({from:_origDeadline,to:newDeadline,reason,changedAt:new Date().toISOString()});
      }
      lsSave();cloudSave(S);
      // Create recurring instances (new tasks only)
      if(!eid && isRecurring && count>0){
        const instances=_createRecurringInstances(target,interval,count);
        instances.forEach(inst=>S.tasks.push(inst));
        lsSave();cloudSave(S);
        renderAll();
        if(typeof showMiniNotif==='function') showMiniNotif('<i class="fa-solid fa-repeat"></i> تم إنشاء '+count+' نسخة متكررة');
      }
    }, 150);
  };
})();

// ────────────────────────────────
// <i class="fa-solid fa-bullseye"></i> COMMITMENT % (مؤشر الالتزام)
// ────────────────────────────────
function _calcCommitmentPct(){
  const now=new Date();
  const curM=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const monthDone=S.tasks.filter(t=>t.done && (t.doneAt||'').startsWith(curM));
  if(!monthDone.length) return null;
  const onTime=monthDone.filter(t=>{
    if(!t.deadline||!t.doneAt) return true; // no deadline = not counted against
    return t.doneAt.slice(0,10)<=t.deadline;
  });
  return Math.round((onTime.length/monthDone.length)*100);
}

function renderCommitmentWidget(){
  const el=document.getElementById('dash-commitment-inner');if(!el)return;
  const pct=_calcCommitmentPct();
  if(pct===null){el.innerHTML='<div style="font-size:12px;color:var(--text3);padding:8px 0">لا مهام مكتملة هذا الشهر بعد</div>';return;}
  const color=pct>=90?'var(--accent3)':pct>=70?'var(--accent2)':'var(--accent4)';
  const msg=pct>=90?'<i class="fa-solid fa-trophy"></i> ممتاز! أنت تلتزم بمواعيدك بشكل رائع':pct>=70?'👍 جيد — حاول تحسين الالتزام أكثر':'<i class="fa-solid fa-triangle-exclamation"></i> انتبه! الالتزام منخفض — راجع أولوياتك';
  el.innerHTML=`
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
      <div style="font-size:32px;font-weight:900;color:${color}">${pct}%</div>
      <div style="flex:1">
        <div style="height:8px;background:var(--surface2);border-radius:8px;overflow:hidden">
          <div style="height:100%;width:${pct}%;background:${color};border-radius:8px;transition:width .5s"></div>
        </div>
        <div style="font-size:10px;color:var(--text3);margin-top:3px">التزام بمواعيد التسليم هذا الشهر</div>
      </div>
    </div>
    <div style="font-size:11px;padding:6px 10px;border-radius:8px;background:${pct<70?'rgba(247,111,124,.1)':'rgba(79,209,165,.08)'};color:${color}">${msg}</div>`;
}

// ────────────────────────────────
// <i class="fa-solid fa-bolt"></i> MOMENTUM METER (مقياس الزخم)
// ────────────────────────────────
function _calcMomentum(){
  const now=new Date();
  const week=7*24*60*60*1000;
  const recent7=S.tasks.filter(t=>t.done && t.doneAt && (now-new Date(t.doneAt))<week);
  const recentNew=S.tasks.filter(t=>!t.done && t.id && (now-t.id)<week);
  const recentIncome=S.transactions.filter(t=>t.type==='income'&&t.isoDate&&(now-new Date(t.isoDate))<week);
  const score=Math.min(100, recent7.length*15 + recentNew.length*5 + recentIncome.length*10);
  return {score, done:recent7.length, newTasks:recentNew.length, income:recentIncome.length};
}

function renderMomentumWidget(){
  const el=document.getElementById('dash-momentum-inner');if(!el)return;
  const {score,done,newTasks,income}=_calcMomentum();
  const color=score>=70?'var(--accent3)':score>=40?'var(--accent)':'var(--accent4)';
  const emoji=score>=80?'🔥':score>=50?'<i class="fa-solid fa-bolt"></i>':score>=25?'<i class="fa-solid fa-seedling"></i>':'😴';
  const label=score>=80?'زخم عالي!':score>=50?'نشاط جيد':score>=25?'بداية جيدة':'نشاطك منخفض — ابدأ مهمة جديدة!';
  el.innerHTML=`
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
      <div style="font-size:28px">${emoji}</div>
      <div style="flex:1">
        <div style="display:flex;justify-content:space-between;margin-bottom:3px">
          <span style="font-size:11px;font-weight:700;color:${color}">${label}</span>
          <span style="font-size:14px;font-weight:900;color:${color}">${score}</span>
        </div>
        <div style="height:7px;background:var(--surface2);border-radius:8px;overflow:hidden">
          <div style="height:100%;width:${score}%;background:${color};border-radius:8px;transition:width .5s"></div>
        </div>
      </div>
    </div>
    <div style="display:flex;gap:10px;font-size:10px;color:var(--text3)">
      <span><i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> ${done} مكتملة</span><span><i class="fa-solid fa-clipboard-list"></i> ${newTasks} جديدة</span><span><i class="fa-solid fa-coins"></i> ${income} إيراد</span>
      <span style="color:var(--text3)">— آخر 7 أيام</span>
    </div>`;
}

// ────────────────────────────────
// <i class="fa-solid fa-coins"></i> EXPECTED INCOME (الدخل المتوقع)
// ────────────────────────────────
function _calcExpectedIncome(){
  const now=new Date();
  const curM=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const nextM=new Date(now.getFullYear(), now.getMonth()+1, 1);
  const nextMS=`${nextM.getFullYear()}-${String(nextM.getMonth()+1).padStart(2,'0')}`;

  // المهام النشطة غير المكتملة
  const active=S.tasks.filter(t=>!t.done&&t.value>0);
  const activeVal=active.reduce((s,t)=>s+t.value,0);

  // الفواتير المعلقة
  const pendInv=S.invoices.filter(i=>i.status==='pending').reduce((s,i)=>s+i.total,0);

  // المهام المتكررة للشهر القادم
  const recurringNext=S.tasks.filter(t=>t.recurringInterval&&!t.done&&t.value>0);
  const recurVal=recurringNext.reduce((s,t)=>s+(t.value||0),0);

  // متوسط الدخل الشهري (آخر 3 أشهر)
  const months3=[];
  for(let i=1;i<=3;i++){
    const d=new Date(now.getFullYear(),now.getMonth()-i,1);
    const mk=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    const mv=S.transactions.filter(t=>t.type==='income'&&(t.isoDate||'').startsWith(mk)).reduce((s,t)=>s+t.amount,0);
    months3.push(mv);
  }
  const avg3=months3.length?Math.round(months3.reduce((a,b)=>a+b,0)/months3.length):0;

  // نشاط الأوردرات
  const monthOrders=S.tasks.filter(t=>(t.isoDate||t.orderDate||'').startsWith(curM)).length;
  const avgMonthlyOrders=avg3>0?Math.ceil(monthOrders):0;

  // هل في وقت لقبول أوردر جديد؟
  const activeCount=S.tasks.filter(t=>!t.done&&(t.status==='progress'||t.status==='new')).length;
  const capacity=S.settings?.monthlyCapacity||10;
  const canAccept=activeCount<capacity;
  const recommendation=canAccept?
    (activeCount<capacity*0.5?'<i class="fa-solid fa-circle"></i> عندك وقت — مناسب تقبل أوردرات جديدة':'<i class="fa-solid fa-circle"></i> محمّل نسبياً — ممكن تقبل أوردر أو اتنين'):
    '<i class="fa-solid fa-circle"></i> مشغول — مش مناسب تقبل أوردرات جديدة دلوقتي';

  return {activeVal,pendInv,recurVal,avg3,activeCount,capacity,canAccept,recommendation,monthOrders};
}

function renderExpectedWidget(){
  const el=document.getElementById('dash-expected-inner');if(!el)return;
  const {activeVal,pendInv,avg3,activeCount,capacity,recommendation,monthOrders}=_calcExpectedIncome();
  const total=activeVal+pendInv;
  const isWeak=total<avg3*0.7&&avg3>0;
  el.innerHTML=`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">
      <div style="background:var(--surface2);border-radius:8px;padding:9px;text-align:center">
        <div style="font-size:16px;font-weight:900;color:var(--accent3)">${total.toLocaleString()} ج</div>
        <div style="font-size:9px;color:var(--text3)"><i class="fa-solid fa-coins"></i> متوقع هذا الشهر</div>
      </div>
      <div style="background:var(--surface2);border-radius:8px;padding:9px;text-align:center">
        <div style="font-size:16px;font-weight:900;color:var(--accent)">${avg3.toLocaleString()} ج</div>
        <div style="font-size:9px;color:var(--text3)"><i class="fa-solid fa-chart-bar"></i> متوسط آخر 3 أشهر</div>
      </div>
      <div style="background:var(--surface2);border-radius:8px;padding:9px;text-align:center">
        <div style="font-size:16px;font-weight:900;color:var(--accent2)">${activeCount}</div>
        <div style="font-size:9px;color:var(--text3)"><i class="fa-solid fa-clipboard-list"></i> مهام نشطة الآن</div>
      </div>
      <div style="background:var(--surface2);border-radius:8px;padding:9px;text-align:center">
        <div style="font-size:16px;font-weight:900;color:var(--text2)">${monthOrders}</div>
        <div style="font-size:9px;color:var(--text3)"><i class="fa-solid fa-folder-open"></i> أوردرات هذا الشهر</div>
      </div>
    </div>
    ${isWeak?`<div style="background:rgba(247,111,124,.1);border:1px solid rgba(247,111,124,.2);border-radius:8px;padding:7px 10px;font-size:11px;color:var(--accent4);margin-bottom:7px"><i class="fa-solid fa-triangle-exclamation"></i> الشهر ده هيكون ضعيف — فكر تقبل أوردرات جديدة</div>`:''}
    <div style="background:${activeCount<capacity*0.5?'rgba(79,209,165,.08)':activeCount<capacity?'rgba(247,201,72,.08)':'rgba(247,111,124,.08)'};border-radius:8px;padding:7px 10px;font-size:11px">${recommendation}</div>`;
}

// ────────────────────────────────
// <i class="fa-solid fa-alarm-clock"></i> UPCOMING DEADLINES (24/48h)
// ────────────────────────────────
function renderUpcomingWidget(){
  const el=document.getElementById('dash-upcoming-inner');if(!el)return;
  const now=new Date();
  const in48=new Date(now.getTime()+48*60*60*1000);
  const upcoming=S.tasks.filter(t=>{
    if(t.done||!t.deadline) return false;
    const d=new Date(t.deadline+'T23:59:59');
    return d>=now && d<=in48;
  }).sort((a,b)=>a.deadline.localeCompare(b.deadline));

  if(!upcoming.length){
    el.innerHTML='<div class="empty" style="padding:8px 0"><div class="empty-icon" style="font-size:18px"><i class="fa-solid fa-square-check" style="color:var(--accent3)"></i></div><div style="font-size:12px">لا مواعيد خلال 48 ساعة</div></div>';
    return;
  }
  el.innerHTML=upcoming.map(t=>{
    const hrs=Math.max(0,Math.ceil((new Date(t.deadline+'T23:59:59')-now)/(1000*60*60)));
    const urgent=hrs<=24;
    return `<div onclick="openTaskDetail(${t.id})" class="task-clickable" style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid rgba(42,42,58,.25);cursor:pointer">
      <div style="flex:1;min-width:0">
        <div style="font-size:12px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${t.title}</div>
        <div style="font-size:10px;color:var(--text3)">${t.client||'—'}</div>
      </div>
      <span style="font-size:11px;font-weight:800;white-space:nowrap;padding:2px 8px;border-radius:10px;background:${urgent?'rgba(247,111,124,.15)':'rgba(247,201,72,.12)'};color:${urgent?'var(--accent4)':'var(--accent2)'}"><i class="fa-solid fa-alarm-clock"></i> ${hrs}س</span>
    </div>`;
  }).join('');
}

// ────────────────────────────────
// <i class="fa-solid fa-dna"></i> VALUE SCORE (تقييم العميل)
// ────────────────────────────────
function _calcClientScore(c){
  const cTasks=S.tasks.filter(t=>t.client===c.name);
  const cInvs=S.invoices.filter(i=>i.client===c.name);
  let score=0;
  // كمية الشغل (40 نقطة)
  score+=Math.min(40, cTasks.length*4);
  // الانتظام في الدفع (30 نقطة)
  const payMap={instant:30,normal:20,late:5,very_late:0,undefined:15};
  score+=payMap[c.dnaPayment]??15;
  // سهولة التعامل (30 نقطة)
  const styleMap={easy:30,detail:22,reviews:15,quick:25,vague:10,demanding:5};
  score+=styleMap[c.dnaStyle]??20;
  return Math.min(100,score);
}

function _clientScoreBadge(score){
  if(score>=80) return '<span style="font-size:10px;padding:1px 7px;border-radius:8px;background:rgba(247,201,72,.2);color:#c8a400;font-weight:800"><i class="fa-solid fa-star"></i> ذهبي</span>';
  if(score>=60) return '<span style="font-size:10px;padding:1px 7px;border-radius:8px;background:rgba(79,209,165,.15);color:var(--accent3);font-weight:700"><i class="fa-solid fa-gem"></i> ممتاز</span>';
  if(score>=40) return '<span style="font-size:10px;padding:1px 7px;border-radius:8px;background:rgba(124,111,247,.12);color:var(--accent);font-weight:700"><i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> جيد</span>';
  return '<span style="font-size:10px;padding:1px 7px;border-radius:8px;background:rgba(247,111,124,.12);color:var(--accent4);font-weight:700"><i class="fa-solid fa-triangle-exclamation"></i> منخفض</span>';
}

// ────────────────────────────────
// <i class="fa-solid fa-bell-slash"></i> SILENT CLIENT ALERT (العميل الهادي)
// ────────────────────────────────
function _checkSilentClients(){
  const now=new Date();
  const alerts=[];
  S.clients.forEach(c=>{
    const tasks=S.tasks.filter(t=>t.client===c.name);
    if(!tasks.length) return;
    const dates=tasks.map(t=>(t.orderDate||t.isoDate||t.doneAt||'')).filter(Boolean).sort().reverse();
    const lastDate=dates[0];
    if(!lastDate) return;
    const daysDiff=Math.floor((now-new Date(lastDate))/(1000*60*60*24));
    if(daysDiff>=30) alerts.push({client:c,days:daysDiff});
  });
  return alerts.sort((a,b)=>b.days-a.days);
}

// ────────────────────────────────
// <i class="fa-solid fa-trophy"></i> WEEKLY CHALLENGE (تحدي الأسبوع)
// ────────────────────────────────
function _getWeekKey(){
  const d=new Date();
  const start=new Date(d); start.setDate(d.getDate()-d.getDay());
  return start.toISOString().slice(0,10);
}

function _getWeeklyChallenge(){
  const weekKey=_getWeekKey();

  // ① تحدي الأدمن — له الأولوية إذا كان لنفس الأسبوع
  const adminCh = S._adminChallenge;
  if(adminCh && adminCh.weekKey === weekKey){
    // استرجع حالة التقدم المحفوظة محلياً لهذا التحدي
    const localKey = '_wkch_' + adminCh.id;
    const saved = JSON.parse(localStorage.getItem(localKey)||'{}');
    return {
      ...adminCh,
      done:     saved.done     || false,
      progress: saved.progress || 0,
      isAdmin:  true,
      _localKey: localKey
    };
  }

  // ② تحدي تلقائي محلي (fallback)
  const saved=JSON.parse(localStorage.getItem('_weekChallenge')||'{}');
  if(saved.week===weekKey) return saved;

  const now=new Date();
  const avg=_calcExpectedIncome().avg3||1000;
  const challenges=[
    {title:'سلّم 3 مهام في موعدها هذا الأسبوع',type:'on_time',target:3,unit:'مهمة',reward:'أنجزت التزاماتك في الموعد! 🏆⏰'},
    {title:`وصّل دخلك لـ ${Math.round(avg*0.3).toLocaleString()} ج هذا الأسبوع`,type:'income',target:Math.round(avg*0.3),unit:'ج.م',reward:'رائع! حققت هدفك المالي هذا الأسبوع 💰🎉'},
    {title:'أنهِ 5 مهام نشطة هذا الأسبوع',type:'complete',target:5,unit:'مهمة',reward:'عمل رائع! أنجزت 5 مهام هذا الأسبوع 🎯✅'},
    {title:'لا تقبل أوردر جديد دون تسليم مهمة قديمة أولاً',type:'discipline',target:1,unit:'يوم',reward:'انضباط تام! أنت تتحكم في وقتك 💪'},
    {title:'تواصل مع 2 من عملائك القدامى هذا الأسبوع',type:'contact',target:2,unit:'عميل',reward:'علاقات قوية = عمل مستدام 🤝✨'},
  ];
  const ch=challenges[now.getDay()%challenges.length];
  const challenge={...ch, week:weekKey, done:false, progress:0, badge:'<i class="fa-solid fa-medal"></i>'};
  localStorage.setItem('_weekChallenge',JSON.stringify(challenge));
  return challenge;
}

// ── احتفال إتمام التحدي ──
function _fireChallengeConfetti(){
  if(typeof document === 'undefined') return;
  const canvas = document.createElement('canvas');
  canvas.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;z-index:99999;pointer-events:none';
  document.body.appendChild(canvas);
  canvas.width = window.innerWidth; canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');
  const pieces = [];
  const colors = ['#7c6ff7','#4fd1a5','#f7c948','#f76f7c','#fff','#a89cff'];
  for(let i=0;i<140;i++){
    pieces.push({
      x: Math.random()*canvas.width, y: -20,
      w: 8+Math.random()*8, h: 14+Math.random()*8,
      r: Math.random()*360, dr: (Math.random()-0.5)*8,
      vy: 2+Math.random()*4, vx: (Math.random()-0.5)*3,
      color: colors[Math.floor(Math.random()*colors.length)],
      alpha: 1
    });
  }
  let frame=0;
  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    pieces.forEach(p=>{
      p.y+=p.vy; p.x+=p.vx; p.r+=p.dr;
      if(frame>80) p.alpha=Math.max(0,p.alpha-0.015);
      ctx.save(); ctx.globalAlpha=p.alpha; ctx.translate(p.x,p.y); ctx.rotate(p.r*Math.PI/180);
      ctx.fillStyle=p.color; ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);
      ctx.restore();
    });
    frame++;
    if(frame<130) requestAnimationFrame(draw);
    else canvas.remove();
  }
  draw();
}

function _showChallengeDoneModal(ch){
  // إزالة أي modal قديم
  document.getElementById('_ch-done-modal')?.remove();
  const reward = ch.reward || 'أحسنت! أتممت تحدي الأسبوع! 🏆';
  const m = document.createElement('div');
  m.id = '_ch-done-modal';
  m.style.cssText='position:fixed;inset:0;z-index:99998;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.55);backdrop-filter:blur(4px)';
  m.innerHTML=`
    <div style="background:var(--surface);border-radius:24px;padding:36px 28px;max-width:360px;width:90%;text-align:center;border:2px solid rgba(247,201,72,.4);box-shadow:0 20px 60px rgba(0,0,0,.5);animation:_chPop .45s cubic-bezier(.34,1.56,.64,1)">
