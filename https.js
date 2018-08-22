const https = require('https');
var GtfsRealtimeBindings = require('gtfs-realtime-bindings');
// var protobuf = require('protobufjs');

// https://api.transport.nsw.gov.au/v1/gtfs/realtime/nswtrains
const options = {
  hostname: 'api.transport.nsw.gov.au',
  port: 443,
  path: '/v1/gtfs/realtime/nswtrains',
  method: 'GET',
  headers: {
    'Authorization' : 'apikey L1gvhgjWkl9kmZfEAFJdaHNXIujxA5lUrxrY'
  },
  encoding : null
};

const req = https.request(options, (res) => {
  let data = '';

  console.log('statusCode:', res.statusCode);
  // console.log('headers:', res.headers);
  // console.log('headers:', res.headers.content-type);

  // A chunk of data has been recieved.
  res.on('data', (chunk) => {
    // console.log(chunk);
    // data += chunk;
    data = GtfsRealtimeBindings.FeedMessage.decode(chunk);
    console.log(data);
  });

  res.on('end', () => {
    // var feed = GtfsRealtimeBindings.FeedMessage.decode(body);
    // console.log(data);
    // console.log(JSON.parse(data));
  });
});

req.on('error', (err) => {
  console.error('req.on error : ' + err);
});

req.end();