-- segments in sa are expected to be full IBD, and sb has the wider range including half-ibd 
-- this first test is for bad logic - the assumed full-IDB extends beyond half.
select  id1, id2, a1.name as namea, a2.name as nameb, chromosome,
		sa.start as starta, sb.start as startb, sa.end as enda, sb.end as endb,
		((sb.start - sa.start)/10000)*0.01 as startexcess, ((sa.end - sb.end)/10000)*0.01 as endexcess,
		sa.cM as cma, sb.cM as cmb, sa.snps as snpsa, sb.snps as snpsb
 from ibdsegs as sa  JOIN ibdsegs as sb USING (id1, id2, chromosome )
	JOIN idalias as a1 on id1 = a1.idText
	JOIN idalias as a2 on id2 = a2.idText
 where sa._rowid_ != sb._rowid_
	AND chromosome < 50 AND sa.snps = sb.snps
	AND sa.start BETWEEN sb.start and sb.end ;
	and sa.end > sb.end;

-- 2nd test - full IBD starts before half.

select  id1, id2, a1.name as namea, a2.name as nameb, chromosome,
		sa.start as starta, sb.start as startb, sa.end as enda, sb.end as endb,
		((sb.start - sa.start)/10000)*0.01 as startexcess, ((sa.end - sb.end)/10000)*0.01 as endexcess,
		sa.cM as cma, sb.cM as cmb, sa.snps as snpsa, sb.snps as snpsb
 from ibdsegs as sa  JOIN ibdsegs as sb USING (id1, id2, chromosome )
JOIN idalias as a1 on id1 = a1.idText
JOIN idalias as a2 on id2 = a2.idText
 where sa._rowid_ != sb._rowid_
 AND chromosome < 50 AND sa.snps = sb.snps
AND sa.end BETWEEN sb.start and sb.end ;
and sa.start < sb.start;

-- now try to get a full list..
select  id1, id2, a1.name as namea, a2.name as nameb, chromosome,
		sa.start as starta, sb.start as startb, sa.end as enda, sb.end as endb,
		((sb.start - sa.start)/10000)*0.01 as startexcess, ((sa.end - sb.end)/10000)*0.01 as endexcess,
		sa.cM as cma, sb.cM as cmb, sa.snps as snpsa, sb.snps as snpsb
 from ibdsegs as sa  JOIN ibdsegs as sb USING (id1, id2, chromosome )
	JOIN idalias as a1 on id1 = a1.idText
	JOIN idalias as a2 on id2 = a2.idText
 where sa._rowid_ != sb._rowid_
	AND chromosome < 50
	AND  ( ( sa.start BETWEEN sb.start and sb.end  AND sa.snps <= sb.snps )
		OR ( sa.end BETWEEN sb.start and sb.end AND sa.snps < sb.snps ) )
	AND  a1.name like '%bean%'