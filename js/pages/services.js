// SERVICE PORTFOLIO SYSTEM  
// ═══════════════════════════════════════════════════


// ═══════════════════════════════════════════════════════════════
// <i class="fa-solid fa-bag-shopping"></i>  SERVICES SYSTEM — Full Implementation
// ═══════════════════════════════════════════════════════════════

// ── Helpers ──
function getSvcLink(storeId){
  // ✅ دائماً ابنِ رابط store.html مباشر — الروابط القصيرة بتديك 404 على GitHub Pages
  var uid = (typeof _supaUserId!=='undefined' && _supaUserId) ? _supaUserId : '';
  var _spp=window.location.pathname,_sps=_spp.split('/').filter(function(x){return x!=='';});
  if(_sps.length&&['dashboard','tasks','projects','schedule','meetings','clients','finance','invoices','services','support','team','timetracker','goals','settings','reports'].indexOf(_sps[_sps.length-1])>=0)_sps.pop();
  if(_sps.length&&_sps[_sps.length-1].endsWith('.html'))_sps.pop();
  var base = window.location.origin+(_sps.length?'/'+_sps.join('/')+'/' :'/')+'store.html';
  if(storeId){
    var storeObj=(_getStores()||[]).find(function(s){return s.id===storeId;});
    if(storeObj&&storeObj.username){
      return base+'?u='+encodeURIComponent(storeObj.username);
    }
  }
  var un=S&&S.settings&&S.settings.username;
  var link=un?(base+'?u='+encodeURIComponent(un)):(base+'?uid='+uid);
  if(storeId) link+='&store='+encodeURIComponent(storeId);
  return link;
}

// ══ USERNAME / CUSTOM LINK FUNCTIONS ══
function _updateUsernamePreview(un){
  var base=window.location.origin+window.location.pathname;
  var linkEl=document.getElementById('username-link-preview');
  if(!linkEl) return;
  if(un){
    linkEl.textContent=base+'?u='+un;
    linkEl.title='انقر للمعاينة';
    linkEl.style.cursor='pointer';
    linkEl.onclick=function(){ window.open(base+'?u='+un,'_blank'); };
  } else {
    linkEl.textContent='أدخل اسم مستخدم لتفعيل الرابط المخصص';
    linkEl.onclick=null;
  }
}
async function checkAndSaveUsername(){
  var inp=document.getElementById('set-username');
  var un=(inp&&inp.value.trim().toLowerCase().replace(/[^a-z0-9_-]/g,''))||'';
  var statusEl=document.getElementById('username-status');
  if(!un){ if(statusEl) statusEl.innerHTML='<span style="color:var(--accent4)">أدخل اسم مستخدم أولاً</span>'; return; }
  if(un.length<3){ if(statusEl) statusEl.innerHTML='<span style="color:var(--accent4)">الاسم قصير جداً (3 أحرف على الأقل)</span>'; return; }
  if(!_supaUserId){ toast('<i class="fa-solid fa-triangle-exclamation"></i> يجب تسجيل الدخول أولاً'); return; }
  if(statusEl) statusEl.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> جاري التحقق...';
  try{
    // Check via username_index column (more reliable)
    var res=await supa.from('studio_data').select('user_id').eq('username_index', un).neq('user_id',_supaUserId).maybeSingle();
    if(res.data){
      if(statusEl) statusEl.innerHTML='<span style="color:var(--accent4)">❌ الاسم محجوز، جرب اسماً آخر</span>';
      return;
    }
    // Save to S.settings.username
    if(!S.settings) S.settings={};
    S.settings.username=un;
    if(inp) inp.value=un;
    // Force immediate cloud save with username_index
    S._savedAt=new Date().toISOString();
    try{
      const payload={user_id:_supaUserId,data:JSON.stringify(S),updated_at:S._savedAt,username_index:un};
      await supa.from('studio_data').upsert(payload,{onConflict:'user_id'});
    }catch(e2){}
    lsSave();
    _updateUsernamePreview(un);
    if(statusEl) statusEl.innerHTML='✅ تم الحفظ — رابط متجرك: <span id="username-link-preview" style="color:var(--accent);cursor:pointer" onclick="window.open(window.location.origin+window.location.pathname+\'?u='+un+'\')">'+(window.location.origin+window.location.pathname)+'?u='+un+'</span>';
    toast('✅ تم حفظ الاسم: @'+un);
  } catch(e){
    if(!S.settings) S.settings={};
    S.settings.username=un;
    if(inp) inp.value=un;
    lsSave(); cloudSave(S);
    _updateUsernamePreview(un);
    if(statusEl) statusEl.innerHTML='✅ رابط متجرك: <span style="color:var(--accent)">'+(window.location.origin+window.location.pathname)+'?u='+un+'</span>';
  }
}
// ══ MULTI-STORE FUNCTIONS ══
function _getStores(){ return S.stores||[]; }


// ── Current active store context ──
var _currentStoreIdx = null;

// ── Get current store's ID (null = main store) ──
function _getCurrentStoreId(){
  if(_currentStoreIdx === null) return null;
  var stores = _getStores();
  return stores[_currentStoreIdx] ? stores[_currentStoreIdx].id : null;
}

function _openStoreInner(idx){
  _currentStoreIdx = idx;
  var stores = _getStores();
  var st = (idx != null) ? stores[idx] : null;
  var storeName = st ? st.name : (S.settings&&S.settings.name||'المتجر الرئيسي');
  var storeLink = getSvcLink(st ? st.id : null);
  var nameEl = document.getElementById('svc-inner-store-name');
  if(nameEl) nameEl.textContent = storeName;
  var linkEl = document.getElementById('svc-inner-store-link');
  if(linkEl) linkEl.textContent = storeLink;
  document.getElementById('svc-stores-home').style.display = 'none';
  document.getElementById('svc-store-inner').style.display = '';
  // Refresh all tabs for current store context
  renderServices();
  renderStandalonePackages();
  switchSvcTab('services');
}

function _svcBackToStores(){
  _currentStoreIdx = null;
  document.getElementById('svc-store-inner').style.display = 'none';
  document.getElementById('svc-stores-home').style.display = '';
  renderStoresHomeList();
}

function _openCurrentStorePub(){
  var stores = _getStores();
  var st = (_currentStoreIdx != null) ? stores[_currentStoreIdx] : null;
  window.open(getSvcLink(st ? st.id : null), '_blank');
}

function _copyCurrentStoreLink(){
  var stores = _getStores();
  var st = (_currentStoreIdx != null) ? stores[_currentStoreIdx] : null;
  var link = getSvcLink(st ? st.id : null);
  navigator.clipboard.writeText(link).then(function(){toast('<i class="fa-solid fa-copy"></i> تم نسخ الرابط');}).catch(function(){toast(link);});
}

function renderStoresHomeList(){
  var listEl = document.getElementById('svc-stores-home-list');
  var emptyEl = document.getElementById('svc-stores-home-empty');
  if(!listEl) return;
  var stores = _getStores();
  // Always show main store + extra stores as cards
  var mainName = (S.settings&&S.settings.name) || 'المتجر الرئيسي';
  var mainDesc = (S.settings&&S.settings.svc_site_desc) || '';
  var mainLink = getSvcLink(null);

  var html = '';
  // Main store card
  html += '<div onclick="_openStoreInner(null)" style="background:var(--surface2);border:2px solid var(--accent);border-radius:16px;padding:18px;cursor:pointer;transition:.2s;position:relative" onmouseover="this.style.transform=\'translateY(-3px)\'" onmouseout="this.style.transform=\'none\'">' +
    '<div style="position:absolute;top:12px;left:12px;background:var(--accent);color:#fff;font-size:10px;font-weight:700;padding:2px 10px;border-radius:20px">رئيسي</div>' +
    '<div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;padding-top:28px">' +
      '<div style="width:46px;height:46px;border-radius:12px;background:var(--accent);display:flex;align-items:center;justify-content:center;font-size:20px;color:#fff;flex-shrink:0"><i class="fa-solid fa-house"></i></div>' +
      '<div style="min-width:0"><div style="font-size:16px;font-weight:900;margin-bottom:2px">' + escapeHtml(mainName) + '</div>' +
      (mainDesc ? '<div style="font-size:11px;color:var(--text3)">' + escapeHtml(mainDesc) + '</div>' : '') + '</div>' +
    '</div>' +
    '<div style="font-size:10px;color:var(--text3);font-family:var(--mono);background:var(--surface);border-radius:8px;padding:6px 10px;margin-bottom:10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + escapeHtml(mainLink) + '</div>' +
    '<div style="display:flex;gap:6px">' +
      '<button onclick="event.stopPropagation();_openStoreInner(null)" class="btn btn-primary btn-sm" style="flex:1;justify-content:center"><i class="fa-solid fa-pen-to-square" style="margin-left:4px"></i> تعديل</button>' +
      '<button onclick="event.stopPropagation();window.open(\'' + mainLink + '\',\'_blank\')" class="btn btn-ghost btn-sm"><i class="fa-solid fa-eye"></i></button>' +
      '<button onclick="event.stopPropagation();svcCopyLink()" class="btn btn-ghost btn-sm"><i class="fa-solid fa-copy"></i></button>' +
    '</div>' +
  '</div>';

  // Extra stores
  stores.forEach(function(st, i){
    var lnk = getSvcLink(st.id);
    html += '<div onclick="_openStoreInner(' + i + ')" style="background:var(--surface2);border:2px solid var(--border);border-radius:16px;padding:18px;cursor:pointer;transition:.2s;position:relative" onmouseover="this.style.borderColor=\'var(--accent)\';this.style.transform=\'translateY(-3px)\'" onmouseout="this.style.borderColor=\'var(--border)\';this.style.transform=\'none\'">' +
      '<div style="position:absolute;top:12px;left:12px;display:flex;gap:4px">' +
        '<button onclick="event.stopPropagation();editStore(' + i + ')" class="btn btn-ghost btn-sm" style="padding:2px 8px;font-size:11px"><i class="fa-solid fa-pen"></i></button>' +
        '<button onclick="event.stopPropagation();deleteStore(' + i + ')" class="btn btn-danger btn-sm" style="padding:2px 8px;font-size:11px"><i class="fa-solid fa-trash"></i></button>' +
      '</div>' +
      '<div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;padding-top:28px">' +
        '<div style="width:46px;height:46px;border-radius:12px;background:var(--accent2);display:flex;align-items:center;justify-content:center;font-size:20px;color:#fff;flex-shrink:0"><i class="fa-solid fa-store"></i></div>' +
        '<div style="min-width:0"><div style="font-size:16px;font-weight:900;margin-bottom:2px">' + escapeHtml(st.name) + '</div>' +
        (st.desc ? '<div style="font-size:11px;color:var(--text3);overflow:hidden;white-space:nowrap;text-overflow:ellipsis">' + escapeHtml(st.desc) + '</div>' : '') + '</div>' +
      '</div>' +
      '<div style="font-size:10px;color:var(--text3);font-family:var(--mono);background:var(--surface);border-radius:8px;padding:6px 10px;margin-bottom:10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + escapeHtml(lnk) + '</div>' +
      '<div style="display:flex;gap:6px">' +
        '<button onclick="event.stopPropagation();_openStoreInner(' + i + ')" class="btn btn-primary btn-sm" style="flex:1;justify-content:center"><i class="fa-solid fa-pen-to-square" style="margin-left:4px"></i> تعديل</button>' +
        '<button onclick="event.stopPropagation();previewStore(' + i + ')" class="btn btn-ghost btn-sm"><i class="fa-solid fa-eye"></i></button>' +
        '<button onclick="event.stopPropagation();copyStoreLink(' + i + ')" class="btn btn-ghost btn-sm"><i class="fa-solid fa-copy"></i></button>' +
      '</div>' +
    '</div>';
  });

  listEl.innerHTML = html;
  if(emptyEl) emptyEl.style.display = 'none';
}

function toggleStoresDropdown(btn){
  var dd=document.getElementById('stores-quick-dropdown');
  if(!dd) return;
  if(dd.style.display!=='none'){dd.style.display='none';return;}
  var stores=_getStores();
  var mainLink=getSvcLink();
  var html='<div style="padding:6px 8px;font-size:10px;font-weight:800;color:var(--text3);text-transform:uppercase;letter-spacing:.5px">المتاجر</div>';
  html+='<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:8px;cursor:pointer;font-size:12px;font-weight:700" onclick="svcPreviewPublic();document.getElementById(\'stores-quick-dropdown\').style.display=\'none\';" onmouseover="this.style.background=\'var(--surface2)\'" onmouseout="this.style.background=\'none\'">'+
    '<i class="fa-solid fa-globe" style="color:var(--accent)"></i> المتجر الرئيسي</div>';
  stores.forEach(function(st,i){
    html+='<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:8px;cursor:pointer" onclick="previewStore('+i+');document.getElementById(\'stores-quick-dropdown\').style.display=\'none\';" onmouseover="this.style.background=\'var(--surface2)\'" onmouseout="this.style.background=\'none\'">'+
      '<i class="fa-solid fa-store" style="color:var(--accent2)"></i>'+
      '<span style="flex:1;font-size:12px;font-weight:600">'+escapeHtml(st.name)+'</span>'+
      '<button onclick="event.stopPropagation();copyStoreLink('+i+');document.getElementById(\'stores-quick-dropdown\').style.display=\'none\';" class="btn btn-ghost btn-sm" style="padding:2px 6px;font-size:10px"><i class="fa-solid fa-copy"></i></button>'+
    '</div>';
  });
  if(!stores.length){
    html+='<div style="padding:12px;text-align:center;font-size:11px;color:var(--text3)">لا توجد متاجر</div>';
    html+='<div style="padding:0 6px 6px"><button onclick="switchSvcTab(\'stores\');document.getElementById(\'stores-quick-dropdown\').style.display=\'none\';" class="btn btn-primary btn-sm" style="width:100%;justify-content:center;font-size:11px">+ إنشاء متجر</button></div>';
  } else {
    html+='<div style="border-top:1px solid var(--border);margin-top:4px;padding:6px 6px 0"><button onclick="switchSvcTab(\'stores\');document.getElementById(\'stores-quick-dropdown\').style.display=\'none\';" class="btn btn-ghost btn-sm" style="width:100%;justify-content:center;font-size:11px"><i class="fa-solid fa-plus"></i> إدارة المتاجر</button></div>';
  }
  dd.innerHTML=html;
  dd.style.display='block';
  var close=function(e){if(!dd.contains(e.target)&&e.target!==btn){dd.style.display='none';document.removeEventListener('click',close);}};
  setTimeout(function(){document.addEventListener('click',close);},10);
}

function renderStoresTab(){
  var el=document.getElementById('svc-stores-tab-content'); if(!el) return;
  var stores=_getStores();
  // update badge
  var badge=document.getElementById('svc-stores-tab-badge');
  if(badge){badge.textContent=stores.length;badge.style.display=stores.length?'inline':'none';}
  el.innerHTML='<div style="margin-bottom:16px;display:flex;align-items:center;justify-content:space-between">'+
    '<div><div style="font-size:15px;font-weight:900"><i class="fa-solid fa-store" style="color:var(--accent2)"></i> المتاجر المتعددة</div>'+
    '<div style="font-size:11px;color:var(--text3)">كل متجر برابط مستقل — لعملاء أو خدمات مختلفة</div></div>'+
    '<button class="btn btn-primary" onclick="openNewStoreModal()"><i class="fa-solid fa-plus" style="margin-left:5px"></i> متجر جديد</button>'+
  '</div>'+
  // Main store card
  '<div style="background:var(--surface2);border:2px solid var(--accent);border-radius:14px;padding:14px 16px;margin-bottom:12px">'+
    '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">'+
      '<div><div style="font-size:14px;font-weight:800"><i class="fa-solid fa-house" style="color:var(--accent)"></i> المتجر الرئيسي</div>'+
      '<div style="font-size:11px;color:var(--text3);margin-top:2px;font-family:var(--mono);word-break:break-all">'+escapeHtml(getSvcLink())+'</div></div>'+
      '<div style="display:flex;gap:6px">'+
        '<button onclick="svcCopyLink()" class="btn btn-ghost btn-sm"><i class="fa-solid fa-copy"></i> نسخ</button>'+
        '<button onclick="svcPreviewPublic()" class="btn btn-primary btn-sm"><i class="fa-solid fa-eye"></i> معاينة</button>'+
      '</div>'+
    '</div>'+
  '</div>'+
  // Extra stores
  (stores.length?
    stores.map(function(st,i){
      var lnk=getSvcLink(st.id);
      return '<div style="background:var(--surface);border:1.5px solid var(--border);border-radius:12px;padding:14px 16px;margin-bottom:10px">'+
        '<div style="display:flex;align-items:start;justify-content:space-between;gap:8px;flex-wrap:wrap">'+
          '<div style="flex:1;min-width:0">'+
            '<div style="font-size:14px;font-weight:800;margin-bottom:2px">'+escapeHtml(st.name)+'</div>'+
            (st.desc?'<div style="font-size:11px;color:var(--text3);margin-bottom:4px">'+escapeHtml(st.desc)+'</div>':'')+
            '<div style="font-size:10px;color:var(--text3);font-family:var(--mono);word-break:break-all">'+escapeHtml(lnk)+'</div>'+
          '</div>'+
          '<div style="display:flex;gap:4px;flex-shrink:0">'+
            '<button data-i="'+i+'" onclick="copyStoreLink(this.dataset.i)" class="btn btn-ghost btn-sm"><i class="fa-solid fa-copy"></i></button>'+
            '<button data-i="'+i+'" onclick="previewStore(this.dataset.i)" class="btn btn-ghost btn-sm"><i class="fa-solid fa-eye"></i></button>'+
            '<button data-i="'+i+'" onclick="editStore(this.dataset.i)" class="btn btn-ghost btn-sm"><i class="fa-solid fa-pen"></i></button>'+
            '<button data-i="'+i+'" onclick="deleteStore(this.dataset.i)" class="btn btn-danger btn-sm"><i class="fa-solid fa-trash"></i></button>'+
          '</div>'+
        '</div>'+
      '</div>';
    }).join('')
  :
    '<div style="text-align:center;padding:40px 20px;color:var(--text3)">'+
      '<div style="font-size:36px;margin-bottom:12px">🏪</div>'+
      '<div style="font-size:14px;font-weight:700;margin-bottom:6px">لا توجد متاجر إضافية</div>'+
      '<div style="font-size:12px;margin-bottom:16px">أنشئ متجرًا منفصلًا لكل عميل أو نوع خدمة</div>'+
      '<button class="btn btn-primary" onclick="openNewStoreModal()"><i class="fa-solid fa-plus"></i> متجر جديد</button>'+
    '</div>'
  );
}

function renderMultiStoresList(){
  var el=document.getElementById('multi-stores-list'); if(!el) return;
  var stores=_getStores();
  if(!stores.length){
    el.innerHTML='<div style="font-size:11px;color:var(--text3);text-align:center;padding:16px">لا يوجد متاجر إضافية — المتجر الرئيسي فعّال دائماً</div>';
    return;
  }
  el.innerHTML=stores.map(function(st,i){
    var link=getSvcLink(st.id);
    return '<div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:10px 12px">'+
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">'+
        '<div style="font-size:13px;font-weight:800">'+escapeHtml(st.name)+'</div>'+
        '<div style="display:flex;gap:4px">'+
          '<button data-idx="'+i+'" onclick="copyStoreLink(this.dataset.idx)" class="btn btn-ghost btn-sm" style="font-size:10px"><i class="fa-solid fa-copy"></i></button>'+
          '<button data-idx="'+i+'" onclick="previewStore(this.dataset.idx)" class="btn btn-ghost btn-sm" style="font-size:10px"><i class="fa-solid fa-eye"></i></button>'+
          '<button data-idx="'+i+'" onclick="editStore(this.dataset.idx)" class="btn btn-ghost btn-sm" style="font-size:10px"><i class="fa-solid fa-pen"></i></button>'+
          '<button data-idx="'+i+'" onclick="deleteStore(this.dataset.idx)" class="btn btn-danger btn-sm" style="font-size:10px"><i class="fa-solid fa-trash"></i></button>'+
        '</div>'+
      '</div>'+
      '<div style="font-size:10px;color:var(--text3);word-break:break-all">'+escapeHtml(link)+'</div>'+
      (st.desc?'<div style="font-size:10px;color:var(--text2);margin-top:3px">'+escapeHtml(st.desc)+'</div>':'')+
    '</div>';
  }).join('');
}
function openNewStoreModal(editIdx){
  var stores=_getStores();
  var st=editIdx!=null?stores[editIdx]:null;
  window._storeLogoData=(st&&st.logo)||'';
  var over=document.createElement('div');
  over.className='modal-overlay';over.style.display='flex';
  var logoPrevHtml=(st&&st.logo)
    ?(_validImgSrc(st.logo)?'<img src="'+escapeHtml(st.logo)+'" style="width:100%;height:100%;object-fit:cover;border-radius:12px" onerror=\'this.style.display=\"none\"\'">':'')+''
    :'<i class="fa-solid fa-image" style="color:var(--text3);font-size:20px"></i>';
  over.innerHTML='<div class="modal" style="max-width:460px">'+
    '<div class="modal-header"><div class="modal-title"><i class="fa-solid fa-store"></i> '+(st?'تعديل المتجر':'متجر جديد')+'</div>'+
    '<button class="close-btn" onclick="this.closest(\'.modal-overlay\').remove()"><i class="fa-solid fa-xmark"></i></button></div>'+
    '<div class="form-group"><label class="form-label">اسم المتجر *</label>'+
    '<input class="form-input" id="_store-name" placeholder="مثال: متجر التصاميم" value="'+(st?escapeHtml(st.name||''):'')+'"></div>'+
    '<div class="form-group"><label class="form-label">وصف مختصر</label>'+
    '<input class="form-input" id="_store-desc" placeholder="اختياري" value="'+(st?escapeHtml(st.desc||''):'')+'"></div>'+
    '<div class="form-group">'+
      '<label class="form-label"><i class="fa-solid fa-at" style="color:var(--accent)"></i> يوزرنيم المتجر <span style="font-size:10px;color:var(--text3)">(اختياري — للرابط المخصص)</span></label>'+
      '<div style="display:flex;align-items:center;border:1.5px solid var(--border);border-radius:10px;overflow:hidden">'+
        '<span style="padding:0 10px;font-size:12px;color:var(--text3);border-left:1.5px solid var(--border);background:var(--surface2);height:40px;display:flex;align-items:center;flex-shrink:0">@</span>'+
        '<input class="form-input" id="_store-username" placeholder="my-store" value="'+(st?escapeHtml(st.username||''):'')+'" style="border:none;border-radius:0;background:transparent;direction:ltr" oninput="this.value=this.value.toLowerCase().replace(/[^a-z0-9_-]/g,\'\')">'+
      '</div>'+
      '<div style="font-size:10px;color:var(--text3);margin-top:3px">حروف إنجليزية صغيرة وأرقام و - و _ فقط</div>'+
    '</div>'+
    '<div class="form-group">'+
      '<label class="form-label"><i class="fa-solid fa-image" style="color:var(--accent)"></i> لوجو المتجر <span style="font-size:10px;color:var(--text3)">(اختياري)</span></label>'+
      '<div style="display:flex;align-items:center;gap:12px">'+
        '<div id="_store-logo-preview" style="width:54px;height:54px;border-radius:13px;background:var(--surface2);border:1.5px solid var(--border);display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0">'+logoPrevHtml+'</div>'+
        '<div style="display:flex;flex-direction:column;gap:6px">'+
          '<input type="file" id="_store-logo-input" accept="image/*" style="display:none" onchange="window._onStoreLogoChange(this)">'+
          '<button class="btn btn-ghost btn-sm" onclick="document.getElementById(\'_store-logo-input\').click()"><i class="fa-solid fa-upload" style="margin-left:4px"></i> رفع لوجو</button>'+
          (st&&st.logo?'<button class="btn btn-ghost btn-sm" id="_store-logo-clear" onclick="window._clearStoreLogoModal()"><i class="fa-solid fa-xmark" style="margin-left:4px"></i> إزالة</button>':'<button class="btn btn-ghost btn-sm" id="_store-logo-clear" style="display:none" onclick="window._clearStoreLogoModal()"><i class="fa-solid fa-xmark" style="margin-left:4px"></i> إزالة</button>')+
        '</div>'+
      '</div>'+
    '</div>'+
    '<div style="display:flex;gap:8px;margin-top:8px">'+
    '<button class="btn btn-primary" style="flex:1;justify-content:center" onclick="_saveStore('+(editIdx!=null?editIdx:'null')+',this)"><i class="fa-solid fa-floppy-disk" style="margin-left:5px"></i> حفظ المتجر</button>'+
    '<button class="btn btn-ghost" onclick="this.closest(\'.modal-overlay\').remove()">إلغاء</button></div></div>';
  document.body.appendChild(over);
  over.onclick=function(e){if(e.target===over)over.remove();};
}
window._onStoreLogoChange=function(input){
  var file=input.files[0]; if(!file) return;
  if(file.size>5*1024*1024){toast('<i class="fa-solid fa-triangle-exclamation"></i> الصورة أكبر من 5 ميجا');input.value='';return;}
  toast('<i class="fa-solid fa-spinner fa-spin"></i> جاري رفع اللوجو...');
  uploadToStorage(file,'store_logos',function(url){
    window._storeLogoData=url;
    var pv=document.getElementById('_store-logo-preview');
    if(pv) pv.innerHTML='<img src="'+url+'" style="width:100%;height:100%;object-fit:cover;border-radius:12px">';
    var cl=document.getElementById('_store-logo-clear'); if(cl) cl.style.display='';
    toast('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم رفع اللوجو');
  },function(){ toast('<i class="fa-solid fa-triangle-exclamation"></i> فشل رفع اللوجو'); });
};
window._clearStoreLogoModal=function(){
  window._storeLogoData='';
  var pv=document.getElementById('_store-logo-preview');
  if(pv) pv.innerHTML='<i class="fa-solid fa-image" style="color:var(--text3);font-size:20px"></i>';
  var cl=document.getElementById('_store-logo-clear'); if(cl) cl.style.display='none';
  var inp=document.getElementById('_store-logo-input'); if(inp) inp.value='';
};
function _saveStore(editIdx, btn){
  var modal=btn.closest('.modal-overlay');
  var name=(modal.querySelector('#_store-name')||{}).value.trim();
  var desc=(modal.querySelector('#_store-desc')||{}).value.trim();
  var username=(modal.querySelector('#_store-username')||{}).value.trim().toLowerCase().replace(/[^a-z0-9_-]/g,'')||'';
  var logo=window._storeLogoData||'';
  if(!name){toast('<i class="fa-solid fa-triangle-exclamation"></i> أدخل اسم المتجر');return;}
  if(!S.stores) S.stores=[];
  if(editIdx!=null && editIdx>=0){
    S.stores[editIdx].name=name; S.stores[editIdx].desc=desc;
    S.stores[editIdx].username=username;
    if(logo) S.stores[editIdx].logo=logo;
    else if(window._storeLogoData==='') S.stores[editIdx].logo='';
  } else {
    S.stores.push({id:'store_'+Date.now()+'_'+Math.random().toString(36).slice(2,7),name:name,desc:desc,username:username,logo:logo,createdAt:new Date().toISOString()});
  }
  window._storeLogoData='';
  lsSave(); cloudSaveNow(S); modal.remove(); renderMultiStoresList(); renderStoresHomeList();
  toast('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم حفظ المتجر');
}
function copyStoreLink(idx){ var link=getSvcLink(_getStores()[idx]?.id); navigator.clipboard.writeText(link).then(function(){toast('<i class="fa-solid fa-copy"></i> تم نسخ الرابط');}).catch(function(){toast(link);}); }
function previewStore(idx){ window.open(getSvcLink(_getStores()[idx]?.id),'_blank'); }
function editStore(idx){ openNewStoreModal(idx); }
function deleteStore(idx){
  confirmDel('حذف هذا المتجر؟',function(){
    S.stores.splice(idx,1); lsSave(); cloudSaveNow(S); renderMultiStoresList(); renderStoresHomeList();
    toast('<i class="fa-solid fa-trash"></i> تم حذف المتجر');
  });
}
function svcCopyLink(){
  var link = getSvcLink();
  var el = document.getElementById('svc-link-text');
  if(el) el.textContent = link;
  navigator.clipboard.writeText(link).then(()=>toast('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم نسخ الرابط'))
    .catch(()=>{ var t=document.createElement('textarea');t.value=link;document.body.appendChild(t);t.select();document.execCommand('copy');t.remove();toast('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم نسخ الرابط'); });
}
function svcPreviewPublic(){
  window.open(getSvcLink(), '_blank');
}
function svcShareWhatsApp(){
  window.open('https://wa.me/?text='+encodeURIComponent('<i class="fa-solid fa-bag-shopping"></i> اطلب خدماتي: '+getSvcLink()),'_blank');
}
function switchSvcTab(tab){
  var tabs=['services','packages','portfolio','website','orders','stores'];
  tabs.forEach(function(t){
    var btn=document.getElementById('svctab-'+t);
    // services tab maps to svc-services-wrap
    var wrapId = t==='services' ? 'svc-services-wrap' : 'svc-'+t+'-wrap';
    var wrap=document.getElementById(wrapId);
    if(btn){ btn.classList.toggle('btn-primary', t===tab); btn.classList.toggle('btn-ghost', t!==tab); }
    if(wrap) wrap.style.display = (t===tab) ? '' : 'none';
  });
  if(tab==='orders') renderSvcOrdersTable();
  if(tab==='packages') renderStandalonePackages();
  if(tab==='portfolio') renderPortfolioProjects();
  if(tab==='website') initWebsiteTab();
  if(tab==='stores') renderStoresTab();
}

