// ════════════════════════════════════════════════════════════════
// <i class="fa-solid fa-comments"></i>  SUPPORT SYSTEM
// ════════════════════════════════════════════════════════════════
function renderSupport(){
  var el=document.getElementById('support-grid'); if(!el) return;
  if(typeof S==='undefined') return;
  var msgs=(S.support_msgs||[]).slice().reverse();
  var unread=msgs.filter(function(m){return !m.read;}).length;
  var badge=document.getElementById('support-badge');
  if(badge){ badge.textContent=unread; badge.style.display=unread?'':'none'; }
  if(!msgs.length){
    el.innerHTML='<div class="empty card" style="grid-column:span 2;text-align:center;padding:50px"><div style="font-size:48px;margin-bottom:12px"><i class="fa-solid fa-comments"></i></div><div style="font-size:16px;font-weight:800;margin-bottom:8px">لا توجد رسائل بعد</div><div style="font-size:13px;color:var(--text3)">ستظهر هنا رسائل العملاء وطلبات الاجتماعات</div></div>';
    return;
  }
  el.innerHTML=msgs.map(function(m){
    var typeIcon={meeting:'<i class="fa-solid fa-calendar-days"></i>',support:'🆘',message:'<i class="fa-solid fa-comments"></i>',svc_order:'<i class="fa-solid fa-inbox"></i>',contact:'<i class="fa-solid fa-envelope-open-text"></i>',meeting_request:'<i class="fa-solid fa-calendar-days"></i>',direct_message:'<i class="fa-solid fa-envelope" style="color:var(--accent)"></i>'}[m.type]||'<i class="fa-solid fa-comments"></i>';
    var typeLabel={meeting:'طلب اجتماع',support:'طلب دعم',message:'رسالة',svc_order:'طلب خدمة',meeting_request:'طلب اجتماع',contact:'رسالة تواصل',direct_message:'رسالة داخلية'}[m.type]||m.type||'رسالة';
    var senderName = m.client_name || m.from || 'عضو';
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">'+
        '<div style="display:flex;align-items:center;gap:8px">'+
          '<span style="font-size:18px">'+typeIcon+'</span>'+
          '<div><div style="font-size:13px;font-weight:800">'+escapeHtml(senderName)+'</div>'+
          '<div style="font-size:10px;color:var(--accent);font-weight:700">'+typeLabel+'</div></div>'+
        '</div>'+
        (!m.read?'<span style="width:8px;height:8px;background:var(--accent4);border-radius:50%;display:inline-block"></span>':'')+
      '</div>'+
      (m.message||m.body?'<div style="font-size:12px;color:var(--text3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-bottom:8px">'+escapeHtml((m.subject?m.subject+': ':'')+(m.message||m.body||'').slice(0,100))+'</div>':'')+
      (m.preferred_time?'<div style="font-size:11px;color:var(--text3)"><i class="fa-solid fa-alarm-clock"></i> '+escapeHtml(m.preferred_time)+'</div>':'')+
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-top:10px">'+
        '<div style="font-size:10px;color:var(--text3)">'+(m.created_at?new Date(m.created_at).toLocaleDateString('ar-EG'):'')+'</div>'+
        '<button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();openSupportReply(\''+m.id+'\')">↩ رد</button>'+
      '</div>'+
    '</div>';
  }).join('');
}

function openSupportMsg(msgId){
  if(!S.support_msgs) return;
  var m=S.support_msgs.find(function(x){return x.id===msgId;}); if(!m) return;
  m.read=true; lsSave(); cloudSave(S); renderSupport();
  openSupportReply(msgId);
}

