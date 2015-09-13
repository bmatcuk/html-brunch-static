class HandlebarsBrunchStatic
  handles: /\.static\.(?:hbs|handlebars)$/

  transformPath: (filename) ->
    filename.replace /\.static\.\w+$/, '.html'

  compile: (data, filename, callback) ->
    # do nothing because html-brunch-static processes through handlebars already
    callback null, data

