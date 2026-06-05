  // ── Buka overlay pattern lock ──
  function _patternOpen(onSuccess){
    _patternLoadAsync(function(saved){
      if(!saved){
        // Belum ada pola — langsung masuk
        onSuccess && onSuccess();
        return;
      }
      _patternSuccess = onSuccess;
      _patternSeq = [];
      _patternReset();
      document.getElementById('patternSubtitle').textContent = 'Masukkan pola untuk melanjutkan';
      document.getElementById('patternOverlay').classList.add('show');
    });
  }

  function _patternCancel(){
    document.getElementById('patternOverlay').classList.remove('show');
    _patternSeq = [];
    _patternSuccess = null;
  }

  function _patternReset(){ _patternSeq=[]; _patternDrawLines([]); document.querySelectorAll('.pdot').forEach(function(d){ d.classList.remove('active','error','success'); }); }

  function _patternGetDotCenter(i){
    var dots = document.getElementById('patternDots');
    var wrap = document.getElementById('patternDotsWrap');
    var dot  = dots.querySelectorAll('.pdot')[i];
    if(!dot||!wrap) return {x:0,y:0};
    var wr = wrap.getBoundingClientRect();
    var dr = dot.getBoundingClientRect();
    return { x: dr.left+dr.width/2 - wr.left, y: dr.top+dr.height/2 - wr.top };
  }

  function _patternDrawLines(seq, curX, curY){
    var svg = document.getElementById('patternSvg');
    var wrap= document.getElementById('patternDotsWrap');
    if(!svg||!wrap) return;
    svg.style.width  = wrap.offsetWidth  + 'px';
    svg.style.height = wrap.offsetHeight + 'px';
    var lines = '';
    for(var i=1;i<seq.length;i++){
      var a=_patternGetDotCenter(seq[i-1]), b=_patternGetDotCenter(seq[i]);
      lines += '<line x1="'+a.x+'" y1="'+a.y+'" x2="'+b.x+'" y2="'+b.y+'" stroke="#60a5fa" stroke-width="2.5" stroke-linecap="round" opacity=".7"/>';
    }
    if(seq.length && curX !== undefined){
      var last=_patternGetDotCenter(seq[seq.length-1]);
      var wr=wrap.getBoundingClientRect();
      lines += '<line x1="'+last.x+'" y1="'+last.y+'" x2="'+(curX-wr.left)+'" y2="'+(curY-wr.top)+'" stroke="#60a5fa" stroke-width="2" stroke-linecap="round" opacity=".4" stroke-dasharray="4"/>';
    }
    svg.innerHTML = lines;
  }

  function _patternBindEvents(){
    var dots = document.querySelectorAll('#patternDots .pdot');
    var wrap = document.getElementById('patternDotsWrap');

    function startDot(i){
      if(_patternSeq.indexOf(i)<0){
        _patternSeq.push(i);
        dots[i].classList.add('active');
        _patternDrawLines(_patternSeq);
      }
    }

    function hitTest(clientX, clientY){
      dots.forEach(function(d){
        var r=d.getBoundingClientRect();
        var i=parseInt(d.dataset.i);
        if(clientX>=r.left&&clientX<=r.right&&clientY>=r.top&&clientY<=r.bottom && _patternSeq.indexOf(i)<0){
          _patternSeq.push(i);
          d.classList.add('active');
        }
      });
      _patternDrawLines(_patternSeq, clientX, clientY);
    }

    dots.forEach(function(d){
      d.addEventListener('mousedown',function(e){ e.preventDefault(); _patternDragging=true; startDot(parseInt(d.dataset.i)); });
      d.addEventListener('touchstart',function(e){ e.preventDefault(); _patternDragging=true; startDot(parseInt(d.dataset.i)); },{passive:false});
    });
    wrap.addEventListener('mousemove',function(e){ if(!_patternDragging) return; hitTest(e.clientX,e.clientY); });
    wrap.addEventListener('touchmove',function(e){ e.preventDefault(); if(!_patternDragging) return; var t=e.touches[0]; hitTest(t.clientX,t.clientY); },{passive:false});

    function endDraw(){
      if(!_patternDragging) return;
      _patternDragging=false;
      if(_patternSeq.length >= 4) _patternCheck();
      else { _patternFlash('error','Min. 4 titik'); }
    }
    document.addEventListener('mouseup', endDraw);
    document.addEventListener('touchend', endDraw);
  }

  function _patternCheck(){
    var saved = _patternCache;
    if(!saved){ _patternCancel(); _patternSuccess&&_patternSuccess(); return; }
    var ok = (JSON.stringify(_patternSeq) === JSON.stringify(saved));
    if(ok){
      _patternFlash('success','✓ Pola benar', function(){
        document.getElementById('patternOverlay').classList.remove('show');
        _patternSuccess && _patternSuccess();
        _patternSuccess = null;
      });
    } else {
      _patternFlash('error','✗ Pola salah, coba lagi');
    }
  }

  function _patternFlash(type, msg, cb){
    document.querySelectorAll('#patternDots .pdot').forEach(function(d){ d.classList.remove('active'); d.classList.add(type); });
    _patternDrawLines([]);
    document.getElementById('patternSubtitle').textContent = msg;
    setTimeout(function(){
      document.querySelectorAll('#patternDots .pdot').forEach(function(d){ d.classList.remove(type,'active'); });
      _patternSeq=[];
      if(cb) cb();
      else document.getElementById('patternSubtitle').textContent='Masukkan pola untuk melanjutkan';
    }, 700);
  }

  // ── Setting Pola ──
  function _psOpen(){
    document.getElementById('patternSettingOverlay').classList.add('show');
    document.getElementById('psettingPwInput').value='';
    document.getElementById('psettingErr').textContent='';
    ['psStep1','psStep2','psStep3'].forEach(function(s){ document.getElementById(s).classList.remove('active'); });
    document.getElementById('psStep1').classList.add('active');
    setTimeout(function(){ document.getElementById('psettingPwInput').focus(); }, 300);
  }

  function _psClose(){
    document.getElementById('patternSettingOverlay').classList.remove('show');
    _psNewSeq1=[]; _psNewSeq2=[]; _psNewPhase=1;
    _psNewReset();
  }

  function _psCheckPassword(){
    var pw = document.getElementById('psettingPwInput').value;
    if(pw === _PATTERN_PW){
      document.getElementById('psettingErr').textContent='';
      document.getElementById('psStep1').classList.remove('active');
      document.getElementById('psStep2').classList.add('active');
    } else {
      document.getElementById('psettingErr').textContent='Password salah.';
      document.getElementById('psettingPwInput').select();
    }
  }

  function _psGoSetNew(){
    document.getElementById('psStep2').classList.remove('active');
    document.getElementById('psStep3').classList.add('active');
    _psNewSeq1=[]; _psNewSeq2=[]; _psNewPhase=1;
    _psNewReset();
    document.getElementById('psStep3Hint').textContent='Gambar pola baru Anda (min. 4 titik)';
    document.getElementById('psettingHint').textContent='Gambar pola di atas';
    _psBindNewDots();
  }

  function _psRemovePattern(){
    _patternClear();
    _psClose();
    showToast('✓ Pola dihapus — Riwayat tidak terkunci','');
  }

  var _psNewDragging = false;
  var _psNewSeqCurrent = [];

  function _psNewReset(){
    _psNewSeqCurrent=[];
    document.querySelectorAll('#psettingNewDots .psnewdot').forEach(function(d){ d.classList.remove('active'); });
    document.getElementById('psNewSvg').innerHTML='';
  }

  function _psNewGetCenter(i){
    var wrap = document.getElementById('psNewDotsWrap');
    var dot  = document.querySelectorAll('#psettingNewDots .psnewdot')[i];
    if(!dot||!wrap) return {x:0,y:0};
    var wr=wrap.getBoundingClientRect(), dr=dot.getBoundingClientRect();
    return {x:dr.left+dr.width/2-wr.left, y:dr.top+dr.height/2-wr.top};
  }

  function _psNewDrawLines(seq, curX, curY){
    var svg = document.getElementById('psNewSvg');
    var wrap= document.getElementById('psNewDotsWrap');
    if(!svg||!wrap) return;
    svg.style.width=wrap.offsetWidth+'px'; svg.style.height=wrap.offsetHeight+'px';
    var lines='';
    for(var i=1;i<seq.length;i++){
      var a=_psNewGetCenter(seq[i-1]),b=_psNewGetCenter(seq[i]);
      lines+='<line x1="'+a.x+'" y1="'+a.y+'" x2="'+b.x+'" y2="'+b.y+'" stroke="#3182ce" stroke-width="2.5" stroke-linecap="round" opacity=".7"/>';
    }
    if(seq.length&&curX!==undefined){
      var last=_psNewGetCenter(seq[seq.length-1]);
      var wr=wrap.getBoundingClientRect();
      lines+='<line x1="'+last.x+'" y1="'+last.y+'" x2="'+(curX-wr.left)+'" y2="'+(curY-wr.top)+'" stroke="#3182ce" stroke-width="2" stroke-linecap="round" opacity=".4" stroke-dasharray="4"/>';
    }
    svg.innerHTML=lines;
  }

  function _psBindNewDots(){
    var dots = document.querySelectorAll('#psettingNewDots .psnewdot');
    var wrap = document.getElementById('psNewDotsWrap');

    function startDot(i){ if(_psNewSeqCurrent.indexOf(i)<0){ _psNewSeqCurrent.push(i); dots[i].classList.add('active'); _psNewDrawLines(_psNewSeqCurrent); } }
    function hitTest(cx,cy){
      dots.forEach(function(d){
        var r=d.getBoundingClientRect(), i=parseInt(d.dataset.i);
        if(cx>=r.left&&cx<=r.right&&cy>=r.top&&cy<=r.bottom&&_psNewSeqCurrent.indexOf(i)<0){ _psNewSeqCurrent.push(i); d.classList.add('active'); }
      });
      _psNewDrawLines(_psNewSeqCurrent,cx,cy);
    }

    dots.forEach(function(d){
      d.addEventListener('mousedown',function(e){ e.preventDefault(); _psNewDragging=true; startDot(parseInt(d.dataset.i)); });
      d.addEventListener('touchstart',function(e){ e.preventDefault(); _psNewDragging=true; startDot(parseInt(d.dataset.i)); },{passive:false});
    });
    wrap.addEventListener('mousemove',function(e){ if(!_psNewDragging)return; hitTest(e.clientX,e.clientY); });
    wrap.addEventListener('touchmove',function(e){ e.preventDefault(); if(!_psNewDragging)return; var t=e.touches[0]; hitTest(t.clientX,t.clientY); },{passive:false});

    function endDraw(){
      if(!_psNewDragging)return; _psNewDragging=false;
      if(_psNewSeqCurrent.length<4){ document.getElementById('psettingHint').textContent='Min. 4 titik, ulangi'; _psNewReset(); return; }
      if(_psNewPhase===1){
        _psNewSeq1 = _psNewSeqCurrent.slice();
        _psNewPhase = 2;
        _psNewReset();
        document.getElementById('psStep3Hint').textContent='Konfirmasi pola';
        document.getElementById('psettingHint').textContent='Gambar ulang pola yang sama';
      } else {
        _psNewSeq2 = _psNewSeqCurrent.slice();
        if(JSON.stringify(_psNewSeq1)===JSON.stringify(_psNewSeq2)){
          _patternSave(_psNewSeq1);
          _psClose();
          showToast('✓ Pola berhasil disimpan','');
        } else {
          document.getElementById('psettingHint').textContent='✗ Pola tidak cocok, mulai ulang';
          _psNewSeq1=[]; _psNewSeq2=[]; _psNewPhase=1;
          setTimeout(function(){ _psNewReset(); document.getElementById('psStep3Hint').textContent='Gambar pola baru Anda (min. 4 titik)'; document.getElementById('psettingHint').textContent='Gambar pola di atas'; }, 800);
        }
      }
    }
    document.addEventListener('mouseup',endDraw);
    document.addEventListener('touchend',endDraw);
  }

  function _psResetNew(){ _psNewSeq1=[]; _psNewSeq2=[]; _psNewPhase=1; _psNewReset(); document.getElementById('psStep3Hint').textContent='Gambar pola baru Anda (min. 4 titik)'; document.getElementById('psettingHint').textContent='Gambar pola di atas'; }

  // Init pattern events on load
  function sjToggleSSMenu(){
    var menu=document.getElementById('sjSSMenu');
    if(!menu)return;
    var isOpen=menu.style.display!=='none';
    menu.style.display=isOpen?'none':'block';
  }
  // Tutup dropdown saat klik di luar
  document.addEventListener('click',function(e){
    var wrap=document.getElementById('sjSSDropWrap');
    var menu=document.getElementById('sjSSMenu');
    if(menu&&wrap&&!wrap.contains(e.target)) menu.style.display='none';
  });

  window.addEventListener('load', function(){ _patternBindEvents(); });

  // =============================================
  // STOCK JALUR PAGE
  // =============================================
  var _sjZoom=100, _soZoom=100, _sjActiveTab='input';
  var _sjSel={r1:-1,c1:-1,r2:-1,c2:-1}, _sjDragging=false;
  var _soSel={r1:-1,c1:-1,r2:-1,c2:-1}, _soDragging=false;
  var _sjInitDone=false;
  var _srCurrentSheet=''; // sheet name aktif untuk edit rekap
  var _srCurrentSsUrl=''; // ssUrl aktif untuk edit rekap

  var SJ_COLS=['prodate','sku','nama','qty','shift','plant','catatan','status'];
  var SO_COLS=['prodate','sku','nama','qty','tglkeluar','nomobil','nodo','tujuan','plant','catatan','status'];
  // STATUS saja yang auto (tidak bisa diedit) — NAMA BARANG bisa diedit
  var SJ_AUTO={'status':true};
  var SO_AUTO={'status':true};

  function _sjFallbackCopy(text){
    var ta=document.createElement('textarea');
    ta.value=text; ta.style.cssText='position:fixed;top:0;left:0;width:2px;height:2px;opacity:0;';
    document.body.appendChild(ta); ta.focus(); ta.select();
    try{ document.execCommand('copy'); }catch(ex){}
    document.body.removeChild(ta);
  }
  function _sjRawText(td){ return td?(td.textContent||'').trim():''; }

  function _sjApplyShiftBadge(td){
    var v=_sjRawText(td); td.innerHTML=''; if(!v)return;
    var cls={'1':'sj-shift-1','2':'sj-shift-2','3':'sj-shift-3'}[v];
    if(cls){var s=document.createElement('span');s.className=cls;s.textContent='Shift '+v;td.appendChild(s);}else td.textContent=v;
  }
  function _sjApplyPlantBadge(td,pfx){
    var v=_sjRawText(td); td.innerHTML=''; if(!v)return;
    var p=pfx||'sj';
    var cls={'1111':p+'-plant-1111','1112':p+'-plant-1112','1113':p+'-plant-1113'}[v];
    if(cls){var s=document.createElement('span');s.className=cls;s.textContent=v;td.appendChild(s);}else td.textContent=v;
  }
  function _sjApplyStatusBadge(td,pfx){
    var v=_sjRawText(td); td.innerHTML=''; if(!v)return;
    var p=pfx||'sj';
    var cls=v==='DONE'?p+'-status-done':(v.indexOf('Error')>=0||v.indexOf('kurang')>=0?p+'-status-error':'so-status-warn');
    var s=document.createElement('span');s.className=cls;s.textContent=v;td.appendChild(s);
  }

  // Lookup nama — pakai _opnameNamaMap (shared), hanya auto-fill jika sel masih kosong
  function _sjGetNama(sku){
    if(typeof _opnameNamaMap!=='undefined'&&_opnameNamaMap[sku]) return _opnameNamaMap[sku];
    if(typeof _skuNamaMap!=='undefined'&&_skuNamaMap[sku]) return _skuNamaMap[sku];
    return null;
  }
  var _sjStdLoading = false;   // sedang load STD
  var _sjStdLoaded  = false;   // sudah selesai load
  var _sjPendingLookup = [];   // [{tr, namaCol}] yang menunggu data

  function _sjLookupSku(tr, namaCol){
    var st=tr.querySelector('[data-col="sku"]');
    var nt=tr.querySelector('[data-col="'+(namaCol||'nama')+'"]');
    if(!st||!nt) return;
    var sku=_sjRawText(st);
    if(!sku){ nt.textContent=''; nt.style.color=''; return; }
    // Hanya auto-fill jika sel nama masih kosong
    if(_sjRawText(nt)) return;

    var nama=_sjGetNama(sku);
    if(nama){
      nt.textContent=nama; nt.style.color='#2d3748'; return;
    }

    // Nama tidak ditemukan di map lokal
    if(_sjStdLoaded){
      // Data sudah ada tapi SKU benar-benar tidak ada
      nt.textContent='\u26a0\ufe0f Tidak terdaftar'; nt.style.color='#e53e3e';
      return;
    }

    // Data belum ada — queue dan load kalau belum loading
    nt.textContent='\u23f3 Mencari...'; nt.style.color='#a0aec0';
    _sjPendingLookup.push({tr:tr, namaCol:namaCol||'nama'});

    if(!_sjStdLoading){
      _sjStdLoading=true;
      google.script.run /* TODO: manual replace google.script.run */
        .withSuccessHandler(function(res){
          _sjStdLoading=false;
          _sjStdLoaded=true;
          if(res&&res.success&&res.data) res.data.forEach(function(r){
            if(r.sku){
              var sk=String(r.sku).trim();
              if(typeof _opnameNamaMap!=='undefined') _opnameNamaMap[sk]=_opnameNamaMap[sk]||r.nama||'';
              if(typeof _skuNamaMap!=='undefined')    _skuNamaMap[sk]   =_skuNamaMap[sk]   ||r.nama||'';
            }
          });
          // Retry semua yang pending
          var pending=_sjPendingLookup.splice(0);
          pending.forEach(function(p){
            var st2=p.tr.querySelector('[data-col="sku"]');
            var nt2=p.tr.querySelector('[data-col="'+p.namaCol+'"]');
            if(!st2||!nt2) return;
            var sku2=_sjRawText(st2);
            var nama2=_sjGetNama(sku2);
            if(nama2){ nt2.textContent=nama2; nt2.style.color='#2d3748'; }
            else { nt2.textContent='\u26a0\ufe0f Tidak terdaftar'; nt2.style.color='#e53e3e'; }
          });
        })
        .withFailureHandler(function(){
          _sjStdLoading=false; _sjStdLoaded=true;
          var pending=_sjPendingLookup.splice(0);
          pending.forEach(function(p){
            var nt2=p.tr.querySelector('[data-col="'+p.namaCol+'"]');
            if(nt2){ nt2.textContent='\u26a0\ufe0f Tidak terdaftar'; nt2.style.color='#e53e3e'; }
          });
        })
        .getStandarPalet();
    }
  }

  function _sjTrIdx(tbody,tr){ return Array.from(tbody.querySelectorAll('tr')).indexOf(tr); }
  function _sjTcIdx(cols,td){ return cols.indexOf(td.dataset.col||''); }

  function sjSwitchTab(tab){
    if(_sjActiveTab===tab)return; _sjActiveTab=tab;
    var panes={input:'sjInputPane',output:'sjOutputPane',rekap:'sjRekapPane'};
    var btns={input:'btnSjInput',output:'btnSjOutput',rekap:'btnSjRekap'};
    // Sembunyikan semua pane dengan animasi fade
    var curPane=document.getElementById(panes[_sjActiveTab==='input'?'input':_sjActiveTab]);
    // Cari pane yang sedang tampil
    var curId=null;
    ['input','output','rekap'].forEach(function(t){
      var p=document.getElementById(panes[t]);
      if(p&&p.style.display!=='none')curId=panes[t];
    });
    var cur=curId?document.getElementById(curId):null;
    var tgt=document.getElementById(panes[tab]);
    if(!tgt)return;
    _sjActiveTab=tab;
    // Update tombol aktif
    Object.keys(btns).forEach(function(t){
      var b=document.getElementById(btns[t]);
      if(b)b.style.background=t===tab?'rgba(255,255,255,.38)':'rgba(255,255,255,.18)';
    });
    if(cur&&cur!==tgt){
      cur.style.transition='opacity .18s ease,transform .18s ease';
      cur.style.opacity='0'; cur.style.transform='translateX(-24px)';
      setTimeout(function(){
        cur.style.display='none'; cur.style.transition=cur.style.opacity=cur.style.transform='';
        _sjShowPane(tgt);
      },180);
    } else {
      _sjShowPane(tgt);
    }
  }
  function _sjShowPane(tgt){
    tgt.style.display=''; tgt.style.opacity='0'; tgt.style.transform='translateX(24px)';
    void tgt.offsetWidth;
    tgt.style.transition='opacity .18s ease,transform .18s ease';
    tgt.style.opacity='1'; tgt.style.transform='translateX(0)';
    setTimeout(function(){tgt.style.transition='';},200);
  }

  function sjInitPage(){
    var bi=document.getElementById('btnSjInput'),bo=document.getElementById('btnSjOutput'),br=document.getElementById('btnSjRekap');
    if(bi)bi.style.background='rgba(255,255,255,.38)';
    if(bo)bo.style.background='rgba(255,255,255,.18)';
    if(br)br.style.background='rgba(255,255,255,.18)';
    _sjActiveTab='input';
    document.getElementById('sjInputPane').style.display='';
    document.getElementById('sjOutputPane').style.display='none';
    document.getElementById('sjRekapPane').style.display='none';
    if(!document.getElementById('sjTbody').children.length)sjInitRows(30);
    if(!document.getElementById('soTbody').children.length)soInitRows(30);
    if(!_sjInitDone){
      var hasData=typeof _opnameNamaMap!=='undefined'&&Object.keys(_opnameNamaMap).length>0;
      if(hasData)_sjInitDone=true;
    }
  }

  // ── INPUT tabel ───────────────────────────────────────────────
  function _sjClearSel(){
    document.querySelectorAll('#sjTbl .sj-sel').forEach(function(el){el.classList.remove('sj-sel');});
    _sjSel={r1:-1,c1:-1,r2:-1,c2:-1};
    var info=document.getElementById('sjSelInfo');if(info)info.textContent='';
  }
  function _sjApplySel(){
    document.querySelectorAll('#sjTbl .sj-sel').forEach(function(el){el.classList.remove('sj-sel');});
    var tbody=document.getElementById('sjTbody');if(!tbody)return;
    var trs=Array.from(tbody.querySelectorAll('tr'));
    var r1=Math.min(_sjSel.r1,_sjSel.r2),r2=Math.max(_sjSel.r1,_sjSel.r2);
    var c1=Math.min(_sjSel.c1,_sjSel.c2),c2=Math.max(_sjSel.c1,_sjSel.c2);
    if(r1<0||c1<0)return;
    for(var r=r1;r<=r2;r++){if(!trs[r])continue;for(var ci=c1;ci<=c2;ci++){var td=trs[r].querySelector('[data-col="'+SJ_COLS[ci]+'"]');if(td)td.classList.add('sj-sel');}}
    var info=document.getElementById('sjSelInfo');if(info)info.textContent=(r2-r1+1)+'R \u00d7 '+(c2-c1+1)+'K  (Ctrl+C copy)';
  }
  function _sjCopyBlock(){
    var tbody=document.getElementById('sjTbody');if(!tbody)return;
    var trs=Array.from(tbody.querySelectorAll('tr'));
    var r1=Math.min(_sjSel.r1,_sjSel.r2),r2=Math.max(_sjSel.r1,_sjSel.r2);
    var c1=Math.min(_sjSel.c1,_sjSel.c2),c2=Math.max(_sjSel.c1,_sjSel.c2);
    if(r1<0||c1<0){showToast('Tidak ada selection','error');return;}
    var lines=[];
    for(var r=r1;r<=r2;r++){if(!trs[r])continue;var cells=[];for(var ci=c1;ci<=c2;ci++){var td=trs[r].querySelector('[data-col="'+SJ_COLS[ci]+'"]');cells.push(td?td.textContent.trim():'');}lines.push(cells.join('\t'));}
    var text=lines.join('\n');
    // Jalankan fallback synchronous dulu (masih dalam user gesture), lalu coba clipboard API
    _sjFallbackCopy(text);
    if(navigator.clipboard&&navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).catch(function(){});
    }
    showToast('\uD83D\uDCCB '+(r2-r1+1)+' baris disalin','success');
  }
  // Evaluasi rumus =expr di kolom qty (=22+44+34 → 100)
  function _sjSoEvalFormula(td){
    var txt = (td.textContent||'').trim();
    if(!txt || txt.charAt(0) !== '=') return;
    var expr = txt.slice(1)
                  .replace(/,/g, '.')
                  .replace(/[^0-9.+\-*/()\s]/g, '');
    if(!expr) return;
    try{
      var result = Function('"use strict"; return (' + expr + ')')();
      if(typeof result === 'number' && isFinite(result)){
        td.textContent = (result % 1 === 0)
          ? String(Math.round(result))
          : parseFloat(result.toFixed(6)).toString();
      }
    }catch(ex){}
  }

  // Evaluasi rumus =expr di kolom qty (=22+44+34 → 100)
  function _sjSoEvalFormula(td){
    var txt=(td.textContent||'').trim();
    if(!txt||txt.charAt(0)!=='=') return;
    var expr=txt.slice(1).replace(/,/g,'.').replace(/[^0-9.+\-*/()\s]/g,'');
    if(!expr) return;
    try{
      var result=Function('"use strict"; return ('+expr+')')();
      if(typeof result==='number'&&isFinite(result)){
        td.textContent=(result%1===0)?String(Math.round(result)):parseFloat(result.toFixed(6)).toString();
      }
    }catch(ex){}
  }

    function sjInitRows(n){var t=document.getElementById('sjTbody');if(!t)return;t.innerHTML='';for(var i=0;i<n;i++)_sjAppendRow();_sjRenumber();_sjUpdateTotals();_sjBindEvents();}
  function sjAddRows(n){for(var i=0;i<n;i++)_sjAppendRow();_sjRenumber();_sjBindEvents();}
  function _sjAppendRow(v){
    v=v||{}; var tbody=document.getElementById('sjTbody');if(!tbody)return;
    var tr=document.createElement('tr');
    var no=document.createElement('td');no.className='row-no sj-rnum';tr.appendChild(no);
    SJ_COLS.forEach(function(k){
      var td=document.createElement('td');td.dataset.col=k;
      var isAuto=SJ_AUTO[k],isNum=(k==='qty'),isCenter=(k==='shift'||k==='plant'||k==='status');
      td.className='sj-td'+(isAuto?' sj-auto':'')+(isNum?' td-num':'')+(isCenter?' td-center':'');
      if(v[k])td.textContent=v[k];
      if(!isAuto){td.contentEditable='true';td.spellcheck=false;}
      tr.appendChild(td);
    });
    var dt=document.createElement('td');dt.style.cssText='padding:2px 4px;border:1px solid #e8edf2;';
    var db=document.createElement('button');db.className='sj-del-btn';db.innerHTML='<i class="fas fa-times"></i>';
    db.onclick=function(){tr.remove();_sjRenumber();_sjUpdateTotals();}; dt.appendChild(db);tr.appendChild(dt);
    tbody.appendChild(tr);
  }
  function _sjRenumber(){
    var rows=document.querySelectorAll('#sjTbody tr');
    rows.forEach(function(r,i){var c=r.querySelector('.sj-rnum');if(c)c.textContent=i+1;});
    var el=document.getElementById('sjRowCount');if(el)el.textContent=rows.length+' BARIS';
  }
  function _sjUpdateTotals(){
    var rows=document.querySelectorAll('#sjTbody tr'),skus={},qty=0,filled=0,p1=0,p2=0,p3=0;
    rows.forEach(function(r){
      var sku=_sjRawText(r.querySelector('[data-col="sku"]'));
      var q=parseFloat(_sjRawText(r.querySelector('[data-col="qty"]'))||0)||0;
      var plant=_sjRawText(r.querySelector('[data-col="plant"]'));
      if(sku){skus[sku]=true;filled++;} qty+=q;
      if(plant==='1111')p1++; else if(plant==='1112')p2++; else if(plant==='1113')p3++;
    });
    var s=function(id,v){var el=document.getElementById(id);if(el)el.textContent=v;};
    s('sjTotSku',Object.keys(skus).length);s('sjTotQty',qty.toLocaleString('id-ID'));
    s('sjTotRows',filled);s('sjTotPlant1111',p1);s('sjTotPlant1112',p2);s('sjTotPlant1113',p3);
  }
  function _sjOnKeydown(e,td){
    var tbody=document.getElementById('sjTbody'),trs=Array.from(tbody.querySelectorAll('tr'));
    var ri=_sjTrIdx(tbody,td.closest('tr')),ci=_sjTcIdx(SJ_COLS,td);
    if(e.key==='Tab'){
      e.preventDefault();
      var nextCi=ci+1;while(nextCi<SJ_COLS.length&&SJ_AUTO[SJ_COLS[nextCi]])nextCi++;
      if(nextCi<SJ_COLS.length){var nt=trs[ri]&&trs[ri].querySelector('[data-col="'+SJ_COLS[nextCi]+'"]');if(nt){nt.focus();_sjClearSel();}}
      else if(trs[ri+1]){var nf=trs[ri+1].querySelector('[contenteditable="true"]');if(nf){nf.focus();_sjClearSel();}}
      return;
    }
    if(e.key==='Enter'){
      e.preventDefault();
      if(trs[ri+1]){var nc=trs[ri+1].children[td.cellIndex];if(nc&&nc.contentEditable==='true'){nc.focus();_sjClearSel();}}
      else{sjAddRows(1);setTimeout(function(){var nr=tbody.querySelectorAll('tr');var nc2=nr[ri+1]&&nr[ri+1].children[td.cellIndex];if(nc2&&nc2.contentEditable==='true')nc2.focus();},50);}
      return;
    }
    // ── Arrow keys — pindah cell, tidak geser kursor teks ──────
    var isArrow=['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].indexOf(e.key)>=0;
    if(!isArrow) return;
    e.preventDefault();
    var nri=ri, nci=ci;
    if(e.key==='ArrowUp')    nri=ri-1;
    if(e.key==='ArrowDown')  nri=ri+1;
    if(e.key==='ArrowLeft')  nci=ci-1;
    if(e.key==='ArrowRight') nci=ci+1;
    // Shift+Arrow → extend seleksi
    if(e.shiftKey){
      if(_sjSel.r1<0) _sjSel={r1:ri,c1:ci,r2:ri,c2:ci};
      nri=Math.max(0,Math.min(trs.length-1,nri));
      nci=Math.max(0,Math.min(SJ_COLS.length-1,nci));
      _sjSel.r2=nri; _sjSel.c2=nci; _sjApplySel();
      var tgt=trs[nri]&&trs[nri].querySelector('[data-col="'+SJ_COLS[nci]+'"]');
      if(tgt&&tgt.contentEditable==='true') setTimeout(function(){tgt.focus();},0);
      return;
    }
    // Arrow tanpa Shift → pindah cell, clear sel
    nri=Math.max(0,Math.min(trs.length-1,nri));
    nci=Math.max(0,Math.min(SJ_COLS.length-1,nci));
    var tgt2=trs[nri]&&trs[nri].querySelector('[data-col="'+SJ_COLS[nci]+'"]');
    if(tgt2&&tgt2.contentEditable==='true'){tgt2.focus();_sjClearSel();_sjSel={r1:nri,c1:nci,r2:nri,c2:nci};}
  }
  function _sjBindEvents(){
    var tbl=document.getElementById('sjTbl');if(!tbl||tbl._sjBound)return;tbl._sjBound=true;
    var tbody=document.getElementById('sjTbody');
    // SISTEM TABEL OK
    _STOKInit({tblId:'sjTbl',tbodyId:'sjTbody',cols:SJ_COLS,autoCols:{},selClass:'sj-sel',
      onAfterPaste:function(tr){ if(typeof _sjApplyShiftBadge==='function'){ var td=tr.querySelector('[data-col="shift"]'); if(td) _sjApplyShiftBadge(td); } if(typeof _sjUpdateTotals==='function') _sjUpdateTotals(); },
      onDelete:function(tr){ if(typeof _sjUpdateTotals==='function') _sjUpdateTotals(); }
    });
    // mousedown drag, keydown, paste handled by _STOKInit
    document.addEventListener('mousedown',function(e){var pg=document.getElementById('stockJalurPage');if(!pg||pg.style.display==='none')return;if(tbl&&!tbl.contains(e.target))_sjClearSel();});
    // paste handled by _STOKInit
    tbody.addEventListener('blur',function(e){
      var td=e.target.closest('td[data-col]');if(!td)return;
      var col=td.dataset.col,tr=td.closest('tr');
      if(col==='qty') _sjSoEvalFormula(td);
      if(col==='sku')_sjLookupSku(tr);  // auto-fill nama jika masih kosong
      if(col==='shift')_sjApplyShiftBadge(td);
      if(col==='plant')_sjApplyPlantBadge(td,'sj');
      _sjUpdateTotals();
    },true);
    // keydown handled by _STOKInit
  }
  function sjZoom(d){_sjZoom=Math.min(150,Math.max(60,_sjZoom+d));var t=document.getElementById('sjTbl');if(t)t.style.fontSize=(_sjZoom/100*12)+'px';var l=document.getElementById('sjZoomLabel');if(l)l.textContent=_sjZoom+'%';}
  function sjZoomReset(){_sjZoom=100;var t=document.getElementById('sjTbl');if(t)t.style.fontSize='';var l=document.getElementById('sjZoomLabel');if(l)l.textContent='100%';}
  function sjClearTable(){if(!confirm('Yakin clear data input?'))return;sjInitRows(30);showToast('Tabel Input berhasil di-clear','');}
  function _sjCollect(){
    var data=[];
    document.querySelectorAll('#sjTbody tr').forEach(function(r){
      var prodate=_sjRawText(r.querySelector('[data-col="prodate"]')),sku=_sjRawText(r.querySelector('[data-col="sku"]'));
      var qty=_sjRawText(r.querySelector('[data-col="qty"]')),shift=_sjRawText(r.querySelector('[data-col="shift"]')),plant=_sjRawText(r.querySelector('[data-col="plant"]'));
      var status=_sjRawText(r.querySelector('[data-col="status"]'));
      var catatan=_sjRawText(r.querySelector('[data-col="catatan"]'))||'';
      var nama=_sjRawText(r.querySelector('[data-col="nama"]'))||'';
      if(status && status.indexOf('DONE')===0)return;  // skip DONE dan 'DONE (dicatat di ...)'
      if(!sku||!prodate||!qty||!shift||!plant)return;
      var qtyNum=parseFloat(qty.replace(/\./g,'').replace(',','.'))||0,shiftNum=parseInt(String(shift).replace(/[^0-9]/g,''));
      if(qtyNum<=0||shiftNum<1||shiftNum>3||['1111','1112','1113'].indexOf(plant)<0)return;
      data.push({prodate:prodate,sku:sku,nama:nama,qty:qtyNum,shift:shiftNum,plant:plant,catatan:catatan,_row:r});
    });
    return data;
  }
  var _sjSaving=false;
  function sjSave(){
    if(_sjSaving){showToast('\u23f3 Sedang memproses...','');return;}
    var data=_sjCollect();
    if(!data||!data.length){showToast('\u26a0\ufe0f Tidak ada data baru (semua sudah DONE atau tidak valid).','error');return;}
    var payload=data.map(function(d){return {prodate:d.prodate,sku:d.sku,nama:d.nama||'',qty:d.qty,shift:d.shift,plant:d.plant,catatan:d.catatan||''};});
    var btn=document.getElementById('btnSjSave');
    if(btn){btn.disabled=true;btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Menyimpan...';}
    _sjSaving=true;
    showToast('\u23f3 Menyimpan '+payload.length+' baris...','');
    API.rekapStockJalur(payload,
      function(res){
        _sjSaving=false;
        if(btn){btn.disabled=false;btn.innerHTML='<i class="fas fa-save"></i> Simpan & Rekap';}
        if(res&&res.success){showToast('\u2705 Berhasil merekap '+payload.length+' baris!','success');_sjMarkDone(data,res.done||[],res.errors||[]);}
        else showToast('\u274c Gagal: '+(res&&res.message?res.message:'Unknown error'),'error');
      },
      function(err){
        _sjSaving=false;
        if(btn){btn.disabled=false;btn.innerHTML='<i class="fas fa-save"></i> Simpan & Rekap';}
        showToast('\u274c Error: '+(err&&err.message?err.message:String(err)),'error');
      });
  }
  function _sjMarkDone(dataWithRows,done,errors){
    dataWithRows.forEach(function(d){
      var r=d._row;if(!r)return;
      var statusTd=r.querySelector('[data-col="status"]');if(!statusTd)return;
      var key=d.sku+'_'+d.shift;
      statusTd.innerHTML='';
      if(done.indexOf(key)>=0){var s=document.createElement('span');s.className='sj-status-done';s.textContent='DONE';statusTd.appendChild(s);r.style.background='#f0fff4';}
      else if(errors.indexOf(d.sku)>=0){var s=document.createElement('span');s.className='sj-status-error';s.textContent='Error';statusTd.appendChild(s);r.style.background='#fff5f5';}
    });
  }

  // ── OUTPUT tabel ──────────────────────────────────────────────
  function _soClearSel(){
    document.querySelectorAll('#soTbl .so-sel').forEach(function(el){el.classList.remove('so-sel');});
    _soSel={r1:-1,c1:-1,r2:-1,c2:-1};
    var info=document.getElementById('soSelInfo');if(info)info.textContent='';
  }
  function _soApplySel(){
    document.querySelectorAll('#soTbl .so-sel').forEach(function(el){el.classList.remove('so-sel');});
    var tbody=document.getElementById('soTbody');if(!tbody)return;
    var trs=Array.from(tbody.querySelectorAll('tr'));
    var r1=Math.min(_soSel.r1,_soSel.r2),r2=Math.max(_soSel.r1,_soSel.r2);
    var c1=Math.min(_soSel.c1,_soSel.c2),c2=Math.max(_soSel.c1,_soSel.c2);
    if(r1<0||c1<0)return;
    for(var r=r1;r<=r2;r++){if(!trs[r])continue;for(var ci=c1;ci<=c2;ci++){var td=trs[r].querySelector('[data-col="'+SO_COLS[ci]+'"]');if(td)td.classList.add('so-sel');}}
    var info=document.getElementById('soSelInfo');if(info)info.textContent=(r2-r1+1)+'R \u00d7 '+(c2-c1+1)+'K  (Ctrl+C copy)';
  }
  function _soCopyBlock(){
    var tbody=document.getElementById('soTbody');if(!tbody)return;
    var trs=Array.from(tbody.querySelectorAll('tr'));
    var r1=Math.min(_soSel.r1,_soSel.r2),r2=Math.max(_soSel.r1,_soSel.r2);
    var c1=Math.min(_soSel.c1,_soSel.c2),c2=Math.max(_soSel.c1,_soSel.c2);
    if(r1<0||c1<0){showToast('Tidak ada selection','error');return;}
    var lines=[];
    for(var r=r1;r<=r2;r++){if(!trs[r])continue;var cells=[];for(var ci=c1;ci<=c2;ci++){var td=trs[r].querySelector('[data-col="'+SO_COLS[ci]+'"]');cells.push(td?td.textContent.trim():'');}lines.push(cells.join('\t'));}
    var text=lines.join('\n');
    try{navigator.clipboard.writeText(text).catch(function(){_sjFallbackCopy(text);});}catch(e2){_sjFallbackCopy(text);}
    showToast('\uD83D\uDCCB '+(r2-r1+1)+' baris disalin','success');
  }
  function soInitRows(n){var t=document.getElementById('soTbody');if(!t)return;t.innerHTML='';for(var i=0;i<n;i++)_soAppendRow();_soRenumber();_soUpdateTotals();_soBindEvents();}
  function soAddRows(n){for(var i=0;i<n;i++)_soAppendRow();_soRenumber();_soBindEvents();}
  function _soAppendRow(v){
    v=v||{}; var tbody=document.getElementById('soTbody');if(!tbody)return;
    var tr=document.createElement('tr');
    var no=document.createElement('td');no.className='row-no so-rnum';tr.appendChild(no);
    SO_COLS.forEach(function(k){
      var td=document.createElement('td');td.dataset.col=k;
      var isAuto=SO_AUTO[k],isNum=(k==='qty'),isCenter=(k==='plant'||k==='status');
      td.className='so-td'+(isAuto?' so-auto':'')+(isNum?' td-num':'')+(isCenter?' td-center':'');
      if(v[k])td.textContent=v[k];
      if(!isAuto){td.contentEditable='true';td.spellcheck=false;}
      tr.appendChild(td);
    });
    var dt=document.createElement('td');dt.style.cssText='padding:2px 4px;border:1px solid #e8edf2;';
    var db=document.createElement('button');db.className='so-del-btn';db.innerHTML='<i class="fas fa-times"></i>';
    db.onclick=function(){tr.remove();_soRenumber();_soUpdateTotals();}; dt.appendChild(db);tr.appendChild(dt);
    tbody.appendChild(tr);
  }
  function _soRenumber(){
    var rows=document.querySelectorAll('#soTbody tr');
    rows.forEach(function(r,i){var c=r.querySelector('.so-rnum');if(c)c.textContent=i+1;});
    var el=document.getElementById('soRowCount');if(el)el.textContent=rows.length+' BARIS';
  }
  function _soUpdateTotals(){
    var rows=document.querySelectorAll('#soTbody tr'),skus={},qty=0,filled=0,done=0,err=0;
    rows.forEach(function(r){
      var sku=_sjRawText(r.querySelector('[data-col="sku"]'));
      var q=parseFloat(_sjRawText(r.querySelector('[data-col="qty"]'))||0)||0;
      var status=_sjRawText(r.querySelector('[data-col="status"]'));
      if(sku){skus[sku]=true;filled++;} qty+=q;
      if(status==='DONE')done++; else if(status&&status.length>0)err++;
    });
    var s=function(id,v){var el=document.getElementById(id);if(el)el.textContent=v;};
    s('soTotSku',Object.keys(skus).length);s('soTotQty',qty.toLocaleString('id-ID'));
    s('soTotRows',filled);s('soTotDone',done);s('soTotError',err);
  }
  function _soOnKeydown(e,td){
    var tbody=document.getElementById('soTbody'),trs=Array.from(tbody.querySelectorAll('tr'));
    var ri=_sjTrIdx(tbody,td.closest('tr')),ci=_sjTcIdx(SO_COLS,td);
    if(e.key==='Tab'){
      e.preventDefault();
      var nextCi=ci+1;while(nextCi<SO_COLS.length&&SO_AUTO[SO_COLS[nextCi]])nextCi++;
      if(nextCi<SO_COLS.length){var nt=trs[ri]&&trs[ri].querySelector('[data-col="'+SO_COLS[nextCi]+'"]');if(nt){nt.focus();_soClearSel();}}
      else if(trs[ri+1]){var nf=trs[ri+1].querySelector('[contenteditable="true"]');if(nf){nf.focus();_soClearSel();}}
      return;
    }
    if(e.key==='Enter'){
      e.preventDefault();
      if(trs[ri+1]){var nc=trs[ri+1].children[td.cellIndex];if(nc&&nc.contentEditable==='true'){nc.focus();_soClearSel();}}
      else{soAddRows(1);setTimeout(function(){var nr=tbody.querySelectorAll('tr');var nc2=nr[ri+1]&&nr[ri+1].children[td.cellIndex];if(nc2&&nc2.contentEditable==='true')nc2.focus();},50);}
      return;
    }
    // ── Arrow keys ──────────────────────────────────────────────
    var isArrow=['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].indexOf(e.key)>=0;
    if(!isArrow) return;
    e.preventDefault();
    var nri=ri, nci=ci;
    if(e.key==='ArrowUp')    nri=ri-1;
    if(e.key==='ArrowDown')  nri=ri+1;
    if(e.key==='ArrowLeft')  nci=ci-1;
    if(e.key==='ArrowRight') nci=ci+1;
    if(e.shiftKey){
      if(_soSel.r1<0) _soSel={r1:ri,c1:ci,r2:ri,c2:ci};
      nri=Math.max(0,Math.min(trs.length-1,nri));
      nci=Math.max(0,Math.min(SO_COLS.length-1,nci));
      _soSel.r2=nri; _soSel.c2=nci; _soApplySel();
      var tgt=trs[nri]&&trs[nri].querySelector('[data-col="'+SO_COLS[nci]+'"]');
      if(tgt&&tgt.contentEditable==='true') setTimeout(function(){tgt.focus();},0);
      return;
    }
    nri=Math.max(0,Math.min(trs.length-1,nri));
    nci=Math.max(0,Math.min(SO_COLS.length-1,nci));
    var tgt2=trs[nri]&&trs[nri].querySelector('[data-col="'+SO_COLS[nci]+'"]');
    if(tgt2&&tgt2.contentEditable==='true'){tgt2.focus();_soClearSel();_soSel={r1:nri,c1:nci,r2:nri,c2:nci};}
  }
  function _soBindEvents(){
    var tbl=document.getElementById('soTbl');if(!tbl||tbl._soBound)return;tbl._soBound=true;
    var tbody=document.getElementById('soTbody');
    // SISTEM TABEL OK
    _STOKInit({tblId:'soTbl',tbodyId:'soTbody',cols:SO_COLS,autoCols:{},selClass:'so-sel',
      onAfterPaste:function(tr){ if(typeof _soUpdateTotals==='function') _soUpdateTotals(); },
      onDelete:function(tr){ if(typeof _soUpdateTotals==='function') _soUpdateTotals(); }
    });
    // mousedown drag, keydown, paste handled by _STOKInit
    document.addEventListener('mousedown',function(e){var pg=document.getElementById('stockJalurPage');if(!pg||pg.style.display==='none')return;if(tbl&&!tbl.contains(e.target))_soClearSel();});
    // paste handled by _STOKInit
    tbody.addEventListener('blur',function(e){
      var td=e.target.closest('td[data-col]');if(!td)return;
      var col=td.dataset.col,tr=td.closest('tr');
      if(col==='qty') _sjSoEvalFormula(td);
      if(col==='sku')_sjLookupSku(tr,'nama');
      if(col==='plant')_sjApplyPlantBadge(td,'so');
      _soUpdateTotals();
    },true);
    // keydown handled by _STOKInit
  }
  function soZoom(d){_soZoom=Math.min(150,Math.max(60,_soZoom+d));var t=document.getElementById('soTbl');if(t)t.style.fontSize=(_soZoom/100*12)+'px';var l=document.getElementById('soZoomLabel');if(l)l.textContent=_soZoom+'%';}
  function soZoomReset(){_soZoom=100;var t=document.getElementById('soTbl');if(t)t.style.fontSize='';var l=document.getElementById('soZoomLabel');if(l)l.textContent='100%';}
  function soClearTable(){if(!confirm('Yakin clear data output?'))return;soInitRows(30);showToast('Tabel Output berhasil di-clear','');}
  function _soCollect(){
    var data=[];
    document.querySelectorAll('#soTbody tr').forEach(function(r){
      var prodate=_sjRawText(r.querySelector('[data-col="prodate"]')),sku=_sjRawText(r.querySelector('[data-col="sku"]'));
      var qty=_sjRawText(r.querySelector('[data-col="qty"]')),tglkeluar=_sjRawText(r.querySelector('[data-col="tglkeluar"]'));
      var nomobil=_sjRawText(r.querySelector('[data-col="nomobil"]')),nodo=_sjRawText(r.querySelector('[data-col="nodo"]'));
      var tujuan=_sjRawText(r.querySelector('[data-col="tujuan"]')),plant=_sjRawText(r.querySelector('[data-col="plant"]'));
      var status=_sjRawText(r.querySelector('[data-col="status"]'));
      var catatan=_sjRawText(r.querySelector('[data-col="catatan"]'))||'';
      if(status==='DONE')return;
      if(!sku||!prodate||!qty||!tglkeluar||!plant)return;
      var qtyNum=parseFloat(qty.replace(/\./g,'').replace(',','.'))||0;
      if(qtyNum<=0||['1111','1112','1113'].indexOf(plant)<0)return;
      data.push({prodate:prodate,sku:sku,qty:qtyNum,tglkeluar:tglkeluar,nomobil:nomobil,nodo:nodo,tujuan:tujuan,plant:plant,catatan:catatan,_row:r});
    });
    return data;
  }
  var _soSaving=false;
  function soSave(){
    if(_soSaving){showToast('\u23f3 Sedang memproses...','');return;}
    var data=_soCollect();
    if(!data||!data.length){showToast('\u26a0\ufe0f Tidak ada data baru (semua sudah DONE atau tidak valid).','error');return;}
    var payload=data.map(function(d){return {prodate:d.prodate,sku:d.sku,qty:d.qty,tglkeluar:d.tglkeluar,nomobil:d.nomobil,nodo:d.nodo,tujuan:d.tujuan,plant:d.plant,catatan:d.catatan||''};});
    var btn=document.getElementById('btnSoSave');
    if(btn){btn.disabled=true;btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Memproses...';}
    _soSaving=true;
    showToast('\u23f3 Memproses '+payload.length+' baris...','');
    API.rekapOutputJalur(payload,
      function(res){
        _soSaving=false;
        if(btn){btn.disabled=false;btn.innerHTML='<i class="fas fa-truck"></i> Simpan & Kirim';}
        if(res&&res.success){showToast('\u2705 Selesai! '+res.done+' berhasil.','success');_soMarkResult(data,res.results||[]);_soUpdateTotals();}
        else showToast('\u274c Gagal: '+(res&&res.message?res.message:'Unknown error'),'error');
      },
      function(err){
        _soSaving=false;
        if(btn){btn.disabled=false;btn.innerHTML='<i class="fas fa-truck"></i> Simpan & Kirim';}
        showToast('\u274c Error: '+(err&&err.message?err.message:String(err)),'error');
      });
  }
  function _soMarkResult(dataWithRows,results){
    dataWithRows.forEach(function(d,i){
      var r=d._row;if(!r)return;
      var res=results[i];if(!res)return;
      var statusTd=r.querySelector('[data-col="status"]');if(!statusTd)return;
      statusTd.innerHTML='';
      var cls=res.status.indexOf('DONE')===0?'so-status-done':(res.status.indexOf('Error')>=0||res.status.indexOf('kurang')>=0?'so-status-error':'so-status-warn');
      var s=document.createElement('span');s.className=cls;s.textContent=res.status;statusTd.appendChild(s);
      if(res.status.indexOf('DONE')===0)r.style.background='#f0fff4';
      else if(res.status.indexOf('Error')>=0||res.status.indexOf('kurang')>=0)r.style.background='#fff5f5';
      else r.style.background='#fffbeb';
    });
  }

  // =============================================
  // TAB REKAP — viewer kartu stock dari spreadsheet
  // =============================================
  var SR_SS_MAP = {
    '1111': [
      {label:'WAFER',      key:'wafer1', url:'https://docs.google.com/spreadsheets/d/1NfdZnC_C4S1HUwkzQcLDYUf4D7JKs2Gr82RWyPHkpc0/edit'},
      {label:'WAFER 2026', key:'wafer2', url:'https://docs.google.com/spreadsheets/d/1JnDnW5QGRX4rIm1IqTZTI2alt88ouCEzpyjpUXxJSVY/edit'}
    ],
    '1112': [
      {label:'BISKUIT',      key:'bisk1', url:'https://docs.google.com/spreadsheets/d/143003ya1y46YhAcM_PSfd5xbYDmzaYW6Qz11w5hjkJ8/edit'},
      {label:'BISKUIT 2026', key:'bisk2', url:'https://docs.google.com/spreadsheets/d/18Aq7G0fzbIXnSByubbJQZVDUurpeUV2R9fzG5A-ln4w/edit'}
    ],
    '1113': [
      {label:'BISKUIT',      key:'bisk1', url:'https://docs.google.com/spreadsheets/d/143003ya1y46YhAcM_PSfd5xbYDmzaYW6Qz11w5hjkJ8/edit'},
      {label:'BISKUIT 2026', key:'bisk2', url:'https://docs.google.com/spreadsheets/d/18Aq7G0fzbIXnSByubbJQZVDUurpeUV2R9fzG5A-ln4w/edit'}
    ]
  };

  var _srAllSheets=[];

  function srOnPlantChange(){
    var plant=document.getElementById('srPlant').value;
    var ssSel=document.getElementById('srSS');
    ssSel.innerHTML='<option value="">— Pilih Spreadsheet —</option>';
    _srResetSKU('— Pilih SS dulu —', true, true); // ganti SS = clear list
    srHideResult();
    if(!plant||!SR_SS_MAP[plant])return;
    SR_SS_MAP[plant].forEach(function(ss){
      var opt=document.createElement('option');
      opt.value=ss.key; opt.textContent=ss.label;
      ssSel.appendChild(opt);
    });
  }

  function srOnSSChange(){
    var plant=document.getElementById('srPlant').value;
    var ssKey=document.getElementById('srSS').value;
    // Reset cache & timer karena spreadsheet ganti
    _srSearchCache = {};
    _srSearchActive = '';
    if(_srSearchTimer){ clearTimeout(_srSearchTimer); _srSearchTimer=null; }
    _srResetSKU('— Pilih Plant & SS dulu —', true, true);
    srHideResult();
    if(!plant||!ssKey)return;
    var ssInfo=null;
    (SR_SS_MAP[plant]||[]).forEach(function(s){if(s.key===ssKey)ssInfo=s;});
    if(!ssInfo)return;
    // Tidak fetch sheet list — langsung enable input, user ketik baru fetch
    _srAllSheets=[];
    _srResetSKU('Ketik min. 2 karakter untuk cari SKU...', false, false);
  }

  // Debounce + cache untuk pencarian SKU on-demand
  var _srSearchTimer = null;
  var _srSearchCache = {};  // keyword → [sheet names]
  var _srSearchActive = ''; // keyword yang sedang di-fetch

  function _srResetSKU(placeholder, disabled, clearList){
    var inp=document.getElementById('srSKU');
    var dd=document.getElementById('srSKUDropdown');
    inp.value=''; inp.placeholder=placeholder; inp.disabled=!!disabled;
    inp.readOnly=false;
    if(dd) dd.style.display='none';
    if(clearList) _srAllSheets=[];
  }

  function srOpenDropdown(){
    var inp=document.getElementById('srSKU');
    if(inp.disabled) return;
    inp.readOnly=false;
    srFilterSKU(inp.value);
  }

  function _srDoSearch(keyword){
    var plant=document.getElementById('srPlant').value;
    var ssKey=document.getElementById('srSS').value;
    if(!plant||!ssKey) return;
    var ssInfo=null;
    (SR_SS_MAP[plant]||[]).forEach(function(s){if(s.key===ssKey)ssInfo=s;});
    if(!ssInfo) return;

    // Cek cache dulu
    if(_srSearchCache[keyword]){
      _srRenderDropdown(keyword, _srSearchCache[keyword]);
      return;
    }

    // Fetch dari server
    _srSearchActive = keyword;
    var dd=document.getElementById('srSKUDropdown');
    dd.innerHTML='<div class="sr-sku-empty"><i class="fas fa-spinner fa-spin" style="margin-right:6px;"></i>Mencari "'+_srEsc(keyword)+'"...</div>';
    dd.style.display='block';

    API.searchSheetNames(ssInfo.url, keyword,
      function(res){
        // Hanya render kalau keyword masih aktif (user belum ketik lagi)
        if(_srSearchActive!==keyword) return;
        var results = (res&&res.success&&res.sheets) ? res.sheets : [];
        _srSearchCache[keyword] = results;
        _srRenderDropdown(keyword, results);
      },
      function(){
        if(_srSearchActive!==keyword) return;
        dd.innerHTML='<div class="sr-sku-empty" style="color:#e53e3e;">Gagal memuat</div>';
      });
  }

  function _srRenderDropdown(keyword, list){
    var dd=document.getElementById('srSKUDropdown');
    if(!dd) return;
    if(!list||!list.length){
      dd.innerHTML='<div class="sr-sku-empty">Tidak ditemukan</div>';
      dd.style.display='block';
      return;
    }
    dd.innerHTML='';
    var kLow=(keyword||'').toLowerCase();
    list.forEach(function(s){
      var div=document.createElement('div');
      div.className='sr-sku-item';
      if(kLow){
        var idx=s.toLowerCase().indexOf(kLow);
        if(idx>=0){
          div.innerHTML=_srEsc(s.slice(0,idx))+'<strong>'+_srEsc(s.slice(idx,idx+kLow.length))+'</strong>'+_srEsc(s.slice(idx+kLow.length));
        } else {
          div.textContent=s;
        }
      } else {
        div.textContent=s;
      }
      div.addEventListener('mousedown',function(e){
        e.preventDefault();
        document.getElementById('srSKU').value=s;
        // Simpan ke _srAllSheets agar srLoad() bisa resolve
        if(_srAllSheets.indexOf(s)<0) _srAllSheets.push(s);
        dd.style.display='none';
      });
      dd.appendChild(div);
    });
    dd.style.display='block';
  }

  function srFilterSKU(q){
    var dd=document.getElementById('srSKUDropdown');
    if(!dd) return;
    var keyword=(q||'').trim();

    // Clear timer sebelumnya
    if(_srSearchTimer){ clearTimeout(_srSearchTimer); _srSearchTimer=null; }

    if(keyword.length < 2){
      dd.innerHTML='<div class="sr-sku-empty">Ketik min. 2 karakter untuk mulai mencari...</div>';
      dd.style.display='block';
      return;
    }

    // Debounce 350ms — tunggu user selesai mengetik
    _srSearchTimer = setTimeout(function(){
      _srDoSearch(keyword.toLowerCase());
    }, 350);
  }

  // Tutup dropdown saat klik di luar
  document.addEventListener('click',function(e){
    var wrap=document.getElementById('srSKU');
    var dd=document.getElementById('srSKUDropdown');
    if(dd&&wrap&&!wrap.contains(e.target)&&!dd.contains(e.target)){
      dd.style.display='none';
    }
  });

  function srHideResult(){
    document.getElementById('srSkuInfo').style.display='none';
    document.getElementById('srTable').style.display='none';
    document.getElementById('srEmpty').style.display='flex';
  }

  function _srEditCell(td){
    if(td.classList.contains('sr-editing')) return;
    var origText = td.textContent.trim();
    td.classList.add('sr-editing');
    td.innerHTML = '';
    var inp = document.createElement('input');
    inp.type = 'text';
    inp.value = origText;
    td.appendChild(inp);
    inp.focus(); inp.select();

    function save(){
      var newVal = inp.value.trim();
      td.classList.remove('sr-editing');
      td.innerHTML = newVal;
      if(newVal === origText) return;
      // Kirim ke GAS
      var blokIdx  = parseInt(td.dataset.blok);
      var ki       = parseInt(td.dataset.ki);
      var field    = td.dataset.field;
      var sheetName = _srCurrentSheet;
      var ssUrl     = _srCurrentSsUrl;
      if(!sheetName||!ssUrl){ showToast('Sheet tidak diketahui','error'); return; }
      td.style.opacity = '0.5';
      API.updateSrKirimCell({ssUrl: ssUrl, sheetName: sheetName, blokIdx: blokIdx, ki: ki, field: field, value: newVal},
        function(res){
          td.style.opacity = '';
          if(res && res.success){
            td.style.background='#c6f6d5'; td.style.outline='1px solid #38a169';
            setTimeout(function(){ td.style.background=''; td.style.outline=''; },1200);
          } else {
            showToast('❌ Gagal: '+(res&&res.message||'unknown'),'error');
            td.innerHTML = origText;
          }
        },
        function(e){
          td.style.opacity = '';
          showToast('❌ Error: '+e.message,'error');
          td.innerHTML = origText;
        });
    }

    inp.addEventListener('blur', save);
    inp.addEventListener('keydown', function(e){
      if(e.key === 'Enter'){ e.preventDefault(); inp.blur(); }
      if(e.key === 'Escape'){ inp.removeEventListener('blur', save); td.classList.remove('sr-editing'); td.innerHTML = origText; }
    });
  }

  function _srEditShift(td){
    if(td.classList.contains('sr-editing')) return;
    var origVal = td.textContent.trim();
    var blokIdx = parseInt(td.dataset.blok);
    var field   = td.dataset.field;
    var fieldLabel = field==='shift1'?'Shift 1':field==='shift2'?'Shift 2':'Shift 3';

    // Tampilkan modal input nilai + catatan
    var modal = document.getElementById('srShiftEditModal');
    if(!modal){
      modal = document.createElement('div');
      modal.id = 'srShiftEditModal';
      modal.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:99999;display:flex;align-items:center;justify-content:center;';
      modal.innerHTML =
        '<div style="background:#fff;border-radius:12px;padding:24px;min-width:340px;max-width:420px;box-shadow:0 8px 32px rgba(0,0,0,.18);">'+
          '<div style="font-weight:800;font-size:15px;color:#1a3a6b;margin-bottom:16px;">✏️ Edit <span id="srShiftLabel"></span></div>'+
          '<label style="font-size:12px;font-weight:700;color:#718096;text-transform:uppercase;letter-spacing:.5px;">Nilai Baru</label>'+
          '<input id="srShiftValInput" type="number" min="0" style="width:100%;margin:6px 0 14px;padding:8px 12px;border:2px solid #e2e8f0;border-radius:8px;font-size:15px;font-weight:700;box-sizing:border-box;" placeholder="Masukkan nilai...">'+
          '<label style="font-size:12px;font-weight:700;color:#718096;text-transform:uppercase;letter-spacing:.5px;">Catatan (wajib)</label>'+
          '<textarea id="srShiftNoteInput" rows="3" style="width:100%;margin:6px 0 14px;padding:8px 12px;border:2px solid #e2e8f0;border-radius:8px;font-size:13px;resize:vertical;box-sizing:border-box;" placeholder="Alasan perubahan..."></textarea>'+
          '<div style="display:flex;gap:8px;justify-content:flex-end;">'+
            '<button onclick="_srShiftEditCancel()" style="padding:8px 18px;border:1.5px solid #e2e8f0;border-radius:8px;background:#fff;cursor:pointer;font-weight:700;color:#718096;">Batal</button>'+
            '<button onclick="_srShiftEditSave()" style="padding:8px 18px;border:none;border-radius:8px;background:linear-gradient(135deg,#1a3a6b,#2563eb);color:#fff;cursor:pointer;font-weight:700;">Simpan</button>'+
          '</div>'+
        '</div>';
      document.body.appendChild(modal);
    }

    // Set state ke modal
    modal._td        = td;
    modal._origVal   = origVal;
    modal._blokIdx   = blokIdx;
    modal._field     = field;
    modal._ssUrl     = _srCurrentSsUrl;
    modal._sheetName = _srCurrentSheet;

    document.getElementById('srShiftLabel').textContent = fieldLabel;
    var valInput  = document.getElementById('srShiftValInput');
    var noteInput = document.getElementById('srShiftNoteInput');
    valInput.value  = origVal.replace(/\./g,'').replace(',','') || '';
    noteInput.value = '';
    valInput.style.borderColor='';
    noteInput.style.borderColor='';

    modal.style.display='flex';
    setTimeout(function(){ valInput.focus(); valInput.select(); }, 50);
  }

  function _srShiftEditCancel(){
    var modal=document.getElementById('srShiftEditModal');
    if(modal) modal.style.display='none';
  }

  function _srShiftEditSave(){
    var modal=document.getElementById('srShiftEditModal');
    var valInput  = document.getElementById('srShiftValInput');
    var noteInput = document.getElementById('srShiftNoteInput');
    var newVal    = valInput.value.trim();
    var catatan   = noteInput.value.trim();

    // Validasi
    if(newVal===''||isNaN(Number(newVal))){
      valInput.style.borderColor='#e53e3e'; valInput.focus(); return;
    }
    if(!catatan){
      noteInput.style.borderColor='#e53e3e'; noteInput.focus(); return;
    }

    var td        = modal._td;
    var origVal   = modal._origVal;
    if(newVal===origVal){ _srShiftEditCancel(); return; }

    modal.style.display='none';
    td.style.opacity='0.5';

    API.updateSrShiftCell(function(res){
        td.style.opacity='';
        if(res&&res.success){
          td.textContent=Number(newVal).toLocaleString('id-ID');
          td.style.background='#c6f6d5'; td.style.outline='1px solid #38a169';
          setTimeout(function(){ td.style.background=''; td.style.outline=''; },1500);
        } else {
          showToast('❌ Gagal: '+(res&&res.message||'unknown'),'error');
          td.textContent=origVal;
        }
      },
      function(e){
        td.style.opacity='';
        showToast('❌ Error: '+e.message,'error');
        td.textContent=origVal;
      });
        ssUrl     : modal._ssUrl,
        sheetName : modal._sheetName,
        blokIdx   : modal._blokIdx,
        field     : modal._field,
        value     : Number(newVal),
        catatan   : catatan
      });
  }

  function _srShowShiftNote(el){
    var note=(el.dataset.note||'').replace(/&#10;/g,'\n');
    if(!note) return;
    var td=el.closest('td'); var field=td?td.dataset.field:'';
    var lbl=field==='shift1'?'Shift 1':field==='shift2'?'Shift 2':'Shift 3';
    var existing=document.getElementById('srShiftNotePopup');
    if(existing) existing.remove();
    var html='<div id="srShiftNotePopup" style="position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(0,0,0,.45);" onclick="if(event.target===this)document.getElementById(\'srShiftNotePopup\').remove();">'+
      '<div style="background:#fff;border-radius:14px;box-shadow:0 8px 40px rgba(0,0,0,.25);max-width:380px;width:100%;padding:20px;">'+
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">'+
      '<div style="font-size:13px;font-weight:800;color:#2d3748;"><i class="fas fa-sticky-note" style="color:#e53e3e;margin-right:6px;"></i>Catatan '+lbl+'</div>'+
      '<button onclick="document.getElementById(\'srShiftNotePopup\').remove()" style="border:none;background:none;cursor:pointer;font-size:18px;color:#718096;">&times;</button>'+
      '</div>'+
      '<div style="background:#fff5f5;border-left:3px solid #fc8181;border-radius:6px;padding:12px 14px;font-size:13px;color:#742a2a;line-height:1.6;white-space:pre-wrap;">'+note.replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</div>'+
      '</div></div>';
    document.body.insertAdjacentHTML('beforeend',html);
  }

  function srLoad(){
    var plant  = document.getElementById('srPlant').value;
    var ssKey  = document.getElementById('srSS').value;
    var inputVal = (document.getElementById('srSKU').value||'').trim();
    if(!plant||!ssKey||!inputVal){showToast('\u26a0\ufe0f Pilih Plant, Spreadsheet, dan Kode Barang terlebih dahulu','error');return;}

    // Resolve nama sheet — cari di _srAllSheets (hasil yang sudah dipilih user)
    // atau fallback: kirim inputVal langsung ke server, biar server yang cari
    var sku=inputVal;
    if(_srAllSheets.length){
      // 1. Exact match
      var exact=_srAllSheets.filter(function(s){return s===inputVal;});
      if(exact.length){
        sku=exact[0];
      } else {
        // 2. Case-insensitive exact
        var ciExact=_srAllSheets.filter(function(s){return s.toLowerCase()===inputVal.toLowerCase();});
        if(ciExact.length){
          sku=ciExact[0];
        }
        // Kalau tidak ada match pun, biarkan sku=inputVal → server akan cari
      }
    }

    var ssInfo=null;
    (SR_SS_MAP[plant]||[]).forEach(function(s){if(s.key===ssKey)ssInfo=s;});
    if(!ssInfo)return;
    var pdfBtn=document.getElementById('srPdfBtn');
    if(pdfBtn)pdfBtn.style.display='none';
    document.getElementById('srLoading').style.display='flex';
    document.getElementById('srEmpty').style.display='none';
    document.getElementById('srTable').style.display='none';
    document.getElementById('srSkuInfo').style.display='none';
    API.getKartuStock(ssInfo.url, sku,
      function(res){
        document.getElementById('srLoading').style.display='none';
        if(!res||!res.success){showToast('\u274c Gagal: '+(res&&res.message?res.message:'error'),'error');srHideResult();return;}
        srRender(res, plant, ssInfo.label, sku);
      },
      function(err){
        document.getElementById('srLoading').style.display='none';
        showToast('\u274c Error: '+(err&&err.message?err.message:String(err)),'error');
        srHideResult();
      });
  }

  function srRender(res, plant, ssLabel, skuName){
    _srCurrentSheet  = res.sheetName || '';
    _srCurrentSsUrl  = res.ssUrl     || '';
    // Info SKU
    var info=document.getElementById('srSkuInfo');
    info.style.display='block';
    document.getElementById('srSkuNama').textContent=res.nama||skuName;
    var skuDisplay=res.sku||(skuName.match(/^(\d{6,8})/)||[])[1]||skuName;
    document.getElementById('srSkuKode').textContent=skuDisplay;
    document.getElementById('srSkuPlant').textContent=plant+' \u2014 '+ssLabel;
    var sisaEl=document.getElementById('srSkuSisa');
    var sisaNum=Number(res.sisaTotal)||0;
    sisaEl.textContent=sisaNum.toLocaleString('id-ID')+' Krt';
    sisaEl.style.color=sisaNum>0?'#c05621':'#9b2c2c';

    function fmtNum(v){
      if(v===null||v===undefined||v==='')return '';
      var n=Number(String(v).replace(/[^0-9.-]/g,''));
      return isNaN(n)?String(v):n.toLocaleString('id-ID');
    }

    var thead=document.getElementById('srThead');
    var tbody=document.getElementById('srTbody');
    var bloks=res.bloks||[];

    // Hitung jumlah kolom pengiriman maksimal
    var maxKirim=0;
    bloks.forEach(function(b){ if((b.kirim||[]).length>maxKirim) maxKirim=(b.kirim||[]).length; });
    maxKirim=Math.max(maxKirim,1);

    // ── Header 2 baris ─────────────────────────────────────────
    var th1='<tr>';
    th1+='<th rowspan="2" style="text-align:center;min-width:36px;vertical-align:middle;">No.</th>';
    th1+='<th rowspan="2" style="min-width:110px;text-align:center;vertical-align:middle;">TGL PRODUKSI</th>';
    th1+='<th colspan="4" style="text-align:center;">OUTPUT PROD.</th>';
    th1+='<th rowspan="2" style="min-width:80px;text-align:center;vertical-align:middle;">SISA STOCK</th>';
    th1+='<th rowspan="2" style="min-width:90px;text-align:center;vertical-align:middle;"></th>';
    // PENGIRIMAN = 1 header colspan semua kolom pengiriman, rowspan 2
    if(maxKirim>0){
      th1+='<th rowspan="2" colspan="'+maxKirim+'" style="text-align:center;vertical-align:middle;min-width:'+(maxKirim*120)+'px;">PENGIRIMAN</th>';
    }
    th1+='</tr>';

    var th2='<tr>';
    th2+='<th style="min-width:70px;text-align:center;">SHIFT 1</th>';
    th2+='<th style="min-width:70px;text-align:center;">SHIFT 2</th>';
    th2+='<th style="min-width:70px;text-align:center;">SHIFT 3</th>';
    th2+='<th style="min-width:70px;text-align:center;">TOTAL</th>';
    th2+='</tr>';
    thead.innerHTML=th1+th2;

    if(bloks.length===0){
      tbody.innerHTML='<tr><td colspan="'+(8+maxKirim)+'" style="text-align:center;color:#a0aec0;padding:30px;">Tidak ada data produksi</td></tr>';
      document.getElementById('srTable').style.display='table';
      document.getElementById('srEmpty').style.display='none';
      return;
    }

    var LABELS=['TANGGAL','TUJUAN','NO. DO','NO. MOBIL','JUMLAH'];
    var KIRIM_KEYS=['tanggal','tujuan','noDO','noMobil','jumlah'];

    var rows='';
    bloks.forEach(function(blok, blokIdx){
      var sisa=Number(blok.sisa)||0;
      var kirimList=blok.kirim||[];
      while(kirimList.length<maxKirim) kirimList.push({tanggal:'',tujuan:'',noDO:'',noMobil:'',jumlah:''});

      for(var rowIdx=0;rowIdx<5;rowIdx++){
        var isFirst=(rowIdx===0);
        var isJml=(rowIdx===4);
        var label=LABELS[rowIdx];
        var kirimKey=KIRIM_KEYS[rowIdx];

        var nfClass=blok.nonFifo?' sr-non-fifo':'';
        rows+='<tr class="'+(isFirst?'sr-blok-first':'sr-blok-sub')+nfClass+'">';

        if(isFirst){
          var ns1=blok.noteShift1||'', ns2=blok.noteShift2||'', ns3=blok.noteShift3||'';
          function shiftCell(field,val,note){
            var dot=note?'<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#e53e3e;margin-left:4px;vertical-align:middle;cursor:pointer;" onclick="_srShowShiftNote(this)" data-note="'+note.replace(/"/g,'&quot;').replace(/\n/g,'&#10;')+'" title="Ada catatan"></span>':'';
            return '<td rowspan="5" class="sr-editable" style="text-align:center;vertical-align:middle;" data-blok="'+blokIdx+'" data-field="'+field+'" ondblclick="_srEditShift(this)">'+fmtNum(val)+dot+'</td>';
          }
          rows+='<td rowspan="5" style="text-align:center;vertical-align:middle;font-weight:800;">'+_srEsc(String(blok.no||''))+'</td>';
          rows+='<td rowspan="5" style="text-align:center;vertical-align:middle;font-weight:800;" data-blok="'+blokIdx+'" data-field="tglProd">'+_srEsc(String(blok.tglProd||''))+'</td>';
          rows+=shiftCell('shift1',blok.shift1,ns1);
          rows+=shiftCell('shift2',blok.shift2,ns2);
          rows+=shiftCell('shift3',blok.shift3,ns3);
          rows+='<td rowspan="5" style="text-align:center;vertical-align:middle;font-weight:800;" data-blok="'+blokIdx+'" data-field="total">'+fmtNum(blok.total)+'</td>';
          rows+='<td rowspan="5" style="text-align:center;vertical-align:middle;font-weight:800;" class="'+(sisa>0?'sr-sisa-pos':'sr-sisa-zero')+'" data-blok="'+blokIdx+'" data-field="sisa">'+sisa.toLocaleString('id-ID')+'</td>';
        }

        // Label cell
        rows+='<td class="sr-label-cell">'+label+'</td>';

        // Nilai pengiriman — editable on dblclick
        for(var ki=0;ki<maxKirim;ki++){
          var k=blok.kirim[ki]||{};
          var val='';
          if(rowIdx===0) val=_srEsc(String(k.tanggal||''));
          else if(rowIdx===1) val=_srEsc(String(k.tujuan||''));
          else if(rowIdx===2) val=_srEsc(String(k.noDO||''));
          else if(rowIdx===3) val=_srEsc(String(k.noMobil||''));
          else if(rowIdx===4){
            var hasCat=k.catatan&&k.catatan.trim();
            if(hasCat){
              val='<span style="position:relative;display:inline-flex;align-items:center;gap:4px;cursor:pointer;" onclick="_srShowCatatanKirim(this)" data-cat="'+k.catatan.replace(/"/g,'&quot;').replace(/\n/g,'&#10;')+'">'+fmtNum(k.jumlah)+'<span style="width:7px;height:7px;border-radius:50%;background:#e53e3e;flex-shrink:0;" title="Ada catatan"></span></span>';
            } else {
              val=fmtNum(k.jumlah);
            }
          }
          rows+='<td class="sr-kirim-val sr-editable" data-blok="'+blokIdx+'" data-ki="'+ki+'" data-field="'+kirimKey+'" ondblclick="_srEditCell(this)">'+val+'</td>';
        }

        rows+='</tr>';
      }

      rows+='<tr class="sr-sep"><td colspan="'+(8+maxKirim)+'"></td></tr>';
    });

    tbody.innerHTML=rows;
    document.getElementById('srTable').style.display='table';
    document.getElementById('srEmpty').style.display='none';
    // Tampilkan tombol PDF
    var pdfBtn=document.getElementById('srPdfBtn');
    if(pdfBtn){pdfBtn.style.display='flex';}
  }

  function srDownloadPdf(){
    var tbl=document.getElementById('srTable');
    if(!tbl||tbl.style.display==='none'){showToast('\u26a0\ufe0f Tampilkan data dulu','error');return;}

    var nama=document.getElementById('srSkuNama').textContent||'';
    var sku =document.getElementById('srSkuKode').textContent||'';
    var plant=document.getElementById('srSkuPlant').textContent||'';
    var sisa=document.getElementById('srSkuSisa').textContent||'';
    var title='KARTU STOCK \u2014 '+sku+' '+nama;

    var w=window.open('','_blank','width=1200,height=800');
    if(!w){showToast('\u26a0\ufe0f Pop-up diblokir browser','error');return;}

    // Clone tabel, hapus separator, hapus min-width agar auto-fit
    var tblClone=tbl.cloneNode(true);
    tblClone.querySelectorAll('tr.sr-sep').forEach(function(r){r.remove();});
    // Hapus semua inline style width/min-width pada th & td
    tblClone.querySelectorAll('th,td').forEach(function(el){
      el.style.minWidth='';
      el.style.width='';
      el.style.maxWidth='';
    });

    var html='<!DOCTYPE html><html><head><meta charset="UTF-8">';
    html+='<title>'+title+'</title>';
    html+='<style>';
    html+='*{box-sizing:border-box;}';
    html+='body{font-family:Arial,sans-serif;font-size:9px;color:#1a202c;margin:0;padding:10px;}';
    html+='.hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;border-bottom:2px solid #0f2027;padding-bottom:6px;}';
    html+='.hdr-title{font-size:12px;font-weight:800;color:#0f2027;}';
    html+='.hdr-sub{font-size:9px;color:#4a5568;margin-top:2px;}';
    html+='.hdr-sisa{font-size:15px;font-weight:800;color:#c05621;}';
    html+='.hdr-sisa-lbl{font-size:8px;color:#718096;text-transform:uppercase;letter-spacing:.5px;}';
    // Kunci: table-layout:auto + width:auto agar kolom menyesuaikan konten
    html+='table{border-collapse:collapse;width:auto;table-layout:auto;font-size:9px;}';
    html+='thead tr:nth-child(1) th{background:#0f2027;color:#fff;padding:4px 6px;text-align:center;font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:.3px;border:1px solid rgba(255,255,255,.2);white-space:nowrap;}';
    html+='thead tr:nth-child(2) th{background:#1a3a5c;color:#e2e8f0;padding:3px 6px;text-align:center;font-size:8px;font-weight:700;border:1px solid rgba(255,255,255,.15);white-space:nowrap;}';
    html+='tbody td{padding:3px 6px;border:1px solid #d1d5db;text-align:center;vertical-align:middle;white-space:nowrap;}';
    html+='.sr-blok-first td{background:#e6f4ea;}';
    html+='.sr-blok-sub td{background:#fff;}';
    // Label cell — sedikit lebih lebar karena ada teks
    html+='.sr-label-cell{background:#b8ddd0 !important;color:#0d3325 !important;font-weight:800;font-size:8px;text-transform:uppercase;letter-spacing:.3px;text-align:left !important;padding:3px 7px !important;white-space:nowrap;}';
    html+='.sr-blok-sub .sr-label-cell{background:#d4e9f7 !important;color:#1a3a5c !important;}';
    html+='.sr-sisa-pos{color:#276749;font-weight:800;}';
    html+='.sr-sisa-zero{color:#9b2c2c;font-weight:800;}';
    html+='@media print{';
    html+='@page{size:landscape;margin:8mm;}';
    html+='body{padding:0;font-size:8px;}';
    html+='table{font-size:8px;}';
    html+='-webkit-print-color-adjust:exact;print-color-adjust:exact;';
    html+='}';
    html+='</style></head><body>';
    html+='<div class="hdr">';
    html+='<div>';
    html+='<div class="hdr-title">'+title+'</div>';
    html+='<div class="hdr-sub">'+plant+'</div>';
    html+='<div class="hdr-sub">Dicetak: '+new Date().toLocaleString('id-ID')+'</div>';
    html+='</div>';
    html+='<div style="text-align:right;">';
    html+='<div class="hdr-sisa-lbl">Sisa Stock</div>';
    html+='<div class="hdr-sisa">'+sisa+'</div>';
    html+='</div>';
    html+='</div>';
    html+=tblClone.outerHTML;
    html+='</body></html>';

    w.document.write(html);
    w.document.close();
    setTimeout(function(){w.print();},400);
  }

  function _srFmtDate(val){
    if(!val)return '';
    if(val instanceof Date)return val.toLocaleDateString('id-ID',{day:'2-digit',month:'2-digit',year:'numeric'});
    return String(val);
  }
  function _srEsc(v){ return v?String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;'):''; }

  // ═══════════════════════════════════════════════════════
  // BIN LOC MONITORING
  // ═══════════════════════════════════════════════════════
  var _blData      = [];
  var _blFiltered  = [];
  var _blStdMap    = {};   // { skuKode: std } dari sheet STD
  var _blTimer     = null;
  var _blInterval  = 30;
  var _blCountdown = 0;
  var _blLoading   = false;
