"use server";

import { desc } from "drizzle-orm";

import { actionClient } from "@/lib/next-safe-action";
import { db } from "@/db/index";
import { jobTable } from "@/db/schema";

import { getJobsSchema } from "./schema";

export const getJobsAction = actionClient
  .schema(getJobsSchema)
  .action(async () => {
    const jobs = await db
      .select()
      .from(jobTable)
      .orderBy(desc(jobTable.createdAt));

    return { success: true, data: jobs };
  });
