## pokego-scanner

Node package for scanning Pokemon in Pokemon GO.

No authentication with PTC or Google is required at this time.

This project is not endorsed in by Nintendo or Niantic in any way; use it at your own risk.

### Usage

#### From NodeJS

```
$ npm install pokego-scanner
```

```js
var pokegoScan = require('pokego-scanner');

var coords = {
    latitude: 40.4164737,
    longitude: -3.7042757
};

// obtain an array of pokemon close to the given coordinates
pokegoScan(coords, function(err, pokemon) {
    if (err) throw err;
    console.log(pokemon);
});

/* returns:
[ { id: '23578871',
    data: '[]',
    expiration_time: 1469133198,
    pokemonId: '56',
    latitude: 40.41668174482,
    longitude: -3.7048426265191,
    uid: '0d422880aed:23',
    is_alive: true,
    name: 'Mankey',
    map: 'https://pokevision.com/#/@40.41668174482,-3.7048426265191',
    image: 'https://ugc.pokevision.com/images/pokemon/56.png',
    distance: 53,
    distance_str: '53m',
    despawns_in: 603,
    despawns_in_str: '10:03' },
  ... ]
*/

// filter by max distance
pokegoScan(coords, {distance: 100}, function(err, pokemon) {
    if (err) throw err;
    console.log(pokemon);
});

// filter by specific pokemon
pokegoScan(coords, {filter: ["Zubat", "Pidgey"]}, function(err, pokemon) {
    if (err) throw err;
    console.log(pokemon);
});

```

#### From the console
```
$ npm install -g pokego-scanner
$ pokego-scanner --lat=40.4164737 --lng=-3.7042757
```

##### Optional flags:
```
$ pokego-scanner --lat=40.4164737 --lng=-3.7042757 --distance 100 --pokemon Pidgey
```

### Debugging

Some debugging info can be shown through the [debug](https://www.npmjs.com/package/debug) package. To enable it, use the namespace `pokego-scanner`:

```
$ DEBUG=pokego-scanner pokego-scanner -- 40.4164737,-3.7042757
  pokego-scanner https://pokevision.com/map/scan/40.4164737/-3.7042757 +0ms
  pokego-scanner { status: 'success', jobId: '1f6df38141ceaa194703b22830f0e80f' } +293ms
  pokego-scanner https://pokevision.com/map/data/40.4164737/-3.7042757/1f6df38141ceaa194703b22830f0e80f +15ms
  pokego-scanner { status: 'success', jobStatus: 'in_progress' } +183ms
  pokego-scanner job in progress, retry in 1500ms (attempt 2 of 10) +0ms
  pokego-scanner https://pokevision.com/map/data/40.4164737/-3.7042757/1f6df38141ceaa194703b22830f0e80f +2s
  pokego-scanner { status: 'success', jobStatus: 'in_progress' } +194ms
  pokego-scanner job in progress, retry in 3000ms (attempt 3 of 10) +1ms
  pokego-scanner https://pokevision.com/map/data/40.4164737/-3.7042757/1f6df38141ceaa194703b22830f0e80f +3s
  pokego-scanner { status: 'success', pokemon: [ { id: '24192555', ... }, ... ] } +224ms
[ { id: '24703530',
    data: '[]',
    expiration_time: 1469134868,
    pokemonId: '16',
    latitude: 40.416268962029,
    longitude: -3.7053183409618,
    uid: '0d42287efab:21',
    is_alive: true,
    name: 'Pidgey',
    map: 'https://pokevision.com/#/@40.416268962029,-3.7053183409618',
    image: 'https://ugc.pokevision.com/images/pokemon/16.png',
    distance: 91,
    distance_str: '91m',
    despawns_in: 597,
    despawns_in_str: '09:57' },
  ... ]
```
