import { z } from "zod";

export const updateEmployeeFacialSchema = z.object({
  employeeId: z.string().min(1, "ID do funcionário é obrigatório"),
  fotoFacialUrl: z
    .union([z.string().url("URL inválida"), z.literal("")])
    .transform((v) => (v === "" ? null : v)),
});
