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
  var rows = _mekPlanMode === 'si' ? _mekSiRows : _mekParsedRows;
  if (!rows || !rows.length) {
    showToast(_mekPlanMode === 'si' ? 'Belum ada data SI. Upload PDF dulu.' : 'Belum ada data. Parse dulu teks WA-nya.', 'warning');
    return;
  }

  var btnId = _mekPlanMode === 'si' ? 'mekSiBtnSave' : 'mekBtnSave';
  var btn   = document.getElementById(btnId);
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...'; }

  API.run('saveMekPlanningData', { rows: rows }, function (res) {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> Simpan'; }
    if (res && res.success) {
      showToast(res.message || 'Berhasil disimpan!', 'success');
      if (_mekPlanMode === 'si') {
        _mekSiRows = [];
        _mekRenderSiPreview([]);
        var dz = document.getElementById('mekSiDropZone');
        var rw = document.getElementById('mekSiResultWrap');
        if (dz) dz.style.display = '';
        if (rw) rw.style.display = 'none';
        var ct = document.getElementById('mekSiParseCount'); if (ct) ct.style.display = 'none';
      } else {
        mekClearWa();
      }
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
  if (!itemText || !stdCache) return null;
  var query = itemText.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')   // hapus simbol
    .replace(/\s+/g, ' ').trim();
  var qTokens = query.split(' ').filter(Boolean);
  if (!qTokens.length) return null;

  var best = null, bestScore = 0;
  Object.keys(stdCache).forEach(function(key) {
    var kTokens = key.replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim().split(' ').filter(Boolean);
    // Hitung berapa token query yang ada di key
    var hit = qTokens.filter(function(t){ return kTokens.indexOf(t) >= 0; }).length;
    // Normalisasi: hit / max(qLen, kLen) agar tidak bias ke string panjang
    var score = hit / Math.max(qTokens.length, kTokens.length);
    if (score > bestScore) { bestScore = score; best = stdCache[key]; }
  });
  // Threshold minimal 40% token match
  return bestScore >= 0.4 ? best : null;
}

// ════════════════════════════════════════════════════════════
// TOGGLE MODE: WA / SI
// ════════════════════════════════════════════════════════════
function mekSwitchPlanMode(mode) {
  _mekPlanMode = mode;
  var waPanel = document.getElementById('mekWaPanel');
  var siPanel = document.getElementById('mekSiPanel');
  var btnWa   = document.getElementById('mekPlanModeWa');
  var btnSi   = document.getElementById('mekPlanModeSi');
  var ac = '#1a3a5c', in_ = '#718096';

  if (waPanel) waPanel.style.display = mode === 'wa' ? 'flex' : 'none';
  if (siPanel) siPanel.style.display = mode === 'si' ? 'flex' : 'none';
  if (btnWa) { btnWa.style.color = mode==='wa'?ac:in_; btnWa.style.borderBottomColor = mode==='wa'?ac:'transparent'; }
  if (btnSi) { btnSi.style.color = mode==='si'?ac:in_; btnSi.style.borderBottomColor = mode==='si'?ac:'transparent'; }

  // Preload STD dan pasang global paste saat mode SI dibuka
  if (mode === 'si') {
    _mekLoadStd(function(){});
    document.addEventListener('paste', _mekGlobalSiPaste);
  } else {
    document.removeEventListener('paste', _mekGlobalSiPaste);
  }
}

function _mekGlobalSiPaste(e) {
  // Jangan intercept kalau user sedang ketik di input/textarea
  var tag = (e.target && e.target.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea') return;
  if (_mekPlanMode === 'si') mekHandleSiPaste(e);
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

  // Ekstrak: "TG. PRIOK, JKT - KATTUPALLI, INDIA" → "INDIA"
  // Ambil kata/frasa setelah tanda koma atau dash terakhir
  var clean = dest.trim();
  // Coba ambil setelah koma+spasi terakhir
  var parts = clean.split(/,\s*/);
  var last  = parts[parts.length - 1].trim();
  // Kalau hasil masih ada " - ", ambil sesudahnya
  var dashParts = last.split(/\s*[-–]\s*/);
  last = dashParts[dashParts.length - 1].trim();
  // Kapitalisasi title case sederhana
  last = last.charAt(0).toUpperCase() + last.slice(1).toLowerCase();

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
          return tc.items.map(function(i){ return i.str; }).join(' ');
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
      // Rekursif: sekarang punya teks, parse biasa
      _mekParseSiText(ocrText, null, tujuan, stdCache, callback);
    });
    return;
  }

  // ── Parse teks SI dengan regex ─────────────────────────────
  if (!text) { callback([]); return; }

  var result = _mekRegexParseSi(text, weekOverride);
  if (!result) { callback([], ''); return; }

  var tgl        = result.tanggal;
  var noSo       = result.noSo;
  var jumlahCont = result.jumlahCont;
  var dest       = result.destination;
  var week       = weekOverride || '';

  // Deduplikasi items
  var seen = {}, uniqueItems = [];
  result.items.forEach(function(it) {
    var key = String(it.qty) + '|' + it.desc;
    if (!seen[key]) { seen[key] = true; uniqueItems.push(it); }
  });

  var finalTujuan = tujuan || dest;
  var rows = uniqueItems.map(function(it) {
    var match  = _mekFuzzyMatchStd(it.desc, stdCache);
    var sku    = match ? match.sku  : '';
    var nama   = match ? match.nama : it.desc;
    var qtyStr = String(it.qty || '') + (it.unit ? ' ' + it.unit : '');
    return {
      week:    week,
      tanggal: tgl,
      sku:     sku,
      nama:    nama,
      jumlah:  String(jumlahCont),
      tujuan:  finalTujuan,
      ket:     noSo ? 'SO:' + noSo + (dest ? ' | ' + dest : '') : dest,
      _qtyKar: qtyStr,
      _noSo:   noSo,
      _desc:   it.desc,
      source:  'SI'
    };
  });

  callback(rows, dest);
}

