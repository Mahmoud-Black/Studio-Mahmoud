
(function(){
  function _syncOffline(){
    var bar=document.getElementById('_offline-bar');
    if(!bar) return;
    if(!navigator.onLine){
      bar.style.display='block';
    } else {
      if(bar.style.display!=='none'){
        bar.style.background='rgba(20,40,30,.94)';
        bar.style.color='#4fd1a5';
        bar.innerHTML='<i class="fa-solid fa-wifi" style="margin-left:6px;font-size:11px"></i>عاد الاتصال بالإنترنت';
        setTimeout(function(){ bar.style.display='none'; bar.style.background='rgba(20,20,30,.94)'; bar.style.color='#f7c948'; bar.innerHTML='<i class="fa-solid fa-wifi" style="opacity:.6;margin-left:6px;font-size:11px"></i>لا يوجد اتصال بالإنترنت'; },2500);
      }
    }
  }
  window.addEventListener('online', _syncOffline);
  window.addEventListener('offline', _syncOffline);
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',_syncOffline);
  else _syncOffline();
})();

