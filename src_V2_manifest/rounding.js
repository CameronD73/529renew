/*
* utility routines to apply suitable/required rounding to Mbase and cM values
*/
/*eslint no-unused-vars: "off"*/

// these should later become user options.
let baseRounding = 0;	// the order of magnitude - must be a power of 10
let cMRounding = 2;	// number of decimal places

/* round the chromosome base-pair address
** in: addr - the base address - units (not Mbase)
** returns - the number rounded as required (or not)
*/
function roundBaseAddress(  addr ) {
	if ( baseRounding == 0 )
		return addr;
	return (Math.floor(addr/baseRounding))*baseRounding;
}

function round_cM(  cMvalue ) {
	switch ( cMRounding ) {
		case 2:
			return Math.round(cMvalue * 100) / 100;
		case 1:
			return Math.round(cMvalue * 10) / 10;
	}
	return cMvalue;
}