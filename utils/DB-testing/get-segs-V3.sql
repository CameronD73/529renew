-- integer version
select *, s.ROWID from ibdsegs  as s
join idalias as a on ( a.id = s.id1 and a.id = s.id1 )
join idalias as a2 on ( a2.id = s.id2 and a2.id = s.id2 )
where (a.name like "name1%" and a2.name like  "%name2")
OR (a2.name like "name1%" and a.name like  "%name2")
AND chromosome = 4;

-- text version
select *, s.ROWID from ibdsegs  as s
join idalias as a on ( a.idtext = s.id1 and a.idtext = s.id1 )
join idalias as a2 on ( a2.idtext = s.id2 and a2.idtext = s.id2 )
where (a.name like "name1%" and a2.name like  "%name2")
OR (a2.name like "name1%" and a.name like  "%name2")
AND chromosome = 4;