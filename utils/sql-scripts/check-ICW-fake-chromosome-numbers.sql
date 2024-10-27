
-- Over the development, I have acquired tables with special chromosome numbers of 0, -1 and -2.

-- check for any completely wrong values - fake chromosomes must have zero start/end
select * from ICWsets where chromosome < 1 and (start != 0 or end != 0);

create temporary table fakesets as
SELECT IDprofile, ID2, ID3, count(*) as num, group_concat(chromosome) as gc, min(chromosome) as minch, max(chromosome) as maxch,
	a2.name as name2, a3.name as name3
	from ICWSets as s
	JOIN idalias as a2 on (s.ID2 = a2.IDtext)
	JOIN idalias as a3 on (s.ID3 = a3.IDtext)
	WHERE chromosome < 1
	GROUP BY IDprofile, ID2, ID3
	ORDER by num DESC;
	
select * from fakesets where num > 1 and maxch < 0;