// ══════════════════════════════════
// WEBSITE TAB
// ══════════════════════════════════
function initWebsiteTab(){
  renderMultiStoresList();
  var _stIdx = _currentStoreIdx;
  var _curSt = (_stIdx != null) ? (_getStores()[_stIdx] || null) : null;
  // رابط الموقع
  try{
    var wl=document.getElementById('svc-website-link-preview');
    var lnk=getSvcLink(_curSt ? _curSt.id : null);
    if(wl){ wl.textContent=lnk; wl.title='انقر للمعاينة'; wl.style.cursor='pointer'; wl.onclick=function(){window.open(lnk,'_blank');}; }
  }catch(e){}
  // وصف الموقع
  var descEl=document.getElementById('svc-site-desc');
  if(descEl) descEl.value=(_curSt ? (_curSt.desc||'') : (S.settings&&S.settings.svc_site_desc)||'');
  // استقبال الطلبات
  var isOpen=(S.settings&&S.settings.svc_orders_open!==false);
  _setOrdersOpenUI(isOpen);
  // سوشيال ميديا
  var socs=(S.settings&&S.settings.socials)||[];
  ['instagram','behance','tiktok','twitter','whatsapp'].forEach(function(k){
    var el=document.getElementById('social-'+k); if(!el) return;
    var found=socs.find(function(s){return s.type===k||s.platform===k;});
    el.value=found?(found.url||found.link||''):'';
  });
  // يوزرنيم الموقع
  var unInp=document.getElementById('svc-main-username');
  var un=(S.settings&&S.settings.username)||'';
  if(unInp) unInp.value=un;
  var unPv=document.getElementById('svc-un-live-preview'); if(unPv) unPv.textContent=un||'...';
  // لوجو المتجر (محفوظ في store_logo - للمتجر والتاب فقط)
  _svcLogoData='';
  var logo=(S.settings&&S.settings.store_logo)||'';
  var logoPv=document.getElementById('svc-logo-preview');
  var logoCl=document.getElementById('svc-logo-clear-btn');
  if(logoPv){
    if(logo){
      if(_validImgSrc(logo)) logoPv.innerHTML='<img src="'+escapeHtml(logo)+'" style="width:100%;height:100%;object-fit:cover;border-radius:12px" onerror=\'this.style.display=\"none\"\'">';
      if(logoCl) logoCl.style.display='';
    } else {
      logoPv.innerHTML='<i class="fa-solid fa-image" style="color:var(--text3);font-size:22px"></i>';
      if(logoCl) logoCl.style.display='none';
    }
  }
  // banner — per store
  var stBanner = _curSt ? (_curSt.banner||'') : (S.settings&&S.settings.svc_banner||'');
  var sz = _curSt ? (_curSt.banner_size||'md') : ((S.settings&&S.settings.svc_banner_size)||'md');
  ['sm','md','lg','custom'].forEach(function(s){ var b=document.getElementById('banner-size-'+s); if(b){ b.classList.toggle('active',s===sz); } });
  var customWrap=document.getElementById('banner-custom-px-wrap');
  if(customWrap) customWrap.style.display=(sz==='custom'?'flex':'none');
  if(sz==='custom'){
    var inp=document.getElementById('banner-custom-px');
    if(inp) inp.value=(_curSt ? (_curSt.banner_custom_px||300) : (S.settings&&S.settings.svc_banner_custom_px)||300);
  }
  var bannerPv=document.getElementById('svc-banner-preview'); var bannerIm=document.getElementById('svc-banner-img'); var bannerCl=document.getElementById('svc-banner-clear-btn');
  if(stBanner){ if(bannerPv) bannerPv.style.display=''; if(bannerIm) bannerIm.src=stBanner; if(bannerCl) bannerCl.style.display=''; }
  else { if(bannerPv) bannerPv.style.display='none'; if(bannerCl) bannerCl.style.display='none'; }
}
function _setOrdersOpenUI(isOpen){
  var tog=document.getElementById('orders-open-toggle');
  var knob=document.getElementById('orders-open-knob');
  var lbl=document.getElementById('orders-status-label');
  var sub=document.getElementById('orders-status-sub');
  if(tog) tog.style.background=isOpen?'var(--accent3)':'var(--border)';
  if(knob) knob.style.right=isOpen?'3px':'calc(100% - 25px)';
  if(lbl) lbl.innerHTML=isOpen?'<i class="fa-solid fa-circle-check" style="color:var(--accent3);margin-left:5px"></i> متاح لاستقبال الطلبات':'<i class="fa-solid fa-circle-xmark" style="color:var(--accent4);margin-left:5px"></i> مغلق — لا يستقبل طلبات';
  if(sub) sub.textContent=isOpen?'العملاء يمكنهم إرسال طلبات الآن':'الموقع لا يستقبل طلبات جديدة حالياً';
}
function toggleOrdersOpen(){
  if(!S.settings) S.settings={};
  S.settings.svc_orders_open=!(S.settings.svc_orders_open!==false);
  _setOrdersOpenUI(S.settings.svc_orders_open);
  lsSave(); cloudSaveNow(S); toast(S.settings.svc_orders_open?'✅ فُتح الاستقبال':'⏸ أُغلق الاستقبال');
}
function saveSiteDesc(){
  if(!S.settings) S.settings={};
  S.settings.svc_site_desc=(document.getElementById('svc-site-desc')||{}).value||'';
  lsSave(); cloudSaveNow(S); toast('✅ تم حفظ الوصف');
}

// ── لوجو الموقع الرئيسي ──
var _svcLogoData='';
function handleSvcLogo(input){
  var file=input.files[0]; if(!file) return;
  if(file.size>5*1024*1024){toast('<i class="fa-solid fa-triangle-exclamation"></i> الصورة أكبر من 5 ميجا');input.value='';return;}
  toast('<i class="fa-solid fa-spinner fa-spin"></i> جاري رفع اللوجو...');
  uploadToStorage(file,'store_logos',function(url){
    _svcLogoData=url;
    var pv=document.getElementById('svc-logo-preview');
    if(pv) pv.innerHTML='<img src="'+url+'" style="width:100%;height:100%;object-fit:cover;border-radius:12px">';
    var cl=document.getElementById('svc-logo-clear-btn'); if(cl) cl.style.display='';
    toast('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم رفع اللوجو — اضغط "حفظ اللوجو" لتأكيد الحفظ');
  },function(){ toast('<i class="fa-solid fa-triangle-exclamation"></i> فشل رفع اللوجو'); });
}
function clearSvcLogo(){
  _svcLogoData='';
  if(!S.settings) S.settings={};
  S.settings.store_logo='';
  var pv=document.getElementById('svc-logo-preview');
  if(pv) pv.innerHTML='<i class="fa-solid fa-image" style="color:var(--text3);font-size:22px"></i>';
  var cl=document.getElementById('svc-logo-clear-btn'); if(cl) cl.style.display='none';
  var inp=document.getElementById('svc-logo-input'); if(inp) inp.value='';
  lsSave(); cloudSaveNow(S); toast('تم إزالة لوجو المتجر');
}
function saveSvcLogo(){
  if(!S.settings) S.settings={};
  var logo=_svcLogoData||S.settings.store_logo||'';
  if(!logo){toast('<i class="fa-solid fa-triangle-exclamation"></i> ارفع لوجو أولاً');return;}
  // حفظ في store_logo فقط — للمتجر والتاب فقط، مش السايدبار
  S.settings.store_logo=logo; _svcLogoData='';
  lsSave(); cloudSaveNow(S);
  toast('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم حفظ لوجو المتجر — سيظهر في المتجر وتاب المتجر');
}

// ── يوزرنيم الموقع ──
async function saveSvcUsername(){
  var inp=document.getElementById('svc-main-username'); if(!inp) return;
  var un=inp.value.trim().toLowerCase().replace(/[^a-z0-9_-]/g,'');
  if(!un){toast('<i class="fa-solid fa-triangle-exclamation"></i> أدخل يوزرنيم أولاً');return;}
  if(un.length<3){toast('<i class="fa-solid fa-triangle-exclamation"></i> الاسم قصير جداً (3 أحرف على الأقل)');return;}
  if(!_supaUserId){toast('<i class="fa-solid fa-triangle-exclamation"></i> يجب تسجيل الدخول أولاً');return;}
  // Check uniqueness
  toast('<i class="fa-solid fa-spinner fa-spin"></i> جاري التحقق...');
  try{
    var res=await supa.from('studio_data').select('user_id').eq('username_index',un).neq('user_id',_supaUserId).maybeSingle();
    if(res.data){toast('<i class="fa-solid fa-circle-xmark" style="color:var(--accent4)"></i> الاسم @'+un+' محجوز، جرب اسماً آخر');return;}
  }catch(e){}
  if(!S.settings) S.settings={};
  S.settings.username=un;
  var setInp=document.getElementById('set-username'); if(setInp) setInp.value=un;
  var pv=document.getElementById('svc-un-live-preview'); if(pv) pv.textContent=un;
  // Force save with username_index
  S._savedAt=new Date().toISOString();
  try{
    const payload={user_id:_supaUserId,data:JSON.stringify(S),updated_at:S._savedAt,username_index:un};
    await supa.from('studio_data').upsert(payload,{onConflict:'user_id'});
  }catch(e2){ lsSave(); cloudSaveNow(S); }
  lsSave();
  toast('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم حفظ اليوزرنيم: @'+un);
  // تحديث الرابط في الـ header
  try{ var lnk=document.getElementById('svc-inner-store-link'); if(lnk) lnk.textContent=getSvcLink(_getCurrentStoreId()); }catch(e){}
}

// ── حفظ البانر ──
function saveSvcBannerNow(){
  var banner=(_currentStoreIdx!=null&&_getStores()[_currentStoreIdx]&&_getStores()[_currentStoreIdx].banner)||S.settings&&S.settings.svc_banner||'';
  if(!banner){toast('<i class="fa-solid fa-triangle-exclamation"></i> ارفع بانر أولاً');return;}
  lsSave(); cloudSaveNow(S);
  toast('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم حفظ البانر');
}
function saveSocials(){
  if(!S.settings) S.settings={};
  var socs=[];
  ['instagram','behance','tiktok','twitter','whatsapp'].forEach(function(k){
    var el=document.getElementById('social-'+k); if(!el) return;
    var v=(el.value||'').trim(); if(v) socs.push({type:k,url:v});
  });
  S.settings.socials=socs;
  lsSave(); cloudSaveNow(S); toast('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم حفظ الروابط');
}
function setSvcBannerSize(sz){
  var _stIdx=_currentStoreIdx;
  var _curSt=(_stIdx!=null)?(_getStores()[_stIdx]||null):null;
  if(_curSt){ _curSt.banner_size=sz; }
  else { if(!S.settings) S.settings={}; S.settings.svc_banner_size=sz; }
  ['sm','md','lg','custom'].forEach(function(s){ var b=document.getElementById('banner-size-'+s); if(b) b.classList.toggle('active',s===sz); });
  var customWrap=document.getElementById('banner-custom-px-wrap');
  if(customWrap) customWrap.style.display=(sz==='custom'?'flex':'none');
  if(sz==='custom'){
    var inp=document.getElementById('banner-custom-px');
    if(inp) inp.value=(_curSt?(_curSt.banner_custom_px||300):(S.settings&&S.settings.svc_banner_custom_px)||300);
  }
  lsSave(); cloudSaveNow(S); toast('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم تغيير حجم البانر');
}
function saveBannerCustomPx(){
  if(!S.settings) S.settings={};
  var v=parseInt((document.getElementById('banner-custom-px')||{}).value)||300;
  if(v<80) v=80; if(v>800) v=800;
  S.settings.svc_banner_custom_px=v;
  lsSave(); cloudSaveNow(S);
}

// ══════════════════════════════════
// STANDALONE PACKAGES
// ══════════════════════════════════
var _pkgStActive=true;
function openPkgStandaloneModal(id){
  _pkgStActive=true; _pkgStThumbData='';
  var ptPrev=document.getElementById('pkg-st-thumb-preview'); if(ptPrev){ptPrev.src='';ptPrev.style.display='none';}
  var ptNm=document.getElementById('pkg-st-thumb-name'); if(ptNm) ptNm.textContent='لا توجد صورة';
  var ptCl=document.getElementById('pkg-st-thumb-clear'); if(ptCl) ptCl.style.display='none';
  var ptInp=document.getElementById('pkg-st-thumb-input'); if(ptInp) ptInp.value='';
  document.getElementById('pkg-standalone-title').innerHTML=id?'<i class="fa-solid fa-box"></i> تعديل الباقة':'<i class="fa-solid fa-box"></i> باقة جديدة';
  document.getElementById('pkg-st-id').value=id||'';
  ['pkg-st-name','pkg-st-price','pkg-st-desc','pkg-st-delivery','pkg-st-revisions','pkg-st-payment-link'].forEach(function(i){ var el=document.getElementById(i); if(el) el.value=''; });
  var curSel=document.getElementById('pkg-st-currency'); if(curSel) curSel.value='ج.م';
  document.getElementById('pkg-st-items').value='';
  // populate portfolio cats
  var pfCatSel=document.getElementById('pkg-st-portfolio-cat');
  if(pfCatSel){
    var cats=_getPfCats();
    pfCatSel.innerHTML='<option value="">— ربط بتصنيف بورتفوليو —</option>'+cats.map(function(c){ return '<option value="'+escapeHtml(c)+'">'+escapeHtml(c)+'</option>'; }).join('');
  }
  if(id){
    var pkg=(S.standalone_packages||[]).find(function(p){return String(p.id)===String(id);});
    if(pkg){
      document.getElementById('pkg-st-name').value=pkg.name||'';
      document.getElementById('pkg-st-price').value=pkg.price||'';
      if(curSel) curSel.value=pkg.currency||'ج.م';
      document.getElementById('pkg-st-desc').value=pkg.desc||'';
      document.getElementById('pkg-st-delivery').value=pkg.delivery||'';
      document.getElementById('pkg-st-revisions').value=pkg.revisions||'';
      document.getElementById('pkg-st-items').value=(pkg.items||[]).join('\n');
      var plEl=document.getElementById('pkg-st-payment-link'); if(plEl) plEl.value=pkg.payment_link||'';
      if(pfCatSel) pfCatSel.value=pkg.portfolio_cat||'';
      if(pkg.thumb){ _pkgStThumbData=pkg.thumb; var ptP=document.getElementById('pkg-st-thumb-preview'); if(ptP){ptP.src=pkg.thumb;ptP.style.display='';} var ptN=document.getElementById('pkg-st-thumb-name'); if(ptN) ptN.textContent='صورة محفوظة'; var ptC=document.getElementById('pkg-st-thumb-clear'); if(ptC) ptC.style.display=''; }
      _pkgStActive=pkg.active!==false;
    }
  }
  _updatePkgStToggle();
  openM('modal-pkg-standalone');
}
function togglePkgStActive(){ _pkgStActive=!_pkgStActive; _updatePkgStToggle(); }
var _pkgStThumbData='';
function handlePkgStThumb(input){
  var file=input.files[0]; if(!file) return;
  if(file.size>5*1024*1024){ toast('<i class="fa-solid fa-triangle-exclamation"></i> حجم الصورة أكبر من 5 ميجا'); input.value=''; return; }
  toast('<i class="fa-solid fa-spinner fa-spin"></i> جاري رفع الصورة...');
  var ext=file.name.split('.').pop()||'jpg';
  var path='pkg_images/'+(_supaUserId||'anon')+'_'+Date.now()+'.'+ext;
  supa.storage.from('media').upload(path, file, {upsert:true, contentType:file.type})
    .then(function(res){
      if(res.error){ _handlePkgStThumbBase64(file); return; }
      var urlRes=supa.storage.from('media').getPublicUrl(path);
      var publicUrl=urlRes.data?.publicUrl||'';
      if(!publicUrl){ _handlePkgStThumbBase64(file); return; }
      _pkgStThumbData=publicUrl;
      var pv=document.getElementById('pkg-st-thumb-preview'); if(pv){pv.src=publicUrl;pv.style.display='';}
      var nm=document.getElementById('pkg-st-thumb-name'); if(nm) nm.textContent=file.name;
      var cl=document.getElementById('pkg-st-thumb-clear'); if(cl) cl.style.display='';
      toast('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم رفع الصورة');
    }).catch(function(){ _handlePkgStThumbBase64(file); });
}
function _handlePkgStThumbBase64(file){
  var reader=new FileReader();
  reader.onload=function(e){
    var b64=e.target.result;
    _pkgStThumbData=b64;
    var pv=document.getElementById('pkg-st-thumb-preview'); if(pv){pv.src=b64;pv.style.display='';}
    var nm=document.getElementById('pkg-st-thumb-name'); if(nm) nm.textContent=file.name;
    var cl=document.getElementById('pkg-st-thumb-clear'); if(cl) cl.style.display='';
    toast('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم تحميل الصورة');
  };
  reader.onerror=function(){ toast('<i class="fa-solid fa-triangle-exclamation"></i> فشل تحميل الصورة'); };
  reader.readAsDataURL(file);
}
function clearPkgStThumb(){
  _pkgStThumbData='';
  var pv=document.getElementById('pkg-st-thumb-preview'); if(pv){pv.src='';pv.style.display='none';}
  var nm=document.getElementById('pkg-st-thumb-name'); if(nm) nm.textContent='لا توجد صورة';
  var cl=document.getElementById('pkg-st-thumb-clear'); if(cl) cl.style.display='none';
  var inp=document.getElementById('pkg-st-thumb-input'); if(inp) inp.value='';
}
function _updatePkgStToggle(){
  var tog=document.getElementById('pkg-st-active-toggle');
  var knob=document.getElementById('pkg-st-active-knob');
  if(tog) tog.style.background=_pkgStActive?'var(--accent3)':'var(--border)';
  if(knob) knob.style.right=_pkgStActive?'3px':'calc(100% - 23px)';
}
function savePkgStandalone(){
  var name=(document.getElementById('pkg-st-name')||{}).value||''; if(!name.trim()){ toast('<i class="fa-solid fa-triangle-exclamation"></i> أدخل اسم الباقة'); return; }
  var price=(document.getElementById('pkg-st-price')||{}).value||'';
  var desc=(document.getElementById('pkg-st-desc')||{}).value||'';
  var delivery=(document.getElementById('pkg-st-delivery')||{}).value||'';
  var revisions=(document.getElementById('pkg-st-revisions')||{}).value||'';
  var itemsRaw=(document.getElementById('pkg-st-items')||{}).value||'';
  var items=itemsRaw.split('\n').map(function(s){return s.trim();}).filter(Boolean);
  var pfCat=(document.getElementById('pkg-st-portfolio-cat')||{}).value||'';
  var eid=(document.getElementById('pkg-st-id')||{}).value||'';
  var _storeId = _getCurrentStoreId();
  var d={name:name.trim(),price:+price||0,desc:desc.trim(),delivery:delivery.trim(),revisions:+revisions||0,items:items,portfolio_cat:pfCat,thumb:_pkgStThumbData,active:_pkgStActive,store_id:_storeId,currency:(document.getElementById('pkg-st-currency')||{}).value||'ج.م',payment_link:((document.getElementById('pkg-st-payment-link')||{}).value||'').trim(),updatedAt:new Date().toISOString()};
  if(!S.standalone_packages) S.standalone_packages=[];
  if(eid){ var i=S.standalone_packages.findIndex(function(p){return String(p.id)===String(eid);}); if(i>-1){d.id=+eid;d.createdAt=S.standalone_packages[i].createdAt||d.updatedAt;S.standalone_packages[i]=d;} }
  else { d.id=Date.now(); d.createdAt=d.updatedAt; S.standalone_packages.push(d); }
  lsSave(); 
  showUploadProgress('📦 جاري رفع الباقة...');
  setTimeout(async function(){
    try { await _doCloudSave(S); hideUploadProgress('✅ تم رفع الباقة بنجاح!'); }
    catch(e) { hideUploadProgress('⚠️ تم الحفظ محلياً'); }
  }, 100);
  closeM('modal-pkg-standalone'); renderStandalonePackages(); toast('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم حفظ الباقة');
}
function delPkgStandalone(id){
  if(!confirm('حذف هذه الباقة؟')) return;
  S.standalone_packages=(S.standalone_packages||[]).filter(function(p){return String(p.id)!==String(id);});
  lsSave(); cloudSave(S); renderStandalonePackages(); toast('<i class="fa-solid fa-trash"></i> تم الحذف');
}
function renderStandalonePackages(){
  var grid=document.getElementById('svc-standalone-pkgs-grid'); if(!grid) return;
  var _activeStoreId = _getCurrentStoreId();
  var pkgs=(S.standalone_packages||[]).filter(function(p){
    if(_activeStoreId === null) return !p.store_id;
    return p.store_id === _activeStoreId;
  });
  if(!pkgs.length){
    grid.innerHTML='<div class="empty card" style="grid-column:span 3;padding:50px 20px;text-align:center"><div style="font-size:52px;margin-bottom:14px"><i class="fa-solid fa-box"></i></div><div style="font-size:17px;font-weight:800;margin-bottom:8px">لا توجد باقات في هذا المتجر</div><div style="font-size:13px;color:var(--text3);margin-bottom:20px">أنشئ باقاتك وأعرضها في متجرك</div><button onclick="openPkgStandaloneModal()" class="btn btn-primary">+ إنشاء باقة</button></div>';
    return;
  }
  grid.innerHTML=pkgs.map(function(pkg){
    var isActive=pkg.active!==false;
    var cur=pkg.currency||_getCurrency();
    return '<div style="background:var(--surface2);border:1.5px solid var(--border);border-radius:16px;overflow:hidden;display:flex;flex-direction:column">'+
      (pkg.thumb
        ?'<div style="width:100%;height:120px;overflow:hidden"><img src="'+escapeHtml(pkg.thumb)+'" style="width:100%;height:100%;object-fit:cover" onerror="this.parentNode.style.display=\'none\'"></div>'
        :'<div style="width:100%;height:70px;background:linear-gradient(135deg,var(--surface3),var(--surface2));display:flex;align-items:center;justify-content:center"><i class=\"fa-solid fa-box\" style=\"font-size:26px;color:var(--text3)\"></i></div>')+
      '<div style="padding:14px;display:flex;flex-direction:column;gap:8px;flex:1">'+
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:6px">'+
          '<div style="font-size:14px;font-weight:900">'+escapeHtml(pkg.name)+'</div>'+
          '<span style="font-size:10px;padding:2px 8px;border-radius:20px;font-weight:700;white-space:nowrap;flex-shrink:0;background:'+(isActive?'rgba(79,209,165,.12)':'rgba(255,107,107,.1)')+';color:'+(isActive?'var(--accent3)':'var(--accent4)')+'">'+(isActive?'● نشطة':'○ موقوفة')+'</span>'+
        '</div>'+
        (pkg.desc?'<div style="font-size:11px;color:var(--text3)">'+escapeHtml(pkg.desc)+'</div>':'')+
        (pkg.items&&pkg.items.length?'<div style="display:flex;flex-direction:column;gap:4px">'+pkg.items.slice(0,3).map(function(it){return '<div style="font-size:11px;display:flex;align-items:center;gap:5px"><i class="fa-solid fa-check" style="color:var(--accent3);font-size:10px"></i>'+escapeHtml(it)+'</div>';}).join('')+(pkg.items.length>3?'<div style="font-size:10px;color:var(--text3)">+ '+(pkg.items.length-3)+' بنود أخرى</div>':'')+'</div>':'')+
        '<div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--border);padding-top:8px;margin-top:auto">'+
          '<div style="font-size:16px;font-weight:900;color:var(--accent)">'+(pkg.price?Number(pkg.price).toLocaleString()+' '+cur:'مجاني')+'</div>'+
          '<div style="display:flex;gap:6px">'+
            '<button data-pid="'+pkg.id+'" onclick="openPkgStandaloneModal(+this.dataset.pid)" class="btn btn-ghost btn-sm"><i class="fa-solid fa-pen"></i></button>'+
            '<button data-pid="'+pkg.id+'" onclick="duplicatePkg(+this.dataset.pid)" class="btn btn-ghost btn-sm" title="تكرار الباقة" style="color:var(--accent)"><i class="fa-solid fa-copy"></i></button>'+
            '<button data-pid="'+pkg.id+'" onclick="delPkgStandalone(+this.dataset.pid)" class="btn btn-danger btn-sm"><i class="fa-solid fa-trash"></i></button>'+
          '</div>'+
        '</div>'+
      '</div>'+
    '</div>';
  }).join('');
}

// ══════════════════════════════════
// PORTFOLIO PROJECTS
// ══════════════════════════════════
var _DEFAULT_PF_CATS=['سوشيال ميديا','تصميم جرافيك','برمجة وتطوير','فيديو وموشن','كتابة ومحتوى','هوية بصرية','أخرى'];
function _getPfCats(){
  try{ var c=JSON.parse(localStorage.getItem('_pfCats')||'null'); if(Array.isArray(c)) return c; }catch(e){}
  return _DEFAULT_PF_CATS.slice();
}
function _savePfCats(arr){ localStorage.setItem('_pfCats',JSON.stringify(arr)); }
var _pfThumbData='';
function openPortfolioProjectModal(id){
  _pfThumbData='';
  document.getElementById('portfolio-project-modal-title').innerHTML=id?'<i class="fa-solid fa-image"></i> تعديل المشروع':'<i class="fa-solid fa-image"></i> مشروع جديد';
  document.getElementById('pf-proj-id').value=id||'';
  ['pf-proj-name','pf-proj-desc','pf-proj-url'].forEach(function(i){ var el=document.getElementById(i); if(el) el.value=''; });
  var preview=document.getElementById('pf-proj-thumb-preview'); if(preview){preview.src='';preview.style.display='none';}
  var nm=document.getElementById('pf-proj-thumb-name'); if(nm) nm.textContent='لا توجد صورة';
  var cl=document.getElementById('pf-proj-thumb-clear'); if(cl) cl.style.display='none';
  var inp=document.getElementById('pf-proj-thumb-input'); if(inp) inp.value='';
  // populate cats
  var catSel=document.getElementById('pf-proj-cat');
  if(catSel){
    var cats=_getPfCats();
    catSel.innerHTML='<option value="">— اختر —</option>'+cats.map(function(c){return '<option value="'+escapeHtml(c)+'">'+escapeHtml(c)+'</option>';}).join('');
  }
  if(id){
    var proj=(S.portfolio_projects||[]).find(function(p){return String(p.id)===String(id);});
    if(proj){
      document.getElementById('pf-proj-name').value=proj.name||'';
      document.getElementById('pf-proj-desc').value=proj.desc||'';
      document.getElementById('pf-proj-url').value=proj.url||'';
      if(catSel) catSel.value=proj.cat||'';
      var lt=document.getElementById('pf-proj-link-type'); if(lt) lt.value=proj.link_type||'behance';
      if(proj.thumb){ _pfThumbData=proj.thumb; var pv=document.getElementById('pf-proj-thumb-preview'); if(pv){pv.src=proj.thumb;pv.style.display='';} var cn=document.getElementById('pf-proj-thumb-name'); if(cn) cn.textContent='صورة محفوظة'; var cc=document.getElementById('pf-proj-thumb-clear'); if(cc) cc.style.display=''; }
    }
  }
  openM('modal-portfolio-project');
}
function handlePfProjThumb(input){
  var file=input.files[0]; if(!file) return;
  if(file.size>5*1024*1024){ toast('<i class="fa-solid fa-triangle-exclamation"></i> حجم الصورة أكبر من 5 ميجا'); input.value=''; return; }
  toast('<i class="fa-solid fa-spinner fa-spin"></i> جاري رفع الصورة...');
  var ext=file.name.split('.').pop()||'jpg';
  var path='pf_images/'+(_supaUserId||'anon')+'_'+Date.now()+'.'+ext;
  supa.storage.from('media').upload(path, file, {upsert:true, contentType:file.type})
    .then(function(res){
      if(res.error){ _handlePfProjThumbBase64(file); return; }
      var urlRes=supa.storage.from('media').getPublicUrl(path);
      var publicUrl=urlRes.data?.publicUrl||'';
      if(!publicUrl){ _handlePfProjThumbBase64(file); return; }
      _pfThumbData=publicUrl;
      var pv=document.getElementById('pf-proj-thumb-preview'); if(pv){pv.src=publicUrl;pv.style.display='';}
      var nm=document.getElementById('pf-proj-thumb-name'); if(nm) nm.textContent=file.name;
      var cl=document.getElementById('pf-proj-thumb-clear'); if(cl) cl.style.display='';
      toast('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم رفع الصورة');
    }).catch(function(){ _handlePfProjThumbBase64(file); });
}
function _handlePfProjThumbBase64(file){
  toast('<i class="fa-solid fa-triangle-exclamation"></i> Storage غير متاح — تأكد من إنشاء bucket اسمه "media" في Supabase');
}
function clearPfProjThumb(){
  _pfThumbData='';
  var pv=document.getElementById('pf-proj-thumb-preview'); if(pv){pv.src='';pv.style.display='none';}
  var nm=document.getElementById('pf-proj-thumb-name'); if(nm) nm.textContent='لا توجد صورة';
  var cl=document.getElementById('pf-proj-thumb-clear'); if(cl) cl.style.display='none';
  var inp=document.getElementById('pf-proj-thumb-input'); if(inp) inp.value='';
}
function savePortfolioProject(){
  var name=(document.getElementById('pf-proj-name')||{}).value||''; if(!name.trim()){toast('<i class="fa-solid fa-triangle-exclamation"></i> أدخل اسم المشروع');return;}
  var cat=(document.getElementById('pf-proj-cat')||{}).value||''; if(!cat){toast('<i class="fa-solid fa-triangle-exclamation"></i> اختر تصنيفاً');return;}
  var desc=(document.getElementById('pf-proj-desc')||{}).value||'';
  var url=(document.getElementById('pf-proj-url')||{}).value||'';
  var link_type=(document.getElementById('pf-proj-link-type')||{}).value||'behance';
  var eid=(document.getElementById('pf-proj-id')||{}).value||'';
  var d={name:name.trim(),cat:cat,desc:desc.trim(),url:url.trim(),link_type:link_type,thumb:_pfThumbData,createdAt:new Date().toISOString()};
  if(!S.portfolio_projects) S.portfolio_projects=[];
  if(eid){ var i=S.portfolio_projects.findIndex(function(p){return String(p.id)===String(eid);}); if(i>-1){d.id=+eid;d.createdAt=S.portfolio_projects[i].createdAt||d.createdAt;S.portfolio_projects[i]=d;} }
  else { d.id=Date.now(); S.portfolio_projects.push(d); }
  lsSave(); 
  showUploadProgress('🖼 جاري رفع المشروع...');
  setTimeout(async function(){
    try { await _doCloudSave(S); hideUploadProgress('✅ تم رفع المشروع بنجاح!'); }
    catch(e) { hideUploadProgress('⚠️ تم الحفظ محلياً'); }
  }, 100);
  closeM('modal-portfolio-project'); renderPortfolioProjects(); toast('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم حفظ المشروع');
}
function delPortfolioProject(id){
  if(!confirm('حذف هذا المشروع؟')) return;
  S.portfolio_projects=(S.portfolio_projects||[]).filter(function(p){return String(p.id)!==String(id);});
  lsSave(); cloudSave(S); renderPortfolioProjects(); toast('<i class="fa-solid fa-trash"></i> تم الحذف');
}
var _pfActiveCat='';
function renderPortfolioProjects(){
  var cats=_getPfCats();
  var filterEl=document.getElementById('portfolio-cat-filters');
  if(filterEl){
    filterEl.innerHTML='<button onclick="filterPfCat(\'\')" class="filter-chip'+(!_pfActiveCat?' active':'')+'">الكل</button>'+
      cats.map(function(c){return '<button onclick="filterPfCat(\''+escapeHtml(c)+'\')" class="filter-chip'+(_pfActiveCat===c?' active':'')+'">'+escapeHtml(c)+'</button>';}).join('');
  }
  var grid=document.getElementById('portfolio-projects-grid'); if(!grid) return;
  var projs=(S.portfolio_projects||[]).filter(function(p){return !_pfActiveCat||p.cat===_pfActiveCat;});
  if(!projs.length){
    grid.innerHTML='<div class="empty card" style="grid-column:span 3;padding:50px 20px;text-align:center"><div style="font-size:52px;margin-bottom:14px"><i class="fa-solid fa-image"></i></div><div style="font-size:17px;font-weight:800;margin-bottom:8px">لا توجد مشاريع بعد</div><div style="font-size:13px;color:var(--text3);margin-bottom:20px">أضف مشاريعك لتعرضها في البورتفوليو</div><button onclick="openPortfolioProjectModal()" class="btn btn-primary">+ مشروع جديد</button></div>';
    return;
  }
  var typeIcon={'behance':'<i class="fa-solid fa-palette"></i>','drive':'<i class="fa-solid fa-folder"></i>','other':'<i class="fa-solid fa-link"></i>'};
  grid.innerHTML=projs.map(function(proj){
    return '<div style="background:var(--surface2);border:1.5px solid var(--border);border-radius:16px;overflow:hidden;display:flex;flex-direction:column">'+
      (proj.thumb?'<img src="'+escapeHtml(proj.thumb)+'" style="width:100%;height:120px;object-fit:cover;display:block" onerror="this.style.display=\'none\'">':'<div style="width:100%;height:80px;background:linear-gradient(135deg,var(--accent)22,var(--accent)0a);display:flex;align-items:center;justify-content:center;font-size:36px">'+(typeIcon[proj.link_type||'other']||'<i class="fa-solid fa-image"></i>')+'</div>')+
      '<div style="padding:12px;flex:1;display:flex;flex-direction:column;gap:6px">'+
        '<div style="font-size:11px;color:var(--accent);font-weight:700">'+escapeHtml(proj.cat||'')+'</div>'+
        '<div style="font-size:13px;font-weight:800">'+escapeHtml(proj.name)+'</div>'+
        (proj.desc?'<div style="font-size:11px;color:var(--text3);overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">'+escapeHtml(proj.desc)+'</div>':'')+
        '<div style="display:flex;gap:6px;margin-top:auto;padding-top:8px;border-top:1px solid var(--border)">'+
          (proj.url?'<a href="'+escapeHtml(proj.url)+'" target="_blank" class="btn btn-ghost btn-sm" style="flex:1;justify-content:center">↗ عرض</a>':'')+
          '<button data-pid="'+proj.id+'" onclick="openPortfolioProjectModal(+this.dataset.pid)" class="btn btn-ghost btn-sm"><i class="fa-solid fa-pen"></i></button>'+
          '<button data-pid="'+proj.id+'" onclick="duplicatePortfolioProject(+this.dataset.pid)" class="btn btn-ghost btn-sm" title="تكرار المشروع" style="color:var(--accent)"><i class="fa-solid fa-copy"></i></button>'+
          '<button data-pid="'+proj.id+'" onclick="delPortfolioProject(+this.dataset.pid)" class="btn btn-danger btn-sm"><i class="fa-solid fa-trash"></i></button>'+
        '</div>'+
      '</div></div>';
  }).join('');
}
function filterPfCat(cat){ _pfActiveCat=cat; renderPortfolioProjects(); }
function openPortfolioCatsSettings(){
  var cats=_getPfCats();
  var list=document.getElementById('pf-cats-list'); if(!list) return;
  list.innerHTML=cats.map(function(c,i){
    return '<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--surface2);border-radius:8px">'+
      '<span style="flex:1;font-size:13px">'+escapeHtml(c)+'</span>'+
      '<button data-idx="'+i+'" onclick="_delPfCat(+this.dataset.idx)" class="btn btn-ghost btn-sm" style="color:var(--accent4);padding:3px 8px"><i class="fa-solid fa-xmark"></i></button>'+
    '</div>';
  }).join('');
  var inp=document.getElementById('pf-cat-new-input'); if(inp) inp.value='';
  openM('modal-portfolio-cats');
}
function addPfCat(){
  var inp=document.getElementById('pf-cat-new-input'); if(!inp) return;
  var val=(inp.value||'').trim(); if(!val){toast('<i class="fa-solid fa-triangle-exclamation"></i> اكتب اسم التصنيف');return;}
  var cats=_getPfCats(); if(cats.includes(val)){toast('<i class="fa-solid fa-triangle-exclamation"></i> التصنيف موجود');return;}
  cats.push(val); _savePfCats(cats); inp.value='';
  openPortfolioCatsSettings(); renderPortfolioProjects(); toast('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم إضافة التصنيف');
}
function _delPfCat(i){ var cats=_getPfCats(); cats.splice(i,1); _savePfCats(cats); openPortfolioCatsSettings(); renderPortfolioProjects(); }

