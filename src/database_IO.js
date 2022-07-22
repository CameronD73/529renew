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

function countMatchingSegments(id1_1, id1_2, id2_1, id2_2, upgradeIfNeeded, upgradeQueryFailed){

	function makeTransaction(id1_1, id1_2, id2_1, id2_2, callBackSuccess, callBackFailed){
		var compared=compareNumbers(id1_1, id1_2, id2_1, id2_2);
		if(compared==0) return; // Don't query matches with self
		if(compared<0){
			var temp=id1_1;
			id1_1=id2_1;
			id2_1=temp;
			
			temp=id1_2;
			id1_2=id2_2;
			id2_2=temp;
		}
		return function(transaction){
			transaction.executeSql('SELECT id1_1, id1_2, id2_1, id2_2, COUNT(ROWID) AS hits from ibdsegs WHERE id1_1=? AND id1_2=? AND id2_1=? AND id2_2=? AND build=?',[id1_1, id1_2, id2_1, id2_2, current23andMeBuild], callBackSuccess, callBackFailed);
		};
	}
	db_conlog( 2, `   dbREAD ${id1_1} vs ${id2_1}` );
	db23.readTransaction(makeTransaction(id1_1, id1_2, id2_1, id2_2, upgradeIfNeeded, upgradeQueryFailed));
}

const sellist1 = "ibdsegs.ROWID as ROWID,\
	t1.name AS name1,\
	t2.name AS name2,\
	t1.id_1 AS id1_1,\
	t1.id_2 AS id1_2,\
	t2.id_1 AS id2_1,\
	t2.id_2 AS id2_2,\
	ibdsegs.chromosome AS chromosome,\
	ibdsegs.start AS start,\
	ibdsegs.end AS end,\
	ibdsegs.centimorgans AS centimorgans,\
	ibdsegs.snps AS snps";

const sellist2 = "	ibdsegs.phase1 AS phase1,\
	ibdsegs.relationship1 AS relationship1,\
	ibdsegs.phase2 AS phase2,\
	ibdsegs.relationship2 AS relationship2,\
	ibdsegs.comment AS comment";

const joinlist = "ibdsegs \
	JOIN idalias t1 ON (t1.id_1=ibdsegs.id1_1 AND t1.id_2=ibdsegs.id1_2) \
	JOIN idalias t2 ON (t2.id_1=ibdsegs.id2_1 AND t2.id_2=ibdsegs.id2_2) \
	JOIN ibdsegs t3 ON 	(ibdsegs.build=?  \
		AND t3.build=? \
		AND t3.ROWID=? \
		AND (  	( \
			t3.chromosome=ibdsegs.chromosome \
			AND (	   (ibdsegs.start>=t3.start AND ibdsegs.end<=t3.end) \
				OR (ibdsegs.start<=t3.start AND ibdsegs.end>=t3.end) \
				OR (ibdsegs.start<=t3.start AND ibdsegs.end>=t3.start) \
				OR (ibdsegs.start<=t3.end AND ibdsegs.end>=t3.end) \
			) \
			) \
			OR ibdsegs.chromosome=100 \
		) AND (    -- either person is the same \
				(t3.id1_1=ibdsegs.id1_1 AND t3.id1_2=ibdsegs.id1_2) \
			OR (t3.id1_1=ibdsegs.id2_1 AND t3.id1_2=ibdsegs.id2_2) \
			OR (t3.id2_1=ibdsegs.id1_1 AND t3.id2_2=ibdsegs.id1_2)  \
			OR (t3.id2_1=ibdsegs.id2_1 AND t3.id2_2=ibdsegs.id2_2) \
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
	function makeTransaction(callback){
		return function(transaction){
			transaction.executeSql( sel_short, [build, build, segmentId], callback, callback);
		};
	}
	db23.readTransaction(makeTransaction(callbackSuccess));
}

// Queries a list of names and associated ids for whom data are available
function getMatchesFromDatabase(callbackSuccess){
	
	function makeTransaction(callback){
		return function(transaction){
			transaction.executeSql('SELECT name, id_1, id_2 FROM idalias ORDER BY name COLLATE NOCASE', [], callback, callback);
		};
	}
	db23.readTransaction(makeTransaction(callbackSuccess));
}

