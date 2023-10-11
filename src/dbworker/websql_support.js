/* define it as an object to isolate namespaces for different DB types.
** interim code to be removed soon
*/


console.log( 'dbcode loaded');

var DBwebSQL = {

   
    migrateAliasWebSQL: function( aliasmap, hashap, useReplace ) {
        // this version is different, because 'aliasmap' is  a Map, not an SqlResultSet - but initially I tried sqlresultset
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
            DB529.exec( 'BEGIN TRANSACTION;');
            for( const[key, obj] of aliasmap ) {
                let ssret = DB529.exec( update_qry, {
                    returnValue: "saveSql",
                    bind: {$k: obj.k, $name:obj.name }
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


    migrateFULLSegmentWebSQL: function( segmap ) {
        logHtml( null, 'Storing FULLIDB segment pairs ...');
        // const today = formattedDate2();
        const update_qry_part =  ' ( ID1, ID2, chromosome, start, end, cM, snps ) VALUES (?,?,?,?,?,?,?);';
        const update_qry = 'INSERT OR IGNORE INTO ibdsegsFull ' + update_qry_part;

        let total_rows_updated = 0;

        try{
            //DB529.exec( 'PRAGMA synchronous=FULL;');
            //DB529.exec( 'PRAGMA journal_mode=DELETE;');
            DB529.exec( 'BEGIN TRANSACTION;');
            let loopcount = 1;
            for( const[key, o] of segmap ) {
                let ssret = DB529.exec( update_qry, {
                    returnValue: "saveSql",
                    bind: [o.id1, o.id2, o.chromosome, o.start, o.end, o.cM, o.snps]
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
        let msg = `DB migrateSegMap: finished; ${total_rows_updated} rows updated.`;
        conlog( 0, msg );
        logHtml( null, msg);
        return true;
    },

    migrateSegmentWebSQL: function( segmap ) {
        logHtml( null, 'Storing other segment pairs (this may take a while)...');
        // const today = formattedDate2();
        const update_qry_part =  ' ( ID1, ID2, chromosome, start, end, cM, snps ) VALUES (?,?,?,?,?,?,?);';

        const update_qry = 'INSERT OR IGNORE INTO ibdsegs' + update_qry_part;
        let total_rows_updated = 0;

        try{
            //DB529.exec( 'PRAGMA synchronous=FULL;');
            //DB529.exec( 'PRAGMA journal_mode=DELETE;');
            DB529.exec( 'BEGIN TRANSACTION;');
            let loopcount = 1;
            for( const[key, o] of segmap ) {
                let ssret = DB529.exec( update_qry, {
                    returnValue: "saveSql",
                    bind: [o.id1, o.id2, o.chromosome, o.start, o.end, o.cM, o.snps]
                } );
                let rowsaffected = DB529.changes();
                total_rows_updated += rowsaffected; 
                if ( ++loopcount % 10000 == 0 ) {
                    DB529.exec( 'COMMIT TRANSACTION;'); 
                    logHtml( '', `Row ${loopcount}`);        
                    DB529.exec( 'BEGIN TRANSACTION;');
                }
            }
            DB529.exec( 'COMMIT TRANSACTION;');
        } catch( e ) {
            conerror( `DB migrateSegMap: error: ${e.message} after ${total_rows_updated} rows`);
            DB529.exec( 'ROLLBACK TRANSACTION;');
            return false;
        }
        let msg = `DB migrate WebSQLSegMap: finished; ${total_rows_updated} rows updated. Now checking for any relative updates`;
        conlog( 0, msg );
        logHtml( null, msg);
        // now update any DNA relatives that not in the list already (typically those with too short a match
        // to be in the top 1500)
        total_rows_updated = 0;
        try {
            DB529.exec( 'BEGIN TRANSACTION;');
            // ID1 and ID2 will always be in sort order, but the DNArelatives table always has profile ID first, the
            // temporary table is the only way I can see to swap them in-place if necessary.
            let qry1 = 'drop table if exists temprelmin;';
            let qry2 = 'create temporary table temprelmin as select ID1, ID2, min(chromosome) as chr, cM, end, snps from ibdsegs \
                WHERE chromosome < 50 AND (ID1 in (select IDprofile from profiles) OR  ID2 in (select IDprofile from profiles) ) \
                GROUP BY ID1, ID2 ;';
            let qry3 = 'UPDATE temprelmin set ID1 = ID2, ID2 = ID1 where id1 not in (select IDprofile from profiles);';
            let qry4 = 'INSERT OR IGNORE into DNArelatives (IDprofile, IDrelative)  SELECT ID1, ID2  from temprelmin;';
            let qry5 = 'drop table if exists temprelmin;';
            let update_qry = qry1 + qry2 + qry3 + qry4 + qry5;

            DB529.exec( update_qry );
            total_rows_updated = DB529.changes();
            DB529.exec( 'COMMIT TRANSACTION;');
        } catch( e ) {
            conerror( `DB migrateSegMapWebSQL DNArelatives: error: ${e.message}`);
            DB529.exec( 'ROLLBACK TRANSACTION;');
            return false;
        }
        let abb = 3;
        msg = `DB update DNArelatives WebSQL: finished; ${total_rows_updated} rows updated. Now checking for any segment summary updates`;
        conlog( 0, msg );
        logHtml( null, msg);
        // finally, add new entries to the DNAmatches summary table - this replaces the old "chromosome 100" hack
        total_rows_updated = 0;
        try {
            DB529.exec( 'BEGIN TRANSACTION;');
            // ID1 and ID2 will always be in sort order, 
            let qry1 = 'INSERT or IGNORE into DNAmatches  select \
                ID1, ID2, 0 as ishidden, 0.01*floor(sum(cM)/0.744) as pctshared, \
                sum(cM) as cMtotal, count(*) as nsegs, 1 as hasSegs, null as lastdate from ibdsegs \
                GROUP BY ID1, ID2;';

            DB529.exec( qry1 );
            total_rows_updated = DB529.changes();
            DB529.exec( 'COMMIT TRANSACTION;');
        } catch( e ) {
            conerror( `DB migrateSegMapWebSQL DNAmatches update: error: ${e.message}`);
            DB529.exec( 'ROLLBACK TRANSACTION;');
            return false;
        }
        msg = `DB update DNAmatches WebSQL: finished; ${total_rows_updated} rows updated.`;
        conlog( 0, msg );
        logHtml( null, msg);

        return true;
    },

    // two parts - two arguments passed - first is update for DNArels and the 2nd for matches summary tables
    migrateChr200WebSQL: function( maprel, mapmat ) {
        logHtml( null, 'Storing hidden match summaries ...');
        // const today = formattedDate2();
        const update_qry = 'INSERT OR IGNORE INTO DNArelatives (IDprofile, IDrelative ) VALUES (?,?);';

        let total_rows_updated = 0;

        try{
            DB529.exec( 'BEGIN TRANSACTION;');
            let loopcount = 1;
            for( const[key, o] of maprel ) {
                DB529.exec( update_qry, {
                    bind: [o.id1, o.id2 ]
                } );
                let rowsaffected = DB529.changes();
                total_rows_updated += rowsaffected; 
                if ( ++loopcount % 10000 == 0 ) {
                    DB529.exec( 'COMMIT TRANSACTION;'); 
                    logHtml( '', `Row ${loopcount}`);        
                    DB529.exec( 'BEGIN TRANSACTION;');
                }
            }
            DB529.exec( 'COMMIT TRANSACTION;');
        } catch( e ) {
            DB529.exec( 'ROLLBACK TRANSACTION;');
            conerror( `DB migrate hidden rels: error: ${e.message} after ${total_rows_updated} rows`);
            return false;
        }
        msg = `DB update hidden DNArelatives WebSQL: finished; ${total_rows_updated} rows updated. Now checking for any segment summary updates`;
        conlog( 0, msg );
        logHtml( null, msg);
        // finally, add new entries to the DNAmatches summary table - this replaces the old "chromosome 200" hack
        total_rows_updated = 0;
        try {
            DB529.exec( 'BEGIN TRANSACTION;');
            // ID1 and ID2 will always be in sort order, 
            let qry1 = 'INSERT or IGNORE into DNAmatches (ID1, ID2, ishidden, pctshared, cMtotal, hasSegs) VALUES (?,?,?,?,?,?);';

            let loopcount = 1;
            for( const[key, o] of mapmat ) {
                let ssret = DB529.exec( qry1, {
                    returnValue: "saveSql",
                    bind: [o.id1, o.id2, o.hidden, o.pctshared, o.cMtotal, o.hasSegs ]
                } );
                let rowsaffected = DB529.changes();
                total_rows_updated += rowsaffected; 
                if ( ++loopcount % 10000 == 0 ) {
                    DB529.exec( 'COMMIT TRANSACTION;'); 
                    logHtml( '', `Row ${loopcount}`);        
                    DB529.exec( 'BEGIN TRANSACTION;');
                }
            }
            DB529.exec( 'COMMIT TRANSACTION;');
        } catch( e ) {
            DB529.exec( 'ROLLBACK TRANSACTION;');
            conerror( `DB migrateChr200WebSQL DNAmatches update: error: ${e.message}`);
            return false;
        }
        msg = `DB update hidden DNAmatches WebSQL: finished; ${total_rows_updated} rows updated.`;
        conlog( 0, msg );
        logHtml( null, msg);

        return true;
    },

 
    
}