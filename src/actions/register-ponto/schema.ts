import { z } from "zod";

const tipoMarcacao = z.enum([
  "ENTRADA",
  "SAIDA",
  "ENTRADA_ALMOCO",
  "VOLTA_ALMOCO",
]);

export const registerPontoSchema = z.object({
  employeeId: z.string().min(1, "Colaborador é obrigatório"),
  tipo: tipoMarcacao,
  descricaoLocal: z.string().optional(),
  terminal: z.string().optional(),
});
