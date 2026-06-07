// ============================================================
// app.js — MONITORING GDFG
// Global state, login, logout, sidebar, routing, toast
// ============================================================

// ============================================================
// GLOBAL STATE
// ============================================================
var lokalChartData       = null;
var eksporChartData      = null;
var _skuNamaMap          = {};
var _skuDataMap          = {};
var _opnameNamaMap       = {};
var _currentUser         = '';
var _userRole            = 'admin';
var divisiChartData      = null;
var lokalChartInstance   = null;
var eksporChartInstance  = null;
var lokalChartHInstance  = null;
var eksporChartHInstance = null;
var divisiPieInstance    = null;
var eksporDivisiPieInstance = null;
var currentView          = 'horizontal';

// ============================================================
// LOGIN
// ============================================================
function toggleShowPassword() {
  var inpHide = document.getElementById('password');
  var inpShow = document.getElementById('passwordVisible');
  var ico     = document.getElementById('eyeIcon');
  if (!inpHide || !inpShow) return;
  var isHidden = inpHide.style.display !== 'none';
  if (isHidden) {
    inpShow.value        = inpHide.value;
    inpHide.style.display = 'none';
    inpShow.style.display = '';
    inpShow.focus();
    if (ico) ico.className = 'fas fa-eye-slash';
  } else {
    inpHide.value        = inpShow.value;
    inpShow.style.display = 'none';
    inpHide.style.display = '';
    inpHide.focus();
    if (ico) ico.className = 'fas fa-eye';
  }
}

function login(){
  var u   = document.getElementById("username").value.trim();
  var pwEl = document.getElementById("password"); var pwElV = document.getElementById("passwordVisible"); var p = (pwEl&&pwEl.style.display!=="none"?pwEl:pwElV).value;
  var btn = document.querySelector(".btn-login");
  if(!u || !p){
    showLoginError("Username dan password tidak boleh kosong.");
    return;
  }
  document.getElementById("loginMsg").style.display = "none";

  // Loading state di tombol
  btn.classList.add("loading");
  btn.innerHTML = '<span class="btn-spinner"></span> Memuat...';

  google.script.run
    .withSuccessHandler(function(res){
      if(res.success){
        _currentUser = u;
        _userRole    = res.role || 'admin';
        _patternLoaded = false; // reset cache saat login user baru
        _patternCache  = null;
        document.getElementById("loginWrap").style.display = "none";
        document.getElementById("dashboard").style.display = "block";
        applyRoleRestrictions(_userRole);
        refreshData();
        switchView('horizontal');
        // Preload pola di background — supaya tidak lag saat pertama kali klik
        _patternLoadAsync(function(){});
      } else {
        btn.classList.remove("loading");
        btn.innerHTML = "Login";
        showLoginError(res.message || "Login gagal.");
      }
    })
    .withFailureHandler(function(){
      btn.classList.remove("loading");
      btn.innerHTML = "Login";
      showLoginError("Terjadi kesalahan. Coba lagi.");
    })
    .verifyLogin(u, p);
}

function showLoginError(msg) {
  var el          = document.getElementById('loginMsg');
  el.innerText    = msg;
  el.style.display = 'block';
}

function logout() {
  _currentUser   = '';
  _userRole      = 'admin';
  _patternLoaded = false;
  _patternCache  = null;
  document.getElementById('dashboard').style.display  = 'none';
  document.getElementById('loginWrap').style.display  = 'flex';
  document.getElementById('username').value = '';
  document.getElementById('password').value = '';
  document.getElementById('loginMsg').style.display = 'none';
  var btn = document.querySelector('.btn-login');
  if (btn) { btn.classList.remove('loading'); btn.innerHTML = 'Login'; }
}

