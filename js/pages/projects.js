// PROJECT MANAGEMENT SYSTEM
// ════════════════════════════════════════════════════════════════

// ── CSS ──
(function(){
  const s=document.createElement('style');
  s.textContent=`
    .proj-card{background:var(--surface);border:1.5px solid var(--border);border-radius:16px;padding:0;overflow:hidden;cursor:pointer;transition:.2s;position:relative}
    .proj-card:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.2)}
    .proj-card-top{height:6px;width:100%}
    .proj-card-body{padding:16px}
    .proj-card-name{font-size:15px;font-weight:800;margin-bottom:4px;color:var(--text)}
    .proj-card-client{font-size:11px;color:var(--text3);margin-bottom:10px}
    .proj-progress-bar{height:6px;background:var(--surface3);border-radius:3px;overflow:hidden;margin-bottom:6px}
    .proj-progress-fill{height:100%;border-radius:3px;transition:.4s}
    .proj-progress-label{font-size:10px;color:var(--text3);display:flex;justify-content:space-between}
    .proj-status-badge{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:20px;font-size:10px;font-weight:700}
    .proj-card-footer{display:flex;align-items:center;justify-content:space-between;border-top:1px solid var(--border);padding:8px 16px;margin-top:8px}
    .proj-kanban{display:grid;grid-template-columns:repeat(6,minmax(200px,1fr));gap:10px;min-height:400px;align-items:start;overflow-x:auto;padding-bottom:8px}
    @media(max-width:900px){.proj-kanban{grid-template-columns:repeat(3,minmax(180px,1fr))}}
    @media(max-width:540px){.proj-kanban{grid-template-columns:repeat(2,minmax(160px,1fr))}}
    .proj-kb-col{background:var(--surface2);border-radius:14px;padding:10px;min-height:280px}
    .proj-kb-col-header{font-size:11px;font-weight:800;padding:6px 4px 10px;display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}
    .proj-kb-card{background:var(--surface);border:1.5px solid var(--border);border-radius:10px;padding:10px;margin-bottom:8px;transition:.15s;position:relative}
    .proj-kb-card:hover{border-color:var(--accent);box-shadow:0 4px 12px rgba(0,0,0,.15);transform:translateY(-1px)}
    .proj-kb-card.dragging{opacity:.5;cursor:grabbing}
    .proj-kb-col.drag-over{background:var(--surface3);border:2px dashed var(--accent)}
    .proj-tab{padding:8px 16px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;border:none;background:transparent;color:var(--text3);transition:.15s;white-space:nowrap}
    .proj-tab.active{background:var(--accent);color:#fff}
    .proj-tab:hover:not(.active){background:var(--surface2);color:var(--text)}
    .priority-high{color:#f76f7c;background:rgba(247,111,124,.1);border-radius:6px;padding:1px 6px;font-size:10px;font-weight:700}
    .priority-normal{color:#f7c948;background:rgba(247,201,72,.1);border-radius:6px;padding:1px 6px;font-size:10px;font-weight:700}
    .priority-low{color:#4fd1a5;background:rgba(79,209,165,.1);border-radius:6px;padding:1px 6px;font-size:10px;font-weight:700}
    .proj-member-chip{display:inline-flex;align-items:center;gap:5px;background:var(--surface3);border:1px solid var(--border);border-radius:20px;padding:4px 10px;font-size:11px;font-weight:600}
    .proj-member-toggle{cursor:pointer;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:600;border:1.5px solid var(--border);background:var(--surface);transition:.12s}
    .proj-member-toggle.selected{background:var(--accent);border-color:var(--accent);color:#fff}
  `;
  document.head.appendChild(s);
})();

// ── Helpers ──
function _getProjects(){ return S.projects||[]; }
function _getProjById(id){ return _getProjects().find(p=>String(p.id)===String(id)); }
function _getProjTasks(projId){ return (S.project_tasks||[]).filter(t=>String(t.project_id)===String(projId)); }
function _getProjProgress(projId){
  var tasks=_getProjTasks(projId);
  if(!tasks.length) return 0;
  var done=tasks.filter(t=>t.status==='done').length;
  return Math.round(done/tasks.length*100);
}
function _getProjStatusInfo(st){
  return {active:{label:'نشط',color:'#4fd1a5',bg:'rgba(79,209,165,.15)'},
    hold:{label:'معلق',color:'#f7c948',bg:'rgba(247,201,72,.15)'},
    review:{label:'مراجعة',color:'#64b5f6',bg:'rgba(100,181,246,.15)'},
    done:{label:'مكتمل',color:'#7c6ff7',bg:'rgba(124,111,247,.15)'}}[st]||{label:st,color:'#888',bg:'rgba(128,128,128,.1)'};
}
function _getTaskStatusInfo(st){
  return {
    todo:     {label:'جديد',         color:'#64b5f6', bg:'rgba(100,181,246,.15)'},
    progress: {label:'قيد التنفيذ', color:'#f7c948', bg:'rgba(247,201,72,.15)'},
    review:   {label:'مراجعة',       color:'#a78bfa', bg:'rgba(167,139,250,.15)'},
    revision: {label:'تعديلات',      color:'#f97316', bg:'rgba(249,115,22,.15)'},
    done:     {label:'مكتمل',        color:'#4fd1a5', bg:'rgba(79,209,165,.15)'},
    hold:     {label:'موقوف مؤقتاً', color:'#888888', bg:'rgba(128,128,128,.15)'}
  }[st]||{label:st,color:'#888',bg:'rgba(128,128,128,.1)'};
}
function _getPriorityInfo(p){
  return {high:{label:'عالية',cls:'priority-high'},normal:{label:'عادية',cls:'priority-normal'},low:{label:'منخفضة',cls:'priority-low'}}[p]||{label:p,cls:'priority-normal'};
}

// ── Task Detail View (popup overlay) ──
function openProjTaskDetail(taskId, projId){
  var t=(S.project_tasks||[]).find(function(x){return String(x.id)===String(taskId);});
  var proj=_getProjById(projId);
  if(!t) return;
  var steps=t.steps||[];
  var doneSteps=steps.filter(function(s){return s.done;}).length;
  var pri=_getPriorityInfo(t.priority||'normal');
  var priColors={high:'#f76f7c',normal:'#f7c948',low:'#4fd1a5'};
  var priC=priColors[t.priority||'normal']||'#888';
  var st=_getTaskStatusInfo(t.status||'todo');
  var clr=proj?proj.color||'var(--accent)':'var(--accent)';

  var over=document.createElement('div');
  over.className='modal-overlay'; over.style.cssText='display:flex;align-items:center;justify-content:center;z-index:9999';
  over.innerHTML=
    '<div class="modal" style="width:min(560px,96vw);max-height:90vh;overflow-y:auto;border-radius:16px">'+
    '<!-- Header -->'+
    '<div style="background:'+clr+'18;border-bottom:1px solid var(--border);padding:18px 20px;border-radius:16px 16px 0 0">'+
      '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px">'+
        '<div style="flex:1">'+
          '<div style="font-size:16px;font-weight:900;margin-bottom:6px;line-height:1.3">'+escapeHtml(t.title)+'</div>'+
          '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">'+
            '<span style="font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;background:'+st.bg+';color:'+st.color+'">'+st.label+'</span>'+
            '<span style="font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;background:'+priC+'22;color:'+priC+'">'+pri.label+'</span>'+
            (t.deadline?'<span style="font-size:11px;color:var(--text3)"><i class="fa-solid fa-calendar"></i> '+t.deadline+'</span>':'')+
          '</div>'+
        '</div>'+
        '<button onclick="this.closest(\'.modal-overlay\').remove()" style="background:var(--surface2);border:none;border-radius:50%;width:32px;height:32px;cursor:pointer;font-size:16px;color:var(--text);display:flex;align-items:center;justify-content:center;flex-shrink:0">✕</button>'+
      '</div>'+
    '</div>'+
    '<!-- Body -->'+
    '<div style="padding:18px 20px;display:flex;flex-direction:column;gap:14px">'+

    // Description
    (t.desc?'<div><div style="font-size:11px;font-weight:700;color:var(--text3);margin-bottom:6px;text-transform:uppercase;letter-spacing:.5px">الوصف</div><div style="font-size:13px;color:var(--text2);line-height:1.7;background:var(--surface2);padding:12px;border-radius:10px">'+escapeHtml(t.desc)+'</div></div>':'')+

    // Info row
    '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">'+
      (t.assignee_name?'<div style="background:var(--surface2);border-radius:10px;padding:10px;text-align:center"><div style="font-size:10px;color:var(--text3);margin-bottom:4px">المسؤول</div><div style="width:32px;height:32px;border-radius:50%;background:'+clr+';display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:900;color:#fff;margin:0 auto 4px"><span>'+(t.assignee_name.charAt(0).toUpperCase())+'</span></div><div style="font-size:11px;font-weight:700">'+escapeHtml(t.assignee_name)+'</div></div>':'')+
      (t.value?'<div style="background:var(--surface2);border-radius:10px;padding:10px;text-align:center"><div style="font-size:10px;color:var(--text3);margin-bottom:4px">التكلفة</div><div style="font-size:16px;font-weight:900;color:var(--accent3)">'+t.value.toLocaleString()+'</div><div style="font-size:10px;color:var(--text3)">'+( t.currency||'ج.م')+(t.paymentCollected?' · <span style=color:#4fd1a5>محصّل</span>':' · <span style=color:#f7c948>لم يُحصّل</span>')+'</div></div>':'')+
      '<div style="background:var(--surface2);border-radius:10px;padding:10px;text-align:center"><div style="font-size:10px;color:var(--text3);margin-bottom:4px">الخطوات</div><div style="font-size:16px;font-weight:900;color:var(--accent)">'+doneSteps+'/'+steps.length+'</div><div style="font-size:10px;color:var(--text3)">مكتمل</div></div>'+
    '</div>'+

    // Steps
    (steps.length?
    '<div>'+
      '<div style="font-size:11px;font-weight:700;color:var(--text3);margin-bottom:8px;display:flex;justify-content:space-between;align-items:center">'+
        '<span>الخطوات</span>'+
        '<span style="font-size:10px;background:var(--accent)22;color:var(--accent);padding:2px 8px;border-radius:10px">'+Math.round(doneSteps/(steps.length||1)*100)+'%</span>'+
      '</div>'+
      '<div style="height:4px;background:var(--surface3);border-radius:2px;overflow:hidden;margin-bottom:10px">'+
        '<div style="height:100%;width:'+Math.round(doneSteps/(steps.length||1)*100)+'%;background:var(--accent3);border-radius:2px;transition:.3s"></div>'+
      '</div>'+
      steps.map(function(s,i){
        return '<div id="td-step-'+taskId+'-'+i+'" style="display:flex;align-items:flex-start;gap:10px;padding:10px 12px;background:var(--surface2);border:1px solid '+(s.done?'var(--accent3)33':'var(--border)')+';border-radius:10px;margin-bottom:6px;cursor:pointer;transition:.2s" onclick="_tdToggleStep(\''+taskId+'\',\''+projId+'\','+i+')">'+
          '<div style="width:18px;height:18px;border-radius:50%;border:2px solid '+(s.done?'var(--accent3)':'var(--border)')+';background:'+(s.done?'var(--accent3)':'transparent')+';display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;transition:.2s">'+
            (s.done?'<i class="fa-solid fa-check" style="font-size:9px;color:#fff"></i>':'')+
          '</div>'+
          '<div style="flex:1;min-width:0">'+
            '<div style="font-size:12px;font-weight:600;'+(s.done?'text-decoration:line-through;color:var(--text3)':'color:var(--text)')+'">'+escapeHtml(s.text)+'</div>'+
            (s.note?'<div style="font-size:11px;color:var(--text3);margin-top:4px;background:var(--surface3);padding:5px 8px;border-radius:6px;border-right:2px solid var(--accent)"><i class="fa-solid fa-note-sticky" style="color:var(--accent);margin-left:4px"></i>'+escapeHtml(s.note)+'</div>':'')+
          '</div>'+
        '</div>';
      }).join('')+
    '</div>':'')+

    // Project Delivery Link
    '<div style="background:var(--surface2);border:1px solid var(--border);border-radius:12px;padding:14px 16px">'+
      '<div style="font-size:11px;font-weight:700;color:var(--text3);margin-bottom:10px;display:flex;align-items:center;gap:6px">'+
        '<i class="fa-solid fa-link" style="color:var(--accent3)"></i> رابط تسليم المشروع'+
        (t.clientReceived?'<span style="font-size:10px;background:rgba(79,209,165,.15);color:var(--accent3);padding:2px 8px;border-radius:20px;font-weight:700;margin-right:6px"><i class="fa-solid fa-handshake"></i> استلم العميل</span>':'')+
      '</div>'+
      '<div style="display:flex;gap:8px">'+
        '<input id="ptd-proj-link-'+t.id+'" type="url" value="'+escapeHtml(t.projectLink||t.driveLink||'')+'" placeholder="https://drive.google.com/... أو أي رابط للتسليم" style="flex:1;padding:8px 12px;background:var(--surface);border:1px solid var(--border);border-radius:8px;font-size:12px;color:var(--text);font-family:var(--font)"/>'+
        '<button data-tid="'+taskId+'" data-pid="'+projId+'" onclick="_saveProjTaskDeliveryLink(this.dataset.tid,this.dataset.pid)" class="btn btn-ghost btn-sm" style="flex-shrink:0;padding:8px 14px"><i class="fa-solid fa-floppy-disk"></i> حفظ</button>'+
        ((t.projectLink||t.driveLink)?'<a href="'+escapeHtml(t.projectLink||t.driveLink)+'" target="_blank" class="btn btn-ghost btn-sm" style="flex-shrink:0;padding:8px 12px;color:var(--accent3)" title="فتح الرابط"><i class="fa-solid fa-external-link-alt"></i></a>':'')+
      '</div>'+
      (t.clientRevisionNote?'<div style="margin-top:10px;padding:10px 12px;background:rgba(249,115,22,.08);border-radius:10px;border-right:3px solid #f97316;font-size:12px;color:var(--text2)"><i class="fa-solid fa-rotate-left" style="color:#f97316;margin-left:6px"></i><strong>طلب تعديل العميل:</strong> '+escapeHtml(t.clientRevisionNote)+'</div>':'')+
    '</div>'+

    // Footer actions
    '<div style="display:flex;gap:8px;padding-top:4px;border-top:1px solid var(--border)">'+
      '<button onclick="this.closest(\'.modal-overlay\').remove();openProjTaskModal(\''+projId+'\',\''+taskId+'\')" class="btn btn-primary" style="flex:1;justify-content:center"><i class="fa-solid fa-pen" style="margin-left:5px"></i> تعديل المهمة</button>'+
      '<button onclick="this.closest(\'.modal-overlay\').remove()" class="btn btn-ghost">إغلاق</button>'+
    '</div>'+

    '</div></div>'; // end body + modal

  document.body.appendChild(over);
  over.addEventListener('click',function(e){ if(e.target===over) over.remove(); });
}

// Toggle step done from task detail overlay and re-render
function _tdToggleStep(taskId, projId, stepIdx){
  var t=(S.project_tasks||[]).find(function(x){return String(x.id)===String(taskId);});
  if(!t||!t.steps||!t.steps[stepIdx]) return;
  t.steps[stepIdx].done = !t.steps[stepIdx].done;
  lsSave(); cloudSave(S);
  // Re-open detail
  var ov=document.querySelector('.modal-overlay[style*="9999"]');
  if(ov) ov.remove();
  openProjTaskDetail(taskId, projId);
}

function _saveProjTaskDeliveryLink(taskId, projId){
  var t=(S.project_tasks||[]).find(function(x){return String(x.id)===String(taskId);});
  if(!t) return;
  var inp = document.getElementById('ptd-proj-link-'+taskId);
  if(!inp) return;
  var link = inp.value.trim();
  t.projectLink = link;
  t.driveLink = link;
  lsSave(); cloudSave(S);
  showMiniNotif('<i class="fa-solid fa-link" style="color:var(--accent3)"></i> تم حفظ رابط التسليم');
  // Re-render the detail to reflect the saved link
  var ov=document.querySelector('.modal-overlay[style*="9999"]');
  if(ov) ov.remove();
  openProjTaskDetail(taskId, projId);
}

var _projView='grid';
function setProjView(v){
  _projView=v;
  document.getElementById('proj-view-grid').classList.toggle('active-view',v==='grid');
  document.getElementById('proj-view-list').classList.toggle('active-view',v==='list');
  renderProjects();
}

// ── Render Projects List ──
function renderProjects(){
  var container=document.getElementById('projects-container'); if(!container) return;
  var filter=(document.getElementById('proj-filter-status')||{}).value||'';
  var projs=_getProjects().filter(p=>!filter||p.status===filter);

  // Stats
  var all=_getProjects();
  var setEl=(id,v)=>{var e=document.getElementById(id);if(e)e.textContent=v;};
  setEl('ps-total-count',all.length);
  setEl('ps-active-count',all.filter(p=>p.status==='active').length);
  setEl('ps-hold-count',all.filter(p=>p.status==='hold').length);
  setEl('ps-done-count',all.filter(p=>p.status==='done').length);

  if(!projs.length){
    container.innerHTML=`<div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--text3)">
      <div style="font-size:48px;margin-bottom:12px">📁</div>
      <div style="font-size:16px;font-weight:700;margin-bottom:6px">لا توجد مشاريع بعد</div>
      <div style="font-size:13px;margin-bottom:16px">ابدأ بإنشاء مشروعك الأول</div>
      <button class="btn btn-primary" onclick="openProjectModal()"><i class="fa-solid fa-plus"></i> مشروع جديد</button>
    </div>`;
    return;
  }

  if(_projView==='list'){
    container.style.gridTemplateColumns='1fr';
    container.innerHTML=projs.map(p=>renderProjListItem(p)).join('');
  } else {
    container.style.gridTemplateColumns='repeat(auto-fill,minmax(300px,1fr))';
    container.innerHTML=projs.map(p=>renderProjCard(p)).join('');
  }
}

