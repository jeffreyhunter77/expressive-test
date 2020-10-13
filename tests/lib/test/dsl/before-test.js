require('../../../../init');

var sinon = require('sinon')
  , chai = require('chai')
  , sinonChai = require('sinon-chai')
;

chai.use(sinonChai);

function newStub() { return sinon.stub().resolves(true); }

describe("before()", () => {

  prop('callback', newStub);

  before(function() { return this.callback(); });

  it('aliases beforeEach to before', () => {
    expect(beforeEach).to.equal(before);
  });

  it('is evaluated before tests in the same context', function() {
    expect(this.callback).to.have.been.called;
  });

  context("with a nested suite", () => {

    it('is inherited', function() {
      expect(this.callback).to.have.been.called;
    });

  });

  context("called sequentially", () => {

    prop('firstCallback',  newStub);
    prop('secondCallback', newStub);

    before(function() { return this.firstCallback(); });
    before(function() { return this.secondCallback(); });

    it('chains the functions together', function() {
      expect(this.firstCallback).to.have.been.called;
      expect(this.secondCallback).to.have.been.called;
    });

  });

  context("when calling the function", () => {

    let hook = newStub();

    before(hook);

    it("sets 'this' to the current test", function() {
      expect(hook).to.have.been.calledOn(this);
    });

    it("passes the current test as an argument", function() {
      expect(hook).to.have.been.calledWith(this);
    });

  });

});
