"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@lifecalling/ui";
import { ChevronDown, HelpCircle, Workflow, Users, Calculator, FileText, Banknote } from "lucide-react";
import { useState } from "react";

export default function FAQPage() {
  const [openQuestion, setOpenQuestion] = useState<number | null>(null);

  const toggleQuestion = (index: number) => {
    setOpenQuestion(openQuestion === index ? null : index);
  };

  const faqSections = [
    {
      category: "Geral",
      icon: HelpCircle,
      questions: [
        {
          q: "O que é o Life Digital?",
          a: "Life Digital é um sistema completo de gestão de operações de crédito consignado, permitindo controle desde o atendimento inicial até a efetivação de contratos."
        },
        {
          q: "Como funciona o sistema de permissões?",
          a: "O sistema possui 6 níveis de acesso: Admin, Supervisor, Atendente, Calculista, Fechamento e Financeiro. Cada perfil tem acesso a módulos específicos conforme sua função."
        },
        {
          q: "Posso acessar o sistema de qualquer dispositivo?",
          a: "Sim! O Life Digital é responsivo e funciona em desktops, tablets e smartphones."
        }
      ]
    },
    {
      category: "Atendimento",
      icon: Users,
      questions: [
        {
          q: "Como criar um novo caso?",
          a: "Na tela de Atendimento (Esteira), clique em 'Novo Caso', preencha os dados do cliente e salve. O caso será automaticamente atribuído a você."
        },
        {
          q: "Como enviar um caso para o calculista?",
          a: "Após preencher os dados do cliente, clique em 'Enviar para Calculista'. O caso mudará para status 'Calculista Pendente' e aparecerá na fila do calculista."
        },
        {
          q: "Por quanto tempo um caso fica atribuído a mim?",
          a: "Os casos ficam atribuídos por 72 horas. Após esse período, eles retornam automaticamente para a fila geral."
        }
      ]
    },
    {
      category: "Calculista",
      icon: Calculator,
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
        }
      ]
    },
    {
      category: "Fechamento",
      icon: FileText,
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
        }
      ]
    },
    {
      category: "Financeiro",
      icon: Banknote,
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
        }
      ]
    }
  ];

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">FAQ & Boas Práticas</h1>
        <p className="text-muted-foreground">
          Perguntas frequentes e guia de uso do Life Digital
        </p>
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
        {faqSections.map((section, sectionIdx) => (
          <Card key={sectionIdx}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <section.icon className="h-5 w-5 text-primary" />
                {section.category}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {section.questions.map((item, idx) => {
                const globalIdx = sectionIdx * 100 + idx;
                const isOpen = openQuestion === globalIdx;

                return (
                  <div key={idx} className="border rounded-lg overflow-hidden">
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
                        <p className="text-sm text-muted-foreground">{item.a}</p>
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
      <Card className="mt-8 border-success/20">
        <CardHeader>
          <CardTitle>Boas Práticas por Perfil</CardTitle>
          <CardDescription>
            Dicas para usar o sistema da melhor forma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-success mb-2">👤 Atendente</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                <li>Sempre preencha TODOS os campos obrigatórios do cliente</li>
                <li>Verifique se o CPF e matrícula estão corretos antes de enviar</li>
                <li>Acompanhe seus casos atribuídos para não perder o prazo de 72h</li>
                <li>Ao receber a simulação aprovada, valide com o cliente antes de enviar para fechamento</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-success mb-2">🧮 Calculista</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                <li>Sempre adicione observações relevantes nas simulações</li>
                <li>Confira os valores de parcela, saldo e liberado de cada banco</li>
                <li>Use a aba "Todas Simulações" para consultar históricos e padrões</li>
                <li>Ao rejeitar, seja claro no motivo para o atendente entender</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-success mb-2">📋 Fechamento</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                <li>Valide todos os dados antes de aprovar</li>
                <li>Se encontrar inconsistências, retorne para o calculista com observações</li>
                <li>Lembre-se: casos em "Cálculo Aprovado" ainda não foram enviados pelo atendente</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-success mb-2">💰 Financeiro</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                <li>Sempre anexe comprovantes de liberação ao efetivar</li>
                <li>Registre todas as despesas com comprovantes</li>
                <li>Acompanhe os KPIs mensais para controle de receitas e metas</li>
                <li>Revise o relatório de lucro líquido periodicamente</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-success mb-2">👨‍💼 Admin/Supervisor</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                <li>Use o Dashboard para acompanhar métricas gerais</li>
                <li>Monitore o Rankings para acompanhar desempenho da equipe</li>
                <li>Revise permissões de usuários periodicamente</li>
                <li>Acompanhe casos parados há muito tempo na esteira</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
