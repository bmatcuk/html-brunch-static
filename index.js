var _, anymatch, fs, handlebars, log, minify, path, yaml;

minify = require('html-minifier').minify;

yaml = require('yaml-front-matter');

handlebars = require('handlebars');

anymatch = require('anymatch');

path = require('path');

log = require('util').debuglog('htmlbrunch');

fs = require('fs');

_ = {
  merge: require('lodash.merge')
};

var BasePartial;

BasePartial = class BasePartial {
  constructor(filename, template, context, options) {
    var ref;
    this.filename = filename;
    this.template = template;
    this.context = context;
    this.options = options;
    this.dependencies = [];
    if ((ref = this.options) != null ? ref.partials : void 0) {
      this.dependencies = this.dependencies.concat(this.options.partials);
    }
    this.partials = [];
    this.partialsCompiled = false;
  }

  addPartial(partial) {
    return this.partials.push(partial);
  }

  compilePartials(htmlBrunchStatic, hbs, callback) {
    var count, done, i, len, partial, ref, results;
    if (this.partialsCompiled || this.partials.length === 0) {
      callback();
      return;
    }
    count = this.partials.length;
    done = (err, content, dependencies) => {
      if (err) {
        count = -1;
        callback(err);
      }
      if (count < 0) {
        return;
      }
      // partial's compiler may add some dependencies
      if (dependencies && dependencies.constructor === Array) {
        this.dependencies = this.dependencies.concat(dependencies);
      }
      if (--count === 0) {
        this.partialsCompiled = true;
        return callback();
      }
    };
    ref = this.partials;
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      partial = ref[i];
      results.push(partial.compile(htmlBrunchStatic, hbs, done));
    }
    return results;
  }

};

var HandlebarsBrunchStatic;

HandlebarsBrunchStatic = (function() {
  class HandlebarsBrunchStatic {
    constructor(config) {
      if (config.constructor !== Boolean) {
        if (config.constructor === Object) {
          if (config.fileMatch) {
            this.handles = config.fileMatch;
          }
          if (config.fileTransform) {
            this.transformPath = config.fileTransform;
          }
        } else {
          // deprecated functionality
          this.handles = config;
        }
      }
    }

    transformPath(filename) {
      return filename.replace(/\.static\.\w+$/, '.html');
    }

    compile(data, filename, options, callback) {
      // do nothing because html-brunch-static processes through handlebars already
      return callback(null, data);
    }

  };

  HandlebarsBrunchStatic.prototype.handles = /\.static\.(?:hbs|handlebars)$/;

  return HandlebarsBrunchStatic;

}).call(this);

var Partial;

Partial = class Partial extends BasePartial {
  templateName() {
    return path.basename(this.filename);
  }

  registerPartial(hbs) {
    var ext, name, results;
    name = this.templateName();
    hbs.registerPartial(name, this.compiledPartial);
    results = [];
    while ((ext = path.extname(name)).length > 0) {
      name = path.basename(name, ext);
      results.push(hbs.registerPartial(name, this.compiledPartial));
    }
    return results;
  }

  compile(htmlBrunchStatic, hbs, callback) {
    log(`COMPILING PARTIAL ${this.filename}`);
    if (this.compiledPartial) {
      this.registerPartial(hbs);
      callback(null, this.compiledPartial, this.dependencies);
      return;
    }
    return this.compilePartials(htmlBrunchStatic, hbs, (err) => {
      var afterCompile, processor;
      if (err) {
        callback(err);
        return;
      }
      processor = htmlBrunchStatic.getProcessor(this.filename);
      if (!processor) {
        processor = PassthruProcessor;
      }
      try {
        afterCompile = (err, content, dependencies) => {
          if (err) {
            callback(err);
            return;
          }
          // compiler may add dependencies
          if (dependencies && dependencies.constructor === Array) {
            this.dependencies = this.dependencies.concat(dependencies);
          }
          this.compiledPartial = content;
          this.registerPartial(hbs);
          return callback(null, content, this.dependencies);
        };
        if (processor.acceptsContext) {
          return processor.compile(this.template, this.filename, this.options, {}, afterCompile);
        } else {
          return processor.compile(this.template, this.filename, this.options, afterCompile);
        }
      } catch (error) {
        err = error;
        return callback(err);
      }
    });
  }

};

