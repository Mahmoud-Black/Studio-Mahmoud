// ════════════════════════════════════════════════════════════════
// PROJECT CLIENT PORTAL (Read-only public view)
// ════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════
// FULL CLIENT PORTAL — لوحة العميل الكاملة
// ════════════════════════════════════════════════════════════════
function _buildFullClientPortal(userId, clientId){
  if(typeof supa==='undefined'){
    document.body.innerHTML='<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:Cairo,Tajawal,sans-serif;direction:rtl;color:#666"><div style="text-align:center"><div style="font-size:48px;margin-bottom:12px">⚠️</div><div style="font-size:16px">لا يمكن تحميل لوحة التحكم</div><div style="font-size:13px;margin-top:6px;color:#999">يرجى المحاولة لاحقاً</div></div></div>';
    return;
  }
  // Loading
  document.body.style.cssText='margin:0;padding:0;background:#f4f5fb;font-family:Cairo,Tajawal,sans-serif;direction:rtl';
  document.body.innerHTML='<div style="display:flex;align-items:center;justify-content:center;height:100vh"><div style="text-align:center"><div style="font-size:40px;margin-bottom:12px;animation:spin 1s linear infinite">⏳</div><div style="font-size:14px;color:#666">جاري تحميل بيانات العميل...</div></div></div>';

  supa.from('studio_data').select('data').eq('user_id',userId).maybeSingle().then(function(res){
    if(!res||!res.data){ _showCPError('لا يمكن تحميل البيانات. تأكد من الرابط.'); return; }
    var ud; try{ ud=typeof res.data.data==='string'?JSON.parse(res.data.data):res.data.data; }catch(e){}
    if(!ud){ _showCPError('خطأ في قراءة البيانات'); return; }

    var client=(ud.clients||[]).find(function(c){ return String(c.id)===String(clientId); });

    // Fallback: لو مش لاقيه بالـ ID، ممكن يكون clientId هو phone number أو email
    if(!client){
      client=(ud.clients||[]).find(function(c){
        return c.phone===clientId||c.email===clientId;
      });
    }

    // Fallback 2: ابحث في الطلبات عن نفس الـ ID وجيب بيانات العميل منها
    if(!client){
      var matchOrder=(ud.svc_orders||[]).find(function(o){
        return String(o.id)===String(clientId)||String(o.client_id)===String(clientId);
      });
      if(matchOrder){
        // أنشئ عميل مؤقت من بيانات الطلب
        client={
          id:clientId,
          name:matchOrder.client_name||matchOrder.name||'العميل',
          phone:matchOrder.client_phone||matchOrder.phone||'',
          email:matchOrder.client_email||matchOrder.email||''
        };
        // احفظه في قاعدة البيانات للمرات القادمة
        ud.clients=ud.clients||[];
        ud.clients.push(client);
        supa.from('studio_data').update({data:JSON.stringify(ud),updated_at:new Date().toISOString()}).eq('user_id',userId).then(function(){});
      }
    }

    if(!client){ _showCPError('لم يتم التعرف على العميل. تأكد من الرابط.'); return; }

    var settings=ud.settings||{};
    var accent=settings.accentColor||settings.accent||'#7c6ff7';
    var isLight=settings.displayMode!=='dark';
    var bg=isLight?'#f4f5fb':'#0a0a0f';
    var surface=isLight?'#ffffff':'#111118';
    var surface2=isLight?'#f0f1f8':'#16161f';
    var textMain=isLight?'#1a1a2e':'#f0f0f5';
    var textSub=isLight?'#555577':'#aaaacc';
    var textMuted=isLight?'#888899':'#777799';
    var borderC=isLight?'rgba(0,0,0,.1)':'rgba(255,255,255,.08)';
    var navBg=isLight?'rgba(255,255,255,.95)':'rgba(10,10,15,.95)';
    var logo=settings.store_logo||settings.logo||'';
    var studioName=settings.name||'Ordo';

    // Client's data
    var cName=client.name||'العميل';
    var cPhone=client.phone||'';
    var cEmail=client.email||'';

    // Projects
    var projects=(ud.projects||[]).filter(function(p){
      return String(p.client_id)===String(clientId)||p.client===cName;
    });
    // Project tasks
    var allProjTasks=ud.project_tasks||[];
    // Tasks (regular) — FIX: trim + case-insensitive match to handle slight name differences
    var cNameNorm = (cName||'').trim().toLowerCase();
    var tasks=(ud.tasks||[]).filter(function(t){
      var tClientNorm = (t.client||'').trim().toLowerCase();
      return tClientNorm === cNameNorm ||
             (cPhone && (t.client_phone===cPhone||t.clientPhone===cPhone||t.phone===cPhone));
    });
    // Invoices
    var invoices=(ud.invoices||[]).filter(function(inv){
      return inv.client===cName||(cPhone&&(inv.client_phone===cPhone||inv.clientPhone===cPhone));
    });
    // Orders — بحث شامل بكل الحقول الممكنة
    var orders=(ud.svc_orders||[]).filter(function(o){
      return String(o.client_id)===String(clientId)||
             o.client_name===cName||o.name===cName||
             (cPhone&&(o.client_phone===cPhone||o.phone===cPhone))||
             (cEmail&&(o.client_email===cEmail||o.email===cEmail));
    });
    // Contracts
    var contracts=(ud.contracts||[]).filter(function(c){
      return c.client===cName||(cPhone&&c.client_phone===cPhone);
    });
    // Statements
    var statements=(ud.statements||[]).filter(function(s){
      return s.client===cName||(cPhone&&s.client_phone===cPhone);
    });

    var stProjMap={active:'🟢 نشط',hold:'🟡 معلق',review:'🔵 مراجعة',done:'✅ مكتمل'};
    var taskStMap={todo:'🆕 جديد',progress:'⚡ قيد التنفيذ',review:'🔍 مراجعة',revision:'✏️ تعديلات',done:'✅ مكتمل',hold:'⏸ موقوف'};

    // Build HTML
    document.body.innerHTML='';
    document.body.style.cssText='margin:0;padding:0;background:'+bg+';font-family:Cairo,Tajawal,sans-serif;direction:rtl;color:'+textMain;

    var st=document.createElement('style');
    st.textContent=
      '@import url(\'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap\');'+
      '*{box-sizing:border-box;margin:0;padding:0}html{scroll-behavior:smooth}'+
      'body::before{content:\'\';position:fixed;inset:0;z-index:0;pointer-events:none;background:radial-gradient(ellipse 70% 50% at 85% 5%,'+accent+'1e 0%,transparent 60%)}'+
      '._fcp-nav{position:sticky;top:0;z-index:100;background:'+navBg+';backdrop-filter:blur(18px);border-bottom:1px solid '+borderC+';padding:0 20px}'+
      '._fcp-nav-inner{max-width:800px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;height:60px}'+
      '._fcp-wrap{position:relative;z-index:1;max-width:800px;margin:0 auto;padding:24px 20px 80px}'+
      '._fcp-card{background:'+surface+';border:1px solid '+borderC+';border-radius:18px;padding:20px;margin-bottom:16px;box-shadow:0 2px 20px rgba(0,0,0,.06)}'+
      '._fcp-sec{font-size:11px;font-weight:800;color:'+textMuted+';text-transform:uppercase;letter-spacing:.6px;margin-bottom:14px;display:flex;align-items:center;gap:6px}'+
      '._fcp-tabs{display:flex;gap:4px;flex-wrap:wrap;margin-bottom:20px;background:'+surface2+';padding:4px;border-radius:12px}'+
      '._fcp-tab{padding:8px 16px;border-radius:9px;font-size:12px;font-weight:700;background:none;border:none;cursor:pointer;font-family:Cairo,sans-serif;color:'+textSub+';transition:.15s}'+
      '._fcp-tab.on{background:'+accent+';color:#fff}'+
      '._fcp-row{display:flex;align-items:flex-start;gap:12px;padding:12px;background:'+surface2+';border:1px solid '+borderC+';border-radius:12px;margin-bottom:8px}'+
      '._badge{display:inline-flex;align-items:center;padding:3px 10px;border-radius:20px;font-size:10px;font-weight:700}'+
      '@media(max-width:600px){._fcp-wrap{padding:16px 12px 60px}}'+
      '@keyframes spin{to{transform:rotate(360deg)}}';
    document.head.appendChild(st);

    // NAV
    var nav=document.createElement('nav'); nav.className='_fcp-nav';
    nav.innerHTML='<div class="_fcp-nav-inner">'+
      '<div style="display:flex;align-items:center;gap:10px">'+
        (logo?'<img src="'+logo+'" style="width:36px;height:36px;border-radius:10px;object-fit:cover">':
              '<div style="width:36px;height:36px;border-radius:10px;background:'+accent+';display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:900;color:#fff">'+studioName.charAt(0)+'</div>')+
        '<div><div style="font-size:14px;font-weight:900">'+studioName+'</div><div style="font-size:10px;color:'+textMuted+'">بوابة العميل</div></div>'+
      '</div>'+
      '<div style="display:flex;align-items:center;gap:10px">'+
        '<div style="width:36px;height:36px;border-radius:50%;background:'+accent+';display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:900;color:#fff">'+cName.charAt(0)+'</div>'+
        '<div style="font-size:13px;font-weight:700">'+cName+'</div>'+
      '</div>'+
    '</div>';
    document.body.appendChild(nav);

    var wrap=document.createElement('div'); wrap.className='_fcp-wrap';

    // Welcome
    var totalInv=invoices.reduce(function(s,i){return s+(+i.total||0);},0);
    var paidInv=invoices.filter(function(i){return i.paid||i.status==='مدفوعة';}).reduce(function(s,i){return s+(+i.total||0);},0);
    var activeProj=projects.filter(function(p){return p.status!=='done';}).length;
    wrap.innerHTML='<div class="_fcp-card" style="border-right:4px solid '+accent+';margin-bottom:20px">'+
      '<div style="font-size:22px;font-weight:900;margin-bottom:6px">مرحباً، '+cName+' <span style="font-size:20px">👋</span></div>'+
      '<div style="font-size:13px;color:'+textSub+';margin-bottom:14px">بوابتك الشخصية — كل تفاصيل تعاملاتك مع '+studioName+'</div>'+
      '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px">'+
        [['مشاريع نشطة',activeProj,accent],['طلبات',orders.length,'#f7c948'],['فواتير',invoices.length,'#64b5f6'],['إجمالي مدفوع',paidInv.toLocaleString()+' ج.م','#4fd1a5']].map(function(x){
          return '<div style="background:'+x[2]+'18;border:1px solid '+x[2]+'33;border-radius:12px;padding:12px;text-align:center"><div style="font-size:18px;font-weight:900;color:'+x[2]+'">'+x[1]+'</div><div style="font-size:10px;color:'+textMuted+';margin-top:2px">'+x[0]+'</div></div>';
        }).join('')+
      '</div>'+
    '</div>';

    // Tabs
    var tabsDiv=document.createElement('div'); tabsDiv.className='_fcp-tabs';
    var tabs=[['projects','📁 المشاريع'],['orders','📦 الطلبات'],['invoices','📄 الفواتير'],['contracts','📋 العقود']];
    tabs.forEach(function(t,i){
      var btn=document.createElement('button'); btn.className='_fcp-tab'+(i===0?' on':'');
      btn.textContent=t[1]; btn.dataset.tab=t[0];
      btn.onclick=function(){
        tabsDiv.querySelectorAll('._fcp-tab').forEach(function(b){b.classList.remove('on');});
        this.classList.add('on');
        tabContent.innerHTML=renderClientTab(t[0]);
      };
      tabsDiv.appendChild(btn);
    });
    wrap.appendChild(tabsDiv);

    var tabContent=document.createElement('div');
    tabContent.innerHTML=renderClientTab('projects');
    wrap.appendChild(tabContent);
    document.body.appendChild(wrap);

    // ── لو في taskid في الـ URL — افتح تاب المشاريع وـ highlight التاسك ──
    var _targetTaskId = new URLSearchParams(window.location.search).get('taskid');
    if(_targetTaskId) {
      // فعّل تاب المشاريع
      tabsDiv.querySelectorAll('._fcp-tab').forEach(function(b){ b.classList.remove('on'); });
      tabsDiv.querySelector('[data-tab="projects"]') && tabsDiv.querySelector('[data-tab="projects"]').classList.add('on');
      tabContent.innerHTML = renderClientTab('projects');
      // بعد ما الـ DOM يتبني — scroll للتاسك وـ highlight
      setTimeout(function(){
        var allTaskEls = tabContent.querySelectorAll('._fcp-task-row');
        allTaskEls.forEach(function(el){
          if(el.dataset.taskid === String(_targetTaskId)){
            // افتح الـ project dropdown الأب
            var parentDrop = el.closest('._fcp-proj-drop');
            if(parentDrop) parentDrop.style.display = 'block';
            // highlight
            el.style.outline = '2px solid ' + accent;
            el.style.boxShadow = '0 0 0 4px ' + accent + '33';
            el.style.borderRadius = '12px';
            // scroll
            setTimeout(function(){ el.scrollIntoView({behavior:'smooth', block:'center'}); }, 200);
            // إزالة الـ highlight بعد 4 ثواني
            setTimeout(function(){
              el.style.outline = '';
              el.style.boxShadow = '';
            }, 4000);
          }
        });
        // كمان ابحث في الـ tasks العادية
        var taskCards = tabContent.querySelectorAll('._fcp-task-card');
        taskCards.forEach(function(el){
          if(el.dataset.taskid === String(_targetTaskId)){
            el.style.outline = '2px solid ' + accent;
            el.style.boxShadow = '0 0 0 4px ' + accent + '33';
            setTimeout(function(){ el.scrollIntoView({behavior:'smooth', block:'center'}); }, 200);
            setTimeout(function(){ el.style.outline=''; el.style.boxShadow=''; }, 4000);
          }
        });
      }, 300);
    }

    function renderClientTab(tab){
      if(tab==='projects') return renderClientProjects();
      if(tab==='orders') return renderClientOrders();
      if(tab==='invoices') return renderClientInvoices();
      if(tab==='contracts') return renderClientContracts();
      return '';
    }

    function _stBadge(label,color,bg){
      return '<span class="_badge" style="background:'+bg+';color:'+color+'">'+label+'</span>';
    }

    function renderClientProjects(){
      if(!projects.length) return '<div class="_fcp-card" style="text-align:center;padding:40px;color:'+textMuted+'"><div style="font-size:40px;margin-bottom:10px">📁</div><div>لا توجد مشاريع بعد</div></div>';
      return projects.map(function(p){
        var ptasks=allProjTasks.filter(function(t){return String(t.project_id)===String(p.id);});
        var done=ptasks.filter(function(t){return t.status==='done';}).length;
        var prog=ptasks.length?Math.round(done/ptasks.length*100):0;
        var stColors={active:'#4fd1a5',hold:'#f7c948',review:'#64b5f6',done:'#7c6ff7'};
        var stC=stColors[p.status||'active']||'#888';
        return '<div class="_fcp-card" style="cursor:pointer" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display===\'none\'?\'block\':\'none\'">'+
          '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap">'+
            '<div style="display:flex;align-items:center;gap:10px">'+
              '<div style="width:10px;height:10px;border-radius:50%;background:'+(p.color||accent)+';flex-shrink:0"></div>'+
              '<div><div style="font-size:14px;font-weight:800">'+p.name+'</div>'+
              '<div style="font-size:11px;color:'+textSub+'">'+ptasks.length+' مهمة · '+prog+'% مكتمل</div></div>'+
            '</div>'+
            _stBadge(stProjMap[p.status||'active']||p.status,stC,stC+'22')+
          '</div>'+
          '<div style="margin-top:12px;height:6px;background:'+borderC+';border-radius:3px;overflow:hidden">'+
            '<div style="height:100%;width:'+prog+'%;background:'+(p.color||accent)+';border-radius:3px"></div>'+
          '</div>'+
          (p.deadline?'<div style="font-size:11px;color:'+textMuted+';margin-top:8px">⏰ موعد التسليم: '+p.deadline+'</div>':'')+
        '</div>'+
        // Tasks dropdown
        '<div class="_fcp-proj-drop" style="display:none;margin-top:-12px;padding:12px 16px 16px;background:'+surface2+';border:1px solid '+borderC+';border-top:none;border-radius:0 0 18px 18px">'+
          '<div style="font-size:11px;font-weight:800;color:'+textMuted+';margin-bottom:10px">مهام المشروع</div>'+
          (ptasks.length?ptasks.map(function(t){
            var stC2=({todo:'#64b5f6',progress:'#f7c948',review:'#a78bfa',revision:'#f97316',done:'#4fd1a5',hold:'#888'})[t.status]||'#888';
            return '<div class="_fcp-task-row" data-taskid="'+t.id+'" style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:'+surface+';border-radius:10px;margin-bottom:6px;transition:outline .3s,box-shadow .3s">'+
              '<div style="width:8px;height:8px;border-radius:50%;background:'+stC2+';flex-shrink:0"></div>'+
              '<div style="flex:1;font-size:12px;font-weight:600">'+(t.title||'')+'</div>'+
              _stBadge(taskStMap[t.status]||t.status,stC2,stC2+'22')+
            '</div>';
          }).join(''):'<div style="font-size:12px;color:'+textMuted+';text-align:center;padding:10px">لا توجد مهام</div>')+
          // Files
          (p.files&&p.files.length?'<div style="font-size:11px;font-weight:800;color:'+textMuted+';margin:10px 0 8px">الملفات والروابط</div>'+
            p.files.filter(function(f){return f.url;}).map(function(f){
              return '<a href="'+f.url+'" target="_blank" style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:'+surface+';border-radius:10px;margin-bottom:6px;text-decoration:none;color:'+textMain+'">'+
                '<i class="fa-solid fa-link" style="color:'+accent+'"></i>'+
                '<div style="font-size:12px;font-weight:600">'+f.name+'</div>'+
                '<i class="fa-solid fa-arrow-up-right-from-square" style="font-size:10px;color:'+textMuted+';margin-right:auto"></i>'+
              '</a>';
            }).join(''):'');
        '</div>';
      }).join('');
    }

    function renderClientOrders(){
      if(!orders.length) return '<div class="_fcp-card" style="text-align:center;padding:40px;color:'+textMuted+'"><div style="font-size:40px;margin-bottom:10px">📦</div><div>لا توجد طلبات بعد</div></div>';
      return orders.map(function(o){
        var stC=({new:'#64b5f6',pending:'#f7c948',done:'#4fd1a5',cancelled:'#f76f7c'})[o.status]||'#888';
        var stLabel=({new:'جديد',pending:'قيد التنفيذ',done:'مكتمل',cancelled:'ملغي'})[o.status]||o.status||'جديد';
        return '<div class="_fcp-card">'+
          '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px">'+
            '<div><div style="font-size:14px;font-weight:800;margin-bottom:4px">'+(o.service_name||o.pkg_name||'طلب خدمة')+'</div>'+
            '<div style="font-size:11px;color:'+textSub+'">'+new Date(o.created_at||Date.now()).toLocaleDateString('ar-EG')+'</div></div>'+
            _stBadge(stLabel,stC,stC+'22')+
          '</div>'+
          (o.total?'<div style="font-size:16px;font-weight:900;color:'+accent+';margin-top:10px">'+Number(o.total).toLocaleString()+' ج.م</div>':'')+
          (o.notes?'<div style="font-size:12px;color:'+textSub+';margin-top:8px;padding:8px;background:'+surface2+';border-radius:8px">'+o.notes+'</div>':'')+
        '</div>';
      }).join('');
    }

    function renderClientInvoices(){
      if(!invoices.length) return '<div class="_fcp-card" style="text-align:center;padding:40px;color:'+textMuted+'"><div style="font-size:40px;margin-bottom:10px">📄</div><div>لا توجد فواتير بعد</div></div>';
      var totalAll=invoices.reduce(function(s,i){return s+(+i.total||0);},0);
      var totalPaid=invoices.filter(function(i){return i.paid||i.status==='مدفوعة';}).reduce(function(s,i){return s+(+i.total||0);},0);
      return '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px">'+
        '<div class="_fcp-card" style="text-align:center;padding:14px"><div style="font-size:11px;color:'+textMuted+';margin-bottom:4px">إجمالي الفواتير</div><div style="font-size:20px;font-weight:900;color:'+accent+'">'+totalAll.toLocaleString()+' ج.م</div></div>'+
        '<div class="_fcp-card" style="text-align:center;padding:14px"><div style="font-size:11px;color:'+textMuted+';margin-bottom:4px">إجمالي المدفوع</div><div style="font-size:20px;font-weight:900;color:#4fd1a5">'+totalPaid.toLocaleString()+' ج.م</div></div>'+
      '</div>'+
      invoices.map(function(inv){
        var paid=inv.paid||inv.status==='مدفوعة';
        return '<div class="_fcp-card">'+
          '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px">'+
            '<div><div style="font-size:14px;font-weight:800;margin-bottom:2px">'+(inv.number||'فاتورة')+(inv.desc?' — '+inv.desc:'')+'</div>'+
            '<div style="font-size:11px;color:'+textSub+'">'+(inv.date||'')+'</div></div>'+
            _stBadge(paid?'✅ مدفوعة':'⏳ غير مدفوعة',paid?'#4fd1a5':'#f7c948',paid?'rgba(79,209,165,.15)':'rgba(247,201,72,.15)')+
          '</div>'+
          '<div style="font-size:18px;font-weight:900;color:'+(paid?'#4fd1a5':accent)+';margin-top:10px">'+Number(inv.total||0).toLocaleString()+' '+(inv.currency||'ج.م')+'</div>'+
        '</div>';
      }).join('');
    }

    function renderClientContracts(){
      if(!contracts.length) return '<div class="_fcp-card" style="text-align:center;padding:40px;color:'+textMuted+'"><div style="font-size:40px;margin-bottom:10px">📋</div><div>لا توجد عقود بعد</div></div>';
      return contracts.map(function(c){
        return '<div class="_fcp-card">'+
          '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px">'+
            '<div><div style="font-size:14px;font-weight:800;margin-bottom:2px">'+(c.title||'عقد')+'</div>'+
            '<div style="font-size:11px;color:'+textSub+'">'+(c.date||'')+'</div></div>'+
            _stBadge(c.status||'نشط','#4fd1a5','rgba(79,209,165,.15)')+
          '</div>'+
          (c.value?'<div style="font-size:16px;font-weight:900;color:'+accent+';margin-top:10px">'+Number(c.value).toLocaleString()+' ج.م</div>':'')+
        '</div>';
      }).join('');
    }
  });
}

