"use server";

import { desc } from "drizzle-orm";

import { actionClient } from "@/lib/next-safe-action";
import { db } from "@/db/index";
import { locationsTable } from "@/db/schema";

import { getLocationsSchema } from "./schema";

export const getLocationsAction = actionClient
  .schema(getLocationsSchema)
  .action(async () => {
    const locations = await db
      .select()
      .from(locationsTable)
      .orderBy(desc(locationsTable.createdAt));

    return { success: true, data: locations };
  });
