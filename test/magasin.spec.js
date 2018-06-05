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
      main: true,
      isInTheSixDuchies: false,
    })
  });

  describe('.onUpdate()', () => {
    it('should give the right value', () => {
      listener.onUpdate('character.where', where => {
        assert.equal(where, 'Castelcerf');
      });
      state.update('firstName', 'Fitz');
      state.update('where', 'Castelcerf');
    });

    it('should be updated three times', () => {
      let count = 0;
      listener.onUpdate('character.where', () => {
        count++;
      });
      assert.equal(count, 0);
      state.update('where', 'Castelcerf');
      assert.equal(count, 1);
      state.update('firstName', 'Fitz');
      assert.equal(count, 1);
      state.update('where', 'Six-Duchés');
      assert.equal(count, 2);
      state.update('where', 'Royaume des montagnes');
      assert.equal(count, 3);
      state.update('firstName', 'Fitz');
      assert.equal(count, 3);
    });

    it('should support function in selector', () => {
      let count = 0;
      listener.onUpdate(
        get => get('character.where'),
        () => count++
      );
      assert.equal(count, 0);
      state.update('where', 'Castelcerf');
      assert.equal(count, 1);
    });
  });

  describe('.onMatch()', () => {
    it('should directly match', () => {
      listener.onMatch('character.main', () => {
        assert.ok(true);
      });
    });

    it('should match once', () => {
      let count = 0;
      listener.onMatch('character.isInTheSixDuchies', () => {
        count++;
      });
      assert.equal(count, 0);
      state.update('where', 'Castelcerf');
      assert.equal(count, 0);
      state.update('isInTheSixDuchies', true);
      assert.equal(count, 1);
    });

    it('should support function in selector', () => {
      let count = 0;
      listener.onMatch(
        get => get('character.isInTheSixDuchies'),
        () => count++
      );
      assert.equal(count, 0);
      state.update('isInTheSixDuchies', true);
      assert.equal(count, 1);
    });
  });
});
