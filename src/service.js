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
function tabRequest(request, sender, sendResponse) {

	/*
	** don't understand what this does - let's comment it out for the moment...
	** In any case I don't think a service worker can have an onClicked event.

	if(sender.url.indexOf("https://you.23andme.com/tools/relatives/dna/")==0){
		// Avoid adding multiple listeners each time a qualifying page is loaded
		if(!chrome.action.onClicked.hasListener(hoThere)){
			chrome.action.onClicked.addListener(hoThere);
		}
	}
	else{
		// Avoid adding multiple listeners each time a qualifying page is loaded
		if(!chrome.action.onClicked.hasListener(hiThere)){
			chrome.action.onClicked.addListener(hiThere);
		}
	}
	*/

	if(request.url!=null){
		
		chrome.tabs.create({ url: request.url, active: true}, null);
	}

	sendResponse({});
	return;

}



// Listen for the content script to send a message to the background page.
chrome.runtime.onMessage.addListener(tabRequest);

// fire up the db create/update  code...

chrome.runtime.onStartup.addListener( function() {
	conlog( 0, "service worker startup event");
	chrome.tabs.create( { active:true, url:"bgnd.html" });
});

self.addEventListener( 'activate', function() {
	conlog( 0, "service worker activate event");
	chrome.tabs.create( { active:true, url:"bgnd.html" });
});

