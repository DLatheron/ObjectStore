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
                    files: ['integration-test/Framework.js', 'test/**/*.js'],
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
                tasks: ['test']
            },
            integrationTest: {
                files: ['Gruntfile.js', 'integration-test/**/*.js', '*.js', 'src/**/*.js'],
                tasks: ['integrationTest']
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
    const onChange = grunt.util._.debounce(() => {
        const allFiles = [];
        Object.keys(changedFiles).forEach(changedFile => {
            if (!changedFile.endsWith('.test.js') &&
                !changedFile.includes('.integration-test.js')) {
                allFiles.push(changedFile
                    .replace('src', 'test')
                    .replace('.js', '.test.js')
                );
                allFiles.push(changedFile
                    .replace('src', 'integration-test')
                    .replace('.js', '.integration-test.js')
                );
            } else {
                allFiles.push(changedFile);
            }
        });

        const testFiles = allFiles.filter(file => file.includes('.test.js'));
        const integrationTestFiles = allFiles.filter(file => file.includes('.integration-test.js'));
        global.console.log('Test', testFiles);
        global.console.log('Integration Test', integrationTestFiles);


        grunt.config('eslint.test.src', Object.keys(changedFiles));
        grunt.config('mochacli.test.src', testFiles);
        grunt.config('mochacli.integrationTest.src', integrationTestFiles);
        changedFiles = Object.create(null);
    }, 200);
    grunt.event.on('watch', (action, filepath) => {
        changedFiles[filepath] = action;
        onChange();
    });
};
