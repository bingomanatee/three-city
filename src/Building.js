function Building(name, frontTexture, sideTexture, topTexture) {
    this.name = name;
    this.frontTexture = frontTexture;
    this.sideTexture = sideTexture;
    this.topTexture = topTexture;
}

var XXX = false;
Building.prototype = {


    mesh: function (structure) {

        var tower = structure.clone();
        tower.receiveShadow = true;
        tower.castShadow = true;

        return tower;

    }

};