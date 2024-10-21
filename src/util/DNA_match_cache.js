/* utility code to cache some DB data.
** This is a bit ugly, as it is loaded in two different contexts (tabs), and uses global variables.
** This code is called with the return packet from the message passed back from the DB worker.
*/
let profileMatchesMap = new Map();		// all segment matches to profile person we know about so far.
let matchMatchesMap = new Map();		// all the matches we already have to ...?
let sharedSegMapMap = new Map();	// all known 3-way comparisons including profile match person.


function load_match_cache( reqdata ) {
	console.log( 'cache got ', reqdata);
	const origpair = reqdata.pair;
	const profileMatchesArr = reqdata.profileMatches;
	const DNArelMatchesArr = reqdata.DNArelMatches;
	const ICWsetArr = reqdata.ICWset;
	const profileID = origpair.pid
	const profileName = origpair.pname
	const matchID = origpair.pid
	const matchName = origpair.mname
	// unpack the data that has been returned.
	try {
		// Don't need this - worked OK.
		//verifyMatchIDs( profileID, profileName, origpair.pid, origpair.pname);
		//verifyMatchIDs( matchID, matchName, origpair.pid, origpair.mname);
	} catch( e ) {
		console.error( e.message );
		alert( e.message );
		return;
	}
	profileMatchesMap.clear();
	for( let i = 0 ; i < profileMatchesArr.length; i++ ) {
		const nr = profileMatchesArr[i];
		let mkey = nr.ID1;
		// these will be in alpha order, so pick the non-profile ID as the map key
		if ( nr.ID1 === profileID ) {
			mkey = nr.ID2;
		}
		profileMatchesMap.set(mkey, nr);
	}
	matchMatchesMap.clear();
	for( let i = 0 ; i < DNArelMatchesArr.length; i++ ) {
		const nr = DNArelMatchesArr[i];
		let mkey = nr.ID1;
		// these will be in alpha order, so pick the non-profile ID as the map key
		if ( nr.ID1 === matchID ) {
			mkey = nr.ID2;
		}
		matchMatchesMap.set(mkey, nr);
	}
	sharedSegMapMap.clear();
	for( let i = 0 ; i < ICWsetArr.length; i++ ) {
		const nr = ICWsetArr[i];
		let mkey = nr.ID2;
		// these will be in alpha order, so pick the non-profile ID as the map key
		if ( nr.ID2 === matchID ) {
			mkey = nr.ID3;
		}
		sharedSegMapMap.set(mkey, nr);
	}
	if( debug_msg > 0){
		console.log(  `Initial setup with ${profileMatchesMap.size} matches to ${profileName}; ` +
					`${matchMatchesMap.size} matches to ${matchName}; ${sharedSegMapMap.size} saved ICW summaries`);
	}
}


  /*
  ** confirm that the returned ID matches the one originally sent...
  */
  function verifyMatchIDs( id1, n1, id2, n2 ) {
	if( id1 === id2 )
		return;
	let msg = `Unexpected ID values ${id1}(${n1}) and ${id2}(${n2}) should be the same`;
	throw new Error( msg );
}
