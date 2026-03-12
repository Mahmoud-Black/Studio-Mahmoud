// ══════════════════════════════════════════════════════
// ── REVIEWS PAGE ──
// ══════════════════════════════════════════════════════
function deleteReview(reviewId) {
  confirmDel('حذف هذا التقييم نهائياً؟', function() {
    S.reviews = (S.reviews||[]).filter(r => String(r.id) !== String(reviewId));
    lsSave(); cloudSave(S);
    renderReviewsPage();
    toast('<i class="fa-solid fa-trash"></i> تم حذف التقييم');
  });
}

function renderReviewsPage() {
  const cont = document.getElementById('reviews-page-content');
  if (!cont) return;
  const allReviews = (S.reviews || []).sort((a,b) => new Date(b.created_at||0) - new Date(a.created_at||0));
  const total = allReviews.length;
  const avg = total ? (allReviews.reduce((s,r) => s + (+r.stars||0), 0) / total).toFixed(1) : 0;
  const dist = [5,4,3,2,1].map(n => ({ n, count: allReviews.filter(r => +r.stars === n).length }));
  const acc = S.settings?.accent || S.settings?.accentColor || '#7c6ff7';

  // تحديث الـ badge — يظهر فقط للتقييمات الجديدة غير المقروءة
  const badge = document.getElementById('reviews-badge');
  const _readCount = +(localStorage.getItem('_reviewsReadCount')||0);
  const _unread = Math.max(0, total - _readCount);
  if (badge) { badge.textContent = _unread; badge.style.display = _unread ? 'inline-flex' : 'none'; }
  // إظهار/إخفاء زرار "تم القراءة"
  const _markBtn = document.getElementById('reviews-mark-read-btn');
  if (_markBtn) _markBtn.style.display = _unread ? 'inline-flex' : 'none';

  if (!total) {
    cont.innerHTML = `<div style="text-align:center;padding:80px 20px;color:var(--text3)">
      <div style="font-size:64px;opacity:.25;margin-bottom:16px">⭐</div>
      <div style="font-size:18px;font-weight:800;color:var(--text2);margin-bottom:8px">لا توجد تقييمات بعد</div>
      <div style="font-size:13px;line-height:1.8;max-width:340px;margin:0 auto">أرسل رابط بوابة العميل لعملائك وعد بعد اكتمال المهام ستظهر تقييماتهم هنا</div>
      <button onclick="_copyReviewLink()" class="btn btn-primary" style="margin-top:20px"><i class="fa-solid fa-link"></i> انسخ رابط البوابة</button>
    </div>`;
    return;
  }

  // ── فلتر النجوم والتاريخ ──
  const _rf  = window._reviewsFilter || 'all';
  const _rym = window._reviewsYearMonth || 'all'; // 'YYYY-MM' أو 'all'

  // جمع كل الأشهر المتاحة
  const monthsSet = new Set();
  allReviews.forEach(r => {
    if (r.created_at) monthsSet.add(r.created_at.slice(0,7));
  });
  const months = [...monthsSet].sort((a,b) => b.localeCompare(a));

  // فلترة
  let filtered = allReviews;
  if (_rf !== 'all') filtered = filtered.filter(r => +r.stars === +_rf);
  if (_rym !== 'all') filtered = filtered.filter(r => (r.created_at||'').startsWith(_rym));

  // تجميع شهرياً للعرض
  const grouped = {};
  filtered.forEach(r => {
    const ym = (r.created_at||'').slice(0,7) || 'غير محدد';
    if (!grouped[ym]) grouped[ym] = [];
    grouped[ym].push(r);
  });
  const sortedMonths = Object.keys(grouped).sort((a,b) => b.localeCompare(a));

  const monthLabel = ym => {
    if (!ym || ym === 'غير محدد') return 'تاريخ غير محدد';
    const [y,m] = ym.split('-');
    const names = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
    return (names[+m-1]||m) + ' ' + y;
  };

  cont.innerHTML = `
  <!-- Summary Cards -->
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:20px">
    <div class="card" style="padding:20px;text-align:center;border-right:3px solid #f7c948">
      <div style="font-size:44px;font-weight:900;color:#f7c948;line-height:1">${avg}</div>
      <div style="font-size:20px;margin:6px 0">${'⭐'.repeat(Math.round(+avg))}</div>
      <div style="font-size:12px;color:var(--text3)">${total} تقييم إجمالي</div>
    </div>
    <div class="card" style="padding:20px">
      <div style="font-size:12px;font-weight:800;color:var(--text3);margin-bottom:12px">توزيع التقييمات</div>
      ${dist.map(d => `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;cursor:pointer" onclick="window._reviewsFilter='${d.n}';renderReviewsPage()">
        <div style="font-size:12px;color:var(--text3);width:14px;text-align:center">${d.n}</div>
        <div style="font-size:11px">⭐</div>
        <div style="flex:1;height:8px;background:var(--surface2);border-radius:4px;overflow:hidden">
          <div style="height:100%;width:${total?Math.round(d.count/total*100):0}%;background:#f7c948;border-radius:4px;transition:width .4s"></div>
        </div>
        <div style="font-size:11px;color:var(--text3);width:20px;text-align:left">${d.count}</div>
      </div>`).join('')}
    </div>
    <div class="card" style="padding:20px">
      <div style="font-size:12px;font-weight:800;color:var(--text3);margin-bottom:12px">أفضل العملاء</div>
      ${[...new Map(allReviews.map(r=>[r.client_name,r])).values()].slice(0,4).map(r=>`
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <div style="width:28px;height:28px;border-radius:50%;background:${acc}22;color:${acc};font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0">${(r.client_name||'?')[0]}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:12px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(r.client_name||'عميل')}</div>
          <div style="font-size:10px;color:var(--text3)">${allReviews.filter(x=>x.client_name===r.client_name).length} تقييم · ⭐ ${(allReviews.filter(x=>x.client_name===r.client_name).reduce((s,x)=>s+(+x.stars||0),0)/allReviews.filter(x=>x.client_name===r.client_name).length).toFixed(1)}</div>
        </div>
      </div>`).join('')}
    </div>
  </div>

  <!-- Filter Bar -->
  <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;align-items:center">
    <span style="font-size:12px;color:var(--text3);font-weight:700;margin-left:4px">التقييم:</span>
    ${[{v:'all',l:'الكل'},{v:'5',l:'⭐×5'},{v:'4',l:'⭐×4'},{v:'3',l:'⭐×3'},{v:'2',l:'⭐×2'},{v:'1',l:'⭐×1'}].map(f=>`
    <button onclick="window._reviewsFilter='${f.v}';renderReviewsPage()" class="btn btn-sm" style="background:${_rf===f.v?'var(--accent)':'var(--surface2)'};color:${_rf===f.v?'#fff':'var(--text2)'};border:1px solid ${_rf===f.v?'var(--accent)':'var(--border)'}">${f.l}</button>`).join('')}
    <span style="font-size:12px;color:var(--text3);font-weight:700;margin-right:8px;margin-left:4px">الشهر:</span>
    <button onclick="window._reviewsYearMonth='all';renderReviewsPage()" class="btn btn-sm" style="background:${_rym==='all'?'var(--accent)':'var(--surface2)'};color:${_rym==='all'?'#fff':'var(--text2)'};border:1px solid ${_rym==='all'?'var(--accent)':'var(--border)'}">الكل</button>
    ${months.map(ym=>`
    <button onclick="window._reviewsYearMonth='${ym}';renderReviewsPage()" class="btn btn-sm" style="background:${_rym===ym?'var(--accent2)':'var(--surface2)'};color:${_rym===ym?'#fff':'var(--text2)'};border:1px solid ${_rym===ym?'var(--accent2)':'var(--border)'}">
      ${monthLabel(ym)}
    </button>`).join('')}
    ${(_rf!=='all'||_rym!=='all')?`<button onclick="window._reviewsFilter='all';window._reviewsYearMonth='all';renderReviewsPage()" class="btn btn-ghost btn-sm"><i class="fa-solid fa-xmark"></i> مسح الفلاتر</button>`:''}
  </div>

  <!-- Reviews grouped by month -->
  <div style="display:flex;flex-direction:column;gap:20px">
    ${filtered.length === 0 ? `<div style="text-align:center;padding:40px;color:var(--text3)"><i class="fa-solid fa-star" style="font-size:32px;opacity:.3;display:block;margin-bottom:10px"></i>لا توجد تقييمات بهذه الفلاتر</div>` :
      sortedMonths.map(ym => `
      <div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
          <div style="font-size:13px;font-weight:900;color:var(--accent)">${monthLabel(ym)}</div>
          <div style="flex:1;height:1px;background:var(--border)"></div>
          <div style="font-size:11px;font-weight:700;background:var(--accent)22;color:var(--accent);padding:2px 10px;border-radius:20px">${grouped[ym].length} تقييم</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:10px">
          ${grouped[ym].map(r => {
            const taskObj = (S.tasks||[]).find(t=>String(t.id)===String(r.task_id));
            const starColor = +r.stars>=4?'#f7c948':+r.stars===3?'var(--accent2)':'var(--accent4)';
            const starBg = +r.stars>=4?'rgba(247,201,72,.1)':+r.stars===3?'rgba(168,156,255,.1)':'rgba(247,111,124,.1)';
            const starLabel = ['','سيء 😞','مقبول 😐','جيد 🙂','رائع 😊','ممتاز 🤩'][+r.stars]||'';
            return `<div class="card" style="padding:16px;border-right:3px solid ${starColor};position:relative">
              <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:${r.comment?'10':'0'}px;flex-wrap:wrap">
                <div style="display:flex;align-items:center;gap:10px">
                  <div style="width:36px;height:36px;border-radius:50%;background:${acc}22;color:${acc};font-size:13px;font-weight:900;display:flex;align-items:center;justify-content:center;flex-shrink:0">${(r.client_name||'?')[0]}</div>
                  <div>
                    <div style="font-size:13px;font-weight:800">${escapeHtml(r.client_name||'عميل')}</div>
                    <div style="font-size:10px;color:var(--text3)"><i class="fa-solid fa-calendar"></i> ${r.created_at?new Date(r.created_at).toLocaleDateString('ar-EG',{day:'numeric',month:'long',year:'numeric'}):''}</div>
                    ${taskObj||r.task_title?`<div style="font-size:10px;color:var(--text3);margin-top:2px"><i class="fa-solid fa-clipboard-list" style="color:var(--accent)"></i> ${escapeHtml(r.task_title||taskObj?.title||'')}</div>`:''}
                  </div>
                </div>
                <div style="display:flex;align-items:center;gap:8px">
                  <div style="text-align:center">
                    <div style="font-size:18px;letter-spacing:1px">${'⭐'.repeat(+r.stars||0)}</div>
                    <span style="font-size:10px;font-weight:800;padding:2px 8px;border-radius:8px;background:${starBg};color:${starColor}">${starLabel}</span>
                  </div>
                  <button data-rid="${r.id}" onclick="deleteReview(this.dataset.rid)" class="btn btn-danger btn-sm" style="padding:5px 8px;flex-shrink:0" title="حذف التقييم">
                    <i class="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>
              ${r.comment?`<div style="font-size:13px;color:var(--text2);line-height:1.8;padding:10px 14px;background:var(--surface2);border-radius:10px;font-style:italic;border-right:3px solid #f7c948">"${escapeHtml(r.comment)}"</div>`:''}
            </div>`;
          }).join('')}
        </div>
      </div>`).join('')
    }
  </div>`;
}

