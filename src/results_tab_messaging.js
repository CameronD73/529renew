/*
** messaging for results tab
** This file handles the messages to the results tab,  from...
** 1. the origin tabs (23 and me)
** 2. the other extension pages/tabs
** 3. the worker
*/

console.log( 'create_db_worker.js started');

const logHtml = function (cssClass, ...args) {
  const ln = document.createElement('div');
  if (cssClass) ln.classList.add(cssClass);
  ln.append(document.createTextNode(args.join(' ')));
  document.body.append(ln);
  if ( cssClass === 'error' ){
	alert( ...args );
  }
};

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
		chrome.tabs.sendMessage(data.tabID, {mode: "returnNeedCompare", matchpair:data.matchpair, needToCompare: data.needToCompare});
	break;

    case 'init_done':
      db_conlog( 0, 'DB worker init completed');
      db_initialised = true;
	  post_DB_init_setup();
    break;

    case 'summary_return':
      // payload rows is an array of arrays...
      console.log( 'summary returned ', data.payload );
      db_summary = data.payload;   // this seems good enough
      // db_summary = data.payload.rows.map( (r) => [...r] );
      chrome.runtime.sendMessage( {mode:'pop_dbstatus', data:db_summary} );
    break;
 
    case 'insertProfiles_return':
      let profile_status = data.payload;
      console.log( 'profile inserted: ', profile_status );
      document.getElementById("docBody").style.cursor="pointer";
      DBworker.postMessage( {reason:'getProfiles'});    // now load those values back here
    break;
 
    case 'profile_return':		// returns complete table: DB.profiles 
      let profile_list = data.payload;   // try a shallow copy
	  if ( profile_list.length > 0 ){
		// only copy over profile identities when we have some. Otherwise, leave the placeholder in place.
		profile_summary = [...profile_list];
	  }
      console.log( 'profiles are: ', profile_list );
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
   
	case 'import_23_done':
	  	// this can select and process multiple files, so go again if we have more files to process.
		if ( CSV23Store.filelist.length > 0 ) {
			readNextCSV23();
		} else {
			CSV_loadDone( data.newsize );
		}
	break;

	case 'migrationFinalised':
		migrationFinalise_done( data.rowsadded );
	break;

	case 'restoredDB_return':
		post_DB_init_setup();
	break;

	case 'migrate_529_done':
      CSV_loadDone( data.newsize );
    break;

    default:
      console.log( 'DBWorker msg: ', msgevt );
      logHtml('error', 'Unhandled DBworker msg:', data.reason);
  }
};

DBworker.postMessage({reason: "setdebug", value: 2} );


chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
	msg_conlog( 0, `dbactions listener, mode: ${request.mode}`);
	switch( request.mode ) {
		case "checkIfInDatabase":
			checkIfInDatabase( request, sender );
		break;	

		case  "storeSegments":
			storeSegments(request);
		break;	

		case  "store_hidden" :
			save_hidden_records( request.primary, request.matchData );
		break;

		case  "updateSetting" :
			msg_conlog( 2, `   DBactions updating ${request.item} to ${request.value}` );
			setSetting(request.item, request.value);
		break;

		case  "getSettingObj" :
			( async() => {
				msg_conlog( 0, `   getSettingObj: DBactions returning all settings ` );
				wait4Settings( 2 );
				sendResponse( settings529 );
			})();
			return true;
		break;

		case  "getDBStatus" :
				// message from popup - need to forward to worker. will return via messaging
			
			msg_conlog( 0, `   getDBStatus: dbmessaging to worker  ` );
			DBworker.postMessage( {reason:"getSummary"} );
		break;

		case  "getProfiles4pop" :
				// message from popup - need to forward to worker. will return via messaging
				// we could just return stored array. but for the moment just ask again...
			msg_conlog( 0, `   getProfiles4pop: dbmessaging to worker  ` );
			DBworker.postMessage( {reason:"getProfiles"} );
		break;
		
		case  "getDebugSettings" :
			msg_conlog( 2, `   DBactions returning debug settings ` );
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
			console.log( errmsg, request);
			alert ( errmsg);
			return false;		// not handled here
	}
 	return ; // either we replied synchronously, or nothing to say yet.
});

chrome.tabs.onRemoved.addListener( ( tabID, remInfo) =>{
  DBworker.postMessage( {reason: "closing"});
});

console.log( 'worker instantiation has been started');