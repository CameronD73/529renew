console.log( 'DBWorker: started.');

const logHtml = function (cssClass, ...args) {
  postMessage({
    reason: 'log',
    payload: { cssClass, args },
  });
};
const DBdir = '529renew';
const DBname = 'matches.sqlite3';
const DBpath = '/' + DBdir + '/' + DBname;
let DB529 = undefined;
let DBsize = 0;
let _sqlite3 = undefined;

let debugLevel = 3;


const log = (...args) => logHtml('', ...args);
//const warn = (...args) => logHtml('warning', ...args);
const error = (...args) => logHtml('error', ...args);

function conlog( level, ...args) {
  if ( level <= debugLevel ) {
    console.log( 'DBworker: ', ...args );
  };
};

function conerror( ...args) {
  console.error( 'DBworker: ', ...args );
  error( ...args );
};

/*
** this is the main despatch code, taking messages from  the
** extension tab and converting to DB I/O 
*/
self.onmessage = function despatchMessages( msg ) {
  let content = msg.data;
  let reason = content.reason;

  if ( reason.startsWith( 'migrat')) {
    // just to split up the giant switch statement ...
    processMigrations( content );
    return;
  }

  switch( reason ) {
    case "setdebug":
      debugLevel = content.value;
    break;

    case "insertNewAliasAndSegs":
      if ( content.amap.size > 0 )
        DBwasm.insertAliasmap(content.amap, false, content.useReplace); 
      if( content.smap.size > 0 )
        DBwasm.insertSegmentMap(content.smap, 'ibdsegs', content.useReplace); 
      if( content.fullsmap.size > 0 )
        DBwasm.insertSegmentMap(content.fullsmap, 'ibdsegsFull', content.useReplace); 
      if ( content.mmap.size > 0 )
        DBwasm.insertMatchMap(content.mmap, 'Match', content.useReplace); 
      if ( content.rmap.size > 0 )
        DBwasm.insertDNArelatives(content.rmap, 'Match', false);      // never overwrite 
    break;

    case "insertHiddenMap":
      if ( content.amap.size > 0 )
        DBwasm.insertAliasmap(content.amap, false, content.useReplace); 
      if( content.hmap.size > 0 )
        DBwasm.insertMatchMap(content.hmap, 'MatchHidden', content.useReplace); 
      if( content.ICWmap.size > 0 )
        DBwasm.insertICW(content.ICWmap, 'ICWSets'); 
    break;

    case "checkIfInDatabase":
      let hassegsRow = DBwasm.checkInDB( content.matchpair.indexId, content.matchpair.matchId);
      let ntc = ! hassegsRow.hasSegs;
      postMessage( {reason:"return_DBcheck", tabID:content.tabID,  matchpair:content.matchpair, returned:hassegsRow, needToCompare: ntc});
    break;

    case "getMatchList":
      conlog( 0, 'getMatchList rcvd by worker');
      let matchList = DBwasm.get_matches_list_for_dropdown( content.filter, content.purpose );
      conlog(0, `matchlist returned ${matchList.length} rows, for ${content.purpose}`);
      postMessage( {reason:'return_matchlist', payload: matchList, purpose:content.purpose});
    break;

    case "getSummary":
      let summary_return = DBwasm.get_summary();  // synchronous, so we can just send result back
      postMessage( {reason: 'summary_return', payload: summary_return } );
    break;

    case "getMatchSummary":
      let matchsum_return = DBwasm.get_matchSummary( 500 ); 
      postMessage( {reason: 'match_summary_return', payload: matchsum_return } );
    break;


    case "updateDBSettings":
      DBwasm.updateDBSettings(content.newsetting); 
    break;

    case "insertProfiles":
      let retvalpstat = DBwasm.insertProfiles(content.amap);  // synchronous, so we can just send result back
      postMessage( {reason: 'insertProfiles_return', payload: retvalpstat } );
    break;

    case "selectFromDatabase":
      let retvalsfD = DBwasm.selectSegsFromDatabase(content.id, content.chr, content.dateLimit, content.incChr100);  // synchronous, so we can just send result back
      postMessage( {reason: 'selectFromDatabase_return', callback:content.callback, payload: retvalsfD } );
    break;

    case "select23CSVFromDatabase":
      let retvals23Rels = DBwasm.select23RelsFromDatabase(content.id );  // synchronous, so we can just send result back
      postMessage( {reason: 'select23CSVFromDatabase_return', callback:content.callback, id:content.id, kitname:content.kitname, payload: retvals23Rels } );
    break;

    case "getOverlappingSegments":
      let rowsGOS = DBwasm.getOverlappingSegments(content.segmentId, content.overlap);  // synchronous, so we can just send result back
      postMessage( {reason: 'overlappingSegments_return', callback:content.callbackName, callbackParams:content.cbParams, payload: rowsGOS } );
 
    case "getProfiles":
      let retvalp = DBwasm.get_profile_list( );  // synchronous, so we can just send result back
      postMessage( {reason: 'profile_return', payload: retvalp } );
    break;

    case "get_ICW_prelude":
      let rowsICWP = DBwasm.getICWPrelude(content.matchpair);  // synchronous, so we can just send result back
      postMessage( {reason: 'ICWPrelude_return', tabID:content.tabID, payload: rowsICWP } );
    break;

    case "update_haplogroups":
      let rowsHapUp = DBwasm.setHaplogroups(content.matchHapData); 
    break;

    case "update_familytree":
      let rowsfamtree = DBwasm.setFamilyTreeURL(content.datapkt);  
    break;

    case "update_ICWs":
      let rowsicwupdated = DBwasm.updateICW(content.ICWset);  
    break;

    case "requestTriangTable":
      let retTriang = DBwasm.getTriangTable(content.profile);  // synchronous, so we can just send result back
      postMessage( {reason: 'requestTriangTable_return', tabID:content.tabID, payload: retTriang } );
    break;

    case "process_relatives":
      let rowsRelatives = DBwasm.processRelatives(content.profile, content.relatives, content.settings);  // synchronous, 
      let rowsMsgs = DBwasm.process23Comms(content.messages); 
      postMessage( {reason: 'relatives_completed', tabID:content.tabID, payload: {relatives:rowsRelatives, msgs: rowsMsgs} } );
    break;

    case "dumpDB":
      dumpDB(); 
    break;

    case "restoreDB":
      logHtml( '', `Loading file into DB`);
      restoreDB( content.filecontents ).then( ()=>{
            logHtml( '', 'Restore done');
            let dbtables = DBwasm.get_summary();
            if( dbtables.length < 10) {
              let msg = `Only ${dbtables.length} tables in summary of DB.`;
              console.log( msg, dbtables );
              conerror( msg + '\nLooks like your file was not a 529Renew database - or it has been corrupted\nYou should delete it and identify the problem');
            }
            postMessage( {reason: 'restoredDB_return' } );
          }); 
      
    break;

    case "deleteAllData":
      destroyDB(); 
    break;

    case "closing":     // creator tab is closing...
      closeDB().then( ()=> { self.close(); });      
    break;

    default:
      conerror( `Invalid DBworker call: "${reason}"`);

  }
}

