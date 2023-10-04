/* functions to generate date strings
* First version used for naming files
* second for DB insertion.
* dates only, no time.
*/
function formattedDate(){
	var thisDay=new Date();
	var year=thisDay.getFullYear();
	var month=thisDay.getMonth()+1;
	var date=thisDay.getDate();
	if(month<10) month="0"+month.toString();
	if(date<10) date="0"+date.toString();
	return year.toString()+month.toString()+date.toString();
}

function formattedDate2(){
	return new Date().toISOString().substring(0, 10);
}

function formattedTime(){
	return new Date().toTimeString().substring(0, 8);	// strip off timezone
}

// return the number of seconds since midnight today
function secondsToday() {
	let now = new Date();
	return now.getSeconds() + 60 * ( now.getMinutes() + 60 * now.getHours());
}