create temporary table relrel as
SELECT 
	CASE WHEN IDprofile > IDrelative then IDrelative ELSE IDprofile END as ID1,
	CASE WHEN IDprofile < IDrelative then IDrelative ELSE IDprofile END as ID2,
	side
  from  DNARelatives; 
  
SELECT * from DNAmatches left join relrel using(ID1, ID2) where ishidden = 0;
  where side is null;

-- identify all the match pairs recorded both hidden and non-hidden.
Create temporary table hidnot as  
SELECT ID1, ID2, sum(ishidden) as shid, count(*) as nrow from DNAMatches group by ID1, ID2 having nrow > 1;

-- identify all the differences where matches are recorded both hidden and non-hidden.
Create temporary table hidnotvar as  
select ID1, ID2,
	h0.pctshared as pct, h1.pctshared as pct1, 0.1*(floor(10*(h0.pctshared-h1.pctshared))) as pctdiff,
	h0.cMtotal as cMtotal,  0.1*(floor(10*(h0.cMtotal-h1.cMtotal))) as cMdiff,
	h0.nsegs as nsegsh0, h1.nsegs as nsegsh1,
	a.name as name1,
	b.name as name2
 from
(select * from DNAmatches join hidnot using( ID1, ID2) where ishidden = 0) as h0
JOIN
(select * from DNAmatches join hidnot using( ID1, ID2) where ishidden = 1) as h1
using (ID1, ID2)
JOIN idalias as a on ID1 = a.idText
JOIN idalias as b on ID2 = b.idText ;

-- list suspicious variations...
select * from hidnotvar where nsegsh0 != nsegsh1 OR abs(cMdiff) > 0.5 OR abs(pctdiff) > 0.1;