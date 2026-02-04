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
import { createLocationAction } from "@/actions/create-location";
import { updateLocationAction } from "@/actions/update-location";

const locationFormSchema = z.object({
  nome: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  endereco: z.string().optional(),
  numero: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  cep: z.string().optional(),
});

type LocationFormValues = z.infer<typeof locationFormSchema>;

type Location = {
  id: string;
  nome: string;
  endereco: string | null;
  numero: string | null;
  bairro: string | null;
  cidade: string | null;
  cep: string | null;
};

const maskCep = (value: string) => {
  const numbers = value.replace(/\D/g, "");
  return numbers.replace(/(\d{5})(\d{0,3})/, "$1-$2").replace(/-$/, "");
};

const fetchCep = async (cep: string) => {
  const cleanCep = cep.replace(/\D/g, "");
  if (cleanCep.length !== 8) return null;
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    const data = await response.json();
    if (data.erro) return null;
    return {
      endereco: data.logradouro || "",
      bairro: data.bairro || "",
      cidade: data.localidade || "",
    };
  } catch {
    return null;
  }
};

type LocationFormProps = {
  location?: Location | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
};

export function LocationForm({
  location,
  open: controlledOpen,
  onOpenChange,
  trigger,
}: LocationFormProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const isEditMode = !!location;
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  const form = useForm<LocationFormValues>({
    resolver: zodResolver(locationFormSchema),
    defaultValues: {
      nome: "",
      endereco: "",
      numero: "",
      bairro: "",
      cidade: "",
      cep: "",
    },
  });

  useEffect(() => {
    if (location && open) {
      form.reset({
        nome: location.nome,
        endereco: location.endereco || "",
        numero: location.numero || "",
        bairro: location.bairro || "",
        cidade: location.cidade || "",
        cep: location.cep || "",
      });
    } else if (!location && open) {
      form.reset({
        nome: "",
        endereco: "",
        numero: "",
        bairro: "",
        cidade: "",
        cep: "",
      });
    }
  }, [location, open, form]);

  const { execute: createLocation } = useAction(createLocationAction, {
    onSuccess: ({ data }) => {
      if (data?.success) {
        toast.success("Local cadastrado com sucesso!");
        form.reset();
        setOpen(false);
        window.dispatchEvent(new Event("location-created"));
      }
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "Erro ao cadastrar local");
    },
    onExecute: () => setIsSubmitting(true),
    onSettled: () => setIsSubmitting(false),
  });

  const { execute: updateLocation } = useAction(updateLocationAction, {
    onSuccess: ({ data }) => {
      if (data?.success) {
        toast.success("Local atualizado com sucesso!");
        form.reset();
        setOpen(false);
        window.dispatchEvent(new Event("location-created"));
      }
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "Erro ao atualizar local");
    },
    onExecute: () => setIsSubmitting(true),
    onSettled: () => setIsSubmitting(false),
  });

  const onSubmit = (data: LocationFormValues) => {
    if (isEditMode && location) {
      updateLocation({ id: location.id, ...data });
    } else {
      createLocation(data);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) form.reset();
  };

  const handleCepBlur = async () => {
    const cepValue = form.getValues("cep")?.replace(/\D/g, "") || "";
    if (cepValue.length !== 8) return;
    setIsLoadingCep(true);
    const cepData = await fetchCep(cepValue);
    if (cepData) {
      form.setValue("endereco", cepData.endereco);
      form.setValue("bairro", cepData.bairro);
      form.setValue("cidade", cepData.cidade);
      toast.success("CEP encontrado!");
    } else {
      toast.error("CEP não encontrado");
    }
    setIsLoadingCep(false);
  };

  const dialogContent = (
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle>
          {isEditMode ? "Editar Local" : "Cadastrar Local"}
        </DialogTitle>
        <DialogDescription>
          {isEditMode
            ? "Altere os dados do local"
            : "Preencha os dados para cadastrar um novo local"}
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
                  <Input placeholder="Ex: Filial Centro" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-[1fr_120px] gap-4">
            <FormField
              control={form.control}
              name="endereco"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Rua das Flores" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="numero"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: 123" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="bairro"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bairro</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Centro" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cidade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cidade</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: São Paulo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="cep"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CEP {isLoadingCep && "(Buscando...)"}</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: 12345-678"
                    value={field.value || ""}
                    onChange={(e) => {
                      field.onChange(maskCep(e.target.value));
                    }}
                    onBlur={handleCepBlur}
                    disabled={isLoadingCep}
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
          Cadastrar Local
        </Button>
      </DialogTrigger>
      {dialogContent}
    </Dialog>
  );
}
