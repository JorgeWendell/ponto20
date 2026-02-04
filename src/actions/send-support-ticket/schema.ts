import { z } from "zod";

export const sendSupportTicketSchema = z.object({
  userId: z.string().min(1, "ID do usuário é obrigatório"),
  userName: z.string().min(1, "Nome do usuário é obrigatório"),
  userEmail: z.string().email("Email inválido"),
  titulo: z.string().min(3, "O título deve ter pelo menos 3 caracteres"),
  descricao: z
    .string()
    .min(10, "A descrição deve ter pelo menos 10 caracteres"),
});
