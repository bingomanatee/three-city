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

    this.building_types = [];
}

City.GRID_SIZE = 50;

var cube_geo = new THREE.CubeGeometry(City.GRID_SIZE, City.GRID_SIZE, City.GRID_SIZE, 1, 1, 1);
cube_geo.castShadow = true;

City.prototype = {

    display: function () {
        if (!this._display) {
            this._display = O3.display(this.display_name);
            this._display.renderer().shadowMapEnabled = true;

            var D = 64 * this.extent;
            //    console.log('map size: ', D);
            var light = _.extend(new THREE.DirectionalLight(), {
                shadowCameraLeft: -D, shadowCameraRight: D, shadowCameraTop: -D, shadowCameraBottom: D, shadowBias: -0.001,
                castShadow: true, shadowCameraVisible: true, shadowMapWidth: 1024 * 8, shadowMapHeight: 1024 * 8});
            light.scale.set(2, 2, 2);
            var sun_light = new O3.RenderObject(light, function () {

            });

            var sun = new O3.RenderObject(null).at(0, City.GRID_SIZE * 4, 0);
            sun.add(sun_light);
            sun.at(City.GRID_SIZE * -4, City.GRID_SIZE * 16, City.GRID_SIZE * 6);
            this._display.add(sun);

            var hemi = new O3.RenderObject(new THREE.HemisphereLight(O3.util.rgb(0.8, .75, 1), O3.util.rgb(0.5, 0.1, 0), 0.125), {name: 'hemi-sky'});
            this._display.add(hemi);

            var camera = this._display.camera();
            var cam = this._display.add(new O3.RenderObject(null, {name: 'camera', update: function () {
                this.obj().translateY(1);
            }})).at(City.GRID_SIZE * -4, City.GRID_SIZE * 6, City.GRID_SIZE * 6);

            cam.obj().add(camera);
            cam.obj().rotateX(Math.PI / -3);
            var sphere = new THREE.Mesh(new THREE.SphereGeometry(City.GRID_SIZE / 2), this._display.mat('white').obj());
            this._display.add(new O3.RenderObject(sphere));
            this.ground_tiles();

            this.tower();
            this.ground_plane();
        }
        return this._display;
    },

    add_building_type: function (n, f, s, t) {
        this.building_types.push(new Building(n, f, s, t));
    },

    building: function(){
        return _.sample(this.building_types).mesh(this._tower);
    },

    ground_plane: function () {
        var g = new THREE.PlaneGeometry(City.GRID_SIZE * this.extent * 2, City.GRID_SIZE * this.extent * 2, this.extent * 2, this.extent * 2);
        var mesh = new THREE.Mesh(g, this.display().mat('ground').obj());
        mesh.receiveShadow = true;
        mesh.rotateX(Math.PI / -2);
        var ro = new O3.RenderObject(null, {name: 'ground plane'});
        ro.obj().add(mesh);
        ro.obj().translateY(City.GRID_SIZE / -10);
        this.display().add(ro);

    },

    tower: function () {
        var loader = new THREE.JSONLoader();

        var self = this;
        loader.load('/3d/tower2.js', function (obj, mats) {
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

                root = new O3.RenderObject();

                var cubes = [];
                _.each(block.tiles, function (tile) {
                    var cube = new THREE.Mesh(cube_geo, this.display().mat('white').obj());
                    cube.receiveShadow = true;
                    cube.castShadow = true;
                    var cube_ro = new O3.RenderObject(cube, {data: tile});
                    cube_ro.at(City.GRID_SIZE * tile.x, 0, City.GRID_SIZE * tile.z);
                    root.add(cube_ro);
                    cubes.push(cube_ro);
                }, this);

                root.update = function () {
                    if (root.merged) {
                        return;
                    }
                    if (self._tower) {
                        var mesh;
                        _.each(cubes, function (cube) {
                            root.remove(cube);
                            var tower = self.building();
                            tower.position.set(cube.data.x * City.GRID_SIZE, Math.floor(Math.random() * 4) * -City.GRID_SIZE, cube.data.z * City.GRID_SIZE);
                            if (mesh){
                                
                            } else {
                                mesh = tower;
                            }
                            root.add(new O3.RenderObject(tower).at());

                            root.update = _.identity;
                            root.update_on_animate = false;
                            root.merged = true;
                        });

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

function Building(name, frontTexture, sideTexture, topTexture) {
    this.name = name;
    this.frontTexture = frontTexture;
    this.sideTexture = sideTexture;
    this.topTexture = topTexture;
}

var XXX = false;
Building.prototype = {


    mesh: function (structure) {

        var tower = structure.clone();
        tower.receiveShadow = true;
        tower.castShadow = true;
        /*
         var front_map = this._frontMaterial().map;

         _.each(tower.material.materials, function(mat){
         if(mat.name == 'front'){
         mat.map = front_map;
         }
         });*/
        tower.material = this._material(); //[1].needsUpdate = true;

        return tower;

    },

    _material: function () {

        if (!this.__material) {
            this.__material = new THREE.MeshFaceMaterial(
              [this._backMaterial(),   this._frontMaterial(), this._leftMaterial(), this._rightMaterial(), this._topMaterial()]
            );
            this.__material.needsUpdate = true;
        }

        return this.__material;
    },

    _frontMaterial: function () {
        if (!this.__frontMaterial) {

            if (this.frontTexture.tagName == 'CANVAS') {
                var t = this.frontTexture;
                this.frontTexture = document.createElement('img');
                this.frontTexture.src = t.toDataURL();
            }
            //  var texture = THREE.ImageUtils.loadTexture('/img/city.png');
            var texture = new THREE.Texture(this.frontTexture);
            texture.needsUpdate = true;
            // texture.repeat.set(1, 6);
            texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
            this.__frontMaterial = new THREE.MeshLambertMaterial({map: texture});
        }
        return this.__frontMaterial;
    },

    _leftMaterial: function () {
        if (!this.__leftMaterial) {
            this.__leftMaterial = new THREE.MeshLambertMaterial({color: O3.util.rgb.apply(O3.util, this.leftTexture)});
        }
        return this.__leftMaterial;
    },

    _backMaterial: function () {
        if (!this.__backMaterial) {
            this.__backMaterial = new THREE.MeshLambertMaterial({color: O3.util.rgb.apply(O3.util, this.backTexture)});
        }
        return this.__backMaterial;
    },

    _rightMaterial: function () {
        if (!this.__rightMaterial) {
            this.__rightMaterial = new THREE.MeshLambertMaterial({color: O3.util.rgb.apply(O3.util, this.rightTexture)});
        }
        return this.__rightMaterial;
    },


    _topMaterial: function () {
        if (!this.__topMaterial) {
            this.__topMaterial = new THREE.MeshLambertMaterial({color: O3.util.rgb.apply(O3.util, this.topTexture)});
        }
        return this.__topMaterial;
    },

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
function Wall(params) {
    this.id = ++Wall.id;

    this.color = new THREE.Color(0.8, 0.8, 0.8);
    this.repeat = Wall.REPEAT;
    this.size = Wall.SIZE;
    this.stories = 40;
    this.wall_z = -10;

    this.sun_color = new THREE.Color(.6, .6, .55);
    this.dusk_color = new THREE.Color(.3, 0.2, .15, 25);

    this.window_sizes = {
        h: [2, 5, 3],
        v: [4, 1, 4, 1, 4, 1, 4, 1, 4, 1, 4, 1, 4, 1, 4, 1, 4, 1, 4, 1, 4, 1, 4, 1, 4]
    };

    this.margin = {
        h: [1, 3, 1], // relative to a single window, the left and right margins.
        v: [1, 10, 0]    // relative to a single story: top height margin, story height, bottom margin (typically 0).
    };

    this.window_frame = {
        h_proportions: [1, 8, 1],
        v_proportions: [10, 20, 4],
        color: new THREE.Color(0.4, 0, 0.2)
    };

    this.window_color = {
        lit_percent: 0.25,
        unlit_color: new THREE.Color(0, 0, 0),
        lit_color: new THREE.Color(1, 1, 0.9)
    };

    var tokens = _.pluck(params, Wall.OBJ_PARAMS);
    _.each(Wall.OBJ_PARAMS, function (key) {
        delete params[key]
    });

    _.extend(this, params);
    _.each(tokens, function (value, name) {
        if (value && _.isObject(value)) {
            _.extend(this[name], value);
        }
    }, this);

    this.init();

    this.display().mat('window lit', {type: 'MeshBasicMaterial', color: this.window_color.lit_color});
    this.display().mat('window unlit', {type: 'MeshBasicMaterial', color: this.window_color.unlit_color});
}

Wall.id = 0;
Wall.SIZE = 512;
Wall.REPEAT = 5;
Wall.OBJ_PARAMS = ['window_frame', 'wiondow_color', 'window_sizes'];

function _s(a) {
    return _.reduce(a, function (o, n) {
        return o + n;
    }, 0);
}

/**
 * the proportion of one array element to the sum of the array
 *
 * @param a {array}
 * @param i {int}
 * @param s {number}
 *
 * @returns {number}
 * @private
 */
function _p(a, i, s) {
    if (arguments.length < 2) {
        s = 1;
    }
    return s * a[i] / _s(a);
}

Wall.prototype = {

    windows: function () {
        return Math.floor(this.window_sizes.v.length / 2);
    },

    display: function () {
        if (!this._display) {
            this._display = O3.display('wall_' + this.id, {width: this.size, height: this.size * this.repeat});
        }

        return this._display;
    },

    init: function () {
        this.init_camera();

        this.init_lights();

        this.init_wall();

        this.display().add(new O3.RenderObject(new THREE.AxisHelper(this.size / 4)));
        var cube = new THREE.Mesh(new THREE.CubeGeometry(this.size / 8, this.size / 8, this.size / 8), new THREE.MeshLambertMaterial({color: O3.util.rgb(0.8, 0.8, 0.8)}));
        cube.castShadow = true;

        // this.display().add(new O3.RenderObject(cube).at(0, 0, this.wall_z));

        this.display().renderer().shadowMapEnabled = true;
        this.display().renderer().shadowMapType = THREE.PCFSoftShadowMap;
        this.init_windows();
    },

    init_windows: function () {
        this.STORY_HEIGHT = this.height() / this.stories;

        this.TOP_MARGIN = _p(this.margin.h, 0, this.STORY_HEIGHT);
        this.BOTTOM_MARGIN = _p(this.margin.h, 2, this.STORY_HEIGHT);
        this.REAL_HEIGHT = this.height() - (this.TOP_MARGIN + this.BOTTOM_MARGIN);
        this.REAL_STORY_HEIGHT = this.REAL_HEIGHT / this.stories; // the height of each story, adjusted for margins.
        this.STORY_HEIGHT = this.height() / this.stories; // the height of each story, adjusted for margins.

        this.WINDOW_TOP = _p(this.window_sizes.h, 0, this.REAL_STORY_HEIGHT);
        this.WINDOW_BOTTOM = _p(this.window_sizes.h, 2, this.REAL_STORY_HEIGHT);
        this.WINDOW_HEIGHT = this.height() / this.stories; //_p(this.window_sizes.h, 1, this.REAL_STORY_HEIGHT);
        this.WINDOW_WIDTH = this.size / this.windows();
        this.WINDOW_LEFT_MARGIN = _p(this.margin.h, 0, this.WINDOW_WIDTH);
        this.WINDOW_RIGHT_MARGIN = _p(this.margin.h, 2, this.WINDOW_WIDTH);
        this.REAL_WINDOW_WIDTH = (this.size - (this.WINDOW_LEFT_MARGIN + this.WINDOW_RIGHT_MARGIN)); // the width of the entire bank of windows
        this.REAL_EACH_WINDOW_WIDTH = this.REAL_WINDOW_WIDTH / this.windows();
        this.INNER_WINDOW_WIDTH = _p(this.window_frame.h_proportions, 1, this.REAL_EACH_WINDOW_WIDTH);
        this.INNER_WINDOW_HEIGHT = _p(this.window_frame.v_proportions, 1, this.STORY_HEIGHT);
        this.WINDOW_Y_OFFSET = _p(this.window_frame.v_proportions, 2, this.STORY_HEIGHT) - _p(this.window_frame.v_proportions, 0, this.STORY_HEIGHT);

        console.log('left edge of building: ', this.size / -2, 'to', this.size / 2);
        Fools.loop(function (iterator) {
            var center_x = (iterator.window + 0.5) * this.REAL_EACH_WINDOW_WIDTH; // left edge of window;
            center_x += this.WINDOW_LEFT_MARGIN; // adjsted to margin
            center_x -= this.size / 2; // adgusted to size of building
            // center_x += this.REAL_EACH_WINDOW_WIDTH /2; // adjusted to center of window

            var center_y = iterator.story * this.STORY_HEIGHT + this.WINDOW_Y_OFFSET;
            //   center_y -= this.WINDOW_TOP - this.WINDOW_BOTTOM;
            center_y -= this.height() / 2; // adjusted to size of building
            center_y += this.WINDOW_HEIGHT / 2; // adjuusted to center of window

            var window = new THREE.CubeGeometry(this.INNER_WINDOW_WIDTH, this.INNER_WINDOW_HEIGHT, 20);
            var name = 'window_' + iterator.window + '_story_' + iterator.story;
            var ro;
            var mesh;

            if (Math.random() > this.window_color.lit_percent) {
                mesh = new THREE.Mesh(window, this.display().mat('window lit').obj());
                ro = new O3.RenderObject(mesh, {name: name});
            } else {
                 mesh = new THREE.Mesh(window, this.display().mat('window unlit').obj());
                ro = new O3.RenderObject(mesh, {name: name});
            }
            mesh.castShadow = true;

            ro.at(center_x, center_y, this.wall_z);
            console.log('window', iterator.window, 'of', this.windows(), 'x:', Math.round(center_x), '(', Math.round(center_x - this.REAL_EACH_WINDOW_WIDTH / 2), '..', Math.round(center_x + this.REAL_EACH_WINDOW_WIDTH / 2), ')', 'y: ', Math.round(center_y));
            this.display().add(ro);

        }.bind(this)).dim('window').min(0).max(this.windows() - 1).dim('story').min(0).max(this.stories)();

    },

    height: function () {
        return this.size * this.repeat;
    },

    init_camera: function () {
        var camera =
            this.display().camera(new THREE.OrthographicCamera(-this.size / 2, this.size / 2, this.height() / 2, this.height() / -2));

        this.display().add(new O3.RenderObject(camera).at(0, 0, 500));
    },

    init_lights: function () {

        this.display().add(new O3.RenderObject(new THREE.HemisphereLight(this.sun_color, this.dusk_color, 1.25)));

        var sun = new O3.RenderObject('sun light', {name: 'sun'}).at(-this.size / 4, this.size / 2, - this.size);
        sun.obj().castShadow = true;
        var D = this.size * this.repeat / 1.5;
        _.extend(sun.obj(), {
            shadowCameraLeft: -D, intensity: 0.75, shadowCameraRight: D, shadowCameraTop: -D, shadowCameraBottom: D, shadowBias: -0.001,
            castShadow: true, shadowCameraVisible: true, shadowMapWidth: 5 * 1024, shadowMapHeight: 5 * 1024});
        this.display().add(sun);

    },

    init_wall: function () {
        var w = new THREE.PlaneGeometry(this.size * 1.05, this.size * this.repeat * 1.02, 10, 10);
        var wc = this.display().mat('wall_color', {color: this.color, type: 'MeshBasicMaterial'});
        var wm = new THREE.Mesh(w, wc.obj());
        wm.receiveShadow = true;
        var wall_ro = new O3.RenderObject(wm, function () {
            //   this.obj().rotateX(Math.PI/1000);
            //  console.log(Math.round(100 * this.obj().rotation.x / Math.PI));
        });
        wall_ro.obj().rotateX(0);
        var wall_base = new O3.RenderObject(null, {name: 'wall_base'}).at(0, 0, this.wall_z);
        wall_base.add(wall_ro);
        this.display().add(wall_base);
    }

};

City.Wall = Wall;

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
         mesh.receiveShadow = mesh.castShadow = true;
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
