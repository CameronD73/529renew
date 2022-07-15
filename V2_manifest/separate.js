// Called when a message is passed.  We assume that the content script
// wants to show the page action.
/*  eslint-disable no-unused-vars */
"use strict";

var debug_msg = 2;

function conlog( level, msg ) {
	if ( debug_msg >= level ) {
		console.log( msg );
	}
}

conlog( 0, "loading BG script");

var db23=null;

var pendingTransactionCount=0;
var noPendingTransactionCallBack=null;
function decrementPendingTransactionCount(){
	pendingTransactionCount--;
	if(pendingTransactionCount<=0 && noPendingTransactionCallBack){
		noPendingTransactionCallBack();
	}
}


var sharingNamesAndIds=null;
function getSharingNamesAndIds(){
	return sharingNamesAndIds;
}

var profileNamesAndIds=null;
function getProfileNamesAndIds(){
	return profileNamesAndIds;
}

var displayMode=0;
function setDisplayMode(val){
	displayMode=val;
}
function getDisplayMode(){
	return displayMode;
}

var textSize="small";
function setTextSize(val){
	textSize=val;
}
function getTextSize(val){
	return textSize;
}

var current23andMeBuild=37;
var build=37;
function setBuild(val){
	build=val;
}
function getBuild(){
	return build;
}

var omitAliases=false;
function setOmitAliases(val){
	omitAliases=val;
}
function getOmitAliases(){
	return omitAliases;
}

var alwaysShowPhase=false;
function setAlwaysShowPhase(val){
	alwaysShowPhase=val;
}
function getAlwaysShowPhase(){
	return alwaysShowPhase;
}

var alwaysShowLabels=false;
function setAlwaysShowLabels(val){
	alwaysShowLabels=val;
}
function getAlwaysShowLabels(){
	return alwaysShowLabels;
}

var alwaysShowCommonAncestors=false;
function setAlwaysShowCommonAncestors(val){
	alwaysShowCommonAncestors=val;
}
function getAlwaysShowCommonAncestors(){
	return alwaysShowCommonAncestors;
}

var hideCloseMatches=false;
function setHideCloseMatches(val){
	hideCloseMatches=val;
}
function getHideCloseMatches(){
	return hideCloseMatches;
}

function echo(command){
	command();
}
/* not used
function echo2(command){
	command();
}

function openURL(url){
	chrome.tabs.create({ url: url, active: false}, null);
}
function openActiveURL(url){
	chrome.tabs.create({ url: url, active: true}, null);
}
*/

function upgradeToCurrentBuild(id1_1, id1_2, id2_1, id2_2, upgradeIfNeeded, upgradeQueryFailed){

	function makeTransaction(id1_1, id1_2, id2_1, id2_2, callBackSuccess, callBackFailed){
		var compared=compareNumbers(id1_1, id1_2, id2_1, id2_2);
		if(compared==0) return; // Don't query matches with self
		if(compared<0){
			var temp=id1_1;
			id1_1=id2_1;
			id2_1=temp;
			
			temp=id1_2;
			id1_2=id2_2;
			id2_2=temp;
		}
		return function(transaction){
			transaction.executeSql('SELECT id1_1, id1_2, id2_1, id2_2, COUNT(ROWID) AS hits from ibdsegs WHERE id1_1=? AND id1_2=? AND id2_1=? AND id2_2=? AND build=?',[id1_1, id1_2, id2_1, id2_2, current23andMeBuild], callBackSuccess, callBackFailed);
		};
	}
	conlog( 2, `   dbREAD ${id1_1} vs ${id2_1}` );
	db23.readTransaction(makeTransaction(id1_1, id1_2, id2_1, id2_2, upgradeIfNeeded, upgradeQueryFailed));
}

function selectSegmentMatchesFromDatabase(callbackSuccess, segmentId){
	function makeTransaction(callback){
		return function(transaction){
			transaction.executeSql('SELECT ibdsegs.ROWID as ROWID, t1.name AS name1, t2.name AS name2, t1.id_1 AS id1_1, t1.id_2 AS id1_2, t2.id_1 AS id2_1, t2.id_2 AS id2_2, ibdsegs.chromosome AS chromosome, ibdsegs.start AS start, ibdsegs.end AS end, ibdsegs.centimorgans AS centimorgans, ibdsegs.snps AS snps FROM ibdsegs JOIN idalias t1 ON (t1.id_1=ibdsegs.id1_1 AND t1.id_2=ibdsegs.id1_2) JOIN idalias t2 ON (t2.id_1=ibdsegs.id2_1 AND t2.id_2=ibdsegs.id2_2) JOIN ibdsegs t3 ON (ibdsegs.build=? AND t3.build=? AND t3.ROWID=? AND ((t3.chromosome=ibdsegs.chromosome AND ((ibdsegs.start>=t3.start AND ibdsegs.end<=t3.end) OR (ibdsegs.start<=t3.start AND ibdsegs.end>=t3.end) OR (ibdsegs.start<=t3.start AND ibdsegs.end>=t3.start) OR (ibdsegs.start<=t3.end AND ibdsegs.end>=t3.end))) OR ibdsegs.chromosome=100) AND ((t3.id1_1=ibdsegs.id1_1 AND t3.id1_2=ibdsegs.id1_2) OR (t3.id1_1=ibdsegs.id2_1 AND t3.id1_2=ibdsegs.id2_2) OR (t3.id2_1=ibdsegs.id1_1 AND t3.id2_2=ibdsegs.id1_2) OR (t3.id2_1=ibdsegs.id2_1 AND t3.id2_2=ibdsegs.id2_2))) ORDER BY chromosome, ibdsegs.start, ibdsegs.end DESC, ibdsegs.ROWID, julianday(t1.date)+julianday(t2.date), t1.ROWID+t2.ROWID', [build, build, segmentId], callback, callback);
		};
	}
	db23.readTransaction(makeTransaction(callbackSuccess));
}

