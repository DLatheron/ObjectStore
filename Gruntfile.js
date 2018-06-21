'use strict';

module.exports = function(grunt) {

    require('load-grunt-tasks')(grunt);

    grunt.initConfig({
        eslint: {
            options: {
                configFile: '.eslintrc.json'
            },
            target: ['*.js', 'src/**/*.js', 'test/**/*.js', 'integration-test/**/*.js']
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
                src: [grunt.option('integrationTest') || 'integration-test/**/*.integration-test.js'],
                options: {
                    files: ['integration-test/Framework.js', 'integration-test/**/*.js'],
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
                files: ['Gruntfile.js', 'test/**/*.js', '*.js', 'src/**/*.js'],
                tasks: ['eslint', 'mochacli:test']
            },
            integrationTest: {
                files: ['Gruntfile.js', 'integration-test/**/*.js', '*.js', 'src/**/*.js'],
                tasks: ['mochacli:integrationTest']
            },
            options: {
                spawn: false
            }
        }
    });

    grunt.loadNpmTasks('grunt-mocha-cli');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-jshint');

    grunt.registerTask('test', ['eslint', 'mochacli:test', 'mochacli:integrationTest']);
    // grunt.registerTask('integrationTest', ['mochacli:integrationTest']);

    let changedFiles = Object.create(null);
    const isUnitTest = (filename) => {
        return filename.endsWith('.test.js');
    };
    const isIntegrationTest = (filename) => {
        return filename.endsWith('.integration-test.js');
    };
    const onChange = grunt.util._.debounce(() => {
        const unitTestFiles = [];
        const integrationTestFiles = [];

        Object.keys(changedFiles).forEach(changedFile => {
            if (!isUnitTest(changedFile) &&
                !isIntegrationTest(changedFile)) {
                unitTestFiles.push(changedFile
                    .replace('src', 'test')
                    .replace('.js', '.test.js'));
            } else if (isUnitTest(changedFile)) {
                unitTestFiles.push(changedFile);
            } else if (isIntegrationTest(changedFile)) {
                integrationTestFiles.push(changedFile);
            }
        });

        // global.console.log('Test', unitTestFiles);
        // global.console.log('Integration Test', integrationTestFiles);

        grunt.config('eslint.test.src', Object.keys(changedFiles));
        grunt.config('mochacli.test.src', unitTestFiles);
        grunt.config('mochacli.integrationTest.src', integrationTestFiles);
        changedFiles = Object.create(null);
    }, 200);
    grunt.event.on('watch', (action, filepath) => {
        changedFiles[filepath] = action;
        onChange();
    });
};
