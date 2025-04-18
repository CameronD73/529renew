/*
** options for handling results presentation.
*/

"use strict";

// functions to set and get a settings item
// local storage may get wiped by accident such as when clearing cookies
// so we keep a separate copy in the DB. This makes the startup sequence
// a bit trickier.  Local storage values takes priority.
// These get loaded first, so they are available if we need to create the DB.

// We can't just use the debug values in the settings as we might need a value before the
// settings get initialised.
// These will get defaulted to zero (or user choice) as soon as retrieveSettingsP is called
let debug_db = 2;
let debug_msg = 3;

function db_conlog( level, msg ) {
	if ( debug_db >= level ) {
		console.log( msg );
	}
}

function msg_conlog( level, msg ) {
	if ( debug_msg >= level ) {
		console.log( msg );
	}
}

// default values for first time.
// Use string for integers to stop conversion to float in DB.
const settings529default = {
	"version": 4,		// version of this structure
	"displayMode": "2",
	"textSize": "small",	// never set in old code
	"build": "37",
	"omitAliases": false,
	"hideCloseMatches": false,
	"baseAddressRounding": "0",
	"cMRounding": "2",
	"delay": "2", // units of seconds
	"minimumOverlap": "1", //units of Mbp
	"lastCSVExportDate": "1900-01-01",
	"lastGEFXExportDate": "1900-01-01",		// yes, it's a typo
	"debug_db": "0",
	"debug_q": "0",
	"debug_msg": "0",
	"minSharedNonOverlap": 0.07,		// percentage
	"closeTabImmediate": "0",
	"alwaysIncludeNonOverlap": "1",
	"importReplaces": "0",
	"relativePixelPadding": "3",
	"displayNotesLength": "100",
	"autoLoadICW": "0",
	"favouritesAreScanned": "0",		// useless at the moment (ignored)
	"lastGDAT_ICW_ExportDate": "1900-01-01",
	"lastGDAT_Rels_ExportPerProf": {default:"1900-01-01",},
};
const settings_upgrade_0to1 = {
	"debug_db": "0",
	"debug_q": "0",
	"debug_msg": "0",
	"minSharedNonOverlap": 0.08,  // 0.08 will allow all
	"closeTabImmediate": "0",
	"alwaysIncludeNonOverlap": "0"
};

const settings_upgrade_1to2 = {
	"importReplaces": "0"		// if imports and migrate uses replace (1) or ignore (0)
};

const settings_upgrade_2to3 = {
	"relativePixelPadding": "3",		// how many pixels padding for each relative list
	"displayNotesLength": "100",			// how many chars to show notes next to relative name.
	"autoLoadICW": "0",					// if we should auto-click the "load relatives in common" button.
	"favouritesAreScanned": "0"
};

const settings_upgrade_3to4 = {
	"lastGDAT_ICW_ExportDate": "1900-01-01",
	"lastGDAT_Rels_ExportPerProf": {default:"1900-01-01",},
}

// in-page cache of settings
var settings529 = {};
var settings_from_storage;

// this ugly bit of promise wrapping is because the code (DOMload listener) often requires the data before chrome bothers to return any values.
function retrieveSettingsP() {
	return  new Promise( ( resolve, reject) => {
		try {
			if(settings_from_storage !== undefined ) {
				console.log( `settings_status already ${settings_from_storage}`)
				resolve( "already");		// everything is already loaded.
			}
			chrome.storage.local.get('set529',
				(data) => {
					if(typeof data.set529 == 'undefined'){
					// no stored values so load default values
						Object.assign(settings529, settings529default);
						chrome.storage.local.set( {'set529':settings529 });
						settings_from_storage = false;
						console.log("No settings found in storage. Default values loaded and stored.");
						resolve( "new" );
					} else {
					// saved values exist so we use them
						Object.assign(settings529, data.set529);
						if(settings529["version"] < 1 ) {
							// merge in new values...
							Object.assign(settings529, settings_upgrade_0to1);
							setSetting( "version", 1 );
						}
						if(settings529["version"] < 2 ) {
							// merge in new values...
							Object.assign(settings529, settings_upgrade_1to2);
							setSetting( "version", 2 );
						}
						if(settings529["version"] < 3 ) {
							// merge in new values...
							Object.assign(settings529, settings_upgrade_2to3);
							setSetting( "version", 3 );
						}
						if(settings529["version"] < 4 ) {
							// merge in new values...
							Object.assign(settings529, settings_upgrade_3to4);
							setSetting( "version", 4 );
						}
						settings_from_storage = true;
						console.log("Stored settings retrieved:", settings529); 
						// update local copies...
						debug_db = settings529["debug_db"];
						debug_msg = settings529["debug_msg"];
						resolve( "loaded" );
					}
				}
			);
		} catch( error ) {
			reject( error );
		}
	});
}

async function wait4Settings( idnum ) {
	console.log( `===> waiting for settings load ${idnum}.`);
	const settingStatus = await retrieveSettingsP();
	console.log( `<=== done settings load ${idnum}, with ${settingStatus}`);
}


function setSetting(item,value){
	//check that item is in settings
	if(!Object.keys(settings529).includes(item)){
		if(!Object.keys(settings529default).includes(item)){
			console.log("Error in setSettings: item ",item," not in settings");	
			return false;	// clearly a bug
		}
		console.log("WEIRD! Error in setSettings: lost item ",item );	
		// otherwise fall through and apply new value (a different bug)
	};
	if ( item == "lastGDAT_Rels_ExportPerProf" ) {
		// value in this case is a string, or an object indexed by profile ID...
		if ( typeof value === "string") {
			// then assign this value to all 
			for( const key of  Object.keys(settings529["lastGDAT_Rels_ExportPerProf"]) ) {
				settings529["lastGDAT_Rels_ExportPerProf"][key] = value;
			}
		} else if( typeof value === "object" ) {
			Object.assign( settings529["lastGDAT_Rels_ExportPerProf"], value);
		} else {
			console.error( `setSetting(lastGDAT_Rels_ExportPerProf) was passed value type ${typeof value}`);
		}
	} else {
		settings529[item] = value;
		if ( item == "debug_db" ) {
			debug_db = value;
			//set_option_visibility( 1 );		// results tab only (not popup)
		}
		else if ( item == "debug_msg" )  {
			debug_msg = value;
		};
	}
	chrome.storage.local.set( {'set529':settings529 });
	console.log("Settings updated: ",item," ", value);
	updateDBSettings( item, settings529[item] );
	return true;
};

function getSetting(item){
	//check that item is in settings
	if(!Object.keys(settings529).includes(item)){	
		if(!Object.keys(settings529default).includes(item)){
			console.error("Error in getSettings: item ",item," not in settings");	
			return null;	// clearly a bug
		}
		// otherwise reinstate "lost" setting (a different bug)
		console.error("WEIRD! reinstating lost item ",item );	
		settings529[item] = settings529default[item];
	};
	return settings529[item];
};


/*
** dump all settings into DB list (at the moment, just as a diagnostic tool)
*/
function populate_settings(  ){
	for( const [key, value] of  Object.entries(settings529) ) {
		updateDBSettings( key, value );
	}
}
