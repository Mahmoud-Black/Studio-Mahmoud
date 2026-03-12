// ═══════════════════════════════════════════════════
// TIME LOG EDIT/DELETE in task detail
// ═══════════════════════════════════════════════════
function deleteTimeLog(taskId, dateKey){
  confirmDel('هل تريد حذف هذا السجل الزمني؟', function(){
    var t = S.tasks.find(function(x){ return x.id===taskId; });
    if(!t) return;
    t.timeLogs = (t.timeLogs||[]).filter(function(l){ return l.date!==dateKey; });
    S.timeEntries = (S.timeEntries||[]).filter(function(e){
      var d=(e.started_at||'').split('T')[0];
      return !(d===dateKey && (e.task_title||'').toLowerCase()===(t.title||'').toLowerCase());
    });
    lsSave(); cloudSave(S);
    openTaskDetail(taskId);
    if(typeof toast==='function') toast('<i class="fa-solid fa-trash"></i> تم حذف السجل');
  });
}

function editTimeLog(taskId, dateKey){
  var t = S.tasks.find(function(x){ return x.id===taskId; });
  if(!t) return;
  var log = (t.timeLogs||[]).find(function(l){ return l.date===dateKey; });
  var curSecs = log ? (log.seconds||0) : 0;
  var curH = Math.floor(curSecs/3600);
  var curM = Math.floor((curSecs%3600)/60);
  var modal = document.getElementById('_modal-edit-timelog');
  if(!modal){
    modal = document.createElement('div');
    modal.id='_modal-edit-timelog';
    modal.className='modal-overlay';
    modal.innerHTML='<div class="modal" style="max-width:340px" id="_modal-edit-timelog-inner"></div>';
    document.body.appendChild(modal);
    modal.addEventListener('click',function(e){ if(e.target===modal) closeM('_modal-edit-timelog'); });
  }
  document.getElementById('_modal-edit-timelog-inner').innerHTML=
    '<div class="modal-header">' +
    '<div class="modal-title"><i class="fa-solid fa-stopwatch"></i> تعديل سجل الوقت</div>' +
    '<button class="close-btn" onclick="closeM(\'_modal-edit-timelog\')"><i class="fa-solid fa-xmark"></i></button></div>' +
    '<div style="padding:20px">' +
    '<div style="font-size:12px;color:var(--text3);margin-bottom:12px"><i class="fa-solid fa-calendar-days"></i> التاريخ: ' + dateKey + '</div>' +
    '<div style="display:flex;gap:10px;align-items:center;margin-bottom:16px">' +
    '<div class="form-group" style="flex:1;margin:0"><label class="form-label">الساعات</label>' +
    '<input id="_etl-hours" type="number" min="0" max="23" value="' + curH + '" class="form-input" style="text-align:center;font-size:18px;font-weight:700"></div>' +
    '<div style="font-size:20px;color:var(--text3);margin-top:18px">:</div>' +
    '<div class="form-group" style="flex:1;margin:0"><label class="form-label">الدقائق</label>' +
    '<input id="_etl-mins" type="number" min="0" max="59" value="' + curM + '" class="form-input" style="text-align:center;font-size:18px;font-weight:700"></div></div>' +
    '<div style="display:flex;gap:8px">' +
    '<button onclick="deleteTimeLog(' + taskId + ',\'' + dateKey + '\')" class="btn btn-danger" style="flex:1"><i class="fa-solid fa-trash"></i> حذف</button>' +
    '<button onclick="_saveEditedTimeLog(' + taskId + ',\'' + dateKey + '\')" class="btn btn-primary" style="flex:1" data-i18n="btn_save"><i class="fa-solid fa-floppy-disk" style="margin-left:4px"></i> حفظ</button>' +
    '</div></div>';
  openM('_modal-edit-timelog');
}

function _saveEditedTimeLog(taskId, dateKey){
  var h = parseInt(document.getElementById('_etl-hours').value)||0;
  var m = parseInt(document.getElementById('_etl-mins').value)||0;
  var newSecs = h*3600 + m*60;
  if(newSecs<=0){ if(typeof toast==='function') toast('أدخل وقتاً صحيحاً'); return; }
  var t = S.tasks.find(function(x){ return x.id===taskId; });
  if(!t) return;
  if(!t.timeLogs) t.timeLogs=[];
  var existing = t.timeLogs.find(function(l){ return l.date===dateKey; });
  if(existing){ existing.seconds=newSecs; } else { t.timeLogs.push({date:dateKey,seconds:newSecs}); }
  lsSave(); cloudSave(S);
  closeM('_modal-edit-timelog');
  openTaskDetail(taskId);
  if(typeof toast==='function') toast('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم تحديث الوقت');
}

function addManualTimeLog(taskId){
  var today = new Date().toISOString().split('T')[0];
  var modal = document.getElementById('_modal-edit-timelog');
  if(!modal){
    modal = document.createElement('div');
    modal.id='_modal-edit-timelog';
    modal.className='modal-overlay';
    modal.innerHTML='<div class="modal" style="max-width:340px" id="_modal-edit-timelog-inner"></div>';
    document.body.appendChild(modal);
    modal.addEventListener('click',function(e){ if(e.target===modal) closeM('_modal-edit-timelog'); });
  }
  document.getElementById('_modal-edit-timelog-inner').innerHTML=
    '<div class="modal-header"><div class="modal-title">+ إضافة وقت يدوي</div>' +
    '<button class="close-btn" onclick="closeM(\'_modal-edit-timelog\')"><i class="fa-solid fa-xmark"></i></button></div>' +
    '<div style="padding:20px">' +
    '<div class="form-group"><label class="form-label">التاريخ</label>' +
    '<input id="_etl-date" type="date" value="' + today + '" class="form-input"></div>' +
    '<div style="display:flex;gap:10px;align-items:center;margin-bottom:16px">' +
    '<div class="form-group" style="flex:1;margin:0"><label class="form-label">الساعات</label>' +
    '<input id="_etl-hours" type="number" min="0" max="23" value="1" class="form-input" style="text-align:center;font-size:18px;font-weight:700"></div>' +
    '<div style="font-size:20px;color:var(--text3);margin-top:18px">:</div>' +
    '<div class="form-group" style="flex:1;margin:0"><label class="form-label">الدقائق</label>' +
    '<input id="_etl-mins" type="number" min="0" max="59" value="0" class="form-input" style="text-align:center;font-size:18px;font-weight:700"></div></div>' +
    '<button onclick="_saveManualTimeLog(' + taskId + ')" class="btn btn-primary" style="width:100%"><i class="fa-solid fa-floppy-disk"></i> إضافة</button></div>';
  openM('_modal-edit-timelog');
}

