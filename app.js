'use strict';

var staticlib = require('node-static');

var staticserver = new staticlib.Server('./public');

var port = 3131;

console.log('starting static server on http://localhost: ', port);

require('http').createServer(function (req, res) {
    var d = new Date();
    console.log(d);
    req.addListener('end', function () {
        staticserver.serve(req, res);
    }).resume();
}).listen(port);