function _copyReviewLink() {
  // ✅ استخدم الرابط القصير
  var link = (typeof _shortReviewUrl === 'function') ? _shortReviewUrl() : (function(){
    const uid2 = _supaUserId;
    const un2 = S.settings && S.settings.username;
    var _rparts = window.location.pathname.split('/').filter(function(p){return p!=='';});
    if(_rparts.length && _rparts[_rparts.length-1].endsWith('.html')) _rparts.pop();
    var _rbase = _rparts.length ? '/' + _rparts.join('/') + '/' : '/';
    var _reviewPage = window.location.origin + _rbase + 'review.html';
    return un2 ? (_reviewPage+'?u='+encodeURIComponent(un2)) : (_reviewPage+'?uid='+uid2);
  })();
  navigator.clipboard && navigator.clipboard.writeText(link).then(function(){ toast('✅ تم نسخ رابط التقييم'); });
}

function _exportReviews() {
  const reviews = S.reviews || [];
  if (!reviews.length) { toast('لا توجد تقييمات للتصدير'); return; }
  const rows = [['العميل','الطلب','النجوم','التعليق','التاريخ']];
  reviews.forEach(r => rows.push([r.client_name||'', r.task_title||'', r.stars||'', r.comment||'', r.created_at?new Date(r.created_at).toLocaleDateString('ar-EG'):'']));
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csv);
  a.download = 'reviews-ordo.csv';
  a.click();
  toast('✅ تم تصدير التقييمات');
}

