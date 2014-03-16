
var fs = require('fs');
var path = require('path');
var buildings_folder = path.resolve(__dirname, './../public/3d/buildings');
/*
 * Routes for finding and adding building templates.
 */
module.exports = {

    'index': function (req, res) {

        fs.readdir(buildings_folder, function(err, files){
            if (err) throw err;
            var buildings = [];

            files.forEach(function(file){
                if (/\.json$/.test(file)){
                    buildings.push({filename: file, name: file.replace(/\.json$/, '')})
                }
            });

            res.render('buildings', {
                buildings: buildings
            });
        })

    },

    'new': function (req, res) {
      res.render('buildings/new', {});
    },

    'create': function (req, res) {

        var name = req.param('name');

        console.log('creating %s', name);
        var building = {name: name};

        fs.writeFile(path.resolve(buildings_folder, name + '.json'), JSON.stringify(building), function(){

            res.redirect('/buildings')
        })

    }

};