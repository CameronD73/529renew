/*
** service worker script for 23 and me processing.
** This code is responsible for:
*	* handling options
*	* database processes
*/

/*  eslint-disable no-unused-vars */
"use strict";

var debug_msg = 2;

function conlog( level, msg ) {
	if ( debug_msg >= level ) {
		console.log( msg );
	}
}

conlog( 0, "loading service worker from " + location);

/*
** create the new tab for results presentation.
** It has to be done here because the content scripts do not have permission.
*/
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

		if ( request.mode == "displayPage" ) {
			if(request.url.indexOf( "results_tab.html") > 0){
				open_results_tab(request.url)	
			} else if(request.url!=null){
				chrome.tabs.create({ url: request.url, active: true}, null);
			}

			sendResponse({});
		}
		else
			return false;	// request not handled here
		return;
	}
);

/* this code will create and bring to front a results and database handler tab
** but only if one does not exist already.
** The URL might simply be the html file name in the extension, or a full path with a query parameter.
*/
function open_results_tab( url ) {
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
			// if the new url has a query, it should be  ?id=xxxxxxxxxx
			if (url.indexOf( "?") > 0 ) {
				let urlpos = url.indexOf( "?id=");
				if ( urlpos > 0 ){
					let IDstr = url.substring( urlpos+4 )
					conlog ( 1, `sending results tab id ${IDstr}...`);
					chrome.tabs.sendMessage( tabarr[tabFound].id, {mode:"selectUser", userID:IDstr});
				} else {
					//  otherwise kill the current window and start a new one
					conlog ( 1, "replacing results tab...");
					chrome.tabs.remove( tabarr[tabFound].id, function() {
						chrome.tabs.create( { active:true, url:url });
					} );
				}
			}
		} else {
			conlog ( 1, "no results tab, creating one...")
			chrome.tabs.create( { active:true, url:url });
		}
	  }
	);
}

// fire up the db create/update  code...

chrome.runtime.onInstalled.addListener( function() {
	conlog( 0, "service worker - install/update event");
	open_results_tab("results_tab.html");
  }
);
/*
self.addEventListener( 'activate', function() {
	conlog( 0, "service worker activate event");
	open_results_tab("results_tab.html");
  }
);
*/
