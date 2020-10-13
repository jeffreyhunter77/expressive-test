require('../../../../init');

var sinon = require('sinon')
  , chai = require('chai')
  , sinonChai = require('sinon-chai')
;

chai.use(sinonChai);


describe("property()", () => {

  property('one', function() { return 1; });

  it("defines a property on the test class", function() {
    expect(this.one).to.equal(1);
  });

  context("with an inner test suite", () => {

    it("is inherited", function() {
      expect(this.one).to.equal(1);
    });

    context("with an override", () => {

      property('one', function() { return 'one'; });

      it("is overridden", function() {
        expect(this.one).to.equal('one');
      });

    });

  });

  context('when called with a literal value', () => {

    property('two', 2);

    it("defines a property with the literal value", function() {
      expect(this.two).to.equal(2);
    });

  });

  context('when called without a memoize option', () => {

    property('subject', function () { return new Object(); });

    it("memoizes the function", function() {
      expect(this.subject).to.equal(this.subject);
    });

    context("when calling the function", () => {

      let getterFunction = sinon.stub();

      property('subject', getterFunction);

      before(function() { this.subject });

      it("sets 'this' to the current test", function() {
        expect(getterFunction).to.have.been.calledOn(this);
      });

      it("passes the current test as an argument", function() {
        expect(getterFunction).to.have.been.calledWith(this);
      });

    });

    context("when the function returns undefined", () => {

      let fn = sinon.stub();

      property('subject', fn);

      before(function() { this.subject; this.subject; });

      it("still memoizes the function", function() {
        expect(fn).to.have.been.calledOnce;
      });

    });

  });

  context('when called with a "memoize: false" option', () => {

    property('subject', function () { return new Object(); }, {memoize: false});

    it("does not memoize the function", function() {
      expect(this.subject).to.not.equal(this.subject);
    });

    context("when calling the function", () => {

      let getterFunction = sinon.stub();

      property('subject', getterFunction, {memoize: false});

      before(function() { this.subject });

      it("sets 'this' to the current test", function() {
        expect(getterFunction).to.have.been.calledOn(this);
      });

      it("passes the current test as an argument", function() {
        expect(getterFunction).to.have.been.calledWith(this);
      });

    });

  });

});
