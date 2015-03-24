var express = require('express');
var cors = require('cors');
var pg = require('pg');
var argv = require('optimist').argv;
var geojson2osm = require('geojson2osm');
var _ = require('underscore');
var bodyParser = require('body-parser');
var fs = require('fs');
var client = new pg.Client(
	"postgres://" + (argv.pguser || 'postgres') +
	":" + (argv.pgpassword || '1234') +
	"@" + (argv.pghost || 'localhost') +
	"/" + (argv.pgdatabase || 'dbunconnected')
);
var url = "http://" + (argv.dbhost || 'localhost') + ":3019/";
console.log('Running on: ' + url);
var client = new pg.Client(client);
var app = express();
app.use(cors());

app.use(bodyParser.urlencoded({
	extended: true
}));
//app.use(express.bodyParser());


client.connect(function(err) {
	if (err) {
		return console.error('could not connect to postgres', err);
	}
});

app.get('/', function(req, res) {
	var json = {
		"type": "FeatureCollection",
		"features": []
	};
	var query = {
		text: "SELECT gid , num FROM grid where status=$1",
		values: [true]
	};
	client.query(query, function(error, result) {
		if (error) {
			res.statusCode = 404;
			return res.send('Error 404: No quote found');
		} else {
			for (var i = 0; i < result.rows.length; i++) {
				var poly = {};
				// poly['num'] = result.rows[i].num;
				// poly['gid'] = result.rows[i].gid;
				json.features.push(result.rows[i].gid);
			}
			res.json(json);
		}
	});
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


app.post('/endpoint', function(req, res) {
	var obj = {};
	var gid = JSON.parse(_.keys(req.body)[0]);
	var query = {
		text: 'UPDATE grid   SET status =true WHERE gid =$1;',
		values: [gid.gid]
	};
	client.query(query, function(err, result) {
		if (err) {
			console.log("error en insertar" + err);
		} else {
			res.send(gid);
		}

	});
});



app.listen(process.env.PORT || 3019);