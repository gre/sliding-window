
// TODO
// - support for backwards window move
//    - Add "bounds". format example: [0, +Infinity], [-Infinity, +Infinity], [0, 100]
//    - Remove initialPosition
// - "._field" convention

/**
 * alloc: the alloc function called to alloc a chunk
 * free: the free function called to free a chunk
 * options:
   - chunkSize: the size of each chunk in the sliding window
   - ahead: the number of chunks to keep ahead
   - behind: the numbers of chunks to keep behind
   - bounds: the allowed bounds of the SlidingWindow – format example: [0, +Infinity], [-Infinity, 0], [-Infinity, +Infinity], [0, 100]
 */
function SlidingWindow (alloc, free, options) {
  if (!(this instanceof SlidingWindow)) return new SlidingWindow(alloc, free, options);
  if (typeof alloc !== "function") throw new Error("SlidingWindow(alloc, free, options): alloc function is mandatory");
  if (typeof free !== "function") throw new Error("SlidingWindow(alloc, free, options): free function is mandatory");
  if (options) {
    for (var key in options) {
      this[key] = options[key];
    }
  }
  this.alloc = alloc;
  this.free = free;
  this.chunks = {};

  // TODO remove
  if (isNaN(this.initialPosition)) {
    this.currentAlloc = null;
    this.currentFree = null;
  }
  else {
    this.currentAlloc = this.currentFree = this.initialPosition;
  }
}

SlidingWindow.prototype = {

  // DEFAULTS
  chunkSize: 1,
  ahead: 0,
  behind: 0,
  bounds: [-Infinity, +Infinity],
  ///////////

  /**
   * Compute the starting x position of a given chunk index
   */
  reverseIndex: function (index) {
    return index * this.chunkSize;
  },

  /**
   * Get the chunk index of a given position
   */
  chunkIndex: function (pos) {
    return Math.floor(pos / this.chunkSize);
  },

  /**
   * Get the chunk data (value returned from the alloc function) for a given position
   */
  getChunk: function (pos) {
    return this.chunks[this.chunkIndex(pos)];
  },

  /**
   * Get the chunk data (value returned from the alloc function) for a given chunk index
   */
  getChunkByIndex: function (i) {
    return this.chunks[i];
  },

  /**
   * Sync the window for a given value or a [head, tail] position range.
   *
   * This must be called everytime you want to check/update the SlidingWindow
   * args get pass-in as secondary arguments to free and alloc functions.
   */
  move: function (pos, args) {
    var tail, head;
    if (pos instanceof Array) {
      tail = pos[0];
      head = pos[1];
      if (isNaN(tail)) throw new Error("tail is not a number: "+[tail,head]);
      if (isNaN(head)) throw new Error("head is not a number: "+[tail,head]);
      if (tail > head) throw new Error("tail shouldn't be greater than head");
    }
    else if (!isNaN(pos)) {
      tail = head = pos;
    }
    else {
      throw new Error("x is required and must be an array");
    }

    if (this.currentAlloc === null) {
      this.currentFree = this.currentAlloc = this.chunkIndex(tail);
    }

    var i;

    var headChunk = this.chunkIndex(head + this.ahead * this.chunkSize) + 1; // is "+ 1" right?
    var tailChunk = this.chunkIndex(tail - this.behind * this.chunkSize);

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
