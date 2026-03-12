// ═══════════════════════════════════════════════════
// CLOUD THEME SYNC — saves theme to S.settings + cloud
// ═══════════════════════════════════════════════════
let _themeSyncTimer = null;
function _syncThemeToCloud(){
  clearTimeout(_themeSyncTimer);
  _themeSyncTimer = setTimeout(()=>{
    if(typeof S === 'undefined' || !S) return;
    if(!S.settings) S.settings = {};
    S.settings.accentColor = localStorage.getItem('studioAccentColor') || '#7c6ff7';
    S.settings.displayMode = localStorage.getItem('studioDisplayMode') || 'light';
    if(typeof lsSave === 'function') lsSave();
    if(typeof cloudSave === 'function') cloudSave(S);
  }, 800);
}

// Load theme from cloud when logging in
function _loadThemeFromCloud(){
  if(!S?.settings) return;
  if(S.settings.accentColor) setThemeColor(S.settings.accentColor);
  if(S.settings.displayMode) setDisplayMode(S.settings.displayMode);
  if(S.settings.lang) {
    try{ localStorage.setItem('studioLang', S.settings.lang); }catch(e){}
  }
  // استرداد التصنيفات من السحابة
  if(S.settings._svcCats && Array.isArray(S.settings._svcCats)){
    try{ localStorage.setItem('_svcCats', JSON.stringify(S.settings._svcCats)); }catch(e){}
  }
  if(S.settings._pfCats && Array.isArray(S.settings._pfCats)){
    try{ localStorage.setItem('_pfCats', JSON.stringify(S.settings._pfCats)); }catch(e){}
  }
}

// ═══════════════════════════════════════════════════
// PLATFORM NAME — load from Supabase platform config
// ═══════════════════════════════════════════════════
async function _loadPlatformNameFromCloud(){
  try{
    if(typeof supa === 'undefined') return;
    // Load from platform_settings table (admin saves here — global config for all users)
    const { data, error } = await supa
      .from('platform_settings').select('config').eq('id', 1).maybeSingle();
    if(!error && data?.config){
      const cfg = typeof data.config === 'string' ? JSON.parse(data.config) : data.config;
      localStorage.setItem('platform_config', JSON.stringify(cfg));
      applyPlatformConfig();
      return;
    }
    // Fallback: use localStorage (same-browser admin)
    applyPlatformConfig();
  } catch(e){
    // Table doesn't exist yet — use localStorage only
    applyPlatformConfig();
  }
}

// ═══════════════════════════════════════════════════
// ESC TO CLOSE + ENTER TO SUBMIT
// ═══════════════════════════════════════════════════
document.addEventListener('keydown', function(e){
  if(e.key === 'Escape'){
    // Close topmost open modal
    const modals = [...document.querySelectorAll('.modal-overlay.open, .modal-overlay[style*="flex"]')];
    if(modals.length){
      const topModal = modals[modals.length-1];
      const closeBtn = topModal.querySelector('.close-btn');
      if(closeBtn){ closeBtn.click(); return; }
    }
    // Close profile menu
    document.getElementById('_profile-menu-pop')?.remove();
    document.getElementById('_log-popup')?.remove();
    // Close filter panel
    const fp = document.getElementById('_filter-panel');
    if(fp && fp.style.display !== 'none') _toggleFilterPanel();
  }
  if(e.key === 'Enter' && !e.shiftKey){
    // Only if not in textarea
    if(e.target.tagName === 'TEXTAREA') return;
    // Find primary button in active modal
    const modals = [...document.querySelectorAll('.modal-overlay.open, .modal-overlay[style*="flex"]')];
    if(modals.length){
      const top = modals[modals.length-1];
      // Find save/submit button
      const saveBtn = top.querySelector('button.btn-primary:not([data-no-enter])');
      if(saveBtn && e.target !== saveBtn && !e.target.closest('select')){
        // Don't trigger if user is in an input with a datalist (autocomplete)
        if(!e.target.getAttribute('list')) saveBtn.click();
      }
    }
  }
});

function _toggleFilterPanel(){
  const panel = document.getElementById('_filter-panel');
  const btn   = document.getElementById('_filter-toggle-btn');
  if(!panel) return;
  const open = panel.style.display !== 'none';
  panel.style.display = open ? 'none' : 'block';
  if(btn) btn.style.borderColor = open ? 'var(--border)' : 'var(--accent)';
  if(btn) btn.style.color = open ? 'var(--text2)' : 'var(--accent)';
}

function _toggleLogMenu(triggerEl){
  const existing = document.getElementById('_log-popup');
  if(existing){ existing.remove(); return; }
  const logItems = [
    {label:'<i class="fa-solid fa-clipboard-list"></i> المهام النشطة', tab:'active'},
    {label:'<i class="fa-solid fa-calendar-days"></i> السجل اليومي',   tab:'log-day'},
    {label:'<i class="fa-solid fa-calendar-days"></i> السجل الشهري',   tab:'log-month'},
    {label:'<i class="fa-solid fa-chart-bar"></i> السجل السنوي',   tab:'log-year'},
    {label:'<i class="fa-solid fa-box"></i> الأرشيف',        tab:'archive'},
  ];
  const currentActive = document.getElementById('ttab-active')?.style.background?.includes('247') ? 'active'
    : document.getElementById('ttab-log-day')?.style.background?.includes('247') ? 'log-day'
    : document.getElementById('ttab-log-month')?.style.background?.includes('247') ? 'log-month'
    : document.getElementById('ttab-log-year')?.style.background?.includes('247') ? 'log-year' : 'active';

  const pop = document.createElement('div');
  pop.id = '_log-popup';
  pop.innerHTML = logItems.map(i=>`
    <button onclick="switchTasksTab('${i.tab}');document.getElementById('_log-popup')?.remove()" class="${i.tab===currentActive?'active':''}">${i.label}</button>
  `).join('');

  const rect = triggerEl.getBoundingClientRect();
  pop.style.top = (rect.bottom+6)+'px';
  pop.style.left = Math.max(8, rect.left-100)+'px';
  document.body.appendChild(pop);
  setTimeout(()=>{
    document.addEventListener('click', function _lpClose(e){
      if(!pop.contains(e.target)&&!triggerEl.contains(e.target)){
        pop.remove();
        document.removeEventListener('click',_lpClose);
      }
    });
  },100);
}

// Show active filter dot when any filter is active
function _updateFilterDot(){
  const dot = document.getElementById('_filter-active-dot');
  if(!dot) return;
  const active = ['tf-status','tf-priority','tf-jobtype','tf-month','tf-search'].some(id=>{
    const el=document.getElementById(id);
    return el && el.value;
  });
  dot.style.display = active ? 'block' : 'none';
}
// Hook into applyTaskFilters
const _origApplyTF = typeof applyTaskFilters !== 'undefined' ? applyTaskFilters : null;
window.addEventListener('load', function(){
  const _orig = applyTaskFilters;
  applyTaskFilters = function(){
    _orig();
    _updateFilterDot();
  };
});

// ═══════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════
