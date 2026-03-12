// ============================================================
// INVOICES
// ============================================================
/* ── عرض مهام العميل في مودال الفاتورة ── */
function onInvClientChange(clientName){
  const name = clientName || document.getElementById('inv-client')?.value || '';
  const panel = document.getElementById('inv-tasks-panel');
  const list  = document.getElementById('inv-tasks-list');
  if(!panel||!list) return;
  if(!name){ panel.style.display='none'; return; }

  // كل تاسكات العميل — مش بس الجاري، كمان المكتملة والمدفوعة
  const tasks = S.tasks.filter(t => t.client === name);
  if(!tasks.length){ panel.style.display='none'; return; }

  // معرفة أي مهام عندها فواتير بالفعل
  const invoicedTaskIds = new Set(
    S.invoices.flatMap(inv => inv.items.map(it => it._taskId).filter(Boolean))
  );

  const statusLabel = {new:'جديد', progress:'جاري', review:'مراجعة', done:'مكتمل'};
  const statusColor = {new:'var(--text3)', progress:'var(--accent2)', review:'var(--accent)', done:'var(--accent3)'};

  list.innerHTML = tasks.map(t => {
    const already      = invItems.some(it => it._taskId === t.id);
    const hasInvoice   = invoicedTaskIds.has(t.id);
    const isPaidFull   = t.pay === 'full' || t.done;
    const isPaidDeposit= t.pay === 'deposit';
    const isUnpaid     = !isPaidFull && !isPaidDeposit;

    // بطاقة الدفع
    let payBadge = '';
    if(isPaidFull)
      payBadge = `<span style="background:rgba(79,209,165,.15);color:var(--accent3);padding:1px 7px;border-radius:20px;font-size:10px;font-weight:700"><i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> مدفوع</span>`;
    else if(isPaidDeposit)
      payBadge = `<span style="background:rgba(247,201,72,.15);color:var(--accent2);padding:1px 7px;border-radius:20px;font-size:10px;font-weight:700"><i class="fa-solid fa-heart"></i> عربون ${t.deposit?t.deposit.toLocaleString()+' ج':''}</span>`;
    else
      payBadge = `<span style="background:rgba(255,99,99,.12);color:#ff6b6b;padding:1px 7px;border-radius:20px;font-size:10px;font-weight:700"><i class="fa-solid fa-circle-xmark"></i> غير مدفوع</span>`;

    // بطاقة الفاتورة
    const invBadge = hasInvoice
      ? `<span style="background:rgba(124,111,247,.15);color:var(--accent);padding:1px 7px;border-radius:20px;font-size:10px;font-weight:700"><i class="fa-solid fa-square"></i> عليها فاتورة</span>`
      : '';

    // لون الكارد
    const cardBg     = already ? 'rgba(124,111,247,.16)' : isPaidFull ? 'rgba(79,209,165,.05)' : 'var(--surface2)';
    const cardBorder = already ? 'var(--accent)' : isPaidFull ? 'rgba(79,209,165,.3)' : 'var(--border)';
    const icon       = already ? '<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i>' : hasInvoice ? '<i class="fa-solid fa-repeat"></i>' : '➕';

    return `<div id="task-chip-${t.id}" onclick="toggleTaskAsItem(${t.id})"
      style="display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:8px;cursor:pointer;
             background:${cardBg};border:1.5px solid ${cardBorder};transition:all .18s">
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t.title}</div>
        <div style="font-size:11px;margin-top:4px;display:flex;gap:6px;flex-wrap:wrap;align-items:center">
          <span style="color:${statusColor[t.status]||'var(--text3)'}">● ${statusLabel[t.status]||t.status}</span>
          ${t.deadline ? `<span style="color:var(--text3)"><i class="fa-solid fa-calendar-days"></i> ${t.deadline}</span>` : ''}
          ${t.value    ? `<span style="color:var(--accent3);font-weight:700">${t.value.toLocaleString()} ج</span>` : ''}
          ${payBadge}
          ${invBadge}
        </div>
        ${isPaidFull && t.value ? `<div style="font-size:10px;color:var(--accent3);margin-top:4px">↪ سيُضاف ${t.value.toLocaleString()} ج كمدفوع مسبقاً في الفاتورة</div>` : ''}
        ${isPaidDeposit && t.deposit ? `<div style="font-size:10px;color:var(--accent2);margin-top:4px">↪ سيُضاف العربون ${t.deposit.toLocaleString()} ج كمدفوع مسبقاً في الفاتورة</div>` : ''}
      </div>
      <div style="font-size:18px;flex-shrink:0">${icon}</div>
    </div>`;
  }).join('');

  panel.style.display = 'block';
}

