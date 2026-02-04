import { z } from "zod";

export const updateJobSchema = z.object({
  id: z.string().min(1, "ID é obrigatório"),
  nome: z.string().min(3, "O nome do cargo deve ter pelo menos 3 caracteres"),
});