function renderProjCard(p){
  var prog=_getProjProgress(p.id);
  var tasks=_getProjTasks(p.id);
  var st=_getProjStatusInfo(p.status||'active');
  var client=(S.clients||[]).find(c=>String(c.id)===String(p.client_id));
  var clr=p.color||'var(--accent)';
  var deadline=p.deadline?new Date(p.deadline):null;
  var isOverdue=deadline&&deadline<new Date()&&p.status!=='done';
  var typeLabel=p.projectType==='team'?'👥 فريق':'💼 تاسكات';
  var typeClr=p.projectType==='team'?'var(--accent2)':'var(--accent)';
  var totalVal=tasks.reduce(function(s,t){return s+(t.value||0);},0);
  var collectedVal=tasks.filter(function(t){return t.paymentCollected||t.paymentStatus==='collected';}).reduce(function(s,t){return s+(t.value||0);},0);
  return `<div class="proj-card" onclick="openProjectDetail('${p.id}')">
    <div class="proj-card-top" style="background:${clr}"></div>
    <div class="proj-card-body">
      <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:6px">
        <div class="proj-card-name">${escapeHtml(p.name)}</div>
        <span class="proj-status-badge" style="color:${st.color};background:${st.bg}">${st.label}</span>
      </div>
      <span style="font-size:9px;font-weight:800;padding:2px 8px;border-radius:10px;background:${typeClr}18;color:${typeClr};border:1px solid ${typeClr}33;margin-bottom:6px;display:inline-block">${typeLabel}</span>
      <div class="proj-card-client">${client?'<i class="fa-solid fa-user"></i> '+escapeHtml(client.name):'<i class="fa-solid fa-circle-minus"></i> بدون عميل'}</div>
      ${totalVal>0?`<div style="font-size:10px;color:var(--text3);margin-top:4px;display:flex;gap:10px"><span><i class="fa-solid fa-coins" style="color:#f7c948"></i> <span style="color:#f7c948;font-weight:700">${totalVal.toLocaleString()}</span></span><span style="color:#4fd1a5">✅ ${collectedVal.toLocaleString()} محصّل</span></div>`:''}
      <div class="proj-progress-bar" style="margin-top:8px"><div class="proj-progress-fill" style="width:${prog}%;background:${clr}"></div></div>
      <div class="proj-progress-label"><span>${prog}% مكتمل</span><span>${tasks.filter(t=>t.status==='done').length}/${tasks.length} مهمة</span></div>
      ${p.deadline?`<div style="font-size:10px;margin-top:6px;color:${isOverdue?'var(--accent4)':'var(--text3)'}"><i class="fa-solid fa-calendar${isOverdue?' fa-shake':''}"></i> ${p.deadline}${isOverdue?' — متأخر!':''}</div>`:''}
    </div>
    <div class="proj-card-footer">
      <div style="display:flex;gap:-6px">${(p.members||[]).slice(0,4).map(m=>`<div style="width:26px;height:26px;border-radius:50%;background:${p.color||'var(--accent)'};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;border:2px solid var(--surface);margin-left:-6px">${(m.name||'?').charAt(0).toUpperCase()}</div>`).join('')}</div>
      <div style="display:flex;gap:6px" onclick="event.stopPropagation()">
        <button data-pid="${p.id}" onclick="openProjectModal(this.dataset.pid)" class="btn btn-ghost btn-sm" style="padding:4px 8px"><i class="fa-solid fa-pen"></i></button>
        <button data-pid="${p.id}" onclick="deleteProject(this.dataset.pid)" class="btn btn-danger btn-sm" style="padding:4px 8px"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>
  </div>`;
}

function renderProjListItem(p){
  var prog=_getProjProgress(p.id);
  var tasks=_getProjTasks(p.id);
  var st=_getProjStatusInfo(p.status||'active');
  var client=(S.clients||[]).find(c=>String(c.id)===String(p.client_id));
  var clr=p.color||'var(--accent)';
  return `<div class="proj-card" onclick="openProjectDetail('${p.id}')" style="border-radius:12px">
    <div style="display:flex;align-items:center;gap:12px;padding:14px 16px">
      <div style="width:4px;height:50px;border-radius:3px;background:${clr};flex-shrink:0"></div>
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span style="font-size:14px;font-weight:800">${escapeHtml(p.name)}</span>
          <span class="proj-status-badge" style="color:${st.color};background:${st.bg}">${st.label}</span>
        </div>
        <div style="font-size:11px;color:var(--text3)">${client?escapeHtml(client.name):'بدون عميل'} · ${tasks.length} مهمة</div>
      </div>
      <div style="width:120px;flex-shrink:0">
        <div class="proj-progress-bar"><div class="proj-progress-fill" style="width:${prog}%;background:${clr}"></div></div>
        <div style="font-size:10px;color:var(--text3);text-align:center;margin-top:2px">${prog}%</div>
      </div>
      <div style="display:flex;gap:6px;flex-shrink:0" onclick="event.stopPropagation()">
        <button data-pid="${p.id}" onclick="openProjectModal(this.dataset.pid)" class="btn btn-ghost btn-sm"><i class="fa-solid fa-pen"></i></button>
        <button data-pid="${p.id}" onclick="deleteProject(this.dataset.pid)" class="btn btn-danger btn-sm"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>
  </div>`;
}

// ── Project Modal ──
var _projColorPicked='#7c6ff7';
function pickProjColor(c){
  _projColorPicked=c;
  document.querySelectorAll('#proj-color-picker span').forEach(s=>{
    s.style.border=s.dataset.c===c?'3px solid var(--text)':'2px solid transparent';
  });
  document.getElementById('proj-color').value=c;
}

function openProjectModal(id){
  try {
  var proj=id?_getProjById(id):null;
  var _e=function(i){return document.getElementById(i);};
  if(_e('proj-eid')) _e('proj-eid').value=id||'';
  if(_e('proj-modal-title')) _e('proj-modal-title').innerHTML=id?'<i class="fa-solid fa-pen"></i> تعديل المشروع':'<i class="fa-solid fa-diagram-project"></i> مشروع جديد';
  if(_e('proj-name')) _e('proj-name').value=proj?proj.name:'';
  if(_e('proj-desc')) _e('proj-desc').value=proj?proj.desc||'':'';
  if(_e('proj-status')) _e('proj-status').value=proj?proj.status||'active':'active';
  if(_e('proj-start')) _e('proj-start').value=proj?proj.start||'':'';
  if(_e('proj-deadline')) _e('proj-deadline').value=proj?proj.deadline||'':'';
  if(typeof pickProjColor==='function') pickProjColor(proj?proj.color||'#7c6ff7':'#7c6ff7');
  // Project type
  var pt=proj?proj.projectType||'tasks':'tasks';
  var ptTasks=document.getElementById('proj-type-tasks');
  var ptTeam=document.getElementById('proj-type-team');
  if(ptTasks) ptTasks.checked=(pt!=='team');
  if(ptTeam) ptTeam.checked=(pt==='team');
  onProjTypeChange();
  var budInp=document.getElementById('proj-budget');
  var budCur=document.getElementById('proj-budget-currency');
  var budType=document.getElementById('proj-pricing-type');
  if(budInp) budInp.value=proj?proj.budget||'':'';
  if(budCur) budCur.value=proj?proj.budgetCurrency||'ج.م':'ج.م';
  if(budType) budType.value=proj?proj.pricingType||'fixed':'fixed';
  // Client select
  var csel=document.getElementById('proj-client');
  csel.innerHTML='<option value="">— بدون عميل —</option>'+(S.clients||[]).map(c=>`<option value="${c.id}"${proj&&String(proj.client_id)===String(c.id)?' selected':''}>${escapeHtml(c.name)}</option>`).join('');
  // Team select dropdown
  var tsel=document.getElementById('proj-team-select');
  if(tsel){
    var teamGroups=_getTeamGroups();
    tsel.innerHTML='<option value="">— اختر فريق (اختياري) —</option>'+teamGroups.map(function(g){
      return '<option value="'+g.id+'"'+(proj&&proj.team_group_id===g.id?' selected':'')+'>'+escapeHtml(g.name)+'</option>';
    }).join('');
  }
  // Team members
  _renderProjMembersSelect(proj?proj.members||[]:[]);
  openM('modal-project');
  setTimeout(function(){ var n=document.getElementById('proj-name'); if(n) n.focus(); },100);
  } catch(e) {
    console.error('openProjectModal error:', e);
    try { openM('modal-project'); } catch(e2) {}
  }
}

function onProjTypeChange(){
  var isTeam = document.getElementById('proj-type-team')&&document.getElementById('proj-type-team').checked;
  var tlbl=document.getElementById('proj-type-tasks-label');
  var ttml=document.getElementById('proj-type-team-label');
  if(tlbl) tlbl.style.borderColor=(!isTeam)?'var(--accent)':'var(--border)';
  if(ttml) ttml.style.borderColor=(isTeam)?'var(--accent2)':'var(--border)';
}

// جلب مجموعات الفريق (S.teams التي هي في الكود الأصلي قوائم أعضاء وليست groups)
// نبني groups من أسماء الأعضاء أو نجعل كل عضو فريقاً منفصلاً
function _getTeamGroups(){
  // لو في S.team_groups استخدمها، وإلا ابنيها من S.teams
  if(S.team_groups && S.team_groups.length) return S.team_groups;
  // كل عضو في S.teams يُعتبر "فريق" منفرد كـ fallback
  return (S.teams||[]).filter(function(m){return m.role!='invite_pending';}).map(function(m){
    return {id:'member_'+m.id, name:m.name||m.email||'؟', members:[{id:m.id,name:m.name||m.email||''}]};
  });
}

function onProjTeamChange(teamGroupId){
  if(!teamGroupId){ _renderProjMembersSelect([]); return; }
  var groups=_getTeamGroups();
  var g=groups.find(function(x){return x.id===teamGroupId;});
  if(g && g.members && g.members.length){
    _renderProjMembersSelect(g.members);
    // تحديد الكل
    setTimeout(function(){
      document.querySelectorAll('#proj-members-select .proj-member-toggle').forEach(function(el){
        el.classList.add('selected');
      });
    },50);
  }
}

// ── فلتر الفريق في modal مهمة المشروع ──
function onPtaskTeamChange(teamGroupId){
  var projId = document.getElementById('ptask-proj-id')?.value;
  var proj = projId ? _getProjById(projId) : null;
  var projMembers = proj ? (proj.members||[]) : [];
  var allTeamMembers = (S.teams||[]).filter(function(m){ return m.role!='invite_pending'; });
  var me = {id:'me', name:S.settings?.name||'أنا'};

  var members;
  if(teamGroupId){
    // فلتر بالفريق المختار
    var groups = _getTeamGroups();
    var g = groups.find(function(x){ return x.id===teamGroupId; });
    var groupMemberIds = g ? (g.members||[]).map(function(m){ return String(m.id); }) : [];
    // من أعضاء المشروع اللي في الفريق ده، أو من كل أعضاء الفريق
    if(projMembers.length > 0){
      members = projMembers.filter(function(m){ return groupMemberIds.includes(String(m.id)) || m.id==='me'; });
      if(!members.length) members = (g?g.members:[]);
    } else {
      members = g ? [me, ...g.members] : [me, ...allTeamMembers];
    }
  } else {
    // كل الأعضاء
    if(projMembers.length > 0){
      var hasMeInProj = projMembers.some(function(m){ return m.id==='me'; });
      members = hasMeInProj ? projMembers : [me, ...projMembers];
    } else {
      members = [me, ...allTeamMembers];
    }
  }

  var asel = document.getElementById('ptask-assignee');
  if(!asel) return;
  var curVal = asel.value;
  asel.innerHTML = '<option value="">— اختر من '+(teamGroupId?'الفريق':'الأعضاء')+' —</option>' +
    members.map(function(m){
      var n = escapeHtml(m.name||m.email||'?');
      var sel = curVal===String(m.id) ? 'selected' : '';
      return '<option value="'+m.id+'" '+sel+'>'+n+'</option>';
    }).join('');
}

function togglePtaskDepositField(){
  var sel=document.getElementById('ptask-payment-status');
  var row=document.getElementById('ptask-deposit-row');
  if(row) row.style.display=(sel&&sel.value==='deposit')?'':'none';
}

function _renderProjMembersSelect(selected){
  var container=document.getElementById('proj-members-select'); if(!container) return;
  var team=(S.teams||[]).filter(m=>m.role!='invite_pending');
  var me={id:'me',name:S.settings?.name||'أنا'};
  var allMembers=[me,...team];
  container.innerHTML=allMembers.map(m=>{
    var isSel=selected.some(s=>String(s.id)===String(m.id));
    return `<span class="proj-member-toggle${isSel?' selected':''}" data-mid="${m.id}" data-mname="${escapeHtml(m.name||m.email||'')}" onclick="toggleProjMember(this)">${escapeHtml(m.name||m.email||'?')}</span>`;
  }).join('');
}

function toggleProjMember(el){
  el.classList.toggle('selected');
}

function saveProject(){
  try {
    var eid = (document.getElementById('proj-eid')||{}).value || '';
    var nameEl = document.getElementById('proj-name');
    var name = nameEl ? nameEl.value.trim() : '';
    if(!name){ toast('<i class="fa-solid fa-triangle-exclamation"></i> اسم المشروع مطلوب'); return; }
    if(!S.projects) S.projects = [];

    // ── Collect selected members safely ──
    var members = [];
    try {
      var selEls = document.querySelectorAll('#proj-members-select .selected');
      for(var mi=0; mi<selEls.length; mi++){
        var mel = selEls[mi];
        members.push({ id: mel.dataset.mid||'', name: mel.dataset.mname||'' });
      }
    } catch(me) { members = []; }

    var _g = function(id){ return document.getElementById(id); };
    var _v = function(id, def){ var e=_g(id); return e ? (e.value||def||'') : (def||''); };

    var tsel = _g('proj-team-select');
    var d = {
      name        : name,
      desc        : _v('proj-desc',''),
      client_id   : _v('proj-client',''),
      status      : _v('proj-status','active'),
      start       : _v('proj-start',''),
      deadline    : _v('proj-deadline',''),
      color       : _v('proj-color','#7c6ff7'),
      projectType : (_g('proj-type-team') && _g('proj-type-team').checked) ? 'team' : 'tasks',
      members     : members,
      team_group_id: tsel ? (tsel.value||'') : '',
      budget      : +((_g('proj-budget')||{}).value||0) || 0,
      budgetCurrency: ((_g('proj-budget-currency')||{}).value||'ج.م'),
      pricingType : ((_g('proj-pricing-type')||{}).value||'fixed'),
      createdAt   : new Date().toISOString()
    };

    if(eid){
      var idx = S.projects.findIndex(function(p){ return String(p.id)===String(eid); });
      if(idx > -1){ d.id = +eid; d.createdAt = S.projects[idx].createdAt||d.createdAt; S.projects[idx] = d; }
      else { d.id = Date.now(); S.projects.push(d); }
    } else {
      d.id = Date.now(); S.projects.push(d);
    }

    // ── Force save regardless of _appReady state ──
    window._appReady = true;
    window._cloudLoadDone = true;
    try { lsSave(); } catch(e){}
    try { cloudSave(S); } catch(e){}
    // Also trigger direct cloud save as backup
    setTimeout(function(){ try{ _doCloudSave(S, true); }catch(e){} }, 100);

    closeM('modal-project');
    renderProjects();
    toast('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم حفظ المشروع: ' + name);

  } catch(err) {
    console.error('saveProject error:', err);
    toast('<i class="fa-solid fa-triangle-exclamation" style="color:orange"></i> حدث خطأ: ' + (err.message||'unknown'));
  }
}

function deleteProject(id){
  confirmDel('حذف هذا المشروع وكل مهامه؟',function(){
    S.projects=(S.projects||[]).filter(p=>String(p.id)!==String(id));
    S.project_tasks=(S.project_tasks||[]).filter(t=>String(t.project_id)!==String(id));
    lsSave(); cloudSave(S); renderProjects();
    toast('<i class="fa-solid fa-trash"></i> تم الحذف');
  });
}

// ════════════════════════════════════════════════════════
// PROJECT DETAIL PAGE
// ════════════════════════════════════════════════════════
var _currentProjId=null;
var _currentProjTab='overview';

function openProjectDetail(id){
  _currentProjId=id;
  _currentProjTab='overview';
  var pg=document.getElementById('page-project-detail');
  if(!pg) return;
  renderProjectDetail();
  // Switch page
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  pg.classList.add('active');
  window.scrollTo(0,0);
}

