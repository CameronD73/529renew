BUILDDIR	= 529renew-V3n
BUILD_WEBSQL	= ${BUILDDIR}/websql
BUILD_LOGOS	= ${BUILDDIR}/logos
BUILD_UTIL	= ${BUILDDIR}/util
FSDIR	= FileSaver-js/dist
V3SRC	= 529renew/src
LOGODIR	= 529renew/logos
ZIPTARGET	= 529renew.zip

MANIFEST= ${BUILDDIR}/manifest.json
CSSFILES= \
	  ${BUILDDIR}/results_tab.css \
	  ${BUILDDIR}/popup529.css 

HTMLFILES= \
	   ${BUILDDIR}/results_tab.html  \
	   ${BUILDDIR}/popup529.html 

JSFILES= \
	${BUILD_UTIL}/basicQueue.js \
	${BUILD_UTIL}/rounding.js \
	${BUILD_WEBSQL}/database_actions.js \
	${BUILD_WEBSQL}/database_init.js \
	${BUILD_WEBSQL}/database_IO.js \
	${BUILDDIR}/results_options.js \
	${BUILDDIR}/results_tab.js \
	${BUILDDIR}/popup529.js \
	${BUILDDIR}/start_db_tab.js \
	${BUILDDIR}/save_segments.js \
	${BUILDDIR}/whatsnew-1_3.html \
	${BUILDDIR}/service.js

LOGOFILES= \
	${BUILD_LOGOS}/529renew-128.png \
	${BUILD_LOGOS}/529renew-16.png \
	${BUILD_LOGOS}/529renew-19.png \
	${BUILD_LOGOS}/529renew-48.png \
	${BUILD_LOGOS}/529renew-small-128.png \
	${BUILD_LOGOS}/529renew.png


CP	= cp -u

master:	${BUILDDIR} ${BUILD_LOGOS} ${BUILD_UTIL} ${BUILD_WEBSQL} \
		${LOGOFILES} ${BUILD_UTIL}/FileSaver.js ${MANIFEST} ${CSSFILES} ${HTMLFILES} ${JSFILES} 

${BUILDDIR}:
	mkdir -p ${BUILDDIR}

${BUILD_LOGOS}:
	mkdir -p ${BUILD_LOGOS}

${BUILD_WEBSQL}:
	mkdir -p ${BUILD_WEBSQL}

${BUILD_UTIL}:
	mkdir -p ${BUILD_UTIL}

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

${BUILDDIR}/util/basicQueue.js:	${V3SRC}/util/basicQueue.js 
	${CP} $< $@

${BUILD_WEBSQL}/database_actions.js:	${V3SRC}/websql/database_actions.js 
	${CP} $< $@

${BUILD_WEBSQL}/database_init.js:	${V3SRC}/websql/database_init.js 
	${CP} $< $@

${BUILD_WEBSQL}/database_IO.js:	${V3SRC}/websql/database_IO.js 
	${CP} $< $@

${BUILD_WEBSQL}/database_results.js:	${V3SRC}/websql/database_results.js 
	${CP} $< $@

${BUILDDIR}/results_options.js:	${V3SRC}/results_options.js 
	${CP} $< $@

${BUILDDIR}/results_tab.js:	${V3SRC}/results_tab.js 
	${CP} $< $@

${BUILDDIR}/popup529.js:	${V3SRC}/popup529.js 
	${CP} $< $@

${BUILDDIR}/util/rounding.js:	${V3SRC}/util/rounding.js 
	${CP} $< $@

${BUILDDIR}/start_db_tab.js:	${V3SRC}/start_db_tab.js 
	${CP} $< $@

${BUILDDIR}/save_segments.js:	${V3SRC}/save_segments.js 
	${CP} $< $@

${BUILDDIR}/whatsnew-1_3.html:	${V3SRC}/whatsnew-1_3.html 
	${CP} $< $@

${BUILDDIR}/service.js:	${V3SRC}/service.js
	${CP} $< $@


${BUILD_UTIL}/FileSaver.js: ${FSDIR}/FileSaver.js
	${CP} $< $@

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

