'use strict';

/**
 * IMPORTANT NOTE: Do not use this server
 * to locally test. The TextGrid will not
 * display correctly on Firefox because 
 * the the iti-* sample TextGrids (taken fro C-Prom Corpus)
 * are charset=utf-16be
 * 
 * It should work on Chrome.
 */

var sys = require('sys');
var staticlib = require('node-static');

var staticserver = new staticlib.Server('./public');

var port = 3131;

console.log('starting static server on http://localhost:' + port);

require('http').createServer(function (req, res) {
    var d = new Date();
    console.log(d);
    req.addListener('end', function () {
    	console.log(req.url);

        staticserver.serve(req, res);
    }).resume();
}).listen(port);

