// ══════════════════════════════════════════════════════════════════
// TASK COMMENTS SYSTEM — ملاحظات وتعليقات على المهام والخطوات
// ══════════════════════════════════════════════════════════════════

// Add a comment to a local task (owner's own tasks)

// Submit project comment
window._submitProjComment = function(projId) {
  var ta = document.getElementById('proj-comment-'+projId);
  var text = ta ? ta.value.trim() : '';
  if(!text) return;
  var p = (S.projects||[]).find(function(x){ return String(x.id)===String(projId); });
  if(!p) return;
  if(!p.comments) p.comments = [];
  p.comments.push({
    id: Date.now(),
    text: text,
    author: (S.settings&&S.settings.name)||'أنا',
    at: new Date().toISOString()
  });
  lsSave(); cloudSave(S);
  // Re-render project detail to show new comment
  if(typeof renderProjectDetail==='function') renderProjectDetail();
  if(typeof showMiniNotif==='function') showMiniNotif('✅ تمت إضافة الملاحظة');
};

function addTaskComment(taskId, text, stepIdx) {
  if(!text || !text.trim()) return;
  var t = (S.tasks||[]).find(function(x){ return String(x.id)===String(taskId); });
  if(!t) return;
  if(!t.comments) t.comments = [];
  var comment = {
    id      : Date.now(),
    text    : text.trim(),
    author  : (S.settings&&S.settings.name)||'أنا',
    stepIdx : (stepIdx !== undefined && stepIdx !== null) ? stepIdx : null,
    at      : new Date().toISOString()
  };
  t.comments.push(comment);
  lsSave(); cloudSave(S);
  return comment;
}

// Add a comment to a project
function addProjectComment(projId, text) {
  if(!text || !text.trim()) return;
  var p = (S.projects||[]).find(function(x){ return String(x.id)===String(projId); });
  if(!p) return;
  if(!p.comments) p.comments = [];
  var comment = {
    id     : Date.now(),
    text   : text.trim(),
    author : (S.settings&&S.settings.name)||'أنا',
    at     : new Date().toISOString()
  };
  p.comments.push(comment);
  lsSave(); cloudSave(S);
  return comment;
}

// Add comment to a member task (writes to owner's studio_data)
async function addMemberTaskComment(ownerId, taskId, text, stepIdx, authorName) {
  if(!text || !text.trim()) return;
  try {
    var { data: ownerRow } = await supa.from('studio_data').select('data').eq('user_id', ownerId).maybeSingle();
    if(!ownerRow) return;
    var od = typeof ownerRow.data==='string' ? JSON.parse(ownerRow.data) : ownerRow.data;
    if(od.data && !od.tasks) od = typeof od.data==='string' ? JSON.parse(od.data) : od.data;
    var ot = (od.tasks||[]).find(function(t){ return String(t.id)===String(taskId); });
    if(!ot) return;
    if(!ot.comments) ot.comments = [];
    var comment = {
      id     : Date.now(),
      text   : text.trim(),
      author : authorName || (S.settings&&S.settings.name) || 'عضو',
      stepIdx: (stepIdx !== undefined && stepIdx !== null) ? stepIdx : null,
      at     : new Date().toISOString()
    };
    ot.comments.push(comment);
    await supa.from('studio_data').update({data:JSON.stringify(od),updated_at:new Date().toISOString()}).eq('user_id',ownerId);
    // Also update local membership cache
    var mem = (window._myTeamMemberships||[]).find(function(m){ return m.ownerId===ownerId; });
    if(mem) {
      var localTask = (mem.tasks||[]).concat(mem.doneTasks||[]).find(function(t){ return String(t.id)===String(taskId); });
      if(localTask) { if(!localTask.comments) localTask.comments=[]; localTask.comments.push(comment); }
    }
    return comment;
  } catch(e) { console.warn('addMemberTaskComment:', e); }
}

