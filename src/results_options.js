/*
** options for handling results presentation.
*/

"use strict";

// functions to set and get a settings item
// local storage may get wiped by accident such as when clearing cookies
// so we keep a separate copy in the DB. This makes the startup sequence
// a bit trickier.  Local storage values takes priority.
// These get loaded first, so they are available if we need to create the DB.


let debug_db = 3;

function db_conlog( level, msg ) {
	if ( debug_db >= level ) {
		console.log( msg );
	}
}

// default values for first time.
const settings529default = {
	"version": 0,		// version of this structure
	"displayMode": "2",
	"textSize": "small",	// never set in old code
	"build": 37,
	"omitAliases": false,
	"hideCloseMatches": false,
	"baseAddressRounding": 0,
	"cMRounding": 2,
	"delay": "2", // units of seconds
	"minimumOverlap": 0, //units of bp
	"lastCSVExportDate": "1900-01-01",
	"lastGEFXExportDate": "1900-01-01"
};

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
						settings_from_storage = true;
						console.log("Stored settings retrieved:", settings529);
						resolve( "loaded" );
					}
			});
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
		// otherwise fall trhrough and apply new value (a different bug)
	};
	settings529[item] = value;
	chrome.storage.local.set( {'set529':settings529 });
	console.log("Settings updated: ",item," ", value);
	updateDBSettings( item, value );
	return true;
};

function getSetting(item){
	//check that item is in settings
	if(!Object.keys(settings529).includes(item)){	
		if(!Object.keys(settings529default).includes(item)){
			console.log("Error in getSettings: item ",item," not in settings");	
			return null;	// clearly a bug
		}
		// otherwise reinstate "lost" setting (a different bug)
		console.log("WEIRD! reinstating lost item ",item );	
		settings529[item] = settings529default[item];
	};
	return settings529[item];
};

// this is rather pointless, but I need to start off the get storage somehow.
wait4Settings(0);
