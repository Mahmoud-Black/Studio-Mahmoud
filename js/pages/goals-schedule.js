// ============================================================
// GOALS
// ============================================================
function openGoalModal(id){
  document.getElementById('goal-modal-ttl').innerHTML=id?'<i class="fa-solid fa-diamond"></i> تعديل الهدف':'<i class="fa-solid fa-diamond"></i> هدف تعليمي جديد';
  document.getElementById('goal-eid').value=id||'';
  if(id){const g=S.goals.find(g=>g.id===id);if(g){document.getElementById('g-title').value=g.title;document.getElementById('g-cat').value=g.cat||'مهارة تقنية';document.getElementById('g-deadline').value=g.deadline||'';document.getElementById('g-progress').value=g.progress||0;document.getElementById('g-pct-display').textContent=(g.progress||0)+'%';}}
  else{document.getElementById('g-title').value='';document.getElementById('g-progress').value=0;document.getElementById('g-pct-display').textContent='0%';}
  openM('modal-goal');
}
function saveGoal(){
  const title=v('g-title').trim();if(!title)return alert('أدخل الهدف');
  const eid=v('goal-eid');
  const progress=+v('g-progress');
  const d={title,cat:v('g-cat'),deadline:v('g-deadline'),progress,done:progress===100};
  if(eid){const i=S.goals.findIndex(g=>g.id==eid);if(i>-1){d.id=+eid;d.done=S.goals[i].done||progress===100;S.goals[i]=d;}}
  else{d.id=Date.now();S.goals.push(d);}
  lsSave(); cloudSave(S); closeM('modal-goal');
  renderGoals();
  if(document.getElementById('page-freelancer-goals')?.classList.contains('active')) renderFgLearning();
  updateDash();
}
function delGoal(id){confirmDel('هل تريد حذف هذا الهدف؟',()=>{S.goals=S.goals.filter(g=>g.id!==id);lsSave();renderAll();});}
function toggleGoalDone(id){
  const g=S.goals.find(g=>g.id===id);if(!g)return;
  g.done=!g.done;
  if(g.done) g.progress=100;
  lsSave(); renderGoals();
}
function setGoalProgress(id,val){
  const g=S.goals.find(g=>g.id===id);if(!g)return;
  g.progress=+val;
  if(g.progress===100) g.done=true;
  else g.done=false;
  // live update label
  const lbl=document.getElementById('gpct-'+id);
  if(lbl)lbl.textContent=val+'%';
  const bar=document.getElementById('gbar-'+id);
  if(bar)bar.style.width=val+'%';
}
function saveGoalProgress(id){
  lsSave(); renderGoals();
}
const catIcon={'مهارة تقنية':'<i class="fa-solid fa-screwdriver-wrench"></i>','برنامج جديد':'<i class="fa-solid fa-laptop"></i>','مجال جديد':'<i class="fa-solid fa-rocket"></i>','كورس':'<i class="fa-solid fa-books"></i>','هدف مالي':'<i class="fa-solid fa-coins"></i>','هدف مهني':'<i class="fa-solid fa-bullseye"></i>'};
function renderGoals(){
  // ── إضافة الميزانيات كأهداف مالية ──
  _renderBudgetsAsGoals();
  // stats
  const total=S.goals.length;
  const done=S.goals.filter(g=>g.done||g.progress===100).length;
  const avg=total?Math.round(S.goals.reduce((s,g)=>s+(g.progress||0),0)/total):0;
  const setEl=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v;};
  setEl('goals-total',total); setEl('goals-done-count',done); setEl('goals-avg',avg+'%');

  const grid=document.getElementById('goals-grid');if(!grid)return;
  if(!total){
    grid.innerHTML='<div class="empty card"><div class="empty-icon"><i class="fa-solid fa-diamond"></i></div>أضف أهدافك التعليمية والمهنية<br><div style="margin-top:12px"><button class="btn btn-primary" onclick="openGoalModal()"><i class="fa-solid fa-bullseye" style="margin-left:5px"></i> هدف جديد</button></div></div>';
    return;
  }

  // separate active vs done
  const active=S.goals.filter(g=>!g.done&&(g.progress||0)<100);
  const completed=S.goals.filter(g=>g.done||(g.progress||0)===100);

  let html='';
  if(active.length){
    html+=`<div class="section-title" style="margin-bottom:12px">🔥 أهداف جارية</div>
    <div class="grid grid-2" style="margin-bottom:24px">
    ${active.map(g=>`
      <div class="card" style="border-color:rgba(124,111,247,.25)">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
          <div style="display:flex;align-items:center;gap:10px">
            <div style="font-size:24px">${catIcon[g.cat]||'<i class="fa-solid fa-diamond"></i>'}</div>
            <div>
              <div style="font-size:14px;font-weight:700">${g.title}</div>
              <div style="font-size:11px;color:var(--text3);margin-top:2px">${g.cat||''}${g.deadline?' · <i class="fa-solid fa-calendar"></i> '+g.deadline:''}</div>
            </div>
          </div>
          <div style="display:flex;gap:4px;flex-shrink:0">
            <button class="btn btn-success btn-sm" onclick="toggleGoalDone(${g.id})" title="تحديد كمكتمل"><i class="fa-solid fa-check"></i></button>
            <button class="btn btn-ghost btn-sm" onclick="openGoalModal(${g.id})" title="تعديل"><i class="fa-solid fa-pen"></i></button>
            <button class="btn btn-danger btn-sm" onclick="delGoal(${g.id})" title="حذف"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
          <div style="flex:1;position:relative">
            <div class="progress-bar" style="height:8px"><div id="gbar-${g.id}" class="progress-fill fill-purple" style="width:${g.progress||0}%"></div></div>
          </div>
          <div id="gpct-${g.id}" style="font-size:14px;font-weight:900;color:var(--accent);width:38px;text-align:center">${g.progress||0}%</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:11px;color:var(--text3)">0%</span>
          <input type="range" min="0" max="100" value="${g.progress||0}"
            style="flex:1;accent-color:var(--accent);cursor:pointer"
            oninput="setGoalProgress(${g.id},this.value)"
            onchange="saveGoalProgress(${g.id})">
          <span style="font-size:11px;color:var(--text3)">100%</span>
        </div>
      </div>`).join('')}
    </div>`;
  }
  if(completed.length){
    html+=`<div class="section-title" style="margin-bottom:12px;color:var(--accent3)"><i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> أهداف مكتملة</div>
    <div class="grid grid-2">
    ${completed.map(g=>`
      <div class="card" style="opacity:.7;border-color:rgba(79,209,165,.3)">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div style="display:flex;align-items:center;gap:10px">
            <div style="font-size:22px">${catIcon[g.cat]||'<i class="fa-solid fa-diamond"></i>'}</div>
            <div>
              <div style="font-size:14px;font-weight:700;text-decoration:line-through;color:var(--text2)">${g.title}</div>
              <div style="font-size:11px;color:var(--text3)">${g.cat||''}</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="color:var(--accent3);font-size:18px"><i class="fa-solid fa-square-check" style="color:var(--accent3)"></i></span>
            <button class="btn btn-ghost btn-sm" onclick="toggleGoalDone(${g.id})" title="إلغاء الإكمال" style="font-size:10px">↩</button>
            <button class="btn btn-danger btn-sm" onclick="delGoal(${g.id})"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>
        <div class="progress-bar" style="margin-top:10px;height:4px"><div class="progress-fill fill-green" style="width:100%"></div></div>
      </div>`).join('')}
    </div>`;
  }
  grid.innerHTML=html;
}