// Render comments HTML (shared between task detail and member modal)
function _renderCommentsHTML(comments, taskId, stepIdx, isMemberTask, ownerId, authorName) {
  var filtered = (comments||[]).filter(function(c){
    if(stepIdx !== undefined && stepIdx !== null) return String(c.stepIdx) === String(stepIdx);
    return c.stepIdx === null || c.stepIdx === undefined;
  });
  var inputPlaceholder = stepIdx !== null && stepIdx !== undefined ? 'ملاحظة على هذه الخطوة...' : 'أضف ملاحظة أو تعليق...';
  var addFn = isMemberTask
    ? 'window._submitMemberComment(\''+ownerId+'\',\''+taskId+'\',this.previousElementSibling,'+JSON.stringify(stepIdx !== null && stepIdx !== undefined ? stepIdx : null)+',\''+authorName+'\')'
    : '_submitLocalComment(\''+taskId+'\',this.previousElementSibling,'+JSON.stringify(stepIdx !== null && stepIdx !== undefined ? stepIdx : null)+')';

  return '<div class="_comments-block" style="margin-top:10px">'
    +(filtered.length ? '<div style="display:flex;flex-direction:column;gap:6px;margin-bottom:8px">'
      +filtered.map(function(c){
        var d = new Date(c.at);
        var timeStr = d.getHours().toString().padStart(2,'0')+':'+d.getMinutes().toString().padStart(2,'0')+' '+d.getDate()+'/'+(d.getMonth()+1);
        return '<div style="background:rgba(124,111,247,.08);border:1px solid rgba(124,111,247,.15);border-radius:10px;padding:8px 12px">'
          +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">'
            +'<span style="font-size:11px;font-weight:700;color:var(--accent)">'+escapeHtml(c.author||'')+'</span>'
            +'<span style="font-size:10px;color:var(--text3)">'+timeStr+'</span>'
          +'</div>'
          +'<div style="font-size:12px;color:var(--text2);line-height:1.6">'+escapeHtml(c.text)+'</div>'
        +'</div>';
      }).join('')
    +'</div>' : '')
    +'<div style="display:flex;gap:6px">'
      +'<textarea style="flex:1;padding:8px 10px;background:var(--surface2);border:1px solid var(--border);border-radius:8px;font-size:12px;color:var(--text);resize:none;font-family:var(--font);min-height:36px;max-height:80px" rows="1" placeholder="'+inputPlaceholder+'"></textarea>'
      +'<button style="padding:6px 12px;background:var(--accent);color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:12px;flex-shrink:0;align-self:flex-end" onclick="'+addFn+'"><i class=\"fa-solid fa-paper-plane\"></i></button>'
    +'</div>'
  +'</div>';
}

// Submit comment on local task (owner's own task)
window._submitLocalComment = function(taskId, textarea, stepIdx) {
  var text = textarea ? textarea.value.trim() : '';
  if(!text) return;
  addTaskComment(taskId, text, stepIdx);
  textarea.value = '';
  textarea.style.height = 'auto';
  // Re-open task detail to refresh
  var t = (S.tasks||[]).find(function(x){ return String(x.id)===String(taskId); });
  if(t) openTaskDetail(t.id);
  if(typeof showMiniNotif==='function') showMiniNotif('✅ تمت إضافة الملاحظة');
};

// Submit comment on member task
window._submitMemberComment = async function(ownerId, taskId, textarea, stepIdx, authorName) {
  var text = textarea ? textarea.value.trim() : '';
  if(!text) return;
  textarea.disabled = true;
  await addMemberTaskComment(ownerId, taskId, text, stepIdx, authorName);
  textarea.value = '';
  textarea.disabled = false;
  textarea.style.height = 'auto';
  if(typeof showMiniNotif==='function') showMiniNotif('✅ تمت إضافة الملاحظة');
  // Refresh the modal
  if(typeof openMyMemberTeamProfile==='function') openMyMemberTeamProfile(ownerId);
};

function changeTaskStatus(id, newStatus){
  const t = S.tasks.find(t=>t.id===id); if(!t) return;
  const prevDone = t.done || t.status==='done';
  t.status = newStatus;
  if(newStatus==='done'){ 
    t.done=true; t.doneAt=t.doneAt||new Date().toISOString().split('T')[0];
    // اطلب رابط التسليم
    if(!prevDone){
      _askRegularTaskProjectLink(id);
    }
  } else {
    t.done=false;
    if(newStatus==='revision' && prevDone) _notifyClientRevision(t);
  }
  lsSave(); renderAll();
  showMiniNotif('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم تغيير حالة المهمة إلى: '+{new:'جديد',progress:'قيد التنفيذ',review:'مراجعة',paused:'موقوف مؤقتاً',done:'مكتمل',revision:'تعديلات'}[newStatus]);
}

