var assert = require("assert");

var SlidingWindow = require("./index");

var coll = [];

var extraArg;

function numberSort (a, b) {
  return a > b ? 1 : -1;
};

function range (from, to) {
  var t = [];
  while (from <= to) {
    t.push(from++);
  }
  return t;
}

var a = SlidingWindow(
  function (i, a) {
    console.log("alloc", i);
    coll.push(i);
    coll.sort(numberSort);
    assert.equal(extraArg, a);
    return "foo="+i;
  },
  function (i, value, a) {
    assert.equal("foo="+i, value);
    console.log("free", i);
    var c = coll.indexOf(i);
    if (c !== -1) coll.splice(c, 1);
    coll.sort(numberSort);
    assert.equal(extraArg, a);
  },
  100,
  3,
  2,
  0
);

assert.equal(coll.length, 0);

a.sync(0);
assert.deepEqual(coll, range(0, 3));

a.sync(150);
assert.deepEqual(coll, range(0, 4));

a.sync(350, extraArg = 42);
assert.deepEqual(coll, range(1, 6));

/* // FIXME going back is not yet supported.
a.sync([0, 350]);
assert.deepEqual(coll, range(0, 6));
*/


a.sync([500, 990], extraArg = "foo");
assert.deepEqual(coll, range(3, 12));

assert.equal(a.chunkIndexForX(111), 1);

assert.equal(a.getChunkForX(111), undefined);
assert.equal(a.getChunkForX(511), "foo=5");

console.log(coll);
