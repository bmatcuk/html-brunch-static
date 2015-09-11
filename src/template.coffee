class Template
  constructor: (@filename, @template, @context, @options) ->
    @dependencies = []
    @dependencies.push @options.layout if @options?.layout
    @dependencies = @dependencies.concat @options.partials if @options?.partials
    @partials = []

  addPartial: (partial) ->
    @partials.push partial
    @dependencies = @dependencies.concat partial.dependencies

  # layouts have a content template
  setContent: (template) ->
    @content = template

    # merge context
    @context = _.merge {}, template.context, @context

    # merge dependencies
    @dependencies = @dependencies.concat template.dependencies

  compilePartials: (htmlBrunchStatic, hbs, callback) ->
    if @partials.length > 0
      count = @patials.length
      done = (err, content) ->
        if err
          count = -1
          callback err
        return if count < 0
        do callback if --count is 0
      partial.compile htmlBrunchStatic, hbs, done for partial in @partials
    else
      do callback

  compile: (htmlBrunchStatic, callback) ->
    hbs = do handlebars.create
    run = =>
      @compilePartials htmlBrunchStatic, hbs, (err) =>
        if err
          callback err
          return

        processor = htmlBrunchStatic.getProcessor @filename
        processor = PassthruProcessor unless processor
        processor.compile @template, @filename, (err, content, dependencies) =>
          if err
            callback err
            return

          # compiler may add dependencies
          if dependencies and dependencies.constructor is Array
            @dependencies = @dependencies.concat dependencies

          # process through handlebars
          template = hbs.compile content, @options?.handlebars
          result = template @context
          callback null, result

    if @content
      @content.compile htmlBrunchStatic, (err, content) ->
        if err
          callback err
          return
        hbs.registerHelper 'content', ->
          new handlebars.SafeString content
        do run
    else
      do run

