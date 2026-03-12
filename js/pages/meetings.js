// MEETINGS — CRUD + Render
// ============================================================
function openMeetingModal(id){
  document.getElementById('mtg-modal-title').innerHTML = id ? '<i class="fa-solid fa-pen"></i> تعديل ميتنج' : '<i class="fa-solid fa-calendar-days"></i> ميتنج جديد';
  document.getElementById('mtg-eid').value = id||'';
  // Fill client dropdown
  const sel=document.getElementById('mtg-client'); if(sel){ sel.innerHTML='<option value="">— اختر عميل —</option>'; S.clients.forEach(c=>{const o=document.createElement('option');o.value=c.name;o.textContent=c.name;sel.appendChild(o);}); }
  if(id){
    const m=S.meetings.find(x=>x.id===id); if(!m) return;
    document.getElementById('mtg-title').value=m.title||'';
    if(sel) sel.value=m.client||'';
    document.getElementById('mtg-date').value=m.date||'';
    document.getElementById('mtg-time').value=m.time||'10:00';
    document.getElementById('mtg-duration').value=m.duration||60;
    document.getElementById('mtg-type').value=m.type||'online';
    document.getElementById('mtg-link').value=m.link||'';
    document.getElementById('mtg-brief').innerHTML=m.brief||'';
    document.getElementById('mtg-notes').innerHTML=m.notes||'';
  } else {
    ['mtg-title','mtg-link'].forEach(id=>{const e=document.getElementById(id);if(e)e.value='';});
    document.getElementById('mtg-date').value=new Date().toISOString().split('T')[0];
    document.getElementById('mtg-time').value='10:00';
    document.getElementById('mtg-duration').value=60;
    document.getElementById('mtg-brief').innerHTML='';
    document.getElementById('mtg-notes').innerHTML='';
  }
  openM('modal-meeting');
}
function mtgFormat(cmd,val){ document.getElementById('mtg-brief').focus(); document.execCommand(cmd,false,val||null); }
function mtgNotesFormat(cmd,val){ document.getElementById('mtg-notes').focus(); document.execCommand(cmd,false,val||null); }
function saveMeeting(){
  const title=document.getElementById('mtg-title')?.value.trim(); if(!title) return alert('أدخل عنوان الميتنج');
  const eid=document.getElementById('mtg-eid')?.value;
  const d={
    id:eid?+eid:Date.now(),
    title, client:document.getElementById('mtg-client')?.value||'',
    date:document.getElementById('mtg-date')?.value||'',
    time:document.getElementById('mtg-time')?.value||'',
    duration:+(document.getElementById('mtg-duration')?.value)||60,
    type:document.getElementById('mtg-type')?.value||'online',
    link:document.getElementById('mtg-link')?.value||'',
    brief:document.getElementById('mtg-brief')?.innerHTML||'',
    notes:document.getElementById('mtg-notes')?.innerHTML||'',
    done: eid ? (S.meetings.find(m=>m.id===+eid)?.done||false) : false,
  };
  if(eid){const i=S.meetings.findIndex(m=>m.id===+eid);if(i>-1)S.meetings[i]=d;}
  else S.meetings.push(d);
  lsSave(); closeM('modal-meeting'); renderMeetings();
  showMiniNotif('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم حفظ الميتنج: '+title);
}
function delMeeting(id){ confirmDel('حذف هذا الميتنج؟',()=>{ S.meetings=S.meetings.filter(m=>m.id!==id); lsSave(); renderMeetings(); }); }
function toggleMeetingDone(id){ const m=S.meetings.find(x=>x.id===id); if(m){m.done=!m.done;lsSave();renderMeetings();} }

