module.exports = function (grunt) {

    grunt.initConfig({
        concat: {
            base: {
                files: {
                    'build/city.js': [ 'src/City.js', 'src/textures.js', 'src/Utils.js', 'src/Block.js']
                }
            }
        },
        umd: {
            main: {
                src: 'build/city.js',
                dest: 'city.js',
                globalAlias: 'City',
                deps: {
                    'default': ['_', 'Canvas', 'THREE', 'createjs', 'Fools', 'O3'],
                    cjs: ['lodash', 'canvas', 'three', 'node-easel', 'fools', 'objective-three']
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