function getFilteredMatchesFromDatabase(filterText, callbackSuccess){
	
	function makeTransaction(callback){
		var query="SELECT name, id_1, id_2 FROM idalias WHERE name LIKE '" +filterText + "' ORDER BY name COLLATE NOCASE";
		return function(transaction){
			transaction.executeSql(query, [], callback, callback);
		};
	}
	db23.readTransaction(makeTransaction(callbackSuccess));
}

function getLabelList(callbackSuccess){
	
	function makeTransaction(callback){
		return function(transaction){
			transaction.executeSql('SELECT DISTINCT relationship1 AS relationship from ibdsegs WHERE relationship1 IS NOT NULL UNION SELECT DISTINCT relationship2 AS relationship from ibdsegs WHERE relationship2 IS NOT NULL',[],callback, callback);
		};
	}
	db23.readTransaction(makeTransaction(callbackSuccess));
}

/*
** Queries for matches
** this returns the rows of segment data suitable for subsequent processing
** either as display on page or save to csv files.
** - in: id
*/
function selectFromDatabase(callbackSuccess, id, chromosome){

	var lowerBound=0;
	var upperBound=24;
	var chrNum=parseInt(chromosome);
	if(chrNum>0){
		lowerBound=chrNum-1;
		upperBound=chrNum+1;
	}
	function makeTransaction(callback){
		return function(transaction){
			//transaction.executeSql('SELECT chromosome, start, end, centimorgans, snps FROM ibdsegs;', [], callback, callback);
			transaction.executeSql('SELECT ibdsegs.ROWID as ROWID, t1.name AS name1, t2.name AS name2, t1.id_1 AS id1_1, t1.id_2 AS id1_2, t2.id_1 AS id2_1, t2.id_2 AS id2_2, chromosome, start, end, centimorgans, snps FROM ibdsegs JOIN idalias t1 ON (t1.id_1=ibdsegs.id1_1 AND t1.id_2=ibdsegs.id1_2) JOIN idalias t2 ON (t2.id_1=ibdsegs.id2_1 AND t2.id_2=ibdsegs.id2_2) WHERE chromosome>? AND chromosome<? AND build=? ORDER BY chromosome, start, end DESC, ibdsegs.ROWID, julianday(t1.date)+julianday(t2.date), t1.ROWID+t2.ROWID', [lowerBound, upperBound, build], callback, callback);
		};
	}
	function makeTransactionWithId(callback, idnumbers){
		return function(transaction){
			//transaction.executeSql('SELECT chromosome, start, end, centimorgans, snps FROM ibdsegs;', [], callback, callback);
			transaction.executeSql('SELECT ibdsegs.ROWID as ROWID, t1.name AS name1, t2.name AS name2, t1.id_1 AS id1_1, t1.id_2 AS id1_2, t2.id_1 AS id2_1, t2.id_2 AS id2_2, chromosome, start, end, centimorgans, snps FROM ibdsegs JOIN idalias t1 ON (t1.id_1=ibdsegs.id1_1 AND t1.id_2=ibdsegs.id1_2) JOIN idalias t2 ON (t2.id_1=ibdsegs.id2_1 AND t2.id_2=ibdsegs.id2_2) WHERE ((ibdsegs.id1_1=? AND ibdsegs.id1_2=?) OR (ibdsegs.id2_1=? AND ibdsegs.id2_2=?)) AND chromosome>? AND chromosome<? AND build=? ORDER BY chromosome, start, end DESC, ibdsegs.ROWID, julianday(t1.date)+julianday(t2.date), t1.ROWID+t2.ROWID', [idnumbers[0], idnumbers[1], idnumbers[0], idnumbers[1], lowerBound, upperBound, build], callback, callback);
		};
	}
	if(id.length<16){
		db23.readTransaction(makeTransaction(callbackSuccess));
	}
	else db23.readTransaction(makeTransactionWithId(callbackSuccess, id2numbers(id)));
}

