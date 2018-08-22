var GtfsRealtimeBindings = require('gtfs-realtime-bindings');
var request = require('request');

var requestSettings = {
  url : 'https://api.transport.nsw.gov.au/v1/gtfs/realtime/nswtrains',
  headers: {
    'Authorization' : 'apikey L1gvhgjWkl9kmZfEAFJdaHNXIujxA5lUrxrY'
  },
  method: 'GET',
  encoding: null
};

request(requestSettings, function (error, response, body) {
  if (!error && response.statusCode == 200) {
    var feed = GtfsRealtimeBindings.FeedMessage.decode(body);
    feed.entity.forEach(function(entity) {
      if (entity.trip_update) {
        console.log(entity.trip_update);
      }
    });
  }

});