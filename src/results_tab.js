/* jshint esversion:6, browser:true, devel:true */
/*eslint no-unused-vars: "off"*/
/* globals  saveAs, create_button, roundBaseAddress, round_cM */
"use strict";

var expectedName=null;		// assigned values in various places but some never used. why?
var expectedName1=null; 	// these are assigned and used (once)
var expectedName2=null;	

var expectedIdStr=null;	// The ID of the profile person selected from the dropdown list (or "all")
var expected_id1=null;	// IDs of testers with possibly overlapping matching segments.
var expected_id2=null;

let selectedPersonID = null;	// user requests "show matches of" to be set to this ID

let db_initialised = false;		// set true once worker messages completion
let db_summary = [];
	// object keys match column names from DB.profiles
	// initial value is something we can create a dummy select list from
let profile_summary = [{IDprofile:"none", pname:"no profiles loaded"}];

// Tables of chromosome lengths in base pairs, and Mbase addresses.
// zero entry is X chromosome.

const clengths_Mbase=[
	155.270560,
	249.250621,
	243.199373,
	198.022430,
	191.154276,
	180.915260,
	171.115067,
	159.138663,
	146.364022,
	141.213431,
	135.534747,
	135.006516,
	133.851895,
	115.169878,
	107.349540,
	102.531392,
	90.354753,
	81.195210,
	78.077248,
	59.128983,
	63.025520,
	48.129895,
	51.304566

];

function ID_is_profile_person( id ) {
	for ( let i = 0 ; i < profile_summary.length; i++ ) {
		if ( profile_summary[i].IDprofile === id ) {
			return true;
		}
	}
	return false;
}

/*
** createMatchSVG
** draws graphical representations of segment lengths and location.
**   Only draws content if a single chromosome is chosen.

** displayMode (first drop-down list on page) determines what is shown when "Create Match Table" is clicked
**	  0:  basic table
**    1: people's names become clickable links
**    2:  append overlapping segment "button" to each line
**    3:  (disabled)enable editing of phase info and relatives.
*/
function createMatchSVG(table){
	var graphNode=document.getElementById("529graph");
	if(graphNode!=null) graphNode.parentNode.removeChild(graphNode);

	if(document.getElementById("chromosome").value==0) return;
	if(document.getElementById("displayMode").value < 2 ) return;

	var outersvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	outersvg.setAttribute("width", "100%");

	var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	outersvg.setAttribute("id", "529graph");
	var svgNS = svg.namespaceURI;

	var clengths= clengths_Mbase;

	function getTableIndex(label){
		var theadrow=table.children[0].children[0];
		for(let i=0; i<theadrow.children.length; i++){
			if(theadrow.children[i].innerText==label) return i;
		}
		return -1;
	}
	var nameIndex=getTableIndex("Name");
	// var phaseIndex=getTableIndex("Phase");
	var matchNameIndex=getTableIndex("Match name");
	var chromosomeIndex=getTableIndex("Chrom.");
	var startIndex=getTableIndex("Start Mb");
	var endIndex=getTableIndex("End Mb");
	var tbody=table.children[1];

	var chromosome;
	for(let i=0; i<tbody.children.length; i++){
		chromosome=tbody.children[i].children[chromosomeIndex].innerText;
		if(chromosome!="") break;
	}
	chromosomeIndex=0;
	if(chromosome!="X") chromosomeIndex=parseInt(chromosome);

	var scale=100.0*clengths[chromosomeIndex]/clengths[1];
	svg.setAttribute("width", scale +"%");

	// Draw the vertical grid lines, pale every 10 MBb and darker each 50.
	for(let i=0; i<250; i+=10){
		if(i>clengths[chromosomeIndex]) break;
		let newLine = document.createElementNS(svgNS,'line');
		let x1x2=i*100.0/clengths[chromosomeIndex];
		newLine.setAttribute('x1',x1x2 + "%");
		newLine.setAttribute('x2',x1x2 + "%");
		newLine.setAttribute('y1', "0%");
		newLine.setAttribute('y2', "100%");
		newLine.setAttribute("stroke", "#DDDDDD");
		svg.appendChild(newLine);
	}
	for(let i=0; i<250; i+=50){
		if(i>clengths[chromosomeIndex]) break;
		let newLine = document.createElementNS(svgNS,'line');
		let x1x2=i*100.0/clengths[chromosomeIndex];
		newLine.setAttribute('x1',x1x2 + "%");
		newLine.setAttribute('x2',x1x2 + "%");
		newLine.setAttribute('y1', "0%");
		newLine.setAttribute('y2', "100%");
		newLine.setAttribute("stroke", "#999999");
		svg.appendChild(newLine);
	}

	// now the block for the header
	let rect = document.createElementNS(svgNS,'rect');
		rect.setAttribute('x', "0%");
		rect.setAttribute('y',0);
		rect.setAttribute('width',"100%");
		rect.setAttribute('height',10);
		svg.appendChild(rect);

	// and the base address legend/title
	for(let i=10; i<250; i+=10){
		if(i>clengths[chromosomeIndex]) break;

			let text= document.createElementNS(svgNS, 'text');
			let x1x2=i*100.0/clengths[chromosomeIndex];

			text.setAttribute('x', x1x2 + "%");
			text.setAttribute('y', 10);
			text.setAttribute('text-anchor', 'middle');
			text.setAttribute('fill', '#FFFFFF');
			text.setAttribute('font-family', 'Times');
			text.appendChild(document.createTextNode(i+"M"));
			svg.appendChild(text);
	}
	var iii=0;

	for(let i=0; i<tbody.children.length; i++){
		var name=tbody.children[i].children[nameIndex].innerText;
		var matchName=tbody.children[i].children[matchNameIndex].innerText;
		var offset = parseFloat(tbody.children[i].children[startIndex].innerText); 
		var width= parseFloat(tbody.children[i].children[endIndex].innerText);
		if(!Number.isNaN(offset)) offset=100.0*offset/clengths[chromosomeIndex];
		if(!Number.isNaN(width)) width=100.0*width/clengths[chromosomeIndex];
		if(!Number.isNaN(offset) && !Number.isNaN(width)) width-=offset;
		{		// draw the box representing matching segment
			let rect = document.createElementNS(svgNS,'rect');
			rect.setAttribute('x', offset + "%");
			rect.setAttribute('y',10*(iii+2));
			rect.setAttribute('width',width + "%");
			rect.setAttribute('height',10);
			let phaseColor='#bbffbb';
			rect.setAttribute('fill',phaseColor);
			svg.appendChild(rect);
		}
		{		// label the box
			let text= document.createElementNS(svgNS, 'text');
			if(offset+width/2.0<50){
					text.setAttribute('x', offset + "%");
			}
			else{
				text.setAttribute('x',offset+width + "%");
				text.setAttribute('text-anchor', 'end');
			}
			text.setAttribute('y',10*(iii+2));
			text.setAttribute('font-family', 'Times');
			text.setAttribute('height',6);
			text.appendChild(document.createTextNode(name + " <-> " + matchName));
			svg.appendChild(text);
		}
		iii+=2;
	}

	svg.setAttribute('height', 10*(iii+4));
	outersvg.setAttribute('height', 10*(iii+4));

	outersvg.appendChild(svg);
		document.body.appendChild(outersvg);

}

