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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Plus } from "lucide-react";
import { createUserAction } from "@/actions/create-user";
import { updateUserAction } from "@/actions/update-user";
import { getJobsAction } from "@/actions/get-jobs";

const userFormSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  isActive: z.boolean(),
  jobId: z.string().min(1, "O cargo é obrigatório"),
});

type UserFormValues = z.infer<typeof userFormSchema>;

type User = {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  jobId?: string | null;
};

type Job = {
  id: string;
  nome: string;
};

type UserFormProps = {
  user?: User | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
};

export function UserForm({
  user,
  open: controlledOpen,
  onOpenChange,
  trigger,
}: UserFormProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const isEditMode = !!user;
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: "",
      email: "",
      isActive: true,
      jobId: "",
    },
  });

  const { execute: fetchJobs } = useAction(getJobsAction, {
    onSuccess: ({ data }) => {
      if (data?.success && data.data) {
        setJobs(data.data);
      }
    },
    onError: () => {
      toast.error("Erro ao carregar cargos");
    },
  });

  useEffect(() => {
    if (open) {
      fetchJobs({});
    }
  }, [open, fetchJobs]);

  useEffect(() => {
    if (user && open) {
      form.reset({
        name: user.name,
        email: user.email,
        isActive: user.isActive,
        jobId: user.jobId || "",
      });
    } else if (!user && open) {
      form.reset({
        name: "",
        email: "",
        isActive: true,
        jobId: "",
      });
    }
  }, [user, open, form]);

  const { execute: createUser } = useAction(createUserAction, {
    onSuccess: ({ data }) => {
      if (data?.success) {
        toast.success("Usuário cadastrado com sucesso!");
        form.reset();
        setOpen(false);
        window.dispatchEvent(new Event("user-created"));
      }
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "Erro ao cadastrar usuário");
    },
    onExecute: () => setIsSubmitting(true),
    onSettled: () => setIsSubmitting(false),
  });

  const { execute: updateUser } = useAction(updateUserAction, {
    onSuccess: ({ data }) => {
      if (data?.success) {
        toast.success("Usuário atualizado com sucesso!");
        form.reset();
        setOpen(false);
        window.dispatchEvent(new Event("user-created"));
      }
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "Erro ao atualizar usuário");
    },
    onExecute: () => setIsSubmitting(true),
    onSettled: () => setIsSubmitting(false),
  });

  const onSubmit = (data: UserFormValues) => {
    if (isEditMode && user) {
      updateUser({ id: user.id, ...data });
    } else {
      createUser(data);
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
          {isEditMode ? "Editar Usuário" : "Cadastrar Usuário"}
        </DialogTitle>
        <DialogDescription>
          {isEditMode
            ? "Altere os dados do usuário"
            : "Preencha os dados para cadastrar um novo usuário"}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: João Silva" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="Ex: joao@example.com"
                    {...field}
                  />
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
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione um cargo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {jobs.map((job) => (
                      <SelectItem key={job.id} value={job.id}>
                        {job.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-y-0 space-x-3 rounded-md border border-slate-200 p-4 dark:border-slate-700">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="font-normal">Usuário Ativo</FormLabel>
                </div>
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
          Cadastrar Usuário
        </Button>
      </DialogTrigger>
      {dialogContent}
    </Dialog>
  );
}
