/* packages/ui/src/CaseSkeleton.tsx */
import React from "react";
import { Skeleton, SkeletonText, SkeletonButton } from "./Skeleton";
import { Card } from "./Card";

export function CaseSkeleton() {
  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton height={20} width="60%" animation="pulse" />
            <Skeleton height={16} width="40%" animation="none" />
          </div>
          <Skeleton height={24} width={80} variant="rectangular" className="rounded-full" animation="none" />
        </div>

        {/* Content - reduzido para 2 linhas apenas */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton variant="circular" width={16} height={16} animation="none" />
            <Skeleton height={14} width="50%" animation="none" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton variant="circular" width={16} height={16} animation="none" />
            <Skeleton height={14} width="40%" animation="none" />
          </div>
        </div>

        {/* Footer - simplificado */}
        <div className="flex gap-2 pt-2">
          <Skeleton height={36} width="48%" className="rounded-md" animation="none" />
          <Skeleton height={36} width="48%" className="rounded-md" animation="none" />
        </div>
      </div>
    </Card>
  );
}

export function CaseListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
      {Array.from({ length: count }, (_, i) => (
        <CaseSkeleton key={`skeleton-${i}`} />
      ))}
    </div>
  );
}