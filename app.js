const https = require('https');
const async = require('async');
const moment = require('moment');
const _ = require('underscore');
var gtfs = require('gtfs-realtime-bindings');
// var protobuf = require('protobufjs');

let begin_name = 'TownHallstation';
let end_name = 'Honsbystation';

stopFinder(begin_name, function(err, begin_id) {
  console.log(begin_name + ' location_id : ' + begin_id);

  stopFinder(end_name, function(err, end_id) {
    console.log(end_name + ' location_id : ' + end_id);

    var now = new Date();
    var now_date = moment().format('YYYYMMDD');
    var now_time = moment().format('HHmm');
    tripPlanner(begin_id, end_id, now_date, now_time);
  });  
});





// stop finder
// Provides capability to return all NSW public transport stop, station, wharf, points of interest and known addresses to be used for auto-suggest/auto-complete (to be used with the Trip planner and Departure board APIs).
// https://api.transport.nsw.gov.au/v1/tp/stop_finder?outputFormat=rapidJSON&type_sf=stop&name_sf=central&coordOutputFormat=EPSG%3A4326&TfNSWSF=true&version=10.2.1.42
function stopFinder(stop_name, cb) {
  let outputFormat = 'rapidJSON';
  let type_sf = 'stop';
  let name_sf = stop_name;
  let coordOutputFormat = 'EPSG:4326';
  let TfNSWDM = true;
  let version = '10.2.1.42';

  let location_id = '';
  let location_name = '';

  let path = '/v1/tp/stop_finder';
  path += '?outputFormat=' + outputFormat;
  path += '&type_sf=' + type_sf;
  path += '&name_sf=' + name_sf;
  path += '&coordOutputFormat=' + coordOutputFormat;
  path += '&TfNSWDM=' + TfNSWDM;
  path += '&version=' + version;

  const options = {
    hostname: 'api.transport.nsw.gov.au',
    port: 443,
    path: path,
    method: 'GET',
    headers: {
      'Authorization' : 'apikey L1gvhgjWkl9kmZfEAFJdaHNXIujxA5lUrxrY'
    },
    encoding : null
  };
  
  const req = https.request(options, (res) => {
    let data = '';
    
    // console.log('statusCode:', res.statusCode);
    // console.log('headers:', res.headers);
  
    // A chunk of data has been recieved.
    res.on('data', (chunk) => {
      // console.log(chunk);
      data += chunk;
    });
  
    res.on('end', () => {
      let locations = JSON.parse(data).locations;
      let base_quality = 0;
      async.forEach(locations, function(item, cb_for) {
        location_id = item.id;
        location_name = item.name;
        if ('stop' == item.type) {
          if (base_quality < item.matchQuality) {
            base_quality = item.matchQuality;
          }
        }
        
        cb_for();
      }, function() {
        // console.log('location_id : ' + location_id);
        // console.log('location_name : ' + location_name);
        cb(null, location_id);
      });
    });
  });
  
  req.on('error', (err) => {
    console.error('req.on error : ' + err);
    cb(err);
  });
  
  req.end();
}


