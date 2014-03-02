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