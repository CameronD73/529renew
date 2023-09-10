/*
** service worker script for 23 and me processing.
** This code is responsible for handling creation of results_tab
** and ensuring unnecessary duplicates are avoided.
*/

/*  eslint-disable no-unused-vars */
"use strict";

var debug_msg = 1;		// only used in the service worker

function conlog( level, msg ) {
	if ( debug_msg >= level ) {
		console.log( msg );
	}
}

conlog( 0, "loading service worker from " + location);

/*
** create any new tabs
** It has to be done here because the content scripts do not have permission.
*/
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

		if ( request.mode == "displayPage" ) {
			if(request.url.indexOf( "results_tab.html") > 0){
				if( request.url.indexOf( "html?id") > 0) {
					open_results_tab(request.url, true);
				} else {
					open_results_tab(request.url, false);
				}
			} else if(request.url!=null){
				chrome.tabs.create({ url: request.url, active: true}, null);
			}

			if ( sendResponse !== undefined ) 
				sendResponse({});
			else 
				conlog( 1, "no response to send");
		}
		else if ( request.mode == "killMeNow" ) {
			chrome.tabs.remove( sender.tab.id );
		}
		else
			return false;	// request not handled here
		
		return true;
	}
);

/* this code will create and bring to front a results and database handler tab
** but only if one does not exist already.
** The URL might simply be the html file name in the extension, or a full path with a query parameter.
*/
function open_results_tab( url, atFront ) {
	// we cannot ask for a partial title match, so we need to get all and check each one...
	// Note - cannot use arrow function as url becomes out of scope.
	chrome.tabs.query( {}, function(tabarr) {
		conlog( 1, `results tab check returns ${tabarr.length} entries`);
		let tabFound = -1;
		for( let i = 0; i < tabarr.length; i++ ) {
			let ttl = tabarr[i].title;
			conlog( 2, `checking tab ${i} ${ttl} at index ${ttl.indexOf("529Renew")}`);
			if ( ttl.indexOf("529Renew Results" ) >= 0 ) {
				conlog( 1, `found result tab in ${ttl}`);
				tabFound = i;
			}
		}
		if ( tabFound >= 0 ) {
			const resultTabID =  tabarr[tabFound].id;
			// if the new url has a query, it should be  ?id=xxxxxxxxxx
			if (url.indexOf( "?") > 0 ) {
				let urlpos = url.indexOf( "?id=");
				if ( urlpos > 0 ){
					let IDstr = url.substring( urlpos+4 )
					conlog ( 1, `sending results tab id ${IDstr}...`);
					chrome.tabs.sendMessage(resultTabID, {mode:"selectUser", userID:IDstr});
					chrome.tabs.update( resultTabID, {active:true});
				} else {
					//  otherwise kill the current window and start a new one
					conlog ( 1, "replacing results tab...");
					chrome.tabs.remove( resultTabID, function() {
						chrome.tabs.create( { active:atFront, url:url });
					} );
				}
			}
		} else {
			conlog ( 1, "no results tab, creating one...")
			chrome.tabs.create( { active:atFront, url:url });
		}
	  }
	);
}


// fire up the db create/update  code...

chrome.runtime.onInstalled.addListener( function(details) {
	const currentVersion = chrome.runtime.getManifest().version;
	const previousVersion = details.previousVersion;
	const reason = details.reason;
	// restart_results_tab();  - did not work as hoped
	switch( reason ) {
		case  'install':
			conlog( 0, "529 extension installed");
			open_results_tab("results_tab.html", true );
			break;
		case 'update':
			conlog(0, `529 extension updated from ${previousVersion} to ${currentVersion}.`);
			open_results_tab("results_tab.html", false );
			if (previousVersion != currentVersion) {
			  if (previousVersion.startsWith( '1.2.')  ){
				chrome.tabs.create({ active:true, url: 'whatsnew-1_3.html' });
			  }
			}
			break;  
		default:
			open_results_tab("results_tab.html", false );
			console.log(`529 service worker installed for reason: ${reason}`);
			break;
		}
  }
);
