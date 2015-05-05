var request 	= require('request');
var punycode 	= require('punycode');
var querystring = require('querystring');


function Linker(__domain){

	var pages = {
			/*
			 'hash-page' : {
			 'domain': 'www.domain.com'
			 'url':
			 },
			 'hash-page2' : {}, ... */
		},
		relations = [/*
			['hash-parent', 'hash-target', 'anchor', 'external'],
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

	this.readPage = function(url, __parent){

		var parent = __parent || false;

		if(/^(https?:\/\/|\/\/)?([^\/]+\.[^\/]+)(.*)$/.exec(url)){

		}else{

		}

		request('http://www.google.com', function (error, response, body) {

			p.status = response.statusCode;

			if (!error && response.statusCode == 200) {

				var links = findLinks(body);

				if(count(links)){



				}

			}

		})

	};

	this.getDomain = function(){
		return domain;
	};

	this.getPageByURL = function(url){
		var hash = GenerateURLHash(url);

		if(hash && pages.hasOwnProperty(hash)){
			return pages[hash];
		}

		return new Page(url);
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

	this.start = function(){

	};

	function GeneratePage(url, __parentUrl){

		var parentUrl = __parentUrl || false;

		var match,
			domain,
			outputObject = {
				domain: false,
				path: '',
				query : {}
			};

		if(url.indexOf('//') === 0){
			url = 'http:' + url;
		}else if (url.indexOf('/') === 0){
			url = 'http://' + domain + url;
		}else if (url.indexOf('http') !== 0){
			match = /(.+?)[^\/]+(\?.*)?$/.exec(__parentUrl);
			url =
		}

		if(match = /^(https?:\/\/|\/\/)?([^\/]+\.[^\/]+)([^\?]*)(\?(.*))?$/.exec(url)){

			outputObject.domain = match[2];
			outputObject.path = match[3];

			if(typeof match[5] !== 'undefined'){
				outputObject.query = querystring.parse(match[5]);
			}

		}

		return url;
	}

}


function FindLinks(content){

	var reg = /<a([^>]+)>(.*?)<\/a/gi;

	var matches = [], links = [], found;

	while (found = reg.exec(content)) {

		matches.push(found);

		var attributes = {}, foundAttributes, href = false, contents = found[2];

		var attributesRegExp = /(\s([a-z0-9\-]+)=(\'[^\'\\\\]*(?:\\\\.[^\'\\\\]*)*\'|"[^"\\\\]*(?:\\\\.[^"\\\\]*)*"))/ig;

		while (foundAttributes = attributesRegExp.exec(found[1])) {

			var name = foundAttributes[2].toLowerCase();
			var value = foundAttributes[3].substr(1, foundAttributes[3].length - 2);

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

	create: function(url){

		var parsed = /^(https?:\/\/|\/\/)?([^\/]+\.[^\/]+)(.*)$/.exec(url);

		if(typeof parsed[2] == 'undefined') return false;

		return new Linker(parsed[2]);

	}

};