/* c8 ignore start */
// CommonJS wrapper for ESM module
// This allows the package to be used with require() in CommonJS projects

let yoinkModule = null;
let loadPromise = null;

function loadModule() {
  if (!loadPromise) {
    loadPromise = import("./index.js").then((mod) => {
      yoinkModule = mod.default;
      // Copy all static methods
      Object.keys(mod.default).forEach((key) => {
        yoink[key] = mod.default[key];
      });
      return yoinkModule;
    });
  }
  return loadPromise;
}

// Eagerly start loading the module
loadModule();

function yoink(message, data) {
  if (yoinkModule) {
    return yoinkModule(message, data);
  }
  // If module isn't loaded yet, queue the call
  loadModule().then((mod) => mod(message, data));
}

yoink.info = (message, data) => {
  if (yoinkModule) return yoinkModule.info(message, data);
  loadModule().then((mod) => mod.info(message, data));
};

yoink.warn = (message, data) => {
  if (yoinkModule) return yoinkModule.warn(message, data);
  loadModule().then((mod) => mod.warn(message, data));
};

yoink.error = (message, data) => {
  if (yoinkModule) return yoinkModule.error(message, data);
  loadModule().then((mod) => mod.error(message, data));
};

yoink.debug = (message, data) => {
  if (yoinkModule) return yoinkModule.debug(message, data);
  loadModule().then((mod) => mod.debug(message, data));
};

yoink.success = (message, data) => {
  if (yoinkModule) return yoinkModule.success(message, data);
  loadModule().then((mod) => mod.success(message, data));
};

// Array slicing methods
yoink.first = (data, message) => {
  if (yoinkModule) return yoinkModule.first(data, message);
  loadModule().then((mod) => mod.first(data, message));
};

yoink.five = (data, message) => {
  if (yoinkModule) return yoinkModule.five(data, message);
  loadModule().then((mod) => mod.five(data, message));
};

yoink.ten = (data, message) => {
  if (yoinkModule) return yoinkModule.ten(data, message);
  loadModule().then((mod) => mod.ten(data, message));
};

// yoink.last is a function with .five() and .ten() methods
yoink.last = (data, message) => {
  if (yoinkModule) return yoinkModule.last(data, message);
  loadModule().then((mod) => mod.last(data, message));
};

yoink.last.five = (data, message) => {
  if (yoinkModule) return yoinkModule.last.five(data, message);
  loadModule().then((mod) => mod.last.five(data, message));
};

yoink.last.ten = (data, message) => {
  if (yoinkModule) return yoinkModule.last.ten(data, message);
  loadModule().then((mod) => mod.last.ten(data, message));
};

// Export a ready promise for users who want to ensure module is loaded
yoink.ready = loadModule;

// Replace console methods with yoink if YOINK_REPLACE_CONSOLE_LOG is set
if (process.env.YOINK_REPLACE_CONSOLE_LOG) {
  function replaceConsole() {
    const originalConsole = { ...console };

    // Replace console.log with yoink
    console.log = yoink;

    // Replace other console methods with their yoink equivalents
    console.info = yoink.info;
    console.warn = yoink.warn;
    console.error = yoink.error;
    console.debug = yoink.debug;

    // Preserve other console methods (dir, table, trace, etc.)
    // They remain on the original console object
  }

  // If module is already loaded, replace immediately
  if (yoinkModule) {
    replaceConsole();
  } else {
    // Otherwise wait for module to load
    loadModule().then(replaceConsole);
  }
}

module.exports = yoink;
/* c8 ignore stop */
