var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var VesselLogSchema   = new Schema({
  lastUpdate: String,
  localTime: String,
  region: String,
  lat: Number,
  lng: Number,
  status: String,
  speed: String,
  route: String,
  aisStation: String,
});

module.exports = mongoose.model('VesselLog', VesselLogSchema);