// ============================================================
// ROLE-BASED ACCESS CONTROL
// ============================================================
function applyRoleRestrictions(role){
  var isAdmin   = (role === 'admin');
  var isViewer  = (role === 'viewer' || role === 'visitor');
  var isVisitor = (role === 'visitor');

  function hide(id){ var el=document.getElementById(id); if(el) el.style.display='none'; }
  function hideEl(el){ if(el) el.style.display='none'; }
  function hideAll(sel){ document.querySelectorAll(sel).forEach(function(el){el.style.display='none';}); }

  if(isViewer){
    // ── Kapasitas: sembunyikan tombol Input Data & Spreadsheet ──────
    document.querySelectorAll('.gdrm-header-btns .btn-hdr').forEach(function(btn){
      if(btn.getAttribute('onclick') && (
        btn.getAttribute('onclick').indexOf('inputPage')>=0 ||
        btn.getAttribute('onclick').indexOf('updateStock')>=0
      )) btn.style.display='none';
    });

    // ── Realisasi SPE: hanya tampilkan Summary & Planning ────────────
    document.querySelectorAll('.real-tab').forEach(function(btn){
      var oc = btn.getAttribute('onclick')||'';
      if(oc.indexOf('summaryReal')<0 && oc.indexOf('planningReal')<0){
        btn.style.display='none';
      }
    });

    // ── Stock Opname: sembunyikan tombol Input & Setting PIN ─────────
    hide('btnOpInput');
    // Setting PIN button (fa-shield-alt)
    document.querySelectorAll('#opnamePage .btn-hdr').forEach(function(btn){
      if(btn.getAttribute('onclick') && btn.getAttribute('onclick').indexOf('_psOpen')>=0)
        btn.style.display='none';
    });

    // ── RDC: sembunyikan tab Input Data ─────────────────────────────
    hide('rdcTabInput');
    hide('btnRdcInput');

    // ── Stock Jalur: sembunyikan tombol Input & Output ───────────────
    hide('btnSjInput');
    hide('btnSjOutput');
  }

  // ── Default tab setelah login untuk viewer/visitor ──────────────────
  if(isViewer){
    // Stock Opname → langsung ke Riwayat (tanpa PIN)
    setTimeout(function(){
      _doSwitchOpnameTab('view');
    }, 500);

    // Stock Jalur → langsung ke Rekap (tanpa PIN)
    setTimeout(function(){
      sjSwitchTab('rekap');
    }, 500);
  }

  // ── Visitor: kolom tabel Stock Opname dibatasi 4 kolom ──────────────
  if(isVisitor){
    window._visitorMode = true;
  }
}

function _isVisitorColVisible(colKey) {
  if (!window._visitorMode) return true;
  var allowed = ['no', 'sku', 'item', 'fisik'];
  return allowed.indexOf(String(colKey).toLowerCase()) >= 0;
}

// ============================================================
// SIDEBAR
// ============================================================
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('active');
  document.getElementById('sidebarOverlay').classList.toggle('active');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('active');
  document.getElementById('sidebarOverlay').classList.remove('active');
}

// ============================================================
// ROUTING — SHOW PAGE
// ============================================================
function showPage(page) {
  // Push ke history agar tombol back HP kembali ke halaman sebelumnya
  if (window.history && window.history.pushState) {
    window.history.pushState({ page: page }, '', '#' + page);
  }
  _opDragging = false;
  if (page !== 'opnamePage')   _opClearSel();
  if (page !== 'inputPage')    _inResetSel();

  var pages = ['dashboard','inputPage','realisasiPage','opnamePage','rdcPage','stockJalurPage','binLocPage','appsPage','monitoringEksporPage'];
  pages.forEach(function (p) {
    var el = document.getElementById(p);
    if (!el) return;
    el.style.display = 'none';
    el.classList.remove('page-enter');
  });

  if (page !== 'realisasiPage') hideStickyFooter();

  var target = document.getElementById(page);
  target.style.display = page === 'monitoringEksporPage' ? 'flex' : 'block';
  if (page === 'monitoringEksporPage') target.style.flexDirection = 'column';
  requestAnimationFrame(function () { target.classList.add('page-enter'); });
  closeSidebar();

  // Update sidebar active
  document.getElementById('menuDashboard').classList.toggle('active-page',  page === 'dashboard');
  document.getElementById('menuRealisasi').classList.toggle('active-page',  page === 'realisasiPage');
  document.getElementById('menuOpname').classList.toggle('active-page',     page === 'opnamePage');
  document.getElementById('menuRdc').classList.toggle('active-page',        page === 'rdcPage');
  document.getElementById('menuStockJalur').classList.toggle('active-page', page === 'stockJalurPage');
  document.getElementById('menuBinLoc').classList.toggle('active-page',            page === 'binLocPage');
  document.getElementById('menuMonitoringEkspor').classList.toggle('active-page',  page === 'monitoringEksporPage');
  document.getElementById('menuApps').classList.toggle('active-page',              page === 'appsPage');

  // Page-specific init
  if (page === 'dashboard') {
    updateLastRefresh();
    loadTanggalHistory();
    loadKapasitasHariIni();
  }
  if (page === 'inputPage')    initEmptyRows(30);
  if (page === 'opnamePage')   { initOpnamePage(); switchOpnameTab('input'); }
  if (page === 'rdcPage')      rdcInitPage();
  if (page === 'stockJalurPage') sjInitPage();
  if (page === 'binLocPage')           blInitPage();
  if (page === 'monitoringEksporPage') mekInitPage();
  if (page === 'realisasiPage') {
    initRealForm();
    var today   = new Date();
    var yyyy    = today.getFullYear();
    var mm      = String(today.getMonth() + 1).padStart(2, '0');
    var dd      = String(today.getDate()).padStart(2, '0');
    var todayStr = yyyy + '-' + mm + '-' + dd;
    document.getElementById('filterFrom').value = todayStr;
    document.getElementById('filterTo').value   = todayStr;
    switchFilterMode('date');
    loadSummaryReal();
  }
}

