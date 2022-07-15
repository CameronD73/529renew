/*
** database routines for presenting results in the results tab.
** Should be preceeded by database_common.js
*/

/*  eslint-disable no-unused-vars */
"use strict";

db_conlog( 0, "loading DB_results script");


/*
********************************************************
* the following group of functions read from the database
********************************************************
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
	db_conlog( 2, `   dbREAD ${id1_1} vs ${id2_1}` );
	db23.readTransaction(makeTransaction(id1_1, id1_2, id2_1, id2_2, upgradeIfNeeded, upgradeQueryFailed));
}

/* the query in  selectSegmentMatchesFromDatabase is as follows...
SELECT ibdsegs.ROWID as ROWID,
	t1.name AS name1,
	t2.name AS name2,
	t1.id_1 AS id1_1,
	t1.id_2 AS id1_2,
	t2.id_1 AS id2_1,
	t2.id_2 AS id2_2,
	ibdsegs.chromosome AS chromosome,
	ibdsegs.start AS start,
	ibdsegs.end AS end,
	ibdsegs.centimorgans AS centimorgans,
	ibdsegs.snps AS snps
    FROM ibdsegs
	JOIN idalias t1 ON (t1.id_1=ibdsegs.id1_1 AND t1.id_2=ibdsegs.id1_2)
	JOIN idalias t2 ON (t2.id_1=ibdsegs.id2_1 AND t2.id_2=ibdsegs.id2_2)
	JOIN ibdsegs t3 ON	(ibdsegs.build=? 
				AND t3.build=? 
				AND t3.ROWID=? 
				AND (	(t3.chromosome=ibdsegs.chromosome
					AND (	(ibdsegs.start>=t3.start AND ibdsegs.end<=t3.end)
						OR (ibdsegs.start<=t3.start AND ibdsegs.end>=t3.end)
						OR (ibdsegs.start<=t3.start AND ibdsegs.end>=t3.start)
						OR (ibdsegs.start<=t3.end AND ibdsegs.end>=t3.end)
					)
				)
					OR ibdsegs.chromosome=100
				) AND (    (t3.id1_1=ibdsegs.id1_1 AND t3.id1_2=ibdsegs.id1_2)
					OR (t3.id1_1=ibdsegs.id2_1 AND t3.id1_2=ibdsegs.id2_2)
					OR (t3.id2_1=ibdsegs.id1_1 AND t3.id2_2=ibdsegs.id1_2)
					OR (t3.id2_1=ibdsegs.id2_1 AND t3.id2_2=ibdsegs.id2_2)
				)
		) ORDER BY chromosome,
				ibdsegs.start,
				ibdsegs.end DESC,
				ibdsegs.ROWID,
				julianday(t1.date)+julianday(t2.date),
				t1.ROWID+t2.ROWID
*/
const sellist1 = "ibdsegs.ROWID as ROWID,\
	t1.name AS name1,\
	t2.name AS name2,\
	t1.id_1 AS id1_1,\
	t1.id_2 AS id1_2,\
	t2.id_1 AS id2_1,\
	t2.id_2 AS id2_2,\
	ibdsegs.chromosome AS chromosome,\
	ibdsegs.start AS start,\
	ibdsegs.end AS end,\
	ibdsegs.centimorgans AS centimorgans,\
	ibdsegs.snps AS snps";

const sellist2 = "	ibdsegs.phase1 AS phase1,\
	ibdsegs.relationship1 AS relationship1,\
	ibdsegs.phase2 AS phase2,\
	ibdsegs.relationship2 AS relationship2,\
	ibdsegs.comment AS comment";

const joinlist = "ibdsegs \
	JOIN idalias t1 ON (t1.id_1=ibdsegs.id1_1 AND t1.id_2=ibdsegs.id1_2) \
	JOIN idalias t2 ON (t2.id_1=ibdsegs.id2_1 AND t2.id_2=ibdsegs.id2_2) \
	JOIN ibdsegs t3 ON 	(ibdsegs.build=?  \
		AND t3.build=? \
		AND t3.ROWID=? \
		AND (  	( \
			t3.chromosome=ibdsegs.chromosome \
			AND (	   (ibdsegs.start>=t3.start AND ibdsegs.end<=t3.end) \
				OR (ibdsegs.start<=t3.start AND ibdsegs.end>=t3.end) \
				OR (ibdsegs.start<=t3.start AND ibdsegs.end>=t3.start) \
				OR (ibdsegs.start<=t3.end AND ibdsegs.end>=t3.end) \
			) \
			) \
			OR ibdsegs.chromosome=100 \
		) AND (    -- either person is the same \
				(t3.id1_1=ibdsegs.id1_1 AND t3.id1_2=ibdsegs.id1_2) \
			OR (t3.id1_1=ibdsegs.id2_1 AND t3.id1_2=ibdsegs.id2_2) \
			OR (t3.id2_1=ibdsegs.id1_1 AND t3.id2_2=ibdsegs.id1_2)  \
			OR (t3.id2_1=ibdsegs.id2_1 AND t3.id2_2=ibdsegs.id2_2) \
		) \
	)";

