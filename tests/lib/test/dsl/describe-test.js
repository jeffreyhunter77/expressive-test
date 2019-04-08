require('../../../../init');

var sinon = require('sinon')
  , chai = require('chai')
  , sinonChai = require('sinon-chai')
  , dsl = require('../../../../lib/test/test-dsl')
;

chai.use(sinonChai);

describe("describe()", () => {

  prop('describedItem',   'item');
  prop('body',            function() { return sinon.spy(); }, {memoize: true});
  prop('result',          function() { return dsl.describe(this.describedItem, this.body); });
  prop('resultInstance',  function() { return new this.result(); });
  prop('testDescription', function() { return this.resultInstance.description(); });
  prop('testContext',     function() { return new this.result._context(); });

  before(function() { sinon.stub(TestRegistry, 'add'); });
  after(function()  { TestRegistry.add.restore(); });

  it("creates a test suite", function() {
    expect(this.result.prototype).to.be.an.instanceof(TestSuite);
  });

  it("sets the description", function() {
    expect(this.testDescription).to.equal(this.describedItem);
  });

  context("when a constructor is provided", function() {

    prop('describedItem', function() { return class Item { }; }, {memoize: true});

    it("uses the constructor name as the description", function() {
      expect(this.testDescription).to.equal('Item');
    });

    it("saves the constructor in the describedClass property", function() {
      expect(this.testContext.describedClass).to.equal(this.describedItem);
    });

  });

  it("evaluates the body", function() {
    this.result;
    expect(this.body).to.have.been.calledOnce;
  });

  context("standalone", function() {

    it("registers the test", function() {
      let testClass = this.result;
      expect(TestRegistry.add).to.have.been.calledWith(testClass);
    });

  });

  context("nested", function() {

    prop('result', function() {
      let innerClass;

      this.containerClass = dsl.describe(this.describedItem, () => {
        innerClass = dsl.describe("inside", () => {});
      });

      return innerClass;
    });

    it("does not register the test", function() {
      let testClass = this.result;
      expect(TestRegistry.add).to.not.have.been.calledWith(testClass);
    });

    it("adds the test to the containing suite", function() {
      let testClass = this.result
      let containerInst = new this.containerClass();

      expect(containerInst.tests()).to.be.an('array').that.includes(testClass);
    });

  });

});
