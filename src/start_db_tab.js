/*
* fire up the extension tab that handles the DB messaging/processing as well as showing results.
*/
/*eslint no-unused-vars: "off"*/

"use strict";

console.log( "telling extn to fire up results tab");

chrome.runtime.sendMessage({mode: "displayPage", url:chrome.runtime.getURL('results_tab.html')} );