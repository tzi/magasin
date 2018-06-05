const safeGet = require("just-safe-get");
const safeSet = require("just-safe-set");

const isObject = mixed => typeof mixed === "object" && mixed !== null;
const clone = object => Object.assign({}, object);

module.exports = function() {
  let seed = {};

  function get(keys) {
    return safeGet(seed, keys);
  }

  function set(keys, value) {
    const isSet = safeSet(seed, keys, value);
    if (!isSet) {
      return false;
    }

    // Force immutable seed
    const remainingKeys = typeof keys === "string" ? keys.split(".") : keys;
    seed = clone(seed);
    let object = seed;
    let key;
    while ((key = remainingKeys.shift()) && isObject(object[key])) {
      object[key] = clone(object[key]);
      object = object[key];
    }

    return true;
  }

  return {
    get,
    set
  };
};
