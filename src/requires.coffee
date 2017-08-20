minify = require('html-minifier').minify
yaml = require 'yaml-front-matter'
handlebars = require 'handlebars'
anymatch = require 'anymatch'
path = require 'path'
log = require('util').debuglog 'htmlbrunch'

_ =
  merge: require 'lodash.merge'

