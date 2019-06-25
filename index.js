var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var url = require('url');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var mongoUri = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost:27017/test';
var MongoClient = require('mongodb').MongoClient, format = require('util').format;
var db = MongoClient.connect(mongoUri, function(error, databaseConnection) {
	db = databaseConnection;
});

app.post('/rides', function(request, response) {
	response.header('Access-Control-Allow-Origin', '*');
	response.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

	var username = request.body.username;
	var lat = request.body.lat;
	var lng = request.body.lng;
	var created_at = request.body.created_at;
	
	var params = false;

	if (username != undefined && lat != undefined && lng != undefined) {
		params = true;
	}

	if (params) {
		var toInsert = {
			"username": username,
			"lat": lat,
			"lng": lng,
		};

		db.collection('requests', function(error, collection) {
			var id = collection.insert(toInsert, function(error, saved) {
				if (error) {
					response.send(500);
				}
				else {	
					collection.find().toArray(function(error, cursor) {
						response.send(cursor);
					});	
				}
			});
		});
	} 
	else {
		response.send({"error":"Whoops, something is wrong with your data!"});
	}
});

