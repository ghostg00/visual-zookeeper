import { EventEmitter } from "events";

class LogEvent extends EventEmitter {}

const logEvent = new LogEvent();

export default logEvent;
