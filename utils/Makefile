BUILDDIR	= 529renew-V3
FSDIR	= FileSaver.js-master/dist
V3SRC	= 529renew/src
LOGODIR	= 529renew/logos
ZIPTARGET	= 529renew.zip

LOGOFILES= \
	${BUILDDIR}/529renew-128.png \
	${BUILDDIR}/529renew-16.png \
	${BUILDDIR}/529renew-19.png \
	${BUILDDIR}/529renew-48.png \
	${BUILDDIR}/529renew-small-128.png \
	${BUILDDIR}/529renew.png


CP	= cp -uv

master:	${BUILDDIR} ${LOGOFILES} ${BUILDDIR}/FileSaver.js
	${CP} ${V3SRC}/*.js ${BUILDDIR}
	${CP} ${V3SRC}/*.json ${BUILDDIR}
	${CP} ${V3SRC}/*.html ${BUILDDIR}
	${CP} ${V3SRC}/*.css ${BUILDDIR}

${BUILDDIR}:
	mkdir ${BUILDDIR}

zip:	master
	zip -r ${ZIPTARGET} ${BUILDDIR}

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

