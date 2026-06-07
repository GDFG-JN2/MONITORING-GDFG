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
  _mekInitPlanningTable(20);
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

  // Sync SKU/Tujuan dari field week ke date supaya mekLoadSummary baca dari satu tempat
  var skuW  = (document.getElementById('mekFilterSkuW')  || {}).value || '';
  var destW = (document.getElementById('mekFilterDestW') || {}).value || '';
  var elSku  = document.getElementById('mekFilterSku');  if (elSku)  elSku.value  = skuW;
  var elDest = document.getElementById('mekFilterDest'); if (elDest) elDest.value = destW;

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
  ['mekFilterSku','mekFilterDest','mekFilterWeekFrom','mekFilterWeekTo','mekFilterSkuW','mekFilterDestW']
    .forEach(function(id){ var e=document.getElementById(id); if(e) e.value=''; });
  var ii = document.getElementById('mekWeekFilterInfo'); if (ii) ii.style.display = 'none';
}

// ── Tab switching ─────────────────────────────────────────────
function mekSwitchTab(tab) {
  var spEl = document.getElementById('mekSummaryPane');
  var ipEl = document.getElementById('mekInputPane');
  var tsEl = document.getElementById('mekTabSummary');
  var tiEl = document.getElementById('mekTabInput');

  var showEl = tab === 'summary' ? spEl : ipEl;
  var hideEl = tab === 'summary' ? ipEl : spEl;
  if (!showEl || !hideEl) return;

  hideEl.style.opacity = '0'; hideEl.style.transition = 'opacity .18s ease';
  setTimeout(function () {
    hideEl.style.display = 'none';
    showEl.style.opacity = '0'; showEl.style.display = 'block'; showEl.style.transition = 'opacity .2s ease';
    requestAnimationFrame(function () { requestAnimationFrame(function () { showEl.style.opacity = '1'; }); });
  }, 180);

  var ac = '#1a3a5c';
  if (tsEl) { tsEl.style.color = tab==='summary'?ac:'#718096'; tsEl.style.borderBottomColor = tab==='summary'?ac:'transparent'; }
  if (tiEl) { tiEl.style.color = tab==='input'  ?ac:'#718096'; tiEl.style.borderBottomColor = tab==='input'  ?ac:'transparent'; }
  var bsEl = document.getElementById('btnMekSummary'); if (bsEl) bsEl.style.background = tab==='summary'?'rgba(255,255,255,.35)':'rgba(255,255,255,.2)';
  var biEl = document.getElementById('btnMekInput');   if (biEl) biEl.style.background = tab==='input'  ?'rgba(255,255,255,.35)':'rgba(255,255,255,.2)';
}

