"use server";

import { nanoid } from "nanoid";

import { actionClient } from "@/lib/next-safe-action";
import { db } from "@/db/index";
import { usersTable, jobUsersTable } from "@/db/schema";

import { createUserSchema } from "./schema";

export const createUserAction = actionClient
  .schema(createUserSchema)
  .action(async ({ parsedInput }) => {
    const id = nanoid();
    const now = new Date();

    await db.insert(usersTable).values({
      id,
      name: parsedInput.name,
      email: parsedInput.email,
      emailVerified: false,
      isActive: parsedInput.isActive,
      createdAt: now,
      updatedAt: now,
    });

    const jobUserId = nanoid();
    await db.insert(jobUsersTable).values({
      id: jobUserId,
      userId: id,
      jobId: parsedInput.jobId,
    });

    return { success: true, id };
  });
