import { z } from "zod";

export const recognizeFaceSchema = z.object({
  imageBase64: z.string().min(1, "Imagem é obrigatória"),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  dispositivoInfo: z.string().optional(),
});
