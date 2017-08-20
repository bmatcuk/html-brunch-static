class Partial extends BasePartial
  templateName: ->
    path.basename @filename

  registerPartial: (hbs) ->
    name = do @templateName
    hbs.registerPartial name, @compiledPartial
    while (ext = path.extname(name)).length > 0
      name = path.basename name, ext
      hbs.registerPartial name, @compiledPartial

  compile: (htmlBrunchStatic, hbs, callback) ->
    log "COMPILING PARTIAL #{@filename}"
    if @compiledPartial
      @registerPartial hbs
      callback null, @compiledPartial, @dependencies
      return

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

          @compiledPartial = content
          @registerPartial hbs
          callback null, content, @dependencies
      catch err
        callback err

