/*
** database I/O routines.
** These routines communicate directly with the DB, not via message passing
** Should be preceeded by database_init.js
*/

/*  eslint-disable no-unused-vars */
"use strict";

db_conlog( 0, "loading DB_results script");


/*
********************************************************
* the following group of functions read from the database
********************************************************
*/

// id1 and id2 are the text representation of the 23 and me UID
// It requests count of segment hits that are saved between ID1 and ID2.
//     This includes the fake "chromosome 100" record.
function countMatchingSegments(id1, id2, upgradeIfNeeded, upgradeQueryFailed){

	function makeTransaction(id1, id2, callBackSuccess, callBackFailed){
		// Don't query matches with self. Not sure I understand this because neither callback is fired off.
		if(id1 == id2) return; 
		if(id1 > id2){
			firstid = id2;
			secondid = id1;
		}
		else {
			firstid = id2;
			secondid = id1;
		}
		return function(transaction){
			transaction.executeSql('SELECT id1, id2, COUNT(ROWID) AS hits from ibdsegs WHERE id1=? AND  id2=?  AND build=?',[firstid, secondid, current23andMeBuild], callBackSuccess, callBackFailed);
		};
	}
	db_conlog( 2, `   dbREAD ${id1} vs ${id2}` );
	db23.readTransaction(makeTransaction(id1, id2, upgradeIfNeeded, upgradeQueryFailed));
}

const sellist1 = "ibdsegs.ROWID as ROWID,\
	t1.name AS name1,\
	t2.name AS name2,\
	t1.id AS id1,\
	t2.id AS id2,\
	ibdsegs.chromosome AS chromosome,\
	ibdsegs.start AS start,\
	ibdsegs.end AS end,\
	ibdsegs.cM AS cM,\
	ibdsegs.snps AS snps";

const sellist2 = "	ibdsegs.phase1 AS phase1,\
	ibdsegs.relationship1 AS relationship1,\
	ibdsegs.phase2 AS phase2,\
	ibdsegs.relationship2 AS relationship2,\
	ibdsegs.comment AS comment";

const joinlist = "ibdsegs \
	JOIN idalias t1 ON (t1.id=ibdsegs.id1 ) \
	JOIN idalias t2 ON (t2.id=ibdsegs.id2 ) \
	JOIN ibdsegs t3 ON 	(ibdsegs.build=?  \
		AND t3.build=? \
		AND t3.ROWID=? \
		AND (  	( \
			t3.chromosome=ibdsegs.chromosome \
			AND (  (ibdsegs.start>=t3.start AND ibdsegs.end<=t3.end) \
				OR (ibdsegs.start<=t3.start AND ibdsegs.end>=t3.end) \
				OR (ibdsegs.start<=t3.start AND ibdsegs.end>=t3.start) \
				OR (ibdsegs.start<=t3.end AND ibdsegs.end>=t3.end) \
				) \
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


function selectSegmentMatchesFromDatabase(callbackSuccess, segmentId){
	const sel_short=`SELECT ${sellist1} FROM ${joinlist} ORDER BY ${orderlist}`;
	db_conlog( 2, `selectSegmentMatchesFromDatabase: select stmt is: ${sel_short}`);
	function makeTransaction(callback){
		return function(transaction){
			transaction.executeSql( sel_short, [build, build, segmentId], callback, callback);
		};
	}
	db23.readTransaction(makeTransaction(callbackSuccess));
}

// Get a list of names and associated ids for whom any data are available
// Used for displaying list of names in results page
function getMatchesFromDatabase(callbackSuccess){
	
	function makeTransaction(callback){
		return function(transaction){
			transaction.executeSql('SELECT name, idText FROM idalias ORDER BY name COLLATE NOCASE', [], callback, callback);
		};
	}
	db23.readTransaction(makeTransaction(callbackSuccess));
}
// Get a reduced list of names and associated ids for whom any data are available
// Used for displaying filtered list of names in results page
function getFilteredMatchesFromDatabase(filterText, callbackSuccess){
	
	function makeTransaction(callback){
		var query="SELECT name, idText FROM idalias WHERE name LIKE '" +filterText + "' ORDER BY name COLLATE NOCASE";
		return function(transaction){
			transaction.executeSql(query, [], callback, callback);
		};
	}
	db23.readTransaction(makeTransaction(callbackSuccess));
}

