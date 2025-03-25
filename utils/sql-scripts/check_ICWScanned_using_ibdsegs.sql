-- code to be run manually as a way to test what I will put into 529renew so
-- that I can update the values in ICWscanned to split those with segments and those without.
-- Should be performed on a copy of the DB.
-- assign the required ID to get the desired profile "limit 0,1" or "limit 1,1"
DROP  TABLE IF EXISTS thisprof;
CREATE TEMPORARY TABLE thisprof as  SELECT IDprofile from profiles limit 0,1;

DROP  TABLE IF EXISTS ProfPairs_chrn;
CREATE TEMPORARY TABLE ProfPairs_chrn as
SELECT i2, i3, count(*) as nsegs FROM (
	SELECT s.ID1 as i2, s.ID2 as i3, chromosome as chr, start from DNARelatives as r JOIN ibdsegs as s ON r.IDrelative = s.ID1
		WHERE IDprofile  in (SELECT IDprofile from thisprof)
	UNION
	SELECT s.ID2 as i2, s.ID1 as i3, chromosome as chr, start from DNARelatives as r JOIN ibdsegs as s ON r.IDrelative = s.ID2
		WHERE IDprofile  in (SELECT IDprofile from thisprof)
	) GROUP BY i2, i3
	 ORDER by i2, i3
;
CREATE INDEX prfpchr_2 on ProfPairs_chrn(i2);
CREATE INDEX prfpchr_3 on ProfPairs_chrn(i3);

DROP  TABLE IF EXISTS ProfPairs_zero;
CREATE TEMPORARY TABLE ProfPairs_zero as
SELECT i2, i3, count(*) as nsegs, count(chromosome) as nrownonnul from 
	( select ID3 as i3, ID2 as i2, chromosome, start FROM ICWSets where IDprofile in (SELECT IDprofile from thisprof)
		UNION
	  select ID2 as i3, ID3 as i2, chromosome, start FROM ICWSets where IDprofile in (SELECT IDprofile from thisprof)
	) WHERE chromosome = 0
	GROUP BY i2, i3
;
CREATE INDEX prfpz_2 on ProfPairs_zero(i2);
CREATE INDEX prfpz_3 on ProfPairs_zero(i3);


DROP  TABLE IF EXISTS ProfPairs_neg;
CREATE TEMPORARY TABLE ProfPairs_neg as
SELECT i2, i3, count(*) as nsegs, count(chromosome) as nrownonnul from 
	( select ID3 as i3, ID2 as i2, chromosome, start FROM ICWSets where IDprofile in (SELECT IDprofile from thisprof)
		UNION
	  select ID2 as i3, ID3 as i2, chromosome, start FROM ICWSets where IDprofile in (SELECT IDprofile from thisprof)
	) WHERE chromosome < 0
	GROUP BY i2, i3
;
CREATE INDEX prfpneg_2 on ProfPairs_neg(i2);
CREATE INDEX prfpneg_3 on ProfPairs_neg(i3);

-- for some reason there are matches with negatives as well as segment details.
SELECT i2, i3, n.ROWID as rowdel, s.nsegs as sns, n.nsegs as nns from ProfPairs_chrn as s JOIN ProfPairs_neg as n USING (i2, i3);
-- ignore the negatives
DELETE from ProfPairs_neg where 
	ROWID in (SELECT n.ROWID as rowdel from ProfPairs_chrn as s JOIN ProfPairs_neg as n USING (i2, i3));

DROP  TABLE IF EXISTS Prof_ICW_segs;
CREATE TEMPORARY TABLE Prof_ICW_segs as
    SELECT * from
		    ( SELECT i2, count(*) as nwithsegs from ProfPairs_chrn GROUP BY i2)  as s
		LEFT JOIN (SELECT i2, count(*) as natzero from ProfPairs_zero GROUP BY i2)  as z USING (i2)
		LEFT JOIN (SELECT i2, count(*) as nneg from ProfPairs_neg GROUP BY i2)  as n USING (i2)
		WHERE (nwithsegs > 10) OR (nwithsegs > 4 AND 2*nwithsegs > natzero)
		ORDER BY nwithsegs DESC;
        
CREATE INDEX prfpws on Prof_ICW_segs(i2);

-- check if the values look sensible...
SELECT * FROM DNARelatives as r JOIN Prof_ICW_segs as s ON IDrelative = i2 
	where IDprofile in (SELECT IDprofile from thisprof);

-- now update them
UPDATE DNARelatives	SET ICWscanned = CASE WHEN ICWscanned IS NULL THEN 2 ELSE (ICWscanned | 2 ) END
	FROM  Prof_ICW_segs 
	WHERE DNARelatives.IDrelative = Prof_ICW_segs.i2
		AND DNARelatives.IDprofile  in (SELECT IDprofile from thisprof);