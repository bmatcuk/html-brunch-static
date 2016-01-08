class Template
  constructor: (@filename, @template, @context, @options) ->
    @dependencies = []
    @dependencies.push @options.layout if @options?.layout
    @dependencies = @dependencies.concat @options.partials if @options?.partials
    @partials = []
    @partialsCompiled = false

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
    if @partialsCompiled or @partials.length is 0
      do callback
      return

    count = @partials.length
    done = (err, content, dependencies) =>
      if err
        count = -1
        callback err
      return if count < 0

      # partial's compiler may add some dependencies
      if dependencies and dependencies.constructor is Array
        @dependencies = @dependencies.concat dependencies

      if --count is 0
        @partialsCompiled = true
        do callback
    partial.compile htmlBrunchStatic, hbs, done for partial in @partials

  compile: (htmlBrunchStatic, callback) ->
    hbs = do handlebars.create
    hbs.registerHelper htmlBrunchStatic.handlebarsHelpers if htmlBrunchStatic.handlebarsHelpers?
    run = =>
      @compilePartials htmlBrunchStatic, hbs, (err) =>
        if err
          callback err
          return

        processor = htmlBrunchStatic.getProcessor @filename
        processor = PassthruProcessor unless processor
        try
          processor.compile @template, @filename, @options, (err, content, dependencies) =>
            if err
              callback err
              return

            # compiler may add dependencies
            if dependencies and dependencies.constructor is Array
              @dependencies = @dependencies.concat dependencies

            # process through handlebars
            hbsOptions = _.merge {}, htmlBrunchStatic.handlebarsOptions, @options?.handlebars
            try
              template = hbs.compile content, hbsOptions
              result = template @context
              callback null, result
            catch err
              callback err
        catch err
          callback err

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

