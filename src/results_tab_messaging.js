/*
** messaging for results tab
** This file handles the messages to the results tab,  from...
** 1. the origin tabs (23 and me)
** 2. the other extension pages/tabs
** 3. the worker
*/

//console.log( 'create_db_worker started');

function logHtml(cssClass, ...args) {
	const logbox = document.getElementById( "html_log_box");
	const ln = document.createElement('div');
	if (cssClass) ln.classList.add(cssClass);
	ln.append(document.createTextNode(args.join(' ')));
	logbox.append(ln);
	if ( cssClass === 'error' ){
		alert( ...args );
  }
};
function logHtmlClear() {
	const logbox = document.getElementById( "html_log_box");
	while( logbox.hasChildNodes() ) {
		logbox.removeChild( logbox.children[0]);
	}
}

const DBworker = new Worker('dbworker/worker.js?sqlite3.dir=jswasm');

let DNAtesters = new Map();

// Handle messages coming back from the DB worker
DBworker.onmessage = function ( msg ) {
  let data = msg.data;
  msg_conlog( 4, `msg from worker, code ${data.reason}` );

  switch (data.reason) {
    case 'log':
      logHtml(data.payload.cssClass, ...data.payload.args);
	break;

	case "return_DBcheck":
		chrome.tabs.sendMessage(data.tabID, {mode: "returnNeedCompare", matchpair:data.matchpair, returnedData: data.returned, needToCompare: data.needToCompare});
	break;

    case 'init_done':
      db_conlog( 0, 'DB worker init completed');
      db_initialised = true;
	  post_DB_init_setup();
    break;

    case 'summary_return':
      // payload rows is an array of arrays...
	  if ( debug_db > 1) {
	      console.log( 'summary returned ', data.payload );
	  }
	  db_summary = data.payload;   // this seems good enough
      // db_summary = data.payload.rows.map( (r) => [...r] );
      chrome.runtime.sendMessage( {mode:'pop_dbstatus', data:db_summary} );
    break;

    case 'match_summary_return':
      // payload rows is an array of arrays...
	  if ( debug_db > 1) {
  	    console.log( 'match summary returned ', data.payload );
	  }
      db_match_summary = data.payload;   // this seems good enough
      chrome.runtime.sendMessage( {mode:'pop_dbstatusMatches', data:db_match_summary} );
    break;

    case 'selectFromDatabase_return':
		let callback_datareturn = data.callback;
		let getSegsResults = data.payload;
		if ( getSegsResults.length == 0 ){
			alert( 'Empty results set returned from request');
			return;
		}
		//console.log( 'select from DB: ', profile_status );
		switch ( callback_datareturn ) {
			case 'createCSV':
				createCSV12( getSegsResults, false);
			break;
			case 'createCSV3':
				createCSV12( getSegsResults, true);
			break;
			case 'createTable':
				createTable12( getSegsResults, false);
			break;
			case 'createTable2':
				createTable12( getSegsResults, true);
			break;
			case 'createGEXF':
				createGEXF( getSegsResults );
			break;
			
			default:
				let errmsg = `get DB selection, unhandled callback: ${callback_datareturn}`;
				console.error( errmsg );
				alert( errmsg );
			break;
		}
    break;

	case 'selectGDAT_ICW_return':
		let table_ICW_GDAT = data.payload;
		if ( table_ICW_GDAT.length == 0 ){
			alert( 'select GDAT_ICW: No suitable records found');
			return;
		}
		createICW_CSV4GDAT( table_ICW_GDAT, data.id, data.kitname );
	break;

    case 'selectGDAT_rels_return':
		let table_Rels_GDAT = data.payload;
		if ( table_Rels_GDAT.length == 0 ){
			alert( 'select GDAT_rels: No suitable records found');
			return;
		}
		//console.log( 'select from DB: ', profile_status );
		createRels_CSV4GDAT( table_Rels_GDAT, data.id, data.kitname);
    break;

	case 'selectICWFromDatabase_return':
		let table_ICW = data.payload;
		if ( table_ICW.length == 0 ){
			alert( 'Empty results set returned from request');
			return;
		}
		createICW_CSV( table_ICW, data.id, data.kitname );
	break;

    case 'select23CSVFromDatabase_return':
		let datareturn = data.callback;
		let table_23CSV = data.payload;
		if ( table_23CSV.length == 0 ){
			alert( 'Empty results set returned from request');
			return;
		}
		//console.log( 'select from DB: ', profile_status );
		switch ( datareturn ) {
			case 'create23CSV_noDNA':
				create23CSV_noDNA( table_23CSV, data.id, data.kitname);
			break;
			
			case 'create23CSV_DNA':
				create23CSV_DNA( table_23CSV, data.id, data.kitname);
			break;

			case 'create23TSV_noDNA':
				create23TSV_noDNA( table_23CSV, data.id, data.kitname);
			break;
			
			case 'create23TSV_DNA':
				create23TSV_DNA( table_23CSV, data.id, data.kitname);
			break;

			default:
				let errmsg = `get DB selection, unhandled callback: ${datareturn}`;
				console.error( errmsg );
				alert( errmsg );
			break;
		}
    break;

    case 'overlappingSegments_return':
		let callback_olap_return = data.callback;
		let callback_olap_params = data.callbackParams;
		let overlapResults = data.payload;
		if ( overlapResults.length == 0 ){
			alert( 'Empty result set returned from overlaps request');
			return;
		}
		switch ( callback_olap_return ) {
			case 'colorizeButton':
				colorizeButton( overlapResults, callback_olap_params);
			break;

			case 'createSegmentTable':
				createSegmentTable( overlapResults );
			break;
			
			default:
				let errmsg = `get overlaps, unhandled callback: ${callback_olap_return}`;
				console.error( errmsg );
				alert( errmsg );
			break;
		}
    break;

    case 'insertProfiles_return':
		let profile_status = data.payload;
		if ( debug_db > 1) {
			console.log( 'profile inserted: ', profile_status );
		}
		logHtml( '', 'profile load completed');
		document.getElementById("docBody").style.cursor="pointer";
		DBworker.postMessage( {reason:'getProfiles'});    // now load those values back here
    break;
 
    case 'profile_return':		// returns complete table: DB.profiles 
		let profile_list = data.payload;   // try a shallow copy
		if ( profile_list.length > 0 ){
			// only copy over profile identities when we have some. Otherwise, leave the placeholder in place.
			profile_summary = [...profile_list];
		}
		if ( debug_db > 1) {
			console.log( 'profiles are: ', profile_list );
		}
		createKitSelector();
		chrome.runtime.sendMessage( {mode:'pop_profiles', data:profile_list} );
    break;
    
    case 'DBloaded_for_dump':
		db_conlog( 1, `received ${data.payload.byteLength} bytes data : ` );
		dumpSqlite3DB( data.payload);
    break;
     
    case 'return_matchlist':
		db_conlog( 1, `received ${data.payload.length} records for ${data.purpose}. ` );
		if ( data.purpose == 'select') {
			createNameSelector( data.payload );
		} else {
			updateDNAtesterlist( data.payload );
		}
	break;
	 
	case 'ICWPrelude_return':
		// send results back to requesting tab 
		chrome.tabs.sendMessage( data.tabID, {mode:'ICWPrelude_return', data:data.payload} );
	break;

	case 'import_23_done':
	  	// this can select and process multiple files, so go again if we have more files to process.
		if ( CSV23Store.filelist.length > 0 ) {
			readNextCSV23();
		} else {
			CSV_loadDone( data.newsize );
		}
	break;

	case 'migrationOverlapFind':
		migrationOverlapFind_done( data.rowsadded );
	break;

	case 'restoredDB_return':
		post_DB_init_setup();
	break;

	case 'migrate_529_done':
      CSV_loadDone( data.newsize );
    break;

	case 'requestTriangTable_return' :
		chrome.tabs.sendMessage( data.tabID, {mode:'requestTriangTable_return', data:data.payload} );
	break;

	case 'relatives_completed' :
		chrome.tabs.sendMessage( data.tabID, {mode:'relatives_completed', data:data.payload} );
	break;

	case 'messages_completed' :
		chrome.tabs.sendMessage( data.tabID, {mode:'messages_completed', data:data.payload} );
	break;

    default:
      console.log( 'DBWorker msg: ', msgevt );
      logHtml('error', 'Unhandled DBworker msg:', data.reason);
  }
};

