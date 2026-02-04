import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  isActive: z.boolean().default(true),
  jobId: z.string().min(1, "O cargo é obrigatório"),
});
