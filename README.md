web-cam-motion-detection
========================

Simple browser based motion detection with the getUserMedia and Canvas APIs.

Inspired by the following articles/code:
http://www.soundstep.com/blog/2012/03/22/javascript-motion-detection/
http://www.adobe.com/devnet/html5/articles/javascript-motion-detection.html

The HTML file needs to be accessed via a server, the getUserMedia API won't allow access to the web cam if the file is loaded directly from the lcoal file system.

A local server is fine, if you are using a mac see this article http://macs.about.com/od/networking/qt/websharing.htm.

Alternatively there are a number of ways to serve local content, here are examples using Python and Node.js.

http://www.lylebackenroth.com/blog/2009/05/03/serve-your-current-directory-using-a-simple-webserver-python/

http://www.sitepoint.com/serving-static-files-with-node-js/