// ── Meeting Slot Settings ──
function openMeetingSlotSettings(){
  if(!S.settings) S.settings={};
  if(!S.settings.meeting_slots) S.settings.meeting_slots=[];
  renderMeetingSlotsList();
  openM('modal-meeting-slots');
}
function renderMeetingSlotsList(){
  const el=document.getElementById('meeting-slots-list'); if(!el) return;
  const slots=S.settings.meeting_slots||[];
  if(!slots.length){ el.innerHTML='<div style="font-size:12px;color:var(--text3);text-align:center;padding:16px">لا أوقات متاحة بعد — أضف وقتاً أدناه</div>'; return; }
  el.innerHTML=slots.map((s,i)=>`
    <div style="display:flex;align-items:center;gap:10px;background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:10px 12px">
      <div style="flex:1">
        <span style="font-weight:700;color:var(--accent)">${s.day}</span>
        <span style="font-size:12px;color:var(--text2);margin-right:8px">${s.from} — ${s.to}</span>
      </div>
      <button onclick="removeMeetingSlot(${i})" class="btn btn-danger btn-sm" style="padding:3px 8px"><i class="fa-solid fa-xmark"></i></button>
    </div>`).join('');
}
function addMeetingSlot(){
  const day=document.getElementById('new-slot-day')?.value;
  const from=document.getElementById('new-slot-from')?.value;
  const to=document.getElementById('new-slot-to')?.value;
  if(!day||!from||!to){ alert('اختر اليوم والوقت'); return; }
  if(from>=to){ alert('وقت البداية يجب أن يكون قبل وقت النهاية'); return; }
  if(!S.settings) S.settings={};
  if(!S.settings.meeting_slots) S.settings.meeting_slots=[];
  S.settings.meeting_slots.push({day,from,to});
  renderMeetingSlotsList();
}
function removeMeetingSlot(idx){
  if(!S.settings||!S.settings.meeting_slots) return;
  S.settings.meeting_slots.splice(idx,1);
  renderMeetingSlotsList();
}
function saveMeetingSlots(){
  lsSave(); closeM('modal-meeting-slots');
  showMiniNotif('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم حفظ الأوقات المتاحة');
}

// ── Contact form submission (internal) ──
function submitPubContactForm(){
  const name=(document.getElementById('pub-contact-name')||{}).value||'';
  const phone=(document.getElementById('pub-contact-phone')||{}).value||'';
  const subject=(document.getElementById('pub-contact-subject')||{}).value||'';
  const email=(document.getElementById('pub-contact-email')||{}).value||'';
  const msg=(document.getElementById('pub-contact-msg')||{}).value||'';
  if(!name||!phone||!subject){ alert('الاسم والهاتف وموضوع الرسالة مطلوبة'); return; }
  const m={id:Date.now()+'_c',type:'contact',client_name:name,client_phone:phone,client_email:email,subject,message:msg,created_at:new Date().toISOString(),read:false};
  if(!S.support_msgs) S.support_msgs=[];
  S.support_msgs.push(m);
  lsSave(); closeM('modal-pub-contact');
  showMiniNotif('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم إرسال الرسالة');
}

