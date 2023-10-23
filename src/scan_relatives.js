/*
** this content script extracts the lists of relatives, and hopefully,
** at some later stage adds a few extra bits of info
*/
/* eslint no-unused-vars: "off"*/
'use strict';


let debug_q = 3;			// if nonzero, add debugging console output relating to Q processing
let debug_msg = 3;			// if nonzero, add debugging console output re message passing
let increment_ms = 2 * 1000;	// timer delay in milliseconds

let settingsProcessed = false;		// used by watchdog timeout

const ajQueue = new Queue();
let current_ajax = '';

// a few more semiglobals relating to this set of triangulation requests
let profileName = null;		// name of primary DNA tester (you?)
let profileID = null;		// UUID string of the profile person ("You")

let profileMatchesMap = new Map();		// all segment matches to profile person we know about so far.
let matchMatchesMap = new Map();		// all the matches we already have 
let sharedSegMapMap = new Map();	// all known 3-way comparisons including parofil+ match person.

let relativesMap = new Map();		// the 1500 relatives that are preloaded on this page
let notesMap = new Map();			// the annotations preloaded for this page.

var dispatchMouseEvent = function(target, var_args) {
  var e = document.createEvent("MouseEvents");
  e.initEvent.apply(e, Array.prototype.slice.call(arguments, 1));
  target.dispatchEvent(e);
};

function q_debug_log( level, msg ) {
	if ( debug_q > level )
		console.log( msg );
}

function msg_debug_log( level, msg ) {
	if ( debug_msg > level )
		console.log( 1,  msg );
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
** Start the process to run the query to ...
*/
function run_query(personaId, personbId, personaName, personbName){
	try {
		chrome.runtime.sendMessage({mode: "checkIfInDatabase", indexId: personaId, matchId: personbId, indexName: personaName, matchName: personbName, forceSegmentUpdate: rereadSegsRequested});
		// passes a "returnNeedCompare" message back to this origin tab, with needToCompare set true/false
	} catch( e ) {
		handleMessageCatches( "in run_query", e );
	}
}

/*
** prepare the set of ajax calls to get the useful information...
*/

function startAjax() {
	ajQueue.enqueue( {datatype:'annotations', pid:profileID, urltail:'/family/relatives/annotations/'});
	//ajQueue.enqueue( {datatype:'relatives', pid:profileID, urltail:'/family/relatives/ajax/'});
	current_ajax = '';
	launch_next_ajax_query();

}
/* this listener handles the return from - don't know yet.
*/
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
	/* this callback is made when the query made via run_query() returns with the required details
	** and decision as to whether ibd data needs to be requested from the 23 and me server.
	*/

	if(request.mode === "returnSaveData"){

		//let tset = ajQueue.dequeue();
		// sanity check...

	} else
		return false;			// message not handled here
  }
);

/*
** callback function to initiate processing the next IBD segment collection
** from the queue
*/
function launch_next_ajax_query() {
	if ( ajQueue.length <= 0 ) {
		finishAjax();
		return;
	}
	let tset = ajQueue.dequeue();
	q_debug_log( 2, `     sending query for ${tset.datatype} and ${tset.pid}` );

	function makeSegmentSaver( datatype ){
		/* This gets called when the Ajax data requests are returned.
		** every return path from here should launch_next_ajax_query()
		*/
		return function(){

			if(this.status!=200){
				if( this.status == 429 ){
					console.error("Oops = getAjaxData saw err429 while getting " + datatype );
				}
				let errmsg = `Failed to retrieve ${datatype} data from 23andMe.\nServer returned status: ${this.status}`;
				console.error( errmsg );
				alert( errmsg );
				launch_next_ajax_query();
				return;
			}
			const data=JSON.parse(this.responseText);
			switch( datatype ) {
				case 'annotations':
					load_ajax_notes( data );
				break;
				case 'relatives':
					load_ajax_relatives( data );
				break;
				default:
					let errmsg = `unprogrammed datatype in Ajax queue ${datatype}`;
					console.error( errmsg );
					alert( errmsg );
			}

			launch_next_ajax_query();
			return;

		};
	}
	function makeErrorHandler(datatype ){
		return function(err){
			alert(`Failed to retrieve ${datatype} from 23andMe for ${profileName}`);
			launch_next_ajax_query();
			return;
		};
	}
	var ajaxURL="/p/" + tset.pid + tset.urltail;
	var oReq = new XMLHttpRequest();
	msg_debug_log( 1, `calling ${ajaxURL}`);
	oReq.withCredentials = true;
	oReq.onload=makeSegmentSaver( tset.datatype );
	oReq.onerror=makeErrorHandler( tset.datatype );
	oReq.open("get", ajaxURL, true);
	oReq.setRequestHeader('X-Requested-With', 'XMLHttpRequest'  );

	oReq.send();	// no need for timeout - these are permitted simultaneously
}

function load_ajax_notes( resp ) {
	notesMap.clear();
	for( let i = 0 ; i < resp.data.length; i++ ) {
		let nobj = resp.data[i];
		notesMap.set( nobj.relative_profile_id, {note:nobj.note } );
	}
}

