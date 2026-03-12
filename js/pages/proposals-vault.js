
// ══════════════════════════════════════════════════
// PROPOSALS (عروض الأسعار) — Full Implementation
// ══════════════════════════════════════════════════

var _propItemCount = 0;
var _lastPropLink  = '';

// ── Event delegation: prop item row remove ──
document.addEventListener('click', function(e){
  var rmBtn = e.target.closest('[data-rmrow]');
  if (!rmBtn) return;
  var row = rmBtn.closest('.prop-item-row');
  if (row) { row.remove(); _calcPropTotal(); }
});

// ── Event delegation for proposals list ──
document.addEventListener('click', function(e){
  var btn = e.target.closest('[data-act]');
  if (!btn) return;
  var propWrap = document.getElementById('proposals-list-wrap');
  if (!propWrap || !propWrap.contains(btn)) return;
  var act   = btn.dataset.act;
  var token = btn.dataset.token;
  var id    = btn.dataset.id;
  if (act === 'share')   _showPropLinkModal(token);
  if (act === 'edit')    openProposalModal(id);
  if (act === 'del')     _delProposal(id);
  if (act === 'preview') {
    var p = (S.proposals||[]).find(function(x){ return x.token===token; });
    if (p) window.open(_propUrl(p), '_blank');
  }
});

// ── Get proposal page URL (short if username exists) ──
function _propUrl(p) {
  // ✅ استخدم الرابط القصير لو في username
  if (typeof _shortProposalUrl === 'function' && (S && S.settings && S.settings.username)) {
    return _shortProposalUrl(p.token);
  }
  var customUrl = (S && S.settings && S.settings.proposalPageUrl) ? S.settings.proposalPageUrl.trim() : '';
  if (customUrl) {
    customUrl = customUrl.split('?')[0].replace(/\/$/, '');
    return customUrl + '?token=' + encodeURIComponent(p.token);
  }
  var href = window.location.href.split('?')[0];
  var base = href.substring(0, href.lastIndexOf('/') + 1);
  return base + 'proposal.html?token=' + encodeURIComponent(p.token);
}

// ══════════════════════════════════════════════════════
// ── SHORT URL GENERATOR ──
// الروابط النظيفة: domain/USERNAME/TYPE/ID
// مثال: ordo-freelance.github.io/Ordo/mahmoud/p/TOKEN
// يعتمد على 404.html في GitHub Pages للـ routing
// ══════════════════════════════════════════════════════
function _getAppBase() {
  // e.g. https://ordo-freelance.github.io/Ordo/
  var href = window.location.href.split('?')[0];
  return href.substring(0, href.lastIndexOf('/') + 1);
}

function _getUsername() {
  return (S && S.settings && S.settings.username) || '';
}

function _shortBase() {
  // Returns:  https://ordo-freelance.github.io/Ordo/mahmoud
  var un = _getUsername();
  if (!un) return null;
  return _getAppBase() + encodeURIComponent(un);
}

function _shortProposalUrl(token) {
  // ✅ رابط مباشر — الروابط القصيرة بتديك 404 على GitHub Pages
  return _getAppBase() + 'proposal.html?token=' + encodeURIComponent(token);
}

function _shortPortalUrl(clientId, taskId) {
  // ✅ رابط مباشر
  var base = _getAppBase() + 'client-portal.html?uid=' + (_supaUserId||'') + '&cid=' + encodeURIComponent(clientId||'');
  if (taskId) base += '&tid=' + encodeURIComponent(taskId);
  return base;
}

function _shortReviewUrl() {
  // ✅ رابط مباشر
  return _getAppBase() + 'review.html?uid=' + (_supaUserId||'');
}

function _shortStoreUrl(storeId) {
  // ✅ رابط مباشر — getSvcLink يتجاهل هذه الدالة الآن لكن نصلحها كذلك للاتساق
  var base = _getAppBase() + 'store.html';
  var un = _getUsername();
  if (storeId) {
    var storeObj = (_getStores&&_getStores()||[]).find(function(s){return s.id===storeId;});
    if (storeObj && storeObj.username) return base + '?u=' + encodeURIComponent(storeObj.username);
    return (un ? base+'?u='+encodeURIComponent(un) : base+'?uid='+(_supaUserId||'')) + '&store=' + encodeURIComponent(storeId);
  }
  return un ? (base + '?u=' + encodeURIComponent(un)) : (base + '?uid=' + (_supaUserId||''));
}

