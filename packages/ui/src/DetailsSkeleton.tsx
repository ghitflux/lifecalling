/* packages/ui/src/DetailsSkeleton.tsx */
import React from "react";
import { Skeleton, SkeletonText, SkeletonButton } from "./Skeleton";
import { Card } from "./Card";

export function DetailsSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton height={32} width={200} />
          <div className="flex items-center gap-2">
            <Skeleton height={24} width={80} className="rounded-full" />
          </div>
        </div>
        <div className="flex gap-3">
          <SkeletonButton />
          <SkeletonButton />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Card 1 - Dados do Cliente */}
        <Card className="p-6 space-y-4">
          <Skeleton height={20} width={150} />

          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton height={14} width={50} />
              <Skeleton height={40} width="100%" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Skeleton height={14} width={30} />
                <Skeleton height={40} width="100%" />
              </div>
              <div className="space-y-2">
                <Skeleton height={14} width={60} />
                <Skeleton height={40} width="100%" />
              </div>
            </div>

            <div className="space-y-2">
              <Skeleton height={14} width={40} />
              <Skeleton height={40} width="100%" />
            </div>

            <div className="space-y-2">
              <Skeleton height={14} width={120} />
              <Skeleton height={40} width="100%" />
            </div>

            <div className="space-y-2">
              <Skeleton height={14} width={80} />
              <Skeleton height={100} width="100%" />
            </div>

            <div className="flex gap-2">
              <SkeletonButton className="flex-1" />
            </div>
          </div>
        </Card>

        {/* Card 2 - Documentos */}
        <Card className="p-6 space-y-4">
          <Skeleton height={20} width={100} />

          <div className="space-y-4">
            <div className="border-2 border-dashed border-muted rounded-lg p-8">
              <div className="text-center space-y-2">
                <Skeleton variant="circular" width={48} height={48} className="mx-auto" />
                <Skeleton height={16} width={120} className="mx-auto" />
                <Skeleton height={14} width={180} className="mx-auto" />
              </div>
            </div>

            <div className="border-t pt-4">
              <Skeleton height={18} width={120} className="mb-2" />
              <Skeleton height={14} width={150} />
            </div>
          </div>
        </Card>
      </div>

      {/* Histórico do Caso */}
      <Card className="p-6">
        <Skeleton height={20} width={150} className="mb-4" />
        <SkeletonText lines={3} />
      </Card>
    </div>
  );
}

export function CalculistaSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Header com breadcrumb e título */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton height={20} width={20} className="rounded" />
            <Skeleton height={16} width={80} />
          </div>
          <Skeleton height={32} width={280} />
          <Skeleton height={16} width={200} />
        </div>
        <Skeleton height={24} width={120} className="rounded-full" />
      </div>

      {/* KPI Cards - Stats do Calculista */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }, (_, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-muted p-2 rounded-md">
                <Skeleton height={20} width={20} />
              </div>
              <div className="space-y-1 flex-1">
                <Skeleton height={14} width={120} />
                <Skeleton height={24} width={60} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Fila de Simulações - Lista lateral */}
        <Card className="lg:col-span-1">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Skeleton height={16} width={16} />
              <Skeleton height={18} width={140} />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <Skeleton height={14} width={60} />
                    <Skeleton height={18} width={50} className="rounded-full" />
                  </div>
                  <Skeleton height={12} width="90%" className="mb-1" />
                  <Skeleton height={12} width="70%" />
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Detalhes do Cliente */}
        <Card className="lg:col-span-1">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Skeleton height={16} width={16} />
              <Skeleton height={18} width={120} />
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
                <Skeleton height={16} width="85%" />
                <Skeleton height={14} width="70%" />
              </div>
              <div className="grid grid-cols-1 gap-2">
                <div className="flex justify-between">
                  <Skeleton height={14} width={40} />
                  <Skeleton height={14} width={100} />
                </div>
                <div className="flex justify-between">
                  <Skeleton height={14} width={60} />
                  <Skeleton height={14} width={80} />
                </div>
                <div className="flex justify-between">
                  <Skeleton height={14} width={50} />
                  <Skeleton height={14} width={90} />
                </div>
              </div>
              <div className="border-t pt-3 mt-3">
                <Skeleton height={14} width={80} className="mb-2" />
                <SkeletonText lines={2} />
              </div>
            </div>
          </div>
        </Card>

        {/* Formulário e Resultados */}
        <div className="lg:col-span-2 space-y-6">
          {/* Formulário de Simulação Multi-Banco */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Skeleton height={20} width={200} />
              <SkeletonButton className="w-32" />
            </div>
            
            {/* Bancos */}
            <div className="space-y-4 mb-6">
              {Array.from({ length: 2 }, (_, bankIndex) => (
                <div key={bankIndex} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <Skeleton height={16} width={80} />
                    {bankIndex > 0 && <Skeleton height={20} width={20} className="rounded" />}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Skeleton height={14} width={60} />
                      <Skeleton height={40} width="100%" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton height={14} width={80} />
                      <Skeleton height={40} width="100%" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton height={14} width={100} />
                      <Skeleton height={40} width="100%" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton height={14} width={90} />
                      <Skeleton height={40} width="100%" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Dados Globais */}
            <div className="border-t pt-4">
              <Skeleton height={16} width={120} className="mb-3" />
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: 4 }, (_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton height={14} width={100} />
                    <Skeleton height={40} width="100%" />
                  </div>
                ))}
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex gap-3 pt-6 mt-6 border-t">
              <SkeletonButton className="flex-1" />
              <SkeletonButton className="flex-1" />
              <SkeletonButton className="flex-1" />
            </div>
          </Card>

          {/* Resultados da Simulação */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Skeleton height={16} width={16} />
              <Skeleton height={20} width={150} />
            </div>
            
            {/* Resumo Financeiro */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="space-y-3">
                <Skeleton height={14} width={100} className="mb-2" />
                {Array.from({ length: 4 }, (_, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <Skeleton height={14} width={120} />
                    <Skeleton height={16} width={100} />
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <Skeleton height={14} width={120} className="mb-2" />
                {Array.from({ length: 4 }, (_, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <Skeleton height={14} width={110} />
                    <Skeleton height={16} width={90} />
                  </div>
                ))}
              </div>
            </div>

            {/* Detalhamento por Banco */}
            <div className="border-t pt-4">
              <Skeleton height={16} width={140} className="mb-3" />
              <div className="space-y-3">
                {Array.from({ length: 2 }, (_, i) => (
                  <div key={i} className="bg-muted/30 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <Skeleton height={14} width={80} />
                      <Skeleton height={18} width={60} className="rounded-full" />
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="flex justify-between">
                        <Skeleton height={12} width={60} />
                        <Skeleton height={12} width={70} />
                      </div>
                      <div className="flex justify-between">
                        <Skeleton height={12} width={50} />
                        <Skeleton height={12} width={80} />
                      </div>
                      <div className="flex justify-between">
                        <Skeleton height={12} width={70} />
                        <Skeleton height={12} width={75} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}