function _saveManualTimeLog(taskId){
  var h = parseInt(document.getElementById('_etl-hours').value)||0;
  var m = parseInt(document.getElementById('_etl-mins').value)||0;
  var date = document.getElementById('_etl-date').value || new Date().toISOString().split('T')[0];
  var newSecs = h*3600 + m*60;
  if(newSecs<=0){ if(typeof toast==='function') toast('أدخل وقتاً صحيحاً'); return; }
  var t = S.tasks.find(function(x){ return x.id===taskId; });
  if(!t) return;
  if(!t.timeLogs) t.timeLogs=[];
  var existing = t.timeLogs.find(function(l){ return l.date===date; });
  if(existing){ existing.seconds += newSecs; } else { t.timeLogs.push({date:date,seconds:newSecs}); }
  lsSave(); cloudSave(S);
  closeM('_modal-edit-timelog');
  openTaskDetail(taskId);
  if(typeof toast==='function') toast('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تمت إضافة الوقت');
}

function clearAllTimeLogs(taskId){
  confirmDel('سيتم حذف كل سجلات الوقت. هل أنت متأكد؟', function(){
    var t = S.tasks.find(function(x){ return x.id===taskId; });
    if(!t) return;
    t.timeLogs = [];
    S.timeEntries = (S.timeEntries||[]).filter(function(e){
      return (e.task_title||'').toLowerCase() !== (t.title||'').toLowerCase();
    });
    lsSave(); cloudSave(S);
    openTaskDetail(taskId);
    if(typeof toast==='function') toast('<i class="fa-solid fa-trash"></i> تم مسح كل سجلات الوقت');
  });
}

// ═══════════════════════════════════════════════════
// HEADER PROFILE MENU
// ═══════════════════════════════════════════════════
function _updateHeaderAvatar(){
  var session = typeof getSession === 'function' ? getSession() : null;
  var _rawAvatar = (session && session.avatarUrl) ? session.avatarUrl : ((typeof S !== 'undefined' && S.settings && (S.settings._avatarUrl || S.settings.logo)) ? (S.settings._avatarUrl || S.settings.logo) : '');
  var avatarUrl = _validImgSrc(_rawAvatar) ? _rawAvatar : '';
  var name = (session && session.name) ? session.name : ((session && session.studio) ? session.studio : 'م');
  var imgEl = document.getElementById('_header-avatar-img');
  var txtEl = document.getElementById('_header-avatar-text');
  if(imgEl && avatarUrl){
    imgEl.src = avatarUrl;
    imgEl.style.display = 'block';
    if(txtEl) txtEl.style.display = 'none';
  } else if(txtEl){
    if(imgEl) imgEl.style.display = 'none';
    txtEl.style.display = 'flex';
    txtEl.textContent = (name[0]||'م').toUpperCase();
  }
  if(typeof applyPlatformConfig === 'function') applyPlatformConfig();
}

