/** 
 * @module JSPraat 
 * @global
 */
var JSPraat = {};
JSPraat.TextGrid = {};

/**
 * A wrapper class representing a single tier of a TextGrid
 *
 * @class TextGrid.Tier
 * @memberOf JSPraat.TextGrid
 * @constructor
 * @param {Array.<string>} linesArray An array of lines pertaining to that tier
 */
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
/**
 * @method checkHeader
 * @private
 */
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
/**
 * Returns true if the tier is an Interval Tier
 * @method isIntervalTier
 * @public
 */
JSPraat.TextGrid.Tier.prototype.isIntervalTier = function() {
	if(this.header.classname === 'IntervalTier') {
		return true;
	}
	return false;
};
/**
 * Returns true if the tier is a Point Tier
 * @method isPointTier
 * @public
 */
JSPraat.TextGrid.Tier.prototype.isPointTier = function() {
	if(this.header.classname === 'TextTier') {
		return true;
	}
	//... (maybe other tier types are also 'point tiers')
	return false;
};
/**
 * @method parseHeader
 * @private
 */
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
/**
 * @method parseIntervals
 * @private
 */
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
/**
 * @method parsePoints
 * @private
 */
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
/**
 * A TextGrid parses and represents a
 * a TextGrid file generated by Praat.
 * At the moment, it only supports the long-form
 * format TextGrids.
 *
 * @class TextGrid.TextGrid
 * @memberOf JSPraat.TextGrid
 * @constructor
 * @param {string} data A String that is either a URL to the Data or the Data itself
 */
JSPraat.TextGrid.TextGrid = function(data) {
	if (! (this instanceof JSPraat.TextGrid.TextGrid) ) {
		return new JSPraat.TextGrid.TextGrid(data);
	}

	var pathRegex = /^.+\.TextGrid$/i;
	var match;
	var self = this;

	this.readyFunc = null;

	if( (match = data.match(pathRegex)) ) {
		$.ajax({
			url: data,
			// beforeSend: function( xhr ) {
			// 	// Note: Server should send file with correct charset header
			// 	// You cannot rely upon a dumb-static server
			// 	// xhr.overrideMimeType("text/plain; charset=utf-16be");
			// }
		}).done(function(value) {
			// console.log(value);
			self.initializeFromData(value);
		});
	} else {
		this.initializeFromData(data);
	}
};

/**
 * @method initializeFromData
 * @param {string} data A String containing the TextGrid Data
 * @memberOf TextGrid.TextGrid TimeSyncedGrid
 * @private
 */
JSPraat.TextGrid.TextGrid.prototype.initializeFromData = function initializeFromData(data) {
	this.lines = data.split('\n');
	this.header = {
		fileType: null,
		objectClass: null,
		xmin: null,
		xmax: null,
		tiersExist: false,	//translates to 'tiers? <exist>'
		numberOfTiers: 0,	//translates to just 'size'
	};
	this.startingLineIndexOfTiers = -1;
	this.tiers = [];

	this.parseHeader();
	this.checkHeader();
	this.parseTiers();


	if(typeof this.readyFunc === 'function') {
		this.readyFunc();
	}
};

/**
 * Sets the ready callback for TextGrids
 * @method ready
 * @memberOf TextGrid.TextGrid
 * @public
 * @param {Function} func callback function
 */
JSPraat.TextGrid.TextGrid.prototype.ready = function(func) {
	if(typeof func !== 'function') {
		throw "TextGrid ready requires a function";
	}
	this.readyFunc = func;
};
/**
 * @method checkHeader
 * @private
 */
JSPraat.TextGrid.TextGrid.prototype.checkHeader = function() {
	if(this.tiersExist === false) { 
		throw "Invalid TextGrid Header: Tiers do not exist";
	}
	if(this.startingLineIndexOfTiers < 0) { 
		throw "Invalid TextGrid Header: startingLineIndexOfTiers Not Found";
	}
};

