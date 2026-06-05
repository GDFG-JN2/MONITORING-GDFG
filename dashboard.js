    // =============================================
    // REFRESH SEMUA DATA
    // =============================================
    function refreshData(){
      // Reset ke terkini (hari ini)
      var sel = document.getElementById('kapasitasTanggalSelect');
      if(sel) sel.value = '';
      updateLastRefresh();
      loadTanggalHistory();   // update dropdown
      loadKapasitasHariIni(); // load data hari ini dari HISTORY KAPASITAS
    }

    // =============================================
    // SHOW TAB
    // =============================================
    function showTab(tabId){
      document.querySelectorAll(".g-tab").forEach(function(t){ t.classList.remove("active"); });
      document.querySelectorAll(".g-tab-pane").forEach(function(c){ c.classList.remove("active"); });
      var tab = document.querySelector(".g-tab[onclick*='"+tabId+"']");
      if(tab) tab.classList.add("active");
      var content = document.getElementById(tabId);
      if(content) content.classList.add("active");
      if(tabId === 'summary'){
        if(currentView === 'chart')           renderCharts();
        else if(currentView === 'horizontal') renderChartsHorizontal();
        else if(currentView === 'pie')        renderPieChart();
        else                                  renderTableView();
      }
    }

    // =============================================
    // TOGGLE CHART / TABEL
    // =============================================
    function switchView(view){
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

      if(view === 'table'){
        tbl.style.display = 'grid';
        renderTableView();
        requestAnimationFrame(function(){ requestAnimationFrame(function(){ tbl.classList.add('visible'); }); });
      } else {
        tbl.style.display = 'none';
      }

      if(view === 'chart')           renderCharts();
      else if(view === 'horizontal') renderChartsHorizontal();
      else if(view === 'pie')        renderPieChart();
      else if(view === 'trend')      initTrendView();
    }

    // =============================================
    // LOAD SUMMARY (dari google.script.run)
    // =============================================
    function loadSummary(){
      google.script.run.withSuccessHandler(function(res){ /* TODO: manual replace google.script.run */
        if(res.success){
          var sorted = res.data.slice().sort(function(a,b){ return b.jmlPallet - a.jmlPallet; });
          // Simpan semua SKU ke lookup map
          res.data.forEach(function(i){
            if(i.skuBarang){
              var sku=String(i.skuBarang).trim();
              _skuNamaMap[sku]=i.namaBarang||'';
              _opnameNamaMap[sku]=i.namaBarang||'';
              if(!_skuDataMap[sku]) _skuDataMap[sku]={nama:i.namaBarang||'', sap:Number(i.jmlKarton)||0};
            }
          });
          lokalChartData = {
            labels:  sorted.slice(0,10).map(function(i){ return i.namaBarang;    }),
            skus:    sorted.slice(0,10).map(function(i){ return i.skuBarang;     }),
            values:  sorted.slice(0,10).map(function(i){ return i.jmlPallet;     }),
            kartons: sorted.slice(0,10).map(function(i){ return i.jmlKarton || 0;})
          };
          if(document.getElementById('summary').classList.contains('active')){
            if(currentView === 'chart') renderCharts();
            else if(currentView === 'horizontal') renderChartsHorizontal();
            else renderTableView();
          }
        }
      }).getSummaryLokal();

      google.script.run.withSuccessHandler(function(res){ /* TODO: manual replace google.script.run */
        if(res.success){
          var sorted = res.data.slice().sort(function(a,b){ return b.jmlPallet - a.jmlPallet; });
          // Simpan semua SKU ke lookup map
          res.data.forEach(function(i){
            if(i.skuBarang){
              var sku=String(i.skuBarang).trim();
              _skuNamaMap[sku]=i.namaBarang||'';
              _opnameNamaMap[sku]=i.namaBarang||'';
              if(!_skuDataMap[sku]) _skuDataMap[sku]={nama:i.namaBarang||'', sap:Number(i.jmlKarton)||0};
            }
          });
          eksporChartData = {
            labels:  sorted.slice(0,10).map(function(i){ return i.namaBarang;    }),
            skus:    sorted.slice(0,10).map(function(i){ return i.skuBarang;     }),
            values:  sorted.slice(0,10).map(function(i){ return i.jmlPallet;     }),
            kartons: sorted.slice(0,10).map(function(i){ return i.jmlKarton || 0;})
          };
          if(document.getElementById('summary').classList.contains('active')){
            if(currentView === 'chart') renderCharts();
            else if(currentView === 'horizontal') renderChartsHorizontal();
            else renderTableView();
          }
        }
      }).getSummaryEkspor();
    }

    // =============================================
    // LOAD DIVISI (PIE CHART)
    // =============================================
    function loadDivisi(){
      google.script.run.withSuccessHandler(function(res){ /* TODO: manual replace google.script.run */
        if(res.success){
          divisiChartData = res;
          if(currentView === 'pie' && document.getElementById('summary').classList.contains('active')){
            renderPieChart();
          }
        }
      }).getSummaryDivisi();
    }

    function renderPieChart(){
      if(!divisiChartData) return;

      // === PIE 1: Lokal (Wafer+Biskuit) vs Ekspor ===
      var wafer   = divisiChartData.wafer   || 0;
      var biskuit = divisiChartData.biskuit  || 0;
      var ekspor  = divisiChartData.ekspor   || 0;
      var total1  = wafer + biskuit + ekspor || 1;
      var colors1 = ['#f6ad55','#4299e1','#68d391'];
      var labels1 = ['Wafer Lokal','Biskuit Lokal','Ekspor'];
      var values1 = [wafer, biskuit, ekspor];

      if(divisiPieInstance){ divisiPieInstance.destroy(); divisiPieInstance = null; }
      divisiPieInstance = new Chart(document.getElementById('divisiPieChart').getContext('2d'), {
        type:'doughnut',
        data:{ labels:labels1, datasets:[{ data:values1, backgroundColor:colors1, borderWidth:3, borderColor:'#fff', hoverOffset:10 }] },
        options:{
          responsive:true, maintainAspectRatio:false, cutout:'62%',
          plugins:{ legend:{display:false}, tooltip:{ callbacks:{ label:function(c){ var p=((c.parsed/total1)*100).toFixed(1); return ' '+c.parsed.toLocaleString('id-ID')+' pallet ('+p+'%)'; } } } }
        }
      });
      document.getElementById('pieLegend').innerHTML = labels1.map(function(l,i){
        var pct=((values1[i]/total1)*100).toFixed(1);
        return '<div class="pie-legend-item"><div class="pie-legend-dot" style="background:'+colors1[i]+'"></div><div><div class="pie-legend-label">'+l+'</div><div class="pie-legend-val">'+values1[i].toLocaleString('id-ID')+' pallet &bull; '+pct+'%</div></div></div>';
      }).join('');

      // === PIE 2: Divisi khusus Ekspor ===
      var eksporDivisi = divisiChartData.eksporDivisi || {};
      var labels2 = Object.keys(eksporDivisi);
      var values2 = labels2.map(function(k){ return eksporDivisi[k]; });
      var total2  = values2.reduce(function(a,b){ return a+b; }, 0) || 1;
      var palette = ['#f6ad55','#4299e1','#68d391','#fc8181','#b794f4','#76e4f7','#faf089'];
      var colors2 = labels2.map(function(_,i){ return palette[i % palette.length]; });

      if(eksporDivisiPieInstance){ eksporDivisiPieInstance.destroy(); eksporDivisiPieInstance = null; }
      eksporDivisiPieInstance = new Chart(document.getElementById('eksporDivisiPieChart').getContext('2d'), {
        type:'doughnut',
        data:{ labels:labels2, datasets:[{ data:values2, backgroundColor:colors2, borderWidth:3, borderColor:'#fff', hoverOffset:10 }] },
        options:{
          responsive:true, maintainAspectRatio:false, cutout:'62%',
          plugins:{ legend:{display:false}, tooltip:{ callbacks:{ label:function(c){ var p=((c.parsed/total2)*100).toFixed(1); return ' '+c.parsed.toLocaleString('id-ID')+' pallet ('+p+'%)'; } } } }
        }
      });
      document.getElementById('pieLegendEkspor').innerHTML = labels2.length
        ? labels2.map(function(l,i){
            var pct=((values2[i]/total2)*100).toFixed(1);
            return '<div class="pie-legend-item"><div class="pie-legend-dot" style="background:'+colors2[i]+'"></div><div><div class="pie-legend-label">'+l+'</div><div class="pie-legend-val">'+values2[i].toLocaleString('id-ID')+' pallet &bull; '+pct+'%</div></div></div>';
          }).join('')
        : '<div style="color:#a0aec0;font-size:12px;">Tidak ada data</div>';
    }

    // =============================================
    // BUILD CHART CONFIG
    // =============================================
    function buildChartConfig(labels, values){
      var total    = values.length;
      var bgColors = values.map(function(_,i){
        var t = i / (total - 1 || 1);
        return 'rgb('+Math.round(15+t*29)+','+Math.round(32+t*51)+','+Math.round(39+t*61)+')';
      });
      return {
        type: 'bar',
        data:{
          labels: labels,
          datasets:[{
            data: values, backgroundColor: bgColors,
            borderRadius: 6, borderSkipped: false,
            barPercentage: .65, categoryPercentage: .75
          }]
        },
        plugins: [ChartDataLabels],
        options:{
          responsive: true, maintainAspectRatio: false,
          layout:{ padding:{ top:28, right:8, left:4, bottom:4 } },
          plugins:{
            legend:{ display:false },
            datalabels:{
              anchor:'end', align:'top', color:'#2d3748',
              font:{ size:10, weight:'700' },
              formatter: function(v){ return v.toLocaleString('id-ID'); }
            }
          },
          scales:{
            x:{ grid:{ display:false }, border:{ display:false }, ticks:{ color:'#718096', font:{ size:10, weight:'600' }, maxRotation:30 } },
            y:{ display:false }
          },
          animation:{ duration:700, easing:'easeOutQuart', delay: function(ctx){ return ctx.dataIndex * 110; } },
          animations:{ y:{ from: function(ctx){ return ctx.chart.scales.y.getPixelForValue(0); } } }
        }
      };
    }

    // =============================================
    // RENDER CHARTS
    // =============================================
    function renderCharts(){
      if(lokalChartData){
        if(lokalChartInstance) lokalChartInstance.destroy();
        lokalChartInstance = new Chart(
          document.getElementById('lokalChart').getContext('2d'),
          buildChartConfig(lokalChartData.labels, lokalChartData.values)
        );
      }
      if(eksporChartData){
        if(eksporChartInstance) eksporChartInstance.destroy();
        eksporChartInstance = new Chart(
          document.getElementById('eksporChart').getContext('2d'),
          buildChartConfig(eksporChartData.labels, eksporChartData.values)
        );
      }
    }

    // =============================================
    // BUILD CHART CONFIG HORIZONTAL
    // =============================================
    function buildChartConfigHorizontal(labels, values, skus){
      var rankColors = ['#e53e3e','#e8572a','#ed6b1a','#f0820f','#d4a017','#b8b820','#8fc42a','#68c832','#45cc3a','#2db82d'];
      var bgColors = values.map(function(_,i){ return rankColors[i] || '#2db82d'; });
      // label dipotong maks 30 karakter untuk sidebar
      var shortLabels = labels.map(function(l){
        return l.length > 28 ? l.substring(0,26)+'…' : l;
      });
      return {
        type: 'bar',
        data:{
          labels: shortLabels,
          datasets:[{
            data: values, backgroundColor: bgColors,
            borderRadius: 6, borderSkipped: false,
            barPercentage: .7, categoryPercentage: .8
          }]
        },
        plugins: [ChartDataLabels],
        options:{
          indexAxis: 'y',
          responsive: true, maintainAspectRatio: false,
          layout:{ padding:{ top:4, right:50, left:4, bottom:4 } },
          plugins:{
            legend:{ display:false },
            datalabels:{
              anchor:'end', align:'right', color:'#2d3748',
              font:{ size:10, weight:'700' },
              formatter: function(v){ return v.toLocaleString('id-ID'); }
            },
            tooltip:{
              callbacks:{
                title: function(items){
                  return skus[items[0].dataIndex];
                }
              }
            }
          },
          scales:{
            x:{ display:false, grid:{ display:false } },
            y:{
              grid:{ display:false }, border:{ display:false },
              ticks:{ color:'#2d3748', font:{ size:10, weight:'600' } }
            }
          },
          animation:{ duration:700, easing:'easeOutQuart', delay: function(ctx){ return ctx.dataIndex * 80; } },
          animations:{ x:{ from: function(ctx){ return ctx.chart.scales.x.getPixelForValue(0); } } }
        }
      };
    }

    // =============================================
    // RENDER CHARTS HORIZONTAL
    // =============================================
    function renderChartsHorizontal(){
      if(lokalChartData){
        if(lokalChartHInstance) lokalChartHInstance.destroy();
        lokalChartHInstance = new Chart(
          document.getElementById('lokalChartH').getContext('2d'),
          buildChartConfigHorizontal(lokalChartData.labels, lokalChartData.values, lokalChartData.skus)
        );
      }
      if(eksporChartData){
        if(eksporChartHInstance) eksporChartHInstance.destroy();
        eksporChartHInstance = new Chart(
          document.getElementById('eksporChartH').getContext('2d'),
          buildChartConfigHorizontal(eksporChartData.labels, eksporChartData.values, eksporChartData.skus)
        );
      }
    }

    // =============================================
    // RENDER TABEL VIEW
    // =============================================
    function renderTableView(){
      renderTableRows('tableLokalRows',  lokalChartData);
      renderTableRows('tableEksporRows', eksporChartData);
    }

    function renderTableRows(id, chartData){
      if(!chartData) return;
      var html = '';
      chartData.labels.forEach(function(label, i){
        var val = chartData.values[i];
        var krt = (chartData.kartons && chartData.kartons[i]) ? chartData.kartons[i] : 0;
        var sku = (chartData.skus && chartData.skus[i]) ? chartData.skus[i] : '-';
        var rc  = 'r' + (i + 1);
        var valHtml = '<span style="font-weight:800;">' + val.toLocaleString('id-ID') + ' P</span>';
        if(krt > 0) valHtml += '<span style="font-size:11px;color:#718096;margin-left:5px;">/ ' + krt.toLocaleString('id-ID') + ' ©</span>';
        html += '<div class="stbl-row">'
          + '<div class="stbl-rank '+rc+'">'+(i+1)+'</div>'
          + '<div class="stbl-sku">'+sku+'</div>'
          + '<div class="stbl-name">'+label+'</div>'
          + '<div class="stbl-val">'+valHtml+'</div>'
          + '</div>';
      });
      document.getElementById(id).innerHTML = html;
    }

    // =============================================
    // LOAD SECTION TABLE (LOKAL / EKSPOR / GDFG)
    // =============================================
    var _skuMapReady = false;

    function _preloadSkuNames(){
      // Jika loadSection sudah mengisi map (dari dashboard), langsung pakai
      if(_skuMapReady || Object.keys(_opnameNamaMap).length > 0){
        _skuMapReady = true;
        return;
      }
      // Belum ada data — load 3 section sekaligus
      var pending = 3;
      ['lokal','ekspor','gdfg'].forEach(function(sec){
        API.getData(sec,
          function(res){
            if(res&&res.success&&res.headers&&res.data){
              var h0=res.headers[0], h1=res.headers[1], h2=res.headers[2];
              res.data.forEach(function(r){
                var sku=String(r[h0]||'').trim(), nama=String(r[h1]||'').trim(), sap=Number(r[h2])||0;
                if(sku&&nama){
                  _skuNamaMap[sku]=nama; _opnameNamaMap[sku]=nama;
                  if(!_skuDataMap[sku]) _skuDataMap[sku]={nama:nama, sap:sap};
                }
              });
            }
            if(--pending===0) _skuMapReady=true;
          },
          function(){ --pending; });
      });
    }

    function loadSection(section){
      document.getElementById(section+"Content").innerHTML = "<div class='spinner'></div>";
      google.script.run.withSuccessHandler(function(res){ /* TODO: manual replace google.script.run */
        if(res.success && res.data.length > 0){
          var jumlahKosong = res.data.filter(function(r){ return r.__stdKosong; }).length;
          var html = "";

          // Info banner jika ada STD kosong
          if(jumlahKosong > 0){
            html += "<div class='std-kosong-info'>"
              + "<i class='fas fa-exclamation-triangle'></i>"
              + jumlahKosong + " baris belum memiliki standar pallet. Silakan update melalui menu <strong>Input Data &rarr; Standar Pallet</strong>."
              + "</div>";
          }

          // Kolom mana yg editable: Material Code(0), Nama(1), STD(2), Divisi(3)
          // Header index: headers[0]=SKU/Mat.Code, [1]=Nama, [2]=QTY, [3]=STD, [4]=JmlPallet, [5]=Divisi, [6]=TOTAL
          var H = res.headers;
          html += "<table class='g-table'><thead><tr><th style=\'width:32px;\'></th>";
          H.forEach(function(h){ html += "<th>"+(h||"")+"</th>"; });
          html += "</tr></thead><tbody>";

          res.data.forEach(function(r, ri){
            var kosong = r.__stdKosong;
            // Encode row for dataset
            var rowEnc = encodeURIComponent(JSON.stringify(r));
            var hEnc   = encodeURIComponent(JSON.stringify(H));
            html += "<tr class='"+(kosong?"tr-std-kosong":"")+"' data-stdrow=\'"+rowEnc+"\' data-stdhdr=\'"+hEnc+"\'>";
            html += "<td class='td-std-edit-btn'><button class='std-edit-btn' onclick='_stdEdit(this)' title='Edit'><i class='fas fa-pencil-alt'></i></button></td>";
            H.forEach(function(h, hi){
              var val = r[h] !== undefined ? r[h] : "";
              // editable cols: index 0(SKU), 1(Nama), 3(STD), 5(Divisi) — based on typical getData headers
              // Attach data-stdcol for editable detection
              var isEditCol = (hi===0||hi===1||hi===3||hi===5);
              var editAttr  = isEditCol ? " data-stdcol=\'"+hi+"\' data-stdkey=\'"+h+"\'" : "";
              if(h === H[0] && kosong){
                html += "<td"+editAttr+">"+val+"<span class='std-kosong-badge'><i class='fas fa-exclamation'></i> Update standar pallet</span></td>";
              } else {
                html += "<td"+editAttr+">"+val+"</td>";
              }
            });
            html += "</tr>";
          });

          html += "</tbody></table>";
          document.getElementById(section+"Content").innerHTML = html;
          var badge = document.getElementById(section+"RowCount");
          if(badge) badge.innerText = res.data.length;
          // Simpan SKU→{nama,sap} ke lookup map untuk opname
          if(res.headers && res.headers.length >= 2){
            var hSku=res.headers[0], hNama=res.headers[1];
            var hSap=res.headers[2]; // QTY (kolom ke-3)
            res.data.forEach(function(r){
              var sku=String(r[hSku]||'').trim(), nama=String(r[hNama]||'').trim();
              var sap=hSap?Number(r[hSap])||0:0;
              if(sku&&nama){
                _skuNamaMap[sku]=nama;
                _opnameNamaMap[sku]=nama;
                // Simpan SAP per section: lokal, ekspor, gdfg terpisah
                if(!_skuDataMap[sku]) _skuDataMap[sku]={nama:nama, sap:sap, lokal:0, ekspor:0, gdfg:0};
                _skuDataMap[sku][section]=sap; // simpan per section
                _skuDataMap[sku].nama=nama;
              }
            });
            _skuMapReady = true;
          }
        } else {
          document.getElementById(section+"Content").innerText = res.message || "Tidak ada data.";
        }
      }).getData(section);
    }

    // =============================================
    // SUMMARY CARDS
    // =============================================
    function updateTotalPallet(){
      API.withSuccessHandler(function(res){
        if(res.success){
          var pct = ((res.total / 7096) * 100).toFixed(2);
          document.getElementById("totalPalletValue").innerText = res.total.toLocaleString('id-ID');
          document.getElementById("percentageValue").innerText  = pct + "%";
          document.getElementById("percentageNote").innerText   = pct > 100 ? "⚠️ OVERLOAD!" : "Kapasitas 7.096 pallet";
        } else {
          document.getElementById("totalPalletValue").innerText = "Error";
          document.getElementById("percentageValue").innerText  = "Error";
        }
      }).getTotalPallet();
    }

    function updatePersentaseLokal(){
      API.withSuccessHandler(function(res){
        if(res.success){
          var total = res.data.reduce(function(s,i){ return s+(Number(i.jmlPallet)||0); }, 0);
          var pct   = ((total / 5800) * 100).toFixed(2);
          document.getElementById("percentageLokal").innerText = pct + "%";
          document.getElementById("noteLokal").innerText       = total.toLocaleString('id-ID') + " pallet dari 5.800";
        }
      }).getSummaryLokal();
    }

    function updatePersentaseEkspor(){
      API.withSuccessHandler(function(res){
        if(res.success){
          var total = res.data.reduce(function(s,i){ return s+(Number(i.jmlPallet)||0); }, 0);
          var pct   = ((total / 1296) * 100).toFixed(2);
          document.getElementById("percentageEkspor").innerText = pct + "%";
          document.getElementById("noteEkspor").innerText       = total.toLocaleString('id-ID') + " pallet dari 1.296";
        }
      }).getSummaryEkspor();
    }

    function updateLastRefresh(){
      API.getLastUpdate(function(res){
          document.getElementById("lastUpdateValue").innerText =
            (res && res.value) ? res.value : '-';
        },
        function(){
          document.getElementById("lastUpdateValue").innerText = '-';
        });
    }

    function updateStock(){
      _patternOpen(function(){
        window.open("https://docs.google.com/spreadsheets/d/1JZag93NSI8paVZHzxPYp6rAFlUDbOzXFrXM_lBKgPZg/edit?usp=sharing","_blank");
      });
    }

    // Auto refresh setiap 3 menit
    // ── Load daftar tanggal dari HISTORY KAPASITAS ──
    function loadTanggalHistory(){
      google.script.run /* TODO: manual replace google.script.run */
        .withSuccessHandler(function(res){
          var sel = document.getElementById('kapasitasTanggalSelect');
          if(!sel) return;
          // Simpan pilihan sekarang
          var cur = sel.value;
          // Hapus semua kecuali opsi pertama (Terkini)
          while(sel.options.length > 1) sel.remove(1);
          if(res && res.success && res.tanggals){
            res.tanggals.forEach(function(tgl){
              var opt = document.createElement('option');
              opt.value = tgl;
              // Format dd-MM-yyyy untuk display
              var parts = tgl.split('-');
              opt.textContent = parts.length===3 ? parts[2]+'-'+parts[1]+'-'+parts[0] : tgl;
              sel.appendChild(opt);
            });
          }
          // Restore pilihan
          if(cur) sel.value = cur;
        })
        .withFailureHandler(function(){})
        .getHistoryKapasitas('','',[]); // ambil semua hanya untuk dapat tanggals
    }

    // ── Load kapasitas by tanggal terpilih ──
    function loadKapasitasByTanggal(){
      var sel = document.getElementById('kapasitasTanggalSelect');
      var tgl = sel ? sel.value : '';
      if(!tgl){
        // Terkini = hari ini
        loadKapasitasHariIni();
        return;
      }
      // Update Last Update label
      var luEl = document.getElementById('lastUpdateValue');
      if(luEl && tgl){
        var p = tgl.split('-');
        luEl.innerText = p.length===3 ? p[2]+'/'+p[1]+'/'+p[0] : tgl;
      }
      _loadKapasitasByTgl(tgl);
      showToast('\u23F3 Memuat data '+tgl+'...','');
    }

    // ── Render tab section dari data history ──
    function _renderHistorySection(containerId, arr, badgeId){
      var el = document.getElementById(containerId);
      var badge = document.getElementById(badgeId);
      if(!el) return;
      if(!arr.length){
        el.innerHTML='<div style="text-align:center;padding:30px;color:#a0aec0;">Tidak ada data</div>';
        if(badge) badge.textContent='0 SKU';
        return;
      }
      if(badge) badge.textContent=arr.length+' SKU';
      var html='<table class="g-table"><thead><tr><th>#</th><th>Material Code</th><th>Nama Barang</th><th style="text-align:right;">Ending Balance</th><th style="text-align:right;">Jml Pallet</th></tr></thead><tbody>';
      arr.forEach(function(r,i){
        html+='<tr><td style="color:#a0aec0;">'+(i+1)+'</td><td style="font-weight:700;color:#2b6cb0;font-size:11px;">'+r.skuBarang+'</td><td>'+r.namaBarang+'</td><td style="text-align:right;font-variant-numeric:tabular-nums;">'+(r.jmlKarton||0).toLocaleString('id-ID')+'</td><td style="text-align:right;font-weight:700;">'+(r.jmlPallet||0).toLocaleString('id-ID')+'</td></tr>';
      });
      html+='</tbody></table>';
      el.innerHTML=html;
    }

    // =============================================
    // LOAD KAPASITAS DARI HISTORY (pengganti REKAP STOCK)
    // =============================================
    function _getTodayStr(){
      var t=new Date();
      return t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0');
    }

    function loadKapasitasHariIni(){
      var today = _getTodayStr();
      // Cek apakah hari ini ada data — kalau tidak, pakai tanggal terakhir
      google.script.run /* TODO: manual replace google.script.run */
        .withSuccessHandler(function(res){
          var tanggals = (res && res.success && res.tanggals) ? res.tanggals : [];
          var tglToLoad = today;
          if(tanggals.length && tanggals.indexOf(today) < 0){
            // Hari ini tidak ada → pakai tanggal terbaru yang ada
            tglToLoad = tanggals[0];
          }
          // Update Last Update label = tanggal data yang ditampilkan
          var luEl = document.getElementById('lastUpdateValue');
          if(luEl && tglToLoad){
            var p = tglToLoad.split('-');
            luEl.innerText = p.length===3 ? p[2]+'/'+p[1]+'/'+p[0] : tglToLoad;
          }
          // Sync dropdown
          var sel = document.getElementById('kapasitasTanggalSelect');
          if(sel && tglToLoad !== today){
            // Pastikan opsi ada di dropdown
            var found = false;
            for(var i=0;i<sel.options.length;i++){ if(sel.options[i].value===tglToLoad){ found=true; sel.value=tglToLoad; break; } }
            if(!found){ sel.value=''; }
          } else if(sel){
            sel.value = '';
          }
          _loadKapasitasByTgl(tglToLoad);
        })
        .withFailureHandler(function(){
          _loadKapasitasByTgl(today);
        })
        .getHistoryKapasitas('','',[]); // ambil semua untuk dapat tanggals
    }

    function _loadKapasitasByTgl(tgl){
      // Tampilkan spinner di semua section
      ['lokalContent','eksporContent','gdfgContent'].forEach(function(id){
        var el=document.getElementById(id);
        if(el) el.innerHTML="<div class='spinner' style='margin:20px auto;'></div>";
      });

      google.script.run /* TODO: manual replace google.script.run */
        .withSuccessHandler(function(res){
          if(!res||!res.success){
            ['lokalContent','eksporContent','gdfgContent'].forEach(function(id){
              var el=document.getElementById(id);
              if(el) el.innerHTML='<div style="text-align:center;padding:30px;color:#a0aec0;">Tidak ada data untuk tanggal ini.<br>Silakan input data terlebih dahulu.</div>';
            });
            // Reset summary cards
            ['totalPalletValue','percentageLokal','percentageEkspor','percentageValue'].forEach(function(id){
              var el=document.getElementById(id); if(el) el.innerText='-';
            });
            return;
          }

          var data = res.data || [];

          // Pisah per tipe
          var gdi2 = data.filter(function(r){ return r.tipe==='GDI2'; });
          var gdin = data.filter(function(r){ return r.tipe==='GDIN'; });
          var eksp = data.filter(function(r){ return r.tipe==='EKSPOR'; });
          var gdfg = data.filter(function(r){ return r.tipe==='GDFG'; });

          // Lokal = GDI2+GDIN, gabung & sum by SKU
          var lokalMap = {};
          gdi2.concat(gdin).forEach(function(r){
            if(!lokalMap[r.sku]) lokalMap[r.sku]={nama:r.nama,bb:0,std:r.std,jml:0,divisi:r.divisi||'',plant:r.plant||''};
            lokalMap[r.sku].bb  += r.bb;
            lokalMap[r.sku].jml += (r.std > 0 ? Math.ceil(r.bb / r.std) : r.jmlPallet);
            // Update SKU lookup maps
            if(r.sku){ _skuNamaMap[r.sku]=r.nama; _opnameNamaMap[r.sku]=r.nama; }
          });
          var lokalArr = Object.keys(lokalMap).map(function(sku){
            return {sku:sku, nama:lokalMap[sku].nama, bb:lokalMap[sku].bb, jml:lokalMap[sku].jml, std:lokalMap[sku].std, divisi:lokalMap[sku].divisi||'', plant:lokalMap[sku].plant||''};
          }).sort(function(a,b){ return b.jml-a.jml; });

          var eksporArr = eksp.map(function(r){ return {sku:r.sku,nama:r.nama,bb:r.bb,jml:(r.std>0?Math.ceil(r.bb/r.std):r.jmlPallet),std:r.std,divisi:r.divisi||'',plant:r.plant||''}; })
                             .sort(function(a,b){ return b.jml-a.jml; });
          var gdfgArr  = gdfg.map(function(r){ return {sku:r.sku,nama:r.nama,bb:r.bb,jml:(r.std>0?Math.ceil(r.bb/r.std):r.jmlPallet),std:r.std,divisi:r.divisi||'',plant:r.plant||''}; })
                             .sort(function(a,b){ return b.jml-a.jml; });

          // ── Summary cards ──
          var CAP_ALL=7096, CAP_LK=5800, CAP_EK=1296;
          var totLK  = lokalArr.reduce(function(s,r){ return s+r.jml; },0);
          var totEK  = eksporArr.reduce(function(s,r){ return s+r.jml; },0);
          var totGDFG= gdfgArr.reduce(function(s,r){ return s+r.jml; },0);
          var totAll = totLK+totEK+totGDFG;

          document.getElementById('totalPalletValue').innerText = totAll.toLocaleString('id-ID');
          document.getElementById('percentageValue').innerText  = ((totAll/CAP_ALL)*100).toFixed(2)+'%';
          document.getElementById('percentageLokal').innerText  = ((totLK/CAP_LK)*100).toFixed(2)+'%';
          document.getElementById('percentageEkspor').innerText = ((totEK/CAP_EK)*100).toFixed(2)+'%';
          document.getElementById('noteLokal').innerText  = totLK.toLocaleString('id-ID')+' pallet dari 5.800';
          document.getElementById('noteEkspor').innerText = totEK.toLocaleString('id-ID')+' pallet dari 1.296';
          var noteAll = document.getElementById('percentageNote');
          if(noteAll) noteAll.innerText = totAll>CAP_ALL ? '⚠️ OVERLOAD!' : 'Kapasitas 7.096 pallet';

          // ── Chart data (Top 10) ──
          lokalChartData = {
            labels : lokalArr.slice(0,10).map(function(r){ return r.nama; }),
            skus   : lokalArr.slice(0,10).map(function(r){ return r.sku;  }),
            values : lokalArr.slice(0,10).map(function(r){ return r.jml;  }),
            kartons: lokalArr.slice(0,10).map(function(r){ return r.bb;   })
          };
          eksporChartData = {
            labels : eksporArr.slice(0,10).map(function(r){ return r.nama; }),
            skus   : eksporArr.slice(0,10).map(function(r){ return r.sku;  }),
            values : eksporArr.slice(0,10).map(function(r){ return r.jml;  }),
            kartons: eksporArr.slice(0,10).map(function(r){ return r.bb;   })
          };

          // Render chart/tabel jika tab summary aktif
          // Selalu build divisi dari history (agar siap saat user switch ke pie)
          _buildDivisiFromHistory(lokalArr, eksporArr);
          if(document.getElementById('summary').classList.contains('active')){
            if(currentView==='chart') renderCharts();
            else if(currentView==='horizontal') renderChartsHorizontal();
            else if(currentView==='pie') renderPieChart();
            else renderTableView();
          }

          // ── Render tab Lokal / Ekspor / GDFG ──
          _renderHistorySection('lokalContent',  lokalArr,  'lokalRowCount',  'GDI2+GDIN');
          _renderHistorySection('eksporContent', eksporArr, 'eksporRowCount', 'EKSPOR');
          _renderHistorySection('gdfgContent',   gdfgArr,   'gdfgRowCount',   'GDFG');
        })
        .withFailureHandler(function(){
          ['lokalContent','eksporContent','gdfgContent'].forEach(function(id){
            var el=document.getElementById(id);
            if(el) el.innerHTML='<div style="text-align:center;padding:20px;color:#e53e3e;">Gagal memuat data</div>';
          });
        })
        .getHistoryKapasitas(tgl, tgl, []);
    }

    // Render section dari array history
    function _renderHistorySection(containerId, arr, badgeId, tipeLabel){
      var el=document.getElementById(containerId);
      var badge=document.getElementById(badgeId);
      if(!el) return;
      if(!arr.length){
        el.innerHTML='<div style="text-align:center;padding:30px;color:#a0aec0;font-size:13px;"><i class="fas fa-inbox" style="font-size:24px;display:block;margin-bottom:8px;opacity:.3;"></i>Tidak ada data '+tipeLabel+'</div>';
        if(badge) badge.innerHTML='0 SKU';
        return;
      }
      // Hitung total
      var totKrt  = arr.reduce(function(s,r){ return s+(r.bb||0); }, 0);
      var totPlt  = arr.reduce(function(s,r){ return s+(r.jml||0); }, 0);
      var totSku  = arr.length;
      if(badge){
        badge.innerHTML=
          '<span style="background:#ebf8ff;color:#2b6cb0;border-radius:20px;padding:2px 10px;font-size:11px;font-weight:700;margin-right:4px;">'+totKrt.toLocaleString('id-ID')+' Krt</span>'+
          '<span style="background:#f0fdf4;color:#166534;border-radius:20px;padding:2px 10px;font-size:11px;font-weight:700;margin-right:4px;">'+totPlt.toLocaleString('id-ID')+' Plt</span>'+
          '<span style="background:#f3f4f6;color:#374151;border-radius:20px;padding:2px 10px;font-size:11px;font-weight:700;">'+totSku+' SKU</span>';
      }
      var html='<table class="g-table"><thead><tr>'
        +'<th style="width:32px;">#</th>'
        +'<th>Material Code</th>'
        +'<th>Nama Barang</th>'
        +'<th style="text-align:center;">Divisi</th>'
        +'<th style="text-align:center;">Plant</th>'
        +'<th style="text-align:right;">QTY</th>'
        +'<th style="text-align:right;background:#fffbeb;color:#92400e;">STD Pallet</th>'
        +'<th style="text-align:right;background:#f0fdf4;color:#166534;font-weight:700;">Jml Pallet</th>'
        +'</tr></thead><tbody>';
      arr.forEach(function(r,i){
        var divisi=String(r.divisi||'').trim();
        var plant=String(r.plant||'').trim();
        var divColor=divisi.toUpperCase()==='WAFER'?'#2b6cb0':divisi.toUpperCase()==='BISKUIT'?'#276749':'#718096';
        var divBg  =divisi.toUpperCase()==='WAFER'?'#ebf8ff':divisi.toUpperCase()==='BISKUIT'?'#f0fff4':'#f3f4f6';
        html+='<tr>'
          +'<td style="color:#a0aec0;text-align:center;">'+(i+1)+'</td>'
          +'<td style="font-weight:700;color:#2b6cb0;font-size:11px;">'+r.sku+'</td>'
          +'<td>'+r.nama+'</td>'
          +'<td style="text-align:center;">'
            +(divisi?'<span style="background:'+divBg+';color:'+divColor+';font-size:10px;font-weight:700;border-radius:10px;padding:1px 8px;">'+divisi+'</span>':'<span style="color:#cbd5e0;">—</span>')
          +'</td>'
          +'<td style="text-align:center;">'
            +(plant?'<span style="background:#faf5ff;color:#6b46c1;font-size:10px;font-weight:700;border-radius:10px;padding:1px 8px;">'+plant+'</span>':'<span style="color:#cbd5e0;">—</span>')
          +'</td>'
          +'<td style="text-align:right;font-variant-numeric:tabular-nums;">'+(r.bb||0).toLocaleString('id-ID')+'</td>'
          +'<td style="text-align:right;background:#fffbeb;color:#92400e;">'+(r.std||0).toLocaleString('id-ID')+'</td>'
          +'<td style="text-align:right;font-weight:700;background:#f0fdf4;color:#166534;">'+(r.jml||0).toLocaleString('id-ID')+'</td>'
          +'</tr>';
      });
      html+='</tbody></table>';
      el.innerHTML=html;
    }

    // Build divisi data dari history untuk pie chart
    function _buildDivisiFromHistory(lokalArr, eksporArr){
      var wafer=0, biskuit=0, eksporTotal=0;
      var eksporDivisi={};
      lokalArr.forEach(function(r){
        if((r.divisi||'').toUpperCase()==='WAFER') wafer+=r.jml;
        else biskuit+=r.jml;
      });
      eksporArr.forEach(function(r){
        eksporTotal+=r.jml;
        var div=(r.divisi||'LAINNYA').toUpperCase()||'LAINNYA';
        eksporDivisi[div]=(eksporDivisi[div]||0)+r.jml;
      });
      divisiChartData={success:true, wafer:wafer, biskuit:biskuit, ekspor:eksporTotal, eksporDivisi:eksporDivisi};
      renderPieChart();
    }

        // =============================================
    // TREND CHART
    // =============================================
    var _trendMetrik  = 'total';  // total | lokal | ekspor
    var _trendSatuan  = 'pallet'; // pallet | persen
    var _trendInstance = null;
    var CAP_TOTAL = 7096, CAP_LOKAL = 5800, CAP_EKSPOR = 1296;

    function setTrendMetrik(m){
      _trendMetrik = m;
      ['total','lokal','ekspor'].forEach(function(k){
        var el = document.getElementById('trendMetrik'+k.charAt(0).toUpperCase()+k.slice(1));
        if(el) el.classList.toggle('active', k===m);
      });
      if(_trendInstance) loadTrendChart();
    }

    function setTrendSatuan(s){
      _trendSatuan = s;
      document.getElementById('trendSatuanPallet').classList.toggle('active', s==='pallet');
      document.getElementById('trendSatuanPersen').classList.toggle('active', s==='persen');
      if(_trendInstance) loadTrendChart();
    }

    function initTrendView(){
      // Default from: 08/04/2026, to: hari ini — masih bisa diubah user
      function fmtD(d){ return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
      var fromEl = document.getElementById('trendFrom');
      var toEl   = document.getElementById('trendTo');
      if(fromEl && !fromEl.value) fromEl.value = '2026-04-08';
      if(toEl   && !toEl.value)   toEl.value   = fmtD(new Date());
      // Auto load chart tanpa perlu klik Tampilkan
      loadTrendChart();
    }

    function loadTrendChart(){
      var from = (document.getElementById('trendFrom')||{}).value || '';
      var to   = (document.getElementById('trendTo')  ||{}).value || '';
      if(!from||!to){ showToast('⚠️ Pilih rentang tanggal',''); return; }

      document.getElementById('trendEmpty').style.display  = 'none';
      document.getElementById('trendLineChart').style.display = 'none';
      // Tampilkan loading
      document.getElementById('trendChartWrap').insertAdjacentHTML('beforeend',
        '<div id="trendLoading" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#a0aec0;font-size:13px;"><i class="fas fa-spinner fa-spin"></i> Memuat...</div>');

      API.getHistoryKapasitas(from, to, [],
        function(res){
          var loader = document.getElementById('trendLoading');
          if(loader) loader.remove();
          if(!res||!res.success||!res.data.length){
            document.getElementById('trendEmpty').style.display='flex';
            document.getElementById('trendEmpty').querySelector('span').textContent='Tidak ada data pada rentang tanggal ini';
            return;
          }
          _renderTrendChart(res.data, from, to);
        },
        function(){
          var loader = document.getElementById('trendLoading');
          if(loader) loader.remove();
          document.getElementById('trendEmpty').style.display='flex';
        });
    }

    function _renderTrendChart(data, from, to){
      // Group by tanggal, hitung total/lokal/ekspor per hari
      var dayMap = {};
      data.forEach(function(r){
        var tgl = r.tanggal;
        if(!dayMap[tgl]) dayMap[tgl] = {lokal:0, ekspor:0, gdfg:0};
        var jml = r.std>0 ? Math.ceil(r.bb/r.std) : r.jmlPallet;
        if(r.tipe==='GDI2'||r.tipe==='GDIN') dayMap[tgl].lokal  += jml;
        else if(r.tipe==='EKSPOR')            dayMap[tgl].ekspor += jml;
        else if(r.tipe==='GDFG')              dayMap[tgl].gdfg   += jml;
      });

      // Sort tanggal
      var dates = Object.keys(dayMap).sort();
      var labels = dates.map(function(d){
        var p=d.split('-'); return p.length===3?p[2]+'/'+p[1]:d;
      });

      // Hitung nilai sesuai metrik & satuan
      function getVal(d){
        var row = dayMap[d];
        var total = row.lokal + row.ekspor + row.gdfg;
        var val, cap;
        if(_trendMetrik==='lokal')       { val=row.lokal;  cap=CAP_LOKAL;  }
        else if(_trendMetrik==='ekspor') { val=row.ekspor; cap=CAP_EKSPOR; }
        else                             { val=total;      cap=CAP_TOTAL;  }
        if(_trendSatuan==='persen') return Math.round((val/cap)*10000)/100;
        return val;
      }

      var values = dates.map(getVal);
      var isPct  = _trendSatuan==='persen';
      var cap    = _trendMetrik==='lokal'?CAP_LOKAL:_trendMetrik==='ekspor'?CAP_EKSPOR:CAP_TOTAL;
      var capLine= isPct?100:(cap);

      // Label judul
      var metrikLabel = _trendMetrik==='lokal'?'Pallet Lokal':_trendMetrik==='ekspor'?'Pallet Ekspor':'Total Pallet';
      var satuanLabel = isPct ? '%' : ' pallet';


      var canvas = document.getElementById('trendLineChart');
      canvas.style.display = 'block';
      if(_trendInstance){ _trendInstance.destroy(); _trendInstance=null; }

      _trendInstance = new Chart(canvas.getContext('2d'), {
        type:'line',
        data:{
          labels: labels,
          datasets:[
            {
              label: metrikLabel,
              data: values,
              borderColor:'#2c5364',
              backgroundColor:'rgba(44,83,100,.1)',
              borderWidth:2.5,
              pointRadius:4,
              pointHoverRadius:6,
              pointBackgroundColor:'#2c5364',
              tension:0.4,
              cubicInterpolationMode:'monotone',
              fill:true
            },
            {
              label: 'Kapasitas '+(isPct?'100%':cap.toLocaleString('id-ID')+' pallet'),
              data: dates.map(function(){ return capLine; }),
              borderColor:'rgba(229,62,62,.75)',
              borderWidth:3,
              borderDash:[6,4],
              pointRadius:0,
              fill:false,
              tension:0
            }
          ]
        },
        options:{
          responsive:true, maintainAspectRatio:false,
          interaction:{mode:'index', intersect:false},
          plugins:{
            datalabels:{display:false},
            legend:{display:true, position:'top', labels:{font:{size:11},boxWidth:14}},
            tooltip:{
              callbacks:{
                label:function(ctx){
                  if(ctx.datasetIndex===1) return ctx.dataset.label;
                  return ' '+ctx.parsed.y.toLocaleString('id-ID')+(isPct?'%':' pallet');
                }
              }
            }
          },
          scales:{
            x:{
              grid:{color:'rgba(0,0,0,.05)'},
              ticks:{font:{size:11}, color:'#718096'}
            },
            y:{
              beginAtZero:false,
              grid:{color:'rgba(0,0,0,.06)'},
              ticks:{
                font:{size:11}, color:'#718096',
                callback:function(v){ return isPct?v+'%':v.toLocaleString('id-ID'); }
              }
            }
          },
          animation:{duration:600, easing:'easeOutQuart'}
        }
      });
    }

        setInterval(function(){ if(typeof google!=='undefined'&&google.script) refreshData(); }, 180000);


    // Guard helper - cek apakah google.script ready
    function _gasReady(){ return typeof google !== 'undefined' && google && google.script; }

    // =============================================
    // SISTEM TABEL OK — Universal Table Engine
    // Fitur: Arrow Nav, Tab/Enter, Overwrite Mode,
    //        Delete, Drag Select, Shift+Arrow,
    //        Ctrl+A, Ctrl+C, Paste, Drag Fill
    // Usage: _STOKInit(config)
    // =============================================
    function _STOKInit(cfg){