function selectSegmentMatchesAndPhaseFromDatabase(callbackSuccess, segmentId){
	function makeTransaction(callback){
		return function(transaction){
			transaction.executeSql('SELECT ibdsegs.ROWID as ROWID, t1.name AS name1, t2.name AS name2, t1.id_1 AS id1_1, t1.id_2 AS id1_2, t2.id_1 AS id2_1, t2.id_2 AS id2_2, ibdsegs.chromosome AS chromosome, ibdsegs.start AS start, ibdsegs.end AS end, ibdsegs.centimorgans AS centimorgans, ibdsegs.snps AS snps, ibdsegs.phase1 AS phase1, ibdsegs.relationship1 AS relationship1, ibdsegs.phase2 AS phase2, ibdsegs.relationship2 AS relationship2, ibdsegs.comment AS comment FROM ibdsegs JOIN idalias t1 ON (t1.id_1=ibdsegs.id1_1 AND t1.id_2=ibdsegs.id1_2) JOIN idalias t2 ON (t2.id_1=ibdsegs.id2_1 AND t2.id_2=ibdsegs.id2_2) JOIN ibdsegs t3 ON (ibdsegs.build=? AND t3.build=? AND t3.ROWID=? AND ((t3.chromosome=ibdsegs.chromosome AND ((ibdsegs.start>=t3.start AND ibdsegs.end<=t3.end) OR (ibdsegs.start<=t3.start AND ibdsegs.end>=t3.end) OR (ibdsegs.start<=t3.start AND ibdsegs.end>=t3.start) OR (ibdsegs.start<=t3.end AND ibdsegs.end>=t3.end))) OR ibdsegs.chromosome=100) AND ((t3.id1_1=ibdsegs.id1_1 AND t3.id1_2=ibdsegs.id1_2) OR (t3.id1_1=ibdsegs.id2_1 AND t3.id1_2=ibdsegs.id2_2) OR (t3.id2_1=ibdsegs.id1_1 AND t3.id2_2=ibdsegs.id1_2) OR (t3.id2_1=ibdsegs.id2_1 AND t3.id2_2=ibdsegs.id2_2))) ORDER BY chromosome, ibdsegs.start, ibdsegs.end DESC, ibdsegs.ROWID, julianday(t1.date)+julianday(t2.date), t1.ROWID+t2.ROWID', [build, build, segmentId], callback, callback);
		};
	}
	db23.readTransaction(makeTransaction(callbackSuccess));
}

function updatePhase(rowid, value, position){

	if(value==null) return;

	if(value==0) value=null;
	else value--;
	
	if(value==null){
		if(position==1){
			db23.transaction(
				function(transaction){
					transaction.executeSql('UPDATE ibdsegs SET phase1=NULL WHERE ROWID=?',[rowid]);
				},
				function(err){alert("Failed to save phase change to the 529andYou database");}

			);
		}
		else if(position==2){
			db23.transaction(
				function(transaction){
					transaction.executeSql('UPDATE ibdsegs SET phase2=NULL WHERE ROWID=?',[rowid]);
				},
				function(err){alert("Failed to save phase change to the 529andYou database");}
			);
		}

	}
	else{

		if(position==1){
			db23.transaction(
				function(transaction){
					transaction.executeSql('UPDATE ibdsegs SET phase1=? WHERE ROWID=?',[value, rowid]);
				},
				function(err){alert("Failed to save phase change to the 529andYou database");}
			);
		}
		else if(position==2){
			db23.transaction(
				function(transaction){
					transaction.executeSql('UPDATE ibdsegs SET phase2=? WHERE ROWID=?',[value, rowid]);
				},
				function(err){alert("Failed to save phase change to the 529andYou database");}
			);
		}
	}
}
function updateCommonAncestors(rowid, commonAncestors){
	if(commonAncestors==null) return;
	
	if(commonAncestors.length==0) commonAncestors=null;
	
	if(commonAncestors==null){
		db23.transaction(
			function(transaction){
				transaction.executeSql('UPDATE ibdsegs SET comment=NULL WHERE ROWID=?',[rowid]);
			},
			function(err){alert("Failed to save common ancestor change to the 529andYou database");}
		);
	}
	else{
		db23.transaction(
			function(transaction){
				transaction.executeSql('UPDATE ibdsegs SET comment=? WHERE ROWID=?',[commonAncestors, rowid]);
			},
			function(err){alert("Failed to save common ancestor change to the 529andYou database");}
		);

	}
}
function updateRelationship(rowid, relationship, position){
	if(relationship==null) return;
	
	if(relationship.length==0) relationship=null;
	
	if(relationship==null){
		if(position==1){
			db23.transaction(
				function(transaction){
					transaction.executeSql('UPDATE ibdsegs SET relationship1=NULL WHERE ROWID=?',[rowid]);
				},
				function(err){alert("Failed to save label change to the 529andYou database");}
			);
		}
		else if(position==2){
			db23.transaction(
				function(transaction){
					transaction.executeSql('UPDATE ibdsegs SET relationship2=NULL WHERE ROWID=?',[rowid]);
				},
				function(err){alert("Failed to save label change to the 529andYou database");}
			);
		}
	}
	else{
		if(position==1){
			db23.transaction(
				function(transaction){
					transaction.executeSql('UPDATE ibdsegs SET relationship1=? WHERE ROWID=?',[relationship, rowid]);
				},
				function(err){alert("Failed to save label change to the 529andYou database");}
			);
		}
		else if(position==2){
			db23.transaction(
				function(transaction){
					transaction.executeSql('UPDATE ibdsegs SET relationship2=? WHERE ROWID=?',[relationship, rowid]);
				},
				function(err){alert("Failed to save label change to the 529andYou database");}
			);
		}
	}
}

// Queries a list of names and associated ids for whom data are available
function getMatchesFromDatabase(callbackSuccess){
	
	function makeTransaction(callback){
		return function(transaction){
			transaction.executeSql('SELECT name, id_1, id_2 FROM idalias ORDER BY name COLLATE NOCASE', [], callback, callback);
		};
	}
	db23.readTransaction(makeTransaction(callbackSuccess));
}

function getFilteredMatchesFromDatabase(filterText, callbackSuccess){
	
	function makeTransaction(callback){
		var query="SELECT name, id_1, id_2 FROM idalias WHERE name LIKE '" +filterText + "' ORDER BY name COLLATE NOCASE";
		return function(transaction){
			transaction.executeSql(query, [], callback, callback);
		};
	}
	db23.readTransaction(makeTransaction(callbackSuccess));
}

