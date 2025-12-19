"use client";

import { DashboardCard } from "../ui/dashboard-card";
import { motion } from "framer-motion";

interface PulseMetricProps {
  label: string;
  value: number | string;
  unit?: string;
}

export function PulseMetric({ label, value, unit = "" }: PulseMetricProps) {
  const display = typeof value === "number" ? value.toLocaleString("pt-BR") : value;

  return (
    <DashboardCard>
      <div className="flex items-center gap-6">
        <div className="relative h-24 w-24">
          <motion.span
            className="absolute inset-0 rounded-full bg-brand-500/20"
            initial={{ scale: 0.8, opacity: 0.6 }}
            animate={{ scale: 1.25, opacity: 0 }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeOut" }}
          />
          <motion.span
            className="absolute inset-3 rounded-full bg-brand-500/30"
            initial={{ scale: 0.9, opacity: 0.8 }}
            animate={{ scale: 1.15, opacity: 0 }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeOut", delay: 0.3 }}
          />
          <div className="absolute inset-5 flex items-center justify-center rounded-full bg-brand-500/70 text-white">
            <div className="text-xl font-semibold">
              {display}
              {unit}
            </div>
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-white/80">{label}</p>
          <p className="text-xs text-white/50">Atualizado em tempo real</p>
        </div>
      </div>
    </DashboardCard>
  );
}
