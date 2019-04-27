const SUCCESS_MARK = '✓';
const FAILURE_MARK = '✖';
const SKIPPED_MARK = '-';

const COLOR_GREEN = 32;
const COLOR_RED = 31;
const COLOR_GRAY = 90;
const COLOR_YELLOW = 33;

const MS_PER_SEC = 1000;
const NANO_PER_MS = 1e6;

class TestReporter {

  constructor(runner) {
    this.ok = true;
    this.passCount = 0;
    this.pendingCount = 0;
    this.failCount = 0;
    this.errors = [];
    this.startedAt = process.hrtime();

    runner.addListener('test-created', test => this._testCreated(test));
    runner.addListener('test-error', (test, err) => this._testError(test, err));
  }

  complete() {
    this.duration = process.hrtime(this.startedAt);

    this._writeErrors();

    this._write("\n\n");

    if (this.ok && this.errors.length == 0) {
      this._write(this._green(this._totals()));

      if (this.pendingCount > 0)
        this._write(', ' + this._yellow(`${this.pendingCount} pending`));

    } else
      this._write(this._red(this._totals()));

    this._write(' ' + this._gray(`(${this._timing()})`));

    return this._writePromise("\n\n");
  }

  _testCreated(test) {
    test.addListener('test-started', test => this._testStarted(test));
    test.addListener('test-completed', test => this._testCompleted(test));
    test.addListener('test-skipped', test => this._testSkipped(test));
    test.addListener('test-created', test => this._testCreated(test));
    test.addListener('test-error', (test, err) => this._testError(test, err));
  }

  _testStarted(test) {
    if (test.isSuite())
      this._write(this._indentedDescription(test) + "\n");
  }

  _testCompleted(test) {
    this._recordCompletionStats(test);

    if (!test.isSuite())
      this._write(this._statusDescription(test) + "\n");
  }

  _testSkipped(test) {
    this._recordCompletionStats(test);

    if (!test.isSuite())
      this._write(this._statusDescription(test) + "\n");
  }

  _testError(test, err) {
    this.errors.push({test: test, error: err});
  }

  _recordCompletionStats(test) {
    if (test.didSucceed()) {
      if (!test.isSuite()) this.passCount += 1;
    } else if (test.isPending()) {
      if (!test.isSuite()) this.pendingCount += 1;
    } else {
      this.ok = false;
      if (!test.isSuite()) this.failCount += 1;
    }
  }

  _totals() {
    if (this.failCount > 0 && this.pendingCount == 0)
      return `${this.passCount} passing, ${this.failCount} failing`;
    else if (this.failCount > 0)
      return `${this.passCount} passing, ${this.pendingCount} pending, ${this.failCount} failing`;
    else
      return `${this.passCount} passing`;
  }

  _timing() {
    let ms = this.duration[0] * MS_PER_SEC + Math.round(this.duration[1] / NANO_PER_MS);

    return `${ms} ms`;
  }

  _indents(test) {
    if (test) {
      return '  ' + this._indents(test.container);
    } else {
      return '';
    }
  }

  _indentedDescription(test) {
    if (test.container)
      return this._indents(test.container) + test.description();
    else
      return "\n" + test.description();
  }

  _statusDescription(test) {
    if (test.didSucceed())
      return this._indents(test.container) + this._green(SUCCESS_MARK) + ' '
        + this._gray(test.description());
    else if (test.isPending())
      return this._indents(test.container) + this._yellow(SKIPPED_MARK) + ' '
        + this._yellow(test.description());
    else
      return this._indents(test.container) + this._red(FAILURE_MARK) + ' '
        + this._red(test.description());
  }

  _writeErrors() {
    this.errors.forEach((err, idx) => {
      this._write(`\n${idx+1}) ${this._fullDescription(err.test)}\n`);
      this._write(`\n    ${this._red(err.error.message)}\n`);
      this._write(`\n${this._gray(this._stackWithoutMessage(err.error))}\n`);
    });
  }

  _fullDescription(test) {
    if (test.fullDescription)
      return test.fullDescription();
    else
      return test.name;
  }

  _stackWithoutMessage(err) {
    var msg = String(err.message);
    var stack = String(err.stack || err);

    var msgIdx = stack.indexOf(msg);

    if (msgIdx == -1)
      return stack;
    else
      return stack.slice(msgIdx + msg.length + 1);
  }

  _green(message) {
    return this._color(COLOR_GREEN, message);
  }

  _red(message) {
    return this._color(COLOR_RED, message);
  }

  _gray(message) {
    return this._color(COLOR_GRAY, message);
  }

  _yellow(message) {
    return this._color(COLOR_YELLOW, message);
  }

  _color(color, message) {
    return `\u001b[${color}m${message}\u001b[0m`;
  }

  _write(message) {
    process.stdout.write(message);
  }

  _writePromise(message) {
    new Promise(resolve => process.stdout.write(message, 'utf8', resolve));
  }
}

module.exports = TestReporter;
