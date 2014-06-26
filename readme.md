# Welcome to JSPraat


JSPraat is a work in progress. It aims to makes some Praat features available via a web interface.
Work has begun in providing a compatibility layer with Praat's TextGrid format. 

![Screenshot of TimeSyncedGrid](https://raw.githubusercontent.com/fahmidur/JSPraat/master/screenshots/jspraat_ss005.png "Screenshot of TimeSyncedGrid")
[Demo](http://syedreza.org/etc/JSPraat_demo1/)



## A List of Classes

* JSPraat.TextGrid -  A JS class for representing a single TextGrid. It has been tested on a small set of examples including interval tiers and point tiers. The constructor takes either a path to a .TextGrid file or takes the contents of a TextGrid file. See main.js for example usage.
* JSPraat.TimeSyncedGrid - A TimeSyncedGrid displays exactly one WAV form time-synchronized to exactly one TextGrid below the WAV form.


## Dependencies
* JQuery
* D3 v3

## Usage

The following is an example of displaying a TimeSyncedGrid as an element in your webpage. 
```html
<div class='TSG-container' data-textgrid='path/to/your/textgrid.TextGrid' data-audio='path/to/your/audiofile.wav'></div>


<!-- put this anywhere at the end-->
<script>JSPraat.TimeSyncedGrid.autoRender();</script>
```

This type of usage is great for talking about TextGrids in personal Blogs and Wikis.

You simply define a div with the class 'TSG-container'. 
You must provide 'data-textgrid' attribute and may optionally provide a 'data-audio' attribute. Then, anywhere in your JavaScript after your document has loaded call 
```javascript
JSPraat.TimeSyncedGrid.autoRender()
```




## Credits

The code is written and maintained by [Syed Reza](http://syedreza.org). The work done here takes place in the context of [Reciprosody](https://github.com/fahmidur/reciprosody) at the [Speech Lab @ Queens College](http://speech.cs.qc.cuny.edu/)

The Speech Lab @ Queens College is run by [Dr. Andrew Rosenberg](http://eniac.cs.qc.cuny.edu/andrew/).