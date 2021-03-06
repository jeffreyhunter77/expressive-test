var TestCase = require('./lib/test/test-case')
  , TestSuite = require('./lib/test/test-suite')
  , TestRegistry = require('./lib/test/test-registry')
  , dsl = require('./lib/test/test-dsl')
  , chai = require('chai')
;

global.TestCase = TestCase;
global.TestSuite = TestSuite;
global.TestRegistry = TestRegistry;

global.describe = dsl.describe;
global.context = dsl.describe;
global.it = dsl.it;
global.xit = dsl.xit;
global.property = dsl.property;
global.prop = dsl.property;
global.before = dsl.before;
global.beforeEach = dsl.before;
global.beforeAll = dsl.beforeAll;
global.after = dsl.after;
global.afterEach = dsl.after;
global.afterAll = dsl.afterAll;

global.expect = chai.expect;

module.exports.chai = chai;
