/*
* utility routines to apply suitable/required rounding to Mbase and cM values
* Having made them options, easiest is to ensure they run in extension space only
*/
/*eslint no-unused-vars: "off"*/


/* round the chromosome base-pair address
** in: addr - the base-pair address - integer units (not Mega-basepairs)
** returns - the number rounded as required (or not)
*/
function roundBaseAddress( addr ) {
	return addr;		// no  longer do any rounding. pointless.
	/*
	let baseAddressRounding = settings529.baseAddressRounding;	// the order of magnitude - must be a power of 10
	if ( baseAddressRounding == 0 )
		return addr;
	return (Math.floor(addr/baseAddressRounding))*baseAddressRounding;
	*/
}

function round_cM(  cMvalue ) {
	// switch uses === comparisons, so ensure we are using int values.
	let cMRounding = parseInt(settings529.cMRounding);	// number of decimal places
	switch ( cMRounding ) {
		case 2:
			return Math.round(cMvalue * 100) / 100;
		case 1:
			return Math.round(cMvalue * 10) / 10;
		case 0:
			return Math.round(cMvalue);
	}
	return cMvalue;
}

// converts a base address to Mbase, with rounding suitable for display, not storage.
// math.floor does not round properly, sometimes inventing trailing  1 least sig digit
// parseInt requires string conversion, so we might as well simply use the string form toFixed()
// returns a string representing the base address to 2 dec. places
function base2Mbase( addr ) {
	return ( Number.parseFloat(addr/1000000.0).toFixed(2) );
}

/*
* convert between 23 and Me's percent value and centiMorgans.
* A conversion of approx 74.40cM/pct seems to apply, no matter whether testers are male or female.
*/
function pctShared2cM( pct ) {
	return (pct * 74.4 );
}
function cM2pctShared( cM ){
	return (cM / 74.4 );
}