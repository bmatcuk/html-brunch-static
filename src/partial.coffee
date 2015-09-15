class Partial
  constructor: (@filename, @template, @context, @options) ->
    @dependencies = @options?.partials or []
    @compilerDependencies = null
    @partials = []

  addPartial: (partial) ->
    @partials.push partial
    @dependencies = @dependencies.concat partial.dependencies

  templateName: ->
    path.basename @filename, path.extname @filename

  compile: (htmlBrunchStatic, hbs, callback) ->
    if @compiledTemplate
      callback null, @compiledTemplate, @compilerDependencies
      return

    processor = htmlBrunchStatic.getProcessor @filename
    processor = PassthruProcessor unless processor
    processor.compile @template, @filename, @options, (err, content, dependencies) =>
      if err
        callback err
        return

      @compiledTemplate = content
      @compilerDependencies = dependencies
      hbs.registerPartial @templateName(), content
      callback null, content, dependencies

