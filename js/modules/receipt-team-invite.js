// ═══════════════════════════════════════════════════
// RECEIPT IMAGE HELPERS
// ═══════════════════════════════════════════════════
window._invReceiptData = null;
window._incReceiptData = null;

function invReceiptPreview(inp){
  var file=inp.files[0]; if(!file) return;
  toast('<i class="fa-solid fa-spinner fa-spin"></i> جاري رفع الإيصال...');
  uploadToStorage(file,'receipts',function(url){
    window._invReceiptData=url;
    var img=document.getElementById('inv-receipt-img');
    var prev=document.getElementById('inv-receipt-prev');
    var ph=document.getElementById('inv-receipt-ph');
    if(img) img.src=url;
    if(prev) prev.style.display='block';
    if(ph) ph.style.display='none';
    toast('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم رفع الإيصال');
  },function(){
    // fallback base64 للإيصالات (صغيرة عادة)
    var r=new FileReader(); r.onload=function(e){ window._invReceiptData=e.target.result; var img=document.getElementById('inv-receipt-img'); var prev=document.getElementById('inv-receipt-prev'); var ph=document.getElementById('inv-receipt-ph'); if(img) img.src=e.target.result; if(prev) prev.style.display='block'; if(ph) ph.style.display='none'; }; r.readAsDataURL(file);
  });
}
function invReceiptClear(){
  window._invReceiptData=null;
  var img=document.getElementById('inv-receipt-img');
  var prev=document.getElementById('inv-receipt-prev');
  var ph=document.getElementById('inv-receipt-ph');
  var fi=document.getElementById('inv-receipt-file');
  if(img) img.src=''; if(prev) prev.style.display='none';
  if(ph) ph.style.display=''; if(fi) fi.value='';
}
function invReceiptDrop(e){
  e.preventDefault();
  var file=e.dataTransfer&&e.dataTransfer.files&&e.dataTransfer.files[0];
  if(!file||!file.type.startsWith('image/')) return;
  var inp=document.getElementById('inv-receipt-file');
  if(inp){ var dt=new DataTransfer(); dt.items.add(file); inp.files=dt.files; invReceiptPreview(inp); }
}
function incReceiptPreview(inp){
  var file=inp.files[0]; if(!file) return;
  toast('<i class="fa-solid fa-spinner fa-spin"></i> جاري رفع الإيصال...');
  uploadToStorage(file,'receipts',function(url){
    window._incReceiptData=url;
    var img=document.getElementById('in-receipt-img');
    var prev=document.getElementById('in-receipt-prev');
    var ph=document.getElementById('in-receipt-ph');
    if(img) img.src=url;
    if(prev) prev.style.display='block';
    if(ph) ph.style.display='none';
    toast('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم رفع الإيصال');
  },function(){
    var r=new FileReader(); r.onload=function(e){ window._incReceiptData=e.target.result; var img=document.getElementById('in-receipt-img'); var prev=document.getElementById('in-receipt-prev'); var ph=document.getElementById('in-receipt-ph'); if(img) img.src=e.target.result; if(prev) prev.style.display='block'; if(ph) ph.style.display='none'; }; r.readAsDataURL(file);
  });
}

// ═══════════════════════════════════════════════════
// TEAM INVITE INBOX + MEMBER PROFILE ENHANCED
// ═══════════════════════════════════════════════════

