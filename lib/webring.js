var request = require('request');
//var _ 		= require('lodash');

function Linker(__domain){

	var pages = {};

	var events = {};

	var domain = __domain;

	function Link(u, a, l){
	
		var parent = false;
		var target = false;

		this.url = u || '';
		this.anchor = a || '';
		this.external = false;

		this.setParent = function(p){
			if(typeof p == 'object' && p instanceof Page){
				parent = p;
			}else if(typeof p == 'string' && p.length > 0){
				
			}
		};

		this.setTarget = function(p){
			if(typeof p == 'object' && p instanceof Page){
				target = p;
			}
		};

		this.getParent = function(){
			return parent;
		};

		this.getTarget = function(){
			return target;
		};

	}

	function Page(u){
		this.url = u;
		this.domain = false;
		this.external = false;
		this.hash = GenerateURLHash(this.url);
		this.links = {
			incoming: [],
			outcoming: []
		};
		
		this.addLink = function(l){
			this.links.outcoming.push(l.setParent(this));
			return l;
		};
	}

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

	}

}

function GenerateURLHash(url){
	return url;
}

function findLinks(content){

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


exports = {

	create: function(url){

		var parsed = /^(https?:\/\/|\/\/)?([^\/]+\.[^\/]+)(.*)$/.exec(url);

		if(typeof parsed[2] == 'undefined') return false;

		return new Linker(parsed[2]);

	}

};