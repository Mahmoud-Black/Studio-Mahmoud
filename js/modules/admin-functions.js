// ═══════════════════════════════════════════════════
// ADMIN: Create user account from admin dashboard
// ═══════════════════════════════════════════════════
function openAdminCreateUser(){
  var modal = document.getElementById('_modal-admin-create-user');
  if(!modal){
    modal = document.createElement('div');
    modal.id = '_modal-admin-create-user';
    modal.className = 'modal-overlay';
    modal.innerHTML = '<div class="modal" style="max-width:420px" id="_modal-admin-cu-inner"></div>';
    document.body.appendChild(modal);
    modal.addEventListener('click',function(e){ if(e.target===modal) closeM('_modal-admin-create-user'); });
  }
  document.getElementById('_modal-admin-cu-inner').innerHTML =
    '<div class="modal-header"><div class="modal-title"><i class="fa-solid fa-user"></i> إنشاء حساب مستخدم جديد</div>' +
    '<button class="close-btn" onclick="closeM(\'_modal-admin-create-user\')"><i class="fa-solid fa-xmark"></i></button></div>' +
    '<div style="padding:20px">' +
    '<div class="form-group"><label class="form-label">الاسم الكامل *</label>' +
    '<input id="_acu-name" class="form-input" placeholder="اسم المستخدم"></div>' +
    '<div class="form-group"><label class="form-label">البريد الإلكتروني *</label>' +
    '<input id="_acu-email" class="form-input" type="email" placeholder="user@example.com" dir="ltr"></div>' +
    '<div class="form-group"><label class="form-label">كلمة المرور *</label>' +
    '<input id="_acu-pass" class="form-input" type="password" placeholder="6 أحرف على الأقل"></div>' +
    '<div class="form-group"><label class="form-label">اسم العمل</label>' +
    '<input id="_acu-studio" class="form-input" placeholder="اختياري"></div>' +
    '<div id="_acu-msg" style="display:none;padding:8px 12px;border-radius:8px;font-size:12px;margin-bottom:12px"></div>' +
    '<button onclick="_adminCreateUser()" class="btn btn-primary" style="width:100%"><i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> إنشاء الحساب</button>' +
    '</div>';
  openM('_modal-admin-create-user');
}

async function _adminCreateUser(){
  var name   = document.getElementById('_acu-name')?.value.trim();
  var email  = document.getElementById('_acu-email')?.value.trim();
  var pass   = document.getElementById('_acu-pass')?.value;
  var studio = document.getElementById('_acu-studio')?.value.trim();
  var msg    = document.getElementById('_acu-msg');

  if(!name||!email||!pass){ if(msg){msg.style.display='block';msg.style.background='rgba(247,111,124,.15)';msg.style.color='var(--accent4)';msg.innerHTML='<i class="fa-solid fa-triangle-exclamation"></i> يرجى ملء جميع الحقول المطلوبة';} return; }
  if(pass.length < 6){ if(msg){msg.style.display='block';msg.style.background='rgba(247,111,124,.15)';msg.style.color='var(--accent4)';msg.innerHTML='<i class="fa-solid fa-triangle-exclamation"></i> كلمة المرور يجب أن تكون 6 أحرف على الأقل';} return; }

  if(msg){msg.style.display='block';msg.style.background='rgba(124,111,247,.15)';msg.style.color='var(--accent)';msg.textContent='⏳ جاري إنشاء الحساب...';}

  try {
    // Use admin API if available, otherwise use regular signup
    var result;
    if(typeof supa !== 'undefined' && supa.auth.admin){
      result = await supa.auth.admin.createUser({
        email, password: pass,
        user_metadata: { full_name: name, name, studio: studio||name+' Ordo' },
        email_confirm: true
      });
    } else {
      // Fallback: create via regular signup
      result = await supa.auth.signUp({
        email, password: pass,
        options: { data: { full_name: name, name, studio: studio||name+' Ordo' } }
      });
    }

    if(result.error){
      if(msg){msg.style.background='rgba(247,111,124,.15)';msg.style.color='var(--accent4)';msg.innerHTML='<i class="fa-solid fa-circle-xmark"></i> '+result.error.message;}
      return;
    }
    if(msg){msg.style.background='rgba(79,209,165,.15)';msg.style.color='var(--accent3)';msg.innerHTML='<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم إنشاء الحساب بنجاح! الإيميل: '+email;}
    setTimeout(function(){ closeM('_modal-admin-create-user'); }, 2000);
    if(typeof toast === 'function') toast('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم إنشاء حساب: '+name);
  } catch(e){
    if(msg){msg.style.background='rgba(247,111,124,.15)';msg.style.color='var(--accent4)';msg.innerHTML='<i class="fa-solid fa-circle-xmark"></i> '+e.message;}
  }
}

