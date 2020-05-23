require('../../../init');

var TestRunner = require('../../../lib/test/test-runner');

var sinon = require('sinon')
  , chai = require('chai')
  , sinonChai = require('sinon-chai')
;

chai.use(sinonChai);

function newStub()        { return sinon.stub(); }
function newFalseStub()   { return sinon.stub().returns(false); }
function newErrorStub()   { return sinon.stub().throws(new Error('failure')); }
function newResolveStub() { return sinon.stub().resolves(1); }
function newRejectStub()  { return sinon.stub().rejects(new Error('failure')); }

describe("TestRunner", () => {

  prop('passed', function() { return this.runner.didPass(); });
  prop('runner', function() { return new TestRunner(this.tests); });

  prop('firstConstructor', newStub);
  prop('firstTestMethod',  newStub);
  prop('secondTestMethod', newResolveStub);

  prop('FirstTest',  newTestCase('first'));
  prop('SecondTest', newTestCase('second'));


  context("with one or more tests", () => {

    prop('tests', function() { return [this.FirstTest, this.SecondTest]; });

    before(function() { return this.runner.run(); });

    it("runs all tests", function() {
      expect(this.firstTestMethod).to.have.been.called;
      expect(this.secondTestMethod).to.have.been.called;
    });


    context("when all tests succeed", () => {

      it("passes", function() {
        expect(this.passed).to.be.true;
      });

    });

    context("when a test is pending", () => {

      prop('firstConstructor', () => function() { this.setPending(true); });

      it("passes", function() {
        expect(this.passed).to.be.true;
      });

    });

    context("when a test constructor throws an exception", () => {

      prop('firstConstructor', newErrorStub);

      it("does not pass", function() {
        expect(this.passed).to.be.false;
      });

    });

    context("when a test throws an exception", () => {

      prop('firstTestMethod', newErrorStub);

      it("does not pass", function() {
        expect(this.passed).to.be.false;
      });

    });

    context("when a test fails", () => {

      prop('firstDidSucceedMethod', newFalseStub);

      it("does not pass", function() {
        expect(this.passed).to.be.false;
      });

    });

    context("when a test rejects", () => {

      prop('firstRunMethod', newRejectStub);

      it("does not pass", function() {
        expect(this.passed).to.be.false;
      });

      it("runs subsequent tests", function() {
        expect(this.secondTestMethod).to.have.been.called;
      });

    });

  });

});


function newTestCase(prefix) {
  return function() {
    let ctor = this[prefix + 'Constructor'];

    let decl = class extends TestCase {
      constructor(container) {
        super(container);
        if (ctor) ctor.apply(this);
      }
    }

    decl.prototype._test = this[prefix + 'TestMethod'];
    decl._prefix = () => prefix;

    if (this[prefix + 'RunMethod'])
      decl.prototype.run = this[prefix + 'RunMethod'];

    if (this[prefix + 'DidSucceedMethod'])
      decl.prototype.didSucceed = this[prefix + 'DidSucceedMethod'];

    return decl;
  };
}
