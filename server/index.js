var express = require('express');
var cors = require('cors');
var pg = require('pg');
var argv = require('optimist').argv;
var geojson2osm = require('geojson2osm');
var _ = require('underscore');
var fs = require('fs');
var client = new pg.Client(
	"postgres://" + (argv.pguser || 'postgres') +
	":" + (argv.pgpassword || '1234') +
	"@" + (argv.pghost || 'localhost') +
	"/" + (argv.pgdatabase || 'dbgrid')
);
var url = "http://" + (argv.dbhost || 'localhost') + ":3019/";
console.log('Running on: ' + url);
var client = new pg.Client(client);
var app = express();
app.use(cors());
client.connect(function(err) {
	if (err) {
		return console.error('could not connect to postgres', err);
	}
});
app.get('/:id', function(req, res) {
	var id = req.params.id;
	var json = {
		"type": "FeatureCollection",
		"features": []
	};
	var query = {
		text: "select node_id , ST_AsGeoJSON(ST_EXPAND(geom,0.001)) as geom from point where st_within(geom,(select grid.geom from grid where gid=$1));",
		values: [id]
	};
	client.query(query, function(error, result) {
		if (error) {
			res.statusCode = 404;
			return res.send('Error 404: No quote found');
		} else {
			try {
				for (var i = 0; i < result.rows.length; i++) {
					var poly = {
						"type": "Feature",
						"properties": {},
						"geometry": {}
					};
					poly.geometry = JSON.parse(result.rows[i].geom);
					poly.properties['node_id'] = parseInt(result.rows[i].node_id);
					json.features.push(poly);
				}
				res.json(json);
			} catch (e) {
				console.log("entering catch block2");
			}
		}
	});
});
app.listen(process.env.PORT || 3019);