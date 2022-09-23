SELECT  ibdsegs.ROWID as ROWID,
	t1.name AS name1,
	t2.name AS name2,
	t1.id_1 AS id1_1,
	t1.id_2 AS id1_2,
	t2.id_1 AS id2_1,
	t2.id_2 AS id2_2,
	ibdsegs.chromosome AS chromosome,
	ibdsegs.start AS start,
	ibdsegs.end AS end,
	ibdsegs.centimorgans AS cM,
	ibdsegs.snps AS snps 
FROM ibdsegs 
	JOIN idalias t1 ON (t1.id_1=ibdsegs.id1_1 AND t1.id_2=ibdsegs.id1_2) 
	JOIN idalias t2 ON (t2.id_1=ibdsegs.id2_1 AND t2.id_2=ibdsegs.id2_2) 
	JOIN ibdsegs t3 ON 	(ibdsegs.build=37  
		AND t3.build=37 
		AND t3.ROWID=23 
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
				(t3.id1_1=ibdsegs.id1_1 AND t3.id1_2=ibdsegs.id1_2) 
			OR (t3.id1_1=ibdsegs.id2_1 AND t3.id1_2=ibdsegs.id2_2) 
			OR (t3.id2_1=ibdsegs.id1_1 AND t3.id2_2=ibdsegs.id1_2)  
			OR (t3.id2_1=ibdsegs.id2_1 AND t3.id2_2=ibdsegs.id2_2) 
		) 
	)
ORDER BY chromosome, 
	ibdsegs.start, 
	ibdsegs.end DESC, 
	ibdsegs.ROWID, 
	julianday(t1.date)+julianday(t2.date), 
	t1.ROWID+t2.ROWID;