// ── Regex parser untuk teks SI (format PT. Mayora Indah) ─────
function _mekRegexParseSi(text, weekOverride) {
  if (!text) return null;

  // Normalisasi whitespace
  var t = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // 1. Tanggal stuffing: "STUFFING : ..." kemudian tanggal dd.MM.yyyy (bisa di baris yang sama atau berikutnya)
  var tanggal = '';
  var stuffM = t.match(/STUFFING\s*[:：]\s*[^\n]*?(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})/i);
  if (!stuffM) {
    // Coba tanggal di baris berikutnya setelah STUFFING
    stuffM = t.match(/STUFFING\s*[:：][^\n]*[\n\s]+(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})/i);
  }
  if (stuffM) {
    tanggal = stuffM[3] + '-' + ('0'+stuffM[2]).slice(-2) + '-' + ('0'+stuffM[1]).slice(-2);
  }
  // Fallback: cari tanggal standalone dd.MM.yyyy setelah kata STUFFING
  if (!tanggal) {
    var tglM = t.match(/(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})/);
    if (tglM) tanggal = tglM[3]+'-'+('0'+tglM[2]).slice(-2)+'-'+('0'+tglM[1]).slice(-2);
  }

  // 2. NO SO: "SO : 102167499" atau "SO:102167499"
  var noSo = '';
  var soM = t.match(/\bSO\s*[:：]\s*(\d+)/i);
  if (soM) noSo = soM[1].trim();

  // 3. NO. CONT: "2X40HC CONTAINER" atau "2 X 40HC" atau "2X40'"
  var jumlahCont = 0;
  var contM = t.match(/NO\.?\s*CONT\s*[:：]\s*(\d+)\s*[xX×]/i);
  if (contM) jumlahCont = parseInt(contM[1]) || 0;
  // Fallback: "CONTAINER" baris
  if (!jumlahCont) {
    var contM2 = t.match(/(\d+)\s*[xX×]\s*\d+['"]?\s*(?:HC|GP|OT|FR|RF)?\s*CONTAINER/i);
    if (contM2) jumlahCont = parseInt(contM2[1]) || 0;
  }

  // 4. DESTINATION: setelah "DESTINATION :"
  var dest = '';
  var destMatches = t.match(/DESTINATION\s*[:：]\s*([^\n]+)/gi);
  if (destMatches) {
    // Ambil destination terakhir yang bukan kosong (kadang ada 2 kali)
    for (var d = destMatches.length - 1; d >= 0; d--) {
      var dv = destMatches[d].replace(/^DESTINATION\s*[:：]\s*/i, '').trim();
      if (dv.length > 2) { dest = dv; break; }
    }
  }

  // 5. Items dari tabel: pola "NO  QTY  UNIT  DESCRIPTION"
  // Baris item: angka, diikuti angka (qty), diikuti unit (CAR/CTN/PCS/dll), diikuti deskripsi
  var items = [];
  var itemRegex = /(?:^|\n)\s*\d+\s+([\d.,]+)\s+(CAR|CTN|PCS|BOX|SET|UNIT|KG|PC)\s+([^\n]+)/gi;
  var im;
  while ((im = itemRegex.exec(t)) !== null) {
    var qty  = parseFloat(im[1].replace(/\./g,'').replace(',','.')) || 0;
    var unit = im[2].toUpperCase();
    var desc = im[3].trim().replace(/\s+/g, ' ');
    // Bersihkan trailing angka/simbol aneh
    desc = desc.replace(/\s*\d+[.,]\d+\s*$/, '').trim();
    if (desc.length > 3) {
      items.push({ qty: qty, unit: unit, desc: desc });
    }
  }

  // Fallback: kalau item tidak ditemukan, coba pola lebih longgar
  if (!items.length) {
    var looseRegex = /(?:^|\n)\s*\d+\s+([\d.,]+)\s+(\w{2,5})\s+([A-Z][A-Z\s\d().\/]+)/gm;
    while ((im = looseRegex.exec(t)) !== null) {
      var qty2  = parseFloat(im[1].replace(/\./g,'').replace(',','.')) || 0;
      var unit2 = im[2].toUpperCase();
      var desc2 = im[3].trim().replace(/\s+/g, ' ');
      if (desc2.length > 5 && qty2 > 0) {
        items.push({ qty: qty2, unit: unit2, desc: desc2 });
      }
    }
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

// ── OCR gambar via Tesseract.js ──────────────────────────────
function _mekOcrImage(image, callback) {
  // Load Tesseract.js dari CDN
  if (!window.Tesseract) {
    showToast('Memuat OCR engine...', 'info');
    var s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/5.0.5/tesseract.min.js';
    s.onload = function() { _mekRunOcr(image, callback); };
    s.onerror = function() {
      showToast('Gagal memuat Tesseract.js', 'error');
      callback(null);
    };
    document.head.appendChild(s);
  } else {
    _mekRunOcr(image, callback);
  }
}

function _mekRunOcr(image, callback) {
  var imgSrc = 'data:' + image.mime + ';base64,' + image.b64;
  Tesseract.recognize(imgSrc, 'eng', {
    logger: function(m) {
      if (m.status === 'recognizing text' && m.progress) {
        var pct = Math.round(m.progress * 100);
        // Update status di file log jika ada
        var logs = document.querySelectorAll('[id^="mekSiLogMsg_"]');
        if (logs.length) {
          var last = logs[logs.length - 1];
          last.textContent = 'OCR ' + pct + '%...';
        }
      }
    }
  }).then(function(result) {
    callback(result && result.data ? result.data.text : null);
  }).catch(function() {
    callback(null);
  });
}

// ── Finalize: render tabel SI ────────────────────────────────
function _mekFinalizeSiRows() {
  _mekRenderSiPreview(_mekSiRows);
  var ct = document.getElementById('mekSiParseCount');
  if (ct) { ct.textContent = _mekSiRows.length + ' baris'; ct.style.display = ''; }
  if (_mekSiRows.length) showToast(_mekSiRows.length + ' baris dari SI berhasil di-parse!', 'success');
  var fi = document.getElementById('mekSiFileInput'); if (fi) fi.value = '';
}

function _mekRenderSiPreview(rows) {
  var tbody = document.getElementById('mekSiPreviewTbody');
  if (!tbody) return;
  if (!rows || !rows.length) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:30px;color:#a0aec0;">Tidak ada data</td></tr>';
    return;
  }
  tbody.innerHTML = rows.map(function(r, i) {
    var skuOk = r.sku && r.sku !== r._desc;
    return '<tr>' +
      '<td style="text-align:center;color:#a0aec0;font-size:11px;font-weight:700;background:#f8fafc;">' + (i+1) + '</td>' +
      '<td style="text-align:center;">' + (r.week ? '<span style="background:#ebf8ff;color:#2b6cb0;border-radius:10px;padding:1px 8px;font-size:11px;font-weight:700;">W'+r.week+'</span>' : '<span style="color:#cbd5e0;">—</span>') + '</td>' +
      '<td style="white-space:nowrap;font-size:12px;">' + _mekEsc(_mekFmtTglDisplay(r.tanggal)||r.tanggal) + '</td>' +
      '<td>' +
        (skuOk
          ? '<b style="font-size:12px;">' + _mekEsc(r.sku) + '</b>'
          : '<span style="color:#fc8181;font-size:11px;" title="SKU tidak ditemukan di STD"><i class="fas fa-exclamation-triangle"></i> tidak ditemukan</span>') +
      '</td>' +
      '<td style="font-size:12px;">' + _mekEsc(r.nama) +
        (r._qtyKar ? '<br><span style="font-size:10px;color:#a0aec0;">'+_mekEsc(r._qtyKar)+'</span>' : '') +
      '</td>' +
      '<td style="text-align:right;font-weight:700;font-size:13px;">' + _mekEsc(r.jumlah||'—') + '</td>' +
      '<td style="font-size:12px;font-weight:600;color:#276749;">' + _mekEsc(r.tujuan||'—') + '</td>' +
      '<td style="font-size:11px;color:#718096;">' + _mekEsc(r.ket) + '</td>' +
      '<td style="text-align:center;"><button onclick="_mekDeleteSiRow('+i+')" style="background:none;border:none;color:#fc8181;cursor:pointer;font-size:11px;padding:3px 5px;"><i class="fas fa-times"></i></button></td>' +
      '</tr>';
  }).join('');
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
var _mekSumView = 'all';

function mekSwitchSumView(view) {
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
  var doc    = _mekStripLeadingZero(((document.getElementById('mekCapDoc') || {}).value || '').trim());
  var tujuan = ((document.getElementById('mekCapTujuan') || {}).value || '').trim().toLowerCase();

  var tbody = document.getElementById('mekCapTbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="12" style="text-align:center;padding:40px;color:#a0aec0;">' +
    '<i class="fas fa-spinner fa-spin" style="font-size:22px;"></i></td></tr>';

  API.run('getMekCapaianPlanning', { from: from, to: to }, function(res) {
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
        if (skuOk && docOk && tujOk) planKeys[r._planKey] = true;
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
  var etj = document.getElementById('mekCapTujuan'); if (etj) etj.value = (document.getElementById('mekCapTujuanW')||{}).value||'';
  var infoTxt = document.getElementById('mekCapWeekInfoText');
  if (infoTxt) infoTxt.innerText = 'Week '+wFrom+(wFrom!==wTo?' – Week '+wTo:'')+' '+year+' = '+_mekFmtTglDisplay(rf.from)+' s/d '+_mekFmtTglDisplay(rt.to);
  var info = document.getElementById('mekCapWeekInfo'); if (info) info.style.display='block';
  mekLoadCapaian();
}

function mekResetCapaian() {
  ['mekCapSku','mekCapDoc','mekCapTujuan','mekCapSkuW','mekCapDocW','mekCapTujuanW',
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

  // Hitung summary berdasarkan planning (baris pertama saja), per container bukan per baris
  var totalCont=0, keluarCont=0, daftarCont=0, loadingCont=0, belumCont=0;
  var seenPlanKey = {};

  data.forEach(function(r) {
    if (!seenPlanKey[r._planKey]) {
      seenPlanKey[r._planKey] = { jumlah: r._jumlahCont||0, realisasi: r._realisasi||0 };
    }
  });

  Object.keys(seenPlanKey).forEach(function(k) {
    var p = seenPlanKey[k];
    totalCont  += p.jumlah;
    keluarCont += Math.min(p.realisasi, p.jumlah); // realisasi tidak melebihi planning
    belumCont  += Math.max(0, p.jumlah - p.realisasi);
  });

  // Hitung per status dari data rows
  data.forEach(function(r) {
    if      (r.status === 'keluar')  keluarCont = 0; // reset, hitung ulang dari rows
    else if (r.status === 'loading') loadingCont = 0;
  });
  // Hitung ulang dari rows langsung
  keluarCont=0; loadingCont=0; daftarCont=0; belumCont=0; totalCont=0;
  var seenPlanKey2 = {};
  data.forEach(function(r) {
    if (!seenPlanKey2[r._planKey]) { seenPlanKey2[r._planKey]=true; totalCont+=(r._jumlahCont||0); }
    if (r.status==='keluar')       keluarCont++;
    else if (r.status==='loading') loadingCont++;
    else if (r.status==='daftar')  daftarCont++;
    else                           belumCont++;
  });
  var sudahCont = keluarCont + loadingCont + daftarCont;
  var pct = totalCont > 0 ? Math.round((keluarCont/totalCont)*100) : 0;

  _mekSetCard('mekCapCardKeluar',  keluarCont);
  _mekSetCard('mekCapCardDaftar',  loadingCont + daftarCont);
  _mekSetCard('mekCapCardBelum',   belumCont);
  _mekSetCard('mekCapCardTotal',   totalCont);
  var pctEl = document.getElementById('mekCapCardPct');
  if (pctEl) pctEl.textContent = (totalCont ? pct : '—') + (totalCont ? '%' : '');
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
    belum:   { label:'⏳ Belum',   bg:'#fed7d7', color:'#9b2c2c' }
  };

  var rows = '';
  filtered.forEach(function(r, i) {
    var st  = STATUS[r.status] || STATUS.belum;
    var src = r.source === 'SI'
      ? '<span style="background:#e9d8fd;color:#6b46c1;border-radius:8px;padding:1px 7px;font-size:10px;font-weight:700;">SI</span>'
      : (r.source === 'WA'
        ? '<span style="background:#c6f6d5;color:#276749;border-radius:8px;padding:1px 7px;font-size:10px;font-weight:700;">WA</span>'
        : '');

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
