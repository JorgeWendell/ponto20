"use server";

import { desc } from "drizzle-orm";

import { actionClient } from "@/lib/next-safe-action";
import { db } from "@/db/index";
import { schedulesTable } from "@/db/schema";

import { getSchedulesSchema } from "./schema";

export const getSchedulesAction = actionClient
  .schema(getSchedulesSchema)
  .action(async () => {
    const schedules = await db
      .select()
      .from(schedulesTable)
      .orderBy(desc(schedulesTable.createdAt));

    return { success: true, data: schedules };
  });
