var JSPraat = {};
JSPraat.TextGrid = {};
JSPraat.TextGrid.Tier = function(linesArray) {
	if (! (this instanceof JSPraat.TextGrid.Tier) ) {
		return new JSPraat.TextGrid.Tier(linesArray);
	}
	this.lines = linesArray; this.lines.pop();
	this.header = {
		classname: null,
		name: null,
		xmin: null,
		xmax: null,
		numberOfIntervals: null,
		numberOfPoints: null,
	};
	this.startingLineIndexOfBody = null;
	this.parseHeader();
	this.checkHeader();

	if(this.header.classname === 'IntervalTier') {
		this.intervals = [];
		this.parseIntervals();
	}
	else
	if(this.header.classname === 'TextTier') {
		this.points = [];
		this.parsePoints();
	}
	else {
		throw "Invalid Tier Header: "+ this.header.classname + ' is not an acceptable classname';
	}
};
JSPraat.TextGrid.Tier.prototype.checkHeader = function() {
	if(! this.header.classname ) {
		throw "Invalid Tier Header: classname is missing";
	}
	if(! this.header.name) {
		throw "Invalid Tier Header: name is missing";
	}
	if(! this.header.xmin ) {
		throw "Invalid Tier Header: xmin is missing";
	}
	if(! this.header.xmax ) {
		throw "Invalid Tier Header: xmax is missing";
	}
	if(this.header.numberOfIntervals === null && this.header.numberOfPoints === null) {
		throw "Invalid Tier Header: not an interval or point tier.";
	}
	if(this.isIntervalTier() && this.header.numberOfIntervals === null) {
		throw "Invalid Tier Header: classname mismatch. says interval tier but has points size";
	}
	if(this.isPointTier() && this.header.numberOfPoints === null) {
		throw "Invalid Tier Header: classname mismatch. says point tier but has intervals size";
	}
	if(this.header.numberOfPoints !== null && this.header.numberOfIntervals !== null) {
		throw "Invalid Tier Header: header cannot contain both points size and intervals size";
	}
};
JSPraat.TextGrid.Tier.prototype.isIntervalTier = function() {
	if(this.header.classname === 'IntervalTier') {
		return true;
	}
	return false;
};
JSPraat.TextGrid.Tier.prototype.isPointTier = function() {
	if(this.header.classname === 'TextTier') {
		return true;
	}
	//... (maybe other tier types are also 'point tiers')
	return false;
};

