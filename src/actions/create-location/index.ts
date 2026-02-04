"use server";

import { nanoid } from "nanoid";

import { actionClient } from "@/lib/next-safe-action";
import { db } from "@/db/index";
import { locationsTable } from "@/db/schema";

import { createLocationSchema } from "./schema";

export const createLocationAction = actionClient
  .schema(createLocationSchema)
  .action(async ({ parsedInput }) => {
    const id = nanoid();
    const now = new Date();

    await db.insert(locationsTable).values({
      id,
      nome: parsedInput.nome,
      endereco: parsedInput.endereco || null,
      numero: parsedInput.numero || null,
      bairro: parsedInput.bairro || null,
      cidade: parsedInput.cidade || null,
      cep: parsedInput.cep || null,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, id };
  });
