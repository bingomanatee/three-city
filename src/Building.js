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
        /*
         var front_map = this._frontMaterial().map;

         _.each(tower.material.materials, function(mat){
         if(mat.name == 'front'){
         mat.map = front_map;
         }
         });*/
        tower.material = this._material(); //[1].needsUpdate = true;

        return tower;

    },

    _material: function () {

        if (!this.__material) {
            this.__material = new THREE.MeshFaceMaterial(
              [this._backMaterial(),   this._frontMaterial(), this._leftMaterial(), this._rightMaterial(), this._topMaterial()]
            );
            this.__material.needsUpdate = true;
        }

        return this.__material;
    },

    _frontMaterial: function () {
        if (!this.__frontMaterial) {

            if (this.frontTexture.tagName == 'CANVAS') {
                var t = this.frontTexture;
                this.frontTexture = document.createElement('img');
                this.frontTexture.src = t.toDataURL();
            }
            //  var texture = THREE.ImageUtils.loadTexture('/img/city.png');
            var texture = new THREE.Texture(this.frontTexture);
            texture.needsUpdate = true;
            // texture.repeat.set(1, 6);
            texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
            this.__frontMaterial = new THREE.MeshLambertMaterial({map: texture});
        }
        return this.__frontMaterial;
    },

    _leftMaterial: function () {
        if (!this.__leftMaterial) {
            this.__leftMaterial = new THREE.MeshLambertMaterial({color: O3.util.rgb.apply(O3.util, this.leftTexture)});
        }
        return this.__leftMaterial;
    },

    _backMaterial: function () {
        if (!this.__backMaterial) {
            this.__backMaterial = new THREE.MeshLambertMaterial({color: O3.util.rgb.apply(O3.util, this.backTexture)});
        }
        return this.__backMaterial;
    },

    _rightMaterial: function () {
        if (!this.__rightMaterial) {
            this.__rightMaterial = new THREE.MeshLambertMaterial({color: O3.util.rgb.apply(O3.util, this.rightTexture)});
        }
        return this.__rightMaterial;
    },


    _topMaterial: function () {
        if (!this.__topMaterial) {
            this.__topMaterial = new THREE.MeshLambertMaterial({color: O3.util.rgb.apply(O3.util, this.topTexture)});
        }
        return this.__topMaterial;
    },

};