

$(function () {

    var city = new City();
    city.img_route = '/3d/textures/';

    city.add_building_type('skyscraper', THREE.ImageUtils.loadTexture('/img/city.png'), [0.7, 0.7, 0.7], [0.8, 0.8, 0.8]);
    city.display().size(window.innerWidth, window.innerHeight);
    city.display().append(document.body);

    O3.animate();


});