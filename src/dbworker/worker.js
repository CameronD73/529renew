console.log( 'DBWorker: started.');

const logHtml = function (cssClass, ...args) {
  postMessage({
    reason: 'log',
    payload: { cssClass, args },
  });
};
const DBdir = 'CJDtestdir';
const DBname = 'test6.sqlite3';
const DBpath = '/' + DBdir + '/' + DBname;
let DB529 = undefined;
let DBsize = 0;

let debugLevel = 0;
//let _sqlite3 = undefined;


const log = (...args) => logHtml('', ...args);
const warn = (...args) => logHtml('warning', ...args);
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
self.onmessage = function processMessages( msg ) {
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

    case "getMatchList":
      conlog( 0, 'getMatchList rcvd by worker');
      let matchList = DBwasm.get_matches_list( content.filter, content.purpose );
      conlog(0, `matchlist returned ${matchList.length} rows, for ${content.purpose}`);
      postMessage( {reason:'return_matchlist', payload: matchList, purpose:content.purpose});
    break;

    case "getSummary":
      let retval = DBwasm.get_summary();  // synchronous, so we can just send result back
      postMessage( {reason: 'summary_return', payload: retval } );
    break;

    case "updateDBSettings":
      DBwasm.updateDBSettings(content.newsetting); 
    break;

    case "dumpDB":
      dumpDB(); 
      break;

    case "deleteAllData":
      destroyDB(); 
      break;

    case "insertProfiles":
      let retvalpstat = DBwasm.insertProfiles(content.amap);  // synchronous, so we can just send result back
      postMessage( {reason: 'insertProfiles_return', payload: retvalpstat } );
    break;

    case "getProfiles":
      let retvalp = DBwasm.get_profile_list( );  // synchronous, so we can just send result back
      postMessage( {reason: 'profile_return', payload: retvalp } );
    break;

    case "close":     // creator tab is closing...
      closeDB();
      conlog( 0, "closing DB worker");   // you won't see this?
      self.close();
      break;
  }
}


function processMigrations( content ) {
  let reason = content.reason;

  switch( reason ) {
    case "migrateSegmentMap":
      DBwasm.migrateSegmentMap(content.amap, 'ibdsegs', content.useReplace); 
    break;

    case "migrateSegmentMapFull":
      // small table for full-match IBD
      DBwasm.migrateSegmentMap(content.amap, 'ibdsegsFull', content.useReplace); 
    break;

    case "migrateWebSQLAlias":
      let retvalwsa = DBwasm.migrateAliasWebSQL(content.sqlres, false, content.useReplace); 
      postMessage( {reason: 'webSQLAlias_return', payload: retvalwsa } );
    break;

    case "migrateWebSQLFULLSegs":
      let retvalwsfs = DBwasm.migrateFULLSegmentWebSQL( content.sqlres ); 
      postMessage( {reason: 'webSQLFULLSeg_return', payload: retvalwsfs } );
    break;

    case "migrateWebSQLSegs":
      let retvalwshs = DBwasm.migrateSegmentWebSQL( content.sqlres ); 
      postMessage( {reason: 'webSQLSeg_return', payload: retvalwshs } );
    break;


    case "migrateAliasmap23":
      DBwasm.migrateAliasmap(content.amap, true, content.useReplace); 
    break;

    case "migrateAliasmap529":
      DBwasm.migrateAliasmap(content.amap, false, content.useReplace); 
    break;

    case "migrateMatchMap":
      DBwasm.migrateMatchMap(content.amap, 'Match', content.useReplace); 
    break;

    case "migrateDNArelatives":
      DBwasm.migrateDNArelatives(content.amap, content.useReplace); 
      reportMigratedSize('import_23_done');
    break;

    case "migrateDNArelatives529":
      DBwasm.migrateDNArelatives(content.amap, content.useReplace); 
      reportMigratedSize('migrate_529_done');
    break;

    case "migrateMatchMapHidden":
      conerror( 'Should not be calling migrateMatchMapHidden');
      return;
      DBwasm.migrateMatchMap(content.amap, 'MatchHidden', content.useReplace); 
    break;

    default:
      conerror( `Invalid migrate parameter: "${reason}"`);
  }
}

/* open the DB, creating it if not already found
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
    let found = false;
    let dbsize = 0;
    for await ( let [name, handle] of sdhandle ) {
      if ( name === DBname ){
        found = true;
        let ahand = await handle.createSyncAccessHandle();
        dbsize = ahand.getSize();
        ahand.close();

        if ( dbsize < 10 ) {
          conlog( 0, `DB file is only  ${dbsize} bytes, recreating tables`);
          DBwasm.create_db_tables();
        }
      } else {
        conlog( 0, `other file: ${name}`);
      }
    }
    if ( found ) {
      DB529 = new sqlite3.oo1.OpfsDb( DBpath, 'w' );
      conlog( 0,`The DB is open. ${dbsize} bytes`);
    } else {
      conlog( 0, 'DB not found, trying to create...');
      DB529 = new sqlite3.oo1.OpfsDb( DBpath, 'c' );
      conlog( 0,'The DB is created.');
      DBwasm.create_db_tables();
    }
  } catch( e ){
    conerror( 'failed to open DB: ', e.message);
    return;
  }
  conlog( 1,'db =', DB529.filename);

};

/* open the DB, creating it if not already found
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

const removeDBs = async function () {
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

const destroyDB = async function () {
  await closeDB();      // in case DB is locked...
  const root = await navigator.storage.getDirectory();
  const sdhandle = await root.getDirectoryHandle( DBdir, {create:true} );
  const fhandle = await sdhandle.getFileHandle( DBname );
  fhandle.remove();
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

conlog( 0,'Initializing sqlite3 module...');
self.sqlite3InitModule({
    print: log,
    printErr: error,
  })
  .then( async function (sqlite3) {
    conlog( 0,'InitModule completed....');
    try {
      //_sqlite3 = sqlite3;
      await start(sqlite3);
      removeDBs();
    } catch (e) {
      conerror('DB worker Exception:', e.message);
    } finally {
      self.postMessage( {reason: 'init_done' });
    }
  });