/*
** createSVG - creates the graphical display showing overlapping segments.
** Note the input:  it takes the HTMLCollection table structure instead of the raw data objects.
** WHY?!?
*/
function createSVG(table){
	var graphNode=document.getElementById("529graph");
	if(graphNode!=null) graphNode.parentNode.removeChild(graphNode);

	var outersvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	outersvg.setAttribute("width", "100%");

	var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	outersvg.setAttribute("id", "529graph");
	var svgNS = svg.namespaceURI;
	var clengths= clengths_Mbase;

	function getTableIndex(label){
		let theadrow=table.children[0].children[0];
		for(let i=0; i<theadrow.children.length; i++){
			if(theadrow.children[i].innerText==label) return i;
		}
		return -1;
	}
	function getSecondRef(tbody, firstRef, nameIndex){
		for(let i=0; i<tbody.children.length; i++){
			if(tbody.children[i].children[nameIndex].children[0].href!=firstRef) return tbody.children[i].children[nameIndex].children[0].href;
		}
	}
	function partnerWasCompared(tbody, rowIndex, otherRef, matchRef, nameIndex, matchNameIndex, startIndex){
		for(let i=rowIndex-1; i>-1; i--){
			let currentNameRef=tbody.children[i].children[nameIndex].children[0].href;
			if(currentNameRef!=otherRef) continue;
			let currentMatchRef=tbody.children[i].children[matchNameIndex].children[0].href;
			if(currentMatchRef!=matchRef) break;
			if(tbody.children[i].children[startIndex].innerText=="?") return false;
			return true;
		}
		for(let i=rowIndex+1; i<tbody.children.length; i++){
			let currentNameRef=tbody.children[i].children[nameIndex].children[0].href;
			if(currentNameRef!=otherRef) continue;
			let currentMatchRef=tbody.children[i].children[matchNameIndex].children[0].href;
			if(currentMatchRef!=matchRef) break;
			if(tbody.children[i].children[startIndex].innerText=="?") return false;
			return true;
		}
		return false;
	}

	var nameIndex=getTableIndex("Name");
	var matchNameIndex=getTableIndex("Match name");
	var chromosomeIndex=getTableIndex("Chrom.");
	var startIndex=getTableIndex("Start Mb");
	var endIndex=getTableIndex("End Mb");
	var reloadIndex=getTableIndex("Date")+1;
	var tbody=table.children[1];
	var firstRef=tbody.children[0].children[nameIndex].children[0].href;
	var secondRef=getSecondRef(tbody, firstRef, nameIndex);



	var chromosome;
	for(let i=0; i<tbody.children.length; i++){
		chromosome=tbody.children[i].children[chromosomeIndex].innerText;
		if(chromosome!="") break;
	}
	chromosomeIndex=0;
	if(chromosome!="X") chromosomeIndex=parseInt(chromosome);

	var scale=100.0*clengths[chromosomeIndex]/clengths[1];
	svg.setAttribute("width", scale +"%");


	for(let i=0; i<250; i+=10){
		if(i>clengths[chromosomeIndex]) break;
		let newLine = document.createElementNS(svgNS,'line');
		let x1x2=i*100.0/clengths[chromosomeIndex];
		newLine.setAttribute('x1',x1x2 + "%");
		newLine.setAttribute('x2',x1x2 + "%");
		newLine.setAttribute('y1', "0%");
		newLine.setAttribute('y2', "100%");
		newLine.setAttribute("stroke", "#DDDDDD");
		svg.appendChild(newLine);
	}
	for(let i=0; i<250; i+=50){
		if(i>clengths[chromosomeIndex]) break;
		let newLine = document.createElementNS(svgNS,'line');
		let x1x2=i*100.0/clengths[chromosomeIndex];
		newLine.setAttribute('x1',x1x2 + "%");
		newLine.setAttribute('x2',x1x2 + "%");
		newLine.setAttribute('y1', "0%");
		newLine.setAttribute('y2', "100%");
		newLine.setAttribute("stroke", "#999999");
		svg.appendChild(newLine);
	}

	let rect = document.createElementNS(svgNS,'rect');
		rect.setAttribute('x', "0%");
		rect.setAttribute('y',0);
		rect.setAttribute('width',"100%");
		rect.setAttribute('height',10);
		svg.appendChild(rect);

	for(let i=10; i<250; i+=10){
		if(i>clengths[chromosomeIndex]) break;

			let text= document.createElementNS(svgNS, 'text');
			let x1x2=i*100.0/clengths[chromosomeIndex];

			text.setAttribute('x', x1x2 + "%");
			text.setAttribute('y', 10);
			text.setAttribute('text-anchor', 'middle');
			text.setAttribute('font-family', 'Times');
			text.setAttribute('fill', '#FFFFFF');
			text.appendChild(document.createTextNode(i+"M"));
			svg.appendChild(text);
	}

	var iii=0;
	var priorNameRef=null;
	var priorMatchRef=null;
	var priorOffset=null;
	var priorWidth=null;
	for(let i=0; i<tbody.children.length; i++){
		let matchName=tbody.children[i].children[matchNameIndex].innerText;
		let nameRef=tbody.children[i].children[nameIndex].children[0].href;
		let matchRef=tbody.children[i].children[matchNameIndex].children[0].href;
		var offset = parseFloat(tbody.children[i].children[startIndex].innerText); 
		var width= parseFloat(tbody.children[i].children[endIndex].innerText);
		if(!Number.isNaN(offset)) offset=100.0*offset/clengths[chromosomeIndex];
		if(!Number.isNaN(width)) width=100.0*width/clengths[chromosomeIndex];
		if(!Number.isNaN(offset) && !Number.isNaN(width)) width-=offset;

		if(nameRef==firstRef){
			if(!Number.isNaN(offset) && !Number.isNaN(width)){
				if(priorNameRef!=nameRef || priorMatchRef!=matchRef || priorOffset!=offset || priorWidth!=width){

					if(priorNameRef!=nameRef || matchRef!=priorMatchRef) iii++;
					if(priorNameRef!=nameRef && matchRef!=priorMatchRef) iii++;
					if(priorNameRef==nameRef && matchRef!=priorMatchRef) iii++;
					let rect = document.createElementNS(svgNS,'rect');
						rect.setAttribute('x', offset + "%");
						rect.setAttribute('y',10*(iii+2));
						rect.setAttribute('width',width + "%");
						rect.setAttribute('height',10);
						if(partnerWasCompared(tbody, i, secondRef, matchRef, nameIndex, matchNameIndex, startIndex)){
							rect.setAttribute('fill','#95B3D7');
						}
						else{
							rect.setAttribute('fill','#CAE1EB');
						}

					if(tbody.children[i].children[reloadIndex].innerText=="reload") rect.setAttribute('fill','#FF8888');
					svg.appendChild(rect);

					if(matchRef!=priorMatchRef){
						let text= document.createElementNS(svgNS, 'text');
						if(offset+width/2.0<50){
								text.setAttribute('x', offset + "%");
						}
						else{
							text.setAttribute('x',offset+width + "%");
							text.setAttribute('text-anchor', 'end');
						}
						text.setAttribute('y',10*(iii+2));
						text.setAttribute('font-family', 'Times');
						text.setAttribute('height',6);
						if(tbody.children[i].children[reloadIndex].innerText=="reload"){
								let chrTxt="Chr X";
								if(chromosomeIndex>0) chrTxt="Chr " + chromosomeIndex.toString();
								text.appendChild(document.createTextNode(chrTxt+ ": " + tbody.children[i].children[nameIndex].innerText + "/" + matchName));
						}
						else{
							text.appendChild(document.createTextNode(matchName));
						}
						svg.appendChild(text);
					}
					priorNameRef=nameRef;
					priorMatchRef=matchRef;
					priorOffset=offset;
					priorWidth=width;
				}
			}
		}
		else{
			if(!Number.isNaN(offset) && !Number.isNaN(width)){

				if(priorNameRef!=nameRef || priorMatchRef!=matchRef || priorOffset!=offset || priorWidth!=width){
					if(priorNameRef!=nameRef || matchRef!=priorMatchRef) iii++;
					if(priorNameRef!=nameRef && matchRef!=priorMatchRef) iii++;
					if(priorNameRef==nameRef && matchRef!=priorMatchRef) iii++;
					let rect = document.createElementNS(svgNS,'rect');
						rect.setAttribute('x', offset + "%");
						rect.setAttribute('y',10*(iii+2));
						rect.setAttribute('width',width + "%");
						rect.setAttribute('height',10);
						if(partnerWasCompared(tbody, i, firstRef, matchRef, nameIndex, matchNameIndex, startIndex)){
							rect.setAttribute('fill','#D7B395');
						}
						else{
							rect.setAttribute('fill','#EBE1CA');
						}
					if(tbody.children[i].children[reloadIndex].innerText=="reload") rect.setAttribute('fill','#FF8888');
					svg.appendChild(rect);

					if(matchRef!=priorMatchRef){
						let text= document.createElementNS(svgNS, 'text');
						if(offset+width/2.0<50){
								text.setAttribute('x', offset + "%");
						}
						else{
							text.setAttribute('x',offset+width + "%");
							text.setAttribute('text-anchor', 'end');
						}
						text.setAttribute('y',10*(iii+2));
						text.setAttribute('font-family', 'Times');
						text.setAttribute('height',6);
						if(tbody.children[i].children[reloadIndex].innerText=="reload"){
								let chrTxt="Chr X";
								if(chromosomeIndex>0) chrTxt="Chr " + chromosomeIndex.toString();
								text.appendChild(document.createTextNode(chrTxt+ ": " + tbody.children[i].children[nameIndex].innerText + "/" + matchName));
						}
						else{
							text.appendChild(document.createTextNode(matchName));
						}
						svg.appendChild(text);
					}
					priorNameRef=nameRef;
					priorMatchRef=matchRef;
					priorOffset=offset;
					priorWidth=width;
				}
			}
		}

	}
	svg.setAttribute('height', 10*(iii+4));
	outersvg.setAttribute('height', 10*(iii+4));

	outersvg.appendChild(svg);
		document.body.appendChild(outersvg);
}


var phaseColors=["#FFFFFF", "#FFDDDD", "#DDDDFF", "#FFFFDD", "#DDDDDD"];

/* 
** =======   Create row of buttons for output
*/
function createMatchTableButton( ){
	let newButton=document.createElement('button');
	newButton.innerHTML="Create Match Table";
	newButton.title="Shift-click to color code buttons (orange=unchecked matches, green=all matches checked, Alt-click to show matches since last csv save)";
	newButton.setAttribute("type","button");
	newButton.addEventListener('click', function(evt){requestSelectFromDatabase(evt.shiftKey, evt.altKey);});
	document.getElementById("buttonOutRow").appendChild(newButton);
}

function createCSVButton( ){
	let newButton=document.createElement('button');
	newButton.innerHTML="D'load segment update";
	newButton.title="Always includes 23andMe ID's; Shift-click to include all previously exported; Alt-click to also include non-match info";
	newButton.setAttribute("type","button");
	newButton.addEventListener('click', function(evt){requestSelectFromDatabaseForCSV(evt.shiftKey, evt.altKey);});
	document.getElementById("buttonOutRow").appendChild(newButton);
}
function createGEXFButton( ){
	let newButton=document.createElement('button');
	newButton.innerHTML="Download GEXF";
	newButton.setAttribute("type","button");
	newButton.addEventListener('click', function(){requestSelectFromDatabaseForGEXF();});
	document.getElementById("buttonOutRow").appendChild(newButton);
}
function createSVGButton( ){
	let newButton=document.createElement('button');
	newButton.innerHTML="Download SVG";
	newButton.setAttribute("type","button");
	newButton.addEventListener('click', function(){downloadSVG();});
	document.getElementById("buttonOutRow").appendChild(newButton);
}
/*
** buttons for exporting 23andMe data, apart from DNA segments
*/
function create23CSVButton( ){
	let newButton=document.createElement('button');
	newButton.innerHTML="D'load 23andMe CSV";
	newButton.title="Downloads a CSV relatives file for the profile person selected above, in 23andMe format (approximately)";
	newButton.setAttribute("type","button");
	newButton.addEventListener('click', function(evt){requestSelectFromDatabaseFor23CSV('c', evt.shiftKey, evt.altKey);});
	document.getElementById("buttonOut23Row").appendChild(newButton);
}
function create23TSVButton( ){
	let newButton=document.createElement('button');
	newButton.innerHTML="D'load 23andMe TSV";
	newButton.title="Downloads a TAB-separated relatives file for the profile person selected above, in 23andMe format (approximately)";
	newButton.setAttribute("type","button");
	newButton.addEventListener('click', function(evt){requestSelectFromDatabaseFor23CSV('t', evt.shiftKey, evt.altKey);});
	document.getElementById("buttonOut23Row").appendChild(newButton);
}
function create23ICWButton( ){
	let newButton=document.createElement('button');
	newButton.innerHTML="D'load 23andMe ICW";
	newButton.title="Downloads a TSV file for the in-common matches to the profile person selected above";
	newButton.setAttribute("type","button");
	newButton.addEventListener('click', function(evt){requestSelectICWFromDatabaseForCSV( evt.shiftKey, evt.altKey);});
	document.getElementById("buttonOut23Row").appendChild(newButton);
}

function createGDATRelsButton( ){
	let newButton=document.createElement('button');
	newButton.innerHTML="D'load GDAT Relatives CSV";
	newButton.title="Downloads a CSV file with DNA Relatives for the profile person selected above, for import into GDAT";
	newButton.setAttribute("type","button");
	newButton.addEventListener('click', function(evt){requestSelectRelsforGDAT(evt.shiftKey, evt.altKey);});
	document.getElementById("buttonOut23Row").appendChild(newButton);
}
function createGDATICWButton( ){
	let newButton=document.createElement('button');
	newButton.innerHTML="D'load GDAT ICW";
	newButton.title="Downloads a CSV file for all  matches excluding profile kits";
	newButton.setAttribute("type","button");
	newButton.addEventListener('click', function(evt){requestSelectICWforGDAT( evt.shiftKey, evt.altKey);});
	document.getElementById("buttonOut23Row").appendChild(newButton);
}
/*
** =======  rows of buttons for DB operations
*/
function createDBDumpButton(){
	let newButton=document.createElement('button');
	newButton.innerHTML="Backup Sqlite DB";
	newButton.title="Export the internal database to your computer's filesystem";
	newButton.setAttribute("type", "button");
	newButton.addEventListener('click', function(){askDumpSqlite3DB();});
	document.getElementById("buttonDBRow").appendChild(newButton);
}