// ═══════════════════════════════════════════════════
// ADMIN: Send message to user
// ═══════════════════════════════════════════════════
function openAdminSendMessage(userId, userName){
  var modal = document.getElementById('_modal-admin-msg');
  if(!modal){
    modal = document.createElement('div');
    modal.id = '_modal-admin-msg';
    modal.className = 'modal-overlay';
    modal.innerHTML = '<div class="modal" style="max-width:420px" id="_modal-admin-msg-inner"></div>';
    document.body.appendChild(modal);
    modal.addEventListener('click',function(e){ if(e.target===modal) closeM('_modal-admin-msg'); });
  }
  document.getElementById('_modal-admin-msg-inner').innerHTML =
    '<div class="modal-header"><div class="modal-title"><i class="fa-solid fa-comments"></i> رسالة إلى ' + (userName||'المستخدم') + '</div>' +
    '<button class="close-btn" onclick="closeM(\'_modal-admin-msg\')"><i class="fa-solid fa-xmark"></i></button></div>' +
    '<div style="padding:20px">' +
    '<div class="form-group"><label class="form-label">العنوان</label>' +
    '<input id="_amsg-title" class="form-input" placeholder="مثال: تحديث مهم"></div>' +
    '<div class="form-group"><label class="form-label">نص الرسالة *</label>' +
    '<textarea id="_amsg-body" class="form-input" rows="4" placeholder="اكتب رسالتك هنا..."></textarea></div>' +
    '<div class="form-group"><label class="form-label">النوع</label>' +
    '<select id="_amsg-type" class="form-select">' +
    '<option value="info">ℹ معلومة</option>' +
    '<option value="success"><i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> إيجابي</option>' +
    '<option value="warning"><i class="fa-solid fa-triangle-exclamation"></i> تحذير</option>' +
    '<option value="message"><i class="fa-solid fa-comments"></i> رسالة</option>' +
    '</select></div>' +
    '<button onclick="_adminSendMessage(\'' + (userId||'') + '\')" class="btn btn-primary" style="width:100%"><i class="fa-solid fa-comments"></i> إرسال</button>' +
    '</div>';
  openM('_modal-admin-msg');
}

async function _adminSendMessage(userId){
  var title = document.getElementById('_amsg-title')?.value.trim() || 'رسالة من الإدارة';
  var body  = document.getElementById('_amsg-body')?.value.trim();
  var type  = document.getElementById('_amsg-type')?.value || 'message';
  if(!body){ toast('<i class="fa-solid fa-triangle-exclamation"></i> أدخل نص الرسالة'); return; }

  var sent = false;
  try {
    if(typeof supa !== 'undefined'){
      var notif = {
        user_id: userId || null,
        title, body, type,
        created_at: new Date().toISOString(),
        read: false
      };
      // Try user_notifications table first
      var res = await supa.from('user_notifications').insert([notif]);
      if(!res.error) sent = true;
      
      // ALSO: inject into user's studio_data as pending_notification (fallback)
      if(userId){
        try{
          var { data: ud } = await supa.from('studio_data').select('data').eq('user_id', userId).single();
          if(ud && ud.data){
            var userData = typeof ud.data==='string' ? JSON.parse(ud.data) : ud.data;
            userData._pending_notifications = userData._pending_notifications || [];
            userData._pending_notifications.push({
              id: Date.now(), title, body, type,
              created_at: new Date().toISOString(), read: false
            });
            await supa.from('studio_data').update({data: JSON.stringify(userData), updated_at: new Date().toISOString()}).eq('user_id', userId);
            sent = true;
          }
        }catch(e2){ console.warn('Fallback notification failed:', e2.message); }
      }
    }
    closeM('_modal-admin-msg');
    if(typeof toast === 'function') toast(sent ? '<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم إرسال الرسالة' : '<i class="fa-solid fa-triangle-exclamation"></i> تم الحفظ محلياً');
  } catch(e){
    if(typeof toast === 'function') toast('<i class="fa-solid fa-circle-xmark"></i> '+e.message);
  }
}