/* إضافة / إزالة مهمة كبند — مع منطق الدفع المسبق */
function toggleTaskAsItem(taskId){
  const t = S.tasks.find(x => x.id === taskId);
  if(!t) return;

  const idx = invItems.findIndex(it => it._taskId === taskId);

  if(idx > -1){
    // إزالة البند
    invItems.splice(idx, 1);
    // إعادة حساب العربون — اطرح ما أضفناه
    _recalcDepositFromItems();
  } else {
    // إضافة البند
    const isPaidFull    = t.pay === 'full' || t.done;
    const isPaidDeposit = t.pay === 'deposit';

    invItems.push({
      _taskId: taskId,
      desc:  t.title + (t.notes ? ' — ' + t.notes.slice(0, 60) : ''),
      qty:   1,
      price: t.value || 0
    });

    // تحديث خانة "مدفوع مسبقاً"
    const depEl = document.getElementById('inv-deposit');
    if(depEl){
      const currentDep = +(depEl.value) || 0;
      if(isPaidFull && t.value){
        depEl.value = currentDep + t.value;
      } else if(isPaidDeposit && t.deposit){
        depEl.value = currentDep + t.deposit;
      }
    }
  }

  renderInvForm();
  calcTotal();
  const client = document.getElementById('inv-client')?.value || '';
  onInvClientChange(client);
}

/* إعادة حساب خانة العربون بناءً على البنود المتبقية */
function _recalcDepositFromItems(){
  let dep = 0;
  invItems.forEach(it => {
    if(!it._taskId) return;
    const t = S.tasks.find(x => x.id === it._taskId);
    if(!t) return;
    if((t.pay==='full'||t.done) && t.value)   dep += t.value;
    else if(t.pay==='deposit' && t.deposit)    dep += t.deposit;
  });
  const depEl = document.getElementById('inv-deposit');
  if(depEl) depEl.value = dep || 0;
  calcTotal();
}

