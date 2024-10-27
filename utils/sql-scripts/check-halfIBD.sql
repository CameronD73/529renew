-- get the full list, but reduce by those assumed to be Full-IBD	
select * from ibdsegs ;
 where _rowid_ not in 
( select  sa._rowid_ as rownum from ibdsegs as sa JOIN ibdsegs as sb USING (id1, id2, chromosome )
 where sa._rowid_ != sb._rowid_	AND chromosome < 50
	AND  ( ( sa.start BETWEEN sb.start and sb.end  AND sa.snps <= sb.snps )
		OR ( sa.end BETWEEN sb.start and sb.end AND sa.snps < sb.snps ) ) );