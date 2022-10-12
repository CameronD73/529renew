/*
* utility routines to apply suitable/required rounding to Mbase and cM values
* Having made them options, easiest is to ensure they run in extension space only
*/
/*eslint no-unused-vars: "off"*/


/* round the chromosome base-pair address
** in: addr - the base address - units (not Mega-basepairs)
** returns - the number rounded as required (or not)
*/
function roundBaseAddress(  addr ) {
	let baseAddressRounding = settings529.baseAddressRounding;	// the order of magnitude - must be a power of 10
	if ( baseAddressRounding == 0 )
		return addr;
	return (Math.floor(addr/baseAddressRounding))*baseAddressRounding;
}

function round_cM(  cMvalue ) {
	let cMRounding = settings529.cMRounding;	// number of decimal places
	switch ( cMRounding ) {
		case 2:
			return Math.round(cMvalue * 100) / 100;
		case 1:
			return Math.round(cMvalue * 10) / 10;
	}
	return cMvalue;
}