/*
** support code for the popup page for 529Renew - used for setting options.
*/
"use strict";

// local copy of settings.
var settings529 = {};
let current529Version = "0.0";
var db_status_test = [
	['DB Version', 1],
	['no data', 0],
	['yet', 0]
];

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
function setRelPaddingSelector(){
	var widget=document.getElementById("relativePadding");
	widget.value=getSetting( "relativePixelPadding" ).toString();
	widget.onchange=function(){
		setSetting( "relativePixelPadding", parseInt(widget.value));
	};
}

function setNoteLengthSelector(){
	var widget=document.getElementById("maxNoteLength");
	widget.value=getSetting( "displayNotesLength" ).toString();
	widget.onchange=function(){
		setSetting( "displayNotesLength", parseInt(widget.value));
	};
}
function setOverlapValue(){
	var widget=document.getElementById("minimumOverlap");
	widget.value=getSetting( "minimumOverlap" );
	widget.onchange=function(){
		setSetting( "minimumOverlap", widget.value);
	};
}

function setReplaceSelector(){
	var widget=document.getElementById("importReplaces");
	widget.value=(getSetting( "importReplaces" ) == 0? "0" : "1" );
	widget.onchange=function(){
		setSetting( "importReplaces", widget.value);
	};
}

function setFavouriteSelector(){
	var widget=document.getElementById("favouritesScanned");
	widget.value=(getSetting( "favouritesAreScanned" ) == 0? "0" : "1" );
	widget.onchange=function(){
		setSetting( "favouritesAreScanned", widget.value);
	};
}

function setMinSharedInput() {
	var widget=document.getElementById("minSharedNonOverlap");
	widget.value=getSetting( "minSharedNonOverlap" );
	widget.onchange=function(){
		setSetting( "minSharedNonOverlap", widget.value);
	};
}

function setCloseTabSelector(){
	var widget=document.getElementById("closeTabImmediate");
	widget.value=(getSetting( "closeTabImmediate" ) == 0? "0" : "1" );
	widget.onchange=function(){
		setSetting( "closeTabImmediate", widget.value);
	};
}

