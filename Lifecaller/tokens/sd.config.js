const StyleDictionary = require('style-dictionary');
const { registerTransforms } = require('@tokens-studio/sd-transforms');

registerTransforms(StyleDictionary);

module.exports = {
  source: ['tokens/tokens.json'],
  platforms: {
    css: {
      transformGroup: 'tokens-studio',
      buildPath: 'lifecaller/src/styles/',
      files: [
        {
          destination: 'tokens.css',
          format: 'css/variables',
          options: { selector: ':root', outputReferences: true }
        }
      ]
    },
    ts: {
      transformGroup: 'tokens-studio',
      buildPath: 'lifecaller/src/styles/',
      files: [
        {
          destination: 'tokens.ts',
          format: 'javascript/es6',
          options: { outputReferences: true }
        }
      ]
    }
  }
};