// ── اطلب رابط التسليم للمهام العادية ──
function _askRegularTaskProjectLink(taskId){
  var t = S.tasks.find(function(x){ return x.id===taskId; });
  if(!t) return;
  var ov=document.createElement('div');
  ov.className='modal-overlay';
  ov.style.cssText='display:flex;align-items:center;justify-content:center;z-index:10000';
  ov.innerHTML='<div class="modal" style="width:min(420px,92vw);border-radius:18px;padding:28px">'
    +'<div style="font-size:36px;text-align:center;margin-bottom:10px">🔗</div>'
    +'<div style="font-size:16px;font-weight:900;text-align:center;margin-bottom:6px">رابط تسليم المشروع</div>'
    +'<div style="font-size:13px;color:var(--text3);text-align:center;margin-bottom:18px">المهمة: <strong>'+escapeHtml(t.title)+'</strong></div>'
    +'<input id="_rtask-link-input" class="form-input" placeholder="https://drive.google.com/... أو أي رابط للتسليم" value="'+escapeHtml(t.projectLink||t.driveLink||'')+'"/>'
    +'<div style="font-size:11px;color:var(--text3);margin-top:8px;text-align:center">سيظهر هذا الرابط للعميل في بوابته لاستلام المشروع</div>'
    +'<div style="display:flex;gap:10px;margin-top:18px">'
      +'<button data-tid="'+taskId+'" onclick="_saveRegularTaskLink(this.dataset.tid);this.closest(\'.modal-overlay\').remove()" class="btn btn-primary" style="flex:1"><i class="fa-solid fa-floppy-disk"></i> حفظ الرابط</button>'
      +'<button onclick="this.closest(\'.modal-overlay\').remove()" class="btn btn-ghost">تخطي</button>'
    +'</div>'
  +'</div>';
  document.body.appendChild(ov);
  ov.addEventListener('click',function(e){if(e.target===ov)ov.remove();});
  setTimeout(function(){var inp=document.getElementById('_rtask-link-input');if(inp)inp.focus();},100);
}

function _saveRegularTaskLink(taskId){
  var t = S.tasks.find(function(x){ return x.id===taskId; });
  if(!t) return;
  var inp=document.getElementById('_rtask-link-input');
  if(inp){ t.projectLink = inp.value.trim(); t.driveLink = t.projectLink; }
  lsSave(); cloudSave(S); renderAll();
  toast('<i class="fa-solid fa-link" style="color:var(--accent3)"></i> تم حفظ رابط المشروع');
}