// Load notifications from Supabase (admin messages)
var _notifTableExists = null; // null=unknown, true=exists, false=missing

// Check if user_notifications table exists (silent — no console errors)
async function _checkNotifTableExists(){
  if(_notifTableExists !== null) return _notifTableExists;
  try {
    // Try fetching just 1 row with limit — if table missing, error.code = 42P01
    const { error } = await supa.from('user_notifications').select('id').limit(1);
    _notifTableExists = !(error && (error.code === '42P01' || error.message?.includes('does not exist')));
  } catch(e) { _notifTableExists = false; }
  return _notifTableExists;
}

async function _loadServerNotifications(){
  if(!_supaUserId || typeof supa === 'undefined') return;
  
  // METHOD 1: Check _pending_notifications in S (injected by admin into studio_data)
  if(typeof S !== 'undefined' && S._pending_notifications && S._pending_notifications.length){
    var newCount = 0;
    S._pending_notifications.forEach(function(n){
      var exists = _notifications.find(function(x){ return x.id === 'pn_'+n.id; });
      if(!exists){
        _notifications.unshift({
          id: 'pn_'+n.id,
          msg: (n.title ? '**'+n.title+'**\n' : '')+n.body,
          type: n.type||'message',
          orderId: n.orderId||'',
          time: n.created_at, read: false
        });
        if(!n.read) newCount++;
      }
    });
    // Clear pending after loading
    S._pending_notifications = [];
    _queueCloudSave();
    if(newCount > 0){
      _saveNotifications(); _updateNotifBell();
      if(typeof toast === 'function') toast('<i class="fa-solid fa-comments"></i> لديك '+newCount+' رسالة جديدة من الإدارة');
    }
  }
  
  // METHOD 2: user_notifications table (if exists)
  if(_notifTableExists === false) return;
  if(_notifTableExists === null) {
    const exists = await _checkNotifTableExists();
    if(!exists) return;
  }
  try {
    var res = await supa.from('user_notifications')
      .select('*')
      .or('user_id.eq.'+_supaUserId+',user_id.is.null')
      .order('created_at', {ascending:false})
      .limit(30);
    if(res.error){
      _notifTableExists = false;
      return;
    }
    _notifTableExists = true;
    if(res.data && res.data.length){
      var newCount2 = 0;
      res.data.forEach(function(n){
        var exists = _notifications.find(function(x){ return x.id === 'srv_'+n.id; });
        if(!exists){
          // استخرج صفحة الوجهة من الـ body لو موجودة
          var _rawBody = n.body || '';
          var _pageFromBody = '';
          var _pageMatch = _rawBody.match(/\n__page__:(.+)$/);
          if(_pageMatch) { _pageFromBody = _pageMatch[1].trim(); _rawBody = _rawBody.replace(/\n__page__:.+$/, ''); }
          _notifications.unshift({
            id: 'srv_'+n.id, supaId: n.id,
            msg: (n.title ? '**'+n.title+'**\n' : '')+_rawBody,
            type: n.type==='broadcast'?'message':n.type||'message',
            time: n.created_at, read: false,
            page: n.action_page || n.page || _pageFromBody || ''
          });
          if(!n.read) newCount2++;
        }
      });
      if(newCount2 > 0) {
        _saveNotifications(); _updateNotifBell();
        // Check if any team_added notifications
        var hasTeamNotif = res.data.some(function(n){ return n.type==='team_added'; });
        var toastMsg = hasTeamNotif
          ? '<i class="fa-solid fa-people-group" style="color:var(--accent3)"></i> تمت إضافتك لفريق جديد!'
          : '<i class="fa-solid fa-bell"></i> لديك '+newCount2+' إشعار جديد';
        if(typeof toast === 'function') toast(toastMsg);
      }
    }
  } catch(e){ _notifTableExists = false; }
}

// Mark server notifications as read in Supabase
async function _markServerNotifsRead(){
  if(!_supaUserId || typeof supa === 'undefined') return;
  if(_notifTableExists === false) return;
  try {
    var unreadIds = _notifications
      .filter(function(n){ return n.supaId && !n.read; })
      .map(function(n){ return n.supaId; });
    if(unreadIds.length){
      await supa.from('user_notifications').update({read:true}).in('id', unreadIds);
    }
  } catch(e){}
}

