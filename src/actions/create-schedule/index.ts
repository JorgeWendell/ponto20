"use server";

import { nanoid } from "nanoid";

import { actionClient } from "@/lib/next-safe-action";
import { db } from "@/db/index";
import { schedulesTable } from "@/db/schema";

import { createScheduleSchema } from "./schema";

export const createScheduleAction = actionClient
  .schema(createScheduleSchema)
  .action(async ({ parsedInput }) => {
    const id = nanoid();
    const now = new Date();

    await db.insert(schedulesTable).values({
      id,
      nome: parsedInput.nome,
      entrada: parsedInput.entrada,
      entradaAlmoco: parsedInput.entradaAlmoco,
      saidaAlmoco: parsedInput.saidaAlmoco,
      saida: parsedInput.saida,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, id };
  });
