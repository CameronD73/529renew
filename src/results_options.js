/*
** options for handling results presentation.
*/

/*  eslint-disable no-unused-vars */
"use strict";

// functions to set and get a settings item
// item must be a setting created at installation

// in-page cache of settings
var settings529 = {};
function retrieveSettings(){
// retrieve stored values if they exist
chrome.storage.sync.get('settings529', 
	(data) => {
		if(typeof data.settings529 == 'undefined'){
		// no stored values so load default values
			settings529 =  {
				"version": "0.0",
				"sharingNamesAndIds": null,
				"profileNamesAndIds": null,
				"displayMode": 0,
				"textSize": "small",
				"build": 37,
				"omitAliases": false,
				"alwaysShowPhase": false,
				"alwaysShowLabels": false,
				"alwaysShowCommonAncestors": false,
				"hideCloseMatches": false,
				"bpRounding": true,
				"cMRounding": true,
				"delay": 3, // units of seconds
				"minimumOverlap": 0 //units of bp
			};
			chrome.storage.sync.set({ settings529 });
			console.log("No settings found in storage. Default values loaded and stored.");
		} else {
		// saved values exist so we use them
			Object.assign(settings529, data.settings529);
			console.log("Stored settings retrieved.");
		}
		console.log('Settings are: ', settings529);	
		setDisplayModeSelector();
		setTextSizeSelector();
		setBuildSelector();
		setOmitAliasesCheckBox();
		setHideCloseMatchesCheckBox();
		setAlwaysShowPhaseCheckBox();
		setAlwaysShowLabelsCheckBox();
		setAlwaysShowCommonAncestorsCheckBox();
	});
}

function setSetting(item,value){
	//check that item is in settings
	if(!Object.keys(settings529).includes(item)){
		console.log("Error in setSettings: item ",item," not in settings");
		return false;
	};
	settings529[item] = value;
	chrome.storage.sync.set({ settings529 });
	console.log("Settings updated: ",item," ", value);
	return true;
};

function getSetting(item){
	//check that item is in settings
	if(!Object.keys(settings529).includes(item)){
		console.log("Error in getSettings: item ",item," not in settings");
		return null;
	};
	return settings529[item];
};

/*
var displayMode=0;
function setDisplayMode(val){
	displayMode=val;
}
function getDisplayMode(){
	return displayMode;
}

var textSize="small";
function setTextSize(val){
	textSize=val;
}
function getTextSize(val){
	return textSize;
}

var omitAliases=false;
function setOmitAliases(val){
	omitAliases=val;
}
function getOmitAliases(){
	return omitAliases;
}

var alwaysShowPhase=false;
function setAlwaysShowPhase(val){
	alwaysShowPhase=val;
}
function getAlwaysShowPhase(){
	return alwaysShowPhase;
}

var alwaysShowLabels=false;
function setAlwaysShowLabels(val){
	alwaysShowLabels=val;
}
function getAlwaysShowLabels(){
	return alwaysShowLabels;
}

var alwaysShowCommonAncestors=false;
function setAlwaysShowCommonAncestors(val){
	alwaysShowCommonAncestors=val;
}
function getAlwaysShowCommonAncestors(){
	return alwaysShowCommonAncestors;
}

var hideCloseMatches=false;
function setHideCloseMatches(val){
	hideCloseMatches=val;
}
function getHideCloseMatches(){
	return hideCloseMatches;
}
*/
function echo(command){
	command();
}
