## Webring

[![NPM Version][npm-image]][npm-url]
[![Node Version][node-version-image]][node-url]

Webring calculation module for [node](http://nodejs.org).

less dependencies = more stability

## Installation

```bash
$ npm install webring
```

## Example
```js
var webring = require('webring');

var linker = webring.create('http://www.domain.com/');

linker.on('fetch', function(page){
    console.log(page);
    /*
    { 
      domain: 'domain.com',
      path: '/some_page.html',
      query: {},
      status: 200,
      external: false,
      www: false,
      weight: 0.5,
      hash: '919eb087ed2a9d16bca7ce6db457cea5',
      redirected: false // or redirect target key-hash page
    }
    */
});

linker.on('done', function(){ // or .ondone(callback)
    console.log('well done');
});

linker.start();
```

## License

[MIT](LICENSE)

[npm-image]: https://img.shields.io/npm/v/webring.svg
[npm-url]: https://npmjs.org/package/webring
[node-url]: https://nodejs.org/
[node-version-image]: https://img.shields.io/node/v/webring.svg