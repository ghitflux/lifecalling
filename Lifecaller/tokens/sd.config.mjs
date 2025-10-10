import StyleDictionary from 'style-dictionary';
import { register } from '@tokens-studio/sd-transforms';

register(StyleDictionary);

// Custom formats for theme-aware outputs
StyleDictionary.registerFormat({
  name: 'css/theme-variables',
  format: function(dictionary) {
    const tokens = dictionary.allTokens;
    let output = '/**\n * Design Tokens - Auto-generated CSS Variables\n * Do not edit directly, this file was auto-generated.\n */\n\n';

    // Root variables for all themes
    output += ':root {\n';
    tokens.filter(token => !token.name.startsWith('theme-')).forEach(token => {
      output += `  --${token.name}: ${token.value};\n`;
    });
    output += '}\n\n';

    // Dark theme variables
    output += '[data-theme="dark"], .theme-dark {\n';
    tokens.filter(token => token.name.startsWith('theme-dark-')).forEach(token => {
      const cleanName = token.name.replace('theme-dark-', '');
      output += `  --${cleanName}: ${token.value};\n`;
    });
    output += '}\n\n';

    // Light theme variables
    output += '[data-theme="light"], .theme-light {\n';
    tokens.filter(token => token.name.startsWith('theme-light-')).forEach(token => {
      const cleanName = token.name.replace('theme-light-', '');
      output += `  --${cleanName}: ${token.value};\n`;
    });
    output += '}\n';

    return output;
  }
});

StyleDictionary.registerFormat({
  name: 'json/theme-config',
  format: function(dictionary) {
    const themes = {
      dark: {},
      light: {}
    };

    dictionary.allTokens.forEach(token => {
      if (token.name.startsWith('theme-dark-')) {
        const key = token.name.replace('theme-dark-', '').replace(/-/g, '.');
        themes.dark[key] = token.value;
      } else if (token.name.startsWith('theme-light-')) {
        const key = token.name.replace('theme-light-', '').replace(/-/g, '.');
        themes.light[key] = token.value;
      }
    });

    return JSON.stringify({ themes }, null, 2);
  }
});

StyleDictionary.registerFormat({
  name: 'typescript/theme-types',
  format: function(dictionary) {
    const themeKeys = new Set();

    dictionary.allTokens.forEach(token => {
      if (token.name.startsWith('theme-')) {
        const key = token.name.replace(/^theme-[^-]+-/, '').replace(/-/g, '.');
        themeKeys.add(key);
      }
    });

    const typeDefinition = Array.from(themeKeys).map(key => `  '${key}': string;`).join('\n');

    return `/**
 * Design Tokens - Auto-generated TypeScript Types
 * Do not edit directly, this file was auto-generated.
 */

export interface ThemeTokens {
${typeDefinition}
}

export type ThemeMode = 'dark' | 'light';

export interface ThemeConfig {
  themes: Record<ThemeMode, ThemeTokens>;
}
`;
  }
});

export default {
  source: ['tokens/tokens.json'],
  platforms: {
    css: {
      transformGroup: 'tokens-studio',
      buildPath: 'lifecaller/src/styles/',
      files: [
        {
          destination: 'tokens.css',
          format: 'css/theme-variables',
          options: {
            selector: ':root',
            outputReferences: true
          }
        }
      ]
    },
    cssLegacy: {
      transformGroup: 'tokens-studio',
      buildPath: 'lifecaller/src/styles/',
      files: [
        {
          destination: 'tokens-legacy.css',
          format: 'css/variables',
          options: {
            selector: ':root',
            outputReferences: true
          }
        }
      ]
    },
    js: {
      transformGroup: 'tokens-studio',
      buildPath: 'lifecaller/src/styles/',
      files: [
        {
          destination: 'tokens.ts',
          format: 'javascript/es6',
          options: { outputReferences: true }
        }
      ]
    },
    json: {
      transformGroup: 'tokens-studio',
      buildPath: 'lifecaller/src/styles/',
      files: [
        {
          destination: 'theme-config.json',
          format: 'json/theme-config'
        }
      ]
    },
    types: {
      transformGroup: 'tokens-studio',
      buildPath: 'lifecaller/src/styles/',
      files: [
        {
          destination: 'theme-types.ts',
          format: 'typescript/theme-types'
        }
      ]
    },
    scss: {
      transformGroup: 'tokens-studio',
      buildPath: 'lifecaller/src/styles/',
      files: [
        {
          destination: 'tokens.scss',
          format: 'scss/variables',
          options: { outputReferences: true }
        }
      ]
    }
  }
};
