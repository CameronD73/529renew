/*
** database I/O routines.
** These routines communicate directly with the DB, not via message passing
** Should be preceeded by database_init.js
*/

/*  eslint-disable no-unused-vars */
"use strict";

db_conlog( 2, "loading WebSQL DB_IO script");


/*
********************************************************
* the following group of functions read from the database
********************************************************
*/
function migIDQueryFailed(trans, error ) {
	let msg = `migrate idalias call failed with ${error.message}`;
	db_conlog( 1, msg );
	alert( msg );
}
function migSegFailed(trans, error ) {
	let msg = `migrate segment info failed with ${error.message}`;
	db_conlog( 1, msg );
	alert( msg );
}

function newset( newmap, sqlresults ) {
	for( let i = 0; i < sqlresults.length; i++) {
		newmap.set( i, sqlresults[i]);
	}
}

// prepare DNArelatives entries. Input id1 and id2 are in sort order, so we need to ensure that the profile ID is first.
function newsetRels( newmap, sqlresults ) {
	const proflist = [];
	for( let p=0; p < profile_summary.length; p++) {
		proflist[p] = profile_summary[p].IDprofile;
	}
	for( let i = 0; i < sqlresults.length; i++) {
		let o = sqlresults[i];
		if ( proflist.indexOf( o.id1 ) < 0 ){
			// id1 id not a profile - need to swap.
			let temp = o.id2;
			o.id2 = o.id1;
			o.id1 = temp;
			if ( proflist.indexOf( temp ) < 0 ) {
				console.error( `newsetRels: Neither ${o.id1} nor ${o.id2} are profile IDs.`)
			}
		}
		newmap.set( i, o);
	}
}

let need_webSQL_profile = true;

function  createWebsqlprofiles(  ) {
	/*
	function makeTransaction( ){

		return function(transaction){
			let qry = 'CREATE TABLE IF NOT EXISTS profiles ("IDprofile"	TEXT, "pname" TEXT NOT NULL, PRIMARY KEY("IDprofile"))';
			transaction.executeSql(qry, []);
		};
	} */
	if ( !need_webSQL_profile )
		return;
	need_webSQL_profile = false;		// only do it once.
	db23.transaction( 
        function (transaction) {
			let qry = 'CREATE TABLE IF NOT EXISTS profiles (IDprofile TEXT NOT NULL UNIQUE, pname TEXT NOT NULL, PRIMARY KEY(IDprofile))';
			db_conlog( 1, `executing webSQL stmt ${qry}`);
			transaction.executeSql(qry, []);
		},
		function (err) {
			let msg = `Create WebSQL profile failed: ${err.message}`;
			db_conlog( 0, msg );
			alert( msg );
		 },
		saveWebsqlprofiles
	);
}

function  saveWebsqlprofiles(  ) {
	
	function makeTransaction( idobj){

		return function(transaction){
			transaction.executeSql('INSERT OR IGNORE into profiles ( IDprofile, pname ) VALUES (?, ?);',[idobj.IDprofile, idobj.pname] );
		};
	}
	for(let i=0; i<profile_summary.length; i++){
		let row = profile_summary[i];
		db23.transaction(makeTransaction( row ), insertRowFail_websql, insert_OK_websql );
	}
}

// get the adalias table for migration
function  getWebsqlAliasTable( ) {
	
	db23.readTransaction(  
		function(transaction){
			transaction.executeSql('SELECT idText as k, name  from idalias',[], processWebsqlAliasTable, migIDQueryFailed );
		}
	);
}

function processWebsqlAliasTable(transaction, resultSet){
	if(resultSet.message){
		alert("get old Alias Table: Failed to retrieve  data: "+ resultSet.message);
		return;
	}
	let msg = `ID table has ${resultSet.rows.length} rows `;
	console.log( msg );
	logHtml( '', msg );

	// the SQLResultSetRowList is not iterable nor clonable, so cannot be passed to the worker, need to transmogrify it
	let wat = new Map();
	newset( wat, resultSet.rows);
	console.log( `newset returned ${wat.size} rows` );

	DBworker.postMessage( {reason:'migrateWebSQLAlias', sqlres: wat, useReplace:false } );
	return;
}

