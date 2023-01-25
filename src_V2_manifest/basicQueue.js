/*
** simple fifo queue
*/
'use strict';

class Queue {
  constructor() {
    this.items = {};
    this.headIndex = 0;
    this.tailIndex = 0;
  }
  raiseError(message){
	throw new Error(message)
  }
  enqueue(item) {
    this.items[this.tailIndex] = item;
    this.tailIndex++;
  }
  dequeue() {
    if (this.length === 0){
       this.raiseError("Can't dequeue an Empty Queue");
       return false;
    }

    const item = this.items[this.headIndex];
    delete this.items[this.headIndex];
    this.headIndex++;
    return item;
  }
  peek() {
    if (this.length === 0){
       this.raiseError("Can't peek an Empty Queue");
       return false;
    }
    return this.items[this.headIndex];
  }
  get length() {
    return this.tailIndex - this.headIndex;
  }
}