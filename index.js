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
	response.header("Access-Control-Allow-Origin", "*");
	response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

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

		db.collection('checkins', function(error, collection) {
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


app.get('/latest.json', function(request, response) {
	//CORS enabling stuff
	response.header("Access-Control-Allow-Origin", "*");
	response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

	//get query (expected to be only a single key/value pair with the key being 'login')
	var query = url.parse(request.url).query;

	//check if the query is empty--if so, send empty JSON object
	if (query == null) {
		response.send({});
	} else {
		//split it between key and value
		var loginPair = query.split("=");
		
		//get the value from the key
		var login = loginPair[1];

		var params = false;

		//traverse the valid login list to check if the provided login is valid
		var arrWithLogin = validLogins.filter(function(x) {
			return x == login;
		});

		if (arrWithLogin == login && loginPair[0] == "login") {
			params = true;
		}

		if (params) {
			db.collection('checkins', function(error, collection) {
				collection.find({"login":login}).sort({"created_at":-1}).toArray(function(error, cursor) {
					if (!error) {
						//check if the user has checked in; if not, send empty object
						if (cursor.length == 0) {
							response.send({});
							return;
						}
						//send the first element in the array, as it should be the most recent
						response.send(cursor[0]);

					} else {
						//if the db died
						response.send({"error":"Something went terribly wrong on my end!"});
					}
				});
			});
		} else {
			//send this if the user did not provide a valid login name or valid parameters
			response.send({});
		}
	}
});

app.get('/', function(request, response) {
	//note that the response will be a html page
	response.set('Content-Type', 'text/html');
	
	//initalize string holder to hold all the html code
	var indexPage = '';
	
	//call our database and get all the documents in the checkins collection
	db.collection('checkins', function(error, collection) {
		collection.find().toArray(function(error, cursor) {
			if (!error) {
				//initialize text in indexpage: prime it for some <p> tags containing data from the documents
				indexPage += "<!DOCTYPE html><html><head><title>MapChat</title></head><body><h1>Latest check-ins:</h1>";
				
				//pass in a bunch of <p>data of document</p> based on how many there are in the collection
				var indexCheckins = '';
				for (var i = 0; i < cursor.length; i++) {
					indexCheckins = "<p><strong>" + cursor[i]["login"] + "</strong>  <strong>" +
					cursor[i]["lat"] + ", " + cursor[i]["lng"] + "</strong> on <strong>" +
					cursor[i]["created_at"] + "</strong> and wrote <strong>" + cursor[i]["message"] + "</strong>.</p>" + indexCheckins;
				}

				//append the html code so that it is proper and send it back to the requester
				indexPage += indexCheckins + "</body></html>";
				response.send(indexPage);
			} else {
				indexPage = "<!DOCTYPE html><html><head><title>MapChat</title></head><body><h1>Whoops! Something went wrong. Come back soon!</h1></body></html>";
				response.send(indexPage);
			}
		});
	});
});

//default node.js stuff
app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

//lab8 assignment
app.get('/lab8', function(request, response) {
	response.sendFile(__dirname + '/public/lab8.html');
});

app.listen(app.get('port'), function() {
	
});
