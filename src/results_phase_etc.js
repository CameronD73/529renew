/*
** yet another interim file to split off stuff that will
** eventually be discarded.
*/



//remaining code is tied to unused fields: phase, relationship, comment...

function createCommonAncestorChangeListener(rowid){
	return function(){
		var commonAncestors=this.value.trim();
		var badValue=false;
		if(commonAncestors.indexOf(",")>-1){
			badValue=true;
			alert("Your common ancestor entry '" + commonAncestors + "' cannot be stored because it contains one or more commas");
		}
		if(!badValue){
			updateCommonAncestors(rowid, commonAncestors);
		}
	};
}
function createPhaseChangeListener(rowid, position){
	return function(evt){
		//alert(rowid + " " + this.selectedIndex + " " +position);
		
		this.style.backgroundColor=phaseColors[this.selectedIndex];
		updatePhase(rowid, this.selectedIndex, position);
	};
}
function createRelationshipChangeListener(rowid, position){
	return function(){
		var relationship=this.value.trim();
		var badValue=false;
		if(relationship.length>0){
			let isNew=true;
			for(let i=0; i<document.getElementById("labels").children.length; i++){
				if(relationship===document.getElementById("labels").children[i].value){
					isNew=false;
					break;
				}
			}
			if(isNew){
				if(/[^a-zA-Z0-9:.\-\\/ ]/.test(relationship)){
					badValue=true;
					alert("Your new label '" + relationship + "' cannot be used. It contains characters other than letters, numbers, spaces, hyphens, periods, colons and forward slashes");
				}
				else{
					let opt=document.createElement("option");
					opt.value=relationship;
					document.getElementById("labels").appendChild(opt);
				}
			}
		}
		if(!badValue){
			updateRelationship(rowid, relationship, position);
		}
		else{
			this.value=null;
		}
	};
}