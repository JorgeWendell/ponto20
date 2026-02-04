import { z } from "zod";

export const getSupportTicketsSchema = z.object({
  userId: z.string().min(1, "ID do usuário é obrigatório"),
});