function renderProjectDetail(){
  var id=_currentProjId;
  var proj=_getProjById(id); if(!proj) return;
  var prog=_getProjProgress(id);
  var tasks=_getProjTasks(id);
  var st=_getProjStatusInfo(proj.status||'active');
  var client=(S.clients||[]).find(c=>String(c.id)===String(proj.client_id));
  var clr=proj.color||'var(--accent)';

  var tabs={overview:'نظرة عامة',tasks:'المهام',kanban:'كانبان',table:'<i class="fa-solid fa-table"></i> جدول',finance:'💰 المالية',team:'الفريق',files:'الملفات'};
  var tabsHtml=Object.keys(tabs).map(k=>`<button class="proj-tab${_currentProjTab===k?' active':''}" onclick="switchProjTab('${k}')">${tabs[k]}</button>`).join('');

  var inner=document.getElementById('proj-detail-inner'); if(!inner) return;
  inner.innerHTML=`
    <!-- Header -->
    <div style="background:var(--surface);border-bottom:1px solid var(--border);padding:16px 20px;position:sticky;top:0;z-index:100">
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
        <button class="btn btn-ghost btn-sm" onclick="showPage('projects')"><i class="fa-solid fa-arrow-right"></i></button>
        <div style="width:12px;height:12px;border-radius:50%;background:${clr};flex-shrink:0"></div>
        <div style="flex:1">
          <div style="font-size:16px;font-weight:900">${escapeHtml(proj.name)}</div>
          <div style="font-size:11px;color:var(--text3)">${client?escapeHtml(client.name)+' · ':''}<span style="color:${st.color}">${st.label}</span></div>
        </div>
        <button class="btn btn-primary btn-sm" onclick="openProjSharePortal('${id}')"><i class="fa-solid fa-share-nodes"></i> مشاركة مع العميل</button>
        <button class="btn btn-ghost btn-sm" onclick="openProjectModal('${id}')"><i class="fa-solid fa-pen"></i></button>
      </div>
      <!-- Progress -->
      <div style="margin-top:10px">
        <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text3);margin-bottom:4px">
          <span>تقدم المشروع</span>
          <span>${tasks.filter(t=>t.status==='done').length}/${tasks.length} مهمة · ${prog}%</span>
        </div>
        <div style="height:8px;background:var(--surface3);border-radius:4px;overflow:hidden">
          <div style="height:100%;width:${prog}%;background:${clr};border-radius:4px;transition:.4s"></div>
        </div>
      </div>
      <!-- Tabs -->
      <div style="display:flex;gap:4px;margin-top:12px;overflow-x:auto;scrollbar-width:none">${tabsHtml}</div>
    </div>
    <!-- Tab Content -->
    <div id="proj-tab-content" style="padding:16px 20px">${renderProjTabContent(_currentProjTab,proj,tasks,client,clr)}</div>
  `;
  // Re-init drag drop for kanban
  if(_currentProjTab==='kanban') setTimeout(initProjKanbanDnD,100);
}

function switchProjTab(tab){
  _currentProjTab=tab;
  renderProjectDetail();
  window.scrollTo(0,0);
}

function renderProjTabContent(tab, proj, tasks, client, clr){
  if(tab==='overview') return renderProjOverview(proj,tasks,client,clr);
  if(tab==='tasks')    return renderProjTasksList(proj,tasks,clr);
  if(tab==='kanban')   return renderProjKanban(proj,tasks,clr);
  if(tab==='table')    return renderProjTasksFullTable(proj,tasks,clr);
  if(tab==='finance')  return renderProjFinanceTab(proj,tasks,clr);
  if(tab==='team')     return renderProjTeam(proj,clr);
  if(tab==='files')    return renderProjFiles(proj,clr);
  return '';
}

// ── جدول المهام الكامل للمشروع مع تغيير الحالة inline ──
function renderProjTasksFullTable(proj, tasks, clr){
  var customStatuses = S.customStatuses || [];
  var baseStatuses = [
    {id:'todo',     label:'جديد',         color:'#64b5f6'},
    {id:'progress', label:'قيد التنفيذ',  color:'#f7c948'},
    {id:'review',   label:'مراجعة',       color:'#a78bfa'},
    {id:'revision', label:'تعديلات',      color:'#f97316'},
    {id:'hold',     label:'موقوف',        color:'#888888'},
    {id:'done',     label:'مكتمل',        color:'#4fd1a5'}
  ];
  var allStatuses = [...baseStatuses, ...customStatuses.filter(function(cs){return cs.id&&cs.label;})];
  var cur = proj.budgetCurrency||'ج.م';
  var totalVal = tasks.reduce(function(s,t){return s+(t.value||0);},0);
  var collectedVal = tasks.filter(function(t){return t.paymentCollected||t.paymentStatus==='collected';}).reduce(function(s,t){return s+(t.value||0);},0);

  function stSelect(t){
    var info = allStatuses.find(function(s){return s.id===t.status;})||{label:t.status||'—',color:'#888'};
    var opts = allStatuses.map(function(s){
      return '<option value="'+s.id+'"'+(t.status===s.id?' selected':'')+'>'+s.label+'</option>';
    }).join('');
    return '<div style="position:relative;display:inline-block" onclick="event.stopPropagation()">'
      +'<select data-tid="'+t.id+'" data-pid="'+proj.id+'" '
        +'onchange="event.stopPropagation();_changePtaskStatus(this.dataset.tid,this.dataset.pid,this.value)" '
        +'onclick="event.stopPropagation()" '
        +'title="اضغط لتغيير الحالة" '
        +'style="appearance:none;-webkit-appearance:none;font-size:10px;font-weight:800;padding:3px 24px 3px 10px;border-radius:20px;background:'+info.color+'22;color:'+info.color+';border:1.5px solid '+info.color+'55;cursor:pointer;outline:none;font-family:var(--font);min-width:88px">'
        +opts
      +'</select>'
      +'<span style="position:absolute;left:7px;top:50%;transform:translateY(-50%);pointer-events:none;font-size:8px;color:'+info.color+'">▾</span>'
    +'</div>';
  }

  var header = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:10px">'
    +'<div style="display:flex;gap:10px;flex-wrap:wrap">'
    +(totalVal>0?
      '<div style="background:var(--surface2);border-radius:10px;padding:7px 14px;border:1px solid var(--border);font-size:12px">'
        +'<span style="color:var(--text3)">إجمالي: </span>'
        +'<span style="font-weight:900;color:#f7c948">'+totalVal.toLocaleString()+' '+cur+'</span>'
      +'</div>'
      +'<div style="background:var(--surface2);border-radius:10px;padding:7px 14px;border:1px solid var(--border);font-size:12px">'
        +'<span style="color:var(--text3)">محصّل: </span>'
        +'<span style="font-weight:900;color:#4fd1a5">'+collectedVal.toLocaleString()+' '+cur+'</span>'
      +'</div>'
    :'')
    +'</div>'
    +'<button class="btn btn-primary btn-sm" onclick="openProjTaskModal(\''+proj.id+'\')"><i class="fa-solid fa-plus"></i> مهمة جديدة</button>'
  +'</div>';

  if(!tasks.length){
    return header+'<div style="text-align:center;padding:60px 20px;color:var(--text3)"><div style="font-size:40px;margin-bottom:12px">📋</div><div style="font-weight:700;margin-bottom:8px">لا توجد مهام</div><button class="btn btn-primary" onclick="openProjTaskModal(\''+proj.id+'\')"><i class="fa-solid fa-plus"></i> أضف مهمة</button></div>';
  }

  var rows = tasks.map(function(t, idx){
    var isDone = t.status==='done';
    var isLate = t.deadline && new Date(t.deadline)<new Date() && !isDone;
    var rowBg = idx%2===0?'var(--surface)':'var(--surface2)';
    var projLink = t.projectLink||t.driveLink||'';
    var payColor = (t.paymentCollected||t.paymentStatus==='collected')?'#4fd1a5':(t.paymentStatus==='deposit')?'#a78bfa':'#f97316';
    var payLabel = (t.paymentCollected||t.paymentStatus==='collected')?'محصّل':(t.paymentStatus==='deposit')?'عربون':'معلق';
    return '<tr class="_ptask-row" style="background:'+rowBg+';cursor:pointer" '
      +'onmouseover="this.style.background=\'var(--surface3)\'" '
      +'onmouseout="this.style.background=\''+rowBg+'\'" '
      +'onclick="openProjTaskDetail('+t.id+','+proj.id+')">'
      +'<td style="padding:11px 14px;font-weight:700;border-bottom:1px solid var(--border);max-width:200px">'
        +'<div style="'+(isDone?'text-decoration:line-through;color:var(--text3)':'')+';white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+escapeHtml(t.title)+'</div>'
        +(t.clientReceived?'<div style="font-size:9px;color:#4fd1a5;font-weight:700;margin-top:2px"><i class="fa-solid fa-handshake"></i> استلم العميل</div>':'')
        +(t.clientRevisionNote?'<div style="font-size:9px;color:#f97316;font-weight:700;margin-top:2px"><i class="fa-solid fa-rotate-left"></i> طلب تعديل: '+escapeHtml(t.clientRevisionNote.substring(0,40))+'</div>':'')
        +(t.taskNote?'<div style="font-size:9px;color:var(--accent);font-weight:600;margin-top:1px"><i class="fa-solid fa-comment-dots"></i> '+escapeHtml(t.taskNote.substring(0,50))+'</div>':'')
      +'</td>'
      +'<td style="padding:11px 8px;text-align:center;border-bottom:1px solid var(--border)" onclick="event.stopPropagation()">'+stSelect(t)+'</td>'
      +'<td style="padding:11px 8px;text-align:center;color:var(--text3);border-bottom:1px solid var(--border);font-size:11px;font-family:var(--mono)">'+(t.orderDate||'—')+'</td>'
      +'<td style="padding:11px 8px;text-align:center;border-bottom:1px solid var(--border);font-size:11px;font-family:var(--mono);color:'+(isLate?'#f76f7c':'var(--text3)')+'">'+( t.deadline||'—')+'</td>'
      +'<td style="padding:11px 8px;text-align:center;border-bottom:1px solid var(--border)">'
        +(t.value>0?'<div style="font-weight:900;color:#f7c948;font-size:12px">'+t.value.toLocaleString()+' '+cur+'</div><div style="font-size:9px;color:'+payColor+';font-weight:700;margin-top:2px">'+payLabel+'</div>':'<span style="color:var(--text3)">—</span>')
      +'</td>'
      +'<td style="padding:11px 8px;text-align:center;color:var(--text3);border-bottom:1px solid var(--border);font-size:11px">'
        +(t.assignee_name?'<div style="display:flex;align-items:center;gap:5px;justify-content:center"><div style="width:22px;height:22px;border-radius:50%;background:'+clr+';display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:900;color:#fff;flex-shrink:0">'+t.assignee_name.charAt(0).toUpperCase()+'</div>'+escapeHtml(t.assignee_name)+'</div>':'—')
      +'</td>'
      +'<td style="padding:11px 8px;text-align:center;border-bottom:1px solid var(--border)" onclick="event.stopPropagation()">'
        +'<div style="display:flex;gap:3px;justify-content:center;align-items:center">'
          +(projLink?'<a href="'+escapeHtml(projLink)+'" target="_blank" class="btn btn-ghost btn-sm" style="padding:3px 6px;font-size:11px;color:var(--accent3)" title="رابط التسليم"><i class="fa-solid fa-link"></i></a>':'')
          +'<button data-tid="'+t.id+'" data-pid="'+proj.id+'" onclick="_openTaskNotePopup(this.dataset.tid,this.dataset.pid)" class="btn btn-ghost btn-sm" style="padding:3px 6px;font-size:11px;color:'+(t.taskNote?'var(--accent)':'var(--text3)')+'" title="ملاحظة"><i class="fa-'+(t.taskNote?'solid':'regular')+' fa-comment"></i></button>'
          +'<button data-tid="'+t.id+'" data-pid="'+proj.id+'" onclick="openProjTaskModal(this.dataset.pid,this.dataset.tid)" class="btn btn-ghost btn-sm" style="padding:3px 6px;font-size:11px"><i class="fa-solid fa-pen"></i></button>'
          +'<button data-tid="'+t.id+'" data-pid="'+proj.id+'" onclick="deleteProjTask(this.dataset.tid,this.dataset.pid)" class="btn btn-danger btn-sm" style="padding:3px 6px;font-size:11px"><i class="fa-solid fa-trash"></i></button>'
        +'</div>'
      +'</td>'
    +'</tr>';
  }).join('');

  return header
    +'<div style="overflow-x:auto;border-radius:14px;border:1px solid var(--border)">'
    +'<table style="width:100%;border-collapse:collapse;font-size:12px">'
    +'<thead><tr style="background:var(--surface2)">'
      +'<th style="padding:10px 14px;text-align:right;font-weight:800;color:var(--text3);border-bottom:1px solid var(--border)">المهمة</th>'
      +'<th style="padding:10px 8px;text-align:center;font-weight:800;color:var(--text3);border-bottom:1px solid var(--border)">الحالة ▾</th>'
      +'<th style="padding:10px 8px;text-align:center;font-weight:800;color:var(--text3);border-bottom:1px solid var(--border)">تاريخ الطلب</th>'
      +'<th style="padding:10px 8px;text-align:center;font-weight:800;color:var(--text3);border-bottom:1px solid var(--border)">الديدلاين</th>'
      +'<th style="padding:10px 8px;text-align:center;font-weight:800;color:var(--text3);border-bottom:1px solid var(--border)">المبلغ</th>'
      +'<th style="padding:10px 8px;text-align:center;font-weight:800;color:var(--text3);border-bottom:1px solid var(--border)">المنفذ</th>'
      +'<th style="padding:10px 8px;text-align:center;font-weight:800;color:var(--text3);border-bottom:1px solid var(--border);width:100px">إجراءات</th>'
    +'</tr></thead>'
    +'<tbody>'+rows+'</tbody>'
    +(totalVal>0?'<tfoot><tr style="background:var(--surface2);border-top:2px solid var(--border)">'
      +'<td colspan="4" style="padding:10px 14px;font-weight:800;font-size:12px">الإجمالي</td>'
      +'<td style="padding:10px 8px;text-align:center;font-weight:900;color:#f7c948;font-size:13px">'+totalVal.toLocaleString()+' '+cur+'</td>'
      +'<td style="padding:10px 8px;text-align:center;font-weight:800;color:#4fd1a5;font-size:11px">'+collectedVal.toLocaleString()+' محصّل</td>'
      +'<td></td>'
    +'</tr></tfoot>':'')
    +'</table></div>';
}

// ── Overview Tab ──
function renderProjOverview(proj,tasks,client,clr){
  var prog=_getProjProgress(proj.id);
  var st=_getProjStatusInfo(proj.status);
  var statusOpts=['active','hold','review','done'];
  return `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
      <div class="card">
        <div class="section-title"><i class="fa-solid fa-circle-info"></i> تفاصيل المشروع</div>
        ${proj.desc?`<div style="font-size:13px;color:var(--text2);margin-bottom:12px;line-height:1.7">${escapeHtml(proj.desc)}</div>`:''}
        <div style="display:flex;flex-direction:column;gap:8px;font-size:12px">
          ${client?`<div style="display:flex;gap:8px"><span style="color:var(--text3);width:80px">العميل</span><strong>${escapeHtml(client.name)}</strong></div>`:''}
          ${proj.start?`<div style="display:flex;gap:8px"><span style="color:var(--text3);width:80px">تاريخ البدء</span><strong>${proj.start}</strong></div>`:''}
          ${proj.deadline?`<div style="display:flex;gap:8px"><span style="color:var(--text3);width:80px">الموعد النهائي</span><strong>${proj.deadline}</strong></div>`:''}
          <div style="display:flex;gap:8px"><span style="color:var(--text3);width:80px">الحالة</span>
            <select style="background:${clr}22;border:1px solid ${clr}55;border-radius:6px;color:${clr};font-size:11px;font-weight:700;padding:2px 8px;cursor:pointer" onchange="changeProjStatus('${proj.id}',this.value)">
              ${statusOpts.map(s=>`<option value="${s}"${proj.status===s?' selected':''}>${_getProjStatusInfo(s).label}</option>`).join('')}
            </select>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="section-title"><i class="fa-solid fa-chart-pie"></i> إحصائيات</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;text-align:center;margin-bottom:12px">
          ${[['إجمالي',tasks.length,'var(--text)'],['To Do',tasks.filter(t=>t.status==='todo').length,'#888'],['جاري',tasks.filter(t=>t.status==='progress').length,'#f7c948'],['مكتمل',tasks.filter(t=>t.status==='done').length,'#4fd1a5']].map(([l,v,c])=>`
          <div style="padding:10px;background:var(--surface2);border-radius:10px">
            <div style="font-size:22px;font-weight:900;color:${c}">${v}</div>
            <div style="font-size:10px;color:var(--text3)">${l}</div>
          </div>`).join('')}
        </div>
        ${(()=>{
          var totalVal=tasks.reduce(function(s,t){return s+(t.value||0);},0);
          var collectedVal=tasks.filter(function(t){return t.paymentCollected;}).reduce(function(s,t){return s+(t.value||0);},0);
          var pendingVal=totalVal-collectedVal;
          if(!totalVal) return '';
          var cur=(tasks.find(function(t){return t.value>0&&t.currency;})||{currency:'ج.م'}).currency||'ج.م';
          return '<div style="border-top:1px solid var(--border);padding-top:10px">'+
            '<div style="font-size:11px;font-weight:800;color:var(--text2);margin-bottom:8px"><i class="fa-solid fa-coins" style="color:var(--accent3)"></i> المالية</div>'+
            '<div style="display:flex;flex-direction:column;gap:6px;font-size:11px">'+
              '<div style="display:flex;justify-content:space-between"><span style="color:var(--text3)">إجمالي</span><strong style="color:var(--accent3)">'+totalVal.toLocaleString()+' '+cur+'</strong></div>'+
              '<div style="display:flex;justify-content:space-between"><span style="color:var(--text3)">محصّل</span><strong style="color:#4fd1a5">'+collectedVal.toLocaleString()+' '+cur+'</strong></div>'+
              '<div style="display:flex;justify-content:space-between"><span style="color:var(--text3)">متبقي</span><strong style="color:#f7c948">'+pendingVal.toLocaleString()+' '+cur+'</strong></div>'+
            '</div>'+
          '</div>';
        })()}
      </div>
    </div>
    <!-- Recent Tasks Table -->
    <div class="card" style="margin-top:14px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div class="section-title" style="margin:0"><i class="fa-solid fa-clipboard-list" style="color:${clr}"></i> آخر المهام</div>
        <button class="btn btn-primary btn-sm" onclick="openProjTaskModal('${proj.id}')"><i class="fa-solid fa-plus"></i> مهمة</button>
      </div>
      ${tasks.length===0 ? '<div style="text-align:center;color:var(--text3);padding:20px;font-size:13px">لا توجد مهام — أضف مهمة جديدة</div>' : renderProjTasksOverviewTable(tasks.slice(0,5), proj, clr)}
    </div>
    <!-- Project Comments -->
    ${(()=>{
      var pid = String(proj.id);
      var projComments = (proj.comments||[]);
      var commHtml = projComments.map(function(c){
        var d=new Date(c.at);
        var ts=d.getDate()+'/'+(d.getMonth()+1)+'/'+d.getFullYear()+' '+d.getHours().toString().padStart(2,'0')+':'+d.getMinutes().toString().padStart(2,'0');
        return '<div style="background:var(--surface);border:1px solid rgba(124,111,247,.2);border-radius:10px;padding:10px 14px;margin-bottom:6px">'
          +'<div style="display:flex;justify-content:space-between;margin-bottom:4px">'
            +'<span style="font-size:11px;font-weight:700;color:var(--accent)">'+escapeHtml(c.author||'')+'</span>'
            +'<span style="font-size:10px;color:var(--text3)">'+ts+'</span>'
          +'</div>'
          +'<div style="font-size:13px;color:var(--text2);line-height:1.6">'+escapeHtml(c.text)+'</div>'
        +'</div>';
      }).join('');
      return '<div class="card" style="margin-top:14px">'
        +'<div style="font-size:13px;font-weight:800;margin-bottom:12px;display:flex;align-items:center;gap:8px">'
          +'<i class="fa-solid fa-comments" style="color:var(--accent)"></i> ملاحظات المشروع'
          +'<span style="font-size:10px;background:rgba(124,111,247,.15);color:var(--accent);padding:2px 8px;border-radius:8px">'+projComments.length+'</span>'
        +'</div>'
        +(projComments.length ? commHtml : '<div style="font-size:12px;color:var(--text3);text-align:center;padding:8px 0">لا ملاحظات بعد</div>')
        +'<div style="display:flex;gap:8px;margin-top:12px">'
          +'<textarea id="proj-comment-'+pid+'" rows="2" style="flex:1;padding:8px 12px;background:var(--surface2);border:1px solid var(--border);border-radius:10px;font-size:13px;color:var(--text);resize:none;font-family:var(--font)" placeholder="أضف ملاحظة على المشروع..."></textarea>'
          +'<button style="padding:10px 16px;background:var(--accent);color:#fff;border:none;border-radius:10px;cursor:pointer;font-size:13px;align-self:flex-end" onclick="_submitProjComment(\''+pid+'\')"><i class="fa-solid fa-paper-plane"></i></button>'
        +'</div>'
      +'</div>';
    })()}`;
}

