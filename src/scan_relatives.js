/*
** this content script extracts the lists of relatives, and hopefully,
** at some later stage adds a few extra bits of info
*/
/* eslint no-unused-vars: "off"*/
'use strict';


let debug_q = 4;			// if nonzero, add debugging console output relating to Q processing
let debug_msg = 4;			// if nonzero, add debugging console output re message passing
let increment_ms = 2 * 1000;	// timer delay in milliseconds

let settingsProcessed = false;		// used by watchdog timeout
let settingsRequested = false;      // flag to limit outgoing settings requests to 1 per instance
let settings529 = {};		// get all settings as one block (used by rounding functions)

const ajQueue = new Queue();
let current_ajax = '';

// a few more semiglobals relating to this set of triangulation requests
let profileName = null;		// name of primary DNA tester (you?)
let profileID = null;		// UUID string of the profile person ("You")

let relativesMap = new Map();		// the 1500 relatives that are preloaded on this page
let notesMap = new Map();			// the annotations preloaded for this page.
let messagesMap = new Map();			// the messages preloaded for this page.

let triangMap = new Map();			// map of triangulations to the current profile

var dispatchMouseEvent = function(target, var_args) {
  var e = document.createEvent("MouseEvents");
  e.initEvent.apply(e, Array.prototype.slice.call(arguments, 1));
  target.dispatchEvent(e);
};

let timed_debug = false;

function q_debug_log( level, msg ) {
	if ( debug_q >= level )
		console.log( timed_debug? `${Date.now()}: ${msg}`: msg );
}

function msg_debug_log( level, msg ) {
	if ( debug_msg >= level )
	console.log( timed_debug? `${Date.now()}: ${msg}`: msg );
}

/*
** extension updates will invalidate the extension context and not clean up.
** Use this to handle catch() from sendmessage
*/

function handleMessageCatches( location, err ) {
	let msg =  ` failed to send message ${location}\n Reply was "${err.message}"`;
	console.error( msg );
	alert( msg + "\nTry closing all tabs or refreshing" );
	return;
}
/* run_query
** Start the process to run the query to ...

function run_query(personaId, personbId, personaName, personbName){
	try {
		chrome.runtime.sendMessage({mode: "checkIfInDatabase", indexId: personaId, matchId: personbId, indexName: personaName, matchName: personbName, forceSegmentUpdate: rereadSegsRequested});
		// passes a "returnNeedCompare" message back to this origin tab, with needToCompare set true/false
	} catch( e ) {
		handleMessageCatches( "in run_query", e );
	}
}*/

/*
** prepare the set of ajax calls to get the useful information...
*/

function startAjax() {
	ajQueue.enqueue( {datatype:'annotations', pid:profileID, urltail:'/family/relatives/annotations/'});
	ajQueue.enqueue( {datatype:'relatives', pid:profileID, urltail:'/family/relatives/ajax/'});
	ajQueue.enqueue( {datatype:'messages', pid:profileID, urltail:'/family/relatives/messages/'});
	current_ajax = '';
	launch_next_ajax_query();

}

function finishAjax () {
	fill_relative_details();
	return;	
}

/* this listener handles the return from - don't know yet.
*/
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {

	if(request.mode === "requestTriangTable_return"){
		let retprofile = request.data.profile;
		if ( retprofile != profileID ) {
			alert( `Expecting triang data for ${profileID} (${profileName}), got ${retprofile}`)
		}
		let retarray = request.data.dnarels;
		
		triangMap.clear();
		for(  let i = 0 ; i < retarray.length ; i++ ) {
			let obj = retarray[i];
			if ( obj.ICWscanned == 1 ) {
				// only add true ones, ignore others.
				triangMap.set( obj.IDrelative,  true  ) ;
			}
			
		}
	} else if(request.mode === "relatives_completed"){
		tr_el.innerHTML="529-Gather Done";
		get_dna_cache();		//ask to reload the cache in case anything changed
	} else if(request.mode === "ICWPrelude_return"){
		load_match_cache( request.data );
	} else
		return false;			// message not handled here
  }
);

