
/**
 * chunkSize: the size of each chunk in the sliding window
 * alloc: the alloc function called to alloc a chunk
 * free: the free function called to free a chunk
 * nbAhead: the number of chunks to keep ahead
 * nbBehind: the numbers of chunks to keep behind
 * initialPosition: the initial chunk position. If not provided, the first call to sync will define it.
 */
function SlidingWindow (alloc, free, chunkSize, nbAhead, nbBehind, initialPosition) {
  this.chunkSize = chunkSize;
  this.alloc = alloc;
  this.free = free;
  this.nbAhead = nbAhead || 0;
  this.nbBehind = nbBehind || 0;

  this.chunks = {};

  if (isNaN(initialPosition)) {
    this.currentAlloc = null;
    this.currentFree = null;
  }
  else {
    this.currentAlloc = this.currentFree = initialPosition;
  }
}

SlidingWindow.prototype = {
  /**
   * Sync the window for a given value or a [xhead, xtail] range.
   *
   * This must be called everytime you want to check/update the SlidingWindow
   * args get pass-in as secondary arguments to free and alloc functions.
   */
  sync: function (x, args) {
    var xtail, xhead;
    if (x instanceof Array) {
      xtail = x[0];
      xhead = x[1];
      if (isNaN(xtail)) throw new Error("xtail is not a number: "+[xtail,xhead]);
      if (isNaN(xhead)) throw new Error("xhead is not a number: "+[xtail,xhead]);
      if (xtail > xhead) throw new Error("xtail shouldn't be greater than xhead");
    }
    else if (!isNaN(x)) {
      xtail = x;
      xhead = x;
    }
    else {
      throw new Error("x is required and must be an array");
    }

    if (this.currentAlloc === null) {
      this.currentFree = this.currentAlloc = ~~(xtail/this.chunkSize);
    }

    var headChunk = ~~(xhead / this.chunkSize + 1);
    var aheadChunk = headChunk + this.nbAhead;
    while (aheadChunk > this.currentAlloc) {
      var i = this.currentAlloc;
      this.chunks[i] = this.alloc(i, args);
      this.currentAlloc ++;
    }

    var tailChunk = ~~(xtail / this.chunkSize);
    var behindChunk = tailChunk - this.nbBehind;
    while (this.currentFree < behindChunk) {
      var i = this.currentFree;
      this.free(i, this.chunks[i], args);
      delete this.chunks[i];
      this.currentFree ++;
    }
  }
};

module.exports = SlidingWindow;