function getLabelList(callbackSuccess){
	
	function makeTransaction(callback){
		return function(transaction){
			transaction.executeSql('SELECT DISTINCT relationship1 AS relationship from ibdsegs WHERE relationship1 IS NOT NULL UNION SELECT DISTINCT relationship2 AS relationship from ibdsegs WHERE relationship2 IS NOT NULL',[],callback, callback);
		};
	}
	db23.readTransaction(makeTransaction(callbackSuccess));
}

// Queries for matches
function selectFromDatabase(callbackSuccess, id, chromosome){

	var lowerBound=0;
	var upperBound=24;
	var chrNum=parseInt(chromosome);
	if(chrNum>0){
		lowerBound=chrNum-1;
		upperBound=chrNum+1;
	}
	function makeTransaction(callback){
		return function(transaction){
			//transaction.executeSql('SELECT chromosome, start, end, centimorgans, snps FROM ibdsegs;', [], callback, callback);
			transaction.executeSql('SELECT ibdsegs.ROWID as ROWID, t1.name AS name1, t2.name AS name2, t1.id_1 AS id1_1, t1.id_2 AS id1_2, t2.id_1 AS id2_1, t2.id_2 AS id2_2, chromosome, start, end, centimorgans, snps FROM ibdsegs JOIN idalias t1 ON (t1.id_1=ibdsegs.id1_1 AND t1.id_2=ibdsegs.id1_2) JOIN idalias t2 ON (t2.id_1=ibdsegs.id2_1 AND t2.id_2=ibdsegs.id2_2) WHERE chromosome>? AND chromosome<? AND build=? ORDER BY chromosome, start, end DESC, ibdsegs.ROWID, julianday(t1.date)+julianday(t2.date), t1.ROWID+t2.ROWID', [lowerBound, upperBound, build], callback, callback);
		};
	}
	function makeTransactionWithId(callback, idnumbers){
		return function(transaction){
			//transaction.executeSql('SELECT chromosome, start, end, centimorgans, snps FROM ibdsegs;', [], callback, callback);
			transaction.executeSql('SELECT ibdsegs.ROWID as ROWID, t1.name AS name1, t2.name AS name2, t1.id_1 AS id1_1, t1.id_2 AS id1_2, t2.id_1 AS id2_1, t2.id_2 AS id2_2, chromosome, start, end, centimorgans, snps FROM ibdsegs JOIN idalias t1 ON (t1.id_1=ibdsegs.id1_1 AND t1.id_2=ibdsegs.id1_2) JOIN idalias t2 ON (t2.id_1=ibdsegs.id2_1 AND t2.id_2=ibdsegs.id2_2) WHERE ((ibdsegs.id1_1=? AND ibdsegs.id1_2=?) OR (ibdsegs.id2_1=? AND ibdsegs.id2_2=?)) AND chromosome>? AND chromosome<? AND build=? ORDER BY chromosome, start, end DESC, ibdsegs.ROWID, julianday(t1.date)+julianday(t2.date), t1.ROWID+t2.ROWID', [idnumbers[0], idnumbers[1], idnumbers[0], idnumbers[1], lowerBound, upperBound, build], callback, callback);
		};
	}
	if(id.length<16){
		db23.readTransaction(makeTransaction(callbackSuccess));
	}
	else db23.readTransaction(makeTransactionWithId(callbackSuccess, id2numbers(id)));
}
function selectFromDatabaseWithPhaseInfo(callbackSuccess, id, chromosome){

	var lowerBound=0;
	var upperBound=24;
	var chrNum=parseInt(chromosome);
	if(chrNum>0){
		lowerBound=chrNum-1;
		upperBound=chrNum+1;
	}
	function makeTransaction(callback){
		return function(transaction){
			//transaction.executeSql('SELECT chromosome, start, end, centimorgans, snps FROM ibdsegs;', [], callback, callback);
			transaction.executeSql('SELECT ibdsegs.ROWID as ROWID, t1.name AS name1, t2.name AS name2, t1.id_1 AS id1_1, t1.id_2 AS id1_2, t2.id_1 AS id2_1, t2.id_2 AS id2_2, chromosome, start, end, centimorgans, snps, phase1, relationship1, phase2, relationship2, comment  FROM ibdsegs JOIN idalias t1 ON (t1.id_1=ibdsegs.id1_1 AND t1.id_2=ibdsegs.id1_2) JOIN idalias t2 ON (t2.id_1=ibdsegs.id2_1 AND t2.id_2=ibdsegs.id2_2) WHERE chromosome>? AND chromosome<? AND build=? ORDER BY chromosome, start, end DESC, ibdsegs.ROWID, julianday(t1.date)+julianday(t2.date), t1.ROWID+t2.ROWID', [lowerBound, upperBound, build], callback, callback);
		};
	}
	function makeTransactionWithId(callback, idnumbers){
		return function(transaction){
			//transaction.executeSql('SELECT chromosome, start, end, centimorgans, snps FROM ibdsegs;', [], callback, callback);
			transaction.executeSql('SELECT ibdsegs.ROWID as ROWID, t1.name AS name1, t2.name AS name2, t1.id_1 AS id1_1, t1.id_2 AS id1_2, t2.id_1 AS id2_1, t2.id_2 AS id2_2, chromosome, start, end, centimorgans, snps, phase1, relationship1, phase2, relationship2, comment  FROM ibdsegs JOIN idalias t1 ON (t1.id_1=ibdsegs.id1_1 AND t1.id_2=ibdsegs.id1_2) JOIN idalias t2 ON (t2.id_1=ibdsegs.id2_1 AND t2.id_2=ibdsegs.id2_2) WHERE ((ibdsegs.id1_1=? AND ibdsegs.id1_2=?) OR (ibdsegs.id2_1=? AND ibdsegs.id2_2=?)) AND chromosome>? AND chromosome<? AND build=? ORDER BY chromosome, start, end DESC, ibdsegs.ROWID, julianday(t1.date)+julianday(t2.date), t1.ROWID+t2.ROWID', [idnumbers[0], idnumbers[1], idnumbers[0], idnumbers[1], lowerBound, upperBound, build], callback, callback);
		};
	}
	if(id.length<16){
		db23.readTransaction(makeTransaction(callbackSuccess));
	}
	else db23.readTransaction(makeTransactionWithId(callbackSuccess, id2numbers(id)));
}
function selectFromDatabaseWithNonMatches(callbackSuccess, id, chromosome){

	var lowerBound=0;
	var upperBound=24;
	var chrNum=parseInt(chromosome);
	if(chrNum>0){
		lowerBound=chrNum-1;
		upperBound=chrNum+1;
	}
	function makeTransaction(callback){
		return function(transaction){
			//transaction.executeSql('SELECT chromosome, start, end, centimorgans, snps FROM ibdsegs;', [], callback, callback);
			transaction.executeSql('SELECT ibdsegs.ROWID as ROWID, t1.name AS name1, t2.name AS name2, t1.id_1 AS id1_1, t1.id_2 AS id1_2, t2.id_1 AS id2_1, t2.id_2 AS id2_2, chromosome, start, end, centimorgans, snps, phase1, relationship1, phase2, relationship2, comment FROM ibdsegs JOIN idalias t1 ON (t1.id_1=ibdsegs.id1_1 AND t1.id_2=ibdsegs.id1_2) JOIN idalias t2 ON (t2.id_1=ibdsegs.id2_1 AND t2.id_2=ibdsegs.id2_2) WHERE ((chromosome>? AND chromosome<?) OR chromosome=100) AND build=? ORDER BY chromosome, start, end DESC, ibdsegs.ROWID, julianday(t1.date)+julianday(t2.date), t1.ROWID+t2.ROWID', [lowerBound, upperBound, build], callback, callback);
		};
	}
	function makeTransactionWithId(callback, idnumbers){
		return function(transaction){
			//transaction.executeSql('SELECT chromosome, start, end, centimorgans, snps FROM ibdsegs;', [], callback, callback);
			transaction.executeSql('SELECT ibdsegs.ROWID as ROWID, t1.name AS name1, t2.name AS name2, t1.id_1 AS id1_1, t1.id_2 AS id1_2, t2.id_1 AS id2_1, t2.id_2 AS id2_2, chromosome, start, end, centimorgans, snps, phase1, relationship1, phase2, relationship2, comment FROM ibdsegs JOIN idalias t1 ON (t1.id_1=ibdsegs.id1_1 AND t1.id_2=ibdsegs.id1_2) JOIN idalias t2 ON (t2.id_1=ibdsegs.id2_1 AND t2.id_2=ibdsegs.id2_2) WHERE ((ibdsegs.id1_1=? AND ibdsegs.id1_2=?) OR (ibdsegs.id2_1=? AND ibdsegs.id2_2=?)) AND ((chromosome>? AND chromosome<?) OR chromosome=100) AND build=? ORDER BY chromosome, start, end DESC, ibdsegs.ROWID, julianday(t1.date)+julianday(t2.date), t1.ROWID+t2.ROWID', [idnumbers[0], idnumbers[1], idnumbers[0], idnumbers[1], lowerBound, upperBound, build], callback, callback);
		};
	}
	if(id.length<16){
		db23.readTransaction(makeTransaction(callbackSuccess));
	}
	else db23.readTransaction(makeTransactionWithId(callbackSuccess, id2numbers(id)));
}


