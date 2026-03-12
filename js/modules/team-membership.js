// ═══════════════════════════════════════════════════
// TEAM MEMBERSHIP SYSTEM
// ═══════════════════════════════════════════════════
(function(){

  window._myTeamMemberships = [];

  window._checkTeamMembership = async function(myEmail){
    if(!myEmail || typeof supa==='undefined') return;
    myEmail = myEmail.toLowerCase().trim();
    try {
      // Use user_notifications table — no RLS issues (each user reads own rows)
      if(!_supaUserId) return;
      var { data: notifRows } = await supa
        .from('user_notifications')
        .select('*')
        .eq('user_id', _supaUserId)
        .eq('type', 'team_added')
        .order('created_at', {ascending:false});

      var memberships = [];
      if(notifRows && notifRows.length){
        notifRows.forEach(function(n){
          try{
            var d2 = typeof n.data==='string' ? JSON.parse(n.data||'{}') : (n.data||{});
            var already = memberships.find(function(x){ return x.teamName===d2.teamName && x.ownerName===d2.ownerName; });
            if(!already) memberships.push({
              ownerId   : d2.ownerUserId||'',
              ownerName : d2.ownerName||'مشرف',
              ownerLogo : '',
              teamName  : d2.teamName||'الفريق',
              memberName: n.title||'',
              role      : d2.memberRole||'عضو',
              tasks     : [],
              doneTasks : []
            });
          }catch(e){}
        });
      }

      // Also check local S.teams for membership (if this user IS the owner)
      if(myEmail){
        (S.teams||[]).forEach(function(team){
          (team.members||[]).forEach(function(m){
            if((m.email||'').toLowerCase().trim() === myEmail){
              var already = memberships.find(function(x){ return x.teamName===team.name && x.ownerId==='local'; });
              if(!already) memberships.push({ ownerId:'local', ownerName:(S.settings&&S.settings.name)||'مشرف', ownerLogo:'', teamName:team.name||'الفريق', memberName:m.name, role:m.role||'عضو', tasks:[], doneTasks:[] });
            }
          });
        });
      }

      // ✅ FIX: Scan ALL studio_data to find memberships AND load actual tasks
      try {
        var { data: allRows } = await supa.from('studio_data').select('user_id, data').limit(300);
        if(allRows && allRows.length) {
          allRows.forEach(function(row) {
            if(row.user_id === _supaUserId) return; // skip own data
            try {
              var rd = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
              if(!rd) return;
              if(rd.data && !rd.tasks) rd = typeof rd.data==='string' ? JSON.parse(rd.data) : rd.data;
              var ownerName = (rd.settings && rd.settings.name) || 'مشرف';
              var ownerLogo = (rd.settings && rd.settings.logo) || '';
              var myName = '';
              // Find this user's name in the team member list
              (rd.teams||[]).forEach(function(team) {
                (team.members||[]).forEach(function(m) {
                  if((m.email||'').toLowerCase().trim() === myEmail) {
                    if(m.name) myName = m.name;
                    var alreadyIdx = memberships.findIndex(function(x){ return x.teamName===team.name && x.ownerId===row.user_id; });
                    if(alreadyIdx === -1) {
                      memberships.push({
                        ownerId   : row.user_id,
                        ownerName : ownerName,
                        ownerLogo : ownerLogo,
                        teamName  : team.name||'الفريق',
                        memberName: m.name||'',
                        role      : m.role||'عضو',
                        tasks     : [],
                        doneTasks : [],
                        _ownerData: rd  // cache owner data for task updates
                      });
                    }
                  }
                });
              });

              // Now load tasks assigned to this member from owner's data
              if(myName || myEmail) {
                (rd.tasks||[]).forEach(function(t) {
                  var assignedTo = (t.workerMember||'').trim();
                  // Match by name or email
                  var isMyTask = assignedTo === myName || assignedTo.toLowerCase() === myEmail;
                  if(!isMyTask) return;

                  // Find the membership this task belongs to (match by ownerId)
                  var mem = memberships.find(function(x){ return x.ownerId === row.user_id; });
                  if(!mem) return;

                  var taskEntry = {
                    id         : t.id,
                    title      : t.title||'مهمة',
                    status     : t.status||'new',
                    done       : t.done||false,
                    deadline   : t.deadline||'',
                    client     : t.client||'',
                    steps      : t.steps||[],
                    workerAmount: t.workerAmount||0,
                    ownerId    : row.user_id  // needed for update
                  };

                  if(t.done || t.status === 'done') {
                    mem.doneTasks.push(taskEntry);
                  } else {
                    mem.tasks.push(taskEntry);
                  }
                });

                // ── تحميل مهام المشاريع (project_tasks) المعينة لهذا العضو ──
                (rd.project_tasks||[]).forEach(function(t) {
                  var assignedTo = (t.assignee_name||t.workerMember||'').trim();
                  var isMyTask = assignedTo === myName || assignedTo.toLowerCase() === myEmail;
                  if(!isMyTask) return;

                  var mem = memberships.find(function(x){ return x.ownerId === row.user_id; });
                  if(!mem) return;

                  // Find parent project name
                  var proj = (rd.projects||[]).find(function(p){ return String(p.id)===String(t.project_id); });
                  var projName = proj ? (proj.name||'مشروع') : 'مشروع';

                  var taskEntry = {
                    id          : t.id,
                    title       : t.title||'مهمة',
                    status      : t.status||'todo',
                    done        : t.status==='done',
                    deadline    : t.deadline||'',
                    client      : proj ? (proj.client_name||'') : '',
                    steps       : t.steps||[],
                    workerAmount: t.value||0,
                    ownerId     : row.user_id,
                    isProjectTask: true,
                    projectName : projName,
                    projectId   : t.project_id
                  };

                  if(t.status==='done') {
                    mem.doneTasks.push(taskEntry);
                  } else {
                    mem.tasks.push(taskEntry);
                  }
                });
              }
            } catch(e2) { console.warn('scan row err:', e2); }
          });
        }
      } catch(eScan) { console.warn('studio_data team scan:', eScan); }

      window._myTeamMemberships = memberships;
      if(typeof renderMyMemberTeams === 'function') renderMyMemberTeams();
      if(typeof _renderMemberTasksSection === 'function') _renderMemberTasksSection();
      _updateInboxBadge();
      if(memberships.length){
        _showTeamMembershipBanner(memberships);
        var knownKey  = 'known_teams_'+(_supaUserId||'g');
        var knownList = JSON.parse(localStorage.getItem(knownKey)||'[]');
        var newTeams  = memberships.filter(function(m){ return !knownList.includes(m.ownerName+'_'+m.teamName); });
        if(newTeams.length){
          newTeams.forEach(function(m){ showMiniNotif('<i class="fa-solid fa-users" style="color:var(--accent3)"></i> انضممت لفريق "'+m.teamName+'" — '+m.ownerName); });
          localStorage.setItem(knownKey, JSON.stringify(memberships.map(function(m){ return m.ownerName+'_'+m.teamName; })));
        }
      }
    } catch(e){ console.warn('_checkTeamMembership:', e); }
  };

  // On login: check team_invites table for invites sent to this user's email
  async function _checkPendingTeamInvitesImpl(){
    try{
      if(!_supaUserId) return;
      var myEmail = '';
      try{ var _as=JSON.parse(localStorage.getItem('studioOS_auth_v1')||'{}'); myEmail=(_as.email||'').toLowerCase().trim(); }catch(e){}
      if(!myEmail && S.settings && S.settings.email) myEmail = (S.settings.email||'').toLowerCase().trim();
      if(!myEmail) return;
      var pendingInvs = null;
      try{
        var _r = await supa.from('team_invites').select('*').eq('to_email', myEmail).in('status',['pending','delivered']);
        pendingInvs = _r.data;
      }catch(e){ return; }
      if(!pendingInvs || !pendingInvs.length) return;
      // فلترة ما سبق قبوله أو رفضه محلياً
      var localAccepted = JSON.parse(localStorage.getItem('_accepted_team_invites_'+(_supaUserId||''))||'[]');
      var localDeclined = JSON.parse(localStorage.getItem('_declined_team_invites_'+(_supaUserId||''))||'[]');
      pendingInvs = pendingInvs.filter(function(p){
        var wasAccepted = localAccepted.some(function(a){ return String(a.teamId)===String(p.team_id); });
        var wasDeclined = localDeclined.includes(String(p.id));
        return !wasAccepted && !wasDeclined;
      });
      if(!pendingInvs.length) return;
      // Deliver each pending invite as a notification
      for(var pinv of pendingInvs){
        var notif;
        try{ notif = typeof pinv.payload==='string' ? JSON.parse(pinv.payload) : pinv.payload; }catch(e){ notif={}; }
        notif = notif || {};
        notif.id        = notif.id || pinv.id;
        notif.type      = 'team_invite';
        notif.teamName  = pinv.team_name;
        notif.teamId    = pinv.team_id;
        notif.ownerName = pinv.owner_name;
        notif.memberName= pinv.member_name;
        notif.memberRole= pinv.member_role;
        notif.status    = 'pending';
        notif.read      = false;
        // Add to notifications if not already there
        var exists = _notifications.find(function(x){ return x.id==='pn_'+notif.id; });
        if(!exists){
          _notifications.unshift({ id:'pn_'+notif.id, msg:'دعوة فريق! ' + notif.body, type:'team_invite', time:notif.created_at, read:false });
          if(typeof _saveNotifications==='function') _saveNotifications();
          if(typeof _updateNotifBell==='function') _updateNotifBell();
        }
        if(typeof window._showTeamInviteDialog==='function'){
          setTimeout(function(){ window._showTeamInviteDialog([notif]); }, 2000);
        }
        // Mark as delivered in team_invites table
        try{ await supa.from('team_invites').update({status:'delivered'}).eq('id',pinv.id); }catch(e){}
      }
    }catch(e){ console.warn('_checkPendingTeamInvites:', e); }
  }
  // Expose globally so it can be called on demand
  window._checkPendingTeamInvitesNow = _checkPendingTeamInvitesImpl;
  // Run immediately on login
  _checkPendingTeamInvitesImpl();
  // Also poll every 30 seconds for new invites
  setInterval(_checkPendingTeamInvitesImpl, 30000);

  (function _startPolling(){
    if(!_supaUserId){ setTimeout(_startPolling, 5000); return; }
    async function _poll(){
      try {
        var res = await supa.from('studio_data').select('data').eq('user_id',_supaUserId).single();
        if(!res.data) return;
        var ud = typeof res.data.data==='string' ? JSON.parse(res.data.data) : res.data.data;
        if(!ud) return;
        if(ud._pending_notifications && ud._pending_notifications.length){
          var newCount = 0;
          var teamInvites = [];
          ud._pending_notifications.forEach(function(n){
            var exists = _notifications.find(function(x){ return x.id==='pn_'+n.id; });
            if(!exists){
              _notifications.unshift({ id:'pn_'+n.id, msg:(n.title?'**'+n.title+'**\n':'')+n.body, type:n.type||'message', orderId:n.orderId||'', time:n.created_at, read:false });
              if(!n.read) newCount++;
              if((n.type==='team' || n.type==='team_invite' || n.type==='team_added') && n.teamName && n.ownerName) teamInvites.push(n);
              // Handle svc_order: pull into S.svc_orders if not already there
              if(n.type==='svc_order' && ud.svc_orders){
                S.svc_orders = S.svc_orders||[];
                ud.svc_orders.forEach(function(o){
                  if(!S.svc_orders.find(function(x){ return x.id===o.id; })){ S.svc_orders.push(o); }
                });
                lsSave();
                if(typeof renderServices==='function') setTimeout(renderServices,200);
                addNotification('<i class="fa-solid fa-inbox"></i> '+n.title+': '+n.body, 'info');
              }
              // Handle direct_message: show in support page and notifications
              if(n.type==='direct_message'){
                S.support_msgs = S.support_msgs||[];
                var msgEntry = {
                  id: 'dm_'+n.id,
                  type:'direct_message',
                  from: n.from||'عضو',
                  msg: n.body,
                  created_at: n.created_at,
                  read: false
                };
                if(!S.support_msgs.find(function(x){return x.id===msgEntry.id;})){
                  S.support_msgs.unshift(msgEntry);
                }
                lsSave();
                if(typeof renderSupport==='function') setTimeout(renderSupport,200);
                var suppBadge=document.getElementById('support-badge');
                if(suppBadge){ var unrD=(S.support_msgs||[]).filter(function(x){return !x.read;}).length; suppBadge.textContent=unrD; suppBadge.style.display=unrD?'':'none'; }
                addNotification('<i class="fa-solid fa-envelope" style="color:var(--accent)"></i> رسالة من '+escapeHtml(n.from||'عضو')+': '+n.body, 'info');
              }
              if((n.type==='meeting_request'||n.type==='meeting'||n.type==='support') && ud.support_msgs){
                S.support_msgs = S.support_msgs||[];
                ud.support_msgs.forEach(function(m){
                  if(!S.support_msgs.find(function(x){ return x.id===m.id; })){ S.support_msgs.push(m); }
                });
                lsSave();
                if(typeof renderSupport==='function') setTimeout(renderSupport,200);
                var suppBadge=document.getElementById('support-badge');
                if(suppBadge){ var unr=(S.support_msgs||[]).filter(function(x){return !x.read;}).length; suppBadge.textContent=unr; suppBadge.style.display=unr?'':'none'; }
              }
            }
          });
          if(newCount>0){ if(typeof _saveNotifications==='function') _saveNotifications(); if(typeof _updateNotifBell==='function') _updateNotifBell(); showMiniNotif('<i class="fa-solid fa-bell"></i> لديك '+newCount+' إشعار جديد'); }

          // ── Sync _inbox from server (revision requests from client portal) ──
          if(ud._inbox && ud._inbox.length){
            S._inbox = S._inbox||[];
            var inboxChanged=false;
            ud._inbox.forEach(function(item){
              var exists=S._inbox.find(function(x){ return String(x.id)===String(item.id); });
              if(!exists){
                S._inbox.unshift(item);
                inboxChanged=true;
                if(item.type==='revision'&&item.status==='pending'){
                  addNotification('<i class="fa-solid fa-rotate-left" style="color:#f97316"></i> طلب تعديل من <strong>'+(item.clientName||'عميل')+'</strong> على: '+escapeHtml(item.taskTitle||'مهمة'),'warning');
                }
              }
            });
            if(inboxChanged){ lsSave(); if(typeof _updateInboxBadge==='function') _updateInboxBadge(); }
          }
          // ❗ لا نكتب ud القديمة كلها - بس نمسح الـ notifications من S الحالي
          // ده يمنع الـ poll من overwrite البيانات الجديدة في S
          if(!S._pending_notifications) S._pending_notifications = [];
          S._pending_notifications = [];
          // حفظ S الحالي (مش ud القديم) مع مسح الـ notifications
          try {
            const _safeS = JSON.parse(JSON.stringify(S));
            await supa.from('studio_data').update({data:JSON.stringify(_safeS),updated_at:new Date().toISOString()}).eq('user_id',_supaUserId);
          } catch(e) {
            // fallback: احفظ ud مع مسح الـ notifications بس
            ud._pending_notifications = [];
            await supa.from('studio_data').update({data:JSON.stringify(ud),updated_at:new Date().toISOString()}).eq('user_id',_supaUserId);
          }
          if(teamInvites.length) _showTeamInviteDialog(teamInvites);
        }
        var em = null;
        try{ var _s=JSON.parse(localStorage.getItem('studioOS_auth_v1')||'{}'); em=_s&&_s.email?_s.email:null; }catch(e){}
        if(em && typeof window._checkTeamMembership==='function') window._checkTeamMembership(em);
      } catch(e){}
    }
    _poll();
    window._teamPollNow = _poll;
    setInterval(_poll, 60000);
  })();

  window._showTeamInviteDialog = function(invites){
    // Store for inbox button
    if(!window._pendingTeamInvites) window._pendingTeamInvites = [];
    invites.forEach(function(inv){
      var exists = window._pendingTeamInvites.find(function(x){ return x.id===inv.id; });
      if(!exists) window._pendingTeamInvites.push(inv);
    });
    _updateInboxBadge();
    var existing = document.getElementById('_team-invite-overlay');
    if(existing) existing.remove();
    var invite = invites[0];
    var overlay = document.createElement('div');
    overlay.id = '_team-invite-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;padding:20px';
    var roleMatch = invite.body && invite.body.match(/كـ (.+?) في فريق/);
    var roleText  = roleMatch ? roleMatch[1] : 'عضو';
    overlay.innerHTML = [
      '<div style="background:var(--surface);border:1.5px solid rgba(124,111,247,.35);border-radius:20px;max-width:420px;width:100%;padding:28px;box-shadow:0 20px 60px rgba(0,0,0,.5)">',
        '<div style="text-align:center;margin-bottom:20px">',
          '<div style="font-size:52px;margin-bottom:10px"><i class="fa-solid fa-users"></i></div>',
          '<div style="font-size:18px;font-weight:900;margin-bottom:6px">دعوة لانضمام فريق!</div>',
          '<div style="font-size:13px;color:var(--text3)">لديك دعوة للانضمام إلى فريق عمل</div>',
        '</div>',
        '<div style="background:var(--surface2);border:1px solid var(--border);border-radius:14px;padding:16px;margin-bottom:20px">',
          '<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">',
            '<div style="width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,var(--accent),var(--accent3));display:flex;align-items:center;justify-content:center;font-size:20px"><i class="fa-solid fa-building"></i></div>',
            '<div>',
              '<div style="font-size:15px;font-weight:800">'+escapeHtml(invite.ownerName)+'</div>',
              '<div style="font-size:12px;color:var(--text3)">المشرف / صاحب الفريق</div>',
            '</div>',
          '</div>',
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">',
            '<div style="background:var(--surface);border-radius:10px;padding:10px;text-align:center">',
              '<div style="font-size:11px;color:var(--text3);margin-bottom:3px">الفريق</div>',
              '<div style="font-size:13px;font-weight:700">'+escapeHtml(invite.teamName)+'</div>',
            '</div>',
            '<div style="background:var(--surface);border-radius:10px;padding:10px;text-align:center">',
              '<div style="font-size:11px;color:var(--text3);margin-bottom:3px">دورك</div>',
              '<div style="font-size:13px;font-weight:700">'+escapeHtml(roleText)+'</div>',
            '</div>',
          '</div>',
        '</div>',
        '<div style="display:flex;gap:10px">',
          '<button id="_inv-reject-btn" style="flex:1;padding:13px;background:var(--surface2);border:1.5px solid var(--border);border-radius:12px;color:var(--text2);font-family:var(--font);font-size:14px;font-weight:700;cursor:pointer"><i class="fa-solid fa-xmark"></i> رفض الدعوة</button>',
          '<button id="_inv-accept-btn" style="flex:2;padding:13px;background:linear-gradient(135deg,var(--accent),var(--accent3));border:none;border-radius:12px;color:#fff;font-family:var(--font);font-size:14px;font-weight:900;cursor:pointer"><i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> قبول الدعوة</button>',
        '</div>',
        (invites.length>1 ? '<div style="text-align:center;margin-top:12px;font-size:11px;color:var(--text3)">لديك '+(invites.length-1)+' دعوة أخرى</div>' : ''),
      '</div>'
    ].join('');
    overlay._inviteData = invite;
    overlay._remainingInvites = invites.slice(1);
    document.body.appendChild(overlay);
    overlay.querySelector('#_inv-accept-btn').onclick = function(){ _handleTeamInvite(true); };
    overlay.querySelector('#_inv-reject-btn').onclick = function(){ _handleTeamInvite(false); };
  };

  window._handleTeamInvite = async function(accepted){
    var overlay = document.getElementById('_team-invite-overlay');
    if(!overlay) return;
    var invite    = overlay._inviteData;
    var remaining = overlay._remainingInvites || [];
    overlay.remove();
    if(accepted){
      showMiniNotif('🎉 انضممت لفريق "'+invite.teamName+'" — '+invite.ownerName);
      // Update team_invites table
      if(typeof supa!=='undefined' && invite.id){
        (async()=>{try{await supa.from('team_invites').update({status:'accepted'}).eq('id',invite.id.replace('pn_',''));}catch(e){}})();
      }
      var em = null;
      try{ var _s=JSON.parse(localStorage.getItem('studioOS_auth_v1')||'{}'); em=_s&&_s.email?_s.email:null; }catch(e){}
      if(em) window._checkTeamMembership(em);
    } else {
      showMiniNotif('تم رفض دعوة "'+invite.teamName+'"');
      if(typeof supa!=='undefined' && invite.id){
        (async()=>{try{await supa.from('team_invites').update({status:'declined'}).eq('id',invite.id.replace('pn_',''));}catch(e){}})();
      }
      // حفظ الرفض محلياً لتجنب إعادة العرض
      var decKey = '_declined_team_invites_'+(_supaUserId||'');
      var decList = JSON.parse(localStorage.getItem(decKey)||'[]');
      var rawId = String(invite.id).replace('pn_','');
      if(!decList.includes(rawId)) decList.push(rawId);
      localStorage.setItem(decKey, JSON.stringify(decList));
    }
    if(remaining.length) setTimeout(function(){ window._showTeamInviteDialog(remaining); }, 400);
  };

  window._showTeamMembershipBanner = function(memberships){
    var el = document.getElementById('team-membership-section');
    if(!el){
      el = document.createElement('div');
      el.id = 'team-membership-section';
      el.style.cssText = 'padding:8px 0';
      var sidebar = document.querySelector('.sidebar');
      var settingsLabel = Array.from(document.querySelectorAll('.nav-section-label')).find(function(x){ return x.textContent.includes('الإعدادات'); });
      if(sidebar && settingsLabel) sidebar.insertBefore(el, settingsLabel);
      else if(sidebar) sidebar.appendChild(el);
    }
    if(!el) return;
    var totalTasks = memberships.reduce(function(s,m){ return s+(m.tasks?m.tasks.length:0); },0);
    el.innerHTML =
      '<div class="nav-section-label" style="color:var(--accent3)"><i class="fa-solid fa-users"></i> فرقي</div>'
      +memberships.map(function(m){
        var tc = m.tasks?m.tasks.length:0;
        return '<div class="nav-item" onclick="openTeamMemberDashboard(\''+m.ownerId+'\')" style="flex-direction:column;align-items:flex-start;padding:10px 16px;gap:4px;cursor:pointer">'
          +'<div style="display:flex;align-items:center;gap:8px;width:100%">'
            +'<span style="font-size:14px"><i class="fa-solid fa-building"></i></span>'
            +'<span style="font-size:13px;font-weight:700;flex:1;color:var(--accent3)">'+escapeHtml(m.ownerName)+'</span>'
            +(tc ? '<span style="background:var(--accent4);color:#fff;font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px">'+tc+' مهام</span>'
                 : '<span style="background:var(--accent3);color:#fff;font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px"><i class="fa-solid fa-check"></i></span>')
          +'</div>'
          +'<div style="font-size:11px;color:var(--text3);padding-right:22px">'+escapeHtml(m.teamName)+' · '+escapeHtml(m.role||'عضو')+'</div>'
        +'</div>';
      }).join('')
      +(totalTasks>0 ? '<div style="margin:4px 16px 8px;padding:7px 12px;background:rgba(247,111,124,.08);border:1px solid rgba(247,111,124,.2);border-radius:8px;font-size:11px;color:var(--accent4);font-weight:700"><i class="fa-solid fa-bolt"></i> لديك '+totalTasks+' مهمة نشطة في الفريق</div>' : '');
  };

  window.openTeamMemberDashboard = function(ownerId){
    var membership = window._myTeamMemberships.find(function(m){ return m.ownerId===ownerId; });
    if(!membership) return;
    var tasks=membership.tasks||[], doneTasks=membership.doneTasks||[];
    var html = [
      '<div style="margin-bottom:20px">',
        '<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;padding:16px;background:linear-gradient(135deg,rgba(124,111,247,.1),rgba(79,209,165,.06));border-radius:14px">',
          (_validImgSrc(membership.ownerLogo) ? '<img src="'+escapeHtml(membership.ownerLogo)+'" style="width:48px;height:48px;border-radius:12px;object-fit:cover" onerror=\'this.style.display=\"none\"\'">'
            : '<div style="width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,var(--accent),var(--accent3));display:flex;align-items:center;justify-content:center;font-size:22px"><i class="fa-solid fa-building"></i></div>'),
          '<div>',
            '<div style="font-size:16px;font-weight:900">'+escapeHtml(membership.ownerName)+'</div>',
            '<div style="font-size:12px;color:var(--text3)">'+escapeHtml(membership.teamName)+' · '+escapeHtml(membership.role||'عضو')+'</div>',
          '</div>',
        '</div>',
        '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px">',
          '<div class="card" style="text-align:center;padding:14px"><div style="font-size:24px;font-weight:900;color:var(--accent4)">'+tasks.length+'</div><div style="font-size:11px;color:var(--text3)">مهام نشطة</div></div>',
          '<div class="card" style="text-align:center;padding:14px"><div style="font-size:24px;font-weight:900;color:var(--accent3)">'+doneTasks.length+'</div><div style="font-size:11px;color:var(--text3)">مكتملة</div></div>',
          '<div class="card" style="text-align:center;padding:14px"><div style="font-size:24px;font-weight:900;color:var(--accent2)">'+tasks.filter(function(t){ return t.deadline&&new Date(t.deadline)<new Date(); }).length+'</div><div style="font-size:11px;color:var(--text3)">متأخرة</div></div>',
        '</div>',
        (tasks.length
          ? '<div class="section-title" style="margin-bottom:10px"><i class="fa-solid fa-clipboard-list"></i> مهامي النشطة</div>'
            +tasks.map(function(t){
              var isLate=t.deadline&&new Date(t.deadline)<new Date();
              var daysLeft=t.deadline?Math.ceil((new Date(t.deadline)-new Date())/864e5):null;
              return '<div class="card" style="padding:12px;margin-bottom:8px;border-right:3px solid '+(isLate?'var(--accent4)':'var(--accent)')+'"><div style="display:flex;justify-content:space-between;align-items:flex-start"><div style="flex:1"><div style="font-size:14px;font-weight:700;margin-bottom:3px">'+escapeHtml(t.title)+'</div>'+(t.client?'<div style="font-size:11px;color:var(--text3)"><i class="fa-solid fa-user"></i> '+escapeHtml(t.client)+'</div>':'')+(t.notes?'<div style="font-size:11px;color:var(--text3)"><i class="fa-solid fa-pen-to-square"></i> '+escapeHtml(t.notes.slice(0,80))+'</div>':'')+'</div><div style="text-align:left;flex-shrink:0;padding-right:10px">'+(t.deadline?'<div style="font-size:11px;font-weight:700;color:'+(isLate?'var(--accent4)':(daysLeft<=2?'var(--accent2)':'var(--accent3)'))+'">'+(isLate?'<i class="fa-solid fa-triangle-exclamation"></i> متأخرة':daysLeft+' يوم')+'</div>':'')+'</div></div></div>';
            }).join('')
          : '<div class="empty" style="padding:24px"><div class="empty-icon"><i class="fa-solid fa-square-check" style="color:var(--accent3)"></i></div>لا مهام نشطة الآن</div>'),
        (doneTasks.length
          ? '<div class="section-title" style="margin-top:14px;margin-bottom:10px;color:var(--accent3)"><i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> مكتملة ('+doneTasks.length+')</div>'
            +doneTasks.slice(0,5).map(function(t){
              return '<div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--surface2);border-radius:8px;margin-bottom:6px"><span style="color:var(--accent3)"><i class="fa-solid fa-check"></i></span><span style="font-size:13px;color:var(--text2);text-decoration:line-through">'+escapeHtml(t.title)+'</span></div>';
            }).join('')
          : ''),
      '</div>'
    ].join('');

    var overlay = document.getElementById('_team-member-modal');
    if(!overlay){
      overlay = document.createElement('div');
      overlay.id = '_team-member-modal';
      overlay.className = 'modal-overlay';
      var inner = document.createElement('div');
      inner.className = 'modal';
      inner.style.cssText = 'max-width:540px;max-height:88vh;overflow-y:auto';
      inner.innerHTML = [
        '<div class="modal-header" style="position:sticky;top:0;background:var(--surface);z-index:2">',
          '<div class="modal-title" id="_tmm-title"><i class="fa-solid fa-clipboard-list"></i> مهامي في الفريق</div>',
          '<button class="close-btn" id="_tmm-close"><i class="fa-solid fa-xmark"></i></button>',
        '</div>',
        '<div id="_tmm-body" style="padding:0 4px"></div>'
      ].join('');
      overlay.appendChild(inner);
      document.body.appendChild(overlay);
      document.getElementById('_tmm-close').onclick = function(){ overlay.style.display='none'; };
      overlay.onclick = function(e){ if(e.target===overlay) overlay.style.display='none'; };
    }
    document.getElementById('_tmm-title').innerHTML='<i class="fa-solid fa-clipboard-list"></i> فريق — '+membership.ownerName;
    document.getElementById('_tmm-body').innerHTML = html;
    overlay.style.display = 'flex';
  };

})();



