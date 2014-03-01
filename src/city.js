function City() {

    this.x = 0;
    this.z = 0;

    this.extent = 20;

    this.x_period = 8;
    this.z_period = 6;

    this.display_name = 'city';
}
O3.mat('road-', {
    type: 'MeshPhongMaterial',
    // map: road_x_texture,
    side: THREE.DoubleSide,
    color: new THREE.Color(1, 1, 1)
});
O3.mat('road+', {
    type: 'MeshPhongMaterial',
    //   map: road_cross_texture,
    side: THREE.DoubleSide,
    color: new THREE.Color(1, 1, 1)
});
O3.mat('road|', {
    type: 'MeshPhongMaterial',
    //  map: road_z_texture,
    side: THREE.DoubleSide,
    color: new THREE.Color(1, 1, 1)
});
O3.mat('road.', {
    type: 'MeshPhongMaterial',
    //   map: road_texture,
    color: new THREE.Color(1, 1, 1)
});
O3.mat('ground', {type: 'MeshLambertMaterial', color: O3.util.rgb(0.05, 0.5, 0.1)});
O3.mat('white', {type: 'phong', color: new THREE.Color(1, 1, .5)});

var GRID_SIZE = 20;
var tile_geo = new THREE.PlaneGeometry(GRID_SIZE, GRID_SIZE, 4, 4);

City.prototype = {

    display: function () {
        if (!this._display) {
            this._display = O3.display(this.display_name);
            var sun = new O3.RenderObject('point light').at(-GRID_SIZE * 2, GRID_SIZE * 3, 0);
            sun.obj().intensity = 4;
            sun.rgb(1, 1, 1);
            this._display.add(sun);
            sun.obj().rotateX(Math.PI / 2);
            var origin = new THREE.Vector3(0, 0, 0);
            var camera = this._display.camera();
            var cam = this._display.add(new O3.RenderObject(null, {name: 'camera', update: function () {
                // cam.obj().lookAt(origin);
                this.obj().translateY(0.5);
            }})).at(0, GRID_SIZE * 2, GRID_SIZE * 4);
            cam.obj().rotateX(Math.PI / -5);

            cam.obj().add(camera);
            var sphere = new THREE.Mesh(new THREE.SphereGeometry(GRID_SIZE / 2), this._display.mat('white').obj());
            this._display.add(new O3.RenderObject(sphere));
            this.ground_tiles();

            this.tower();

            this.ground_plane();
        }
        return this._display;
    },

    ground_plane: function () {

        var g = new THREE.PlaneGeometry(GRID_SIZE * this.extent * 2, GRID_SIZE * this.extent * 2, this.extent * 2, this.extent * 2);
        var mesh = new THREE.Mesh(g, this.display().mat('ground').obj());
        mesh.rotateX(Math.PI / -2);
        var ro = new O3.RenderObject(null, {name: 'ground plane'});
        ro.obj().add(mesh);
        ro.obj().translateY(GRID_SIZE / -10);
        this.display().add(ro);

    },

    tower: function () {
        var loader = new THREE.JSONLoader();

        var self = this;
        loader.load('/3d/tower.json', function (obj, mats) {
            console.log('tower: ', obj, 'mats:', mats);
            var mesh = new THREE.Mesh(obj, new THREE.MeshFaceMaterial(mats));
            mesh.scale.set(GRID_SIZE / 2, GRID_SIZE / 2, GRID_SIZE / 2);
            this.display().add(new O3.RenderObject(mesh, {name: 'tower'}));
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
        var road_tiles = this.display().find({type: 'roads'});

        var blocks = this.display().find({type: 'blocks'});

        var grid_data = this.grid_data();

        var road_diff = this._road_diff(road_tiles, grid_data.roads);

        //  console.log('data: ', grid_data);
        _.each(grid_data.roads, function (data, i) {
            var root;

            if (tiles[i]) {
                root = tiles.pop();
                root.obj().children = [];
            } else {
                root = new O3.RenderObject(null, function () {
                });
                ground.add(root);
            }

            switch (data.type) {
                case '+':
                    var mat = this.display().mat('road' + data.type).obj();

                    var tile = new THREE.Mesh(tile_geo, mat);
                    tile.rotateX(Math.PI / -2);
                    root.obj().add(tile);
                    if (!mat.map) {
                        mat.map = TEXTURES.road_cross_texture;
                    }
                    break;

                case '-':
                    var mat = this.display().mat('road' + data.type).obj();
                    var tile = new THREE.Mesh(tile_geo, mat);
                    tile.rotateX(Math.PI / -2);
                    root.obj().add(tile);
                    if (!mat.map) {
                        mat.map = TEXTURES.road_x_texture;
                    }
                    break;

                case '|':
                    var mat = this.display().mat('road' + data.type).obj();
                    var tile = new THREE.Mesh(tile_geo, mat);
                    tile.rotateX(Math.PI / -2);
                    root.obj().add(tile);
                    if (!mat.map) {
                        mat.map = TEXTURES.road_z_texture;
                    }
                    break;

                case '.':
                    if (this._tower) {
                        root.obj().add(this._tower.clone());
                    } else {
                        root.add_tower = true;
                        root.update = function () {
                            if (this._tower) {
                                var tower = this._tower.clone();
                                tower.translateY(Math.floor(Math.random() * 5) * GRID_SIZE);
                                root.obj().add(tower);
                                root.update = _.identity;
                            }
                        }.bind(this);

                    }

                    break;

            }

            root.at(data.x * GRID_SIZE, 0, data.z * GRID_SIZE);

        }, this);

        _.each(tiles, function (tile) {
            ground.remove(tile);
        })
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
        var self = this;

        var range = this.range();
        var x_axis = this.axis('x');
        var z_axis = this.axis('z');
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
                return _.groupBy(data, 'type');
            },
            function group_block_tiles(grouped_data) {

                var tiles = grouped_data['.'];
                delete grouped_data['.'];
                return {
                    roads: _.flatten(_.values(grouped_data)),
                    blocks: Block.make_blocks(tiles)
                };
            })
            ([]);
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