// ── Convert Order to Task ──
function openOrderToTask(orderId){
  const order=(S.svc_orders||[]).find(o=>String(o.id)===String(orderId)); if(!order) return;
  document.getElementById('ott-order-id').value=orderId;
  document.getElementById('ott-title').value=order.service_name+(order.pkg_name?' — '+order.pkg_name:'');
  document.getElementById('ott-client').value=order.client_name||'';
  document.getElementById('ott-amount').value=order.price||'';
  document.getElementById('ott-notes').value=order.desc||'';
  document.getElementById('ott-deadline').value='';
  document.getElementById('ott-status').value='جديد';
  const sum=document.getElementById('ott-order-summary');
  if(sum) sum.innerHTML=`<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
    <div><div style="font-size:10px;color:var(--text3)">العميل</div><div style="font-weight:800">${escapeHtml(order.client_name)}</div></div>
    <div><div style="font-size:10px;color:var(--text3)">الخدمة</div><div style="font-weight:700">${escapeHtml(order.service_name)}</div></div>
    ${order.price?`<div><div style="font-size:10px;color:var(--text3)">القيمة</div><div style="font-weight:800;color:var(--accent)">${Number(order.price).toLocaleString()} ج</div></div>`:''}
  </div>`;
  openM('modal-order-to-task');
}
function confirmOrderToTask(){
  const orderId=document.getElementById('ott-order-id')?.value;
  const title=document.getElementById('ott-title')?.value?.trim(); if(!title){ alert('أدخل عنوان المهمة'); return; }
  const client=document.getElementById('ott-client')?.value||'';
  const amount=document.getElementById('ott-amount')?.value||'';
  const deadline=document.getElementById('ott-deadline')?.value||'';
  const notes=document.getElementById('ott-notes')?.value||'';
  const status=document.getElementById('ott-status')?.value||'جديد';
  const order=(S.svc_orders||[]).find(o=>String(o.id)===String(orderId));
  const newTask={
    id:Date.now(), title, client, status,
    amount:+amount||0, deadline, notes,
    type:'مشروع', created_at:new Date().toISOString(),
    steps:[], done:false,
    source_order_id:orderId
  };
  if(!S.tasks) S.tasks=[];
  S.tasks.unshift(newTask);
  // mark order as accepted + linked
  if(order){ order.status='accepted'; order.linked_task_id=newTask.id; }
  lsSave();
  closeM('modal-order-to-task');
  closeM('modal-oa');
  showMiniNotif('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم إنشاء المهمة: '+title);
  setTimeout(()=>{ showPage('tasks'); },400);
}

