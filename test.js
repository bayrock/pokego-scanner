var tape = require('tape'),
    nock = require('nock'),
    pokegoScan = require('./index.js');

var coords = {
    latitude: 40.4164737,
    longitude: -3.7042757
};

function scanUrl(coords) {
    return '/map/scan/'+coords.latitude+'/'+coords.longitude;
}

function dataUrl(coords, jobId) {
    return '/map/data/'+coords.latitude+'/'+coords.longitude+'/'+jobId;
}

// example pokemon returned from the api, a Sandshrew
var pokemonData = {
    id: 25681381,
    data: '[]',
    expiration_time: 1469369892,
    pokemonId: 27,
    latitude: 40.416599270797,
    longitude: -3.6924756202826,
    uid: '0d42289ccc3:27',
    is_alive: true
};

tape('successful scan', function(t) {
    // mock api calls to pokevision.com
    var api = nock('https://pokevision.com')
        .get(scanUrl(coords))
        .reply(200, function(uri) { return {status: 'success', jobId: 'job1234'}; })
        .get(dataUrl(coords, 'job1234'))
        .reply(200, function(uri) { return {status: 'success', jobStatus: 'in_progress'}; })
        .get(dataUrl(coords, 'job1234'))
        .reply(200, function(uri) { return {status: 'success', pokemon: [pokemonData]}; });

    pokegoScan(coords, function(err, pokemon) {
        t.equals(null, err);
        t.equals(1, pokemon.length);
        t.equals('Sandshrew', pokemon[0].name);
        t.end();
    });
});

tape('failed scan', function(t) {
    // mock api calls to pokevision.com
    var api = nock('https://pokevision.com')
        .get(scanUrl(coords))
        .reply(200, function(uri) { return {status: 'success', jobId: 'job1234'}; })
        .get(dataUrl(coords, 'job1234'))
        .reply(200, function(uri) { return {status: 'success', jobStatus: 'in_progress'}; })
        .get(dataUrl(coords, 'job1234'))
        .reply(200, function(uri) { return {status: 'success', jobStatus: 'in_progress'}; })
        .get(dataUrl(coords, 'job1234'))
        .reply(200, function(uri) { return {status: 'success', jobStatus: 'failure'}; });

    pokegoScan(coords, function(err, pokemon) {
        t.equal(err && err.message, 'Unable to scan for pokemon. If this continues to fail then the Pokemon servers are currently unstable or offline.');
        t.end();
    });
});

tape('scan throttle response', function(t) {
    var api = nock('https://pokevision.com')
        .get(scanUrl(coords))
        .reply(200, function(uri) { return {status: 'error', message: '{scan-throttle}'}; });

    pokegoScan(coords, function(err) {
        t.equal(err && err.message, 'You already scanned recently.');
        t.end();
    });
});

tape('maintenance html response', function(t) {
    var api = nock('https://pokevision.com')
        .get(scanUrl(coords))
        .reply(200, function(uri) {
            // not the actual response from the api, but still html with the word 'Maintenance' somewhere in it
            return '<html><h1>Maintenance</h1><p>API is undergoing maintenance.</p></html>';
        });

    pokegoScan(coords, function(err) {
        t.equal(err && err.message, 'API is undergoing maintenance. Everything should be completed shortly.');
        t.end();
    });
});

tape('scanning invalid coordinates', function(t) {
    var invalidCoords = {
        latitude: 90.447068,
        longitude: 7.939427
    };

    var api = nock('https://pokevision.com')
        .get(scanUrl(invalidCoords))
        .reply(200, function(uri) {
            return '<html><h2>Oh no!</h2><p>An unknown error occured, and that\'s all we know.</p></html>';
        });

    // Using invalid coordinates only returns a generic error response
    pokegoScan(invalidCoords, function(err) {
        t.equal(err && err.message, 'Unknown response received from API.');
        t.end();
    });
});
