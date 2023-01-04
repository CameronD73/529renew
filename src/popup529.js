/*
** support code for the popup page for 529Renew - used for setting options.
*/
"use strict";

// local copy of settings.
var settings529 = {};

function setBPRoundingSelector(){
	var widget=document.getElementById("roundingBP");
	widget.value=getSetting( "baseAddressRounding" ).toString();
	widget.onchange=function(){
		setSetting( "baseAddressRounding", parseInt(widget.value));
	};
}
function setcMRoundingSelector(){
	var widget=document.getElementById("roundingcM");
	widget.value=getSetting( "cMRounding" ).toString();
	widget.onchange=function(){
		setSetting( "cMRounding", parseInt(widget.value));
	};
}
function setDelaySelector(){
	var widget=document.getElementById("delay");
	widget.value=getSetting( "delay" );
	widget.onchange=function(){
		setSetting( "delay", widget.value);
	};
}
function setOverlapSelector(){
	var widget=document.getElementById("minimumOverlap");
	widget.value=getSetting( "minimumOverlap" );
	widget.onchange=function(){
		setSetting( "minimumOverlap", widget.value);
	};
}

function setMinSharedInput() {
	var widget=document.getElementById("minSharedNonOverlap");
	widget.value=getSetting( "minSharedNonOverlap" );
	widget.onchange=function(){
		setSetting( "minSharedNonOverlap", widget.value);
	};
}

function setCSVSaveDate() {
	var widget = document.getElementById("exportDate");
	widget.value=getSetting( "lastCSVExportDate" );
	widget.onchange=function(){
		let val = document.getElementById("exportDate").value;
		// using the date type should always result in a valid date, in yyyy-mm-dd format,
		// so we don't need to test anything.
		setSetting(  "lastCSVExportDate", val) ;
	}
}

function setDebugDBSelector(){
	var widget=document.getElementById("debug_db");
	widget.value=getSetting( "debug_db" );
	widget.onchange=function(){
		setSetting( "debug_db", widget.value);
	};
}

function setDebugMSGSelector(){
	var widget=document.getElementById("debug_msg");
	widget.value=getSetting( "debug_msg" );
	widget.onchange=function(){
		setSetting( "debug_msg", widget.value);
	};
}
function setDebugQSelector(){
	var widget=document.getElementById("debug_q");
	widget.value=getSetting( "debug_q" );
	widget.onchange=function(){
		setSetting( "debug_q", widget.value);
	};
}

/* ignore this for now...
function setBuildSelector(){
	return;		// ignore this atm.
	
	var widget=document.getElementById("build");
	widget.value=getSetting( "build");
	widget.onchange=function(){
		setSetting( "build", widget.value);
		if(document.getElementById("table_div").hasChildNodes()){
			requestSelectFromDatabase(false, false);
		}
	};
}
*/


function setSetting(item,value){
	//check that item is in settings
	if(!Object.keys(settings529).includes(item)){
        let errmsg = `WEIRD! Error in setSettings: lost item ${item}`;
		console.error( errmsg );	
        alert( errmsg );
		// otherwise fall through and apply new value (a different bug)
	};
	settings529[item] = value;

    try {
		chrome.runtime.sendMessage({mode: "updateSetting", item: item, value: value } );
	} catch( e ) {
		handleMessageCatches( "updating Settings.", e );
	}

	return true;
};

function getSetting(item){
	//check that item is in settings
	if(!Object.keys(settings529).includes(item)){	
        let errmsg = `Error in getSettings: '${item}' not in settings`;
        console.error(errmsg);	
        alert( errmsg );
        return null;	// clearly a bug
	};
	return settings529[item];
};
/*
** once the settings object gets passed back, then we can populate the widgets
*/
function installSettings( settingsObj ) {

    
    Object.assign(settings529, settingsObj);
    //console.log( `installSettings called with ${Object.keys(settingsObj).length} items`);

    setBPRoundingSelector();
	setcMRoundingSelector();
	setDelaySelector();
    setOverlapSelector();
	setMinSharedInput();

	setCSVSaveDate();
    setDebugDBSelector();
    setDebugMSGSelector();
    setDebugQSelector();

};

function handleMessageCatches( location, err ) {
	let msg =  ` failed to send message ${location}\n Result was "${err.message}"`;
	console.error( msg );
	alert( msg + "\nTry closing all tabs or restarting" );
	return;
}
/*
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      //this callback is made when the query made via run_query() returns with the required details
      // and decision as to whether ibd data needs to be requested from the 23 and me server.
      //
      if(request.mode == "returnSettingObj"){
        console.log("settings via return message...", request.allsetting)
        installSettings( request.allsettings );
          return;
      }
      return false;     // handle this elsewhere.
    }
);
*/


function load_settings() {
	console.log( "load_settings popup, waiting for settings to be returned.");
    try {
		chrome.runtime.sendMessage({mode: "getSettingObj" }, installSettings );
	} catch( e ) {
		handleMessageCatches( "getting Settings.", e );
	}
	console.log( "load_settings in popup complete.");
    document.getElementById("allOptions")?.classList.remove( "invisible");
	
}


chrome.tabs.query( {} ).then(  
    (tabarr) => {
        let tabFound = -1;
        for( let i = 0; i < tabarr.length; i++ ) {
            let ttl = tabarr[i].title;
            if ( ttl.indexOf("529Renew Results" ) >= 0 ) {
                tabFound = i;
            }
        }
        if ( tabFound >= 0 ) {
            load_settings();        // already present - just talk to it...
        } else {
            // does not exist - fire it up...
            chrome.runtime.sendMessage({mode: "displayPage", url:chrome.runtime.getURL('results_tab.html')}, () => {
                setTimeout( () => load_settings(), 1000 ); 
            } );
        }
    },
    () => { console.error( "popup: Broken promise on tab check"); }
 );