// ══════════════════════════════════
// Active Toggle on Services
// ══════════════════════════════════
function toggleSvcActive(id,event){
  event.stopPropagation();
  var svc=(S.services||[]).find(function(x){return String(x.id)===String(id);}); if(!svc) return;
  svc.active=!svc.active;
  lsSave(); cloudSave(S); renderServices(); toast(svc.active?'<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> الخدمة نشطة':'○ الخدمة موقوفة');
}

// ── Banner ──
function handleSvcBanner(input){
  var file=input.files[0]; if(!file) return;
  if(file.size>5*1024*1024){ toast('<i class="fa-solid fa-triangle-exclamation"></i> حجم البانر أكبر من 5 ميجا'); input.value=''; return; }
  toast('<i class="fa-solid fa-spinner fa-spin"></i> جاري رفع البانر...');
  uploadToStorage(file,'banners',function(url){
    var _stIdx=_currentStoreIdx;
    var _curSt=(_stIdx!=null)?(_getStores()[_stIdx]||null):null;
    if(_curSt){ _curSt.banner=url; }
    else { if(!S.settings) S.settings={}; S.settings.svc_banner=url; }
    var prev=document.getElementById('svc-banner-preview'); var img=document.getElementById('svc-banner-img'); var clr=document.getElementById('svc-banner-clear-btn');
    if(prev) prev.style.display=''; if(img) img.src=url; if(clr) clr.style.display='';
    lsSave(); cloudSaveNow(S); toast('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم رفع البانر');
  },function(){ toast('<i class="fa-solid fa-triangle-exclamation"></i> فشل رفع البانر'); });
}
function clearSvcBanner(){
  var _stIdx=_currentStoreIdx;
  var _curSt=(_stIdx!=null)?(_getStores()[_stIdx]||null):null;
  if(_curSt){ _curSt.banner=''; }
  else { if(!S.settings) S.settings={}; S.settings.svc_banner=''; }
  var prev=document.getElementById('svc-banner-preview'); var clr=document.getElementById('svc-banner-clear-btn');
  if(prev) prev.style.display='none'; if(clr) clr.style.display='none';
  lsSave(); cloudSave(S); toast('<i class="fa-solid fa-trash"></i> تم حذف البانر');
}

// ── Service Image Clear ──
function _clearSvcImg(){
  _svcImgData='';
  var pv=document.getElementById('svc-img-preview'); if(pv){ pv.src=''; pv.style.display='none'; }
  var nm=document.getElementById('svc-img-name'); if(nm) nm.textContent='لا توجد صورة';
  var cl=document.getElementById('svc-img-clear-btn'); if(cl) cl.style.display='none';
  var inp=document.getElementById('svc-img-input'); if(inp) inp.value='';
}

// ── Custom Service Categories ──
var _DEFAULT_SVC_CATS=['تصميم جرافيك','برمجة وتطوير','كتابة ومحتوى','تسويق رقمي','فيديو وموشن','ترجمة','أخرى'];
function _getSvcCats(){
  try{ var c=JSON.parse(localStorage.getItem('_svcCats')||'null'); if(Array.isArray(c)) return c; }catch(e){}
  return _DEFAULT_SVC_CATS.slice();
}
function _saveSvcCats(arr){ localStorage.setItem('_svcCats',JSON.stringify(arr)); }
function _populateSvcCatSelect(currentVal){
  var sel=document.getElementById('svc-cat'); if(!sel) return;
  var cats=_getSvcCats();
  sel.innerHTML='<option value="">— اختر —</option>'+cats.map(function(c){
    return '<option value="'+escapeHtml(c)+'"'+(c===currentVal?' selected':'')+'>'+escapeHtml(c)+'</option>';
  }).join('');
}
function openSvcCatsSettings(){
  var cats=_getSvcCats();
  var list=document.getElementById('svc-cats-list'); if(!list) return;
  list.innerHTML=cats.map(function(c,i){
    return '<div style="display:flex;align-items:center;gap:8px;padding:6px 10px;background:var(--surface2);border-radius:8px">'+
      '<span style="flex:1;font-size:13px">'+escapeHtml(c)+'</span>'+
      '<button onclick="_delSvcCat('+i+')" class="btn btn-ghost btn-sm" style="color:var(--accent4);padding:3px 8px"><i class="fa-solid fa-xmark"></i></button>'+
    '</div>';
  }).join('');
  var inp=document.getElementById('svc-cat-new-input'); if(inp) inp.value='';
  openM('modal-svc-cats');
}
function addSvcCat(){
  var inp=document.getElementById('svc-cat-new-input'); if(!inp) return;
  var val=(inp.value||'').trim(); if(!val){ toast('<i class="fa-solid fa-triangle-exclamation"></i> اكتب اسم التصنيف'); return; }
  var cats=_getSvcCats(); if(cats.includes(val)){ toast('<i class="fa-solid fa-triangle-exclamation"></i> التصنيف موجود'); return; }
  cats.push(val); _saveSvcCats(cats); inp.value='';
  openSvcCatsSettings();
  toast('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم إضافة التصنيف');
}
function _delSvcCat(i){
  var cats=_getSvcCats(); cats.splice(i,1); _saveSvcCats(cats); openSvcCatsSettings();
}

// ── Service Modal ──
var _svcImgData = '';
var _svcModalActive = true;
function toggleSvcModalActive(){
  _svcModalActive=!_svcModalActive;
  var tog=document.getElementById('svc-modal-active-toggle');
  var knob=document.getElementById('svc-modal-active-knob');
  var lbl=document.getElementById('svc-modal-active-label');
  var flag=document.getElementById('svc-active-flag');
  if(tog) tog.style.background=_svcModalActive?'var(--accent3)':'var(--border)';
  if(knob) knob.style.right=_svcModalActive?'2px':'calc(100% - 20px)';
  if(lbl) lbl.textContent=_svcModalActive?'● نشطة':'○ موقوفة';
  if(flag) flag.value=_svcModalActive?'1':'0';
}
function openSvcModal(id){
  _svcImgData = '';
  var priceEl2=document.getElementById('svc-price'); if(priceEl2) priceEl2.value='';
  var termsEl2=document.getElementById('svc-terms'); if(termsEl2) termsEl2.value='';
  document.getElementById('svc-eid').value = id||'';
  document.getElementById('svc-modal-title').innerHTML = id ? '<i class="fa-solid fa-pen"></i> تعديل الخدمة' : '<i class="fa-solid fa-bag-shopping"></i> خدمة جديدة';
  document.getElementById('svc-name').value = '';
  document.getElementById('svc-desc').value = '';
  document.getElementById('svc-delivery').value = '';
  document.getElementById('svc-img-name').textContent = 'لا توجد صورة';
  document.getElementById('svc-img-preview').style.display = 'none';
  document.getElementById('svc-img-preview').src = '';
  var clrBtn=document.getElementById('svc-img-clear-btn'); if(clrBtn) clrBtn.style.display='none';
  // (packages removed from service modal - using standalone packages tab)
  var inp=document.getElementById('svc-img-input'); if(inp) inp.value='';
  _populateSvcCatSelect('');
  // populate portfolio cat select for new service
  var pfSelNew=document.getElementById('svc-portfolio-cat-link');
  if(pfSelNew){ var pfCatsNew=_getPfCats(); pfSelNew.innerHTML='<option value="">— اختر تصنيف —</option>'+pfCatsNew.map(function(c){return '<option value="'+escapeHtml(c)+'">'+escapeHtml(c)+'</option>';}).join(''); }
  // reset active toggle
  _svcModalActive=true;
  var tog0=document.getElementById('svc-modal-active-toggle'); var knob0=document.getElementById('svc-modal-active-knob'); var lbl0=document.getElementById('svc-modal-active-label'); var flag0=document.getElementById('svc-active-flag');
  if(tog0) tog0.style.background='var(--accent3)';
  if(knob0) knob0.style.right='2px';
  if(lbl0) lbl0.textContent='● نشطة';
  if(flag0) flag0.value='1';
  if(id){
    var svc = (S.services||[]).find(function(x){ return String(x.id)===String(id); });
    if(svc){
      document.getElementById('svc-name').value = svc.name||'';
      document.getElementById('svc-desc').value = svc.desc||'';
      document.getElementById('svc-delivery').value = svc.delivery||'';
      _populateSvcCatSelect(svc.cat||'');
      _svcImgData = svc.image||'';
      if(svc.image){
        var pv=document.getElementById('svc-img-preview'); pv.src=svc.image; pv.style.display='';
        document.getElementById('svc-img-name').textContent='صورة محفوظة';
        if(clrBtn) clrBtn.style.display='';
      }
      // Note: packages are managed in the standalone packages tab
      // price & terms
      var priceEl=document.getElementById('svc-price'); if(priceEl) priceEl.value=svc.price||'';
      var termsEl=document.getElementById('svc-terms'); if(termsEl) termsEl.value=(svc.terms||[]).join('\n');
      // portfolio cat link
      var pfSel=document.getElementById('svc-portfolio-cat-link');
      if(pfSel){ var pfCats=_getPfCats(); pfSel.innerHTML='<option value="">— اختر تصنيف —</option>'+pfCats.map(function(c){return '<option value="'+escapeHtml(c)+'"'+(c===(svc.portfolio_cat||'')?'selected':'')+'>'+escapeHtml(c)+'</option>';}).join(''); }
      // active
      _svcModalActive=svc.active!==false;
      var tog=document.getElementById('svc-modal-active-toggle'); var knob=document.getElementById('svc-modal-active-knob'); var lbl=document.getElementById('svc-modal-active-label'); var flag=document.getElementById('svc-active-flag');
      if(tog) tog.style.background=_svcModalActive?'var(--accent3)':'var(--border)';
      if(knob) knob.style.right=_svcModalActive?'2px':'calc(100% - 20px)';
      if(lbl) lbl.textContent=_svcModalActive?'● نشطة':'○ موقوفة';
      if(flag) flag.value=_svcModalActive?'1':'0';
      // load currency
      var curSel=document.getElementById('svc-currency'); if(curSel) curSel.value=svc.currency||'ج.م';
      // load payment link
      var payLinkEl=document.getElementById('svc-payment-link'); if(payLinkEl) payLinkEl.value=svc.payment_link||'';
    }
  }
  // reset currency+payment for new service
  if(!id){
    var curSelN=document.getElementById('svc-currency'); if(curSelN) curSelN.value='ج.م';
    var payLinkN=document.getElementById('svc-payment-link'); if(payLinkN) payLinkN.value='';
  }
  openM('modal-svc');
}
function handleSvcImg(input){
  var file=input.files[0]; if(!file) return;
  if(file.size>5*1024*1024){ toast('<i class="fa-solid fa-triangle-exclamation"></i> الصورة أكبر من 5 ميجا'); input.value=''; return; }
  toast('<i class="fa-solid fa-spinner fa-spin"></i> جاري رفع الصورة...');

  // ── رفع مباشر لـ Supabase Storage ──
  var ext = file.name.split('.').pop() || 'jpg';
  var path = 'svc_images/' + (_supaUserId||'anon') + '_' + Date.now() + '.' + ext;

  supa.storage.from('media').upload(path, file, { upsert: true, contentType: file.type })
    .then(function(res){
      if(res.error){
        // Storage مش متاح أو مش موجود — fallback لـ Base64
        console.warn('Storage upload failed:', res.error.message, '— falling back to base64');
        _handleSvcImgBase64(file, input);
        return;
      }
      // جيب الـ public URL
      var urlRes = supa.storage.from('media').getPublicUrl(path);
      var publicUrl = urlRes.data?.publicUrl || '';
      if(!publicUrl){
        _handleSvcImgBase64(file, input);
        return;
      }
      _svcImgData = publicUrl;
      var pv=document.getElementById('svc-img-preview'); pv.src=publicUrl; pv.style.display='';
      document.getElementById('svc-img-name').textContent=file.name;
      var cl=document.getElementById('svc-img-clear-btn'); if(cl) cl.style.display='';
      toast('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم رفع الصورة على السحابة');
    })
    .catch(function(){
      _handleSvcImgBase64(file, input);
    });
}

// Fallback: لو Storage مش شغال
function _handleSvcImgBase64(file, input){
  var reader=new FileReader();
  reader.onload=function(e){
    var b64=e.target.result;
    window._svcImgData=b64;
    var prev=document.getElementById('svc-img-preview'); if(prev){prev.src=b64;prev.style.display='';}
    var nm=document.getElementById('svc-img-name'); if(nm) nm.textContent=file.name;
    var cl=document.getElementById('svc-img-clear'); if(cl) cl.style.display='';
    toast('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم تحميل الصورة');
  };
  reader.onerror=function(){ toast('<i class="fa-solid fa-triangle-exclamation"></i> فشل تحميل الصورة'); };
  if(input) input.value='';
  reader.readAsDataURL(file);
}

// ── Packages ──
function addPkgRow(pkg){
  pkg = pkg || {};
  var id = 'pkg_'+Date.now()+'_'+Math.random().toString(36).slice(2,5);
  var empty = document.getElementById('svc-pkgs-empty');
  if(empty) empty.style.display='none';
  var row = document.createElement('div');
  row.className='svc-pkg-row'; row.id=id;
  row.style.cssText='display:flex;flex-direction:column;gap:8px;padding:14px;background:var(--surface);border-radius:12px;border:1.5px solid var(--border);margin-bottom:4px';
  var items = pkg.items||[];
  var itemsHtml = items.map(function(it,i){
    return '<div style="display:flex;gap:6px;align-items:center" data-pkg-item>'+
      '<input class="form-input" placeholder="بند الباقة..." value="'+escapeHtml(it)+'" style="flex:1;font-size:12px" data-item-text>'+
      '<button onclick="this.parentNode.remove()" class="btn btn-ghost btn-sm" style="color:var(--accent4);padding:4px 8px"><i class="fa-solid fa-xmark"></i></button>'+
    '</div>';
  }).join('');
  row.innerHTML=
    '<div style="display:flex;gap:8px;align-items:center">'+
      '<input class="form-input" placeholder="اسم الباقة (مثال: أساسية)" value="'+escapeHtml(pkg.name||'')+'" data-field="name" style="flex:2;font-weight:700">'+
      '<input class="form-input" placeholder="السعر" type="number" value="'+(pkg.price||'')+'" data-field="price" style="flex:1">'+
      '<button onclick="document.getElementById(\''+id+'\').remove();_pkgCheckEmpty()" class="btn btn-danger btn-sm"><i class="fa-solid fa-xmark"></i></button>'+
    '</div>'+
    '<div style="display:flex;gap:8px">'+
      '<input class="form-input" placeholder="وقت التسليم" value="'+escapeHtml(pkg.delivery||'')+'" data-field="delivery" style="flex:1">'+
      '<input class="form-input" placeholder="عدد التعديلات" type="number" value="'+(pkg.revisions||'')+'" data-field="revisions" style="flex:1">'+
    '</div>'+
    '<textarea class="form-textarea" placeholder="وصف الباقة..." data-field="desc" rows="2" style="font-size:12px">'+escapeHtml(pkg.desc||'')+'</textarea>'+
    '<div style="border-top:1px dashed var(--border);padding-top:10px">'+
      '<div style="font-size:11px;font-weight:700;color:var(--text3);margin-bottom:8px"><i class="fa-solid fa-clipboard-list"></i> بنود الباقة (ما تشمله)</div>'+
      '<div class="pkg-items-list" style="display:flex;flex-direction:column;gap:6px">'+itemsHtml+'</div>'+
      '<button class="btn btn-ghost btn-sm" style="margin-top:6px;font-size:11px" onclick="_addPkgItem(this)">+ إضافة بند</button>'+
    '</div>';
  document.getElementById('svc-pkgs-list').appendChild(row);
}
function _addPkgItem(btn){
  var list=btn.previousElementSibling;
  var item=document.createElement('div');
  item.setAttribute('data-pkg-item','');
  item.style.cssText='display:flex;gap:6px;align-items:center';
  item.innerHTML='<input class="form-input" placeholder="بند الباقة..." style="flex:1;font-size:12px" data-item-text>'+
    '<button onclick="this.parentNode.remove()" class="btn btn-ghost btn-sm" style="color:var(--accent4);padding:4px 8px"><i class="fa-solid fa-xmark"></i></button>';
  list.appendChild(item);
  item.querySelector('input').focus();
}
function _pkgCheckEmpty(){
  var list=document.getElementById('svc-pkgs-list');
  var empty=document.getElementById('svc-pkgs-empty');
  if(empty) empty.style.display=(list&&list.children.length===0)?'':'none';
}
function collectPackages(){
  var rows = document.querySelectorAll('#svc-pkgs-list > div.svc-pkg-row');
  var pkgs = [];
  rows.forEach(function(row){
    var items=[];
    row.querySelectorAll('[data-pkg-item] [data-item-text]').forEach(function(inp){
      var v=(inp.value||'').trim(); if(v) items.push(v);
    });
    pkgs.push({
      id: Date.now()+'_'+Math.random().toString(36).slice(2,5),
      name: (row.querySelector('[data-field="name"]')||{}).value||'',
      price: +((row.querySelector('[data-field="price"]')||{}).value||0),
      delivery: (row.querySelector('[data-field="delivery"]')||{}).value||'',
      revisions: +((row.querySelector('[data-field="revisions"]')||{}).value||0),
      desc: (row.querySelector('[data-field="desc"]')||{}).value||'',
      items: items
    });
  });
  return pkgs.filter(function(p){ return p.name; });
}

// ── Portfolio (inline rows) ──
function addPortfolioRow(type){
  var list = document.getElementById('svc-portfolio-list');
  var empty = document.getElementById('svc-portfolio-empty');
  if(empty) empty.style.display='none';
  var id = 'pf_'+Date.now()+'_'+Math.random().toString(36).slice(2,5);
  var row = document.createElement('div');
  row.id = id;
  row.dataset.pftype = type;
  row.style.cssText='background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:10px 12px;display:flex;flex-direction:column;gap:8px';
  if(type==='behance'){
    row.innerHTML=
      '<div style="display:flex;align-items:center;gap:8px">'+
        '<span style="font-size:13px;font-weight:700;color:#1769ff"><i class="fa-solid fa-palette"></i> Behance</span>'+
        '<button onclick="document.getElementById(\''+id+'\').remove();_pfCheckEmpty()" class="btn btn-danger btn-sm" style="margin-right:auto"><i class="fa-solid fa-xmark"></i></button>'+
      '</div>'+
      '<input class="form-input" placeholder="رابط المشروع على Behance *" data-pf="url" style="font-size:12px">'+
      '<input class="form-input" placeholder="اسم المشروع (اختياري)" data-pf="label" style="font-size:12px">';
  } else {
    row.innerHTML=
      '<div style="display:flex;align-items:center;gap:8px">'+
        '<span style="font-size:13px;font-weight:700;color:#34a853"><i class="fa-solid fa-folder"></i> Google Drive</span>'+
        '<button onclick="document.getElementById(\''+id+'\').remove();_pfCheckEmpty()" class="btn btn-danger btn-sm" style="margin-right:auto"><i class="fa-solid fa-xmark"></i></button>'+
      '</div>'+
      '<input class="form-input" placeholder="رابط Google Drive *" data-pf="url" style="font-size:12px">'+
      '<input class="form-input" placeholder="اسم الملف/العمل (اختياري)" data-pf="label" style="font-size:12px">'+
      '<div style="display:flex;align-items:center;gap:8px">'+
        '<input type="file" accept="image/*" style="display:none" id="pfthumb_'+id+'" onchange="_pfThumbUpload(this,\''+id+'\')">'+
        '<button class="btn btn-ghost btn-sm" onclick="document.getElementById(\'pfthumb_'+id+'\').click()"><i class="fa-solid fa-camera"></i> رفع صورة مصغرة (1MB)</button>'+
        '<span id="pfthumb_lbl_'+id+'" style="font-size:10px;color:var(--text3)">اختياري</span>'+
      '</div>';
  }
  list.appendChild(row);
}
function _pfCheckEmpty(){
  var list=document.getElementById('svc-portfolio-list');
  var empty=document.getElementById('svc-portfolio-empty');
  if(empty) empty.style.display=(list&&list.children.length===0)?'':'none';
}
function _pfThumbUpload(input, rowId){
  var file=input.files[0]; if(!file) return;
  if(file.size>5*1024*1024){ toast('<i class="fa-solid fa-triangle-exclamation"></i> الصورة أكبر من 5 ميجا'); input.value=''; return; }
  var ext=file.name.split('.').pop()||'jpg';
  var path='pf_row_images/'+(_supaUserId||'anon')+'_'+Date.now()+'.'+ext;
  toast('<i class="fa-solid fa-spinner fa-spin"></i> جاري رفع الصورة...');
  supa.storage.from('media').upload(path, file, {upsert:true, contentType:file.type})
    .then(function(res){
      if(res.error){ _pfThumbUploadBase64(file, rowId); return; }
      var urlRes=supa.storage.from('media').getPublicUrl(path);
      var publicUrl=urlRes.data?.publicUrl||'';
      if(!publicUrl){ _pfThumbUploadBase64(file, rowId); return; }
      var row=document.getElementById(rowId); if(!row) return;
      row.dataset.thumb=publicUrl;
      var lbl=document.getElementById('pfthumb_lbl_'+rowId);
      if(lbl) lbl.innerHTML='<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> '+file.name.slice(0,18);
      toast('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم رفع الصورة');
    }).catch(function(){ _pfThumbUploadBase64(file, rowId); });
}
function _pfThumbUploadBase64(file, rowId){
  toast('<i class="fa-solid fa-triangle-exclamation"></i> Storage غير متاح — تأكد من إنشاء bucket اسمه "media" في Supabase');
}
function collectPortfolio(){
  var rows = document.querySelectorAll('#svc-portfolio-list > div[data-pftype]');
  var items = [];
  rows.forEach(function(row){
    var type=row.dataset.pftype;
    var url=(row.querySelector('[data-pf="url"]')||{}).value||'';
    var label=(row.querySelector('[data-pf="label"]')||{}).value||'';
    var thumb=row.dataset.thumb||'';
    if(!url) return;
    items.push({ id:Date.now()+'_'+Math.random().toString(36).slice(2,5), type:type, url:url, label:label||(type==='behance'?'Behance':'Google Drive'), thumb:thumb });
  });
  return items;
}
function _renderPortfolioRow(item){
  // Used when editing an existing service — recreate inline rows
  var list=document.getElementById('svc-portfolio-list');
  var empty=document.getElementById('svc-portfolio-empty');
  if(empty) empty.style.display='none';
  var id='pf_'+item.id+'_e';
  var row=document.createElement('div');
  row.id=id; row.dataset.pftype=item.type||'behance';
  if(item.thumb) row.dataset.thumb=item.thumb;
  row.style.cssText='background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:10px 12px;display:flex;flex-direction:column;gap:8px';
  var typeLabel=item.type==='behance'?'<i class="fa-solid fa-palette"></i> Behance':'<i class="fa-solid fa-folder"></i> Google Drive';
  var typeColor=item.type==='behance'?'#1769ff':'#34a853';
  row.innerHTML=
    '<div style="display:flex;align-items:center;gap:8px">'+
      '<span style="font-size:13px;font-weight:700;color:'+typeColor+'">'+typeLabel+'</span>'+
      (item.type!=='behance'?'<span style="font-size:10px;color:var(--text3);margin-right:auto">'+(item.thumb?'<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> صورة مرفوعة':'لا صورة')+'</span>':'')+
      '<button onclick="document.getElementById(\''+id+'\').remove();_pfCheckEmpty()" class="btn btn-danger btn-sm" style="margin-right:'+(item.type!=='behance'?'0':'auto')+'"><i class="fa-solid fa-xmark"></i></button>'+
    '</div>'+
    '<input class="form-input" placeholder="الرابط *" data-pf="url" value="'+escapeHtml(item.url||'')+'" style="font-size:12px">'+
    '<input class="form-input" placeholder="الاسم" data-pf="label" value="'+escapeHtml(item.label||'')+'" style="font-size:12px">'+
    (item.type==='drive'?
      '<div style="display:flex;align-items:center;gap:8px">'+
        '<input type="file" accept="image/*" style="display:none" id="pfthumb_'+id+'" onchange="_pfThumbUpload(this,\''+id+'\')">'+
        '<button class="btn btn-ghost btn-sm" onclick="document.getElementById(\'pfthumb_'+id+'\').click()"><i class="fa-solid fa-camera"></i> تغيير الصورة</button>'+
        '<span id="pfthumb_lbl_'+id+'" style="font-size:10px;color:var(--text3)">'+(item.thumb?'<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> محفوظة':'اختياري')+'</span>'+
      '</div>':'')+
    '';
  list.appendChild(row);
}
// Keep old addPortfolioItem as alias
function addPortfolioItem(type){ addPortfolioRow(type); }

// ── Save Service ──
function saveSvc(){
  var eid = document.getElementById('svc-eid').value;
  var name = document.getElementById('svc-name').value.trim();
  var desc = document.getElementById('svc-desc').value.trim();
  if(!name||!desc){ toast('<i class="fa-solid fa-triangle-exclamation"></i> اسم الخدمة والوصف مطلوبان'); return; }
  if(!S.services) S.services=[];
  var catEl=document.getElementById('svc-cat');
  // Get current store id
  var _storeId = _getCurrentStoreId();
  var d = {
    name: name, desc: desc,
    cat: catEl ? catEl.value : '',
    delivery: (document.getElementById('svc-delivery')||{}).value||'',
    price: +((document.getElementById('svc-price')||{}).value)||0,
    currency: (document.getElementById('svc-currency')||{}).value||'ج.م',
    payment_link: ((document.getElementById('svc-payment-link')||{}).value||'').trim(),
    terms: (((document.getElementById('svc-terms')||{}).value)||'').split('\n').map(function(s){return s.trim();}).filter(Boolean),
    image: _svcImgData,
    portfolio: collectPortfolio(),
    portfolio_cat: (document.getElementById('svc-portfolio-cat-link')||{}).value||'',
    active: (document.getElementById('svc-active-flag')||{}).value!=='0',
    store_id: _storeId,
    createdAt: new Date().toISOString()
  };
  if(eid){
    var i=S.services.findIndex(function(x){return String(x.id)===String(eid);});
    if(i>-1){
      d.id=+eid; d.createdAt=S.services[i].createdAt||d.createdAt;
      // Preserve existing packages if any
      if(S.services[i].packages && S.services[i].packages.length) d.packages = S.services[i].packages;
      S.services[i]=d;
    }
  } else {
    d.id=Date.now(); S.services.push(d);
  }
  // ── حفظ مع تأكيد حقيقي من Supabase — المودال لا يتقفل غير بعد النجاح ──
  cloudSaveWithConfirm('🛍 جاري رفع الخدمة...', function(){
    closeM('modal-svc');
    renderServices();
    toast('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم حفظ الخدمة في قاعدة البيانات');
  });
}
function delSvc(id){
  confirmDel('حذف هذه الخدمة؟', function(){
    S.services=(S.services||[]).filter(function(x){return String(x.id)!==String(id);});
    lsSave(); cloudSave(S); renderServices(); toast('<i class="fa-solid fa-trash"></i> تم الحذف');
  });
}
function duplicateSvc(id){
  var svc=(S.services||[]).find(function(x){return String(x.id)===String(id);});
  if(!svc){ toast('<i class="fa-solid fa-triangle-exclamation"></i> لم يتم العثور على الخدمة'); return; }
  var copy=JSON.parse(JSON.stringify(svc));
  copy.id=Date.now();
  copy.name=copy.name+' (نسخة)';
  copy.createdAt=new Date().toISOString();
  if(!S.services) S.services=[];
  S.services.push(copy);
  lsSave(); cloudSave(S); renderServices(); toast('<i class="fa-solid fa-copy"></i> تم تكرار الخدمة');
}
function duplicatePkg(id){
  var pkg=(S.standalone_packages||[]).find(function(x){return String(x.id)===String(id);});
  if(!pkg){ toast('<i class="fa-solid fa-triangle-exclamation"></i> لم يتم العثور على الباقة'); return; }
  var copy=JSON.parse(JSON.stringify(pkg));
  copy.id=Date.now();
  copy.name=copy.name+' (نسخة)';
  copy.createdAt=new Date().toISOString();
  if(!S.standalone_packages) S.standalone_packages=[];
  S.standalone_packages.push(copy);
  lsSave(); cloudSave(S); renderStandalonePackages(); toast('<i class="fa-solid fa-copy"></i> تم تكرار الباقة');
}
function duplicatePortfolioProject(id){
  var proj=(S.portfolio_projects||[]).find(function(x){return String(x.id)===String(id);});
  if(!proj){ toast('<i class="fa-solid fa-triangle-exclamation"></i> لم يتم العثور على المشروع'); return; }
  var copy=JSON.parse(JSON.stringify(proj));
  copy.id='pf_'+Date.now()+'_'+Math.random().toString(36).slice(2,6);
  copy.name=copy.name+' (نسخة)';
  copy.createdAt=new Date().toISOString();
  if(!S.portfolio_projects) S.portfolio_projects=[];
  S.portfolio_projects.push(copy);
  lsSave(); cloudSave(S); renderPortfolioProjects(); toast('<i class="fa-solid fa-copy"></i> تم تكرار المشروع');
}