// ── Tasks List Tab ──
function renderProjTasksList(proj,tasks,clr){
  // جمع الحالات المخصصة + الأساسية
  var customStatuses = S.customStatuses || [];
  var baseStatuses = [
    {id:'todo',     label:'جديد',         color:'#64b5f6'},
    {id:'progress', label:'شغال',         color:'#f7c948'},
    {id:'hold',     label:'موقوف',         color:'#888888'},
    {id:'done',     label:'مكتمل',         color:'#4fd1a5'}
  ];
  var allStatuses = [...baseStatuses, ...customStatuses.filter(cs=>cs.id&&cs.label)];

  // فلتر نشط
  var activeFilter = window['_ptl_filter_'+proj.id] || 'all';

  var filtered = activeFilter === 'all' ? tasks : tasks.filter(t=>t.status===activeFilter);

  var statusBadge = function(st){
    var info = allStatuses.find(s=>s.id===st);
    if(!info) info={label:st||'—',color:'#888'};
    return '<span style="font-size:10px;font-weight:800;padding:3px 10px;border-radius:20px;background:'+info.color+'22;color:'+info.color+';border:1px solid '+info.color+'44;white-space:nowrap">'+escapeHtml(info.label)+'</span>';
  };

  var payBadge = function(t){
    if(t.paymentCollected||t.paymentStatus==='collected') return '<span style="font-size:10px;font-weight:800;color:#4fd1a5;background:rgba(79,209,165,.12);padding:3px 8px;border-radius:10px">✅ محصّل</span>';
    if(t.paymentStatus==='deposit'||t.deposit>0) return '<span style="font-size:10px;font-weight:800;color:#a78bfa;background:rgba(167,139,250,.12);padding:3px 8px;border-radius:10px">🟣 عربون</span>';
    return '<span style="font-size:10px;font-weight:800;color:#f97316;background:rgba(249,115,22,.12);padding:3px 8px;border-radius:10px">⏳ معلق</span>';
  };

  var totalVal = tasks.reduce(function(s,t){return s+(t.value||0);},0);
  var collectedVal = tasks.filter(function(t){return t.paymentCollected||t.paymentStatus==='collected';}).reduce(function(s,t){return s+(t.value||0);},0);
  var cur = proj.budgetCurrency||'ج.م';

  return '<div>'+
    // ── Header + Status Filters ──
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:10px">'+
      '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">'+
        '<button onclick="window[\'_ptl_filter_'+proj.id+'\']=(\'all\');renderProjectDetail()" class="btn btn-sm" style="background:'+( activeFilter==='all'?clr:'var(--surface2)')+';color:'+(activeFilter==='all'?'#fff':'var(--text2)')+';border:none">الكل ('+tasks.length+')</button>'+
        allStatuses.map(function(s){
          var cnt=tasks.filter(t=>t.status===s.id).length;
          if(!cnt) return '';
          return '<button onclick="window[\'_ptl_filter_'+proj.id+'\']=(\''+s.id+'\');renderProjectDetail()" class="btn btn-sm" style="background:'+(activeFilter===s.id?s.color:'var(--surface2)')+';color:'+(activeFilter===s.id?'#fff':s.color)+';border:1px solid '+s.color+'44">'+escapeHtml(s.label)+' <span style="opacity:.7">('+cnt+')</span></button>';
        }).join('')+
      '</div>'+
      '<button class="btn btn-primary btn-sm" onclick="openProjTaskModal(\''+proj.id+'\')"><i class="fa-solid fa-plus"></i> مهمة جديدة</button>'+
    '</div>'+

    // ── Finance Summary ──
    (totalVal>0?'<div style="display:flex;gap:12px;margin-bottom:14px;flex-wrap:wrap">'+
      '<div style="display:flex;align-items:center;gap:8px;background:var(--surface2);border-radius:10px;padding:8px 14px;border:1px solid var(--border)">'+
        '<span style="font-size:11px;color:var(--text3)">إجمالي</span>'+
        '<span style="font-size:14px;font-weight:900;color:#f7c948">'+totalVal.toLocaleString()+' '+cur+'</span>'+
      '</div>'+
      '<div style="display:flex;align-items:center;gap:8px;background:var(--surface2);border-radius:10px;padding:8px 14px;border:1px solid var(--border)">'+
        '<span style="font-size:11px;color:var(--text3)">محصّل</span>'+
        '<span style="font-size:14px;font-weight:900;color:#4fd1a5">'+collectedVal.toLocaleString()+' '+cur+'</span>'+
      '</div>'+
      '<div style="display:flex;align-items:center;gap:8px;background:var(--surface2);border-radius:10px;padding:8px 14px;border:1px solid var(--border)">'+
        '<span style="font-size:11px;color:var(--text3)">متبقي</span>'+
        '<span style="font-size:14px;font-weight:900;color:#f97316">'+(totalVal-collectedVal).toLocaleString()+' '+cur+'</span>'+
      '</div>'+
    '</div>':'') +

    // ── Table ──
    (!filtered.length?
      '<div style="text-align:center;padding:60px 20px;color:var(--text3)"><div style="font-size:40px;margin-bottom:12px">📋</div><div style="font-weight:700;margin-bottom:6px">لا توجد مهام</div><button class="btn btn-primary" onclick="openProjTaskModal(\''+proj.id+'\')"><i class="fa-solid fa-plus"></i> أضف مهمة</button></div>'
    :
    '<div style="overflow-x:auto;border-radius:14px;border:1px solid var(--border)">'+
    '<table style="width:100%;border-collapse:collapse;font-size:12px">'+
    '<thead><tr style="background:var(--surface2)">'+
      '<th style="padding:10px 14px;text-align:right;font-weight:800;color:var(--text3);border-bottom:1px solid var(--border)">اسم المهمة</th>'+
      '<th style="padding:10px 8px;text-align:center;font-weight:800;color:var(--text3);border-bottom:1px solid var(--border)">الحالة</th>'+
      '<th style="padding:10px 8px;text-align:center;font-weight:800;color:var(--text3);border-bottom:1px solid var(--border)">تاريخ الاستلام</th>'+
      '<th style="padding:10px 8px;text-align:center;font-weight:800;color:var(--text3);border-bottom:1px solid var(--border)">تاريخ التسليم</th>'+
      '<th style="padding:10px 8px;text-align:center;font-weight:800;color:var(--text3);border-bottom:1px solid var(--border)">المبلغ</th>'+
      '<th style="padding:10px 8px;text-align:center;font-weight:800;color:var(--text3);border-bottom:1px solid var(--border)">الدفع</th>'+
      '<th style="padding:10px 8px;text-align:center;font-weight:800;color:var(--text3);border-bottom:1px solid var(--border)">المسؤول</th>'+
      '<th style="padding:10px 8px;text-align:center;font-weight:800;color:var(--text3);border-bottom:1px solid var(--border);width:80px"></th>'+
    '</tr></thead>'+
    '<tbody>'+
    filtered.map(function(t,idx){
      var rowBg = idx%2===0?'var(--surface)':'var(--surface2)';
      var isDone = t.status==='done';
      return '<tr style="background:'+rowBg+';transition:background .15s;cursor:pointer" onclick="openProjTaskDetail('+t.id+','+proj.id+')">'+
        '<td style="padding:11px 14px;font-weight:700;border-bottom:1px solid var(--border);'+(isDone?'text-decoration:line-through;color:var(--text3)':'')+'">'+
          escapeHtml(t.title)+
          (t.desc?'<div style="font-size:10px;color:var(--text3);font-weight:400;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px">'+escapeHtml(t.desc)+'</div>':'') +
        '</td>'+
        '<td style="padding:11px 8px;text-align:center;border-bottom:1px solid var(--border)">'+
          '<select style="font-size:10px;font-weight:700;background:transparent;border:none;cursor:pointer;color:var(--text);text-align:center" '+
            'onclick="event.stopPropagation()" '+
            'onchange="event.stopPropagation();_changePtaskStatus('+t.id+','+proj.id+',this.value);this.blur()">'+
            allStatuses.map(function(s){return '<option value="'+s.id+'"'+(t.status===s.id?' selected':'')+'>'+escapeHtml(s.label)+'</option>';}).join('')+
          '</select>'+
          statusBadge(t.status)+
        '</td>'+
        '<td style="padding:11px 8px;text-align:center;color:var(--text3);border-bottom:1px solid var(--border)">'+(t.orderDate||'—')+'</td>'+
        '<td style="padding:11px 8px;text-align:center;border-bottom:1px solid var(--border);color:'+(t.deadline&&new Date(t.deadline)<new Date()&&!isDone?'#f76f7c':'var(--text3)')+'">'+(t.deadline||'—')+'</td>'+
        '<td style="padding:11px 8px;text-align:center;border-bottom:1px solid var(--border)">'+
          (t.value>0?'<span style="font-weight:900;color:#f7c948">'+t.value.toLocaleString()+' '+(t.currency||cur)+'</span>':'<span style="color:var(--text3)">—</span>')+
        '</td>'+
        '<td style="padding:11px 8px;text-align:center;border-bottom:1px solid var(--border)">'+
          payBadge(t)+
          (t.value>0&&!t.paymentCollected&&!isDone?'':'') +
          (t.value>0&&isDone&&!t.paymentCollected?'<div style="margin-top:4px"><button data-tid="'+t.id+'" data-pid="'+proj.id+'" onclick="event.stopPropagation();_askPtaskPayment(this.dataset.tid,this.dataset.pid)" class="btn btn-success btn-sm" style="font-size:9px;padding:2px 8px">💰 تحصيل</button></div>':'')+
        '</td>'+
        '<td style="padding:11px 8px;text-align:center;color:var(--text3);border-bottom:1px solid var(--border);font-size:11px">'+(t.assignee_name?escapeHtml(t.assignee_name):'—')+'</td>'+
        '<td style="padding:11px 8px;text-align:center;border-bottom:1px solid var(--border)" onclick="event.stopPropagation()">'+
          '<button data-tid="'+t.id+'" data-pid="'+proj.id+'" onclick="openProjTaskModal(this.dataset.pid,this.dataset.tid)" class="btn btn-ghost btn-sm" style="padding:3px 6px;font-size:11px"><i class="fa-solid fa-pen"></i></button>'+
          '<button data-tid="'+t.id+'" data-pid="'+proj.id+'" onclick="deleteProjTask(this.dataset.tid,this.dataset.pid)" class="btn btn-danger btn-sm" style="padding:3px 6px;font-size:11px;margin-right:2px"><i class="fa-solid fa-trash"></i></button>'+
        '</td>'+
      '</tr>';
    }).join('')+
    '</tbody>'+
    // Footer total
    (totalVal>0?'<tfoot><tr style="background:var(--surface2);border-top:2px solid var(--border)">'+
      '<td colspan="4" style="padding:10px 14px;font-weight:800;font-size:12px">الإجمالي</td>'+
      '<td style="padding:10px 8px;text-align:center;font-weight:900;color:#f7c948;font-size:13px">'+totalVal.toLocaleString()+' '+cur+'</td>'+
      '<td style="padding:10px 8px;text-align:center;font-weight:900;color:#4fd1a5;font-size:12px">'+collectedVal.toLocaleString()+' '+cur+' محصّل</td>'+
      '<td colspan="2"></td>'+
    '</tr></tfoot>':'')+
    '</table></div>') +
  '</div>';
}

// ── تغيير حالة مهمة المشروع من الجدول مباشرة ──
function _changePtaskStatus(taskId, projId, newStatus){
  var t=(S.project_tasks||[]).find(function(x){return String(x.id)===String(taskId);});
  if(!t) return;
  var prevDone = t.status==='done';
  t.status=newStatus;
  if(newStatus==='done'){
    // اطلب رابط المشروع إذا لم يكن موجوداً
    if(!prevDone){
      _askProjectLinkForTask(taskId, projId, function(){
        // بعد الرابط، اسأل التحصيل
        if(t.value>0 && !t.paymentCollected) _askPtaskPayment(taskId, projId);
      });
      lsSave(); cloudSave(S); renderProjectDetail();
      return;
    }
  } else {
    // إذا رجع من done => خلّي العميل يعرف إن في تعديل
    if(prevDone && newStatus==='revision'){
      _notifyClientRevision(t);
    }
  }
  // سؤال التحصيل لما يتحول لمكتمل
  if(newStatus==='done' && !prevDone && t.value>0 && !t.paymentCollected){
    _askPtaskPayment(taskId, projId);
  }
  lsSave(); cloudSave(S); renderProjectDetail();
}

// ── اطلب رابط المشروع عند الإكمال ──
function _askProjectLinkForTask(taskId, projId, afterCb){
  var t=(S.project_tasks||[]).find(function(x){return String(x.id)===String(taskId);});
  if(!t) { if(afterCb) afterCb(); return; }
  var ov=document.createElement('div');
  ov.className='modal-overlay';
  ov.style.cssText='display:flex;align-items:center;justify-content:center;z-index:10000';
  ov.innerHTML='<div class="modal" style="width:min(420px,92vw);border-radius:18px;padding:28px">'
    +'<div style="font-size:36px;text-align:center;margin-bottom:10px">🔗</div>'
    +'<div style="font-size:16px;font-weight:900;text-align:center;margin-bottom:6px">رابط تسليم المشروع</div>'
    +'<div style="font-size:13px;color:var(--text3);text-align:center;margin-bottom:18px">المهمة: <strong>'+escapeHtml(t.title)+'</strong></div>'
    +'<input id="_proj-link-input" class="form-input" placeholder="https://drive.google.com/... أو أي رابط للتسليم" value="'+escapeHtml(t.projectLink||t.driveLink||'')+'"/>'
    +'<div style="font-size:11px;color:var(--text3);margin-top:8px;text-align:center">سيظهر هذا الرابط للعميل في بوابته لاستلام المشروع</div>'
    +'<div style="display:flex;gap:10px;margin-top:18px">'
      +'<button data-tid="'+taskId+'" data-pid="'+(projId||'')+'" onclick="_saveProjectLink(this.dataset.tid,this.dataset.pid);this.closest(\'.modal-overlay\').remove();'+( afterCb ? '(_askProjectLinkCb_'+taskId+')&&(_askProjectLinkCb_'+taskId+')()' : '')+'" class="btn btn-primary" style="flex:1"><i class="fa-solid fa-floppy-disk"></i> حفظ الرابط</button>'
      +'<button onclick="this.closest(\'.modal-overlay\').remove();'+( afterCb ? '(_askProjectLinkCb_'+taskId+')&&(_askProjectLinkCb_'+taskId+')()' : '')+'" class="btn btn-ghost">تخطي</button>'
    +'</div>'
  +'</div>';
  if(afterCb) window['_askProjectLinkCb_'+taskId] = afterCb;
  document.body.appendChild(ov);
  ov.addEventListener('click',function(e){if(e.target===ov){ ov.remove(); if(afterCb) afterCb(); }});
  setTimeout(function(){var inp=document.getElementById('_proj-link-input');if(inp)inp.focus();},100);
}

