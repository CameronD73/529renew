/*
** This code must not run before the DOM has loaded.
* this content script version is for ibdsegment access and ICWs
** Most comments in this file were made trying to interpret the original code and
* do not carry any warranty as to accuracy.
** This version is run using a fifo queue to allow more control over adding delays
* to the server-querying process.
*/
/* eslint no-unused-vars: "off"*/
'use strict';

let div529=document.createElement('div');
div529.id="div529r";

let tr_el=document.createElement('button');
tr_el.innerHTML="Triangulate into 529Renew";
tr_el.id="c529r";
tr_el.title="Shift-click to also include those not sharing a common segment; Alt-click to force rereads even if matches are already in local DB";

var pendingComparisons=0;	// not needed - proxy for queue length - currently retained as sanity check
var pendingPages=false;
var failedInSomeWay=false;

let debug_q = 1;			// if nonzero, add debugging console output relating to Q processing
let debug_msg = 1;			// if nonzero, add debugging console output re message passing
let increment_ms = 2 * 1000;	// timer delay in milliseconds
let minSharedNonOverlap = 0.3;
let closeTabImmediate = false;		// default safe
let alwaysIncludeNonOverlap = true; // default safe

let settingsProcessed = false;		// used by watchdog timeout

const qQueue = new Queue();

// a few more semiglobals relating to this set of triangulation requests
let profileName = null;		// name of primary DNA tester (you?)
let matchName = null;		// name of the dna match for whom we are generating this list of ICW
let matchID = null;			// the UUID string for this dna relative (scraped from url)
let profileID = null;		// UUID string of the profile person ("You")
let loadAllRequested = null;	// if shift key was held when "triangulate" button was clicked
let rereadSegsRequested = null;	// if alt   key was held when "triangulate" button was clicked

let profileMatchesMap = new Map();		// all segment matches to profile person we know about so far.
let matchMatchesMap = new Map();		// all the matches we already have 
let sharedSegMapMap = new Map();	// all known 3-way comparisons including profile match person.

let sharedDNAPrimary = {pct:-1.0, cM:0, hapMat:"", hapPat:""};

var dispatchMouseEvent = function(target, var_args) {
  var e = document.createEvent("MouseEvents");
  e.initEvent.apply(e, Array.prototype.slice.call(arguments, 1));
  target.dispatchEvent(e);
};

function q_debug_log( level, msg ) {
	if ( debug_q > level )
		console.log( msg );
}

/*
** extension updates will invalidate the extension context and not clean up.
** Use this to handle catch() from sendmessage
*/

function handleMessageCatches( location, err ) {
	let msg =  ` failed to send message ${location}\n Message was "${err.message}"`;
	console.error( msg );
	alert( msg + "\nTry closing all tabs or restarting" );
	return;
}
/* run_query
** Start the process to run the query to get DNA segments between pair of matches
** Start by checking if the pair is already in the DB,
*/
function run_query(personaId, personbId, personaName, personbName){
	try {
		chrome.runtime.sendMessage({mode: "checkIfInDatabase", indexId: personaId, matchId: personbId, indexName: personaName, matchName: personbName, forceSegmentUpdate: rereadSegsRequested});
		// passes a "returnNeedCompare" message back to this origin tab, with needToCompare set true/false
	} catch( e ) {
		handleMessageCatches( "in run_query", e );
	}
}