function  getWebsqlFULLSegsTable( ) {
	function makeTransaction( callBackSuccess, callBackFailed){

		return function(transaction){
			// this query gets a close approximation to the full-IBD segments that were overlapping.
			const qry_fullibd = 'select  id1, id2,  chromosome,	sa.start as start,  sa.end as end,  \
					sa.cM as cM,  sa.snps as snps, sa._rowid_ as rowa \
				FROM ibdsegs as sa  JOIN ibdsegs as sb USING (id1, id2, chromosome ) \
				WHERE sa._rowid_ != sb._rowid_ \
					AND chromosome < 50 \
					AND  ( ( sa.start BETWEEN sb.start and sb.end  AND sa.snps <= sb.snps ) \
						OR ( sa.end BETWEEN sb.start and sb.end AND sa.snps < sb.snps ) );'

			transaction.executeSql( qry_fullibd,[], callBackSuccess, callBackFailed);
		};
	}
	db23.readTransaction(makeTransaction( processWebsqlFULLSegsTable, migSegFailed));
}

function processWebsqlFULLSegsTable(transaction, resultSet){
	if(resultSet.message){
		alert("get old IBDsegs Table: Failed to retrieve  data: "+ resultSet.message);
		return;
	}
	let msg =  `Have read ${resultSet.rows.length} Full identical segments `;
	console.log( msg );
	logHtml( '', msg );

	let wat = new Map();
	newset( wat, resultSet.rows);
	// console.log( `newset returned ${wat.size} rows` );

	DBworker.postMessage( {reason:'migrateWebSQLFULLSegs', sqlres: wat, useReplace:false } );
	return;
}

function  getWebsqlHALFSegsTable( ) {
	
	function makeTransaction( callBackSuccess, callBackFailed){

		return function(transaction){
			// query to select all except those tagged as full-ibd
			let qry = 'SELECT id1, id2, chromosome, start, end, cM, snps, date from ibdsegs where chromosome < 50 AND _rowid_ not in ' +
					'( select  sa._rowid_ as rownum from ibdsegs as sa JOIN ibdsegs as sb USING (id1, id2, chromosome )' +
						'WHERE sa._rowid_ != sb._rowid_	AND chromosome < 50 '+
					   'AND  ( ( sa.start BETWEEN sb.start and sb.end  AND sa.snps <= sb.snps ) '+
						   'OR ( sa.end BETWEEN sb.start and sb.end AND sa.snps < sb.snps ) ) );';
			transaction.executeSql( qry,[], callBackSuccess, callBackFailed);
		};
	}
	logHtml( '', 'Reading main segment table..');
	db23.readTransaction(makeTransaction( processWebsqlSegsTable, migSegFailed));
}

function processWebsqlSegsTable(transaction, resultSet){
	if(resultSet.message){
		alert("get old IBDsegs Table: Failed to retrieve  data: "+ resultSet.message);
		return;
	}
	let msg =  `Have read ${resultSet.rows.length} other ibd segments `;
	console.log( msg );
	logHtml( '', msg );

	let wat = new Map();
	newset( wat, resultSet.rows);
	console.log( `newset returned ${wat.size} rows` );

	DBworker.postMessage( {reason:'migrateWebSQLSegs', sqlres: wat, useReplace:false } );
	return;
}

let chr200rels = new Map();
let chr200mats = new Map();

function  getWebsqlchr200_rels( ) {

	logHtml( '', 'Reading hidden rels..');
	db23.readTransaction( 
		function(transaction){
			let qry = 'select ID1, ID2, end as hidden, snps * 0.001 as pctshared, snps * 0.0744 as cMtotal, 0 as hasSegs from ibdsegs \
				WHERE chromosome > 150 AND (  id1 in (select IDprofile from profiles) OR  id2 in (select IDprofile from profiles)) \
				group by ID1, ID2;';
			transaction.executeSql( qry,[], processWebsqlchr200_rels, migSegFailed);
		}
	);
}

