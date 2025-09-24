import { PrismaClient, Role, AtendimentoStatus, ContratoStatus, TipoComentario, StatusKPI } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Criar usuários
  console.log('👥 Creating users...')

  const users = await Promise.all([
    prisma.user.create({
      data: {
        name: 'João Atendente',
        email: 'atendente@licall.dev',
        passwordHash: await hash('dev123', 12),
        role: 'atendente' as Role,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Maria Calculista',
        email: 'calculista@licall.dev',
        passwordHash: await hash('dev123', 12),
        role: 'calculista' as Role,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Pedro Gerente',
        email: 'gerente@licall.dev',
        passwordHash: await hash('dev123', 12),
        role: 'gerente_fechamento' as Role,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Ana Financeiro',
        email: 'financeiro@licall.dev',
        passwordHash: await hash('dev123', 12),
        role: 'financeiro' as Role,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Admin Sistema',
        email: 'admin@licall.dev',
        passwordHash: await hash('dev123', 12),
        role: 'superadmin' as Role,
      },
    }),
  ])

  const [atendente, calculista, gerente, financeiro, admin] = users
  console.log(`✅ Created ${users.length} users`)

  // Criar bancos
  console.log('🏦 Creating bancos...')

  const bancos = await Promise.all([
    prisma.banco.create({
      data: {
        codigo: '001',
        nome: 'Banco do Brasil',
        descricao: 'Banco do Brasil S.A.',
        ativo: true,
      },
    }),
    prisma.banco.create({
      data: {
        codigo: '341',
        nome: 'Itaú Unibanco',
        descricao: 'Itaú Unibanco S.A.',
        ativo: true,
      },
    }),
    prisma.banco.create({
      data: {
        codigo: '237',
        nome: 'Bradesco',
        descricao: 'Banco Bradesco S.A.',
        ativo: true,
      },
    }),
    prisma.banco.create({
      data: {
        codigo: '104',
        nome: 'Caixa Econômica Federal',
        descricao: 'Caixa Econômica Federal',
        ativo: true,
      },
    }),
    prisma.banco.create({
      data: {
        codigo: '033',
        nome: 'Santander',
        descricao: 'Banco Santander Brasil S.A.',
        ativo: true,
      },
    }),
    prisma.banco.create({
      data: {
        codigo: '260',
        nome: 'Nu Pagamentos',
        descricao: 'Nu Pagamentos S.A.',
        ativo: true,
      },
    }),
  ])

  console.log(`✅ Created ${bancos.length} bancos`)

  // Criar clientes
  console.log('👨‍👩‍👧‍👦 Creating clientes...')

  const clientes = await Promise.all([
    prisma.cliente.create({
      data: {
        nome: 'Maria Silva Santos',
        cpf: '123.456.789-01',
        email: 'maria.silva@email.com',
        telefone: '(11) 98765-4321',
        endereco: 'Rua das Flores, 123, Apt 45',
        cidade: 'São Paulo',
        estado: 'SP',
        cep: '01234-567',
        renda: 5500.00,
        profissao: 'Enfermeira',
      },
    }),
    prisma.cliente.create({
      data: {
        nome: 'José Santos Oliveira',
        cpf: '987.654.321-09',
        email: 'jose.oliveira@email.com',
        telefone: '(11) 91234-5678',
        endereco: 'Av. Paulista, 1000, Conj 801',
        cidade: 'São Paulo',
        estado: 'SP',
        cep: '01310-100',
        renda: 8200.00,
        profissao: 'Analista de Sistemas',
      },
    }),
    prisma.cliente.create({
      data: {
        nome: 'Ana Paula Costa',
        cpf: '456.789.123-45',
        email: 'ana.costa@email.com',
        telefone: '(11) 99876-5432',
        endereco: 'Rua Augusta, 500',
        cidade: 'São Paulo',
        estado: 'SP',
        cep: '01305-000',
        renda: 6800.00,
        profissao: 'Professora',
      },
    }),
    prisma.cliente.create({
      data: {
        nome: 'Carlos Eduardo Lima',
        cpf: '321.654.987-78',
        email: 'carlos.lima@email.com',
        telefone: '(11) 97654-3210',
        endereco: 'Rua Oscar Freire, 200, Apt 12',
        cidade: 'São Paulo',
        estado: 'SP',
        cep: '01426-001',
        renda: 4500.00,
        profissao: 'Vendedor',
      },
    }),
    prisma.cliente.create({
      data: {
        nome: 'Fernanda Rodrigues',
        cpf: '789.123.456-12',
        email: 'fernanda.rodrigues@email.com',
        telefone: '(11) 96543-2109',
        endereco: 'Alameda Santos, 800',
        cidade: 'São Paulo',
        estado: 'SP',
        cep: '01418-002',
        renda: 7200.00,
        profissao: 'Advogada',
      },
    }),
    prisma.cliente.create({
      data: {
        nome: 'Roberto Ferreira',
        cpf: '654.987.321-56',
        email: 'roberto.ferreira@email.com',
        telefone: '(11) 95432-1098',
        endereco: 'Rua Consolação, 1500, Apt 302',
        cidade: 'São Paulo',
        estado: 'SP',
        cep: '01302-907',
        renda: 3800.00,
        profissao: 'Mecânico',
      },
    }),
  ])

  console.log(`✅ Created ${clientes.length} clientes`)

  // Criar ClienteBanco (associações cliente-banco)
  console.log('🔗 Creating cliente-banco relationships...')

  const clienteBancos = await Promise.all([
    // Maria Silva - Banco do Brasil (principal)
    prisma.clienteBanco.create({
      data: {
        clienteId: clientes[0].id,
        bancoId: bancos[0].id,
        agencia: '1234-5',
        conta: '123456-7',
        principal: true,
      },
    }),
    // Maria Silva - Itaú (secundária)
    prisma.clienteBanco.create({
      data: {
        clienteId: clientes[0].id,
        bancoId: bancos[1].id,
        agencia: '0987',
        conta: '98765-4',
        principal: false,
      },
    }),
    // José Santos - Bradesco
    prisma.clienteBanco.create({
      data: {
        clienteId: clientes[1].id,
        bancoId: bancos[2].id,
        agencia: '5678-9',
        conta: '567890-1',
        principal: true,
      },
    }),
    // Ana Paula - Caixa
    prisma.clienteBanco.create({
      data: {
        clienteId: clientes[2].id,
        bancoId: bancos[3].id,
        agencia: '9012-3',
        conta: '901234-5',
        principal: true,
      },
    }),
    // Carlos Eduardo - Santander
    prisma.clienteBanco.create({
      data: {
        clienteId: clientes[3].id,
        bancoId: bancos[4].id,
        agencia: '3456-7',
        conta: '345678-9',
        principal: true,
      },
    }),
    // Fernanda - Nu Pagamentos
    prisma.clienteBanco.create({
      data: {
        clienteId: clientes[4].id,
        bancoId: bancos[5].id,
        conta: '123456789',
        principal: true,
      },
    }),
    // Roberto - Banco do Brasil
    prisma.clienteBanco.create({
      data: {
        clienteId: clientes[5].id,
        bancoId: bancos[0].id,
        agencia: '7890-1',
        conta: '789012-3',
        principal: true,
      },
    }),
  ])

  console.log(`✅ Created ${clienteBancos.length} cliente-banco relationships`)

  // Criar atendimentos
  console.log('📋 Creating atendimentos...')

  const atendimentos = [
    // Atendimentos DISPONIVEL para teste de "Assumir"
    {
      status: 'DISPONIVEL' as AtendimentoStatus,
      clienteId: clientes[0].id, // Maria Silva
      createdAt: new Date(Date.now() - 5 * 60 * 1000), // 5 min atrás
    },
    {
      status: 'DISPONIVEL' as AtendimentoStatus,
      clienteId: clientes[1].id, // José Santos
      createdAt: new Date(Date.now() - 10 * 60 * 1000), // 10 min atrás
    },
    {
      status: 'DISPONIVEL' as AtendimentoStatus,
      clienteId: clientes[2].id, // Ana Paula
      createdAt: new Date(Date.now() - 15 * 60 * 1000), // 15 min atrás
    },

    // Atendimento ATRIBUIDO
    {
      status: 'ATRIBUIDO' as AtendimentoStatus,
      clienteId: clientes[3].id, // Carlos Eduardo
      assigneeId: atendente.id,
      lockActive: true,
      lockOwnerId: atendente.id,
      lockStartedAt: new Date(Date.now() - 30 * 60 * 1000),
      createdAt: new Date(Date.now() - 45 * 60 * 1000),
    },

    // Atendimento PENDENTE_CALCULO
    {
      status: 'PENDENTE_CALCULO' as AtendimentoStatus,
      clienteId: clientes[4].id, // Fernanda
      assigneeId: atendente.id,
      lockActive: true,
      lockOwnerId: atendente.id,
      lockStartedAt: new Date(Date.now() - 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 90 * 60 * 1000),
    },

    // Atendimento SIMULACAO_APROVADA com resultado
    {
      status: 'SIMULACAO_APROVADA' as AtendimentoStatus,
      clienteId: clientes[5].id, // Roberto
      assigneeId: atendente.id,
      lockActive: true,
      lockOwnerId: atendente.id,
      lockStartedAt: new Date(Date.now() - 120 * 60 * 1000),
      calcResult: {
        aprovado: true,
        valor_liberado: 15000,
        parcela_total: 680.50,
        coeficiente: 2.15,
        observacoes: 'Cliente com bom histórico de crédito',
      },
      createdAt: new Date(Date.now() - 180 * 60 * 1000),
    },

    // Atendimento SIMULACAO_REPROVADA
    {
      status: 'SIMULACAO_REPROVADA' as AtendimentoStatus,
      clienteId: clientes[0].id, // Maria Silva (segundo atendimento)
      assigneeId: atendente.id,
      lockActive: true,
      lockOwnerId: atendente.id,
      lockStartedAt: new Date(Date.now() - 150 * 60 * 1000),
      calcResult: {
        aprovado: false,
        motivo: 'Renda insuficiente para o valor solicitado',
      },
      createdAt: new Date(Date.now() - 200 * 60 * 1000),
    },

    // Atendimento EM_FECHAMENTO
    {
      status: 'EM_FECHAMENTO' as AtendimentoStatus,
      clienteId: clientes[1].id, // José Santos (segundo atendimento)
      assigneeId: atendente.id,
      lockActive: true,
      lockOwnerId: atendente.id,
      lockStartedAt: new Date(Date.now() - 240 * 60 * 1000),
      calcResult: {
        aprovado: true,
        valor_liberado: 12000,
        parcela_total: 520.30,
        coeficiente: 2.05,
        observacoes: 'Simulação aprovada com desconto',
      },
      createdAt: new Date(Date.now() - 300 * 60 * 1000),
    },

    // Atendimento ENVIADO_FINANCEIRO
    {
      status: 'ENVIADO_FINANCEIRO' as AtendimentoStatus,
      clienteId: clientes[2].id, // Ana Paula (segundo atendimento)
      assigneeId: atendente.id,
      lockActive: true,
      lockOwnerId: atendente.id,
      lockStartedAt: new Date(Date.now() - 360 * 60 * 1000),
      closingApprovedAt: new Date(Date.now() - 60 * 60 * 1000),
      calcResult: {
        aprovado: true,
        valor_liberado: 20000,
        parcela_total: 850.75,
        coeficiente: 2.25,
        observacoes: 'Cliente premium - aprovação expressa',
      },
      createdAt: new Date(Date.now() - 420 * 60 * 1000),
    },

    // Atendimento ENCERRADO_ATIVADO (exemplo completo)
    {
      status: 'ENCERRADO_ATIVADO' as AtendimentoStatus,
      clienteId: clientes[3].id, // Carlos Eduardo (segundo atendimento)
      assigneeId: atendente.id,
      lockActive: false,
      lockOwnerId: null,
      lockStartedAt: null,
      closingApprovedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      financeActivationAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      calcResult: {
        aprovado: true,
        valor_liberado: 8000,
        parcela_total: 365.80,
        coeficiente: 1.95,
        observacoes: 'Contrato ativado com sucesso',
      },
      createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
    },
  ]

  const createdAtendimentos = []

  for (const data of atendimentos) {
    const atendimento = await prisma.atendimento.create({ data })
    createdAtendimentos.push(atendimento)

    // Criar log de auditoria inicial
    await prisma.auditLog.create({
      data: {
        atendimentoId: atendimento.id,
        event: 'CREATED',
        payload: { status: atendimento.status },
        actorId: admin.id,
      },
    })

    // Se tem assignee, criar log de ASSIGNED
    if (data.assigneeId) {
      await prisma.auditLog.create({
        data: {
          atendimentoId: atendimento.id,
          event: 'ASSIGNED',
          payload: { assigneeId: data.assigneeId },
          actorId: data.assigneeId,
          createdAt: new Date(data.createdAt.getTime() + 5 * 60 * 1000),
        },
      })
    }

    // Se tem calcResult, criar log de cálculo
    if (data.calcResult) {
      const calcEvent = (data.calcResult as any).aprovado ? 'CALC_APPROVED' : 'CALC_REJECTED'
      await prisma.auditLog.create({
        data: {
          atendimentoId: atendimento.id,
          event: calcEvent,
          payload: data.calcResult,
          actorId: calculista.id,
          createdAt: new Date(data.createdAt.getTime() + 60 * 60 * 1000),
        },
      })
    }

    // Se foi aprovado no fechamento
    if (data.closingApprovedAt) {
      await prisma.auditLog.create({
        data: {
          atendimentoId: atendimento.id,
          event: 'CLOSING_APPROVED',
          payload: {},
          actorId: gerente.id,
          createdAt: data.closingApprovedAt,
        },
      })
    }

    // Se foi ativado no financeiro
    if (data.financeActivationAt) {
      await prisma.auditLog.create({
        data: {
          atendimentoId: atendimento.id,
          event: 'FINANCE_CONFIRMED',
          payload: {},
          actorId: financeiro.id,
          createdAt: data.financeActivationAt,
        },
      })
    }
  }

  console.log(`✅ Created ${createdAtendimentos.length} atendimentos`)
  console.log(`✅ Created audit logs for all atendimentos`)

  // Criar contratos para atendimentos aprovados
  console.log('📋 Creating contratos...')

  const contratos = []

  // Contrato para atendimento ENCERRADO_ATIVADO (José Santos)
  const contratoAtivado = await prisma.contrato.create({
    data: {
      atendimentoId: createdAtendimentos[7].id, // EM_FECHAMENTO
      valorAprovado: 12000,
      parcelaMensal: 520.30,
      prazoMeses: 24,
      taxaJuros: 2.05,
      coeficiente: 2.05,
      status: 'EFETIVADO' as ContratoStatus,
      dataEfetivacao: new Date(Date.now() - 12 * 60 * 60 * 1000),
      observacoes: 'Contrato efetivado com sucesso',
      createdById: gerente.id,
      updatedById: financeiro.id,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    }
  })
  contratos.push(contratoAtivado)

  // Contrato para atendimento ENVIADO_FINANCEIRO (Ana Paula)
  const contratoFinanceiro = await prisma.contrato.create({
    data: {
      atendimentoId: createdAtendimentos[8].id, // ENVIADO_FINANCEIRO
      valorAprovado: 20000,
      parcelaMensal: 850.75,
      prazoMeses: 36,
      taxaJuros: 2.25,
      coeficiente: 2.25,
      status: 'COMPROVANTES_ANEXADOS' as ContratoStatus,
      observacoes: 'Aguardando confirmação financeira',
      createdById: gerente.id,
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    }
  })
  contratos.push(contratoFinanceiro)

  // Contrato para atendimento final (Carlos Eduardo)
  const contratoFinalizado = await prisma.contrato.create({
    data: {
      atendimentoId: createdAtendimentos[9].id, // ENCERRADO_ATIVADO
      valorAprovado: 8000,
      parcelaMensal: 365.80,
      prazoMeses: 24,
      taxaJuros: 1.95,
      coeficiente: 1.95,
      status: 'EFETIVADO' as ContratoStatus,
      dataEfetivacao: new Date(Date.now() - 12 * 60 * 60 * 1000),
      observacoes: 'Contrato efetivado com sucesso - processo completo',
      createdById: gerente.id,
      updatedById: financeiro.id,
      createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
    }
  })
  contratos.push(contratoFinalizado)

  console.log(`✅ Created ${contratos.length} contratos`)

  // Criar comentários para alguns atendimentos
  console.log('💬 Creating comentários...')

  const comentarios = await Promise.all([
    // Comentários para atendimento ATRIBUIDO (Carlos Eduardo)
    prisma.comentario.create({
      data: {
        atendimentoId: createdAtendimentos[3].id,
        userId: atendente.id,
        tipo: 'INTERNO' as TipoComentario,
        conteudo: 'Cliente ligou solicitando empréstimo de R$ 5.000 para reforma da casa.',
        createdAt: new Date(Date.now() - 35 * 60 * 1000),
      }
    }),

    // Comentário de observação
    prisma.comentario.create({
      data: {
        atendimentoId: createdAtendimentos[3].id,
        userId: atendente.id,
        tipo: 'OBSERVACAO' as TipoComentario,
        conteudo: 'Cliente tem histórico positivo no sistema, renda comprovada.',
        createdAt: new Date(Date.now() - 30 * 60 * 1000),
      }
    }),

    // Comentários para atendimento PENDENTE_CALCULO (Fernanda)
    prisma.comentario.create({
      data: {
        atendimentoId: createdAtendimentos[4].id,
        userId: atendente.id,
        tipo: 'CLIENTE' as TipoComentario,
        conteudo: 'Cliente: "Preciso do dinheiro com urgência para uma oportunidade de investimento."',
        createdAt: new Date(Date.now() - 80 * 60 * 1000),
      }
    }),

    prisma.comentario.create({
      data: {
        atendimentoId: createdAtendimentos[4].id,
        userId: calculista.id,
        tipo: 'INTERNO' as TipoComentario,
        conteudo: 'Analisando documentação. Cliente solicita R$ 25.000.',
        createdAt: new Date(Date.now() - 65 * 60 * 1000),
      }
    }),

    // Comentário para contrato efetivado
    prisma.comentario.create({
      data: {
        atendimentoId: createdAtendimentos[9].id,
        userId: financeiro.id,
        tipo: 'INTERNO' as TipoComentario,
        conteudo: 'Contrato ativado com sucesso. Valor liberado na conta do cliente.',
        createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000),
      }
    }),
  ])

  // Criar replies para alguns comentários
  const replies = await Promise.all([
    // Reply para o primeiro comentário interno
    prisma.comentario.create({
      data: {
        atendimentoId: createdAtendimentos[3].id,
        userId: gerente.id,
        tipo: 'INTERNO' as TipoComentario,
        conteudo: 'Verificar se cliente tem outras pendências no sistema antes de aprovar.',
        parentId: comentarios[0].id,
        createdAt: new Date(Date.now() - 25 * 60 * 1000),
      }
    }),

    // Reply para o reply (3° nível)
    prisma.comentario.create({
      data: {
        atendimentoId: createdAtendimentos[3].id,
        userId: atendente.id,
        tipo: 'INTERNO' as TipoComentario,
        conteudo: 'Checado - cliente não possui pendências. Pode prosseguir.',
        parentId: comentarios[0].id, // Reply ao comentário original
        createdAt: new Date(Date.now() - 20 * 60 * 1000),
      }
    }),
  ])

  console.log(`✅ Created ${comentarios.length + replies.length} comentários`)

  // Criar KPIs
  console.log('📊 Creating KPIs...')

  const now = new Date()
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1)

  const kpis = await Promise.all([
    // KPIs do mês atual
    prisma.kPI.create({
      data: {
        nome: 'Atendimentos Realizados',
        descricao: 'Total de atendimentos realizados no período',
        valor: 87,
        periodo: 'mensal',
        data: thisMonth,
        categoria: 'Atendimento',
        meta: 100,
        unidade: 'unidades',
        status: 'ATIVO' as StatusKPI,
      }
    }),

    prisma.kPI.create({
      data: {
        nome: 'Taxa de Conversão',
        descricao: 'Percentual de atendimentos que resultaram em contrato',
        valor: 68.5,
        periodo: 'mensal',
        data: thisMonth,
        categoria: 'Conversão',
        meta: 70,
        unidade: '%',
        status: 'ATIVO' as StatusKPI,
      }
    }),

    prisma.kPI.create({
      data: {
        nome: 'Valor Médio dos Contratos',
        descricao: 'Valor médio dos contratos efetivados',
        valor: 15750,
        periodo: 'mensal',
        data: thisMonth,
        categoria: 'Financeiro',
        meta: 15000,
        unidade: 'R$',
        status: 'ATIVO' as StatusKPI,
      }
    }),

    prisma.kPI.create({
      data: {
        nome: 'Tempo Médio de Atendimento',
        descricao: 'Tempo médio desde criação até finalização',
        valor: 4.2,
        periodo: 'mensal',
        data: thisMonth,
        categoria: 'Eficiência',
        meta: 5.0,
        unidade: 'horas',
        status: 'ATIVO' as StatusKPI,
      }
    }),

    prisma.kPI.create({
      data: {
        nome: 'NPS Clientes',
        descricao: 'Net Promoter Score dos clientes atendidos',
        valor: 8.4,
        periodo: 'mensal',
        data: thisMonth,
        categoria: 'Satisfação',
        meta: 8.0,
        unidade: 'pontos',
        status: 'ATIVO' as StatusKPI,
      }
    }),

    // KPIs do mês anterior
    prisma.kPI.create({
      data: {
        nome: 'Atendimentos Realizados',
        descricao: 'Total de atendimentos realizados no período',
        valor: 94,
        periodo: 'mensal',
        data: lastMonth,
        categoria: 'Atendimento',
        meta: 100,
        unidade: 'unidades',
        status: 'ATIVO' as StatusKPI,
      }
    }),

    prisma.kPI.create({
      data: {
        nome: 'Taxa de Conversão',
        descricao: 'Percentual de atendimentos que resultaram em contrato',
        valor: 72.3,
        periodo: 'mensal',
        data: lastMonth,
        categoria: 'Conversão',
        meta: 70,
        unidade: '%',
        status: 'ATIVO' as StatusKPI,
      }
    }),

    prisma.kPI.create({
      data: {
        nome: 'Valor Médio dos Contratos',
        descricao: 'Valor médio dos contratos efetivados',
        valor: 14200,
        periodo: 'mensal',
        data: lastMonth,
        categoria: 'Financeiro',
        meta: 15000,
        unidade: 'R$',
        status: 'ATIVO' as StatusKPI,
      }
    }),

    // KPIs semanais
    prisma.kPI.create({
      data: {
        nome: 'Leads Qualificados',
        descricao: 'Número de leads qualificados na semana',
        valor: 23,
        periodo: 'semanal',
        data: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        categoria: 'Leads',
        meta: 25,
        unidade: 'unidades',
        status: 'ATIVO' as StatusKPI,
      }
    }),

    prisma.kPI.create({
      data: {
        nome: 'Contratos Efetivados',
        descricao: 'Número de contratos efetivados na semana',
        valor: 8,
        periodo: 'semanal',
        data: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        categoria: 'Contratos',
        meta: 10,
        unidade: 'unidades',
        status: 'ATIVO' as StatusKPI,
      }
    }),

    // KPIs trimestrais
    prisma.kPI.create({
      data: {
        nome: 'Volume de Negócios',
        descricao: 'Volume total de negócios no trimestre',
        valor: 1250000,
        periodo: 'trimestral',
        data: twoMonthsAgo,
        categoria: 'Financeiro',
        meta: 1500000,
        unidade: 'R$',
        status: 'ATIVO' as StatusKPI,
      }
    }),

    prisma.kPI.create({
      data: {
        nome: 'Taxa de Inadimplência',
        descricao: 'Percentual de contratos em atraso',
        valor: 3.2,
        periodo: 'trimestral',
        data: twoMonthsAgo,
        categoria: 'Risco',
        meta: 5.0,
        unidade: '%',
        status: 'ATIVO' as StatusKPI,
      }
    }),
  ])

  console.log(`✅ Created ${kpis.length} KPIs`)

  console.log('🎉 Seed completed successfully!')
  console.log('\n📊 Database Summary:')
  console.log(`  • ${users.length} usuários`)
  console.log(`  • ${bancos.length} bancos`)
  console.log(`  • ${clientes.length} clientes`)
  console.log(`  • ${clienteBancos.length} relações cliente-banco`)
  console.log(`  • ${createdAtendimentos.length} atendimentos`)
  console.log(`  • ${contratos.length} contratos`)
  console.log(`  • ${comentarios.length + replies.length} comentários`)
  console.log(`  • ${kpis.length} KPIs`)

  console.log('\n🔑 Login credentials:')
  console.log('  • atendente@licall.dev (password: dev123)')
  console.log('  • calculista@licall.dev (password: dev123)')
  console.log('  • gerente@licall.dev (password: dev123)')
  console.log('  • financeiro@licall.dev (password: dev123)')
  console.log('  • admin@licall.dev (password: dev123)')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })