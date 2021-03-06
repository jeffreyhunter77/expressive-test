require('../../../../init');

var sinon = require('sinon')
  , chai = require('chai')
  , sinonChai = require('sinon-chai')
  , dsl = require('../../../../lib/test/test-dsl')
;

chai.use(sinonChai);

describe("it()", () => {

  prop('summary',         'assertion summary');
  prop('body',            function() { return sinon.spy(); });
  prop('result',          function() { return dsl.it(this.summary, this.body); });
  prop('testInstance',    function() { return new this.result(); });
  prop('testDescription', function() { return this.testInstance.description(); });

  before(function() { sinon.stub(TestRegistry, 'add'); });
  after(function()  { TestRegistry.add.restore(); });

  it("creates a test case", function() {
    expect(this.result.prototype).to.be.an.instanceof(TestCase);
  });

  it("sets the description", function() {
    expect(this.testDescription).to.equal(this.summary);
  });

  it("does not evaluate the body", function() {
    this.result;
    expect(this.body).to.not.have.been.called;
  });

  context("when the test is run", function() {

    before(async function() { await this.testInstance.run(); });

    it("evaluates the body", function() {
      expect(this.body).to.have.been.calledOnce;
    });

    it("uses the test case instance for 'this'", function() {
      expect(this.body).to.have.been.calledOn(this.testInstance);
    });

    it("passes the test case instance", async function() {
      expect(this.body).to.have.been.calledWith(this.testInstance);
    });

  });

  context("without a body", function() {

    prop('result', function() { return dsl.it(this.summary); });

    it("sets the test to pending", function() {
      expect(this.testInstance.isPending()).to.be.true;
    });

  });

  context("when called as xit", function() {

    prop('result', function() { return dsl.xit(this.summary, this.body); });

    it("sets the test to pending", function() {
      expect(this.testInstance.isPending()).to.be.true;
    });

  });

  context("nested in a describe", function() {

    prop('result', function() {
      let innerClass;

      this.containerClass = dsl.describe("outside", () => {
        innerClass = dsl.it("inside", () => {});
      });

      return innerClass;
    });

    it("adds the test to the containing suite", function() {
      let testClass = this.result
      let containerInst = new this.containerClass();

      expect(containerInst.tests()).to.be.an('array').that.includes(testClass);
    });

  });

});
