var SlidingWindow = require("./");
var Benchmark = require("benchmark");

var suite = new Benchmark.Suite();

function noop () {}

var a = new SlidingWindow(noop, noop);
a.move([ 1000, 1100 ]);

suite
.add('SlidingWindow: 100 allocs / 100 frees', function() {
  var slidingWindow = new SlidingWindow(noop, noop);
  slidingWindow.move([ 5000, 5100 ]);
  slidingWindow.move(0);
  slidingWindow.destroy();
})
.add('SlidingWindow.getChunk: 100 calls', function() {
  for (var i=1000; i<1100; ++i)
    a.getChunk(i);
})
// add listeners
.on('cycle', function(event) {
  console.log(String(event.target));
})
// run async
.run();
