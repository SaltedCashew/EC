var express = require('express'),
    apicache = require('apicache'),
    fs = require('fs');

var router = express.Router();

var cache = apicache.middleware;

/* GET home page. */
router.get('/api/stops', cache('1 hour'), function(req, res, next) {
  var content = JSON.parse(fs.readFileSync('data/stops.json'));
  res.json(content);
});

// POST collection/id
// app.post('/api/:collection/:id?', function(req, res, next) {
//   // update model
//   apicache.clear(req.params.collection);
//   res.send(200);
// });

// router.get('/', function(req, res) {

//     res.send('Hello World!');
// });

module.exports = router;
