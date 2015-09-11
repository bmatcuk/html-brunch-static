class HtmlBrunchStatic
  constructor: (config) ->
    @processors = config?.processors or []
    @defaultContext = config?.defaultContext
    @partialsAndLayouts = config?.partialsAndLayouts or /(?:partial|layout)s?/

  handles: (filename) ->
    @getProcessor(filename) isnt null

  getProcessor: (filename) ->
    map = (p) ->
      if p.handles.constructor is Function
        (f) -> p.handles f
      else
        p.handles
    processorIdx = anymatch @processors.map(map), filename, true
    if processorIdx is -1 then null else @processors[processorIdx]

  transformPath: (filename) ->
    processor = @getProcessor filename
    return filename unless processor
    if processor.transformPath
      processor.transformPath filename
    else
      filename.replace(new RegExp(path.extname(filename) + '$'), '.html')

  compile: (data, filename, callback) ->
    if anymatch @partialsAndLayouts, filename
      # don't output partials and layouts
      callback null, '', true
      return

    loader = new TemplateLoader
    template = loader.load filename, data, @defaultContext
    if template instanceof Error
      callback template
      return
    template.compile @, (err, content) ->
      if err
        callback err
        return

      callback null, content, template.dependencies

module.exports = (config) -> new HtmlBrunchStatic config