function _toggleProfileMenu(triggerEl){
  var existing = document.getElementById('_profile-menu-pop');
  if(existing){ existing.remove(); return; }
  var session = typeof getSession === 'function' ? getSession() : null;
  var sub = typeof _userSubscription !== 'undefined' ? _userSubscription : null;
  var planName = (sub && sub.plan && sub.plan.name) ? sub.plan.name : ((sub && sub.planId) ? sub.planId : 'مجاني');
  var expiresAt = (sub && sub.expiresAt) ? new Date(sub.expiresAt).toLocaleDateString('ar-EG') : '';
  var name = (session && session.name) ? session.name : 'المستخدم';
  var email = (session && session.email) ? session.email : '';
  var avatarUrl = (session && session.avatarUrl) ? session.avatarUrl : '';

  var avatarHtml = avatarUrl
    ? '<img src="' + avatarUrl + '" style="width:100%;height:100%;object-fit:cover">'
    : '<span style="font-size:20px;font-weight:900;color:#fff">' + (name[0]||'م').toUpperCase() + '</span>';

  var expHtml = expiresAt ? '<div style="font-size:10px;color:var(--text3)">ينتهي ' + expiresAt + '</div>' : '';

  var pop = document.createElement('div');
  pop.id = '_profile-menu-pop';
  pop.style.cssText = 'position:fixed;z-index:9999;background:var(--surface2);border:1px solid var(--border);border-radius:16px;min-width:260px;box-shadow:0 12px 36px rgba(0,0,0,.35);overflow:hidden';
  var rect = triggerEl.getBoundingClientRect();
  pop.style.top = (rect.bottom+8)+'px';
  pop.style.left = Math.max(8, rect.left-220)+'px';

  pop.innerHTML =
    '<div style="background:linear-gradient(135deg,var(--accent),rgba(124,111,247,.6));padding:16px 18px">' +
    '<div style="display:flex;align-items:center;gap:12px">' +
    '<div style="width:48px;height:48px;border-radius:50%;overflow:hidden;border:2px solid rgba(255,255,255,.4);flex-shrink:0;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center">' +
    avatarHtml + '</div>' +
    '<div><div style="font-size:14px;font-weight:800;color:#fff">' + name + '</div>' +
    '<div style="font-size:11px;color:rgba(255,255,255,.75);margin-top:2px">' + email + '</div></div></div></div>' +
    '<div style="padding:10px">' +
    '<div style="background:var(--surface3);border-radius:10px;padding:10px 12px;margin-bottom:8px;border:1px solid var(--border)">' +
    '<div style="display:flex;justify-content:space-between;align-items:center">' +
    '<div><div style="font-size:10px;color:var(--text3);font-weight:700">الباقة الحالية</div>' +
    '<div style="font-size:13px;font-weight:800;color:var(--accent);margin-top:2px">✨ ' + planName + '</div></div>' +
    expHtml + '</div></div>' +
    '<button onclick="document.getElementById(\'_profile-menu-pop\').remove();openProfileModal()" style="display:flex;align-items:center;gap:10px;width:100%;padding:9px 12px;background:none;border:none;color:var(--text);font-size:13px;font-family:var(--font);font-weight:600;cursor:pointer;border-radius:9px;text-align:right" onmouseover="this.style.background=\'var(--surface3)\'" onmouseout="this.style.background=\'none\'">' +
    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M6 20v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/></svg>الملف الشخصي</button>' +
    '<button onclick="openBackupModal();document.getElementById(\'_profile-menu-pop\')?.remove()" style="display:flex;align-items:center;gap:10px;width:100%;padding:9px 12px;background:none;border:none;color:var(--text);font-size:13px;font-family:var(--font);font-weight:600;cursor:pointer;border-radius:9px;text-align:right" onmouseover="this.style.background=\'var(--surface3)\'" onmouseout="this.style.background=\'none\'">' +
    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="21 15 21 21 3 21 3 15"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg><i class="fa-solid fa-cloud-arrow-up" style="margin-left:6px"></i> نسخ احتياطي</button>' +
    '<hr style="border:none;border-top:1px solid var(--border);margin:6px 0">' +
    '<button onclick="logoutUser();document.getElementById(\'_profile-menu-pop\')?.remove()" style="display:flex;align-items:center;gap:10px;width:100%;padding:9px 12px;background:none;border:none;color:var(--accent4);font-size:13px;font-family:var(--font);font-weight:700;cursor:pointer;border-radius:9px;text-align:right" onmouseover="this.style.background=\'rgba(247,111,124,.08)\'" onmouseout="this.style.background=\'none\'">' +
    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>تسجيل الخروج</button>' +
    '</div>';

  document.body.appendChild(pop);
  setTimeout(function(){
    document.addEventListener('click', function _pmClose(e){
      var p2 = document.getElementById('_profile-menu-pop');
      if(p2 && !p2.contains(e.target) && !triggerEl.contains(e.target)){
        p2.remove(); document.removeEventListener('click',_pmClose);
      }
    });
  }, 100);
}

window.addEventListener('load', function(){
  setTimeout(_updateHeaderAvatar, 1000);
  setInterval(_updateHeaderAvatar, 3000);
  setTimeout(_initNotifications, 1500);
});

// ═══════════════════════════════════════════════════
// NOTIFICATIONS SYSTEM
// ═══════════════════════════════════════════════════
var _notifications = [];

function _loadNotifications(){
  try{ _notifications = JSON.parse(localStorage.getItem('_notifs_v1')||'[]'); }catch(e){ _notifications=[]; }
}

function _saveNotifications(){
  localStorage.setItem('_notifs_v1', JSON.stringify(_notifications.slice(0,50)));
}

function addNotification(msg, type, link){
  _loadNotifications();
  // ── منع الإشعارات المكررة: إذا نفس الرسالة موجودة في آخر 10 إشعارات تجاهلها ──
  var msgText = (msg||'').replace(/<[^>]*>/g,'').trim().slice(0,80);
  var isDup = _notifications.slice(0,10).some(function(n){
    var nText = (n.msg||'').replace(/<[^>]*>/g,'').trim().slice(0,80);
    return nText === msgText;
  });
  if(isDup) return;
  _notifications.unshift({
    id: Date.now(),
    msg: msg,
    type: type||'info', // info, success, warning, error, message
    link: link||'',
    time: new Date().toISOString(),
    read: false
  });
  _saveNotifications();
  _updateNotifBell();
}

function _initNotifications(){
  _loadNotifications();
  _updateNotifBell();
  if(typeof _updateInboxBadge==='function') _updateInboxBadge();
  // Check for auto-notifications (overdue tasks, subscriptions)
  setTimeout(_checkAutoNotifications, 2000);
  setInterval(_checkAutoNotifications, 5*60*1000); // every 5 min
}

