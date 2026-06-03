var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// ../../../../../../.npm/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/_internal/utils.mjs
// @__NO_SIDE_EFFECTS__
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
__name(createNotImplementedError, "createNotImplementedError");
// @__NO_SIDE_EFFECTS__
function notImplemented(name) {
  const fn = /* @__PURE__ */ __name(() => {
    throw /* @__PURE__ */ createNotImplementedError(name);
  }, "fn");
  return Object.assign(fn, { __unenv__: true });
}
__name(notImplemented, "notImplemented");
// @__NO_SIDE_EFFECTS__
function notImplementedClass(name) {
  return class {
    __unenv__ = true;
    constructor() {
      throw new Error(`[unenv] ${name} is not implemented yet!`);
    }
  };
}
__name(notImplementedClass, "notImplementedClass");

// ../../../../../../.npm/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs
var _timeOrigin = globalThis.performance?.timeOrigin ?? Date.now();
var _performanceNow = globalThis.performance?.now ? globalThis.performance.now.bind(globalThis.performance) : () => Date.now() - _timeOrigin;
var nodeTiming = {
  name: "node",
  entryType: "node",
  startTime: 0,
  duration: 0,
  nodeStart: 0,
  v8Start: 0,
  bootstrapComplete: 0,
  environment: 0,
  loopStart: 0,
  loopExit: 0,
  idleTime: 0,
  uvMetricsInfo: {
    loopCount: 0,
    events: 0,
    eventsWaiting: 0
  },
  detail: void 0,
  toJSON() {
    return this;
  }
};
var PerformanceEntry = class {
  static {
    __name(this, "PerformanceEntry");
  }
  __unenv__ = true;
  detail;
  entryType = "event";
  name;
  startTime;
  constructor(name, options) {
    this.name = name;
    this.startTime = options?.startTime || _performanceNow();
    this.detail = options?.detail;
  }
  get duration() {
    return _performanceNow() - this.startTime;
  }
  toJSON() {
    return {
      name: this.name,
      entryType: this.entryType,
      startTime: this.startTime,
      duration: this.duration,
      detail: this.detail
    };
  }
};
var PerformanceMark = class PerformanceMark2 extends PerformanceEntry {
  static {
    __name(this, "PerformanceMark");
  }
  entryType = "mark";
  constructor() {
    super(...arguments);
  }
  get duration() {
    return 0;
  }
};
var PerformanceMeasure = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceMeasure");
  }
  entryType = "measure";
};
var PerformanceResourceTiming = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceResourceTiming");
  }
  entryType = "resource";
  serverTiming = [];
  connectEnd = 0;
  connectStart = 0;
  decodedBodySize = 0;
  domainLookupEnd = 0;
  domainLookupStart = 0;
  encodedBodySize = 0;
  fetchStart = 0;
  initiatorType = "";
  name = "";
  nextHopProtocol = "";
  redirectEnd = 0;
  redirectStart = 0;
  requestStart = 0;
  responseEnd = 0;
  responseStart = 0;
  secureConnectionStart = 0;
  startTime = 0;
  transferSize = 0;
  workerStart = 0;
  responseStatus = 0;
};
var PerformanceObserverEntryList = class {
  static {
    __name(this, "PerformanceObserverEntryList");
  }
  __unenv__ = true;
  getEntries() {
    return [];
  }
  getEntriesByName(_name, _type) {
    return [];
  }
  getEntriesByType(type) {
    return [];
  }
};
var Performance = class {
  static {
    __name(this, "Performance");
  }
  __unenv__ = true;
  timeOrigin = _timeOrigin;
  eventCounts = /* @__PURE__ */ new Map();
  _entries = [];
  _resourceTimingBufferSize = 0;
  navigation = void 0;
  timing = void 0;
  timerify(_fn, _options) {
    throw createNotImplementedError("Performance.timerify");
  }
  get nodeTiming() {
    return nodeTiming;
  }
  eventLoopUtilization() {
    return {};
  }
  markResourceTiming() {
    return new PerformanceResourceTiming("");
  }
  onresourcetimingbufferfull = null;
  now() {
    if (this.timeOrigin === _timeOrigin) {
      return _performanceNow();
    }
    return Date.now() - this.timeOrigin;
  }
  clearMarks(markName) {
    this._entries = markName ? this._entries.filter((e) => e.name !== markName) : this._entries.filter((e) => e.entryType !== "mark");
  }
  clearMeasures(measureName) {
    this._entries = measureName ? this._entries.filter((e) => e.name !== measureName) : this._entries.filter((e) => e.entryType !== "measure");
  }
  clearResourceTimings() {
    this._entries = this._entries.filter((e) => e.entryType !== "resource" || e.entryType !== "navigation");
  }
  getEntries() {
    return this._entries;
  }
  getEntriesByName(name, type) {
    return this._entries.filter((e) => e.name === name && (!type || e.entryType === type));
  }
  getEntriesByType(type) {
    return this._entries.filter((e) => e.entryType === type);
  }
  mark(name, options) {
    const entry = new PerformanceMark(name, options);
    this._entries.push(entry);
    return entry;
  }
  measure(measureName, startOrMeasureOptions, endMark) {
    let start;
    let end;
    if (typeof startOrMeasureOptions === "string") {
      start = this.getEntriesByName(startOrMeasureOptions, "mark")[0]?.startTime;
      end = this.getEntriesByName(endMark, "mark")[0]?.startTime;
    } else {
      start = Number.parseFloat(startOrMeasureOptions?.start) || this.now();
      end = Number.parseFloat(startOrMeasureOptions?.end) || this.now();
    }
    const entry = new PerformanceMeasure(measureName, {
      startTime: start,
      detail: {
        start,
        end
      }
    });
    this._entries.push(entry);
    return entry;
  }
  setResourceTimingBufferSize(maxSize) {
    this._resourceTimingBufferSize = maxSize;
  }
  addEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.addEventListener");
  }
  removeEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.removeEventListener");
  }
  dispatchEvent(event) {
    throw createNotImplementedError("Performance.dispatchEvent");
  }
  toJSON() {
    return this;
  }
};
var PerformanceObserver = class {
  static {
    __name(this, "PerformanceObserver");
  }
  __unenv__ = true;
  static supportedEntryTypes = [];
  _callback = null;
  constructor(callback) {
    this._callback = callback;
  }
  takeRecords() {
    return [];
  }
  disconnect() {
    throw createNotImplementedError("PerformanceObserver.disconnect");
  }
  observe(options) {
    throw createNotImplementedError("PerformanceObserver.observe");
  }
  bind(fn) {
    return fn;
  }
  runInAsyncScope(fn, thisArg, ...args) {
    return fn.call(thisArg, ...args);
  }
  asyncId() {
    return 0;
  }
  triggerAsyncId() {
    return 0;
  }
  emitDestroy() {
    return this;
  }
};
var performance = globalThis.performance && "addEventListener" in globalThis.performance ? globalThis.performance : new Performance();

