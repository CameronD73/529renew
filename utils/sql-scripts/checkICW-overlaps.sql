SELECT a1.name as pname, a2.name as name2, a3.name as name3, chromosome, start, end, IDprofile, ID2, ID3 from ICWsets as i
	JOIN idalias as a1 on i.IDprofile = a1.idText
	JOIN idalias as a2 on i.ID2 = a2.idText
	JOIN idalias as a3 on i.ID3 = a3.idText
	WHERE chromosome = 0;