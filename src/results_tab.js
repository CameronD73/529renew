/* jshint esversion:6, browser:true, devel:true */
/*eslint no-unused-vars: "off"*/
/* globals  saveAs, create_button, roundBaseAddress, round_cM */
"use strict";

var expectedName=null;		// assigned values in various places but never used. why?
var expectedIds=null;
var expected_id1_1=null;
var expected_id1_2=null;
var expected_id2_1=null;
var expected_id2_2=null;
var expectedName1=null;
var expectedName2=null;

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
	newButton.title="Shift-click to color code buttons (red=unchecked matches, blue=all matches checked)";
	newButton.setAttribute("type","button");
	newButton.addEventListener('click', function(evt){requestSelectFromDatabase(evt.shiftKey);});
	document.getElementById("test").appendChild(newButton);
}

function createCSVButton( ){
	let newButton=document.createElement('button');
	newButton.innerHTML="Download CSV";
	newButton.title="Shift-click to include 23andMe ID's; Alt-click to also include non-match info";
	newButton.setAttribute("type","button");
	newButton.addEventListener('click', function(evt){requestSelectFromDatabaseForCSV(evt.shiftKey, evt.altKey);});
	document.getElementById("test").appendChild(newButton);
}
function createGEXFButton( ){
	let newButton=document.createElement('button');
	newButton.innerHTML="Download GEXF";
	newButton.setAttribute("type","button");
	newButton.addEventListener('click', function(){requestSelectFromDatabaseForGEXF();});
	document.getElementById("test").appendChild(newButton);
}
function createSVGButton( ){
	let newButton=document.createElement('button');
	newButton.innerHTML="Download SVG";
	newButton.setAttribute("type","button");
	newButton.addEventListener('click', function(){downloadSVG();});
	document.getElementById("test").appendChild(newButton);
}
function createImportButton(){
	let newButton=document.createElement('button');
	newButton.innerHTML="Import CSV";
	newButton.setAttribute("type","button");
	newButton.addEventListener('click', function(){document.getElementById("upfile").click();});
	document.getElementById("test").appendChild(newButton);
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
	newButton.innerHTML="Delete All 529andYou Data";
	newButton.setAttribute("type", "button");
	newButton.addEventListener('click', function(){requestDeletionFromDatabase();});
	document.getElementById("test").appendChild(newButton);
}

function resetAfterDeletion(){
	getMatchesFromDatabase(createNameSelector);
	requestSelectFromDatabase(false);
	alert("All data stored in your 529andYou local database has been deleted");
}
function setDisplayModeSelector(){
	let widget=document.getElementById("displayMode");
	widget.value=getDisplayMode();
	widget.onchange=function(){
		setDisplayMode(widget.value);
		if(document.getElementById("table_div").hasChildNodes()){
			requestSelectFromDatabase(false);
		}
	};
}
function setTextSizeSelector(){
	function setTextSize(){
		let desiredSize=getTextSize();
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
	widget.value=getTextSize();
	widget.onchange=function(){
		setTextSize(widget.value);
		setTextSize();
	};
	setTextSize();
}
function setBuildSelector(){
	var widget=document.getElementById("build");
	widget.value=getBuild();
	widget.onchange=function(){
		setBuild(widget.value);
		if(document.getElementById("table_div").hasChildNodes()){
			requestSelectFromDatabase(false);
		}
	};
}
function setAlwaysShowPhaseCheckBox(){
	var widget=document.getElementById("alwaysShowPhaseCheckBox");
	widget.checked=getAlwaysShowPhase();
	widget.onclick=function(){
		setAlwaysShowPhase(widget.checked);
	};
}
function setAlwaysShowLabelsCheckBox(){
	var widget=document.getElementById("alwaysShowLabelsCheckBox");
	widget.checked=getAlwaysShowLabels();
	widget.onclick=function(){
		setAlwaysShowLabels(widget.checked);
	};
}
function setAlwaysShowCommonAncestorsCheckBox(){
	var widget=document.getElementById("alwaysShowCommonAncestorsCheckBox");
	widget.checked=getAlwaysShowCommonAncestors();
	widget.onclick=function(){
		setAlwaysShowCommonAncestors(widget.checked);
	};
}
function setOmitAliasesCheckBox(){
	var widget=document.getElementById("omitAliasesCheckBox");
	widget.checked=getOmitAliases();
	widget.onclick=function(){
		setOmitAliases(widget.checked);
	};
}
function setHideCloseMatchesCheckBox(){
	var widget=document.getElementById("hideCloseMatchesCheckBox");
	widget.checked=getHideCloseMatches();
	widget.onclick=function(){
		setHideCloseMatches(widget.checked);
	};
}
function createLabelList(transaction, results){
	if(results.message){
		alert("Failed to retrieve list of existing labels");
		return;
	}
	
	var el=document.getElementById("labels");
	while(el.hasChildNodes()){
		el.removeChild(el.lastChild);
	}

	for(let i=0; i<results.rows.length; i++){
		let row = results.rows.item(i);
		let op=document.createElement('option');
		op.value=row.relationship;
		el.appendChild(op);
	}
}
// this is a websql transaction callback, so the args are needed.
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
	for(let i=0; i<results.rows.length; i++){
		let row = results.rows.item(i);
		let op=document.createElement('option');
		op.text=row.name;
		op.value=numbers2id([row.id_1, row.id_2]);
		el.appendChild(op);
	}
	if(window.location.search.length==20){
		el.value=window.location.search.substring(4);
	}
}

