var express = require('express'),
    apicache = require('apicache'),
    fs = require('fs');

var request = require('request');

var router = express.Router();

var cache = apicache.middleware;

/* GET home page. */
// router.get('/api/stops', cache('1 hour'), function(req, res, next) {
//   var content = JSON.parse(fs.readFileSync('data/stops.json'));
//   res.json(content);
// });

router.get('/api/stops', cache('5 minutes'), function(req, res, next) {
    request('https://tfe-opendata.com/api/v1/stops', function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log("success!");// Print the google web page.
            res.json(JSON.parse(body));
        }
    });
});

router.get('/api/services', cache('5 minutes'), function(req, res, next) {
    request('https://tfe-opendata.com/api/v1/services', function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log("success!");// Print the google web page.
            res.json(JSON.parse(body));
        }
    });
});

router.get('/api/timetable/:stop_id', cache('5 minutes'), function(req, res, next) {
    var stopID = req.params.stop_id; // e.g., http://localhost:3000/api/timetable/36232897
    request('https://tfe-opendata.com/api/v1/timetables/'+stopID, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log("success!");// Print the google web page.
            res.json(JSON.parse(body));
        }
    });
});

router.get('/api/journeys/:service_name', cache('5 minutes'), function(req, res, next) {
    var busNumber = String(req.params.service_name); // e.g., http://localhost:3000/api/journeys/1
    request('https://tfe-opendata.com/api/v1/timetables/'+busNumber, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log("success!");// Print the google web page.
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
