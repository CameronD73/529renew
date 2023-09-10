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
	if(request.forceSegmentUpdate){
		// Skip database query
		db_conlog( 2, `CheckIfInDB - forcing reread ${request.indexName} vs ${request.matchName}`);
		chrome.tabs.sendMessage(sender.tab.id, {mode: "returnNeedCompare", indexId: request.indexId, matchId: request.matchId, indexName: request.indexName, matchName: request.matchName, needToCompare: true});
		return;
	}
	function makeMessageSender(tab_id, indexId, matchId, indexName, matchName){
		return function(transaction, resultSet){
			var myrow=null;
			var needToCompare=true;
			if(resultSet.rows.length==1) {
				myrow=resultSet.rows.item(0);
				db_conlog( 2, `   DBquery ${indexName} vs ${matchName} returned ${myrow.hits} hits, full return:`);
			}
			else
				db_conlog( 2, `   DBquery ${indexName} vs ${matchName} returned ${resultSet.rows.length} rows` );
			if(myrow!=null){
				if(myrow.hits>0) needToCompare=false;
			}
			chrome.tabs.sendMessage(tab_id, {mode: "returnNeedCompare", indexId: indexId, matchId: matchId, indexName: indexName, matchName: matchName, needToCompare: needToCompare});
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
	msg_conlog( 3, `dbactions listener, mode: ${request.mode}`);
	if(request.mode == "checkIfInDatabase"){
		checkIfInDatabase( request, sender );
	}
	else if(request.mode == "storeSegments"){
		storeSegments(request);
	}
	else if(request.mode == "store_chr_200"){
		save_chr200_records( request.primary, request.matchData );
	}
	else if(request.mode == "updateSetting"){
		msg_conlog( 2, `   DBactions updating ${request.item} to ${request.value}` );
		setSetting(request.item, request.value);
	}
	else if(request.mode == "getSettingObj"){
		msg_conlog( 2, `   DBactions returning all settings ` );
		wait4Settings( 2 );
		sendResponse( settings529 );

	}
	else if(request.mode == "getDebugSettings"){
		msg_conlog( 2, `   DBactions returning debug settings ` );
		sendResponse( {	debug_q: settings529["debug_q"],
						debug_db: settings529["debug_db"],
						debug_msg: settings529["debug_msg"] }  );
	}
	else if(request.mode == "selectUser"){
		msg_conlog( 2, `   DBactions changing user to  ${request.userID}` );
		updateSelectedNameViaMsg( request.userID );
	}
	else if ( request.mode == "displayPage" || request.mode == "killMeNow" || Object.keys(request).includes("url")) {
		return false;		// leave this for service script to handle
	} else {
		let errmsg = `dbactions_listen: unhandled message mode ${request.mode}.`;
		console.log( errmsg, request);
		alert ( errmsg);
		return false;		// not handled here
	}
 	return true;
});


/*
** store a matching segment.
** This code works both for message passing and for local use, as it sends no messages back.
** The request is an object, with:
** ids: an array of two objects, each has values:
**			 "id" - the 16-digit UID and
**			 "name" - the testers name or alias.
** matchingSegments - an array of objects - each object has details about one matching segment
*/
function insert_OK( ){
	return;
}
function insertRowFail( error ) {
	console.error( `Insert transaction failed: ${error.message}`);
	alert( `INSERT FAILED: ${error.message}`);
}
function storeSegments(request) {

	// Store the names and ids of the matches
	function makeIdAliasTransaction(idobj){
		return function(transaction){
			// you could REPLACE if duplicated - I suppose that should be a user option.
			transaction.executeSql('INSERT or IGNORE INTO idalias ( idText, name, "date" ) VALUES(?, ?, date() );', [idobj.id, idobj.name]);
		};
	}

	for(let i=0; i<request.ids.length; i++){
		// Attempt to insert these two number, name combos
		db_conlog( 2, `storeSeg: alias ${i} for ${request.ids[i].name}`)
		db23.transaction(makeIdAliasTransaction(request.ids[i]),  insertRowFail, insert_OK);
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
		let segstart = roundBaseAddress(val.start);
		let segend = roundBaseAddress(val.end);
		let segcM = round_cM(val.cM);

		return function(transaction){
			// Normally code will skip any matches we have already.
			// if we have forced a reread then presumably we intend it to replace older value
			transaction.executeSql('INSERT or REPLACE INTO ibdsegs (id1, id2, chromosome, start, end, cM, snps, "date", build) VALUES(?, ?, ?, ?, ?, ?, ?,  date(),?);', 	[firstid, secondid, val.chromosome, segstart, segend, segcM, val.snps, current23andMeBuild]);
		};
	}
	for(let i=0; i<request.matchingSegments.length; i++){
		 // Ignore matches to self
		if(request.matchingSegments[i].uid1!==request.ids[0].id){
			alert("StoreSegments: unexpected name mismatch: " + request.matchingSegments[i].name1 + " " + request.ids[0].name);
			continue;
		}
		let j=1;
		for( ; j<request.ids.length; j++){
			if(request.matchingSegments[i].uid2===request.ids[j].id){
				db23.transaction(makeMatchingSegmentTransaction(request.ids[0].id, request.ids[j].id, request.matchingSegments[i]),  insertRowFail, insert_OK);
				break;
			}
		}
		if(j==request.ids.length) alert("failed to find match for " + request.matchingSegments[i].name1);
	}

	// Create bogus 'chromosome 100' match to signify that comparison has been performed
	for(let j=1; j<request.ids.length; j++){
		db23.transaction( makeMatchingSegmentTransaction(request.ids[0].id, request.ids[j].id, { chromosome:100, start:-1, end:-1, cM:0, snps:0}),  insertRowFail, insert_OK);
	}

}

