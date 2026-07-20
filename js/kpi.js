// ============================================================
// kpi.js — Halaman KPI (Input Data + placeholder 3 tab lain)
// Tab Ritase/Day, Waktu Stay, Waktu Loading menunggu Code.gs
// dari user (fungsi trigger tombol sudah pernah dibuat user).
// ============================================================

var KPI_COLS = [
    {key:'no_document'},
    {key:'no_kartu'},
    {key:'tipe_aktivitas'},
    {key:'tanggal_tiba'},
    {key:'jam_tiba'},
    {key:'plant_penerima'},
    {key:'nama_cabang_penerima'},
    {key:'plant_pengirim'},
    {key:'nama_plant_pengirim'},
    {key:'no_referensi'},
    {key:'tipe_material'},
    {key:'tanggal_do'},
    {key:'tanggal_gi'},
    {key:'ekspedisi'},
    {key:'no_mobil'},
    {key:'jenis_mobil'},
    {key:'ldp'},
    {key:'tanggal_estimasi_tiba'},
    {key:'division_code'},
    {key:'division_name'},
    {key:'qty'},
    {key:'aktivitas_terakhir'},
    {key:'tanggal_mulai_bongkar'},
    {key:'mulai_bongkar'},
    {key:'tanggal_selesai_bongkar'},
    {key:'selesai_bongkar'},
    {key:'tanggal_keluar'},
    {key:'jam_keluar'},
    {key:'lama_antri'},
    {key:'durasi_loading'},
    {key:'durasi_truck_inout'},
    {key:'pending_bongkar'}
  ];
  var KPI_NCOLS = KPI_COLS.length; // 32 kolom (A-AF)

  var _kpiZoom = 100;
  var _kpiSel  = {r1:-1,c1:-1,r2:-1,c2:-1};
  var _kpiDrag = false;

  // ── Warna grading A-E ──
  var KPI_GRADE_COLOR = {A:'#00b050',B:'#0066ff',C:'#ffd400',D:'#ff9900',E:'#ff0000'};
  function _kpiGradeBadge(g){
    var col = KPI_GRADE_COLOR[g] || '#a0aec0';
    var txtCol = (g==='C') ? '#7a5c00' : '#fff';
    return '<span style="display:inline-block;padding:3px 12px;border-radius:20px;background:'+col+';color:'+txtCol+';font-weight:800;font-size:13px;">'+(g||'-')+'</span>';
  }
  function _kpiFmtMin(min){
    if(min===null||min===undefined||isNaN(min)) return '-';
    var h=Math.floor(min/60), m=Math.round(min%60);
    return h+' JAM '+m+' MENIT';
  }

  var _kpiRitaseMode = 'all';

  function kpiInitPage(){
    var today=new Date();
    var yyyy=today.getFullYear();
    var mm=String(today.getMonth()+1).padStart(2,'0');
    var dd=String(today.getDate()).padStart(2,'0');
    var ymd=yyyy+'-'+mm+'-'+dd;
    var ymFrom=yyyy+'-'+mm+'-01';
    var el=document.getElementById('kpiMetaTanggal'); if(el&&!el.value) el.value=ymd;
    var elF=document.getElementById('kpiFilterFrom'); if(elF&&!elF.value) elF.value=ymFrom;
    var elT=document.getElementById('kpiFilterTo');   if(elT&&!elT.value) elT.value=ymd;
    if(_kpiTbody().rows.length===0) kpiInitRows(20);
    _kpiBindEvents();
    kpiSwitchTab('input');
  }

  function kpiLoadFilters(){
    var f = document.getElementById('kpiFilterFrom');
    var t = document.getElementById('kpiFilterTo');
    return {from: f?f.value:'', to: t?t.value:''};
  }

  function kpiTampilkan(){
    var tab = window._kpiActiveTab || 'ritase';
    if(tab==='ritase')  kpiLoadRitase();
    if(tab==='stay')    kpiLoadStay();
    if(tab==='loading') kpiLoadLoading();
  }

  function kpiToggleRitaseMode(mode){
    _kpiRitaseMode = mode;
    var bAll=document.getElementById('kpiRitaseModeAll');
    var bBa =document.getElementById('kpiRitaseModeBa');
    if(bAll) bAll.style.background = mode==='all' ? '#2c5364' : '#fff';
    if(bAll) bAll.style.color      = mode==='all' ? '#fff'    : '#4a5568';
    if(bBa)  bBa.style.background  = mode==='by_ba' ? '#2c5364' : '#fff';
    if(bBa)  bBa.style.color       = mode==='by_ba' ? '#fff'    : '#4a5568';
    kpiLoadRitase();
  }

  function kpiLoadRitase(){
    var f=kpiLoadFilters();
    var pane=document.getElementById('kpiRitasePane');
    if(pane) pane.innerHTML='<div style="text-align:center;padding:60px;color:#a0aec0;"><i class="fas fa-spinner fa-spin" style="font-size:24px;"></i></div>';
    google.script.run
      .withSuccessHandler(function(res){ _kpiRenderRitase(res); })
      .withFailureHandler(function(err){ if(pane) pane.innerHTML='<div style="text-align:center;padding:40px;color:#e53e3e;">Error: '+err.message+'</div>'; })
      .getKpiRitaseSummary(f.from, f.to, _kpiRitaseMode);
  }

  function _kpiRenderRitase(res){
    var pane=document.getElementById('kpiRitasePane');
    if(!pane) return;
    if(!res||!res.success){ pane.innerHTML='<div style="text-align:center;padding:40px;color:#e53e3e;">'+(res?res.message:'Gagal memuat')+'</div>'; return; }
    var list=res.perTanggal||[];
    var html='';
    html+='<div style="display:flex;gap:10px;align-items:center;margin:14px 0;">'
        +'<button id="kpiRitaseModeAll" onclick="kpiToggleRitaseMode(\'all\')" style="padding:6px 16px;border-radius:20px;border:1px solid #cbd5e0;cursor:pointer;font-size:12px;font-weight:700;background:'+(_kpiRitaseMode==='all'?'#2c5364':'#fff')+';color:'+(_kpiRitaseMode==='all'?'#fff':'#4a5568')+';">Semua Mobil</button>'
        +'<button id="kpiRitaseModeBa" onclick="kpiToggleRitaseMode(\'by_ba\')" style="padding:6px 16px;border-radius:20px;border:1px solid #cbd5e0;cursor:pointer;font-size:12px;font-weight:700;background:'+(_kpiRitaseMode==='by_ba'?'#2c5364':'#fff')+';color:'+(_kpiRitaseMode==='by_ba'?'#fff':'#4a5568')+';">By NOPOL BA</button>'
        +'</div>';
    html+='<div style="background:#fff;border-radius:12px;padding:18px;margin-bottom:16px;box-shadow:0 1px 3px rgba(0,0,0,.08);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">'
        +'<div><div style="font-size:12px;color:#718096;font-weight:700;text-transform:uppercase;">Rata-rata Ritase/Mobil (Global)</div>'
        +'<div style="font-size:28px;font-weight:800;color:#2c5364;">'+(res.grandAvg||0).toFixed(2)+'</div></div>'
        +'<div>'+_kpiGradeBadge(res.grandGrade)+'</div>'
        +'<div style="font-size:12px;color:#718096;">Total Ritase: <b>'+res.grandTotal+'</b> &nbsp;|&nbsp; Total Mobil: <b>'+res.grandUnik+'</b></div>'
        +'</div>';
    if(!list.length){
      html+='<div style="text-align:center;padding:40px;color:#a0aec0;">Tidak ada data untuk rentang tanggal ini</div>';
    } else {
      html+='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px;">';
      list.forEach(function(d){
        html+='<div style="background:#fff;border-radius:10px;padding:14px;box-shadow:0 1px 3px rgba(0,0,0,.08);">'
            +'<div style="font-size:12px;font-weight:700;color:#2c5364;margin-bottom:8px;">'+_kpiEsc(d.tanggal)+'</div>'
            +'<div style="font-size:11px;color:#718096;margin-bottom:6px;">Total: <b>'+d.total+'</b> | Unik: <b>'+d.unik+'</b> | Avg: <b>'+d.avgRitase.toFixed(2)+'</b></div>'
            +'<div style="font-size:11px;line-height:1.8;">'+d.mobilList.map(function(m){ return _kpiEsc(m.mobil)+' <span style="color:#a0aec0;">('+m.count+')</span>'; }).join('<br>')+'</div>'
            +'</div>';
      });
      html+='</div>';
    }
    pane.innerHTML=html;
  }

  function kpiLoadStay(){
    var f=kpiLoadFilters();
    var pane=document.getElementById('kpiStayPane');
    if(pane) pane.innerHTML='<div style="text-align:center;padding:60px;color:#a0aec0;"><i class="fas fa-spinner fa-spin" style="font-size:24px;"></i></div>';
    google.script.run
      .withSuccessHandler(function(res){ _kpiRenderPlantSummary(res,'kpiStayPane','Waktu Stay'); })
      .withFailureHandler(function(err){ if(pane) pane.innerHTML='<div style="text-align:center;padding:40px;color:#e53e3e;">Error: '+err.message+'</div>'; })
      .getKpiStaySummary(f.from, f.to);
  }

  function kpiLoadLoading(){
    var f=kpiLoadFilters();
    var pane=document.getElementById('kpiLoadingPane');
    if(pane) pane.innerHTML='<div style="text-align:center;padding:60px;color:#a0aec0;"><i class="fas fa-spinner fa-spin" style="font-size:24px;"></i></div>';
    google.script.run
      .withSuccessHandler(function(res){ _kpiRenderPlantSummary(res,'kpiLoadingPane','Waktu Loading'); })
      .withFailureHandler(function(err){ if(pane) pane.innerHTML='<div style="text-align:center;padding:40px;color:#e53e3e;">Error: '+err.message+'</div>'; })
      .getKpiLoadingSummary(f.from, f.to);
  }

  function _kpiRenderPlantSummary(res, paneId, title){
    var pane=document.getElementById(paneId);
    if(!pane) return;
    if(!res||!res.success){ pane.innerHTML='<div style="text-align:center;padding:40px;color:#e53e3e;">'+(res?res.message:'Gagal memuat')+'</div>'; return; }
    var list=res.perPlant||[];
    var html='';
    html+='<div style="background:#fff;border-radius:12px;padding:18px;margin:14px 0 16px;box-shadow:0 1px 3px rgba(0,0,0,.08);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">'
        +'<div><div style="font-size:12px;color:#718096;font-weight:700;text-transform:uppercase;">Rata-rata '+title+' (Global)</div>'
        +'<div style="font-size:28px;font-weight:800;color:#2c5364;">'+_kpiFmtMin(res.globalAvg)+'</div></div>'
        +'<div>'+_kpiGradeBadge(res.globalGrade)+'</div>'
        +'<div style="font-size:12px;color:#718096;">Jumlah Data: <b>'+res.globalCount+'</b></div>'
        +'</div>';
    if(!list.length){
      html+='<div style="text-align:center;padding:40px;color:#a0aec0;">Tidak ada data untuk rentang tanggal ini</div>';
    } else {
      html+='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;">';
      list.forEach(function(p){
        html+='<div style="background:#fff;border-radius:10px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,.08);text-align:center;">'
            +'<div style="font-size:12px;font-weight:700;color:#718096;text-transform:uppercase;margin-bottom:8px;">Plant '+_kpiEsc(p.plant)+'</div>'
            +'<div style="font-size:20px;font-weight:800;color:#2c5364;margin-bottom:8px;">'+_kpiFmtMin(p.avgMinutes)+'</div>'
            +_kpiGradeBadge(p.grade)
            +'<div style="font-size:11px;color:#a0aec0;margin-top:8px;">'+p.count+' data</div>'
            +'</div>';
      });
      html+='</div>';
    }
    pane.innerHTML=html;
  }

  function _kpiEsc(s){
    return String(s==null?'':s).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }

  function kpiSwitchTab(tab){
    window._kpiActiveTab = tab;
    var panes={
      ritase:  document.getElementById('kpiRitasePane'),
      stay:    document.getElementById('kpiStayPane'),
      loading: document.getElementById('kpiLoadingPane'),
      input:   document.getElementById('kpiInputPane')
    };
    var btns={
      ritase:  document.getElementById('kpiTabRitase'),
      stay:    document.getElementById('kpiTabStay'),
      loading: document.getElementById('kpiTabLoading'),
      input:   document.getElementById('kpiTabInput')
    };
    Object.keys(panes).forEach(function(k){
      if(panes[k]) panes[k].style.display = (k===tab) ? 'block' : 'none';
      if(btns[k]){
        btns[k].style.color = (k===tab) ? '#2c5364' : '#718096';
        btns[k].style.borderBottomColor = (k===tab) ? '#2c5364' : 'transparent';
      }
    });
    var filterBar = document.getElementById('kpiFilterBar');
    if(filterBar) filterBar.style.display = (tab==='input') ? 'none' : 'flex';
    // Auto-load saat pertama kali buka tab report (kalau belum pernah dimuat)
    if(tab==='ritase'  && !window._kpiRitaseLoaded)  { window._kpiRitaseLoaded=true;  kpiLoadRitase(); }
    if(tab==='stay'    && !window._kpiStayLoaded)    { window._kpiStayLoaded=true;    kpiLoadStay(); }
    if(tab==='loading' && !window._kpiLoadingLoaded) { window._kpiLoadingLoaded=true; kpiLoadLoading(); }
  }

  // ── Helpers ──
  function _kpiTbody(){ return document.getElementById('kpiInputTbody'); }
  function _kpiTbl()  { return document.getElementById('kpiInputTbl'); }

  function _kpiAllTds(){
    var trs = Array.prototype.slice.call(_kpiTbody().querySelectorAll('tr'));
    return trs.map(function(tr){
      return KPI_COLS.map(function(col){ return tr.querySelector('[data-key="'+col.key+'"]'); });
    });
  }
  function _kpiTrIdx(tr){ return Array.prototype.slice.call(_kpiTbody().querySelectorAll('tr')).indexOf(tr); }
  function _kpiTcIdx(td){
    var k=td.getAttribute('data-key');
    for(var i=0;i<KPI_COLS.length;i++){ if(KPI_COLS[i].key===k) return i; }
    return -1;
  }
  function _kpiFocus(ri,ci){
    var grid=_kpiAllTds(), nRows=grid.length;
    ri=Math.max(0,Math.min(nRows-1,ri));
    ci=Math.max(0,Math.min(KPI_NCOLS-1,ci));
    var td=grid[ri]&&grid[ri][ci];
    if(td&&td.contentEditable==='true'){ td.focus(); td.scrollIntoView&&td.scrollIntoView({block:'nearest',inline:'nearest'}); }
  }
  function _kpiClearSel(){
    document.querySelectorAll('#kpiInputTbl .kpi-sel').forEach(function(el){ el.classList.remove('kpi-sel'); });
    _kpiSel={r1:-1,c1:-1,r2:-1,c2:-1};
  }
  function _kpiApplySel(){
    document.querySelectorAll('#kpiInputTbl .kpi-sel').forEach(function(el){ el.classList.remove('kpi-sel'); });
    if(_kpiSel.r1<0) return;
    var trs=Array.prototype.slice.call(_kpiTbody().querySelectorAll('tr'));
    var r1=Math.min(_kpiSel.r1,_kpiSel.r2), r2=Math.max(_kpiSel.r1,_kpiSel.r2);
    var c1=Math.min(_kpiSel.c1,_kpiSel.c2), c2=Math.max(_kpiSel.c1,_kpiSel.c2);
    for(var r=r1;r<=r2;r++){
      if(!trs[r]) continue;
      for(var ci=c1;ci<=c2;ci++){
        var td=trs[r].querySelector('[data-key="'+KPI_COLS[ci].key+'"]');
        if(td) td.classList.add('kpi-sel');
      }
    }
  }
  function _kpiCopyBlock(){
    var trs=Array.prototype.slice.call(_kpiTbody().querySelectorAll('tr'));
    var r1=Math.min(_kpiSel.r1,_kpiSel.r2), r2=Math.max(_kpiSel.r1,_kpiSel.r2);
    var c1=Math.min(_kpiSel.c1,_kpiSel.c2), c2=Math.max(_kpiSel.c1,_kpiSel.c2);
    var lines=[];
    for(var r=r1;r<=r2;r++){
      if(!trs[r]) continue;
      var cells=[];
      for(var ci=c1;ci<=c2;ci++){
        var td=trs[r].querySelector('[data-key="'+KPI_COLS[ci].key+'"]');
        cells.push(td?td.textContent.trim():'');
      }
      lines.push(cells.join('\t'));
    }
    var text=lines.join('\n');
    if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(text);
  }

  function kpiInitRows(n){ for(var i=0;i<n;i++) _kpiAppendRow({}); kpiUpdateRowCount(); }
  function kpiAddRows(n) { for(var i=0;i<n;i++) _kpiAppendRow({}); kpiUpdateRowCount(); }

  function _kpiAppendRow(data){
    var tbody=_kpiTbody();
    var rowIdx=tbody.rows.length+1;
    var tr=document.createElement('tr');

    var tdNo=document.createElement('td');
    tdNo.className='td-no'; tdNo.textContent=rowIdx;
    tdNo.style.cssText='text-align:center;color:#a0aec0;font-size:11px;font-weight:700;background:#f8fafc;width:32px;user-select:none;';
    tr.appendChild(tdNo);

    // Kolom yang butuh garis pemisah tebal (batas grup logis) — dokumen | plant | material | mobil | waktu bongkar | waktu keluar
    var kpiGrpSepKeys = {tanggal_tiba:1, no_referensi:1, jenis_mobil:1, qty:1, tanggal_mulai_bongkar:1, tanggal_keluar:1};
    // Kolom tanggal — lebih sempit dari kolom teks bebas
    var kpiDateKeys = {tanggal_tiba:1, tanggal_do:1, tanggal_gi:1, tanggal_estimasi_tiba:1,
                        tanggal_mulai_bongkar:1, tanggal_selesai_bongkar:1, tanggal_keluar:1};
    // Kolom angka pendek
    var kpiNumKeys = {qty:1, lama_antri:1, durasi_loading:1, durasi_truck_inout:1};

    KPI_COLS.forEach(function(col){
      var td=document.createElement('td');
      td.setAttribute('data-key',col.key);
      td.contentEditable='true';
      td.style.padding='6px 8px';
      td.style.fontSize='12px';
      if(kpiDateKeys[col.key])      td.style.minWidth='95px';
      else if(kpiNumKeys[col.key])  td.style.minWidth='75px';
      else                          td.style.minWidth='130px';
      if(kpiGrpSepKeys[col.key]){
        td.style.borderRight='2px solid #cbd5e0';
      }
      if(data[col.key]) td.textContent=data[col.key];

      td.addEventListener('focus', function(){
        if(_kpiDrag){ td.blur(); return; }
        td.style.outline='2px solid #3182ce';
        td.style.outlineOffset='-2px';
        td._kpiOvr=true;
      });
      td.addEventListener('blur', function(){
        td.style.outline=''; td.style.outlineOffset='';
      });

      td.addEventListener('keydown', function(e){
        var allTrs=Array.prototype.slice.call(_kpiTbody().querySelectorAll('tr'));
        var ri=allTrs.indexOf(tr);
        var ci=_kpiTcIdx(td);

        if(e.key==='Tab'){
          e.preventDefault();
          if(e.shiftKey){
            if(ci>0) _kpiFocus(ri,ci-1); else if(ri>0) _kpiFocus(ri-1,KPI_NCOLS-1);
          } else {
            if(ci<KPI_NCOLS-1) _kpiFocus(ri,ci+1); else { if(ri>=allTrs.length-1) _kpiAppendRow({}); kpiUpdateRowCount(); _kpiFocus(ri+1,0); }
          }
          return;
        }
        if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); if(ri>=allTrs.length-1){ _kpiAppendRow({}); kpiUpdateRowCount(); } _kpiFocus(ri+1,ci); return; }
        if(e.key==='Delete'){ e.preventDefault(); td.textContent=''; return; }

        var special=e.key.length>1||e.ctrlKey||e.metaKey||e.altKey;
        if(!special&&td._kpiOvr){ td.textContent=''; td._kpiOvr=false; }

        if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].indexOf(e.key)<0) return;
        e.preventDefault();
        var nr=ri, nc=ci;
        if(e.key==='ArrowUp')    nr--;
        if(e.key==='ArrowDown')  nr++;
        if(e.key==='ArrowLeft')  nc--;
        if(e.key==='ArrowRight') nc++;
        if(e.shiftKey){
          if(_kpiSel.r1<0) _kpiSel={r1:ri,c1:ci,r2:ri,c2:ci};
          nr=Math.max(0,Math.min(allTrs.length-1,nr));
          nc=Math.max(0,Math.min(KPI_NCOLS-1,nc));
          _kpiSel.r2=nr; _kpiSel.c2=nc;
          _kpiApplySel();
          var tgt=allTrs[nr]&&allTrs[nr].querySelector('[data-key="'+KPI_COLS[nc].key+'"]');
          if(tgt) setTimeout(function(){ tgt.focus(); tgt.scrollIntoView&&tgt.scrollIntoView({block:'nearest',inline:'nearest'}); },0);
          return;
        }
        _kpiClearSel();
        if(nc<0){ nc=KPI_NCOLS-1; nr--; }
        if(nc>=KPI_NCOLS){ nc=0; nr++; }
        if(nr>=allTrs.length){ _kpiAppendRow({}); kpiUpdateRowCount(); allTrs=Array.prototype.slice.call(_kpiTbody().querySelectorAll('tr')); }
        nr=Math.max(0,Math.min(allTrs.length-1,nr));
        _kpiSel={r1:nr,c1:nc,r2:nr,c2:nc};
        _kpiFocus(nr,nc);
      });

      tr.appendChild(td);
    });

    var tdDel=document.createElement('td');
    tdDel.style.cssText='width:28px;text-align:center;cursor:pointer;color:#cbd5e0;font-size:13px;padding:4px;';
    tdDel.innerHTML='&#10005;';
    tdDel.addEventListener('mouseenter',function(){ this.style.color='#e53e3e'; });
    tdDel.addEventListener('mouseleave',function(){ this.style.color='#cbd5e0'; });
    tdDel.addEventListener('click',function(){ tr.parentNode&&tr.parentNode.removeChild(tr); _kpiRenumber(); kpiUpdateRowCount(); });
    tr.appendChild(tdDel);

    if((rowIdx-1)%2===1) tr.style.background='#f8fafc';
    tbody.appendChild(tr);
  }

  function _kpiRenumber(){
    var rows=_kpiTbody().querySelectorAll('tr');
    for(var i=0;i<rows.length;i++){ var td=rows[i].querySelector('.td-no'); if(td) td.textContent=i+1; }
  }
  function kpiUpdateRowCount(){
    var el=document.getElementById('kpiRowCount');
    if(el) el.textContent=_kpiTbody().rows.length+' BARIS';
  }
  function kpiClearTable(){
    _kpiTbody().innerHTML=''; kpiInitRows(20); _kpiClearSel();
  }

  function kpiZoom(delta){
    _kpiZoom=Math.min(150,Math.max(60,_kpiZoom+delta));
    var t=_kpiTbl(); if(t) t.style.fontSize=(_kpiZoom/100*12)+'px';
    var l=document.getElementById('kpiZoomLabel'); if(l) l.textContent=_kpiZoom+'%';
  }
  function kpiZoomReset(){
    _kpiZoom=100; var t=_kpiTbl(); if(t) t.style.fontSize='';
    var l=document.getElementById('kpiZoomLabel'); if(l) l.textContent='100%';
  }

  var _kpiEventsBound=false;
  function _kpiBindEvents(){
    if(_kpiEventsBound) return; _kpiEventsBound=true;
    var tbl=_kpiTbl();

    tbl.addEventListener('mousedown',function(e){
      var td=e.target.closest('[data-key]');
      if(!td||!td.closest('#kpiInputTbody')||!td.contentEditable==='true') return;
      var ri=_kpiTrIdx(td.closest('tr')), ci=_kpiTcIdx(td);
      if(ci<0) return;
      var sx=e.clientX, sy=e.clientY, moved=false;

      if(e.shiftKey&&_kpiSel.r1>=0){ e.preventDefault(); _kpiSel.r2=ri; _kpiSel.c2=ci; _kpiApplySel(); return; }
      _kpiSel={r1:ri,c1:ci,r2:ri,c2:ci};

      function onMove(ev){
        if(!moved&&(Math.abs(ev.clientX-sx)>4||Math.abs(ev.clientY-sy)>4)){
          moved=true; _kpiDrag=true;
          var ae=document.activeElement; if(ae&&ae.closest('#kpiInputTbody')) ae.blur();
          _kpiApplySel();
        }
        if(moved){
          var ov=ev.target.closest('[data-key]');
          if(ov&&ov.closest('#kpiInputTbody')){
            _kpiSel.r2=_kpiTrIdx(ov.closest('tr')); _kpiSel.c2=_kpiTcIdx(ov);
            _kpiApplySel();
          }
          ev.preventDefault();
        }
      }
      function onUp(){
        document.removeEventListener('mousemove',onMove);
        document.removeEventListener('mouseup',onUp);
        _kpiDrag=false;
        if(moved){ tbl.focus(); _kpiApplySel(); }
        else { _kpiClearSel(); _kpiSel={r1:ri,c1:ci,r2:ri,c2:ci}; }
      }
      document.addEventListener('mousemove',onMove);
      document.addEventListener('mouseup',onUp);
    });

    document.addEventListener('keydown',function(e){
      var kpiPg=document.getElementById('kpiPage');
      if(!kpiPg||kpiPg.style.display==='none') return;
      var ip=document.getElementById('kpiInputPane');
      if(!ip||ip.style.display==='none') return;

      if(e.key==='Delete'||e.key==='Backspace'){
        if(_kpiSel.r1>=0){
          var ae=document.activeElement;
          var inEdit=ae&&ae.contentEditable==='true'&&ae.closest('#kpiInputTbody');
          var multi=(Math.abs(_kpiSel.r2-_kpiSel.r1)>0||Math.abs(_kpiSel.c2-_kpiSel.c1)>0);
          var tblFoc=document.activeElement===tbl;
          if(multi||!inEdit||tblFoc){
            e.preventDefault();
            var trs=Array.prototype.slice.call(_kpiTbody().querySelectorAll('tr'));
            var r1=Math.min(_kpiSel.r1,_kpiSel.r2), r2=Math.max(_kpiSel.r1,_kpiSel.r2);
            var c1=Math.min(_kpiSel.c1,_kpiSel.c2), c2=Math.max(_kpiSel.c1,_kpiSel.c2);
            for(var r=r1;r<=r2;r++){
              if(!trs[r]) continue;
              for(var ci=c1;ci<=c2;ci++){
                var td=trs[r].querySelector('[data-key="'+KPI_COLS[ci].key+'"]');
                if(td&&td.contentEditable==='true') td.textContent='';
              }
            }
            if(multi) _kpiClearSel();
          }
        }
      }

      if((e.ctrlKey||e.metaKey)&&e.key==='c'){
        if(_kpiSel.r1>=0&&_kpiSel.c1>=0){ e.preventDefault(); _kpiCopyBlock(); }
      }
      if((e.ctrlKey||e.metaKey)&&e.key==='a'){
        if(!tbl.contains(document.activeElement)) return;
        var ae2=document.activeElement;
        if(ae2&&ae2.contentEditable==='true') return;
        e.preventDefault();
        var nRows=_kpiTbody().rows.length;
        _kpiSel={r1:0,c1:0,r2:nRows-1,c2:KPI_NCOLS-1};
        _kpiApplySel();
      }
    });

    document.addEventListener('mousedown',function(e){
      var kpiPg=document.getElementById('kpiPage');
      if(!kpiPg||kpiPg.style.display==='none') return;
      if(!tbl.contains(e.target)) _kpiClearSel();
    });

    // Paste (Ctrl+V dari Excel) — support hingga 32 kolom per baris
    tbl.addEventListener('paste',function(e){
      var active=document.activeElement;
      var td=active&&active.getAttribute&&active.getAttribute('data-key')&&active.closest('#kpiInputTbody')&&active;
      if(!td) return;
      var text=(e.clipboardData||window.clipboardData).getData('text');
      if(!text) return;
      var lines=text.split(/\r?\n/); if(lines[lines.length-1]==='') lines.pop();
      if(lines.length<=1&&lines[0]&&!lines[0].includes('\t')) return;
      e.preventDefault();
      var startR=_kpiTrIdx(td.closest('tr')), startC=_kpiTcIdx(td);
      lines.forEach(function(lineStr,li){
        var cells=lineStr.split('\t');
        while(_kpiTbody().rows.length<=startR+li){ _kpiAppendRow({}); kpiUpdateRowCount(); }
        var trow=_kpiTbody().rows[startR+li];
        cells.forEach(function(val,ci){
          var colIdx=startC+ci; if(colIdx>=KPI_NCOLS) return;
          var tcell=trow.querySelector('[data-key="'+KPI_COLS[colIdx].key+'"]');
          if(tcell) tcell.textContent=val.trim();
        });
      });
    });
  }

  // ── Save ──
  // NOTE: action GAS yang dipanggil = "saveKpiData". Sesuaikan nama fungsi/action ini
  // dengan Code.gs yang sudah kamu buat, kalau namanya beda tinggal ganti di sini.
  function kpiSaveData(){
    var tbody=_kpiTbody(), data=[];
    for(var i=0;i<tbody.rows.length;i++){
      var row={}, empty=true;
      KPI_COLS.forEach(function(col){
        var td=tbody.rows[i].querySelector('[data-key="'+col.key+'"]');
        var v=td?td.textContent.trim():''; row[col.key]=v; if(v) empty=false;
      });
      KPI_COLS.forEach(function(col){ if(row[col.key]) row[col.key]=String(row[col.key]).replace(/[\u00a0\u200b]/g,'').trim(); });
      if(!empty) data.push(row);
    }
    if(!data.length){ showToast('\u26a0 Tidak ada data untuk disimpan',''); return; }
    var tgl=document.getElementById('kpiMetaTanggal').value;
    if(!tgl){ showToast('\u26a0 Tanggal wajib diisi!',''); return; }

    var btnSave=document.querySelector('#kpiInputPane .op-btn.success');
    if(btnSave){ btnSave.disabled=true; btnSave.innerHTML='<i class="fas fa-spinner fa-spin"></i> Menyimpan...'; }

    var payload={tanggal:tgl, rows:data};

    if(typeof google!=='undefined'&&google.script&&google.script.run){
      google.script.run
        .withSuccessHandler(function(res){
          if(btnSave){ btnSave.disabled=false; btnSave.innerHTML='<i class="fas fa-save" style="margin-right:5px;"></i>Simpan Data'; }
          if(res&&res.success){
            showToast('\u2713 '+(res.message||'Data berhasil disimpan'),'');
            kpiClearTable();
          } else {
            showToast('\u2716 '+(res?res.message:'Gagal menyimpan'),'err');
          }
        })
        .withFailureHandler(function(err){
          if(btnSave){ btnSave.disabled=false; btnSave.innerHTML='<i class="fas fa-save" style="margin-right:5px;"></i>Simpan Data'; }
          showToast('\u2716 Error: '+err.message,'err');
        })
        .saveKpiData(payload);
    } else {
      if(btnSave){ btnSave.disabled=false; btnSave.innerHTML='<i class="fas fa-save" style="margin-right:5px;"></i>Simpan Data'; }
      showToast('\u2713 '+data.length+' baris disimpan (preview mode)','');
    }
  }
