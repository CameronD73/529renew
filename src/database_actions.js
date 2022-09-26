/*
** support code for the message-passing part of
** handling database requests.
** these run within the scope of the code with the open database object
** (i.e. a Window, with extension origin)
*/

/*  eslint-disable no-unused-vars */
"use strict";


db_conlog( 1, "loading DB actions");

/*
** checkIfInDatabase() called by message listener.
**  sends reply back to sender in request mode: returnNeedCompare
** with reply.needToCompare set true of false.
** If true then caller should then request from (23 and me) the segment match details between these two testers.
*/

function checkIfInDatabase( request, sender ) {
	db_conlog( 1, "InDB checking " + request.mode );
	if(request.shiftIsDown){
		// Skip database query
		chrome.tabs.sendMessage(sender.tab.id, {mode: "returnNeedCompare", indexId: request.indexId, matchId: request.matchId, indexName: request.indexName, matchName: request.matchName, needToCompare: true});
	}
	function makeMessageSender(tab_id, indexId, matchId, indexName, matchName){
		return function(transaction, resultSet){
			var myrow=null;
			if(resultSet.rows.length==1) {
				myrow=resultSet.rows.item(0);
				db_conlog( 2, `   DBquery returned ${myrow.hits} hits`);
			}
			else
				db_conlog( 2, `   DBquery returned ${resultSet.rows.length} rows` );
		if(myrow!=null){
				var needToCompare=false;
				if(myrow.hits==0) needToCompare=true;
				chrome.tabs.sendMessage(tab_id, {mode: "returnNeedCompare", indexId: indexId, matchId: matchId, indexName: indexName, matchName: matchName, needToCompare: needToCompare});
			}
		};
	}
	function makeMessageSenderForFailure(tab_id, indexId, matchId, indexName, matchName){
		return function(error){
			// Default is to just do comparison
			db_conlog( 2, `   DBquery returned error ${error}` );
			chrome.tabs.sendMessage(tab_id, {mode: "returnNeedCompare", indexId: indexId, matchId: matchId, indexName: indexName, matchName: matchName, needToCompare: true});
		};
	}
	var messageSender=makeMessageSender(sender.tab.id, request.indexId, request.matchId, request.indexName, request.matchName);
	var messageSenderForFailure=makeMessageSenderForFailure(sender.tab.id, request.indexId, request.matchId, request.indexName, request.matchName);


	countMatchingSegments(request.indexId, request.matchId, messageSender, messageSenderForFailure);
	return;
}


chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
  
	if(request.mode == "checkIfInDatabase"){
		checkIfInDatabase( request, sender );
	}
	else if(request.mode == "storeSegments"){
		storeSegments(request);
	}
	/*
	//else if(request.mode == "fixYouAreComparingWithBug"){
	//	fixYouAreComparingWithBug();
	} */
	else {
		errmsg = `dbactions_listen: unhandled message mode${request.mode}`;
		db_conlog( 0, errmsg);
		alert ( errmsg);
	}
  });

  // this is no longer possible as the IDs have uniqueness constraints already.
  /*
const subselect_yacw = "SELECT i1.ROWID AS ROWID FROM idalias i1, idalias i2 WHERE i1.id_1=i2.id_1 AND i1.id_2=i2.id_2 AND i1.name!=i2.name AND i1.name='You are comparing with'";

function fixYouAreComparingWithBug() {
	// Delete 'You are comparing with' entries from idalias if there is an alternative alias stored
	function makeCorrectionTransaction(){
		return function(transaction){
			transaction.executeSql(`DELETE FROM idalias WHERE ROWID IN (${subselect_yacw});`);
		};
	}
	db23.transaction(makeCorrectionTransaction());
}
  */

// not valid in V3...
/*
** not used...
//function onRequest(request, sender, sendResponse) {

	
	if(request.ids==null){
		if(request.url!=null){
			// Handles new experience 529andYou button
			openActiveURL(request.url);
		}
		//if(request.sharingNamesAndIds!=null){
		//	sharingNamesAndIds=request.sharingNamesAndIds;
		//}
		//else if(request.profileNamesAndIds!=null){
		//	profileNamesAndIds=request.profileNamesAndIds;
		//}
		sendResponse({});
		return;
	}

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
*/

/* 
** store a matching segment.
** This code works both for message passing and for local use, as it sends no messages back.
** The request is an object, with:
** ids: an array of two objects, each has values:
**			 "id" - the 16-digit UID and
**			 "name" - the testers name or alias.
** matchingSegments - an array of objects - each object has details about one matching segment
*/
function storeSegments(request) {

	// Store the names and ids of the matches
	function makeIdAliasTransaction(idobj){
		return function(transaction){
			// you could REPLACE if duplicated - I suppose that should be a user option.
			transaction.executeSql("INSERT or IGNORE INTO idalias ( idText, name, `date` ) VALUES(?, ?, date('now'), 1);", [idobj.id, idobj.name]);
		};
	}
	
	for(let i=0; i<request.ids.length; i++){
		// Attempt to insert these two number, name combos
		db23.transaction(makeIdAliasTransaction(request.ids[i]));
	}
	
	// Store the matching segments
	function makeMatchingSegmentTransaction(id1, id2, val){

		if(id1 == id2) return; // Don't enter matches with self
		let firstid = id1;
		let secondid = id2;
		if(id1 > id2){
			firstid = id2;
			secondid = id1;
		}

		return function(transaction){
			// Normally code will skip any matches we have already.
			// if we have forced a reread then presumably we intend it to replace older value
			transaction.executeSql('INSERT or REPLACE INTO ibdsegs (id1, id2, chromosome, start, end, centimorgans, snps, "date", build) VALUES(?, ?, ?, ?, ?, ?, ?,  date(),?);', 	[firstid, secondid, val.chromosome, val.start, val.end, val,cM, val.snps, current23andMeBuild]);
		};
	}
	for(let i=0; i<request.matchingSegments.length; i++){
		//if(request.matchingSegments[i][0]===request.matchingSegments[i][1]) continue; // Ignore matches to self
		if(request.matchingSegments[i].uid1!==request.ids[0].id){
			alert("StoreSegments: unexpected name mismatch: " + request.matchingSegments[i].name1 + " " + request.ids[0].name);
			continue;
		}
		let j=1;
		for( ; j<request.ids.length; j++){
			if(request.matchingSegments[i].uid2===request.ids[j].id){
				db23.transaction(makeMatchingSegmentTransaction(request.ids[0].id, request.ids[j].id, request.matchingSegments[i]));
				break;
			}
		}
		if(j==request.ids.length) alert("failed to find match for " + request.matchingSegments[i].name1);
	}
	
	// Create bogus 'chromosome 100' match to signify that comparison has been performed
	for(let j=1; j<request.ids.length; j++){
		db23.transaction(makeMatchingSegmentTransaction(request.ids[0].id, request.ids[j].id, [ "filler", "filler", 100, -1, -1, 0, 0]));
	}
			
}


