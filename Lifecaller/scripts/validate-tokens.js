#!/usr/bin/env node

/**
 * Design Token Validation Script
 *
 * This script validates all design tokens for consistency, accessibility,
 * and quality. It can be run as part of CI/CD pipeline or during development.
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bold: '\x1b[1m'
};

// Utility functions (simplified versions of the TypeScript utilities)
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function getLuminance(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;

  const { r, g, b } = rgb;
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(color1, color2) {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

// Validation rules (simplified)
const validationRules = [
  {
    name: 'color-format',
    description: 'Color tokens must use valid hex format',
    severity: 'error',
    validate: (tokenName, value) => {
      if (!tokenName.includes('color') && !tokenName.includes('bg') && !tokenName.includes('text') && !tokenName.includes('brand') && !tokenName.includes('stroke')) {
        return { valid: true };
      }

      const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      const rgbRegex = /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/;
      const rgbaRegex = /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/;
      const hslRegex = /^hsl\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\)$/;
      const hslaRegex = /^hsla\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*,\s*[\d.]+\s*\)$/;

      const isValid = hexRegex.test(value) || rgbRegex.test(value) || rgbaRegex.test(value) ||
                     hslRegex.test(value) || hslaRegex.test(value);

      return {
        valid: isValid,
        message: isValid ? undefined : `Invalid color format: ${value}`,
        suggestion: 'Use hex (#FF0000), rgb(255, 0, 0), or rgba(255, 0, 0, 0.5) format'
      };
    }
  },
  {
    name: 'text-contrast',
    description: 'Text colors must meet WCAG AA contrast requirements',
    severity: 'warning',
    validate: (tokenName, value, allTokens) => {
      // Skip text-inverse as it's meant for opposite backgrounds
      if (!tokenName.includes('text') || tokenName.includes('text-inverse')) {
        return { valid: true };
      }

      // Only check primary text colors against primary backgrounds
      const backgroundTokens = Object.keys(allTokens)
        .filter(key => key.includes('bg') && !key.includes('card'))
        .map(key => allTokens[key])
        .filter(Boolean);

      for (const bgColor of backgroundTokens) {
        const contrast = getContrastRatio(value, bgColor);
        if (contrast < 4.5) {
          return {
            valid: false,
            message: `Low contrast ratio (${contrast.toFixed(2)}) with primary background`,
            suggestion: 'Ensure contrast ratio is at least 4.5:1 for WCAG AA compliance'
          };
        }
      }

      return { valid: true };
    }
  }
];

// Main validation function
function validateTokens(tokens) {
  const results = [];
  let errorCount = 0;
  let warningCount = 0;

  for (const [tokenName, value] of Object.entries(tokens)) {
    for (const rule of validationRules) {
      const result = rule.validate(tokenName, value, tokens);

      if (!result.valid) {
        results.push({
          tokenName,
          value,
          rule: rule.name,
          severity: rule.severity,
          message: result.message,
          suggestion: result.suggestion
        });

        if (rule.severity === 'error') errorCount++;
        if (rule.severity === 'warning') warningCount++;
      }
    }
  }

  return { results, errorCount, warningCount };
}

// Extract tokens from the tokens.json file
function extractTokens(tokensData) {
  const extracted = {};

  function extractRecursive(obj, prefix = '') {
    for (const [key, value] of Object.entries(obj)) {
      if (value && typeof value === 'object' && 'value' in value) {
        // This is a token
        const tokenName = prefix ? `${prefix}-${key}` : key;
        extracted[tokenName] = value.value;
      } else if (value && typeof value === 'object') {
        // This is a nested object
        const newPrefix = prefix ? `${prefix}-${key}` : key;
        extractRecursive(value, newPrefix);
      }
    }
  }

  // Extract from theme/dark section for validation
  if (tokensData['theme/dark']) {
    extractRecursive(tokensData['theme/dark'], '');
  }

  return extracted;
}

// Accessibility check
function checkAccessibility(tokens) {
  const issues = [];
  let score = 100;

  // Define logical text-background pairs to test
  const textBgPairs = [
    // Primary text on primary backgrounds
    { text: 'color-text-primary', bg: 'color-surface-background' },
    { text: 'color-text-secondary', bg: 'color-surface-background' },
    { text: 'color-text-muted', bg: 'color-surface-background' },
    // Text on card backgrounds
    { text: 'color-text-primary', bg: 'color-surface-card' },
    { text: 'color-text-secondary', bg: 'color-surface-card' },
    // Inverse text should be tested against brand colors (dark backgrounds)
    { text: 'color-text-inverse', bg: 'color-brand-primary' },
  ];

  for (const pair of textBgPairs) {
    const textColor = tokens[pair.text];
    const bgColor = tokens[pair.bg];

    if (textColor && bgColor) {
      const contrast = getContrastRatio(textColor, bgColor);

      if (contrast < 4.5) {
        issues.push({
          type: 'contrast',
          severity: contrast < 3 ? 'error' : 'warning',
          message: `${pair.text} on ${pair.bg}: ${contrast.toFixed(2)}:1`,
          tokens: [pair.text, pair.bg]
        });
        score -= contrast < 3 ? 20 : 10;
      }
    }
  }

  return { score: Math.max(0, score), issues };
}

// Console output formatting
function printHeader(text) {
  console.log(`\n${colors.bold}${colors.cyan}=== ${text} ===${colors.reset}\n`);
}

function printSuccess(text) {
  console.log(`${colors.green}✓ ${text}${colors.reset}`);
}

function printError(text) {
  console.log(`${colors.red}✗ ${text}${colors.reset}`);
}

function printWarning(text) {
  console.log(`${colors.yellow}⚠ ${text}${colors.reset}`);
}

function printInfo(text) {
  console.log(`${colors.blue}ℹ ${text}${colors.reset}`);
}

// Main execution
function main() {
  console.log(`${colors.bold}${colors.magenta}Design Token Validation${colors.reset}`);
  console.log('Validating design tokens for consistency, accessibility, and quality...\n');

  try {
    // Read tokens file
    const tokensPath = path.join(__dirname, '../tokens/tokens.json');
    const tokensData = JSON.parse(fs.readFileSync(tokensPath, 'utf8'));

    printInfo(`Loaded tokens from: ${tokensPath}`);

    // Extract tokens for validation
    const tokens = extractTokens(tokensData);
    const tokenCount = Object.keys(tokens).length;

    printInfo(`Found ${tokenCount} tokens to validate\n`);

    // Run validation
    printHeader('Token Validation');
    const validation = validateTokens(tokens);

    if (validation.errorCount === 0 && validation.warningCount === 0) {
      printSuccess('All tokens pass validation!');
    } else {
      validation.results.forEach(result => {
        const prefix = result.severity === 'error' ? '✗' : '⚠';
        const color = result.severity === 'error' ? colors.red : colors.yellow;

        console.log(`${color}${prefix} ${result.tokenName}: ${result.message}${colors.reset}`);
        if (result.suggestion) {
          console.log(`   ${colors.blue}→ ${result.suggestion}${colors.reset}`);
        }
      });

      console.log(`\nSummary: ${validation.errorCount} errors, ${validation.warningCount} warnings`);
    }

    // Run accessibility check
    printHeader('Accessibility Check');
    const accessibility = checkAccessibility(tokens);

    console.log(`Accessibility Score: ${accessibility.score}/100\n`);

    if (accessibility.issues.length === 0) {
      printSuccess('No accessibility issues found!');
    } else {
      accessibility.issues.forEach(issue => {
        const prefix = issue.severity === 'error' ? '✗' : '⚠';
        const color = issue.severity === 'error' ? colors.red : colors.yellow;

        console.log(`${color}${prefix} Contrast issue: ${issue.message}${colors.reset}`);
      });
    }

    // Overall summary
    printHeader('Summary');

    const hasErrors = validation.errorCount > 0 || accessibility.issues.some(i => i.severity === 'error');
    const hasWarnings = validation.warningCount > 0 || accessibility.issues.some(i => i.severity === 'warning');

    if (!hasErrors && !hasWarnings) {
      printSuccess('All checks passed! Your tokens are ready for production.');
      process.exit(0);
    } else if (!hasErrors) {
      printWarning('Validation completed with warnings. Consider addressing them.');
      process.exit(0);
    } else {
      printError('Validation failed with errors. Please fix them before proceeding.');
      process.exit(1);
    }

  } catch (error) {
    printError(`Validation failed: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  validateTokens,
  checkAccessibility,
  extractTokens,
  getContrastRatio
};