function _showCPError(msg){
  document.body.style.cssText='margin:0;padding:0;background:#f4f5fb;font-family:Cairo,Tajawal,sans-serif;direction:rtl';
  document.body.innerHTML='<div style="display:flex;align-items:center;justify-content:center;height:100vh"><div style="text-align:center"><div style="font-size:60px;margin-bottom:16px">⚠️</div><div style="font-size:18px;font-weight:700;color:#333;margin-bottom:8px">لا يمكن تحميل لوحة التحكم</div><div style="font-size:14px;color:#777">'+msg+'</div></div></div>';
}

function _buildProjectPortalPage(userId, projId){
  if(typeof supa==='undefined'){ document.body.innerHTML='<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:Cairo,sans-serif;direction:rtl;color:#666">تعذّر التحميل</div>'; return; }
  supa.from('studio_data').select('data').eq('user_id',userId).maybeSingle().then(function(res){
    if(!res||res.error||!res.data){ document.body.innerHTML='<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:Cairo,sans-serif;direction:rtl;color:#666">رابط غير صالح</div>'; return; }
    var ud; try{ ud=typeof res.data.data==='string'?JSON.parse(res.data.data):res.data.data; }catch(e){ return; }
    if(!ud) return;
    var proj=(ud.projects||[]).find(function(p){return String(p.id)===String(projId);});
    if(!proj){ document.body.innerHTML='<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:Cairo,sans-serif;direction:rtl;color:#666">المشروع غير موجود</div>'; return; }
    var tasks=(ud.project_tasks||[]).filter(function(t){return String(t.project_id)===String(projId);});
    var settings=ud.settings||{};
    var accent=settings.accentColor||settings.accent||'#7c6ff7';
    var clr=proj.color||accent;
    var prog=tasks.length?Math.round(tasks.filter(function(t){return t.status==='done';}).length/tasks.length*100):0;
    var stMap={active:'🟢 نشط',hold:'🟡 معلق',review:'🔵 مراجعة',done:'✅ مكتمل'};
    var colLabels={todo:'📋 To Do',progress:'⚡ In Progress',review:'🔍 Review',done:'✅ Done'};
    var colOrder=['todo','progress','review','done'];

    var tasksHtml=colOrder.map(function(col){
      var ct=tasks.filter(function(t){return t.status===col;});
      if(!ct.length) return '';
      return '<div style="margin-bottom:14px"><div style="font-size:11px;font-weight:800;color:#888;margin-bottom:6px;text-transform:uppercase">'+colLabels[col]+' ('+ct.length+')</div>'+
        ct.map(function(t){
          var steps=t.steps||[];
          var doneS=steps.filter(function(s){return s.done;}).length;
          return '<div style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:12px;margin-bottom:8px">'+
            '<div style="font-size:13px;font-weight:700;margin-bottom:4px'+(t.status==='done'?';text-decoration:line-through;opacity:.5':'')+'">'+(t.title||'')+'</div>'+
            (t.desc?'<div style="font-size:11px;opacity:.7;margin-bottom:4px">'+t.desc+'</div>':'')+
            '<div style="display:flex;gap:6px;flex-wrap:wrap;font-size:10px;opacity:.7">'+
              (t.deadline?'<span>📅 '+t.deadline+'</span>':'')+
              (t.assignee_name?'<span>👤 '+t.assignee_name+'</span>':'')+
              (steps.length?'<span>📋 '+doneS+'/'+steps.length+' خطوات</span>':'')+
            '</div>'+
          '</div>';
        }).join('')+'</div>';
    }).join('');

    var filesHtml=(proj.files||[]).map(function(f){
      return '<div style="display:flex;align-items:center;gap:10px;padding:10px;background:rgba(255,255,255,.05);border-radius:10px;margin-bottom:8px">'+
        '<i class="fa-solid fa-file" style="color:'+clr+'"></i>'+
        '<span style="flex:1;font-size:12px">'+(f.name||'')+'</span>'+
        '<a href="'+(f.data||'#')+'" download="'+(f.name||'')+'" style="color:'+clr+';font-size:11px;text-decoration:none"><i class="fa-solid fa-download"></i> تنزيل</a>'+
      '</div>';
    }).join('');

    document.body.innerHTML='';
    var style=document.createElement('style');
    style.textContent='@import url(\'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap\');*{box-sizing:border-box;margin:0;padding:0}body{font-family:\'Cairo\',sans-serif;background:#0a0a0f;color:#f0f0f5;direction:rtl;min-height:100vh}';
    document.head.appendChild(style);

    var main=document.createElement('div');
    main.style.cssText='max-width:800px;margin:0 auto;padding:20px';
    main.innerHTML='<div style="border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,.08);margin-bottom:20px">'+
      '<div style="height:8px;background:'+clr+'"></div>'+
      '<div style="padding:20px">'+
        '<div style="display:flex;align-items:start;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:14px">'+
          '<div><div style="font-size:22px;font-weight:900">'+escapeHtml(proj.name)+'</div>'+
          (proj.desc?'<div style="font-size:13px;opacity:.7;margin-top:4px">'+escapeHtml(proj.desc)+'</div>':'')+
          '</div>'+
          '<span style="background:'+clr+'22;color:'+clr+';padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700">'+(stMap[proj.status]||proj.status)+'</span>'+
        '</div>'+
        (proj.deadline?'<div style="font-size:12px;opacity:.6;margin-bottom:12px">📅 الموعد النهائي: '+proj.deadline+'</div>':'')+
        '<div style="font-size:12px;opacity:.6;margin-bottom:6px;display:flex;justify-content:space-between"><span>تقدم المشروع</span><span>'+prog+'%</span></div>'+
        '<div style="height:10px;background:rgba(255,255,255,.1);border-radius:5px;overflow:hidden;margin-bottom:4px">'+
          '<div style="height:100%;width:'+prog+'%;background:'+clr+';border-radius:5px;transition:.4s"></div>'+
        '</div>'+
        '<div style="font-size:10px;opacity:.5;text-align:left">'+tasks.filter(function(t){return t.status==='done';}).length+'/'+tasks.length+' مهمة مكتملة</div>'+
      '</div>'+
    '</div>'+
    (tasks.length?'<div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:20px;margin-bottom:20px"><div style="font-size:15px;font-weight:800;margin-bottom:14px"><i class="fa-solid fa-list-check" style="color:'+clr+'"></i> المهام</div>'+tasksHtml+'</div>':'')+
    ((proj.files||[]).length?'<div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:20px;margin-bottom:20px"><div style="font-size:15px;font-weight:800;margin-bottom:14px"><i class="fa-solid fa-folder" style="color:'+clr+'"></i> الملفات</div>'+filesHtml+'</div>':'')+
    '<div style="text-align:center;font-size:11px;opacity:.3;padding:20px">عرض فقط · مدعوم من Ordo</div>';
    document.body.appendChild(main);
    // scroll unlock
    document.documentElement.classList.add('pub-page');
    document.body.classList.add('pub-page');
  }).catch(function(){ document.body.innerHTML='<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:Cairo,sans-serif;direction:rtl;color:#666">تعذّر التحميل</div>'; });
}

