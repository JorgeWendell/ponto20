"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { Camera } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CameraCaptureDialog } from "./camera-capture-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateEmployeeFacialAction } from "@/actions/update-employee-facial";
import { getEmployeesAction } from "@/actions/get-employees";

const facialFormSchema = z.object({
  employeeId: z.string().min(1, "Selecione o funcionário"),
  fotoFacialUrl: z.string().min(1, "Informe a URL da foto").url("URL inválida"),
});

type FacialFormValues = z.infer<typeof facialFormSchema>;

type Employee = {
  id: string;
  nome: string;
  jobNome: string | null;
  fotoFacialUrl: string | null;
  isActive: boolean;
};

type FacialFormProps = {
  employee?: Employee | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
};

export function FacialForm({
  employee,
  open: controlledOpen,
  onOpenChange,
  trigger,
}: FacialFormProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [cameraDialogOpen, setCameraDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const isEditMode = !!employee;
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  const form = useForm<FacialFormValues>({
    resolver: zodResolver(facialFormSchema),
    defaultValues: {
      employeeId: "",
      fotoFacialUrl: "",
    },
  });

  const { execute: fetchEmployees } = useAction(getEmployeesAction, {
    onSuccess: ({ data }) => {
      if (data?.success && data.data) {
        setEmployees(
          data.data
            .filter((e) => e.isActive)
            .sort((a, b) => a.nome.localeCompare(b.nome)),
        );
      }
    },
  });

  useEffect(() => {
    if (open) {
      fetchEmployees({});
    }
  }, [open, fetchEmployees]);

  useEffect(() => {
    if (employee && open) {
      form.reset({
        employeeId: employee.id,
        fotoFacialUrl: employee.fotoFacialUrl ?? "",
      });
    } else if (!employee && open) {
      form.reset({
        employeeId: "",
        fotoFacialUrl: "",
      });
    }
  }, [employee, open, form]);

  const { execute: updateFacial } = useAction(updateEmployeeFacialAction, {
    onSuccess: ({ data }) => {
      if (data?.success) {
        toast.success(
          isEditMode ? "Foto facial atualizada!" : "Foto facial cadastrada!",
        );
        form.reset();
        setOpen(false);
        window.dispatchEvent(new Event("facial-updated"));
      }
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "Erro ao salvar foto facial");
    },
    onExecute: () => setIsSubmitting(true),
    onSettled: () => setIsSubmitting(false),
  });

  const onSubmit = (data: FacialFormValues) => {
    updateFacial({
      employeeId: data.employeeId,
      fotoFacialUrl: data.fotoFacialUrl,
    });
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) form.reset();
  };

  const showTrigger = controlledOpen === undefined;

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        {showTrigger && (
          <DialogTrigger asChild>
            {trigger ?? <Button>Cadastrar facial</Button>}
          </DialogTrigger>
        )}
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "Editar Foto Facial" : "Cadastrar Foto Facial"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? "Altere a URL da foto facial do funcionário"
                : "Selecione o funcionário e informe a URL da foto facial"}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="employeeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Funcionário</FormLabel>
                    <Select
                      value={field.value || undefined}
                      onValueChange={field.onChange}
                      disabled={isEditMode}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o funcionário..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="z-[100]" position="popper">
                        {employees.length === 0 ? (
                          <div className="py-4 text-center text-sm text-slate-500">
                            Carregando...
                          </div>
                        ) : (
                          employees.map((emp) => (
                            <SelectItem key={emp.id} value={emp.id}>
                              {emp.nome}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fotoFacialUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL da foto facial</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input
                          type="url"
                          placeholder="https://... ou use a câmera"
                          className="flex-1"
                          {...field}
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        title="Coletar pela câmera"
                        onClick={() => setCameraDialogOpen(true)}
                        className="shrink-0"
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
        {/* Renderizar CameraCaptureDialog fora do Dialog principal para evitar problemas de contexto */}
      </Dialog>
      {/* CameraCaptureDialog renderizado fora do Dialog principal */}
      <CameraCaptureDialog
        open={cameraDialogOpen}
        onOpenChange={setCameraDialogOpen}
        onCapture={(url) => {
          form.setValue("fotoFacialUrl", url);
          setCameraDialogOpen(false);
        }}
      />
    </>
  );
}