// Poll for new server notifications every 30s — retry after login
window.addEventListener('load', function(){
  setTimeout(_loadServerNotifications, 2000);
  setTimeout(_loadServerNotifications, 6000);
  setInterval(_loadServerNotifications, 30000);
});

async function _pollReviews(){
  if(!_supaUserId||!supa)return;
  try{
    const {data:row}=await supa.from('studio_data').select('data').eq('user_id',_supaUserId).maybeSingle();
    if(!row?.data)return;
    let fresh=row.data; if(typeof fresh==='string')fresh=JSON.parse(fresh);
    if(fresh?.data&&typeof fresh.tasks==='undefined')fresh=typeof fresh.data==='string'?JSON.parse(fresh.data):fresh.data;
    const newRevs=fresh?.reviews||[];
    if(newRevs.length>(S.reviews||[]).length){
      S.reviews=newRevs; lsSave();
      const _rb=document.getElementById('reviews-badge');
      if(_rb){_rb.textContent=newRevs.length;_rb.style.display=newRevs.length?'inline-flex':'none';}
      if(document.getElementById('page-reviews')?.classList.contains('active'))renderReviewsPage();
      toast('⭐ وصل تقييم جديد!');
    }
  }catch(e){}
}
setInterval(_pollReviews,45000); setTimeout(_pollReviews,5000);
document.addEventListener('visibilitychange', function(){
  if(!document.hidden) {
    _loadServerNotifications();
  } else {
    // المستخدم غادر التاب — احفظ فوراً للسحابة
    if(_supaUserId && S) {
      clearTimeout(_syncTimer);
      _doCloudSave(S);
    }
  }
});;
// ═══════════════════════════════════════════════════

var _dashEditMode = false;
var _dashDragSrc = null;

function _toggleDashEdit(){
  _dashEditMode = !_dashEditMode;
  var btn    = document.getElementById('_dash-edit-btn');
  var banner = document.getElementById('_dash-edit-banner');
  if(btn){
    btn.style.borderColor = _dashEditMode ? 'var(--accent)' : 'var(--border)';
    btn.style.color = _dashEditMode ? 'var(--accent)' : 'var(--text3)';
    btn.style.background = _dashEditMode ? 'rgba(124,111,247,.1)' : 'var(--surface2)';
  }
  if(banner) banner.style.display = _dashEditMode ? 'flex' : 'none';
  _renderDashGrid();
}

function _hideWidget(id){
  // تحدي الأسبوع لا يمكن إخفاؤه — يثبت دائماً في الصفحة الرئيسية
  if(id === 'challenge') return;
  var layout = _getDashLayout();
  var w = layout.find(function(x){ return x.id===id; });
  if(w){ w.visible=false; _saveDashLayout(layout); _renderDashGrid(); }
}

function _showWidget(id){
  var layout = _getDashLayout();
  var w = layout.find(function(x){ return x.id===id; });
  if(w){ w.visible=true; _saveDashLayout(layout); _renderDashGrid(); }
}

