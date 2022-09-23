SELECT  ibdsegs.ROWID as ROWID,
	t1.name AS name1,
	t2.name AS name2,
	t1.id AS id1,
	t2.id AS id2,
	ibdsegs.chromosome AS chromosome,
	ibdsegs.start AS start,
	ibdsegs.end AS end,
	ibdsegs.cM AS cM,
	ibdsegs.snps AS snps 
FROM ibdsegs 
	JOIN idalias t1 ON (t1.idtext=ibdsegs.id1) 
	JOIN idalias t2 ON (t2.idtext=ibdsegs.id2 ) 
	JOIN ibdsegs t3 ON 	(ibdsegs.build=37  
		AND t3.build=37 
		AND t3.ROWID=2579
		AND (  	( 
			t3.chromosome=ibdsegs.chromosome 
			AND (	   (ibdsegs.start>=t3.start AND ibdsegs.end<=t3.end) 
				OR (ibdsegs.start<=t3.start AND ibdsegs.end>=t3.end) 
				OR (ibdsegs.start<=t3.start AND ibdsegs.end>=t3.start) 
				OR (ibdsegs.start<=t3.end AND ibdsegs.end>=t3.end) 
			) 
			) 
			-- OR ibdsegs.chromosome=100 
		) AND (  
				(t3.id1=ibdsegs.id1 ) 
			OR (t3.id1=ibdsegs.id2 ) 
			OR (t3.id2=ibdsegs.id1 )  
			OR (t3.id2=ibdsegs.id2 ) 
		) 
	)
ORDER BY chromosome, 
	ibdsegs.start, 
	ibdsegs.end DESC, 
	ibdsegs.ROWID, 
	julianday(t1.date)+julianday(t2.date), 
	t1.ROWID+t2.ROWID;