/* this listener handles the return from run_query() and other messages
** The message will set needToCompare to true if we need
** to get the results from 23 and me for inclusion in local DB.
*/
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
	/* this callback is made when the query made via run_query() returns with the required details
	** and decision as to whether ibd data needs to be requested from the 23 and me server.
	*/

	if(request.mode === "returnNeedCompare"){
			// this is the match triangulation set that was just requested to
			// see what we need to do with it.
		let tset = qQueue.dequeue();
		let mat2 = request.matchpair;
		q_debug_log( 1, `        dequeued part${tset.part},  ${tset.pn1} cf ${tset.pn2}; remaining q=${qQueue.length}`);
		// sanity check...
		if ( mat2.indexId != tset.id1  || mat2.matchId != tset.id2 ) {
			let errmsg = `==== URK 529renew bug... ${mat2.indexId} != ${tset.id1} or ${mat2.matchId} != ${tset.id2} \n ` + 
				`==== requested ${mat2.indexName} vs  ${mat2.matchName}, got ${tset.pn1} vs ${tset.pn2}`;
			alert( errmsg );
			console.error( errmsg );
		}
  		if(request.needToCompare==true){
			function makeSegmentSaver(indexName, indexId, matchName, matchId){
				/* This gets called when the ibd_segments xml request is returned.
				** every return path from here should launch_next_IBD_query()
				*/
				return function(){

					if(this.status!=200){
						if( this.status == 429 ){
							console.error("Oops = makesegsaver saw err429 with " + indexName+ " and " + matchName );
						}
						alert("Failed to retrieve comparison of " + indexName+ " and " + matchName +" from 23andMe\nServer returned status of " + this.status);
						if(pendingComparisons>0) pendingComparisons--;
						failedInSomeWay=true;
						launch_next_IBD_query();
						return;
					}
					var data=JSON.parse(this.responseText);
					/* data is an array of objects, each of which is a segment match between two people:
					** each object has 8 records
					*/

					var matchingSegments=new Array();
					var ids=new Array();
					ids[0] = {id: indexId, name: indexName };
					ids[1] = {id: matchId, name: matchName };

					q_debug_log( 0, "    saving segments at " + formattedDate2() + " for " + ids[0].name + " and " + ids[1].name );
					if(data!=null){
						for(let j=0; j<data.length; j++){
							let dat = data[j];
							if ( indexId !== dat.human_id_1 || matchId !== dat.human_id_2 ) {
								msg( `Ident mismatch: asked for${indexId}/${matchId} (${indexName}/${matchName}), but got ${dat.human_id_1}/${dat.human_id_2}`);
								console.error( 'makeSegmentSaver: ' + msg );
								alert( msg );
								break;
							}
							var matchingSegment= {
								name1: indexName,		// name and IDs seem redundant - or else IDs are.
								uid1: indexId,
								name2: matchName,
								uid2: matchId,
								chromosome: dat.chromosome,
								start: dat.start,
								end: dat.end,
								cM: dat.seg_cm,
								snps: dat.num_snps,
								is_fullmatch: dat.is_full_ibd
							};
							if(matchingSegment.start==0)
								matchingSegment.start=1;
							if(String(matchingSegment.chromosome)==="X")
								matchingSegment.chromosome=23;

							matchingSegments[j]=matchingSegment;
						}
					}
					else{
						alert("Failed to retrieve comparison of " + indexName+ " and " + matchName +" from 23andMe");
						if(pendingComparisons>0) pendingComparisons--;
						failedInSomeWay=true;
						launch_next_IBD_query();
						return;
					}
					// Submit for storage in local database
					try {
						chrome.runtime.sendMessage({mode: "storeSegments",  matchingSegments: matchingSegments} );
					} catch( e ) {
						handleMessageCatches( "in storeSegment", e );
					}
					if(pendingComparisons>0) pendingComparisons--;

					launch_next_IBD_query();
					return;

				};
			}
			function makeErrorHandler(indexName, matchName){
				return function(err){
					alert("Failed to retrieve comparison of " + indexName+ " and " + matchName +" from 23andMe");
					if(pendingComparisons>0) pendingComparisons--;
					failedInSomeWay=true;
					launch_next_IBD_query();
					return;
				};
			}
			var compareURL="/tools/ibd/?human_id_1=" + mat2.indexId +"&human_id_2="+mat2.matchId;

			var oReq = new XMLHttpRequest();
			oReq.withCredentials = true;
			oReq.onload=makeSegmentSaver(mat2.indexName, mat2.indexId, mat2.matchName, mat2.matchId);
			oReq.onerror=makeErrorHandler(mat2.indexName, mat2.matchName);
			oReq.open("get", compareURL, true);

			q_debug_log( 2, "    requesting segs after delay at " + formattedTime() + " for " + mat2.indexName + " and " + mat2.matchName );
			setTimeout( () => oReq.send(), increment_ms );
		}
		else{
			q_debug_log( 0,"No need to recompare " + mat2.indexName + " " + mat2.matchName);
			if(pendingComparisons>0) pendingComparisons--;
			launch_next_IBD_query();
		}
		return ;
	} else if( request.mode === "ICWPrelude_return") {
		const origpair = request.data.pair;
		const profileMatchesArr = request.data.profileMatches;
		const DNArelMatchesArr = request.data.DNArelMatches;
		const ICWsetArr = request.data.ICWset;
		// unpack the data that has been returned.
		try {
			verifyMatchIDs( profileID, profileName, origpair.pid, origpair.pname);
			verifyMatchIDs( matchID, matchName, origpair.mid, origpair.mname);
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

	} else
		return false;			// message not handled here
  }
);

  /* confirm that the returned ID matches the one originally sent...
  */
