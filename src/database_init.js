/*
** service worker script for 23 and me processing.
** This code is responsible for:
*	checking existence of the database,
*    create one if necessary and
*    update it to new version  if required.
*/

/*  eslint-disable no-unused-vars */
"use strict";

var debug_db = 2;

function db_conlog( level, msg ) {
	if ( debug_db >= level ) {
		console.log( msg );
	}
}

db_conlog( 1, "loading DB init code");


const dbLatestVersion = "3.0";

const db23 = init529Database();

var pendingTransactionCount=0;
var noPendingTransactionCallBack=null;
function decrementPendingTransactionCount(){
	pendingTransactionCount--;
	if(pendingTransactionCount<=0 && noPendingTransactionCallBack){
		noPendingTransactionCallBack();
		noPendingTransactionCallBack = null;	// ensure we don't call it twice...
	}
}

const current23andMeBuild=37;


const setting_values = '("lastCSVExportDate", ?), ("lastGEFXExportDate", ?), ("displayMode", ?), ("textSize", ?),\
	("build", ?), ("omitAliases", ?), ("hideCloseMatches", ?), ("baseAddressRounding", ?), ("cMRounding", ?),\
	("delay", ?), ("minimumOverlap", ?) ';
const set_defaults_sql = `INSERT INTO settings  (setting, value) VALUES  ${setting_values} ;`;


function createTables( db23new ){
	// Called only when database is created
	//alert(`Creating 529Renew local database from v"${db23new.version}"`);
	//db23new.changeVersion("", "2.0", (tr) => {alert( "ch ver from empty OK")}, (err) => { alert( `change ver from empty FAILED with ${err.code}, msg:${err.message}`)});
	db23new.transaction(
        function (transaction) {
			// ============ the IDALIAS table - each DNA test result has an alias (generally one for each person)
    		transaction.executeSql('CREATE TABLE IF NOT EXISTS idalias(idText TEXT NOT NULL PRIMARY KEY, name TEXT NOT NULL, date TEXT NOT NULL, comment TEXT ) ;', []);
    		transaction.executeSql('CREATE INDEX IF NOT EXISTS idalias_name ON idalias (name);', []);
    	},
		function(error){alert(`Failed to create alias table for 529Renew DB. Error: ${error.message}`);},
		function(){}
    )
	db23new.transaction(
        function (transaction) {
       	// ============ the IBDSEGS table - each row has a single segment match between two testers.
        	transaction.executeSql('CREATE TABLE IF NOT EXISTS ibdsegs(id1 TEXT NOT NULL REFERENCES idalias(idText) DEFERRABLE INITIALLY DEFERRED, id2 TEXT NOT NULL REFERENCES idalias(idText) DEFERRABLE INITIALLY DEFERRED, chromosome INTEGER NOT NULL, start INTEGER NOT NULL, end INTEGER NOT NULL, cM REAL NOT NULL, snps INTEGER NOT NULL,  date TEXT NOT NULL, build INTEGER NOT NULL DEFAULT 37);', []);
    		transaction.executeSql('CREATE INDEX IF NOT EXISTS ibdsegs_id1 ON ibdsegs(id1);', []);
    		transaction.executeSql('CREATE INDEX IF NOT EXISTS ibdsegs_id2 ON ibdsegs(id2);', []);
    		transaction.executeSql('CREATE INDEX IF NOT EXISTS ibssegs_chromosomes ON ibdsegs(chromosome);', []);
    		transaction.executeSql('CREATE UNIQUE INDEX IF NOT EXISTS ibdsegs_kitchen_sink ON ibdsegs( id1, id2, chromosome, start, end, build);', []);
    	},
		function(error){alert(`Failed to create segments table for 529Renew DB. Error: ${error.message}`);},
		function(){}
    )
	const setting_params = [settings529.lastCSVExportDate, settings529.lastGEFXExportDate, settings529.displayMode, settings529.textSize,
		settings529.build, settings529.omitAliases, settings529.hideCloseMatches,
		settings529.baseAddressRounding, settings529.cMRounding, settings529.delay,  settings529.minimumOverlap];

	db23new.transaction(
        function (transaction) {
			transaction.executeSql('CREATE TABLE  IF NOT EXISTS settings (setting TEXT NOT NULL UNIQUE, value TEXT, PRIMARY KEY(setting));', [] );
			transaction.executeSql( set_defaults_sql, setting_params );
    	},
		function(error){alert(`Failed to create settings table for 529Renew DB. Error: ${error.message}`);},
		function(){}
    )
	/* Rats! cannot use Pragma in webSQL!
	db23new.transaction(
        function (transaction) {
			transaction.executeSql( 'PRAGMA journal_mode=WAL;', [] );
		},
		function(error){alert(`Failed to set WAL mode for 529Renew local database. Error: ${error.message}`);},
		function(){}
    )
	*/

	;
	
	alert(`Created 529Renew local database`);
}

/* I don't use this any more... but leave it around as a template for a new db version.
function upgrade_1_4_to_2_0(db23new){
	console.log( "Upgrading to 2.0");
	db23new.transaction(
		function(transaction){
			// Add options table
			transaction.executeSql('CREATE TABLE  IF NOT EXISTS settings (setting TEXT NOT NULL UNIQUE, value TEXT, PRIMARY KEY(setting));', [], function(transaction, results){}, function(tr, error){return false;});
			console.log( "executing " + set_defaults_sql);
			transaction.executeSql( set_defaults_sql, [],
						 function(tr, results){},
						 function(tr, error){ console.log( "oops buggered it: "+error.code + "; msg: " +  error.message); return false;});
		},
		function(error){
			if(db23new.version!="1.4") db23new.changeVersion(db23new.version, "1.4");
		},
		function(){
			// note - the version number seems to be not written to db the first time, only when reopened!
			if(db23new.version!="2.0") db23new.changeVersion(db23new.version, "2.0");
		}
	);
}
*/

function init529Database() {
	let shortName = 'db23r';
	let version = dbLatestVersion;
	let displayName = '529Renew Database';
	let maxSize = 5*1024*1024; //  bytes
	let dbobj = null;

	try {
	    if (!window.openDatabase) {
	        alert('Databases are not supported in this browser.');
	    } else {
	        dbobj = openDatabase(shortName, version, displayName, maxSize, (db23new) => {createTables(db23new)} );
	        if(dbobj==null) alert(`Failed to open a local 529Renew database, version ${version}`);
	    }
	} catch(e) {
	    if (e.name == "INVALID_STATE_ERR" || e.name== "InvalidStateError") {
	        // Version number mismatch.
	        try{
	       	 	dbobj = openDatabase(shortName, "", displayName, maxSize, null);
	       	}
	       	catch(ee){
	       		alert("Failed to open or create a local 529Renew database: " + ee.name + ": "+ee);
	       	}
	        if(dbobj==null)
				alert("Failed to open or create a local 529Renew database");
			else {
				if(dbobj.version < dbLatestVersion )
					alert( `DB stuck on old version ${dbobj.version}`);
				else if( dbobj.version > dbLatestVersion )
					alert( `DB version ${dbobj.version} is newer than extension knows`);
			}
			console.log( `caught error, at db version ${dbobj.version}`);
	        //if(dbobj.version=="1.4") upgrade_1_4_to_2_0(dbobj);
	    } else {
	        alert("Failed to open or create a local 529Renew database: " + e.name + ": " +e);
			return null;
	    }
	    return null;
	}
	return dbobj;
}	


