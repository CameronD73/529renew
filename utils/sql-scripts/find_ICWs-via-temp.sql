
SELECT s1.id1 as id1, s1.id2 as id2, s3.id2 as id3;
CREATE temporary table wx3 as
SELECT * from ibdsegs
		WHERE id1 in ('replace_ID1','replace_ID2' ) 
		AND id2 in ('replace_ID2', 'replace_ID3');

drop table wab; wac;		
		
CREATE temporary table wab as SELECT * from ibdsegs where id1 = 'replace_ID1' and id2 = 'replace_ID2';

CREATE temporary table wac as
SELECT * from ibdsegs where id1 = 'replace_ID1' and id2 = 'replace_ID3';

CREATE temporary table wbc as
SELECT * from ibdsegs where id1 = 'replace_ID2' and id2 = 'replace_ID3';

SELECT ww.chr as chr,  case when ww.startolap < wbc.start then wbc.start else ww.startolap end as startolap,
	case when ww.endolap < wbc.end then ww.endolap else wbc.end end as endolap
	FROM
(select wab.chromosome as chr, case when wab.start < wac.start then wac.start else wab.start end as startolap,
	case when wab.end < wac.end then wab.end else wac.end end as endolap
 from wab join wac ON wab.chromosome = wac.chromosome AND (wab.start between wac.start and wac.end or wac.start between wab.start and wab.end)
) as ww JOIN wbc  ON chr = wbc.chromosome AND (wbc.start between ww.startolap and ww.endolap or wbc.start between ww.startolap and ww.endolap)