// ============================================================
// TOAST NOTIFICATION
// ============================================================
function showToast(msg, type) {
  var t       = document.getElementById('toast');
  t.innerText = msg;
  t.className = 'toast ' + (type || '');
  t.classList.add('show');
  setTimeout(function () { t.classList.remove('show'); }, 3000);
}

// ============================================================
// REFRESH DATA (Dashboard)
// ============================================================
function refreshData() {
  var sel = document.getElementById('kapasitasTanggalSelect');
  if (sel) sel.value = '';
  updateLastRefresh();
  loadTanggalHistory();
  loadKapasitasHariIni();
}

// ============================================================
// SHOW TAB (Dashboard tabs: Summary/Lokal/Ekspor/GDFG)
// ============================================================
function showTab(tabId) {
  document.querySelectorAll('.g-tab').forEach(function (t) { t.classList.remove('active'); });
  document.querySelectorAll('.g-tab-pane').forEach(function (c) { c.classList.remove('active'); });
  var tab = document.querySelector(".g-tab[onclick*='" + tabId + "']");
  if (tab) tab.classList.add('active');
  var content = document.getElementById(tabId);
  if (content) content.classList.add('active');
  if (tabId === 'summary') {
    if      (currentView === 'chart')      renderCharts();
    else if (currentView === 'horizontal') renderChartsHorizontal();
    else if (currentView === 'pie')        renderPieChart();
    else                                   renderTableView();
  }
}

// ============================================================
// SWITCH VIEW (Chart/Table/Pie/Trend)
// ============================================================
function switchView(view) {
  currentView = view;

  var tbl = document.getElementById('viewTable');
  tbl.classList.remove('visible');

  document.getElementById('btnToggleChart').classList.toggle('active',      view === 'chart');
  document.getElementById('btnToggleHorizontal').classList.toggle('active', view === 'horizontal');
  document.getElementById('btnToggleTable').classList.toggle('active',      view === 'table');
  document.getElementById('btnTogglePie').classList.toggle('active',        view === 'pie');
  document.getElementById('btnToggleTrend').classList.toggle('active',      view === 'trend');


  document.getElementById('viewChart').style.display      = (view === 'chart')      ? 'grid'  : 'none';
  document.getElementById('viewHorizontal').style.display = (view === 'horizontal') ? 'grid'  : 'none';
  document.getElementById('viewPie').style.display        = (view === 'pie')        ? 'flex'  : 'none';
  document.getElementById('viewTrend').style.display      = (view === 'trend')      ? 'block' : 'none';

  if (view === 'table') {
    tbl.style.display = 'grid';
    renderTableView();
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { tbl.classList.add('visible'); });
    });
  } else {
    tbl.style.display = 'none';
  }

  if      (view === 'chart')      renderCharts();
  else if (view === 'horizontal') renderChartsHorizontal();
  else if (view === 'pie')        renderPieChart();
  else if (view === 'trend')      initTrendView();
}