function _markReviewsRead() {
  const total = (S.reviews||[]).length;
  localStorage.setItem('_reviewsReadCount', total);
  // إخفاء الـ badge فوراً
  const badge = document.getElementById('reviews-badge');
  if (badge) { badge.textContent = '0'; badge.style.display = 'none'; }
  const btn = document.getElementById('reviews-mark-read-btn');
  if (btn) btn.style.display = 'none';
  toast('<i class="fa-solid fa-envelope-open" style="color:var(--accent3)"></i> تم تحديد كل التقييمات كمقروءة');
}

function showPage(id,el){
  if(_supaUserId && hasActiveSub() && !FREE_PAGES.includes(id) && !hasPageFeature(id)){
    _showPageLock(id,el,'feature'); return;
  }
  if(_supaUserId && !hasActiveSub() && !FREE_PAGES.includes(id)){
    _showPageLock(id,el); return;
  }
  // Track page history for back button
  var _curActive = document.querySelector('.page.active');
  var _curId = _curActive ? _curActive.id.replace('page-','') : null;
  if(_curId && _curId !== id) {
    _pageHistory.push(_curId);
    if(_pageHistory.length > 20) _pageHistory.shift();
  }
  // ── URL Routing: update browser URL ──
  if(typeof _pushPageUrl === 'function') _pushPageUrl(id);
  _updateNavBtns();
  _hideLock();
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  document.getElementById('page-'+id).classList.add('active');
  if(el)el.classList.add('active');
  if(!el){
    document.querySelectorAll('.nav-item').forEach(n=>{
      if(n.getAttribute('onclick')&&n.getAttribute('onclick').includes("'"+id+"'"))n.classList.add('active');
    });
  }
  document.querySelectorAll('.bn-item').forEach(b=>b.classList.remove('active'));
  const bnEl=document.getElementById('bn-'+id);
  if(bnEl)bnEl.classList.add('active');
  else { const bm=document.getElementById('bn-more'); if(bm) bm.classList.add('active'); }
  document.querySelectorAll('.bn-more-item').forEach(b=>b.classList.remove('active'));
  const bnmEl=document.getElementById('bnm-'+id);
  if(bnmEl)bnmEl.classList.add('active');
  updateHeader(id);
  if(window.innerWidth<=1024) closeSidebar();
  renderAll();
  window.scrollTo(0,0);
  applyPlatformConfig();
  // When navigating to services page, show the stores home list
  if(id === 'services'){
    setTimeout(function(){
      if(typeof renderStoresHomeList==='function') renderStoresHomeList();
    }, 50);
  }
  if(id === 'reviews'){
    setTimeout(renderReviewsPage, 50);
  }
  // Refresh team invites immediately when opening team page
  if(id === 'team' && typeof window._teamPollNow === 'function'){
    window._teamPollNow();
  }
  // Also check team_invites table on team page open
  if(id === 'team' && typeof window._checkPendingTeamInvitesNow === 'function'){
    window._checkPendingTeamInvitesNow().then && window._checkPendingTeamInvitesNow();
    // Re-render member teams after check
    setTimeout(function(){
      if(typeof renderMyMemberTeams==='function') renderMyMemberTeams();
      // Update inbox badge
      if(typeof window._updateInboxBadge==='function') window._updateInboxBadge();
    }, 1500);
  }
  // Always reset ALL stab-panels on every navigation
  const settingsPage = document.getElementById('page-settings');
  if(settingsPage){
    settingsPage.querySelectorAll('.stab-panel').forEach(p => {
      p.classList.remove('active');
      p.style.display = 'none';
    });
    if(id === 'settings'){
      const activeBtn = settingsPage.querySelector('.stab.active');
      const activeTab = activeBtn ? activeBtn.id.replace('stab-','') : 'general';
      const activePanel = document.getElementById('stabp-' + activeTab) || document.getElementById('stabp-general');
      if(activePanel){ activePanel.classList.add('active'); activePanel.style.display = 'block'; }
      if(!activeBtn){ const gb = document.getElementById('stab-general'); if(gb) gb.classList.add('active'); }
    }
  }
}