// function getLabelList - no longer used
/*
** 
function getLabelList(callbackSuccess){
	
	function makeTransaction(callback){
		return function(transaction){
			transaction.executeSql('SELECT DISTINCT relationship1 AS relationship from ibdsegs WHERE relationship1 IS NOT NULL UNION SELECT DISTINCT relationship2 AS relationship from ibdsegs WHERE relationship2 IS NOT NULL',[],callback, callback);
		};
	}
	db23.readTransaction(makeTransaction(callbackSuccess));
}
*/

/*
** Queries for matches
** this returns the rows of segment data suitable for subsequent processing
** either as display on page or save to csv files.
** - in: id, either the 16-char UID string, or
**			 "All" for when we ask to export the entire DB.
*/
function selectFromDatabase(callbackSuccess, id, chromosome, includeChr100){

	var lowerBound=0;
	var upperBound=24;
	var chrNum=parseInt(chromosome);
	if(chrNum>0){
		lowerBound=chrNum-1;
		upperBound=chrNum+1;
	}
	function makeTransaction(callback, includeChr100){
		// create export table for entire DB
		return function(transaction){
			const qry_sel = 'SELECT \
					ibdsegs.ROWID as ROWID, \
					t1.name AS name1, \
					t2.name AS name2, \
					t1.idText AS id1, \
					t2.idText AS id2, \
					chromosome, start, end, cM, snps \
				FROM ibdsegs \
				JOIN idalias t1 ON (t1.idText=ibdsegs.id1) \
				JOIN idalias t2 ON (t2.idText=ibdsegs.id2) \
				WHERE build=?  AND ';
			const qry_cond = '(chromosome>? AND chromosome<?) ';
			const qry_cond100 = '((chromosome>? AND chromosome<?) OR chromosome = 100) ';
			const qry_order = '	ORDER BY chromosome, start, end DESC, ibdsegs.ROWID, julianday(t1.date)+julianday(t2.date), t1.ROWID+t2.ROWID;';
			var query;
			if ( includeChr100 )
				query = qry_sel + qry_cond100 + qry_order;
			else
				query = qry_sel + qry_cond + qry_order;
			transaction.executeSql( query, [build, lowerBound, upperBound], callback, callback);
		};
	}
	function makeTransactionWithId(callback, id, includeChr100){
		return function(transaction){

			const qry_sel = 'SELECT \
					ibdsegs.ROWID as ROWID, \
					t1.name AS name1, \
					t2.name AS name2, \
					t1.idText AS id1, \
					t2.idText AS id2, \
					chromosome, start, end, cM, snps \
				FROM ibdsegs \
				JOIN idalias t1 ON (t1.idText=ibdsegs.id1) \
				JOIN idalias t2 ON (t2.idText=ibdsegs.id2) \
				WHERE ((ibdsegs.id1=?) OR (ibdsegs.id2=?)) AND build=? AND ';
			const qry_cond = 'chromosome>? AND chromosome<? ';
			const qry_cond100 = '((chromosome>? AND chromosome<?) OR chromosome = 100) ';
			const qry_order = '	ORDER BY chromosome, start, end DESC, ibdsegs.ROWID, julianday(t1.date)+julianday(t2.date), t1.ROWID+t2.ROWID;';
			var query;
			if ( includeChr100 )
				query = qry_sel + qry_cond100 + qry_order;
			else
				query = qry_sel + qry_cond + qry_order;

			transaction.executeSql(query, [id, id, build, lowerBound, upperBound], callback, callback);
		};
	}
	if(id.length<16){
		db23.readTransaction(makeTransaction(callbackSuccess, includeChr100));
	}
	else db23.readTransaction(makeTransactionWithId(callbackSuccess, id, includeChr100));
}


/*
********************************************************
* the following functions write to the database
********************************************************
*/

function importRowSuccess( ) {
	decrementPendingTransactionCount( );
}

