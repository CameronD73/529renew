/*
* utility routines to apply various validation checks to values within the code
*/
/*eslint no-unused-vars: "off"*/

// ensure the string to be used as a unique ID, is a valid 16-digit hexadecimal value.
function validate_ID( id ) {
	if (id.length != 16 ) throw new Error( `ID ${id} is not exactly 16 characters`);
	const regex = /[^0-9a-fA-F]/;
	if (id.search( regex) >= 0 ) throw new Error( `ID ${id}: invalid characters in ID`);
	return;
}