function verifyMatchIDs( id1, n1, id2, n2 ) {
	if( id1 === id2 )
		return;
	let msg = `Unexpected ID values ${id1}(${n1}) and ${id2}(${n2}) should be the same`;
	throw new Error( msg );
}
/*
** callback function to initiate processing the next IBD segment collection
** from the queue
*/
function launch_next_IBD_query() {
	if ( qQueue.length <= 0 ) {
		finishComparisons();
		return;
	}
	let tset = qQueue.peek();
	q_debug_log( 2, `     sending query for ${tset.pn1} and ${tset.pn2}` );
	run_query( tset.id1, tset.id2, tset.pn1, tset.pn2 );
	return;
}
/*
** this function cleans up at the end of runComparison
** It should only get called when the segment request queue is empty
** and all people on the page have been processed.
*/
let pendingMismatches = 0;

function finishComparisons() {

	if( pendingComparisons > 0 || qQueue.length > 0 ) {
		if ( pendingMismatches > 0 ) {
			alert( `program failure - giving up. Cannot finalise with ${pendingComparisons} pending and Q ${qQueue.length}`);
			document.getElementById("c529r").innerHTML="Triangulation into 529Renew failed";
			return;
		}
		alert( `program failure - called finalise with ${pendingComparisons} pending and Q ${qQueue.length}`);
		document.getElementById("c529r").innerHTML=`Triangulation into 529Renew ${pendingComparisons} pending`;
		pendingMismatches++;
		setTimeout( finishComparisons, 5000);
		return;
	}
	pendingMismatches = 0;

	var nextButton=null;
	/*
	* for fewer than 10 entries the paginator bar will be hidden, and
	* the code never hides the "Next" button.
	*/
	var paginator = document.getElementsByClassName("js-paginator");
	if( paginator != null && paginator[0].getAttribute("class").indexOf("hide")>-1  ) {
		pendingPages=false;
		q_debug_log( 2, "    runCompare: hidden pag page at PG= " + paginator[0].getAttribute("class")   );
	}
	else {
		var nextButtons=document.getElementsByClassName("js-next");
		if(nextButtons.length>0){
			q_debug_log( 2, "    runCompare: looking for next btn next page at " + new Date().toISOString()  );
			var container=document.getElementsByClassName("js-relatives-table")[0];
			for(let i=0; i<nextButtons.length; i++){
				if(container.contains(nextButtons[i])) nextButton=nextButtons[i];
			}
		}
		if(nextButton==null || nextButton.getAttribute("class").indexOf("hide")>-1){
			pendingPages=false;
		}
	}
	if( !pendingPages ) {
		if(failedInSomeWay){
			document.getElementById("c529r").innerHTML="Triangulate into 529Renew (failed)";
			// failedInSomeWay=false;
		}
		else{
			document.getElementById("c529r").innerHTML="Triangulation into 529Renew Completed";
		}
	}
	else{
		// Go to the next page and process it...
		q_debug_log( 0, "    runCompare: to next page at " + new Date().toISOString()  );
		dispatchMouseEvent(nextButton, 'click', true, true);
		// give it a bit of time to populate the next 10 matches
		setTimeout(function(){runComparison(true);}, 2000);
		return;
	}

	q_debug_log( 0, "    comparisons finished at " + new Date().toISOString()  );
	if ( (!failedInSomeWay) && closeTabImmediate) {
		try {
			chrome.runtime.sendMessage({mode: "killMeNow"} );
		} catch( e ) {
			console.error( `failed to kill completed tab for ${profileName} cf $${matchName}: err ${e.message}`);
		}
	}
}

