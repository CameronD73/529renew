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

            'DNARelatives ( IDprofile TEXT, IDrelative TEXT NOT NULL REFERENCES idalias(idText) DEFERRABLE INITIALLY DEFERRED, ICWscanned INTEGER DEFAULT null, dateScanned TEXT DEFAULT null, side TEXT DEFAULT null, comment TEXT DEFAULT null, PRIMARY KEY(IDprofile,IDrelative) )',

            'DNAmatches  ( ID1 TEXT  NOT NULL REFERENCES idalias(idText) DEFERRABLE INITIALLY DEFERRED, ID2 TEXT NOT NULL REFERENCES idalias(idText) DEFERRABLE INITIALLY DEFERRED, ishidden INTEGER DEFAULT 0, pctshared REAL, cMtotal REAL, nsegs INTEGER DEFAULT null, hasSegs INTEGER DEFAULT 0, lastdate TEXT DEFAULT null, PRIMARY KEY(ID1,ID2,ishidden) )',

            'ibdsegs(ID1 TEXT NOT NULL REFERENCES idalias(idText) DEFERRABLE INITIALLY DEFERRED, ID2 TEXT NOT NULL REFERENCES idalias(idText) DEFERRABLE INITIALLY DEFERRED, chromosome INTEGER NOT NULL, start INTEGER NOT NULL, end INTEGER NOT NULL, cM REAL NOT NULL, snps INTEGER NOT NULL)',


            'ibdsegsFull(ID1 TEXT NOT NULL REFERENCES idalias(idText) DEFERRABLE INITIALLY DEFERRED, ID2 TEXT NOT NULL REFERENCES idalias(idText) DEFERRABLE INITIALLY DEFERRED, chromosome INTEGER NOT NULL, start INTEGER NOT NULL, end INTEGER NOT NULL, cM REAL NOT NULL, snps INTEGER NOT NULL)',

            'ICWSets (IDprofile TEXT NOT NULL,ID2 TEXT NOT NULL REFERENCES idalias(idText) DEFERRABLE INITIALLY DEFERRED, ID3 TEXT NOT NULL REFERENCES idalias(idText) DEFERRABLE INITIALLY DEFERRED, overlap INTEGER DEFAULT NULL, chromosome INTEGER NOT NULL, start INTEGER NOT NULL, end INTEGER NOT NULL)',
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
            'icwset_id3 ON ICWSets ( ID3 )'
        ];
        const indexDefsUnique = [
            'ibdsegs_kitchen_sink ON ibdsegs ( ID1, ID2, chromosome, start )',
            'ibdsegsFull_kitchen_sink ON ibdsegsFull ( ID1, ID2, chromosome, start )',
            'xref_icw ON ICWSegXref ( ICWset_row, segment_row )'
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
            UNION SELECT \'ICWSets\' as tbl, count(*) as nrows from ICWSets \
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
            //rowMode: 'array'
            rowMode: 'object'
        };
        try{
            DB529.exec( sqlcode, options );
        } catch( e ) {
            conerror( `DB get_profile_list: ${e.message}`);
            return( [ ] );
        }
        //conlog( 4, 'DB profile list gave: ', rows);
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
            update_qry_part =  `(idText, name, date, hapMat, hapPat, bYear) VALUES ($k, $name, '${today}', $hapMat, $hapPat, $byear );`;
        } else {
            update_qry_part =  `(idText, name, date) VALUES ($k, $name, '${today}');`;
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
                //conlog( 4, `DB MigAlias: There were ${rowsaffected} rows affected by statement ${sqlstmt}, returned ${ssret}`);
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
                sqlstmt = [];
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
            conerror( `DB migrateSegMap: error: ${e.message} after ${total_rows_updated} rows, with stmt ${sqlstmt}`);
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
                conlog( 4, `DB Migrate${matchtype}: There were ${rowsaffected} rows affected by statement ${sqlstmt}, returned ${ssret}`);
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
                //conlog( 1, `DB MigrateDNSrels: There were ${rowsaffected} rows affected by statement ${sqlstmt}, returned ${ssret}`);
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
                conlog( 4, `DB MigrateMatchHidden: There were ${rowsaffected} rows affected by statement ${sqlstmt}, retuurned ${ssret}`);
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
    
}