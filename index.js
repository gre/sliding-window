
/**
 * chunkSize: the size of each chunk in the sliding window
 * alloc: the alloc function called to alloc a chunk
 * free: the free function called to free a chunk
 * ahead: the number of chunks to keep ahead
 * behind: the numbers of chunks to keep behind
 * initialPosition: the initial chunk position. If not provided, the first call to sync will define it.
 */
function SlidingWindow (alloc, free, chunkSize, ahead, behind, initialPosition) {
  if (!(this instanceof SlidingWindow)) return new SlidingWindow(alloc, free, chunkSize, ahead, behind, initialPosition);
  this.chunkSize = chunkSize;
  this.alloc = alloc;
  this.free = free;
  this.ahead = ahead || 0;
  this.behind = behind || 0;

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
  reverseIndex: function (index) {
    return index * this.chunkSize;
  },
  chunkIndexForX: function (x) {
    return Math.floor(x / this.chunkSize);
  },
  getChunkForX: function (x) {
    return this.chunks[this.chunkIndexForX(x)];
  },
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
      this.currentFree = this.currentAlloc = this.chunkIndexForX(xtail);
    }

    var i;

    var headChunk = this.chunkIndexForX(xhead + this.ahead * this.chunkSize);
    while (headChunk >= this.currentAlloc) {
      i = this.currentAlloc;
      this.chunks[i] = this.alloc(i, args);
      this.currentAlloc ++;
    }

    var tailChunk = this.chunkIndexForX(xtail - this.behind * this.chunkSize);
    while (this.currentFree < tailChunk) {
      i = this.currentFree;
      this.free(i, this.chunks[i], args);
      delete this.chunks[i];
      this.currentFree ++;
    }
  }
};

module.exports = SlidingWindow;
