function Wall(params) {
    this.size = Wall.SIZE;
    this.repeat = 1;
    _.extend(this, params);
    this.id = ++Wall.id;
    this.width = this.size;
    this.height = this.size * this.repeat;
    this.renderer();
    this.display().mat('wall', { type: 'phong'}).set('color', O3.util.rgb(0.8, 0.75, 0.5));
    this.display().mat('window', {type: 'phong'}).set('color', O3.util.rgb(1, 1, 1));
    this.init_wall();
    this.init_light();
}

Wall.id = 0;
Wall.SIZE = 512;
Wall.REPEAT = 5;
Wall.OBJ_PARAMS = ['window_frame', 'wiondow_color', 'window_sizes'];

Wall.prototype = {

    display: function () {
        if (!this._display) {
            this._display = O3.display('wall');
            this._display.size(this.width, this.height);
        }
        return this._display;
    },

    camera: function () {
        if (!this._camera) {
            this._camera = new THREE.PerspectiveCamera(90, this.width / this.height, 1, this.size * 4);
            this.display().ro()
                .at(this.size / 4, 0, this.size)
                .rotY(Math.PI / 8)
                .obj().add(this._camera);
        }

        return this._camera;
    },

    renderer: function () {
        if (!this._renderer) {
            var ren = new THREE.WebGLDeferredRenderer(_.pick(this, 'width', 'height'));

            ren.setSize(this.width, this.height);
            ren.shadowMapEnabled = true;
            this._renderer = this.display().renderer(ren);
        }

        return this._renderer;
    },

    init_wall: function () {
        this.display().ro(new THREE.CubeGeometry(this.width, this.height, 10))
            .mat('wall')
            .set({castShadow: true, receiveShadow: true});

        this.display().ro(new THREE.CubeGeometry(this.width / 10, this.width / 10, 30))
            .mat('window')
            .set({castShadow: true, receiveShadow: true});
    },

    init_light: function () {
        var lights = [];
        Fools.loop(function (iter) {
            if (!( (Math.abs(iter.x) != Math.abs(iter.y)))) {
                return;
            }
            var x_offset = iter.x * this.size / 4;
            var y_offset = (iter.y + 1) * this.size / 4;

            lights.push(this.display().light('sun')
                .at(x_offset, y_offset, this.size)
                .set({castShadow: true, shadowDarkness: 0.25}));

        }.bind(this)).dim('x', -3, 3).dim('y', -3, 3)();

        console.log('lights: ', lights);

        _.each(lights, function (ro) {
            var light = ro.obj();
            light.intensity = 1 / lights.length;
        })
    },

    enable_shadows: function (children) {
        return;
        if (!children) {

            var scene = this.display().scene();
            children = scene.children;
        }

        _.each(children, function (child) {
            var obj = child.hasOwnProperty('obj') && _.isFunciton(child.obj) ? child.obj() : child;

            if (obj) {

                if (!obj.castShadow || (!obj.receiveShadow)) {
                    obj.castShadow = true;
                    obj.receiveShadow = true;
                }
                if (obj.children && obj.children.length) {
                    this.enable_shadows(obj.children);
                }
                if ((!(child === obj)) && child.children && child.children.length) {
                    this.enable_shadows(child.children);
                }
            }
        }, this);
    },

    render: function () {

        this.enable_shadows();
        this.display().render(this.camera());
    }

};

City.Wall = Wall;
