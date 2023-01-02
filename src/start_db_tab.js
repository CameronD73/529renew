/*
* fire up the extension tab that handles the DB messaging/processing as well as showing results.
* This is spun-off into this separate file just for loading in the "relatives" list page via the
* content script in the manifest file. We fire it up early so it has finished setting up
* by the time the user gets to the profile page.
*/
/*eslint no-unused-vars: "off"*/

"use strict";

console.log( "telling extn to fire up results tab");

chrome.runtime.sendMessage({mode: "displayPage", url:chrome.runtime.getURL('results_tab.html')} );