/*
** this content script extracts the lists of ICW matches, that would normally appear
** on the specific DNA match page, but here we try to just get the ajax dataset and process accordingly
*/
'use strict';

/*
** Using a simple loop is a bit tricky with all the asynchronous operations,
** so we use a queue of relatives that we can process, and for each
relative we create a queue of ajax requests.
*/
const relQueue = new Queue();
let current_relative_id = '';
let current_relative_name = '';
const icwQueue = new Queue();
let current_icw_ajax = '';

let famtreeURL = "";
let hapMap = new Map();
let icwMap = new Map();

/*
** prepare the set of ajax calls to get the useful information...
*/

let relcount = 0;
function run_ICW_scan() {
	while( relQueue.length > 0) {
		relQueue.dequeue();
	}
	while( icwQueue.length > 0) {
		icwQueue.dequeue();
	}
	relcount = 0;
	let skipcount = 0;
	let added = 0;

	// create a fifo queue of matches to the profile person
	for( let [key, obj] of relativesMap ) {
		if ( triangMap.has(key) && triangMap.get( key)) {
			q_debug_log( 4, `Already have ${key}, skipping` );
			skipcount++;
			// skipping
		} else {
			relQueue.enqueue( key );
			added++;
		}
	}
	q_debug_log( 1, `Enqueued ${added} to scan, skipped ${skipcount} already recorded`);
	next_relative_scan();
}

function next_relative_scan() {

	if ( relQueue.length <= 0 ) {
		b529r.innerHTML='scan complete';
		return;
	}
	
	current_relative_id = relQueue.dequeue();
	let relobj = relativesMap.get(current_relative_id);
	current_relative_name = relobj.name;
	b529r.innerHTML=`scan ICW for ${current_relative_name}`;
	/*
	if (relcount++ > 2){
		b529r.innerHTML='scan termminated for testing';
		return;
	}
	*/

	if ( icwQueue.length != 0 ) {
		let msg = `ICW queue failure - still had ${icwQueue.length} items`;
		console.error( msg, icwQueue );
		alert( msg );
		return;
	}

	let urlprefix = "/p/" + profileID
	let url2 = urlprefix + "/profile/" + current_relative_id;
	let urlhap = urlprefix +
			"/ancestry/compute-result/?profile_id=" +
			profileID + "%2C" +
			current_relative_id +
			"&name=mthaplo_build_7%3Ahaplogroup%2Cyhaplo_2023%3Ahaplogroup";
	icwQueue.enqueue( { datatype:'family_bgnd',
						pid:profileID,
						relid:current_relative_id,
						url:url2 + "/family_background/"
					});
	if ( relobj.shared ) {
		// we get a 403 forbidden if we try to read haplogroups for hidden DNA
		icwQueue.enqueue( { datatype:'haplogroup',
						pid:profileID,
						relid:current_relative_id,
						url:urlhap
					}
		);
	} else {
		dummy_haplogroup();
	}
	icwQueue.enqueue( { datatype:'listICW',
						pid:profileID,
						relid:current_relative_id,
						url:url2 + "/relatives_in_common/"
					});
	current_icw_ajax = '';
	launch_next_icw_ajax_query();

}

/*
** called each time an ICW scan is completed, for profile, matching relative, and n ICWs
*/
function finishICWAjax () {
	fill_ICW_details();
	return;	
}

/*
** callback function to initiate processing the next result set from an Ajax call
** from the queue
*/
function launch_next_icw_ajax_query() {
	if ( icwQueue.length <= 0 ) {
		finishICWAjax();
		return;
	}
	let tset = icwQueue.dequeue();
	q_debug_log( 2, `     sending query for ${tset.datatype} and ${tset.pid}` );

	function makeAjaxSaver( datatype ){
		/* This creates a callback function that gets called when the Ajax data requests are returned.
		** every return path from here should launch_next_icw_ajax_query()
		*/
		return function(){

			if(this.status!=200){
				if( this.status == 429 ){
					console.error("Oops = getAjaxData saw err429 while getting " + datatype );
				}
				let errmsg = `Failed to retrieve ${datatype} data from 23andMe.\nServer returned status: ${this.status}\nGiving up`;
				console.error( errmsg );
				alert( errmsg );
				//launch_next_icw_ajax_query();  just give up
				return;
			}
			const resp=JSON.parse(this.responseText);
			msg_debug_log( 1,  `saving data for type: '${datatype}'` );
			switch( datatype ) {
				case 'family_bgnd':		// resp is object (we want obj.family_tree_url)
					load_family_bgnd( resp );
				break;
				case 'haplogroup':		// response is array of 4 objects
					load_haplogroup( resp );
				break;
				case 'listICW':			// resp is an array of objects, one per ICW test
					load_icw_list( resp );
				break;
				default:
					let errmsg = `unprogrammed datatype in ICW Ajax queue ${datatype}`;
					console.error( errmsg );
					alert( errmsg );
			}

			//launch_next_icw_ajax_query();
			return;

		};
	}
	function makeErrorHandler(datatype ){
		return function(err){
			let msg = `Failed to retrieve ${datatype} from 23andMe for ${current_relative_name}`;
			console.error( msg);
			alert(msg);
			launch_next_icw_ajax_query();
			return;
		};
	}
	var ajaxURL=tset.url;
	var oReq = new XMLHttpRequest();
	msg_debug_log( 4, `calling ${tset.url}`);
	oReq.withCredentials = true;
	oReq.onload=makeAjaxSaver( tset.datatype );
	oReq.onerror=makeErrorHandler( tset.datatype );
	oReq.open("get", tset.url, true);
	oReq.setRequestHeader('X-Requested-With', 'XMLHttpRequest'  );		// returns 404 without this

	oReq.send();	// no need for time delay - these are permitted simultaneously, but we do sequentially.
}