function _saveProjectLink(taskId, projId){
  var t=(S.project_tasks||[]).find(function(x){return String(x.id)===String(taskId);});
  if(!t) return;
  var inp=document.getElementById('_proj-link-input');
  if(inp) {
    t.projectLink = inp.value.trim();
    t.driveLink   = t.projectLink;
  }
  lsSave(); cloudSave(S);
  if(projId) renderProjectDetail();
  toast('<i class="fa-solid fa-link" style="color:var(--accent3)"></i> تم حفظ رابط المشروع');
}

// ── إشعار العميل بتعديل (داخلي - تغيير الحالة للتعديلات) ──
function _notifyClientRevision(task){
  // This is handled on the client portal side — just a visual cue
  toast('<i class="fa-solid fa-pencil" style="color:#f97316"></i> تم تحويل المهمة لحالة تعديلات');
}

// ── استلام العميل للمشروع من بوابة العميل — يُستدعى من client-portal ──
// يتم التعامل معها عبر Supabase realtime sync
function _markTaskClientReceived(taskId, projId){
  var t=(S.project_tasks||[]).find(function(x){return String(x.id)===String(taskId);});
  if(!t) return;
  t.clientReceived = true;
  t.clientReceivedAt = new Date().toISOString();
  lsSave(); cloudSave(S);
  if(projId) renderProjectDetail();
  showMiniNotif('<i class="fa-solid fa-handshake" style="color:var(--accent3)"></i> العميل استلم المشروع — تم التأكيد!');
}

// ── طلب تعديل من العميل — تُحوّل المهمة لحالة revision ──
function _markTaskClientRevision(taskId, projId, revisionNote){
  var t=(S.project_tasks||[]).find(function(x){return String(x.id)===String(taskId);});
  if(!t) return;
  var prevStatus = t.status;
  t.status = 'revision';
  t.done   = false;
  t.clientRevisionNote = revisionNote||'';
  t.clientRevisionAt   = new Date().toISOString();
  t.clientReceived     = false;
  // إذا كان فيه عضو فريق منفذ — نحدّث في بياناته كمان
  if(t.assignee_id && t.assignee_name){
    // تحديث حالة التاسك في الفريق
    _updateTeamMemberTaskStatus(t.assignee_id, taskId, 'revision', revisionNote);
  }
  lsSave(); cloudSave(S);
  showMiniNotif('<i class="fa-solid fa-rotate-left" style="color:#f97316"></i> العميل طلب تعديل على: '+escapeHtml(t.title));
}

function _updateTeamMemberTaskStatus(assigneeId, taskId, newStatus, note){
  // تحديث بيانات الفريق إن كان التاسك مرتبط بعضو
  (S.teams||[]).forEach(function(team){
    (team.tasks||[]).forEach(function(tt){
      if(String(tt.id)===String(taskId)||String(tt.linkedTaskId)===String(taskId)){
        tt.status = newStatus;
        if(note) tt.revisionNote = note;
      }
    });
    (team.members||[]).forEach(function(mem){
      (mem.tasks||[]).forEach(function(tt){
        if(String(tt.id)===String(taskId)||String(tt.linkedTaskId)===String(taskId)||String(mem.id)===String(assigneeId)){
          if(String(tt.id)===String(taskId)||String(tt.linkedTaskId)===String(taskId)){
            tt.status = newStatus;
            if(note) tt.revisionNote = note;
          }
        }
      });
    });
  });
}

function _askPtaskPayment(taskId, projId){
  var t=(S.project_tasks||[]).find(function(x){return String(x.id)===String(taskId);});
  if(!t||t.paymentCollected) return;
  var proj=_getProjById(projId);
  var cur = t.currency||(proj?proj.budgetCurrency||'ج.م':'ج.م');

  // إنشاء overlay سؤال
  var ov=document.createElement('div');
  ov.className='modal-overlay'; ov.style.cssText='display:flex;align-items:center;justify-content:center;z-index:10000';
  var projType = proj && proj.projectType === 'team' ? 'expense' : 'income';
  var qText = projType==='expense' ? 'هل دفعت للعضو المسؤول؟' : 'هل حصلت على المبلغ من العميل؟';
  ov.innerHTML='<div class="modal" style="width:min(380px,92vw);border-radius:18px;padding:24px;text-align:center">'+
    '<div style="font-size:36px;margin-bottom:10px">💰</div>'+
    '<div style="font-size:16px;font-weight:900;margin-bottom:6px">'+qText+'</div>'+
    '<div style="font-size:13px;color:var(--text3);margin-bottom:20px">المهمة: <strong>'+escapeHtml(t.title)+'</strong> · المبلغ: <strong style="color:#f7c948">'+t.value.toLocaleString()+' '+cur+'</strong></div>'+
    '<div style="display:flex;gap:10px;justify-content:center">'+
      '<button data-tid="'+taskId+'" data-pid="'+projId+'" onclick="_confirmPtaskPayment(this.dataset.tid,this.dataset.pid,true);this.closest(\'.modal-overlay\').remove()" class="btn btn-success" style="flex:1">✅ نعم، تم</button>'+
      '<button onclick="this.closest(\'.modal-overlay\').remove()" class="btn btn-ghost" style="flex:1">لا، لاحقاً</button>'+
    '</div>'+
  '</div>';
  document.body.appendChild(ov);
  ov.addEventListener('click',function(e){if(e.target===ov)ov.remove();});
}

function _confirmPtaskPayment(taskId, projId, confirmed){
  var t=(S.project_tasks||[]).find(function(x){return String(x.id)===String(taskId);});
  if(!t||!confirmed) return;
  var proj=_getProjById(projId);
  var cur = t.currency||(proj?proj.budgetCurrency||'ج.م':'ج.م');
  t.paymentCollected=true; t.paymentStatus='collected';
  // تسجيل في المالية
  if(!S.transactions) S.transactions=[];
  var alreadyLinked=S.transactions.some(tr=>String(tr.linkedProjTaskId)===String(t.id)&&tr.type==='income');
  if(!alreadyLinked && t.value>0){
    S.transactions.push({id:Date.now()+Math.random(),type:'income',amount:t.value,currency:cur,
      desc:'مهمة: '+(t.title||'')+(proj?' — مشروع: '+proj.name:''),
      date:new Date().toISOString().slice(0,10),isoDate:new Date().toISOString().slice(0,10),
      linkedProjTaskId:t.id,project_id:proj?String(proj.id):'',project_name:proj?proj.name:'',
      source:'project_task',createdAt:new Date().toISOString()});
  }
  lsSave(); cloudSave(S); renderProjectDetail();
  toast('✅ تم تسجيل التحصيل في المالية');
  if(typeof renderFinance==='function') setTimeout(renderFinance,200);
}

// ══════════════════════════════════════
// PROJECT FINANCE TAB
// ══════════════════════════════════════
function renderProjFinanceTab(proj, tasks, clr) {
  var cur = proj.budgetCurrency || 'ج.م';
  var budget = proj.budget || 0;
  
  // Calculate from tasks
  var totalCost   = tasks.reduce(function(s,t){ return s + (t.value||0); }, 0);
  var collected   = tasks.filter(function(t){ return t.paymentCollected||t.paymentStatus==='collected'; })
                         .reduce(function(s,t){ return s + (t.value||0); }, 0);
  var deposits    = tasks.filter(function(t){ return t.paymentStatus==='deposit'||t.deposit>0; })
                         .reduce(function(s,t){ return s + (t.deposit||0); }, 0);
  var pending     = totalCost - collected;
  var profit      = budget > 0 ? (budget - totalCost) : 0;
  var spent_pct   = budget > 0 ? Math.min(100, Math.round(totalCost/budget*100)) : 0;
  
  // Project transactions from global S.transactions linked to this project
  var projTrans   = (S.transactions||[]).filter(function(tr){
    // Direct project link (new method)
    if(tr.project_id && String(tr.project_id) === String(proj.id)) return true;
    // Legacy link via project task
    if(tr.linkedProjTaskId && tasks.some(function(t){ return String(tr.linkedProjTaskId) === String(t.id); })) return true;
    // Legacy link via project name in desc (only if auto-recorded)
    if(tr.source === 'project_task' && tr.desc && tr.desc.indexOf(proj.name) >= 0) return true;
    return false;
  });

  var budgetColor = profit >= 0 ? '#4fd1a5' : '#f76f7c';
  
  return '<div>' +
  // ── Summary Cards ──
  '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:20px">' +
    _projFinCard('الميزانية الكلية', budget>0?(budget.toLocaleString()+' '+cur):('لم تُحدد'), clr, 'fa-bullseye') +
    _projFinCard('إجمالي التكاليف', totalCost.toLocaleString()+' '+cur, '#f7c948', 'fa-coins') +
    _projFinCard('المحصّل', collected.toLocaleString()+' '+cur, '#4fd1a5', 'fa-circle-check') +
    _projFinCard('المتبقي', pending.toLocaleString()+' '+cur, '#f97316', 'fa-clock') +
    (budget>0 ? _projFinCard('الربح/الخسارة', (profit>=0?'+':'')+profit.toLocaleString()+' '+cur, budgetColor, 'fa-chart-line') : '') +
    (deposits>0 ? _projFinCard('عربونات مدفوعة', deposits.toLocaleString()+' '+cur, '#a78bfa', 'fa-hand-holding-dollar') : '') +
  '</div>' +
  
  // ── Budget Progress ──
  (budget>0 ? '<div class="card" style="padding:16px;margin-bottom:16px">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">' +
      '<div style="font-size:13px;font-weight:800"><i class="fa-solid fa-chart-bar" style="color:'+clr+'"></i> استهلاك الميزانية</div>' +
      '<div style="font-size:12px;font-weight:700;color:'+(spent_pct>90?'#f76f7c':spent_pct>70?'#f7c948':'#4fd1a5')+'">'+spent_pct+'%</div>' +
    '</div>' +
    '<div style="height:12px;background:var(--surface3);border-radius:6px;overflow:hidden;margin-bottom:8px">' +
      '<div style="height:100%;width:'+spent_pct+'%;background:'+(spent_pct>90?'#f76f7c':spent_pct>70?'#f7c948':clr)+';border-radius:6px;transition:.5s"></div>' +
    '</div>' +
    '<div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text3)">' +
      '<span>المصروف: <strong style="color:var(--text)">'+totalCost.toLocaleString()+' '+cur+'</strong></span>' +
      '<span>الميزانية: <strong style="color:var(--text)">'+budget.toLocaleString()+' '+cur+'</strong></span>' +
    '</div>' +
  '</div>' : '') +
  
  // ── Tasks Financial Breakdown ──
  '<div class="card" style="padding:16px;margin-bottom:16px">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">' +
      '<div style="font-size:13px;font-weight:800"><i class="fa-solid fa-list-check" style="color:'+clr+'"></i> مالية المهام</div>' +
      '<button class="btn btn-primary btn-sm" onclick="openProjTaskModal('+proj.id+')"><i class="fa-solid fa-plus"></i> مهمة جديدة</button>' +
    '</div>' +
    (tasks.filter(function(t){return t.value>0;}).length === 0 ?
      '<div style="text-align:center;padding:24px;color:var(--text3);font-size:13px"><i class="fa-solid fa-coins" style="font-size:28px;opacity:.3;display:block;margin-bottom:8px"></i>لا توجد مهام بقيمة مالية بعد</div>' :
    '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px">' +
    '<thead><tr style="border-bottom:1px solid var(--border)">' +
      '<th style="text-align:right;padding:8px 6px;color:var(--text3);font-weight:700">المهمة</th>' +
      '<th style="text-align:right;padding:8px 6px;color:var(--text3);font-weight:700">المسؤول</th>' +
      '<th style="text-align:center;padding:8px 6px;color:var(--text3);font-weight:700">القيمة</th>' +
      '<th style="text-align:center;padding:8px 6px;color:var(--text3);font-weight:700">العربون</th>' +
      '<th style="text-align:center;padding:8px 6px;color:var(--text3);font-weight:700">الحالة</th>' +
      '<th style="text-align:center;padding:8px 6px;color:var(--text3);font-weight:700">الدفع</th>' +
    '</tr></thead>' +
    '<tbody>' +
    tasks.filter(function(t){return t.value>0;}).map(function(t){
      var st = _getTaskStatusInfo(t.status||'todo');
      var payColor = (t.paymentCollected||t.paymentStatus==='collected') ? '#4fd1a5' : (t.paymentStatus==='deposit'||t.deposit>0) ? '#a78bfa' : '#f7c948';
      var payLabel = (t.paymentCollected||t.paymentStatus==='collected') ? '✅ محصّل' : (t.paymentStatus==='deposit'||t.deposit>0) ? ('🟣 عربون: '+(t.deposit||0)) : '⏳ معلق';
      return '<tr style="border-bottom:1px solid var(--border);cursor:pointer" onclick="openProjTaskDetail('+t.id+','+proj.id+')">'+
        '<td style="padding:10px 6px;font-weight:700">'+escapeHtml(t.title)+'</td>'+
        '<td style="padding:10px 6px;color:var(--text3)">'+escapeHtml(t.assignee_name||'—')+'</td>'+
        '<td style="padding:10px 6px;text-align:center;font-weight:800;color:#f7c948">'+t.value.toLocaleString()+' '+(t.currency||cur)+'</td>'+
        '<td style="padding:10px 6px;text-align:center;color:#a78bfa">'+((t.deposit>0)?t.deposit.toLocaleString()+' '+(t.currency||cur):'—')+'</td>'+
        '<td style="padding:10px 6px;text-align:center"><span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:8px;background:'+st.bg+';color:'+st.color+'">'+st.label+'</span></td>'+
        '<td style="padding:10px 6px;text-align:center">'+
          '<span style="font-size:10px;font-weight:700;color:'+payColor+'">'+payLabel+'</span>'+
          (!t.paymentCollected&&t.status==='done'?' <button data-tid="'+t.id+'" onclick="event.stopPropagation();markTaskPaymentCollected(this.dataset.tid)" class="btn btn-success btn-sm" style="font-size:9px;padding:1px 6px;margin-right:4px">تحصيل</button>':'') +
        '</td>'+
      '</tr>';
    }).join('') +
    '</tbody></table>' +
    '<div style="padding:10px 6px;border-top:2px solid var(--border);display:flex;gap:24px;font-size:12px;font-weight:800">' +
      '<span style="color:var(--text3)">الإجمالي: <span style="color:#f7c948">'+totalCost.toLocaleString()+' '+cur+'</span></span>' +
      '<span style="color:var(--text3)">المحصّل: <span style="color:#4fd1a5">'+collected.toLocaleString()+' '+cur+'</span></span>' +
      '<span style="color:var(--text3)">المتبقي: <span style="color:#f97316">'+pending.toLocaleString()+' '+cur+'</span></span>' +
    '</div>' +
    '</div>') +
  '</div>' +
  
  // ── Linked Transactions from Finance ──
  '<div class="card" style="padding:16px">' +
    '<div style="font-size:13px;font-weight:800;margin-bottom:12px"><i class="fa-solid fa-arrows-left-right" style="color:'+clr+'"></i> معاملات مالية مرتبطة</div>' +
    (projTrans.length === 0 ?
      '<div style="text-align:center;padding:20px;color:var(--text3);font-size:12px"><i class="fa-solid fa-receipt" style="font-size:24px;opacity:.3;display:block;margin-bottom:8px"></i>لا توجد معاملات مرتبطة بهذا المشروع بعد</div>' :
    '<div style="display:flex;flex-direction:column;gap:8px">' +
    projTrans.map(function(tr){
      var isInc = tr.type==='income';
      return '<div style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--surface2);border-radius:8px;border-right:3px solid '+(isInc?'#4fd1a5':'#f76f7c')+'">'+
        '<div style="width:30px;height:30px;border-radius:50%;background:'+(isInc?'rgba(79,209,165,.15)':'rgba(247,111,124,.15)')+';color:'+(isInc?'#4fd1a5':'#f76f7c')+';display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:13px">'+
          '<i class="fa-solid '+(isInc?'fa-arrow-up':'fa-arrow-down')+'"></i></div>'+
        '<div style="flex:1;min-width:0">'+
          '<div style="font-size:12px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+escapeHtml(tr.desc||'معاملة')+'</div>'+
          '<div style="font-size:10px;color:var(--text3)">'+((tr.date||'').slice(0,10))+'</div>'+
        '</div>'+
        '<div style="font-size:13px;font-weight:900;color:'+(isInc?'#4fd1a5':'#f76f7c')+';text-align:left">'+
          (isInc?'+':'-')+((tr.amount||0).toLocaleString())+' '+(tr.currency||cur)+'</div>'+
      '</div>';
    }).join('') + '</div>') +
    '<div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">' +
      '<button class="btn btn-primary btn-sm" onclick="openProjIncomeModal('+proj.id+')"><i class="fa-solid fa-plus"></i> تسجيل دخل للمشروع</button>' +
      '<button class="btn btn-ghost btn-sm" onclick="openProjExpenseModal('+proj.id+')"><i class="fa-solid fa-minus"></i> تسجيل مصروف</button>' +
      '<button class="btn btn-ghost btn-sm" onclick="openNewInvoiceForProject('+proj.id+')"><i class="fa-solid fa-file-invoice"></i> إنشاء فاتورة</button>' +
    '</div>' +

  '</div>' +
  '</div>';
}

function _projFinCard(label, value, color, icon) {
  return '<div class="card" style="padding:14px;text-align:center">'+
    '<div style="font-size:18px;color:'+color+';margin-bottom:6px"><i class="fa-solid '+icon+'"></i></div>'+
    '<div style="font-size:15px;font-weight:900;color:var(--text);line-height:1">'+value+'</div>'+
    '<div style="font-size:10px;color:var(--text3);margin-top:4px">'+label+'</div>'+
  '</div>';
}

