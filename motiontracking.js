/*
 *	Inspired by the following articles/code:
 *  http://www.soundstep.com/blog/2012/03/22/javascript-motion-detection/
 *  http://www.adobe.com/devnet/html5/articles/javascript-motion-detection.html
 *  Have the theramin be on only part of the page. Have the (average of ten) left most moving pixel control frequency, (average of ten) top most control volume
 *
 * Remember last detected position. Make new position half way between old detection and new detection,
 * cheap inertia in detected point, only change position if the weight is signficant (perpetuate last best weight between frames, compare significance) and the distance is under a given threshold for a given weight.
 */

var helpers = (function helpers(DOCUMENT) {
	function getElById(id){
		return DOCUMENT.getElementById(id);
	}

	function polyfillRequestAnimationFrame() {
		var lastTime = 0;
		var vendors = ['ms', 'moz', 'webkit', 'o'];
		for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
			window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
			window.cancelAnimationFrame =
			window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
		}

		console.log("Falling back to setTimeout.");

		if (!window.requestAnimationFrame) {
			window.requestAnimationFrame = function(callback, element) {
				var currTime = new Date().getTime();
				var timeToCall = Math.max(0, 16 - (currTime - lastTime));
				var id = window.setTimeout(function() { callback(currTime + timeToCall); },
				timeToCall);
				lastTime = currTime + timeToCall;
				return id;
			};
		}

		if (!window.cancelAnimationFrame) {
			window.cancelAnimationFrame = function(id) {
				clearTimeout(id);
			};
		}
	}

	return {
		getElById: getElById,
		polyfillRequestAnimationFrame: polyfillRequestAnimationFrame
	};
}(window.document));

var videoEl = helpers.getElById("webcam-input"),
	videoHeight = videoEl.height,
	videoWidth = videoEl.width,
	canvasSource = helpers.getElById("canvas-source"),
	canvasBlended = helpers.getElById("canvas-blended"),
	contextSource = canvasSource.getContext('2d'),
	contextBlended = canvasBlended.getContext('2d'),
	width = canvasSource.width,
	height = canvasSource.height,
	blendedImageData = contextBlended.createImageData(width, height),
	sourceImageData,
	lastImageData = contextSource.getImageData(0, 0, width, height),
	bestCounts = [],
	bestPixelPositions = [],
	framerateEl = helpers.getElById("framerateValue"),
	startTime,
	numFrames = 0;

