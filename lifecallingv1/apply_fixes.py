#!/usr/bin/env python3
"""
Script para aplicar correções nos arquivos do projeto LifeCalling
"""
import re
import os

def fix_case_chat():
    """Corrige o sistema de comentários - CaseChat.tsx"""
    file_path = "lifecalling/apps/web/src/components/case/CaseChat.tsx"

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Substituir a invalidação de queries
    old_pattern = r"queryClient\.invalidateQueries\(\{ queryKey: \['comments', caseId\] \}\);"
    new_code = "queryClient.invalidateQueries({ queryKey: ['comments'] }); // Invalida todos os comentários globalmente"

    content = re.sub(old_pattern, new_code, content)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"✓ Corrigido: {file_path}")

def fix_calculista_page():
    """Corrige erro da lista de simulações - calculista/page.tsx"""
    file_path = "lifecalling/apps/web/src/app/calculista/page.tsx"

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Encontrar e substituir o filtro
    old_code = """const dataToFilter = activeTab === "todas_simulacoes" ? allSimulationsQuery : allSimulations;
    if (!searchTerm) return dataToFilter;

    const term = searchTerm.toLowerCase();
    return dataToFilter.filter((sim: any) => {"""

    new_code = """const dataToFilter = activeTab === "todas_simulacoes" ? allSimulationsQuery : allSimulations;

    // Garantir que dataToFilter é um array
    if (!Array.isArray(dataToFilter)) return [];
    if (!searchTerm) return dataToFilter;

    const term = searchTerm.toLowerCase();
    return dataToFilter.filter((sim: any) => {"""

    content = content.replace(old_code, new_code)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"✓ Corrigido: {file_path}")

def fix_admin_status_changer():
    """Corrige Status Changer - AdminStatusChanger.tsx"""
    file_path = "lifecalling/apps/web/src/components/case/AdminStatusChanger.tsx"

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Encontrar onSuccess e adicionar mais invalidações
    old_code = """queryClient.invalidateQueries({ queryKey: ['case', caseId] });
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      queryClient.invalidateQueries({ queryKey: ['/cases'] });"""

    new_code = """queryClient.invalidateQueries({ queryKey: ['case', caseId] });
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      queryClient.invalidateQueries({ queryKey: ['/cases'] });
      queryClient.invalidateQueries({ queryKey: ['calculista'] });
      queryClient.invalidateQueries({ queryKey: ['closing'] });
      queryClient.invalidateQueries({ queryKey: ['finance'] });
      queryClient.invalidateQueries({ queryKey: ['simulations'] });"""

    content = content.replace(old_code, new_code)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"✓ Corrigido: {file_path}")

if __name__ == "__main__":
    print("Aplicando correções...")
    print()

    try:
        fix_case_chat()
        fix_calculista_page()
        fix_admin_status_changer()
        print()
        print("✓ Todas as correções foram aplicadas com sucesso!")
    except Exception as e:
        print(f"✗ Erro ao aplicar correções: {e}")
