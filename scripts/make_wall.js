var City = require('./../city');
var O3 = require('objective-three');
var Canvas = require('canvas');
var path = require('path');

var target_directory;
if (process.argv.length > 2){
    target_directory = path.resolve(__dirname, process.argv[2]);
} else {
    target_directory = path.resolve(__dirname, 'site/img');
}

console.log('writing wall to %s', target_directory);

var wall = new City.Wall({size: 800, canvas: new Canvas(800, 800 * 5), repeat: 5, color: O3.util.rgb(1, 0.9, 0.7)});

wall.display().render();