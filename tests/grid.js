var City = require('./../city');
var util = require('util');

require('tap').test('city', function(test){

    test.test('grid', function(grid_test){

        var city = new City();
        city.extent = 5;
        city.x_period = 4;
        city.y_period = 5;

        var grid = city.grid_data();

       // require('fs').writeFileSync(__dirname + '/data/grid.json', JSON.stringify(grid, true, 4));

        var tiles = City.Utils.grid_to_array(grid, true);

       // console.log('grid: %s', tiles);
        grid_test.equal(tiles,(
            '.|.*.|.*.|.,' +
            '.|.*.|.*.|.,' +
            '.|.*.|.*.|.,' +
            '.|.*.|.*.|.,' +
            '.|...|...|.,' +
            '-+---+---+-,' +
            '.|...|...|.,' +
            '.|.*.|.*.|.,' +
            '.|.*.|.*.|.,' +
            '.|.*.|.*.|.,' +
            '.|.*.|.*.|.').replace(/,/g, "\n"));

        grid_test.end();

    });

    test.end();
})