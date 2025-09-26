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
      <Skeleton height={32} width={300} />

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Fila de Simulações */}
        <Card className="lg:col-span-1">
          <div className="p-4">
            <Skeleton height={18} width={120} className="mb-4" />
            <div className="space-y-2">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="p-3 rounded-lg border">
                  <Skeleton height={14} width={60} className="mb-1" />
                  <Skeleton height={12} width={80} />
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Detalhes do Caso */}
        <Card className="lg:col-span-1">
          <div className="p-4">
            <Skeleton height={18} width={100} className="mb-4" />
            <div className="space-y-3">
              <Skeleton height={16} width="80%" />
              <Skeleton height={14} width="60%" />
              <Skeleton height={14} width="70%" />
              <div className="border-t pt-3 mt-3">
                <Skeleton height={14} width={80} className="mb-2" />
                <SkeletonText lines={2} />
              </div>
            </div>
          </div>
        </Card>

        {/* Formulário e Resultados */}
        <div className="lg:col-span-2 space-y-6">
          {/* Formulário */}
          <Card className="p-6">
            <Skeleton height={20} width={180} className="mb-4" />
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton height={14} width={80} />
                  <Skeleton height={40} width="100%" />
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-4 mt-4 border-t">
              <SkeletonButton className="flex-1" />
              <SkeletonButton className="flex-1" />
            </div>
          </Card>

          {/* Resultados */}
          <Card className="p-6">
            <Skeleton height={20} width={120} className="mb-4" />
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton height={14} width={120} />
                  <Skeleton height={14} width={80} />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}