function importRowFail( error ) {
	db_conlog( 1, `Import transact failed: ${error.message}`);
	alert( `INSERT FAILED: ${error.message}`);
	decrementPendingTransactionCount();
}
// Put data from 529 export (without phase) into database
// CJD completely redid this, because we needed to get the key values from idalias creation
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
		db_conlog( 2, ` in makealiastrans, array ${arr.length} items, type: ${typeof(arr)}, 2nd elem is ${arr[1]}`);

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
			db_conlog( 2, `    Segments: swapping order: ${id2} then  ${id1}`);
			firstID = id2;
			secondID = id1;
		}
		else
			db_conlog( 2, `    Segments:  order: ${id1} then  ${id2}`);
		const qry1 = 'INSERT or IGNORE INTO ibdsegs ( id1, id2, chromosome, start, end, cM, snps, "date", build )VALUES(?,?,?,?,?,?,?,?,?);';
		
		return function(transaction){
			transaction.executeSql( qry1, [id1, id2, chromosome, start, end, centimorgans, snps, today, current23andMeBuild]);
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
			// previous version had commnt on each segment, but not on tester.
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
		// always store lowest first (makes checks faster)
		/*
		if ( firstID > secondID ) {
			let temp = secondID;
			secondID = firstID;
			firstID = temp;
		}*/
		let matchkey = firstID + secondID;
		if( !matchesmap.has( matchkey ) ) {
			matchesmap.set( matchkey, {id1: firstID, id2: secondID, cMtotal : 0.0} );
		}
		if( entry[2] != "100" ) {
			let cM=parseFloat(entry[5]);
			matchesmap.get( matchkey).cMtotal += cM;
		}
	}
	db_conlog( 1, `  adding ${aliasmap.size} alias rows`);
	// add all the unique keys and names to the alias table
	for( const[key, obj] of aliasmap ) {
		pendingTransactionCount++;
		db_conlog( 2, `    inserting ${obj.name} (ID: ${key})`)
		db23.transaction(makeIdAliasTransaction(key, obj.name, today, obj.comment), importRowFail, importRowSuccess);
	}
	db_conlog( 1, `adding ${lineList.length} segment rows`);
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
			var entrycM=entry[5];
			var entrySNPs=entry[6];

			pendingTransactionCount++;
			db23.transaction(makeMatchingSegmentTransaction(firstID, secondID, entryChromosome, entryStart, entryEnd, entrycM, entrySNPs, today), importRowFail, importRowSuccess);
		}
	}
	db_conlog( 1, `adding ${matchesmap.size} chr 100 rows`);
	for( const[key, obj] of matchesmap ) {
		pendingTransactionCount++;
		db23.transaction(makeMatchingSegmentTransaction(obj.id1, obj.id2, 100, -1, -1, obj.cMtotal, 0, today), importRowFail, importRowSuccess);
	}
	// now account for the initial value and eventually trigger callback..
	decrementPendingTransactionCount();

}

function onRequest(request, sender, sendResponse) {
	
//CJD FIX - needs adjusting for ? ID.  BUT  this  duplicates idsRequest - do we need both?
// At the moment, NEITHER routine is called!.

	// Store the names and ids of the matches
	function makeIdAliasTransaction(val){
		// Transaction factory to allow looping
		var numbers=id2numbers(val[0]);
		var name=val[1];
		return function(transaction){
			transaction.executeSql("INSERT INTO idalias (id, id_2, name, date, company_id) VALUES(?, ?, ?, date('now'), 1);", [numbers[0], numbers[1], name]);
		};
	}
	
	for(let i=0; i<request.ids.length; i++){
		// Attempt to insert this number, name combo
		db23.transaction(makeIdAliasTransaction(request.ids[i]));
	}
	
	// Store the matching segments
	function makeMatchingSegmentTransaction(id1, id2, val){
		// Transaction factory to allow looping
		if ( id1 == id2 ) return; // Don't enter matches with self
		var number1;
		var number2;
		// Order matches consistently so first ID < 2nd ID
		if(id1 < id2){
			number1=id1;
			number2=id2;
		}
		else{
			number1=id2;
			number2=id1;
		}
		return function(transaction){
			transaction.executeSql("INSERT INTO ibdsegs (id1, id2, chromosome, start, end, cM, snps, date, build) VALUES(?, ?, ?, ?, ?, ?, ?, date('now'),?);",[number1,  number2, val[2], val[3], val[4], val[5], val[6], current23andMeBuild]);
		};
	}
	for(let i=0; i<request.matchingSegments.length; i++){
		//if(request.matchingSegments[i][0]===request.matchingSegments[i][1]) continue; // Ignore matches to self
		if(request.matchingSegments[i][0]!==request.ids[0][1]){
			alert("unexpected name mismatch: " + request.matchingSegments[i][0] + " " + request.ids[0][1]);
			continue;
		}
		let j=1;
		for( ; j<request.ids.length; j++){
			if(request.matchingSegments[i][1]===request.ids[j][1]){
				db23.transaction(makeMatchingSegmentTransaction(request.ids[0][0], request.ids[j][0], request.matchingSegments[i]));
				break;
			}
		}
		if(j==request.ids.length) alert("failed to find match for " + request.matchingSegments[i][1]);
	}
	
	// Create bogus 'chromosome 100' match to signify that comparison has been performed
	for(let j=1; j<request.ids.length; j++){
		db23.transaction(makeMatchingSegmentTransaction(request.ids[0][0], request.ids[j][0], [ "filler", "filler", 100, -1, -1, 0, 0]));
	}
			
	// Return nothing to let the connection be cleaned up.
	sendResponse({});
}