// ../../../../../../.npm/_npx/32026684e21afda6/node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs
if (!("__unenv__" in performance)) {
  const proto = Performance.prototype;
  for (const key of Object.getOwnPropertyNames(proto)) {
    if (key !== "constructor" && !(key in performance)) {
      const desc = Object.getOwnPropertyDescriptor(proto, key);
      if (desc) {
        Object.defineProperty(performance, key, desc);
      }
    }
  }
}
globalThis.performance = performance;
globalThis.Performance = Performance;
globalThis.PerformanceEntry = PerformanceEntry;
globalThis.PerformanceMark = PerformanceMark;
globalThis.PerformanceMeasure = PerformanceMeasure;
globalThis.PerformanceObserver = PerformanceObserver;
globalThis.PerformanceObserverEntryList = PerformanceObserverEntryList;
globalThis.PerformanceResourceTiming = PerformanceResourceTiming;

// ../../../../../../.npm/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/node/console.mjs
import { Writable } from "node:stream";

// ../../../../../../.npm/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/mock/noop.mjs
var noop_default = Object.assign(() => {
}, { __unenv__: true });

// ../../../../../../.npm/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/node/console.mjs
var _console = globalThis.console;
var _ignoreErrors = true;
var _stderr = new Writable();
var _stdout = new Writable();
var log = _console?.log ?? noop_default;
var info = _console?.info ?? log;
var trace = _console?.trace ?? info;
var debug = _console?.debug ?? log;
var table = _console?.table ?? log;
var error = _console?.error ?? log;
var warn = _console?.warn ?? error;
var createTask = _console?.createTask ?? /* @__PURE__ */ notImplemented("console.createTask");
var clear = _console?.clear ?? noop_default;
var count = _console?.count ?? noop_default;
var countReset = _console?.countReset ?? noop_default;
var dir = _console?.dir ?? noop_default;
var dirxml = _console?.dirxml ?? noop_default;
var group = _console?.group ?? noop_default;
var groupEnd = _console?.groupEnd ?? noop_default;
var groupCollapsed = _console?.groupCollapsed ?? noop_default;
var profile = _console?.profile ?? noop_default;
var profileEnd = _console?.profileEnd ?? noop_default;
var time = _console?.time ?? noop_default;
var timeEnd = _console?.timeEnd ?? noop_default;
var timeLog = _console?.timeLog ?? noop_default;
var timeStamp = _console?.timeStamp ?? noop_default;
var Console = _console?.Console ?? /* @__PURE__ */ notImplementedClass("console.Console");
var _times = /* @__PURE__ */ new Map();
var _stdoutErrorHandler = noop_default;
var _stderrErrorHandler = noop_default;

// ../../../../../../.npm/_npx/32026684e21afda6/node_modules/@cloudflare/unenv-preset/dist/runtime/node/console.mjs
var workerdConsole = globalThis["console"];
var {
  assert,
  clear: clear2,
  // @ts-expect-error undocumented public API
  context,
  count: count2,
  countReset: countReset2,
  // @ts-expect-error undocumented public API
  createTask: createTask2,
  debug: debug2,
  dir: dir2,
  dirxml: dirxml2,
  error: error2,
  group: group2,
  groupCollapsed: groupCollapsed2,
  groupEnd: groupEnd2,
  info: info2,
  log: log2,
  profile: profile2,
  profileEnd: profileEnd2,
  table: table2,
  time: time2,
  timeEnd: timeEnd2,
  timeLog: timeLog2,
  timeStamp: timeStamp2,
  trace: trace2,
  warn: warn2
} = workerdConsole;
Object.assign(workerdConsole, {
  Console,
  _ignoreErrors,
  _stderr,
  _stderrErrorHandler,
  _stdout,
  _stdoutErrorHandler,
  _times
});
var console_default = workerdConsole;

// ../../../../../../.npm/_npx/32026684e21afda6/node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-console
globalThis.console = console_default;

// ../../../../../../.npm/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs
var hrtime = /* @__PURE__ */ Object.assign(/* @__PURE__ */ __name(function hrtime2(startTime) {
  const now = Date.now();
  const seconds = Math.trunc(now / 1e3);
  const nanos = now % 1e3 * 1e6;
  if (startTime) {
    let diffSeconds = seconds - startTime[0];
    let diffNanos = nanos - startTime[0];
    if (diffNanos < 0) {
      diffSeconds = diffSeconds - 1;
      diffNanos = 1e9 + diffNanos;
    }
    return [diffSeconds, diffNanos];
  }
  return [seconds, nanos];
}, "hrtime"), { bigint: /* @__PURE__ */ __name(function bigint() {
  return BigInt(Date.now() * 1e6);
}, "bigint") });

// ../../../../../../.npm/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/node/internal/process/process.mjs
import { EventEmitter } from "node:events";

// ../../../../../../.npm/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs
var ReadStream = class {
  static {
    __name(this, "ReadStream");
  }
  fd;
  isRaw = false;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  setRawMode(mode) {
    this.isRaw = mode;
    return this;
  }
};

// ../../../../../../.npm/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs
var WriteStream = class {
  static {
    __name(this, "WriteStream");
  }
  fd;
  columns = 80;
  rows = 24;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  clearLine(dir3, callback) {
    callback && callback();
    return false;
  }
  clearScreenDown(callback) {
    callback && callback();
    return false;
  }
  cursorTo(x, y, callback) {
    callback && typeof callback === "function" && callback();
    return false;
  }
  moveCursor(dx, dy, callback) {
    callback && callback();
    return false;
  }
  getColorDepth(env2) {
    return 1;
  }
  hasColors(count3, env2) {
    return false;
  }
  getWindowSize() {
    return [this.columns, this.rows];
  }
  write(str, encoding, cb) {
    if (str instanceof Uint8Array) {
      str = new TextDecoder().decode(str);
    }
    try {
      console.log(str);
    } catch {
    }
    cb && typeof cb === "function" && cb();
    return false;
  }
};

// ../../../../../../.npm/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/node/internal/process/node-version.mjs
var NODE_VERSION = "22.14.0";