function colorizeButton(button, cid1_1, cid1_2, cid2_1, cid2_2){
	return function(transaction, results){
		var cmatchIds1=new Array();
		var cnonmatchIds1=new Array();
		var cmatchIds2=new Array();
		var cnonmatchIds2=new Array();
		//var sharingNamesAndIds=getSharingNamesAndIds();
		var sharingIds=new Array();
		// if(sharingNamesAndIds){
		// 	for(let i=0; i<sharingNamesAndIds.length; i++){
		// 		sharingIds.push(sharingNamesAndIds[i][1]);
		// 	}
		//}
		{
			let ci;
			for(ci=0; ci<results.rows.length; ci++){
				let crow = results.rows.item(ci);
				if((ci+1)<results.rows.length){
					if(results.rows.item(ci+1).ROWID==crow.ROWID){
						continue;
					}
				}															
				if(cid1_1==crow.id1_1 && cid1_2==crow.id1_2){
					// ID1 is listed first in match
					if(cid2_1!=crow.id2_1 || cid2_2!=crow.id2_2){
						// ID2 is not listed second in match
						let cid=numbers2id([crow.id2_1, crow.id2_2]);
						//if(!sharingNamesAndIds /*|| sharingIds.indexOf(cid)!=-1*/)
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
				else if(cid1_1==crow.id2_1 && cid1_2==crow.id2_2){
					// ID1 is listed second in match
					if(cid2_1!=crow.id1_1 || cid2_2!=crow.id1_2){
						// ID2 is not listed first in match
						let cid=numbers2id([crow.id1_1, crow.id1_2]);
						//if(!sharingNamesAndIds || sharingIds.indexOf(cid)!=-1)
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
				else if(cid2_1==crow.id1_1 && cid2_2==crow.id1_2){
					// ID2 is listed first in match
					if(cid1_1!=crow.id2_1 || cid1_2!=crow.id2_2){
						// ID1 is not listed secon in match
						let cid=numbers2id([crow.id2_1, crow.id2_2]);
						//if(!sharingNamesAndIds || sharingIds.indexOf(cid)!=-1)
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
				else if(cid2_1==crow.id2_1 && cid2_2==crow.id2_2){
					// ID2 is listed second in match
					if(cid1_1!=crow.id1_1 || cid1_2!=crow.id1_2){
						//ID1 is not listed first in match
						let cid=numbers2id([crow.id1_1, crow.id1_2]);
						//if(!sharingNamesAndIds || sharingIds.indexOf(cid)!=-1)
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
		//if(!sharingNamesAndIds || sharingIds.indexOf(numbers2id([cid2_1, cid2_2]))!=-1)
		{
			for(let ci=0; ci<cmatchIds1.length; ci++){
				if(cmatchIds2.indexOf(cmatchIds1[ci])==-1 && cnonmatchIds2.indexOf(cmatchIds1[ci])==-1){
					button.style.color='red';
					return;
				}
			}
		}
		//if(!sharingNamesAndIds || sharingIds.indexOf(numbers2id([cid1_1, cid1_2]))!=-1)
		{
			for(let ci=0; ci<cmatchIds2.length; ci++){
				if(cmatchIds1.indexOf(cmatchIds2[ci])==-1 && cnonmatchIds1.indexOf(cmatchIds2[ci])==-1){
					button.style.color='red';
					return;
				}
			}
		}
		button.style.color='blue';
	};
}

// The createTable and createCSV.. functions are sql transaction callbacks
function createTable(transaction, results){
	createTable12(transaction, results, false);
}
function createTable2(transaction, results){
	createTable12(transaction, results, true);
}
function createTable12(transaction, results, colorize){
	var graphNode=document.getElementById("529graph");
	if(graphNode!=null) graphNode.parentNode.removeChild(graphNode);

	if(results.message){
		alert("createTable12: Failed to retrieve match data: "+ results.message);
		return;
	}

	var build=getBuild();
	var omitAliases=getOmitAliases();
	var hideCloseMatches=getHideCloseMatches();
	
	
	if(hideCloseMatches && document.getElementById("selectName").selectedIndex==0) hideCloseMatches=false;
	
	var displayMode=document.getElementById("displayMode");
	var showURL=(displayMode.value>0);
	var showPhaseHints=(displayMode.value>1);
	var showPhaseInfo=(displayMode.value>2);
	var alwaysShowPhase=document.getElementById("alwaysShowPhaseCheckBox").checked;
	var alwaysShowLabels=document.getElementById("alwaysShowLabelsCheckBox").checked;
	var alwaysShowCommonAncestors=document.getElementById("alwaysShowCommonAncestorsCheckBox").checked;



	// Remove any preexisting table
	while(document.getElementById("table_div").hasChildNodes()){
		document.getElementById("table_div").removeChild(document.getElementById("table_div").children[0]);
	}
	if(results.rows.length>5000){
		if(!confirm("Display " + results.rows.length + " matching segments? That could take a while.")) return;
	}
	var table=document.createElement("table");
		
	document.getElementById("table_div").appendChild(table);
	
	var suppressed_id1s=null;
	var suppressed_id2s=null;
	if(hideCloseMatches && results.rows.length>21){
		let id1s=new Array();
		let id2s=new Array();
		let counts=new Array();
		
		for(let i=0; i<results.rows.length; i++){
		
			let row = results.rows.item(i);
			if(!row.chromosome) break;
			if(row.chromosome==100) break;
			if((i+1)<results.rows.length){
				if(results.rows.item(i+1).ROWID==row.ROWID) continue;
			}
			let curr_id1;
			let curr_id2;
			if(expectedIds[0]==row.id2_1 && expectedIds[1]==row.id2_2){
				curr_id1=row.id1_1;
				curr_id2=row.id1_2;
			}
			else {
				curr_id1=row.id2_1;
				curr_id2=row.id2_2;
			}
			{
				let j=0;
				for (; j<id1s.length; j++){
					if(curr_id1==id1s[j] && curr_id2==id2s[j]){
						counts[j]=counts[j]+1;
						break;
					}
				}
				if (j==id1s.length){
					id1s.push(curr_id1);
					id2s.push(curr_id2);
					counts.push(1);
				}
			}
		}
		for(let i=0; i<id1s.length; i++){
			if(counts[i]>21){
				suppressed_id1s=new Array();
				suppressed_id2s=new Array();
				break;
			}
		}
		for(let i=0; i<id1s.length; i++){
			if(counts[i]>21){
				suppressed_id1s.push(id1s[i]);
				suppressed_id2s.push(id2s[i]);
			}
		}
	}
	
	let ii=-1;
	for(let i=0; i<results.rows.length; i++) {	//results.rows.length
	
		let row = results.rows.item(i);
		if(!row.chromosome) break;
		if(row.chromosome==100) break;
		
		if(omitAliases){
			if((i+1)<results.rows.length){
				if(results.rows.item(i+1).ROWID==row.ROWID) continue;
			}
		}
		if(suppressed_id1s){
			let curr_id1=null;
			let curr_id2=null;
			if(expectedIds[0]==row.id2_1 && expectedIds[1]==row.id2_2){
				curr_id1=row.id1_1;
				curr_id2=row.id1_2;
			}
			else{
				curr_id1=row.id2_1;
				curr_id2=row.id2_2;
			}
			let j=0;
			for (; j< suppressed_id1s.length; j++){
				if(curr_id1==suppressed_id1s[j] && curr_id2==suppressed_id2s[j]){
					break;
				}
			}
			if(j< suppressed_id1s.length) continue;
		}
		
		ii++;
		
		let tablerow = table.insertRow(ii);
		
		let curColumnId=0;
		
		if(expectedIds[0]==row.id2_1 && expectedIds[1]==row.id2_2){
		
			if(showURL && row.id2_1 && row.id2_2){

				let link = document.createElement("a");
				//link.setAttribute("href", chrome.runtime.getURL('results_tab.html')+"?id=" + numbers2id([row.id2_1, row.id2_2]));
				link.setAttribute("href", "https://you.23andme.com/profile/" + numbers2id([row.id2_1, row.id2_2]) +"/");
				link.setAttribute("target", "_blank");
				link.innerHTML=row.name2;
				link.className="special";
				(tablerow.insertCell(curColumnId++)).appendChild(link);
			}
			else (tablerow.insertCell(curColumnId++)).innerHTML=row.name2;
			
			if(showPhaseInfo || alwaysShowPhase){
				{
					let cell=tablerow.insertCell(curColumnId++);
					cell.className="center";
					if(showPhaseInfo){
						let select=document.createElement("select");
						select.className="special";
						
						let optionUnknown=document.createElement("option");
						optionUnknown.text="?";
						optionUnknown.value=-1;
						select.appendChild(optionUnknown);
						
						let optionMaternal=document.createElement("option");
						optionMaternal.text="M";
						optionMaternal.value=0;
						select.appendChild(optionMaternal);
						
						let optionPaternal=document.createElement("option");
						optionPaternal.text="P";
						optionPaternal.value=1;
						select.appendChild(optionPaternal);
						
						let optionBoth=document.createElement("option");
						optionBoth.text="B";
						optionBoth.value=2;
						select.appendChild(optionBoth);
						
						let optionNeither=document.createElement("option");
						optionNeither.text="N";
						optionNeither.value=3;
						select.appendChild(optionNeither);
						
						if(row.phase2==null) select.selectedIndex=0;
						else{
							select.selectedIndex=row.phase2+1;
						}
						select.style.backgroundColor=phaseColors[select.selectedIndex];
						select.onchange=createPhaseChangeListener(row.ROWID, 2);
						cell.appendChild(select);
					}
					else if(row.phase2!=null){
						if(row.phase2==0) cell.innerHTML="M";
						else if(row.phase2==1) cell.innerHTML="P";
						else if(row.phase2==2) cell.innerHTML="B";
						else if(row.phase2==3) cell.innerHTML="N";
					}
				}
			}
			if(showPhaseInfo || alwaysShowLabels){
				{
					let cell=tablerow.insertCell(curColumnId++);
					if(showPhaseInfo){
						let input=document.createElement("input");
						input.className="special";
						input.setAttribute("list", "labels");
						input.setAttribute("type", "text");
						if(row.relationship2!=null) input.value=row.relationship2;
						input.onchange=createRelationshipChangeListener(row.ROWID, 2);
						cell.appendChild(input);
					}
					else if(row.relationship2) cell.innerHTML=row.relationship2;
				}

			}

			if(showURL && row.id1_1 && row.id1_2){

				let link = document.createElement("a");
				link.setAttribute("href", chrome.runtime.getURL('results_tab.html')+"?id=" + numbers2id([row.id1_1, row.id1_2]));
				link.setAttribute("target", "_blank");
				link.innerHTML=row.name1;
				link.className="special";
				(tablerow.insertCell(curColumnId++)).appendChild(link);
			}
			else (tablerow.insertCell(curColumnId++)).innerHTML=row.name1;
			
			if(showPhaseInfo || alwaysShowPhase){
				{
					let cell=tablerow.insertCell(curColumnId++);
					cell.className="center";
					if(showPhaseInfo){
						let select=document.createElement("select");
						select.className="special";
						
						let optionUnknown=document.createElement("option");
						optionUnknown.text="?";
						optionUnknown.value=-1;
						select.appendChild(optionUnknown);
						
						let optionMaternal=document.createElement("option");
						optionMaternal.text="M";
						optionMaternal.value=0;
						select.appendChild(optionMaternal);
						
						let optionPaternal=document.createElement("option");
						optionPaternal.text="P";
						optionPaternal.value=1;
						select.appendChild(optionPaternal);
						
						let optionBoth=document.createElement("option");
						optionBoth.text="B";
						optionBoth.value=2;
						select.appendChild(optionBoth);
						
						let optionNeither=document.createElement("option");
						optionNeither.text="N";
						optionNeither.value=3;
						select.appendChild(optionNeither);
						
						if(row.phase1==null) select.selectedIndex=0;
						else{
							select.selectedIndex=row.phase1+1;
						}
						select.style.backgroundColor=phaseColors[select.selectedIndex];
						select.onchange=createPhaseChangeListener(row.ROWID, 1);
						cell.appendChild(select);
					}
					else if(row.phase1!=null){
						if(row.phase1==0) cell.innerHTML="M";
						else if(row.phase1==1) cell.innerHTML="P";
						else if(row.phase1==2) cell.innerHTML="B";
						else if(row.phase1==3) cell.innerHTML="N";
					}
				}
			}
			if(showPhaseInfo || alwaysShowLabels){
				{
					let cell=tablerow.insertCell(curColumnId++);
					if(showPhaseInfo){
						let input=document.createElement("input");
						input.className="special";
						input.setAttribute("list", "labels");
						input.setAttribute("type", "text");
						if(row.relationship1!=null) input.value=row.relationship1;
						input.onchange=createRelationshipChangeListener(row.ROWID, 1);
						cell.appendChild(input);
					}
					else if(row.relationship1) cell.innerHTML=row.relationship1;
				}
			}

		}
		else{
			if(showURL && row.id1_1 && row.id1_2){
			
				let link = document.createElement("a");
				link.setAttribute("href", "https://you.23andme.com/profile/" + numbers2id([row.id1_1, row.id1_2]) +"/");

				link.setAttribute("target", "_blank");
				link.innerHTML=row.name1;
				link.className="special";
				(tablerow.insertCell(curColumnId++)).appendChild(link);
			}
			else (tablerow.insertCell(curColumnId++)).innerHTML=row.name1;
			
			if(showPhaseInfo || alwaysShowPhase){
				{
					let cell=tablerow.insertCell(curColumnId++);
					cell.className="center";
					if(showPhaseInfo){
						let select=document.createElement("select");
						select.className="special";
						
						let optionUnknown=document.createElement("option");
						optionUnknown.text="?";
						optionUnknown.value=-1;
						select.appendChild(optionUnknown);
						
						let optionMaternal=document.createElement("option");
						optionMaternal.text="M";
						optionMaternal.value=0;
						select.appendChild(optionMaternal);
						
						let optionPaternal=document.createElement("option");
						optionPaternal.text="P";
						optionPaternal.value=1;
						select.appendChild(optionPaternal);
						
						let optionBoth=document.createElement("option");
						optionBoth.text="B";
						optionBoth.value=2;
						select.appendChild(optionBoth);
						
						let optionNeither=document.createElement("option");
						optionNeither.text="N";
						optionNeither.value=3;
						select.appendChild(optionNeither);
						
						if(row.phase1==null) select.selectedIndex=0;
						else{
							select.selectedIndex=row.phase1+1;
						}
						select.style.backgroundColor=phaseColors[select.selectedIndex];
						select.onchange=createPhaseChangeListener(row.ROWID, 1);
						cell.appendChild(select);
					}
					else if(row.phase1!=null){
						if(row.phase1==0) cell.innerHTML="M";
						else if(row.phase1==1) cell.innerHTML="P";
						else if(row.phase1==2) cell.innerHTML="B";
						else if(row.phase1==3) cell.innerHTML="N";
					}
				}
			}
			if(showPhaseInfo || alwaysShowLabels){
				{
					let cell=tablerow.insertCell(curColumnId++);
					if(showPhaseInfo){
						let input=document.createElement("input");
						input.className="special";
						input.setAttribute("list", "labels");
						input.setAttribute("type", "text");
						if(row.relationship1!=null) input.value=row.relationship1;
						input.onchange=createRelationshipChangeListener(row.ROWID, 1);
						cell.appendChild(input);
					}
					else if(row.relationship1) cell.innerHTML=row.relationship1;
				}
			}

			
			if(showURL && row.id2_1 && row.id2_2){
			
				let link = document.createElement("a");
				link.setAttribute("href", chrome.runtime.getURL('results_tab.html')+"?id=" + numbers2id([row.id2_1, row.id2_2]));
				link.setAttribute("target", "_blank");
				link.innerHTML=row.name2;
				link.className="special";
				(tablerow.insertCell(curColumnId++)).appendChild(link);
			}
			else (tablerow.insertCell(curColumnId++)).innerHTML=row.name2;
			
			if(showPhaseInfo || alwaysShowPhase){
				{
					let cell=tablerow.insertCell(curColumnId++);
					cell.className="center";
					if(showPhaseInfo){
						let select=document.createElement("select");
						select.className="special";
	
						let optionUnknown=document.createElement("option");
						optionUnknown.text="?";
						optionUnknown.value=-1;
						select.appendChild(optionUnknown);
						
						let optionMaternal=document.createElement("option");
						optionMaternal.text="M";
						optionMaternal.value=0;
						select.appendChild(optionMaternal);
						
						let optionPaternal=document.createElement("option");
						optionPaternal.text="P";
						optionPaternal.value=1;
						select.appendChild(optionPaternal);
						
						let optionBoth=document.createElement("option");
						optionBoth.text="B";
						optionBoth.value=2;
						select.appendChild(optionBoth);
						
						let optionNeither=document.createElement("option");
						optionNeither.text="N";
						optionNeither.value=3;
						select.appendChild(optionNeither);
						
						if(row.phase2==null) select.selectedIndex=0;
						else{
							select.selectedIndex=row.phase2+1;
						}
						select.style.backgroundColor=phaseColors[select.selectedIndex];
						select.onchange=createPhaseChangeListener(row.ROWID, 2);
						cell.appendChild(select);
					}
					else if(row.phase2!=null){
						if(row.phase2==0) cell.innerHTML="M";
						else if(row.phase2==1) cell.innerHTML="P";
						else if(row.phase2==2) cell.innerHTML="B";
						else if(row.phase2==3) cell.innerHTML="N";					
					}
				}
			}
			if(showPhaseInfo || alwaysShowLabels){
				{
					let cell=tablerow.insertCell(curColumnId++);
					if(showPhaseInfo){
						let input=document.createElement("input");
						input.className="special";
						input.setAttribute("list", "labels");
						input.setAttribute("type", "text");
						if(row.relationship2!=null) input.value=row.relationship2;
						input.onchange=createRelationshipChangeListener(row.ROWID, 2);
						cell.appendChild(input);
					}
					else if(row.relationship2) cell.innerHTML=row.relationship2;
				}
			}
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
			tcell.innerHTML=row.centimorgans+" cM";
		}
		{
			let tcell=tablerow.insertCell(curColumnId++);
			tcell.className="right";
			tcell.innerHTML=row.snps;
		}
		if(showPhaseHints){
			function makeLink(id, name1, name2, id1_1, id1_2, id2_1, id2_2){
				return function(){
					providePhaseClues(id, name1, name2, id1_1, id1_2, id2_1, id2_2);
				};
			}
			let button = document.createElement("button");
			button.className="special";
			button.onclick=makeLink(row.ROWID, row.name1, row.name2, row.id1_1, row.id1_2, row.id2_1, row.id2_2);
			button.innerHTML="show overlapping segments";
			(tablerow.insertCell(curColumnId++)).appendChild(button);
			if(build==37 && colorize){
				if(showPhaseInfo || alwaysShowPhase || alwaysShowLabels)
					selectSegmentMatchesAndPhaseFromDatabase(colorizeButton(button, row.id1_1, row.id1_2, row.id2_1, row.id2_2), row.ROWID);
				else
					selectSegmentMatchesFromDatabase(colorizeButton(button, row.id1_1, row.id1_2, row.id2_1, row.id2_2), row.ROWID);
			}
		}
		if(showPhaseInfo || alwaysShowCommonAncestors){
			{
				let cell=tablerow.insertCell(curColumnId++);
				if(showPhaseInfo){
					let input=document.createElement("input");
					input.className="special";
					input.setAttribute("type", "text");
					if(row.comment!=null) input.value=row.comment;
					input.onchange=createCommonAncestorChangeListener(row.ROWID);
					cell.appendChild(input);
				}
				else if(row.comment) cell.innerHTML=row.comment;
			}
		}
	}
	// Creating the header after the body prevents rows from being inserted into header
	var tablehead=table.createTHead();
	var tableheadrow=tablehead.insertRow(0);
	{
		let curColumnId=0;
		(tableheadrow.insertCell(curColumnId++)).innerHTML="Name";
		if(showPhaseInfo || alwaysShowPhase) (tableheadrow.insertCell(curColumnId++)).innerHTML="Phase";
		if(showPhaseInfo || alwaysShowLabels) (tableheadrow.insertCell(curColumnId++)).innerHTML="Label";
		(tableheadrow.insertCell(curColumnId++)).innerHTML="Match name";
		if(showPhaseInfo || alwaysShowPhase) (tableheadrow.insertCell(curColumnId++)).innerHTML="Match phase";
		if(showPhaseInfo || alwaysShowLabels) (tableheadrow.insertCell(curColumnId++)).innerHTML="Match label";
		(tableheadrow.insertCell(curColumnId++)).innerHTML="Chromosome";
		(tableheadrow.insertCell(curColumnId++)).innerHTML="Start point";
		(tableheadrow.insertCell(curColumnId++)).innerHTML="End point";
		(tableheadrow.insertCell(curColumnId++)).innerHTML="Genetic distance";
		(tableheadrow.insertCell(curColumnId++)).innerHTML="# SNPs";
		if(showPhaseHints) (tableheadrow.insertCell(curColumnId++)).innerHTML="";
		if(showPhaseInfo || alwaysShowCommonAncestors) (tableheadrow.insertCell(curColumnId++)).innerHTML="Common ancestors";
	}
	createMatchSVG(table);
}
function createCSV(transaction, results){
	createCSV12(transaction, results, true, false);
}
function createCSV2(transaction, results){
	createCSV12(transaction, results, true, false);
}
function createCSV3(transaction, results){
	createCSV12(transaction, results, true, true);
}
function createCSV12(transaction, results, includeIds, includeNonMatch){
	
	if(results.message){
		alert("createCSV12: Failed to retrieve 12 match data: "+ results.message);
		return;
	}
	var omitAliases=getOmitAliases();
	
	var csvarray=new Array();
	if(includeIds){
		csvarray.push("Name, Match name, Chromosome, Start point, End point, Genetic distance, # SNPs, ID, Match ID, Phase, Match phase, Label, Match label, Common ancestors\n");
	}
	else{
		csvarray.push("Name, Match name, Chromosome, Start point, End point, Genetic distance, # SNPs\n");
	}
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
		let chromosome=null;
		let startPoint=null;
		let endPoint=null;
		let geneticDistance=null;
		let snps=null;
		let id=null;
		let matchId=null;
		
		let phase=null;
		let matchPhase=null;
		let label=null;
		let matchLabel=null;
		let commonAncestors=null;
		
		if(expectedIds[0]==row.id2_1 && expectedIds[1]==row.id2_2){
			name=row.name2.replace(/,/g,'').replace(/"/g,'').replace(/'/g,'');
			id=numbers2id([row.id2_1, row.id2_2]);
			matchName=row.name1.replace(/,/g,'').replace(/"/g,'').replace(/'/g,'');
			matchId=numbers2id([row.id1_1, row.id1_2]);
		}
		else{
			name=row.name1.replace(/,/g,'').replace(/"/g,'').replace(/'/g,'');
			id=numbers2id([row.id1_1, row.id1_2]);
			matchName=row.name2.replace(/,/g,'').replace(/"/g,'').replace(/'/g,'');
			matchId=numbers2id([row.id2_1, row.id2_2]);
		}
		if(row.chromosome==23){
			chromosome="X";
		}
		else{
			chromosome=row.chromosome;
		}
		startPoint=row.start;
		endPoint=row.end;
		geneticDistance=row.centimorgans;
		snps=row.snps;
		
		if(includeIds){
			if(row.phase1!=null){
				if(row.phase1==0) phase="M";
				else if(row.phase1==1) phase="P";
				else if(row.phase1==2) phase="B";
				else if(row.phase1==3) phase="N";
			}
			else phase="";
			if(row.relationship1!=null) label=row.relationship1;
			else label="";
			if(row.phase2!=null){
				if(row.phase2==0) matchPhase="M";
				else if(row.phase2==1) matchPhase="P";
				else if(row.phase2==2) matchPhase="B";
				else if(row.phase2==3) matchPhase="N";
			}
			else matchPhase="";
			if(row.relationship2!=null) matchLabel=row.relationship2;
			else matchLabel="";
			if(row.comment!=null) commonAncestors=row.comment;
			else commonAncestors="";
		}
		
		if(i==0) theName=name;
		else{
			if(name!=theName) theName=null;
		}
		if(includeIds){
			csvarray.push(name+","+matchName+","+chromosome+","+startPoint+","+endPoint+","+geneticDistance+","+snps+","+id+","+matchId+","+phase+","+label+","+matchPhase+","+matchLabel+","+commonAncestors+"\n");
		}
		else{
			csvarray.push(name+","+matchName+","+chromosome+","+startPoint+","+endPoint+","+geneticDistance+","+snps+"\n");
		}
	}
	if(theName){
		theName=theName.replace(/ /g,"_");
		theName=theName.replace(/\./g,'_');
		theName="_"+theName;
	}
	else theName="";
	
	var blob = new Blob(csvarray, {type: "text/plain;charset=utf-8"});
	saveAs(blob, "529andYou" + theName+ "_" + formattedDate()+ ".csv");
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
	var thisDay=new Date();
	var year=thisDay.getFullYear();
	var month=thisDay.getMonth()+1;
	var date=thisDay.getDate();
	if(month<10) month="0"+month.toString();
	if(date<10) date="0"+date.toString();
	return year.toString()+"-"+ month.toString()+"-"+date.toString();
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
	saveAs(blob, "529andYou.svg");
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
	gexfarray.push('    <creator>529andYou</creator>\n');
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
		let nodeId=numbers2id([row.id1_1, row.id1_2]);
		let j=0;
		for(; j<nodeArray.length; j++){
			if(nodeId==nodeArray[j]) break;
		}
		if(j==nodeArray.length){
			nodeArray.push(nodeId);
			gexfarray.push('      <node id="' + nodeId +'" label="' + row.name1.replace(/"/g,'').replace(/'/g,"") + '"/>\n');
		}
		nodeId=numbers2id([row.id2_1, row.id2_2]);
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
		
		if(expectedIds[0]==row.id2_1 && expectedIds[1]==row.id2_2){
			gexfarray.push('      <edge source="' + numbers2id([row.id1_1, row.id1_2]) +'" target="' + numbers2id([row.id2_1, row.id2_2]) + '" weight="' + row.centimorgans/20 + '" label="'+label+'"/>\n');
		}
		else{
			gexfarray.push('      <edge source="' + numbers2id([row.id2_1, row.id2_2]) +'" target="' + numbers2id([row.id1_1, row.id1_2]) + '" weight="' + row.centimorgans/20 + '" label="' + label +'"/>\n');
		}
	}
	gexfarray.push('    </edges>\n');
	gexfarray.push('  </graph>\n');
	gexfarray.push('</gexf>\n');
	let blob = new Blob(gexfarray, {type: "text/plain;charset=utf-8"});
	saveAs(blob, "529andYou.gexf");
	
}
function createSegmentTable(transaction, results){
	
	var build=getBuild();
	var omitAliases=getOmitAliases();
	var hideCloseMatches=getHideCloseMatches();
	
	if(hideCloseMatches && document.getElementById("selectName").selectedIndex==0) hideCloseMatches=false;

	
	if(results.message){
		alert("createSegmentTable: Failed to retrieve match data: "+ results.message);
		return;
	}
	
	var displayMode=document.getElementById("displayMode");
	//var showURL=(displayMode.value>0);
	//var showPhaseHints=(displayMode.value>1);
	var showPhaseInfo=(displayMode.value>2);
	var alwaysShowPhase=document.getElementById("alwaysShowPhaseCheckBox").checked;
	var alwaysShowLabels=document.getElementById("alwaysShowLabelsCheckBox").checked;
	var alwaysShowCommonAncestors=document.getElementById("alwaysShowCommonAncestorsCheckBox").checked;

	// Remove any preexisting table
	while(document.getElementById("table_div").hasChildNodes()){
		document.getElementById("table_div").removeChild(document.getElementById("table_div").children[0]);
	}
	var tableTitle=document.createElement("h3");
	document.getElementById("table_div").appendChild(tableTitle);
	var table=document.createElement("table");
		
	document.getElementById("table_div").appendChild(table);
	
	var matchingSegments=new Array();
	var matchIds=new Array();
	
		
	var matchChromosome=null;
	{
		// Process the real (non-chromosome 100) matches into the matchingSegments array
		// and place the names of all people who match one of the two individuals
		// into the matchIds array
		let i;
		let ii=-1;
		for (i=0; i<results.rows.length; i++) {
			let row = results.rows.item(i);
			if(row.chromosome==100) break;
			
			if(omitAliases){
				if((i+1)<results.rows.length){
					if(results.rows.item(i+1).ROWID==row.ROWID) continue;
				}
			}
			ii++;

			let matchingSegment=new Array();
			let matchId=new Array();
	
			matchingSegment[0]=row.ROWID; // 0
	
			if((expected_id1_1==row.id2_1 && expected_id1_2==row.id2_2) || 
			   (expected_id2_1==row.id2_1 && expected_id2_2==row.id2_2)){
	
				matchingSegment[1]=row.name2; // 1
				matchingSegment[2]=row.name1; // 2
				matchingSegment[3]=row.id2_1; // 3
				matchingSegment[4]=row.id2_2; // 4
				matchingSegment[5]=row.id1_1; // 5
				matchingSegment[6]=row.id1_2; // 6
				
				if(showPhaseInfo || alwaysShowPhase){
					matchingSegment[13]=[row.phase2, 2];
					matchingSegment[14]=[row.phase1, 1];
				}
				if(showPhaseInfo || alwaysShowLabels){
					matchingSegment[15]=[row.relationship2, 2];
					matchingSegment[16]=[row.relationship1, 1];
				}
				
				if(!((expected_id1_1==row.id1_1 && expected_id1_2==row.id1_2) || 
				     (expected_id2_1==row.id1_1 && expected_id2_2==row.id1_2))){
					let j;
					for(j=0; j<matchIds.length; j++){
						if(matchIds[j][0]==row.id1_1 && matchIds[j][1]==row.id1_2) break;
					}
					if(j==matchIds.length){
						matchId[0]=row.id1_1;
						matchId[1]=row.id1_2;
						matchId[2]=row.name1;
						matchIds.push(matchId);
					}
				}
			}
			else{
			
				matchingSegment[1]=row.name1; // 1
				matchingSegment[2]=row.name2; // 2
				matchingSegment[3]=row.id1_1; // 3
				matchingSegment[4]=row.id1_2; // 4
				matchingSegment[5]=row.id2_1; // 5
				matchingSegment[6]=row.id2_2; // 6
				
				if(showPhaseInfo || alwaysShowPhase){
					matchingSegment[13]=[row.phase1, 1];
					matchingSegment[14]=[row.phase2, 2];
				}
				if(showPhaseInfo || alwaysShowLabels){
					matchingSegment[15]=[row.relationship1, 1];
					matchingSegment[16]=[row.relationship2, 2];
				}
	
				if(!((expected_id1_1==row.id2_1 && expected_id1_2==row.id2_2) || 
				     (expected_id2_1==row.id2_1 && expected_id2_2==row.id2_2))){
					let j;
					for(j=0; j<matchIds.length; j++){
						if(matchIds[j][0]==row.id2_1 && matchIds[j][1]==row.id2_2) break;
					}
					if(j==matchIds.length){
						matchId[0]=row.id2_1;
						matchId[1]=row.id2_2;
						matchId[2]=row.name2;
						matchIds.push(matchId);
					}
				}
			}
			matchingSegment[7]=row.chromosome; // 7
			if(!matchChromosome && row.chromosome<24) matchChromosome=row.chromosome;
			matchingSegment[8]=row.start; // 8 
			matchingSegment[9]=row.end; // 9
			matchingSegment[10]=row.centimorgans; // 10
			matchingSegment[11]=row.snps; // 11
			
			if(showPhaseInfo) matchingSegment[12]=row.comment;
			
			matchingSegments[ii]=matchingSegment; // i
		}
		// Process the chromosome 100 matches
		for(; i<results.rows.length; i++) {
		
			let row= results.rows.item(i);
			
			if(omitAliases){
				if((i+1)<results.rows.length){
					if(results.rows.item(i+1).ROWID==row.ROWID) continue;
				}
			}
			ii++;

			let matchingSegment=new Array();
			
			matchingSegment[0]=row.ROWID;	// 0
			
			// Screen out segments that don't involve one of the two
			// individuals of interest and someone on the matchId
			// list of people whom one of them match
			if((expected_id1_1==row.id2_1 && expected_id1_2==row.id2_2) || 
			   (expected_id2_1==row.id2_1 && expected_id2_2==row.id2_2)){
			
				let j;
				for(j=0; j<matchIds.length; j++){
					if(row.id1_1==matchIds[j][0] && row.id1_2==matchIds[j][1]) break;
				}
				if(j==matchIds.length) continue;
				
				matchingSegment[1]=row.name2; // 1
				matchingSegment[2]=row.name1; // 2
				matchingSegment[3]=row.id2_1; // 3
				matchingSegment[4]=row.id2_2; // 4
				matchingSegment[5]=row.id1_1; // 5
				matchingSegment[6]=row.id1_2; // 6
				
			}
			else{
			
				let j;
				for(j=0; j<matchIds.length; j++){
					if(row.id2_1==matchIds[j][0] && row.id2_2==matchIds[j][1]) break;
				}
				if(j==matchIds.length) continue;
				
				matchingSegment[1]=row.name1; // 1
				matchingSegment[2]=row.name2; // 2
				matchingSegment[3]=row.id1_1; // 3
				matchingSegment[4]=row.id1_2; // 4
				matchingSegment[5]=row.id2_1; // 5
				matchingSegment[6]=row.id2_2; // 6
				
			}
			{
				// Keep only those pairs that are not already in the list
				// as matching on some actual chromosome
				let k;
				for(k=0; k<matchingSegments.length; k++){
					if(matchingSegments[k][3]==matchingSegment[3] &&
						matchingSegments[k][4]==matchingSegment[4] &&
						matchingSegments[k][5]==matchingSegment[5] &&
						matchingSegments[k][6]==matchingSegment[6]) break;
				}
				if(k==matchingSegments.length){
					matchingSegment[7]=row.chromosome; // 7
					matchingSegment[8]=row.start; // 8 
					matchingSegment[9]=row.end; // 9
					matchingSegment[10]=row.centimorgans; // 10
					matchingSegment[11]=row.snps; // 11
					
					if(showPhaseInfo) matchingSegment[12]=row.comment;
					
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
			if(matchIds[j][0]==matchingSegments[i][5] && matchIds[j][1]==matchingSegments[i][6]){
				if(matchingSegments[i][3]==expected_id1_1 && matchingSegments[i][4]==expected_id1_2){
					matches1=true;
					if(matches2) break;
				}
				else if(matchingSegments[i][3]==expected_id2_1 && matchingSegments[i][4]==expected_id2_2){
					matches2=true;
					if(matches1) break;
				}
				else{
					return; // The page has changed for a new query, so this task is no longer relevant
				}
			}
		}
		if(i==matchingSegments.length){
			let matchingSegment=new Array();
			matchingSegment[0]=-1; // 0 
			if(matches1){
				matchingSegment[1]=expectedName2; // 1
				matchingSegment[2]=matchIds[j][2]; // 2
				matchingSegment[3]=expected_id2_1; // 3
				matchingSegment[4]=expected_id2_2; // 4
			}
			else if(matches2){
				matchingSegment[1]=expectedName1;
				matchingSegment[2]=matchIds[j][2]; // 2
				matchingSegment[3]=expected_id1_1; // 3
				matchingSegment[4]=expected_id1_2; // 4
			}
			else{
				return; // The page has changed for a new query, so this task is no longer relevant
				//alert("Programming error 2" + matchIds[j][2]);
			}
			
			matchingSegment[5]=matchIds[j][0]; // 5
			matchingSegment[6]=matchIds[j][1]; // 6
			matchingSegment[7]=200; // 7
			matchingSegment[8]="?"; // 8
			matchingSegment[9]="?"; // 9
			matchingSegment[10]="?"; // 10
			matchingSegment[11]="?"; // 11
			
			matchingSegments.push(matchingSegment);
		}
	}	
	// Sort segments to bring the 3rd party matches together
	// and to order the two people on the original target
	// segment consistently
	matchingSegments.sort(function(a, b){
		if(a[5]>b[5]) return 1;
		else if(a[5]<b[5]) return -1; 
		else if(a[6]>b[6]) return 1;
		else if(a[6]<b[6]) return -1; // match id
		else if(a[3]>b[3]) return 1;
		else if(a[3]<b[3]) return -1;
		else if(a[4]>b[4]) return 1;
		else if(a[4]<b[4]) return -1; // id
		else if(a[8]>b[8]) return 1;
		else if(a[8]<b[8]) return -1; // start
		return 0;
	});

	if(matchingSegments.length>0){
		let matchingSegmentsArray=new Array();
		{
			let target1=matchingSegments[0][5];
			let target2=matchingSegments[0][6];
			let matchingSegmentsK=new Array();
	
			for(let i=0; i<matchingSegments.length; i++){
				if(matchingSegments[i][5]!=target1 || matchingSegments[i][6]!=target2){
					matchingSegmentsArray.push(matchingSegmentsK);
					matchingSegmentsK=new Array();
					target1=matchingSegments[i][5];
					target2=matchingSegments[i][6];
				}
				matchingSegmentsK.push(matchingSegments[i]);
			}
			matchingSegmentsArray.push(matchingSegmentsK);
		}
		matchingSegmentsArray.sort(function(a,b){
			function score(a){
				for(let i=0; i<a.length; i++){
					if(a[i][10]=="?"){
						if(a[i][3]==expected_id1_1 && a[i][4]==expected_id1_2){
							return 0; // non compared to person 2
						}
						else return 4; // non compared to person 1
					}
				}
				for(let i=0; i<a.length; i++){
					if(a[i][10]==0){
						if(a[i][3]==expected_id1_1 && a[i][4]==expected_id1_2){
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
					if(isNaN(parseInt(a[i][8]))) continue;
					if(a[i][8]<0) continue;
					if(a[i][8]<start) start=a[i][8];
				}
				return start;
			}
			function findEnd(a){
				let end=-1;
				for(let i=0; i<a.length; i++){
					if(isNaN(parseInt(a[i][9]))) continue;
					if(a[i][8]<0) continue;
					if(a[i][9]>end) end=a[i][9];
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
			for(let i=0; i<matchingSegmentsArray[k].length; i++) {	//results.rows.length
			
				let tablerow = table.insertRow(i);
				
				let curColumnId=0;

				{

					let link = document.createElement("a");
					link.setAttribute("href", "https://you.23andme.com/profile/" + numbers2id([matchingSegmentsArray[k][i][3], matchingSegmentsArray[k][i][4]]) +"/");
					
					link.setAttribute("target", "_blank");
					link.innerHTML=matchingSegmentsArray[k][i][1];
					link.className="special";
					let cell=tablerow.insertCell(curColumnId++);
					(cell).appendChild(link);
					if(i==matchingSegmentsArray[k].length-1){
						cell.className="bottom";
					}
				}
				
				if(showPhaseInfo || alwaysShowPhase){
					{
						let cell=tablerow.insertCell(curColumnId++);
						if(matchingSegmentsArray[k][i][13]){
						
							if(showPhaseInfo){
						
								let select=document.createElement("select");
								select.className="special";
								
								let optionUnknown=document.createElement("option");
								optionUnknown.text="?";
								optionUnknown.value=-1;
								select.appendChild(optionUnknown);
								
								let optionMaternal=document.createElement("option");
								optionMaternal.text="M";
								optionMaternal.value=0;
								select.appendChild(optionMaternal);
								
								let optionPaternal=document.createElement("option");
								optionPaternal.text="P";
								optionPaternal.value=1;
								select.appendChild(optionPaternal);
								
								let optionBoth=document.createElement("option");
								optionBoth.text="B";
								optionBoth.value=2;
								select.appendChild(optionBoth);
								
								let optionNeither=document.createElement("option");
								optionNeither.text="N";
								optionNeither.value=3;
								select.appendChild(optionNeither);
								
								if(matchingSegmentsArray[k][i][13][0]==null) select.selectedIndex=0;
								else{
									select.selectedIndex=matchingSegmentsArray[k][i][13][0]+1;
								}
								select.style.backgroundColor=phaseColors[select.selectedIndex];
								select.onchange=createPhaseChangeListener(matchingSegmentsArray[k][i][0], matchingSegmentsArray[k][i][13][1]);
								cell.appendChild(select);
							}
							else if(matchingSegmentsArray[k][i][13][0]!=null){
								if(matchingSegmentsArray[k][i][13][0]==0) cell.innerHTML="M";
								else if(matchingSegmentsArray[k][i][13][0]==1) cell.innerHTML="P";
								else if(matchingSegmentsArray[k][i][13][0]==2) cell.innerHTML="B";
								else if(matchingSegmentsArray[k][i][13][0]==3) cell.innerHTML="N";
							}
						}
						if(i==matchingSegmentsArray[k].length-1){
							cell.className="bottom_center";
						}
						else cell.className="center";
					}
				}
				if(showPhaseInfo || alwaysShowLabels){
					{
						let cell=tablerow.insertCell(curColumnId++);
						if(matchingSegmentsArray[k][i][15]){

							if(showPhaseInfo){
								let input=document.createElement("input");
								input.className="special";
								input.setAttribute("list", "labels");
								input.setAttribute("type", "text");
								if(matchingSegmentsArray[k][i][15][0]!=null) input.value=matchingSegmentsArray[k][i][15][0];
								input.onchange=createRelationshipChangeListener(matchingSegmentsArray[k][i][0], matchingSegmentsArray[k][i][15][1]);
								cell.appendChild(input);
							}
							else if(matchingSegmentsArray[k][i][15][0]){
								cell.innerHTML=matchingSegmentsArray[k][i][15][0];
							}
						}
						if(i==matchingSegmentsArray[k].length-1){
							cell.className="bottom_center";
						}
						else cell.className="center";
					}
				}
				
				{
					let link = document.createElement("a");
					link.setAttribute("href", chrome.runtime.getURL('results_tab.html')+"?id=" + numbers2id([matchingSegmentsArray[k][i][5], matchingSegmentsArray[k][i][6]]));
					link.setAttribute("target", "_blank");
					link.innerHTML=matchingSegmentsArray[k][i][2];
					link.className="special";
					let cell=tablerow.insertCell(curColumnId++);
					(cell).appendChild(link);
					if(i==matchingSegmentsArray[k].length-1){
						cell.className="bottom";
					}
				}
				
				if(showPhaseInfo || alwaysShowPhase){
					{
						let cell=tablerow.insertCell(curColumnId++);
						if(matchingSegmentsArray[k][i][14]){
						
							if(showPhaseInfo){
								let select=document.createElement("select");
								select.className="special";
								
								let optionUnknown=document.createElement("option");
								optionUnknown.text="?";
								optionUnknown.value=-1;
								select.appendChild(optionUnknown);
								
								let optionMaternal=document.createElement("option");
								optionMaternal.text="M";
								optionMaternal.value=0;
								select.appendChild(optionMaternal);
								
								let optionPaternal=document.createElement("option");
								optionPaternal.text="P";
								optionPaternal.value=1;
								select.appendChild(optionPaternal);
								
								let optionBoth=document.createElement("option");
								optionBoth.text="B";
								optionBoth.value=2;
								select.appendChild(optionBoth);
								
								let optionNeither=document.createElement("option");
								optionNeither.text="N";
								optionNeither.value=3;
								select.appendChild(optionNeither);
								
								if(matchingSegmentsArray[k][i][14][0]==null) select.selectedIndex=0;
								else{
									select.selectedIndex=matchingSegmentsArray[k][i][14][0]+1;
								}
								select.style.backgroundColor=phaseColors[select.selectedIndex];
								select.onchange=createPhaseChangeListener(matchingSegmentsArray[k][i][0], matchingSegmentsArray[k][i][14][1]);
								cell.appendChild(select);
							}
							else if(matchingSegmentsArray[k][i][14][0]!=null){
								if(matchingSegmentsArray[k][i][14][0]==0) cell.innerHTML="M";
								else if(matchingSegmentsArray[k][i][14][0]==1) cell.innerHTML="P";
								else if(matchingSegmentsArray[k][i][14][0]==2) cell.innerHTML="B";
								else if(matchingSegmentsArray[k][i][14][0]==3) cell.innerHTML="N";
							}
						}
						if(i==matchingSegmentsArray[k].length-1){
							cell.className="bottom_center";
						}
						else cell.className="center";
					}
				}
				if(showPhaseInfo || alwaysShowLabels){
					{
						let cell=tablerow.insertCell(curColumnId++);
						if(matchingSegmentsArray[k][i][16]){
							if(showPhaseInfo){
								let input=document.createElement("input");
								input.className="special";
								input.setAttribute("list", "labels");
								input.setAttribute("type", "text");
								if(matchingSegmentsArray[k][i][16][0]!=null) input.value=matchingSegmentsArray[k][i][16][0];
								input.onchange=createRelationshipChangeListener(matchingSegmentsArray[k][i][0], matchingSegmentsArray[k][i][16][1]);
								cell.appendChild(input);
							}
							else if(matchingSegmentsArray[k][i][16][0]){
								cell.innerHTML=matchingSegmentsArray[k][i][16][0];
							}
						}
						if(i==matchingSegmentsArray[k].length-1){
							cell.className="bottom_center";
						}
						else cell.className="center";
					}
				}

				if(matchingSegmentsArray[k][i][7]==100){
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
						if(matchingSegmentsArray[k][i][7]==23){
							tcell.innerHTML="X";
						}
						else if(matchingSegmentsArray[k][i][7]==200){
							if(matchChromosome==23) tcell.innerHTML="X";
							else tcell.innerHTML=matchChromosome;
						}
						else{
							tcell.innerHTML=matchingSegmentsArray[k][i][7];
						}
						if(i==matchingSegmentsArray[k].length-1){
							tcell.className="bottom_center";
						}
						else tcell.className="center";
					}
					{
						let cell=tablerow.insertCell(curColumnId++);
						(cell).innerHTML=matchingSegmentsArray[k][i][8];
						if(i==matchingSegmentsArray[k].length-1){
							cell.className="bottom_right";
						}
						else cell.className="right";
					}
					{
						let cell=tablerow.insertCell(curColumnId++);
						(cell).innerHTML=matchingSegmentsArray[k][i][9];
						if(i==matchingSegmentsArray[k].length-1){
							cell.className="bottom_right";
						}
						else cell.className="right";
					}
					{
						let cell=tablerow.insertCell(curColumnId++);
						(cell).innerHTML=matchingSegmentsArray[k][i][10]+" cM";
						if(i==matchingSegmentsArray[k].length-1){
							cell.className="bottom_right";
						}
						else cell.className="right";
					}
					{
						let cell=tablerow.insertCell(curColumnId++);
						(cell).innerHTML=matchingSegmentsArray[k][i][11];
						if(i==matchingSegmentsArray[k].length-1){
							cell.className="bottom_right";
						}
						else cell.className="right";
					}
						
					if(matchingSegmentsArray[k][i][0]>=0){
						function makeLink(id, name1, name2, id1_1, id1_2, id2_1, id2_2){
							return function(){
								providePhaseClues(id, name1, name2, id1_1, id1_2, id2_1, id2_2);
							};
						}
						let button = document.createElement("button");
						button.onclick=makeLink(matchingSegmentsArray[k][i][0], matchingSegmentsArray[k][i][1], matchingSegmentsArray[k][i][2], matchingSegmentsArray[k][i][3], matchingSegmentsArray[k][i][4], matchingSegmentsArray[k][i][5], matchingSegmentsArray[k][i][6]);
						button.className="special";
						if((matchingSegmentsArray[k][i][3]==expected_id1_1 && 
							matchingSegmentsArray[k][i][4]==expected_id1_2 && 
							matchingSegmentsArray[k][i][5]==expected_id2_1 && 
							matchingSegmentsArray[k][i][6]==expected_id2_2) || 
							(matchingSegmentsArray[k][i][3]==expected_id2_1 &&
							matchingSegmentsArray[k][i][4]==expected_id2_2 &&
							matchingSegmentsArray[k][i][5]==expected_id1_1 && 
							matchingSegmentsArray[k][i][6]==expected_id1_2
							)){
							
							button.innerHTML="reload";
							if(matchingSegmentsArray[k][i][7]==23){
								tableTitle.innerHTML="Segments overlapping match of " + matchingSegmentsArray[k][i][1] + " and " + matchingSegmentsArray[k][i][2] + ", chr X:" +matchingSegmentsArray[k][i][8]+ "-" + matchingSegmentsArray[k][i][9];
							}
							else{
								tableTitle.innerHTML="Segments overlapping match of " + matchingSegmentsArray[k][i][1] + " and " + matchingSegmentsArray[k][i][2] + ", chr " + matchingSegmentsArray[k][i][7]+ ":" +matchingSegmentsArray[k][i][8]+ "-" + matchingSegmentsArray[k][i][9];
							}
						}
						else button.innerHTML="show overlapping segments";
						(tablerow.insertCell(curColumnId++)).appendChild(button);
						
					}
					else{
						//let bothAreSharing=true;
						let firstId=numbers2id([matchingSegmentsArray[k][i][3], matchingSegmentsArray[k][i][4]]);
						let secondId=numbers2id([matchingSegmentsArray[k][i][5], matchingSegmentsArray[k][i][6]]);
						let firstIsSharing=false;
						let secondIsSharing=false;
						// if(sharingNamesAndIds){
						// 	for(let ii=0; ii<sharingNamesAndIds.length; ii++){
						// 		if(sharingNamesAndIds[ii][1]===firstId){
						// 			firstIsSharing=true;
						// 			break;
						// 		}
						// 	}
						// 	if(firstIsSharing){
						// 		for(let ii=0; ii<sharingNamesAndIds.length; ii++){
						// 			if(sharingNamesAndIds[ii][1]===secondId){
						// 				secondIsSharing=true;
						// 			}
						// 		}
						// 	}
						// }
						//if((firstIsSharing && secondIsSharing) || !sharingNamesAndIds)
						{
							let buttonCompare = document.createElement("button");
							function makeComparison(indexId, matchId, indexName, matchName){
								return function(evt){
									evt.srcElement.disabled=true;
									chrome.runtime.sendMessage({checkIfInDatabase: true, indexId: indexId, matchId: matchId, indexName: indexName, matchName: matchName, shiftIsDown: evt.shiftKey});
								};
							}
							buttonCompare.className="special";
							buttonCompare.onclick=makeComparison(numbers2id([matchingSegmentsArray[k][i][3], matchingSegmentsArray[k][i][4]]), numbers2id([matchingSegmentsArray[k][i][5], matchingSegmentsArray[k][i][6]]), matchingSegmentsArray[k][i][1], matchingSegmentsArray[k][i][2]);
							buttonCompare.innerHTML="compare";
							// Previously provided link to compare
							(tablerow.insertCell(curColumnId++)).append(buttonCompare);
						}
						// else{
						// 	let cell=tablerow.insertCell(curColumnId++);
						// 	if(!firstIsSharing){
						// 		(cell).innerHTML="Not currently sharing with " + matchingSegmentsArray[k][i][1];
						// 	}
						// 	else{
						// 		(cell).innerHTML="Not currently sharing with " + matchingSegmentsArray[k][i][2];
						// 	}
						// }
					}
				}
	
				
				if(showPhaseInfo){
					let cell=tablerow.insertCell(curColumnId++);
					if(matchingSegmentsArray[k][i][12]!=null)
						(cell).innerHTML=matchingSegmentsArray[k][i][12];
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
		if(showPhaseInfo || alwaysShowPhase) (tableheadrow.insertCell(curColumnId++)).innerHTML="Phase";
		if(showPhaseInfo || alwaysShowLabels) (tableheadrow.insertCell(curColumnId++)).innerHTML="Label";
		(tableheadrow.insertCell(curColumnId++)).innerHTML="Match name";
		if(showPhaseInfo || alwaysShowPhase) (tableheadrow.insertCell(curColumnId++)).innerHTML="Match phase";
		if(showPhaseInfo || alwaysShowLabels) (tableheadrow.insertCell(curColumnId++)).innerHTML="Match label";
		(tableheadrow.insertCell(curColumnId++)).innerHTML="Chromosome";
		(tableheadrow.insertCell(curColumnId++)).innerHTML="Start point";
		(tableheadrow.insertCell(curColumnId++)).innerHTML="End point";
		(tableheadrow.insertCell(curColumnId++)).innerHTML="Genetic distance";
		(tableheadrow.insertCell(curColumnId++)).innerHTML="# SNPs";
		if(showPhaseInfo || alwaysShowCommonAncestors) (tableheadrow.insertCell(curColumnId++)).innerHTML="";
		if(showPhaseInfo) (tableheadrow.insertCell(curColumnId++)).innerHTML="Common ancestors";
	}
	createSVG(table);
}


function providePhaseClues(rowid, name1, name2, id1_1, id1_2, id2_1, id2_2){
	expectedName1=name1;
	expectedName2=name2;
	expected_id1_1=id1_1;
	expected_id1_2=id1_2;
	expected_id2_1=id2_1;
	expected_id2_2=id2_2;
	if(document.getElementById("displayMode").value>2 || document.getElementById("alwaysShowPhaseCheckBox").checked || document.getElementById("alwaysShowLabelsCheckBox").checked){
		selectSegmentMatchesAndPhaseFromDatabase(createSegmentTable, rowid);
	}
	else{
		selectSegmentMatchesFromDatabase(createSegmentTable, rowid);
	}
}

function requestSelectFromDatabase(shiftIsDown){
	if(document.getElementById("selectName").selectedIndex<0) return;
	expectedName=document.getElementById("selectName").options[document.getElementById("selectName").selectedIndex].text;
	var expectedId=document.getElementById("selectName").options[document.getElementById("selectName").selectedIndex].value;
	if(expectedId=='all') expectedIds=[0,0];
	else expectedIds=id2numbers(expectedId);
	
	var wantPhaseInfo=(document.getElementById("displayMode")).selectedIndex>2 || document.getElementById("alwaysShowPhaseCheckBox").checked || document.getElementById("alwaysShowLabelsCheckBox").checked || document.getElementById("alwaysShowCommonAncestorsCheckBox").checked;
	
	if(wantPhaseInfo){
		if(shiftIsDown){
			selectFromDatabaseWithPhaseInfo(createTable2, expectedId, document.getElementById("chromosome").options[document.getElementById("chromosome").selectedIndex].value);
		}
		else{
			selectFromDatabaseWithPhaseInfo(createTable, expectedId, document.getElementById("chromosome").options[document.getElementById("chromosome").selectedIndex].value);
		}
	}
	else{
		if(shiftIsDown){
			selectFromDatabase(createTable2, expectedId, document.getElementById("chromosome").options[document.getElementById("chromosome").selectedIndex].value);
		}
		else{
			selectFromDatabase(createTable, expectedId, document.getElementById("chromosome").options[document.getElementById("chromosome").selectedIndex].value);
		}
	}
}

function requestSelectFromDatabaseForCSV(shiftIsDown, altIsDown){
	if(document.getElementById("selectName").selectedIndex<0) return;
	expectedName=document.getElementById("selectName").options[document.getElementById("selectName").selectedIndex].text;
	var expectedId=document.getElementById("selectName").options[document.getElementById("selectName").selectedIndex].value;
	if(expectedId=='all') expectedIds=[0,0];
	else expectedIds=id2numbers(expectedId);
	if(altIsDown){
		selectFromDatabaseWithNonMatches(createCSV3, expectedId, document.getElementById("chromosome").options[document.getElementById("chromosome").selectedIndex].value);
	}
	else if(shiftIsDown){
		selectFromDatabaseWithPhaseInfo(createCSV2, expectedId, document.getElementById("chromosome").options[document.getElementById("chromosome").selectedIndex].value);
	}
	else{
		selectFromDatabase(createCSV, expectedId, document.getElementById("chromosome").options[document.getElementById("chromosome").selectedIndex].value);
	}
}
function requestSelectFromDatabaseForGEXF(){
	if(document.getElementById("selectName").selectedIndex<0) return;
	expectedName=document.getElementById("selectName").options[document.getElementById("selectName").selectedIndex].text;
	var expectedId=document.getElementById("selectName").options[document.getElementById("selectName").selectedIndex].value;
	if(expectedId=='all') expectedIds=[0,0];
	else expectedIds=id2numbers(expectedId);
	selectFromDatabase(createGEXF, expectedId, document.getElementById("chromosome").options[document.getElementById("chromosome").selectedIndex].value);
}

function reloadSoon(){
	document.getElementById("docBody").style.cursor="pointer";
	alert("CSV file parsing complete; 529andYou page will reload");
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
        		import529CSV(lines, reloadSoon);
        	}
        	else if(lines[0]==="Name, Match name, Chromosome, Start point, End point, Genetic distance, # SNPs, ID, Match ID, Phase, Match phase, Label, Match label, Common ancestors"){
        		document.getElementById("docBody").style.cursor="wait";
        		importWithPhase529CSV(lines, reloadSoon);
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

document.addEventListener('DOMContentLoaded', function () {
	db_conlog( 1, "domload");
	getMatchesFromDatabase(createNameSelector);
	getLabelList(createLabelList);
	//echo(createButton);
	//echo(createCSVButton);
	createButton();
	createCSVButton();
	echo(createGEXFButton);
	echo(createSVGButton);
	echo(createImportButton);
	echo(createClearFilterButton);
	echo(createDeleteButton);
	echo(setDisplayModeSelector);
	echo(setTextSizeSelector);
	echo(setBuildSelector);
	echo(setOmitAliasesCheckBox);
	echo(setHideCloseMatchesCheckBox);
	echo(setAlwaysShowPhaseCheckBox);
	echo(setAlwaysShowLabelsCheckBox);
	echo(setAlwaysShowCommonAncestorsCheckBox);
	
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


/*
** redundant stuff...
** chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
	db_conlog( 1, "result_tab msg received with req: " + Object.keys( request ) );
    if(request.greeting == "hello"){
      	if(document.getElementById("compare-button")!=null){
     		if(document.getElementById('b529')==null){
      			create_button();
      		}
      		else{
      			alert("Use the menubar '529' button you just clicked to reload the\n529andYou buttons currently embedded in the page when they are missing");
      		}
      	}
      	else{
      		if(document.getElementById("compare-view-chromosomes")!=null){
      			alert("To access 529andYou:\n1. Click the green 'Edit view' button\n2. Wait for the page to refresh\n3. Reclick the menubar '529' button that you just clicked\n4. Use the 529andYou buttons embedded in the page");
      		}
      	}
    }
  	if(request.needToCompare!=null){
  	  	
		function makeSegmentSaver(indexName, indexId, matchName, matchId){
			return function(){
			
				if(this.status!=200){
					if(this.status==403){
					
					alert("Failed to retrieve comparison of " + indexName+ " and " + matchName +" from 23andMe\nError 403 suggests you are no longer sharing with one or both");

					}
					else{
					alert("Failed to retrieve comparison of " + indexName+ " and " + matchName +" from 23andMe\nServer returned status of " + this.status);
					}
					return;
				}
				let data=JSON.parse(this.responseText);
				
				let matchingSegments=new Array();
				let ids=new Array();
				{
					let id=new Array();
					id[0]=indexId;
					id[1]=indexName;
					ids[0]=id;
				}
				{
					let id=new Array();
					id[0]=matchId;
					id[1]=matchName;
					ids[1]=id;
				}

				if(data!=null){
					for(let j=0; j<data.length; j++){
						let matchingSegment=new Array();
						matchingSegment[0]=indexName;
						matchingSegment[1]=matchName;
						matchingSegment[2]=data[j].chromosome;
						matchingSegment[3]=roundBaseAddress(data[j].start);
						if(matchingSegment[3]==0)
							matchingSegment[3]=1;
						matchingSegment[4]=roundBaseAddress(data[j].end);
						matchingSegment[5]=round_cM(data[j].seg_cm);
						matchingSegment[6]=data[j].num_snps;
						
						// Chromosome X=chromosome 23
						if(String(matchingSegment[2])==="X") matchingSegment[2]=23;	
						
						matchingSegments[j]=matchingSegment;
					}
				}
				else{
					alert("Failed to retrieve comparison of " + indexName+ " and " + matchName +" from 23andMe");
					return;
				}
				// Submit for storage in local database
				storeSegments( {ids: ids, matchingSegments: matchingSegments})
				// chrome.runtime.sendMessage({ids: ids, matchingSegments: matchingSegments}, function(response) {});
			};
		}
		function makeErrorHandler(indexName, matchName){
			return function(err){
				alert("Failed to retrieve comparison of " + indexName+ " and " + matchName +" from 23andMe\nAre you logged into your account?");
			};
		}
  		if(request.needToCompare==true){
			let compareURL="https://you.23andme.com/tools/ibd/?human_id_1=" + request.indexId +"&human_id_2="+request.matchId;
			
			let oReq = new XMLHttpRequest();
			oReq.withCredentials = true;
			oReq.onload=makeSegmentSaver(request.indexName, request.indexId, request.matchName, request.matchId);
			oReq.onerror=makeErrorHandler(request.indexName, request.matchName);
			oReq.open("get", compareURL, true);
			oReq.send();
		}
	}
  });
  */

function storeSegments ( segobj ){
//do the stuff previously done in the bgrnd 
	db_conlog( 1, "calling segment store");
	alert( "HELP, PUT SOME CODE HERE in storeSegments" );
}