// ============================================================
// SCHEDULE
// ============================================================
// ══════════════════════════════════════════════════
// الميزانيات تظهر في صفحة الأهداف
// ══════════════════════════════════════════════════
function _renderBudgetsAsGoals(){
  var container = document.getElementById('goals-budgets-section');
  if(!container){
    var grid = document.getElementById('goals-grid');
    if(!grid) return;
    // أنشئ section للميزانيات بعد الـ grid
    container = document.createElement('div');
    container.id = 'goals-budgets-section';
    container.style.marginTop = '24px';
    grid.parentNode.insertBefore(container, grid.nextSibling);
  }
  var budgets = S.budgets || [];
  if(!budgets.length){ container.innerHTML=''; return; }
  var active = budgets.filter(function(b){ return (b.saved||0)<b.target; });
  var done = budgets.filter(function(b){ return (b.saved||0)>=b.target; });
  var cur = _getCurrency();
  var html = '<div class="section-title" style="margin-bottom:12px"><i class="fa-solid fa-piggy-bank" style="color:var(--accent2)"></i> أهداف الميزانية والادخار</div>';
  if(active.length){
    html += '<div class="grid grid-2" style="margin-bottom:16px">';
    html += active.map(function(b){
      var pct = b.target>0 ? Math.min(100,Math.round((b.saved||0)/b.target*100)) : 0;
      var rem = Math.max(0, b.target-(b.saved||0));
      var barColor = pct>=75?'var(--accent3)':pct>=40?'var(--accent2)':'var(--accent)';
      return '<div class="card" style="border-right:3px solid '+barColor+'">'
        +'<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">'
          +'<div><div style="font-size:14px;font-weight:800">'+escapeHtml(b.name)+'</div>'
          +'<div style="font-size:11px;color:var(--text3)">💰 هدف ادخار'+(b.deadline?' · ⏰ '+b.deadline:'')+'</div></div>'
          +'<button class="btn btn-ghost btn-sm" onclick="switchFinTab(&apos;budgets&apos;);showPage(&apos;finance&apos;)" title="اذهب للميزانية"><i class="fa-solid fa-arrow-left"></i></button>'
        +'</div>'
        +'<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:5px">'
          +'<span style="color:var(--text3)">المدّخر</span>'
          +'<span style="font-weight:800;color:'+barColor+'">'+(b.saved||0).toLocaleString()+' / '+b.target.toLocaleString()+' '+cur+'</span>'
        +'</div>'
        +'<div style="height:8px;background:var(--surface3);border-radius:4px;margin-bottom:8px;overflow:hidden">'
          +'<div style="height:100%;width:'+pct+'%;background:'+barColor+';border-radius:4px;transition:.4s"></div>'
        +'</div>'
        +'<div style="display:flex;justify-content:space-between;align-items:center">'
          +'<span style="font-size:12px;font-weight:900;color:'+barColor+'">'+pct+'%</span>'
          +'<button class="btn btn-ghost btn-sm" style="font-size:11px" onclick="addToBudget(&apos;'+b.id+'&apos;)"><i class="fa-solid fa-plus"></i> أضف مبلغ</button>'
        +'</div>'
        +'</div>';
    }).join('');
    html += '</div>';
  }
  if(done.length){
    html += '<div style="display:flex;flex-wrap:wrap;gap:8px">'
      +done.map(function(b){
        return '<div style="display:inline-flex;align-items:center;gap:8px;padding:6px 14px;background:rgba(79,209,165,.1);border:1px solid var(--accent3);border-radius:20px;font-size:12px;font-weight:700;color:var(--accent3)">'
          +'<i class="fa-solid fa-square-check"></i> '+escapeHtml(b.name)+' ('+b.target.toLocaleString()+' '+cur+')'
          +'</div>';
      }).join('')
    +'</div>';
  }
  container.innerHTML = html;
}


