var Utils = {
    _tile_cmp: function (t1, t2) {
        if (t1.x < t2.x) {
            return -1;
        } else if (t1.x == t2.x) {
            if (t1.z < t2.z) {
                return -1;
            } else if (t1.z == t2.z) {
                return 0;
            }
        }
        return 1;
    },
    tile_diff: function (old_roads, new_roads) {
        _.each(old_roads, function (r) {
            r.state = '';
        });

        _.each(new_roads, function (r) {
            r.state = '';
        })
        var old_roads_s = _.sortBy(old_roads, ['x', 'z']);
        var new_roads_s = _.sortBy(new_roads, ['x', 'z']);

        var util = require('util');

        while (old_roads_s.length && new_roads_s.length) {
            var old_road = old_roads_s[0];
            var new_road = new_roads_s[0];

            console.log('old: %s, new: %s', util.inspect(old_road), util.inspect(new_road));

            switch (Utils._tile_cmp (old_road, new_road)) {
                case -1:
                    console.log('old is absent');
                    old_road.state = 'absent';
                    old_roads_s.shift();
                    break;
                case 0:
                    console.log('both are old');
                    old_road.state = 'old';
                    new_road.state = 'old';
                    old_roads_s.shift();
                    new_roads_s.shift();
                    break;

                case 1:
                    console.log('new is new');
                    new_road.state = 'new';
                    new_roads_s.shift();
                    break;
            }

        }

        _.each(old_roads_s, function (r) {
            r.state = 'absent';
        });
        _.each(new_roads_s, function (r) {
            r.state = 'new';
        })
    }
};
City.Utils = Utils;