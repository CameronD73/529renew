/*eslint no-unused-vars: "off"*/
/* globals    roundBaseAddress, round_cM */
"use strict";

var pendingComparisons=0;

function fixYouAreComparingWithBug(){
	chrome.runtime.sendMessage({fixYouAreComparingWithBug: true});
}

const create_button=function(){
	if(document.getElementById("compare-button")==null) return;

	var div=document.createElement('div');

	var tr_el=document.createElement('button');
	tr_el.innerHTML="Compare into 529andYou";
	tr_el.setAttribute("type","button");
	tr_el.id="c529";
	tr_el.title="Shift-click to force re-comparison";


	tr_el.addEventListener('click',
	function(evt){
		var indexId, indexName;
		try{
			var indexCase=document.getElementById("compare-profile-panel");
			indexId=indexCase.children[0].attributes[1].value;
			indexName=(indexCase.children[0].children[0].children[0].innerHTML).trim();
		}
		catch(err){
			return;
		}
		
		var shared;
		try{
			shared=document.getElementById("with-profiles-panel");
		}
		catch(err){
			return;
		}
		
		tr_el.innerHTML="Submitting Comparisons...";
		
		for(var i=0; i<shared.children.length; i++){
		
			var matchId, matchName;
			try{
				matchId=shared.children[i].attributes[1].value;
				matchName=(shared.children[i].children[0].children[0].innerHTML).trim();
			}
			catch(err){
				continue;
			}
			chrome.runtime.sendMessage({checkIfInDatabase: true, indexId: indexId, matchId: matchId, indexName: indexName, matchName: matchName, shiftIsDown: evt.shiftKey});
  			pendingComparisons++;
  		}
	});
	div.appendChild(tr_el);
	document.getElementById("compare-button").parentNode.appendChild(div);
	
	let div2=document.createElement('div');
	div2.style.paddingTop='10px';

	let b529=document.createElement('button');
	b529.id="b529";
	b529.innerHTML="Open";
	b529.onclick=function(){
		fixYouAreComparingWithBug();
		chrome.extension.sendRequest({url:chrome.extension.getURL('results_tab.html')}, function(response) {});
	};
	let img=document.createElement('img');
	img.src=chrome.extension.getURL("529renew-48.png");
	img.style.verticalAlign='middle';
	b529.appendChild(img);
	div2.appendChild(b529);
	document.getElementById("compare-button").parentNode.appendChild(div2);
};

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {

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
					alert("Failed to retrieve comparison of " + indexName+ " and " + matchName +" from 23andMe");
					if(pendingComparisons>0) pendingComparisons--;
					if(pendingComparisons==0) document.getElementById("c529").innerHTML="Compare into 529andYou";
				}
				var data=JSON.parse(this.responseText);
				
				var matchingSegments=new Array();
				var ids=new Array();
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
						var matchingSegment=new Array();
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
					if(pendingComparisons>0) pendingComparisons--;
					if(pendingComparisons==0) document.getElementById("c529").innerHTML="Compare into 529andYou";
				}
				// Submit for storage in local database
				chrome.extension.sendRequest({ids: ids, matchingSegments: matchingSegments}, function(response) {});
				if(pendingComparisons>0) pendingComparisons--;
				if(pendingComparisons==0) document.getElementById("c529").innerHTML="Compare into 529andYou";
			};
		}
		function makeErrorHandler(indexName, matchName){
			return function(err){
				alert("Failed to retrieve comparison of " + indexName+ " and " + matchName +" from 23andMe");
				if(pendingComparisons>0) pendingComparisons--;
				if(pendingComparisons==0) document.getElementById("c529").innerHTML="Compare into 529andYou";
			};
		}
  		if(request.needToCompare==true){
			let compareURL="/tools/ibd/?human_id_1=" + request.indexId +"&human_id_2="+request.matchId;
			
			let oReq = new XMLHttpRequest();
			oReq.withCredentials = true;
			oReq.onload=makeSegmentSaver(request.indexName, request.indexId, request.matchName, request.matchId);
			oReq.onerror=makeErrorHandler(request.indexName, request.matchName);
			oReq.open("get", compareURL, true);
			oReq.send();
		}
		else{
			if(pendingComparisons>0) pendingComparisons--;
			if(pendingComparisons==0) document.getElementById("c529").innerHTML="Compare into 529andYou";
		}
		//else console.log("No need to recompare " + request.indexName + " " + request.matchName);
	}
  });

create_button();

