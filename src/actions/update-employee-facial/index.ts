"use server";

import { eq } from "drizzle-orm";

import { actionClient } from "@/lib/next-safe-action";
import { db } from "@/db/index";
import { employeesTable } from "@/db/schema";

import { updateEmployeeFacialSchema } from "./schema";

export const updateEmployeeFacialAction = actionClient
  .schema(updateEmployeeFacialSchema)
  .action(async ({ parsedInput }) => {
    await db
      .update(employeesTable)
      .set({
        fotoFacialUrl: parsedInput.fotoFacialUrl,
        updatedAt: new Date(),
      })
      .where(eq(employeesTable.id, parsedInput.employeeId));

    return { success: true };
  });
