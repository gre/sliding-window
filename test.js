var assert = require("assert");

var SlidingWindow = require("./index");

var coll, allocations, frees;

function reset () {
  coll = [];
  allocations = [];
  frees = [];
}

var extraArg;

function numberSort (a, b) {
  return a > b ? 1 : -1;
}

function range (from, to) {
  var t = [];
  while (from <= to) t.push(from++);
  return t;
}

function alloc (i, a) {
  assert.equal(this.getChunkByIndex(i), undefined);
  assert.equal(coll.indexOf(i), -1);
  allocations.push(i);
  coll.push(i);
  coll.sort(numberSort);
  assert.equal(extraArg, a);
  return "foo="+i;
}

function free (i, value, a) {
  frees.push(i);
  assert.equal("foo="+i, value);
  assert.equal(this.getChunkByIndex(i), value);
  var c = coll.indexOf(i);
  if (c !== -1) coll.splice(c, 1);
  coll.sort(numberSort);
  assert.equal(extraArg, a);
}


(function(){
  reset();

  var a = SlidingWindow(alloc, free, {
    chunkSize: 100,
    right: 3,
    left: 2,
    bounds: [ 0, +Infinity ]
  });

  assert.equal(coll.length, 0);

  a.move(0);
  assert.deepEqual(coll, range(0, 3));

  a.move(150);
  assert.deepEqual(coll, range(0, 4));

  a.move(350, extraArg = 42);
  assert.deepEqual(coll, range(1, 6));
  extraArg = undefined;

  a.move([0, 350]);
  assert.deepEqual(coll, range(0, 6));

  a.move([500, 990], extraArg = "foo");
  assert.deepEqual(coll, range(3, 12));
  extraArg = undefined;

  assert.equal(a.getChunk(111), undefined);

  assert.equal(a.getChunk(511), "foo=5");

  assert.equal(a.getChunkByIndex(5), "foo=5");

  assert.equal(a.reverseIndex(5), 500);

  a.move([101, 111]);
  assert.deepEqual(coll, range(0, 4));

  a.move(5200);
  assert.deepEqual(coll, range(50, 55));

  assert.equal(allocations.indexOf(30), -1);

  a.move(0);
  assert.deepEqual(coll, range(0, 3));

  assert.equal(a.chunkIndex(111), 1);

  a.destroy();

  assert.deepEqual(coll, []);

  assert.equal(allocations.length, 27);
  assert.equal(frees.length, 27);

}());

(function(){
  reset();

  var a = SlidingWindow(alloc, free, {
    chunkSize: 500,
    right: 2,
    left: 2
  });

  var windows = [
    [ 0, range(-2, 2) ],
    [ 501, range(-1, 3) ],
    [ [501, 1888], range(-1, 5) ],
    [ [-1501, 1501], range(-6, 5) ],
    [ 10000, range(18, 22) ]
  ];

  var scenario = [];
  for (var i=0; i<500; ++i) {
    scenario.push(windows[~~(windows.length * Math.random())]);
  }

  scenario.forEach(function (w) {
    a.move(w[0]);
    assert.deepEqual(coll, w[1]);
  });

  assert.equal(allocations.indexOf(10), -1);

  // Check for move input errors
  assert.throws(function () { a.move(); }, Error);
  assert.throws(function () { a.move(null); }, Error);
  assert.throws(function () { a.move(NaN); }, Error);
  assert.throws(function () { a.move(""); }, Error);
  assert.throws(function () { a.move([]); }, Error);
  assert.throws(function () { a.move([1]); }, Error);
  assert.throws(function () { a.move([1,NaN]); }, Error);
  assert.throws(function () { a.move([null,0]); }, Error);
  assert.throws(function () { a.move([-Infinity,0]); }, Error);
  assert.throws(function () { a.move([1,0]); }, Error);

  a.destroy(extraArg = "foo");
}());

console.log("All tests passed.");
