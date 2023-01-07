/*
** service worker script for 23 and me processing.
** This code is responsible for:
*	* handling options
*	* database processes
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

			sendResponse({});
		}
		else if ( request.mode == "killMeNow" ) {
			chrome.tabs.remove( sender.tab.id );
		} else		return false;	// request not handled here
		
		return;
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

/* function currently unused - leave in case I change my mind...
function restart_results_tab(  ) {
	// context can get invalidated if we update in some circumstances I don't understand in detail
	// so we kill it and then start it up again.
	// Unfortunately, the context is retained in the content script, so those need to be refreshed (I won't bother)
	chrome.tabs.query( {}, function(tabarr) {
		conlog( 2, `results tab check for kill returns ${tabarr.length} entries`);
		let tabFound = -1;
		for( let i = 0; i < tabarr.length; i++ ) {
			let ttl = tabarr[i].title;
			conlog( 3, `checking tab ${i} ${ttl} at index ${ttl.indexOf("529Renew")}`);
			if ( ttl.indexOf("529Renew Results" ) >= 0 ) {
				conlog( 1, `found result tab in ${ttl}`);
				tabFound = i;
			}
		}
		if ( tabFound >= 0 ) {
			const resultTabID =  tabarr[tabFound].id;
			conlog ( 1, " removing results tab...")
			chrome.tabs.remove(resultTabID, () => {open_results_tab("results_tab.html", true ); } )
		} else {
			open_results_tab("results_tab.html", true );
		}
	  }
	);
}
*/
// fire up the db create/update  code...

chrome.runtime.onInstalled.addListener( function() {
	conlog( 0, "service worker - install/update event");
	// restart_results_tab();  - did not work as hoped
	open_results_tab("results_tab.html", true );
  }
);