function load_ajax_relatives( resp ) {
	relativesMap.clear();
	for( let i = 0 ; i < resp.data.length; i++ ) {
		let relID = nobj.relative_profile_id;
		let nobj = resp.data[i];
		let pctshared = nobj.ibd_proportion * 100.0;
		let totcM = round_cM( pctShared2cM(pctshared ) );
		let shared = nobj.is_open_sharing;		// whether results are publicly shared
		if ( ! shared ) {
			// not open shared, but may be private sharing...
			let privacy = nobj.privacy_contexts;
			if ( privacy.indexOf("sharing_basic") >= 0 ) {
				shared = true;
			}
		}
		let side = nobj.is_maternal_side ? (nobj.is_paternal_side ? "b" : "M") :  (nobj.is_paternal_side ? "P" : "n");

		relativesMap.set( relID, {
				name: nobj.first_name + ' ' + nobj.last_name,
				shared: shared,
				pct_ibd: pctshared,
				nseg: nobj.num_segments,
				totalcM: totcM, 
				max_seg: round_cM( nobj.max_segment_length ),
				side: side,
				sex: nobj.sex,
				messagex: nobj.has_exchanged_message,
				fav:nobj.is_favorite,
				known_rel: nobj.overridden_relationship_id 
			}
		);
		if (notesMap.has( relID ) && (notesMap.get(relID).note.length > 0) ) {
			relativesMap.get( relID ).note = notesMap.get(relID).note;
		} else {
			// lets make up a fake one for display
			relativesMap.get( relID ).note = `${totcM}cM/${nobj.num_segments} side: ${side} DNA ${(shared?'shared':'hidden')}`;
		}
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
** this creates the button to collect relatives info
*/

let div529=document.createElement('div');
div529.id="div529r";
div529.role="button";

let tr_el=document.createElement('button');
tr_el.innerHTML="529-Gather";
tr_el.id="c529r";
tr_el.title="Click to collect the list of relatives";

div529.appendChild(tr_el);

/*
** this function handles the "gather relatives data" button.
** It reads the result of various Ajax calls.
*/
tr_el.onclick=function(evt){
	var loaded=false;
	try{
		let temp3=document.getElementsByClassName("js-relatives-table")[0];
		if(temp3 == null) throw new Error("Page structure changed");
		let classlist = temp3.classList;
		for( let k=0; k < classlist.length; k++){
			if ( classlist[k] === "hide") throw new Error("Not clicked");
		}

	}
	catch(e){
		alert( 'This bit of code does nothing yet');
		return;
	}
}


function process_settings( response ) {
	settingsProcessed = true;
	if ( response.hasOwnProperty('qDelay') ) {
		increment_ms = response.qDelay * 1000.0;
	}
	if ( response.hasOwnProperty('debug_q') ) {
		debug_q = response.debug_q;
	}
	if ( response.hasOwnProperty('debug_msg') ) {
		debug_msg = response.debug_msg;
	}
};

// now get the profile person's ID and name
[profileID, profileName] =  get_profile_from_header();

msg_debug_log( 1,  `Found profile ${profileID} (${profileName})` );

let b529r=document.createElement('button');
b529r.id="b529r";
b529r.innerHTML="Open";
b529r.style.marginLeft='10px';
b529r.onclick=function(){

	try {
		//chrome.runtime.sendMessage({mode: "displayPage", url:chrome.runtime.getURL('results_tab.html')+query} );
		alert( 'does nothing');
	} catch( e ) {
		handleMessageCatches( "opening results tab", e );
	}
};
let img=document.createElement('img');
img.src=chrome.runtime.getURL("logos/529renew-48.png");
img.style.verticalAlign='middle';
b529r.appendChild(img);

div529.appendChild(b529r);

/*
** the place I want to install the button does not exist until all the data has been loaded
** So, we need to wait a few seconds...
** studies show the "download" button div takes nearly 4 seconds to appear, and the paginator takes nearly 8 seconds.
** So wait for paginator before triggering repeat ajax calls.
** Initially they are run in parallel by 23andMe , but we will run in series...
*/
let buttoncount = 0;
function add529Button() {
		
	let rd_parent=document.getElementsByClassName("js-dna-relatives-download");
	let pag_parent=document.getElementsByClassName("dna-relatives-pagination");
	buttoncount++;
	msg_debug_log( 1,  `Loop at ${buttoncount}, button: ${rd_parent.length}, paginator: ${pag_parent.length}.`);
	if( rd_parent.length < 1 || pag_parent.length< 1 ) {
		if ( rd_parent.length > 0 && ( !settingsProcessed )) {
			// button is ready first, so load settings while we wait
			try {
				setTimeout( watchdogTimer, 5000 );
				chrome.runtime.sendMessage({mode: "getSettingObj" }, ( resp ) => {
						msg_debug_log( 3,  `getSettings callback with ${resp}`);

						if ( resp === undefined ) {
							handleMessageCatches( "getting settings", chrome.runtime.lastError );
						} else {
							process_settings( resp );
						}
					}
				);
			} catch( e ) {
				// never catches anything!?
				handleMessageCatches( "getting options", e );
			}
		}
		setTimeout( add529Button, 1000);
		return;
	}
	if(rd_parent[0]!=null ){
		rd_parent[0].appendChild(div529);
		startAjax();
	}
}
add529Button();