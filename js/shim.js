
// ============================================================
// COMPATIBILITY SHIM — google.script.run → API
// Untuk handler multiline yang tidak bisa di-auto-replace
// ============================================================
var google = window.google || {};
google.script = google.script || {};
google.script.run = (function() {
  var _successFn = null;
  var _failureFn = null;
  var handler = {
    withSuccessHandler: function(fn) { _successFn = fn; return handler; },
    withFailureHandler: function(fn) { _failureFn = fn; return handler; },
    withUserObject: function() { return handler; }
  };
  // Proxy semua fungsi ke API
  var funcNames = [
    'verifyLogin','getData','getSummaryLokal','getSummaryEkspor','getTotalPallet',
    'getLastUpdate','getSummaryDivisi','getHistoryKapasitas','saveGudangData',
    'saveStandarPallet','getStandarPalet','saveStdEdit','saveRekapHistory',
    'getRekapHistory','saveRealisasiData','getRealisasiData','saveFdosData',
    'getFdosData','saveMdcData','getMdcPlanningData','saveOpnameData',
    'getOpnameData','updateOpnameRow','saveFifoData','getFifoData',
    'saveFifoEksporData','getFifoEksporData','updateFifoRow','updateFifoEksporRow',
    'saveQtReadyData','getQtReadyData','updateQtReadyRow','saveOpnamePattern',
    'loadOpnamePattern','saveRdcData','getRdcData','saveRdcCatatan','getRdcTim',
    'getSheetNames','searchSheetNames','getKartuStock','rekapStockJalur',
    'rekapOutputJalur','updateSrShiftCell','updateSrKirimCell',
    'getBinSkuList','getBinSkuStdList','saveBinMovement','getBinCurrent','getBinMovement'
  ];
  funcNames.forEach(function(fn) {
    handler[fn] = function() {
      var args   = Array.prototype.slice.call(arguments);
      var onSucc = _successFn;
      var onFail = _failureFn;
      _successFn = null;
      _failureFn = null;
      if (typeof API !== 'undefined' && typeof API[fn] === 'function') {
        API.run(fn, args[0] || {}, onSucc, onFail);
      } else {
        console.warn('[SHIM] API.' + fn + ' tidak ditemukan');
      }
    };
  });
  return handler;
})();