/*
** callback function to initiate processing the next result set from an Ajax call
** from the queue
*/
function launch_next_ajax_query() {
	if ( ajQueue.length <= 0 ) {
		finishAjax();
		return;
	}
	let tset = ajQueue.dequeue();
	q_debug_log( 2, `     sending query for ${tset.datatype} and ${tset.pid}` );

	function makeAjaxSaver( datatype ){
		/* This creates a callback function that gets called when the Ajax data requests are returned.
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
			const resp=JSON.parse(this.responseText);
			msg_debug_log( 1,  `saving data for type: '${datatype}'` );
			switch( datatype ) {
				case 'annotations':
					load_ajax_notes( resp.data );
				break;
				case 'relatives':
					load_ajax_relatives( resp );
				break;
				case 'messages':
					load_ajax_messages( resp );
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
	oReq.onload=makeAjaxSaver( tset.datatype );
	oReq.onerror=makeErrorHandler( tset.datatype );
	oReq.open("get", ajaxURL, true);
	oReq.setRequestHeader('X-Requested-With', 'XMLHttpRequest'  );		// returns 404 without this

	oReq.send();	// no need for time delay - these are permitted simultaneously
}

function load_ajax_notes( resparray ) {
	notesMap.clear();
	for( let i = 0 ; i < resparray.length; i++ ) {
		let nobj = resparray[i];
		notesMap.set( nobj.relative_profile_id, {note:nobj.note } );
	}
}

/*
** process the message json response.
** It looks like this is limited to the first 20000 (or value in "limit")
** so I won't bother trying to get more than whatever it offers.
*/
function load_ajax_messages( resp ) {
	messagesMap.clear();
	let msgcount = resp.total_count;
	let msglimit = resp.limit;
	let msgoffset = resp.offset;
	let resparray = resp.messages;

	for( let i = 0 ; i < resparray.length; i++ ) {
		let mobj = resparray[i];
		let msgID = mobj.id;
		let senderid = mobj.sender.id
		messagesMap.set( mobj.id, {$id:mobj.id, $sender:mobj.sender.id, $recip:mobj.recipient.id, $content:mobj.body, $entireJSON:JSON.stringify(resparray) } );
	}
	msg_debug_log( 1,  `Populated ${messagesMap.size} entries into 'messagesMap' out of ${msgcount}` );
	msg_debug_log( 4,  `trace end 'load_ajax_messages'` );
}

function load_ajax_relatives( resparray ) {
	msg_debug_log( 4,  `trace start 'load_ajax_relatives'` );
	relativesMap.clear();
	for( let i = 0 ; i < resparray.length; i++ ) {
		let nobj = resparray[i];
		let relID = nobj.relative_profile_id;
		let pctshared = nobj.ibd_proportion * 100.0;
		let totcM = round_cM( pctShared2cM(pctshared) );
		let shared = nobj.is_open_sharing;		// whether results are publicly shared
		if ( ! shared ) {
			// not open shared, but may be private sharing...
			let privacy = nobj.privacy_contexts;
			if ( privacy.indexOf("sharing_basic") >= 0 ) {
				shared = true;
			}
		}
		let side = nobj.is_maternal_side ? (nobj.is_paternal_side ? "b" : "M") :  (nobj.is_paternal_side ? "P" : "n");
		let largest_seg = round_cM( nobj.max_segment_length );
		// relative may give either first or last name as null, or both. It seems initials are never null.
		let namelast = (nobj.last_name === null || nobj.last_name.length < 1) ? nobj.last_initial  : nobj.last_name;
		let namefirst = (nobj.first_name === null || nobj.first_name.length < 1) ? nobj.first_initial  : nobj.first_name;
		let namefull = namefirst + ' ' + namelast;
		if ( namefull.length < 2 ) {
			namefull = nobj.initials;		// should not need this, but...?
		}

		relativesMap.set( relID, {
				name: namefull,
				shared: shared,
				pct_ibd: pctshared,
				nseg: nobj.num_segments,
				totalcM: totcM, 
				max_seg: Math.round(largest_seg, 2),
				side: side,
				sex: nobj.sex,
				messagex: nobj.has_exchanged_message,
				fav:nobj.is_favorite,
				predicted_rel: nobj.predicted_relationship_id,
				known_rel: nobj.overridden_relationship_id === null ? "" : nobj.overridden_relationship_id,
				family_locations:JSON.stringify(nobj.raw_family_locations),
				surnames:JSON.stringify(nobj.surnames)
			}
		); 
		if (notesMap.has( relID ) && (notesMap.get(relID).note.length > 0) ) {
			relativesMap.get( relID ).note = notesMap.get(relID).note;
		} else {
			let maxseg = '';
			// lets make up a fake one for display
			if ( nobj.num_segments > 1 ) {
				maxseg = `max:${largest_seg.toFixed(0)} cM`;
			}
			relativesMap.get( relID ).note = '';
			relativesMap.get( relID ).noteextra = `---${totcM.toFixed(0)}cM/${nobj.num_segments} ${maxseg}; side: ${side} DNA ${(shared?'shared':'hidden')}`;
		}
	}
	msg_debug_log( 1,  `Populated ${relativesMap.size} entries into 'relativesMap'` );
	msg_debug_log( 4,  `trace end 'load_ajax_relatives'` );
}

// A timeout routine to trap situations where the results tab is not running.
function watchdogTimer() {
	if (!settingsProcessed) {
		let msg = "No response from Results Tab to settings request - is it running?";
		console.error( msg );
		alert( msg );
	}
}

function fill_relative_details() {
	const rels = document.getElementsByClassName("dna-relatives-list-item");
	msg_debug_log( 4,  `relatives: ${rels.length}.` );
	for( let i=0; i < rels.length; i++ ){
		let containingbox = rels[i];
		let pid = '';
		let note2show = '';
		containingbox.style.paddingBottom = `${settings529.relativePixelPadding}px`;
		containingbox.style.paddingTop =  `${settings529.relativePixelPadding}px`;
		let namebox = containingbox.getElementsByClassName( 'relative-link' );
		if ( namebox.length <= 0 )
			continue;
		const href = namebox[0].href;
		try {
			pid = get_profileID_from_url( "profile/", href );
			validate_ID( pid );
		} catch( e ) {
			alert( e.message );
			continue;	// skip this one - try next
		}
		if ( triangMap.has( pid )) {
			containingbox.style.backgroundColor = "#bbffbb";
		}
		let fullNote = '';
		if ( relativesMap.has( pid )) {
			note2show = relativesMap.get( pid ).note;
			fullNote = note2show;
			if ( note2show.length <= 0 ){
				note2show = relativesMap.get( pid ).noteextra;
			}

		}
		let notelen = settings529.displayNotesLength;
		if( notelen  > 0) {
			// I tried class="small-detail" but that does not seem to apply to this class heirarchy, so give style directly
			// the line-height seems to get ignored, based on largest char in entire text block.
			if ( note2show.length > notelen ) {
				let noteshort = note2show.substring( 0, notelen-3 ) + "...";
				note2show = noteshort;
			}
			// namebox[0].innerHTML += '<span style="font-size:0.8rem; font-weight:normal" > ' + note2show + '</span>';
			
			const check  = namebox[0].querySelectorAll('[data-note529]');

			if( ! (check&& check.length > 0)){
				const noteElement = document.createElement('p');
				noteElement.dataset['note529'] = '';
				noteElement.style['font-size'] = '0.8rem';
				noteElement.style['font-weight'] = 'normal';
				noteElement.style['margin'] = '0';
				noteElement.style['z-index'] = '100';
				noteElement.style['position'] = 'relative';
				noteElement.title=fullNote
				noteElement.innerText = note2show;
				namebox[0].appendChild(noteElement);
			}
		} else {
			namebox[0].title = note2show;
		}
	}

	msg_debug_log( 4,  `trace end 'fill_relative_details'` );
}

/*
** this creates the button to collect relatives info
*/

let div529=document.createElement('div');
div529.id="div529r";
div529.role="button";
div529.style['display'] = 'flex';
div529.style['column-gap'] = '1rem';
div529.style['justify-content'] = 'flex-start';

let tr_el=document.createElement('button');
tr_el.innerHTML="529-Gather";
tr_el.id="c529r";
tr_el.title="Click to update database with any changes to relatives list";
tr_el.style['height'] = '100%';

div529.appendChild(tr_el);

/*
** this function handles the "gather relatives data" button.
** It sends the result of various Ajax calls to the DB and gets an amended (more detailed) list back.
*/
tr_el.onclick=function(evt){
	try{
		// don't use a callback, as we cannot pass it through the worker... Just rely on the returned message
		// and we cannot pass a Map, so convert...
		const relativearr = Array.from( relativesMap, ([key,val]) => ({ key, val }));
		const msgarr = Array.from( messagesMap, ([key,val]) => ( val ));
		console.log( 'msg array is ', msgarr );
		tr_el.innerHTML="..Busy..";
		chrome.runtime.sendMessage({mode: "process_relatives", profile:{id: profileID, name:profileName}, relatives: relativearr, messages:msgarr } );
	} catch( e ) {
		// never catches anything!?
		handleMessageCatches( "process relatives list ", e );
	}
}


function process_settings( response ) {
	settingsProcessed = true;
	Object.assign(settings529, response );
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
b529r.innerHTML="scan ICW (maybe)";
b529r.title="code to apply padding and notes";
b529r.onclick= function() {
	run_ICW_scan();
};
b529r.style.marginLeft='10px';
b529r.style['height'] = '100%';

div529.appendChild(b529r);

let paginationHasObserver = false;
/**
 * Helper logic to attempt to re-attach the pagination observer if this has been removed by the list,
 * shrinking to less than that which would be shown on a single page.
 */
function reattachPaginationObserver(){
	let pag_parent=document.getElementsByClassName("dna-relatives-pagination");
	if (pag_parent[0] === null || pag_parent.length < 1){
		paginationHasObserver = false;
		return;
	}
	if (paginationHasObserver){
		return;
	}

	if (pag_parent[0] != null){
		pag_parent[0].addEventListener('click', ()=> {
			msg_debug_log( 3,  `New page selected, re-injecting notes` );
			setTimeout(() => {
				fill_relative_details();
			}, 500);
		});
		paginationHasObserver = true;
	}
}

/**
 * Helper to attach listeners / reactionary logic to both filters and ordering toggles
 * @param {HTMLELemet} rl_parent the header element of the listings
 */
function attachObserversToHeader(rl_parent){
	const resultList_config = { attributes: true, childList: true, subtree: true, characterData: true };
	const resultList_callback = () => { 
		msg_debug_log( 3,  `Result-set has been filtered, re-injecting notes` );
		setTimeout(() => {
			fill_relative_details();
			reattachPaginationObserver();
		}, 500);
	};
	const resultList_observer = new MutationObserver(() => resultList_callback());
	const resultCountElement = rl_parent.getElementsByClassName('relative-count');    // filtered result count
	
	const select_callback = () => { 
		msg_debug_log( 3,  `Sort-By order has been altered, re-injecting notes` );
		setTimeout(() => {
			fill_relative_details()
			reattachPaginationObserver();
		}, 500);
	};
	const sortByElement = rl_parent.querySelectorAll('#dna-relatives-sort');          // sortBy dropdown

	if (sortByElement && sortByElement.length > 0){
		sortByElement[0].addEventListener('change', () => select_callback())
	}

	if (resultCountElement && resultCountElement.length > 0){
		resultList_observer.observe(resultCountElement[0], resultList_config);
	}
}

function get_dna_cache() {
	try {
		chrome.runtime.sendMessage({mode: "get_ICW_prelude",  matchpair: {pid: profileID, pname: profileName, mid:null, mname:"nobody"}} );
	} catch( e ) {
		handleMessageCatches( "preloading cache in main page", e );
	}
	
}

// Since we have the profileID already, then we can ask for cache data...
get_dna_cache();

let buttoncount = 0;
/**
 * the place I want to install the button does not exist until all the data has been loaded 
 * So, we need to wait a few seconds...
 * studies show the "download" button div takes nearly 4 seconds to appear, and the paginator takes nearly 8 seconds.
 * So wait for paginator before triggering repeat ajax calls.
 * Initially they are run in parallel by 23andMe , but we will run in series...
 */
function add529Button() {
		
	let rd_parent=document.getElementsByClassName("dna-relatives-main-panel");
	let pag_parent=document.getElementsByClassName("dna-relatives-pagination");
	let rl_parent =  document.getElementsByClassName("dna-relatives-summary-row"); // results count list

	buttoncount++;
	msg_debug_log( 3,  `Loop at ${buttoncount}, button: ${rd_parent.length}, paginator: ${pag_parent.length}, settingsProcessed: ${settingsProcessed}.`);
	if ( buttoncount > 2 &&  !settingsProcessed && !settingsRequested) {
		// load settings while we wait (but wait for first loop otherwise results tab will not be not ready.)
		settingsRequested = true;
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
			chrome.runtime.sendMessage({mode: "requestTriangTable", profile: profileID } ); // this will just pass values back asynch.
		} catch( e ) {
			// never catches anything!?
			handleMessageCatches( "getting options", e );
			settingsRequested = false;
		}
	}
	// if( rd_parent.length < 1 || pag_parent.length < 1 ||  rl_parent.length < 1) {
	if( rd_parent.length < 1 || pag_parent.length < 1 ||  rl_parent.length < 1) {
		if (buttoncount > 100){
			//msg_debug_log( 4,  `$trace ABORT 'add529Button' 100 tries eclipsed` );
			return;
		}
		setTimeout( add529Button, 500);
		// msg_debug_log( 4,  `$trace RESTART 'add529Button'` );
		return;
	} 
	if(rd_parent[0]!=null ){
		rd_parent[0].appendChild(div529);
		// rd_parent[0].style['display'] = 'grid';
		// rd_parent[0].style['grid'] = 'auto-flow dense / 4fr 40px 3fr';
		startAjax();
	}
	if (pag_parent[0] != null){
		reattachPaginationObserver();
	}
	if (rl_parent[0] != null){
		attachObserversToHeader(rl_parent[0]);
	}
	//msg_debug_log( 4, `trace end 'add529Button'` );
}
add529Button();