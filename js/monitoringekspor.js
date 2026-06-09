// ============================================================
// monitoringekspor.js — MONITORING GDFG
// Halaman: Monitoring Ekspor
// Tab: Summary (data dari sheet ANTRIAN) | Input Planning
// ============================================================

// ── State ────────────────────────────────────────────────────
var _mekFilterMode  = 'date';   // 'date' | 'week'
var _mekSummaryData = [];

// ── Inisialisasi halaman ─────────────────────────────────────
function mekInitPage() {
  var today  = new Date();
  var yyyy   = today.getFullYear();
  var mm     = String(today.getMonth() + 1).padStart(2, '0');
  var dd     = String(today.getDate()).padStart(2, '0');
  var ymd    = yyyy + '-' + mm + '-' + dd;
  var ymFrom = yyyy + '-' + mm + '-01';

  var elFrom = document.getElementById('mekFilterFrom');
  var elTo   = document.getElementById('mekFilterTo');
  if (elFrom && !elFrom.value) elFrom.value = ymFrom;
  if (elTo   && !elTo.value)   elTo.value   = ymd;

  var elYear = document.getElementById('mekFilterWeekYear');
  if (elYear && !elYear.value) elYear.value = yyyy;

  mekSwitchFilterMode('date');
  mekSwitchTab('summary');
  mekSwitchSumView('all');
  _mekCapMode = 'all';
  _mekInitPlanningWa();
}

// ════════════════════════════════════════════════════════════
// FILTER MODE — Tanggal / Week
// ════════════════════════════════════════════════════════════
function mekSwitchFilterMode(mode) {
  _mekFilterMode = mode;
  var btnDate = document.getElementById('mekBtnFilterDate');
  var btnWeek = document.getElementById('mekBtnFilterWeek');
  var divDate = document.getElementById('mekFilterModeDate');
  var divWeek = document.getElementById('mekFilterModeWeek');
  var infoEl  = document.getElementById('mekWeekFilterInfo');

  if (btnDate) btnDate.classList.toggle('active', mode === 'date');
  if (btnWeek) btnWeek.classList.toggle('active', mode === 'week');
  if (divDate) divDate.style.display = mode === 'date' ? '' : 'none';
  if (divWeek) divWeek.style.display = mode === 'week' ? '' : 'none';
  if (infoEl)  infoEl.style.display  = 'none';
}

function _mekGetISOWeekRange(week, year) {
  var jan4 = new Date(Date.UTC(year, 0, 4));
  var dow  = jan4.getUTCDay() || 7;
  var mondayW1 = new Date(jan4);
  mondayW1.setUTCDate(jan4.getUTCDate() - (dow - 1));
  var monday = new Date(mondayW1);
  monday.setUTCDate(mondayW1.getUTCDate() + (week - 1) * 7);
  var sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  return { from: monday.toISOString().slice(0, 10), to: sunday.toISOString().slice(0, 10) };
}

