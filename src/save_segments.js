/*
* this content script version is for idb segment access.
** Most comments in this file were made trying to interpret the original code and
* do not carry any warranty as to accuracy.
** This version is run using a fifo queue to allow more control over adding delays
* to the server-querying process.
*/
/* eslint no-unused-vars: "off"*/
/* globals roundBaseAddress, round_cM  */
'use strict';

let div=document.createElement('div');
div.id="div529r";

let tr_el=document.createElement('button');
tr_el.innerHTML="Triangulate into 529Renew";
tr_el.id="c529r";
tr_el.title="Shift-click to also include those not sharing a common segment";

var pendingComparisons=0;	// not needed - proxy for queue length
var pendingPages=false;		// not used - I think redundant with new code organisation.
var failedInSomeWay=false;

let debug_q = 3;			// if nonzero, add debugging console output
const increment_ms = 2 * 1000;	// timer delay in milliseconds
//let queued_requests = 0;	// no longer used

const qQueue = new Queue();
// a few more semiglobals relating to this set of triangulation requests
let profileName = null;		// name of primary DNA tester (you?)
let matchName = null;		// name of the dna match for whom we are generating this list of ICW
let loadAllRequested = null;	// if shift key was held when "triangulate" button was clicked

var dispatchMouseEvent = function(target, var_args) {
  var e = document.createEvent("MouseEvents");
  e.initEvent.apply(e, Array.prototype.slice.call(arguments, 1));
  target.dispatchEvent(e);
};

function run_query(personaId, personbId, personaName, personbName){
	chrome.runtime.sendMessage({mode: "checkIfInDatabase", checkIfInDatabase: true, indexId: personaId, matchId: personbId, indexName: personaName, matchName: personbName, shiftIsDown: false});
}

/* this listener handles the return from run_query()
** The message will set needToCompare to true if we need
** to get the results from 23 and me.
*/
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
	/* this callback is made when the query made via run_query() returns with the required details
	** and decision as to whether ibd data needs to be requested from the 23 and me server.
	*/
  	if(request.mode == "returnNeedCompare"){
			// this is the match triangulation set that was just requested to
			// see what we need to do with it.
		let tset = qQueue.dequeue();
		if( debug_q > 1 )
			console.log( `        dequeued part${tset.part},  ${tset.pn1} cf ${tset.pn2}; remaining q=${qQueue.length}`);
		// sanity check...
		if ( request.indexId != tset.id1  || request.matchId != tset.id2 )
			alert( `  ==== URK... ${request.indexId} != ${tset.id1} or ${request.matchId} != ${tset.id2}` );

  		if(request.needToCompare==true){
			function makeSegmentSaver(indexName, indexId, matchName, matchId){
				/* This gets called when the ibd_segments xml request is returned.
				** every return path from here should launch_next_IBD_query()
				*/
				return function(){
				
					if(this.status!=200){
						if( this.status == 429 ){
							console.log("Oops = makesegsaver saw err429 with " + indexName+ " and " + matchName );
						}
						alert("Failed to retrieve comparison of " + indexName+ " and " + matchName +" from 23andMe\nServer returned status of " + this.status);
						if(pendingComparisons>0) pendingComparisons--;
						failedInSomeWay=true;
						launch_next_IBD_query();
						return;
					}
					var data=JSON.parse(this.responseText);
					/* data is an array of objects, each of which is a segment match between two people:
					** each object has 8 records
					*/
					
					var matchingSegments=new Array();
					var ids=new Array();
					ids[0] = {id: indexId, name: indexName };
					ids[1] = {id: matchId, name: matchName };
					/*  CJD use object now rather than array of arrays, so I understand what's happening
					** when it arrives the other end...
					*/

					if( debug_q > 0 )
						console.log( "    saving segments at " + new Date().toISOString() + " for " + ids[0].name + " and " + ids[1].name );
					if(data!=null){
						for(let j=0; j<data.length; j++){
							var matchingSegment= {
								name1: indexName,
								uid1: indexId,
								name2: matchName,
								uid2: matchId,
								chromosome: data[j].chromosome,
								start: roundBaseAddress(data[j].start),
								end: roundBaseAddress(data[j].end),
								cM: round_cM(data[j].seg_cm),
								snps: data[j].num_snps,
							};
							if(matchingSegment.start==0)
								matchingSegment.start=1;
							/*
							//[3]=roundBaseAddress(data[j].start),
							//matchingSegment[4]=roundBaseAddress(data[j].end),
							//matchingSegment[5]=round_cM(data[j].seg_cm),
							//matchingSegment[6]=data[j].num_snps,
							*/
							// Chromosome X=chromosome 23
							if(String(matchingSegment.chromosome)==="X")
								matchingSegment.chromosome=23;	

							matchingSegments[j]=matchingSegment;
						}
					}
					else{
						alert("Failed to retrieve comparison of " + indexName+ " and " + matchName +" from 23andMe");
						if(pendingComparisons>0) pendingComparisons--;
						failedInSomeWay=true;
						launch_next_IBD_query();
						return;
					}
					// Submit for storage in local database
					chrome.runtime.sendMessage({mode: "storeSegments", ids: ids, matchingSegments: matchingSegments} );
					if(pendingComparisons>0) pendingComparisons--;

					launch_next_IBD_query();
					return;

				};
			}
			function makeErrorHandler(indexName, matchName){
				return function(err){
					alert("Failed to retrieve comparison of " + indexName+ " and " + matchName +" from 23andMe");
					if(pendingComparisons>0) pendingComparisons--;
					failedInSomeWay=true;
					launch_next_IBD_query();
					return;
				};
			}

			var compareURL="/tools/ibd/?human_id_1=" + request.indexId +"&human_id_2="+request.matchId;
			
			var oReq = new XMLHttpRequest();
			oReq.withCredentials = true;
			oReq.onload=makeSegmentSaver(request.indexName, request.indexId, request.matchName, request.matchId);
			oReq.onerror=makeErrorHandler(request.indexName, request.matchName);
			oReq.open("get", compareURL, true);
			
			if( debug_q > 2 )
				console.log( "    requesting segs after delay at " + new Date().toISOString() + " for " + request.indexName + " and " + request.matchName );
			setTimeout( () => oReq.send(), increment_ms );
		}
		else{
			if( debug_q > 2 )
				console.log("No need to recompare " + request.indexName + " " + request.matchName);
			if(pendingComparisons>0) pendingComparisons--;
			launch_next_IBD_query();
		}
	}
  });

