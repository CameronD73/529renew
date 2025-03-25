/*
** define it as an object to isolate namespaces for different DB types.
** Contents of this file relate to creating and updating the sqlite DB
*/

var DBwasmInit = {

    DB_Version: 5,

    /*
    ** these are the table definitions for building a new database
    ** (Or updating an older one)
    */
    gTableDefs: [
        {   tb:'DBVersion',
            version_last_modified: 2,
            cols:  'version INTEGER, \
                    date TEXT, \
                    PRIMARY KEY( version)'
        },{
            tb:'profiles',
            version_last_modified: 2,
           cols:'IDprofile TEXT, \
                pname TEXT NOT NULL UNIQUE, \
                PRIMARY KEY(IDprofile)'
        },{
            tb:'settings',
            version_last_modified: 2,
            cols:'setting TEXT NOT NULL UNIQUE, \
                value TEXT, \
                PRIMARY KEY(setting)'
        },{
            tb:'idalias',
            version_last_modified: 5,
            cols:'IDText TEXT NOT NULL PRIMARY KEY, \
                name TEXT NOT NULL, \
                date TEXT NOT NULL, \
                hapMat TEXT DEFAULT null, \
                hapPat TEXT DEFAULT null, \
                bYear INTEGER DEFAULT null, \
                sex TEXT DEFAULT null, \
                familySurnames TEXT DEFAULT NULL, \
                familyLocations TEXT DEFAULT NULL, \
                familyTreeURL TEXT DEFAULT NULL, \
                lastUpdated TEXT DEFAULT CURRENT_DATE',
        },{
            tb:'DNARelatives',
            version_last_modified: 5,
            cols:'IDprofile TEXT, \
                IDrelative TEXT NOT NULL REFERENCES idalias(IDText) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED, \
                ICWscanned INTEGER DEFAULT null, \
                dateScanned TEXT DEFAULT CURRENT_DATE, \
                side TEXT DEFAULT null, \
                comment TEXT DEFAULT null, \
                knownRel  TEXT DEFAULT null, \
                lastUpdated TEXT DEFAULT CURRENT_DATE, \
                PRIMARY KEY(IDprofile,IDrelative)',
        },{
            tb:'DNAmatches',
            version_last_modified: 5,
            cols:'ID1 TEXT  NOT NULL REFERENCES idalias(IDText) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED, \
                ID2 TEXT NOT NULL REFERENCES idalias(IDText) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED, \
                ishidden INTEGER DEFAULT 0, \
                pctshared REAL, \
                cMtotal REAL, \
                nsegs INTEGER DEFAULT null, \
                hasSegs INTEGER DEFAULT 0, \
                lastUpdated TEXT DEFAULT CURRENT_DATE, \
                largestSeg REAL NOT NULL DEFAULT 0.0, \
                predictedRelOld  TEXT DEFAULT null, \
                predictedRel  TEXT DEFAULT null, \
                PRIMARY KEY(ID1,ID2,ishidden)',
        },{
            tb:'ibdsegs',
            version_last_modified: 5,
            cols:'ID1 TEXT NOT NULL REFERENCES idalias(IDText) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED, \
                ID2 TEXT NOT NULL REFERENCES idalias(IDText) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED, \
                chromosome INTEGER NOT NULL, \
                start INTEGER NOT NULL, \
                end INTEGER NOT NULL, \
                cM REAL NOT NULL, \
                snps INTEGER NOT NULL',
        },{
            tb:'ibdsegsFull',
            version_last_modified: 5,
            cols:'ID1 TEXT NOT NULL REFERENCES idalias(IDText) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED, \
                ID2 TEXT NOT NULL REFERENCES idalias(IDText) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED, \
                chromosome INTEGER NOT NULL, \
                start INTEGER NOT NULL, \
                end INTEGER NOT NULL, \
                cM REAL NOT NULL, \
                snps INTEGER NOT NULL',
        },{
            tb:'ICWSets',
            version_last_modified: 5,
            cols:'IDprofile TEXT NOT NULL, \
                ID2 TEXT NOT NULL REFERENCES idalias(IDText) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED, \
                ID3 TEXT NOT NULL REFERENCES idalias(IDText) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED, \
                chromosome INTEGER NOT NULL, \
                start INTEGER NOT NULL, \
                end INTEGER NOT NULL',
        },{
            tb:'ICWSets2way',
            version_last_modified: 5,
            cols:'IDprofile TEXT NOT NULL, \
                ID2 TEXT NOT NULL REFERENCES idalias(IDText) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED, \
                ID3 TEXT NOT NULL REFERENCES idalias(IDText) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED, \
                chromosome INTEGER NOT NULL, \
                start INTEGER NOT NULL, \
                end INTEGER NOT NULL',
        },{
            tb:'ICWSegXref',
            version_last_modified: 2,
            cols:'ICWset_row INTEGER NOT NULL, \
                segment_row INTEGER NOT NULL',
        },{
            tb:'messages',
            version_last_modified: 3,
            cols:'IDmsg TEXT NOT NULL, \
                IDsender TEXT DEFAULT NULL, \
                IDrec TEXT DEFAULT NULL, \
                content TEXT DEFAULT NULL, \
                entireJSON TEXT DEFAULT NULL, \
                PRIMARY KEY(IDmsg)'
        }
    ],

    /*
    ** this is a list of components to construct extra non-unique indexes
    */
    indexDefs: [
        {
            tb:'idalias',
            indexname:'idalias_name',
            version_last_modified: 5,       // tables rather than indexes modified, but indexes need rebuilding.
            cols:' name',
        },{
            tb:'ibdsegs',
            indexname:'ibdsegs_id1',
            version_last_modified: 5,
            cols:' ID1',
        },{
            tb:'ibdsegs',
            indexname:'ibdsegs_id2',
            version_last_modified: 5,
            cols:' ID2',
        },{
            tb:'ibdsegs',
            indexname:'ibssegs_chromosomes',
            version_last_modified: 5,
            cols:' chromosome',
        },{
            tb:'ICWSegXref',
            indexname:'xref_icw',
            version_last_modified: 2,
            cols:' ICWset_row',
        },{
            tb:'ICWSets',
            indexname:'icwset_idp',
            version_last_modified: 5,
            cols:' IDprofile',
        },{
            tb:'ICWSets',
            indexname:'icwset_id2',
            version_last_modified: 5,
            cols:' ID2',
        },{
            tb:'ICWSets',
            indexname:'icwset_id3',
            version_last_modified: 5,
            cols:' ID3',
        },{
            tb:'ICWSets2way',
            indexname:'icwset2_idp',
            version_last_modified: 5,
            cols:' IDprofile',
        },{
            tb:'ICWSets2way',
            indexname:'icwset2_id2',
            version_last_modified: 5,
            cols:' ID2',
        },{
            tb:'ICWSets2way',
            indexname:'icwset2_id3',
            version_last_modified: 5,
            cols:' ID3',
        },{
            tb:'messages',
            indexname:'msgsender',
            version_last_modified: 2,
            cols:'IDsender',
        },{
            tb:'messages',
            indexname:'msgrecipient',
            version_last_modified: 2,
            cols:'IDrec'
        },
    ],

    /*
    ** this is a list of components to construct extra unique indexes apart form the primary key
    */
    indexDefsUnique: [
        {
            tb:'ibdsegs',
            indexname:'ibdsegs_kitchen_sink',
            version_last_modified: 5,       // tables rather than indexes modified, but indexes need rebuilding.
            cols:' ID1, ID2, chromosome, start',
        },{
            tb:'ibdsegsFull',
            indexname:'ibdsegsFull_kitchen_sink',
            version_last_modified: 5,
            cols:' ID1, ID2, chromosome, start',
        },{
            tb:'ICWSegXref',
            indexname:'xref_icw',
            version_last_modified: 2,
            cols:' ICWset_row, segment_row',
        },{
            tb:'ICWSets',
            indexname:'ICW_kitchen_sink',
            version_last_modified: 5,
            cols:' IDprofile, ID2, ID3, chromosome, start',
        },{
            tb:'ICWSets2way',
            indexname:'ICW2_kitchen_sink',
            version_last_modified: 5,
            cols:' IDprofile, ID2, ID3, chromosome, start',
        },
    ],

    /*
    ** this is a list of components to construct trigger statements to update
    ** the row date when contents have been changed.
    */
    updateTriggers: [
        {
            name: 'bumpDate_idalias',
            tb:  'idalias',
            version_last_modified: 5,
            action: 'UPDATE idalias SET lastUpdated = CURRENT_DATE WHERE _rowid_ = new._rowid_;',
        },
        {
            name: 'bumpDate_relatives',
            tb:  'DNARelatives',
            version_last_modified: 5,
            action: 'UPDATE DNARelatives SET lastUpdated = CURRENT_DATE WHERE _rowid_ = new._rowid_;',
        },
        {
            name: 'bumpDate_matches',
            tb:  'DNAMatches',
            version_last_modified: 5,
            action: 'UPDATE DNAmatches SET lastUpdated = CURRENT_DATE WHERE _rowid_ = new._rowid_;',
        },
    ],

    /*
    ** define tables in the sqlite database.
    ** To avoid messing around with possible changes I might desire in the future, I am throwing in 
    ** everything I think I might need.
    ** This is rather more extensive than the V1.2 structure in the WebSQL version
    ** The Table organisation is described to some extent in the GitHub Wiki.
    */
    create_db_tables: function() {

        try {
            for( let tdef of DBwasmInit.gTableDefs ) {
                let instruction = 'CREATE TABLE IF NOT EXISTS ' + tdef.tb + '(' + tdef.cols + ');';
                console.log( 'creating table using '+ instruction);
                r = DB529.exec( {
                    sql: instruction,
                    returnValue: "resultRows"
                } );
                // console.log( 'create tbl returned ', r );
            }
            for( let idef of DBwasmInit.indexDefs ) {
                let instruction = 'CREATE INDEX IF NOT EXISTS ' +
                    idef.indexname + ' ON ' + idef.tb + '(' + idef.cols + ');';
                console.log( 'creating INDEX using '+ instruction);
                DB529.exec( {
                    sql: instruction,
                    returnValue: "resultRows"
                } );
            }
            for( let idef of DBwasmInit.indexDefsUnique ) {
                let instruction = 'CREATE UNIQUE INDEX IF NOT EXISTS ' + 
                    idef.indexname + ' ON ' + idef.tb + '(' + idef.cols + ');';
                console.log( 'creating uindex using '+ instruction);
                DB529.exec( {
                    sql: instruction,
                    returnValue: "resultRows"
                } );
            }
            for( let tdef of DBwasmInit.updateTriggers ) {
                let instruction = 'CREATE TRIGGER IF NOT EXISTS ' + 
                    tdef.name + ' AFTER UPDATE ON ' + tdef.tb + ' FOR EACH ROW BEGIN ' + tdef.action + ' END;';
                console.log( 'creating trigger using '+ instruction);
                DB529.exec( {
                    sql: instruction,
                    returnValue: "resultRows"
                } );
            }
            DBwasmInit.assign_DB_version( DBwasmInit.DB_Version );

        } catch( e ) {
            console.error( 'DB Table creation failed: ', e.message);
        }
    },
    
    assign_DB_version: function( ver ) {
        const today = formattedDate2();
        DB529.exec( `INSERT or IGNORE into DBVersion (version, date) VALUES (?, ?);`, {bind:[ver, today]} );
    },

    check_DB_version( ) {
        let version = [];
        let oldversion = 0;
        try {
                // the update triggers are not recursion-safe, so enforce "no recursion"
                //  in case they ever become "on" by default.
            DB529.exec( 'PRAGMA  recursive_triggers = off;');
            DB529.exec( 'SELECT version from DBVersion ORDER by version DESC LIMIT 1;', {resultRows:version, rowMode: 'array'} );
            oldversion = version[0][0];
            if ( oldversion == 1 ) {
                DBwasmInit.update_DB_1_to_2();
                oldversion = 2;
            }
            if ( oldversion == 2 ) {
                DBwasmInit.update_DB_2_to_3();
            }
            if ( oldversion < 3) {
                DB529.exec( 'UPDATE DNAmatches set pctshared = round(cMtotal / 74.4, 2) WHERE pctshared is NULL')
            }
            if ( oldversion < 4) {
                logHtml( null, 'Upgrading DB from V3 to V4');
                DB529.exec( 'UPDATE messages set entireJSON = NULL WHERE entireJSON is not NULL');
            }
            if ( oldversion < 5 ) {
                DBwasmInit.update_DB_4_to_5();
            }
        } catch( e ) {
            conerror( `update version ${oldversion} failed: ${e.msg}` );
        }
        DB529.exec( 'PRAGMA  optimize;');   // recommended every so often...

    },

        /*
        ** this one is really messy - alter table is not permitted for this change,so we go the long way...
        */
    update_DB_4_to_5: function  () {
        console.log( 'Upgrading DB from V4 to V5..this will take a few seconds');
        logHtml( '', 'Upgrading DB from V4 to V5..this will take a few seconds');
        const NL = '<BR/>\n';
        let updateSql = "";
        try {
            DB529.exec( 'PRAGMA foreign_keys=OFF; BEGIN TRANSACTION;');
            // this extra column is to align column numbers for copying to new tbl.
            DB529.exec( 'ALTER TABLE idalias  ADD COLUMN lastUpdated TEXT DEFAULT NULL;');
            DB529.exec( 'ALTER TABLE DNARelatives  ADD COLUMN lastUpdated TEXT DEFAULT NULL;');
            DB529.exec( 'ALTER TABLE DNAmatches  ADD COLUMN predictedRelNew  TEXT DEFAULT NULL;');
            logHtml( '', 'Modifying table structures...');
            for( let tdef of DBwasmInit.gTableDefs ) {
                if (tdef.version_last_modified != 5) {
                    continue;
                }
                let xfertbl = tdef.tb + 'NEW';
                let instruction = 'CREATE TABLE ' + xfertbl + '(' + tdef.cols + ');';
                updateSql += instruction + NL;
                r = DB529.exec( { sql: instruction } );
                instruction = 'INSERT INTO ' + xfertbl + ' SELECT * FROM ' + tdef.tb + ';';
                updateSql += instruction + NL;
                r = DB529.exec( { sql: instruction } );
                instruction = 'DROP TABLE ' + tdef.tb + ';ALTER TABLE ' + xfertbl + ' RENAME TO ' + tdef.tb +';';
                updateSql += instruction + NL;
                r = DB529.exec( { sql: instruction } );
            }
            // at this stage, the modified tables are in place, so recreate necessary indexes
            logHtml( '', 'updating Indexes...');
            for( let idef of DBwasmInit.indexDefs ) {
                if (idef.version_last_modified != 5) {
                    continue;
                }
                let instruction = 'CREATE INDEX IF NOT EXISTS ' +
                    idef.indexname + ' ON ' + idef.tb + '(' + idef.cols + ');';
                console.log( 'creating INDEX using '+ instruction);
                updateSql += instruction + NL;
                DB529.exec( {sql: instruction} );
            }
            for( let idef of DBwasmInit.indexDefsUnique ) {
                if (idef.version_last_modified != 5) {
                    continue;
                }
                let instruction = 'CREATE UNIQUE INDEX IF NOT EXISTS ' + 
                    idef.indexname + ' ON ' + idef.tb + '(' + idef.cols + ');';
                console.log( 'creating uindex using '+ instruction);
                updateSql += instruction + NL;
                DB529.exec( {sql: instruction} );
            }
            logHtml( '', 'recreating triggers...');
            for( let tdef of DBwasmInit.updateTriggers ) {
                let instruction = 'CREATE TRIGGER IF NOT EXISTS ' + 
                    tdef.name + ' AFTER UPDATE ON ' + tdef.tb + ' FOR EACH ROW BEGIN ' + tdef.action + ' END;';
                console.log( 'creating trigger using '+ instruction);
                updateSql += instruction + NL;
                DB529.exec( {sql: instruction} );
            }

            DBwasmInit.assign_DB_version( 5 );
            DB529.exec( 'COMMIT TRANSACTION;');

            DB529.exec( 'PRAGMA foreign_keys=ON;');
            DB529.exec( 'UPDATE idalias set lastUpdated = CURRENT_DATE where lastUpdated is null;');
            DB529.exec( 'UPDATE DNARelatives set lastUpdated = CURRENT_DATE where lastUpdated is null;');
            DB529.exec( 'UPDATE DNAMatches set lastUpdated = CURRENT_DATE where lastUpdated is null;');
            DBwasmInit.populateICWscanned();
            logHtml( '', 'update successful.');
        } catch( e ) {
            DB529.exec( 'ROLLBACK TRANSACTION;');
            conerror( 'DB Table Update to V5 failed: ', e.message);
            conerror( `previous SQL instructions were:\n${updateSql}`);
        }   
    },

    update_DB_1_to_2: function  () {
        // this removes the effect of a bug in V1.9.2 where this flag was set by mistake. At this stage, nothing should be able to assign
        // it to a correct value, so just removing all values is enough.
        DB529.exec( 'UPDATE DNARelatives SET ICWscanned = NULL, dateScanned = NULL WHERE ICWscanned = 1');
        DBwasmInit.assign_DB_version( 2 );
    },

    update_DB_2_to_3: function  () {
        logHtml( null, 'Upgrading DB from V2 to V3..this might take a few seconds');
        // Add some more data fields 
        try{
            DB529.exec( 'BEGIN TRANSACTION;');
            DB529.exec( 'CREATE TABLE IF NOT EXISTS messages ( IDmsg TEXT NOT NULL, IDsender TEXT DEFAULT NULL, IDrec TEXT DEFAULT NULL, content TEXT DEFAULT NULL, entireJSON TEXT DEFAULT NULL, PRIMARY KEY(IDmsg))' );
            DB529.exec( 'CREATE INDEX IF NOT EXISTS msgsender ON messages ( IDsender )' );
            DB529.exec( 'CREATE INDEX IF NOT EXISTS msgrecipient ON messages ( IDrec )' );
            DB529.exec( 'ALTER TABLE idalias ADD COLUMN sex TEXT DEFAULT null');
            DB529.exec( 'ALTER TABLE idalias ADD COLUMN familySurnames TEXT DEFAULT null');
            DB529.exec( 'ALTER TABLE idalias ADD COLUMN familyLocations TEXT DEFAULT null');
            DB529.exec( 'ALTER TABLE idalias ADD COLUMN familyTreeURL TEXT DEFAULT null');
            DB529.exec( 'ALTER TABLE DNAmatches ADD COLUMN largestSeg REAL NOT NULL DEFAULT 0.0');
            DB529.exec( 'ALTER TABLE DNAmatches ADD COLUMN predictedRel TEXT DEFAULT NULL');
            DB529.exec( 'ALTER TABLE DNArelatives ADD COLUMN knownRel TEXT DEFAULT NULL');
            // wrong ICWscanned status still found in V2 (maybe I changed its meaning and forgot to note it)
            DB529.exec( 'UPDATE DNARelatives SET ICWscanned = NULL, dateScanned = NULL WHERE ICWscanned = 1');
            DB529.exec( 'COMMIT TRANSACTION;');
        } catch( e ){
            DB529.exec( 'ROLLBACK TRANSACTION;');
            conerror( `update version 2to3 failed: ${e.msg}` );
            return;
        }
        DBwasmInit.assign_DB_version( 3 );
    },
    /*
    ** As a one-off, we attempt to scan for existing ICWs that have been scanned at a time including segment data
    */
    populateICWscanned: function  () {
        let profiles = DBwasm.get_profile_list( );
        
		for ( const obj of profiles ) {
            logHtml( '', `processing profile for ${obj.pname} for older ICW scans that include segments`);
            let rval = DBwasmInit.popICWscanned_1_profile(obj);
            logHtml( '', `Number of relatives updated = ${rval}`);
        }
    },
    /*
    ** now run the scan for a single profile.
    ** We really have no idea so we make an educated guess for each relative,
    ** based on number of ICWs that have segments.
    ** First generate the paired lists - person A matches person B with-segments/no-segments/unknown
    ** Then check counts of ICW relatives with segments, relative to those who do not.
    ** This is probably incorrect, as it was partly done when the chromosome browser was withdrawn.
    ** Also, previous ICW lists were much larger, but now the 3rd match must also be in the top 1500.
    */
    popICWscanned_1_profile: function ( profile ) {
        const qry_drop = 'DROP TABLE IF EXISTS Prof_ICW_segs;';
        const qry_create = 'CREATE TEMPORARY TABLE Prof_ICW_segs as \
            SELECT * from \
                     (SELECT i2, count(*) as nwithsegs from ProfPairs_chrn GROUP BY i2)  as s \
                LEFT JOIN (SELECT i2, count(*) as natzero from ProfPairs_zero GROUP BY i2)  as z USING (i2) \
                LEFT JOIN (SELECT i2, count(*) as nneg from ProfPairs_neg GROUP BY i2)  as n USING (i2) \
                WHERE (nwithsegs > 10) OR (nwithsegs > 4 AND 2*nwithsegs > natzero) \
                ORDER BY nwithsegs DESC;';
        const qry_indx = 'CREATE INDEX prfpws on Prof_ICW_segs(i2);';
        const qry_update = 'UPDATE DNARelatives	\
                        SET ICWscanned = CASE WHEN ICWscanned IS NULL THEN 2 ELSE (ICWscanned | 2 ) END \
                        FROM  Prof_ICW_segs \
                        WHERE DNARelatives.IDrelative = Prof_ICW_segs.i2 \
                                AND DNARelatives.IDprofile = ?;'

        let query = 'no query defined';
        let id = profile.IDprofile;
        let retval = 0;

        DBwasmInit.pair1( profile, 'ProfPairs_chrn',  'ppchr');
        DBwasmInit.pair23( profile, 'ProfPairs_zero', 'chromosome = 0', 'ppzero');
        DBwasmInit.pair23( profile, 'ProfPairs_neg', 'chromosome < 0', 'ppneg');

        try {
            DB529.exec( 'BEGIN TRANSACTION;');
            query = qry_drop;
            DB529.exec( query );
            query = qry_create;
            DB529.exec( query );
            query = qry_indx ;
            DB529.exec( query );
            query = qry_update ;
            DB529.exec( qry_update, {bind:[id]} );
            retval = DB529.changes();
            DB529.exec( 'COMMIT TRANSACTION;');

        } catch( e ) {
            DB529.exec( 'ROLLBACK TRANSACTION;');
            logHtml( 'error', `DB update ICWwscanned : ${e.message}, from request ${query}`);
            retval = 0;
        }
        return retval;
    },

    pair1: function ( profile, tblname, ipfx ) {
        const qry_drop = 'DROP  TABLE IF EXISTS ' + tblname;
        const qry_create = 'CREATE TEMPORARY TABLE ' + tblname + ' as \
           SELECT i2, i3, count(*) as nsegs  from (\
                SELECT s.ID1 as i2, s.ID2 as i3, chromosome as chr, start from DNARelatives as r JOIN ibdsegs as s ON r.IDrelative = s.ID1 \
                    WHERE IDprofile = ? \
                UNION \
                SELECT s.ID2 as i2, s.ID1 as i3, chromosome as chr, start from DNARelatives as r JOIN ibdsegs as s ON r.IDrelative = s.ID2 \
                    WHERE IDprofile = ? \
                ) GROUP BY i2, i3;';
        const qry_idx2 = `CREATE INDEX ${ipfx}_2 ON ${tblname}(i2);`;
        const qry_idx3 = `CREATE INDEX ${ipfx}_3 ON ${tblname}(i3);`;

        let query = 'no query defined';
        let id = profile.IDprofile;
        let retval = 0;

        try {
            DB529.exec( 'BEGIN TRANSACTION;');
            query = qry_drop;
            DB529.exec( query );
            query = qry_create;
            DB529.exec( qry_create, {bind:[id,id]} );
            retval = DB529.changes();
            query = qry_idx2 ;
            DB529.exec( query );
            query = qry_idx3;
            DB529.exec( query );
            DB529.exec( 'COMMIT TRANSACTION;');

        } catch( e ) {
            DB529.exec( 'ROLLBACK TRANSACTION;');
            logHtml( 'error', `DB update ICW match pairs1 : ${e.message}, from request ${query}`);
            retval = 0;
        }
        return retval;

    },

    pair23: function ( profile, tblname, whereclause, ipfx ) {
        const qry_drop = 'DROP  TABLE IF EXISTS ' + tblname;
        const qry_create = 'CREATE TEMPORARY TABLE ' + tblname + ' as \
           SELECT i2, i3, count(*) as nsegs  from \
            ( SELECT ID3 as i3, ID2 as i2, chromosome, start FROM ICWSets where IDprofile = ? \
                UNION \
              SELECT ID2 as i3, ID3 as i2, chromosome, start FROM ICWSets where IDprofile = ? \
            ) WHERE ' + whereclause + ' GROUP BY i2, i3;';
        const qry_idx2 = `CREATE INDEX ${ipfx}_2 ON ${tblname}(i2);`;
        const qry_idx3 = `CREATE INDEX ${ipfx}_3 ON ${tblname}(i3);`;

        let query = 'no query defined';
        let id = profile.IDprofile;
        let retval = 0;

        try {
            DB529.exec( 'BEGIN TRANSACTION;');
            query = qry_drop;
            DB529.exec( query );
            query = qry_create;
            DB529.exec( qry_create, {bind:[id,id]} );
            retval = DB529.changes();
            query = qry_idx2 ;
            DB529.exec( query );
            query = qry_idx3;
            DB529.exec( query );
            DB529.exec( 'COMMIT TRANSACTION;');

        } catch( e ) {
            DB529.exec( 'ROLLBACK TRANSACTION;');
            logHtml( 'error', `DB update ICW match pairs23 : ${e.message}, from request ${query}`);
            retval = 0;
        }
        return retval;

    },

}