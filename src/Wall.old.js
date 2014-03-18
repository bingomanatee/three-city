function Wall(params) {
    this.id = ++Wall.id;

    this.color = new THREE.Color(0.8, 0.8, 0.8);
    this.repeat = Wall.REPEAT;
    this.size = Wall.SIZE;
    this.stories = 40;
    this.wall_z = -10;

    this.sun_color = new THREE.Color(.6, .6, .55);
    this.dusk_color = new THREE.Color(.3, 0.2, .15, 25);

    this.window_sizes = {
        v: [1, 5, 1], // the window heights relative to a story.
        h: [4, 1, 4, 8, 4, 1, 4, 8, 4], // the width divisions of the window bank

        h_level: [1, 3, 1],
        v_level: [4, 1, 4]
    };

    this.margin = {
        h: [1, 20, 1],   // relative to the entire banks of windows, the left and right margins.
        v: [3, 50, 1],   // relative to a single story: top height margin, story height, bottom margin (typically 0).

        h_level: [4, 0, 4],
        v_level: [4, 0, 4]
    };

    this.window_frame = {
        h: [1, 8, 1],
        v: [10, 12, 4],
        color: new THREE.Color(0.4, 0, 0.2)
    };

    this.window_color = {
        lit_percent: 0.25,
        unlit_color: new THREE.Color(0, 0, 0),
        lit_color: new THREE.Color(1, 1, 0.9)
    };

    var tokens = _.pluck(params, Wall.OBJ_PARAMS);
    _.each(Wall.OBJ_PARAMS, function (key) {
        delete params[key]
    });

    _.extend(this, params);
    _.each(tokens, function (value, name) {
        if (value && _.isObject(value)) {
            _.extend(this[name], value);
        }
    }, this);

    this.init();

    this.display().mat('window lit', {type: 'MeshBasicMaterial', color: this.window_color.lit_color});
    this.display().mat('window unlit', {type: 'MeshBasicMaterial', color: this.window_color.unlit_color});
}

Wall.id = 0;
Wall.SIZE = 512;
Wall.REPEAT = 5;
Wall.OBJ_PARAMS = ['window_frame', 'wiondow_color', 'window_sizes'];

function _s(a) {
    return _.reduce(a, function (o, n) {
        return o + n;
    }, 0);
}

/**
 * the proportion of one array element to the sum of the array
 *
 * @param a {array}
 * @param i {int}
 * @param s {number}
 *
 * @returns {number}
 * @private
 */
function _p(a, i, s) {
    if (arguments.length < 2) {
        s = 1;
    }
    return s * a[i] / _s(a);
}

function _ps(a, i, s) {
    if (arguments.length < 2) {
        s = 1;
    }
    if (i == 0) {
        return 0;
    }

    return s * _s(a.slice(0, i)) / _s(a);
}

