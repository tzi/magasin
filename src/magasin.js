const compare = require("just-compare");
const createSeed = require("./createSeed");

const toArray = mixed => (Array.isArray(mixed) ? mixed : [mixed]);

function select(seed, selector) {
  if (typeof selector === "function") {
    return toArray(selector(seed.get));
  }

  return toArray(selector).map(seed.get);
}

module.exports = function() {
  let maxId = 1;
  const seed = createSeed();
  const handlers = {};

  function onUpdate(selector, onChange) {
    let selection;

    function check() {
      const previousSelection = selection;
      update();
      if (!compare(previousSelection, selection)) {
        onChange.apply(this, selection.concat([unsubscribe, seed.get]));
      }
    }

    function update() {
      selection = select(seed, selector);
    }

    update();
    const unsubscribe = registerHandler({
      check,
      update
    });

    return unsubscribe;
  }

  function onMatch(selector, onTrue, onFalse) {
    let selection;

    function check() {
      const previousSelection = selection;
      update();
      if (!previousSelection && selection) {
        onTrue(unsubscribe, seed.get);
      }
      if (onFalse && previousSelection && !selection) {
        onFalse(unsubscribe, seed.get);
      }
    }

    function update() {
      selection = select(seed, selector).every(Boolean);
    }

    check();
    const unsubscribe = registerHandler({
      check,
      update
    });

    return unsubscribe;
  }

  function registerHandler(handler) {
    const id = maxId++;
    const unsubscribe = () => delete handlers[id];
    handlers[id] = handler;

    return unsubscribe;
  }

  function addState(scope) {
    const prefix = chain => `${scope}.${chain}`;

    function update(chain, value) {
      seed.set(prefix(chain), value);
      Object.values(handlers).forEach(handler => {
        handler.check();
      });
    }

    function get(chain) {
      return seed.get(prefix(chain));
    }

    return function initState(state = {}) {
      seed[scope] = state;
      Object.values(handlers).forEach(handler => {
        handler.update();
      });

      return {
        get,
        update
      };
    };
  }

  function getListener() {
    return {
      onUpdate,
      onMatch
    };
  }

  return {
    addState,
    getListener
  };
};