/*
** function to extract the percent DNA shared shown in a cell of 
** the "relatives  in common" table.
** in:
** 		row_n is the document object for one row
**		classtext is either "remote-profile" or "local-profile", specifying which cell to examine
** return:
**		a Number representing the percent DNA shared, or -1.0 if none found (error?)
*/
function get_pct_shared( row_n, classtext ) {
	let percentShared = -1.0;
	for(let j=0; j<row_n.children.length; j++){
		if(row_n.children[j].hasAttribute("class")){
			if(row_n.children[j].getAttribute("class").indexOf(classtext)<0)
				continue;		// not the one we want
			let match_cell = row_n.children[j];
			for(let k=0; k<match_cell.children.length; k++){
				// two lines, but not identified by class.
				// first is relationship: typically "nth Cousin", but could be father, mother, aunt, etc
				// 2nd is percent shared, e.g. "(0.18)"
				let itext = match_cell.children[k].innerText;
				let oparen = itext.indexOf( '(' );
				if ( oparen < 0 )
					continue;
				let cparen = itext.indexOf( ')' );
				if ( cparen < 0 )
					continue;
				percentShared = Number( itext.substring( oparen+1, cparen ));

			}
		}
	}
	return percentShared;
}
/*
** find DNA match amount, plus haplogroups for the comparison between profile person and DNA relative.
*/
function get_primary_match_details() {
	let shared_pct = 0.0;
	let shared_cM = 0.0;
	let hapPat = "";
	let hapMat = "";

	let  sharedBlock=document.getElementsByClassName("js-shared-dna-percentage");
	for(let i=0; i<sharedBlock.length; i++){
		let sb = sharedBlock[i];
		q_debug_log(1, `Primary shared DNA full text is ${sb.innerText}`);
		for( let j=0; j < sb.children.length; j++) {
			if(sb.children[j].hasAttribute("class")){
				if(sb.children[j].getAttribute("class").indexOf("js-label-content") >= 0) {
					let itext = sb.children[j].innerText;
					// content will be a number followed by percent sign.
					let pctloc = itext.indexOf( '%' );
					if ( pctloc > 0) {
						shared_pct = Number( itext.substring( 0, pctloc ));
					} else  {
						shared_pct = Number( itext );
					} 
				}
				else if(sb.children[j].getAttribute("class").indexOf("js-centimorgan") >= 0) {
					let itext = sb.children[j].innerText;
					let cloc = itext.indexOf( "cM" );
					if ( cloc > 0) {
						shared_cM = Number( itext.substring( 0, cloc ));
					} else  {
						shared_cM = Number( itext );
					} 
				}
			}
		}
	}
	try {
		let matsel = document.querySelector(".js-maternal-haplogroup .js-haplogroup-name-remote");
		if (matsel) {
			hapMat = matsel.innerText;
		}
		matsel = document.querySelector(".js-paternal-haplogroup .js-haplogroup-name-remote");
		if (matsel) {
			hapPat = matsel.innerText;
		}
		chrome.runtime.sendMessage({mode: "update_haplogroups",  matchHapData: {$mid:matchID, $mname:matchName, $hapMat:hapMat, $hapPat:hapPat}} );
	}
	catch(e){
		hapPat = "error parsing page";
		hapMat = "error parsing page";
	}
	
	if(shared_cM == 0.0){
		shared_cM = pctShared2cM( shared_pct );
	}
	return( {pct:shared_pct, cM:shared_cM, hapPat:hapPat, hapMat:hapMat });
}

/*
** function to extract the ICW relative's ID a cell of 
** the "relatives  in common" table.
** in:
** 		match_cell - the html_collection object with the structure:
**			A - url
**				DIV class avatar (etc) - has image
**				DIV class name - the text of the name
**			/A
** return:
**		an array of two strings: [UUID, name]
*/
function get_icw_details( name_cell ) {
	let ID = null;
	let icw_name = null;

		// extract profile ID from url...
		// href text is ="/profile/xxxxxxxxxxxx/" (but the href request will prefix with root)
	let urltext = name_cell.href;
	let profindex = urltext.indexOf( "profile");
	let parts = urltext.substring( profindex + 4 ).split( "/" );
	if ( parts[1].length == 16 ) {
		ID = parts[1];
	} 
	// extract name from inside...
	for(let k=0; k<name_cell.children.length; k++){
		if(name_cell.children[k].hasAttribute("class")){
			if(name_cell.children[k].getAttribute("class").indexOf("name")<0) continue;
			let nametemp = name_cell.children[k].innerText;
			if( nametemp!==null && nametemp.length > 0){
				icw_name=nametemp;
				break;
			}
		}
	}
	if ( ID === null ) {
		let msg = `ICW: Failed to find ID for ${icw_name} in ${urltext}, index ${profindex}, parts are ${parts.length} long`;
		console.error( msg );
		alert( msg );
	}
	if ( icw_name === null ) {
		let msg = `ICW: Failed to find name for ID ${ID}`;
		console.error( msg );
		alert( msg );
	}
	return [ ID, icw_name];
}

