var EventEmitter = require('events');

class TestCase extends EventEmitter {
  constructor(container) {
    super();
    this.container = container;
    this._success = false;
    this._pending = false;
  }

  description() {
    return this.constructor.name;
  }

  fullDescription() {
    if (this.container)
      return `${this.container.fullDescription()} ${this.description()}`;
    else
      return this.description();
  }

  run() {
    this._success = false;

    if (this.isPending())
      return Promise.resolve()
        .then(() => this.emit('test-skipped', this));

    this.emit('test-started', this);

    return Promise.resolve()
      .then(() => this._test())
      .then(() => this._success = true)
      .catch((e) => this.emit('test-error', this, e))
      .then(() => this.emit('test-completed', this));
  }

  didSucceed() {
    return this._success;
  }

  isSuite() { return false; }

  setPending(flag) {
    this._pending = flag;
  }

  isPending() {
    return this._pending;
  }

}

module.exports = TestCase;
