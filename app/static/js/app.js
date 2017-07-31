//require
const ipcRenderer = nodeRequire("electron").ipcRenderer,
  // Datastore = nodeRequire("nedb"),
  _ = nodeRequire("lodash"),
  xlsx = nodeRequire("node-xlsx");
const path = nodeRequire('path');
Handlebars.registerHelper("formatDate", function (date) {
  return moment(date).format("YYYY-MM-DD hh:mm:ss");
});
var fs = nodeRequire("fs");
var dbWeb = openDatabase("WBDB", "1.0", "WBDB", 2 * 1024 * 1024);

var Cryptr = nodeRequire("cryptr"),
  cryptr = new Cryptr("myTotalySecretKey22");

//let dbpath = path.join(__dirname, "data2.db");
let jsonFile = path.join(__dirname, "data");
jsonFile = path.join(path.resolve(__dirname, '../../../../'), 'data.j');
console.log(jsonFile)
// let db;
// try {
//   console.log(Datastore);
//   db = new Datastore({ filename: dbpath, autoload: true });
//   console.log('nedb suc')
// } catch (error) {
//   console.log(error)
// }



let cm = {
  queryData: function (param, cb) {
    param.dateSt = parseInt(param.dateSt);
    param.dateEnd = parseInt(param.dateEnd);
    let res = {};
    let type2Sheet = {
      1: "3G出账",
      "2": "4G出账",
      "3": "34G出账",
      "4": "宽带出账",
      "5": "通服收入"
    };
    let sheetName = type2Sheet[param.type];
    let type = 0;
    let data;
    let getSqlInStr = function (arr, isNum) {
      let res = "";
      for (let i = 0; i < arr.length; i++) {
        let d = arr[i];
        if (isNum == true) {
          res += `${d},`;
        } else {
          res += `'${d}',`;
        }
      }
      if (arr.length > 0) {
        res = res.substring(0, res.length - 1);
      }
      return res;
    };

    let sql = "";

    //store
    if (param.store.length > 0) {
      let storeIn = getSqlInStr(param.store);
      sql = `
  select store name,month,num ,0 orderby from tb_main where 1=1
  and month between ${param.dateSt} and  ${param.dateEnd} 
  and butype='${sheetName}'
  and code in (${storeIn})
`;
    }
    //area
    if (param.area.checked.length > 0) {
      if (sql != "") {
        sql += " union ";
      }
      let areaIn = getSqlInStr(param.area.checked);
      sql += `  
select area name,month,${param.area
          .calType}(num) num ,1 orderby from tb_main where 1=1
  and month between ${param.dateSt} and  ${param.dateEnd} 
  and butype='${sheetName}'
  and area in (${areaIn})
  group by area,month
`;
    }
    //star
    if (param.star.checked.length > 0) {
      if (sql != "") {
        sql += " union ";
      }
      let instr = getSqlInStr(param.star.checked);
      let starIn = `and star in (${instr})`;
      if (_.indexOf(param.star.checked, "6") > -1) {
        starIn = `and (star in (${instr}) or star in ('7','8'))`;
      }
      sql += ` 
    select name,month,${param.area.calType}(num) num ,2 orderby  from (
select (case when star='1' then '1星'
 when star='2' then '2星'
 when star='3' then '3星'
 when star='4' then '4星'
 when star='5' then '5星'
 else   '6-8星' end 
) name,month,num  from tb_main where 1=1
  and month between ${param.dateSt} and  ${param.dateEnd} 
  and butype='${sheetName}'
   ${starIn}
   )
  group by name,month
`;
    }
    //center
    if (param.center.checked) {
      if (sql != "") {
        sql += " union ";
      }
      if (param.center.calType == "sum") {
        sql += `
  select store name,month, num  ,3 orderby from tb_main where 1=1
    and month between ${param.dateSt} and  ${param.dateEnd}
    and butype='${sheetName}'
    and code='营业中心' 
  `;
      } else {
        sql += `
     select tb1.store name,tb1.month,tb1.num/tb2.c num ,3 orderby  from
     (
  select store,month, num from tb_main where 1=1
    and month between ${param.dateSt} and  ${param.dateEnd}
    and butype='${sheetName}'
    and code='营业中心' ) tb1
   inner join      (
     select month,count(0) c from (
  select distinct month,code from tb_main where 1=1
    and month between ${param.dateSt} and  ${param.dateEnd}
    and butype='${sheetName}'
     and code!='undefined'
      and code!='营业中心' 
  )  group by month
  ) tb2
on tb1.month=tb2.month
  `;
      }
    }
    sql = `
select name,month,round(num,2) num,orderby from (${sql} ) 
`;
    //
    dbWeb.transaction(function (context) {
      context.executeSql(
        sql,
        [],
        function (tx, result) {
          let { rows } = result;
          // console.log(rows);
          daTmp = rows;
          let groupData = _(rows).groupBy("name").value();
          let series = [];
          let x = [];
          chartType = "line";
          let firstObject = true;
          for (let o in groupData) {
            let tmpdata = groupData[o];
            let tmp = {
              name: o,
              type: chartType,
              data: [],
              smooth: true,
              orderby: tmpdata[0].orderby
            };
            let tempY = _(tmpdata).sortBy("month").value();
            for (let i = 0; i < tempY.length; i++) {
              tmp.data.push(tempY[i].num);
              if (firstObject) {
                x.push(tempY[i].month);
              }
            }
            firstObject = false;
            series.push(tmp);
          }
          let newseries = _(series).sortBy("orderby").value();
          let legend = [];
          for (let i = 0; i < newseries.length; i++) {
            legend.push(newseries[i].name);
          }
          let table = [];
          table.push([""].concat(x));
          for (let i = 0; i < newseries.length; i++) {
            let ele = newseries[i];
            table.push([ele.name].concat(ele.data));
          }
          res.chart = {
            x: x,
            legend: legend,
            series: newseries
          };
          tableData = table;
          res.table = table;
          console.log(res);
          cb(res);
        },
        function (tx, error) {
          alert("查询数据出错");
          console.log(sql);
          console.log(error);
        }
      );
    });
  },
  importFile: function (cfg) {
    let { path, type } = cfg;
    let excelData = xlsx.parse(path);
    dbWeb.transaction(function (context) {
      context.executeSql(
        "CREATE TABLE IF NOT EXISTS TB_MAIN (butype,store,code,area,star,openTime,month,num)"
      );
      context.executeSql("delete from TB_MAIN");
      let excelDBdata = [];
      //sheet
      for (let i = 0; i < excelData.length; i++) {
        let sheet = excelData[i].data;
        let column = sheet[0];
        //row
        for (let j = 1; j < sheet.length; j++) {
          let d = sheet[j];
          if (d.length == 0) {
            continue;
          }
          //column
          for (let k = 5; k < column.length; k++) {
            let ted = {
              butype: excelData[i].name,
              store: d[0],
              code: d[1],
              area: d[2],
              star: d[3],
              openTime: d[4],
              month: column[k],
              num: d[k]
            };
            excelDBdata.push(ted);
            let xx = `INSERT INTO TB_MAIN (butype,store,code,area,star,openTime,month,num)
            VALUES ("${ted.butype}", "${ted.store}", "${ted.code}", "${ted.area}", "${ted.star}", 
            "${ted.openTime}", ${ted.month}, ${ted.num})`;
            context.executeSql(
              xx,
              [],
              function (tx, result) {
                //在这里对result 做你想要做的事情吧...........
              },
              function (tx, error) {
                console.log(xx);
                console.log(d);
                console.log(error);
              }
            );
          }
        }
      }
      tPage.setQueryCondition(1);
      let newNeDBData = {
        code: '1',
        data: excelDBdata
      }
      let encryptedString = cryptr.encrypt(JSON.stringify(excelDBdata));

      fs.writeFile(jsonFile, encryptedString, function (err) {
        if (err) {
          console.log('write file err');
          console.error(err);
          return;
        }
        console.log('write suc')
      });
      // db.insert(newNeDBData, function (err, doc) {
      //   console.log(err);
      //   console.log('insert into nedb');
      // });
      alert('导入完成')
    });
  },
  exportData: function () {
    if (tableData.length == 0) {
      alert('没有可以导出的数据');
      return;
    }
    var buffer = xlsx.build([
      {
        name: "sheet1",
        data: tableData
      }
    ]);

    //将文件内容插入新的文件中
    let filePath = path.join(__dirname, 'export.xlsx');
    console.log(filePath)
    fs.writeFileSync(filePath, buffer, { flag: "w" });
    window.open(filePath, '_blank');

    console.log("exportdata");
  }
};
let daTmp;
var tableData;
var tPage = {
  vars: {},

  setQueryCondition: function (type, cb) {
    let res = {};
    dbWeb.transaction(function (context) {
      context.executeSql(
        ` 
   select * from (  select * from (
    select butype text,(
      case
       when butype='3G出账' then '1'
      when butype='4G出账' then '2'
      when butype='34G出账' then '3'
      when butype='宽带出账' then '4'
      when butype='通服收入' then '5'
      end
    ) val ,'type' type from (
  select distinct butype from tb_main )) order by val ) 
 union all
  select min(month) text,min(month) val,'minDate' type from tb_main  
  union all
    select max(month) text,max(month) val,'maxDate' type from tb_main  
     union all
    select distinct store text,code val,'store' type from tb_main 
    where 1=1 and code!='undefined' and code!='营业中心'
      union all
     select distinct area text,area val,'area' type from tb_main 
    where 1=1 and area!='undefined'  
    `,
        [],
        function (tx, result) {
          let data = result.rows;
          // console.log(data);

          data = _(data).groupBy("type").value();
          for (let o in data) {
            res[o] = [];
            for (let i = 0; i < data[o].length; i++) {
              res[o].push({
                value: data[o][i].val,
                text: data[o][i].text
              });
            }
          }
          res.minDate = moment(res.minDate[0].value, "YYYYMM").format(
            "YYYY-MM"
          );
          res.maxDate = moment(res.maxDate[0].value, "YYYYMM").format(
            "YYYY-MM"
          );
          res.star = [
            { value: 6, text: "6-8星" },
            { value: 5, text: "5星" },
            { value: 4, text: "4星" },
            { value: 3, text: "3星" },
            { value: 2, text: "2星" },
            { value: 1, text: "1星" }
          ];
          // console.log(res);


          let cb = function (da) {
            //类别

            var html = tPage.getRadionHtml(da.type, "type");
            $("#buType").html(html);
            //日期

            var dateSt = $("#dateSt"),
              dateEnd = $("#dateEnd");

            dateSt.datetimepicker({
              startView: 3,
              autoclose: true,
              minView: 3,
              maxView: 3,
              format: "yyyy-mm"
            });
            dateEnd.datetimepicker({
              startView: 3,
              autoclose: true,
              minView: 3,
              maxView: 3,
              format: "yyyy-mm"
            });
            dateSt.change(function () {
              dateEnd.datetimepicker("setStartDate", dateSt.val());
            });
            dateEnd.change(function () {
              dateSt.datetimepicker("setEndDate", dateEnd.val());
            });
            dateSt.val(da.minDate).change();
            dateEnd.val(da.maxDate).change();
            //营业厅
            html = tPage.getCheckHtml(da.store, "store");
            $("#divStore").html(html);
            //片区
            html = tPage.getCheckHtml(da.area, "area");
            $("#divArea").html(html);
            //星级
            html = tPage.getCheckHtml(da.star, "star");
            $("#divStar").html(html);
            tPage.queryData();
          };
          cb(res);
        },
        function (tx, error) {
          alert("查询失败: " + error.message);
        }
      );
    });
    return;
    switch (type) {
      case 1:
        res = {
          type: [
            { value: 1, text: "3G出账收入" },
            { value: 2, text: "4G出账收入" },
            { value: 3, text: "34G出账收入" },
            { value: 4, text: "宽带出账收入" },
            { value: 5, text: "通服收入" }
          ],
          minDate: "2016-01",
          maxDate: "2017-05",
          store: [
            { value: "51a0339", text: "自有营业厅福田联通大厦营业厅" },
            { value: "51b1386", text: "自有营业厅福田港澳城营业厅" },
            { value: "51b1epn", text: "自有营业厅福田皇岗口岸营业厅" }
          ],
          area: [
            { value: "福田", text: "福田" },
            { value: "宝安", text: "宝安" },
            { value: "龙坪", text: "龙坪" },
            { value: "龙光", text: "龙光" },
            { value: "南山", text: "南山" },
            { value: "罗盐", text: "罗盐" }
          ],
          star: [
            { value: 6, text: "6-8星" },
            { value: 5, text: "5星" },
            { value: 4, text: "4星" },
            { value: 3, text: "3星" },
            { value: 2, text: "2星" },
            { value: 1, text: "1星" }
          ]
        };
        break;

      default:
        break;
    }
    return res;
  },
  initialPage: function () {
    var type = 1;

    let transferData = function (adata) {
      //load data to websql
      if (adata.length > 0) {
        dbWeb.transaction(function (context) {
          context.executeSql(
            "CREATE TABLE IF NOT EXISTS TB_MAIN (butype,store,code,area,star,openTime,month,num)"
          );

          context.executeSql("delete from TB_MAIN");
          let td = adata;
          for (let k = 0; k < td.length; k++) {
            let ted = td[k];
            let xx = `INSERT INTO TB_MAIN (butype,store,code,area,star,openTime,month,num)
            VALUES ("${ted.butype}", "${ted.store}", "${ted.code}", "${ted.area}", "${ted.star}", 
            "${ted.openTime}", ${ted.month}, ${ted.num})`;
            context.executeSql(
              xx,
              [],
              function (tx, result) {
                //在这里对result 做你想要做的事情吧...........
              },
              function (tx, error) {
                console.log(xx);
                console.log(d);
                console.log(error);
              }
            );
          }
          console.log('trans suc');
          var da = tPage.setQueryCondition(type);
        });
      }
      else {
        var da = tPage.setQueryCondition(type);
      }

    }

    try {
      fs.readFile(jsonFile, function (err, data) {
        if (err) {
          console.log('read file err');
          console.error(err);
          fs.writeFileSync(jsonFile, '');
          transferData([]);
          return;
        }
        console.log('read suc');
        let dd = []
        // console.log(data)
        if (data != '') {
          let decryptedString = cryptr.decrypt(data.toString());
          dd = JSON.parse(decryptedString);
          //  console.log(dd)
        }
        transferData(dd);
      }
      );
    } catch (error) {

    }

    // db.find({ code: '1' }, function (err, docs) {
    //   if (docs.length > 0) {
    //     transferData(docs[0].data);
    //   }
    // })

    $("#btnQuery").click(function () {
      tPage.queryData();
    });
    $("#btnChooseFile").click(function () {
      event.preventDefault();
      ipcRenderer.send("openDialog", { path: 1 });
    });
    ipcRenderer.on("openDialogCB", function (event, data) {
      let path = data[0],
        type = 0;
      console.log(path);
      cm.importFile({ path, type });
    });
    $("#btnExport").click(function () {
      event.preventDefault();
      cm.exportData();
    });
    //test code
    return;
    // importFile({ path: "/Users/s1rokage/Desktop/收入汇总.xlsx", type: 0 });

    // testDB();

    // var param = JSON.parse(
    //   '{"type":"1","dateSt":"201601","dateEnd":"201606","store":["51a0339","51b1epn"],"area":{"checked":["福田","龙坪"],"calType":"avg"},"star":{"checked":["6","4"],"calType":"avg"},"center":{"checked":true,"calType":"avg"}}'
    // );
    // var res = query(param);
    // console.log(res);
  },
  queryData: function () {
    var param = {
      type: $("#buType").find(":checked").val(),
      dateSt: $("#dateSt").val().replace("-", ""),
      dateEnd: $("#dateEnd").val().replace("-", ""),
      store: tPage.getCheckedVal("#divStore"),
      area: {
        checked: tPage.getCheckedVal("#divArea"),
        calType: $("#calTypeArea").find(":checked").val()
      },
      star: {
        checked: tPage.getCheckedVal("#divStar"),
        calType: $("#calTypeStar").find(":checked").val()
      },
      center: {
        checked: $("#buCenter").prop("checked"),
        calType: $("#calTypeCenter").find(":checked").val()
      }
    };
    console.log("查询参数");
    console.log(param);
    if (param.store.length == 0 && param.area.checked.length == 0 && param.star.checked.length == 0 && param.center.checked == false) {
      alert('请至少勾选一个条件');
      return
    }
    let cb = function (res) {
      initTable(res.table);
      iniChart(res.chart);
    };
    cm.queryData(param, cb);
  },
  getCheckedVal: function (sele) {
    var res = [];
    var ele = $(sele).find(":checked");
    for (var i = 0; i < ele.length; i++) {
      res.push($(ele[i]).val());
    }
    return res;
  },
  getRadionHtml: function (arr, name) {
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
  getCheckHtml: function (arr, name) {
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
      yAxis: [
        {
          type: "value"
        }
      ],
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

$(function () {
  tPage.initialPage();
});
