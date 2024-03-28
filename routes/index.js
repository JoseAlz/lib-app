var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  // res.render('index', {title: 'working?', messages: {
  //   user: 'Billy',
  //   text: 'Is this working?',
  // }});
  res.redirect('/catalog');
});

module.exports = router;
