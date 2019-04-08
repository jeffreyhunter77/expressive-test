require('../../../../init');

var sinon = require('sinon')
  , chai = require('chai')
  , sinonChai = require('sinon-chai')
  , dsl = require('../../../../lib/test/test-dsl')
;

chai.use(sinonChai);

class DSLDescribeTestSuite extends TestSuite {
  description() { return "describe()"; }

  tests() {
    class DSLDescribeTestContext extends TestCase {
      get describedItem() { return "item"; }
      get body() { return this._body = this._body || sinon.spy(); }
      get result() { return dsl.describe(this.describedItem, this.body); }

      _test() {
        sinon.stub(TestRegistry, 'add');
        try {
          this._test2();
        } catch (e) {
          throw e;
        } finally {
          TestRegistry.add.restore();
        }
      }
    }

    return [

      class extends DSLDescribeTestContext {
        description() { return "creates a test suite"; }

        _test2() {
          expect(this.result.prototype).to.be.an.instanceof(TestSuite);
        }
      },

      class extends DSLDescribeTestContext {
        description() { return "sets the description"; }

        get testDescription() { return new this.result().description(); }

        _test2() {
          expect(this.testDescription).to.equal(this.describedItem);
        }
      },

      class extends TestSuite {
        description() { return "when a constructor is provided"; }

        tests() {
          class DSLDescribeCtorTestContext extends DSLDescribeTestContext {
            get describedItem() { return this._class = this._class || class Item { }; }
          }

          return [
            class extends DSLDescribeCtorTestContext {
              description() { return "uses the constructor name as the description"; }

              get testDescription() { return new this.result().description(); }

              _test2() {
                expect(this.testDescription).to.equal('Item');
              }
            },

            class extends DSLDescribeCtorTestContext {
              description() { return "saves the constructor in the describedClass property"; }

              get testContext() { return new this.result._context(); }

              _test2() {
                expect(this.testContext.describedClass).to.equal(this.describedItem);
              }
            }
          ];
        }
      },

      class extends DSLDescribeTestContext {
        description() { return "evaluates the body"; }

        _test2() {
          this.result
          expect(this.body).to.have.been.calledOnce;
        }
      },

      class extends TestSuite {
        description() { return "standalone"; }

        tests() {
          class DSLDescribeStandaloneTestContext extends DSLDescribeTestContext {
          }

          return [

            class extends DSLDescribeStandaloneTestContext {
              description() { return "registers the test"; }

              _test2() {
                let testClass = this.result;
                expect(TestRegistry.add).to.have.been.calledWith(testClass);
              }
            }

          ];
        }
      },

      class extends TestSuite {
        description() { return "nested"; }

        tests() {
          class DSLDescribeNestedTestContext extends DSLDescribeTestContext {
            get result() {
              let innerClass;

              this.containerClass = dsl.describe(this.describedItem, () => {
                innerClass = dsl.describe("inside", () => {});
              });

              return innerClass;
            }
          }

          return [

            class extends DSLDescribeNestedTestContext {
              description() { return "does not register the test"; }

              _test2() {
                let testClass = this.result;
                expect(TestRegistry.add).to.not.have.been.calledWith(testClass);
              }
            },

            class extends DSLDescribeNestedTestContext {
              description() { return "adds the test to the containing suite"; }

              _test2() {
                let testClass = this.result
                let containerInst = new this.containerClass();

                expect(containerInst.tests()).to.be.an('array').that.includes(testClass);
              }
            }

          ];
        }
      }

    ];
  }
}

TestRegistry.add(DSLDescribeTestSuite);
