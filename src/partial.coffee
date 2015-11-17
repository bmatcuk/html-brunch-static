class Partial
  constructor: (@filename, @template, @context, @options) ->
    @dependencies = @options?.partials or []
    @compilerDependencies = null
    @partials = []

  addPartial: (partial) ->
    @partials.push partial
    @dependencies = @dependencies.concat partial.dependencies

  templateName: ->
    path.basename @filename

  registerPartial: (hbs) ->
    name = do @templateName
    hbs.registerPartial name, @compiledTemplate
    while (ext = path.extname(name)).length > 0
      name = path.basename name, ext
      hbs.registerPartial name, @compiledTemplate

  compile: (htmlBrunchStatic, hbs, callback) ->
    if @compiledTemplate
      @registerPartial hbs
      callback null, @compiledTemplate, @compilerDependencies
      return

    processor = htmlBrunchStatic.getProcessor @filename
    processor = PassthruProcessor unless processor
    try
      processor.compile @template, @filename, @options, (err, content, dependencies) =>
        if err
          callback err
          return

        @compiledTemplate = content
        @compilerDependencies = dependencies
        @registerPartial hbs
        callback null, content, dependencies
    catch err
      callback err

