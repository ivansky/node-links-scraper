var request 	= require('request');
var punycode 	= require('punycode');
var querystring = require('querystring');
var crypto 		= require('crypto');
var iconv 		= require('iconv-lite');


function Linker(__domain){

	var queryInAction = 0,
		pagesCount = 0,
		pages = {
			/*
			'hash-page' : {
				'hash': 'hash-page',
				'domain': 'www.domain.com'
				'url':
			},
			'hash-page2' : {}, ... */
		},
		relations = [/*
			['hash-parent', 'hash-target', 'anchor', 'external', 'externalLink'],
			[] ... */
		],
		events = {},
		domain,
		domainUnicode,
		domains = [];

	domain = punycode.toASCII(__domain);
	domain = domain.indexOf('www.') === 0? domain.substr(4) : domain;
	domainUnicode = punycode.toUnicode(domain);
	domains = [domain, domainUnicode, 'www.'+domain];

	this.readPage = function(url, __parent, inputWeight){

		if(/\.(jpe?g|png|svg|gif|ico|tiff|bmp|zip|rar|gzip|tar|css|csv|js|cs)$/i.test(url)){
			return;
		}

		var self = this;

		var parent = __parent || false;

		var page = GeneratePage(url, parent);

		if(pages.hasOwnProperty(page.hash) && pages[page.hash].status) return;

		queryInAction++;

		pages[page.hash].status = -1;

		if(pages[page.hash].weight === 0){

			pages[page.hash].weight = inputWeight;

		}

		request({
			method: 'GET',
			uri: url,
			encoding: 'binary'
		}, function (error, response, body) {

			var pageOut = GeneratePage(response.request.uri.href);

			if(page.hash !== pageOut.hash){
				pages[page.hash].status = 301;
				pages[page.hash].redirected = pageOut.hash;
				if(pages[pageOut.hash].weight === 0) pages[pageOut.hash].weight = pages[page.hash].weight;
			}

			pages[pageOut.hash].status = response.statusCode;

			if (!error && response.statusCode == 200) {

				body = body.replace(/[\n\r\t]+/g, '');
				body = new Buffer(body, 'binary');

				if(typeof response.headers['content-type'] == 'string'){
					var charsetIndex = response.headers['content-type'].indexOf('charset=');

					if(charsetIndex > -1){
						charsetIndex += 8;

						var charset = response.headers['content-type'].substr(charsetIndex);

						body = iconv.decode(body, charset).toString();
					}
				}

				var links = FindLinks(body);

				if(links.length){

					links.forEach(function(l, k){

						while(l.href.charAt(0) == "\x20"){
							l.href = l.href.substr(1);
						}

						if(/^[a-z]+:/i.test(l.href)) return;

						if(l.href.indexOf('#') === 0) return;

						var child = GeneratePage(l.href, pageOut.url);

						relations.push([pageOut.hash, child.hash, l.contents, child.external, child.url]);

						if(!child.external){

							self.readPage('http://' + domain + child.path, pageOut.path, inputWeight * 0.5);

						}

						if(k == links.length - 1){

							queryInAction--;

							self.trigger('fetch', page);

						}

					});

				}else{

					queryInAction--;

					self.trigger('fetch', page);

				}

			}else{

				queryInAction--;

				self.trigger('fetch', page);

			}

		})

	};

	this.getDomain = function(){
		return domain;
	};

	this.getPage = function(hash){
		return pages.hasOwnProperty(hash)? pages[hash] : false;
	};

	this.getPages = function(){
		return pages;
	};

	this.getPagesCount = function(){
		return pagesCount;
	};

	this.getRelations = function(){
		return relations;
	};

	this.getRelationsCount = function(){
		return relations.length;
	};

	this.trigger = function(name, __context){

		var self = this;

		var context = __context || {};

		if(events.hasOwnProperty(name)){

			events[name].forEach(function(c){

				c.call(self, context);

			});

		}

		return this;
	};

	this.on = function(name, __c){
		var c = __c || function(){};

		if(!events.hasOwnProperty(name)){
			events[name] = [];
		}

		if(typeof c == 'function'){
			events[name].push(c);
		}

		return this;
	};

	this.ondone = function(__c){
		this.on('done', __c);
	};

	var completeTimeout = false;

	this.on('fetch', function(){
		var self = this;

		clearTimeout(completeTimeout);

		if(queryInAction === 0){
			completeTimeout = setTimeout(function(){
				self.trigger('done');
			}, 500);
		}
	});

	this.start = function(){
		this.readPage('http://' + domain + '/', null, 1);
	};

	function GeneratePage(url, __parentUrl){

		var parentUrl = __parentUrl || false;

		var match,
			urlHashIndex = url.indexOf('#'),
			compileString,
			outputObject = {
				protocol: url.indexOf('https') === 0? 'https' : 'http',
				domain: false,
				path: '',
				query : {},
				url: url,
				status: false,
				external: false,
				www: false,
				weight: 0,
				redirected: false
			};

		if(urlHashIndex > -1){
			url = url.substr(0, urlHashIndex);
		}

		if(url.indexOf('//') === 0){

			url = 'http:' + url;

		}else if (url.indexOf('/') === 0){

			url = 'http://' + domain + url;

		}else if (parentUrl && url.indexOf('http') !== 0){

			if(match = /(.+?)[^\/]*(\?.*)?$/.exec(parentUrl)){

				url = match[1] + url;

			}

		}else if(url.indexOf('http') !== 0){

			url = 'http://' + domain + '/' + url;

		}

		if(match = /^(https?:\/\/|\/\/)?([^\/]+\.[^\/]+)([^\?]*)(\?(.*))?$/.exec(url)){

			outputObject.domain = match[2];
			outputObject.path = match[3];

			if(outputObject.domain.indexOf('www.') === 0){
				outputObject.domain = outputObject.domain.substr(4);
				outputObject.www = true;
			}

			while(/\/(?!\.\.)([^\/]+)\/\.\.\//g.test(outputObject.path)){
				outputObject.path = outputObject.path.replace(/\/(?!\.\.)([^\/]+)\/\.\.\//g, function(){ return '/' });
			}

			while(outputObject.path.indexOf('/../') === 0){
				outputObject.path = outputObject.path.substr(3);
			}

			if(!outputObject.path || outputObject.path === '/'){
				outputObject.weight = 1;
			}

			if(domains.indexOf(outputObject.domain) < 0){
				outputObject.external = true;
			}

			if(typeof match[5] !== 'undefined'){
				outputObject.query = querystring.parse(match[5]);
			}

			outputObject.query = sortObjectByKeys(outputObject.query);

			outputObject.queryString = querystring.stringify(outputObject.query);

			compileString = JSON.stringify({
				domain: outputObject.domain,
				path: outputObject.path,
				query: outputObject.query
			});

			outputObject.hash = crypto.createHash('md5').update(compileString).digest('hex');

			outputObject.url = outputObject.protocol + '://' + (outputObject.www? 'www.' : '') + outputObject.domain + outputObject.path;

			if(outputObject.queryString) outputObject.url += '?' + outputObject.queryString;

			if(pages.hasOwnProperty(outputObject.hash)) return pages[outputObject.hash];

			if(!outputObject.external){
				pages[outputObject.hash] = outputObject;

				pagesCount++;
			}

			return outputObject;

		}

		return false;
	}

}


function FindLinks(content){

	var reg = /<a([^>]+)>(.*?)<\/a/gi;

	var matches = [], links = [], found;

	while (found = reg.exec(content)) {

		matches.push(found);

		var attributes = {}, foundAttributes, href = false, contents = found[2], name, value;

		var attributesRegExp = /(\s([a-z0-9\-]+)=(\'[^\'\\\\]*(?:\\\\.[^\'\\\\]*)*\'|"[^"\\\\]*(?:\\\\.[^"\\\\]*)*"))/ig;

		while (foundAttributes = attributesRegExp.exec(found[1])) {
			href = false;
			name = foundAttributes[2].toLowerCase();
			value = foundAttributes[3].substr(1, foundAttributes[3].length - 2);

			attributes[name] = value;

			attributesRegExp.lastIndex = foundAttributes.index + 1;
		}

		if(attributes.hasOwnProperty('href')) {
			links.push({
				href: attributes.href,
				contents: contents,
				attributes: attributes
			});
		}

		reg.lastIndex = found.index + 1;

	}

	return links;
}

function sortObjectByKeys(i){

	var o = {}, keys = [];

	for(var k in i)
		if(i.hasOwnProperty(k))
			keys.push(k);

	keys.sort().forEach(function(k){
		o[k] = (typeof i[k] === 'object' && i[k].constructor === Object)? sortObjectByKeys(i[k]) : i[k];
	});

	return o;
}


exports = module.exports = {

	FindLinks: FindLinks,

	sortObjectByKeys: sortObjectByKeys,

	create: function(url){

		var parsed = /^(https?:\/\/|\/\/)?([^\/]+\.[^\/]+)(.*)$/.exec(url);

		if(typeof parsed[2] == 'undefined') return false;

		return new Linker(parsed[2]);

	}

};