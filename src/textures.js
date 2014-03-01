var TEXTURES = {roads: {}};

_.each(
    [
        {
            type: '+',
            name: '/img/road+.png',
            repeat: [1,1],
            offset: [0.0]
        },
        {
            type: '-',
            name: 'img/road-.png',
            repeat: [1,1],
            offset: [0.0]
        },
        {
            type: '|',
            name: 'img/roadl.png',
            repeat: [1,1],
            offset: [0.0]
        },
        {
            type: '.',
            name: 'img/roads.png',
            repeat: [1,1],
            offset: [0.0]
        }
    ],

    function (data) {
        if (typeof Image == 'undefined') {
            TEXTURES.roads[data.type] = null;
        } else {
            var texture = THREE.ImageUtils.loadTexture(data.name);
            //texture.repeat.set(data.repeat[0], data.repeat[1]);
            //texture.offset.set(data.offset[0], data.offset[1]);
            texture.repeatS = texture.repatT = THREE.RepeatWrapping;
            TEXTURES.roads[data.type] = texture;
        }
    });