DBworker.onerror = function ( evt ) {
	let msg = `DB worker error: in ${evt.filename}, line ${evt.lineno}: ${evt.message}.`;
	logHtml( 'error', msg );
	alert( msg );
}


chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
	msg_conlog( 1, `dbactions listener, mode: ${request.mode}`);
	switch( request.mode ) {

		case  "updateSetting" :
			msg_conlog( 3, `   DBactions updating ${request.item} to ${request.value}` );
			setSetting(request.item, request.value);
		break;

		case  "getSettingObj" :
			( async() => {
				msg_conlog( 2, `   getSettingObj: DBactions returning all settings ` );
				wait4Settings( 2 );
				sendResponse( settings529 );
			})();
			return true;
		break;

		case  "requestTriangTable" :
			DBworker.postMessage( {reason:"requestTriangTable", profile:request.profile, tabID: sender.tab.id} );
		break;


		case  "getDBStatus" :
				// message from popup - need to forward to worker. will return via messaging
			
			msg_conlog( 3, `   getDBStatus: dbmessaging to worker  ` );
			DBworker.postMessage( {reason:"getSummary"} );
			DBworker.postMessage( {reason:"getMatchSummary"} );
		break;

		case "process_relatives":
			// we have a list of relatives from the front page...
			DBworker.postMessage( {reason:"process_relatives", profile:request.profile, relatives:request.relatives, settings:settings529, tabID: sender.tab.id} ); 
		break;


		case "process_messages":
			// we have a list of relatives from the front page...
			DBworker.postMessage( {reason:"process_messages", profile:request.profile, messages:request.messages, settings:settings529, tabID: sender.tab.id} ); 
		break;

		case  "get_ICW_prelude" :
			// message from content script - need to forward to worker. will return via messaging with requested data objects
			// BUT, we have to record the sender tab that it needs to be returned to!
			DBworker.postMessage( {reason:"get_ICW_prelude", matchpair:request.matchpair, tabID: sender.tab.id } );
		break;

		case  "update_haplogroups" :
			// message from content script - need to forward to worker. will not bother returning, just hope it works
			DBworker.postMessage( {reason:"update_haplogroups", matchHapData:request.matchHapData } );
		break;

		case  "update_familytree" :
			// message from content script - need to forward to worker. will not bother returning, just hope it works
			DBworker.postMessage( {reason:"update_familytree", datapkt:request.datapkt } );
		break;

		case  "update_ICWs" :
			// message from content script - need to forward to worker. will not bother returning, just hope it works
			DBworker.postMessage( {reason:"update_ICWs", ICWset:request.ICWset } );
		break;

		case "clear_HTML_area":
			logHtmlClear();
		break;	

		case "checkIfInDatabase":
			checkIfInDatabase( request, sender );
		break;	

		case  "storeSegments":
			storeSegments(request);
		break;	

		case  "store_hidden" :
			save_hidden_records( request.primary, request.matchData );
		break;

		case  "getProfiles4pop" :
				// message from popup - need to forward to worker. will return via messaging
				// we could just return stored array. but for the moment just ask again...
			msg_conlog( 3, `   getProfiles4pop: dbmessaging to worker  ` );
			DBworker.postMessage( {reason:"getProfiles"} );
		break;

		case  "getDebugSettings" :
			msg_conlog( 3, `   DBactions returning debug settings ` );
			sendResponse( {	debug_q: settings529["debug_q"],
							debug_db: settings529["debug_db"],
							debug_msg: settings529["debug_msg"] }  );
		break;
		
		case  "selectUser":
			msg_conlog( 2, `   DBactions changing user to  ${request.userID}` );
			updateSelectedNameViaMsg( request.userID );
		break;

		case "displayPage":
		case "killMeNow" :
			return false;		// leave this for service script to handle
		break;	

		default:
			if ( Object.keys(request).includes("url")) {	
				return false;		// leave this for service script to handle
			} 
			let errmsg = `dbactions_listen: unhandled message mode ${request.mode}.`;
			console.error( errmsg, request);
			alert ( errmsg);
			return false;		// not handled here
	}
 	return ; // either we replied synchronously, or nothing to say yet.
});


DBworker.postMessage({reason: "setdebug", value: 2} );

console.log( 'DB worker instantiation completed');