var PassthruProcessor;

PassthruProcessor = {
  compile: function(data, filename, options, callback) {
    return callback(null, data);
  }
};

var Template;

Template = class Template extends BasePartial {
  constructor(filename, template, context, options) {
    var ref;
    super(filename, template, context, options);
    if ((ref = this.options) != null ? ref.layout : void 0) {
      this.dependencies.push(this.options.layout);
    }
  }

  // layouts have a content template
  setContent(template) {
    this.content = template;
    // merge context
    this.context = _.merge({}, template.context, this.context);
    // merge dependencies
    return this.dependencies = this.dependencies.concat(template.dependencies);
  }

  compile(htmlBrunchStatic, callback) {
    var hbs, run;
    log(`COMPILING TEMPLATE ${this.filename}`);
    hbs = handlebars.create();
    if (htmlBrunchStatic.handlebarsHelpers != null) {
      hbs.registerHelper(htmlBrunchStatic.handlebarsHelpers);
    }
    run = () => {
      return this.compilePartials(htmlBrunchStatic, hbs, (err) => {
        var afterCompile, processor;
        if (err) {
          callback(err);
          return;
        }
        processor = htmlBrunchStatic.getProcessor(this.filename);
        if (!processor) {
          processor = PassthruProcessor;
        }
        try {
          afterCompile = (err, content, dependencies) => {
            var hbsOptions, ref, result, template;
            if (err) {
              callback(err);
              return;
            }
            // compiler may add dependencies
            if (dependencies && dependencies.constructor === Array) {
              this.dependencies = this.dependencies.concat(dependencies);
            }
            // process through handlebars
            hbsOptions = _.merge({}, htmlBrunchStatic.handlebarsOptions, (ref = this.options) != null ? ref.handlebars : void 0);
            try {
              template = hbs.compile(content, hbsOptions);
              result = template(this.context);
              return callback(null, result);
            } catch (error) {
              err = error;
              return callback(err);
            }
          };
          if (processor.acceptsContext) {
            return processor.compile(this.template, this.filename, this.options, this.context, afterCompile);
          } else {
            return processor.compile(this.template, this.filename, this.options, afterCompile);
          }
        } catch (error) {
          err = error;
          return callback(err);
        }
      });
    };
    if (this.content) {
      return this.content.compile(htmlBrunchStatic, function(err, content) {
        if (err) {
          callback(err);
          return;
        }
        hbs.registerHelper('content', function() {
          return new handlebars.SafeString(content);
        });
        return run();
      });
    } else {
      return run();
    }
  }

};

var TemplateLoader;

