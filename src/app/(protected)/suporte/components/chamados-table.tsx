"use client";

import { useState, useEffect } from "react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getSupportTicketsAction } from "@/actions/get-support-tickets";

type Chamado = {
  id: string;
  titulo: string;
  descricao: string;
  status: "aberto" | "em_andamento" | "fechado";
  createdAt: Date;
};

const statusLabel: Record<string, string> = {
  aberto: "Aberto",
  em_andamento: "Em andamento",
  fechado: "Fechado",
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

type ChamadosTableProps = {
  userId: string;
  refreshTrigger?: number;
};

export function ChamadosTable({ userId, refreshTrigger }: ChamadosTableProps) {
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { execute: fetchChamados } = useAction(getSupportTicketsAction, {
    onSuccess: ({ data }) => {
      if (data?.success && data.data) {
        setChamados(data.data as Chamado[]);
      }
      setIsLoading(false);
    },
    onError: () => {
      toast.error("Erro ao carregar chamados");
      setIsLoading(false);
    },
  });

  useEffect(() => {
    setIsLoading(true);
    fetchChamados({ userId });
  }, [userId, refreshTrigger]);

  if (isLoading) {
    return (
      <div className="rounded-md border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-center py-12 text-sm text-gray-500 dark:text-gray-400">
          Carregando chamados...
        </div>
      </div>
    );
  }

  if (chamados.length === 0) {
    return (
      <div className="rounded-md border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-center py-12 text-sm text-gray-500 dark:text-gray-400">
          Nenhum chamado aberto ainda.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-slate-200 dark:border-slate-800">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Título</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Data</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {chamados.map((chamado) => (
            <TableRow key={chamado.id}>
              <TableCell className="font-medium">{chamado.titulo}</TableCell>
              <TableCell>
                {statusLabel[chamado.status] ?? chamado.status}
              </TableCell>
              <TableCell className="text-gray-600 dark:text-gray-400">
                {formatDate(chamado.createdAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
