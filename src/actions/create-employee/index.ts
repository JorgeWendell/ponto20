"use server";

import { nanoid } from "nanoid";

import { actionClient } from "@/lib/next-safe-action";
import { db } from "@/db/index";
import { employeesTable } from "@/db/schema";

import { createEmployeeSchema } from "./schema";

export const createEmployeeAction = actionClient
  .schema(createEmployeeSchema)
  .action(async ({ parsedInput }) => {
    const id = nanoid();
    const now = new Date();

    await db.insert(employeesTable).values({
      id,
      nome: parsedInput.nome,
      jobId: parsedInput.jobId || null,
      scheduleId: parsedInput.scheduleId || null,
      locationId: parsedInput.locationId || null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, id };
  });
