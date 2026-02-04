"use server";

import { eq } from "drizzle-orm";

import { actionClient } from "@/lib/next-safe-action";
import { db } from "@/db/index";
import { jobTable } from "@/db/schema";

import { updateJobSchema } from "./schema";

export const updateJobAction = actionClient
  .schema(updateJobSchema)
  .action(async ({ parsedInput }) => {
    await db
      .update(jobTable)
      .set({
        nome: parsedInput.nome,
        updatedAt: new Date(),
      })
      .where(eq(jobTable.id, parsedInput.id));

    return { success: true };
  });