/*
** callback function to initiate processing the next IBD segment collection
** from the queue
*/
function launch_next_IBD_query() {
	if ( qQueue.length <= 0 ) {
		finishComparisons();
		return;
	}
	let tset = qQueue.peek();
	if( debug_q > 2 )
		console.log( `     sending query for ${tset.pn1} and ${tset.pn2}` );
	run_query( tset.id1, tset.id2, tset.pn1, tset.pn2 );
	return;
}
/*
** this function cleans up at the end of runComparison3
** It should only get called when the segment request queue is empty.
*/
let pendingMismatches = 0;

function finishComparisons() {
	
	if( pendingComparisons > 0 || qQueue.length > 0 ) {
		if ( pendingMismatches > 0 ) {
			alert( `program failure - giving up. Cannot finalise with ${pendingComparisons} pending and Q ${qQueue.length}`);
			document.getElementById("c529r").innerHTML="Triangulation into 529Renew failed";
			return;
		}
		alert( `program failure - called finalise with ${pendingComparisons} pending and Q ${qQueue.length}`);
		document.getElementById("c529r").innerHTML=`Triangulation into 529Renew ${pendingComparisons} pending`;
		pendingMismatches++;
		setTimeout( finishComparisons, 5000);
		return;
	}
	pendingMismatches = 0;
	
	var nextButton=null;
	/*
	* for fewer than 10 entries the paginator bar will be hidden, and
	* the code never hides the "Next" button.
	*/
	var paginator = document.getElementsByClassName("js-paginator");
	if( paginator != null && paginator[0].getAttribute("class").indexOf("hide")>-1  ) {
		pendingPages=false;
		if( debug_q > 2 )
			console.log( "    runComp3: hidden pag page at PG= " + paginator[0].getAttribute("class")   );
	}
	else {
		var nextButtons=document.getElementsByClassName("js-next");
		if(nextButtons.length>0){
			if( debug_q > 2 )
				console.log( "    runComp3: looking for next btn next page at " + new Date().toISOString()  );
			var container=document.getElementsByClassName("js-relatives-table")[0];
			for(let i=0; i<nextButtons.length; i++){
				if(container.contains(nextButtons[i])) nextButton=nextButtons[i];
			}
		}
		/*
		if ( nextButton == null )
			console.log( "next btn null" );
		else
			console.log( "next btn class " + nextButton.getAttribute("class") + "; PG= " + paginator );
		*/
		if(nextButton==null || nextButton.getAttribute("class").indexOf("hide")>-1){
			pendingPages=false;
		}
	}
	if( !pendingPages ) {
		if(failedInSomeWay){
			document.getElementById("c529r").innerHTML="Triangulate into 529Renew (failed)";
			failedInSomeWay=false;
		}
		else{
			document.getElementById("c529r").innerHTML="Triangulation into 529Renew Completed";
		}
	}
	else{
		// Go to the next page and process...
		if( debug_q > 0 )
			console.log( "    runComp3: to next page at " + new Date().toISOString()  );
		dispatchMouseEvent(nextButton, 'click', true, true);
		// give it a bit of time to populate the next 10 matches
		setTimeout(function(){runComparison3(true);}, 2000);
		return;
	}
	
	if( debug_q > 0 )
		console.log( "    comparisons finished at " + new Date().toISOString()  );
}

