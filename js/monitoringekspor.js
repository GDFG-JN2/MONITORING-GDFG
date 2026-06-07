// ============================================================
// monitoringekspor.js — MONITORING GDFG
// Halaman: Monitoring Ekspor
// Tab: Summary | Input Planning
// ============================================================

// ── State ────────────────────────────────────────────────────
var _mekData        = [];   // data planning (array of objects)
var _mekSummaryData = [];   // data summary setelah filter

// ── Inisialisasi halaman ─────────────────────────────────────
function mekInitPage() {
  var today = new Date();
  var yyyy  = today.getFullYear();
  var mm    = String(today.getMonth() + 1).padStart(2, '0');
  var dd    = String(today.getDate()).padStart(2, '0');
  var ymd   = yyyy + '-' + mm + '-' + dd;
  var ymFrom = yyyy + '-' + mm + '-01';

  var elFrom = document.getElementById('mekFilterFrom');
  var elTo   = document.getElementById('mekFilterTo');
  if (elFrom && !elFrom.value) elFrom.value = ymFrom;
  if (elTo   && !elTo.value)   elTo.value   = ymd;

  // Set tanggal default di form planning
  var elTgl = document.getElementById('mekPlanTanggal');
  if (elTgl && !elTgl.value) elTgl.value = ymd;

  mekSwitchTab('summary');
  _mekInitPlanningTable(20);
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

  hideEl.style.opacity    = '0';
  hideEl.style.transition = 'opacity .18s ease';
  setTimeout(function () {
    hideEl.style.display  = 'none';
    showEl.style.opacity  = '0';
    showEl.style.display  = 'block';
    showEl.style.transition = 'opacity .2s ease';
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { showEl.style.opacity = '1'; });
    });
  }, 180);

  var activeColor = '#1a3a5c';
  if (tsEl) {
    tsEl.style.color             = tab === 'summary' ? activeColor : '#718096';
    tsEl.style.borderBottomColor = tab === 'summary' ? activeColor : 'transparent';
  }
  if (tiEl) {
    tiEl.style.color             = tab === 'input' ? activeColor : '#718096';
    tiEl.style.borderBottomColor = tab === 'input' ? activeColor : 'transparent';
  }

  var bsEl = document.getElementById('btnMekSummary');
  var biEl = document.getElementById('btnMekInput');
  if (bsEl) bsEl.style.background = tab === 'summary' ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.2)';
  if (biEl) biEl.style.background = tab === 'input'   ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.2)';
}

// ════════════════════════════════════════════════════════════
// TAB SUMMARY
// ════════════════════════════════════════════════════════════
function mekLoadSummary() {
  var from = (document.getElementById('mekFilterFrom') || {}).value || '';
  var to   = (document.getElementById('mekFilterTo')   || {}).value || '';
  var sku  = ((document.getElementById('mekFilterSku')  || {}).value || '').trim().toLowerCase();
  var dest = ((document.getElementById('mekFilterDest') || {}).value || '').trim().toLowerCase();

  var tbody = document.getElementById('mekSumTbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:30px;color:#a0aec0;"><i class="fas fa-spinner fa-spin" style="font-size:22px;"></i></td></tr>';

  // Ambil data dari GAS
  API.run('getMekPlanningData', { from: from, to: to }, function (res) {
    if (!res || !res.success) {
      tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:30px;color:#fc8181;">Gagal memuat data: ' + (res && res.message ? res.message : 'Unknown error') + '</td></tr>';
      return;
    }
    var data = res.data || [];

    // Filter lokal
    if (sku)  data = data.filter(function (r) { return (r.sku || '').toLowerCase().indexOf(sku) >= 0 || (r.nama || '').toLowerCase().indexOf(sku) >= 0; });
    if (dest) data = data.filter(function (r) { return (r.tujuan || '').toLowerCase().indexOf(dest) >= 0; });

    _mekSummaryData = data;
    _mekRenderSummaryTable(data);
    _mekRenderSummaryCards(data);
    document.getElementById('mekSumRowCount').textContent = data.length + ' DATA';
  }, function () {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:30px;color:#fc8181;">Koneksi gagal. Coba lagi.</td></tr>';
  });
}

function _mekRenderSummaryCards(data) {
  var totalSKU    = {};
  var totalPallet = 0;
  var totalKrt    = 0;
  var dests       = {};

  data.forEach(function (r) {
    if (r.sku) totalSKU[r.sku] = 1;
    totalPallet += Number(r.pallet) || 0;
    totalKrt    += Number(r.krt)    || 0;
    if (r.tujuan) dests[r.tujuan] = (dests[r.tujuan] || 0) + (Number(r.pallet) || 0);
  });

  _mekSetCard('mekCardSku',    Object.keys(totalSKU).length);
  _mekSetCard('mekCardPallet', totalPallet);
  _mekSetCard('mekCardKrt',    totalKrt);
  _mekSetCard('mekCardDest',   Object.keys(dests).length);
}

function _mekSetCard(id, val) {
  var el = document.getElementById(id);
  if (el) el.textContent = _mekFmt(val);
}

function _mekFmt(n) {
  return Number(n).toLocaleString('id-ID');
}

function _mekRenderSummaryTable(data) {
  var tbody = document.getElementById('mekSumTbody');
  if (!tbody) return;
  if (!data || !data.length) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:40px;color:#a0aec0;font-size:13px;"><i class="fas fa-box-open" style="font-size:28px;display:block;margin-bottom:10px;opacity:.25;"></i>Tidak ada data</td></tr>';
    return;
  }
  var rows = '';
  data.forEach(function (r, i) {
    var statusCls = '';
    var statusTxt = r.status || '-';
    if (statusTxt === 'ON TRACK')  statusCls = 'background:#c6f6d5;color:#276749;';
    if (statusTxt === 'DELAY')     statusCls = 'background:#fed7d7;color:#9b2c2c;';
    if (statusTxt === 'PENDING')   statusCls = 'background:#fefcbf;color:#744210;';

    rows += '<tr>' +
      '<td style="text-align:center;color:#a0aec0;font-size:11px;">' + (i + 1) + '</td>' +
      '<td>' + _esc(r.tanggal || '') + '</td>' +
      '<td><b>' + _esc(r.sku || '') + '</b></td>' +
      '<td>' + _esc(r.nama || '') + '</td>' +
      '<td>' + _esc(r.tujuan || '') + '</td>' +
      '<td style="text-align:right;">' + _mekFmt(r.pallet || 0) + '</td>' +
      '<td style="text-align:right;">' + _mekFmt(r.krt || 0) + '</td>' +
      '<td>' + _esc(r.ekspedisi || '') + '</td>' +
      '<td style="text-align:center;"><span style="padding:2px 10px;border-radius:12px;font-size:11px;font-weight:700;' + statusCls + '">' + _esc(statusTxt) + '</span></td>' +
      '</tr>';
  });
  tbody.innerHTML = rows;
}

