var just = (function() {
  function set(rootObj, props, value) {
    var lastProp = props.pop();
    if (typeof lastProp === "undefined") {
      return false;
    }
    var obj = rootObj;
    var thisProp;
    var breadcrumb = [];
    while ((thisProp = props.shift())) {
      if (typeof obj[thisProp] == "undefined") {
        obj[thisProp] = {};
      }
      obj = obj[thisProp];
      breadcrumb.push(thisProp);
      if (!obj || typeof obj != "object") {
        return false;
      }
    }
    if (obj[lastProp] !== value) {
      if ({}.toString.call(value) == "[object Object]") {
        breadcrumb.push(lastProp);
      }
      obj[lastProp] = value;
      obj = rootObj;
      while ((thisProp = breadcrumb.shift())) {
        obj[thisProp] = Object.assign({}, obj[thisProp]);
        obj = obj[thisProp];
      }
    }
    return true;
  }

  function get(obj, props) {
    if (typeof props == "string") {
      props = props.split(".");
    }
    var prop;
    while ((prop = props.shift())) {
      obj = obj[prop];
      if (!obj) {
        return obj;
      }
    }
    return obj;
  }

  function compare(value1, value2) {
    if (value1 === value2) {
      return true;
    }
    if (typeof value1 != typeof value2) {
      return false;
    }
    if (value1 !== Object(value1)) {
      // non equal primitives
      return false;
    }
    if (!value1) {
      return false;
    }
    if (Array.isArray(value1)) {
      return compareArrays(value1, value2);
    }
    if ({}.toString.call(value1) == "[object Object]") {
      return compareObjects(value1, value2);
    }
    return compareNativeSubtypes(value1, value2);
  }

  function compareNativeSubtypes(value1, value2) {
    // e.g. Function, RegExp, Date
    return value1.toString() === value2.toString();
  }

  function compareArrays(value1, value2) {
    var len = value1.length;
    if (len != value2.length) {
      return false;
    }
    var alike = true;
    for (var i = 0; i < len; i++) {
      if (!compare(value1[i], value2[i])) {
        alike = false;
        break;
      }
    }
    return alike;
  }

  function compareObjects(value1, value2) {
    var keys1 = Object.keys(value1).sort();
    var keys2 = Object.keys(value2).sort();
    var len = keys1.length;
    if (len != keys2.length) {
      return false;
    }
    for (var i = 0; i < len; i++) {
      var key1 = keys1[i];
      var key2 = keys2[i];
      if (!(key1 == key2 && compare(value1[key1], value2[key2]))) {
        return false;
      }
    }
    return true;
  }

  return {
    set: set,
    get: get,
    compare: compare
  };
})();

function select(seed, selector) {
  if (typeof selector === "function") {
    var result = selector(seed);
    if (!Array.isArray(result)) {
      return [result];
    }

    return result;
  }

  var keys = selector;
  if (!Array.isArray(selector)) {
    keys = [keys];
  }

  return keys.map(function(key) {
    return just.get(seed, key);
  });
}

export default function() {
  var maxId = 1;
  var seed = {};
  var handlers = {};

  function getSeed() {
    return seed;
  }

  function onUpdate(selector, onChange) {
    var selection;

    function check() {
      var previousSelection = selection;
      update();
      if (!just.compare(previousSelection, selection)) {
        onChange.apply(this, selection.concat([unsubscribe, seed]));
      }
    }

    function update() {
      selection = select(seed, selector);
    }

    var id = maxId++;
    handlers[id] = {
      check,
      update
    };
    var unsubscribe = () => delete handlers[id];
    update();

    return unsubscribe;
  }

  function onMatch(selector, onTrue, onFalse) {
    var selection;

    function handleChange() {
      var previousSelection = selection;
      selection = select(seed, selector).every(Boolean);
      if (!previousSelection && selection) {
        onTrue(unsubscribe, seed);
      }
      if (onFalse && previousSelection && !selection) {
        onFalse(unsubscribe, seed);
      }
    }

    var id = maxId++;
    handlers[id] = handleChange;
    var unsubscribe = () => delete handlers[id];
    handleChange();

    return unsubscribe;
  }

  function addState(scope) {
    function prefix(props) {
      if (typeof props === "string") {
        props = props.split(".");
      }
      props.unshift(scope);

      return props;
    }

    function update(props, value) {
      props = prefix(props);
      just.set(seed, props, value);
      Object.values(handlers).forEach(function(handler) {
        handler.check();
      });
    }

    function get(props) {
      props = prefix(props);

      return just.get(seed, props);
    }

    return function initState(state = {}) {
      seed[scope] = state;
      Object.values(handlers).forEach(function(handler) {
        handler.update();
      });

      return {
        get: get,
        update: update
      };
    };
  }

  function getListener() {
    return {
      onUpdate: onUpdate,
      onMatch: onMatch
    };
  }

  return {
    getSeed: getSeed,
    addState: addState,
    getListener: getListener
  };
};