// ═══════════════════════════════════════════════════════
// MEMBER TASKS SECTION — مهام العضو من الفرق في صفحة المهام
// ═══════════════════════════════════════════════════════
function _renderMemberTasksSection(){
  var section = document.getElementById('member-tasks-section');
  var listEl  = document.getElementById('member-tasks-list');
  if(!section || !listEl) return;

  var memberships = window._myTeamMemberships || [];
  // Collect all active tasks from all memberships
  var allTasks = [];
  memberships.forEach(function(mem){
    (mem.tasks||[]).forEach(function(t){
      allTasks.push({ task:t, mem:mem });
    });
  });

  if(!allTasks.length){
    section.style.display = 'none';
    return;
  }

  section.style.display = '';

  var stColors = {new:'var(--text3)',progress:'var(--accent2)',review:'var(--accent)',paused:'#64b5f6',done:'var(--accent3)'};
  var stLabels = {new:'🆕 جديد',progress:'⚡ جاري',review:'🔍 مراجعة',paused:'⏸ موقوف',done:'✅ مكتمل'};

  listEl.innerHTML = allTasks.map(function(entry){
    var t   = entry.task;
    var mem = entry.mem;
    var isLate = t.deadline && new Date(t.deadline) < new Date();
    var daysLeft = t.deadline ? Math.ceil((new Date(t.deadline)-new Date())/864e5) : null;
    var stepsTotal = (t.steps||[]).length;
    var stepsDone  = (t.steps||[]).filter(function(s){ return s.done; }).length;
    var pct = stepsTotal ? Math.round(stepsDone/stepsTotal*100) : 0;
    var curSt = t.status||'new';

    return '<div style="background:var(--surface);border:1px solid var(--border);border-right:3px solid '+(isLate?'var(--accent4)':'var(--accent)')+';border-radius:12px;padding:14px;cursor:pointer;transition:transform .15s,box-shadow .15s" '
      +'onmouseenter="this.style.transform=&apos;translateY(-2px)&apos;;this.style.boxShadow=&apos;0 4px 16px rgba(0,0,0,.12)&apos;" '
      +'onmouseleave="this.style.transform=&apos;&apos;;this.style.boxShadow=&apos;&apos;" '
      +'data-oid="'+mem.ownerId+'" onclick="openMyMemberTeamProfile(this.dataset.oid)">'  
      +'<div style="font-size:10px;color:var(--accent3);font-weight:700;margin-bottom:6px"><i class="fa-solid fa-users"></i> '+escapeHtml(mem.ownerName)+' — '+escapeHtml(mem.teamName)+'</div>'
      +(t.isProjectTask?'<div style="font-size:10px;color:var(--accent);font-weight:700;margin-bottom:5px;display:inline-flex;align-items:center;gap:4px;background:rgba(124,111,247,.1);padding:2px 8px;border-radius:6px"><i class="fa-solid fa-folder-open"></i> '+escapeHtml(t.projectName||'مشروع')+'</div><br>':'')
      +'<div style="font-size:14px;font-weight:700;margin-bottom:6px">'+escapeHtml(t.title)+'</div>'
      +'<div style="display:flex;gap:8px;flex-wrap:wrap;font-size:11px;margin-bottom:8px">'
        +'<span style="color:'+stColors[curSt]+'">'+stLabels[curSt]+'</span>'
        +(t.deadline?'<span style="color:'+(isLate?'var(--accent4)':(daysLeft<=2?'var(--accent2)':'var(--text3)'))+'">'+(isLate?'⚠️ متأخرة':daysLeft+' يوم')+'</span>':'')
        +(t.workerAmount?'<span style="color:var(--accent2);font-weight:700">💰 '+Number(t.workerAmount).toLocaleString()+' ج</span>':'')
      +'</div>'
      +(stepsTotal?'<div style="height:4px;background:var(--surface2);border-radius:3px;overflow:hidden"><div style="height:100%;width:'+pct+'%;background:linear-gradient(90deg,var(--accent),var(--accent3));transition:.3s"></div></div><div style="font-size:10px;color:var(--text3);margin-top:3px">'+stepsDone+'/'+stepsTotal+' خطوات</div>':'')
      +'<div style="font-size:10px;color:var(--accent);margin-top:8px"><i class="fa-solid fa-arrow-left"></i> اضغط لعرض التفاصيل وتحديث الحالة</div>'
    +'</div>';
  }).join('');
}

async function _refreshMemberTasks(){
  var myEmail = '';
  try { var _as=JSON.parse(localStorage.getItem('studioOS_auth_v1')||'{}'); myEmail=(_as.email||'').toLowerCase().trim(); }catch(e){}
  if(!myEmail && S.settings && S.settings.email) myEmail = (S.settings.email||'').toLowerCase().trim();
  if(myEmail && typeof window._checkTeamMembership==='function'){
    await window._checkTeamMembership(myEmail);
    _renderMemberTasksSection();
    if(typeof showMiniNotif==='function') showMiniNotif('✅ تم تحديث مهام الفرق');
  }
}