// Put data from 529andYou without phase (created with shift key down) into database
function import529CSV(lineList, callback){

	if(!lineList) return;
	
	pendingTransactionCount=0;
	noPendingTransactionCallBack=callback;
	
	// Store the names and ids of the matches
	function makeIdAliasTransaction(val){
		// Transaction factory to allow looping
		var numbers=id2numbers(val[0]);
		var name=val[1];
		return function(transaction){
			transaction.executeSql("INSERT INTO idalias (id_1, id_2, name, date, company_id) VALUES(?, ?, ?, date('now'), 1);", [numbers[0], numbers[1], name]);
		};
	}
	// Store the matching segments
	function makeMatchingSegmentTransaction(id1, id2, chromosome, start, end, centimorgans, snps){
		// Transaction factory to allow looping
		var compared=compareIds(id1, id2);
		if(compared==0) return; // Don't enter matches with self
		var numbers1;
		var numbers2;
		// Order matches consistently
		if(compared>0){
			numbers1=id2numbers(id1);
			numbers2=id2numbers(id2);
		}
		else{
			numbers1=id2numbers(id2);
			numbers2=id2numbers(id1);
		}
		return function(transaction){
			transaction.executeSql("INSERT INTO ibdsegs (id1_1, id1_2, id2_1, id2_2, chromosome, start, end, centimorgans, snps, date, build) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, date('now'),?);",[numbers1[0], numbers1[1], numbers2[0], numbers2[1], chromosome, start, end, centimorgans, snps, current23andMeBuild]);
		};
	}
	
	// i=0 is header row
	for(let i=1; i< lineList.length; i++){
		var entry=lineList[i].split(',');
		if(entry.length==9){
			var firstName=entry[0];
			var firstId=entry[7];
			var secondName=entry[1];
			var secondId=entry[8];
			var entryChromosome;
			if(entry[2]==="X") entryChromosome=23;
			else entryChromosome=entry[2];
			var entryStart=entry[3];
			var entryEnd=entry[4];
			var entrycM=entry[5];
			var entrySNPs=entry[6];
			
			pendingTransactionCount++;
			db23.transaction(makeIdAliasTransaction([firstId, firstName]), decrementPendingTransactionCount, decrementPendingTransactionCount);
			pendingTransactionCount++;
			db23.transaction(makeIdAliasTransaction([secondId, secondName]), decrementPendingTransactionCount, decrementPendingTransactionCount);
			pendingTransactionCount++;
			db23.transaction(makeMatchingSegmentTransaction(firstId, secondId, entryChromosome, entryStart, entryEnd, entrycM, entrySNPs), decrementPendingTransactionCount, decrementPendingTransactionCount);
			pendingTransactionCount++;
			db23.transaction(makeMatchingSegmentTransaction(firstId, secondId, 100, -1, -1, 0, 0), decrementPendingTransactionCount, decrementPendingTransactionCount);
		}
		else{
			// parse error
		}
	}
}

