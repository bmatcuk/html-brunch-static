class Partial
  constructor: (@filename, @template, @context, @options) ->
    @dependencies = @options?.partials or []
    @partials = []

  addPartial: (partial) ->
    @partials.push partial
    @dependencies = @dependencies.concat partial.dependencies

  templateName: ->
    path.basename @filename, path.extname @filename

  compile: (htmlBrunchStatic, hbs, callback) ->
    if @compiledTemplate
      callback null, @compiledTemplate
      return

    processor = htmlBrunchStatic.getProcessor @filename
    processor = PassthruProcessor unless processor
    processor.compile @template, @filename, (err, content, dependencies) ->
      if err
        callback err
        return

      # compiler may add dependencies
      if dependencies and dependencies.constructor is Array
        @dependencies = @dependencies.concat dependencies

      @compiledTemplate = content
      hbs.registerPartial @templateName(), content
      callback null, content