function _hideLock(){
  const el=document.getElementById('_page_lock_el');
  if(el) el.style.display='none';
}



function _showPageLock(id, el, reason){
  reason = reason || 'nosub';
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  if(el) el.classList.add('active');
  else document.querySelectorAll('.nav-item').forEach(n=>{
    if(n.getAttribute('onclick')&&n.getAttribute('onclick').includes("'"+id+"'"))n.classList.add('active');
  });
  const names={tasks:'المهام والمشاريع',schedule:'تنظيم اليوم',clients:'قاعدة العملاء',
    finance:'المالية',invoices:'الفواتير والعقود',team:'فريق العمل',
    learning:'الأهداف والإنجازات',meetings:'الميتنج',settings:'الإعدادات'};

  let lock=document.getElementById('_page_lock_el');
  if(!lock){ lock=document.createElement('div'); lock.id='_page_lock_el'; document.body.appendChild(lock); }
  lock.style.cssText='position:fixed;inset:0;z-index:500;background:rgba(7,8,15,.9);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;padding:20px';

  if(reason === 'feature'){
    // الصفحة مش في باقته
    lock.innerHTML=`
      <div style="max-width:360px;width:100%;text-align:center;position:relative">
        <button onclick="_hideLock();showPage('dashboard')" style="position:absolute;top:-40px;left:0;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);color:var(--text2);width:36px;height:36px;border-radius:50%;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center"><i class="fa-solid fa-xmark"></i></button>
        <div style="width:76px;height:76px;background:rgba(108,99,255,.12);border:1.5px solid rgba(108,99,255,.3);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:32px;margin:0 auto 16px"><i class="fa-solid fa-lock"></i></div>
        <div style="font-size:20px;font-weight:900;margin-bottom:6px">${names[id]||id}</div>
        <div style="font-size:13px;font-weight:700;color:var(--accent);margin-bottom:8px">غير متاح في باقتك الحالية</div>
        <div style="font-size:12px;color:var(--text2);margin-bottom:24px;line-height:1.8">هذا القسم يتطلب ترقية باقتك<br>تواصل معنا للترقية</div>
        <a href="https://wa.me/201090412218?text=${encodeURIComponent('مرحباً، أريد ترقية اشتراكي في Ordo')}" target="_blank"
          style="display:flex;align-items:center;justify-content:center;gap:8px;background:#25D366;color:#fff;padding:12px;border-radius:10px;font-weight:700;text-decoration:none;font-size:13px">
          <i class="fa-solid fa-rocket"></i> ترقية الباقة عبر واتساب
        </a>
      </div>`;
  } else {
    lock.innerHTML=`
      <div style="max-width:380px;width:100%;text-align:center;position:relative">
        <button onclick="_hideLock();showPage('dashboard')" style="position:absolute;top:-40px;left:0;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);color:var(--text2);width:36px;height:36px;border-radius:50%;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center"><i class="fa-solid fa-xmark"></i></button>
        <div style="width:76px;height:76px;background:rgba(108,99,255,.12);border:1.5px solid rgba(108,99,255,.3);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:32px;margin:0 auto 16px"><i class="fa-solid fa-lock"></i></div>
        <div style="font-size:20px;font-weight:900;margin-bottom:6px">${names[id]||id}</div>
        <div style="font-size:13px;font-weight:700;color:var(--accent);margin-bottom:8px">Premium — مدفوع</div>
        <div style="font-size:12px;color:var(--text2);margin-bottom:24px;line-height:1.8">انتهى اشتراكك. يرجى الاشتراك أو تفعيل كود للمتابعة.</div>
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:16px;margin-bottom:14px;text-align:right">
          <div style="font-size:12px;font-weight:700;color:var(--accent);margin-bottom:10px"><i class="fa-solid fa-key"></i> تفعيل كود الاشتراك</div>
          <div style="display:flex;gap:8px;margin-bottom:6px">
            <input id="_lock_code" type="text" placeholder="أدخل الكود..." dir="ltr"
              style="flex:1;background:var(--surface2);border:1.5px solid var(--border);border-radius:8px;padding:10px 12px;color:var(--text);font-family:var(--font);font-size:13px;letter-spacing:1.5px;outline:none"
              oninput="this.value=this.value.toUpperCase()"
              onkeydown="if(event.key==='Enter')_activateCode('_lock_code','_lock_msg')">
            <button onclick="_activateCode('_lock_code','_lock_msg')"
              style="background:var(--accent);color:#fff;border:none;border-radius:8px;padding:10px 14px;font-family:var(--font);font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap">
              تفعيل
            </button>
          </div>
          <div id="_lock_msg" style="font-size:11px;min-height:14px;text-align:center"></div>
        </div>
        <a href="https://wa.me/201090412218?text=${encodeURIComponent('مرحباً، أريد الاشتراك في Ordo')}" target="_blank"
          style="display:flex;align-items:center;justify-content:center;gap:8px;background:#25D366;color:#fff;padding:12px;border-radius:10px;font-weight:700;text-decoration:none;font-size:13px">
          شراء باقة عبر واتساب
        </a>
      </div>`;
  }
  lock.style.display='flex';
  window.scrollTo(0,0);
}