function renderMeetings(){
  const list=document.getElementById('meetings-list'); if(!list) return;
  // Fill client filter
  const cf=document.getElementById('mtg-filter-client');
  if(cf){ const cur=cf.value; cf.innerHTML='<option value="">كل العملاء</option>'; S.clients.forEach(c=>{const o=document.createElement('option');o.value=c.name;o.textContent=c.name;cf.appendChild(o);}); cf.value=cur; }
  const sf=document.getElementById('mtg-filter-status')?.value||'';
  const cff=document.getElementById('mtg-filter-client')?.value||'';
  let mtgs=[...S.meetings].sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time));
  if(cff) mtgs=mtgs.filter(m=>m.client===cff);
  if(sf==='upcoming') mtgs=mtgs.filter(m=>!m.done);
  if(sf==='done') mtgs=mtgs.filter(m=>m.done);
  const typeIcon={online:'<i class="fa-solid fa-desktop"></i>',offline:'<i class="fa-solid fa-location-dot"></i>',phone:'<i class="fa-solid fa-phone"></i>',whatsapp:'<i class="fa-solid fa-comments"></i>'};
  if(!mtgs.length){ list.innerHTML='<div class="empty card"><div class="empty-icon"><i class="fa-solid fa-calendar"></i></div>لا اجتماعات مطابقة</div>'; return; }
  list.innerHTML=mtgs.map(m=>`
    <div class="meeting-card ${m.done?'past':'upcoming'}" onclick="openMeetingDetail(${m.id})">
      <div style="display:flex;align-items:start;gap:10px">
        <div style="width:44px;height:44px;background:${m.done?'var(--surface3)':'rgba(124,111,247,.15)'};border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0">
          <div style="font-size:13px;font-weight:800;color:${m.done?'var(--text3)':'var(--accent)'}">${m.date?m.date.slice(8):'—'}</div>
          <div style="font-size:9px;color:var(--text3)">${m.date?['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'][+m.date.slice(5,7)-1]?.slice(0,3)||'':''}</div>
        </div>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:700;${m.done?'text-decoration:line-through;color:var(--text3)':''}">${m.title}</div>
          <div style="font-size:11px;color:var(--text3);margin-top:2px">${m.client?'<i class="fa-solid fa-user"></i> '+m.client+' · ':''} ${typeIcon[m.type]||'<i class="fa-solid fa-calendar-days"></i>'} ${m.time?'<i class="fa-solid fa-alarm-clock"></i> '+m.time:''} ${m.duration?'('+m.duration+' د)':''}</div>
          ${m.brief?`<div style="font-size:11px;color:var(--text2);margin-top:4px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical">${m.brief.replace(/<[^>]*>/g,'')}</div>`:''}
        </div>
        <div style="display:flex;gap:5px;flex-shrink:0">
          <button onclick="event.stopPropagation();toggleMeetingDone(${m.id})" class="btn btn-ghost btn-sm" title="${m.done?'إعادة':'مكتمل'}">${m.done?'↩':'<i class="fa-solid fa-check"></i>'}</button>
          <button onclick="event.stopPropagation();openMeetingModal(${m.id})" class="btn btn-ghost btn-sm"><i class="fa-solid fa-pen"></i></button>
          <button onclick="event.stopPropagation();delMeeting(${m.id})" class="btn btn-danger btn-sm"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
      ${m.link?`<a href="${m.link}" target="_blank" onclick="event.stopPropagation()" style="font-size:11px;color:var(--accent);display:inline-flex;align-items:center;gap:4px;margin-top:6px;background:rgba(124,111,247,.1);padding:3px 8px;border-radius:6px"><i class="fa-solid fa-link"></i> انضم للاجتماع</a>`:''}
    </div>`).join('');
  // Update badge
  const badge=document.getElementById('meetings-badge');
  const upcoming=S.meetings.filter(m=>!m.done).length;
  if(badge){ badge.textContent=upcoming; badge.style.display=upcoming?'inline-flex':'none'; }
}
function openMeetingDetail(id){
  const m=S.meetings.find(x=>x.id===id); if(!m) return;
  const card=document.getElementById('meeting-detail-card');
  const body=document.getElementById('meeting-detail-body');
  if(!card||!body) return;
  card.style.display='block';
  const typeLabel={online:'<i class="fa-solid fa-desktop"></i> أونلاين',offline:'<i class="fa-solid fa-location-dot"></i> حضوري',phone:'<i class="fa-solid fa-phone"></i> مكالمة',whatsapp:'<i class="fa-solid fa-comments"></i> واتساب'};
  body.innerHTML=`
    <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:14px">
      <div><div style="font-size:15px;font-weight:800">${m.title}</div>
        <div style="font-size:12px;color:var(--text3);margin-top:3px">${typeLabel[m.type]||''} · ${m.date||''} ${m.time?'<i class="fa-solid fa-alarm-clock"></i> '+m.time:''}</div>
        ${m.client?`<div style="font-size:12px;color:var(--accent);margin-top:2px"><i class="fa-solid fa-user"></i> ${m.client}</div>`:''}
      </div>
      <button onclick="openMeetingModal(${m.id})" class="btn btn-ghost btn-sm"><i class="fa-solid fa-pen"></i> تعديل</button>
    </div>
    ${m.link?`<a href="${m.link}" target="_blank" class="btn btn-primary btn-sm" style="display:inline-flex;align-items:center;gap:6px;text-decoration:none;margin-bottom:12px"><i class="fa-solid fa-link"></i> انضم للاجتماع</a>`:''}
    ${m.brief?`<div style="margin-bottom:14px"><div style="font-size:11px;font-weight:700;color:var(--text3);margin-bottom:6px;text-transform:uppercase">الأجندة</div><div style="background:var(--surface3);border-radius:8px;padding:10px 12px;font-size:13px;line-height:1.7">${m.brief}</div></div>`:''}
    ${m.notes?`<div><div style="font-size:11px;font-weight:700;color:var(--text3);margin-bottom:6px;text-transform:uppercase">الملاحظات</div><div style="background:rgba(247,201,72,.06);border:1px solid rgba(247,201,72,.2);border-radius:8px;padding:10px 12px;font-size:13px;line-height:1.7">${m.notes}</div></div>`:''}`;
}

// ============================================================