function createDBRestoreButton(){
	let newButton=document.createElement('button');
	newButton.innerHTML="Restore Sqlite DB";
	newButton.title="Restore the internal database from a backup on your computer's filesystem";
	newButton.setAttribute("type", "button");
	newButton.addEventListener('click', ()=> {
		if ( confirm('This will destroy all data in the current DB and\noverwrite with previously backed up file. Are you sure?') ) 
			document.getElementById("upfile-restore").click();

	} );
	document.getElementById("buttonDBRow").appendChild(newButton);
	document.getElementById("upfile-restore").addEventListener('change',(evt)=>{askRestoreSqlite3DB(evt);});
}

function createDeleteWASMButton(){
	let newButton=document.createElement('button');
	newButton.innerHTML="Delete 529Renew DB";
	newButton.title='Delete internal DB of all saved DNA data collected by 529Renew';
	newButton.setAttribute("type","button");
	newButton.addEventListener('click', requestDeletionFromDatabase);
	document.getElementById("buttonDBRow").appendChild(newButton);
}

/*
** =======   Create row of buttons for import, etc
*/
function createImportProfileButton(){
	let newButton=document.createElement('button');
	newButton.innerHTML="Import DNA kit list";
	newButton.title='Import a CSV file that contains ID and name of 23andMe kits that you manage (You create list by hand)';
	newButton.setAttribute("type","button");
	newButton.addEventListener('click', function(){document.getElementById("upprofile").click();});
	document.getElementById("buttonInRow").appendChild(newButton);
	document.getElementById("upprofile").addEventListener('change', requestImportProfiles);
}

function createImport23Button(){
	let newButton=document.createElement('button');
	newButton.innerHTML="Import 23+Me CSV";
	newButton.title='Import one or more CSV files previously saved from 23andMe "DNA Relatives download"';
	newButton.setAttribute("type","button");
	newButton.addEventListener('click', function(){
		if ( profile_summary[0].IDprofile === 'none') {
			alert( "no profiles defined");
		} else {
			document.getElementById("upfile23").click();
		}
	});
	document.getElementById("buttonInRow").appendChild(newButton);
	document.getElementById("upfile23").addEventListener('change', requestImport23CSV);
}


function createOverlapCalcButton(){
	let newButton=document.createElement('button');
	newButton.innerHTML="Calculate overlaps ";
	newButton.title='This identifies segment overlaps from old data. It is safe to run multiple times.';
	newButton.setAttribute("type","button");
	newButton.addEventListener('click', requestOverlapCalculation );
	document.getElementById("buttonInRow").appendChild(newButton);
}

function createImport529Button(){
	let newButton=document.createElement('button');
	newButton.innerHTML="Import 529 CSV";
	newButton.title='Import a CSV file that was previously exported from 529renew';
	newButton.setAttribute("type","button");
	newButton.addEventListener('click', function(){document.getElementById("upfile529").click();});
	document.getElementById("buttonInRow").appendChild(newButton);
	document.getElementById("upfile529").addEventListener('change', requestImport529CSV);
}

/* ========= end of button creation ============= */

function clearFilterText() {
	var ftb =  document.getElementById("selectNameFilter");
	if ( ftb.value.length > 0 ) { 
		ftb.value="";
	}
	document.getElementById("clearFilterButton").style.visibility="hidden";
	getFilteredMatchesFromDatabase( '' );
}

function createClearFilterButton(){
	let newButton=document.createElement('button');
	newButton.innerHTML="Clear filter";
	newButton.id="clearFilterButton";
	newButton.setAttribute("type", "button");
	newButton.style.visibility="hidden";
	newButton.addEventListener('click', clearFilterText );
	document.getElementById("filterDiv").appendChild(newButton);
}


function resetAfterDeletion(){
	getFilteredMatchesFromDatabase( '' );
	requestSelectFromDatabase(false, false);
	alert("All data stored in your 529renew local database has been deleted");
}
function setDisplayModeSelector(){
	let widget=document.getElementById("displayMode");
	widget.value=getSetting( "displayMode" );
	widget.onchange=function(){
		setSetting( "displayMode", widget.value);
		if(document.getElementById("table_div").hasChildNodes()){
			requestSelectFromDatabase(false, false);
		}
	};
}
function setTextSizeSelector(){
	function setTextSizeLocal(){
		let desiredSize=getSetting( "textSize" );
		let smallCSS=null;
		for(let i=0; i<document.styleSheets.length; i++){
			if(document.styleSheets[i].title=="Small"){
				smallCSS=document.styleSheets[i];
				break;
			}
		}
		if(smallCSS){
			if(desiredSize=="small") smallCSS.disabled=false;
			else smallCSS.disabled=true;
		}
	}
	var widget=document.getElementById("textSize");
	widget.value=getSetting( "textSize" );
	widget.onchange=function(){
		setSetting( "textSize", widget.value);
		setTextSizeLocal();
	};
	setTextSizeLocal();
}

function setOmitAliasesCheckBox(){
	var widget=document.getElementById("omitAliasesCheckBox");
	widget.checked=getSetting( "omitAliases");
	widget.onclick=function(){
		setSetting( "omitAliases", widget.checked);
	};
}
function setHideCloseMatchesCheckBox(){
	var widget=document.getElementById("hideCloseMatchesCheckBox");
	widget.checked=getSetting( "hideCloseMatches" );
	widget.onclick=function(){
		setSetting( "hideCloseMatches", widget.checked);
	};
}

/*
** update the selected match name to this ID.
** - unfortunately, we don't know if the filter has resulted in a shorter
** list that does not include the selected person, so just unconditionally 
** clear the filter and follow through to then assign the selected person,
** which is based on the global var selectedPersonID.
*/
function updateSelectedNameViaMsg(idstr) {
	if ( idstr.length == 16 ) {
		// used the ID passed in the call
		selectedPersonID = idstr;
	} else {
		console.error( `Results_tab: updateSelectedNameViaMsg called with idstr '${idstr}' unexpected.`)
		return;
	}
	clearFilterText();		// this will cascade into reloading full match list.
}
/*
** this part will assign the required ID to the select list. AFTER the list
** has been rebuilt
*/
function finaliseUpdateSelectedName( ) {
	let idstr = null;
	if ( selectedPersonID !== null ) {
		// used the ID passed earlier
		 idstr = selectedPersonID;
		 selectedPersonID = null;
	} else if(window.location.search.length==20) {
		// otherwise check for any parameter in the url (deprecated, but 
		// still used by the link buttons under "create match table"
		idstr = window.location.search.substring(4);
	} else {
		return;
	}
	document.getElementById("selectName").value = idstr;
}

// This is the function called after the DB search of names (possibly filtered)
// each row of the results gives the "name" and the "id" as a string
function createNameSelector(results){

	// Remove existing nodes
	var el=document.getElementById("selectName");
	while(el.hasChildNodes()){
		el.removeChild(el.lastChild);
	}
	// add new nodes
	{
		let op=document.createElement('option');
		el.appendChild(op);
		op.value="all";
		op.text="All";
		op.selected=true;
	}
	// create list of names from db query return
	// each row is an object with name, IDText
	for(let i=0; i<results.length; i++){
		let row = results[i];	
		let op=document.createElement('option');
		op.text=row.name;
		op.value=row.IDText;
		el.appendChild(op);
	}
	// now that we have updated the name list we can assign the required person.
	finaliseUpdateSelectedName(  );
}

// This is the return from the DB search of names (possibly filtered)
// parameters have been saved to the global profile_summary
function createKitSelector( ){
	// Remove existing nodes
	var el=document.getElementById("selectKit");
	while(el.hasChildNodes()){
		el.removeChild(el.lastChild);
	}
	// create list of profile names 
	
	for(let i=0; i<profile_summary.length; i++){
		let row = profile_summary[i];
		let op=document.createElement('option');
		op.value=row.IDprofile;
		op.text=row.pname;
		el.appendChild(op);
	}
}

function colorizeButton( resultRows, buttondata ) {
	let button = buttondata.button;
	let cid1 = buttondata.id1;
	let cid2 = buttondata.id2;
	var cmatchIds1=new Array();
	var cnonmatchIds1=new Array();
	var cmatchIds2=new Array();
	var cnonmatchIds2=new Array();
	var sharingIds=new Array();
	let nrows = resultRows.length;
	{
		let ci;
		for(ci=0; ci<nrows; ci++){
			let crow = resultRows.item(ci);
			if((ci+1)<nrows){
				if(resultRows.item(ci+1).ROWID==crow.ROWID){
					continue;
				}
			}
			if(cid1==crow.id1){
				// ID1 is listed first in match
				if(cid2!=crow.id2 ){
					// ID2 is not listed second in match
					let cid = crow.id2;
					{
						if(crow.chromosome==100){
							if(cnonmatchIds1.indexOf(cid)==-1) cnonmatchIds1.push(cid);
						}
						else{
							if(cmatchIds1.indexOf(cid)==-1) cmatchIds1.push(cid);
						}
					}
				}
			}
			else if(cid1==crow.id2){
				// ID1 is listed second in match
				if(cid2!=crow.id1){
					// ID2 is not listed first in match
					let cid=crow.id1;
					{
						if(crow.chromosome==100){
							if(cnonmatchIds1.indexOf(cid)==-1) cnonmatchIds1.push(cid);
						}
						else{
							if(cmatchIds1.indexOf(cid)==-1) cmatchIds1.push(cid);
						}
					}
				}
			}
			else if(cid2==crow.id1){
				// ID2 is listed first in match
				if(cid1!=crow.id2){
					// ID1 is not listed secon in match
					let cid = crow.id2;
					{
						if(crow.chromosome==100){
							if(cnonmatchIds2.indexOf(cid)==-1) cnonmatchIds2.push(cid);
						}
						else{
							if(cmatchIds2.indexOf(cid)==-1) cmatchIds2.push(cid);
						}
					}
				}
			}
			else if(cid2==crow.id2){
				// ID2 is listed second in match
				if(cid1!=crow.id1){
					//ID1 is not listed first in match
					let cid = crow.id1;
					{
						if(crow.chromosome==100){
							if(cnonmatchIds2.indexOf(cid)==-1) cnonmatchIds2.push(cid);
						}
						else{
							if(cmatchIds2.indexOf(cid)==-1) cmatchIds2.push(cid);
						}
					}
				}
			}
		}
	}
	{
		for(let ci=0; ci<cmatchIds1.length; ci++){
			if(cmatchIds2.indexOf(cmatchIds1[ci])==-1 && cnonmatchIds2.indexOf(cmatchIds1[ci])==-1){
				button.style.background='darkorange';
				return;
			}
		}
	}
	{
		for(let ci=0; ci<cmatchIds2.length; ci++){
			if(cmatchIds1.indexOf(cmatchIds2[ci])==-1 && cnonmatchIds1.indexOf(cmatchIds2[ci])==-1){
				button.style.background='darkorange';
				return;
			}
		}
	}
	button.style.background='darkgreen';
}

