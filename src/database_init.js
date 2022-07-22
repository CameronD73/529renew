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


const dbLatestVersion = "2.0";

const db23 = init529Database();

var pendingTransactionCount=0;
var noPendingTransactionCallBack=null;
function decrementPendingTransactionCount(){
	pendingTransactionCount--;
	if(pendingTransactionCount<=0 && noPendingTransactionCallBack){
		noPendingTransactionCallBack();
	}
}


const sharingNamesAndIds=null;		// don't think this is used now
// function getSharingNamesAndIds(){
// 	return sharingNamesAndIds;
// }

const profileNamesAndIds=null;		// don't think this is used now
// function getProfileNamesAndIds(){
// 	return profileNamesAndIds;
// }

const current23andMeBuild=37;
var build=37;
function setBuild(val){
	build=val;
}
function getBuild(){
	return build;
}



const setting_values = '("lastCSVExportDate", "1900-01-01"),\
	("lastGEFXExportDate", "1900-01-01"),\
	("displayMode", "0"),\
	("textSize", "small"),\
	("omitAliases", "n"),\
	("alwaysShowPhase", "n"),\
	("alwaysShowLabels", "n"),\
	("alwaysShowCommonAncestors", "n"),\
	("hideCloseMatches", "n") ';
const set_defaults_sql = `INSERT INTO settings  (setting, value) VALUES  ${setting_values} ;`


function createTables( db23new ){
	// Called only when database is created
	// alert(`Creating 529Renew local database from v"${db23new.version}"`);
	//db23new.changeVersion("", "2.0", (tr) => {alert( "ch ver from empty OK")}, (err) => { alert( `change ver from empty FAILED with ${err.code}, msg:${err.message}`)});
	db23new.transaction(
        function (transaction) {
        	// Should actually store company in idalias not ibdsegs
        	// Should add comment field to ibdsegs for future use
        	transaction.executeSql('CREATE TABLE IF NOT EXISTS ibdsegs(id1_1 INTEGER NOT NULL, id1_2 INTEGER NOT NULL, id2_1 INTEGER NOT NULL, id2_2 INTEGER NOT NULL, chromosome INTEGER NOT NULL, start INTEGER NOT NULL, end INTEGER NOT NULL, centimorgans REAL NOT NULL, snps INTEGER NOT NULL, phase1 INTEGER, relationship1 TEXT, phase2 INTEGER, relationship2 TEXT, date TEXT NOT NULL, comment TEXT, build INTEGER NOT NULL DEFAULT 37);', []);
    		transaction.executeSql('CREATE INDEX IF NOT EXISTS ibdsegs_id1 ON ibdsegs(id1_1, id1_2);', []);
    		transaction.executeSql('CREATE INDEX IF NOT EXISTS ibdsegs_id2 ON ibdsegs(id2_1, id2_2);', []);
    		transaction.executeSql('CREATE INDEX IF NOT EXISTS ibdsegs_ids ON ibdsegs(id1_1, id1_2, id2_1, id2_2);', []);
    		transaction.executeSql('CREATE INDEX IF NOT EXISTS ibssegs_chromosomes ON ibdsegs(chromosome);', []);
    		transaction.executeSql('CREATE INDEX IF NOT EXISTS ibssegs_chromosomes_id1 ON ibdsegs(id1_1, id1_2, chromosome);', []);
    		transaction.executeSql('CREATE INDEX IF NOT EXISTS ibssegs_chromosomes_id2 ON ibdsegs(id2_1, id2_2, chromosome);', []);
    		transaction.executeSql('CREATE UNIQUE INDEX IF NOT EXISTS ibssegs_ids_chromosomes_segs ON ibdsegs(id1_1, id1_2, id2_1, id2_2, chromosome, start, end, build);', []);
    	
    		transaction.executeSql('CREATE TABLE IF NOT EXISTS idalias(id_1 INTEGER NOT NULL, id_2 INTEGER NOT NULL, name TEXT NOT NULL, date TEXT NOT NULL, company_id INTEGER NOT NULL);', []);
    		transaction.executeSql('CREATE INDEX IF NOT EXISTS idalias_ids ON idalias(id_1, id_2);', []);
    		transaction.executeSql('CREATE UNIQUE INDEX IF NOT EXISTS idalias_ids_names ON idalias (id_1, id_2, name, company_id);', []);
			transaction.executeSql('CREATE TABLE  IF NOT EXISTS settings (setting TEXT NOT NULL UNIQUE, value TEXT, PRIMARY KEY(setting));', [] );
			transaction.executeSql( set_defaults_sql, [] );
    	},
		function(error){alert("Failed to create tables for 529Renew local database");},
		function(){}
    );
	
	alert(`Created 529Renew local database from v"${db23new.version}"`);
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


