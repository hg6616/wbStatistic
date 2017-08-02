  dbWeb.transaction(function(context) {
      context.executeSql(
        `
          with t_jz as ( 
SELECT t.*,
(case when star='1' then '1星'
 when star='2' then '2星'
 when star='3' then '3星'
 when star='4' then '4星'
 when star='5' then '5星'
 else   '6-8星' end 
) star2
FROM  TB_MAIN t
WHERE 1 = 1
 and  butype='3G出账'
  and month between 201607 and  201705 
    ),
t_mb as ( 
SELECT t.* ,(case when star='1' then '1星'
 when star='2' then '2星'
 when star='3' then '3星'
 when star='4' then '4星'
 when star='5' then '5星'
 else   '6-8星' end 
) star2
FROM  TB_MAIN t
WHERE 1 = 1
 and  butype='3G出账'
  and month between 201601 and  201705 
    )
       
select name,round(jz,2) jz,round(mb,2) mb,rate,orderby from ( 
  select t1.store name, t1.num_jz jz, t2.num_mb  mb,
        (t2.num_mb-t1.num_jz)/t1.num_jz*100  rate ,0 orderby  from (
select store ,avg(num) num_jz  from t_jz 
where 1=1
    and code in ('51a0401','51a1063')
   group by store
   ) t1
inner join
(
select store ,avg(num) num_mb  from t_mb
where 1=1
    and code in ('51a0401','51a1063')
   group by store
   ) t2
  on t1.store=t2.store 
         union  
  select t1.area name, t1.num_jz jz, t2.num_mb mb,
         (t2.num_mb-t1.num_jz)/t1.num_jz*100 rate ,1 orderby  from (
select area ,avg(num) num_jz  from t_jz 
where 1=1
    and area in ('龙坪')
   group by area
   ) t1
inner join
(
select area ,avg(num) num_mb  from t_mb
where 1=1
   and area in ('龙坪')
   group by area
   ) t2
  on t1.area=t2.area 
         union  
  select t1.star2 name, t1.num_jz  jz, t2.num_mb  mb,
         (t2.num_mb-t1.num_jz)/t1.num_jz*100  rate ,2 orderby  from (
select star2 ,avg(num) num_jz  from t_jz 
where 1=1
     and star in ('4')
   group by star2
   ) t1
inner join
(
select star2 ,avg(num) num_mb  from t_mb
where 1=1
    and star in ('4')
   group by star2
   ) t2
  on t1.star2=t2.star2 
         union  
  select t1.code name, t1.num_jz  jz, t2.num_mb  mb,
         (t2.num_mb-t1.num_jz)/t1.num_jz*100  rate ,3 orderby  from (
select code ,avg(num) num_jz  from t_jz 
where 1=1
    and code='营业中心' 
   group by code
   ) t1
inner join
(
select code ,avg(num) num_mb  from t_mb
where 1=1
   and code='营业中心' 
   group by code
   ) t2
  on t1.code=t2.code 
         ) 
        `,
        [],
        function(tx, result) {
          console.log(result.rows);
        },
        function(tx, error) {
          alert("查询数据出错"); 
          console.log(error);
        }
      );
    });


      