// Build inner HTML for each widget type
function _widgetInnerHTML(id){
  if(id==='stats'){
    return '<div class="grid grid-4" id="_dash-stats-inner">' +
      '<div class="card"><div class="stat-label">\uD83D\uDCB0 \u0625\u064A\u0631\u0627\u062F\u0627\u062A \u0645\u0633\u062C\u0644\u0629</div><div class="stat-value green" id="dash-income">0 \u062C</div><div class="stat-change">\u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u062F\u062E\u0644</div></div>' +
      '<div class="card"><div class="stat-label">\uD83D\uDCCB \u0645\u0634\u0627\u0631\u064A\u0639 \u0646\u0634\u0637\u0629</div><div class="stat-value purple" id="dash-projects">0</div><div class="stat-change">\u063A\u064A\u0631 \u0645\u0643\u062A\u0645\u0644\u0629</div></div>' +
      '<div class="card"><div class="stat-label">\u2705 \u0645\u0647\u0627\u0645 \u0645\u0643\u062A\u0645\u0644\u0629</div><div class="stat-value yellow" id="dash-done">0</div><div class="stat-change" id="dash-pending-txt">0 \u0645\u0639\u0644\u0642\u0629</div></div>' +
      '<div class="card"><div class="stat-label">\uD83D\uDC65 \u0627\u0644\u0639\u0645\u0644\u0627\u0621</div><div class="stat-value" id="dash-clients">0</div><div class="stat-change">\u0641\u064A \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A</div></div>' +
      '</div>';
  }
  if(id==='overdue'){
    return '<div class="card" id="dash-overdue-section" style="border-color:rgba(247,111,124,.35);height:100%">' +
      '<div class="section-title" style="color:var(--accent4)">\u26A0 \u0645\u0647\u0627\u0645 \u062A\u062C\u0627\u0648\u0632\u062A 24 \u0633\u0627\u0639\u0629</div>' +
      '<div id="dash-overdue-list"><div class="empty" style="padding:8px 0"><div class="empty-icon" style="font-size:18px">\u2705</div><div style="font-size:12px">\u0644\u0627 \u0645\u0647\u0627\u0645 \u0645\u062A\u0623\u062E\u0631\u0629</div></div></div></div>';
  }
  if(id==='subs'){
    return '<div class="card" id="dash-subs-alert" style="border-color:rgba(124,111,247,.3);height:100%">' +
      '<div class="section-title" style="color:var(--accent)">\uD83D\uDD14 \u0627\u0634\u062A\u0631\u0627\u0643\u0627\u062A \u0642\u0631\u064A\u0628\u0629 \u0627\u0644\u062A\u062C\u062F\u064A\u062F</div>' +
      '<div id="dash-subs-list"><div class="empty" style="padding:8px 0"><div class="empty-icon" style="font-size:18px">\u2705</div><div style="font-size:12px">\u0644\u0627 \u0627\u0634\u062A\u0631\u0627\u0643\u0627\u062A \u0645\u0646\u062A\u0647\u064A\u0629</div></div></div></div>';
  }
  if(id==='kanban'){
    return '<div class="card" id="dash-kanban-mini" style="height:100%">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">' +
      '<div class="section-title" style="margin:0">\u26A1 \u0627\u0644\u0645\u0647\u0627\u0645 \u0627\u0644\u0646\u0634\u0637\u0629</div>' +
      '<button onclick="showPage(\'tasks\')" class="btn btn-ghost btn-sm" style="font-size:11px">\u0639\u0631\u0636 \u0627\u0644\u0643\u0644 \u2190</button></div>' +
      '<div id="dash-kanban-mini-list"><div class="empty" style="padding:8px 0"><div class="empty-icon">\u2746</div><div style="font-size:12px">\u0644\u0627 \u0645\u0647\u0627\u0645 \u0646\u0634\u0637\u0629</div></div></div></div>';
  }
  if(id==='uncollected'){
    return '<div class="card" id="dash-uncollected-alert" style="border-color:rgba(247,201,72,.3);height:100%">' +
      '<div class="section-title" style="color:var(--accent2)">\uD83D\uDCB8 \u0645\u0628\u0627\u0644\u063A \u0644\u0645 \u062A\u064F\u062D\u0635\u064E\u0651\u0644</div>' +
      '<div id="dash-uncollected-list"><div class="empty" style="padding:8px 0"><div class="empty-icon" style="font-size:18px">\u2705</div><div style="font-size:12px">\u0643\u0644 \u0627\u0644\u0645\u0628\u0627\u0644\u063A \u0645\u062D\u0635\u0651\u0644\u0629</div></div></div></div>';
  }
  if(id==='team'){
    return '<div class="card" id="dash-team-section" style="border-color:rgba(79,209,165,.25);height:100%">' +
      '<div class="section-title" style="color:var(--accent3)">\uD83D\uDC65 \u0645\u0647\u0627\u0645 \u0623\u0639\u0636\u0627\u0621 \u0627\u0644\u0641\u0631\u064A\u0642</div>' +
      '<div id="dash-team-tasks"><div class="empty" style="padding:8px 0"><div class="empty-icon" style="font-size:18px">\uD83D\uDC65</div><div style="font-size:12px">\u0644\u0627 \u0645\u0647\u0627\u0645 \u0645\u0633\u0646\u062F\u0629</div></div></div></div>';
  }
  if(id==='teampay'){
    return '<div class="card" id="dash-team-pay-section" style="border-color:rgba(100,181,246,.25);height:100%">' +
      '<div class="section-title" style="color:#64b5f6">\uD83D\uDCB0 \u0645\u0633\u062A\u062D\u0642\u0627\u062A \u0627\u0644\u0641\u0631\u064A\u0642</div>' +
      '<div id="dash-team-pay-list"><div class="empty" style="padding:8px 0"><div class="empty-icon" style="font-size:18px">\u2705</div><div style="font-size:12px">\u0644\u0627 \u0645\u0633\u062A\u062D\u0642\u0627\u062A \u0645\u062A\u0623\u062E\u0631\u0629</div></div></div></div>';
  }
  if(id==='tasks'){
    return '<div class="card" style="height:100%"><div class="section-title">\uD83D\uDCCB \u0622\u062E\u0631 \u0627\u0644\u0645\u0647\u0627\u0645</div>' +
      '<div id="dash-tasks-list"><div class="empty"><div class="empty-icon">\u2746</div>\u0644\u0627 \u0645\u0647\u0627\u0645</div></div></div>';
  }
  if(id==='schedule'){
    return '<div class="card" style="height:100%"><div class="section-title">\uD83D\uDDD3 \u062C\u062F\u0648\u0644 \u0627\u0644\u064A\u0648\u0645</div>' +
      '<div id="dash-sched-list"><div class="empty"><div class="empty-icon">\u25F7</div>\u0644\u0627 \u062C\u062F\u0648\u0644 \u0627\u0644\u064A\u0648\u0645</div></div></div>';
  }
  if(id==='invoices'){
    return '<div class="card" style="height:100%"><div class="section-title">\uD83E\uDDFE \u0641\u0648\u0627\u062A\u064A\u0631 \u0645\u0639\u0644\u0642\u0629</div>' +
      '<div id="dash-inv-list"><div class="empty"><div class="empty-icon">\u25FB</div>\u0644\u0627 \u0641\u0648\u0627\u062A\u064A\u0631 \u0645\u0639\u0644\u0642\u0629</div></div></div>';
  }
  if(id==='goals'){
    return '<div class="card" style="height:100%"><div class="section-title">\uD83C\uDFAF \u0623\u0647\u062F\u0627\u0641 \u0627\u0644\u062A\u0637\u0648\u064A\u0631</div>' +
      '<div id="dash-goals-list"><div class="empty"><div class="empty-icon">\u25C6</div>\u0623\u0636\u0641 \u0623\u0647\u062F\u0627\u0641\u0643</div></div></div>';
  }
  if(id==='active_projects'){
    var activeProjs = (S.projects||[]).filter(function(p){return p.status==='active'||p.status==='progress'||(!p.status&&p.name);}).slice(0,5);
    var projHtml = activeProjs.length ? activeProjs.map(function(p){
      var tasks=(S.project_tasks||[]).filter(function(t){return String(t.project_id)===String(p.id);});
      var done=tasks.filter(function(t){return t.status==='done';}).length;
      var pct=tasks.length?Math.round(done/tasks.length*100):0;
      return '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);cursor:pointer" onclick="showPage(\'projects\');setTimeout(function(){openProjectDetail('+p.id+')},150)">'+
        '<div style="flex:1;min-width:0">'+
          '<div style="font-size:12px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+(p.name||'—')+'</div>'+
          (p.client?'<div style="font-size:10px;color:var(--text3)">'+p.client+'</div>':'')+
          (tasks.length?'<div style="height:3px;background:var(--surface3);border-radius:2px;margin-top:5px;overflow:hidden"><div style="height:100%;width:'+pct+'%;background:var(--accent);border-radius:2px"></div></div>':'')+
        '</div>'+
        (tasks.length?'<div style="font-size:10px;color:var(--text3);flex-shrink:0">'+pct+'%</div>':'')+
      '</div>';
    }).join('') : '<div class="empty" style="padding:8px 0"><div style="font-size:12px">لا مشاريع نشطة</div></div>';
    return '<div class="card" style="height:100%"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">'+
      '<div class="section-title" style="margin:0"><i class="fa-solid fa-diagram-project" style="color:var(--accent)"></i> المشاريع النشطة</div>'+
      '<button onclick="showPage(\'projects\')" class="btn btn-ghost btn-sm" style="font-size:10px">كل المشاريع ←</button></div>'+
      projHtml+'</div>';
  }
  if(id==='meetings'){
    return '<div class="card" style="border-color:rgba(124,111,247,.3)">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">' +
      '<div class="section-title" style="margin:0;color:var(--accent)">\uD83D\uDCC5 \u0627\u0644\u0645\u064A\u062A\u0646\u062C\u0627\u062A \u0627\u0644\u0642\u0627\u062F\u0645\u0629</div>' +
      '<div style="display:flex;gap:6px">' +
      '<button onclick="openMeetingModal()" class="btn btn-ghost btn-sm" style="font-size:11px">+ \u062C\u062F\u064A\u062F</button>' +
      '<button onclick="showPage(\'meetings\')" class="btn btn-ghost btn-sm" style="font-size:11px">\u0639\u0631\u0636 \u0627\u0644\u0643\u0644 \u2190</button>' +
      '</div></div>' +
      '<div id="dash-meetings-shortcut"><div class="empty" style="padding:8px 0"><div class="empty-icon">\uD83D\uDCC5</div>\u0644\u0627 \u0645\u064A\u062A\u0646\u062C\u0627\u062A \u0642\u0627\u062F\u0645\u0629</div></div></div>';
  }
  return '<div class="card">' + id + '</div>';
}