/**
 * @method parseTiers
 * @memberOf TextGrid.TextGrid TimeSyncedGrid
 * @private
 */
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
JSPraat.Audio = {};
/**
 * A wrapper class for all of our functions on Audio.
 * It works via the webkitAudioContext;
 *
 * @class Audio.Audio
 * @memberOf JSPraat.Audio;
 * @constructor
 * @param {string} url of the audio file
 */
JSPraat.Audio.Audio = function(url) { 
	if(! (this instanceof JSPraat.Audio.Audio)) {
		return new JSPraat.Audio.Audio(url);
	}
	console.log('contructing Audio.Audio');
	this.url = url;
	this.ctx = new webkitAudioContext();
	this.audioBuffer = null;
	this.sourceNode = null;

	this.analyser = this.ctx.createAnalyser(); 
	this.analyser.smoothingTimeConstant = 0.3;
	this.analyser.fftSize = 1024;

	//setupAudioNodes()
	this.sourceNode = this.ctx.createBufferSource();
	this.sourceNode.connect(this.ctx.destination);

	this.loadSound();

	console.log('contructed Audio.Audio');
};

JSPraat.Audio.Audio.prototype.loadSound = function() {
	console.log('loading sound from: ' + this.url);
	var self = this;
	var req = new XMLHttpRequest();
	req.open('GET', this.url, true);
	req.responseType = 'arraybuffer';

	req.onload = function() {
		self.ctx.decodeAudioData(req.response, function(buf) {
			self.sourceNode.buffer = buf;
			// self.playSound(0);
		}, self.onError);
	};
	req.send();
};
JSPraat.Audio.Audio.prototype.playSound = function(from) {
	console.log('playing sound from ' + from);
	this.sourceNode.noteOn(0);

};
JSPraat.Audio.Audio.prototype.onError = function(e) {
	console.log(e);
	throw "Audio: error decoding audio data. ";
};

JSPraat.TimeSyncedGrid = {};
/**
 * A TimeSyncedGrid displays exactly one WAV form
 * time-synchronized to exactly one TextGrid below the WAV form.
 *
 * @class TimeSyncedGrid.TimeSyncedGrid
 * @memberOf JSPraat.TimeSyncedGrid
 * @constructor
 * @param {string} ID of the container for the TimeSyncedGrid
 */
JSPraat.TimeSyncedGrid.TimeSyncedGrid = function(containerID) {
	if(! (this instanceof JSPraat.TimeSyncedGrid.TimeSyncedGrid)) {
		return new JSPraat.TimeSyncedGrid.TimeSyncedGrid(containerID);
	}
	if($('#'+containerID).length == 0) {
		throw "TimeSyncedGrid: container id='"+containerID+"' does not exist";
	}
	this.zoomFactor = 20;
	this.xmultMin = 100;
	this.xmultMax = 800;
	this.xmult = this.xmultMin + (this.xmultMax - this.xmultMin) / 2;
	this.timePrecision = 3;

	this.cPrefix = 'TSG';
	this.currentTime = 0.0;

	this.currentTimeMarkerPosition = null;
	this.tierNameOffset = null;

	this.c = {
		'ID': containerID,
		'width': null,
		'height': null,
		'$': $('#'+containerID),
		'scroller': {
			'ID': this.cPrefix + '-scroller',
			'$': null,
			'pos': 0
		},
		'infotop': {
			'ID': this.cPrefix + '-infotop',
			's': null,
			'$': null,
			'timeData': {
				'cname': this.cPrefix + '-infotop-time-data',
				'$': null,
			},
			'label': {
				'cname': this.cPrefix + '-infotop-label',
				'$': null,
			},
			'currentTime': {
				ID: this.cPrefix + '-current-time',
				's': null,
				'$': null,
			},
			'controls': {
				'ID': this.cPrefix + '-controls',
				's': '.' + this.cPrefix + '-controls',
				'$': null,
				'zoomIn': {
					'ID': this.cPrefix + '-controls-zoom-in',
					's': '#' + this.cPrefix + '-controls-zoom-in',
					'$': null
				},
				'zoomOut': {
					'ID': this.cPrefix + '-controls-zoom-out',
					's': '#' + this.cPrefix + '-controls-zoom-out',
					'$': null
				},
				'zoomSlider': {
					'ID': this.cPrefix + '-controls-zoom-slider',
					's': '#' + this.cPrefix + '-controls-zoom-slider',
					'$': null
				},
				'zoomIndicator': {
					'ID': this.cPrefix + '-controls-zoom-indicator',
					's': '#' + this.cPrefix + '-controls-zoom-indicator',
					'$': null
				}
			}
		},
		'tiers': {
			'className': this.cPrefix+'-tier',
			's': '.'+ this.cPrefix +'-tier',
			'nfo': {}
		},
	};

	this.initializeUI();

	this.textgrid = null;
	this.audio = null;
};
/**
 * Create all UI Elements
 * @method initializeUI
 * @private
 */