const orderlist = "chromosome, \
ibdsegs.start, \
ibdsegs.end DESC, \
ibdsegs.ROWID, \
julianday(t1.date)+julianday(t2.date), \
t1.ROWID+t2.ROWID";


function selectSegmentMatchesFromDatabase(callbackSuccess, segmentId){
	const sel_short=`SELECT ${sellist1} FROM ${joinlist} ORDER BY ${orderlist}`;
	function makeTransaction(callback){
		return function(transaction){
			transaction.executeSql( sel_short, [build, build, segmentId], callback, callback);
			//transaction.executeSql('SELECT ibdsegs.ROWID as ROWID, t1.name AS name1, t2.name AS name2, t1.id_1 AS id1_1, t1.id_2 AS id1_2, t2.id_1 AS id2_1, t2.id_2 AS id2_2, ibdsegs.chromosome AS chromosome, ibdsegs.start AS start, ibdsegs.end AS end, ibdsegs.centimorgans AS centimorgans, ibdsegs.snps AS snps FROM ibdsegs JOIN idalias t1 ON (t1.id_1=ibdsegs.id1_1 AND t1.id_2=ibdsegs.id1_2) JOIN idalias t2 ON (t2.id_1=ibdsegs.id2_1 AND t2.id_2=ibdsegs.id2_2) JOIN ibdsegs t3 ON (ibdsegs.build=? AND t3.build=? AND t3.ROWID=? AND ((t3.chromosome=ibdsegs.chromosome AND ((ibdsegs.start>=t3.start AND ibdsegs.end<=t3.end) OR (ibdsegs.start<=t3.start AND ibdsegs.end>=t3.end) OR (ibdsegs.start<=t3.start AND ibdsegs.end>=t3.start) OR (ibdsegs.start<=t3.end AND ibdsegs.end>=t3.end))) OR ibdsegs.chromosome=100) AND ((t3.id1_1=ibdsegs.id1_1 AND t3.id1_2=ibdsegs.id1_2) OR (t3.id1_1=ibdsegs.id2_1 AND t3.id1_2=ibdsegs.id2_2) OR (t3.id2_1=ibdsegs.id1_1 AND t3.id2_2=ibdsegs.id1_2) OR (t3.id2_1=ibdsegs.id2_1 AND t3.id2_2=ibdsegs.id2_2))) ORDER BY chromosome, ibdsegs.start, ibdsegs.end DESC, ibdsegs.ROWID, julianday(t1.date)+julianday(t2.date), t1.ROWID+t2.ROWID', [build, build, segmentId], callback, callback);
		};
	}
	db23.readTransaction(makeTransaction(callbackSuccess));
}

