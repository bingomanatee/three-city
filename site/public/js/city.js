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
/*            var light = _.extend(new THREE.DirectionalLight(), {
                shadowCameraLeft: -D, shadowCameraRight: D, shadowCameraTop: -D, shadowCameraBottom: D, shadowBias: -0.001,
                castShadow: true, shadowCameraVisible: true, shadowMapWidth: 1024 * 8, shadowMapHeight: 1024 * 8});
            light.scale.set(2, 2, 2);
            var sun_light = new O3.RenderObject(light, function () {

            });
 */

            var sun = new O3.RenderObject().at(0, City.GRID_SIZE * 4, 0);

            var sun_light = this._display.light('sun');
        sun_light.set({
                shadowCameraLeft: -D, shadowCameraRight: D, shadowCameraTop: -D, shadowCameraBottom: D, shadowBias: -0.001,
                castShadow: true, shadowCameraVisible: true, shadowMapWidth: 1024 * 8, shadowMapHeight: 1024 * 8});
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
            mesh.castShadow = true;
           mesh.receiveShadow = true;
            mesh.scale.set(City.GRID_SIZE / 2, City.GRID_SIZE / 2, City.GRID_SIZE / 2);
             this.display().ro().set_obj(mesh);
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
                            var ro = new O3.RenderObject().set_obj(self._tower.clone());
                            ro.at(cube.obj().position);
                            root.add(ro);
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

        return tower;

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
            name: '/img/road-.png',
            repeat: [1, 1],
            offset: [0.0]
        },
        {
            type: '|',
            name: '/img/roadl.png',
            repeat: [1, 1],
            offset: [0.0]
        },
        {
            type: '.',
            name: '/img/roads.png',
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
        v: [1, 5, 1], // the window heights relative to a story.
        h: [4, 1, 4, 8, 4, 1, 4, 8, 4] // the width divisions of the window bank
    };

    this.margin = {
        h: [1, 20, 1], // relative to the entire banks of windows, the left and right margins.
        v: [3, 50, 1]    // relative to a single story: top height margin, story height, bottom margin (typically 0).
    };

    this.window_frame = {
        h: [1, 8, 1],
        v: [10, 12, 4],
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

function _ps(a, i, s) {
    if (arguments.length < 2) {
        s = 1;
    }
    if (i == 0) {
        return 0;
    }

    return s * _s(a.slice(0, i)) / _s(a);
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

        this.init_renderer();

        this.init_windows();
        // this.init_PP();
    },

    init_renderer: function () {

        var params = {
            shadowMapEnabled: true,
            shadowMapType: THREE.PCFSoftShadowMap
        };

        if(this.canvas){
            this.canvas.width = this.width();
            this.canvas.height = this.hieght();
            params.canvas = this.canvas;
        }

        this.display().renderer(new THREE.WebGLRenderer(params).setSize(this.width(), this.height()));
    },

    init_PP: function () {
        return;

        var camera = this.display().camera();
        var renderer = this.display().renderer();
        // depth

        var depthShader = THREE.ShaderLib[ "depthRGBA" ];
        var depthUniforms = THREE.UniformsUtils.clone(depthShader.uniforms);

        var depthMaterial = new THREE.ShaderMaterial({ fragmentShader: depthShader.fragmentShader, vertexShader: depthShader.vertexShader, uniforms: depthUniforms });
        depthMaterial.blending = THREE.NoBlending;

        // postprocessing

        var composer = new THREE.EffectComposer(renderer);
        composer.addPass(new THREE.RenderPass(this.display().scene(), camera));

        var depthTarget = new THREE.WebGLRenderTarget(this.size, this.height(), { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat });

        var effect = new THREE.ShaderPass(THREE.SSAOShader);
        effect.uniforms[ 'tDepth' ].value = depthTarget;
        effect.uniforms[ 'size' ].value.set(this.width() / 2, this.height() / 2);
        effect.uniforms[ 'cameraNear' ].value = -200;
        effect.uniforms[ 'cameraFar' ].value = 200;
        // effect.uniforms[ 'aoClamp' ].value = 0.5;
        effect.uniforms[ "lumInfluence"].value = 0.9;
        effect.material.defines = { "RGBA_DEPTH": true, "ONLY_AO_COLOR": "1.0, 0.7, 0.5" };
        effect.uniforms.onlyAO.value = 0;
        effect.renderToScreen = true;
        composer.addPass(effect);
        var effectFXAA = new THREE.ShaderPass(THREE.FXAAShader);
        //    effectFXAA.uniforms[ 'resolution' ].value.set( 2 / ( this.width() ), 2 / ( this.height() ) );

        composer.addPass(effectFXAA);

        var depthPassPlugin = new THREE.DepthPassPlugin();
        depthPassPlugin.renderTarget = depthTarget;

        renderer.addPrePlugin(depthPassPlugin);

        this.composer = composer;
    },

    init_windows: function () {
        this.STORY_HEIGHT = this.height() / this.stories;

        this.ul_anchor = this.display().ro().at(this.size / -2, this.height() / 2, this.wall_z);

        var self = this;

        var windows = function (iter) {
            var anchor = self.display().ro().at(-iter.width / 2, iter.height / 2, 0);
            iter.ro.add(anchor);
            var params = {
                v: self.window_sizes.v,
                h: self.window_sizes.h,
                width: iter.width,
                height: iter.height,
                anchor: anchor,
                level: 1,
                depth: 20,
                visible: true,
                next: function (window_iter) {
                    if ((window_iter.row == 1) && !(window_iter.col % 2)) {
                        self._draw_box(window_iter);
                        window_iter.ro.set('castShadow', true);
                        window_iter.ro.set('receiveShadow', false);
                    }
                },

                make_color: function () {
                    return new THREE.Color(1, 1, 0.8)
                }

            };

            self.grid_loop(params);
        };

        var next = function (box_iter) {

            console.log('inner bi: ', box_iter);
            if (box_iter.col == 1 && box_iter.row == 1) {

                var anchor = new O3.RenderObject().at(-box_iter.width / 2, box_iter.height / 2, 0);
                box_iter.ro.add(anchor);

                var params = {
                    width: box_iter.width,
                    height: box_iter.height,
                    v: _.map(_.range(0, self.stories), function () {
                        return 1
                    }),
                    h: [1],
                    anchor: anchor,
                    level: 1,
                    visible: false,
                    make_color: function (iter_params) {
                        var ch = (iter_params.row + iter_params.col) % 2;
                        return new THREE.Color(ch, ch, ch);
                    },
                    next: Fools.pipe().add(self._draw_box.bind(self)).add(windows)
                };
                self.grid_loop(params);
            }
        };

        var next_pipe = Fools.pipe().add(this._draw_box.bind(this)).add(next);

        this.grid_loop({
            anchor: this.ul_anchor,
            h: this.margin.h,
            v: this.margin.v,
            width: this.width(),
            height: this.height(),
            level: 1,
            visible: false,
            make_color: function (iter_params) {
                if (!window.CN) {
                    window.CN = 1;
                } else {
                    window.CN -= 0.05;
                }
                var c;
                if ((iter_params.col + iter_params.row) % 2) {
                    c = new THREE.Color(window.CN, 0, window.CN);
                } else {
                    c = new THREE.Color(0, window.CN, 0);
                }
                console.log('color: ', c.getStyle());
                return c;
            },
            next: next_pipe
        })
    },

    width: function () {
        return this.size;
    },

    _lerp3: function (a, b, ratio) {

        return [
            a[0] * (1 - ratio) + b[0] * ratio,
            a[1] * (1 - ratio) + b[1] * ratio,
            a[2] * (1 - ratio) + b[2] * ratio
        ];
    },

    grid_loop: function (params) {

        var handler = function (iter) {
            // if (iter.col != 1) return;
            var left = _ps(params.h, iter.col, params.width);
            var right = _ps(params.h, iter.col + 1, params.width);
            var width = right - left;

            var top = _ps(params.v, iter.row, params.height) - params.height;
            var bottom = _ps(params.v, iter.row + 1, params.height) - params.height;
            var height = bottom - top;

            return _.defaults({
                left: left,
                right: right,
                top: top,
                bottom: bottom,
                height: height,
                width: width
            }, params, iter);
        }.bind(this);

        if (params.next) {
            handler = Fools.pipe().add(handler).add(params.next);

        }

        Fools.loop(handler).dim('col').min(0).max(params.h.length).dim('row').min(0).max(params.v.length)();

    },

    _draw_box: function (box_iter) {

        var x = box_iter.left + box_iter.width / 2;
        var y = box_iter.top + box_iter.height / 2;
        console.log('col: ', box_iter.col, 'row: ', box_iter.row,
            'x:', Math.round(x), 'y:', Math.round(y),
            'w:', Math.round(box_iter.width), 'h:', Math.round(box_iter.height),
            'l/r:', Math.round(box_iter.left), Math.round(box_iter.right),
            't/b:', Math.round(box_iter.top), Math.round(box_iter.bottom));

        var panel;

        if (box_iter.hasOwnProperty('visible') && (!box_iter.visible)) {
            panel = new THREE.CubeGeometry(0.0001, 0.0001, 0.0001);
        } else {
            panel = new THREE.CubeGeometry(box_iter.width, box_iter.height, box_iter.depth || 5);
        }
        var mat = new THREE.MeshBasicMaterial({color: box_iter.make_color(box_iter)});
        console.log('mat: ', mat);
        var ro = this.display().ro().geo(panel)
            .at(x, y, 0)
            .mat(mat);

        if (box_iter.anchor) {
            box_iter.anchor.add(ro);
        }
        box_iter.ro = ro;
        return box_iter;
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

        this.display().add(new O3.RenderObject(new THREE.HemisphereLight(this.sun_color, this.dusk_color, 1.25)).at(0, 0, 1));
        var D = this.size * this.repeat / 1.5;

        var X_NUM = 2;
        var Y_NUM = 1;

        var X_RANGE = 1 + X_NUM * 2;
        var Y_RANGE = 1 + Y_NUM * 2;
        var SUN_CONFIG = {

            shadowMapFar: this.size * 4,
            shadowCameraLeft: -D, shadowCameraRight: D,
            shadowCameraTop: -D, shadowCameraBottom: D,
            shadowMapWidth: 1 * 1024, shadowMapHeight: 1 * 1024,
            shadowBias: -0.0002,
            castShadow: 1, shadowCameraVisible: 0,
            shadowDarkness: 0.06
        };

        Fools.loop(function (iter) {
            // if (iter.x || iter.y){
            var light = this.display().light('sun')
                .at(iter.x * this.width() / (8 * X_RANGE), iter.y * this.width() / (8 * Y_RANGE), this.size);
            light.obj().color.set(1, 1, 1);
            light.set(SUN_CONFIG);
            //  }
        }.bind(this)).dim('x').min(-X_NUM).max(X_NUM).dim('y').min(-Y_NUM + 1).max(Y_NUM + 1)();
    },

    init_wall: function () {
        var w = new THREE.PlaneGeometry(this.width() * 1.05, this.height() * 1.02);
        this.display().mat('wall_color', {color: this.color, type: 'MeshPhongMaterial'});
        var wall_ro = this.display().ro().geo(w).mat('wall_color').n('wall');
        var wall_base = new O3.RenderObject(null, {name: 'wall_base'}).at(0, 0, this.wall_z);
        wall_ro.set('receiveShadow', true);
        wall_base.add(wall_ro);
        this.display().add(wall_base);
        var ro = this.display().ro().geo(new THREE.CylinderGeometry(this.size / 20, this.size / 20, this.height(), 120)).mat('wall_color').at(-this.size / 8, 0, 0);
        ro.set('receiveShadow', true);
        ro.set('castShadow', true);
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