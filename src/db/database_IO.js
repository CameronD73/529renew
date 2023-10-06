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

// id1 and id2 are the text representation of the 23 and me UID
// It requests count of segment hits between ID1 and ID2 that are saved in the DB.
//     This includes the fake "chromosome 100" record, but not the fake chr 200 record.

function countMatchingSegments_wasm(id1, id2, upgradeIfNeeded, upgradeQueryFailed){
	

	function makeTransaction(id1, id2, callBackSuccess, callBackFailed){
		// Don't query matches with self. Not sure I understand this because then neither callback is fired off.
		if(id1 == id2) return; 
		var firstid = id1;
		var secondid = id2;
		if(id1 > id2){
			firstid = id2;
			secondid = id1;
		}
		db_conlog( 4, `requesting select on id1= ${firstid} and id2= ${secondid}`);
		return function(transaction){
			transaction.executeSql('SELECT id1, id2, COUNT(ROWID) AS hits from ibdsegs WHERE id1=? AND  id2=? AND chromosome < 150 ',[firstid, secondid], callBackSuccess, callBackFailed);
		};
	}
	db_conlog( 4, `   dbREAD ${id1} vs ${id2}` );
	db23.readTransaction(makeTransaction(id1, id2, upgradeIfNeeded, upgradeQueryFailed));
}

const sellist1_wasm = "ibdsegs.ROWID as ROWID,\
	t1.name AS name1,\
	t2.name AS name2,\
	t1.IDText AS id1,\
	t2.IDText AS id2,\
	ibdsegs.chromosome AS chromosome,\
	ibdsegs.start AS start,\
	ibdsegs.end AS end,\
	ibdsegs.cM AS cM,\
	ibdsegs.snps AS snps,\
	ibdsegs.date as segdate";

const joinlist_wasm = "ibdsegs \
	JOIN idalias t1 ON (t1.IDText=ibdsegs.id1 ) \
	JOIN idalias t2 ON (t2.IDText=ibdsegs.id2 ) \
	JOIN ibdsegs t3 ON 	( \
		t3.ROWID=? \
		AND (  	( \
				t3.chromosome=ibdsegs.chromosome \
				AND (ibdsegs.start<=(t3.end-?) AND ibdsegs.end>=(t3.start+?)) \
			) \
			OR ibdsegs.chromosome=100 \
		) AND (  \
				(t3.id1=ibdsegs.id1) \
			OR (t3.id1=ibdsegs.id2 ) \
			OR (t3.id2=ibdsegs.id1 )  \
			OR (t3.id2=ibdsegs.id2 ) \
			) \
		)";

const orderlist_wasm = "chromosome, \
	ibdsegs.start, \
	ibdsegs.end DESC, \
	ibdsegs.ROWID, \
	julianday(t1.date)+julianday(t2.date), \
	t1.ROWID+t2.ROWID";

