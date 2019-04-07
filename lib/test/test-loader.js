var fs = require('fs')
  , glob = require('glob')
;

class TestLoader {
  constructor(sources) {
    this.sources = sources;
  }

  load() {

    return this._files()
      .map(function(file) {
        let path = fs.realpathSync(file);
        let mod = require(path);

        return mod;
      });

  }

  _files() {
    let files = [];

    this.sources.forEach(function(src) {
      let stats = fs.statSync(src);

      if (stats.isFile()) {
        if (/-test\.js$/.exec(src))
          files.push(src);

      } else if (stats.isDirectory()) {
        glob.sync(`${src}/**/*-test.js`, {nodir: true})
          .forEach(function(f) { files.push(f) });

      } else {
        console.warn("Ignoring unknown source \"%s\"", src);
      }

    });

    return files;
  }

}

module.exports = TestLoader;