// ../../../../../../.npm/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/node/internal/process/process.mjs
var Process = class _Process extends EventEmitter {
  static {
    __name(this, "Process");
  }
  env;
  hrtime;
  nextTick;
  constructor(impl) {
    super();
    this.env = impl.env;
    this.hrtime = impl.hrtime;
    this.nextTick = impl.nextTick;
    for (const prop of [...Object.getOwnPropertyNames(_Process.prototype), ...Object.getOwnPropertyNames(EventEmitter.prototype)]) {
      const value = this[prop];
      if (typeof value === "function") {
        this[prop] = value.bind(this);
      }
    }
  }
  // --- event emitter ---
  emitWarning(warning, type, code) {
    console.warn(`${code ? `[${code}] ` : ""}${type ? `${type}: ` : ""}${warning}`);
  }
  emit(...args) {
    return super.emit(...args);
  }
  listeners(eventName) {
    return super.listeners(eventName);
  }
  // --- stdio (lazy initializers) ---
  #stdin;
  #stdout;
  #stderr;
  get stdin() {
    return this.#stdin ??= new ReadStream(0);
  }
  get stdout() {
    return this.#stdout ??= new WriteStream(1);
  }
  get stderr() {
    return this.#stderr ??= new WriteStream(2);
  }
  // --- cwd ---
  #cwd = "/";
  chdir(cwd2) {
    this.#cwd = cwd2;
  }
  cwd() {
    return this.#cwd;
  }
  // --- dummy props and getters ---
  arch = "";
  platform = "";
  argv = [];
  argv0 = "";
  execArgv = [];
  execPath = "";
  title = "";
  pid = 200;
  ppid = 100;
  get version() {
    return `v${NODE_VERSION}`;
  }
  get versions() {
    return { node: NODE_VERSION };
  }
  get allowedNodeEnvironmentFlags() {
    return /* @__PURE__ */ new Set();
  }
  get sourceMapsEnabled() {
    return false;
  }
  get debugPort() {
    return 0;
  }
  get throwDeprecation() {
    return false;
  }
  get traceDeprecation() {
    return false;
  }
  get features() {
    return {};
  }
  get release() {
    return {};
  }
  get connected() {
    return false;
  }
  get config() {
    return {};
  }
  get moduleLoadList() {
    return [];
  }
  constrainedMemory() {
    return 0;
  }
  availableMemory() {
    return 0;
  }
  uptime() {
    return 0;
  }
  resourceUsage() {
    return {};
  }
  // --- noop methods ---
  ref() {
  }
  unref() {
  }
  // --- unimplemented methods ---
  umask() {
    throw createNotImplementedError("process.umask");
  }
  getBuiltinModule() {
    return void 0;
  }
  getActiveResourcesInfo() {
    throw createNotImplementedError("process.getActiveResourcesInfo");
  }
  exit() {
    throw createNotImplementedError("process.exit");
  }
  reallyExit() {
    throw createNotImplementedError("process.reallyExit");
  }
  kill() {
    throw createNotImplementedError("process.kill");
  }
  abort() {
    throw createNotImplementedError("process.abort");
  }
  dlopen() {
    throw createNotImplementedError("process.dlopen");
  }
  setSourceMapsEnabled() {
    throw createNotImplementedError("process.setSourceMapsEnabled");
  }
  loadEnvFile() {
    throw createNotImplementedError("process.loadEnvFile");
  }
  disconnect() {
    throw createNotImplementedError("process.disconnect");
  }
  cpuUsage() {
    throw createNotImplementedError("process.cpuUsage");
  }
  setUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.setUncaughtExceptionCaptureCallback");
  }
  hasUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.hasUncaughtExceptionCaptureCallback");
  }
  initgroups() {
    throw createNotImplementedError("process.initgroups");
  }
  openStdin() {
    throw createNotImplementedError("process.openStdin");
  }
  assert() {
    throw createNotImplementedError("process.assert");
  }
  binding() {
    throw createNotImplementedError("process.binding");
  }
  // --- attached interfaces ---
  permission = { has: /* @__PURE__ */ notImplemented("process.permission.has") };
  report = {
    directory: "",
    filename: "",
    signal: "SIGUSR2",
    compact: false,
    reportOnFatalError: false,
    reportOnSignal: false,
    reportOnUncaughtException: false,
    getReport: /* @__PURE__ */ notImplemented("process.report.getReport"),
    writeReport: /* @__PURE__ */ notImplemented("process.report.writeReport")
  };
  finalization = {
    register: /* @__PURE__ */ notImplemented("process.finalization.register"),
    unregister: /* @__PURE__ */ notImplemented("process.finalization.unregister"),
    registerBeforeExit: /* @__PURE__ */ notImplemented("process.finalization.registerBeforeExit")
  };
  memoryUsage = Object.assign(() => ({
    arrayBuffers: 0,
    rss: 0,
    external: 0,
    heapTotal: 0,
    heapUsed: 0
  }), { rss: /* @__PURE__ */ __name(() => 0, "rss") });
  // --- undefined props ---
  mainModule = void 0;
  domain = void 0;
  // optional
  send = void 0;
  exitCode = void 0;
  channel = void 0;
  getegid = void 0;
  geteuid = void 0;
  getgid = void 0;
  getgroups = void 0;
  getuid = void 0;
  setegid = void 0;
  seteuid = void 0;
  setgid = void 0;
  setgroups = void 0;
  setuid = void 0;
  // internals
  _events = void 0;
  _eventsCount = void 0;
  _exiting = void 0;
  _maxListeners = void 0;
  _debugEnd = void 0;
  _debugProcess = void 0;
  _fatalException = void 0;
  _getActiveHandles = void 0;
  _getActiveRequests = void 0;
  _kill = void 0;
  _preload_modules = void 0;
  _rawDebug = void 0;
  _startProfilerIdleNotifier = void 0;
  _stopProfilerIdleNotifier = void 0;
  _tickCallback = void 0;
  _disconnect = void 0;
  _handleQueue = void 0;
  _pendingMessage = void 0;
  _channel = void 0;
  _send = void 0;
  _linkedBinding = void 0;
};