/*
** the bogus chromosome 200 values are to record percent shared between two people.
** This is getting extra klutzy - should have done proper separate tables.
** Note, uniqueness constraint is set to (IDs, chromosome, start, end & build).
** chr: always 200 (means this is a shared % record)
** SNPs : percent shared * 1000
** 		The only floating pt column is cM, but we might want to use that later for a calculated value, so need to store the 
** 		percentage in an integer (converted from thousandths of a percent.) - use SNPs column.
** 		also record possible two separate records if user segment data was hidden or visible.
** end : 0 for shown, or 1 for hidden. - doing this, we can save both values if the user changes their mind, or if they "connect".
** start: always -1 (for now)
**
** in:
**  primary_pair : object with IDs and Names of profile person and DNA relative being viewed.
**  page_rows : is array of objects detailing useful contents of ICW table.
** 				 (it starts as a Maps array, but gets converted to objects in the message passing - I don't know why I bothered)
*/

function save_chr200_records( primary_pair, page_rows ) {
		// Store the names and ids of the matches - this will be 90% redundant, but the insert or ignore is the fastest way to 
		// test whether or not it needs doing.
	function makeIdAliasTransaction(id, name){
		return function(transaction){
			// you could REPLACE if duplicated - I suppose that should be a user option.
			transaction.executeSql('INSERT or IGNORE INTO idalias ( idText, name, "date" ) VALUES(?, ?, date() );', [id, name]);
		};
	}
	if ( primary_pair.pct_shared > 0.0 ) {
		// only available on first page so don't waste time later.
		db23.transaction( makeIdAliasTransaction( primary_pair.profileID, primary_pair.profileName ),  insertRowFail, insert_OK);
		db23.transaction( makeIdAliasTransaction( primary_pair.matchID, primary_pair.matchName ),  insertRowFail, insert_OK);
	}
	for(let i=0; i<page_rows.length; i++){
		// Attempt to insert these two number, name combos
		let pr=page_rows[i];		// is an object of the i'th row
		db_conlog( 2, `save_chr200_records: alias ${i} for ${pr.name_icw_relative}}`)
		db23.transaction( makeIdAliasTransaction( pr.ID_icw_relative, pr.name_icw_relative ),  insertRowFail, insert_OK);
	}

	// Store the percent shared value.
	function makeChr200Transaction(id1, id2, pct_shared, is_hidden){

		if(id1 == id2) return; // Don't enter matches with self
		let firstid = id1;
		let secondid = id2;
		if(id1 > id2){
			firstid = id2;
			secondid = id1;
		}
		let segend = (is_hidden ? 1 : 0 );
		let segSNPs = 1000 * pct_shared;

		return function(transaction){
			// we cannot tell here if repeat readings are normal or from a forced reread.
			// We just unconditionally update values in case they have been "improved"
			transaction.executeSql('INSERT or REPLACE INTO ibdsegs (id1, id2, chromosome, start, end, cM, snps, "date", build) VALUES(?, ?, 200, -1, ?, 0, ?,  date(),?);', 	[firstid, secondid, segend, segSNPs, current23andMeBuild]);
		};
	}
	// after the first page we don't determine primary pair data.
	if ( primary_pair.pct_shared > 0.0 )
		db23.transaction( makeChr200Transaction(primary_pair.profileID, primary_pair.matchID, primary_pair.pct_shared, 0 ),  insertRowFail, insert_OK);

	for(let i=0; i<page_rows.length; i++){
		let pr=page_rows[i];
		if ( pr.shared_pct_P2B > 0.0 ) {
			db23.transaction( makeChr200Transaction( 
					primary_pair.profileID, pr.ID_icw_relative, pr.shared_pct_P2B, (pr.overlaps === "hidden" )),
					insertRowFail, insert_OK);
		} else {
			let msg = `Chr200 P2B, Bad pct shared: ${pr.shared_pct_P2B}, for ${pr.name_profile} to ${pr.name_icw_relative} olap:${pr.overlaps}.`;
			console.error( msg );
			alert( msg );
		}
		if ( pr.shared_pct_A2B > 0.0 ) {
			db23.transaction( makeChr200Transaction( 
					primary_pair.matchID, pr.ID_icw_relative, pr.shared_pct_A2B, (pr.overlaps === "hidden" )),
					insertRowFail, insert_OK);
		} else {
			let msg = `Chr200 A2B, Bad pct shared: ${pr.shared_pct_A2B}, for ${pr.name_match} to ${pr.name_icw_relative} olap:${pr.overlaps}.`;
			console.error( msg );
			alert( msg );
		}
	}
}