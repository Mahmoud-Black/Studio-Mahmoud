// ============================================================
// DASHBOARD TEAM PAY + KANBAN MINI
// ============================================================
function renderDashTeamPay(){
  const list=document.getElementById('dash-team-pay-list'); if(!list) return;
  const owedTasks=S.tasks.filter(t=>t.workerMember&&!t.done&&t.workerAmount>0&&!t.workerDepositPaid);
  if(!owedTasks.length){ list.innerHTML='<div class="empty" style="padding:8px 0"><div class="empty-icon" style="font-size:18px"><i class="fa-solid fa-square-check" style="color:var(--accent3)"></i></div><div style="font-size:12px">لا مستحقات متأخرة</div></div>'; return; }
  // group by member
  const byMember={};
  owedTasks.forEach(t=>{ if(!byMember[t.workerMember]) byMember[t.workerMember]=0; byMember[t.workerMember]+=t.workerAmount; });
  list.innerHTML=Object.entries(byMember).map(([name,total])=>`
    <div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid rgba(42,42,58,.25)">
      <div><div style="font-size:12px;font-weight:700"><i class="fa-solid fa-user"></i> ${name}</div>
        <div style="font-size:11px;color:var(--text3)">${owedTasks.filter(t=>t.workerMember===name).length} مهمة</div>
      </div>
      <span style="font-size:13px;font-weight:800;color:#64b5f6">${total.toLocaleString()} ج</span>
    </div>`).join('');
}
function renderDashKanbanMini(){
  const el=document.getElementById('dash-kanban-mini-list'); if(!el) return;
  const active=S.tasks.filter(t=>!t.done).slice(0,6);
  if(!active.length){ el.innerHTML='<div class="empty" style="padding:8px 0"><div class="empty-icon"><i class="fa-solid fa-star-of-life"></i></div><div style="font-size:12px">لا مهام نشطة</div></div>'; return; }
  const stColor={new:'var(--text3)',progress:'var(--accent2)',review:'var(--accent)',paused:'#64b5f6'};
  const stLabel={new:'<i class="fa-solid fa-clipboard-list"></i>',progress:'<i class="fa-solid fa-bolt"></i>',review:'<i class="fa-solid fa-magnifying-glass"></i>',paused:'⏸'};
  el.innerHTML=active.map(t=>`
    <div onclick="openTaskDetail(${t.id})" style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid rgba(42,42,58,.2);cursor:pointer">
      <div class="task-priority priority-${t.priority||'low'}" style="flex-shrink:0"></div>
      <div style="flex:1;min-width:0;font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t.title}</div>
      <span style="font-size:10px;color:${stColor[t.status||'new']};flex-shrink:0">${stLabel[t.status||'new']||''}</span>
    </div>`).join('');
  if(S.tasks.filter(t=>!t.done).length>6) el.innerHTML+=`<div onclick="showPage('tasks')" style="font-size:11px;color:var(--accent);padding:5px 0;text-align:center;cursor:pointer">عرض الكل ←</div>`;
}

// ============================================================
// DASHBOARD SHORTCUT: call new fns from updateDash
// ============================================================


// ============================================================
// DASHBOARD MEETINGS SHORTCUT
// ============================================================
function renderDashMeetings(){
  const el=document.getElementById('dash-meetings-shortcut'); if(!el) return;
  const upcoming=(S.meetings||[]).filter(m=>!m.done && m.date>=new Date().toISOString().split('T')[0]).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,4);
  if(!upcoming.length){ el.innerHTML='<div class="empty" style="padding:8px 0"><div class="empty-icon"><i class="fa-solid fa-calendar"></i></div>لا ميتنجات قادمة</div>'; return; }
  const typeIcon={online:'<i class="fa-solid fa-desktop"></i>',offline:'<i class="fa-solid fa-location-dot"></i>',phone:'<i class="fa-solid fa-phone"></i>',whatsapp:'<i class="fa-solid fa-comments"></i>'};
  el.innerHTML=upcoming.map(m=>`
    <div onclick="showPage('meetings')" style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid rgba(42,42,58,.25);cursor:pointer">
      <div style="background:rgba(124,111,247,.15);border-radius:8px;padding:6px 8px;text-align:center;flex-shrink:0;min-width:42px">
        <div style="font-size:11px;font-weight:800;color:var(--accent)">${m.date?m.date.slice(8):'—'}</div>
        <div style="font-size:9px;color:var(--text3)">${m.date?['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'][+m.date.slice(5,7)-1]?.slice(0,3)||'':''}</div>
      </div>
      <div style="flex:1;min-width:0">
        <div style="font-size:12px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${m.title}</div>
        <div style="font-size:11px;color:var(--text3)">${m.client?m.client+' · ':''} ${typeIcon[m.type]||'<i class="fa-solid fa-calendar-days"></i>'} ${m.time||''}</div>
      </div>
    </div>`).join('');
}

// ══════════════════════════════════════════════════
// AUTH STATE — Single source of truth
// ══════════════════════════════════════════════════
let _authInitialized = false;
// PHASE 2 FIX: Debounce auth state changes to prevent login loops
let _authDebounceTimer = null;
let _authProcessingUserId = null;