function _checkAutoNotifications(){
  if(typeof S === 'undefined') return;
  var today = new Date().toISOString().split('T')[0];
  var todayKey = 'notif_check_'+today;
  if(localStorage.getItem(todayKey)) return;
  localStorage.setItem(todayKey, '1');
  // Overdue tasks
  var overdue = (S.tasks||[]).filter(function(t){ return !t.done && t.deadline && t.deadline < today; });
  if(overdue.length > 0){
    addNotification('<i class="fa-solid fa-triangle-exclamation"></i> لديك ' + overdue.length + ' مهمة متأخرة عن موعدها', 'warning');
  }
  // Subscriptions expiring in 7 days
  var soon = new Date(); soon.setDate(soon.getDate()+7);
  var soonStr = soon.toISOString().split('T')[0];
  var expiring = (S.subscriptions||[]).filter(function(s){ return s.nextDate && s.nextDate <= soonStr && s.nextDate >= today; });
  if(expiring.length > 0){
    addNotification('<i class="fa-solid fa-bell"></i> ' + expiring.length + ' اشتراك قريب من التجديد', 'info');
  }
  // ─── تذكير يومي بالتحصيل المتأخر ───
  var pendingInvs = (S.invoices||[]).filter(function(i){
    if(i.status==='paid'||i.status==='cancelled') return false;
    if(!i.date) return false;
    var invD = new Date(i.isoDate||i.date);
    var diff = Math.floor((new Date()-invD)/(1000*60*60*24));
    return diff >= 3;
  });
  if(pendingInvs.length > 0){
    var clients = [...new Set(pendingInvs.map(function(i){return i.client;}).filter(Boolean))];
    var msg = '<i class="fa-solid fa-coins"></i> ' + pendingInvs.length + ' فاتورة لم يتم تحصيلها';
    if(clients.length && clients.length <= 3) msg += ': ' + clients.join('، ');
    addNotification(msg, 'warning');
  }
}

function _updateNotifBell(){
  var unread = _notifications.filter(function(n){ return !n.read; }).length;
  var dot = document.getElementById('_notif-dot');
  if(dot) dot.style.display = unread > 0 ? 'block' : 'none';
}

function _toggleNotifPanel(triggerEl){
  var existing = document.getElementById('_notif-panel');
  if(existing){ existing.remove(); return; }
  _loadNotifications();
  _notifications.forEach(function(n){ n.read=true; });
  _saveNotifications();
  _updateNotifBell();
  _markServerNotifsRead();

  var ICONS  = {info:'ℹ', success:'<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i>', warning:'<i class="fa-solid fa-triangle-exclamation"></i>', error:'<i class="fa-solid fa-circle-xmark"></i>', message:'<i class="fa-solid fa-comments"></i>', broadcast:'<i class="fa-solid fa-bullhorn"></i>', order:'<i class="fa-solid fa-bag-shopping"></i>'};
  var COLORS = {info:'var(--accent)', success:'var(--accent3)', warning:'var(--accent2)', error:'var(--accent4)', message:'#64b5f6', broadcast:'#f7c948', order:'var(--accent2)'};

  var panel = document.createElement('div');
  panel.id = '_notif-panel';
  panel.style.cssText = 'position:fixed;z-index:9998;background:var(--surface);border:1px solid var(--border);border-radius:18px;width:350px;max-height:540px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 16px 48px rgba(0,0,0,.45)';
  var rect = triggerEl.getBoundingClientRect();
  panel.style.top  = (rect.bottom+8)+'px';
  panel.style.left = Math.max(8, rect.left-300)+'px';

  var unread = _notifications.filter(function(n){ return !n.read; }).length;

  var listHtml = _notifications.length === 0
    ? '<div style="text-align:center;padding:48px 20px;color:var(--text3)"><div style="font-size:36px;margin-bottom:12px;opacity:.4"><i class="fa-solid fa-bell"></i></div><div style="font-size:13px">لا إشعارات</div></div>'
    : _notifications.slice(0,30).map(function(n){
        var ago      = _timeAgo(n.time);
        var icon     = ICONS[n.type]  || 'ℹ';
        var color    = COLORS[n.type] || 'var(--accent)';
        var msgHtml  = (n.msg||'').replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br>');
        // isAdmin = notification came from Supabase user_notifications (admin broadcast)
        var isAdminMsg  = !!n.supaId;
        // isOrder = notification from a client order
        var isOrderNotif = n.type === 'order' || (n.msg && n.msg.includes('طلب جديد'));
        // Build badge
        var badge = '';
        if(isAdminMsg)  badge = '<span style="font-size:9px;padding:2px 7px;border-radius:8px;background:rgba(108,99,255,.15);color:var(--accent);font-weight:700">من الإدارة</span>';
        else if(isOrderNotif) badge = '<span style="font-size:9px;padding:2px 7px;border-radius:8px;background:rgba(247,201,72,.15);color:var(--accent2);font-weight:700">طلب جديد</span>';
        // Click action
        var clickAttr = '';
        var navAction = '';
        if(isOrderNotif && n.orderId){
          navAction = "openOrderDetail('"+n.orderId+"')";
        } else if(isAdminMsg && n.supaId){
          var safeMsg = (n.msg||'').replace(/'/g,"\\'").replace(/"/g,'&quot;');
          navAction = "_showAdminMsgDetail('"+safeMsg+"','"+ago+"')";
        } else if(n.type === 'challenge' || (n.msg && (n.msg.includes('تحدي') || n.msg.includes('challenge')))){
          navAction = "_notifNavTo('dashboard')";
        } else if(n.type === 'invoice' || (n.msg && n.msg.includes('فاتور'))){
          navAction = "_notifNavTo('invoices')";
        } else if(n.type === 'task' || (n.msg && n.msg.includes('مهمة'))){
          navAction = "_notifNavTo('tasks')";
        } else if(n.type === 'client' || (n.msg && n.msg.includes('عميل'))){
          navAction = "_notifNavTo('clients')";
        } else if(n.type === 'finance' || (n.msg && (n.msg.includes('دخل') || n.msg.includes('مالي')))){
          navAction = "_notifNavTo('finance')";
        } else if(n.type === 'goal' || (n.msg && n.msg.includes('هدف'))){
          navAction = "_notifNavTo('goals')";
        } else if(n.page){ navAction = "_notifNavTo('"+n.page+"')"; }
        if(navAction){
          clickAttr = 'onclick="document.getElementById(\'_notif-panel\')&&document.getElementById(\'_notif-panel\').remove();'+navAction+'" style="cursor:pointer"';
        }
        return '<div '+clickAttr+' style="padding:12px 15px;border-bottom:1px solid rgba(42,42,58,.4);display:flex;gap:11px;align-items:flex-start'+(isAdminMsg?';background:rgba(108,99,255,.04)':'')+(isOrderNotif?';background:rgba(247,201,72,.03)':'')+'">'+
          '<div style="width:34px;height:34px;border-radius:50%;background:'+color+'18;border:1.5px solid '+color+'44;display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0">'+icon+'</div>'+
          '<div style="flex:1;min-width:0">'+
            '<div style="font-size:12px;font-weight:600;color:var(--text);line-height:1.5">'+msgHtml+'</div>'+
            '<div style="display:flex;align-items:center;gap:6px;margin-top:4px">'+
              badge+
              '<div style="font-size:10px;color:var(--text3)">'+ago+'</div>'+
            '</div>'+
          '</div>'+
          (clickAttr?'<div style="font-size:11px;color:var(--accent);flex-shrink:0;margin-top:2px;font-weight:700">←</div>':'')+
        '</div>';
      }).join('');

  panel.innerHTML =
    '<div style="padding:13px 15px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">'+
      '<div style="font-size:13px;font-weight:800;display:flex;align-items:center;gap:6px">'+
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>'+
        'الإشعارات'+
        (unread?'<span style="font-size:10px;padding:1px 7px;border-radius:10px;background:var(--accent4);color:#fff;font-weight:700">'+unread+'</span>':'')+
      '</div>'+
      '<button onclick="_clearAllNotifications()" style="font-size:10px;color:var(--text3);background:none;border:none;cursor:pointer;font-family:var(--font);padding:3px 8px;border-radius:6px" onmouseover="this.style.color=\'var(--accent4)\'" onmouseout="this.style.color=\'var(--text3)\'">مسح الكل</button>'+
    '</div>'+
    '<div style="overflow-y:auto;flex:1">'+listHtml+'</div>';

  document.body.appendChild(panel);
  setTimeout(function(){
    document.addEventListener('click', function _nc(e){
      var p2 = document.getElementById('_notif-panel');
      if(p2 && !p2.contains(e.target) && !triggerEl.contains(e.target)){
        p2.remove(); document.removeEventListener('click',_nc);
      }
    });
  }, 100);
}

