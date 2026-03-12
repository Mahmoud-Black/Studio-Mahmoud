// ============================================================
// MONTHLY FINANCE TIMELINE
// ============================================================
function renderMonthlyTimeline(){
  const el = document.getElementById('monthly-timeline'); if(!el) return;
  const yearSel = document.getElementById('fin-year-timeline');
  // Populate years
  const years = [...new Set(S.transactions.map(t=>t.isoDate?t.isoDate.slice(0,4):null).filter(Boolean))];
  const thisYear = new Date().getFullYear().toString();
  if(!years.includes(thisYear)) years.push(thisYear);
  years.sort((a,b)=>b-a);
  if(yearSel){
    const cur = yearSel.value;
    yearSel.innerHTML = years.map(y=>`<option value="${y}">${y}</option>`).join('');
    yearSel.value = cur && years.includes(cur) ? cur : thisYear;
  }
  const selYear = yearSel ? yearSel.value : thisYear;
  const mNames = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
  const now = new Date();
  const rows = mNames.map((mName,i)=>{
    const mNum = String(i+1).padStart(2,'0');
    const prefix = `${selYear}-${mNum}`;
    const mTrans = S.transactions.filter(t=>(t.isoDate||'').startsWith(prefix));
    const inc = mTrans.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
    const exp = mTrans.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
    const net = inc-exp;
    const isCurrent = +selYear===now.getFullYear() && i===now.getMonth();
    const isFuture = +selYear>now.getFullYear() || (+selYear===now.getFullYear() && i>now.getMonth());
    if(isFuture && !mTrans.length) return '';
    return `<div onclick="jumpToMonth('${String(i+1)}','${selYear}')" style="display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:8px;cursor:pointer;transition:.15s;${isCurrent?'background:rgba(124,111,247,.1);border:1px solid rgba(124,111,247,.3)':'border:1px solid transparent'};margin-bottom:4px" class="task-clickable">
      <div style="font-size:12px;font-weight:700;color:${isCurrent?'var(--accent)':'var(--text2)'};width:60px">${mName}${isCurrent?' ◀':''}</div>
      <div style="flex:1;height:6px;background:var(--surface3);border-radius:4px;overflow:hidden;position:relative">
        ${inc?`<div style="position:absolute;right:0;top:0;height:100%;width:${Math.min(100,Math.round(inc/(Math.max(inc,exp)||1)*100))}%;background:var(--accent3);border-radius:4px;opacity:.7"></div>`:''}
        ${exp?`<div style="position:absolute;right:0;top:0;height:100%;width:${Math.min(100,Math.round(exp/(Math.max(inc,exp)||1)*100))}%;background:var(--accent4);border-radius:4px;opacity:.5"></div>`:''}
      </div>
      <div style="font-size:11px;color:var(--accent3);width:70px;text-align:left;font-weight:700">+${inc.toLocaleString()}</div>
      <div style="font-size:11px;color:var(--accent4);width:70px;text-align:left">-${exp.toLocaleString()}</div>
      <div style="font-size:11px;font-weight:800;width:70px;text-align:left;color:${net>=0?'var(--accent3)':'var(--accent4)'}">${net>=0?'+':''}${net.toLocaleString()} ج</div>
    </div>`;
  }).filter(Boolean).join('');
  el.innerHTML = rows || `<div style="font-size:12px;color:var(--text3);padding:8px">لا معاملات في ${selYear}</div>`;
}

function jumpToMonth(month, year){
  const ms = document.getElementById('fin-filter-month');
  const ys = document.getElementById('fin-filter-year');
  if(ms) ms.value = month;
  if(ys) ys.value = year;
  finFilterState.month = month;
  finFilterState.year  = year;
  renderFinance();
}

