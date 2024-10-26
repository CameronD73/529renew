-- populate DNAmatches table from old data where matches have fallen off the bottom
-- only useful once.
drop table if exists tempmatch;
create temporary table tempmatch as;
INSERT or IGNORE into DNAmatches
 select ID1, ID2, 0 as ishidden, 0.01*floor(sum(cM)/0.744) as pctshared, sum(cM) as cMtotal, count(*) as nsegs, 1 as hasSegs, null as lastdate from ibdsegs
	WHERE chromosome < 50 GROUP BY ID1, ID2
	ORDER by nsegs desc;

select * from tempmatch as n left join DNAmatches as o USING(ID1, ID2)
join idalias as a1 ON ID1 = a1.IDText
JOIN  idalias as a2 ON ID2 = a2.IDText
where o.nsegs is null order by n.nsegs desc;


-- INSERT OR IGNORE into DNAmatches (IDprofile, IDrelative)  SELECT ID1, ID2  from tempmatch where chr <50 ;