function openSchedModal(id){
  // ملأ قائمة المهام
  const sel=document.getElementById('s-linked-task');
  if(sel){
    sel.innerHTML='<option value="">— بدون ربط —</option>';
    S.tasks.filter(t=>!t.done).forEach(t=>{
      sel.innerHTML+=`<option value="${t.id}">${t.title}${t.client?' ('+t.client+')':''}</option>`;
    });
  }
  document.getElementById('sched-modal-ttl').innerHTML=id?'<i class="fa-solid fa-clock"></i> تعديل الوقت':'<i class="fa-solid fa-clock"></i> إضافة وقت في الجدول';
  document.getElementById('sched-eid').value=id||'';
  if(id){
    const s=S.schedule.find(s=>s.id===id);
    if(s){
      document.getElementById('s-time').value=s.time||'';
      document.getElementById('s-type').value=s.type||'work';
      document.getElementById('s-title').value=s.title||'';
      if(sel) sel.value=s.linkedTaskId||'';
    }
  } else {
    document.getElementById('s-time').value='';
    document.getElementById('s-title').value='';
    if(sel) sel.value='';
  }
  openM('modal-schedule');
}
function saveSched(){
  const title=v('s-title').trim();if(!title)return alert('أدخل العنوان');
  const eid=v('sched-eid');
  const linkedTaskId=document.getElementById('s-linked-task')?.value ? +document.getElementById('s-linked-task').value : null;
  const d={time:v('s-time'),type:v('s-type'),title,linkedTaskId,done:false};
  if(eid){const i=S.schedule.findIndex(s=>s.id==eid);if(i>-1){d.id=+eid;d.done=S.schedule[i].done||false;S.schedule[i]=d;}}
  else{d.id=Date.now();S.schedule.push(d);}
  S.schedule.sort((a,b)=>a.time>b.time?1:-1);
  lsSave();closeM('modal-schedule');renderAll();
}
function delSched(id){confirmDel('هل تريد حذف هذا الوقت؟',()=>{S.schedule=S.schedule.filter(s=>s.id!==id);lsSave();renderAll();});}
function toggleSchedDone(id){
  const s=S.schedule.find(x=>x.id===id);if(!s)return;
  s.done=!s.done;
  // إذا اكتمل الوقت وفيه مهمة مربوطة → اكمل المهمة
  if(s.done && s.linkedTaskId){
    const t=S.tasks.find(x=>x.id===s.linkedTaskId);
    if(t&&!t.done){
      t.done=true;t.status='done';
      showToast('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم اكتمال المهمة المرتبطة: '+t.title);
    }
  }
  lsSave();renderAll();
}
function renderSchedule(){
  const el=document.getElementById('sched-list');if(!el)return;
  el.innerHTML=S.schedule.length?S.schedule.map(s=>{
    const linkedTask=s.linkedTaskId?S.tasks.find(t=>t.id===s.linkedTaskId):null;
    const taskDone=linkedTask?.done||false;
    const isDone=s.done||taskDone;
    return `<div class="schedule-item" style="${isDone?'opacity:.6':''}">
      <div class="schedule-time" style="${isDone?'text-decoration:line-through':''}">${s.time||'—'}</div>
      <div class="schedule-dot" style="background:${isDone?'var(--accent3)':tcol[s.type]}"></div>
      <div style="flex:1">
        <div style="font-size:13.5px;font-weight:600;${isDone?'text-decoration:line-through;color:var(--text3)':''}">${s.title}</div>
        <div style="font-size:11px;color:var(--text2)">${tname[s.type]||''}</div>
        ${linkedTask?`<div class="sched-linked ${isDone?'done':''}"><i class="fa-solid fa-link"></i> ${linkedTask.title}${isDone?' <i class="fa-solid fa-check"></i>':''}</div>`:''}
      </div>
      <div style="display:flex;gap:4px;align-items:center">
        <button class="btn btn-sm" style="background:${isDone?'rgba(79,209,165,.15)':'rgba(124,111,247,.15)'};color:${isDone?'var(--accent3)':'var(--accent)'};border:none;border-radius:6px;padding:4px 8px;font-size:11px;cursor:pointer" onclick="toggleSchedDone(${s.id})" title="${isDone?'إلغاء الاكتمال':'تأشير كمكتمل'}">${isDone?'↩ رجوع':'<i class="fa-solid fa-check"></i> تم'}</button>
        <button class="btn btn-ghost btn-sm" onclick="openSchedModal(${s.id})"><i class="fa-solid fa-pen"></i></button>
        <button class="btn btn-danger btn-sm" onclick="delSched(${s.id})"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>`;
  }).join(''):'<div class="empty"><div class="empty-icon"><i class="fa-solid fa-clock"></i></div>أضف وقت لجدول اليوم</div>';
}