// ============================================================
// MEMBER PROFILE VIEW
// ============================================================
function openMemberProfile(memberName){
  document.getElementById('teams-grid-view').style.display='none';
  document.getElementById('member-profile-view').style.display='block';
  document.getElementById('member-profile-title').innerHTML='<i class="fa-solid fa-user"></i> '+memberName;

  // Tasks assigned to this member
  const allTasks = S.tasks.filter(t=>t.workerMember===memberName);
  const activeTasks = allTasks.filter(t=>!t.done);
  const doneTasks   = allTasks.filter(t=>t.done);

  // Financial summary
  const totalOwed  = allTasks.reduce((s,t)=>s+(t.workerAmount||0),0);
  const totalDeposits = allTasks.filter(t=>t.workerDepositPaid).reduce((s,t)=>s+(t.workerDepositAmount||0),0);
  const pendingPay = totalOwed - totalDeposits;

  const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v;};
  set('mp-tasks-count', activeTasks.length);
  set('mp-done-count',  doneTasks.length);
  set('mp-total-paid', totalDeposits.toLocaleString()+' '+_getCurrency());
  set('mp-pending-pay', pendingPay.toLocaleString()+' '+_getCurrency());
  // Store data for manual statement generation
  window._mpCurrentMember = memberName;
  window._mpAllTasks = allTasks;
  window._mpTotalOwed = totalOwed;
  window._mpTotalDeposits = totalDeposits;
  window._mpPendingPay = pendingPay;
  const stmtTable = document.getElementById('mp-statement-table');
  if(stmtTable){
    if(!allTasks.length){
      stmtTable.innerHTML='<div style="text-align:center;color:var(--text3);padding:16px">لا توجد مهام مسجلة لهذا العضو</div>';
    } else {
      stmtTable.innerHTML='<table style="width:100%;border-collapse:collapse">'+
        '<thead><tr style="background:var(--surface2)">'+
        '<th style="padding:8px 10px;text-align:right;font-size:11px;font-weight:700;color:var(--text3)">المهمة</th>'+
        '<th style="padding:8px 10px;text-align:right;font-size:11px;font-weight:700;color:var(--text3)">الحالة</th>'+
        '<th style="padding:8px 10px;text-align:right;font-size:11px;font-weight:700;color:var(--text3)">المستحق</th>'+
        '<th style="padding:8px 10px;text-align:right;font-size:11px;font-weight:700;color:var(--text3)">المدفوع</th>'+
        '<th style="padding:8px 10px;text-align:right;font-size:11px;font-weight:700;color:var(--text3)">المتبقي</th>'+
        '</tr></thead><tbody>'+
        allTasks.map(function(t){
          var stM={new:'جديد',progress:'قيد التنفيذ',review:'مراجعة',done:'<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> مكتمل'};
          var st=t.done?'<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> مكتمل':(stM[t.status]||t.status);
          var owed=t.workerAmount||0;
          var paid=t.workerDepositPaid?(t.workerDepositAmount||0):0;
          var bal=owed-paid;
          return '<tr style="border-bottom:1px solid var(--border)">'+
            '<td style="padding:8px 10px;font-size:12px;font-weight:600">'+t.title+'</td>'+
            '<td style="padding:8px 10px;font-size:11px">'+st+'</td>'+
            '<td style="padding:8px 10px;font-size:12px;color:var(--accent2);font-weight:700">'+owed.toLocaleString()+' ج</td>'+
            '<td style="padding:8px 10px;font-size:12px;color:var(--accent3);font-weight:700">'+paid.toLocaleString()+' ج</td>'+
            '<td style="padding:8px 10px;font-size:12px;font-weight:700;color:'+(bal>0?'var(--accent4)':'var(--accent3)')+'">'+bal.toLocaleString()+' ج</td>'+
            '</tr>';
        }).join('')+
        '</tbody>'+
        '<tfoot><tr style="background:var(--surface2)">'+
        '<td colspan="2" style="padding:8px 10px;font-size:12px;font-weight:800">الإجمالي</td>'+
        '<td style="padding:8px 10px;font-size:12px;color:var(--accent2);font-weight:800">'+totalOwed.toLocaleString()+' ج</td>'+
        '<td style="padding:8px 10px;font-size:12px;color:var(--accent3);font-weight:800">'+totalDeposits.toLocaleString()+' ج</td>'+
        '<td style="padding:8px 10px;font-size:12px;font-weight:800;color:'+(pendingPay>0?'var(--accent4)':'var(--accent3)')+'">'+pendingPay.toLocaleString()+' ج</td>'+
        '</tr></tfoot></table>';
    }
  }

  // Active tasks list
  const el1 = document.getElementById('mp-tasks-list');
  if(el1) el1.innerHTML = activeTasks.length ? activeTasks.map(t=>{
    const stMap={new:'<i class="fa-solid fa-clipboard-list"></i> جديد',progress:'<i class="fa-solid fa-bolt"></i> جاري',review:'<i class="fa-solid fa-magnifying-glass"></i> مراجعة',paused:'⏸ موقوف',done:'<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> مكتمل'};
    const stepsTotal=t.steps?t.steps.length:0;
    const stepsDone=t.steps?t.steps.filter(s=>s.done).length:0;
    const pct=stepsTotal?Math.round(stepsDone/stepsTotal*100):0;
    return `<div onclick="openTaskDetail(${t.id})" class="task-clickable" style="padding:10px;background:var(--surface2);border:1px solid var(--border);border-radius:8px;margin-bottom:8px;cursor:pointer">
      <div style="font-size:13px;font-weight:700;margin-bottom:4px">${t.title}</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;font-size:11px;color:var(--text3)">
        <span>${t.client||'—'}</span>
        <span style="color:var(--accent2)">${stMap[t.status||'new']}</span>
        ${t.workerAmount?`<span style="color:var(--accent4);font-weight:700">مستحق: ${t.workerAmount.toLocaleString()} ج</span>`:''}
      </div>
      ${stepsTotal?`<div style="margin-top:6px;display:flex;align-items:center;gap:6px">
        <div style="flex:1;height:4px;background:var(--surface3);border-radius:2px"><div style="height:100%;width:${pct}%;background:var(--accent);border-radius:2px"></div></div>
        <span style="font-size:10px;color:var(--text3)">${pct}%</span></div>`:''}
    </div>`;
  }).join('') : '<div class="empty" style="padding:16px 0;font-size:12px">لا مهام نشطة</div>';

  // Payments list
  const el2 = document.getElementById('mp-payments-list');
  if(el2) el2.innerHTML = allTasks.filter(t=>t.workerAmount>0).length ? allTasks.filter(t=>t.workerAmount>0).map(t=>`
    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
      <div>
        <div style="font-size:12px;font-weight:700">${t.title}</div>
        <div style="font-size:11px;color:var(--text3)">${t.done?'مكتمل':'جاري'}</div>
      </div>
      <div style="text-align:left">
        <div style="font-size:13px;font-weight:800;color:var(--accent4)">${(t.workerAmount||0).toLocaleString()} ج</div>
        ${t.workerDepositPaid?`<div style="font-size:10px;color:var(--accent3)">عربون: ${(t.workerDepositAmount||0).toLocaleString()} ج <i class="fa-solid fa-check"></i></div>`:'<div style="font-size:10px;color:var(--accent2)">لم يُدفع عربون</div>'}
      </div>
    </div>`).join('') : '<div class="empty" style="padding:16px 0;font-size:12px">لا مدفوعات مسجلة</div>';

  // Done tasks
  const el3 = document.getElementById('mp-done-list');
  if(el3) el3.innerHTML = doneTasks.length ? doneTasks.map(t=>`
    <div onclick="openTaskDetail(${t.id})" class="task-clickable" style="padding:9px;background:var(--surface2);border:1px solid rgba(79,209,165,.2);border-radius:8px;margin-bottom:7px;cursor:pointer;display:flex;justify-content:space-between;align-items:center">
      <div>
        <div style="font-size:12px;font-weight:700;color:var(--text2);text-decoration:line-through">${t.title}</div>
        <div style="font-size:11px;color:var(--text3)">${t.client||'—'}</div>
      </div>
      ${t.workerAmount?`<span style="font-size:12px;font-weight:700;color:var(--accent3)">${t.workerAmount.toLocaleString()} ج</span>`:''}
    </div>`).join('') : '<div class="empty" style="padding:16px 0;font-size:12px">لا مهام مكتملة</div>';
}