/*
** this function is run to process a page of (up to 10) shared matches.
*/

function runComparison3(ranPrimaryComparison ){
	var row_container=null;
	
	if( debug_q > 0 )
		console.log( "runComp3: entry: for " + matchName + " and " + profileName  );
	try{
		let rows=document.getElementsByClassName("js-rows");
		if(rows.length<1) throw "Wrong row length";
		let container=document.getElementsByClassName("js-relatives-table");
		if(container.length!=1) throw "Wrong container length";
		container=container[0];
		let row_index=-1;
		for(let i=0; i<rows.length; i++){
			if(container.contains(rows[i])){
				if(rows[i].hasAttribute("class")){
					if(rows[i].getAttribute("class").indexOf("hide-for-mobile")<0) continue;
				}
				if(row_index!=-1) throw "Too many rows in container";
				row_index=i;
			}
		}
		if(row_index==-1) throw "No valid rows";
		row_container=rows[row_index];

	}
	catch(e){
		alert("Failed to extract list of matches from page\n"+e.message);
		return;
	}
	if(row_container.getAttribute("class").indexOf("sd-loadingstate")>-1){
		setTimeout(function(){runComparison3(ranPrimaryComparison);}, 1000);
		return;
	}
	var foundData=false;
	if( debug_q > 1 )
		console.log( " checking " + row_container.children.length + " rows" );
	for(let i=0; i<row_container.children.length; i++){
		if(row_container.children[i].hasAttribute("class")){
			if(row_container.children[i].getAttribute("class").indexOf("row")<0) continue;
			var ids=null;
			var relative_in_common_name=null;
			for(let j=0; j<row_container.children[i].children.length; j++){
				if(row_container.children[i].children[j].hasAttribute("class")){
					if(row_container.children[i].children[j].getAttribute("class").indexOf("shared-dna")<0) continue;
					for(let k=0; k<row_container.children[i].children[j].children.length; k++){

						if(row_container.children[i].children[j].children[k].href!=null){

							var yes_no_text=row_container.children[i].children[j].children[k].innerText;
							if(yes_no_text==null) continue;

							if(yes_no_text=="Yes" || yes_no_text=="No" || yes_no_text=="Share to see") foundData=true;
							if(yes_no_text=="Share to see") continue;
							if(yes_no_text=="No" && !loadAllRequested) continue;
							
							// parse the url to get the 3 profile IDs
							var index=row_container.children[i].children[j].children[k].href.indexOf("p[]=");
							if(index<0) continue;

							index+=4;
							ids=row_container.children[i].children[j].children[k].href.substring(index).split("&p[]=");
							if(ids.length!=3){
								ids=null;
								continue;
							}
							for(let m=0; m<3; m++){
								if(ids[m].length!=16){
									ids=null;
									break;
								}
							}
							if(ids==null) continue;
						}
					}
				}
			}
			if(ids==null) continue;
			for(let j=0; j<row_container.children[i].children.length; j++){
				if(row_container.children[i].children[j].hasAttribute("class")){
					if(row_container.children[i].children[j].getAttribute("class").indexOf("relative-in-common")<0) continue;
					for(let k=0; k<row_container.children[i].children[j].children.length; k++){
						if(row_container.children[i].children[j].children[k].hasAttribute("class")){
							if(row_container.children[i].children[j].children[k].getAttribute("class").indexOf("name")<0) continue;
							relative_in_common_name=row_container.children[i].children[j].children[k].innerText;
							if(relative_in_common_name==null) continue;
							if(relative_in_common_name.length==0){
								relative_in_common_name=null;
								continue;
							}
						}
					}
				}
			}
			if(relative_in_common_name==null) continue;
			
			if(!ranPrimaryComparison){
				qQueue.enqueue( {part:1, id1: ids[1], id2: ids[0], pn1: matchName, pn2:profileName} );
				if( debug_q > 2 )
					console.log( `Added to Q0: ${matchName} and ${profileName}`);
				pendingComparisons++;
				document.getElementById("c529r").innerHTML="Submitting Comparisons...";
				ranPrimaryComparison=true;
			}
			qQueue.enqueue( {part:2, id1: ids[1], id2: ids[2], pn1: matchName, pn2: relative_in_common_name} );
			if( debug_q > 2 )
				console.log( `Added to Q1: ${matchName} and ${relative_in_common_name}`);
			pendingComparisons++;
			qQueue.enqueue( {part:3, id1: ids[2], id2: ids[0], pn1: relative_in_common_name, pn2: profileName} );
			if( debug_q > 2 )
				console.log( `Added to Q2: ${relative_in_common_name} and ${profileName}`);
			pendingComparisons++;
		}
	}
	if(!foundData){
		alert("Failed to parse Relatives in Common table QL " + qQueue.length);
		launch_next_IBD_query();
		return;
	}
	
	document.getElementById("c529r").innerHTML="Submitting Comparisons...";
	launch_next_IBD_query();
	return;   

}