function load_family_bgnd( respobj ) {
	famtreeURL = "";		// set default
	if( respobj.hasOwnProperty( "family_tree_url" )) {
		if (respobj.family_tree_url !== null ) {
			famtreeURL = respobj.family_tree_url.text
		}
	}
	if (famtreeURL.length > 0) {
		console.log( `found tree for ${current_relative_name} at ${famtreeURL}`);
	} 
	launch_next_icw_ajax_query();
}

/*
** process the message json response.
** It looks like this is limited to the first 20000 (or value in "limit")
** so I won't bother trying to get more than whatever it offers.
** Not sure if haplotype prefix strings are constant, nor if ':' will
** only ever present as the separator char. (hence the use of regex.)
*/
function load_haplogroup( resparray ) {
	hapMap.clear();
	let msgcount = resparray.length;
	const re = /^.*:([^:]*)$/;
	let MTgroup="not given";
	let Ygroup="not given";
	let IDM = null;
	let IDY = null;

	for( let i = 0 ; i < msgcount; i++ ) {
		let mobj = resparray[i];
		let ID = mobj.profile_id;
		if ( ID != profileID ) {
			try {
				if ( mobj.name.startsWith("mthaplo")) {
					let grp = mobj.result.haplogroup_id;
					MTgroup = grp.replace(re, "$1" );
					IDM = ID;
				}
				if ( mobj.name.startsWith("yhaplo")) {
					let grp = mobj.result.haplogroup_id;
					Ygroup = grp.replace(re, "$1" );
					IDY = ID
				}
			} catch( e ){
				let msg=`failed to get a haplogroup for ${current_relative_name}: ${e.message}`;
				console.error( msg );
				alert( msg );
			}
		}
	}
	if ( IDM !== null ){
		if ( IDM != IDY ) {
			msg `ID mismatch between M:${MID} and Y:${YID}`;
			console.error( msg );
			alert( msg );
		} else {
			hapMap.set( IDM, {hapY:Ygroup, hapM: MTgroup, entireJSON:JSON.stringify(resparray) } );
			//console.log( 'got haplogs', hapMap.get(IDM));
		}
	} else {
		let msg = `MT haplo not found for ??`;
		console.error( msg );
		alert( msg );
	}

	msg_debug_log( 1,  `Populated ${hapMap.size} entries into 'hapMap' out of ${msgcount}` );
	//console.log( 'hapMap is ', hapMap);
	launch_next_icw_ajax_query();
}

function dummy_haplogroup(  ) {
	hapMap.clear();
	let MTgroup="hidden";
	let Ygroup="hidden";

	hapMap.set( current_relative_id, {hapY:Ygroup, hapM: MTgroup, entireJSON:"" } );
}

function load_icw_list( resparray ) {
	msg_debug_log( 4,  `trace start 'load_icw'` );
	icwMap.clear();
	for( let i = 0 ; i < resparray.length; i++ ) {
		let nobj = resparray[i];
		icwMap.set( nobj.profile_id, nobj );
	}
	triangMap.set( current_relative_id, true );
	msg_debug_log( 1,  `Populated ${icwMap.size} entries into 'icwMap' for ${current_relative_name}` );

	//console.log( 'load_icw_list:', resparray);

	launch_next_icw_ajax_query();
}

// A timeout routine to trap something - maybe
function watchdogTimerICW() {
	if (!settingsProcessed) {
		let msg = "No response from Results Tab to settings request - is it running?";
		console.error( msg );
		alert( msg );
	}
}

/* 
** at the end of a scan for ICWs between 2 people, save the data then look at the next combination
** We _could_ be sneaky and set the timeout first, but that leads to potential for a race condition, so we'll play it safe.
*/
function fill_ICW_details() {
	
	if( hapMap.size > 0 ) {
		let hobj = hapMap.get(current_relative_id)
		if( hobj.hapM ) {
			let datapkt = {$mid:current_relative_id, $mname:current_relative_name, $hapMat:hobj.hapM, $hapPat:hobj.hapY};
			chrome.runtime.sendMessage({mode: "update_haplogroups",  matchHapData: datapkt });
		}
	}
	if ( famtreeURL.length > 0) {
		chrome.runtime.sendMessage({mode: "update_familytree", datapkt:{$mid:current_relative_id, $mname:current_relative_name, $famtree:famtreeURL}});

	}
	const icwarr = Array.from( icwMap, ([key,val]) => ( val ));		// map index is embedded in each object element anyway
	chrome.runtime.sendMessage({mode: "update_ICWs", ICWset:{
							ID1:profileID,
							ID2:current_relative_id,
							name1:profileName,
							name2:current_relative_name,
							icwarray:icwarr}
						});

	setTimeout( () => next_relative_scan(), increment_ms );
}