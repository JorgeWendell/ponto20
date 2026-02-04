"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { Plus } from "lucide-react";

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
import { createScheduleAction } from "@/actions/create-schedule";
import { updateScheduleAction } from "@/actions/update-schedule";

const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

const scheduleFormSchema = z.object({
  nome: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  entrada: z.string().regex(timeRegex, "Informe o horário (HH:mm)"),
  entradaAlmoco: z.string().regex(timeRegex, "Informe o horário (HH:mm)"),
  saidaAlmoco: z.string().regex(timeRegex, "Informe o horário (HH:mm)"),
  saida: z.string().regex(timeRegex, "Informe o horário (HH:mm)"),
});

type ScheduleFormValues = z.infer<typeof scheduleFormSchema>;

type Schedule = {
  id: string;
  nome: string;
  entrada: string;
  entradaAlmoco: string;
  saidaAlmoco: string;
  saida: string;
};

type ScheduleFormProps = {
  schedule?: Schedule | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
};

export function ScheduleForm({
  schedule,
  open: controlledOpen,
  onOpenChange,
  trigger,
}: ScheduleFormProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!schedule;
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      nome: "",
      entrada: "08:00",
      entradaAlmoco: "12:00",
      saidaAlmoco: "13:00",
      saida: "17:00",
    },
  });

  useEffect(() => {
    if (schedule && open) {
      form.reset({
        nome: schedule.nome,
        entrada: schedule.entrada.slice(0, 5),
        entradaAlmoco: schedule.entradaAlmoco.slice(0, 5),
        saidaAlmoco: schedule.saidaAlmoco.slice(0, 5),
        saida: schedule.saida.slice(0, 5),
      });
    } else if (!schedule && open) {
      form.reset({
        nome: "",
        entrada: "08:00",
        entradaAlmoco: "12:00",
        saidaAlmoco: "13:00",
        saida: "17:00",
      });
    }
  }, [schedule, open, form]);

  const { execute: createSchedule } = useAction(createScheduleAction, {
    onSuccess: ({ data }) => {
      if (data?.success) {
        toast.success("Horário cadastrado com sucesso!");
        form.reset();
        setOpen(false);
        window.dispatchEvent(new Event("schedule-created"));
      }
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "Erro ao cadastrar horário");
    },
    onExecute: () => setIsSubmitting(true),
    onSettled: () => setIsSubmitting(false),
  });

  const { execute: updateSchedule } = useAction(updateScheduleAction, {
    onSuccess: ({ data }) => {
      if (data?.success) {
        toast.success("Horário atualizado com sucesso!");
        form.reset();
        setOpen(false);
        window.dispatchEvent(new Event("schedule-created"));
      }
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "Erro ao atualizar horário");
    },
    onExecute: () => setIsSubmitting(true),
    onSettled: () => setIsSubmitting(false),
  });

  const onSubmit = (data: ScheduleFormValues) => {
    if (isEditMode && schedule) {
      updateSchedule({ id: schedule.id, ...data });
    } else {
      createSchedule(data);
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
          {isEditMode ? "Editar Horário" : "Cadastrar Horário"}
        </DialogTitle>
        <DialogDescription>
          {isEditMode
            ? "Altere os dados do horário"
            : "Preencha os dados para cadastrar um novo horário"}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="nome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome *</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Comercial 8h" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="entrada"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Entrada</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="entradaAlmoco"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Entrada almoço</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="saidaAlmoco"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Saída almoço</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="saida"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Saída</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
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
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          Cadastrar Horário
        </Button>
      </DialogTrigger>
      {dialogContent}
    </Dialog>
  );
}
