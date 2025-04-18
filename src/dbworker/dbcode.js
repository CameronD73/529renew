/*
* define it as an object to isolate namespaces for different DB types.
*/

console.log( 'dbcode loaded');

var DBwasm = {


    /*
    **     utility function to get two IDs in correct sort order
    */
    order_id1_id2: function( id1, id2 ) {
		let firstid = id1;
		let secondid = id2;
		if(id1 > id2){
			firstid = id2;
			secondid = id1;
		}
    return [firstid, secondid];
    },

    get_summary: function() {
        let sqlcode = " \
                SELECT \'DBVer\' as tbl, max(version) as nrows  from DBVersion \
            UNION SELECT \'profiles\' as tbl, count(*) as nrows from profiles \
            UNION SELECT \'ICWSegX\' as tbl, count(*) as nrows from ICWSegXref \
            UNION SELECT \'DNARels\' as tbl, count(*) as nrows from DNARelatives \
            UNION SELECT \'DNAmats\' as tbl, count(*) as nrows from DNAmatches \
            UNION SELECT \'ibdsegs\' as tbl, count(*) as nrows from ibdsegs \
            UNION SELECT \'idalias\' as tbl, count(*) as nrows from idalias \
            UNION SELECT \'idali+hap\' as tbl, count(*) as nrows from idalias where hapMat is not null \
            UNION SELECT \'ICW3way\' as tbl, count(*) as nrows from ICWSets \
            UNION SELECT \'ICW2way\' as tbl, count(*) as nrows from ICWSets2way \
            UNION SELECT \'msgs\' as tbl, count(*) as nrows from messages \
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
        return rows;

    },

    /*
    ** return a summary table for the count of overlapping segments under various categories:
    ** 1: 3-way overlaps
    ** 2: 2-way overlaps only
    ** 3: same as 1, but excluding any match where two profiles are involved. (two kits are likely to be closely related and so have lots of triangulations)
    ** 4: same as 2, but excluding any match where two profiles are involved.
    */
    get_matchSummary: function( cmlimit ) {
        let sel3 = "SELECT chromosome, count(*) as nmatches FROM ICWsets as s JOIN DNAmatches as m ON s.ID2 = m.ID1 and s.ID3 = m.ID2";
        let sel2 = "SELECT chromosome, count(*) as nmatches FROM ICWSets2way as s JOIN DNAmatches as m ON s.ID2 = m.ID1 and s.ID3 = m.ID2";
        let joinLimit = `m.cMtotal < ${cmlimit}`;
            // condition where ICW excludes presence of two profiles in one ICW set.
        let wherex2p = "(s.ID2 not in (select IDprofile from profiles) AND s.ID3  not in (select IDprofile from profiles))";
            // condition where we consider only ICW sets that have at least 2 profiles in the set.
        let whereinc2p = "(s.ID2 in (select IDprofile from profiles) OR s.ID3 in (select IDprofile from profiles))";
        let sqlcode = `SELECT chromosome, w3.nmatches as tr, w2.nmatches as mx2, w3b.nmatches as trb, w2b.nmatches as mx2b FROM \
                ( ${sel3} WHERE ${joinLimit} AND ${wherex2p} GROUP BY chromosome) as w3 \
                LEFT JOIN \
                ( ${sel2} WHERE ${joinLimit} AND  ${wherex2p} GROUP BY chromosome) as w2 USING( chromosome ) \
                LEFT JOIN \
                ( ${sel3} WHERE ${joinLimit} AND  ${whereinc2p} GROUP BY chromosome) as w3b USING( chromosome ) \
                LEFT JOIN \
                ( ${sel2} WHERE ${joinLimit} AND  ${whereinc2p} GROUP BY chromosome) as w2b USING( chromosome );`;

        let rows = [];
        let options = {
            resultRows: rows,
            rowMode: 'array'
        };
        try{
            DB529.exec( sqlcode, options );
            let sum2wayx2p = 0;
            let sum2wayi2p = 0;
            for( let i = 0 ; i < rows.length; i++){
                if ( rows[i][0] == 0) {
                    // have found cell for chr 0
                    for( let j = i+1; j < rows.length; j++ ){
                        sum2wayx2p += rows[j][2];
                        sum2wayi2p += rows[j][4];
                    }
                    rows[i][2] = sum2wayx2p;
                    rows[i][4] = sum2wayi2p;
                    break;
                }
            }
        } catch( e ) {
            conerror( `DB get_matchSummary: ${e.message}`);
            return( [ ] );
        }
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

    get_matches_list_for_dropdown( filter, purpose ) {
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
        return rows;
    },

    /*
    ** select all the segments in the DB that match given criteria..
    ** id: is the 16-digit ID text (for a specific tester), or else "All"
    ** chromosome: either gives a specific chromosome number, or zero for "all"
    ** dateLimit is either the empty string (return all) or a date such that only newer matching segments are returned.
    */
    selectSegsFromDatabase( id, chromosome, dateLimit, incChr100 ) {
        let qry_sel = "SELECT \
                    s0.ROWID as ROWID, \
                    t1.name AS name1, \
                    t2.name AS name2, \
                    t1.IDText AS id1, \
                    t2.IDText AS id2, \
                    chromosome, start, end, cM, snps, \
                    m.lastUpdated as segdate \
                FROM ibdsegs AS s0 \
                JOIN idalias t1 ON (t1.IDText=s0.id1) \
                JOIN idalias t2 ON (t2.IDText=s0.id2)  \
                LEFT JOIN DNAmatches as m ON m.ID1 = s0.ID1 AND  m.ID2 = s0.ID2 AND m.hasSegs = 1 ";
        const qry_condc = '(chromosome = ?) ';
        const qry_condid =  '((s0.id1=?) OR (s0.id2=?))';
        // convert to julianday to do a floating point comparison rather than string
        const qry_order =  ' ORDER BY chromosome, start, end DESC, s0.ROWID'
        const extra_order = ', julianday(t1.date)+julianday(t2.date), t1.ROWID+t2.ROWID;';
        let query = qry_sel;
        let needsand = false;
        let chrNum=parseInt(chromosome);
        if ( chrNum > 0 && chrNum < 24 ) {
            query += `WHERE (chromosome = ${chrNum}) `;
            needsand = true;
        }
        if ( id.length == 16 ) {
            query += (needsand ? 'AND': 'WHERE') + ` ((s0.id1='${id}') OR (s0.id2='${id}'))`;
            needsand = true;
        }
        if( dateLimit.length > 9 ) {
            query += (needsand ? 'AND': 'WHERE') + `(julianday(m.lastUpdated) >= julianday('${dateLimit}'))`;
        }
            
        query += qry_order;
        conlog(3, `query = ${query} with chr ${chrNum} and ID ${id}`);


        let rows = [];
        try{
            DB529.exec( query, {
                    resultRows: rows,
                    rowMode: 'object'
                }
            );
        } catch( e ) {
            conerror( `DB get_segments list: ${e.message}, from request ${query}`);
            return( [ ] );
        }
        //console.log( 'DB select segs gave: ', rows);
        return rows;
    },

    /*
    ** select all the summary data for matching relatives
    ** id: is the 16-digit ID text (for a specific tester profile)
    ** This is to simulate the xxxx_relatives_download CSV format.
    ** The GROUPing is to avoid duplications where testers have changed 
    ** DNA sharing status and acquired two entries
    */
    select23RelsFromDatabase( id ) {
        let query = "SELECT \
                    a.name as name, \
                    '' as surname, '' as chr, '' as MBstart, '' as MBend, \
                    m.cMtotal as Genetic_Distance, \
                    '' as SNPs, '' as FullIBD, '' as LinkProfile, '' as Sex, '' as Birth_Year, \
                    r.knownRel as Set_Relationship, \
                    m.predictedRel as Predicted_Rel, \
                    '' as RelRange, \
                    m.pctshared as Percent_DNA_Shared, \
                    m.nsegs as Segments, \
                    CASE WHEN r.side in ('M', 'B') THEN 'TRUE' ELSE '' END as MaternalSide, \
                    CASE WHEN r.side in ('P', 'B') THEN 'TRUE' ELSE '' END as PaternalSide, \
                    a.hapMat as Maternal_Haplogroup, \
                    a.hapPat as Paternal_Haplogroup, \
                    a.familySurnames, a.familyLocations, \
                    '' as mgmabc,  '' as mgpabc,  '' as pgmabc,  '' as pgpabc,  \
                    r.comment as Notes, \
                    '' as ShareStatus, \
                    CASE WHEN m.ishidden THEN '' ELSE 'TRUE' END as Showing_Ancestry, \
                    a.familyTreeURL, m.largestSeg as largest_Segment, \
                    m.predictedRelOld as Old_Predicted_Rel \
                FROM  DNARelatives as r \
                JOIN idalias as a on r.IDrelative = a.IDtext \
                JOIN DNAmatches as m on ((r.IDrelative = m.ID1 AND m.ID2 = ?) OR (r.IDrelative = m.ID2 AND m.ID1 = ?) ) \
                WHERE r.IDprofile = ? \
                GROUP BY a.IDTEXT \
	            ORDER BY m.pctshared DESC ";
        
        let rows = [];
        try{
            DB529.exec( query, {
                    resultRows: rows,
                    rowMode: 'object',
                    bind:[id, id, id]
                }
            );
        } catch( e ) {
            conerror( `DB get list for 23 CSV : ${e.message}, from request ${query}`);
            return( [ ] );
        }
        return rows;
    },

    /*
    ** Create a list of DNA relatives for import to GDAT
    ** id: is the 16-digit ID text (for a specific tester profile)
    ** The GROUPing is to avoid duplications where testers have changed 
    ** DNA sharing status and acquired two entries
    */
    selectDNARelsForGDAT( id, dateLimit ) {
        const qry_sel = "SELECT  r.IDprofile as Profile_key, r.IDrelative as Relative_key, \
                        a.name as name,  \
                        m.cMtotal as Genetic_Distance,  \
                        r.knownRel as Set_Relationship,  \
                        m.predictedRel as Predicted_Rel,  \
                        m.pctshared as Percent_DNA_Shared,  \
                        m.nsegs as Segments,  \
                        r.side as side, \
                        a.hapMat as Maternal_Haplogroup,  \
                        a.hapPat as Paternal_Haplogroup,  \
                        a.familySurnames, a.familyLocations,   \
                        r.comment as Notes, \
                        CASE WHEN m.ishidden THEN '' ELSE 'TRUE' END as Showing_DNA,  \
                    a.familyTreeURL, m.largestSeg as largest_Segment  \
                    FROM  DNARelatives as r  \
                    JOIN idalias as a on r.IDrelative = a.IDtext  \
                    JOIN DNAmatches as m on ((r.IDrelative = m.ID1 AND m.ID2 = r.IDprofile) OR (r.IDrelative = m.ID2 AND m.ID1 = r.IDprofile) )  \
                    WHERE r.IDprofile = ?";

        const qry_order = " GROUP BY a.IDText  ORDER BY m.pctshared DESC ;";

        let query = qry_sel;
        if( dateLimit.length > 9 ) {
            query += ` AND (julianday(r.lastUpdated) >= julianday('${dateLimit}'))`;
        }
        query += qry_order;

        let rows = [];
        try{
            // logHtml('', `Applying getRel to ID: ${id}; limit: ${dateLimit}; query: ${query}`);
            DB529.exec( query, {
                    resultRows: rows,
                    rowMode: 'object',
                    bind:[id]
                }
            );
        } catch( e ) {
            conerror( `DB get DNA rels list for GDAT : ${e.message}, from request ${query}`);
            return( [ ] );
        }
        return rows;
    },

        /*
        ** this routine interrogates the DB and returns a list of all ICWs (excluding profile people)
        ** in a form suitable for saving to csv. Those with known segment shares are also excluded,
        ** as they should be accounted for in the segment downloads.
        */
    selectICWForGDAT( dateLimit ) {
        const qry_sel = "SELECT m.ID1, m.ID2, \
                        max(m.cMtotal) as cMtotal, max(m.nsegs) as nsegs, max(m.largestSeg) as largest, \
                        a1.name as name1, a2.name as name2, \
                        m.predictedRel as Predicted_Rel,  \
                        count(*) as num \
                    FROM DNAmatches as m \
                    JOIN idalias as a1 on (m.ID1 = a1.IDtext)  \
                    JOIN idalias as a2 on (m.ID2 = a2.IDtext)  \
                    WHERE    m.ID1 not in (select IDprofile from profiles) \
                        AND  m.ID2 not in (select IDprofile from profiles) \
                        AND m.hasSegs = 0 ";
        const qry_order =" GROUP BY m.ID1, m.ID2  ORDER by cMtotal DESC;" ;
 
        let query = qry_sel;
        if( dateLimit.length > 9 ) {
            query += ` AND (julianday(m.lastUpdated) >= julianday('${dateLimit}'))`;
        }
        query += qry_order;

        let rows = [];
        try{
            DB529.exec( query, {
                    resultRows: rows,
                    rowMode: 'object'
                }
            );
        } catch( e ) {
            conerror( `DB get ICWs for GDAT : ${e.message}`);
            return( [ ] );
        }
        return rows;
    },

        /*
        ** this routine interrogates the DB and returns a list of all ICWs for the given profile id
        ** in a form suitable for saving to csv.
        */
    selectICWFromDatabase( id ) {
        let query = "SELECT s.IDprofile, s.ID2, s.ID3, count(*) as num, max(chromosome) as maxchr, \
                a2.name as name2, a3.name as name3, \
                m1.cMtotal as cMtotal1, m1.nsegs as nsegs1, \
                m2.cMtotal as cMtotal2, m2.nsegs as nsegs2, \
                m3.cMtotal as cMtotal3, m3.nsegs as nsegs3 \
            FROM ICWSets as s \
            JOIN idalias as a2 on (s.ID2 = a2.IDtext) \
            JOIN idalias as a3 on (s.ID3 = a3.IDtext) \
            JOIN DNAmatches as m3 ON s.ID2 = M3.ID1 AND s.ID3 = M3.ID2 \
            JOIN DNAmatches as m1 ON (s.IDprofile = m1.ID1 AND s.ID2 = m1.ID2) OR  (s.IDprofile = m1.ID2 AND s.ID2 = m1.ID1) \
            JOIN DNAmatches as m2 ON (s.IDprofile = m2.ID1 AND s.ID3 = m2.ID2) OR  (s.IDprofile = m2.ID2 AND s.ID3 = m2.ID1) \
            WHERE IDprofile = ? \
            GROUP BY s.IDprofile, s.ID2, s.ID3 \
            ORDER by cMtotal1 DESC, cMtotal2 DESC;" ;
        
        let rows = [];
        try{
            DB529.exec( query, {
                    resultRows: rows,
                    rowMode: 'object',
                    bind:[id]
                }
            );
        } catch( e ) {
            conerror( `DB get list for ICWs : ${e.message}, for ${id}`);
            return( [ ] );
        }
        return rows;
    },

    /*
    ** returns a table of all segment matches that overlap the one specified by
    ** input parameter segmentId (which is a ROWID value in the ibdsegs table)
    */
    getOverlappingSegments: function( segmentRow, overlap ) {
        
        const sellist1 = "s0.ROWID as ROWID,\
            t1.name AS name1,\
            t2.name AS name2,\
            t1.IDText AS id1,\
            t2.IDText AS id2,\
            s0.chromosome AS chromosome,\
            s0.start AS start,\
            s0.end AS end,\
            s0.cM AS cM,\
            s0.snps AS snps,\
            m.lastUpdated AS segdate";

        const joinlist = "ibdsegs as s0 \
            JOIN idalias AS t1 ON (t1.IDText=s0.id1 ) \
            JOIN idalias AS t2 ON (t2.IDText=s0.id2 ) \
            JOIN ibdsegs AS s3 ON 	( \
                s3.ROWID=? \
                AND s3.chromosome=s0.chromosome \
                AND s0.start<=(s3.end-?) \
                AND s0.end>=(s3.start+?) \
                AND (  \
                    (s3.id1=s0.id1) \
                    OR (s3.id1=s0.id2 ) \
                    OR (s3.id2=s0.id1 )  \
                    OR (s3.id2=s0.id2 ) \
                    ) \
                ) \
            LEFT JOIN DNAmatches as m ON m.ID1 = s0.ID1 AND  m.ID2 = s0.ID2 AND m.hasSegs = 1 ";

        const orderlist = "chromosome, \
            s0.start, \
            s0.end DESC, \
            s0.ROWID, \
            t1.ROWID+t2.ROWID;";
        const query='SELECT ' + sellist1 + ' FROM ' + joinlist + ' ORDER BY ' + orderlist;

        conlog(3, `getOverlappingSegments query = ${query} `);

        let rows = [];
        try{
            DB529.exec( query, {
                    resultRows: rows,
                    rowMode: 'object',
                    bind:[segmentRow, overlap, overlap]
                }
            );
        } catch( e ) {
            conerror( `DB get_segment overlaps: ${e.message}, from request ${query}`);
            return( [ ] );
        }
        //console.log( 'DB get overlap segs gave: ', rows);
    return rows;
    },
    /*
    ** check whether we already have all available data for match between id1 and id2
    */
    checkInDB: function( id1, id2 ){
        let qry = "SELECT nsegs, hasSegs, cMtotal from  DNAmatches  where ID1 = ? and ID2 = ? and ishidden = 0 ";
		let firstid = id1;
		let secondid = id2;
		if(id1 > id2){
			firstid = id2;
			secondid = id1;
		}
        let rows = [];
        try{
            
            DB529.exec( qry, {
                    resultRows: rows,
                    rowMode: 'object',
                    bind: [firstid, secondid]
                }
            );
        
        } catch( e ) {
            conerror( `DB checkInDB : ${e.message}`);
            return( 0 );
        }
        if( rows.length > 1 ) {
            console.log( 'DB checkInDB gave unecpected: ', rows);
        }
        if( rows.length > 0) {
            return rows[0];
        } else {
            return( [{ nsegs:-1, hasSegs:0, cMtotal:0.0 }])
        }
    },

    /* process the relatives list from the main page.
    ** 1. is this a newly seen profile? - if so then insert new values
    ** 2. check DNARelative - potentially add/update side and note, known relationship
    ** 3. check DNAmatches - can add/update ishidden, pctshared, cMtotal, nsegs, hasSegs, pred Relationship
    */
    processRelatives: function ( profile, relativesArr, settings ) {

        function show_updated( o, txt ) {
            // let msg =  `${txt}:  for ${o.name}, fav:${o.fav?'y':'n'}, n:${o.note.length} chars`;
            let msg =  `${txt}:  for ${o.name}`;
            conlog( 1, msg);
            logHtml( '', msg);
        };
        
        const today = formattedDate2();
        const qry_profile = 'INSERT or IGNORE INTO profiles (IDProfile, pname) VALUES (?, ?);'; 
        const qry_alias_update = 'INSERT or IGNORE INTO idalias (IDText, name, date, familySurnames, familyLocations) VALUES (?, ?, ?, ?, ?);'; 
        const qry_rel_ins = 'INSERT OR IGNORE INTO DNARelatives (IDprofile, IDrelative, comment, side, knownRel) VALUES (?, ?, ?, ?, ? );';
        const qry_rel_ins_full = `INSERT OR IGNORE INTO DNARelatives (IDprofile, IDrelative, ICWscanned, dateScanned, comment, side, knownRel) VALUES (?, ?, ?,  ?, ?, ?, ? );`;
        const qry_upd_surnames = 'UPDATE idalias SET familySurnames = ? WHERE IDtext = ? AND familySurnames is null;';
        const qry_upd_locations = 'UPDATE idalias SET familyLocations = ? WHERE IDtext = ? AND familyLocations is null;';
        const qry_upd_side = 'UPDATE DNARelatives SET side = ? WHERE IDprofile = ? AND IDrelative = ? AND (side IS NULL OR side != ?);';
        const qry_upd_note = 'UPDATE DNARelatives SET comment = ? WHERE  IDprofile = ? AND IDrelative = ? AND (comment IS NULL OR comment != ?);';
        const qry_upd_knownrel = 'UPDATE DNARelatives SET knownRel = ? WHERE  IDprofile = ? AND IDrelative = ? AND (knownRel IS NULL OR knownRel != ?);';

        const qry_match_insert = 'INSERT OR IGNORE INTO DNAmatches (ID1, ID2, ishidden, pctshared, cMtotal, nsegs, hasSegs, largestSeg, predictedRel ) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ? );';
        const qry_match_upd_nsegs = 'UPDATE DNAmatches SET nsegs = ? WHERE ID1 = ? AND ID2 = ? AND nsegs is NULL;';
        const qry_match_upd_largest = 'UPDATE DNAmatches SET largestSeg = ? WHERE ID1 = ? AND ID2 = ? AND largestSeg < 1.0;';
        const qry_match_upd_predrel = 'UPDATE DNAmatches SET predictedRel = ? WHERE ID1 = ? AND ID2 = ? AND predictedRel is null ;';

        let transState = "start";
        let rowsaffected = 0;
        let total_updates = 0;
        let use_fave = false;

        if (Object.keys(settings).includes( "favouritesAreScanned") ) {
            // disbled for the moment (for ever?)
            use_fave = false;   // (settings.favouritesAreScanned == "1");
        }
        try {
            DB529.exec( 'BEGIN TRANSACTION;');
            transState = 'BT';
            DB529.exec( qry_profile, { bind:[profile.id, profile.name] } );
            transState = "qau";
            DB529.exec( qry_alias_update, { bind:[profile.id, profile.name, today, "", ""] } );
            // now, for each relative, check/update their presence in the various tables
            for ( let i = 0; i < relativesArr.length; i++ ){
                relkey = relativesArr[i].key;
                obj = relativesArr[i].val;
                // if new, add to alias table...
                transState = `aliasup row ${i}`;
                DB529.exec( qry_alias_update, { bind:[relkey, obj.name, today, obj.surnames, obj.family_locations] } );
                rowsaffected = DB529.changes();
                if ( rowsaffected < 1 ) {
                    // we already had this record, so do conditional updates
                    if ( obj.surnames && obj.surnames.length>0) {
                        transState = `surnames row ${i}`;
                        DB529.exec( qry_upd_surnames, {bind:[obj.surnames, relkey]} );
                        let ra = DB529.changes();
                        if ( ra > 0 ) {
                            show_updated( obj, 'surnames updated');
                            total_updates += ra;
                        }
                        
                    }
                    if ( obj.family_locations && obj.family_locations.length>0) {
                        transState = `locations row ${i}`;
                        DB529.exec( qry_upd_locations, {bind:[obj.family_locations, relkey]} );
                        let ra = DB529.changes();
                        if ( ra > 0 ) {
                            show_updated( obj, 'ancestor locations updated');
                            total_updates += ra;
                        }
                    }
                }
                //  now process the relatives table...
                if ( use_fave && obj.fav ) {
                    transState = `Rels insert full row ${i}`;
                    DB529.exec( qry_rel_ins_full, {bind:[profile.id, relkey, 2, today, obj.note, obj.side, obj.known_rel]} );
                } else {
                    transState = `Rels insert row ${i}`;
                    DB529.exec( qry_rel_ins, {bind:[profile.id, relkey, obj.note, obj.side, obj.known_rel]} );
                }
                rowsaffected = DB529.changes();
                total_updates += rowsaffected;
                if ( rowsaffected < 1 ) {
                    // we already had this record, so do conditional updates, otherwise it will have just been inserted
                    if ( obj.side != 'n') {
                        transState = `update side row ${i} to ${obj.side}`;
                        DB529.exec( qry_upd_side, {bind:[obj.side, profile.id, relkey, obj.side]} );
                        let ra = DB529.changes();
                        if ( ra > 0 ) {
                            show_updated( obj, 'side updated');
                            total_updates += ra;
                        }
                    }
                    if ( obj.note.length > 0 ) {
                        transState = `update note, row ${i}`;
                        DB529.exec( qry_upd_note, {bind:[obj.note, profile.id, relkey, obj.note ]} );
                        let ra = DB529.changes();
                        if ( ra > 0 ) {
                            show_updated( obj, 'note updated');
                            total_updates += ra;
                        }
                    }
                    if ( obj.known_rel.length > 0 ) {
                        transState = `update known relationship, row ${i}`;
                        DB529.exec( qry_upd_knownrel, {bind:[obj.known_rel, profile.id, relkey, obj.known_rel ]} );
                        let ra = DB529.changes();
                        if ( ra > 0 ) {
                            show_updated( obj, 'known relationship updated');
                            total_updates += ra;
                        }
                    }
                } else {
                    show_updated( obj, 'new Relative added');
                }

                // and repeat for the DNAMatches table
                let is_hidden = obj.shared ? 0 : 1;
                let ids = DBwasm.order_id1_id2(profile.id, relkey);
                transState = `match insert  row ${i}`;
                DB529.exec( qry_match_insert, {bind:[ids[0], ids[1], is_hidden, obj.pct_ibd, obj.totalcM, obj.nseg, obj.max_seg, obj.predicted_rel]} );

                rowsaffected = DB529.changes();
                total_updates += rowsaffected;
                if ( rowsaffected < 1 ) {
                    /* we already had this record, but there are some circumstances where data was missing
                    ** This  usually happens when the 3rd person is scanned, or rescanning is requsted.
                    ** Older records will have nsegs and largest seg, but no predicted relationship.
                    ** Newer scans will have little DNA, so we don't want to overwrite any data we had before.
                    */
                    if ( obj.nsegs > 0 ) {
                        transState = `match update nsegs row ${i}`;
                        DB529.exec( qry_match_upd_nsegs, {bind:[obj.nsegs, ids[0], ids[1]]} );
                        let ra = DB529.changes();
                        if ( ra > 0 ) {
                            show_updated( obj, 'numSegments updated');
                            total_updates += ra;
                        }
                    }
                    if ( obj.max_seg > 1.0 ) {
                        transState = `match update largest, row ${i}`;
                        DB529.exec( qry_match_upd_largest, {bind:[obj.max_seg, ids[0], ids[1] ]} );
                        let ra = DB529.changes();
                        if ( ra > 0 ) {
                            show_updated( obj, 'largest segment updated');
                            total_updates += ra;
                        }
                    }
                    let predrel = obj.predicted_rel;
                    if ( predrel.length > 0 ) {
                        transState = `match update predicted relationship, row ${i}`;
                        DB529.exec( qry_match_upd_predrel, {bind:[predrel, ids[0], ids[1]]} );
                        let ra = DB529.changes();
                        if ( ra > 0 ) {
                            show_updated( obj, 'predicted relationship updated');
                            total_updates += ra;
                        }
                    }
                } else {
                    show_updated( obj, '..match added');
                }
            }

            DB529.exec( 'COMMIT TRANSACTION;');

        } catch ( e ) {
            DB529.exec( 'ROLLBACK TRANSACTION;');
            logHtml( 'error', `DB processRelatives: error after ${total_updates} and ${rowsaffected} rows at ${transState}: ${e.message}`);
            return 0;
        }
        return total_updates;
    },

        /*
        ** save the communication content that was sent between various DNA testers.
        */
    process23Comms: function ( messages ) {

        function show_updated( o, txt ) {
            let msg =  `${txt}:  for ${o.name}`;
            conlog( 1, msg);
            logHtml( '', msg);
        };
        
        //const today = formattedDate2();
        const count_nulls = 'SELECT count(*) as empties from messages where entireJSON is null;'
        const update_qry = 'INSERT or IGNORE INTO messages (IDmsg, IDsender, IDrec, content, entireJSON) VALUES \
                ($id, $sender, $recip, $content, $entireJSON);';
        const update_json = 'UPDATE messages set entireJSON = ? WHERE IDmsg = ? AND entireJSON is NULL;';
        let rowsaffected = 0;
        let emptycount = [];
        try{
            DB529.exec( 'BEGIN TRANSACTION;');
            for( obj of messages ) {
                DB529.exec( update_qry, { bind:obj } );
                rowsaffected += DB529.changes();
            }
            DB529.exec( count_nulls, 
                { resultRows: emptycount, rowMode: 'object'  }
            );
            if ( emptycount[0].empties > 0 ){
                // one-off update fixing the old entireJSON bug
                conlog( 1, `Updating ${emptycount[0].empties} null msg entries`);
                
                for( obj of messages ) {
                    DB529.exec( update_json, {bind:[obj.$entireJSON, obj.$id]} );
                }
            }
            DB529.exec( 'COMMIT TRANSACTION;');
        } catch( e ) {
            DB529.exec( 'ROLLBACK TRANSACTION;');
            let msg = `DB insert communications: error: ${e.message}`;
            conerror( msg );
            return false;
        }
        return rowsaffected;
    },
    

    /*
    ** routine to return tables of known information about a profile and the chosen relative.
    ** in: pairobj: object with name and ID of the profile person and the matching relative
    ** returns:
    **      arrays of objects with ICW comparisons and segment match summaries.
    ** side-effect: adds to profile table if this profile person is not there already.
    */
    getICWPrelude: function( pairobj ) {
        const profileID = pairobj.pid;
        const profileName = pairobj.pname;
        const matchID = pairobj.mid;
        //const matchName = pairobj.mname;
        // the GROUPing is in case we have a hidden and unhidden record (ignore hidden)
        const qry_DNAmatch = 'SELECT ID1, ID2, min(ishidden) as ishidden, max(nsegs) AS nsegs, max(hasSegs) AS hasSegs from DNAmatches \
                            WHERE ID1 = ? or ID2 = ? GROUP BY ID1, ID2;';
        const qry_ICW = 'SELECT * FROM ICWsets WHERE IDprofile = ? and (ID2 = ? OR ID3 = ?)'
        let rowsprofile = [];
        let rowsmatch = [];
        let rowsICW = [];
        let nrows = 0;
        try {     
            DB529.exec( 'INSERT or IGNORE INTO profiles (IDprofile, pname) VALUES (?, ? )', 
                { bind: [profileID, profileName] }
            );
            DB529.exec( qry_DNAmatch, 
                { resultRows: rowsprofile, rowMode: 'object', bind: [profileID, profileID] }
            );
            nrows = rowsprofile.length;
            conlog( 2, `profmatches returned ${nrows} items`);
            logHtml( '', `profmatches for ${profileID} returned ${nrows} items` );

            if ( matchID !== null ) {
                DB529.exec( qry_DNAmatch, 
                    { resultRows: rowsmatch, rowMode: 'object', bind: [matchID, matchID] }
                );
                nrows = rowsmatch.length;
                conlog( 2, `rowsmatch returned ${nrows} items`);
                logHtml( '', `rowsmatch for ${matchID} returned ${nrows} items` );
                DB529.exec( qry_ICW, 
                    { resultRows: rowsICW, rowMode: 'object', bind: [profileID, matchID, matchID] }
                );
                nrows = rowsICW.length;
            }
            conlog( 2, `rowsICW returned ${nrows} items`);
            logHtml( '', `rowsICW returned ${nrows} items` );
        
        } catch( e ) {
            conerror( `DB preparing for ICW checks : ${e.message}`);
            return( 0 );
        }

        return {pair:pairobj, profileMatches:rowsprofile, DNArelMatches: rowsmatch, ICWset: rowsICW};
    },

    /*
    ** insert/update the match's haplogroup data.
    ** originally we imported from 23nme csv files but these no longer exist.
    ** So, we need to extract from the match's profile page
    */
    setHaplogroups: function( matchHapData ) {
        const matchName = matchHapData.$mname;
        const today = formattedDate2();

        let update_qry = 'UPDATE idalias SET hapMat = $hapMat, hapPat = $hapPat where IDText = $mid;'
        let update_qry_hidden = 'UPDATE idalias SET hapMat = $hapMat, hapPat = $hapPat where IDText = $mid AND hapMat IS NULL ;'
        let insert_qry =  `INSERT OR IGNORE INTO idalias (IDText, name, date, hapMat, hapPat) VALUES ($mid, $mname, '${today}', $hapMat, $hapPat );`;
        let qry='insert';

        try {
            DB529.exec( insert_qry, {bind: matchHapData} );
            let rowsaffected = DB529.changes();
            if ( rowsaffected < 1 ) {       // insert failed, try an update instead
                delete matchHapData.$mname;     // stupid system can't cope if parameters in object are not assigned.
                if ( matchHapData.$hapMat == 'hidden') {
                    qry='update hidden';
                    DB529.exec( update_qry_hidden, {bind: matchHapData} );
                 } else {
                    qry='update';
                    DB529.exec( update_qry, {bind: matchHapData} );
                 }
            }
        } catch( e ) {
            conerror( `DB  haplogroups ${qry} for ${matchName} : ${e.message}`);
            console.error( 'offending matchHapData was ', matchHapData)
            return( 0 );
        }

        return(1); 
    },

    setFamilyTreeURL: function( datapkt ) {
        const matchID = datapkt.$mid;
        const matchName = datapkt.$mname;
        const famtree= datapkt.$famtree;

        const update_qry = `UPDATE idalias SET familyTreeURL = $famtree WHERE IDText = $mid;`;

        if ( famtree.length < 5 ) {
            return( 0 );
        }
        try {
            DB529.exec( update_qry, {bind:[famtree, matchID]} );
        } catch( e ) {
            conerror( `DB updating family tree for ${matchName} : ${e.message}`);
            return( 0 );
        }

        return(1); 
    },

    /*
    ** updateICW - called after we have scanned the ICWs for a give profile and relative.
    ** ensure the icw match is
    ** 1. in the DNArelatives table to the profile
    ** 2. the icw is in the idalias table - if they are not there, then only name and ID can be added.
    ** 3. in the DNAmatches table for both profile-icw and relative-icw, can add ishidden, pctshared, cMtotal
    ** 4. add to ICWsets to show the 3-way ICW with chr=-2
    */
    updateICW: function( icwset ) {
        const today = formattedDate2();
        // this query is for list of ICW ppl 
        const qry_rel_insert = `INSERT OR IGNORE INTO DNARelatives (IDprofile, IDrelative) VALUES (?, ? );`;
        // this version is for the relative whose ICWs are being scanned - they must already have an entry in DNArelatives, so just update scan status
        const qry_upd_rels_unscanned = `UPDATE DNARelatives SET ICWscanned = 1, dateScanned = '${today}' WHERE IDprofile = ? AND IDrelative = ? AND ( ICWscanned IS NULL );`;
        const qry_upd_rels_setbit0 = 'UPDATE DNARelatives SET ICWscanned =  (ICWscanned | 1) WHERE IDprofile = ? AND IDrelative = ? AND (ICWscanned & 1 = 0) ;';
        const qry_upd_rels_clrbit3 = 'UPDATE DNARelatives SET ICWscanned =  (ICWscanned & (~8)) WHERE IDprofile = ? AND IDrelative = ? AND (ICWscanned & 8 != 0) ;';
        const qry_alias_insert = `INSERT or IGNORE INTO idalias (IDText, name, date) VALUES (?, ?,  ${today});`; 
        //const qry_upd_xx = 'UPDATE idalias SET xx = ? WHERE IDtext = ? AND xx is null;';
        const qry_match_insert = 'INSERT OR IGNORE INTO DNAmatches (ID1, ID2, ishidden, pctshared, cMtotal, predictedRel ) VALUES (?, ?, ?, ?, ?, ?);';
        const qry_match_upd_nsegs = 'UPDATE DNAmatches SET nsegs = ? WHERE ID1 = ? AND ID2 = ? AND ishidden = ? AND nsegs is NULL;';
        const qry_icwsets_insert = 'INSERT OR IGNORE INTO ICWSets (IDprofile, ID2, ID3, chromosome, start, end ) VALUES (?, ?, ?, -2, 0, 0 );';

        const profileID = icwset.ID1;
        const relativeID = icwset.ID2;
        let transState = "nothing";
        let rowsaffected = 0;
        let total_updates = 0;
        logHtml( '', `Updating ICW for ${icwset.name1} and  ${icwset.name2}`);

        try {
            DB529.exec( 'BEGIN TRANSACTION;');
            transState = 'BT';
            // update scan date for this relative...
            transState = `update dna rel for ${relativeID}`;
            DB529.exec( qry_rel_insert, { bind:[profileID, relativeID] } );
            rowsaffected = DB529.changes();
            // update the "has been scanned bit", but only if it was previously null.
            DB529.exec( qry_upd_rels_unscanned, { bind:[profileID, relativeID] } );
            // ensure the "force scan" bit is now cleared
            DB529.exec( qry_upd_rels_clrbit3, { bind:[profileID, relativeID] } );
            // ensure the "has been scanned" bit is now set
            DB529.exec( qry_upd_rels_setbit0, { bind:[profileID, relativeID] } );

            for( obj of icwset.icwarray) {
                let matchID = obj.profile_id;
                let matchname  = obj.first_name + " " + obj.last_name;
                let pct_p2match = obj.ibd_proportion_1 * 100;
                let pct_r2match = obj.ibd_proportion_2 * 100;
                let relation_p2match = obj.predicted_relationship_id_1;
                let relation_r2match = obj.predicted_relationship_id_2;
                let icw_hidden_dna = obj.is_open_sharing ? 0 : 1;       // boolean as integer in DB

                transState = `ICWset for ${matchname}`;
                let ids = DBwasm.order_id1_id2(relativeID, matchID)
                DB529.exec( qry_icwsets_insert, { bind:[profileID, ids[0], ids[1] ] } );
                // this should never have different values, so if no change then ignore it.
                rowsaffected = DB529.changes();
                total_updates += rowsaffected;

                // create idalias for 3rd person (unlikely to be nececssary)
                transState = `insert idalias for ${matchname}`;
                DB529.exec( qry_alias_insert, { bind:[matchID, matchname] } );
                rowsaffected = DB529.changes();
                total_updates += rowsaffected;

                // create DNArelative for 3rd person (unlikely to be nececssary) (do alias first as it's the parent foreign key ref.)
                transState = `insert dna rel for ${matchname}`;
                DB529.exec( qry_rel_insert, { bind:[profileID, matchID] } );
                rowsaffected = DB529.changes();
                total_updates += rowsaffected;

                function update_1_part( id1, id2, is_hidden, pctshared, predictedrel) {
                    let ids = DBwasm.order_id1_id2( id1, id2);
                    let cM = pctShared2cM( pctshared);

                    transState = `insert DNAmatch for ${matchname}`;
                    DB529.exec( qry_match_insert, { bind:[ids[0], ids[1], is_hidden, pctshared, cM, predictedrel] } );
                    let rowsaff = DB529.changes();
                    return rowsaff;
                }
                total_updates += update_1_part(profileID,  matchID, icw_hidden_dna, pct_p2match, relation_p2match);
                total_updates += update_1_part(relativeID, matchID, icw_hidden_dna, pct_r2match, relation_r2match);
            }

            DB529.exec( 'COMMIT TRANSACTION;');

        } catch ( e ) {
            DB529.exec( 'ROLLBACK TRANSACTION;');
            msg=  `DB updateICW: error after ${total_updates} and ${rowsaffected} rows at ${transState}: ${e.message}`;
            logHtml('error', msg);
            console.error( msg );
            return 0;

        }
    
    },
    /*
    ** set a flag to say we want to rescan the ICW lists for a specific profile
    */
    force_ICW_rescan: function( profileID ) {
        // note - if ICWscanned is null then it won't be set, however a null value has the same effect, forcing a scan.
        const qry_upd_rels_setbit3 = 'UPDATE DNARelatives SET ICWscanned =  (ICWscanned | 8) WHERE IDprofile = ? ;';
        
        rowsaffected = 0;
        try {
            DB529.exec( 'BEGIN TRANSACTION;');
            DB529.exec( qry_upd_rels_setbit3, { bind:[profileID] } );
            rowsaffected = DB529.changes();
            DB529.exec( 'COMMIT TRANSACTION;');

        } catch ( e ) {
            DB529.exec( 'ROLLBACK TRANSACTION;');
            msg=  `DB set flag to force rescan for ICW: error : ${e.message}`;
            logHtml('error', msg);
            console.error( msg );
        }
        return rowsaffected;
    },

    /*
    ** currently really a "getICWTAble"
    */
    getTriangTable: function( profileID ) {
        const qry = 'SELECT IDrelative, ICWscanned from DNARelatives WHERE IDprofile = ? and ICWscanned IS NOT NULL AND ICWscanned > 0;';
        let rows = [];
        try {     
            DB529.exec( qry, {resultRows: rows, rowMode: 'object',  bind: [profileID] } );
        
        } catch( e ) {
            conerror( `DB returned triang list : ${e.message}`);
            return( 0 );
        }

        return { profile: profileID,  dnarels:rows };
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

    insertAliasmap: function( aliasmap, hashap, useReplace ) {
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
                DB529.exec( update_qry, {
                    bind: obj
                } );
                
                let rowsaffected = DB529.changes();
                total_rows_updated += rowsaffected; 
            }
            DB529.exec( 'COMMIT TRANSACTION;');
        } catch( e ) {
            DB529.exec( 'ROLLBACK TRANSACTION;');
            conerror( `DB insertAlias: error: ${e.message}`);
            return false;
        }
        conlog( 1, `DB insertAlias: finished; ${total_rows_updated} rows updated` );
        //logHtml( null, 'finished');
        return true;
    },

    insertSegmentMap: function( segmap, table, useReplace ) {
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
                DB529.exec( update_qry, {
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
            DB529.exec( 'ROLLBACK TRANSACTION;');
            conerror( `DB insertSegMap: error: ${e.message} after ${total_rows_updated} rows`);
            return false;
        }
        conlog( 0, `DB insertSegMap: finished; ${total_rows_updated} rows updated.` );
        //logHtml( null, 'finished');
        return true;
    },

        /*
        ** this table is of pairs of testers where we have segment data
        */ 
    insertMatchMap: function( matmap, matchtype, useReplace ) {
        //logHtml( null, `Storing ${matchtype}  pair summary ...`);
        const update_qry_part =  ' (ID1, ID2, ishidden, pctshared, cMtotal, nsegs, hasSegs, lastUpdated) '+
                `VALUES ($id1,$id2,$ishidden,$pctshared,$cMtotal,$nsegs, $hasSegs, $lastdate);`;
        const update_qry = 'INSERT OR ' + (useReplace ? 'REPLACE' : 'IGNORE') + ' INTO DNAmatches' + update_qry_part;
        let total_rows_updated = 0;

        try{
            DB529.exec( 'BEGIN TRANSACTION;');
            for( const[key, obj] of matmap ) {
                DB529.exec( update_qry, { bind:obj } );
                let rowsaffected = DB529.changes();
                total_rows_updated += rowsaffected; 
                conlog( 4, `DB Migrate${matchtype}: There were ${rowsaffected} rows affected by statement ${update_qry}`);
            }
            DB529.exec( 'COMMIT TRANSACTION;');
        } catch( e ) {
            DB529.exec( 'ROLLBACK TRANSACTION;');
            logHtml('error', `DB Migrate${matchtype}: error: ${e.message}`);
            return false;
        }
        let msg = `DB Migrate${matchtype}: finished`;
        conlog( 4, msg );
        logHtml( null, msg);
        return true;
    },

    insertDNArelatives: function( matmap,  useReplace ) {
        //logHtml( null, `Storing ${matchtype}  pair summary ...`);
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
            logHtml('error', `DB insertDNArels: error: ${e.message}`);
            return false;
        }
        conlog( 4, `DB insertDNArels: finished` );
        return true;
    },
    
    migrateMatchMapHidden: function( matmap, useReplace ) {
        //logHtml( null, 'Storing  pair summary when one is hidden ...');
        const update_qry_part =  ` (ID1, ID2, ishidden, pctshared, cM, nsegs, hasSegs ) VALUES (?,?,0,?,?,?,?);`;
        let update_qry = 'INSERT OR ' + (useReplace ? 'REPLACE' : 'IGNORE') + ' INTO DNAmatches' + update_qry_part;
        let rows = [];
        let total_rows_updated = 0;
        //conlog( 0,'DB MigrateMatchHidden: skipped 4');
        //return;

        try{
            DB529.exec( 'BEGIN TRANSACTION;');
            for( const[key, obj] of matmap ) {
                conlog( 4, `DB MigrateMatchHidden:  insert key ${key}, name ${obj.name}`);
                DB529.exec( update_qry, {
                    bind:[obj.id1, obj.id2, obj.ishidden ,obj.start ,obj.end ,obj.cM , obj.snps]
                } );
                let rowsaffected = DB529.changes();
                total_rows_updated += rowsaffected; 
                conlog( 4, `DB MigrateMatchHidden: There were ${rowsaffected} rows affected by statement ${update_qry}`);
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
        const update_qry =  'INSERT OR REPLACE INTO profiles (IDProfile, pname) VALUES (?,?);';
        let total_rows_updated = 0;
        //conlog( 0,'DB MigrateMatchHidden: skipped 4');
        //return;

        try{
            DB529.exec( 'BEGIN TRANSACTION;');
            for( const[key, obj] of profilemap ) {
                conlog( 4, `DB ProfileTable:  insert key ${key}, name ${obj.name}`);
                DB529.exec( update_qry, {
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
        logHtml( '' , 'Looking for 3-way segment overlaps. This will take a long time');
        const profiles = DBwasm.get_profile_list();
        const matchList = DBwasm.get_DNAmatch_list();
        if ( matchList.length < 1) {
            conerror( 'identify_ICW: no matches in database');
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
        let sumICW = {'compared': 0, 'unknown': 0, 'hidden':0, 'no_overlap':0, 'triang':0, 'twoway':0 };

        for( let p = 0 ; p < profiles.length; p++ ) {
        //let p=0; {
            pr = profiles[p];
            P1id = pr.IDprofile;
            logHtml( '' , `Looking for segment overlaps for ${pr.pname}`);
            const skiplist = [];
            for( let pp = 0 ; pp < p; pp++) {
                skiplist[pp] = profiles[pp].IDprofile   // to avoid duplicating matches where two  are profile people.
            }

            const relList = DBwasm.get_DNArel_list( P1id );     // already sorted by ID
            const rlsize = relList.length;
            const maxChecks = 0.5 * rlsize * ( rlsize - 1);
            const checkInterval = Math.floor(maxChecks/10);
            sumICW.compared += (maxChecks * 0.000001);
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
                    const P1M2 = DBwasm.get_match_2way( matchmap, P1id, M2id );
                    const P1M3 = DBwasm.get_match_2way( matchmap, P1id, M3id );
                    const M1M2 = matchmap.get( key3 );
                    let icwkey = P1id + "_" + M2id + "_" + M3id;
                    if ( P1M2.ishidden != 0 ||  P1M3.ishidden != 0 ||  M1M2.ishidden != 0 ) {
                        // ignore if any are hidden.
                        icwmap.set( icwkey, {$IDp:P1id, $ID2:M2id, $ID3:M3id, $chr: -2, $st: 0, $end: 0} ); // chr = -2 means hidden
                        sumICW.hidden++;
                    } else if ( P1M2.hasSegs == 0 ||  P1M3.hasSegs == 0 ||  M1M2.hasSegs == 0 ) {
                            // is ICW, but we cannot tell how - this key is good enough for this pass, but not enough for the entire db
                            if ( P1M2.hasSegs != 0 &&  P1M3.hasSegs != 0 ) {
                                // we can do a 2-way check.
                                const overlaps = DBwasm.get_icw_overlaps( P1id, M2id, M3id, false );
                                DBwasm.saveOverlaps_2way(overlaps[0], icwmap2, icwkey, sumICW, P1id, M2id, M3id  );
                            }
                            icwmap.set( icwkey, {$IDp:P1id, $ID2:M2id, $ID3:M3id, $chr: -1, $st: 0, $end: 0} ); // chr = -1 means "don't know"
                            sumICW.unknown++;
                    } else {

                        // we have icw - the question now is: is there any overlap ==> triangulation
                        const overlaps = DBwasm.get_icw_overlaps( P1id, M2id, M3id, true );
                        if ( overlaps[1].length === 0 ) {
                            // chr=0 means we know there is not 3-way overlap
                            icwmap.set( icwkey, {$IDp:P1id, $ID2:M2id, $ID3:M3id, $chr: 0, $st: 0, $end: 0} );
                            if ( overlaps[0].length > 0){
                                DBwasm.saveOverlaps_2way(overlaps[0], icwmap2, icwkey, sumICW, P1id, M2id, M3id  );
                            } else {
                                sumICW.no_overlap++;
                            }
                        } else {
                            // I'm not sure we need icwxrefmap, rather than just rescan icwmap.
                            let olap3way = overlaps[1];
                            icwxrefmap.set( icwkey, {$IDp:P1id, $ID2:M2id, $ID3:M3id, $chr:olap3way[0].chr, $st:olap3way[0].startolap, $end:olap3way[0].endolap}) ;
                            for( let r = 0 ; r < olap3way.length; r++) {
                                let ol = olap3way[r];
                                sumICW.triang++;
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
        // return the match list object that corresponds to id1 cf id2
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
        // a giant join is just too complicated for me to understand and get right (if it is even possible).  Just split into 3x two-way matches and compare.
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

        } catch( e ) {
            logHtml( 'error', `Find triangulation failed with ${e.message}, for ${olist[0]},  ${olist[1]},  ${olist[2]}`);
            return [[], []];
        }
        return [rows2, rows3];
    },

    insertICW: function( icwmap, tablename ) {
        //logHtml( null, `Storing ${matchtype}  pair summary ...`);
        const today = formattedDate2();
        const update_qry = `INSERT OR REPLACE INTO ${tablename} (IDprofile, ID2, ID3, chromosome, start, end) VALUES ($IDp, $ID2, $ID3, $chr, $st, $end );`;
        let total_rows_updated = 0;

        try{
            DB529.exec( 'BEGIN TRANSACTION;');
            let loopcount = 1;
            for( const[key, obj] of icwmap ) {
                DB529.exec( update_qry, { bind:obj } );
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
            return false;
        }
        conlog( 4, `DB insertICW ${tablename}: finished` );
        if ( tablename === 'ICWSets2way') {
            // do not update dates, since have not verified 3 way ICW has been checked.
            return;
        }
        return true;
    },

    /*
    ** sanity-check function to determine if any matches are missing the segment count when we know we have them
    */
    check_segCount: function( ) {
        let qry = 'SELECT * FROM DNAmatches as m JOIN ibdsegs as s USING(ID1,ID2) WHERE m.hasSegs = 0 and m.ishidden = 0;';
        // TODO - finish the code
    },

    /*
    ** fix any missing segment counts in DNAmatches table.
    */
    fix_segCount: function() {
        let qry = "UPDATE DNAmatches as m set nsegs=nsegments, hasSegs=1 FROM \
	    	( SELECT ID1, ID2, count(*) as nsegments \
				FROM  DNAmatches as m JOIN ibdsegs as s USING(ID1,ID2) \
				WHERE (m.hasSegs = 0 OR m.nsegs is null) and m.ishidden = 0 \
				GROUP BY ID1, ID2 \
            ) as sj\
		WHERE m.ID1 = sj.ID1 and m.ID2 = sj.ID2;";
        // TODO - finish the code
    },
}