require('../../../init');

var TestRunner = require('../../../lib/test/test-runner');

var sinon = require('sinon')
  , chai = require('chai')
  , sinonChai = require('sinon-chai')
;

chai.use(sinonChai);

const MEMOIZE = {memoize: true};

function newStub()        { return sinon.stub(); }
function newFalseStub()   { return sinon.stub().returns(false); }
function newErrorStub()   { return sinon.stub().throws(new Error('failure')); }
function newResolveStub() { return sinon.stub().resolves(1); }
function newRejectStub()  { return sinon.stub().rejects(new Error('failure')); }

describe("TestRunner", () => {

  prop('passed', function() { return this.runner.didPass(); });
  prop('runner', function() { return new TestRunner(this.tests); }, MEMOIZE);

  prop('firstConstructor', newStub,        MEMOIZE);
  prop('firstTestMethod',  newStub,        MEMOIZE);
  prop('secondTestMethod', newResolveStub, MEMOIZE);

  prop('FirstTest', function() {
    let ctor = this.firstConstructor;

    class FirstTestCase extends TestCase {
      constructor(container) {
        super(container);
        ctor();
      }
    }

    FirstTestCase.prototype._test = this.firstTestMethod;

    if (this.runMethod)
      FirstTestCase.prototype.run = this.runMethod;
    if (this.didSucceedMethod)
      FirstTestCase.prototype.didSucceed = this.didSucceedMethod;

    return FirstTestCase;
  }, MEMOIZE);

  prop('SecondTest', function() {
    class SecondTestCase extends TestCase {
    }
    SecondTestCase.prototype._test = this.secondTestMethod;

    return SecondTestCase;
  }, MEMOIZE);


  context("with one or more tests", () => {

    prop('tests', function() { return [this.FirstTest, this.SecondTest]; }, MEMOIZE);

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

    context("when a test constructor throws an exception", () => {

      prop('firstConstructor', newErrorStub, MEMOIZE);

      it("does not pass", function() {
        expect(this.passed).to.be.false;
      });

    });

    context("when a test throws an exception", () => {

      prop('firstTestMethod', newErrorStub, MEMOIZE);

      it("does not pass", function() {
        expect(this.passed).to.be.false;
      });

    });

    context("when a test fails", () => {

      prop('didSucceedMethod', newFalseStub, MEMOIZE);

      it("does not pass", function() {
        expect(this.passed).to.be.false;
      });

    });

    context("when a test rejects", () => {

      prop('runMethod', newRejectStub, MEMOIZE);

      it("does not pass", function() {
        expect(this.passed).to.be.false;
      });

      it("runs subsequent tests", function() {
        expect(this.secondTestMethod).to.have.been.called;
      });

    });

  });

});