/*
** returns a table of all segment matches that overlap the one specified by
** input parameter segmentId (which is a ROWID value)
*/
function selectSegmentMatchesFromDatabase_wasm(callbackSuccess, segmentId){
	const sel_short=`SELECT ${sellist1_wasm} FROM ${joinlist_wasm} ORDER BY ${orderlist_wasm}`;
	// convert base addr to MBase address.
	const overlapParam = 1000000 * getSetting( "minimumOverlap" );
	db_conlog( 3, `selectSegmentMatchesFromDatabase: select stmt is: ${sel_short}`);
	function makeTransaction(callback){
		return function(transaction){
			transaction.executeSql( sel_short, [segmentId,overlapParam,overlapParam], callback, callback);
		};
	}
	db23.readTransaction(makeTransaction(callbackSuccess));
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

function requestMigrationFinalise ( evt ) {
	alert( 'Nope, not yet' );
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
** if limitDates it true then we only select those newer than previous save.
*/
function selectFromDatabase_wasm(callbackSuccess, id, chromosome, limitDates, includeChr100){

	var lowerBound=0;
	var upperBound=24;
	var chrNum=parseInt(chromosome);
	if(chrNum>0){
		lowerBound=chrNum-1;
		upperBound=chrNum+1;
	}
	function makeTransaction(callback, limitDates, includeChr100){
		// create export table for entire DB
		const qry_sel = 'SELECT \
				ibdsegs.ROWID as ROWID, \
				t1.name AS name1, \
				t2.name AS name2, \
				t1.IDText AS id1, \
				t2.IDText AS id2, \
				chromosome, start, end, cM, snps, \
				ibdsegs.date as segdate \
			FROM ibdsegs \
			JOIN idalias t1 ON (t1.IDText=ibdsegs.id1) \
			JOIN idalias t2 ON (t2.IDText=ibdsegs.id2)  WHERE ';
		//const qry_build = ' build=?  AND ';
		const qry_cond = '(chromosome>? AND chromosome<?) ';
		const qry_cond100 = '((chromosome>? AND chromosome<?) OR chromosome >= 100) ';
		const qry_order = '	ORDER BY chromosome, start, end DESC, ibdsegs.ROWID, julianday(t1.date)+julianday(t2.date), t1.ROWID+t2.ROWID;';
		// convert to julianday to do a floating point comparison rather than string
		const qry_date = 'AND julianday(ibdsegs.date) >= julianday((SELECT value from settings where setting = "lastCSVExportDate"))'
		var query;
		if ( includeChr100 )
			query = qry_sel + qry_cond100;
		else
			query = qry_sel + qry_cond;
		if( limitDates )
			query += qry_date;
			
		query += qry_order;
		db_conlog(3, `query = ${query} with params ${lowerBound} and ${upperBound}`);
		return function(transaction){
			//transaction.executeSql( query, [build, lowerBound, upperBound], callback, getSegsFailed);
			transaction.executeSql( query, [lowerBound, upperBound], callback, getSegsFailed);
		};
	}

	function makeTransactionWithId(callback, id, limitDates, includeChr100){

		const qry_sel = 'SELECT \
				ibdsegs.ROWID as ROWID, \
				t1.name AS name1, \
				t2.name AS name2, \
				t1.IDText AS id1, \
				t2.IDText AS id2, \
				chromosome, start, end, cM, snps, \
				ibdsegs.date as segdate  \
			FROM ibdsegs \
			JOIN idalias t1 ON (t1.IDText=ibdsegs.id1) \
			JOIN idalias t2 ON (t2.IDText=ibdsegs.id2) \
			WHERE ((ibdsegs.id1=?) OR (ibdsegs.id2=?)) ';
		// const qyr_build = 'AND build=? ';
		const qry_cond = 'AND chromosome>? AND chromosome<? ';
		const qry_cond100 = 'AND ((chromosome>? AND chromosome<?) OR chromosome >= 100) ';
		const qry_order = '	ORDER BY chromosome, start, end DESC, ibdsegs.ROWID, julianday(t1.date)+julianday(t2.date), t1.ROWID+t2.ROWID;';
		const qry_date = 'AND julianday(ibdsegs.date) >= julianday((SELECT value from settings where setting = "lastCSVExportDate"))'
		var query;

		if ( includeChr100 )
			query = qry_sel + qry_cond100;
		else
			query = qry_sel + qry_cond;
		if( limitDates )
			query += qry_date;
			
		query += qry_order;

		db_conlog( 3, `query = ${query} with params ${id}, ${lowerBound} and ${upperBound}`);
		return function(transaction){
			transaction.executeSql(query, [id, id, lowerBound, upperBound], callback, getSegsFailed);
		};
	}
	if(id.length<16){
		// assume this is the "ALL" option
		db23.readTransaction(makeTransaction(callbackSuccess, limitDates, includeChr100));
	}
	else db23.readTransaction(makeTransactionWithId(callbackSuccess, id, limitDates, includeChr100));
}


/*
********************************************************
* the following functions write to the database
********************************************************
*/


// this is a kludge of webSQL callbacks and webworker message passing...
function requestMigrateWebsql( evt ) {
	
	evt.stopPropagation();
	evt.preventDefault();
	document.getElementById("docBody").style.cursor="wait";
	migration_started = secondsToday();

	getWebsqlAliasTable();
}

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