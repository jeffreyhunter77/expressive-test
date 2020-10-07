# expressive-test

I am a fan of short and simple tests. My preference is single-line tests. When done correctly, this tends to produce tests that are easy to both write and comprehend.

I have found it challenging to write tests this way in Javascript. In spite of my best intentions, I find myself wrangling large amounts of test setup code and struggling to keep the tests themselves succinct.

I created this library to experiment with ways to write more succinct and expressive tests. I have started to find some patterns that are helpful and would like to share them.

I hope others will try out what I've been working on and that they'll in turn share how this does or does not help with their particular testing issues. Be aware, however, that this is more playground than productized test tool. No features should be considered stable. Future versions may drastically change how even fundamental things here work. That's sort of the point of a playground.

I will, however, adhere to semantic versioning. An upgrade path, if there ever is one, may require significant rework, but that will be labeled with a major version number change. It won't suddenly appear in a minor version bump.

## Installation

Using npm:

```
npm install expressive-test --save-dev
```

or if you prefer to install it globally:

```
npm install --global expressive-test
```

## Running Tests

This package includes a test runner script. It's installed with the name `etr`.

The test runner script is very simple. It accepts one or more arguments which are file names or directories. If no arguments are provided, it defaults to `tests`.

The script then recursively searches the provided list for files matching the pattern `*-test.js` and requires them. It expects any required file to declare one or more tests. Once it has required all of the files, it evaluates the declared tests.

## Test Files

### Format

