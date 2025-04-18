# BUILDxxx represent the target directories in which to build the extension.
# set BUILDDIR to 529renew-V2-test for local devel installation, or
#				  529renew-V2-release for a release version
#BUILDDIR	= 529renew-V2-test
BUILDDIR	= 529renew-V2-release

BUILD_LOGOS	= ${BUILDDIR}/logos
BUILD_IMAGES	= ${BUILDDIR}/images
BUILD_UTIL	= ${BUILDDIR}/util
BUILD_DB	= ${BUILDDIR}/db
BUILD_DBWORKER	= ${BUILDDIR}/dbworker
FSDIR		= FileSaver-js/dist
SQLITEDIR	= sqlite-wasm
PAPADIR		= PapaParse
V3SRC	= 529renew/src
LOGODIR	= 529renew/logos
IMAGEDIR	= 529renew/images
ZIPTARGET	= 529renew.zip

MANIFEST= ${BUILDDIR}/manifest.json
CSSFILES= \
	  ${BUILDDIR}/results_tab.css \
	  ${BUILDDIR}/popup529.css 

HTMLFILES= \
	   ${BUILDDIR}/results_tab.html  \
	   ${BUILDDIR}/popup529.html 

IMAGEFILES= \
	${BUILD_IMAGES}/529-popup-button.png \
	${BUILD_IMAGES}/529-popup-pin.png


JSFILES= \
	${BUILD_UTIL}/basicQueue.js \
	${BUILD_UTIL}/page_23_utils.js \
	${BUILD_UTIL}/rounding.js \
	${BUILD_UTIL}/dates.js \
	${BUILD_UTIL}/DNA_match_cache.js \
	${BUILD_UTIL}/validations.js \
	${BUILD_DB}/CSV_input.js \
	${BUILD_DB}/database_IO.js \
	${BUILD_DB}/db_actions.js \
	${BUILD_DBWORKER}/dbcode.js \
	${BUILD_DBWORKER}/dbcode_init.js \
	${BUILD_DBWORKER}/worker.js \
	${BUILDDIR}/results_options.js \
	${BUILDDIR}/results_tab.js \
	${BUILDDIR}/results_tab_messaging.js \
	${BUILDDIR}/popup529.js \
	${BUILDDIR}/start_db_tab.js \
	${BUILDDIR}/save_segments.js \
	${BUILDDIR}/scan_relatives.js \
	${BUILDDIR}/scan_icws.js \
	${BUILDDIR}/whatsnew-2_0.html \
	${BUILDDIR}/service.js

LOGOFILES= \
	${BUILD_LOGOS}/529renew-128.png \
	${BUILD_LOGOS}/529renew-16.png \
	${BUILD_LOGOS}/529renew-19.png \
	${BUILD_LOGOS}/529renew-48.png \
	${BUILD_LOGOS}/529renew-small-128.png \
	${BUILD_LOGOS}/529renew.png

ADDONS= ${BUILD_UTIL}/FileSaver.js \
	${BUILD_DBWORKER}/jswasm/sqlite3.wasm \
	${BUILD_UTIL}/papaparse.min.js

CP	= cp -u

master:	${BUILDDIR} ${BUILD_LOGOS} ${BUILD_IMAGES} ${BUILD_UTIL} ${BUILD_DB} ${BUILD_DBWORKER} \
		${LOGOFILES} ${IMAGEFILES} ${ADDONS} ${MANIFEST} ${CSSFILES} ${HTMLFILES} ${JSFILES} 

${BUILDDIR}:
	mkdir -p ${BUILDDIR}

${BUILD_IMAGES}:
	mkdir -p ${BUILD_IMAGES}

${BUILD_LOGOS}:
	mkdir -p ${BUILD_LOGOS}

${BUILD_UTIL}:
	mkdir -p ${BUILD_UTIL}

${BUILD_DB}:
	mkdir -p ${BUILD_DB}

${BUILD_DBWORKER}:
	mkdir -p ${BUILD_DBWORKER}

zip:	master
	( cd ${BUILDDIR} && zip -r ../${ZIPTARGET} . )

${BUILDDIR}/manifest.json: ${V3SRC}/manifest.json
	${CP} $< $@

${BUILDDIR}/results_tab.css: ${V3SRC}/results_tab.css 
	${CP} $< $@

${BUILDDIR}/results_tab.html: ${V3SRC}/results_tab.html 
	${CP} $< $@

