import { z } from "zod";

export const createEmployeeSchema = z.object({
  nome: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  jobId: z.string().optional().nullable(),
  scheduleId: z.string().optional().nullable(),
  locationId: z.string().optional().nullable(),
});
