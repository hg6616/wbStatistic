//require
const ipcRenderer = nodeRequire("electron").ipcRenderer,
  // Datastore = nodeRequire("nedb"),
  _ = nodeRequire("lodash"),
  xlsx = nodeRequire("node-xlsx"),
  https = nodeRequire("https"),
  path = nodeRequire("path");

//import lib from './lib';

Handlebars.registerHelper("formatDate", function(date) {
  return moment(date).format("YYYY-MM-DD hh:mm:ss");
});
var fs = nodeRequire("fs");
var dbWeb = openDatabase("WBDB", "1.0", "WBDB", 2 * 1024 * 1024);

var Cryptr = nodeRequire("cryptr"),
  cryptr = new Cryptr("myTotalySecretKey22");
let jsonFile = path.join(path.resolve(__dirname, "../../../../"), "data.jd");
let jsonFile2 = path.join(path.resolve(__dirname, "../../../../"), "data2.jd");
let appPath = path.resolve(__dirname, "../../");
let pageConfig = {
  pageName: "收入规模", //收入增长 发展情况 发展提升
  module: "0", //1是发展情况
  index: "0", //1,2,3
  tbName: "TB_MAIN"
};
let updateCount = 0;
let sv = {
  log: function(txt) {
    let txtfile = path.join(path.resolve(__dirname, "../../../../"), "log.d");
    fs.appendFile(txtfile, txt + " \n ", "utf8");
  },
  checkUpdate: function() {
    return;
    console.log("check update!");
    //read local cfg
    let file = path.join(appPath, "package.json");
    let localPackCfg = JSON.parse(fs.readFileSync(file).toString());
    let remoteCfg;
    // console.log(localPackCfg);
    let finalDo = function() {
      //update local cfg
      fs.writeFileSync(file, JSON.stringify(remoteCfg));
      sv.log("更新成功");
      //reload
      window.location.href = "index.html";
    };
    //read remote cfg
    sv.getHttpsData("package.json", function(data) {
      remoteCfg = JSON.parse(data);
      //remote version is newer && upfile
      let localVersion = parseFloat(localPackCfg.version.replace("0.", ""));
      let remoteVersion = parseFloat(remoteCfg.version.replace("0.", ""));
      if (
        localVersion < remoteVersion &&
        remoteCfg.UpFiles != undefined &&
        remoteCfg.UpFiles.length > 0
      ) {
        sv.getAndReplaceFile(remoteCfg.UpFiles, finalDo);
      } else if (localVersion >= remoteVersion) {
        console.log("newest version");
      } else if (
        remoteCfg.UpFiles == undefined &&
        remoteCfg.UpFiles.length == 0
      ) {
        console.log("no update files");
      }
    });
  },
  getAndReplaceFile: function(filePath, cb) {
    sv.getHttpsData2(filePath, cb);
  },
  getHttpsData: function(filepath, success, error) {
    // 回调缺省时候的处理
    success = success || function() {};
    error = error || function() {};

    var url =
      "https://raw.githubusercontent.com/hg6616/wbStatistic/master/app/" +
      filepath +
      "?r=" +
      Math.random();

    https.get(url, function(res) {
      var statusCode = res.statusCode;

      if (statusCode !== 200) {
        // 出错回调
        error();
        // 消耗响应数据以释放内存
        res.resume();
        return;
      }

      res.setEncoding("utf8");
      var rawData = "";
      res.on("data", function(chunk) {
        rawData += chunk;
      });

      // 请求结束
      res
        .on("end", function() {
          // 成功回调
          success(rawData);
        })
        .on("error", function(e) {
          // 出错回调
          error();
        });
    });
  },
  getHttpsData2: function(files, cb) {
    // 回调缺省时候的处理
    let filepath = files[0];
    var url =
      "https://raw.githubusercontent.com/hg6616/wbStatistic/master/app/" +
      filepath +
      "?r=" +
      Math.random();

    https.get(url, function(res) {
      var statusCode = res.statusCode;

      if (statusCode !== 200) {
        // 出错回调
        error();
        // 消耗响应数据以释放内存
        res.resume();
        return;
      }

      res.setEncoding("utf8");
      var rawData = "";
      res.on("data", function(chunk) {
        rawData += chunk;
      });

      // 请求结束
      res
        .on("end", function() {
          // 成功回调
          // success(rawData);
          // 写入文件
          let data = rawData;
          let file = path.join(appPath, filepath);
          fs.writeFileSync(file, data);
          sv.log("更新文件:" + file);
          if (files.length >= 2) {
            let newFiles = files.splice(1);
            sv.getHttpsData2(newFiles, cb);
          } else {
            if (cb != null) {
              cb();
            }
          }
        })
        .on("error", function(e) {
          // 出错回调
          // error();
          console.log(e);
        });
    });
  },
  getConditionData: function(cb) {
    let res = {};
    let tb = pageConfig.tbName;
    dbWeb.transaction(function(context) {
      context.executeSql(
        ` 
   select * from (  select * from (
    select butype text,(
      case
       when butype='3G出账' then '01'
      when butype='4G出账' then '02'
      when butype='34G出账' then '03'
      when butype='宽带出账' then '04'
      when butype='通服收入' then '05'
      when butype='34G后付语音' then '06'
      when butype='宽带' then '07'
      when butype='终端总量' then '08'
      when butype='新终端' then '09'
      when butype='老用户购机' then '10'
      when butype='裸机' then '11'
      end
    ) val ,'type' type from (
  select distinct butype from TB_MAIN )) order by val ) 
 union all 
  select * from (  select * from (
    select butype text,(
      case
        when butype='3G出账' then '01'
      when butype='4G出账' then '02'
      when butype='34G出账' then '03'
      when butype='宽带出账' then '04'
      when butype='通服收入' then '05'
      when butype='34G后付语音' then '06'
      when butype='宽带' then '07'
      when butype='终端总量' then '08'
      when butype='新终端' then '09'
      when butype='老用户购机' then '10'
      when butype='裸机' then '11'
      end
    ) val ,'type2' type from (
  select distinct butype from TB_MAIN2 )) order by val ) 
 union all 
  select min(month) text,min(month) val,'minDate' type from  ${tb}   
  union all
    select max(month) text,max(month) val,'maxDate' type from  ${tb} 
      union all
     select distinct area text,area val,'area' type from  ${tb}  
    where 1=1 and area!='undefined'  
    `,
        [],
        function(tx, result) {
          let row1 = result.rows;
          context.executeSql(
            ` 
    select distinct store text,code val,'store' type,
    (case when star='1' then '1星'
 when star='2' then '2星'
 when star='3' then '3星'
 when star='4' then '4星'
 when star='5' then '5星'
 else   '6-8星' end 
)  star  from  ${tb}  
    where 1=1 and code!='undefined' and store!='营业中心'  order by star desc
    `,
            [],
            function(tx, result) {
              let row = [];
              for (let k = 0; k < row1.length; k++) {
                row.push(row1[k]);
              }
              for (let k = 0; k < result.rows.length; k++) {
                row.push(result.rows[k]);
              }
              cb(row);
              // console.log(row);
            },
            function(tx, error) {
              alert("查询失败: " + error.message);
            }
          );
        },
        function(tx, error) {
          alert("查询失败: " + error.message);
        }
      );
    });
  },
  loadData2Websql: function(cb) {
    let transferData = function(adata, tbName, isLast) {
      //load data to websql

      if (adata.length > 0) {
        dbWeb.transaction(function(context) {
          context.executeSql(
            `CREATE TABLE IF NOT EXISTS ${tbName} (butype,store,code,area,star,openTime,month,num)`
          );
          context.executeSql(`delete from  ${tbName} `);
          let td = adata;
          for (let k = 0; k < td.length; k++) {
            let ted = td[k];
            let xx = `INSERT INTO  ${tbName}  (butype,store,code,area,star,openTime,month,num)
            VALUES ("${ted.butype}", "${ted.store}", "${ted.code}", "${ted.area}", "${ted.star}", 
            "${ted.openTime}", ${ted.month}, ${ted.num})`;
            context.executeSql(
              xx,
              [],
              function(tx, result) {
                //在这里对result 做你想要做的事情吧...........
              },
              function(tx, error) {
                console.log(xx);
                console.log(d);
                console.log(error);
              }
            );
          }
          console.log("trans suc");
          if (cb != undefined && isLast) {
            cb();
          }
        });
      } else {
        if (cb != undefined && isLast) {
          cb();
        }
      }
    };
    let fnSet = function(file, tbName, isLast) {
      fs.readFile(file, function(err, data) {
        if (err) {
          console.log("read file err");
          console.error(err);
          fs.writeFileSync(file, "");

          transferData([], tbName, isLast);
          return;
        }
        console.log("read suc");

        let dd = [];
        if (data != "") {
          let decryptedString = cryptr.decrypt(data.toString());
          dd = JSON.parse(decryptedString);
        }

        transferData(dd, tbName, isLast);
      });
    };
    //read 2 local files
    let arr = [
      {
        file: jsonFile,
        tbName: "TB_MAIN"
      },
      {
        file: jsonFile2,
        tbName: "TB_MAIN2"
      }
    ];
    for (let i = 0; i < arr.length; i++) {
      let ele = arr[i];
      let isLast = i == arr.length - 1;
      fnSet(ele.file, ele.tbName, isLast);
    }
  },

  queryData: function(param, cb) {
    param.dateSt = parseInt(param.dateSt);
    param.dateEnd = parseInt(param.dateEnd);
    let res = {};
    let type2Sheet = {
      "01": "3G出账",
      "02": "4G出账",
      "03": "34G出账",
      "04": "宽带出账",
      "05": "通服收入",
      "06": "34G后付语音",
      "07": "宽带",
      "08": "终端总量",
      "09": "新终端",
      "10": "老用户购机",
      "11": "裸机"
    };
    let sheetName = type2Sheet[param.type];
    let type = 0;
    let data;
    let getSqlInStr = function(arr, isNum) {
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

    let tbName = param.tbName;

    let getsql1 = function() {
      let sql = "";
      //store
      if (param.store.length > 0) {
        let storeIn = getSqlInStr(param.store);
        sql = `
  select store name,month,num ,0 orderby from ${tbName} where 1=1
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
          .calType}(num) num ,1 orderby from  ${tbName}  where 1=1
  and month between ${param.dateSt} and  ${param.dateEnd} 
  and butype='${sheetName}'
  and area in (${areaIn})
   and num!=0
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
    select name,month,${param.star.calType}(num) num ,2 orderby  from (
select (case when star='1' then '1星'
 when star='2' then '2星'
 when star='3' then '3星'
 when star='4' then '4星'
 when star='5' then '5星'
 else   '6-8星' end 
) name,month,num  from  ${tbName}  where 1=1
  and month between ${param.dateSt} and  ${param.dateEnd} 
  and butype='${sheetName}'
   and num!=0
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
  select store name,month, num  ,3 orderby from  ${tbName}  where 1=1
    and month between ${param.dateSt} and  ${param.dateEnd}
    and butype='${sheetName}'
    and store='营业中心' 
     and num!=0
  `;
        } else {
          sql += `
     select tb1.store name,tb1.month,tb1.num/tb2.c num ,3 orderby  from
     (
  select store,month, num from  ${tbName}  where 1=1
    and month between ${param.dateSt} and  ${param.dateEnd}
    and butype='${sheetName}'
     and num!=0
    and store='营业中心' ) tb1
   inner join      (
     select month,count(0) c from (
  select distinct month,code from  ${tbName}  where 1=1
    and month between ${param.dateSt} and  ${param.dateEnd}
    and butype='${sheetName}'
     and code!='undefined'
      and store!='营业中心' 
       and num!=0
  )  group by month
  ) tb2
on tb1.month=tb2.month
  `;
        }
      }
      sql = `
select name,month,round(num,2) num,orderby from (${sql} ) 
`;
      return sql;
    };
    let cb1 = function(result) {
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
      table.push([""].concat(x).concat([-100]));
      
      for (let i = 0; i < newseries.length; i++) {
        let ele = newseries[i];
        table.push([ele.name].concat(ele.data).concat([ele.orderby]));
      }
      //加上月均列
      if (table.length >= 2) {
        table[0].push("月均");
         
        for (let l = 1; l < table.length; l++) {
          let ele = table[l];
          let count = 0;
          let sum = 0;
          for (let p = 1; p < ele.length-1; p++) {
            sum += ele[p];
            if(ele[p]!=0){
              count++;
            }
          }
          table[l].push(parseFloat((sum / count).toFixed(2)));
        }
      }
       
      let index1=table[0].length-2;
      let index2=table[0].length-1;
      //排序
      table=_.sortByOrder(table,[index1,index2],['asc','desc']);
       for (let i = 0; i < table.length; i++) {
          table[i].splice(index1,1);
         
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
    };

    let getsql2 = function() {
      let sql = "";
      //store
      if (param.store.length > 0) {
        let storeIn = getSqlInStr(param.store);
        sql = ` 
  select t1.store name, t1.num_jz jz, t2.num_mb  mb,
        (t2.num_mb-t1.num_jz)/t1.num_jz*100  rate ,0 orderby  from (
select store ,${param.calType}(num) num_jz  from t_jz 
where 1=1
    and code in (${storeIn})
   group by store
   ) t1
inner join
(
select store ,${param.calType}(num) num_mb  from t_mb
where 1=1
    and code in (${storeIn})
   group by store
   ) t2
  on t1.store=t2.store 
        `;
      }
      //area
      if (param.area.checked.length > 0) {
        if (sql != "") {
          sql += " union ";
        }
        let areaIn = getSqlInStr(param.area.checked);
        if(param.calType=='sum'){
  sql += ` 
  select t1.area name, t1.num_jz jz, t2.num_mb mb,
         (t2.num_mb-t1.num_jz)/t1.num_jz*100 rate ,1 orderby  from (
select area ,${param.calType}(num) num_jz  from t_jz 
where 1=1
    and area in (${areaIn})
   group by area
   ) t1
inner join
(
select area ,${param.calType}(num) num_mb  from t_mb
where 1=1
   and area in (${areaIn})
   group by area
   ) t2
  on t1.area=t2.area 
        `;
        }
        else{
          //avg
            sql += ` 
  select t1.area name, t1.num_jz jz, t2.num_mb mb,
         (t2.num_mb-t1.num_jz)/t1.num_jz*100 rate ,1 orderby  from (
           select area,avg(num_jz) num_jz from (
select area,month ,sum(num) num_jz  from t_jz 
where 1=1
    and area in (${areaIn})
   group by area,month
   ) group by area
   ) t1
inner join
(
  select area,avg(num_mb) num_mb from (
select area ,month,sum(num) num_mb  from t_mb
where 1=1
   and area in (${areaIn})
   group by area,month)
   group by area
   ) t2
  on t1.area=t2.area 
        `;
        }
      
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
        if(param.calType=='sum'){
 sql += ` 
  select t1.star2 name, t1.num_jz  jz, t2.num_mb  mb,
         (t2.num_mb-t1.num_jz)/t1.num_jz*100  rate ,2 orderby  from (
select star2 ,${param.calType}(num) num_jz  from t_jz 
where 1=1
     ${starIn}
   group by star2
   ) t1
inner join
(
select star2 ,${param.calType}(num) num_mb  from t_mb
where 1=1
    ${starIn}
   group by star2
   ) t2
  on t1.star2=t2.star2 
        `;
        }
        else{
          //avg
 sql += ` 
  select t1.star2 name, t1.num_jz  jz, t2.num_mb  mb,
         (t2.num_mb-t1.num_jz)/t1.num_jz*100  rate ,2 orderby  from (
           select star2,avg(num_jz) num_jz from (
select star2 ,month,sum(num) num_jz  from t_jz 
where 1=1
     ${starIn}
   group by star2,month)
   group by star2
   ) t1
inner join
(
   select star2,avg(num_mb) num_mb from (
select star2 ,month,sum(num) num_mb  from t_mb
where 1=1
    ${starIn}
    group by star2,month)
   group by star2
   ) t2
  on t1.star2=t2.star2 
        `;
        }
       
      }
      //center
      if (param.center.checked) {
        if (sql != "") {
          sql += " union ";
        }

        sql += ` 
  select t1.store name, t1.num_jz  jz, t2.num_mb  mb,
         (t2.num_mb-t1.num_jz)/t1.num_jz*100  rate ,3 orderby  from (
select store ,${param.calType}(num) num_jz  from t_jz 
where 1=1
    and store='营业中心' 
   group by store
   ) t1
inner join
(
select store ,${param.calType}(num) num_mb  from t_mb
where 1=1
   and store='营业中心' 
   group by store
   ) t2
  on t1.store=t2.store 
        `;
      }

      let sourceSql = `
        with t_jz as ( 
SELECT store,code,area,star,month,cast(num as double) num,
(case when star='1' then '1星'
 when star='2' then '2星'
 when star='3' then '3星'
 when star='4' then '4星'
 when star='5' then '5星'
 else   '6-8星' end 
) star2
FROM  ${tbName} t
WHERE 1 = 1
 and  butype='${sheetName}'
  and month between ${param.dateStStandard} and  ${param.dateEndStandard} 
  and num!=0
    ),
t_mb as ( 
SELECT store,code,area,star,month ,cast(num as double) num
,(case when star='1' then '1星'
 when star='2' then '2星'
 when star='3' then '3星'
 when star='4' then '4星'
 when star='5' then '5星'
 else   '6-8星' end 
) star2
FROM  ${tbName} t
WHERE 1 = 1
 and  butype='${sheetName}'
  and month between ${param.dateStTarget} and  ${param.dateEndTarget} 
   and num!=0
    )
      `;

      sql = `
      ${sourceSql} 
select name,round(jz,2) jz,round(mb,2) mb,round(rate,2) rate ,orderby from (${sql} ) 
order by orderby asc,rate desc
`;

      return sql;
    };
    let cb2 = function(result) {
      let { rows } = result;
      // console.log(rows);
      daTmp = rows;
      let x = [],
        legend = [],
        series = [];
      for (let i = 0; i < rows.length; i++) {
        x.push(rows[i].name);
      }
      let cf = [
        { name: "基准值", type: "bar", col: "jz", yIndex: 0 },
        { name: "目标值", type: "bar", col: "mb", yIndex: 0 },
        { name: "增长率", type: "line", col: "rate", yIndex: 1 }
      ];
      for (let i = 0; i < cf.length; i++) {
        let ele = cf[i];
        legend.push(ele.name);
        let tm = {
          name: ele.name,
          type: ele.type,
          yAxisIndex: ele.yIndex,
          data: []
        };
        for (let j = 0; j < rows.length; j++) {
          tm.data.push(rows[j][ele.col]);
        }
        if (tm.type == "line") {
          tm.smooth = true;
        }
        series.push(tm);
      }
      let table = [];
      table.push(["", "基准值", "目标值", "增长率"]);
      for (let i = 0; i < rows.length; i++) {
        let ele = rows[i];
        table.push([ele.name, ele.jz, ele.mb, ele.rate + "%"]);
      }

      res.chart = {
        x: x,
        legend: legend,
        series: series
      };
      tableData = table;
      res.table = table;

      console.log(res);
      cb(res);
    };

    //
    let sql = "";
    let cbx = null;
    if (param.index == "0" || param.index == "2") {
      sql = getsql1();
      cbx = cb1;
    } else if (param.index == "1" || param.index == "3") {
      sql = getsql2();
      cbx = cb2;
    }
    if (sql == "") {
      return;
    }
   // console.log(sql);
    dbWeb.transaction(function(context) {
      context.executeSql(
        sql,
        [],
        function(tx, result) {
          cbx(result);
        },
        function(tx, error) {
        //  alert("查询数据出错");
          console.log(sql);
          console.log(error);
        }
      );
    });
  },
  importFile: function(cfg, cbx) {
    let { path, type } = cfg;
    let excelData = xlsx.parse(path);
    let tbName = "TB_MAIN";
    let jsonfilePath = jsonFile;
    if (type == "1") {
      tbName = "TB_MAIN2";
      jsonfilePath = jsonFile2;
    }
    dbWeb.transaction(function(context) {
      context.executeSql(
        `CREATE TABLE IF NOT EXISTS ${tbName} (butype,store,code,area,star,openTime,month,num)`
      );
      if (excelData.length < 1) {
        return;
      }
      context.executeSql(`delete from  ${tbName} `);
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
            let xx = `INSERT INTO  ${tbName}  (butype,store,code,area,star,openTime,month,num)
            VALUES ("${ted.butype}", "${ted.store}", "${ted.code}", "${ted.area}", "${ted.star}", 
            "${ted.openTime}", ${ted.month}, ${ted.num})`;
            context.executeSql(
              xx,
              [],
              function(tx, result) {
                //在这里对result 做你想要做的事情吧...........
              },
              function(tx, error) {
                console.log(xx);
                console.log(d);
                console.log(error);
              }
            );
          }
        }
      }
      //backup data to local file
      let encryptedString = cryptr.encrypt(JSON.stringify(excelDBdata));
      fs.writeFile(jsonfilePath, encryptedString, function(err) {
        if (err) {
          console.log("write file err");
          console.error(err);
          return;
        }
        console.log("write suc");
      });
      alert("导入完成");
      if (cbx) {
        cbx();
      }
    });
  },
  exportData: function() {
    if (tableData.length == 0) {
      alert("没有可以导出的数据");
      return;
    }
    var buffer = xlsx.build([
      {
        name: "sheet1",
        data: tableData
      }
    ]);

    //将文件内容插入新的文件中
    let filename = "export" + moment().format("YYYYMMDDhhmmss") + ".xlsx";
    let filePath = path.join(path.resolve(__dirname, "../../../../"), filename);
    console.log(filePath);
    fs.writeFileSync(filePath, buffer, { flag: "w" });
    let win = window.open(filePath, null);
    setTimeout(function() {
      win.close();
    }, 2000);
    console.log("exportdata");
  }
};
let daTmp;
var tableData;