// ============================================================
// LOAD SUMMARY (Chart data)
// ============================================================
function loadSummary() {
  API.getSummaryLokal(function (res) {
    if (res.success) {
      var sorted = res.data.slice().sort(function (a, b) { return b.jmlPallet - a.jmlPallet; });
      res.data.forEach(function (i) {
        if (i.skuBarang) {
          var sku = String(i.skuBarang).trim();
          _skuNamaMap[sku]  = i.namaBarang || '';
          _opnameNamaMap[sku] = i.namaBarang || '';
          if (!_skuDataMap[sku]) _skuDataMap[sku] = { nama: i.namaBarang || '', sap: Number(i.jmlKarton) || 0 };
        }
      });
      lokalChartData = {
        labels:  sorted.slice(0, 10).map(function (i) { return i.namaBarang; }),
        skus:    sorted.slice(0, 10).map(function (i) { return i.skuBarang; }),
        values:  sorted.slice(0, 10).map(function (i) { return i.jmlPallet; }),
        kartons: sorted.slice(0, 10).map(function (i) { return i.jmlKarton || 0; })
      };
      if (document.getElementById('summary').classList.contains('active')) {
        if      (currentView === 'chart')      renderCharts();
        else if (currentView === 'horizontal') renderChartsHorizontal();
        else                                   renderTableView();
      }
    }
  });

  API.getSummaryEkspor(function (res) {
    if (res.success) {
      var sorted = res.data.slice().sort(function (a, b) { return b.jmlPallet - a.jmlPallet; });
      res.data.forEach(function (i) {
        if (i.skuBarang) {
          var sku = String(i.skuBarang).trim();
          _skuNamaMap[sku]  = i.namaBarang || '';
          _opnameNamaMap[sku] = i.namaBarang || '';
          if (!_skuDataMap[sku]) _skuDataMap[sku] = { nama: i.namaBarang || '', sap: Number(i.jmlKarton) || 0 };
        }
      });
      eksporChartData = {
        labels:  sorted.slice(0, 10).map(function (i) { return i.namaBarang; }),
        skus:    sorted.slice(0, 10).map(function (i) { return i.skuBarang; }),
        values:  sorted.slice(0, 10).map(function (i) { return i.jmlPallet; }),
        kartons: sorted.slice(0, 10).map(function (i) { return i.jmlKarton || 0; })
      };
      if (document.getElementById('summary').classList.contains('active')) {
        if      (currentView === 'chart')      renderCharts();
        else if (currentView === 'horizontal') renderChartsHorizontal();
        else                                   renderTableView();
      }
    }
  });
}

// ============================================================
// LOAD DIVISI (Pie chart data)
// ============================================================
function loadDivisi() {
  API.getSummaryDivisi(function (res) {
    if (res.success) {
      divisiChartData = res;
      if (currentView === 'pie' && document.getElementById('summary').classList.contains('active')) {
        renderPieChart();
      }
    }
  });
}

// ============================================================
// UPDATE LAST REFRESH (timestamp di header dashboard)
// ============================================================
function updateLastRefresh() {
  API.getLastUpdate(function (res) {
    var el = document.getElementById('lastUpdateValue');
    if (el) el.innerText = (res && res.value) ? res.value : '-';
  });
}

// ============================================================
// APPS PAGE
// ============================================================
function _openApp(url) {
  window.open(url, '_blank');
}

// ============================================================
// BACK BUTTON HANDLER (tombol back HP)
// ============================================================
window._lastPage = 'dashboard';

// Handle tombol back — kembali ke halaman sebelumnya
window.addEventListener('popstate', function(event) {
  if (event.state && event.state.page) {
    // Ada state — navigasi ke halaman tersebut tanpa push history baru
    window._lastPage = null; // sementara null agar pushState tidak double
    showPage(event.state.page);
    window._lastPage = event.state.page;
  } else {
    // Tidak ada state — artinya sudah di halaman paling awal
    // Push state kosong agar tidak keluar app, kembali ke dashboard
    showPage('dashboard');
    window.history.pushState({ page: 'dashboard' }, '', '');
    window._lastPage = 'dashboard';
  }
});

// Push initial state saat pertama load (agar ada state awal)
window.addEventListener('load', function() {
  window.history.replaceState({ page: 'dashboard' }, '', '');
  window._lastPage = 'dashboard';
});

// ============================================================
// BACK BUTTON INTERCEPT
// ============================================================
window.addEventListener('popstate', function(e) {
  if (e.state && e.state.page) {
    // Kembali ke halaman sebelumnya tanpa push history baru
    var page = e.state.page;
    var pages = ['dashboard','inputPage','realisasiPage','opnamePage',
                 'rdcPage','stockJalurPage','binLocPage','appsPage','monitoringEksporPage'];
    pages.forEach(function(p) {
      var el = document.getElementById(p);
      if (el) { el.style.display = 'none'; el.classList.remove('page-enter'); }
    });
    var target = document.getElementById(page);
    if (target) {
      target.style.display = 'block';
      requestAnimationFrame(function() { target.classList.add('page-enter'); });
    }
    closeSidebar();
  } else {
    // Tidak ada state — tutup sidebar kalau terbuka, atau biarkan browser keluar
    var sidebar = document.getElementById('sidebar');
    if (sidebar && sidebar.classList.contains('active')) {
      closeSidebar();
      // Push dummy state agar back berikutnya bisa keluar
      window.history.pushState(null, '', window.location.href);
    }
  }
});

// Push initial state saat pertama load
window.addEventListener('load', function() {
  if (window.history && window.history.pushState) {
    window.history.replaceState({ page: 'dashboard' }, '', '#dashboard');
  }
});
