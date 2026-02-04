import { z } from "zod";

export const deleteJobSchema = z.object({
  id: z.string().min(1, "ID é obrigatório"),
});
