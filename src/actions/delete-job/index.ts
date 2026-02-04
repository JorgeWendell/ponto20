"use server";

import { eq } from "drizzle-orm";

import { actionClient } from "@/lib/next-safe-action";
import { db } from "@/db/index";
import { jobTable } from "@/db/schema";

import { deleteJobSchema } from "./schema";

export const deleteJobAction = actionClient
  .schema(deleteJobSchema)
  .action(async ({ parsedInput }) => {
    await db.delete(jobTable).where(eq(jobTable.id, parsedInput.id));

    return { success: true };
  });
