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

  // Executar next build a partir do diretório do apps/web
  const webDir = path.join(__dirname, 'apps/web');
  const command = `cd "${webDir}" && next build`;

  console.log(`Executando: ${command}`);
  execSync(command, { stdio: 'inherit' });

  process.exit(0);
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}
