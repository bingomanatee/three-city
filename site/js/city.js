(function(root, factory) {
    if(typeof exports === 'object') {
        module.exports = factory(require('underscore'), require('canvas'), require('three'), require('node-easel'), require('fools'));
    }
    else if(typeof define === 'function' && define.amd) {
        define(['_', 'Canvas', 'Three', 'createjs', 'Fools'], factory);
    }
    else {
        root['City'] = factory(root._, root.Canvas, root.Three, root.createjs, root.Fools);
    }
}(this, function(_, Canvas, Three, createjs, Fools) {

function City() {

    this.x = 0;
    this.z = 0;

    this.extent = 20;

    this.x_period = 8;
    this.z_period = 6;

    this.display_name = 'city';
}

var road_cross_texture = THREE.ImageUtils.loadTexture('/img/roads.png', undefined, function (e) {
    _.extend(road_cross_texture, e);
    road_cross_texture.loaded = true;
    console.log('loaded cross texture');
}, function (err) {
    console.log('texture load error: ', err);
});
road_cross_texture.repeat.set(0.5, 0.5);
road_cross_texture.offset.set(0, 0.5);
O3.mat('road+', {
    type: 'MeshPhongMaterial',
    //   map: road_cross_texture,
    side: THREE.DoubleSide,
    color: new THREE.Color(1, 1, 1)
});

var road_x_texture = THREE.ImageUtils.loadTexture('img/roads.png');
road_x_texture.repeat.set(0.5, 0.5);
road_x_texture.offset.set(0.5, 0.5);
O3.mat('road-', {
    type: 'MeshPhongMaterial',
    // map: road_x_texture,
    side: THREE.DoubleSide,
    color: new THREE.Color(1, 1, 1)
});

var road_z_texture = THREE.ImageUtils.loadTexture('img/roads.png');
road_z_texture.repeat.set(0.5, 0.5);
road_z_texture.offset.set(0, 0);

O3.mat('road|', {
    type: 'MeshPhongMaterial',
    //  map: road_z_texture,
    side: THREE.DoubleSide,
    color: new THREE.Color(1, 1, 1)
});

var road_texture = THREE.ImageUtils.loadTexture('img/roads.png');
road_texture.repeat.set(0.5, 0.5);
road_texture.offset.set(0.5, 0);
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
        ro.obj().translateY(GRID_SIZE/-10);
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
        self._update_ground_tiles(self._ground);
        return this._ground;
    },

    _update_ground_tiles: function (ground) {
        var tiles = ground.children.slice();

        var grid_data = this.grid_data();
        //  console.log('data: ', grid_data);
        _.each(grid_data, function (data, i) {
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
                        mat.map = road_cross_texture;
                    }
                    break;

                case '-':
                    var mat = this.display().mat('road' + data.type).obj();
                    var tile = new THREE.Mesh(tile_geo, mat);
                    tile.rotateX(Math.PI / -2);
                    root.obj().add(tile);
                    if (!mat.map) {
                        mat.map = road_x_texture;
                    }
                    break;

                case '|':
                    var mat = this.display().mat('road' + data.type).obj();
                    var tile = new THREE.Mesh(tile_geo, mat);
                    tile.rotateX(Math.PI / -2);
                    root.obj().add(tile);
                    if (!mat.map) {
                        mat.map = road_z_texture;
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

        return Fools.loop(
            function (iterator, memo, out) {
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
        ).dim('x').min(range.x.min).max(range.x.max).dim('z').min(range.z.min).max(range.z.max)([]);
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


}

return City;

}));
