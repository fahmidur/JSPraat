'use strict';

// var one = '/sample-textgrids/nominated.TextGrid';

var one = '/sample-textgrids/iti-01.TextGrid';
var one_wav = '/sample-textgrids/iti-01.wav';

var tgone = new JSPraat.TextGrid.TextGrid(one);
var tgrid = new JSPraat.TimeSyncedGrid.TimeSyncedGrid('container');

tgone.ready(function() {
	tgrid.setTextGrid(tgone);
});