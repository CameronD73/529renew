/*
** test code - remove DBs with previous names 
** - left here in case we need example code to reinstate this functionality
** - to enable it you will need to add it to the ImportScripts() list in worker.
*/
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

