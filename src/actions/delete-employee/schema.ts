import { z } from "zod";

export const deleteEmployeeSchema = z.object({
  id: z.string().min(1, "ID é obrigatório"),
});
