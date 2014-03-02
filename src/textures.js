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