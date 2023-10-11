/* define it as an object to isolate namespaces for different DB types.
*/


console.log( 'dbcode loaded');

var DBwasm = {


    /*
    ** define tables in the sqlite database.
    ** To avoid messing around with possible changes I might desire in the future, I am throwing in 
    ** everything I think I might need.
    ** This is rather more extensive than the V1.2 structure in the WebSQL version
    ** The Table organisation is described to some extent in the GitHub Wiki.
    */
    create_db_tables: function() {
        const tableDefs = [
            'DBVersion (version INTEGER, date TEXT, PRIMARY KEY( version) )',
            'profiles ( IDprofile TEXT, pname TEXT NOT NULL UNIQUE, PRIMARY KEY(IDprofile) )',
            'settings (setting TEXT NOT NULL UNIQUE, value TEXT, PRIMARY KEY(setting))',

            'idalias(IDText TEXT NOT NULL PRIMARY KEY, name TEXT NOT NULL, date TEXT NOT NULL, hapMat TEXT DEFAULT null, hapPat TEXT DEFAULT null, bYear INTEGER DEFAULT null )',

            'DNARelatives ( IDprofile TEXT, IDrelative TEXT NOT NULL REFERENCES idalias(IDText) DEFERRABLE INITIALLY DEFERRED, ICWscanned INTEGER DEFAULT null, dateScanned TEXT DEFAULT null, side TEXT DEFAULT null, comment TEXT DEFAULT null, PRIMARY KEY(IDprofile,IDrelative) )',

            'DNAmatches  ( ID1 TEXT  NOT NULL REFERENCES idalias(IDText) DEFERRABLE INITIALLY DEFERRED, ID2 TEXT NOT NULL REFERENCES idalias(IDText) DEFERRABLE INITIALLY DEFERRED, ishidden INTEGER DEFAULT 0, pctshared REAL, cMtotal REAL, nsegs INTEGER DEFAULT null, hasSegs INTEGER DEFAULT 0, lastdate TEXT DEFAULT null, PRIMARY KEY(ID1,ID2,ishidden) )',

            'ibdsegs(ID1 TEXT NOT NULL REFERENCES idalias(IDText) DEFERRABLE INITIALLY DEFERRED, ID2 TEXT NOT NULL REFERENCES idalias(IDText) DEFERRABLE INITIALLY DEFERRED, chromosome INTEGER NOT NULL, start INTEGER NOT NULL, end INTEGER NOT NULL, cM REAL NOT NULL, snps INTEGER NOT NULL)',

            'ibdsegsFull(ID1 TEXT NOT NULL REFERENCES idalias(IDText) DEFERRABLE INITIALLY DEFERRED, ID2 TEXT NOT NULL REFERENCES idalias(IDText) DEFERRABLE INITIALLY DEFERRED, chromosome INTEGER NOT NULL, start INTEGER NOT NULL, end INTEGER NOT NULL, cM REAL NOT NULL, snps INTEGER NOT NULL)',

            'ICWSets (IDprofile TEXT NOT NULL,ID2 TEXT NOT NULL REFERENCES idalias(IDText) DEFERRABLE INITIALLY DEFERRED, ID3 TEXT NOT NULL REFERENCES idalias(IDText) DEFERRABLE INITIALLY DEFERRED, chromosome INTEGER NOT NULL, start INTEGER NOT NULL, end INTEGER NOT NULL)',

            'ICWSets2way (IDprofile TEXT NOT NULL,ID2 TEXT NOT NULL REFERENCES idalias(IDText) DEFERRABLE INITIALLY DEFERRED, ID3 TEXT NOT NULL REFERENCES idalias(IDText) DEFERRABLE INITIALLY DEFERRED, chromosome INTEGER NOT NULL, start INTEGER NOT NULL, end INTEGER NOT NULL)',

            'ICWSegXref ( ICWset_row INTEGER NOT NULL, segment_row INTEGER NOT NULL )'
        ];

        const indexDefs = [
            'idalias_name ON idalias ( name )',
            'ibdsegs_id1 ON ibdsegs ( ID1 )',
            'ibdsegs_id2 ON ibdsegs ( ID2 )',
            'ibssegs_chromosomes ON ibdsegs ( chromosome )',
            'xref_icw ON ICWSegXref ( ICWset_row )',
            'icwset_idp ON ICWSets ( IDprofile )',
            'icwset_id2 ON ICWSets ( ID2 )',
            'icwset_id3 ON ICWSets ( ID3 )',
            'icwset2_idp ON ICWSets2way ( IDprofile )',
            'icwset2_id2 ON ICWSets2way ( ID2 )',
            'icwset2_id3 ON ICWSets2way ( ID3 )'
        ];
        const indexDefsUnique = [
            'ibdsegs_kitchen_sink ON ibdsegs ( ID1, ID2, chromosome, start )',
            'ibdsegsFull_kitchen_sink ON ibdsegsFull ( ID1, ID2, chromosome, start )',
            'xref_icw ON ICWSegXref ( ICWset_row, segment_row )',
            'ICW_kitchen_sink ON ICWSets ( IDprofile, ID2, ID3, chromosome, start )',
            'ICW2_kitchen_sink ON ICWSets2way ( IDprofile, ID2, ID3, chromosome, start )',
        ];
    

        try {
            for( let tabledef of tableDefs ) {
                let instruction = 'CREATE TABLE IF NOT EXISTS ' + tabledef;
                r = DB529.exec( {
                    sql: instruction,
                    returnValue: "resultRows"
                } );
                // console.log( 'create tbl returned ', r );
            }
            for( let indexdef of indexDefs ) {
                let instruction = 'CREATE INDEX IF NOT EXISTS ' + indexdef;
                DB529.exec( {
                    sql: instruction,
                    returnValue: "resultRows"
                } );
            }
            for( let indexdef of indexDefsUnique ) {
                let instruction = 'CREATE UNIQUE INDEX IF NOT EXISTS ' + indexdef;
                DB529.exec( {
                    sql: instruction,
                    returnValue: "resultRows"
                } );
            }
            const today = formattedDate2();
            DB529.exec( {
                sql:`INSERT into DBVersion (version, date) VALUES (1, '${today}');`,
                returnValue: "resultRows"
            });
        } catch( e ) {
            console.error( 'DB Table creation failed: ', e.message);
        }
    },
    
    get_summary: function() {
        let sqlcode = " \
                SELECT \'DBVersion\' as tbl, max(version) as nrows  from DBVersion \
            UNION SELECT \'profiles\' as tbl, count(*) as nrows from profiles \
            UNION SELECT \'ICWSegXref\' as tbl, count(*) as nrows from ICWSegXref \
            UNION SELECT \'DNARelatives\' as tbl, count(*) as nrows from DNARelatives \
            UNION SELECT \'DNAmatches\' as tbl, count(*) as nrows from DNAmatches \
            UNION SELECT \'ibdsegs\' as tbl, count(*) as nrows from ibdsegs \
            UNION SELECT \'idalias\' as tbl, count(*) as nrows from idalias \
            UNION SELECT \'ICWSets3way\' as tbl, count(*) as nrows from ICWSets \
            UNION SELECT \'ICWSets2way\' as tbl, count(*) as nrows from ICWSets2way \
            UNION SELECT \'settings\' as tbl, count(*) as nrows from settings;";

        let rows = [];
        let options = {
            resultRows: rows,
            rowMode: 'array'
        };
        try{
            DB529.exec( sqlcode, options );
        } catch( e ) {
            conerror( `DB get_summary: ${e.message}`);
            return( [ ] );
        }
        //console.log( 'DB summary gave: ', rows);
        return rows;

    },

    get_profile_list: function() {
        let sqlcode = "SELECT *  from profiles;";

        let rows = [];
        let options = {
            resultRows: rows,
            rowMode: 'object'
        };
        try{
            DB529.exec( sqlcode, options );
        } catch( e ) {
            conerror( `DB get_profile_list: ${e.message}`);
            return( [ ] );
        }
        return rows;
    },

    get_DNArel_list: function( IDprofile ) {
        let rows = [];
        let options = {
            resultRows: rows,
            rowMode: 'object'
        };
        let sqlcode = "SELECT IDprofile, IDrelative  from DNArelatives";
        if ( IDprofile ) {
            sqlcode += ' WHERE IDprofile = ?';
            options.bind = [IDprofile];
        }
        sqlcode += ' ORDER BY IDrelative;';
        try{
            DB529.exec( sqlcode, options );
        } catch( e ) {
            conerror( `DB get_DNArel_list: ${e.message}, with ${sqlcode}`);
            return( [ ] );
        }
        return rows;
    },

    /* returns a single row for each id1-id2 pair - reporting only unhidden results if both are present
    */
    get_DNAmatch_list: function(  ) {
        let sqlcode = "SELECT ID1, ID2, min(ishidden) as ishidden, max(hasSegs) as hasSegs, max(nsegs) as nsegs from DNAmatches GROUP BY ID1,ID2;";
        
        let rows = [];
        let options = {
            resultRows: rows,
            rowMode: 'object'
        };
        try{
            DB529.exec( sqlcode, options );
        } catch( e ) {
            conerror( `DB get_DNAmatch_list: ${e.message}`);
            return( [ ] );
        }
        return rows;
    },

    get_matches_list( filter, purpose ) {
        // the select is slightly tricky as we want to exclude any hidden DNA matches
        let qry = "SELECT name, IDText from  DNAmatches join idalias on (IDText = ID1 OR IDText = ID2) where ishidden = 0 ";
        if ( filter ) {
            qry +=  ' AND name like ?';
        }
        qry += " GROUP by IDText ORDER BY ";
        if ( purpose == 'select') {
            qry += "name COLLATE NOCASE";
        } else {            
            qry += "IDText COLLATE NOCASE";     // not sure this makes any difference
        }
        let rows = [];
        try{
            if ( filter ) {
                DB529.exec( qry, {
                        resultRows: rows,
                        rowMode: 'object',
                        bind: [filter]
                    }
                );
            } else {
                DB529.exec( qry, {
                        resultRows: rows,
                        rowMode: 'object'
                    }
                );
            }
        } catch( e ) {
            conerror( `DB get_matches list: ${e.message}`);
            return( [ ] );
        }
        //console.log( 'DB summary gave: ', rows);
        return rows;
    },

    updateDBSettings: function( data) {
        const update_qry =  "INSERT OR REPLACE INTO settings (setting, value) VALUES (?,?);";
        let rows = [];
        let options = {
            resultRows: rows,
            rowMode: 'array',
            bind: [data.key, data.value]
        };
        try{
            DB529.exec( update_qry, options );
        } catch( e ) {
            conerror( `DB settings: ${e.message}`);
            return false;
        }
        //conlog( 4, 'DB settings gave: ', rows);
        return true;
    },

    migrateAliasmap: function( aliasmap, hashap, useReplace ) {
        const today = formattedDate2();
        let update_qry_part = '';
        if( hashap ) {
            update_qry_part =  `(IDText, name, date, hapMat, hapPat, bYear) VALUES ($k, $name, '${today}', $hapMat, $hapPat, $byear );`;
        } else {
            update_qry_part =  `(IDText, name, date) VALUES ($k, $name, '${today}');`;
        }
        let update_qry = 'INSERT OR ' + (useReplace ? 'REPLACE' : 'IGNORE') + ' INTO idalias' + update_qry_part;
        let rows = [];
        let total_rows_updated = 0;

        try{
            //DB529.exec( 'PRAGMA synchronous=FULL;');
            //DB529.exec( 'PRAGMA journal_mode=DELETE;');
            DB529.exec( 'BEGIN TRANSACTION;');
            for( const[key, obj] of aliasmap ) {

                let ssret = DB529.exec( update_qry, {
                    returnValue: "saveSql",
                    bind: obj
                } );
                
                let rowsaffected = DB529.changes();
                total_rows_updated += rowsaffected; 
            }
            DB529.exec( 'COMMIT TRANSACTION;');
        } catch( e ) {
            conerror( `DB MigAlias: error: ${e.message}`);
            DB529.exec( 'ROLLBACK TRANSACTION;');
            return false;
        }
        conlog( 1, `DB MigAlias: finished; ${total_rows_updated} rows updated` );
        //logHtml( null, 'finished');
        return true;
    },

    migrateSegmentMap: function( segmap, table, useReplace ) {
        //logHtml( null, 'Storing segment pairs ...');
        // const today = formattedDate2();
        const update_qry_part =  ' ( ID1, ID2, chromosome, start, end, cM, snps ) VALUES '+
                        '($id1,$id2, $chromosome,$start, $end, $cM, $snps);';

        const update_qry = 'INSERT OR ' + (useReplace ? 'REPLACE' : 'IGNORE') + ` INTO ${table}` + update_qry_part;
        let total_rows_updated = 0;

        try{
            //DB529.exec( 'PRAGMA synchronous=FULL;');
            //DB529.exec( 'PRAGMA journal_mode=DELETE;');
            DB529.exec( 'BEGIN TRANSACTION;');
            let loopcount = 1;
            for( const[key, obj] of segmap ) {
                let ssret = DB529.exec( update_qry, {
                    returnValue: "saveSql",
                    bind: obj
                } );
                let rowsaffected = DB529.changes();
                total_rows_updated += rowsaffected; 
                if ( ++loopcount % 10000 == 0 ) {
                    DB529.exec( 'COMMIT TRANSACTION;');         
                    DB529.exec( 'BEGIN TRANSACTION;');
                }
            }
            DB529.exec( 'COMMIT TRANSACTION;');
        } catch( e ) {
            conerror( `DB migrateSegMap: error: ${e.message} after ${total_rows_updated} rows`);
            DB529.exec( 'ROLLBACK TRANSACTION;');
            return false;
        }
        conlog( 0, `DB migrateSegMap: finished; ${total_rows_updated} rows updated.` );
        //logHtml( null, 'finished');
        return true;
    },

        /*
        ** this table is of pairs of testers where we have segment data
        */
    migrateMatchMap: function( matmap, matchtype, useReplace ) {
        //logHtml( null, `Storing ${matchtype}  pair summary ...`);
        const today = formattedDate2();
        const update_qry_part =  ' (ID1, ID2, ishidden, pctshared, cMtotal, nsegs, hasSegs, lastdate) '+
                `VALUES ($id1,$id2,$ishidden,$pctshared,$cMtotal,$nsegs, $hasSegs,'${today}');`;
        const update_qry = 'INSERT OR ' + (useReplace ? 'REPLACE' : 'IGNORE') + ' INTO DNAmatches' + update_qry_part;
        let total_rows_updated = 0;

        try{
            DB529.exec( 'BEGIN TRANSACTION;');
            for( const[key, obj] of matmap ) {
                let ssret = DB529.exec( update_qry, {
                    returnValue: "saveSql",
                    bind:obj
                } );
                let rowsaffected = DB529.changes();
                total_rows_updated += rowsaffected; 
                conlog( 4, `DB Migrate${matchtype}: There were ${rowsaffected} rows affected by statement ${ssret}`);
            }
            DB529.exec( 'COMMIT TRANSACTION;');
        } catch( e ) {
            DB529.exec( 'ROLLBACK TRANSACTION;');
            logHtml('error', `DB Migrate${matchtype}: error: ${e.message}`);
            return false;
        }
        conlog( 4, `DB Migrate${matchtype}: finished` );
        //logHtml( null, 'finished');
        return true;
    },

    migrateDNArelatives: function( matmap,  useReplace ) {
        //logHtml( null, `Storing ${matchtype}  pair summary ...`);
        const today = formattedDate2();
        const update_qry_part =  ' (IDprofile, IDrelative, comment, side) VALUES ($id1, $id2, $note, $side );';
        const update_qry = 'INSERT OR ' + (useReplace ? 'REPLACE' : 'IGNORE') + ' INTO DNARelatives' + update_qry_part;
        let total_rows_updated = 0;

        try{
            DB529.exec( 'BEGIN TRANSACTION;');
            for( const[key, obj] of matmap ) {
                let ssret = DB529.exec( update_qry, {
                    returnValue: "saveSql",     //pointless
                    bind:obj
                } );
                let rowsaffected = DB529.changes();
                total_rows_updated += rowsaffected; 
            }
            DB529.exec( 'COMMIT TRANSACTION;');
        } catch( e ) {
            DB529.exec( 'ROLLBACK TRANSACTION;');
            logHtml('error', `DB MigrateDNSrels: error: ${e.message}`);
            return false;
        }
        conlog( 4, `DB MigrateDNSrels: finished` );
        //logHtml( null, 'finished');
        return true;
    },
    
    migrateMatchMapHidden: function( matmap, useReplace ) {
        //logHtml( null, 'Storing  pair summary when one is hidden ...');
        const today = formattedDate2();
        const update_qry_part =  ` (ID1, ID2, ishidden, pctshared, cM, nsegs, hasSegs, lastdate) VALUES (?,?,0,?,?,?,?,'${today}');`;
        let update_qry = 'INSERT OR ' + (useReplace ? 'REPLACE' : 'IGNORE') + ' INTO DNAmatches' + update_qry_part;
        let rows = [];
        let total_rows_updated = 0;
        //conlog( 0,'DB MigrateMatchHidden: skipped 4');
        //return;

        try{
            DB529.exec( 'BEGIN TRANSACTION;');
            for( const[key, obj] of matmap ) {
                conlog( 4, `DB MigrateMatchHidden:  insert key ${key}, name ${obj.name}`);
                let ssret = DB529.exec( update_qry, {
                    returnValue: "saveSql",
                    bind:[obj.id1, obj.id2, obj.ishidden ,obj.start ,obj.end ,obj.cM , obj.snps]
                } );
                let rowsaffected = DB529.changes();
                total_rows_updated += rowsaffected; 
                conlog( 4, `DB MigrateMatchHidden: There were ${rowsaffected} rows affected by statement ${ssret}`);
            }
            DB529.exec( 'COMMIT TRANSACTION;');
        } catch( e ) {
            DB529.exec( 'ROLLBACK TRANSACTION;');
            logHtml( 'error', `DB MigrateMatchHidden: error: ${e.message}`);
            return false;
        }
        conlog( 4, 'DB MigrateMatchHidden: finished' );
        //logHtml( null, 'finished');
        return true;
    },

    insertProfiles: function( profilemap ) {
        logHtml( null, 'Storing  profile (kit) IDs ...');
        const today = formattedDate2();
        const update_qry =  `INSERT OR REPLACE INTO profiles (IDProfile, pname) VALUES (?,?);`;
        let total_rows_updated = 0;
        //conlog( 0,'DB MigrateMatchHidden: skipped 4');
        //return;

        try{
            DB529.exec( 'BEGIN TRANSACTION;');
            for( const[key, obj] of profilemap ) {
                conlog( 4, `DB ProfileTable:  insert key ${key}, name ${obj.name}`);
                let ssret = DB529.exec( update_qry, {
                    returnValue: "saveSql",
                    bind:[key, obj.name]
                } );
                let rowsaffected = DB529.changes();
                total_rows_updated += rowsaffected; 
                conlog( 4, `DB ProfileTable: There were ${rowsaffected} rows affected`);
            }
            DB529.exec( 'COMMIT TRANSACTION;');
        } catch( e ) {
            DB529.exec( 'ROLLBACK TRANSACTION;');
            logHtml( 'error', `DB ProfileTable: error: ${e.message}`);
            return false;
        }
        conlog( 1, 'DB ProfileTable: finished' );
        //logHtml( null, 'finished');
        return true;
    },

    identify_icw: function() {
        logHtml( '' , 'Looking for 3-way segment overlaps.');
        const profiles = DBwasm.get_profile_list();
        const matchList = DBwasm.get_DNAmatch_list();
        if ( matchList.length < 1) {
            alert( 'no matches found');
            return;
        }
        const icwmap = new Map();       // 3-way overlap
        const icwmap2 = new Map();      // 2-way overlap only
        const icwxrefmap = new Map();
        const matchmap = new Map();
        for( let i = 0 ; i < matchList.length ; i++ ) {
            const nr = matchList[i];
            let key = nr.ID1 + "_" + nr.ID2;
            matchmap.set( key, nr );
        }
        let sumICW = {'unknown': 0, 'hidden':0, 'no_overlap':0, 'triang':0, 'twoway':0 };

        for( let p = 0 ; p < profiles.length; p++ ) {
        //let p=0; {
            pr = profiles[p];
            P1id = pr.IDprofile;
            logHtml( '' , `Looking for segment overlaps for ${pr.pname}`);
            const skiplist = [];
            for( let pp = 0 ; pp < p; pp++) {
                skiplist[pp] = profiles[pp].IDprofile
            }

            const relList = DBwasm.get_DNArel_list( P1id );
            const rlsize = relList.length;
            const maxChecks = 0.5 * rlsize * ( rlsize - 1);
            const checkInterval = Math.floor(maxChecks/10);
            let checksdone = 0;
            // We need an inner loop descending from one below the outer element, so a numerical index is easiest to handle
            for( let i = 0; i < rlsize; i++ ) {
                let M2obj = relList[i];
                let M2id = M2obj.IDrelative;
                if( skiplist.indexOf( M2id ) >= 0 ) {
                    continue;
                }
                for ( j = i+1; j < rlsize; j++ ) {
                    if ( (checksdone++) % checkInterval === 1) {
                        let msg = `  ${Math.floor(0.2+100*checksdone/maxChecks)} pct done`;
                        logHtml( '', msg );
                        conlog( 1, msg + ` ${i}/${rlsize} - ${checksdone}/ ${maxChecks}` );
                    }
                    let M3obj = relList[j];
                    let M3id = M3obj.IDrelative;
                    if( skiplist.indexOf( M3id ) >= 0 ) {
                        conlog( 4, `skipping inner repeat profile ${M3id}, j = ${j}`);
                        continue;
                    }
                    // relList is sorted, so M3 is always ID3 in relation to M2 in the matches table.
                    let key3 = M2id + "_" + M3id;
                    // we already know M1 and M2 match the profile person, so existence of a some sort of M1-M2 match proves 3-way ICW.
                    if ( ! matchmap.has( key3 ) )
                        continue;
                    const P1M1 = DBwasm.get_match_2way( matchmap, P1id, M2id );
                    const P1M2 = DBwasm.get_match_2way( matchmap, P1id, M3id );
                    const M1M2 = matchmap.get( key3 );
                    let icwkey = P1id + "_" + M2id + "_" + M3id;
                    if ( P1M1.ishidden != 0 ||  P1M2.ishidden != 0 ||  M1M2.ishidden != 0 ) {
                        // ignore if any are hidden.
                        sumICW.hidden++;
                    } else if ( P1M1.hasSegs == 0 ||  P1M2.hasSegs == 0 ||  M1M2.hasSegs == 0 ) {
                            // is ICW, but we cannot tell how - this key is good enough for this pass, but not enough for the entire db
                            if ( P1M1.hasSegs != 0 &&  P1M2.hasSegs != 0 ) {
                                // we can do a 2-way check.
                                const overlaps = DBwasm.get_icw_overlaps( P1id, M2id, M3id, false );
                                DBwasm.saveOverlaps_2way(overlaps[0], icwmap2, icwkey, sumICW, P1id, M2id, M3id  );
                            }
                            icwmap.set( icwkey, {$IDp:P1id, $ID2:M2id, $ID3:M3id, $chr: -1, $st: 0, $end: 0} );
                            sumICW.unknown++;
                    } else {

                        // we have icw - the question now is, is there any overlap == triangulation
                        const overlaps = DBwasm.get_icw_overlaps( P1id, M2id, M3id, true );
                        if ( overlaps[1].length === 0 ) {
                            icwmap.set( icwkey, {$IDp:P1id, $ID2:M2id, $ID3:M3id, $chr: 0, $st: 0, $end: 0} );      // we know there is zero full overlap
                            if ( overlaps[0].length > 0){
                                DBwasm.saveOverlaps_2way(overlaps[0], icwmap2, icwkey, sumICW, P1id, M2id, M3id  );
                            } else {
                                sumICW.no_overlap++;
                            }
                        } else {
                            // I'm not sure we need this, rather than just rescan icwmap.
                            icwxrefmap.set( icwkey, {$IDp:P1id, $ID2:M2id, $ID3:M3id, $chr:overlaps[0].chr, $st:overlaps[0].startolap, $end:overlaps[0].endolap}) ;
                            sumICW.triang++;
                            for( let r = 0 ; r < overlaps.length; r++) {
                                let ol = overlaps[r];
                                icwmap.set( icwkey + "_" + r.toString(),
                                                {$IDp:P1id, $ID2:M2id, $ID3:M3id, $chr:ol.chr, $st:ol.startolap, $end:ol.endolap} );
                            }
                        }
                    }
                }
            }
        }
        DBwasm.insertICW( icwmap, 'ICWSets' );
        DBwasm.insertICW( icwmap2, 'ICWSets2way' );
        console.log( 'ICW scan complete:', sumICW );
        return sumICW;
    },

    saveOverlaps_2way: function( overlap_arr, icwmap2, icwkey, sumICW, P1id, M2id, M3id ) {
        if ( overlap_arr.length === 0 )
            return;

        for( let r = 0 ; r < overlap_arr.length; r++) {
            sumICW.twoway++;
            let ol = overlap_arr[r];
            icwmap2.set( icwkey + "_" + r.toString(),
                        {$IDp:P1id, $ID2:M2id, $ID3:M3id, $chr:ol.chr, $st:ol.startolap, $end:ol.endolap} );
        }
    },

    get_match_2way: function( matchmap, id1, id2 ) {
        // return the match list object that corresponds to id1-id2
        let m1 = id1;
        let m2 = id2;
        if ( id2 < id1 ){
            m1 = id2;
            m2 = id1
        }
        let key = m1 + "_" + m2;
        return matchmap.get( key );
    },

    get_icw_overlaps: function( P1id, M2id, M3id, find_3way ) {
        // created a sorted list (we know M1 and M2 are already in order)
        let olist = [];
        if ( P1id < M2id ){
            olist[0] = P1id;
            olist[1] = M2id;
            olist[2] = M3id;
        } else {
            olist[0] = M2id;            
            if( P1id < M3id ) {
                olist[1] = P1id;
                olist[2] = M3id;
            } else {
                olist[1] = M3id;
                olist[2] = P1id;
            }
        }
        let rows2 = [];
        let rows3 = [];
        // a giant join is just too complicated for me to understand - if it is even possible.  Just split into 3x two-way matches and compare.
        try {
            DB529.exec( 'DROP TABLE IF EXISTS wab;DROP TABLE IF EXISTS wac;DROP TABLE IF EXISTS wbc;DROP TABLE IF EXISTS ww;', {} );
            DB529.exec( 'CREATE temporary table wab as SELECT * from ibdsegs where id1 = ? and id2 = ?;', {bind:[olist[0], olist[1]]} );
            DB529.exec( 'CREATE temporary table wac as SELECT * from ibdsegs where id1 = ? and id2 = ?;', {bind:[olist[0], olist[2]]} );
            DB529.exec( 'CREATE temporary table ww as SELECT wab.chromosome as chr, \
                    case when wab.start < wac.start then wac.start else wab.start end as startolap, \
                    case when wab.end < wac.end then wab.end else wac.end end as endolap \
                FROM wab JOIN wac ON wab.chromosome = wac.chromosome \
                        AND (wab.start between wac.start and wac.end or wac.start between wab.start and wab.end);');
            DB529.exec( 'SELECT * from ww;', { resultRows: rows2, rowMode: 'object' } );
            if ( find_3way ) {
                DB529.exec( 'CREATE temporary table wbc as SELECT * from ibdsegs where id1 = ? and id2 = ?;', {bind:[olist[1], olist[2]]} );
                DB529.exec( 'SELECT ww.chr as chr,  case when ww.startolap < wbc.start then wbc.start else ww.startolap end as startolap,\
                                        case when ww.endolap < wbc.end then ww.endolap else wbc.end end as endolap \
                    FROM ww JOIN wbc ON chr = wbc.chromosome \
                            AND (wbc.start between ww.startolap and ww.endolap or wbc.start between ww.startolap and ww.endolap)',
                    { resultRows: rows3, rowMode: 'object' } );     
            }    
            /*
            // this does the 3-way triang in one hit.
            DB529.exec( 'SELECT ww.chr as chr,  case when ww.startolap < wbc.start then wbc.start else ww.startolap end as startolap,\
                                    case when ww.endolap < wbc.end then ww.endolap else wbc.end end as endolap \
                FROM \
                    ( SELECT wab.chromosome as chr,  case when wab.start < wac.start then wac.start else wab.start end as startolap, \
                                                     case when wab.end < wac.end then wab.end else wac.end end as endolap \
                    FROM wab JOIN wac ON wab.chromosome = wac.chromosome AND (wab.start between wac.start and wac.end or wac.start between wab.start and wab.end) \
                    ) as ww \
                    JOIN wbc ON chr = wbc.chromosome AND (wbc.start between ww.startolap and ww.endolap or wbc.start between ww.startolap and ww.endolap)',
                 { resultRows: rows3, rowMode: 'object' } );
                 */

        } catch( e ) {
            logHtml( 'error', `Find triangulation failed with ${e.message}, for ${olist[0]},  ${olist[1]},  ${olist[2]}`);
            return [[], []];
        }
        return [rows2, rows3];
    },

    insertICW: function( icwmap, tablename ) {
        //logHtml( null, `Storing ${matchtype}  pair summary ...`);
        const today = formattedDate2();
        const update_qry = `INSERT OR IGNORE INTO ${tablename} (IDprofile, ID2, ID3, chromosome, start, end) VALUES ($IDp, $ID2, $ID3, $chr, $st, $end );`;
        let total_rows_updated = 0;

        try{
            DB529.exec( 'BEGIN TRANSACTION;');
            let loopcount = 1;
            for( const[key, obj] of icwmap ) {
                let ssret = DB529.exec( update_qry, {
                    returnValue: "saveSql",     //pointless
                    bind:obj
                } );
                let rowsaffected = DB529.changes();
                total_rows_updated += rowsaffected; 
                if ( ++loopcount % 10000 == 0 ) {
                    DB529.exec( 'COMMIT TRANSACTION;');         
                    DB529.exec( 'BEGIN TRANSACTION;');
                }
            }
            DB529.exec( 'COMMIT TRANSACTION;');
        } catch( e ) {
            DB529.exec( 'ROLLBACK TRANSACTION;');
            let msg = `DB insertICW ${tablename}: error: ${e.message}`;
            conerror( msg );
            logHtml('error', msg );
            return false;
        }
        conlog( 4, `DB insertICW ${tablename}: finished` );
        if ( tablename === 'ICWSets2way') {
            // do not update dates, since have not verified 3 way ICW has been checked.
            return;
        }

        let total_date_rows_updated = 0;
        const update_date1 = `UPDATE  DNArelatives set ICWScanned = 1, dateScanned = $today where` +
                ' IDprofile = $IDp and (IDrelative = $ID2 OR IDrelative = $ID3);';
        try{
            DB529.exec( 'BEGIN TRANSACTION;');
            let loopcount = 1;
            for( const[key, o] of icwmap ) {
                DB529.exec( update_date1, { bind:{$today:today, $IDp:o.$IDp, $ID2:o.$ID2, $ID3:o.$ID3 } });
                total_date_rows_updated += 2;        // lets just guess

                if ( ++loopcount % 10000 == 0 ) {
                    DB529.exec( 'COMMIT TRANSACTION;');         
                    DB529.exec( 'BEGIN TRANSACTION;');
                }
            }
            DB529.exec( 'COMMIT TRANSACTION;');
        } catch( e ) {
            DB529.exec( 'ROLLBACK TRANSACTION;');
            let msg = `DB updateICW ${tablename}: error: ${e.message}`;
            conerror( msg );
            logHtml('error', msg );
            return false;
        }
        return true;
    },
    
}