function openInvoiceModal(id){
  fillDD('inv-client');
  document.getElementById('inv-modal-ttl').innerHTML=id?'<i class="fa-solid fa-square"></i> تعديل الفاتورة':'<i class="fa-solid fa-square"></i> إنشاء فاتورة جديدة';
  document.getElementById('inv-eid').value=id||'';
  // إخفاء لوحة المهام أول ما نفتح
  const panel=document.getElementById('inv-tasks-panel');
  if(panel)panel.style.display='none';
  if(id){
    const inv=S.invoices.find(i=>i.id===id);if(!inv)return;
    document.getElementById('inv-client').value=inv.client;
    document.getElementById('inv-num').value=inv.num;
    document.getElementById('inv-date').value=inv.date;
    document.getElementById('inv-due').value=inv.due;
    document.getElementById('inv-notes').value=inv.notes||'';
    document.getElementById('inv-deposit').value=inv.deposit||0;
    invItems=inv.items.map(i=>({...i}));
    invPolicies=(inv.policies||[]).map(p=>({...p}));
    const puEl=document.getElementById('inv-project-url');
    if(puEl)puEl.value=inv.projectUrl||'';
    const plEl=document.getElementById('inv-payment-link');
    if(plEl)plEl.value=inv.paymentLink||'';
    // عرض مهام العميل
    setTimeout(()=>onInvClientChange(inv.client),120);
  } else {
    document.getElementById('inv-client').value='';
    document.getElementById('inv-num').value='INV-'+(S.invoices.length+1).toString().padStart(3,'0');
    document.getElementById('inv-date').value=today();
    const d=new Date();d.setDate(d.getDate()+7);
    document.getElementById('inv-due').value=d.toISOString().split('T')[0];
    document.getElementById('inv-notes').value=S.settings?.terms||'';
    invItems=[{desc:'',qty:1,price:0}];
    invPolicies=(S.settings?.policies||[]).map(p=>({...p}));
    const plElN=document.getElementById('inv-payment-link'); if(plElN) plElN.value='';
  }
  setTimeout(()=>{
    const dep=document.getElementById('inv-deposit');if(dep){dep.oninput=calcTotal;}
    renderPoliciesList('inv-policies-list',invPolicies,'removeInvPolicy');
    const projEl=document.getElementById('inv-project-url');
    if(projEl)liveQR('inv-project-url','inv-project-qr-prev',90);
  },100);
  renderInvForm();openM('modal-invoice');
}
function addInvItem(){invItems.push({desc:'',qty:1,price:0});renderInvForm();}
function renderInvForm(){
  const el=document.getElementById('inv-items-container');if(!el)return;
  el.innerHTML=invItems.map((item,i)=>`
    <div style="display:grid;grid-template-columns:1fr 70px 100px 34px;gap:7px;margin-bottom:8px;align-items:center">
      <input class="form-input" placeholder="وصف البند" value="${item.desc.replace(/"/g,'&quot;')}" oninput="invItems[${i}].desc=this.value">
      <input class="form-input" type="number" placeholder="كمية" value="${item.qty}" oninput="invItems[${i}].qty=+this.value;calcTotal()">
      <input class="form-input" type="number" placeholder="سعر ج" value="${item.price||''}" oninput="invItems[${i}].price=+this.value;calcTotal()">
      <button class="btn btn-danger" style="padding:8px;justify-content:center" onclick="invItems.splice(${i},1);renderInvForm()"><i class="fa-solid fa-xmark"></i></button>
    </div>`).join('');
  calcTotal();
}
function calcTotal(){
  const t=invItems.reduce((s,i)=>s+(+i.qty||0)*(+i.price||0),0);
  const e=document.getElementById('inv-total-live');if(e)e.textContent=t.toLocaleString();
  const dep=+(document.getElementById('inv-deposit')?.value||0);
  const rem=document.getElementById('inv-remaining-preview');
  if(rem)rem.textContent=dep>0?(t-dep).toLocaleString()+' ج متبقي':'—';
}
function saveInvoice(){
  const client=v('inv-client');if(!client)return alert('اختر العميل');
  if(!invItems.some(i=>i.desc.trim()))return alert('أضف بنداً واحداً على الأقل');
  const total=invItems.reduce((s,i)=>s+i.qty*i.price,0);
  const eid=v('inv-eid');

  // Find parent client - if this client is a sub, link to parent
  const clientObj = S.clients.find(c=>c.name===client);
  let parentClientName = null;
  if(clientObj && clientObj.workType==='sub' && clientObj.parentClientId){
    const parentObj = S.clients.find(c=>String(c.id)===String(clientObj.parentClientId));
    if(parentObj) parentClientName = parentObj.name;
  }

  const d={
    client,
    parentClient: parentClientName, // الشركة الأم إن وُجدت
    num:v('inv-num'),date:v('inv-date'),due:v('inv-due'),notes:v('inv-notes'),
    items:invItems.map(i=>({...i})),total,deposit:+(v('inv-deposit')||0),
    from:S.settings?.name||'العمل',status:'pending',
    policies:invPolicies.map(p=>({...p})),
    projectUrl:(document.getElementById('inv-project-url')?.value||'').trim(),
    paymentLink:(document.getElementById('inv-payment-link')?.value||'').trim(),
    receiptImage: window._invReceiptData||null
  };
  if(eid){const i=S.invoices.findIndex(x=>x.id==eid);if(i>-1){d.id=+eid;d.status=S.invoices[i].status;if(!d.receiptImage&&S.invoices[i].receiptImage)d.receiptImage=S.invoices[i].receiptImage;S.invoices[i]=d;}}
  else{ if(!checkLimit('max_invoices', S.invoices.length)) return; d.id=Date.now();S.invoices.push(d);}
  window._invReceiptData=null;
  lsSave();closeM('modal-invoice');renderInvoices();updateDash();previewInv(d.id);
}
function delInvoice(id){
  confirmDel('هل تريد حذف هذه الفاتورة؟',()=>{
    S.invoices=S.invoices.filter(i=>i.id!==id);lsSave();renderAll();
    document.getElementById('inv-preview-card').innerHTML='<div class="section-title">معاينة الفاتورة</div><div class="empty"><div class="empty-icon"><i class="fa-solid fa-square"></i></div>اختر فاتورة أو أنشئ جديدة</div>';
  });
}
function markPaid(id){const inv=S.invoices.find(i=>i.id===id);if(inv){inv.status='paid';inv.collectedAt=new Date().toISOString().split('T')[0];lsSave();renderAll();previewInv(id);showMiniNotif('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم تسجيل التحصيل');}}
function markUncollected(id){const inv=S.invoices.find(i=>i.id===id);if(inv){inv.status='pending';inv.collectedAt=null;lsSave();renderAll();previewInv(id);}}

