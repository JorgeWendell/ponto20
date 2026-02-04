"use client";

import { useState, useEffect } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  TablePagination,
  TABLE_PAGE_SIZE,
} from "@/components/ui/table-pagination";
import { getSchedulesAction } from "@/actions/get-schedules";
import { deleteScheduleAction } from "@/actions/delete-schedule";
import { ScheduleForm } from "./schedule-form";

function formatTime(value: string | null): string {
  if (!value) return "—";
  const part = value.slice(0, 5);
  return part.length === 5 ? part : value;
}

type Schedule = {
  id: string;
  nome: string;
  entrada: string;
  entradaAlmoco: string;
  saidaAlmoco: string;
  saida: string;
  createdAt: Date;
  updatedAt: Date;
};

export function SchedulesTable() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<string | null>(null);

  const paginated = schedules.slice(
    (currentPage - 1) * TABLE_PAGE_SIZE,
    currentPage * TABLE_PAGE_SIZE,
  );

  const { execute: fetchSchedules } = useAction(getSchedulesAction, {
    onSuccess: ({ data }) => {
      if (data?.success && data.data) {
        setSchedules(data.data);
      }
      setIsLoading(false);
    },
    onError: () => {
      toast.error("Erro ao carregar horários");
      setIsLoading(false);
    },
  });

  const { execute: deleteSchedule } = useAction(deleteScheduleAction, {
    onSuccess: ({ data }) => {
      if (data?.success) {
        toast.success("Horário excluído com sucesso!");
        fetchSchedules({});
        setDeleteDialogOpen(false);
        setScheduleToDelete(null);
      }
    },
    onError: () => {
      toast.error("Erro ao excluir horário");
    },
  });

  useEffect(() => {
    fetchSchedules({});
  }, [fetchSchedules]);

  useEffect(() => {
    setCurrentPage(1);
  }, [schedules.length]);

  useEffect(() => {
    const handleScheduleCreated = () => {
      fetchSchedules({});
    };

    window.addEventListener("schedule-created", handleScheduleCreated);
    return () => {
      window.removeEventListener("schedule-created", handleScheduleCreated);
    };
  }, [fetchSchedules]);

  const handleDeleteClick = (id: string) => {
    setScheduleToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (scheduleToDelete) {
      deleteSchedule({ id: scheduleToDelete });
    }
  };

  const handleEdit = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setEditDialogOpen(true);
  };

  const handleEditDialogClose = (open: boolean) => {
    setEditDialogOpen(open);
    if (!open) setEditingSchedule(null);
  };

  if (isLoading) {
    return <div className="py-8 text-center">Carregando...</div>;
  }

  return (
    <div className="border-border bg-card rounded-lg border shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Entrada</TableHead>
            <TableHead>Entrada almoço</TableHead>
            <TableHead>Saída almoço</TableHead>
            <TableHead>Saída</TableHead>
            <TableHead className="w-[100px] text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {schedules.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-muted-foreground py-8 text-center"
              >
                Nenhum horário cadastrado
              </TableCell>
            </TableRow>
          ) : (
            paginated.map((schedule) => (
              <TableRow key={schedule.id}>
                <TableCell className="font-medium">{schedule.nome}</TableCell>
                <TableCell>{formatTime(schedule.entrada)}</TableCell>
                <TableCell>{formatTime(schedule.entradaAlmoco)}</TableCell>
                <TableCell>{formatTime(schedule.saidaAlmoco)}</TableCell>
                <TableCell>{formatTime(schedule.saida)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(schedule)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteClick(schedule.id)}
                        className="text-red-600 dark:text-red-400"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <TablePagination
        totalItems={schedules.length}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        pageSize={TABLE_PAGE_SIZE}
      />

      <ScheduleForm
        schedule={editingSchedule}
        open={editDialogOpen}
        onOpenChange={handleEditDialogClose}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este horário? Esta ação não pode
              ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