function peelContainerByClassSoft(container, className){
	if(!container.hasChildNodes()) return null;
	for(let i=0; i<container.children.length; i++){
		if(!container.children[i].hasAttributes()) continue;
		if(!container.children[i].hasAttribute("class")) continue;
		if(!(container.children[i].getAttribute("class").indexOf(className)>-1)) continue;
		return container.children[i];
	}
	return null;
}


function getMatchName3(){
	try{
		var matchNames = document.getElementsByClassName("js-profile-name");
		if(matchNames.length!=1) return null;
		return matchNames[0].innerText;
	}
	catch(e){
		return null;
	}
}
function getMatchId(){
	var url_components = window.location.pathname.split('/');
	if(url_components == null) return null;
	if(url_components.length == 0) return null;
	if(url_components.length==6 && url_components[0].length==0 
	  && url_components[1]=="p" && url_components[2].length==16 
	  && url_components[3]=="profile" 
	  && url_components[4].length==16 
	  && url_components[5].length==0 ){
	  	return url_components[4];
	}
	if(url_components.length==4 && url_components[0].length==0
	  && url_components[1]=="profile" 
	  && url_components[2].length==16
	  && url_components[3].length==0){
	  	return url_components[2];
	  }
	return null;
}


function getMyName(){
	try{
	
		var container = document.getElementsByClassName("profile-in-dropdown")[0];
		container=peelContainerByClassSoft(container, "name");

		var firstName=container.children[0].innerHTML.trim();
		var lastName=container.children[1].innerHTML.trim();
		var fullName=firstName+ " " + lastName;

		return fullName;
	}
	catch(err){
		// what is the point? ignore errors?
		return null;
		
	}
}

tr_el.onclick=function(evt){
	var loaded=false;
	try{
		var temp3=document.getElementsByClassName("js-relatives-table")[0];
		if(temp3!=null){
			for(let k=0; k<temp3.children.length; k++){
				if(temp3.children[k].hasAttribute("class")){
					var temp4=temp3.children[k].getAttribute("class");
					if(temp4.indexOf("headers")>-1){
						loaded=true;
						break;
					}
				}
			}
		}

	}
	catch(e){
		alert("Please wait for Relatives in Common to finish loading");
		return;
	}
	if(!loaded){
		alert("Please wait for Relatives in Common to finish loading");
		return;
	}
	
	if(tr_el.innerHTML=="Triangulation into 529Renew Completed") return;
	
	var personaName=getMatchName3();
	if(personaName==null){
		alert("Unable to find match name on page");
		return;
	}
	
	var localName=getMyName();
	if(localName==null || localName.length==0){
		alert("Unable to find your name on page");
		return;
	}
	tr_el.innerHTML="Submitting Comparisons...";
	pendingPages=true;
	
	profileName = localName;
	matchName = personaName;
	loadAllRequested = evt.shiftKey;

	runComparison3(false);
	
	
};

div.appendChild(tr_el);

let b529r=document.createElement('button');
b529r.id="b529r";
b529r.innerHTML="Open";
b529r.style.marginLeft='10px';
b529r.onclick=function(){
	var query=getMatchId();
	if(query!=null){
		query="?id="+query;
	}
	else query="";
	//fixYouAreComparingWithBug();
	chrome.runtime.sendMessage({mode: "displayPage", url:chrome.runtime.getURL('results_tab.html')+query} );
};
let img=document.createElement('img');
img.src=chrome.runtime.getURL("529Renew-48.png");
img.style.verticalAlign='middle';
b529r.appendChild(img);

div.appendChild(b529r);
	
let ric_parent=document.getElementsByClassName("js-profile-relatives-in-common")[0];
let modules=document.getElementsByClassName("module-content");
if(ric_parent!=null && modules!=null){
	var i;
	for(i=0; i<modules.length; i++){
		if(ric_parent.contains(modules[i])) modules[i].appendChild(div);
	}
}

