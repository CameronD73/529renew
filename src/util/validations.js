/*
* utility routines to apply various validation checks to values within the code
*/
/*eslint no-unused-vars: "off"*/

// ensure the string to be used as a unique ID, is a valid 16-digit hexadecimal value.
function validate_ID( id ) {
	if (id.length != 16 ) throw new Error( `ID ${id} is ${id.length} characters, but it must be exactly 16 characters`);
	const regex = /[^0-9a-fA-F]/;
	let badpos = id.search( regex);
	if ( badpos >= 0 ) {
		badchar = id.substring( badpos, badpos+1 );
		throw new Error( `ID ${id}: invalid character "${badchar}" in ID. Only 0-9 and A-F are valid.`);
	}
	return;
}