// Put data from 529andYou with phase (created with shift key down) into database
function importWithPhase529CSV(lineList, callback){

	if(!lineList) return;
	
	pendingTransactionCount=0;
	noPendingTransactionCallBack=callback;
	
	// Store the names and ids of the matches
	function makeIdAliasTransaction(val){
		// Transaction factory to allow looping
		var numbers=id2numbers(val[0]);
		var name=val[1];
		return function(transaction){
			transaction.executeSql("INSERT INTO idalias (id_1, id_2, name, date, company_id) VALUES(?, ?, ?, date('now'), 1);", [numbers[0], numbers[1], name]);
		};
	}
	// Store the matching segments
	function makeMatchingSegmentTransaction(id1, id2, chromosome, start, end, centimorgans, snps, phase1, relationship1, phase2, relationship2, comment){
		// Transaction factory to allow looping
		var compared=compareIds(id1, id2);
		if(compared==0) return; // Don't enter matches with self
		var numbers1;
		var numbers2;
		// Order matches consistently
		if(compared>0){
			numbers1=id2numbers(id1);
			numbers2=id2numbers(id2);
		}
		else{
			numbers1=id2numbers(id2);
			numbers2=id2numbers(id1);
		}
		return function(transaction){
			transaction.executeSql("INSERT INTO ibdsegs (id1_1, id1_2, id2_1, id2_2, chromosome, start, end, centimorgans, snps, phase1, relationship1, phase2, relationship2, comment, date, build) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, date('now'),?);",[numbers1[0], numbers1[1], numbers2[0], numbers2[1], chromosome, start, end, centimorgans, snps, phase1, relationship1, phase2, relationship2, comment, current23andMeBuild]);
		};
	}
	
	// i=0 is header row
	for(let i=1; i< lineList.length; i++){
		var entry=lineList[i].split(',');
		if(entry.length==14){
			var firstName=entry[0];
			var firstId=entry[7];
			var secondName=entry[1];
			var secondId=entry[8];
			var entryChromosome;
			if(entry[2]==="X")
				entryChromosome=23;
			else
				entryChromosome=entry[2];
			var entryStart=entry[3];
			var entryEnd=entry[4];
			var entrycM=entry[5];
			var entrySNPs=entry[6];
			var entryPhase1=entry[9];
			if(entryPhase1.length==0)
				entryPhase1=null;
			var entryRelationship1=entry[10];
			if(entryRelationship1.length==0) entryRelationship1=null;
			var entryPhase2=entry[11];
			if(entryPhase2.length==0) entryPhase2=null;
			var entryRelationship2=entry[12];
			if(entryRelationship2.length==0) entryRelationship2=null;
			var entryComment=entry[13];
			if(entryComment.length==0)
				entryComment=null;
			
			pendingTransactionCount++;
			db23.transaction(makeIdAliasTransaction([firstId, firstName]), decrementPendingTransactionCount, decrementPendingTransactionCount);
			pendingTransactionCount++;
			db23.transaction(makeIdAliasTransaction([secondId, secondName]), decrementPendingTransactionCount, decrementPendingTransactionCount);
			pendingTransactionCount++;
			db23.transaction(makeMatchingSegmentTransaction(firstId, secondId, entryChromosome, entryStart, entryEnd, entrycM, entrySNPs, entryPhase1, entryRelationship1, entryPhase2, entryRelationship2, entryComment), decrementPendingTransactionCount, decrementPendingTransactionCount);
			pendingTransactionCount++;
			db23.transaction(makeMatchingSegmentTransaction(firstId, secondId, 100, -1, -1, 0, 0), decrementPendingTransactionCount, decrementPendingTransactionCount);
		}
		else{
			// parse error
		}
	}
}



