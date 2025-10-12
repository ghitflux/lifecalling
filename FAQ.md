# FAQ - Life Digital

## Perguntas Frequentes sobre o Sistema

### 🔍 Busca de Clientes e Casos

#### Como funciona a busca na Esteira de Atendimentos?

A busca na Esteira funciona de forma **inteligente** e busca por:
- **Nome do cliente** (ex: "Maria Silva")
- **CPF do cliente** (ex: "123.456.789-00" ou "12345678900")
- **Nome do banco/entidade** (ex: "Santander", "Bradesco")

**Você pode digitar qualquer um desses valores no campo de busca!**

#### Diferença entre abas Global e Meus Atendimentos

**Aba Global:**
- **Atendentes:** Veem apenas casos com status "novo" que estão disponíveis (não atribuídos ou com atribuição expirada)
- **Admin/Supervisor:** Veem todos os casos, com filtros de status disponíveis
- **Busca:** Funciona por nome, CPF ou banco
- **Filtros:** Status (apenas admin) e entidade/banco

**Aba Meus Atendimentos:**
- Mostra **apenas seus casos atribuídos**
- **Qualquer status:** novo, em andamento, calculado, etc.
- **Busca:** Funciona por nome, CPF ou banco
- **Filtros:** Status e entidade/banco disponíveis para todos

#### Posso buscar por banco?

**Sim!** Digite o nome do banco diretamente no campo de busca:
- "Santander"
- "Bradesco"
- "Caixa"
- "Banco do Brasil"

O sistema vai procurar em todos os casos que têm esse banco associado.

#### Como pegar um caso dentro dos detalhes?

Quando você está visualizando os detalhes de um caso:

1. **Botão "Pegar Caso"** aparece no canto superior direito (caso disponível)
2. Clique no botão
3. O caso será **atribuído automaticamente a você**
4. Você será mantido na página de detalhes para continuar trabalhando

#### Por que não consigo ver um caso específico na busca?

Verifique:

1. **Você está na aba correta?**
   - Se o caso já está atribuído a você → procure em "Meus Atendimentos"
   - Se o caso está disponível → procure em "Global"

2. **Status do caso:**
   - Na aba Global (atendente), você só vê casos "novos"
   - Para ver outros status, use a aba "Meus Atendimentos"

3. **Filtros ativos:**
   - Verifique se há filtros de status ou entidade aplicados
   - Limpe os filtros clicando no "X" ao lado de cada filtro

#### A busca é em tempo real?

**Sim!** A busca funciona enquanto você digita, sem precisar apertar Enter.

#### Quantos caracteres preciso digitar para buscar?

A busca começa a funcionar **desde o primeiro caractere digitado**.

### 📊 Filtros

#### Como funcionam os filtros de status?

- **Multi-seleção:** Você pode selecionar múltiplos status ao mesmo tempo
- **Badge ativo:** Status selecionados aparecem destacados em azul
- **Limpar:** Clique no botão "X Limpar" para remover todos os filtros

#### Posso combinar busca com filtros?

**Sim!** Você pode:
- Digitar um termo de busca (nome/CPF/banco)
- E selecionar filtros de status
- E filtrar por entidade

Todos os filtros trabalham juntos para refinar sua busca.

### 🔄 Atualização de Dados

#### Os dados são atualizados automaticamente?

**Sim!** A Esteira se atualiza automaticamente:
- A cada **10 segundos** em background
- Quando você muda de página
- Quando você aplica filtros
- Via **WebSocket** para mudanças em tempo real

#### O que significa a contagem na aba?

- **"Global (36370)"**: Total de casos disponíveis para você pegar
- **"Meus Atendimentos (3)"**: Total de casos atribuídos a você

### 🎯 Boas Práticas

#### Como encontrar casos mais rapidamente?

1. **Use a busca por CPF** quando souber o CPF exato do cliente
2. **Use a busca por nome** para encontrar clientes específicos
3. **Use filtros de status** para ver apenas casos em determinada etapa
4. **Use busca por banco** quando quiser trabalhar apenas com um banco específico

#### Como organizar meu trabalho?

1. Use a **aba "Meus Atendimentos"** para ver tudo que está sob sua responsabilidade
2. Filtre por **status** para priorizar (ex: ver apenas "calculado" para enviar para fechamento)
3. Use a **busca** para localizar casos específicos rapidamente

### 🐛 Solução de Problemas

#### A busca não retorna resultados

1. **Verifique os filtros ativos** - pode estar filtrando status que não tem casos
2. **Limpe a busca** e tente novamente
3. **Verifique a aba** - o caso pode estar em "Meus Atendimentos" se já foi atribuído

#### Mensagem "Nenhum atendimento encontrado"

Isso significa que:
- Não há casos que correspondam aos seus critérios de busca E filtros aplicados
- Tente **limpar os filtros** ou **mudar de aba**

#### O contador mostra casos mas não vejo nenhum

1. **Recarregue a página** (F5)
2. Verifique se há **filtros de paginação** - você pode estar em uma página vazia
3. Volte para a **página 1** da lista

---

## Precisa de mais ajuda?

Entre em contato com o suporte técnico ou consulte a documentação completa no [README.md](./README.md)
