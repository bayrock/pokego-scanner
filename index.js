var async = require('async'),
    debug = require('debug')('pokego-scanner'),
    geolib = require('geolib'),
    isFunction = require('is-function'),
    pokedex = require('./pokedex.json'),
    api = require('./poke-api.js');

function secondsToString(sec) {
    var o = parseInt(sec, 10),
        n = Math.floor(o / 3600),
        i = Math.floor((o - (n * 3600)) / 60),
        t = o - (n * 3600) - (i * 60);
    if (n < 10) n = '0' + n;
    if (i < 10) i = '0' + i;
    if (t < 10) t = '0' + t;
    if (n > 0) {
        return n + ':' + i + ':' + t
    };
    return i + ':' + t
}

function createScanJob(coords, next) {
    api.createScanJob(coords, function(err, jobInfo) {
        next(err, jobInfo);
    });
}

function getJobResults(jobInfo, next) {
    var currentAttempt = 0,
        retryTimeout = 0,
        retryTimeoutIncr = 1500,
        maxRetryTimeout = 10000,
        retries = 10;

    async.forever(function(loop) {
        currentAttempt++;

        if (currentAttempt > retries) {
            return next(new api.ErrorWithType('Too many retries. Either the Pokemon servers may be unstable or offline.'));
        }

        setTimeout(function() {
            api.getJobStatus(jobInfo, function(err, json) {
                if (err) return next(err);

                if (json.jobStatus) {
                    if (json.jobStatus == 'failure' || json.jobStatus == 'unknown') {
                        next(new api.ErrorWithType('Unable to scan for pokemon. If this continues to fail then the Pokemon servers are currently unstable or offline.'));
                    } else if (json.jobStatus == 'in_progress') {
                        debug('job in progress, retry in %sms (attempt %s of %s)', retryTimeout, currentAttempt+1, retries);
                        loop(null);
                    }
                    return;
                }

                next(null, json);
            });
        }, retryTimeout);

        retryTimeout = Math.min(retryTimeout+retryTimeoutIncr, maxRetryTimeout);
    });
}

function fillPokemonInfo(currentCoords, pokemon) {
    var distance = geolib.getDistance(currentCoords, pokemon),
        despawns = pokemon.expiration_time - Math.floor(+new Date() / 1000);

    pokemon.name = pokedex[pokemon.pokemonId] || 'Unknown';
    pokemon.map = 'https://pokevision.com/#/@'+pokemon.latitude+','+pokemon.longitude;
    pokemon.image = 'https://ugc.pokevision.com/images/pokemon/'+pokemon.pokemonId+'.png';
    pokemon.distance = distance;
    pokemon.distance_str = distance+'m';
    pokemon.despawns_in = despawns;
    pokemon.despawns_in_str = secondsToString(despawns);

    return pokemon;
}

module.exports = function(coords, opts, next) {
    if (isFunction(opts)) {
        next = opts;
        opts = {};
    }

    createScanJob(coords, function(err, jobInfo) {
        if (err) return next(err);

        getJobResults(jobInfo, function(err, res) {
            if (err) return next(err);

            var foundPokemon = [];

            res.pokemon.forEach(function(p) {
                p = fillPokemonInfo(coords, p);

                // filter by distance, if given as an option
                if (opts && opts.distance && p.distance > opts.distance) {
                    return;
                }

                // filter by specific pokemon, if given as an option
                if (opts && opts.filter && opts.filter.indexOf(p.name) == -1) {
                    return;
                }

                foundPokemon.push(p);
            });

            // sort pokemon by distance
            foundPokemon.sort(function(a, b) {
                return a.distance - b.distance;
            });

            next(null, foundPokemon);
        });
    });
}
