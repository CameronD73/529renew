-- this is code used to test the best option for creating a table to save ICW lists.

SELECT
	a2.name as name2, a3.name as name3,
	m1.cMtotal as cMtotal1, m1.nsegs as nsegs1,
	m2.cMtotal as cMtotal2, m2.nsegs as nsegs2,
	m3.cMtotal as cMtotal3, m3.nsegs as nsegs3,
	s.IDprofile, s.ID2, s.ID3, count(*) as num, max(chromosome) as maxchr
	from ICWSets as s
	JOIN idalias as a2 on (s.ID2 = a2.IDtext)
	JOIN idalias as a3 on (s.ID3 = a3.IDtext)
	JOIN DNAmatches as m3 ON s.ID2 = M3.ID1 AND s.ID3 = M3.ID2
	JOIN DNAmatches as m1 ON (s.IDprofile = m1.ID1 AND s.ID2 = m1.ID2) OR  (s.IDprofile = m1.ID2 AND s.ID2 = m1.ID1)
	JOIN DNAmatches as m2 ON (s.IDprofile = m2.ID1 AND s.ID3 = m2.ID2) OR  (s.IDprofile = m2.ID2 AND s.ID3 = m2.ID1)
	WHERE IDprofile = 'Replace_ID'
	GROUP BY s.IDprofile, s.ID2, s.ID3
	ORDER by cMtotal1 DESC, cMtotal2 DESC;
	
