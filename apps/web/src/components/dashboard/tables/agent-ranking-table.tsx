"use client";

import { DashboardCard } from "../ui/dashboard-card";

interface RankingRow {
  agentId: string;
  name: string;
  avatar?: string;
  approvals: number;
  sims: number;
  contracts: number;
  slaPct: number;   // 0–100
  tmaSec: number;   // segundos
  score: number;
}

interface AgentRankingTableProps {
  rows: RankingRow[];
}

export function AgentRankingTable({ rows }: AgentRankingTableProps) {
  return (
    <DashboardCard>
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-sm font-medium text-white/70">Ranking de Atendentes</h4>
        <span className="text-xs text-white/50">Top {rows.length}</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full table-fixed text-sm">
          <thead className="text-left text-white/60">
            <tr className="border-b border-white/5">
              <th className="w-10 py-2">#</th>
              <th className="py-2">Agente</th>
              <th className="py-2 text-center">Aprov.</th>
              <th className="py-2 text-center">Simul.</th>
              <th className="py-2 text-center">Contratos</th>
              <th className="py-2 text-center">SLA</th>
              <th className="py-2 text-center">TMA</th>
              <th className="py-2 text-center">Score</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.agentId} className="border-b border-white/5 text-white/80">
                <td className="py-3 text-center text-white/60">{index + 1}</td>
                <td className="py-3">
                  <div className="flex items-center gap-3">
                    {row.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={row.avatar}
                        alt={row.name}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-white/10" />
                    )}
                    <span className="font-medium">{row.name}</span>
                  </div>
                </td>
                <td className="py-3 text-center">{row.approvals}</td>
                <td className="py-3 text-center">{row.sims}</td>
                <td className="py-3 text-center">{row.contracts}</td>
                <td className="py-3 text-center">{row.slaPct.toFixed(1)}%</td>
                <td className="py-3 text-center">{Math.round(row.tmaSec / 60)}m</td>
                <td className="py-3 text-center font-semibold text-white">
                  {row.score.toFixed(0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardCard>
  );
}