// ============================================================
// RECEIPT PDF — إيصال استلام مبلغ
// ============================================================
function exportReceipt(transId){
  const t = S.transactions.find(x=>x.id===transId);
  if(!t) return;
  const s = S.settings||{};
  const logo = s.logo ? `<img src="${s.logo}" style="max-height:56px;max-width:130px;object-fit:contain" onerror="this.style.display=\'none\'">` : `<div style="font-size:20px;font-weight:900;color:#7c6ff7">${s.name||'Ordo'}</div>`;
  const linkedTask = t.linkedTaskId ? S.tasks.find(x=>x.id===t.linkedTaskId) : null;
  const payTypeAr = {full:'دفعة كاملة',deposit:'عربون',partial:'دفعة جزئية'}[t.paymentType||'full'] || 'دفعة';
  const receiptNum = 'RCP-' + String(transId).slice(-5);
  const dateStr = t.isoDate ? new Date(t.isoDate+'T00:00:00').toLocaleDateString('ar-EG',{year:'numeric',month:'long',day:'numeric'}) : t.date||'';
  const receiptHTML = `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap" rel="stylesheet">
<style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Cairo',sans-serif;background:#fff;color:#1a1a2e;direction:rtl;}@page{size:A4;margin:0;}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}</style>
</head><body><div style="width:210mm;min-height:297mm;background:#fff">
<div style="background:#14141e;padding:22px 28px;display:flex;justify-content:space-between;align-items:center">
  <div>${logo}</div>
  <div style="text-align:left"><div style="font-size:24px;font-weight:900;color:#4fd1a5">إيصال استلام</div><div style="font-size:11px;color:#b0a8ff;margin-top:3px">${receiptNum}</div></div>
</div>
<div style="height:3px;background:linear-gradient(to left,#4fd1a5,#7c6ff7)"></div>
<div style="display:flex;justify-content:space-between;padding:22px 28px;background:#f7fffe">
  <div><div style="font-size:10px;color:#888;margin-bottom:4px">صادر من</div><div style="font-size:14px;font-weight:700">${s.name||'العمل'}</div>${s.phone?`<div style="font-size:11px;color:#555;margin-top:2px"><i class="fa-solid fa-phone"></i> ${s.phone}</div>`:''}</div>
  <div style="text-align:left"><div style="font-size:10px;color:#888;margin-bottom:4px">بيانات الإيصال</div><div style="font-size:13px;font-weight:700">رقم: ${receiptNum}</div><div style="font-size:11px;color:#555;margin-top:3px">التاريخ: ${dateStr}</div></div>
</div>
<div style="margin:0 28px 24px;background:linear-gradient(135deg,#14141e,#1e1e30);border-radius:12px;padding:24px 28px;display:flex;justify-content:space-between;align-items:center">
  <div><div style="font-size:11px;color:#b0a8ff;margin-bottom:6px">تم استلام مبلغ</div>
    <div style="font-size:36px;font-weight:900;color:#4fd1a5">${t.amount.toLocaleString()} <span style="font-size:18px">ج.م</span></div>
    <div style="margin-top:8px;display:inline-block;background:rgba(79,209,165,.2);color:#4fd1a5;padding:3px 12px;border-radius:20px;font-size:11px;font-weight:700">${payTypeAr}</div>
  </div>
  <div style="text-align:left"><div style="font-size:11px;color:#b0a8ff;margin-bottom:3px">من</div><div style="font-size:15px;font-weight:700;color:#fff">${t.source||'—'}</div></div>
</div>
<div style="margin:0 28px 24px;border:1px solid #e8e8f0;border-radius:10px;overflow:hidden">
  <div style="padding:10px 16px;background:#f8f8fc;font-size:10px;font-weight:700;color:#666;text-transform:uppercase;letter-spacing:.5px">تفاصيل الإيصال</div>
  <table style="width:100%;border-collapse:collapse">
    <tr><td style="padding:11px 16px;font-size:12px;color:#888;border-bottom:1px solid #f0f0f5;width:38%">الوصف</td><td style="padding:11px 16px;font-size:13px;font-weight:600;border-bottom:1px solid #f0f0f5">${t.desc||'—'}</td></tr>
    ${linkedTask ? `<tr><td style="padding:11px 16px;font-size:12px;color:#888;border-bottom:1px solid #f0f0f5">المشروع</td><td style="padding:11px 16px;font-size:13px;font-weight:600;border-bottom:1px solid #f0f0f5"><i class="fa-solid fa-clipboard-list"></i> ${linkedTask.title}</td></tr><tr><td style="padding:11px 16px;font-size:12px;color:#888;border-bottom:1px solid #f0f0f5">العميل</td><td style="padding:11px 16px;font-size:13px;font-weight:600;border-bottom:1px solid #f0f0f5">${linkedTask.client||'—'}</td></tr>` : ''}
    <tr><td style="padding:11px 16px;font-size:12px;color:#888;border-bottom:1px solid #f0f0f5">نوع الدفعة</td><td style="padding:11px 16px;font-size:13px;font-weight:600;border-bottom:1px solid #f0f0f5">${payTypeAr}</td></tr>
    <tr><td style="padding:11px 16px;font-size:12px;color:#888">تاريخ الاستلام</td><td style="padding:11px 16px;font-size:13px;font-weight:600">${dateStr}</td></tr>
  </table>
</div>
<div style="margin:0 28px;padding:16px;border-top:2px solid #f0f0f5;display:flex;justify-content:space-between;align-items:center">
  <div style="font-size:11px;color:#aaa">هذا الإيصال يُثبت استلام المبلغ المذكور أعلاه</div>
  <div style="font-size:11px;color:#aaa">توقيع: _______________</div>
</div>
${s.terms?`<div style="margin:12px 28px;padding:12px;background:#fafafe;border-radius:8px;font-size:10px;color:#888;line-height:1.6">${s.terms}</div>`:''}
</div></body></html>`;
  // Use hidden iframe to avoid popup blockers
  let iframe = document.getElementById('_receipt_frame');
  if(!iframe){
    iframe = document.createElement('iframe');
    iframe.id = '_receipt_frame';
    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:none;';
    document.body.appendChild(iframe);
  }
  iframe.srcdoc = receiptHTML;
  iframe.onload = () => {
    try { iframe.contentWindow.focus(); iframe.contentWindow.print(); }
    catch(e){ 
      // fallback: open in new tab
      const w = window.open('','_blank'); w.document.write(receiptHTML); w.document.close(); setTimeout(()=>w.print(),600);
    }
  };
}