// STATUS SETTINGS POPOVER (kanban column gear icon)
// ═══════════════════════════════════════════════════
(function(){
  // Inject popover CSS
  const s = document.createElement('style');
  s.textContent = `
    #_status-popover{
      position:fixed;z-index:9999;background:var(--surface2);border:1px solid var(--border);
      border-radius:14px;padding:0;min-width:260px;max-width:300px;
      box-shadow:0 12px 40px rgba(0,0,0,.45);animation:_spIn .18s cubic-bezier(.34,1.4,.64,1);
    }
    @keyframes _spIn{from{opacity:0;transform:scale(.88) translateY(-6px)}to{opacity:1;transform:scale(1) translateY(0)}}
    ._sp-header{padding:12px 14px 10px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between}
    ._sp-title{font-size:12px;font-weight:800;color:var(--text)}
    ._sp-close{background:none;border:none;cursor:pointer;color:var(--text3);font-size:14px;padding:2px 6px;border-radius:6px;line-height:1}
    ._sp-close:hover{color:var(--text);background:var(--surface3)}
    ._sp-body{padding:10px 14px}
    ._sp-row{display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:8px;margin-bottom:2px}
    ._sp-row:hover{background:var(--surface3)}
    ._sp-swatch{width:12px;height:12px;border-radius:50%;flex-shrink:0}
    ._sp-lbl{flex:1;font-size:12px;font-weight:600;color:var(--text2)}
    ._sp-action{background:none;border:none;cursor:pointer;font-size:11px;padding:3px 7px;border-radius:6px;color:var(--text3);transition:.12s}
    ._sp-action:hover{background:var(--surface);color:var(--text)}
    ._sp-action.danger:hover{color:var(--accent4);background:rgba(247,111,124,.1)}
    ._sp-divider{height:1px;background:var(--border);margin:8px 0}
    ._sp-new{display:flex;gap:6px;align-items:center;margin-top:2px}
    ._sp-new input{flex:1;height:30px;padding:0 8px;background:var(--surface3);border:1px solid var(--border);border-radius:7px;color:var(--text);font-size:12px;font-family:var(--font);outline:none}
    ._sp-new input:focus{border-color:var(--accent)}
    ._sp-new .color-dot{width:24px;height:24px;border-radius:50%;border:2px solid var(--border);cursor:pointer;flex-shrink:0}
    ._sp-add-btn{height:30px;padding:0 10px;background:var(--accent);color:#fff;border:none;border-radius:7px;font-size:11px;font-weight:700;cursor:pointer;white-space:nowrap;font-family:var(--font)}
  `;
  document.head.appendChild(s);
})();