TemplateLoader = class TemplateLoader {
  constructor() {
    this.cache = {};
  }

  load(filename, data, defaultContext, content) {
    var context, file, i, layout, len, options, partial, ref, template;
    log(`LOAD ${filename}`);
    if (this.cache[filename]) {
      return this.cache[filename];
    }
    // read file, if no data
    if (!data) {
      data = fs.readFileSync(filename);
    }
    // parse the front matter
    context = yaml.loadFront(data);
    if (context instanceof Error) {
      return context;
    }
    if (context === false) {
      return new Error(`Could not parse ${filename}.`);
    }
    if (defaultContext) {
      // pull out content and settings
      context = _.merge({}, defaultContext, context);
    }
    template = context.__content;
    options = context._options;
    delete context.__content;
    delete context._options;
    template = new Template(filename, template, context, options);
    if (content) {
      template.setContent(content);
    }
    this.cache[filename] = template;
    // load partials
    if (options != null ? options.partials : void 0) {
      ref = options.partials;
      for (i = 0, len = ref.length; i < len; i++) {
        file = ref[i];
        partial = this.loadPartial(file);
        if (partial instanceof Error) {
          return partial;
        }
        template.addPartial(partial);
      }
    }
    // if there's a layout, load that
    if (options != null ? options.layout : void 0) {
      layout = this.load(options.layout, null, defaultContext, template);
      if (layout instanceof Error) {
        return layout;
      }
      return layout;
    }
    return template;
  }

  loadPartial(filename) {
    var child, context, data, file, i, len, options, partial, ref, ref1, template;
    log(`LOAD PARTIAL ${filename}`);
    if (this.cache[filename]) {
      return this.cache[filename];
    }
    // parse front matter
    data = fs.readFileSync(filename);
    context = yaml.loadFront(data);
    if (context instanceof Error) {
      return context;
    }
    if (context === false) {
      return new Error(`Could not parse ${filename}.`);
    }
    // create partial
    template = context.__content;
    options = context._options;
    delete context.__content;
    delete context._options;
    partial = new Partial(filename, template, context, options);
    this.cache[filename] = partial;
    // load child partials
    if ((ref = partial.options) != null ? ref.partials : void 0) {
      ref1 = partial.options.partials;
      for (i = 0, len = ref1.length; i < len; i++) {
        file = ref1[i];
        child = this.loadPartial(file);
        if (child instanceof Error) {
          return child;
        }
        partial.addPartial(child);
      }
    }
    return partial;
  }

};

var HtmlBrunchStatic;

HtmlBrunchStatic = class HtmlBrunchStatic {
  constructor(config) {
    var ref, ref1;
    this.processors = (config != null ? config.processors : void 0) || [];
    this.defaultContext = config != null ? config.defaultContext : void 0;
    this.partials = (config != null ? config.partials : void 0) || /partials?/;
    this.layouts = (config != null ? config.layouts : void 0) || /layouts?/;
    this.handlebarsOptions = config != null ? config.handlebars : void 0;
    if ((ref = this.handlebarsOptions) != null ? ref.enableProcessor : void 0) {
      this.processors.push(new HandlebarsBrunchStatic(this.handlebarsOptions.enableProcessor));
      delete this.handlebarsOptions.enableProcessor;
    }
    if ((ref1 = this.handlebarsOptions) != null ? ref1.helpers : void 0) {
      this.handlebarsHelpers = this.handlebarsOptions.helpers;
      delete this.handlebarsHelpers.helpers;
    }
    this.minify = (config != null ? config.minify : void 0) || false;
  }

  handles(filename) {
    return this.getProcessor(filename) !== null;
  }

  getProcessor(filename) {
    var map, processorIdx;
    map = function(p) {
      if (p.handles.constructor === Function) {
        return function(f) {
          return p.handles(f);
        };
      } else {
        return p.handles;
      }
    };
    processorIdx = anymatch(this.processors.map(map), filename, true);
    if (processorIdx === -1) {
      return null;
    } else {
      return this.processors[processorIdx];
    }
  }

  transformPath(filename) {
    var processor;
    processor = this.getProcessor(filename);
    if (!processor) {
      return filename;
    }
    if (processor.transformPath) {
      return processor.transformPath(filename);
    } else {
      return filename.replace(new RegExp(path.extname(filename) + '$'), '.html');
    }
  }

  compile(data, filename, callback) {
    var err, loader, template;
    if (anymatch(this.partials, filename) || anymatch(this.layouts, filename)) {
      // don't output partials and layouts
      log(`Skipping ${filename}`);
      callback();
      return;
    }
    loader = new TemplateLoader;
    template = loader.load(filename, data, this.defaultContext);
    if (template instanceof Error) {
      callback(template);
      return;
    }
    try {
      return template.compile(this, (err, content) => {
        var result;
        if (err) {
          callback(err);
          return;
        }
        if (this.minify) {
          if (this.minify === true) {
            content = minify(content);
          } else {
            content = minify(content, this.minify);
          }
        }
        result = {
          filename: this.transformPath(filename),
          content: content
        };
        return callback(null, [result], template.dependencies);
      });
    } catch (error) {
      err = error;
      return callback(err);
    }
  }

};

module.exports = function(config) {
  return new HtmlBrunchStatic(config);
};

