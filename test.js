var gtfsrb = require('gtfs-realtime-bindings');
var protobuf = require('protobufjs');

var request = require('request');
  var url = 'https://api.transport.nsw.gov.au/v1/gtfs/realtime/nswtrains';
  request({
    url: url,
    headers: { 'authorization':'apikey L1gvhgjWkl9kmZfEAFJdaHNXIujxA5lUrxrY' },
    method: 'GET',
    encoding: null
  }, function (error, response, body) {
    console.log('Status', response.statusCode);
    // console.log('Headers', JSON.stringify(response.headers));
    console.log('Headers', response.headers);
    // console.log('Reponse received', body);

    // 1: If I use this line, I get "Illegal argument: Not a valid base64 encoded string"
    var feed = gtfsrb.FeedMessage.decode(body);
	
    // 2: If I use this line, I get "Illegal wire type of unknown field 1242 in Message"
    // var feed = gtfsrb.FeedMessage.decode(new Buffer(body, 'base64'));
	
	  
    // 3: If I use protobufjs, I still get "Illegal wire type for unknown field 1242 in Message .transit_realtime.FeedMessage#decode". I have tried both 2011 and 2015 versions of the proto files.
    // var transit = protobuf.loadProtoFile("gtfs-realtime.proto").build("transit_realtime");
    // var feed = transit.FeedMessage.decode(body);
    
    // console.log(feed);
});
