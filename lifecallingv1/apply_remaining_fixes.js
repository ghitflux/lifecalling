#!/usr/bin/env node
/**
 * Script para aplicar as correções finais pendentes
 * Usar: node apply_remaining_fixes.js
 */

const fs = require('fs');
const path = require('path');

console.log('Aplicando correções finais...\n');

// Correção 1: Adicionar DollarSign ao import e botão Ver Financiamentos
function addFinanciamentosButton() {
  const filePath = path.join(__dirname, 'lifecalling/apps/web/src/app/calculista/[caseId]/page.tsx');

  try {
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Adicionar DollarSign ao import
    const oldImport = `import { ArrowLeft, Calculator, CheckCircle, XCircle, History, Download, FileText, Paperclip, Printer, RefreshCw } from "lucide-react";`;
    const newImport = `import { ArrowLeft, Calculator, CheckCircle, XCircle, History, Download, FileText, Paperclip, Printer, RefreshCw, DollarSign } from "lucide-react";`;

    if (content.includes(oldImport)) {
      content = content.replace(oldImport, newImport);
      console.log('✓ Adicionado DollarSign ao import');
    } else {
      console.log('⚠ Import já contém DollarSign ou formato diferente');
    }

    // 2. Adicionar botão após a lista de anexos
    const attachmentsEndMarker = `              ))}
            </div>
          </Card>
        )}`;

    const buttonCode = `              ))}
            </div>

            {/* Botão Ver Financiamentos */}
            <div className="mt-4 pt-4 border-t">
              <Button
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
                onClick={() => router.push(\`/financeiro/\${caseId}\`)}
              >
                <DollarSign className="h-4 w-4" />
                Ver Financiamentos
              </Button>
            </div>
          </Card>
        )}`;

    if (content.includes(attachmentsEndMarker) && !content.includes('Ver Financiamentos')) {
      content = content.replace(attachmentsEndMarker, buttonCode);
      console.log('✓ Adicionado botão Ver Financiamentos');
    } else if (content.includes('Ver Financiamentos')) {
      console.log('⚠ Botão Ver Financiamentos já existe');
    } else {
      console.log('⚠ Não foi possível localizar o marcador para inserir o botão');
    }

    // Salvar arquivo
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Arquivo atualizado: ${filePath}\n`);

  } catch (error) {
    console.error(`✗ Erro ao processar arquivo: ${error.message}\n`);
  }
}

// Correção 2: Ajustar cores e contraste
function fixColorsContrast() {
  console.log('Correção de cores e contraste:');

  // AdminStatusChanger.tsx - bg-orange-50 com texto claro
  const statusChangerPath = path.join(__dirname, 'lifecalling/apps/web/src/components/case/AdminStatusChanger.tsx');

  try {
    let content = fs.readFileSync(statusChangerPath, 'utf8');

    // Melhorar contraste do header do AdminStatusChanger
    const oldHeader = `<div className="flex items-center gap-3 p-4 border rounded-lg bg-orange-50 border-orange-200">`;
    const newHeader = `<div className="flex items-center gap-3 p-4 border rounded-lg bg-orange-100 border-orange-300">`;

    if (content.includes(oldHeader)) {
      content = content.replace(oldHeader, newHeader);
      console.log('✓ Melhorado contraste do AdminStatusChanger (bg-orange-50 → bg-orange-100)');
    }

    fs.writeFileSync(statusChangerPath, content, 'utf8');

  } catch (error) {
    console.error(`✗ Erro ao ajustar cores: ${error.message}`);
  }

  console.log('\n⚠ NOTA: Outros ajustes de contraste podem ser necessários.');
  console.log('  Recomenda-se fazer auditoria manual com ferramenta de contraste.');
  console.log('  URL recomendada: https://webaim.org/resources/contrastchecker/\n');
}

// Executar correções
try {
  addFinanciamentosButton();
  fixColorsContrast();

  console.log('\n✅ Todas as correções foram aplicadas!');
  console.log('\nPróximos passos:');
  console.log('1. Verificar as alterações com: git diff');
  console.log('2. Testar a aplicação');
  console.log('3. Fazer rebuild: cd lifecalling/apps/web && pnpm build');

} catch (error) {
  console.error(`\n✗ Erro fatal: ${error.message}`);
  process.exit(1);
}