// ── تفعيل السيريال — دالة موحّدة ──
async function _activateCode(inputId, msgId, onSuccess){
  const inp=document.getElementById(inputId), msg=document.getElementById(msgId);
  if(!inp||!msg) return;
  const code=inp.value.trim().toUpperCase();
  if(!code){msg.style.color='var(--accent4)';msg.innerHTML='<i class="fa-solid fa-triangle-exclamation"></i> أدخل الكود';return;}
  if(!_supaUserId){msg.style.color='var(--accent4)';msg.innerHTML='<i class="fa-solid fa-triangle-exclamation"></i> يجب تسجيل الدخول أولاً';return;}
  msg.style.color='var(--text2)';msg.textContent='⏳ جاري التحقق من الكود...';
  const btn=inp.parentElement?.querySelector('button');
  if(btn) btn.disabled=true;
  // Timeout safety — if hanging > 15s, show error
  const _actTimeout = setTimeout(()=>{
    if(msg.textContent.includes('جاري')) {
      msg.style.color='var(--accent4)';
      msg.innerHTML='<i class="fa-solid fa-ban"></i> انتهت المهلة — تحقق من اتصالك بالإنترنت';
      if(btn) btn.disabled=false;
    }
  }, 15000);

  try{
    // البحث عن الكود في serial_keys — column اسمه 'code'
    let data = null, error = null;
    const r1 = await supa.from('serial_keys').select('*').eq('code', code).maybeSingle();
    if(!r1.error && r1.data) {
      data = r1.data;
    } else if(r1.error) {
      error = r1.error;
      console.error('Code lookup failed:', r1.error?.message, '| code tried:', code);
    }

    if(error){
      console.error('Serial lookup error:', error);
      msg.style.color='var(--accent4)';
      msg.innerHTML='<i class="fa-solid fa-ban"></i> خطأ في الاتصال ('+error.code+'): '+error.message;
      if(btn) btn.disabled=false;
      return;
    }
    if(!data){
      msg.style.color='var(--accent4)';
      msg.innerHTML='<i class="fa-solid fa-ban"></i> الكود غير موجود';
      if(btn) btn.disabled=false;
      return;
    }
    // normalize — key_code → code
    if(!data.code && data.key_code) data.code = data.key_code;
    // تحقق من الـ status في الـ JS
    if(data.status !== 'unused'){
      msg.style.color='var(--accent4)';
      msg.textContent = data.user_id === _supaUserId
        ? '<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> هذا الكود مفعّل بالفعل لحسابك'
        : '<i class="fa-solid fa-ban"></i> هذا الكود مستخدم مسبقاً';
      if(btn) btn.disabled=false;
      // لو الكود لحسابنا، حمّل الاشتراك
      if(data.user_id === _supaUserId){
        await loadUserSubscription(_supaUserId);
        setTimeout(()=>{_hideLock();if(onSuccess)onSuccess();},800);
      }
      return;
    }
    if(data.user_id !== null){
      msg.style.color='var(--accent4)';
      msg.innerHTML='<i class="fa-solid fa-ban"></i> هذا الكود مرتبط بحساب آخر';
      if(btn) btn.disabled=false;
      return;
    }

    // الكود صحيح وغير مستخدم — جيب الباقة منفصلاً وفعّله
    let plan = null;
    try {
      const {data: planRow, error: planErr} = await supa.from('subscription_plans').select('*').eq('id', data.plan_id).maybeSingle();
      if(!planErr) plan = planRow;
    } catch(pe) {
      const lsPlans = JSON.parse(localStorage.getItem('admin_plans')||'[]');
      plan = lsPlans.find(p => p.id === data.plan_id) || null;
    }
    const now=new Date();
    let exp=null;
    if(data.billing==='lifetime'){
      exp=null; // مدى الحياة
    } else if(data.billing==='annual'){
      // سنة كاملة من تاريخ التفعيل بالكالندر
      const d=new Date(now); d.setFullYear(d.getFullYear()+1); exp=d.toISOString();
    } else {
      // شهري — شهر واحد من تاريخ التفعيل بالكالندر (30 يوم أو نهاية الشهر)
      const d=new Date(now); d.setMonth(d.getMonth()+1); exp=d.toISOString();
    }
    // update بـ id (UUID) — مش بالـ code — علشان يعمل صح
    const {error:e2}=await supa
      .from('serial_keys')
      .update({
        status:'active',
        user_id:_supaUserId,
        activated_at:now.toISOString(),
        expires_at:exp
      })
      .eq('id', data.id);

    if(e2){
      console.error('Serial update error:', e2);
      msg.style.color='var(--accent4)';
      msg.innerHTML='<i class="fa-solid fa-ban"></i> خطأ أثناء التفعيل — تأكد من إعدادات قاعدة البيانات';
      if(btn) btn.disabled=false;
      return;
    }
    msg.style.color='var(--accent3)';
    msg.innerHTML='<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم تفعيل الاشتراك بنجاح!';
    inp.value='';
    await loadUserSubscription(_supaUserId);
    _updateNavLocks();
    setTimeout(()=>{
      _hideLock();
      renderAll();
      updateSubscriptionBar();
      showPage('dashboard');
      if(onSuccess) onSuccess();
    }, 800);
  }catch(e){
    clearTimeout(_actTimeout);
    console.error('_activateCode exception:', e);
    msg.style.color='var(--accent4)';
    msg.innerHTML='<i class="fa-solid fa-ban"></i> خطأ: '+e.message;
  }
  clearTimeout(_actTimeout);
  if(btn) btn.disabled=false;
}

