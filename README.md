# html-brunch-static
Transform static html files in brunch.

html-brunch-static is a processor for [brunch-static](https://github.com/bmatcuk/brunch-static), a [brunch](http://brunch.io/) plugin designed to handle static files. html-brunch-static can convert a variety of template languages into static html files with support for layouts and partial views.

## Installation
html-brunch-static depends on [brunch-static](https://github.com/bmatcuk/brunch-static), so, you will need to install both plugins. The recommended method is via npm:

```bash
npm install --save brunch-static html-brunch-static
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
          hbsFiles: ...
        }
      ]
```

* **processors** _(default: [])_
  > _processors_ is an array of html processors. See [available processors](#available-processors) below for a list.

* **defaultContext** _(default: {})_
  > To set default values for the _context_ of your files, use _defaultContext_. See "[Context, Layouts, and Partials](#context-layouts-and-partials)" below for more details on the context.

* **partials** _(default: /partials?/)_
  > _partials_ is an [anymatch](https://github.com/es128/anymatch) that will be used to determine what files are [partials](#partials). This means it can be either a string with globs, a regex, or a function that takes a single parameter (a filename) and returns true if it is a partial view and false otherwise. The default setting will match any filename that includes the word "partial" (or "partials") anywhere in the path, for example: `app/partials/whatever.ext`.

* **layouts** _(default: /layouts?/)_
  > Like _partials_ above, _layouts_ is an [anymatch](https://github.com/es128/anymatch) that will be used to determine what files are [layouts](#layouts). It may also be a string with globs, a regex, or a function that takes a filename and returns true/false. The default setting will match any filename that includes the word "layout" (or "layouts") anywhere in the path, for example: `app/layouts/whatever.ext`.

* **hbsFiles** _(default: false)_
  > If true, enables the built-in support for handlebar files.

The value of _partials_ and _layouts_ may be the same if you want to put them all together. In a lot of similar static site generators, partials and layouts might start with an underscore, such as `_layout.html`. You can do this (and set _partials_ and _layouts_ to something like `"**/_*"`), but be aware that, by default, brunch will ignore any files that start with an underscore. What this means is that any changes to these files will not trigger brunch to recompile any files that are dependent on those partials and layouts. This problem can be fixed if you change brunch's `conventions.ignored` setting to not ignore files that begin with an underscore.

## Available Processors
Below are the currently available processors for html-brunch-static. If you'd like for your processor to be included in this list, [create an issue](https://github.com/bmatcuk/brunch-static/issues/new) with your project's URL and a description.

* Markdown: [marked-brunch-static](https://github.com/bmatcuk/marked-brunch-static)
* Jade: [jade-brunch-static](https://github.com/bmatcuk/jade-brunch-static)
* Handlebars: built-in (see the [hbsFiles option](#configuration) above.

## Context, Layouts, and Partials
html-brunch-static has full support for using layouts and partials in your templates. In fact, you can have multiple levels of layouts if you'd like. These features are orchestrated by including [YAML](http://yaml.org/) or JSON _front matter_ at the top of your template files. Front matter sets the _context_ of the file, which is bubbled up (and possibily overridden) by the layout, and the layout's layout, etc. For example:

Let's say I have the following file `app/index.md`:

```markdown
---
title: html-brunch-static's awesome test page
_options:
  layout: app/layouts/main.jade
  partials:
    app/partials/greetings.html
---
{{>greetings}}

This is **html-brunch-static's** super awesome test page.
```

Everything between the `---`'s is the front matter. Here, I've chosen to write my front matter in [YAML](http://yaml.org/), but I could have also written it in JSON. This whole block is referred to as the _context_ of this file.

In this example, We can see that this file wants to use a layout (`app/layouts/main.jade`) and includes one partial view (`app/partials/greetings.html`). All partial views that your file uses must be declared in the front matter so that html-brunch-static knows to load them. This also illustrates another powerful feature of html-brunch-static: layouts and partials can be written in any templating language that html-brunch-static has a processor for, and they don't need to match. This file is written in markdown, the layout in jade, and the partial is a boring html file (but could have been anything). Neat!

What's that `{{>greetings}}` thing all about? Well, after html-brunch-static converts your file to html, it runs the file through [handlebars](http://handlebarsjs.com/) to allow your files to use the context to do some cool things. Here, `{{>...}}` is the handlebars way of saying "use the partial called greetings". Since we declared that we're using the `app/partials/greetings.html` partial in our front matter, it will be loaded and inserted into your file here. Note that the name of the partial is equal to the basename of the file, without the extension (so `app/partials/greetings.html` becomes `greetings`).

Ok, so what does our partial look like? I give you `app/partials/greetings.html`:

```html
<h1>Welcome to {{title}}</h1>
```

Pretty simple. This file has no front matter of its own, but since it's being included in our index.md, it inherits the _context_ of index.md. This means that our `title` is available to it. Neat!

Finally, our layout, `app/layouts/main.jade`:

```jade
doctype html
html
  head
    title {{title}}
  body
    | {{content}}
```

The _context_ of our page bubbles up to our layout, so our title is still available. If our layout included some front matter of its own, it could override the title. The content of our page is available to the layout with the `{{content}}`. That "pipe" (`|`) in front of `{{content}}` is just [jade](http://jade-lang.com/)'s way of saying that everything after it should just be included on the page verbatim.

Alright, let's take a quick look at our `package.json`:

```javascript
{
  ...
  "devDependencies": {
    "brunch": "x.y.z",
    "brunch-static": "x.y.z",
    "html-brunch-static": "x.y.z",
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
    <h1>Welcome to html-brunch-static's awesome test page.</h1>
    <p>This is <b>html-brunch-static's</b> super awesome test page.</p>
  </body>
</html>
```