// ── Render Services ──
function renderServices(){
  try {
    var pg = document.getElementById('page-services'); if(!pg) return;
    if(typeof S==='undefined') return;
    if(!S.services) S.services=[];
    if(!S.svc_orders) S.svc_orders=[];

    // Ensure services tab is visible (reset to services tab if needed)
    var svcWrap = document.getElementById('svc-services-wrap');
    if(svcWrap && svcWrap.style.display === 'none'){
      // Only auto-show if no other tab was explicitly selected
      var anyTabActive = ['packages','portfolio','website','orders'].some(function(t){
        var w = document.getElementById('svc-'+t+'-wrap');
        return w && w.style.display !== 'none';
      });
      if(!anyTabActive) svcWrap.style.display = '';
    }

    // Link
    var linkEl=document.getElementById('svc-link-text');
    if(linkEl){ try{ linkEl.textContent=getSvcLink(_getCurrentStoreId()); }catch(e){ linkEl.textContent='—'; } }

    // Banner — use current store's banner or main settings banner
    var _activeSt = _getCurrentStoreId();
    var _activeStObj = _activeSt ? (_getStores()||[]).find(function(s){return s.id===_activeSt;}) : null;
    var banner = (_activeStObj && _activeStObj.banner) ? _activeStObj.banner : (S.settings&&S.settings.svc_banner);
    var bannerPv=document.getElementById('svc-banner-preview'); var bannerIm=document.getElementById('svc-banner-img'); var bannerCl=document.getElementById('svc-banner-clear-btn');
    if(banner){ if(bannerPv) bannerPv.style.display=''; if(bannerIm) bannerIm.src=banner; if(bannerCl) bannerCl.style.display=''; }
    else { if(bannerPv) bannerPv.style.display='none'; if(bannerCl) bannerCl.style.display='none'; }

    // Pending orders alert
    var pending=(S.svc_orders||[]).filter(function(o){return o.status==='pending';});
    var alertEl=document.getElementById('svc-orders-alert'); var badgeEl=document.getElementById('svc-orders-badge');
    var navBadge=document.getElementById('svc-orders-nav-badge'); var tabBadge=document.getElementById('svc-orders-tab-badge');
    if(alertEl) alertEl.style.display=pending.length?'':'none';
    if(badgeEl) badgeEl.textContent=pending.length;
    if(navBadge){ navBadge.textContent=pending.length; navBadge.style.display=pending.length?'':'none'; }
    if(tabBadge){ tabBadge.textContent=pending.length; tabBadge.style.display=pending.length?'':'none'; }
    var ordList=document.getElementById('svc-orders-list');
    if(ordList && pending.length){
      var firstOrd=pending[0];
      ordList.innerHTML='<div class="order-row pending">'+
        '<div style="flex:1"><div style="font-size:13px;font-weight:800">'+escapeHtml(firstOrd.client_name)+'</div>'+
        '<div style="font-size:11px;color:var(--text3)">'+escapeHtml(firstOrd.service_name)+'</div></div>'+
        '<button class="btn btn-primary btn-sm" onclick="openOrderAccept(\''+firstOrd.id+'\')">عرض</button></div>'+
        (pending.length>1?'<div style="text-align:center;margin-top:6px"><button class="btn btn-ghost btn-sm" onclick="switchSvcTab(\'orders\')" style="font-size:11px;color:var(--accent)"><i class="fa-solid fa-list"></i> المزيد (+'+(pending.length-1)+' طلب)</button></div>':'');
    }

    // Services grid — filter by current store
    var grid=document.getElementById('svc-grid'); if(!grid) return;
    var _activeStoreId = _getCurrentStoreId();
    var storeServices = (S.services||[]).filter(function(svc){
      if(_activeStoreId === null) {
        // Main store: show services with no store_id or store_id === null
        return !svc.store_id;
      } else {
        return svc.store_id === _activeStoreId;
      }
    });
    if(!storeServices.length){
      grid.innerHTML='<div class="empty card" style="grid-column:span 3;padding:50px 20px;text-align:center">'+
        '<div style="font-size:52px;margin-bottom:14px"><i class="fa-solid fa-bag-shopping"></i></div>'+
        '<div style="font-size:17px;font-weight:800;margin-bottom:8px">لا توجد خدمات في هذا المتجر</div>'+
        '<div style="font-size:13px;color:var(--text3);margin-bottom:20px">أضف خدماتك الأولى وشارك الرابط مع عملائك</div>'+
        '<button onclick="openSvcModal()" class="btn btn-primary">+ إضافة خدمة</button></div>';
      return;
    }
    grid.innerHTML=storeServices.map(function(svc){
      var minPrice=0;
      if(svc.packages&&svc.packages.length){ var pp=svc.packages.map(function(p){return+p.price||0;}).filter(Boolean); if(pp.length) minPrice=Math.min.apply(null,pp); }
      var ordCount=(S.svc_orders||[]).filter(function(o){return String(o.service_id)===String(svc.id);}).length;
      var isActive=svc.active!==false;
      return '<div class="svc-card" onclick="openSvcDetail('+svc.id+')" onmouseenter="this.style.borderColor=\'var(--accent)\'" onmouseleave="this.style.borderColor=\'\'" style="border:1.5px solid '+(isActive?'var(--border)':'rgba(255,107,107,.3)')+';border-radius:16px;overflow:hidden;cursor:pointer;transition:all .18s;opacity:'+(isActive?'1':'.7')+'">'+
        '<div class="svc-card-cover">'+(svc.image?'<img src="'+escapeHtml(svc.image)+'" style="width:100%;height:100%;object-fit:cover" onerror=\'this.style.display=\"none\"\'">':'<i class="fa-solid fa-bag-shopping"></i>')+'</div>'+
        '<div class="svc-card-body">'+
          '<div style="font-size:14px;font-weight:800;margin-bottom:4px">'+escapeHtml(svc.name)+'</div>'+
          (svc.cat?'<div style="font-size:10px;color:var(--accent);font-weight:700;margin-bottom:6px">'+escapeHtml(svc.cat)+'</div>':'<div style="margin-bottom:6px"></div>')+
          '<div style="font-size:11px;color:var(--text3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-bottom:10px">'+escapeHtml(svc.desc)+'</div>'+
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">'+
            '<div style="font-size:17px;font-weight:900;color:var(--accent)">'+(minPrice?Number(minPrice).toLocaleString()+' '+(svc.currency||'ج.م'):'<span style="font-size:12px;color:var(--text3)">سعر عند الطلب</span>')+'</div>'+
            '<div style="display:flex;gap:4px">'+
              (svc.packages&&svc.packages.length?'<span style="font-size:10px;background:rgba(124,111,247,.12);color:var(--accent);padding:2px 8px;border-radius:8px">'+svc.packages.length+' باقة</span>':'')+
              (ordCount?'<span style="font-size:10px;background:rgba(79,209,165,.12);color:var(--accent3);padding:2px 8px;border-radius:8px">'+ordCount+' طلب</span>':'')+
            '</div>'+
          '</div>'+
          '<div style="display:flex;gap:6px;border-top:1px solid var(--border);padding-top:12px" onclick="event.stopPropagation()">'+
            '<button data-sid="'+svc.id+'" onclick="openSvcModal(+this.dataset.sid)" class="btn btn-ghost btn-sm" style="flex:1;justify-content:center"><i class="fa-solid fa-pen"></i> تعديل</button>'+
            '<button data-sid="'+svc.id+'" onclick="duplicateSvc(+this.dataset.sid)" class="btn btn-ghost btn-sm" title="تكرار الخدمة" style="color:var(--accent)"><i class="fa-solid fa-copy"></i></button>'+
            '<button data-sid="'+svc.id+'" data-active="'+(isActive?'1':'0')+'" onclick="toggleSvcActive(+this.dataset.sid,event)" class="btn btn-ghost btn-sm" style="color:'+(isActive?'var(--accent3)':'var(--text3)')+'" title="'+(isActive?'موقف الخدمة':'تفعيل الخدمة')+'">'+(isActive?'● نشطة':'○ موقوفة')+'</button>'+
            '<button data-sid="'+svc.id+'" onclick="delSvc(+this.dataset.sid)" class="btn btn-danger btn-sm"><i class="fa-solid fa-trash"></i></button>'+
          '</div>'+
        '</div></div>';
    }).join('');
  } catch(e){ console.error('renderServices:',e); }
}

// ── Service Detail (public-like inner view) ──
function openSvcDetail(id){
  var svc=(S.services||[]).find(function(x){return String(x.id)===String(id);}); if(!svc) return;
  var ex=document.getElementById('_svc-detail-overlay'); if(ex) ex.remove();
  var pkgHtml='';
  if(svc.packages&&svc.packages.length){
    pkgHtml='<div style="margin-top:14px"><div style="font-size:12px;font-weight:700;color:var(--text3);margin-bottom:10px"><i class="fa-solid fa-box"></i> الباقات</div>'+
      svc.packages.map(function(p){
        return '<div class="svc-pkg-row" style="background:var(--surface2);border-radius:10px;padding:12px 14px;display:flex;gap:10px;align-items:flex-start;border:1px solid var(--border);margin-bottom:6px">'+
          '<div style="flex:1"><div style="font-size:13px;font-weight:800">'+escapeHtml(p.name)+'</div>'+
          (p.desc?'<div style="font-size:11px;color:var(--text3);margin-top:2px">'+escapeHtml(p.desc)+'</div>':'')+
          (p.items&&p.items.length?'<div style="margin-top:8px;display:flex;flex-direction:column;gap:4px">'+p.items.map(function(it){ return '<div style="font-size:11px;color:var(--text2);display:flex;align-items:center;gap:6px"><span style="color:var(--accent3)"><i class="fa-solid fa-check"></i></span>'+escapeHtml(it)+'</div>'; }).join('')+'</div>':'')+
          '<div style="display:flex;gap:10px;margin-top:6px;font-size:11px;color:var(--text3)">'+
            (p.delivery?'<span><i class="fa-solid fa-stopwatch"></i> '+escapeHtml(p.delivery)+'</span>':'')+
            (p.revisions?'<span><i class="fa-solid fa-rotate"></i> '+p.revisions+' تعديلات</span>':'')+
          '</div></div>'+
          '<div style="font-size:18px;font-weight:900;color:var(--accent);white-space:nowrap">'+(p.price?Number(p.price).toLocaleString()+' ج':'مجاني')+'</div>'+
        '</div>';
      }).join('')+
    '</div>';
  }
  var portHtml='';
  if(svc.portfolio&&svc.portfolio.length){
    portHtml='<div style="margin-top:16px"><div style="font-size:12px;font-weight:700;color:var(--text3);margin-bottom:10px"><i class="fa-solid fa-image"></i> معرض الأعمال</div>'+
      '<div style="display:flex;flex-direction:column;gap:6px">'+
      svc.portfolio.map(function(p){
        return '<div class="portfolio-item">'+
          (p.thumb?'<img src="'+escapeHtml(p.thumb)+'" class="portfolio-thumb" onerror="this.style.display=\'none\'">':'<div class="portfolio-thumb" style="display:flex;align-items:center;justify-content:center;font-size:20px">'+(p.type==='behance'?'<i class="fa-solid fa-palette"></i>':'<i class="fa-solid fa-folder"></i>')+'</div>')+
          '<div style="flex:1"><div style="font-size:12px;font-weight:700">'+(p.label||p.type)+'</div><div style="font-size:11px;color:var(--text3)">'+escapeHtml(p.url)+'</div></div>'+
          '<a href="'+escapeHtml(p.url)+'" target="_blank" class="btn btn-ghost btn-sm">↗ عرض</a></div>';
      }).join('')+
      '</div></div>';
  }
  var overlay=document.createElement('div');
  overlay.id='_svc-detail-overlay';
  overlay.style.cssText='position:fixed;inset:0;z-index:8000;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:16px';
  overlay.innerHTML='<div style="background:var(--surface);border-radius:20px;max-width:560px;width:100%;max-height:90vh;overflow-y:auto;padding:24px">'+
    '<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:16px">'+
      '<div><div style="font-size:18px;font-weight:900">'+escapeHtml(svc.name)+'</div>'+
      (svc.cat?'<div style="font-size:11px;color:var(--accent);font-weight:700;margin-top:2px">'+escapeHtml(svc.cat)+'</div>':'')+
      '</div><button onclick="document.getElementById(\'_svc-detail-overlay\').remove()" class="close-btn"><i class="fa-solid fa-xmark"></i></button>'+
    '</div>'+
    (svc.image?'<img src="'+escapeHtml(svc.image)+'" style="width:100%;max-height:200px;object-fit:cover;border-radius:14px;margin-bottom:14px" onerror=\'this.style.display=\"none\"\'">':'')+
    '<p style="font-size:13px;color:var(--text2);line-height:1.7;margin-bottom:8px">'+escapeHtml(svc.desc)+'</p>'+
    (svc.delivery?'<div style="font-size:12px;color:var(--text3)"><i class="fa-solid fa-stopwatch"></i> وقت التسليم: '+escapeHtml(svc.delivery)+'</div>':'')+
    pkgHtml + portHtml +
    '<div style="display:flex;gap:8px;margin-top:18px;border-top:1px solid var(--border);padding-top:16px">'+
      '<button onclick="document.getElementById(\'_svc-detail-overlay\').remove();openSvcModal('+svc.id+')" class="btn btn-ghost" style="flex:1;justify-content:center"><i class="fa-solid fa-pen"></i> تعديل</button>'+
    '</div>'+
  '</div>';
  overlay.onclick=function(e){ if(e.target===overlay) overlay.remove(); };
  document.body.appendChild(overlay);
}

// ── Orders ──
function openOrderAccept(orderId){
  window._currentOrderId = orderId;
  var order=(S.svc_orders||[]).find(function(o){return String(o.id)===String(orderId);}); if(!order) return;
  var isPending=order.status==='pending';
  var isAccepted=order.status==='accepted';

  // Set modal title
  var titleEl=document.getElementById('oa-modal-title');
  if(titleEl) titleEl.innerHTML = isPending?'<i class="fa-solid fa-inbox"></i> قبول الطلب':'<i class="fa-solid fa-clipboard-list"></i> تفاصيل الطلب';

  // Fill order ID
  var oidEl=document.getElementById('oa-order-id'); if(oidEl) oidEl.value=orderId;

  // Order preview
  var preview=document.getElementById('oa-order-preview');
  if(preview){
    var statusColor={pending:'var(--accent2)',accepted:'var(--accent3)',rejected:'var(--accent4)'}[order.status]||'var(--text3)';
    var statusLabel={pending:'⏳ معلق',accepted:'<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> مقبول',rejected:'<i class="fa-solid fa-xmark"></i> مرفوض'}[order.status]||order.status;
    preview.innerHTML=
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px">'+
        '<div><div style="color:var(--text3);font-size:10px">العميل</div><div style="font-weight:800">'+escapeHtml(order.client_name)+'</div></div>'+
        '<div><div style="color:var(--text3);font-size:10px">الخدمة</div><div style="font-weight:700">'+escapeHtml(order.service_name)+(order.pkg_name?' — '+escapeHtml(order.pkg_name):'')+'</div></div>'+
        (order.client_phone?'<div><div style="color:var(--text3);font-size:10px">واتساب</div><div style="font-weight:700">'+escapeHtml(order.client_phone)+'</div></div>':'')+
        (order.price?'<div><div style="color:var(--text3);font-size:10px">السعر</div><div style="font-weight:800;color:var(--accent)">'+Number(order.price).toLocaleString()+' ج</div></div>':'')+
        '<div style="grid-column:span 2"><div style="color:var(--text3);font-size:10px">الحالة</div><div style="font-weight:700;color:'+statusColor+'">'+statusLabel+'</div></div>'+
      '</div>'+
      (order.desc?'<div style="margin-top:10px;font-size:12px"><div style="color:var(--text3);font-size:10px;margin-bottom:4px">وصف المشروع</div><div style="padding:8px;background:var(--surface);border-radius:8px;line-height:1.6">'+escapeHtml(order.desc)+'</div></div>':'')+
      (order.client_phone?'<div style="margin-top:10px"><a href="https://wa.me/'+order.client_phone.replace(/[^0-9]/g,'')+'" target="_blank" class="btn btn-ghost btn-sm" style="background:#25D366;color:#fff;border:none"><i class="fa-solid fa-mobile"></i> تواصل واتساب</a></div>':'')+
      (order.created_at?'<div style="font-size:10px;color:var(--text3);margin-top:8px"><i class="fa-solid fa-calendar-days"></i> '+new Date(order.created_at).toLocaleDateString('ar-EG')+'</div>':'');
  }

  // Show/hide sections based on status
  var newTaskSec=document.getElementById('oa-new-task-section');
  var statusSec=document.getElementById('oa-status-section');
  var acceptBtn=document.getElementById('oa-accept-btn');
  var rejectBtn=document.getElementById('oa-reject-btn');

  if(isPending){
    if(newTaskSec) newTaskSec.style.display='';
    if(statusSec) statusSec.style.display='none';
    if(acceptBtn){ acceptBtn.style.display=''; acceptBtn.innerHTML='<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> قبول وإنشاء مهمة'; }
    if(rejectBtn) rejectBtn.style.display='';
    // Prefill task form
    var titleF=document.getElementById('oa-title'); if(titleF) titleF.value=order.service_name+(order.pkg_name?' — '+order.pkg_name:'');
    var amtF=document.getElementById('oa-amount'); if(amtF) amtF.value=order.price||'';
    var depF=document.getElementById('oa-deposit'); if(depF) depF.value='';
    var dlF=document.getElementById('oa-deadline'); if(dlF) dlF.value='';
    var notesF=document.getElementById('oa-notes'); if(notesF) notesF.value='';
    // Populate worker dropdown
    var workerSel=document.getElementById('oa-worker');
    if(workerSel){
      var members=(S.teams||[]).flatMap(function(t){return t.members||[];});
      workerSel.innerHTML='<option value="me">أنا</option>'+members.map(function(m){return '<option value="'+escapeHtml(m.id||m.name)+'">'+escapeHtml(m.name)+'</option>';}).join('');
    }
  } else if(isAccepted){
    if(newTaskSec) newTaskSec.style.display='none';
    if(acceptBtn) acceptBtn.style.display='none';
    if(rejectBtn) rejectBtn.style.display='none';
    if(statusSec){
      statusSec.style.display='';
      // Find linked task
      var linkedTask=(S.tasks||[]).find(function(t){return t.source_order_id===order.id;});
      var statuses=['جديد','قيد التنفيذ','مراجعة','موقوفة','مكتملة'];
      var statusColors={'جديد':'var(--accent)','قيد التنفيذ':'var(--accent2)','مراجعة':'#a78bfa','موقوفة':'var(--accent4)','مكتملة':'var(--accent3)'};
      var currentStatus=linkedTask?linkedTask.status:'جديد';
      var btnsEl=document.getElementById('oa-status-btns');
      if(btnsEl){
        btnsEl.innerHTML=statuses.map(function(st){
          var isActive=st===currentStatus;
          return '<button class="btn '+(isActive?'btn-primary':'btn-ghost')+' btn-sm" '+
            'style="border-color:'+statusColors[st]+';'+(isActive?'background:'+statusColors[st]+';':'color:'+statusColors[st]+';')+'" '+
            'onclick="changeLinkedTaskStatus(this.dataset.s,this.dataset.o)" data-s="'+st+'" data-o="'+orderId+'">'+
            st+'</button>';
        }).join('');
      }
      // Show "go to task" button
      if(linkedTask){
        var actionBtns=document.getElementById('oa-action-btns');
        if(actionBtns){
          var tid2=linkedTask.id;
          actionBtns.innerHTML=
            '<button class="btn btn-ghost" onclick="closeM(\'modal-order-accept\')">إغلاق</button>'+
            '<button class="btn btn-primary" style="flex:1;justify-content:center" onclick="closeM(\'modal-order-accept\');showPage(\'tasks\');setTimeout(function(){openTask('+tid2+')},300)">↗ فتح المهمة الكاملة</button>';
        }
      }
    }
  } else {
    // rejected
    if(newTaskSec) newTaskSec.style.display='none';
    if(statusSec) statusSec.style.display='none';
    if(acceptBtn) acceptBtn.style.display='none';
    if(rejectBtn) rejectBtn.style.display='none';
    var actionBtns2=document.getElementById('oa-action-btns');
    if(actionBtns2) actionBtns2.innerHTML='<button class="btn btn-ghost" style="width:100%;justify-content:center" onclick="closeM(\'modal-order-accept\')">إغلاق</button>';
  }

  openM('modal-order-accept');
}

function changeLinkedTaskStatus(newStatus, orderId){
  var order=(S.svc_orders||[]).find(function(o){return String(o.id)===String(orderId);}); if(!order) return;
  var task=(S.tasks||[]).find(function(t){return t.source_order_id===order.id;}); if(!task) return;
  task.status=newStatus;
  task.done=(newStatus==='مكتملة');
  lsSave(); cloudSave(S);
  openOrderAccept(orderId); // re-render modal
  renderAll();
  toast('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم تغيير الحالة إلى: '+newStatus);
}
function acceptSvcOrder(orderId){
  var order=(S.svc_orders||[]).find(function(o){return String(o.id)===String(orderId);}); if(!order) return;
  order.status='accepted';
  order.accepted_at=new Date().toISOString();

  // ── Add/update client ──
  if(!S.clients) S.clients=[];
  var existing=S.clients.find(function(c){ return (c.phone&&c.phone===order.client_phone)||(c.email&&c.email===order.client_email); });
  if(existing){
    if(!existing.name&&order.client_name) existing.name=order.client_name;
  } else {
    S.clients.push({ id:Date.now(), name:order.client_name, phone:order.client_phone||'', email:order.client_email||'', channel:'خدمة', addedAt:new Date().toISOString() });
  }

  // ── Create Task (appears in kanban as جديد) ──
  var title = order.service_name + (order.pkg_name?' — '+order.pkg_name:'');
  var task = {
    id: Date.now(),
    title: title,
    desc: order.desc||'',
    status: 'جديد',           // ← shows in kanban New column
    kanbanCol: 'new',
    client: order.client_name,
    clientPhone: order.client_phone||'',
    clientEmail: order.client_email||'',
    price: order.price||0,
    currency: 'EGP',
    workerType:'me', workerMember:null, workerAmount:0,
    workerDepositPaid:false, workerDepositAmount:0,
    paymentCollected:false,
    steps:[], taskType:'خدمة',
    addedAt:new Date().toISOString(),
    done:false,
    source_order_id: order.id,
    source_service: order.service_name
  };
  if(!S.tasks) S.tasks=[];
  S.tasks.push(task);

  // ── Create client portal ──
  if(!S.client_portals) S.client_portals=[];
  var portal={
    id: 'cp_'+Date.now(),
    order_id: order.id,
    task_id: task.id,
    client_name: order.client_name,
    client_email: order.client_email||'',
    client_phone: order.client_phone||'',
    service_name: order.service_name,
    status: 'نشط',
    created_at: new Date().toISOString()
  };
  S.client_portals.push(portal);

  lsSave(); cloudSave(S);
  closeM('modal-order-accept');
  renderAll();
  toast('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم القبول — ظهرت مهمة جديدة في الكانبان!');
  addNotification('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> طلب جديد من '+order.client_name+' تحوّل لمهمة', 'success');
  
  // ── Auto-navigate hint ──
  setTimeout(function(){
    if(confirm('تم إنشاء المهمة! هل تريد الذهاب لصفحة المهام الآن؟')){
      showPage('tasks');
    }
  }, 400);
}
function rejectSvcOrder(orderId){
  var order=(S.svc_orders||[]).find(function(o){return String(o.id)===String(orderId);}); if(!order) return;
  if(!confirm('رفض هذا الطلب؟')) return;
  order.status='rejected';
  lsSave(); cloudSave(S); closeM('modal-order-accept'); renderServices(); renderSvcOrdersTable(); toast('<i class="fa-solid fa-xmark"></i> تم الرفض');
}

function acceptOrderAsTask(){
  var orderId=document.getElementById('oa-order-id').value; if(!orderId) return;
  var order=(S.svc_orders||[]).find(function(o){return String(o.id)===String(orderId);}); if(!order) return;
  if(order.status!=='pending'){ toast('هذا الطلب تم معالجته مسبقاً'); return; }

  var titleVal=(document.getElementById('oa-title')||{}).value||'';
  if(!titleVal.trim()){ toast('<i class="fa-solid fa-triangle-exclamation"></i> أدخل عنوان المهمة'); return; }
  var amtVal=+((document.getElementById('oa-amount')||{}).value||0);
  var depVal=+((document.getElementById('oa-deposit')||{}).value||0);
  var dlVal=(document.getElementById('oa-deadline')||{}).value||'';
  var notesVal=(document.getElementById('oa-notes')||{}).value||'';
  var workerVal=(document.getElementById('oa-worker')||{}).value||'me';

  order.status='accepted';
  order.accepted_at=new Date().toISOString();

  // Add/update client
  if(!S.clients) S.clients=[];
  var existing=S.clients.find(function(c){return (c.phone&&c.phone===order.client_phone)||(c.email&&c.email===order.client_email);});
  if(!existing){
    S.clients.push({id:Date.now(),name:order.client_name,phone:order.client_phone||'',email:order.client_email||'',channel:'خدمة',addedAt:new Date().toISOString()});
  }

  // Create task — appears in kanban as جديد
  var task={
    id: Date.now(),
    title: titleVal.trim(),
    desc: (order.desc||'')+(notesVal?' / '+notesVal:''),
    status: 'جديد',
    client: order.client_name,
    clientPhone: order.client_phone||'',
    clientEmail: order.client_email||'',
    price: amtVal||order.price||0,
    depositAmount: depVal,
    depositPaid: false,
    paymentCollected: false,
    deadline: dlVal,
    workerType: workerVal==='me'?'me':'member',
    workerMember: workerVal!=='me'?workerVal:null,
    workerAmount: 0,
    steps: [],
    taskType: 'خدمة',
    addedAt: new Date().toISOString(),
    done: false,
    source_order_id: order.id,
    source_service: order.service_name
  };
  if(!S.tasks) S.tasks=[];
  S.tasks.push(task);

  // Create client portal
  if(!S.client_portals) S.client_portals=[];
  S.client_portals.push({
    id:'cp_'+Date.now(), order_id:order.id, task_id:task.id,
    client_name:order.client_name, client_email:order.client_email||'',
    client_phone:order.client_phone||'', service_name:order.service_name,
    status:'نشط', created_at:new Date().toISOString()
  });

  lsSave(); cloudSave(S);
  closeM('modal-order-accept');
  renderAll();
  addNotification('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> طلب '+order.client_name+' تحوّل لمهمة جديدة في الكانبان!','success');
  toast('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم القبول — المهمة ظهرت في الكانبان!');

  setTimeout(function(){
    if(confirm('تم إنشاء المهمة في الكانبان! هل تريد الذهاب لصفحة المهام؟')){
      showPage('tasks');
    }
  },300);
}
function renderSvcOrdersTable(){
  var el=document.getElementById('svc-orders-table'); if(!el) return;
  var orders=(S.svc_orders||[]).slice().reverse();
  if(!orders.length){ el.innerHTML='<div class="empty card" style="text-align:center;padding:40px"><div style="font-size:36px;margin-bottom:12px"><i class="fa-solid fa-clipboard-list"></i></div><div>لا توجد طلبات بعد</div></div>'; return; }
  el.innerHTML=orders.map(function(o){
    var statusColor={pending:'var(--accent2)',accepted:'var(--accent3)',rejected:'var(--accent4)'}[o.status]||'var(--text3)';
    var statusLabel={pending:'⏳ معلق',accepted:'<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> مقبول',rejected:'<i class="fa-solid fa-xmark"></i> مرفوض'}[o.status]||o.status;
    // Find linked task
    var linkedTask=o.status==='accepted'?(S.tasks||[]).find(function(t){return t.source_order_id===o.id;}):null;
    var progress=linkedTask&&linkedTask.steps&&linkedTask.steps.length?Math.round(linkedTask.steps.filter(function(s){return s.done;}).length/linkedTask.steps.length*100):(linkedTask&&linkedTask.done?100:0);
    return '<div class="order-row '+o.status+'" style="cursor:pointer;flex-direction:column;align-items:stretch;gap:0" onclick="openOrderFullDetail(\''+o.id+'\')">'+
      '<div style="display:flex;align-items:center;gap:12px">'+
        '<div style="flex:1;min-width:0">'+
          '<div style="font-size:13px;font-weight:800">'+escapeHtml(o.client_name)+'</div>'+
          '<div style="font-size:11px;color:var(--text3);margin-top:2px">'+escapeHtml(o.service_name)+(o.pkg_name?' — <span style="color:var(--accent)">'+escapeHtml(o.pkg_name)+'</span>':'')+'</div>'+
          (o.client_phone?'<div style="font-size:11px;color:var(--text3)"><i class="fa-solid fa-mobile-screen"></i> '+escapeHtml(o.client_phone)+'</div>':'')+
          (o.price?'<div style="font-size:12px;font-weight:700;color:var(--accent);margin-top:3px">'+Number(o.price).toLocaleString()+' ج</div>':'')+
        '</div>'+
        '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">'+
          '<span style="font-size:11px;font-weight:700;color:'+statusColor+'">'+statusLabel+'</span>'+
          (o.status==='pending'?
            '<div style="display:flex;gap:5px" onclick="event.stopPropagation()">'+
              '<button class="btn btn-primary btn-sm" onclick="openOrderAccept(\''+o.id+'\')"><i class="fa-solid fa-check"></i> قبول</button>'+
              '<button class="btn btn-danger btn-sm" onclick="rejectSvcOrder(\''+o.id+'\')"><i class="fa-solid fa-xmark"></i></button>'+
            '</div>':
            (o.status==='accepted'&&!linkedTask?
              '<button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();openOrderToTask(\''+o.id+'\')" style="font-size:11px;color:var(--accent3)"><i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تحويل لمهمة</button>':
              '<button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();openOrderFullDetail(\''+o.id+'\')" style="font-size:11px">عرض التفاصيل ↗</button>'
            )
          )+
        '</div>'+
      '</div>'+
      (linkedTask?
        '<div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border)">'+
          '<div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:5px">'+
            '<span style="color:var(--text3)"><i class="fa-solid fa-clipboard-list"></i> '+escapeHtml(linkedTask.title)+'</span>'+
            '<span style="font-weight:700;color:var(--accent3)">'+progress+'%</span>'+
          '</div>'+
          '<div style="height:5px;background:var(--border);border-radius:3px">'+
            '<div style="height:100%;background:var(--accent3);border-radius:3px;width:'+progress+'%"></div>'+
          '</div>'+
        '</div>':'')
    +'</div>';
  }).join('');
}

