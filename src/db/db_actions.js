/*
** some of the activities related to handling data flow in/out of the DB.
*/

/*  eslint-disable no-unused-vars */
"use strict";

db_conlog( 1, "loading DB actions");

function updateDNAtesterlist( results ) {
	DNAtesters.clear();
	for( let i = 0 ; i < results.length; i++ ) {
		const nr = results[i];
		DNAtesters.set( nr.IDText, {ID:nr.IDText, name: nr.name});
	}
}
/*
** checkIfInDatabase() called by message listener.
**  sends reply back to sender in request mode: returnNeedCompare
** with reply.needToCompare set true of false.
** If true then caller should then request from (23 and me) the segment match details between these two testers.
*/

function checkIfInDatabase( request, sender ) {
	db_conlog( 1, "InDB checking " + request.mode );
	let matchpair={indexId: request.indexId, matchId: request.matchId, indexName: request.indexName, matchName: request.matchName};
	if(request.forceSegmentUpdate){
		// Skip database query
		db_conlog( 2, `CheckIfInDB - forcing reread ${request.indexName} vs ${request.matchName}`);
		chrome.tabs.sendMessage(sender.tab.id, {mode: "returnNeedCompare", matchpair:matchpair, needToCompare: true});
		return;
	}

	DBworker.postMessage( { reason: 'checkIfInDatabase', matchpair: matchpair, tabID: sender.tab.id });
	return;
}

/*
** store a matching segment.
** This code works both for message passing and for local use, as it sends no messages back.
** However I don't think the latter situation occurs now.
** The request is an object, with:
** mode: "storeSegments",
** matchingSegments - an array of objects - each object has details about one matching segment
*/

function storeSegments(request) {
	let profileIDs = new Array();	// an array of the ID string for quick lookup
	for(let i=0; i<profile_summary.length; i++){
		profileIDs[i] = profile_summary[i].IDprofile;
	}

	const aliasToAdd = new Map();
	const matchesMap = new Map();    // there should only be a single entry, but use a Map as it is required by the function in DBwasm
	const DNArelsMap = new Map();
	const segsMap = new Map();
	const fullSegsMap = new Map();
	let seg0 = request.matchingSegments[0];
	let id1 = seg0.uid1;
	let id2 = seg0.uid2;
	if( ! DNAtesters.has( id1 ) ) {
		aliasToAdd.set( id1, {$k:id1, $name:seg0.name1 });
		DNAtesters.set( id1, {ID:id1, name:seg0.name1 });
	}
	if( ! DNAtesters.has( id2 ) ) {
		aliasToAdd.set( id2, {$k:id2, $name:seg0.name2 });
		DNAtesters.set( id1, {ID:id2, name:seg0.name2 });
	}

	if ( id2 < id1 ) {
		let temp = id2;
		id2 = id1;
		id1 = temp;
	}
	let matchkey = id1 + "_" + id2;
	matchesMap.set( matchkey, {$id1: id1, $id2: id2, $ishidden: 0, $cMtotal : 0, $pctshared:0 , $nsegs: 0, $hasSegs: 0} );
	// we should have caught all new DNArelatives elsewhere, but, just in case...
	if ( profileIDs.indexOf(id1)) {
		DNArelsMap.set( matchkey, {$id1: id1, $id2: id2, $note:'unexpected addition via saveSegs'} );
	}
	if ( profileIDs.indexOf(id2)) {
		let swapkey =  id2 + "_" + id1;
		DNArelsMap.set( swapkey, {$id1: id2, $id2: id1, $note:'unexpected addition via saveSegs'} );
	}
	
	let cmtotal = 0.0;
	let nsegs = 0;
	for(let i=0; i<request.matchingSegments.length; i++){
		let thisSeg = request.matchingSegments[i];
		let segkey = id1 + "_" + id2 + "_" + thisSeg.chromosome + "_" + thisSeg.start;
		if ( thisSeg.is_fullmatch) {
			fullSegsMap.set( segkey,  {$id1: id1, $id2: id2,
								$chromosome: thisSeg.chromosome,
								$cM: round_cM(thisSeg.cM),
								$snps: thisSeg.snps,
								$start:thisSeg.start,
								$end: thisSeg.end
				} );
		} else {
			segsMap.set( segkey,  {$id1: id1, $id2: id2,
								$chromosome: thisSeg.chromosome,
								$cM: round_cM(thisSeg.cM),
								$snps: thisSeg.snps,
								$start:thisSeg.start,
								$end: thisSeg.end
			} );
			nsegs++;
		}
		cmtotal += thisSeg.cM;		// 23 and me count each strand of full IDB, so we add one length for full.
	}
	if ( nsegs > 0 ) {
		matchesMap.get( matchkey ).$cMtotal = round_cM( cmtotal);
		matchesMap.get( matchkey ).$hasSegs = 1;
		matchesMap.get( matchkey ).$nsegs = nsegs;
	}

	DBworker.postMessage( { reason: 'insertNewAliasAndSegs', amap: aliasToAdd, smap: segsMap, fullsmap:fullSegsMap, mmap:matchesMap, rmap:DNArelsMap, useReplace: true });
}

