-- generate table for CSV export in format used by 23 and Me.
-- this is just experimental code to decide on code to embed in dbcode.js
-- to run search/replace "profile_ID" with a real one
SELECT
	a.name as name,
	 '' as surname, '' as chr, '' as MBstart, '' as MBend,
	m.cMtotal as Genetic_Distance,
	 '' as SNPs, '' as FullIBD, '' as LinkProfile, '' as Sex, '' as Birth_Year,
	r.knownRel as Set_Relationship,
	m.predictedRel as Predicted_Rel,
	'' as RelRange,
	m.pctshared as Percent_DNA_Shared,
	m.nsegs as Segments,
	CASE WHEN r.side in ('M', 'B') THEN 'TRUE' ELSE '' END as MaternalSide,
	CASE WHEN r.side in ('P', 'B') THEN 'TRUE' ELSE '' END as PaternalSide,
	a.hapMat as Maternal_Haplogroup,
	a.hapPat as Paternal_Haplogroup,
	a.familySurnames, a.familyLocations,
	 '' as mgmabc,  '' as mgpabc,  '' as pgmabc,  '' as pgpabc, 
	r.comment as Notes,
	'' as ShareStatus,
	CASE WHEN m.ishidden THEN '' ELSE 'TRUE' END as Showing_Ancestry,
	a.familyTreeURL, m.largestSeg as largest_Segment
    FROM  DNARelatives as r
    JOIN idalias as a on r.IDrelative = a.IDtext
	JOIN DNAmatches as m on ((r.IDrelative = m.ID1 AND m.ID2 = 'profile_ID') OR (r.IDrelative = m.ID2 AND m.ID1 = 'profile_ID') )
	WHERE r.IDprofile = 'profile_ID'
	GROUP BY a.IDTEXT
	ORDER BY m.pctshared DESC
	--limit 10;
	;