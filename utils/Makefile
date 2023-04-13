BUILDDIR	= 529renew-V3
FSDIR	= FileSaver.js-master/dist
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
	${BUILDDIR}/basicQueue.js \
	${BUILDDIR}/database_actions.js \
	${BUILDDIR}/database_init.js \
	${BUILDDIR}/database_IO.js \
	${BUILDDIR}/results_options.js \
	${BUILDDIR}/results_tab.js \
	${BUILDDIR}/popup529.js \
	${BUILDDIR}/rounding.js \
	${BUILDDIR}/start_db_tab.js \
	${BUILDDIR}/save_segments.js \
	${BUILDDIR}/service.js

LOGOFILES= \
	${BUILDDIR}/529renew-128.png \
	${BUILDDIR}/529renew-16.png \
	${BUILDDIR}/529renew-19.png \
	${BUILDDIR}/529renew-48.png \
	${BUILDDIR}/529renew-small-128.png \
	${BUILDDIR}/529renew.png


CP	= cp -u

master:	${BUILDDIR} ${LOGOFILES} ${BUILDDIR}/FileSaver.js ${MANIFEST} ${CSSFILES} ${HTMLFILES} ${JSFILES} 

${BUILDDIR}:
	mkdir ${BUILDDIR}

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

${BUILDDIR}/basicQueue.js:	${V3SRC}/basicQueue.js 
	${CP} $< $@

${BUILDDIR}/database_actions.js:	${V3SRC}/database_actions.js 
	${CP} $< $@

${BUILDDIR}/database_init.js:	${V3SRC}/database_init.js 
	${CP} $< $@

${BUILDDIR}/database_IO.js:	${V3SRC}/database_IO.js 
	${CP} $< $@

${BUILDDIR}/database_results.js:	${V3SRC}/database_results.js 
	${CP} $< $@

${BUILDDIR}/results_options.js:	${V3SRC}/results_options.js 
	${CP} $< $@

${BUILDDIR}/results_tab.js:	${V3SRC}/results_tab.js 
	${CP} $< $@

${BUILDDIR}/popup529.js:	${V3SRC}/popup529.js 
	${CP} $< $@

${BUILDDIR}/rounding.js:	${V3SRC}/rounding.js 
	${CP} $< $@

${BUILDDIR}/start_db_tab.js:	${V3SRC}/start_db_tab.js 
	${CP} $< $@

${BUILDDIR}/save_segments.js:	${V3SRC}/save_segments.js 
	${CP} $< $@

${BUILDDIR}/service.js:	${V3SRC}/service.js
	${CP} $< $@


${BUILDDIR}/FileSaver.js: ${FSDIR}/FileSaver.js
	${CP} $< $@

${BUILDDIR}/529renew-128.png:	${LOGODIR}/529renew-128.png
	${CP} $< $@

${BUILDDIR}/529renew-16.png:	${LOGODIR}/529renew-16.png
	${CP} $< $@

${BUILDDIR}/529renew-19.png:	${LOGODIR}/529renew-19.png
	${CP} $< $@

${BUILDDIR}/529renew-48.png:	${LOGODIR}/529renew-48.png
	${CP} $< $@

${BUILDDIR}/529renew-small-128.png:	${LOGODIR}/529renew-small-128.png
	${CP} $< $@

${BUILDDIR}/529renew.png:	${LOGODIR}/529renew.png
	${CP} $< $@

