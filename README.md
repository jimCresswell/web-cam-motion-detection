web-cam-motion-detection
========================

Simple browser based motion detection with the getUserMedia and Canvas APIs.

Inspired by the following articles/code:
http://www.soundstep.com/blog/2012/03/22/javascript-motion-detection/
http://www.adobe.com/devnet/html5/articles/javascript-motion-detection.html

The HTML file needs to be accessed via a server, the getUserMedia API won't allow access to the web cam if the file is loaded directly from the local file system.

A local server is fine, if you are using a mac see this article http://macs.about.com/od/networking/qt/websharing.htm.

Alternatively if you have Node and npm or a compatible runtime  available on your system you can run the following commands

* `npm install`
* `gulp`

Note: if you are developing in Firefox there appears to be a race condition between the getUserMedia permissions modal dialogue and the browser-sync server, so either use Chrome, use a different server, or hack a delay into the success callback.