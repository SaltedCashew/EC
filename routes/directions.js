var express = require('express');
var request = require('request');

var router = express.Router();

router.get('/:locStart/:locFinish/:date/:time_mode', function(req, res, next) {
    // http://localhost:3000/directions/55.961236,-3.186641/55.958775,-3.183715/1420631207/LeaveAfter
    var loc_start = req.params.loc_start;
    var loc_finish = req.params.loc_finish;
    var date = req.params.date;
    var time_mode = req.params.time_mode;

    request('https://tfe-opendata.com/api/v1/directions/?start='+loc_start+'&finish='+loc_finish+'&date='+date+'&time_mode='+time_mode, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log("success!");
            res.json(JSON.parse(body));
        }
    });
});
router.get('/time/:locStart/:locFinish', function(req, res, next) {
    // http://localhost:3000/directions/time/55.961236,-3.186641/55.958775,-3.183715
    var loc_start = req.params.locStart;
    var loc_finish = req.params.locFinish;

    request('https://maps.googleapis.com/maps/api/directions/json?origin=' + loc_start + '&destination=' + loc_finish + '&mode=walking&key=AIzaSyAkAmuPTUzfsLsKVg4DUEQ4vFl89u_qNDk', function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log("success!");
            res.json(JSON.parse(body));
        }
    });
});

module.exports = router;
