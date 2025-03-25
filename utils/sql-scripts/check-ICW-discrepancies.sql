-- NOTE - at the moment these don't work well in combination of old recorded segments and new ICW (2024 scanning)
-- as we have added chromosome = -2 for those times where 23andMe hides all segment data.

-- look at discrepancies between 3-way and 2-way ICW tables..
-- if w3 chr = -1 then we have not yet checked the ID2-ID3 segments
-- id w3.chr = 0 then there should be precise 1:1 correspondence, but the left join is done to show problems (where w2.chr is null)

select a1.name, a2.name, a3.name, w3.chromosome as chr3,w2.chromosome as chr2, w2.start*0.000001 as start, w2.end*0.000001 as end, IDprofile, ID2, ID3
from ICWsets as w3 LEFT JOIN ICWSets2way as w2 USING( IDprofile, ID2, ID3)
JOIN idalias as a1 on w3.IDprofile = a1.IDText
JOIN idalias as a2 on w3.ID2 = a2.IDText
JOIN idalias as a3 on w3.ID3 = a3.IDText
		WHERE w3.chromosome = 0
			and w2.chromosome is  NULL;

-- should be zero rows returned here
select IDprofile, ID2, ID3, count(*) as nrows from ICWsets as w3 WHERE w3.chromosome < 1
		GROUP BY IDprofile, ID2, ID3 HAVING nrows > 1;