function _updateNavLocks(){
  const noSub   = _supaUserId && !hasActiveSub();
  const hasSub  = _supaUserId && hasActiveSub();
  document.querySelectorAll('.nav-item').forEach(el=>{
    el.querySelectorAll('._nl').forEach(i=>i.remove());
    const oc = el.getAttribute('onclick')||'';
    if(!oc.includes('showPage')) return;
    if(oc.includes("'dashboard'")||oc.includes("'settings'")) return;
    // استخرج اسم الصفحة
    const match = oc.match(/showPage\(['"]([^'"]+)['"]/);
    const pageId = match ? match[1] : '';
    let lockChar = '';
    if(noSub) lockChar = '<i class="fa-solid fa-lock"></i>';
    else if(hasSub && pageId && !hasPageFeature(pageId)) lockChar = '<i class="fa-solid fa-lock"></i>';
    if(lockChar){
      const ic=document.createElement('span');
      ic.className='_nl';ic.style.cssText='font-size:10px;opacity:.55;margin-right:auto;flex-shrink:0';
      ic.innerHTML=lockChar; el.appendChild(ic);
    }
  });
  // قفّل / افتح قسم وسائل الدفع
  const card = document.getElementById('payment-accounts-card');
  const overlay = document.getElementById('payment-lock-overlay');
  if(card) card.style.position = 'relative';
  if(overlay) overlay.style.display = noSub ? 'flex' : 'none';
}


function toggleBnMore(){
  document.getElementById('bn-more-menu').classList.toggle('open');
  document.getElementById('bn-overlay').classList.toggle('open');
}
function closeBnMore(){
  document.getElementById('bn-more-menu').classList.remove('open');
  document.getElementById('bn-overlay').classList.remove('open');
}
function openM(id){document.getElementById(id).classList.add('open');}
function closeM(id){var _m=document.getElementById(id);if(!_m)return;_m.classList.remove('open');_m.classList.remove('expanded');var _eb=_m.querySelector('.expand-btn');if(_eb){_eb.innerHTML='<i class="fa-solid fa-expand"></i>';_eb.title='توسيع';}}
document.querySelectorAll('.modal-overlay').forEach(m=>m.addEventListener('click',e=>{if(e.target===m)m.classList.remove('open');}));
function confirmDel(msg,cb){
  const msgEl = document.getElementById('confirm-msg');
  const btnEl = document.getElementById('confirm-btn');
  if(!msgEl||!btnEl){ if(window.confirm(msg)) cb(); return; }
  msgEl.textContent=msg;
  // Replace button to remove old event listeners
  const newBtn = btnEl.cloneNode(true);
  btnEl.parentNode.replaceChild(newBtn, btnEl);
  newBtn.onclick = function(){ cb(); closeM('modal-confirm'); };
  openM('modal-confirm');
}