function processMigrations( content ) {
  let reason = content.reason;

  switch( reason ) {
    case "migrateSegmentMap":
      DBwasm.insertSegmentMap(content.amap, 'ibdsegs', content.useReplace); 
    break;

    case "migrateSegmentMapFull":
      // small table for full-match IBD
      DBwasm.insertSegmentMap(content.amap, 'ibdsegsFull', content.useReplace); 
    break;

    case "migrateAliasmap23":
      DBwasm.insertAliasmap(content.amap, true, content.useReplace); 
    break;

    case "migrateAliasmap529":
      DBwasm.insertAliasmap(content.amap, false, content.useReplace); 
    break;

    case "migrateMatchMap":
      DBwasm.insertMatchMap(content.amap, 'Match', content.useReplace); 
    break;

    case "migrateDNArelatives":
      DBwasm.insertDNArelatives(content.amap, content.useReplace); 
      reportMigratedSize('import_23_done');
    break;

    case "migrateDNArelatives529":
      DBwasm.insertDNArelatives(content.amap, content.useReplace); 
      reportMigratedSize('migrate_529_done');
    break;

    case "migrationOverlapFind":
      let icwadded = DBwasm.identify_icw( ); 
      postMessage( {reason:'migrationOverlapFind', rowsadded:icwadded} );
    break;

    case "migrateMatchMapHidden":
      conerror( 'Should not be calling migrateMatchMapHidden');
      return;
      DBwasm.insertMatchMap(content.amap, 'MatchHidden', content.useReplace); 
    break;

    default:
      conerror( `Invalid migrate parameter: "${reason}"`);
  }
}

/* 
** open the DB, creating it if not already found
*/
const start = async function (sqlite3) {
  const capi = sqlite3.capi; /*C-style API*/
  conlog( 0,'sqlite3 version', capi.sqlite3_libversion());
  if (! sqlite3.oo1.OpfsDb)  {
    conerror('The OPFS is not available. Giving up!');
    return;
  }
  try {
    if ( DB529 !== undefined ) {
      conlog( 0, 'DB already open?');
      return;   // already opened.
    }
    const root = await navigator.storage.getDirectory();
    const sdhandle = await root.getDirectoryHandle( DBdir, {create:true} );
    let fhandle;
    let found = false;
    try {
      fhandle = await sdhandle.getFileHandle( DBname );
      conlog( 4, `DB file found: ${fhandle.name}`);
      found = true;
    } catch( fe ) {
      conlog( 4, `opening ${DBname}, error ${fe.name}, ${fe.message}`);
      if ( fe.name !== 'NotFoundError')  throw(fe);
    }
    if( found ) {
      let ahand = await fhandle.createSyncAccessHandle();
      // how silly, you have to get an exclusive lock just to find the file size.
      let dbsize = ahand.getSize();
      ahand.close();

      if ( dbsize < 10 ) {
        conlog( 0, `DB file is only  ${dbsize} bytes, recreating tables`);
        DB529 = new sqlite3.oo1.OpfsDb( DBpath, 'w' );
        DBwasm.create_db_tables();
      }
      // open the file as a DB object
      DB529 = new sqlite3.oo1.OpfsDb( DBpath, 'w' );
      conlog( 0,`The DB is open. ${dbsize} bytes`);
    } else {
      conlog( 0, 'DB not found, trying to create...');
      DB529 = new sqlite3.oo1.OpfsDb( DBpath, 'c' );
      conlog( 0,'The DB is created.');
      DBwasm.create_db_tables();
    }
  } catch( e ){
    let msg = `Failed to open/create DB: ${e.message}`;
    conerror( msg );
    return;
  }
  conlog( 1,'db =', DB529.filename);
  DBwasm.check_DB_version();

};

