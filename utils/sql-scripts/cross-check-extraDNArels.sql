-- this code is all non-working, as it was based ion the original "chromosome100" and 200 
-- hacks.
drop table if exists temprels;
drop table if exists temprels100;
drop table if exists temprels200;
drop table if exists temprelsAll;

create temporary table temprels as
  select ID1, ID2, chromosome as chr from ibdsegs where chromosome < 50
	AND (   id1 in (select IDprofile from profiles)
		OR  id2 in (select IDprofile from profiles)
		)
	group by ID1, ID2
	;
-- swap in-place to get profile always first.
UPDATE temprels set id1 = id2, id2 = id1 where id1 not in (select IDprofile from profiles);

select * from temprels ;

create temporary table temprels100 as
  select ID1, ID2, chromosome as chr from ibdsegs where chromosome = 100
	AND (   id1 in (select IDprofile from profiles)
		OR  id2 in (select IDprofile from profiles)
		)
	group by ID1, ID2
	;
-- swap in-place to get profile always first.
UPDATE temprels100 set id1 = id2, id2 = id1 where id1 not in (select IDprofile from profiles);

select * from temprels100 ;

create temporary table temprels200 as
  select ID1, ID2, chromosome as chr from ibdsegs where chromosome = 200 
	AND (   id1 in (select IDprofile from profiles)
		OR  id2 in (select IDprofile from profiles)
		)
	group by ID1, ID2
	;
-- swap in-place to get profile always first.
UPDATE temprels200 set id1 = id2, id2 = id1 where id1 not in (select IDprofile from profiles);
select * from temprels200;

create temporary table temprelsAll as
  select ID1, ID2, chromosome as chr from ibdsegs where 
	    id1 in (select IDprofile from profiles)
	OR  id2 in (select IDprofile from profiles)
	group by ID1, ID2
	;
-- swap in-place to get profile always first.
UPDATE temprelsAll set id1 = id2, id2 = id1 where id1 not in (select IDprofile from profiles);
select * from temprelsAll;