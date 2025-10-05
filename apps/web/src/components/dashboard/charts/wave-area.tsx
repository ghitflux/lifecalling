"use client";

import { DashboardCard } from "../ui/dashboard-card";
import { AnimatePresence, motion } from "framer-motion";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface WavePoint {
  ts: string;
  value: number;
}

interface WaveAreaProps {
  title: string;
  data: WavePoint[];
  range: string;
}

export function WaveArea({ title, data, range }: WaveAreaProps) {
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
              <AreaChart data={data}>
                <XAxis dataKey="ts" tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 12 }} tickMargin={8} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 12 }} width={48} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ stroke: "#FFFFFF", strokeOpacity: 0.06 }} formatter={(value: number) => `${value.toFixed(1)}%`} labelFormatter={(label) => label} />
                <defs>
                  <linearGradient id="waveGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#0B1020" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2} fill="url(#waveGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        </AnimatePresence>
      </div>
    </DashboardCard>
  );
}
