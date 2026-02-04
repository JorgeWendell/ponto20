"use server";

import { eq } from "drizzle-orm";

import { actionClient } from "@/lib/next-safe-action";
import { db } from "@/db/index";
import { schedulesTable } from "@/db/schema";

import { deleteScheduleSchema } from "./schema";

export const deleteScheduleAction = actionClient
  .schema(deleteScheduleSchema)
  .action(async ({ parsedInput }) => {
    await db
      .delete(schedulesTable)
      .where(eq(schedulesTable.id, parsedInput.id));

    return { success: true };
  });
