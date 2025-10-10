"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@lifecalling/ui";
import { ChevronDown, HelpCircle, Workflow, Users, Calculator, FileText, Banknote, Settings, UserPlus, Shield, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth";

export default function FAQPage() {
  const [openQuestion, setOpenQuestion] = useState<number | null>(null);
  const { user } = useAuth();

  const toggleQuestion = (index: number) => {
    setOpenQuestion(openQuestion === index ? null : index);
  };

  // Função para verificar se uma seção deve ser exibida baseada na role do usuário
  const shouldShowSection = (roles: string[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const faqSections = [
    {
      category: "Geral",
      icon: HelpCircle,
      roles: ["admin", "supervisor", "financeiro", "calculista", "atendente", "fechamento"],
      questions: [
        {
          q: "O que é o Life Digital?",
          a: "Life Digital é um sistema completo de gestão de operações de crédito, permitindo controle desde o atendimento inicial até a efetivação de contratos."
        },
        {
          q: "Como funciona o sistema de permissões?",
          a: "O sistema possui 6 níveis de acesso: Admin, Supervisor, Atendente, Calculista, Fechamento e Financeiro. Cada perfil tem acesso a módulos específicos conforme sua função."
        },
        {
          q: "Posso acessar o sistema de qualquer dispositivo?",
          a: "Sim! O Life Digital é responsivo e funciona em desktops, tablets e smartphones."
        },
        {
          q: "Como funciona o sistema de notificações em tempo real?",
          a: "O sistema utiliza WebSockets para notificações em tempo real. Você receberá alertas quando novos casos chegarem na sua fila, quando simulações forem aprovadas/rejeitadas, e quando houver mudanças de status importantes."
        },
        {
          q: "Como funciona o sistema de filtros avançados?",
          a: "Cada módulo possui filtros específicos. No Calculista, você pode filtrar por status do caso (calculista_pendente), no Financeiro por status de liberação, e assim por diante. Use a busca por CPF ou nome para encontrar casos específicos."
        }
      ]
    },
    {
      category: "Atendimento",
      icon: Users,
      roles: ["admin", "supervisor", "atendente"],
      questions: [
        {
          q: "Como pegar um novo caso?",
          a: "Na tela de Atendimento (Esteira), clique em 'Pegar Caso', você será redirecionado para a página do caso."
        },
        {
          q: "Como enviar um caso para o calculista?",
          a: "Após preencher os dados do cliente, clique em 'Enviar para Calculista'. O caso mudará para status 'Calculista Pendente' e aparecerá na fila do calculista."
        },
        {
          q: "Por quanto tempo um caso fica atribuído a mim?",
          a: "Os casos ficam atribuídos por 72 horas. Após esse período, eles retornam automaticamente para a fila geral se não for enviado para o calculista dentro desse período."
        },
        {
          q: "Como funciona o sistema de lock de casos?",
          a: "Quando você pega um caso, ele fica 'travado' para outros usuários por 72 horas. Isso evita que múltiplos atendentes trabalhem no mesmo caso simultaneamente."
        },
        {
          q: "Posso ver o histórico de um cliente?",
          a: "Sim! Ao buscar por CPF, o sistema mostra todos os casos anteriores do cliente, permitindo consultar simulações passadas e histórico de operações."
        }
      ]
    },
    {
      category: "Calculista",
      icon: Calculator,
      roles: ["admin", "supervisor", "calculista"],
      questions: [
        {
          q: "Como faço uma simulação?",
          a: "Acesse o caso na sua fila, preencha os dados de até 6 bancos (parcela, saldo devedor, valor liberado), defina prazo, coeficiente, seguro e percentual de consultoria. Clique em 'Calcular' para ver os resultados."
        },
        {
          q: "Posso adicionar observações na simulação?",
          a: "Sim! Há um campo de observações onde você pode registrar informações importantes sobre a simulação para consulta futura."
        },
        {
          q: "Como aprovar ou rejeitar uma simulação?",
          a: "Após calcular, você verá botões 'Aprovar' e 'Rejeitar'. Ao aprovar, o caso volta para o atendente. Ao rejeitar, você pode adicionar o motivo."
        },
        {
          q: "Como buscar simulações antigas?",
          a: "Use a aba 'Todas Simulações' e busque por nome ou CPF do cliente. Lá você encontra todo o histórico de simulações."
        },
        {
          q: "Como funciona o filtro por status do caso?",
          a: "A aba 'Pendentes' mostra apenas casos com status 'calculista_pendente'. Casos com outros status (como 'encerrado') não aparecem nesta aba, garantindo que você veja apenas casos que precisam de análise."
        },
        {
          q: "Posso ver o histórico de simulações de um caso?",
          a: "Sim! Ao acessar um caso, você pode ver todas as simulações anteriores, incluindo aprovadas, rejeitadas e em rascunho, com seus respectivos totais e observações."
        }
      ]
    },
    {
      category: "Fechamento",
      icon: FileText,
      roles: ["admin", "supervisor", "fechamento"],
      questions: [
        {
          q: "O que faz o módulo de Fechamento?",
          a: "O Fechamento valida e aprova as simulações antes de enviar para efetivação financeira. É uma camada de controle de qualidade."
        },
        {
          q: "Por que alguns casos não aparecem na minha fila?",
          a: "Apenas casos que foram enviados pelo atendente aparecem aqui. Casos em 'Cálculo Aprovado' ainda estão com o atendente aguardando envio manual."
        },
        {
          q: "Posso retornar um caso para o calculista?",
          a: "Sim! Se encontrar algum problema na simulação, você pode rejeitar e o caso retornará para revisão do calculista."
        },
        {
          q: "Como funciona o controle de qualidade?",
          a: "O módulo de Fechamento é responsável por validar todos os dados antes da efetivação. Verifique valores, prazos, coeficientes e documentação antes de aprovar."
        }
      ]
    },
    {
      category: "Financeiro",
      icon: Banknote,
      roles: ["admin", "supervisor", "financeiro"],
      questions: [
        {
          q: "Como efetivar uma liberação?",
          a: "Na fila de liberações aprovadas, clique em 'Efetivar Liberação', anexe os comprovantes necessários e confirme. O contrato será criado e a receita contabilizada."
        },
        {
          q: "Como registrar despesas?",
          a: "No módulo Financeiro, vá em 'Gestão de Despesas', clique em 'Nova Despesa', preencha os dados, anexe o comprovante e salve."
        },
        {
          q: "Como funciona o cálculo de lucro?",
          a: "O sistema calcula automaticamente: Receita Total (consultorias efetivadas) - Despesas Totais = Lucro Líquido."
        },
        {
          q: "Como acompanhar as métricas financeiras?",
          a: "Use o Dashboard para acompanhar KPIs como receita mensal, meta mensal, consultoria líquida e progresso. Os dados são atualizados em tempo real."
        }
      ]
    },
    {
      category: "Administração",
      icon: Settings,
      roles: ["admin"],
      questions: [
        {
          q: "Como criar um novo usuário?",
          a: "Acesse o módulo 'Usuários', clique em 'Novo Usuário', preencha os dados (nome, email, role) e defina a senha inicial. O usuário receberá as credenciais por email."
        },
        {
          q: "Como gerenciar permissões de usuários?",
          a: "Cada usuário tem uma role específica (admin, supervisor, atendente, calculista, fechamento, financeiro) que define quais módulos ele pode acessar. Apenas admins podem alterar roles."
        },
        {
          q: "Como monitorar o desempenho da equipe?",
          a: "Use o módulo 'Rankings' para acompanhar métricas individuais e de equipe, incluindo casos processados, simulações aprovadas e volume financeiro."
        },
        {
          q: "Como funciona o sistema de auditoria?",
          a: "Todas as ações importantes são registradas no sistema, incluindo criação de casos, aprovações, rejeições e mudanças de status. Acesse os logs para rastreabilidade."
        }
      ]
    },
    {
      category: "Novidades e Atualizações",
      icon: TrendingUp,
      roles: ["admin", "supervisor", "financeiro", "calculista", "atendente", "fechamento"],
      questions: [
        {
          q: "Quais foram as últimas melhorias no sistema?",
          a: "• Filtros aprimorados por status de caso no Calculista\n• Notificações em tempo real via WebSockets\n• Dashboard com KPIs em tempo real\n• Sistema de rankings melhorado\n• Melhorias na UX/UI de todos os módulos"
        },
        {
          q: "Como funciona o novo sistema de notificações?",
          a: "O sistema agora envia notificações em tempo real quando há mudanças importantes, como novos casos na fila, aprovações/rejeições de simulações, e mudanças de status."
        },
        {
          q: "Quais melhorias foram feitas no Calculista?",
          a: "• Filtro correto por status de caso (apenas casos 'calculista_pendente' aparecem na aba Pendentes)\n• Histórico completo de simulações\n• Interface mais intuitiva\n• Melhor organização das abas"
        },
        {
          q: "Como usar os novos filtros avançados?",
          a: "Cada módulo agora possui filtros específicos e mais precisos. No Calculista, por exemplo, a aba 'Pendentes' mostra apenas casos que realmente precisam de análise, evitando confusão com casos já processados."
        }
      ]
    }
  ];

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <HelpCircle className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-4xl font-bold mb-2">FAQ & Boas Práticas</h1>
            <p className="text-muted-foreground">
              Perguntas frequentes e guia de uso do Life Digital
            </p>
          </div>
        </div>
        
        {/* Alertas importantes */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-800 mb-1">Últimas Atualizações</h3>
              <p className="text-sm text-blue-700">
                O sistema foi atualizado com melhorias significativas! Verifique a seção &quot;Novidades e Atualizações&quot;
                para conhecer as novas funcionalidades, incluindo filtros aprimorados no Calculista e notificações em tempo real.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Fluxo MVP */}
      <Card className="mb-8 border-primary/20 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Workflow className="h-6 w-6 text-primary" />
            Fluxo de Trabalho do Sistema
          </CardTitle>
          <CardDescription>
            Entenda como funciona o processo completo de uma operação
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                1
              </div>
              <div>
                <h3 className="font-semibold mb-1">Atendimento - Cadastro do Cliente</h3>
                <p className="text-sm text-muted-foreground">
                  O atendente cria um novo caso, cadastra os dados do cliente (nome, CPF, matrícula, órgão) e envia para o calculista.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                2
              </div>
              <div>
                <h3 className="font-semibold mb-1">Calculista - Simulação</h3>
                <p className="text-sm text-muted-foreground">
                  O calculista recebe o caso, faz a simulação inserindo dados de até 6 bancos, calcula os valores e pode aprovar ou rejeitar.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                3
              </div>
              <div>
                <h3 className="font-semibold mb-1">Atendimento - Aprovação do Cliente</h3>
                <p className="text-sm text-muted-foreground">
                  O caso retorna para o atendente que apresenta a simulação ao cliente. Se aprovado, envia para o Fechamento.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                4
              </div>
              <div>
                <h3 className="font-semibold mb-1">Fechamento - Validação</h3>
                <p className="text-sm text-muted-foreground">
                  A equipe de fechamento valida todos os dados da operação e aprova para efetivação.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                5
              </div>
              <div>
                <h3 className="font-semibold mb-1">Financeiro - Efetivação</h3>
                <p className="text-sm text-muted-foreground">
                  O financeiro efetiva a liberação, anexa comprovantes e o contrato é criado. A receita é contabilizada automaticamente.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Perguntas Frequentes */}
      <div className="space-y-6">
        {faqSections
          .filter(section => shouldShowSection(section.roles))
          .map((section, sectionIdx) => (
          <Card key={sectionIdx} className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <section.icon className="h-5 w-5 text-primary" />
                {section.category}
                {section.roles.length === 1 && section.roles[0] === "admin" && (
                  <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                    Admin Only
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {section.questions.map((item, idx) => {
                const globalIdx = sectionIdx * 100 + idx;
                const isOpen = openQuestion === globalIdx;

                return (
                  <div key={idx} className="border rounded-lg overflow-hidden hover:border-primary/20 transition-colors">
                    <button
                      onClick={() => toggleQuestion(globalIdx)}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
                    >
                      <span className="font-medium text-left">{item.q}</span>
                      <ChevronDown
                        className={`h-5 w-5 transition-transform ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-4 py-3 bg-muted/30 border-t">
                        <div className="text-sm text-muted-foreground whitespace-pre-line">{item.a}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Boas Práticas */}
      <Card className="mt-8 border-success/20 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-success" />
            Boas Práticas por Perfil
          </CardTitle>
          <CardDescription>
            Dicas para usar o sistema da melhor forma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {shouldShowSection(["admin", "supervisor", "atendente"]) && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  👤 Atendente
                </h3>
                <ul className="list-disc list-inside text-sm text-blue-700 space-y-1 ml-4">
                  <li>Sempre preencha TODOS os campos obrigatórios do cliente</li>
                  <li>Verifique se o CPF e matrícula estão corretos antes de enviar</li>
                  <li>Acompanhe seus casos atribuídos para não perder o prazo de 72h</li>
                  <li>Ao receber a simulação aprovada, valide com o cliente antes de enviar para fechamento</li>
                  <li>Use a busca por CPF para verificar histórico do cliente</li>
                </ul>
              </div>
            )}

            {shouldShowSection(["admin", "supervisor", "calculista"]) && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  🧮 Calculista
                </h3>
                <ul className="list-disc list-inside text-sm text-green-700 space-y-1 ml-4">
                  <li>Sempre adicione observações relevantes nas simulações</li>
                  <li>Confira os valores de parcela, saldo e liberado de cada banco</li>
                  <li>Use a aba &quot;Todas Simulações&quot; para consultar históricos e padrões</li>
                  <li>Ao rejeitar, seja claro no motivo para o atendente entender</li>
                  <li>Verifique se o caso está realmente pendente antes de processar</li>
                </ul>
              </div>
            )}

            {shouldShowSection(["admin", "supervisor", "fechamento"]) && (
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h3 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  📋 Fechamento
                </h3>
                <ul className="list-disc list-inside text-sm text-purple-700 space-y-1 ml-4">
                  <li>Valide todos os dados antes de aprovar</li>
                  <li>Se encontrar inconsistências, retorne para o calculista com observações</li>
                  <li>Lembre-se: casos em &quot;Cálculo Aprovado&quot; ainda não foram enviados pelo atendente</li>
                  <li>Verifique se todos os documentos estão em ordem</li>
                </ul>
              </div>
            )}

            {shouldShowSection(["admin", "supervisor", "financeiro"]) && (
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <h3 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                  <Banknote className="h-4 w-4" />
                  💰 Financeiro
                </h3>
                <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1 ml-4">
                  <li>Sempre anexe comprovantes de liberação ao efetivar</li>
                  <li>Registre todas as despesas com comprovantes</li>
                  <li>Acompanhe os KPIs mensais para controle de receitas e metas</li>
                  <li>Revise o relatório de lucro líquido periodicamente</li>
                  <li>Mantenha os anexos organizados por data e tipo</li>
                </ul>
              </div>
            )}

            {shouldShowSection(["admin", "supervisor"]) && (
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <h3 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  👨‍💼 Admin/Supervisor
                </h3>
                <ul className="list-disc list-inside text-sm text-red-700 space-y-1 ml-4">
                  <li>Use o Dashboard para acompanhar métricas gerais</li>
                  <li>Monitore o Rankings para acompanhar desempenho da equipe</li>
                  <li>Revise permissões de usuários periodicamente</li>
                  <li>Acompanhe casos parados há muito tempo na esteira</li>
                </ul>
              </div>
            )}

            {shouldShowSection(["admin"]) && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  🔧 Administração
                </h3>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 ml-4">
                  <li>Crie usuários com roles apropriadas para cada função</li>
                  <li>Monitore logs de auditoria para rastreabilidade</li>
                  <li>Mantenha o sistema atualizado com as últimas melhorias</li>
                  <li>Configure notificações adequadas para cada perfil</li>
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
