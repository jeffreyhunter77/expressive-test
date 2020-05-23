require('../../../init');

var chai = require('chai')
  , sinon = require('sinon')
  , sinonChai = require('sinon-chai')
  , chaiAsPromised = require('chai-as-promised')
;

chai.use(sinonChai);
chai.use(chaiAsPromised);

describe('TestRegistry', () => {

  prop('registry',        function() { return new TestRegistry.constructor(); });
  prop('exampleTest',     function() { return class extends TestCase {}; });
  prop('registeredTests', function() { return this.registry._tests; });
  prop('callback',        function() { return sinon.spy(); });

  describe('.add()', () => {

    it('adds a test class', function() {
      this.registry.add(this.exampleTest);
      expect(this.registeredTests).to.be.an('array').that.includes(this.exampleTest);
    });

  });

  describe('.tests()', () => {

    it('returns the list of registered classes', function() {
      expect(this.registry.tests()).to.equal(this.registeredTests);
    });

  });

  describe('.beforeAnything()', () => {

    it('adds a callback for the setup() function', function() {
      this.registry.beforeAnything(this.callback);

      return this.registry.setup()
        .then(() => expect(this.callback).to.have.been.called);
    });

  });

  describe('.afterEverything()', () => {

    it('adds a callback for the teardown() function', function() {
      this.registry.afterEverything(this.callback);

      return this.registry.teardown()
        .then(() => expect(this.callback).to.have.been.called);
    });

  });

  describe('.setup()', () => {

    it('resolves when no hooks have been added', function() {
      return expect(this.registry.setup()).to.be.fulfilled;
    });

  });

  describe('.teardown()', () => {

    it('resolves when no hooks have been added', function() {
      return expect(this.registry.teardown()).to.be.fulfilled;
    });

  });

  it('provides a default registry', function() {
    expect(TestRegistry.add).to.be.a('function');
    expect(TestRegistry.tests).to.be.a('function');
    expect(TestRegistry.beforeAnything).to.be.a('function');
    expect(TestRegistry.afterEverything).to.be.a('function');
    expect(TestRegistry.setup).to.be.a('function');
    expect(TestRegistry.teardown).to.be.a('function');
  });

});
