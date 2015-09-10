class TemplateLoader
  constructor: ->
    @cache = {}

  load: (filename, data) ->
    return @cache[filename] if @cache[filename]

    # parse the front matter
    context = yaml.loadFront(data or filename, '_content')
    return context if context instanceof Error
    return new Error("Could not parse #{filename}.") if context is false

    # pull out content and settings
    template = context._content
    options = context._options
    delete context._content
    delete context._options
    template = new Template filename, template, context, options
    @cache[filename] = template

    # load partials
    if options?.partials
      for file in options.partials
        partial = @loadPartial file
        return partial if partial instanceof Error
        template.addPartial partial

    # if there's a layout, load that
    if options?.layout
      layout = @load options.layout
      return layout if layout instanceof Error
      layout.setContent template
      return layout
    return template

  loadPartial: (filename) ->
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

