// COURSES — CRUD + Render
// ============================================================
function previewCourseEmbed(){
  const url=document.getElementById('course-url')?.value||'';
  const prev=document.getElementById('course-embed-preview'); if(!prev) return;
  const ytMatch=url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?]+)/);
  const ytPlaylist=url.match(/youtube\.com\/playlist\?list=([^&]+)/);
  if(ytMatch){
    prev.style.display='block';
    prev.innerHTML=`<div style="position:relative;padding-top:56.25%"><iframe src="https://www.youtube.com/embed/${ytMatch[1]}" style="position:absolute;inset:0;width:100%;height:100%;border:none;border-radius:8px" allowfullscreen></iframe></div>`;
  } else if(ytPlaylist){
    prev.style.display='block';
    prev.innerHTML=`<div style="position:relative;padding-top:56.25%"><iframe src="https://www.youtube.com/embed/videoseries?list=${ytPlaylist[1]}" style="position:absolute;inset:0;width:100%;height:100%;border:none;border-radius:8px" allowfullscreen></iframe></div>`;
  } else { prev.style.display='none'; prev.innerHTML=''; }
}


function delCourse(id){ confirmDel('حذف هذا الكورس؟',()=>{ S.courses=S.courses.filter(c=>c.id!==id); lsSave(); renderCourses(); }); }