var _currentSupportMsgId='';
function openSupportReply(msgId){
  _currentSupportMsgId=msgId;
  var m=(S.support_msgs||[]).find(function(x){return x.id===msgId;}); if(!m) return;
  var body=document.getElementById('support-reply-body'); if(!body) return;
  body.innerHTML=
    '<div style="background:var(--surface2);border-radius:12px;padding:12px;margin-bottom:12px">'+
      '<div style="font-size:12px;font-weight:800;margin-bottom:6px">من: <strong>'+escapeHtml(m.client_name||'عميل')+'</strong></div>'+
      (m.client_email?'<div style="font-size:11px;color:var(--text3)"><i class="fa-solid fa-envelope"></i> '+escapeHtml(m.client_email)+'</div>':'')+
      (m.preferred_time?'<div style="font-size:11px;color:var(--text3)"><i class="fa-solid fa-alarm-clock"></i> '+escapeHtml(m.preferred_time)+'</div>':'')+
      (m.message||m.body?'<div style="font-size:12px;color:var(--text2);margin-top:8px;line-height:1.6;padding:8px;background:var(--surface);border-radius:8px">'+escapeHtml(m.message||m.body||'')+'</div>':'')+
      (m.replies&&m.replies.length?
        '<div style="margin-top:10px"><div style="font-size:11px;font-weight:700;color:var(--text3);margin-bottom:6px">ردودك السابقة:</div>'+
        m.replies.map(function(r){ return '<div style="font-size:12px;color:var(--text2);padding:6px 10px;background:rgba(124,111,247,.08);border-radius:8px;margin-bottom:4px;border-right:2px solid var(--accent)">'+escapeHtml(r.text)+'<div style="font-size:10px;color:var(--text3);margin-top:2px">'+new Date(r.at).toLocaleDateString('ar-EG')+'</div></div>'; }).join('')+
        '</div>':'')+
    '</div>';
  document.getElementById('support-reply-text').value='';
  openM('modal-support-reply');
}

function sendSupportReply(){
  var text=(document.getElementById('support-reply-text')||{}).value||'';
  if(!text.trim()){ toast('<i class="fa-solid fa-triangle-exclamation"></i> الرد فارغ'); return; }
  var m=(S.support_msgs||[]).find(function(x){return x.id===_currentSupportMsgId;}); if(!m) return;
  if(!m.replies) m.replies=[];
  m.replies.push({ text:text.trim(), at:new Date().toISOString() });
  m.read=true;
  lsSave(); cloudSave(S); closeM('modal-support-reply'); renderSupport(); toast('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم إرسال الرد');
  if(m.client_email){
    toast('<i class="fa-solid fa-lightbulb"></i> تذكّر مراسلة العميل على: '+m.client_email);
  }
}

// startup check (fallback if early IIFE didn't fire)
window.addEventListener('load', function(){
  var p=new URLSearchParams(window.location.search);
  if(p.get('svcorder')||( p.get('portal')&&p.get('uid') )) _checkSvcOrderUrl();
  // Project portal
  if(p.get('portal')==='project'&&p.get('uid')&&p.get('pid')){
    document.documentElement.classList.add('pub-page');
    document.body.classList.add('pub-page');
    _buildProjectPortalPage(p.get('uid'),p.get('pid'));
  }
  // Full client portal
  if(p.get('clientportal')&&p.get('cid')&&!window._fullCPBuilt){
    window._fullCPBuilt=true;
    document.documentElement.classList.add('pub-page');
    document.body.classList.add('pub-page');
    _buildFullClientPortal(p.get('clientportal'),p.get('cid'));
  }
});

// Re-trigger admin notifications after cloudLoad (user login)
(function(){
  var origCL=window.cloudLoad;
  window.cloudLoad=async function(){
    var res=origCL?await origCL.apply(this,arguments):null;
    setTimeout(_loadServerNotifications,1500);
    return res;
  };
})();


// ═══════════════════════════════════════════════════
// INJECT CSS ANIMATIONS
// ═══════════════════════════════════════════════════
(function(){
  const s = document.createElement('style');
  s.textContent = `
    @keyframes _confettiFall{0%{transform:translateY(0) rotate(0deg) translateX(0);opacity:1}100%{transform:translateY(100vh) rotate(720deg) translateX(var(--tx,0px));opacity:0}}
    @keyframes _celebIn{0%{transform:scale(.4);opacity:0}100%{transform:scale(1);opacity:1}}
    @keyframes _notifSlide{0%{transform:translateX(-50%) translateY(-24px);opacity:0}100%{transform:translateX(-50%) translateY(0);opacity:1}}
  `;
  document.head.appendChild(s);
})();