// ════════════════════════════════════════════════════════════
// TAB SUMMARY — baca dari sheet ANTRIAN
// Kolom yang ditampilkan:
//   D = No Pol, E = Ekspedisi, F = No DOC, I = Tujuan,
//   L = Waktu Daftar, P = Waktu Keluar
// ════════════════════════════════════════════════════════════
function mekLoadSummary() {
  var from  = (document.getElementById('mekFilterFrom')  || {}).value || '';
  var to    = (document.getElementById('mekFilterTo')    || {}).value || '';
  var nopol = ((document.getElementById('mekFilterNopol')  || {}).value || '').trim().toLowerCase();
  var dest  = ((document.getElementById('mekFilterDest')  || {}).value || '').trim().toLowerCase();

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

    // Filter lokal
    if (nopol) data = data.filter(function (r) { return (r.nopol || '').toLowerCase().indexOf(nopol) >= 0; });
    if (dest)  data = data.filter(function (r) { return (r.tujuan || '').toLowerCase().indexOf(dest) >= 0; });

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
      '<td>' + _mekEsc(r.noDoc || '-') + '</td>' +
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
      '<td>' + _mekEsc(r.noDoc||'-') + '</td>' +
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
      r.noDoc       || '',
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
// TAB INPUT PLANNING
// ════════════════════════════════════════════════════════════
var MEK_PLAN_COLS = [
  { key:'tanggal',   label:'Tanggal',     type:'date',   width:'110px' },
  { key:'sku',       label:'SKU',         type:'text',   width:'90px'  },
  { key:'nama',      label:'Nama Barang', type:'text',   width:'180px' },
  { key:'tujuan',    label:'Tujuan',      type:'text',   width:'120px' },
  { key:'pallet',    label:'Pallet',      type:'number', width:'70px'  },
  { key:'krt',       label:'Karton',      type:'number', width:'80px'  },
  { key:'ekspedisi', label:'Ekspedisi',   type:'text',   width:'110px' },
  { key:'nopol',     label:'No. Pol',     type:'text',   width:'90px'  },
  { key:'status',    label:'Status',      type:'select', width:'100px',
    options:['','ON TRACK','DELAY','PENDING','DONE'] },
  { key:'ket',       label:'Keterangan',  type:'text',   width:'160px' }
];

function _mekInitPlanningTable(n) {
  var tbody = document.getElementById('mekPlanTbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  for (var i = 0; i < n; i++) _mekAppendPlanRow({});
  _mekUpdatePlanRowNums();
}

function _mekAppendPlanRow(data) {
  var tbody = document.getElementById('mekPlanTbody');
  if (!tbody) return;
  var tr = document.createElement('tr');

  var tdNo = document.createElement('td');
  tdNo.className = 'mek-td-no';
  tdNo.style.cssText = 'text-align:center;color:#a0aec0;font-size:11px;font-weight:700;background:#f8fafc;width:32px;user-select:none;';
  tr.appendChild(tdNo);

  MEK_PLAN_COLS.forEach(function (col) {
    var td = document.createElement('td');
    td.setAttribute('data-key', col.key);
    td.style.padding = '0';
    if (col.type === 'select') {
      var sel = document.createElement('select');
      sel.style.cssText = 'width:100%;border:none;background:transparent;font-size:12px;padding:5px 7px;outline:none;';
      col.options.forEach(function (opt) {
        var o = document.createElement('option');
        o.value = opt; o.textContent = opt || '—';
        if (data[col.key] === opt) o.selected = true;
        sel.appendChild(o);
      });
      td.appendChild(sel);
    } else {
      var inp = document.createElement('input');
      inp.type  = col.type === 'number' ? 'number' : (col.type === 'date' ? 'date' : 'text');
      inp.value = data[col.key] !== undefined ? data[col.key] : '';
      inp.style.cssText = 'width:100%;border:none;background:transparent;font-size:12px;padding:5px 7px;outline:none;box-sizing:border-box;';
      if (col.type === 'number') { inp.min = '0'; inp.style.textAlign = 'right'; }
      td.appendChild(inp);
    }
    tr.appendChild(td);
  });

  var tdDel  = document.createElement('td');
  tdDel.style.cssText = 'text-align:center;width:32px;';
  var btnDel = document.createElement('button');
  btnDel.innerHTML = '<i class="fas fa-times"></i>';
  btnDel.style.cssText = 'background:none;border:none;color:#fc8181;cursor:pointer;font-size:12px;padding:4px 6px;';
  btnDel.onclick = function () { tr.parentNode && tr.parentNode.removeChild(tr); _mekUpdatePlanRowNums(); };
  tdDel.appendChild(btnDel);
  tr.appendChild(tdDel);
  tbody.appendChild(tr);
}

function _mekUpdatePlanRowNums() {
  var tbody = document.getElementById('mekPlanTbody');
  if (!tbody) return;
  Array.from(tbody.rows).forEach(function (tr, i) {
    var tdNo = tr.querySelector('.mek-td-no'); if (tdNo) tdNo.textContent = i + 1;
  });
}

function mekAddPlanRows()   { for (var i = 0; i < 10; i++) _mekAppendPlanRow({}); _mekUpdatePlanRowNums(); }
function mekClearPlanTable(){ if (!confirm('Yakin ingin hapus semua baris?')) return; _mekInitPlanningTable(20); }

function _mekGetPlanRows() {
  var tbody = document.getElementById('mekPlanTbody');
  if (!tbody) return [];
  var rows = [];
  Array.from(tbody.rows).forEach(function (tr) {
    var obj = {}, hasData = false;
    MEK_PLAN_COLS.forEach(function (col) {
      var td = tr.querySelector('[data-key="'+col.key+'"]'); if (!td) return;
      var el = td.querySelector('input, select');
      var val = el ? el.value.trim() : '';
      obj[col.key] = val;
      if (val && col.key !== 'tanggal') hasData = true;
    });
    if (hasData) rows.push(obj);
  });
  return rows;
}

function mekSavePlanning() {
  var rows = _mekGetPlanRows();
  if (!rows.length) { showToast('Tidak ada data untuk disimpan.', 'warn'); return; }
  var btn = document.getElementById('mekBtnSave');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...'; }
  API.run('saveMekPlanningData', { rows: rows }, function (res) {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> Simpan'; }
    if (res && res.success) { showToast(res.message || 'Berhasil disimpan!', 'success'); _mekInitPlanningTable(20); }
    else showToast('Gagal: ' + (res && res.message ? res.message : 'error'), 'error');
  }, function () {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> Simpan'; }
    showToast('Koneksi gagal. Coba lagi.', 'error');
  });
}

function mekHandlePaste(e) {
  e.preventDefault();
  var text  = (e.clipboardData || window.clipboardData).getData('text');
  var lines = text.trim().split('\n');
  var tbody = document.getElementById('mekPlanTbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  lines.forEach(function (line) {
    var cells = line.split('\t');
    var obj   = {};
    MEK_PLAN_COLS.forEach(function (col, i) { obj[col.key] = (cells[i] || '').trim(); });
    _mekAppendPlanRow(obj);
  });
  for (var i = 0; i < 5; i++) _mekAppendPlanRow({});
  _mekUpdatePlanRowNums();
  showToast(lines.length + ' baris berhasil di-paste.', 'success');
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
