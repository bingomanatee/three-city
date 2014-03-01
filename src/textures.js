var TEXTURES = {};

_.each(
    {
        road_cross_texture: {
            name: '/img/roads.png',
            repeat: [0.5, 0.5],
            offset: [0, 0.5]
        },
        road_x_texture: {
            name: 'img/roads.png',
            repeat: [0.5, 0.5],
            offset: [0.5, 0.5]
        },
        road_z_texture: {
            name: 'img/roads.png',
            repeat: [0.5, 0.5],
            offset: [0, 0]
        },
        road_texture: {
            name: 'img/roads.png',
            repeat: [0.5, 0.5],
            offset: [0.5, 0]
        }
    },

    function (data, key) {
        if (typeof Image == 'undefined'){
            TEXTURES[key] = null;
        } else {
            var texture = THREE.ImageUtils.loadTexture(data.name);
            road_texture.repeat.set(data.repeat[0], data.repeat[1]);
            road_texture.offset.set(data.offset[0], data.repeat[1]);
            TEXTURES[key] = texture;
        }
    });
