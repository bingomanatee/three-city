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
        h: [2, 5, 3],
        v: [4, 1, 4, 1, 4, 1, 4, 1, 4, 1, 4, 1, 4]
    };

    this.margin = {
        h: [1, 5, 1], // relative to a single window, the left and right margins.
        v: [1, 10, 0]    // relative to a single story: top height margin, story height, bottom margin (typically 0).
    };

    this.window_frame = {
        h_proportions: [1, 12, 1],
        v_proportions: [1, 20, 1],
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

Wall.prototype = {

    windows: function(){
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

        this.display().add(new O3.RenderObject(new THREE.AxisHelper(this.size / 4)));
        var cube = new THREE.Mesh(new THREE.CubeGeometry(this.size / 8, this.size / 8, this.size / 8), new THREE.MeshLambertMaterial({color: O3.util.rgb(0.8, 0.8, 0.8)}));
        cube.castShadow = true;

        // this.display().add(new O3.RenderObject(cube).at(0, 0, this.wall_z));

        this.display().renderer().shadowMapEnabled = true;
        this.init_windows();
    },

    init_windows: function () {
        this.STORY_HEIGHT = this.height() / this.stories;

        this.TOP_MARGIN = _p(this.margin.h, 0, this.STORY_HEIGHT);
        this.BOTTOM_MARGIN = _p(this.margin.h, 2, this.STORY_HEIGHT);
        this.REAL_HEIGHT = this.height() - (this.TOP_MARGIN + this.BOTTOM_MARGIN);
        this.REAL_STORY_HEIGHT = this.REAL_HEIGHT / this.stories; // the height of each story, adjusted for margins.

        this.WINDOW_TOP = _p(this.window_sizes.h, 0, this.REAL_STORY_HEIGHT);
        this.WINDOW_BOTTOM = _p(this.window_sizes.h, 2, this.REAL_STORY_HEIGHT);
        this.WINDOW_HEIGHT = _p(this.window_sizes.h, 1, this.REAL_STORY_HEIGHT);
        this.WINDOW_WIDTH = this.size / this.windows();
        this.WINDOW_LEFT_MARGIN = _p(this.margin.h, 0, this.WINDOW_WIDTH);
        this.WINDOW_RIGHT_MARGIN = _p(this.margin.h, 2, this.WINDOW_WIDTH);
        this.REAL_WINDOW_WIDTH = (this.size - (this.WINDOW_LEFT_MARGIN + this.WINDOW_RIGHT_MARGIN)); // the width of the entire bank of windows
        this.REAL_EACH_WINDOW_WIDTH = this.REAL_WINDOW_WIDTH / this.windows();


        Fools.loop(function(iterator){
            var center_x = iterator.window * this.REAL_EACH_WINDOW_WIDTH; // left edge of window;
            center_x -= this.WINDOW_LEFT_MARGIN - this.WINDOW_RIGHT_MARGIN; // adjsted to difference of margins -- typiclaly 0
            center_x -= this.size/2; // adgusted to size of building
            center_x += this.REAL_EACH_WINDOW_WIDTH /2; // adjusted to center of window

            var center_y = iterator.stories * this.REAL_STORY_HEIGHT;
            center_y -= this.WINDOW_TOP - this.WINDOW_BOTTOM;
            center_y -= this.height()/2; // adjusted to size of building
            center_y += this.WINDOW_HEIGHT /2; // adjuusted to center of window

            var window = new THREE.CubeGeometry(this.REAL_EACH_WINDOW_WIDTH, this.WINDOW_HEIGHT, 5);
            var name = 'window_' + iterator.window + '_story_' + iterator.story;
            if (Math.random() > this.window_color.lit_percent){
                this.display().add(new O3.RenderObject(new THREE.Mesh(window, this.display().mat('window lit').obj()), {name: name}));
            } else {
                this.display().add(new O3.RenderObject(new THREE.Mesh(window, this.display().mat('window unlit').obj()), {name: name}));
            }

        }.bind(this)).dim('story').min(0).max(this.stories).dim('window').min(0).max(this.windows())();

    },

    height: function () {
        return this.size * this.repeat;
    },

    init_camera: function () {
        var camera =
            this.display().camera(new THREE.OrthographicCamera(-this.size / 2, this.size / 2, this.height() / 2, this.height() / -2));

        this.display().add(new O3.RenderObject(camera).at(0, 0, 500));
    },

    init_lights: function () {

        this.display().add(new O3.RenderObject(new THREE.HemisphereLight(this.sun_color, this.dusk_color, 1.25)));

        var sun = new O3.RenderObject('sun light', {name: 'sun'}).at(-this.size / 4, this.size / 3, this.size / 1.25);
        sun.obj().castShadow = true;
        var D = this.size * this.repeat / 1.5;
        _.extend(sun.obj(), {
            shadowCameraLeft: -D, intensity: 0.75, shadowCameraRight: D, shadowCameraTop: -D, shadowCameraBottom: D, shadowBias: -0.001,
            castShadow: true, shadowCameraVisible: true, shadowMapWidth: 1024, shadowMapHeight: 1024});
        this.display().add(sun);

    },

    init_wall: function () {
        var w = new THREE.PlaneGeometry(this.size * 1.05, this.size * this.repeat * 1.02, 10, 10);
        var wc = this.display().mat('wall_color', {color: this.color, type: 'MeshBasicMaterial'});
        var wm = new THREE.Mesh(w, wc.obj());
        wm.receiveShadow = true;
        var wall_ro = new O3.RenderObject(wm, function () {
            //   this.obj().rotateX(Math.PI/1000);
            //  console.log(Math.round(100 * this.obj().rotation.x / Math.PI));
        });
        wall_ro.obj().rotateX(0);
        var wall_base = new O3.RenderObject(null, {name: 'wall_base'}).at(0, 0, this.wall_z);
        wall_base.add(wall_ro);
        this.display().add(wall_base);
    }

};

City.Wall = Wall;
