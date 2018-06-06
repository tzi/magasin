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
      if (previousSelection.some((element, index) => element !== selection[index])) {
        onChange.apply(this, selection.concat([unsubscribe, seed.get]));
      }
    }

    function update() {
      selection = select(seed, selector);
    }

    const unsubscribe = registerHandler({
      check,
      update
    });
    update();

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

    const unsubscribe = registerHandler({
      check,
      update
    });
    check();

    return unsubscribe;
  }

  function registerHandler(handler) {
    const id = maxId++;
    const unsubscribe = () => delete handlers[id];
    handlers[id] = handler;

    return unsubscribe;
  }

  function addState(stateName) {
    const prefix = chain => `${stateName}.${chain}`;

    function update(chain, value) {
      seed.set(prefix(chain), value);
      Object.values(handlers).forEach(handler => {
        handler.check();
      });
    }

    function get(chain) {
      return seed.get(prefix(chain));
    }

    return function initState(initialState = {}) {
      seed.set(stateName, initialState);
      Object.values(handlers).forEach(handler => {
        handler.update();
      });

      return {
        name: stateName,
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
