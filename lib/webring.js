var request = require('request');

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
	}

	this.setTarget = function(p){
		if(typeof p == 'object' && p instanceof Page){
			target = p;
		}
	}

	this.getParent = function(){
		return parent;
	}

	this.getTarget = function(){
		return target;
	}

}

function Page(u){
	this.url = u;
	this.hash = GenerateURLHash(this.url);
	this.links = [];

	this.addLink = function(l){
		this.links.push(l.setParent(this));
		return l;
	};
}

function Linker(__domain){

	var pages = {};

	var events = {};

	var domain = __domain;

	this.getDomain = function(){
		return domain;
	}

	this.isPageExists = function(url){
		var hash = GenerateURLHash(url);

		return (hash && pages.hasOwnProperty(hash));
	}

	this.getPageByURL = function(url){
		var hash = GenerateURLHash(url);

		if(hash && pages.hasOwnProperty(hash)){
			return pages[hash];
		}

		return false;
	}

	this.trigger = function(name, __context){

		var self = this;

		var context = __context || {};

		if(events.hasOwnProperty(name)){

			events[name].forEach(function(c){

				c.call(self, context);

			});

		}

		return this;
	}

	this.on = function(name, __c){
		var c = __c || function(){};

		if(!events.hasOwnProperty(name)){
			events[name] = [];
		}

		if(typeof c == 'function'){
			events[name].push(c);
		}

		return this;
	}

	this.ondone = function(__c){
		this.on('done', __c);
	};

	this.start = function(){

	}

}

function GenerateURLHash(url){
	return url;
}

exports = {

	create: function(url){

		var parsed = /^(https?:\/\/|\/\/)?([^\/]+\.[^\/]+)(.*)$/.exec(url);

		if(typeof parsed[2] == 'undefined') return false;

		return new Linker(parsed[2]);

	}

};