#!/usr/bin/env node
/**
 * Build script para Next.js 16
 * PRODUÇÃO: webpack (padrão) - estável
 * DESENVOLVIMENTO: next dev --turbopack
 */
const { execSync } = require("child_process");
const path = require("path");

try {
  process.env.NODE_ENV = "production";
  
  const webDir = path.join(__dirname, "apps/web");
  const nextBinary = path.join(__dirname, "apps/web/node_modules/.bin/next");
  const command = `cd "${webDir}" && "${nextBinary}" build`;

  console.log("📦 Building Next.js 16 with Webpack (production)...");
  execSync(command, { stdio: "inherit", shell: "/bin/sh", env: process.env });

  console.log("✅ Build concluído com sucesso!");
  process.exit(0);
} catch (error) {
  console.error("❌ Build falhou:", error.message);
  process.exit(1);
}
