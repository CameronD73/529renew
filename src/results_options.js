/*
** options for handling results presentation.
*/

/*  eslint-disable no-unused-vars */
"use strict";


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

function echo(command){
	command();
}