// ============================================================
// TASK TYPES
// ============================================================
function fillTaskTypesDD(){
  const sel=document.getElementById('t-tasktype');if(!sel)return;
  const types=S.settings?.taskTypes||[];
  sel.innerHTML='<option value="">— اختر النوع —</option>';
  types.forEach(tt=>sel.innerHTML+=`<option value="${tt}">${tt}</option>`);
}
function openTaskTypesSettings(){
  closeM('modal-task');
  renderTaskTypesList();
  openM('modal-task-types');
}
// Called by loadSettings
function _initStatusSettings(){
  renderTaskStatusesSettings();
  buildDynamicStatusDropdowns();
  renderPaymentAccountsSettings();
  fillPayMethodDropdowns();
}
function renderTaskTypesList(){
  const el=document.getElementById('task-types-list');if(!el)return;
  const types=S.settings?.taskTypes||[];
  el.innerHTML=types.map((t,i)=>`
    <div style="display:inline-flex;align-items:center;gap:6px;background:var(--surface3);border-radius:20px;padding:5px 10px 5px 12px;font-size:12px">
      ${t}
      <button onclick="removeTaskType(${i})" style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:12px;line-height:1;padding:0"><i class="fa-solid fa-xmark"></i></button>
    </div>`).join('')||'<div style="font-size:12px;color:var(--text3)">لا أنواع — أضف نوع أدناه</div>';
}
function addTaskTypeFromModal(){
  const inp=document.getElementById('new-task-type-input');
  const val=inp?.value.trim();
  if(!val)return;
  if(!S.settings.taskTypes) S.settings.taskTypes=[];
  if(!S.settings.taskTypes.includes(val)) S.settings.taskTypes.push(val);
  inp.value='';
  lsSave();renderTaskTypesList();fillTaskTypesDD();
}
function removeTaskType(i){
  S.settings.taskTypes.splice(i,1);
  lsSave();renderTaskTypesList();fillTaskTypesDD();
}

