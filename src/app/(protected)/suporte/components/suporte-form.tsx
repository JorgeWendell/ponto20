"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { sendSupportTicketAction } from "@/actions/send-support-ticket";

const suporteFormSchema = z.object({
  userName: z.string().min(1, "Nome do usuário é obrigatório"),
  userEmail: z.string().email("Email inválido"),
  titulo: z.string().min(3, "O título deve ter pelo menos 3 caracteres"),
  descricao: z
    .string()
    .min(10, "A descrição deve ter pelo menos 10 caracteres"),
});

type SuporteFormValues = z.infer<typeof suporteFormSchema>;

type SuporteFormProps = {
  userId: string;
  userName: string;
  userEmail: string;
  onSuccess?: () => void;
};

export function SuporteForm({
  userId,
  userName,
  userEmail,
  onSuccess,
}: SuporteFormProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SuporteFormValues>({
    resolver: zodResolver(suporteFormSchema),
    defaultValues: {
      userName,
      userEmail,
      titulo: "",
      descricao: "",
    },
  });

  const { execute: sendTicket } = useAction(sendSupportTicketAction, {
    onSuccess: ({ data }) => {
      if (data?.success) {
        toast.success("Chamado enviado! Responderemos em breve.");
        form.reset({ userName, userEmail, titulo: "", descricao: "" });
        setOpen(false);
        onSuccess?.();
      }
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "Erro ao enviar chamado");
    },
    onExecute: () => setIsSubmitting(true),
    onSettled: () => setIsSubmitting(false),
  });

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      form.reset({ userName, userEmail, titulo: "", descricao: "" });
    }
  };

  const onSubmit = (data: SuporteFormValues) => {
    sendTicket({
      userId,
      userName,
      userEmail,
      titulo: data.titulo,
      descricao: data.descricao,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>Abrir chamado</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Abrir chamado</DialogTitle>
          <DialogDescription>
            Descreva o problema ou dúvida. O suporte receberá um e-mail e
            responderá em breve.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="userName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Usuário</FormLabel>
                  <FormControl>
                    <Input {...field} disabled />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="userEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} disabled />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="titulo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Erro ao gerar relatório"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva o problema ou dúvida com o máximo de detalhes possível..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
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
                {isSubmitting ? "Enviando..." : "Enviar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
