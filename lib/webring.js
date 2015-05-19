'use strict';

var request 	= require('request');
var punycode 	= require('punycode');
var querystring = require('querystring');
var crypto 		= require('crypto');
var iconv 		= require('iconv-lite');
var util 		= require('util');
var events 		= require('events');

events.EventEmitter.prototype.trigger = events.EventEmitter.prototype.emit;

function Linker(__domain){
	this.__domain = punycode.toASCII(__domain);
	this.__domain = this.__domain.indexOf('www.') === 0? this.__domain.substr(4) : this.__domain;
	this.__domainUnicode = punycode.toUnicode(this.__domain);
	this.__domainsAvailable = [this.__domain, this.__domainUnicode, 'www.'+this.__domain];
	this.__relations = [];
	this.__pages = {};
	this.__pagesCount = 0;
	this.__queryInAction = 0;
	this.__completeTimeout = false;
	events.EventEmitter.call(this);
}

util.inherits(Linker, events.EventEmitter);

Linker.prototype.readPage = function(url, __parent, inputWeight){

	if(/\.(jpe?g|png|svg|gif|ico|tiff|bmp|zip|rar|gzip|tar|css|csv|js|cs)$/i.test(url)){
		return;
	}

	var self = this;

	var parent = __parent || false;

	var page = self.addPage(url, parent);

	if(!page || (self.__pages.hasOwnProperty(page.hash) && self.__pages[page.hash].status)) return;

	self.__queryInAction++;

	self.__pages[page.hash].status = -1;

	if(self.__pages[page.hash].weight === 0){

		self.__pages[page.hash].weight = inputWeight;

	}

	request({
		method: 'GET',
		uri: url,
		encoding: 'binary'
	}, function (error, response, body) {

		var pageOut = self.addPage(response.request.uri.href);

		if(page.hash !== pageOut.hash){
			self.__pages[page.hash].status = 301;
			self.__pages[page.hash].redirected = pageOut.hash;

			if(self.__pages[pageOut.hash].weight === 0){
				self.__pages[pageOut.hash].weight = self.__pages[page.hash].weight;
			}
		}

		self.__pages[pageOut.hash].status = response.statusCode;

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

			var links = self.findLinks(body);

			if(links && links.length){

				links.forEach(function(l, k){

					var isLast = (k == links.length - 1);

					while(l.href.charAt(0) == "\x20"){
						l.href = l.href.substr(1);
					}

					if(/^[a-z]+:/i.test(l.href) || l.href.indexOf('#') === 0){
						if(isLast){
							self.__queryInAction--;
							self.emit('fetch', page);
						}
						return;
					}

					var child = self.addPage(l.href, pageOut.url);

					self.__relations.push([pageOut.hash, child.hash, l.contents, child.external, child.url]);

					if(!child.external){

						self.readPage('http://' + self.__domain + child.path, pageOut.path, inputWeight * 0.5);

					}

					if(isLast){

						self.__queryInAction--;

						self.emit('fetch', page);

					}

				});

			}else{

				self.__queryInAction--;

				self.emit('fetch', page);

			}

		}else{

			self.__queryInAction--;

			self.emit('fetch', page);

		}

	})

};

Linker.prototype.findLinks = function(content){

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
};

Linker.prototype.addPage = function(url, __parentUrl){

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

		url = 'http://' + this.__domain + url;

	}else if (parentUrl && url.indexOf('http') !== 0){

		if(match = /(.+?)[^\/]*(\?.*)?$/.exec(parentUrl)){

			url = match[1] + url;

		}

	}else if(url.indexOf('http') !== 0){

		url = 'http://' + this.__domain + '/' + url;

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

		if(this.__domainsAvailable.indexOf(outputObject.domain) < 0){
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

		if(this.__pages.hasOwnProperty(outputObject.hash)) return this.__pages[outputObject.hash];

		if(!outputObject.external){
			this.__pages[outputObject.hash] = outputObject;

			this.__pagesCount++;
		}

		return outputObject;

	}

	return false;
};

Linker.prototype.getDomain = function(){
	return this.__domain;
};

Linker.prototype.getPage = function(hash){
	return this.__pages.hasOwnProperty(hash)? this.__pages[hash] : false;
};

Linker.prototype.getPages = function(){
	return this.__pages;
};

Linker.prototype.getPagesCount = function(){
	return this.__pagesCount;
};

Linker.prototype.getRelations = function(){
	return this.__relations;
};

Linker.prototype.getRelationsCount = function(){
	return this.getRelations().length;
};

Linker.prototype.start = function(){

	this.on('fetch', function(){
		var self = this;

		clearTimeout(this.__completeTimeout);

		if(this.__queryInAction === 0){
			this.__completeTimeout = setTimeout(function(){
				self.emit('done');
			}, 500);
		}
	});

	this.readPage('http://' + this.getDomain() + '/', null, 1);
};

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

module.exports = exports = {
	linker : Linker,
	findLinks : Linker.prototype.findLinks,
	sortObjectByKeys : sortObjectByKeys,
	create: function(url){
		var parsed = /^(https?:\/\/|\/\/)?([^\/]+\.[^\/]+)(.*)$/.exec(url);

		if(typeof parsed[2] == 'undefined') return false;

		return new Linker(parsed[2]);
	}
};