// ── Render courses grid (max 2 steps preview in card) ──
function renderCourses(){
  const el = document.getElementById('courses-grid'); if(!el) return;
  if(!S.courses||!S.courses.length){
    el.innerHTML='<div class="empty card" style="padding:20px"><div class="empty-icon"><i class="fa-solid fa-graduation-cap"></i></div>أضف كورس أو فيديو تعليمي</div>';
    return;
  }
  const stColor={todo:'var(--text3)',inprogress:'var(--accent2)',done:'var(--accent3)'};
  const stLabel={todo:'<i class="fa-solid fa-clipboard-list"></i> لم أبدأ',inprogress:'<i class="fa-solid fa-bolt"></i> جاري',done:'<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> مكتمل'};
  el.innerHTML=S.courses.map(c=>{
    const ytMatch=c.url&&c.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?]+)/);
    const thumb=ytMatch?`<div style="position:relative;padding-top:42%;overflow:hidden;border-radius:8px;margin-bottom:10px;background:var(--surface3);cursor:pointer" onclick="toggleCourseEmbed(${c.id})">
      <img src="https://i.ytimg.com/vi/${ytMatch[1]}/hqdefault.jpg"
           onerror="this.style.display='none';this.parentElement.querySelector('.yt-thumb-fallback').style.display='flex'"
           style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:8px" loading="lazy">
      <div class="yt-thumb-fallback" style="display:none;position:absolute;inset:0;align-items:center;justify-content:center;flex-direction:column;gap:6px">
        <div style="font-size:28px"><i class="fa-solid fa-play"></i></div><div style="font-size:11px;color:var(--text3)">معاينة</div>
      </div>
      <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .2s;background:rgba(0,0,0,.3)" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0">
        <div style="width:44px;height:44px;background:rgba(255,0,0,.85);border-radius:50%;display:flex;align-items:center;justify-content:center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
        </div>
      </div>
    </div>`:'';

    const steps = c.steps||[];
    const doneCount = steps.filter(s=>s.done).length;
    const progress = c.progress||0;

    // MAX 2 steps preview in card
    const previewSteps = steps.slice(0,2);
    const stepsPreviewHtml = previewSteps.length ? `
      <div style="display:flex;flex-direction:column;gap:4px;margin-bottom:8px">
        ${previewSteps.map((s,i)=>`<div style="display:flex;align-items:center;gap:7px;padding:6px 9px;background:var(--surface2);border-radius:7px;border:1px solid ${s.done?'rgba(79,209,165,.3)':'var(--border)'}">
          <div class="_cs-item-check${s.done?' checked':''}" onclick="event.stopPropagation();quickToggleStep(${c.id},${i})" style="cursor:pointer;flex-shrink:0">
            ${s.done?'<svg width="10" height="10" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round"/></svg>':''}
          </div>
          <span style="flex:1;font-size:12px;${s.done?'text-decoration:line-through;color:var(--text3)':'color:var(--text)'}">${s.title||'خطوة '+(i+1)}</span>
        </div>`).join('')}
        ${steps.length>2?`<div style="font-size:11px;color:var(--accent);text-align:center;padding:4px;cursor:pointer;font-weight:700" onclick="openCourseDetailPage(${c.id})">+ ${steps.length-2} خطوات أخرى ←</div>`:''}
      </div>` : '';

    return `<div class="card" style="position:relative">
      ${thumb}
      <div style="display:flex;justify-content:space-between;align-items:start;gap:8px;margin-bottom:8px">
        <div style="font-size:14px;font-weight:800;flex:1;color:var(--text)">${c.title}</div>
        <div style="display:flex;gap:4px;flex-shrink:0">
          <button onclick="openCourseModal(${c.id})" class="btn btn-ghost btn-sm" title="تعديل"><i class="fa-solid fa-pen"></i></button>
          <button onclick="delCourse(${c.id})" class="btn btn-danger btn-sm" title="حذف"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">
        <span style="font-size:11px;font-weight:700;color:${stColor[c.status]};background:${stColor[c.status]}18;padding:2px 9px;border-radius:10px">${stLabel[c.status]||c.status}</span>
        ${c.platform?`<span style="font-size:11px;color:var(--text3);background:var(--surface3);padding:2px 9px;border-radius:10px">${c.platform}</span>`:''}
        ${steps.length?`<span style="font-size:11px;color:var(--accent);background:rgba(124,111,247,.12);padding:2px 9px;border-radius:10px"><i class="fa-solid fa-clipboard-list"></i> ${doneCount}/${steps.length}</span>`:''}
      </div>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
        <div style="flex:1;height:7px;background:var(--surface3);border-radius:4px;overflow:hidden">
          <div style="height:100%;width:${progress}%;background:${progress>=100?'var(--accent3)':'var(--accent)'};border-radius:4px;transition:width .4s"></div>
        </div>
        <span style="font-size:12px;font-weight:800;color:${progress>=100?'var(--accent3)':'var(--accent)'};min-width:32px">${progress}%</span>
      </div>
      ${stepsPreviewHtml}
      <button onclick="openCourseDetailPage(${c.id})" style="width:100%;padding:8px;background:var(--surface2);border:1px solid var(--border);border-radius:9px;color:var(--accent);font-size:12px;font-weight:700;cursor:pointer;font-family:var(--font);transition:.18s;margin-bottom:${ytMatch?'6px':'0'}" onmouseover="this.style.background='rgba(124,111,247,.12)'" onmouseout="this.style.background='var(--surface2)'">
        📖 عرض تفاصيل الكورس ${steps.length?'('+steps.length+' خطوة)':''}
      </button>
      ${ytMatch?`<button onclick="toggleCourseEmbed(${c.id})" class="btn btn-ghost btn-sm" style="width:100%;font-size:11px"><i class="fa-solid fa-play"></i> معاينة يوتيوب</button><div id="cembed-${c.id}" style="display:none;margin-top:8px;border-radius:8px;overflow:hidden"><iframe src="https://www.youtube.com/embed/${ytMatch[1]}" style="width:100%;height:180px;border:none;border-radius:8px" allowfullscreen></iframe></div>`:''}
    </div>`;
  }).join('');
}

function toggleCourseEmbed(id){
  const el=document.getElementById('cembed-'+id);
  if(el) el.style.display=el.style.display==='none'?'block':'none';
}

function quickToggleStep(courseId, stepIdx){
  const c=S.courses.find(x=>x.id===courseId); if(!c||!c.steps) return;
  c.steps[stepIdx].done=!c.steps[stepIdx].done;
  const dc=c.steps.filter(s=>s.done).length;
  c.progress=Math.round((dc/c.steps.length)*100);
  if(c.progress===100) c.status='done';
  else if(dc>0) c.status='inprogress';
  lsSave(); renderCourses();
}

