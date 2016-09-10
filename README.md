![Release](https://img.shields.io/npm/v/html-brunch-static.svg)

# html-brunch-static
Transform static html files in brunch.

html-brunch-static is a processor for [brunch-static](https://github.com/bmatcuk/brunch-static), a [brunch](http://brunch.io/) plugin designed to handle static files. html-brunch-static can convert a variety of template languages into static html files with support for layouts and partial views.

If you want to dive into writing your own processor, [jump down](#writing-html-brunch-static-processors). Otherwise, keep reading.

## Installation
html-brunch-static depends on [brunch-static](https://github.com/bmatcuk/brunch-static), so, you will need to install both plugins. The recommended method is via npm:

```bash
npm install --save-dev brunch-static html-brunch-static
```

Or manually:

* Add `"brunch-static": "x.y.z"` to package.json
* Add `"html-brunch-static": "x.y.z"` to package.json
* Run `npm install`
* Alternatively, you may use the latest git version with:
  * `"brunch-static": "git+ssh://git@github.com:bmatcuk/brunch-static"`
  * `"html-brunch-static": "git+ssh://git@github.com:bmatcuk/html-brunch-static"`

## Configuration
Add html-brunch-static to your list of brunch-static processors:

```coffee
exports.config =
  ...
  plugins:
    static:
      processors: [
        require('html-brunch-static') {
          processors: [ ... ]
          defaultContext: { ... }
          partials: ...
          layouts: ...
          handlebars: {
            enableProcessor: ...
            helpers: { ... }
            ...
          }
          minify: ...
        }
      ]
```

* **processors** _(default: `[]`)_
  > _processors_ is an array of html processors. See [available processors](#available-processors) below for a list.

* **defaultContext** _(default: `{}`)_
  > To set default values for the _context_ of your files, use _defaultContext_. See "[Context, Layouts, and Partials](#context-layouts-and-partials)" below for more details on the context.

* **partials** _(default: `/partials?/`)_
  > _partials_ is an [anymatch](https://github.com/es128/anymatch) that will be used to determine what files are [partials](#partials). This means it can be either a string with globs, a regex, or a function that takes a single parameter (a filename) and returns true if it is a partial view and false otherwise. The default setting will match any filename that includes the word "partial" (or "partials") anywhere in the path, for example: `app/partials/whatever.ext`.

* **layouts** _(default: `/layouts?/`)_
  > Like _partials_ above, _layouts_ is an [anymatch](https://github.com/es128/anymatch) that will be used to determine what files are [layouts](#layouts). It may also be a string with globs, a regex, or a function that takes a filename and returns true/false. The default setting will match any filename that includes the word "layout" (or "layouts") anywhere in the path, for example: `app/layouts/whatever.ext`.

* **handlebars** _(default: `null`)_
  > Default options for handlebars (see [handlebars.js documentation](http://handlebarsjs.com/reference.html)). These options, with the exception of _enableProcessor_ and _helpers_ (see below), are passed verbatim to handlebars and can be overridden in the front matter ([see below](#context-layouts-and-partials)).
  >
  > * **enableProcessor** _(default: `false`)_
  >
  >   > _enableProcessor_ may either be true or an object containing objects to pass to the handlebars processor. Either way will enable the built-in support for handlebar files. See below for the options available.
  >
  > * **helpers** _(default: `null`)_
  >   > _helpers_ can be used to specify custom handlebars helpers. This option should be a hash where the keys are the names of the helpers and the values are functions. This hash is passed, verbatim, to `Handlebars.registerHelper()` (see [handlebars.js documentation](http://handlebarsjs.com/reference.html)).

* **minify** _(default: `false`)_
  > Minify the resulting html using [html-minifier](https://github.com/kangax/html-minifier). To enable, set this value to `true` to use the default options, or set to a hash of options that will be passed directly to html-minifier. See html-minifier's documentation for a list of valid options and their defaults.

The following options are available if you enable the built-in handlebars processor:

```coffee
enableProcessor:
  fileMatch: ...
  fileTransform: ((filename) -> ...)
```

* **fileMatch** _(default: `/\.static\.(hbs|handlebars)$/`)_
  > _fileMatch_ is an [anymatch](https://github.com/es128/anymatch) that is used to determine which files will be handled by the handlebars processor. As an anymatch, it may be a string with globs, a regex, or a function that takes a filename and returns true or false. The default will match files that end with `.static.hbs` or `.static.handlebars`.

* **fileTransform** _(default: `(f) -> f.replace(/\.static\.\w+$/, '.html')`)_
  > _fileTransform_ converts the input filename into an html filename. It takes a filename as input and returns the new filename with the html extension. If you set the _fileMatch_ property above, you'll probably need to set this option as well to ensure that your output files end with the html extension.

### Note
The value of _partials_ and _layouts_ may be the same if you want to put them all together. In a lot of similar static site generators, partials and layouts might start with an underscore, such as `_layout.html`. You can do this (and set _partials_ and _layouts_ to something like `"**/_*"`), but be aware that, by default, brunch will ignore any files that start with an underscore. What this means is that any changes to these files will not trigger brunch to recompile any files that are dependent on those partials and layouts. This problem can be fixed if you change brunch's `conventions.ignored` setting to not ignore files that begin with an underscore.

## Available Processors
Below are the currently available processors for html-brunch-static. If you'd like for your processor to be included in this list, [create an issue](https://github.com/bmatcuk/brunch-static/issues/new) with your project's URL and a description.

* Markdown: [marked-brunch-static](https://github.com/bmatcuk/marked-brunch-static)
* Pug: [pug-brunch-static](https://github.com/bmatcuk/pug-brunch-static)
* Jade: [jade-brunch-static](https://github.com/bmatcuk/jade-brunch-static)
* Handlebars: built-in (see the [handlebars.enableProcessor option](#configuration) above)

## Context, Layouts, and Partials
html-brunch-static has full support for using layouts and partials in your templates. In fact, you can have multiple levels of layouts if you'd like. These features are orchestrated by including [YAML](http://yaml.org/) or JSON _front matter_ at the top of your template files. Front matter sets the _context_ of the file, which is bubbled up (and possibily overridden) by the layout, and the layout's layout, etc.

### Example
By default, processors will look for files ending in the extension `.static.ext` (ex: `.static.jade`). This way, html-brunch-static does not interfere with other brunch plugins which are meant to handle dynamic files. This behavior can be changed using the `fileMatch` and `fileTransform` options for the respective processor (see documentation for [marked-brunch-static](https://github.com/bmatcuk/marked-brunch-static), [jade-brunch-static](https://github.com/bmatcuk/jade-brunch-static), etc).

Armed with that knowledge, let's say I have the following file `app/index.static.md`:

```markdown
---
title: html-brunch-static's awesome test page
_options:
  layout: app/layouts/main.static.jade
  partials:
    - app/partials/greetings.static.hbs
---
{{>greetings}}

This is **html-brunch-static's** super awesome test page.
```

Everything between the `---`'s is the front matter. Here, I've chosen to write my front matter in [YAML](http://yaml.org/), but I could have also written it in JSON. This whole block is referred to as the _context_ of this file.

In this example, We can see that this file wants to use a layout (`app/layouts/main.static.jade`) and includes one partial view (`app/partials/greetings.static.hbs`). All partial views that your file uses must be declared in the front matter so that html-brunch-static knows to load them. This also illustrates another powerful feature of html-brunch-static: layouts and partials can be written in any templating language that html-brunch-static has a processor for, and they don't need to match. This file is written in markdown, the layout in jade, and the partial is handlebars file. Neat!

What's that `{{>greetings}}` thing all about? Well, after html-brunch-static converts your file to html, it runs the file through [handlebars](http://handlebarsjs.com/) to allow your files to use the context to do some cool things. Here, `{{>...}}` is the handlebars way of saying "use the partial called greetings". Since we declared that we're using the `app/partials/greetings.static.hbs` partial in our front matter, it will be loaded and inserted into your file here.

Note that your partial files must match the `fileMatch` rule for the processor that will handle the file. This means, by default, you'll need to name the file with `.static.ext`. html-brunch-static gives you multiple ways to reference your partial based on the filename though: for example, `app/partials/greetings.static.hbs` can be referenced as `{{>greetings.static.hbs}}`, `{{>greetings.static}}`, or `{{>greetings}}`.

Ok, so what does our partial look like? I give you `app/partials/greetings.static.hbs`:

```html
<h1>Welcome to {{title}}</h1>
```

Pretty simple. This file has no front matter of its own, but since it's being included in our index.static.md, it inherits the _context_ of index.static.md. This means that our `title` is available to it. Neat!

Finally, our layout, `app/layouts/main.static.jade`:

```jade
doctype html
html
  head
    title {{title}}
  body
    | {{content}}
```

The _context_ of our page bubbles up to our layout, so our title is still available. If our layout included some front matter of its own, it could override the title. The content of our page is available to the layout with the `{{content}}`. That "pipe" (`|`) in front of `{{content}}` is just [jade](http://jade-lang.com/)'s way of saying that everything after it should just be included on the page verbatim.

Note that, like partials, layout files must match the `fileMatch` rule for the processor that will handle the file. This means, by default, you'll need to name the file with `.static.ext`.

Alright, let's take a quick look at our `package.json`:

```javascript
{
  ...
  "devDependencies": {
    "brunch": "x.y.z",
    "brunch-static": "x.y.z",
    "html-brunch-static": "x.y.z",
    "marked-brunch-static": "x.y.z",
    "jade-brunch-static": "x.y.z",
    ...
  },
  ...
}
```

... and our `brunch-config.coffee`:

```coffee
exports.config =
  ...
  plugins:
    static:
      processors: [
        require('html-brunch-static') {
          handlebars:
            enableProcessor: true
          processors: [
            require('marked-brunch-static')()
            require('jade-brunch-static')(pretty: true)
          ]
        }
      ]
```

Nothing special in either of those files other than including brunch-static, html-brunch-static, and the markdown and jade processors. We're using the `pretty` option with jade because... pretty is pretty.

Now if we run `brunch build`, we should get our output `public/index.html`:

```html
<!doctype html>
<html>
  <head>
    <title>html-brunch-static's awesome test page</title>
  </head>
  <body>
    <p><h1>Welcome to html-brunch-static's awesome test page.</h1></p>
    <p>This is <b>html-brunch-static's</b> super awesome test page.</p>
  </body>
</html>
```

### Front Matter Options
As touched on above, the front matter can contain some options. The following options are available. Note that some processors may define some additional options.

```yaml
---
_options:
  layout: ...
  partials:
    ...
  handlebars:
    ...
---
```

* **layout**
  > _layout_ is the layout file you want to use for this file. See above.

* **partials**
  > _partials_ is a list of partials that you want to use in this file. They must be declared here so that html-brunch-static knows to load them. See above.

* **handlebars**
  > _handlebars_ overrides the [handlebars](#configuration) option in the `brunch-config.coffee` file. These options are passed verbatim to handlebars (see the [handlebars.js documentation](http://handlebarsjs.com/reference.html)).

## Writing html-brunch-static Processors
Processors are kind of similar to Brunch plugins themselves: an object that has certain members and methods. It's recommended that your project follows the following naming scheme: `whatever-brunch-static` to make it easy to find in npm.

```javascript
var MyHtmlProcessor = function(config) { ... };

MyHtmlProcessor.prototype = {
  handles: ...,
  transformPath: function(filename) { ... },
  compile: function(data, filename, options, callback) { ... }
};

// export a simple function to make it easier to include in brunch-config.coffee
module.exports = function(config) { return new MyHtmlProcessor(config); };
```

* **handles**
  > _handles_ is an [anymatch](https://github.com/es128/anymatch) that will be used to determine if your processor can handle a given file. This means it can be either be a string (using globs), a regex, or a function that takes a single parameter (the filename) and returns true if your processor can handle it, or false otherwise.

* **transformPath**
  > _transformPath_ is a function that will receive the original filename and return the filename for the output. In most cases, this just involves replacing the file extension with html. For example, the input filename might be something like `app/path/to/file.static.jade`. This function would return `app/path/to/file.html`.

* **compile**
  > _compile_ receives the contents of the file, the file's name, options, and a callback function. The options come straight from the file's front matter (see [Front Matter Options](#front-matter-options)), so, be aware that they might be null (if the user didn't set any options), or the values you're looking for might not have been set at all! After you have finished processing the file's data, you will need to call the callback function with the following:
  >
  > * `callback(err, data, dependencies)`
  >   * **err** informs html-brunch-static when something goes wrong. If there were no issues, pass null.
  >   * **data** is the html output of your processor.
  >   * **dependencies** is an array of dependencies that your processor has found for the file. If the file has dependencies on layouts and partial views, html-brunch-static already tracks those, but the language you are implementing in your processor might have some way of its own to include the content of other files. If this is the case, you should return those dependencies here so html-brunch-static can track them, too. Otherwise, you can just pass null.