// Put data from FI:A aggregation into database
function importAggregation(profileName, profileId, lineList, callback){

	if(!profileName || !profileId || !lineList) return;
	
	pendingTransactionCount=0;
	noPendingTransactionCallBack=callback;

	// Store the names and ids of the matches
	function makeIdAliasTransaction(val){
		// Transaction factory to allow looping
		var numbers=id2numbers(val[0]);
		var name=val[1];
		return function(transaction){
			transaction.executeSql("INSERT INTO idalias (id_1, id_2, name, date, company_id) VALUES(?, ?, ?, date('now'), 1);", [numbers[0], numbers[1], name]);
		};
	}
	// Store the matching segments
	function makeMatchingSegmentTransaction(id1, id2, chromosome, start, end, centimorgans, snps){
		// Transaction factory to allow looping
		var compared=compareIds(id1, id2);
		if(compared==0) return; // Don't enter matches with self
		var numbers1;
		var numbers2;
		// Order matches consistently
		if(compared>0){
			numbers1=id2numbers(id1);
			numbers2=id2numbers(id2);
		}
		else{
			numbers1=id2numbers(id2);
			numbers2=id2numbers(id1);
		}
		return function(transaction){
			transaction.executeSql("INSERT INTO ibdsegs (id1_1, id1_2, id2_1, id2_2, chromosome, start, end, centimorgans, snps, date, build) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, date('now'),?);",[numbers1[0], numbers1[1], numbers2[0], numbers2[1], chromosome, start, end, centimorgans, snps, current23andMeBuild]);
		};
	}
	
	pendingTransactionCount++;
	db23.transaction(makeIdAliasTransaction([profileId, profileName]), decrementPendingTransactionCount, decrementPendingTransactionCount);
	
	// i=0 is header row
	for(let i=1; i< lineList.length; i++){
		let entry=lineList[i].split(',');
		if(entry.length==7){
			if(entry[0].indexOf(profileName + " vs ")==0){
				let entryId=entry[6].substr(entry[6].indexOf("=")+1, 16);
				let entryName=entry[0].substr(profileName.length+4, entry[0].length-profileName.length-4);
				let entryChromosome;
				if(entry[1]==="X") entryChromosome=23;
				else entryChromosome=entry[1];
				//let entryStart=(Math.floor(entry[2]/1000000))*1000000;
				let entryStart=entry[2];
				if(entryStart==0) entryStart=1;
				//let entryEnd=(Math.floor(entry[3]/1000000))*1000000;
				let entryEnd=entry[3];
				if(entryEnd==0) entryEnd=1;
				let entrycM=entry[4];
				let entrySNPs=entry[5];
				pendingTransactionCount++;
				db23.transaction(makeIdAliasTransaction([entryId, entryName]), decrementPendingTransactionCount, decrementPendingTransactionCount);
				pendingTransactionCount++;
				db23.transaction(makeMatchingSegmentTransaction(profileId, entryId, entryChromosome, entryStart, entryEnd, entrycM, entrySNPs),decrementPendingTransactionCount, decrementPendingTransactionCount);
			}
		}
		else{
			// parse error
		}
	}
	
	// Chromosome 100 entries
	for(let i=1; i< lineList.length; i++){
		let entry=lineList[i].split(',');
		if(entry.length==7){
			if(entry[0].indexOf(profileName + " vs ")==0){
				let entryId=entry[6].substr(entry[6].indexOf("=")+1, 16);
				pendingTransactionCount++;
				db23.transaction(makeMatchingSegmentTransaction(profileId, entryId, 100, -1, -1, 0, 0), decrementPendingTransactionCount, decrementPendingTransactionCount);
			}
		}
	}
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
  
	if(request.checkIfInDatabase!=null){
		conlog( 1, "InDB checking " + request );
		if(request.shiftIsDown){
			// Skip database query
			chrome.tabs.sendMessage(sender.tab.id, {indexId: request.indexId, matchId: request.matchId, indexName: request.indexName, matchName: request.matchName, needToCompare: true});
		}
		function makeMessageSender(tab_id, indexId, matchId, indexName, matchName){
			return function(transaction, resultSet){
				var myrow=null;
				if(resultSet.rows.length==1) myrow=resultSet.rows.item(0);
				conlog( 2, `   DBquery returned ${resultSet.rows.length} rows` );
				if(myrow!=null){
					var needToCompare=false;
					if(myrow.hits==0) needToCompare=true;
					chrome.tabs.sendMessage(tab_id, {indexId: indexId, matchId: matchId, indexName: indexName, matchName: matchName, needToCompare: needToCompare});
				}
			};
		}
		function makeMessageSenderForFailure(tab_id, indexId, matchId, indexName, matchName){
			return function(error){
				// Default is to just do comparison
				chrome.tabs.sendMessage(tab_id, {indexId: indexId, matchId: matchId, indexName: indexName, matchName: matchName, needToCompare: true});
			};
		}
		var messageSender=makeMessageSender(sender.tab.id, request.indexId, request.matchId, request.indexName, request.matchName);
		var messageSenderForFailure=makeMessageSenderForFailure(sender.tab.id, request.indexId, request.matchId, request.indexName, request.matchName);

		var indexIds=id2numbers(request.indexId);
		var matchIds=id2numbers(request.matchId);
		upgradeToCurrentBuild(indexIds[0], indexIds[1], matchIds[0], matchIds[1], messageSender, messageSenderForFailure);
		return;
	}
	if(request.fixYouAreComparingWithBug!=null){
	
		conlog( 1, "************Called fixComparingBug, value: " + request.fixYouAreComparingWithBug );
		// Delete 'You are comparing with' entries from idalias if there is an alternative alias stored
		function makeCorrectionTransaction(){
			return function(transaction){
				transaction.executeSql("DELETE FROM idalias WHERE ROWID IN (SELECT i1.ROWID AS ROWID FROM idalias i1, idalias i2 WHERE i1.id_1=i2.id_1 AND i1.id_2=i2.id_2 AND i1.name!=i2.name AND i1.name='You are comparing with');");
			};
		}
		db23.transaction(makeCorrectionTransaction());
	}
  });
  	
	

// Puts segment match data  into database
/*
* this is listener to sendRequest() from following files:
*           in all cases the response callback function is empty
* contentscript2.js   - sent with no request content
* manipulate2.js  - one with ids and matchingSegments and another with url
* compare_matchesq.js  - one with ids and matchingSegments and another with url
* results_tab.js  -  one with ids and matchingSegments 
*/
function onRequest(request, sender, sendResponse) {

	// Show the page action for the tab that the sender (content script)
	// was on.
	// what?   chrome.pageAction.show(sender.tab.id);

	conlog( 2, `onReq called from url ${sender.url}`);

	if(sender.url.indexOf("https://you.23andme.com/tools/relatives/dna/")==0){
		// Avoid adding multiple listeners each time a qualifying page is loaded
		if(!chrome.pageAction.onClicked.hasListener(hoThere)){
			chrome.pageAction.onClicked.addListener(hoThere);
		}
	}
	else{
		// Avoid adding multiple listeners each time a qualifying page is loaded
		if(!chrome.pageAction.onClicked.hasListener(hiThere)){
			chrome.pageAction.onClicked.addListener(hiThere);
		}
	}
	

	
	if(request.ids==null){
		if(request.url!=null){
			// Handles new experience 529andYou button
			chrome.tabs.create({ url: request.url, active: true}, null);
		}
		if(request.sharingNamesAndIds!=null){
			sharingNamesAndIds=request.sharingNamesAndIds;
		}
		else if(request.profileNamesAndIds!=null){
			profileNamesAndIds=request.profileNamesAndIds;
		}
		sendResponse({});
		return;
	}

	// Store the names and ids of the matches
	function makeIdAliasTransaction(val){
		// Transaction factory to allow looping
		var numbers=id2numbers(val[0]);
		var name=val[1];
		return function(transaction){
			transaction.executeSql("INSERT INTO idalias (id_1, id_2, name, date, company_id) VALUES(?, ?, ?, date('now'), 1);", [numbers[0], numbers[1], name]);
		};
	}
	
	for(let i=0; i<request.ids.length; i++){
		// Attempt to insert this number, name combo
		db23.transaction(makeIdAliasTransaction(request.ids[i]));
	}
	
	// Store the matching segments
	function makeMatchingSegmentTransaction(id1, id2, val){
		// Transaction factory to allow looping
		var compared=compareIds(id1, id2);
		if(compared==0) return; // Don't enter matches with self
		var numbers1;
		var numbers2;
		// Order matches consistently
		if(compared>0){
			numbers1=id2numbers(id1);
			numbers2=id2numbers(id2);
		}
		else{
			numbers1=id2numbers(id2);
			numbers2=id2numbers(id1);
		}
		return function(transaction){
			transaction.executeSql("INSERT INTO ibdsegs (id1_1, id1_2, id2_1, id2_2, chromosome, start, end, centimorgans, snps, date, build) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, date('now'),?);",[numbers1[0], numbers1[1], numbers2[0], numbers2[1], val[2], val[3], val[4], val[5], val[6], current23andMeBuild]);
		};
	}
	conlog( 2, `req seg transaction ${request.matchingSegments[0][0]}`);
	for(let i=0; i<request.matchingSegments.length; i++){
		//if(request.matchingSegments[i][0]===request.matchingSegments[i][1]) continue; // Ignore matches to self
		if(request.matchingSegments[i][0]!==request.ids[0][1]){
			alert("unexpected name mismatch: " + request.matchingSegments[i][0] + " " + request.ids[0][1]);
			continue;
		}
		let j=1;
		for( ; j<request.ids.length; j++){
			if(request.matchingSegments[i][1]===request.ids[j][1]){
				db23.transaction(makeMatchingSegmentTransaction(request.ids[0][0], request.ids[j][0], request.matchingSegments[i]));
				break;
			}
		}
		if(j==request.ids.length) alert("failed to find match for " + request.matchingSegments[i][1]);
	}
	
	// Create bogus 'chromosome 100' match to signify that comparison has been performed
	for(let j=1; j<request.ids.length; j++){
		db23.transaction(makeMatchingSegmentTransaction(request.ids[0][0], request.ids[j][0], [ "filler", "filler", 100, -1, -1, 0, 0]));
	}
			
	// Return nothing, to let the connection be cleaned up.
	sendResponse({});
}

