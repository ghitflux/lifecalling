"use client";

import { DashboardCard } from "../ui/dashboard-card";
import { AnimatePresence, motion } from "framer-motion";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const PALETTE = ["#4F46E5", "#22C55E", "#EAB308", "#F97316", "#EC4899"];

interface DonutSlice {
  label: string;
  value: number;
}

interface DonutCircleProps {
  title: string;
  data: DonutSlice[];
  total: number;
  range: string;
}

export function DonutCircle({ title, data, total, range }: DonutCircleProps) {
  return (
    <DashboardCard>
      <div className="flex items-baseline justify-between">
        <h4 className="text-sm font-medium text-white/70">{title}</h4>
        <span className="text-xs text-white/50">{range.toUpperCase()}</span>
      </div>
      <div className="relative mt-6 h-56">
        <AnimatePresence mode="wait">
          <motion.div
            key={range}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="h-full"
          >
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="label"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  startAngle={90}
                  endAngle={-270}
                >
                  {data.map((_, index) => (
                    <Cell key={index} fill={PALETTE[index % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} formatter={(value: number) => value.toLocaleString("pt-BR")}
                  labelFormatter={(label) => label}
                />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        </AnimatePresence>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-xs text-white/50">Total</div>
            <div className="text-2xl font-semibold text-white">{total.toLocaleString("pt-BR")}</div>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
}
