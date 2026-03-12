// ============================================================
// TEAMS
// ============================================================
let teamMembersForm = []; // members being added in form

function openTeamModal(id){
  teamMembersForm = [];
  document.getElementById('team-modal-ttl').innerHTML = id ? '<i class="fa-solid fa-users"></i> تعديل الفريق' : '<i class="fa-solid fa-users"></i> فريق جديد';
  document.getElementById('team-eid').value = id||'';
  if(id){
    const team = S.teams.find(t=>t.id===id); if(!team) return;
    document.getElementById('team-name').value = team.name;
    document.getElementById('team-desc').value = team.desc||'';
    teamMembersForm = team.members.map(m=>({...m}));
  } else {
    document.getElementById('team-name').value = '';
    document.getElementById('team-desc').value = '';
  }
  renderTeamMembersForm();
  openM('modal-team');
}

function renderTeamMembersForm(){
  const el = document.getElementById('team-members-list'); if(!el) return;
  if(!teamMembersForm.length){
    el.innerHTML = '<div style="font-size:12px;color:var(--text3);padding:10px;text-align:center;background:var(--surface2);border-radius:8px">لا أعضاء بعد — أضف أعضاء من الأسفل</div>';
    return;
  }
  const roleIcon = {'كونتنت كريتور':'<i class="fa-solid fa-pen-nib"></i>','مستقل':'<i class="fa-solid fa-user"></i>','فيديو إديتور':'<i class="fa-solid fa-clapperboard"></i>','مودريتور':'<i class="fa-solid fa-comments"></i>','أخرى':'<i class="fa-solid fa-thumbtack"></i>'};
  el.innerHTML = teamMembersForm.map((m,i)=>`
    <div style="display:flex;align-items:center;gap:10px;background:var(--surface2);border:1px solid ${m.linked ? 'rgba(79,209,165,.5)' : 'var(--border)'};border-radius:8px;padding:10px 14px">
      <div style="flex:1">
        <div style="font-weight:700;font-size:13px;display:flex;align-items:center;gap:6px;flex-wrap:wrap">
          ${escapeHtml(roleIcon[m.role]||'<i class="fa-solid fa-user"></i>')} ${escapeHtml(m.name)}
          ${m.linked ? '<span style="font-size:10px;background:rgba(79,209,165,.15);color:var(--accent3);padding:2px 7px;border-radius:6px;font-weight:700"><i class="fa-solid fa-check"></i> حساب مرتبط</span>' : ''}
          ${(m.email && !m.linked) ? '' : ''}
        </div>
        <div style="font-size:11px;color:var(--text3);margin-top:2px">
          ${escapeHtml(m.role)}${m.phone ? ' · <i class="fa-solid fa-phone"></i>' + escapeHtml(m.phone) : ''}${m.email ? ' · <i class="fa-solid fa-envelope"></i> ' + escapeHtml(m.email) : ''}${m.rate ? ' · نسبة ' + m.rate + '%' : ''}
        </div>
      </div>
      <button class="btn btn-danger btn-sm" onclick="removeTeamMember(${i})"><i class="fa-solid fa-xmark"></i></button>
    </div>`).join('');
}