function openOrderFullDetail(orderId){
  var order=(S.svc_orders||[]).find(function(o){return String(o.id)===String(orderId);}); if(!order) return;
  var linkedTask=order.status==='accepted'?(S.tasks||[]).find(function(t){return t.source_order_id===order.id;}):null;
  var overlay=document.createElement('div');
  overlay.style.cssText='position:fixed;inset:0;z-index:8000;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:16px';
  var statusColor={pending:'var(--accent2)',accepted:'var(--accent3)',rejected:'var(--accent4)'}[order.status]||'var(--text3)';
  var statusLabel={pending:'⏳ معلق',accepted:'<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> مقبول',rejected:'<i class="fa-solid fa-xmark"></i> مرفوض'}[order.status]||order.status;
  var progress=linkedTask&&linkedTask.steps&&linkedTask.steps.length?Math.round(linkedTask.steps.filter(function(s){return s.done;}).length/linkedTask.steps.length*100):(linkedTask&&linkedTask.done?100:0);
  var stepsHtml=linkedTask&&linkedTask.steps&&linkedTask.steps.length?
    '<div style="margin-top:14px"><div style="font-size:12px;font-weight:700;color:var(--text3);margin-bottom:8px">خطوات المهمة</div>'+
    '<div style="display:flex;flex-direction:column;gap:6px">'+
    linkedTask.steps.map(function(s){
      return '<div style="display:flex;align-items:center;gap:10px;padding:9px 12px;background:var(--surface2);border-radius:10px;font-size:12px">'+
        '<span style="font-size:15px">'+(s.done?'<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i>':'⏳')+'</span>'+
        '<span style="flex:1;'+(s.done?'text-decoration:line-through;color:var(--text3)':'')+'">'+escapeHtml(s.text)+'</span>'+
      '</div>';
    }).join('')+'</div>':'';

  overlay.innerHTML='<div style="background:var(--surface);border-radius:20px;max-width:560px;width:100%;max-height:90vh;overflow-y:auto;padding:24px">'+
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">'+
      '<div>'+
        '<div style="font-size:16px;font-weight:900">'+escapeHtml(order.client_name)+'</div>'+
        '<div style="font-size:12px;color:var(--text3);margin-top:3px">'+escapeHtml(order.service_name)+(order.pkg_name?' — '+escapeHtml(order.pkg_name):'')+'</div>'+
      '</div>'+
      '<button onclick="this.closest(\'[style*=fixed]\').remove()" class="close-btn"><i class="fa-solid fa-xmark"></i></button>'+
    '</div>'+
    '<div style="background:var(--surface2);border-radius:12px;padding:14px;margin-bottom:14px;display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:12px">'+
      (order.client_phone?'<div><div style="color:var(--text3)"><i class="fa-solid fa-mobile-screen"></i> واتساب</div><div style="font-weight:700">'+escapeHtml(order.client_phone)+'</div></div>':'')+
      (order.client_email?'<div><div style="color:var(--text3)"><i class="fa-solid fa-envelope"></i> إيميل</div><div style="font-weight:700">'+escapeHtml(order.client_email)+'</div></div>':'')+
      (order.price?'<div><div style="color:var(--text3)"><i class="fa-solid fa-coins"></i> السعر</div><div style="font-weight:700;color:var(--accent)">'+Number(order.price).toLocaleString()+' ج</div></div>':'')+
      '<div><div style="color:var(--text3)"><i class="fa-solid fa-calendar-days"></i> تاريخ الطلب</div><div style="font-weight:700">'+(order.created_at?new Date(order.created_at).toLocaleDateString('ar-EG'):'—')+'</div></div>'+
      '<div style="grid-column:span 2"><div style="color:var(--text3)">الحالة</div><div style="font-weight:700;color:'+statusColor+'">'+statusLabel+'</div></div>'+
    '</div>'+
    (order.desc?'<div style="font-size:12px;color:var(--text3);margin-bottom:14px"><div style="font-weight:700;margin-bottom:5px">وصف المشروع</div><div style="padding:10px;background:var(--surface2);border-radius:10px;line-height:1.7">'+escapeHtml(order.desc)+'</div></div>':'')+
    (linkedTask?
      '<div style="background:var(--surface2);border-radius:12px;padding:14px;margin-bottom:14px">'+
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">'+
          '<div style="font-size:13px;font-weight:800"><i class="fa-solid fa-clipboard-list"></i> '+escapeHtml(linkedTask.title)+'</div>'+
          '<span style="font-size:12px;font-weight:700;color:var(--accent3)">'+progress+'%</span>'+
        '</div>'+
        '<div style="height:8px;background:var(--border);border-radius:4px;margin-bottom:12px"><div style="height:100%;background:var(--accent3);border-radius:4px;width:'+progress+'%"></div></div>'+
        stepsHtml+
        '<button onclick="this.closest(\'[style*=fixed]\').remove();showPage(\'tasks\');setTimeout(function(){openTask('+linkedTask.id+')},300)" class="btn btn-ghost btn-sm" style="margin-top:12px;width:100%;justify-content:center">↗ فتح المهمة الكاملة</button>'+
      '</div>':
      (order.status==='pending'?
        '<div style="display:flex;gap:8px;margin-bottom:14px">'+
          '<button onclick="openOrderAccept(\''+order.id+'\');this.closest(\'[style*=fixed]\').remove()" class="btn btn-primary" style="flex:1;justify-content:center"><i class="fa-solid fa-check"></i> قبول الطلب وإنشاء مهمة</button>'+
          '<button onclick="rejectSvcOrder(\''+order.id+'\');this.closest(\'[style*=fixed]\').remove()" class="btn btn-danger"><i class="fa-solid fa-xmark"></i> رفض</button>'+
        '</div>':
        (order.status==='accepted'&&!linkedTask?
          '<div style="margin-bottom:14px"><button onclick="this.closest(\'[style*=fixed]\').remove();openOrderToTask(\''+order.id+'\')" class="btn btn-primary" style="width:100%;justify-content:center"><i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تحويل الطلب إلى مهمة</button></div>':'')
      )
    )+
    (order.client_phone?'<a href="https://wa.me/'+order.client_phone.replace(/[^0-9]/g,'')+'" target="_blank" class="btn btn-ghost" style="width:100%;justify-content:center;background:#25D366;color:#fff;border:none"><i class="fa-solid fa-mobile"></i> تواصل واتساب</a>':'')+
  '</div>';
  overlay.onclick=function(e){if(e.target===overlay)overlay.remove();};
  document.body.appendChild(overlay);
}

// ── Client Portals ──
function renderClientPortals(){
  var el=document.getElementById('svc-portals-grid'); if(!el) return;
  var portals=S.client_portals||[];
  if(!portals.length){ el.innerHTML='<div class="empty card" style="grid-column:span 3;text-align:center;padding:40px"><div style="font-size:36px;margin-bottom:12px"><i class="fa-solid fa-key"></i></div><div>لا توجد بوابات عملاء بعد</div><div style="font-size:12px;color:var(--text3);margin-top:8px">تُنشأ تلقائياً عند قبول طلب</div></div>'; return; }
  el.innerHTML=portals.map(function(p){
    var task=(S.tasks||[]).find(function(t){return String(t.id)===String(p.task_id);});
    var progress=task&&task.steps&&task.steps.length? Math.round(task.steps.filter(function(s){return s.done;}).length/task.steps.length*100) : (task&&task.done?100:0);
    return '<div class="portal-card" onclick="openClientPortal(\''+p.id+'\')">'+
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">'+
        '<div style="font-size:14px;font-weight:800">'+escapeHtml(p.client_name)+'</div>'+
        '<span style="font-size:10px;background:rgba(79,209,165,.15);color:var(--accent3);padding:2px 8px;border-radius:8px;font-weight:700">'+escapeHtml(p.status||'نشط')+'</span>'+
      '</div>'+
      '<div style="font-size:12px;color:var(--text3);margin-bottom:10px">'+escapeHtml(p.service_name)+'</div>'+
      '<div style="height:6px;background:var(--border);border-radius:4px;margin-bottom:8px"><div style="height:100%;background:var(--accent3);border-radius:4px;width:'+progress+'%"></div></div>'+
      '<div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text3)"><span>'+progress+'% مكتمل</span><span><i class="fa-solid fa-key"></i> عرض البوابة</span></div>'+
    '</div>';
  }).join('');
}
// ── رابط بوابة العميل الكاملة ──
function _showClientPortalLink(clientId){
  var c=(S.clients||[]).find(function(x){return String(x.id)===String(clientId);}); if(!c) return;
  var uid=(typeof _supaUserId!=='undefined'&&_supaUserId)?_supaUserId:'';
  var _pp2=window.location.pathname,_ps2=_pp2.split('/').filter(function(x){return x!=='';});
  if(_ps2.length&&['dashboard','tasks','projects','schedule','meetings','clients','finance','invoices','services','support','team','timetracker','goals','settings','reports'].indexOf(_ps2[_ps2.length-1])>=0)_ps2.pop();
  if(_ps2.length&&_ps2[_ps2.length-1].endsWith('.html'))_ps2.pop();
  var base=window.location.origin+(_ps2.length?'/'+_ps2.join('/')+'/' :'/') +'client-portal.html';
  var link=base+'?uid='+uid+'&cid='+clientId;
  var over=document.createElement('div');
  over.className='modal-overlay'; over.style.display='flex';
  over.innerHTML=`<div class="modal" style="max-width:500px">
    <div class="modal-header">
      <div class="modal-title"><i class="fa-solid fa-id-card" style="color:var(--accent3)"></i> بوابة العميل الكاملة</div>
      <button class="close-btn" onclick="this.closest('.modal-overlay').remove()"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div style="background:rgba(79,209,165,.08);border:1px solid rgba(79,209,165,.3);border-radius:12px;padding:16px;margin-bottom:14px">
      <div style="font-size:14px;font-weight:800;color:var(--accent3);margin-bottom:4px"><i class="fa-solid fa-user"></i> ${escapeHtml(c.name)}</div>
      ${c.phone?`<div style="font-size:12px;color:var(--text3);margin-bottom:2px"><i class="fa-solid fa-phone"></i> ${c.phone}</div>`:''}
      ${c.email?`<div style="font-size:12px;color:var(--text3)"><i class="fa-solid fa-envelope"></i> ${c.email}</div>`:''}
    </div>
    <div style="font-size:12px;color:var(--text2);margin-bottom:10px">العميل يشوف في البوابة:</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">
      ${[['📁 مشاريعه ومهامهم',''],['📦 طلباته',''],['📄 فواتيره',''],['📋 عقوده','']].map(function(x){
        return '<div style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:8px 12px;font-size:12px;font-weight:600">'+x[0]+'</div>';
      }).join('')}
    </div>
    <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:12px;font-family:monospace;font-size:11px;word-break:break-all;margin-bottom:14px;color:var(--text2)">${link}</div>
    <div style="display:flex;gap:8px">
      <button class="btn btn-primary" style="flex:1;justify-content:center" onclick="navigator.clipboard.writeText('${link}').then(()=>toast('<i class=\\'fa-solid fa-square-check\\' style=\\'color:var(--accent3)\\'></i> تم نسخ رابط بوابة ${escapeHtml(c.name)}'))">
        <i class="fa-solid fa-copy"></i> نسخ الرابط
      </button>
      <button class="btn btn-ghost" onclick="window.open('${link}','_blank')"><i class="fa-solid fa-eye"></i> معاينة</button>
    </div>
    <div style="font-size=11px;color:var(--text3);text-align:center;margin-top:10px"><i class="fa-solid fa-lock" style="margin-left:4px"></i> العميل يرى بياناته فقط — لا صلاحية تعديل</div>
  </div>`;
  document.body.appendChild(over);
  over.onclick=e=>{if(e.target===over)over.remove();};
}

function openClientPortal(portalId){
  var portal=(S.client_portals||[]).find(function(p){return p.id===portalId;}); if(!portal) return;
  var client = portal.client_id ? (S.clients||[]).find(function(c){return String(c.id)===String(portal.client_id);}) : null;
  if(!client && portal.client_name){
    client = (S.clients||[]).find(function(c){return c.name===portal.client_name;});
  }
  var uid=(typeof _supaUserId!=='undefined'&&_supaUserId)?_supaUserId:'';
  var _cppPath=window.location.pathname.split('/').filter(function(x){return x!=='';});
  if(_cppPath.length&&['dashboard','tasks','projects','schedule','meetings','clients','finance','invoices','services','support','team','timetracker','goals','settings','reports'].indexOf(_cppPath[_cppPath.length-1])>=0)_cppPath.pop();
  if(_cppPath.length&&_cppPath[_cppPath.length-1].endsWith('.html'))_cppPath.pop();
  var _cpBase=window.location.origin+(_cppPath.length?'/'+_cppPath.join('/')+'/' :'/')+'client-portal.html';
  // ✅ استخدم الرابط القصير
  var link = (typeof _shortPortalUrl==='function')
    ? (client ? _shortPortalUrl(client.id) : _buildPortalLink(portal.client_name, portal.id))
    : (client ? (_cpBase+'?uid='+uid+'&cid='+client.id) : _buildPortalLink(portal.client_name, portal.id));
  var taskLink = (client && portal.task_id)
    ? ((typeof _shortPortalUrl==='function') ? _shortPortalUrl(client.id, portal.task_id) : (_cpBase+'?uid='+uid+'&cid='+client.id+'&taskid='+portal.task_id))
    : link;

  var task=(S.tasks||[]).find(function(t){return String(t.id)===String(portal.task_id);});
  var body=document.getElementById('portal-body'); if(!body) return;
  var progress=task&&task.steps&&task.steps.length? Math.round(task.steps.filter(function(s){return s.done;}).length/task.steps.length*100) : (task&&task.done?100:0);

  // حفظ الروابط في متغيرات عالمية مؤقتة عشان الـ onclick يوصلها بأمان
  window._cpLink = link;
  window._cpTaskLink = taskLink;

  body.innerHTML=
    '<div style="background:var(--surface2);border-radius:12px;padding:14px;margin-bottom:12px">'+
      '<div style="font-size:13px;font-weight:800;margin-bottom:10px"><i class="fa-solid fa-user"></i> بيانات العميل</div>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px">'+
        '<div><span style="color:var(--text3)">الاسم:</span> <strong>'+escapeHtml(portal.client_name)+'</strong></div>'+
        '<div><span style="color:var(--text3)">الخدمة:</span> <strong>'+escapeHtml(portal.service_name)+'</strong></div>'+
        (portal.client_email?'<div><span style="color:var(--text3)">الإيميل:</span> <strong>'+escapeHtml(portal.client_email)+'</strong></div>':'')+
        (portal.client_phone?'<div><span style="color:var(--text3)">الهاتف:</span> <strong>'+escapeHtml(portal.client_phone)+'</strong></div>':'')+
      '</div>'+
    '</div>'+
    (task?
      '<div style="background:var(--surface2);border-radius:12px;padding:14px;margin-bottom:12px">'+
        '<div style="font-size:13px;font-weight:800;margin-bottom:8px"><i class="fa-solid fa-clipboard-list"></i> المهمة: '+escapeHtml(task.title)+'</div>'+
        '<div style="margin-bottom:8px"><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px"><span>التقدم</span><span>'+progress+'%</span></div>'+
        '<div style="height:8px;background:var(--border);border-radius:4px"><div style="height:100%;background:var(--accent3);border-radius:4px;width:'+progress+'%"></div></div></div>'+
        '<div style="font-size:12px;color:var(--text3)">الحالة: <strong style="color:var(--accent)">'+escapeHtml(task.status||'—')+'</strong></div>'+
      '</div>'
    : '<div style="background:rgba(247,201,72,.1);border-radius:12px;padding:14px;font-size:12px;color:var(--text3);margin-bottom:12px">لا توجد مهمة مرتبطة بعد</div>')+
    '<div style="background:rgba(79,209,165,.07);border:1.5px solid rgba(79,209,165,.3);border-radius:12px;padding:14px">'+
      '<div style="font-size:12px;font-weight:800;color:var(--accent3);margin-bottom:10px"><i class="fa-solid fa-link"></i> روابط البوابة</div>'+
      (task?
        '<div style="margin-bottom:10px">'+
          '<div style="font-size:11px;color:var(--text3);margin-bottom:5px">🔗 رابط المهمة (يفتح البوابة على المهمة):</div>'+
          '<div style="font-size:10px;color:var(--accent3);font-family:var(--mono);word-break:break-all;padding:6px 8px;background:var(--surface3);border-radius:6px;margin-bottom:6px;user-select:all">'+escapeHtml(taskLink)+'</div>'+
          '<div style="display:flex;gap:6px">'+
            '<button class="btn btn-ghost btn-sm" style="flex:1;justify-content:center;font-size:11px" onclick="navigator.clipboard.writeText(window._cpTaskLink).then(function(){toast(\'✅ تم نسخ رابط المهمة\')})"><i class="fa-solid fa-copy"></i> نسخ</button>'+
            '<button class="btn btn-primary btn-sm" style="font-size:11px" onclick="window.open(window._cpTaskLink,\'_blank\')"><i class="fa-solid fa-eye"></i> فتح</button>'+
          '</div>'+
        '</div>'
      : '')+
      '<div>'+
        '<div style="font-size:11px;color:var(--text3);margin-bottom:5px">🏠 بوابة العميل الكاملة:</div>'+
        '<div style="font-size:10px;color:var(--accent3);font-family:var(--mono);word-break:break-all;padding:6px 8px;background:var(--surface3);border-radius:6px;margin-bottom:6px;user-select:all">'+escapeHtml(link)+'</div>'+
        '<div style="display:flex;gap:6px">'+
          '<button class="btn btn-ghost btn-sm" style="flex:1;justify-content:center;font-size:11px" onclick="navigator.clipboard.writeText(window._cpLink).then(function(){toast(\'✅ تم نسخ رابط البوابة\')})"><i class="fa-solid fa-copy"></i> نسخ</button>'+
          '<button class="btn btn-success btn-sm" style="font-size:11px" onclick="window.open(window._cpLink,\'_blank\')"><i class="fa-solid fa-eye"></i> فتح البوابة</button>'+
        '</div>'+
      '</div>'+
    '</div>';
  openM('modal-portal');
}

// ── showPage hook for services ──
(function(){
  var _origShowPage = window.showPage;
  window.showPage = function(id, el){
    _origShowPage && _origShowPage.call(this, id, el);
    if(id==='services'){
      // Always reset to services tab so grid is visible
      if(typeof switchSvcTab==='function') switchSvcTab('services');
      if(typeof renderServices==='function'){ renderServices(); [200,600,1500].forEach(function(d){ setTimeout(renderServices,d); }); }
    }
  };
})();