function processWebsqlchr200_rels(transaction, resultSet){
	if(resultSet.message){
		alert("get chr200 Table: Failed to retrieve  data: "+ resultSet.message);
		return;
	}
	let msg =  `Have read ${resultSet.rows.length} hidden DNA relatives `;
	console.log( msg );
	logHtml( '', msg );

	newsetRels( chr200rels, resultSet.rows);	// save for later
	console.log( `newset returned ${chr200rels.size} rows` );
	getWebsqlchr200_mats();
	//DBworker.postMessage( {reason:'migrateWebSQLSegs', sqlres: chr200rels, useReplace:false } );
	return;
}

function  getWebsqlchr200_mats( ) {
	
	logHtml( '', 'Reading hidden matches..');

	db23.readTransaction( 
		function(transaction){
			let qry = 'SELECT  ID1, ID2,  end as hidden, snps * 0.001 as pctshared, snps * 0.0744 as cMtotal, 0 as hasSegs \
					FROM ibdsegs  WHERE chromosome > 150 GROUP by ID1, ID2;';
			transaction.executeSql( qry,[], processWebsqlchr200_mats, migSegFailed);
		}
	);
}

function processWebsqlchr200_mats(transaction, resultSet){
	if(resultSet.message){
		alert("get chr200 Table: Failed to retrieve  data: "+ resultSet.message);
		return;
	}
	let msg =  `Have read ${resultSet.rows.length} hidden ibd segments `;
	console.log( msg );
	logHtml( '', msg );

	newset( chr200mats, resultSet.rows);	// save for later
	console.log( `newset returned ${chr200mats.size} rows` );

	DBworker.postMessage( {reason:'migrateWebSQLchr200', sqlres1: chr200rels,  sqlres2: chr200mats, useReplace:false } );
	return;
}


/* ***********************************************************************************************
**** ================================   the following needs wasm  replacement 
***********************************************************************************************/
// id1 and id2 are the text representation of the 23 and me UID
// It requests count of segment hits between ID1 and ID2 that are saved in the DB.
//     This includes the fake "chromosome 100" record, but not the fake chr 200 record.

function countMatchingSegments(id1, id2, upgradeIfNeeded, upgradeQueryFailed){
	

	function makeTransaction(id1, id2, callBackSuccess, callBackFailed){
		// Don't query matches with self. Not sure I understand this because then neither callback is fired off.
		if(id1 == id2) return; 
		var firstid = id1;
		var secondid = id2;
		if(id1 > id2){
			firstid = id2;
			secondid = id1;
		}
		db_conlog( 4, `requesting select on id1= ${firstid} and id2= ${secondid}`);
		return function(transaction){
			transaction.executeSql('SELECT id1, id2, COUNT(ROWID) AS hits from ibdsegs WHERE id1=? AND  id2=? AND chromosome < 150 ',[firstid, secondid], callBackSuccess, callBackFailed);
		};
	}
	db_conlog( 4, `   dbREAD ${id1} vs ${id2}` );
	db23.readTransaction(makeTransaction(id1, id2, upgradeIfNeeded, upgradeQueryFailed));
}

const sellist1 = "ibdsegs.ROWID as ROWID,\
	t1.name AS name1,\
	t2.name AS name2,\
	t1.idText AS id1,\
	t2.idText AS id2,\
	ibdsegs.chromosome AS chromosome,\
	ibdsegs.start AS start,\
	ibdsegs.end AS end,\
	ibdsegs.cM AS cM,\
	ibdsegs.snps AS snps,\
	ibdsegs.date as segdate";

const joinlist = "ibdsegs \
	JOIN idalias t1 ON (t1.idText=ibdsegs.id1 ) \
	JOIN idalias t2 ON (t2.idText=ibdsegs.id2 ) \
	JOIN ibdsegs t3 ON 	( \
		t3.ROWID=? \
		AND (  	( \
				t3.chromosome=ibdsegs.chromosome \
				AND (ibdsegs.start<=(t3.end-?) AND ibdsegs.end>=(t3.start+?)) \
			) \
			OR ibdsegs.chromosome=100 \
		) AND (  \
				(t3.id1=ibdsegs.id1) \
			OR (t3.id1=ibdsegs.id2 ) \
			OR (t3.id2=ibdsegs.id1 )  \
			OR (t3.id2=ibdsegs.id2 ) \
			) \
		)";