function _renderDashGrid(){
  var grid = document.getElementById('_dash-grid');
  if(!grid) return;

  var layout = _getDashLayout().sort(function(a,b){ return a.row - b.row; });
  // تحدي الأسبوع دائماً مرئي — لا يمكن إخفاؤه
  layout.forEach(function(w){ if(w.id==='challenge') w.visible=true; });
  var visible = layout.filter(function(w){ return w.visible; });
  var hidden  = layout.filter(function(w){ return !w.visible; });

  var html = '';

  // Render by rows — group consecutive non-full widgets into 2-col rows
  var i = 0;
  while(i < visible.length){
    var w = visible[i];
    var def = _getDef(w.id);
    var isFull = w.full !== undefined ? w.full : def.full;

    if(isFull){
      // Full width widget
      html += _wrapWidget(w, _widgetInnerHTML(w.id), true);
      i++;
    } else {
      // Try to pair with next non-full widget
      var w2 = visible[i+1];
      var def2 = w2 ? _getDef(w2.id) : null;
      var w2Full = w2 ? (w2.full !== undefined ? w2.full : def2.full) : true;
      if(w2 && !w2Full){
        // Responsive: 2-col on desktop, 1-col on mobile
        var isMobile = window.innerWidth <= 540;
        if(isMobile){
          html += _wrapWidget(w,  _widgetInnerHTML(w.id),  true);
          html += _wrapWidget(w2, _widgetInnerHTML(w2.id), true);
        } else {
          html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;align-items:start">';
          html += _wrapWidget(w,  _widgetInnerHTML(w.id),  false);
          html += _wrapWidget(w2, _widgetInnerHTML(w2.id), false);
          html += '</div>';
        }
        i += 2;
      } else {
        html += _wrapWidget(w, _widgetInnerHTML(w.id), true);
        i++;
      }
    }
  }

  // Hidden restore bar
  if(_dashEditMode && hidden.length > 0){
    var hidBtns = '';
    for(var h=0; h<hidden.length; h++){
      var hw = hidden[h];
      var hd = _getDef(hw.id);
      hidBtns += '<button onclick="_showWidget(\'' + hw.id + '\')" style="padding:5px 12px;background:var(--surface3);border:1px solid var(--border);border-radius:20px;font-size:12px;color:var(--text2);cursor:pointer;font-family:var(--font)">' + hd.label + '</button>';
    }
    html += '<div style="background:var(--surface2);border:1.5px dashed var(--border);border-radius:12px;padding:12px 14px">' +
      '<div style="font-size:11px;color:var(--text3);margin-bottom:8px;font-weight:700">ودجتس مخفية — اضغط لإظهارها</div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:8px">' + hidBtns + '</div></div>';
  }

  grid.innerHTML = html;

  // Setup drag in edit mode
  if(_dashEditMode){
    var cards = grid.querySelectorAll('[data-widget-card]');
    cards.forEach(function(el){
      el.draggable = true;
      el.style.cursor = 'grab';
      el.addEventListener('dragstart', function(e){
        _dashDragSrc = el.dataset.widgetCard;
        el.style.opacity = '0.5';
        e.dataTransfer.effectAllowed = 'move';
      });
      el.addEventListener('dragend', function(){ el.style.opacity='1'; });
      el.addEventListener('dragover', function(e){ e.preventDefault(); el.style.outline='2px dashed var(--accent)'; });
      el.addEventListener('dragleave', function(){ el.style.outline='none'; });
      // Touch drag support for mobile
      el.addEventListener('touchstart', function(e){
        _dashDragSrc = el.dataset.widgetCard;
        el.style.opacity='0.6';
        el.style.outline='2px dashed var(--accent)';
      },{passive:true});
      el.addEventListener('touchend', function(e){
        el.style.opacity='1'; el.style.outline='none';
        var touch = e.changedTouches[0];
        var target = document.elementFromPoint(touch.clientX, touch.clientY);
        var targetEl = target ? target.closest('[data-widget-card]') : null;
        var targetId = targetEl ? targetEl.dataset.widgetCard : null;
        if(!_dashDragSrc || !targetId || _dashDragSrc===targetId){_dashDragSrc=null;return;}
        var lay=_getDashLayout();
        var si=lay.findIndex(function(x){return x.id===_dashDragSrc;});
        var ti=lay.findIndex(function(x){return x.id===targetId;});
        if(si>-1&&ti>-1){var tmp=lay[si].row;lay[si].row=lay[ti].row;lay[ti].row=tmp;}
        _saveDashLayout(lay); _dashDragSrc=null; _renderDashGrid();
      },{passive:true});
      el.addEventListener('drop', function(e){
        e.preventDefault(); el.style.outline='none';
        var targetId = el.dataset.widgetCard;
        if(!_dashDragSrc || _dashDragSrc === targetId) return;
        var lay = _getDashLayout();
        var si2 = lay.findIndex(function(x){ return x.id===_dashDragSrc; });
        var ti2 = lay.findIndex(function(x){ return x.id===targetId; });
        if(si2===-1||ti2===-1) return;
        var tmp = lay[si2].row; lay[si2].row = lay[ti2].row; lay[ti2].row = tmp;
        // Also swap full flags for layout
        var tmpF = lay[si2].full; lay[si2].full = lay[ti2].full; lay[ti2].full = tmpF;
        _saveDashLayout(lay);
        _renderDashGrid();
        updateDash();
      });
    });
  }

  updateDash();
}