// ── Project Finance Helpers ──
function openProjIncomeModal(projId) {
  var proj = _getProjById(projId); if(!proj) return;
  var client = proj.client_id ? (S.clients||[]).find(c=>String(c.id)===String(proj.client_id)) : null;
  openIncomeModal();
  setTimeout(function(){
    // Set client
    if(client) {
      var srcSel = document.getElementById('in-source');
      if(srcSel) { srcSel.value = client.name; onIncomeClientChange(client.name); }
    }
    // Set project
    setTimeout(function(){
      _fillOpenIncomeProject(projId);
      // Set description
      var descEl = document.getElementById('in-desc');
      if(descEl && !descEl.value) descEl.value = 'دفعة مشروع: ' + proj.name;
    }, 80);
  }, 30);
}

function openProjExpenseModal(projId) {
  var proj = _getProjById(projId); if(!proj) return;
  openExpenseModal();
  setTimeout(function(){
    var descEl = document.getElementById('ex-desc');
    if(descEl) descEl.value = 'مصروف مشروع: ' + proj.name;
  }, 30);
}

function openNewInvoiceForProject(projId) {
  var proj = _getProjById(projId); if(!proj) return;
  var client = proj.client_id ? (S.clients||[]).find(c=>String(c.id)===String(proj.client_id)) : null;
  // Build pending tasks amount
  var tasks = _getProjTasks(projId);
  var pending = tasks.filter(function(t){ return t.value>0 && !t.paymentCollected; });
  var totalPending = pending.reduce(function(s,t){ return s + (t.value||0); }, 0);
  // Open invoices page and open new invoice modal with prefilled data
  showPage('invoices');
  setTimeout(function(){
    if(typeof openInvoiceModal === 'function') {
      openInvoiceModal();
      setTimeout(function(){
        // Set client
        if(client) {
          var cSel = document.getElementById('inv-client');
          if(cSel) cSel.value = String(client.id);
        }
        // Set amount from pending tasks
        var amtEl = document.getElementById('inv-amount') || document.getElementById('inv-total');
        if(amtEl && totalPending > 0) amtEl.value = totalPending;
        // Set description
        var descEl = document.getElementById('inv-desc') || document.getElementById('inv-notes');
        if(descEl) descEl.value = 'فاتورة مشروع: ' + proj.name + (pending.length ? ' (' + pending.length + ' مهمة)' : '');
        // Store project_id for save
        window._pendingInvoiceProjectId = String(projId);
        window._pendingInvoiceProjectName = proj.name;
        toast('<i class="fa-solid fa-file-invoice" style="color:var(--accent)"></i> تم فتح فاتورة جديدة لمشروع ' + escapeHtml(proj.name));
      }, 100);
    }
  }, 400);
}

// ── Overview Table for آخر المهام in project detail overview tab ──
function renderProjTasksOverviewTable(tasks, proj, clr){
  var customStatuses = S.customStatuses || [];
  var baseStatuses = [
    {id:'todo',     label:'جديد',         color:'#64b5f6'},
    {id:'progress', label:'قيد التنفيذ',  color:'#f7c948'},
    {id:'review',   label:'مراجعة',       color:'#a78bfa'},
    {id:'revision', label:'تعديلات',      color:'#f97316'},
    {id:'hold',     label:'موقوف',        color:'#888888'},
    {id:'done',     label:'مكتمل',        color:'#4fd1a5'}
  ];
  var allStatuses = [...baseStatuses, ...customStatuses.filter(function(cs){return cs.id&&cs.label;})];
  var cur = proj.budgetCurrency||'ج.م';

  function stBadge(t){
    var info = allStatuses.find(function(s){return s.id===t.status;});
    if(!info) info={label:t.status||'—',color:'#888'};
    var opts = allStatuses.map(function(s){
      return '<option value="'+s.id+'"'+(t.status===s.id?' selected':'')+'>'+s.label+'</option>';
    }).join('');
    return '<div style="position:relative;display:inline-block" onclick="event.stopPropagation()">'
      +'<select data-tid="'+t.id+'" data-pid="'+proj.id+'" '
        +'onchange="event.stopPropagation();_changePtaskStatus(this.dataset.tid,this.dataset.pid,this.value)" '
        +'onclick="event.stopPropagation()" '
        +'title="اضغط لتغيير الحالة" '
        +'style="appearance:none;-webkit-appearance:none;font-size:10px;font-weight:800;padding:3px 24px 3px 10px;border-radius:20px;background:'+info.color+'22;color:'+info.color+';border:1.5px solid '+info.color+'55;cursor:pointer;outline:none;font-family:var(--font);min-width:80px">'
        +opts
      +'</select>'
      +'<span style="position:absolute;left:7px;top:50%;transform:translateY(-50%);pointer-events:none;font-size:8px;color:'+info.color+'">▾</span>'
    +'</div>';
  }

  return '<div style="overflow-x:auto;border-radius:12px;border:1px solid var(--border)">'
    +'<table style="width:100%;border-collapse:collapse;font-size:12px">'
    +'<thead><tr style="background:var(--surface2)">'
      +'<th style="padding:9px 12px;text-align:right;font-weight:800;color:var(--text3);border-bottom:1px solid var(--border)">المهمة</th>'
      +'<th style="padding:9px 8px;text-align:center;font-weight:800;color:var(--text3);border-bottom:1px solid var(--border)">الحالة</th>'
      +'<th style="padding:9px 8px;text-align:center;font-weight:800;color:var(--text3);border-bottom:1px solid var(--border)">التاريخ</th>'
      +'<th style="padding:9px 8px;text-align:center;font-weight:800;color:var(--text3);border-bottom:1px solid var(--border)">الديدلاين</th>'
      +'<th style="padding:9px 8px;text-align:center;font-weight:800;color:var(--text3);border-bottom:1px solid var(--border)">المبلغ</th>'
      +'<th style="padding:9px 8px;text-align:center;font-weight:800;color:var(--text3);border-bottom:1px solid var(--border)">المنفذ</th>'
      +'<th style="padding:9px 8px;text-align:center;font-weight:800;color:var(--text3);border-bottom:1px solid var(--border)">ملاحظة</th>'
    +'</tr></thead>'
    +'<tbody>'
    +tasks.map(function(t, idx){
      var isDone = t.status==='done';
      var isLate = t.deadline && new Date(t.deadline)<new Date() && !isDone;
      var rowBg = idx%2===0?'var(--surface)':'var(--surface2)';
      var projLink = t.projectLink||t.driveLink||'';
      return '<tr style="background:'+rowBg+';cursor:pointer;transition:background .15s" onclick="openProjTaskDetail('+t.id+','+proj.id+')">'
        +'<td style="padding:10px 12px;font-weight:700;border-bottom:1px solid var(--border);max-width:180px">'
          +'<div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;'+(isDone?'text-decoration:line-through;color:var(--text3)':'')+'">'+escapeHtml(t.title)+'</div>'
          +(t.clientReceived?'<div style="font-size:9px;color:#4fd1a5;font-weight:700;margin-top:1px"><i class="fa-solid fa-handshake"></i> استلم العميل</div>':'')
          +(t.clientRevisionNote?'<div style="font-size:9px;color:#f97316;font-weight:700;margin-top:1px"><i class="fa-solid fa-rotate-left"></i> طلب تعديل</div>':'')
          +(t.desc?'<div style="font-size:10px;color:var(--text3);font-weight:400;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:170px">'+escapeHtml(t.desc)+'</div>':'')
        +'</td>'
        +'<td style="padding:10px 8px;text-align:center;border-bottom:1px solid var(--border)">'+stBadge(t)+'</td>'
        +'<td style="padding:10px 8px;text-align:center;color:var(--text3);border-bottom:1px solid var(--border);font-size:11px;font-family:var(--mono)">'+(t.orderDate||t.createdAt&&t.createdAt.slice(0,10)||'—')+'</td>'
        +'<td style="padding:10px 8px;text-align:center;border-bottom:1px solid var(--border);font-size:11px;font-family:var(--mono);color:'+(isLate?'#f76f7c':'var(--text3)')+'"><span title="'+(isLate?'متأخرة':'')+'">'+(t.deadline||'—')+'</span></td>'
        +'<td style="padding:10px 8px;text-align:center;border-bottom:1px solid var(--border)">'
          +(t.value>0?'<span style="font-weight:900;color:#f7c948">'+t.value.toLocaleString()+' '+(t.currency||cur)+'</span>':'<span style="color:var(--text3)">—</span>')
        +'</td>'
        +'<td style="padding:10px 8px;text-align:center;color:var(--text3);border-bottom:1px solid var(--border);font-size:11px">'
          +(t.assignee_name?'<span style="display:flex;align-items:center;gap:4px;justify-content:center"><i class="fa-solid fa-user" style="color:'+clr+';font-size:10px"></i>'+escapeHtml(t.assignee_name)+'</span>':'—')
        +'</td>'
        +'<td style="padding:10px 8px;text-align:center;border-bottom:1px solid var(--border)" onclick="event.stopPropagation()">'
          +'<button data-tid="'+t.id+'" data-pid="'+proj.id+'" onclick="_openTaskNotePopup(this.dataset.tid,this.dataset.pid)" class="btn btn-ghost btn-sm" style="font-size:10px;padding:3px 8px;color:var(--accent)" title="أضف ملاحظة">'
            +(t.taskNote?'<i class="fa-solid fa-comment-dots" style="color:var(--accent)"></i>':'<i class="fa-regular fa-comment"></i>')
          +'</button>'
          +(isDone&&projLink?'<a href="'+escapeHtml(projLink)+'" target="_blank" onclick="event.stopPropagation()" title="رابط المشروع" style="font-size:10px;padding:3px 8px;color:var(--accent3);display:inline-flex;align-items:center;gap:3px"><i class="fa-solid fa-link"></i></a>':'')
        +'</td>'
      +'</tr>';
    }).join('')
    +'</tbody>'
    +'</table></div>';
}

// ── Task Note Popup ──
function _openTaskNotePopup(taskId, projId){
  var t=(S.project_tasks||[]).find(function(x){return String(x.id)===String(taskId);});
  if(!t) return;
  var ov=document.createElement('div');
  ov.className='modal-overlay';
  ov.style.cssText='display:flex;align-items:center;justify-content:center;z-index:10000';
  ov.innerHTML='<div class="modal" style="width:min(420px,92vw);border-radius:18px;padding:24px">'
    +'<div style="font-size:15px;font-weight:800;margin-bottom:4px"><i class="fa-solid fa-comment" style="color:var(--accent)"></i> ملاحظة على المهمة</div>'
    +'<div style="font-size:12px;color:var(--text3);margin-bottom:14px">'+escapeHtml(t.title)+'</div>'
    +'<textarea id="_task-note-ta" rows="4" style="width:100%;padding:10px 14px;background:var(--surface2);border:1px solid var(--border);border-radius:10px;font-size:13px;color:var(--text);resize:none;font-family:var(--font);box-sizing:border-box" placeholder="أضف ملاحظتك هنا...">'+escapeHtml(t.taskNote||'')+'</textarea>'
    +'<div style="display:flex;gap:10px;margin-top:14px">'
      +'<button data-tid="'+taskId+'" data-pid="'+projId+'" onclick="_saveTaskNote(this.dataset.tid,this.dataset.pid);this.closest(\'.modal-overlay\').remove()" class="btn btn-primary" style="flex:1"><i class="fa-solid fa-floppy-disk"></i> حفظ</button>'
      +'<button onclick="this.closest(\'.modal-overlay\').remove()" class="btn btn-ghost">إلغاء</button>'
    +'</div>'
  +'</div>';
  document.body.appendChild(ov);
  ov.addEventListener('click',function(e){if(e.target===ov)ov.remove();});
  setTimeout(function(){var ta=document.getElementById('_task-note-ta');if(ta)ta.focus();},100);
}

function _saveTaskNote(taskId, projId){
  var t=(S.project_tasks||[]).find(function(x){return String(x.id)===String(taskId);});
  if(!t) return;
  var ta=document.getElementById('_task-note-ta');
  if(ta) t.taskNote = ta.value.trim();
  lsSave(); cloudSave(S); renderProjectDetail();
  toast('<i class="fa-solid fa-check" style="color:var(--accent3)"></i> تم حفظ الملاحظة');
}

function renderProjTaskRow(t,clr){
  var pri=_getPriorityInfo(t.priority||'normal');
  var st=_getTaskStatusInfo(t.status||'todo');
  var steps=t.steps||[];
  var doneSteps=steps.filter(function(s){return s.done;}).length;
  var stepPct=steps.length?Math.round(doneSteps/steps.length*100):(t.status==='done'?100:0);
  var priColors={high:'#f76f7c',normal:'#f7c948',low:'#4fd1a5'};
  var priC=priColors[t.priority||'normal']||'#888';
  var payColor=(t.paymentCollected||t.paymentStatus==='collected')?'#4fd1a5':(t.deposit>0||t.paymentStatus==='deposit')?'#a78bfa':'#f97316';
  var payLabel=(t.paymentCollected||t.paymentStatus==='collected')?'محصّل':(t.deposit>0||t.paymentStatus==='deposit')?'عربون':'معلق';

  return '<div style="background:var(--surface2);border:1px solid var(--border);border-radius:12px;margin-bottom:10px;overflow:hidden;cursor:pointer;transition:border-color .18s" onclick="openProjTaskDetail('+t.id+','+t.project_id+')">' +
    '<div style="height:3px;background:'+clr+'"></div>' +
    '<div style="padding:12px 14px">' +
      '<div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:8px">' +
        '<input type="checkbox" '+(t.status==='done'?'checked':'')+' onclick="event.stopPropagation()" onchange="event.stopPropagation();toggleProjTaskDone('+JSON.stringify(String(t.id))+','+JSON.stringify(String(t.project_id))+',this.checked)" style="width:16px;height:16px;cursor:pointer;accent-color:'+clr+';flex-shrink:0;margin-top:2px">' +
        '<div style="flex:1;min-width:0">' +
          '<div style="font-size:13px;font-weight:800;line-height:1.4;'+(t.status==='done'?'text-decoration:line-through;color:var(--text3)':'')+'">' + escapeHtml(t.title) + '</div>' +
        '</div>' +
        '<span style="font-size:9px;font-weight:800;padding:3px 8px;border-radius:8px;background:'+priC+'18;color:'+priC+';border:1px solid '+priC+'33;white-space:nowrap;flex-shrink:0">'+pri.label+'</span>' +
      '</div>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-bottom:'+(t.value>0||steps.length?'8':'0')+'px">' +
        '<span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:8px;background:'+st.bg+';color:'+st.color+'">'+st.label+'</span>' +
        (t.assignee_name?'<span style="font-size:10px;background:rgba(255,255,255,.06);border:1px solid var(--border);border-radius:8px;padding:2px 8px;color:var(--text3)"><i class="fa-solid fa-user" style="color:'+clr+';margin-left:4px"></i>'+escapeHtml(t.assignee_name)+'</span>':'') +
        (t.deadline?'<span style="font-size:10px;background:rgba(255,255,255,.06);border:1px solid var(--border);border-radius:8px;padding:2px 8px;color:var(--text3)"><i class="fa-solid fa-calendar" style="margin-left:4px"></i>'+t.deadline+'</span>':'') +
        (steps.length?'<span style="font-size:10px;background:rgba(255,255,255,.06);border:1px solid var(--border);border-radius:8px;padding:2px 8px;color:var(--text3)">'+doneSteps+'/'+steps.length+' خطوة</span>':'') +
      '</div>' +
      (t.value>0?
        '<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--surface3);border-radius:8px;margin-bottom:4px">' +
          '<i class="fa-solid fa-coins" style="color:#f7c948;font-size:12px"></i>' +
          '<span style="font-size:12px;font-weight:900;color:#f7c948">'+t.value.toLocaleString()+' '+(t.currency||'ج.م')+'</span>' +
          (t.deposit>0?'<span style="font-size:10px;color:#a78bfa"> · عربون: '+t.deposit.toLocaleString()+'</span>':'') +
          '<div style="flex:1"></div>' +
          '<span style="font-size:10px;font-weight:800;color:'+payColor+'">● '+payLabel+'</span>' +
          (t.value>0&&t.status==='done'&&!t.paymentCollected?'<button data-tid="'+t.id+'" onclick="event.stopPropagation();markTaskPaymentCollected(this.dataset.tid)" class="btn btn-success btn-sm" style="padding:2px 8px;font-size:10px;margin-right:6px">✓ تحصيل</button>':'') +
        '</div>' : '') +
      (steps.length?
        '<div style="margin-top:6px"><div style="height:4px;background:var(--surface3);border-radius:2px;overflow:hidden"><div style="height:100%;width:'+stepPct+'%;background:'+clr+';border-radius:2px;transition:.4s"></div></div></div>' : '') +
    '</div>' +
    '<div style="display:flex;gap:4px;padding:6px 14px;border-top:1px solid var(--border);background:rgba(0,0,0,.1)" onclick="event.stopPropagation()">' +
      '<button data-tid="'+t.id+'" data-pid="'+t.project_id+'" onclick="openProjTaskModal(this.dataset.pid,this.dataset.tid)" class="btn btn-ghost btn-sm" style="font-size:10px;padding:3px 8px"><i class="fa-solid fa-pen"></i> تعديل</button>' +
      '<button data-tid="'+t.id+'" data-pid="'+t.project_id+'" onclick="deleteProjTask(this.dataset.tid,this.dataset.pid)" class="btn btn-danger btn-sm" style="font-size:10px;padding:3px 8px"><i class="fa-solid fa-trash"></i></button>' +
    '</div>' +
  '</div>';
}


