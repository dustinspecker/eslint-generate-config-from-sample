const setupEcmaFeature = (engine, feature, text) => {
  engine.options.parserOptions.ecmaFeatures[feature] = false

  const report = engine.executeOnText(text)
  if (report.errorCount) {
    engine.options.parserOptions.ecmaFeatures[feature] = true
  }
}

const ecmaVersionTest = (engine, ecmaVersion, text) => {
  engine.options.parserOptions.ecmaVersion = ecmaVersion

  return {
    ecmaVersion,
    report: engine.executeOnText(text)
  }
}

const isErrorFreeReport = ({report}) => !report.errorCount

module.exports = {
  setupEcmaVersionAndSourceType(engine, text) {
    engine.options.parserOptions.sourceType = 'script'
    const ecmaVersions = [3, 5, 6, 7, 8]

    const ecmaVersionsWithScriptSourceType = ecmaVersions
      .map(ecmaVersion => ecmaVersionTest(engine, ecmaVersion, text))

    const validEcmaVersionsWithScript = ecmaVersionsWithScriptSourceType
      .filter(isErrorFreeReport)

    if (validEcmaVersionsWithScript.length) {
      engine.options.parserOptions.ecmaVersion = validEcmaVersionsWithScript[0].ecmaVersion

      return
    }

    engine.options.parserOptions.sourceType = 'module'
    const ecmaVersionsSupportingModules = [6, 7, 8]
    const validEcmaVersionsWithModules = ecmaVersionsSupportingModules
      .map(ecmaVersion => ecmaVersionTest(engine, ecmaVersion, text))
      .filter(isErrorFreeReport)

    engine.options.parserOptions.ecmaVersion = validEcmaVersionsWithModules[0].ecmaVersion
  },
  setupExperimentalObjectRestSpread(engine, text) {
    setupEcmaFeature(engine, 'experimentalObjectRestSpread', text)
  },
  setupGlobalReturn(engine, text) {
    setupEcmaFeature(engine, 'globalReturn', text)
  },
  setupJSX(engine, text) {
    setupEcmaFeature(engine, 'jsx', text)
  }
}
