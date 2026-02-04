"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
import { createEmployeeAction } from "@/actions/create-employee";
import { updateEmployeeAction } from "@/actions/update-employee";
import { getJobsAction } from "@/actions/get-jobs";
import { getSchedulesAction } from "@/actions/get-schedules";
import { getLocationsAction } from "@/actions/get-locations";

const funcionarioFormSchema = z.object({
  nome: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  jobId: z.string().optional().nullable(),
  scheduleId: z.string().optional().nullable(),
  locationId: z.string().optional().nullable(),
  isActive: z.boolean(),
});

type FuncionarioFormValues = z.infer<typeof funcionarioFormSchema>;

type Job = {
  id: string;
  nome: string;
};

type Schedule = {
  id: string;
  nome: string;
  entrada: string;
  saida: string;
};

type Location = {
  id: string;
  nome: string;
};

type Employee = {
  id: string;
  nome: string;
  jobId: string | null;
  scheduleId: string | null;
  locationId: string | null;
  isActive: boolean;
};

type FuncionarioFormProps = {
  employee?: Employee | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
};

export function FuncionarioForm({
  employee,
  open: controlledOpen,
  onOpenChange,
  trigger,
}: FuncionarioFormProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const isEditMode = !!employee;
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  const form = useForm<FuncionarioFormValues>({
    resolver: zodResolver(funcionarioFormSchema),
    defaultValues: {
      nome: "",
      jobId: null,
      scheduleId: null,
      locationId: null,
      isActive: true,
    },
  });

  const { execute: fetchJobs } = useAction(getJobsAction, {
    onSuccess: ({ data }) => {
      if (data?.success && data.data) {
        setJobs(data.data);
      }
    },
  });

  const { execute: fetchSchedules } = useAction(getSchedulesAction, {
    onSuccess: ({ data }) => {
      if (data?.success && data.data) {
        setSchedules(
          data.data.map((s) => ({
            id: s.id,
            nome: s.nome,
            entrada: s.entrada.slice(0, 5),
            saida: s.saida.slice(0, 5),
          })),
        );
      }
    },
  });

  useEffect(() => {
    fetchJobs({});
  }, [fetchJobs]);

  const { execute: fetchLocations } = useAction(getLocationsAction, {
    onSuccess: ({ data }) => {
      if (data?.success && data.data) {
        setLocations(data.data);
      }
    },
  });

  useEffect(() => {
    fetchSchedules({});
  }, [fetchSchedules]);

  useEffect(() => {
    fetchLocations({});
  }, [fetchLocations]);

  useEffect(() => {
    if (employee && open) {
      form.reset({
        nome: employee.nome,
        jobId: employee.jobId ?? null,
        scheduleId: employee.scheduleId ?? null,
        locationId: employee.locationId ?? null,
        isActive: employee.isActive,
      });
    } else if (!employee && open) {
      form.reset({
        nome: "",
        jobId: null,
        scheduleId: null,
        locationId: null,
        isActive: true,
      });
    }
  }, [employee, open, form]);

  const { execute: createEmployee } = useAction(createEmployeeAction, {
    onSuccess: ({ data }) => {
      if (data?.success) {
        toast.success("Funcionário cadastrado com sucesso!");
        form.reset();
        setOpen(false);
        window.dispatchEvent(new Event("employee-created"));
      }
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "Erro ao cadastrar funcionário");
    },
    onExecute: () => setIsSubmitting(true),
    onSettled: () => setIsSubmitting(false),
  });

  const { execute: updateEmployee } = useAction(updateEmployeeAction, {
    onSuccess: ({ data }) => {
      if (data?.success) {
        toast.success("Funcionário atualizado com sucesso!");
        form.reset();
        setOpen(false);
        window.dispatchEvent(new Event("employee-created"));
      }
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "Erro ao atualizar funcionário");
    },
    onExecute: () => setIsSubmitting(true),
    onSettled: () => setIsSubmitting(false),
  });

  const onSubmit = (data: FuncionarioFormValues) => {
    const payload = {
      ...data,
      jobId: data.jobId || null,
      scheduleId: data.scheduleId || null,
      locationId: data.locationId || null,
    };
    if (isEditMode && employee) {
      updateEmployee({
        id: employee.id,
        ...payload,
        isActive: data.isActive,
      });
    } else {
      createEmployee(payload);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) form.reset();
  };

  const dialogContent = (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>
          {isEditMode ? "Editar Funcionário" : "Cadastrar Funcionário"}
        </DialogTitle>
        <DialogDescription>
          {isEditMode
            ? "Altere os dados do funcionário"
            : "Preencha os dados para cadastrar um novo funcionário"}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="nome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl>
                  <Input placeholder="Nome completo" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="jobId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cargo</FormLabel>
                <FormControl>
                  <select
                    className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-slate-500 focus-visible:ring-1 focus-visible:ring-slate-950 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300"
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value || null)}
                  >
                    <option value="">Sem cargo</option>
                    {jobs.map((job) => (
                      <option key={job.id} value={job.id}>
                        {job.nome}
                      </option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="scheduleId"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Horário</FormLabel>
                <FormControl>
                  <select
                    className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-slate-500 focus-visible:ring-1 focus-visible:ring-slate-950 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300"
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value || null)}
                  >
                    <option value="">Sem horário</option>
                    {schedules.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nome}
                      </option>
                    ))}
                  </select>
                </FormControl>
                <p className="text-muted-foreground text-xs">
                  {field.value
                    ? (() => {
                        const s = schedules.find((x) => x.id === field.value);
                        return s ? `${s.entrada} - ${s.saida}` : "";
                      })()
                    : "Selecione um horário para ver o período"}
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="locationId"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Local</FormLabel>
                <FormControl>
                  <select
                    className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-slate-500 focus-visible:ring-1 focus-visible:ring-slate-950 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300"
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value || null)}
                  >
                    <option value="">Sem local</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.nome}
                      </option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {isEditMode && (
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="font-normal">Ativo</FormLabel>
                </FormItem>
              )}
            />
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? isEditMode
                  ? "Atualizando..."
                  : "Cadastrando..."
                : isEditMode
                  ? "Atualizar"
                  : "Cadastrar"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );

  if (trigger) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        {dialogContent}
      </Dialog>
    );
  }

  if (controlledOpen !== undefined) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        {dialogContent}
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>Cadastrar Funcionário</Button>
      </DialogTrigger>
      {dialogContent}
    </Dialog>
  );
}
