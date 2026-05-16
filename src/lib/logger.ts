export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  event: string;
  data?: unknown;
}

const MAX_LOG_ENTRIES = 50;
const logBuffer: LogEntry[] = [];

function formatEntry(level: LogLevel, event: string, data?: unknown): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    event,
    data,
  };
}

function appendLog(entry: LogEntry) {
  logBuffer.push(entry);
  if (logBuffer.length > MAX_LOG_ENTRIES) {
    logBuffer.shift();
  }
}

function getConsoleMethod(level: LogLevel) {
  switch (level) {
    case "debug":
      return console.debug || console.log;
    case "info":
      return console.info || console.log;
    case "warn":
      return console.warn;
    case "error":
      return console.error;
    default:
      return console.log;
  }
}

export function log(level: LogLevel, event: string, data?: unknown) {
  const entry = formatEntry(level, event, data);
  appendLog(entry);

  if (process.env.NODE_ENV === "development") {
    const printer = getConsoleMethod(level);
    printer(`%c[${entry.level}]`, "color: #8b5cf6; font-weight: 700;", event, data ?? "");
  }
}

export function debug(event: string, data?: unknown) {
  log("debug", event, data);
}

export function info(event: string, data?: unknown) {
  log("info", event, data);
}

export function warn(event: string, data?: unknown) {
  log("warn", event, data);
}

export function error(event: string, data?: unknown) {
  log("error", event, data);
}

export function getLogBuffer() {
  return JSON.stringify(logBuffer, null, 2);
}
