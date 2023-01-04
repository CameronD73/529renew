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

/*
** createMatchSVG
** draws graphical representations of segment lengths and overlap.

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
	if(document.getElementById("displayMode").value!=3) return;

	var outersvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	outersvg.setAttribute("width", "100%");

	var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	outersvg.setAttribute("id", "529graph");
	var svgNS = svg.namespaceURI;

	var clengths=[
	155270560.0,
	249250621.0,
	243199373.0,
	198022430.0,
	191154276.0,
	180915260.0,
	171115067.0,
	159138663.0,
	146364022.0,
	141213431.0,
	135534747.0,
	135006516.0,
	133851895.0,
	115169878.0,
	107349540.0,
	102531392.0,
	90354753.0,
	81195210.0,
	78077248.0,
	59128983.0,
	63025520.0,
	48129895.0,
	51304566.0
	];
	function getTableIndex(label){
		var theadrow=table.children[0].children[0];
		for(let i=0; i<theadrow.children.length; i++){
			if(theadrow.children[i].innerText==label) return i;
		}
		return -1;
	}
	//var nameIndex=getTableIndex("Name");
	var phaseIndex=getTableIndex("Phase");
	var matchNameIndex=getTableIndex("Match name");
	var chromosomeIndex=getTableIndex("Chromosome");
	var startIndex=getTableIndex("Start point");
	var endIndex=getTableIndex("End point");
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


	for(let i=0; i<250; i+=10){
		if(i*1000000>clengths[chromosomeIndex]) break;
		let newLine = document.createElementNS(svgNS,'line');
		let x1x2=i*100000000/clengths[chromosomeIndex];
		newLine.setAttribute('x1',x1x2 + "%");
		newLine.setAttribute('x2',x1x2 + "%");
		newLine.setAttribute('y1', "0%");
		newLine.setAttribute('y2', "100%");
		newLine.setAttribute("stroke", "#DDDDDD");
		svg.appendChild(newLine);
	}
	for(let i=0; i<250; i+=50){
		if(i*1000000>clengths[chromosomeIndex]) break;
		let newLine = document.createElementNS(svgNS,'line');
		let x1x2=i*100000000/clengths[chromosomeIndex];
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
		if(i*1000000>clengths[chromosomeIndex]) break;

			let text= document.createElementNS(svgNS, 'text');
			let x1x2=i*100000000/clengths[chromosomeIndex];

			text.setAttribute('x', x1x2 + "%");
			text.setAttribute('y', 10);
			text.setAttribute('text-anchor', 'middle');
			text.setAttribute('fill', '#FFFFFF');
			text.setAttribute('font-family', 'Times');
			text.appendChild(document.createTextNode(i+"M"));
			svg.appendChild(text);
	}
	var iii=0;
	var order=[1, 2, -1, 0];
	for(let j=0; j<order.length; j++){
		for(let i=0; i<tbody.children.length; i++){
			var matchName=tbody.children[i].children[matchNameIndex].innerText;
			if(tbody.children[i].children[phaseIndex].children[0].value!=order[j]) continue;
			var offset=parseInt(tbody.children[i].children[startIndex].innerText);
			var width=parseInt(tbody.children[i].children[endIndex].innerText);
			if(!Number.isNaN(offset)) offset=100.0*offset/clengths[chromosomeIndex];
			if(!Number.isNaN(width)) width=100.0*width/clengths[chromosomeIndex];
			if(!Number.isNaN(offset) && !Number.isNaN(width)) width-=offset;
			{
				let rect = document.createElementNS(svgNS,'rect');
				rect.setAttribute('x', offset + "%");
				rect.setAttribute('y',10*(iii+2));
				rect.setAttribute('width',width + "%");
				rect.setAttribute('height',10);
				let phaseColor=tbody.children[i].children[phaseIndex].children[0].style["background-color"];
				if(order[j]==-1) rect.setAttribute('stroke','#000000');
				rect.setAttribute('fill',phaseColor);
				svg.appendChild(rect);
			}
			{
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
				text.appendChild(document.createTextNode(matchName));
				svg.appendChild(text);
			}
			iii+=2;
		}
	}

	svg.setAttribute('height', 10*(iii+4));
	outersvg.setAttribute('height', 10*(iii+4));

	outersvg.appendChild(svg);
		document.body.appendChild(outersvg);

}


function createSVG(table){
	var graphNode=document.getElementById("529graph");
	if(graphNode!=null) graphNode.parentNode.removeChild(graphNode);

	var outersvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	outersvg.setAttribute("width", "100%");

	var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	outersvg.setAttribute("id", "529graph");
	var svgNS = svg.namespaceURI;

	var clengths=[
	155270560.0,
	249250621.0,
	243199373.0,
	198022430.0,
	191154276.0,
	180915260.0,
	171115067.0,
	159138663.0,
	146364022.0,
	141213431.0,
	135534747.0,
	135006516.0,
	133851895.0,
	115169878.0,
	107349540.0,
	102531392.0,
	90354753.0,
	81195210.0,
	78077248.0,
	59128983.0,
	63025520.0,
	48129895.0,
	51304566.0
	];
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
	var chromosomeIndex=getTableIndex("Chromosome");
	var startIndex=getTableIndex("Start point");
	var endIndex=getTableIndex("End point");
	var reloadIndex=getTableIndex("# SNPs")+1;
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
		if(i*1000000>clengths[chromosomeIndex]) break;
		let newLine = document.createElementNS(svgNS,'line');
		let x1x2=i*100000000/clengths[chromosomeIndex];
		newLine.setAttribute('x1',x1x2 + "%");
		newLine.setAttribute('x2',x1x2 + "%");
		newLine.setAttribute('y1', "0%");
		newLine.setAttribute('y2', "100%");
		newLine.setAttribute("stroke", "#DDDDDD");
		svg.appendChild(newLine);
	}
	for(let i=0; i<250; i+=50){
		if(i*1000000>clengths[chromosomeIndex]) break;
		let newLine = document.createElementNS(svgNS,'line');
		let x1x2=i*100000000/clengths[chromosomeIndex];
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
		if(i*1000000>clengths[chromosomeIndex]) break;

			let text= document.createElementNS(svgNS, 'text');
			let x1x2=i*100000000/clengths[chromosomeIndex];

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
		let offset=parseInt(tbody.children[i].children[startIndex].innerText);
		let width=parseInt(tbody.children[i].children[endIndex].innerText);
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

function createButton( ){
	let newButton=document.createElement('button');
	newButton.innerHTML="Create Match Table";
	newButton.title="Shift-click to color code buttons (red=unchecked matches, blue=all matches checked, Alt-click to show matches since last csv save)";
	newButton.setAttribute("type","button");
	newButton.addEventListener('click', function(evt){requestSelectFromDatabase(evt.shiftKey, evt.altKey);});
	document.getElementById("buttonrow").appendChild(newButton);
}

function createCSVButton( ){
	let newButton=document.createElement('button');
	newButton.innerHTML="Download CSV update";
	newButton.title="Always includes 23andMe ID's; Shift-click to include all previously exported; Alt-click to also include non-match info";
	newButton.setAttribute("type","button");
	newButton.addEventListener('click', function(evt){requestSelectFromDatabaseForCSV(evt.shiftKey, evt.altKey);});
	document.getElementById("buttonrow").appendChild(newButton);
}
function createGEXFButton( ){
	let newButton=document.createElement('button');
	newButton.innerHTML="Download GEXF";
	newButton.setAttribute("type","button");
	newButton.addEventListener('click', function(){requestSelectFromDatabaseForGEXF();});
	document.getElementById("buttonrow").appendChild(newButton);
}
function createSVGButton( ){
	let newButton=document.createElement('button');
	newButton.innerHTML="Download SVG";
	newButton.setAttribute("type","button");
	newButton.addEventListener('click', function(){downloadSVG();});
	document.getElementById("buttonrow").appendChild(newButton);
}
function createImportButton(){
	let newButton=document.createElement('button');
	newButton.innerHTML="Import CSV";
	newButton.setAttribute("type","button");
	newButton.addEventListener('click', function(){document.getElementById("upfile").click();});
	document.getElementById("buttonrow").appendChild(newButton);
	document.getElementById("upfile").addEventListener('change', requestImportToDatabase);
}

function createClearFilterButton(){
	let newButton=document.createElement('button');
	newButton.innerHTML="Clear filter";
	newButton.id="clearFilterButton";
	newButton.setAttribute("type", "button");
	newButton.style.visibility="hidden";
	newButton.addEventListener('click', function(){
		document.getElementById("selectNameFilter").value="";
  		document.getElementById("clearFilterButton").style.visibility="hidden";
  		getMatchesFromDatabase(createNameSelector);
  		});
	document.getElementById("filterDiv").appendChild(newButton);
}


function createDeleteButton(){
	let newButton=document.createElement('button');
	newButton.innerHTML="Delete All 529renew Data";
	newButton.setAttribute("type", "button");
	newButton.addEventListener('click', function(){requestDeletionFromDatabase();});
	document.getElementById("buttonrow").appendChild(newButton);
}

function resetAfterDeletion(){
	getMatchesFromDatabase(createNameSelector);
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
/*
** MOVED TO popup - left here for debugging but not normally visible
*/
function setBPRoundingSelector(){
	var widget=document.getElementById("roundingBP");
	widget.value=getSetting( "baseAddressRounding" ).toString();
	widget.onchange=function(){
		setSetting( "baseAddressRounding", parseInt(widget.value));
	};
}
function setcMRoundingSelector(){
	var widget=document.getElementById("roundingcM");
	widget.value=getSetting( "cMRounding" ).toString();
	widget.onchange=function(){
		setSetting( "cMRounding", parseInt(widget.value));
	};
}
function setDelaySelector(){
	var widget=document.getElementById("delay");
	widget.value=getSetting( "delay" );
	widget.onchange=function(){
		setSetting( "delay", widget.value);
	};
}

