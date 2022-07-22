/*
** utility code - should be eventually unnecessary
**
** Ugliness by numbers...
** Unique ID numbers used by 23 and me appear to be 64-bit integers, represented in
** queries as 16-digit hexadecimal values.  Javascript cannot cope with integers this high
** as all numbers are stored as floating point values and limited to a 53-bit mantissa.
** Therefore the code stores each as two 32-bit integers and converts back to string as required.
*/

"use strict";

function id2numbers(id){
	// Convert 16 digit (hexadecimal) 23andMe id (no 0x prefix) to an array of 2 integers
	// Note that Javascript cannot represent big integers with >13 digits
	if(id.length==undefined || id.length!=16){
		alert("Invalid 23andMe id: " + id);
		return null;
	}
	var result=new Array(2);
	result[0]=parseInt(id.substr(0,8),16);
	result[1]=parseInt(id.substr(8,8),16);
	return result;
}
// Duplicated in popup.js
function numbers2id(nums){
	// Convert array of 2 integers into 16 byte 23andMe hexadecimal id (no 0x prefix)
	if(nums.length==undefined || nums.length!=2){
		alert("Invalid numbers representing 23andMe id: " + nums);
		return null;
	}
	var first=(Number(nums[0])).toString(16);
	var second=(Number(nums[1])).toString(16);
	if(first.length>8 || second.length>8){
		alert("Invalid numbers representing 23andMe id: " + nums);
		return null;
	}
	while(first.length<8) first="0"+first;
	while(second.length<8) second="0"+second;
	return first+second;
}

/*
** functions to permit ordering the ID values,
** either as strings, or integer pairs
*/
function compareIds(id1, id2){
	// return -1 if id1<id2
	// return 1 if id1>id2
	// return 0 if id1==id2 || id1 or id2 can't be parsed
	var nums1=id2numbers(id1);
	if(nums1==null) return 0;
	var nums2=id2numbers(id2);
	if(nums2==null) return 0;
	if(nums1[0]<nums2[0]) return -1;
	if(nums2[0]<nums1[0]) return 1;
	if(nums1[1]<nums2[1]) return -1;
	if(nums1[1]<nums2[1]) return 1;
	return 0;
}
function compareNumbers(id1_1, id1_2, id2_1, id2_2){
	if(id1_1<id2_1) return -1;
	if(id2_1<id1_1) return 1;
	if(id1_2<id2_2) return -1;
	if(id2_2<id1_2) return 1;
	return 0;
}