// ── Course Detail Full Page ──
function openCourseDetailPage(courseId){
  const c = S.courses.find(x=>x.id===courseId); if(!c) return;
  const steps = c.steps||[];
  const doneCount = steps.filter(s=>s.done).length;
  const progress = c.progress||0;
  const stColor={todo:'var(--text3)',inprogress:'var(--accent2)',done:'var(--accent3)'};
  const stLabel={todo:'<i class="fa-solid fa-clipboard-list"></i> لم أبدأ',inprogress:'<i class="fa-solid fa-bolt"></i> جاري',done:'<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> مكتمل'};
  const ytMatch = c.url&&c.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?]+)/);

  const existing = document.getElementById('_course-detail-overlay');
  if(existing) existing.remove();

  const ov = document.createElement('div');
  ov.id = '_course-detail-overlay';
  ov.style.cssText = 'position:fixed;inset:0;z-index:9000;background:var(--bg);display:flex;flex-direction:column;overflow:hidden';

  const stepsHtml = steps.map((s,i)=>`
    <div id="_cdstep-${i}" style="display:flex;align-items:center;gap:10px;padding:12px 14px;background:var(--surface);border:1px solid ${s.done?'rgba(79,209,165,.3)':'var(--border)'};border-radius:10px;transition:.18s;cursor:pointer" onclick="_openStepEditorInDetail(${courseId},${i})">
      <div class="_cs-item-check${s.done?' checked':''}" onclick="event.stopPropagation();_quickToggleStepDetail(${courseId},${i})" style="cursor:pointer;flex-shrink:0;width:22px;height:22px">
        ${s.done?'<svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round"/></svg>':''}
      </div>
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:700;${s.done?'text-decoration:line-through;color:var(--text3)':'color:var(--text)'}">${s.title||'خطوة '+(i+1)}</div>
        ${s.url?`<div style="font-size:11px;color:var(--accent3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap"><i class="fa-solid fa-link"></i> ${s.url}</div>`:''}
        ${s.notes&&s.notes!=='<p><br></p>'?`<div style="font-size:11px;color:var(--text2);margin-top:2px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical">${s.notes.replace(/<[^>]*>/g,'')}</div>`:''}
      </div>
      <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
        ${s.url?`<a href="${s.url}" target="_blank" onclick="event.stopPropagation()" style="color:var(--accent3);font-size:14px" title="فتح الرابط">↗</a>`:''}
        <span style="font-size:11px;color:var(--text3)"><i class="fa-solid fa-pen-to-square"></i> فتح</span>
      </div>
    </div>`).join('');

  ov.innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;padding:14px 20px;border-bottom:1px solid var(--border);background:var(--surface);flex-shrink:0">
      <button onclick="document.getElementById('_course-detail-overlay').remove()" style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:7px 14px;color:var(--text2);font-size:13px;font-weight:700;cursor:pointer;font-family:var(--font)">← رجوع</button>
      <div style="flex:1">
        <div style="font-size:16px;font-weight:900;color:var(--text)">${c.title}</div>
        <div style="font-size:11px;color:var(--text3)">${c.platform||''} · <span style="color:${stColor[c.status]}">${stLabel[c.status]}</span></div>
      </div>
      <div style="display:flex;gap:8px">
        <button onclick="openCourseModal(${courseId})" class="btn btn-ghost btn-sm"><i class="fa-solid fa-pen"></i> تعديل</button>
      </div>
    </div>
    <div style="flex:1;overflow-y:auto;padding:20px;max-width:800px;margin:0 auto;width:100%">
      <!-- Progress -->
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;padding:16px;background:var(--surface);border-radius:12px;border:1px solid var(--border)">
        <div style="flex:1">
          <div style="font-size:11px;color:var(--text3);margin-bottom:6px">التقدم الكلي · ${doneCount} من ${steps.length} خطوة مكتملة</div>
          <div style="height:10px;background:var(--surface3);border-radius:5px;overflow:hidden">
            <div style="height:100%;width:${progress}%;background:${progress>=100?'var(--accent3)':'var(--accent)'};border-radius:5px;transition:.4s"></div>
          </div>
        </div>
        <div style="font-size:28px;font-weight:900;color:${progress>=100?'var(--accent3)':'var(--accent)'};min-width:56px;text-align:center">${progress}%</div>
      </div>
      ${c.url&&!ytMatch?`<a href="${c.url}" target="_blank" style="display:flex;align-items:center;gap:8px;padding:10px 14px;background:rgba(79,209,165,.08);border:1px solid rgba(79,209,165,.2);border-radius:10px;color:var(--accent3);font-size:13px;font-weight:700;text-decoration:none;margin-bottom:16px">↗ فتح الكورس الرئيسي</a>`:''}
      ${ytMatch?`<div style="border-radius:10px;overflow:hidden;margin-bottom:16px"><iframe src="https://www.youtube.com/embed/${ytMatch[1]}" style="width:100%;height:220px;border:none" allowfullscreen></iframe></div>`:''}
      ${c.notes?`<div style="padding:12px 16px;background:var(--surface2);border-radius:10px;font-size:13px;line-height:1.7;color:var(--text2);margin-bottom:16px">${c.notes}</div>`:''}
      <!-- Steps list -->
      ${steps.length?`
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <div style="font-size:13px;font-weight:800;color:var(--text2)"><i class="fa-solid fa-clipboard-list"></i> خطوات المنهج (${doneCount}/${steps.length})</div>
          <button onclick="openCourseModal(${courseId})" style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:5px 12px;font-size:11px;color:var(--accent);cursor:pointer;font-family:var(--font)">+ تعديل الخطوات</button>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px" id="_cd-steps-list">
          ${stepsHtml}
        </div>` : `<div class="empty card" style="text-align:center;padding:30px"><div class="empty-icon"><i class="fa-solid fa-clipboard-list"></i></div><div style="margin-bottom:12px">لم تضف خطوات بعد</div><button onclick="openCourseModal(${courseId})" class="btn btn-primary">+ إضافة خطوات</button></div>`}
    </div>
    <!-- Step editor panel (inside detail page) -->
    <div id="_cd-step-editor" style="display:none;position:absolute;inset:0;background:var(--bg);z-index:10;flex-direction:column"></div>
  `;
  document.body.appendChild(ov);
  window._currentDetailCourseId = courseId;
}

function _quickToggleStepDetail(courseId, stepIdx){
  const c=S.courses.find(x=>x.id===courseId); if(!c||!c.steps) return;
  c.steps[stepIdx].done=!c.steps[stepIdx].done;
  const dc=c.steps.filter(s=>s.done).length;
  c.progress=Math.round((dc/c.steps.length)*100);
  if(c.progress===100) c.status='done'; else if(dc>0) c.status='inprogress';
  lsSave();
  // Refresh just this step UI
  const stepEl = document.getElementById('_cdstep-'+stepIdx); if(!stepEl) return;
  const s = c.steps[stepIdx];
  stepEl.style.borderColor = s.done?'rgba(79,209,165,.3)':'var(--border)';
  const check = stepEl.querySelector('._cs-item-check');
  if(check){ check.className='_cs-item-check'+(s.done?' checked':''); check.innerHTML=s.done?'<svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round"/></svg>':''; }
  renderCourses();
}

function _openStepEditorInDetail(courseId, stepIdx){
  const c=S.courses.find(x=>x.id===courseId); if(!c||!c.steps) return;
  const s=c.steps[stepIdx];
  const panel = document.getElementById('_cd-step-editor'); if(!panel) return;

  panel.innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;padding:12px 18px;border-bottom:1px solid var(--border);background:var(--surface);flex-shrink:0">
      <button onclick="document.getElementById('_cd-step-editor').style.display='none'" style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:6px 12px;font-size:12px;font-weight:700;cursor:pointer;font-family:var(--font);color:var(--text2)">← رجوع</button>
      <div style="flex:1">
        <input id="_se-title" value="${(s.title||'').replace(/"/g,'&quot;')}" style="background:transparent;border:none;font-size:15px;font-weight:800;color:var(--text);font-family:var(--font);width:100%;outline:none" placeholder="عنوان الخطوة">
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;color:var(--text2)">
          <div id="_se-done-chk" onclick="this.dataset.done=this.dataset.done==='1'?'0':'1';this.style.background=this.dataset.done==='1'?'var(--accent3)':'transparent';this.style.borderColor=this.dataset.done==='1'?'var(--accent3)':'var(--border)';this.innerHTML=this.dataset.done==='1'?'<svg width=\\'12\\' height=\\'12\\' viewBox=\\'0 0 12 12\\'><path d=\\'M2 6l3 3 5-5\\' stroke=\\'#fff\\' stroke-width=\\'2.2\\' fill=\\'none\\' stroke-linecap=\\'round\\'/></svg>':''" 
               data-done="${s.done?'1':'0'}"
               style="width:22px;height:22px;border-radius:6px;border:2px solid ${s.done?'var(--accent3)':'var(--border)'};background:${s.done?'var(--accent3)':'transparent'};display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0">
            ${s.done?'<svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round"/></svg>':''}
          </div>مكتملة
        </label>
        <button onclick="_saveStepFromDetail(${courseId},${stepIdx})" style="background:var(--accent);color:#fff;border:none;border-radius:9px;padding:8px 18px;font-size:13px;font-weight:700;cursor:pointer;font-family:var(--font)" data-i18n="btn_save"><i class="fa-solid fa-floppy-disk" style="margin-left:4px"></i> حفظ</button>
      </div>
    </div>
    <div style="padding:12px 18px;background:var(--surface);border-bottom:1px solid var(--border);flex-shrink:0">
      <input id="_se-url" value="${(s.url||'').replace(/"/g,'&quot;')}" style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:8px 12px;font-size:12px;color:var(--accent3);font-family:var(--mono);width:100%;outline:none;box-sizing:border-box" placeholder="🔗 رابط الخطوة (اختياري)">
    </div>
    <!-- Quill Editor -->
    <div style="flex:1;overflow-y:auto;display:flex;flex-direction:column">
      <div id="_se-quill-toolbar" style="border:none;border-bottom:1px solid var(--border);background:var(--surface2)">
        <span class="ql-formats"><button class="ql-bold"></button><button class="ql-italic"></button><button class="ql-underline"></button><button class="ql-strike"></button></span>
        <span class="ql-formats"><select class="ql-header"><option selected></option><option value="2"></option><option value="3"></option></select></span>
        <span class="ql-formats"><button class="ql-list" value="ordered"></button><button class="ql-list" value="bullet"></button></span>
        <span class="ql-formats"><button class="ql-blockquote"></button><button class="ql-code-block"></button></span>
        <span class="ql-formats"><button class="ql-link"></button><button class="ql-image"></button></span>
        <span class="ql-formats"><select class="ql-color"></select></span>
        <span class="ql-formats"><button class="ql-clean"></button></span>
      </div>
      <div id="_se-quill-container" style="flex:1;font-size:14px;line-height:1.8"></div>
    </div>
  `;
  panel.style.display = 'flex';

  // Init Quill
  if(typeof Quill !== 'undefined'){
    window._stepDetailQuill = new Quill('#_se-quill-container', {
      theme: 'snow',
      modules: { toolbar: '#_se-quill-toolbar' },
      placeholder: 'اكتب ملاحظاتك، ما تعلمته، روابط إضافية، صور...'
    });
    window._stepDetailQuill.root.setAttribute('dir','rtl');
    window._stepDetailQuill.root.style.minHeight = '300px';
    window._stepDetailQuill.root.style.fontSize  = '14px';
    window._stepDetailQuill.root.style.fontFamily = 'var(--font)';
    if(s.notes) window._stepDetailQuill.clipboard.dangerouslyPasteHTML(s.notes);
  }
  window._seCurrentCourseId  = courseId;
  window._seCurrentStepIdx   = stepIdx;
}