function _esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ════════════════════════════════════════════════════════════
// TAB INPUT PLANNING
// ════════════════════════════════════════════════════════════

// Kolom tabel input planning
var MEK_PLAN_COLS = [
  { key: 'tanggal',   label: 'Tanggal',       type: 'date',   width: '110px' },
  { key: 'sku',       label: 'SKU',           type: 'text',   width: '90px'  },
  { key: 'nama',      label: 'Nama Barang',   type: 'text',   width: '180px' },
  { key: 'tujuan',    label: 'Tujuan',        type: 'text',   width: '120px' },
  { key: 'pallet',    label: 'Pallet',        type: 'number', width: '70px'  },
  { key: 'krt',       label: 'Karton',        type: 'number', width: '80px'  },
  { key: 'ekspedisi', label: 'Ekspedisi',     type: 'text',   width: '110px' },
  { key: 'nopol',     label: 'No. Pol',       type: 'text',   width: '90px'  },
  { key: 'status',    label: 'Status',        type: 'select', width: '100px',
    options: ['', 'ON TRACK', 'DELAY', 'PENDING', 'DONE'] },
  { key: 'ket',       label: 'Keterangan',    type: 'text',   width: '160px' }
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

  // No
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

  // Tombol hapus baris
  var tdDel = document.createElement('td');
  tdDel.style.cssText = 'text-align:center;width:32px;';
  var btnDel = document.createElement('button');
  btnDel.innerHTML = '<i class="fas fa-times"></i>';
  btnDel.title = 'Hapus baris';
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
    var tdNo = tr.querySelector('.mek-td-no');
    if (tdNo) tdNo.textContent = i + 1;
  });
}

function mekAddPlanRows() {
  for (var i = 0; i < 10; i++) _mekAppendPlanRow({});
  _mekUpdatePlanRowNums();
}

function mekClearPlanTable() {
  if (!confirm('Yakin ingin hapus semua baris?')) return;
  _mekInitPlanningTable(20);
}

function _mekGetPlanRows() {
  var tbody = document.getElementById('mekPlanTbody');
  if (!tbody) return [];
  var rows = [];
  Array.from(tbody.rows).forEach(function (tr) {
    var obj = {};
    var hasData = false;
    MEK_PLAN_COLS.forEach(function (col) {
      var td  = tr.querySelector('[data-key="' + col.key + '"]');
      if (!td) return;
      var el  = td.querySelector('input, select');
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
    if (res && res.success) {
      showToast(res.message || 'Data berhasil disimpan!', 'success');
      _mekInitPlanningTable(20);
    } else {
      showToast('Gagal: ' + (res && res.message ? res.message : 'Unknown error'), 'error');
    }
  }, function () {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> Simpan'; }
    showToast('Koneksi gagal. Coba lagi.', 'error');
  });
}

// Paste dari Excel (tab-separated)
function mekHandlePaste(e) {
  e.preventDefault();
  var text = (e.clipboardData || window.clipboardData).getData('text');
  var lines = text.trim().split('\n');
  var tbody = document.getElementById('mekPlanTbody');
  if (!tbody) return;

  // Kosongkan tabel lama dan isi dari paste
  tbody.innerHTML = '';
  lines.forEach(function (line) {
    var cells = line.split('\t');
    var obj   = {};
    MEK_PLAN_COLS.forEach(function (col, i) {
      obj[col.key] = (cells[i] || '').trim();
    });
    _mekAppendPlanRow(obj);
  });
  // Pastikan minimal 5 baris kosong di bawah
  for (var i = 0; i < 5; i++) _mekAppendPlanRow({});
  _mekUpdatePlanRowNums();
  showToast(lines.length + ' baris berhasil di-paste.', 'success');
}
