exports = module.exports = (function Page(u){

	this.correct = false;

	if(typeof u !== 'string') return;

	var parsed = /^(https?:\/\/|\/\/)?([^\/]+\.[^\/]+)(.*)$/.exec(u);

	this.url = u.toLowerCase();

	this.status = false;

	this.domain = parsed[2];

	this.external = false;

	this.redirected = false;

	this.hash = GenerateURLHash(this.url);

	this.links = {
		incoming: [],
		outcoming: []
	};

	this.setParent = function(){

	};

	this.addLink = function(l){
		this.links.outcoming.push(l.setParent(this));
		return l;
	};

	this.addIncomingLink = function(l){
		this.links.incoming.push(l.setParent(this));
		return l;
	};

	this.correct = true;
});