let _spCurrentId = null;

function openStatusPopover(statusId, triggerEl){
  // Close if same popover already open
  const existing = document.getElementById('_status-popover');
  if(existing){ existing.remove(); if(_spCurrentId===statusId) { _spCurrentId=null; return; } }
  _spCurrentId = statusId;

  const defaultDefs = {
    new:      {label:'جديد',       icon:'<i class="fa-solid fa-clipboard-list"></i>', color:'#5a5a80', isDefault:true},
    progress: {label:'قيد التنفيذ', icon:'<i class="fa-solid fa-bolt"></i>', color:'#f7c948', isDefault:true},
    review:   {label:'مراجعة',     icon:'<i class="fa-solid fa-magnifying-glass"></i>', color:'#7c6ff7', isDefault:true},
    paused:   {label:'موقوف',      icon:'⏸', color:'#64b5f6', isDefault:true},
  };
  const def = defaultDefs[statusId];
  const isCustom = !def;
  const customEntry = isCustom ? (S.customStatuses||[]).find(s=>s.id===statusId) : null;
  const label = def ? def.label : (customEntry?.label||statusId);
  const color = def ? def.color : (customEntry?.color||'#888');
  const icon  = def ? def.icon  : (customEntry?.icon||'');
  const isHidden = (S.hiddenStatuses||[]).includes(statusId);

  const pop = document.createElement('div');
  pop.id = '_status-popover';

  // Position near trigger
  const rect = triggerEl.getBoundingClientRect();
  pop.style.top  = (rect.bottom + 6) + 'px';
  pop.style.right = Math.max(8, window.innerWidth - rect.right - 10) + 'px';

  pop.innerHTML = `
    <div class="_sp-header">
      <div style="display:flex;align-items:center;gap:7px">
        <span style="width:10px;height:10px;border-radius:50%;background:${color};display:inline-block"></span>
        <span class="_sp-title">${icon} ${label}</span>
      </div>
      <button class="_sp-close" onclick="document.getElementById('_status-popover')?.remove();_spCurrentId=null"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="_sp-body">
      <!-- Edit label & color for this status -->
      <div style="margin-bottom:10px">
        <div style="font-size:10px;color:var(--text3);font-weight:600;margin-bottom:5px;text-transform:uppercase;letter-spacing:.4px">تعديل الحالة</div>
        <div style="display:flex;gap:6px;align-items:center">
          <input id="_sp-edit-icon"  value="${(icon||'').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}" placeholder="رمز" style="width:38px;height:30px;padding:0 6px;background:var(--surface3);border:1px solid var(--border);border-radius:7px;color:var(--text);font-size:14px;text-align:center;outline:none;font-family:var(--font)">
          <input id="_sp-edit-label" value="${(label||'').replace(/"/g,'&quot;')}" placeholder="اسم الحالة" style="flex:1;height:30px;padding:0 8px;background:var(--surface3);border:1px solid var(--border);border-radius:7px;color:var(--text);font-size:12px;font-family:var(--font);outline:none">
          <input id="_sp-edit-color" type="color" value="${color.startsWith('var')?'#7c6ff7':color}" style="width:30px;height:30px;border:none;border-radius:7px;cursor:pointer;background:none;padding:0">
          <button onclick="_spSaveEdit('${statusId}')" style="height:30px;padding:0 10px;background:var(--accent);color:#fff;border:none;border-radius:7px;font-size:11px;font-weight:700;cursor:pointer;font-family:var(--font)">حفظ</button>
        </div>
      </div>
      <div class="_sp-divider"></div>
      <!-- Hide/Show toggle -->
      <div class="_sp-row" style="cursor:pointer" onclick="_spToggleHide('${statusId}')">
        <span style="font-size:14px">${isHidden?'<i class="fa-solid fa-eye"></i>':'<i class="fa-solid fa-eye-slash"></i>'}</span>
        <span class="_sp-lbl">${isHidden?'إظهار الحالة':'إخفاء الحالة من الكانبان'}</span>
      </div>
      <!-- Delete only for custom -->
      ${isCustom ? `<div class="_sp-row" style="cursor:pointer" onclick="_spDelete('${statusId}')">
        <span style="font-size:14px"><i class="fa-solid fa-trash"></i></span>
        <span class="_sp-lbl" style="color:var(--accent4)">حذف هذه الحالة</span>
      </div>` : `<div style="font-size:10px;color:var(--text3);padding:2px 8px">الحالات الأساسية لا يمكن حذفها</div>`}
      <div class="_sp-divider"></div>
      <!-- Add new status -->
      <div style="font-size:10px;color:var(--text3);font-weight:600;margin-bottom:6px;text-transform:uppercase;letter-spacing:.4px">+ إضافة حالة جديدة</div>
      <div class="_sp-new">
        <input id="_sp-new-icon" placeholder="⭐" style="width:34px;text-align:center;font-size:14px" title="رمز اختياري">
        <input id="_sp-new-label" placeholder="اسم الحالة...">
        <input id="_sp-new-color" type="color" value="#7c6ff7" style="width:28px;height:28px;border:none;border-radius:6px;cursor:pointer;background:none;padding:0;flex-shrink:0">
        <button class="_sp-add-btn" onclick="_spAddNew()">+ إضافة</button>
      </div>
    </div>`;

  document.body.appendChild(pop);

  // Close on outside click
  setTimeout(()=>{
    document.addEventListener('click', function _spOutside(e){
      if(!pop.contains(e.target) && !triggerEl.contains(e.target)){
        pop.remove(); _spCurrentId=null;
        document.removeEventListener('click',_spOutside);
      }
    });
  }, 100);
}

