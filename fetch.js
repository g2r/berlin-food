/**
 * fetch data from fousquare
 */

/**
 * @typedef {array} ll
 * @prop {number} 0 lat
 * @prop {number} 0 lng
 */

/**
 * @typedef {object} geojson
 * @see http://geojson.org/geojson-spec.html
 */

var program = require('commander'),
    packagejson = require('./package.json'),
    csv = require('to-csv'),
    turf = require('turf'),
    Promise = require('bluebird'),
    EXPLORE_URL = 'https://api.foursquare.com/v2/venues/explore?ll=40.7,-74&client_id=CLIENT_ID&client_secret=CLIENT_SECRET',
    url = require('url'),
    request = Promise.promisify(require('request'));

program
    .version(packagejson.version)
    .option('-r, --radius [number]', 'Radius km', Number, 1)
    .description('fetch data from fousquare');
program.parse(process.argv);

var CLIENT_ID = '3S4FSCICKVNFXZ2EUKRV0LIL3TS3B1JMEOXTSEVNSE1KAFWU',
    CLIENT_SECRET = 'OA1332ZZRT33OMPEML3U42QDIQX4NBDGLZG2PWHGGYBNIKKV',
    centerLl = [52.516667, 13.383333],
    radius = program.radius * 1000;//m


var axis1 = [];
var axis2 = [];

/**
 * get line geojson
 * @param {ll[]} coordinates
 * @return {geojson} coordinates
 */
function getLineByCoords(coordinates) {
    return {
        type: 'Feature',
        geometry: {
            type: 'LineString',
            coordinates: coordinates
        }
    };
}

/**
 * @param {array<{ll}>} collection
 * @param {geojson} line
 * @param {number} radius m
 * @param {number} distance m
 */
function walk(collection, line, radius, distance) {
    distance = distance || 0;
    distance += 250;
    var along = turf.along(line, distance / 1000, 'kilometers');
    collection.push(along.geometry.coordinates);
    if (distance < radius) {
        walk(collection, line, radius, distance);
    }
}

walk(axis1, getLineByCoords([centerLl, [centerLl[0], 0]]), radius);
walk(axis1, getLineByCoords([centerLl, [centerLl[0], 90]]), radius);
walk(axis2, getLineByCoords([centerLl, [0, centerLl[1]]]), radius);
walk(axis2, getLineByCoords([centerLl, [90, centerLl[1]]]), radius);

var net = [];
axis1.forEach(function (ll) {
    var lng = ll[1];
    axis2.forEach(function (ll) {
        var lat = ll[0];
        net.push([lat, lng]);
    });
});

/**
 * format foursquare url
 * @param {ll} ll
 * @returns {string} url
 */
function formatUrl(ll) {
    var urlObj = url.parse(EXPLORE_URL, true);
    urlObj.query.ll = ll.join();
    urlObj.query.client_id = CLIENT_ID;
    urlObj.query.client_secret = CLIENT_SECRET;
    urlObj.query.section = 'food';
    urlObj.query.limit = 50;
    urlObj.query.radius = 250;
    urlObj.query.v = '20150820';
    delete urlObj.search;
    return url.format(urlObj);
}

/**
 * fetch data at the point
 * @param {ll} ll
 */
function fetch(ll) {
    var reqUrl = formatUrl(ll);
    request(reqUrl).then(function (res) {
        var result = JSON.parse(res[0].body);
        console.log([].concat.apply([], result.response.groups.map(function (group) {
            return group.items;
        })).map(function (item) {
            return item.venue;
        }));
    }).done();
}

fetch(net[0]);
