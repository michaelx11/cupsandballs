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
      res.status(404).send(err);
    } else {
      res.send(data);
    }
  });
});

router.get('/guess', function(req, res, next) {
  if (!req.query) {
    res.status(404).send('no params given.');
    return;
  }
  model.guess(req.query.guess, req.query.key, function(err, data) {
    if (err) {
      res.status(404).send(err);
    } else {
      res.send(data);
    }
  });
});

module.exports = router;
