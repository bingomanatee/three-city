

$(function () {

   var wall = new City.Wall({size: 512, repeat: 3, color: O3.util.rgb(1, 0.9, 0.7)});

    wall.display().append(document.body);
   // wall.display().renderer().render().render(wall.display().scene(), wall.display().camera());

    O3.animate();
});