function renderInvoices(){
  const tbody=document.getElementById('inv-tbody');if(!tbody)return;
  const sm={
    pending:'<span class="inv-status-badge inv-uncollected">⏳ لم يتم التحصيل</span>',
    paid:'<span class="inv-status-badge inv-collected"><i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم التحصيل</span>',
    cancelled:'<span class="inv-status-badge inv-cancelled">🚫 ملغية</span>'
  };
  tbody.innerHTML=S.invoices.map(inv=>`<tr>
    <td style="font-family:var(--mono);color:var(--accent);font-size:12px">${inv.num}</td>
    <td>${inv.client}${inv.parentClient?`<div style="font-size:10px;color:var(--text3);margin-top:1px"><i class="fa-solid fa-building"></i> ${inv.parentClient}</div>`:''}</td>
    <td style="font-weight:700;color:var(--accent3)">${inv.total.toLocaleString()} ج</td>
    <td>${sm[inv.status]}</td>
    <td><div class="inv-actions">
      <button class="btn btn-ghost btn-sm" onclick="previewInv(${inv.id})" title="معاينة"><i class="fa-solid fa-eye"></i></button>
      <button class="btn btn-ghost btn-sm" onclick="openInvoiceModal(${inv.id})" title="تعديل"><i class="fa-solid fa-pen"></i></button>
      <button class="btn btn-warn btn-sm" onclick="exportPDF(${inv.id})" title="PDF">PDF</button>
      <button class="btn btn-sm" style="background:#25D366;color:#fff;border:none;padding:4px 9px" onclick="openWaModal('invoice',${inv.id})" title="إرسال واتساب">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="white" style="vertical-align:middle"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
      </button>
      ${inv.status==='pending'?`<button class="btn btn-success btn-sm" onclick="markPaid(${inv.id})" title="تم التحصيل" style="font-size:10px"><i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تحصيل</button>`:''}
      ${inv.status==='paid'?`<button class="btn btn-ghost btn-sm" onclick="markUncollected(${inv.id})" title="إلغاء التحصيل" style="font-size:10px">↩</button>`:''}
      <button class="btn btn-danger btn-sm" onclick="delInvoice(${inv.id})" title="حذف"><i class="fa-solid fa-trash"></i></button>
    </div></td>
  </tr>`).join('')||'<tr><td colspan="5" style="text-align:center;color:var(--text3);padding:24px">لا فواتير</td></tr>';
}
function previewInv(id){
  const inv=S.invoices.find(i=>i.id===id);if(!inv)return;
  const card=document.getElementById('inv-preview-card');if(!card)return;
  const s=S.settings||{};
  const logo=s.logo?`<img src="${s.logo}" style="max-height:56px;max-width:120px;object-fit:contain;margin-bottom:6px;display:block" onerror="this.style.display=\'none\'">`:'';
  const rows=inv.items.map(it=>`<tr><td>${it.desc}</td><td style="text-align:center">${it.qty}</td><td style="text-align:left">${it.price.toLocaleString()} ج</td><td style="text-align:left;font-weight:700">${(it.qty*it.price).toLocaleString()} ج</td></tr>`).join('');
  card.innerHTML=`
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <div class="section-title" style="margin:0">معاينة: ${inv.num}</div>
      <div style="display:flex;gap:6px">
        <button class="btn btn-ghost btn-sm" style="background:#25D366;color:#fff;border:none" onclick="openWaModal('invoice',${inv.id})">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white" style="vertical-align:middle"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
          واتساب
        </button>
        <button class="btn btn-warn btn-sm" onclick="exportPDF(${inv.id})">⬇ PDF</button>
      </div>
    </div>
    <div class="invoice-print">
      <div style="display:flex;justify-content:space-between;margin-bottom:24px;align-items:flex-start">
        <div>${logo}<div style="font-size:26px;font-weight:900;color:var(--accent)">فاتورة</div><div style="font-size:11px;color:var(--text3);margin-top:4px">${inv.num} · ${inv.date||''}</div>
          <div style="margin-top:10px;font-size:12px"><strong style="display:block;font-size:14px">${inv.from||s.name||'العمل'}</strong>${s.phone?`<i class="fa-solid fa-phone"></i> ${s.phone} `:''}${s.email?`<i class="fa-solid fa-envelope"></i> ${s.email}`:''}${s.address?`<br>${s.address}`:''}</div>
        </div>
        <div style="text-align:left">
          <div style="font-size:11px;color:#888">صادرة إلى</div>
          <div style="font-size:16px;font-weight:700;margin-top:4px">${inv.client}</div>
          <div style="font-size:11px;color:#888;margin-top:8px">تاريخ الاستحقاق</div>
          <div style="font-size:13px;font-weight:600">${inv.due||''}</div>
          <div style="margin-top:10px;display:inline-block;padding:3px 12px;border-radius:20px;font-size:11px;font-weight:700;background:${inv.status==='paid'?'#d4edda':'#fff3cd'};color:${inv.status==='paid'?'#155724':'#856404'}">${inv.status==='paid'?'<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> مدفوعة':'⏳ معلقة'}</div>
        </div>
      </div>
      <table class="inv-tbl"><thead><tr><th>البند</th><th style="text-align:center">الكمية</th><th style="text-align:left">السعر</th><th style="text-align:left">الإجمالي</th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr class="inv-total-row"><td colspan="3" style="padding:9px 12px;text-align:right">الإجمالي الكلي</td><td style="padding:9px 12px;text-align:left;color:var(--accent)">${inv.total.toLocaleString()} ج</td></tr>
          ${inv.deposit&&inv.deposit>0?`
          <tr><td colspan="3" style="padding:7px 12px;text-align:right;background:#fffbea;color:#856404;font-size:12px"><i class="fa-solid fa-heart"></i> عربون مدفوع مسبقاً</td><td style="padding:7px 12px;text-align:left;background:#fffbea;color:#856404;font-weight:700;font-size:12px">- ${inv.deposit.toLocaleString()} ج</td></tr>
          <tr><td colspan="3" style="padding:9px 12px;text-align:right;background:#f0fff8;color:#155724;font-weight:700">المبلغ المتبقي</td><td style="padding:9px 12px;text-align:left;background:#f0fff8;color:#155724;font-weight:700">${(inv.total-inv.deposit).toLocaleString()} ج</td></tr>`:''}
        </tfoot>
      </table>
      ${inv.notes?`<div style="margin-top:14px;padding:10px 14px;background:#f9f9ff;border-radius:8px;font-size:11px;color:#666;line-height:1.8">${inv.notes}</div>`:''}
      ${inv.policies&&inv.policies.length?buildPoliciesHTML(inv.policies):''}
      ${inv.paymentLink?`<div style="margin-top:16px;text-align:center"><a href="${inv.paymentLink}" target="_blank" style="display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,#4fd1a5,#38b28a);color:#fff;text-decoration:none;padding:12px 28px;border-radius:12px;font-size:14px;font-weight:900;box-shadow:0 4px 16px rgba(79,209,165,.35)"><i class="fa-solid fa-credit-card"></i> ادفع الفاتورة الآن</a></div>`:''}
      ${buildQRSectionHTML(inv, false)}
    </div>`;
}