// ============================================================
// TASK STEPS
// ============================================================
let _editingSteps=[];
function renderTaskStepsForm(steps){
  _editingSteps=JSON.parse(JSON.stringify(steps||[]));
  _renderStepsFormUI();
}
function _renderStepsFormUI(){
  const el=document.getElementById('t-steps-list');if(!el)return;
  if(!_editingSteps.length){el.innerHTML='<div style="font-size:12px;color:var(--text3);text-align:center;padding:8px 0">لا خطوات — اضغط + خطوة لإضافة</div>';return;}
  el.innerHTML=_editingSteps.map((s,i)=>`
    <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border)">
      <div class="step-num ${s.done?'done':''}" onclick="toggleEditStep(${i})">${s.done?'<i class="fa-solid fa-check"></i>':i+1}</div>
      <input class="form-input" style="flex:1;height:32px;font-size:12px" value="${s.text||''}" placeholder="وصف الخطوة..." oninput="_editingSteps[${i}].text=this.value">
      <button onclick="removeEditStep(${i})" style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:14px"><i class="fa-solid fa-xmark"></i></button>
    </div>`).join('');
}
function addTaskStep(){
  _editingSteps.push({text:'',done:false});
  _renderStepsFormUI();
  // focus last input
  const inputs=document.querySelectorAll('#t-steps-list input');
  if(inputs.length) inputs[inputs.length-1].focus();
}
function toggleEditStep(i){_editingSteps[i].done=!_editingSteps[i].done;_renderStepsFormUI();}
function removeEditStep(i){_editingSteps.splice(i,1);_renderStepsFormUI();}
function collectTaskSteps(){return _editingSteps.filter(s=>s.text.trim());}
function mergeSteps(oldSteps,newSteps){
  // Preserve done status from old steps for matching text
  return newSteps.map(ns=>{
    const old=oldSteps.find(o=>o.text===ns.text);
    return old?{...ns,done:old.done}:ns;
  });
}
function toggleTaskStep(taskId,stepIdx){
  const t=S.tasks.find(x=>x.id===taskId);if(!t||!t.steps)return;
  t.steps[stepIdx].done=!t.steps[stepIdx].done;
  // لو كل الخطوات اتنفذت → إكمال المهمة تلقائياً
  if(t.steps.every(s=>s.done)&&!t.done){
    showToast('<i class="fa-solid fa-champagne-glasses"></i> تم إنجاز كل الخطوات! المهمة جاهزة للإكمال.');
  }
  lsSave();renderAll();
  // إعادة فتح الديتيل
  if(document.getElementById('modal-task-detail')?.classList.contains('open')){
    openTaskDetail(taskId);
  }
}
function renderStepsInDetail(task, isMemberTask, ownerId, authorName){
  if(!task.steps||!task.steps.length) return '';
  var total=task.steps.length, done=task.steps.filter(function(s){return s.done;}).length;
  var pct=Math.round(done/total*100);
  var currentStep=task.steps.find(function(s){return !s.done;});
  var tid = String(task.id);
  var html = '<div style="margin:14px 0;padding:14px;background:var(--surface2);border-radius:var(--r2);border:1px solid var(--border)">'
    +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">'
      +'<div style="font-size:13px;font-weight:700"><i class="fa-solid fa-clipboard-list"></i> خطوات التنفيذ</div>'
      +'<div style="font-size:12px;font-weight:700;color:var(--accent)">'+done+'/'+total+' — '+pct+'%</div>'
    +'</div>'
    +'<div class="steps-progress"><div class="steps-progress-fill" style="width:'+pct+'%"></div></div>'
    +(currentStep
      ? '<div style="font-size:11px;color:var(--accent3);margin:6px 0 10px"><i class="fa-solid fa-play"></i> الخطوة الحالية: '+currentStep.text+'</div>'
      : '<div style="font-size:11px;color:var(--accent3);margin:6px 0 10px"><i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> كل الخطوات مكتملة!</div>')
    +'<div class="steps-container">';

  task.steps.forEach(function(s,i){
    var stepComments = (task.comments||[]).filter(function(c){return String(c.stepIdx)===String(i);});
    var toggleFn = isMemberTask
      ? 'window._memberToggleStep(\''+tid+'\','+i+',!'+s.done+')'
      : 'toggleTaskStep('+task.id+','+i+')';
    var inputId = 'step-note-'+tid+'-'+i;
    var submitFn = isMemberTask
      ? 'window._submitMemberComment(\''+ownerId+'\',\''+tid+'\',document.getElementById(\''+inputId+'\'),'+i+',\''+escapeHtml(authorName||'')+'\')' 
      : 'window._submitLocalComment(\''+tid+'\',document.getElementById(\''+inputId+'\'),'+i+')';

    html += '<div style="border-bottom:1px solid var(--border);padding-bottom:8px;margin-bottom:8px">'
      +'<div class="step-row" style="cursor:pointer;margin-bottom:0" onclick="'+toggleFn+'">'
        +'<div class="step-num '+(s.done?'done':task.steps.slice(0,i).every(function(x){return x.done;})?'active-step':'')+'">'+(s.done?'<i class="fa-solid fa-check"></i>':String(i+1))+'</div>'
        +'<div class="step-text '+(s.done?'done':'')+'">'+escapeHtml(s.text||s.title||s.name||'خطوة')+'</div>'
        +'<div style="font-size:10px;color:var(--text3)">'+(s.done?'<i class="fa-solid fa-check"></i> مكتمل':'معلق')+'</div>'
      +'</div>'
      +'<div style="margin-top:6px;padding-right:32px">'
        +(stepComments.length ? stepComments.map(function(c){
          return '<div style="background:rgba(124,111,247,.08);border-radius:8px;padding:6px 10px;margin-bottom:4px;font-size:11px">'
            +'<span style="color:var(--accent);font-weight:700">'+escapeHtml(c.author||'')+'</span>'
            +'<span style="color:var(--text3);font-size:10px;margin-right:6px">'+new Date(c.at).toLocaleDateString('ar-EG')+'</span>'
            +'<div style="color:var(--text2);margin-top:2px">'+escapeHtml(c.text)+'</div>'
          +'</div>';
        }).join('') : '')
        +'<div style="display:flex;gap:5px;margin-top:4px">'
          +'<input type="text" id="'+inputId+'" style="flex:1;padding:5px 8px;background:var(--surface);border:1px solid var(--border);border-radius:7px;font-size:11px;color:var(--text);font-family:var(--font)" placeholder="ملاحظة على الخطوة...">'
          +'<button style="padding:5px 10px;background:var(--accent);color:#fff;border:none;border-radius:7px;cursor:pointer;font-size:11px" onclick="'+submitFn+'"><i class="fa-solid fa-paper-plane"></i></button>'
        +'</div>'
      +'</div>'
    +'</div>';
  });

  html += '</div></div>';
  return html;
}

