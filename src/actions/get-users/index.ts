"use server";

import { desc, eq } from "drizzle-orm";

import { actionClient } from "@/lib/next-safe-action";
import { db } from "@/db/index";
import { usersTable, jobUsersTable, jobTable } from "@/db/schema";

import { getUsersSchema } from "./schema";

export const getUsersAction = actionClient
  .schema(getUsersSchema)
  .action(async () => {
    const users = await db
      .select({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        isActive: usersTable.isActive,
        createdAt: usersTable.createdAt,
        updatedAt: usersTable.updatedAt,
        jobId: jobUsersTable.jobId,
        jobNome: jobTable.nome,
      })
      .from(usersTable)
      .leftJoin(jobUsersTable, eq(usersTable.id, jobUsersTable.userId))
      .leftJoin(jobTable, eq(jobUsersTable.jobId, jobTable.id))
      .orderBy(desc(usersTable.createdAt));

    return { success: true, data: users };
  });