// Hitung ISO week number dari string "YYYY-MM-DD"
function _mekDateToISOWeek(ymd) {
  if (!ymd) return 0;
  var d = new Date(ymd + 'T00:00:00Z');
  var day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function _mekFmtTglDisplay(ymd) {
  if (!ymd) return '';
  var p = ymd.split('-');
  return p[2] + '/' + p[1] + '/' + p[0];
}

function mekApplyWeekFilter() {
  var wFrom = parseInt((document.getElementById('mekFilterWeekFrom') || {}).value) || 0;
  var wTo   = parseInt((document.getElementById('mekFilterWeekTo')   || {}).value) || wFrom;
  var year  = parseInt((document.getElementById('mekFilterWeekYear') || {}).value) || new Date().getFullYear();

  if (!wFrom) { showToast('Isi nomor Week', 'warning'); return; }
  if (wFrom > wTo) { showToast('Week dari harus ≤ Week sampai', 'warning'); return; }

  var rangeFrom = _mekGetISOWeekRange(wFrom, year);
  var rangeTo   = _mekGetISOWeekRange(wTo,   year);
  var from = rangeFrom.from;
  var to   = rangeTo.to;

  var elFrom = document.getElementById('mekFilterFrom'); if (elFrom) elFrom.value = from;
  var elTo   = document.getElementById('mekFilterTo');   if (elTo)   elTo.value   = to;

  // Sync No.Pol / No.DOC / Tujuan dari field week ke date supaya mekLoadSummary baca dari satu tempat
  var nopolW  = (document.getElementById('mekFilterSkuW')   || {}).value || '';
  var nodocW  = (document.getElementById('mekFilterNoDocW') || {}).value || '';
  var destW   = (document.getElementById('mekFilterDestW')  || {}).value || '';
  var elNopol = document.getElementById('mekFilterNopol');  if (elNopol) elNopol.value = nopolW;
  var elNoDoc = document.getElementById('mekFilterNoDoc');  if (elNoDoc) elNoDoc.value = nodocW;
  var elDest  = document.getElementById('mekFilterDest');   if (elDest)  elDest.value  = destW;

  var infoTxt = document.getElementById('mekWeekFilterInfoText');
  if (infoTxt) infoTxt.innerText =
    'Week ' + wFrom + (wFrom !== wTo ? ' – Week ' + wTo : '') + ' ' + year +
    ' = ' + _mekFmtTglDisplay(from) + ' s/d ' + _mekFmtTglDisplay(to);
  var infoEl = document.getElementById('mekWeekFilterInfo');
  if (infoEl) infoEl.style.display = 'block';

  mekLoadSummary();
}

function mekResetFilter() {
  var today  = new Date();
  var yyyy   = today.getFullYear();
  var mm     = String(today.getMonth() + 1).padStart(2, '0');
  var dd     = String(today.getDate()).padStart(2, '0');
  var ymFrom = yyyy + '-' + mm + '-01';
  var ymd    = yyyy + '-' + mm + '-' + dd;

  ['mekFilterFrom',ymFrom,'mekFilterTo',ymd].forEach(function(_,i,a){ if(i%2===0){ var e=document.getElementById(a[i]); if(e)e.value=a[i+1]; } });
  ['mekFilterSku','mekFilterNopol','mekFilterNoDoc','mekFilterDest',
   'mekFilterWeekFrom','mekFilterWeekTo','mekFilterSkuW','mekFilterNoDocW','mekFilterDestW']
    .forEach(function(id){ var e=document.getElementById(id); if(e) e.value=''; });
  var ii = document.getElementById('mekWeekFilterInfo'); if (ii) ii.style.display = 'none';
}

// ── Tab switching ─────────────────────────────────────────────
function mekSwitchTab(tab) {
  var panes = { summary: 'mekSummaryPane', input: 'mekInputPane', planning: 'mekPlanningPane' };
  var tabs  = { summary: 'mekTabSummary',  input: 'mekTabInput',  planning: 'mekTabPlanning'  };
  var ac = '#1a3a5c';

  Object.keys(panes).forEach(function(t) {
    var pane = document.getElementById(panes[t]);
    var btn  = document.getElementById(tabs[t]);
    if (pane) {
      if (t === tab) {
        pane.style.opacity = '0'; pane.style.display = 'flex'; pane.style.flexDirection = 'column';
        pane.style.transition = 'opacity .2s ease';
        requestAnimationFrame(function(){ requestAnimationFrame(function(){ pane.style.opacity = '1'; }); });
      } else {
        pane.style.display = 'none';
      }
    }
    if (btn) {
      btn.style.color = t===tab ? ac : '#718096';
      btn.style.borderBottomColor = t===tab ? ac : 'transparent';
    }
  });

  var bsEl = document.getElementById('btnMekSummary'); if (bsEl) bsEl.style.background = tab==='summary'?'rgba(255,255,255,.35)':'rgba(255,255,255,.2)';
  var biEl = document.getElementById('btnMekInput');   if (biEl) biEl.style.background = tab==='input'?'rgba(255,255,255,.35)':'rgba(255,255,255,.2)';

  // Sembunyikan toggle Capaian/Detail saat di tab selain Summary
  var sumToggle = document.getElementById('mekSumViewToggle');
  if (sumToggle) sumToggle.style.display = tab === 'summary' ? '' : 'none';
}

// ════════════════════════════════════════════════════════════
// TAB PLANNING — baca dan edit PLANNING_EKSPOR (source EMAIL)
// ════════════════════════════════════════════════════════════
var _mekPlanningData = [];

var _MEK_PLAN_COLS = [
  {key:'week',        label:'WEEK',           ro:true},  // read-only, dihitung otomatis
  {key:'keterangan',  label:'KETERANGAN'},
  {key:'so',          label:'SO'},
  {key:'qt',          label:'QT'},
  {key:'negara',      label:'NEGARA'},
  {key:'sku',         label:'KODE'},
  {key:'nama',        label:'MATERIAL'},
  {key:'stuffingDate',label:'STUFFING DATE'},
  {key:'jumlahCont',  label:'QTY CONT', right:true},
  {key:'ready',       label:'READY/NOT'},
  {key:'email',       label:'EMAIL'},
  {key:'rsvCrt',      label:'RSV CRT', right:true},
  {key:'poSto',       label:'PO STO/PO INT'},
  {key:'doSto',       label:'DO STO/DO INT'},
  {key:'note',        label:'NOTE'}
];

function mekLoadPlanningTab() {
  var wFrom = parseInt((document.getElementById('mekPlanWeekFrom')||{}).value||'') || 0;
  var wTo   = parseInt((document.getElementById('mekPlanWeekTo')  ||{}).value||'') || wFrom;
  var year  = parseInt((document.getElementById('mekPlanYear')    ||{}).value||'') || new Date().getFullYear();
  if (!wFrom) { showToast('Isi week terlebih dahulu.', 'warning'); return; }

  var tbody = document.getElementById('mekPlanningTbody');
  var empty = document.getElementById('mekPlanningEmpty');
  var cnt   = document.getElementById('mekPlanRowCount');
  if (tbody) tbody.innerHTML = '<tr><td colspan="17" style="text-align:center;padding:30px;color:#a0aec0;">Memuat...</td></tr>';
  if (empty) empty.style.display = 'none';

  API.run('getMekEmailPlanning', { weekFrom: wFrom, weekTo: wTo, year: year }, function(res) {
    if (!res || !res.success) {
      if (tbody) tbody.innerHTML = '<tr><td colspan="17" style="text-align:center;padding:30px;color:#fc8181;">Gagal: '+(res&&res.message?res.message:'error')+'</td></tr>';
      return;
    }
    _mekPlanningData = res.data || [];
    if (cnt) { cnt.textContent = _mekPlanningData.length + ' baris'; cnt.style.display = _mekPlanningData.length ? '' : 'none'; }
    if (!_mekPlanningData.length) {
      if (tbody) tbody.innerHTML = '';
      if (empty) empty.style.display = '';
      return;
    }
    _mekRenderPlanningTab(_mekPlanningData);
  });
}

function _mekRenderPlanningTab(data) {
  var tbody = document.getElementById('mekPlanningTbody');
  if (!tbody) return;

  var ES = 'outline:none;padding:5px 6px;font-size:12px;white-space:nowrap;cursor:text;' +
           'min-width:60px;display:block;border-radius:4px;transition:background .15s;';

  tbody.innerHTML = data.map(function(r, i) {
    var cells = _MEK_PLAN_COLS.map(function(col) {
      var val = r[col.key] !== undefined ? String(r[col.key]) : '';
      var td;
      if (col.ro) {
        td = '<td style="text-align:center;background:#f8fafc;color:#718096;font-size:11px;font-weight:700;padding:5px 8px;">' + _mekEsc(val) + '</td>';
      } else {
        td = '<td><span contenteditable="true"';
        td += ' data-row="'+i+'" data-col="'+col.key+'"';
        td += ' style="'+ES+(col.right?'text-align:right;':'')+'color:#2d3748;"';
        td += ' onblur="_mekPlanCellEdit('+i+',\''+col.key+'\',this.innerText.trim())"';
        td += ' onkeydown="if(event.key===String.fromCharCode(13)){event.preventDefault();this.blur();}">';
        td += _mekEsc(val) + '</span></td>';
      }
      return td;
    }).join('');

    return '<tr style="'+(i%2===0?'':'background:#f8fafc;')+'">' +
      '<td style="text-align:center;color:#a0aec0;font-size:11px;font-weight:700;background:#f8fafc;">' + (i+1) + '</td>' +
      cells +
      '<td style="text-align:center;">' +
        '<button onclick="_mekSavePlanningRow('+i+')" ' +
          'style="padding:3px 10px;border-radius:6px;border:none;background:#1a3a5c;color:#fff;font-size:11px;cursor:pointer;font-weight:700;">' +
          'Simpan</button>' +
      '</td>' +
      '</tr>';
  }).join('');
}

function _mekPlanCellEdit(rowIdx, colKey, val) {
  if (_mekPlanningData[rowIdx]) {
    _mekPlanningData[rowIdx][colKey] = val;
    _mekPlanningData[rowIdx]._dirty = true;
  }
}

function _mekSavePlanningRow(rowIdx) {
  var r = _mekPlanningData[rowIdx];
  if (!r) return;
  var status = document.getElementById('mekPlanSaveStatus');
  if (status) status.textContent = 'Menyimpan baris '+(rowIdx+1)+'...';

  API.run('updateMekEmailPlanningRow', { rowIdx: r._rowIdx, fields: r }, function(res) {
    if (res && res.success) {
      _mekPlanningData[rowIdx]._dirty = false;
      if (status) status.textContent = 'Baris '+(rowIdx+1)+' tersimpan ✓';
      setTimeout(function(){ if(status) status.textContent=''; }, 3000);
    } else {
      var msg = res && res.message ? res.message : 'error';
      showToast('Gagal simpan: '+msg, 'error');
      if (status) status.textContent = '';
    }
  });
}

// ── Helper: hapus angka 0 di depan (untuk No. DOC) ───────────
// "00123456" → "123456", "0001A" → "1A", "AB001" → "AB001" (tidak diubah jika non-numerik di depan)
function _mekStripLeadingZero(s) {
  var str = String(s || '').trim();
  // Hapus semua 0 di depan, tapi sisakan minimal 1 karakter
  return str.replace(/^0+(?=\S)/, '');
}

// ════════════════════════════════════════════════════════════
// TAB SUMMARY — baca dari sheet ANTRIAN
// Kolom yang ditampilkan:
//   D = No Pol, E = Ekspedisi, F = No DOC, I = Tujuan,
//   L = Waktu Daftar, P = Waktu Keluar
// ════════════════════════════════════════════════════════════
function mekLoadSummary() {
  var from  = (document.getElementById('mekFilterFrom')   || {}).value || '';
  var to    = (document.getElementById('mekFilterTo')     || {}).value || '';
  var nopol = ((document.getElementById('mekFilterNopol') || {}).value || '').trim().toLowerCase();
  var nodoc = ((document.getElementById('mekFilterNoDoc') || {}).value || '').trim();
  var dest  = ((document.getElementById('mekFilterDest')  || {}).value || '').trim().toLowerCase();

  // Strip leading zeros dari input pencarian No. DOC
  // "00123" → "123", sehingga cocok dengan data yang juga sudah di-strip
  var nodocStripped = _mekStripLeadingZero(nodoc).toLowerCase();

  var tbody = document.getElementById('mekSumTbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:50px;color:#a0aec0;">' +
    '<i class="fas fa-spinner fa-spin" style="font-size:24px;"></i></td></tr>';

  API.run('getMekAntrianData', { from: from, to: to }, function (res) {
    if (!res || !res.success) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:#fc8181;">' +
        '<i class="fas fa-exclamation-triangle" style="font-size:24px;display:block;margin-bottom:8px;"></i>' +
        'Gagal memuat data: ' + (res && res.message ? res.message : 'Unknown error') + '</td></tr>';
      return;
    }
    var data = res.data || [];

    // Filter lokal — semua pakai strip-leading-zero untuk No. DOC
    if (nopol)         data = data.filter(function (r) { return (r.nopol  || '').toLowerCase().indexOf(nopol) >= 0; });
    if (nodocStripped) data = data.filter(function (r) { return _mekStripLeadingZero(r.noDoc || '').toLowerCase().indexOf(nodocStripped) >= 0; });
    if (dest)          data = data.filter(function (r) { return (r.tujuan || '').toLowerCase().indexOf(dest)  >= 0; });

    // Sort by waktuDaftar ascending (tanggal terkecil duluan)
    data.sort(function(a,b){
      var ta = a.waktuDaftar || '';
      var tb = b.waktuDaftar || '';
      return ta < tb ? -1 : ta > tb ? 1 : 0;
    });
    _mekSummaryData = data;
    _mekRenderSummaryTable(data);
    _mekRenderSummaryCards(data);

    var countEl = document.getElementById('mekSumRowCount');
    if (countEl) countEl.textContent = data.length + ' DATA';
  }, function () {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:#fc8181;">Koneksi gagal. Coba lagi.</td></tr>';
  });
}

function _mekRenderSummaryCards(data) {
  var totalTruck = data.length;
  var dests      = {};
  var ekspeds    = {};
  var sudahKeluar = 0;

  data.forEach(function (r) {
    if (r.tujuan)    dests[r.tujuan]       = 1;
    if (r.ekspedisi) ekspeds[r.ekspedisi]  = 1;
    if (r.waktuKeluar && String(r.waktuKeluar).trim()) sudahKeluar++;
  });

  _mekSetCard('mekCardTruck',   totalTruck);
  _mekSetCard('mekCardDest',    Object.keys(dests).length);
  _mekSetCard('mekCardEksp',    Object.keys(ekspeds).length);
  _mekSetCard('mekCardKeluar',  sudahKeluar);
}

function _mekSetCard(id, val) {
  var el = document.getElementById(id);
  if (el) el.textContent = _mekFmt(val);
}

function _mekFmt(n) { return Number(n).toLocaleString('id-ID'); }

function _mekRenderSummaryTable(data) {
  var tbody = document.getElementById('mekSumTbody');
  if (!tbody) return;
  if (!data || !data.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:50px;color:#a0aec0;font-size:13px;">' +
      '<i class="fas fa-truck" style="font-size:32px;display:block;margin-bottom:12px;opacity:.2;"></i>' +
      'Tidak ada data pada rentang ini</td></tr>';
    return;
  }

  var rows = '';
  data.forEach(function (r, i) {
    var keluar    = r.waktuKeluar && String(r.waktuKeluar).trim();
    var statusTxt = keluar ? 'KELUAR' : 'ANTRIAN';
    var statusSty = keluar
      ? 'background:#c6f6d5;color:#276749;'
      : 'background:#fefcbf;color:#744210;';

    rows += '<tr>' +
      '<td style="text-align:center;color:#a0aec0;font-size:11px;font-weight:700;">' + (i+1) + '</td>' +
      '<td><b style="font-size:12px;">' + _mekEsc(r.nopol || '-') + '</b></td>' +
      '<td>' + _mekEsc(r.ekspedisi || '-') + '</td>' +
      '<td>' + _mekEsc(_mekStripLeadingZero(r.noDoc) || '-') + '</td>' +
      '<td>' + _mekEsc(r.tujuan || '-') + '</td>' +
      '<td style="white-space:nowrap;color:#4a5568;">' + _mekEsc(r.waktuDaftar || '-') + '</td>' +
      '<td style="white-space:nowrap;color:#4a5568;">' + _mekEsc(r.waktuKeluar || '-') + '</td>' +
      '<td style="text-align:center;">' +
        '<span style="padding:2px 10px;border-radius:12px;font-size:11px;font-weight:700;' + statusSty + '">' +
        statusTxt + '</span>' +
      '</td>' +
      '</tr>';
  });
  tbody.innerHTML = rows;
}

function _mekEsc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ════════════════════════════════════════════════════════════
// DOWNLOAD PDF — print tabel dengan warna
// ════════════════════════════════════════════════════════════
function _mekPrintTable(tableId, title, subtitle) {
  var tbl = document.getElementById(tableId);
  if (!tbl) { showToast('Tidak ada data untuk di-download.', 'warning'); return; }
  var rows = tbl.querySelectorAll('tbody tr');
  if (!rows.length) { showToast('Tidak ada data.', 'warning'); return; }

  var css = [
    '* { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }',
    'body { font-family: Arial, sans-serif; font-size: 11px; margin: 0; padding: 12px; }',
    'h2 { font-size: 14px; margin: 0 0 2px; color: #1a3a5c; }',
    'p  { font-size: 11px; margin: 0 0 8px; color: #718096; }',
    'table { width: 100%; border-collapse: collapse; }',
    'th { background: #1a3a5c !important; color: #fff !important; padding: 6px 8px; font-size: 10px; text-align: left; border: 1px solid #2d4a6a; white-space: nowrap; }',
    'td { padding: 5px 8px; font-size: 10px; border: 1px solid #e2e8f0; vertical-align: middle; }',
    'tr:nth-child(even) td { background: #f7fafc !important; }',
    'span[style*="background:#c6f6d5"] { background: #c6f6d5 !important; color: #276749 !important; border-radius: 8px; padding: 1px 6px; }',
    'span[style*="background:#fed7d7"] { background: #fed7d7 !important; color: #c53030 !important; border-radius: 8px; padding: 1px 6px; }',
    'span[style*="background:#feebc8"] { background: #feebc8 !important; color: #744210 !important; border-radius: 8px; padding: 1px 6px; }',
    'span[style*="background:#bee3f8"] { background: #bee3f8 !important; color: #2b6cb0 !important; border-radius: 8px; padding: 1px 6px; }',
    'span[style*="background:#f6d860"] { background: #f6d860 !important; color: #744210 !important; border-radius: 8px; padding: 1px 6px; }',
    'tr[style*="background:#1a3a5c"] td { background: #1a3a5c !important; color: #fff !important; }',
    'tr[style*="background:#276749"] td { background: #276749 !important; color: #fff !important; }',
    'tr[style*="background:#2d4a6a"] td { background: #2d4a6a !important; color: #bee3f8 !important; }',
    'tr[style*="background:#2d6a4f"] td { background: #2d6a4f !important; color: #d8f3dc !important; }',
    'tr[style*="background:#fffff0"] td { background: #fffff0 !important; }',
    'tr[style*="background:#fff5f5"] td { background: #fff5f5 !important; }',
    '@media print { @page { size: A4 landscape; margin: 10mm; } }'
  ].join('\n');

  var now = new Date();
  var tglPrint = ('0'+now.getDate()).slice(-2)+'/'+('0'+(now.getMonth()+1)).slice(-2)+'/'+now.getFullYear()+
    ' '+('0'+now.getHours()).slice(-2)+':'+('0'+now.getMinutes()).slice(-2);

  var html = '<!DOCTYPE html><html><head><meta charset="UTF-8">' +
    '<title>' + title + '</title>' +
    '<style>' + css + '</style></head><body>' +
    '<h2>' + title + '</h2>' +
    '<p>' + (subtitle||'') + ' &nbsp;|&nbsp; Dicetak: ' + tglPrint + '</p>' +
    tbl.outerHTML +
    '</body></html>';

  var win = window.open('', '_blank', 'width=900,height=700');
  if (!win) { showToast('Popup diblokir browser. Izinkan popup untuk halaman ini.', 'error'); return; }
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(function() { win.print(); }, 500);
}

function mekDownloadAllPdf() {
  var from = (document.getElementById('mekFilterFrom')||{}).value||'';
  var to   = (document.getElementById('mekFilterTo')||{}).value||'';
  var sub  = from && to ? _mekFmtTglDisplay(from) + ' s/d ' + _mekFmtTglDisplay(to) : 'Semua Periode';
  _mekPrintTable('mekSumTbl', 'Data Antrian Ekspor', sub);
}

function mekDownloadCapaianPdf() {
  var from = (document.getElementById('mekCapFrom')||{}).value||'';
  var to   = (document.getElementById('mekCapTo')||{}).value||'';
  var mode = { all:'Semua', wa:'By Cont (WA)', si:'By SO (SI)', email:'By Email' };
  var modeStr = mode[window._mekCapMode||'all'] || '';
  var sub  = (from && to ? _mekFmtTglDisplay(from) + ' s/d ' + _mekFmtTglDisplay(to) : 'Semua Periode') +
    (modeStr ? ' — ' + modeStr : '');
  _mekPrintTable('mekCapTbl', 'Capaian Planning Ekspor', sub);
}

// ════════════════════════════════════════════════════════════
// DOWNLOAD PDF
// ════════════════════════════════════════════════════════════
function mekDownloadPdf() {
  var data = _mekSummaryData;
  if (!data || !data.length) { showToast('Tidak ada data untuk di-download.', 'warning'); return; }

  var from = (document.getElementById('mekFilterFrom') || {}).value || '';
  var to   = (document.getElementById('mekFilterTo')   || {}).value || '';
  var periodeTxt = from && to ? _mekFmtTglDisplay(from) + ' s/d ' + _mekFmtTglDisplay(to) : 'Semua Periode';

  var rows = data.map(function (r, i) {
    var keluar = r.waktuKeluar && String(r.waktuKeluar).trim();
    return '<tr>' +
      '<td style="text-align:center;">' + (i+1) + '</td>' +
      '<td><b>' + _mekEsc(r.nopol||'-') + '</b></td>' +
      '<td>' + _mekEsc(r.ekspedisi||'-') + '</td>' +
      '<td>' + _mekEsc(_mekStripLeadingZero(r.noDoc)||'-') + '</td>' +
      '<td>' + _mekEsc(r.tujuan||'-') + '</td>' +
      '<td>' + _mekEsc(r.waktuDaftar||'-') + '</td>' +
      '<td>' + _mekEsc(r.waktuKeluar||'-') + '</td>' +
      '<td style="text-align:center;">' + (keluar?'KELUAR':'ANTRIAN') + '</td>' +
      '</tr>';
  }).join('');

  var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Monitoring Ekspor</title>' +
    '<style>body{font-family:Arial,sans-serif;font-size:11px;margin:20px;}' +
    'h2{font-size:14px;margin:0 0 2px;}p{margin:0 0 10px;font-size:10px;color:#666;}' +
    'table{width:100%;border-collapse:collapse;}' +
    'th{background:#1a3a5c;color:#fff;padding:6px 8px;font-size:10px;text-align:left;border:1px solid #0f2027;}' +
    'td{padding:5px 8px;border:1px solid #e2e8f0;vertical-align:middle;}' +
    'tr:nth-child(even)td{background:#f7fafc;}' +
    '@media print{body{margin:10px;}}</style></head><body>' +
    '<h2><i>Monitoring Ekspor — Data Antrian</i></h2>' +
    '<p>Periode: ' + periodeTxt + ' &nbsp;|&nbsp; Total: ' + data.length + ' kendaraan &nbsp;|&nbsp; Dicetak: ' + new Date().toLocaleString('id-ID') + '</p>' +
    '<table><thead><tr>' +
    '<th style="width:28px;">#</th><th>No. Pol</th><th>Ekspedisi</th><th>No. DOC</th>' +
    '<th>Tujuan</th><th>Waktu Daftar</th><th>Waktu Keluar</th><th>Status</th>' +
    '</tr></thead><tbody>' + rows + '</tbody></table>' +
    '<script>window.onload=function(){window.print();}<\/script></body></html>';

  var win = window.open('', '_blank');
  if (!win) { showToast('Popup diblokir. Izinkan popup di browser.', 'error'); return; }
  win.document.write(html);
  win.document.close();
}

// ════════════════════════════════════════════════════════════
// DOWNLOAD EXCEL (CSV → .xls via data URI)
// ════════════════════════════════════════════════════════════
function mekDownloadExcel() {
  var data = _mekSummaryData;
  if (!data || !data.length) { showToast('Tidak ada data untuk di-download.', 'warning'); return; }

  var from = (document.getElementById('mekFilterFrom') || {}).value || '';
  var to   = (document.getElementById('mekFilterTo')   || {}).value || '';

  // BOM + header
  var BOM = '\uFEFF';
  var header = ['No','No. Pol','Ekspedisi','No. DOC','Tujuan','Waktu Daftar','Waktu Keluar','Status'];
  var csvRows = [header.join('\t')];

  data.forEach(function (r, i) {
    var keluar = r.waktuKeluar && String(r.waktuKeluar).trim();
    csvRows.push([
      i + 1,
      r.nopol       || '',
      r.ekspedisi   || '',
      _mekStripLeadingZero(r.noDoc || ''),
      r.tujuan      || '',
      r.waktuDaftar || '',
      r.waktuKeluar || '',
      keluar ? 'KELUAR' : 'ANTRIAN'
    ].map(function(v){ return '"' + String(v).replace(/"/g,'""') + '"'; }).join('\t'));
  });

  var content  = BOM + csvRows.join('\r\n');
  var blob     = new Blob([content], { type: 'application/vnd.ms-excel;charset=utf-8' });
  var url      = URL.createObjectURL(blob);
  var filename = 'Monitoring_Ekspor_' + (from || 'all') + '_' + (to || 'all') + '.xls';

  var a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  showToast('File Excel berhasil diunduh.', 'success');
}

// ════════════════════════════════════════════════════════════
// TAB INPUT PLANNING — Parser teks WA
// ════════════════════════════════════════════════════════════

// State hasil parse
var _mekParsedRows = [];

// ── Inisialisasi (dipanggil mekInitPage) ─────────────────────
function _mekInitPlanningWa() {
  _mekParsedRows = [];
  _mekSiRows     = [];
  _mekEmailRows  = [];
  _mekPlanMode   = 'wa';
  var ta = document.getElementById('mekWaTextarea');
  if (ta) ta.value = '';
  var tj = document.getElementById('mekWaTujuan');
  if (tj) { tj.value = ''; tj.style.borderColor = '#fc8181'; tj.style.background = '#fff5f5'; }
  _mekRenderPreview([]);
  mekSwitchPlanMode('wa');

  // Set tahun default
  var elYear = document.getElementById('mekWaYear');
  if (elYear && !elYear.value) elYear.value = new Date().getFullYear();
}

// ── Parse tombol ─────────────────────────────────────────────
function mekParseWa() {
  var ta     = document.getElementById('mekWaTextarea');
  var tujuan = ((document.getElementById('mekWaTujuan') || {}).value || '').trim();

  if (!ta || !ta.value.trim()) { showToast('Textarea kosong, paste dulu teks WA-nya.', 'warning'); return; }
  if (!tujuan) {
    showToast('Tujuan wajib diisi sebelum Parse!', 'error');
    var el = document.getElementById('mekWaTujuan');
    if (el) { el.focus(); el.style.borderColor = '#fc8181'; el.style.background = '#fff5f5'; }
    return;
  }

  var rows = _mekParseWaText(ta.value, tujuan);
  _mekParsedRows = rows;
  _mekRenderPreview(rows);

  var ct = document.getElementById('mekParseCount');
  if (ct) ct.textContent = rows.length + ' baris';

  if (rows.length) {
    showToast(rows.length + ' baris berhasil di-parse!', 'success');
    // Di mobile: otomatis pindah ke tab preview
    var toggle = document.getElementById('mekMobilePaneToggle');
    if (toggle && toggle.style.display !== 'none') mekMobilePane('preview');
  } else {
    showToast('Tidak ada data yang bisa di-parse. Periksa format teks.', 'warning');
  }
}

function mekClearWa() {
  var ta = document.getElementById('mekWaTextarea');
  if (ta) ta.value = '';
  var tj = document.getElementById('mekWaTujuan');
  if (tj) { tj.value = ''; tj.style.borderColor = '#fc8181'; tj.style.background = '#fff5f5'; }
  _mekParsedRows = [];
  _mekRenderPreview([]);
  var ct = document.getElementById('mekParseCount');
  if (ct) ct.textContent = '0 baris';
}

// ── Inti parser teks WA ──────────────────────────────────────
function _mekParseWaText(raw, tujuan) {
  var lines = raw.split('\n').map(function(l){ return l.trim(); });

  // ── 1. Deteksi week & tahun ──────────────────────────────
  // Dari input manual override, atau scan teks "week XX" / "week ke-XX"
  var overrideWeek = parseInt((document.getElementById('mekWaWeek') || {}).value) || 0;
  var overrideYear = parseInt((document.getElementById('mekWaYear') || {}).value) || 0;

  var detectedWeek = overrideWeek;
  var detectedYear = overrideYear || new Date().getFullYear();

  if (!detectedWeek) {
    for (var i = 0; i < lines.length; i++) {
      var wm = lines[i].match(/week\s*(?:ke[-\s]?)?\s*(\d{1,2})/i);
      if (wm) { detectedWeek = parseInt(wm[1]); break; }
    }
  }

  // ── 2. Map nama bulan → nomor ────────────────────────────
  var BULAN = {
    jan:'01', feb:'02', mar:'03', apr:'04', mei:'05', may:'05',
    jun:'06', jul:'07', agu:'08', aug:'08', sep:'09', okt:'10', oct:'10',
    nov:'11', des:'12', dec:'12'
  };

  function parseTanggal(str) {
    // Format: "11 Jun", "08 Jun", "10 Jun", "11 Jun 2025" dll
    // Juga handle angka saja jika ada konteks bulan sebelumnya
    var s = str.trim();
    var m = s.match(/^(\d{1,2})\s+([A-Za-z]{2,4})(?:\s+(\d{4}))?/);
    if (m) {
      var tgl  = ('0' + m[1]).slice(-2);
      var bKey = m[2].toLowerCase().substring(0, 3);
      var bln  = BULAN[bKey];
      if (!bln) return null;
      var yr   = m[3] ? m[3] : String(detectedYear);
      return yr + '-' + bln + '-' + tgl;
    }
    return null;
  }

  // ── 3. Scan baris per baris ──────────────────────────────
  var results = [];
  var curSku  = '';
  var curItem = '';
  var curKesanggupan = '';

  for (var li = 0; li < lines.length; li++) {
    var line = lines[li];
    if (!line) continue;

    // Bersihkan karakter unicode aneh (tanda bullet, zero-width space, dll)
    line = line.replace(/[\u200B-\u200D\uFEFF\u2060]/g, '').trim();
    if (!line) continue;

    // SKU
    var skuM = line.match(/^sku\s*[:：]\s*(\S+)/i);
    if (skuM) {
      curSku  = skuM[1].trim();
      curItem = '';
      curKesanggupan = '';
      continue;
    }

    // ITEM
    var itemM = line.match(/^item\s*[:：]\s*(.+)/i);
    if (itemM) {
      curItem = itemM[1].trim();
      continue;
    }

    // Kesanggupan total (baris informatif, simpan sebagai catatan)
    var kesM = line.match(/^kesanggupan\s+(.+)/i);
    if (kesM) {
      curKesanggupan = kesM[1].trim();
      continue;
    }

    // Baris tanggal: "11 Jun : 3 cont" atau "11 Jun : 3 cont (catatan...)"
    // Juga handle "- 1 cont pm lama ..." sebagai catatan sub-baris → skip (bukan baris tanggal)
    if (/^[-•⁠*]/.test(line)) continue; // baris bullet → skip

    var tglLineM = line.match(/^(\d{1,2}\s+[A-Za-z]{2,4}(?:\s+\d{4})?)\s*[:：]\s*(.+)/i);
    if (tglLineM) {
      var tglStr = parseTanggal(tglLineM[1]);
      var rest   = tglLineM[2].trim();

      // Ambil jumlah cont: angka pertama sebelum "cont"
      var contM  = rest.match(/(\d+(?:[.,]\d+)?)\s*cont/i);
      var jumlah = contM ? contM[1].replace(',', '.') : '';

      // Ambil keterangan dalam kurung jika ada: "1 cont (tidak full qty container)"
      var ketM   = rest.match(/\(([^)]+)\)/);
      var ket    = ketM ? ketM[1].trim() : '';

      if (tglStr && curSku) {
        results.push({
          week:    detectedWeek ? String(detectedWeek) : '',
          tanggal: tglStr,
          sku:     curSku,
          nama:    curItem,
          jumlah:  jumlah,
          tujuan:  tujuan || '',
          ket:     ket,
          source:  'WA'
        });
      }
      continue;
    }
  }

  return results;
}

// ── Render tabel preview ─────────────────────────────────────
function _mekRenderPreview(rows) {
  var tbody = document.getElementById('mekPreviewTbody');
  if (!tbody) return;

  if (!rows || !rows.length) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:50px;color:#a0aec0;font-size:12px;">' +
      '<i class="fas fa-magic" style="font-size:28px;display:block;margin-bottom:10px;opacity:.2;"></i>' +
      'Paste teks WA lalu klik <b>Parse</b></td></tr>';
    return;
  }

  var html = '';
  rows.forEach(function(r, i) {
    html += '<tr>' +
      '<td style="text-align:center;color:#a0aec0;font-size:11px;font-weight:700;background:#f8fafc;">' + (i+1) + '</td>' +
      '<td style="text-align:center;">' +
        (r.week ? '<span style="background:#ebf8ff;color:#2b6cb0;border-radius:10px;padding:1px 8px;font-size:11px;font-weight:700;">W' + r.week + '</span>' : '<span style="color:#cbd5e0;">—</span>') +
      '</td>' +
      '<td style="white-space:nowrap;font-size:12px;">' + _mekEsc(_mekFmtTglDisplay(r.tanggal) || r.tanggal) + '</td>' +
      '<td><b style="font-size:12px;">' + _mekEsc(r.sku) + '</b></td>' +
      '<td style="font-size:12px;">' + _mekEsc(r.nama) + '</td>' +
      '<td style="text-align:right;font-weight:700;font-size:13px;">' + _mekEsc(r.jumlah || '—') + '</td>' +
      '<td style="font-size:12px;font-weight:600;color:#276749;">' + _mekEsc(r.tujuan || '—') + '</td>' +
      '<td style="font-size:11px;color:#718096;">' + _mekEsc(r.ket) + '</td>' +
      '<td style="text-align:center;">' +
        '<button onclick="_mekDeletePreviewRow(' + i + ')" style="background:none;border:none;color:#fc8181;cursor:pointer;font-size:11px;padding:3px 5px;">' +
        '<i class="fas fa-times"></i></button>' +
      '</td>' +
      '</tr>';
  });
  tbody.innerHTML = html;
}

function _mekDeletePreviewRow(idx) {
  _mekParsedRows.splice(idx, 1);
  _mekRenderPreview(_mekParsedRows);
  var ct = document.getElementById('mekParseCount');
  if (ct) ct.textContent = _mekParsedRows.length + ' baris';
}

// ── Simpan ke GAS ────────────────────────────────────────────
function mekSavePlanning() {
  var rows;
  if (_mekPlanMode === 'si') {
    rows = _mekSiRows;
  } else if (_mekPlanMode === 'email') {
    rows = _mekEmailInputMode === 'manual' ? _mekCollectManualRows() : _mekEmailRows;
  } else {
    rows = _mekParsedRows;
  }
  if (!rows || !rows.length) {
    var msg = _mekPlanMode === 'si'    ? 'Belum ada data SI. Upload PDF dulu.'
            : _mekPlanMode === 'email' ? (_mekEmailInputMode === 'manual' ? 'Isi tabel dulu.' : 'Belum ada data Email. Upload file dulu.')
            : 'Belum ada data. Parse dulu teks WA-nya.';
    showToast(msg, 'warning'); return;
  }

  var btnId = _mekPlanMode === 'si'    ? 'mekSiBtnSave'
            : _mekPlanMode === 'email' ? 'mekEmailBtnSave'
            : 'mekBtnSave';
  var btn = document.getElementById(btnId);
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...'; }

  // Fill down: baris lanjutan ambil week/tanggal/noSo/jumlah/tujuan dari baris pertama grup
  var lastFirst = null;
  var filledRows = rows.map(function(r) {
    if (r._isFirst !== false) { lastFirst = r; return r; }
    return Object.assign({}, r, {
      week:    lastFirst ? lastFirst.week    : r.week,
      tanggal: lastFirst ? lastFirst.tanggal : r.tanggal,
      noSo:    lastFirst ? lastFirst.noSo    : r.noSo,
      jumlah:  lastFirst ? lastFirst.jumlah  : r.jumlah,
      tujuan:  lastFirst ? lastFirst.tujuan  : r.tujuan,
      ket:     lastFirst ? lastFirst.ket     : r.ket,
    });
  });

  // Kirim weekOverride untuk Email (update logic di GAS)
  var weekOverride = '';
  if (_mekPlanMode === 'email') {
    weekOverride = ((document.getElementById('mekEmailWeek')||{}).value||'').trim();
  }

  var cleanRows = filledRows.map(function(r) {
    function san(v) {
      if (!v && v !== 0) return '';
      return String(v).replace(/[\r\n\t]/g,' ').replace(/[\x00-\x1f\x7f]/g,'').trim();
    }
    return { week:san(r.week), tanggal:san(r.tanggal), sku:san(r.sku), nama:san(r.nama),
      jumlah:san(r.jumlah)||'1', tujuan:san(r.tujuan), ket:san(r.ket),
      noSo:san(r.noSo), source:san(r.source)||'EMAIL',
      _isFirst:r._isFirst, _groupSize:r._groupSize };
  });
  API.run('saveMekPlanningData', { rows: cleanRows, weekOverride: weekOverride }, function (res) {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> Simpan'; }
    if (res && res.success) {
      showToast(res.message || 'Berhasil disimpan!', 'success');
      if      (_mekPlanMode === 'si')    { _mekSiRows=[]; _mekRenderSiPreview([]); var dz=document.getElementById('mekSiDropZone'),rw=document.getElementById('mekSiResultWrap'); if(dz)dz.style.display=''; if(rw)rw.style.display='none'; var ct=document.getElementById('mekSiParseCount'); if(ct)ct.style.display='none'; }
      else if (_mekPlanMode === 'email') { mekClearEmail(); }
      else                               { mekClearWa(); }
    } else {
      showToast('Gagal: ' + (res && res.message ? res.message : 'error'), 'error');
    }
  }, function () {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> Simpan'; }
    showToast('Koneksi gagal. Coba lagi.', 'error');
  });
}

// ════════════════════════════════════════════════════════════
// MOBILE PANE TOGGLE (paste ↔ preview)
// ════════════════════════════════════════════════════════════
function mekMobilePane(pane) {
  var pasteEl   = document.getElementById('mekPastePanel');
  var previewEl = document.getElementById('mekPreviewPanel');
  var tabPaste  = document.getElementById('mekMobileTabPaste');
  var tabPrev   = document.getElementById('mekMobileTabPreview');
  if (!pasteEl || !previewEl) return;

  var ac = '#1a3a5c';
  var in_ = '#718096';

  if (pane === 'paste') {
    pasteEl.style.display   = 'flex';
    previewEl.style.display = 'none';
    if (tabPaste) { tabPaste.style.color  = ac;  tabPaste.style.borderBottomColor  = ac; }
    if (tabPrev)  { tabPrev.style.color   = in_; tabPrev.style.borderBottomColor   = 'transparent'; }
    // Fokus textarea supaya keyboard muncul
    setTimeout(function(){ var ta = document.getElementById('mekWaTextarea'); if(ta) ta.focus(); }, 100);
  } else {
    pasteEl.style.display   = 'none';
    previewEl.style.display = 'flex';
    if (tabPaste) { tabPaste.style.color  = in_; tabPaste.style.borderBottomColor  = 'transparent'; }
    if (tabPrev)  { tabPrev.style.color   = ac;  tabPrev.style.borderBottomColor   = ac; }
  }
}

// ════════════════════════════════════════════════════════════
// TOGGLE MODE: WA / SI
// ════════════════════════════════════════════════════════════
var _mekPlanMode   = 'wa';  // 'wa' | 'si'
var _mekSiRows     = [];    // baris hasil parse SI
var _mekStdCache   = null;  // cache sheet STD {nama_lower: {sku, nama}}

// ── Load STD dari GAS sekali, cache di browser ───────────────
function _mekLoadStd(callback) {
  if (_mekStdCache) { callback(_mekStdCache); return; }
  API.run('getStandarPalet', {}, function(res) {
    _mekStdCache = {};
    ((res && res.data) || []).forEach(function(r) {
      var key = String(r.nama || '').toLowerCase().trim();
      if (key) _mekStdCache[key] = { sku: String(r.sku || ''), nama: String(r.nama || '') };
    });
    callback(_mekStdCache);
  }, function() { _mekStdCache = {}; callback({}); });
}

// ── Fuzzy match nama item SI ke sheet STD ────────────────────
// Strategi: tokenize kedua string → hitung token yang overlap → pilih skor tertinggi
function _mekFuzzyMatchStd(itemText, stdCache) {
  if (!itemText || !stdCache || !Object.keys(stdCache).length) return null;

  function normalize(s) {
    return s.toLowerCase()
      .replace(/\([^)]*\)/g, ' ')   // hapus kata dalam kurung: (BISCUITS) → spasi
      .replace(/[^a-z0-9\s]/g, ' ')  // hapus simbol lain
      .replace(/\s+/g, ' ').trim();
  }
  function tokenize(s) { return normalize(s).split(' ').filter(Boolean); }

  var qRaw    = tokenize(itemText);           // token dari PDF (tanpa kata kurung)
  var qFull   = itemText.toLowerCase()        // juga coba dengan kata kurung dipertahankan
    .replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim().split(' ').filter(Boolean);

  if (!qRaw.length) return null;

  var best = null, bestScore = 0;
  Object.keys(stdCache).forEach(function(key) {
    var kTokens = tokenize(key);
    if (!kTokens.length) return;

    // Skor 1: query tanpa kurung vs STD
    var hit1 = qRaw.filter(function(t){ return kTokens.indexOf(t) >= 0; }).length;
    var s1   = hit1 / Math.max(qRaw.length, kTokens.length);

    // Skor 2: query lengkap vs STD (token STD yg match di query)
    var hit2 = kTokens.filter(function(t){ return qFull.indexOf(t) >= 0; }).length;
    var s2   = hit2 / Math.max(qFull.length, kTokens.length);

    // Skor 3: berapa % token STD yang ada di query (recall)
    var recall = hit2 / kTokens.length;

    // Ambil skor terbaik dari ketiga cara
    var score = Math.max(s1, s2, recall * 0.9);
    if (score > bestScore) { bestScore = score; best = stdCache[key]; }
  });

  // Threshold 35% — lebih rendah karena sudah ada 3 cara hitung
  return bestScore >= 0.55 ? best : null;
}

// ════════════════════════════════════════════════════════════
// TOGGLE MODE: WA / SI
// ════════════════════════════════════════════════════════════
function mekSwitchPlanMode(mode) {
  _mekPlanMode = mode;
  var waPanel    = document.getElementById('mekWaPanel');
  var siPanel    = document.getElementById('mekSiPanel');
  var emailPanel = document.getElementById('mekEmailPanel');
  var btnWa      = document.getElementById('mekPlanModeWa');
  var btnSi      = document.getElementById('mekPlanModeSi');
  var btnEmail   = document.getElementById('mekPlanModeEmail');
  var ac = '#1a3a5c', in_ = '#718096';

  if (waPanel)    waPanel.style.display    = mode === 'wa'    ? 'flex' : 'none';
  if (siPanel)    siPanel.style.display    = mode === 'si'    ? 'flex' : 'none';
  if (emailPanel) emailPanel.style.display = mode === 'email' ? 'flex' : 'none';

  [btnWa, btnSi, btnEmail].forEach(function(btn, i) {
    if (!btn) return;
    var isActive = (i===0&&mode==='wa')||(i===1&&mode==='si')||(i===2&&mode==='email');
    btn.style.color            = isActive ? ac  : in_;
    btn.style.borderBottomColor = isActive ? ac : 'transparent';
  });

  if (mode === 'si') {
    _mekLoadStd(function(){});
    document.addEventListener('paste', _mekGlobalSiPaste);
    setTimeout(function() {
      var dz = document.getElementById('mekSiDropZone');
      if (dz && dz.style.display !== 'none') { dz.setAttribute('tabindex','0'); dz.focus(); }
    }, 100);
  } else {
    document.removeEventListener('paste', _mekGlobalSiPaste);
  }

  if (mode === 'email') {
    _mekLoadStd(function(){});
    document.addEventListener('paste', _mekGlobalEmailPaste);
    var elYear = document.getElementById('mekEmailYear');
    if (elYear && !elYear.value) elYear.value = new Date().getFullYear();
    setTimeout(function() {
      var dz = document.getElementById('mekEmailDropZone');
      if (dz && dz.style.display !== 'none') { dz.setAttribute('tabindex','0'); dz.focus(); }
    }, 100);
  } else {
    document.removeEventListener('paste', _mekGlobalEmailPaste);
  }
}

function _mekGlobalSiPaste(e) {
  if (_mekPlanMode !== 'si') return;
  var tag = (e.target && e.target.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea') return;
  var items = (e.clipboardData || {}).items;
  if (!items) return;
  var hasImage = false;
  for (var i = 0; i < items.length; i++) {
    if (items[i].type && items[i].type.indexOf('image') === 0) { hasImage = true; break; }
  }
  if (!hasImage) return;
  mekHandleSiPaste(e);
}

// ════════════════════════════════════════════════════════════
// BY EMAIL — Upload/paste tabel planning dari email
// Format kolom: KETERANGAN|SO|QT|NEGARA|KODE(SKU)|MATERIAL|STUFFING DATE|QTY|STUFFING PLANT|NOTE
// 1 baris = 1 container
// ════════════════════════════════════════════════════════════
var _mekEmailRows = [];

function _mekGlobalEmailPaste(e) {
  if (_mekPlanMode !== 'email') return;
  var tag = (e.target && e.target.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea') return;
  var items = (e.clipboardData || {}).items;
  if (!items) return;
  for (var i = 0; i < items.length; i++) {
    if (items[i].type && items[i].type.indexOf('image') === 0) {
      mekHandleEmailPaste(e); return;
    }
  }
}

function mekHandleEmailPaste(e) {
  if (_mekEmailInputMode === 'manual') return;
  var tag = (e.target && e.target.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea' || e.target.contentEditable === 'true') return;
  var items = (e.clipboardData || e.originalEvent && e.originalEvent.clipboardData || {}).items;
  if (!items) return;
  for (var i = 0; i < items.length; i++) {
    if (items[i].type && items[i].type.indexOf('image') === 0) {
      e.preventDefault();
      var file  = items[i].getAsFile();
      var ext   = file.type.split('/')[1] || 'png';
      var named = new File([file], 'email_' + Date.now() + '.' + ext, { type: file.type });
      mekHandleEmailFiles([named]);
      return;
    }
  }
}

function mekHandleEmailFiles(files) {
  if (!files || !files.length) return;
  var ALLOWED = ['application/pdf','image/png','image/jpeg','image/jpg','image/webp','image/gif'];
  var fileArr = Array.from(files).filter(function(f){
    return ALLOWED.indexOf(f.type) >= 0 || /\.(pdf|png|jpg|jpeg|webp|gif)$/i.test(f.name);
  });
  if (!fileArr.length) { showToast('Pilih file PDF atau gambar.', 'error'); return; }

  var dz = document.getElementById('mekEmailDropZone');
  var rw = document.getElementById('mekEmailResultWrap');
  if (dz) dz.style.display = 'none';
  if (rw) rw.style.display = 'block';

  var log = document.getElementById('mekEmailFileLog');
  if (log) log.innerHTML = '';
  _mekEmailRows = [];

  _mekLoadStd(function(stdCache) {
    var done = 0;
    fileArr.forEach(function(file) {
      _mekAddEmailLog(file.name, 'loading');
      var isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
      if (isPdf) {
        _mekReadPdfText(file, function(text) {
          if (!text) { _mekUpdateEmailLog(file.name,'error','Gagal baca PDF'); done++; if(done===fileArr.length)_mekFinalizeEmail(); return; }
          _mekUpdateEmailLog(file.name,'parsing','Parsing tabel...');
          var rows = _mekParseEmailTable(text, stdCache);
          _mekEmailRows = _mekEmailRows.concat(rows);
          _mekUpdateEmailLog(file.name, rows.length?'ok':'warn', rows.length?rows.length+' baris':'Tidak ada data');
          done++; if(done===fileArr.length) _mekFinalizeEmail();
        });
      } else {
        _mekUpdateEmailLog(file.name,'parsing','OCR...');
        _mekFileToBase64(file, function(b64, mime) {
          if (!b64) { _mekUpdateEmailLog(file.name,'error','Gagal baca gambar'); done++; if(done===fileArr.length)_mekFinalizeEmail(); return; }
          _mekOcrImage({b64:b64, mime:mime}, function(ocrText) {
            if (!ocrText) { _mekUpdateEmailLog(file.name,'warn','OCR gagal'); done++; if(done===fileArr.length)_mekFinalizeEmail(); return; }
            var rows = _mekParseEmailTable(ocrText, stdCache);
            _mekEmailRows = _mekEmailRows.concat(rows);
            _mekUpdateEmailLog(file.name, rows.length?'ok':'warn', rows.length?rows.length+' baris':'Tidak ada data');
            done++; if(done===fileArr.length) _mekFinalizeEmail();
          });
        });
      }
    });
  });
}

// ======================================================
// MANUAL INPUT TABLE
// ======================================================
var _mekEmailInputMode = 'upload';

function mekEmailSwitchMode(mode) {
  _mekEmailInputMode = mode;
  var up  = document.getElementById('mekEmailUploadPanel');
  var man = document.getElementById('mekEmailManualPanel');
  var btnU = document.getElementById('mekEmailModeUpload');
  var btnM = document.getElementById('mekEmailModeManual');
  if (!up || !man) return;
  if (mode === 'upload') {
    up.style.display=''; man.style.display='none';
    if(btnU){btnU.style.color='#1a3a5c';btnU.style.borderBottomColor='#1a3a5c';}
    if(btnM){btnM.style.color='#718096';btnM.style.borderBottomColor='transparent';}
  } else {
    up.style.display='none'; man.style.display='';
    if(btnM){btnM.style.color='#1a3a5c';btnM.style.borderBottomColor='#1a3a5c';}
    if(btnU){btnU.style.color='#718096';btnU.style.borderBottomColor='transparent';}
    var tbody = document.getElementById('mekEmailManualTbody');
    if (tbody && !tbody.rows.length) mekEmailManualAddRow();
  }
}

var _MEK_MAN_COLS = ['keterangan','so','qt','negara','kode','material','stuffing_date','qty','plant','ready','email','rsv_crt','po_sto','do_sto','note'];

function mekEmailManualAddRow(vals) {
  var tbody = document.getElementById('mekEmailManualTbody');
  if (!tbody) return;
  var idx = tbody.rows.length;
  var tr = document.createElement('tr');
  tr.dataset.idx = idx;
  var tdNum = document.createElement('td');
  tdNum.style.cssText = 'text-align:center;color:#a0aec0;font-size:11px;font-weight:700;background:#f8fafc;';
  tdNum.textContent = idx + 1;
  tr.appendChild(tdNum);
  _MEK_MAN_COLS.forEach(function(col, ci) {
    var td = document.createElement('td');
    td.contentEditable = 'true';
    td.dataset.col = col;
    td.style.cssText = 'outline:none;padding:5px 6px;font-size:12px;min-width:60px;white-space:nowrap;cursor:text;';
    td.style.textAlign = (col==='qty'||col==='rsv_crt') ? 'right' : 'left';
    if (vals && vals[col] !== undefined) td.textContent = vals[col];
    td.addEventListener('focus', function(){ td.style.background='#fffde7'; });
    td.addEventListener('blur',  function(){ td.style.background=''; });
    td.addEventListener('keydown', function(e) {
      if (e.key === 'Tab') {
        e.preventDefault();
        var cells = tr.querySelectorAll('[contenteditable]');
        var pos = Array.from(cells).indexOf(td);
        if (pos < cells.length-1) { cells[pos+1].focus(); }
        else { mekEmailManualAddRow(); setTimeout(function(){ var rows=tbody.rows; if(rows.length>1)rows[rows.length-1].cells[1].focus(); },50); }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        mekEmailManualAddRow();
        setTimeout(function(){ var rows=tbody.rows; if(rows.length>1)rows[rows.length-1].cells[1].focus(); },50);
      }
    });
    td.addEventListener('paste', function(e) {
      e.preventDefault();
      var text = (e.clipboardData || window.clipboardData).getData('text');
      if (!text) return;
      var lines = text.replace(/\r\n/g,'\n').replace(/\r/g,'\n').split('\n').filter(Boolean);
      if (lines.length===1 && lines[0].indexOf('\t')<0) { document.execCommand('insertText',false,lines[0]); return; }
      lines.forEach(function(line, li) {
        var cellVals = line.split('\t');
        var targetRow;
        if (li===0) { targetRow=tr; }
        else { while(tbody.rows.length<=idx+li) mekEmailManualAddRow(); targetRow=tbody.rows[idx+li]; }
        cellVals.forEach(function(val,vi){
          var colIdx=ci+vi;
          if(colIdx>=_MEK_MAN_COLS.length) return;
          var cell=targetRow.querySelector('[data-col="'+_MEK_MAN_COLS[colIdx]+'"]');
          if(cell) cell.textContent=val.trim();
        });
      });
    });
    tr.appendChild(td);
  });
  var tdDel = document.createElement('td');
  tdDel.style.cssText = 'text-align:center;padding:2px;';
  var btn = document.createElement('button');
  btn.innerHTML = '<i class="fas fa-times"></i>';
  btn.style.cssText = 'background:none;border:none;color:#fc8181;cursor:pointer;font-size:11px;padding:3px 5px;';
  btn.onclick = function(){ tr.parentNode.removeChild(tr); Array.from(tbody.rows).forEach(function(r,i){r.cells[0].textContent=i+1;}); };
  tdDel.appendChild(btn);
  tr.appendChild(tdDel);
  tbody.appendChild(tr);
}

function mekEmailManualClear() {
  var tbody = document.getElementById('mekEmailManualTbody');
  if (tbody) tbody.innerHTML = '';
  mekEmailManualAddRow();
}

function _mekCollectManualRows() {
  var tbody = document.getElementById('mekEmailManualTbody');
  if (!tbody) return [];
  var weekOverride = parseInt((document.getElementById('mekEmailWeek')||{}).value||'')||0;
  var MONTHS = {jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12};
  function parseTgl(s) {
    if (!s) return '';
    s = String(s).trim();
    var m = s.match(/^(\d{1,2})[\/.\-]([A-Za-z]{3})[\/.\-](\d{2,4})$/);
    if (m) { var mon=MONTHS[(m[2]||'').toLowerCase()]||0; if(!mon)return ''; var yr=m[3].length===2?'20'+m[3]:m[3]; return yr+'-'+('0'+mon).slice(-2)+'-'+('0'+m[1]).slice(-2); }
    var m2 = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (m2) return m2[3]+'-'+('0'+m2[2]).slice(-2)+'-'+('0'+m2[1]).slice(-2);
    return '';
  }
  function weekFromTgl(ymd) {
    if (!ymd) return '';
    var d=new Date(ymd+'T00:00:00Z'); var day=d.getUTCDay()||7;
    d.setUTCDate(d.getUTCDate()+4-day);
    var y0=new Date(Date.UTC(d.getUTCFullYear(),0,1));
    return String(Math.ceil(((d-y0)/86400000+1)/7));
  }
  var rows = [];
  Array.from(tbody.rows).forEach(function(tr) {
    function g(col){ var el=tr.querySelector('[data-col="'+col+'"]'); return el?el.textContent.trim():''; }
    var so=g('so').replace(/\D/g,''), kode=g('kode').replace(/\D/g,'');
    if (!so && !kode) return;
    var tgl=parseTgl(g('stuffing_date'));
    var wk=weekOverride?String(weekOverride):weekFromTgl(tgl);
    var qty=parseInt(g('qty').replace(/\D/g,''))||0;
    var extra=[g('ready'),g('email'),g('rsv_crt'),g('po_sto'),g('do_sto')]
      .map(function(v,i){var L=['READY','EMAIL','RSV','PO','DO'];return v?L[i]+':'+v:'';}).filter(Boolean).join(' | ');
    var negara=g('negara').toUpperCase();
    var noQt=g('qt').replace(/\D/g,'');
    var soQtStr=[so?'SO:'+so:'',noQt?'QT:'+noQt:''].filter(Boolean).join(' | ');
    var ket=[soQtStr,g('keterangan'),extra].filter(Boolean).join(' | ');
    rows.push({ week:wk, tanggal:tgl, sku:kode, nama:g('material'),
      jumlah:'1', tujuan:negara, ket:ket, noSo:so,
      source:'EMAIL', _isFirst:true, _groupSize:1 });
  });
  return rows;
}

// ======================================================
// CAPAIAN EMAIL - load dan render
// ======================================================
var _mekCapEmailData    = [];
var _mekCapEmailSummary = {};
var _mekCapEmailView    = 'plan';  // 'plan' | 'aktual'

function mekCapEmailSwitchView(view) {
  _mekCapEmailView = view;
  var btnP = document.getElementById('mekCapEmailByPlan');
  var btnA = document.getElementById('mekCapEmailByAktual');
  if (btnP) btnP.classList.toggle('active', view === 'plan');
  if (btnA) btnA.classList.toggle('active', view === 'aktual');
  // Reload dari GAS karena filter antrian berbeda per mode
  mekLoadCapaian();
}

function _mekRenderCapaianEmail(data, skuFilter, docFilter, tujFilter) {
  var tbody = document.getElementById('mekCapTbody');
  if (!tbody) return;
  if (!data || !data.length) {
    tbody.innerHTML = '<tr><td colspan="14" style="text-align:center;padding:40px;color:#a0aec0;">Tidak ada data.</td></tr>';
    return;
  }
  skuFilter = (skuFilter||'').toLowerCase();
  docFilter = _mekStripLeadingZero(docFilter||'');
  tujFilter = (tujFilter||'').toLowerCase();

  var filtered = data;
  if (skuFilter || docFilter || tujFilter) {
    var validKey = {};
    data.forEach(function(r) {
      var k = r.noSo+'|'+r.planTgl;
      var skuOk = !skuFilter || (r.sku||'').toLowerCase().indexOf(skuFilter)>=0 || (r.nama||'').toLowerCase().indexOf(skuFilter)>=0;
      var docOk = !docFilter || _mekStripLeadingZero(r.noSo||'').toLowerCase().indexOf(docFilter.toLowerCase())>=0;
      var tujOk = !tujFilter || (r.tujuan||'').toLowerCase().indexOf(tujFilter.toLowerCase())>=0;
      if (skuOk && docOk && tujOk) validKey[k] = true;
    });
    filtered = data.filter(function(r){ return validKey[r.noSo+'|'+r.planTgl]; });
  }

  var byDate={}, dateOrder=[];
  filtered.forEach(function(r){
    if (!byDate[r.planTgl]){byDate[r.planTgl]=[];dateOrder.push(r.planTgl);}
    byDate[r.planTgl].push(r);
  });
  dateOrder=dateOrder.filter(function(d,i){return dateOrder.indexOf(d)===i;});

  var CS='border-bottom:1px solid #e2e8f0;padding:6px 8px;font-size:12px;';
  var html='';

  dateOrder.forEach(function(planTgl){
    var rows=byDate[planTgl];
    var sum=_mekCapEmailSummary[planTgl]||{total:0,keluar:0,loading:0,daftar:0,belum:0,pendingan:0};
    var pct=sum.total?Math.round(sum.keluar/sum.total*100):0;

    html+='<tr style="background:#1a3a5c;"><td colspan="14" style="padding:8px 12px;color:#fff;font-size:12px;font-weight:700;">' +
      '<span style="margin-right:12px;">' + _mekFmtTglDisplay(planTgl) + '</span>' +
      '<span style="background:rgba(255,255,255,.15);border-radius:10px;padding:2px 10px;font-size:11px;margin-right:6px;">Total: '+sum.total+' truk</span>' +
      '<span style="background:#48bb78;border-radius:10px;padding:2px 10px;font-size:11px;margin-right:6px;">' + sum.keluar + ' keluar</span>' +
      ((sum.loading+sum.daftar)?'<span style="background:#ed8936;border-radius:10px;padding:2px 10px;font-size:11px;margin-right:6px;">'+(sum.loading+sum.daftar)+' proses</span>':'') +
      (sum.belum?'<span style="background:#fc8181;border-radius:10px;padding:2px 10px;font-size:11px;margin-right:6px;">'+sum.belum+' belum</span>':'') +
      (sum.pendingan?'<span style="background:#f6d860;color:#744210;border-radius:10px;padding:2px 10px;font-size:11px;">'+sum.pendingan+' pendingan</span>':'') +
      '<span style="float:right;font-size:11px;opacity:.8;">'+pct+'% keluar</span>' +
      '</td></tr>';

    html+='<tr style="background:#2d4a6a;color:#bee3f8;font-size:11px;font-weight:700;">' +
      '<th style="padding:5px 8px;width:30px;">#</th><th style="padding:5px 8px;">NO SO</th>' +
      '<th style="padding:5px 8px;">SKU</th><th style="padding:5px 8px;">Nama Item</th>' +
      '<th style="padding:5px 8px;text-align:right;">Plan</th><th style="padding:5px 8px;">Tujuan</th>' +
      '<th style="padding:5px 8px;">No Pol</th><th style="padding:5px 8px;">Ekspedisi</th>' +
      '<th style="padding:5px 8px;">Waktu Daftar</th><th style="padding:5px 8px;">Proses Loading</th>' +
      '<th style="padding:5px 8px;">Waktu Keluar</th><th style="padding:5px 8px;">Status</th>' +
      '<th style="padding:5px 8px;">Tgl Aktual</th><th style="padding:5px 8px;">Keterangan</th></tr>';


    var rowNum=0;
    rows.forEach(function(r){
      // Skip baris belum yang kosong (tidak ada SO dan nopol)
      if (r.status === 'belum' && !r.noSo && !r.nopol) return;

      if(r.isFirstRow) rowNum++;
      var isPend=r.isPendingan;
      var bg=isPend?'background:#fffff0;':(r.status==='belum'?'background:#fff5f5;':'');
      var badge=r.status==='keluar'
        ?'<span style="background:#c6f6d5;color:#276749;border-radius:8px;padding:2px 8px;font-size:10px;font-weight:700;">Keluar</span>'
        :r.status==='loading'
        ?'<span style="background:#feebc8;color:#744210;border-radius:8px;padding:2px 8px;font-size:10px;font-weight:700;">Loading</span>'
        :r.status==='daftar'
        ?'<span style="background:#bee3f8;color:#2b6cb0;border-radius:8px;padding:2px 8px;font-size:10px;font-weight:700;">Daftar</span>'
        :'<span style="background:#fed7d7;color:#c53030;border-radius:8px;padding:2px 8px;font-size:10px;font-weight:700;">Belum</span>';
      var ket=isPend?'<span style="background:#f6d860;color:#744210;border-radius:6px;padding:1px 7px;font-size:10px;font-weight:700;">Pendingan tgl '+_mekFmtTglDisplay(r.pendinganDari)+'</span>':'';
      html+='<tr style="'+bg+'">' +
        '<td style="'+CS+'text-align:center;color:#a0aec0;">'+(r.isFirstRow?rowNum:'')+'</td>' +
        '<td style="'+CS+'font-weight:600;color:#2b6cb0;">'+(r.isFirstRow?_mekEsc(r.noSo||'\u2014'):'')+  '</td>' +
        '<td style="'+CS+'font-weight:700;">'+_mekEsc(r.sku||'')+'</td>' +
        '<td style="'+CS+'">'+_mekEsc(r.nama||'')+'</td>' +
        '<td style="'+CS+'text-align:right;font-weight:700;">'+(r.isFirstRow&&r.planCont?r.planCont:'')+'</td>' +
        '<td style="'+CS+'color:#276749;font-weight:600;">'+(r.isFirstRow?_mekEsc(r.tujuan||''):'')+'</td>' +
        '<td style="'+CS+'font-weight:600;">'+_mekEsc(r.nopol||'\u2014')+'</td>' +
        '<td style="'+CS+'">'+_mekEsc(r.ekspedisi||'\u2014')+'</td>' +
        '<td style="'+CS+'">'+_mekEsc(r.waktuDaftar||'\u2014')+'</td>' +
        '<td style="'+CS+'">'+_mekEsc(r.prosesLoading||'\u2014')+'</td>' +
        '<td style="'+CS+'">'+_mekEsc(r.waktuKeluar||'\u2014')+'</td>' +
        '<td style="'+CS+'">'+badge+'</td>' +
        '<td style="'+CS+'font-size:11px;color:#718096;">'+_mekEsc(r.tglDaftar?_mekFmtTglDisplay(r.tglDaftar):'\u2014')+'</td>' +
        '<td style="'+CS+'">'+ket+'</td>' +
        '</tr>';
        '</tr>';
    });
  });

  tbody.innerHTML = html;

  // Update summary cards (By Planning email)
  var _tc=0,_kc=0,_lc=0,_dc=0,_bc=0,_ss={};
  data.forEach(function(r){
    var k=r.noSo+'|'+r.planTgl;
    if(!_ss[k]){_ss[k]=true;_tc+=(r.planCont||1);}
    if(r.status==='keluar') _kc++;
    else if(r.status==='loading') _lc++;
    else if(r.status==='daftar') _dc++;
    else _bc++;
  });
  _mekSetCard('mekCapCardTotal',_tc);
  _mekSetCard('mekCapCardDatang',_kc+_lc+_dc);
  _mekSetCard('mekCapCardKeluar',_kc);
  _mekSetCard('mekCapCardDaftar',_lc+_dc);
  _mekSetCard('mekCapCardBelum',_bc);
  var _pe=document.getElementById('mekCapCardPct');
  if(_pe) _pe.textContent=_tc?Math.round(_kc/_tc*100)+'%':'—';
}

// ======================================================
// ── Parser tabel Email ───────────────────────────────────────
// Header kolom: KETERANGAN|SO|QT|NEGARA|KODE|MATERIAL|STUFFING DATE|QTY|STUFFING PLANT|NOTE
// Deteksi header dulu, lalu parse baris per baris
var _MEK_EMAIL_COLS = ['keterangan','so','qt','negara','kode','material','stuffing_date','qty','plant','note'];

function _mekParseEmailTable(text, stdCache) {
  if (!text) return [];

  // ── Debug: tampilkan teks mentah OCR di file log ─────────
  console.log('[MEK-EMAIL RAW TEXT]\n' + text.slice(0, 1000));
  var logEl = document.getElementById('mekEmailFileLog');
  if (logEl) {
    var dbg = document.createElement('details');
    dbg.style.cssText = 'margin:6px 0;padding:6px;background:#fffff0;border:1px solid #f6d860;border-radius:8px;font-size:11px;';
    dbg.innerHTML = '<summary style="cursor:pointer;font-weight:700;color:#744210;">📧 Teks yang terbaca OCR (klik untuk buka)</summary>' +
      '<pre style="white-space:pre-wrap;word-break:break-all;max-height:200px;overflow:auto;margin:6px 0;padding:8px;background:#fff;border-radius:6px;font-size:10px;line-height:1.4;">' +
      text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').slice(0, 3000) + '</pre>';
    logEl.appendChild(dbg);
  }

  var lines = text.replace(/\r\n/g,'\n').replace(/\r/g,'\n').split('\n')
    .map(function(l){ return l.trim(); }).filter(Boolean);

  var rows = [];
  var weekOverride = parseInt((document.getElementById('mekEmailWeek')||{}).value||'') || 0;
  var yearOverride = parseInt((document.getElementById('mekEmailYear')||{}).value||'') || new Date().getFullYear();

  // Bulan map
  var MONTHS = {jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12};

  function parseTgl(s) {
    if (!s) return '';
    s = String(s).trim();
    // dd-Mon-yy atau dd-Mon-yyyy: "08-Jun-26"
    var m = s.match(/^(\d{1,2})[\/\-.]([A-Za-z]{3})[\/\-.](\d{2,4})$/);
    if (m) {
      var mon = MONTHS[(m[2]||'').toLowerCase()] || 0;
      if (!mon) return '';
      var yr  = m[3].length === 2 ? '20' + m[3] : m[3];
      return yr + '-' + ('0'+mon).slice(-2) + '-' + ('0'+m[1]).slice(-2);
    }
    // dd/mm/yyyy
    var m2 = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (m2) return m2[3]+'-'+('0'+m2[2]).slice(-2)+'-'+('0'+m2[1]).slice(-2);
    return '';
  }

  // Cari header baris: harus ada kata STUFFING dan SO dan KODE/MATERIAL
  var headerIdx = -1;
  for (var h = 0; h < Math.min(lines.length, 10); h++) {
    var lup = lines[h].toUpperCase();
    if ((lup.indexOf('STUFFING') >= 0 || lup.indexOf('KODE') >= 0) &&
        (lup.indexOf('SO') >= 0 || lup.indexOf('MATERIAL') >= 0)) {
      headerIdx = h; break;
    }
  }
  // Jika header tidak ditemukan, coba parse buta (asumsi urutan kolom standar)
  var colMap = { keterangan:0, so:1, qt:2, negara:3, kode:4, material:5, stuffing_date:6, qty:7, plant:8, note:9 };

  if (headerIdx >= 0) {
    // Parse kolom dari header baris — pisah oleh tab atau multiple spaces
    var headers = lines[headerIdx].split(/\t+|\s{2,}/).map(function(s){ return s.trim().toLowerCase(); });
    headers.forEach(function(h, i) {
      if (/keterangan/.test(h))    colMap.keterangan   = i;
      else if (/^so$/.test(h))     colMap.so           = i;
      else if (/^qt$/.test(h))     colMap.qt           = i;
      else if (/negara/.test(h))   colMap.negara        = i;
      else if (/kode/.test(h))     colMap.kode          = i;
      else if (/material/.test(h)) colMap.material      = i;
      else if (/stuffing.*date|tanggal.*stuffing/.test(h)) colMap.stuffing_date = i;
      else if (/^qty$/.test(h))    colMap.qty           = i;
      else if (/plant|stuffing.*plant/.test(h)) colMap.plant = i;
      else if (/note|catatan/.test(h)) colMap.note      = i;
    });
  }

  // ── Pendekatan 2: parse baris per baris dengan regex pattern ─
  // Lebih robust untuk OCR yang tidak menghasilkan tab/spasi ganda konsisten
  // Pola per field:
  //   SO  = angka 9-12 digit (misal 102167393)
  //   QT  = angka 9-12 digit berbeda dari SO
  //   KODE = angka 6 digit (misal 421919, 422053)
  //   STUFFING DATE = dd-Mon-yy atau dd-Mon-yyyy
  //   QTY = angka 3-4 digit (1700, 1154, 1152)
  //   PLANT = JAYANTI 1/2/3, TANGERANG, dll
  //   NEGARA = kata INDIA/VIETNAM/MALAYSIA/CHINA dll
  //   MATERIAL = deskripsi produk uppercase panjang
  //   KETERANGAN = teks di awal baris (sebelum SO) atau kosong
  //   CANCEL = ada kata CANCEL di mana saja

  var NEGARA_LIST = ['INDIA','VIETNAM','MALAYSIA','CHINA','PHILIPPINES','MYANMAR',
                     'THAILAND','SINGAPORE','CAMBODIA','BANGLADESH','AFRICA','AUSTRALIA'];

  var dataStart = headerIdx >= 0 ? headerIdx + 1 : 0;

  for (var i = dataStart; i < lines.length; i++) {
    var line = lines[i];
    if (!line || line.length < 10) continue;
    // Skip baris yang pure header
    if (/^(keterangan|so|qt|negara|kode|material|stuffing|note)/i.test(line.trim())) continue;

    // 1. Cari SO (angka 9-12 digit, biasanya mulai 10/11/12)
    var soMatch = line.match(/\b(1\d{8,11})\b/g);
    if (!soMatch || soMatch.length < 1) continue;
    var so = soMatch[0];
    var qt = soMatch.length >= 2 ? soMatch[1] : '';

    // 2. Cari KODE (angka 6 digit, biasanya 4xxxxx)
    var kodeMatch = line.match(/\b([34]\d{5})\b/);
    var kode = kodeMatch ? kodeMatch[1] : '';

    // 3. Cari STUFFING DATE (dd-Mon-yy/yyyy)
    var tglMatch = line.match(/\b(\d{1,2})[\/\-]([A-Za-z]{3})[\/\-](\d{2,4})\b/);
    var tglRaw   = tglMatch ? tglMatch[0] : '';
    var tgl      = parseTgl(tglRaw);

    // 4. Cari QTY (angka 3-4 digit setelah tanggal, atau standalone)
    var qty = '';
    if (tglRaw) {
      var afterDate = line.slice(line.indexOf(tglRaw) + tglRaw.length);
      var qtyM = afterDate.match(/\b(\d{3,5})\b/);
      if (qtyM) qty = qtyM[1];
    }

    // 5. Cari NEGARA
    var negara = '';
    for (var n = 0; n < NEGARA_LIST.length; n++) {
      if (line.toUpperCase().indexOf(NEGARA_LIST[n]) >= 0) { negara = NEGARA_LIST[n]; break; }
    }

    // 6. Cari PLANT (JAYANTI 1/2/3 atau nama plant lain)
    var plantMatch = line.match(/\b(JAYANTI\s*\d|TANGERANG|KEJAYAN|CIBITUNG|BEKASI)\b/i);
    var plant = plantMatch ? plantMatch[0].trim() : '';

    // 7. Deteksi CANCEL
    var isCancel = /\bCANCEL\b/i.test(line);

    // 8. Ambil MATERIAL — panjang, uppercase, setelah KODE
    var material = '';
    if (kode) {
      var afterKode = line.slice(line.indexOf(kode) + kode.length).trim();
      // Material sampai sebelum tanggal atau sampai akhir baris sebelum angka qty/plant
      var matEnd = tglRaw ? afterKode.indexOf(tglRaw) : afterKode.length;
      if (matEnd < 0) matEnd = afterKode.length;
      material = afterKode.slice(0, matEnd)
        .replace(/^[A-Z]{2,}\s+/, '') // hapus negara di depan kalau ada
        .replace(/\s+/g, ' ').trim();
    }
    if (!material) {
      // Fallback: ambil uppercase panjang yang bukan angka
      var matMatch = line.match(/([A-Z][A-Z\s\d().\-]{10,}[A-Z\d])/);
      if (matMatch) material = matMatch[1].replace(/\s+/g,' ').trim();
    }

    // 9. KETERANGAN = teks sebelum SO (di kiri baris)
    var soIdx = line.indexOf(so);
    var ket   = soIdx > 2 ? line.slice(0, soIdx).replace(/\s+/g,' ').trim() : '';

    // Skip kalau tidak ada data minimal
    if (!so && !kode && !material) continue;

    var week = weekOverride
      ? String(weekOverride)
      : (tgl ? String(_mekDateToISOWeek(tgl)) : '');

    // Fuzzy match SKU
    var sku = kode && /^\d{5,6}$/.test(kode) ? kode : '';
    if (!sku && material && stdCache) {
      var matchStd = _mekFuzzyMatchStd(material, stdCache);
      if (matchStd) sku = matchStd.sku;
    }

    var source  = isCancel ? 'EMAIL_CANCEL' : 'EMAIL';
    var ketFull = [ket, (plant||'')].filter(function(s){ return s && s.length > 2; }).join(' | ');
    // Jangan duplikasi plant ke keterangan kalau sama persis
    if (ketFull === plant) ketFull = ket;

    rows.push({
      week:    week,
      tanggal: tgl,
      sku:     sku,
      nama:    material,
      jumlah:  '1',
      tujuan:  negara || '',
      ket:     ketFull,
      source:  source,
      _so:    so,
      _qt:    qt,
      _qty:   qty,
      _plant: plant,
      _cancel: isCancel
    });
  }
  return rows;
}

function _mekFinalizeEmail() {
  _mekRenderEmailPreview(_mekEmailRows);
  var ct = document.getElementById('mekEmailParseCount');
  if (ct) { ct.textContent = _mekEmailRows.length + ' baris'; ct.style.display = ''; }
  var clr = document.getElementById('mekEmailBtnClear');
  if (clr) clr.style.display = '';
  if (_mekEmailRows.length) showToast(_mekEmailRows.length + ' baris berhasil di-parse!', 'success');
  var fi = document.getElementById('mekEmailFileInput'); if (fi) fi.value = '';
}

function _mekRenderEmailPreview(rows) {
  var tbody = document.getElementById('mekEmailPreviewTbody');
  if (!tbody) return;
  if (!rows || !rows.length) {
    tbody.innerHTML = '<tr><td colspan="13" style="text-align:center;padding:40px;color:#a0aec0;">Tidak ada data</td></tr>';
    return;
  }
  tbody.innerHTML = rows.map(function(r, i) {
    var cancelStyle = r._cancel ? 'text-decoration:line-through;color:#9b2c2c;opacity:.7;' : '';
    var cancelBadge = r._cancel
      ? '<span style="background:#fed7d7;color:#9b2c2c;border-radius:8px;padding:1px 7px;font-size:10px;font-weight:700;margin-left:4px;">CANCEL</span>'
      : '';
    return '<tr style="' + (r._cancel ? 'background:#fff5f5;' : '') + '">' +
      '<td style="text-align:center;color:#a0aec0;font-size:11px;background:#f8fafc;">' + (i+1) + '</td>' +
      '<td style="text-align:center;">' + (r.week ? '<span style="background:#fefcbf;color:#744210;border-radius:10px;padding:1px 8px;font-size:11px;font-weight:700;">W'+r.week+'</span>' : '—') + '</td>' +
      '<td style="white-space:nowrap;font-size:12px;' + cancelStyle + '">' + _mekEsc(_mekFmtTglDisplay(r.tanggal)||r.tanggal||'—') + '</td>' +
      '<td><b style="font-size:12px;' + cancelStyle + '">' + _mekEsc(r.sku||'—') + '</b></td>' +
      '<td style="font-size:12px;' + cancelStyle + '">' + _mekEsc(r.nama||'—') + '</td>' +
      '<td style="font-size:12px;">' + _mekEsc(r.tujuan||'—') + '</td>' +
      '<td style="font-size:11px;font-family:monospace;color:#6b46c1;">' + _mekEsc(r._so||'—') + '</td>' +
      '<td style="font-size:11px;color:#718096;">' + _mekEsc(r._qt||'—') + '</td>' +
      '<td style="text-align:right;font-size:12px;">' + _mekEsc(r._qty||'—') + '</td>' +
      '<td style="font-size:11px;">' + _mekEsc(r._plant||'—') + '</td>' +
      '<td style="font-size:11px;color:#718096;">' + _mekEsc(r.ket||'—') + cancelBadge + '</td>' +
      '<td style="text-align:center;">' + (r._cancel
        ? '<span style="background:#fed7d7;color:#9b2c2c;border-radius:12px;padding:2px 8px;font-size:11px;font-weight:700;">CANCEL</span>'
        : '<span style="background:#c6f6d5;color:#276749;border-radius:12px;padding:2px 8px;font-size:11px;font-weight:700;">AKTIF</span>') +
      '</td>' +
      '<td style="text-align:center;"><button onclick="_mekDeleteEmailRow('+i+')" style="background:none;border:none;color:#fc8181;cursor:pointer;font-size:11px;padding:3px 5px;"><i class="fas fa-times"></i></button></td>' +
      '</tr>';
  }).join('');
}

function _mekDeleteEmailRow(idx) {
  _mekEmailRows.splice(idx, 1);
  _mekRenderEmailPreview(_mekEmailRows);
  var ct = document.getElementById('mekEmailParseCount');
  if (ct) ct.textContent = _mekEmailRows.length + ' baris';
}

function mekClearEmail() {
  _mekEmailRows = [];
  var dz  = document.getElementById('mekEmailDropZone');
  var rw  = document.getElementById('mekEmailResultWrap');
  var ct  = document.getElementById('mekEmailParseCount');
  var clr = document.getElementById('mekEmailBtnClear');
  var log = document.getElementById('mekEmailFileLog');
  if (dz)  dz.style.display  = '';
  if (rw)  rw.style.display  = 'none';
  if (ct)  ct.style.display  = 'none';
  if (clr) clr.style.display = 'none';
  if (log) log.innerHTML     = '';
  var tbody = document.getElementById('mekEmailPreviewTbody');
  if (tbody) tbody.innerHTML = '';
}

// ── File log Email ───────────────────────────────────────────
function _mekAddEmailLog(name, state) {
  var log = document.getElementById('mekEmailFileLog'); if (!log) return;
  var icons  = {loading:'fa-spinner fa-spin',parsing:'fa-robot',ok:'fa-check-circle',warn:'fa-exclamation-circle',error:'fa-times-circle'};
  var colors = {loading:'#a0aec0',parsing:'#2b6cb0',ok:'#276749',warn:'#744210',error:'#9b2c2c'};
  var div = document.createElement('div');
  div.id = 'mekEmailLog_'+name.replace(/[^a-z0-9]/gi,'_');
  div.style.cssText = 'display:flex;align-items:center;gap:8px;padding:6px 0;font-size:12px;border-bottom:1px solid #f0f0f0;';
  div.innerHTML = '<i class="fas '+(icons[state]||'fa-file')+'" style="color:'+(colors[state]||'#a0aec0')+';width:14px;"></i>'+
    '<span style="flex:1;font-weight:600;color:#2d3748;">'+_mekEsc(name)+'</span>'+
    '<span id="mekEmailLogMsg_'+name.replace(/[^a-z0-9]/gi,'_')+'" style="color:'+(colors[state]||'#a0aec0')+';font-size:11px;">'+state+'</span>';
  log.appendChild(div);
}

function _mekUpdateEmailLog(name, state, msg) {
  var icons  = {loading:'fa-spinner fa-spin',parsing:'fa-robot',ok:'fa-check-circle',warn:'fa-exclamation-circle',error:'fa-times-circle'};
  var colors = {loading:'#a0aec0',parsing:'#2b6cb0',ok:'#276749',warn:'#744210',error:'#9b2c2c'};
  var el  = document.getElementById('mekEmailLog_'+name.replace(/[^a-z0-9]/gi,'_')); if (!el) return;
  var ico = el.querySelector('i');
  var msgEl = document.getElementById('mekEmailLogMsg_'+name.replace(/[^a-z0-9]/gi,'_'));
  if (ico)   { ico.className = 'fas '+(icons[state]||'fa-file'); ico.style.color = colors[state]||'#a0aec0'; }
  if (msgEl) { msgEl.textContent = msg||state; msgEl.style.color = colors[state]||'#a0aec0'; }
}

// ════════════════════════════════════════════════════════════
// PANEL SI — Upload PDF atau Gambar (screenshot)
// ════════════════════════════════════════════════════════════

function mekHandleSiFiles(files) {
  if (!files || !files.length) return;

  // Tujuan boleh kosong — akan auto-fill dari DESTINATION di SI
  var tujuan = ((document.getElementById('mekSiTujuan') || {}).value || '').trim();

  var dz = document.getElementById('mekSiDropZone');
  var rw = document.getElementById('mekSiResultWrap');
  if (dz) dz.style.display = 'none';
  if (rw) rw.style.display = 'block';

  _mekSiRows = [];
  var fileLog = document.getElementById('mekSiFileLog');
  if (fileLog) fileLog.innerHTML = '';

  var ALLOWED = ['application/pdf','image/png','image/jpeg','image/jpg','image/webp','image/gif'];
  var fileArr = Array.from(files).filter(function(f){
    return ALLOWED.indexOf(f.type) >= 0 || /\.(pdf|png|jpg|jpeg|webp|gif)$/i.test(f.name);
  });
  if (!fileArr.length) { showToast('Pilih file PDF atau gambar (PNG/JPG/WEBP).', 'error'); return; }

  // Preload STD dulu, baru proses file
  _mekLoadStd(function(stdCache) {
    var done = 0;
    fileArr.forEach(function(file) {
      _mekAddSiFileStatus(file.name, 'loading');
      var isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);

      if (isPdf) {
        _mekReadPdfText(file, function(text) {
          if (!text) {
            _mekUpdateSiFileStatus(file.name, 'error', 'Gagal baca PDF');
            done++; if (done === fileArr.length) _mekFinalizeSiRows();
            return;
          }
          _mekUpdateSiFileStatus(file.name, 'parsing', 'Menganalisis...');
          _mekParseSiText(text, null, tujuan, stdCache, function(rows, detectedTujuan) {
            _mekSiRows = _mekSiRows.concat(rows);
            if (detectedTujuan) _mekAutoFillTujuan(detectedTujuan);
            _mekUpdateSiFileStatus(file.name, rows.length ? 'ok' : 'warn',
              rows.length ? rows.length + ' baris' : 'Tidak ada data');
            done++; if (done === fileArr.length) _mekFinalizeSiRows();
          });
        });
      } else {
        _mekUpdateSiFileStatus(file.name, 'parsing', 'Menganalisis gambar...');
        _mekFileToBase64(file, function(b64, mimeType) {
          if (!b64) {
            _mekUpdateSiFileStatus(file.name, 'error', 'Gagal baca gambar');
            done++; if (done === fileArr.length) _mekFinalizeSiRows();
            return;
          }
          _mekParseSiText(null, {b64:b64, mime:mimeType}, tujuan, stdCache, function(rows, detectedTujuan) {
            _mekSiRows = _mekSiRows.concat(rows);
            if (detectedTujuan) _mekAutoFillTujuan(detectedTujuan);
            _mekUpdateSiFileStatus(file.name, rows.length ? 'ok' : 'warn',
              rows.length ? rows.length + ' baris' : 'Tidak ada data');
            done++; if (done === fileArr.length) _mekFinalizeSiRows();
          });
        });
      }
    });
  });
}

// ── Paste gambar via Ctrl+V di panel SI ─────────────────────
function mekHandleSiPaste(e) {
  var items = (e.clipboardData || e.originalEvent && e.originalEvent.clipboardData || {}).items;
  if (!items) return;

  var imageItem = null;
  for (var i = 0; i < items.length; i++) {
    if (items[i].type && items[i].type.indexOf('image') === 0) {
      imageItem = items[i];
      break;
    }
  }
  if (!imageItem) return; // bukan gambar, biarkan event berjalan normal

  e.preventDefault();
  var file = imageItem.getAsFile();
  if (!file) return;

  // Beri nama file untuk log
  var ext  = file.type.split('/')[1] || 'png';
  var named = new File([file], 'screenshot_' + Date.now() + '.' + ext, { type: file.type });
  mekHandleSiFiles([named]);
}

// ── Helper: file → base64 ────────────────────────────────────
function _mekFileToBase64(file, callback) {
  var reader = new FileReader();
  reader.onload = function(e) {
    var dataUrl = e.target.result;
    var b64 = dataUrl.split(',')[1];
    callback(b64, file.type || 'image/jpeg');
  };
  reader.onerror = function() { callback(null, null); };
  reader.readAsDataURL(file);
}

// ── Auto-fill field Tujuan dari hasil parse ──────────────────
// Ambil kata terakhir yang berarti negara/kota (setelah koma atau kata terakhir)
function _mekAutoFillTujuan(dest) {
  var el = document.getElementById('mekSiTujuan');
  if (!el || el.value.trim()) return; // sudah diisi manual, jangan overwrite
  if (!dest) return;

  // Ekstrak: "TG. PRIOK, JKT - KATTUPALLI, INDIA" → "India"
  var dParts = dest.trim().split(/[,\-]\s*/);
  var last   = dParts[dParts.length - 1].trim().toUpperCase();

  el.value = last;
  el.style.borderColor = '#68d391';
  el.style.background  = '#f0fff4';
  showToast('Tujuan otomatis terisi: ' + last, 'success');
}
function _mekReadPdfText(file, callback) {
  if (!window.pdfjsLib) {
    var s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    s.onload = function() {
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      _mekExtractPdfText(file, callback);
    };
    s.onerror = function() { callback(null); };
    document.head.appendChild(s);
  } else {
    _mekExtractPdfText(file, callback);
  }
}

function _mekExtractPdfText(file, callback) {
  var reader = new FileReader();
  reader.onload = function(e) {
    pdfjsLib.getDocument({ data: new Uint8Array(e.target.result) }).promise
    .then(function(pdf) {
      var ps = [];
      for (var p = 1; p <= pdf.numPages; p++) ps.push(pdf.getPage(p));
      return Promise.all(ps);
    })
    .then(function(pages) {
      return Promise.all(pages.map(function(page) {
        return page.getTextContent().then(function(tc) {
          // Sort item berdasarkan posisi Y (baris) lalu X (kolom kiri ke kanan)
          // PDF.js koordinat Y: makin besar = makin ke atas, jadi kita balik (negatif)
          var items = tc.items.slice().sort(function(a, b) {
            var ay = Math.round(a.transform[5] / 5) * 5; // snap ke grid 5pt
            var by = Math.round(b.transform[5] / 5) * 5;
            if (ay !== by) return by - ay; // Y besar = atas = duluan
            return a.transform[4] - b.transform[4]; // X kecil = kiri = duluan
          });
          // Gabungkan dengan newline kalau Y berubah signifikan (beda baris)
          var lines = [];
          var curY = null;
          var curLine = [];
          items.forEach(function(it) {
            if (!it.str.trim()) return; // skip spasi kosong
            var y = Math.round(it.transform[5] / 3) * 3;
            if (curY === null) curY = y;
            if (Math.abs(y - curY) > 3) {
              // Baris baru
              if (curLine.length) lines.push(curLine.join(' '));
              curLine = [it.str];
              curY = y;
            } else {
              curLine.push(it.str);
            }
          });
          if (curLine.length) lines.push(curLine.join(' '));
          return lines.join('\n');
        });
      }));
    })
    .then(function(texts) { callback(texts.join('\n')); })
    .catch(function() { callback(null); });
  };
  reader.onerror = function() { callback(null); };
  reader.readAsArrayBuffer(file);
}

// ── Parse SI via Claude API (text atau image) ────────────────
function _mekParseSiText(text, image, tujuan, stdCache, callback) {
  var weekOverride = ((document.getElementById('mekSiWeek') || {}).value || '').trim();

  // ── Jika gambar: OCR dulu dengan Tesseract.js, lalu parse teks ──
  if (image && !text) {
    _mekOcrImage(image, function(ocrText) {
      if (!ocrText || ocrText.length < 20) { callback([]); return; }
      // DEBUG: tampilkan teks OCR di console agar bisa dicek
      console.log('[MEK-OCR RAW TEXT]\n' + ocrText);
      _mekParseSiText(ocrText, null, tujuan, stdCache, callback);
    });
    return;
  }

  // ── Parse teks SI dengan regex ─────────────────────────────
  if (!text) { callback([]); return; }

  console.log('[MEK-PARSE INPUT TEXT]\n' + text.slice(0, 500));
  var result = _mekRegexParseSi(text, weekOverride);
  console.log('[MEK-PARSE RESULT]', JSON.stringify(result));
  if (!result) { callback([], ''); return; }

  var tgl        = result.tanggal;
  var noSo       = result.noSo;
  var jumlahCont = result.jumlahCont;
  var dest       = result.destination;

  // Week: dari override input, atau hitung otomatis dari tanggal stuffing
  var week = weekOverride || '';
  if (!week && tgl) {
    var w = _mekDateToISOWeek(tgl);
    if (w) week = String(w);
  }

  // Tujuan pendek: ambil kata terakhir setelah koma/dash terakhir → UPPERCASE
  // "TG. PRIOK, JKT - KATTUPALLI, INDIA" → "INDIA"
  // "CAT LAI, HO CHI MINH - VIETNAM" → "VIETNAM"
  var destShort = dest;
  if (dest) {
    var dParts = dest.split(/[,\-]\s*/);
    destShort = dParts[dParts.length - 1].trim().toUpperCase();
  }

  // Deduplikasi sudah dilakukan di _mekRegexParseSi
  var uniqueItems = result.items;

  var finalTujuan = tujuan || destShort;
  var rows = uniqueItems.map(function(it, idx) {
    var match  = _mekFuzzyMatchStd(it.desc, stdCache);
    var sku    = match ? match.sku  : '';
    var nama   = it.desc;  // selalu pakai nama dari PDF/SI
    var qtyStr = String(it.qty || '') + (it.unit ? ' ' + it.unit : '');
    var isFirst = (idx === 0);
    return {
      week:       isFirst ? week    : '',
      tanggal:    isFirst ? tgl     : '',
      sku:        sku,
      noSo:       isFirst ? noSo   : '',
      nama:       nama,
      jumlah:     isFirst ? String(jumlahCont) : '',
      tujuan:     isFirst ? finalTujuan : '',
      ket:        isFirst ? (noSo ? 'SO:' + noSo + (dest ? ' | ' + dest : '') : dest) : '',
      _qtyKar:    qtyStr,
      _noSo:      noSo,
      _desc:      it.desc,
      _isFirst:   isFirst,
      _groupSize: uniqueItems.length,
      source:     'SI'
    };
  });

  callback(rows, destShort);
}

// ── Regex parser untuk teks SI (format PT. Mayora Indah) ─────
function _mekRegexParseSi(text, weekOverride) {
  if (!text) return null;

  // Normalisasi whitespace, hapus karakter zero-width
  var t = text.replace(/[\u200B-\u200D\uFEFF]/g, '')
              .replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // 1. Tanggal stuffing — berbagai format
  var tanggal = '';
  var _MONTHS = {january:1,february:2,march:3,april:4,may:5,june:6,
                 july:7,august:8,september:9,october:10,november:11,december:12};

  // Format: "STUFFING : JAYANTI 2/KITE 05.06.2026" atau "Stuffing Date : 06 June 2026"
  var stuffM = t.match(/(?:STUFFING|Stuffing\s*Date)\s*[:：]\s*[^\n]*?(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})/i);
  if (!stuffM) {
    // "Stuffing Date : 06 June 2026" (bulan nama)
    var stuffText = t.match(/(?:STUFFING|Stuffing\s*Date)\s*[:：]\s*[^\n]*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/i);
    if (stuffText) {
      var mNum = _MONTHS[(stuffText[2]||'').toLowerCase()] || 0;
      if (mNum) tanggal = stuffText[3]+'-'+('0'+mNum).slice(-2)+'-'+('0'+stuffText[1]).slice(-2);
    }
  }
  if (!tanggal && stuffM) {
    tanggal = stuffM[3] + '-' + ('0'+stuffM[2]).slice(-2) + '-' + ('0'+stuffM[1]).slice(-2);
  }
  // Fallback: ETD atau Stuffing Date sebagai tanggal kalau semua gagal
  if (!tanggal) {
    var etdM = t.match(/\bETD\s*[:：]\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/i);
    if (etdM) {
      var mNum2 = _MONTHS[(etdM[2]||'').toLowerCase()] || 0;
      if (mNum2) tanggal = etdM[3]+'-'+('0'+mNum2).slice(-2)+'-'+('0'+etdM[1]).slice(-2);
    }
  }
  // Fallback: cari tanggal standalone dd.MM.yyyy
  if (!tanggal) {
    var tglM = t.match(/(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})/);
    if (tglM) tanggal = tglM[3]+'-'+('0'+tglM[2]).slice(-2)+'-'+('0'+tglM[1]).slice(-2);
  }

  // 2. NO SO: beberapa format:
  //    "SO : 102167499" — format biasa
  //    "SO\n010260500842" — PDF 2-kolom (label kiri, nilai kanan, sort by Y)
  var noSo = '';
  var soM = t.match(/\bSO\s*[:：]\s*(\d+)/i);
  if (soM) {
    noSo = soM[1].trim();
  } else {
    // Format 2-kolom: cari label SO, lalu pasangkan dengan nilai di blok label-value
    // Pattern: [ETD, Plant Stuffing, Liner, Quotation, SO] + [val1, val2, val3, val4, val5]
    var lblBlock = t.match(/((?:(?:ETD|Plant\s*Stuffing|Liner|Quotation|SO|EO\s*Portal)\s*\n)+)/i);
    if (lblBlock) {
      var labels = lblBlock[0].trim().split(/\n/).map(function(s){return s.trim();}).filter(Boolean);
      var soLabelIdx = -1;
      labels.forEach(function(l,i){ if (/^SO$/i.test(l)) soLabelIdx = i; });
      if (soLabelIdx >= 0) {
        // Ambil nilai-nilai setelah blok label — urutan sama dengan label
        var afterBlock = t.slice(t.indexOf(lblBlock[0]) + lblBlock[0].length);
        var vals = afterBlock.split(/\n/).map(function(s){return s.trim();}).filter(Boolean);
        if (vals[soLabelIdx]) noSo = vals[soLabelIdx].replace(/\D/g,'').slice(0, 15);
      }
    }
    // Fallback: cari angka 9+ digit setelah kata SO dalam 300 char, ambil terakhir
    if (!noSo) {
      var soIdx = t.search(/\bSO\b/i);
      if (soIdx >= 0) {
        var nums = t.slice(soIdx, soIdx+300).match(/\d{9,}/g);
        if (nums) noSo = nums[nums.length - 1]; // angka terakhir = SO (bukan Quotation)
      }
    }
  }

  // 3. NO. CONT — berbagai pola:
  //    "NO. CONT : 2X40HC CONTAINER"
  //    "2X40HC CONTAINER"
  //    "2 X 40HC CONTAINER"
  //    "2X40' CONTAINER"
  //    "NO CONT : 2 X 40HC"
  var jumlahCont = 0;

  // Pola 1: label "NO. CONT : 2X40HC" atau "NO CONT : 2X40HC"
  var contLabel = t.match(/NO\.?\s*CONT\s*[:：]\s*(\d+)\s*[xX×]/i);
  if (contLabel) jumlahCont = parseInt(contLabel[1]) || 0;

  // Pola 2: "Jumlah Container : 1XCONTAINER" atau "Jumlah Container 1XCONTAINER" (titik dua optional)
  if (!jumlahCont) {
    var contJml = t.match(/Jumlah\s*Container\s*[:：]?\s*(\d+)/i);
    if (contJml) jumlahCont = parseInt(contJml[1]) || 0;
  }

  // Pola 3: "NXhh HC CONTAINER", "2X40HC CONTAINER", "1XCONTAINER 40 HC FT"
  if (!jumlahCont) {
    var contHc = t.match(/(\d+)\s*[xX×]\s*(?:CONTAINER\s+)?\d*['"]?\s*(?:HC|GP|OT|FR|RF|FT)/i);
    if (contHc) jumlahCont = parseInt(contHc[1]) || 0;
  }

  // Pola 4: "N CONTAINER" saja
  if (!jumlahCont) {
    var contSimple = t.match(/(\d+)\s*(?:UNIT\s*)?CONTAINER/i);
    if (contSimple) jumlahCont = parseInt(contSimple[1]) || 0;
  }

  // 4. DESTINATION
  var dest = '';
  var destMatches = t.match(/DESTINATION\s*[:：]\s*([^\n]+)/gi);
  if (destMatches) {
    for (var d = destMatches.length - 1; d >= 0; d--) {
      var dv = destMatches[d].replace(/^DESTINATION\s*[:：]\s*/i, '').trim();
      if (dv.length > 2) { dest = dv; break; }
    }
  }

  // 5. Items dari tabel: pola "NO  QTY  UNIT  DESCRIPTION"
  // Kumpulkan RAW dulu, lalu deduplikasi berdasarkan desc
  var rawItems = [];

  function _cleanDesc(raw) {
    return raw.trim().replace(/\s+/g, ' ')
              .replace(/\s+[\d.,]+\s+[\d.,]+\s*$/, '')
              .replace(/\s*\d+[.,]\d+\s*$/, '')
              .trim();
  }
  function _normKey(s) {
    return s.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 25);
  }

  // Pattern item: nomor baris + optional kolom extra (DO Portal) + qty + unit + desc
  // Handle: "1  1.250  KAR  ROMA..." dan "1  01195/DO-SHP/05/2026/MYOR  1.250  KAR  ROMA..."
  var itemRegex = /(?:^|\n)\s*\d+\s+(?:\S+\/\S+\s+)?(\d[\d.,]*)\s+(CAR|KAR|CTN|PCS|BOX|SET|UNIT|KG|PC)\s+([^\n]+)/gi;
  var im;
  while ((im = itemRegex.exec(t)) !== null) {
    var qty  = parseFloat(im[1].replace(/\./g,'').replace(',','.')) || 0;
    var unit = im[2].toUpperCase();
    var desc = _cleanDesc(im[3]);
    if (desc.length > 3) rawItems.push({ qty: qty, unit: unit, desc: desc });
  }

  if (!rawItems.length) {
    var looseRegex = /(?:^|\n)\s*\d+\s+(?:\S+\/\S+\s+)?(\d[\d.,]*)\s+(\w{2,5})\s+([A-Z][A-Z\s\d().\/]+)/gm;
    while ((im = looseRegex.exec(t)) !== null) {
      var qty2  = parseFloat(im[1].replace(/\./g,'').replace(',','.')) || 0;
      var unit2 = im[2].toUpperCase();
      var desc2 = _cleanDesc(im[3]);
      if (desc2.length > 5 && qty2 > 0) rawItems.push({ qty: qty2, unit: unit2, desc: desc2 });
    }
  }

  // Cek apakah semua baris item identik (format SI lama: 1 item repeat N kali = N cont)
  var freqMap = {}, firstItem = {};
  rawItems.forEach(function(it) {
    var k = _normKey(it.desc);
    if (!freqMap[k]) { freqMap[k] = 0; firstItem[k] = it; }
    freqMap[k]++;
  });
  var uniqueDescCount = Object.keys(freqMap).length;

  var items;
  if (uniqueDescCount === 1 && rawItems.length > 1) {
    // Format lama: semua baris identik → tampilkan SEMUA baris (masing-masing = 1 item)
    // jumlahCont total dari header, tidak dipecah per baris
    if (!jumlahCont) jumlahCont = rawItems.length;
    items = rawItems; // tampilkan semua, tidak deduplikasi
  } else {
    // Format multi-item: tiap baris = item berbeda
    // Deduplikasi hanya kalau desc PERSIS sama (handle OCR baca baris 2x)
    var seenExact = {};
    items = [];
    rawItems.forEach(function(it) {
      if (!seenExact[it.desc]) { seenExact[it.desc] = true; items.push({ qty: it.qty, unit: it.unit, desc: it.desc }); }
    });
  }

  if (!tanggal && !noSo && !items.length) return null;

  return {
    tanggal:     tanggal,
    noSo:        noSo,
    jumlahCont:  jumlahCont,
    destination: dest,
    items:       items
  };
}

// ── OCR gambar via GAS (Gemini/Drive) ─────────────────────
function _mekOcrImage(image, callback) {
  if (!image || !image.b64) { callback(null); return; }
  var logs = document.querySelectorAll('[id^="mekEmailLogMsg_"],[id^="mekSiLogMsg_"]');
  function setLog(msg) { if (logs.length) logs[logs.length-1].textContent = msg; }
  setLog('OCR via GAS...');
  _mekResizeImgB64(image.b64, image.mime, 1200, function(b64r, mimer) {
    console.log('[MEK-OCR] size:', Math.round(b64r.length/1024), 'KB');
    API.run('ocrImageEmail', { b64: b64r, mimeType: mimer }, function(res) {
      if (res && res.success && res.text && res.text.trim().length > 5) {
        setLog('OCR selesai');
        callback(res.text);
      } else {
        var msg = (res && res.message) ? res.message : 'OCR gagal';
        setLog(msg);
        showToast('OCR gagal: ' + msg, 'error');
        callback(null);
      }
    });
  });
}

// Resize gambar via Canvas sebelum kirim ke GAS
function _mekResizeImgB64(b64, mime, maxPx, cb) {
  try {
    var img = new Image();
    img.onload = function() {
      var w = img.width, h = img.height;
      var s = Math.min(1, maxPx / Math.max(w, h, 1));
      var cv = document.createElement('canvas');
      cv.width = Math.round(w*s); cv.height = Math.round(h*s);
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
      var out = cv.toDataURL('image/jpeg', 0.85);
      cb(out.split(',')[1], 'image/jpeg');
    };
    img.onerror = function() { cb(b64, mime); };
    img.src = 'data:' + mime + ';base64,' + b64;
  } catch(e) { cb(b64, mime); }
}

// ── Finalize: render tabel SI ────────────────────────────────
function _mekFinalizeSiRows() {
  _mekRenderSiPreview(_mekSiRows);
  var ct = document.getElementById('mekSiParseCount');
  if (ct) { ct.textContent = _mekSiRows.length + ' baris'; ct.style.display = ''; }
  if (_mekSiRows.length) showToast(_mekSiRows.length + ' baris dari SI berhasil di-parse!', 'success');
  var cb = document.getElementById('mekSiClearBtn'); if (cb) cb.style.display = '';
  var fi = document.getElementById('mekSiFileInput'); if (fi) fi.value = '';
}

function _mekRenderSiPreview(rows) {
  var tbody = document.getElementById('mekSiPreviewTbody');
  if (!tbody) return;
  if (!rows || !rows.length) {
    tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:30px;color:#a0aec0;">Tidak ada data</td></tr>';
    return;
  }
  // Hitung nomor grup untuk penomoran baris pertama
  var groupNums = [], gNum = 0;
  rows.forEach(function(r) { if (r._isFirst !== false || r._groupSize === undefined) gNum++; groupNums.push(gNum); });

  var ES = 'outline:none;min-width:40px;display:inline-block;border-radius:4px;padding:1px 3px;transition:background .15s;cursor:text;';

  tbody.innerHTML = rows.map(function(r, i) {
    var skuOk   = r.sku && r.sku !== r._desc;
    var isFirst = r._isFirst !== false;
    var contStyle = !isFirst ? 'border-left:3px solid #bee3f8;' : '';
    var skuColor  = skuOk ? '#2d3748' : '#e53e3e';
    var skuVal    = _mekEsc(r.sku || '');
    var namaVal   = _mekEsc(r.nama || '');
    var warnIcon  = !skuOk
      ? '<i class="fas fa-exclamation-triangle" style="color:#f6ad55;font-size:10px;margin-left:3px;" title="Isi SKU manual"></i>'
      : '';

    return '<tr style="' + (!isFirst ? 'background:#f7faff;' : '') + '">' +
      '<td style="text-align:center;color:#a0aec0;font-size:11px;font-weight:700;background:#f8fafc;' + contStyle + '">' + (isFirst ? groupNums[i] : '') + '</td>' +
      '<td style="text-align:center;">' +
        (isFirst ? (r.week ? '<span style="background:#ebf8ff;color:#2b6cb0;border-radius:10px;padding:1px 8px;font-size:11px;font-weight:700;">W'+r.week+'</span>' : '<span style="color:#cbd5e0;">—</span>') : '') +
      '</td>' +
      '<td style="white-space:nowrap;font-size:12px;">' + (isFirst ? _mekEsc(_mekFmtTglDisplay(r.tanggal)||r.tanggal) : '') + '</td>' +
      '<td style="font-size:12px;font-weight:600;color:#2d3748;">' + (isFirst ? _mekEsc(r.noSo||'—') : '') + '</td>' +
      '<td data-idx="'+i+'" data-field="sku" contenteditable="true" ' +
        'style="'+ES+'font-size:12px;font-weight:700;color:'+skuColor+';" ' +
        'onblur="_mekSiEditCell(' + i + ',\'sku\',this.innerText.trim())" ' +
        'onkeydown="if(event.key===\'Enter\'){event.preventDefault();this.blur();}" ' +
        'title="Klik untuk edit SKU">' + skuVal + '</td>' +
      (skuOk ? '<td style="display:none"></td>' : '<td style="padding:0;vertical-align:middle;">' + warnIcon + '</td>') +
      '<td data-idx="'+i+'" data-field="nama" contenteditable="true" ' +
        'style="'+ES+'font-size:12px;" ' +
        'onblur="_mekSiEditCell(' + i + ',\'nama\',this.innerText.trim())" ' +
        'onkeydown="if(event.key===\'Enter\'){event.preventDefault();this.blur();}" ' +
        'title="Klik untuk edit nama">' + namaVal + '</td>' +
      '<td style="text-align:right;font-weight:700;font-size:13px;">' + (isFirst ? _mekEsc(r.jumlah||'—') : '') + '</td>' +
      '<td style="font-size:12px;font-weight:600;color:#276749;">' + (isFirst ? _mekEsc(r.tujuan||'—') : '') + '</td>' +
      '<td style="font-size:11px;color:#718096;">' + (isFirst ? _mekEsc(r.ket) : '') + '</td>' +
      '<td style="text-align:center;">' +
        (isFirst ? '<button onclick="_mekDeleteSiGroup('+i+')" style="background:none;border:none;color:#fc8181;cursor:pointer;font-size:11px;padding:3px 5px;"><i class="fas fa-times"></i></button>' : '') +
      '</td>' +
      '</tr>';
  }).join('');
}

// Update _mekSiRows saat cell di-edit langsung di tabel
function _mekSiEditCell(idx, field, val) {
  if (!_mekSiRows[idx]) return;
  if (!val || val === _mekSiRows[idx][field]) return; // tidak ada perubahan
  _mekSiRows[idx][field] = val;
  // Kalau SKU diisi, hapus warning — re-render ringan hanya update style cell yg bersangkutan
  // (tidak perlu re-render seluruh tabel)
}

function _mekDeleteSiGroup(idx) {
  // Hapus baris pertama + semua baris lanjutan (baris setelahnya yang _isFirst=false)
  var end = idx + 1;
  while (end < _mekSiRows.length && _mekSiRows[end]._isFirst === false) end++;
  _mekSiRows.splice(idx, end - idx);
  // Re-tandai _isFirst untuk grup berikutnya (tidak berubah, splice sudah benar)
  _mekRenderSiPreview(_mekSiRows);
  var ct = document.getElementById('mekSiParseCount');
  if (ct) ct.textContent = _mekSiRows.length + ' baris';
}

function mekSiClear() {
  _mekSiRows = [];
  var dz = document.getElementById('mekSiDropZone');
  var rw = document.getElementById('mekSiResultWrap');
  var ct = document.getElementById('mekSiParseCount');
  var cb = document.getElementById('mekSiClearBtn');
  var fi = document.getElementById('mekSiFileInput');
  if (dz) dz.style.display = '';
  if (rw) rw.style.display = 'none';
  if (ct) { ct.textContent = '0 baris'; ct.style.display = 'none'; }
  if (cb) cb.style.display = 'none';
  if (fi) fi.value = '';
  var fl = document.getElementById('mekSiFileLog'); if (fl) fl.innerHTML = '';
  var tb = document.getElementById('mekSiPreviewTbody'); if (tb) tb.innerHTML = '';
  // Reset field Tujuan dan Week
  var tj = document.getElementById('mekSiTujuan');
  if (tj) { tj.value = ''; tj.style.borderColor = '#fc8181'; tj.style.background = '#fff5f5'; }
  var wk = document.getElementById('mekSiWeek');
  if (wk) wk.value = '';
}

function _mekDeleteSiRow(idx) {
  _mekSiRows.splice(idx, 1);
  _mekRenderSiPreview(_mekSiRows);
  var ct = document.getElementById('mekSiParseCount');
  if (ct) ct.textContent = _mekSiRows.length + ' baris';
}

// ── File status log ──────────────────────────────────────────
function _mekAddSiFileStatus(name, state) {
  var log = document.getElementById('mekSiFileLog'); if (!log) return;
  var icons  = { loading:'fa-spinner fa-spin', parsing:'fa-robot', ok:'fa-check-circle', warn:'fa-exclamation-circle', error:'fa-times-circle' };
  var colors = { loading:'#a0aec0', parsing:'#2b6cb0', ok:'#276749', warn:'#744210', error:'#9b2c2c' };
  var id = 'mekSiLog_' + name.replace(/[^a-z0-9]/gi,'_');
  var div = document.createElement('div');
  div.id = id;
  div.style.cssText = 'display:flex;align-items:center;gap:8px;padding:6px 0;font-size:12px;border-bottom:1px solid #f0f0f0;';
  div.innerHTML = '<i class="fas '+(icons[state]||'fa-file')+'" style="color:'+(colors[state]||'#a0aec0')+';width:14px;"></i>' +
    '<span style="flex:1;font-weight:600;color:#2d3748;">'+_mekEsc(name)+'</span>' +
    '<span id="mekSiLogMsg_'+name.replace(/[^a-z0-9]/gi,'_')+'" style="color:'+(colors[state]||'#a0aec0')+';font-size:11px;">'+state+'</span>';
  log.appendChild(div);
}

function _mekUpdateSiFileStatus(name, state, msg) {
  var icons  = { loading:'fa-spinner fa-spin', parsing:'fa-robot', ok:'fa-check-circle', warn:'fa-exclamation-circle', error:'fa-times-circle' };
  var colors = { loading:'#a0aec0', parsing:'#2b6cb0', ok:'#276749', warn:'#744210', error:'#9b2c2c' };
  var el  = document.getElementById('mekSiLog_'+name.replace(/[^a-z0-9]/gi,'_')); if (!el) return;
  var ico = el.querySelector('i');
  var msgEl = document.getElementById('mekSiLogMsg_'+name.replace(/[^a-z0-9]/gi,'_'));
  if (ico) { ico.className = 'fas '+(icons[state]||'fa-file'); ico.style.color = colors[state]||'#a0aec0'; }
  if (msgEl) { msgEl.textContent = msg||state; msgEl.style.color = colors[state]||'#a0aec0'; }
}

// ════════════════════════════════════════════════════════════
// TOGGLE SUMMARY VIEW: ALL / CAPAIAN PLANNING
// ════════════════════════════════════════════════════════════
var   _mekSumView = 'all';
  // Sembunyikan toggle All/Capaian saat di tab Input Planning
  var sumToggle = document.getElementById('mekSumViewToggle');
  if (sumToggle) sumToggle.style.display = 'none';

function mekSwitchSumView(view) {
  // Tampilkan toggle kalau sempat disembunyikan
  var sumToggle = document.getElementById('mekSumViewToggle');
  if (sumToggle) sumToggle.style.display = '';
  _mekSumView = view;
  var paneAll     = document.getElementById('mekPaneAll');
  var paneCapaian = document.getElementById('mekPaneCapaian');
  var btnAll      = document.getElementById('mekSumViewAll');
  var btnCap      = document.getElementById('mekSumViewCapaian');

  if (paneAll)     paneAll.style.display     = view === 'all'     ? '' : 'none';
  if (paneCapaian) paneCapaian.style.display = view === 'capaian' ? '' : 'none';
  if (btnAll) btnAll.classList.toggle('active', view === 'all');
  if (btnCap) btnCap.classList.toggle('active', view === 'capaian');

  // Init tanggal default capaian saat pertama dibuka
  if (view === 'capaian') {
    var today  = new Date();
    var yyyy   = today.getFullYear();
    var mm     = String(today.getMonth()+1).padStart(2,'0');
    var dd     = String(today.getDate()).padStart(2,'0');
    var elFrom = document.getElementById('mekCapFrom');
    var elTo   = document.getElementById('mekCapTo');
    if (elFrom && !elFrom.value) elFrom.value = yyyy+'-'+mm+'-01';
    if (elTo   && !elTo.value)   elTo.value   = yyyy+'-'+mm+'-'+dd;
  }
}

// ════════════════════════════════════════════════════════════
// CAPAIAN PLANNING
// ════════════════════════════════════════════════════════════
function mekLoadCapaian() {
  var from   = (document.getElementById('mekCapFrom')    || {}).value || '';
  var to     = (document.getElementById('mekCapTo')      || {}).value || '';
  var sku    = ((document.getElementById('mekCapSku')    || {}).value || '').trim().toLowerCase();
  var nopol  = ((document.getElementById('mekCapNopol')  || {}).value || '').trim().toLowerCase();
  var doc    = _mekStripLeadingZero(((document.getElementById('mekCapDoc') || {}).value || '').trim());
  var tujuan = ((document.getElementById('mekCapTujuan') || {}).value || '').trim().toLowerCase();

  var tbody = document.getElementById('mekCapTbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="12" style="text-align:center;padding:40px;color:#a0aec0;">' +
    '<i class="fas fa-spinner fa-spin" style="font-size:22px;"></i></td></tr>';

  // Sembunyikan/tampilkan thead dan toggle email
  var thead = document.getElementById('mekCapThead');
  if (thead) thead.style.display = _mekCapMode === 'email' ? 'none' : '';
  var emailToggle = document.getElementById('mekCapEmailViewToggle');
  if (emailToggle) emailToggle.style.display = _mekCapMode === 'email' ? '' : 'none';

  if (_mekCapMode === 'email') {
    API.run('getMekCapaianEmail', { from: from, to: to, viewMode: _mekCapEmailView }, function(res) {
      if (!res || !res.success) {
        tbody.innerHTML = '<tr><td colspan="14" style="text-align:center;padding:30px;color:#fc8181;">Gagal: '+(res&&res.message?res.message:'error')+'</td></tr>';
        return;
      }
      _mekCapEmailData = res.data || [];
      _mekCapEmailSummary = res.summaryByDate || {};
      if (_mekCapEmailView === 'aktual') {
        _mekRenderCapaianEmailAktual(_mekCapEmailData);
      } else {
        _mekRenderCapaianEmail(_mekCapEmailData, sku, doc, tujuan);
      }
    });
    return;
  }

  API.run('getMekCapaianPlanning', { from: from, to: to, mode: _mekCapMode }, function(res) {
    if (!res || !res.success) {
      tbody.innerHTML = '<tr><td colspan="12" style="text-align:center;padding:30px;color:#fc8181;">Gagal: ' +
        (res && res.message ? res.message : 'error') + '</td></tr>';
      return;
    }
    var data = res.data || [];

    // Filter lokal teks
    if (sku || doc || tujuan) {
      // Filter per grup planning (cek di baris pertama saja)
      var planKeys = {};
      data.forEach(function(r) {
        if (!r.isFirstRow) return;
        var skuOk  = !sku    || (r.sku||'').toLowerCase().indexOf(sku)>=0 || (r.nama||'').toLowerCase().indexOf(sku)>=0;
        var docOk  = !doc    || _mekStripLeadingZero(r.noDoc||'').indexOf(doc)>=0;
        var tujOk  = !tujuan || (r.tujuan||'').toLowerCase().indexOf(tujuan)>=0;
        var nopolOk= !nopol  || (r.nopol||'').toLowerCase().indexOf(nopol)>=0;
        if (skuOk && docOk && tujOk && nopolOk) planKeys[r._planKey] = true;
        else planKeys[r._planKey] = planKeys[r._planKey] || false;
      });
      data = data.filter(function(r){ return planKeys[r._planKey]; });
    }

    _mekCapData = data;
    _mekRenderCapaian(data, _mekCapFilter);
  }, function() {
    tbody.innerHTML = '<tr><td colspan="12" style="text-align:center;padding:30px;color:#fc8181;">Koneksi gagal.</td></tr>';
  });
}

var _mekCapData   = [];
var _mekCapFilter = 'all';  // 'all' | 'datang' | 'belum'
var _mekCapMode   = 'all';  // 'all' | 'wa' | 'si'

function mekCapSwitchMode(mode) {
  _mekCapMode = mode;
  ['mekCapModeAll','mekCapModeWA','mekCapModeSI','mekCapModeEmail'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.classList.toggle('active',
      (mode==='all'   && id==='mekCapModeAll')   ||
      (mode==='wa'    && id==='mekCapModeWA')    ||
      (mode==='si'    && id==='mekCapModeSI')    ||
      (mode==='email' && id==='mekCapModeEmail'));
  });
  mekLoadCapaian();
}

// ── Render By Aktual — grup per tanggal aktual masuk ─────────
function _mekRenderCapaianEmailAktual(data) {
  var tbody = document.getElementById('mekCapTbody');
  if (!tbody) return;
  if (!data || !data.length) {
    tbody.innerHTML = '<tr><td colspan="14" style="text-align:center;padding:40px;color:#a0aec0;">Tidak ada data.</td></tr>';
    return;
  }

  // Group per tanggal aktual (tglDaftar), skip baris belum
  var byAktual = {}, aktualOrder = [];
  data.forEach(function(r) {
    if (r.status === 'belum' || !r.tglDaftar) return;
    if (!byAktual[r.tglDaftar]) { byAktual[r.tglDaftar] = []; aktualOrder.push(r.tglDaftar); }
    byAktual[r.tglDaftar].push(r);
  });
  aktualOrder = aktualOrder.filter(function(d,i){ return aktualOrder.indexOf(d)===i; }).sort();

  var CS = 'border-bottom:1px solid #e2e8f0;padding:6px 8px;font-size:12px;';
  var html = '';

  aktualOrder.forEach(function(aktualTgl) {
    var rows = byAktual[aktualTgl];
    var keluar  = rows.filter(function(r){ return r.status==='keluar'; }).length;
    var loading = rows.filter(function(r){ return r.status==='loading'; }).length;
    var daftar  = rows.filter(function(r){ return r.status==='daftar'; }).length;
    var pend    = rows.filter(function(r){ return r.isPendingan; }).length;

    // Header tanggal aktual
    html += '<tr style="background:#276749;">' +
      '<td colspan="14" style="padding:8px 12px;color:#fff;font-size:12px;font-weight:700;">' +
        '<span style="margin-right:12px;">' + _mekFmtTglDisplay(aktualTgl) + '</span>' +
        '<span style="background:rgba(255,255,255,.15);border-radius:10px;padding:2px 10px;font-size:11px;margin-right:6px;">Total: '+rows.length+' truk</span>' +
        (keluar  ? '<span style="background:#48bb78;border-radius:10px;padding:2px 10px;font-size:11px;margin-right:6px;">'+keluar+' keluar</span>' : '') +
        (loading+daftar ? '<span style="background:#ed8936;border-radius:10px;padding:2px 10px;font-size:11px;margin-right:6px;">'+(loading+daftar)+' proses</span>' : '') +
        (pend ? '<span style="background:#f6d860;color:#744210;border-radius:10px;padding:2px 10px;font-size:11px;">'+pend+' pendingan</span>' : '') +
      '</td></tr>';

    // Header kolom
    html += '<tr style="background:#2d6a4f;color:#d8f3dc;font-size:11px;font-weight:700;">' +
      '<th style="padding:5px 8px;width:30px;">#</th>' +
      '<th style="padding:5px 8px;">NO SO</th>' +
      '<th style="padding:5px 8px;">SKU</th>' +
      '<th style="padding:5px 8px;">Nama Item</th>' +
      '<th style="padding:5px 8px;text-align:right;">Plan</th>' +
      '<th style="padding:5px 8px;">Tgl Plan</th>' +
      '<th style="padding:5px 8px;">No Pol</th>' +
      '<th style="padding:5px 8px;">Ekspedisi</th>' +
      '<th style="padding:5px 8px;">Waktu Daftar</th>' +
      '<th style="padding:5px 8px;">Proses Loading</th>' +
      '<th style="padding:5px 8px;">Waktu Keluar</th>' +
      '<th style="padding:5px 8px;">Status</th>' +
      '<th style="padding:5px 8px;">Tujuan</th>' +
      '<th style="padding:5px 8px;">Keterangan</th>' +
      '</tr>';

    // Group per SO — SO sama hanya tampil info di baris pertama
    var seenSo = {}, rowNum = 0;
    rows.forEach(function(r) {
      var isFirstSo = !seenSo[r.noSo];
      if (isFirstSo) { seenSo[r.noSo] = 0; rowNum++; }
      seenSo[r.noSo]++;

      var isPend = r.isPendingan;
      var bg = isPend ? 'background:#fffff0;' : '';

      var badge = r.status==='keluar'
        ? '<span style="background:#c6f6d5;color:#276749;border-radius:8px;padding:2px 8px;font-size:10px;font-weight:700;">Keluar</span>'
        : r.status==='loading'
        ? '<span style="background:#feebc8;color:#744210;border-radius:8px;padding:2px 8px;font-size:10px;font-weight:700;">Loading</span>'
        : '<span style="background:#bee3f8;color:#2b6cb0;border-radius:8px;padding:2px 8px;font-size:10px;font-weight:700;">Daftar</span>';

      var ket = isPend
        ? '<span style="background:#f6d860;color:#744210;border-radius:6px;padding:1px 7px;font-size:10px;font-weight:700;">Pendingan tgl '+_mekFmtTglDisplay(r.pendinganDari)+'</span>'
        : '';

      html += '<tr style="'+bg+'">' +
        '<td style="'+CS+'text-align:center;color:#a0aec0;">'+(isFirstSo ? rowNum : '')+'</td>' +
        '<td style="'+CS+'font-weight:600;color:#2b6cb0;">'+(isFirstSo ? _mekEsc(r.noSo||'—') : '')+'</td>' +
        '<td style="'+CS+'font-weight:700;">'+(isFirstSo ? _mekEsc(r.sku||'') : '')+'</td>' +
        '<td style="'+CS+'">'+(isFirstSo ? _mekEsc(r.nama||'') : '')+'</td>' +
        '<td style="'+CS+'text-align:right;font-weight:700;">'+(isFirstSo && r.planCont ? r.planCont : '')+'</td>' +
        '<td style="'+CS+'font-size:11px;color:#718096;">'+(isFirstSo ? _mekFmtTglDisplay(r.planTgl) : '')+'</td>' +
        '<td style="'+CS+'font-weight:600;">'+_mekEsc(r.nopol||'—')+'</td>' +
        '<td style="'+CS+'">'+_mekEsc(r.ekspedisi||'—')+'</td>' +
        '<td style="'+CS+'">'+_mekEsc(r.waktuDaftar||'—')+'</td>' +
        '<td style="'+CS+'">'+_mekEsc(r.prosesLoading||'—')+'</td>' +
        '<td style="'+CS+'">'+_mekEsc(r.waktuKeluar||'—')+'</td>' +
        '<td style="'+CS+'">'+badge+'</td>' +
        '<td style="'+CS+'color:#276749;font-weight:600;">'+_mekEsc(r.tujuan||'')+'</td>' +
        '<td style="'+CS+'">'+ket+'</td>' +
        '</tr>';
    });
  });

  tbody.innerHTML = html;

  // Update summary cards
  var totalC=0, keluarC=0, loadingC=0, daftarC=0, belumC=0;
  var seenSo3={};
  data.forEach(function(r){
    if(!seenSo3[r.noSo+'|'+r.planTgl]){ seenSo3[r.noSo+'|'+r.planTgl]=true; totalC+=(r.planCont||1); }
    if(r.status==='keluar') keluarC++;
    else if(r.status==='loading') loadingC++;
    else if(r.status==='daftar') daftarC++;
    else belumC++;
  });
  var datangC=keluarC+loadingC+daftarC;
  _mekSetCard('mekCapCardTotal',  totalC);
  _mekSetCard('mekCapCardDatang', datangC);
  _mekSetCard('mekCapCardKeluar', keluarC);
  _mekSetCard('mekCapCardDaftar', loadingC+daftarC);
  _mekSetCard('mekCapCardBelum',  belumC);
  var pctEl3=document.getElementById('mekCapCardPct');
  if(pctEl3) pctEl3.textContent = totalC ? Math.round(keluarC/totalC*100)+'%' : '—';
}

function mekCapSetFilter(f) {
  _mekCapFilter = f;
  var btns = ['mekCapFAll','mekCapFDatang','mekCapFBelum'];
  btns.forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.classList.toggle('active', id === 'mekCapF' + (f==='all'?'All':f==='datang'?'Datang':'Belum'));
  });
  _mekRenderCapaian(_mekCapData, f);
}

function mekCapSwitchFilterMode(mode) {
  var divDate = document.getElementById('mekCapFilterDate');
  var divWeek = document.getElementById('mekCapFilterWeek');
  var btnDate = document.getElementById('mekCapBtnDate');
  var btnWeek = document.getElementById('mekCapBtnWeek');
  var info    = document.getElementById('mekCapWeekInfo');
  if (divDate) divDate.style.display = mode === 'date' ? '' : 'none';
  if (divWeek) divWeek.style.display = mode === 'week' ? '' : 'none';
  if (btnDate) btnDate.classList.toggle('active', mode === 'date');
  if (btnWeek) btnWeek.classList.toggle('active', mode === 'week');
  if (info)    info.style.display = 'none';
}

function mekCapApplyWeek() {
  var wFrom = parseInt((document.getElementById('mekCapWeekFrom') || {}).value) || 0;
  var wTo   = parseInt((document.getElementById('mekCapWeekTo')   || {}).value) || wFrom;
  var year  = parseInt((document.getElementById('mekCapWeekYear') || {}).value) || new Date().getFullYear();
  if (!wFrom) { showToast('Isi nomor Week', 'warning'); return; }
  if (wFrom > wTo) { showToast('Week dari harus ≤ Week sampai', 'warning'); return; }
  var rf = _mekGetISOWeekRange(wFrom, year);
  var rt = _mekGetISOWeekRange(wTo,   year);
  var ef  = document.getElementById('mekCapFrom'); if (ef)  ef.value  = rf.from;
  var et  = document.getElementById('mekCapTo');   if (et)  et.value  = rt.to;
  var es  = document.getElementById('mekCapSku');    if (es)  es.value  = (document.getElementById('mekCapSkuW')||{}).value||'';
  var ed  = document.getElementById('mekCapDoc');    if (ed)  ed.value  = (document.getElementById('mekCapDocW')||{}).value||'';
  var enp = document.getElementById('mekCapNopol');  if (enp) enp.value = (document.getElementById('mekCapNopolW')||{}).value||'';
  var etj = document.getElementById('mekCapTujuan'); if (etj) etj.value = (document.getElementById('mekCapTujuanW')||{}).value||'';
  var infoTxt = document.getElementById('mekCapWeekInfoText');
  if (infoTxt) infoTxt.innerText = 'Week '+wFrom+(wFrom!==wTo?' – Week '+wTo:'')+' '+year+' = '+_mekFmtTglDisplay(rf.from)+' s/d '+_mekFmtTglDisplay(rt.to);
  var info = document.getElementById('mekCapWeekInfo'); if (info) info.style.display='block';
  mekLoadCapaian();
}

function mekResetCapaian() {
  ['mekCapSku','mekCapDoc','mekCapNopol','mekCapTujuan','mekCapSkuW','mekCapDocW','mekCapNopolW','mekCapTujuanW',
   'mekCapWeekFrom','mekCapWeekTo'].forEach(function(id){ var e=document.getElementById(id); if(e)e.value=''; });
  var today=new Date(), yyyy=today.getFullYear(), mm=String(today.getMonth()+1).padStart(2,'0'), dd=String(today.getDate()).padStart(2,'0');
  var ef=document.getElementById('mekCapFrom'); if(ef) ef.value=yyyy+'-'+mm+'-01';
  var et=document.getElementById('mekCapTo');   if(et) et.value=yyyy+'-'+mm+'-'+dd;
  var info=document.getElementById('mekCapWeekInfo'); if(info) info.style.display='none';
}

function _mekRenderCapaian(data, statusFilter) {
  var tbody  = document.getElementById('mekCapTbody');
  var ctEl   = document.getElementById('mekCapRowCount');
  if (!tbody) return;
  statusFilter = statusFilter || 'all';

  // Hitung summary — totalCont dari planning, status dari tiap baris realisasi
  var totalCont=0, keluarCont=0, daftarCont=0, loadingCont=0, belumCont=0;
  var seenPlanKey = {};
  data.forEach(function(r) {
    // Total planning: hitung dari _jumlahCont baris pertama per planKey
    if (!seenPlanKey[r._planKey]) {
      seenPlanKey[r._planKey] = true;
      totalCont += (r._jumlahCont || 0);
    }
    // Status per baris aktual
    if      (r.status === 'keluar')  keluarCont++;
    else if (r.status === 'loading') loadingCont++;
    else if (r.status === 'daftar')  daftarCont++;
    else                             belumCont++;
  });
  var pct = totalCont > 0 ? Math.round((keluarCont/totalCont)*100) : 0;

  var datangCont = keluarCont + loadingCont + daftarCont;  // total yang sudah datang
  _mekSetCard('mekCapCardTotal',   totalCont);
  _mekSetCard('mekCapCardDatang',  datangCont);
  _mekSetCard('mekCapCardKeluar',  keluarCont);
  _mekSetCard('mekCapCardDaftar',  loadingCont + daftarCont);
  _mekSetCard('mekCapCardBelum',   belumCont);
  var pctEl = document.getElementById('mekCapCardPct');
  if (pctEl) pctEl.textContent = totalCont ? (Math.round(keluarCont/totalCont*100) + '%') : '—';
  if (ctEl)  ctEl.textContent  = data.length + ' data';

  // Filter tampilan
  var filtered = data;
  if (statusFilter === 'datang') {
    // Tampilkan hanya planning yang punya minimal 1 realisasi + semua baris realisasinya
    var keysWithRealisasi = {};
    data.forEach(function(r){ if(r.status!=='belum') keysWithRealisasi[r._planKey]=true; });
    filtered = data.filter(function(r){ return keysWithRealisasi[r._planKey]; });
  } else if (statusFilter === 'belum') {
    // Tampilkan hanya planning yang semua barisnya belum
    var keysWithRealisasi2 = {};
    data.forEach(function(r){ if(r.status!=='belum') keysWithRealisasi2[r._planKey]=true; });
    filtered = data.filter(function(r){ return !keysWithRealisasi2[r._planKey]; });
  }

  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="12" style="text-align:center;padding:40px;color:#a0aec0;">' +
      '<i class="fas fa-box-open" style="font-size:28px;display:block;margin-bottom:8px;opacity:.2;"></i>Tidak ada data</td></tr>';
    return;
  }

  var STATUS = {
    keluar:  { label:'✅ Keluar',  bg:'#c6f6d5', color:'#276749' },
    loading: { label:'🔄 Loading', bg:'#e9d8fd', color:'#6b46c1' },
    daftar:  { label:'🚛 Daftar',  bg:'#bee3f8', color:'#2b6cb0' },
    belum:   { label:'⏳ Belum',   bg:'#fed7d7', color:'#9b2c2c' },
    cancel:  { label:'❌ Cancel',  bg:'#e2e8f0', color:'#718096' }
  };

  var rows = '';
  filtered.forEach(function(r, i) {
    var st  = STATUS[r.status] || STATUS.belum;
    var srcUp = (r.source||'').toUpperCase();
    var src = srcUp === 'SI'
      ? '<span style="background:#e9d8fd;color:#6b46c1;border-radius:8px;padding:1px 7px;font-size:10px;font-weight:700;">SI</span>'
      : srcUp === 'WA'
        ? '<span style="background:#c6f6d5;color:#276749;border-radius:8px;padding:1px 7px;font-size:10px;font-weight:700;">WA</span>'
        : srcUp === 'EMAIL'
          ? '<span style="background:#fefcbf;color:#744210;border-radius:8px;padding:1px 7px;font-size:10px;font-weight:700;">EMAIL</span>'
          : srcUp === 'EMAIL_CANCEL'
            ? '<span style="background:#e2e8f0;color:#9b2c2c;border-radius:8px;padding:1px 7px;font-size:10px;font-weight:700;text-decoration:line-through;">CANCEL</span>'
            : '';

    // Border atas tebal untuk setiap baris pertama planning baru
    var borderTop = r.isFirstRow && i > 0 ? 'border-top:2px solid #e2e8f0;' : '';

    rows += '<tr style="' + borderTop + '">' +
      '<td style="text-align:center;color:#a0aec0;font-size:11px;background:#f8fafc;' + borderTop + '">' + (i+1) + '</td>' +
      // Kolom planning — hanya diisi di baris pertama
      '<td style="white-space:nowrap;font-size:12px;' + borderTop + '">' + (r.tanggal ? _mekEsc(_mekFmtTglDisplay(r.tanggal)) : '') + '</td>' +
      '<td style="' + borderTop + '"><b style="font-size:12px;">' + _mekEsc(r.sku||'') + '</b></td>' +
      '<td style="font-size:12px;' + borderTop + '">' + _mekEsc(r.nama||'') + '</td>' +
      '<td style="text-align:right;font-weight:700;' + borderTop + '">' + (r.jumlahCont !== null ? r.jumlahCont : '') + '</td>' +
      '<td style="font-size:12px;' + borderTop + '">' + _mekEsc(r.tujuan||'') + '</td>' +
      // Kolom realisasi — semua baris
      '<td style="font-size:11px;font-family:monospace;color:#6b46c1;">' + _mekEsc(r.noDoc||'—') + '</td>' +
      '<td style="font-size:12px;">' + _mekEsc(r.nopol||'—') + '</td>' +
      '<td style="white-space:nowrap;font-size:11px;color:#4a5568;">' + _mekEsc(r.waktuDaftar||'—') + '</td>' +
      '<td style="white-space:nowrap;font-size:11px;color:#4a5568;">' + _mekEsc(r.prosesLoading||'—') + '</td>' +
      '<td style="white-space:nowrap;font-size:11px;color:#4a5568;">' + _mekEsc(r.waktuKeluar||'—') + '</td>' +
      '<td style="text-align:center;"><span style="padding:2px 10px;border-radius:12px;font-size:11px;font-weight:700;background:'+st.bg+';color:'+st.color+';">'+st.label+'</span></td>' +
      '<td style="text-align:center;">' + src + '</td>' +
      '</tr>';
  });
  tbody.innerHTML = rows;
}

// ════════════════════════════════════════════════════════════
// DOWNLOAD MENU TOGGLE
// ════════════════════════════════════════════════════════════
function mekToggleDownloadMenu() {
  var menu = document.getElementById('mekDownloadMenu');
  if (!menu) return;
  var isOpen = menu.style.display !== 'none';
  menu.style.display = isOpen ? 'none' : 'block';

  if (!isOpen) {
    // Tutup saat klik di luar
    setTimeout(function () {
      document.addEventListener('click', _mekCloseDownloadMenu);
    }, 10);
  }
}

function _mekCloseDownloadMenu(e) {
  var wrap = document.getElementById('mekDownloadWrap');
  if (wrap && !wrap.contains(e.target)) {
    var menu = document.getElementById('mekDownloadMenu');
    if (menu) menu.style.display = 'none';
    document.removeEventListener('click', _mekCloseDownloadMenu);
  }
}
