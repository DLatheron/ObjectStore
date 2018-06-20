'use strict';

module.exports = function(grunt) {

    require('load-grunt-tasks')(grunt);

    grunt.initConfig({
        eslint: {
            options: {
                configFile: '.eslintrc.json'
            },
            target: ['*.js', 'src/**/*.js', 'test/**/*.js']
        },

        mochacli: {
            options: {
                require: [],
                reporter: 'nyan',
                bail: true,
                recursive: true,
                exit: true
            },
            test: {
                src: [grunt.option('test') || 'test/**/*.js'],
                options: {
                    reporter: 'nyan',
                    recursive: true,
                    exit: true
                }
            },
            integrationTest: {
                src: [grunt.option('integrationTest') || 'integration-test/**/*.js'],
                options: {
                    reporter: 'nyan',
                    recursive: true,
                    exit: true
                }
            },
            spec: {
                src: [grunt.option('test') || 'test/**/*.js'],
                options: {
                    reporter: 'spec',
                    recursive: true,
                    exit: true
                }
            }
        },

        watch: {
            test: {
                files: ['Gruntfile.js', 'integration-test/**/*.js', 'test/**/*.js', '*.js', 'src/**/*.js'],
                tasks: ['test', 'integrationTest']
            },
            options: {
                spawn: false
            }
        }
    });

    grunt.loadNpmTasks('grunt-mocha-cli');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-jshint');

    grunt.registerTask('test', ['eslint', 'mochacli:test']);
    grunt.registerTask('integrationTest', ['mochacli:integrationTest']);

    grunt.registerTask('build', function() {
        grunt.log.ok('Nothing to do here!');
    });

    let changedFiles = Object.create(null);
    const onChange = grunt.util._.debounce(function() {
        const testFiles = Object.keys(changedFiles).map(function(changedFile) {
            if (changedFile.indexOf('.test.js') === -1) {
                changedFile = changedFile.replace('src', 'test');
                changedFile = changedFile.replace('.js', '.test.js');
            }
            return changedFile;
        });
        grunt.config('eslint.test.src', Object.keys(changedFiles));
        grunt.config('mochacli.test.src', testFiles);
        grunt.config('mochacli.integrationTest.src', testFiles);
        changedFiles = Object.create(null);
    }, 200);
    grunt.event.on('watch', function(action, filepath) {
        changedFiles[filepath] = action;
        onChange();
    });
};
