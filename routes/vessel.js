var express    = require('express');
var router = express.Router();
var Vess = require('../models/vesselLog');

router.get('/getCoordinates', function(req, res){
	Vess.find({}, { "lat" : true, "lng": true },function(err, data){
		if (err)
			res.send(err);

		res.json(data);
	});
});

module.exports = router;
