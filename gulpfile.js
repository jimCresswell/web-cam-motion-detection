/* jshint node: true */
'use strict';

var gulp = require('gulp');

var browserSync = require('browser-sync');
var reload = browserSync.reload;

var paths = {
  webroot: './'
};
paths.css = paths.webroot + '**/*.css';
paths.js = paths.webroot + '**/*.js';

// watch files for changes and reload.
gulp.task('serve', function() {
  browserSync({
    server: {
      baseDir: paths.webroot
    }
  });

  gulp.watch(['*.html', paths.css, paths.js], {cwd: paths.webroot}, reload);
});


gulp.task('default', ['serve']);