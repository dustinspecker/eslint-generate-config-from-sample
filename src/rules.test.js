const eslint = require('eslint')
const rules = require('./rules')
const test = require('ava')
const utils = require('./utils')

const getDefaultEngine = utils.getDefaultEngine

test('getESLintRules returns array of rules', t => {
  const eslintRules = rules.getESLintRules()

  t.true(Array.isArray(eslintRules))
  t.true(eslintRules.includes('semi'))
})

test('getRuleConfigurationsFromSchema handles simple rules', t => {
  t.deepEqual(rules.getRuleConfigurationsFromSchema([]), ['error'])
})

test('getRuleConfigurationsFromSchema handles enum', t => {
  const schema = [{
    enum: ['always', 'as-needed']
  }]
  const expectedConfigs = [
    ['error', 'always'],
    ['error', 'as-needed']
  ]

  t.deepEqual(rules.getRuleConfigurationsFromSchema(schema), expectedConfigs)
})

test('getRuleConfigurationsFromSchema handles object type with boolean properties', t => {
  const schema = [{
    type: 'object',
    properties: {
      getWithoutSet: {
        type: 'boolean'
      },
      setWithoutGet: {
        type: 'boolean'
      }
    }
  }]
  const expectedConfigs = [
    ['error', {getWithoutSet: false, setWithoutGet: false}],
    ['error', {getWithoutSet: true, setWithoutGet: false}],
    ['error', {getWithoutSet: false, setWithoutGet: true}],
    ['error', {getWithoutSet: true, setWithoutGet: true}]
  ]

  t.deepEqual(rules.getRuleConfigurationsFromSchema(schema), expectedConfigs)
})

test('getRuleConfigurationsFromSchema ignore additionalProperties with non false value', t => {
  const schema = [{
    type: 'object',
    properties: {
      exceptions: {
        type: 'object',
        additionalProperties: {
          type: 'boolean'
        }
      }
    }
  }]
  const expectedConfigs = [
    'error'
  ]

  t.deepEqual(rules.getRuleConfigurationsFromSchema(schema), expectedConfigs)
})

test('getRuleConfigurationsFromSchema handles array of enum and object type', t => {
  const schema = [
    {
      enum: ['always', 'as-needed']
    },
    {
      type: 'object',
      properties: {
        requireForBlockBody: {
          type: 'boolean'
        }
      }
    }
  ]
  const expectedConfigs = [
    ['error', 'always', {requireForBlockBody: false}],
    ['error', 'as-needed', {requireForBlockBody: false}],
    ['error', 'always', {requireForBlockBody: true}],
    ['error', 'as-needed', {requireForBlockBody: true}]
  ]

  t.deepEqual(rules.getRuleConfigurationsFromSchema(schema), expectedConfigs)
})

test('getRuleConfigurations handles anyOf and array type', t => {
  const schema = {
    anyOf: [
      {
        type: 'array',
        items: [
          {
            enum: ['always', 'never']
          }
        ]
      },
      {
        type: 'array',
        items: [
          {
            enum: ['as-needed']
          },
          {
            type: 'object',
            properties: {
              requireReturnForObjectLiteral: {
                type: 'boolean'
              }
            }
          }
        ]
      }
    ]
  }
  const expectedConfigs = [
    ['error', 'always'],
    ['error', 'never'],
    ['error', 'as-needed', {requireReturnForObjectLiteral: false}],
    ['error', 'as-needed', {requireReturnForObjectLiteral: true}]
  ]

  t.deepEqual(rules.getRuleConfigurationsFromSchema(schema), expectedConfigs)
})

test('getRuleConfigurationsFromSchema handles oneOf', t => {
  const schema = [
    {
      oneOf: [
        {
          enum: ['before', 'after', 'both', 'neither']
        },
        {
          type: 'object',
          properties: {
            before: {
              type: 'boolean'
            },
            after: {
              type: 'boolean'
            }
          }
        }
      ]
    }
  ]
  const expectedConfigs = [
    ['error', 'before'],
    ['error', 'after'],
    ['error', 'both'],
    ['error', 'neither'],
    ['error', {before: false, after: false}],
    ['error', {before: true, after: false}],
    ['error', {before: false, after: true}],
    ['error', {before: true, after: true}]
  ]

  t.deepEqual(rules.getRuleConfigurationsFromSchema(schema), expectedConfigs)
})

test('getRuleConfigurations ignores items as object', t => {
  const schema = [{
    type: 'array',
    items: {
      type: 'string'
    }
  }]
  const expectedConfigs = [
    'error'
  ]

  t.deepEqual(rules.getRuleConfigurationsFromSchema(schema), expectedConfigs)
})

test('getRuleConfigurationsFromSchema ignores object properties with non boolean type', t => {
  const schema = [
    {
      type: 'object',
      properties: {
        allowKeywords: {
          type: 'boolean'
        },
        allowPattern: {
          type: 'string'
        }
      }
    }
  ]
  const expectedConfigs = [
    ['error', {allowKeywords: false}],
    ['error', {allowKeywords: true}]
  ]

  t.deepEqual(rules.getRuleConfigurationsFromSchema(schema), expectedConfigs)
})

