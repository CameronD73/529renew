-- have to run this on old webSQL db to extract chr200 then import to new db in DNArelativess table
drop table if exists temprel200;
create temporary table temprel200 as ;
SELECT  ID1, ID2,  end as hidden, snps * 0.001 as pctshared, snps * 0.0744 as cMtotal, 0 as hasSegs from ibdsegs
	WHERE chromosome > 150 group by ID1, ID2 ORDER by ID1, ID2
	;

select * from temprel200    ;


-- INSERT OR IGNORE into DNArelatives (IDprofile, IDrelative)  SELECT ID1, ID2  from temprel200 where chr <50 ;