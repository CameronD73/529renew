-- have to run this on old webSQL db to extract chr200 then import to new db in DNAmatches table
-- obsolete code
drop table if exists tempmat200;
create temporary table tempmat200 as;
select ID1, ID2, end as hidden, snps * 0.001 as pctshared, snps * 0.0744 as cMtotal, 0 as hasSegs from ibdsegs
	WHERE chromosome > 150 AND 
		(  id1 in (select IDprofile from profiles) OR  id2 in (select IDprofile from profiles))
	group by ID1, ID2;

-- swap in-place to get profile always first.
UPDATE tempmat200 set id1 = id2, id2 = id1 where id1 not in (select IDprofile from profiles);

select * from tempmat200 ORDER by ID1, ID2 ;		-- to update into other DB

---
-- INSERT OR IGNORE into DNArelatives (IDprofile, IDrelative)  SELECT ID1, ID2  from tempmat200 where chr <50 ;