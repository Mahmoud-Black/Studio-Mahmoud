
// Prevent flash: show body only after auth check AND subscription load
window._appReady = false;
window._cloudLoadDone = false;
window._showApp = function(){
  // لو في login flow نشط — مش نفعّل الحفظ قبل ما البيانات تتحمل
  if(!window._cloudLoadDone) {
    window._appReady = false; // لا نسمح بالحفظ قبل التحميل
  } else {
    window._appReady = true;
  }
  document.body.style.visibility = 'visible';
  // لو صفحة متجر عام - لا تضيف overflow:hidden
  var _pp = new URLSearchParams(window.location.search);
  var isPublic = _pp.get('svcorder') || _pp.get('u') || (_pp.get('portal') && _pp.get('uid'));
  if(isPublic) {
    // Public page: ensure scroll works
    document.documentElement.classList.remove('app-loaded');
    document.body.classList.remove('app-loaded');
    document.documentElement.classList.add('pub-page');
    document.body.classList.add('pub-page');
    var shell = document.getElementById('app-shell') || document.querySelector('.app-shell');
    if(shell) shell.style.display = 'none';
  } else {
    // Normal app: lock scroll (app uses internal scrolling)
    document.documentElement.classList.add('app-loaded');
    document.body.classList.add('app-loaded');
  }
};
// Fallback: show after 4s no matter what
setTimeout(window._showApp, 4000);
// لو صفحة متجر - تفعيل أسرع
if(new URLSearchParams(window.location.search).get('svcorder')) setTimeout(window._showApp, 500);

