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

    this.extent = 10;

    this.x_period = 5;
    this.z_period = 3;

    this.display_name = 'city';
}

/*var road_cross_texture = THREE.ImageUtils.loadTexture('img/roads.png');
road_cross_texture.repeat.set(0.5, 0.5);*/
O3.mat('road+', {
    type: 'MeshLambertMaterial',
    //   map: road_cross_texture,
    side: THREE.DoubleSide,
    color: new THREE.Color(1, 1, 1)
});

/*var road_x_texture = THREE.ImageUtils.loadTexture('img/roads.png');
road_x_texture.repeat.set(0.5, 0.5);
road_x_texture.offset.x = 0.5;*/
O3.mat('road-', {
    //  type: 'MeshLambertMaterial',
    // map: road_x_texture,
    side: THREE.DoubleSide,
    color: new THREE.Color(1, 1, 1)
});

/*var road_z_texture = THREE.ImageUtils.loadTexture('img/roads.png');
road_x_texture.repeat.set(0.5, 0.5);
road_x_texture.offset.y = 0.5;*/
O3.mat('road|', {
    //  type: 'MeshLambertMaterial',
    //  map: road_z_texture,
    side: THREE.DoubleSide,
    color: new THREE.Color(1, 1, 1)
});

/*var road_texture = THREE.ImageUtils.loadTexture('img/roads.png');
road_texture.repeat.set(0.5, 0.5);
road_texture.offset.set(0.5, 0.5);*/
O3.mat('road.', {
    // type: 'MeshLambertMaterial',
    //   map: road_texture,
    color: new THREE.Color(1, 1, 1)
});

O3.mat('white', {type: 'phong', color: new THREE.Color(1, 1, .5)});
var GRID_SIZE = 20;
var tile_geo = new THREE.PlaneGeometry(GRID_SIZE, GRID_SIZE);

City.prototype = {

    display: function () {
        if (!this._display) {
            this._display = O3.display(this.display_name);
            var sun = new O3.RenderObject('point light').at(-GRID_SIZE * 2, GRID_SIZE * 3, 0);
            sun.obj().intensity = 4;
            sun.rgb(1, 1, 1);
            this._display.add(sun);
            sun.obj().rotateX(Math.PI / 2);
            var cam = this._display.add(new O3.RenderObject(null, {name: 'camera', update: function () {
                //  this.obj().rotateY(Math.PI/100);
            }})).at(0, GRID_SIZE * 2, GRID_SIZE * 10);
            cam.obj().rotateX(Math.PI / -30);

            cam.obj().add(this._display.camera());
            this._display.add(new O3.RenderObject(new THREE.Mesh(new THREE.SphereGeometry(GRID_SIZE / 2), this._display.mat('white').obj())));
            this.ground_tiles();
        }
        return this._display;
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
        var tiles = ground.children;

        var grid_data = this.grid_data();
      //  console.log('data: ', grid_data);
        _.each(grid_data, function (data, i) {

            var tile = new THREE.Mesh(
                tile_geo,
                this.display().mat('road' + data.type).obj()
            );
            if (!tiles[i]) {

                tile.rotateX(Math.PI /2);
                tiles[i] = new O3.RenderObject(tile, function () {
               //     this.obj().rotateX(Math.PI / 100);
                });
                ground.add(tiles[i]);
            } else {
              // tiles[i].obj(tile);
            }
            tiles[i].at(data.x * GRID_SIZE, 0, data.z * GRID_SIZE);
            tiles[i].obj().geometry.computeTangents();

        }, this);
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
                    memo.push(_.extend({type: '.'}, iterator));
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