function _spSaveEdit(statusId){
  const icon  = document.getElementById('_sp-edit-icon')?.value.trim()||'';
  const label = document.getElementById('_sp-edit-label')?.value.trim();
  const color = document.getElementById('_sp-edit-color')?.value||'#7c6ff7';
  if(!label){toast('أدخل اسم الحالة');return;}

  const defaultIds = ['new','progress','review','paused'];
  if(defaultIds.includes(statusId)){
    // Save override for default statuses
    if(!S.statusOverrides) S.statusOverrides={};
    S.statusOverrides[statusId] = {label, icon, color};
    // Update the kanban header visually
    const col = document.querySelector(`[data-status="${statusId}"]`);
    if(col){
      const hdr = col.previousElementSibling;
      if(hdr) hdr.querySelector('div').innerHTML = (icon?icon+' ':'')+label;
    }
  } else {
    const idx = (S.customStatuses||[]).findIndex(s=>s.id===statusId);
    if(idx>-1){ S.customStatuses[idx].label=label; S.customStatuses[idx].icon=icon; S.customStatuses[idx].color=color; }
  }
  lsSave(); cloudSave(S);
  renderAll();
  renderTaskStatusesSettings();
  buildDynamicStatusDropdowns();
  document.getElementById('_status-popover')?.remove(); _spCurrentId=null;
  toast('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم تحديث الحالة');
}

