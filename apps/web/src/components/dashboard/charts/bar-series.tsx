"use client";

import { DashboardCard } from "../ui/dashboard-card";
import { AnimatePresence, motion } from "framer-motion";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface BarPoint {
  ts: string;
  value: number;
}

interface BarSeriesProps {
  title: string;
  data: BarPoint[];
  range: string;
}

export function BarSeries({ title, data, range }: BarSeriesProps) {
  return (
    <DashboardCard>
      <div className="flex items-baseline justify-between">
        <h4 className="text-sm font-medium text-white/70">{title}</h4>
        <span className="text-xs text-white/50">{range.toUpperCase()}</span>
      </div>
      <div className="mt-6 h-56">
        <AnimatePresence mode="wait">
          <motion.div key={range} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="h-full">
            <ResponsiveContainer>
              <BarChart data={data}>
                <XAxis dataKey="ts" tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 12 }} tickMargin={8} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 12 }} width={48} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} formatter={(value: number) => value.toLocaleString("pt-BR")} labelFormatter={(label) => label} />
                <defs>
                  <linearGradient id="barGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#1E40AF" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
                <Bar dataKey="value" fill="url(#barGradient)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </AnimatePresence>
      </div>
    </DashboardCard>
  );
}
