import { z } from "zod";

export const updateEmployeeSchema = z.object({
  id: z.string().min(1, "ID é obrigatório"),
  nome: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  jobId: z.string().optional().nullable(),
  scheduleId: z.string().optional().nullable(),
  locationId: z.string().optional().nullable(),
  isActive: z.boolean(),
});