// trip planner
// Provides capability to provide NSW public transport trip plan options, including walking and driving legs, real-time and Opal fare information.
// https://api.transport.nsw.gov.au/v1/tp/stop_finder?outputFormat=rapidJSON&type_sf=stop&name_sf=central&coordOutputFormat=EPSG%3A4326&TfNSWSF=true&version=10.2.1.42
function tripPlanner(begin_id, stop_id, date, time) {
  let outputFormat = 'rapidJSON';
  let coordOutputFormat = 'EPSG:4326';
  let depArrMacro = 'dep';    // dep or arr
  let itdDate = date;           // YYYYMMDD
  let itdTime = time;           // HHMM 24-hour format. 
  let type_origin = 'stop';
  let name_origin = begin_id;
  let type_destination = 'stop';
  let name_destination = stop_id;
  let calcNumberOfTrips = 5;
  let wheelchair = '';
  let TfNSWTR = true;
  let version = '10.2.1.42';
  

  let path = '/v1/tp/trip';
  path += '?outputFormat=' + outputFormat;
  path += '&coordOutputFormat=' + coordOutputFormat;
  path += '&depArrMacro=' + depArrMacro;
  // path += '&itdDate=' + itdDate;
  // path += '&itdTime=' + itdTime;
  path += '&type_origin=' + type_origin;
  path += '&name_origin=' + name_origin;
  path += '&type_destination=' + type_destination;
  path += '&name_destination=' + name_destination;
  path += '&calcNumberOfTrips=' + calcNumberOfTrips;
  path += '&wheelchair=' + wheelchair;
  path += '&TfNSWTR=' + TfNSWTR;
  path += '&version=' + version;

  const options = {
    hostname: 'api.transport.nsw.gov.au',
    port: 443,
    path: path,
    method: 'GET',
    headers: {
      'Authorization' : 'apikey L1gvhgjWkl9kmZfEAFJdaHNXIujxA5lUrxrY'
    },
    encoding : null
  };
  
  const req = https.request(options, (res) => {
    let data = '';
    
    // console.log('statusCode:', res.statusCode);
    // console.log('headers:', res.headers);
  
    // A chunk of data has been recieved.
    res.on('data', (chunk) => {
      // console.log(chunk);
      data += chunk;
    });
  
    res.on('end', () => {
      let journeys = JSON.parse(data).journeys;
      async.forEach(journeys, function(journey, cb_journey) {
        let legs = journey.legs;
        let fare = journey.fare;
        let totalDuration = 0;
        let summary = [];
        let legNumber = 0;

        let depart = 0;
        let arrive = 0;

        async.forEach(legs, function(leg, cb_leg) {
          totalDuration += leg.duration;
          // console.log(leg);
          if (0 == legNumber) {
            depart = leg.origin.departureTimePlanned;
          }

          if (legs.length - 1 == legNumber) {
            arrive = leg.origin.departureTimePlanned;
          }

          let routeType = leg.transportation.product.class;
          switch(routeType) {
            case 1 : summary.push('Train'); break;
            case 4 : summary.push('Light Rail'); break;
            case 5 : summary.push('Bus'); break;
            case 7 : summary.push('Coach'); break;
            case 9 : summary.push('Ferry'); break;
            case 11 : summary.push('School Bus'); break;
            case 99 : summary.push('Walk'); break;
            case 100 : summary.push('Walk'); break;
          }

          legNumber++;
          cb_leg();
        }, function() {
          let minutes = totalDuration / 60;
          console.log(moment(depart).format('YYYY-MM-DD HH:mm:ss') + ' - ' + moment(arrive).format('YYYY-MM-DD HH:mm:ss') + ' (' + minutes + ')');
          console.log(summary);
          cb_journey();  
        });
      }, function() {
      });
    });
  });
  
  req.on('error', (err) => {
    console.error('req.on error : ' + err);
  });
  
  req.end();
}


// Provides capability to provide NSW public transport departure information from a stop, station or wharf including real-time
// https://api.transport.nsw.gov.au/v1/tp/departure_mon?outputFormat=rapidJSON&coordOutputFormat=EPSG%3A4326&mode=direct&type_dm=stop&name_dm=central&itdDate=20180106&itdTime=2030&departureMonitorMacro=true&TfNSWDM=true&version=10.2.1.42'
// https://api.transport.nsw.gov.au/v1/tp/departure_mon?outputFormat=rapidJSON&coordOutputFormat=EPSG%3A4326&mode=direct&type_dm=stop&name_dm=central&departureMonitorMacro=true&TfNSWDM=true&version=10.2.1.42
function departureMon(stop_name) {
  let outputFormat = 'rapidJSON';
  let coordOutputFormat = 'EPSG:4326';
  let mode = 'direct';
  let type_dm = 'stop';
  let name_dm = stop_name;
  let nameKey_dm = '';
  let itdDate = '20180106';   // YYYYMMDD format
  let itdTime = '2030';       // HHMM 24-hour format
  let departureMonitorMacro = true;
  let TfNSWDM = true;
  let version = '10.2.1.42';

  let path = '/v1/tp/departure_mon';
  path += '?outputFormat=' + outputFormat;
  path += '&coordOutputFormat=' + coordOutputFormat;
  path += '&mode=' + mode;
  path += '&type_dm=' + type_dm;
  path += '&name_dm=' + name_dm;
  // path += '&nameKey_dm=' + nameKey_dm;
  // path += '&itdDate=' + itdDate;
  // path += '&itdTime=' + itdTime;
  path += '&departureMonitorMacro=' + departureMonitorMacro;
  path += '&TfNSWDM=' + TfNSWDM;
  path += '&version=' + version;

  const options = {
    hostname: 'api.transport.nsw.gov.au',
    port: 443,
    path: path,
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
  
    // A chunk of data has been recieved.
    res.on('data', (chunk) => {
      // console.log(chunk);
      data += chunk;
    });
  
    res.on('end', () => {
      // console.log(JSON.parse(data).stopEvents[0]);
      // console.log(JSON.parse(data));

      let count = 0;
      async.forEach(JSON.parse(data).stopEvents, function(item, cb_for) {
        if (0 == count) {
          console.log(item);
        }
        count++;
        cb_for();
      }, function() {
        console.log('count : ' + count);
      });
    });
  });
  
  req.on('error', (err) => {
    console.error('req.on error : ' + err);
  });
  
  req.end();
}