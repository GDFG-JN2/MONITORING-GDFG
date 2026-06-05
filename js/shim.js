// ============================================================
// shim.js — google.script.run compatibility layer
// Proxy semua panggilan google.script.run ke API
// ============================================================
(function() {
  var _s = null, _f = null;

  var handler = {
    withSuccessHandler: function(fn) { _s = fn; return handler; },
    withFailureHandler: function(fn) { _f = fn; return handler; },
    withUserObject:     function()   { return handler; }
  };

  var GAS_FUNCS = [
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

  GAS_FUNCS.forEach(function(fn) {
    handler[fn] = function() {
      var args = Array.prototype.slice.call(arguments);
      var onS  = _s, onF = _f;
      _s = null; _f = null;
      var payload = args[0];
      // Jika arg pertama bukan object/array, wrap jadi {value: arg}
      if (payload === undefined) payload = {};
      API.run(fn, payload, onS, onF);
    };
  });

  // Expose ke window
  window.google = window.google || {};
  window.google.script = window.google.script || {};
  window.google.script.run = handler;
})();