function renderTasks(){
  populateTaskFilterDropdowns();
  const filtered = filterTasks(S.tasks);
  const fCount = document.getElementById('tf-count');
  if(fCount) fCount.textContent = filtered.length < S.tasks.length ? `${filtered.length} من ${S.tasks.length}` : '';

  const jtBadge = jt => {
    if(!jt||jt==='freelance') return '<span class="jtype-badge jtype-freelance"><i class="fa-solid fa-bullseye"></i> فري لانس</span>';
    if(jt==='fulltime')  return '<span class="jtype-badge jtype-fulltime"><i class="fa-solid fa-building"></i> دوام</span>';
    if(jt==='parttime')  return '<span class="jtype-badge jtype-parttime"><i class="fa-solid fa-alarm-clock"></i> بارت تايم</span>';
    return '';
  };

  // Filter: only show done tasks completed within last 24h in kanban
  const now24 = Date.now();
  const isRecentDone = t => {
    if(!t.done) return false;
    if(!t.doneAt) return true; // old data, show it
    const doneMs = new Date(t.doneAt+'T23:59:59').getTime();
    return (now24 - doneMs) < 24*60*60*1000;
  };

  const prioToStatus = {high:'progress', med:'new', low:'new'};
  ['high','med','low'].forEach(p=>{
    const el=document.getElementById('col-'+p);if(!el)return;
    // make drop target for status columns
    el.dataset.priority = p;
    const items=filtered.filter(t=>t.priority===p&&!t.done);
    el.innerHTML=items.length?items.map(t=>{
      const st=t.status||'new';
      const _ov=S.statusOverrides||{};
      const stMap={
        new: '<i class="fa-solid fa-clipboard-list"></i> '+(_ov.new?.label||'جديد'),
        progress:'<i class="fa-solid fa-bolt"></i> '+(_ov.progress?.label||'جاري'),
        review:'<i class="fa-solid fa-magnifying-glass"></i> '+(_ov.review?.label||'مراجعة'),
        paused:'⏸ '+(_ov.paused?.label||'موقوف'),
        done:'<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> مكتمل'
      };
      (S.customStatuses||[]).forEach(cs=>{ stMap[cs.id]=(cs.icon||'')+(cs.icon?' ':'')+cs.label; });
      const stColor={new:'var(--text3)',progress:'var(--accent2)',review:'var(--accent)',paused:'#64b5f6',done:'var(--accent3)'};
      (S.customStatuses||[]).forEach(cs=>{ stColor[cs.id]=cs.color||'var(--accent)'; });
      const stepsTotal=t.steps?t.steps.length:0;
      const stepsDone=t.steps?t.steps.filter(s=>s.done).length:0;
      const pct=stepsTotal?Math.round(stepsDone/stepsTotal*100):0;
      return `
      <div class="kb-card task-clickable" draggable="true" data-task-id="${t.id}" ondragstart="kbDragStart(event,${t.id})" onclick="openTaskDetail(${t.id})" style="flex-direction:column;align-items:stretch;gap:0;padding:10px 12px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
          <div class="task-priority priority-${t.priority}"></div>
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t.title}</div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:2px;align-items:center">
              ${t.client?`<span style="font-size:11px;color:var(--text3)">${t.client}</span>`:''}
              ${t.value?`<span style="font-size:10px;color:var(--accent3);font-weight:700">${t.value.toLocaleString()} ج</span>`:''}
            </div>
          </div>
          <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();kbShowMoveMenu(event,${t.id})" style="flex-shrink:0;padding:3px 7px;color:var(--accent)" title="نقل">▾</button>
          <button class="btn btn-success btn-sm" onclick="event.stopPropagation();completeTask(${t.id})" title="مكتمل" style="flex-shrink:0;padding:3px 7px"><i class="fa-solid fa-check"></i></button>
          <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();openTaskModal(${t.id})" style="flex-shrink:0;padding:3px 7px"><i class="fa-solid fa-pen"></i></button>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
          <span style="font-size:10px;font-weight:700;color:${stColor[st]};background:${stColor[st]}18;padding:2px 7px;border-radius:10px;white-space:nowrap">${stMap[st]||st}</span>
          ${stepsTotal?`<div style="flex:1;display:flex;align-items:center;gap:6px">
            <div style="flex:1;height:4px;background:var(--surface3);border-radius:3px;overflow:hidden">
              <div style="height:100%;width:${pct}%;background:${pct===100?'var(--accent3)':'var(--accent)'};border-radius:3px;transition:width .3s"></div>
            </div>
            <span style="font-size:10px;color:var(--text3);white-space:nowrap">${stepsDone}/${stepsTotal}</span>
          </div>`:''}
        </div>
      </div>`}).join(''):'<div class="empty" style="padding:16px 0;font-size:12px">لا مهام</div>';
  });

  // Status Kanban columns
  ['new','progress','review','paused'].forEach(st=>{
    const el = document.getElementById('col-status-'+st); if(!el) return;
    const stItems = filtered.filter(t=>!t.done && (t.status||'new')===st);
    const cnt = document.getElementById('cnt-'+st);
    if(cnt){ cnt.textContent=stItems.length; cnt.style.display=stItems.length?'inline-block':'none'; }
    if(!stItems.length){ el.innerHTML='<div style="font-size:11px;color:var(--text3);padding:8px;text-align:center">لا مهام</div>'; return; }
    const stMap={new:'<i class="fa-solid fa-clipboard-list"></i> جديد',progress:'<i class="fa-solid fa-bolt"></i> جاري',review:'<i class="fa-solid fa-magnifying-glass"></i> مراجعة',paused:'⏸ موقوف'};
    const stColor={new:'var(--text3)',progress:'var(--accent2)',review:'var(--accent)',paused:'#64b5f6'};
    el.innerHTML = stItems.map(t=>{
      const stepsTotal=t.steps?t.steps.length:0;
      const stepsDone=t.steps?t.steps.filter(s=>s.done).length:0;
      const pct=stepsTotal?Math.round(stepsDone/stepsTotal*100):0;
      const prioColors={'high':'rgba(247,111,124,.2)','med':'rgba(247,201,72,.2)','low':'rgba(79,209,165,.2)'};
      const prioText={'high':'var(--accent4)','med':'var(--accent2)','low':'var(--accent3)'};
      const prioLabel={'high':'<i class="fa-solid fa-circle"></i> عاجل','med':'<i class="fa-solid fa-circle"></i> متوسط','low':'<i class="fa-solid fa-circle"></i> عادي'};
      return `<div class="kb-card" draggable="true" data-task-id="${t.id}"
          ondragstart="kbDragStart(event,${t.id})"
          onclick="openTaskDetail(${t.id})">
        <div style="font-size:12px;font-weight:700;margin-bottom:5px;line-height:1.4">${t.title}</div>
        <div style="display:flex;gap:5px;flex-wrap:wrap;align-items:center;margin-bottom:${stepsTotal?'6px':'0'}">
          ${t.client?`<span style="font-size:10px;color:var(--text3);background:rgba(255,255,255,.05);padding:1px 6px;border-radius:8px">${t.client}</span>`:''}
          ${t.priority?`<span style="font-size:10px;background:${prioColors[t.priority]||'rgba(0,0,0,.2)'};color:${prioText[t.priority]||'var(--text3)'};padding:1px 6px;border-radius:8px">${prioLabel[t.priority]||''}</span>`:''}
          ${t.value?`<span style="font-size:10px;color:var(--accent3);font-weight:700;margin-right:auto">${t.value.toLocaleString()} ج</span>`:''}
        </div>
        ${stepsTotal?`<div style="display:flex;align-items:center;gap:5px;margin-top:2px">
          <div style="flex:1;height:3px;background:var(--surface3);border-radius:2px;overflow:hidden">
            <div style="height:100%;width:${pct}%;background:${pct===100?'var(--accent3)':'var(--accent)'};border-radius:2px;transition:width .3s"></div>
          </div>
          <span style="font-size:10px;color:var(--text3)">${stepsDone}/${stepsTotal}</span>
        </div>`:''}
        <div style="font-size:10px;color:var(--text3);margin-top:5px;display:flex;justify-content:space-between;align-items:center">
          <button onclick="event.stopPropagation();openCardStatusRename('${st}',this)" style="background:rgba(255,255,255,.06);border:none;border-radius:6px;color:var(--text3);font-size:11px;padding:2px 7px;cursor:pointer" title="تعديل اسم الحالة"><i class="fa-solid fa-gear"></i></button>
          <button onclick="event.stopPropagation();kbShowMoveMenu(event,${t.id})" style="background:rgba(124,111,247,.15);border:none;border-radius:6px;color:var(--accent);font-size:10px;padding:2px 7px;cursor:pointer;font-weight:700">نقل ▾</button>
        </div>
      </div>`;
    }).join('');
  });

  // Global stacked progress bar
  const stackedBar = document.getElementById('tasks-global-progress-stacked');
  const globalPct  = document.getElementById('tasks-progress-pct');
  const legend     = document.getElementById('tasks-progress-legend');
  if(stackedBar && filtered.length){
    const total = filtered.length;
    const segments = [
      {key:'done',     label:'مكتمل',        color:'#4fd1a5', count: filtered.filter(t=>t.done||t.status==='done').length},
      {key:'progress', label:'قيد التنفيذ',   color:'#f7c948', count: filtered.filter(t=>!t.done&&t.status==='progress').length},
      {key:'review',   label:'مراجعة',        color:'#7c6ff7', count: filtered.filter(t=>!t.done&&t.status==='review').length},
      {key:'paused',   label:'موقوف',         color:'#64b5f6', count: filtered.filter(t=>!t.done&&t.status==='paused').length},
      {key:'new',      label:'جديد',          color:'#5a5a80', count: filtered.filter(t=>!t.done&&(!t.status||t.status==='new')).length},
    ];
    // Add custom statuses
    (S.customStatuses||[]).forEach(cs=>{
      const c=filtered.filter(t=>!t.done&&t.status===cs.id).length;
      if(c>0) segments.push({key:cs.id,label:cs.label||cs.id,color:cs.color||'#888',count:c});
    });
    stackedBar.innerHTML = segments.filter(s=>s.count>0).map(s=>{
      const w = Math.round(s.count/total*100);
      return `<div style="flex:${s.count};background:${s.color};height:100%;min-width:${w<2?'3px':'0'};transition:flex .5s;border-radius:3px" title="${s.label}: ${s.count}"></div>`;
    }).join('');
    const donePct = Math.round(segments.find(s=>s.key==='done').count/total*100);
    if(globalPct) globalPct.textContent = total ? donePct+'%' : '0%';
    if(legend) legend.innerHTML = segments.filter(s=>s.count>0).map(s=>
      `<span style="display:inline-flex;align-items:center;gap:4px;font-size:10px;color:var(--text3)">
        <span style="width:8px;height:8px;border-radius:50%;background:${s.color};display:inline-block"></span>
        ${s.label} <span style="font-weight:700;color:var(--text2)">${s.count}</span>
      </span>`
    ).join('');
  } else if(stackedBar){
    stackedBar.innerHTML = `<div style="flex:1;background:var(--surface3);height:100%;border-radius:6px"></div>`;
    if(globalPct) globalPct.textContent = '0%';
    if(legend) legend.innerHTML = '';
  }

  // Paused column
  const pausedEl = document.getElementById('col-paused');
  if(pausedEl){
    const paused = filtered.filter(t=>!t.done && t.status==='paused');
    pausedEl.innerHTML = paused.length ? paused.map(t=>`
      <div class="task-item task-clickable" onclick="openTaskDetail(${t.id})" style="opacity:.8;border-color:#64b5f6" title="اضغط لعرض التفاصيل">
        <div style="width:8px;height:8px;border-radius:50%;background:#64b5f6;flex-shrink:0"></div>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t.title}</div>
          <div style="font-size:11px;color:var(--text3)">${t.client||''}${jtBadge(t.jobType)}</div>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();changeTaskStatus(${t.id},'progress')" title="استئناف"><i class="fa-solid fa-play"></i></button>
        <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();openTaskModal(${t.id})" style="flex-shrink:0"><i class="fa-solid fa-pen"></i></button>
      </div>`).join('') : '<div class="empty" style="padding:16px 0;font-size:12px;color:#64b5f6">لا مهام موقوفة</div>';
    const wrap = document.getElementById('col-paused-wrap');
    if(wrap) wrap.style.display = paused.length ? 'block' : 'none';
  }

  const doneEl = document.getElementById('col-done');
  if(doneEl){
    const done = filtered.filter(t=>isRecentDone(t));
    doneEl.innerHTML = done.length ? done.map(t=>`
      <div class="task-item task-clickable" onclick="openTaskDetail(${t.id})" style="opacity:.6;border-color:var(--accent3)" title="اضغط لعرض التفاصيل">
        <div style="width:8px;height:8px;border-radius:50%;background:var(--accent3);flex-shrink:0"></div>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:600;text-decoration:line-through;color:var(--text2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t.title}</div>
          <div style="display:flex;gap:5px;margin-top:2px">${t.client?`<span style="font-size:11px;color:var(--text3)">${t.client}</span>`:''}${jtBadge(t.jobType)}</div>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();completeTask(${t.id})" title="إلغاء الإكمال" style="flex-shrink:0;font-size:10px">↩</button>
        <button class="btn btn-danger btn-sm" onclick="event.stopPropagation();delTask(${t.id})" style="flex-shrink:0"><i class="fa-solid fa-trash"></i></button>
      </div>`).join('') : '<div class="empty" style="padding:16px 0;font-size:12px;color:var(--accent3)">لا مشاريع مكتملة</div>';
  }

  const tbody=document.getElementById('tasks-tbody');if(!tbody)return;
  tbody.innerHTML=filtered.map(t=>`<tr style="${t.done?'opacity:.55':''}" onclick="openTaskDetail(${t.id})" class="task-clickable" title="اضغط لعرض التفاصيل">
    <td>
      <div style="display:flex;align-items:center;gap:8px">
        ${!t.done
          ? `<button class="btn btn-success btn-sm" onclick="event.stopPropagation();completeTask(${t.id})" title="إكمال المشروع" style="padding:4px 8px;font-size:13px;flex-shrink:0"><i class="fa-solid fa-check"></i></button>`
          : `<span style="color:var(--accent3);font-size:16px;flex-shrink:0"><i class="fa-solid fa-square-check" style="color:var(--accent3)"></i></span>`
        }
        <div>
          <b style="${t.done?'text-decoration:line-through;color:var(--text2)':''}">${t.title}</b>
          ${t.brief?'<span style="font-size:10px;color:var(--accent);margin-right:6px"><i class="fa-solid fa-file-lines"></i></span>':''}
          <div style="margin-top:2px">${jtBadge(t.jobType)}</div>
        </div>
      </div>
    </td>
    <td>${t.client||'—'}</td>
    <td class="hide-mobile">${prioBadge[t.priority]}</td>
    <td class="hide-mobile" style="font-family:var(--mono);font-size:11px">${t.orderDate||'—'}</td>
    <td class="hide-mobile" style="font-family:var(--mono);font-size:11px">${t.deadline||'—'}</td>
    <td>
      ${(t.jobType==='fulltime'||t.jobType==='parttime')&&t.salary
        ? `<span style="color:var(--accent3);font-weight:700;font-size:12px">${t.salary.toLocaleString()} ج/شهر</span>`
        : `${payBadge[t.pay||'none']}${t.pay==='deposit'&&t.deposit?`<div style="font-size:11px;color:var(--accent2)">${t.deposit.toLocaleString()} ج</div>`:''}`
      }
    </td>
    <td>${t.done?'<span class="badge badge-green"><i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> مكتمل</span>':statusBadge[t.status]}</td>
    <td><div style="display:flex;gap:4px" onclick="event.stopPropagation()">
      <button class="btn btn-ghost btn-sm" onclick="openTaskModal(${t.id})"><i class="fa-solid fa-pen"></i></button>
      <button class="btn btn-danger btn-sm" onclick="delTask(${t.id})"><i class="fa-solid fa-trash"></i></button>
    </div></td>
  </tr>`).join('')||'<tr><td colspan="8" style="text-align:center;color:var(--text3);padding:24px">لا توجد مهام تطابق الفلتر</td></tr>';
  const badge=document.getElementById('tasks-badge');
  const urgent=S.tasks.filter(t=>!t.done&&t.priority==='high').length;
  badge.textContent=urgent||'';badge.style.display=urgent?'inline-block':'none';
  // Refresh table view if active
  if(document.getElementById('table-view')?.style.display!=='none') _renderTasksTable();
}