JSPraat.TimeSyncedGrid.TimeSyncedGrid.prototype.initializeUI = function() {
	var self = this;

	this.c.$.html("<div id='"+this.c.scroller.ID+"'></div>");
	this.c.scroller.s = '#'+this.c.scroller.ID;
	this.c.scroller.$ = $(this.c.scroller.s);

	this.c.$.prepend("<div id='"+this.c.infotop.ID+"'></div>");
	this.c.infotop.s = '#'+this.c.infotop.ID;
	this.c.infotop.$ = $(this.c.infotop.s);

	this.c.infotop.$.prepend("<span class='"+this.c.infotop.label.cname+"'></span>");
	this.c.infotop.label.$ = this.c.infotop.$.find('.'+this.c.infotop.label.cname);

	this.c.infotop.$.append("<span id='"+this.c.infotop.currentTime.ID+"'></span>");
	this.c.infotop.currentTime.s = '#' + this.c.infotop.currentTime.ID;
	this.c.infotop.currentTime.$ = $(this.c.infotop.currentTime.s);
	this.c.infotop.currentTime.$.text('-');

	this.c.infotop.$.prepend("<span id='"+this.c.infotop.controls.ID+"'></span>");
	this.c.infotop.controls.s = '#' + this.c.infotop.controls.ID;
	this.c.infotop.controls.$ = $(this.c.infotop.controls.s);

	this.c.infotop.controls.$.append("<span id='"+this.c.infotop.controls.zoomIn.ID+"' class='control-btn' data-name='zoomIn'><i class='fa fa-fw fa-search-plus'></i></span>");
	this.c.infotop.controls.zoomIn.$ = $(this.c.infotop.controls.zoomIn.s);

	this.c.infotop.controls.$.append("<span id='"+this.c.infotop.controls.zoomOut.ID+"' class='control-btn' data-name='zoomOut'><i class='fa fa-fw fa-search-minus'></i></span>");
	this.c.infotop.controls.zoomOut.$ = $(this.c.infotop.controls.zoomOut.s);

	this.c.infotop.controls.$.append('<input type="range" name="points" min="'+this.xmultMin+'" max="'+this.xmultMax+'" id="'+this.c.infotop.controls.zoomSlider.ID+'">');
	this.c.infotop.controls.zoomSlider.$ = $(this.c.infotop.controls.zoomSlider.s);

	this.c.infotop.controls.zoomSlider.$.on('change', function(e) {
		self.xmult = parseInt($(this).val());
		self.render();
	});

	this.c.infotop.controls.$.append('<span id="'+this.c.infotop.controls.zoomIndicator.ID+'">'+this.xmult+'</span>');
	this.c.infotop.controls.zoomIndicator.$ = $(this.c.infotop.controls.zoomIndicator.s);


	this.c.scroller.$.on('scroll', function(e) {
		if(!self.tierNameOffset) { return; }
		var x = $(this).scrollLeft();
		var $floaters = self.c.scroller.$.find('.tier-name-floater');
		$floaters.animate({'opacity': ((x > self.tierNameOffset) ? 1 : 0)}, 200);
		// not optimal but looks nicer to always move it
		for(var k in self.c.tiers.nfo) {
			self.c.tiers.nfo[k].nameFloater
			.transition()
			.duration(700)
			.attr('transform', 'translate('+x+', 0)');
		}
	});

	this.c.infotop.controls.$.find('.control-btn').each(function(e) {
		$(this).on('click', function(e) {
			var name = $(this).data('name');	
			var func = self['controlsEventHandler_'+name+'_click'];
			if(typeof func !== 'function') { return; }
			func.call(self, e);
		});
	});

	this.updateZoomControls();
};
JSPraat.TimeSyncedGrid.TimeSyncedGrid.prototype.updateZoomControls = function() {
	// console.log('updating zoom controls. xmult=' + this.xmult + " zoomFactor=" + this.zoomFactor);
	this.c.infotop.controls.zoomIndicator.$.text( Math.round((this.xmult - this.xmultMin) / (this.xmultMax - this.xmultMin) * 100) );
	this.c.infotop.controls.zoomSlider.$.val(this.xmult);
}