// ../../../../../../.npm/_npx/32026684e21afda6/node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs
var globalProcess = globalThis["process"];
var getBuiltinModule = globalProcess.getBuiltinModule;
var workerdProcess = getBuiltinModule("node:process");
var unenvProcess = new Process({
  env: globalProcess.env,
  hrtime,
  // `nextTick` is available from workerd process v1
  nextTick: workerdProcess.nextTick
});
var { exit, features, platform } = workerdProcess;
var {
  _channel,
  _debugEnd,
  _debugProcess,
  _disconnect,
  _events,
  _eventsCount,
  _exiting,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _handleQueue,
  _kill,
  _linkedBinding,
  _maxListeners,
  _pendingMessage,
  _preload_modules,
  _rawDebug,
  _send,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  arch,
  argv,
  argv0,
  assert: assert2,
  availableMemory,
  binding,
  channel,
  chdir,
  config,
  connected,
  constrainedMemory,
  cpuUsage,
  cwd,
  debugPort,
  disconnect,
  dlopen,
  domain,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exitCode,
  finalization,
  getActiveResourcesInfo,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getMaxListeners,
  getuid,
  hasUncaughtExceptionCaptureCallback,
  hrtime: hrtime3,
  initgroups,
  kill,
  listenerCount,
  listeners,
  loadEnvFile,
  mainModule,
  memoryUsage,
  moduleLoadList,
  nextTick,
  off,
  on,
  once,
  openStdin,
  permission,
  pid,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  reallyExit,
  ref,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  send,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setMaxListeners,
  setSourceMapsEnabled,
  setuid,
  setUncaughtExceptionCaptureCallback,
  sourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  throwDeprecation,
  title,
  traceDeprecation,
  umask,
  unref,
  uptime,
  version,
  versions
} = unenvProcess;
var _process = {
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  hasUncaughtExceptionCaptureCallback,
  setUncaughtExceptionCaptureCallback,
  loadEnvFile,
  sourceMapsEnabled,
  arch,
  argv,
  argv0,
  chdir,
  config,
  connected,
  constrainedMemory,
  availableMemory,
  cpuUsage,
  cwd,
  debugPort,
  dlopen,
  disconnect,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exit,
  finalization,
  features,
  getBuiltinModule,
  getActiveResourcesInfo,
  getMaxListeners,
  hrtime: hrtime3,
  kill,
  listeners,
  listenerCount,
  memoryUsage,
  nextTick,
  on,
  off,
  once,
  pid,
  platform,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  setMaxListeners,
  setSourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  title,
  throwDeprecation,
  traceDeprecation,
  umask,
  uptime,
  version,
  versions,
  // @ts-expect-error old API
  domain,
  initgroups,
  moduleLoadList,
  reallyExit,
  openStdin,
  assert: assert2,
  binding,
  send,
  exitCode,
  channel,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getuid,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setuid,
  permission,
  mainModule,
  _events,
  _eventsCount,
  _exiting,
  _maxListeners,
  _debugEnd,
  _debugProcess,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _kill,
  _preload_modules,
  _rawDebug,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  _disconnect,
  _handleQueue,
  _pendingMessage,
  _channel,
  _send,
  _linkedBinding
};
var process_default = _process;

// ../../../../../../.npm/_npx/32026684e21afda6/node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process
globalThis.process = process_default;

// src/index.js
var CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization"
};
var json = /* @__PURE__ */ __name((data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { ...CORS, "Content-Type": "application/json" }
}), "json");
var html = /* @__PURE__ */ __name((body, status = 200) => new Response(body, {
  status,
  headers: { ...CORS, "Content-Type": "text/html;charset=UTF-8" }
}), "html");
async function sha256(str) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(sha256, "sha256");
var DEAD_STAGES = "('Closed Lost','Lost')";
function teamsForPurposes(purposes) {
  const arr = Array.isArray(purposes) ? purposes : [];
  return {
    needs_pos: arr.includes("pos") ? 1 : 0,
    needs_cs: arr.some((p) => p && p !== "pos") ? 1 : 0
  };
}
__name(teamsForPurposes, "teamsForPurposes");
function timeToSort(slot) {
  const m = String(slot || "").match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const ap = m[3].toUpperCase();
  if (ap === "PM" && h !== 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;
  return h * 100 + min;
}
__name(timeToSort, "timeToSort");
function gcalEnabled(env2) {
  return !!(env2.GCAL_CLIENT_EMAIL && env2.GCAL_PRIVATE_KEY && env2.GCAL_CALENDAR_ID);
}
__name(gcalEnabled, "gcalEnabled");
function b64url(input) {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : new Uint8Array(input);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
__name(b64url, "b64url");
function pemToPkcs8(pem) {
  const b64 = pem.replace(/\\n/g, "\n").replace(/-----BEGIN PRIVATE KEY-----/, "").replace(/-----END PRIVATE KEY-----/, "").replace(/\s+/g, "");
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}
__name(pemToPkcs8, "pemToPkcs8");
async function gcalAccessToken(env2) {
  const now = Math.floor(Date.now() / 1e3);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(JSON.stringify({
    iss: env2.GCAL_CLIENT_EMAIL,
    scope: "https://www.googleapis.com/auth/calendar.events",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600
  }));
  const signingInput = `${header}.${claim}`;
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToPkcs8(env2.GCAL_PRIVATE_KEY),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(signingInput));
  const jwt = `${signingInput}.${b64url(sig)}`;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=${encodeURIComponent("urn:ietf:params:oauth:grant-type:jwt-bearer")}&assertion=${jwt}`
  });
  const data = await res.json();
  if (!data.access_token) throw new Error("Google token error: " + JSON.stringify(data));
  return data.access_token;
}
__name(gcalAccessToken, "gcalAccessToken");
function slotToTimes(date, slot) {
  const m = String(slot || "").match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!date || !m) return null;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const ap = m[3].toUpperCase();
  if (ap === "PM" && h !== 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;
  const pad = /* @__PURE__ */ __name((n) => String(n).padStart(2, "0"), "pad");
  let eh = h, em = min + 30;
  if (em >= 60) {
    em -= 60;
    eh += 1;
  }
  return {
    start: `${date}T${pad(h)}:${pad(min)}:00+08:00`,
    end: `${date}T${pad(eh)}:${pad(em)}:00+08:00`
  };
}
__name(slotToTimes, "slotToTimes");
async function gcalCreateEvent(env2, lead) {
  const times = slotToTimes(lead.date, lead.time_slot);
  if (!times) return null;
  const token = await gcalAccessToken(env2);
  const calId = encodeURIComponent(env2.GCAL_CALENDAR_ID);
  const event = {
    summary: `MIPOS Walk-In: ${lead.name || "Customer"}${lead.purpose ? " \u2014 " + lead.purpose : ""}`,
    description: [
      `Name: ${lead.name || "-"}`,
      `Phone: ${lead.phone || "-"}`,
      `Company: ${lead.company || "-"}`,
      `Purpose: ${lead.purpose || "-"}`,
      "",
      "Booked via appointment.mipos.me"
    ].join("\n"),
    location: "29, Jalan 2, Taman Len Seng Cheras, 56000 Kuala Lumpur",
    start: { dateTime: times.start, timeZone: "Asia/Kuala_Lumpur" },
    end: { dateTime: times.end, timeZone: "Asia/Kuala_Lumpur" }
  };
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calId}/events`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(event)
  });
  const data = await res.json();
  if (!res.ok) throw new Error("Google event error: " + JSON.stringify(data));
  return data.id;
}
__name(gcalCreateEvent, "gcalCreateEvent");
async function gcalDeleteEvent(env2, eventId) {
  if (!eventId) return;
  const token = await gcalAccessToken(env2);
  const calId = encodeURIComponent(env2.GCAL_CALENDAR_ID);
  await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calId}/events/${eventId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
}
__name(gcalDeleteEvent, "gcalDeleteEvent");
var STAGE_HEX = {
  "New Lead": "#3b82f6",
  "Contacted": "#06b6d4",
  "Appointment Confirmed": "#a78bfa",
  "Walk-In Arrived": "#8b5cf6",
  "Demo Done": "#f59e0b",
  "Quotation sent": "#f97316",
  "Invoice sent": "#10b981",
  "Closed Won": "#22c55e",
  "Closed Lost": "#ef4444",
  "Lost": "#ef4444"
};
var stageColor = /* @__PURE__ */ __name((s) => STAGE_HEX[s] || "#64748b", "stageColor");
function buildDashboard(leads, now) {
  const total = leads.length;
  const won = leads.filter((l) => l.stage === "Closed Won").length;
  const lost = leads.filter((l) => ["Closed Lost", "Lost"].includes(l.stage)).length;
  const pending = total - won - lost;
  const convRate = total > 0 ? (won / total * 100).toFixed(1) : "0.0";
  const prefix = now.toISOString().slice(0, 7);
  const monthly = leads.filter((l) => l.date?.startsWith(prefix)).length;
  const rows = leads.slice(0, 50).map((l) => {
    const c = stageColor(l.stage);
    return `
    <tr>
      <td class="id">#${l.id}</td>
      <td><strong>${esc(l.name || "\u2014")}</strong><br><small>${esc(l.phone || "")}</small></td>
      <td>${esc(l.company || "\u2014")}</td>
      <td>${esc(l.date || "\u2014")}<br><small>${esc(l.time_slot || "")}</small></td>
      <td>${esc(l.purpose || "\u2014")}</td>
      <td><span class="badge" style="background:${c}22;color:${c};border:1px solid ${c}44">${esc(l.stage || "New Lead")}</span></td>
      <td>${esc(l.assigned_staff_name || "") || '<span class="dim">Unassigned</span>'}</td>
    </tr>`;
  }).join("");
  const apiCards = [
    ["/api/leads", "Leads"],
    ["/api/staff", "Staff"],
    ["/api/sales", "Sales"],
    ["/api/analytics", "Summary"],
    ["/api/analytics/funnel", "Funnel"],
    ["/api/analytics/monthly", "Monthly"],
    ["/api/analytics/staff", "By Staff"],
    ["/api/health", "Health"]
  ].map(([p, n]) => `<a class="api-chip" href="${p}" target="_blank"><code>${p}</code><span>${n}</span></a>`).join("");
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>MIPOS \u2014 Backend API v3</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet"/>
<style>
*,::before,::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#060812;--surface:#0e1120;--surface2:#141726;--border:rgba(255,255,255,.08);
  --text:#e2e8f0;--muted:#64748b;--orange:#f97316;--green:#22c55e;--red:#ef4444;
  --font:'Inter',system-ui,sans-serif;
}
body{font-family:var(--font);background:var(--bg);color:var(--text);min-height:100vh;padding:28px 20px;
  background-image:radial-gradient(ellipse 80% 50% at 50% -20%,rgba(249,115,22,.12),transparent);
}
.wrap{max-width:1360px;margin:0 auto}

