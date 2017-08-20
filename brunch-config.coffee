exports.config =
  paths:
    public: '.'
    watched: ['src']

  files:
    javascripts:
      joinTo: 'index.js'
      order:
        before: 'src/requires.coffee'
        after: 'src/html-brunch-static.coffee'

  modules:
    wrapper: false
    definition: false

  sourceMaps: false

  overrides:
    production:
      optimize: false

  npm: enabled: false

