const eslint = require('eslint')

module.exports = {
  getDefaultEngine() {
    const engine = new eslint.CLIEngine({useEslintrc: false})

    engine.options.parserOptions = {
      ecmaVersion: 8,
      sourceType: 'module',
      ecmaFeatures: {
        globalReturn: true,
        impliedStrict: true,
        jsx: true,
        experimentalObjectRestSpread: true
      }
    }

    return engine
  }
}