function mpToggleStmt(){
  var c = document.getElementById('mp-stmt-content');
  var btn = document.getElementById('mp-stmt-toggle-btn');
  if(!c) return;
  var showing = c.style.display !== 'none';
  if(showing){ c.style.display='none'; if(btn) btn.textContent='+ إنشاء كشف حساب'; return; }
  // Build the statement
  var allTasks = window._mpAllTasks || [];
  var totalOwed = window._mpTotalOwed || 0;
  var totalDeposits = window._mpTotalDeposits || 0;
  var pendingPay = window._mpPendingPay || 0;
  var set = function(id,v){ var e=document.getElementById(id); if(e) e.textContent=v; };
  set('mp-stat-total-tasks', allTasks.length);
  set('mp-stat-total-earned', totalOwed.toLocaleString()+' '+_getCurrency());
  set('mp-stat-balance', pendingPay.toLocaleString()+' '+_getCurrency());
  var stmtTable = document.getElementById('mp-statement-table');
  if(stmtTable){
    if(!allTasks.length){
      stmtTable.innerHTML='<div style="text-align:center;color:var(--text3);padding:16px">لا توجد مهام مسجلة</div>';
    } else {
      stmtTable.innerHTML='<table style="width:100%;border-collapse:collapse">'+
        '<thead><tr style="background:var(--surface2)">'+
        '<th style="padding:8px 10px;text-align:right;font-size:11px;color:var(--text3)">المهمة</th>'+
        '<th style="padding:8px 10px;text-align:right;font-size:11px;color:var(--text3)">الحالة</th>'+
        '<th style="padding:8px 10px;text-align:right;font-size:11px;color:var(--text3)">المستحق</th>'+
        '<th style="padding:8px 10px;text-align:right;font-size:11px;color:var(--text3)">المدفوع</th>'+
        '<th style="padding:8px 10px;text-align:right;font-size:11px;color:var(--text3)">المتبقي</th>'+
        '</tr></thead><tbody>'+
        allTasks.map(function(t){
          var stM={new:'جديد',progress:'قيد التنفيذ',review:'مراجعة',done:'<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> مكتمل'};
          var st=t.done?'<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> مكتمل':(stM[t.status]||t.status||'');
          var owed=t.workerAmount||0, paid=t.workerDepositPaid?(t.workerDepositAmount||0):0, bal=owed-paid;
          return '<tr style="border-bottom:1px solid var(--border)">'+
            '<td style="padding:8px 10px;font-size:12px;font-weight:600">'+t.title+'</td>'+
            '<td style="padding:8px 10px;font-size:11px">'+st+'</td>'+
            '<td style="padding:8px 10px;font-size:12px;color:var(--accent2);font-weight:700">'+owed.toLocaleString()+' ج</td>'+
            '<td style="padding:8px 10px;font-size:12px;color:var(--accent3);font-weight:700">'+paid.toLocaleString()+' ج</td>'+
            '<td style="padding:8px 10px;font-size:12px;font-weight:700;color:'+(bal>0?'var(--accent4)':'var(--accent3)')+'">'+bal.toLocaleString()+' ج</td></tr>';
        }).join('')+
        '</tbody><tfoot><tr style="background:var(--surface2)">'+
        '<td colspan="2" style="padding:8px 10px;font-size:12px;font-weight:800">الإجمالي</td>'+
        '<td style="padding:8px 10px;font-size:12px;color:var(--accent2);font-weight:800">'+totalOwed.toLocaleString()+' ج</td>'+
        '<td style="padding:8px 10px;font-size:12px;color:var(--accent3);font-weight:800">'+totalDeposits.toLocaleString()+' ج</td>'+
        '<td style="padding:8px 10px;font-size:12px;font-weight:800;color:'+(pendingPay>0?'var(--accent4)':'var(--accent3)')+'">'+pendingPay.toLocaleString()+' ج</td>'+
        '</tr></tfoot></table>';
    }
  }
  c.style.display='block';
  if(btn) btn.textContent='إخفاء الكشف';
}
function mpPrintStmt(){
  var memberName = window._mpCurrentMember || '';
  var studio = S.settings?.name||'Ordo';
  var el = document.getElementById('mp-stmt-content');
  if(!el) return;
  var w = window.open('','_blank');
  w.document.write('<html dir="rtl"><head><meta charset="UTF-8"><title>كشف حساب - '+memberName+'</title>'+
    '<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet">'+
    '<style>body{font-family:Cairo,sans-serif;padding:30px;color:#1a1a2e}table{width:100%;border-collapse:collapse}'+
    'th{background:#f5f5f5;padding:10px;text-align:right;font-size:12px}td{padding:9px 10px;border-bottom:1px solid #eee;font-size:13px}'+
    'h2{font-size:20px}h3{font-size:16px;color:#7c6ff7}</style></head><body>'+
    '<h2>'+studio+' — كشف حساب</h2><h3>العضو: '+memberName+'</h3>'+
    '<p style="color:#888;font-size:12px">تاريخ الكشف: '+new Date().toLocaleDateString('ar-EG')+'</p>'+
    el.innerHTML+'</body></html>');
  w.document.close(); w.print();
}

