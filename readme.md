# eslint-generate-config-from-sample

> Create an ESLint config for existing code

***WARNING: THIS IS SUPER, SUPER EXPERIMENTAL***

It seems to be kind of working.

## Install
```
npm install --global eslint-generate-config-from-sample
```

Not currently published on npm, so actually need to do:

1. `git clone https://github.com/dustinspecker/eslint-generate-config-from-sample.git`
2. `cd eslint-generate-config-from-sample`
3. `npm i`
4. `npm i -g`
5. Navigate to directory where desired `.eslintrc` file should exist
6. Run `eslint-generate-config-from-sample <file>` on a file to build a rule set for ESLint.

## Usage
Provide a file to analyze like so:

```
eslint-generate-config-from-sample <FILE>
```

`eslint-generate-config-from-sample` only works with a single file for the time being.

`eslint-generate-config-from-sample` will then begin using computer magic (brute forcing the discoverable combintations of rule configurations) to create an ESLint file (`.eslintrc`).

## TODO
 - actually have tests on `src/index.js`
 - refactor the eye bleedingly bad code in `src/rules.js`
 - support sampling multiple files
 - handle rule configurations that allow a number (ignored for now)*
 - handle rule configurations that allow a string (ignored for now)*
 - ECMA Features
  - `impliedStrict`
 - environment detection
 - rules
  - `comma-dangle`
  - `no-multi-spaces`
  - `max-len`
 - find a better name because `eslint-generate-config-from-sample` does not roll off the tongue

\* - might be impossible

## License
MIT © [Dustin Specker](http://dustinspecker.com)
