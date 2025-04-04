select *, s.ROWID from ibdsegs  as s
join idalias as a on ( a.id_1 = s.id1_1 and a.id_2 = s.id1_2 )
join idalias as a2 on ( a2.id_1 = s.id2_1 and a2.id_2 = s.id2_2 )
where (a.name like "name1%" and a2.name like  "%name2")
OR (a2.name like "name1%" and a.name like  "%name2")
AND chromosome = 4;