function sendMemberWA(msgType){
  var titleEl = document.getElementById('member-profile-title');
  var memberName = titleEl ? titleEl.textContent.replace('<i class="fa-solid fa-user"></i> ','').trim() : '';
  // Find member phone
  var phone = '';
  (S.teams||[]).forEach(function(t){
    (t.members||[]).forEach(function(m){
      if(m.name===memberName && m.phone) phone=m.phone.replace(/\D/g,'');
    });
  });
  var studio = S.settings?.name||'';
  var activeTasks = (S.tasks||[]).filter(function(t){return t.workerMember===memberName && !t.done;});
  var text = '';
  if(msgType==='project'){
    var taskList = activeTasks.slice(0,5).map(function(t){return '• '+t.title+(t.deadline?' (موعد: '+t.deadline+')':'');}).join('\n');
    text = 'مرحباً ' + memberName + ' <i class="fa-solid fa-hand-wave"></i>\n\n' +
      'هذه مهامك الحالية لدى ' + studio + ':\n' + (taskList||'لا توجد مهام نشطة') +
      '\n\nللاستفسار تواصل معنا <i class="fa-solid fa-hands"></i>';
  } else {
    var lateTasks = activeTasks.filter(function(t){return t.deadline && t.deadline < new Date().toISOString().split('T')[0];});
    var taskList = lateTasks.slice(0,3).map(function(t){return '• '+t.title+' (كان المفترض: '+t.deadline+')';}).join('\n');
    text = 'تنبيه هام <i class="fa-solid fa-triangle-exclamation"></i>\n\nعزيزي ' + memberName + '،\n' +
      'يرجى الانتباه للمهام التالية المتأخرة:\n' + (taskList||activeTasks.slice(0,3).map(function(t){return '• '+t.title;}).join('\n')) +
      '\n\nنرجو التواصل معنا في أقرب وقت. ' + studio;
  }
  var url = phone
    ? 'https://wa.me/'+phone+'?text='+encodeURIComponent(text)
    : 'https://wa.me/?text='+encodeURIComponent(text);
  window.open(url,'_blank');
}

function closeMemberProfile(){
  document.getElementById('teams-grid-view').style.display='block';
  document.getElementById('member-profile-view').style.display='none';
}

