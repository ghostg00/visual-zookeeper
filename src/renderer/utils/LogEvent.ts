const events = window.require("events");

const eventEmitter: Electron.EventEmitter = new events.EventEmitter();
eventEmitter.setMaxListeners(1);

export default eventEmitter;