function _saveStepFromDetail(courseId, stepIdx){
  const c=S.courses.find(x=>x.id===courseId); if(!c||!c.steps) return;
  const s=c.steps[stepIdx];
  s.title = document.getElementById('_se-title')?.value.trim() || s.title;
  s.url   = document.getElementById('_se-url')?.value.trim() || '';
  const doneChk = document.getElementById('_se-done-chk');
  s.done  = doneChk ? doneChk.dataset.done === '1' : s.done;
  if(window._stepDetailQuill){
    const html = window._stepDetailQuill.root.innerHTML;
    s.notes = (html === '<p><br></p>' || html === '<p></p>') ? '' : html;
  }
  const dc=c.steps.filter(x=>x.done).length;
  c.progress=Math.round((dc/c.steps.length)*100);
  if(c.progress===100) c.status='done'; else if(dc>0) c.status='inprogress';
  lsSave();
  if(typeof showMiniNotif==='function') showMiniNotif('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم حفظ الخطوة');
  document.getElementById('_cd-step-editor').style.display='none';
  // Refresh detail page
  openCourseDetailPage(courseId);
  renderCourses();
}

// ── Step editor from modal (uses Quill) ──
var _editingCourseSteps = [];
var _stepDetailCourseId = null;
var _stepDetailStepIdx  = null;
var _stepQuill = null;

