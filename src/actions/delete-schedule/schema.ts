import { z } from "zod";

export const deleteScheduleSchema = z.object({
  id: z.string().min(1, "ID é obrigatório"),
});
