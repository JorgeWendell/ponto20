import { z } from "zod";

export const createJobSchema = z.object({
  nome: z.string().min(3, "O nome do cargo deve ter pelo menos 3 caracteres"),
});
