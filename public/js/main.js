'use strict';

// var one = '/sample-textgrids/iti-01.TextGrid';
var one = '/sample-textgrids/nominated.TextGrid';
var two = '/sample-textgrids/iti-02.TextGrid';

var tgone;

$(function() {
	$('#textgrid').load(one, function(data) {
		tgone = new JSPraat.TextGrid.TextGrid(data);
	});
});