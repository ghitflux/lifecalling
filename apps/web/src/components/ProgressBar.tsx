"use client";

import { motion } from "framer-motion";
import { CheckCircle, Loader2 } from "lucide-react";

interface ProgressBarProps {
  progress: number; // 0-100
  status?: "uploading" | "processing" | "completed" | "error";
  label?: string;
  stats?: {
    clients_created?: number;
    clients_updated?: number;
    cases_created?: number;
    lines_processed?: number;
    total_lines?: number;
  };
}

export function ProgressBar({ progress, status = "processing", label, stats }: ProgressBarProps) {
  const getStatusColor = () => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "error":
        return "bg-red-500";
      case "uploading":
        return "bg-blue-500";
      case "processing":
      default:
        return "bg-primary";
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "uploading":
        return "Enviando arquivo...";
      case "processing":
        return "Processando importação...";
      case "completed":
        return "Importação concluída!";
      case "error":
        return "Erro na importação";
      default:
        return "Processando...";
    }
  };

  return (
    <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
      {/* Status Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {status === "completed" ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          )}
          <span className="font-medium">{label || getStatusText()}</span>
        </div>
        <span className="text-sm font-semibold">{Math.round(progress)}%</span>
      </div>

      {/* Progress Bar */}
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${getStatusColor()}`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{
            duration: 0.5,
            ease: "easeOut",
          }}
        />

        {/* Shimmer effect while processing */}
        {status === "processing" && progress < 100 && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{
              x: ["-100%", "200%"],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        )}
      </div>

      {/* Stats */}
      {stats && (
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {stats.clients_created !== undefined && (
            <div className="flex flex-col">
              <span className="text-muted-foreground">Clientes Criados</span>
              <span className="font-semibold text-green-600">
                {stats.clients_created.toLocaleString()}
              </span>
            </div>
          )}
          {stats.clients_updated !== undefined && (
            <div className="flex flex-col">
              <span className="text-muted-foreground">Clientes Atualizados</span>
              <span className="font-semibold text-blue-600">
                {stats.clients_updated.toLocaleString()}
              </span>
            </div>
          )}
          {stats.cases_created !== undefined && (
            <div className="flex flex-col">
              <span className="text-muted-foreground">Casos Criados</span>
              <span className="font-semibold text-purple-600">
                {stats.cases_created.toLocaleString()}
              </span>
            </div>
          )}
          {stats.lines_processed !== undefined && stats.total_lines !== undefined && (
            <div className="flex flex-col">
              <span className="text-muted-foreground">Linhas Processadas</span>
              <span className="font-semibold">
                {stats.lines_processed.toLocaleString()} / {stats.total_lines.toLocaleString()}
              </span>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
