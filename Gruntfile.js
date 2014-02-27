module.exports = function (grunt) {

    grunt.initConfig({
        concat: {
            base: {
                files: {
                    'build/city.js': ['src/city.js']
                }
            }
        },
        umd: {
            main: {
                src: 'build/city.js',
                dest: 'city.js',
                globalAlias: 'City',
                deps: {
                    'default': ['_', 'Canvas', 'Three', 'createjs', 'Fools'],
                    cjs: ['underscore', 'canvas', 'three', 'node-easel', 'fools']
                },
                objectToExport: 'City'
            }
        },
        copy: {
            main: {
                files: [
                    // includes files within path
                    {expand: true, src: 'city.js', dest: 'site/js/', filter: 'isFile'}
                    ]
            }
        }

    });
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-umd');
    grunt.loadNpmTasks('grunt-contrib-copy');

// the default task can be run just by typing "grunt" on the command line
    grunt.registerTask('default', ['concat:base', 'umd:main', 'copy:main']);
};