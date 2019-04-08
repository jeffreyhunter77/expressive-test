require('../../../../init');

var sinon = require('sinon')
  , chai = require('chai')
  , sinonChai = require('sinon-chai')
;

chai.use(sinonChai);

let callback = sinon.stub().resolves(true);

let firstCallback = sinon.stub().resolves(true);
let secondCallback = sinon.stub().resolves(true);

describe("beforeAll()", () => {

  beforeAll(callback);

  it('is evaluated once before tests in the same context', function() {
    expect(callback).to.have.been.calledOnce;
  });

  it('is not called on subsequent test invocations', function() {
    expect(callback).to.have.been.calledOnce;
  });

  context("called sequentially", () => {

    beforeAll(firstCallback);
    beforeAll(secondCallback);

    it('chains the functions together', function() {
      expect(firstCallback).to.have.been.called;
      expect(secondCallback).to.have.been.called;
    });

  });

});
