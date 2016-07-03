/**
* Module dependencies.
*/
var express = require('express')
, logger = require('morgan')
, bodyParser = require('body-parser')
, io = require('socket.io')(1025)
, http = require('http')
, _ = require('underscore')
, path = require('path')
, request = require('request')
, cheerio = require('cheerio')
, async = require('async')
, mongoose = require('mongoose')
, once = require('once');

//Create an express app
var app = express();

//Create the HTTP server with the express app as an argument
var server = http.createServer(app);

//Generic Express setup
app.set('port', process.env.PORT || 3000);

// connection to the database
//mongoose.connect('localhost:27017/gemiNerede');
var mongo_url = process.env.OPENSHIFT_MONGODB_DB_URL;
mongoose.connect(mongo_url);

var vess = require('./routes/vessel');
app.use('/api/vessel', vess);


app.set('views', __dirname + '/views');
app.use(require('stylus').middleware(__dirname + '/public'));
app.use(express.static(path.join(__dirname, 'public')));
app.use("/public", express.static(__dirname + '/public'));
app.use('/bower_components', express.static(path.join(__dirname, 'bower_components')));

//Our only route! Render it with the current watchList
app.get('/', function(req, res) {
  //res.render('public/index', { data: watchList });
  res.sendFile(path.join(__dirname + '/public/index.html'));
});

//Start a Socket.IO listen
var sockets = io.listen(server);
var VesselLog = require('./models/vesselLog');

//fetch latest db entry on startup
VesselLog.find().sort('-_id').limit(1).exec(function(err, data){
  console.log(data);
  latestVesselData = data[0];
});

var minutes = 0.25;
var receivedVesselData = {}, latestVesselData = {};

//If the client just connected, give them fresh data!
sockets.sockets.on('connection', function(socket) {
  if(latestVesselData.changed){
    socket.emit('data', latestVesselData);
    latestVesselData.changed = false;
  }
});

  setInterval(function(socket){
    async.series([
      function getVesselData(callback){
        request('http://www.marinetraffic.com/tr/ais/details/ships/shipid:288391/mmsi:249343000/imo:9477490/vessel:ATLANTIK_MIRACLE/_:a04624e2fbd61089fcc0464de641f7d7', function (error, response, body) {
          var $ = {};
          if (!error && response.statusCode == 200) {
            $ = cheerio.load(body);
            var vesselData = $('strong').map(function(i, el) {
              el=$(el).text();
              return el;
            }).get();

            if (error) return callback(error);

            if(vesselData.length === 0){
              return calllback(0);
            } else {
              receivedVesselData = {
                "lastUpdate": vesselData[4].split(/[()]/)[1],
                "localTime": vesselData[5],
                "region": vesselData[6],
                "lat": vesselData[7].split(' / ')[0].slice(0, -1),
                "lng": vesselData[7].split(' / ')[1].slice(0, -1),
                "status": vesselData[8],
                "speed": vesselData[9].split(' / ')[0],
                "route": vesselData[9].split(' / ')[1],
                "aisStation": vesselData[10]
              };
              callback();
            }
          }
        });
      }, once(function storeData(callback){

        if(latestVesselData === undefined || latestVesselData === null){
            latestVesselData = receivedVesselData;
        }
        else{
          if((receivedVesselData.lat != latestVesselData.lat)||(receivedVesselData.lng != latestVesselData.lng)){
            latestVesselData = receivedVesselData;
            latestVesselData.changed = true;

            var vesselLog = new VesselLog();		// create a new instance of the VesselLog model
            vesselLog.lastUpdate = latestVesselData.lastUpdate;
            vesselLog.localTime = latestVesselData.localTime;
            vesselLog.region = latestVesselData.region;
            vesselLog.lat = latestVesselData.lat;
            vesselLog.lng = latestVesselData.lng;
            vesselLog.status = latestVesselData.status;
            vesselLog.speed = latestVesselData.speed;
            vesselLog.route = latestVesselData.route;
            vesselLog.aisStation = latestVesselData.aisStation;

            vesselLog.save(function(err) {
              if (err)
              console.log(err);
            });
          }
        }
      })], function(err){

      });

    }, minutes * 60 * 1000);



// START THE SERVER!
var server_port = process.env.OPENSHIFT_NODEJS_PORT || 8080;
var server_ip_address = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';

server.listen(server_port, server_ip_address, function () {
  console.log( "Listening on " + server_ip_address + ", port " + server_port );
});
