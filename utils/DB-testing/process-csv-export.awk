#	awk script to process export file from 529 and you (V2)
#	fills a V3 database that has already been created.

BEGIN	{
	FS = ","
	# set useIntKey =1 to generate ibdseg tables where tester is
	# keyed by rowid; or set to zero to use the UID text string.
	useIntKey = 0
	# set UseBlockTransactions to 1 to avoid autocommit each row.
	# set to zero to be closer to operation in JS.
	UseBlockTransactions = 0
	# name ID arrays
	# If we don't have a start element then the check  always is true!!
	# and we never build the array.
	nameArr[0] = "start"
	rowArr[0] = 0
	nextRow = 1
	# array of matches for listing at the end
	matchRow = 1
	mt_chr[0] = 0		# chromosome
	mt_start[0] = 0		# start address of segment (base pair)
	mt_stop[0] = 0		# end address of segment (base pair)
	mt_cm[0] = 0		# segment length in cM
	mt_snps[0] = 0		# number of SNPs
	mt_id1[0] = ""		# UUID of person 1
	mt_id2[0] = ""		# UUID of person 2

	today =  strftime( "%Y-%m-%d", systime() )
}

NR > 1	{
	if (NF != 14 ){
		printf "unexpected line with %d fields:\n     %s\n", NF, $0
	}
	name1 = $1
	name2 = $2
	ID1 = $8
	ID2 = $9
	# nameArr is indexed by the GUID key of the individual. This ensures we do not
	# duplicate the person.
	if ( !ID1 in nameArr ) {
		nameArr[ ID1 ] = name1
		rowArr[ ID1 ] = nextRow++
	}
	if ( !ID2 in nameArr ) {
		nameArr[ ID2 ] = name2
		rowArr[ ID2 ] = nextRow++
	}
	if ( rowArr[ID1] > rowArr[ID2] ) {
		temp = ID2
		ID2 = ID1
		ID1 = temp
	}
	if( $3 == "X" )
		mt_chr[matchRow] = 23
	else
		mt_chr[matchRow] = $3
	mt_start[matchRow] = $4
	mt_stop[matchRow] = $5
	mt_cm[matchRow] = $6
	mt_snps[matchRow] = $7
	mt_id1[matchRow] = ID1
	mt_id2[matchRow] = ID2
	matchRow ++
}	

END	{
	#printf " name arr has %d unique person records\n", length(nameArr)
	printf "PRAGMA journal_mode=WAL;\nPRAGMA synchronous=OFF;\nPRAGMA synchronous;\n"
	printf "select 'alias', max(rowid) from idalias UNION select 'segs', max(rowid) from ibdsegs union select 'time', time();\n"
	if( UseBlockTransactions ) {
		printf "BEGIN TRANSACTION;\n"
	}
	for (id in nameArr) {
		if ( id != "0" ) {
			printf "INSERT or IGNORE INTO idalias (idText, name, `date` ) VALUES (\"%s\", \"%s\", \"%s\");\n",
				id, nameArr[id] , today 
		}
	}
	if( UseBlockTransactions ) {
		printf "COMMIT;\n"
	}
	printf "select 'alias', max(rowid) from idalias UNION select 'segs', max(rowid) from ibdsegs union select 'time', time();\n"
	if( UseBlockTransactions ) {
		printf "BEGIN TRANSACTION;\n"
	}
	for (id = 1 ; id < matchRow ; id++) {
		if( UseBlockTransactions ) {
			if ( id % 100 == 0 ) {
				printf "COMMIT;\n"
				printf "BEGIN TRANSACTION;\n"
			}
		}
		if ( useIntKey == 0) {
			printf "INSERT or IGNORE INTO ibdsegs ( id1, id2, chromosome, start, end, cM, snps, `date` )\n"
			printf " VALUES ( '%s', '%s', %d,  %d,  %d,  %.3f,  %d,  '%s' );\n",
						mt_id1[id], mt_id2[id], mt_chr[id], mt_start[id], mt_stop[id], mt_cm[id], mt_snps[id], today
		} else {
			printf "INSERT or IGNORE INTO ibdsegs ( id1, id2, chromosome, start, end, cM, snps, `date` )\n"
			printf "    SELECT b.id as id1, c.id as id2, chr, start, stop, cM, snps, date() as `date`\n"
			printf "  	FROM (SELECT  %d as chr, %d as start, %d as stop, %.2f as cM, %d as snps) as a\n",
						mt_chr[id], mt_start[id], mt_stop[id], mt_cm[id], mt_snps[id]
			printf "	join (SELECT id FROM idalias WHERE idtext = \"%s\" ) as b\n", mt_id1[id]
			printf "	join (SELECT id FROM idalias WHERE idtext = \"%s\") as c ;\n", mt_id2[id]
		}
	}
	if( UseBlockTransactions ) {
		printf "COMMIT;\n"
	}
	printf "select 'alias', max(rowid) from idalias UNION select 'segs', max(rowid) from ibdsegs union select 'time', time();\n"

	#reset defaults
	printf "PRAGMA journal_mode = DELETE;\nPRAGMA synchronous=FULL;\n"

}
