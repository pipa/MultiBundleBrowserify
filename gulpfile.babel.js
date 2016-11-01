// Dependencies =================================
    import gulp from 'gulp';
    import sourcemaps from 'gulp-sourcemaps';
    import gutil from 'gulp-util';

    //== JS
    import browserify from 'browserify';
    import watchify from 'watchify';
    import babelify from 'babelify';
    import uglify from 'gulp-uglify';
    import eslint from 'gulp-eslint';
    import source from 'vinyl-source-stream';
    import buffer from 'vinyl-buffer';
    import glob from 'glob';
    import path from 'path';

// Setting internals ============================
    const internals = {
        isWatchify: false,
        deps: [] // Here would go global modules such as react. E.G.: ['react', 'react-dom']
    };
    internals.static = __dirname + '/static';
    internals.src = internals.static + '/src';

// JS Tasks =====================================
    //== Create each bundle
    const createBundle = (options, callback) => {

        options = Object.assign({ min: true }, options);
        let min = true;
        const opts = Object.assign({}, watchify.args, {
            entries: options.entries,
            debug: true
        });

        let b = browserify(opts);
        b.transform(babelify.configure({
            compact: false
        }));

        if (path.basename(options.entries) === 'app.js') {
            min = false;
            b.require(internals.deps)
        } else {
            b.external(internals.deps);
        }

        const rebundle = () => {

            return b.bundle()
                // log errors if they happen
                .on('error', gutil.log.bind(gutil, 'Browserify Error'))
                .pipe(source(options.output))
                .pipe(buffer())
                // .pipe(sourcemaps.init({ loadMaps: true }))
                // .pipe(gulpif(options.min, uglify(), gutil.noop()))
                // .pipe(sourcemaps.write('../../maps'))
                .pipe(gulp.dest(options.destination));
        };

        if (internals.isWatchify) {
            b = watchify(b);
            b.on('update', function(id) {
                console.log(id);
                lint(callback, id);
                rebundle();
            });
            b.on('log', gutil.log);
        }

        return rebundle();
    };

    //== Lint JavaScript
    const lint = (callback, src) => {

        return gulp
            .src(src)
            .pipe(eslint({ useEslintrc: true }))
            .pipe(eslint.format());
    };

    //== Gulp JS task
    gulp.task('scripts', (callback) => {

        const mainFiles = [`${internals.src}/js/app.js`];
        glob(`${internals.src}/js/views/*/*.js`, (err, files) => {

            if (err) {
                done(err);
            }

            files = [...files, ...mainFiles];

            const tasks = files.map(function (entry, index) {
                entry = path.normalize(entry);
                const origin = path.normalize(`${ internals.src }/js`);
                const dest = path.normalize(`${ internals.static }/js`);
                const destMapping = entry.replace(origin, dest);
                const destination = path.dirname(destMapping);

                createBundle({
                    entries: entry,
                    output: path.basename(entry),
                    destination: destination
                });
            });
        });
        return callback();
    });


// Watch Tasks ==================================
    gulp.task('watch', () => {

        internals.isWatchify = true;
    });

// Main Tasks ===================================
    gulp.task('default', ['watch', 'scripts']);
