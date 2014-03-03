

$(function () {

    slice.parent.style.display = 'none';

    var t2 = new Date().getTime();

    console.log('building draw time: ', t2 - t);

    var city = new City();

    city.add_building_type('skyscraper', slice.parent, [0.7, 0.7, 0.7], [0.8, 0.8, 0.8]);
    city.display().size(window.innerWidth, window.innerHeight);
    city.display().append(document.body);

    O3.animate();


});