function openCourseModal(id){
  document.getElementById('course-modal-title').innerHTML = id ? '<i class="fa-solid fa-pen"></i> تعديل الكورس' : '<i class="fa-solid fa-graduation-cap"></i> إضافة كورس / مادة تعليمية';
  document.getElementById('course-eid').value = id||'';
  _editingCourseSteps = [];
  if(id){
    const c=S.courses.find(x=>x.id===id); if(!c) return;
    document.getElementById('course-title').value    = c.title||'';
    document.getElementById('course-type').value     = c.type||'video';
    document.getElementById('course-status').value   = c.status||'todo';
    document.getElementById('course-url').value      = c.url||'';
    document.getElementById('course-platform').value = c.platform||'';
    document.getElementById('course-notes').value    = c.notes||'';
    _editingCourseSteps = (c.steps||[]).map(s=>({...s}));
    previewCourseEmbed();
  } else {
    ['course-title','course-url','course-platform','course-notes'].forEach(f=>{
      const e=document.getElementById(f);if(e)e.value='';
    });
    const ep=document.getElementById('course-embed-preview');
    if(ep) ep.style.display='none';
  }
  _renderModalSteps();
  openM('modal-course');
}

function _renderModalSteps(){
  const el=document.getElementById('course-steps-list'); if(!el) return;
  const steps=_editingCourseSteps;
  const info=document.getElementById('course-steps-progress-info');
  if(!steps.length){
    el.innerHTML='<div style="text-align:center;padding:14px;color:var(--text3);font-size:12px;border:1.5px dashed var(--border);border-radius:10px">لا خطوات — اضغط "خطوة جديدة"</div>';
    if(info) info.textContent=''; return;
  }
  const dc=steps.filter(s=>s.done).length;
  const pct=Math.round((dc/steps.length)*100);
  if(info) info.innerHTML=`<span style="color:var(--accent3);font-weight:700">${dc}</span>/${steps.length} مكتملة · <span style="color:var(--accent);font-weight:700">${pct}%</span>`;
  el.innerHTML=steps.map((s,i)=>`
    <div class="_cs-item${s.done?' done':''}" style="border-color:${s.done?'rgba(79,209,165,.3)':'var(--border)'}">
      <div class="_cs-item-check${s.done?' checked':''}" onclick="_toggleModalStep(${i})" style="cursor:pointer"></div>
      <div style="flex:1;min-width:0;cursor:pointer" onclick="_toggleModalStep(${i})">
        <div style="font-size:13px;font-weight:600;${s.done?'text-decoration:line-through;color:var(--text3)':'color:var(--text)'}">${s.title||'<span style="color:var(--text3)">بدون عنوان</span>'}</div>
        ${s.url?`<div style="font-size:11px;color:var(--accent3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap"><i class="fa-solid fa-link"></i> ${s.url}</div>`:''}
      </div>
      <div style="display:flex;gap:4px;flex-shrink:0">
        <button onclick="editCourseStepFromModal(${i})" style="background:var(--surface3);border:1px solid var(--border);border-radius:7px;padding:4px 9px;font-size:11px;color:var(--text2);cursor:pointer;font-family:var(--font)"><i class="fa-solid fa-pen"></i></button>
        <button onclick="_moveStep(${i},-1)" style="background:var(--surface3);border:1px solid var(--border);border-radius:7px;padding:4px 7px;font-size:11px;color:var(--text2);cursor:pointer">${i===0?'':' ↑'}</button>
        <button onclick="_moveStep(${i},1)" style="background:var(--surface3);border:1px solid var(--border);border-radius:7px;padding:4px 7px;font-size:11px;color:var(--text2);cursor:pointer">${i===steps.length-1?'':'↓'}</button>
        <button onclick="_removeModalStep(${i})" style="background:transparent;border:none;color:var(--accent4);font-size:13px;cursor:pointer;padding:4px 6px"><i class="fa-solid fa-xmark"></i></button>
      </div>
    </div>`).join('');
}

