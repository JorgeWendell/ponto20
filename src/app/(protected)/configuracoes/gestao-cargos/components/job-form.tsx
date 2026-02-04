"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { createJobAction } from "@/actions/create-job";
import { updateJobAction } from "@/actions/update-job";

const jobFormSchema = z.object({
  nome: z.string().min(3, "O nome do cargo deve ter pelo menos 3 caracteres"),
});

type JobFormValues = z.infer<typeof jobFormSchema>;

type Job = {
  id: string;
  nome: string;
};

type JobFormProps = {
  job?: Job | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
};

export function JobForm({
  job,
  open: controlledOpen,
  onOpenChange,
  trigger,
}: JobFormProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!job;
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      nome: "",
    },
  });

  useEffect(() => {
    if (job && open) {
      form.reset({
        nome: job.nome,
      });
    } else if (!job && open) {
      form.reset({
        nome: "",
      });
    }
  }, [job, open, form]);

  const { execute: createJob } = useAction(createJobAction, {
    onSuccess: ({ data }) => {
      if (data?.success) {
        toast.success("Cargo cadastrado com sucesso!");
        form.reset();
        setOpen(false);
        window.dispatchEvent(new Event("job-created"));
      }
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "Erro ao cadastrar cargo");
    },
    onExecute: () => {
      setIsSubmitting(true);
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const { execute: updateJob } = useAction(updateJobAction, {
    onSuccess: ({ data }) => {
      if (data?.success) {
        toast.success("Cargo atualizado com sucesso!");
        form.reset();
        setOpen(false);
        window.dispatchEvent(new Event("job-created"));
      }
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "Erro ao atualizar cargo");
    },
    onExecute: () => {
      setIsSubmitting(true);
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const onSubmit = (data: JobFormValues) => {
    if (isEditMode && job) {
      updateJob({ id: job.id, nome: data.nome });
    } else {
      createJob(data);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      form.reset();
    }
  };

  const dialogContent = (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>
          {isEditMode ? "Editar Cargo" : "Cadastrar Cargo"}
        </DialogTitle>
        <DialogDescription>
          {isEditMode
            ? "Altere os dados do cargo"
            : "Preencha os dados para cadastrar um novo cargo"}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="nome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Cargo</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Gerente de Produção" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
        <Button>Cadastrar Cargo</Button>
      </DialogTrigger>
      {dialogContent}
    </Dialog>
  );
}