/* 
** get the size of the DB (can only do this before it has been opened?)
*/
const getDBSize = async function (  ) {

  const root = await navigator.storage.getDirectory();
  const sdhandle = await root.getDirectoryHandle( DBdir );
  const fhandle = await sdhandle.getFileHandle( DBname );
  let ahand = await fhandle.createSyncAccessHandle();
  let sz = ahand.getSize();
  ahand.close();
  DBsize = sz;
  console.log( `DB size now ${sz}`);
  return sz;
};

const reportMigratedSize = async function( mode ) {
  let retsize = await getDBSize();
  postMessage( {reason: mode , newsize: retsize } );
}

const dumpDB = async function (  ) {

  const root = await navigator.storage.getDirectory();
  const sdhandle = await root.getDirectoryHandle( DBdir );
  const fhandle = await sdhandle.getFileHandle( DBname );
  let ahand = await fhandle.createSyncAccessHandle();
  let sz = ahand.getSize();
  let dvbuf = new DataView( new ArrayBuffer(sz) );
  //let buf = new ArrayBuffer(sz);
  try {
    // Moz docs say ArrayBuffer or ArrayBufferView, BUT chrome crashes, demanding ...View.
    let retval = ahand.read(dvbuf);
    conlog( 0, `DBWorker: buffer loaded with ${retval} bytes, from ${sz}`);
    self.postMessage( {reason: 'DBloaded_for_dump', payload:dvbuf.buffer }, [dvbuf.buffer]);
  } catch( e ){
    conerror( 'failed to load DB: ', e.message);
  } finally {
    ahand.close();
  }
  return;
};

const restoreDB = async function ( filecontents ) {
  await destroyDB();
  try {
    await _sqlite3.oo1.OpfsDb.importDb( DBpath, filecontents );
  } catch( e ) {
    let msg = `Failed to import DB: ${e.message}`;
    conerror( msg );
  } finally {
    await start( _sqlite3 );    // reopen DB, or else create empty one on error
  }
  return 1;
};

/*
** test code - remove DBs with previous names 
** - left here in case we need example code to reinstate this functionality
const removeOldDBs = async function () {
  const root = await navigator.storage.getDirectory();
  const sdhandle = await root.getDirectoryHandle( DBdir, {create:true} );
  let found = false;
  for await ( let [name, handle] of sdhandle ) {
    if ( name === DBname ){
      found = true;
      let ahand = await handle.createSyncAccessHandle();
      let sz = ahand.getSize();
      ahand.close();
      conlog( 1, `file ${name} is ${sz} bytes`);
    } else {
      conlog( 0, `Removing other file: ${name}`);
      handle.remove();
    }
  }
}
*/

const destroyDB = async function () {
  await closeDB();      // in case DB is locked...
  try {
    const root = await navigator.storage.getDirectory();
    const sdhandle = await root.getDirectoryHandle( DBdir, {create:true} );
    try {
      const fhandle = await sdhandle.getFileHandle( DBname );
      fhandle.remove();
    } catch( fe ) {
      if ( fe.name === 'NotFoundError')  return;      // nothing to destroy
    }
  } catch( e ) {
    conerror( `Failed to destroy database: ${e.message}` );
  }
}

const closeDB = async function () {
  if ( DB529 === undefined ) 
    return;       // nothing to do
  await DB529.close();
  DB529 = undefined;
};


conlog( 0,'Loading sqlite3 module...');

// the wasm module needs to be relative to this worker, but the 529 code (not actual modules)
// can use absolute path from top level.
let sqlite3Js = 'jswasm/sqlite3.js';
importScripts(sqlite3Js);
importScripts( '/dbworker/dbcode.js' );
importScripts( '/util/dates.js' );
importScripts( '/util/rounding.js' );

conlog( 0,'Initializing sqlite3 module...');
self.sqlite3InitModule({
    print: log,
    printErr: error,
  })
  .then( async function (sqlite3) {
    conlog( 0,'InitModule completed....');
    try {
      _sqlite3 = sqlite3;
      await start(sqlite3);
      //removeOldDBs();    // don't normally need this (except during development)
    } catch (e) {
      conerror('DB worker Exception:', e.message);
    } finally {
      self.postMessage( {reason: 'init_done' });
    }
  });
