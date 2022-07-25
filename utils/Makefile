BUILDDIR	= 529renew-V3
FSDIR	= FileSaver.js-master/dist
V3SRC	= 529renew/src
LOGODIR	= 529renew/logos
ZIPTARGET	= 529renew.zip

CP	= cp -auv

master:	${BUILDDIR}
	${CP} ${FSDIR}/FileSaver.js ${BUILDDIR}
	${CP} ${V3SRC}/*.js ${BUILDDIR}
	${CP} ${V3SRC}/*.json ${BUILDDIR}
	${CP} ${V3SRC}/*.html ${BUILDDIR}
	${CP} ${V3SRC}/*.css ${BUILDDIR}
	${CP} ${LOGODIR}/*.png ${BUILDDIR}

${BUILDDIR}:
	mkdir ${BUILDDIR}

zip:	master
	zip -r ${ZIPTARGET} ${BUILDDIR}
