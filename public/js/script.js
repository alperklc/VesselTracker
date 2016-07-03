$(function() {
  var map = {};
  var path = [];

  $('document').ready(function(){

    $.ajax({
      type: "GET",
      url: "http://localhost:3000/api/vessel/getcoordinates",
      success: function(data){
        for(var i = 0; i<data.length; i++){
          path[i] = [data[i].lat, data[i].lng];
        }
        map = new GMaps({
          el: '#map',
          lat: data[data.length-1].lat,
          lng: data[data.length-1].lng
        });
        map.drawPolyline({
          path: path,
          strokeColor: '#131540',
          strokeOpacity: 0.6,
          strokeWeight: 6
        });
      },
      error: function(data){
        console.log(data);
      }
    });

  });

  $("#ship-locations").append('<ul id=\'test\'></ul>');
  var socket = io.connect(window.location.hostname);
  socket.on('data', function(data) {
    $('#test').append('<li>' + data.lastUpdate + '  ' + data.lat + ' * ' + data.lng + ' ' + data.speed + ' ' + data.aisStation + '</li>');
    $('#last-update').text(new Date().toTimeString());
  });

});
