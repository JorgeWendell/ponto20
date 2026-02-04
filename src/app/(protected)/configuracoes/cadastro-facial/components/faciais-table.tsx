"use client";

import { useState, useEffect } from "react";
import { MoreHorizontal, Pencil, Trash2, ImageIcon } from "lucide-react";
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
import { updateEmployeeFacialAction } from "@/actions/update-employee-facial";
import { FacialForm } from "./facial-form";

type Employee = {
  id: string;
  nome: string;
  jobNome: string | null;
  fotoFacialUrl: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export function FaciaisTable() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [employeeToRemove, setEmployeeToRemove] = useState<Employee | null>(
    null,
  );

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
      toast.error("Erro ao carregar dados");
      setIsLoading(false);
    },
  });

  const { execute: removeFacial } = useAction(updateEmployeeFacialAction, {
    onSuccess: ({ data }) => {
      if (data?.success) {
        toast.success("Foto facial removida.");
        fetchEmployees({});
        setRemoveDialogOpen(false);
        setEmployeeToRemove(null);
      }
    },
    onError: () => {
      toast.error("Erro ao remover foto facial");
    },
  });

  useEffect(() => {
    fetchEmployees({});
  }, [fetchEmployees]);

  useEffect(() => {
    setCurrentPage(1);
  }, [employees.length]);

  useEffect(() => {
    const handler = () => fetchEmployees({});
    window.addEventListener("facial-updated", handler);
    return () => window.removeEventListener("facial-updated", handler);
  }, [fetchEmployees]);

  const handleRemoveClick = (emp: Employee) => {
    setEmployeeToRemove(emp);
    setRemoveDialogOpen(true);
  };

  const handleRemoveConfirm = () => {
    if (employeeToRemove) {
      removeFacial({ employeeId: employeeToRemove.id, fotoFacialUrl: "" });
    }
  };

  const handleEdit = (emp: Employee) => {
    setEditingEmployee(emp);
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
            <TableHead>Foto</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Cargo</TableHead>
            <TableHead>Status</TableHead>
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
                <TableCell>
                  {emp.fotoFacialUrl ? (
                    <div className="relative h-10 w-10 overflow-hidden rounded-full border border-slate-200 dark:border-slate-700">
                      <img
                        src={emp.fotoFacialUrl}
                        alt={emp.nome}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </div>
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                      <ImageIcon className="h-5 w-5 text-slate-400" />
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{emp.nome}</TableCell>
                <TableCell>{emp.jobNome ?? "—"}</TableCell>
                <TableCell>
                  {emp.fotoFacialUrl ? (
                    <span className="text-green-600 dark:text-green-400">
                      Com facial
                    </span>
                  ) : (
                    <span className="text-slate-500 dark:text-slate-400">
                      Sem facial
                    </span>
                  )}
                </TableCell>
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
                        Editar facial
                      </DropdownMenuItem>
                      {emp.fotoFacialUrl && (
                        <DropdownMenuItem
                          onClick={() => handleRemoveClick(emp)}
                          className="text-red-600 dark:text-red-400"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remover facial
                        </DropdownMenuItem>
                      )}
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

      <FacialForm
        employee={editingEmployee}
        open={editDialogOpen}
        onOpenChange={handleEditDialogClose}
      />

      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover foto facial</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover a foto facial de{" "}
              {employeeToRemove?.nome}? O funcionário não poderá ser reconhecido
              pelo ponto até cadastrar uma nova foto.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveConfirm}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
