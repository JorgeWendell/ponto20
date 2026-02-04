"use server";

import { eq } from "drizzle-orm";

import { actionClient } from "@/lib/next-safe-action";
import { db } from "@/db/index";
import { schedulesTable } from "@/db/schema";

import { updateScheduleSchema } from "./schema";

export const updateScheduleAction = actionClient
  .schema(updateScheduleSchema)
  .action(async ({ parsedInput }) => {
    await db
      .update(schedulesTable)
      .set({
        nome: parsedInput.nome,
        entrada: parsedInput.entrada,
        entradaAlmoco: parsedInput.entradaAlmoco,
        saidaAlmoco: parsedInput.saidaAlmoco,
        saida: parsedInput.saida,
        updatedAt: new Date(),
      })
      .where(eq(schedulesTable.id, parsedInput.id));

    return { success: true };
  });
