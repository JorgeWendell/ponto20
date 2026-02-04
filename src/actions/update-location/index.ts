"use server";

import { eq } from "drizzle-orm";

import { actionClient } from "@/lib/next-safe-action";
import { db } from "@/db/index";
import { locationsTable } from "@/db/schema";

import { updateLocationSchema } from "./schema";

export const updateLocationAction = actionClient
  .schema(updateLocationSchema)
  .action(async ({ parsedInput }) => {
    await db
      .update(locationsTable)
      .set({
        nome: parsedInput.nome,
        endereco: parsedInput.endereco || null,
        numero: parsedInput.numero || null,
        bairro: parsedInput.bairro || null,
        cidade: parsedInput.cidade || null,
        cep: parsedInput.cep || null,
        updatedAt: new Date(),
      })
      .where(eq(locationsTable.id, parsedInput.id));

    return { success: true };
  });