/*
** this function is run to process a page of (up to 10) shared matches.
** The "primaryComparison" is that between the profile person and personA
** (the match against whom all the ICW/triangulations are being compared in this page)
** This code reads the page and loads all required matches into the processing queue
*/

function runComparison(ranPrimaryComparison ){
	var row_container=null;
	// match data is array of objects, one per each ICW relative in the table
	var match_data = [];
	let any_hidden = false;

	q_debug_log( 0, "runComparison: entry: for " + matchName + " with profile " + profileName  );
	try{
		// js-relatives-table is the DIV showing relatives in common between you and person A, normally shows:
		// headers - table header line
		// js-rows -  2 DIVs with block of rows of relatives (one for mobile, one for desktop)
		// js-paginator - the navigation row at the bottom with page numbers, next, prev
		// each row of table is a DIV, class "row"
		// each row is 4 elements, each has class "cell", plus identifying class:
			// A - ICW relative - this is person B
			// DIV - "local-profile" relation and shared DNA between person B and profile person ("You")
			// DIV - "remote-profile" relation and shared DNA  between person A and person B
			// DIV - "shared-dna" - whether there is overlap: yes/no/connect
			// Sept 2023 the last column changed to 'DNA Overlap' and just says "Compare" instead of yes/no
		let rows=document.getElementsByClassName("js-rows");
		if(rows.length<1) throw new Error("Wrong row length");
		let container=document.getElementsByClassName("js-relatives-table");
		if(container.length!=1) throw new Error("Wrong container length");
		container=container[0];
		let row_index=-1;
		for(let i=0; i<rows.length; i++){
			if(container.contains(rows[i])){
				if(rows[i].hasAttribute("class")){
					if(rows[i].getAttribute("class").indexOf("hide-for-mobile")<0) continue;
				}
				if(row_index!=-1) throw new Error("Too many rows in container");
				row_index=i;
			}
		}
		if(row_index==-1) throw new Error("No valid rows");
		row_container=rows[row_index];

	}
	catch(e){
		alert("Failed to extract list of matches from page\n"+e.message);
		return;
	}
	if(row_container.getAttribute("class").indexOf("sd-loadingstate") >= 0){
		setTimeout(function(){runComparison(ranPrimaryComparison);}, 1000);
		return;
	}
	var foundData=true;		// TEMPORARY while there is no chromosome browser
	var number_of_rows = row_container.children.length;
	q_debug_log( 1, " checking " + number_of_rows + " rows" );
	// typically here the row_container has up to 10 rows of ICWs
	for(let i=0; i<number_of_rows; i++){
		let row_n = row_container.children[i]
		match_data[i] = {};

		if( !row_n.hasAttribute("class"))
			continue;
		if(row_n.getAttribute("class").indexOf("row")<0)
			continue;
		let remote_shared_pct = get_pct_shared( row_n, "remote-profile" );
		let local_shared_pct = get_pct_shared( row_n, "local-profile" );
		match_data[i].shared_pct_A2B = remote_shared_pct;
		match_data[i].shared_pct_P2B = local_shared_pct;
		match_data[i].name_profile = profileName;
		match_data[i].name_match = matchName;
		let hidden = false;

		var ids=null;
		var relative_in_common_name=null;
		let overlap_status = "unknown";
		let get_segments = false;
		for(let j=0; j<row_n.children.length; j++){
			if(row_n.children[j].hasAttribute("class")){
				if(row_n.children[j].getAttribute("class").indexOf("relative-in-common")>=0) {
					let name_cell = row_n.children[j];
					let ID_ICW = null;
					[ ID_ICW , relative_in_common_name ] = get_icw_details( name_cell );
					match_data[i].ID_icw_relative = ID_ICW;
					continue;
				}
				if(row_n.children[j].getAttribute("class").indexOf("shared-dna")<0)
					continue;
				let dna_cell = row_n.children[j]; // actually the DNA overlap cell - 3-way shared, not 2-way percentage
				for(let k=0; k<dna_cell.children.length; k++){

					if(dna_cell.children[k].href!=null){

						var yes_no_text=dna_cell.children[k].innerText.toLowerCase();
						if(yes_no_text==null) continue;
						if(yes_no_text=="compare") {
							overlap_status =  "undisclosed";
							loadAllRequested  = true;		// when yes/no options have gone then we need to view everything
						} else {
							overlap_status =  yes_no_text=="yes" ? "yes" : ( yes_no_text=="no" ? "no" : "hidden" );
						}
						match_data[i].overlaps = overlap_status;
						if(yes_no_text=="yes" || yes_no_text=="no" || yes_no_text== "compare") {
							foundData=true;
						} else if(yes_no_text=="share to see" || yes_no_text=="connect to view"  || yes_no_text=="request sent" ) {
							// I think the "share to see" was replaced by "connect to view"
							// can also get "Request sent"  when a request to connect has been initiated
							foundData=true;
							hidden = true;  // possibly redundant
							continue;
						}
						if( yes_no_text=="yes" || loadAllRequested ) {
							get_segments = true;
						}

						// parse the url to get the 3 profile IDs
						var index=dna_cell.children[k].href.indexOf("p[]=");
						if(index<0) continue;

						index+=4;
						ids=dna_cell.children[k].href.substring(index).split("&p[]=");
						if(ids.length!=3){
							ids=null;
							continue;
						}
						for(let m=0; m<3; m++){
							if(ids[m].length!=16){
								ids=null;
								break;
							}
						}
						match_data[i].ID_profile = ids[0];
						match_data[i].ID_match = ids[1];
						match_data[i].ID_icw_relative = ids[2];
					}
				}
			}
		}
		match_data[i].is_hidden = (hidden || (overlap_status === "hidden"));
		any_hidden = any_hidden || hidden || (overlap_status === "hidden"); 
		match_data[i].name_icw_relative = relative_in_common_name;
		if(relative_in_common_name==null) continue;
		if(ids==null) continue;
		

		if(!ranPrimaryComparison){
			qQueue.enqueue( {part:1, id1: ids[1], id2: ids[0], pn1: matchName, pn2:profileName, pct_shared:sharedDNAPrimary.pct} );
			q_debug_log( 2, `Added to Q0: ${matchName} and ${profileName} (sharing ${sharedDNAPrimary.pct}%)`);
			if ( profileID === null ) {
				profileID = ids[0];
			} else 
			pendingComparisons++;
			document.getElementById("c529r").innerHTML="Collecting DNA segments....";
			ranPrimaryComparison=true;
		}
		if( !get_segments )  continue;
		if( overlap_status == "yes" || overlap_status == "undisclosed" ||  remote_shared_pct >= minSharedNonOverlap ) {
			qQueue.enqueue( {part:2, id1: ids[1], id2: ids[2], pn1: matchName, pn2: relative_in_common_name, pct_shared:remote_shared_pct} );
			q_debug_log( 2, `Added to Q1: ${matchName} and ${relative_in_common_name} (sharing ${remote_shared_pct}%)`);
			if( matchID != ids[1] ) {
				let msg=`ID of match person swapped: was ${matchID}, became ${ids[1]} at  ${relative_in_common_name}.`;
				console.error( msg );
				alert( msg );
			}
			pendingComparisons++;
		}
		if( overlap_status == "yes" || overlap_status == "undisclosed" ||  local_shared_pct >= minSharedNonOverlap ) {
			qQueue.enqueue( {part:3, id1: ids[2], id2: ids[0], pn1: relative_in_common_name, pn2: profileName, pct_shared:local_shared_pct} );
			q_debug_log( 2, `Added to Q2: ${relative_in_common_name} and ${profileName} (sharing ${local_shared_pct}%)`);
			if( profileID != ids[0] ) {
				let msg=`ID of profile person swapped: was ${profileID}, became ${ids[0]} at  ${relative_in_common_name}.`;
				console.error( msg );
				alert( msg );
			}
			pendingComparisons++;
		}
	}
	if ( debug_q > 0 ) {
		console.log( `comparing ${profileName} and ${matchName} (sharing ${sharedDNAPrimary.pct}%) with min ${minSharedNonOverlap}%:`);
		for( let i = 0 ; i < match_data.length ; i++ ) {
			let md = match_data[i];
			console.log( `   Row ${i}: ${md.name_icw_relative} (ID:${md.ID_icw_relative}) overlap: ${md.overlaps}; sharing ${md.shared_pct_P2B} to profile & ${md.shared_pct_A2B} to match`);
		}
	}
	
	if(!foundData){
		failedInSomeWay = true;
		if( number_of_rows == 0 ) {
			alert( 'No rows found, maybe you forgot to click "find Relatives in common"\nYou will need refresh this page first.' );
		} else {
			alert("Failed to parse Relatives in Common table - Q len: " + qQueue.length);
		}
		launch_next_IBD_query();
		return;
	}

	// save the chr 200 records...
	if( any_hidden ) {
		let primary_match = { matchName: matchName, profileName:profileName, matchID: matchID, profileID:profileID, pct_shared:sharedDNAPrimary.pct};
		try {
			chrome.runtime.sendMessage({mode: "store_hidden", primary:primary_match, matchData:match_data } );
		} catch( e ) {
			handleMessageCatches( "saving hidden", e );
		}
	}
	document.getElementById("c529r").innerHTML="Collecting DNA segments...";
	launch_next_IBD_query();
	return;

}