// ============================================================
// PDF EXPORT — print-based (full Arabic support)
// ============================================================
function exportPDF(id){
  const inv=S.invoices.find(i=>i.id===id);if(!inv)return;
  const s=S.settings||{};
  const logo=s.logo?`<img src="${s.logo}" style="max-height:64px;max-width:150px;object-fit:contain" onerror="this.style.display=\'none\'">` : `<div style="font-size:22px;font-weight:900;color:#7c6ff7">${s.name||'Ordo'}</div>`;
  const rows=inv.items.map(it=>`
    <tr>
      <td style="padding:10px 14px;border-bottom:1px solid #eee;font-size:13px;color:#333">${it.desc}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #eee;text-align:center;font-size:13px;color:#333">${it.qty}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #eee;text-align:left;font-size:13px;color:#333">${it.price.toLocaleString()} ج</td>
      <td style="padding:10px 14px;border-bottom:1px solid #eee;text-align:left;font-weight:700;font-size:13px;color:#333">${(it.qty*it.price).toLocaleString()} ج</td>
    </tr>`).join('');
  const depositRow = inv.deposit && inv.deposit>0 ? `
    <tr>
      <td colspan="3" style="padding:8px 14px;background:#fffbea;color:#856404;font-size:12px;border-bottom:1px solid #eee"><i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> عربون مدفوع مسبقاً</td>
      <td style="padding:8px 14px;background:#fffbea;color:#856404;font-weight:700;font-size:12px;border-bottom:1px solid #eee">- ${inv.deposit.toLocaleString()} ج</td>
    </tr>
    <tr>
      <td colspan="3" style="padding:10px 14px;background:#f0eeff;font-weight:900;font-size:14px;color:#4a3f9f">المبلغ المتبقي</td>
      <td style="padding:10px 14px;background:rgba(124,111,247,.12);font-weight:900;font-size:14px;color:var(--accent)">${(inv.total - inv.deposit).toLocaleString()} ج</td>
    </tr>` : '';
  const html=`
    <!DOCTYPE html><html lang="ar" dir="rtl">
    <head>
    <meta charset="UTF-8">
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap" rel="stylesheet">
    <style>
      *{margin:0;padding:0;box-sizing:border-box;}
      body{font-family:'Cairo',sans-serif;background:#fff;color:#1a1a2e;direction:rtl;}
      @page{size:A4;margin:0;}
      @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}
    </style>
    </head><body>
    <div style="width:210mm;min-height:297mm;padding:0;background:#fff">
      <!-- HEADER -->
      <div style="background:#14141e;padding:22px 28px;display:flex;justify-content:space-between;align-items:center">
        <div>${logo}</div>
        <div style="text-align:left">
          <div style="font-size:28px;font-weight:900;color:#fff">فاتورة</div>
          <div style="font-size:12px;color:#b0a8ff;margin-top:3px">${inv.num}</div>
        </div>
      </div>
      <div style="height:3px;background:linear-gradient(to left,#7c6ff7,#4fd1a5)"></div>
      <!-- INFO -->
      <div style="display:flex;justify-content:space-between;padding:24px 28px;background:#fafafe">
        <div>
          <div style="font-size:11px;color:#888;margin-bottom:4px;text-transform:uppercase;letter-spacing:.5px">صادرة من</div>
          <div style="font-size:15px;font-weight:700">${s.name||'العمل'}</div>
          ${s.phone?`<div style="font-size:12px;color:#555;margin-top:3px"><i class="fa-solid fa-phone"></i> ${s.phone}</div>`:''}
          ${s.email?`<div style="font-size:12px;color:#555"><i class="fa-solid fa-envelope"></i> ${s.email}</div>`:''}
          ${s.address?`<div style="font-size:12px;color:#555">${s.address}</div>`:''}
        </div>
        <div style="text-align:left">
          <div style="font-size:11px;color:#888;margin-bottom:4px;text-transform:uppercase;letter-spacing:.5px">صادرة إلى</div>
          <div style="font-size:15px;font-weight:700">${inv.client}</div>
          <div style="font-size:12px;color:#555;margin-top:6px">تاريخ الفاتورة: <b>${inv.date||''}</b></div>
          <div style="font-size:12px;color:#555">تاريخ الاستحقاق: <b>${inv.due||''}</b></div>
          <div style="margin-top:8px;display:inline-block;padding:3px 14px;border-radius:20px;font-size:11px;font-weight:700;background:${inv.status==='paid'?'#d4edda':'#fff3cd'};color:${inv.status==='paid'?'#155724':'#856404'}">
            ${inv.status==='paid'?'<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> مدفوعة بالكامل':'⏳ معلقة'}
          </div>
          ${inv.deposit&&inv.deposit>0&&inv.status!=='paid'?`<div style="margin-top:5px;display:inline-block;padding:3px 14px;border-radius:20px;font-size:11px;font-weight:700;background:#fff3cd;color:#856404"><i class="fa-solid fa-heart"></i> عربون مدفوع: ${inv.deposit.toLocaleString()} ج</div>`:''}
        </div>
      </div>
      <!-- TABLE -->
      <div style="padding:0 28px 20px">
        <table style="width:100%;border-collapse:collapse">
          <thead>
            <tr style="background:#f0eeff">
              <th style="padding:10px 14px;text-align:right;font-size:12px;color:#555;font-weight:700">البند / الخدمة</th>
              <th style="padding:10px 14px;text-align:center;font-size:12px;color:#555;font-weight:700">الكمية</th>
              <th style="padding:10px 14px;text-align:left;font-size:12px;color:#555;font-weight:700">سعر الوحدة</th>
              <th style="padding:10px 14px;text-align:left;font-size:12px;color:#555;font-weight:700">الإجمالي</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="padding:11px 14px;background:#f0eeff;font-weight:900;font-size:14px;color:#4a3f9f">الإجمالي الكلي</td>
              <td style="padding:11px 14px;background:rgba(124,111,247,.12);font-weight:900;font-size:14px;color:var(--accent)">${inv.total.toLocaleString()} ج</td>
            </tr>
            ${depositRow}
          </tfoot>
        </table>
      </div>
      <!-- NOTES -->
      ${inv.notes?`<div style="margin:0 28px 20px;padding:14px 16px;background:rgba(124,111,247,.08);border-right:3px solid var(--accent);border-radius:6px">
        <div style="font-size:11px;font-weight:700;color:#7c6ff7;margin-bottom:5px">ملاحظات وشروط الدفع</div>
        <div style="font-size:12px;color:#555;line-height:1.8">${inv.notes}</div>
      </div>`:''}
      <!-- POLICIES -->
      ${inv.policies&&inv.policies.length?`<div style="margin:0 28px 28px;padding:16px 18px;background:#f5f3ff;border-radius:8px;border:1px solid #e0dcff">
        <div style="font-size:11px;font-weight:700;color:#7c6ff7;margin-bottom:10px;text-transform:uppercase;letter-spacing:.5px"><i class="fa-solid fa-clipboard-list"></i> السياسات والشروط</div>
        ${inv.policies.map(p=>`<div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:7px;font-size:12px;color:#555;line-height:1.6">
          <span style="font-size:14px;flex-shrink:0">${p.icon}</span><span>${p.text}</span>
        </div>`).join('')}
      </div>`:''}
      <!-- QR CODES -->
      ${buildQRSectionHTML(inv, true)}
      <!-- FOOTER -->
      <div style="background:#f5f3ff;padding:14px 28px;display:flex;justify-content:space-between;align-items:center;position:absolute;bottom:0;width:100%">
        <div style="font-size:11px;color:#9090b0">شكراً لتعاملكم معنا <i class="fa-solid fa-hands"></i></div>
        <div style="font-size:11px;color:#9090b0">${s.name||'العمل'}${s.phone?' · '+s.phone:''}</div>
      </div>
    </div>
    </body></html>`;
  const pa=document.getElementById('print-area');
  pa.innerHTML=html;pa.style.display='block';
  setTimeout(()=>{window.print();setTimeout(()=>{pa.style.display='none';pa.innerHTML='';},500);},300);
}