// ─── Inbox: show pending invites in a modal ───
window.openTeamInviteInbox = function(){
  // Trigger immediate poll to get latest invites before opening
  if(typeof window._teamPollNow === 'function') window._teamPollNow();
  
  var invites = window._pendingTeamInvites || [];
  var memberships = window._myTeamMemberships || [];
  
  var ex = document.getElementById('_team-inbox-overlay');
  if(ex) ex.remove();
  
  var overlay = document.createElement('div');
  overlay.id = '_team-inbox-overlay';
  overlay.className = 'modal-overlay';
  overlay.style.display = 'flex';
  
  var pendingHtml = invites.length ? invites.map(function(inv,i){
    var roleMatch = inv.body && inv.body.match(/كـ (.+?) في فريق/);
    var roleText = roleMatch ? roleMatch[1] : (inv.memberRole||'عضو');
    var specsText = inv.extraSpecs && inv.extraSpecs.length ? ' · ' + inv.extraSpecs.join('، ') : '';
    return '<div style="background:var(--surface2);border:1.5px solid rgba(124,111,247,.25);border-radius:14px;padding:16px;margin-bottom:10px">'
      +'<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">'
        +'<div style="width:42px;height:42px;border-radius:12px;background:linear-gradient(135deg,var(--accent),var(--accent3));display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0"><i class="fa-solid fa-building"></i></div>'
        +'<div style="flex:1">'
          +'<div style="font-size:14px;font-weight:800">'+escapeHtml(inv.ownerName||'مشرف')+'</div>'
          +'<div style="font-size:12px;color:var(--text3)">دعوة للانضمام لـ <strong style="color:var(--accent)">'+escapeHtml(inv.teamName||'فريق')+'</strong></div>'
          +'<div style="font-size:11px;color:var(--text2);margin-top:3px">دورك: <strong>'+escapeHtml(roleText)+'</strong>'+escapeHtml(specsText)+'</div>'
        +'</div>'
      +'</div>'
      +'<div style="display:flex;gap:8px">'
        +'<button class="btn btn-ghost btn-sm" style="flex:1;justify-content:center" data-inv-idx="'+i+'" onclick="window._inboxRejectInvite(+this.dataset.invIdx)"><i class="fa-solid fa-xmark"></i> رفض</button>'
        +'<button class="btn btn-primary btn-sm" style="flex:2;justify-content:center" data-inv-idx="'+i+'" onclick="window._inboxAcceptInvite(+this.dataset.invIdx)"><i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> قبول الدعوة</button>'
      +'</div>'
    +'</div>';
  }).join('') : '<div style="text-align:center;padding:24px;color:var(--text3)"><div style="font-size:36px;margin-bottom:10px"><i class="fa-solid fa-envelope-open"></i></div><div style="font-size:13px">لا توجد دعوات معلقة</div></div>';

  var membersHtml = memberships.length ? '<div style="margin-top:8px">'
    +'<div style="font-size:11px;font-weight:700;color:var(--text3);margin-bottom:10px"><i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> الفرق التي أنا عضو فيها</div>'
    +memberships.map(function(m){
      var tc = m.tasks ? m.tasks.length : 0;
      return '<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:rgba(79,209,165,.06);border:1px solid rgba(79,209,165,.2);border-radius:10px;margin-bottom:6px">'
        +'<span style="font-size:18px"><i class="fa-solid fa-building"></i></span>'
        +'<div style="flex:1"><div style="font-size:13px;font-weight:700;color:var(--accent3)">'+escapeHtml(m.ownerName)+'</div><div style="font-size:11px;color:var(--text3)">'+escapeHtml(m.teamName)+' · '+escapeHtml(m.role||'عضو')+'</div></div>'
        +(tc ? '<span style="font-size:10px;background:rgba(247,201,72,.2);color:var(--accent2);padding:2px 8px;border-radius:8px;font-weight:700">'+tc+' مهام</span>' : '<span style="font-size:10px;color:var(--accent3)"><i class="fa-solid fa-check"></i> محدث</span>')
      +'</div>';
    }).join('')
  +'</div>' : '';

  overlay.innerHTML = '<div class="modal" style="max-width:480px;max-height:88vh;overflow-y:auto">'
    +'<div class="modal-header" style="position:sticky;top:0;background:var(--surface);z-index:2">'
      +'<div class="modal-title"><i class="fa-solid fa-envelope-open-text"></i> صندوق الدعوات</div>'
      +'<button class="close-btn" id="_inbox-close-btn"><i class="fa-solid fa-xmark"></i></button>'
    +'</div>'
    +(invites.length ? '<div style="background:rgba(124,111,247,.07);border-radius:10px;padding:10px 14px;margin-bottom:14px;font-size:12px;color:var(--accent)"><i class="fa-solid fa-bell"></i> لديك <strong>'+invites.length+'</strong> دعوة جديدة تنتظر ردك</div>' : '')
    +pendingHtml
    +membersHtml
  +'</div>';
  
  document.body.appendChild(overlay);
  overlay.querySelector('#_inbox-close-btn').onclick = function(){ overlay.remove(); };
  overlay.onclick = function(e){ if(e.target===overlay) overlay.remove(); };
};

window._inboxAcceptInvite = function(idx){
  var invites = window._pendingTeamInvites || [];
  var inv = invites[idx]; if(!inv) return;
  invites.splice(idx, 1);
  window._pendingTeamInvites = invites;
  _updateInboxBadge();
  // PHASE 3 FIX: Save acceptance locally
  if(inv) {
    var localKey = '_accepted_team_invites_' + (_supaUserId||'');
    var localList = JSON.parse(localStorage.getItem(localKey) || '[]');
    var alreadySaved = localList.some(function(li){ return li.teamId===String(inv.teamId) && li.ownerId===inv.ownerId; });
    if(!alreadySaved) {
      localList.push({ teamId: String(inv.teamId||inv.id), ownerId: inv.ownerId||'', teamName: inv.teamName });
      localStorage.setItem(localKey, JSON.stringify(localList));
    }
    // Update team_invites table
    if(typeof supa !== 'undefined' && inv.id) {
      (async()=>{try{await supa.from('team_invites').update({status:'accepted'}).eq('id',String(inv.id).replace('pn_',''));}catch(e){}})();
    }
  }
  // Re-check membership
  var em = null;
  try{ var _s=JSON.parse(localStorage.getItem('studioOS_auth_v1')||'{}'); em=_s&&_s.email?_s.email:null; }catch(e){}
  if(em) window._checkTeamMembership(em);
  showMiniNotif('<i class="fa-solid fa-champagne-glasses"></i> انضممت لفريق "'+inv.teamName+'"!');
  var inbox = document.getElementById('_team-inbox-overlay');
  if(inbox) inbox.remove();
  setTimeout(function(){ renderTeams(); renderMyMemberTeams(); openTeamInviteInbox(); }, 600);
};

window._inboxRejectInvite = function(idx){
  var invites = window._pendingTeamInvites || [];
  var inv = invites[idx]; if(!inv) return;
  invites.splice(idx, 1);
  window._pendingTeamInvites = invites;
  _updateInboxBadge();
  showMiniNotif('تم رفض دعوة "'+inv.teamName+'"');
  var inbox = document.getElementById('_team-inbox-overlay');
  if(inbox) inbox.remove();
  setTimeout(openTeamInviteInbox, 200);
};

function _updateInboxBadge(){
  var invites = window._pendingTeamInvites || [];
  var badge = document.getElementById('team-invite-inbox-badge');
  if(!badge) return;
  if(invites.length){
    badge.textContent = invites.length;
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }
}

