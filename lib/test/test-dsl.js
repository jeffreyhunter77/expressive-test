var TestSuite = require('./test-suite')
  , TestCase = require('./test-case')
  , TestRegistry = require('./test-registry')
;

let stack = [];

function describe(what, fn) {
  let descr = itemDescription(what);

  let suite = class extends TestSuite {
    description() { return descr; }

    tests() {
      return this.constructor._tests;
    }

    _beforeRun() {
      return this._runHooks('beforeAll', this, false);
    }

    _beforeTestRun(test) {
      return this._runHooks('before', test, true);
    }

    _afterTestRun(test) {
      return this._runHooks('after', test, true);
    }

    _afterRun(test) {
      return this._runHooks('afterAll', this, false);
    }

    _runHooks(name, context, onlyCases) {
      return this.constructor._hooks[name].reduce(
        (chain, hook) => chain.then(() => {
          if (onlyCases && context.isSuite())
            return;
          else
            return hook.apply(context, [context]);
        }),
        Promise.resolve()
      );
    }
  }

  suite._tests = [];
  suite._hooks = {before: [], beforeAll: [], after: [], afterAll: []};
  suite._context = (BaseClass => class extends BaseClass { })(parentContext());

  if (isClass(what))
    Object.defineProperty(suite._context.prototype, 'describedClass', {value: what});

  defineSuite(suite, fn);
  registerSuite(suite);

  return suite;
}

function isClass(item) {
  return typeof item == 'function' && item.name;
}

function itemDescription(item) {
  if (isClass(item))
    return String(item.name);
  else
    return String(item);
}

function defineSuite(suite, fn) {
  stack.push(suite);

  if (fn && typeof fn == 'function')
    fn.apply(suite);

  stack.pop();
}

function registerSuite(suite) {
  if (stack.length == 0)
    TestRegistry.add(suite);
  else
    stack[stack.length - 1]._tests.push(suite);
}


function it(expectation, fn) {
  if (arguments.length < 2)
    return _it(expectation, function() { }, true);
  else
    return _it(expectation, fn, false);
}

function xit(expectation, fn) {
  if (arguments.length < 2)
    return _it(expectation, function() { }, true);
  else
    return _it(expectation, fn, true);
}

function _it(expectation, fn, pending) {
  let test = (BaseClass => class extends BaseClass {
    constructor(...params) {
      super(...params)
      this.setPending(pending);
    }

    description() { return expectation; }

    _test() { return fn.apply(this, [this]); }
  })(parentContext());

  if (stack.length > 0)
    stack[stack.length - 1]._tests.push(test);

  return test;
}

function parentSuite() {
  if (stack.length > 0)
    return stack[stack.length - 1];
  else
    return null;
}

function parentContext() {
  if (stack.length > 0)
    return stack[stack.length - 1]._context;
  else
    return TestCase;
}


function memoize(name, fn) {

  return function() {
    const result = fn.apply(this, [this]);

    Object.defineProperty(this, name, {value: result});

    return result;
  }
}

function callWithThis(fn) {
  return function() {
    return fn.apply(this, [this]);
  }
}

function requireParentSuite(name) {
  let suite = parentSuite();

  if (!suite) throw new Error(`'${name}' must be called inside of a 'describe' block`);

  return suite;
}

function property(name, value, opts) {
  let ctx = requireParentSuite('property')._context;

  opts = Object.assign({memoize: true}, opts);

  if ('function' == typeof value && opts.memoize)
    Object.defineProperty(ctx.prototype, name, {get: memoize(name, value)});
  else if ('function' == typeof value)
    Object.defineProperty(ctx.prototype, name, {get: callWithThis(value)});
  else
    Object.defineProperty(ctx.prototype, name, {value: value});
}


function before(fn) {
  requireParentSuite('before')._hooks.before.push(fn);
}


function beforeAll(fn) {
  requireParentSuite('beforeAll')._hooks.beforeAll.push(fn);
}


function after(fn) {
  requireParentSuite('after')._hooks.after.push(fn);
}


function afterAll(fn) {
  requireParentSuite('afterAll')._hooks.afterAll.push(fn);
}

module.exports.describe = describe;
module.exports.it = it;
module.exports.xit = xit;
module.exports.property = property;
module.exports.before = before;
module.exports.beforeAll = beforeAll;
module.exports.after = after;
module.exports.afterAll = afterAll;
