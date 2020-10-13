require('../../../../init');

var sinon = require('sinon')
  , chai = require('chai')
  , sinonChai = require('sinon-chai')
;

chai.use(sinonChai);

let callback = sinon.stub().resolves(true);

let firstCallback = sinon.stub().resolves(true);
let secondCallback = sinon.stub().resolves(true);

describe("after()", () => {

  after(function() { return callback(); });

  it('after running a test', function() { });

  it('is evaluated after tests in the same context', function() {
    expect(callback).to.have.been.calledOnce;
  });

  context("with a nested suite", () => {

    it('after running a test', function() { });

    it('is inherited', function() {
      expect(callback).to.have.been.calledThrice;
    });

  });

  context("called sequentially", () => {

    after(function() { return firstCallback(); });
    after(function() { return secondCallback(); });

    it('after running a test', function() { });

    it('chains the functions together', function() {
      expect(firstCallback).to.have.been.called;
      expect(secondCallback).to.have.been.called;
    });

  });

  it('aliases afterEach to after', () => {
    expect(afterEach).to.equal(after);
  });

});
