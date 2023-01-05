/*
* this content script version is for ibdsegment access.
** Most comments in this file were made trying to interpret the original code and
* do not carry any warranty as to accuracy.
** This version is run using a fifo queue to allow more control over adding delays
* to the server-querying process.
*/
/* eslint no-unused-vars: "off"*/
'use strict';

let div=document.createElement('div');
div.id="div529r";

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
//let queued_requests = 0;	// no longer used

const qQueue = new Queue();
// a few more semiglobals relating to this set of triangulation requests
let profileName = null;		// name of primary DNA tester (you?)
let matchName = null;		// name of the dna match for whom we are generating this list of ICW
let loadAllRequested = null;	// if shift key was held when "triangulate" button was clicked
let rereadSegsRequested = null;	// if alt   key was held when "triangulate" button was clicked

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
/*launch_next_IBD_query
** Start the process to run the query to get DNA segments between pair of matches
** Start by checking if the pair is already in the DB,
*/
function run_query(personaId, personbId, personaName, personbName){
	try {
		chrome.runtime.sendMessage({mode: "checkIfInDatabase", indexId: personaId, matchId: personbId, indexName: personaName, matchName: personbName, forceSegmentUpdate: rereadSegsRequested});
	} catch( e ) {
		handleMessageCatches( "in run_query", e );
	}
}