function deleteAllData(callbackSuccess){
	if(confirm("Delete all data stored in your 529andYou local database?")){
		db23.transaction(
			function(transaction) {
				transaction.executeSql("DELETE FROM ibdsegs",[]);
				transaction.executeSql("DELETE FROM idalias",[]);
			}, function(){alert("Failed to delete data stored in 529andYou local database");}, callbackSuccess
		);
	}
}

function createTables(){
	// Called only when database is created
	alert("Created 529andYou local database");
	db23.transaction(
        function (transaction) {
        	// Should actually store company in idalias not ibdsegs
        	// Should add comment field to ibdsegs for future use
        	transaction.executeSql('CREATE TABLE IF NOT EXISTS ibdsegs(id1_1 INTEGER NOT NULL, id1_2 INTEGER NOT NULL, id2_1 INTEGER NOT NULL, id2_2 INTEGER NOT NULL, chromosome INTEGER NOT NULL, start INTEGER NOT NULL, end INTEGER NOT NULL, centimorgans REAL NOT NULL, snps INTEGER NOT NULL, phase1 INTEGER, relationship1 TEXT, phase2 INTEGER, relationship2 TEXT, date TEXT NOT NULL, comment TEXT, build INTEGER NOT NULL DEFAULT 36);', []);
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
    	}, function(){alert("Failed to create tables for 529andYou local database");}, function(){}
    );
}
function compareIds(id1, id2){
	// return -1 if id1<id2
	// return 1 if id1>id2
	// return 0 if id1==id2 || id1 or id2 can't be parsed
	var nums1=id2numbers(id1);
	if(nums1==null) return 0;
	var nums2=id2numbers(id2);
	if(nums2==null) return 0;
	if(nums1[0]<nums2[0]) return -1;
	if(nums2[0]<nums1[0]) return 1;
	if(nums1[1]<nums2[1]) return -1;
	if(nums1[1]<nums2[1]) return 1;
	return 0;
}
function compareNumbers(id1_1, id1_2, id2_1, id2_2){
	if(id1_1<id2_1) return -1;
	if(id2_1<id1_1) return 1;
	if(id1_2<id2_2) return -1;
	if(id2_2<id1_2) return 1;
	return 0;
}
function id2numbers(id){
	// Convert 16 byte 23andMe hexadecimal id (no 0x prefix) to an array of 2 integers
	// Note that Javascript cannot represent big integers with >15 bytes
	if(id.length==undefined || id.length!=16){
		alert("Invalid 23andMe id: " + id);
		return null;
	}
	var result=new Array(2);
	result[0]=parseInt(id.substr(0,8),16);
	result[1]=parseInt(id.substr(8,8),16);
	return result;
}
// Duplicated in results_tab.js
function numbers2id(nums){
	// Convert array of 2 integers into 16 byte 23andMe hexadecimal id (no 0x prefix)
	if(nums.length==undefined || nums.length!=2){
		alert("Invalid numbers representing 23andMe id: " + nums);
		return null;
	}
	var first=(Number(nums[0])).toString(16);
	var second=(Number(nums[1])).toString(16);
	if(first.length>8 || second.length>8){
		alert("Invalid numbers representing 23andMe id: " + nums);
		return null;
	}
	while(first.length<8) first="0"+first;
	while(second.length<8) second="0"+second;
	return first+second;
}
function initDatabase() {
	var shortName = 'db23';
	var version = '1.4';
	var displayName = '529andYou Database';
	var maxSize = 5*1024*1024; //  bytes

	try {
	    if (!window.openDatabase) {
	        alert('Databases are not supported in this browser.');
	    } else {
	        db23 = openDatabase(shortName, version, displayName, maxSize, createTables);
	        if(db23==null) alert("Failed to open or create a local 529andYou database");
	    }
	} catch(e) {
	    if (e.name == "INVALID_STATE_ERR" || e.name== "InvalidStateError") {
	        // Version number mismatch.
	        try{
	       	 	db23 = openDatabase(shortName, "", displayName, maxSize, null);
	       	}
	       	catch(ee){
	       		alert("Failed to open or create a local 529andYou database: " + ee.name + ": "+ee);
	       	}
	        if(db23==null) alert("Failed to open or create a local 529andYou database");
	        if(db23.version=="1.0"){
	        	upgrade_1_0_to_1_1(); // will call upgrade_1_1_to_1_1_0_1();
	        }
	        else if(db23.version=="1.1" || db23.version=="1.1.0.1"){
	        	upgrade_1_1_to_1_1_0_1();
	        }
	        else if(db23.version=="1.1.0.2") upgrade_1_1_0_2_to_1_3();
	        else if(db23.version=="1.3") upgrade_1_3_to_1_4();
	    } else {
	        alert("Failed to open or create a local 529andYou database: " + e.name + ": " +e);
	    }
	    return;
	}
}
function upgrade_1_0_to_1_1(){
	// Create a chromosome 100 entry for any tested pair of matches
	// Since this doesn't alter fundamental database structure, it is implemented without 
	//  failsafes that would confirm success of this operation
	// This function can still be called safely even after the version has been changed 
	db23.readTransaction(
        function (transaction) {
        	transaction.executeSql('select DISTINCT id1_1, id1_2, id2_1, id2_2, date from ibdsegs;', [], addChromosome100, function(transaction, error){});
    	}
    );
    function make_1_0_1_1_UpdateTransaction(row){
    	return function(transaction){
    		transaction.executeSql("INSERT INTO ibdsegs (id1_1, id1_2, id2_1, id2_2, chromosome, start, end, centimorgans, snps, date) VALUES(?, ?, ?, ?, 100, -1, -1, 0, 0, ?);",[row.id1_1, row.id1_2, row.id2_1, row.id2_2, row.date]);
   		};
	}
    function addChromosome100(transaction, results){
    	for(let i=0; i<results.rows.length; i++){
    		var row=results.rows.item(i);
    		db23.transaction(make_1_0_1_1_UpdateTransaction(row));
    	}
    }
    upgrade_1_1_to_1_1_0_1();

}
function upgrade_1_1_to_1_1_0_1(){
	// Since this doesn't alter fundamental database structure, it is implemented without 
	//  failsafes that would confirm success of this operation
	// This function can still be called safely even after the version has been changed 
	db23.readTransaction(
		function (transaction){
			transaction.executeSql('SELECT ROWID, id1_1, id1_2, id2_1, id2_2, chromosome, start, end, centimorgans, snps, relationship1, relationship2, date, comment FROM ibdsegs;',[], transpose, function(transaction, error){});
		}
	);
	function make_1_1_to_1_1_0_1_transaction(row){
		return function(transaction){
			transaction.executeSql('DELETE FROM ibdsegs WHERE id1_1=? AND id1_2=? AND id2_1=? AND id2_2=?;',[row.id1_1, row.id1_2, row.id2_1, row.id2_2], function(transaction, results){}, function(error){return false;}); // This will roll back insertion below if deletion fails
			transaction.executeSql('INSERT INTO ibdsegs (id1_1, id1_2, id2_1, id2_2, chromosome, start, end, centimorgans, snps, date) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?);',[row.id2_1, row.id2_2, row.id1_1, row.id1_2, row.chromosome, row.start, row.end, row.centimorgans, row.snps, row.date], function(transaction, results){}, function(error){return false;});
		};
	}
	function transpose(transaction, results){
		for(let i=0; i<results.rows.length; i++){
			var row=results.rows.item(i);
			if(compareNumbers(row.id1_1, row.id1_2, row.id2_1, row.id2_2)<0){
				db23.transaction(make_1_1_to_1_1_0_1_transaction(row));
			}
		} //compar  <- this bit of text was sitting in the executable source -
		// I suspect it is a mistake, so commented it out.
	}
	upgrade_1_1_0_2_to_1_3();
}
function upgrade_1_1_0_2_to_1_3(){
	// Add build information
	db23.transaction(
		function(transaction){
			// If the creation of the new unique index fails, everything should rollback
			transaction.executeSql('ALTER TABLE ibdsegs ADD COLUMN build INTEGER NOT NULL DEFAULT 36', [], function(transaction, results){}, function(error){return false;});
			transaction.executeSql('DROP INDEX ibssegs_ids_chromosomes_segs', [], function(transaction, results){}, function(error){return false;});
			transaction.executeSql('CREATE UNIQUE INDEX ibssegs_ids_chromosomes_segs ON ibdsegs(id1_1, id1_2, id2_1, id2_2, chromosome, start, end, build);', [], [], function(transaction, results){}, function(error){return true;});
		},
		function(transaction, error){
			if(db23.version!="1.1.0.2") db23.changeVersion(db23.version, "1.1.0.2");
		},
		function(transaction, resultSet){
			if(db23.version!="1.3") db23.changeVersion(db23.version, "1.3");
		}
	);
	upgrade_1_3_to_1_4();
}
function upgrade_1_3_to_1_4(){
	db23.transaction(
		function(transaction){
			// Add phase integers
			transaction.executeSql('ALTER TABLE ibdsegs ADD COLUMN phase1 INTEGER', [], function(transaction, results){}, function(error){return false;});
			transaction.executeSql('ALTER TABLE ibdsegs ADD COLUMN phase2 INTEGER', [], function(transaction, results){}, function(error){return false;});
		},
		function(transaction, error){
			if(db23.version!="1.3") db23.changeVersion(db23.version, "1.3");
		},
		function(transaction, resultSet){
			if(db23.version!="1.4") db23.changeVersion(db23.version, "1.4");
		}
	);
}


function hiThere(tab){
  chrome.tabs.create({'url': chrome.extension.getURL('results_tab.html')}, function(tab) {
    // Tab opened.
  });
}

function hoThere(tab){
 chrome.tabs.sendMessage(tab.id, {greeting: "hello"});
}

function main() {
	// Initialization work goes here.
	initDatabase();
}


// Listen for the content script to send a message to the background page.
chrome.extension.onRequest.addListener(onRequest);

document.addEventListener('DOMContentLoaded', function () {
  //document.querySelector('button').addEventListener('click', clickHandler);
  main();
});