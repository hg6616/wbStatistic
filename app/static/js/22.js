dbWeb.transaction(function(context) {
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
  select min(month) text,min(month) val,'mindate' type from tb_main  
  union all
    select max(month) text,max(month) val,'maxdate' type from tb_main  
     union all
    select distinct store text,code val,'store' type from tb_main 
    where 1=1 and code!='undefined' and code!='营业中心'
      union all
     select distinct area text,area val,'area' type from tb_main 
    where 1=1 and area!='undefined'  
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