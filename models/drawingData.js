var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var RGB = new Schema ( {

	red : Number,
	green: Number,
	blue: Number,
	alpha: Number

});

var points = new Schema ({
	x : Number,
	y : Number, 
	radius : Number,
	color: {red: Number, green: Number, blue: Number, alpha: Number}
});

module.exports = mongoose.model('Circles', points);