// ═══════════════════════════════════════════════════
// ═══════════════════════════════════════════════════
// SPECIALIZATIONS SYSTEM
// ═══════════════════════════════════════════════════
function openAddSpecModal(){ document.getElementById('add-spec-form').style.display=''; document.getElementById('spec-name').focus(); }

function saveSpecialization(){
  const name = document.getElementById('spec-name')?.value.trim();
  if(!name){ toast('<i class="fa-solid fa-triangle-exclamation"></i> أدخل اسم التخصص'); return; }
  const icon = document.getElementById('spec-icon')?.value.trim() || '<i class="fa-solid fa-tag"></i>';
  const color = document.getElementById('spec-color')?.value || '#7c6ff7';
  if(!S.specializations) S.specializations = [];
  S.specializations.push({ id: Date.now(), name, icon, color, createdAt: new Date().toISOString() });
  lsSave(); cloudSave(S);
  ['spec-name','spec-icon'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  document.getElementById('add-spec-form').style.display='none';
  renderSpecializations();
  // Update member-role dropdown
  updateSpecDropdown();
  toast('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم إضافة التخصص: '+name);
}

function deleteSpecialization(id){
  if(!confirm('حذف هذا التخصص؟')) return;
  S.specializations = (S.specializations||[]).filter(s=>String(s.id)!==String(id));
  lsSave(); cloudSave(S);
  renderSpecializations();
  updateSpecDropdown();
  toast('<i class="fa-solid fa-trash"></i> تم حذف التخصص');
}

function renderSpecializations(){
  const el = document.getElementById('specializations-list'); if(!el) return;
  const specs = S.specializations||[];
  if(!specs.length){ el.innerHTML='<div style="font-size:12px;color:var(--text3)">لا توجد تخصصات — أضف أول تخصص</div>'; return; }
  el.innerHTML = specs.map(s=>`
    <div style="display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:20px;border:1.5px solid ${s.color}20;background:${s.color}15;font-size:12px;font-weight:700">
      <span style="color:${s.color}">${s.icon} ${s.name}</span>
      <button onclick="deleteSpecialization(${s.id})" style="background:none;border:none;cursor:pointer;color:var(--text3);font-size:14px;padding:0;line-height:1" title="حذف"><i class="fa-solid fa-xmark"></i></button>
    </div>`).join('');
}

function updateSpecDropdown(){
  const sel = document.getElementById('member-role'); if(!sel) return;
  const specs = S.specializations||[];
  const defaults = [
    {value:'تصميم',label:'<i class="fa-solid fa-palette"></i> تصميم'},{value:'مونتاج فيديو',label:'<i class="fa-solid fa-clapperboard"></i> مونتاج فيديو'},
    {value:'تطوير',label:'<i class="fa-solid fa-laptop"></i> تطوير'},{value:'تسويق',label:'<i class="fa-solid fa-bullhorn"></i> تسويق'},
    {value:'كتابة محتوى',label:'<i class="fa-solid fa-pen-nib"></i> كتابة محتوى'},{value:'كونتنت كريتور',label:'<i class="fa-solid fa-mobile-screen"></i> كونتنت كريتور'},
    {value:'مودريتور',label:'<i class="fa-solid fa-comments"></i> مودريتور'},{value:'مستقل',label:'<i class="fa-solid fa-user"></i> مستقل / عام'},{value:'أخرى',label:'<i class="fa-solid fa-thumbtack"></i> أخرى'}
  ];
  const customOpts = specs.map(s=>`<option value="${escapeHtml(s.name)}">${s.icon} ${escapeHtml(s.name)}</option>`).join('');
  sel.innerHTML = defaults.map(d=>`<option value="${d.value}">${d.label}</option>`).join('') + (customOpts ? '<option disabled>── تخصصات مخصصة ──</option>'+customOpts : '');
}

// ═══════════════════════════════════════════════════
// CORPORATE SETTINGS
// ═══════════════════════════════════════════════════
function initCorpSettings(){
  const feat = window._planFeatures||{};
  const badge = document.getElementById('corp-plan-badge');
  const body = document.getElementById('corp-settings-body');
  if(feat.corporate && feat.corp_mode){
    if(badge){ badge.innerHTML='<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> باقة الشركات مفعلة'; badge.style.background='rgba(79,209,165,.15)'; badge.style.color='var(--accent3)'; }
    if(body){ body.style.opacity='1'; body.style.pointerEvents='auto'; }
    renderCorpEmployees();
  } else {
    if(badge){ badge.innerHTML='<i class="fa-solid fa-ban"></i> غير متاح في باقتك'; }
    if(body){ body.style.opacity='.4'; body.style.pointerEvents='none'; }
  }
  // Load saved corp settings
  const corp = S.settings?.corp||{};
  if(document.getElementById('corp-name')) document.getElementById('corp-name').value = corp.name||'';
  if(document.getElementById('corp-sector')) document.getElementById('corp-sector').value = corp.sector||'';
}

function saveCorpSettings(){
  if(!S.settings) S.settings={};
  if(!S.settings.corp) S.settings.corp={};
  S.settings.corp.name = document.getElementById('corp-name')?.value.trim()||'';
  S.settings.corp.sector = document.getElementById('corp-sector')?.value.trim()||'';
  lsSave(); cloudSave(S);
  toast('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم حفظ إعدادات الشركة');
}

function renderCorpEmployees(){
  const el = document.getElementById('corp-employees-list'); if(!el) return;
  const employees = (S.teams||[]).flatMap(t=>(t.members||[]).filter(m=>m.corpEmployee));
  const cnt = document.getElementById('corp-emp-count'); if(cnt) cnt.textContent=employees.length+' موظف';
  if(!employees.length){ el.innerHTML='<div style="font-size:12px;color:var(--text3)">لا يوجد موظفون — أضف أعضاء الفريق وسيظهرون هنا</div>'; return; }
  el.innerHTML = employees.map(m=>`
    <div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:var(--surface3);border-radius:8px">
      <span style="font-size:16px">👔</span>
      <div style="flex:1"><div style="font-size:12px;font-weight:700">${escapeHtml(m.name)}</div><div style="font-size:11px;color:var(--text3)">${escapeHtml(m.role)} · ${m.email||'—'}</div></div>
      <span style="font-size:10px;background:rgba(79,209,165,.12);color:var(--accent3);padding:2px 8px;border-radius:8px">موظف</span>
    </div>`).join('');
}

// ═══════════════════════════════════════════════════
