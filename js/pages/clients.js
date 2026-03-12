// ============================================================
// CLIENTS
// ============================================================
function toggleClientSalary(){
  const wt = document.getElementById('c-worktype')?.value||'freelance';
  const isSal = wt==='fulltime'||wt==='parttime';
  const isSub = wt==='sub';
  document.getElementById('c-salary-wrap').style.display    = isSal?'block':'none';
  document.getElementById('c-salary-section').style.display = isSal?'block':'none';
  // Sub-client: show parent selector, hide salary
  const parentWrap = document.getElementById('c-parent-wrap');
  if(parentWrap) parentWrap.style.display = isSub ? 'block' : 'none';
  if(isSub) _fillParentClientsDD();
}
function _fillParentClientsDD(){
  const sel = document.getElementById('c-parent-client'); if(!sel) return;
  const curId = document.getElementById('client-eid')?.value;
  const opts = S.clients
    .filter(c => c.workType !== 'sub' && String(c.id) !== String(curId))
    .map(c => `<option value="${c.id}">${c.name}</option>`)
    .join('');
  sel.innerHTML = '<option value="">— اختر العميل الرئيسي —</option>' + opts;
}

function openClientModal(id){
  document.getElementById('client-modal-ttl').innerHTML=id?'<i class="fa-solid fa-circle-dot"></i> تعديل بيانات العميل':'<i class="fa-solid fa-circle-dot"></i> عميل جديد';
  document.getElementById('client-eid').value=id||'';
  if(id){
    const c=S.clients.find(c=>c.id===id);if(!c)return;
    document.getElementById('c-name').value=c.name;
    document.getElementById('c-phone').value=c.phone||'';
    document.getElementById('c-email').value=c.email||'';
    document.getElementById('c-field').value=c.field||'';
    document.getElementById('c-notes').value=c.notes||'';
    document.getElementById('c-type').value=c.type||'شركة';
    document.getElementById('c-channel').value=c.channel||'واتساب';
    document.getElementById('c-worktype').value=c.workType||'freelance';
    // Sub client: fill parent dropdown then set value
    if(c.workType==='sub'){
      _fillParentClientsDD();
      const psel=document.getElementById('c-parent-client');
      if(psel) psel.value=c.parentClientId||'';
    }
    document.getElementById('c-salary').value=c.salary||'';
    document.getElementById('c-salary-day').value=c.salaryDay||1;
    document.getElementById('c-salary-lastpaid').value=c.salaryLastPaid||'';
    document.getElementById('c-followup-enabled').value=c.followupEnabled||'off';
    document.getElementById('c-followup-months').value=c.followupMonths||'3';
    // restore socials
    renderClientSocials(c.socials||[]);
    document.getElementById('c-followup-msg').value=c.followupMsg||'';
    // DNA
    if(document.getElementById('c-dna-style')) document.getElementById('c-dna-style').value=c.dnaStyle||'';
    if(document.getElementById('c-dna-payment')) document.getElementById('c-dna-payment').value=c.dnaPayment||'';
    if(document.getElementById('c-dna-notes')) document.getElementById('c-dna-notes').value=c.dnaNotes||'';
    // رصيد افتتاحي
    if(document.getElementById('c-opening-balance')) document.getElementById('c-opening-balance').value=c.openingBalance||'';
    if(document.getElementById('c-opening-balance-type')) document.getElementById('c-opening-balance-type').value=c.openingBalanceType||'receivable';
    if(document.getElementById('c-opening-balance-note')) document.getElementById('c-opening-balance-note').value=c.openingBalanceNote||'';
  } else {
    ['c-name','c-phone','c-email','c-field','c-notes','c-salary','c-dna-notes','c-opening-balance','c-opening-balance-note'].forEach(f=>{const e=document.getElementById(f);if(e)e.value='';});
    if(document.getElementById('c-dna-style')) document.getElementById('c-dna-style').value='';
    if(document.getElementById('c-dna-payment')) document.getElementById('c-dna-payment').value='';
    document.getElementById('c-type').value='شركة';
    document.getElementById('c-channel').value='واتساب';
    document.getElementById('c-worktype').value='freelance';
    document.getElementById('c-salary-day').value=1;
    document.getElementById('c-salary-lastpaid').value='';
    document.getElementById('c-followup-enabled').value='off';
    document.getElementById('c-followup-months').value='3';
    document.getElementById('c-followup-msg').value='';
  }
  toggleClientSalary();
  openM('modal-client');
}
function setFollowupMonths(n){
  const el=document.getElementById('c-followup-months');
  if(el){ el.value=n; }
}
function saveClient(){
  const name=v('c-name').trim();if(!name)return alert('أدخل اسم العميل');
  const eid=v('client-eid');
  const wt=v('c-worktype')||'freelance';
  const isSal=wt==='fulltime'||wt==='parttime';
  const d={
    name,type:v('c-type'),phone:v('c-phone'),email:v('c-email'),
    channel:v('c-channel'),field:v('c-field'),notes:v('c-notes'),
    color:COLORS[S.clients.length%COLORS.length],
    workType:wt,
    salary:  isSal?(+v('c-salary')||0):0,
    salaryDay:   isSal?(+v('c-salary-day')||1):null,
    salaryLastPaid: isSal?v('c-salary-lastpaid'):null,
    parentClientId: wt==='sub'?(v('c-parent-client')||null):null,
    followupEnabled: document.getElementById('c-followup-enabled')?.value||'off',
    followupMonths: Math.max(1, +(document.getElementById('c-followup-months')?.value)||3),
    followupMsg: document.getElementById('c-followup-msg')?.value||'',
    dnaStyle: document.getElementById('c-dna-style')?.value||'',
    dnaPayment: document.getElementById('c-dna-payment')?.value||'',
    dnaNotes: document.getElementById('c-dna-notes')?.value||'',
    openingBalance: +(document.getElementById('c-opening-balance')?.value||0)||0,
    openingBalanceType: document.getElementById('c-opening-balance-type')?.value||'receivable',
    openingBalanceNote: document.getElementById('c-opening-balance-note')?.value||'',
    socials: [...(document.querySelectorAll('#c-socials-list .social-tag')||[])].map(el=>({
      platform:el.dataset.platform, icon:el.dataset.icon, url:el.dataset.url
    })),
  };
  if(eid){const i=S.clients.findIndex(c=>c.id==eid);if(i>-1){d.id=+eid;d.color=S.clients[i].color;S.clients[i]=d;}}
  else{ if(!checkLimit('max_clients_feat', S.clients.length)) return; d.id=Date.now();S.clients.push(d);}
  lsSave();closeM('modal-client');renderAll();fillDD('t-client');fillDD('inv-client');
}
// ── Active profile client id (for tab switching) ──
let _profileClientId = null;

function openClientProfile(id){
  _profileClientId = id;
  const c=S.clients.find(c=>c.id===id);if(!c)return;

  // Sub-clients
  const subClients = S.clients.filter(sc => String(sc.parentClientId) === String(c.id));
  const isParent = subClients.length > 0;
  const parentClient = (c.workType==='sub' && c.parentClientId)
    ? S.clients.find(p=>String(p.id)===String(c.parentClientId)) : null;
  const allClientNames = isParent ? [c.name,...subClients.map(sc=>sc.name)] : [c.name];

  // Title bar
  document.getElementById('profile-title').innerHTML=
    `<span style="display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:50%;background:${c.color};color:#fff;font-weight:800;font-size:14px;margin-left:8px">${c.name[0]}</span>`+
    `${c.name}`+
    (isParent?` <span style="font-size:10px;background:rgba(124,111,247,.15);color:var(--accent);padding:2px 8px;border-radius:8px;margin-right:6px"><i class="fa-solid fa-building"></i> ${subClients.length} فرع</span>`:'')+
    (parentClient?` <span style="font-size:10px;background:rgba(79,209,165,.12);color:var(--accent3);padding:2px 8px;border-radius:8px;margin-right:6px;cursor:pointer" onclick="closeM('modal-client-profile');setTimeout(()=>openClientProfile(${parentClient.id}),120)"><i class="fa-solid fa-link"></i> تابع لـ ${parentClient.name} ←</span>`:'');

  // Header action buttons
  const hdr = document.getElementById('profile-header-actions');
  if(hdr) hdr.innerHTML=
    (c.phone?`<a href="https://wa.me/${c.phone.replace(/[^\d]/g,'')}" target="_blank" style="display:inline-flex;align-items:center;gap:5px;background:#25D366;color:#fff;border:none;border-radius:20px;padding:5px 12px;font-size:11px;font-weight:700;text-decoration:none;cursor:pointer"><i class="fa-solid fa-comments"></i> واتساب</a>`:'') +
    `<button class="btn btn-ghost btn-sm" title="إعدادات التذكير" onclick="openClientModal(${c.id});closeM('modal-client-profile')"><i class="fa-solid fa-gear"></i>️</button>`+
    `<button class="btn btn-ghost btn-sm" title="بوابة العميل" onclick="openClientPortal(${c.id})"><i class="fa-solid fa-link"></i> بوابة</button>`+
    `<button class="btn btn-primary btn-sm" onclick="_showClientPortalLink(${c.id})"><i class="fa-solid fa-id-card"></i> رابط البوابة الكاملة</button>`+
    `<button class="btn btn-ghost btn-sm" onclick="_profileShowStatement(${c.id})"><i class="fa-solid fa-file-lines"></i> كشف حساب</button>`;

  // Reset tabs
  document.querySelectorAll('.profile-tab').forEach(t=>t.classList.remove('active'));
  const firstTab = document.querySelector('.profile-tab[data-tab="overview"]');
  if(firstTab) firstTab.classList.add('active');

  openM('modal-client-profile');
  _renderProfileTab('overview', id);
}

