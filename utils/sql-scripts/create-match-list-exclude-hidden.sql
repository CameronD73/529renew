-- get list of idalias people who have known segment matches
SELECT name, idText from  DNAmatches join idalias on (idText = ID1 OR idText = ID2)
where ishidden = 0
GROUP by idText
order by name;