// Show admin message detail
// Navigate to a page from notification click
function _notifNavTo(page){
  // Remove notif panel if still open
  var p = document.getElementById('_notif-panel'); if(p) p.remove();
  // Use existing nav functions
  if(typeof showPage === 'function') { showPage(page); return; }
  if(typeof switchTab === 'function') { switchTab(page); return; }
  // Fallback: click the nav item
  var navEl = document.querySelector('[onclick*="showPage(\''+page+'\'"]') ||
              document.querySelector('[data-page="'+page+'"]');
  if(navEl) navEl.click();
}

function _showAdminMsgDetail(msg, ago){
  var existing = document.getElementById('_admin-msg-detail');
  if(existing) existing.remove();
  var cleanMsg = msg.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br>');
  var ov = document.createElement('div');
  ov.id = '_admin-msg-detail';
  ov.className = 'modal-overlay';
  ov.style.display = 'flex';
  ov.innerHTML =
    '<div class="modal" style="max-width:440px">'+
      '<div class="modal-header">'+
        '<div class="modal-title"><span style="background:rgba(108,99,255,.15);color:var(--accent);padding:3px 10px;border-radius:8px;font-size:11px;font-weight:700;margin-left:8px">من الإدارة</span>رسالة إدارية</div>'+
        '<button class="close-btn" onclick="document.getElementById(\'_admin-msg-detail\').remove()"><i class="fa-solid fa-xmark"></i></button>'+
      '</div>'+
      '<div style="padding:18px 20px">'+
        '<div style="font-size:14px;line-height:1.8;color:var(--text)">'+cleanMsg+'</div>'+
        '<div style="font-size:11px;color:var(--text3);margin-top:14px;text-align:left">'+ago+'</div>'+
      '</div>'+
    '</div>';
  ov.onclick = function(e){ if(e.target===ov) ov.remove(); };
  document.body.appendChild(ov);
}

function _clearAllNotifications(){
  _notifications = [];
  _saveNotifications();
  _updateNotifBell();
  var p = document.getElementById('_notif-panel'); if(p) p.remove();
}

// ══════════════════════════════════════════════════════
// 📥 INBOX SYSTEM — طلبات التعديل والملاحظات من العملاء
// ══════════════════════════════════════════════════════
function _getInbox(){ return S._inbox||[]; }

function _updateInboxBadge(){
  var dot=document.getElementById('_inbox-dot');
  if(!dot) return;
  var unread=_getInbox().filter(function(i){ return !i.read&&i.status==='pending'; }).length;
  // also count store orders waiting
  var pendingOrders=(S.orders||[]).filter(function(o){ return !o._inboxRead; }).length;
  var total=unread+pendingOrders;
  if(total>0){
    dot.textContent=total>9?'9+':String(total);
    dot.style.display='inline-flex';
  } else {
    dot.style.display='none';
  }
}