function selectFromDatabaseWithNonMatches(callbackSuccess, id, chromosome){

	var lowerBound=0;
	var upperBound=24;
	var chrNum=parseInt(chromosome);
	if(chrNum>0){
		lowerBound=chrNum-1;
		upperBound=chrNum+1;
	}
	function makeTransaction(callback){
		return function(transaction){
			//transaction.executeSql('SELECT chromosome, start, end, centimorgans, snps FROM ibdsegs;', [], callback, callback);
			transaction.executeSql('SELECT ibdsegs.ROWID as ROWID, t1.name AS name1, t2.name AS name2, t1.id_1 AS id1_1, t1.id_2 AS id1_2, t2.id_1 AS id2_1, t2.id_2 AS id2_2, chromosome, start, end, centimorgans, snps, phase1, relationship1, phase2, relationship2, comment FROM ibdsegs JOIN idalias t1 ON (t1.id_1=ibdsegs.id1_1 AND t1.id_2=ibdsegs.id1_2) JOIN idalias t2 ON (t2.id_1=ibdsegs.id2_1 AND t2.id_2=ibdsegs.id2_2) WHERE ((chromosome>? AND chromosome<?) OR chromosome=100) AND build=? ORDER BY chromosome, start, end DESC, ibdsegs.ROWID, julianday(t1.date)+julianday(t2.date), t1.ROWID+t2.ROWID', [lowerBound, upperBound, build], callback, callback);
		};
	}
	function makeTransactionWithId(callback, idnumbers){
		return function(transaction){
			//transaction.executeSql('SELECT chromosome, start, end, centimorgans, snps FROM ibdsegs;', [], callback, callback);
			transaction.executeSql('SELECT ibdsegs.ROWID as ROWID, t1.name AS name1, t2.name AS name2, t1.id_1 AS id1_1, t1.id_2 AS id1_2, t2.id_1 AS id2_1, t2.id_2 AS id2_2, chromosome, start, end, centimorgans, snps, phase1, relationship1, phase2, relationship2, comment FROM ibdsegs JOIN idalias t1 ON (t1.id_1=ibdsegs.id1_1 AND t1.id_2=ibdsegs.id1_2) JOIN idalias t2 ON (t2.id_1=ibdsegs.id2_1 AND t2.id_2=ibdsegs.id2_2) WHERE ((ibdsegs.id1_1=? AND ibdsegs.id1_2=?) OR (ibdsegs.id2_1=? AND ibdsegs.id2_2=?)) AND ((chromosome>? AND chromosome<?) OR chromosome=100) AND build=? ORDER BY chromosome, start, end DESC, ibdsegs.ROWID, julianday(t1.date)+julianday(t2.date), t1.ROWID+t2.ROWID', [idnumbers[0], idnumbers[1], idnumbers[0], idnumbers[1], lowerBound, upperBound, build], callback, callback);
		};
	}
	if(id.length<16){
		db23.readTransaction(makeTransaction(callbackSuccess));
	}
	else db23.readTransaction(makeTransactionWithId(callbackSuccess, id2numbers(id)));
}


/*
********************************************************
* the following functions write to the database
********************************************************
*/

// Put data from 529 export (without phase) into database
function import529CSV(lineList, callback){

	if(!lineList) return;
	
	pendingTransactionCount=0;
	noPendingTransactionCallBack=callback;
	
	// Store the names and ids of the matches
	function makeIdAliasTransaction(val){
		// Transaction factory to allow looping
		var numbers=id2numbers(val[0]);
		var name=val[1];
		return function(transaction){
			transaction.executeSql("INSERT INTO idalias (id_1, id_2, name, date, company_id) VALUES(?, ?, ?, date('now'), 1);", [numbers[0], numbers[1], name]);
		};
	}
	// Store the matching segments
	function makeMatchingSegmentTransaction(id1, id2, chromosome, start, end, centimorgans, snps){
		// Transaction factory to allow looping
		var compared=compareIds(id1, id2);
		if(compared==0) return; // Don't enter matches with self
		var numbers1;
		var numbers2;
		// Order matches consistently
		if(compared>0){
			numbers1=id2numbers(id1);
			numbers2=id2numbers(id2);
		}
		else{
			numbers1=id2numbers(id2);
			numbers2=id2numbers(id1);
		}
		return function(transaction){
			transaction.executeSql("INSERT INTO ibdsegs (id1_1, id1_2, id2_1, id2_2, chromosome, start, end, centimorgans, snps, date, build) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, date('now'),?);",[numbers1[0], numbers1[1], numbers2[0], numbers2[1], chromosome, start, end, centimorgans, snps, current23andMeBuild]);
		};
	}
	
	// i=0 is header row
	for(let i=1; i< lineList.length; i++){
		var entry=lineList[i].split(',');
		if(entry.length==9){
			var firstName=entry[0];
			var firstId=entry[7];
			var secondName=entry[1];
			var secondId=entry[8];
			var entryChromosome;
			if(entry[2]==="X") entryChromosome=23;
			else entryChromosome=entry[2];
			var entryStart=entry[3];
			var entryEnd=entry[4];
			var entrycM=entry[5];
			var entrySNPs=entry[6];
			
			pendingTransactionCount++;
			db23.transaction(makeIdAliasTransaction([firstId, firstName]), decrementPendingTransactionCount, decrementPendingTransactionCount);
			pendingTransactionCount++;
			db23.transaction(makeIdAliasTransaction([secondId, secondName]), decrementPendingTransactionCount, decrementPendingTransactionCount);
			pendingTransactionCount++;
			db23.transaction(makeMatchingSegmentTransaction(firstId, secondId, entryChromosome, entryStart, entryEnd, entrycM, entrySNPs), decrementPendingTransactionCount, decrementPendingTransactionCount);
			pendingTransactionCount++;
			db23.transaction(makeMatchingSegmentTransaction(firstId, secondId, 100, -1, -1, 0, 0), decrementPendingTransactionCount, decrementPendingTransactionCount);
		}
		else{
			// parse error
		}
	}
}