function _wrapWidget(w, innerHtml, fullWidth){
  var def = _getDef(w.id);
  var isFull = w.full !== undefined ? w.full : def.full;
  var editStyle = _dashEditMode ? 'border:2px dashed rgba(124,111,247,.35);border-radius:14px;' : '';
  var hideBtn = '';
  if(_dashEditMode){
    hideBtn = '<button onclick="_hideWidget(\'' + w.id + '\')" style="position:absolute;top:-7px;right:-7px;z-index:10;width:22px;height:22px;border-radius:50%;background:var(--accent4);border:none;color:#fff;font-size:11px;cursor:pointer;font-weight:900;display:flex;align-items:center;justify-content:center;line-height:1">\u2715</button>';
  }
  // Toggle full/half button in edit mode
  var toggleBtn = '';
  if(_dashEditMode && !['stats','meetings'].includes(w.id)){
    var icon = isFull ? '\u25D6' : '\u25A1';
    var tip = isFull ? '\u062C\u0639\u0644\u0647 \u0646\u0635\u0641' : '\u062C\u0639\u0644\u0647 \u0643\u0627\u0645\u0644';
    toggleBtn = '<button onclick="_toggleWidgetFull(\'' + w.id + '\')" title="' + tip + '" style="position:absolute;top:-7px;left:20px;z-index:10;width:22px;height:22px;border-radius:50%;background:var(--accent);border:none;color:#fff;font-size:10px;cursor:pointer;font-weight:900;display:flex;align-items:center;justify-content:center">' + icon + '</button>';
  }
  return '<div data-widget-card="' + w.id + '" style="position:relative;' + editStyle + '">' +
    hideBtn + toggleBtn + innerHtml + '</div>';
}

function _toggleWidgetFull(id){
  var lay = _getDashLayout();
  var w = lay.find(function(x){ return x.id===id; });
  var def = _getDef(id);
  if(w){
    var curFull = w.full !== undefined ? w.full : def.full;
    w.full = !curFull;
    _saveDashLayout(lay);
    _renderDashGrid();
  }
}

// updateDash calls _renderDashGrid if grid is empty (see updateDash function above)
window.addEventListener('load', function(){ setTimeout(_renderDashGrid, 400); });