function _shortInvoiceUrl(invoiceId) {
  // ✅ رابط مباشر
  return _getAppBase() + 'invoice.html?uid=' + (_supaUserId||'') + '&id=' + encodeURIComponent(invoiceId||'');
}

function _propCur() {
  return (document.getElementById('prop-currency')||{value:'ج.م'}).value || 'ج.م';
}

// ── Render proposals list ──
function renderProposals() {
  var wrap = document.getElementById('proposals-list-wrap'); if (!wrap) return;
  var proposals = S.proposals || [];

  var all = proposals.length;
  var pending  = proposals.filter(function(p){ return (p.status==='pending'||p.status==='draft'); }).length;
  var accepted = proposals.filter(function(p){ return p.status==='accepted'; }).length;
  var rejected = proposals.filter(function(p){ return p.status==='rejected'; }).length;
  ['all','pending','accepted','rejected'].forEach(function(k,i){
    var el = document.getElementById('prop-stat-'+k);
    if (el) el.textContent = [all,pending,accepted,rejected][i];
  });
  var badge = document.getElementById('proposals-nav-badge');
  if (badge) {
    var pend = proposals.filter(function(p){ return p.status==='pending'; }).length;
    badge.textContent = pend; badge.style.display = pend ? 'inline-flex' : 'none';
  }

  if (!proposals.length) {
    wrap.innerHTML = '<div class="card" style="text-align:center;padding:48px 20px;color:var(--text3)"><div style="font-size:48px;margin-bottom:12px">📋</div><div style="font-size:16px;font-weight:800;margin-bottom:8px;color:var(--text)">لا توجد عروض أسعار</div><div style="font-size:13px;margin-bottom:18px">أنشئ أول عرض وأرسله للعميل مباشرة</div><button class="btn btn-primary" onclick="openProposalModal()"><i class="fa-solid fa-plus" style="margin-left:4px"></i> عرض جديد</button></div>';
    return;
  }

  var statusLabel = { pending:'⏳ في الانتظار', draft:'📝 مسودة', accepted:'✅ مقبول', rejected:'❌ مرفوض', expired:'🕐 منتهي الصلاحية' };
  var statusColor = { pending:'#f7c948', draft:'var(--text3)', accepted:'var(--accent3)', rejected:'var(--accent4)', expired:'var(--text3)' };
  var cur = S.settings && S.settings.currency ? S.settings.currency : 'ج.م';

  wrap.innerHTML = proposals.slice().reverse().map(function(p) {
    var sk = p.status || 'pending';
    if (sk === 'pending' && p.expiry && new Date(p.expiry) < new Date()) sk = 'expired';
    var total = (p.total || 0).toLocaleString();
    var pcur  = p.currency || cur;
    var link  = _propUrl(p);
    var noteHtml = p.clientNote
      ? '<div style="margin-top:10px;background:rgba(124,111,247,.1);border-right:3px solid var(--accent2);padding:8px 12px;border-radius:8px;font-size:12px;color:var(--text2)"><i class="fa-solid fa-comment" style="color:var(--accent2)"></i> ملاحظة العميل: <em>' + escapeHtml(p.clientNote) + '</em></div>' : '';
    var respondedHtml = p.respondedAt
      ? '<div style="font-size:11px;color:var(--text3);margin-top:4px"><i class="fa-solid fa-clock"></i> رد العميل: ' + new Date(p.respondedAt).toLocaleDateString('ar-EG') + '</div>' : '';
    return '<div class="card" style="margin-bottom:12px;border-right:4px solid '+statusColor[sk]+';transition:.2s">'
      + '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap">'
        + '<div style="flex:1;min-width:0">'
          + '<div style="font-size:15px;font-weight:800;margin-bottom:4px">' + escapeHtml(p.title||'بدون عنوان') + '</div>'
          + '<div style="font-size:12px;color:var(--text2);margin-bottom:8px;display:flex;flex-wrap:wrap;gap:10px">'
            + (p.clientName ? '<span><i class="fa-solid fa-user" style="color:var(--accent2)"></i> ' + escapeHtml(p.clientName) + '</span>' : '')
            + '<span><i class="fa-solid fa-calendar" style="color:var(--text3)"></i> ' + escapeHtml(p.date||'—') + '</span>'
            + (p.expiry ? '<span><i class="fa-solid fa-hourglass-end" style="color:var(--text3)"></i> حتى: ' + escapeHtml(p.expiry) + '</span>' : '')
            + (p.items ? '<span style="color:var(--text3)">(' + p.items.length + ' بند)</span>' : '')
          + '</div>'
          + '<span style="background:'+statusColor[sk]+'22;color:'+statusColor[sk]+';border:1px solid '+statusColor[sk]+'55;border-radius:20px;padding:3px 10px;font-size:11px;font-weight:700">' + (statusLabel[sk]||sk) + '</span>'
          + respondedHtml + noteHtml
        + '</div>'
        + '<div style="text-align:left;white-space:nowrap;display:flex;flex-direction:column;align-items:flex-end;gap:8px">'
          + '<div style="font-size:22px;font-weight:900;color:var(--accent3)">' + total + ' ' + escapeHtml(pcur) + '</div>'
          + '<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end">'
            + (sk!=='draft' ? '<button class="btn btn-ghost btn-sm" data-act="share" data-token="' + escapeHtml(p.token) + '" title="مشاركة الرابط"><i class="fa-solid fa-share-nodes"></i></button>' : '')
            + '<button class="btn btn-ghost btn-sm" data-act="edit" data-id="' + escapeHtml(String(p.id)) + '" title="تعديل"><i class="fa-solid fa-pen"></i></button>'
            + (sk!=='draft' ? '<button class="btn btn-ghost btn-sm" data-act="preview" data-token="' + escapeHtml(p.token) + '" title="معاينة"><i class="fa-solid fa-eye"></i></button>' : '')
            + '<button class="btn btn-ghost btn-sm" style="color:var(--accent4)" data-act="del" data-id="' + escapeHtml(String(p.id)) + '" title="حذف"><i class="fa-solid fa-trash"></i></button>'
          + '</div>'
        + '</div>'
      + '</div>'
    + '</div>';
  }).join('');
}

