(function(root, factory) {
    if(typeof exports === 'object') {
        module.exports = factory(require('lodash'), require('canvas'), require('three'), require('node-easel'), require('fools'), require('objective-three'));
    }
    else if(typeof define === 'function' && define.amd) {
        define(['_', 'Canvas', 'THREE', 'createjs', 'Fools', 'O3'], factory);
    }
    else {
        root['City'] = factory(root._, root.Canvas, root.THREE, root.createjs, root.Fools, root.O3);
    }
}(this, function(_, Canvas, THREE, createjs, Fools, O3) {

function City() {

    this.x = 0;
    this.z = 0;

    this.extent = 20;

    this.x_period = 8;
    this.z_period = 6;

    this.display_name = 'city';
}

City.GRID_SIZE = 50;

var cube_geo = new THREE.CubeGeometry(City.GRID_SIZE, City.GRID_SIZE, City.GRID_SIZE, 1, 1, 1);
cube_geo.castShadow = true;

City.prototype = {

    display: function () {
        if (!this._display) {
            this._display = O3.display(this.display_name);

            var D = 64 * this.extent;
            var light = _.extend(new THREE.DirectionalLight(), {
                shadowCameraLeft: -D, shadowCameraRight: D, shadowCameraTop: -D, shadowCameraBottom: D,
                castShadow: true, shadowCameraVisible: true, shadowMapWidth: Math.pow(2, 12), shadowMapHeight: Math.pow(2, 12)});
            light.scale.set(2, 2, 2);
            var sun_light = new O3.RenderObject(light, function () {

            });

            var sun = new O3.RenderObject(null).at(0, City.GRID_SIZE * 4, 0);
            /*
             var sun_spot = new THREE.Mesh(new THREE.PlaneGeometry(City.GRID_SIZE/4, City.GRID_SIZE/4), this._display.mat('light').obj());
             sun_spot.rotateX(Math.PI/-2);
             sun_spot.castShadow = sun_spot.receiveShadow = false;
             var ro = new O3.RenderObject(sun_spot);
             // sun.add(ro);*/
            sun.add(sun_light);
            sun.at(City.GRID_SIZE * -4, City.GRID_SIZE * 16, City.GRID_SIZE * -6);
            this._display.add(sun);

            var camera = this._display.camera();
            var cam = this._display.add(new O3.RenderObject(null, {name: 'camera', update: function () {
                this.obj().translateY(0.5);
            }})).at(City.GRID_SIZE * -4, City.GRID_SIZE * 2, City.GRID_SIZE * 6);

            cam.obj().add(camera);
            cam.obj().rotateX(Math.PI / -4);
            var sphere = new THREE.Mesh(new THREE.SphereGeometry(City.GRID_SIZE / 2), this._display.mat('white').obj());
            this._display.add(new O3.RenderObject(sphere));
            this.ground_tiles();

            this.tower();

            this._display.renderer().shadowMapEnabled = true;

            // this.ground_plane();
        }
        return this._display;
    },

    ground_plane: function () {
        var g = new THREE.PlaneGeometry(City.GRID_SIZE * this.extent * 2, City.GRID_SIZE * this.extent * 2, this.extent * 2, this.extent * 2);
        var mesh = new THREE.Mesh(g, this.display().mat('ground').obj());
        mesh.rotateX(Math.PI / -2);
        var ro = new O3.RenderObject(null, {name: 'ground plane'});
        ro.obj().add(mesh);
        ro.obj().translateY(City.GRID_SIZE / -10);
        this.display().add(ro);

    },

    tower: function () {
        var loader = new THREE.JSONLoader();

        var self = this;
        loader.load('/3d/tower.json', function (obj, mats) {
            //console.log('tower: ', obj, 'mats:', mats);
            var mesh = new THREE.Mesh(obj, new THREE.MeshFaceMaterial(mats));
            mesh.scale.set(City.GRID_SIZE / 2, City.GRID_SIZE / 2, City.GRID_SIZE / 2);
            // this.display().add(new O3.RenderObject(mesh, {name: 'tower'}));
            self._tower = mesh;
        }.bind(this), '/img/');

    },

    ground_tiles: function () {
        var self = this;
        if (!this._ground) {
            this._ground = new O3.RenderObject(null, {name: 'ground', update: function () {
                //   self._update_ground_tiles(self._ground);

            }});
            this.display().add(this._ground);
        }
        self._update_ground_tiles();
        return this._ground;
    },

    _update_ground_tiles: function (ground) {

        var grid_data = this.grid_data();
        var display = this.display();

        _.each(grid_data, function (blocks) {
            var old_blocks = display.find({type: blocks.type});
            Utils.block_diff(old_blocks, blocks.blocks);

            var absent_blocks = _.where(old_blocks, {state: 'absent'});
            var new_blocks = _.where(blocks.blocks, {state: 'new'});

            _.each(new_blocks, function (new_block) {
                var root = this.make_block_mesh(new_block, blocks.type);
                if (root) {
                    display.add(root);
                }
            }, this);

            _.each(absent_blocks, function (block) {
                display.remove(block);
            }, this);

        }, this);
    },

    make_block_mesh: function (block, type) {

        var root, geometries, mesh, mat;

        switch (type) {
            case '+':
            case '-':
            case '|':
                mat = this.display().mat('road' + type);

                mesh = block.mesh(type);
                mesh.rotateX(Math.PI / -2);
                mesh.receiveShadow = mesh.castShadow = true;

                var ro = new O3.RenderObject(mesh, {type: type, update_on_animate: false});
                root = new O3.RenderObject();
                root.add(ro);

                var x_offset = (block.width() - 1);
                var z_offset = (block.depth() - 1);
                var x = block.min_x + x_offset / 2;
                var z = block.min_z + z_offset / 2;

                root.at(x * City.GRID_SIZE, 0, z * City.GRID_SIZE);
                break;

            case '.':

                var self = this;

            function tower_mesh() {
                var center = new THREE.Object3D();

                _.each(block.tiles, function (data) {
                    var tower = self._tower.clone();
                    tower.position.set(data.x * City.GRID_SIZE, 0, data.z * City.GRID_SIZE);
                    center.add(tower);
                });
                return center;
            }

                root = new O3.RenderObject();

                var cubes = [];
                _.each(block.tiles, function (tile) {
                    var cube = new THREE.Mesh(cube_geo, this.display().mat('white').obj());
                    cube.receiveShadow = true;
                    cube.castShadow = true;
                    var cube_ro = new O3.RenderObject(cube);
                    cube_ro.at(City.GRID_SIZE * tile.x, 0, City.GRID_SIZE * tile.z);
                    root.add(cube_ro);
                    cubes.push(cube_ro);
                }, this);

                root.update = function () {
                    if (root.merged) {
                        return;
                    }
                    if (self._tower) {
                        _.each(cubes, function (cube) {
                            root.remove(cube);
                        });

                        root.add(new O3.RenderObject(tower_mesh()));
                        root.update = _.identity;
                        root.update_on_animate = false;
                        root.merged = true;
                    }
                }

                break;

        }
        return root;

    },

    range: function () {

        return {
            x: {
                min: this.x - this.extent,
                max: this.x + this.extent
            },

            z: {
                min: this.z - this.extent,
                max: this.z + this.extent
            }
        };

    },

    grid_data: function () {
        return Utils.grid_data(this);
    },

    axis: function (dim) {
        var start, range = this.range();

        switch (dim) {
            case 'x':

                start = range.x.min;
                while (start % this.x_period) ++start;
                return _.range(start, range.x.max + 1, this.x_period);
                break;

            case 'z':

                start = range.z.min;
                while (start % this.z_period) ++start;
                return _.range(start, range.z.max + 1, this.z_period);
                break;
        }

    }

};

var TEXTURES = {roads: {}};

_.each(
    [
        {
            type: '+',
            name: '/img/road+.png',
            repeat: [1, 1],
            offset: [0.0]
        },
        {
            type: '-',
            name: 'img/road-.png',
            repeat: [1, 1],
            offset: [0.0]
        },
        {
            type: '|',
            name: 'img/roadl.png',
            repeat: [1, 1],
            offset: [0.0]
        },
        {
            type: '.',
            name: 'img/roads.png',
            repeat: [1, 1],
            offset: [0.0]
        }
    ],

    function (data) {
        if (typeof Image == 'undefined') {
            TEXTURES.roads[data.type] = null;
        } else {
            var texture = THREE.ImageUtils.loadTexture(data.name);
            texture._url = data.name;
            //texture.repeat.set(data.repeat[0], data.repeat[1]);
            //texture.offset.set(data.offset[0], data.offset[1]);
            texture.repeatS = texture.repeatT = THREE.RepeatWrapping;
            TEXTURES.roads[data.type] = texture;
        }
    });

O3.mat('road-', {
    type: 'MeshPhongMaterial',
    side: THREE.DoubleSide,
    receiveShadow: true,
    color: new THREE.Color(1, 1, 1)
});
O3.mat('road+', {
    type: 'MeshPhongMaterial',
    side: THREE.DoubleSide,
    receiveShadow: true,
    color: new THREE.Color(1, 1, 1)
});
O3.mat('road|', {
    type: 'MeshPhongMaterial',
    side: THREE.DoubleSide,
    receiveShadow: true,
    color: new THREE.Color(1, 1, 1)
});
O3.mat('road.', {
    type: 'MeshPhongMaterial',
    receiveShadow: true,
    color: new THREE.Color(1, 1, 1)
});
O3.mat('ground', {type: 'MeshLambertMaterial', receiveShadow: true, color: O3.util.rgb(0.05, 0.5, 0.1)});
O3.mat('white', {type: 'phong', receiveShadow: true, color: new THREE.Color(0.8, 0.8, 0.8)});
O3.mat('light', {type: 'MeshBasicMaterial', color: new THREE.Color(1, 1, 0.8)});
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
function Block() {

    this.tiles = [];
    this.max_x = 0;
    this.min_x = 0;
    this.max_z = 0;
    this.min_z = 0;

}

Block.prototype = {
    add: function (item) {

        if (this.tiles.length) {
            this.max_x = Math.max(item.x, this.max_x);
            this.min_x = Math.min(item.x, this.min_x);
            this.max_z = Math.max(item.z, this.max_z);
            this.min_z = Math.min(item.z, this.min_z);
        } else {
            this.max_x = this.min_x = item.x;
            this.max_z = this.min_z = item.z;
        }
        this.tiles.push(item);
    },

    order_tiles: function () {
        this.tiles = _.sortBy(this.tiles, ['x', 'z'])
    },

    can_add: function (item) {

        if (this.tiles.length < 1) {
            return true;
        }

        if (item.x > this.max_x + 1) {
            return false;
        } else if (item.x < this.min_x - 1) {
            return false;
        } else if (item.z > this.max_z + 1) {
            return false;
        } else if (item.z < this.min_z - 1) {
            return false;
        }

        return _.find(this.tiles, function (tile) {

            var difference = Math.abs(tile.x - item.x) + Math.abs(tile.z - item.z);
            //    var util = require('util');
            //   console.log('difference: %s for %s .. %s', difference, util.inspect(tile), util.inspect(item));
            return difference <= 1;
        }, this);
    },

    can_merge: function (block) {

        return _.find(block.tiles, function (tile) {
            return this.can_add(tile);
        }, this);

    },

    merge: function (block) {
        this.tiles = this.tiles.concat(block.tiles);
        this.min_x = Math.min(this.min_x, block.min_x);
        this.min_z = Math.min(this.min_z, block.min_z);
        this.max_x = Math.max(this.max_x, block.max_x);
        this.max_z = Math.max(this.max_z, block.max_z);
        block.tiles = [];
    },

    width: function () {
        return this.max_x - this.min_x + 1;
    },

    depth: function () {
        return this.max_z - this.min_z + 1;
    },

    geometry: function () {
        var geo = new THREE.PlaneGeometry(this.width() * City.GRID_SIZE, this.depth() * City.GRID_SIZE, this.width(), this.depth());
        _.each(_.flatten(geo.faceVertexUvs), function (uv) {
        }, this);
        _.each(geo.faces, function (f) {
            f.materialIndex = 0;
        });
        return geo;
    },

    mesh: function (type) {
        var t = TEXTURES.roads[type];
        var variation = this.width() + ',' + this.depth();
        if (!t[variation]){
            t[variation] = THREE.ImageUtils.loadTexture(t._url);
            t[variation].wrapS = THREE.RepeatWrapping;
            t[variation].wrapT = THREE.RepeatWrapping;
            t[variation].repeat.set(this.width(), this.depth());
            t[variation].mat = new THREE.MeshPhongMaterial();
        }

        var mesh = new THREE.Mesh(this.geometry(), t[variation].mat);

        if (!mesh.material.map){
            mesh.material.map = t[variation];
        }
        return mesh;
    }
};

Block.merge_blocks = function (blocks) {
    return  _.reduce(blocks, function (whole_blocks, block) {

        var mergable_block = _.find(whole_blocks, function (w) {
            return w.can_merge(block);
        });

        if (mergable_block) {
            mergable_block.merge(block);
        } else {
            whole_blocks.push(block);
        }

        return whole_blocks;
    }, [])
}

Block.make_blocks = function (tiles) {
    var blocks = [];

    _.each(tiles, function (item) {
        var adjacent_block = _.find(blocks, function (block) {
            return block.can_add(item);
        });

        if (!adjacent_block) {
            var block = new Block();
            block.add(item);
            blocks.push(block);
        } else {
            adjacent_block.add(item);
        }
    });

    return  Block.sort_blocks(Block.merge_blocks(blocks));
};

Block.sort_blocks = function (blocks) {
    return _.sortBy(blocks, ['min_x', 'min_z', 'max_x', 'max_z']);
};
City.Block = Block;

return City;

}));
