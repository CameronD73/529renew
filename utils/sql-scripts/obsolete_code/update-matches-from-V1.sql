-- start with DNA relatives.
drop table if exists temprels;
create temporary table temprels as
  select ID1, ID2 from ibdsegs where 
	    id1 in (select IDProfile from profiles)
	OR  id2 in (select IDProfile from profiles)
	group by ID1, ID2
	;
-- swap in-place to get profile alays first.
UPDATE temprels set id1 = id2, id2 = id1 where id1 not in (select IDProfile from profiles);

select * from temprels;
-- left join DNARelatives on IDProfile = ID1 and IDrelative = ID2;