function peelContainerByClassSoft(container, className){
	if(!container.hasChildNodes()) return null;
	for(let i=0; i<container.children.length; i++){
		if(!container.children[i].hasAttributes()) continue;
		if(!container.children[i].hasAttribute("class")) continue;
		if(!(container.children[i].getAttribute("class").indexOf(className)>-1)) continue;
		return container.children[i];
	}
	return null;
}


function getMatchName3(){
	try{
		var matchNames = document.getElementsByClassName("js-profile-name");
		if(matchNames.length!=1) return null;
		return matchNames[0].innerText;
	}
	catch(e){
		return null;
	}
}
function getMatchId(){
	var url_components = window.location.pathname.split('/');
	if(url_components == null) return null;
	if(url_components.length == 0) return null;
	if(url_components.length==6 && url_components[0].length==0
	  && url_components[1]=="p" && url_components[2].length==16
	  && url_components[3]=="profile"
	  && url_components[4].length==16
	  && url_components[5].length==0 ){
	  	return url_components[4];
	}
	if(url_components.length==4 && url_components[0].length==0
	  && url_components[1]=="profile"
	  && url_components[2].length==16
	  && url_components[3].length==0){
	  	return url_components[2];
	  }
	return null;
}


function getMyName(){
	try{

		var container = document.getElementsByClassName("profile-in-dropdown")[0];
		container=peelContainerByClassSoft(container, "name");

		var firstName=container.children[0].innerHTML.trim();
		var lastName=container.children[1].innerHTML.trim();
		var fullName=firstName+ " " + lastName;

		return fullName;
	}
	catch(err){
		// what is the point? ignore errors?
		return null;

	}
}

