
(function(){
'use strict';

// ── State ──────────────────────────────────────────────────
var _lang = 'ar';
try { _lang = localStorage.getItem('_appLang') || 'ar'; } catch(e){}

// ── Translation cache ───────────────────────────────────────
var _cache = {};
try {
  var stored = localStorage.getItem('_transCache');
  if(stored) _cache = JSON.parse(stored);
} catch(e){ _cache = {}; }

function saveCache(){
  try { localStorage.setItem('_transCache', JSON.stringify(_cache)); } catch(e){}
}

// ── Google Translate (unofficial free API) ──────────────────
function translateText(text, from, to, cb){
  if(!text || !text.trim()){ cb(text); return; }
  var key = from+'|'+to+'|'+text;
  if(_cache[key]){ cb(_cache[key]); return; }

  // Google Translate unofficial endpoint — works without API key
  var url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl='+
    encodeURIComponent(from)+'&tl='+encodeURIComponent(to)+
    '&dt=t&q='+encodeURIComponent(text);

  fetch(url)
    .then(function(r){ return r.json(); })
    .then(function(data){
      // Response: [[["translated","original",null,null,10],...],null,"ar"]
      var translated = '';
      if(data && data[0]){
        data[0].forEach(function(part){ if(part && part[0]) translated += part[0]; });
      }
      var result = translated || text;
      _cache[key] = result;
      saveCache();
      cb(result);
    })
    .catch(function(){ 
      // Fallback to MyMemory
      var fallbackUrl = 'https://api.mymemory.translated.net/get?q='+
        encodeURIComponent(text)+'&langpair='+from+'|'+to;
      fetch(fallbackUrl)
        .then(function(r){ return r.json(); })
        .then(function(d){
          var t = (d && d.responseData && d.responseData.translatedText) || text;
          _cache[key] = t; saveCache(); cb(t);
        })
        .catch(function(){ cb(text); });
    });
}

// Batch translate — translate each separately to avoid delimiter issues
function translateBatch(texts, from, to, cb){
  var results = new Array(texts.length);
  var done = 0;
  if(texts.length === 0){ cb(results); return; }
  texts.forEach(function(text, idx){
    translateText(text, from, to, function(translated){
      results[idx] = translated;
      done++;
      if(done === texts.length) cb(results);
    });
  });
}

// ── Collect text nodes from visible DOM ─────────────────────
function getTranslatableNodes(root){
  var nodes = [];
  var skipTags = new Set(['SCRIPT','STYLE','INPUT','TEXTAREA','CODE','PRE']);
  var skipClasses = ['fa-','no-translate'];

  function walk(el){
    if(!el) return;
    if(skipTags.has(el.tagName)) return;
    // Skip elements with no-translate class
    if(el.classList && skipClasses.some(function(c){ return el.className && el.className.indexOf(c) !== -1; })) return;

    el.childNodes.forEach(function(node){
      if(node.nodeType === 3){ // text node
        var t = node.textContent.trim();
        // Only translate nodes with Arabic or meaningful text (≥2 chars)
        if(t.length >= 2 && !/^[0-9\s\.,%-]+$/.test(t) && !/^[a-zA-Z0-9\s\.,%-]+$/.test(t)){
          nodes.push(node);
        }
      } else if(node.nodeType === 1){
        walk(node);
      }
    });
  }
  walk(root || document.body);
  return nodes;
}

// ── Translate all text nodes in the page ────────────────────
var _translating = false;

function translatePage(targetLang, onDone){
  if(_translating){ if(onDone) onDone(); return; }
  _translating = true;

  var fromLang = targetLang === 'en' ? 'ar' : 'en';
  var nodes = getTranslatableNodes(document.body);

  // Collect unique texts
  var uniqueTexts = [];
  var textSet = {};
  nodes.forEach(function(node){
    var t = node.textContent.trim();
    if(t && !textSet[t]){
      textSet[t] = true;
      uniqueTexts.push(t);
    }
  });

  // Build reverse map: original → translated
  var translationMap = {};
  var pending = uniqueTexts.length;

  if(pending === 0){
    _translating = false;
    if(onDone) onDone();
    return;
  }

  // Check cache first
  var needTranslation = [];
  uniqueTexts.forEach(function(t){
    var key = fromLang+'|'+targetLang+'|'+t;
    if(_cache[key]){
      translationMap[t] = _cache[key];
    } else {
      needTranslation.push(t);
    }
  });

  // Apply cached translations immediately
  nodes.forEach(function(node){
    var t = node.textContent.trim();
    if(translationMap[t] && translationMap[t] !== t){
      node.textContent = node.textContent.replace(t, translationMap[t]);
    }
  });

  if(needTranslation.length === 0){
    _translating = false;
    if(onDone) onDone();
    return;
  }

  // Batch translate in chunks of 10
  var CHUNK = 10;
  var chunks = [];
  for(var i=0; i<needTranslation.length; i+=CHUNK){
    chunks.push(needTranslation.slice(i, i+CHUNK));
  }

  var processed = 0;
  chunks.forEach(function(chunk){
    translateBatch(chunk, fromLang, targetLang, function(translated){
      chunk.forEach(function(orig, idx){
        if(translated[idx] && translated[idx] !== orig){
          translationMap[orig] = translated[idx];
        }
      });
      processed++;
      if(processed === chunks.length){
        // Apply all new translations
        var freshNodes = getTranslatableNodes(document.body);
        freshNodes.forEach(function(node){
          var t = node.textContent.trim();
          if(translationMap[t]){
            node.textContent = node.textContent.replace(t, translationMap[t]);
          }
        });
        _translating = false;
        if(onDone) onDone();
      }
    });
  });
}

// ── Direction & Layout ──────────────────────────────────────
function applyDirection(lang){
  var isAr = lang === 'ar';
  var html = document.documentElement;
  html.lang = lang;
  html.dir  = isAr ? 'rtl' : 'ltr';
  document.body.classList.toggle('lang-rtl', isAr);
  document.body.classList.toggle('lang-ltr', !isAr);

  // Update sidebar direction
  var sidebar = document.querySelector('.sidebar');
  var appBody = document.querySelector('.app-body');
  var appShell = document.querySelector('.app-shell');

  if(sidebar){
    if(isAr){
      sidebar.style.right = '0';
      sidebar.style.left  = 'auto';
      sidebar.style.borderRight = 'none';
      sidebar.style.borderLeft  = '1px solid var(--border)';
    } else {
      sidebar.style.right = 'auto';
      sidebar.style.left  = '0';
      sidebar.style.borderLeft  = 'none';
      sidebar.style.borderRight = '1px solid var(--border)';
    }
  }
  if(appShell){
    appShell.style.flexDirection = isAr ? 'row-reverse' : 'row';
  }
  if(appBody){
    // الـ margin بس على الديسكتوب — على الموبايل الـ sidebar overlay
    var isDesktop = window.innerWidth >= 1025;
    if(isDesktop){
      if(isAr){
        appBody.style.marginRight = '240px';
        appBody.style.marginLeft  = '0';
      } else {
        appBody.style.marginLeft  = '240px';
        appBody.style.marginRight = '0';
      }
    } else {
      appBody.style.marginRight = '0';
      appBody.style.marginLeft  = '0';
    }
  }

  // Nav items border direction
  document.querySelectorAll('.nav-item').forEach(function(el){
    if(isAr){
      el.style.borderRight = '';
      el.style.borderLeft  = '';
    } else {
      el.style.borderRight = 'none';
    }
  });
}

// ── Public toggle function ──────────────────────────────────
window._toggleLang = function(){
  var next = _lang === 'ar' ? 'en' : 'ar';
  var btn  = document.getElementById('_lang-toggle-btn');
  var ind  = btn && btn.querySelector('._lang-indicator');

  // Show loading state
  if(btn){
    btn.style.opacity = '0.5';
    btn.style.pointerEvents = 'none';
  }

  // Apply direction immediately
  applyDirection(next);
  _lang = next;
  try { localStorage.setItem('_appLang', next); } catch(e){}

  // Update button indicator
  if(ind) ind.textContent = next === 'ar' ? 'EN' : 'AR';

  // Translate
  translatePage(next, function(){
    if(btn){
      btn.style.opacity = '1';
      btn.style.pointerEvents = '';
    }
    var msg = next === 'ar' ? '<i class="fa-solid fa-check"></i> تم التحويل للعربية' : '<i class="fa-solid fa-check"></i> Switched to English';
    if(typeof showToast === 'function') showToast(msg, 2500);
    else if(typeof toast === 'function') toast(msg, 2500);
  });
};

// ── MutationObserver for dynamically rendered content ────────
var _observer = null;
var _observerTimeout = null;

function startObserver(){
  if(_observer) return;
  _observer = new MutationObserver(function(mutations){
    if(_lang === 'ar') return; // no translation needed for Arabic
    clearTimeout(_observerTimeout);
    _observerTimeout = setTimeout(function(){
      var addedNodes = [];
      mutations.forEach(function(m){
        m.addedNodes.forEach(function(n){
          if(n.nodeType === 1) addedNodes.push(n);
        });
      });
      if(addedNodes.length === 0) return;
      var fromLang = 'ar';
      addedNodes.forEach(function(root){
        var nodes = getTranslatableNodes(root);
        nodes.forEach(function(node){
          var t = node.textContent.trim();
          var key = fromLang+'|en|'+t;
          if(_cache[key] && _cache[key] !== t){
            node.textContent = node.textContent.replace(t, _cache[key]);
          }
        });
      });
    }, 300);
  });
  _observer.observe(document.body, { childList: true, subtree: true });
}

// ── CSS for LTR layout ──────────────────────────────────────
var _styleEl = document.createElement('style');
_styleEl.id = '_i18n-style';
_styleEl.textContent = [
  // Direction-aware flex
  'body.lang-ltr .sidebar{right:auto!important;left:0!important;border-left:1px solid var(--border)!important;border-right:none!important;transform:translateX(-100%)}',
  '@media(min-width:1025px){body.lang-ltr .sidebar{transform:translateX(0)!important}}',
  '@media(min-width:1025px){body.lang-ltr .app-body{margin-right:0!important;width:100%!important;padding-right:0!important;margin-left:240px!important;width:calc(100% - 240px)!important}}',
  '@media(min-width:1025px){body.lang-ltr.sidebar-collapsed .app-body{margin-left:0!important;width:100%!important}}',
  'body.lang-ltr .app-header{direction:ltr!important}',
  'body.lang-ltr .header-actions{flex-direction:row!important}',
  // Nav items
  'body.lang-ltr .nav-item{border-right:3px solid transparent!important;border-left:none!important;text-align:left!important}',
  'body.lang-ltr .nav-item.active{border-right-color:var(--accent)!important}',
  'body.lang-ltr .nav-item:hover{border-right-color:var(--border)!important}',
  // Cards & modals  
  'body.lang-ltr .card,.lang-ltr .modal,.lang-ltr .modal-content{text-align:left!important}',
  'body.lang-ltr input,body.lang-ltr textarea,body.lang-ltr select{direction:ltr!important;text-align:left!important}',
  // Sidebar logo sub
  'body.lang-ltr .sidebar{direction:ltr}',
  'body.lang-ltr .sidebar-logo{flex-direction:row}',
  // Page headers
  'body.lang-ltr .page-header,.lang-ltr .page-title,.lang-ltr .page-subtitle{text-align:left!important}',
  // Bottom nav
  'body.lang-ltr .bottom-nav,.lang-ltr .bn-more-menu{direction:ltr}',
  // Tables
  'body.lang-ltr table{direction:ltr}',
  'body.lang-ltr th,body.lang-ltr td{text-align:left}',
  // FA icons consistency
  '.fa-solid,.fa-regular,.fa-brands{display:inline-block;line-height:1;vertical-align:middle}',
  '.nav-icon .fa-solid,.nav-icon .fa-regular{font-size:15px;width:16px;text-align:center}',
  '.bn-icon .fa-solid{font-size:17px}',
  '.bn-more-item .fa-solid{font-size:14px;width:18px;text-align:center}',
  // Lang button
  '@keyframes _langSpin{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}',
  '#_lang-toggle-btn._loading i{animation:_langSpin .8s linear infinite}',
].join('\n');
document.head.appendChild(_styleEl);

// ── Init ─────────────────────────────────────────────────────
function init(){
  // Build lang button UI
  var btn = document.getElementById('_lang-toggle-btn');
  if(btn){
    btn.innerHTML = [
      '<i class="fa-solid fa-language" style="font-size:15px"></i>',
      '<span class="_lang-indicator" style="font-size:9px;font-weight:900;position:absolute;',
      'bottom:3px;right:3px;line-height:1;font-family:monospace;letter-spacing:-0.5px">',
      _lang === 'ar' ? 'EN' : 'AR',
      '</span>'
    ].join('');
    btn.style.position = 'relative';
  }

  // Apply saved language on load
  if(_lang !== 'ar'){
    applyDirection(_lang);
    translatePage(_lang, function(){
      startObserver();
    });
  } else {
    applyDirection('ar');
    startObserver();
  }

  // Sync dark mode icon
  syncDarkModeIcon();
}

function syncDarkModeIcon(){
  var isDark = !document.body.classList.contains('light-mode');
  [document.querySelector('#dark-toggle-btn i'),
   document.querySelector('#bnm-dark-icon i')].forEach(function(ic){
    if(ic) ic.className = isDark ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
  });
}

// Hook dark mode toggle
(function(){
  var _orig = window.toggleDarkLight;
  window.toggleDarkLight = function(){
    if(_orig) _orig.call(this);
    setTimeout(syncDarkModeIcon, 50);
  };
  // Also hook setDisplayMode
  var _origSet = window.setDisplayMode;
  if(_origSet) window.setDisplayMode = function(m){
    _origSet.call(this, m);
    setTimeout(syncDarkModeIcon, 50);
  };
})();

// Hook showPage to re-translate newly shown content
(function(){
  var _origSP = window.showPage;
  window.showPage = function(id, el){
    if(_origSP) _origSP.call(this, id, el);
    if(_lang !== 'ar'){
      setTimeout(function(){
        translatePage(_lang, null);
      }, 400);
    }
  };
})();

// Expose
window._i18n = {
  lang: function(){ return _lang; },
  translate: translatePage,
  cache: function(){ return _cache; }
};

// Init when DOM is ready
if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', init);
} else {
  setTimeout(init, 100);
}

})();

