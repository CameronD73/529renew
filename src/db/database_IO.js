/*
** database I/O routines for sqlite-wasm version
** These routines communicate  via message passing to the WASM worker
*/

/*  eslint-disable no-unused-vars */
"use strict";

db_conlog( 2, "loading DB_IO script");


/*
********************************************************
* the following group of functions read from the database
********************************************************
*/

/*
** returns a table of all segment matches that overlap the one specified by
** input parameter segmentId (which is a ROWID value)
*/
function selectSegmentMatchesFromDatabase(callbackName, params, segmentId){
	// convert base addr to MBase address.
	const overlapMB = 1000000 * getSetting( "minimumOverlap" );

	DBworker.postMessage( {reason:"getOverlappingSegments", segmentId:segmentId, overlap:overlapMB, callbackName:callbackName, cbParams:params } );
}

// Get a list of names and associated ids for whom any data are available
// Used for storing a name/ID list for later use
function populateDNATesters( ){
	
	DBworker.postMessage( {reason:"getMatchList", filter:'', purpose:'store'} );
}
// Get a reduced list of names and associated ids for whom any data are available
// Used for displaying filtered list of names in results page (or full list if filter is emmpty string)
function getFilteredMatchesFromDatabase( filterText ){

	DBworker.postMessage( {reason:"getMatchList", filter:filterText, purpose:'select'} );
}

function requestOverlapCalculation ( evt ) {
	
	evt.stopPropagation();
	evt.preventDefault();
	document.getElementById("docBody").style.cursor="wait";
	migration_started = secondsToday();

	DBworker.postMessage( {reason:"migrationOverlapFind"} );
	return;
}


function getSegsFailed_wasm( trans, error ) {
	db_conlog(1, `selectFromDB failed: ${error.message}`);
	alert( `DB get seg FAILED: ${error.message}`);
}
/*
** Queries for matches
** this returns the rows of segment data suitable for subsequent processing
** either as display on page or save to csv or gexf files.
** - in: id, either the 16-char UID string, or
**			 "All" for when we ask to export the entire DB.
** limitDates is a boolean
** if dateLimit is a date then we only select those newer than previous save. (otherwise empty string)
*/
function selectFromDatabase(callbackSuccess, id, chromosome, limitDates, includeChr100){
	DBworker.postMessage( {reason:"selectFromDatabase", callback: callbackSuccess, id: id, chr: chromosome, 
			dateLimit: limitDates ?   getSetting('lastCSVExportDate'): '' , incChr100: includeChr100} );
	return;
}


/*
********************************************************
* the following functions write to the database
********************************************************
*/


function requestDeletionFromDatabase(){
	if(confirm("Destroy your new 529Renew local database?\n(ALL saved content will be lost)") ){
		DBworker.postMessage( { reason: 'deleteAllData' });
		alert( 'Now close this "529Renew Results" tab, shutdown Chrome and restart');
	}
}

function updateDBSettings( key, value ) {
	if ( db_initialised ) {
		// nothing we can do if this is called too early
		DBworker.postMessage( { reason: 'updateDBSettings', newsetting: {key: key, value:value} });
	}
}