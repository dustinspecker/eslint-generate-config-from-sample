const combinatorics = require('js-combinatorics')
const eslint = require('eslint')

const isEmptyArray = a => Array.isArray(a) && !a.length

const flattenArray = array => [].concat.apply([], array)

const mapSchemas = (schemas, configs) =>
  flattenArray(
    // eslint-disable-next-line no-use-before-define
    schemas.map(s => getRuleConfigurationsFromSchema(s, configs))
  )

const reduceSchemas = (schemas, configs) =>
  // eslint-disable-next-line no-use-before-define
  schemas.reduce((acc, schema) => getRuleConfigurationsFromSchema(schema, acc), configs)

const replaceSchemaRefsWithDefs = (schema, defs) => {
  /* eslint-disable no-param-reassign */
  const newDefs = defs || replaceSchemaRefsWithDefs(schema.defs, schema.defs)
  delete schema.defs

  Object.keys(schema).forEach(s => {
    if (Array.isArray(schema[s])) {
      schema[s] = schema[s].map(s1 => replaceSchemaRefsWithDefs(s1, newDefs))
    } else if (s === '$ref' || s === '$refs') {
      const defsKey = schema[s].replace('#/defs/', '')

      schema = newDefs[defsKey]
    } else if (typeof schema[s] === 'object') {
      schema[s] = replaceSchemaRefsWithDefs(schema[s], defs)
    }
  })

  return schema
}

// eslint-disable-next-line complexity
const getRuleConfigurationsFromSchema = (schema, configs = ['error']) => {
  if (schema.defs) {
    const newSchema = replaceSchemaRefsWithDefs(schema)

    return getRuleConfigurationsFromSchema(newSchema, configs)
  }

  if ('additionalProperties' in schema && schema.additionalProperties !== false) {
    return configs
  }

  if (isEmptyArray(schema)) {
    return configs
  }

  if (Array.isArray(schema)) {
    return reduceSchemas(schema, configs)
  }

  if (schema.type === 'array' && Array.isArray(schema.items)) {
    return reduceSchemas(schema.items, configs)
  }

  if (schema.type === 'array' && schema.items.enum) {
    return getRuleConfigurationsFromSchema(schema.items, configs)
  }

  if (Array.isArray(schema.enum)) {
    return schema.enum.map(e => [...configs, e])
  }

  if (schema.type === 'boolean') {
    return flattenArray([false, true].map(v => [...configs, v]))
  }

  if (schema.type === 'object') {
    const properties = Object.keys(schema.properties)

    const possibleIndividualConfigs = properties
      .map(property => ({
        property,
        values: flattenArray(getRuleConfigurationsFromSchema(schema.properties[property], []))
      }))
      .filter(({values}) => !isEmptyArray(values))

    const possiblePropertyValuePairs = flattenArray(possibleIndividualConfigs
      .map(({property, values}) => values.map(value => ({[property]: value})))
    )

    const combinations = combinatorics.power(possiblePropertyValuePairs)
      .filter(combo => {
        const keys = combo.map(opt => Object.keys(opt)[0])

        return keys.length === new Set(keys).size
      })
      .filter(combo => combo.length === possibleIndividualConfigs.length)
      .map(combo =>
        combo.reduce((acc, c) => Object.assign(acc, c), {})
      )
      .filter(obj => Object.keys(obj).length)

    if (combinations.length === 0) {
      return configs
    }

    return flattenArray(combinations
      .map(combo =>
        configs.map(currentConfig => {
          if (Array.isArray(currentConfig)) {
            return [...currentConfig, combo]
          }

          return [currentConfig, combo]
        })
      )
    )
  }

  if (Array.isArray(schema.anyOf)) {
    return mapSchemas(schema.anyOf, configs)
  }

  if (Array.isArray(schema.oneOf)) {
    return mapSchemas(schema.oneOf)
  }

  return configs
}

const testRule = (engine, text, rule, config) => {
  engine.options.rules = {}
  engine.options.rules[rule] = config

  return engine.executeOnText(text).results[0].errorCount === 0
}

module.exports = {
  getESLintRules() {
    const rulesMap = eslint.linter.getRules()

    return Array.from(rulesMap.keys())
  },
  getRuleConfigurationsFromSchema,
  getSuggestedRuleConfig(engine, text, ruleName) {
    const ruleScema = eslint.linter.getRules().get(ruleName).meta.schema
    const possibleConfig = getRuleConfigurationsFromSchema(ruleScema)

    const validConfigs = possibleConfig
      .map(config => ({
        config,
        valid: testRule(engine, text, ruleName, config)
      }))
      .filter(({valid}) => valid)

    if (validConfigs.length) {
      return validConfigs[0].config
    }

    return ['off']
  },
  testRule
}