function selectSegmentMatchesAndPhaseFromDatabase(callbackSuccess, segmentId){
	const sel_long=`SELECT ${sellist1}, ${sellist2} FROM ${joinlist} ORDER BY ${orderlist}`;
	function makeTransaction(callback){
		return function(transaction){
			transaction.executeSql( sel_long, [build, build, segmentId], callback, callback);
			// transaction.executeSql('SELECT ibdsegs.ROWID as ROWID, t1.name AS name1, t2.name AS name2, t1.id_1 AS id1_1, t1.id_2 AS id1_2, t2.id_1 AS id2_1, t2.id_2 AS id2_2, ibdsegs.chromosome AS chromosome, ibdsegs.start AS start, ibdsegs.end AS end, ibdsegs.centimorgans AS centimorgans, ibdsegs.snps AS snps, ibdsegs.phase1 AS phase1, ibdsegs.relationship1 AS relationship1, ibdsegs.phase2 AS phase2, ibdsegs.relationship2 AS relationship2, ibdsegs.comment AS comment FROM ibdsegs JOIN idalias t1 ON (t1.id_1=ibdsegs.id1_1 AND t1.id_2=ibdsegs.id1_2) JOIN idalias t2 ON (t2.id_1=ibdsegs.id2_1 AND t2.id_2=ibdsegs.id2_2) JOIN ibdsegs t3 ON (ibdsegs.build=? AND t3.build=? AND t3.ROWID=? AND ((t3.chromosome=ibdsegs.chromosome AND ((ibdsegs.start>=t3.start AND ibdsegs.end<=t3.end) OR (ibdsegs.start<=t3.start AND ibdsegs.end>=t3.end) OR (ibdsegs.start<=t3.start AND ibdsegs.end>=t3.start) OR (ibdsegs.start<=t3.end AND ibdsegs.end>=t3.end))) OR ibdsegs.chromosome=100) AND ((t3.id1_1=ibdsegs.id1_1 AND t3.id1_2=ibdsegs.id1_2) OR (t3.id1_1=ibdsegs.id2_1 AND t3.id1_2=ibdsegs.id2_2) OR (t3.id2_1=ibdsegs.id1_1 AND t3.id2_2=ibdsegs.id1_2) OR (t3.id2_1=ibdsegs.id2_1 AND t3.id2_2=ibdsegs.id2_2))) ORDER BY chromosome, ibdsegs.start, ibdsegs.end DESC, ibdsegs.ROWID, julianday(t1.date)+julianday(t2.date), t1.ROWID+t2.ROWID', [build, build, segmentId], callback, callback);
		};
	}
	db23.readTransaction(makeTransaction(callbackSuccess));
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

/*
** Queries for matches
** this returns the rows of segment data suitable for subsequent processing
** either as display on page or save to csv files.
** - in: id
*/
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


// Put data from 529 export (without phase) into database
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



/*
** we don't want a listenter here.  do we?

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
	db_conlog( 1, "db_res msg received with req: " + Object.keys( request ) );
  
	if(request.checkIfInDatabase!=null){
		db_conlog( 1, "InDB checking " + request );
		if(request.shiftIsDown){
			// Skip database query
			chrome.tabs.sendMessage(sender.tab.id, {indexId: request.indexId, matchId: request.matchId, indexName: request.indexName, matchName: request.matchName, needToCompare: true});
		}
		function makeMessageSender(tab_id, indexId, matchId, indexName, matchName){
			return function(transaction, resultSet){
				var myrow=null;
				if(resultSet.rows.length==1) myrow=resultSet.rows.item(0);
				db_conlog( 2, `   DBquery returned ${resultSet.rows.length} rows` );
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
  });
*/

function onRequest(request, sender, sendResponse) {

	/*  no used here...
	if(request.ids==null){
		if(request.url!=null){
			// Handles new experience 529Renew button
			openActiveURL(request.url);
		}
		// if(request.sharingNamesAndIds!=null){
		// 	sharingNamesAndIds=request.sharingNamesAndIds;
		// }
		// else if(request.profileNamesAndIds!=null){
		// 	profileNamesAndIds=request.profileNamesAndIds;
		// }
		sendResponse({});
		return;
	}
	*/

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
			
	// Return nothing to let the connection be cleaned up.
	sendResponse({});
}

function deleteAllData(callbackSuccess){
	if(confirm("Delete all data stored in your 529Renew local database?")){
		db23.transaction(
			function(transaction) {
				transaction.executeSql("DELETE FROM ibdsegs",[]);
				transaction.executeSql("DELETE FROM idalias",[]);
			}, function(){alert("Failed to delete data stored in 529Renew local database");}, callbackSuccess
		);
	}
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
/*
** Ugliness by numbers...
** Unique ID numbers used by 23 and me appear to be 64-bit integers, represented in
** queries as 16-digit hexadecimal values.  Javascript cannot cope with integers this high
** as all numbers are stored as floating point values and limited to a 53-bit mantissa.
** Therefore the code stores each as two 32-bit integers and converts back to string as required.
*/
function id2numbers(id){
	// Convert 16 digit (hexadecimal) 23andMe id (no 0x prefix) to an array of 2 integers
	// Note that Javascript cannot accurately represent big integers with >13 hex digits
	if(id.length==undefined || id.length!=16){
		alert("Invalid 23andMe id: " + id);
		return null;
	}
	var result=new Array(2);
	result[0]=parseInt(id.substr(0,8),16);
	result[1]=parseInt(id.substr(8,8),16);
	return result;
}
// Duplicated in popup.js
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



function idsRequest(request, sender, sendResponse) {

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
			
	// Return nothing to let the connection be cleaned up.
	sendResponse({});
}