function onRequest(request, sender, sendResponse) {

	
	// Store the names and ids of the matches
	function makeIdAliasTransaction(val){
		// Transaction factory to allow looping
		var numbers=id2numbers(val[0]);
		var name=val[1];
		return function(transaction){
			transaction.executeSql("INSERT INTO idalias (id_1, id_2, name, date, company_id) VALUES(?, ?, ?, date('now'), 1);", [numbers[0], numbers[1], name]);
		};
	}
	
	for(let i=0; i<request.ids.length; i++){
		// Attempt to insert this number, name combo
		db23.transaction(makeIdAliasTransaction(request.ids[i]));
	}
	
	// Store the matching segments
	function makeMatchingSegmentTransaction(id1, id2, val){
		// Transaction factory to allow looping
		var compared=compareIds(id1, id2);
		if(compared==0) return; // Don't enter matches with self
		var numbers1;
		var numbers2;
		// Order matches consistently
		if(compared>0){
			numbers1=id2numbers(id1);
			numbers2=id2numbers(id2);
		}
		else{
			numbers1=id2numbers(id2);
			numbers2=id2numbers(id1);
		}
		return function(transaction){
			transaction.executeSql("INSERT INTO ibdsegs (id1_1, id1_2, id2_1, id2_2, chromosome, start, end, centimorgans, snps, date, build) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, date('now'),?);",[numbers1[0], numbers1[1], numbers2[0], numbers2[1], val[2], val[3], val[4], val[5], val[6], current23andMeBuild]);
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
				transaction.executeSql("DELETE FROM ibdsegs",[]);
				transaction.executeSql("DELETE FROM idalias",[]);
			}, function(){alert("Failed to delete data stored in 529Renew local database");}, callbackSuccess
		);
	}
}


function idsRequest(request, sender, sendResponse) {

	// Store the names and ids of the matches
	function makeIdAliasTransaction(val){
		// Transaction factory to allow looping
		var numbers=id2numbers(val[0]);
		var name=val[1];
		return function(transaction){
			transaction.executeSql("INSERT INTO idalias (id_1, id_2, name, date, company_id) VALUES(?, ?, ?, date('now'), 1);", [numbers[0], numbers[1], name]);
		};
	}
	
	for(let i=0; i<request.ids.length; i++){
		// Attempt to insert this number, name combo
		db23.transaction(makeIdAliasTransaction(request.ids[i]));
	}
	
	// Store the matching segments
	function makeMatchingSegmentTransaction(id1, id2, val){
		// Transaction factory to allow looping
		var compared=compareIds(id1, id2);
		if(compared==0) return; // Don't enter matches with self
		var numbers1;
		var numbers2;
		// Order matches consistently
		if(compared>0){
			numbers1=id2numbers(id1);
			numbers2=id2numbers(id2);
		}
		else{
			numbers1=id2numbers(id2);
			numbers2=id2numbers(id1);
		}
		return function(transaction){
			transaction.executeSql("INSERT INTO ibdsegs (id1_1, id1_2, id2_1, id2_2, chromosome, start, end, centimorgans, snps, date, build) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, date('now'),?);",[numbers1[0], numbers1[1], numbers2[0], numbers2[1], val[2], val[3], val[4], val[5], val[6], current23andMeBuild]);
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