/* this listener handles the return from run_query()
** The message will set needToCompare to true if we need
** to get the results from 23 and me for inclusion in local DB.
*/
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
	/* this callback is made when the query made via run_query() returns with the required details
	** and decision as to whether ibd data needs to be requested from the 23 and me server.
	*/

	if(request.mode == "returnNeedCompare"){
			// this is the match triangulation set that was just requested to
			// see what we need to do with it.
		let tset = qQueue.dequeue();
		q_debug_log( 1, `        dequeued part${tset.part},  ${tset.pn1} cf ${tset.pn2}; remaining q=${qQueue.length}`);
		// sanity check...
		if ( request.indexId != tset.id1  || request.matchId != tset.id2 ) {
			let errmsg = `==== URK 529renew bug... ${request.indexId} != ${tset.id1} or ${request.matchId} != ${tset.id2} \n ` + 
				`==== requested ${request.indexName} vs  ${request.matchName}, got ${tset.pn1} vs ${tset.pn2}`;
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

					q_debug_log( 0, "    saving segments at " + new Date().toISOString() + " for " + ids[0].name + " and " + ids[1].name );
					if(data!=null){
						for(let j=0; j<data.length; j++){
							var matchingSegment= {
								name1: indexName,
								uid1: indexId,
								name2: matchName,
								uid2: matchId,
								chromosome: data[j].chromosome,
								start: data[j].start,
								end: data[j].end,
								cM: data[j].seg_cm,
								snps: data[j].num_snps,
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
						chrome.runtime.sendMessage({mode: "storeSegments", ids: ids, matchingSegments: matchingSegments} );
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
			var compareURL="/tools/ibd/?human_id_1=" + request.indexId +"&human_id_2="+request.matchId;

			var oReq = new XMLHttpRequest();
			oReq.withCredentials = true;
			oReq.onload=makeSegmentSaver(request.indexName, request.indexId, request.matchName, request.matchId);
			oReq.onerror=makeErrorHandler(request.indexName, request.matchName);
			oReq.open("get", compareURL, true);

			q_debug_log( 2, "    requesting segs after delay at " + new Date().toISOString() + " for " + request.indexName + " and " + request.matchName );
			setTimeout( () => oReq.send(), increment_ms );
		}
		else{
			q_debug_log( 0,"No need to recompare " + request.indexName + " " + request.matchName);
			if(pendingComparisons>0) pendingComparisons--;
			launch_next_IBD_query();
		}
	}
  });

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
			failedInSomeWay=false;
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
/* and the same for the comparison between profile person and DNA relative.
*/
function get_pct_shared_primary() {
	let shared_pct = 0.0;
	let shared_cM = 0.0;
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
	return( {pct:shared_pct, cM:shared_cM});
}
/*
** this function is run to process a page of (up to 10) shared matches.
** The "primaryComparison" is that between the profile person and personA
** (the match against whom all the ICW/triangulations are being compared in this page)
** This code reads the page and loads all required matches into teh processing queue
*/

function runComparison(ranPrimaryComparison ){
	var row_container=null;
	// match data is array of objects, one per each ICW relative in the table
	var match_data = [];

	q_debug_log( 0, "runComp: entry: for " + matchName + " and " + profileName  );
	let sharedDNAPrimary = {pct:-1.0, cM:0};
	if ( !ranPrimaryComparison ) {
		sharedDNAPrimary = get_pct_shared_primary();
	}
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
		let rows=document.getElementsByClassName("js-rows");
		if(rows.length<1) throw "Wrong row length";
		let container=document.getElementsByClassName("js-relatives-table");
		if(container.length!=1) throw "Wrong container length";
		container=container[0];
		let row_index=-1;
		for(let i=0; i<rows.length; i++){
			if(container.contains(rows[i])){
				if(rows[i].hasAttribute("class")){
					if(rows[i].getAttribute("class").indexOf("hide-for-mobile")<0) continue;
				}
				if(row_index!=-1) throw "Too many rows in container";
				row_index=i;
			}
		}
		if(row_index==-1) throw "No valid rows";
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
	var foundData=false;
	q_debug_log( 1, " checking " + row_container.children.length + " rows" );
	// typically here the row_container has up to 10 rows of ICWs
	for(let i=0; i<row_container.children.length; i++){
		let row_n = row_container.children[i]
		match_data[i] = new Map();

		if( !row_n.hasAttribute("class"))
			continue;
		if(row_n.getAttribute("class").indexOf("row")<0)
			continue;
		let remote_shared_pct = get_pct_shared( row_n, "remote-profile" );
		let local_shared_pct = get_pct_shared( row_n, "local-profile" );
		match_data[i].set( "shared_pct_A2B",remote_shared_pct );
		match_data[i].set( "shared_pct_P2B",local_shared_pct );
		match_data[i].set( "name_profile", profileName );
		match_data[i].set( "name_match", matchName );

		var ids=null;
		var relative_in_common_name=null;
		let overlap_status = "unknown";
		let get_segments = false;
		for(let j=0; j<row_n.children.length; j++){
			if(row_n.children[j].hasAttribute("class")){
				if(row_n.children[j].getAttribute("class").indexOf("shared-dna")<0) continue;
				let dna_cell = row_n.children[j];
				for(let k=0; k<dna_cell.children.length; k++){

					if(dna_cell.children[k].href!=null){

						var yes_no_text=dna_cell.children[k].innerText.toLowerCase();
						if(yes_no_text==null) continue;
						overlap_status =  yes_no_text=="yes" ? "yes" : ( yes_no_text=="no" ? "no" : "hidden" );
						match_data[i].set( "overlaps", overlap_status );
						// I think the "share to see" was replaced by "connect to view"
						if(yes_no_text=="yes" || yes_no_text=="no" || yes_no_text=="share to see" || yes_no_text=="connect to view") foundData=true;
						if(yes_no_text=="share to see" || yes_no_text=="connect to view") continue;
						if( yes_no_text=="yes" )
							get_segments = true;
						else {
							if ( loadAllRequested ) 
								get_segments = true;
							// else if ( remote_shared_pct < minSharedNonOverlap)  continue;
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
						match_data[i].set( "ID_profile", ids[0] );
						match_data[i].set( "ID_match", ids[1] );
						match_data[i].set( "ID_icw_relative", ids[2] );
						if(ids==null) continue;
					}
				}
			}
		}
		for(let j=0; j<row_n.children.length; j++){
			if(row_n.children[j].hasAttribute("class")){
				if(row_n.children[j].getAttribute("class").indexOf("relative-in-common")<0) continue;
				let name_cell = row_n.children[j];
				for(let k=0; k<name_cell.children.length; k++){
					if(name_cell.children[k].hasAttribute("class")){
						if(name_cell.children[k].getAttribute("class").indexOf("name")<0) continue;
						relative_in_common_name=name_cell.children[k].innerText;
						if(relative_in_common_name==null) continue;
						if(relative_in_common_name.length==0){
							relative_in_common_name=null;
							continue;
						}
					}
				}
			}
		}
		match_data[i].set( "name_icw_relative", relative_in_common_name );
		if(relative_in_common_name==null) continue;
		if(ids==null) continue;
		

		if(!ranPrimaryComparison){
			qQueue.enqueue( {part:1, id1: ids[1], id2: ids[0], pn1: matchName, pn2:profileName, pct_shared:sharedDNAPrimary.pct} );
			q_debug_log( 2, `Added to Q0: ${matchName} and ${profileName} (sharing ${sharedDNAPrimary.pct}%)`);
			pendingComparisons++;
			document.getElementById("c529r").innerHTML="Collecting DNA segments....";
			ranPrimaryComparison=true;
		}
		if( !get_segments )  continue;
		if( overlap_status == "yes" ||  remote_shared_pct >= minSharedNonOverlap ) {
			qQueue.enqueue( {part:2, id1: ids[1], id2: ids[2], pn1: matchName, pn2: relative_in_common_name, pct_shared:remote_shared_pct} );
			q_debug_log( 2, `Added to Q1: ${matchName} and ${relative_in_common_name} (sharing ${remote_shared_pct}%)`);
			pendingComparisons++;
		}
		if( overlap_status == "yes" || local_shared_pct >= minSharedNonOverlap ) {
			qQueue.enqueue( {part:3, id1: ids[2], id2: ids[0], pn1: relative_in_common_name, pn2: profileName, pct_shared:local_shared_pct} );
			q_debug_log( 2, `Added to Q2: ${relative_in_common_name} and ${profileName} (sharing ${local_shared_pct}%)`);
			pendingComparisons++;
		}
	}
	if ( debug_q > 0 ) {
		console.log( `comparing ${profileName} and ${matchName} (sharing ${sharedDNAPrimary.pct}%) with min ${minSharedNonOverlap}%:`);
		for( let i = 0 ; i < match_data.length ; i++ ) {
			let md = match_data[i];
			console.log( `   Row ${i}: ${md.get("name_icw_relative")} overlap: ${md.get("overlaps")}; sharing ${md.get("shared_pct_P2B")} to profile & ${md.get("shared_pct_A2B")} to match`);
		}
	}
	if(!foundData){
		alert("Failed to parse Relatives in Common table QL " + qQueue.length);
		launch_next_IBD_query();
		return;
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

/*
** this function handles the "get triangulation data" button.
** It scrapes the page for names
** shift-click will include segments of non-overlapping matches
** Alt-click will reload existing values (default is to skip existing ones)
*/
tr_el.onclick=function(evt){
	var loaded=false;
	try{
		var temp3=document.getElementsByClassName("js-relatives-table")[0];
		if(temp3!=null){
			for(let k=0; k<temp3.children.length; k++){
				if(temp3.children[k].hasAttribute("class")){
					var temp4=temp3.children[k].getAttribute("class");
					if(temp4.indexOf("headers")>-1){
						loaded=true;
						break;
					}
				}
			}
		}

	}
	catch(e){
		alert("Please wait for Relatives in Common to finish loading");
		return;
	}
	if(!loaded){
		alert("Please wait for Relatives in Common to finish loading");
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
	tr_el.innerHTML="Collecting DNA segments..";
	pendingPages=true;

	profileName = localName;
	matchName = personaName;
	loadAllRequested = evt.shiftKey;
	rereadSegsRequested = evt.altKey;

	// after we get the current settings (especially the delay) then we start the data collection
	try {
		chrome.runtime.sendMessage({mode: "getSettingObj" }, ( resp ) => {
				if ( debug_msg > 0 ) {
					console.log( `getSettings callback with ${resp}`);
				}
				process_settings( resp );
			}
		);
	} catch( e ) {
		handleMessageCatches( "getting options", e );
	}
}


function process_settings( response ) {
	if ( Object.keys( response ).includes('qDelay') )
		increment_ms = response.qDelay * 1000.0;
	if ( Object.keys( response ).includes('minSharedNonOverlap') )
		minSharedNonOverlap = response.minSharedNonOverlap;
	if ( Object.keys( response ).includes('debug_q') )
		debug_q = response.debug_q;
	if ( Object.keys( response ).includes('debug_msg') )
		debug_msg = response.debug_msg;
	runComparison(false);
};

/*
** this creates the button and action to open the tab to display results.
The process is:
**	 1 send a message to the service worker script
**   2. it decides whether to create new tab or load ID into existing one.
*/
div.appendChild(tr_el);

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
img.src=chrome.runtime.getURL("529Renew-48.png");
img.style.verticalAlign='middle';
b529r.appendChild(img);

div.appendChild(b529r);

let ric_parent=document.getElementsByClassName("js-profile-relatives-in-common")[0];
let modules=document.getElementsByClassName("module-content");
if(ric_parent!=null && modules!=null){
	var i;
	for(i=0; i<modules.length; i++){
		if(ric_parent.contains(modules[i])) modules[i].appendChild(div);
	}
}

