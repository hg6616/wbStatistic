db.find({ hello: "world" }, function(err, docs) {
  console.log(docs);
});

db.find({ _id: 0 }, function(err, docs) {
  console.log(docs);
});

db.find({}, function(err, docs) {
  console.log(docs);
});

db.find(
  {
    $where: function() {
      return this.type == 0;
    }
  },
  {
    data: 1
  },
  function(err, docs) {
    console.log(docs);
  }
);

var users = [
  { user: "barney", active: false },
  { user: "fred", active: false },
  { user: "fred", active: true },
  { user: "pebbles", active: true }
];

_(d0)
  .filter(function(item) {
    return _.indexOf(["自有营业厅龙岗坑梓中心营业厅", "自有营业厅龙岗东方瑞景苑营业厅"], item["0"]) >= 0;
  })
  .value();

var gd = [
  { type: "a", num: 1, name: "xx1" },
  { type: "a", num: 2, name: "xx2" },
  { type: "a", num: 3, name: "xx3" },
  { type: "b", num: 4, name: "xx4" },
  { type: "b", num: 5, name: "xx5" }
];
_(gd).groupBy("type").value();

dbWeb.transaction(function(context) {
  context.executeSql(
    "CREATE TABLE IF NOT EXISTS TB_MAIN (butype,store,code,area,star,openTime,month)"
  );
  context.executeSql('INSERT INTO testTable (id, name) VALUES (0, "Byron")');
  context.executeSql('INSERT INTO testTable (id, name) VALUES (1, "Casper")');
  context.executeSql('INSERT INTO testTable (id, name) VALUES (2, "Frank")');
});

dbWeb.transaction(function(context) {
  context.executeSql(
    `
    select area ,round(sum(num),2) sum,avg(num) avg from (
    select * from TB_MAIN  where 1=1 and butype='3G出账' limit 100)
     tb where 1=1 group by area
    `,
    [],
    function(tx, result) {
      console.log(result.rows)
      //执行成功的回调函数
      //在这里对result 做你想要做的事情吧...........
    },
    function(tx, error) {
      alert("查询失败: " + error.message);
    }
  );
});



dbWeb.transaction(function(context) {
  context.executeSql(
    `
   select tb1.store,tb1.month,tb1.num/tb2.c num from
     (
  select store,month, num from tb_main where 1=1
    and month between 201601 and  201606
    and butype='3G出账'
    and code='营业中心' ) tb1
   inner join      (
     select month,count(0) c from (
  select distinct month,code from tb_main where 1=1
    and month between 201601 and  201606
    and butype='3G出账'
     and code!='undefined' and code!='营业中心'
  )  group by month
  ) tb2
on tb1.month=tb2.month
    `,
    [],
    function(tx, result) {
      console.log(result.rows)
      //执行成功的回调函数
      //在这里对result 做你想要做的事情吧...........
    },
    function(tx, error) {
      alert("查询失败: " + error.message);
    }
  );
});


dbWeb.transaction(function(context) {
  context.executeSql(
    `
    select * from (
    select butype text,(
      case 
      when butype='3G出账' then '1'
      when butype='4G出账' then '2'
      when butype='34G出账' then '3'
      when butype='宽带出账' then '4'
      when butype='通服收入' then '5'
      end 
    ) val,'type' type from (
  select distinct butype from tb_main )) order by val
    `,
    [],
    function(tx, result) {
      console.log(result.rows) 
    },
    function(tx, error) {
      alert("查询失败: " + error.message);
    }
  );
});

dbWeb.transaction(function(context) {
  context.executeSql(
    `
  delete from tb_main
    `,
    [],
    function(tx, result) {
      console.log(result.rows) 
    },
    function(tx, error) {
      alert("查询失败: " + error.message);

    //    "static/production/index.html",
    // "static/js/app.js",
    // "static/js/service.js",
    // "static/js/front.js"
    }
  );
});