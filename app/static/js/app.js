//sv-->service.js ft-->front.js
let tPage = {
  vars: {},
  setQueryCondition: function() {
    sv.getConditionData(function(data) {
      ft.setQueryCondition(data);
    });
  },
  initialPage: function() {
    sv.loadData2Websql(function() {
      tPage.setQueryCondition();
    });
    ft.bindEvent();
  },
  queryData: function() {
    let param = ft.getQueryParam();
    sv.queryData(param, function(res) {
      initTable(res.table);
      //加工chart的y数据;
      let p = paramGlobal;
      let y = [];
      let unit = "万元";
      switch (p.type) {
        case "6":
          unit = "户";
          break;
        case "7":
          unit = "线";
          break;
        case "8":
          unit = "台";
          break;
      }
      y.push({
        type: "value",
        axisLabel: {
          formatter: "{value}" + unit
        }
      });
      if (p.index == "1" || p.index == "3") {
        y.push({
          type: "value",
          axisLabel: {
            formatter: "{value} %"
          }
        });
      }
      res.chart.y = y;
      iniChart(res.chart);
    });
  }
};

$(function() {
  tPage.initialPage();
});
