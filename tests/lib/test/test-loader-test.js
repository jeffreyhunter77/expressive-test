require('../../../init');

var TestLoader = require('../../../lib/test/test-loader');

class TestLoaderTestSuite extends TestSuite {

  description() { return "TestLoader"; }

  tests() {
    class TestLoaderTestSuiteContext extends TestCase {
      get loader() { return new TestLoader(this.sources); }
      get loadedValues() { return this.loader.load().map((t) => t.value); }
    };

    return [
      class extends TestLoaderTestSuiteContext {
        description() { return "loads test files"; }

        get sources() { return ['testdata/singlefile-test.js']; }

        _test() {
          expect(this.loadedValues).to.eql(['singlefile']);
        }
      },

      class extends TestLoaderTestSuiteContext {
        description() { return "ignores non-test files"; }

        get sources() { return ['testdata/singlemodule.js']; }

        _test() {
          expect(this.loadedValues).to.not.include('singlemodule');
        }
      },

      class extends TestSuite {
        description() { return "with a directory"; }

        tests() {
          class TestLoaderDirectoryTestSuiteContext extends TestLoaderTestSuiteContext {
            get sources() { return ['testdata/testdir']; }
          }

          return [
            class extends TestLoaderDirectoryTestSuiteContext {
              description() { return "loads tests from the directory"; }

              _test() {
                expect(this.loadedValues).to.include.members(['onetest','twotest']);
              }
            },

            class extends TestLoaderDirectoryTestSuiteContext {
              description() { return "recurses subdirectories"; }

              _test() {
                expect(this.loadedValues).to.include('directorytest');
              }
            },

            class extends TestLoaderDirectoryTestSuiteContext {
              description() { return "ignores non-test files"; }

              _test() {
                expect(this.loadedValues).to.not.include('regularfile');
              }
            },

            class extends TestLoaderDirectoryTestSuiteContext {
              description() { return "ignores directories themselves"; }

              _test() {
                expect(this.loadedValues).to.not.include('indexfile');
              }
            }
          ];
        }
      }
    ];
  }

}

TestRegistry.add(TestLoaderTestSuite);