/*
** in:
**  primary_pair : object with IDs and Names of profile person and DNA relative being viewed.
**			You'd think primary_pair was redundant because hte same values are in each row, BUT
**			this is only the case _except_ with hidden segments.
**  page_rows : is array of objects detailing useful contents of ICW table.
**				each row will have a flag indicating if one of that pair has hidden results.
*/

function save_hidden_records( primary_pair, page_rows ) {

	const aliasToAdd = new Map();
	for(let i=0; i<page_rows.length; i++){
		// Attempt to insert these two number, name combos
		let pr=page_rows[i];		// is an object of the i'th row
		if( pr.is_hidden ) {
			let id1 = pr.ID_icw_relative;
			db_conlog( 2, `save_hidden_records: alias ${i} for ${pr.name_icw_relative}}`);
			// there are 3 IDs in the match, but profile and match should have been stored already
			if( ! DNAtesters.has( id1 ) ) {
				aliasToAdd.set( id1, {$k:id1, $name:pr.name_icw_relative });
				DNAtesters.set( id1, {ID:id1, name:pr.name_icw_relative});
			}
		}
	}
	let hiddenMap = new Map();

	for(let i=0; i<page_rows.length; i++){
		let pr=page_rows[i];
		if( pr.is_hidden ) {
			if ( pr.shared_pct_P2B > 0.0 ) {
				let id1 = primary_pair.profileID;
				let id2 = pr.ID_icw_relative;
				if ( id2 < id1 ) {
					let temp = id2;
					id2 = id1;
					id1 = temp;
				}
				let matchkey = id1 + "_" + id2;
				let pctsh = pr.shared_pct_P2B;
				let cMtotal = pctShared2cM( pctsh );
				hiddenMap.set(matchkey, {$id1: id1, $id2: id2, $ishidden: 1, $cMtotal: cMtotal, $pctshared : pctsh, $nsegs: 0, $hasSegs: 0 });
			}

			if ( pr.shared_pct_A2B > 0.0 ) {
				let id1 = primary_pair.matchID;
				let id2 = pr.ID_icw_relative;
				if ( id2 < id1 ) {
					let temp = id2;
					id2 = id1;
					id1 = temp;
				}
				let matchkey = id1 + "_" + id2;
				let pctsh = pr.shared_pct_A2B;
				let cMtotal = pctShared2cM( pctsh );
				hiddenMap.set(matchkey, {$id1: id1, $id2: id2, $ishidden: 1, $cMtotal: cMtotal, $pctshared : pctsh, $nsegs: 0, $hasSegs: 0 });
			}
		}
	}
	DBworker.postMessage( { reason: 'insertHiddenMap', amap: aliasToAdd, hmap: hiddenMap, useReplace: true });
}