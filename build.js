#!/usr/bin/env node
/**
 * Build script wrapper para Next.js 16 com Turbopack
 * Executa o build a partir do diretório correto
 */
const { execSync } = require('child_process');
const path = require('path');
const os = require('os');

try {
  // Certificar que NODE_ENV está definido como production
  process.env.NODE_ENV = 'production';
  process.env.TURBOPACK_ROOT = '/app';

  // Executar next build a partir do diretório do apps/web usando o executable correto
  const webDir = path.join(__dirname, 'apps/web');
  const nextBinary = path.join(__dirname, 'apps/web/node_modules/.bin/next');
  const command = `cd "${webDir}" && TURBOPACK_ROOT=/app "${nextBinary}" build`;

  console.log(`Executando: ${command}`);
  execSync(command, { stdio: 'inherit', shell: '/bin/sh', env: process.env });

  process.exit(0);
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}
