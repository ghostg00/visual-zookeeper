let events = window.require("events");

let eventEmitter = new events.EventEmitter();
eventEmitter.setMaxListeners(1);

export default eventEmitter;