/*
** createTable12
** does the bulk of the processing after the big join
** Lays out the "Match Table" for the selected person.
*/
function createTable12( resultRows, colorize){
	var graphNode=document.getElementById("529graph");
	if(graphNode!=null) graphNode.parentNode.removeChild(graphNode);


	var omitAliases=getSetting( "omitAliases");
	var hideCloseMatches=getSetting( "hideCloseMatches" );


	if(hideCloseMatches && document.getElementById("selectName").selectedIndex==0) hideCloseMatches=false;

	var displayMode=document.getElementById("displayMode");
	var showURL=(displayMode.value>0);
	var enableShowSegments=(displayMode.value>1);
	let nrows = resultRows.length;


	// Remove any preexisting table and other content
	logHtmlClear();
	while(document.getElementById("table_div").hasChildNodes()){
		document.getElementById("table_div").removeChild(document.getElementById("table_div").children[0]);
	}
	if(nrows>5000){
		if(!confirm("Display " + nrows + " matching segments? That could take a while.")) return;
	}
	db_conlog( 1, `CreateTable12-query returned ${nrows} rows.`)
	var table=document.createElement("table");

	document.getElementById("table_div").appendChild(table);

	var suppressed_ids=null;
	if(hideCloseMatches && nrows>21){
		let ids=new Array();
		let counts=new Array();

		for(let i=0; i<nrows; i++){

			let row = resultRows[i];
			if(!row.chromosome) break;
			if(row.chromosome==100) break;
			if((i+1)<nrows){
				// I don't understand what this is trying to do - two consecutive rows derived from the one segment match pair.
				if(resultRows[i+1].ROWID==row.ROWID) continue;
			}
			let curr_id;
			if(expectedIdStr==row.id2)
				curr_id=row.id1;
			else
				curr_id=row.id2;
			{
				let j=0;
				for (; j<ids.length; j++){
					if(curr_id==ids[j] ){
						counts[j]=counts[j]+1;
						break;
					}
				}
				if (j==ids.length){
					ids.push(curr_id);
					counts.push(1);
				}
			}
		}
		let found_close = false;
		for(let i=0; i<ids.length; i++){
			if(counts[i]>21){
				if( !found_close ) {
					suppressed_ids=new Array();
					found_close = true;
				}
				suppressed_ids.push(ids[i]);
			}
		}
	}

	let ii=-1;
	for(let i=0; i<nrows; i++) {

		let row = resultRows[i];
		if(!row.chromosome) break;
		if(row.chromosome==100) break;

		if(omitAliases){
			if((i+1)<nrows){
				if(resultRows[i+1].ROWID==row.ROWID) continue;
			}
		}
		if(suppressed_ids){
			let curr_id=null;
			if(expectedIdStr==row.id2)
				curr_id=row.id1;
			else
				curr_id=row.id2;

			let j=0;
			for (; j< suppressed_ids.length; j++){
				if(curr_id==suppressed_ids[j] ){
					break;
				}
			}
			if(j< suppressed_ids.length) continue;
		}

		ii++;

		let tablerow = table.insertRow(ii);

		let curColumnId=0;

		if(expectedIdStr==row.id2){

			if(showURL && row.id2){

				let link = document.createElement("a");
				link.setAttribute("href", "https://you.23andme.com/profile/" + row.id2 +"/");
				link.setAttribute("target", "_blank");
				link.innerHTML=row.name2;
				link.className=  ID_is_profile_person( row.id2 ) ? "special-profile": "special";
				(tablerow.insertCell(curColumnId++)).appendChild(link);
			}
			else (tablerow.insertCell(curColumnId++)).innerHTML=row.name2;

			if(showURL && row.id1){

				let link = document.createElement("a");
				link.setAttribute("href", chrome.runtime.getURL('results_tab.html')+"?id=" + row.id1);
				link.setAttribute("target", "_blank");
				link.innerHTML=row.name1;
				link.className=  ID_is_profile_person( row.id1 ) ? "special-profile": "special";
				(tablerow.insertCell(curColumnId++)).appendChild(link);
			}
			else (tablerow.insertCell(curColumnId++)).innerHTML=row.name1;

		}
		else{
			if(showURL && row.id1){

				let link = document.createElement("a");
				link.setAttribute("href", "https://you.23andme.com/profile/" + row.id1 +"/");

				link.setAttribute("target", "_blank");
				link.innerHTML=row.name1;
				link.className=  ID_is_profile_person( row.id1 ) ? "special-profile": "special";
				(tablerow.insertCell(curColumnId++)).appendChild(link);
			}
			else (tablerow.insertCell(curColumnId++)).innerHTML=row.name1;


			if(showURL && row.id2){

				let link = document.createElement("a");
				link.setAttribute("href", chrome.runtime.getURL('results_tab.html')+"?id=" + row.id2);
				link.setAttribute("target", "_blank");
				link.innerHTML=row.name2;
				link.className=  ID_is_profile_person( row.id2 ) ? "special-profile": "special";
				(tablerow.insertCell(curColumnId++)).appendChild(link);
			}
			else (tablerow.insertCell(curColumnId++)).innerHTML=row.name2;
		}
		{
			let tcell=tablerow.insertCell(curColumnId++);
			tcell.className="center";
			if(row.chromosome==23){
				tcell.innerHTML="X";
			}
			else{
				tcell.innerHTML=row.chromosome;
			}
		}
		{
			let tcell=tablerow.insertCell(curColumnId++);
			tcell.className="right";
			tcell.innerHTML=base2Mbase(row.start);
		}
		{
			let tcell=tablerow.insertCell(curColumnId++);
			tcell.className="right";
			tcell.innerHTML=base2Mbase(row.end);
		}
		{
			let tcell=tablerow.insertCell(curColumnId++);
			tcell.className="right";
			// normally will be already rounded, but sometimes not.
			tcell.innerHTML=" " + round_cM(row.cM) + " ";
		}
		{
			let tcell=tablerow.insertCell(curColumnId++);
			tcell.className="right";
			tcell.innerHTML=row.snps;
		}
		{
			let tcell=tablerow.insertCell(curColumnId++);
			tcell.className="right";
			tcell.innerHTML=row.segdate;
		}
		if(enableShowSegments){
			function makeLink(id, name1, name2, id1, id2){
				return function(){
					displayMatchingSegments(id, name1, name2, id1, id2);
				};
			}
			let button = document.createElement("button");
			button.className="special";
			button.onclick=makeLink(row.ROWID, row.name1, row.name2, row.id1, row.id2);
			button.innerHTML="show overlapping segments";
			(tablerow.insertCell(curColumnId++)).appendChild(button);
			if( colorize ){
				selectSegmentMatchesFromDatabase('colorizeButton', {button:button, id1:row.id1, id2:row.id2}, row.ROWID);
			}
		}
	}
	// Creating the header after the body prevents rows from being inserted into header
	var tablehead=table.createTHead();
	var tableheadrow=tablehead.insertRow(0);
	tableheadrow.className="center";
	{
		let curColumnId=0;
		(tableheadrow.insertCell(curColumnId++)).innerHTML="Name";
		(tableheadrow.insertCell(curColumnId++)).innerHTML="Match name";
		(tableheadrow.insertCell(curColumnId++)).innerHTML="Chrom.";
		(tableheadrow.insertCell(curColumnId++)).innerHTML="Start Mb";
		(tableheadrow.insertCell(curColumnId++)).innerHTML="End Mb";
		(tableheadrow.insertCell(curColumnId++)).innerHTML="cM";
		(tableheadrow.insertCell(curColumnId++)).innerHTML="#SNPs";
		(tableheadrow.insertCell(curColumnId++)).innerHTML="Date";
		if(enableShowSegments) (tableheadrow.insertCell(curColumnId++)).innerHTML="";
	}
	createMatchSVG(table);
}