/* header */
header{display:flex;align-items:center;gap:14px;margin-bottom:36px;padding-bottom:22px;border-bottom:1px solid var(--border)}
.logo{width:48px;height:48px;background:linear-gradient(135deg,#f97316,#ea580c);border-radius:14px;
  display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800;color:#fff;
  box-shadow:0 0 30px rgba(249,115,22,.4)}
.brand h1{font-size:1.25rem;font-weight:800;color:#fff;letter-spacing:-.02em}
.brand p{font-size:.75rem;color:var(--muted);margin-top:2px}
.pill{margin-left:auto;display:flex;align-items:center;gap:8px;
  background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.25);
  padding:7px 16px;border-radius:99px;font-size:.8rem;font-weight:600;color:#4ade80}
.dot{width:7px;height:7px;border-radius:50%;background:#4ade80;animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.25}}

/* KPIs */
.kpi-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:24px}
.kpi{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:20px 18px}
.kpi-label{font-size:.7rem;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.08em}
.kpi-value{font-size:2rem;font-weight:800;color:#fff;margin-top:6px;letter-spacing:-.03em}
.kpi-value.orange{color:var(--orange)}
.kpi-value.green{color:var(--green)}
.kpi-value.red{color:var(--red)}
.kpi-value.cyan{color:#06b6d4}

/* API chips */
.api-strip{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:24px}
.api-chip{display:flex;align-items:center;gap:8px;padding:8px 14px;
  background:var(--surface);border:1px solid var(--border);border-radius:10px;
  text-decoration:none;transition:all .2s;font-size:.78rem}
.api-chip code{color:#94a3b8;font-family:monospace}
.api-chip span{color:var(--muted);font-size:.7rem}
.api-chip:hover{border-color:rgba(249,115,22,.4);background:rgba(249,115,22,.08)}
.api-chip:hover code{color:var(--orange)}

/* Table */
.card{background:var(--surface);border:1px solid var(--border);border-radius:18px;overflow:hidden;margin-bottom:20px}
.card-head{display:flex;align-items:center;justify-content:space-between;
  padding:16px 20px;border-bottom:1px solid var(--border)}
.card-title{font-size:.875rem;font-weight:700;color:#f1f5f9}
.card-meta{font-size:.72rem;color:var(--muted)}
table{width:100%;border-collapse:collapse;font-size:.8rem}
thead tr{background:rgba(255,255,255,.03)}
th{padding:11px 16px;text-align:left;font-size:.68rem;font-weight:600;
  color:var(--muted);text-transform:uppercase;letter-spacing:.07em;white-space:nowrap}
td{padding:13px 16px;border-top:1px solid rgba(255,255,255,.04);vertical-align:middle;color:#cbd5e1}
td.id{color:var(--muted);font-size:.72rem;font-family:monospace}
td strong{color:#f1f5f9;font-weight:600}
td small{color:#475569;font-size:.72rem;display:block;margin-top:2px}
.dim{color:#334155}
tr:hover td{background:rgba(249,115,22,.04)}
.badge{display:inline-flex;align-items:center;padding:3px 10px;border-radius:99px;
  font-size:.68rem;font-weight:700;white-space:nowrap}

footer{text-align:center;margin-top:28px;font-size:.72rem;color:#1e293b}

@media(max-width:900px){
  .kpi-grid{grid-template-columns:repeat(2,1fr)}
  th:nth-child(n+5),td:nth-child(n+5){display:none}
}
</style>
</head>
<body>
<div class="wrap">
  <header>
    <div class="logo">M</div>
    <div class="brand">
      <h1>MIPOS Backend API</h1>
      <p>Cloudflare Worker \xB7 D1 Database \xB7 v3.0</p>
    </div>
    <div class="pill"><div class="dot"></div> Worker Online</div>
  </header>

  <div class="kpi-grid">
    <div class="kpi"><div class="kpi-label">Total Leads</div><div class="kpi-value">${total}</div></div>
    <div class="kpi"><div class="kpi-label">This Month</div><div class="kpi-value cyan">${monthly}</div></div>
    <div class="kpi"><div class="kpi-label">Closed Won</div><div class="kpi-value green">${won}</div></div>
    <div class="kpi"><div class="kpi-label">Pending</div><div class="kpi-value orange">${pending}</div></div>
    <div class="kpi"><div class="kpi-label">Conversion</div><div class="kpi-value" style="color:#a78bfa">${convRate}%</div></div>
  </div>

  <div class="api-strip">${apiCards}</div>

  <div class="card">
    <div class="card-head">
      <span class="card-title">Recent Appointments <span style="color:var(--muted);font-weight:400">(last 50)</span></span>
      <span class="card-meta">Loaded ${now.toLocaleString("en-MY", { timeZone: "Asia/Kuala_Lumpur" })}</span>
    </div>
    <table>
      <thead><tr>
        <th>#</th><th>Customer</th><th>Company</th><th>Date / Time</th>
        <th>Purpose</th><th>Stage</th><th>Staff</th>
      </tr></thead>
      <tbody>${rows || '<tr><td colspan="7" style="text-align:center;padding:48px;color:#334155">No appointments yet</td></tr>'}</tbody>
    </table>
  </div>

  <footer>MIPOS ShopTech Centre \xB7 Backend v3.0 \xB7 Cloudflare D1</footer>
</div>
</body>
</html>`;
}
__name(buildDashboard, "buildDashboard");
function esc(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
__name(esc, "esc");
var src_default = {
  async fetch(request, env2) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    if (method === "OPTIONS") return new Response(null, { headers: CORS });
    try {
      if (path === "/" && method === "GET") {
        const { results: leads } = await env2.DB.prepare(`
          SELECT leads.*, staff.name as assigned_staff_name
          FROM leads LEFT JOIN staff ON leads.assigned_staff = staff.id
          ORDER BY leads.date DESC, leads.time_slot DESC
        `).all();
        return html(buildDashboard(leads, /* @__PURE__ */ new Date()));
      }
      if (path === "/api/health" && method === "GET")
        return json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString(), version: "3.0.0" });
      if ((path === "/api" || path === "/api/") && method === "GET")
        return json({ message: "MIPOS API is running", version: "3.0.0" });
      if (path === "/api/login" && method === "POST") {
        const { username, password } = await request.json();
        if (!username || !password)
          return json({ error: "Username and password required" }, 400);
        const hash = await sha256(password);
        const row = await env2.DB.prepare(
          "SELECT id, name, username, role FROM staff WHERE username=? AND password=?"
        ).bind(username, hash).first();
        return row ? json({ user: row }) : json({ error: "Invalid credentials" }, 401);
      }
      if (path === "/api/staff") {
        if (method === "GET") {
          const { results } = await env2.DB.prepare(
            "SELECT id,name,username,role FROM staff ORDER BY name ASC"
          ).all();
          return json(results);
        }
        if (method === "POST") {
          const { name, username, password, role } = await request.json();
          if (!name || !username || !password)
            return json({ error: "name, username, password required" }, 400);
          try {
            const r = await env2.DB.prepare(
              "INSERT INTO staff(name,username,password,role) VALUES(?,?,?,?)"
            ).bind(name, username, await sha256(password), role || "staff").run();
            return json({ id: r.meta.last_row_id, success: true }, 201);
          } catch (e) {
            if (e.message.includes("UNIQUE")) return json({ error: "Username already exists" }, 409);
            throw e;
          }
        }
      }
      const staffId = path.match(/^\/api\/staff\/(\d+)$/)?.[1];
      if (staffId) {
        if (method === "PUT") {
          const body = await request.json();
          const sets = [], vals = [];
          if (body.name) {
            sets.push("name=?");
            vals.push(body.name);
          }
          if (body.username) {
            sets.push("username=?");
            vals.push(body.username);
          }
          if (body.password) {
            sets.push("password=?");
            vals.push(await sha256(body.password));
          }
          if (body.role) {
            sets.push("role=?");
            vals.push(body.role);
          }
          if (!sets.length) return json({ success: true, changes: 0 });
          vals.push(staffId);
          const r = await env2.DB.prepare(`UPDATE staff SET ${sets.join(",")} WHERE id=?`).bind(...vals).run();
          return json({ changes: r.meta.changes, success: true });
        }
        if (method === "DELETE") {
          const r = await env2.DB.prepare("DELETE FROM staff WHERE id=?").bind(staffId).run();
          return r.meta.changes ? json({ success: true }) : json({ error: "Staff not found" }, 404);
        }
      }
      if (path === "/api/slots" && method === "GET") {
        const { results } = await env2.DB.prepare("SELECT * FROM slots ORDER BY sort_order").all();
        return json(results);
      }
      if (path === "/api/slots" && method === "POST") {
        const { time: time3, pos_capacity, cs_capacity } = await request.json();
        const so = timeToSort(time3);
        if (so === null) return json({ error: 'Invalid time. Use e.g. "10:00 AM" or "2:30 PM".' }, 400);
        await env2.DB.prepare(
          `INSERT OR REPLACE INTO slots(time,sort_order,pos_capacity,cs_capacity,active)
           VALUES(?,?,?,?,COALESCE((SELECT active FROM slots WHERE time=?),1))`
        ).bind(time3, so, pos_capacity ?? 1, cs_capacity ?? 2, time3).run();
        return json({ success: true }, 201);
      }
      const slotTime = path.match(/^\/api\/slots\/(.+)$/)?.[1];
      if (slotTime) {
        const time3 = decodeURIComponent(slotTime);
        if (method === "PUT") {
          const b = await request.json();
          const sets = [], vals = [];
          if (b.pos_capacity !== void 0) {
            sets.push("pos_capacity=?");
            vals.push(b.pos_capacity);
          }
          if (b.cs_capacity !== void 0) {
            sets.push("cs_capacity=?");
            vals.push(b.cs_capacity);
          }
          if (b.active !== void 0) {
            sets.push("active=?");
            vals.push(b.active ? 1 : 0);
          }
          if (!sets.length) return json({ success: true, changes: 0 });
          vals.push(time3);
          const r = await env2.DB.prepare(`UPDATE slots SET ${sets.join(",")} WHERE time=?`).bind(...vals).run();
          return json({ success: true, changes: r.meta.changes });
        }
        if (method === "DELETE") {
          const r = await env2.DB.prepare("DELETE FROM slots WHERE time=?").bind(time3).run();
          return r.meta.changes ? json({ success: true }) : json({ error: "Slot not found" }, 404);
        }
      }
      if (path === "/api/availability" && method === "GET") {
        const date = url.searchParams.get("date");
        if (!date) return json({ error: "date query param required" }, 400);
        const { results: slotRows } = await env2.DB.prepare(
          "SELECT time, pos_capacity, cs_capacity FROM slots WHERE active=1 ORDER BY sort_order"
        ).all();
        const { results: booked } = await env2.DB.prepare(
          `SELECT time_slot,
                  COALESCE(SUM(needs_pos),0) AS pos,
                  COALESCE(SUM(needs_cs),0)  AS cs
           FROM leads
           WHERE date=? AND time_slot IS NOT NULL AND time_slot!='' AND stage NOT IN ${DEAD_STAGES}
           GROUP BY time_slot`
        ).bind(date).all();
        const bmap = {};
        booked.forEach((b) => {
          bmap[b.time_slot] = { pos: b.pos, cs: b.cs };
        });
        const slots = slotRows.map((s) => ({
          time: s.time,
          pos_capacity: s.pos_capacity,
          cs_capacity: s.cs_capacity,
          pos_booked: bmap[s.time]?.pos || 0,
          cs_booked: bmap[s.time]?.cs || 0
        }));
        return json({ date, slots });
      }
      const SEL = `SELECT leads.*,staff.name as assigned_staff_name
                   FROM leads LEFT JOIN staff ON leads.assigned_staff=staff.id`;
      if (path === "/api/leads") {
        if (method === "GET") {
          const p = url.searchParams;
          const cond = [], vals = [];
          if (p.get("stage")) {
            cond.push("leads.stage=?");
            vals.push(p.get("stage"));
          }
          if (p.get("staff")) {
            cond.push("leads.assigned_staff=?");
            vals.push(p.get("staff"));
          }
          if (p.get("date")) {
            cond.push("leads.date=?");
            vals.push(p.get("date"));
          }
          if (p.get("search")) {
            cond.push("(leads.name LIKE ? OR leads.phone LIKE ? OR leads.company LIKE ?)");
            const q = `%${p.get("search")}%`;
            vals.push(q, q, q);
          }
          const sql = SEL + (cond.length ? " WHERE " + cond.join(" AND ") : "") + " ORDER BY leads.date DESC,leads.time_slot DESC";
          const { results } = await env2.DB.prepare(sql).bind(...vals).all();
          return json(results);
        }
        if (method === "POST") {
          const body = await request.json();
          if (!body.phone) return json({ error: "Phone number is required" }, 400);
          const name = body.name ?? null;
          const phone = body.phone ?? null;
          const company = body.company ?? null;
          const date = body.date ?? null;
          const time_slot = body.time_slot ?? null;
          const purposesArr = Array.isArray(body.purposes) ? body.purposes : [];
          const purposeStr = body.purpose ?? (purposesArr.length ? purposesArr.join(", ") : null);
          const purposesJson = purposesArr.length ? JSON.stringify(purposesArr) : null;
          const { needs_pos, needs_cs } = teamsForPurposes(purposesArr);
          const source = body.source === "admin" ? "admin" : "customer";
          let newId;
          if (date && time_slot) {
            const slot = await env2.DB.prepare(
              "SELECT pos_capacity, cs_capacity, active FROM slots WHERE time=?"
            ).bind(time_slot).first();
            if (!slot || !slot.active) {
              return json({ error: "slot_unavailable", message: "That time slot is not available." }, 409);
            }
            const r = await env2.DB.prepare(
              `INSERT INTO leads(name,phone,company,date,time_slot,purpose,purposes,needs_pos,needs_cs,source)
               SELECT ?,?,?,?,?,?,?,?,?,?
               WHERE
                 ( ?=0 OR (SELECT COALESCE(SUM(needs_pos),0) FROM leads
                           WHERE date=? AND time_slot=? AND stage NOT IN ${DEAD_STAGES}) < ? )
                 AND
                 ( ?=0 OR (SELECT COALESCE(SUM(needs_cs),0) FROM leads
                           WHERE date=? AND time_slot=? AND stage NOT IN ${DEAD_STAGES}) < ? )`
            ).bind(
              name,
              phone,
              company,
              date,
              time_slot,
              purposeStr,
              purposesJson,
              needs_pos,
              needs_cs,
              source,
              needs_pos,
              date,
              time_slot,
              slot.pos_capacity,
              needs_cs,
              date,
              time_slot,
              slot.cs_capacity
            ).run();
            if (!r.meta.changes) {
              return json({ error: "slot_taken", message: "That time slot is fully booked for this service. Please pick another." }, 409);
            }
            newId = r.meta.last_row_id;
          } else {
            const r = await env2.DB.prepare(
              "INSERT INTO leads(name,phone,company,date,time_slot,purpose,purposes,needs_pos,needs_cs,source) VALUES(?,?,?,?,?,?,?,?,?,?)"
            ).bind(name, phone, company, date, time_slot, purposeStr, purposesJson, needs_pos, needs_cs, source).run();
            newId = r.meta.last_row_id;
          }
          if (gcalEnabled(env2)) {
            try {
              const eid = await gcalCreateEvent(env2, { name, phone, company, date, time_slot, purpose: purposeStr });
              if (eid) await env2.DB.prepare("UPDATE leads SET google_event_id=? WHERE id=?").bind(eid, newId).run();
            } catch (e) {
              console.error("[GCal create]", e.message);
            }
          }
          return json({ id: newId, success: true }, 201);
        }
      }
      const leadId = path.match(/^\/api\/leads\/(\d+)$/)?.[1];
      if (leadId) {
        if (method === "GET") {
          const row = await env2.DB.prepare(SEL + " WHERE leads.id=?").bind(leadId).first();
          return row ? json(row) : json({ error: "Lead not found" }, 404);
        }
        if (method === "PUT") {
          const body = await request.json();
          const FIELDS = [
            "name",
            "phone",
            "company",
            "date",
            "time_slot",
            "purpose",
            "attendance",
            "stage",
            "status",
            "products_interest",
            "assigned_staff",
            "quotation_no",
            "invoice_no",
            "notes"
          ];
          const sets = [], vals = [];
          for (const f of FIELDS) {
            if (body[f] !== void 0) {
              sets.push(`${f}=?`);
              vals.push(f === "assigned_staff" ? body[f] || null : body[f]);
            }
          }
          if (body.purposes !== void 0) {
            const arr = Array.isArray(body.purposes) ? body.purposes : [];
            const { needs_pos, needs_cs } = teamsForPurposes(arr);
            sets.push("purposes=?");
            vals.push(arr.length ? JSON.stringify(arr) : null);
            sets.push("needs_pos=?");
            vals.push(needs_pos);
            sets.push("needs_cs=?");
            vals.push(needs_cs);
          }
          if (!sets.length) return json({ success: true, changes: 0 });
          vals.push(leadId);
          const r = await env2.DB.prepare(`UPDATE leads SET ${sets.join(",")} WHERE id=?`).bind(...vals).run();
          if (gcalEnabled(env2) && ["Closed Lost", "Lost"].includes(body.stage)) {
            try {
              const row = await env2.DB.prepare("SELECT google_event_id FROM leads WHERE id=?").bind(leadId).first();
              if (row?.google_event_id) {
                await gcalDeleteEvent(env2, row.google_event_id);
                await env2.DB.prepare("UPDATE leads SET google_event_id=NULL WHERE id=?").bind(leadId).run();
              }
            } catch (e) {
              console.error("[GCal delete]", e.message);
            }
          }
          return r.meta.changes ? json({ success: true }) : json({ error: "Lead not found" }, 404);
        }
        if (method === "DELETE") {
          let eid = null;
          if (gcalEnabled(env2)) {
            const row = await env2.DB.prepare("SELECT google_event_id FROM leads WHERE id=?").bind(leadId).first();
            eid = row?.google_event_id || null;
          }
          const r = await env2.DB.prepare("DELETE FROM leads WHERE id=?").bind(leadId).run();
          if (eid) {
            try {
              await gcalDeleteEvent(env2, eid);
            } catch (e) {
              console.error("[GCal delete]", e.message);
            }
          }
          return r.meta.changes ? json({ success: true }) : json({ error: "Lead not found" }, 404);
        }
      }
      if (path === "/api/sales") {
        if (method === "GET") {
          const { results } = await env2.DB.prepare(`
            SELECT sales.*,leads.name as customer_name,leads.company,leads.stage
            FROM sales LEFT JOIN leads ON sales.appointment_id=leads.id
            ORDER BY sales.closed_date DESC`).all();
          return json(results);
        }
        if (method === "POST") {
          const { appointment_id, invoice_no, quotation_no, amount, items, payment_status } = await request.json();
          if (!appointment_id || !amount) return json({ error: "appointment_id and amount required" }, 400);
          const r = await env2.DB.prepare(
            "INSERT INTO sales(appointment_id,invoice_no,quotation_no,amount,items,payment_status) VALUES(?,?,?,?,?,?)"
          ).bind(appointment_id, invoice_no, quotation_no, amount, items, payment_status || "Pending").run();
          return json({ id: r.meta.last_row_id, success: true }, 201);
        }
      }
      const saleId = path.match(/^\/api\/sales\/(\d+)$/)?.[1];
      if (saleId) {
        if (method === "PUT") {
          const body = await request.json();
          const SFS = ["invoice_no", "quotation_no", "amount", "items", "payment_status"];
          const sets = [], vals = [];
          for (const f of SFS) if (body[f] !== void 0) {
            sets.push(`${f}=?`);
            vals.push(body[f]);
          }
          if (!sets.length) return json({ success: true, changes: 0 });
          vals.push(saleId);
          const r = await env2.DB.prepare(`UPDATE sales SET ${sets.join(",")} WHERE id=?`).bind(...vals).run();
          return json({ changes: r.meta.changes, success: true });
        }
        if (method === "DELETE") {
          const r = await env2.DB.prepare("DELETE FROM sales WHERE id=?").bind(saleId).run();
          return r.meta.changes ? json({ success: true }) : json({ error: "Sale not found" }, 404);
        }
      }
      if (path === "/api/analytics" && method === "GET") {
        const { results: leads } = await env2.DB.prepare("SELECT stage,date FROM leads").all();
        const { results: sales } = await env2.DB.prepare("SELECT amount,payment_status FROM sales").all();
        const prefix = (/* @__PURE__ */ new Date()).toISOString().slice(0, 7);
        const total = leads.length;
        const won = leads.filter((l) => l.stage === "Closed Won").length;
        const lost = leads.filter((l) => ["Closed Lost", "Lost"].includes(l.stage)).length;
        return json({
          total,
          monthlyWalkIns: leads.filter((l) => l.date?.startsWith(prefix)).length,
          won,
          lost,
          pending: total - won - lost,
          conversionRate: total ? parseFloat((won / total * 100).toFixed(1)) : 0,
          totalRevenue: sales.filter((s) => s.payment_status === "Paid").reduce((a, s) => a + (s.amount || 0), 0),
          pendingRevenue: sales.filter((s) => s.payment_status !== "Paid").reduce((a, s) => a + (s.amount || 0), 0),
          quotation: leads.filter((l) => l.stage === "Quotation sent").length,
          invoice: leads.filter((l) => l.stage === "Invoice sent").length,
          contacted: leads.filter((l) => l.stage === "Contacted").length
        });
      }
      if (path === "/api/analytics/funnel" && method === "GET") {
        const { results } = await env2.DB.prepare(
          "SELECT stage,COUNT(*) as count FROM leads GROUP BY stage ORDER BY count DESC"
        ).all();
        return json(results);
      }
      if (path === "/api/analytics/monthly" && method === "GET") {
        const { results } = await env2.DB.prepare(`
          SELECT substr(date,1,7) as month, COUNT(*) as count
          FROM leads WHERE date IS NOT NULL AND date!=''
          GROUP BY month ORDER BY month ASC LIMIT 12`).all();
        return json(results);
      }
      if (path === "/api/analytics/staff" && method === "GET") {
        const { results } = await env2.DB.prepare(`
          SELECT staff.id, staff.name,
            COUNT(leads.id) as total_leads,
            SUM(CASE WHEN leads.stage='Closed Won' THEN 1 ELSE 0 END) as won,
            SUM(CASE WHEN leads.stage IN ('Closed Lost','Lost') THEN 1 ELSE 0 END) as lost,
            ROUND(CAST(SUM(CASE WHEN leads.stage='Closed Won' THEN 1 ELSE 0 END) AS FLOAT)
              / NULLIF(COUNT(leads.id),0)*100,1) as conversion_rate
          FROM staff LEFT JOIN leads ON leads.assigned_staff=staff.id
          GROUP BY staff.id ORDER BY won DESC`).all();
        return json(results);
      }
      return json({ error: "Not found" }, 404);
    } catch (err) {
      console.error("[MIPOS Worker]", err);
      return json({ error: err.message }, 500);
    }
  }
};

// ../../../../../../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env2, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env2);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../../../../../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env2, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env2);
  } catch (e) {
    const error3 = reduceError(e);
    return Response.json(error3, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-eSti9P/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// ../../../../../../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env2, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env2, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env2, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env2, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-eSti9P/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env2, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env2, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env2, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env2, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env2, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env2, ctx) => {
      this.env = env2;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
