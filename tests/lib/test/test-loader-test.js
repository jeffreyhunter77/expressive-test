require('../../../init');

var TestLoader = require('../../../lib/test/test-loader');

describe(TestLoader, () => {

  prop('loader',       function() { return new TestLoader(this.sources); });
  prop('loadedValues', function() { return this.loader.load().map((t) => t.value); });

  context("with a test file source", () => {

    prop('sources', ['testdata/singlefile-test.js']);

    it("loads the test file", function() {
      expect(this.loadedValues).to.eql(['singlefile']);
    });

  });

  context("with a non-test file source", () => {

    prop('sources', ['testdata/singlemodule.js']);

    it("ignores the non-test file", function() {
      expect(this.loadedValues).to.not.include('singlemodule');
    });

  });

  context("with a directory", () => {

    prop('sources', ['testdata/testdir']);

    it("loads tests from the directory", function() {
      expect(this.loadedValues).to.include.members(['onetest','twotest']);
    });

    it("recurses subdirectories", function() {
      expect(this.loadedValues).to.include('directorytest');
    });

    it("ignores non-test files", function() {
      expect(this.loadedValues).to.not.include('regularfile');
    });

    it("ignores directories themselves", function() {
      expect(this.loadedValues).to.not.include('indexfile');
    });

  });

});