// ── Send message to team member ──
function openMemberMessageModal(){
  var memberName = window._mpCurrentMember;
  if(!memberName){ toast('لم يُحدد عضو'); return; }
  var ex=document.getElementById('_member-msg-overlay'); if(ex) ex.remove();
  var ov=document.createElement('div');
  ov.id='_member-msg-overlay';
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px)';
  ov.innerHTML='<div style="background:var(--surface);border:1px solid var(--border);border-radius:18px;padding:24px;width:400px;max-width:95vw;font-family:var(--font)">'+
    '<div style="font-size:16px;font-weight:800;margin-bottom:16px;color:var(--text)"><i class="fa-solid fa-paper-plane" style="color:var(--accent)"></i> رسالة إلى '+escapeHtml(memberName)+'</div>'+
    '<textarea id="_mbr-msg-txt" rows="4" style="width:100%;background:var(--surface2);border:1.5px solid var(--border);border-radius:10px;padding:10px;color:var(--text);font-family:var(--font);font-size:13px;resize:vertical;box-sizing:border-box" placeholder="اكتب رسالتك هنا..."></textarea>'+
    '<div style="display:flex;gap:8px;margin-top:12px;justify-content:flex-end">'+
      '<button onclick="document.getElementById(\'_member-msg-overlay\').remove()" style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:9px 18px;font-family:var(--font);font-size:13px;cursor:pointer;color:var(--text2)">إلغاء</button>'+
      '<button onclick="_sendMemberMessage(\''+memberName.replace(/'/g,"\\'")+'\')" style="background:var(--accent);color:#fff;border:none;border-radius:10px;padding:9px 20px;font-family:var(--font);font-size:13px;font-weight:700;cursor:pointer"><i class="fa-solid fa-paper-plane"></i> إرسال</button>'+
    '</div>'+
  '</div>';
  ov.onclick=function(e){if(e.target===ov)ov.remove();};
  document.body.appendChild(ov);
  setTimeout(function(){var t=document.getElementById('_mbr-msg-txt');if(t)t.focus();},100);
}

