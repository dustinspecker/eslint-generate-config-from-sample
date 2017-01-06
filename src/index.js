#!/usr/bin/env node
const chalk = require('chalk')
const fs = require('fs')
const logUpdate = require('log-update')
const parser = require('./parser')
const pify = require('pify')
const rules = require('./rules')
const utils = require('./utils')

const engine = utils.getDefaultEngine()
let ruleConfigs

pify(fs.readFile)(process.argv[2])
  .then(data => data.toString())
  .then(text => {
    parser.setupJSX(engine, text)
    parser.setupGlobalReturn(engine, text)
    parser.setupExperimentalObjectRestSpread(engine, text)
    parser.setupEcmaVersionAndSourceType(engine, text)

    const eslintRules = rules.getESLintRules()

    ruleConfigs = eslintRules
      .filter(rule => rule !== 'comma-dangle')
      .filter(rule => rule !== 'no-multi-spaces')
      .filter(rule => rule !== 'max-len')
      .map(ruleName => {
        logUpdate(`testing rule configurations for: ${chalk.yellow(ruleName)}`)

        return {
          ruleName,
          config: rules.getSuggestedRuleConfig(engine, text, ruleName)
        }
      })
      .reduce((configObj, {ruleName, config}) =>
        Object.assign(configObj, {[ruleName]: config})
    , {})

    logUpdate('writing .eslintrc')

    return pify(fs.open)('.eslintrc', 'wx')
  })
  .then(file => {
    const eslintrc = {
      parserOptions: {},
      rules: {}
    }

    Object.assign(eslintrc.parserOptions, engine.options.parserOptions)
    Object.assign(eslintrc.rules, ruleConfigs)

    return pify(fs.write)(file, JSON.stringify(eslintrc, null, 2))
  })
  .then(() => console.log(`${chalk.green('created')} .eslintrc`))
  .catch(err => {
    if (err.code === 'EEXIST') {
      console.error('.eslintrc file already exists!')

      return
    }

    throw err
  })
