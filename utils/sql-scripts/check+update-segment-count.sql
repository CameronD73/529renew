select * from DNAmatches as m JOIN ibdsegs as s USING(ID1,ID2) where (m.hasSegs = 0 OR m.nsegs is null) and m.ishidden = 0;

STOP 'dont run this straight through without thinking first'
UPDATE DNAmatches as m set nsegs=nsegments, hasSegs=1 FROM 
		( SELECT ID1, ID2, count(*) as nsegments 
				FROM  DNAmatches as m JOIN ibdsegs as s USING(ID1,ID2) 
				WHERE (m.hasSegs = 0 OR m.nsegs is null) and m.ishidden = 0 
				GROUP BY ID1, ID2 ) as sj
		WHERE m.ID1 = sj.ID1 and m.ID2 = sj.ID2;

