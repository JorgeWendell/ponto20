"use server";

import { desc, eq } from "drizzle-orm";

import { actionClient } from "@/lib/next-safe-action";
import { db } from "@/db/index";
import { supportTicketsTable } from "@/db/schema";

import { getSupportTicketsSchema } from "./schema";

export const getSupportTicketsAction = actionClient
  .schema(getSupportTicketsSchema)
  .action(async ({ parsedInput }) => {
    const tickets = await db
      .select({
        id: supportTicketsTable.id,
        titulo: supportTicketsTable.titulo,
        descricao: supportTicketsTable.descricao,
        status: supportTicketsTable.status,
        createdAt: supportTicketsTable.createdAt,
      })
      .from(supportTicketsTable)
      .where(eq(supportTicketsTable.userId, parsedInput.userId))
      .orderBy(desc(supportTicketsTable.createdAt));

    return { success: true, data: tickets };
  });