// A timeout routine to trap situations where the results tab is not running.
function watchdogTimer() {
	if (!settingsProcessed) {
		let msg = "No response from Results Tab to settings request - is it running?";
		console.error( msg );
		alert( msg );
	}
}
/*
** this function handles the "get triangulation data" button.
** It scrapes the page for names
** shift-click will include segments of non-overlapping matches
** Alt-click will reload existing values (default is to skip existing ones)
*/
tr_el.onclick=function(evt){
	var loaded=false;
	//alert( 'Not yet available until I can test that it works with potentially modified 23andMe pages');
	//return;
	try{
		let temp3=document.getElementsByClassName("js-relatives-table")[0];
		if(temp3 == null) throw new Error("Page structure changed");
		let classlist = temp3.classList;
		for( let k=0; k < classlist.length; k++){
			if ( classlist[k] === "hide") throw new Error("Not clicked");
		}

	}
	catch(e){
		alert( 'You need to click "Find relatives on common" first\n or else it has not finished loading');
		return;
	}

	if(tr_el.innerHTML=="Triangulation into 529Renew Completed") return;

	var personaName=getMatchName3();
	if(personaName==null){
		alert("Unable to find match name on page");
		return;
	}

	var localName=getMyName();
	if(localName==null || localName.length==0){
		alert("Unable to find your name on page");
		return;
	}
	var personAID=getMatchId();

	tr_el.innerHTML="Collecting ICW and any DNA segments..";
	pendingPages=true;

	profileName = localName;
	matchName = personaName;
	matchID = personAID;

	loadAllRequested = ( evt.shiftKey || alwaysIncludeNonOverlap );
	rereadSegsRequested = evt.altKey;

	// after we get the current settings (especially the delay) then we start the data collection
	try {
		settingsProcessed = false;
		setTimeout( watchdogTimer, 5000 );
		chrome.runtime.sendMessage({mode: "getSettingObj" }, ( resp ) => {
				if ( debug_msg > 0 ) {
					console.log( `getSettings callback with ${resp}`);
				}
				if ( resp === undefined ) {
					handleMessageCatches( "getting settings", chrome.runtime.lastError );
				} else {
					process_settings_then_compare( resp );
				}
			}
		);
	} catch( e ) {
		// never catches anything!?
		handleMessageCatches( "getting options", e );
	}
}