// ─── Render member teams in team page ───
function renderMyMemberTeams(){
  var section = document.getElementById('my-member-teams-section');
  var grid    = document.getElementById('my-member-teams-grid');
  var countEl = document.getElementById('my-member-teams-count');
  var memberships = window._myTeamMemberships || [];
  
  if(!section || !grid) return;
  
  if(!memberships.length){
    section.style.display = 'none';
    return;
  }
  
  section.style.display = '';
  if(countEl) countEl.textContent = memberships.length;
  
  grid.innerHTML = memberships.map(function(m){
    var tasks = m.tasks || [];
    var doneTasks = m.doneTasks || [];
    var lateTasks = tasks.filter(function(t){ return t.deadline && new Date(t.deadline) < new Date(); });
    return '<div class="card" style="cursor:pointer;transition:border-color .15s,transform .15s" data-oid="'+m.ownerId+'" onclick="openMyMemberTeamProfile(this.dataset.oid)" onmouseenter="this.style.borderColor=\'var(--accent3)\';this.style.transform=\'translateY(-2px)\'" onmouseleave="this.style.borderColor=\'\';this.style.transform=\'\'">'
      +'<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">'
        +(m.ownerLogo ? '<img src="'+escapeHtml(m.ownerLogo)+'" style="width:44px;height:44px;border-radius:12px;object-fit:cover;flex-shrink:0" onerror=\'this.style.display=\"none\"\'">'
          : '<div style="width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,var(--accent),var(--accent3));display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0"><i class="fa-solid fa-building"></i></div>')
        +'<div style="flex:1;min-width:0">'
          +'<div style="font-size:15px;font-weight:800;color:var(--accent3)">'+escapeHtml(m.ownerName)+'</div>'
          +'<div style="font-size:11px;color:var(--text3)">'+escapeHtml(m.teamName)+'</div>'
        +'</div>'
        +'<span style="font-size:10px;background:rgba(79,209,165,.12);color:var(--accent3);padding:3px 10px;border-radius:8px;font-weight:700">'+escapeHtml(m.role||'عضو')+'</span>'
      +'</div>'
      +'<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px">'
        +'<div style="background:var(--surface2);border-radius:10px;padding:10px;text-align:center">'
          +'<div style="font-size:20px;font-weight:900;color:var(--accent4)">'+tasks.length+'</div>'
          +'<div style="font-size:10px;color:var(--text3)">نشطة</div>'
        +'</div>'
        +'<div style="background:var(--surface2);border-radius:10px;padding:10px;text-align:center">'
          +'<div style="font-size:20px;font-weight:900;color:var(--accent3)">'+doneTasks.length+'</div>'
          +'<div style="font-size:10px;color:var(--text3)">مكتملة</div>'
        +'</div>'
        +'<div style="background:var(--surface2);border-radius:10px;padding:10px;text-align:center">'
          +'<div style="font-size:20px;font-weight:900;color:'+(lateTasks.length?'var(--accent4)':'var(--accent3)')+'">'+lateTasks.length+'</div>'
          +'<div style="font-size:10px;color:var(--text3)">متأخرة</div>'
        +'</div>'
      +'</div>'
      +(tasks.length ? '<div style="font-size:11px;color:var(--text3);border-top:1px solid var(--border);padding-top:10px">👆 اضغط لعرض مهامك التفصيلية</div>' : '<div style="font-size:11px;color:var(--accent3);border-top:1px solid var(--border);padding-top:10px"><i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> لا مهام نشطة حاليًا</div>')
    +'</div>';
  }).join('');
}

