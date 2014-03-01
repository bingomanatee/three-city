var City = require('./../city');
var util = require('util');
var _ = require('underscore');

require('tap').test('city', function (test) {
    test.test('Block', function (block_test) {

        block_test.test('adding', function (adding) {

            var block = new City.Block();

            var first = {x: 1, z: 2};

            block.add(first);

            adding.equal(block.min_x, 1, 'min of block starts as 1');
            adding.equal(block.max_x, 1, 'max of block starts as 1');

            adding.equal(block.min_z, 2, 'min of block starts as 2');
            adding.equal(block.max_z, 2, 'min of block starts as 2');

            adding.end();

            adding.ok(block.can_add({x: 1, z: 2}), 'can add 1,2');
        });

        block_test.test('merge_blocks', function (mb) {

            var tiles = [
            ];
            _.each(_.range(0, 3), function (x) {
                _.each(_.range(0, 3), function (z) {
                    tiles.push({x: x, z: z});
                })
            });

            _.each(_.range(4, 6), function (x) {
                _.each(_.range(4, 6), function (z) {
                    tiles.push({x: x, z: z});
                })
            });

            _.each(_.range(0, 3), function (x) {
                _.each(_.range(4, 6), function (z) {
                    tiles.push({x: x, z: z});
                })
            });

            _.each(_.range(4, 6), function (x) {
                _.each(_.range(0, 3), function (z) {
                    tiles.push({x: x, z: z});
                })
            });

            tiles = _.shuffle(tiles);

            var blocks = City.Block.make_blocks(tiles);
            _.each(blocks, function (block) {
                block.order_tiles();
            });

            mb.deepEqual(_.pluck(blocks, 'tiles'), require('./data/sorted_tiles.json'),
             'blocks sorted into groups');

            mb.end();
        });

        block_test.end();

    });

    test.end();
})
;