function process_settings_then_compare( response ) {
	settingsProcessed = true;
	if ( response.hasOwnProperty('qDelay') ) {
		increment_ms = response.qDelay * 1000.0;
	}
	if ( response.hasOwnProperty('minSharedNonOverlap') ) {
		minSharedNonOverlap = response.minSharedNonOverlap;
	}
	if ( response.hasOwnProperty('alwaysIncludeNonOverlap') ) {
		alwaysIncludeNonOverlap = (response.alwaysIncludeNonOverlap == 0 ? false : true);
	}
	if ( response.hasOwnProperty('closeTabImmediate') ) {
		closeTabImmediate = (response.closeTabImmediate == 0 ? false : true);
	}
	if ( response.hasOwnProperty('debug_q') ) {
		debug_q = response.debug_q;
	}
	if ( response.hasOwnProperty('debug_msg') ) {
		debug_msg = response.debug_msg;
	}
	failedInSomeWay = false;		// reset just in case.
	runComparison(false);
};

/*
** this creates the button and action to open the tab to display results.
The process is:
**	 1 send a message to the service worker script
**   2. it decides whether to create new tab or load ID into existing one.
*/
div529.appendChild(tr_el);

let b529r=document.createElement('button');
b529r.id="b529r";
b529r.innerHTML="Open";
b529r.style.marginLeft='10px';
b529r.onclick=function(){
	var query=getMatchId();
	if(query!=null){
		query="?id="+query;
	}
	else query="";

	try {
		chrome.runtime.sendMessage({mode: "displayPage", url:chrome.runtime.getURL('results_tab.html')+query} );
	} catch( e ) {
		handleMessageCatches( "opening results tab", e );
	}
};
let img=document.createElement('img');
img.src=chrome.runtime.getURL("logos/529renew-48.png");
img.style.verticalAlign='middle';
b529r.appendChild(img);

div529.appendChild(b529r);

let ric_parent=document.getElementsByClassName("js-profile-relatives-in-common")[0];
let modules=document.getElementsByClassName("module-content");
if(ric_parent!=null && modules!=null){
	var i;
	for(i=0; i<modules.length; i++){
		if(ric_parent.contains(modules[i])) modules[i].appendChild(div529);
	}
}
// extract the match ID from the page URL...
let thisurl = document.URL;
console.log( `This tabs URL is "${thisurl}"`);
if ( thisurl.length > 0 ) {
	const sstr = "23andme.com/profile/";
	let urlpos =  thisurl.indexOf( sstr );
	if ( urlpos > 0 ) {
		let stpos = urlpos+sstr.length;
		let endpos = stpos + 16;
		let newID = thisurl.substring( stpos, endpos );
		if ( newID.length == 16 ) {
			matchID = newID;
		} else {
			msg = `error finding match ID from url: ${thisurl} gives ${newID}, length ${newID.length}`;
			console.error( msg );
			alert( msg );
		}
	}
}

//  find the match person' name
const matchNameElems = document.getElementsByClassName("basic-info-name-title");
matchName = matchNameElems[0].innerText;

// now get the profile person's ID and name
[profileID, profileName] =  get_profile_from_header();


console.log( `Found profile ${profileID} (${profileName}) and match ${matchID} (${matchName})` );

try {
	validate_ID( profileID );
	validate_ID( matchID );
} catch( e )  {
	let errmsg = `Invalid ID code found: ${e.message}`;
	alert( errmsg );
	console.error( errmsg );
}
// 
try {
	chrome.runtime.sendMessage({mode: "get_ICW_prelude",  matchpair: {pid: profileID, pname: profileName, mid:matchID, mname:matchName}} );
} catch( e ) {
	handleMessageCatches( "in storeSegment", e );
}

/*
** now scan the page and extract dna summary for primary match
*/
sharedDNAPrimary = get_primary_match_details();