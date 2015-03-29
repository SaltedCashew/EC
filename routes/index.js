var express = require('express'),
    apicache = require('apicache');

var request = require('request');

var router = express.Router();

var cache = apicache.middleware;

router.get('/api/stops', cache('1 day'), function(req, res, next) {
    request('https://tfe-opendata.com/api/v1/stops', function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log("success!");
            res.json(JSON.parse(body)["stops"]);
        }
    });
});

router.get('/api/services', cache('1 day'), function(req, res, next) {
    request('https://tfe-opendata.com/api/v1/services', function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log("success!");
            res.json(JSON.parse(body));
        }
    });
});

router.get('/api/timetable/:stop_id', cache('1 day'), function(req, res, next) {
    var stopID = req.params.stop_id; // e.g., http://localhost:3000/api/timetable/36232897
    request('https://tfe-opendata.com/api/v1/timetables/'+stopID, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log("success!");
            res.json(JSON.parse(body));
        }
    });
});

router.get('/api/journeys/:service_name', cache('1 day'), function(req, res, next) {
    var busNumber = req.params.service_name; // e.g., http://localhost:3000/api/journeys/1
    request('https://tfe-opendata.com/api/v1/journeys/'+busNumber, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log("success!");
            res.json(JSON.parse(body));
        }
    });
});

router.get('/api/status', cache('1 minute'), function(req, res, next) {
    request('https://tfe-opendata.com/api/v1/status', function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log("success!");
            res.json(JSON.parse(body));
        }
    });
});

router.get('/api/vehicle_locations', cache('15 seconds'), function(req, res, next) {
    request('https://tfe-opendata.com/api/v1/vehicle_locations', function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log("success!");
            res.json(JSON.parse(body));
        }
    });
});

// POST collection/id
// app.post('/api/:collection/:id?', function(req, res, next) {
//   // update model
//   apicache.clear(req.params.collection);
//   res.send(200);
// });

module.exports = router;
