var express = require('express');
var model = require('./model.js');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/initgame', function(req, res, next) {
  model.initGame(function(err, data) {
    if (err) {
      res.jsonp({'err': err});
    } else {
      res.jsonp(data);
    }
  });
});

router.get('/guess', function(req, res, next) {
  if (!req.query) {
    res.jsonp({'err': 'no params given.'});
    return;
  }
  model.guess(req.query.guess, req.query.key, function(err, data) {
    if (err) {
      res.jsonp({'err': err});
    } else {
      res.jsonp(data);
    }
  });
});

module.exports = router;