function _toggleInboxPanel(triggerEl){
  var existing=document.getElementById('_inbox-panel');
  if(existing){ existing.remove(); return; }

  var inbox=_getInbox();
  var orders=(S.orders||[]).slice().sort(function(a,b){ return new Date(b.created_at||0)-new Date(a.created_at||0); });

  // Mark orders as read in inbox view
  var ordersChanged=false;
  orders.forEach(function(o){ if(!o._inboxRead){ o._inboxRead=true; ordersChanged=true; } });
  if(ordersChanged){ lsSave(); cloudSave(S); }
  _updateInboxBadge();

  var panel=document.createElement('div');
  panel.id='_inbox-panel';
  panel.style.cssText='position:fixed;z-index:9998;background:var(--surface);border:1px solid var(--border);border-radius:18px;width:380px;max-height:580px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 16px 48px rgba(0,0,0,.45)';
  var rect=triggerEl.getBoundingClientRect();
  panel.style.top=(rect.bottom+8)+'px';
  panel.style.left=Math.max(8,rect.left-340)+'px';

  var revisions=inbox.filter(function(i){ return i.type==='revision'||i.type==='note'; });
  var pendingRevs=revisions.filter(function(i){ return i.status==='pending'; });

  var revisionsHtml = revisions.length===0
    ? '<div style="text-align:center;padding:30px 20px;color:var(--text3);font-size:12px"><i class="fa-solid fa-rotate-left" style="font-size:28px;opacity:.3;display:block;margin-bottom:8px"></i>لا طلبات تعديل</div>'
    : revisions.slice(0,20).map(function(item){
        var isPending=item.status==='pending';
        var isNote=item.type==='note';
        var age=_timeAgo(item.createdAt||item.created_at||new Date().toISOString());
        var safeId=String(item.id).replace(/'/g,"\\'");
        var safeTid=String(item.taskId||'').replace(/'/g,"\\'");
        return '<div style="padding:12px 15px;border-bottom:1px solid rgba(42,42,58,.4);background:'+(isPending&&!isNote?'rgba(249,115,22,.04)':'transparent')+'">'+
          '<div style="display:flex;align-items:flex-start;gap:10px">'+
            '<div style="width:34px;height:34px;border-radius:50%;background:'+(isNote?'rgba(100,181,246,.15)':'rgba(249,115,22,.15)')+';border:1.5px solid '+(isNote?'#64b5f655':'#f9731655')+';display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0">'+(isNote?'<i class="fa-solid fa-comment-dots" style="color:#64b5f6"></i>':'<i class="fa-solid fa-rotate-left" style="color:#f97316"></i>')+'</div>'+
            '<div style="flex:1;min-width:0">'+
              '<div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:2px">'+(isNote?'ملاحظة':'طلب تعديل')+' — '+escapeHtml(item.clientName||'عميل')+'</div>'+
              '<div style="font-size:11px;color:var(--text3);margin-bottom:4px">'+escapeHtml(item.taskTitle||'مهمة')+'</div>'+
              (item.note?'<div style="font-size:11px;color:var(--text2);background:var(--surface2);border-radius:7px;padding:6px 9px;border-right:2px solid '+(isNote?'#64b5f6':'#f97316')+'">'+escapeHtml(item.note)+'</div>':'')+
              '<div style="font-size:10px;color:var(--text3);margin-top:4px">'+age+'</div>'+
            '</div>'+
            (isPending&&!isNote?'<span style="font-size:9px;padding:2px 7px;border-radius:8px;background:rgba(249,115,22,.15);color:#f97316;font-weight:700;flex-shrink:0">جديد</span>':'')+
            (item.status==='accepted'?'<span style="font-size:9px;padding:2px 7px;border-radius:8px;background:rgba(79,209,165,.15);color:var(--accent3);font-weight:700;flex-shrink:0">قُبل</span>':'')+
            (item.status==='rejected'?'<span style="font-size:9px;padding:2px 7px;border-radius:8px;background:rgba(255,107,107,.15);color:var(--accent4);font-weight:700;flex-shrink:0">رُفض</span>':'')+
          '</div>'+
          (isPending&&!isNote?
            '<div style="display:flex;gap:6px;margin-top:10px">'+
              '<button onclick="_acceptRevision(\''+safeId+'\',\''+safeTid+'\')" style="flex:1;padding:7px;background:rgba(79,209,165,.12);color:var(--accent3);border:1px solid rgba(79,209,165,.3);border-radius:8px;font-family:var(--font);font-size:11px;font-weight:800;cursor:pointer"><i class="fa-solid fa-check"></i> قبول التعديل</button>'+
              '<button onclick="_rejectRevision(\''+safeId+'\')" style="flex:1;padding:7px;background:rgba(255,107,107,.08);color:var(--accent4);border:1px solid rgba(255,107,107,.25);border-radius:8px;font-family:var(--font);font-size:11px;font-weight:800;cursor:pointer"><i class="fa-solid fa-xmark"></i> رفض</button>'+
            '</div>'
          :'')+
        '</div>';
      }).join('');

  var ordersHtml = orders.length===0
    ? '<div style="text-align:center;padding:30px 20px;color:var(--text3);font-size:12px"><i class="fa-solid fa-bag-shopping" style="font-size:28px;opacity:.3;display:block;margin-bottom:8px"></i>لا طلبات جديدة</div>'
    : orders.slice(0,15).map(function(o){
        var age=_timeAgo(o.created_at||new Date().toISOString());
        var svcName=escapeHtml(o.service_name||o.pkg_name||o.title||'طلب');
        var cName=escapeHtml(o.client_name||o.name||'عميل');
        var oid=String(o.id||'').replace(/'/g,"\\'");
        return '<div style="padding:12px 15px;border-bottom:1px solid rgba(42,42,58,.4);cursor:pointer" onclick="document.getElementById(\'_inbox-panel\')?.remove();openOrderDetail(\''+oid+'\')">'+
          '<div style="display:flex;align-items:flex-start;gap:10px">'+
            '<div style="width:34px;height:34px;border-radius:50%;background:rgba(247,201,72,.12);border:1.5px solid rgba(247,201,72,.35);display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0"><i class="fa-solid fa-bag-shopping" style="color:var(--accent2)"></i></div>'+
            '<div style="flex:1;min-width:0">'+
              '<div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:2px">طلب جديد — '+cName+'</div>'+
              '<div style="font-size:11px;color:var(--text3);margin-bottom:3px">'+svcName+'</div>'+
              (o.total?'<div style="font-size:12px;font-weight:800;color:var(--accent3)">'+Number(o.total).toLocaleString()+' ج</div>':'')+
              '<div style="font-size:10px;color:var(--text3);margin-top:3px">'+age+'</div>'+
            '</div>'+
            '<i class="fa-solid fa-arrow-left" style="font-size:11px;color:var(--accent);margin-top:4px"></i>'+
          '</div>'+
        '</div>';
      }).join('');

  // Build tab state
  var _activeTab=pendingRevs.length>0?'revisions':'orders';

  panel.innerHTML=
    '<div style="padding:13px 15px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">'+
      '<div style="font-size:13px;font-weight:800;display:flex;align-items:center;gap:6px">'+
        '<i class="fa-solid fa-inbox" style="color:var(--accent)"></i> صندوق الوارد'+
        (pendingRevs.length?'<span style="font-size:10px;padding:1px 7px;border-radius:10px;background:#f97316;color:#fff;font-weight:700">'+pendingRevs.length+'</span>':'')+
      '</div>'+
      '<button onclick="document.getElementById(\'_inbox-panel\').remove()" style="background:none;border:none;cursor:pointer;color:var(--text3);font-size:16px;padding:2px 6px">✕</button>'+
    '</div>'+
    '<div id="_inbox-tabs" style="display:flex;border-bottom:1px solid var(--border)">'+
      '<button id="_itab-revisions" onclick="_switchInboxTab(\'revisions\')" style="flex:1;padding:10px;font-family:var(--font);font-size:12px;font-weight:700;border:none;cursor:pointer;border-bottom:2px solid '+((_activeTab==='revisions')?'var(--accent)':'transparent')+';background:transparent;color:'+((_activeTab==='revisions')?'var(--accent)':'var(--text3)')+'"><i class="fa-solid fa-rotate-left"></i> تعديلات ('+revisions.length+')</button>'+
      '<button id="_itab-orders" onclick="_switchInboxTab(\'orders\')" style="flex:1;padding:10px;font-family:var(--font);font-size:12px;font-weight:700;border:none;cursor:pointer;border-bottom:2px solid '+((_activeTab==='orders')?'var(--accent)':'transparent')+';background:transparent;color:'+((_activeTab==='orders')?'var(--accent)':'var(--text3)')+'"><i class="fa-solid fa-bag-shopping"></i> طلبات ('+orders.length+')</button>'+
    '</div>'+
    '<div id="_inbox-revisions-content" style="overflow-y:auto;flex:1;display:'+((_activeTab==='revisions')?'block':'none')+'">'+revisionsHtml+'</div>'+
    '<div id="_inbox-orders-content" style="overflow-y:auto;flex:1;display:'+((_activeTab==='orders')?'block':'none')+'">'+ordersHtml+'</div>';

  document.body.appendChild(panel);
  setTimeout(function(){
    document.addEventListener('click',function _ic(e){
      var p2=document.getElementById('_inbox-panel');
      if(p2&&!p2.contains(e.target)&&!triggerEl.contains(e.target)){
        p2.remove(); document.removeEventListener('click',_ic);
      }
    });
  },100);
}

function _switchInboxTab(tab){
  var revBtn=document.getElementById('_itab-revisions');
  var ordBtn=document.getElementById('_itab-orders');
  var revCont=document.getElementById('_inbox-revisions-content');
  var ordCont=document.getElementById('_inbox-orders-content');
  if(!revBtn) return;
  var isRev=tab==='revisions';
  revBtn.style.borderBottomColor=isRev?'var(--accent)':'transparent';
  revBtn.style.color=isRev?'var(--accent)':'var(--text3)';
  ordBtn.style.borderBottomColor=!isRev?'var(--accent)':'transparent';
  ordBtn.style.color=!isRev?'var(--accent)':'var(--text3)';
  revCont.style.display=isRev?'block':'none';
  ordCont.style.display=!isRev?'block':'none';
}

function _acceptRevision(inboxId, taskId){
  // Find inbox item
  if(!S._inbox) return;
  var item=S._inbox.find(function(i){ return String(i.id)===String(inboxId); });
  if(!item) return;

  // Find the task (regular or project)
  var task=(S.tasks||[]).find(function(t){ return String(t.id)===String(taskId); });
  var ptask=(S.project_tasks||[]).find(function(t){ return String(t.id)===String(taskId); });
  var t=task||ptask;

  // Show status picker modal
  var statuses=[
    {id:'progress',label:'قيد التنفيذ',icon:'⚡',color:'var(--accent2)'},
    {id:'review',label:'مراجعة',icon:'🔍',color:'var(--accent)'},
    {id:'new',label:'جديد',icon:'📋',color:'var(--text3)'},
    {id:'revision',label:'تعديلات',icon:'✏️',color:'#f97316'}
  ];
  var customStatuses=(S.customStatuses||[]).map(function(cs){
    return {id:cs.id,label:cs.label,icon:cs.icon||'🔹',color:'var(--accent)'};
  });
  var allStatuses=statuses.concat(customStatuses);

  var memberName=t?(t.workerMember||t.assignee_name||''):'';

  var ov=document.createElement('div');
  ov.className='modal-overlay'; ov.id='_accept-rev-ov';
  ov.style.cssText='display:flex;align-items:center;justify-content:center;z-index:10001';
  ov.onclick=function(e){ if(e.target===ov) ov.remove(); };
  ov.innerHTML='<div class="modal" style="width:min(400px,95vw);max-height:90vh;overflow-y:auto;border-radius:16px;padding:24px">'+
    '<div style="text-align:center;margin-bottom:20px">'+
      '<div style="font-size:40px;margin-bottom:8px">✅</div>'+
      '<div style="font-size:16px;font-weight:900;margin-bottom:6px">قبول طلب التعديل</div>'+
      '<div style="font-size:12px;color:var(--text3)">اختر الحالة الجديدة للمهمة: '+escapeHtml((t&&t.title)||'المهمة')+'</div>'+
    '</div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:20px">'+
    allStatuses.map(function(st){
      return '<button onclick="_confirmAcceptRevision(\''+String(inboxId).replace(/'/g,"\\'")+'\',\''+String(taskId).replace(/'/g,"\\'")+'\',\''+st.id+'\')" style="padding:12px;background:var(--surface2);border:1.5px solid var(--border);border-radius:12px;cursor:pointer;font-family:var(--font);text-align:center;transition:.15s" onmouseover="this.style.borderColor=\''+st.color+'\';this.style.background=\''+st.color+'18\'" onmouseout="this.style.borderColor=\'var(--border)\';this.style.background=\'var(--surface2)\'">'+
        '<div style="font-size:22px;margin-bottom:4px">'+st.icon+'</div>'+
        '<div style="font-size:12px;font-weight:700;color:'+st.color+'">'+escapeHtml(st.label)+'</div>'+
      '</button>';
    }).join('')+
    '</div>'+
    (memberName?'<div style="padding:10px 12px;background:rgba(100,181,246,.08);border-radius:10px;border-right:3px solid #64b5f6;font-size:12px;color:var(--text2);margin-bottom:12px"><i class="fa-solid fa-user" style="color:#64b5f6"></i> سيتم إرسال المهمة تلقائياً إلى <strong>'+escapeHtml(memberName)+'</strong></div>':'')+
    '<button onclick="document.getElementById(\'_accept-rev-ov\').remove()" class="btn btn-ghost" style="width:100%;justify-content:center">إلغاء</button>'+
  '</div>';
  document.getElementById('_inbox-panel')?.remove();
  document.body.appendChild(ov);
}

function _confirmAcceptRevision(inboxId, taskId, newStatus){
  // Update inbox item
  var item=S._inbox&&S._inbox.find(function(i){ return String(i.id)===String(inboxId); });
  if(item){ item.status='accepted'; item.read=true; item.acceptedStatus=newStatus; }

  // Update task status
  var task=(S.tasks||[]).find(function(t){ return String(t.id)===String(taskId); });
  var ptask=(S.project_tasks||[]).find(function(t){ return String(t.id)===String(taskId); });
  var t=task||ptask;
  if(t){
    t.status=newStatus;
    t.done=false;
    t.clientRevisionRequested=false;
    // If team member assigned, re-notify them
    var memberName=t.workerMember||t.assignee_name||'';
    if(memberName){
      addNotification('<i class="fa-solid fa-user" style="color:#64b5f6"></i> تم إعادة مهمة <strong>'+escapeHtml(t.title)+'</strong> إلى '+escapeHtml(memberName)+' — تعديل من العميل','message');
    }
  }

  lsSave(); cloudSave(S);
  document.getElementById('_accept-rev-ov')?.remove();
  renderAll();
  _updateInboxBadge();
  showMiniNotif('<i class="fa-solid fa-check" style="color:var(--accent3)"></i> تم قبول التعديل وتحديث حالة المهمة');
}

function _rejectRevision(inboxId){
  var item=S._inbox&&S._inbox.find(function(i){ return String(i.id)===String(inboxId); });
  if(item){ item.status='rejected'; item.read=true; }
  lsSave(); cloudSave(S);
  document.getElementById('_inbox-panel')?.remove();
  _updateInboxBadge();
  showMiniNotif('<i class="fa-solid fa-xmark" style="color:var(--accent4)"></i> تم رفض طلب التعديل');
}

function _timeAgo(isoStr){
  var diff = Date.now() - new Date(isoStr).getTime();
  var mins = Math.floor(diff/60000);
  if(mins < 1) return 'الآن';
  if(mins < 60) return 'منذ ' + mins + ' دقيقة';
  var hrs = Math.floor(mins/60);
  if(hrs < 24) return 'منذ ' + hrs + ' ساعة';
  var days = Math.floor(hrs/24);
  return 'منذ ' + days + ' يوم';
}

// ═══════════════════════════════════════════════════
(function(){
  const s = document.createElement('style');
  s.textContent = `
    .filter-select{
      height:34px;padding:0 12px;
      background:var(--surface);border:1.5px solid var(--border);
      border-radius:20px;color:var(--text2);font-size:12px;
      font-family:var(--font);font-weight:600;
      cursor:pointer;outline:none;appearance:none;-webkit-appearance:none;
      transition:.15s;
    }
    .filter-select:focus,.filter-select:hover{border-color:var(--accent);color:var(--text)}
    select.filter-select{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23888'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:8px center;padding-left:26px;}
    #_log-popup{position:fixed;z-index:9998;background:var(--surface2);border:1px solid var(--border);border-radius:14px;padding:6px;min-width:200px;box-shadow:0 12px 32px rgba(0,0,0,.35);animation:_spIn .16s ease}
    #_log-popup button{display:flex;align-items:center;gap:10px;width:100%;padding:9px 12px;background:none;border:none;color:var(--text);font-size:13px;font-family:var(--font);font-weight:600;cursor:pointer;border-radius:9px;text-align:right;transition:.12s}
    #_log-popup button:hover{background:var(--surface3);color:var(--accent)}
    #_log-popup button.active{background:rgba(124,111,247,.15);color:var(--accent)}
    ._filter-toggle-btn:hover{border-color:var(--accent)!important}
  `;
  document.head.appendChild(s);
})();