JSPraat.TextGrid.Tier.prototype.parseHeader = function() {
	var classnameRegex = /^\s+class\s*=\s*\"(\w+)\"/i;
	var nameRegex = /^\s+name\s*=\s*\"(\w+)\"/i;
	var xminRegex = /^\s+xmin\s*=\s*([\d\.]+)/i;
	var xmaxRegex = /^\s+xmax\s*=\s*([\d\.]+)/i;

	var intervalsSizeRegex = /^\s+intervals\:\s*size\s*=\s*(\d+)/i;
	var pointsSizeRegex = /^\s+points\:\s*size\s*=\s*(\d+)/i;
	var leadingSpaceRegex = /^(\s+)/;

	var match;
	var flagEndConditionReached = false;

	var size = null;
	for(var i = 0; i < this.lines.length; i++) {
		if ( (match = this.lines[i].match(intervalsSizeRegex)) ) {
			this.header.numberOfIntervals = size = parseInt(match[1]);
			flagEndConditionReached = true;
			this.startingLineIndexOfBody = i+1;
			break;
		}
		if ( (match = this.lines[i].match(pointsSizeRegex)) ) {
			this.header.numberOfPoints = size = parseInt(match[1]);
			flagEndConditionReached = true;
			this.startingLineIndexOfBody = i+1;
			break;
		}
		else
		if ( (match = this.lines[i].match(classnameRegex)) ) {
			this.header.classname = match[1];
		}
		else
		if ( (match = this.lines[i].match(nameRegex)) ) {
			this.header.name = match[1];
		}
		else
		if ( (match = this.lines[i].match(xminRegex)) ) {
			this.header.xmin = match[1];
		}
		else
		if ( (match = this.lines[i].match(xmaxRegex)) ) {
			this.header.xmax = match[1];
		}
	}

	if(!flagEndConditionReached && size > 0) {
		throw "Invalid Tier Header: end condition not reached while size is non-zero";
	}
};
JSPraat.TextGrid.Tier.prototype.parseIntervals = function() {
	if(this.header.numberOfIntervals === 0) { return; }

	// console.log('Parsing Intervals FROM ', this.startingLineIndexOfBody);
	// console.log(this.lines[this.startingLineIndexOfBody]);
	var i = this.startingLineIndexOfBody; 
	var topm, xmin, xmax, text;

	var intervalStartRegex = /^\s*intervals\s*\[\d+\]\:/i;
	var xmaxRegex = /^\s*xmax\s*\=\s*([\d\.]+)/i;
	var xminRegex = /^\s*xmin\s*\=\s*([\d\.]+)/i;
	var textRegex = /^\s*text\s*\=\s*\"(.*)\"/i;

	while(i < this.lines.length) {
		topm = this.lines[i++]; if(i >= this.lines.length) { throw "Invalid Tier Body: incomplete interval 0"; }
		xmin = this.lines[i++]; if(i >= this.lines.length) { throw "Invalid Tier Body: incomplete interval 1"; }
		xmax = this.lines[i++]; if(i >= this.lines.length) { throw "Invalid Tier Body: incomplete interval 2"; }
		text = this.lines[i++];

		if( (match = topm.match(intervalStartRegex)) ) {
		} else {
			throw "Invalid Tier Body: Invalid interval start format, expecting 'intervals [<digit>]:'";
		}

		if( (match = xmax.match(xmaxRegex)) ){ xmax = parseFloat(match[1]); } 
		else { throw "Invalid Tier Body: Invalid 'xmax' format";   }

		if( (match = xmin.match(xminRegex)) ) { xmin = parseFloat(match[1]);
		} else { throw "Invalid Tier Body: Invalid 'xmin' format"; }

		if( (match=text.match(textRegex)) ) { text = match[1];
		} else { throw "Invalid Tier Body: Invalid 'text' format"; }

		// this.intervals.push({'xmin': xmin, 'xmax': xmax, 'text': text});
		this.intervals.push([xmin, xmax, text]);

	}
	if(i < this.lines.length) { throw "Invalid Tier Body: incomplete interval remains"; }
};

JSPraat.TextGrid.Tier.prototype.parsePoints = function() {
	if(this.header.numberOfPoints === 0) { return; }
	// console.log('Parsing Intervals FROM ', this.startingLineIndexOfBody);

	var pointStartRegex = /\s*points\s*\[\d+\]\:/i;
	var numberRegex = /^\s*number\s*\=\s*([\d\.]+)/i;
	var markRegex = /^\s*mark\s*\=\s*\"(.*)\"/i;

	var topm, number, mark;
	for(var i = this.startingLineIndexOfBody; i < this.lines.length; i++) {
		topm = this.lines[i++]; 	if(i >= this.lines.length) { throw "Invalid Tier Body: incomplete point 0"; }
		number = this.lines[i++];	if(i >= this.lines.length) { throw "Invalid Tier Body: incomplete point 1"; }
		mark = this.lines[i++];

		if( (match = topm.match(pointStartRegex)) ) {
		} else {
			throw "Invalid Tier Body: Invalid point start format, expecting 'points [<digit>]:'";
		}

		if( (match = number.match(numberRegex)) ){ number = parseFloat(match[1]); } 
		else { throw "Invalid Tier Body: Invalid 'number' format";   }

		if( (match=mark.match(markRegex)) ) { mark = match[1];
		} else { throw "Invalid Tier Body: Invalid 'mark' format"; }

		// this.points.push({'number': number, 'mark': mark});
		this.points.push([number, mark]);
	}
};

JSPraat.TextGrid.TextGrid = function(data) {
	if (! (this instanceof JSPraat.TextGrid.TextGrid) ) {
		return new JSPraat.TextGrid.TextGrid(data);
	}

	var pathRegex = /^.+\.TextGrid$/i;
	var match;
	var self = this;

	if( (match = data.match(pathRegex)) ) {
		$.get(data, function(value) {
			self.initializeFromData(value);
		});
	} else {
		this.initializeFromData(data);	
	}
};
JSPraat.TextGrid.TextGrid.prototype.initializeFromData = function(data) {
	this.lines = data.split('\n');
	this.header = {
		fileType: null,
		objectClass: null,
		xmin: null,
		xmax: null,
		tiersExist: false, //translates to 'tiers? <exist>'
		numberOfTiers: 0, //translates to just 'size'
	};
	this.startingLineIndexOfTiers = -1;
	this.tiers = [];

	this.parseHeader();
	this.checkHeader();
	this.parseTiers();
};