// ── Share link modal ──
function _showPropLinkModal(token) {
  var p = (S.proposals||[]).find(function(x){ return x.token===token; }); if (!p) return;
  var link = _propUrl(p);
  _lastPropLink = link;
  document.getElementById('prop-share-link-display').textContent = link;
  openM('modal-prop-link');
}
function _doCopyPropLink() {
  navigator.clipboard && navigator.clipboard.writeText(_lastPropLink).then(function(){
    toast('✅ تم نسخ الرابط — ابعته للعميل!');
    closeM('modal-prop-link');
  });
}
function _doOpenPropLink() { window.open(_lastPropLink,'_blank'); }

// ── Delete ──
function _delProposal(id) {
  confirmDel('حذف هذا العرض نهائياً؟', function(){
    S.proposals = (S.proposals||[]).filter(function(p){ return String(p.id)!==String(id); });
    lsSave(); renderProposals();
    toast('🗑️ تم حذف العرض');
  });
}

// ── Items ──
function _addPropItem(item) {
  _propItemCount++;
  var wrap = document.getElementById('prop-items-wrap'); if (!wrap) return;
  var el = document.createElement('div');
  el.className = 'prop-item-row';
  el.style.cssText = 'display:grid;grid-template-columns:1fr 64px 88px 30px;gap:5px;align-items:center;margin-bottom:6px';
  el.innerHTML =
    '<input class="form-input" placeholder="وصف البند" value="' + (item&&item.desc?escapeHtml(item.desc):'') + '" oninput="_calcPropTotal()" style="font-size:13px">'
    + '<input class="form-input" type="number" placeholder="1" value="' + (item&&item.qty!=null?item.qty:1) + '" min="1" oninput="_calcPropTotal()" style="font-size:13px;text-align:center">'
    + '<input class="form-input" type="number" placeholder="0" value="' + (item&&item.price!=null?item.price:'') + '" min="0" oninput="_calcPropTotal()" style="font-size:13px;text-align:center">'
    + '<button class="btn btn-ghost btn-sm" data-rmrow="1" style="padding:4px;color:var(--accent4);min-width:28px;height:32px"><i class="fa-solid fa-xmark"></i></button>';
  wrap.appendChild(el);
  _calcPropTotal();
}