// ── Public Order Page (client-facing) ──
function _checkSvcOrderUrl(){
  var params=new URLSearchParams(window.location.search);
  var uid=params.get('svcorder');
  // Handle username-based URL: ?u=username
  var _uname=params.get('u');
  // Inject scroll-unlock CSS immediately at start — before any DOM changes
  if(uid || _uname || params.get('portal') || params.get('clientportal')){
    var _earlyStyle = document.getElementById('_pub-early-style') || document.createElement('style');
    _earlyStyle.id = '_pub-early-style';
    _earlyStyle.textContent = 'html,body{overflow:auto!important;overflow-y:scroll!important;height:auto!important;min-height:100vh!important;position:static!important;}';
    if(!document.getElementById('_pub-early-style')) document.head.insertBefore(_earlyStyle, document.head.firstChild);
  }
  if(!uid && _uname){
    // ── لو في ?p=client-slug → بوابة العميل ──
    var _cslug = params.get('p');
    if(_cslug){
      if(window._showApp) window._showApp();
      document.documentElement.classList.add('pub-page');
      document.body.classList.add('pub-page');
      document.documentElement.style.overflow = 'auto';
      document.documentElement.style.height = 'auto';
      while(document.body.firstChild) document.body.removeChild(document.body.firstChild);
      document.body.style.cssText = 'margin:0;padding:0;overflow:auto;font-family:Cairo,Tajawal,sans-serif;direction:rtl';
      var ld2 = document.createElement('div');
      ld2.style.cssText = 'position:fixed;inset:0;background:#0a0a0f;display:flex;align-items:center;justify-content:center;font-family:Cairo,Tajawal,sans-serif;direction:rtl';
      ld2.innerHTML = '<div style="text-align:center"><div style="font-size:36px;margin-bottom:12px">⏳</div><div style="font-size:14px;color:#aaa">جاري تحميل بوابة العميل...</div></div>';
      document.body.appendChild(ld2);
      if(typeof supa !== 'undefined'){
        // جيب الـ userId من الـ username
        supa.from('studio_data').select('user_id').ilike('data->>username_index', _uname).maybeSingle()
          .then(function(res){
            var userId = res&&res.data&&res.data.user_id ? res.data.user_id : null;
            if(!userId){ _showCPError('لم يتم التعرف على الحساب'); return; }
            // جيب البيانات وابحث عن العميل بالـ slug
            supa.from('studio_data').select('data').eq('user_id', userId).maybeSingle()
              .then(function(res2){
                if(!res2||!res2.data){ _showCPError('لا توجد بيانات'); return; }
                var ud; try{ ud=typeof res2.data.data==='string'?JSON.parse(res2.data.data):res2.data.data; }catch(e){}
                if(!ud){ _showCPError('خطأ في البيانات'); return; }
                // ابحث عن العميل اللي slug اسمه يطابق
                var client = (ud.clients||[]).find(function(c){
                  var cs = (c.name||'').toLowerCase().replace(/\s+/g,'-').replace(/[^\u0600-\u06FFa-z0-9-]/g,'').replace(/-+/g,'-').replace(/^-|-$/g,'').slice(0,30);
                  return cs === _cslug;
                });
                if(!client){ _showCPError('لم يتم التعرف على العميل: ' + _cslug); return; }
                window._fullCPBuilt = true;
                _buildFullClientPortal(userId, String(client.id));
              }).catch(function(){ _showCPError('خطأ في تحميل البيانات'); });
          }).catch(function(){ _showCPError('خطأ في الاتصال'); });
      } else { _showCPError('النظام غير متاح'); }
      return;
    }

    // Show loading immediately and unlock scroll
    if(window._showApp) window._showApp();
    document.documentElement.classList.add('pub-page');
    document.body.classList.add('pub-page');

    // Force scroll on html — do NOT use cssText= as it gets wiped by innerHTML=
    document.documentElement.style.overflow = 'auto';
    document.documentElement.style.overflowY = 'scroll';
    document.documentElement.style.height = 'auto';

    // Build loading screen WITHOUT innerHTML= (which destroys inline styles)
    while(document.body.firstChild) document.body.removeChild(document.body.firstChild);
    document.body.style.overflow = 'auto';
    document.body.style.overflowY = 'auto';
    document.body.style.height = 'auto';
    document.body.style.position = 'static';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.fontFamily = 'Cairo,Tajawal,sans-serif';
    document.body.style.direction = 'rtl';

    var loadDiv = document.createElement('div');
    loadDiv.style.cssText = 'position:fixed;inset:0;background:#0a0a0f;display:flex;align-items:center;justify-content:center;font-family:Cairo,Tajawal,sans-serif;direction:rtl';
    loadDiv.innerHTML = '<div style="text-align:center"><div style="font-size:36px;margin-bottom:12px">⏳</div><div style="font-size:14px;color:#aaa">جاري تحميل المتجر...</div></div>';
    document.body.appendChild(loadDiv);
    // Lookup UID from username stored in studio_data JSON
    if(typeof supa!=='undefined'){
      // Use Supabase JSON path filter — efficient, no full scan
      supa.from('studio_data')
        .select('user_id')
        .ilike('data->>username_index', _uname)
        .maybeSingle()
        .then(function(res){
          if(res&&res.data&&res.data.user_id){
            _buildSvcOrderPage(res.data.user_id);
          } else {
            // Fallback: try text search in data column (slower but works)
            supa.from('studio_data')
              .select('user_id,data')
              .like('data::text', '%"username":"'+_uname+'"%')
              .limit(5)
              .then(function(res2){
                if(res2&&res2.data&&res2.data.length){
                  var found=null;
                  for(var i=0;i<res2.data.length;i++){
                    try{
                      var d=typeof res2.data[i].data==='string'?JSON.parse(res2.data[i].data):res2.data[i].data;
                      if(d&&d.settings&&d.settings.username&&d.settings.username.toLowerCase()===_uname.toLowerCase()){
                        found=res2.data[i].user_id; break;
                      }
                    }catch(e){}
                  }
                  if(found) _buildSvcOrderPage(found);
                  else _svcOrderFallback();
                } else _svcOrderFallback();
              }).catch(function(){ _svcOrderFallback(); });
          }
        }).catch(function(){ _svcOrderFallback(); });
      return;
    } else { _svcOrderFallback(); return; }
  }
  var portalId=params.get('portal');
  if(portalId && params.get('uid')) { _buildClientPortalPage(params.get('uid'), portalId); return; }
  // ── Full Client Portal (by client ID) ──
  var cpUid=params.get('clientportal'); var cpCid=params.get('cid');
  if(cpUid && cpCid) { window._fullCPBuilt=true; _buildFullClientPortal(cpUid, cpCid); return; }
  if(!uid) return;
  // Show body (was hidden) then replace content
  if(window._showApp) window._showApp();
  document.body.innerHTML='<div style="position:fixed;inset:0;background:#f0f0f8;display:flex;align-items:center;justify-content:center;font-family:Cairo,Tajawal,sans-serif;direction:rtl"><div style="text-align:center"><div style="font-size:36px;margin-bottom:12px">⏳</div><div style="font-size:14px;color:#666">جاري تحميل الصفحة...</div></div></div>';
  document.body.style.cssText='margin:0;padding:0;background:#f0f0f8;font-family:Cairo,Tajawal,sans-serif;direction:rtl';
  _buildSvcOrderPage(uid);
}
// Run ASAP — before DOMContentLoaded if possible
(function(){
  var p=new URLSearchParams(window.location.search);
  if(p.get('svcorder')||( p.get('portal')&&p.get('uid') )||p.get('u')||( p.get('clientportal')&&p.get('cid') )){
    // Mark as public page — auth functions check this flag
    window._isPublicPage = true;
    // Inject scroll-unlock style as FIRST child of head — overrides everything
    var earlyStyle = document.createElement('style');
    earlyStyle.id = '_pub-early-style';
    earlyStyle.textContent = 'html,body{overflow:auto!important;overflow-y:scroll!important;height:auto!important;min-height:100vh!important;position:static!important;max-height:none!important;}';
    document.head.insertBefore(earlyStyle, document.head.firstChild);
    // Add pub-page class IMMEDIATELY to unlock scroll before any CSS applies
    document.documentElement.classList.add('pub-page');
    document.addEventListener('DOMContentLoaded',function(){
      document.documentElement.classList.add('pub-page');
      document.body.classList.add('pub-page');
      _checkSvcOrderUrl();
    });
  }
})();
function _buildSvcOrderPage(userId){
  var params=new URLSearchParams(window.location.search);
  if(typeof supa==='undefined'){ _svcOrderFallback(); return; }
  var controller=new AbortController();
  var timer=setTimeout(function(){ controller.abort(); _svcOrderFallback(); }, 12000);
  supa.from('studio_data').select('data').eq('user_id',userId).maybeSingle().then(function(res){
    clearTimeout(timer);
    if(!res||res.error||!res.data){ _svcOrderFallback(); return; }
    var ud=null;
    try{
      var raw = res.data.data;
      // Handle double-encoded JSON
      if(typeof raw === 'string') { ud = JSON.parse(raw); }
      else if(typeof raw === 'object') { ud = raw; }
      // If ud itself has a nested .data field (double-wrapped)
      if(ud && ud.data && typeof ud.services === 'undefined' && typeof ud.data === 'object') {
        ud = ud.data;
      } else if(ud && ud.data && typeof ud.data === 'string') {
        try { ud = JSON.parse(ud.data); } catch(e2) {}
      }
    }catch(e){ ud = null; }
    if(!ud){ _svcOrderFallback(); return; }
    console.log('[Ordo Public] ud keys:', Object.keys(ud), '| services:', (ud.services||[]).length, '| standalone_packages:', (ud.standalone_packages||[]).length);

    // ── Force scroll unlock immediately ──
    document.documentElement.classList.add('pub-page');
    document.body.classList.add('pub-page');
    document.documentElement.style.overflow = 'auto';
    document.documentElement.style.overflowY = 'scroll';
    document.documentElement.style.height = 'auto';
    document.body.style.overflow = 'auto';
    document.body.style.overflowY = 'auto';
    document.body.style.height = 'auto';
    document.body.style.position = 'static';

    // ── Data ──
    // Check if specific store is requested
    var _storeId = params.get('store');
    var _storeObj = _storeId ? (ud.stores||[]).find(function(s){return s.id===_storeId;}) : null;
    // Filter services by store_id
    var services=(ud.services||[]).filter(function(s){
      if(!s.active && s.active !== undefined) return false;
      if(s.active === false) return false;
      if(_storeId) return s.store_id === _storeId;
      return !s.store_id || s.store_id === null || s.store_id === undefined || s.store_id === '';
    });
    // Fallback: if no services matched and no specific store requested, show all active
    if(!services.length && !_storeId){
      services=(ud.services||[]).filter(function(s){ return s.active!==false; });
    }
    // Filter packages by store_id — support legacy 'packages' key too
    var _allPkgs = ud.standalone_packages || ud.packages || [];
    var standalonePkgs=_allPkgs.filter(function(p){
      if(p.active === false) return false;
      if(_storeId) return p.store_id === _storeId;
      return !p.store_id || p.store_id === null || p.store_id === undefined || p.store_id === '';
    });
    // Fallback: if no packages matched and no specific store requested, show all active packages
    if(!standalonePkgs.length && !_storeId){
      standalonePkgs=_allPkgs.filter(function(p){ return p.active!==false; });
    }
    var pfProjects=ud.portfolio_projects||[];
    var settings=ud.settings||{};
    var isOrdersOpen=settings.svc_orders_open!==false;
    var siteDesc=settings.svc_site_desc||settings.bio||settings.desc||'';
    // Read accent from all possible storage locations
    var accent=settings.accent||settings.accentColor||settings.theme_color||'#7c6ff7';
    // Also try from localStorage platform_config as fallback
    try{ var _pc=JSON.parse(localStorage.getItem('platform_config')||'{}'); if(_pc.accent) accent=_pc.accent; }catch(e){}
    var banner=(_storeObj ? (_storeObj.banner||'') : (settings.svc_banner||''));
    var bannerSize=(_storeObj ? (_storeObj.banner_size||'md') : (settings.svc_banner_size||'md'));
    var bannerCustomPx=(_storeObj ? (_storeObj.banner_custom_px||300) : (settings.svc_banner_custom_px||300));
    var bannerH={sm:'160px',md:'260px',lg:'400px',custom:bannerCustomPx+'px'}[bannerSize]||'260px';
    var logo=settings.logo||'';
    var studioName=settings.name||'Ordo';
    var phone=settings.phone||'';
    var socials=settings.socials||[];
    var _dm = settings.displayMode||settings.display_mode||localStorage.getItem('studioDisplayMode')||'dark';
    var isLight=_dm==='light';

    // ── Colors ──
    var bg      =isLight?'#f4f5fb':'#0a0a0f';
    var surface =isLight?'#ffffff':'#111118';
    var surface2=isLight?'#f0f1f8':'#16161f';
    var surface3=isLight?'#e8e9f4':'#1c1c28';
    var textMain=isLight?'#1a1a2e':'#f0f0f5';
    var textSub =isLight?'#555577':'#aaaacc';
    var textMuted=isLight?'#888899':'#777799';
    var borderC =isLight?'rgba(0,0,0,.1)':'rgba(255,255,255,.08)';
    var cardBg  =isLight?'rgba(0,0,0,.03)':'rgba(255,255,255,.05)';
    var cardBorder=isLight?'rgba(0,0,0,.07)':'rgba(255,255,255,.09)';
    var navBg   =isLight?'rgba(255,255,255,.92)':'rgba(10,10,15,.92)';
    var sheetBg =isLight?'#ffffff':'#1a1a28';

    // ── Store globally ──
    window._pubUd=ud; window._pubUserId=userId; window._pubAccent=accent;
    window._pubSettings=settings;
    window._pubStoreId=_storeId;  // save store filter for detail pages
    window._pubColors={bg,surface,surface2,surface3,textMain,textSub,textMuted,borderC,cardBg,cardBorder,sheetBg,isLight};

    // ── Inject CSS ──
    var styleEl=document.createElement('style');
    styleEl.textContent=
      '@import url(\'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap\');'+
      '*{box-sizing:border-box;margin:0;padding:0}html{scroll-behavior:smooth}'+
      'html,body{height:auto !important;min-height:100vh;overflow-x:hidden !important;overflow-y:auto !important;scroll-behavior:smooth;position:static !important}'+
      'html.pub-page,body.pub-page{overflow:auto !important;overflow-y:auto !important;height:auto !important;position:static !important}'+
      '.app-shell,.sidebar,.app-header,.bottom-nav,#auth-screen{display:none !important}'+
      'body{font-family:\'Cairo\',sans-serif;background:'+bg+';color:'+textMain+';direction:rtl;min-height:100vh;position:relative}'+
      // Ambient glow - مش position:fixed علشان ما يعطلش السكرول
      'body::before{content:\'\';position:absolute;inset:0;z-index:0;pointer-events:none;min-height:100vh;'+
        'background:radial-gradient(ellipse 80% 60% at 15% 5%,'+accent+'1e 0%,transparent 60%),'+
        'radial-gradient(ellipse 60% 50% at 85% 90%,'+accent+'12 0%,transparent 60%)}'+

      // ── Navbar ──
      '._nav{position:sticky;top:0;z-index:1000;background:'+navBg+';backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);border-bottom:1px solid '+borderC+';padding:0 20px}'+
      '._nav-inner{max-width:1100px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;height:60px;gap:16px}'+
      '._nav-logo{display:flex;align-items:center;gap:10px;text-decoration:none;flex-shrink:0}'+
      '._nav-logo-img{height:36px;width:auto;max-width:140px;border-radius:0;object-fit:contain;border:none;background:transparent;display:block}'+
      '._nav-logo-ph{width:38px;height:38px;border-radius:10px;background:linear-gradient(135deg,'+accent+','+accent+'99);display:flex;align-items:center;justify-content:center;font-size:16px;color:#fff;font-weight:900}'+
      '._nav-name{font-size:16px;font-weight:900;color:'+textMain+'}'+
      '._nav-links{display:flex;align-items:center;gap:4px}'+
      '@media(max-width:640px){._nav-links{display:none}}'+
      '._nav-link{padding:6px 14px;border-radius:8px;font-size:13px;font-weight:700;color:'+textSub+';text-decoration:none;cursor:pointer;transition:.15s;background:none;border:none;font-family:\'Cairo\',sans-serif}'+
      '._nav-link:hover{background:'+cardBg+';color:'+textMain+'}'+
      '._nav-link.active{color:'+accent+';background:'+accent+'15}'+
      '._nav-book-btn{background:'+accent+';color:#fff;border:none;border-radius:10px;padding:8px 18px;font-size:13px;font-weight:800;cursor:pointer;font-family:\'Cairo\',sans-serif;white-space:nowrap;transition:.15s;flex-shrink:0}'+
      '._nav-book-btn:hover{opacity:.88}'+
      '._mob-menu-btn{display:none;background:none;border:1px solid '+borderC+';border-radius:8px;width:36px;height:36px;cursor:pointer;color:'+textMain+';font-size:16px;align-items:center;justify-content:center}'+
      '@media(max-width:640px){._mob-menu-btn{display:flex}}'+
      '._mob-menu{display:none;position:fixed;top:60px;inset-inline:0;background:'+navBg+';backdrop-filter:blur(18px);border-bottom:1px solid '+borderC+';z-index:999;padding:12px 20px;flex-direction:column;gap:4px}'+
      '._mob-menu.open{display:flex}'+
      '._mob-link{padding:11px 14px;border-radius:10px;font-size:14px;font-weight:700;color:'+textSub+';cursor:pointer;border:none;background:none;font-family:\'Cairo\',sans-serif;text-align:right;width:100%}'+
      '._mob-link:hover{background:'+cardBg+';color:'+textMain+'}'+

      // ── Main wrap ──
      '._pub-main{position:relative;z-index:1;max-width:1100px;margin:0 auto;padding:0 20px 80px;overflow:visible}'+
      '@media(max-width:640px){._pub-main{padding:0 12px 60px}}'+

      // ── Hero/Banner ──
      '._hero{border-radius:20px;overflow:hidden;margin:24px 0 40px;box-shadow:0 8px 40px rgba(0,0,0,.3);position:relative;background:'+surface2+';min-height:'+bannerH+'}'+
      '._hero img{width:100%;height:'+bannerH+';object-fit:cover;display:block;position:relative;z-index:1}'+
      '._hero-ph{height:'+bannerH+';background:linear-gradient(135deg,'+accent+'33 0%,'+accent+'11 50%,transparent 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:20px}'+
      '._hero-ph-title{font-size:clamp(24px,5vw,48px);font-weight:900;color:'+textMain+';margin-bottom:12px;line-height:1.2}'+
      '._hero-ph-sub{font-size:clamp(12px,2vw,16px);color:'+textSub+';max-width:500px;line-height:1.7}'+
      '._hero-badge{position:absolute;top:16px;right:16px;display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border-radius:20px;font-size:11px;font-weight:700}'+

      // ── Section ──
      '._sec{margin-bottom:56px}'+
      '._sec-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px}'+
      '._sec-title{font-size:20px;font-weight:900;color:'+textMain+';display:flex;align-items:center;gap:8px}'+
      '._sec-more{font-size:13px;font-weight:700;color:'+accent+';cursor:pointer;background:none;border:1px solid '+accent+'44;border-radius:8px;padding:5px 14px;font-family:\'Cairo\',sans-serif;transition:.15s}'+
      '._sec-more:hover{background:'+accent+'15}'+

      // ── Service cards ──
      '._svc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px}'+
      '@media(max-width:480px){._svc-grid{grid-template-columns:1fr 1fr;gap:10px}}'+
      '._svc-card{background:'+surface+';border:1px solid '+cardBorder+';border-radius:16px;overflow:hidden;cursor:pointer;transition:transform .2s,border-color .2s,box-shadow .2s;position:relative}'+
      '._svc-card:hover{transform:translateY(-5px);border-color:'+accent+'55;box-shadow:0 16px 40px '+accent+'1a}'+
      '._svc-img{width:100%;height:140px;object-fit:cover;display:block}'+
      '._svc-img-ph{width:100%;height:90px;background:linear-gradient(135deg,'+accent+'22,'+accent+'0a);display:flex;align-items:center;justify-content:center;font-size:36px}'+
      '._svc-body{padding:14px}'+
      '._svc-cat{font-size:10px;font-weight:700;color:'+accent+';margin-bottom:4px;text-transform:uppercase;letter-spacing:.3px}'+
      '._svc-name{font-size:14px;font-weight:800;color:'+textMain+';margin-bottom:5px;line-height:1.35}'+
      '._svc-desc{font-size:11px;color:'+textSub+';line-height:1.65;margin-bottom:10px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}'+
      '._svc-foot{display:flex;align-items:center;justify-content:space-between;gap:6px}'+
      '._svc-price{font-size:15px;font-weight:900;color:'+accent+'}'+
      '._svc-btn{background:'+accent+';color:#fff;border:none;border-radius:8px;padding:7px 13px;font-size:10px;font-weight:800;cursor:pointer;font-family:\'Cairo\',sans-serif;white-space:nowrap;transition:.15s}'+
      '._svc-btn:hover{opacity:.85}'+

      // ── Package cards ──
      '._pkg-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px}'+
      '@media(max-width:480px){._pkg-grid{grid-template-columns:1fr 1fr;gap:10px}}'+
      '._pkg-card{background:'+surface+';border:1px solid '+cardBorder+';border-radius:16px;overflow:hidden;cursor:pointer;transition:.2s;display:flex;flex-direction:column}'+
      '._pkg-card:hover{border-color:'+accent+'55;transform:translateY(-4px);box-shadow:0 14px 36px '+accent+'1a}'+
      '._pkg-thumb{width:100%;height:110px;object-fit:cover;display:block}'+
      '._pkg-thumb-ph{width:100%;height:60px;background:linear-gradient(135deg,'+accent+'22,'+accent+'0a);display:flex;align-items:center;justify-content:center;font-size:28px}'+
      '._pkg-body{padding:14px;flex:1;display:flex;flex-direction:column}'+
      '._pkg-name{font-size:14px;font-weight:800;color:'+textMain+';margin-bottom:5px}'+
      '._pkg-desc{font-size:11px;color:'+textSub+';line-height:1.6;margin-bottom:8px;flex:1;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}'+
      '._pkg-items{display:flex;flex-direction:column;gap:3px;margin-bottom:10px}'+
      '._pkg-item{font-size:11px;color:'+textSub+'}._pkg-item span{color:'+accent+'}'+
      '._pkg-foot{display:flex;align-items:center;justify-content:space-between;margin-top:auto}'+
      '._pkg-price{font-size:17px;font-weight:900;color:'+accent+'}'+
      '._pkg-order-btn-sm{background:'+accent+';color:#fff;border:none;border-radius:8px;padding:7px 13px;font-size:10px;font-weight:800;cursor:pointer;font-family:\'Cairo\',sans-serif;transition:.15s}'+
      '._pkg-order-btn-sm:hover{opacity:.85}'+

      // ── Portfolio ──
      '._pf-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}'+
      '@media(max-width:480px){._pf-grid{grid-template-columns:1fr 1fr 1fr;gap:7px}}'+
      '._pf-card{border-radius:12px;overflow:hidden;aspect-ratio:1;background:'+surface3+';border:1px solid '+cardBorder+';position:relative;cursor:pointer;transition:.2s}'+
      '._pf-card:hover{transform:scale(1.03);border-color:'+accent+'55}'+
      '._pf-card img{width:100%;height:100%;object-fit:cover;display:block}'+
      '._pf-card-ph{width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:8px;text-align:center}'+

      // ── Full service page overlay ──
      '._svc-page{position:fixed;inset:0;z-index:9990;background:'+bg+';overflow-y:auto;animation:_spIn .3s ease}'+
      '@keyframes _spIn{from{opacity:0;transform:translateX(30px)}to{opacity:1;transform:translateX(0)}}'+
      '._svc-page-inner{max-width:760px;margin:0 auto;padding:0 16px 80px}'+
      '._svc-page-back{display:flex;align-items:center;gap:8px;padding:16px 0 4px;font-size:13px;font-weight:700;color:'+accent+';cursor:pointer;background:none;border:none;font-family:\'Cairo\',sans-serif}'+
      '._svc-page-hero{border-radius:20px;overflow:hidden;margin-bottom:20px;box-shadow:0 8px 32px rgba(0,0,0,.3)}'+
      '._svc-page-hero img{width:100%;max-height:300px;object-fit:cover;display:block}'+
      '._svc-page-hero-ph{width:100%;height:160px;background:linear-gradient(135deg,'+accent+'33,'+accent+'11);display:flex;align-items:center;justify-content:center;font-size:72px;border-radius:20px}'+
      '._svc-page-title{font-size:24px;font-weight:900;color:'+textMain+';margin-bottom:6px}'+
      '._svc-page-cat{font-size:11px;font-weight:700;color:'+accent+';margin-bottom:10px;text-transform:uppercase}'+
      '._svc-page-price-row{display:flex;align-items:center;gap:12px;margin-bottom:22px;flex-wrap:wrap}'+
      '._svc-direct-price{font-size:28px;font-weight:900;color:'+accent+'}'+
      '._svc-delivery-badge{display:inline-flex;align-items:center;gap:5px;padding:6px 14px;background:'+cardBg+';border:1px solid '+cardBorder+';border-radius:20px;font-size:12px;color:'+textSub+'}'+
      '._svc-page-desc{font-size:14px;color:'+textSub+';line-height:1.9;margin-bottom:20px}'+
      '._terms-box{background:'+cardBg+';border:1px solid '+cardBorder+';border-radius:16px;padding:18px 20px;margin-bottom:24px}'+
      '._terms-title{font-size:13px;font-weight:800;color:'+textMuted+';margin-bottom:12px}'+
      '._term-item{display:flex;align-items:flex-start;gap:10px;font-size:13px;color:'+textSub+';padding:5px 0}'+
      '._term-tick{color:'+accent+';font-size:15px;flex-shrink:0;margin-top:1px}'+
      '._order-big-btn{width:100%;background:linear-gradient(135deg,'+accent+','+accent+'bb);color:#fff;border:none;border-radius:14px;padding:16px;font-size:16px;font-weight:900;cursor:pointer;font-family:\'Cairo\',sans-serif;margin-top:10px;display:flex;align-items:center;justify-content:center;gap:8px;transition:.2s;box-shadow:0 6px 24px '+accent+'44}'+
      '._order-big-btn:hover{opacity:.88;transform:translateY(-2px)}'+

      // ── Order bottom sheet ──
      '._ord-overlay{position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.7);display:flex;align-items:flex-end;justify-content:center;animation:_pubFadeIn .22s ease}'+
      '._ord-sheet{background:'+sheetBg+';border-radius:22px 22px 0 0;max-width:640px;width:100%;padding:24px 22px 40px;max-height:92vh;overflow-y:auto;animation:_pubSlideUp .3s cubic-bezier(.25,1.2,.5,1)}'+
      '@keyframes _pubFadeIn{from{opacity:0}to{opacity:1}}'+
      '@keyframes _pubSlideUp{from{transform:translateY(80px);opacity:0}to{transform:translateY(0);opacity:1}}'+
      '._ord-handle{width:44px;height:4px;background:'+borderC+';border-radius:4px;margin:0 auto 20px}'+
      '._ord-input{width:100%;padding:13px 16px;background:'+cardBg+';border:1.5px solid '+borderC+';border-radius:12px;color:'+textMain+';font-family:\'Cairo\',sans-serif;font-size:13px;outline:none;transition:.15s;margin-bottom:10px;direction:rtl}'+
      '._ord-input:focus{border-color:'+accent+'}'+
      '._ord-input::placeholder{color:'+textMuted+'}'+
      '._ord-submit{width:100%;background:linear-gradient(135deg,'+accent+','+accent+'bb);color:#fff;border:none;border-radius:12px;padding:15px;font-size:15px;font-weight:900;cursor:pointer;font-family:\'Cairo\',sans-serif;margin-top:8px;transition:.2s;box-shadow:0 4px 18px '+accent+'44}'+
      '._ord-submit:hover{opacity:.88}'+
      '._ord-submit:disabled{opacity:.45;cursor:not-allowed}'+

      // ── Footer ──
      '._footer{background:'+surface2+';border-top:1px solid '+borderC+';padding:36px 20px 24px;margin-top:60px}'+
      '._footer-inner{max-width:1100px;margin:0 auto}'+
      '._footer-top{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;margin-bottom:24px}'+
      '._footer-brand{display:flex;align-items:center;gap:10px}'+
      '._footer-socials{display:flex;gap:8px;flex-wrap:wrap}'+
      '._footer-soc{width:38px;height:38px;border-radius:10px;background:'+cardBg+';border:1px solid '+cardBorder+';display:flex;align-items:center;justify-content:center;font-size:16px;text-decoration:none;transition:.15s;cursor:pointer}'+
      '._footer-soc:hover{background:'+accent+'22;border-color:'+accent+'55}'+
      '._footer-bottom{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;padding-top:16px;border-top:1px solid '+borderC+';font-size:12px;color:'+textMuted+'}';
    document.head.appendChild(styleEl);

    // CSS إضافي لضمان السكرول - يتغلب على أي CSS موروث من الـ app
    // scrollFixStyle removed — handled by pub-page class CSS

    // ── SOCIALS map ──
    var SICONS={instagram:'<i class="fa-brands fa-instagram" style="color:#E1306C"></i>',facebook:'<i class="fa-brands fa-facebook" style="color:#1877F2"></i>',tiktok:'<i class="fa-brands fa-tiktok"></i>',youtube:'<i class="fa-brands fa-youtube" style="color:#FF0000"></i>',twitter:'<i class="fa-brands fa-x-twitter"></i>',whatsapp:'<i class="fa-brands fa-whatsapp" style="color:#25D366"></i>',website:'<i class="fa-solid fa-globe" style="color:#7c6ff7"></i>',behance:'<i class="fa-brands fa-behance" style="color:#1769FF"></i>',snapchat:'<i class="fa-brands fa-snapchat" style="color:#FFFC00"></i>',linkedin:'<i class="fa-brands fa-linkedin" style="color:#0077B5"></i>'};
    var SURLS={whatsapp:function(v){return 'https://wa.me/'+v.replace(/\D/g,'');},instagram:function(v){return v.startsWith('http')?v:'https://instagram.com/'+v;},facebook:function(v){return v.startsWith('http')?v:'https://facebook.com/'+v;},tiktok:function(v){return v.startsWith('http')?v:'https://tiktok.com/@'+v;}};
    function socialUrl(platform,val){ return (SURLS[platform]?SURLS[platform](val):val.startsWith('http')?val:'https://'+val); }

    var footerSocialsHtml='';
    if(phone) footerSocialsHtml+='<a href="https://wa.me/'+phone.replace(/\D/g,'')+'" target="_blank" class="_footer-soc" title="واتساب"><i class="fa-solid fa-comments"></i></a>';
    socials.forEach(function(sc){ footerSocialsHtml+='<a href="'+escapeHtml(socialUrl(sc.platform,sc.url||sc.value||''))+'" target="_blank" class="_footer-soc" title="'+(sc.label||sc.platform||'')+'">'+((SICONS[sc.platform])||'<i class="fa-solid fa-link"></i>')+'</a>'; });

    // ── Use store name/desc override if specific store requested ──
    if(_storeObj){
      studioName = _storeObj.name || studioName;
      siteDesc = _storeObj.desc || siteDesc;
    }

    // ── NAVBAR ──
    function scrollToId(id){ var el=document.getElementById(id); if(el) el.scrollIntoView({behavior:'smooth',block:'start'}); }
    var navHtml='<nav class="_nav" id="_pub-nav">'+
      '<div class="_nav-inner">'+
        '<a class="_nav-logo" href="#">'+
          (_validImgSrc(logo)?'<img class="_nav-logo-img" src="'+escapeHtml(logo)+'" alt="">':'<div class="_nav-logo-ph">'+(studioName||'S').charAt(0)+'</div>')+
          '<span class="_nav-name">'+escapeHtml(studioName)+'</span>'+
        '</a>'+
        '<div class="_nav-links">'+
          '<button class="_nav-link active" onclick="scrollToId(\'_sec-hero\')">الرئيسية</button>'+
          '<button class="_nav-link" onclick="scrollToId(\'_sec-svcs\')">الخدمات</button>'+
          (standalonePkgs.length?'<button class="_nav-link" onclick="scrollToId(\'_sec-pkgs\')">الباقات</button>':'')+
          (pfProjects.length?'<button class="_nav-link" onclick="scrollToId(\'_sec-pf\')">أعمالنا</button>':'')+
          '<button class="_nav-link" onclick="scrollToId(\'_sec-contact\')">تواصل معنا</button>'+
        '</div>'+
        (phone||socials.length?'<button class="_nav-book-btn" onclick="_openBookingForm()"><i class="fa-solid fa-calendar-days"></i> حجز موعد</button>':'')+
        '<button class="_nav-book-btn" onclick="_openPublicContactForm()" style="background:transparent;border:1.5px solid '+accent+'55;color:'+textMain+'"><i class="fa-solid fa-envelope-open-text"></i> تواصل معنا</button>'+
        '<button class="_mob-menu-btn" onclick="_toggleMobMenu()" aria-label="قائمة">☰</button>'+
      '</div>'+
    '</nav>'+
    '<div class="_mob-menu" id="_pub-mob-menu">'+
      '<button class="_mob-link" onclick="scrollToId(\'_sec-hero\');_toggleMobMenu()"><i class="fa-solid fa-house"></i> الرئيسية</button>'+
      '<button class="_mob-link" onclick="scrollToId(\'_sec-svcs\');_toggleMobMenu()"><i class="fa-solid fa-bag-shopping"></i> الخدمات</button>'+
      (standalonePkgs.length?'<button class="_mob-link" onclick="scrollToId(\'_sec-pkgs\');_toggleMobMenu()"><i class="fa-solid fa-box"></i> الباقات</button>':'')+
      (pfProjects.length?'<button class="_mob-link" onclick="scrollToId(\'_sec-pf\');_toggleMobMenu()"><i class="fa-solid fa-image"></i> أعمالنا</button>':'')+
      '<button class="_mob-link" onclick="scrollToId(\'_sec-contact\');_toggleMobMenu()"><i class="fa-solid fa-phone"></i> تواصل معنا</button>'+
      (phone?'<button class="_mob-link" style="color:'+accent+';font-weight:800" onclick="_openBookingForm();_toggleMobMenu()"><i class="fa-solid fa-calendar-days"></i> حجز موعد</button>':'')+
      '<button class="_mob-link" style="font-weight:800" onclick="_openPublicContactForm();_toggleMobMenu()"><i class="fa-solid fa-envelope-open-text"></i> تواصل معنا</button>'+
    '</div>';

    // ── HERO/BANNER ──
    var heroHtml='<div id="_sec-hero" style="scroll-margin-top:70px">'+
      '<div class="_hero">'+
        (banner
          ?'<img src="'+escapeHtml(banner)+'" alt="" onload="this.style.opacity=1" style="opacity:0;transition:opacity .5s ease" onerror=\'this.style.display=\"none\"\'">'
          :'<div class="_hero-ph">'+
              '<div class="_hero-ph-title">'+escapeHtml(studioName)+'</div>'+
              (siteDesc?'<div class="_hero-ph-sub">'+escapeHtml(siteDesc)+'</div>':'')+
           '</div>')+
        '<div class="_hero-badge" style="background:'+(isOrdersOpen?'rgba(79,209,165,.9)':'rgba(255,80,80,.9)')+';color:#fff">'+
          (isOrdersOpen?'✅ متاح للطلب':'⏸ مغلق مؤقتاً')+
        '</div>'+
      '</div>'+
    '</div>';

    // ── SERVICES section ──
    var svcsHtml=services.slice(0,6).map(function(svc,idx){
      var priceDisplay=svc.price&&+svc.price?Number(svc.price).toLocaleString()+' '+(svc.currency||'ج.م'):'عند الطلب';
      return '<div class="_svc-card">'+
        (svc.image?'<img class="_svc-img" src="'+escapeHtml(svc.image)+'" alt="" loading="lazy" onclick="_openSvcPage('+idx+')" style="cursor:pointer">':'<div class="_svc-img-ph" onclick="_openSvcPage('+idx+')" style="cursor:pointer">'+(svc.icon||'<i class="fa-solid fa-bag-shopping"></i>')+'</div>')+
        '<div class="_svc-body">'+
          (svc.cat?'<div class="_svc-cat" onclick="_openSvcPage('+idx+')" style="cursor:pointer">'+escapeHtml(svc.cat)+'</div>':'')+
          '<div class="_svc-name" onclick="_openSvcPage('+idx+')" style="cursor:pointer">'+escapeHtml(svc.name)+'</div>'+
          (svc.desc?'<div class="_svc-desc" onclick="_openSvcPage('+idx+')" style="cursor:pointer">'+escapeHtml(svc.desc)+'</div>':'')+
          '<div class="_svc-foot">'+
            '<div class="_svc-price">'+priceDisplay+'</div>'+
            '<div style="display:flex;gap:5px">'+
              (svc.payment_link?'<a href="'+escapeHtml(svc.payment_link)+'" target="_blank" class="_svc-btn" style="text-decoration:none;background:linear-gradient(135deg,#4fd1a5,#38b28a);color:#fff;display:flex;align-items:center;justify-content:center;gap:4px" onclick="event.stopPropagation()"><i class="fa-solid fa-credit-card" style="font-size:11px"></i> ادفع</a>':'') +
              '<button class="_svc-btn" onclick="event.stopPropagation();_openOrderFormNew(\''+encodeURIComponent(svc.name)+'\',\'\','+(svc.price||0)+',\''+encodeURIComponent(svc.payment_link||'')+'\')">اطلب ←</button>'+
            '</div>'+
          '</div>'+
        '</div>'+
      '</div>';
    }).join('');

    var svcsSection='<div class="_sec" id="_sec-svcs" style="scroll-margin-top:70px">'+
      '<div class="_sec-head">'+
        '<div class="_sec-title"><i class="fa-solid fa-bag-shopping"></i> خدماتنا</div>'+
        (services.length>6?'<button class="_sec-more" onclick="_showAllSvcs()">عرض الكل ('+services.length+')</button>':'')+
      '</div>'+
      (services.length
        ?'<div class="_svc-grid" id="_svc-grid-main">'+svcsHtml+'</div>'
        :'<div style="text-align:center;padding:50px 20px">'+
            '<div style="font-size:48px;margin-bottom:12px">🛍️</div>'+
            '<div style="font-size:15px;font-weight:700;color:'+textMain+';margin-bottom:6px">لا توجد خدمات متاحة حالياً</div>'+
            '<div style="font-size:12px;color:'+textMuted+'">سيتم إضافة الخدمات قريباً</div>'+
          '</div>')+
    '</div>';

    // ── PACKAGES section ──
    var pkgsSection='';
    console.log('[Ordo Public] standalone_packages in ud:', (ud.standalone_packages||[]).length, '| filtered standalonePkgs:', standalonePkgs.length, '| _storeId:', _storeId);
    if(standalonePkgs.length){
      var pkgsHtml=standalonePkgs.slice(0,4).map(function(p,idx){
        return '<div class="_pkg-card">'+
          (p.thumb?'<img class="_pkg-thumb" src="'+escapeHtml(p.thumb)+'" alt="" loading="lazy" onclick="_openPkgPage('+idx+')" style="cursor:pointer">':'<div class="_pkg-thumb-ph" onclick="_openPkgPage('+idx+')" style="cursor:pointer"><i class="fa-solid fa-box"></i></div>')+
          '<div class="_pkg-body">'+
            '<div class="_pkg-name" onclick="_openPkgPage('+idx+')" style="cursor:pointer">'+escapeHtml(p.name)+'</div>'+
            (p.desc?'<div class="_pkg-desc" onclick="_openPkgPage('+idx+')" style="cursor:pointer">'+escapeHtml(p.desc)+'</div>':'')+
            (p.items&&p.items.length?'<div class="_pkg-items">'+p.items.slice(0,3).map(function(it){return '<div class="_pkg-item"><span><i class="fa-solid fa-check"></i> </span>'+escapeHtml(it)+'</div>';}).join('')+'</div>':'')+
            '<div class="_pkg-foot">'+
              '<div class="_pkg-price">'+(p.price?Number(p.price).toLocaleString()+' '+(p.currency||'ج.م'):'عند الطلب')+'</div>'+
              '<div style="display:flex;gap:4px;flex-wrap:wrap">'+
                '<button class="_pkg-order-btn-sm" onclick="event.stopPropagation();_openPkgPage('+idx+')" style="background:transparent;border:1.5px solid '+accent+'55;color:'+accent+'">تفاصيل</button>'+
                (p.payment_link?'<a href="'+escapeHtml(p.payment_link)+'" target="_blank" class="_pkg-order-btn-sm" style="text-decoration:none;background:linear-gradient(135deg,#4fd1a5,#38b28a);color:#fff;display:inline-flex;align-items:center;gap:3px" onclick="event.stopPropagation()"><i class="fa-solid fa-credit-card" style="font-size:10px"></i> ادفع</a>':'')+
                '<button class="_pkg-order-btn-sm" onclick="event.stopPropagation();_openOrderFormNew(\'\',\''+encodeURIComponent(p.name)+'\','+(p.price||0)+',\''+encodeURIComponent(p.payment_link||'')+'\')">اطلب ←</button>'+
              '</div>'+
            '</div>'+
          '</div>'+
        '</div>';
      }).join('');
      pkgsSection='<div class="_sec" id="_sec-pkgs" style="scroll-margin-top:70px">'+
        '<div class="_sec-head">'+
          '<div class="_sec-title"><i class="fa-solid fa-box"></i> باقاتنا</div>'+
          (standalonePkgs.length>4?'<button class="_sec-more" onclick="_showAllPkgs()">عرض الكل ('+standalonePkgs.length+')</button>':'')+
        '</div>'+
        '<div class="_pkg-grid">'+pkgsHtml+'</div>'+
      '</div>';
    }

    // ── PORTFOLIO section ──
    var pfSection='';
    if(pfProjects.length){
      var pfCards=pfProjects.slice(0,9).map(function(p){
        var img=p.image||p.thumb||'';
        var link=p.link||p.url||'#';
        return '<a class="_pf-card" href="'+escapeHtml(link)+'" target="_blank">'+
          (img?'<img src="'+escapeHtml(img)+'" alt="" loading="lazy" onerror=\'this.style.display=\"none\"\'">':
          '<div class="_pf-card-ph">'+
            '<div style="font-size:26px;margin-bottom:5px">'+(p.type==='behance'?'<i class="fa-solid fa-palette"></i>':'<i class="fa-solid fa-folder"></i>')+'</div>'+
            '<div style="font-size:10px;font-weight:700;color:'+textSub+'">'+escapeHtml((p.title||p.label||'مشروع').slice(0,20))+'</div>'+
          '</div>')+
        '</a>';
      }).join('');
      pfSection='<div class="_sec" id="_sec-pf" style="scroll-margin-top:70px">'+
        '<div class="_sec-head">'+
          '<div class="_sec-title"><i class="fa-solid fa-image"></i> بعض أعمالنا</div>'+
          (pfProjects.length>9?'<button class="_sec-more" onclick="_showAllPf()">المزيد ('+pfProjects.length+')</button>':'')+
        '</div>'+
        '<div class="_pf-grid">'+pfCards+'</div>'+
      '</div>';
    }

    // ── CONTACT section ──
    var contactHtml='<div id="_sec-contact" class="_sec" style="scroll-margin-top:70px">'+
      '<div class="_sec-head"><div class="_sec-title"><i class="fa-solid fa-phone"></i> تواصل معنا</div></div>'+
      '<div style="display:flex;flex-direction:column;gap:10px">'+
        (phone?'<a href="https://wa.me/'+phone.replace(/\D/g,'')+'" target="_blank" style="display:flex;align-items:center;gap:14px;padding:16px 18px;background:'+surface+';border:1px solid '+cardBorder+';border-radius:14px;text-decoration:none;color:'+textMain+';transition:.15s">'+
          '<span style="font-size:22px"><i class="fa-solid fa-mobile-screen"></i></span>'+
          '<div><div style="font-size:11px;color:'+textMuted+'">واتساب</div><div style="font-size:14px;font-weight:700">'+escapeHtml(phone)+'</div></div>'+
        '</a>':'')+
        (settings.email?'<a href="mailto:'+escapeHtml(settings.email)+'" style="display:flex;align-items:center;gap:14px;padding:16px 18px;background:'+surface+';border:1px solid '+cardBorder+';border-radius:14px;text-decoration:none;color:'+textMain+';transition:.15s">'+
          '<span style="font-size:22px"><i class="fa-solid fa-envelope"></i></span>'+
          '<div><div style="font-size:11px;color:'+textMuted+'">البريد الإلكتروني</div><div style="font-size:14px;font-weight:700">'+escapeHtml(settings.email)+'</div></div>'+
        '</a>':'')+
        '<button onclick="_openPublicContactForm()" style="display:flex;align-items:center;gap:14px;padding:16px 18px;background:linear-gradient(135deg,'+accent+'22,'+accent+'0a);border:1.5px solid '+accent+'44;border-radius:14px;width:100%;cursor:pointer;color:'+textMain+';font-family:Cairo,sans-serif;text-align:right;transition:.15s" onmouseover="this.style.borderColor=\''+accent+'\'" onmouseout="this.style.borderColor=\''+accent+'44\'">'+
          '<span style="font-size:22px"><i class="fa-solid fa-envelope-open-text"></i></span>'+
          '<div><div style="font-size:11px;color:'+textMuted+'">إرسال رسالة</div><div style="font-size:14px;font-weight:700;color:'+accent+'">تواصل معنا مباشرة</div></div>'+
        '</button>'+
      '</div>'+
    '</div>';

    // ── FOOTER ──
    var footerHtml='<footer class="_footer">'+
      '<div class="_footer-inner">'+
        '<div class="_footer-top">'+
          '<div class="_footer-brand">'+
            (logo?'<img src="'+escapeHtml(logo)+'" style="width:36px;height:36px;border-radius:9px;object-fit:cover;border:2px solid '+accent+'44">':'<div style="width:36px;height:36px;border-radius:9px;background:'+accent+';display:flex;align-items:center;justify-content:center;font-size:15px;color:#fff;font-weight:900">'+(studioName||'S').charAt(0)+'</div>')+
            '<span style="font-size:15px;font-weight:900;color:'+textMain+'">'+escapeHtml(studioName)+'</span>'+
          '</div>'+
          '<div class="_footer-socials">'+footerSocialsHtml+'</div>'+
        '</div>'+
        '<div class="_footer-bottom">'+
          '<span>© '+new Date().getFullYear()+' '+escapeHtml(studioName)+'</span>'+
          (phone?'<a href="https://wa.me/'+phone.replace(/\D/g,'')+'" target="_blank" style="background:'+accent+';color:#fff;text-decoration:none;padding:7px 16px;border-radius:8px;font-size:12px;font-weight:700"><i class="fa-solid fa-calendar-days"></i> احجز موعد</a>':'')+
        '</div>'+
      '</div>'+
    '</footer>';

    // ── Assemble page ──
    // Clear body without using innerHTML= to preserve inline styles on html/body
    while(document.body.firstChild) document.body.removeChild(document.body.firstChild);

    // ═══ CSS override to force scroll ═══
    var oldOv = document.getElementById('_pub-override'); if(oldOv) oldOv.remove();
    var pubOverride = document.createElement('style');
    pubOverride.id = '_pub-override';
    pubOverride.textContent =
      'html { overflow: auto !important; overflow-y: scroll !important; height: auto !important; min-height: 100vh !important; }' +
      'body { overflow: auto !important; overflow-x: hidden !important; overflow-y: auto !important; height: auto !important; position: static !important; min-height: 100vh !important; margin:0 !important; padding:0 !important; }' +
      '.app-shell, #app-body, .main-content, .sidebar, #bottom-nav, .bottom-nav-bar, .app-header, #auth-screen { display: none !important; }';
    document.head.appendChild(pubOverride);

    // Add pub-page classes
    document.documentElement.classList.add('pub-page');
    document.body.classList.add('pub-page');

    // Force inline styles
    document.documentElement.style.overflow = 'auto';
    document.documentElement.style.overflowY = 'scroll';
    document.documentElement.style.height = 'auto';
    document.body.style.overflow = 'auto';
    document.body.style.overflowY = 'auto';
    document.body.style.height = 'auto';
    document.body.style.position = 'static';
    document.body.style.margin = '0';
    document.body.style.padding = '0';

    document.body.insertAdjacentHTML('beforeend', navHtml);
    var main=document.createElement('div');
    main.className='_pub-main';
    main.innerHTML=heroHtml+svcsSection+pkgsSection+pfSection+contactHtml;
    document.body.appendChild(main);
    document.body.insertAdjacentHTML('beforeend', footerHtml);

    window._publicUd=ud; window._publicUserId=userId; window._publicAccent=accent;
    window._publicSettings=settings;

    // ── Re-apply scroll after all DOM mutations ──
    requestAnimationFrame(function(){
      document.documentElement.style.overflow = 'auto';
      document.documentElement.style.overflowY = 'scroll';
      document.documentElement.style.height = 'auto';
      document.body.style.overflow = 'auto';
      document.body.style.overflowY = 'auto';
      document.body.style.height = 'auto';
      document.body.style.position = 'static';
    });

    // ── Navbar scroll active ──
    window.addEventListener('scroll', function(){
      var sections=['_sec-hero','_sec-svcs','_sec-pkgs','_sec-pf','_sec-contact'];
      var links=document.querySelectorAll('._nav-link');
      var current=0;
      sections.forEach(function(id,i){ var el=document.getElementById(id); if(el&&window.scrollY>=el.offsetTop-80) current=i; });
      links.forEach(function(l,i){ l.classList.toggle('active',i===current); });
    },{passive:true});

  }).catch(function(){ _svcOrderFallback(); });
}

