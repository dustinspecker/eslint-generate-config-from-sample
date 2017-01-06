const parser = require('./parser')
const test = require('ava')
const utils = require('./utils')

const getDefaultEngine = utils.getDefaultEngine

test('setupExperimentalObjectRestSpread determines if experimentalObjectRestSpread needs to be enabled', t => {
  const engine = getDefaultEngine()

  const textWithoutObjectSpread = 'var hello = 3'
  parser.setupExperimentalObjectRestSpread(engine, textWithoutObjectSpread)
  t.false(engine.options.parserOptions.ecmaFeatures.experimentalObjectRestSpread)

  const textWithObjectSpread = 'var x = {..{y: 3}}'
  parser.setupExperimentalObjectRestSpread(engine, textWithObjectSpread)
  t.true(engine.options.parserOptions.ecmaFeatures.experimentalObjectRestSpread)
})

test('setupGlobalReturn determines if globalReturn needs to be enabled', t => {
  const engine = getDefaultEngine()

  const textWithoutGlobalReturn = 'var hello = 3'
  parser.setupGlobalReturn(engine, textWithoutGlobalReturn)
  t.false(engine.options.parserOptions.ecmaFeatures.globalReturn)

  const textWithGlobalReturn = 'return 3'
  parser.setupGlobalReturn(engine, textWithGlobalReturn)
  t.true(engine.options.parserOptions.ecmaFeatures.globalReturn)
})

test('setupJSX determines if JSX needs to be enabled', t => {
  const engine = getDefaultEngine()

  const textWithoutJSX = 'var hello = 3'
  parser.setupJSX(engine, textWithoutJSX)
  t.false(engine.options.parserOptions.ecmaFeatures.jsx)

  const textWithJSX = '<List />'
  parser.setupJSX(engine, textWithJSX)
  t.true(engine.options.parserOptions.ecmaFeatures.jsx)
})

test('setupEcmaVersionAndSourceType determines ecmaVersion and sourceType', t => {
  const engine = getDefaultEngine()

  const es3ScriptText = 'var hello = 3'
  parser.setupEcmaVersionAndSourceType(engine, es3ScriptText)
  t.is(engine.options.parserOptions.ecmaVersion, 3)
  t.is(engine.options.parserOptions.sourceType, 'script')

  const es7ScriptText = 'var hello = 3 ** 7'
  parser.setupEcmaVersionAndSourceType(engine, es7ScriptText)
  t.is(engine.options.parserOptions.ecmaVersion, 7)
  t.is(engine.options.parserOptions.sourceType, 'script')

  const es8ScriptText = 'async function hello() {}'
  parser.setupEcmaVersionAndSourceType(engine, es8ScriptText)
  t.is(engine.options.parserOptions.ecmaVersion, 8)
  t.is(engine.options.parserOptions.sourceType, 'script')

  const es6ModuleText = 'import test from "ava"'
  parser.setupEcmaVersionAndSourceType(engine, es6ModuleText)
  t.is(engine.options.parserOptions.ecmaVersion, 6)
  t.is(engine.options.parserOptions.sourceType, 'module')

  const es7ModuleText = 'import test from "ava"; var x = 3 ** 3'
  parser.setupEcmaVersionAndSourceType(engine, es7ModuleText)
  t.is(engine.options.parserOptions.ecmaVersion, 7)
  t.is(engine.options.parserOptions.sourceType, 'module')

  const es8ModuleText = 'import test from "ava"; async function test() {}'
  parser.setupEcmaVersionAndSourceType(engine, es8ModuleText)
  t.is(engine.options.parserOptions.ecmaVersion, 8)
  t.is(engine.options.parserOptions.sourceType, 'module')
})
