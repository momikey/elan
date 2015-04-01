var gulp = require('gulp');
var browserify = require('browserify');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var source = require('vinyl-source-stream');

gulp.task('default', ['browserify', 'uglify'], function () {

});

gulp.task('browserify', function () {
    return browserify('./src/browser.js')
		.transform('brfs')
		.bundle()
		.pipe(source('elan.js'))
		.pipe(gulp.dest('./build/'));
});

gulp.task('uglify', ['browserify'], function () {
    gulp.src('build/elan.js')
        .pipe(uglify())
		.pipe(rename({extname: '.min.js'}))
        .pipe(gulp.dest('./build'));
});