// ── Mobile menu toggle ──
window._toggleMobMenu=function(){
  var m=document.getElementById('_pub-mob-menu'); if(m) m.classList.toggle('open');
};

// ── Show all services ──
window._showAllSvcs=function(){
  var ud=window._pubUd; if(!ud) return;
  var C=window._pubColors; var accent=window._pubAccent;
  var _sid=window._pubStoreId;
  var services=(ud.services||[]).filter(function(s){
    if(s.active===false) return false;
    if(_sid) return s.store_id===_sid;
    return !s.store_id;
  });
  var grid=document.getElementById('_svc-grid-main'); if(!grid) return;
  grid.innerHTML=services.map(function(svc,idx){
    var priceDisplay=svc.price&&+svc.price?Number(svc.price).toLocaleString()+' '+(svc.currency||'ج.م'):'عند الطلب';
    return '<div class="_svc-card">'+
      (svc.image?'<img class="_svc-img" src="'+escapeHtml(svc.image)+'" alt="" loading="lazy" onclick="_openSvcPage('+idx+')" style="cursor:pointer">':'<div class="_svc-img-ph" onclick="_openSvcPage('+idx+')" style="cursor:pointer">'+(svc.icon||'<i class="fa-solid fa-bag-shopping"></i>')+'</div>')+
      '<div class="_svc-body">'+
        (svc.cat?'<div class="_svc-cat" onclick="_openSvcPage('+idx+')" style="cursor:pointer">'+escapeHtml(svc.cat)+'</div>':'')+
        '<div class="_svc-name" onclick="_openSvcPage('+idx+')" style="cursor:pointer">'+escapeHtml(svc.name)+'</div>'+
        (svc.desc?'<div class="_svc-desc" onclick="_openSvcPage('+idx+')" style="cursor:pointer">'+escapeHtml(svc.desc)+'</div>':'')+
        '<div class="_svc-foot"><div class="_svc-price">'+priceDisplay+'</div>'+
          '<div style="display:flex;gap:5px">'+
            (svc.payment_link?'<a href="'+escapeHtml(svc.payment_link)+'" target="_blank" class="_svc-btn" style="text-decoration:none;background:linear-gradient(135deg,#4fd1a5,#38b28a);color:#fff;display:flex;align-items:center;gap:3px" onclick="event.stopPropagation()"><i class="fa-solid fa-credit-card" style="font-size:10px"></i> ادفع</a>':'')+
            '<button class="_svc-btn" onclick="event.stopPropagation();_openOrderFormNew(\''+encodeURIComponent(svc.name)+'\',\'\','+(svc.price||0)+',\''+encodeURIComponent(svc.payment_link||'')+'\')">اطلب ←</button>'+
          '</div>'+
        '</div>'+
      '</div></div>';
  }).join('');
  var btn=document.querySelector('[onclick="_showAllSvcs()"]'); if(btn) btn.remove();
};

// ── Show all packages ──
window._showAllPkgs=function(){
  var ud=window._pubUd; if(!ud) return;
  var accent=window._pubAccent;
  var _sid=window._pubStoreId;
  var standalonePkgs=(ud.standalone_packages||[]).filter(function(p){
    if(p.active===false) return false;
    if(_sid) return p.store_id===_sid;
    return !p.store_id;
  });
  var grid=document.querySelector('#_sec-pkgs ._pkg-grid'); if(!grid) return;
  grid.innerHTML=standalonePkgs.map(function(p,idx){
    return '<div class="_pkg-card">'+
      (p.thumb?'<img class="_pkg-thumb" src="'+escapeHtml(p.thumb)+'" alt="" onclick="_openPkgPage('+idx+')" style="cursor:pointer">':'<div class="_pkg-thumb-ph" onclick="_openPkgPage('+idx+')" style="cursor:pointer"><i class="fa-solid fa-box"></i></div>')+
      '<div class="_pkg-body">'+
        '<div class="_pkg-name" onclick="_openPkgPage('+idx+')" style="cursor:pointer">'+escapeHtml(p.name)+'</div>'+
        (p.desc?'<div class="_pkg-desc" onclick="_openPkgPage('+idx+')" style="cursor:pointer">'+escapeHtml(p.desc)+'</div>':'')+
        (p.items&&p.items.length?'<div class="_pkg-items">'+p.items.slice(0,3).map(function(it){return '<div class="_pkg-item"><span><i class="fa-solid fa-check"></i> </span>'+escapeHtml(it)+'</div>';}).join('')+'</div>':'')+
        '<div class="_pkg-foot"><div class="_pkg-price">'+(p.price?Number(p.price).toLocaleString()+' ج':'عند الطلب')+'</div>'+
          '<div style="display:flex;gap:4px">'+
            '<button class="_pkg-order-btn-sm" onclick="event.stopPropagation();_openPkgPage('+idx+')" style="background:transparent;border:1.5px solid '+accent+'55;color:'+accent+'">تفاصيل</button>'+
            '<button class="_pkg-order-btn-sm" onclick="event.stopPropagation();_openOrderFormNew(\'\',\''+encodeURIComponent(p.name)+'\','+(p.price||0)+')">اطلب ←</button>'+
          '</div>'+
        '</div>'+
      '</div></div>';
  }).join('');
  var btn=document.querySelector('[onclick="_showAllPkgs()"]'); if(btn) btn.remove();
};

// ── Open full service page ──
window._openSvcPage=function(idx){
  var ud=window._pubUd; var accent=window._pubAccent; var C=window._pubColors;
  if(!ud) return;
  var _sid=window._pubStoreId;
  var svc=(ud.services||[]).filter(function(s){
    if(s.active===false) return false;
    if(_sid) return s.store_id===_sid;
    return !s.store_id;
  })[idx]; if(!svc) return;
  var ex=document.getElementById('_svc-full-page'); if(ex) ex.remove();

  // Terms
  var termsHtml='';
  if(svc.terms&&svc.terms.length){
    termsHtml='<div class="_terms-box">'+
      '<div class="_terms-title"><i class="fa-solid fa-check"></i> ماذا تحصل عليه</div>'+
      svc.terms.map(function(t){ return '<div class="_term-item"><span class="_term-tick"><i class="fa-solid fa-check"></i></span><span>'+escapeHtml(t)+'</span></div>'; }).join('')+
    '</div>';
  }

  // Portfolio from linked category
  var portHtml='';
  var pfProjects=ud.portfolio_projects||[];
  var linkedCat=svc.portfolio_cat;
  var relatedPf=linkedCat?pfProjects.filter(function(p){return p.cat===linkedCat;}):[];
  if(relatedPf.length){
    portHtml='<div style="margin-bottom:24px">'+
      '<div style="font-size:13px;font-weight:800;color:'+C.textMuted+';margin-bottom:12px"><i class="fa-solid fa-image"></i> أعمال مشابهة</div>'+
      '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">'+
      relatedPf.slice(0,6).map(function(p){
        var img=p.image||p.thumb||'';
        var link=p.link||p.url||'#';
        return '<a class="_pf-card" href="'+escapeHtml(link)+'" target="_blank">'+
          (img?'<img src="'+escapeHtml(img)+'" alt="" loading="lazy" onerror=\'this.style.display=\"none\"\'">':
          '<div class="_pf-card-ph"><div style="font-size:22px">'+(p.type==='behance'?'<i class="fa-solid fa-palette"></i>':'<i class="fa-solid fa-folder"></i>')+'</div></div>')+
        '</a>';
      }).join('')+'</div></div>';
  }

  var page=document.createElement('div');
  page.id='_svc-full-page'; page.className='_svc-page';
  page.innerHTML=
    '<div class="_svc-page-inner">'+
      '<button class="_svc-page-back" onclick="document.getElementById(\'_svc-full-page\').remove()">← رجوع</button>'+
      (svc.image?'<div class="_svc-page-hero"><img src="'+escapeHtml(svc.image)+'"></div>':'<div class="_svc-page-hero-ph">'+(svc.icon||'<i class="fa-solid fa-bag-shopping"></i>')+'</div>')+
      (svc.cat?'<div class="_svc-page-cat">'+escapeHtml(svc.cat)+'</div>':'')+
      '<div class="_svc-page-title">'+escapeHtml(svc.name)+'</div>'+
      '<div class="_svc-page-price-row">'+
        (svc.price&&+svc.price?'<div class="_svc-direct-price">'+Number(svc.price).toLocaleString()+' ج</div>':'')+
        (svc.delivery?'<div class="_svc-delivery-badge"><i class="fa-solid fa-stopwatch"></i> '+escapeHtml(svc.delivery)+'</div>':'')+
      '</div>'+
      (svc.desc?'<p class="_svc-page-desc">'+escapeHtml(svc.desc)+'</p>':'')+
      termsHtml+
      portHtml+
      '<button class="_order-big-btn" onclick="_openOrderFormNew(\''+encodeURIComponent(svc.name)+'\',\'\','+(svc.price||0)+',\''+encodeURIComponent(svc.payment_link||'')+'\')"><i class="fa-solid fa-rocket"></i> اطلب الخدمة الآن</button>'+
    '</div>';
  document.body.appendChild(page);
  page.scrollTo({top:0}); window.scrollTo({top:0,behavior:'smooth'});
};

// ── Order Form (Service / Package) ──
window._openOrderFormNew=function(svcName, pkgName, price, paymentLink){
  var accent=window._pubAccent||'#7c6ff7';
  var userId=window._pubUserId;
  var C=window._pubColors||{textMain:'#f0f0f5',textSub:'#aaaacc',textMuted:'#777799',cardBg:'rgba(255,255,255,.05)',borderC:'rgba(255,255,255,.08)',sheetBg:'#1a1a28'};
  var decodedSvc=svcName?decodeURIComponent(svcName):'';
  var decodedPkg=pkgName?decodeURIComponent(pkgName):'';
  var decodedPayLink=paymentLink?decodeURIComponent(paymentLink):'';
  var title=(decodedSvc||(decodedPkg?'باقة '+decodedPkg:'طلب خدمة'));
  var ex=document.getElementById('_order-overlay'); if(ex) ex.remove();
  var ov=document.createElement('div');
  ov.id='_order-overlay'; ov.className='_ord-overlay';
  ov.innerHTML='<div class="_ord-sheet">'+
    '<div class="_ord-handle"></div>'+
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">'+
      '<div style="font-size:18px;font-weight:900;color:'+C.textMain+'"><i class="fa-solid fa-rocket"></i> طلب الخدمة</div>'+
      '<button onclick="document.getElementById(\'_order-overlay\').remove()" style="background:'+C.cardBg+';border:1px solid '+C.borderC+';width:34px;height:34px;border-radius:50%;font-size:16px;cursor:pointer;color:'+C.textMain+'"><i class="fa-solid fa-xmark"></i></button>'+
    '</div>'+
    '<div style="background:'+accent+'18;border:1px solid '+accent+'33;border-radius:10px;padding:10px 14px;margin-bottom:14px;font-size:13px;font-weight:700;color:'+C.textMain+'">'+
      (decodedSvc?'<i class="fa-solid fa-bag-shopping"></i> '+decodedSvc:'')+(decodedPkg?'<i class="fa-solid fa-box"></i> '+decodedPkg:'')+
      (price&&+price?'<span style="float:left;color:'+accent+';font-size:15px;font-weight:900">'+Number(price).toLocaleString()+' ج</span>':'')+
    '</div>'+
    '<input id="_order-name" class="_ord-input" placeholder="الاسم الكامل *">'+
    '<input id="_order-phone" class="_ord-input" placeholder="رقم الواتساب *" type="tel">'+
    '<input id="_order-email" class="_ord-input" placeholder="البريد الإلكتروني (اختياري)" type="email" dir="ltr">'+
    '<textarea id="_order-desc" class="_ord-input" rows="3" placeholder="وصف المشروع أو ملاحظاتك..."></textarea>'+
    '<button class="_ord-submit" onclick="_submitOrderForm(\''+userId+'\',\''+encodeURIComponent(decodedSvc)+'\',\''+encodeURIComponent(decodedPkg)+'\','+(price||0)+',\''+encodeURIComponent(decodedPayLink)+'\')"><i class="fa-solid fa-paper-plane"></i> إرسال الطلب</button>'+
  '</div>';
  ov.onclick=function(e){if(e.target===ov)ov.remove();};
  document.body.appendChild(ov);
};

