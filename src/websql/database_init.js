/*
** service worker script for 23 and me processing.
** This code is responsible for:
*	checking existence of the database,
*    create one if necessary and
*    update it to new version  if required.
*/

/*  eslint-disable no-unused-vars */
"use strict";

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


function createDBTables( db23new ){
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
    );
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
    );
	db23new.transaction(
        function (transaction) {
			transaction.executeSql('CREATE TABLE  IF NOT EXISTS settings (setting TEXT NOT NULL UNIQUE, value TEXT, PRIMARY KEY(setting));', [] );
    	},
		function(error){alert(`Failed to create settings table for 529Renew DB. Error: ${error.message}`);},
		function(){}
    );

	db_conlog( 1, `Submitted transactions to create 529Renew local database v${dbLatestVersion}`);
	alert(`Created 529Renew local database`);
}



function init529Database() {
	let shortName = 'db23r';
	let version = dbLatestVersion;
	let displayName = '529Renew Database';
	let maxSize = 5*1024*1024; //  bytes
	let dbobj = null;

	db_conlog( 1, `initialising ${displayName}`);
	try {
	    if (!window.openDatabase) {
	        alert('SQL Databases are not supported in this browser.');
	    } else {
			console.log( "opening DB" );
	        dbobj = openDatabase(shortName, version, displayName, maxSize, (db23new) => {createDBTables(db23new)} );
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


