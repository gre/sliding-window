
// TODO
// - move to options 3rd param
//    - Add "bounds". format example: [0, +Infinity], [-Infinity, +Infinity], [0, 100]
// - remove "x" from the vocabulary
// - rename "sync" to "move"
// - support for backwards window move
// - "._field" convention

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

  /**
   * Compute the starting x position of a given chunk index
   */
  reverseIndex: function (index) {
    return index * this.chunkSize;
  },

  /**
   * Get the chunk index of a given x position
   */
  chunkIndexForX: function (x) {
    return Math.floor(x / this.chunkSize);
  },

  /**
   * Get the chunk data (value returned from the alloc function) for a given x position
   */
  getChunkForX: function (x) {
    return this.chunks[this.chunkIndexForX(x)];
  },

  /**
   * Get the chunk data (value returned from the alloc function) for a given chunk index
   */
  getChunkByIndex: function (i) {
    return this.chunks[i];
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

    var headChunk = this.chunkIndexForX(xhead + this.ahead * this.chunkSize) + 1; // is "+ 1" right?
    var tailChunk = this.chunkIndexForX(xtail - this.behind * this.chunkSize);

    // Alloc to the right
    for (i = this.currentAlloc; i < headChunk; i++) {
      this.chunks[i] = this.alloc(i, args);
    }
    this.currentAlloc = i;

    // Free to the right
    for (i = this.currentFree; i < tailChunk; i++) {
      this.free(i, this.chunks[i], args);
      delete this.chunks[i];
    }
    this.currentFree = i;

    // TODO WIP not working as expected
    /*
    // Alloc to the left
    for (i = this.currentFree; i > tailChunk; i--) {
      this.chunks[i] = this.alloc(i, args);
    }
    this.currentFree = i;


    // Free to the left
    for (i = this.currentAlloc; i > headChunk; i--) {
      this.free(i, this.chunks[i], args);
      delete this.chunks[i];
    }
    this.currentAlloc = i;
    */

    /*
    // That check should be guaranteed when a proper implementation finished
    if (headChunk !== this.currentAlloc || tailChunk !== this.currentFree) {
      console.log("headChunk=", headChunk);
      console.log("currentAlloc=", this.currentAlloc);
      console.log("tailChunk=", tailChunk);
      console.log("currentFree=", this.currentFree);
      throw new Error("SlidingWindow: Error in the algorithm. The window couldn't be synchronized properly");
    }
    */
  }
};

module.exports = SlidingWindow;
