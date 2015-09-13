var _, anymatch, handlebars, path, yaml;

yaml = require('yaml-front-matter');

handlebars = require('handlebars');

anymatch = require('anymatch');

path = require('path');

_ = {
  merge: require('lodash.merge')
};

var HandlebarsBrunchStatic;

HandlebarsBrunchStatic = (function() {
  function HandlebarsBrunchStatic() {}

  HandlebarsBrunchStatic.prototype.handles = /\.static\.(?:hbs|handlebars)$/;

  HandlebarsBrunchStatic.prototype.transformPath = function(filename) {
    return filename.replace(/\.static\.\w+$/, '.html');
  };

  HandlebarsBrunchStatic.prototype.compile = function(data, filename, callback) {
    return callback(null, data);
  };

  return HandlebarsBrunchStatic;

})();

var Partial;

Partial = (function() {
  function Partial(filename, template, context, options) {
    var ref;
    this.filename = filename;
    this.template = template;
    this.context = context;
    this.options = options;
    this.dependencies = ((ref = this.options) != null ? ref.partials : void 0) || [];
    this.partials = [];
  }

  Partial.prototype.addPartial = function(partial) {
    this.partials.push(partial);
    return this.dependencies = this.dependencies.concat(partial.dependencies);
  };

  Partial.prototype.templateName = function() {
    return path.basename(this.filename, path.extname(this.filename));
  };

  Partial.prototype.compile = function(htmlBrunchStatic, hbs, callback) {
    var processor;
    if (this.compiledTemplate) {
      callback(null, this.compiledTemplate);
      return;
    }
    processor = htmlBrunchStatic.getProcessor(this.filename);
    if (!processor) {
      processor = PassthruProcessor;
    }
    return processor.compile(this.template, this.filename, function(err, content, dependencies) {
      if (err) {
        callback(err);
        return;
      }
      if (dependencies && dependencies.constructor === Array) {
        this.dependencies = this.dependencies.concat(dependencies);
      }
      this.compiledTemplate = content;
      hbs.registerPartial(this.templateName(), content);
      return callback(null, content);
    });
  };

  return Partial;

})();

var PassthruProcessor;

PassthruProcessor = {
  compile: function(data, filename, callback) {
    return callback(null, data);
  }
};

var Template;

Template = (function() {
  function Template(filename, template1, context, options) {
    var ref, ref1;
    this.filename = filename;
    this.template = template1;
    this.context = context;
    this.options = options;
    this.dependencies = [];
    if ((ref = this.options) != null ? ref.layout : void 0) {
      this.dependencies.push(this.options.layout);
    }
    if ((ref1 = this.options) != null ? ref1.partials : void 0) {
      this.dependencies = this.dependencies.concat(this.options.partials);
    }
    this.partials = [];
  }

  Template.prototype.addPartial = function(partial) {
    this.partials.push(partial);
    return this.dependencies = this.dependencies.concat(partial.dependencies);
  };

  Template.prototype.setContent = function(template) {
    this.content = template;
    this.context = _.merge({}, template.context, this.context);
    return this.dependencies = this.dependencies.concat(template.dependencies);
  };

  Template.prototype.compilePartials = function(htmlBrunchStatic, hbs, callback) {
    var count, done, i, len, partial, ref, results;
    if (this.partials.length > 0) {
      count = this.patials.length;
      done = function(err, content) {
        if (err) {
          count = -1;
          callback(err);
        }
        if (count < 0) {
          return;
        }
        if (--count === 0) {
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
    } else {
      return callback();
    }
  };

  Template.prototype.compile = function(htmlBrunchStatic, callback) {
    var hbs, run;
    hbs = handlebars.create();
    run = (function(_this) {
      return function() {
        return _this.compilePartials(htmlBrunchStatic, hbs, function(err) {
          var processor;
          if (err) {
            callback(err);
            return;
          }
          processor = htmlBrunchStatic.getProcessor(_this.filename);
          if (!processor) {
            processor = PassthruProcessor;
          }
          return processor.compile(_this.template, _this.filename, function(err, content, dependencies) {
            var ref, result, template;
            if (err) {
              callback(err);
              return;
            }
            if (dependencies && dependencies.constructor === Array) {
              _this.dependencies = _this.dependencies.concat(dependencies);
            }
            template = hbs.compile(content, (ref = _this.options) != null ? ref.handlebars : void 0);
            result = template(_this.context);
            return callback(null, result);
          });
        });
      };
    })(this);
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
  };

  return Template;

})();

var TemplateLoader;

TemplateLoader = (function() {
  function TemplateLoader() {
    this.cache = {};
  }

  TemplateLoader.prototype.load = function(filename, data, defaultContext) {
    var context, file, i, layout, len, options, partial, ref, template;
    if (this.cache[filename]) {
      return this.cache[filename];
    }
    context = yaml.loadFront(data || filename, '_content');
    if (context instanceof Error) {
      return context;
    }
    if (context === false) {
      return new Error("Could not parse " + filename + ".");
    }
    if (defaultContext) {
      context = _.merge({}, defaultContext, context);
    }
    template = context._content;
    options = context._options;
    delete context._content;
    delete context._options;
    template = new Template(filename, template, context, options);
    this.cache[filename] = template;
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
    if (options != null ? options.layout : void 0) {
      layout = this.load(options.layout);
      if (layout instanceof Error) {
        return layout;
      }
      layout.setContent(template);
      return layout;
    }
    return template;
  };

  TemplateLoader.prototype.loadPartial = function(filename) {
    var child, context, file, i, len, options, partial, ref, ref1, template;
    if (this.cache[filename]) {
      return this.cache[filename];
    }
    context = yaml.loadFront(filename, '_content');
    if (context instanceof Error) {
      return context;
    }
    if (context === false) {
      return new Error("Could not parse " + filename + ".");
    }
    template = context._content;
    options = context._options;
    delete context._content;
    delete context._options;
    partial = new Partial(filename, template, context, options);
    this.cache[filename] = partial;
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
  };

  return TemplateLoader;

})();

var HtmlBrunchStatic;

HtmlBrunchStatic = (function() {
  function HtmlBrunchStatic(config) {
    this.processors = (config != null ? config.processors : void 0) || [];
    this.defaultContext = config != null ? config.defaultContext : void 0;
    this.partials = (config != null ? config.partials : void 0) || /partials?/;
    this.layouts = (config != null ? config.layouts : void 0) || /layouts?/;
    if (config != null ? config.hbsFiles : void 0) {
      this.processors.push(new HandlebarsBrunchStatic(config.hbsFiles));
    }
  }

  HtmlBrunchStatic.prototype.handles = function(filename) {
    return this.getProcessor(filename) !== null;
  };

  HtmlBrunchStatic.prototype.getProcessor = function(filename) {
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
  };

  HtmlBrunchStatic.prototype.transformPath = function(filename) {
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
  };

  HtmlBrunchStatic.prototype.compile = function(data, filename, callback) {
    var loader, template;
    if (anymatch(this.partials, filename) || anymatch(this.layouts, filename)) {
      callback();
      return;
    }
    loader = new TemplateLoader;
    template = loader.load(filename, data, this.defaultContext);
    if (template instanceof Error) {
      callback(template);
      return;
    }
    return template.compile(this, (function(_this) {
      return function(err, content) {
        var result;
        if (err) {
          callback(err);
          return;
        }
        result = {
          filename: _this.transformPath(filename),
          content: content
        };
        return callback(null, [result], template.dependencies);
      };
    })(this));
  };

  return HtmlBrunchStatic;

})();

module.exports = function(config) {
  return new HtmlBrunchStatic(config);
};