function deleteAllData(callbackSuccess){
	if(confirm("Delete all data stored in your 529Renew local database?")){
		db23.transaction(
			function(transaction) {
				transaction.executeSql("DELETE from ibdsegs",[]);		// this is sqlite's TRUNCATE equivalent
				transaction.executeSql("DELETE from idalias",[]);
			}, function(){alert("Failed to delete data stored in 529Renew local database");}, callbackSuccess
		);
	}
}

//CJD FIX - needs adjusting for ? ID
// CURRENTLY not called but probably old message passing not updated.
function idsRequest(request, sender, sendResponse) {

	// Store the names and ids of the matches
	function makeIdAliasTransaction(val){
		// Transaction factory to allow looping
		var idtext=val[0];
		var name=val[1];
		return function(transaction){
			transaction.executeSql('INSERT INTO idalias (idText, name, "date" ) VALUES(?, ?, date() );', [idtext, name]);
		};
	}
	
	for(let i=0; i<request.ids.length; i++){
		// Attempt to insert this number, name combo
		db23.transaction(makeIdAliasTransaction(request.ids[i]));
	}
	
	// Store the matching segments
	function makeMatchingSegmentTransaction(id1, id2, val){
		// Transaction factory to allow looping
		if ( id1 == id2 ) return; // Don't enter matches with self
		var number1;
		var number2;
		// Order matches consistently so first ID < 2nd ID
		if(id1 < id2){
			number1=id1;
			number2=id2;
		}
		else{
			number1=id2;
			number2=id1;
		}
		return function(transaction){
			transaction.executeSql('INSERT INTO ibdsegs (id1, id2, chromosome, start, end, cM, snps, "date", build) VALUES(?, ?, ?, ?, ?, ?, ?, date(), ?);',[number1,  number2, val[2], val[3], val[4], val[5], val[6], current23andMeBuild]);
		};
	}
	for(let i=0; i<request.matchingSegments.length; i++){
		//if(request.matchingSegments[i][0]===request.matchingSegments[i][1]) continue; // Ignore matches to self
		if(request.matchingSegments[i][0]!==request.ids[0][1]){
			alert("unexpected name mismatch: " + request.matchingSegments[i][0] + " " + request.ids[0][1]);
			continue;
		}
		let j=1;
		for( ; j<request.ids.length; j++){
			if(request.matchingSegments[i][1]===request.ids[j][1]){
				db23.transaction(makeMatchingSegmentTransaction(request.ids[0][0], request.ids[j][0], request.matchingSegments[i]));
				break;
			}
		}
		if(j==request.ids.length) alert("failed to find match for " + request.matchingSegments[i][1]);
	}
	
	// Create bogus 'chromosome 100' match to signify that comparison has been performed
	for(let j=1; j<request.ids.length; j++){
		db23.transaction(makeMatchingSegmentTransaction(request.ids[0][0], request.ids[j][0], [ "filler", "filler", 100, -1, -1, 0, 0]));
	}
			
	// Return nothing to let the connection be cleaned up.
	sendResponse({});
}

