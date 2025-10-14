"use client";

import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Upload, Trash2, Download } from "lucide-react";

interface Bank {
  banco: string;
  saldo_devedor: number;
  liberado: number;
  valor_parcela: number;
}

interface ExternalIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ExternalIncomeFormData) => Promise<void>;
  users: Array<{ id: number; name: string }>;
}

export interface ExternalIncomeFormData {
  date: string;
  cpf_cliente: string;
  nome_cliente: string;
  banks_json: Bank[];
  prazo: number;
  coeficiente: number;
  seguro: number;
  percentual_consultoria: number;
  owner_user_id: number;
}

export function ExternalIncomeModal({
  isOpen,
  onClose,
  onSubmit,
  users,
}: ExternalIncomeModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<ExternalIncomeFormData>({
    date: new Date().toISOString().split("T")[0],
    cpf_cliente: "",
    nome_cliente: "",
    banks_json: [
      { banco: "", saldo_devedor: 0, liberado: 0, valor_parcela: 0 },
    ],
    prazo: 84,
    coeficiente: 0,
    seguro: 0,
    percentual_consultoria: 14,
    owner_user_id: 0,
  });

  const addBank = () => {
    setFormData({
      ...formData,
      banks_json: [
        ...formData.banks_json,
        { banco: "", saldo_devedor: 0, liberado: 0, valor_parcela: 0 },
      ],
    });
  };

  const removeBank = (index: number) => {
    const newBanks = formData.banks_json.filter((_, i) => i !== index);
    setFormData({ ...formData, banks_json: newBanks });
  };

  const updateBank = (index: number, field: keyof Bank, value: string | number) => {
    const newBanks = [...formData.banks_json];
    newBanks[index] = { ...newBanks[index], [field]: value };
    setFormData({ ...formData, banks_json: newBanks });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validações
      if (!formData.cpf_cliente || !formData.nome_cliente) {
        throw new Error("CPF e Nome do cliente são obrigatórios");
      }

      if (formData.owner_user_id === 0) {
        throw new Error("Selecione o proprietário da receita");
      }

      if (formData.banks_json.length === 0) {
        throw new Error("Adicione pelo menos um banco");
      }

      // Validar que todos os bancos têm nome
      const invalidBanks = formData.banks_json.filter((b) => !b.banco.trim());
      if (invalidBanks.length > 0) {
        throw new Error("Todos os bancos devem ter um nome");
      }

      await onSubmit(formData);
      onClose();
      resetForm();
    } catch (err: any) {
      setError(err.message || "Erro ao criar receita");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split("T")[0],
      cpf_cliente: "",
      nome_cliente: "",
      banks_json: [
        { banco: "", saldo_devedor: 0, liberado: 0, valor_parcela: 0 },
      ],
      prazo: 84,
      coeficiente: 0,
      seguro: 0,
      percentual_consultoria: 14,
      owner_user_id: 0,
    });
    setError(null);
  };

  // Cálculo dos totais
  const totals = React.useMemo(() => {
    const saldo_total = formData.banks_json.reduce(
      (sum, b) => sum + (b.saldo_devedor || 0),
      0
    );
    const liberado_total = formData.banks_json.reduce(
      (sum, b) => sum + (b.liberado || 0),
      0
    );
    const valor_parcela_total = formData.banks_json.reduce(
      (sum, b) => sum + (b.valor_parcela || 0),
      0
    );

    const total_financiado = saldo_total + formData.seguro;
    const custo_consultoria =
      liberado_total * (formData.percentual_consultoria / 100);
    const custo_consultoria_liquido = custo_consultoria * 0.86;
    const liberado_cliente = liberado_total - custo_consultoria;

    return {
      saldo_total,
      liberado_total,
      valor_parcela_total,
      total_financiado,
      custo_consultoria,
      custo_consultoria_liquido,
      liberado_cliente,
    };
  }, [formData]);

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto z-50 p-6">
          <div className="flex justify-between items-center mb-6">
            <Dialog.Title className="text-2xl font-bold text-gray-900 dark:text-white">
              Nova Receita - Cliente Externo
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label="Fechar"
              >
                <X className="w-6 h-6" />
              </button>
            </Dialog.Close>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Dados do Cliente */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Dados do Cliente
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Data *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    CPF do Cliente *
                  </label>
                  <input
                    type="text"
                    value={formData.cpf_cliente}
                    onChange={(e) =>
                      setFormData({ ...formData, cpf_cliente: e.target.value })
                    }
                    placeholder="000.000.000-00"
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nome do Cliente *
                  </label>
                  <input
                    type="text"
                    value={formData.nome_cliente}
                    onChange={(e) =>
                      setFormData({ ...formData, nome_cliente: e.target.value })
                    }
                    placeholder="Nome completo"
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Proprietário *
                  </label>
                  <select
                    value={formData.owner_user_id}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        owner_user_id: parseInt(e.target.value),
                      })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={0}>Selecione um usuário</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Bancos */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Bancos
                </h3>
                <button
                  type="button"
                  onClick={addBank}
                  className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium"
                >
                  + Adicionar Banco
                </button>
              </div>

              <div className="space-y-4">
                {formData.banks_json.map((bank, index) => (
                  <div
                    key={index}
                    className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Banco {index + 1}
                      </span>
                      {formData.banks_json.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeBank(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Nome do Banco *
                        </label>
                        <input
                          type="text"
                          value={bank.banco}
                          onChange={(e) =>
                            updateBank(index, "banco", e.target.value)
                          }
                          placeholder="Ex: Banco do Brasil"
                          required
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Saldo Devedor
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={bank.saldo_devedor}
                          onChange={(e) =>
                            updateBank(
                              index,
                              "saldo_devedor",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Liberado
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={bank.liberado}
                          onChange={(e) =>
                            updateBank(
                              index,
                              "liberado",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Valor da Parcela
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={bank.valor_parcela}
                          onChange={(e) =>
                            updateBank(
                              index,
                              "valor_parcela",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Parâmetros da Simulação */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Parâmetros
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Prazo (meses)
                  </label>
                  <input
                    type="number"
                    value={formData.prazo}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        prazo: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Coeficiente
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={formData.coeficiente}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        coeficiente: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Seguro
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.seguro}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        seguro: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    % Consultoria
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.percentual_consultoria}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        percentual_consultoria: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Totais Calculados */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Totais Calculados
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Saldo Total:
                  </span>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    R$ {totals.saldo_total.toFixed(2)}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Liberado Total:
                  </span>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    R$ {totals.liberado_total.toFixed(2)}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Parcela Total:
                  </span>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    R$ {totals.valor_parcela_total.toFixed(2)}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Total Financiado:
                  </span>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    R$ {totals.total_financiado.toFixed(2)}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Custo Consultoria:
                  </span>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    R$ {totals.custo_consultoria.toFixed(2)}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Consultoria Líquida:
                  </span>
                  <p className="font-semibold text-green-600 dark:text-green-400">
                    R$ {totals.custo_consultoria_liquido.toFixed(2)}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Liberado Cliente:
                  </span>
                  <p className="font-semibold text-blue-600 dark:text-blue-400">
                    R$ {totals.liberado_cliente.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Ações */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Criando..." : "Criar Receita"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
