/*
** support code for handling database processes
** these run within the scope of the code with the open database object
** (i.e. a Window, with extension origin)
*/

/*  eslint-disable no-unused-vars */
"use strict";


db_conlog( 1, "loading DB actions");


chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
  
	if(request.checkIfInDatabase!=null){
		db_conlog( 1, "InDB checking " + request );
		if(request.shiftIsDown){
			// Skip database query
			chrome.tabs.sendMessage(sender.tab.id, {indexId: request.indexId, matchId: request.matchId, indexName: request.indexName, matchName: request.matchName, needToCompare: true});
		}
		function makeMessageSender(tab_id, indexId, matchId, indexName, matchName){
			return function(transaction, resultSet){
				var myrow=null;
				if(resultSet.rows.length==1) myrow=resultSet.rows.item(0);
				db_conlog( 2, `   DBquery returned ${resultSet.rows.length} rows` );
				if(myrow!=null){
					var needToCompare=false;
					if(myrow.hits==0) needToCompare=true;
					chrome.tabs.sendMessage(tab_id, {indexId: indexId, matchId: matchId, indexName: indexName, matchName: matchName, needToCompare: needToCompare});
				}
			};
		}
		function makeMessageSenderForFailure(tab_id, indexId, matchId, indexName, matchName){
			return function(error){
				// Default is to just do comparison
				chrome.tabs.sendMessage(tab_id, {indexId: indexId, matchId: matchId, indexName: indexName, matchName: matchName, needToCompare: true});
			};
		}
		var messageSender=makeMessageSender(sender.tab.id, request.indexId, request.matchId, request.indexName, request.matchName);
		var messageSenderForFailure=makeMessageSenderForFailure(sender.tab.id, request.indexId, request.matchId, request.indexName, request.matchName);

		var indexIds=id2numbers(request.indexId);
		var matchIds=id2numbers(request.matchId);
		upgradeToCurrentBuild(indexIds[0], indexIds[1], matchIds[0], matchIds[1], messageSender, messageSenderForFailure);
		return;
	}
	if(request.fixYouAreComparingWithBug!=null){
	
		// Delete 'You are comparing with' entries from idalias if there is an alternative alias stored
		function makeCorrectionTransaction(){
			return function(transaction){
				transaction.executeSql("DELETE FROM idalias WHERE ROWID IN (SELECT i1.ROWID AS ROWID FROM idalias i1, idalias i2 WHERE i1.id_1=i2.id_1 AND i1.id_2=i2.id_2 AND i1.name!=i2.name AND i1.name='You are comparing with');");
			};
		}
		db23.transaction(makeCorrectionTransaction());
	}
  });
  	
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
  

function onRequest(request, sender, sendResponse) {

	
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


function compareIds(id1, id2){
	// return -1 if id1<id2
	// return 1 if id1>id2
	// return 0 if id1==id2 || id1 or id2 can't be parsed
	var nums1=id2numbers(id1);
	if(nums1==null) return 0;
	var nums2=id2numbers(id2);
	if(nums2==null) return 0;
	if(nums1[0]<nums2[0]) return -1;
	if(nums2[0]<nums1[0]) return 1;
	if(nums1[1]<nums2[1]) return -1;
	if(nums1[1]<nums2[1]) return 1;
	return 0;
}
function compareNumbers(id1_1, id1_2, id2_1, id2_2){
	if(id1_1<id2_1) return -1;
	if(id2_1<id1_1) return 1;
	if(id1_2<id2_2) return -1;
	if(id2_2<id1_2) return 1;
	return 0;
}

// This is just the rest of the onRequest() callback for
// when ids are defined.
// Not yet used.
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