JSPraat.TimeSyncedGrid.TimeSyncedGrid.prototype.controlsEventHandler_zoomIn_click = function(e) {
	console.log('TimeSyncedGrid Event: zoomIn');
	this.xmult += this.zoomFactor;
	this.render();
};

JSPraat.TimeSyncedGrid.TimeSyncedGrid.prototype.controlsEventHandler_zoomOut_click = function(e) {
	console.log('TimeSyncedGrid Event: zoomOut');
	var newMult = this.xmult - this.zoomFactor;
	if(newMult < this.xmultMin) { return; }
	this.xmult = newMult;
	this.render();
};
/**
 * Sets the TextGrid to display in this TimeSyncedGrid
 * The TextGrid is then immediately rendered.
 * The TextGrid must be ready to render, to ensure this:
 * call this function within 
 * myTextGrid.ready(function() {...})
 * @method setTextGrid
 * @param {JSPraat.TextGrid.TextGrid} tgrid A TextGrid object that is ready for rendering.
 */
JSPraat.TimeSyncedGrid.TimeSyncedGrid.prototype.setTextGrid = function(tgrid) {
	this.textgrid = tgrid;
	this.render();
};
/**
 * Renders this TimeSyncedGrid
 * @method render
 */
JSPraat.TimeSyncedGrid.TimeSyncedGrid.prototype.render = function() {
	this.c.width = this.c.$.innerWidth();
	this.c.height = this.c.$.innerHeight();

	var pTimeMarkerOffset = 0;
	var cTimeMarkerOffset = 0;
	var dTimeMarkerOffset = 0;

	for(var k in this.c.tiers.nfo) {
		pTimeMarkerOffset = $(this.c.tiers.nfo[k].timeMarker[0][0]).offset().left;
		break;
	}

	this.c.scroller.pos = this.c.scroller.$.scrollLeft();
	this.c.scroller.$.html(''); //clear everything

	if(this.textgrid)	{ this.renderTextGrid();	}
	if(this.audio) 		{ this.renderAudio();		}

	this.c.scroller.$.scrollLeft(this.c.scroller.pos);

	this.updateZoomControls();
	this.updateTimeMarker();

	cTimeMarkerOffset = $(this.c.tiers.nfo[Object.keys(this.c.tiers.nfo)[0]].timeMarker[0][0]).offset().left;
	dTimeMarkerOffset = cTimeMarkerOffset - pTimeMarkerOffset;
	
	if(pTimeMarkerOffset) { this.c.scroller.$.scrollLeft(this.c.scroller.pos + dTimeMarkerOffset);}
};
/**
 * Render the TextGrid for this TimeSyncedGrid
 * @method renderTextGrid
 * @private
 */
