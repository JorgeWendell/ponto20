"use server";

import { eq } from "drizzle-orm";

import { actionClient } from "@/lib/next-safe-action";
import { db } from "@/db/index";
import { employeesTable } from "@/db/schema";

import { updateEmployeeSchema } from "./schema";

export const updateEmployeeAction = actionClient
  .schema(updateEmployeeSchema)
  .action(async ({ parsedInput }) => {
    await db
      .update(employeesTable)
      .set({
        nome: parsedInput.nome,
        jobId: parsedInput.jobId || null,
        scheduleId: parsedInput.scheduleId || null,
        locationId: parsedInput.locationId || null,
        isActive: parsedInput.isActive,
        updatedAt: new Date(),
      })
      .where(eq(employeesTable.id, parsedInput.id));

    return { success: true };
  });