function createCSV12( resultRows,  includeNonMatch){


	var omitAliases=getSetting( "omitAliases");

	var csvarray=new Array();
	csvarray.push("Name, Match name, Chromosome, Start point, End point, Genetic distance, # SNPs, ID, Match ID\n");

	let nrows = resultRows.length;
	var theName=null;

	for(let i=0; i<nrows; i++) {	//nrows

		let row = resultRows[i];
		if(!row.chromosome) break;
		if(row.chromosome==100 && !includeNonMatch) break;

		if(omitAliases){
			if((i+1)<nrows){
				if(resultRows[i+1].ROWID==row.ROWID) continue;
			}
		}
		let name=null;
		let matchName=null;
		let id=null;
		let matchId=null;
		let chromosome=null;
		let startPoint=row.start;
		let endPoint=row.end;
		let geneticDistance=row.cM;
		let snps=row.snps;

		// trim the names to avoid csv and string delimiters inside name fields.
		let name_a = row.name1.replace(/,/g,'').replace(/"/g,'').replace(/'/g,'');
		let name_b = row.name2.replace(/,/g,'').replace(/"/g,'').replace(/'/g,'');

		if(expectedIdStr==row.id2){
			name = name_b;
			id=row.id2;
			matchName = name_a;
			matchId=row.id1;
		}
		else{
			name=name_a;
			id=row.id1;
			matchName = name_b;
			matchId=row.id2;
		}
		if(row.chromosome==23){
			chromosome="X";
		}
		else{
			chromosome=row.chromosome;
		}


		if(i==0) theName=name;
		else{
			if(name!=theName) theName=null;
		}

		csvarray.push(name+","+matchName+","+chromosome+","+startPoint+","+endPoint+","+geneticDistance+","+snps+","+id+","+matchId+"\n");

	}
	if(theName){
		theName=theName.replace(/ /g,"_");
		theName=theName.replace(/\./g,'_');
		theName="_"+theName;
	}
	else theName="";

	var blob = new Blob(csvarray, {type: "text/plain;charset=utf-8"});
	saveAs(blob, "529renew" + theName+ "_" + formattedDate()+ ".csv");

	// only record the date exported when we save all testers and all chromosomes
	let chromosome = parseInt( document.getElementById("chromosome").options[document.getElementById("chromosome").selectedIndex].value );
	if ( expectedIdStr == 0 && chromosome == 0 )
		setSetting( "lastCSVExportDate", formattedDate2() );
}

/*
** create the CSV file in 23andMe format, using content returned from the DB select
*/
function create23TSV_noDNA( resultRows,  kitid, kitname){
	const sep = '\t';    // the separator character - use tab or semicolon - comma messes up with json-encoded text.
	create23CorTSV_noDNA( resultRows, sep, kitid, kitname );
}

function create23CSV_noDNA( resultRows,  kitid, kitname){
	const sep = ',';
	create23CorTSV_noDNA( resultRows, sep, kitid, kitname );
}

function create23CorTSV_noDNA( resultRows, sep, kitid, kitname){

	var csvarray=new Array();

	let extension = ".txt"		// excel is too stupid to automatically identify the separator char unless you open the file in certain ways.
									// Recent versions also cannot cope with .tsv
	if (sep == ',') {
		extension = ".csv"
	}
	const quote = '"';
	const eol = '\r\n';
	const ByteOrderMark = "\uFEFF";

	const CSV23Header= ByteOrderMark + "Display Name;Surname;Chromosome Number;Chromosome Start Point;Chromosome End Point;Genetic Distance;# SNPs;Full IBD;Link to Profile Page;Sex;Birth Year;Set Relationship;Predicted Relationship;Relative Range;Percent DNA Shared;# Segments Shared;Maternal Side;Paternal Side;Maternal Haplogroup;Paternal Haplogroup;Family Surnames;Family Locations;Maternal Grandmother Birth Country;Maternal Grandfather Birth Country;Paternal Grandmother Birth Country;Paternal Grandfather Birth Country;Notes;Sharing Status;Showing Ancestry Results;Family Tree URL;Largest Segment" + eol;
	csvarray.push(CSV23Header.replace(/;/g, sep));

	let nrows = resultRows.length;
	var theName=kitname;		// profile person name

	for(let i=0; i<nrows; i++) {	//nrows

		let row = resultRows[i];

		// trim the names to avoid csv and string delimiters inside name fields.
		let relname = quote + row.name.replace(/,/g,'').replace(/"/g,'').replace(/   */g, ' ') + quote;
		// convert all internal dbl quotes to single, then surround entire field with quotes.
		let surnames = '';
		if (row.familySurnames !== null && row.familySurnames.length > 0 ) {
			surnames = quote + row.familySurnames.replace(/"/g, "'") + quote;
		}
		let locations = '';
		if (row.familyLocations !== null && row.familyLocations.length > 0 ) {
			locations = quote + row.familyLocations.replace(/"/g, "'") + quote;
		}
		let treeURL = '';
		if (row.familyTreeURL !== null && row.familyTreeURL.length > 0 ) {
			treeURL = quote + row.familyTreeURL + quote;
		}
		let note = '';
		if (row.Notes !== null && row.Notes.length > 0 ) {
			note = quote + row.Notes.replace(/"/g, "'") + quote;
		}


		csvarray.push(relname + sep.repeat(5)+
				row.Genetic_Distance+sep.repeat(6)+
				row.Set_Relationship+sep+
				row.Predicted_Rel+sep.repeat(2)+
				row.Percent_DNA_Shared+sep+
				row.Segments+sep+
				row.MaternalSide+sep+
				row.PaternalSide+sep+
				row.Maternal_Haplogroup+sep+
				row.Paternal_Haplogroup+sep+
				surnames+sep+
				locations+sep.repeat(5)+
				note+sep.repeat(2)+
				row.Showing_Ancestry+sep+
				treeURL + sep+
				row.largest_Segment +
				eol);

	}
	if(theName){
		// replace characters that might be problematic in a filename in different OSs
		theName=theName.replace(/[ '\/\\:\.";,"]/g,"_");
	}
	else theName="";

	var blob = new Blob(csvarray, {type: "text/plain;charset=utf-8"});
	saveAs(blob, "529relatives_" + theName+ "_" + formattedDate()+ extension);

}

/*
** Functions to accept the DB query return and write it to CSV in a format suitable for GDAT
**
** 1. table of all ICWs that do not include the profile kits. 
*/
function createICW_CSV4GDAT( resultRows, kitid, kitname){

	var csvarray=new Array();
	let sep = ',';
	let extension = ".csv";		
	
	const quote = '"';
	const eol = '\r\n';
	const ByteOrderMark = "\uFEFF";

	const CSVGDATHeader= ByteOrderMark + "Kit ID 1; Kit ID 2;cM total;nSegments;largest Seg;Relative 1;Relative 2;" + eol;
	csvarray.push(CSVGDATHeader.replace(/;/g, sep));

	let nrows = resultRows.length;

	for(let i=0; i<nrows; i++) {	//nrows

		let row = resultRows[i];

		// trim the names to avoid csv and string delimiters inside name fields. 
		// For some unknown reason, profile names sometimes padded out with many spaces, so remove
		let relname1 = quote + row.name1.replace(/,/g,'').replace(/"/g,'').replace(/   */g, ' ') + quote;
		let relname2 = quote + row.name2.replace(/,/g,'').replace(/"/g,'').replace(/   */g, ' ') + quote;
		// other fields are numeric or guaranteed free of problem chars.
		
		csvarray.push(  quote + row.ID1 + quote + sep +
						quote + row.ID2 + quote + sep +
						row.cMtotal + sep + row.nsegs + sep +
						row.largest + sep  +
						relname1 + sep + relname2 + sep +
						eol);

	}

	var blob = new Blob(csvarray, {type: "text/plain;charset=utf-8"});
	saveAs(blob, "529_ICWs_" + formattedDate()+ extension);
}

/*
** GDAT, cont....
** 2. table of all DNA relatives to teh specified profile person.
*/

function createRels_CSV4GDAT( resultRows, kitid, kitname){

	var csvarray=new Array();
	let sep = ',';
	let extension = ".csv";		
	
	const quote = '"';
	const eol = '\r\n';
	const ByteOrderMark = "\uFEFF";

	const CSVGDATHeader= ByteOrderMark + "Profile ID;Relative ID;Name;cM total;Assigned Relship;Predicted Relship;pct DNA Shared;nSegments;side;Mat Hapl;Pat Hapl;surnames;family Locations;Notes;Showing DNA;tree URL;largest Seg;" + eol;
	csvarray.push(CSVGDATHeader.replace(/;/g, sep));

	let nrows = resultRows.length;
	var theName=kitname;		// profile person name

	for(let i=0; i<nrows; i++) {	//nrows

		let row = resultRows[i];

		// trim the names to avoid csv and string delimiters inside name fields. 
		// For some unknown reason, profile names sometimes padded out with many spaces, so remove
		let relname = quote + row.name.replace(/,/g,'').replace(/"/g,'').replace(/   */g, ' ') + quote;
		let surnames = '';
		if (row.familySurnames !== null && row.familySurnames.length > 0 ) {
			surnames = quote + row.familySurnames.replace(/"/g, "'") + quote;
		}
		let locations = '';
		if (row.familyLocations !== null && row.familyLocations.length > 0 ) {
			locations = quote + row.familyLocations.replace(/"/g, "'") + quote;
		}
		let treeURL = '';
		if (row.familyTreeURL !== null && row.familyTreeURL.length > 0 ) {
			treeURL = quote + row.familyTreeURL + quote;
		}
		let note = '';
		if (row.Notes !== null && row.Notes.length > 0 ) {
			note = quote + row.Notes.replace(/"/g, "'") + quote;
		}
		// other fields are numeric or guaranteed free of problem chars.
		
		csvarray.push(  quote + row.Profile_key + quote + sep +
						quote + row.Relative_key + quote + sep +
						relname + sep +
						row.Genetic_Distance + sep + row.Set_Relationship + sep +
						row.Predicted_Rel + sep + row.Percent_DNA_Shared + sep +
						row.Segments + sep + row.side + sep +
						row.Maternal_Haplogroup + sep + row.Paternal_Haplogroup + sep +
						surnames + sep + locations + sep +
						note + sep + row.Showing_Ancestry + sep +
						treeURL + sep + row.largest_Segment + sep +
						eol);

	}
	if(theName){
		// replace characters that might be problematic in a filename in different OSs
		theName=theName.replace(/[ '\/\\:\.";,"]/g,"_");
	}
	else theName="";

	var blob = new Blob(csvarray, {type: "text/plain;charset=utf-8"});
	saveAs(blob, "529Relatives_" + theName+ "_" + formattedDate()+ extension);
}

/*
** a 3-way table of profile, match and ICW
*/
function createICW_CSV( resultRows, kitid, kitname){

	var csvarray=new Array();
	let sep = '\t';
	let extension = ".txt";		// excel is too stupid to automatically identify the separator char unless you open the file in certain ways.
									// Recent versions also cannot cope with .tsv by default
	if (sep == ',') {
		extension = ".csv"
	}
	const quote = '"';
	const eol = '\r\n';
	const ByteOrderMark = "\uFEFF";

	const CSV23Header= ByteOrderMark + "Relative 1;Relative 2;Prof to R1 cM;Prof to R1 nsegs;Prof to R2 cM;Prof to R2 nsegs;R1 to R2 cM;R1 to R2 nsegs;Kit ID 1; Kit ID 2" + eol;
	csvarray.push(CSV23Header.replace(/;/g, sep));

	let nrows = resultRows.length;
	var theName=kitname;		// profile person name

	for(let i=0; i<nrows; i++) {	//nrows

		let row = resultRows[i];

		// trim the names to avoid csv and string delimiters inside name fields. 
		// Yes, the numbers are offset: relative name 1 here is ID2 in the DB table
		// For some unknown reason, profile names sometimes padded out with many spaces, so remove
		let relname1 = quote + row.name2.replace(/,/g,'').replace(/"/g,'').replace(/   */g, ' ') + quote;
		let relname2 = quote + row.name3.replace(/,/g,'').replace(/"/g,'').replace(/   */g, ' ') + quote;
		// other fields are numeric or guaranteed free of problem chars.
		
		csvarray.push(relname1 + sep + relname2 + sep +
				row.cMtotal1 + sep + row.nsegs1 + sep +
				row.cMtotal2 + sep + row.nsegs2 + sep +
				row.cMtotal3 + sep + row.nsegs3 + sep +
				quote + row.ID2 + quote + sep +
				quote + row.ID3 + quote + sep +
				eol);

	}
	if(theName){
		// replace characters that might be problematic in a filename in different OSs
		theName=theName.replace(/[ '\/\\:\.";,"]/g,"_");
	}
	else theName="";

	var blob = new Blob(csvarray, {type: "text/plain;charset=utf-8"});
	saveAs(blob, "ICW_" + theName+ "_" + formattedDate()+ extension);

}


function downloadSVG(){
	if(document.getElementById("529graph")==null){
		alert("SVGs are only created when a specific chromosome or segment is selected");
		return;
	}
	var svgArray=new Array();
	svgArray.push('<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n');
	var svgText=document.getElementById("529graph").outerHTML;
	svgArray.push(svgText.slice(0,18));
	svgArray.push('xmlns="http://www.w3.org/2000/svg" version="1.1" ');
	svgArray.push(svgText.slice(18));
	var blob = new Blob(svgArray, {type: "text/plain;charset=utf-8"});
	saveAs(blob, "529renew.svg");
}

function createGEXF(resultRows){

	var gexfarray=new Array();
	gexfarray.push('<?xml version="1.0" encoding="UTF-8"?>\n');
	gexfarray.push('<gexf xmlns="http://www.gexf.net/1.3" version="1.3" xmlns:viz="http://www.gexf.net/1.3/viz" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.gexf.net/1.3 http://www.gexf.net/1.3/gexf.xsd">\n');
	gexfarray.push('  <meta lastmodifieddate="' + formattedDate2() + '">\n');
	gexfarray.push('    <creator>529renew</creator>\n');
	gexfarray.push('    <description></description>\n');
	gexfarray.push('  </meta>\n');
	gexfarray.push('  <graph defaultedgetype="undirected" mode="static">\n');
	gexfarray.push('    <nodes>\n');

	var nodeArray=new Array();
	let nrows = resultRows.length;

	for(let i=0; i<nrows; i++){

		let row= resultRows[i];
		if(!row.chromosome) break;
		if(row.chromosome==100) break;
		if((i+1)<nrows){
			if(resultRows[i+1].ROWID==row.ROWID) continue;
		}
		let nodeId=row.id1;
		let j=0;
		for(; j<nodeArray.length; j++){
			if(nodeId==nodeArray[j]) break;
		}
		if(j==nodeArray.length){
			nodeArray.push(nodeId);
			gexfarray.push('      <node id="' + nodeId +'" label="' + row.name1.replace(/"/g,'').replace(/'/g,"") + '"/>\n');
		}
		nodeId=row.id2;
		j=0;
		for(; j<nodeArray.length; j++){
			if(nodeId==nodeArray[j]) break;
		}
		if(j==nodeArray.length){
			nodeArray.push(nodeId);
			gexfarray.push('      <node id="' + nodeId +'" label="' + row.name2.replace(/"/g,'').replace(/'/g,"") + '"/>\n');
		}
	}
	gexfarray.push('      </nodes>\n');
	gexfarray.push('    <edges>\n');


	for(let i=0; i<nrows; i++) {

		let row = resultRows[i];
		if(!row.chromosome) break;
		if(row.chromosome==100) break;

		if((i+1)<nrows){
			if(resultRows[i+1].ROWID==row.ROWID) continue;
		}

		let label;
		if(row.chromosome==23) label="X:";
		else label=row.chromosome+":";

		label += row.start + "-" + row.end;

		if(expectedIdStr==row.id2){
			gexfarray.push('      <edge source="' + row.id1 +'" target="' + row.id2 + '" weight="' + row.cM/20 + '" label="'+label+'"/>\n');
		}
		else{
			gexfarray.push('      <edge source="' + row.id2 +'" target="' + row.id1 + '" weight="' + row.cM/20 + '" label="' + label +'"/>\n');
		}
	}
	gexfarray.push('    </edges>\n');
	gexfarray.push('  </graph>\n');
	gexfarray.push('</gexf>\n');
	let blob = new Blob(gexfarray, {type: "text/plain;charset=utf-8"});
	saveAs(blob, "529renew.gexf");

}

// return numbers suitable for presentation in table

function get_Mbase( val ){
	if (typeof val === "number" ) {
		return( base2Mbase(val) );
	}
	else return val;		// probably a string, such as "?"
}

function get_cM( val ){
	if (typeof val === "number" ) {
		return( round_cM(val));
	}
	else return val;		// probably a string, such as "?"
}
	

/*
** createSegmentTable - db pseudo-callback, with results of query for matching segments
** - creates html table of segment overlaps between testing pairs
*/

function createSegmentTable(resultRows){

	let omitAliases=getSetting( "omitAliases");
	let hideCloseMatches=getSetting( "hideCloseMatches" );
	let nrows = resultRows.length;

	if(hideCloseMatches && document.getElementById("selectName").selectedIndex==0) hideCloseMatches=false;

	var displayMode=document.getElementById("displayMode");
	
	// Remove any preexisting table
	while(document.getElementById("table_div").hasChildNodes()){
		document.getElementById("table_div").removeChild(document.getElementById("table_div").children[0]);
	}
	var tableTitle=document.createElement("h3");
	document.getElementById("table_div").appendChild(tableTitle);
	var table=document.createElement("table");

	document.getElementById("table_div").appendChild(table);

	var matchingSegments=new Array();   // currently array or arrays
	var matchIds=new Array();		// array of objects


	var matchChromosome=null;
	{
		// Process the real (non-chromosome 100) matches into the matchingSegments array
		// and place the names of all people who match one of the two individuals
		// into the matchIds array
		let i;
		let ii=-1;
		for (i=0; i<nrows; i++) {
			let row = resultRows[i];
			// result rows are ordered in the first instance by chromosome number, so
			// once we hit chr 100 there are no real results remaining
			if(row.chromosome>=100) break;

			if(omitAliases){
				if((i+1)<nrows){
					if(resultRows[i+1].ROWID==row.ROWID) continue;
				}
			}
			ii++;

			let matchingSegment={};
			let matchIDObj = {};

			matchingSegment.ROWID=row.ROWID;

			if((expected_id1==row.id2) || (expected_id2==row.id2)){

				matchingSegment.name1=row.name2;
				matchingSegment.name2=row.name1;
				matchingSegment.id1=row.id2;
				matchingSegment.id2=row.id1; 


				if(!((expected_id1==row.id1) || (expected_id2==row.id1))){
					let j;
					for(j=0; j<matchIds.length; j++){
						if(matchIds[j].id==row.id1 ) break;
					}
					if(j==matchIds.length){
						matchIDObj.name = row.name1;
						matchIDObj.id = row.id1;
						matchIds.push(matchIDObj);
					}
				}
			}
			else{

				matchingSegment.name1=row.name1; 
				matchingSegment.name2=row.name2; 
				matchingSegment.id1=row.id1;
				matchingSegment.id2=row.id2;


				if(!((expected_id1 == row.id2) || (expected_id2 == row.id2))){
					let j;
					for(j=0; j<matchIds.length; j++){
						if(matchIds[j].id==row.id2 ) break;
					}
					if(j==matchIds.length){
						matchIDObj.name = row.name2;
						matchIDObj.id = row.id2;
						matchIds.push(matchIDObj);
					}
				}
			}
			matchingSegment.chromosome=row.chromosome;
			if(!matchChromosome && row.chromosome<24) matchChromosome=row.chromosome;
			matchingSegment.start=row.start;
			matchingSegment.end=row.end;
			matchingSegment.cM=row.cM;
			matchingSegment.snps=row.snps;
			matchingSegment.segdate=row.segdate;

			matchingSegments[ii]=matchingSegment; // i
		}
		// Process the chromosome 100 matches
		// at this stage, i is the first chr 100 entry.
		for(; i<nrows; i++) {

			let row = resultRows[i];

			if(omitAliases){
				if((i+1)<nrows){
					if(resultRows[i+1].ROWID==row.ROWID) continue;
				}
			}
			ii++;

			let matchingSegment=new Array();

			matchingSegment.ROWID=row.ROWID;

			// Screen out segments that don't involve one of the two
			// individuals of interest and someone on the matchIds
			// list of people whom one of them match
			if((expected_id1 == row.id2) ||  (expected_id2 == row.id2)){

				let j;
				for(j=0; j<matchIds.length; j++){
					if(row.id1 == matchIds[j].id) break;
				}
				if(j==matchIds.length) continue;

				matchingSegment.name1=row.name2; 
				matchingSegment.name2=row.name1; 
				matchingSegment.id1=row.id2;
				matchingSegment.id2=row.id1; 

			}
			else{

				let j;
				for(j=0; j<matchIds.length; j++){
					if(row.id2==matchIds[j].id ) break;
				}
				if(j==matchIds.length) continue;

				matchingSegment.name1=row.name1;
				matchingSegment.name2=row.name2;
				matchingSegment.id1=row.id1;
				matchingSegment.id2=row.id2;

			}
			{
				// Keep only those pairs that are not already in the list
				// as matching on some actual chromosome
				let k;
				for(k=0; k<matchingSegments.length; k++){
					if(matchingSegments[k].id1==matchingSegment.id1 &&
						matchingSegments[k].id2==matchingSegment.id2
						) break;
				}
				if(k==matchingSegments.length){
					matchingSegment.chromosome=row.chromosome;
					matchingSegment.start=row.start;
					matchingSegment.end=row.end;
					matchingSegment.cM=row.cM;
					matchingSegment.snps=row.snps;
					matchingSegment.segdate=row.segdate;

					matchingSegments.push(matchingSegment);
				}
			}
		}
	}
	// Add the missing comparisons to matchingSegments
	for(let j=0; j<matchIds.length; j++){
		let i;
		let matches1=false;
		let matches2=false;
		for(i=0; i<matchingSegments.length; i++){
			if(matchIds[j].id==matchingSegments[i].id2 ){
				if(matchingSegments[i].id1==expected_id1){
					matches1=true;
					if(matches2) break;
				}
				else if(matchingSegments[i].id1==expected_id2){
					matches2=true;
					if(matches1) break;
				}
				else{
					return; // The page has changed for a new query, so this task is no longer relevant
				}
			}
		}
		if(i==matchingSegments.length){
			let matchingSegment={};
			matchingSegment.ROWID=-1; 
			if(matches1){
				matchingSegment.name1=expectedName2; 
				matchingSegment.name2=matchIds[j].name; 
				matchingSegment.id1=expected_id2; 
			}
			else if(matches2){
				matchingSegment.name1=expectedName1;
				matchingSegment.name2=matchIds[j].name;
				matchingSegment.id1=expected_id1; 
			}
			else{
				return; // The page has changed for a new query, so this task is no longer relevant
			}

			matchingSegment.id2=matchIds[j].id;
			matchingSegment.chromosome=200;
			matchingSegment.start="?";
			matchingSegment.end="?";
			matchingSegment.cM="?";
			matchingSegment.snps="?";
			matchingSegment.segdate="?";

			matchingSegments.push(matchingSegment);
		}
	}
	// Sort segments to bring the 3rd party matches together
	// and to order the two people on the original target
	// segment consistently
	matchingSegments.sort(function(a, b){
		if(a.id2>b.id2) return 1;
		else if(a.id2<b.id2) return -1;
		else if(a.id1>b.id1) return 1;
		else if(a.id1<b.id1) return -1;
		else if(a.start>b.start) return 1;
		else if(a.start<b.start) return -1; // start
		return 0;
	});

	if(matchingSegments.length>0){
		let matchingSegmentsArray=new Array();
		{
			let target1=matchingSegments[0].id2;
			let matchingSegmentsK=new Array();  //  array of segs for one person

			for(let i=0; i<matchingSegments.length; i++){
				if(matchingSegments[i].id2!=target1 ){
					matchingSegmentsArray.push(matchingSegmentsK);
					matchingSegmentsK=new Array();
					target1=matchingSegments[i].id2;
				}
				matchingSegmentsK.push(matchingSegments[i]);
			}
			matchingSegmentsArray.push(matchingSegmentsK);
		}
		matchingSegmentsArray.sort(function(a,b){
			function score(a){
				for(let i=0; i<a.length; i++){
					if(a[i].cM=="?"){
						if(a[i].id1==expected_id1){
							return 0; // non compared to person 2
						}
						else return 4; // non compared to person 1
					}
				}
				for(let i=0; i<a.length; i++){
					if(a[i].cM==0){
						if(a[i].id1==expected_id1){
							return 1; // non match to person 2
						}
						else return 3; // non match to person 1
					}
				}
				return 2; // Matches both
			}
			function findStart(a){
				let start=10000000000;
				for(let i=0; i<a.length; i++){
					if(isNaN(parseInt(a[i].start))) continue;
					if(a[i].start<0) continue;
					if(a[i].start<start) start=a[i].start;
				}
				return start;
			}
			function findEnd(a){
				let end=-1;
				for(let i=0; i<a.length; i++){
					if(isNaN(parseInt(a[i].end))) continue;
					if(a[i].end<0) continue;
					if(a[i].end>end) end=a[i].end;
				}
				return end;
			}
			let diff=(score(b)-score(a));
			if(diff!=0) return diff;
			diff=(findStart(b)-findStart(a));
			if(diff!=0) return diff;
			return (findEnd(a)-findEnd(b));
		});
		for(let k=0; k<matchingSegmentsArray.length; k++){
			for(let i=0; i<matchingSegmentsArray[k].length; i++) {

				let tablerow = table.insertRow(i);

				let curColumnId=0;

				{

					let link = document.createElement("a");
					let  person = matchingSegmentsArray[k][i];
					link.setAttribute("href", "https://you.23andme.com/profile/" + person.id1 +"/");

					link.setAttribute("target", "_blank");
					link.innerHTML=person.name1;
					link.className=  ID_is_profile_person( person.id1 ) ? "special-profile": "special";
					let cell=tablerow.insertCell(curColumnId++);
					(cell).appendChild(link);
					if(i==matchingSegmentsArray[k].length-1){
						cell.className="bottom";
					}
				}


				{
					let link = document.createElement("a");
					let  person = matchingSegmentsArray[k][i];
					link.setAttribute("href", chrome.runtime.getURL('results_tab.html')+"?id=" + person.id2);
					link.setAttribute("target", "_blank");
					link.innerHTML=person.name2;
					link.className=  ID_is_profile_person( person.id2 ) ? "special-profile": "special";
					let cell=tablerow.insertCell(curColumnId++);
					(cell).appendChild(link);
					if(i==matchingSegmentsArray[k].length-1){
						cell.className="bottom";
					}
				}

				// will never be true now, but leave it hses until I figure out if I need to replace it with other code
				if(matchingSegmentsArray[k][i].chromosome==100){
					{
						let cell=tablerow.insertCell(curColumnId++);
						(cell).innerHTML="";
						if(i==matchingSegmentsArray[k].length-1){
							cell.className="bottom_center";
						}
					}
					{
						let cell=tablerow.insertCell(curColumnId++);
						(cell).innerHTML="";
						if(i==matchingSegmentsArray[k].length-1){
							cell.className="bottom_right";
						}
					}
					{
						let cell=tablerow.insertCell(curColumnId++);
						(cell).innerHTML="";
						if(i==matchingSegmentsArray[k].length-1){
							cell.className="bottom_right";
						}
					}
					{
						let cell=tablerow.insertCell(curColumnId++);
						(cell).innerHTML="0 cM";
						if(i==matchingSegmentsArray[k].length-1){
							cell.className="bottom_right";
						}
						else cell.className="right";
					}
					{
						let cell=tablerow.insertCell(curColumnId++);
						(cell).innerHTML="";
						if(i==matchingSegmentsArray[k].length-1){
							cell.className="bottom";
						}
					}
					{
						let cell=tablerow.insertCell(curColumnId++);
						(cell).innerHTML="";
						if(i==matchingSegmentsArray[k].length-1){
							cell.className="bottom";
						}
					}
					(tablerow.insertCell(curColumnId++)).innerHTML="no overlapping matching segment >5 cM";
				}
				else{
					{
						let tcell=tablerow.insertCell(curColumnId++);
						if(matchingSegmentsArray[k][i].chromosome==23){
							tcell.innerHTML="X";
						}
						else if(matchingSegmentsArray[k][i].chromosome==200){
							if(matchChromosome==23) tcell.innerHTML="X";
							else tcell.innerHTML=matchChromosome;
						}
						else{
							tcell.innerHTML=matchingSegmentsArray[k][i].chromosome;
						}
						if(i==matchingSegmentsArray[k].length-1){
							tcell.className="bottom_center";
						}
						else tcell.className="center";
					}
					{
						let cell=tablerow.insertCell(curColumnId++);
						(cell).innerHTML=get_Mbase(matchingSegmentsArray[k][i].start);
						if(i==matchingSegmentsArray[k].length-1){
							cell.className="bottom_right";
						}
						else cell.className="right";
					}
					{
						let cell=tablerow.insertCell(curColumnId++);
						(cell).innerHTML=get_Mbase(matchingSegmentsArray[k][i].end);
						if(i==matchingSegmentsArray[k].length-1){
							cell.className="bottom_right";
						}
						else cell.className="right";
					}
					{
						let cell=tablerow.insertCell(curColumnId++);
						(cell).innerHTML=" "+ get_cM(matchingSegmentsArray[k][i].cM) +" ";
						if(i==matchingSegmentsArray[k].length-1){
							cell.className="bottom_right";
						}
						else cell.className="right";
					}
					{
						let cell=tablerow.insertCell(curColumnId++);
						(cell).innerHTML=matchingSegmentsArray[k][i].snps;
						if(i==matchingSegmentsArray[k].length-1){
							cell.className="bottom_right";
						}
						else cell.className="right";
					}
					{
						let cell=tablerow.insertCell(curColumnId++);
						(cell).innerHTML=matchingSegmentsArray[k][i].segdate ;
						if(i==matchingSegmentsArray[k].length-1){
							cell.className="bottom_right";
						}
						else cell.className="right";
					}

					if(matchingSegmentsArray[k][i].ROWID>=0){
						function makeLink(id, name1, name2, id1, id2){
							return function(){
								displayMatchingSegments(id, name1, name2, id1, id2);
							};
						}
						let button = document.createElement("button");
						button.onclick=makeLink(matchingSegmentsArray[k][i].ROWID, matchingSegmentsArray[k][i].name1, matchingSegmentsArray[k][i].name2, matchingSegmentsArray[k][i].id1, 		matchingSegmentsArray[k][i].id2);
						button.className="special";
						if((matchingSegmentsArray[k][i].id1==expected_id1 && matchingSegmentsArray[k][i].id2==expected_id2 ) ||
							(matchingSegmentsArray[k][i].id1==expected_id2 &&	matchingSegmentsArray[k][i].id2==expected_id1 )){

							button.innerHTML="reload";
							if(matchingSegmentsArray[k][i].chromosome==23){
								tableTitle.innerHTML="Segments overlapping match of " + matchingSegmentsArray[k][i].name1 + " and " + matchingSegmentsArray[k][i].name2 + ", chr X:" +matchingSegmentsArray[k][i].start+ "-" + matchingSegmentsArray[k][i].end;
							}
							else{
								tableTitle.innerHTML="Segments overlapping match of " + matchingSegmentsArray[k][i].name1 + " and " + matchingSegmentsArray[k][i].name2 + ", chr " + matchingSegmentsArray[k][i].chromosome+ ":" +matchingSegmentsArray[k][i].start+ "-" + matchingSegmentsArray[k][i].end;
							}
						}
						else button.innerHTML="show overlapping segments";
						(tablerow.insertCell(curColumnId++)).appendChild(button);

					}
					else{
						(tablerow.insertCell(curColumnId++)).innerHTML="no data";
					}
				}
			}
		}
	}
	// Creating the header after the body prevents rows from being inserted into header - apparently
	let tablehead=table.createTHead();
	let tableheadrow=tablehead.insertRow(0);
	tableheadrow.className="center";
	{
		let curColumnId=0;
		(tableheadrow.insertCell(curColumnId++)).innerHTML="Name";
		(tableheadrow.insertCell(curColumnId++)).innerHTML="Match name";
		(tableheadrow.insertCell(curColumnId++)).innerHTML="Chrom.";
		(tableheadrow.insertCell(curColumnId++)).innerHTML="Start Mb";
		(tableheadrow.insertCell(curColumnId++)).innerHTML="End Mb";
		(tableheadrow.insertCell(curColumnId++)).innerHTML="cM";
		(tableheadrow.insertCell(curColumnId++)).innerHTML="# SNPs";
		(tableheadrow.insertCell(curColumnId++)).innerHTML="Date";
	}
	createSVG(table);
}


function displayMatchingSegments(rowid, name1, name2, id1, id2){
	expectedName1=name1;
	expectedName2=name2;
	expected_id1=id1;
	expected_id2=id2;
	db_conlog( 2, `displayMatchingSegments: n1=${name1} and n2=${name2}`);
	selectSegmentMatchesFromDatabase('createSegmentTable', {}, rowid);
}

// display match table on screen
function requestSelectFromDatabase(shiftIsDown, altIsDown){
	let namesel = document.getElementById("selectName");
	let chromsel = document.getElementById("chromosome");
	if(namesel.selectedIndex<0) return;
	expectedName=namesel.options[namesel.selectedIndex].text;
	var expectedId=namesel.options[namesel.selectedIndex].value;
	if(expectedId=='all')
		expectedIdStr=0;
	else
		expectedIdStr=expectedId;

	if(shiftIsDown){
		selectFromDatabase('createTable2', expectedId, chromsel.options[chromsel.selectedIndex].value, altIsDown, false);
	}
	else{
		selectFromDatabase('createTable', expectedId, chromsel.options[chromsel.selectedIndex].value, altIsDown, false);
	}
}

function requestSelectFromDatabaseForCSV(shiftIsDown, altIsDown){
	let namesel = document.getElementById("selectName");
	if(namesel.selectedIndex<0) return;
	expectedName=namesel.options[namesel.selectedIndex].text;
	var expectedId=namesel.options[namesel.selectedIndex].value;
	if(expectedId=='all')
		expectedIdStr=0;
	else
		expectedIdStr=expectedId;
	let limitDates = !shiftIsDown;
	let chromsel = document.getElementById("chromosome");
	if(altIsDown){
		selectFromDatabase('createCSV3', expectedId, chromsel.options[chromsel.selectedIndex].value, limitDates, true);
	}
	else{
		selectFromDatabase('createCSV', expectedId, chromsel.options[chromsel.selectedIndex].value, limitDates, false);
	}
}

function requestSelectFromDatabaseFor23CSV(mode, shiftIsDown, altIsDown){

	let namesel = document.getElementById("selectKit");
	if(namesel.selectedIndex<0)
		 return;
	let kitName=namesel.options[namesel.selectedIndex].text;
	let kitID=namesel.options[namesel.selectedIndex].value;
	let returnfunc = 'create23';
	if ( mode == 't'){
		returnfunc += "TSV";
	} else {
		returnfunc += "CSV";
	}

	db_conlog( 1, `writing DNA relatives for profile: ${kitName} ret to ${returnfunc}`);
	if(altIsDown){
		returnfunc += "_DNA";
	}
	else{
		returnfunc += "_noDNA";
	}
	select23CSVFromDatabase( returnfunc, kitID, kitName);
}

function requestSelectICWFromDatabaseForCSV(shiftIsDown, altIsDown){

	let namesel = document.getElementById("selectKit");
	if(namesel.selectedIndex<0)
		 return;
	let kitName=namesel.options[namesel.selectedIndex].text;
	let kitID=namesel.options[namesel.selectedIndex].value;

	db_conlog( 1, `writing CSV of ICW relatives for profile: ${kitName}`);
	selectICWFromDatabase(kitID, kitName);
}

function requestSelectRelsforGDAT(shiftIsDown, altIsDown){

	let namesel = document.getElementById("selectKit");
	if(namesel.selectedIndex<0)
		 return;
	let kitName=namesel.options[namesel.selectedIndex].text;
	let kitID=namesel.options[namesel.selectedIndex].value;

	db_conlog( 1, `writing GDAT CSV of relatives for profile: ${kitName}`);
	selectRelsforGDAT(kitID, kitName);
}

function requestSelectICWforGDAT(shiftIsDown, altIsDown){

	let namesel = document.getElementById("selectKit");
	if(namesel.selectedIndex<0)
		 return;
	let kitName=namesel.options[namesel.selectedIndex].text;
	let kitID=namesel.options[namesel.selectedIndex].value;

	db_conlog( 1, `writing GDAT CSV of all ICWs`);
	selectICWforGDAT(kitID, kitName);
}

function requestSelectFromDatabaseForGEXF(){
	let namesel = document.getElementById("selectName");
	let chromsel = document.getElementById("chromosome");
	if(namesel.selectedIndex<0) return;
	expectedName=namesel.options[namesel.selectedIndex].text;
	var expectedId=namesel.options[namesel.selectedIndex].value;
	if(expectedId=='all')
		expectedIdStr=0;
	else
		expectedIdStr=expectedId;
	selectFromDatabase('createGEXF', expectedId, chromsel.options[chromsel.selectedIndex].value, false, false);
}

let migration_started= 0;

function CSV_loadDone( newSize ){
	let elapsed = secondsToday() - migration_started;

	document.getElementById("docBody").style.cursor="pointer";

	alert(`CSV file parsing complete in ${elapsed} seconds,\n database updated, now ${newSize} bytes`);
	// don't remember why I needed to refresh the page - ignore the reload for now so we can see output
	// location.reload(true); 
}

function migrationOverlapFind_done( s ) {
	let elapsed = secondsToday() - migration_started;
	let elapsed_min = (elapsed / 60.0).toFixed(1);
	let str = '';
	if ( elapsed > 100) {
		str = `${elapsed_min} minutes`;
	} else {
		str = `${elapsed} seconds`;
	}
	document.getElementById("docBody").style.cursor="pointer";
	//let MC = 0.1*Math.floor( * 10+ 0.5);
	let MC = (s.compared).toFixed( 2 );
	alert(`ICW sets analysed in ${str}.\n${s.triang} triangulate; ${s.twoway} overlaps 2-way only; ${s.no_overlap} have no overlap;\n${s.hidden} are hidden; ${s.unknown} have status uncertain.\nOut of ${MC} million comparisons`);
}

function requestImportProfiles(evt){
	evt.stopPropagation();
	evt.preventDefault();

	var files = evt.target.files;
	var file=files[0];
	const CSVheader ='ID,name';
	var reader = new FileReader();

      // Closure to capture the file information.
      reader.onload = (function(theFile) {
        return function(e) {
        	let lines = e.target.result.split(/\r\n|\r|\n/);
			if(lines.length > 1 ){
        		document.getElementById("docBody").style.cursor="wait";
        		importProfileCSV(lines, 2 );
        	}
        	else alert('File must have a header line and at least one kit');
        };
      })(file);

    reader.readAsText(file);
}
// compare two File objects
function cfFile( a, b ) {
	if ( a.name > b.name )  return 1;
	if ( a.name < b.name )  return -1;
	return 0;
}

/*
** sort the array of File objects alphabetically by file name.
** The concept of "oldestFirst" assumes that the sort by name will also sort in increasing date order
** (e.g. such as using ISO date format). Because the files are pop()ed off the bottom of the list when used,
** the sort order causing oldest to newest will result in the newest file being processed first.
*/
function sortFileList( fileList, oldestFirst ) {
	let flist2 = [];
	for ( let i = 0; i < fileList.length; i++ ) {
		// convert the fileList object into an array of File objects so it can be sorted
		flist2[i] = fileList[i];
	}
	let flist3 = flist2.toSorted( cfFile );
	if( oldestFirst ) {
		return flist3.toReversed();
	} else {
		return flist3;
	}
}

function requestImport529CSV(evt){
	evt.stopPropagation();
	evt.preventDefault();

	var files = evt.target.files;
	var file=files[0];

	var reader = new FileReader();

      // Closure to capture the file information.
      reader.onload = (function(theFile) {
        return function(e) {
        	let lines = e.target.result.split(/\r\n|\r|\n/);
			if(lines[0]==="Name, Match name, Chromosome, Start point, End point, Genetic distance, # SNPs, ID, Match ID"){
        		document.getElementById("docBody").style.cursor="wait";
        		import529CSV(lines, 9 );
        	}
        	else if(lines[0]==="Name, Match name, Chromosome, Start point, End point, Genetic distance, # SNPs, ID, Match ID, Phase, Match phase, Label, Match label, Common ancestors"){
        		document.getElementById("docBody").style.cursor="wait";
        		import529CSV(lines, 14);
        	}
        	else if(lines[0]==="Name, Match name, Chromosome, Start point, End point, Genetic distance, # SNPs"){
        		alert("This file lacks 23andMe unique identifiers and therefore cannot be imported");
        	}
        	else alert("Unrecognized header in 529 CSV file - cannot process");
        };
      })(file);

    reader.readAsText(file);
}

let CSV23Store = {kitName:'none', kitID: '123', filelist: [] };

function requestImport23CSV(evt){
	let namesel = document.getElementById("selectKit");
	if(namesel.selectedIndex<0)
		 return;
	let kitName=namesel.options[namesel.selectedIndex].text;
	let kitID=namesel.options[namesel.selectedIndex].value;
	if(!confirm(`Is this 23+Me DNA Relatives file for ${kitName}?`))
		 return;
	const useReplace = parseInt(getSetting( 'importReplaces'));
	evt.stopPropagation();
	evt.preventDefault();
	var files = evt.target.files;
	let sortedList = sortFileList( files, useReplace );
	console.log( 'file list is type ', typeof files, ' value: ', files, ' sorted is: ', sortedList);

	CSV23Store = { kitName:kitName, kitID: kitID, filelist: sortedList };

	migration_started = secondsToday();
	readNextCSV23( );
}
function readNextCSV23() {
	const CSVheader ='"Display Name","Surname","Chromosome Number","Chromosome Start Point","Chromosome End Point","Genetic Distance","# SNPs","Full IBD","Link to Profile Page","Sex","Birth Year","Set Relationship","Predicted Relationship","Relative Range","Percent DNA Shared","# Segments Shared","Maternal Side","Paternal Side","Maternal Haplogroup","Paternal Haplogroup","Family Surnames","Family Locations","Maternal Grandmother Birth Country","Maternal Grandfather Birth Country","Paternal Grandmother Birth Country","Paternal Grandfather Birth Country","Notes","Sharing Status","Showing Ancestry Results","Family Tree URL"';
	
	let file = CSV23Store.filelist.pop();

	if (file === undefined )
		return;		// finished

	let kitID = CSV23Store.kitID;
	let kitName = CSV23Store.kitName;
	let reader = new FileReader();
	logHtml( null, `=============  Reading ${file.name} for ${kitName}`);

	// Closure to capture the file information.
	reader.onload = (function(theFile) {
		return function(e) {
			let lines = e.target.result.split(/\r\n|\r|\n/);
			let CSVh_noquotes = CSVheader.replaceAll( '"', '' );
			let inhead_noquotes = lines[0].replaceAll( '"', '' );
			if(inhead_noquotes === CSVh_noquotes){
				document.getElementById("docBody").style.cursor="wait";
				import23CSV(kitID, kitName, lines, 30 );
			}
        	else alert(`Unrecognized header line in 23 and Me CSV: ${file.name}`);
        };
      })(file);

    reader.readAsText(file);
}

function dumpSqlite3DB(arrbuf) {
	let filekB =  arrbuf.byteLength / 1000.0;
	let fileMB = filekB / 1000.0;
	let fsstring = "";
	if ( fileMB < 1.0 ) {
		fsstring = filekB.toString() + " kB";
	} else {
		fsstring = fileMB.toString() + " MB";
	}
	let bufferblob = new Blob( [arrbuf], {type:'application/octet-stream'} );
	let fname = "529wasm" + "_" + formattedDate()+ ".sqlite";
	saveAs(bufferblob, fname);
	// The saveAs is async, so the alert usually appears before the saveAs dialogue box.
	//alert( `Saved to file ${fname}, size : ${fsstring}` );
}

function askDumpSqlite3DB() {
	DBworker.postMessage( {reason:"dumpDB"} );
}

function askRestoreSqlite3DB(evt) {
	
	evt.stopPropagation();
	evt.preventDefault();

	const file = evt.target.files[0];
	if ( ! file ) return;
	const reader = new FileReader();


	reader.addEventListener('load', function(theFile) {
		let data = this.result;  // an ArrayBuffer
		DBworker.postMessage( {reason:"restoreDB", filecontents:data}, [data] );
	} );

    reader.readAsArrayBuffer(file);
}
	

document.addEventListener('DOMContentLoaded',  function () {
	( async() => {
	//console.log( `DomContent event - getting settings`);
	const settingStatus = await retrieveSettingsP();
	//console.log( `DOMContentLoaded - and settingsP has returned ${settingStatus}.`);
	createKitSelector();
	createImportProfileButton();
	createImport23Button();
	createOverlapCalcButton();
	createImport529Button();
		// view/output chromosome content
	createMatchTableButton();
	createCSVButton();
	createGEXFButton();
	createSVGButton();
	// Export 23-style csv
	create23CSVButton();
	create23TSVButton();
	create23ICWButton();
	createGDATRelsButton();
	createGDATICWButton();
	// DB actions
	createDBDumpButton();
	createDBRestoreButton();
	createDeleteWASMButton();

	createClearFilterButton();

	setDisplayModeSelector();
	setTextSizeSelector();

	setOmitAliasesCheckBox();
	setHideCloseMatchesCheckBox();

	document.getElementById("selectNameFilter").onchange=function(){
		if(document.getElementById("selectNameFilter").value.length>0){
			document.getElementById("clearFilterButton").style.visibility="visible";
			getFilteredMatchesFromDatabase(document.getElementById("selectNameFilter").value );
		}
		else{
			document.getElementById("clearFilterButton").style.visibility="hidden";
		}
	};
	} )();
	
});

	/*
	** this code is part of the page setup, but needs to be delayed until
	** the DB setup is completed
	*/
function post_DB_init_setup() {

	let results= [
		{name:'this', IDText: 'idaaa'},
		{name:'should', IDText: 'idbbb'},
		{name:'not', IDText: 'idccc'},
		{name:'remain', IDText: 'idddd'}
	];

	createNameSelector( results );
	getFilteredMatchesFromDatabase( '' );
	populateDNATesters();  

	DBworker.postMessage( {reason:'getProfiles'} );
	populate_settings();
}