function renderProjKanban(proj,tasks,clr){
  var cols=[
    {id:'todo',     label:'🆕 جديد',          color:'#64b5f6'},
    {id:'progress', label:'⚡ قيد التنفيذ',    color:'#f7c948'},
    {id:'review',   label:'🔍 مراجعة',         color:'#a78bfa'},
    {id:'revision', label:'✏️ تعديلات',         color:'#f97316'},
    {id:'done',     label:'✅ مكتمل',           color:'#4fd1a5'},
    {id:'hold',     label:'⏸ موقوف مؤقتاً',   color:'#888888'}
  ];
  return `
    <div style="display:flex;justify-content:flex-end;margin-bottom:12px">
      <button class="btn btn-primary btn-sm" onclick="openProjTaskModal('${proj.id}')"><i class="fa-solid fa-plus"></i> مهمة جديدة</button>
    </div>
    <div class="proj-kanban" style="grid-template-columns:repeat(6,minmax(200px,1fr))">
      ${cols.map(col=>{
        var colTasks=tasks.filter(t=>t.status===col.id);
        return `<div class="proj-kb-col" data-status="${col.id}" ondragover="event.preventDefault();this.classList.add('drag-over')" ondragleave="this.classList.remove('drag-over')" ondrop="onProjKbDrop(event,'${proj.id}')">
          <div class="proj-kb-col-header" style="border-bottom:2px solid ${col.color}33">
            <span style="color:${col.color};font-size:12px;font-weight:800">${col.label}</span>
            <span style="background:${col.color}22;color:${col.color};padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700">${colTasks.length}</span>
          </div>
          ${colTasks.map(t=>renderProjKbCard(t,clr,proj)).join('')}
          <button class="btn btn-ghost btn-sm" style="width:100%;justify-content:center;margin-top:4px;font-size:11px;opacity:.6" onclick="openProjTaskModal('${proj.id}',null,'${col.id}')"><i class="fa-solid fa-plus"></i> إضافة</button>
        </div>`;
      }).join('')}
    </div>`;
}

function renderProjKbCard(t,clr,proj){
  var pri=_getPriorityInfo(t.priority||'normal');
  var steps=t.steps||[];
  var doneSteps=steps.filter(function(s){return s.done;}).length;
  var priColors={high:'#f76f7c',normal:'#f7c948',low:'#4fd1a5'};
  var priC=priColors[t.priority||'normal']||'#888';
  var assigneeInitial=t.assignee_name?(t.assignee_name).charAt(0).toUpperCase():'';
  return '<div class="proj-kb-card" draggable="true" data-task-id="'+t.id+'" ondragstart="onProjKbDragStart(event,this.dataset.taskId)" onclick="openProjTaskDetail(\''+t.id+'\',\''+proj.id+'\')" style="cursor:pointer">'+
    '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:6px;margin-bottom:6px">'+
      '<div style="font-size:12px;font-weight:700;line-height:1.4;flex:1">'+escapeHtml(t.title)+'</div>'+
      '<span style="font-size:9px;font-weight:700;padding:2px 6px;border-radius:5px;background:'+priC+'22;color:'+priC+';white-space:nowrap;flex-shrink:0">'+pri.label+'</span>'+
    '</div>'+
    (t.desc?'<div style="font-size:10px;color:var(--text3);margin-bottom:5px;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">'+escapeHtml(t.desc)+'</div>':'')+
    (steps.length?'<div style="margin-bottom:6px">'+
      '<div style="height:3px;background:var(--surface3);border-radius:2px;overflow:hidden;margin-bottom:3px">'+
        '<div style="height:100%;width:'+(steps.length?Math.round(doneSteps/steps.length*100):0)+'%;background:var(--accent3);border-radius:2px"></div>'+
      '</div>'+
      '<div style="font-size:9px;color:var(--text3)">'+doneSteps+'/'+steps.length+' خطوات</div>'+
    '</div>':'')+
    '<div style="display:flex;align-items:center;justify-content:space-between;gap:6px;flex-wrap:wrap">'+
      '<div style="display:flex;align-items:center;gap:5px;flex-wrap:wrap">'+
        (t.deadline?'<span style="font-size:9px;color:var(--text3);background:var(--surface3);padding:1px 5px;border-radius:4px"><i class="fa-solid fa-calendar"></i> '+t.deadline+'</span>':'')+
        (t.value?'<span style="font-size:9px;color:var(--accent3);font-weight:700;background:rgba(79,209,165,.1);padding:1px 5px;border-radius:4px">'+t.value.toLocaleString()+' '+(t.currency||'ج.م')+(t.paymentCollected?' ✅':'')+'</span>':'')+
      '</div>'+
      '<div style="display:flex;align-items:center;gap:4px">'+
        (assigneeInitial?'<div style="width:22px;height:22px;border-radius:50%;background:'+clr+';display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:900;color:#fff;flex-shrink:0" title="'+escapeHtml(t.assignee_name||'')+'">'+assigneeInitial+'</div>':'')+
        '<button data-tid="'+t.id+'" data-pid="'+proj.id+'" onclick="event.stopPropagation();openProjTaskModal(this.dataset.pid,this.dataset.tid)" class="btn btn-ghost btn-sm" style="padding:2px 6px;font-size:10px"><i class="fa-solid fa-pen"></i></button>'+
      '</div>'+
    '</div>'+
  '</div>';
}

// Kanban DnD
var _dragProjTaskId=null;
function onProjKbDragStart(e,taskId){ _dragProjTaskId=taskId; e.currentTarget.classList.add('dragging'); }
function onProjKbDrop(e,projId){
  e.preventDefault();
  var col=e.currentTarget;
  col.classList.remove('drag-over');
  var newStatus=col.dataset.status;
  if(!_dragProjTaskId||!newStatus) return;
  if(!S.project_tasks) S.project_tasks=[];
  var t=S.project_tasks.find(t=>String(t.id)===String(_dragProjTaskId));
  if(t){ t.status=newStatus; lsSave(); cloudSave(S); renderProjectDetail(); }
  _dragProjTaskId=null;
}
function initProjKanbanDnD(){
  document.querySelectorAll('.proj-kb-card').forEach(card=>{
    card.addEventListener('dragend',()=>{ card.classList.remove('dragging'); document.querySelectorAll('.proj-kb-col').forEach(c=>c.classList.remove('drag-over')); });
  });
}

// ── Team Tab ──
function renderProjTeam(proj,clr){
  var members=proj.members||[];
  return `<div class="card">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <div class="section-title" style="margin:0">أعضاء الفريق</div>
      <button class="btn btn-ghost btn-sm" onclick="openProjectModal('${proj.id}')"><i class="fa-solid fa-user-plus"></i> إدارة الفريق</button>
    </div>
    ${members.length?members.map(m=>`
    <div style="display:flex;align-items:center;gap:12px;padding:10px;background:var(--surface2);border-radius:10px;margin-bottom:8px">
      <div style="width:36px;height:36px;border-radius:50%;background:${clr};display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:900;color:#fff;flex-shrink:0">${(m.name||'?').charAt(0).toUpperCase()}</div>
      <div style="flex:1"><div style="font-size:13px;font-weight:700">${escapeHtml(m.name||m.email||'—')}</div></div>
    </div>`).join(''):`<div style="text-align:center;color:var(--text3);padding:30px;font-size:13px">لا يوجد أعضاء — عدّل المشروع لإضافة أعضاء</div>`}
  </div>`;
}

// ── Files Tab ──
function renderProjFiles(proj,clr){
  var files=proj.files||[];
  var linkIcons={drive:'<i class="fa-brands fa-google-drive" style="color:#4285F4"></i>',dropbox:'<i class="fa-brands fa-dropbox" style="color:#0061FF"></i>',notion:'<i class="fa-solid fa-n" style="color:#000"></i>',figma:'<i class="fa-brands fa-figma" style="color:#F24E1E"></i>',other:'<i class="fa-solid fa-link" style="color:var(--accent)"></i>'};
  function detectType(url){
    if(!url) return 'other';
    if(url.includes('drive.google')) return 'drive';
    if(url.includes('dropbox')) return 'dropbox';
    if(url.includes('notion')) return 'notion';
    if(url.includes('figma')) return 'figma';
    return 'other';
  }
  return `<div class="card">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
      <div class="section-title" style="margin:0"><i class="fa-solid fa-folder-open" style="color:${clr};margin-left:6px"></i> ملفات ولينكات المشروع</div>
      <button class="btn btn-primary btn-sm" onclick="_openAddProjLink('${proj.id}')"><i class="fa-solid fa-plus"></i> إضافة ملف / لينك</button>
    </div>
    ${files.length?files.map((f,i)=>{
      var t=detectType(f.url||f.data||'');
      var icon=linkIcons[t]||linkIcons.other;
      var href=f.url||(f.data&&f.data.startsWith('http')?f.data:'#');
      return `<div style="display:flex;align-items:center;gap:10px;padding:12px;background:var(--surface2);border:1px solid var(--border);border-radius:12px;margin-bottom:8px">
        <div style="width:36px;height:36px;border-radius:9px;background:var(--surface3);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">${icon}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:700;margin-bottom:2px">${escapeHtml(f.name||'ملف')}</div>
          <div style="font-size:10px;color:var(--text3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${f.url||f.desc||f.date||''}</div>
        </div>
        <div style="display:flex;gap:6px;flex-shrink:0">
          ${href!=='#'?`<a href="${href}" target="_blank" class="btn btn-primary btn-sm" style="padding:4px 10px;font-size:11px"><i class="fa-solid fa-arrow-up-right-from-square"></i> فتح</a>`:''}
          <button data-pid="${proj.id}" data-fidx="${i}" onclick="deleteProjFile(this.dataset.pid,+this.dataset.fidx)" class="btn btn-danger btn-sm" style="padding:4px 8px"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>`;
    }).join(''):`<div style="text-align:center;padding:40px;color:var(--text3)"><i class="fa-solid fa-folder-open" style="font-size:40px;margin-bottom:10px;display:block;opacity:.4"></i><div style="font-size:14px;font-weight:700;margin-bottom:4px">لا توجد ملفات بعد</div><div style="font-size:12px">أضف روابط Google Drive أو Figma أو أي لينك</div></div>`}
  </div>`;
}

function _openAddProjLink(projId){
  var over=document.createElement('div');
  over.className='modal-overlay'; over.style.display='flex';
  over.innerHTML=`<div class="modal" style="width:min(480px,96vw)">
    <div class="modal-header">
      <div class="modal-title"><i class="fa-solid fa-link"></i> إضافة ملف أو لينك</div>
      <button class="close-btn" onclick="this.closest('.modal-overlay').remove()"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="form-group">
      <label class="form-label">اسم الملف / الوصف *</label>
      <input class="form-input" id="_plink-name" placeholder="مثال: ملف التصميم الرئيسي">
    </div>
    <div class="form-group">
      <label class="form-label"><i class="fa-brands fa-google-drive" style="color:#4285F4;margin-left:5px"></i> رابط الملف (Google Drive / Figma / Notion / ...)</label>
      <input class="form-input" id="_plink-url" type="url" placeholder="https://drive.google.com/...">
    </div>
    <div class="form-group">
      <label class="form-label">ملاحظة (اختياري)</label>
      <input class="form-input" id="_plink-desc" placeholder="مثال: النسخة النهائية المعتمدة">
    </div>
    <div style="display:flex;gap:8px">
      <button class="btn btn-primary" style="flex:1;justify-content:center" onclick="_saveProjLink('${projId}',this.closest('.modal-overlay'))">
        <i class="fa-solid fa-floppy-disk"></i> حفظ
      </button>
      <button class="btn btn-ghost" onclick="this.closest('.modal-overlay').remove()">إلغاء</button>
    </div>
  </div>`;
  document.body.appendChild(over);
  over.onclick=e=>{if(e.target===over)over.remove();};
  setTimeout(()=>document.getElementById('_plink-name')?.focus(),100);
}

function _saveProjLink(projId, over){
  var name=(document.getElementById('_plink-name')||{}).value?.trim();
  var url=(document.getElementById('_plink-url')||{}).value?.trim();
  var desc=(document.getElementById('_plink-desc')||{}).value?.trim();
  if(!name){ toast('<i class="fa-solid fa-triangle-exclamation"></i> اكتب اسم الملف'); return; }
  var proj=_getProjById(projId); if(!proj) return;
  if(!proj.files) proj.files=[];
  proj.files.push({name, url:url||'', desc:desc||'', date:new Date().toLocaleDateString('ar-EG')});
  lsSave(); cloudSave(S);
  if(over) over.remove();
  renderProjectDetail();
  toast('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم إضافة الملف');
}

function deleteProjFile(projId,idx){
  var proj=_getProjById(projId); if(!proj||!proj.files) return;
  proj.files.splice(idx,1); lsSave(); cloudSave(S); renderProjectDetail();
  toast('<i class="fa-solid fa-trash"></i> تم الحذف');
}

// ── Project Tasks ──
var _ptaskSteps=[];
function openProjTaskModal(projId, taskId, defaultStatus){
  _ptaskSteps=[];
  var t=taskId?(S.project_tasks||[]).find(t=>String(t.id)===String(taskId)):null;
  if(t) _ptaskSteps=[...(t.steps||[])];
  document.getElementById('ptask-eid').value=taskId||'';
  document.getElementById('ptask-proj-id').value=projId;
  document.getElementById('ptask-task-modal-title')||0;
  document.getElementById('proj-task-modal-title').innerHTML=taskId?'<i class="fa-solid fa-pen"></i> تعديل مهمة':'<i class="fa-solid fa-list-check"></i> مهمة جديدة';
  document.getElementById('ptask-title').value=t?t.title:'';
  document.getElementById('ptask-desc').value=t?t.desc||'':'';
  document.getElementById('ptask-priority').value=t?t.priority||'normal':'normal';
  document.getElementById('ptask-status').value=t?t.status||'todo':(defaultStatus||'todo');
  document.getElementById('ptask-deadline').value=t?t.deadline||'':'';
  var odEl=document.getElementById('ptask-orderdate'); if(odEl) odEl.value=t?t.orderDate||'':'';
  document.getElementById('ptask-value').value=t?t.value||'':'';
  document.getElementById('ptask-currency').value=t?t.currency||'ج.م':'ج.م';
  // Payment status: map old boolean to new 3-state
  var payStatus='pending';
  if(t){
    if(t.paymentCollected) payStatus='collected';
    else if(t.deposit>0 || t.paymentStatus==='deposit') payStatus='deposit';
    else payStatus=t.paymentStatus||'pending';
  }
  document.getElementById('ptask-payment-status').value=payStatus;
  // Deposit field
  var depInp=document.getElementById('ptask-deposit');
  if(depInp) depInp.value=t&&t.deposit?t.deposit:'';
  togglePtaskDepositField();
  // ── ملأ dropdown الفريق ──
  var teamFilterSel = document.getElementById('ptask-team-filter');
  var _projForTeam = _getProjById(projId);
  if(teamFilterSel){
    var allGroups = _getTeamGroups();
    teamFilterSel.innerHTML = '<option value="">— كل الأعضاء —</option>' +
      allGroups.map(function(g){
        return '<option value="'+g.id+'">'+escapeHtml(g.name)+'</option>';
      }).join('');
    // لو المشروع له فريق معين → اختره تلقائياً
    var savedTeamId = _projForTeam && _projForTeam.team_group_id ? _projForTeam.team_group_id : '';
    teamFilterSel.value = savedTeamId;
  }

  // Assignee from project members — fallback to all team members
  var proj2=_projForTeam||_getProjById(projId);
  var projMembers=proj2?proj2.members||[]:[];
  var allTeamMembers=(S.teams||[]).filter(function(m){return m.role!='invite_pending';});
  var me={id:'me',name:S.settings?.name||'أنا (أنت)'};
  var members;
  var hasProjectMembers=projMembers.length>0;
  if(hasProjectMembers){
    var hasMeInProj=projMembers.some(function(m){return m.id==='me';});
    members=hasMeInProj?projMembers:[me,...projMembers];
  } else {
    members=[me,...allTeamMembers];
  }
  // لو في فريق محدد → فلتر الأعضاء
  var savedTeamId2 = proj2 && proj2.team_group_id ? proj2.team_group_id : '';
  if(savedTeamId2){
    var grp2 = _getTeamGroups().find(function(g){ return g.id===savedTeamId2; });
    if(grp2){
      var grpIds = (grp2.members||[]).map(function(m){ return String(m.id); });
      var filtered2 = members.filter(function(m){ return m.id==='me' || grpIds.includes(String(m.id)); });
      if(filtered2.length > 0) members = filtered2;
    }
  }
  var asel=document.getElementById('ptask-assignee');
  var assigneeLabel=hasProjectMembers?'— اختر من فريق المشروع —':'— اختر عضو —';
  asel.innerHTML='<option value="">'+assigneeLabel+'</option>'+members.map(function(m){
    var n=escapeHtml(m.name||m.email||'?');
    var sel=(t&&(t.assignee_id===m.id||t.assignee_id===String(m.id)))?'selected':'';
    return '<option value="'+m.id+'" data-name="'+n+'" '+sel+'>'+n+'</option>';
  }).join('');
  // Label & hint
  var srcLabel=document.getElementById('ptask-assignee-src');
  var hintEl=document.getElementById('ptask-no-members-hint');
  if(srcLabel) srcLabel.textContent=hasProjectMembers?'(من فريق المشروع)':'(كل أعضاء الفريق)';
  if(hintEl) hintEl.style.display=(!hasProjectMembers&&allTeamMembers.length===0)?'block':'none';
  // Show assignee pay info
  _renderPtaskAssigneeInfo(t);
  renderPtaskSteps();
  openM('modal-proj-task');
  setTimeout(()=>document.getElementById('ptask-title').focus(),100);
}

