import { z } from "zod";

const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

export const createScheduleSchema = z.object({
  nome: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  entrada: z.string().regex(timeRegex, "Formato inválido (HH:mm)"),
  entradaAlmoco: z.string().regex(timeRegex, "Formato inválido (HH:mm)"),
  saidaAlmoco: z.string().regex(timeRegex, "Formato inválido (HH:mm)"),
  saida: z.string().regex(timeRegex, "Formato inválido (HH:mm)"),
});
