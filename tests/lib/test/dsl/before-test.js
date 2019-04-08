require('../../../../init');

var sinon = require('sinon')
  , chai = require('chai')
  , sinonChai = require('sinon-chai')
;

chai.use(sinonChai);

const MEMOIZE = {memoize: true};

function newStub() { return sinon.stub().resolves(true); }

describe("before()", () => {

  prop('callback', newStub, MEMOIZE);

  before(function() { return this.callback(); });

  it('is evaluated before tests in the same context', function() {
    expect(this.callback).to.have.been.called;
  });

  context("with a nested suite", () => {

    it('is inherited', function() {
      expect(this.callback).to.have.been.called;
    });

  });

  context("called sequentially", () => {

    prop('firstCallback',  newStub, MEMOIZE);
    prop('secondCallback', newStub, MEMOIZE);

    before(function() { return this.firstCallback(); });
    before(function() { return this.secondCallback(); });

    it('chains the functions together', function() {
      expect(this.firstCallback).to.have.been.called;
      expect(this.secondCallback).to.have.been.called;
    });

  });

});