function _getPropItems() {
  var wrap = document.getElementById('prop-items-wrap'); if (!wrap) return [];
  var items = [];
  wrap.querySelectorAll('.prop-item-row').forEach(function(row){
    var inputs = row.querySelectorAll('input');
    if (inputs.length >= 3) {
      var desc  = (inputs[0].value||'').trim();
      var qty   = +(inputs[1].value)||1;
      var price = +(inputs[2].value)||0;
      if (desc || price) items.push({desc:desc, qty:qty, price:price, total:qty*price});
    }
  });
  return items;
}

function _calcPropTotal() {
  var items    = _getPropItems();
  var subtotal = items.reduce(function(s,i){ return s+i.total; }, 0);
  var discType = (document.getElementById('prop-discount-type')||{value:'percent'}).value || 'percent';
  var discVal  = Math.max(0, +((document.getElementById('prop-discount')||{value:0}).value||0));
  var tax      = Math.min(100, Math.max(0, +((document.getElementById('prop-tax')||{value:0}).value||0)));
  var discAmt  = discType === 'fixed' ? Math.min(discVal, subtotal) : subtotal * Math.min(100, discVal) / 100;
  var taxAmt   = (subtotal - discAmt) * tax / 100;
  var total    = subtotal - discAmt + taxAmt;
  var cur      = _propCur();
  function setEl(id,v){ var e=document.getElementById(id); if(e) e.textContent=v; }
  setEl('prop-subtotal', subtotal.toLocaleString() + ' ' + cur);
  setEl('prop-discount-val', '-' + discAmt.toLocaleString() + ' ' + cur);
  setEl('prop-tax-val', '+' + taxAmt.toLocaleString() + ' ' + cur);
  setEl('prop-total', total.toLocaleString() + ' ' + cur);
  return {subtotal:subtotal, discAmt:discAmt, taxAmt:taxAmt, total:total, discType:discType};
}

// ── Open modal ──
function openProposalModal(id) {
  _propItemCount = 0;
  var editing = !!id;
  document.getElementById('prop-modal-ttl').innerHTML = editing
    ? '<i class="fa-solid fa-pen" style="color:var(--accent)"></i> تعديل العرض'
    : '<i class="fa-solid fa-file-contract" style="color:var(--accent)"></i> عرض سعر جديد';
  document.getElementById('prop-eid').value = id || '';
  document.getElementById('prop-items-wrap').innerHTML = '';

  // Fill clients dropdown
  var sel = document.getElementById('prop-client');
  sel.innerHTML = '<option value="">— اختر عميل —</option>';
  (S.clients||[]).forEach(function(cl){
    var o = document.createElement('option');
    o.value = cl.name; o.textContent = cl.name;
    sel.appendChild(o);
  });

  var today   = new Date().toISOString().slice(0,10);
  var expiry14 = new Date(Date.now()+14*864e5).toISOString().slice(0,10);

  if (editing) {
    var p = (S.proposals||[]).find(function(x){ return String(x.id)===String(id); });
    if (!p) return;
    sel.value = p.clientName || '';
    document.getElementById('prop-title').value         = p.title || '';
    document.getElementById('prop-date').value          = p.date  || today;
    document.getElementById('prop-expiry').value        = p.expiry || expiry14;
    document.getElementById('prop-discount').value      = p.discount || 0;
    document.getElementById('prop-discount-type').value = p.discountType || 'percent';
    document.getElementById('prop-tax').value           = p.tax || 0;
    document.getElementById('prop-payment-terms').value = p.paymentTerms || 'full';
    document.getElementById('prop-currency').value      = p.currency || 'ج.م';
    document.getElementById('prop-notes').value         = p.notes || '';
    document.getElementById('prop-intro').value         = p.intro || '';
    (p.items||[]).forEach(function(item){ _addPropItem(item); });
    if (!p.items || !p.items.length) _addPropItem();
  } else {
    sel.value = '';
    ['prop-title','prop-notes','prop-intro'].forEach(function(f){
      var e=document.getElementById(f); if(e) e.value='';
    });
    document.getElementById('prop-date').value          = today;
    document.getElementById('prop-expiry').value        = expiry14;
    document.getElementById('prop-discount').value      = 0;
    document.getElementById('prop-tax').value           = 0;
    document.getElementById('prop-payment-terms').value = 'full';
    document.getElementById('prop-currency').value      = 'ج.م';
    _addPropItem(); _addPropItem(); _addPropItem();
  }
  _calcPropTotal();
  openM('modal-proposal');
}