/* 
function setBuildSelector(){
	return;		// ignore this atm.
	
	var widget=document.getElementById("build");
	widget.value=getSetting( "build");
	widget.onchange=function(){
		setSetting( "build", widget.value);
		if(document.getElementById("table_div").hasChildNodes()){
			requestSelectFromDatabase(false, false);
		}
	};
	
}
*/

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

function updateSelectedName(idstr) {
	var el=document.getElementById("selectName");
	if ( idstr.length == 16 ) {
		// used the ID passed in the call
		el.value = idstr;
	} else if(window.location.search.length==20) {
		// otherwise check for any parameter in the url (deprecated, but left in just in case)
		el.value=window.location.search.substring(4);
	}
}

// This is the callback from the DB search of names (possibly filtered)
// each row of the results gives the "name" and the "id" as a string
function createNameSelector(transaction, results){
	// Remove existing nodes
	if(results.message){
		alert("Failed to retrieve list of people for whom match data are available");
		return;
	}

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
	// each row is name, idtext
	for(let i=0; i<results.rows.length; i++){
		let row = results.rows.item(i);
		let op=document.createElement('option');
		op.text=row.name;
		op.value=row.idText;
		el.appendChild(op);
	}
	updateSelectedName( "" );
}

function colorizeButton(button, cid1,  cid2){
	return function(transaction, results){
		var cmatchIds1=new Array();
		var cnonmatchIds1=new Array();
		var cmatchIds2=new Array();
		var cnonmatchIds2=new Array();
		var sharingIds=new Array();
		{
			let ci;
			for(ci=0; ci<results.rows.length; ci++){
				let crow = results.rows.item(ci);
				if((ci+1)<results.rows.length){
					if(results.rows.item(ci+1).ROWID==crow.ROWID){
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
	};
}

// The createTable and createCSV.. functions are sql transaction callbacks
function createTable(transaction, results){
	createTable12(transaction, results, false);
}
function createTable2(transaction, results){
	createTable12(transaction, results, true);
}
/*
** createTable12
** does the bulk of the processing after the big join
** Lays out the "Match Table" for the selected person.
*/
function createTable12(transaction, results, colorize){
	var graphNode=document.getElementById("529graph");
	if(graphNode!=null) graphNode.parentNode.removeChild(graphNode);

	if(results.message){
		alert("createTable12: Failed to retrieve match data: "+ results.message);
		return;
	}

	var omitAliases=getSetting( "omitAliases");
	var hideCloseMatches=getSetting( "hideCloseMatches" );


	if(hideCloseMatches && document.getElementById("selectName").selectedIndex==0) hideCloseMatches=false;

	var displayMode=document.getElementById("displayMode");
	var showURL=(displayMode.value>0);
	var enableShowSegments=(displayMode.value>1);


	// Remove any preexisting table
	while(document.getElementById("table_div").hasChildNodes()){
		document.getElementById("table_div").removeChild(document.getElementById("table_div").children[0]);
	}
	if(results.rows.length>5000){
		if(!confirm("Display " + results.rows.length + " matching segments? That could take a while.")) return;
	}
	db_conlog( 1, `CreateTable12-query returned ${results.rows.length} rows.`)
	var table=document.createElement("table");

	document.getElementById("table_div").appendChild(table);

	var suppressed_ids=null;
	if(hideCloseMatches && results.rows.length>21){
		let ids=new Array();
		let counts=new Array();

		for(let i=0; i<results.rows.length; i++){

			let row = results.rows.item(i);
			if(!row.chromosome) break;
			if(row.chromosome==100) break;
			if((i+1)<results.rows.length){
				if(results.rows.item(i+1).ROWID==row.ROWID) continue;
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
	for(let i=0; i<results.rows.length; i++) {

		let row = results.rows.item(i);
		if(!row.chromosome) break;
		if(row.chromosome==100) break;

		if(omitAliases){
			if((i+1)<results.rows.length){
				if(results.rows.item(i+1).ROWID==row.ROWID) continue;
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
				//link.setAttribute("href", chrome.runtime.getURL('results_tab.html')+"?id=" + numbers2id([row.id2_1, row.id2_2]));
				link.setAttribute("href", "https://you.23andme.com/profile/" + row.id2 +"/");
				link.setAttribute("target", "_blank");
				link.innerHTML=row.name2;
				link.className="special";
				(tablerow.insertCell(curColumnId++)).appendChild(link);
			}
			else (tablerow.insertCell(curColumnId++)).innerHTML=row.name2;

			if(showURL && row.id1){

				let link = document.createElement("a");
				link.setAttribute("href", chrome.runtime.getURL('results_tab.html')+"?id=" + row.id1);
				link.setAttribute("target", "_blank");
				link.innerHTML=row.name1;
				link.className="special";
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
				link.className="special";
				(tablerow.insertCell(curColumnId++)).appendChild(link);
			}
			else (tablerow.insertCell(curColumnId++)).innerHTML=row.name1;


			if(showURL && row.id2){

				let link = document.createElement("a");
				link.setAttribute("href", chrome.runtime.getURL('results_tab.html')+"?id=" + row.id2);
				link.setAttribute("target", "_blank");
				link.innerHTML=row.name2;
				link.className="special";
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
			tcell.innerHTML=row.start;
		}
		{
			let tcell=tablerow.insertCell(curColumnId++);
			tcell.className="right";
			tcell.innerHTML=row.end;
		}
		{
			let tcell=tablerow.insertCell(curColumnId++);
			tcell.className="right";
			tcell.innerHTML=row.cM+" cM";
		}
		{
			let tcell=tablerow.insertCell(curColumnId++);
			tcell.className="right";
			tcell.innerHTML=row.snps;
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
				selectSegmentMatchesFromDatabase(colorizeButton(button, row.id1, row.id2), row.ROWID);
			}
		}
	}
	// Creating the header after the body prevents rows from being inserted into header
	var tablehead=table.createTHead();
	var tableheadrow=tablehead.insertRow(0);
	{
		let curColumnId=0;
		(tableheadrow.insertCell(curColumnId++)).innerHTML="Name";
		(tableheadrow.insertCell(curColumnId++)).innerHTML="Match name";
		(tableheadrow.insertCell(curColumnId++)).innerHTML="Chromosome";
		(tableheadrow.insertCell(curColumnId++)).innerHTML="Start point";
		(tableheadrow.insertCell(curColumnId++)).innerHTML="End point";
		(tableheadrow.insertCell(curColumnId++)).innerHTML="Genetic distance";
		(tableheadrow.insertCell(curColumnId++)).innerHTML="# SNPs";
		if(enableShowSegments) (tableheadrow.insertCell(curColumnId++)).innerHTML="";
	}
	createMatchSVG(table);
}
function createCSV(transaction, results){
	createCSV12( results, false);
}
function createCSV2(transaction, results){
	createCSV12( results, false);
}
function createCSV3(transaction, results){
	createCSV12( results, true);
}
function createCSV12( results,  includeNonMatch){

	if(results.message){
		alert("createCSV12: Failed to retrieve 12 match data: "+ results.message);
		return;
	}
	var omitAliases=getSetting( "omitAliases");

	var csvarray=new Array();
	csvarray.push("Name, Match name, Chromosome, Start point, End point, Genetic distance, # SNPs, ID, Match ID\n");

	var theName=null;

	for(let i=0; i<results.rows.length; i++) {	//results.rows.length

		let row = results.rows.item(i);
		if(!row.chromosome) break;
		if(row.chromosome==100 && !includeNonMatch) break;

		if(omitAliases){
			if((i+1)<results.rows.length){
				if(results.rows.item(i+1).ROWID==row.ROWID) continue;
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
	/*
	var thisDay=new Date();
	var year=thisDay.getFullYear();
	var month=thisDay.getMonth()+1;
	var date=thisDay.getDate();
	if(month<10) month="0"+month.toString();
	if(date<10) date="0"+date.toString();
	return year.toString()+"-"+ month.toString()+"-"+date.toString();
	*/
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
function createGEXF(transaction, results){

	if(results.message){
		alert("createGEFX: Failed to retrieve match data: "+ results.message);
		return;
	}

	var gexfarray=new Array();
	gexfarray.push('<?xml version="1.0" encoding="UTF-8"?>\n');
	// Was 1.2 draft, but this code is compatible with 1.3...
	gexfarray.push('<gexf xmlns="http://www.gexf.net/1.3" version="1.3" xmlns:viz="http://www.gexf.net/1.3/viz" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.gexf.net/1.3 http://www.gexf.net/1.3/gexf.xsd">\n');
	gexfarray.push('  <meta lastmodifieddate="' + formattedDate2() + '">\n');
	gexfarray.push('    <creator>529renew</creator>\n');
	gexfarray.push('    <description></description>\n');
	gexfarray.push('  </meta>\n');
	gexfarray.push('  <graph defaultedgetype="undirected" mode="static">\n');
	gexfarray.push('    <nodes>\n');
	var nodeArray=new Array();
	for(let i=0; i<results.rows.length; i++){

		let row= results.rows.item(i);
		if(!row.chromosome) break;
		if(row.chromosome==100) break;
		if((i+1)<results.rows.length){
			if(results.rows.item(i+1).ROWID==row.ROWID) continue;
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


	for(let i=0; i<results.rows.length; i++) {	//results.rows.length

		let row = results.rows.item(i);
		if(!row.chromosome) break;
		if(row.chromosome==100) break;

		if((i+1)<results.rows.length){
			if(results.rows.item(i+1).ROWID==row.ROWID) continue;
		}

		let label;
		if(row.chromosome==23) label="X:";
		else label=row.chromosome+":";

		label=label+ row.start + "-" + row.end;

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

/*
** createSegmentTable - db transaction callback, with results of query for matching segments
** - creates html table of segment overlaps between testing pairs
*/

function createSegmentTable(transaction, results){

	let omitAliases=getSetting( "omitAliases");
	let hideCloseMatches=getSetting( "hideCloseMatches" );

	if(hideCloseMatches && document.getElementById("selectName").selectedIndex==0) hideCloseMatches=false;


	if(results.message){
		alert("createSegmentTable: Failed to retrieve match data: "+ results.message);
		return;
	}

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
		for (i=0; i<results.rows.length; i++) {
			let row = results.rows.item(i);
			// result rows are ordered in the first instance by chromosome number, so
			// once we hit chr 100 there are no real results remaining
			if(row.chromosome==100) break;

			if(omitAliases){
				if((i+1)<results.rows.length){
					if(results.rows.item(i+1).ROWID==row.ROWID) continue;
				}
			}
			ii++;

			let matchingSegment={};
			//let matchId=new Array();
			let matchIDObj = {};

			matchingSegment.ROWID=row.ROWID; // 0

			if((expected_id1==row.id2) || (expected_id2==row.id2)){

				matchingSegment.name1=row.name2; // 1
				matchingSegment.name2=row.name1; // 2
				matchingSegment.id1=row.id2; // 3
				//matchingSegment[4]=row.id2_2; // 4
				matchingSegment.id2=row.id1; // 5
				//matchingSegment[6]=row.id1_2; // 6


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

				matchingSegment.name1=row.name1; // 1
				matchingSegment.name2=row.name2; // 2
				matchingSegment.id1=row.id1; // 3
				//matchingSegment[4]=row.id1_2; // 4
				matchingSegment.id2=row.id2; // 5
				//matchingSegment[6]=row.id2_2; // 6


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
			matchingSegment.chromosome=row.chromosome; // 7
			if(!matchChromosome && row.chromosome<24) matchChromosome=row.chromosome;
			matchingSegment.start=row.start; // 8
			matchingSegment.end=row.end; // 9
			matchingSegment.cM=row.cM; // 10
			matchingSegment.snps=row.snps; // 11

			matchingSegments[ii]=matchingSegment; // i
		}
		// Process the chromosome 100 matches
		for(; i<results.rows.length; i++) {

			let row = results.rows.item(i);

			if(omitAliases){
				if((i+1)<results.rows.length){
					if(results.rows.item(i+1).ROWID==row.ROWID) continue;
				}
			}
			ii++;

			let matchingSegment=new Array();

			matchingSegment.ROWID=row.ROWID;	// 0

			// Screen out segments that don't involve one of the two
			// individuals of interest and someone on the matchIds
			// list of people whom one of them match
			if((expected_id1 == row.id2) ||  (expected_id2 == row.id2)){

				let j;
				for(j=0; j<matchIds.length; j++){
					if(row.id1 == matchIds[j].id) break;
				}
				if(j==matchIds.length) continue;

				matchingSegment.name1=row.name2; // 1
				matchingSegment.name2=row.name1; // 2
				matchingSegment.id1=row.id2; // 3
				//matchingSegment[4]=row.id2_2; // 4
				matchingSegment.id2=row.id1; // 5
				//matchingSegment[6]=row.id1_2; // 6

			}
			else{

				let j;
				for(j=0; j<matchIds.length; j++){
					if(row.id2==matchIds[j].id ) break;
				}
				if(j==matchIds.length) continue;

				matchingSegment.name1=row.name1; // 1
				matchingSegment.name2=row.name2; // 2
				matchingSegment.id1=row.id1; // 3
				//matchingSegment[4]=row.id1_2; // 4
				matchingSegment.id2=row.id2; // 5
				//matchingSegment[6]=row.id2_2; // 6

			}
			{
				// Keep only those pairs that are not already in the list
				// as matching on some actual chromosome
				let k;
				for(k=0; k<matchingSegments.length; k++){
					if(matchingSegments[k].id1==matchingSegment.id1 &&
						//matchingSegments[k][4]==matchingSegment[4] &&
						matchingSegments[k].id2==matchingSegment.id2
						//&& matchingSegments[k][6]==matchingSegment[6]
						) break;
				}
				if(k==matchingSegments.length){
					matchingSegment.chromosome=row.chromosome; // 7
					matchingSegment.start=row.start; // 8
					matchingSegment.end=row.end; // 9
					matchingSegment.cM=row.cM; // 10
					matchingSegment.snps=row.snps; // 11

					matchingSegments.push(matchingSegment); // i
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
			matchingSegment.ROWID=-1; // 0
			if(matches1){
				matchingSegment.name1=expectedName2; // 1
				matchingSegment.name2=matchIds[j].name; // 2
				matchingSegment.id1=expected_id2; // 3
				//matchingSegment[4]=expected_id2_2; // 4
			}
			else if(matches2){
				matchingSegment.name1=expectedName1;
				matchingSegment.name2=matchIds[j].name; // 2
				matchingSegment.id1=expected_id1; // 3
				//matchingSegment[4]=expected_id1_2; // 4
			}
			else{
				return; // The page has changed for a new query, so this task is no longer relevant
			}

			matchingSegment.id2=matchIds[j].id; // 5
			matchingSegment.chromosome=200; // 7
			matchingSegment.start="?"; // 8
			matchingSegment.end="?"; // 9
			matchingSegment.cM="?"; // 10
			matchingSegment.snps="?"; // 11

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
					link.setAttribute("href", "https://you.23andme.com/profile/" + matchingSegmentsArray[k][i].id1 +"/");

					link.setAttribute("target", "_blank");
					link.innerHTML=matchingSegmentsArray[k][i].name1;
					link.className="special";
					let cell=tablerow.insertCell(curColumnId++);
					(cell).appendChild(link);
					if(i==matchingSegmentsArray[k].length-1){
						cell.className="bottom";
					}
				}


				{
					let link = document.createElement("a");
					link.setAttribute("href", chrome.runtime.getURL('results_tab.html')+"?id=" + matchingSegmentsArray[k][i].id2);
					link.setAttribute("target", "_blank");
					link.innerHTML=matchingSegmentsArray[k][i].name2;
					link.className="special";
					let cell=tablerow.insertCell(curColumnId++);
					(cell).appendChild(link);
					if(i==matchingSegmentsArray[k].length-1){
						cell.className="bottom";
					}
				}


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
						(cell).innerHTML=matchingSegmentsArray[k][i].start;
						if(i==matchingSegmentsArray[k].length-1){
							cell.className="bottom_right";
						}
						else cell.className="right";
					}
					{
						let cell=tablerow.insertCell(curColumnId++);
						(cell).innerHTML=matchingSegmentsArray[k][i].end;
						if(i==matchingSegmentsArray[k].length-1){
							cell.className="bottom_right";
						}
						else cell.className="right";
					}
					{
						let cell=tablerow.insertCell(curColumnId++);
						(cell).innerHTML=matchingSegmentsArray[k][i].cM+" cM";
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
						/*  This does nothing - presumably can't send message in this context
						let buttonCompare = document.createElement("button");
						function makeComparison(indexId, matchId, indexName, matchName){
							return function(evt){
								evt.srcElement.disabled=true;
								chrome.runtime.sendMessage({mode: "checkIfInDatabase",  indexId: indexId, matchId: matchId, indexName: indexName, matchName: matchName, forceSegmentUpdate: evt.shiftKey});
							};
						}
						buttonCompare.className="special";
						buttonCompare.onclick=makeComparison(matchingSegmentsArray[k][i].id1, matchingSegmentsArray[k][i].id2, matchingSegmentsArray[k][i].name1, matchingSegmentsArray[k][i].name2);
						buttonCompare.innerHTML="get 23andMe comparison";
						// Previously provided link to compare
						(tablerow.insertCell(curColumnId++)).append(buttonCompare);  */
						(tablerow.insertCell(curColumnId++)).innerHTML="no data";
					}
				}


			}
		}
	}
	// Creating the header after the body prevents rows from being inserted into header
	let tablehead=table.createTHead();
	let tableheadrow=tablehead.insertRow(0);
	{
		let curColumnId=0;
		(tableheadrow.insertCell(curColumnId++)).innerHTML="Name";
		(tableheadrow.insertCell(curColumnId++)).innerHTML="Match name";
		(tableheadrow.insertCell(curColumnId++)).innerHTML="Chromosome";
		(tableheadrow.insertCell(curColumnId++)).innerHTML="Start point";
		(tableheadrow.insertCell(curColumnId++)).innerHTML="End point";
		(tableheadrow.insertCell(curColumnId++)).innerHTML="cM";
		(tableheadrow.insertCell(curColumnId++)).innerHTML="# SNPs";
	}
	createSVG(table);
}


function displayMatchingSegments(rowid, name1, name2, id1, id2){
	expectedName1=name1;
	expectedName2=name2;
	expected_id1=id1;
	expected_id2=id2;
	db_conlog( 2, `displayMatchingSegments: n1=${name1} and n2=${name2}`);
	selectSegmentMatchesFromDatabase(createSegmentTable, rowid);
}

// display match table on screen
function requestSelectFromDatabase(shiftIsDown, altIsDown){
	if(document.getElementById("selectName").selectedIndex<0) return;
	expectedName=document.getElementById("selectName").options[document.getElementById("selectName").selectedIndex].text;
	var expectedId=document.getElementById("selectName").options[document.getElementById("selectName").selectedIndex].value;
	if(expectedId=='all')
		expectedIdStr=0;
	else
		expectedIdStr=expectedId;

	if(shiftIsDown){
		selectFromDatabase(createTable2, expectedId, document.getElementById("chromosome").options[document.getElementById("chromosome").selectedIndex].value, altIsDown, false);
	}
	else{
		selectFromDatabase(createTable, expectedId, document.getElementById("chromosome").options[document.getElementById("chromosome").selectedIndex].value, altIsDown, false);
	}
}

function requestSelectFromDatabaseForCSV(shiftIsDown, altIsDown){
	if(document.getElementById("selectName").selectedIndex<0) return;
	expectedName=document.getElementById("selectName").options[document.getElementById("selectName").selectedIndex].text;
	var expectedId=document.getElementById("selectName").options[document.getElementById("selectName").selectedIndex].value;
	if(expectedId=='all')
		expectedIdStr=0;
	else
		expectedIdStr=expectedId;
	let limitDates = !shiftIsDown;

	if(altIsDown){
		selectFromDatabase(createCSV3, expectedId, document.getElementById("chromosome").options[document.getElementById("chromosome").selectedIndex].value, limitDates, true);
	}
	else{
		selectFromDatabase(createCSV, expectedId, document.getElementById("chromosome").options[document.getElementById("chromosome").selectedIndex].value, limitDates, false);
	}
}
function requestSelectFromDatabaseForGEXF(){
	if(document.getElementById("selectName").selectedIndex<0) return;
	expectedName=document.getElementById("selectName").options[document.getElementById("selectName").selectedIndex].text;
	var expectedId=document.getElementById("selectName").options[document.getElementById("selectName").selectedIndex].value;
	if(expectedId=='all')
		expectedIdStr=0;
	else
		expectedIdStr=expectedId;
	selectFromDatabase(createGEXF, expectedId, document.getElementById("chromosome").options[document.getElementById("chromosome").selectedIndex].value, false, false);
}

function reloadSoon(){
	document.getElementById("docBody").style.cursor="pointer";
	alert("CSV file parsing complete, database updated");
	location.reload(true);
}
function requestImportToDatabase(evt){
	evt.stopPropagation();
	evt.preventDefault();

	var files = evt.target.files;
	//if(files[0].type!="text/plain"){
		//alert("The file you selected does not appear to be a plain text CSV file, instead it is " + files[0].type);
		//return;
	//}
	var file=files[0];

	var reader = new FileReader();

      // Closure to capture the file information.
      reader.onload = (function(theFile) {
        return function(e) {
        	let lines = e.target.result.split(/\r\n|\r|\n/);
			if(lines[0]==="Name, Match name, Chromosome, Start point, End point, Genetic distance, # SNPs, ID, Match ID"){
        		document.getElementById("docBody").style.cursor="wait";
        		import529CSV(lines, 9, reloadSoon);
        	}
        	else if(lines[0]==="Name, Match name, Chromosome, Start point, End point, Genetic distance, # SNPs, ID, Match ID, Phase, Match phase, Label, Match label, Common ancestors"){
        		document.getElementById("docBody").style.cursor="wait";
        		import529CSV(lines, 14, reloadSoon);
        	}
        	else if(lines[0]==="Name, Match name, Chromosome, Start point, End point, Genetic distance, # SNPs"){
        		alert("This file lacks 23andMe unique identifiers and therefore cannot be imported");
        	}
        	else alert("Unrecognized file format");
        };
      })(file);

    reader.readAsText(file);
}

function requestDeletionFromDatabase(){
	deleteAllData(resetAfterDeletion);
}

// these options are visible only in debug modes, as they are
// duplicates of settings on popup page
function set_option_visibility( level ) {
	if ( debug_db > 1 ) {
		document.getElementById("hiddenOptions")?.classList.remove( "invisible");
	} else if (level > 0 ){
		document.getElementById("hiddenOptions")?.classList.add( "invisible");
	}
	setBPRoundingSelector();
	setcMRoundingSelector();
	setDelaySelector();
}

document.addEventListener('DOMContentLoaded', async function () {
	//if( settings_from_storage === undefined )
	// wait4Settings(1);
	const settingStatus = await retrieveSettingsP();
	db_conlog( 1, `DOMContentLoaded - and settingsP has returned ${settingStatus}.`);
	getMatchesFromDatabase(createNameSelector);
	//getLabelList(createLabelList);
	createButton();
	createCSVButton();
	createGEXFButton();
	createSVGButton();
	createImportButton();
	createClearFilterButton();
	createDeleteButton();

	set_option_visibility();

	setDisplayModeSelector();
	setTextSizeSelector();
	// setBuildSelector();
	setOmitAliasesCheckBox();
	setHideCloseMatchesCheckBox();

	document.getElementById("selectNameFilter").onchange=function(){
		if(document.getElementById("selectNameFilter").value.length>0){
			document.getElementById("clearFilterButton").style.visibility="visible";
			getFilteredMatchesFromDatabase(document.getElementById("selectNameFilter").value, createNameSelector);
		}
		else{
			document.getElementById("clearFilterButton").style.visibility="hidden";
			getMatchesFromDatabase(createNameSelector);
		}
		};

});

