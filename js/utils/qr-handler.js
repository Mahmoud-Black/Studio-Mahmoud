
/* ── QR wrapper: canvas-based (qrcodejs), falls back gracefully ── */
var _qrCache = {};

function _makeQRCanvas(text, size) {
  if (!text || !text.trim()) return null;
  try {
    var tmp = document.createElement('div');
    tmp.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:'+size+'px;height:'+size+'px;';
    document.body.appendChild(tmp);
    new QRCode(tmp, {
      text: text, width: size, height: size,
      colorDark: '#000000', colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.M
    });
    var canvas = tmp.querySelector('canvas');
    var dataURL = canvas ? canvas.toDataURL('image/png') : null;
    document.body.removeChild(tmp);
    return dataURL;
  } catch(e) { return null; }
}

/* Live preview — renders directly into container div */
function liveQR(inputId, previewId, size) {
  var text = (document.getElementById(inputId) ? document.getElementById(inputId).value : '').trim();
  var el = document.getElementById(previewId);
  if (!el) return;
  el.innerHTML = '';
  if (!text) {
    el.innerHTML = '<div style="width:'+size+'px;height:'+size+'px;display:flex;align-items:center;justify-content:center;background:#f5f3ff;border-radius:8px;font-size:11px;color:#7c6ff7;text-align:center;padding:6px">أدخل رابطاً</div>';
    return;
  }
  try {
    el.style.cssText = 'width:'+size+'px;height:'+size+'px;border-radius:8px;overflow:hidden;';
    new QRCode(el, {
      text: text, width: size, height: size,
      colorDark: '#000000', colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.M
    });
    /* hide img fallback if canvas exists */
    setTimeout(function(){
      var img = el.querySelector('img');
      if (img && el.querySelector('canvas')) img.style.display='none';
    }, 80);
  } catch(e) {
    el.innerHTML = '<div style="width:'+size+'px;height:'+size+'px;background:#fff0f0;display:flex;align-items:center;justify-content:center;font-size:10px;color:red;">خطأ</div>';
  }
}

/* Returns PNG data-URL for embedding in preview/PDF HTML */
function getQRDataURL(text, size) {
  if (!text || !text.trim()) return null;
  var key = text + '_' + size;
  if (_qrCache[key]) return _qrCache[key];
  var url = _makeQRCanvas(text, size || 120);
  if (url) _qrCache[key] = url;
  return url;
}