function switchProfileTab(tab, btn){
  document.querySelectorAll('.profile-tab').forEach(t=>t.classList.remove('active'));
  if(btn) btn.classList.add('active');
  _renderProfileTab(tab, _profileClientId);
}

function _renderProfileTab(tab, id){
  const c=S.clients.find(c=>c.id===id);if(!c)return;
  const subClients = S.clients.filter(sc=>String(sc.parentClientId)===String(c.id));
  const isParent = subClients.length>0;
  const allClientNames = isParent?[c.name,...subClients.map(sc=>sc.name)]:[c.name];
  const cTasks = S.tasks.filter(t=>allClientNames.includes(t.client));
  const cInvs  = S.invoices.filter(i=>allClientNames.includes(i.client));
  const cContracts = (S.contracts||[]).filter(ct=>allClientNames.includes(ct.client_name||''));
  const cTrans = S.transactions.filter(t=>allClientNames.includes(t.source));

  const now=new Date(); const curY=now.getFullYear(); const curM=now.getMonth()+1;
  const monthStr=`${curY}-${String(curM).padStart(2,'0')}`;
  const _taskDate=t=>t.isoDate||t.createdAt||t.doneAt||'';
  const monthTasks=cTasks.filter(t=>_taskDate(t).startsWith(monthStr));
  const monthIncome=cTrans.filter(t=>t.type==='income'&&!t.isLoan&&(t.isoDate||t.date||'').startsWith(monthStr)).reduce((s,t)=>s+t.amount,0);
  const pendingInv=cInvs.filter(i=>i.status==='pending');
  const totalInc=cTrans.filter(t=>t.type==='income'&&!t.isLoan).reduce((s,t)=>s+t.amount,0);

  const statusBadge={new:'<span class="badge badge-gray">جديد</span>',progress:'<span class="badge badge-yellow">جاري</span>',review:'<span class="badge badge-purple">مراجعة</span>',done:'<span class="badge badge-green">مكتمل</span>'};
  const body=document.getElementById('profile-body');

  if(tab==='overview'){
    // last task date
    const sortedTasks=[...cTasks].filter(t=>_taskDate(t)).sort((a,b)=>_taskDate(b).localeCompare(_taskDate(a)));
    const lastTask=sortedTasks[0];
    const lastReqLabel=lastTask?`آخر طلب: ${_taskDate(lastTask).slice(0,10)}`:'لا طلبات بعد';

    const subSection=isParent?`
      <div style="margin-bottom:18px">
        <div class="section-title" style="margin-bottom:8px"><i class="fa-solid fa-building"></i> الفروع / العملاء التابعين (${subClients.length})</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:8px">
          ${subClients.map(sc=>{
            const st=S.tasks.filter(t=>t.client===sc.name).length;
            const sp=S.invoices.filter(i=>i.client===sc.name&&i.status==='pending').reduce((s,i)=>s+i.total,0);
            return `<div class="card" style="padding:10px;cursor:pointer" onclick="closeM('modal-client-profile');setTimeout(()=>openClientProfile(${sc.id}),120)" onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor=''">
              <div style="display:flex;align-items:center;gap:7px;margin-bottom:5px">
                <div style="width:26px;height:26px;border-radius:50%;background:${sc.color||'var(--accent)'};display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;color:#fff">${sc.name[0]}</div>
                <div style="font-weight:700;font-size:12px">${sc.name}</div>
              </div>
              <div style="font-size:11px;color:var(--text3)"><i class="fa-solid fa-clipboard-list"></i> ${st} مهمة${sp?` · <span style="color:var(--accent2)">${sp.toLocaleString()} ج معلق</span>`:''}</div>
            </div>`;
          }).join('')}
        </div>
      </div>` : '';

    
    // ── حساب الرصيد المستحق للـ overview ──
    const _ovOpenBal = c.openingBalance || 0;
    const _ovOpenType = c.openingBalanceType || 'receivable';
    const _ovOpenNote = c.openingBalanceNote || '';
    const _ovTotalInv = cInvs.reduce((s,i)=>s+(+i.total||0),0);
    const _ovTotalPaid = cInvs.filter(i=>i.paid||i.status==='مدفوعة'||i.status==='paid').reduce((s,i)=>s+(+i.total||0),0);
    const _ovUnpaid = Math.max(0, _ovTotalInv - _ovTotalPaid);
    const _ovOwed = _ovUnpaid + (_ovOpenType==='receivable'?_ovOpenBal:0) - (_ovOpenType==='prepaid'?_ovOpenBal:0);
    const _ovCur = _getCurrency();

    body.innerHTML=`
      <!-- بانر الرصيد المستحق -->
      ${_ovOwed > 0 ? `
      <div style="display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,rgba(255,107,107,.12),rgba(255,107,107,.06));border:1.5px solid rgba(255,107,107,.4);border-radius:14px;padding:14px 16px;margin-bottom:14px;cursor:pointer" onclick="switchProfileTab('accounts',document.querySelector('[data-tab=accounts]'))">
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:40px;height:40px;border-radius:11px;background:rgba(255,107,107,.18);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">💰</div>
          <div>
            <div style="font-size:12px;font-weight:800;color:rgba(255,107,107,.9)">مبالغ مستحقة على العميل</div>
            <div style="font-size:10px;color:var(--text3);margin-top:2px">${_ovUnpaid>0&&_ovOpenBal>0&&_ovOpenType==='receivable'?'فواتير + مبالغ قديمة':_ovUnpaid>0?'فواتير غير مسددة':'مبالغ مستحقة من قبل'}${_ovOpenNote?' · '+_ovOpenNote:''}</div>
          </div>
        </div>
        <div style="text-align:left">
          <div style="font-size:22px;font-weight:900;color:rgba(255,107,107,.95);line-height:1">${_ovOwed.toLocaleString()}</div>
          <div style="font-size:10px;color:var(--text3);text-align:center">${_ovCur}</div>
        </div>
        <button class="btn btn-primary btn-sm" style="margin-top:8px;width:100%;justify-content:center" onclick="switchProfileTab('accounts',document.querySelector('[data-tab=accounts]'));setTimeout(()=>_collectFromClient(${c.id},${_ovOwed}),200)">
          <i class="fa-solid fa-hand-holding-dollar"></i> تحصيل وتسوية
        </button>
      </div>` : _ovOpenBal>0&&_ovOpenType==='prepaid' ? `
      <div style="display:flex;align-items:center;justify-content:space-between;background:rgba(79,209,165,.08);border:1.5px solid rgba(79,209,165,.3);border-radius:14px;padding:14px 16px;margin-bottom:14px">
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:40px;height:40px;border-radius:11px;background:rgba(79,209,165,.15);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">✅</div>
          <div>
            <div style="font-size:12px;font-weight:800;color:var(--accent3)">رصيد لديه مسبقاً</div>
            <div style="font-size:10px;color:var(--text3);margin-top:2px">${_ovOpenNote||'دفع مقدماً'}</div>
          </div>
        </div>
        <div style="font-size:22px;font-weight:900;color:var(--accent3)">${_ovOpenBal.toLocaleString()} ${_ovCur}</div>
      </div>` : ''}

      <!-- Stats row -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px">
        <div class="card" style="padding:12px;text-align:center">
          <div style="font-size:20px;font-weight:900;color:var(--accent)">${monthTasks.length}</div>
          <div style="font-size:10px;color:var(--text3);margin-top:2px"><i class="fa-solid fa-calendar-days"></i> هذا الشهر</div>
        </div>
        <div class="card" style="padding:12px;text-align:center">
          <div style="font-size:20px;font-weight:900;color:var(--accent3)">${monthIncome.toLocaleString()}</div>
          <div style="font-size:10px;color:var(--text3);margin-top:2px"><i class="fa-solid fa-coins"></i> دخل الشهر ج</div>
        </div>
        <div class="card" style="padding:12px;text-align:center">
          <div style="font-size:20px;font-weight:900;color:var(--accent2)">${pendingInv.reduce((s,i)=>s+i.total,0).toLocaleString()}</div>
          <div style="font-size:10px;color:var(--text3);margin-top:2px">⏳ معلق ج</div>
        </div>
        <div class="card" style="padding:12px;text-align:center">
          <div style="font-size:20px;font-weight:900;color:var(--text2)">${cTasks.length}</div>
          <div style="font-size:10px;color:var(--text3);margin-top:2px"><i class="fa-solid fa-clipboard-list"></i> إجمالي المشاريع</div>
        </div>
      </div>
      <!-- Info + last request -->
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:14px">
        ${c.phone?`<span style="background:var(--surface2);padding:4px 12px;border-radius:20px;font-size:12px;color:var(--text2)"><i class="fa-solid fa-phone"></i> ${c.phone}</span>`:''}
        ${c.email?`<span style="background:var(--surface2);padding:4px 12px;border-radius:20px;font-size:12px;color:var(--text2)"><i class="fa-solid fa-envelope"></i> ${c.email}</span>`:''}
        <span style="background:var(--surface2);padding:4px 12px;border-radius:20px;font-size:11px;color:var(--text3)"><i class="fa-solid fa-clock"></i> ${lastReqLabel}</span>
        <span style="background:var(--surface2);padding:4px 12px;border-radius:20px;font-size:11px;color:var(--text3)"><i class="fa-solid fa-coins"></i> إجمالي محصّل: ${totalInc.toLocaleString()} ج</span>
      </div>
      ${c.notes?`<div style="background:rgba(124,111,247,.07);border:1px solid rgba(124,111,247,.2);border-radius:10px;padding:12px 14px;font-size:13px;color:var(--text2);line-height:1.7;margin-bottom:14px">
        <div style="font-size:10px;font-weight:700;color:var(--accent);margin-bottom:4px"><i class="fa-solid fa-thumbtack"></i> ملاحظات</div>
        ${c.notes}
      </div>`:''}
      ${subSection}
      <!-- Recent tasks -->
      <div>
        <div class="section-title" style="margin-bottom:8px"><i class="fa-solid fa-clipboard-list"></i> آخر الطلبات</div>
        ${cTasks.length?[...cTasks].sort((a,b)=>_taskDate(b).localeCompare(_taskDate(a))).slice(0,5).map(t=>`
          <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);cursor:pointer" onclick="closeM('modal-client-profile');openTaskDetail(${t.id})">
            <div>
              <div style="font-size:13px;font-weight:600">${t.title}</div>
              <div style="font-size:10px;color:var(--text3)">${_taskDate(t).slice(0,10)||''}${isParent&&t.client!==c.name?' · <i class="fa-solid fa-link"></i> '+t.client:''}</div>
            </div>
            <div style="display:flex;align-items:center;gap:8px">
              ${t.value?`<span style="font-size:12px;font-weight:700;color:var(--accent3)">${Number(t.value).toLocaleString()} ج</span>`:''}
              ${statusBadge[t.status]||''}
            </div>
          </div>`).join('')
        :'<div class="empty" style="padding:20px 0"><div class="empty-icon"><i class="fa-solid fa-envelope-open"></i></div>لا طلبات بعد</div>'}
      </div>`;
  }

  else if(tab==='history'){
    // Build month buckets
    const tasksByMonth={};
    cTasks.forEach(t=>{
      const d=_taskDate(t); const mk=d?d.slice(0,7):'بدون تاريخ';
      if(!tasksByMonth[mk]) tasksByMonth[mk]=[];
      tasksByMonth[mk].push(t);
    });
    // Sort months desc
    const months=Object.keys(tasksByMonth).sort((a,b)=>b.localeCompare(a));
    // Annual summary
    const yearlyData={};
    months.forEach(mk=>{
      const yr=mk.slice(0,4);
      if(!yearlyData[yr]) yearlyData[yr]={tasks:0,income:0};
      yearlyData[yr].tasks+=tasksByMonth[mk].length;
      tasksByMonth[mk].forEach(t=>{ yearlyData[yr].income+=(t.value||0); });
    });
    const arabicMonths=['','يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
    const fmtMonth=mk=>{ if(!mk||mk==='بدون تاريخ') return mk; const [y,m]=mk.split('-'); return `${arabicMonths[+m]||m} ${y}`; };

    const yearsHtml=Object.keys(yearlyData).sort((a,b)=>b-a).map(yr=>`
      <div style="display:flex;justify-content:space-between;align-items:center;padding:7px 12px;background:rgba(124,111,247,.08);border-radius:8px;margin-bottom:6px">
        <span style="font-weight:700;font-size:13px"><i class="fa-solid fa-calendar-days"></i> ${yr}</span>
        <div style="display:flex;gap:14px;font-size:12px">
          <span style="color:var(--accent)"><i class="fa-solid fa-clipboard-list"></i> ${yearlyData[yr].tasks} طلب</span>
          ${yearlyData[yr].income?`<span style="color:var(--accent3)"><i class="fa-solid fa-coins"></i> ${yearlyData[yr].income.toLocaleString()} ج</span>`:''}
        </div>
      </div>`).join('');

    const monthsHtml=months.map(mk=>{
      const tasks=tasksByMonth[mk];
      const monthInc=tasks.reduce((s,t)=>s+(t.value||0),0);
      const uid='mth_'+mk.replace('-','_');
      return `
        <div style="margin-bottom:10px">
          <div style="display:flex;justify-content:space-between;align-items:center;cursor:pointer;padding:8px 12px;background:var(--surface2);border-radius:8px;border:1px solid var(--border)" onclick="const el=document.getElementById('${uid}');el.style.display=el.style.display==='none'?'block':'none'">
            <div style="font-weight:700;font-size:13px"><i class="fa-solid fa-calendar-days"></i> ${fmtMonth(mk)} <span style="font-size:11px;color:var(--text3);font-weight:400">(${tasks.length} طلب)</span></div>
            <div style="display:flex;gap:10px;align-items:center;font-size:12px">
              ${monthInc?`<span style="color:var(--accent3);font-weight:700">${monthInc.toLocaleString()} ج</span>`:''}
              <span style="color:var(--text3)">▼</span>
            </div>
          </div>
          <div id="${uid}" style="display:none;margin-top:6px;padding:0 4px">
            ${tasks.map(t=>{
              const tInvs=S.invoices.filter(i=>i.items&&i.items.some(it=>it._taskId===t.id));
              const tContr=(S.contracts||[]).filter(ct=>(ct.client_name||'')===t.client&&ct.title===t.title);
              return `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;border-bottom:1px solid var(--border);border-radius:6px;margin-bottom:2px">
                <div style="flex:1;min-width:0">
                  <div style="font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px" onclick="closeM('modal-client-profile');openTaskDetail(${t.id})">
                    🔹 ${t.title}
                  </div>
                  <div style="font-size:10px;color:var(--text3);margin-top:2px">${_taskDate(t).slice(0,10)||''}${tInvs.length?` · <i class="fa-solid fa-receipt"></i> ${tInvs.length} فاتورة`:''}</div>
                </div>
                <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
                  ${t.value?`<span style="font-size:12px;font-weight:700;color:var(--accent3)">${Number(t.value).toLocaleString()} ج</span>`:''}
                  ${statusBadge[t.status]||''}
                  <button class="btn btn-ghost btn-sm" onclick="closeM('modal-client-profile');openTaskDetail(${t.id})" title="تفاصيل"><i class="fa-solid fa-eye"></i></button>
                </div>
              </div>`;
            }).join('')}
          </div>
        </div>`;
    }).join('');

    body.innerHTML=`
      ${yearsHtml?`<div style="margin-bottom:16px"><div class="section-title" style="margin-bottom:8px"><i class="fa-solid fa-chart-bar"></i> ملخص سنوي</div>${yearsHtml}</div>`:''}
      <div class="section-title" style="margin-bottom:10px"><i class="fa-solid fa-calendar-days"></i> تفاصيل شهرية</div>
      ${monthsHtml||'<div class="empty"><div class="empty-icon"><i class="fa-solid fa-envelope-open"></i></div>لا طلبات بعد</div>'}`;
  }

  else if(tab==='invoices'){
    const sm={
      pending:'<span style="font-size:10px;padding:2px 7px;border-radius:8px;background:rgba(247,201,72,.15);color:var(--accent2)">⏳ معلق</span>',
      paid:'<span style="font-size:10px;padding:2px 7px;border-radius:8px;background:rgba(79,209,165,.15);color:var(--accent3)"><i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> مدفوع</span>',
      cancelled:'<span style="font-size:10px;padding:2px 7px;border-radius:8px;background:rgba(247,111,124,.15);color:var(--accent4)">🚫 ملغية</span>'
    };
    const totalPaid=cInvs.filter(i=>i.status==='paid').reduce((s,i)=>s+i.total,0);
    const totalPend=cInvs.filter(i=>i.status==='pending').reduce((s,i)=>s+i.total,0);
    body.innerHTML=`
      <div style="display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap">
        <div class="card" style="padding:10px 16px;flex:1;min-width:120px"><div style="font-size:18px;font-weight:900;color:var(--accent3)">${totalPaid.toLocaleString()} ج</div><div style="font-size:10px;color:var(--text3)"><i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> محصّل</div></div>
        <div class="card" style="padding:10px 16px;flex:1;min-width:120px"><div style="font-size:18px;font-weight:900;color:var(--accent2)">${totalPend.toLocaleString()} ج</div><div style="font-size:10px;color:var(--text3)">⏳ معلق</div></div>
        <button class="btn btn-primary btn-sm" style="align-self:center" onclick="openInvoiceModal();document.getElementById('inv-client').value='${c.name.replace(/'/g,"\\'")}'" ><i class="fa-solid fa-file-plus" style="margin-left:5px"></i> فاتورة جديدة</button>
      </div>
      ${cInvs.length?cInvs.map(i=>`
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px;background:var(--surface2);border-radius:8px;margin-bottom:6px;border:1px solid var(--border)">
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:700">#${i.num||'—'} <span style="font-size:11px;color:var(--text3)">${i.date||''}</span></div>
            ${isParent&&i.client!==c.name?`<div style="font-size:10px;color:var(--text3)"><i class="fa-solid fa-link"></i> ${i.client}</div>`:''}
            <div style="font-size:12px;font-weight:700;color:${i.status==='paid'?'var(--accent3)':'var(--accent2)'};margin-top:2px">${i.total.toLocaleString()} ج &nbsp;${sm[i.status]||''}</div>
          </div>
          <div style="display:flex;gap:5px;flex-shrink:0">
            <button class="btn btn-ghost btn-sm" onclick="previewInv(${i.id})" title="عرض"><i class="fa-solid fa-eye"></i></button>
            <button class="btn btn-ghost btn-sm" onclick="openInvoiceModal(${i.id})" title="تعديل"><i class="fa-solid fa-pen"></i></button>
            <button class="btn btn-warn btn-sm" onclick="exportPDF(${i.id})" title="PDF"><i class="fa-solid fa-print"></i></button>
            ${i.status==='pending'?`<button class="btn btn-success btn-sm" onclick="markPaid(${i.id});_renderProfileTab('invoices',${id})" style="font-size:10px"><i class="fa-solid fa-square-check" style="color:var(--accent3)"></i></button>`:''}
            <button class="btn btn-danger btn-sm" onclick="delInvoice(${i.id});_renderProfileTab('invoices',${id})" title="حذف"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>`).join('')
      :'<div class="empty"><div class="empty-icon"><i class="fa-solid fa-receipt"></i></div>لا فواتير لهذا العميل</div>'}`;
  }

  else if(tab==='contracts'){
    body.innerHTML=`
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <div style="font-size:13px;color:var(--text2)">${cContracts.length} عقد</div>
        <button class="btn btn-primary btn-sm" onclick="openContractModal(null,'${c.name.replace(/'/g,"\\'")}')">+ عقد جديد</button>
      </div>
      ${cContracts.length?cContracts.map(ct=>`
        <div style="padding:12px;background:var(--surface2);border-radius:8px;margin-bottom:8px;border:1px solid var(--border)">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px">
            <div style="font-size:13px;font-weight:700">${ct.title||'عقد'}</div>
            <span style="font-size:10px;padding:2px 8px;border-radius:8px;background:${ct.status==='signed'?'rgba(79,209,165,.15)':'rgba(124,111,247,.15)'};color:${ct.status==='signed'?'var(--accent3)':'var(--accent)'}">${ct.status==='signed'?'<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> موقّع':'<i class="fa-solid fa-clipboard-list"></i> مسودة'}</span>
          </div>
          <div style="display:flex;gap:10px;font-size:11px;color:var(--text3);margin-bottom:8px">
            ${ct.value?`<span><i class="fa-solid fa-coins"></i> ${Number(ct.value).toLocaleString()} ج</span>`:''}
            ${ct.start_date?`<span><i class="fa-solid fa-calendar-days"></i> ${ct.start_date}</span>`:''}
            ${ct.end_date?`<span><i class="fa-solid fa-flag-checkered"></i> ${ct.end_date}</span>`:''}
          </div>
          <div style="display:flex;gap:5px">
            ${ct.status!=='signed'?`<button class="btn btn-ghost btn-sm" onclick="openContractModal('${ct.id}')"><i class="fa-solid fa-pen"></i> تعديل</button>`:''}
            <button class="btn btn-ghost btn-sm" onclick="ctShare('${ct.id}')"><i class="fa-solid fa-link"></i> مشاركة</button>
            <button class="btn btn-warn btn-sm" onclick="ctPrint&&ctPrint('${ct.id}')"><i class="fa-solid fa-print"></i> طباعة</button>
            <button class="btn btn-danger btn-sm" onclick="ctDelete('${ct.id}');_renderProfileTab('contracts',${id})"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>`).join('')
      :'<div class="empty"><div class="empty-icon"><i class="fa-solid fa-pen-to-square"></i></div>لا عقود لهذا العميل</div>'}`;
  }

  else if(tab==='projects'){
    var cProjects = (S.projects||[]).filter(function(p){ return allClientNames.includes(p.client); });
    var statusColors = {active:'var(--accent)',done:'var(--accent3)',paused:'var(--accent4)',planning:'#aaa'};
    var statusLabels = {active:'نشط',done:'مكتمل',paused:'موقوف',planning:'تخطيط'};
    var safeClientName = c.name.replace(/'/g,"\\'");
    body.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">'+
      '<div style="font-size:13px;color:var(--text2)">'+cProjects.length+' مشروع</div>'+
      '<button class="btn btn-primary btn-sm" onclick="closeM(\'modal-client-profile\');showPage(\'projects\');setTimeout(function(){openProjectModal(null,\''+safeClientName+'\')},200)">+ مشروع جديد</button>'+
    '</div>'+
    (cProjects.length ? cProjects.map(function(p){
      var tasks=(S.project_tasks||[]).filter(function(t){return String(t.project_id)===String(p.id);});
      var done=tasks.filter(function(t){return t.status==='done';}).length;
      var pct=tasks.length?Math.round(done/tasks.length*100):0;
      var sc=statusColors[p.status]||'var(--accent)';
      var sl=statusLabels[p.status]||p.status||'—';
      return '<div style="padding:14px;background:var(--surface2);border-radius:12px;margin-bottom:10px;border:1px solid var(--border);cursor:pointer" onclick="closeM(\'modal-client-profile\');showPage(\'projects\');setTimeout(function(){openProjectDetail('+p.id+')},200)">'+
        '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">'+
          '<div>'+
            '<div style="font-size:13px;font-weight:800">'+(p.name||'—')+'</div>'+
            (p.desc?'<div style="font-size:11px;color:var(--text3);margin-top:2px">'+p.desc.slice(0,60)+(p.desc.length>60?'…':'')+'</div>':'')+
          '</div>'+
          '<span style="font-size:10px;font-weight:700;padding:3px 10px;border-radius:20px;background:'+sc+'22;color:'+sc+'">'+sl+'</span>'+
        '</div>'+
        (tasks.length?
          '<div style="display:flex;align-items:center;gap:8px">'+
            '<div style="flex:1;height:5px;background:var(--surface3);border-radius:3px;overflow:hidden">'+
              '<div style="height:100%;width:'+pct+'%;background:'+sc+';border-radius:3px"></div>'+
            '</div>'+
            '<div style="font-size:10px;color:var(--text3)">'+done+'/'+tasks.length+'</div>'+
          '</div>':'') +
        (p.deadline?'<div style="font-size:10px;color:var(--text3);margin-top:6px"><i class="fa-solid fa-calendar-days"></i> '+p.deadline+'</div>':'')+
      '</div>';
    }).join('')
    :'<div class="empty"><div class="empty-icon"><i class="fa-solid fa-folder-open"></i></div>لا مشاريع مرتبطة بهذا العميل<br><button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="closeM(\'modal-client-profile\');showPage(\'projects\')">+ إضافة مشروع</button></div>');
  }

  else if(tab==='accounts'){
    // ════ تاب الحسابات المالية للعميل ════
    const cur = _getCurrency();
    const openBal = c.openingBalance || 0;
    const openType = c.openingBalanceType || 'receivable';
    const openNote = c.openingBalanceNote || '';
    const totalIncome = cTrans.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
    const totalExpense = cTrans.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
    const totalInvAll = cInvs.reduce((s,i)=>s+(+i.total||0),0);
    const totalPaid = cInvs.filter(i=>i.paid||i.status==='مدفوعة'||i.status==='paid').reduce((s,i)=>s+(+i.total||0),0);
    const unpaid = Math.max(0, totalInvAll - totalPaid);
    const openBalReceivable = openType==='receivable' ? openBal : 0;
    const openBalPrepaid = openType==='prepaid' ? openBal : 0;
    const netBalance = openBalReceivable + unpaid - openBalPrepaid;

    // بناء سجل شهري
    const monthlyMap = {};
    cTrans.forEach(function(t){
      const mk = (t.isoDate||t.date||'').slice(0,7);
      if(!mk) return;
      if(!monthlyMap[mk]) monthlyMap[mk]={income:0,expense:0,count:0};
      if(t.type==='income') monthlyMap[mk].income+=t.amount;
      else monthlyMap[mk].expense+=t.amount;
      monthlyMap[mk].count++;
    });
    const monthKeys = Object.keys(monthlyMap).sort((a,b)=>b.localeCompare(a));
    const arabicMonths=['','يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
    const fmtMK=mk=>{ const [y,m]=mk.split('-'); return (arabicMonths[+m]||m)+' '+y; };

    body.innerHTML=`
      <!-- ملخص الحساب -->
      <div style="margin-bottom:16px">
        <div class="section-title" style="margin-bottom:10px"><i class="fa-solid fa-scale-balanced"></i> ملخص حساب ${escapeHtml(c.name)}</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:14px">
          <div class="card" style="padding:12px;text-align:center">
            <div style="font-size:18px;font-weight:900;color:var(--accent3)">${totalIncome.toLocaleString()} ${cur}</div>
            <div style="font-size:10px;color:var(--text3);margin-top:3px"><i class="fa-solid fa-coins"></i> إجمالي المحصّل</div>
          </div>
          <div class="card" style="padding:12px;text-align:center">
            <div style="font-size:18px;font-weight:900;color:var(--accent2)">${totalInvAll.toLocaleString()} ${cur}</div>
            <div style="font-size:10px;color:var(--text3);margin-top:3px"><i class="fa-solid fa-file-invoice"></i> إجمالي الفواتير</div>
          </div>
          <div class="card" style="padding:12px;text-align:center;border-right:2px solid ${unpaid>0?'var(--accent4)':'var(--accent3)'}">
            <div style="font-size:18px;font-weight:900;color:${unpaid>0?'var(--accent4)':'var(--accent3)'}">${unpaid.toLocaleString()} ${cur}</div>
            <div style="font-size:10px;color:var(--text3);margin-top:3px">⏳ غير مسدّد</div>
          </div>
          ${openBal>0?`<div class="card" style="padding:12px;text-align:center;border-right:2px solid ${openType==='receivable'?'var(--accent4)':'var(--accent3)'}">
            <div style="font-size:18px;font-weight:900;color:${openType==='receivable'?'var(--accent4)':'var(--accent3)'}">${openBal.toLocaleString()} ${cur}</div>
            <div style="font-size:10px;color:var(--text3);margin-top:3px">${openType==='receivable'?'💰 مبالغ مستحقة عليه':'✅ رصيد لديه مسبقاً'}</div>
          </div>`:''}
        </div>
        ${netBalance>0?`<div style="padding:12px 14px;background:rgba(255,107,107,.1);border-radius:12px;border-right:3px solid var(--accent4);margin-bottom:12px">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px">
            <div>
              <div style="font-size:13px;font-weight:800">📌 صافي المستحق على العميل: ${netBalance.toLocaleString()} ${cur}</div>
              ${openNote?`<div style="font-size:11px;color:var(--text3);margin-top:3px">${escapeHtml(openNote)}</div>`:''}
            </div>
            <button class="btn btn-primary btn-sm" style="flex-shrink:0;white-space:nowrap" onclick="_collectFromClient(${c.id},${netBalance})">
              <i class="fa-solid fa-hand-holding-dollar"></i> تحصيل
            </button>
          </div>
        </div>`:''}
      </div>

      <!-- الرصيد الافتتاحي في السجل -->
      <div style="margin-bottom:16px">
        <div class="section-title" style="margin-bottom:10px"><i class="fa-solid fa-list-timeline"></i> سجل المعاملات الكاملة</div>
        ${openBal>0?`<div style="padding:10px 14px;background:${openType==='receivable'?'rgba(255,107,107,.08)':'rgba(79,209,165,.08)'};border-radius:10px;border:1px solid var(--border);margin-bottom:8px;display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-size:12px;font-weight:800">${openType==='receivable'?'💰 مبالغ مستحقة من قبل بدء التعامل':'✅ رصيد دفعه مسبقاً قبل بدء التعامل'}</div>
            ${openNote?`<div style="font-size:11px;color:var(--text3)">${escapeHtml(openNote)}</div>`:''}
          </div>
          <div style="font-size:14px;font-weight:900;color:${openType==='receivable'?'var(--accent4)':'var(--accent3)'}">
            ${openType==='receivable'?'+':'-'}${openBal.toLocaleString()} ${cur}
          </div>
        </div>`:''}
        ${cTrans.length?[...cTrans].sort((a,b)=>(b.isoDate||b.date||'').localeCompare(a.isoDate||a.date||'')).map(t=>`
          <div style="padding:10px 14px;background:var(--surface2);border-radius:10px;border:1px solid var(--border);margin-bottom:6px;display:flex;justify-content:space-between;align-items:center">
            <div>
              <div style="font-size:12px;font-weight:700">${escapeHtml(t.desc||'معاملة')}</div>
              <div style="font-size:10px;color:var(--text3)">${t.isoDate||t.date||'—'}${t.payMethod?' · '+t.payMethod:''}</div>
            </div>
            <div style="font-size:14px;font-weight:900;color:${t.type==='income'?'var(--accent3)':'var(--accent4)'}">${t.type==='income'?'+':'-'}${t.amount.toLocaleString()} ${cur}</div>
          </div>`).join('')
          :'<div style="text-align:center;padding:20px;color:var(--text3);font-size:13px"><i class="fa-solid fa-inbox"></i> لا معاملات مالية مسجلة</div>'}
      </div>

      <!-- سجل شهري -->
      ${monthKeys.length?`<div>
        <div class="section-title" style="margin-bottom:10px"><i class="fa-solid fa-calendar-days"></i> السجل الشهري والسنوي</div>
        ${monthKeys.map(mk=>`
          <div style="padding:10px 14px;background:var(--surface2);border-radius:10px;border:1px solid var(--border);margin-bottom:6px;display:flex;justify-content:space-between;align-items:center">
            <div style="font-size:12px;font-weight:700">${fmtMK(mk)}</div>
            <div style="display:flex;gap:14px;font-size:12px">
              ${monthlyMap[mk].income?`<span style="color:var(--accent3);font-weight:700">+${monthlyMap[mk].income.toLocaleString()} ${cur}</span>`:''}
              ${monthlyMap[mk].expense?`<span style="color:var(--accent4);font-weight:700">-${monthlyMap[mk].expense.toLocaleString()} ${cur}</span>`:''}
              <span style="color:var(--text3)">${monthlyMap[mk].count} معاملة</span>
            </div>
          </div>`).join('')}
      </div>`:''}
    `;
  }

  else if(tab==='reviews'){
    const clientRevs = (S.reviews||[]).filter(r=>String(r.client_id)===String(c.id)||r.client_name===c.name);
    const avg = clientRevs.length ? (clientRevs.reduce((s,r)=>s+(+r.stars||0),0)/clientRevs.length).toFixed(1) : null;
    body.innerHTML=`
      <div style="margin-bottom:16px">
        <div class="section-title" style="margin-bottom:12px"><i class="fa-solid fa-star" style="color:var(--accent2)"></i> تقييمات ${escapeHtml(c.name)}</div>
        ${clientRevs.length?`
        <div style="background:var(--surface2);border:1px solid var(--border);border-radius:14px;padding:16px;margin-bottom:14px;text-align:center">
          <div style="font-size:42px;font-weight:900;color:#f7c948;line-height:1">${avg}</div>
          <div style="font-size:20px;margin:6px 0">${'⭐'.repeat(Math.round(+avg))}</div>
          <div style="font-size:12px;color:var(--text3)">${clientRevs.length} تقييم من العميل</div>
        </div>
        ${clientRevs.sort((a,b)=>new Date(b.created_at||0)-new Date(a.created_at||0)).map(r=>`
        <div style="background:var(--surface2);border:1px solid var(--border);border-radius:12px;padding:14px;margin-bottom:10px">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
            <div style="font-size:13px;font-weight:800;color:var(--text)">${escapeHtml(r.task_title||'طلب')}</div>
            <div style="font-size:18px;letter-spacing:2px">${'⭐'.repeat(+r.stars||0)}</div>
          </div>
          ${r.comment?`<div style="font-size:13px;color:var(--text2);line-height:1.7;padding:10px 12px;background:var(--surface);border-radius:10px;border-right:3px solid #f7c948;font-style:italic">"${escapeHtml(r.comment)}"</div>`:''}
          <div style="font-size:10px;color:var(--text3);margin-top:8px"><i class="fa-solid fa-calendar"></i> ${r.created_at?new Date(r.created_at).toLocaleDateString('ar-EG'):''}</div>
        </div>`).join('')}
        `:`<div style="text-align:center;padding:40px 20px;color:var(--text3)">
          <div style="font-size:40px;opacity:.3;margin-bottom:10px">⭐</div>
          <div style="font-size:14px;font-weight:700;color:var(--text2);margin-bottom:5px">لا توجد تقييمات بعد</div>
          <div style="font-size:12px">سيظهر التقييم هنا بعد اكتمال طلب وتقييم العميل له</div>
        </div>`}
      </div>`;
  }

  else if(tab==='statements'){
    const cStmts=(_stmtsData?_stmtsData():[]).filter(s=>s.client===c.name);
    body.innerHTML=`
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <div style="font-size:13px;color:var(--text2)">${cStmts.length} كشف حساب</div>
        <button class="btn btn-primary btn-sm" onclick="_stmtNewDialog('${c.name.replace(/'/g,"\\'")}')">+ كشف جديد</button>
      </div>
      ${cStmts.length?cStmts.map(s=>`
        <div style="padding:12px;background:var(--surface2);border-radius:8px;margin-bottom:8px;border:1px solid var(--border)">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px">
            <div>
              <div style="font-size:12px;font-weight:800;color:var(--accent)">${s.num}</div>
              <div style="font-size:11px;color:var(--text3)"><i class="fa-solid fa-calendar-days"></i> ${s.from||'—'} → ${s.to||'—'} · ${s.tasks_count||0} طلب</div>
            </div>
            <div style="text-align:left">
              <div style="font-size:14px;font-weight:700;color:var(--accent3)">${(s.total||0).toLocaleString()} ج</div>
            </div>
          </div>
          <div style="display:flex;gap:5px">
            <button class="btn btn-ghost btn-sm" onclick="_showStmtDetail('${s.id}');closeM('modal-client-profile');showPage('invoices');setTimeout(()=>switchInvTab('statements'),100)"><i class="fa-solid fa-eye"></i> عرض</button>
            <button class="btn btn-warn btn-sm" onclick="_printStmt('${s.id}')"><i class="fa-solid fa-print"></i> طباعة</button>
            <button class="btn btn-success btn-sm" onclick="_waStmt('${s.id}')"><i class="fa-solid fa-comments"></i> واتساب</button>
            <button class="btn btn-danger btn-sm" onclick="_delStmt('${s.id}');_renderProfileTab('statements',${id})"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>`).join('')
      :'<div class="empty"><div class="empty-icon"><i class="fa-solid fa-file-lines"></i></div>لا كشوفات بعد<br><button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="_stmtNewDialog(\''+c.name.replace(/'/g,"\\'")+'\')" >+ كشف جديد</button></div>'}`;
  }
}

function _profileShowStatement(id){
  const c=S.clients.find(c=>c.id===id);if(!c)return;
  const now=new Date();
  const defFrom=`${now.getFullYear()}-01-01`;
  const defTo=new Date().toISOString().split('T')[0];
  const overlay=document.createElement('div');
  overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:5000;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(3px)';
  overlay.innerHTML=`<div style="background:var(--surface);border-radius:16px;padding:24px;width:420px;max-width:96vw;box-shadow:0 24px 60px rgba(0,0,0,.5)">
    <div style="font-size:16px;font-weight:800;margin-bottom:16px"><i class="fa-solid fa-file-lines"></i> كشف حساب — ${c.name}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
      <div><label style="font-size:11px;color:var(--text3);display:block;margin-bottom:4px">من تاريخ</label><input type="date" id="_stmt-from" value="${defFrom}" style="width:100%;background:var(--surface2);border:1.5px solid var(--border);border-radius:8px;padding:8px;color:var(--text);font-family:var(--font);font-size:13px"></div>
      <div><label style="font-size:11px;color:var(--text3);display:block;margin-bottom:4px">إلى تاريخ</label><input type="date" id="_stmt-to" value="${defTo}" style="width:100%;background:var(--surface2);border:1.5px solid var(--border);border-radius:8px;padding:8px;color:var(--text);font-family:var(--font);font-size:13px"></div>
    </div>
    <div style="display:flex;gap:8px">
      <button style="flex:1;background:var(--accent);color:#fff;border:none;border-radius:10px;padding:11px;font-family:var(--font);font-size:13px;font-weight:700;cursor:pointer" onclick="_genStatement(${id})"><i class="fa-solid fa-file-lines"></i> إصدار الكشف</button>
      <button style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:11px 16px;font-family:var(--font);font-size:13px;cursor:pointer;color:var(--text2)" onclick="this.closest('[style*=fixed]').remove()">إلغاء</button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
}

function _genStatement(id){
  const c=S.clients.find(c=>c.id===id);if(!c)return;
  const from=document.getElementById('_stmt-from')?.value||'';
  const to=document.getElementById('_stmt-to')?.value||'';
  document.querySelectorAll('[style*="position:fixed"][style*="z-index:5000"]').forEach(el=>el.remove());

  const subClients=S.clients.filter(sc=>String(sc.parentClientId)===String(c.id));
  const allNames=subClients.length?[c.name,...subClients.map(sc=>sc.name)]:[c.name];
  const inRange=d=>(!from||d>=from)&&(!to||d<=to);
  const tasks=S.tasks.filter(t=>allNames.includes(t.client)&&inRange((t.isoDate||t.createdAt||t.doneAt||'').slice(0,10)));
  const invs=S.invoices.filter(i=>allNames.includes(i.client)&&inRange((i.isoDate||'').slice(0,10)||i.date||''));
  const totalTasks=tasks.reduce((s,t)=>s+(t.value||0),0);
  const totalInvPaid=invs.filter(i=>i.status==='paid').reduce((s,i)=>s+i.total,0);
  const totalInvPend=invs.filter(i=>i.status==='pending').reduce((s,i)=>s+i.total,0);
  const studio=S.settings?.name||'Ordo';
  const arabicMonths=['','يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

  const html=`<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>كشف حساب — ${c.name}</title>
  <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Cairo',Arial,sans-serif;background:#f5f6fa;color:#1a1a2e;padding:30px}
  .page{background:#fff;max-width:800px;margin:0 auto;border-radius:16px;padding:40px;box-shadow:0 4px 24px rgba(0,0,0,.08)}
  h1{font-size:22px;font-weight:900;color:#7c6ff7;margin-bottom:4px}.sub{font-size:12px;color:#888;margin-bottom:24px}
  .meta{display:flex;gap:20px;flex-wrap:wrap;margin-bottom:24px;padding:14px 18px;background:#f0f2f8;border-radius:10px;font-size:12px}
  .meta b{color:#7c6ff7}
  .section-title{font-size:14px;font-weight:800;color:#7c6ff7;border-bottom:2px solid #e8eaf0;padding-bottom:6px;margin:20px 0 10px}
  table{width:100%;border-collapse:collapse;font-size:12px}
  th{background:#f0f2f8;padding:8px 12px;text-align:right;font-weight:700;color:#5a5a7a}
  td{padding:8px 12px;border-bottom:1px solid #eee}
  tr:last-child td{border-bottom:none}
  .badge{display:inline-block;padding:2px 8px;border-radius:8px;font-size:10px;font-weight:700}
  .paid{background:rgba(79,209,165,.15);color:#2db87c}.pend{background:rgba(247,201,72,.15);color:#d49e00}
  .summary{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:24px}
  .sum-card{background:#f0f2f8;border-radius:10px;padding:14px;text-align:center}
  .sum-card .val{font-size:20px;font-weight:900;color:#7c6ff7}
  .sum-card .lbl{font-size:10px;color:#888;margin-top:3px}
  @media print{body{padding:0;background:#fff}.page{box-shadow:none;border-radius:0}}
  </style></head><body><div class="page">
  <h1><i class="fa-solid fa-file-lines"></i> كشف حساب</h1>
  <div class="sub">${studio} · صادر بتاريخ ${new Date().toLocaleDateString('ar-EG')}</div>
  <div class="meta">
    <div><b>العميل:</b> ${c.name}</div>
    ${c.phone?`<div><b>الهاتف:</b> ${c.phone}</div>`:''}
    ${c.email?`<div><b>البريد:</b> ${c.email}</div>`:''}
    <div><b>الفترة:</b> ${from||'البداية'} — ${to||'الآن'}</div>
  </div>
  <div class="summary">
    <div class="sum-card"><div class="val">${tasks.length}</div><div class="lbl">إجمالي الطلبات</div></div>
    <div class="sum-card"><div class="val" style="color:#2db87c">${totalInvPaid.toLocaleString()} ج</div><div class="lbl"><i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> محصّل</div></div>
    <div class="sum-card"><div class="val" style="color:#d49e00">${totalInvPend.toLocaleString()} ج</div><div class="lbl">⏳ معلق</div></div>
  </div>
  ${tasks.length?`<div class="section-title"><i class="fa-solid fa-clipboard-list"></i> الطلبات والمشاريع</div>
  <table><thead><tr><th>الطلب</th><th>التاريخ</th><th>القيمة</th><th>الحالة</th></tr></thead><tbody>
  ${tasks.map(t=>{const st={new:'جديد',progress:'جاري',review:'مراجعة',done:'مكتمل'};return`<tr><td>${t.title}</td><td>${(t.isoDate||t.createdAt||'').slice(0,10)||'—'}</td><td>${t.value?t.value.toLocaleString()+' '+_getCurrency():'—'}</td><td>${st[t.status]||t.status||'—'}</td></tr>`}).join('')}
  </tbody></table>`:''}
  ${invs.length?`<div class="section-title"><i class="fa-solid fa-receipt"></i> الفواتير</div>
  <table><thead><tr><th>رقم</th><th>التاريخ</th><th>الإجمالي</th><th>الحالة</th></tr></thead><tbody>
  ${invs.map(i=>`<tr><td>#${i.num||'—'}</td><td>${i.date||'—'}</td><td>${i.total.toLocaleString()} ج</td><td><span class="badge ${i.status==='paid'?'paid':'pend'}">${i.status==='paid'?'مدفوع':'معلق'}</span></td></tr>`).join('')}
  </tbody></table>`:''}
  <div style="margin-top:30px;padding-top:16px;border-top:2px solid #e8eaf0;display:flex;justify-content:space-between;font-size:11px;color:#aaa">
    <span>${studio}</span><span>كشف حساب صادر تلقائياً من Ordo</span>
  </div>
  </div><${'script'}>window.onload=()=>setTimeout(()=>window.print(),400)</${'script'}>
  <!-- مؤشر حالة البيانات -->
  <div id="data-status-bar" style="display:none;position:fixed;bottom:0;left:0;right:0;z-index:7999;background:rgba(18,18,30,.92);border-top:1px solid rgba(79,209,165,.2);padding:4px 16px;font-size:10px;color:var(--text3);display:flex;align-items:center;gap:12px;backdrop-filter:blur(8px)">
    <span id="dsb-tasks" style="color:var(--accent3)"></span>
    <span id="dsb-clients"></span>
    <span id="dsb-saved"></span>
    <span id="dsb-cloud" style="margin-right:auto"></span>
  </div>

</body></html>`;
  const w=window.open('','_blank');w.document.write(html);w.document.close();
}

// ═══════════════════════════════════════════════════
// STATEMENTS SYSTEM (كشوفات الحساب)
// ═══════════════════════════════════════════════════
function _stmtsData(){ return S.statements || []; }
function _stmtsSave(arr){ S.statements=arr; lsSave(); cloudSave(S); }
function _nextStmtNum(){
  const arr=_stmtsData();
  if(!arr.length) return 'KH-001';
  const nums=arr.map(s=>+(s.num||'').replace(/[^\d]/g,'')||0);
  return 'KH-'+String(Math.max(...nums)+1).padStart(3,'0');
}

function _initStatementsPanel(){
  // fill client selector
  const sel=document.getElementById('stmt-client-sel'); if(!sel)return;
  const cur=sel.value;
  sel.innerHTML='<option value="">— اختر عميل —</option>'+
    S.clients.map(c=>`<option value="${c.name}">${c.name}</option>`).join('');
  if(cur) sel.value=cur;
  renderStatementsList();
}

function renderStatementsList(){
  const el=document.getElementById('stmt-list-el'); if(!el)return;
  const client=document.getElementById('stmt-client-sel')?.value||'';
  const stmts=_stmtsData().filter(s=>!client||s.client===client)
    .sort((a,b)=>(b.created_at||'').localeCompare(a.created_at||''));
  if(!stmts.length){
    el.innerHTML='<div class="empty" style="padding:28px 12px"><div class="empty-icon"><i class="fa-solid fa-file-lines"></i></div>'+(client?'لا كشوفات لهذا العميل':'اختر عميلاً أو تصفّح الكشوفات')+
      (client?`<button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="_stmtNewDialog('${client.replace(/'/g,"\\'")}')">+ كشف جديد</button>`:'')+
      '</div>';
    return;
  }
  el.innerHTML=stmts.map(s=>`
    <div style="padding:12px 14px;border-bottom:1px solid var(--border);cursor:pointer;transition:.15s" onclick="_showStmtDetail('${s.id}')" onmouseover="this.style.background='var(--surface2)'" onmouseout="this.style.background=''">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div>
          <div style="font-size:12px;font-weight:800;color:var(--accent)">${s.num}</div>
          <div style="font-size:13px;font-weight:600">${s.client}</div>
          <div style="font-size:10px;color:var(--text3);margin-top:2px">${s.from||''} → ${s.to||''}</div>
        </div>
        <div style="text-align:left">
          <div style="font-size:13px;font-weight:700;color:var(--accent3)">${(s.total||0).toLocaleString()} ج</div>
          <div style="font-size:10px;color:var(--text3)">${s.tasks_count||0} طلب</div>
        </div>
      </div>
    </div>`).join('');
}

function _stmtNewDialog(prefillClient){
  const now=new Date();
  const defFrom=`${now.getFullYear()}-01-01`;
  const defTo=now.toISOString().split('T')[0];
  const clientOpts=S.clients.map(c=>`<option value="${c.name}" ${prefillClient===c.name?'selected':''}>${c.name}</option>`).join('');
  const overlay=document.createElement('div');
  overlay.id='_stmt-dialog';
  overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:5000;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(3px)';
  overlay.innerHTML=`<div style="background:var(--surface);border-radius:16px;padding:24px;width:420px;max-width:96vw;box-shadow:0 24px 60px rgba(0,0,0,.5)">
    <div style="font-size:16px;font-weight:800;margin-bottom:16px"><i class="fa-solid fa-file-lines"></i> كشف حساب جديد</div>
    <div style="margin-bottom:12px">
      <label style="font-size:11px;color:var(--text3);display:block;margin-bottom:4px">العميل *</label>
      <select id="_stmt-client" style="width:100%;background:var(--surface2);border:1.5px solid var(--border);border-radius:8px;padding:9px;color:var(--text);font-family:var(--font);font-size:13px">
        <option value="">— اختر عميل —</option>${clientOpts}
      </select>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
      <div><label style="font-size:11px;color:var(--text3);display:block;margin-bottom:4px">من تاريخ</label><input type="date" id="_stmt-from2" value="${defFrom}" style="width:100%;background:var(--surface2);border:1.5px solid var(--border);border-radius:8px;padding:8px;color:var(--text);font-family:var(--font);font-size:13px"></div>
      <div><label style="font-size:11px;color:var(--text3);display:block;margin-bottom:4px">إلى تاريخ</label><input type="date" id="_stmt-to2" value="${defTo}" style="width:100%;background:var(--surface2);border:1.5px solid var(--border);border-radius:8px;padding:8px;color:var(--text);font-family:var(--font);font-size:13px"></div>
    </div>
    <div style="display:flex;gap:8px">
      <button style="flex:1;background:var(--accent);color:#fff;border:none;border-radius:10px;padding:11px;font-family:var(--font);font-size:13px;font-weight:700;cursor:pointer" onclick="_saveAndShowStmt()"><i class="fa-solid fa-file-lines"></i> إصدار وحفظ</button>
      <button style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:11px 16px;font-family:var(--font);font-size:13px;cursor:pointer;color:var(--text2)" onclick="document.getElementById('_stmt-dialog').remove()">إلغاء</button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
}

function _saveAndShowStmt(){
  const clientName=document.getElementById('_stmt-client')?.value||'';
  const from=document.getElementById('_stmt-from2')?.value||'';
  const to=document.getElementById('_stmt-to2')?.value||'';
  if(!clientName){ alert('اختر عميلاً'); return; }
  document.getElementById('_stmt-dialog')?.remove();

  const c=S.clients.find(x=>x.name===clientName);
  const subClients=S.clients.filter(sc=>String(sc.parentClientId)===String(c?.id));
  const allNames=subClients.length?[clientName,...subClients.map(sc=>sc.name)]:[clientName];
  const inRange=d=>(!from||d>=from)&&(!to||d<=to);
  const tasks=S.tasks.filter(t=>allNames.includes(t.client)&&inRange((t.isoDate||t.createdAt||t.doneAt||'').slice(0,10)));
  const invs=S.invoices.filter(i=>allNames.includes(i.client)&&inRange((i.isoDate||'').slice(0,10)||i.date||''));
  const totalTasks=tasks.reduce((s,t)=>s+(t.value||0),0);
  const totalInvPaid=invs.filter(i=>i.status==='paid').reduce((s,i)=>s+i.total,0);
  const totalInvPend=invs.filter(i=>i.status==='pending').reduce((s,i)=>s+i.total,0);

  const stmt={
    id:'stmt_'+Date.now(), num:_nextStmtNum(), client:clientName,
    from, to, tasks_count:tasks.length, total:totalTasks,
    paid:totalInvPaid, pending:totalInvPend,
    tasks:tasks.map(t=>({id:t.id,title:t.title,date:(t.isoDate||t.createdAt||t.doneAt||'').slice(0,10),value:t.value||0,status:t.status})),
    invoices:invs.map(i=>({id:i.id,num:i.num,date:i.date||'',total:i.total,status:i.status})),
    created_at:new Date().toISOString()
  };
  const arr=_stmtsData(); arr.unshift(stmt); _stmtsSave(arr);

  // update client selector and show
  const sel=document.getElementById('stmt-client-sel');
  if(sel){ sel.value=clientName; }
  renderStatementsList();
  _showStmtDetail(stmt.id);
  if(typeof showMiniNotif==='function') showMiniNotif('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم حفظ كشف الحساب '+stmt.num);
}

function _showStmtDetail(id){
  const s=_stmtsData().find(x=>x.id===id); if(!s)return;
  const area=document.getElementById('stmt-detail-area'); if(!area)return;
  const stFmt={new:'جديد',progress:'جاري',review:'مراجعة',done:'مكتمل'};

  area.innerHTML=`<div class="card" style="padding:20px">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;flex-wrap:wrap;gap:8px">
      <div>
        <div style="font-size:18px;font-weight:900;color:var(--accent)">${s.num}</div>
        <div style="font-size:14px;font-weight:700">${s.client}</div>
        <div style="font-size:11px;color:var(--text3);margin-top:2px"><i class="fa-solid fa-calendar-days"></i> ${s.from||'—'} → ${s.to||'—'}</div>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <button class="btn btn-primary btn-sm" onclick="_printStmt('${s.id}')"><i class="fa-solid fa-print"></i> طباعة PDF</button>
        <button class="btn btn-success btn-sm" onclick="_waStmt('${s.id}')"><i class="fa-solid fa-comments"></i> واتساب</button>
        <button class="btn btn-danger btn-sm" onclick="_delStmt('${s.id}')"><i class="fa-solid fa-trash"></i> حذف</button>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px">
      <div class="card" style="padding:10px;text-align:center"><div style="font-size:16px;font-weight:900;color:var(--accent)">${s.tasks_count}</div><div style="font-size:10px;color:var(--text3)">طلبات</div></div>
      <div class="card" style="padding:10px;text-align:center"><div style="font-size:16px;font-weight:900;color:var(--accent3)">${s.paid.toLocaleString()} ج</div><div style="font-size:10px;color:var(--text3)"><i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> محصّل</div></div>
      <div class="card" style="padding:10px;text-align:center"><div style="font-size:16px;font-weight:900;color:var(--accent2)">${s.pending.toLocaleString()} ج</div><div style="font-size:10px;color:var(--text3)">⏳ معلق</div></div>
    </div>
    ${s.tasks&&s.tasks.length?`<div class="section-title" style="margin-bottom:8px"><i class="fa-solid fa-clipboard-list"></i> الطلبات (${s.tasks.length})</div>
    ${s.tasks.map(t=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid var(--border)">
      <div style="font-size:12px;font-weight:600;cursor:pointer;color:var(--accent)" onclick="closeM&&closeM('modal-client-profile');openTaskDetail(${t.id})">${t.title}</div>
      <div style="display:flex;gap:8px;align-items:center">
        <span style="font-size:11px;color:var(--text3)">${t.date||''}</span>
        ${t.value?`<span style="font-size:12px;font-weight:700;color:var(--accent3)">${t.value.toLocaleString()} ج</span>`:''}
        <span style="font-size:10px;padding:1px 7px;border-radius:8px;background:var(--surface2)">${stFmt[t.status]||t.status||''}</span>
      </div>
    </div>`).join('')}`:''}
    ${s.invoices&&s.invoices.length?`<div class="section-title" style="margin:14px 0 8px"><i class="fa-solid fa-receipt"></i> الفواتير (${s.invoices.length})</div>
    ${s.invoices.map(i=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid var(--border)">
      <div style="font-size:12px;font-weight:600">#${i.num||'—'} <span style="color:var(--text3)">${i.date||''}</span></div>
      <div style="display:flex;gap:8px;align-items:center">
        <span style="font-size:12px;font-weight:700;color:${i.status==='paid'?'var(--accent3)':'var(--accent2)'}">${i.total.toLocaleString()} ج</span>
        <span style="font-size:10px;padding:1px 7px;border-radius:8px;background:${i.status==='paid'?'rgba(79,209,165,.15)':'rgba(247,201,72,.15)'};color:${i.status==='paid'?'var(--accent3)':'var(--accent2)'}">${i.status==='paid'?'مدفوع':'معلق'}</span>
      </div>
    </div>`).join('')}`:''}
  </div>`;
}

function _delStmt(id){
  if(!confirm('هل تريد حذف هذا الكشف؟')) return;
  _stmtsSave(_stmtsData().filter(s=>s.id!==id));
  renderStatementsList();
  const area=document.getElementById('stmt-detail-area');
  if(area) area.innerHTML=`<div class="card" style="display:flex;align-items:center;justify-content:center;min-height:380px"><div class="empty"><div class="empty-icon"><i class="fa-solid fa-file-lines"></i></div><div>اختر كشفاً أو أنشئ كشفاً جديداً</div><button class="btn btn-primary" style="margin-top:14px" onclick="_stmtNewDialog()">+ كشف حساب جديد</button></div></div>`;
  if(typeof showMiniNotif==='function') showMiniNotif('<i class="fa-solid fa-trash"></i> تم حذف الكشف');
}

function _printStmt(id){
  const s=_stmtsData().find(x=>x.id===id); if(!s)return;
  const studio=S.settings?.name||'Ordo';
  const stFmt={new:'جديد',progress:'جاري',review:'مراجعة',done:'مكتمل'};
  const html=`<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>كشف حساب ${s.num} — ${s.client}</title>
  <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Cairo',Arial,sans-serif;background:#f5f6fa;color:#1a1a2e;padding:30px}
  .page{background:#fff;max-width:800px;margin:0 auto;border-radius:16px;padding:40px;box-shadow:0 4px 24px rgba(0,0,0,.08)}
  h1{font-size:22px;font-weight:900;color:#7c6ff7}h2{font-size:12px;color:#888;margin-top:2px;margin-bottom:20px}
  .meta{display:flex;gap:20px;flex-wrap:wrap;margin-bottom:20px;padding:12px 16px;background:#f0f2f8;border-radius:10px;font-size:12px}.meta b{color:#7c6ff7}
  .cards{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:20px}
  .card{background:#f0f2f8;border-radius:10px;padding:12px;text-align:center}.card .v{font-size:18px;font-weight:900;color:#7c6ff7}.card .l{font-size:10px;color:#888;margin-top:2px}
  .sec{font-size:13px;font-weight:800;color:#7c6ff7;border-bottom:2px solid #e8eaf0;padding-bottom:5px;margin:18px 0 10px}
  table{width:100%;border-collapse:collapse;font-size:12px}th{background:#f0f2f8;padding:7px 10px;text-align:right;font-weight:700;color:#5a5a7a}
  td{padding:7px 10px;border-bottom:1px solid #eee}.badge{display:inline-block;padding:1px 7px;border-radius:7px;font-size:10px;font-weight:700}
  .paid{background:rgba(79,209,165,.15);color:#2db87c}.pend{background:rgba(247,201,72,.15);color:#d49e00}
  footer{margin-top:28px;padding-top:14px;border-top:2px solid #e8eaf0;display:flex;justify-content:space-between;font-size:10px;color:#aaa}
  @media print{body{padding:0;background:#fff}.page{box-shadow:none;border-radius:0}}</style></head>
  <body><div class="page">
  <h1><i class="fa-solid fa-file-lines"></i> كشف حساب — ${s.num}</h1><h2>${studio} · صادر ${new Date(s.created_at).toLocaleDateString('ar-EG')}</h2>
  <div class="meta">
    <div><b>العميل:</b> ${s.client}</div>
    <div><b>الفترة:</b> ${s.from||'—'} → ${s.to||'—'}</div>
  </div>
  <div class="cards">
    <div class="card"><div class="v">${s.tasks_count}</div><div class="l">طلبات</div></div>
    <div class="card"><div class="v" style="color:#2db87c">${s.paid.toLocaleString()} ج</div><div class="l"><i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> محصّل</div></div>
    <div class="card"><div class="v" style="color:#d49e00">${s.pending.toLocaleString()} ج</div><div class="l">⏳ معلق</div></div>
  </div>
  ${s.tasks&&s.tasks.length?`<div class="sec"><i class="fa-solid fa-clipboard-list"></i> الطلبات</div><table><thead><tr><th>الطلب</th><th>التاريخ</th><th>القيمة</th><th>الحالة</th></tr></thead><tbody>
  ${s.tasks.map(t=>`<tr><td>${t.title}</td><td>${t.date||'—'}</td><td>${t.value?t.value.toLocaleString()+' '+_getCurrency():'—'}</td><td>${stFmt[t.status]||'—'}</td></tr>`).join('')}
  </tbody></table>`:''}
  ${s.invoices&&s.invoices.length?`<div class="sec"><i class="fa-solid fa-receipt"></i> الفواتير</div><table><thead><tr><th>رقم</th><th>التاريخ</th><th>الإجمالي</th><th>الحالة</th></tr></thead><tbody>
  ${s.invoices.map(i=>`<tr><td>#${i.num||'—'}</td><td>${i.date||'—'}</td><td>${i.total.toLocaleString()} ج</td><td><span class="badge ${i.status==='paid'?'paid':'pend'}">${i.status==='paid'?'مدفوع':'معلق'}</span></td></tr>`).join('')}
  </tbody></table>`:''}
  <footer><span>${studio}</span><span>كشف حساب رقم ${s.num}</span></footer>
  </div><${'script'}>window.onload=()=>setTimeout(()=>window.print(),400)</${'script'}></body></html>`;
  const w=window.open('','_blank');w.document.write(html);w.document.close();
}

function _waStmt(id){
  const s=_stmtsData().find(x=>x.id===id); if(!s)return;
  const studio=S.settings?.name||'Ordo';
  const c=S.clients.find(x=>x.name===s.client);
  const phone=(c?.phone||'').replace(/[^\d]/g,'');
  const msg=`مرحباً ${s.client} <i class="fa-solid fa-hand-wave"></i>\n\nنرفق لك كشف حساب رقم ${s.num}\nالفترة: ${s.from||'—'} → ${s.to||'—'}\nإجمالي الطلبات: ${s.tasks_count} طلب\nالمحصّل: ${s.paid.toLocaleString()} ج\nالمعلق: ${s.pending.toLocaleString()} ج\n\n${studio}`;
  const url=`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  window.open(url,'_blank');
}

  
function delClient(id){confirmDel('هل تريد حذف هذا العميل؟',()=>{S.clients=S.clients.filter(c=>c.id!==id);lsSave();renderAll();});}