function _toggleModalStep(i){ _editingCourseSteps[i].done=!_editingCourseSteps[i].done; _renderModalSteps(); }
function _removeModalStep(i){ _editingCourseSteps.splice(i,1); _renderModalSteps(); }
function _moveStep(i,dir){ const j=i+dir; if(j<0||j>=_editingCourseSteps.length)return; [_editingCourseSteps[i],_editingCourseSteps[j]]=[_editingCourseSteps[j],_editingCourseSteps[i]]; _renderModalSteps(); }

function addCourseStep(){
  const title=prompt('عنوان الخطوة / الحلقة:',''); if(title===null) return;
  const url=prompt('رابط الخطوة (اختياري):','');
  _editingCourseSteps.push({id:Date.now(),title:title.trim(),url:(url||'').trim(),done:false,notes:''});
  _renderModalSteps();
}

function editCourseStepFromModal(i){
  // open inline simple edit
  const s=_editingCourseSteps[i];
  const newTitle=prompt('عنوان الخطوة:',s.title||''); if(newTitle===null)return;
  const newUrl=prompt('الرابط:',s.url||''); if(newUrl===null)return;
  _editingCourseSteps[i].title=newTitle.trim();
  _editingCourseSteps[i].url=(newUrl||'').trim();
  _renderModalSteps();
}

function saveCourse(){
  const title=document.getElementById('course-title')?.value.trim(); if(!title)return alert('أدخل عنوان الكورس');
  const eid=document.getElementById('course-eid')?.value;
  const steps=_editingCourseSteps.map(s=>({...s}));
  const dc=steps.filter(s=>s.done).length;
  const progress=steps.length?Math.round((dc/steps.length)*100):0;
  const d={
    id:eid?+eid:Date.now(), title,
    type:document.getElementById('course-type')?.value||'video',
    status:document.getElementById('course-status')?.value||'todo',
    url:document.getElementById('course-url')?.value||'',
    progress, platform:document.getElementById('course-platform')?.value||'',
    notes:document.getElementById('course-notes')?.value||'', steps
  };
  if(eid){const idx=S.courses.findIndex(c=>c.id===+eid);if(idx>-1)S.courses[idx]=d;}
  else S.courses.push(d);
  lsSave(); closeM('modal-course'); renderCourses();
  if(typeof showMiniNotif==='function') showMiniNotif('<i class="fa-solid fa-square-check" style="color:var(--accent3)"></i> تم حفظ الكورس: '+title);
}