test('getRuleConfigurationsFromSchema handles object with with properties not having type', t => {
  const schema = [
    {
      oneOf: [
        {
          enum: ['above', 'beside']
        },
        {
          type: 'object',
          properties: {
            position: {
              enum: ['above', 'beside']
            },
            ignorePattern: {
              type: 'string'
            },
            applyDefaultPatterns: {
              type: 'boolean'
            }
          }
        }
      ]
    }
  ]
  const expectedConfigs = [
    ['error', 'above'],
    ['error', 'beside'],
    ['error', {position: 'above', applyDefaultPatterns: false}],
    ['error', {position: 'beside', applyDefaultPatterns: false}],
    ['error', {position: 'above', applyDefaultPatterns: true}],
    ['error', {position: 'beside', applyDefaultPatterns: true}]
  ]

  t.deepEqual(rules.getRuleConfigurationsFromSchema(schema), expectedConfigs)
})

test('getRuleConfigurationsFromSchema ignores properties that cannot be determined', t => {
  const schema = [
    {
      type: 'object',
      properties: {
        min: {
          type: 'number'
        },
        max: {
          type: 'number'
        },
        exceptions: {
          type: 'array',
          uniqueItems: true,
          items: {
            type: 'string'
          }
        },
        properties: {
          enum: ['always', 'never']
        }
      }
    }
  ]
  const expectedConfigs = [
    ['error', {properties: 'always'}],
    ['error', {properties: 'never'}]
  ]
  t.deepEqual(rules.getRuleConfigurationsFromSchema(schema), expectedConfigs)
})

test('getRuleConfigurationsFromSchema handles ref', t => {
  const schema = [
    {
      defs: {
        value: {
          enum: [
            'always'
          ]
        },
        valueWithIgnore: {
          anyOf: [
            {
              $ref: '#/defs/value'
            },
            {
              enum: ['ignore']
            }
          ]
        }
      },
      anyOf: [
        {
          $ref: '#/defs/value'
        },
        {
          type: 'object',
          properties: {
            arrays: {
              $refs: '#/defs/valueWithIgnore'
            },
            objects: {
              $refs: '#/defs/valueWithIgnore'
            }
          }
        }
      ]
    }
  ]
  const expectedConfigs = [
    ['error', 'always'],
    ['error', {arrays: 'always', objects: 'always'}],
    ['error', {arrays: 'ignore', objects: 'always'}],
    ['error', {arrays: 'always', objects: 'ignore'}],
    ['error', {arrays: 'ignore', objects: 'ignore'}]
  ]

  t.deepEqual(rules.getRuleConfigurationsFromSchema(schema), expectedConfigs)
})

test('getRuleConfigurationsFromSchema handles items having an enum', t => {
  const schema = [
    {
      type: 'object',
      properties: {
        allow: {
          type: 'array',
          items: {
            enum: ['^', '|']
          }
        }
      }
    }
  ]
  const expectedConfigs = [
    ['error', {allow: '^'}],
    ['error', {allow: '|'}]
  ]

  t.deepEqual(rules.getRuleConfigurationsFromSchema(schema), expectedConfigs)
})

test('getSuggestedRuleConfig', t => {
  const engine = getDefaultEngine()
  const text = 'var hello = 3'
  const expectedConfig = ['error', 'never']

  t.deepEqual(rules.getSuggestedRuleConfig(engine, text, 'semi'), expectedConfig)
})

test('getSuggestedRuleConfig handles more complicatd', t => {
  const engine = getDefaultEngine()
  const text = 'var x = b === y && z === null'
  const expectedConfig = ['error', 'always', {null: 'always'}]

  t.deepEqual(rules.getSuggestedRuleConfig(engine, text, 'eqeqeq'), expectedConfig)
})

test('getSuggestedRuleConfig returns off when no valid config found', t => {
  const engine = getDefaultEngine()
  const text = 'var x = 3;\n var y = 4'
  const expectedConfig = ['off']

  t.deepEqual(rules.getSuggestedRuleConfig(engine, text, 'semi'), expectedConfig)
})

test('testRule returns true when rule and config pass', t => {
  const engine = getDefaultEngine()
  const text = 'var hello = 3'

  t.true(rules.testRule(engine, text, 'semi', 'off'))
})

test('testRule returns false when rule and config do not pass', t => {
  const engine = getDefaultEngine()
  const text = 'var hello = 3'

  t.false(rules.testRule(engine, text, 'no-var', 'error'))
})

test.skip('verify rules do not blow up with config', t => {
  const engine = getDefaultEngine()
  const eslintRules = rules.getESLintRules()

  eslintRules.forEach(rule => {
    if (rule === 'comma-dangle' || rule === 'no-multi-spaces') {
      return
    }
    const schema = eslint.linter.getRules().get(rule).meta.schema
    const configurations = rules.getRuleConfigurationsFromSchema(schema)
    configurations.forEach(config => {
      t.true(rules.testRule(engine, '', rule, config))
    })
  })
})
