"use server";

import { nanoid } from "nanoid";

import { actionClient } from "@/lib/next-safe-action";
import { db } from "@/db/index";
import { marcacoesPontoTable } from "@/db/schema";

import { registerPontoSchema } from "./schema";

export const registerPontoAction = actionClient
  .schema(registerPontoSchema)
  .action(async ({ parsedInput }) => {
    const now = new Date();
    const id = nanoid();

    await db.insert(marcacoesPontoTable).values({
      id,
      employeeId: parsedInput.employeeId,
      tipo: parsedInput.tipo,
      dataHora: now,
      descricaoLocal: parsedInput.descricaoLocal ?? null,
      terminal: parsedInput.terminal ?? null,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, id };
  });