async function addMemberToForm(){
  const name  = document.getElementById('member-name')?.value.trim();
  const email = (document.getElementById('member-email')?.value||'').trim().toLowerCase();
  if(!name) return alert('أدخل اسم العضو');

  const addBtn = document.querySelector('[onclick="addMemberToForm()"]');
  if(addBtn){ addBtn.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> جاري التحقق...'; addBtn.disabled=true; }

  // timeout حماية: لو البحث اخد أكثر من 4 ثواني - أكمل بدونه
  const _addTimeout = setTimeout(() => {
    if(addBtn && addBtn.disabled) {
      addBtn.innerHTML='+ إضافة'; addBtn.disabled=false;
      showMiniNotif('<i class="fa-solid fa-triangle-exclamation"></i> تعذر التحقق من الحساب - تم الإضافة كدعوة معلقة');
    }
  }, 4000);

  let linked = false;
  let linkedUserId = null;

  if(email){
    try {
      // بحث سريع: نشوف لو في row في studio_data settings.email == email
      // نستخدم limit صغير وبدون جلب data كاملة
      const { data: emailRows } = await supa.from('studio_data')
        .select('user_id')
        .ilike('data', '%"email":"'+email+'"%')
        .limit(5)
        .maybeSingle()
        .catch(() => ({data: null}));

      if(emailRows?.user_id){
        linked = true;
        linkedUserId = emailRows.user_id;
      }

      // Fallback: profiles table
      if(!linked){
        const { data: prof } = await supa.from('profiles')
          .select('id').eq('email', email).maybeSingle()
          .catch(() => ({data: null}));
        if(prof?.id){ linked=true; linkedUserId=prof.id; }
      }
    } catch(e){
      console.warn('Member lookup:', e.message);
      // مش مشكلة لو فشل البحث - العضو بيتضاف عادي كدعوة معلقة
    }
  }

  teamMembersForm.push({
    name,
    role        : document.getElementById('member-role')?.value||'أخرى',
    phone       : document.getElementById('member-phone')?.value||'',
    email,
    extraSpecs  : (document.getElementById('member-extra-specs')?.value||'').split(',').map(s=>s.trim()).filter(Boolean),
    rate        : +(document.getElementById('member-rate')?.value)||0,
    linked,
    linkedUserId: linkedUserId||null,
    addedAt     : new Date().toISOString(),
  });

  ['member-name','member-phone','member-email','member-rate','member-extra-specs'].forEach(id=>{
    const el=document.getElementById(id); if(el) el.value='';
  });
  clearTimeout(_addTimeout);
  if(addBtn){ addBtn.innerHTML='+ إضافة'; addBtn.disabled=false; }
  renderTeamMembersForm();

  if(linked)        showMiniNotif('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> '+name+' — حساب موجود، سيتم ربطه تلقائياً');
  else if(email)    showMiniNotif('⏳ '+name+' — لا يوجد حساب بعد، دعوة معلقة');
}

function removeTeamMember(i){
  teamMembersForm.splice(i,1);
  renderTeamMembersForm();
}

async function saveTeam(){
  const name = document.getElementById('team-name')?.value.trim();
  if(!name) return alert('أدخل اسم الفريق');
  const eid = document.getElementById('team-eid')?.value;

  const oldTeam = eid ? (S.teams||[]).find(t=>String(t.id)===String(eid)) : null;
  const oldMemberEmails = oldTeam ? (oldTeam.members||[]).map(m=>(m.email||'').toLowerCase().trim()).filter(Boolean) : [];

  const d = {
    name,
    desc   : document.getElementById('team-desc')?.value||'',
    members: teamMembersForm.map(m=>({...m})),
  };
  if(eid){
    const i = S.teams.findIndex(t=>t.id==eid);
    if(i>-1){ d.id=+eid; S.teams[i]=d; }
  } else {
    d.id = Date.now();
    S.teams.push(d);
  }
  // ✅ FIX: force save regardless of _appReady state
  if(window._appReady && window._cloudLoadDone){ lsSave(); cloudSave(S); }
  else { try{ if(typeof _doCloudSave==='function') _doCloudSave(S,true); else { window._appReady=true;window._cloudLoadDone=true;lsSave(); } }catch(e){ window._appReady=true;window._cloudLoadDone=true;lsSave(); } }
  closeM('modal-team'); renderTeams();
  fillWorkerMembersDD();
  showMiniNotif('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم حفظ الفريق: '+name);

  if(typeof supa === 'undefined') return;
  const newMembers = d.members.filter(m=>m.email && !oldMemberEmails.includes((m.email||'').toLowerCase().trim()));
  if(!newMembers.length) return;

  const ownerName  = (S.settings&&S.settings.name)||'مشرف';
  const ownerEmail = (S.settings&&S.settings.email)||'';

  for(const m of newMembers){
    try {
      const email = (m.email||'').toLowerCase().trim();
      if(!email) continue;

      // Find target user_id — Method 1: RPC by email
      let targetUserId = m.linkedUserId || null;
      if(!targetUserId){
        try{
          const { data: rpcId } = await supa.rpc('get_user_id_by_email', { p_email: email }).catch(()=>({data:null}));
          if(rpcId) targetUserId = rpcId;
        }catch(e){}
      }

      // Method 2: scan auth_users via admin (may not work with anon key — fallback only)
      if(!targetUserId){
        try{
          const { data: pr } = await supa.from('profiles').select('id').eq('email', email).maybeSingle().catch(()=>({data:null}));
          if(pr) targetUserId = pr.id;
        }catch(e){}
      }

      if(!targetUserId){
        showMiniNotif('⚠️ '+m.name+' — لم يُعثر على حساب بهذا الإيميل');
        continue;
      }

      // ── Deliver notification via user_notifications table (no RLS problem) ──
      const notifRow = {
        user_id    : targetUserId,
        title      : 'تمت إضافتك لفريق!',
        body       : 'تمت إضافتك كـ '+(m.role||'عضو')+' في فريق "'+name+'" بواسطة '+ownerName,
        type       : 'team_added',
        data       : JSON.stringify({ teamId: d.id, teamName: name, memberRole: m.role, ownerName, ownerEmail, ownerUserId: _supaUserId }),
        read       : false,
        created_at : new Date().toISOString()
      };

      const { error: notifErr } = await supa.from('user_notifications').insert([notifRow]).catch(e=>({error:e}));

      if(notifErr){
        // Fallback: write to studio_data if we somehow have access
        console.warn('user_notifications insert failed:', notifErr.message, '— trying studio_data fallback');
        try{
          const { data: tgtRow } = await supa.from('studio_data').select('data').eq('user_id',targetUserId).maybeSingle().catch(()=>({data:null}));
          if(tgtRow && tgtRow.data){
            let ud2 = typeof tgtRow.data==='string' ? JSON.parse(tgtRow.data) : tgtRow.data;
            ud2._pending_notifications = ud2._pending_notifications||[];
            const alreadyEx = ud2._pending_notifications.find(n=>n.type==='team_added'&&String(n.teamId)===String(d.id));
            if(!alreadyEx){
              ud2._pending_notifications.push({ id:Date.now()+'_ta', title:'تمت إضافتك لفريق!', body:notifRow.body, type:'team_added', teamId:d.id, teamName:name, ownerName:ownerName, ownerUserId:_supaUserId, memberRole:m.role||'عضو', created_at:notifRow.created_at, read:false });
              await supa.from('studio_data').update({data:JSON.stringify(ud2),updated_at:new Date().toISOString()}).eq('user_id',targetUserId).catch(()=>null);
            }
          }
        }catch(e2){}
        showMiniNotif('⚠️ تم الحفظ لكن قد لا يصل إشعار لـ '+m.name);
      } else {
        showMiniNotif('✅ تمت إضافة '+m.name+' وسيصله إشعار');
      }
    } catch(e){ console.warn('Team notify err:', m.name, e); }
  }
}


function delTeam(id){
  confirmDel('هل تريد حذف هذا الفريق؟',()=>{
    S.teams = S.teams.filter(t=>t.id!==id);
    lsSave(); renderTeams();
  });
}

function renderTeams(){
  const grid = document.getElementById('teams-grid'); if(!grid) return;
  if(!S.teams.length){
    grid.innerHTML = '<div class="empty card" style="grid-column:span 3"><div class="empty-icon"><i class="fa-solid fa-people-group"></i></div>لا فرق بعد — أضف فريق عمل<br><div style="margin-top:12px"><button class="btn btn-primary" onclick="openTeamModal()" data-i18n="btn_new_team"><i class="fa-solid fa-plus" style="margin-left:4px"></i> فريق جديد</button></div></div>';
    // Update badge
    const badge = document.getElementById('team-badge'); if(badge) badge.style.display='none';
    return;
  }
  const roleIcon = {'كونتنت كريتور':'<i class="fa-solid fa-pen-nib"></i>','مستقل':'<i class="fa-solid fa-user"></i>','فيديو إديتور':'<i class="fa-solid fa-clapperboard"></i>','مودريتور':'<i class="fa-solid fa-comments"></i>','أخرى':'<i class="fa-solid fa-thumbtack"></i>'};
  // Count total members
  const totalMembers = S.teams.reduce((s,t)=>s+t.members.length,0);
  const badge = document.getElementById('team-badge');
  if(badge){ badge.style.display='none'; }

  // Also render "teams I'm a member of"
  renderMyMemberTeams();

  grid.innerHTML = S.teams.map(team=>`
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
        <div>
          <div style="font-size:16px;font-weight:700"><i class="fa-solid fa-users"></i> ${team.name}</div>
          ${team.desc?`<div style="font-size:12px;color:var(--text3);margin-top:3px">${team.desc}</div>`:''}
        </div>
        <div style="display:flex;gap:4px">
          <button class="btn btn-ghost btn-sm" onclick="openTeamModal(${team.id})"><i class="fa-solid fa-pen"></i></button>
          <button class="btn btn-danger btn-sm" onclick="delTeam(${team.id})"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
      <div style="font-size:11px;font-weight:700;color:var(--text3);margin-bottom:8px">الأعضاء (${team.members.length})</div>
      <div style="display:flex;flex-direction:column;gap:6px">
        ${team.members.map(m=>{
          const mTasks = S.tasks.filter(t=>t.workerMember===m.name&&!t.done).length;
          const borderColor = m.linked ? 'rgba(79,209,165,.4)' : 'var(--border)';
          return `<div onclick="openMemberProfile('${escapeHtml(m.name).replace(/'/g,"&#039;")}')" class="task-clickable" style="display:flex;align-items:center;gap:8px;background:var(--surface2);border:1px solid ${borderColor};border-radius:8px;padding:8px 10px;cursor:pointer">
            <div style="font-size:18px">${roleIcon[m.role]||'<i class="fa-solid fa-user"></i>'}</div>
            <div style="flex:1;min-width:0">
              <div style="font-size:12px;font-weight:700;display:flex;align-items:center;gap:5px;flex-wrap:wrap">
                ${escapeHtml(m.name)}
                ${m.linked ? '<span style="font-size:9px;background:rgba(79,209,165,.15);color:var(--accent3);padding:1px 5px;border-radius:5px;font-weight:700"><i class="fa-solid fa-check"></i> مرتبط</span>' : ''}
                ${(m.email && !m.linked) ? '' : ''}
              </div>
              <div style="font-size:11px;color:var(--text3)">${escapeHtml(m.role)}${m.rate?' · '+m.rate+'%':''}</div>
            </div>
            ${mTasks?`<span style="font-size:10px;background:rgba(247,201,72,.2);color:var(--accent2);padding:2px 7px;border-radius:10px;font-weight:700">${mTasks} مهام</span>`:''}
            ${m.phone?`<a href="https://wa.me/${escapeHtml(m.phone.replace(/[^\d]/g,''))}" target="_blank" onclick="event.stopPropagation()" style="font-size:16px;text-decoration:none" title="واتساب"><i class="fa-solid fa-comments"></i></a>`:''}
            <span style="font-size:11px;color:var(--text3)">←</span>
          </div>`;
        }).join('')}
      </div>
    </div>`).join('');
}

// ============================================================
// SUBSCRIPTIONS
// ============================================================
function openSubscriptionModal(){
  renderSubsList();
  openM('modal-subscription');
}

function renderSubsList(){
  renderSubsWithReminder();
}

function addSubscription(){
  const name = document.getElementById('sub-name')?.value.trim();
  const amount = +(document.getElementById('sub-amount')?.value)||0;
  const day = +(document.getElementById('sub-day')?.value)||1;
  const cat = document.getElementById('sub-cat')?.value||'برامج واشتراكات';
  if(!name||!amount) return alert('أدخل اسم الاشتراك والمبلغ');
  if(!S.subscriptions) S.subscriptions=[];
  S.subscriptions.push({name,amount,day,cat});
  lsSave();
  renderSubsList();
  ['sub-name','sub-amount','sub-day'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  showMiniNotif('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم إضافة الاشتراك: '+name);
}

function renewSubscription(i){
  const s = S.subscriptions[i]; if(!s) return;
  S.transactions.push({
    id:Date.now(), type:'expense', amount:s.amount,
    source:s.cat||'برامج واشتراكات', desc:'تجديد اشتراك: '+s.name,
    isoDate:new Date().toISOString().split('T')[0],
    date:new Date().toLocaleDateString('ar-EG')
  });
  lsSave(); renderAll();
  showMiniNotif('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم تسجيل تجديد اشتراك '+s.name+': '+s.amount.toLocaleString()+' ج');
}

function delSubscription(i){
  S.subscriptions.splice(i,1);
  lsSave(); renderSubsList();
}


// ============================================================
// TASK VIEW SWITCH
// ============================================================
function switchTaskView(mode){
  const kanban = document.getElementById('kanban-view');
  const list   = document.getElementById('list-view');
  const table  = document.getElementById('table-view');
  const kb = document.getElementById('view-kanban-btn');
  const lb = document.getElementById('view-list-btn');
  const tb = document.getElementById('view-table-btn');
  const acc = 'var(--accent)';
  // Reset all
  [kanban,list,table].forEach(el=>{ if(el) el.style.display='none'; });
  [kb,lb,tb].forEach(btn=>{ if(btn){ btn.style.background='transparent'; btn.style.color='var(--text3)'; } });
  if(mode==='kanban'){
    if(kanban) kanban.style.display='block';
    if(kb){ kb.style.background=acc; kb.style.color='#fff'; }
  } else if(mode==='list'){
    if(list) list.style.display='block';
    if(lb){ lb.style.background=acc; lb.style.color='#fff'; }
  } else if(mode==='table'){
    if(table) table.style.display='block';
    if(tb){ tb.style.background=acc; tb.style.color='#fff'; }
    _renderTasksTable();
  }
  localStorage.setItem('studioTaskView', mode);
}

// ── جدول المهام الكامل مع تغيير الحالة inline ──
function _renderTasksTable(){
  var tbody = document.getElementById('tasks-table-body');
  var countEl = document.getElementById('tasks-table-count');
  if(!tbody) return;
  var filtered = filterTasks(S.tasks);
  if(countEl) countEl.textContent = filtered.length + ' مهمة';

  var allCustomStatuses = S.customStatuses||[];
  var baseStatuses = [
    {id:'new',      label:'جديد',         color:'var(--text3)'},
    {id:'progress', label:'قيد التنفيذ',  color:'var(--accent2)'},
    {id:'review',   label:'مراجعة',       color:'var(--accent)'},
    {id:'paused',   label:'موقوف',        color:'#64b5f6'},
    {id:'done',     label:'مكتمل',        color:'var(--accent3)'}
  ];
  allCustomStatuses.forEach(function(cs){
    if(cs.id && cs.label && !baseStatuses.find(function(b){return b.id===cs.id;})){
      baseStatuses.push({id:cs.id, label:cs.label, color:cs.color||'var(--accent)'});
    }
  });

  function stSelect(t){
    var cur = baseStatuses.find(function(s){return s.id===(t.status||'new');})||{label:t.status||'جديد',color:'#888'};
    var opts = baseStatuses.map(function(s){
      return '<option value="'+s.id+'"'+(t.status===s.id?' selected':'')+'>'+s.label+'</option>';
    }).join('');
    return '<div style="position:relative;display:inline-block">'
      +'<select data-tid="'+t.id+'" onchange="_changeRegTaskStatusFromTable(this.dataset.tid,this.value)" '
        +'style="appearance:none;-webkit-appearance:none;font-size:10px;font-weight:800;padding:3px 24px 3px 10px;border-radius:20px;background:'+cur.color+'22;color:'+cur.color+';border:1.5px solid '+cur.color+'55;cursor:pointer;outline:none;font-family:var(--font)">'
        +opts
      +'</select>'
      +'<span style="position:absolute;left:7px;top:50%;transform:translateY(-50%);pointer-events:none;font-size:8px;color:'+cur.color+'">▾</span>'
    +'</div>';
  }

  var payBadge = {
    none:    '<span style="font-size:10px;color:#f76f7c;font-weight:700">غير مدفوع</span>',
    deposit: '<span style="font-size:10px;color:#a78bfa;font-weight:700">عربون</span>',
    full:    '<span style="font-size:10px;color:#4fd1a5;font-weight:700">✓ مدفوع</span>'
  };

  if(!filtered.length){
    tbody.innerHTML='<tr><td colspan="7" style="text-align:center;color:var(--text3);padding:32px;font-size:13px">لا توجد مهام تطابق الفلتر</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(function(t, idx){
    var rowBg = idx%2===0?'var(--surface)':'var(--surface2)';
    var isDone = t.done||t.status==='done';
    var isLate = t.deadline && new Date(t.deadline)<new Date() && !isDone;
    var projLink = t.projectLink||t.driveLink||'';
    return '<tr style="background:'+rowBg+';transition:background .12s" '
      +'onmouseover="this.style.background=\'var(--surface3)\'" '
      +'onmouseout="this.style.background=\''+rowBg+'\'" '
      +'onclick="openTaskDetail('+t.id+')" '
      +'style="cursor:pointer">'
      +'<td style="padding:10px 14px;font-weight:700;border-bottom:1px solid var(--border);max-width:220px">'
        +'<div style="'+(isDone?'text-decoration:line-through;color:var(--text3)':'')+';white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+escapeHtml(t.title||'')+'</div>'
        +(projLink&&isDone?'<div style="font-size:9px;color:var(--accent3);margin-top:2px"><i class="fa-solid fa-link"></i> رابط التسليم متاح</div>':'')
      +'</td>'
      +'<td style="padding:10px 8px;text-align:center;border-bottom:1px solid var(--border);color:var(--text3);font-size:11px">'+(escapeHtml(t.client||'—'))+'</td>'
      +'<td style="padding:10px 8px;text-align:center;border-bottom:1px solid var(--border)" onclick="event.stopPropagation()">'+stSelect(t)+'</td>'
      +'<td style="padding:10px 8px;text-align:center;border-bottom:1px solid var(--border);color:var(--text3);font-size:11px;font-family:var(--mono)">'+(t.orderDate||'—')+'</td>'
      +'<td style="padding:10px 8px;text-align:center;border-bottom:1px solid var(--border);font-size:11px;font-family:var(--mono);color:'+(isLate?'#f76f7c':'var(--text3)')+'"><span title="'+(isLate?'متأخرة':'')+'">'+(t.deadline||'—')+'</span></td>'
      +'<td style="padding:10px 8px;text-align:center;border-bottom:1px solid var(--border)">'
        +(t.value>0?'<div style="font-weight:900;color:#f7c948;font-size:12px">'+t.value.toLocaleString()+' ج</div>':'<span style="color:var(--text3)">—</span>')
        +(t.value>0?'<div>'+( payBadge[t.pay||'none']||'')+'</div>':'')
      +'</td>'
      +'<td style="padding:10px 8px;text-align:center;border-bottom:1px solid var(--border)" onclick="event.stopPropagation()">'
        +'<div style="display:flex;gap:4px;justify-content:center">'
          +'<button data-tid="'+t.id+'" onclick="openTaskModal(this.dataset.tid)" class="btn btn-ghost btn-sm" style="padding:3px 7px;font-size:11px"><i class="fa-solid fa-pen"></i></button>'
          +'<button data-tid="'+t.id+'" onclick="delTask(this.dataset.tid)" class="btn btn-danger btn-sm" style="padding:3px 7px;font-size:11px"><i class="fa-solid fa-trash"></i></button>'
        +'</div>'
      +'</td>'
    +'</tr>';
  }).join('');
}

function _changeRegTaskStatusFromTable(taskId, newStatus){
  var t = S.tasks.find(function(x){ return String(x.id)===String(taskId); });
  if(!t) return;
  var prevDone = t.done||t.status==='done';
  t.status = newStatus;
  if(newStatus==='done'){
    t.done = true;
    t.doneAt = t.doneAt||new Date().toISOString().split('T')[0];
    if(!prevDone) _askRegularTaskProjectLink(taskId);
  } else {
    t.done = false;
  }
  lsSave(); cloudSave(S);
  // Re-render table without full page refresh
  _renderTasksTable();
  showMiniNotif('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم تغيير الحالة');
}

// ============================================================
// WORKER PAY MODE (% or fixed amount)
// ============================================================
let workerPayMode = 'pct'; // 'pct' or 'fixed'
function setWorkerPayMode(mode){
  workerPayMode = mode;
  const pctBtn   = document.getElementById('worker-pay-pct-btn');
  const fixedBtn = document.getElementById('worker-pay-fixed-btn');
  const pctInput = document.getElementById('t-worker-pct');
  const fixInput = document.getElementById('t-worker-amount');
  const pctSym   = document.getElementById('t-worker-pct-sym');
  if(mode==='pct'){
    if(pctBtn)  { pctBtn.style.background='var(--accent)';   pctBtn.style.color='#fff'; }
    if(fixedBtn){ fixedBtn.style.background='transparent';   fixedBtn.style.color='var(--text3)'; }
    if(pctInput) pctInput.style.display='block';
    if(fixInput) fixInput.style.display='none';
    if(pctSym)   pctSym.style.display='inline';
  } else {
    if(pctBtn)  { pctBtn.style.background='transparent';    pctBtn.style.color='var(--text3)'; }
    if(fixedBtn){ fixedBtn.style.background='var(--accent)';fixedBtn.style.color='#fff'; }
    if(pctInput) pctInput.style.display='none';
    if(fixInput) fixInput.style.display='block';
    if(pctSym)   pctSym.style.display='none';
  }
  calcTaskProfit();
}

