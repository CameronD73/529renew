-- populate DNARelatives table from old data where matches have fallen off the bottom
-- only useful once.
drop table if exists temprelmin;
create temporary table temprelmin as select ID1, ID2, min(chromosome) as chr, cM, end, snps from ibdsegs
	WHERE chromosome < 150 AND 
		(   id1 in (select IDprofile from profiles)
		OR  id2 in (select IDprofile from profiles)
		)
	group by ID1, ID2
	;
-- swap in-place to get profile always first.
UPDATE temprelmin set id1 = id2, id2 = id1 where id1 not in (select IDprofile from profiles);

select * from temprelmin where chr <50 order by snps;

select * from temprelmin left join DNARelatives  on IDprofile = ID1 and IDrelative = ID2 where IDprofile is null and chr = 100;
STOP;

INSERT OR IGNORE into DNArelatives (IDprofile, IDrelative)  SELECT ID1, ID2  from temprelmin where chr <50 ;