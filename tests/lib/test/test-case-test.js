require('../../../init');

var sinon = require('sinon')
  , chai = require('chai')
  , sinonChai = require('sinon-chai')
;

chai.use(sinonChai);

describe(TestCase, () => {

  prop('subject', function() { return new this.describedClass(); });

  describe(".constructor()", () => {
    context("when called no arguments", () => {
      it("has no container", function() {
        expect(this.subject.container).to.be.undefined;
      });
    });

    context("when called with a container", () => {
      prop('subject', function() { return new this.describedClass(this.parent); });
      prop('parent', function() { return {}; }, {memoize: true});

      it("references the container", function() {
        expect(this.subject.container).to.equal(this.parent);
      });
    });
  });

  describe(".description()", () => {
    it("returns the name of the class", function() {
      expect(this.subject.description()).to.equal(this.describedClass.name);
    });
  });

  describe(".fullDescription()", () => {
    context("without a container", () => {
      it("returns the description", function() {
        expect(this.subject.fullDescription()).to.equal(this.subject.description())
      });
    });

    context("when called with a container", () => {
      prop('subject', function() { return new this.describedClass(this.parent); });
      prop('parentClass', function() { return TestSuite; });
      prop('parent', function() { return new this.parentClass; }, {memoize: true});

      it("prepends the parent description", function() {
        expect(this.subject.fullDescription()).to
          .equal(this.parent.description() + ' ' + this.subject.description());
      });
    });
  });

  describe(".run()", () => {
    prop('_testFunction', function() { return sinon.spy(); }, {memoize: true});
    prop('testStartedListener', function() { return sinon.spy(); }, {memoize: true});
    prop('testCompletedListener', function() { return sinon.spy(); }, {memoize: true});
    prop('testErrorListener', function() { return sinon.spy(); }, {memoize: true});

    prop('subject', function() {
      class CustomTestCase extends TestCase {
      }
      CustomTestCase.prototype._test = this._testFunction;

      let subject = new CustomTestCase();
      subject.addListener('test-started', this.testStartedListener);
      subject.addListener('test-completed', this.testCompletedListener);
      subject.addListener('test-error', this.testErrorListener);

      return subject;
    }, {memoize: true});

    before(function() { return this.subject.run(); });

    it("invokes _test()", function() {
      expect(this._testFunction).to.have.been.calledOnce;
    });

    it("emits a test-started event", function() {
      expect(this.testStartedListener).to.have.been.calledWith(this.subject);
    });

    function itBehavesLikeASuccessfulTest() {
      it("resolves", function() {
        return this.subject.run().then(() => {});
      });

      it("succeeds", function() {
        expect(this.subject.didSucceed()).to.be.true;
      });

      it("does not emit a test-error event", function() {
        expect(this.testErrorListener).to.not.have.been.called;
      });

      it("emits a test-completed event", function() {
        expect(this.testCompletedListener).to.have.been.calledWith(this.subject);
      });
    }

    function itBehavesLikeAFailedTest() {
      it("resolves", function() {
        return this.subject.run().then(() => {});
      });

      it("does not succeed", function() {
        expect(this.subject.didSucceed()).to.be.false;
      });

      it("emits a test-error event", function() {
        expect(this.testErrorListener).to.have.been.calledWith(this.subject);
        expect(this.testErrorListener.firstCall.args[1]).to.be.an.instanceof(Error);
      });

      it("emits a test-completed event", function() {
        expect(this.testCompletedListener).to.have.been.calledWith(this.subject);
      });
    }

    context("when _test() completes immediately", () => {
      prop('_testFunction', function() { return function() { return 1; } });
      itBehavesLikeASuccessfulTest();
    });

    context("when _test() throws an exception", () => {
      prop('_testFunction', function() { return function() { throw new Error('uh oh!'); } });
      itBehavesLikeAFailedTest();
    });

    context("when _test() returns a promise that resolves", () => {
      prop('_testFunction', function() {
        return function() { return new Promise(r => process.nextTick(r)); }
      });
      itBehavesLikeASuccessfulTest();
    });

    context("when _test() returns a promise that rejects", () => {
      prop('_testFunction', function() {
        return function() { return new Promise(r => process.nextTick(r))
                              .then(() => { throw new Error('uh oh!') }); }
      });
      itBehavesLikeAFailedTest();
    });
  });

  describe(".didSucceed()", () => {
    context("without running the test", () => {
      it("returns false", function() {
        expect(this.subject.didSucceed()).to.be.false;
      });
    });
  });

  describe(".isSuite()", () => {
    it("returns false", function() {
      expect(this.subject.isSuite()).to.be.false;
    });
  });

});