Wall.prototype = {

    windows: function () {
        return Math.floor(this.window_sizes.v.length / 2);
    },

    display: function () {
        if (!this._display) {
            this._display = O3.display('wall_' + this.id, {width: this.size, height: this.size * this.repeat});
        }

        return this._display;
    },

    init: function () {
        this.init_camera();

        this.init_lights();

        this.init_wall();

     //   this.display().add(new O3.RenderObject(new THREE.AxisHelper(this.size / 4)));
        var cube = new THREE.Mesh(new THREE.CubeGeometry(this.size / 8, this.size / 8, this.size / 8), new THREE.MeshLambertMaterial({color: O3.util.rgb(0.8, 0.8, 0.8)}));
        cube.castShadow = true;

        this.init_renderer();

        this.init_windows();
        // this.init_PP();
    },

    init_canvas: function(){
        if(this.canvas){
            this.canvas.width = this.width();
            this.canvas.height = this.hieght();
        }
},

    init_renderer: function () {

        var params = {
            shadowMapEnabled: true,
            shadowMapType: THREE.PCFSoftShadowMap
        };

        if (this.canvas){
            this.init_canvas();
            params.canvas = this.canvas;
        }

        this.display().renderer(new THREE.WebGLRenderer(params).setSize(this.width(), this.height()));
    },

    init_PP: function () {
        return;

        var camera = this.display().camera();
        var renderer = this.display().renderer();
        // depth

        var depthShader = THREE.ShaderLib[ "depthRGBA" ];
        var depthUniforms = THREE.UniformsUtils.clone(depthShader.uniforms);

        var depthMaterial = new THREE.ShaderMaterial({ fragmentShader: depthShader.fragmentShader, vertexShader: depthShader.vertexShader, uniforms: depthUniforms });
        depthMaterial.blending = THREE.NoBlending;

        // postprocessing

        var composer = new THREE.EffectComposer(renderer);
        composer.addPass(new THREE.RenderPass(this.display().scene(), camera));

        var depthTarget = new THREE.WebGLRenderTarget(this.size, this.height(), { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat });

        var effect = new THREE.ShaderPass(THREE.SSAOShader);
        effect.uniforms[ 'tDepth' ].value = depthTarget;
        effect.uniforms[ 'size' ].value.set(this.width() / 2, this.height() / 2);
        effect.uniforms[ 'cameraNear' ].value = -200;
        effect.uniforms[ 'cameraFar' ].value = 200;
        // effect.uniforms[ 'aoClamp' ].value = 0.5;
        effect.uniforms[ "lumInfluence"].value = 0.9;
        effect.material.defines = { "RGBA_DEPTH": true, "ONLY_AO_COLOR": "1.0, 0.7, 0.5" };
        effect.uniforms.onlyAO.value = 0;
        effect.renderToScreen = true;
        composer.addPass(effect);
        var effectFXAA = new THREE.ShaderPass(THREE.FXAAShader);
        //    effectFXAA.uniforms[ 'resolution' ].value.set( 2 / ( this.width() ), 2 / ( this.height() ) );

        composer.addPass(effectFXAA);

        var depthPassPlugin = new THREE.DepthPassPlugin();
        depthPassPlugin.renderTarget = depthTarget;

        renderer.addPrePlugin(depthPassPlugin);

        this.composer = composer;
    },

    init_windows: function () {
        this.STORY_HEIGHT = this.height() / this.stories;

        this.ul_anchor = this.display().ro().at(this.size / -2, this.height() / 2, this.wall_z);

        var self = this;

        var windows = function (iter) {
            var anchor = self.display().ro().at(-iter.width / 2, iter.height / 2, 0);
            iter.ro.add(anchor);
            console.log('height:', iter.height);
            var params = {
                v: self.window_sizes.v,
                h: self.window_sizes.h,
                width: iter.width,
                height: iter.height,
                anchor: anchor,
                level: 1,
                depth: 20,
                visible: true,
                next: function (window_iter) {
                    switch(window_iter.row){
                        case 1:
                            if (!(window_iter.col % 2)) {
                                self._draw_box(window_iter);
                                window_iter.ro.set('castShadow', true);
                                window_iter.ro.set('receiveShadow', true);
                            }
                            break;
                    }
                },

                make_color: function () {
                    return new THREE.Color(1, 1, 0.8)
                }

            };

            self.grid_loop(params);
        };

        var next = function (box_iter) {

            switch(box_iter.col){
                case 0:

                    switch(box_iter.row){
                        case 0:

                            break;

                        case 1:
                            break;

                        case 2:
                            break;
                    }

                    break;

                case 1:

                    switch(box_iter.row){
                        case 0:

                            break;

                        case 1:

                            var anchor = new O3.RenderObject().at(-box_iter.width / 2, box_iter.height / 2, 0);
                            box_iter.ro.add(anchor);

                            var params = {
                                width: box_iter.width,
                                height: box_iter.height,
                                v: _.map(_.range(0, self.stories), function () {
                                    return 1
                                }),
                                h: [1],
                                anchor: anchor,
                                level: 1,
                                visible: false,
                                make_color: function (iter_params) {
                                    var ch = (iter_params.row + iter_params.col) % 2;
                                    return new THREE.Color(ch, ch, ch);
                                },
                                next: Fools.pipe().add(self._draw_box.bind(self)).add(windows)
                            };
                            self.grid_loop(params);

                            break;

                        case 2:
                            break;
                    }

                    break;

                case 2:

                    switch(box_iter.row){
                        case 0:

                            break;

                        case 1:
                            break;

                        case 2:
                            break;
                    }

                    break;
            }
        };

        var next_pipe = Fools.pipe().add(this._draw_box.bind(this)).add(next);

        this.grid_loop({
            anchor: this.ul_anchor,
            h: this.margin.h,
            v: this.margin.v,
            width: this.width(),
            height: this.height(),
            level: 1,
            visible: false,
   /*         make_color: function (iter_params) {
                if (!window.CN) {
                    window.CN = 1;
                } else {
                    window.CN -= 0.05;
                }
                var c;
                if ((iter_params.col + iter_params.row) % 2) {
                    c = new THREE.Color(window.CN, 0, window.CN);
                } else {
                    c = new THREE.Color(0, window.CN, 0);
                }
                // console.log('color: ', c.getStyle());
                return c;
            },*/
            make_color: function(){
                return new THREE.Color(1, 0, 0)
            },
            next: next_pipe
        })
    },

    width: function () {
        return this.size;
    },

    _lerp3: function (a, b, ratio) {

        return [
            a[0] * (1 - ratio) + b[0] * ratio,
            a[1] * (1 - ratio) + b[1] * ratio,
            a[2] * (1 - ratio) + b[2] * ratio
        ];
    },

    grid_loop: function (params) {

        var handler = function (iter) {
            // if (iter.col != 1) return;
            var left = _ps(params.h, iter.col, params.width);
            var right = _ps(params.h, iter.col + 1, params.width);
            var width = right - left;

            var top = _ps(params.v, iter.row, params.height) - params.height;
            var bottom = _ps(params.v, iter.row + 1, params.height) - params.height;
            var height = bottom - top;

            return _.defaults({
                left: left,
                right: right,
                top: top,
                bottom: bottom,
                height: height,
                width: width
            }, params, iter);
        }.bind(this);

        if (params.next) {
            handler = Fools.pipe().add(handler).add(params.next);

        }

        Fools.loop(handler).dim('col').min(0).max(params.h.length).dim('row').min(0).max(params.v.length)();

    },

    _draw_box: function (box_iter) {

        var x = box_iter.left + box_iter.width / 2;
        var y = box_iter.top + box_iter.height / 2;
    /*    console.log('col: ', box_iter.col, 'row: ', box_iter.row,
            'x:', Math.round(x), 'y:', Math.round(y),
            'w:', Math.round(box_iter.width), 'h:', Math.round(box_iter.height),
            'l/r:', Math.round(box_iter.left), Math.round(box_iter.right),
            't/b:', Math.round(box_iter.top), Math.round(box_iter.bottom));*/

        var panel;

        if (box_iter.hasOwnProperty('visible') && (!box_iter.visible)) {
            panel = new THREE.CubeGeometry(0.0001, 0.0001, 0.0001);
        } else {
            panel = new THREE.CubeGeometry(box_iter.width, box_iter.height, box_iter.depth || 5);
        }
        var mat = new THREE.MeshPhongMaterial({color: box_iter.make_color(box_iter)});
        // console.log('mat: ', mat);
        var ro = this.display().ro().geo(panel)
            .at(x, y, 0)
            .mat(mat);

        if (!Wall.BOX_COUNT) {
            Wall.BOX_COUNT = 1;
        } else {
            ++Wall.BOX_COUNT;
        }

        ro.set({castShadow: true, receiveShadow: true, name: 'box-' + Wall.BOX_COUNT});

        if (box_iter.anchor) {
            box_iter.anchor.add(ro);
        }
        box_iter.ro = ro;
        return box_iter;
    },

    height: function () {
        return this.size * this.repeat;
    },

    init_camera: function () {
     //   var camera =
      //      this.display().camera(new THREE.OrthographicCamera(-this.width() / 2, this.width() / 2, this.height() / 2, this.height() / -2));

      //  this.ortho_camera = camera;

      //  this.display().add(new O3.RenderObject(camera).at(0, 0, 500));

        var obs_camera = new THREE.PerspectiveCamera(90, this.width()/this.height(), 10, this.width() * 4 );
        this.display().camera(obs_camera); // adding obns camera

        this.display().add(new O3.RenderObject(obs_camera, function(){
            this.rotX(Math.PI/1000);
        }).at(this.width(), 0, this.width() * 2).rotY(Math.PI/8));

        this.obs_camera = obs_camera;
    },

    init_lights: function () {

      // this.display().add(new O3.RenderObject(new THREE.HemisphereLight(this.sun_color, this.dusk_color, 0.25)).at(0, 0, 1));
        var D = this.size * this.repeat / 1.5;

        var X_NUM = 2;
        var Y_NUM = 1;

        var X_RANGE = 1 + X_NUM * 2;
        var Y_RANGE = 1 + Y_NUM * 2;
        var SUN_CONFIG = {
            intensity: 1, //Math.pow(1/(((2 * X_NUM) + 1) * ((2 * Y_NUM) + 1)  ), 1.25),
            shadowCameraFar: this.size * 8,
            shadowCameraLeft: -D, shadowCameraRight: D,
            shadowCameraTop: -D, shadowCameraBottom: D,
            shadowMapWidth: 1 * 1024, shadowMapHeight: 1 * 1024,
            shadowBias: -0.0002,
            castShadow: true, shadowCameraVisible: 0,
            shadowDarkness: 0.6
        };

        var once = true;

        Fools.loop(function (iter) {
            console.log("making light: ", iter);
            if (!once) return;
            once = false;
            // if (iter.x || iter.y){
            var light = this.display().light('sun')
            //.at(iter.x * this.width() / (8 * X_RANGE), iter.y * this.width() / (8 * Y_RANGE),  this.size/2);
            // iter.x * this.width() / (8 * X_RANGE), iter.y * this.width() / (8 * Y_RANGE),
                .at(iter.x * this.width() / (8 * X_RANGE),iter.y * this.width() / (8 * Y_RANGE),this.size);
            light.set(SUN_CONFIG);
          //  light.obj().color.set(1, 1, 1);
           // this.display().scene().add(light.obj());
            //  }
        }.bind(this)).dim('x').min(-X_NUM).max(X_NUM).dim('y').min(-Y_NUM + 1).max(Y_NUM + 1)();
        var light = new THREE.DirectionalLight();
        light.translateZ(100);
        //this.display().scene().add(light);
    },

    init_wall: function () {
        this.display().mat('wall_color', {color: this.color, type: 'MeshPhongMaterial'});
        var w = new THREE.CubeGeometry(this.width() * 1.05, this.height() * 1.02, 2);
        var wall_ro = this.display().ro().geo(w).mat('wall_color').n('wall');
        var wall_base = new O3.RenderObject(null, {name: 'wall_base'}).at(0, 0, this.wall_z);
        wall_ro.set('receiveShadow', true);
        wall_ro.set('castShadow', true);
        wall_ro.set('name', 'base wall');
        wall_base.add(wall_ro);
        this.display().add(wall_base);
    }

};

City.Wall = Wall;
