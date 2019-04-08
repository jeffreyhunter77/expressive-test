require('../../../../init');

var sinon = require('sinon')
  , chai = require('chai')
  , sinonChai = require('sinon-chai')
;

chai.use(sinonChai);

let callback = sinon.stub().resolves(true);
let secondCallback = sinon.stub().resolves(true);

describe("afterAll() (setup)", () => {

  afterAll(callback);
  afterAll(secondCallback);

  it('after running a test', function() { });
  it('or more', function() { });

});

describe("afterAll()", () => {

  it('is evaluated once after tests in the same context', function() {
    expect(callback).to.have.been.calledOnce;
  });

  context("called sequentially", () => {

    it('chains the functions together', function() {
      expect(secondCallback).to.have.been.calledOnce;
    });

  });

});