JSPraat.TimeSyncedGrid.TimeSyncedGrid.prototype.renderTextGrid = function() {
	console.log('rendering textgrid');

	var self = this;
	var xmaxTier = Math.ceil(self.textgrid.header.xmax);
	var tierHeight = null;

	if(this.textgrid === null) { throw "TimeSyncedGrid: renderTextGrid found no textgrid"; }
	

	this.xmin = this.textgrid.header.xmin;
	this.xmax = this.textgrid.header.xmax;

	var tiers = d3.select(this.c.scroller.s).selectAll("div").data(this.textgrid.tiers)
	.enter()
	.append("div")
	.attr('class', function(d) {
		return self.c.tiers.className + " " + ( d.isIntervalTier() ? 'interval-tier' : 'point-tier' );
	})
	.attr('data-height', function(d) {
		return $(this).height();
	})
	.append("svg")
	.attr('height', function() {
		return (tierHeight = $(this).parent().height());
	})
	.attr('width', function() {
		return  self.xmult * xmaxTier;
	});
	var halfTierHeight = tierHeight / 2;


	// console.log(tiers);

	// tiers.append('line')
	// .attr('x1', 0)
	// .attr('y1', halfTierHeight)
	// .attr('x2', function(d) { return xPosLast; })
	// .attr('y2', halfTierHeight)
	// .attr('class', 'tier-central-line');

	var rTiers = tiers[0];
	var tierNameOffset = 0;
	for(var i = 0; i < rTiers.length; i++) {
		var name = rTiers[i].__data__.header.name
		if(name.length > tierNameOffset) { tierNameOffset = name.length; }
	}
	tierNameOffset*=10;

	for(var i = 0; i < rTiers.length; i++) {
		var svg = rTiers[i];
		var data = svg.__data__;
		var d3svg = d3.select(svg);

		var tierNameBox = d3svg
			.append('rect')
			.attr('height', halfTierHeight)
			.attr('width', tierNameOffset)
			.attr('x', 0)
			.attr('y', halfTierHeight/2)
			.attr('class', 'tier-name-box')
			.attr('title', data.header.name);

		var tierNameText = d3svg
			.append('text')
			.attr('height', halfTierHeight)
			.attr('width', tierNameOffset)
			.attr('x', 0)
			.attr('y', halfTierHeight/2)
			.attr('dy', halfTierHeight/1.5)
			.attr('dx', 2)
			.attr('class', 'tier-name-text')
			.text(data.header.name);

		var groups = null;

		if(data.isIntervalTier()) {
			groups = d3svg
			.selectAll('g').data(data.intervals)
			.enter()
			.append('g')
			.attr('transform', function(d, i) {
				return "translate("+ (tierNameOffset + self.xmult*d[0]) + ", " + (halfTierHeight / 2) + ")";
			})
			.attr('width', function(d) {
				return (self.xmult * d[1]) - (self.xmult * d[0]) - 1;
			})
			.attr('height', halfTierHeight)
			.attr('class', 'interval-group')
			.on('mouseenter', function(d) {
				self.c.infotop.label.$.html("[" + d[0].toFixed(self.timePrecision)+ ", " + d[1].toFixed(self.timePrecision)+ "] &nbsp;" + d[2]);
			})
			.on('mouseout', function(d) {
				
			});

			groups
			.append('rect')
			.attr('height', halfTierHeight)
			.attr('width', function(d) {
				return (self.xmult * d[1]) - (self.xmult * d[0]) - 1;
			})
			.attr('x', 0)
			.attr('y', 0)
			.attr('class', 'interval-box')
			.attr('title', function(d) { return d[2]; });


			groups
			.append('text')
			.attr('x', 0)
			.attr('y', 0)
			.attr('dy', halfTierHeight/1.5)
			.attr('dx', 2)
			.text(function(d) {
				var tbox = $(this).prev();
				if((d[2].length*10) >= parseInt(tbox.attr('width'))) {
					tbox.attr('class', 'interval-box-too-small');
					return ""; 
				}
				return d[2];
			})
			.attr('class', 'tier-text');

		} /* end if */
		if(data.isPointTier()) {
			groups = d3svg
			.selectAll('g').data(data.points)
			.enter()
			.append('g')
			.attr('transform', function(d, i) {
				return "translate("+ (tierNameOffset + self.xmult*d[0]) + ", " + (halfTierHeight / 2) + ")";
			})
			.attr('width', 5)
			.attr('height', halfTierHeight)
			.attr('class', 'point-group')
			.on('mouseenter', function(d) {
				self.c.infotop.label.$.text(d[0].toFixed(self.timePrecision) + ": " + d[1]);
			})
			.on('mouseout', function(d) {
				
			});

			groups
			.append('rect')
			.attr('height', halfTierHeight)
			.attr('width', function(d) {
				return 10 * d[1].length;
			})
			.attr('x', 0)
			.attr('y', 0)
			.attr('rx', 5)
			.attr('ry', 5)
			.attr('class', 'point-box');


			groups
			.append('text')
			.attr('x', 0)
			.attr('y', 0)
			.attr('dy', halfTierHeight/1.5)
			.attr('dx', 2)
			.text(function(d) {
				var tbox = $(this).prev();
				if((d[1].length*10) > parseInt(tbox.attr('width'))) {
					tbox.attr('class', 'interval-box-too-small');
					return "";
				}
				return d[1];
			})
			.attr('class', 'tier-text');
		} /* end if */


		// Draw currentTimeMarker
		var timeMarker = d3svg
		.append('rect')
		.attr('width', 1)
		.attr('height', tierHeight)
		.attr('x', self.currentTimeMarkerPosition)
		.attr('y', 0)
		.attr('class', 'current-time-marker');

		


		//Draw the tierFloater
		tierFloaterGroup = d3svg
		.append('g')
		.attr('transform', "translate("+0+","+0+")")
		.attr('width', tierNameOffset)
		.attr('height', halfTierHeight/2)
		.attr('class', 'tier-name-floater')

		tierFloaterGroup
		.append('rect')
		.attr('width', tierNameOffset)
		.attr('height', halfTierHeight/2);

		tierFloaterGroup
		.append('text')
		.attr('x', 0)
		.attr('y', 0)
		.attr('dy', halfTierHeight/2.5)
		.attr('dx', 2)
		.attr('class', 'tier-name-floater-text')
		.text(data.header.name);

		d3svg.attr('data-tier-name', data.header.name);
		self.c.tiers.nfo[data.header.name] = {
			'timeMarker': timeMarker,
			'nameFloater': tierFloaterGroup
		};

	} /* end for */


	self.c.tiers.tierNameOffset = tierNameOffset;
	self.c.scroller.$.find('svg').on('click', function(e) {
		var xPixels = self.c.scroller.$.scrollLeft() + (e.pageX - self.c.scroller.$.position().left) - tierNameOffset - 1;
		if(xPixels < 0) { xPixels  = 0; }

		self.currentTime = xPixels / self.xmult;
		console.log(xPixels, self.currentTime);

		self.c.infotop.currentTime.$.text(self.currentTime.toFixed(self.timePrecision));
		self.updateTimeMarker();
	});

	self.tierNameOffset = tierNameOffset;
};
/**
 * Move the timeMarker for each tier to the currentTime
 * @method updateTimeMarker
 * @private
 */
JSPraat.TimeSyncedGrid.TimeSyncedGrid.prototype.updateTimeMarker = function() {
	var self = this;
	self.currentTimeMarkerPosition = self.currentTime * self.xmult + self.c.tiers.tierNameOffset;

	for(var k in self.c.tiers.nfo) {
		var timeMarker = self.c.tiers.nfo[k].timeMarker;
		timeMarker
		.attr('x', self.currentTimeMarkerPosition);
	}
	this.c.infotop.currentTime.$.text(this.currentTime.toFixed(this.timePrecision));
}
/**
 * Render the the audio file for this TimeSyncedGrid
 * TODO
 * @method renderAudio
 * @private
 */
JSPraat.TimeSyncedGrid.TimeSyncedGrid.prototype.renderAudio = function() {
	console.log('rendering Audio');
	if(this.audiofile === null) { throw "TimeSyncedGrid: renderAudio found no audio"}
}