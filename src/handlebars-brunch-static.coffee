class HandlebarsBrunchStatic
  constructor: (config) ->
    unless config.constructor is Boolean
      @handles = config

  handles: /\.static\.(?:hbs|handlebars)$/

  transformPath: (filename) ->
    filename.replace /\.static\.\w+$/, '.html'

  compile: (data, filename, options, callback) ->
    # do nothing because html-brunch-static processes through handlebars already
    callback null, data

