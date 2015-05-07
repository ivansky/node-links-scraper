var assert = require('assert'),
	webring = require(__dirname + '/../');

var FindLinks = webring.FindLinks;
var sortObjectByKeys = webring.sortObjectByKeys;

var testFindLinksHTML = "<html>" +
	"<head>" +
	"</head>" +
	"<body>" +
	"<a alt=\"some alt\" href='some/url/test/1' title=\"Some title Test 1\">Anchor 1</a>" +
	"<div>" +
	"<p><a title=\"Haven't href\">Morbi</a> id <a href=\"other/link\" id=\"ipsum_test_id\">iaculis ipsum</a>, " +
	"eget ultricies est. <a>Praesent gravida mi nibh</a>, tristique molestie justo gravida non.</p>" +
	"</div>" +
	"</body>" +
	"</html>";

var testFindLinksResult = [
	{
		href: 'some/url/test/1',
		contents: 'Anchor 1',
		attributes: {
			alt:'some alt',
			href:'some/url/test/1',
			title:'Some title Test 1'
		}
	},
	{
		href: 'other/link',
		contents: 'iaculis ipsum',
		attributes: {
			href:'other/link',
			id:'ipsum_test_id'
		}
	}
];

var testSortObject = {
	y: 'ipsum',
	w: {c:3,b:2,a:1},
	a: true,
	z: {
		b: 'test b',
		z: {
			z: 'last of the last',
			a: 'first of the last',
			b: 'second'
		},
		a: [3,1,2],
		c: false
	},
	q: 'lorem'
};
var testSortObjectExpected = {
	a: true,
	q: 'lorem',
	w: {a:1,b:2,c:3},
	y: 'ipsum',
	z: {
		a: [3,1,2],
		b: 'test b',
		c: false,
		z: {
			a: 'first of the last',
			b: 'second',
			z: 'last of the last'
		}
	}
};

describe("Generic main tests", function() {

	it("Find Links", function(){

		var result = FindLinks(testFindLinksHTML);

		assert.deepEqual(result, testFindLinksResult);

	});

	it("Sorting Object By Keys", function(){

		var result = sortObjectByKeys(testSortObject);

		assert.deepEqual(result, testSortObjectExpected);

	});

});