supa.auth.onAuthStateChange(async (event, session) => {
  // ── Public service/portal pages: skip all auth handling ──
  var _pup = new URLSearchParams(window.location.search);
  if(_pup.get('svcorder') || (_pup.get('portal') && _pup.get('uid')) || (_pup.get('clientportal') && _pup.get('cid'))){ if(window._showApp) window._showApp(); return; }

  console.log('Auth event:', event, session?.user?.email);

  // TOKEN_REFRESHED = الـ session اتجدد تلقائياً — مش محتاج login جديد
  if(event === 'TOKEN_REFRESHED' && session && session.user){
    _supaUserId = session.user.id;
    const existing = getSession();
    if(existing) saveSession({...existing, supaId:session.user.id, id:session.user.id});
    return;
  }

  // SIGNED_IN أو INITIAL_SESSION — نفس المعاملة
  if((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session && session.user){
    // PHASE 2 FIX: Prevent duplicate processing for same user
    if(_authProcessingUserId === session.user.id) return;

    // لو بالفعل initialized بنفس المستخدم — مش محتاج نعمل حاجة
    // Exception: SIGNED_IN after OAuth redirect should always proceed
    const isOAuthRedirect = event === 'SIGNED_IN' && session.user.app_metadata?.provider === 'google';
    if(_supaUserId === session.user.id && _authInitialized && !isOAuthRedirect) return;
    // لو فيه مستخدم تاني logged in في tab تاني — ignore
    const existingSession = getSession();
    if(existingSession && existingSession.id && existingSession.id !== session.user.id && _authInitialized && !isOAuthRedirect){
      console.warn('Session conflict: ignoring auth change for different user');
      return;
    }

    // FIX: Check if this login was manually triggered by the user
    const isAdminTabSession = (
      session.user.app_metadata?.role === 'admin' ||
      session.user.app_metadata?.is_admin === true ||
      session.user.user_metadata?.role === 'admin' ||
      session.user.user_metadata?.is_admin === true
    );
    // ALWAYS block admin accounts from auto-logging into user site
    if(isAdminTabSession){
      const authScreen = document.getElementById('auth-screen');
      if(authScreen && !_supaUserId){ authScreen.classList.remove('hidden'); }
      console.log('Admin account blocked from user site auto-login');
      return;
    }

    const meta = session.user.user_metadata || {};
    const userObj = {
      id    : session.user.id,
      supaId: session.user.id,
      email : session.user.email || '',
      name  : meta.full_name || meta.name || (typeof S!=='undefined'&&S.settings?.name)||localStorage.getItem('studioName')||'Ordo',
      phone : meta.phone  || '',
      studio: meta.studio || (meta.full_name ? meta.full_name + ' Studio' : ''),
      avatarUrl: meta.avatarUrl || meta.avatar_url || meta.picture || ''
    };
    // دايما نعمل loginWithSupaSession علشان نجيب البيانات من السحابة
    _authInitialized = true; // Set BEFORE async call to prevent duplicate execution
    _authProcessingUserId = session.user.id; // PHASE 2 FIX: Track processing user
    await loginWithSupaSession(session.user, session, userObj);
    _authProcessingUserId = null; // PHASE 2 FIX: Clear after done
  }

  if(event === 'PASSWORD_RECOVERY'){
    showResetPasswordFromEmail();
  }

  if(event === 'SIGNED_OUT'){
    _supaUserId = null;
    _authInitialized = false;
    _authProcessingUserId = null; // PHASE 2 FIX
  }

  // لو مفيش session — اعرض شاشة اللوجين
  if(!session && !_supaUserId && !_authInitialized){
    const authScreen = document.getElementById('auth-screen');
    if(authScreen) authScreen.classList.remove('hidden');
    _authInitialized = true;
  }
});

// initAuth — render UI and set fallback timeout
async function initAuthFallback(){
  // ── Public pages: skip all auth/dashboard init entirely ──
  var _pu = new URLSearchParams(window.location.search);
  if(_pu.get('svcorder') || (_pu.get('portal') && _pu.get('uid')) || (_pu.get('clientportal') && _pu.get('cid'))){ return; }

  loadThemePreferences();
  renderAll();
  updateHeader('dashboard');
  checkPasswordResetFlow();

  if(window.location.hash === '#' || window.location.hash === ''){
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  // Fallback: show auth screen if no session after 5 seconds
  // (onAuthStateChange handles INITIAL_SESSION — this is just a safety net)
  setTimeout(()=>{
    if(!_authInitialized){
      const authScreen = document.getElementById('auth-screen');
      if(authScreen) authScreen.classList.remove('hidden');
      if(window._showApp) window._showApp();
      _authInitialized = true;
    }
  }, 5000);
}

initAuthFallback();
// close sidebar on desktop resize
window.addEventListener('resize',()=>{
  if(window.innerWidth>1024) closeSidebar();
});
// Init backup system after auth
setTimeout(()=>{ initBackupTimers(); }, 1500);

// ╔══════════════════════════════════════════════════════════════════╗
// ║  TIME TRACKER                                                    ║
// ╚══════════════════════════════════════════════════════════════════╝
// [vars moved early]

function ttSym(){return{EGP:'ج',USD:'$',SAR:'ر.س'}[_ttCur]||'ج';}
function ttFmt(s,sh){
  const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sc=s%60;
  if(sh)return h>0?h+'h '+m+'m':m+'m';
  return String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')+':'+String(sc).padStart(2,'0');
}
function ttEntries(){return S.timeEntries||[];}
function ttSaveE(arr){S.timeEntries=arr;lsSave();cloudSave(S);}

function renderTimeTracker(){
  if(!document.getElementById('page-timetracker'))return;
  ttUpdateStats();ttRenderEntries();ttRenderBreakdown();ttRenderCompare();ttFillDL();
  const ri=document.getElementById('tt-rate-input');if(ri)ri.value=_ttRate;
  const rs=document.getElementById('tt-stat-rate');if(rs)rs.textContent=_ttRate+' '+ttSym();
}
function ttUpdateStats(){
  const now=new Date(),td=new Date(now);td.setHours(0,0,0,0);
  const wk=new Date(now);wk.setDate(now.getDate()-7);
  const mo=new Date(now.getFullYear(),now.getMonth(),1);
  const entries=ttEntries();
  const sum=fr=>entries.filter(e=>new Date(e.started_at)>=fr).reduce((s,e)=>s+(e.duration_seconds||0),0);
  const extra=_tt.running&&_tt.startedAt?Math.floor((Date.now()-_tt.startedAt)/1000):Math.floor(_tt.elapsed/1000);
  const earn=(s)=>((s/3600)*_ttRate).toFixed(0)+' '+ttSym();
  const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v;};
  set('tt-stat-today',ttFmt(sum(td)+extra,1));set('tt-earn-today',earn(sum(td)+extra));
  set('tt-stat-week',ttFmt(sum(wk),1));set('tt-earn-week',earn(sum(wk)));
  set('tt-stat-month',ttFmt(sum(mo),1));set('tt-earn-month',earn(sum(mo)));
}
function ttFillDL(){
  const entries=ttEntries();
  const tasks=[...new Set(entries.map(e=>e.task_title).filter(Boolean))];
  const clients=[...new Set([...entries.map(e=>e.client_name),...(S.clients||[]).map(c=>c.name)].filter(Boolean))];
  ['tt-tasks-dl','tte-tasks-dl'].forEach(id=>{const el=document.getElementById(id);if(el)el.innerHTML=tasks.map(t=>`<option value="${t}">`).join('');});
  ['tt-clients-dl','tte-clients-dl'].forEach(id=>{const el=document.getElementById(id);if(el)el.innerHTML=clients.map(c=>`<option value="${c}">`).join('');});
}

// Timer controls
function ttToggle(){if(_tt.running)ttPause();else ttStart();}
function ttStart(){
  const task=document.getElementById('tt-task-input')?.value?.trim();
  if(!task){toast('أدخل اسم المهمة أولاً');return;}
  _tt.running=true;_tt.startedAt=_tt.startedAt||Date.now();
  clearInterval(_tt.interval);_tt.interval=setInterval(ttTick,1000);
  const btn=document.getElementById('tt-btn-main');
  if(btn){btn.textContent='⏸';btn.style.background='var(--accent2)';}
  const disp=document.getElementById('tt-display');if(disp)disp.style.color='var(--accent3)';
  const st=document.getElementById('tt-status');if(st)st.innerHTML='<i class="fa-solid fa-stopwatch"></i> يعمل الآن...';
}
function ttPause(){
  _tt.running=false;_tt.elapsed+=Date.now()-(_tt.startedAt||Date.now());_tt.startedAt=null;
  clearInterval(_tt.interval);
  const btn=document.getElementById('tt-btn-main');if(btn){btn.innerHTML='<i class="fa-solid fa-play"></i>';btn.style.background='var(--accent)';}
  const disp=document.getElementById('tt-display');if(disp)disp.style.color='var(--accent2)';
  const st=document.getElementById('tt-status');if(st)st.textContent='⏸ مؤقت';
}
function ttReset(){
  if((_tt.running||_tt.elapsed>0)&&!confirm('إعادة تعيين المؤقت؟'))return;
  clearInterval(_tt.interval);_tt={running:false,elapsed:0,startedAt:null,interval:null};
  const disp=document.getElementById('tt-display');if(disp){disp.textContent='00:00:00';disp.style.color='';}
  const btn=document.getElementById('tt-btn-main');if(btn){btn.innerHTML='<i class="fa-solid fa-play"></i>';btn.style.background='var(--accent)';}
  const earn=document.getElementById('tt-live-earn');if(earn)earn.textContent='';
  const st=document.getElementById('tt-status');if(st)st.innerHTML='اضغط <i class="fa-solid fa-play"></i> لبدء التسجيل';
}
function ttStop(){
  const task=document.getElementById('tt-task-input')?.value?.trim();
  const client=document.getElementById('tt-client-input')?.value?.trim();
  // Capture all elapsed including running time
  if(_tt.running && _tt.startedAt){
    _tt.elapsed += Date.now() - _tt.startedAt;
    _tt.startedAt = null;
    _tt.running = false;
    clearInterval(_tt.interval);
  }
  const totalMs = _tt.elapsed;
  if(totalMs<3000){toast('المدة قصيرة جداً');return;}
  if(!task){toast('أدخل اسم المهمة');return;}
  const entry={
    id:Date.now(),task_title:task,client_name:client||'',
    started_at:new Date(Date.now()-totalMs).toISOString(),
    ended_at:new Date().toISOString(),
    duration_seconds:Math.floor(totalMs/1000),hourly_rate:_ttRate,note:''
  };
  const arr=ttEntries();arr.unshift(entry);ttSaveE(arr);
  // Link time to task if matched
  const tid=window._ttLinkedTaskId;
  const linkedTask=tid?S.tasks.find(t=>t.id===tid):S.tasks.find(t=>(t.title||'').toLowerCase()===task.toLowerCase()&&!t.done);
  if(linkedTask){
    if(!linkedTask.timeLogs)linkedTask.timeLogs=[];
    linkedTask.timeLogs.push({date:new Date().toISOString().split('T')[0],seconds:Math.floor(totalMs/1000)});
    lsSave();cloudSave(S);
  }
  window._ttLinkedTaskId=null;
  // Hard reset without confirm
  clearInterval(_tt.interval);
  _tt={running:false,elapsed:0,startedAt:null,interval:null};
  const disp=document.getElementById('tt-display');if(disp){disp.textContent='00:00:00';disp.style.color='';}
  const btn=document.getElementById('tt-btn-main');if(btn){btn.innerHTML='<i class="fa-solid fa-play"></i>';btn.style.background='var(--accent)';}
  const earn=document.getElementById('tt-live-earn');if(earn)earn.textContent='';
  const st=document.getElementById('tt-status');if(st)st.innerHTML='اضغط <i class="fa-solid fa-play"></i> لبدء التسجيل';
  const ti=document.getElementById('tt-task-input');if(ti)ti.value='';
  const ci=document.getElementById('tt-client-input');if(ci)ci.value='';
  renderTimeTracker();
  toast('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم حفظ '+ttFmt(entry.duration_seconds,1));
}
function ttTick(){
  const total=_tt.elapsed+(_tt.startedAt?Date.now()-_tt.startedAt:0);
  const secs=Math.floor(total/1000);
  const disp=document.getElementById('tt-display');if(disp)disp.textContent=ttFmt(secs);
  const earn=document.getElementById('tt-live-earn');
  if(earn){const e=(secs/3600)*_ttRate;earn.innerHTML=e>0?'<i class="fa-solid fa-coins"></i> '+e.toFixed(2)+' '+ttSym():'';}
  ttUpdateStats();
}

// Filter & Render
function ttSetFilter(f,el){
  _ttFilter=f;
  document.querySelectorAll('.tt-filter').forEach(b=>b.classList.remove('active'));
  if(el)el.classList.add('active');ttRenderEntries();
}
function ttGetFiltered(){
  const now=new Date();
  const td=new Date(now);td.setHours(0,0,0,0);
  const wk=new Date(now);wk.setDate(now.getDate()-7);
  const mo=new Date(now.getFullYear(),now.getMonth(),1);
  return ttEntries().filter(e=>{
    const d=new Date(e.started_at);
    if(_ttFilter==='today')return d>=td;
    if(_ttFilter==='week')return d>=wk;
    if(_ttFilter==='month')return d>=mo;
    return true;
  });
}
const TTC=['#7c6ff7','#4fd1a5','#f7c948','#f76f7c','#64b5f6','#a78bfa','#34d399','#fb923c'];
function ttHash(s){let h=0;for(let i=0;i<(s||'').length;i++)h=((h<<5)-h)+s.charCodeAt(i);return Math.abs(h);}

function ttRenderEntries(){
  const el=document.getElementById('tt-entries-list');if(!el)return;
  const entries=ttGetFiltered();
  if(!entries.length){el.innerHTML='<div class="empty"><div class="empty-icon"><i class="fa-solid fa-stopwatch"></i></div>لا إدخالات</div>';return;}
  const groups={};
  entries.forEach(e=>{
    const d=new Date(e.started_at).toLocaleDateString('ar-EG',{weekday:'short',month:'short',day:'numeric'});
    if(!groups[d])groups[d]=[];groups[d].push(e);
  });
  let html='';
  Object.entries(groups).forEach(([date,items])=>{
    const dayS=items.reduce((s,e)=>s+(e.duration_seconds||0),0);
    html+=`<div style="font-size:11px;font-weight:700;color:var(--text3);padding:10px 0 5px;display:flex;justify-content:space-between">
      <span>${date}</span><span style="color:var(--accent3)">${ttFmt(dayS,1)} · ${((dayS/3600)*_ttRate).toFixed(0)} ${ttSym()}</span></div>`;
    items.forEach(e=>{
      const col=TTC[ttHash(e.client_name||e.task_title)%TTC.length];
      const earn=((e.duration_seconds||0)/3600*_ttRate).toFixed(2);
      const sT=new Date(e.started_at).toLocaleTimeString('ar-EG',{hour:'2-digit',minute:'2-digit'});
      const eT=e.ended_at?new Date(e.ended_at).toLocaleTimeString('ar-EG',{hour:'2-digit',minute:'2-digit'}):'...';
      html+=`<div style="display:flex;align-items:center;gap:10px;padding:9px 10px;background:var(--surface2);border-radius:8px;margin-bottom:5px;border:1px solid var(--border)">
        <div style="width:8px;height:8px;border-radius:50%;background:${col};flex-shrink:0"></div>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${e.task_title||'—'}</div>
          <div style="font-size:11px;color:var(--text3)">${e.client_name?'<i class="fa-solid fa-user"></i> '+e.client_name+' · ':''}${sT} → ${eT}</div>
        </div>
        <div style="text-align:left;flex-shrink:0">
          <div style="font-family:var(--mono);font-size:13px;font-weight:700;color:var(--accent)">${ttFmt(e.duration_seconds||0)}</div>
          <div style="font-size:10px;color:var(--accent3)">${earn} ${ttSym()}</div>
        </div>
        <div style="display:flex;gap:3px;flex-shrink:0">
          <button class="btn btn-ghost btn-sm" onclick="openManualTimeEntry(${e.id})"><i class="fa-solid fa-pen"></i></button>
          <button class="btn btn-danger btn-sm" onclick="ttDeleteEntry(${e.id})"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>`;
    });
  });
  el.innerHTML=html;
}
function ttRenderBreakdown(){
  const el=document.getElementById('tt-client-breakdown');if(!el)return;
  const map={};
  ttEntries().forEach(e=>{const k=e.client_name||'بدون عميل';if(!map[k])map[k]=0;map[k]+=(e.duration_seconds||0);});
  const sorted=Object.entries(map).sort((a,b)=>b[1]-a[1]);
  if(!sorted.length){el.innerHTML='<div class="empty" style="padding:12px 0"><div class="empty-icon" style="font-size:22px"><i class="fa-solid fa-envelope-open"></i></div>لا بيانات</div>';return;}
  const maxS=sorted[0][1];
  el.innerHTML=sorted.slice(0,7).map(([name,secs],i)=>{
    const col=TTC[i%TTC.length];
    const earn=((secs/3600)*_ttRate).toFixed(0);
    const pct=Math.round((secs/maxS)*100);
    return `<div style="margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">
        <span style="font-weight:700;display:flex;align-items:center;gap:5px">
          <span style="width:8px;height:8px;border-radius:50%;background:${col};display:inline-block"></span>${name}
        </span>
        <span style="font-family:var(--mono)">
          <span style="color:var(--accent)">${ttFmt(secs,1)}</span>
          <span style="color:var(--accent3);font-size:11px"> ${earn}${ttSym()}</span>
        </span>
      </div>
      <div style="height:5px;background:var(--surface3);border-radius:3px">
        <div style="height:100%;width:${pct}%;background:${col};border-radius:3px;transition:.4s"></div>
      </div>
    </div>`;
  }).join('');
}
function ttRenderCompare(){
  const el=document.getElementById('tt-compare');if(!el)return;
  const map={};
  ttEntries().forEach(e=>{
    if(!map[e.task_title])map[e.task_title]={actual:0,estimated:e.estimated_value||0};
    map[e.task_title].actual+=(e.duration_seconds||0);
    if(e.estimated_value)map[e.task_title].estimated=e.estimated_value;
  });
  (S.tasks||[]).forEach(t=>{
    if(t.value>0){if(!map[t.title])map[t.title]={actual:0,estimated:0};map[t.title].estimated=map[t.title].estimated||t.value;}
  });
  const items=Object.entries(map).filter(([,v])=>v.estimated>0||v.actual>0);
  if(!items.length){el.innerHTML='<div class="empty" style="padding:12px 0"><div class="empty-icon" style="font-size:22px"><i class="fa-solid fa-chart-bar"></i></div>سجّل وقتاً لترى المقارنة</div>';return;}
  const maxVal=Math.max(1,...items.map(([,v])=>Math.max(v.estimated,(v.actual/3600)*_ttRate)));
  el.innerHTML=items.slice(0,6).map(([name,v])=>{
    const aVal=Math.round((v.actual/3600)*_ttRate);
    const ePct=Math.round((v.estimated/maxVal)*100);
    const aPct=Math.round((aVal/maxVal)*100);
    const diff=v.estimated-aVal;
    const dc=diff>=0?'var(--accent3)':'var(--accent4)';
    return `<div style="margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid var(--border)">
      <div style="font-size:12px;font-weight:700;margin-bottom:5px;display:flex;justify-content:space-between">
        <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:65%">${name}</span>
        <span style="font-family:var(--mono);font-size:11px;color:${dc}">${diff>=0?'+':''}${diff.toFixed(0)} ${ttSym()}</span>
      </div>
      <div style="display:flex;align-items:center;gap:4px;margin-bottom:3px">
        <span style="font-size:9px;color:var(--accent2);width:36px">مقدّر</span>
        <div style="flex:1;height:5px;background:var(--surface3);border-radius:3px"><div style="height:100%;width:${ePct}%;background:var(--accent2);border-radius:3px"></div></div>
        <span style="font-family:var(--mono);font-size:10px;width:42px;text-align:left">${v.estimated.toFixed(0)}</span>
      </div>
      <div style="display:flex;align-items:center;gap:4px">
        <span style="font-size:9px;color:var(--accent3);width:36px">فعلي</span>
        <div style="flex:1;height:5px;background:var(--surface3);border-radius:3px"><div style="height:100%;width:${aPct}%;background:var(--accent3);border-radius:3px"></div></div>
        <span style="font-family:var(--mono);font-size:10px;width:42px;text-align:left;color:${dc}">${aVal}</span>
      </div>
    </div>`;
  }).join('');
}

// Manual entry
function openManualTimeEntry(id){
  const isEdit=!!id;
  document.getElementById('tt-entry-title').innerHTML=isEdit?'<i class="fa-solid fa-pen"></i> تعديل الإدخال':'+ إدخال وقت يدوي';
  document.getElementById('tte-id').value=id||'';
  const ttToLocal=d=>{const p=n=>String(n).padStart(2,'0');return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())+'T'+p(d.getHours())+':'+p(d.getMinutes());};
  if(isEdit){
    const e=ttEntries().find(x=>x.id===id);if(!e)return;
    document.getElementById('tte-task').value=e.task_title||'';
    document.getElementById('tte-client').value=e.client_name||'';
    document.getElementById('tte-note').value=e.note||'';
    document.getElementById('tte-estimated').value=e.estimated_value||'';
    document.getElementById('tte-duration').value='';
    document.getElementById('tte-start').value=ttToLocal(new Date(e.started_at));
    document.getElementById('tte-end').value=e.ended_at?ttToLocal(new Date(e.ended_at)):'';
  }else{
    ['tte-task','tte-client','tte-note','tte-duration','tte-estimated'].forEach(fid=>{const el=document.getElementById(fid);if(el)el.value='';});
    const now=new Date();
    document.getElementById('tte-end').value=ttToLocal(now);
    document.getElementById('tte-start').value=ttToLocal(new Date(now-3600000));
  }
  openM('modal-tt-entry');
}
function ttSaveEntry(){
  const task=document.getElementById('tte-task').value.trim();
  if(!task){toast('أدخل اسم المهمة');return;}
  const client=document.getElementById('tte-client').value.trim();
  const dur=+document.getElementById('tte-duration').value;
  const start=document.getElementById('tte-start').value;
  const end=document.getElementById('tte-end').value;
  const est=+document.getElementById('tte-estimated').value||null;
  const note=document.getElementById('tte-note').value;
  const eid=document.getElementById('tte-id').value;
  let secs=dur?dur*60:0;
  const startedAt=start?new Date(start).toISOString():new Date().toISOString();
  const endedAt=end?new Date(end).toISOString():new Date().toISOString();
  if(!secs&&start&&end)secs=Math.floor((new Date(end)-new Date(start))/1000);
  if(secs<=0){toast('المدة يجب أن تكون موجبة');return;}
  const arr=ttEntries();
  if(eid){const i=arr.findIndex(x=>x.id==eid);if(i>-1)arr[i]={...arr[i],task_title:task,client_name:client,started_at:startedAt,ended_at:endedAt,duration_seconds:secs,estimated_value:est,note};}
  else arr.unshift({id:Date.now(),task_title:task,client_name:client,started_at:startedAt,ended_at:endedAt,duration_seconds:secs,hourly_rate:_ttRate,estimated_value:est,note});
  ttSaveE(arr);closeM('modal-tt-entry');renderTimeTracker();toast('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم الحفظ');
}
function ttDeleteEntry(id){if(!confirm('حذف هذا الإدخال؟'))return;ttSaveE(ttEntries().filter(e=>e.id!==id));renderTimeTracker();toast('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم الحذف');}
function ttExportCSV(){
  const entries=ttGetFiltered();
  const rows=[['المهمة','العميل','البدء','الانتهاء','المدة(دق)','الأرباح','ملاحظة']];
  entries.forEach(e=>{const earn=((e.duration_seconds||0)/3600*_ttRate).toFixed(2);rows.push([e.task_title,e.client_name,e.started_at,e.ended_at,Math.floor((e.duration_seconds||0)/60),earn,e.note||'']);});
  const csv=rows.map(r=>r.map(v=>`"${String(v||'').replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=Object.assign(document.createElement('a'),{href:url,download:'time-entries.csv'});
  document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);
  toast('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تصدير '+entries.length+' إدخال');
}
function openRateSettings(){
  const ri=document.getElementById('rs-rate');if(ri)ri.value=_ttRate;
  const ci=document.getElementById('rs-currency');if(ci)ci.value=_ttCur;
  openM('modal-rate-settings');
}
function saveRateSettings(){
  _ttRate=+document.getElementById('rs-rate')?.value||150;
  _ttCur=document.getElementById('rs-currency')?.value||'EGP';
  localStorage.setItem('tt_rate',_ttRate);localStorage.setItem('tt_currency',_ttCur);
  closeM('modal-rate-settings');renderTimeTracker();toast('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> معدل الساعة: '+_ttRate+' '+ttSym());
}
function ttQuickRate(r){_ttRate=r;localStorage.setItem('tt_rate',r);renderTimeTracker();toast('<i class="fa-solid fa-bolt"></i> معدل: '+r+' '+ttSym());}

// ╔══════════════════════════════════════════════════════════════════╗
// ║  DIGITAL CONTRACTS                                               ║
// ╚══════════════════════════════════════════════════════════════════╝
// [contract vars moved early]

const CT_TEMPLATES={
  design:`هذا العقد مبرم بين الطرفين لتقديم خدمات التصميم الجرافيكي.

1. نطاق العمل:
- تصميم هوية بصرية كاملة (شعار، ألوان، خطوط، قوالب)
- تسليم الملفات بصيغ AI, PDF, PNG

2. المستحقات المالية:
- 50% عند البدء · 50% عند التسليم النهائي

3. التعديلات:
- 3 تعديلات مجانية · كل تعديل إضافي بسعر يُتفق عليه

4. حقوق الملكية:
- تنتقل للعميل بعد سداد كامل المبلغ

5. السرية:
- يلتزم الطرفان بعدم الإفصاح عن تفاصيل هذا العقد`,
  social:`خدمات إدارة منصات التواصل الاجتماعي:

1. الخدمات: إنشاء وجدولة المحتوى، تصميم قوالب، الرد على التعليقات
2. مدة العقد: شهري قابل للتجديد (إشعار 15 يوم للإنهاء)
3. الالتزامات: يلتزم الطرف الثاني بتزويد المواد المطلوبة في الوقت المناسب`,
  video:`خدمات مونتاج وإخراج الفيديو:

1. نطاق العمل: مونتاج وإخراج بمواصفات متفق عليها
2. تشمل: قص، تلوين، موسيقى مرخصة
3. التعديلات: 2 مجانية فقط
4. التسليم: خلال المدة المحددة بعد استلام المواد`,
  web:`تصميم وبرمجة موقع إلكتروني:

1. نطاق العمل: تصميم الواجهة + برمجة + ربط قاعدة بيانات
2. التسليم: على استضافة العميل أو كود مباشر
3. يشمل: تدريب ساعة + صيانة شهر مجاناً
4. الدفع: 40% موافقة تصميم · 60% عند التسليم`,
  content:`خدمات كتابة المحتوى:

1. كتابة محتوى إبداعي وتسويقي
2. المراجعة اللغوية مشمولة
3. تعديل واحد مجاني لكل قطعة
4. العميل يملك حقوق النشر بعد السداد`
};

function ctContracts(){return S.contracts||[];}
function ctSave(arr){S.contracts=arr;lsSave();cloudSave(S);}

function renderContractsList(){
  const el=document.getElementById('contracts-list-el');if(!el)return;
  const search=(document.getElementById('contracts-search')?.value||'').toLowerCase();
  const contracts=ctContracts().filter(c=>!search||(c.title||'').toLowerCase().includes(search)||(c.client_name||'').toLowerCase().includes(search));
  const cnt=document.getElementById('contracts-count');if(cnt)cnt.textContent=contracts.length+' عقد';
  if(!contracts.length){el.innerHTML='<div class="empty" style="padding:28px 16px"><div class="empty-icon"><i class="fa-solid fa-pen-to-square"></i></div>لا عقود بعد</div>';return;}
  const stM={
    draft:{l:'مسودة',c:'var(--text3)',bg:'rgba(90,90,112,.25)'},
    sent:{l:'أُرسل ⏳',c:'#64b5f6',bg:'rgba(100,181,246,.15)'},
    signed:{l:'<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> موقّع',c:'var(--accent3)',bg:'rgba(79,209,165,.15)'},
    rejected:{l:'مرفوض',c:'var(--accent4)',bg:'rgba(247,111,124,.15)'}
  };
  el.innerHTML=contracts.map(c=>{
    const st=stM[c.status]||stM.draft;
    const active=_activeContractId===c.id;
    return `<div style="padding:13px 16px;border-bottom:1px solid var(--border);cursor:pointer;transition:.15s;${active?'background:rgba(124,111,247,.08);border-right:3px solid var(--accent)':''}"
      onclick="showContractDetail('${c.id}')"
      onmouseenter="if('${c.id}'!=='${_activeContractId||''}')this.style.background='rgba(255,255,255,.03)'"
      onmouseleave="if('${c.id}'!=='${_activeContractId||''}')this.style.background=''">
      <div style="font-size:13px;font-weight:700">${c.title}</div>
      <div style="font-size:11px;color:var(--text3);margin-top:2px"><i class="fa-solid fa-user"></i> ${c.client_name||'—'} ${c.value?'· '+Number(c.value).toLocaleString()+' '+_getCurrency():''}</div>
      <span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:10px;background:${st.bg};color:${st.c};margin-top:4px;display:inline-block">${st.l}</span>
    </div>`;
  }).join('');
}

function showContractDetail(id){
  _activeContractId=id;
  const c=ctContracts().find(x=>x.id===id);if(!c)return;
  renderContractsList();
  const da=document.getElementById('contract-detail-area');if(!da)return;
  const stM={draft:'مسودة',sent:'أُرسل ⏳',signed:'<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> موقّع',rejected:'مرفوض'};
  const stC={draft:'var(--text3)',sent:'#64b5f6',signed:'var(--accent3)',rejected:'var(--accent4)'};
  da.innerHTML=`
    <div class="card" style="padding:0;overflow:hidden">
      <div style="padding:16px 22px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
        <div>
          <div style="font-size:17px;font-weight:900">${c.title}</div>
          <div style="font-size:12px;color:var(--text3);margin-top:2px"><i class="fa-solid fa-user"></i> ${c.client_name||'—'} ${c.value?'· '+Number(c.value).toLocaleString()+' '+_getCurrency():''}</div>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">
          <span style="font-size:11px;font-weight:700;padding:4px 12px;border-radius:20px;background:rgba(90,90,112,.2);color:${stC[c.status]||'var(--text3)'}">
            ${stM[c.status]||'مسودة'}
          </span>
          ${c.status!=='signed'?`<button class="btn btn-ghost btn-sm" onclick="openContractModal('${c.id}')"><i class="fa-solid fa-pen"></i> تعديل</button>`:''}
          ${c.status!=='signed'?`<button class="btn btn-primary btn-sm" onclick="ctShare('${c.id}')"><i class="fa-solid fa-link"></i> مشاركة</button>`:''}
          ${c.status!=='signed'?`<button class="btn btn-ghost btn-sm" onclick="ctSignSelf('${c.id}')"><i class="fa-solid fa-pen-nib"></i> توقيعي</button>`:''}
          <button class="btn btn-ghost btn-sm" onclick="ctPrint('${c.id}')"><i class="fa-solid fa-print"></i></button>
          <button class="btn btn-danger btn-sm" onclick="ctDelete('${c.id}')"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
      <div style="padding:24px 28px;overflow-y:auto;max-height:calc(100vh - 220px)" id="ct-print-area">
        ${buildContractHTML(c)}
      </div>
    </div>`;
}

function buildContractHTML(c){
  const created=c.created_at?new Date(c.created_at).toLocaleDateString('ar-EG'):'—';
  const signed=c.signed_at?new Date(c.signed_at).toLocaleDateString('ar-EG'):'';
  const me=S.settings?.name||'الفريلانسر';
  return `<div style="text-align:center;padding-bottom:20px;margin-bottom:20px;border-bottom:2px solid var(--border)">
      <div style="font-size:30px;margin-bottom:6px"><i class="fa-solid fa-pen-to-square"></i></div>
      <div style="font-size:20px;font-weight:900;color:var(--accent)">عقد عمل رقمي</div>
      <div style="font-size:12px;color:var(--text3);margin-top:3px">تاريخ الإنشاء: ${created}</div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;background:var(--surface2);border-radius:10px;padding:14px;margin-bottom:20px">
      <div><div style="font-size:10px;font-weight:700;color:var(--text3);margin-bottom:3px">مقدم الخدمة</div><div style="font-size:13px;font-weight:700">${me}</div></div>
      <div><div style="font-size:10px;font-weight:700;color:var(--text3);margin-bottom:3px">العميل</div><div style="font-size:13px;font-weight:700">${c.client_name||'—'}</div></div>
      <div><div style="font-size:10px;font-weight:700;color:var(--text3);margin-bottom:3px">قيمة العقد</div><div style="font-size:13px;font-weight:700;color:var(--accent3)">${c.value?Number(c.value).toLocaleString()+' '+_getCurrency():'غير محدد'}</div></div>
      <div><div style="font-size:10px;font-weight:700;color:var(--text3);margin-bottom:3px">مدة التنفيذ</div><div style="font-size:13px;font-weight:700">${c.start_date||'—'} → ${c.end_date||'—'}</div></div>
    </div>
    <div style="font-size:14px;line-height:1.9;color:var(--text2);margin-bottom:24px;white-space:pre-wrap">${c.content||''}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:24px;padding-top:20px;border-top:2px solid var(--border)">
      <div style="text-align:center">
        <div style="font-size:10px;font-weight:700;color:var(--text3);margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px">توقيع مقدم الخدمة</div>
        <div style="height:80px;border:${c.freelancer_signature?'1.5px solid var(--accent3)':'2px dashed var(--border)'};border-radius:8px;display:flex;align-items:center;justify-content:center;background:${c.freelancer_signature?'rgba(79,209,165,.04)':'var(--surface2)'}">
          ${c.freelancer_signature?`<img src="${c.freelancer_signature}" style="max-width:100%;max-height:76px;object-fit:contain" onerror="this.style.display='none'">`:`<span style="color:var(--text3);font-size:12px">لم يوقّع بعد</span>`}
        </div>
        <div style="font-size:12px;font-weight:700;margin-top:6px">${me}</div>
      </div>
      <div style="text-align:center">
        <div style="font-size:10px;font-weight:700;color:var(--text3);margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px">توقيع العميل</div>
        <div style="height:80px;border:${c.client_signature?'1.5px solid var(--accent3)':'2px dashed var(--border)'};border-radius:8px;display:flex;align-items:center;justify-content:center;background:${c.client_signature?'rgba(79,209,165,.04)':'var(--surface2)'}">
          ${c.client_signature?`<img src="${c.client_signature}" style="max-width:100%;max-height:76px;object-fit:contain" onerror="this.style.display='none'">`:`<span style="color:var(--text3);font-size:12px">في انتظار التوقيع</span>`}
        </div>
        <div style="font-size:12px;font-weight:700;margin-top:6px">${c.client_name||'العميل'}</div>
        ${c.client_signature&&signed?`<div style="font-size:10px;color:var(--accent3)">وقّع ${signed}</div>`:''}
      </div>
    </div>`;
}

function openContractModal(id,prefillClient){
  const isEdit=!!id;
  document.getElementById('contract-modal-title').innerHTML=isEdit?'<i class="fa-solid fa-pen"></i> تعديل العقد':'<i class="fa-solid fa-pen-to-square"></i> عقد جديد';
  document.getElementById('ct-id').value=id||'';
  const ctDl=document.getElementById('ct-clients-dl');
  if(ctDl)ctDl.innerHTML=(S.clients||[]).map(c=>`<option value="${c.name}">`).join('');
  if(isEdit){
    const c=ctContracts().find(x=>x.id===id);if(!c)return;
    document.getElementById('ct-title').value=c.title||'';
    document.getElementById('ct-client').value=c.client_name||'';
    document.getElementById('ct-email').value=c.client_email||'';
    document.getElementById('ct-value').value=c.value||'';
    document.getElementById('ct-start').value=c.start_date||'';
    document.getElementById('ct-end').value=c.end_date||'';
    document.getElementById('ct-body').value=c.content||'';
    document.getElementById('ct-notes').value=c.notes||'';
  }else{
    ['ct-title','ct-email','ct-value','ct-notes'].forEach(fid=>{const el=document.getElementById(fid);if(el)el.value='';});
    document.getElementById('ct-client').value=prefillClient||'';
    document.getElementById('ct-body').value=CT_TEMPLATES.design;
    document.getElementById('ct-start').value=today();
    document.getElementById('ct-end').value='';
  }
  openM('modal-contract');
}

function saveContract(){
  const title=document.getElementById('ct-title').value.trim();
  const client=document.getElementById('ct-client').value.trim();
  if(!title){toast('أدخل عنوان العقد');return;}
  const cid=document.getElementById('ct-id').value;
  const record={title,client_name:client,client_email:document.getElementById('ct-email').value.trim(),value:+document.getElementById('ct-value').value||null,start_date:document.getElementById('ct-start').value,end_date:document.getElementById('ct-end').value,content:document.getElementById('ct-body').value,notes:document.getElementById('ct-notes').value,status:'draft'};
  const arr=ctContracts();
  if(cid){const i=arr.findIndex(x=>x.id===cid);if(i>-1)arr[i]={...arr[i],...record};toast('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم تعديل العقد');}
  else{record.id='ct_'+Date.now();record.created_at=new Date().toISOString();record.token='tk_'+Math.random().toString(36).slice(2)+Date.now().toString(36);arr.unshift(record);_activeContractId=record.id;toast('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم إنشاء العقد');}
  ctSave(arr);closeM('modal-contract');renderContractsList();
  if(_activeContractId)showContractDetail(_activeContractId);
}
function editContract(id){openContractModal(id);}
function ctDelete(id){
  if(!confirm('حذف هذا العقد نهائياً؟'))return;
  ctSave(ctContracts().filter(x=>x.id!==id));_activeContractId=null;renderContractsList();
  const da=document.getElementById('contract-detail-area');
  if(da)da.innerHTML='<div class="card" style="display:flex;align-items:center;justify-content:center;min-height:400px"><div class="empty"><div class="empty-icon"><i class="fa-solid fa-file-lines"></i></div>اختر عقداً</div></div>';
  toast('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم الحذف');
}
function applyContractTemplate(type){const tpl=CT_TEMPLATES[type];if(tpl){document.getElementById('ct-body').value=tpl;toast('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم تطبيق القالب');}}

function ctShare(id){
  const c=ctContracts().find(x=>x.id===id);if(!c)return;
  const base=window.location.href.split('?')[0];
  // Generate token if not exists
  if(!c.token){ c.token = 'ct_'+Date.now()+'_'+Math.random().toString(36).slice(2,8); }
  const url=base+'?ctsign='+encodeURIComponent(c.token);
  document.getElementById('ct-share-url').textContent=url;
  // Find client phone for WA
  const clientObj = (S.clients||[]).find(cl=>(cl.name||'').toLowerCase()===(c.client_name||'').toLowerCase());
  const clientPhone = (c.client_phone||clientObj?.phone||'').replace(/\D/g,'');
  const waText = 'مرحباً '+(c.client_name||'')+'،\n\nيرجى مراجعة وتوقيع العقد الخاص بك:\n\n'+url+'\n\nللاستفسار تواصل معنا.';
  const wa = clientPhone
    ? 'https://wa.me/'+clientPhone+'?text='+encodeURIComponent(waText)
    : 'https://wa.me/?text='+encodeURIComponent(waText);
  const mail=`mailto:${c.client_email||clientObj?.email||''}?subject=${encodeURIComponent('عقد: '+c.title)}&body=${encodeURIComponent('يرجى مراجعة وتوقيع العقد:\n'+url)}`;
  document.getElementById('ct-wa-link').href=wa;
  document.getElementById('ct-mail-link').href=mail;
  // Save contract data to localStorage with token key so signing works even without login
  try{ localStorage.setItem('ct_sign_'+c.token, JSON.stringify(c)); }catch(e){}
  // Also save to Supabase if available
  if(typeof supa !== 'undefined' && _supaUserId){
    (async()=>{try{await supa.from('shared_contracts').upsert([{token:c.token,data:JSON.stringify(c),user_id:_supaUserId,updated_at:new Date().toISOString()}]);}catch(e){}})();
  }
  const arr=ctContracts();const i=arr.findIndex(x=>x.id===id);
  if(i>-1){arr[i].token=c.token;if(arr[i].status==='draft'){arr[i].status='sent';}ctSave(arr);renderContractsList();}
  openM('modal-contract-share');
}
function ctCopyLink(){const text=document.getElementById('ct-share-url').textContent;navigator.clipboard.writeText(text).then(()=>toast('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم نسخ الرابط'));}

function ctPrint(id){
  const area=document.getElementById('ct-print-area');if(!area)return;
  const w=window.open('','_blank');
  w.document.write('<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet"><style>body{font-family:Cairo,sans-serif;background:#fff;color:#111;padding:40px;max-width:720px;margin:0 auto}img{max-width:100%;max-height:80px;object-fit:contain}@media print{@page{size:A4;margin:2cm}}</style></head><body>'+area.innerHTML+'</body></html>');
  w.document.close();setTimeout(()=>w.print(),500);
}

// Signature for freelancer
let _ctSignId=null;
function ctSignSelf(id){
  _ctSignId=id;
  document.getElementById('sig-name-input').value=S.settings?.name||'';
  openM('modal-signature');setTimeout(initSigCanvas,120);
}
function initSigCanvas(){
  const cv=document.getElementById('sig-canvas');if(!cv)return;
  _sigCanvas=cv;cv.width=cv.offsetWidth||460;cv.height=150;
  _sigCtx=cv.getContext('2d');
  _sigCtx.strokeStyle='#111';_sigCtx.lineWidth=2.5;_sigCtx.lineCap='round';_sigCtx.lineJoin='round';
  const gp=e=>{const r=cv.getBoundingClientRect();const sx=cv.width/r.width,sy=cv.height/r.height;const cx=e.touches?e.touches[0].clientX:e.clientX,cy=e.touches?e.touches[0].clientY:e.clientY;return{x:(cx-r.left)*sx,y:(cy-r.top)*sy};};
  cv.onmousedown=e=>{_sigDrawing=true;const p=gp(e);_sigCtx.beginPath();_sigCtx.moveTo(p.x,p.y);};
  cv.onmousemove=e=>{if(!_sigDrawing)return;const p=gp(e);_sigCtx.lineTo(p.x,p.y);_sigCtx.stroke();};
  cv.onmouseup=cv.onmouseleave=()=>_sigDrawing=false;
  cv.ontouchstart=e=>{e.preventDefault();_sigDrawing=true;const p=gp(e);_sigCtx.beginPath();_sigCtx.moveTo(p.x,p.y);};
  cv.ontouchmove=e=>{e.preventDefault();if(!_sigDrawing)return;const p=gp(e);_sigCtx.lineTo(p.x,p.y);_sigCtx.stroke();};
  cv.ontouchend=()=>_sigDrawing=false;
}
function clearSigCanvas(){if(_sigCtx&&_sigCanvas)_sigCtx.clearRect(0,0,_sigCanvas.width,_sigCanvas.height);}
function isSigEmpty(cv){const ctx=cv.getContext('2d');const d=ctx.getImageData(0,0,cv.width,cv.height).data;return!d.some((v,i)=>i%4!==3&&v<250);}
function submitSignature(){
  if(!_sigCanvas||isSigEmpty(_sigCanvas)){toast('يرجى التوقيع أولاً');return;}
  const name=document.getElementById('sig-name-input').value.trim();
  if(!name){toast('أدخل اسمك');return;}
  const sig=_sigCanvas.toDataURL('image/png');
  const arr=ctContracts();const i=arr.findIndex(x=>x.id===_ctSignId);
  if(i>-1){arr[i].freelancer_signature=sig;arr[i].signed_at=new Date().toISOString();}
  ctSave(arr);closeM('modal-signature');if(_activeContractId)showContractDetail(_activeContractId);toast('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم التوقيع');
}

// Client sign via URL
function checkContractSignUrl(){
  const params=new URLSearchParams(window.location.search);
  const token=params.get('ctsign');if(!token)return;
  // Try S.contracts first (if logged in), then localStorage (works without login)
  let c=(S.contracts||[]).find(x=>x.token===token||String(x.id)===String(token));
  if(!c){
    try{
      const stored=localStorage.getItem('ct_sign_'+token);
      if(stored) c=JSON.parse(stored);
    }catch(e){}
  }
  // Try Supabase as last resort
  if(!c && typeof supa !== 'undefined'){
    supa.from('shared_contracts').select('data').eq('token',token).single().then(res=>{
      if(res.data){ try{ buildClientSignOverlay(JSON.parse(res.data.data),token); }catch(e){ buildClientSignOverlay(null,token); } }
      else buildClientSignOverlay(null,token);
    }).catch(()=>buildClientSignOverlay(null,token));
    return;
  }
  buildClientSignOverlay(c,token);
}
function buildClientSignOverlay(c,token){
  const ov=document.createElement('div');
  ov.style.cssText='position:fixed;inset:0;background:var(--bg);z-index:9999;overflow-y:auto;padding:20px';
  if(!c){
    ov.innerHTML='<div style="text-align:center;padding:80px"><div style="font-size:48px"><i class="fa-solid fa-lock"></i></div><div style="font-size:18px;font-weight:700;margin-top:16px;color:var(--text2)">العقد غير موجود</div></div>';
    document.body.appendChild(ov);return;
  }
  ov.innerHTML=`<div style="max-width:680px;margin:0 auto">
    <div style="text-align:center;margin-bottom:24px">
      <div style="font-size:22px;font-weight:900"><i class="fa-solid fa-pen-to-square"></i> توقيع العقد</div>
      <div style="font-size:13px;color:var(--text2);margin-top:4px">يرجى القراءة قبل التوقيع</div>
    </div>
    ${c.status==='signed'?`<div style="background:rgba(79,209,165,.1);border:1.5px solid var(--accent3);border-radius:12px;padding:20px;text-align:center;margin-bottom:20px"><div style="font-size:36px"><i class="fa-solid fa-square-check" style="color:var(--accent3)"></i></div><div style="font-size:16px;font-weight:700;color:var(--accent3);margin-top:8px">تم توقيع هذا العقد مسبقاً</div></div>`:''}
    <div class="card" style="padding:28px;margin-bottom:20px">${buildContractHTML(c)}</div>
    ${c.status!=='signed'?`<div class="card" style="padding:24px;margin-bottom:20px">
      <div style="font-size:14px;font-weight:800;margin-bottom:12px"><i class="fa-solid fa-pen-nib"></i> توقيعك هنا</div>
      <canvas id="sig-cv-client" style="width:100%;height:140px;background:#fff;border-radius:8px;cursor:crosshair;touch-action:none;border:1.5px solid var(--border);display:block"></canvas>
      <button class="btn btn-ghost btn-sm" style="margin-top:8px;margin-bottom:14px" onclick="clearCSig()">مسح ↺</button>
      <div class="form-group">
        <label class="form-label">اسمك الكامل للتأكيد</label>
        <input class="form-input" id="client-sig-name" placeholder="اسمك كما في الهوية">
      </div>
      <button class="btn btn-primary" style="width:100%;justify-content:center;margin-top:12px" onclick="submitCSig('${c.id}',this)">
        <i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> أوافق وأؤكد توقيعي
      </button>
    </div>`:''}
  </div>`;
  document.body.appendChild(ov);
  if(c.status!=='signed')setTimeout(initCSigCanvas,150);
}
let _cSigCtx=null,_cSigDrw=false;
function initCSigCanvas(){
  const cv=document.getElementById('sig-cv-client');if(!cv)return;
  cv.width=cv.offsetWidth||600;cv.height=140;
  _cSigCtx=cv.getContext('2d');_cSigCtx.strokeStyle='#111';_cSigCtx.lineWidth=2.5;_cSigCtx.lineCap='round';_cSigCtx.lineJoin='round';
  const gp=e=>{const r=cv.getBoundingClientRect();const sx=cv.width/r.width,sy=cv.height/r.height;const cx=e.touches?e.touches[0].clientX:e.clientX,cy=e.touches?e.touches[0].clientY:e.clientY;return{x:(cx-r.left)*sx,y:(cy-r.top)*sy};};
  cv.onmousedown=e=>{_cSigDrw=true;const p=gp(e);_cSigCtx.beginPath();_cSigCtx.moveTo(p.x,p.y);};
  cv.onmousemove=e=>{if(!_cSigDrw)return;const p=gp(e);_cSigCtx.lineTo(p.x,p.y);_cSigCtx.stroke();};
  cv.onmouseup=cv.onmouseleave=()=>_cSigDrw=false;
  cv.ontouchstart=e=>{e.preventDefault();_cSigDrw=true;const p=gp(e);_cSigCtx.beginPath();_cSigCtx.moveTo(p.x,p.y);};
  cv.ontouchmove=e=>{e.preventDefault();if(!_cSigDrw)return;const p=gp(e);_cSigCtx.lineTo(p.x,p.y);_cSigCtx.stroke();};
  cv.ontouchend=()=>_cSigDrw=false;
}
function clearCSig(){const cv=document.getElementById('sig-cv-client');if(_cSigCtx&&cv)_cSigCtx.clearRect(0,0,cv.width,cv.height);}
function submitCSig(id,btn){
  const cv=document.getElementById('sig-cv-client');
  const name=document.getElementById('client-sig-name')?.value.trim();
  if(!name){toast('أدخل اسمك');return;}
  if(!cv||isSigEmpty(cv)){toast('يرجى التوقيع أولاً');return;}
  const sig=cv.toDataURL('image/png');
  const arr=ctContracts();const i=arr.findIndex(x=>x.id===id);
  if(i>-1){arr[i].client_signature=sig;arr[i].client_signer_name=name;arr[i].signed_at=new Date().toISOString();arr[i].status='signed';ctSave(arr);}
  const p=btn?.closest('.card');
  if(p)p.innerHTML='<div style="text-align:center;padding:24px"><div style="font-size:48px"><i class="fa-solid fa-square-check" style="color:var(--accent3)"></i></div><div style="font-size:18px;font-weight:900;color:var(--accent3);margin-top:10px">تم التوقيع بنجاح!</div><div style="font-size:13px;color:var(--text2);margin-top:6px">شكراً '+name+'، تم تسجيل توقيعك.</div></div>';
  toast('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم التوقيع!');
}


function copyPortalLink(){
  const el = document.getElementById('portal-url-text');
  if(!el) return;
  const url = el.textContent || el.innerText;
  if(!url || url === '...') return;
  navigator.clipboard.writeText(url).then(()=>{
    if(typeof showMiniNotif === 'function') showMiniNotif('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم نسخ الرابط');
  }).catch(()=>{
    // fallback
    const ta = document.createElement('textarea');
    ta.value = url; document.body.appendChild(ta);
    ta.select(); document.execCommand('copy');
    document.body.removeChild(ta);
    if(typeof showMiniNotif === 'function') showMiniNotif('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم نسخ الرابط');
  });
}

function buildPortalHTML(d){
  var stM={new:{l:'جديد',c:'#5a5a70',bg:'rgba(90,90,112,.2)'},progress:{l:'قيد التنفيذ',c:'#f7c948',bg:'rgba(247,201,72,.15)'},review:{l:'مراجعة',c:'#7c6ff7',bg:'rgba(124,111,247,.15)'},done:{l:'مكتمل \u2705',c:'#4fd1a5',bg:'rgba(79,209,165,.15)'}};
  // Task cards - no nested template literals
  var taskCards=(d.tasks||[]).map(function(t){
    var st=t.done?stM.done:(stM[t.status]||stM.new);
    var stepsT=(t.steps||[]).length, stepsD=(t.steps||[]).filter(function(s){return s.done;}).length;
    var tPct=stepsT?Math.round((stepsD/stepsT)*100):(t.done?100:0);
    var stepsHtml='';
    if(stepsT){
      var rows=(t.steps||[]).map(function(s,i){
        var dn=s.done, cr=!dn&&(t.steps||[]).slice(0,i).every(function(x){return x.done;});
        var cStyle=dn?'background:#4fd1a5;color:#fff':cr?'background:#7c6ff7;color:#fff':'border:2px solid #ddd;color:#aaa';
        var tStyle=dn?'text-decoration:line-through;color:#bbb':cr?'font-weight:700;color:#1a1a2e':'color:#888';
        return '<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid #f5f5f5;font-size:12px">'+
          '<div style="width:20px;height:20px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;'+cStyle+'">'+(dn?'\u2713':cr?'\u25b6':i+1)+'</div>'+
          '<span style="'+tStyle+'">'+s.text+'</span>'+
          '</div>';
      }).join('');
      stepsHtml='<div style="margin-top:10px">'+rows+'</div>';
    }
    return '<div style="background:#fff;border-radius:12px;padding:16px;margin-bottom:12px;box-shadow:0 2px 8px rgba(0,0,0,.06);border-right:4px solid '+st.c+'">'+
      '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:10px">'+
      '<div style="font-size:14px;font-weight:700">'+t.title+'</div>'+
      '<span style="background:'+st.bg+';color:'+st.c+';font-size:10px;font-weight:700;padding:3px 10px;border-radius:20px;white-space:nowrap">'+st.l+'</span>'+
      '</div>'+
      '<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">'+
      '<div style="flex:1;height:6px;background:#eee;border-radius:3px"><div style="height:100%;width:'+tPct+'%;background:linear-gradient(90deg,#7c6ff7,#4fd1a5);border-radius:3px"></div></div>'+
      '<span style="font-size:11px;color:#888;font-weight:700">'+tPct+'%</span></div>'+
      (t.deadline?'<div style="font-size:11px;color:#888">\u23f0 موعد التسليم: '+t.deadline+'</div>':'')+
      stepsHtml+'</div>';
  }).join('');
  // Invoice rows
  var invRows=(d.invoices||[]).map(function(i){
    var paid=i.status==='paid';
    return '<tr><td style="padding:10px 12px;font-family:monospace;font-size:12px">'+(i.num||'\u2014')+'</td>'+
      '<td style="padding:10px 12px;font-size:12px">'+(i.date||'\u2014')+'</td>'+
      '<td style="padding:10px 12px;font-weight:700;color:#4fd1a5">'+(+i.total||0).toLocaleString()+' \u062c</td>'+
      '<td style="padding:10px 12px"><span style="background:'+(paid?'rgba(79,209,165,.15)':'rgba(247,201,72,.15)')+';color:'+(paid?'#2e7d5c':'#b8860b')+';font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px">'+(paid?'\u2705 مدفوعة':'\u23f3 معلقة')+'</span></td></tr>';
  }).join('');
  // Contract rows
  var ctStC={draft:'#888',sent:'#64b5f6',signed:'#4fd1a5',rejected:'#f76f7c'};
  var ctStL={draft:'مسودة',sent:'أُرسل',signed:'\u2705 موقّع',rejected:'مرفوض'};
  var ctRows=(d.contracts||[]).map(function(ct){
    return '<tr><td style="padding:10px 12px;font-weight:600">'+ct.title+'</td>'+
      '<td style="padding:10px 12px">'+(ct.value?Number(ct.value).toLocaleString()+' \u062c':'\u2014')+'</td>'+
      '<td style="padding:10px 12px"><span style="font-size:11px;font-weight:700;color:'+(ctStC[ct.status]||'#888')+'">'+(ctStL[ct.status]||'مسودة')+'</span></td></tr>';
  }).join('');
  var tb=d.totalBilled||0, tp=d.totalPaid||0, tdue=d.totalDue||0;
  var hasCt=(d.contracts||[]).length>0;
  return '<!DOCTYPE html><html dir="rtl" lang="ar"><head>'+
    '<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
    '<title>\u0628\u0648\u0627\u0628\u0629 \u0627\u0644\u0639\u0645\u064a\u0644 \u2014 '+d.client+'</title>'+
    '<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap" rel="stylesheet">'+
    '<style>'+
    '*{margin:0;padding:0;box-sizing:border-box}'+
    'body{font-family:Cairo,sans-serif;background:#f0f2f8;color:#1a1a2e;direction:rtl;min-height:100vh}'+
    '.hdr{background:linear-gradient(135deg,#7c6ff7,#4fd1a5);padding:32px 20px;color:#fff;text-align:center}'+
    '.hdr h1{font-size:24px;font-weight:900;margin-bottom:4px}'+
    '.tabs{display:flex;background:#fff;border-bottom:1px solid #e8e8f0;overflow-x:auto;position:sticky;top:0;z-index:99;box-shadow:0 2px 10px rgba(0,0,0,.08)}'+
    '.tab{padding:13px 18px;font-size:13px;font-weight:700;color:#888;cursor:pointer;border-bottom:3px solid transparent;white-space:nowrap;transition:color .2s,border-color .2s}'+
    '.tab.active{color:#7c6ff7;border-bottom-color:#7c6ff7}'+
    '.tab-panel{display:none}.tab-panel.active{display:block}'+
    '.con{max-width:860px;margin:0 auto;padding:20px 14px}'+
    '.card{background:#fff;border-radius:14px;padding:20px;margin-bottom:16px;box-shadow:0 2px 12px rgba(0,0,0,.06)}'+
    '.ct{font-size:14px;font-weight:800;margin-bottom:14px}'+
    '.fg{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}'+
    '.fc{border-radius:12px;padding:14px;text-align:center}'+
    '.fv{font-size:22px;font-weight:900;line-height:1.2}'+
    '.fl{font-size:11px;font-weight:600;margin-top:4px}'+
    '.sg{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}'+
    '.sc{background:#f8f9ff;border-radius:10px;padding:14px;text-align:center}'+
    '.sv{font-size:24px;font-weight:900}.sl{font-size:11px;color:#888;margin-top:3px}'+
    '.pb{height:10px;background:#e8e8f0;border-radius:5px;overflow:hidden;margin:10px 0}'+
    '.pf{height:100%;background:linear-gradient(90deg,#7c6ff7,#4fd1a5);border-radius:5px}'+
    'table{width:100%;border-collapse:collapse}'+
    'th{background:#f5f6fb;font-size:11px;font-weight:700;color:#666;padding:9px 12px;text-align:right}'+
    'td{border-bottom:1px solid #f0f0f0;font-size:13px}tr:last-child td{border:none}'+
    '.ftr{text-align:center;padding:20px;font-size:11px;color:#aaa;border-top:1px solid #e8e8f0}'+
    '.btn-p{background:#7c6ff7;color:#fff;border:none;border-radius:8px;padding:9px 18px;font-family:Cairo,sans-serif;font-size:13px;font-weight:700;cursor:pointer}'+
    '@media(max-width:540px){.fg,.sg{grid-template-columns:1fr 1fr}.hdr{padding:24px 14px}}'+
    '@media print{.tabs,.btn-p{display:none!important}.tab-panel{display:block!important}}'+
    '</style></head><body>'+
    '<div class="hdr">'+
    '<h1>\ud83c\udfe0 بوابة العميل الشاملة</h1>'+
    '<div style="font-size:13px;opacity:.9">'+d.studio+'</div>'+
    '<div style="margin-top:10px;font-size:20px;font-weight:900">'+d.client+'</div>'+
    ((d.email||d.phone)?'<div style="margin-top:5px;font-size:11px;opacity:.8">'+(d.email?'\u2709 '+d.email:'')+(d.email&&d.phone?' · ':'')+(d.phone?'\ud83d\udcf1 '+d.phone:'')+'</div>':'')+
    '</div>'+
    '<div class="tabs">'+
    '<div class="tab active" onclick="sw(\'ov\')"><i class="fa-solid fa-chart-bar"></i> نظرة عامة</div>'+
    '<div class="tab" onclick="sw(\'tk\')"><i class="fa-solid fa-star-of-life"></i> المشاريع ('+d.total+')</div>'+
    '<div class="tab" onclick="sw(\'fn\')"><i class="fa-solid fa-coins"></i> الحساب المالي</div>'+
    (hasCt?'<div class="tab" onclick="sw(\'ct\')"><i class="fa-solid fa-pen-to-square"></i> العقود</div>':'')+
    '</div>'+
    // OVERVIEW
    '<div class="tab-panel active" id="tab-ov"><div class="con">'+
    '<div class="card"><div class="ct"><i class="fa-solid fa-chart-bar"></i> ملخص العمل</div>'+
    '<div class="sg">'+
    '<div class="sc"><div class="sv" style="color:#7c6ff7">'+d.total+'</div><div class="sl">إجمالي المهام</div></div>'+
    '<div class="sc"><div class="sv" style="color:#4fd1a5">'+d.done+'</div><div class="sl">مكتملة</div></div>'+
    '<div class="sc"><div class="sv" style="color:#f7c948">'+d.pct+'%</div><div class="sl">الإنجاز</div></div>'+
    '</div><div style="margin-top:14px"><div style="font-size:12px;color:#888;margin-bottom:5px">نسبة الإنجاز الكلية</div>'+
    '<div class="pb"><div class="pf" id="main-pb" style="width:0%"></div></div></div></div>'+
    '<div class="card"><div class="ct"><i class="fa-solid fa-coins"></i> ملخص مالي</div>'+
    '<div class="fg">'+
    '<div class="fc" style="background:rgba(124,111,247,.1)"><div class="fv" style="color:#7c6ff7">'+tb.toLocaleString()+'</div><div class="fl" style="color:#7c6ff7">إجمالي الفواتير</div></div>'+
    '<div class="fc" style="background:rgba(79,209,165,.1)"><div class="fv" style="color:#2e9e7a">'+tp.toLocaleString()+'</div><div class="fl" style="color:#2e9e7a">\u2705 المدفوع</div></div>'+
    '<div class="fc" style="background:'+(tdue>0?'rgba(247,111,124,.1)':'rgba(79,209,165,.08)')+'"><div class="fv" style="color:'+(tdue>0?'#f76f7c':'#4fd1a5')+'">'+tdue.toLocaleString()+'</div><div class="fl" style="color:'+(tdue>0?'#f76f7c':'#4fd1a5')+'">'+(tdue>0?'\u23f3 المتبقي':'\u2705 لا متأخرات')+'</div></div>'+
    '</div></div>'+
    '<div style="text-align:left"><button class="btn-p" onclick="window.print()">\ud83d\udda8 طباعة</button></div>'+
    '</div></div>'+
    // TASKS
    '<div class="tab-panel" id="tab-tk"><div class="con">'+
    (taskCards||'<div class="card" style="text-align:center;color:#aaa;padding:40px">لا توجد مهام</div>')+
    '</div></div>'+
    // FINANCE
    '<div class="tab-panel" id="tab-fn"><div class="con">'+
    '<div class="card"><div class="ct"><i class="fa-solid fa-coins"></i> كشف الحساب المالي</div>'+
    '<div class="fg" style="margin-bottom:16px">'+
    '<div class="fc" style="background:rgba(124,111,247,.1)"><div class="fv" style="color:#7c6ff7">'+tb.toLocaleString()+' \u062c</div><div class="fl" style="color:#7c6ff7">إجمالي الفواتير</div></div>'+
    '<div class="fc" style="background:rgba(79,209,165,.1)"><div class="fv" style="color:#2e9e7a">'+tp.toLocaleString()+' \u062c</div><div class="fl" style="color:#2e9e7a">\u2705 المدفوع</div></div>'+
    '<div class="fc" style="background:'+(tdue>0?'rgba(247,111,124,.1)':'rgba(79,209,165,.08)')+'"><div class="fv" style="color:'+(tdue>0?'#f76f7c':'#4fd1a5')+'">'+tdue.toLocaleString()+' \u062c</div><div class="fl" style="color:'+(tdue>0?'#f76f7c':'#4fd1a5')+'">'+(tdue>0?'\u23f3 المتبقي':'\u2705 لا متأخرات')+'</div></div>'+
    '</div>'+
    ((d.invoices||[]).length?'<table><thead><tr><th>رقم الفاتورة</th><th>التاريخ</th><th>المبلغ</th><th>الحالة</th></tr></thead><tbody>'+invRows+'</tbody></table>':'<div style="text-align:center;color:#aaa;padding:20px">لا توجد فواتير</div>')+
    '</div></div></div>'+
    // CONTRACTS
    (hasCt?'<div class="tab-panel" id="tab-ct"><div class="con"><div class="card"><div class="ct"><i class="fa-solid fa-pen-to-square"></i> العقود</div><table><thead><tr><th>العقد</th><th>القيمة</th><th>الحالة</th></tr></thead><tbody>'+ctRows+'</tbody></table></div></div></div>':'')+
    '<div class="ftr">'+d.studio+' · آخر تحديث: '+d.generated+'</div>'+
    '<scr'+'ipt>'+
    'function sw(n){'+
    'document.querySelectorAll(".tab").forEach(function(t,i){var ns=["ov","tk","fn","ct"];t.classList.toggle("active",ns[i]===n);});'+
    'document.querySelectorAll(".tab-panel").forEach(function(p){p.classList.toggle("active",p.id==="tab-"+n);});'+
    '}'+
    'window.onload=function(){var pb=document.getElementById("main-pb");if(pb)pb.style.width="'+d.pct+'%";};'+
    '<\/script>'+
    '</body></html>';
}

// Check sign URL on page load
window.addEventListener('load',()=>setTimeout(checkContractSignUrl,800));

