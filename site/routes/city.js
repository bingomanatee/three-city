
var fs = require('fs');
var path = require('path');
var buildings_folder = path.resolve(__dirname, './../public/3d/buildings');
/*
 * Routes for finding and adding building templates.
 */
module.exports = {

    'index': function (req, res) {
        res.render('city')

    }

};