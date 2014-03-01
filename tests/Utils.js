var City = require('./../city');
var util = require('util');
var _ = require('lodash');

require('tap').test('city', function (test) {
    test.test('Utils', function (u_test) {

        function item() {
            return {
                x: Math.floor(Math.random() * 10),
                z: Math.floor(Math.random() * 10)
            }
        }
//_.shuffle(require('./data/old_tiles.json').tiles.slice(0, 10));
        var old_tiles =  _.uniq(_.map(_.range(0, 80), item), function(item){ return item.x + ',' + item.z});
        // _.shuffle( require('./data/new_tiles.json').tiles.slice(0, 10));
        var new_tiles = _.uniq(_.map(_.range(0, 80), item), function(item){ return item.x + ',' + item.z} );

        require('fs').writeFileSync(__dirname + '/data/old_tiles.json', JSON.stringify({tiles: _.sortBy(old_tiles, ['x', 'z'])}));
        require('fs').writeFileSync(__dirname + '/data/new_tiles.json', JSON.stringify({tiles: _.sortBy(new_tiles, ['x', 'z'])}));

        //console.log('new_tiles: %s', util.inspect(_.sortBy(new_tiles, ['x', 'z'])));
        //console.log('old_tiles: %s', util.inspect(_.sortBy(old_tiles, ['x', 'z'])));


        City.Utils.tile_diff(old_tiles, new_tiles);

        old_tiles = _.sortBy(old_tiles, ['x', 'z']);
        new_tiles = _.sortBy(new_tiles, ['x', 'z']);

       // console.log('new_tiles: %s', util.inspect(new_tiles));
       // console.log('old_tiles: %s', util.inspect(old_tiles));

        _.each(_.groupBy(new_tiles, 'state'), function (tiles, state) {
            switch (state) {

                case 'new':
                    _.each(tiles, function (tile) {
                        var old_match = _.find(old_tiles, function (old_tile) {
                            return old_tile.x == tile.x && old_tile.z == tile.z;
                        });
                        if (old_match) {
                            console.log("new tile %s is matched by old tile %s",
                                util.inspect(tile), util.inspect(old_match));
                        }
                        u_test.ok(!old_match, 'no new tile is in the old list');
                    });
                    break;

                case 'old':
                    _.each(tiles, function (tile) {
                        var old_match = _.find(old_tiles, function (old_tile) {
                            return old_tile.x == tile.x && old_tile.z == tile.z;
                        });
                        if (!old_match) {
                            console.log("old tile %s is not matched",
                                util.inspect(tile));
                        }
                        u_test.ok(old_match, 'new tile is in the old list');
                    });
                    break;
            }
        });//408 509 4719

        _.each(_.groupBy(old_tiles, 'state'), function (tiles, state) {
            switch (state) {

                case 'absent':
                    _.each(tiles, function (tile) {
                        var new_match = _.find(new_tiles, function (new_tile) {
                            return new_tile.x == tile.x && new_tile.z == tile.z;
                        });
                        if (new_match) {
                            console.log("old tile %s is matched by new tile %s",
                                util.inspect(tile), util.inspect(old_match));
                        }
                        u_test.ok(!new_match, 'no new tile is in the old list');
                    });
                    break;

                case 'old':
                    _.each(tiles, function (tile) {
                        var new_match = _.find(new_tiles, function (old_tile) {
                            return old_tile.x == tile.x && old_tile.z == tile.z;
                        });
                        if (!new_match) {
                            console.log("old tile %s is not matched",
                                util.inspect(tile));
                        }
                        u_test.ok(new_match, 'old tile is in the new list');
                    });
                    break;
            }
        });

        u_test.end();
    });
    test.end();
});