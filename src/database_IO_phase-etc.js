/*
** database I/O routines including phase, relationships or comments (deprecated).
** These routines communicate directly with the DB, not via message passing
** Should be preceeded by database_init.js and databzse_IO.js
*/

/*  eslint-disable no-unused-vars */
"use strict";

db_conlog( 0, "loading DB_IO_phase script");


/*
********************************************************
* the following group of functions read from the database
********************************************************
*/

const sellist2 = "	ibdsegs.phase1 AS phase1,\
	ibdsegs.relationship1 AS relationship1,\
	ibdsegs.phase2 AS phase2,\
	ibdsegs.relationship2 AS relationship2,\
	ibdsegs.comment AS comment";

function selectSegmentMatchesAndPhaseFromDatabase(callbackSuccess, segmentId){
	const sel_long=`SELECT ${sellist1}, ${sellist2} FROM ${joinlist} ORDER BY ${orderlist}`;
	function makeTransaction(callback){
		return function(transaction){
			transaction.executeSql( sel_long, [build, build, segmentId], callback, callback);
		};
	}
	db23.readTransaction(makeTransaction(callbackSuccess));
}

/*
** Queries for matches
** this returns the rows of segment data suitable for subsequent processing
** either as display on page or save to csv files.
** - in: id
*/
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


/*
********************************************************
* the following functions write to the database
********************************************************
*/
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
				function(err){alert("Failed to save phase change to the 529Renew database");}

			);
		}
		else if(position==2){
			db23.transaction(
				function(transaction){
					transaction.executeSql('UPDATE ibdsegs SET phase2=NULL WHERE ROWID=?',[rowid]);
				},
				function(err){alert("Failed to save phase change to the 529Renew database");}
			);
		}

	}
	else{

		if(position==1){
			db23.transaction(
				function(transaction){
					transaction.executeSql('UPDATE ibdsegs SET phase1=? WHERE ROWID=?',[value, rowid]);
				},
				function(err){alert("Failed to save phase change to the 529Renew database");}
			);
		}
		else if(position==2){
			db23.transaction(
				function(transaction){
					transaction.executeSql('UPDATE ibdsegs SET phase2=? WHERE ROWID=?',[value, rowid]);
				},
				function(err){alert("Failed to save phase change to the 529Renew database");}
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
			function(err){alert("Failed to save common ancestor change to the 529Renew database");}
		);
	}
	else{
		db23.transaction(
			function(transaction){
				transaction.executeSql('UPDATE ibdsegs SET comment=? WHERE ROWID=?',[commonAncestors, rowid]);
			},
			function(err){alert("Failed to save common ancestor change to the 529Renew database");}
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
				function(err){alert("Failed to save label change to the 529Renew database");}
			);
		}
		else if(position==2){
			db23.transaction(
				function(transaction){
					transaction.executeSql('UPDATE ibdsegs SET relationship2=NULL WHERE ROWID=?',[rowid]);
				},
				function(err){alert("Failed to save label change to the 529Renew database");}
			);
		}
	}
	else{
		if(position==1){
			db23.transaction(
				function(transaction){
					transaction.executeSql('UPDATE ibdsegs SET relationship1=? WHERE ROWID=?',[relationship, rowid]);
				},
				function(err){alert("Failed to save label change to the 529Renew database");}
			);
		}
		else if(position==2){
			db23.transaction(
				function(transaction){
					transaction.executeSql('UPDATE ibdsegs SET relationship2=? WHERE ROWID=?',[relationship, rowid]);
				},
				function(err){alert("Failed to save label change to the 529Renew database");}
			);
		}
	}
}



// Put data from 529Renew with phase  into database
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

