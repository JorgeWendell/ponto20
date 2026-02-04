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
import { getEmployeesAction } from "@/actions/get-employees";
import { deleteEmployeeAction } from "@/actions/delete-employee";
import { FuncionarioForm } from "./funcionario-form";

type Employee = {
  id: string;
  nome: string;
  jobId: string | null;
  jobNome: string | null;
  scheduleId: string | null;
  scheduleNome: string | null;
  locationId: string | null;
  locationNome: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export function FuncionariosTable() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<string | null>(null);

  const paginated = employees.slice(
    (currentPage - 1) * TABLE_PAGE_SIZE,
    currentPage * TABLE_PAGE_SIZE,
  );

  const { execute: fetchEmployees } = useAction(getEmployeesAction, {
    onSuccess: ({ data }) => {
      if (data?.success && data.data) {
        setEmployees(data.data);
      }
      setIsLoading(false);
    },
    onError: () => {
      toast.error("Erro ao carregar funcionários");
      setIsLoading(false);
    },
  });

  const { execute: deleteEmployee } = useAction(deleteEmployeeAction, {
    onSuccess: ({ data }) => {
      if (data?.success) {
        toast.success("Funcionário excluído com sucesso!");
        fetchEmployees({});
        setDeleteDialogOpen(false);
        setEmployeeToDelete(null);
      }
    },
    onError: () => {
      toast.error("Erro ao excluir funcionário");
    },
  });

  useEffect(() => {
    fetchEmployees({});
  }, [fetchEmployees]);

  useEffect(() => {
    setCurrentPage(1);
  }, [employees.length]);

  useEffect(() => {
    const handleEmployeeCreated = () => {
      fetchEmployees({});
    };

    window.addEventListener("employee-created", handleEmployeeCreated);
    return () => {
      window.removeEventListener("employee-created", handleEmployeeCreated);
    };
  }, [fetchEmployees]);

  const handleDeleteClick = (id: string) => {
    setEmployeeToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (employeeToDelete) {
      deleteEmployee({ id: employeeToDelete });
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setEditDialogOpen(true);
  };

  const handleEditDialogClose = (open: boolean) => {
    setEditDialogOpen(open);
    if (!open) setEditingEmployee(null);
  };

  if (isLoading) {
    return <div className="py-8 text-center">Carregando...</div>;
  }

  return (
    <div className="rounded-md border border-slate-200 dark:border-slate-700">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Cargo</TableHead>
            <TableHead>Horário</TableHead>
            <TableHead>Local</TableHead>
            <TableHead className="w-[100px] text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-muted-foreground py-8 text-center"
              >
                Nenhum funcionário cadastrado
              </TableCell>
            </TableRow>
          ) : (
            paginated.map((emp) => (
              <TableRow key={emp.id}>
                <TableCell className="font-medium">{emp.nome}</TableCell>
                <TableCell>{emp.jobNome ?? "—"}</TableCell>
                <TableCell>{emp.scheduleNome ?? "—"}</TableCell>
                <TableCell>{emp.locationNome ?? "—"}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(emp)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteClick(emp.id)}
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
        totalItems={employees.length}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        pageSize={TABLE_PAGE_SIZE}
      />

      <FuncionarioForm
        employee={editingEmployee}
        open={editDialogOpen}
        onOpenChange={handleEditDialogClose}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este funcionário? Esta ação não
              pode ser desfeita.
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