${BUILDDIR}/popup529.css: ${V3SRC}/popup529.css 
	${CP} $< $@

${BUILDDIR}/popup529.html: ${V3SRC}/popup529.html 
	${CP} $< $@

${BUILD_UTIL}/basicQueue.js:	${V3SRC}/util/basicQueue.js 
	${CP} $< $@

${BUILD_UTIL}/page_23_utils.js:	${V3SRC}/util/page_23_utils.js 
	${CP} $< $@

${BUILD_UTIL}/rounding.js:	${V3SRC}/util/rounding.js 
	${CP} $< $@

${BUILD_UTIL}/dates.js:	${V3SRC}/util/dates.js 
	${CP} $< $@

${BUILD_UTIL}/DNA_match_cache.js:	${V3SRC}/util/DNA_match_cache.js 
	${CP} $< $@

${BUILD_UTIL}/validations.js:	${V3SRC}/util/validations.js 
	${CP} $< $@

${BUILD_DB}/CSV_input.js:	${V3SRC}/db/CSV_input.js 
	${CP} $< $@

${BUILD_DB}/database_IO.js:	${V3SRC}/db/database_IO.js 
	${CP} $< $@

${BUILD_DB}/db_actions.js:	${V3SRC}/db/db_actions.js 
	${CP} $< $@

${BUILD_DBWORKER}/worker.js:	${V3SRC}/dbworker/worker.js 
	${CP} $< $@

${BUILD_DBWORKER}/dbcode.js:	${V3SRC}/dbworker/dbcode.js 
	${CP} $< $@

${BUILD_DBWORKER}/dbcode_init.js:	${V3SRC}/dbworker/dbcode_init.js 
	${CP} $< $@

${BUILDDIR}/results_options.js:	${V3SRC}/results_options.js 
	${CP} $< $@

${BUILDDIR}/results_tab.js:	${V3SRC}/results_tab.js 
	${CP} $< $@

${BUILDDIR}/results_tab_messaging.js:	${V3SRC}/results_tab_messaging.js 
	${CP} $< $@

${BUILDDIR}/popup529.js:	${V3SRC}/popup529.js 
	${CP} $< $@

${BUILDDIR}/start_db_tab.js:	${V3SRC}/start_db_tab.js 
	${CP} $< $@

${BUILDDIR}/save_segments.js:	${V3SRC}/save_segments.js 
	${CP} $< $@

${BUILDDIR}/scan_relatives.js:	${V3SRC}/scan_relatives.js 
	${CP} $< $@

${BUILDDIR}/scan_icws.js:	${V3SRC}/scan_icws.js 
	${CP} $< $@

${BUILDDIR}/whatsnew-2_0.html:	${V3SRC}/whatsnew-2_0.html 
	${CP} $< $@

${BUILDDIR}/service.js:	${V3SRC}/service.js
	${CP} $< $@

# addon packages.
${BUILD_UTIL}/FileSaver.js: ${FSDIR}/FileSaver.js
	${CP} $< $@

${BUILD_DBWORKER}/jswasm/sqlite3.wasm: ${SQLITEDIR}/jswasm/sqlite3.wasm ${BUILD_DBWORKER}
	${CP} -rv ${SQLITEDIR}/jswasm	${BUILD_DBWORKER}

${BUILD_UTIL}/papaparse.min.js: ${PAPADIR}/papaparse.min.js
	${CP} $< $@

#  LOGOs/ICONS/images
${BUILD_LOGOS}/529renew-128.png:	${LOGODIR}/529renew-128.png
	${CP} $< $@

${BUILD_LOGOS}/529renew-16.png:	${LOGODIR}/529renew-16.png
	${CP} $< $@

${BUILD_LOGOS}/529renew-19.png:	${LOGODIR}/529renew-19.png
	${CP} $< $@

${BUILD_LOGOS}/529renew-48.png:	${LOGODIR}/529renew-48.png
	${CP} $< $@

${BUILD_LOGOS}/529renew-small-128.png:	${LOGODIR}/529renew-small-128.png
	${CP} $< $@

${BUILD_LOGOS}/529renew.png:	${LOGODIR}/529renew.png
	${CP} $< $@

${BUILD_IMAGES}/529-popup-button.png:	${IMAGEDIR}/529-popup-button.png
	${CP} $< $@

${BUILD_IMAGES}/529-popup-pin.png:	${IMAGEDIR}/529-popup-pin.png
	${CP} $< $@