window._submitOrderForm=function(userId,svcName,pkgName,price,paymentLink){
  var name=(document.getElementById('_order-name')||{}).value||'';
  var phone=(document.getElementById('_order-phone')||{}).value||'';
  var email=(document.getElementById('_order-email')||{}).value||'';
  var desc=(document.getElementById('_order-desc')||{}).value||'';
  if(!name.trim()||!phone.trim()){
    var errEl=document.getElementById('_ord-err');
    if(!errEl){errEl=document.createElement('div');errEl.id='_ord-err';errEl.style.cssText='color:#ff6b6b;font-size:12px;margin-bottom:8px;padding:8px 12px;background:rgba(255,107,107,.1);border-radius:8px;border:1px solid rgba(255,107,107,.3)';
    var sheet=document.querySelector('._ord-sheet');if(sheet){var sb=document.getElementById('_ord-submit-btn');sheet.insertBefore(errEl,sb);}}
    errEl.textContent='الاسم ورقم الواتساب مطلوبان'; return;
  }
  var btn=document.getElementById('_ord-submit-btn')||document.querySelector('._ord-submit');
  if(btn){btn.disabled=true;btn.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> جاري الإرسال...';}
  var decodedSvc=svcName?decodeURIComponent(svcName):'';
  var decodedPkg=pkgName?decodeURIComponent(pkgName):'';
  var decodedPay=paymentLink?decodeURIComponent(paymentLink):'';
  var order={
    id:Date.now()+'_o',type:'svc_order',client_name:name,client_phone:phone,client_email:email,
    service_name:decodedSvc||decodedPkg||'خدمة',pkg_name:decodedPkg||'',price:+price||0,
    desc:desc,status:'pending',created_at:new Date().toISOString(),read:false
  };
  supa.from('studio_data').select('data').eq('user_id',userId).maybeSingle().then(function(res){
    if(!res||!res.data) return;
    var ud=null;try{ud=typeof res.data.data==='string'?JSON.parse(res.data.data):res.data.data;}catch(e){}
    if(!ud) return;
    ud.svc_orders=ud.svc_orders||[]; ud.svc_orders.push(order);
    ud._pending_notifications=ud._pending_notifications||[];
    ud._pending_notifications.push({id:order.id+'_n',title:'<i class="fa-solid fa-inbox"></i> طلب خدمة جديد!',body:name+' — '+(decodedSvc||decodedPkg),type:'svc_order',created_at:new Date().toISOString(),read:false});
    return supa.from('studio_data').update({data:JSON.stringify(ud),updated_at:new Date().toISOString()}).eq('user_id',userId);
  }).then(function(){
    document.getElementById('_order-overlay')&&document.getElementById('_order-overlay').remove();
    var accent=window._pubAccent||'#7c6ff7';
    var C=window._pubColors||{textMain:'#f0f0f5',sheetBg:'#1a1a28',borderC:'rgba(255,255,255,.08)'};
    var popup=document.createElement('div');
    popup.id='_success-popup';
    popup.style.cssText='position:fixed;inset:0;z-index:10001;background:rgba(0,0,0,.8);display:flex;align-items:center;justify-content:center;padding:20px;animation:_pubFadeIn .2s ease';
    popup.innerHTML=
      '<div style="background:'+C.sheetBg+';border-radius:22px;max-width:400px;width:100%;padding:28px 22px;text-align:center;border:1px solid '+C.borderC+'">'+
        '<div style="font-size:56px;margin-bottom:12px">\uD83C\uDF89</div>'+
        '<div style="font-size:20px;font-weight:900;color:'+C.textMain+';margin-bottom:8px">تم إرسال طلبك!</div>'+
        '<div style="font-size:13px;color:#aaa;margin-bottom:24px;line-height:1.8">شكراً <b>'+escapeHtml(name)+'</b>!<br>سنتواصل معك قريباً عبر الواتساب.</div>'+
        '<div style="display:flex;flex-direction:column;gap:10px">'+
          (decodedPay
            ?'<a href="'+escapeHtml(decodedPay)+'" target="_blank" style="display:flex;align-items:center;justify-content:center;gap:8px;background:linear-gradient(135deg,#4fd1a5,#38b28a);color:#fff;text-decoration:none;padding:14px 18px;border-radius:13px;font-size:14px;font-weight:900;font-family:Cairo,sans-serif" onclick="document.getElementById(\'_success-popup\').remove()"><i class="fa-solid fa-credit-card"></i> ادفع الآن</a>'
            :'')+
          '<button onclick="document.getElementById(\'_success-popup\').remove()" style="background:'+accent+'18;border:1.5px solid '+accent+'44;color:'+accent+';padding:12px 18px;border-radius:13px;font-size:13px;font-weight:800;cursor:pointer;font-family:Cairo,sans-serif;width:100%"><i class="fa-solid fa-check"></i> حسناً، شكراً!</button>'+
        '</div>'+
      '</div>';
    popup.onclick=function(e){if(e.target===popup)popup.remove();};
    document.body.appendChild(popup);
  }).catch(function(e){if(btn){btn.disabled=false;btn.innerHTML='<i class="fa-solid fa-paper-plane"></i> إرسال الطلب';}});
};

// ── Package Detail Page ──
window._openPkgPage=function(idx){
  var ud=window._pubUd; var accent=window._pubAccent; var C=window._pubColors;
  if(!ud) return;
  var _sid=window._pubStoreId;
  var standalonePkgs=(ud.standalone_packages||[]).filter(function(p){
    if(p.active===false) return false;
    if(_sid) return p.store_id===_sid;
    return !p.store_id;
  });
  var p=standalonePkgs[idx]; if(!p) return;
  var ex=document.getElementById('_pkg-full-page'); if(ex) ex.remove();
  var page=document.createElement('div');
  page.id='_pkg-full-page'; page.className='_svc-page';
  page.innerHTML=
    '<div class="_svc-page-inner">'+
      '<button class="_svc-page-back" onclick="document.getElementById(\'_pkg-full-page\').remove()">← رجوع</button>'+
      (p.thumb?'<div class="_svc-page-hero"><img src="'+escapeHtml(p.thumb)+'"></div>':'<div class="_svc-page-hero-ph"><i class="fa-solid fa-box"></i></div>')+
      '<div class="_svc-page-title">'+escapeHtml(p.name)+'</div>'+
      '<div class="_svc-page-price-row">'+
        (p.price&&+p.price?'<div class="_svc-direct-price">'+Number(p.price).toLocaleString()+' ج</div>':'')+
        (p.delivery?'<div class="_svc-delivery-badge"><i class="fa-solid fa-stopwatch"></i> '+escapeHtml(p.delivery)+'</div>':'')+
        (p.revisions?'<div class="_svc-delivery-badge"><i class="fa-solid fa-rotate"></i> '+p.revisions+' تعديلات</div>':'')+
      '</div>'+
      (p.desc?'<p class="_svc-page-desc">'+escapeHtml(p.desc)+'</p>':'')+
      (p.items&&p.items.length?
        '<div class="_terms-box">'+
          '<div class="_terms-title"><i class="fa-solid fa-clipboard-list"></i> ما يشمله الباقة</div>'+
          p.items.map(function(it){return '<div class="_term-item"><span class="_term-tick"><i class="fa-solid fa-check"></i></span><span>'+escapeHtml(it)+'</span></div>';}).join('')+
        '</div>':'')+
      '<button class="_order-big-btn" onclick="_openOrderFormNew(\'\',\''+encodeURIComponent(p.name)+'\','+(p.price||0)+',\''+encodeURIComponent(p.payment_link||'')+'\')"><i class="fa-solid fa-rocket"></i> اطلب الباقة الآن</button>'+
    '</div>';
  document.body.appendChild(page);
  page.scrollTo({top:0}); window.scrollTo({top:0,behavior:'smooth'});
};

// ── Booking form ──
window._openBookingForm=function(){
  var accent=window._pubAccent||'#7c6ff7';
  var userId=window._pubUserId;
  var C=window._pubColors;
  var ud=window._pubUd||{};
  var slots=(ud.settings&&ud.settings.meeting_slots)||[];
  var ex=document.getElementById('_book-overlay'); if(ex) ex.remove();
  var ov=document.createElement('div');
  ov.id='_book-overlay'; ov.className='_ord-overlay';

  // Build available slots HTML
  var slotsHtml='';
  if(slots.length){
    slotsHtml='<div style="margin-bottom:14px">'+
      '<div style="font-size:12px;font-weight:700;color:'+C.textSub+';margin-bottom:8px"><i class="fa-solid fa-alarm-clock"></i> الأوقات المتاحة للحجز</div>'+
      '<div style="display:flex;flex-wrap:wrap;gap:6px" id="_book-slots-wrap">'+
      slots.map(function(s,i){
        return '<button onclick="_selectBookSlot(this,\''+s.day+' '+s.from+' - '+s.to+'\')" '+
          'style="padding:7px 12px;border-radius:8px;border:1.5px solid '+accent+'44;background:transparent;color:'+C.textMain+';font-family:Cairo,sans-serif;font-size:12px;font-weight:700;cursor:pointer;transition:.15s" '+
          'onmouseover="this.style.background=\''+accent+'22\'" onmouseout="if(!this.dataset.sel)this.style.background=\'transparent\'" '+
          '>'+s.day+' · '+s.from+' - '+s.to+'</button>';
      }).join('')+
      '</div></div>';
  }

  ov.innerHTML='<div class="_ord-sheet">'+
    '<div class="_ord-handle"></div>'+
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">'+
      '<div style="font-size:18px;font-weight:900;color:'+C.textMain+'"><i class="fa-solid fa-calendar-days"></i> حجز موعد</div>'+
      '<button onclick="document.getElementById(\'_book-overlay\').remove()" style="background:'+C.cardBg+';border:1px solid '+C.borderC+';width:34px;height:34px;border-radius:50%;font-size:16px;cursor:pointer;color:'+C.textMain+'"><i class="fa-solid fa-xmark"></i></button>'+
    '</div>'+
    slotsHtml+
    '<input id="_book-name" class="_ord-input" placeholder="الاسم الكامل *">'+
    '<input id="_book-phone" class="_ord-input" placeholder="رقم الواتساب *" type="tel">'+
    '<input id="_book-time" class="_ord-input" placeholder="'+(slots.length?'الوقت المختار':'الوقت المناسب لك (مثال: الأحد 3م)')+'" '+(slots.length?'readonly style="background:'+C.cardBg+'"':'')+'>'+
    '<textarea id="_book-msg" class="_ord-input" rows="3" placeholder="موضوع الموعد..."></textarea>'+
    '<button class="_ord-submit" onclick="_submitBooking(\''+userId+'\')">إرسال طلب الموعد <i class="fa-solid fa-calendar-days"></i></button>'+
  '</div>';
  ov.onclick=function(e){if(e.target===ov)ov.remove();};
  document.body.appendChild(ov);
};

window._selectBookSlot=function(btn,slotLabel){
  // Deselect all
  var wrap=document.getElementById('_book-slots-wrap');
  if(wrap) wrap.querySelectorAll('button').forEach(function(b){
    b.style.background='transparent'; b.style.borderColor=window._pubAccent+'44'; delete b.dataset.sel;
  });
  // Select this
  btn.style.background=window._pubAccent+'33';
  btn.style.borderColor=window._pubAccent;
  btn.dataset.sel='1';
  var inp=document.getElementById('_book-time'); if(inp) inp.value=slotLabel;
};


window._submitBooking=function(userId){
  var name=(document.getElementById('_book-name')||{}).value||'';
  var phone=(document.getElementById('_book-phone')||{}).value||'';
  var time=(document.getElementById('_book-time')||{}).value||'';
  var msg=(document.getElementById('_book-msg')||{}).value||'';
  if(!name||!phone){alert('الاسم ورقم الواتساب مطلوبان');return;}
  var btn=document.querySelector('._ord-submit[onclick*="_submitBooking"]');
  if(btn){btn.disabled=true;btn.textContent='⏳ جاري الإرسال...';}
  var meeting={id:Date.now()+'_m',type:'meeting_request',client_name:name,client_phone:phone,preferred_time:time,message:msg,created_at:new Date().toISOString(),read:false};
  supa.from('studio_data').select('data').eq('user_id',userId).maybeSingle().then(function(res){
    if(!res||!res.data) return;
    var ud=null;try{ud=typeof res.data.data==='string'?JSON.parse(res.data.data):res.data.data;}catch(e){}
    if(!ud) return;
    ud.support_msgs=ud.support_msgs||[]; ud.support_msgs.push(meeting);
    ud._pending_notifications=ud._pending_notifications||[];
    ud._pending_notifications.push({id:meeting.id+'_n',title:'<i class="fa-solid fa-calendar-days"></i> طلب موعد!',body:'طلب من '+name,type:'meeting',created_at:new Date().toISOString(),read:false});
    return supa.from('studio_data').update({data:JSON.stringify(ud),updated_at:new Date().toISOString()}).eq('user_id',userId);
  }).then(function(){
    document.getElementById('_book-overlay')&&document.getElementById('_book-overlay').remove();
    alert('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم إرسال طلب الموعد! سنتواصل معك قريباً.');
  }).catch(function(){if(btn){btn.disabled=false;btn.innerHTML='إرسال طلب الموعد <i class="fa-solid fa-calendar-days"></i>';}});
};

// ── Public Contact Form ──
window._openPublicContactForm=function(){
  var accent=window._pubAccent||'#7c6ff7';
  var userId=window._pubUserId;
  var C=window._pubColors;
  var ex=document.getElementById('_contact-overlay'); if(ex) ex.remove();
  var ov=document.createElement('div');
  ov.id='_contact-overlay'; ov.className='_ord-overlay';
  ov.innerHTML='<div class="_ord-sheet">'+
    '<div class="_ord-handle"></div>'+
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">'+
      '<div style="font-size:18px;font-weight:900;color:'+C.textMain+'"><i class="fa-solid fa-envelope-open-text"></i> تواصل معنا</div>'+
      '<button onclick="document.getElementById(\'_contact-overlay\').remove()" style="background:'+C.cardBg+';border:1px solid '+C.borderC+';width:34px;height:34px;border-radius:50%;font-size:16px;cursor:pointer;color:'+C.textMain+'"><i class="fa-solid fa-xmark"></i></button>'+
    '</div>'+
    '<div style="font-size:12px;color:'+C.textSub+';margin-bottom:14px">أرسل لنا رسالتك وسنتواصل معك في أقرب وقت</div>'+
    '<input id="_cnt-name" class="_ord-input" placeholder="الاسم الكامل *">'+
    '<input id="_cnt-phone" class="_ord-input" placeholder="رقم الواتساب *" type="tel">'+
    '<input id="_cnt-email" class="_ord-input" placeholder="البريد الإلكتروني (اختياري)" type="email" dir="ltr">'+
    '<input id="_cnt-subject" class="_ord-input" placeholder="موضوع الرسالة *">'+
    '<textarea id="_cnt-msg" class="_ord-input" rows="3" placeholder="تفاصيل رسالتك..."></textarea>'+
    '<button class="_ord-submit" onclick="_submitPublicContact(\''+userId+'\')">إرسال الرسالة <i class="fa-solid fa-envelope-open-text"></i></button>'+
  '</div>';
  ov.onclick=function(e){if(e.target===ov)ov.remove();};
  document.body.appendChild(ov);
};

window._submitPublicContact=function(userId){
  var name=(document.getElementById('_cnt-name')||{}).value||'';
  var phone=(document.getElementById('_cnt-phone')||{}).value||'';
  var subject=(document.getElementById('_cnt-subject')||{}).value||'';
  var email=(document.getElementById('_cnt-email')||{}).value||'';
  var msg=(document.getElementById('_cnt-msg')||{}).value||'';
  if(!name||!phone||!subject){alert('الاسم والهاتف والموضوع مطلوبة');return;}
  var btn=document.querySelector('._ord-submit[onclick*="_submitPublicContact"]');
  if(btn){btn.disabled=true;btn.textContent='⏳ جاري الإرسال...';}
  var contact={id:Date.now()+'_c',type:'contact',client_name:name,client_phone:phone,client_email:email,subject:subject,message:msg,created_at:new Date().toISOString(),read:false};
  supa.from('studio_data').select('data').eq('user_id',userId).maybeSingle().then(function(res){
    if(!res||!res.data) return;
    var ud=null;try{ud=typeof res.data.data==='string'?JSON.parse(res.data.data):res.data.data;}catch(e){}
    if(!ud) return;
    ud.support_msgs=ud.support_msgs||[]; ud.support_msgs.push(contact);
    ud._pending_notifications=ud._pending_notifications||[];
    ud._pending_notifications.push({id:contact.id+'_n',title:'<i class="fa-solid fa-envelope-open-text"></i> رسالة جديدة!',body:'رسالة من '+name+' — '+subject,type:'contact',created_at:new Date().toISOString(),read:false});
    return supa.from('studio_data').update({data:JSON.stringify(ud),updated_at:new Date().toISOString()}).eq('user_id',userId);
  }).then(function(){
    document.getElementById('_contact-overlay')&&document.getElementById('_contact-overlay').remove();
    alert('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم إرسال رسالتك! سنتواصل معك قريباً.');
  }).catch(function(){if(btn){btn.disabled=false;btn.innerHTML='إرسال الرسالة <i class="fa-solid fa-envelope-open-text"></i>';}});
};

function _buildNewOrderPortalPage(userId, portalId){
  if(typeof supa==='undefined'){ return; }
  supa.from('studio_data').select('data').eq('user_id',userId).maybeSingle().then(function(res){
    if(!res||!res.data) return;
    var ud=null; try{ ud=typeof res.data.data==='string'?JSON.parse(res.data.data):res.data.data; }catch(e){}
    if(!ud) return;
    var portal=(ud.client_portals||[]).find(function(p){return p.id===portalId;}); if(!portal) return;
    var tasks=ud.tasks||[];
    var task=(portal.task_id?tasks.find(function(t){return String(t.id)===String(portal.task_id);}):null)||
             tasks.find(function(t){return t.client&&t.client.trim().toLowerCase()===portal.client_name.trim().toLowerCase()&&t.status!=='\u0645\u0643\u062a\u0645\u0644\u0629';});
    var settings=ud.settings||{};
    var accent=(settings.accentColor)||'#7c6ff7';
    var isLight=settings.displayMode==='light';
    var bg=isLight?'#f0f2f8':'#0a0a0f';
    var surface=isLight?'#ffffff':'#111118';
    var textMain=isLight?'#1a1a2e':'#f0f0f5';
    var textSub=isLight?'#555577':'#aaaacc';
    var textMuted=isLight?'#888899':'#888888';
    var borderC=isLight?'rgba(0,0,0,.1)':'rgba(255,255,255,.08)';
    var cardBg=isLight?'rgba(0,0,0,.04)':'rgba(255,255,255,.06)';
    var cardBorder=isLight?'rgba(0,0,0,.08)':'rgba(255,255,255,.09)';
    var logo=settings.logo||'';
    var studioName=settings.name||'Ordo';
    document.body.innerHTML='';
    document.body.style.cssText='margin:0;padding:0;background:'+bg+';font-family:Cairo,Tajawal,system-ui,sans-serif;direction:rtl;color:'+textMain;
    var st=document.createElement('style');
    st.textContent='@import url(\'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap\');'+
      '*{box-sizing:border-box;margin:0;padding:0}'+
      'body::before{content:\'\';position:fixed;inset:0;z-index:0;pointer-events:none;background:radial-gradient(ellipse 70% 50% at 20% 10%,'+accent+'28 0%,transparent 65%)}'+
      '._cp-wrap{position:relative;z-index:1;max-width:640px;margin:0 auto;padding:16px 16px 80px}'+
      '._cp-card{background:'+surface+';border:1px solid '+cardBorder+';border-radius:20px;padding:20px;margin-bottom:14px;box-shadow:0 2px 16px rgba(0,0,0,.08)}'+
      '._cp-section-title{font-size:12px;font-weight:800;color:'+textMuted+';text-transform:uppercase;letter-spacing:.5px;margin-bottom:12px}'+
      '._cp-step{display:flex;align-items:flex-start;gap:10px;padding:10px 0;border-bottom:1px solid '+borderC+';font-size:13px}'+
      '._cp-step:last-child{border-bottom:none}'+
      '._cp-badge{display:inline-flex;align-items:center;padding:3px 10px;border-radius:20px;font-size:10px;font-weight:700}';
    document.head.appendChild(st);

    var pg=document.createElement('div'); pg.className='_cp-wrap';

    // Collect related data
    var relatedTasks=portal.task_id
      ? tasks.filter(function(t){return String(t.id)===String(portal.task_id);})
      : tasks.filter(function(t){return t.client&&(t.client.trim().toLowerCase()===portal.client_name.trim().toLowerCase()||t.client_phone===portal.client_phone);});
    var relatedInvoices=(ud.invoices||[]).filter(function(inv){
      return inv.client&&(inv.client===portal.client_name||(portal.client_phone&&inv.client_phone===portal.client_phone));
    });
    var progress=task&&task.steps&&task.steps.length
      ? Math.round(task.steps.filter(function(s){return s.done;}).length/task.steps.length*100)
      : (task&&task.done?100:0);

    var statusColor={'جاري':accent,'مكتملة':'#4fd1a5','معلقة':'#f7c948','ملغي':'#f76f7c'};

    pg.innerHTML=
      // ── Top header ──
      '<div style="display:flex;align-items:center;gap:12px;padding:14px 0 20px">'+
        (logo?'<img src="'+escapeHtml(logo)+'" style="width:42px;height:42px;border-radius:12px;object-fit:cover;border:2px solid '+accent+'55">':
          '<div style="width:42px;height:42px;border-radius:12px;background:linear-gradient(135deg,'+accent+','+accent+'99);display:flex;align-items:center;justify-content:center;font-size:18px;color:#fff;font-weight:900">'+
            (studioName||'S').charAt(0)+
          '</div>')+
        '<div>'+
          '<div style="font-size:16px;font-weight:900;color:'+textMain+'">'+escapeHtml(studioName)+'</div>'+
          '<div style="font-size:11px;color:'+textMuted+'">بوابة العميل</div>'+
        '</div>'+
      '</div>'+

      // ── Welcome card ──
      '<div class="_cp-card" style="border-right:4px solid '+accent+'">'+
        '<div style="font-size:20px;font-weight:900;color:'+textMain+';margin-bottom:4px">مرحباً، '+escapeHtml(portal.client_name)+' <i class="fa-solid fa-hand-wave"></i></div>'+
        '<div style="font-size:13px;color:'+textSub+'">'+escapeHtml(portal.service_name)+(portal.pkg_name?' — '+escapeHtml(portal.pkg_name):'')+'</div>'+
        '<div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">'+
          '<div style="display:flex;align-items:center;gap:5px;font-size:11px;color:'+textMuted+'"><i class="fa-solid fa-calendar-days"></i> '+new Date(portal.created_at).toLocaleDateString('ar-EG')+'</div>'+
          '<div class="_cp-badge" style="background:'+accent+'22;color:'+accent+'">● '+escapeHtml(portal.status||'نشط')+'</div>'+
        '</div>'+
      '</div>'+

      // ── Progress card ──
      (task?
        '<div class="_cp-card">'+
          '<div class="_cp-section-title"><i class="fa-solid fa-chart-bar"></i> تقدم مشروعك</div>'+
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">'+
            '<span style="font-size:13px;color:'+textSub+'">الحالة: <strong style="color:'+(statusColor[task.status]||accent)+'">'+escapeHtml(task.status||'—')+'</strong></span>'+
            '<span style="font-size:22px;font-weight:900;color:'+accent+'">'+progress+'%</span>'+
          '</div>'+
          '<div style="height:12px;background:'+cardBg+';border-radius:8px;overflow:hidden;border:1px solid '+cardBorder+'">'+
            '<div style="height:100%;background:linear-gradient(90deg,'+accent+','+accent+'cc);border-radius:8px;width:'+progress+'%;transition:width .7s;box-shadow:0 0 10px '+accent+'55"></div>'+
          '</div>'+
          (task.steps&&task.steps.length?
            '<div style="margin-top:16px">'+
              '<div class="_cp-section-title" style="margin-bottom:8px">خطوات التنفيذ</div>'+
              task.steps.map(function(s){
                return '<div class="_cp-step">'+
                  '<span style="font-size:18px;flex-shrink:0">'+(s.done?'<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i>':'⏳')+'</span>'+
                  '<span style="color:'+(s.done?accent:textSub)+';font-weight:'+(s.done?'700':'400')+';text-decoration:'+(s.done?'none':'none')+'">'+escapeHtml(s.text)+'</span>'+
                '</div>';
              }).join('')+
            '</div>':'') +
        '</div>':'') +

      // ── Active tasks ──
      (relatedTasks.length?
        '<div class="_cp-card">'+
          '<div class="_cp-section-title"><i class="fa-solid fa-clipboard-list"></i> المهام والمشاريع ('+relatedTasks.length+')</div>'+
          relatedTasks.map(function(t){
            var sc=statusColor[t.status]||accent;
            return '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid '+borderC+'">'+
              '<div>'+
                '<div style="font-size:13px;font-weight:700;color:'+textMain+'">'+escapeHtml(t.title||t.name||'مهمة')+'</div>'+
                (t.dueDate?'<div style="font-size:11px;color:'+textMuted+'"><i class="fa-solid fa-calendar-days"></i> '+escapeHtml(t.dueDate)+'</div>':'')+
              '</div>'+
              '<div class="_cp-badge" style="background:'+sc+'22;color:'+sc+'">'+escapeHtml(t.status||'—')+'</div>'+
            '</div>';
          }).join('')+
        '</div>':'') +

      // ── Invoices ──
      (relatedInvoices.length?
        '<div class="_cp-card">'+
          '<div class="_cp-section-title"><i class="fa-solid fa-receipt"></i> الفواتير ('+relatedInvoices.length+')</div>'+
          relatedInvoices.map(function(inv){
            var paid=inv.paid||inv.status==='مدفوعة'||inv.status==='paid';
            var partial=inv.status==='مدفوعة جزئياً';
            var badgeBg=paid?'#4fd1a522':partial?'#f7c94822':'#f76f7c22';
            var badgeC=paid?'#4fd1a5':partial?'#f7c948':'#f76f7c';
            var label=paid?'مدفوعة':partial?'جزئي':'غير مدفوعة';
            return '<div class="_cp-inv-row">'+
              '<div>'+
                '<div style="font-size:13px;font-weight:700;color:'+textMain+'">'+(inv.num||inv.id||'فاتورة')+'</div>'+
                (inv.date?'<div style="font-size:11px;color:'+textMuted+'">'+escapeHtml(inv.date)+'</div>':'')+
              '</div>'+
              '<div style="display:flex;align-items:center;gap:10px">'+
                '<span style="font-size:14px;font-weight:900;color:'+accent+'">'+(inv.total?Number(inv.total).toLocaleString()+' ج':'—')+'</span>'+
                '<div class="_cp-badge" style="background:'+badgeBg+';color:'+badgeC+'">'+label+'</div>'+
              '</div>'+
            '</div>';
          }).join('')+
        '</div>':'') +

      // ── Footer ──
      '<div style="text-align:center;padding:20px 0;font-size:12px;color:'+textMuted+'">'+
        escapeHtml(studioName)+' — '+new Date().getFullYear()+
      '</div>';

    document.body.appendChild(pg);
  });
}


function _svcOrderFallback(){
  document.body.innerHTML='<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:Cairo,sans-serif;direction:rtl;color:#666;font-size:14px">تعذّر تحميل الصفحة. حاول مرة أخرى.</div>';
}

function _buildClientPortalPage(userId, portalId){
  if(typeof supa==='undefined'){ return; }
  supa.from('studio_data').select('data').eq('user_id',userId).maybeSingle().then(function(res){
    if(!res||!res.data) return;
    var ud=null; try{ ud=typeof res.data.data==='string'?JSON.parse(res.data.data):res.data.data; }catch(e){}
    if(!ud) return;
    var portal=(ud.client_portals||[]).find(function(p){return p.id===portalId;});
    if(!portal){ document.body.innerHTML='<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:Cairo,sans-serif;direction:rtl;font-size:16px"><i class="fa-solid fa-triangle-exclamation"></i> رابط غير صالح</div>'; return; }
    var settings=ud.settings||{};
    var accent=settings.accent||settings.accentColor||'#7c6ff7';
    var isLight=settings.displayMode==='light';
    var bg     =isLight?'#f4f5fb':'#0a0a0f';
    var surface=isLight?'#ffffff':'#111118';
    var surface2=isLight?'#f0f1f8':'#16161f';
    var surface3=isLight?'#e8e9f4':'#1c1c28';
    var textMain=isLight?'#1a1a2e':'#f0f0f5';
    var textSub=isLight?'#555577':'#aaaacc';
    var textMuted=isLight?'#888899':'#777799';
    var borderC=isLight?'rgba(0,0,0,.1)':'rgba(255,255,255,.08)';
    var cardBg=isLight?'rgba(0,0,0,.03)':'rgba(255,255,255,.05)';
    var cardBorder=isLight?'rgba(0,0,0,.07)':'rgba(255,255,255,.09)';
    var navBg=isLight?'rgba(255,255,255,.92)':'rgba(10,10,15,.92)';
    var logo=settings.logo||''; var studioName=settings.name||'Ordo';
    var phone=settings.phone||''; var socials=settings.socials||[];
    var tasks=ud.tasks||[];
    var invoices=ud.invoices||[];

    // All tasks belonging to this client
    var clientTasks=portal.task_id
      ? tasks.filter(function(t){return String(t.id)===String(portal.task_id);})
      : tasks.filter(function(t){
          return t.source_order_id===portal.order_id||
                 (t.client&&(t.client.trim().toLowerCase()===(portal.client_name||'').trim().toLowerCase()||(portal.client_phone&&(t.clientPhone===portal.client_phone||t.client_phone===portal.client_phone))));
        });

    var clientInvoices=invoices.filter(function(inv){
      return inv.client&&(inv.client===portal.client_name||(portal.client_phone&&inv.clientPhone===portal.client_phone));
    });

    var SICONS={instagram:'<i class="fa-brands fa-instagram" style="color:#E1306C"></i>',facebook:'<i class="fa-brands fa-facebook" style="color:#1877F2"></i>',tiktok:'<i class="fa-brands fa-tiktok"></i>',youtube:'<i class="fa-brands fa-youtube" style="color:#FF0000"></i>',twitter:'<i class="fa-brands fa-x-twitter"></i>',whatsapp:'<i class="fa-brands fa-whatsapp" style="color:#25D366"></i>',website:'<i class="fa-solid fa-globe" style="color:#7c6ff7"></i>',behance:'<i class="fa-brands fa-behance" style="color:#1769FF"></i>',snapchat:'<i class="fa-brands fa-snapchat" style="color:#FFFC00"></i>',linkedin:'<i class="fa-brands fa-linkedin" style="color:#0077B5"></i>'};

    var footerSocialsHtml='';
    if(phone) footerSocialsHtml+='<a href="https://wa.me/'+phone.replace(/\D/g,'')+'" target="_blank" style="width:38px;height:38px;border-radius:10px;background:'+cardBg+';border:1px solid '+cardBorder+';display:flex;align-items:center;justify-content:center;font-size:16px;text-decoration:none"><i class="fa-solid fa-comments"></i></a>';
    socials.forEach(function(sc){ footerSocialsHtml+='<a href="'+(sc.url||'#')+'" target="_blank" style="width:38px;height:38px;border-radius:10px;background:'+cardBg+';border:1px solid '+cardBorder+';display:flex;align-items:center;justify-content:center;font-size:16px;text-decoration:none">'+(SICONS[sc.platform]||'<i class="fa-solid fa-link"></i>')+'</a>'; });

    // ── CSS ──
    document.body.innerHTML='';
    document.body.style.cssText='margin:0;padding:0;background:'+bg+';font-family:Cairo,Tajawal,sans-serif;direction:rtl;color:'+textMain;
    var st=document.createElement('style');
    st.textContent=
      '@import url(\'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap\');'+
      '*{box-sizing:border-box;margin:0;padding:0}html{scroll-behavior:smooth}'+
      'body::before{content:\'\';position:fixed;inset:0;z-index:0;pointer-events:none;background:radial-gradient(ellipse 70% 50% at 15% 5%,'+accent+'1e 0%,transparent 60%)}'+
      '._cp-nav{position:sticky;top:0;z-index:100;background:'+navBg+';backdrop-filter:blur(18px);border-bottom:1px solid '+borderC+';padding:0 20px}'+
      '._cp-nav-inner{max-width:760px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;height:56px}'+
      '._cp-wrap{position:relative;z-index:1;max-width:760px;margin:0 auto;padding:20px 20px 80px}'+
      '@media(max-width:600px){._cp-wrap{padding:16px 12px 60px}}'+
      '._cp-card{background:'+surface+';border:1px solid '+cardBorder+';border-radius:18px;padding:20px;margin-bottom:14px;box-shadow:0 2px 16px rgba(0,0,0,.06)}'+
      '._cp-sec-title{font-size:11px;font-weight:800;color:'+textMuted+';text-transform:uppercase;letter-spacing:.6px;margin-bottom:12px}'+
      '._filter-bar{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px}'+
      '._filter-chip{padding:6px 14px;border-radius:20px;font-size:12px;font-weight:700;background:'+cardBg+';border:1px solid '+cardBorder+';color:'+textSub+';cursor:pointer;font-family:\'Cairo\',sans-serif;transition:.15s}'+
      '._filter-chip.on{background:'+accent+';color:#fff;border-color:'+accent+'}'+
      '._proj-card{background:'+surface2+';border:1px solid '+cardBorder+';border-radius:14px;padding:16px;margin-bottom:10px;cursor:pointer;transition:.15s;position:relative}'+
      '._proj-card:hover{border-color:'+accent+'55;transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.1)}'+
      '._proj-overlay{position:fixed;inset:0;z-index:500;background:rgba(0,0,0,.75);display:flex;align-items:flex-end;justify-content:center;padding:0}'+
      '._proj-sheet{background:'+surface+';border-radius:20px 20px 0 0;max-width:760px;width:100%;max-height:90vh;overflow-y:auto;padding:24px 22px 40px;animation:_pSlideUp .3s cubic-bezier(.25,1.2,.5,1)}'+
      '@keyframes _pSlideUp{from{transform:translateY(60px);opacity:0}to{transform:translateY(0);opacity:1}}'+
      '._step-row{display:flex;align-items:flex-start;gap:10px;padding:10px 0;border-bottom:1px solid '+borderC+';font-size:13px}'+
      '._step-row:last-child{border-bottom:none}'+
      '._badge{display:inline-flex;align-items:center;padding:4px 10px;border-radius:20px;font-size:10px;font-weight:700}'+
      '._cp-footer{background:'+surface2+';border-top:1px solid '+borderC+';padding:28px 20px 20px;margin-top:40px}'+
      '._cp-footer-inner{max-width:760px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px}';
    document.head.appendChild(st);

    // ── NAV ──
    var navEl=document.createElement('nav');
    navEl.className='_cp-nav';
    navEl.innerHTML='<div class="_cp-nav-inner">'+
      '<div style="display:flex;align-items:center;gap:10px">'+
        (logo?'<img src="'+escapeHtml(logo)+'" style="width:34px;height:34px;border-radius:9px;object-fit:cover;border:2px solid '+accent+'44">':'<div style="width:34px;height:34px;border-radius:9px;background:'+accent+';display:flex;align-items:center;justify-content:center;font-size:14px;color:#fff;font-weight:900">'+(studioName||'S').charAt(0)+'</div>')+
        '<div><div style="font-size:14px;font-weight:900;color:'+textMain+'">'+escapeHtml(studioName)+'</div>'+
        '<div style="font-size:10px;color:'+textMuted+'">بوابة العميل</div></div>'+
      '</div>'+
      '<div style="display:flex;align-items:center;gap:8px">'+
        (phone?'<a href="https://wa.me/'+phone.replace(/\D/g,'')+'" target="_blank" style="background:#25D366;color:#fff;text-decoration:none;padding:7px 14px;border-radius:8px;font-size:12px;font-weight:700"><i class="fa-solid fa-mobile"></i> تواصل</a>':'')+
      '</div>'+
    '</div>';
    document.body.appendChild(navEl);

    // ── MAIN WRAP ──
    var wrap=document.createElement('div'); wrap.className='_cp-wrap';

    // Welcome card
    var statusColors={'جديد':accent,'قيد التنفيذ':'#f7c948','مراجعة':'#a78bfa','موقوفة':'#888','مكتملة':'#4fd1a5'};
    var welcomeHtml='<div class="_cp-card" style="border-right:4px solid '+accent+';margin-bottom:20px">'+
      '<div style="font-size:22px;font-weight:900;color:'+textMain+';margin-bottom:6px">مرحباً، '+escapeHtml(portal.client_name)+' <i class="fa-solid fa-hand-wave"></i></div>'+
      '<div style="font-size:13px;color:'+textSub+'">'+escapeHtml(portal.service_name)+(portal.pkg_name?' — <span style="color:'+accent+'">'+escapeHtml(portal.pkg_name)+'</span>':'')+'</div>'+
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">'+
        '<div style="font-size:11px;color:'+textMuted+'"><i class="fa-solid fa-calendar-days"></i> '+new Date(portal.created_at||Date.now()).toLocaleDateString('ar-EG')+'</div>'+
        '<div class="_badge" style="background:'+accent+'22;color:'+accent+'">● '+escapeHtml(portal.status||'نشط')+'</div>'+
      '</div>'+
    '</div>';

    // Stats row
    var activeProjects=clientTasks.filter(function(t){return t.status!=='مكتملة';}).length;
    var doneProjects=clientTasks.filter(function(t){return t.status==='مكتملة';}).length;
    var totalInvoiced=clientInvoices.reduce(function(s,inv){return s+(+inv.total||0);},0);
    var totalPaid=clientInvoices.filter(function(inv){return inv.paid||inv.status==='مدفوعة';}).reduce(function(s,inv){return s+(+inv.total||0);},0);
    var statsHtml='<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:20px">'+
      [
        {l:'مشاريع نشطة',v:activeProjects,c:accent},
        {l:'مكتملة',v:doneProjects,c:'#4fd1a5'},
        {l:'إجمالي الفواتير',v:(totalInvoiced?totalInvoiced.toLocaleString()+' '+_getCurrency():'—'),c:'#f7c948'},
        {l:'المدفوع',v:(totalPaid?totalPaid.toLocaleString()+' '+_getCurrency():'—'),c:'#4fd1a5'}
      ].map(function(s){
        return '<div style="background:'+surface2+';border:1px solid '+cardBorder+';border-radius:14px;padding:14px;text-align:center">'+
          '<div style="font-size:20px;font-weight:900;color:'+s.c+'">'+s.v+'</div>'+
          '<div style="font-size:10px;color:'+textMuted+';margin-top:3px">'+s.l+'</div>'+
        '</div>';
      }).join('')+
    '</div>';

    // Projects section
    var _currentFilter='all';
    function renderProjects(filter){
      _currentFilter=filter;
      var filtered=filter==='all'?clientTasks:clientTasks.filter(function(t){
        if(filter==='active') return t.status!=='مكتملة'&&t.status!=='موقوفة';
        if(filter==='done') return t.status==='مكتملة';
        if(filter==='paused') return t.status==='موقوفة';
        return true;
      });
      var chips=document.getElementById('_proj-filters');
      if(chips) chips.querySelectorAll('._filter-chip').forEach(function(c){c.classList.toggle('on',c.dataset.f===filter);});
      var grid=document.getElementById('_proj-grid');
      if(!grid) return;
      if(!filtered.length){grid.innerHTML='<div style="text-align:center;padding:40px;color:'+textMuted+'">لا توجد مشاريع في هذا الفلتر</div>';return;}
      grid.innerHTML=filtered.map(function(t){
        var prog=t.steps&&t.steps.length?Math.round(t.steps.filter(function(s){return s.done;}).length/t.steps.length*100):(t.done?100:0);
        var sc=statusColors[t.status]||textMuted;
        return '<div class="_proj-card" onclick="_openProjDetail(\''+t.id+'\')">'+
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">'+
            '<div style="font-size:14px;font-weight:800;color:'+textMain+'">'+escapeHtml(t.title||t.name||'مشروع')+'</div>'+
            '<div class="_badge" style="background:'+sc+'22;color:'+sc+'">'+escapeHtml(t.status||'—')+'</div>'+
          '</div>'+
          (t.desc?'<div style="font-size:12px;color:'+textSub+';margin-bottom:10px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">'+escapeHtml(t.desc)+'</div>':'')+
          '<div style="height:6px;background:'+cardBg+';border-radius:3px;margin-bottom:6px"><div style="height:100%;background:'+accent+';border-radius:3px;width:'+prog+'%;transition:.5s"></div></div>'+
          '<div style="display:flex;justify-content:space-between;align-items:center;font-size:11px;color:'+textMuted+'">'+
            '<span>'+prog+'% مكتمل</span>'+
            (t.deadline?'<span><i class="fa-solid fa-calendar-days"></i> '+escapeHtml(t.deadline)+'</span>':'')+
            '<span style="color:'+accent+';font-weight:700">عرض التفاصيل ↗</span>'+
          '</div>'+
        '</div>';
      }).join('');
    }

    window._openProjDetail=function(taskId){
      var t=(ud.tasks||[]).find(function(x){return String(x.id)===String(taskId);}); if(!t) return;
      var prog=t.steps&&t.steps.length?Math.round(t.steps.filter(function(s){return s.done;}).length/t.steps.length*100):(t.done?100:0);
      var sc=statusColors[t.status]||textMuted;
      var ex=document.getElementById('_proj-detail-overlay'); if(ex) ex.remove();
      var ov=document.createElement('div'); ov.id='_proj-detail-overlay'; ov.className='_proj-overlay';
      ov.innerHTML='<div class="_proj-sheet">'+
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">'+
          '<div>'+
            '<div style="font-size:18px;font-weight:900;color:'+textMain+'">'+escapeHtml(t.title||'مشروع')+'</div>'+
            '<div class="_badge" style="background:'+sc+'22;color:'+sc+';margin-top:5px">'+escapeHtml(t.status||'—')+'</div>'+
          '</div>'+
          '<button onclick="document.getElementById(\'_proj-detail-overlay\').remove()" style="background:'+cardBg+';border:1px solid '+borderC+';width:36px;height:36px;border-radius:50%;cursor:pointer;font-size:16px;color:'+textMain+'"><i class="fa-solid fa-xmark"></i></button>'+
        '</div>'+
        (t.desc?'<div style="font-size:13px;color:'+textSub+';line-height:1.8;padding:14px;background:'+surface2+';border-radius:12px;margin-bottom:18px">'+escapeHtml(t.desc)+'</div>':'')+
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">'+
          '<div style="font-size:13px;font-weight:700;color:'+textSub+'">التقدم العام</div>'+
          '<div style="font-size:22px;font-weight:900;color:'+accent+'">'+prog+'%</div>'+
        '</div>'+
        '<div style="height:12px;background:'+cardBg+';border-radius:8px;overflow:hidden;border:1px solid '+cardBorder+';margin-bottom:20px">'+
          '<div style="height:100%;background:linear-gradient(90deg,'+accent+','+accent+'cc);border-radius:8px;width:'+prog+'%;transition:.7s;box-shadow:0 0 10px '+accent+'55"></div>'+
        '</div>'+
        (t.steps&&t.steps.length?
          '<div style="font-size:12px;font-weight:800;color:'+textMuted+';margin-bottom:12px"><i class="fa-solid fa-clipboard-list"></i> خطوات التنفيذ</div>'+
          '<div>'+t.steps.map(function(s,i){
            return '<div class="_step-row">'+
              '<span style="font-size:20px;flex-shrink:0">'+(s.done?'<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i>':'⏳')+'</span>'+
              '<div style="flex:1">'+
                '<div style="font-size:13px;color:'+(s.done?accent:textSub)+';font-weight:'+(s.done?'700':'400')+(s.done?';text-decoration:line-through':'')+'">'+escapeHtml(s.text)+'</div>'+
              '</div>'+
            '</div>';
          }).join('')+'</div>':'')+
        (t.deadline?'<div style="margin-top:16px;display:flex;align-items:center;gap:8px;font-size:13px;color:'+textSub+'"><i class="fa-solid fa-calendar-days"></i> موعد التسليم: <strong>'+escapeHtml(t.deadline)+'</strong></div>':'')+
        (phone?'<a href="https://wa.me/'+phone.replace(/\D/g,'')+'" target="_blank" style="display:flex;align-items:center;justify-content:center;gap:8px;margin-top:20px;background:#25D366;color:#fff;text-decoration:none;padding:13px;border-radius:12px;font-size:14px;font-weight:800"><i class="fa-solid fa-mobile"></i> تواصل معنا</a>':'')+
      '</div>';
      ov.onclick=function(e){if(e.target===ov)ov.remove();};
      document.body.appendChild(ov);
    };

    // Invoices section
    var invoicesHtml='';
    if(clientInvoices.length){
      invoicesHtml='<div class="_cp-card">'+
        '<div class="_cp-sec-title"><i class="fa-solid fa-receipt"></i> الفواتير وكشف الحساب ('+clientInvoices.length+')</div>'+
        clientInvoices.map(function(inv){
          var paid=inv.paid||inv.status==='مدفوعة'||inv.status==='paid';
          var partial=inv.status==='مدفوعة جزئياً';
          var badgeBg=paid?'#4fd1a522':partial?'#f7c94822':'#f76f7c22';
          var badgeC=paid?'#4fd1a5':partial?'#f7c948':'#f76f7c';
          return '<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid '+borderC+'">'+
            '<div>'+
              '<div style="font-size:13px;font-weight:700;color:'+textMain+'">'+(inv.num||inv.id||'فاتورة')+'</div>'+
              (inv.date?'<div style="font-size:11px;color:'+textMuted+'">'+escapeHtml(inv.date)+'</div>':'')+
              (inv.desc?'<div style="font-size:11px;color:'+textSub+'">'+escapeHtml(inv.desc)+'</div>':'')+
            '</div>'+
            '<div style="display:flex;align-items:center;gap:8px">'+
              '<span style="font-size:15px;font-weight:900;color:'+accent+'">'+  (inv.total?Number(inv.total).toLocaleString()+' ج':'—')+'</span>'+
              '<div class="_badge" style="background:'+badgeBg+';color:'+badgeC+'">'+(paid?'<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> مدفوعة':partial?'<i class="fa-solid fa-bolt"></i> جزئي':'⏳ غير مدفوعة')+'</div>'+
            '</div>'+
          '</div>';
        }).join('')+
      '</div>';
    }

    var projSectionHtml='<div class="_cp-card">'+
      '<div class="_cp-sec-title"><i class="fa-solid fa-clipboard-list"></i> مشاريعي</div>'+
      '<div id="_proj-filters" class="_filter-bar">'+
        ['all','active','done','paused'].map(function(f,i){
          var labels={all:'الكل',active:'جارية',done:'مكتملة',paused:'موقوفة'};
          return '<button class="_filter-chip'+(i===0?' on':'')+'" data-f="'+f+'" onclick="_cpFilter(\''+f+'\')">'+labels[f]+'</button>';
        }).join('')+
      '</div>'+
      '<div id="_proj-grid"></div>'+
    '</div>';

    window._cpFilter=function(f){ renderProjects(f); };

    wrap.innerHTML=welcomeHtml+statsHtml+projSectionHtml+invoicesHtml;
    document.body.appendChild(wrap);

    // Footer
    var footerEl=document.createElement('footer');
    footerEl.className='_cp-footer';
    footerEl.innerHTML='<div class="_cp-footer-inner">'+
      '<div style="display:flex;align-items:center;gap:10px">'+
        (logo?'<img src="'+escapeHtml(logo)+'" style="width:32px;height:32px;border-radius:8px;object-fit:cover" onerror=\'this.style.display=\"none\"\'">':'<div style="width:32px;height:32px;border-radius:8px;background:'+accent+';display:flex;align-items:center;justify-content:center;font-size:12px;color:#fff;font-weight:900">'+(studioName||'S').charAt(0)+'</div>')+
        '<span style="font-size:13px;font-weight:700;color:'+textMain+'">'+escapeHtml(studioName)+'</span>'+
      '</div>'+
      '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">'+
        footerSocialsHtml+
        (phone?'<a href="https://wa.me/'+phone.replace(/\D/g,'')+'" target="_blank" style="background:'+accent+';color:#fff;text-decoration:none;padding:8px 16px;border-radius:8px;font-size:12px;font-weight:800"><i class="fa-solid fa-calendar-days"></i> حجز موعد</a>':'')+
      '</div>'+
    '</div>';
    document.body.appendChild(footerEl);

    // Render projects
    renderProjects('all');
  });
}

