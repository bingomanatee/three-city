

$(function () {

   var wall = new City.Wall({size: 800, repeat: 1, color: O3.util.rgb(1, 0.9, 0.7)});

    wall.display().append(document.body);
    wall.render();
    //O3.animate();
});