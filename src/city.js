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
