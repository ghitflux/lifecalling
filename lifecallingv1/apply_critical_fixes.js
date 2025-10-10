#!/usr/bin/env node
/**
 * Script para aplicar correções críticas identificadas pelo usuário
 * Executar: node apply_critical_fixes.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Aplicando correções críticas...\n');

let fixesApplied = 0;
let errors = [];

// ===== CORREÇÃO 1: CaseChat - Remover filtro por canal e scroll automático =====
function fixCaseChat() {
  const filePath = path.join(__dirname, 'lifecalling/apps/web/src/components/case/CaseChat.tsx');

  try {
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Remover filtro de canal na query
    const oldQuery = `queryKey: ['comments', caseId, defaultChannel],
    queryFn: () => getComments(caseId, defaultChannel),`;

    const newQuery = `queryKey: ['comments', caseId],
    queryFn: () => getComments(caseId), // Sem filtro - mostra TODOS os comentários do caso`;

    if (content.includes(oldQuery)) {
      content = content.replace(oldQuery, newQuery);
      console.log('✓ CaseChat: Removido filtro de canal');
      fixesApplied++;
    }

    // 2. Remover scroll automático
    const oldScroll = `  // Scroll automático ao final quando novos comentários chegam
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);`;

    const newScroll = `  // Scroll automático DESABILITADO - mantém posição atual do usuário`;

    if (content.includes(oldScroll)) {
      content = content.replace(oldScroll, newScroll);
      console.log('✓ CaseChat: Removido scroll automático');
      fixesApplied++;
    }

    // 3. Remover ref que não é mais necessário
    content = content.replace('<div ref={chatEndRef} />', '');

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Arquivo atualizado: ${filePath}\n`);

  } catch (error) {
    errors.push(`CaseChat: ${error.message}`);
    console.error(`✗ Erro em CaseChat: ${error.message}\n`);
  }
}

// ===== CORREÇÃO 2: Consultoria Líquida - Fallback correto =====
function fixConsultoriaLiquida() {
  const filePath = path.join(__dirname, 'lifecalling/apps/web/src/app/casos/[id]/page.tsx');

  try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Corrigir fallback incorreto
    const oldFallback = `caseDetail.simulation.totals.custoConsultoriaLiquido ??
                          caseDetail.simulation.totals.custoConsultoria`;

    const newFallback = `caseDetail.simulation.totals.custoConsultoriaLiquido ??
                          (caseDetail.simulation.totals.custoConsultoria * 0.86)`;

    if (content.includes(oldFallback)) {
      content = content.replace(oldFallback, newFallback);
      console.log('✓ Consultoria Líquida: Corrigido fallback (custo * 0.86)');
      fixesApplied++;
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Arquivo atualizado: ${filePath}\n`);

  } catch (error) {
    errors.push(`Consultoria Líquida: ${error.message}`);
    console.error(`✗ Erro em Consultoria Líquida: ${error.message}\n`);
  }
}

// ===== CORREÇÃO 3: Remover botão Ver Financiamentos =====
function removeFinanciamentosButton() {
  const filePath = path.join(__dirname, 'lifecalling/apps/web/src/app/calculista/[caseId]/page.tsx');

  try {
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Remover DollarSign do import
    const oldImport = `import { ArrowLeft, Calculator, CheckCircle, XCircle, History, Download, FileText, Paperclip, Printer, RefreshCw, DollarSign } from "lucide-react";`;
    const newImport = `import { ArrowLeft, Calculator, CheckCircle, XCircle, History, Download, FileText, Paperclip, Printer, RefreshCw } from "lucide-react";`;

    if (content.includes(oldImport)) {
      content = content.replace(oldImport, newImport);
      console.log('✓ Removido DollarSign do import');
      fixesApplied++;
    }

    // 2. Remover botão Ver Financiamentos
    const buttonBlock = `
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
            </div>`;

    if (content.includes(buttonBlock)) {
      content = content.replace(buttonBlock, '');
      console.log('✓ Removido botão Ver Financiamentos');
      fixesApplied++;
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Arquivo atualizado: ${filePath}\n`);

  } catch (error) {
    errors.push(`Botão Financiamentos: ${error.message}`);
    console.error(`✗ Erro ao remover botão: ${error.message}\n`);
  }
}

// ===== CORREÇÃO 4: Cores e Contraste - AdminStatusChanger =====
function fixAdminStatusChangerColors() {
  const filePath = path.join(__dirname, 'lifecalling/apps/web/src/components/case/AdminStatusChanger.tsx');

  try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Verificar se bg-orange-100 já está presente (foi parcialmente corrigido)
    // Corrigir o modal que ainda tem bg-orange-50
    const oldModalBg = `<div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">`;
    const newModalBg = `<div className="flex items-center justify-between p-3 bg-orange-100 rounded-lg border border-orange-300">`;

    if (content.includes(oldModalBg)) {
      content = content.replace(oldModalBg, newModalBg);
      console.log('✓ AdminStatusChanger: Melhorado contraste do modal (bg-orange-50 → bg-orange-100)');
      fixesApplied++;
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Arquivo atualizado: ${filePath}\n`);

  } catch (error) {
    errors.push(`AdminStatusChanger: ${error.message}`);
    console.error(`✗ Erro em AdminStatusChanger: ${error.message}\n`);
  }
}

// Executar todas as correções
try {
  console.log('Iniciando correções...\n');

  fixCaseChat();
  fixConsultoriaLiquida();
  removeFinanciamentosButton();
  fixAdminStatusChangerColors();

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Correções aplicadas: ${fixesApplied}`);
  if (errors.length > 0) {
    console.log(`⚠️  Erros encontrados: ${errors.length}`);
    errors.forEach(err => console.log(`   - ${err}`));
  }
  console.log('='.repeat(60));

  console.log('\n📝 Próximos passos:');
  console.log('1. Verificar alterações: git diff');
  console.log('2. Testar a aplicação');
  console.log('3. Rebuild: cd lifecalling/apps/web && pnpm build');
  console.log('4. Verificar migrações pendentes no backend\n');

} catch (error) {
  console.error(`\n✗ Erro fatal: ${error.message}`);
  process.exit(1);
}