function _spToggleHide(statusId){
  if(!S.hiddenStatuses) S.hiddenStatuses=[];
  if(S.hiddenStatuses.includes(statusId)){
    S.hiddenStatuses = S.hiddenStatuses.filter(x=>x!==statusId);
    toast('<i class="fa-solid fa-eye"></i> تم إظهار الحالة');
  } else {
    S.hiddenStatuses.push(statusId);
    toast('<i class="fa-solid fa-eye-slash"></i> تم إخفاء الحالة من الكانبان');
  }
  lsSave(); cloudSave(S);
  renderAll(); renderTaskStatusesSettings(); buildDynamicStatusDropdowns();
  document.getElementById('_status-popover')?.remove(); _spCurrentId=null;
}

function _spDelete(statusId){
  const count = (S.tasks||[]).filter(t=>t.status===statusId).length;
  const msg = count>0
    ? `هذه الحالة مستخدمة في ${count} مهمة — هل تريد حذفها؟ ستنتقل المهام لحالة "جديد"`
    : 'هل تريد حذف هذه الحالة؟';
  confirmDel(msg, ()=>{
    if(count>0) (S.tasks||[]).forEach(t=>{ if(t.status===statusId) t.status='new'; });
    S.customStatuses = (S.customStatuses||[]).filter(s=>s.id!==statusId);
    lsSave(); cloudSave(S);
    renderAll(); renderTaskStatusesSettings(); buildDynamicStatusDropdowns();
    document.getElementById('_status-popover')?.remove(); _spCurrentId=null;
    toast('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم الحذف');
  });
}

function _spAddNew(){
  const icon  = document.getElementById('_sp-new-icon')?.value.trim()||'';
  const label = document.getElementById('_sp-new-label')?.value.trim();
  const color = document.getElementById('_sp-new-color')?.value||'#7c6ff7';
  if(!label){toast('أدخل اسم الحالة الجديدة');return;}
  if(!S.customStatuses) S.customStatuses=[];
  const id='custom_'+Date.now();
  S.customStatuses.push({id,label,color,icon});
  lsSave(); cloudSave(S);
  renderAll(); renderTaskStatusesSettings(); buildDynamicStatusDropdowns();
  document.getElementById('_status-popover')?.remove(); _spCurrentId=null;
  toast('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تمت إضافة الحالة: '+(icon?icon+' ':'')+label);
}

