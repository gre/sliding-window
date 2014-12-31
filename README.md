sliding-window [![Build Status](https://travis-ci.org/gre/sliding-window.png)](https://travis-ci.org/gre/sliding-window)
==============

**sliding-window** is an unidimensional chunk allocation / free system.

[![npm install sliding-window](https://nodei.co/npm/sliding-window.png)](http://npmjs.org/package/sliding-window?mini=true)


> `sliding-window` can be used for making your Infinite Scrollers,
game level generation by chunk (e.g thing about Flappy Bird),
allocation of anything in an infinite (or huge) unidimensional world.

Concept
-------

![schema svg](https://cloud.githubusercontent.com/assets/211411/5589712/d5bd0bf6-9125-11e4-8cbb-e5b6dcc9128c.png)

API
---

**Creates a SlidingWindow:**

```javascript
var slidingWindow = SlidingWindow(alloc, free, options);
```

**alloc** is a function to alloc something. It receives 2 parameters: the first parameter is the `index` of the chunk to alloc. The second parameter is an optional parameter that can be transmit at second parameter of `move()`.
Your `alloc` function should returns a value that can be useful representing what you have allocated in that chunk.

**free** is a function to free something allocated with `alloc`. It receives 3 parameters:
The first parameter is the `index`. The second parameter is the chunk which was the returned value of `alloc` (it can be useful to free the thing!). The third parameter is also the optional parameter that can be transmit at second parameter of `move()`.

**options** is an object with following optional parameters:

 - `chunkSize`: the size of each chunk in the sliding window
 - `right`: the number of chunks to keep ahead to the right of the window (meaning in higher position values)
 - `left`: the numbers of chunks to keep ahead to the left of the window (meaning in lower position values)
 - `bounds`: the allowed bounds of the SlidingWindow – format example: [0, +Infinity], [-Infinity, 0], [-Infinity, +Infinity], [0, 100]


**Move the window:**

```javascript
slidingWindow.move([200,450]);
slidingWindow.move(100);
```

Usually you can call `.move()` as soon as possible: for each tick of an update loop or for each scroll event.


**Get a Chunk:**

```javascript
var chunk = slidingWindow.getChunk(position);
var chunk = slidingWindow.getChunkByIndex(index); // alternative way
```

**Destroy the SlidingWindow:**

```javascript
slidingWindow.destroy();
```

will call `free` to all remaining chunks.


Usages
------

**sliding-window** is used by:

- [bonhomme](https://gitub.com/gre/bonhomme) game: handling game level generation by chunk. Also used on the server side to handle different "rooms" of players to only broadcast events to people that are visible each other.