function _renderPtaskAssigneeInfo(t){
  var infoEl=document.getElementById('ptask-assignee-info');
  if(!infoEl) return;
  if(!t || !t.assignee_name){ infoEl.style.display='none'; return; }
  var payLabel='لم يُحصّل بعد';
  var payColor='var(--text3)';
  if(t.paymentCollected || t.paymentStatus==='collected'){ payLabel='✅ تم التحصيل الكامل'; payColor='var(--accent3)'; }
  else if(t.deposit>0 || t.paymentStatus==='deposit'){ payLabel='🟡 عربون: '+(t.deposit||0)+' '+(t.currency||'ج.م'); payColor='var(--accent2)'; }
  infoEl.style.display='flex';
  infoEl.innerHTML='<i class="fa-solid fa-circle-info" style="color:var(--accent);margin-left:5px"></i> <b>'+escapeHtml(t.assignee_name)+'</b> — المقابل: <b style="color:var(--accent3)">'+(t.value||0)+' '+(t.currency||'ج.م')+'</b> · حالة الدفع: <span style="color:'+payColor+';font-weight:700">'+payLabel+'</span>';
}

var _ptaskEditingStepIdx = null;
function renderPtaskSteps(){
  var el=document.getElementById('ptask-steps-list'); if(!el) return;
  if(!_ptaskSteps.length){
    el.innerHTML='<div style="text-align:center;padding:10px;font-size:11px;color:var(--text3)">لا توجد خطوات — أضف خطوة أدناه</div>';
    return;
  }
  el.innerHTML=_ptaskSteps.map(function(s,i){
    return '<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--surface2);border:1px solid '+(s.note?'var(--accent)33':'var(--border)')+';border-radius:8px;margin-bottom:4px;cursor:pointer" onclick="_openStepNote('+i+')">'+
      '<input type="checkbox" '+(s.done?'checked':'')+' data-si="'+i+'" onchange="event.stopPropagation();_ptaskSteps[+this.dataset.si].done=this.checked;renderPtaskSteps()" style="cursor:pointer;accent-color:var(--accent);width:15px;height:15px;flex-shrink:0">'+
      '<div style="flex:1;min-width:0">'+
        '<span style="font-size:12px;line-height:1.5;'+(s.done?'text-decoration:line-through;color:var(--text3)':'color:var(--text)')+'">'+escapeHtml(s.text)+'</span>'+
        (s.note?'<div style="font-size:10px;color:var(--accent);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"><i class="fa-solid fa-note-sticky"></i> '+escapeHtml(s.note)+'</div>':'')+
      '</div>'+
      '<div style="display:flex;gap:4px;flex-shrink:0">'+
        (s.note?'<span style="font-size:9px;background:var(--accent)22;color:var(--accent);padding:1px 5px;border-radius:4px;font-weight:700">ملاحظة</span>':
                '<span style="font-size:9px;color:var(--text3);padding:1px 5px">+ ملاحظة</span>')+
        '<button data-si="'+i+'" onclick="event.stopPropagation();_ptaskSteps.splice(+this.dataset.si,1);renderPtaskSteps()" class="btn btn-danger btn-sm" style="padding:2px 7px;flex-shrink:0"><i class="fa-solid fa-xmark"></i></button>'+
      '</div>'+
    '</div>';
  }).join('');
}

function _openStepNote(idx){
  _ptaskEditingStepIdx = idx;
  var s = _ptaskSteps[idx];
  var area = document.getElementById('ptask-step-note-area');
  var label = document.getElementById('ptask-step-note-label');
  var inp = document.getElementById('ptask-step-note-input');
  if(!area||!label||!inp) return;
  label.textContent = s.text;
  inp.value = s.note||'';
  area.style.display='block';
  inp.focus();
}

function savePtaskStepNote(){
  if(_ptaskEditingStepIdx===null) return;
  var inp=document.getElementById('ptask-step-note-input');
  if(!inp) return;
  _ptaskSteps[_ptaskEditingStepIdx].note = inp.value.trim();
  _ptaskEditingStepIdx = null;
  document.getElementById('ptask-step-note-area').style.display='none';
  renderPtaskSteps();
}
function addPTaskStep(){
  var inp=document.getElementById('ptask-new-step');
  var v=(inp?inp.value||'':'').trim(); if(!v) return;
  _ptaskSteps.push({text:v,done:false,note:''});
  inp.value='';
  renderPtaskSteps();
  // Scroll to show the steps list
  var el=document.getElementById('ptask-steps-list');
  if(el) el.scrollIntoView({behavior:'smooth',block:'nearest'});
}

function saveProjTask(){
  var eid=document.getElementById('ptask-eid').value;
  var projId=document.getElementById('ptask-proj-id').value;
  var title=document.getElementById('ptask-title').value.trim();
  if(!title){toast('<i class="fa-solid fa-triangle-exclamation"></i> عنوان المهمة مطلوب');return;}
  if(!S.project_tasks) S.project_tasks=[];
  var asel=document.getElementById('ptask-assignee');
  var assignee_id=asel.value||'';
  var assignee_name=assignee_id?(asel.options[asel.selectedIndex]?.dataset.name||''):'';
  var payStatus=(document.getElementById('ptask-payment-status')||{value:'pending'}).value||'pending';
  var depositVal=+(document.getElementById('ptask-deposit')||{value:0}).value||0;
  var prevStatus=''; var prevPay=false;
  if(eid){var old=S.project_tasks.find(t=>String(t.id)===String(eid));if(old){prevStatus=old.status||'';prevPay=old.paymentCollected||false;}}
  var d={
    title,desc:document.getElementById('ptask-desc').value.trim(),
    project_id:projId,
    priority:document.getElementById('ptask-priority').value||'normal',
    status:document.getElementById('ptask-status').value||'todo',
    orderDate:(document.getElementById('ptask-orderdate')||{}).value||'',
    deadline:document.getElementById('ptask-deadline').value||'',
    value:+(document.getElementById('ptask-value')||{value:0}).value||0,
    currency:(document.getElementById('ptask-currency')||{value:'ج.م'}).value||'ج.م',
    paymentStatus:payStatus,
    paymentCollected:(payStatus==='collected'),
    deposit:(payStatus==='deposit')?depositVal:0,
    assignee_id, assignee_name,
    steps:[..._ptaskSteps],
    createdAt:new Date().toISOString()
  };
  var isNewlyDone=(d.status==='done')&&(prevStatus!=='done');
  var isNewlyCollected=(payStatus==='collected')&&!prevPay;
  // عربون جديد: لو paymentStatus=deposit وفيه قيمة عربون
  var oldPayStatus='';
  if(eid){var _oldT=S.project_tasks.find(t=>String(t.id)===String(eid));if(_oldT)oldPayStatus=_oldT.paymentStatus||'';}
  var isNewDeposit=(payStatus==='deposit')&&depositVal>0&&(oldPayStatus!=='deposit');
  if(eid){
    var i=S.project_tasks.findIndex(t=>String(t.id)===String(eid));
    if(i>-1){d.id=+eid;d.createdAt=S.project_tasks[i].createdAt;S.project_tasks[i]=d;}
  } else {
    d.id=Date.now(); S.project_tasks.push(d);
  }
  // ── تسجيل مالي تلقائي عند التحصيل الكامل ──
  if(d.value>0 && isNewlyCollected){
    var proj=_getProjById(projId);
    if(!S.transactions) S.transactions=[];
    var alreadyLinked=S.transactions.some(tr=>String(tr.linkedProjTaskId)===String(d.id)&&tr.type==='income');
    if(!alreadyLinked){
      S.transactions.push({id:Date.now()+Math.random(),type:'income',amount:d.value,currency:d.currency||'ج.م',
        desc:'مهمة: '+(d.title||'')+(proj?' — مشروع: '+proj.name:''),
        date:new Date().toISOString().slice(0,10),isoDate:new Date().toISOString().slice(0,10),
        linkedProjTaskId:d.id,project_id:proj?String(proj.id):'',project_name:proj?proj.name:'',
        source:'project_task',createdAt:new Date().toISOString()});
      if(typeof renderFinance==='function') setTimeout(renderFinance,200);
    }
  }
  lsSave(); cloudSave(S); closeM('modal-proj-task'); renderProjectDetail();
  toast('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم حفظ المهمة');
  // ── سؤال تسجيل العربون كدخل ──
  if(isNewDeposit && depositVal>0){
    var _proj=_getProjById(projId);
    var _mpt=document.getElementById('modal-proj-task'); if(_mpt) _mpt.style.display='none';
    setTimeout(function(){
      _showPaymentIncomePrompt({
        amount:depositVal,
        label:'عربون',
        desc:'عربون مهمة: '+d.title+(_proj?' — مشروع: '+_proj.name:''),
        client:_proj?_proj.client||'':'',
        taskId:d.id,
        paymentType:'deposit'
      });
    },450);
  }
}

function toggleProjTaskDone(taskId,projId,done){
  if(!S.project_tasks) return;
  var t=S.project_tasks.find(function(x){return String(x.id)===String(taskId);});
  if(!t) return;
  var prevDone = t.status==='done';
  t.status=done?'done':'todo';
  // Ask for project link when newly marked done
  if(done && !prevDone){
    _askProjectLinkForTask(taskId, projId, function(){
      // Auto-record income when task marked done and has value
      if(t.value>0 && !t.paymentCollected){
        var proj=_getProjById(projId);
        if(!S.transactions) S.transactions=[];
        S.transactions.push({
          id:Date.now()+Math.random(),
          type:'income',
          amount:t.value,
          currency:t.currency||'ج.م',
          desc:'إتمام مهمة: '+(t.title||'')+(proj?' — مشروع: '+proj.name:''),
          date:new Date().toISOString().slice(0,10),
          isoDate:new Date().toISOString().slice(0,10),
          linkedProjTaskId:t.id,
          project_id: proj ? String(proj.id) : '',
          project_name: proj ? proj.name : '',
          source:'project_task',
          createdAt:new Date().toISOString()
        });
        t.paymentCollected=true;
        if(typeof renderFinance==='function') setTimeout(renderFinance,200);
      }
      lsSave(); cloudSave(S); renderProjectDetail();
    });
    lsSave(); cloudSave(S); renderProjectDetail();
    return;
  }
  // Auto-record income when task marked done and has value
  if(done && t.value>0 && !t.paymentCollected){
    var proj=_getProjById(projId);
    if(!S.transactions) S.transactions=[];
    S.transactions.push({
      id:Date.now()+Math.random(),
      type:'income',
      amount:t.value,
      currency:t.currency||'ج.م',
      desc:'إتمام مهمة: '+(t.title||'')+(proj?' — مشروع: '+proj.name:''),
      date:new Date().toISOString().slice(0,10),
      isoDate:new Date().toISOString().slice(0,10),
      linkedProjTaskId:t.id,
      project_id: proj ? String(proj.id) : '',
      project_name: proj ? proj.name : '',
      source:'project_task',
      createdAt:new Date().toISOString()
    });
    t.paymentCollected=true;
    if(typeof renderFinance==='function') setTimeout(renderFinance,200);
  }
  lsSave(); cloudSave(S); renderProjectDetail();
}
function deleteProjTask(taskId,projId){
  confirmDel('حذف هذه المهمة؟',function(){
    S.project_tasks=(S.project_tasks||[]).filter(t=>String(t.id)!==String(taskId));
    lsSave(); cloudSave(S); renderProjectDetail();
    toast('<i class="fa-solid fa-trash"></i> تم الحذف');
  });
}
function changeProjStatus(projId,status){
  var proj=_getProjById(projId); if(!proj) return;
  proj.status=status; lsSave(); cloudSave(S); renderProjectDetail();
}

// ── Client Portal (Share) ──
function openProjSharePortal(projId){
  var uid=(typeof _supaUserId!=='undefined'&&_supaUserId)?_supaUserId:'';
  var _cppPath=window.location.pathname.split('/').filter(function(x){return x!=='';});
  if(_cppPath.length&&['dashboard','tasks','projects','schedule','meetings','clients','finance','invoices','services','support','team','timetracker','goals','settings','reports'].indexOf(_cppPath[_cppPath.length-1])>=0)_cppPath.pop();
  if(_cppPath.length&&_cppPath[_cppPath.length-1].endsWith('.html'))_cppPath.pop();
  var _cpBase=window.location.origin+(_cppPath.length?'/'+_cppPath.join('/')+'/' :'/')+'client-portal.html';

  // Try to find client for this project
  var proj=_getProjById(projId);
  var client=proj&&proj.client_id?(S.clients||[]).find(c=>String(c.id)===String(proj.client_id)):null;

  if(!client){
    // مفيش عميل مرتبط بالمشروع
    var over2=document.createElement('div');
    over2.className='modal-overlay'; over2.style.display='flex';
    over2.innerHTML='<div class="modal" style="max-width:420px;text-align:center"><div class="modal-header"><div class="modal-title"><i class="fa-solid fa-share-nodes"></i> مشاركة مع العميل</div><button class="close-btn" onclick="this.closest(\'.modal-overlay\').remove()"><i class="fa-solid fa-xmark"></i></button></div><div style="padding:24px 20px"><div style="font-size:48px;margin-bottom:12px">⚠️</div><div style="font-size:15px;font-weight:800;margin-bottom:8px">المشروع ليس له عميل محدد</div><div style="font-size:13px;color:var(--text3)">عدّل المشروع وحدد العميل أولاً لإنشاء رابط البوابة</div></div></div>';
    document.body.appendChild(over2);
    over2.onclick=e=>{if(e.target===over2)over2.remove();};
    return;
  }

  // رابط بوابة العميل مع فتح تاب المشاريع مباشرة
  var projTabLink = _cpBase+'?uid='+uid+'&cid='+client.id+'&tab=projects&pid='+projId;
  // رابط البوابة الكاملة
  var clientLink  = _cpBase+'?uid='+uid+'&cid='+client.id;

  var over=document.createElement('div');
  over.className='modal-overlay'; over.style.display='flex';
  over.innerHTML=`<div class="modal" style="max-width:500px">
    <div class="modal-header">
      <div class="modal-title"><i class="fa-solid fa-share-nodes"></i> مشاركة مع العميل</div>
      <button class="close-btn" onclick="this.closest('.modal-overlay').remove()"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div style="background:var(--surface2);border:1px solid var(--border);border-radius:12px;padding:14px;margin-bottom:12px">
      <div style="font-size:13px;font-weight:800;margin-bottom:4px"><i class="fa-solid fa-diagram-project" style="color:var(--accent);margin-left:5px"></i> رابط المشروع فقط</div>
      <div style="font-size:11px;color:var(--text3);margin-bottom:8px">يفتح بوابة العميل مباشرةً على تاب المشاريع</div>
      <div style="font-size:10px;color:var(--accent3);font-family:monospace;word-break:break-all;margin-bottom:10px;background:var(--surface3);padding:8px;border-radius:8px">${projTabLink}</div>
      <div style="display:flex;gap:6px">
        <button class="btn btn-primary btn-sm" style="flex:1;justify-content:center" onclick="navigator.clipboard.writeText('${projTabLink}').then(()=>toast('✅ تم نسخ رابط المشروع'))"><i class="fa-solid fa-copy"></i> نسخ</button>
        <button class="btn btn-ghost btn-sm" onclick="window.open('${projTabLink}','_blank')"><i class="fa-solid fa-eye"></i> معاينة</button>
      </div>
    </div>
    <div style="background:rgba(79,209,165,.08);border:1px solid rgba(79,209,165,.3);border-radius:12px;padding:14px;margin-bottom:12px">
      <div style="font-size:13px;font-weight:800;color:#4fd1a5;margin-bottom:4px"><i class="fa-solid fa-id-card" style="margin-left:5px"></i> بوابة العميل الكاملة — ${escapeHtml(client.name)}</div>
      <div style="font-size:11px;color:var(--text3);margin-bottom:8px">العميل يشوف: كل مشاريعه، فواتيره، طلباته، عقوده</div>
      <div style="font-size:10px;color:var(--accent3);font-family:monospace;word-break:break-all;margin-bottom:10px;background:var(--surface3);padding:8px;border-radius:8px">${clientLink}</div>
      <div style="display:flex;gap:6px">
        <button class="btn btn-success btn-sm" style="flex:1;justify-content:center" onclick="navigator.clipboard.writeText('${clientLink}').then(()=>toast('✅ تم نسخ رابط بوابة ${escapeHtml(client.name)}'))"><i class="fa-solid fa-copy"></i> نسخ رابط البوابة</button>
        <button class="btn btn-ghost btn-sm" onclick="window.open('${clientLink}','_blank')"><i class="fa-solid fa-eye"></i> معاينة</button>
      </div>
    </div>
    <div style="font-size:11px;color:var(--text3);text-align:center"><i class="fa-solid fa-lock" style="margin-left:4px"></i> العميل يرى بياناته فقط — لا يمكنه التعديل أو الحذف</div>
  </div>`;
  document.body.appendChild(over);
  over.onclick=e=>{if(e.target===over)over.remove();};
}

// ── Hook into renderAll ──
var _origRenderAll_proj=null;
if(typeof renderAll==='function'){
  _origRenderAll_proj=renderAll;
}

// ── Init S.projects ──
document.addEventListener('DOMContentLoaded',function(){
  if(!S.projects) S.projects=[];
  if(!S.project_tasks) S.project_tasks=[];
});

// ── Hook renderAll to include renderProjects ──
var _projRenderHooked=false;
function _hookProjRender(){
  if(_projRenderHooked) return;
  var orig=window.renderAll;
  window.renderAll=function(){
    if(orig) orig.apply(this,arguments);
    var projPage=document.getElementById('page-projects');
    if(projPage&&projPage.classList.contains('active')) renderProjects();
    var detPage=document.getElementById('page-project-detail');
    if(detPage&&detPage.classList.contains('active')&&_currentProjId) renderProjectDetail();
  };
  _projRenderHooked=true;
}
setTimeout(_hookProjRender,500);


