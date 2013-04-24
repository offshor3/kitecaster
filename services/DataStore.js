var redis = require('redis')
  , nconf = require('nconf')
  , crypto = require('crypto')
  , winston = require('winston')
  , ParseObject = require('kaiseki')
  , Parse = require('parse-api').Parse;

var app = module.exports.records = {};
var base = module.exports;

app.results = {}

/**
 * Modules does a check into the LocalStore, if not there, hits DataStore, if found, saves to LocalStore
 * @note Added alias 'find()' for 'getCurrent()' (falls more inline with save())
 */
app.find = app.getCurrent = function(db, key, callback) {
	var parseApp = new Parse(nconf.get('parse:appId'), nconf.get('parse:master'));
	var client = redis.createClient();
	client.on("error", function(err) {
		console.log("error event - " + client.host + ":" + client.port + " - " + err);
	});
	
	// console.log('app-find', key);
	
	var found = false;
	// generate a Hash Key for Lookups
	if (typeof key != 'string') {
		var hashkey = JSON.stringify(db) + JSON.stringify(key);
	} else {
		var hashkey = JSON.stringify(db) + key;
	}
	var hashkey = crypto.createHash("md5").update(hashkey).digest("hex");
	client.get(hashkey, function(err, reply) {
		if (reply) {
			app.results = JSON.parse(reply);
			var found = true;
		}
		if (!found) {
			if (key == "*") {
				parseApp.find(db, '', function(err, response){
					//client.set(hashKey, JSON.stringify(app.results));
					app.results = response;
					callback(app.results);
				});
			} else {
				// try and hit the DB
				parseApp.find(db, key, function (err, response) {
					app.results = response;
					client.set(hashkey, JSON.stringify(app.results));
					callback(app.results);
				});
			}
		} else {
			client.quit();
			callback(app.results);
		}
	});
}

/**
 * App.Object()
 * @param db		string
 * @param query		mixed
 * @param callback	method
 */
app.object = function(db, query, callback) {
	var parseApp = new ParseObject(nconf.get('parse:appId'), nconf.get('parse:restKey'));

	// abstract logic to base()
	/**
	var client = redis.createClient();
	client.on("error", function(err) {
		console.log("error event - " + client.host + ":" + client.port + " - " + err);
	});
	**/
	try {
		parseApp.getObjects(db, query, function(err, response, body, success) {
			if (err) {
				throw Error("An error occured: ", JSON.stringify(err));
			} else {
				app.results = response;
				callback(err, response, body, success);
			}
		});
	} catch (e) {
		console.log("An unexpected error occurred: ", JSON.stringify(e));
	}
};

/**
 * App.ObjectUpdate()
 */
app.objectupdate = function(db, objectId, query, callback) {

	try {
		var parseApp = new ParseObject(nconf.get('parse:appId'), nconf.get('parse:restKey'));

		if (!objectId) {
			throw Error("ObjectID is required to Update Object in Parse.com. Please use object()/find() before using objectupdate().");
		}

		var client = redis.createClient();
		client.on("error", function(err) {
			console.log("error event - " + client.host + ":" + client.port + " - " + err);
		});

		parseApp.updateObject(db, objectId, query, function(err, res, body, success) {			
			if (typeof body.error != 'undefined') {
				logger.debug("Parse.com responded with an error, ", JSON.stringify(body.error));
				return false;
			}
			callback(err, res, body, success);
			
			// @todo - include Redis back into here
			//var redis_key = base.createkey(db, query);
			//var redisKey = 'spot:id:' + spot.spotId;
			//client.del(redis_key, function(error, reply) {
			//	logger.debug('stale key deleted: ' + redis_key);
			//});
		});
	} catch (e) {
		console.log("An unexpected error occured: " + JSON.stringify(e));
	}
}

app.createobject = function(db, object, callback) {
	try {
		var parseApp = new ParseObject(nconf.get('parse:appId'), nconf.get('parse:restKey'));
		var rediskey = "spot:id:counter";

		var client = redis.createClient();
		client.on("error", function(err) {
			console.log("error event - " + client.host + ":" + client.port + " - " + err);
		});

		client.incr(rediskey, function(err, replies) {
			object.spotId = replies;
			parseApp.createObject(db, object, function(err, res, body, success) {
				callback(err, res, body, success);
			});
		});
	} catch (e) {
		console.log("An unexpected error occured: " + JSON.stringify(e));
	}
};

