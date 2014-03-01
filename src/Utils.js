var Utils = {
    _tile_cmp: function (t1, t2) {
        if (t1.x < t2.x) {
            return -1;
        } else if (t1.x == t2.x) {
            if (t1.z < t2.z) {
                return -1;
            } else if (t1.z == t2.z) {
                return 0;
            }
        }
        return 1;
    },

    _block_cmp: function (t1, t2) {
        if (t1.min_x < t2.min_x) {
            return -1;
        }
        if (t1.min_x == t2.min_x) {
            if (t1.min_z < t2.min_z) {
                return -1;
            }
            if (t1.min_z == t2.min_z) {
                if (t1.max_x < t2.max_x) {
                    return -1;
                }
                if (t1.max_x == t2.max_x) {
                    if (t1.max_z < t2.max_z) {
                        return -1;
                    } else if (t1.max_z == t2.max_z) {
                        return 0;
                    }
                }
            }
        }
        return 1;
    },

    tile_diff: function (old_tiles, new_tiles) {
        _.each(old_tiles, function (r) {
            r.state = '';
        });

        _.each(new_tiles, function (r) {
            r.state = '';
        })
        var old_tiles_s = _.sortBy(old_tiles, ['x', 'z']);
        var new_tiles_s = _.sortBy(new_tiles, ['x', 'z']);

        var util = require('util');

        while (old_tiles_s.length && new_tiles_s.length) {
            var old_tile = old_tiles_s[0];
            var new_tile = new_tiles_s[0];

            switch (Utils._tile_cmp(old_tile, new_tile)) {
                case -1:
                    old_tile.state = 'absent';
                    old_tiles_s.shift();
                    break;
                case 0:
                    old_tile.state = 'old';
                    new_tile.state = 'old';
                    old_tiles_s.shift();
                    new_tiles_s.shift();
                    break;

                case 1:
                    new_tile.state = 'new';
                    new_tiles_s.shift();
                    break;
            }

        }

        _.each(old_tiles_s, function (r) {
            r.state = 'absent';
        });
        _.each(new_tiles_s, function (r) {
            r.state = 'new';
        })
    },
    merge_geometries: function (geometries) {
        return _.reduce(geometries, function (out, g) {
            if (!out) {
                return g;
            }
            return THREE.GeometryUtils.merge(out, g);
        }, null);
    },

    grid_to_array: function (grid, toString) {

        var blocks = _.flatten(_.pluck(grid, 'blocks'));
        var tiles = _.flatten(_.pluck(blocks, 'tiles'));

        var min_x = _.min(_.pluck(blocks, 'min_x'));
        var min_z = _.min(_.pluck(blocks, 'min_z'));

        var data = [];
        _.each(tiles, function (tile) {
            var x = tile.x - min_x;
            var z = tile.z - min_z;

            if (!data[z]){
                data[z] = [];
            }

            data[z][x] = tile.type;
        })

        if (toString){
            return _.reduce(data, function(out, items){
                out.push(items.join(''));
                return out;
            }, []).join("\n");
        } else {
            return {
                min_x: min_x,
                min_z: min_z,
                data: data
            }
        }
    },

    block_diff: function (old_blocks, new_blocks) {
        _.each(old_blocks, function (r) {
            r.state = '';
        });

        _.each(new_blocks, function (r) {
            r.state = '';
        })
        var old_blocks_s = _.sortBy(old_blocks, ['x', 'z']);
        var new_blocks_s = _.sortBy(new_blocks, ['x', 'z']);

        while (old_blocks_s.length && new_blocks_s.length) {
            var old_block = old_blocks_s[0];
            var new_block = new_blocks_s[0];

            switch (Utils._block_cmp(old_block, new_block)) {
                case -1:
                    old_block.state = 'absent';
                    old_blocks_s.shift();
                    break;
                case 0:
                    old_block.state = 'old';
                    new_block.state = 'old';
                    old_blocks_s.shift();
                    new_blocks_s.shift();
                    break;

                case 1:
                    new_block.state = 'new';
                    new_blocks_s.shift();
                    break;
            }

        }

        _.each(old_blocks_s, function (r) {
            r.state = 'absent';
        });
        _.each(new_blocks_s, function (r) {
            r.state = 'new';
        })
    },

    grid_data: function (self) {

        var range = self.range();
        var x_axis = self.axis('x');
        var z_axis = self.axis('z');
        //   console.log('x_axis: %s, ', x_axis.join(','));
        //  console.log('z_axis: %s, ', z_axis.join(','));

        return Fools.pipe(
            Fools.loop(
                function produce_tiles(iterator, memo) {
                    var is_x = (_.contains(x_axis, iterator.x));
                    var is_y = (_.contains(z_axis, iterator.z));

                    if (is_x && is_y) {
                        memo.push(_.extend({type: '+'}, iterator));
                    } else if (is_x) {
                        memo.push(_.extend({type: '|'}, iterator));
                    } else if (is_y) {
                        memo.push(_.extend({type: '-'}, iterator));
                    } else {

                        var x1 = iterator.x + 1;
                        var x0 = iterator.x - 1;
                        var z1 = iterator.z + 1;
                        var z0 = iterator.z - 1;

                        if (_.contains(x_axis, x1) || _.contains(x_axis, x0) || _.contains(z_axis, z1) || _.contains(z_axis, z0)) {

                            memo.push(_.extend({type: '.'}, iterator));
                        } else {
                            memo.push(_.extend({type: '*'}, iterator));
                        }

                    }
                    //if (out.place('x', iterator) == 'last') memo.push('*');
                    return memo;
                }
            ).dim('x').min(range.x.min).max(range.x.max).dim('z').min(range.z.min).max(range.z.max),
            function group_tiles_by_type(data) {
                return _.map(_.groupBy(data, 'type'), function (tiles, tile_type) {
                    return {
                        type: tile_type,
                        blocks: Block.make_blocks(tiles)
                    }
                });
            }
        )
            ([]);

    }


};
City.Utils = Utils;