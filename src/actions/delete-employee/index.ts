"use server";

import { eq } from "drizzle-orm";

import { actionClient } from "@/lib/next-safe-action";
import { db } from "@/db/index";
import { employeesTable } from "@/db/schema";

import { deleteEmployeeSchema } from "./schema";

export const deleteEmployeeAction = actionClient
  .schema(deleteEmployeeSchema)
  .action(async ({ parsedInput }) => {
    await db.delete(employeesTable).where(eq(employeesTable.id, parsedInput.id));

    return { success: true };
  });