const orderlist = "chromosome, \
	ibdsegs.start, \
	ibdsegs.end DESC, \
	ibdsegs.ROWID, \
	julianday(t1.date)+julianday(t2.date), \
	t1.ROWID+t2.ROWID";

/*
** returns a table of all segment matches that overlap the one specified by
** input parameter segmentId (which is a ROWID value)
*/
function selectSegmentMatchesFromDatabase(callbackSuccess, segmentId){
	const sel_short=`SELECT ${sellist1} FROM ${joinlist} ORDER BY ${orderlist}`;
	// convert base addr to MBase address.
	const overlapParam = 1000000 * getSetting( "minimumOverlap" );
	db_conlog( 3, `selectSegmentMatchesFromDatabase: select stmt is: ${sel_short}`);
	function makeTransaction(callback){
		return function(transaction){
			transaction.executeSql( sel_short, [segmentId,overlapParam,overlapParam], callback, callback);
		};
	}
	db23.readTransaction(makeTransaction(callbackSuccess));
}

function getSegsFailed( trans, error ) {
	db_conlog(1, `selectFromDB failed: ${error.message}`);
	alert( `DB get seg FAILED: ${error.message}`);
}
/*
** Queries for matches
** this returns the rows of segment data suitable for subsequent processing
** either as display on page or save to csv or gexf files.
** - in: id, either the 16-char UID string, or
**			 "All" for when we ask to export the entire DB.
** if limitDates is true then we only select those newer than previous save.
*/
function selectFromDatabase(callbackSuccess, id, chromosome, limitDates, includeChr100){

	var lowerBound=0;
	var upperBound=24;
	var chrNum=parseInt(chromosome);
	if(chrNum>0){
		lowerBound=chrNum-1;
		upperBound=chrNum+1;
	}
	function makeTransaction(callback, limitDates, includeChr100){
		// create export table for entire DB
		const qry_sel = 'SELECT \
				ibdsegs.ROWID as ROWID, \
				t1.name AS name1, \
				t2.name AS name2, \
				t1.idText AS id1, \
				t2.idText AS id2, \
				chromosome, start, end, cM, snps, \
				ibdsegs.date as segdate \
			FROM ibdsegs \
			JOIN idalias t1 ON (t1.idText=ibdsegs.id1) \
			JOIN idalias t2 ON (t2.idText=ibdsegs.id2)  WHERE ';
		//const qry_build = ' build=?  AND ';
		const qry_cond = '(chromosome>? AND chromosome<?) ';
		const qry_cond100 = '((chromosome>? AND chromosome<?) OR chromosome >= 100) ';
		const qry_order = '	ORDER BY chromosome, start, end DESC, ibdsegs.ROWID, julianday(t1.date)+julianday(t2.date), t1.ROWID+t2.ROWID;';
		// convert to julianday to do a floating point comparison rather than string
		const qry_date = 'AND julianday(ibdsegs.date) >= julianday((SELECT value from settings where setting = "lastCSVExportDate"))'
		var query;
		if ( includeChr100 )
			query = qry_sel + qry_cond100;
		else
			query = qry_sel + qry_cond;
		if( limitDates )
			query += qry_date;
			
		query += qry_order;
		db_conlog(3, `query = ${query} with params ${lowerBound} and ${upperBound}`);
		return function(transaction){
			//transaction.executeSql( query, [build, lowerBound, upperBound], callback, getSegsFailed);
			transaction.executeSql( query, [lowerBound, upperBound], callback, getSegsFailed);
		};
	}

	function makeTransactionWithId(callback, id, limitDates, includeChr100){

		const qry_sel = 'SELECT \
				ibdsegs.ROWID as ROWID, \
				t1.name AS name1, \
				t2.name AS name2, \
				t1.idText AS id1, \
				t2.idText AS id2, \
				chromosome, start, end, cM, snps, \
				ibdsegs.date as segdate  \
			FROM ibdsegs \
			JOIN idalias t1 ON (t1.idText=ibdsegs.id1) \
			JOIN idalias t2 ON (t2.idText=ibdsegs.id2) \
			WHERE ((ibdsegs.id1=?) OR (ibdsegs.id2=?)) ';
		// const qyr_build = 'AND build=? ';
		const qry_cond = 'AND chromosome>? AND chromosome<? ';
		const qry_cond100 = 'AND ((chromosome>? AND chromosome<?) OR chromosome >= 100) ';
		const qry_order = '	ORDER BY chromosome, start, end DESC, ibdsegs.ROWID, julianday(t1.date)+julianday(t2.date), t1.ROWID+t2.ROWID;';
		const qry_date = 'AND julianday(ibdsegs.date) >= julianday((SELECT value from settings where setting = "lastCSVExportDate"))'
		var query;

		if ( includeChr100 )
			query = qry_sel + qry_cond100;
		else
			query = qry_sel + qry_cond;
		if( limitDates )
			query += qry_date;
			
		query += qry_order;

		db_conlog( 3, `query = ${query} with params ${id}, ${lowerBound} and ${upperBound}`);
		return function(transaction){
			transaction.executeSql(query, [id, id, lowerBound, upperBound], callback, getSegsFailed);
		};
	}
	if(id.length<16){
		// assume this is the "ALL" option
		db23.readTransaction(makeTransaction(callbackSuccess, limitDates, includeChr100));
	}
	else db23.readTransaction(makeTransactionWithId(callbackSuccess, id, limitDates, includeChr100));
}


