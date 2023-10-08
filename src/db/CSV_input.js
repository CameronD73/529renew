/*
** database I/O routines for sqlite-wasm version
** These routines output CSV-format files.
*/

/*  eslint-disable no-unused-vars */
"use strict";

/*
** extract the profile unique ID from the profile url
*/
function get_ID_from_URL( url ) {
	const regex = /\/profile\//;
	let offset = url.search( regex );
	if( offset < 10 || offset > 40 ) {
		let msg = `Warning: unexpected profile url, found at ${offset} - expecting 24 in '${url}` ;
		console.log( msg );
		logHtml( msg );
		return '';
	}
	let idoff = offset + 9;
	let idstring = url.slice( idoff, idoff+16);
	return idstring;
}

function importProfileCSV(lineList, nFields ){
	if(!lineList) return;
	const profilemap = new Map();
		// i=0 is header row (so skip row zero)
	for(let i=1; i< lineList.length; i++){
		var entry=lineList[i].split(',');
		if(entry.length <= 1 )
			continue;		// ignore trailing blank line
		if(entry.length<nFields){
			let errmsg = `Unexpected line with ${entry.length} fields (expected ${nFields}). Line number ${i}:` + lineList[i];
			console.log( errmsg);
			alert( errmsg );
			continue;
		}
		const regex = /["']/g;		// strip out any quotes
		let   ID=entry[0].replaceAll( regex, '');
		let Name=entry[1].replaceAll( regex, '');
		profilemap.set( ID, {name:Name });
	}
	db_conlog( 1, `  importCSV: adding ${profilemap.size} profile rows`);
	// add all the unique keys and names to the alias table
	need_webSQL_profile = true;		// force websql reload...
	DBworker.postMessage( { reason: 'insertProfiles', amap: profilemap });
}

/* Put data from 529 export (without phase) into database
** 1. scan entire file and split into testers (alias) and segments
** 2. insert/update alias values and retrieve ID key values
** 3. insert/update segments
** 4. insert/update DNAmatch pair data.
** - Unlike the 23+Me csv import, this is only ever called on one file, as the most recent file
** should have everything.
*/

/*
** lineList is an array with the full text from the file - one line per array row
** nFields may be 9 (normal export) or 14 (exported with full phase, etc details)
*/
function import529CSV(lineList, nFields ){

	if(!lineList) return;
	migration_started = secondsToday();
	const aliasmap = new Map();
	const matchesmap = new Map();
	const DNArelsmap = new Map();
	const chr200map = new Map();
	// there may be conflicting records where reported matching segment has changed.
	const segmentmap = new Map();		// unique to id1, id2, chr, start MB
	const segmentmapHigh = new Map();		// unique to id1, id2, chr, end MB
	const fullsegmentmap = new Map();
	let conflicts = [];			// array of objects where uniqueness on start or end addr fails.
	let conflictsFull = [];			// same for fully-IBD segments

	const useReplace = parseInt(getSetting( 'importReplaces'));
	const today = formattedDate2();
	
	// i=0 is header row (skip)
	for(let i=1; i< lineList.length; i++){
		var entry=lineList[i].split(',');
		if(entry.length <= 1 )
			continue;		// ignore trailing blank line
		if(entry.length!=nFields){
			let errmsg = `Unexpected line with ${entry.length} fields (expected ${nFields}). Line number ${i}:` + lineList[i];
			console.log( errmsg);
			alert( errmsg );
			continue;
		}
		let firstName=entry[0];
		let firstID=entry[7];
		let secondName=entry[1];
		let secondID=entry[8];
		let cmnt = (nFields == 14 ? entry[13] : "");
		// add to alias name table, including space for the autoincrement ID to be determined later. (unused?)
		if( !aliasmap.has(firstID)) {
			aliasmap.set(firstID, {$k:firstID, $name:firstName });
		}
		if( !aliasmap.has(secondID)) {
			aliasmap.set(secondID, {$k:firstID, $name:secondName });
		}
		// now identify if either of the testers is a profile person, so we can potentially add to DNArelatives table
		let p1_is_profile = false;		
		let p2_is_profile = false;
		let both_are_profiles = false;
		let kitID = undefined;
		let testerID = undefined;
		for ( const obj of profile_summary ) {
			if ( obj.IDprofile === firstID ) {
				p1_is_profile = true;
				kitID = firstID;
				testerID = secondID;
			}
			if ( obj.IDprofile === secondID ) {
				p2_is_profile = true;
				if ( p1_is_profile ) {
					both_are_profiles = true;
				} else {
					kitID =secondID;
					testerID = firstID;
				}
			}

		}
		let DNArelskey = kitID +  "_" + testerID;
		// there is missing logic here related to "both are profiles" but I cannot imagine a situation
		// where we would need to add anything to that row of the DNArelatives table.
		if( !DNArelsmap.has( DNArelskey ) ) {
			DNArelsmap.set( DNArelskey, {$id1: kitID, $id2: testerID, $note:cmnt} );
		} else {
			// previous version permitted comment on each segment, but not on tester.
			// this version reverses that, so just append them all (unless they are duplicates)
			if ( cmnt !== "" && DNArelsmap.get(DNArelskey).$note !== cmnt ) {
				DNArelsmap.get(DNArelskey).$note += cmnt;
			}
		}

		if ( firstID > secondID ) {
			let temp = secondID;
			secondID = firstID;
			firstID = temp;
		}
		let matchkey = firstID + "_" + secondID;
		if( !matchesmap.has( matchkey ) ) {
			matchesmap.set( matchkey,
				 {$id1: firstID, $id2: secondID, $ishidden: undefined, $cMtotal : 0.0, $pctshared:0.0 , $nsegs: 0, $hasSegs: false} );
		}
		let chr;
		if( entry[2] == "X" ) {
			chr = 23;
		} else {
			chr = parseInt( entry[2] );
		}

		if ( chr < 50 ) {
			let cM=parseFloat(entry[5]);
			matchesmap.get( matchkey).$cMtotal += cM;
			matchesmap.get( matchkey).$nsegs++; 
			matchesmap.get( matchkey).$hasSegs = true; 
			matchesmap.get( matchkey).$ishidden = false; 
		} else if( chr == 200 ){
			// we might have chr200 as well as other segment match entries.  We could rely on the file being sorted by chr number
			// but the user may have re-sorted for some reason, so just load all and scan later.
			if( !chr200map.has( matchkey ) ) {
				let pctsh = 0.001 * parseFloat( entry[6] );
				let cM = pctShared2cM( pctsh );
				let segshidden =  (entry[4] == "1") ? 1 : 0;
				chr200map.set( matchkey,
					 {$id1: firstID, $id2: secondID, $ishidden: segshidden, $cMtotal: cM, $pctshared : pctsh, $nsegs: 0, $hasSegs: false } );
			}
		}
	}
	// now realign all chr 200 values where we have real segments...
	for( const[key, obj] of chr200map ) {
		if ( !matchesmap.has( key )) {
			let msg = `URK - chr 200 for ${key} cf ${obj.$id2} has no matching dnamatch map`;
			db_conlog( 0, msg );
			// should create if needed...
		} else {
			let mapval = matchesmap.get( key )
			if ( ! mapval.$hassegs) {
				// have not recorded any segments, so update the matchesmap with what little we know
				let map200 = chr200map.get( key );
				mapval.$ishidden = map200.$ishidden;
				mapval.$cMtotal = map200.$cMtotal;
				mapval.$pctshared = map200.$pctshared;
			}
			// chr200map.delete( key );	  can ignore...
		}
	}
	// DBworker.postMessage( { reason: 'migrateMatchMapHidden', amap: chr200map, useReplace: useReplace });

	db_conlog( 1, `  adding ${aliasmap.size} alias rows`);
	// add all the unique keys and names to the alias table
	// never replace existing, as 23 imports have more info.
	DBworker.postMessage( { reason: 'migrateAliasmap529', amap: aliasmap, useReplace: false });

	
	db_conlog( 1, `adding ${lineList.length} segment rows. This may take a while...`);
	// Now reprocess the list and save the matched segments
	for(let i=1; i< lineList.length; i++){
		var entry=lineList[i].split(',');
		if(entry.length!=nFields){
			continue;		// have already warned user in the first pass
		}
		
		let firstID=entry[7];
		let secondID=entry[8];
		let entryChromosome;
		if(entry[2]==="X") 
			entryChromosome=23;
		else
			entryChromosome=entry[2];
		if ( entryChromosome < 50 ) {
			// the chromosome 100 fakes will be handled later...
			let entryStart=entry[3];
			let entryEnd=entry[4];
			let entrycM = round_cM( entry[5] );
			let entrySNPs=entry[6];
		
			if ( firstID > secondID ) {
				let temp = secondID;
				secondID = firstID;
				firstID = temp;
			}
			let segkey = firstID + "_" +  secondID + "_" + entryChromosome + "_" + entryStart;
			if( segmentmap.has( segkey ) ) {
				//console.log( `conflict: Segment key ${segkey} is not unique on start`);
				let so = segmentmap.get( segkey );
				let conflict = {id1:firstID, id2:secondID, n1:entry[0], n2: entry[1], chr:entryChromosome, 
							start1: so.$start, 	end1: so.$end, snps1: so.$snps, cM1:  so.$cM,
							start2: entryStart, end2: so.entryEnd,  snps2: entrySNPs, cM2:  entrycM	} ;
				conflicts.push( conflict );

			} else {
				segmentmap.set( segkey, {$id1: firstID, $id2: secondID,
									 $chromosome: entryChromosome,
									 $cM: entrycM,
									 $snps: entrySNPs,
									 $start:entryStart,
									 $end: entryEnd
									}
				);
			}
			let segkeyHigh = firstID + secondID + "_" + entryChromosome + "_" + entryEnd;
			if( segmentmapHigh.has( segkeyHigh ) ) {
				//console.log( `conflict: Segment key ${segkeyHigh} is not unique on end`);
				let so = segmentmapHigh.get( segkeyHigh );
				let conflict = {id1:firstID, id2:secondID, n1:entry[0], n2: entry[1], chr:entryChromosome, 
							start1: so.$start, 	end1: so.$end, snps1: so.$snps, cM1:  so.$cM,
							start2: entryStart, end2: so.entryEnd,  snps2: entrySNPs, cM2:  entrycM	} ;
				conflicts.push( conflict );

			} else {
				segmentmapHigh.set( segkeyHigh, {$id1: firstID, $id2: secondID,
									 $chromosome: entryChromosome,
									 $cM: entrycM,
									 $snps: entrySNPs,
									 $start:entryStart,
									 $end: entryEnd
									}
				);
			}
		}
	}
	
	DBworker.postMessage( { reason: 'migrateSegmentMap', amap: segmentmap, useReplace: useReplace });

	if (fullsegmentmap.length > 0 )
		 DBworker.postMessage( { reason: 'migrateSegmentMapFull', amap: fullsegmentmap, useReplace: useReplace });

	db_conlog( 1, `adding ${matchesmap.size} DMA matches rows`);
	for( const[key, obj] of matchesmap ) {
		let cM = round_cM(obj.$cMtotal);
		obj.$cMtotal = cM;
		obj.$pctshared = cM2pctShared( cM );
	}

	DBworker.postMessage( { reason: 'migrateMatchMap', amap: matchesmap, useReplace: useReplace });
	
	// DNArelatives has to be last, as it triggers any cleanup actions
	DBworker.postMessage( { reason: 'migrateDNArelatives529', amap: DNArelsmap, useReplace: useReplace });

	reportConflicts( conflicts, conflictsFull );
}


let sidematrix = ["n", "M", "P", "b"];		// neither, maternal, paternal, both
/*
** import the data that is exported by the 23 and me "DNA Relatives Data Download"
**
** this routine may (and should) get called repeatedly for several files in a row.
**
** lineList is an array with the full text from the file - one line per array row
** nFields should be 30 (normal export)
*/
function import23CSV( kitID, kitName, lineList, nFields ){

	if(!lineList) return;
	const aliasmap = new Map();
	const matchesmap = new Map();
	const DNArelsmap = new Map();
	const segmentmap = new Map();		// unique to id1, id2, chr, start MB
	const segmentmapHigh = new Map();		// unique to id1, id2, chr, end MB
	const fullsegmentmap = new Map();   // map of fully IBD segments
	// there may be conflicting records where reported matching segment has changed. Unlikely in 23andMe d'load
	let conflicts = [];			// array of objects where uniqueness on start or end addr fails.
	let conflictsFull = [];			// same for fully-IBD segments

	const useReplace = parseInt(getSetting( 'importReplaces'));
	const today = formattedDate2();
	
	// i=0 is header row (skip)
	for(let i=1; i< lineList.length; i++){
		if( lineList[i].length < 10 )
			continue;
		const parsed = Papa.parse( lineList[i], {delimiter: ",", skipEmptyLines:true} );
		if( parsed.errors.length > 0 ) {
			let errmsg = `Error at line ${i}: parsed.errors`;
			console.log( errmsg, parsed.errors );
			logHtml( 'error', errmsg );
		}

		let entry=parsed.data[0];
		if(entry.length <= 1 )
			continue;		// ignore trailing blank line
		if(entry.length!=nFields){
			let errmsg = `Unexpected line with ${entry.length} fields (expected ${nFields}). Line number ${i}:` + lineList[i];
			console.log( errmsg);
			logHtml( 'error', errmsg );
			continue;
		}

		let firstName=entry[0];
		let profilestr = entry[8];
		let firstID = get_ID_from_URL( profilestr);
		let secondID;
		let testerID = firstID;

		let isprofile = false;
		if ( entry[27] ==="owned" ) {
			isprofile = true;
		}
		// data that varies per segment matched
		let e23segchr = entry[2];
		let e23segstart = entry[3];
		let e23segend = entry[4];
		let e23segsnps = entry[6];
		let e23segcM = entry[5];
		let hassegs = 0;
		let ishidden = 0;
		if ( e23segchr.length == 0 ) {
			ishidden = 1;
		} else {
			ishidden = 0;
			if( e23segchr === "X" ) {
				e23segchr = 23;
			} else {
				e23segchr = parseInt( e23segchr );
			}
			e23segstart = parseInt( e23segstart );
			e23segend = parseInt( e23segend );
			e23segsnps = parseInt( e23segsnps );
			e23segcM = parseFloat( e23segcM );
			hassegs = 1;
		}
		// data that is fixed per matched pair (even if neither is profile kit)
		let e23cMtotal = 0.0;
		let e23pctshared = parseFloat(entry[14]);		// eliminate the pct sign
		let e23nsegs = entry[15];
		let totalIBD = entry[7];	// always been blank in my samples.
		let fullmatch = false;
		if ( totalIBD.length > 0 ) {
			fullmatch = true;
		}
		if ( ishidden ) {
			// no segments, so decide on total cM.
			e23cMtotal = pctShared2cM( e23pctshared );
		}
		// data unique to tester...for idalias
		let e23hapmat = entry[18];
		let e23happat = entry[19];
		let bYear = entry[10];

		// data that is fixed per DNA relative
		let e23notes  = entry[26];
		let matside = entry[16] === "TRUE" ? 1 : 0 ;
		let patside = entry[17] === "TRUE" ? 2 : 0 ;
		let e23side = sidematrix[patside + matside] ;

		// add to alias name table, 
		if( !aliasmap.has(firstID)) {
			aliasmap.set(firstID, {$k: firstID, $name:firstName,  $hapMat: e23hapmat, $hapPat: e23happat, $byear: bYear });
		}

		if ( firstID > kitID ) {
			secondID = firstID;
			firstID = kitID;
		} else {
			secondID = kitID;
		}
		// the primary key includes whether segs are hidden or not, but in any one input file, they should be unique on
		// the pair of IDs only
		let matchkey = firstID + secondID;
		if( !matchesmap.has( matchkey ) ) {
			matchesmap.set( matchkey,
				 {$id1: firstID, $id2: secondID, $ishidden: ishidden, $cMtotal : e23cMtotal, $pctshared:e23pctshared , $nsegs: e23nsegs, $hasSegs: hassegs} );
		}
		let DNArelskey = kitID + testerID;
		if( !DNArelsmap.has( DNArelskey ) ) {
			DNArelsmap.set( DNArelskey,
				 {$id1: kitID, $id2: testerID, $side: e23side, $note:e23notes} );
		}

		if ( hassegs ) {
			matchesmap.get( matchkey).$cMtotal += e23segcM;
			let segkey = firstID + secondID + "_" + e23segchr + "_" + e23segstart;
			if ( fullmatch ) {
				if( fullsegmentmap.has(segkey)) {
					console.log( `conflict: FULL IBD Segment key ${segkey} is not unique on start`);
					let so = fullsegmentmap.get( segkey );
					let conflict = {id1:kitID, id2:testerID, n1:firstName,  chr:e23segchr, 
								start1: so.$start, 	end1: so.$end, snps1: so.$snps, cM1:  so.$cM,
								start2: e23segstart, end2: so.e23segend,  snps2: e23segsnps, cM2:  e23segcM	} ;
					conflictsFull.push( conflict );
				} else {
					fullsegmentmap.set( segkey, {$id1: firstID, $id2: secondID,
						$chromosome: e23segchr,
						$cM: e23segcM,
						$snps: e23segsnps,
						$start:e23segstart,
						$end: e23segend
						} );
				}
			} else {
				if( segmentmap.has( segkey ) ) {
					console.log( `conflict: Segment key ${segkey} is not unique on start`);
					let so = segmentmap.get( segkey );
					let conflict = {id1:kitID, id2:testerID, n1:firstName,  chr:e23segchr, 
								start1: so.$start, 	end1: so.$end, snps1: so.$snps, cM1:  so.$cM,
								start2: e23segstart, end2: so.e23segend,  snps2: e23segsnps, cM2:  e23segcM	} ;
					conflicts.push( conflict );

				} else {
					segmentmap.set( segkey, {$id1: firstID, $id2: secondID,
										$chromosome: e23segchr,
										$cM: e23segcM,
										$snps: e23segsnps,
										$start:e23segstart,
										$end: e23segend
										}
					);
				}
				let segkeyHigh = firstID + secondID + "_" + e23segchr + "_" + e23segend;
				if( segmentmapHigh.has( segkeyHigh ) ) {
					//console.log( `conflict: Segment key ${segkeyHigh} is not unique on end`);
					let so = segmentmapHigh.get( segkeyHigh );
					let conflict = {id1:firstID, id2:secondID, n1:entry[0], n2: entry[1], chr:e23segchr, 
								start1: so.$start, 	end1: so.$end, snps1: so.$snps, cM1:  so.$cM,
								start2: e23segstart, end2: so.e23segend,  snps2: e23segsnps, cM2:  e23segcM	} ;
					conflicts.push( conflict );

				} else {
					segmentmapHigh.set( segkeyHigh, {$id1: firstID, $id2: secondID,
										$chromosome: e23segchr,
										$cM: e23segcM,
										$snps: e23segsnps,
										$start:e23segstart,
										$end: e23segend
										}
					);
				}
			}
		}
	}
	db_conlog( 1, `  adding ${aliasmap.size} alias rows`);
	// add all the unique keys and names to the alias table
	DBworker.postMessage( { reason: 'migrateAliasmap23', amap: aliasmap, useReplace: useReplace });

	
	db_conlog( 1, `adding ${segmentmap.size} segment rows. This may take a while...`);

	DBworker.postMessage( { reason: 'migrateSegmentMap', amap: segmentmap, useReplace: useReplace });

	if (fullsegmentmap.length > 0 )
		 DBworker.postMessage( { reason: 'migrateSegmentMapFull', amap: fullsegmentmap, useReplace: useReplace });

	db_conlog( 1, `adding ${matchesmap.size} summary rows`);

	for( const[key, obj] of matchesmap ) {
		if (obj.$hasSegs ) {
			let cM = round_cM(obj.$cMtotal);
			obj.$cMtotal = cM;
		}
	}

	DBworker.postMessage( { reason: 'migrateMatchMap', amap: matchesmap, useReplace: useReplace });

	DBworker.postMessage( { reason: 'migrateDNArelatives', amap: DNArelsmap, useReplace: useReplace });

	reportConflicts( conflicts, conflictsFull );
}

function reportConflicts( conflicts, conflictsFull ) {
	if ( conflictsFull.length > 0 ) {
		let msg =  `There were ${conflictsFull.length} unresolved conflicts on full-match segments`;
		console.log( msg );
		alert( msg );
	}
	if ( conflicts.length > 0 ) {
		let msg = `There were ${conflicts.length} unresolved conflicts` + ' on segment matches\nThis probably relates to old code mixing full and half-matching segments from siblings';
		console.log( msg );
		alert( msg + '\nThere will be a CSV-formatted list at the end\nfor you to copy/paste if needed.');
		// HTML version
		let ci = document.getElementById("conflict_info");
		try {
			let lastchr = -1;
			let ct;
			for( const c of conflicts ){
				if ( c.chr != lastchr ) {
					let head = ci.appendChild(document.createElement( 'h3'));
					head.append( `Chromosome ${c.chr}`);
					ct = ci.appendChild(document.createElement( 'P'));
					lastchr = c.chr;
				}
				ct.append( `Between ${c.n1} and ${c.n2}, `);
				if ( c.start1 == c.start2) {
					ct.append( `starting at ${c.start1} but ends ${c.end1} / ${c.end2}`);
				} else {
					ct.append( `ending at ${c.end1} but starting ${c.start1} / ${c.start2}`);
				}
				ct.append( `, cM:${c.cM1} / ${c.cM2}, SNPs :${c.snps1} / ${c.snps2}`);
				ct.append( document.createElement( 'BR'));
			}
		} catch( e ) {
            console.error( `CSV conflict display: error: ${e.message}`);
		}
		// now CSV version
		try {
			let head = ci.appendChild(document.createElement( 'h3'));
			head.append( "CSV listing");
			let ct = ci.appendChild(document.createElement( 'P'));
			ct.append( 'name1,name2,id1,id2,startMB1,startMB2,endMB1,endMB2,cM1,cM2,snps1,snps2');
			ct.append( document.createElement( 'BR'));
			for( const c of conflicts ){
				ct.append( `${c.n1},${c.id1},${c.n2},${c.id1}`);
				ct.append( `${c.start1},${c.start2},${c.end1},${c.end2},${c.cM1},${c.cM2},${c.snps1},${c.snps2}`);
				ct.append( document.createElement( 'BR'));
			}
		} catch( e ) {
            console.error( `CSV conflict display as CSV: error: ${e.message}`);
		}
	}

}