JSPraat.TextGrid.TextGrid.prototype.checkHeader = function() {
	if(this.tiersExist === false) { 
		throw "Invalid TextGrid Header: Tiers do not exist";
	}
	if(this.startingLineIndexOfTiers < 0) { 
		throw "Invalid TextGrid Header: startingLineIndexOfTiers Not Found";
	}
};
//
// Expects Header to have already been parsed
//
JSPraat.TextGrid.TextGrid.prototype.parseTiers = function() {
	var tierStartRegex = /^\s+item\s+\[(\d+)\]\:/i;
	var match;
	var inTier = null;

	var startIndex = 0;
	var endIndex = 0;
	for(var i = this.startingLineIndexOfTiers; i < this.lines.length; i++) {
		if( (match=this.lines[i].match(tierStartRegex)) ) {
			if(inTier > 0) {
				// console.log('[', startIndex, ', ', endIndex, ']');
				this.tiers.push(new JSPraat.TextGrid.Tier(this.lines.slice(startIndex, endIndex)));
			}
			inTier = parseInt(match[1]);
			startIndex = i+1;
			endIndex = i+1;
		}
		if(inTier > 0) {
			endIndex++;
		}
	}
	// console.log('final tier ');
	// console.log('[', startIndex, ', ', endIndex, ']');
	this.tiers.push(new JSPraat.TextGrid.Tier(this.lines.slice(startIndex, endIndex)));
};

JSPraat.TextGrid.TextGrid.prototype.parseHeader = function() {
	//MARKED FOR CHANGE: this prevents zero tier TextGrid files, fix later
	var endOfHeaderRegex = /^\s*item\s*\[.+\]\:/i; 
	var xminRegex = /^xmin\s*=\s*([\d\.]+)/i;
	var xmaxRegex = /^xmax\s*=\s*([\d\.]+)/i;
	var tiersExistRegex = /^tiers\?\s*(<exists>)/i;
	var numberOfTiersRegex = /^size\s*=\s*(\d+)/;
	var fileTypeRegex = /^File type\s*=\s*\"(\w+)\"/i;
	var objectClassRegex = /^Object class\s*=\s*\"(\w+)\"/i;

	var match;
	for(var i = 0; i < this.lines.length; i++) {
		// console.log(this.lines[i]);
		if(this.lines[i].match(endOfHeaderRegex)) {
			this.startingLineIndexOfTiers = i;
			break;
		}

		if( (match=this.lines[i].match(xminRegex)) ) {
			this.header.xmin = parseFloat(match[1]);
		}
		else
		if( (match=this.lines[i].match(xmaxRegex)) ) {
			this.header.xmax = parseFloat(match[1]);
		}
		else
		if( (match=this.lines[i].match(tiersExistRegex)) ) {
			this.header.tiersExist = true;
		}
		else
		if( (match=this.lines[i].match(numberOfTiersRegex)) ) {
			this.header.numberOfTiers = parseInt(match[1]);
		}
		else
		if( (match=this.lines[i].match(fileTypeRegex)) ) {
			this.header.fileType = match[1];
		}
		else
		if( (match=this.lines[i].match(objectClassRegex)) ) {
			this.header.objectClass = match[1];
		}
	}
	// console.log('----END OF HEADER----');
};


JSPraat.TimeSyncedGrid = {};
JSPraat.TimeSyncedGrid.TimeSyncedGrid = function(containerID) {
	if(! (this instanceof JSPraat.TimeSyncedGrid.TimeSyncedGrid)) {
		return new JSPraat.TimeSyncedGrid.TimeSyncedGrid(containerID);
	}

	this.container = {
		'ID': containerID,
		'element': document.getElementById(containerID),
		'$element': $('#'+containerID),
	};

	if(this.container.$element.length === 0) {
		throw "TimeSyncedGrid: container id='"+containerID+"' does not exist";
	}

	this.xmin = null;
	this.xmax = null;

	this.textgrid = null;
	this.wav = null;
};

JSPraat.TimeSyncedGrid.TimeSyncedGrid.prototype.render() {
	this.container.width = this.container.$element.width();
	this.container.height = this.container.$element.height();

	
};