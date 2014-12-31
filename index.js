
/**
 * alloc: the alloc function called to alloc a chunk
 * free: the free function called to free a chunk
 * options:
   - chunkSize: the size of each chunk in the sliding window
   - right: the number of chunks to keep ahead to the right of the window (meaning in higher position values)
   - left: the numbers of chunks to keep ahead to the left of the window (meaning in lower position values)
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
  this._chunks = {};
  this._right = null;
  this._left = null;
}

SlidingWindow.prototype = {

  // DEFAULTS
  chunkSize: 1,
  right: 0,
  left: 0,
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
    return this._chunks[this.chunkIndex(pos)];
  },

  /**
   * Get the chunk data (value returned from the alloc function) for a given chunk index
   */
  getChunkByIndex: function (i) {
    return this._chunks[i];
  },

  /**
   * Destroy and free completely the SlidingWindow
   */
  destroy: function (args) {
    for (var i=this._left; i <= this._right; ++i) {
      this.free(i, this._chunks[i], args);
      delete this._chunks[i];
    }
    this._chunks = null;
    this.alloc = null;
    this.free = null;
  },

  /**
   * Sync the window for a given value or a [head, tail] position range.
   *
   * This must be called everytime you want to check/update the SlidingWindow
   * args get pass-in as secondary arguments to free and alloc functions.
   */
  move: function (pos, args) {
    var tail, head;
    if (typeof pos === "number" && !isNaN(pos)) {
      tail = head = pos;
    }
    else {
      tail = pos[0];
      head = pos[1];
      if (typeof tail !== "number" || isNaN(tail) || !isFinite(tail)) throw new Error("tail is not a finite number: "+[tail,head]);
      if (typeof head !== "number" || isNaN(head) || !isFinite(head)) throw new Error("head is not a finite number: "+[tail,head]);
      if (tail > head) throw new Error("tail shouldn't be greater than head");
    }

    // leftChunk and rightChunk are the new allocation window target
    var rightChunk = Math.min(this.chunkIndex(head + this.right * this.chunkSize), this.bounds[1]),
        leftChunk = Math.max(this.chunkIndex(tail - this.left * this.chunkSize), this.bounds[0]),
        chunks = this._chunks,
        allocs = [],
        frees = [],
        i, index;

    if (this._right === null) {
      // If nothing has even been initialized, we better start where the tail is (rather that arbitrary position)
      this._left = leftChunk;
      this._right = leftChunk - 1;
    }

    // Alloc to the right
    for (i = this._right+1; i <= rightChunk; i++)
      allocs.push(i);

    // Alloc to the left
    for (i=this._left-1; i >= leftChunk; i--)
      allocs.push(i);

    // Free to the right
    for (i = this._left; i < leftChunk; i++)
      frees.push(i);

    // Free to the left
    for (i = this._right; i > rightChunk; i--)
      frees.push(i);

    // move to the new window
    this._right = rightChunk;
    this._left = leftChunk;
    
    // Free all chunks that are not mutually present with allocs
    for (i=0; i<frees.length; ++i) {
      index = frees[i];
      if (allocs.indexOf(index) === -1) {
        this.free(index, chunks[index], args);
        delete chunks[index];
      }
    }
    // Alloc all chunks that are not mutually present with frees
    for (i=0; i<allocs.length; ++i) {
      index = allocs[i];
      if (frees.indexOf(index) === -1) {
        chunks[index] = this.alloc(index, args);
      }
    }
  }
};

module.exports = SlidingWindow;