function _propClientChange() {
  var name = (document.getElementById('prop-client')||{value:''}).value;
  if (!name) return;
  var titleEl = document.getElementById('prop-title');
  if (titleEl && !titleEl.value) titleEl.value = 'عرض سعر لـ ' + name;
}

// ── Save proposal ──
function saveProposal(saveStatus) {
  var title = (document.getElementById('prop-title').value||'').trim();
  if (!title) { toast('<i class="fa-solid fa-triangle-exclamation"></i> أدخل عنوان العرض'); return; }
  var items = _getPropItems();
  if (!items.length && saveStatus !== 'draft') {
    toast('<i class="fa-solid fa-triangle-exclamation"></i> أضف بنداً واحداً على الأقل');
    return;
  }
  var eid = document.getElementById('prop-eid').value;
  var calc = _calcPropTotal();
  var now  = new Date().toISOString();
  var today = now.slice(0,10);
  var existingProp = eid ? (S.proposals||[]).find(function(x){ return String(x.id)===String(eid); }) : null;

  var d = {
    id:           eid || ('prop_' + Date.now()),
    token:        existingProp ? existingProp.token : ('prp_' + Date.now() + '_' + Math.random().toString(36).slice(2,8)),
    clientName:   (document.getElementById('prop-client')||{value:''}).value,
    title:        title,
    date:         document.getElementById('prop-date').value || today,
    expiry:       document.getElementById('prop-expiry').value || '',
    items:        items,
    subtotal:     calc.subtotal,
    discount:     +((document.getElementById('prop-discount')||{value:0}).value||0),
    discountType: (document.getElementById('prop-discount-type')||{value:'percent'}).value || 'percent',
    discountAmt:  calc.discAmt,
    tax:          +((document.getElementById('prop-tax')||{value:0}).value||0),
    taxAmt:       calc.taxAmt,
    total:        calc.total,
    currency:     (document.getElementById('prop-currency')||{value:'ج.م'}).value,
    paymentTerms: (document.getElementById('prop-payment-terms')||{value:'full'}).value,
    notes:        (document.getElementById('prop-notes')||{value:''}).value,
    intro:        (document.getElementById('prop-intro')||{value:''}).value,
    status:       saveStatus || (existingProp ? existingProp.status : 'pending'),
    clientNote:   existingProp ? (existingProp.clientNote||'') : '',
    respondedAt:  existingProp ? (existingProp.respondedAt||'') : '',
    createdAt:    existingProp ? existingProp.createdAt : now,
    updatedAt:    now
  };

  if (!S.proposals) S.proposals = [];
  if (existingProp) {
    var idx = S.proposals.findIndex(function(x){ return String(x.id)===String(eid); });
    if (idx > -1) S.proposals[idx] = d;
  } else {
    S.proposals.push(d);
  }

  lsSave();
  closeM('modal-proposal');
  renderProposals();

  if (saveStatus !== 'draft') {
    setTimeout(function(){ _showPropLinkModal(d.token); }, 300);
  } else {
    toast('📝 تم حفظ المسودة');
  }
}

// ── Poll for client responses ──
async function _pollProposalResponses() {
  if (!window._supaUserId || !window.supa) return;
  try {
    var res = await supa.from('studio_data').select('data').eq('user_id', _supaUserId).maybeSingle();
    if (!res || !res.data) return;
    var fresh = res.data;
    if (typeof fresh === 'string') fresh = JSON.parse(fresh);
    if (fresh && fresh.data && !fresh.tasks) fresh = typeof fresh.data === 'string' ? JSON.parse(fresh.data) : fresh.data;
    var newProps = fresh && fresh.proposals ? fresh.proposals : [];
    var changed = false;
    (S.proposals||[]).forEach(function(op){
      var np = newProps.find(function(x){ return x.id === op.id; });
      if (np && np.status !== op.status && (np.status === 'accepted' || np.status === 'rejected')) {
        op.status      = np.status;
        op.clientNote  = np.clientNote  || '';
        op.respondedAt = np.respondedAt || '';
        changed = true;
        var lbl = np.status === 'accepted' ? '✅ قبل العرض' : '❌ رفض العرض';
        toast('📋 ' + lbl + ': ' + escapeHtml(np.title||'عرض سعر'));
      }
    });
    if (changed) { lsSave(); renderProposals(); }
  } catch(e) {}
}
setInterval(_pollProposalResponses, 45000);
setTimeout(_pollProposalResponses, 8000);

