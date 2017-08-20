class BasePartial
  constructor: (@filename, @template, @context, @options) ->
    @dependencies = []
    @dependencies = @dependencies.concat @options.partials if @options?.partials
    @partials = []
    @partialsCompiled = false

  addPartial: (partial) ->
    @partials.push partial

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