/**
 * App.Create()
 * Handles creating new objects in the Parse Store()
 * @usage app.create('Profiles', {'session_id':'session_id, 'field1':'key1'}, function(err, response){});
 */
app.create = function(db, data, callback) {
	var logger = new (winston.Logger)({
		transports: [
			new winston.transports.Console({timestamp:true})
			//new winston.transports.File({ timestamp:true, filename: '/var/logs/kitecaster/server.log' })
		],
		exceptionHandlers: [
			new winston.transports.Console({timestamp:true})
			//new winston.transports.File({ timestamp:true, filename: '/var/logs/kitecaster/server-exceptions.log' })
		]
	});

	var parseApp = new Parse(nconf.get('parse:appId'), nconf.get('parse:master'));
	var client = redis.createClient();
	client.on("error", function(err) {
		console.log("error event - " + client.host + ":" + client.port + " - " + err);
	});
	try {
		parseApp.insert(db, data, function(err, response) {
			logger.debug("insert result");
			logger.debug(err);
			logger.debug(JSON.stringify(response));
			callback(err, response);
		});
	} catch (e) {
		logger.debug(e);
		return false;		
	}
};

/**
 * App.Save()
 * Handles creating and/or updating records in the Parse Store
 * @usage app.save('profiles', {"session_id":session_id}, {"field1":"field_value"}, function(err, response){});
 * @todo Include a save to local Redis Datastore (prevent 1 more hit to remote Db)
 */
app.save = function(db, key, data, callback) {
	var logger = new (winston.Logger)({
		transports: [
			new winston.transports.Console({timestamp:true})
			//new winston.transports.File({ timestamp:true, filename: '/var/logs/kitecaster/server.log' })
		],
		exceptionHandlers: [
			new winston.transports.Console({timestamp:true})
			//new winston.transports.File({ timestamp:true, filename: '/var/logs/kitecaster/server-exceptions.log' })
		]
	});

	var parseApp = new Parse(nconf.get('parse:appId'), nconf.get('parse:master'));
	var client = redis.createClient();
	client.on("error", function(err) {
		console.log("error event - " + client.host + ":" + client.port + " - " + err);
	});
	try {
		parseApp.find(db, key, function (err, response) {
			if (response) {
				var id = response.objectId;
				parseApp.update(db, id, data, function (err, response) {
					logger.debug("update result");
					logger.debug(err);
					logger.debug(JSON.stringify(response));
					callback(err, response);
				});
			} else {
				parseApp.insert(db, data, function(err, response) {
					logger.debug("insert result");
					logger.debug(err);
					logger.debug(JSON.stringify(response));
					callback(err, response);
				});			
			}
		});
	} catch (e) {
		logger.debug(e);
		return false;
	}
	callback();
}

/**
 * Base.createkey()
 */
base.createkey = function(db, key) {
	var hashkey = JSON.stringify(db) + JSON.stringify(key);
	var hashkey = crypto.createHash("md5").update(hashkey).digest("hex");
	return hashkey;
}

/**
 * Base Level Method
 * Handles setting an object to Redis
 */
base.setobject = function(db, object) {

	var client = redis.createClient();
	client.on("error", function(err) {
		console.log("error event - " + client.host + ":" + client.port + " - " + err);
	});

	// generate a Hash Key for Lookups
	var hashkey = JSON.stringify(db) + JSON.stringify(object);
	var hashkey = crypto.createHash("md5").update(hashkey).digest("hex");	

	// set expiration time for Redis (default to 60 seconds)
	var expiration_time = nconf.get("redis:expireTime") || 60;

	var diff, date_end, date_start;

	client.set(key, JSON.stringify(object), function(err, replies) {            
		date_end = new Date().getUTCMilliseconds();
		diff = date_end - date_start;
		client.expire(key, expiration_time, function (err, replies) {
			console.log('expire set for ' + key + ' to ' + expiration_time + ' seconds.');
		});
	});
}

/**
 * Base.CreateGeoPoint()
 * handles transforming data from lat/long strings into GeoPoint dataType
 * @note - move this to a better place
 */
base.creategeopoint = function(data) {
   data.location = {
       __type: 'GeoPoint',
       // we make sure we're sending numbers not strings
       latitude: parseFloat(data.lat),
       longitude: parseFloat(data.lon)
    };
	// remove unnecessary lat/lon since it was converted to GeoPoint
	if (typeof data.lat != 'undefined') delete data.lat;
	if (typeof data.lon != 'undefined') delete data.lon;
	return data;
}