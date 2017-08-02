//sv-->service.js ft-->front.js
let tPage = {
  vars: {},
  setQueryCondition: function() {
    sv.getConditionData(function(data) {
      ft.setQueryCondition(data);
    });
  },
  initialPage: function() {
      ft.bindEvent();
    sv.loadData2Websql(function() {
      tPage.setQueryCondition();
    });
  
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
        case "06":
          unit = "户";
          break;
        case "07":
          unit = "线";
          break; 
        case "08":
        case "09":
        case "10":
        case "11":
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
  sv.checkUpdate();
});