Tests use a `describe` and `it` syntax similar to the "BDD" style of mocha tests. The full syntax is explained in the [Test DSL section](#section_test_dsl), below. This tool includes an additional facility for declaring test properties, which is explained in [Understanding Test Properties](#section_understanding_test_properties).

Unlike mocha, tests are not supplied callbacks. That is to say, no `done` function is passed to `it` or `before`. If a test is asynchronous, it must return a promise. It can do that directly, or indirectly by declaring the function `async`.

The chai `expect` function is available globally as `expect`, although you may use any assertion library you choose. As with other test frameworks, a test passes if it does not throw an exception or reject.

For the test declaration functions to be available, you must require the expressive-test module. That is not supplied by the test runner. You can do that in each test file if you choose. I prefer to create a setup file at the top of my test directory and include it instead. The setup file can then include this module and do any other initialization that's required.

<a name="section_understanding_test_properties"></a>
### Understanding Test Properties

The time that I first started writing code to run under Node.js coincided with my journey toward more test-driven development. I had previously written a lot of unit tests in PHP, so when I first used Mocha, it seemed like a big step forward. Later, I found myself working in a Rails environment with Rspec. I had written plenty of code in Ruby before, but it was my first significant use of Rspec. That was a great experience, and it was the first time I felt like I was getting any good at writing tests.

One of the game changers for me were the `let` and `let!` statements that Rspec provides. ES6, of course, gives us a native `let` keyword, but it's not as useful as the method in Rspec.

Why? A `let` declaration in Rspec is inherited by nested examples and can be overriden. This is a very useful pattern. Under the hood, the Rspec method `describe` and its alias `context` is actually defining a class. Nested calls to `describe` define derived classes. `let` defines methods on that class. That means definitions are evaluated lazily at runtime instead of at declaration time. And that lets you override individual definitions in inner examples.

An example helps illustrate how this can be beneficial. For simplicity's sake, let's say I'm building a to do list application and I've written part of a trivial model class that can load its data from a file on the file system:

```javascript
const util = require('util');
const fs = require('fs');
const readFile = util.promisify(fs.readFile);

class TodoItem {

  constructor(attrs = {}) {
    Object.assign(this, attrs);
  }

  static reset() {
    delete this._items;
  }

  static async _loadItems() {
    try {
      const data = await readFile('items.json', 'utf8');
      return JSON.parse(data).map(item => new TodoItem(item));
    } catch (e) {
      if ('ENOENT' == e.code)
        return [];
      throw e;
    }
  }

  static async items() {
    return this._items = this._items || await this._loadItems();
  }

  static async uncompletedItems() {
    return (await this.items())
      .filter(item => ! item.done);
  }

};

module.exports = TodoItem;
```

I'd now like to write some tests for the `uncompletedItems` method. To start, I'd like to verify the following:

 * It returns all items if none are done
 * It returns only uncompleted items if some are done
 * It returns an empty list if the data file does not exist
 * It produces an error if the data file isn't parseable

Using a tool like Mocha, I would write tests something like the following:

```js
const TodoItem = require('./todo-item');
const mock = require('mock-fs');
const chai = require('chai');
const expect = chai.expect;
const asPromised = require('chai-as-promised');

chai.use(asPromised);

describe('TodoItem', () => {

  describe('#uncompletedItems()', () => {

    afterEach(() => mock.restore());
    afterEach(() => TodoItem.reset());

    context('when no items are done', () => {
      before(() => mock({'items.json': '[{"id":1,"title":"foo","done":false},{"id":2,"title":"bar","done":false}]'}));

      it('returns all items', async () => {
        expect((await TodoItem.uncompletedItems()).map(x => x.id)).to.deep.equal([1,2]);
      });
    });

    context('when some items are done', () => {
      before(() => mock({'items.json': '[{"id":1,"title":"foo","done":true},{"id":2,"title":"bar","done":false}]'}));

      it('returns non-completed items', async () => {
        expect((await TodoItem.uncompletedItems()).map(x => x.id)).to.deep.equal([2]);
      });
    });

    context('when the data file does not exist', () => {
      before(() => mock({}));

      it('returns an empty list', async () => {
        expect(await TodoItem.uncompletedItems()).to.deep.equal([]);
      });
    });

    context('when the data file is not parseable', () => {
      before(() => mock({'items.json': '-- bad data --'}));

      it('produces an error', async() => {
        await expect(TodoItem.uncompletedItems()).to.be.rejectedWith('Unexpected number');
      });
    });

  });

});
```

The expressive-test library provides a function named `property` or `prop` for short that functions similar to `let` in Rspec. That lets me write these in a different style:

```js
require('./setup');
const TodoItem = require('./todo-item');
const mock = require('mock-fs');

describe(TodoItem, () => {

  describe('#uncompletedItems()', () => {

    prop('fileSystem', function() { return {'items.json': this.fileData}; });
    prop('fileData',   function() { return JSON.stringify(this.items); });
    prop('items',      function() { return [this.item1, this.item2]; });
    prop('item1',      function() { return new TodoItem({id: 1, title: 'foo', done: this.done1}); });
    prop('item2',      function() { return new TodoItem({id: 2, title: 'bar', done: this.done2}); });
    prop('done1',      false);
    prop('done2',      false);
    prop('result',     function() { return TodoItem.uncompletedItems(); });

    before(function() { mock(this.fileSystem); });
    before(() => TodoItem.reset());

    after(() => mock.restore());

    context('when no items are done', () => {
      it('returns all items', async function () {
        expect(await this.result).to.deep.equal([this.item1, this.item2]);
      });
    });

    context('when some items are done', () => {
      prop('done1', true);

      it('returns non-completed items', async function () {
        expect(await this.result).to.deep.equal([this.item2]);
      });
    });

    context('when the data file does not exist', () => {
      prop('fileSystem', {});

      it('returns an empty list', async function () {
        expect(await this.result).to.deep.equal([]);
      });
    });

    context('when the data file is not parseable', () => {
      prop('fileData', '-- bad data --');

      it('produces an error', async function () {
        await expect(this.result).to.be.rejectedWith('Unexpected number');
      });
    });

  });

});
```

In this particular example I created quite a few properties, but it's helpful for showing how they can be used. For me, the value is being able to override specific settings for the setup in each test cases instead of having to redefine the set up each time. When it's done well, I believe it makes the tests easier to read, and in real world tests I often find it saves me some typing.

If it's not clear how this might be useful, I'd ask you to consider something like the file system mocking above. Here the file system setup is simple, so it can be mocked in each describe block with the setup needed for that section. That doesn't scale up very well, though. If the mock setup is more complicated, it gets tedious to have to redeclare it for each example. It can also be hard to maintain over time. If you need to add an additional setting to the mock in the future, you're forced to update each test. In the past I've dealt with that by adding utility functions to my test files to help with the setup.

Properties are another way to solve this problem. In the example above, using properties I only have to setup the mock once. If I want to change what goes into the mock, I only need to override the single property I want to change and that's the value that's used when the mock is created for that section. It also means if I need to alter the mock in the future, I only have to do that in one place. Utility functions can achieve a similar result. I just find it's faster for me to set up with properties.

One technical detail to make note of here is the use of `this`. Properties are accessed at runtime through the use of `this`, which unfortunately precludes the use of arrow functions when you want to refer to properties, since that would bind `this` to the declaration context instead of the runtime context. That is why you see `function` being used to declare functions passed to `it` and `before` blocks above. If you are not referring to `this` in the function body, it is safe to use an arrow function. If you are using `this` to refer to a property, you must use `function`.

<a name="section_test_dsl"></a>
## Test DSL

When included, this library declares the following globals:

 * [after](#dsl_after)
 * [afterAll](#dsl_afterAll)
 * [before](#dsl_before)
 * [beforeAll](#dsl_beforeAll)
 * [context](#dsl_describe)
 * [describe](#dsl_describe)
 * [expect](#dsl_expect)
 * [it](#dsl_it)
 * [prop](#dsl_property)
 * [property](#dsl_property)
 * [xit](#dsl_xit)

It exports the following:

 * [chai](#dsl_chai)

If you prefer not to pollute the global namespace, you could instead require `expressive-test/lib/test/test-dsl`. The DSL module exports all of the above globals with the exception of `expect` and any aliases.

<a name="dsl_after"></a>
### after(callback)

**Parameters**

 * `callback`: **Function** A function to call after each test

**Return Value**

`undefined`

**Description**

Accepts a function to be called after the completion of each test. Note that this is the equivalent of an afterEach function, which is different from other test frameworks.

No arguments are passed to the callback function. The value of `this` is the `TestCase` that ran. The callback may return a Promise.

`after` may only be called inside of a `describe` or `context` block. If it is called more than once in the same block, the provided functions are called in the order they were supplied.

<a name="dsl_afterAll"></a>
### afterAll(callback)

**Parameters**

 * `callback`: **Function** A function to call after all tests

**Return Value**

`undefined`

**Description**

Accepts a function to be called once following the completion of all tests in the section.

No arguments are passed to the callback function. The value of `this` is the `TestSuite` it was declared within. The callback may return a Promise.

`afterAll` may only be called inside of a `describe` or `context` block. If it is called more than once in the same block, the provided functions are called in the order they were supplied.

<a name="dsl_before"></a>
### before(callback)

**Parameters**

 * `callback`: **Function** A function to call before each test

**Return Value**

`undefined`

**Description**

Accepts a function to be called before each test begins. Note that this is the equivalent of a beforeEach function, which is different from other test frameworks.

No arguments are passed to the callback function. The value of `this` is the `TestCase` that is to be run. The callback may return a Promise.

`before` may only be called inside of a `describe` or `context` block. If it is called more than once in the same block, the provided functions are called in the order they were supplied.

<a name="dsl_beforeAll"></a>
### beforeAll(callback)

**Parameters**

 * `callback`: **Function** A function to call before all tests

**Return Value**

`undefined`

**Description**

Accepts a function to be called once before any tests in the section are run.

No arguments are passed to the callback function. The value of `this` is the `TestSuite` it was declared within. The callback may return a Promise.

`beforeAll` may only be called inside of a `describe` or `context` block. If it is called more than once in the same block, the provided functions are called in the order they were supplied.

<a name="dsl_describe"></a>
### describe(description, callback)

**Aliases**

 * context

**Parameters**

 * `description`: **String | Class** A description or the class being described

   If `description` is a class, the name of the class is used as the section description and the class is made available as a property named `describedClass`.

 * `callback`: **Function** A function which declares additional sections or tests

**Return Value**

The `TestSuite` defined by the callback.

**Description**

Creates a new test section or suite. 

No arguments are passed to the callback function. It is invoked immediately. The value of `this` is the `TestSuite` being declared. Any return value of the callback is ignored.

`describe` and its alias `context` are the only functions in this DSL which may be called outside of a `describe` or `context` block.

<a name="dsl_expect"></a>
### expect

Chai's `expect` function. See [chaijs.com](https://www.chaijs.com) for more information.

<a name="dsl_it"></a>
### it(description[, testFunction])

**Parameters**

 * `description`: **String** A description of the expected outcome
 * `testFunction`: **Function** A function which defines the test and performs any assertions

   If `testFunction` is omitted, it creates a pending test.

**Return Value**

The created `TestCase`.

**Description**

Defines a new test or example.

No arguments are passed to `testFunction`. It is invoked when the test is run. The value of `this` is the `TestCase` being run. The function may return a Promise. If it throws an exception or rejects, the test fails. Otherwise, it is considered to have succeeded.

`it` may only be called inside of a `describe` or `context` block.

<a name="dsl_property"></a>
### property(name, definition[, options])

**Aliases**

 * prop

**Parameters**

 * `name`: **String** The name of the property to define
 * `definition`: **Any** The value of the property or a function that provides the value
 * `options`: **Object** An optional parameter specifying settings for the property

**Return Value**

`undefined`

**Description**

Defines a property available to all tests in the section where the property is defined. Properties are inherited by nested sections and may also be overridden.

The `definition` may be a literal value for the property. If `definition` is a function, it is used as a getter function for the property. A getter function is called with no arguments. The value of `this` in the function is the `TestCase` being run.

By default, getter functions are memoized. That is, after they are invoked the first time time, that return value is used for any subsequent property access (and the getter function is not invoked). Note that getter functions are not invoked until the property is first accessed. In effect, they are lazily evaluated.

The `options` argument is an object specifying additional settings for the property. Optional settings are:

 * `memoize`: **Boolean** If `false`, the `definition` function is not memoized. Defaults to `true`.

`prop` or `property` may only be called inside of a `describe` or `context` block.

For more information on properties and usage examples, see [Understanding Test Properties](#section_understanding_test_properties).

<a name="dsl_xit"></a>
### xit(description[, testFunction])

`xit` accepts the same arguments as [it](#dsl_it), but defines a pending test. A pending test is listed in the test output, but is not run. This is useful for writing the descriptions of tests you intend to implement in the future or for temporarily disabling specific tests.

<a name="dsl_chai"></a>
### chai

`chai` is not available globally, but is exported by this package. It is the chai package associated with `expect`. This is useful if you want to include chai plugins.

For example, a simple test setup script that adds a chai-as-promised plugin would look like:

```javascript
const et = require('expressive-test');
const asPromised = require('chai-as-promised');

et.chai.use(asPromised);
```
