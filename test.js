var assert = require("assert");

var SlidingWindow = require("./index");

var coll = [];

var extraArg;

function numberSort (a, b) {
  return a > b ? 1 : -1;
}

function range (from, to) {
  var t = [];
  while (from <= to) {
    t.push(from++);
  }
  return t;
}

var a = SlidingWindow(
  function (i, a) {
    console.log("alloc", i, a);
    coll.push(i);
    coll.sort(numberSort);
    assert.equal(extraArg, a);
    return "foo="+i;
  },
  function (i, value, a) {
    assert.equal("foo="+i, value);
    console.log("free", i, a);
    var c = coll.indexOf(i);
    if (c !== -1) coll.splice(c, 1);
    coll.sort(numberSort);
    assert.equal(extraArg, a);
  }, {
    chunkSize: 100,
    ahead: 3,
    behind: 2,
    initialPosition: 0
  }
);

assert.equal(coll.length, 0);

a.move(0);
assert.deepEqual(coll, range(0, 3));

a.move(150);
assert.deepEqual(coll, range(0, 4));

/*
a.move(350, extraArg = 42);
assert.deepEqual(coll, range(1, 6));
*/

a.move([0, 350]);
assert.deepEqual(coll, range(0, 6));

a.move([500, 990], extraArg = "foo");
assert.deepEqual(coll, range(3, 12));

assert.equal(a.chunkIndex(111), 1);

assert.equal(a.getChunk(111), undefined);
assert.equal(a.getChunk(511), "foo=5");
assert.equal(a.getChunkByIndex(5), "foo=5");
assert.equal(a.reverseIndex(5), 500);

console.log(coll);