function differenceSimple(blendTarget, data1, data2) {
	var numIterations,
		iteration,
		diffRed,
		diffGreen,
		diffBlue,
		change,
		oldChange,
		detectionThreshold = 0.05 * 0xFF,
		lastBestPixelPosition = 0,
		lastBestCount = 1,
		currentPossbiblePixelPostion = false,
		currentBestCount = 0,
		bestPosition,
		numPointsToTrack = 10,
		pointIterator,
		numPoints,
		pointLimit,
		x,
		y,
		pixelPosition,
		arrayPosition,
		crossSize,
		crossOffset,
		crossPixelX,
		crossPixelY;

	if (data1.length != data2.length) return null;

	// reset last best position arrays
	bestCounts = [];
	bestPixelPositions = [];

	numIterations = width*height;

	pixelPosition = numIterations;
	while (pixelPosition--) {

		arrayPosition = pixelPosition * 4;

		// Temporarily ignore the green channel which is being used to mark the biggest motion density.
		// TODO Re-instate the outputbuffer, use that for the marker, and start measuring the green channel again.
		diffRed = data1[arrayPosition] - data2[arrayPosition];
		diffGreen = data1[arrayPosition+1] - data2[arrayPosition+1];
		diffBlue = data1[arrayPosition+2] - data2[arrayPosition+2];
		change = (diffRed + diffGreen + diffBlue) / 3;

		// Track positive and negative brightness changes.
		if (change < 0) change = -change;

		oldChange = blendTarget[arrayPosition];

		// Do not propagate changes below a threshold.
		if (change < detectionThreshold) {

			// If there is a new candidate for the densest linear custer of difference then store it.
			if (currentBestCount > lastBestCount) {
				lastBestCount = currentBestCount;
				lastBestPixelPosition = currentPossbiblePixelPostion;

				bestCounts.push(lastBestCount);
				bestPixelPositions.push(lastBestPixelPosition);
			}

			// Reset the count for the next detection.
			currentBestCount = 0;
			currentPossbiblePixelPostion = false;

		} else {

			// If there is no candidate for densest difference position store this starting point.
			if (!currentPossbiblePixelPostion) currentPossbiblePixelPostion = pixelPosition;

			// Up the count weighted by the percentage change.
			currentBestCount += (change/0xFF);
		}

		// Preserve the difference for the next iteration.
		blendTarget[arrayPosition] = change;
		blendTarget[arrayPosition+1] = change;
		blendTarget[arrayPosition+2] = change;
		blendTarget[arrayPosition+3] = 0xFF;
	}


	/*
	 * Mark the point of densest linear difference signal for this frame.
	 */

	// Loop over the best N (numPointsToTrack) detections.
	numPoints = bestPixelPositions.length;
	if (numPoints > numPointsToTrack) {
		pointLimit = numPoints - numPointsToTrack;
	} else {
		pointLimit = numPoints;
	}
	for (pointIterator = numPoints; pointIterator > pointLimit; pointIterator -= 1) {

		bestPosition = bestPixelPositions[pointIterator];

		// Extract the x and y co-ordinates from the linear pixel position.
		x = bestPosition%width;
		y = Math.floor(bestPosition/width);

		crossSize = 30;
		crossOffset = parseInt(crossSize*0.5, 10);
		iteration = crossSize;
		while (iteration--) {
			crossPixelX = (x - crossOffset + iteration) + y*width;
			crossPixelY = x + (y - crossOffset + iteration)*width;
			blendTarget[crossPixelX*4] = 0;
			blendTarget[crossPixelX*4+1] = 0xFF;
			blendTarget[crossPixelX*4+2] = 0;
			blendTarget[crossPixelY*4] = 0;
			blendTarget[crossPixelY*4+1] = 0xFF;
			blendTarget[crossPixelY*4+2] = 0;
		}
	}
}

function blendVideo() {

	// get webcam image data
	sourceImageData = contextSource.getImageData(0, 0, width, height);

	// blend the 2 images, operations by reference
	differenceSimple(blendedImageData.data, sourceImageData.data, lastImageData.data);

	// store the current webcam image
	lastImageData = sourceImageData;

	return blendedImageData;
}

function drawOriginalVideo() {
	contextSource.drawImage(videoEl, 0, 0, videoWidth, videoHeight);
}

function drawBlendedVideo(blendedVideoData) {
	contextBlended.putImageData(blendedVideoData, 0, 0);
}

function webcamError(error) {
	console.error("Webcam error:", error);
}

function webcamSuccess(stream) {
	videoEl.src = window.webkitURL.createObjectURL(stream);
}

function recursiveCanvasUpdate () {
	drawOriginalVideo();
	drawBlendedVideo(blendVideo());

	calcFramerate();

	window.requestAnimationFrame(recursiveCanvasUpdate);
}

function calcFramerate() {
	numFrames += 1;
	if (numFrames === 100) {
		startTime = Date.now();
	}
	framerateEl.innerText = Math.floor(numFrames/((Date.now() - startTime))*1000);
}


/**
 * Kick off the JS.
 */

// Invert the camera x-axis
contextSource.translate(canvasSource.width, 0);
contextSource.scale(-1, 1);

helpers.polyfillRequestAnimationFrame();

navigator.webkitGetUserMedia({audio: false, video: true}, webcamSuccess, webcamError);

window.requestAnimationFrame(recursiveCanvasUpdate);


