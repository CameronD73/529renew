These instructions are a guide to prepare a version of 529Renew, either
1. for installation directly (using Chrome "load unpacked"), or 
2. creation of a zip file for submission to the Chrome store

## Requirements
Obtain the latest stable distributions of:
1. sqlite-wasm  [from the Sqlite.org downloads page](https://sqlite.org/download.html) - look for _sqlite-wasm-version.zip_  under the **WebAssembly & JavaScript** section
2. FileSaver.js [from GitHub](https://github.com/eligrey/FileSaver.js) only dist/FileSaver.js is used, but you might want the git repo.
3. PapaParse [from GitHub](https://github.com/mholt/PapaParse) only papaparse.min.js is needed, but you might want the git repo.

## Layout
At the top level folder, the instructions assume you have git repos or downloaded packages in directories named: 529renew, FileSaver-js, PapaParse, sqlite-wasm.
When the sqlite-wasm package is unzipped, rename the folder by removing the version number.

## Using Makefile
You can either copy everything by hand, or use the Makefile in the _utils_ folder.
Copy the Makefile into the top level folder, and edit the target folder name - BUILDDIR - to give some unique name.
### under MS windows
This should work directly under GNU/Linux systems, BSD, etc but it  abit trickier under ms-windows.
Git Bash does not seem to provide a Make, so I use one from WSL running in windows terminal.
You should also be able to get a system working under cygwin or msys.

The command _make_ should create an unpacked installable folder for Chrome/etc in developer mode, while 
the command _make_ _zip_ will produce a file 529renew.zip in the top level.
You should ensure the zip file does not exist already.
