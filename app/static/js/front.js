let paramGlobal;
let ft = {
  conditionData: "",

  initialDate: function(cfg) {
    // cfg={
    //   dateSt:'#dt',
    //   dateEnd:'#dt2',
    //   dateStVal:'',
    //   dateEndVal:'',
    // };

    var dateSt = $(cfg.dateSt),
      dateEnd = $(cfg.dateEnd),
      dateStVal = cfg.dateStVal,
      dateEndVal = cfg.dateEndVal;

    dateSt.datetimepicker({
      startView: 3,
      autoclose: true,
      minView: 3,
      maxView: 3,
      format: "yyyy-mm",
      language: "zh-CN"
    });
    dateEnd.datetimepicker({
      startView: 3,
      autoclose: true,
      minView: 3,
      maxView: 3,
      format: "yyyy-mm",
      language: "zh-CN"
    });
    dateSt.change(function() {
      dateEnd.datetimepicker("setStartDate", dateSt.val());
    });
    dateEnd.change(function() {
      dateSt.datetimepicker("setEndDate", dateEnd.val());
    });
    if (dateStVal != undefined) {
      dateSt.val(dateStVal).change();
    }
    if (dateEndVal != undefined) {
      dateEnd.val(dateEndVal).change();
    }
  },
  setQueryCondition: function(data) {
    let res = {};
    data = _(data).groupBy("type").value();
    for (let o in data) {
      res[o] = [];
      for (let i = 0; i < data[o].length; i++) {
        res[o].push({
          value: data[o][i].val,
          text: data[o][i].text,
          star: data[o][i].star
        });
      }
    }
    res.minDate = moment(res.minDate[0].value, "YYYYMM").format("YYYY-MM");
    res.maxDate = moment(res.maxDate[0].value, "YYYYMM").format("YYYY-MM");
    res.star = [
      { value: 6, text: "6-8星" },
      { value: 5, text: "5星" },
      { value: 4, text: "4星" },
      { value: 3, text: "3星" },
      { value: 2, text: "2星" },
      { value: 1, text: "1星" }
    ];
    let cb = function(da) {
      //类别

      var html = ft.getRadionHtml(da.type, "type");
      $("#buType").html(html);
      //日期
      ft.initialDate({
        dateSt: "#dateSt",
        dateEnd: "#dateEnd",
        dateStVal: da.minDate,
        dateEndVal: da.maxDate
      });
      ft.initialDate({
        dateSt: "#dateStTarget",
        dateEnd: "#dateEndTarget",
        dateStVal: da.minDate,
        dateEndVal: da.maxDate
      });
      ft.initialDate({
        dateSt: "#dateStStandard",
        dateEnd: "#dateEndStandard",
        dateStVal: da.minDate,
        dateEndVal: da.maxDate
      });
      //营业厅
      let storeData = _(da.store).groupBy("star").value();
      html = "";
      for (let o in storeData) {
        let ele = storeData[o];
        html += `<p>${o}</p>`;
        html += ft.getCheckHtml(ele, "store");
      }

      $("#divStore").html(html);
      //片区
      html = ft.getCheckHtml(da.area, "area");
      $("#divArea").html(html);
      //星级
      html = ft.getCheckHtml(da.star, "star");
      $("#divStar").html(html);
      tPage.queryData();
    };
    ft.conditionData = res;
    cb(res);
  },
  bindEvent: function() {
    $("#btnQuery").click(function() {
      tPage.queryData();
    });
    let importType = 0;
    //收入
    $("#btnChooseFile").click(function() {
      event.preventDefault();
      importType = 0;
      ipcRenderer.send("openDialog", { path: 1 });
    });
    //发展数据
    $("#btnChooseFile2").click(function() {
      event.preventDefault();
      importType = 1;
      ipcRenderer.send("openDialog", { path: 1 });
    });
    ipcRenderer.on("openDialogCB", function(event, data) {
      let path = data[0],
        type = importType;
      console.log(path);
      sv.importFile({ path, type }, function() {
        tPage.setQueryCondition();
      });
    });

    $("#btnExport").click(function() {
      event.preventDefault();
      sv.exportData();
    });
    $("#btnCancel").click(function() {
      event.preventDefault();
      $("#divStore").find("[type=checkbox]").each(function(i, n) {
        $(this).prop("checked", false);
      });
    });

    $(".child_menu").find("a").click(function() {
      let index = $(this).attr("jd");
      pageConfig.index = index;
      pageConfig.module = "0";
      pageConfig.tbName = "TB_MAIN";
      let typeData = ft.conditionData.type;
      if (index == "2" || index == "3") {
        //发展功能
        pageConfig.module = "1";
        pageConfig.tbName = "TB_MAIN2";
        typeData = ft.conditionData.type2;
      }
      if (typeData != undefined && typeData.length > 0) {
        let html = ft.getRadionHtml(typeData, "type");
        $("#buType").html(html);
      }

      switch (index) {
        case "0":
        case "2": //都是规模
          $("#divRangeTarget,#divRangeStandard,#divCalType").addClass("hidden");
          $("#divRange,#calTypeArea,#calTypeStar,#calTypeCenter").removeClass(
            "hidden"
          );
          break;
        case "1":
        case "3": //都是发展
          $("#divRangeTarget,#divRangeStandard,#divCalType").removeClass(
            "hidden"
          );
          $("#divRange,#calTypeArea,#calTypeStar,#calTypeCenter").addClass(
            "hidden"
          );
          break;
      }
      if (index == "4") {
        $("#divMain").addClass("hidden");
        $("#divMainImport").removeClass("hidden");
      } else {
        $("#divMain").removeClass("hidden");
        $("#divMainImport").addClass("hidden");
      }
      if (index != "4") {
        tPage.queryData();
      }
    });
  },
  getQueryParam: function() {
    let param = {
      type: $("#buType").find(":checked").val(),
      dateSt: $("#dateSt").val().replace("-", ""),
      dateEnd: $("#dateEnd").val().replace("-", ""),

      dateStTarget: $("#dateStTarget").val().replace("-", ""),
      dateEndTarget: $("#dateEndTarget").val().replace("-", ""),
      dateStStandard: $("#dateStStandard").val().replace("-", ""),
      dateEndStandard: $("#dateEndStandard").val().replace("-", ""),

      store: ft.getCheckedVal("#divStore"),
      area: {
        checked: ft.getCheckedVal("#divArea"),
        calType: $("#calTypeArea").find(":checked").val()
      },
      star: {
        checked: ft.getCheckedVal("#divStar"),
        calType: $("#calTypeStar").find(":checked").val()
      },
      center: {
        checked: $("#buCenter").prop("checked"),
        calType: $("#calTypeCenter").find(":checked").val()
      },
      index: pageConfig.index,
      tbName: pageConfig.tbName,
      calType: $("#divCalType").find(":checked").val()
    };
    paramGlobal = param;
    console.log("查询参数");
    console.log(param);
    if (
      param.store.length == 0 &&
      param.area.checked.length == 0 &&
      param.star.checked.length == 0 &&
      param.center.checked == false
    ) {
      alert("请至少勾选一个条件");
      return;
    }
    return param;
  },
  getCheckedVal: function(sele) {
    var res = [];
    var ele = $(sele).find(":checked");
    for (var i = 0; i < ele.length; i++) {
      res.push($(ele[i]).val());
    }
    return res;
  },
  getRadionHtml: function(arr, name) {
    if (arr.length == 0 || arr == null || arr == undefined) {
      return "";
    }
    var html =
      '<label> <input type="radio" class="flat" name="' +
      name +
      '"   value="' +
      arr[0].value +
      '"  checked=""  /> ' +
      arr[0].text +
      "</label>";
    if (arr.length > 1) {
      for (var i = 1; i < arr.length; i++) {
        html +=
          '<label> <input type="radio" class="flat" name="' +
          name +
          '"   value="' +
          arr[i].value +
          '"    /> ' +
          arr[i].text +
          "</label>";
      }
    }
    return html;
  },
  getCheckHtml: function(arr, name) {
    if (arr.length == 0 || arr == null || arr == undefined) {
      return "";
    }
    var html = "";
    for (var i = 0; i < arr.length; i++) {
      html +=
        '  <label>  <input type="checkbox" name="' +
        name +
        '"  value="' +
        arr[i].value +
        '" class="flat" /> ' +
        arr[i].text +
        "</label>";
    }
    return html;
  }
};