async function _sendMemberMessage(memberName){
  var txt=(document.getElementById('_mbr-msg-txt')||{}).value||'';
  if(!txt.trim()){toast('<i class="fa-solid fa-triangle-exclamation"></i> اكتب رسالة أولاً');return;}
  var btn=document.querySelector('#_member-msg-overlay button[onclick*="_sendMemberMessage"]');
  if(btn){btn.disabled=true;btn.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i>';}

  var ownerName=(S.settings&&S.settings.name)||'مشرف';
  var msgNotif={
    id:Date.now()+'_m',
    title:'<i class="fa-solid fa-envelope"></i> رسالة من '+ownerName,
    body:txt.trim(),
    type:'direct_message',
    from:ownerName,
    created_at:new Date().toISOString(),
    read:false
  };

  // Find member's email
  var memberEmail='';
  for(var t of (S.teams||[])){
    for(var m of (t.members||[])){
      if(m.name===memberName&&m.email){memberEmail=m.email.toLowerCase().trim();break;}
    }
    if(memberEmail) break;
  }

  var saved=false;
  if(typeof supa!=='undefined'&&memberEmail){
    // Find target user
    var targetUserId=null;
    try{
      var {data:rows}=await supa.from('studio_data').select('user_id,data').limit(500);
      if(rows){for(var row of rows){try{var ud2=typeof row.data==='string'?JSON.parse(row.data):row.data;var se2=(ud2?.settings?.email||ud2?._user_email||'').toLowerCase().trim();if(se2&&se2===memberEmail){targetUserId=row.user_id;break;}}catch(e){}}}
    }catch(e){}
    if(targetUserId){
      var {data:tgt}=await supa.from('studio_data').select('data').eq('user_id',targetUserId).single().catch(()=>({data:null}));
      var ud=null;
      if(tgt){try{ud=typeof tgt.data==='string'?JSON.parse(tgt.data):tgt.data;}catch(e){}}
      if(!ud)ud={};
      ud._pending_notifications=ud._pending_notifications||[];
      ud._messages=ud._messages||[];
      ud._messages.push(msgNotif);
      ud._pending_notifications.push(msgNotif);
      await supa.from('studio_data').update({data:JSON.stringify(ud),updated_at:new Date().toISOString()}).eq('user_id',targetUserId);
      saved=true;
    }
  }

  document.getElementById('_member-msg-overlay').remove();
  toast(saved?'<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم إرسال الرسالة لـ '+memberName:'<i class="fa-solid fa-triangle-exclamation"></i> لم يتمكن من إيجاد حساب '+memberName);
}


// ============================================================
// SUBSCRIPTIONS — Remaining days + custom categories
// ============================================================
function renderSubsWithReminder(){
  const el = document.getElementById('subs-list'); if(!el) return;
  const subs = S.subscriptions||[];
  if(!subs.length){ el.innerHTML='<div style="font-size:12px;color:var(--text3);padding:8px 0">لا اشتراكات مسجلة بعد</div>'; return; }
  const today = new Date();
  el.innerHTML = subs.map((s,i)=>{
    const day = s.day||1;
    let nextDate = new Date(today.getFullYear(), today.getMonth(), day);
    if(nextDate <= today) nextDate = new Date(today.getFullYear(), today.getMonth()+1, day);
    const diffMs = nextDate - today;
    const diffDays = Math.ceil(diffMs/(1000*60*60*24));
    const urgent = diffDays<=5;
    return `<div style="display:flex;align-items:center;gap:10px;background:var(--surface2);border:1px solid ${urgent?'rgba(247,111,124,.4)':'var(--border)'};border-radius:8px;padding:10px 14px;margin-bottom:8px">
      <div style="flex:1">
        <div style="font-weight:700;font-size:13px"><i class="fa-solid fa-laptop"></i> ${s.name}</div>
        <div style="font-size:11px;color:var(--text3)">${s.cat||'اشتراكات'} · ${s.amount.toLocaleString()} ج/شهر · يتجدد يوم ${s.day}</div>
        <div style="font-size:11px;margin-top:3px;font-weight:700;color:${urgent?'var(--accent4)':'var(--accent3)'}">${urgent?'<i class="fa-solid fa-triangle-exclamation"></i> ':'<i class="fa-solid fa-alarm-clock"></i> '}يتجدد خلال ${diffDays} يوم (${nextDate.toLocaleDateString('ar-EG')})</div>
      </div>
      <button class="btn btn-success btn-sm" onclick="renewSubscription(${i})" title="تجديد الآن"><i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تجديد</button>
      <button class="btn btn-danger btn-sm" onclick="delSubscription(${i})"><i class="fa-solid fa-trash"></i></button>
    </div>`;
  }).join('');
}

// renderSubsList is now renderSubsWithReminder (merged above)


// ============================================================
// DASHBOARD TEAM TASKS
// ============================================================
function renderDashTeamTasks(){
  const container = document.getElementById('dash-team-tasks');
  if(!container) return;

  // Collect all members with active tasks
  const allMembers = [];
  (S.teams||[]).forEach(team=>{
    (team.members||[]).forEach(m=>allMembers.push(m.name));
  });
  if(!allMembers.length){
    container.innerHTML='<div class="empty" style="padding:8px 0"><div class="empty-icon" style="font-size:18px"><i class="fa-solid fa-users"></i></div><div style="font-size:12px">لا أعضاء في الفريق بعد</div></div>';
    return;
  }

  const memberData = allMembers.map(name=>{
    const tasks = S.tasks.filter(t=>t.workerMember===name && !t.done);
    return {name, tasks};
  }).filter(m=>m.tasks.length>0);

  if(!memberData.length){
    container.innerHTML='<div class="empty" style="padding:8px 0"><div class="empty-icon" style="font-size:18px"><i class="fa-solid fa-square-check" style="color:var(--accent3)"></i></div><div style="font-size:12px">لا مهام مسندة حالياً</div></div>';
    return;
  }

  const stMap={new:'<i class="fa-solid fa-clipboard-list"></i> جديد',progress:'<i class="fa-solid fa-bolt"></i> جاري',review:'<i class="fa-solid fa-magnifying-glass"></i> مراجعة',paused:'⏸ موقوف'};
  const stColor={new:'var(--text3)',progress:'var(--accent2)',review:'var(--accent)',paused:'#64b5f6'};

  container.innerHTML = memberData.map(m=>{
    const rows = m.tasks.map(t=>{
      const stepsTotal = t.steps?t.steps.length:0;
      const stepsDone  = t.steps?t.steps.filter(s=>s.done).length:0;
      const pct = stepsTotal ? Math.round(stepsDone/stepsTotal*100) : null;
      const st = t.status||'new';
      return `<div onclick="openTaskDetail(${t.id})" class="task-clickable" style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(42,42,58,.25);cursor:pointer">
        <div style="flex:1;min-width:0">
          <div style="font-size:12px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t.title}</div>
          <div style="display:flex;align-items:center;gap:6px;margin-top:3px">
            <span style="font-size:10px;font-weight:700;color:${stColor[st]};background:${stColor[st]}18;padding:1px 6px;border-radius:8px">${stMap[st]||st}</span>
            ${t.client?`<span style="font-size:10px;color:var(--text3)">${t.client}</span>`:''}
          </div>
        </div>
        ${pct!==null ? `<div style="display:flex;align-items:center;gap:5px;width:80px">
          <div style="flex:1;height:4px;background:var(--surface3);border-radius:2px;overflow:hidden">
            <div style="height:100%;width:${pct}%;background:${pct===100?'var(--accent3)':'var(--accent)'};border-radius:2px"></div>
          </div>
          <span style="font-size:10px;color:var(--text3);white-space:nowrap">${pct}%</span>
        </div>` : ''}
      </div>`;
    }).join('');
    return `<div style="margin-bottom:14px">
      <div style="font-size:12px;font-weight:800;color:var(--accent);margin-bottom:6px"><i class="fa-solid fa-user"></i> ${m.name} — ${m.tasks.length} مهمة</div>
      ${rows}
    </div>`;
  }).join('');
}


// ============================================================
// DASHBOARD — Subscriptions & Uncollected alerts
// ============================================================

// ============================================================
// TASKS LOG — Daily / Monthly / Annual
// ============================================================
let currentTasksTab = 'active';

function switchTasksTab(tab){
  currentTasksTab = tab;
  const tabs = ['active','log-day','log-month','log-year'];
  tabs.forEach(t=>{
    const btn = document.getElementById('ttab-'+t);
    if(btn){
      btn.style.color = t===tab ? 'var(--accent)' : 'var(--text3)';
      btn.style.background = t===tab ? 'rgba(124,111,247,.18)' : 'transparent';
      btn.style.borderBottom = '';
    }
  });
  document.getElementById('tasks-active-view').style.display = tab==='active' ? 'block' : 'none';
  document.getElementById('tasks-log-view').style.display    = tab!=='active' ? 'block' : 'none';
  document.getElementById('log-daily').style.display    = tab==='log-day'   ? 'block' : 'none';
  document.getElementById('log-monthly').style.display  = tab==='log-month' ? 'block' : 'none';
  document.getElementById('log-annual').style.display   = tab==='log-year'  ? 'block' : 'none';

  if(tab==='log-day'){
    const dp = document.getElementById('log-day-picker');
    if(dp && !dp.value) dp.value = new Date().toISOString().split('T')[0];
    renderDailyLog();
  } else if(tab==='log-month'){
    const now=new Date();
    const ms=document.getElementById('log-month-sel'); if(ms) ms.value=now.getMonth()+1;
    // Fill year dropdown
    const ys=document.getElementById('log-month-year');
    if(ys){
      const years=[...new Set(S.tasks.filter(t=>t.done&&t.doneAt).map(t=>t.doneAt.slice(0,4)))];
      const ty=now.getFullYear().toString();
      if(!years.includes(ty)) years.push(ty);
      years.sort((a,b)=>b-a);
      ys.innerHTML=years.map(y=>`<option value="${y}">${y}</option>`).join('');
    }
    renderMonthlyLog();
  } else if(tab==='log-year'){
    const ys2=document.getElementById('log-year-sel');
    if(ys2){
      const years=[...new Set(S.tasks.filter(t=>t.done&&t.doneAt).map(t=>t.doneAt.slice(0,4)))];
      const ty=new Date().getFullYear().toString();
      if(!years.includes(ty)) years.push(ty);
      years.sort((a,b)=>b-a);
      ys2.innerHTML=years.map(y=>`<option value="${y}">${y}</option>`).join('');
    }
    renderAnnualLog();
  }
}

function _taskLogCard(t){
  return `<div onclick="openTaskDetail(${t.id})" class="task-clickable" style="display:flex;align-items:center;gap:12px;padding:10px 12px;background:var(--surface2);border:1px solid var(--border);border-radius:8px;margin-bottom:7px;cursor:pointer">
    <div class="task-priority priority-${t.priority||'low'}"></div>
    <div style="flex:1;min-width:0">
      <div style="font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t.title}</div>
      <div style="font-size:11px;color:var(--text3);margin-top:2px">${t.client||'—'}${t.value?' · '+t.value.toLocaleString()+' ج':''}</div>
    </div>
    <span style="font-size:10px;background:rgba(79,209,165,.15);color:var(--accent3);padding:2px 8px;border-radius:10px;font-weight:700"><i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> مكتمل</span>
    <span style="font-size:10px;color:var(--text3)">${t.doneAt||''}</span>
  </div>`;
}

function renderDailyLog(){
  const el=document.getElementById('log-daily-content'); if(!el) return;
  const day=document.getElementById('log-day-picker')?.value;
  if(!day){ el.innerHTML='<div class="empty">اختر يوماً</div>'; return; }
  const tasks = S.tasks.filter(t=>t.done && t.doneAt && t.doneAt.startsWith(day));
  const inc = S.transactions.filter(t=>t.type==='income' && (t.isoDate||'').startsWith(day)).reduce((s,t)=>s+t.amount,0);
  const exp = S.transactions.filter(t=>t.type==='expense' && (t.isoDate||'').startsWith(day)).reduce((s,t)=>s+t.amount,0);
  el.innerHTML = `
    <div style="display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap">
      <div class="card" style="flex:1;min-width:120px;text-align:center"><div class="stat-label">مهام مكتملة</div><div class="stat-value" style="font-size:20px;color:var(--accent)">${tasks.length}</div></div>
      <div class="card" style="flex:1;min-width:120px;text-align:center"><div class="stat-label">دخل اليوم</div><div class="stat-value" style="font-size:20px;color:var(--accent3)">${inc.toLocaleString()} ج</div></div>
      <div class="card" style="flex:1;min-width:120px;text-align:center"><div class="stat-label">مصروف اليوم</div><div class="stat-value" style="font-size:20px;color:var(--accent4)">${exp.toLocaleString()} ج</div></div>
    </div>
    ${tasks.length ? tasks.map(_taskLogCard).join('') : '<div class="empty"><div class="empty-icon"><i class="fa-solid fa-clipboard-list"></i></div>لا مهام مكتملة في هذا اليوم</div>'}`;
}

function renderMonthlyLog(){
  const el=document.getElementById('log-monthly-content'); if(!el) return;
  const month=document.getElementById('log-month-sel')?.value;
  const year=document.getElementById('log-month-year')?.value;
  if(!month||!year){ el.innerHTML=''; return; }
  const prefix=`${year}-${String(month).padStart(2,'0')}`;
  const tasks=S.tasks.filter(t=>t.done && t.doneAt && t.doneAt.startsWith(prefix));
  const inc=S.transactions.filter(t=>t.type==='income'&&(t.isoDate||'').startsWith(prefix)).reduce((s,t)=>s+t.amount,0);
  const exp=S.transactions.filter(t=>t.type==='expense'&&(t.isoDate||'').startsWith(prefix)).reduce((s,t)=>s+t.amount,0);
  const mNames=['','يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
  el.innerHTML=`
    <div style="font-size:14px;font-weight:700;margin-bottom:12px;color:var(--accent)">${mNames[+month]} ${year}</div>
    <div style="display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap">
      <div class="card" style="flex:1;min-width:120px;text-align:center"><div class="stat-label">مهام مكتملة</div><div class="stat-value" style="font-size:20px;color:var(--accent)">${tasks.length}</div></div>
      <div class="card" style="flex:1;min-width:120px;text-align:center"><div class="stat-label">إجمالي الدخل</div><div class="stat-value" style="font-size:20px;color:var(--accent3)">${inc.toLocaleString()} ج</div></div>
      <div class="card" style="flex:1;min-width:120px;text-align:center"><div class="stat-label">إجمالي المصروف</div><div class="stat-value" style="font-size:20px;color:var(--accent4)">${exp.toLocaleString()} ج</div></div>
      <div class="card" style="flex:1;min-width:120px;text-align:center"><div class="stat-label">الصافي</div><div class="stat-value" style="font-size:20px;color:${(inc-exp)>=0?'var(--accent3)':'var(--accent4)'}">${(inc-exp).toLocaleString()} ج</div></div>
    </div>
    ${tasks.length ? tasks.map(_taskLogCard).join('') : '<div class="empty"><div class="empty-icon"><i class="fa-solid fa-clipboard-list"></i></div>لا مهام مكتملة في هذا الشهر</div>'}`;
}

function renderAnnualLog(){
  const el=document.getElementById('log-annual-content'); if(!el) return;
  const year=document.getElementById('log-year-sel')?.value;
  if(!year){ el.innerHTML=''; return; }
  const mNames=['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
  const rows = mNames.map((mName,i)=>{
    const prefix=`${year}-${String(i+1).padStart(2,'0')}`;
    const tasks=S.tasks.filter(t=>t.done&&t.doneAt&&t.doneAt.startsWith(prefix));
    const inc=S.transactions.filter(t=>t.type==='income'&&(t.isoDate||'').startsWith(prefix)).reduce((s,t)=>s+t.amount,0);
    const exp=S.transactions.filter(t=>t.type==='expense'&&(t.isoDate||'').startsWith(prefix)).reduce((s,t)=>s+t.amount,0);
    return `<div style="display:flex;align-items:center;gap:12px;padding:10px 12px;background:var(--surface2);border:1px solid var(--border);border-radius:8px;margin-bottom:7px">
      <div style="font-size:12px;font-weight:700;color:var(--text2);width:55px">${mName}</div>
      <div style="flex:1;height:6px;background:var(--surface3);border-radius:3px;overflow:hidden;position:relative">
        ${inc?`<div style="position:absolute;right:0;top:0;height:100%;width:${Math.min(100,Math.round(inc/Math.max(inc,exp)*100))}%;background:var(--accent3);border-radius:3px;opacity:.7"></div>`:''}
        ${exp?`<div style="position:absolute;right:0;top:0;height:100%;width:${Math.min(100,Math.round(exp/Math.max(inc,exp)*100))}%;background:var(--accent4);border-radius:3px;opacity:.4"></div>`:''}
      </div>
      <span style="font-size:11px;color:var(--accent3);width:65px;text-align:left">${inc?'+'+inc.toLocaleString():''}</span>
      <span style="font-size:11px;color:var(--accent4);width:65px;text-align:left">${exp?'-'+exp.toLocaleString():''}</span>
      <span style="font-size:11px;font-weight:700;width:60px;text-align:left;color:${(inc-exp)>=0?'var(--accent3)':'var(--accent4)'}">${(inc-exp)>=0?'+':''}${(inc-exp).toLocaleString()} ج</span>
      <span style="font-size:11px;color:var(--text3);white-space:nowrap">${tasks.length} مهمة</span>
    </div>`;
  });
  const totalInc=S.transactions.filter(t=>t.type==='income'&&(t.isoDate||'').startsWith(year)).reduce((s,t)=>s+t.amount,0);
  const totalExp=S.transactions.filter(t=>t.type==='expense'&&(t.isoDate||'').startsWith(year)).reduce((s,t)=>s+t.amount,0);
  const totalTasks=S.tasks.filter(t=>t.done&&t.doneAt&&t.doneAt.startsWith(year)).length;
  el.innerHTML=`
    <div style="font-size:14px;font-weight:700;margin-bottom:12px;color:var(--accent)">سنة ${year}</div>
    <div style="display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap">
      <div class="card" style="flex:1;min-width:120px;text-align:center"><div class="stat-label">مهام مكتملة</div><div class="stat-value" style="font-size:20px;color:var(--accent)">${totalTasks}</div></div>
      <div class="card" style="flex:1;min-width:120px;text-align:center"><div class="stat-label">إجمالي الدخل</div><div class="stat-value" style="font-size:20px;color:var(--accent3)">${totalInc.toLocaleString()} ج</div></div>
      <div class="card" style="flex:1;min-width:120px;text-align:center"><div class="stat-label">صافي الربح</div><div class="stat-value" style="font-size:20px;color:${(totalInc-totalExp)>=0?'var(--accent3)':'var(--accent4)'}">${(totalInc-totalExp).toLocaleString()} ج</div></div>
    </div>
    ${rows.join('')}`;
}

