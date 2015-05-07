## Webring
[![NPM Version][npm-image]][npm-url][![Node Version][node-version-image]][node-url][![Build Status][travis-image]][travis-url]

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
    // this.getPages(); - all pages
    // this.getRelations(); - relations between pages

    console.log('well done');
});

linker.start();
```

## Dependencies
* iconv-lite
* request

## License

[MIT](LICENSE)

[npm-image]: https://img.shields.io/npm/v/webring.svg?style=flat-square
[npm-url]: https://npmjs.org/package/webring
[node-url]: https://nodejs.org/
[node-version-image]: https://img.shields.io/node/v/webring.svg?style=flat-square
[travis-image]: https://img.shields.io/travis/ivansky/node-webring.svg?style=flat-square
[travis-url]: https://travis-ci.org/ivansky/node-webring