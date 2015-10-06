class HandlebarsBrunchStatic
  constructor: (config) ->
    unless config.constructor is Boolean
      if config.constructor is Object
        if config.fileMatch
          @handles = config.fileMatch
        if config.fileTransform
          @transformPath = config.fileTransform
      else
        # deprecated functionality
        @handles = config

  handles: /\.static\.(?:hbs|handlebars)$/

  transformPath: (filename) ->
    filename.replace /\.static\.\w+$/, '.html'

  compile: (data, filename, options, callback) ->
    # do nothing because html-brunch-static processes through handlebars already
    callback null, data