// ─── Full profile modal for "teams I'm a member of" ───
window.openMyMemberTeamProfile = function(ownerId){
  var membership = (window._myTeamMemberships||[]).find(function(m){ return m.ownerId===ownerId; });
  if(!membership) return;

  var ex = document.getElementById('_member-team-modal');
  if(ex) ex.remove();

  var overlay = document.createElement('div');
  overlay.id = '_member-team-modal';
  overlay.className = 'modal-overlay';
  overlay.style.display = 'flex';

  function _buildModal(){
    var tasks = membership.tasks || [];
    var doneTasks = membership.doneTasks || [];

    // ── Update task status in owner's studio_data ──
    window._memberUpdateTaskStatus = async function(taskId, newStatus){
      var isDone = (newStatus === 'done');
      // Update locally first
      var tIdx = membership.tasks.findIndex(function(t){ return String(t.id)===String(taskId); });
      var dIdx = membership.doneTasks.findIndex(function(t){ return String(t.id)===String(taskId); });
      var taskObj = tIdx > -1 ? membership.tasks[tIdx] : (dIdx > -1 ? membership.doneTasks[dIdx] : null);
      if(!taskObj) return;
      taskObj.status = newStatus;
      taskObj.done = isDone;
      if(isDone && tIdx > -1){ membership.tasks.splice(tIdx,1); membership.doneTasks.unshift(taskObj); }
      else if(!isDone && dIdx > -1){ membership.doneTasks.splice(dIdx,1); membership.tasks.push(taskObj); }
      overlay.querySelector('.modal').innerHTML = _renderModalBody();
      _bindModalEvents();
      // Update in owner's studio_data
      try {
        var { data: ownerRow } = await supa.from('studio_data').select('data').eq('user_id', ownerId).maybeSingle();
        if(!ownerRow) return;
        var od = typeof ownerRow.data==='string' ? JSON.parse(ownerRow.data) : ownerRow.data;
        if(od.data && !od.tasks) od = typeof od.data==='string' ? JSON.parse(od.data) : od.data;
        // Update in regular tasks
        var ot = (od.tasks||[]).find(function(t){ return String(t.id)===String(taskId); });
        if(ot){ ot.status=newStatus; ot.done=isDone; }
        // Also update in project_tasks (مهام المشاريع)
        var opt = (od.project_tasks||[]).find(function(t){ return String(t.id)===String(taskId); });
        if(opt){ opt.status=newStatus; if(isDone){ opt.done=true; } else { opt.done=false; } }
        await supa.from('studio_data').update({data:JSON.stringify(od),updated_at:new Date().toISOString()}).eq('user_id',ownerId);
        if(typeof showMiniNotif==='function') showMiniNotif('✅ تم تحديث حالة المهمة');
      } catch(e){ console.warn('task update err:', e); }
    };

    // ── Update step done status ──
    window._memberToggleStep = async function(taskId, stepIdx, isDone){
      var task = (membership.tasks||[]).concat(membership.doneTasks||[]).find(function(t){ return String(t.id)===String(taskId); });
      if(!task || !task.steps || !task.steps[stepIdx]) return;
      task.steps[stepIdx].done = isDone;
      overlay.querySelector('.modal').innerHTML = _renderModalBody();
      _bindModalEvents();
      try {
        var { data: ownerRow } = await supa.from('studio_data').select('data').eq('user_id', ownerId).maybeSingle();
        if(!ownerRow) return;
        var od = typeof ownerRow.data==='string' ? JSON.parse(ownerRow.data) : ownerRow.data;
        if(od.data && !od.tasks) od = typeof od.data==='string' ? JSON.parse(od.data) : od.data;
        // Update steps in regular tasks
        var ot = (od.tasks||[]).find(function(t){ return String(t.id)===String(taskId); });
        if(ot && ot.steps && ot.steps[stepIdx]) ot.steps[stepIdx].done = isDone;
        // Also update steps in project_tasks
        var opt = (od.project_tasks||[]).find(function(t){ return String(t.id)===String(taskId); });
        if(opt && opt.steps && opt.steps[stepIdx]) opt.steps[stepIdx].done = isDone;
        await supa.from('studio_data').update({data:JSON.stringify(od),updated_at:new Date().toISOString()}).eq('user_id',ownerId);
      } catch(e){ console.warn('step update err:', e); }
    };

    // ── Open full task detail overlay for member ──
    window._openMemberTaskDetail = function(taskId){
      var allTasks = (membership.tasks||[]).concat(membership.doneTasks||[]);
      var t = allTasks.find(function(x){ return String(x.id)===String(taskId); });
      if(!t) return;
      var ex = document.getElementById('_mtd-overlay');
      if(ex) ex.remove();
      var ov = document.createElement('div');
      ov.id = '_mtd-overlay';
      ov.className = 'modal-overlay';
      ov.style.display = 'flex';
      ov.style.zIndex = '10001';
      var authorName = membership.memberName || (S.settings&&S.settings.name) || 'عضو';
      var stColors = {new:'var(--text3)',progress:'var(--accent2)',review:'#f7c948',paused:'#64b5f6',done:'var(--accent3)'};
      var stLabels = {new:'🆕 جديد',progress:'⚡ جاري',review:'🔍 مراجعة',paused:'⏸ موقوف',done:'✅ مكتمل'};
      var curSt = t.status||'new';
      var isLate = t.deadline && new Date(t.deadline)<new Date() && !t.done;
      var daysLeft = t.deadline ? Math.ceil((new Date(t.deadline)-new Date())/864e5) : null;
      var tid = String(t.id);
      var oid = ownerId;

      function _buildDetailHTML(){
        var stepsTotal = (t.steps||[]).length;
        var stepsDone  = (t.steps||[]).filter(function(s){return s.done;}).length;
        var pct = stepsTotal ? Math.round(stepsDone/stepsTotal*100) : (t.done?100:0);

        // Steps with per-step comments + toggle
        var stepsHTML = '';
        if(stepsTotal){
          stepsHTML = '<div style="margin:14px 0;padding:14px;background:var(--surface2);border-radius:12px;border:1px solid var(--border)">'
            +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">'
              +'<div style="font-size:13px;font-weight:700"><i class="fa-solid fa-clipboard-list"></i> خطوات التنفيذ</div>'
              +'<div style="font-size:12px;font-weight:700;color:var(--accent)">'+stepsDone+'/'+stepsTotal+' — '+pct+'%</div>'
            +'</div>'
            +'<div style="height:6px;background:var(--surface3);border-radius:3px;overflow:hidden;margin-bottom:12px">'
              +'<div style="height:100%;width:'+pct+'%;background:linear-gradient(90deg,var(--accent),var(--accent3));border-radius:3px;transition:.4s"></div>'
            +'</div>';
          (t.steps||[]).forEach(function(s,si){
            var stepComments = (t.comments||[]).filter(function(c){return String(c.stepIdx)===String(si);});
            var inputId = '_mts-'+tid+'-'+si;
            stepsHTML += '<div style="border-bottom:1px solid rgba(255,255,255,.06);padding-bottom:10px;margin-bottom:10px">'
              +'<div style="display:flex;align-items:center;gap:10px;cursor:pointer;padding:6px 0" data-step-toggle="'+tid+'-'+si+'">'
                +'<div style="width:24px;height:24px;border-radius:6px;border:2px solid '+(s.done?'var(--accent3)':'var(--border)')+';background:'+(s.done?'var(--accent3)':'transparent')+';display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:11px;color:#fff;transition:.2s">'+(s.done?'<i class="fa-solid fa-check"></i>':String(si+1))+'</div>'
                +'<div style="flex:1;font-size:13px;font-weight:600;'+(s.done?'text-decoration:line-through;opacity:.5':'')+'" data-step-text="'+si+'">'+escapeHtml(s.title||s.text||s.name||'خطوة')+'</div>'
                +'<div style="font-size:10px;font-weight:700;color:'+(s.done?'var(--accent3)':'var(--text3)'+';opacity:.7')+'">'+( s.done?'✅ مكتمل':'◯ معلق')+'</div>'
              +'</div>'
              // Step comments
              +(stepComments.length ? '<div style="padding-right:34px;margin-bottom:6px">'+stepComments.map(function(c){
                var d=new Date(c.at);
                return '<div style="background:rgba(124,111,247,.1);border-radius:8px;padding:6px 10px;margin-bottom:4px">'
                  +'<span style="font-size:10px;font-weight:700;color:var(--accent)">'+escapeHtml(c.author||'')+'</span>'
                  +'<span style="font-size:10px;color:var(--text3);margin-right:6px">'+d.getDate()+'/'+(d.getMonth()+1)+'</span>'
                  +'<div style="font-size:11px;color:var(--text2);margin-top:2px">'+escapeHtml(c.text)+'</div>'
                +'</div>';
              }).join('')+'</div>' : '')
              // Step comment input
              +'<div style="padding-right:34px;display:flex;gap:6px">'
                +'<input type="text" id="'+inputId+'" style="flex:1;padding:5px 10px;background:var(--surface);border:1px solid var(--border);border-radius:8px;font-size:11px;color:var(--text);font-family:var(--font)" placeholder="ملاحظة على هذه الخطوة...">'
                +'<button data-step-comment="'+tid+'" data-step-idx="'+si+'" data-input-id="'+inputId+'" style="padding:5px 10px;background:var(--accent);color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:11px"><i class="fa-solid fa-paper-plane"></i></button>'
              +'</div>'
            +'</div>';
          });
          stepsHTML += '</div>';
        }

        // Task comments
        var taskComments = (t.comments||[]).filter(function(c){return c.stepIdx===null||c.stepIdx===undefined;});
        var commentsHTML = '<div style="margin:14px 0;padding:14px;background:var(--surface2);border-radius:12px;border:1px solid var(--border)">'
          +'<div style="font-size:13px;font-weight:700;margin-bottom:10px"><i class="fa-solid fa-comments" style="color:var(--accent)"></i> ملاحظات وتعليقات <span style="font-size:10px;background:rgba(124,111,247,.15);color:var(--accent);padding:2px 8px;border-radius:8px">'+taskComments.length+'</span></div>'
          +(taskComments.length ? taskComments.map(function(c){
            var d=new Date(c.at);
            var ts=d.getDate()+'/'+(d.getMonth()+1)+'/'+d.getFullYear()+' '+d.getHours().toString().padStart(2,'0')+':'+d.getMinutes().toString().padStart(2,'0');
            return '<div style="background:var(--surface);border:1px solid rgba(124,111,247,.2);border-radius:10px;padding:10px 14px;margin-bottom:6px">'
              +'<div style="display:flex;justify-content:space-between;margin-bottom:4px">'
                +'<span style="font-size:11px;font-weight:700;color:var(--accent)">'+escapeHtml(c.author||'')+'</span>'
                +'<span style="font-size:10px;color:var(--text3)">'+ts+'</span>'
              +'</div>'
              +'<div style="font-size:13px;color:var(--text2);line-height:1.6">'+escapeHtml(c.text)+'</div>'
            +'</div>';
          }).join('') : '<div style="text-align:center;font-size:12px;color:var(--text3);padding:8px">لا ملاحظات بعد</div>')
          +'<div style="display:flex;gap:8px;margin-top:10px">'
            +'<textarea id="_mtc-main-'+tid+'" rows="2" style="flex:1;padding:8px 12px;background:var(--surface);border:1px solid var(--border);border-radius:10px;font-size:13px;color:var(--text);resize:none;font-family:var(--font)" placeholder="أضف ملاحظة..."></textarea>'
            +'<button id="_mtc-submit-'+tid+'" style="padding:10px 16px;background:var(--accent);color:#fff;border:none;border-radius:10px;cursor:pointer;font-size:13px;align-self:flex-end"><i class="fa-solid fa-paper-plane"></i></button>'
          +'</div>'
        +'</div>';

        // Status buttons
        var statusBtns = !t.done
          ? '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:16px;padding-top:14px;border-top:1px solid var(--border)">'
              +'<span style="font-size:12px;color:var(--text3);align-self:center">تغيير الحالة:</span>'
              +(curSt!=='done'?'<button data-st-action="done" style="padding:7px 14px;background:var(--accent3);color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:12px;font-weight:700"><i class="fa-solid fa-check"></i> مكتمل</button>':'')
              +(curSt!=='progress'?'<button data-st-action="progress" style="padding:7px 14px;background:var(--accent2)22;color:var(--accent2);border:1px solid var(--accent2)44;border-radius:8px;cursor:pointer;font-size:12px">⚡ جاري</button>':'')
              +(curSt!=='paused'?'<button data-st-action="paused" style="padding:7px 14px;background:rgba(100,100,100,.2);color:var(--text2);border:1px solid var(--border);border-radius:8px;cursor:pointer;font-size:12px">⏸ موقوف</button>':'')
              +(curSt!=='review'?'<button data-st-action="review" style="padding:7px 14px;background:rgba(247,201,72,.15);color:#f7c948;border:1px solid rgba(247,201,72,.3);border-radius:8px;cursor:pointer;font-size:12px">🔍 مراجعة</button>':'')
            +'</div>'
          : '<div style="margin-top:14px"><button data-st-action="progress" style="padding:7px 14px;background:var(--surface2);color:var(--text2);border:1px solid var(--border);border-radius:8px;cursor:pointer;font-size:12px">↩ إعادة فتح</button></div>';

        return '<div class="modal" style="max-width:580px;max-height:92vh;overflow-y:auto;padding:0">'
          // Header
          +'<div style="background:linear-gradient(135deg,rgba(124,111,247,.15),rgba(79,209,165,.08));padding:18px 20px;border-radius:12px 12px 0 0;position:sticky;top:0;backdrop-filter:blur(8px);z-index:2">'
            +'<div style="display:flex;align-items:flex-start;gap:12px">'
              +'<div style="flex:1">'
                +'<div style="font-size:10px;font-weight:700;color:var(--accent3);margin-bottom:4px"><i class="fa-solid fa-users"></i> '+escapeHtml(membership.ownerName)+' — '+escapeHtml(membership.teamName)+'</div>'
                +'<div style="font-size:18px;font-weight:900;line-height:1.3">'+escapeHtml(t.title)+'</div>'
                +'<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px;font-size:11px">'
                  +'<span style="color:'+stColors[curSt]+'">'+stLabels[curSt]+'</span>'
                  +(t.client?'<span style="color:var(--text3)"><i class="fa-solid fa-user"></i> '+escapeHtml(t.client)+'</span>':'')
                  +(t.deadline?'<span style="color:'+(isLate?'var(--accent4)':(daysLeft<=2?'var(--accent2)':'var(--text3)'))+'">'+(isLate?'⚠️ متأخرة':(t.done?'✅ منجزة':daysLeft+' يوم'))+'</span>':'')
                  +(t.workerAmount?'<span style="color:var(--accent2);font-weight:700">💰 '+Number(t.workerAmount).toLocaleString()+' ج</span>':'')
                +'</div>'
              +'</div>'
              +'<button id="_mtd-close" style="width:32px;height:32px;border-radius:8px;background:rgba(0,0,0,.2);border:none;color:var(--text);cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="fa-solid fa-xmark"></i></button>'
            +'</div>'
          +'</div>'
          // Body
          +'<div style="padding:16px 20px">'
            +stepsHTML
            +commentsHTML
            +statusBtns
          +'</div>'
        +'</div>';
      }

      function _bindDetailEvents(){
        // Close
        var closeBtn = ov.querySelector('#_mtd-close');
        if(closeBtn) closeBtn.onclick = function(){ ov.remove(); };
        ov.onclick = function(e){ if(e.target===ov) ov.remove(); };

        // Status change
        ov.querySelectorAll('[data-st-action]').forEach(function(btn){
          btn.onclick = async function(){
            var st = this.dataset.stAction;
            curSt = st; t.status=st; t.done=(st==='done');
            if(t.done){ var mem=membership; var i=mem.tasks.findIndex(function(x){return String(x.id)===tid;}); if(i>-1){mem.doneTasks.unshift(mem.tasks[i]);mem.tasks.splice(i,1);} }
            else { var doneI=membership.doneTasks.findIndex(function(x){return String(x.id)===tid;}); if(doneI>-1){membership.tasks.push(membership.doneTasks[doneI]);membership.doneTasks.splice(doneI,1);} }
            ov.querySelector('.modal').innerHTML = _buildDetailHTML().match(/<div class="modal"[^>]*>([\s\S]*)<\/div>$/)[0]; ov.querySelector('.modal').outerHTML; 
            ov.innerHTML = _buildDetailHTML();
            _bindDetailEvents();
            // Sync to owner DB
            try {
              var { data: ownerRow } = await supa.from('studio_data').select('data').eq('user_id', oid).maybeSingle();
              if(!ownerRow) return;
              var od = typeof ownerRow.data==='string' ? JSON.parse(ownerRow.data) : ownerRow.data;
              if(od.data&&!od.tasks) od = typeof od.data==='string'?JSON.parse(od.data):od.data;
              var ot = (od.tasks||[]).find(function(x){return String(x.id)===tid;});
              if(ot){ot.status=st;ot.done=(st==='done');}
              // Add notification for owner about status change
              if(!od._pending_notifications) od._pending_notifications = [];
              var stN={done:'✅ مكتمل',progress:'⚡ جاري',review:'🔍 مراجعة',paused:'⏸ موقوف',new:'🆕 جديد'};
              od._pending_notifications.push({
                id:Date.now(), type:'task_status',
                title:'<i class="fa-solid fa-bolt" style="color:var(--accent2)"></i> تحديث حالة مهمة',
                body: '"'+t.title+'" — '+authorName+' غيّر الحالة إلى: '+(stN[st]||st),
                read:false, created_at:new Date().toISOString()
              });
              await supa.from('studio_data').update({data:JSON.stringify(od),updated_at:new Date().toISOString()}).eq('user_id',oid);
              if(typeof showMiniNotif==='function') showMiniNotif('✅ تم تحديث حالة المهمة');
              // Also refresh team modal behind
              if(typeof _renderMemberTasksSection==='function') _renderMemberTasksSection();
            } catch(e){ console.warn('status sync:', e); }
          };
        });

        // Step toggle
        ov.querySelectorAll('[data-step-toggle]').forEach(function(row){
          row.onclick = async function(){
            var parts = this.dataset.stepToggle.split('-');
            var si = parseInt(parts[parts.length-1]);
            t.steps[si].done = !t.steps[si].done;
            ov.innerHTML = _buildDetailHTML();
            _bindDetailEvents();
            // Sync
            try {
              var { data: ownerRow } = await supa.from('studio_data').select('data').eq('user_id', oid).maybeSingle();
              if(!ownerRow) return;
              var od = typeof ownerRow.data==='string' ? JSON.parse(ownerRow.data) : ownerRow.data;
              if(od.data&&!od.tasks) od = typeof od.data==='string'?JSON.parse(od.data):od.data;
              var ot = (od.tasks||[]).find(function(x){return String(x.id)===tid;});
              if(ot&&ot.steps&&ot.steps[si]) ot.steps[si].done = t.steps[si].done;
              await supa.from('studio_data').update({data:JSON.stringify(od),updated_at:new Date().toISOString()}).eq('user_id',oid);
            } catch(e){}
          };
        });

        // Step comment buttons
        ov.querySelectorAll('[data-step-comment]').forEach(function(btn){
          btn.onclick = async function(){
            var si = parseInt(this.dataset.stepIdx);
            var inputEl = document.getElementById(this.dataset.inputId);
            var text = inputEl ? inputEl.value.trim() : '';
            if(!text) return;
            this.disabled = true;
            var comment = { id:Date.now(), text:text, author:authorName, stepIdx:si, at:new Date().toISOString() };
            if(!t.comments) t.comments=[];
            t.comments.push(comment);
            inputEl.value = '';
            ov.innerHTML = _buildDetailHTML();
            _bindDetailEvents();
            // Sync to owner
            try {
              var { data: ownerRow } = await supa.from('studio_data').select('data').eq('user_id', oid).maybeSingle();
              if(!ownerRow) return;
              var od = typeof ownerRow.data==='string' ? JSON.parse(ownerRow.data) : ownerRow.data;
              if(od.data&&!od.tasks) od = typeof od.data==='string'?JSON.parse(od.data):od.data;
              var ot = (od.tasks||[]).find(function(x){return String(x.id)===tid;});
              if(ot){ if(!ot.comments) ot.comments=[]; ot.comments.push(comment); }
              await supa.from('studio_data').update({data:JSON.stringify(od),updated_at:new Date().toISOString()}).eq('user_id',oid);
              if(typeof showMiniNotif==='function') showMiniNotif('✅ تمت إضافة الملاحظة');
            } catch(e){ console.warn('step comment sync:',e); }
          };
        });

        // Main task comment
        var submitBtn = ov.querySelector('#_mtc-submit-'+tid);
        if(submitBtn) submitBtn.onclick = async function(){
          var ta = document.getElementById('_mtc-main-'+tid);
          var text = ta ? ta.value.trim() : '';
          if(!text) return;
          this.disabled = true;
          var comment = { id:Date.now(), text:text, author:authorName, stepIdx:null, at:new Date().toISOString() };
          if(!t.comments) t.comments=[];
          t.comments.push(comment);
          if(ta) ta.value='';
          ov.innerHTML = _buildDetailHTML();
          _bindDetailEvents();
          try {
            var { data: ownerRow } = await supa.from('studio_data').select('data').eq('user_id', oid).maybeSingle();
            if(!ownerRow) return;
            var od = typeof ownerRow.data==='string' ? JSON.parse(ownerRow.data) : ownerRow.data;
            if(od.data&&!od.tasks) od = typeof od.data==='string'?JSON.parse(od.data):od.data;
            var ot = (od.tasks||[]).find(function(x){return String(x.id)===tid;});
            if(ot){ if(!ot.comments) ot.comments=[]; ot.comments.push(comment); }
            await supa.from('studio_data').update({data:JSON.stringify(od),updated_at:new Date().toISOString()}).eq('user_id',oid);
            if(typeof showMiniNotif==='function') showMiniNotif('✅ تمت إضافة الملاحظة');
          } catch(e){ console.warn('main comment sync:',e); }
        };
      }

      ov.innerHTML = _buildDetailHTML();
      document.body.appendChild(ov);
      _bindDetailEvents();
    };

    // ── Simple task card (click → open full detail) ──
    function _renderTaskCard(t, isActive){
      var isLate = t.deadline && new Date(t.deadline) < new Date() && !t.done;
      var daysLeft = t.deadline ? Math.ceil((new Date(t.deadline) - new Date()) / 864e5) : null;
      var stepsTotal = (t.steps||[]).length;
      var stepsDone  = (t.steps||[]).filter(function(s){ return s.done; }).length;
      var pct = stepsTotal ? Math.round(stepsDone/stepsTotal*100) : (t.done?100:0);
      var stColors = {new:'var(--accent2)',progress:'var(--accent)',review:'#f7c948',paused:'var(--text3)',done:'var(--accent3)'};
      var stLabels = {new:'🆕 جديد',progress:'⚡ جاري',review:'🔍 مراجعة',paused:'⏸ موقوف',done:'✅ مكتمل'};
      var curSt = t.status||'new';
      var commentsCount = (t.comments||[]).length;

      return '<div style="background:var(--surface2);border:1px solid var(--border);border-right:3px solid '+(isLate?'var(--accent4)':(t.done?'var(--accent3)':'var(--accent)'))+';border-radius:12px;padding:12px 14px;margin-bottom:8px;cursor:pointer;transition:opacity .15s" onclick="window._openMemberTaskDetail(\''+t.id+'\')" onmouseenter="this.style.opacity=\'.85\'" onmouseleave="this.style.opacity=\'1\'">'
        +'<div style="display:flex;justify-content:space-between;align-items:flex-start">'
          +'<div style="flex:1;min-width:0">'
            +'<div style="font-size:14px;font-weight:700;margin-bottom:4px;'+(t.done?'text-decoration:line-through;opacity:.7':'')+'">'+escapeHtml(t.title)+'</div>'
            +'<div style="display:flex;gap:8px;flex-wrap:wrap;font-size:11px;color:var(--text3)">'
              +(t.client?'<span><i class="fa-solid fa-user"></i> '+escapeHtml(t.client)+'</span>':'')
              +'<span style="color:'+stColors[curSt]+'">'+stLabels[curSt]+'</span>'
              +(t.workerAmount?'<span style="color:var(--accent2);font-weight:700">💰 '+Number(t.workerAmount).toLocaleString()+' ج</span>':'')
              +(commentsCount?'<span style="color:var(--accent)"><i class="fa-solid fa-comment"></i> '+commentsCount+'</span>':'')
            +'</div>'
          +'</div>'
          +(t.deadline?'<div style="font-size:10px;font-weight:700;color:'+(isLate?'var(--accent4)':(daysLeft<=2?'var(--accent2)':'var(--accent3)'))+';flex-shrink:0;text-align:left;padding-right:6px">'+(isLate?'⚠️ متأخرة':(t.done?'✅ منجزة':daysLeft+' يوم'))+'</div>':'')
        +'</div>'
        +(stepsTotal?'<div style="margin-top:8px"><div style="height:3px;background:var(--surface3);border-radius:2px;overflow:hidden"><div style="height:100%;width:'+pct+'%;background:linear-gradient(90deg,var(--accent),var(--accent3))"></div></div><div style="font-size:10px;color:var(--text3);margin-top:2px">'+stepsDone+'/'+stepsTotal+' خطوات</div></div>':'')
        +'<div style="font-size:10px;color:var(--accent);margin-top:8px"><i class="fa-solid fa-arrow-left"></i> اضغط لفتح التفاصيل وتعديل الحالة</div>'
      +'</div>';
    }

    function _renderModalBody(){
      var tasks2 = membership.tasks || [];
      var doneTasks2 = membership.doneTasks || [];
      return '<div style="background:linear-gradient(135deg,rgba(124,111,247,.12),rgba(79,209,165,.08));padding:20px 24px;border-radius:var(--radius) var(--radius) 0 0;position:sticky;top:0;backdrop-filter:blur(8px);z-index:2">'
          +'<div style="display:flex;align-items:center;gap:14px">'
            +(membership.ownerLogo&&typeof _validImgSrc==="function"&&_validImgSrc(membership.ownerLogo)?'<img src="'+escapeHtml(membership.ownerLogo)+'" style="width:52px;height:52px;border-radius:14px;object-fit:cover">':'<div style="width:52px;height:52px;border-radius:14px;background:linear-gradient(135deg,var(--accent),var(--accent3));display:flex;align-items:center;justify-content:center;font-size:24px"><i class="fa-solid fa-building"></i></div>')
            +'<div style="flex:1">'
              +'<div style="font-size:17px;font-weight:900">'+escapeHtml(membership.ownerName)+'</div>'
              +'<div style="font-size:12px;color:var(--text3)">'+escapeHtml(membership.teamName)+' · دورك: <strong style="color:var(--accent)">'+escapeHtml(membership.role||'عضو')+'</strong></div>'
            +'</div>'
            +'<button class="close-btn" id="_mmt-close"><i class="fa-solid fa-xmark"></i></button>'
          +'</div>'
          +'<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:16px">'
            +'<div style="background:rgba(0,0,0,.2);border-radius:10px;padding:10px;text-align:center"><div style="font-size:22px;font-weight:900;color:var(--accent2)">'+tasks2.length+'</div><div style="font-size:10px;color:var(--text3)">مهام نشطة</div></div>'
            +'<div style="background:rgba(0,0,0,.2);border-radius:10px;padding:10px;text-align:center"><div style="font-size:22px;font-weight:900;color:var(--accent3)">'+doneTasks2.length+'</div><div style="font-size:10px;color:var(--text3)">مكتملة</div></div>'
            +'<div style="background:rgba(0,0,0,.2);border-radius:10px;padding:10px;text-align:center"><div style="font-size:22px;font-weight:900;color:var(--accent4)">'+tasks2.filter(function(t){return t.deadline&&new Date(t.deadline)<new Date();}).length+'</div><div style="font-size:10px;color:var(--text3)">متأخرة</div></div>'
          +'</div>'
        +'</div>'
        +'<div style="padding:20px">'
          +'<div style="font-size:13px;font-weight:800;margin-bottom:12px"><i class="fa-solid fa-clipboard-list"></i> مهامي النشطة <span style="background:rgba(247,201,72,.2);color:var(--accent2);padding:2px 8px;border-radius:8px;font-size:10px">'+tasks2.length+'</span></div>'
          +(tasks2.length ? tasks2.map(function(t){ return _renderTaskCard(t, true); }).join('') : '<div style="text-align:center;padding:20px;color:var(--text3)"><i class="fa-solid fa-square-check" style="font-size:28px;color:var(--accent3);display:block;margin-bottom:8px"></i>لا مهام نشطة الآن</div>')
          +(doneTasks2.length ? '<div style="font-size:13px;font-weight:800;margin-top:16px;margin-bottom:10px;color:var(--accent3)"><i class="fa-solid fa-square-check"></i> مكتملة ('+doneTasks2.length+')</div>'
            +doneTasks2.slice(0,10).map(function(t){ return _renderTaskCard(t, false); }).join('') : '')
        +'</div>';
    }

    function _bindModalEvents(){
      var modal = overlay.querySelector('.modal');
      var closeBtn = modal.querySelector('#_mmt-close');
      if(closeBtn) closeBtn.onclick = function(){ overlay.remove(); };
    }

    overlay.innerHTML = '<div class="modal" style="max-width:560px;max-height:92vh;overflow-y:auto;padding:0">'+_renderModalBody()+'</div>';
    _bindModalEvents();
  }

  _buildModal();
  document.body.appendChild(overlay);
  overlay.onclick = function(e){ if(e.target===overlay) overlay.remove(); };
};