function setNonOverlapSelector(){
	var widget=document.getElementById("alwaysIncludeNonOverlap");
	widget.value=(getSetting( "alwaysIncludeNonOverlap" ) == 0? "0" : "1" );
	widget.onchange=function(){
		setSetting( "alwaysIncludeNonOverlap", widget.value);
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
function setVersionSelector(){
	var widget=document.getElementById("versioning");
	widget.value=getSetting( "version" );
	widget.onchange=function(){
		setSetting( "version", widget.value);
	};
}

function showDBStatusTable( db_status ) {
	// Remove any preexisting table
	let st = document.getElementById("status_table");
	while(st.hasChildNodes()){
		st.removeChild( st.firstChild );
	}
	let dbstatusTable=document.createElement("table");

	st.appendChild(dbstatusTable);
	let ncols = db_status.length;		// we display transposed
	if (ncols < 2 ) {
		alert( `Error: DB status table has only ${ncols} rows`);
		return;
	}
	dbstatusTable.createCaption( ).innerHTML = 'Size of various tables in new DB';
	dbstatusTable.style.border = '1px solid black';
	dbstatusTable.setAttribute( 'class', 'dbstatus');
	// first row of table
	let tablerow = dbstatusTable.insertRow(0);
	tablerow.style.border = '1px solid black';
	let currCol = 0;

	(tablerow.insertCell( 0 )).innerHTML = db_status[0][0];
	let thcell = tablerow.insertCell( 1 );
	thcell.innerHTML = "  Table:";
	thcell.setAttribute( 'class', 'dbstatus');
	thcell.style.fontWeight = 'bold';
	for(let i = 1; i < ncols; i++){
		let cell = tablerow.insertCell( -1 );
		cell.innerHTML = db_status[i][0];
		cell.setAttribute( 'class', 'dbstatus');
	}
	// 2nd row
	tablerow = dbstatusTable.insertRow(1);
	tablerow.style.border = '1px solid black';
	currCol = 0;

	(tablerow.insertCell( 0 )).innerHTML = db_status[0][1];
	thcell = tablerow.insertCell( 1 );
	thcell.innerHTML = "  Rows:";
	thcell.setAttribute( 'class', 'dbstatus');
	thcell.style.fontWeight = 'bold';
	for(let i = 1; i < ncols; i++){
		let cell = tablerow.insertCell( -1 );
		cell.innerHTML = db_status[i][1];
		cell.setAttribute( 'class', 'dbstatus dbstnum');
	}

}

function showDBMatchStatusTable( db_status ) {
	// Remove any preexisting table
	let headings=[ 'Chrom', 'Triangs x2p', '2-way overlaps x2p', 'Triang i2p', '2-way overlaps i2p'];
	let st = document.getElementById("match_status_table");
	while(st.hasChildNodes()){
		st.removeChild( st.firstChild );
	}
	let dbstatusTable=document.createElement("table");

	st.appendChild(dbstatusTable);
	let ncols = db_status.length;		// we display transposed
	if (ncols < 2 ) {
		return;
	}
	dbstatusTable.createCaption( ).innerHTML = 'Number of 3-way and 2-way overlaps found on each chromosome';
	dbstatusTable.style.border = '1px solid black';
	dbstatusTable.setAttribute( 'class', 'dbstatus');
	// first row of table
	let tablerow = dbstatusTable.insertRow(0);
	tablerow.style.border = '1px solid black';

	let thcell = tablerow.insertCell( 0 );
	thcell.innerHTML = headings[0];
	thcell.setAttribute( 'class', 'dbstatus');
	thcell.style.fontWeight = 'bold';
	for(let i = 0; i < ncols; i++){
		let cell = tablerow.insertCell( -1 );
		let value = (db_status[i][0]).toString();
		if( value === '-1' ) cell.innerHTML = "No check";
		else if( value === '-2' ) cell.innerHTML = "hidden";
		else if( value === '0' ) cell.innerHTML = "3-way false";
		else if( value === '23' ) cell.innerHTML = "X";
		else cell.innerHTML = value;
		cell.setAttribute( 'class', 'dbstatus');
	}
	// 2nd and later rows
	for( let row = 1; row < 5 ; row++ ) {
		tablerow = dbstatusTable.insertRow(row);
		tablerow.style.border = '1px solid black';

		let thcell = tablerow.insertCell( 0 );
		thcell.innerHTML = headings[row];
		thcell.setAttribute( 'class', 'dbstatus');
		thcell.style.fontWeight = 'bold';
		for(let i = 0; i < ncols; i++){
			let cell = tablerow.insertCell( -1 );
			cell.innerHTML = db_status[i][row];
			cell.setAttribute( 'class', 'dbstatus dbstnum');
		}
	}

}

function showProfileTable( profiles ) {
	let st = document.getElementById("profile_table");
	while(st.hasChildNodes()){
		st.removeChild( st.firstChild );
	}
	let prfTable=document.createElement("table");

	st.appendChild(prfTable);
	let nrows = profiles.length;	
	prfTable.createCaption( ).innerHTML = 'Profile Kits';
	prfTable.style.border = '1px solid black';
	prfTable.setAttribute( 'class', 'dbstatus');
	// first row of table
	let tablerow = prfTable.insertRow(0);
	tablerow.style.border = '1px solid black';

	(tablerow.insertCell( 0 )).innerHTML = 'ID (from 23 and Me)';
	(tablerow.insertCell( 1 )).innerHTML = 'short name' ;
	for(let i = 0; i < nrows; i++){
		tablerow = prfTable.insertRow(-1);
		tablerow.style.border = '1px solid black';
		let cell = tablerow.insertCell( 0 );
		cell.innerHTML = profiles[i].IDprofile;
		cell.setAttribute( 'class', 'dbstatus');
		cell = tablerow.insertCell( 1 );
		cell.innerHTML = profiles[i].pname;
		cell.setAttribute( 'class', 'dbstatus');
	}

}

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
        let errmsg = `Error in popup getSetting: '${item}' not in settings`;
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

	setcMRoundingSelector();
	setDelaySelector();
	setMinSharedInput();
	setCloseTabSelector();
	setReplaceSelector();
	setFavouriteSelector();
    setOverlapValue();
	setNonOverlapSelector();
	setRelPaddingSelector();
	setNoteLengthSelector();

	setCSVSaveDate();
    setDebugDBSelector();
    setDebugMSGSelector();
    setDebugQSelector();
	setVersionSelector();

	//showDBStatusTable( db_status_test );
	get_db_status();
	copy_profile_list();

};

function handleMessageCatches( location, err ) {
	let msg =  ` failed to send message ${location}\n Result was "${err.message}"`;
	console.error( msg );
	alert( msg + "\nTry closing all tabs or restarting" );
	return;
}


function load_settings() {
	console.log( "load_settings popup, waiting for settings to be returned.");
    try {
		chrome.runtime.sendMessage({mode: "getSettingObj" }, installSettings );
	} catch( e ) {
		handleMessageCatches( "getting Settings.", e );
	}
	current529Version = chrome.runtime.getManifest().version;
	console.log( `load_settings in popup complete for ver ${current529Version}.`);
    document.getElementById("allOptions")?.classList.remove( "invisible");
	document.getElementById("ver529").innerText = current529Version;
	
}

function get_db_status() {
	console.log( "get_db_status for popup");
    try {
		chrome.runtime.sendMessage({mode: "getDBStatus" } );	// data return via separate message
	} catch( e ) {
		handleMessageCatches( "getting DB status.", e );
	}
}

function copy_profile_list() {
	console.log( "get profile list for popup");
    try {
		chrome.runtime.sendMessage({mode: "getProfiles4pop" } );	// data return via separate message
	} catch( e ) {
		handleMessageCatches( "getting profiles for popup.", e );
	}
}

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
	  console.log( `popup listener, mode: ${request.mode}`);
	  if(request.mode == "pop_dbstatus"){
		showDBStatusTable( request.data );
	  } else if(request.mode == "pop_profiles"){
		showProfileTable( request.data );
	  } else  if(request.mode == "pop_dbstatusMatches"){
		showDBMatchStatusTable( request.data );
	  } else if(request.mode == "pop_profiles"){
		showProfileTable( request.data );
	  } else {
		return false;
	  }
	  return;
	}
);


document.addEventListener('DOMContentLoaded',  function () {
	( async() => {
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
					console.log( 'Exists, loading settings immediately');
            load_settings();        // already present - just talk to it...
        } else {
            // does not exist - fire it up...
            chrome.runtime.sendMessage({mode: "displayPage", url:chrome.runtime.getURL('results_tab.html')}, () => {
                setTimeout( () => load_settings(), 1000 ); 
            } );
        }
    },
			() => { console.error( "popup: Broken promise on results tab check"); }
 		)
	} ) ();
} );