"""
ARQUIVO DE CONFIGURAÇÃO DE MOCKS PARA RANKINGS
===============================================
Este arquivo controla se os dados mockados devem ser usados.

Para DESATIVAR os mocks e usar dados reais:
1. Mude USE_MOCK_DATA para False
   OU
2. Delete este arquivo e o rankings_mock_data.py
"""

# Flag para controlar uso de dados mockados
USE_MOCK_DATA = True  # ATIVADO - Dados mockados para demonstração

# Mensagem de aviso (aparece nos logs)
MOCK_WARNING = """
⚠️  ATENÇÃO: Rankings está usando DADOS MOCKADOS!
Para usar dados reais:
1. Abra: apps/api/app/routers/rankings_mock_config.py
2. Mude: USE_MOCK_DATA = False
   OU delete os arquivos *_mock_*.py
"""
