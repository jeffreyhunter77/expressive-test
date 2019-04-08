require('../../../../init');

var sinon = require('sinon')
  , chai = require('chai')
  , sinonChai = require('sinon-chai')
  , dsl = require('../../../../lib/test/test-dsl')
;

chai.use(sinonChai);

class DSLItTestSuite extends TestSuite {
  description() { return "it()"; }

  tests() {
    class DSLItTestContext extends TestCase {
      get summary() { return "assertion summary"; }
      get body() { return this._body = this._body || sinon.spy(); }
      get result() { return dsl.it(this.summary, this.body); }

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

      class extends DSLItTestContext {
        description() { return "creates a test case"; }

        _test2() {
          expect(this.result.prototype).to.be.an.instanceof(TestCase);
        }
      },

      class extends DSLItTestContext {
        description() { return "sets the description"; }

        get testDescription() { return new this.result().description(); }

        _test2() {
          expect(this.testDescription).to.equal(this.summary);
        }
      },

      class extends DSLItTestContext {
        description() { return "does not evaluate the body"; }

        _test2() {
          this.result;
          expect(this.body).to.not.have.been.called;
        }
      },

      class extends DSLItTestContext {
        description() { return "evaluates the body during the test run"; }

        get testInstance() { return new this.result(); }

        _test() {
          return this.testInstance.run()
            .then(() => {
              expect(this.body).to.have.been.calledOnce;
            });
        }
      },

      class extends TestSuite {
        description() { return "nested in a describe"; }

        tests() {
          class DSLItNestedTestContext extends DSLItTestContext {
            get result() {
              let innerClass;

              this.containerClass = dsl.describe("outside", () => {
                innerClass = dsl.it("inside", () => {});
              });

              return innerClass;
            }
          }

          return [

            class extends DSLItNestedTestContext {
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

TestRegistry.add(DSLItTestSuite);
