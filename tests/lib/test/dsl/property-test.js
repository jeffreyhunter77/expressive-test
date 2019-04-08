require('../../../../init');

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

  context('when called with a memoize option', () => {

    property('subject', function () { return new Object(); }, {memoize: true});

    it("memoizes the function", function() {
      expect(this.subject).to.equal(this.subject);
    });

  });

});