/*
********************************************************
* the following functions write to the database
********************************************************
*/

function importRowSuccess( ) {
	decrementPendingTransactionCount( );
	if ( (pendingTransactionCount % 100) == 1 )
		db_conlog( 1, `       ${pendingTransactionCount} segments remaining`);
}

function importRowFail( error ) {
	db_conlog( 1, `Import transact failed: ${error.message}`);
	alert( `INSERT FAILED: ${error.message}`);
	decrementPendingTransactionCount();
}
// Put data from 529 export (without phase) into database
// Completely redid this, because we needed to get the key values from idalias creation
// in order to feed the ibdsegs. Then I changed my mind 
// 1. scan entire file and split into testers (alias) and segments
// 2. insert/update alias values and retrieve ID key values
// 3. insert/update segments   Should we check for overlaps where perhaps 23 and me have recalculated endpoints?

// lineList is an array with the full text from the file - one line per array row
// nFields may be 9 (normal export) or 14 (exported with full phase, etc details)
function import529CSV(lineList, nFields, callback){

	if(!lineList) return;
	const aliasmap = new Map();
	const matchesmap = new Map();
	const today = formattedDate2();
	
	pendingTransactionCount=1;		// ensure it does not trigger callback until finished
	noPendingTransactionCallBack=callback;
	
	// Store the names and ids of the matches
	function makeIdAliasTransaction(guid, username, date, comment){
		let idtext = guid;
		let name = username;
		let today = date;
		var arr = [idtext, name, today, comment];
		//db_conlog( 22, ` in makealiastrans, array ${arr.length} items, type: ${typeof(arr)}, 2nd elem is ${arr[1]}`);

		return function(transaction){
			transaction.executeSql( 'INSERT or IGNORE INTO idalias ( idText, name, "date", "comment" ) VALUES(?, ?, ?, ? );', arr );
		};
	}
	// Store the matching segments
	// id1 and 2 are the string UUIDs. 
	function makeMatchingSegmentTransaction(id1, id2, chromosome, start, end, centimorgans, snps, date){
		let today = date;
		let firstID = id1;
		let secondID = id2;
		if( id1 > id2 ) {
			// always store lowest first (necessary to allow uniqueness constraints to work)
			//db_conlog( 23, `    Segments: swapping order: ${id2} then  ${id1}`);
			firstID = id2;
			secondID = id1;
		}
		// else
			// db_conlog( 23, `    Segments:  order: ${firstID} then  ${secondID}`);
		const qry1 = 'INSERT or IGNORE INTO ibdsegs ( id1, id2, chromosome, start, end, cM, snps, "date", build )VALUES(?,?,?,?,?,?,?,?,?);';
		
		return function(transaction){
			transaction.executeSql( qry1, [firstID, secondID, chromosome, start, end, centimorgans, snps, today, current23andMeBuild]);
		};
	}
	/* first process every line, getting all testers, and sets of matching pairs
	*/
	// i=0 is header row (skip)
	for(let i=1; i< lineList.length; i++){
		var entry=lineList[i].split(',');
		if(entry.length <= 1 )
			continue;		// ignore trailing blank line
		if(entry.length!=nFields){
			let errmsg = `Unexpected line with ${entry.length} fields (expected ${nFields}). Line number ${i}:` + lineList[i];
			console.log( errmsg);
			alert( errmsg );
			continue;
		}
		var firstName=entry[0];
		var firstID=entry[7];
		var secondName=entry[1];
		var secondID=entry[8];
		var cmnt = (nFields == 14 ? entry[13] : "");
		// add to alias name table, including space for the autoincrement ID to be determined later.
		if( !aliasmap.has(firstID)) {
			aliasmap.set(firstID, {name:firstName, id: 0, comment: cmnt });
		}
		else {
			// previous version had comment on each segment, but not on tester.
			// this version reverses that, so just append them all (unless they are duplicates)
			if ( cmnt !== "" && aliasmap.get(firstID).comment !== cmnt ) {
				aliasmap.get(firstID).comment += cmnt;
			}
		}

		if( !aliasmap.has(secondID)) {
			aliasmap.set(secondID, {name:secondName, id: 0, comment: cmnt });
		}
		else {
			if ( cmnt !== "" && aliasmap.get(secondID).comment !== cmnt  ) {
				aliasmap.get(secondID).comment += cmnt;
			}
		}
		if ( firstID > secondID ) {
			let temp = secondID;
			secondID = firstID;
			firstID = temp;
		}
		let matchkey = firstID + secondID;
		if( !matchesmap.has( matchkey ) ) {
			matchesmap.set( matchkey, {id1: firstID, id2: secondID, cMtotal : 0.0} );
		}
		if( entry[2] != "100" ) {
			let cM=parseFloat(entry[5]);
			matchesmap.get( matchkey).cMtotal += cM;
		}
	}
	// db_conlog( 21, `  adding ${aliasmap.size} alias rows`);
	// add all the unique keys and names to the alias table
	for( const[key, obj] of aliasmap ) {
		pendingTransactionCount++;
		db_conlog( 2, `    inserting ${obj.name} (ID: ${key})`)
		db23.transaction(makeIdAliasTransaction(key, obj.name, today, obj.comment), importRowFail, importRowSuccess);
	}
	db_conlog( 1, `adding ${lineList.length} segment rows. This will take a while...`);
	// Now reprocess the list and save the matched segments
	for(let i=1; i< lineList.length; i++){
		var entry=lineList[i].split(',');
		if(entry.length!=nFields){
			continue;		// have already warned user in the first pass
		}
		
		firstID=entry[7];
		secondID=entry[8];
		var entryChromosome;
		if(entry[2]==="X") 
			entryChromosome=23;
		else
			entryChromosome=entry[2];
		if ( entryChromosome < 50 ) {
			// the chromosome 100 fakes will be handled later...
			var entryStart=entry[3];
			var entryEnd=entry[4];
			var entrycM = round_cM( entry[5] );
			var entrySNPs=entry[6];

			pendingTransactionCount++;
			db23.transaction(makeMatchingSegmentTransaction(firstID, secondID, entryChromosome, entryStart, entryEnd, entrycM, entrySNPs, today), importRowFail, importRowSuccess);
		}
	}
	db_conlog( 1, `adding ${matchesmap.size} chr 100 rows`);
	for( const[key, obj] of matchesmap ) {
		pendingTransactionCount++;
		let cM = round_cM(obj.cMtotal);
		db23.transaction(makeMatchingSegmentTransaction(obj.id1, obj.id2, 100, -1, -1, cM, 0, today), importRowFail, importRowSuccess);
	}
	// now account for the initial value and eventually trigger callback..
	decrementPendingTransactionCount();

}

function deleteAllDataWebSQL(callbackSuccess){
	if(confirm("Delete all data stored in your OLD 529Renew local database?\nHave you checked data migration?")){
		db23.transaction(
			function(transaction) {
				transaction.executeSql("DELETE from ibdsegs",[]);		// this is sqlite's TRUNCATE equivalent
				transaction.executeSql("DELETE from idalias",[]);
			}, function(){alert("Failed to delete data stored in 529Renew local database");}, callbackSuccess
		);
	}
}
