const magasin = require('../src/magasin');
const assert = require('assert');

describe('Magasin', () => {
  let store;
  let listener;
  let state;

  beforeEach(() => {
    store = magasin();
    listener = store.getListener();
    state = store.addState('character')({
      firstName: 'FitzChevalerie',
      lastName: 'Loinvoyant',
      where: 'Royaume des montagnes',
      main: true
    })
  });

  describe('.onUpdate()', () => {
    it('should be updated once', () => {
      let count = 0;
      listener.onUpdate('character.where', where => {
        count++;
        assert.equal(where, 'Castelcerf');
      });
      state.update('firstName', 'Fitz');
      state.update('where', 'Castelcerf');

      assert.equal(count, 1);
    });

    it('should be updated three times', () => {
      let count = 0;
      listener.onUpdate('character.where', () => {
        count++;
      });
      state.update('where', 'Castelcerf');
      state.update('firstName', 'Fitz');
      state.update('where', 'Six-Duchés');
      state.update('where', 'Royaume des montagnes');
      state.update('firstName', 'Fitz');

      assert.equal(count, 3);
    });
  });

  describe('.onMatch()', () => {
    it('should directly match', () => {
      listener.onMatch('character.main', () => {
        assert.ok(true);
      });
    });
  });
});