function iniChart(cfg) {
  if (typeof echarts === "undefined") {
    return;
  }
  console.log("init_echarts");

  var theme = {
    color: [
      "#26B99A",
      "#34495E",
      "#BDC3C7",
      "#3498DB",
      "#9B59B6",
      "#8abb6f",
      "#759c6a",
      "#bfd3b7"
    ],

    title: {
      itemGap: 8,
      textStyle: {
        fontWeight: "normal",
        color: "#408829"
      }
    },

    dataRange: {
      color: ["#1f610a", "#97b58d"]
    },

    toolbox: {
      color: ["#408829", "#408829", "#408829", "#408829"]
    },

    tooltip: {
      backgroundColor: "rgba(0,0,0,0.5)",
      axisPointer: {
        type: "line",
        lineStyle: {
          color: "#408829",
          type: "dashed"
        },
        crossStyle: {
          color: "#408829"
        },
        shadowStyle: {
          color: "rgba(200,200,200,0.3)"
        }
      }
    },

    dataZoom: {
      dataBackgroundColor: "#eee",
      fillerColor: "rgba(64,136,41,0.2)",
      handleColor: "#408829"
    },
    grid: {
      borderWidth: 0
    },

    categoryAxis: {
      axisLine: {
        lineStyle: {
          color: "#408829"
        }
      },
      splitLine: {
        lineStyle: {
          color: ["#eee"]
        }
      }
    },

    valueAxis: {
      axisLine: {
        lineStyle: {
          color: "#408829"
        }
      },
      splitArea: {
        show: true,
        areaStyle: {
          color: ["rgba(250,250,250,0.1)", "rgba(200,200,200,0.1)"]
        }
      },
      splitLine: {
        lineStyle: {
          color: ["#eee"]
        }
      }
    },
    timeline: {
      lineStyle: {
        color: "#408829"
      },
      controlStyle: {
        normal: { color: "#408829" },
        emphasis: { color: "#408829" }
      }
    },

    k: {
      itemStyle: {
        normal: {
          color: "#68a54a",
          color0: "#a9cba2",
          lineStyle: {
            width: 1,
            color: "#408829",
            color0: "#86b379"
          }
        }
      }
    },
    map: {
      itemStyle: {
        normal: {
          areaStyle: {
            color: "#ddd"
          },
          label: {
            textStyle: {
              color: "#c12e34"
            }
          }
        },
        emphasis: {
          areaStyle: {
            color: "#99d2dd"
          },
          label: {
            textStyle: {
              color: "#c12e34"
            }
          }
        }
      }
    },
    force: {
      itemStyle: {
        normal: {
          linkStyle: {
            strokeColor: "#408829"
          }
        }
      }
    },
    chord: {
      padding: 4,
      itemStyle: {
        normal: {
          lineStyle: {
            width: 1,
            color: "rgba(128, 128, 128, 0.5)"
          },
          chordStyle: {
            lineStyle: {
              width: 1,
              color: "rgba(128, 128, 128, 0.5)"
            }
          }
        },
        emphasis: {
          lineStyle: {
            width: 1,
            color: "rgba(128, 128, 128, 0.5)"
          },
          chordStyle: {
            lineStyle: {
              width: 1,
              color: "rgba(128, 128, 128, 0.5)"
            }
          }
        }
      }
    },
    gauge: {
      startAngle: 225,
      endAngle: -45,
      axisLine: {
        show: true,
        lineStyle: {
          color: [[0.2, "#86b379"], [0.8, "#68a54a"], [1, "#408829"]],
          width: 8
        }
      },
      axisTick: {
        splitNumber: 10,
        length: 12,
        lineStyle: {
          color: "auto"
        }
      },
      axisLabel: {
        textStyle: {
          color: "auto"
        }
      },
      splitLine: {
        length: 18,
        lineStyle: {
          color: "auto"
        }
      },
      pointer: {
        length: "90%",
        color: "auto"
      },
      title: {
        textStyle: {
          color: "#333"
        }
      },
      detail: {
        textStyle: {
          color: "auto"
        }
      }
    },
    textStyle: {
      fontFamily: "Arial, Verdana, sans-serif"
    }
  };

  //echart Bar

  if ($("#mainb").length) {
    var echartBar = echarts.init(document.getElementById("mainb"), theme);
    var y = [
      {
        type: "value"
      }
    ];
    if (cfg.y != undefined) {
      y = cfg.y;
    }
    echartBar.setOption({
      title: {
        text: "",
        subtext: ""
      },
      tooltip: {
        trigger: "axis"
      },
      legend: {
        data: cfg.legend
      },
      toolbox: {
        show: false
      },
      calculable: false,
      xAxis: [
        {
          type: "category",
          data: cfg.x
        }
      ],
      yAxis: cfg.y,
      series: cfg.series
    });
  }
}

function initTable(data) {
  var html = "";
  if (data.length == 0) {
    return;
  }
  //head
  html += "<thead>  <tr>";
  var firstColumn = data[0];
  for (var i = 0; i < firstColumn.length; i++) {
    html += "<th>" + firstColumn[i] + "</th>";
  }
  html += " </tr> </thead>";
  //data
  html += "<tbody>";
  for (var i = 1; i < data.length; i++) {
    html += "<tr>";
    for (var j = 0; j < data[i].length; j++) {
      html += "<td>" + data[i][j] + "</td>";
    }
    html += "</tr>";
  }
  html += "</tbody>";
  $("#datatable-buttons33").html(html);
}