// ============================================================
// CLIENT FOLLOW-UP REMINDERS
// ============================================================
function renderFollowupReminders(){
  const el=document.getElementById('dash-followup-reminders');if(!el)return;
  const now=new Date();
  const alerts=[];
  S.clients.forEach(c=>{
    if(c.followupEnabled!=='on')return;
    const months=c.followupMonths||3;
    // آخر طلب = آخر مهمة
    const cTasks=S.tasks.filter(t=>t.client===c.name&&t.orderDate).sort((a,b)=>b.orderDate.localeCompare(a.orderDate));
    const lastOrderDate=cTasks[0]?.orderDate||null;
    if(!lastOrderDate)return; // مفيش طلبات أصلاً — مش هنبعت تنبيه
    const last=new Date(lastOrderDate);
    const diffMonths=(now-last)/(1000*60*60*24*30.44);
    if(diffMonths>=months){
      alerts.push({client:c,lastOrderDate,diffMonths:Math.round(diffMonths)});
    }
  });
  if(!alerts.length){el.style.display='none';return;}
  el.style.display='block';
  el.innerHTML=`
    <div class="card" style="border-color:rgba(247,201,72,.3)">
      <div class="section-title" style="color:var(--accent2)"><i class="fa-solid fa-bell"></i> تذكيرات متابعة العملاء</div>
      ${alerts.map(({client:c,lastOrderDate,diffMonths})=>`
        <div class="followup-alert ${diffMonths>=(c.followupMonths||3)*2?'overdue':''}">
          <div class="followup-dot"></div>
          <div style="flex:1">
            <div style="font-size:13px;font-weight:700">${c.name}</div>
            <div style="font-size:11px;color:var(--text3)">آخر طلب: ${lastOrderDate} — منذ ${diffMonths} شهر تقريباً</div>
          </div>
          ${c.phone?`<button class="btn btn-sm" style="background:#25D366;color:#fff;border:none;border-radius:8px;padding:6px 12px;font-size:11px;cursor:pointer;font-weight:700" onclick="sendFollowupWA(${c.id})"><i class="fa-solid fa-mobile-screen"></i> واتساب</button>`:''}
        </div>`).join('')}
    </div>`;
}
function sendFollowupWA(clientId){
  const c=S.clients.find(x=>x.id===clientId);if(!c)return;
  const msg=c.followupMsg||`أهلاً ${c.name}، اتمنى تكون بخير <i class="fa-solid fa-hands"></i> عايز أطمن عليك وأعرف لو محتاج حاجة من ناحيتنا ✨`;
  const phone=c.phone?.replace(/\D/g,'');
  if(!phone){alert('مفيش رقم واتساب محفوظ للعميل ده');return;}
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`,'_blank');
}

// helper: show toast notification
function toast(msg,dur=3000){ showToast(msg,dur); }
function showToast(msg,dur=3000){
  let t=document.getElementById('_toast');
  if(!t){t=document.createElement('div');t.id='_toast';t.style.cssText='position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(60px);background:#1a1a2e;color:#fff;padding:10px 20px;border-radius:12px;font-size:13px;font-weight:600;z-index:9999;transition:.3s;border:1px solid rgba(124,111,247,.4);opacity:0';document.body.appendChild(t);}
  t.innerHTML=msg;
  t.style.transform='translateX(-50%) translateY(0)';t.style.opacity='1';
  clearTimeout(t._to);t._to=setTimeout(()=>{t.style.transform='translateX(-50%) translateY(60px)';t.style.opacity='0';},dur);
}

