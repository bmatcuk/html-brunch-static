class TemplateLoader
  constructor: ->
    @cache = {}

  load: (filename, data, defaultContext, content) ->
    log "LOAD #{filename}"
    return @cache[filename] if @cache[filename]

    # parse the front matter
    context = yaml.loadFront(data or filename, '_content')
    return context if context instanceof Error
    return new Error("Could not parse #{filename}.") if context is false

    # pull out content and settings
    context = _.merge {}, defaultContext, context if defaultContext
    template = context._content
    options = context._options
    delete context._content
    delete context._options
    template = new Template filename, template, context, options
    template.setContent content if content
    @cache[filename] = template

    # load partials
    if options?.partials
      for file in options.partials
        partial = @loadPartial file
        return partial if partial instanceof Error
        template.addPartial partial

    # if there's a layout, load that
    if options?.layout
      layout = @load options.layout, null, defaultContext, template
      return layout if layout instanceof Error
      return layout
    return template

  loadPartial: (filename) ->
    log "LOAD PARTIAL #{filename}"
    return @cache[filename] if @cache[filename]

    # parse front matter
    context = yaml.loadFront filename, '_content'
    return context if context instanceof Error
    return new Error("Could not parse #{filename}.") if context is false

    # create partial
    template = context._content
    options = context._options
    delete context._content
    delete context._options
    partial = new Partial filename, template, context, options
    @cache[filename] = partial

    # load child partials
    if partial.options?.partials
      for file in partial.options.partials
        child = @loadPartial file
        return child if child instanceof Error
        partial.addPartial child
    return partial

