-- pick a person and replace occurrences of "replace_IDnum" with actual UUID
select IDprofile, ID2, ID3, a2.name as name2, a3.name as name3, chromosome as chr, start, end   from ICWsets as s
	join idalias as a2 on a2.IDText = s.ID2
	join idalias as a3 on a3.IDText = s.ID3
	WHERE  s.ID2 = 'replace_IDnum'
		OR s.ID3 = 'replace_IDnum';

select ID1, ID2,  a1.name as name1, a2.name as name2, chromosome as chr, start, end, cM, snps
  from ibdsegs as s
	join idalias as a1 on a1.IDText = s.ID1
	join idalias as a2 on a2.IDText = s.ID2
	WHERE  s.ID2 = 'replace_IDnum'
		OR s.ID1 = 'replace_IDnum'
		order by chr, start;

select ID1, ID2,  a1.name as name1, a2.name as name2, ishidden, pctshared, cMtotal, nsegs, hasSegs
  from DNAmatches as s
	join idalias as a1 on a1.IDText = s.ID1
	join idalias as a2 on a2.IDText = s.ID2
	WHERE  s.ID2 = 'replace_IDnum'
		OR s.ID1 = 'replace_IDnum'
		order by ID1, ID2;
