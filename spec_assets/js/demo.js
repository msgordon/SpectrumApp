/*
 * JavaScript Load Image Demo JS 1.9.0
 * https://github.com/blueimp/JavaScript-Load-Image
 *
 * Copyright 2013, Sebastian Tschan
 * https://blueimp.net
 *
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/MIT
 */

/*global document, loadImage, HTMLCanvasElement, $ */

$(function () {
    'use strict';

    var oPlot;

    var result = $('#result'),
        exifNode = $('#exif'),
        thumbNode = $('#thumbnail'),
        actionsNode = $('#actions'),
        currentFile,
        replaceResults = function (img) {
            var content;
            if (!(img.src || img instanceof HTMLCanvasElement)) {
                content = $('<span>Loading image file failed</span>');
            } else {
                content = $('<a class="img-responsive" target="_blank">').append(img)
                    //.attr('download', currentFile.name)
                    //.attr('href', img.src || img.toDataURL());
            }
            result.children().replaceWith(content);
            if (img.getContext) {
                actionsNode.show();
		$('#helptext').show();
		$('#sliders').show();
		var brightslide = $('#slider-brightness');
		var conslide    = $('#slider-contrast');
		brightslide.on("slide", function(event,ui) {
		    updateImage(ui.value,conslide.slider("value"));
		});
		conslide.on("slide", function(event,ui) {
		    updateImage(brightslide.slider("value"),ui.value);
		});

		
            }
        },
        displayImage = function (file, options) {
            currentFile = file;
	    var img = loadImage(file,replaceResults,options);
	    img.crossOrigin = "Anonymous";
            if (!img) {
                result.children().replaceWith(
                    $('<span>Your browser does not support the URL or FileReader API.</span>')
                );
            }	    
        },
        //pixastic
	//http://www.pixastic.com/lib/docs/
        updateImage = function (b,c) {
	    var img = result.find('img, canvas')[0];
	    var newimg = Pixastic.process(img, "brightness", 
					      {
						  brightness:b,
						  contrast:c
					      });		
	    //var content = $('<a class="img-responsive" target="_blank">').append(newimg)
	    newimg.crossOrigin = "Anonymous";
	    var alt = loadImage(newimg.toDataURL(),replaceResults,options);
	    //result.children().replaceWith(content);
	},
        displayExifData = function (exif) {
            var thumbnail = exif.get('Thumbnail'),
                tags = exif.getAll(),
                table = exifNode.find('table').empty(),
                row = $('<tr></tr>'),
                cell = $('<td></td>'),
                prop;
            if (thumbnail) {
                thumbNode.empty();
                loadImage(thumbnail, function (img) {
                    thumbNode.append(img).show();
                }, {orientation: exif.get('Orientation')});
            }
            for (prop in tags) {
                if (tags.hasOwnProperty(prop)) {
                    table.append(
                        row.clone()
                            .append(cell.clone().text(prop))
                            .append(cell.clone().text(tags[prop]))
                    );
                }
            }
            exifNode.show();
        },
        dropChangeHandler = function (e) {
            e.preventDefault();
            e = e.originalEvent;
            var target = e.dataTransfer || e.target,
                file = target && target.files && target.files[0],
                options = {
                    maxWidth: result.width(),
                    canvas: true
                };
            if (!file) {
                return;
            }
            exifNode.hide();
            thumbNode.hide();
            loadImage.parseMetaData(file, function (data) {
                if (data.exif) {
                    options.orientation = data.exif.get('Orientation');
                    displayExifData(data.exif);
                }
                displayImage(file, options);
            });
        },
        coordinates;
    $(document)
        .on('dragover', function (e) {
            e.preventDefault();
            e = e.originalEvent;
            e.dataTransfer.dropEffect = 'copy';
        })
        .on('drop', dropChangeHandler);
    $('#file-input').on('change', dropChangeHandler);
    $('#edit').on('click', function (event) {
        event.preventDefault();
        var imgNode = result.find('img, canvas'),
            img = imgNode[0];

	if (img && img instanceof HTMLCanvasElement) {
	    if (!document.origImg) {
		document.origImg = img.toDataURL();
	    }
	}
        imgNode.Jcrop({
            setSelect: [img.width/2, img.height/2, img.width/2+1, img.height/2+1],
	    bgColor: 'blue',
            onSelect: function (coords) {
                coordinates = coords;
            },
            onRelease: function () {
                coordinates = null;
            }
        }).parent().on('click', function (event) {
            event.preventDefault();
        });
    });
    $('#crop').on('click', function (event) {
        event.preventDefault();
        var img = result.find('img, canvas')[0];
        if (img && coordinates) {
            replaceResults(loadImage.scale(img, {
                left: coordinates.x,
                top: coordinates.y,
                sourceWidth: coordinates.w,
                sourceHeight: coordinates.h,
                //minWidth: result.width(),
		//minWidth: coordinates.w,
		minWidth: 800,
		//maxWidth: 700,
            }));
	    //document.imX = coordinates.x;
	    //document.imY = coordinates.y;
	    //document.imW = coordinates.w;
	    //document.imH = coordinates.h;

            coordinates = null;
	    var plotContainer = document.getElementsByClassName("plot-container")
	    if (plotContainer) {
		plotContainer[0].style.display ='none';
	    }
        }
    });
    $('#restore').on('click',function (event) {
	event.preventDefault();
	var origImg = document.origImg;
	if (origImg) {
	    var options = {
                maxWidth: $('#result').width(),
                canvas: true
	    };
	    //replaceResults(loadImage(origImg))
	    displayImage(origImg,options);
	    var plotContainer = document.getElementsByClassName("plot-container")
	    if (plotContainer) {
		plotContainer[0].style.display ='none';
	    }
	}
    });

/*
    $('#print').on('click', function (event) {
	event.preventDefault();

	// Check if canvas exists
	var plotContainer = document.getElementsByClassName("plot-container");
	if (plotContainer[0].style.display != '') {
		return;
	}

	plotContainer[0].fancybox({
	    maxWidth	: 800,
	    maxHeight	: 600,
	    fitToView	: false,
	    width		: '70%',
	    height		: '70%',
	    autoSize	: false,
	    closeClick	: false,
	    openEffect	: 'none',
	    closeEffect	: 'none',
            afterShow   : function() {
		alert('You are about to print the graph!');
		window.print();
            },
	});

	var canvas = oPlot.getCanvas();
	var dataUrl = canvas.toDataURL();
	var windowContent = '<!DOCTYPE html>';
	windowContent += '<html>'
	windowContent += '<head><title>Print canvas</title></head>';
	windowContent += '<body>'
	windowContent += '<img src="' + dataUrl + '">';
	windowContent += '</body>';
	windowContent += '</html>';
	var printWin = window.open('','','width=340,height=260');
	printWin.document.open();
	printWin.document.write(windowContent);
	printWin.document.close();
	printWin.focus();
	printWin.print();
	printWin.close();


    });
*/		   


    $('#spectrum').on('click', function (event) {
	event.preventDefault();
	var img = result.find('img, canvas')[0];
	if (img && img instanceof HTMLCanvasElement) {
	    var context = img.getContext("2d");
	    var imX = 0,
	        imY = 0,
                imW = img.width,
	        imH = img.height;

	    if (document.imX) {
		imX = document.imX;
		imY = document.imY;
		imW = document.imW;
		imH = document.imH;
	    }


	    var imgd = context.getImageData(imX,imY,imW,imH);
	    var pix = imgd.data;

	    // collapse RGB to 1D map of all pixels
	    var allPix = new Array(pix.length/4);
	    for (var i = 0,j=0; i < pix.length-2; i+=4,j++) {
		allPix[j] = 0.3*pix[i]+0.59*pix[i+1]+0.11*pix[i+2];
	    }


	    // Preallocate zero-ed array to spectrum
	    /*
	    var spectrum = Array.apply(null, new Array(imW)).map(Number.prototype.valueOf,0);

	    // Sum along columns
	    for (var i = 0; i < imH; i++) {
		for (var j = 0; j < imW; j++) {
		    spectrum[j] += allPix[i*imW+j]
		}
	    }
	    */

	    // Make array of arrays
	    var spectrum = new Array(imW)
	    for (var i = 0; i < spectrum.length; i++)
	    	spectrum[i] = new Array(imH);
	    
	    
	    // Median along columns
	    for (var j = 0; j < imW; j++) {
		for (var i = 0; i < imH; i++) {
		    spectrum[j][i] = allPix[i*imW+j]
		}
		spectrum[j] = median(spectrum[j])
	    }
	    


	    var plotMe = new Array(spectrum.length);

	    for (var i = 0; i < spectrum.length; i = i+1) {
		spectrum[i] /= imH;
		plotMe[i]=[i,spectrum[i]];
	    }
	    var plotContainer = document.getElementsByClassName("plot-container")
	    if (plotContainer) {
		plotContainer[0].style.display ='';
	    }
	    oPlot = $.plot("#specPlot",[plotMe],
			       {
				   series:
				   {
				       color:"rgb(173,20,38)",
				       lines: {show: true, lineWidth:4},
				       points: {show: false},
				   },
				   grid:
				   {
				       hoverable: true,
				       clickable: true,
				   },
				   xaxis:
				   {
				       tickLength:0,
				       show: false,
				       size: 12,
				       weight: "bold",
				       family: "sans-serif",
				       variant: "small-caps",
				       axisLabel: 'Pixel',
				       axisLabelFontSizePixels: 12,
				       color:"rgb(0,0,0)",
				   },
				   yaxis:
				   {
				       tickLength:0,
				       show: true,
				       size: 12,
				       weight: "bold",
				       family: "sans-serif",
				       variant: "small-caps",
				       axisLabel: 'Intensity',
				       axisLabelFontSizePixels: 12,
				       color:"rgb(0,0,0)",
				       //transform:  function(v) {return Math.log(v+0.0001);},
				   }
			       }
			      );
	    oPlot.resize();
	    $(".plot-container").resizable({
		//maxWidth: 700,
		//maxHeight: 450,
		minWidth: 800,
		//minHeight: 200,
	    });

	}
    });

});
